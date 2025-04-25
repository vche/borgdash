"use client";
import * as React from "react";
import Grid from "@mui/material/Grid2";
import { BarChart } from '@mui/x-charts/BarChart';
import { DateTime, Duration } from "luxon";
import type { tBorgRepo } from "@/lib/report";
import prettyBytes from "pretty-bytes";

// Build the label/value series data to plot
function get_repo_time_series(repo_data: { [k: string]: tBorgRepo }) {
  //ex: [ { label: 'repo1', data: [val1] }, { label: 'repo2', data: [val2] } ]
  return Object.entries(repo_data).map(([rname, rdata]) => (
    {
      label: rname,
      valueFormatter: (ms: number | null) => (ms === null ? '' :
        `${Duration.fromMillis(ms).shiftTo('days', 'hours', 'minutes', 'milliseconds').toFormat("d'd' h'h' m 'min'")}`
        // `${Duration.fromMillis(ms).shiftTo('days', 'hours', 'minutes', 'milliseconds').set({ milliseconds: 0 }).toHuman({ unitDisplay: "short" })}`
      ),
      data: rdata.last_backup?.datetime ? [
        DateTime.fromISO(rdata.last_backup.datetime).diffNow().negate().toMillis()
      ] : undefined
    }
  ));
}

function get_repo_size_series(repo_data: { [k: string]: tBorgRepo }) {
  return Object.entries(repo_data).map(([rname, rdata]) => (
    {
      label: rname,
      valueFormatter: (sz: number | null) => (sz === null ? '' : `${prettyBytes(sz)}`),
      data: rdata.last_backup?.datetime ? [rdata.last_backup.sizes.osize] : undefined
    }
  ));
}

export default function ReposGraphs({ repos }: { repos: { [k: string]: tBorgRepo } }) {
  return (
    <>
      <Grid size={6}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: ['Last backup (days)'] }]}
          yAxis={[{
            scaleType: 'linear',
            // label: 'Last backup (days)',
            valueFormatter: (ms, context) =>
              context.location === 'tick' ? `${Duration.fromMillis(ms).shiftTo('days').days}` : `${ms}`
          }]}
          series={get_repo_time_series(repos)}
          height={200}
        />
      </Grid>
      <Grid size={6}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: ['Backup size'] }]}
          yAxis={[{
            scaleType: 'linear',
            // label: 'Backup size',
            valueFormatter: (sz, context) =>
              context.location === 'tick' ? `${prettyBytes(sz)}` : `${sz}`
          }]}
          series={get_repo_size_series(repos)}
          height={200}
        />
      </Grid>
    </>
  );
}
