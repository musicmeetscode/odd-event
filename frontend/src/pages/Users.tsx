
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { User, UserRole } from "@/types/api";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, KeyRound, UserCog, Shield, ShieldAlert, BadgeCheck, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  judge: "bg-purple-100 text-purple-700 border-purple-200",
  speaker: "bg-blue-100 text-blue-700 border-blue-200",
  attendee: "bg-slate-100 text-slate-700 border-slate-200",
};

const Users = () => {
  const queryClient = useQueryClient();
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.listUsers(),
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      toast.success("User role updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      toast.error("Failed to update role.");
    },
  });

  const resetPassMut = useMutation({
    mutationFn: (data: { user_id: number; new_password: string }) =>
      adminService.adminResetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully. The user will be required to change it on next login.");
      setResetUserId(null);
      setNewPassword("");
    },
    onError: () => {
      toast.error("Failed to reset password. Ensure it has at least 6 characters.");
    },
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully.");
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      // Also invalidate dashboard stats since user count changed
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardStats"] });
    },
    onError: () => {
      toast.error("Failed to delete user.");
    },
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
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 flex items-center gap-1">
                            {user.display_name}
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
                          <DropdownMenuItem onClick={() => setResetUserId(user.id)}>
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
                                    onClick={() => updateRoleMut.mutate({ id: user.id, role: r as UserRole })}
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
                            onClick={() => setDeleteUserId(user.id)}
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
