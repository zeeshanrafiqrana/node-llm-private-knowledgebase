export const createEmbading = async (textToEmbed) => {
    try {
      const response = await fetch(`https://api.openai.com/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_KEY}`,
        },
        body: JSON.stringify({
          'model': 'text-embedding-ada-002',
          'input': textToEmbed,
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json(); 
        throw new Error(`Failed to create embedding: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`An error occurred while creating embedding: ${error.message}`);
    }
  };
  




