"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  createEnvironment,
  getProjectEnvironments,
} from "@/lib/services/env.service";
import { getSingleProject } from "@/lib/services/projects.service";
import {
  createProjectGitHostOrigin,
  getConfiguredProjectGitHostProviders,
  initiateProjectGitHostOAuth,
  logoutProjectGitHostOAuth,
  getProjectGitHostOrigins,
  verifyProjectGitHostOAuth,
} from "@/lib/services/githost.service";
import { GitHostProvider } from "@/lib/types";
import { queryClient } from "@/lib/providers/app-provider";
import Loader from "@/components/ui/loader";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type CreateEnvironmentInput = {
  name: string;
  description?: string;
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

export default function EnvironmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHostsOpen, setIsHostsOpen] = useState(false);
  const [isAddOriginOpen, setIsAddOriginOpen] = useState(false);
  const [logoutProvider, setLogoutProvider] = useState<GitHostProvider | null>(
    null,
  );
  const [removeOrigins, setRemoveOrigins] = useState(false);
  const { control, handleSubmit, reset } = useForm<CreateEnvironmentInput>();
  const {
    control: addOriginControl,
    handleSubmit: submitAddOrigin,
    reset: resetAddOrigin,
  } = useForm<{ originName: string; url: string }>({
    defaultValues: {
      originName: "",
      url: "",
    },
  });
  const { id } = use(params);
  const availableProviders: GitHostProvider[] = ["github", "gitlab"];

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getSingleProject(id),
  });

  const { data: projectEnvironments, isLoading: loadingEnvironments } =
    useQuery({
      queryKey: ["project-environments", id],
      queryFn: () => getProjectEnvironments(id),
    });

  const { data: configuredProviders, isLoading: loadingProviders } = useQuery({
    queryKey: ["project-githost-providers", id],
    queryFn: () => getConfiguredProjectGitHostProviders(id),
  });

  const { data: projectOrigins, isLoading: loadingOrigins } = useQuery({
    queryKey: ["project-githost-origins", id],
    queryFn: () => getProjectGitHostOrigins(id),
  });

  const { mutateAsync: _authorizeProvider, isPending: authorizingProvider } =
    useMutation({
      mutationKey: ["authorize-project-githost", id],
      mutationFn: async (provider: GitHostProvider) => {
        const data = await initiateProjectGitHostOAuth(id, provider);
        if (!data?.url) return false;

        window.open(data.url, "_blank", "noopener,noreferrer");

        const startedAt = Date.now();
        const timeoutMs = 5 * 60 * 1000;
        const intervalMs = 3000;

        while (Date.now() - startedAt < timeoutMs) {
          const verify = await verifyProjectGitHostOAuth(id, provider);
          if (verify?.hasOAuth) {
            return true;
          }

          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }

        return false;
      },
      onSuccess(success, provider) {
        if (success) {
          toast.success(`Successfully authorized with ${provider}`);
          queryClient.invalidateQueries({
            queryKey: ["project-githost-providers", id],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-githost-origins", id],
          });
          return;
        }

        toast.error(
          `Authorization with ${provider} failed or timed out. Please try again.`,
        );
      },
    });

  const { mutateAsync: _logoutProvider, isPending: loggingOutProvider } =
    useMutation({
      mutationKey: ["logout-project-githost", id],
      mutationFn: (provider: GitHostProvider) =>
        logoutProjectGitHostOAuth(id, provider, removeOrigins),
      onSuccess(success, provider) {
        if (!success) {
          toast.error(`Failed to remove authorization with ${provider}`);
          return;
        }

        toast.success(`Successfully removed authorization with ${provider}`);
        setLogoutProvider(null);
        setRemoveOrigins(false);
        queryClient.invalidateQueries({
          queryKey: ["project-githost-providers", id],
        });
        queryClient.invalidateQueries({
          queryKey: ["project-githost-origins", id],
        });
      },
    });

  const { mutateAsync: _createEnvironment, isPending: creatingEnvironment } =
    useMutation({
      mutationKey: ["create-environment", id],
      mutationFn: (payload: CreateEnvironmentInput) =>
        createEnvironment(id, payload.name, payload.description),
      onSuccess(data) {
        if (!data) return;

        toast.success("Environment created successfully");
        setIsCreateOpen(false);
        reset();
        queryClient.refetchQueries({
          queryKey: ["project-environments", id],
        });
      },
    });

  const { mutateAsync: _createOrigin, isPending: creatingOrigin } = useMutation(
    {
      mutationKey: ["create-project-origin", id],
      mutationFn: createProjectGitHostOrigin,
      onSuccess(success) {
        if (!success) {
          toast.error("Failed to add git host origin");
          return;
        }

        toast.success("Git host origin added successfully");
        setIsAddOriginOpen(false);
        resetAddOrigin();
        queryClient.invalidateQueries({
          queryKey: ["project-githost-origins", id],
        });
      },
    },
  );

  const handleCreate = (input: CreateEnvironmentInput) => {
    if (creatingEnvironment) return;

    _createEnvironment(input);
  };

  const getProviderFromUrl = (url: string): GitHostProvider | null => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      if (hostname.includes("github.com")) return "github";
      if (hostname.includes("gitlab.com")) return "gitlab";

      return null;
    } catch {
      return null;
    }
  };

  const handleAddOrigin = async (input: {
    originName: string;
    url: string;
  }) => {
    if (creatingOrigin) return;

    const originName = input.originName.trim();
    const originUrl = input.url.trim();

    if (!originName) {
      toast.error("Origin name is required");
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(originUrl);
    } catch {
      toast.error("Invalid URL. Please provide a valid git host URL.");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      toast.error("Only HTTP/HTTPS git host URLs are supported.");
      return;
    }

    const provider = getProviderFromUrl(originUrl);
    if (!provider) {
      toast.error(
        "Unsupported git host URL. Use a GitHub or GitLab repository URL.",
      );
      return;
    }

    if (!(configuredProviders?.includes(provider) ?? false)) {
      toast.error(
        `Project is not authorized with ${provider}. Please authorize it first.`,
      );
      return;
    }

    const duplicateOrigin = projectOrigins?.some(
      (origin) => origin.name.toLowerCase() === originName.toLowerCase(),
    );
    if (duplicateOrigin) {
      toast.error("An origin with this name already exists.");
      return;
    }

    await _createOrigin({
      projectId: id,
      hostName: originName,
      hostUrl: originUrl,
    });
  };

  if (loadingProject) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {project?.name} Environments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage environments for {project?.name}.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Environment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Environment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="environment-name">Environment name</Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: "This field is required",
                    },
                  }}
                  render={({
                    field: { value, onBlur, onChange },
                    fieldState: { error },
                  }) => (
                    <Input
                      id="environment-name"
                      placeholder="Production"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      helperText={error?.message}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment-description">
                  Environment description
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({
                    field: { value, onBlur, onChange },
                    fieldState: { error },
                  }) => (
                    <Textarea
                      id="environment-description"
                      className="min-h-32!"
                      placeholder="Environment for production deployments"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      helperText={error?.message}
                    />
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(handleCreate)}
                loading={creatingEnvironment}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Configured Git Hosts</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Git providers linked to this project.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isHostsOpen} onOpenChange={setIsHostsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Origins
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configured Origins</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  {loadingOrigins ? (
                    <Loader />
                  ) : !projectOrigins?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No origins configured for this project.
                    </p>
                  ) : (
                    projectOrigins.map((origin) => (
                      <div
                        key={origin.id}
                        className="rounded-md border p-3 text-sm"
                      >
                        <p className="font-medium">{origin.name}</p>
                        <p className="text-muted-foreground">
                          {origin.githost}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {origin.repoUrl}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAddOriginOpen}
              onOpenChange={(open) => {
                setIsAddOriginOpen(open);
                if (!open) resetAddOrigin();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">Add Origin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Git Host Origin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="origin-name">Origin name</Label>
                    <Controller
                      name="originName"
                      control={addOriginControl}
                      rules={{
                        required: {
                          value: true,
                          message: "This field is required",
                        },
                      }}
                      render={({
                        field: { value, onBlur, onChange },
                        fieldState: { error },
                      }) => (
                        <Input
                          id="origin-name"
                          placeholder="web"
                          value={value}
                          onBlur={onBlur}
                          onChange={onChange}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="origin-url">Repository URL</Label>
                    <Controller
                      name="url"
                      control={addOriginControl}
                      rules={{
                        required: {
                          value: true,
                          message: "This field is required",
                        },
                      }}
                      render={({
                        field: { value, onBlur, onChange },
                        fieldState: { error },
                      }) => (
                        <Input
                          id="origin-url"
                          placeholder="https://github.com/acme/web"
                          value={value}
                          onBlur={onBlur}
                          onChange={onChange}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Only GitHub and GitLab repository URLs are supported, and
                    the matching provider must already be authorized for this
                    project.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddOriginOpen(false);
                      resetAddOrigin();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    loading={creatingOrigin}
                    onClick={submitAddOrigin(handleAddOrigin)}
                  >
                    Add Origin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProviders ? (
            <Loader />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {availableProviders.map((provider) => {
                const isConfigured =
                  configuredProviders?.includes(provider) ?? false;

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium capitalize">
                        {provider}
                      </p>
                      <Badge variant={isConfigured ? "secondary" : "outline"}>
                        {isConfigured ? "Configured" : "Not configured"}
                      </Badge>
                    </div>

                    {isConfigured ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={authorizingProvider || loggingOutProvider}
                        onClick={() => setLogoutProvider(provider)}
                      >
                        Logout
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        loading={authorizingProvider}
                        disabled={authorizingProvider || loggingOutProvider}
                        onClick={() => _authorizeProvider(provider)}
                      >
                        Authorize
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!logoutProvider}
        onOpenChange={(open) => {
          if (!open) {
            setLogoutProvider(null);
            setRemoveOrigins(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Logout {logoutProvider}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Remove this project&apos;s authorization with {logoutProvider}.
            </p>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Remove associated origins</p>
                <p className="text-xs text-muted-foreground">
                  This also deletes origins linked to this provider.
                </p>
              </div>
              <Switch
                checked={removeOrigins}
                onCheckedChange={setRemoveOrigins}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLogoutProvider(null);
                setRemoveOrigins(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={loggingOutProvider}
              onClick={() => logoutProvider && _logoutProvider(logoutProvider)}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loadingEnvironments ? (
        <Loader />
      ) : !projectEnvironments?.length ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-semibold">No environments yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first environment to get started.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Environment
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Environments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Environment</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEnvironments.map((env) => (
                  <TableRow key={env.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getEnvBadgeVariant(env.name)}>
                          {env.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      v{env.latestVersion}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {env.lastUpdated}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/project/${id}/environments/${env.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                        >
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
