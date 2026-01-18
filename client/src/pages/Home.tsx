import { StudentTable } from "@/components/StudentTable";
import { StudentCard } from "@/components/StudentCard";
import { CreateStudentDialog } from "@/components/CreateStudentDialog";
import { CreateSubjectDialog } from "@/components/subjects/CreateSubjectDialog";
import { CreateAdminDialog, CreateSessionDialog, CreateClassDialog } from "@/components/AdminControls";
import { Layout } from "@/components/Layout";
import { useState, useMemo } from "react";
import { useAdmin } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  TrendingUp, 
  Users, 
  Award,
  AlertCircle,
  Lock,
  Unlock,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Session, Class, StudentWithMarks } from "@shared/schema";

export default function Home() {
  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();
  
  // Navigation State
  const [viewLevel, setViewLevel] = useState<"sessions" | "classes" | "students">("sessions");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Auth State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  // Student View State
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");

  // Queries
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
      queryKey: ["sessions"],
      queryFn: () => fetch("/api/sessions").then(r => r.json())
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
      queryKey: ["classes", selectedSession?.id],
      queryFn: () => fetch(`/api/classes?sessionId=${selectedSession?.id}`).then(r => r.json()),
      enabled: !!selectedSession
  });

  const { data: students, isLoading: isLoadingStudents, error } = useQuery<StudentWithMarks[]>({
      queryKey: ["students", selectedClass?.id],
      queryFn: () => fetch(`/api/students?classId=${selectedClass?.id}`).then(r => r.json()),
      enabled: !!selectedClass
  });

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      
      if (res.ok) {
        const data = await res.json();
        login(data);
        setShowAuthDialog(false);
        setAuthEmail("");
        setAuthPassword("");
        toast({ title: "Welcome Admin" });
      } else {
        toast({ title: "Invalid Credentials", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Login Failed", variant: "destructive" });
    }
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toString().includes(search)
    ).map(student => {
      const totalObtained = student.marks.reduce((sum, m) => sum + parseInt(m.obtained || "0"), 0);
      const totalMax = student.marks.reduce((sum, m) => sum + m.subject.maxMarks, 0);
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      return { ...student, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [students, search]);

  const visibleSessions = useMemo(() => {
     if (!sessions) return [];
     if (isAdmin) return sessions;
     return sessions.filter(s => s.isActive);
  }, [sessions, isAdmin]);

  if (isLoadingSessions) {
      return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Controls & Auth */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            {viewLevel !== "sessions" && (
                <Button variant="ghost" onClick={() => {
                    if (viewLevel === "students") setViewLevel("classes");
                    else setViewLevel("sessions");
                }}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
            )}
            <h2 className="text-xl font-bold text-slate-700">
                {viewLevel === "sessions" && "Select Session"}
                {viewLevel === "classes" && `Classes in ${selectedSession?.name}`}
                {viewLevel === "students" && `${selectedClass?.name} - Student List`}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
              <DialogTrigger asChild>
                <Button variant={isAdmin ? "outline" : "default"} className="gap-2">
                  {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isAdmin ? "Admin Active" : "IIC"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Admin Authentication</DialogTitle>
                  <DialogDescription>
                    Enter your credentials to enable editing powers.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email ID</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
                <Button className="w-full font-bold" onClick={handleLogin}>
                  Unlock
                </Button>
              </DialogContent>
            </Dialog>

            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                <CreateSessionDialog />
                <CreateClassDialog />
                <CreateAdminDialog />
                <CreateSubjectDialog />
                {viewLevel === "students" && <CreateStudentDialog />}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logout()}
                  className="text-muted-foreground"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* --- SESSIONS VIEW --- */}
        {viewLevel === "sessions" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {visibleSessions.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-muted-foreground">
                        No active sessions found.
                    </div>
                ) : (
                    visibleSessions.map(session => (
                        <Card 
                            key={session.id} 
                            className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary"
                            onClick={() => {
                                setSelectedSession(session);
                                setViewLevel("classes");
                            }}
                        >
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-primary">{session.name}</h3>
                                    <p className="text-sm text-muted-foreground">{session.isActive ? "Active Session" : "Archived"}</p>
                                </div>
                                <ChevronRight className="text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        )}

        {/* --- CLASSES VIEW --- */}
        {viewLevel === "classes" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoadingClasses ? (
                    <div className="col-span-3 text-center">Loading classes...</div>
                ) : classes?.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-muted-foreground">
                        No classes found in this session.
                        {isAdmin && <div className="mt-4 text-primary">Use "New Class" to add one.</div>}
                    </div>
                ) : (
                    classes?.map(cls => (
                        <Card 
                            key={cls.id} 
                            className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
                            onClick={() => {
                                setSelectedClass(cls);
                                setViewLevel("students");
                            }}
                        >
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-blue-700">{cls.name}</h3>
                                    <p className="text-sm text-muted-foreground">Click to view students</p>
                                </div>
                                <ChevronRight className="text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        )}

        {/* --- STUDENTS VIEW --- */}
        {viewLevel === "students" && (
            <>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                        placeholder="Search by name or roll no..." 
                        className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <Button 
                            variant={viewMode === "grid" ? "white" : "ghost"} 
                            size="sm" 
                            onClick={() => setViewMode("grid")}
                            className={`rounded-lg h-9 ${viewMode === "grid" ? "shadow-sm bg-white" : ""}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === "table" ? "white" : "ghost"} 
                            size="sm" 
                            onClick={() => setViewMode("table")}
                            className={`rounded-lg h-9 ${viewMode === "table" ? "shadow-sm bg-white" : ""}`}
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="min-h-[400px]">
                {isLoadingStudents ? (
                    <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Users className="h-16 w-16 mb-4 opacity-10" />
                    <h3 className="text-xl font-semibold text-slate-600">No students found</h3>
                    <p className="text-slate-400">Try adjusting your search or add a new student.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 gap-4">
                    {filteredStudents.map((student, idx) => (
                        <StudentCard key={student.id} student={student} rank={idx + 1} />
                    ))}
                    </div>
                ) : (
                    <StudentTable students={filteredStudents} />
                )}
                </div>
            </>
        )}
      </div>
    </Layout>
  );
}
