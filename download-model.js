import { pipeline, env } from "@huggingface/transformers";

env.cacheDir = process.env.TRANSFORMER_CACHE || "./.models-cache";

async function preDownload() {
  console.log(
    "Downloading local embedding model into container cache directory...",
  );
  await pipeline("feature-extraction", "nomic-ai/nomic-embed-text-v1.5", {
    dtype: "q8",
  });
  console.log("Model download complete!");
}

preDownload();
