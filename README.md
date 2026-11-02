# Text-to-SQL Generation Engine

An AI-powered, local development environment that translates natural language questions into highly accurate Oracle SQL queries. 

This project leverages a RAG (Retrieval-Augmented Generation) pipeline to understand table schemas and relationships, ensuring the generated SQL handles complex joins, CTEs, and window functions with precision.

## 🏗️ Architecture
* **Frontend:** React (Vite) with real-time SQL syntax highlighting and query history.
* **Orchestration:** n8n (running in Docker) handling the webhook pipeline.
* **Vector Database:** ChromaDB (running in Docker) for table-level semantic RAG.
* **LLM:** Qwen2.5-Coder (via Ollama) for local, private code generation.

## 💻 System Requirements & Installation
You can install all core background dependencies directly from your Windows terminal. Open PowerShell or Command Prompt as Administrator and run:

```bash
# Install Node.js (for React/Vite)
winget install OpenJS.NodeJS

# Install Docker Desktop (for n8n and ChromaDB)
winget install Docker.DockerDesktop

# Install Ollama (for the local LLM)
winget install Ollama.Ollama


🚀 First-Time Environment Setup
1. Repository & Frontend Setup
Clone the repository to your local machine and install the required React and Tailwind dependencies:

Bash
git clone [https://github.com/bhuvan262700/local-rag-sql-engine.git](https://github.com/bhuvan262700/local-rag-sql-engine.git)
cd local-rag-sql-engine
npm install
2. LLM & Vector DB Setup
Pull the local LLM model into Ollama:

Bash
ollama pull qwen2.5-coder
Initialize the background Docker containers for the database and orchestrator:

Bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
docker run -d --name n8n -p 5678:5678 n8nio/n8n
3. n8n Pipeline Import
Open http://localhost:5678 in your browser.

In the n8n canvas, click Import from File in the top right menu.

Select the oracle-hr-pipeline.json file included in the root of this repository.

Open the Webhook node and ensure the path is set to generate-sql.

Click Publish to activate the pipeline.

⚡ Daily Execution
Once the initial setup is complete, you do not need to run the manual commands again.

Simply double-click the Start-SQL-Engine.bat file from your Windows desktop. This automated script will:

Boot the n8n and chromadb Docker containers.

Start the Vite React development server.

Automatically open the frontend dashboard in your default browser.