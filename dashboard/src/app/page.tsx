"use client";
import * as React from "react";
import Grid from "@mui/material/Grid2";
import RepoCard from "@/components/repo_card"
import { ReportContext } from "@/components/dashboard_layout"

export default function Home() {
  const [report_data,] = React.useContext(ReportContext);
  return (
    <Grid container spacing={3}>
      {report_data && report_data.repos
        ? Object.values(report_data.repos).map((repo) => (<RepoCard repo={repo} key={`${repo.name}`} />))
        : "No data, consider a manual refresh and/or check the reporter logs."}
    </Grid>
  );
}
