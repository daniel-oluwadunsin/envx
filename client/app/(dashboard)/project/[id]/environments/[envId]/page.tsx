"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { VariablesTab } from "@/components/environments/variables-tab";
import { VersionsTab } from "@/components/environments/versions-tab";
import { ActivityTab } from "@/components/environments/activity-tab";
import {
  deploySecrets,
  getEnvFileKeys,
  getProjectEnvironmentBySlug,
} from "@/lib/services/env.service";
import { getSingleProject } from "@/lib/services/projects.service";
import { getProjectGitHostOrigins } from "@/lib/services/githost.service";
import Loader from "@/components/ui/loader";
import { queryClient } from "@/lib/providers/app-provider";
import { EnvDeployTarget } from "@/lib/types/api";
import { toast } from "sonner";

type DeploySecretsInput = {
  originName: string;
  deployTarget: EnvDeployTarget;
  githostEnvironment?: string;
  version: number;
  merge: boolean;
};

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
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const searchParams = useSearchParams();
  const { id, envId } = use(params);
  const { control, handleSubmit, reset, watch } = useForm<DeploySecretsInput>({
    defaultValues: {
      deployTarget: "action",
      merge: true,
      version: 1,
    },
  });

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

  const { data: origins, isLoading: loadingOrigins } = useQuery({
    queryKey: ["project-githost-origins", id],
    queryFn: () => getProjectGitHostOrigins(id),
  });

  const selectedTarget = watch("deployTarget");

  const latestVersion = useMemo(
    () => environment?.latestVersion ?? 1,
    [environment?.latestVersion],
  );

  const { mutateAsync: _deploySecrets, isPending: deployingSecrets } =
    useMutation({
      mutationKey: ["deploy-secrets", id, envId],
      mutationFn: deploySecrets,
      onSuccess(success) {
        if (!success) {
          toast.error("Failed to deploy secrets");
          return;
        }

        toast.success("Secrets deployed successfully");
        setIsDeployOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["env-keys", id, envId],
          exact: false,
        });
      },
    });

  const handleDeploy = async (input: DeploySecretsInput) => {
    if (deployingSecrets) return;

    if (input.version > latestVersion) {
      toast.error(
        `Specified version ${input.version} does not exist. Latest version is ${latestVersion}.`,
      );
      return;
    }

    if (
      input.deployTarget === "environment" &&
      !input.githostEnvironment?.trim()
    ) {
      toast.error(
        "Git host environment is required when deploy target is environment.",
      );
      return;
    }

    await _deploySecrets({
      projectId: id,
      envSlug: envId,
      githostOrigin: input.originName,
      deployTarget: input.deployTarget,
      githostEnvironment:
        input.deployTarget === "environment"
          ? input.githostEnvironment
          : undefined,
      version: input.version,
      noMerge: !input.merge,
    });
  };

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

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {environment.name}
            </h1>
            <Badge variant={getEnvBadgeVariant(environment.name)}>
              {environment.name}
            </Badge>
          </div>

          <Dialog
            open={isDeployOpen}
            onOpenChange={(open) => {
              setIsDeployOpen(open);
              if (open) {
                reset({
                  deployTarget: "action",
                  merge: true,
                  version: latestVersion,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={
                  loadingOrigins || !origins?.length || deployingSecrets
                }
              >
                Deploy Secrets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deploy Secrets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Controller
                    name="originName"
                    control={control}
                    rules={{ required: "Origin is required" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loadingOrigins || !origins?.length}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingOrigins
                                  ? "Loading origins..."
                                  : "Select an origin"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {origins?.map((origin) => (
                              <SelectItem key={origin.id} value={origin.name}>
                                {origin.name} ({origin.githost})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error?.message ? (
                          <p className="pl-2 text-[.8rem] text-red-500">
                            {fieldState.error.message}
                          </p>
                        ) : null}
                      </>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deploy as</Label>
                  <Controller
                    name="deployTarget"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select deploy target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="action">Action secrets</SelectItem>
                          <SelectItem value="environment">
                            Environment secrets
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {selectedTarget === "environment" ? (
                  <div className="space-y-2">
                    <Label htmlFor="githost-environment">
                      Git host environment name
                    </Label>
                    <Controller
                      name="githostEnvironment"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="githost-environment"
                          placeholder="production"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="deploy-version">Version</Label>
                  <Controller
                    name="version"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="deploy-version"
                        type="number"
                        min={1}
                        max={latestVersion}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Latest available version is {latestVersion}.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Merge secrets</p>
                    <p className="text-xs text-muted-foreground">
                      Disable this to remove secrets on the origin that are not
                      present in the selected env version.
                    </p>
                  </div>
                  <Controller
                    name="merge"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeployOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit(handleDeploy)}
                  loading={deployingSecrets}
                >
                  Deploy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
