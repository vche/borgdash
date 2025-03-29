import * as React from "react";
import { get_text_config } from "@/lib/config";
import ConfigEditor from "@/components/config_editor";

export default async function Page() {
  const config_data = await get_text_config();
  return (
    <ConfigEditor config_data={config_data} />
  );
}
