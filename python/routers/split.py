import os
import tempfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_split import split_pdf, split_by_every_page

router = APIRouter()


class SplitRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    mode: str = "ranges"          # "ranges" | "every_page"
    ranges: list[list[int]] | None = None   # [[0,2],[3,5]]


@router.post("/split")
def split(req: SplitRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")

    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)

    try:
        if req.mode == "every_page":
            results = split_by_every_page(req.input_path, out_dir)
        else:
            if not req.ranges:
                raise HTTPException(status_code=400, detail="ranges 模式需要提供 ranges 参数")
            ranges = [tuple(r) for r in req.ranges]
            results = split_pdf(req.input_path, out_dir, ranges)
        return {"outputs": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
