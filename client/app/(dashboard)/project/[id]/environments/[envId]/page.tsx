"use client";

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { VariablesTab } from "@/components/environments/variables-tab";
import { VersionsTab } from "@/components/environments/versions-tab";
import { ActivityTab } from "@/components/environments/activity-tab";
import {
  getEnvFileKeys,
  getProjectEnvironmentBySlug,
} from "@/lib/services/env.service";
import { getSingleProject } from "@/lib/services/projects.service";
import Loader from "@/components/ui/loader";

function getEnvBadgeVariant(name: string) {
  switch (name.toLowerCase()) {
    case "production":
      return "destructive" as const;
    case "staging":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default function EnvironmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string; envId: string }>;
}) {
  const searchParams = useSearchParams();
  const { id, envId } = use(params);

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getSingleProject(id),
  });

  const { data: environment, isLoading: loadingEnvironment } = useQuery({
    queryKey: ["project-environment", id, envId],
    queryFn: () => getProjectEnvironmentBySlug(id, envId),
  });

  const rawVersionParam = searchParams.get("version");
  const parsedVersion = Number(rawVersionParam);
  const versionNumber =
    rawVersionParam && Number.isFinite(parsedVersion) && parsedVersion > 0
      ? parsedVersion
      : environment?.latestVersion;

  const { data: envKeys, isLoading: loadingEnvKeys } = useQuery({
    queryKey: ["env-keys", id, envId, versionNumber],
    queryFn: () => getEnvFileKeys(id, envId, versionNumber!),
    enabled: !!versionNumber,
  });

  if (loadingEnvironment || !environment) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/project/${id}/environments`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to environments
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {environment.name}
          </h1>
          <Badge variant={getEnvBadgeVariant(environment.name)}>
            {environment.name}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {project?.name} &middot; Version {versionNumber} &middot;{" "}
          {loadingEnvKeys ? "..." : (envKeys?.length ?? 0)} variables
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="variables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="variables">
          <VariablesTab
            envKeys={envKeys ?? []}
            isLoading={loadingEnvKeys}
            projectId={id}
            envSlug={envId}
            versionNumber={versionNumber!}
          />
        </TabsContent>
        <TabsContent value="versions">
          <VersionsTab
            projectId={id}
            envSlug={envId}
            latestVersion={environment.latestVersion}
          />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
