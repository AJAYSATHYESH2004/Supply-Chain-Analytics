def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Smart Supply Chain AI API"}

def test_api_v1_docs(client):
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
