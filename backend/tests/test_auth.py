import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    res = await client.post("/api/auth/register", json={
        "email": "new@example.com",
        "name": "New User",
        "password": "securepass123",
    })
    assert res.status_code == 201
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "name": "A", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "login@example.com", "name": "L", "password": "correct"
    })
    res = await client.post("/api/auth/login", json={
        "email": "login@example.com", "password": "wrong"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_with_auth(auth_client):
    res = await auth_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "testuser@example.com"
