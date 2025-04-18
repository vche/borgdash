"use client"
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Typography from "@mui/material/Typography";
import type { tBorgRepo } from "@/lib/report";
import Grid from "@mui/material/Grid2";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { useRouter } from 'next/navigation'
import { get_status_color } from "@/components/reporter"
import { datetime_iso_to_short } from "@/lib/utils";
import prettyBytes from "pretty-bytes";

export default function RepoCard({ repo }: { repo: tBorgRepo }) {
  const router = useRouter()
  return (
    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
      <Card variant="outlined" sx={{ backgroundColor: "action.selected" }}>
        <CardContent>
          <Typography variant="h5" component="div" sx={{ mt: 1, mb: 1 }} align="center">
            {repo.name}
          </Typography>
          <Divider variant="middle" />

          <TableContainer component={Paper}>
            <Table sx={{ "& .MuiTableRow-root:hover": { backgroundColor: "gray" } }}>
              <TableBody>
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => { router.push(`/logs/${repo.name}/${repo.last_run?.name}`); }}
                >
                  <TableCell component="th" scope="row"> Last run</TableCell>
                  <TableCell align="right" sx={{ color: get_status_color(repo.last_run?.status) }} >
                    {repo.last_run ? `${datetime_iso_to_short(repo.last_run.datetime)}` : "-"}
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => { router.push(`/repos/${repo.name}/${repo.last_backup?.name}`); }}
                >
                  <TableCell component="th" scope="row"> Last backup</TableCell>
                  <TableCell align="right">
                    {repo.last_backup ? `${datetime_iso_to_short(repo.last_backup.datetime)}` : "-"}
                  </TableCell>
                </TableRow>

                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                  <TableCell component="th" scope="row"> Total/Compressed size</TableCell>
                  <TableCell align="right">
                    {`${prettyBytes(repo.sizes.osize)}/${prettyBytes(repo.sizes.csize)}`}
                  </TableCell>
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            size="small" fullWidth
            color={repo.status === null ? "primary" : repo.status ? "success" : "error"}
            onClick={() => { router.push(`/repos/${repo.name}`); }}
          >
            Open repo
          </Button>
        </CardActions>
      </Card>
    </Grid >
  );
}
