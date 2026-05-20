import os
import tempfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_compress import compress_pdf

router = APIRouter()


class CompressRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    level: str = "medium"   # "low" | "medium" | "high"


@router.post("/compress")
def compress(req: CompressRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)

    import pathlib
    stem = pathlib.Path(req.input_path).stem
    output_path = os.path.join(out_dir, f"{stem}_compressed.pdf")

    try:
        result = compress_pdf(req.input_path, output_path, req.level)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
