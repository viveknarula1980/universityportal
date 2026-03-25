import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Tag, 
  GraduationCap, 
  School, 
  Plus, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  student_id?: string;
  department?: string;
  is_verified: boolean;
  created_at: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "student" as "student" | "faculty",
    studentId: "",
    department: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminUsers();
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await apiService.createAdminUser(formData);
      if (response.success) {
        toast({
          title: "User Created",
          description: `${formData.role} account created for ${formData.email}`,
        });
        setIsAddingUser(false);
        setFormData({
          email: "",
          password: "",
          name: "",
          role: "student",
          studentId: "",
          department: ""
        });
        loadUsers();
      }
    } catch (error: any) {
       toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",");
        const preview = lines.slice(1, 6)
          .filter(line => line.trim() !== '')
          .map(line => {
             const values = line.split(",");
             return {
                name: values[0]?.trim(),
                email: values[1]?.trim(),
                role: values[2]?.trim(),
                idOrDept: values[3]?.trim()
             };
          });
        setBulkPreview(preview);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;

    try {
      setSubmitting(true);
      const reader = new FileReader();
      
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(bulkFile);
      });

      const lines = fileData.split("\n");
      const users = lines.slice(1)
        .filter(line => line.trim() !== "" && line.includes(","))
        .map(line => {
          const values = line.split(",");
          const role = values[2]?.trim().toLowerCase() === "faculty" ? "faculty" : "student";
          return {
            name: values[0]?.trim(),
            email: values[1]?.trim(),
            role: role,
            studentId: role === "student" ? values[3]?.trim() : null,
            department: role === "faculty" ? values[3]?.trim() : null,
            password: values[4]?.trim() || "temp123"
          };
        });

      if (users.length === 0) {
        throw new Error("No valid users found in CSV");
      }

      const response = await apiService.bulkCreateAdminUsers(users);
      if (response.success) {
        toast({
          title: "Bulk Import Complete",
          description: response.message,
        });
        setIsBulkImporting(false);
        setBulkFile(null);
        setBulkPreview([]);
        loadUsers();
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to process bulk import",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Full Name,Email,Role (student/faculty),Student ID or Department,Temporary Password\nJohn Doe,john@university.edu,student,STU-001,pass123\nDr. Smith,smith@university.edu,faculty,Computer Science,pass456";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsBulkImporting(true)} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
        <Button onClick={() => setIsAddingUser(true)} variant="gradient">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

    {isBulkImporting && (
      <div className="glass-card p-6 rounded-2xl border border-primary/20 animate-in slide-in-from-top-4 duration-300 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold">Bulk User Import</h3>
              <p className="text-sm text-muted-foreground">Upload CSV file with student/faculty records</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsBulkImporting(false)}>
            <AlertCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-dashed border-primary/30">
             <div className="flex items-center gap-3">
               <Upload className="w-8 h-8 text-muted-foreground" />
               <div>
                  <p className="text-sm font-medium">{bulkFile ? bulkFile.name : "Select CSV File"}</p>
                  <p className="text-xs text-muted-foreground">CSV format: Name, Email, Role, ID/Dept, Password</p>
               </div>
             </div>
             <input 
               type="file" 
               id="csv-upload" 
               className="hidden" 
               accept=".csv" 
               onChange={handleFileChange}
             />
             <Button variant="outline" size="sm" onClick={() => document.getElementById('csv-upload')?.click()}>
                {bulkFile ? "Change File" : "Choose File"}
             </Button>
          </div>

          {bulkPreview.length > 0 && (
            <div className="space-y-3">
               <p className="text-sm font-medium">Preview (First 5 records):</p>
               <div className="text-xs space-y-1 bg-secondary/50 p-3 rounded-lg font-mono">
                  {bulkPreview.map((user, i) => (
                    <div key={i} className="flex gap-4 border-b border-border/50 py-1 last:border-0">
                      <span className="w-32 truncate">{user.name}</span>
                      <span className="w-48 truncate">{user.email}</span>
                      <span className="w-16 capitalize text-primary">{user.role}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
             <Button variant="link" size="sm" onClick={downloadTemplate} className="text-primary p-0 h-auto">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
             </Button>
             <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsBulkImporting(false)}>Cancel</Button>
                <Button 
                  onClick={handleBulkImport} 
                  variant="gradient" 
                  disabled={!bulkFile || submitting}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <>Start Import Process</>
                  )}
                </Button>
             </div>
          </div>
        </div>
      </div>
    )}

      {isAddingUser && (
        <div className="glass-card p-6 rounded-2xl border border-primary/20 animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Register New Portal User</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingUser(false)}>
                <AlertCircle className="w-5 h-5" />
              </Button>
           </div>

           <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role">Account Role</Label>
                <select 
                  id="role"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="pl-10" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="user@university.edu" 
                    className="pl-10" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="text" 
                    placeholder="temp-pass-123" 
                    className="pl-10" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required 
                  />
                </div>
              </div>

              {formData.role === "student" ? (
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="studentId" 
                      placeholder="STU-2024-XXX" 
                      className="pl-10" 
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      required={formData.role === "student"}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="department" 
                      placeholder="Computer Science" 
                      className="pl-10" 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      required={formData.role === "faculty"}
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                 <Button type="button" variant="outline" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                 <Button type="submit" variant="gradient" disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      "Create Account"
                    )}
                 </Button>
              </div>
           </form>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 font-display font-semibold text-sm">User</th>
                <th className="p-4 font-display font-semibold text-sm">Role</th>
                <th className="p-4 font-display font-semibold text-sm">ID / Dept</th>
                <th className="p-4 font-display font-semibold text-sm">Status</th>
                <th className="p-4 font-display font-semibold text-sm text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Fetching user records...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "capitalize",
                          user.role === 'student' ? "bg-blue-500/10 text-blue-500 border-0" : "bg-purple-500/10 text-purple-500 border-0"
                        )}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.role === 'student' ? user.student_id : user.department}
                    </td>
                    <td className="p-4">
                       <Badge 
                        variant={user.is_verified ? "success" : "secondary"}
                        className="bg-transparent border"
                       >
                        {user.is_verified ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          "Pending 2FA"
                        )}
                       </Badge>
                    </td>
                    <td className="p-4 text-right text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
