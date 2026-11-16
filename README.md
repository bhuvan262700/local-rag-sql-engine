# Text-to-SQL Generation Engine

An AI-powered, local development environment that translates natural language questions into highly accurate Oracle SQL queries and executes them against a live local database to return real-time data.

This project leverages a RAG (Retrieval-Augmented Generation) pipeline to understand table schemas and relationships, ensuring the generated SQL handles complex joins, CTEs, and window functions with precision, before executing the queries to display dynamic results alongside the code.

## 🏗️ Architecture
* **Frontend:** React (Vite) featuring a dark-mode dashboard, real-time SQL syntax highlighting, persistent session history via `localStorage`, and dynamic data table rendering.
* **Orchestration:** n8n (running in Docker) handling the webhook pipeline, schema chunking, AI node routing, and final JSON payload construction.
* **Vector Database:** ChromaDB (running in Docker) for table-level semantic RAG and schema context retrieval.
* **Backend Database:** Local Oracle Database 26ai Free Release (schema: `devuser`, pluggable database: `FREEPDB1`).
* **LLM:** `qwen2.5-coder:14b` (via Ollama) for local, highly-capable private code generation and `nomic-embed-text` for vector embeddings.

## 💻 System Requirements & Installation
You can install the core background dependencies directly from your Windows terminal. Open PowerShell or Command Prompt as Administrator and run:

```bash
# Install Node.js (for React/Vite)
winget install OpenJS.NodeJS

# Install Docker Desktop (for n8n and ChromaDB)
winget install Docker.DockerDesktop

# Install Ollama (for the local LLMs)
winget install Ollama.Ollama

(Note: Restart your computer after installing Docker Desktop to ensure the virtualization engine initializes correctly. Ensure Oracle Database 26ai Free is also installed and running locally).

🚀 First-Time Environment Setup
1. Repository & Frontend Setup
Clone the repository to your local machine and install the required React dependencies. Running npm install is mandatory to build the local node_modules directory required to host the Vite development server.

(Bash)
git clone [https://github.com/bhuvan262700/local-rag-sql-engine.git](https://github.com/bhuvan262700/local-rag-sql-engine.git)

cd local-rag-sql-engine

npm install
(If npm install fails to execute on your Windows environment, explicitly run: npm.cmd install and npm.cmd run dev)

2. LLM & Vector DB Setup
Pull the updated 14-billion parameter generative model and the embedding model into your local Ollama registry:

(Bash)
ollama pull qwen2.5-coder:14b
ollama pull nomic-embed-text
Initialize the background Docker containers for the vector database and orchestrator:

(Bash)
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
docker run -d --name n8n -p 5678:5678 n8nio/n8n

3. n8n Pipeline Import & Network Configuration
Because n8n runs inside an isolated Docker container, relying on localhost or host.docker.internal often fails due to Windows network sleep cycles and Firewall rules. It is highly recommended to assign a Static IPv4 address to your Windows machine (e.g., 192.168.x.x) and use that for all configurations.

   1.Open http://localhost:5678 in your browser.

   2.In the n8n canvas, click Import from File in the top right menu and select the n8n-workflow.json file included in the root of this repository.

   3.Configure Ollama Credentials: Double-click the Embeddings Ollama and Ollama Chat Model nodes. Create a new credential and set the Base URL to your machine's IPv4 address: http://<YOUR-IPV4-ADDRESS>:11434

   4.Configure ChromaDB Credentials: Double-click the Chroma Vector Store nodes. Create a new credential and set the Base URL to: http://<YOUR-IPV4-ADDRESS>:8000

   5.Configure Oracle Database Credentials: Double-click the Execute SQL node. Create an Oracle credential mapping to your database:

      User: devuser

      Password: <YOUR-ORACLE-PASSWORD>

      Connection String: <YOUR-IPV4-ADDRESS>:1521/FREEPDB1

   6.Open the Webhook node, ensure the path is set to generate-sql, and click Publish to activate the pipeline.

⚡ Daily Execution
Once the initial setup and credential configuration are complete, you do not need to run the manual commands again.

Simply double-click the Start-SQL-Engine.bat file located in the project folder. This automated script dynamically maps to its parent directory and will:

   1.Boot the n8n and ChromaDB Docker containers.

   2.Start the Vite React development server.

   3.Automatically open the frontend dashboard in your default browser at localhost:5173.

🔧 Troubleshooting
NJS-510 Connection Timeout / Fetch Failed: If you experience an Oracle NJS-510 error or a ChromaDB "fetch failed" error upon starting the engine, your router likely assigned your laptop a new dynamic IP address, OR your database listener went to sleep.

Run ipconfig in Command Prompt to verify your IPv4 address matches your n8n credentials.

If the IP is correct, open an Administrator Command Prompt and run lsnrctl start to wake up the Oracle database listener.