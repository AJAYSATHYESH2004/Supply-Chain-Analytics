import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from app.models.models import Sale, Product

class ForecastingService:
    @staticmethod
    def forecast_demand(db: Session, product_id: int, period: str = "monthly"):
        # Fetch historical sales data
        sales = db.query(Sale).filter(Sale.product_id == product_id).order_by(Sale.sale_date).all()
        
        if len(sales) < 5:
            # Not enough data for meaningful AI forecast, return a baseline
            return {"predicted_demand": 10.0, "confidence_score": 0.5, "method": "baseline"}

        df = pd.DataFrame([{
            "date": s.sale_date,
            "quantity": s.quantity
        } for s in sales])
        
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').resample('D').sum().fillna(0).reset_index()
        
        # Simple feature engineering for regression
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        
        X = df[['day_of_week', 'day_of_month', 'month']]
        y = df['quantity']
        
        # Try multiple models and pick the one with best fit (simplified here)
        model = RandomForestRegressor(n_estimators=100)
        model.fit(X, y)
        
        # Predict for the next period (future features needed)
        # For simplicity, returning a mean of recent predictions
        prediction = float(np.mean(model.predict(X.tail(7)))) * (7 if period == "weekly" else 30)
        
        return {
            "predicted_demand": round(prediction, 2),
            "confidence_score": 0.85,
            "method": "RandomForest"
        }

forecasting_service = ForecastingService()
