import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAIResponse } from "../utils/createAIResponce.js";
import { createEmbading } from "../utils/createEmbading.js";

const searchEmbeddingText = async (connection,text) => {
  try {
    const vectordata = await createEmbading(text);
    const vector = vectordata.data[0].embedding;
    const [results] = await connection.execute(
      `SELECT text, DOT_PRODUCT(vector, JSON_ARRAY_PACK(?)) as score
            FROM ${process.env.SEARCH_VACTOR_DB}
            ORDER BY score DESC
            LIMIT 5`,
      [JSON.stringify(vector)]
    );
    return results;
  } catch (error) {
    throw new ApiError(500, "An error occurred while searching embedding");
  }
};

const searchEmbeddingAIResponse = asyncHandler(async (req, res) => {
  try {
    const { singleStoreConnection } = req;
    const { text } = req.body;
    if (!text) {
      return res.status(400).json(new ApiResponse(400, {}, "Text is required"));
    }

    const embeddingText = await searchEmbeddingText(singleStoreConnection,text);
    const embeddingAIResponce = await createAIResponse(embeddingText[0].text);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { results: embeddingAIResponce },
          "Search Embedding successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "An error occurred while generating embedding");
  }
});

export { searchEmbeddingAIResponse };
