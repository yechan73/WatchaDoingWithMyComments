import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = "/WatchaDoingWithMyComments";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? repositoryBasePath : undefined,
  assetPrefix: isGithubPages ? `${repositoryBasePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
