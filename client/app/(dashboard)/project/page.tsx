"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Layers,
  Clock,
  Trash2,
  Settings,
  FolderKanban,
} from "lucide-react";
import { projects } from "@/lib/data/mock-data";
import { toast } from "sonner";
import { Organization } from "@/lib/types";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserOrganizations } from "@/lib/services/org.service";
import { Textarea } from "@/components/ui/textarea";
import { createProject, getProjects } from "@/lib/services/projects.service";
import { queryClient } from "@/lib/providers/app-provider";
import { useRouter } from "next/navigation";
import { set } from "date-fns";
import Loader from "@/components/ui/loader";

type CreateProjectInput = {
  name: string;
  organization: Organization;
  description?: string;
};

export default function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { control, handleSubmit, watch, setValue } =
    useForm<CreateProjectInput>();
  const selectedOrg = watch("organization");
  const router = useRouter();

  const onSelectOrg = (orgId: string) => {
    setValue("organization", organizations?.find((org) => org.id === orgId)!);
  };

  const handleCreate = (input: CreateProjectInput) => {
    if (_creatingProject) return;

    if (!selectedOrg) {
      toast.error("Please select an organization");
      return;
    }

    _createProject({
      name: input.name,
      description: input.description,
      organizationId: input.organization.id,
    });
  };

  const { data: organizations, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: getUserOrganizations,
  });

  const { mutateAsync: _createProject, isPending: _creatingProject } =
    useMutation({
      mutationFn: createProject,
      mutationKey: ["create-project"],
      onSuccess(data) {
        toast.success("Project created successfully");
        setIsCreateOpen(false);
        queryClient.refetchQueries({
          predicate({ queryKey }) {
            return queryKey.includes("projects");
          },
        });
        router.push(`/project/${data?.id}/environments`);
      },
    });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your projects and their environment configurations.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
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
                  }) => {
                    return (
                      <Input
                        id="project-name"
                        placeholder="My Project"
                        helperText={error?.message}
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                      />
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Project description</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({
                    field: { value, onBlur, onChange },
                    fieldState: { error },
                  }) => {
                    return (
                      <Textarea
                        className="!min-h-40"
                        id="project-description"
                        placeholder="My Project is a great project that..."
                        helperText={error?.message}
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                      />
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  disabled={loadingOrgs || !organizations?.length}
                  value={loadingOrgs ? "loading" : selectedOrg?.id}
                  onValueChange={onSelectOrg}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingOrgs
                          ? "Loading..."
                          : !organizations?.length
                            ? "No organizations available"
                            : "Select an organization"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  onClick={handleSubmit(handleCreate)}
                  loading={_creatingProject}
                >
                  Create
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingProjects ? (
        <Loader />
      ) : projects?.length === 0 || !projects ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Link key={project.id} href={`/project/${project.id}/environments`}>
              <Card className="group cursor-pointer transition-colors hover:border-foreground/10">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {project.orgName}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Project actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Settings className="mr-2 h-3.5 w-3.5" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => e.stopPropagation()}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3" />
                      {project.environments} environments
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {project.lastUpdated}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
