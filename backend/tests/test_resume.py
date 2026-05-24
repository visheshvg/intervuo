import pytest


@pytest.mark.asyncio
async def test_upload_rejects_unauthenticated(client):
    res = await client.post(
        "/api/resume/upload",
        files={"file": ("resume.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_rejects_non_pdf(auth_client):
    res = await auth_client.post(
        "/api/resume/upload",
        files={"file": ("resume.docx", b"not a pdf", "application/octet-stream")},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_health_endpoint(client):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
