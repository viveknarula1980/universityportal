import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Palette, Users } from "lucide-react";
import { apiService } from "@/services/api";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [stream, setStream] = useState("");

  const [brandName, setBrandName] = useState("EduChain University");
  const [brandColor, setBrandColor] = useState("#06b6d4");
  const [brandLogo, setBrandLogo] = useState("");
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      try {
        const res = await fetch(`${API_URL}/superadmin/branding`);
        const data = await res.json();
        if (data.success && data.data) {
          setBrandName(data.data.university_name || "");
          setBrandColor(data.data.primary_color || "");
          setBrandLogo(data.data.logo_url || "");
        }
      } catch (err) { }
    };
    fetchBranding();
  }, []);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrand(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/superadmin/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ universityName: brandName, primaryColor: brandColor, logoUrl: brandLogo })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Branding Saved", description: "Changes saved. Hard refresh the page to see changes." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save branding", variant: "destructive" });
    }
    setIsSavingBrand(false);
  };
  
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app this would go through apiService.createAdmin
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/superadmin/admins`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ email, name, password, stream }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Demo admin account created successfully" });
        setEmail("");
        setName("");
        setPassword("");
        setStream("");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create admin", variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage University Instances and Demo Accounts</p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Create Demo Administrator
                  </CardTitle>
                  <CardDescription>Provision a new university administrator for demo purposes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Admin Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stream">Assigned Stream / Department (Optional)</Label>
                      <Input id="stream" value={stream} onChange={e => setStream(e.target.value)} placeholder="e.g., Computer Science" />
                    </div>
                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Admin Account
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-accent" />
                    White-Label Demo Branding
                  </CardTitle>
                  <CardDescription>Configure branding dynamically for pitch presentations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveBranding} className="space-y-4">
                    <div className="space-y-2">
                      <Label>University Name</Label>
                      <Input value={brandName} onChange={e => setBrandName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Color (Hex)</Label>
                      <div className="flex gap-2">
                        <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} required />
                        <div className="w-10 h-10 rounded border border-zinc-200" style={{ backgroundColor: brandColor }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input value={brandLogo} onChange={e => setBrandLogo(e.target.value)} placeholder="https://..." />
                    </div>
                    <Button type="submit" disabled={isSavingBrand} className="w-full">
                      {isSavingBrand ? "Saving..." : "Save Branding Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
      </div>
    </MainLayout>
  );
}
