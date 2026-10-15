import json
import logging
import asyncio
import os
from datetime import datetime
from typing import Dict, Set, Optional, Tuple
from fastapi import WebSocket, status
from jose import jwt
from app.core.config import settings

logger = logging.getLogger(__name__)

# JWT Details for validation
ALGORITHM = "HS256"

# Dynamic Redis Pub/Sub setup with fallback
REDIS_AVAILABLE = False
redis_client = None

try:
    import redis.asyncio as aioredis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_AVAILABLE = True
except Exception:
    pass

def make_serializable(obj):
    """Utility to convert models, dates, and enums to JSON safe types."""
    if not obj:
        return obj
    if hasattr(obj, "__table__"):
        obj_dict = {col.name: getattr(obj, col.name) for col in obj.__table__.columns}
    elif isinstance(obj, dict):
        obj_dict = obj.copy()
    else:
        obj_dict = obj
        
    if isinstance(obj_dict, dict):
        for k, v in list(obj_dict.items()):
            if isinstance(v, datetime):
                obj_dict[k] = v.isoformat()
            elif hasattr(v, "value"):  # Enum support
                obj_dict[k] = v.value
    return obj_dict

class WebSocketManager:
    def __init__(self):
        # Maps connection type -> userId -> Set of WebSockets
        self.alerts_connections: Dict[int, Set[WebSocket]] = {}
        self.notifications_connections: Dict[int, Set[WebSocket]] = {}
        self.approvals_connections: Dict[int, Set[WebSocket]] = {}
        self.dashboard_connections: Set[WebSocket] = set()

        # Connection metadata: websocket -> (user_id, role, department)
        self.connection_metadata: Dict[WebSocket, Tuple[int, str, Optional[str]]] = {}
        
        # Redis Pub/Sub task and client
        self.redis_client = None
        self.redis_sub_task: Optional[asyncio.Task] = None

    async def initialize_redis(self):
        """Initializes Redis and starts listening to channels if available."""
        global REDIS_AVAILABLE, redis_client
        if not REDIS_AVAILABLE:
            return
        
        try:
            self.redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
            # Ping to verify connection
            await self.redis_client.ping()
            logger.info("Connected to Redis for WebSocket Pub/Sub.")
            
            # Start subscription listener task
            self.redis_sub_task = asyncio.create_task(self._listen_redis_channels())
        except Exception as e:
            logger.warning(f"Failed to connect to Redis, falling back to in-memory mode: {e}")
            REDIS_AVAILABLE = False
            self.redis_client = None

    async def connect(self, websocket: WebSocket, conn_type: str, user_id: int, role: str, department: Optional[str]):
        """Accept connection and register client."""
        await websocket.accept()
        self.connection_metadata[websocket] = (user_id, role, department)

        if conn_type == "alerts":
            if user_id not in self.alerts_connections:
                self.alerts_connections[user_id] = set()
            self.alerts_connections[user_id].add(websocket)
            logger.info(f"User {user_id} connected to alerts WS (Role: {role}, Dept: {department})")
        elif conn_type == "notifications":
            if user_id not in self.notifications_connections:
                self.notifications_connections[user_id] = set()
            self.notifications_connections[user_id].add(websocket)
            logger.info(f"User {user_id} connected to notifications WS")
        elif conn_type == "approvals":
            if user_id not in self.approvals_connections:
                self.approvals_connections[user_id] = set()
            self.approvals_connections[user_id].add(websocket)
            logger.info(f"User {user_id} connected to approvals WS")
        elif conn_type == "dashboard":
            self.dashboard_connections.add(websocket)
            logger.info(f"User {user_id} connected to dashboard WS")

    def disconnect(self, websocket: WebSocket, conn_type: str, user_id: int):
        """Unregister client on disconnection."""
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]

        if conn_type == "alerts":
            if user_id in self.alerts_connections:
                self.alerts_connections[user_id].discard(websocket)
                if not self.alerts_connections[user_id]:
                    del self.alerts_connections[user_id]
        elif conn_type == "notifications":
            if user_id in self.notifications_connections:
                self.notifications_connections[user_id].discard(websocket)
                if not self.notifications_connections[user_id]:
                    del self.notifications_connections[user_id]
        elif conn_type == "approvals":
            if user_id in self.approvals_connections:
                self.approvals_connections[user_id].discard(websocket)
                if not self.approvals_connections[user_id]:
                    del self.approvals_connections[user_id]
        elif conn_type == "dashboard":
            self.dashboard_connections.discard(websocket)
        logger.info(f"User {user_id} disconnected from {conn_type} WS")

    async def broadcast_alert(self, alert: any):
        """Broadcast alert based on department & role routing."""
        alert_data = make_serializable(alert)
        message = {"event": "new_alert", "data": alert_data}

        if REDIS_AVAILABLE and self.redis_client:
            await self.redis_client.publish("alerts", json.dumps(message))
        else:
            await self._local_broadcast_alert(message)

    async def broadcast_notification(self, user_id: int, notification: any):
        """Send notification to specific user in real-time."""
        notif_data = make_serializable(notification)
        message = {"event": "new_notification", "data": notif_data}

        if REDIS_AVAILABLE and self.redis_client:
            # Publish to channel containing target user ID
            await self.redis_client.publish(f"notifications:{user_id}", json.dumps(message))
        else:
            await self._local_send_to_user("notifications", user_id, message)

    async def broadcast_approval_update(self, user_id: int, approval: any):
        """Send approval update to requester or reviewer."""
        appr_data = make_serializable(approval)
        message = {"event": "approval_update", "data": appr_data}

        if REDIS_AVAILABLE and self.redis_client:
            await self.redis_client.publish(f"approvals:{user_id}", json.dumps(message))
        else:
            await self._local_send_to_user("approvals", user_id, message)

    async def broadcast_dashboard_update(self):
        """Notify all dashboard clients to refresh their statistics."""
        message = {"event": "refresh_dashboard", "data": {}}

        if REDIS_AVAILABLE and self.redis_client:
            await self.redis_client.publish("dashboard", json.dumps(message))
        else:
            await self._local_broadcast_dashboard(message)

    # --- Local Broadcast Implementations (In-Memory Fallback) ---
    
    async def _local_broadcast_alert(self, message: dict):
        """Directly sends alerts to matching departments/roles locally."""
        alert_data = message.get("data", {})
        assigned_role = alert_data.get("assigned_role")
        department = alert_data.get("department")

        for user_id, sockets in list(self.alerts_connections.items()):
            for ws in list(sockets):
                u_id, u_role, u_dept = self.connection_metadata.get(ws, (None, None, None))
                
                # Check routing parameters (Super Admin always gets everything)
                role_match = (assigned_role is None or u_role == assigned_role)
                dept_match = (department is None or u_dept == department)

                if u_role == "SUPER_ADMIN" or (role_match and dept_match):
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass

    async def _local_send_to_user(self, conn_type: str, user_id: int, message: dict):
        """Directly sends messages to a specific connected user's WebSocket."""
        sockets = set()
        if conn_type == "notifications":
            sockets = self.notifications_connections.get(user_id, set())
        elif conn_type == "approvals":
            sockets = self.approvals_connections.get(user_id, set())
        elif conn_type == "alerts":
            sockets = self.alerts_connections.get(user_id, set())

        for ws in list(sockets):
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def send_event_to_user(self, conn_type: str, user_id: int, event: str, data: any):
        """Send custom event to a specific user via WebSockets/Redis."""
        message = {"event": event, "data": data}
        if REDIS_AVAILABLE and self.redis_client:
            await self.redis_client.publish(f"{conn_type}:{user_id}", json.dumps(message))
        else:
            await self._local_send_to_user(conn_type, user_id, message)

    async def _local_broadcast_dashboard(self, message: dict):
        """Sends refresh message to all connected dashboards."""
        for ws in list(self.dashboard_connections):
            try:
                await ws.send_json(message)
            except Exception:
                pass

    # --- Redis Channel Pub/Sub Listener ---
    
    async def _listen_redis_channels(self):
        """Task to listen to Redis channels and route them locally."""
        pubsub = self.redis_client.pubsub()
        # Subscribe to patterns or channels
        await pubsub.psubscribe("notifications:*", "approvals:*", "alerts", "alerts:*", "dashboard")
        
        try:
            async for raw_message in pubsub.listen():
                if raw_message["type"] != "pmessage":
                    continue
                
                channel = raw_message["channel"]
                pattern = raw_message["pattern"]
                data = json.loads(raw_message["data"])
                
                if channel == "alerts":
                    await self._local_broadcast_alert(data)
                elif channel.startswith("alerts:"):
                    user_id = int(channel.split(":")[1])
                    await self._local_send_to_user("alerts", user_id, data)
                elif channel == "dashboard":
                    await self._local_broadcast_dashboard(data)
                elif channel.startswith("notifications:"):
                    user_id = int(channel.split(":")[1])
                    await self._local_send_to_user("notifications", user_id, data)
                elif channel.startswith("approvals:"):
                    user_id = int(channel.split(":")[1])
                    await self._local_send_to_user("approvals", user_id, data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in Redis pubsub listener task: {e}")
        finally:
            await pubsub.unsubscribe()

# Global Singleton Manager
manager = WebSocketManager()
