"use client";

import Link from "next/link";
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
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getEnvVersions, restoreEnvVersion } from "@/lib/services/env.service";
import { queryClient } from "@/lib/providers/app-provider";

type VersionsTabProps = {
  projectId: string;
  envSlug: string;
  latestVersion: number;
};

export function VersionsTab({
  projectId,
  envSlug,
  latestVersion,
}: VersionsTabProps) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ["env-versions", projectId, envSlug],
    queryFn: () => getEnvVersions(projectId, envSlug),
  });

  const { mutateAsync: _restoreEnvVersion, isPending: restoringVersion } =
    useMutation({
      mutationKey: ["restore-env-version", projectId, envSlug],
      mutationFn: (version: number) =>
        restoreEnvVersion(projectId, envSlug, version),
      onSuccess() {
        toast.success("Environment restored successfully");
        queryClient.invalidateQueries({
          queryKey: ["env-versions", projectId, envSlug],
        });
        queryClient.invalidateQueries({
          queryKey: ["project-environment", projectId, envSlug],
        });
      },
    });

  const handleRestore = (version: number) => {
    if (restoringVersion || version === latestVersion) return;

    _restoreEnvVersion(version);
  };

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Changelog</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                Loading versions...
              </TableCell>
            </TableRow>
          ) : !versions?.length ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                No versions found.
              </TableCell>
            </TableRow>
          ) : (
            versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-mono text-sm font-medium">
                  <div className="flex items-center gap-2">
                    v{version.version}
                    {version.version === latestVersion && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Latest
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {version.createdBy?.name ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {version.changelog || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/project/${projectId}/environments/${envSlug}?version=${version.version}`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => handleRestore(version.version)}
                      disabled={
                        version.version === latestVersion || restoringVersion
                      }
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
