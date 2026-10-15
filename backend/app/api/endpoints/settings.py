from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models import models
from app.core import security

router = APIRouter()

class SettingsUpdate(BaseModel):
    opt1: bool
    textAlignment: bool
    opt2: bool
    deleteItems: bool

@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD))
):
    # Fetch settings for default user (assuming ID 1 for now)
    user_id = 1
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    
    if not settings:
        settings = models.UserSettings(
            user_id=user_id,
            primary_setting_1=0,
            auto_text_alignment=1,
            secondary_setting_1=0,
            auto_delete_items=0
        )
        try:
            db.add(settings)
            db.commit()
            db.refresh(settings)
        except Exception:
            db.rollback()
            pass
            
    return {
        "opt1": bool(settings.primary_setting_1),
        "textAlignment": bool(settings.auto_text_alignment),
        "opt2": bool(settings.secondary_setting_1),
        "deleteItems": bool(settings.auto_delete_items)
    }

@router.post("/")
def update_settings(
    settings_data: SettingsUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD))
):
    user_id = 1
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    
    if not settings:
        settings = models.UserSettings(user_id=user_id)
        db.add(settings)
        
    settings.primary_setting_1 = 1 if settings_data.opt1 else 0
    settings.auto_text_alignment = 1 if settings_data.textAlignment else 0
    settings.secondary_setting_1 = 1 if settings_data.opt2 else 0
    settings.auto_delete_items = 1 if settings_data.deleteItems else 0
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Settings updated successfully"}
