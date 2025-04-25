"use client"
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { tBorgLog, tBorgRepo } from "@/lib/report";
import Paper from '@mui/material/Paper';
import { useRouter } from 'next/navigation'
import { get_status_color } from "@/components/reporter"
import { datetime_iso_to_short } from "@/lib/utils";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Backdrop, CircularProgress } from '@mui/material';

export async function readlog(repo: tBorgRepo, logfile: tBorgLog) {
  const json_body = { 'filepath': logfile.fullpath, 'filename': logfile.name, 'repologpath': repo.logspath }
  const response = await fetch("/api/readlog", { method: "post", body: JSON.stringify(json_body) });
  return await response.json()
}

export default function LogDetails({ repo, logfile }: { repo: tBorgRepo, logfile?: string }) {
  // Default backup expanded is the one specified, or the last one, or none
  const default_log = logfile ?? repo?.last_run?.name ?? false;
  const [expanded, setExpanded] = React.useState<string | false>(default_log);
  const [loading, setLoading] = React.useState(false);
  const [log, setLog] = React.useState<tBorgLog | undefined>(undefined);
  const handleOpen = (logfile: tBorgLog) => { setLog(logfile); };
  const handleClose = () => { setLog(undefined); };
  return (
    <>
      <LogDetailsFiles repo={repo} expanded={expanded} expandAction={setExpanded} openLogAction={handleOpen} />
      <LogDetailsContent repo={repo} logfile={log} closeLogAction={handleClose} setLoadingAction={setLoading} />
      <Backdrop open={loading} >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  )
}

export function LogDetailsContent({ repo, logfile, closeLogAction, setLoadingAction }:
  {
    repo: tBorgRepo,
    logfile: tBorgLog | undefined,
    closeLogAction: () => void,
    setLoadingAction: React.Dispatch<React.SetStateAction<boolean>>
  }
) {
  const [content, setContent] = React.useState<string | undefined>(undefined);

  const handleClose = () => {
    setContent(undefined);
    closeLogAction();
  };

  React.useEffect(() => {
    if (logfile) {
      setLoadingAction(true);
      readlog(repo, logfile).then((data) => {
        setLoadingAction(false);
        setContent(data.filecontent);
      }).catch((error) => {
        console.log(error);
      });
    }
  }, [logfile, repo, setLoadingAction]);

  return (
    <Dialog
      open={content ? true : false}
      onClose={handleClose}
      scroll='paper'
      fullWidth
      maxWidth='lg'
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title" align="center">
        <Typography>{logfile?.name}</Typography>
        <Typography variant="caption">{logfile?.fullpath}</Typography>
      </DialogTitle>
      <DialogContent dividers={true}>
        <DialogContentText
          id="scroll-dialog-description"
          tabIndex={-1}
          sx={{ whiteSpace: "pre-wrap" }}
        >
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function LogDetailsFiles({ repo, expanded, expandAction, openLogAction }:
  {
    repo: tBorgRepo,
    expanded: string | false,
    expandAction: React.Dispatch<React.SetStateAction<string | false>>,
    openLogAction: (logfilepath: tBorgLog) => void
  }
) {
  const router = useRouter()
  // const [expanded, setExpanded] = React.useState<string | false>(false);
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    expandAction(isExpanded ? panel : false);
  };

  // Sort archives by time, newest first
  const sortedDict: Record<string, tBorgLog> = Object.fromEntries(
    Object.entries(repo.logfiles).sort((a, b) => {
      return (new Date(b[1].datetime ?? 0).getTime() - new Date(a[1].datetime ?? 0).getTime())
    }
    ));

  return (
    <Card variant="outlined" component={Paper} sx={{ my: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ mt: 0, mb: 2 }} align="left">
          Log files
        </Typography>

        {Object.entries(sortedDict).map(([name, log]) => (
          <Accordion key={name} expanded={expanded === `${name}`} onChange={handleChange(`${name}`)}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${name}-content`}
              id={`${name}-header`}
            >
              <Typography component="span" sx={{ width: '33%', flexShrink: 0, color: `${get_status_color(log.status)}` }}>
                {`${datetime_iso_to_short(log.datetime)}`}
              </Typography>
              <Typography component="span" sx={{ color: `${get_status_color(log.status)}` }}>
                {`${log.name}`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {log.status && <Typography component="span" sx={{ color: 'text.secondary' }}>
                Log status: {`${log.status}`}
              </Typography>}

              <Stack direction="row" spacing={2}>

                <Button
                  variant="contained"
                  size="small" fullWidth
                  onClick={() => { openLogAction(log) }}
                >
                  Show log content
                </Button>
                {log.archive && (
                  <Button
                    variant="contained"
                    size="small" fullWidth
                    // display modal
                    onClick={() => { router.push(`/repos/${repo.name}/${log.archive}`); }}
                  >
                    Open archive
                  </Button>
                )}
              </Stack>

            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card >
  );
}
