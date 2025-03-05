"use client"
import Typography from "@mui/material/Typography";
// import { type SidebarFooterProps } from '@toolpad/core/DashboardLayout';
import { type tBorgReport } from "@/lib/report";

export default function SidebarFooter({ report }: { report: tBorgReport }) {
  const timestamp = report?.timestamp;
  // header = mini ? " " : "Backup report generated on ";
  return (
    <Typography variant="caption" sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {timestamp ? `Backup report generated on  ${timestamp}` : ""}
    </Typography>
  );
}

// export default function SidebarFooter({ mini }: SidebarFooterProps) {
//   return (
//     <Typography
//       variant="caption"
//       sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
//     >
//       {mini ? '© MUI' : `© ${new Date().getFullYear()} Made with love by MUI`}
//     </Typography>
//   );
// }
