import os
import tempfile
import pathlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_to_word import pdf_to_word
from services.pdf_to_image import pdf_to_images

router = APIRouter()


class ConvertWordRequest(BaseModel):
    input_path: str
    output_dir: str | None = None


class ConvertImageRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    fmt: str = "jpeg"   # "jpeg" | "png"
    dpi: int = 150


@router.post("/convert/word")
def to_word(req: ConvertWordRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    stem = pathlib.Path(req.input_path).stem
    output_path = os.path.join(out_dir, f"{stem}.docx")

    try:
        result = pdf_to_word(req.input_path, output_path)
        return {"output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/image")
def to_image(req: ConvertImageRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)

    try:
        results = pdf_to_images(req.input_path, out_dir, req.fmt, req.dpi)
        return {"outputs": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
