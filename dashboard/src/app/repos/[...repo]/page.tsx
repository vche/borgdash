import * as React from "react";
import { notFound } from 'next/navigation'
import RepoDetails from "@/components/repo_details";
import { load_report_data } from "@/lib/report";


export default async function Page({ params }: { params: Promise<{ repo: string[] }>; }) {
  const { repo } = await params;
  const full_report_data = await load_report_data();

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
