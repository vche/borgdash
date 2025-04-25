export function datetime_iso_to_short(datetime?: string | null) {
  if (!datetime) return "";
  const dt = new Date(datetime)
  return (
    `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} `
    + `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes() + 1).padStart(2, '0')}:${String(dt.getSeconds()).padStart(2, '0')} `
  );
}

export const sleep = async (waitTime: number) =>
  new Promise(resolve =>
    setTimeout(resolve, waitTime));
