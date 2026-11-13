import { ChromaClient } from "chromadb";
const client = new ChromaClient({ host: "localhost", port: 8000 });

async function showData() {
    const collection = await client.getCollection({ name: "hr_schema_v3" }); 
    
    // Use .get() instead of .peek() to strictly enforce the include array
    const data = await collection.get({ 
        limit: 2, 
        include: ["documents", "metadatas", "embeddings"] 
    });
    
    console.log("Raw Database Contents:", JSON.stringify(data, null, 2));
}
showData();