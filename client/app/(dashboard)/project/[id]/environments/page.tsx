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
import { queryClient } from "@/lib/providers/app-provider";
import Loader from "@/components/ui/loader";
import { toast } from "sonner";

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
  const { control, handleSubmit, reset } = useForm<CreateEnvironmentInput>();
  const { id } = use(params);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getSingleProject(id),
  });

  const { data: projectEnvironments, isLoading: loadingEnvironments } =
    useQuery({
      queryKey: ["project-environments", id],
      queryFn: () => getProjectEnvironments(id),
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

  const handleCreate = (input: CreateEnvironmentInput) => {
    if (creatingEnvironment) return;

    _createEnvironment(input);
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
