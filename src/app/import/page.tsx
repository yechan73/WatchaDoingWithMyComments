import { WatchaImportClient } from "@/components/import/WatchaImportClient";

const repositoryBasePath = "/WatchaDoingWithMyComments";

export default function ImportPage() {
  const basePath = process.env.GITHUB_PAGES === "true" ? repositoryBasePath : "";

  return <WatchaImportClient basePath={basePath} />;
}
