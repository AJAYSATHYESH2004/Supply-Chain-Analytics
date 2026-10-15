def test_state_intelligence(client):
    """Test the state-wise demand intelligence aggregation endpoint."""
    response = client.get("/api/v1/forecasting/state-intelligence")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        item = data[0]
        assert "state_name" in item
        assert "total_demand" in item
        assert "total_inventory" in item
        assert "forecasted_demand" in item
        assert "surplus" in item
        assert "deficit" in item
        assert "risk_level" in item
        assert "recommended_transfers" in item
        assert "growth_pct" in item

def test_insights(client):
    """Test the dynamic demand insights endpoint."""
    response = client.get("/api/v1/forecasting/insights")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(isinstance(insight, str) for insight in data)

def test_train_models(client):
    """Test the machine learning retraining trigger endpoint."""
    response = client.post("/api/v1/forecasting/train-models")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "forecasts_updated" in data
    assert "models_trained" in data
