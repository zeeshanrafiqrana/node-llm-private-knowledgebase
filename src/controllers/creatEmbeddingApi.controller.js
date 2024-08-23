import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createEmbading } from "../utils/createEmbading.js";
import { getYoutubeComments } from "../utils/youtubeComments.js";

async function create({ connection, comment }) {
  const [results] = await connection.execute(
    `INSERT INTO ${process.env.SEARCH_VACTOR_DB} (text,vector) VALUES (?,JSON_ARRAY_PACK(?))`,
    [comment.text, JSON.stringify(comment.vector)]
  );
  return results.insertId;
}
const createVactor = asyncHandler(async (req, res) => {
  try {
    const { singleStoreConnection } = req;
    let comments = await getYoutubeComments();
    for (let i = 0; i < comments.length; i++) {
      const text = comments[i].snippet.topLevelComment.snippet.textOriginal || "Text comment";
      try {
        const vectordata = await createEmbading(text);
        const vector = vectordata.data[0].embedding;
        const id = await create({
          connection:singleStoreConnection,
          comment: {
            text,
            vector,
          },
        });
        console.log(`Inserted row id is: ${id}`);
      } catch (error) {
        throw new ApiError(500, "An error occurred while processing comment");
      }
    }
    return res.status(200).json(new ApiResponse(200, {}, "Comments processed successfully"));
  } catch (error) {
    throw new ApiError(500, "An error occurred while creating a vactor");
  }
});


export {
    createVactor,
  };