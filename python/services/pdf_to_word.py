from pdf2docx import Converter


def pdf_to_word(input_path: str, output_path: str) -> str:
    cv = Converter(input_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()
    return output_path
