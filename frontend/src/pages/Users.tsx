
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { User, UserRole } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, KeyRound, UserCog, Shield, BadgeCheck, AlertCircle, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  judge: "bg-purple-100 text-purple-700 border-purple-200",
  speaker: "bg-blue-100 text-blue-700 border-blue-200",
  attendee: "bg-slate-100 text-slate-700 border-slate-200",
};

const PAGE_SIZE = 20;

const Users = () => {
  const queryClient = useQueryClient();
  const [resetUserId, setResetUserId] = useState<string | number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.listUsers(),
  });

  // ─── Filtered + Paginated users ───
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch = !searchQuery ||
        (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleRoleFilter = (val: string) => { setRoleFilter(val); setCurrentPage(1); };

  // ─── Role counts ───
  const roleCounts = useMemo(() => {
    if (!users) return { all: 0, admin: 0, judge: 0, speaker: 0, attendee: 0 };
    return {
      all: users.length,
      admin: users.filter(u => u.role === "admin").length,
      judge: users.filter(u => u.role === "judge").length,
      speaker: users.filter(u => u.role === "speaker").length,
      attendee: users.filter(u => u.role === "attendee").length,
    };
  }, [users]);

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string | number; role: UserRole }) =>
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      toast.success("User role updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update role."),
  });

  const resetPassMut = useMutation({
    mutationFn: (data: { user_id: string | number; new_password: string }) =>
      adminService.adminResetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully.");
      setResetUserId(null);
      setNewPassword("");
    },
    onError: () => toast.error("Failed to reset password."),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: string | number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully.");
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardStats"] });
    },
    onError: () => toast.error("Failed to delete user."),
  });

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetUserId && newPassword.length >= 6) {
      resetPassMut.mutate({ user_id: resetUserId, new_password: newPassword });
    } else {
      toast.error("Password must be at least 6 characters.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system accounts, roles, and security.</p>
        </div>
        <Button className="bg-[#1e293b] hover:bg-slate-800">
          <UserCog className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search + Role Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "admin", "judge", "speaker", "attendee"] as const).map(r => (
            <Button
              key={r}
              variant={roleFilter === r ? "default" : "outline"}
              size="sm"
              onClick={() => handleRoleFilter(r)}
              className="h-10 text-xs px-3 gap-1.5"
            >
              {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
              <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px] font-mono rounded-full">
                {roleCounts[r as keyof typeof roleCounts]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6 font-semibold">User</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    {searchQuery || roleFilter !== "all" ? "No users match your filter." : "No users found."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.uuid || user.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 flex items-center gap-1">
                            {user.display_name || user.username}
                            {user.is_flagged && <span title="Non-conventional name flagged by system" className="cursor-help">🚩</span>}
                          </p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {user.email || <span className="text-slate-400 italic">No email</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wider ${
                          ROLE_COLORS[user.role] || ROLE_COLORS.attendee
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 group-hover:bg-slate-100">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setResetUserId(user.uuid || user.id)}>
                            <KeyRound className="h-4 w-4 mr-2 text-slate-500" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="h-4 w-4 mr-2 text-slate-500" />
                              Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {["attendee", "speaker", "judge", "admin"].map((r) => (
                                  <DropdownMenuItem 
                                    key={r}
                                    onClick={() => updateRoleMut.mutate({ id: user.uuid || user.id, role: r as UserRole })}
                                    disabled={user.role === r}
                                  >
                                    <span className="capitalize">{r}</span>
                                    {user.role === r && <BadgeCheck className="w-4 h-4 ml-auto text-blue-500" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteUserId(user.uuid || user.id)}
                            className="text-red-500 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredUsers.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-1 text-xs text-muted-foreground">…</span>
                      )}
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetUserId} onOpenChange={(open) => !open && setResetUserId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Assign a new temporary password. The user will be required to change it immediately upon their next login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="text"
                autoComplete="off"
                placeholder="e.g. TempPass123!"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3" /> Must be at least 6 characters long
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetUserId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetPassMut.isPending || newPassword.length < 6}>
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This will deactivate their account and hide them from the platform. This action is not easily reversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteUserId && deleteUserMut.mutate(deleteUserId)}
              disabled={deleteUserMut.isPending}
            >
              {deleteUserMut.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
