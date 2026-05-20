import os
from pathlib import Path
from pdf2image import convert_from_path


def pdf_to_images(
    input_path: str,
    output_dir: str,
    fmt: str = "jpeg",
    dpi: int = 150,
) -> list[str]:
    poppler_path = _get_poppler_path()
    pages = convert_from_path(
        input_path,
        dpi=dpi,
        fmt=fmt,
        poppler_path=poppler_path,
    )
    stem = Path(input_path).stem
    ext = "jpg" if fmt == "jpeg" else fmt
    results = []
    for i, page in enumerate(pages):
        out_path = str(Path(output_dir) / f"{stem}_page{i + 1}.{ext}")
        page.save(out_path, fmt.upper())
        results.append(out_path)
    return results


def _get_poppler_path() -> str | None:
    # 打包后从 RESOURCES_PATH 环境变量读取
    base = os.environ.get("RESOURCES_PATH", "")
    candidate = os.path.join(base, "poppler", "bin")
    if os.path.isdir(candidate):
        return candidate
    # 开发时尝试项目内 resources/poppler/bin
    dev_candidate = os.path.join(
        os.path.dirname(__file__), "..", "..", "resources", "poppler", "bin"
    )
    dev_candidate = os.path.normpath(dev_candidate)
    return dev_candidate if os.path.isdir(dev_candidate) else None
