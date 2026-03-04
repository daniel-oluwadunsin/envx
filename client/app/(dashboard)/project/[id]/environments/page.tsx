"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
  Settings,
  ArrowRight,
} from "lucide-react";
import { environments, projects } from "@/lib/data/mock-data";

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
  const { id } = use(params);
  const project = projects.find((p) => p.id === id) || projects[0];
  const projectEnvironments = environments.filter(
    (e) => e.projectId === project.id,
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {project.name} Environments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage environments for {project.name}.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Environment
        </Button>
      </div>

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
                <TableHead>Variables</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    {env.variableCount} variables
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {env.lastUpdated}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/project/${project.id}/environments/${env.id}`}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-3.5 w-3.5" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
