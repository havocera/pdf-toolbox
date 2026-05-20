import argparse
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import merge, split, compress, convert, rotate, edit

app = FastAPI(title="PDF Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merge.router,    prefix="/api")
app.include_router(split.router,    prefix="/api")
app.include_router(compress.router, prefix="/api")
app.include_router(convert.router,  prefix="/api")
app.include_router(rotate.router,   prefix="/api")
app.include_router(edit.router,     prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=18765)
    args = parser.parse_args()
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")
