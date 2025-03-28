"use client";
import * as React from "react";
import { notFound } from 'next/navigation'
import RepoDetails from "@/components/repo_details";
import { ReportContext } from "@/components/dashboard_layout"
import { useParams } from 'next/navigation'


export default function Page() {
  const { repo } = useParams<{ repo: string[] }>();
  const [full_report_data,] = React.useContext(ReportContext);

  const full_repos_data = full_report_data?.repos;
  if (full_repos_data && repo[0] in full_repos_data) {
    const repo_data = full_repos_data[repo[0]];
    const archive = repo.length > 1 ? decodeURIComponent(repo[1]) : undefined;

    return (
      <RepoDetails repo={repo_data} archive={archive} />
    );
  }
  else {
    notFound()
  }
}
