"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { tBorgArchive, tBorgSize, tBorgRepo } from "@/lib/report";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { useRouter } from "next/navigation";
import { get_status_color } from "@/components/reporter";
import { datetime_iso_to_short } from "@/lib/utils";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import prettyBytes from "pretty-bytes";
import { LineChart } from '@mui/x-charts/LineChart';
import Grid from "@mui/material/Grid2";
import { CardHeader } from "@mui/material";


export default function RepoDetails({
  repo,
  archive,
}: {
  repo: tBorgRepo;
  archive?: string;
}) {
  // Default backup expanded is the one specified, or the last one, or none
  const default_backup = archive ?? repo?.last_backup?.name ?? false;
  const [expanded, setExpanded] = React.useState<string | false>(
    default_backup,
  );
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <RepoGraph repo={repo} />
      </Grid>
      {/* <Grid item lg='12' textAlign={'center'} justifyContent={'center'}></Grid> */}
      <Grid size={12}>
        <RepoDetailsInfo repo={repo} />
      </Grid>
      <Grid size={12}>
        <RepoDetailsArchives
          repo={repo}
          expanded={expanded}
          expandAction={setExpanded}
        />
      </Grid>
    </Grid>
  );
}

export function RepoGraph({ repo }: { repo: tBorgRepo }) {
  const dataset = Object.values(repo.archives).map((adata) => (
    {
      date: adata.datetime ? new Date(adata.datetime) : null,
      osize: adata.sizes.osize,
      dsize: adata.sizes.dsize,
      csize: adata.sizes.csize,
    }
  ));

  return (
    <Card variant="outlined" component={Paper} sx={{ mb: 2 }}>
      {/* <CardHeader title="Trends" /> */}
      <CardContent>
        <LineChart
          xAxis={[{ scaleType: 'time', dataKey: 'date' }]}
          yAxis={[{
            scaleType: 'linear',
            valueFormatter: (sz, context) =>
              context.location === 'tick' ? `${prettyBytes(sz)}` : `${sz}`
          }]}
          series={[
            {
              label: 'Original size',
              dataKey: 'osize',
              area: true,
              valueFormatter: (sz: number | null) => (sz === null ? '' : `${prettyBytes(sz)}`),
            },
            {
              label: 'Compressed size',
              dataKey: 'csize',
              area: true,
              valueFormatter: (sz: number | null) => (sz === null ? '' : `${prettyBytes(sz)}`),
            },
            {
              label: 'Deduplicated size',
              dataKey: 'dsize',
              area: true,
              valueFormatter: (sz: number | null) => (sz === null ? '' : `${prettyBytes(sz)}`),
            },
          ]}
          height={200}
          dataset={dataset}
        />

      </CardContent>
    </Card>
  );
}

export function RepoDetailsInfo({ repo }: { repo: tBorgRepo }) {
  const router = useRouter();
  return (
    <Card variant="outlined" component={Paper} sx={{ mb: 0 }}>
      <CardHeader title={`${repo.name}`} subheader={repo.repopath} />
      <CardContent>

        <Grid container spacing={2}>
          <Grid size={6}>
            <ArchiveSize sizes={repo.sizes} />
          </Grid>

          <Grid size={6}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" align="left">Last run</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: get_status_color(repo.last_run?.status) }}
                      onClick={() => { router.push(`/repos/${repo.name}/${repo.last_backup?.name}`,); }}
                    >
                      {repo.last_run ? `${datetime_iso_to_short(repo.last_run.datetime)}` : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" align="left">Last backup</TableCell>
                    <TableCell align="right">
                      {repo.last_backup ? `${datetime_iso_to_short(repo.last_backup.datetime)}` : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" align="left">Total chunks</TableCell>
                    <TableCell align="right"> {repo.chunks}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid size={12} sx={{ mt: 1 }}>
            {repo.logspath && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => {
                  router.push(`/logs/${repo.name}`);
                }}
              >
                Go to logs
              </Button>
            )}
          </Grid>

        </Grid>

      </CardContent>
    </Card >
  );
}

export function RepoDetailsArchives({
  repo,
  expanded,
  expandAction,
}: {
  repo: tBorgRepo;
  expanded: string | false;
  expandAction: React.Dispatch<React.SetStateAction<string | false>>;
}) {
  const router = useRouter();
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      expandAction(isExpanded ? panel : false);
    };

  // Sort archives by time, newest first
  const sortedDict: Record<string, tBorgArchive> = Object.fromEntries(
    Object.entries(repo.archives).sort((a, b) => {
      return (
        new Date(b[1].datetime ?? 0).getTime() -
        new Date(a[1].datetime ?? 0).getTime()
      );
    }),
  );

  return (
    <Card variant="outlined" component={Paper} sx={{ my: 2 }}>
      <CardHeader title="Archives" />
      <CardContent>
        {Object.entries(sortedDict).map(([name, archive]) => (
          <Accordion
            key={name}
            expanded={expanded === `${name}`}
            onChange={handleChange(`${name}`)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${name}-content`}
              id={`${name}-header`}
            >
              <Typography component="span" sx={{ width: "33%", flexShrink: 0 }}>
                {`${datetime_iso_to_short(archive.datetime)}`}
              </Typography>
              <Typography component="span" sx={{ color: "text.secondary" }}>
                {`${archive.name}`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>

              <Grid container spacing={2}>
                <Grid size={4}>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">Start</TableCell>
                          <TableCell align="right">
                            {archive.datetime ? `${datetime_iso_to_short(archive.datetime)}` : "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">End</TableCell>
                          <TableCell align="right">
                            {archive.datetime_end ? `${datetime_iso_to_short(archive.datetime_end)}` : "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">Backup time</TableCell>
                          <TableCell align="right">
                            {`${archive.duration}s`}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid size={4}>
                  <ArchiveSize sizes={archive.sizes} />
                </Grid>
                <Grid size={4}>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">Files</TableCell>
                          <TableCell align="right">{archive.nfiles}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">Comment</TableCell>
                          <TableCell align="right">{archive.comment}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid size={12}>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row" align="left">Location</TableCell>
                          <TableCell align="right">{`${repo.repopath}::${archive.name}`}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* <ArchiveSize sizes={archive.sizes} /> */}

              {archive.log && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => {
                    router.push(`/logs/${repo.name}/${archive.log.name}`);
                  }}
                >
                  Open log file
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}

export function ArchiveSize({ sizes }: { sizes: tBorgSize }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          <TableRow >
            <TableCell scope="row" component="th" align="left">
              Original size
            </TableCell>
            <TableCell align="right">{prettyBytes(sizes.osize)}</TableCell>
          </TableRow>
          <TableRow >
            <TableCell scope="row" component="th" align="left">
              Compressed size
            </TableCell>
            <TableCell align="right">{prettyBytes(sizes.csize)}</TableCell>
          </TableRow>
          <TableRow >
            <TableCell scope="row" component="th" align="left">
              Deduplicated size
            </TableCell>
            <TableCell align="right">{prettyBytes(sizes.dsize)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
