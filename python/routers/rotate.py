import os
import tempfile
import pathlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_rotate import rotate_pages, reorder_pages

router = APIRouter()


class RotateRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    mode: str = "rotate"          # "rotate" | "reorder"
    rotations: dict | None = None  # {page_index: degrees} or {"all": degrees}
    new_order: list[int] | None = None


@router.post("/rotate")
def rotate(req: RotateRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    stem = pathlib.Path(req.input_path).stem

    try:
        if req.mode == "reorder":
            if not req.new_order:
                raise HTTPException(status_code=400, detail="reorder 模式需要 new_order 参数")
            output_path = os.path.join(out_dir, f"{stem}_reordered.pdf")
            result = reorder_pages(req.input_path, output_path, req.new_order)
        else:
            if not req.rotations:
                raise HTTPException(status_code=400, detail="rotate 模式需要 rotations 参数")
            output_path = os.path.join(out_dir, f"{stem}_rotated.pdf")

            # Support {"all": degrees} shorthand
            if "all" in req.rotations:
                from pypdf import PdfReader
                page_count = len(PdfReader(req.input_path).pages)
                rotations = {i: req.rotations["all"] for i in range(page_count)}
            else:
                rotations = {int(k): v for k, v in req.rotations.items()}

            result = rotate_pages(req.input_path, output_path, rotations)

        return {"output": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
