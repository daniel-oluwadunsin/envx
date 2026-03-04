"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Download } from "lucide-react";
import { envVersions } from "@/lib/data/mock-data";
import { toast } from "sonner";

export function VersionsTab() {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Changes</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {envVersions.map((version, idx) => (
            <TableRow key={version.id}>
              <TableCell className="font-mono text-sm font-medium">
                <div className="flex items-center gap-2">
                  v{version.version}
                  {idx === 0 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Latest
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {version.createdBy}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {version.changes} {version.changes === 1 ? "change" : "changes"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {version.createdAt}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() =>
                      toast.success(`Restored to v${version.version}`)
                    }
                    disabled={idx === 0}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() =>
                      toast.success(`Downloaded v${version.version}`)
                    }
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
