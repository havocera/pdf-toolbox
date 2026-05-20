import os
import tempfile
import pathlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.pdf_edit import (
    render_page, extract_images, extract_text, add_text, insert_image_on_page,
    get_page_blocks, apply_edits,
)

router = APIRouter()


class RenderPageRequest(BaseModel):
    input_path: str
    page_index: int = 0


class ExtractImagesRequest(BaseModel):
    input_path: str
    output_dir: str | None = None


class ExtractTextRequest(BaseModel):
    input_path: str


class AddTextRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    page_index: int = 0
    x: float
    y: float
    text: str
    font_size: float = 12
    color_hex: str = "#000000"


class InsertImageRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    page_index: int = 0
    x0: float
    y0: float
    x1: float
    y1: float
    image_path: str


@router.post("/edit/render-page")
def api_render_page(req: RenderPageRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    try:
        return render_page(req.input_path, req.page_index)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit/extract-images")
def api_extract_images(req: ExtractImagesRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    try:
        return {"images": extract_images(req.input_path, out_dir)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit/extract-text")
def api_extract_text(req: ExtractTextRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    try:
        return extract_text(req.input_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit/add-text")
def api_add_text(req: AddTextRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    stem = pathlib.Path(req.input_path).stem
    output_path = os.path.join(out_dir, f"{stem}_edited.pdf")
    try:
        result = add_text(
            req.input_path, output_path, req.page_index,
            req.x, req.y, req.text, req.font_size, req.color_hex,
        )
        return {"output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit/insert-image")
def api_insert_image(req: InsertImageRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    if not os.path.isfile(req.image_path):
        raise HTTPException(status_code=400, detail=f"图片不存在: {req.image_path}")
    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    stem = pathlib.Path(req.input_path).stem
    output_path = os.path.join(out_dir, f"{stem}_stamped.pdf")
    try:
        result = insert_image_on_page(
            req.input_path, output_path, req.page_index,
            req.x0, req.y0, req.x1, req.y1, req.image_path,
        )
        return {"output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GetPageBlocksRequest(BaseModel):
    input_path: str
    page_index: int = 0


class EditItem(BaseModel):
    block_id: str
    original_bbox: list[float]
    new_text: str
    font_size: float = 12
    color_hex: str = "#000000"
    bold: bool = False
    italic: bool = False


class ApplyEditsRequest(BaseModel):
    input_path: str
    output_dir: str | None = None
    page_index: int = 0
    edits: list[EditItem]


@router.post("/edit/page-blocks")
def api_get_page_blocks(req: GetPageBlocksRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    try:
        return get_page_blocks(req.input_path, req.page_index)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit/apply-edits")
def api_apply_edits(req: ApplyEditsRequest):
    if not os.path.isfile(req.input_path):
        raise HTTPException(status_code=400, detail=f"文件不存在: {req.input_path}")
    out_dir = req.output_dir or tempfile.gettempdir()
    os.makedirs(out_dir, exist_ok=True)
    stem = pathlib.Path(req.input_path).stem
    output_path = os.path.join(out_dir, f"{stem}_edited.pdf")
    try:
        edits = [e.model_dump() for e in req.edits]
        result = apply_edits(req.input_path, output_path, req.page_index, edits)
        return {"output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
