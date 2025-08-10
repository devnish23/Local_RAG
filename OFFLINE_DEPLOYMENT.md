# 🚀 Offline RAG System Deployment Guide

This guide provides complete instructions for deploying the RAG system in offline environments using Docker Hub images.

## 📋 Prerequisites

- Docker and Docker Compose installed on the target system
- Internet access on the build system (for initial image pull)
- Sufficient disk space (~3GB for images + models)

## 🐳 Docker Images Available

All images are available on Docker Hub under the `devaraj13` organization:

| Service | Image | Size | Description |
|---------|-------|------|-------------|
| **RAG API** | `devaraj13/rag-api:latest` | ~694MB | FastAPI backend for RAG operations |
| **UI** | `devaraj13/rag-ui:latest` | ~142MB | Express.js frontend interface |
| **Ollama** | `devaraj13/ollama:latest` | ~2.28GB | Local LLM service with models |
| **Qdrant** | `devaraj13/qdrant:latest` | ~198MB | Vector database for embeddings |

## 🔗 Docker Hub Links

- **RAG API**: https://hub.docker.com/r/devaraj13/rag-api
- **UI**: https://hub.docker.com/r/devaraj13/rag-ui  
- **Ollama**: https://hub.docker.com/r/devaraj13/ollama
- **Qdrant**: https://hub.docker.com/r/devaraj13/qdrant

## 📥 Step 1: Pull Images (Internet Required)

On a system with internet access, pull all required images:

```bash
# Pull all images
docker pull devaraj13/rag-api:latest
docker pull devaraj13/rag-ui:latest
docker pull devaraj13/ollama:latest
docker pull devaraj13/qdrant:latest

# Verify images
docker images | grep devaraj13
```

## 💾 Step 2: Save Images as Tar Files

```bash
# Create tar files for offline transfer
docker save devaraj13/rag-api:latest -o rag-api.tar
docker save devaraj13/rag-ui:latest -o rag-ui.tar
docker save devaraj13/ollama:latest -o ollama.tar
docker save devaraj13/qdrant:latest -o qdrant.tar

# Verify tar files
ls -lh *.tar
```

## 🚚 Step 3: Transfer to Offline System

Transfer the following files to your offline system:
- `rag-api.tar`
- `rag-ui.tar` 
- `ollama.tar`
- `qdrant.tar`
- `docker-compose.offline.yml`
- `OFFLINE_DEPLOYMENT.md`

## 🔄 Step 4: Load Images on Offline System

```bash
# Load all images
docker load -i rag-api.tar
docker load -i rag-ui.tar
docker load -i ollama.tar
docker load -i qdrant.tar

# Verify loaded images
docker images | grep devaraj13
```

## 🚀 Step 5: Start the System

```bash
# Start all services
docker-compose -f docker-compose.offline.yml up -d

# Check status
docker-compose -f docker-compose.offline.yml ps

# View logs
docker-compose -f docker-compose.offline.yml logs -f
```

## 📊 Step 6: Verify System Health

```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:9000/health
curl http://localhost:11435/api/tags
curl http://localhost:6333/health

# Expected responses:
# UI: {"ok":true,"model":"llama3.1:8b","fallback":"llama3.1:8b","base":"http://ollama:11434","rag":"http://localhost:9000"}
# RAG API: {"ok":true,"status":"healthy"}
# Ollama: {"models":[...]}
# Qdrant: {"status":"ok"}
```

## 🔧 Step 7: Load Required Models

```bash
# Access Ollama container
docker exec -it ollama bash

# Pull required models (if not already included)
ollama pull nomic-embed-text:latest
ollama pull llama3.1:8b

# Exit container
exit
```

## 🌐 Step 8: Access the System

- **Admin Interface**: http://localhost:3000/admin
- **Chat Interface**: http://localhost:3000/
- **RAG API**: http://localhost:9000
- **Ollama**: http://localhost:11435
- **Qdrant**: http://localhost:6333

## 📁 File Structure

```
offline-rag-system/
├── docker-compose.offline.yml
├── OFFLINE_DEPLOYMENT.md
├── rag-api.tar
├── rag-ui.tar
├── ollama.tar
└── qdrant.tar
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 9000, 11435, 6333, 6334 are available
2. **Memory Issues**: Ollama requires significant RAM (4GB+ recommended)
3. **Model Loading**: Models may take time to download on first run
4. **Health Checks**: Wait for all services to show healthy status

### Logs and Debugging

```bash
# View specific service logs
docker-compose -f docker-compose.offline.yml logs rag-api
docker-compose -f docker-compose.offline.yml logs ollama

# Restart specific service
docker-compose -f docker-compose.offline.yml restart rag-api

# Full system restart
docker-compose -f docker-compose.offline.yml down
docker-compose -f docker-compose.offline.yml up -d
```

## 🔒 Security Considerations

- All services run on localhost by default
- No external network access required
- Data stored in local Docker volumes
- Models cached locally in Ollama

## 📈 Performance Optimization

- **Memory**: Allocate sufficient RAM for Ollama (4GB+)
- **Storage**: Use SSD for better vector database performance
- **CPU**: Multi-core systems recommended for concurrent processing
- **Network**: Local network communication optimized

## 📞 Support

For issues or questions:
1. Check service logs first
2. Verify all images loaded correctly
3. Ensure sufficient system resources
4. Check port availability

## 🎯 Quick Start Commands

```bash
# Complete offline deployment
docker load -i *.tar
docker-compose -f docker-compose.offline.yml up -d
docker exec -it ollama ollama pull nomic-embed-text:latest
docker exec -it ollama ollama pull llama3.1:8b
```

Your offline RAG system is now ready! 🎉
