# PDF 工具箱

一款免费、离线、快速的 PDF 桌面处理工具。

## 功能特性

- 🔗 **合并 PDF** - 将多个 PDF 合并为一个文件
- ✂️ **拆分 PDF** - 按页范围或逐页拆分 PDF
- 🗜️ **压缩 PDF** - 减小文件体积，保留质量
- 📝 **PDF 转 Word** - 转换为可编辑的 .docx 文件
- 🖼️ **PDF 转图片** - 每页导出为 JPG 或 PNG
- 🔄 **旋转页面** - 旋转或重新排列 PDF 页面

## 技术栈

- **前端**: Electron + React + TypeScript + Tailwind CSS
- **后端**: Python + FastAPI + PyMuPDF
- **打包**: electron-builder + PyInstaller

## 开发环境

### 前置要求

- Node.js 20+
- Python 3.14+
- Windows 10+ (其他平台需调整 Python 字体路径)

### 安装依赖

```bash
# Node.js 依赖
npm install

# Python 依赖
python -m venv .venv
.venv\Scripts\activate
pip install -r python/requirements.txt
```

### 开发运行

```bash
# 方式一：使用启动脚本
start-dev.bat

# 方式二：手动启动
# 终端 1 - Python 后端
.venv\Scripts\python python/main.py --port 18765

# 终端 2 - Electron + React
npm run dev
```

### 打包发布

```bash
# 1. 打包 Python 后端
cd python
../.venv/Scripts/pyinstaller --onedir --name pdf_backend \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.loops.auto \
  --hidden-import uvicorn.protocols.http.auto \
  --hidden-import uvicorn.lifespan.on \
  --collect-all pdf2docx \
  --collect-all fitz \
  main.py

# 2. 复制到打包目录
mkdir -p ../python-dist
cp -r dist/pdf_backend ../python-dist/

# 3. 打包 Electron
cd ..
npm run dist
```

生成的安装包位于 `dist-app/PDF工具箱 Setup 1.0.0.exe`

## 项目结构

```
pdf/
├── electron/           # Electron 主进程
│   ├── main.ts        # 窗口创建、Python 管理
│   ├── preload.ts     # IPC 桥接
│   └── ipc/           # IPC 处理器
├── src/               # React 前端
│   ├── pages/         # 功能页面
│   └── components/    # 通用组件
├── python/            # Python 后端
│   ├── main.py        # FastAPI 入口
│   ├── routers/       # API 路由
│   └── services/      # PDF 处理逻辑
└── resources/         # 打包资源
    ├── icon.ico       # 应用图标
    └── poppler/       # PDF 转图片依赖
```

## 注意事项

### PDF 转图片功能

需要下载 [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases)，解压后将 `Library/bin/` 里的所有文件复制到 `resources/poppler/bin/`。

### 中文字体

编辑 PDF 时如果包含中文，需要确保系统存在以下字体之一：
- Windows: `C:/Windows/Fonts/simhei.ttf` 或 `msyh.ttc`
- macOS: `/System/Library/Fonts/PingFang.ttc`
- Linux: `/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc`

## 许可证

MIT License

## 支持作者

如果这个工具对你有帮助，欢迎请作者喝杯咖啡 ☕

[❤️ 爱发电支持](https://ifdian.net/a/ihavoc)
