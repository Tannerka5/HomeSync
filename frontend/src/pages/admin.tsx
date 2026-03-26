import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type KeyResult = {
  label: string;
  current: number;
  target: number;
};

type OkrData = {
  objective: string;
  keyResults: KeyResult[];
};

export default function AdminPage() {
  const [data, setData] = useState<OkrData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin · HomeSync";
    fetch("/api/admin/okr", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load OKR data.");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track platform health at a glance.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading OKR data...</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Objective</CardTitle>
            <CardDescription className="text-base">
              {data.objective}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.keyResults.map((kr) => {
              const pct = Math.min(
                Math.round((kr.current / kr.target) * 100),
                100
              );
              return (
                <div key={kr.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{kr.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {kr.current} / {kr.target} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
