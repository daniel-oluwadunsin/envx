"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Mail,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getOrganization,
  getOrganizationMembers,
  inviteMember,
  removeMember,
} from "@/lib/services/org.service";
import Loader from "@/components/ui/loader";
import { useUserInfo } from "@/lib/hooks/use-user-info";
import { queryClient } from "@/lib/providers/app-provider";

export default function OrgDetailsPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const { user } = useUserInfo();
  const params = useParams();
  const orgId = params.id as string;

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
  });
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["organization", orgId, "members"],
    queryFn: () => getOrganizationMembers(orgId),
  });

  const { mutateAsync: _inviteMember, isPending: _invitingMember } =
    useMutation({
      mutationKey: ["inviteMember", orgId],
      mutationFn: (email: string) => inviteMember(orgId, email),
      onSuccess: () => {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      },
      onError(error) {
        setInviteEmail("");
      },
    });

  const { mutateAsync: _deleteMember, isPending: _deletingMember } =
    useMutation({
      mutationKey: ["deleteMember", orgId, memberToDelete],
      mutationFn: (memberId: string) => removeMember(orgId, memberId),
      onSuccess: (_, memberId) => {
        const member = members?.find((m) => m.id === memberId);
        if (member) {
          toast.success(
            `${member.name} has been removed from the organization`,
          );
          setMemberToDelete(null);
        }

        queryClient.removeQueries({
          predicate: ({ queryKey }) =>
            queryKey.join() === ["organization", orgId, "members"].join(),
        });
      },
    });

  if (isLoading) {
    return <Loader />;
  }

  if (!org) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/org">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    _inviteMember(inviteEmail);
  };

  const handleDeleteMember = (memberId: string) => {
    _deleteMember(memberId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/org">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
            <Building2 className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Organization ID
              </p>
              <p className="text-sm font-mono mt-1">{org.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Created
              </p>
              <p className="text-sm mt-1">{org.createdAt}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Team Members
              </p>
              <p className="text-sm mt-1">{org.membersCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage your organization's team members
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    An invitation link will be sent to this email address
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={_invitingMember}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleInvite} loading={_invitingMember}>
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                        {member.id === user?.id && (
                          <Badge variant="destructive" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role == "member"
                            ? "default"
                            : member.role === "owner"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs font-normal capitalize"
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "owner" && org.ownerId === user?.id && (
                        <AlertDialog open={memberToDelete === member.id}>
                          <button
                            onClick={() => setMemberToDelete(member.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove team member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {`Are you sure you want to remove ${member.name} from ${org.name}? This action cannot be undone.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel
                              onClick={() => setMemberToDelete(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
