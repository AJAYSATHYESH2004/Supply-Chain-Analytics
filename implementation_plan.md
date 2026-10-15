# Intelligent Inventory Rebalancing Solution

Develop an intelligent inventory rebalancing system using a simulated dataset of states, depots, inter-depot distance mappings, stock availability, and stock movement history. The system will analyze inventory levels, demand patterns, and logistics constraints to identify optimal stock transfer opportunities between depots.

## User Review Required

> [!IMPORTANT]
> This plan focuses exclusively on the **Inventory Rebalancing** and **Alerting** scopes. Generic product cataloging, supplier management, and ad-hoc sales screens are removed or simplified to support the core rebalancing and alert workflows.

## Proposed Changes

---

### Database Schema (MySQL)

We define the database schema required to simulate states, depots, stock levels, transfer movements, and system-generated alerts.

#### [MODIFY] models.py
* Keep/create the following models:
  * `State`: `id`, `name`, `code`
  * `Depot`: `id`, `name`, `state_id`, `latitude`, `longitude`, `capacity`
  * `DepotDistance`: `id`, `origin_depot_id`, `destination_depot_id`, `distance_km`
  * `Stock`: `id`, `depot_id`, `product_id`, `quantity`, `safety_stock`, `reorder_level`
  * `StockMovementHistory`: `id`, `origin_depot_id`, `destination_depot_id`, `product_id`, `quantity`, `timestamp`, `type` (TRANSFER / PRODUCTION / DEMAND)
  * `RebalancingRecommendation`: `id`, `origin_depot_id`, `destination_depot_id`, `product_id`, `quantity`, `cost_savings`, `status` (PENDING / APPROVED / REJECTED)
  * `Alert`: `id`, `type` (CRITICAL_SHORTAGE / EXCESS_SURPLUS / SYSTEM), `priority` (HIGH / MEDIUM / LOW), `message`, `status` (UNREAD / READ), `created_at`

---

### Backend Development (FastAPI)

Implement services to calculate surplus/deficit levels, compute transport routes using distance mappings, recommend transfers, and automatically generate alerts for critical stock levels.

#### [MODIFY] rebalancing_service.py
* **Shortage & Surplus Analysis**: Evaluate `Stock` against `safety_stock` and forecasted demand.
* **Cost Optimization Algorithm**: 
  * Match deficit depots (under safety stock) with surplus depots (above safety stock).
  * Use `DepotDistance` to compute logistics costs and prioritize closer transfers.
  * Suggest a transfer route only if it reduces excess inventory and minimizes production triggers.
* **Production Fallback**: If total network surplus cannot satisfy a depot's deficit, recommend new production planning.

#### [MODIFY] rebalancing.py
* `POST /api/v1/rebalancing/run`: Triggers the optimization engine.
* `GET /api/v1/rebalancing/recommendations`: Retrieves active recommendations.
* `POST /api/v1/rebalancing/approve/{id}`: Approves a transfer, moving stock in the database and updating movement history.

#### [NEW] alerts.py
* `GET /api/v1/alerts`: Retrieves active alerts (e.g. Critical Shortages, Excess Inventory at specific depots).
* `POST /api/v1/alerts/{id}/read`: Marks an alert as read.
* **Alert Generation Logic**: When inventory drops below the critical threshold (e.g., 20% of safety stock), generate high-priority alerts.

---

### Frontend Development (React)

Create a dedicated control room using the existing UI, color tokens, and typography, integrating real-time alerts.

#### [MODIFY] Rebalancing.jsx
* **Rebalancing Dashboard**:
  * KPI widgets showing *Total Network Surplus*, *Total Net Deficit*, *Potential Cost Savings*, and *Avoided Production Run count*.
  * Interactive table/grid listing recommended transfers (Origin Depot, Destination Depot, Quantity, Distance, Cost Benefit, Action buttons).
* **Inter-Depot Cost Visualizations**:
  * Charts showing transport cost comparisons (AI Optimized vs. Ad-hoc/Traditional shipping).
* **Depot Stock Heatmap / Map view**:
  * Visual representation of depots across states showing stock health (Red: Deficit, Green: Surplus).
* **Alert Center Panel / Toast Notifications**:
  * Real-time UI notification center / toast messages displaying generated alerts (e.g., "Critical Shortage at Depot A (State X)").

---

## Verification Plan

### Automated Tests
- Run backend unit tests to verify the optimization matching logic and alert creation triggers:
  ```bash
  pytest backend/tests/test_rebalancing.py backend/tests/test_alerts.py
  ```

### Manual Verification
1. Open the rebalancing panel.
2. Click **Run AI Rebalancing Engine**.
3. Confirm that transfer recommendations list the correct origin/destination depots, distance savings, and cost benefits.
4. Verify that critical stock drops trigger real-time alert toast notifications and populate the Alert Center panel.
5. Approve a recommendation and verify that stock is updated and the respective shortage alerts are marked as resolved/read.
