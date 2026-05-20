from pypdf import PdfWriter, PdfReader


def merge_pdfs(input_paths: list[str], output_path: str) -> str:
    writer = PdfWriter()
    for p in input_paths:
        reader = PdfReader(p)
        for page in reader.pages:
            writer.add_page(page)
    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path
