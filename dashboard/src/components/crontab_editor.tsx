"use client";
import * as React from "react";
import '@ant-design/v5-patch-for-react-19';
import { Cron, CronError } from 'react-js-cron'

import 'react-js-cron/dist/styles.css'
import Input from '@mui/material/Input';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


import Button from '@mui/material/Button';
import { useNotifications } from '@toolpad/core/useNotifications';

export async function saveconfig(enabled: boolean, schedule: string) {
  const crontab_cfg = { 'cronconfig': { 'enabled': enabled, 'schedule': schedule } };
  await fetch("/api/crontab", { method: "put", body: JSON.stringify(crontab_cfg) });
}

export async function readconfig() {
  const response = await fetch("/api/crontab", { method: "get" });
  const rep = await response.json()
  return rep.cronconfig;
}

export default function CrontabEditor() {
  // Cron editor: https://xrutayisire.github.io/react-js-cron/?path=/docs/reactjs-cron--demo
  const notifications = useNotifications();
  const [value, setValue] = React.useState("* * * * *")
  const [enabled, setEnabled] = React.useState(false)
  const [error, onError] = React.useState<CronError>()

  const onSave = React.useCallback(() => {
    saveconfig(enabled, value).then(() => {
      notifications.show("Schedule saved", { autoHideDuration: 3000 });
    });
  }, [value, enabled, notifications]);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnabled(event.target.checked);
  };

  React.useEffect(() => {
    readconfig().then((data) => {
      setValue(data.schedule);
      setEnabled(data.enabled);
    }).catch((error) => {
      console.log(error);
    });
  }, []);

  return (
    <>
      <FormControlLabel
        control={<Checkbox checked={enabled} onChange={handleChange} />}
        label="Enable scan scheduling"
        sx={{ my: 4 }}
      />
      <Input
        value={value}
        disabled={!enabled}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setValue(event.target.value); }}
      />
      <Divider sx={{ my: 4 }}>OR</Divider>
      <Cron value={value} setValue={setValue} onError={onError} disabled={!enabled} />
      <Alert severity="info">
        Double click on a dropdown option to automatically select / unselect a periodicity
      </Alert>
      {error && (<Alert severity="error">{error.description}</Alert>)}
      <Button type="button" variant="contained" startIcon={<SaveIcon />} onClick={onSave} sx={{ mt: 4 }}>Save</Button>
    </>
  );
}
