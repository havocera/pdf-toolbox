import os
import tempfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_merge import merge_pdfs

router = APIRouter()


class MergeRequest(BaseModel):
    input_paths: list[str]
    output_dir: str | None = None


@router.post("/merge")
def merge(req: MergeRequest):
    if len(req.input_paths) < 2:
        raise HTTPException(status_code=400, detail="需要至少两个 PDF 文件")
    for p in req.input_paths:
        if not os.path.isfile(p):
            raise HTTPException(status_code=400, detail=f"文件不存在: {p}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    output_path = os.path.join(out_dir, "merged.pdf")

    try:
        result = merge_pdfs(req.input_paths, output_path)
        return {"output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
