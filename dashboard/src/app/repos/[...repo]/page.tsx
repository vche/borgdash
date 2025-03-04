import * as React from "react";
import Typography from "@mui/material/Typography";

export default async function Page({
  params,
}: {
  params: Promise<{ repo: string[] }>;
}) {
  const { repo } = await params;
  return (
    <Typography>
      Page for repo {repo[0]}
      {repo.length > 1 && ` (Backup ${repo[1]})`}
    </Typography >
  );
}
