#!/bin/bash

# 🚀 RAG System Offline Bundle Creator
# This script creates tar files for offline deployment

set -e

echo "🚀 Creating RAG System Offline Bundle..."
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create bundle directory
BUNDLE_DIR="rag-offline-bundle-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BUNDLE_DIR"
cd "$BUNDLE_DIR"

echo "📁 Created bundle directory: $BUNDLE_DIR"

# Save all required images
echo "🐳 Saving Docker images..."

echo "  📦 Saving RAG API image..."
docker save devaraj13/rag-api:latest -o rag-api.tar

echo "  📦 Saving UI image..."
docker save devaraj13/rag-ui:latest -o rag-ui.tar

echo "  📦 Saving Ollama image..."
docker save devaraj13/ollama:latest -o ollama.tar

echo "  📦 Saving Qdrant image..."
docker save devaraj13/qdrant:latest -o qdrant.tar

# Copy configuration files
echo "📋 Copying configuration files..."
cp ../docker-compose.offline.yml .
cp ../OFFLINE_DEPLOYMENT.md .

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying RAG System..."
echo "=========================="

# Load all images
echo "📦 Loading Docker images..."
docker load -i rag-api.tar
docker load -i rag-ui.tar
docker load -i ollama.tar
docker load -i qdrant.tar

echo "✅ Images loaded successfully!"

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.offline.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🏥 Checking system health..."
echo "UI Health: $(curl -s http://localhost:3000/health | jq -r '.ok' 2>/dev/null || echo 'checking...')"
echo "API Health: $(curl -s http://localhost:9000/health | jq -r '.ok' 2>/dev/null || echo 'checking...')"
echo "Ollama: $(curl -s http://localhost:11435/api/tags | jq -r '.models | length' 2>/dev/null || echo 'checking...') models loaded"
echo "Qdrant: $(curl -s http://localhost:6333/health | jq -r '.status' 2>/dev/null || echo 'checking...')"

echo ""
echo "🎉 RAG System deployed successfully!"
echo "🌐 Access points:"
echo "   - Chat Interface: http://localhost:3000"
echo "   - Admin Panel: http://localhost:3000/admin"
echo "   - API Docs: http://localhost:9000/docs"
EOF

chmod +x deploy.sh

# Create README for the bundle
cat > README.md << 'EOF'
# 🚀 RAG System Offline Bundle

This bundle contains everything needed to deploy the RAG system in an offline environment.

## 📁 Contents

- `rag-api.tar` - RAG API service (694MB)
- `rag-ui.tar` - Web UI service (142MB)  
- `ollama.tar` - LLM service (2.28GB)
- `qdrant.tar` - Vector database (198MB)
- `docker-compose.offline.yml` - Service configuration
- `OFFLINE_DEPLOYMENT.md` - Detailed deployment guide
- `deploy.sh` - Automated deployment script

## 🚀 Quick Start

1. Ensure Docker is installed on the target system
2. Run: `./deploy.sh`
3. Wait for services to start
4. Access at http://localhost:3000

## 📊 System Requirements

- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 5GB+ available space
- **OS**: Linux, macOS, or Windows with Docker
- **Network**: No external access required

## 🔧 Troubleshooting

See `OFFLINE_DEPLOYMENT.md` for detailed troubleshooting steps.
EOF

# Show bundle contents
echo ""
echo "📦 Bundle Contents:"
echo "==================="
ls -lh

echo ""
echo "📊 Bundle Size:"
du -sh .

echo ""
echo "✅ Offline bundle created successfully!"
echo "📁 Location: $BUNDLE_DIR"
echo ""
echo "🚚 Transfer this directory to your offline system"
echo "🚀 Run './deploy.sh' on the target system to deploy"
echo ""
echo "🔗 Docker Hub Images:"
echo "   - RAG API: https://hub.docker.com/r/devaraj13/rag-api"
echo "   - UI: https://hub.docker.com/r/devaraj13/rag-ui"
echo "   - Ollama: https://hub.docker.com/r/devaraj13/ollama"
echo "   - Qdrant: https://hub.docker.com/r/devaraj13/qdrant"
