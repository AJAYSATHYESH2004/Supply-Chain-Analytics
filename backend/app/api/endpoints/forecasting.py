from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.services.ai_engine import AIService
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/demand/{product_id}")
def get_ai_demand_prediction(product_id: int, db: Session = Depends(get_db)):
    """Predict future demand for a product using AI engine"""
    try:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        predicted_qty, confidence = AIService.predict_demand(db, product_id)
        return {
            "product_id": product_id,
            "predicted_demand": predicted_qty,
            "confidence_score": confidence,
            "period": "NEXT_30_DAYS"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Demand prediction error for product {product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Demand prediction failed: {str(e)}")

@router.get("/recommendations")
def get_all_reorder_recommendations(db: Session = Depends(get_db)):
    """Get AI reorder recommendations for all products"""
    try:
        products = db.query(models.Product).all()
        recommendations = []
        for p in products:
            try:
                rec = AIService.get_reorder_recommendation(db, p.id)
                if rec and rec.get('status') == "RECOMMENDED":
                    rec['product_name'] = p.name
                    recommendations.append(rec)
            except Exception as e:
                logger.warning(f"Reorder rec error for product {p.id}: {e}")
        return recommendations
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reorder recommendations error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recommendations unavailable: {str(e)}")

@router.get("/risks")
def get_inventory_risks(db: Session = Depends(get_db)):
    """AI-detected inventory risks (stockouts, overstock, etc.)"""
    try:
        return AIService.detect_risks(db)
    except Exception as e:
        logger.error(f"Risk detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Risk detection failed: {str(e)}")

@router.get("/")
def get_forecasts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        forecasts = db.query(models.Forecast).offset(skip).limit(limit).all()
        return forecasts
    except Exception as e:
        logger.error(f"Get forecasts error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecasts unavailable: {str(e)}")

@router.get("/state-intelligence")
def get_state_demand_intelligence(db: Session = Depends(get_db)):
    """Retrieve aggregated state-wise demand intelligence metrics."""
    try:
        return AIService.get_state_demand_intelligence(db)
    except Exception as e:
        logger.error(f"State intelligence error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"State intelligence unavailable: {str(e)}")

@router.get("/insights")
def get_demand_insights(db: Session = Depends(get_db)):
    """Retrieve dynamic natural language demand insights."""
    try:
        return AIService.get_demand_insights(db)
    except Exception as e:
        logger.error(f"Demand insights error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Demand insights unavailable: {str(e)}")

@router.post("/train-models")
def train_demand_models(db: Session = Depends(get_db)):
    """Trigger the machine learning training pipeline to regenerate demand forecasts."""
    try:
        result = AIService.train_and_forecast_demand_ml(db)
        return result
    except Exception as e:
        logger.error(f"Model training error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")
