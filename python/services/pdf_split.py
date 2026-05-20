from pathlib import Path
from pypdf import PdfWriter, PdfReader


def split_pdf(input_path: str, output_dir: str, ranges: list[tuple[int, int]]) -> list[str]:
    """ranges: [(0, 2), (3, 5)] — 0-based page indices, inclusive."""
    reader = PdfReader(input_path)
    stem = Path(input_path).stem
    results = []
    for i, (start, end) in enumerate(ranges):
        writer = PdfWriter()
        for page in reader.pages[start : end + 1]:
            writer.add_page(page)
        out_path = str(Path(output_dir) / f"{stem}_part{i + 1}.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        results.append(out_path)
    return results


def split_by_every_page(input_path: str, output_dir: str) -> list[str]:
    reader = PdfReader(input_path)
    stem = Path(input_path).stem
    results = []
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        out_path = str(Path(output_dir) / f"{stem}_page{i + 1}.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        results.append(out_path)
    return results
