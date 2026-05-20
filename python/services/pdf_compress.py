import os
from pypdf import PdfWriter, PdfReader
from pypdf.generic import NameObject, NumberObject


def compress_pdf(input_path: str, output_path: str, level: str = "medium") -> dict:
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        if level in ("medium", "high"):
            page.compress_content_streams()
        writer.add_page(page)

    # Remove duplicate objects to reduce size
    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)

    with open(output_path, "wb") as f:
        writer.write(f)

    original_size = os.path.getsize(input_path)
    compressed_size = os.path.getsize(output_path)
    ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0
    return {
        "output": output_path,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "ratio": ratio,
    }
