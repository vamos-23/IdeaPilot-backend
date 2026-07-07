import { ProjectResources } from "../services/resources/resourcesFetch.service";
import { Request, Response } from "express";

export async function getYouTubeVideos(req: Request, res: Response) {
  try {
    const searchQuery = req.query.query as string;
    const uid = req.user.uid;
    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access to YouTube resources.",
      });
    }
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query parameter is required",
      });
    }

    const videos = await ProjectResources.fetchYouTubeResources(searchQuery);

    res.status(200).json({ success: true, data: videos });
  } catch (error: any) {
    console.error("Youtube Controller error:", error.message);
    res.status(503).json({
      success: false,
      message:
        "YouTube resources are currently unavailable. Please try again later.",
    });
  }
}

export async function getGithubRepositories(req: Request, res: Response) {
  try {
    const searchQuery = req.query.query as string;
    const uid = req.user.uid;
    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access to Github resources.",
      });
    }
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query parameter is required",
      });
    }

    const githubRepos =
      await ProjectResources.fetchGithubResources(searchQuery);

    res.status(200).json({ success: true, data: githubRepos });
  } catch (error: any) {
    console.error("Github Controller error:", error.message);
    res.status(503).json({
      success: false,
      message:
        "Github resources are currently unavailable. Please try again later.",
    });
  }
}
