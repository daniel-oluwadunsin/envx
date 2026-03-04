"use client";

import { activityLogs } from "@/lib/data/mock-data";

export function ActivityTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Recent activity for this environment.
      </p>
      <div className="rounded-md border border-border">
        <div className="divide-y divide-border">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-chart-2" />
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">by {log.user}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
