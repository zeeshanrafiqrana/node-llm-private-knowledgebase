import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { createVactor } from '../controllers/creatEmbeddingApi.controller.js';
import { searchEmbeddingAIResponse } from '../controllers/searchEmbeddingApi.controller.js';
import { dbMiddleware } from '../middlewares/singleStore.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { createEmbeddingDocument } from '../controllers/creatEmbeddingDocument.controller.js';

const router = Router();

router.use(verifyJWT);
router.use(dbMiddleware); 

router.route("/creat-embedding-api").get(createVactor);
router.route("/search-embedding-ai").post(searchEmbeddingAIResponse);
router.route("/create-embedding-document").post(createEmbeddingDocument);

export default router