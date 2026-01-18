import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Calendar, FolderPlus, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.message || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin Created" });
      setOpen(false);
      setEmail(""); setPassword(""); setName("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> New Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Admin</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        </div>
        <DialogFooter>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({ 
      queryKey: ["sessions"], 
      queryFn: () => fetch("/api/sessions").then(r => r.json()) 
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isActive: false }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Session Created" });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setOpen(false);
      setName("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
        const res = await fetch(`/api/sessions/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editName }),
        });
        if (!res.ok) throw new Error("Failed");
        return res.json();
    },
    onSuccess: () => {
        toast({ title: "Session Renamed" });
        queryClient.invalidateQueries({ queryKey: ["active-session"] });
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        setEditingId(null);
    }
  });

  const activateMutation = useMutation({
      mutationFn: async (id: number) => {
          const res = await fetch(`/api/sessions/${id}/active`, { method: "POST" });
          if (!res.ok) throw new Error("Failed");
          return res.json();
      },
      onSuccess: () => {
          toast({ title: "Session Activated" });
          queryClient.invalidateQueries({ queryKey: ["active-session"] });
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
      }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" /> Manage Sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>Manage Sessions</DialogTitle>
            <DialogDescription>Create new or rename existing sessions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
              <Label>New Session Name</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2026-27" />
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Add</Button>
              </div>
          </div>
          
          <div className="border rounded-md max-h-[200px] overflow-y-auto">
             {sessions?.map((s: any) => (
                 <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50">
                     {editingId === s.id ? (
                         <div className="flex items-center gap-2 flex-1">
                             <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8" />
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateMutation.mutate()}><Check className="w-4 h-4" /></Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                         </div>
                     ) : (
                         <div className="flex items-center gap-2 flex-1">
                             <span className={s.isActive ? "font-bold text-primary" : ""}>{s.name} {s.isActive && "(Active)"}</span>
                         </div>
                     )}
                     
                     {!editingId && (
                         <div className="flex gap-1">
                             {!s.isActive && <Button size="sm" variant="ghost" onClick={() => activateMutation.mutate(s.id)}>Activate</Button>}
                             <Button size="icon" variant="ghost" onClick={() => { setEditingId(s.id); setEditName(s.name); }}>
                                 <Edit2 className="w-4 h-4 text-muted-foreground" />
                             </Button>
                         </div>
                     )}
                 </div>
             ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
        const sessionRes = await fetch("/api/sessions/active");
        const session = await sessionRes.json();
        
        if (!session) throw new Error("No active session found. Create/Activate a session first.");

        const res = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, sessionId: session.id }),
        });
        if (!res.ok) throw new Error("Failed");
        return res.json();
    },
    onSuccess: () => {
      toast({ title: "Class Created" });
      setOpen(false);
      setName("");
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive"});
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="h-4 w-4" /> New Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Class</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Class Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Will be added to the active session.</p>
        </div>
        <DialogFooter>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
