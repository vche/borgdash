import * as React from "react";
import Typography from "@mui/material/Typography";

export default async function Page({
  params,
}: {
  params: Promise<{ logs: string[] }>;
}) {
  const { logs } = await params;
  return (
    <Typography>
      {/* if only 1 param, list logfiles, if 2, display 1 log */}
      Page for logs of {logs[0]}
      {logs.length > 1 && ` (Logfile ${logs[1]})`}
    </Typography >
  );
}
