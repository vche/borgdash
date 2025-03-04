"use client"
import Button from '@mui/material/Button';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from '@mui/material/CardActions';
import Typography from "@mui/material/Typography";
import type { tBorgRepo } from "@/lib/report";
import Grid from "@mui/material/Grid2";
import { useRouter } from 'next/navigation'

export default function RepoCard({ repo }: { repo: tBorgRepo }) {
  const router = useRouter()
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" component="div" sx={{ mt: 1, mb: 2 }} align="center">
            {repo.name}
          </Typography>
          <Typography
            sx={{ color: "text.secondary", fontSize: 14 }}
          >
            Last run: {repo.last_run ? "[pipo] [ok/nok + line color]" : "-"}
          </Typography>
          <Typography
            sx={{ color: "text.secondary", fontSize: 14, my: 1 }}
          >
            Last backup: {repo.last_backup ? "[pipognou] [ok/nok + line color]" : "-"}
          </Typography>
          {/* + sizes */}
        </CardContent>
        <CardActions>
          <Button variant="contained" size="small" fullWidth
            onClick={() => { router.push(`/repos/${repo.name}/pipo`); }}
          >
            Open repo
          </Button>
        </CardActions>
      </Card>
    </Grid >
  );
}
