Text-to-SQL Generation Engine
An AI-powered, local development environment that translates natural language questions into highly accurate Oracle SQL queries.

This project leverages a RAG (Retrieval-Augmented Generation) pipeline to understand table schemas and relationships, ensuring the generated SQL handles complex joins, CTEs, and window functions with precision.

🏗️ Architecture
Frontend: React (Vite) with real-time SQL syntax highlighting and query history.

Orchestration: n8n (running in Docker) handling the webhook pipeline.

Vector Database: ChromaDB (running in Docker) for table-level semantic RAG.

LLM: Qwen2.5-Coder (via Ollama) for local, private code generation and Nomic-Embed-Text for vector embeddings.

💻 System Requirements & Installation
You can install all core background dependencies directly from your Windows terminal. Open PowerShell or Command Prompt as Administrator and run:

Bash
# Install Node.js (for React/Vite)
winget install OpenJS.NodeJS

# Install Docker Desktop (for n8n and ChromaDB)
winget install Docker.DockerDesktop

# Install Ollama (for the local LLM)
winget install Ollama.Ollama
(Note: Restart your computer after installing Docker Desktop to ensure the virtualization engine initializes correctly).

🚀 First-Time Environment Setup

1. Repository & Frontend Setup
Clone the repository to your local machine and install the required React dependencies. Running npm install is mandatory to build the local node_modules directory required to host the Vite development server.

Bash
git clone [https://github.com/bhuvan262700/local-rag-sql-engine.git](https://github.com/bhuvan262700/local-rag-sql-engine.git)
cd local-rag-sql-engine
npm install

(If 'npm install' fails to execute on your Windows environment, explicitly run:
npm.cmd install
npm.cmd run dev )

2. LLM & Vector DB Setup
Pull the required generative and embedding models into your local Ollama registry:

Bash
ollama pull qwen2.5-coder
ollama pull nomic-embed-text
Initialize the background Docker containers for the database and orchestrator:

Bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
docker run -d --name n8n -p 5678:5678 n8nio/n8n

3. n8n Pipeline Import & Network Configuration
Because n8n runs inside an isolated Docker container, it cannot use localhost directly to talk to the host machine's services. You must route connections through the Docker internal host network.

Open http://localhost:5678 in your browser.

In the n8n canvas, click Import from File in the top right menu and select the n8n-workflow.json file included in the root of this repository.

Configure Ollama Credentials: Double-click the Embeddings Ollama and Ollama Chat Model nodes. Create a new credential and set the Base URL strictly to: [http://host.docker.internal:11434](http://host.docker.internal:11434)

Configure ChromaDB Credentials: Double-click the Chroma Vector Store nodes. Create a new credential and set the Base URL strictly to: [http://host.docker.internal:8000](http://host.docker.internal:8000)

Open the Webhook node, ensure the path is set to generate-sql, and click Publish to activate the pipeline.

⚡ Daily Execution
Once the initial setup and credential configuration are complete, you do not need to run the manual commands again.

Simply double-click the Start-SQL-Engine.bat file located in the project folder (or right-click it to create a Desktop shortcut). This automated script dynamically maps to its parent directory and will:

Boot the n8n and chromadb Docker containers.

Start the Vite React development server.

Automatically open the frontend dashboard in your default browser at localhost:5173.
