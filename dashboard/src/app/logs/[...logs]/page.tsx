import * as React from "react";
import { notFound } from 'next/navigation'
import LogDetails from "@/components/log_details";
import { load_report_data } from "@/lib/report";


export default async function Page({ params }: { params: Promise<{ logs: string[] }>; }) {
  const { logs } = await params;
  const full_report_data = await load_report_data();

  const full_repos_data = full_report_data?.repos;
  if (full_repos_data && logs[0] in full_repos_data) {
    const repo_data = full_repos_data[logs[0]];
    const logfile = logs.length > 1 ? decodeURIComponent(logs[1]) : undefined;

    return (
      <LogDetails repo={repo_data} logfile={logfile} />
    );
  }
  else {
    notFound()
  }
}
