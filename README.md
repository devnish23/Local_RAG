# GPT-OSS Phase 1

A self-hosted Retrieval-Augmented Generation (RAG) system that enables you to upload documents, extract knowledge, and chat with an AI that can reference your uploaded content for accurate responses.

## 🚀 Features

- **Document Ingestion**: Support for multiple file formats (PDF, DOCX, PPTX, CSV, XLSX, XLS, TXT)
- **Vector Search**: Advanced document retrieval using semantic similarity
- **Chat Interface**: Interactive chat with AI that references your documents
- **Local AI Models**: Powered by Ollama for privacy and offline operation
- **Web Scraping**: Ingest content from URLs and SharePoint
- **Configurable**: Adjustable chunk sizes, overlap, and batch processing
- **Docker Ready**: Easy deployment with Docker Compose

## 🏗️ Architecture

The system consists of four main services:

- **Ollama**: Local LLM service for text generation and embeddings
- **Qdrant**: Vector database for storing document embeddings
- **RAG API**: FastAPI backend for document processing and retrieval
- **UI**: Express.js frontend with chat interface and admin panel

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     UI      │    │  RAG API    │    │   Ollama    │
│   (3000)    │◄──►│   (9000)    │◄──►│   (11435)   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │   Qdrant    │
                   │   (6333)    │
                   └─────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose
- At least 8GB RAM (16GB recommended)
- 10GB+ free disk space

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gpt-oss-phase1
   ```

2. **Start the services**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application**
   - **Chat Interface**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin.html
   - **RAG API**: http://localhost:9000
   - **Ollama**: http://localhost:11435
   - **Qdrant**: http://localhost:6333

## ⚙️ Configuration

### Environment Variables

The system can be configured through environment variables in `docker-compose.dev.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBED_MODEL` | `nomic-embed-text:latest` | Model for generating embeddings |
| `GEN_MODEL` | `llama3.1:8b` | Model for text generation |
| `CHUNK_SIZE` | `800` | Size of text chunks for processing |
| `CHUNK_OVERLAP` | `120` | Overlap between chunks |
| `EMBED_BATCH` | `32` | Batch size for embedding generation |
| `UPSERT_BATCH` | `256` | Batch size for database operations |

### Runtime Configuration

You can adjust settings at runtime via the RAG API:

```bash
# Update configuration
curl -X POST http://localhost:9000/config \
  -H "Content-Type: application/json" \
  -d '{"CHUNK_SIZE": 1000, "CHUNK_OVERLAP": 200}'

# View current configuration
curl http://localhost:9000/config
```

## 📚 Usage

### 1. Upload Documents

Use the admin panel at `/admin.html` to:
- Upload files directly
- Ingest content from URLs
- Connect to SharePoint

### 2. Chat with Documents

Access the chat interface at the root URL to:
- Ask questions about your uploaded content
- Get AI responses with document references
- View source documents for responses

### 3. API Endpoints

#### Document Ingestion
```bash
# Upload files
curl -X POST http://localhost:9000/ingest \
  -F "files=@document.pdf" \
  -F "project=my_project"

# Ingest from URLs
curl -X POST http://localhost:9000/ingest_urls \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"], "project": "my_project"}'
```

#### Chat/Query
```bash
# Ask questions
curl -X POST http://localhost:9000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?", "project": "my_project"}'
```

## 🔧 Development

### Local Development

1. **Install Python dependencies**
   ```bash
   cd rag-api
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies**
   ```bash
   cd ui
   npm install
   ```

3. **Set environment variables**
   ```bash
   export OLLAMA_BASE_URL=http://localhost:11434
   export QDRANT_URL=http://localhost:6333
   ```

4. **Run services individually**
   ```bash
   # Terminal 1: RAG API
   cd rag-api && python main.py
   
   # Terminal 2: UI
   cd ui && npm start
   ```

### Adding New File Types

To support additional file formats, extend the `extract_text` function in `rag-api/main.py`:

```python
def extract_text_from_new_format(b: bytes) -> str:
    # Your extraction logic here
    return extracted_text

# Add to the extract_text function
def extract_text(filename: str, content_type: str, b: bytes) -> str:
    # ... existing code ...
    elif content_type == "application/new-format":
        return extract_text_from_new_format(b)
```

## 🐛 Troubleshooting

### Common Issues

1. **Out of Memory Errors**
   - Reduce `EMBED_BATCH` and `UPSERT_BATCH` values
   - Use smaller models in Ollama
   - Increase system RAM

2. **Slow Processing**
   - Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP`
   - Increase batch sizes if memory allows
   - Use faster embedding models

3. **Service Connection Issues**
   - Check if all containers are running: `docker-compose ps`
   - View logs: `docker-compose logs <service-name>`
   - Ensure ports aren't blocked by firewall

### Logs

```bash
# View all service logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f rag-api
docker-compose -f docker-compose.dev.yml logs -f ui
```

## 📁 Project Structure

```
gpt-oss-phase1/
├── docker-compose.dev.yml    # Development environment setup
├── rag-api/                  # FastAPI RAG backend
│   ├── main.py              # Main application logic
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Container configuration
├── ui/                      # Express.js frontend
│   ├── server.js           # Express server
│   ├── package.json        # Node.js dependencies
│   ├── Dockerfile          # Container configuration
│   └── public/             # Static HTML files
│       ├── index.html      # Chat interface
│       └── admin.html      # Admin panel
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM capabilities
- [Qdrant](https://qdrant.tech/) for vector database
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [Express.js](https://expressjs.com/) for the frontend server

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the logs for error details
