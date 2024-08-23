import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import pdf from "pdf-parse-new";
import jsonfile from "jsonfile";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createEmbading } from "../utils/createEmbading.js";

async function create({ connection, comment }) {
  const [results] = await connection.execute(
    `INSERT INTO ${process.env.SEARCH_VACTOR_DB} (text,vector) VALUES (?,JSON_ARRAY_PACK(?))`,
    [comment.text, JSON.stringify(comment.vector)]
  );
  return results.insertId;
}

const processFile = async (filePath) => {
    const fileExt = path.extname(filePath).toLowerCase();
    let text = "";
  
    switch (fileExt) {
      case ".pdf":
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(pdfBuffer);
        text = pdfData.text;
        break;
  
      case ".docx":
        const docxBuffer = fs.readFileSync(filePath);
        const docxData = await mammoth.extractRawText({ buffer: docxBuffer });
        text = docxData.value;
        break;
  
      case ".txt":
        text = fs.readFileSync(filePath, "utf8");
        break;
  
      case ".json":
        const jsonData = jsonfile.readFileSync(filePath);
        text = JSON.stringify(jsonData);
        break;
  
      default:
        throw new ApiError(400, "Unsupported file type");
    }
    console.log("object: ", text)       
  return text;
};


const convertTextToJsonArray = (text,fileExt) => {
    try {
        if (fileExt === ".json") {
            return JSON.parse(text);
          }
      
          const lines = text.split('\n').filter(line => line.trim().length > 0);
          return lines.map(line => ({ text: line }));
    } catch (error) {
      throw new ApiError(400, "Failed to parse text into JSON");
    }
  };

const createEmbeddingDocument = asyncHandler(async (req, res) => {
  const { singleStoreConnection } = req;
//   const document = req.file?.path;
  const document = path.resolve("./public/temp/comments.pdf");
  try {
    if (!document) {
      throw new ApiError(500, `An error occurred while uploading file`);
    }
    const fileExt = path.extname(document).toLowerCase();
    const fileText = await processFile(document);
    const commentsArray = convertTextToJsonArray(fileText, fileExt);
console.log("commentsArray=======",commentsArray)
    if (Array.isArray(commentsArray)) {
      for (let i = 0; i < commentsArray.length; i++) {
        const commentObj = commentsArray[i];
        const text =
          commentObj.snippet?.topLevelComment?.snippet?.textOriginal ||
          "Text comment";

        try {
          const vectordata = await createEmbading(text);
          const vector = vectordata.data[0].embedding;

          const id = await create({
            connection: singleStoreConnection,
            comment: {
              text,
              vector,
            },
          });
          console.log(`Inserted row id is: ${id}`);
        } catch (error) {
          console.log("Error:", error);
          throw new ApiError(500, "An error occurred while processing comment");
        }
      }
    } else {
      throw new ApiError(400, "File does not contain an array of comments");
    }
    fs.unlinkSync(document);
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "File processed and data saved successfully")
      );
  } catch (error) {
    console.error(`Error processing file`, error);
    throw new ApiError(500, `An error occurred while processing file`);
  }
});

export { createEmbeddingDocument };
