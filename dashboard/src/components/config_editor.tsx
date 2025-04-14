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

export async function readtextconfig() {
  const response = await fetch("/api/config?format=text&force=true", { method: "get" });
  return await response.json()
}

export default function ConfigEditor() {
  // code mirror Doc: https://uiwjs.github.io/react-codemirror/
  const notifications = useNotifications();
  const [value, setValue] = React.useState("");
  const onChange = React.useCallback((val: string) => { setValue(val); }, []);
  const onSave = React.useCallback(() => {
    saveconfig(value).then(() => {
      notifications.show("Config saved and reloaded.", { autoHideDuration: 3000 });
    });
  }, [value, notifications]);

  React.useEffect(() => {
    readtextconfig().then((data) => {
      setValue(data.configdata);
    }).catch((error) => {
      console.log(error);
    });
  }, []);

  return (
    <>
      <Button type="button" variant="contained" startIcon={<SaveIcon />} onClick={onSave}>Save</Button>
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
