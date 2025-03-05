import { load_report_data } from "@/lib/report";
import Grid from "@mui/material/Grid2";
import RepoCard from "@/components/repo_card"

export default async function Home() {
  const report_data = await load_report_data();
  return (
    <Grid container spacing={3}>
      {report_data && report_data.repos
        ? Object.values(report_data.repos).map((repo) => (<RepoCard repo={repo} key={`${repo.name}`} />))
        : "No data, consider a manual refresh and/or check the reporter logs."}
    </Grid>
  );
}
