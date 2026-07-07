import axios from "axios";

export class ProjectResources {
  private static youtubeAccessToken = process.env.YOUTUBE_API_KEY;
  private static githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  private static youtubeBaseUrl = process.env.YOUTUBE_BASE_URL;
  private static githubBaseUrl = process.env.GITHUB_BASE_URL;

  static async fetchYouTubeResources(searchQuery: string) {
    try {
      const response = await axios.get(this.youtubeBaseUrl!, {
        params: {
          part: "snippet",
          q: `${searchQuery.trim()}`,
          type: "video",
          maxResults: 5,
          key: this.youtubeAccessToken,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (error: any) {
      const status = error.status || error.response?.status || 500;
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      console.error(`Youtube search failed [${status}] : ${errorMessage}`);
      throw new Error(`Youtube search failed.`);
    }
  }

  static async fetchGithubResources(searchQuery: string) {
    try {
      const config = {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "IdeaPilotExpoBackendApp",
          ...(this.githubAccessToken && {
            Authorization: `token ${this.githubAccessToken}`,
          }),
        },
      };

      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `${this.githubBaseUrl}/search/repositories?q=${encodedQuery}&per_page=5`;

      const response = await axios.get(url, config);
      const repoItems = response.data.items || [];

      return repoItems.map((repo: any) => ({
        id: repo.id.toString(),
        avatarUrl: repo.owner?.avatar_url || 'https://githubassets.com',
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || "No description provided.",
        stars:
          repo.stargazers_count > 999
            ? (repo.stargazers_count / 1000).toFixed(1) + "k"
            : repo.stargazers_count.toString(),
        watchers: repo.watchers_count.toString(),
        forks: repo.forks_count.toString(),
        repoUrl: repo.html_url,
      }));
    } catch (error: any) {
      const status = error.response?.status || 500;
      const errorMessage =
        error.response?.data?.message || "Internal Server Error";
      console.error(`Github search failure [${status}]: ${errorMessage}`);
      throw new Error("Github search failed.");
    }
  }
}
