"use client";
import * as React from "react";
import { notFound } from 'next/navigation'
import LogDetails from "@/components/log_details";
import { ReportContext } from "@/components/dashboard_layout"
import { useParams } from 'next/navigation'


export default function Page() {
  const { logs } = useParams<{ logs: string[] }>();
  const [full_report_data,] = React.useContext(ReportContext);

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
