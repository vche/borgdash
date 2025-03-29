"use client";
import * as React from "react";
import CodeMirror from '@uiw/react-codemirror';
import { basicSetup } from "codemirror"
import { monokai } from "@uiw/codemirror-theme-monokai";
import { yaml } from "@codemirror/lang-yaml";
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import { useNotifications } from '@toolpad/core/useNotifications';

export async function saveconfig(textconfig: string) {
  await fetch("/api/config", { method: "put", body: JSON.stringify({ 'configdata': textconfig }) });
}

export default function ConfigEditor({ config_data }: { config_data: string }) {
  // code mirror Doc: https://uiwjs.github.io/react-codemirror/
  const notifications = useNotifications();
  const [value, setValue] = React.useState(config_data);
  const onChange = React.useCallback((val: string) => { setValue(val); }, []);
  const onSave = React.useCallback(() => {
    console.log('Saving:', value);
    saveconfig(value).then(() => {
      notifications.show("Config saved, restart server to reload.", { autoHideDuration: 3000 });
    });
  }, [value, notifications]);

  return (
    <>
      <Button type="button" variant="contained" startIcon={<SaveIcon />} onClick={onSave}> Save</Button>
      <CodeMirror
        value={value}
        theme={monokai}
        // readOnly={true}
        extensions={[basicSetup, yaml()]}
        onChange={onChange}
      />
    </>
  );
}
