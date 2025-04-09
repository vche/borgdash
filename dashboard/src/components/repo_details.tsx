"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
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
    <>
      <RepoDetailsInfo repo={repo} />
      <RepoDetailsArchives
        repo={repo}
        expanded={expanded}
        expandAction={setExpanded}
      />
    </>
  );
}

export function RepoDetailsInfo({ repo }: { repo: tBorgRepo }) {
  const router = useRouter();
  return (
    <Card variant="outlined" component={Paper} sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          component="div"
          sx={{ mt: 0, mb: 2 }}
          align="left"
        >
          Information
        </Typography>
        <Divider variant="middle" />
        <ArchiveSize sizes={repo.sizes} />

        <TableContainer>
          <Table>
            <TableBody>
              <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {" "}
                  Last run
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: get_status_color(repo.last_run?.status) }}
                  onClick={() => {
                    router.push(
                      `/repos/${repo.name}/${repo.last_backup?.name}`,
                    );
                  }}
                >
                  {repo.last_run
                    ? `${datetime_iso_to_short(repo.last_run.datetime)}`
                    : "-"}
                </TableCell>
              </TableRow>
              <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {" "}
                  Last backup
                </TableCell>
                <TableCell align="right">
                  {repo.last_backup
                    ? `${datetime_iso_to_short(repo.last_backup.datetime)}`
                    : "-"}
                </TableCell>
              </TableRow>
              <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {" "}
                  Path
                </TableCell>
                <TableCell align="right">{repo.repopath}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

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
      </CardContent>
    </Card>
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
      <CardContent>
        <Typography
          variant="h6"
          component="div"
          sx={{ mt: 0, mb: 2 }}
          align="left"
        >
          Archives
        </Typography>

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
              <ArchiveSize sizes={archive.sizes} />

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
      <Table>
        <TableBody>
          <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
            <TableCell component="th" scope="row" align="left">
              Original size
            </TableCell>
            <TableCell component="th" scope="row" align="center">
              Compressed size
            </TableCell>
            <TableCell component="th" scope="row" align="right">
              Deduped size
            </TableCell>
          </TableRow>
          <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
            <TableCell align="left">{prettyBytes(sizes.osize)}</TableCell>
            <TableCell align="center">{prettyBytes(sizes.csize)}</TableCell>
            <TableCell align="right">{prettyBytes(sizes.dsize)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
