import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Palette, Users, Globe, ExternalLink, ShieldCheck, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UniversityInstance {
  id: number;
  university_name: string;
  slug: string;
  primary_color: string;
  logo_url: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  
  // Instance Creation State
  const [instName, setInstName] = useState("");
  const [instSlug, setInstSlug] = useState("");
  const [instColor, setInstColor] = useState("#4f46e5");
  const [instLogo, setInstLogo] = useState("");
  const [instAdminEmail, setInstAdminEmail] = useState("");
  const [instAdminPass, setInstAdminPass] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Global Branding State
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const [instances, setInstances] = useState<UniversityInstance[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
  const token = localStorage.getItem("token");

  const fetchInstances = async () => {
    try {
      const res = await fetch(`${API_URL}/superadmin/instances`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setInstances(data.data);
    } catch (err) { }
  };

  const fetchGlobalBranding = async () => {
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

  useEffect(() => {
    fetchInstances();
    fetchGlobalBranding();
  }, []);

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: instName,
          slug: instSlug.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          primaryColor: instColor,
          logoUrl: instLogo,
          adminEmail: instAdminEmail,
          adminPassword: instAdminPass
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Instance Created", description: `Branded portal for ${instName} is ready.` });
        setInstName(""); setInstSlug(""); setInstAdminEmail(""); setInstAdminPass("");
        fetchInstances();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create instance", variant: "destructive" });
    }
    setIsCreating(false);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrand(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ universityName: brandName, primaryColor: brandColor, logoUrl: brandLogo })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Global Branding Updated", description: "Changes applied to the root instance." });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save branding", variant: "destructive" });
    }
    setIsSavingBrand(false);
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}/login`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied", description: "Login URL copied to clipboard." });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Super Admin Central</h1>
              <p className="text-muted-foreground">Orchestrate university instances and ecosystem branding</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="instances" className="space-y-6">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="instances" className="rounded-lg gap-2">
              <Globe className="w-4 h-4" /> Branded Instances
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg gap-2">
              <Palette className="w-4 h-4" /> Global Look & Feel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Create Form */}
              <Card className="lg:col-span-1 shadow-sm border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Deploy New Instance</CardTitle>
                  <CardDescription>Create a unique branded portal in seconds.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateInstance} className="space-y-4">
                    <div className="space-y-2">
                      <Label>University Name</Label>
                      <Input placeholder="Oxford University" value={instName} onChange={e => setInstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <Input placeholder="oxford" value={instSlug} onChange={e => setInstSlug(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <div className="flex gap-3 items-center">
                        <Input placeholder="https://..." value={instLogo} onChange={e => setInstLogo(e.target.value)} className="flex-1" />
                        <div className="w-12 h-12 rounded border border-zinc-200 flex items-center justify-center bg-zinc-50 overflow-hidden shrink-0">
                          {instLogo ? <img src={instLogo} className="w-full h-full object-contain" /> : <Palette className="w-4 h-4 text-zinc-300" />}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <Label className="text-primary font-bold">Admin Credentials</Label>
                      <Input placeholder="admin@oxford.edu" type="email" value={instAdminEmail} onChange={e => setInstAdminEmail(e.target.value)} required />
                      <Input placeholder="Password" type="password" className="mt-2" value={instAdminPass} onChange={e => setInstAdminPass(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                      {isCreating ? "Deploying..." : "Launch Branded Portal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Instances List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  Active Instances <span className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-xs">{instances.length}</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {instances.map((inst) => (
                    <Card key={inst.id} className="hover:shadow-md transition-shadow cursor-default group border-zinc-200 dark:border-zinc-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-zinc-50 dark:bg-zinc-900" style={{ borderColor: inst.primary_color + '40' }}>
                            {inst.logo_url ? <img src={inst.logo_url} className="w-6 h-6 object-contain" /> : <Globe className="w-5 h-5 text-zinc-400" />}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(inst.slug)}>
                                <Copy className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => window.open(`/p/${inst.slug}/login`, '_blank')}>
                                <ExternalLink className="w-4 h-4" />
                             </Button>
                          </div>
                        </div>
                        <CardTitle className="text-base mt-3">{inst.university_name}</CardTitle>
                        <CardDescription className="font-mono text-xs">/p/{inst.slug}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding">
             <Card className="max-w-2xl border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-accent" />
                    Global Branding Override
                  </CardTitle>
                  <CardDescription>Configure branding for the default root domain.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveBranding} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default University Name</Label>
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
                    <Button type="submit" disabled={isSavingBrand} className="w-full mt-2">
                      {isSavingBrand ? "Saving..." : "Apply Global Branding"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
