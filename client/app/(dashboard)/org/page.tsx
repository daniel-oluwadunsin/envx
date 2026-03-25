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
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Users, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createOrganization,
  getUserOrganizations,
} from "@/lib/services/org.service";
import Loader from "@/components/ui/loader";
import { queryClient } from "@/lib/providers/app-provider";

export default function OrganizationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");

  const { data: organizations = [], isPending: isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: getUserOrganizations,
  });

  const { isPending: _creatingOrganization, mutateAsync: _create } =
    useMutation({
      mutationKey: ["createOrganization"],
      mutationFn: async (name: string) => {
        return createOrganization(name);
      },
      onSuccess() {
        toast.success(`Organization "${orgName}" created`);
        setOrgName("");
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "organizations",
        });
        setIsCreateOpen(false);
      },
    });

  const handleCreate = () => {
    if (!orgName.trim()) return;
    _create(orgName.trim());
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organizations and team workspaces.
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(isOpen) => setIsCreateOpen(isOpen)}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  placeholder="My Organization"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} loading={_creatingOrganization}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Loader />
        ) : (
          organizations.map((org) => (
            <Link key={org.id} href={`/org/${org.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-foreground/20 h-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                      <Building2 className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{org.name}</CardTitle>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs font-normal capitalize"
                  >
                    {org.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {org.membersCount} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {org.projectsCount} projects
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
