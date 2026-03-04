"use client";

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { environments, projects } from "@/lib/data/mock-data";
import { VariablesTab } from "@/components/environments/variables-tab";
import { VersionsTab } from "@/components/environments/versions-tab";
import { AccessTab } from "@/components/environments/access-tab";
import { ActivityTab } from "@/components/environments/activity-tab";

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
  const { id, envId } = use(params);
  const project = projects.find((p) => p.id === id) || projects[0];
  const environment =
    environments.find((e) => e.id === envId) || environments[0];
  const projectEnvironments = environments.filter(
    (e) => e.projectId === project.id,
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/project/${project.id}/environments`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to environments
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {environment.name}
            </h1>
            <Badge variant={getEnvBadgeVariant(environment.name)}>
              {environment.name}
            </Badge>
          </div>
          <Select defaultValue={environment.id}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectEnvironments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.name} &middot; Version {environment.latestVersion} &middot;{" "}
          {environment.variableCount} variables
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="variables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="variables">
          <VariablesTab />
        </TabsContent>
        <TabsContent value="versions">
          <VersionsTab />
        </TabsContent>
        <TabsContent value="access">
          <AccessTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
