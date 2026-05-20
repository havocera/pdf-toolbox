from pypdf import PdfWriter, PdfReader


def rotate_pages(input_path: str, output_path: str, rotations: dict[int, int]) -> str:
    """rotations: {page_index: degrees} — degrees must be 90, 180, or 270."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i in rotations:
            page.rotate(rotations[i])
        writer.add_page(page)
    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def reorder_pages(input_path: str, output_path: str, new_order: list[int]) -> str:
    """new_order: [2, 0, 1] — new page sequence (0-based indices)."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for idx in new_order:
        writer.add_page(reader.pages[idx])
    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path
