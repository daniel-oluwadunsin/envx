"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Trash2,
  Pencil,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getEnvValue } from "@/lib/services/env.service";

type VariablesTabProps = {
  envKeys: string[];
  isLoading: boolean;
  projectId: string;
  envSlug: string;
  versionNumber: number;
};

export function VariablesTab({
  envKeys,
  isLoading,
  projectId,
  envSlug,
  versionNumber,
}: VariablesTabProps) {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [valuesByKey, setValuesByKey] = useState<Record<string, string>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const getScopedKey = (key: string) => `${versionNumber}:${key}`;

  const toggleReveal = async (key: string) => {
    const scopedKey = getScopedKey(key);

    if (!valuesByKey[scopedKey]) {
      setLoadingKeys((prev) => new Set(prev).add(scopedKey));
      try {
        const value = await getEnvValue(projectId, envSlug, key, versionNumber);
        setValuesByKey((prev) => ({
          ...prev,
          [scopedKey]: value ?? "",
        }));
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(scopedKey);
          return next;
        });
      }
    }

    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(scopedKey)) next.delete(scopedKey);
      else next.add(scopedKey);
      return next;
    });
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const handleAddVariable = () => {
    if (!newKey.trim()) return;
    toast.success(`Variable "${newKey}" added`);
    setNewKey("");
    setNewValue("");
  };

  const filtered = envKeys.filter((key) =>
    key.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter variables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading variables...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No variables found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((key) => {
                const scopedKey = getScopedKey(key);
                const isLoadingKey = loadingKeys.has(scopedKey);
                const value = valuesByKey[scopedKey] ?? "";
                const isRevealed = revealedKeys.has(scopedKey);

                return (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-sm font-medium">
                      {key}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="max-w-xs truncate">
                          {isLoadingKey
                            ? "Loading..."
                            : isRevealed
                              ? value
                              : value
                                ? "•".repeat(Math.min(value.length, 32))
                                : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => toggleReveal(key)}
                          disabled={isLoadingKey}
                        >
                          {isLoadingKey ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isRevealed ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          <span className="sr-only">Toggle visibility</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleCopy(value)}
                          disabled={!value || isLoadingKey}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy value</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Variable actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
