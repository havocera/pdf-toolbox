import base64
import os
import platform
import tempfile
from pathlib import Path
import fitz  # PyMuPDF

RENDER_SCALE = 1.5


def render_page(input_path: str, page_index: int) -> dict:
    doc = fitz.open(input_path)
    page = doc[page_index]
    mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)
    pix = page.get_pixmap(matrix=mat)
    img_b64 = base64.b64encode(pix.tobytes("png")).decode()
    return {
        "image": img_b64,
        "pdf_width": page.rect.width,
        "pdf_height": page.rect.height,
        "page_count": len(doc),
    }


def extract_images(input_path: str, output_dir: str) -> list[dict]:
    doc = fitz.open(input_path)
    results = []
    seen_xrefs: set[int] = set()

    for page_idx, page in enumerate(doc):
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]
            ext = base_image["ext"]

            out_path = str(Path(output_dir) / f"image_{xref}.{ext}")
            with open(out_path, "wb") as f:
                f.write(img_bytes)

            results.append({
                "path": out_path,
                "ext": ext,
                "width": base_image.get("width", 0),
                "height": base_image.get("height", 0),
                "page": page_idx,
                "thumbnail": base64.b64encode(img_bytes).decode(),
            })

    return results


def extract_text(input_path: str) -> dict:
    doc = fitz.open(input_path)
    pages = [page.get_text() for page in doc]
    return {
        "pages": pages,
        "full_text": "\n\n--- 下一页 ---\n\n".join(pages),
        "page_count": len(doc),
    }


def add_text(
    input_path: str,
    output_path: str,
    page_index: int,
    x: float,
    y: float,
    text: str,
    font_size: float = 12,
    color_hex: str = "#000000",
) -> str:
    def hex_to_rgb(h: str):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))

    doc = fitz.open(input_path)
    page = doc[page_index]
    page.insert_text(
        fitz.Point(x, y),
        text,
        fontsize=font_size,
        color=hex_to_rgb(color_hex),
    )
    doc.save(output_path)
    return output_path


def insert_image_on_page(
    input_path: str,
    output_path: str,
    page_index: int,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    image_path: str,
) -> str:
    doc = fitz.open(input_path)
    page = doc[page_index]
    page.insert_image(fitz.Rect(x0, y0, x1, y1), filename=image_path)
    doc.save(output_path)
    return output_path


def _hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


def _find_cjk_font() -> str | None:
    candidates: list[str] = []
    if platform.system() == "Windows":
        candidates = [
            "C:/Windows/Fonts/simhei.ttf",
            "C:/Windows/Fonts/msyh.ttc",
            "C:/Windows/Fonts/simsun.ttc",
        ]
    elif platform.system() == "Darwin":
        candidates = [
            "/System/Library/Fonts/PingFang.ttc",
            "/Library/Fonts/Arial Unicode MS.ttf",
        ]
    else:
        candidates = [
            "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        ]
    return next((p for p in candidates if os.path.isfile(p)), None)


def get_page_blocks(input_path: str, page_index: int) -> dict:
    doc = fitz.open(input_path)
    page = doc[page_index]
    raw = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)

    text_blocks = []
    image_blocks = []

    for block in raw["blocks"]:
        if block["type"] == 0:
            spans = []
            for line in block["lines"]:
                for span in line["spans"]:
                    c = span["color"]
                    r, g, b = (c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF
                    spans.append({
                        "text": span["text"],
                        "bbox": list(span["bbox"]),
                        "font": span["font"],
                        "size": round(span["size"], 1),
                        "color_hex": f"#{r:02x}{g:02x}{b:02x}",
                        "bold": bool(span["flags"] & 16),
                        "italic": bool(span["flags"] & 2),
                    })
            if spans:
                text_blocks.append({
                    "id": f"tb_{len(text_blocks)}",
                    "bbox": list(block["bbox"]),
                    "spans": spans,
                })
        elif block["type"] == 1:
            image_blocks.append({
                "id": f"ib_{len(image_blocks)}",
                "bbox": list(block["bbox"]),
            })

    return {
        "text_blocks": text_blocks,
        "image_blocks": image_blocks,
        "pdf_width": page.rect.width,
        "pdf_height": page.rect.height,
    }


def apply_edits(input_path: str, output_path: str, page_index: int, edits: list[dict]) -> str:
    cjk_font = _find_cjk_font()
    doc = fitz.open(input_path)
    page = doc[page_index]

    for edit in edits:
        bbox = fitz.Rect(edit["original_bbox"])
        new_text = edit["new_text"]
        font_size = float(edit.get("font_size", 12))
        color = _hex_to_rgb(edit.get("color_hex", "#000000"))

        # Cover original text with white rectangle
        page.draw_rect(bbox, color=(1, 1, 1), fill=(1, 1, 1))

        # Choose font: CJK if needed
        needs_cjk = any(ord(c) > 127 for c in new_text)
        if needs_cjk and cjk_font:
            fontname, fontfile = "cjkfont", cjk_font
        else:
            fontname, fontfile = "helv", None

        page.insert_text(
            fitz.Point(bbox.x0, bbox.y1 - 1),
            new_text,
            fontsize=font_size,
            color=color,
            fontname=fontname,
            fontfile=fontfile,
        )

    doc.save(output_path, garbage=4, deflate=True)
    return output_path
