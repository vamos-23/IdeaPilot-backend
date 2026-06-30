import { pipeline, env } from "@huggingface/transformers";

env.cacheDir = process.env.TRANSFORMER_CACHE || "./.models-cache";
let embedder: any = null;

export class EmbeddingService {
  static async init() {
    embedder = await pipeline(
      "feature-extraction",
      "nomic-ai/nomic-embed-text-v1.5",
      { dtype: "q8" },
    );
  }

  static async generateEmbeddings(text: string) {
    /* 
    -> mean_pooling: Generates a single vector representing all individual vectors for all tokens across different dimensions. It ensures all separate vectors contribute to the final meaning for vector operations.
    -> normalize: This ensures the vector is normalized by mapping it onto a unit sphere for blazing fast cosine similarity math operations and semantic searches across the DB. This prevents sentences / words with longer lengths having dominant absolute vector magnitudes to unfairly skew the similarity scores.
    */
    const output = await embedder(text, { pooling: "mean", normalize: true });
    const rawData = output.data || output[0].data || output.toList()[0];
    return Array.from(rawData) as number[];
  }
}
