"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { activityLogs } from "@/lib/data/mock-data";

export default function ActivityPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all actions across your environments and projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {log.project}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.environment}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.user}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {log.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
