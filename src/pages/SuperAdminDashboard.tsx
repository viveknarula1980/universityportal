import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Settings, Palette, Users, Globe, ExternalLink, ShieldCheck,
  Copy, Upload, BarChart3, Sparkles, GraduationCap, FileText,
  Link2, Power, Trash2, Save, TrendingUp, Activity, Building2,
  AlertTriangle, Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface UniversityInstance {
  id: string;
  university_name: string;
  slug: string;
  primary_color: string;
  logo_url: string;
  is_active: boolean;
  ai_token_limit: number;
  user_count: number;
  cert_count: number;
  sub_count: number;
  ai_tokens_used: number;
  admin_email?: string;
  admin_name?: string;
  created_at?: string;
  updated_at?: number;
}

interface AnalyticsData {
  overview: {
    totalUniversities: number;
    activeUniversities: number;
    totalUsers: number;
    totalStudents: number;
    totalFaculty: number;
    totalAdmins: number;
    totalCertificates: number;
    totalSubmissions: number;
    totalAITokens: number;
    totalBlockchainRecords: number;
  };
  universityBreakdown: UniversityInstance[];
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
  const [isUploading, setIsUploading] = useState(false);

  // Data State
  const [instances, setInstances] = useState<UniversityInstance[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchInstances(), fetchAnalytics(), fetchGlobalBranding()]);
    setLoading(false);
  };

  const fetchInstances = async () => {
    try {
      const res = await fetch(`${API_URL}/superadmin/instances`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setInstances(data.data || []);
    } catch (err) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/superadmin/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (err) {}
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
    } catch (err) {}
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleLogoUpload = async (file: File, type: 'instance' | 'global') => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await fetch(`${API_URL}/superadmin/upload-logo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'instance') setInstLogo(data.data.url);
        else setBrandLogo(data.data.url);
        toast({ title: "Logo Uploaded", description: "The logo has been staged for saving." });
      } else {
        toast({ title: "Upload Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
    }
    setIsUploading(false);
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          universityName: instName,
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
        setInstName(""); setInstSlug(""); setInstAdminEmail(""); setInstAdminPass(""); setInstLogo("");
        fetchAll();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create instance", variant: "destructive" });
    }
    setIsCreating(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingStatus(id);
    try {
      const res = await fetch(`${API_URL}/superadmin/instances/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: !currentStatus ? "Portal Activated" : "Portal Suspended", description: data.message });
        fetchAll();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
    setTogglingStatus(null);
  };

  const handleUpdateAILimit = async (id: string) => {
    const limit = parseInt(newLimit);
    if (!limit || limit < 0) {
      toast({ title: "Error", description: "Enter a valid token limit", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/superadmin/instances/${id}/ai-limit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ aiTokenLimit: limit })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "AI Limit Updated", description: data.message });
        setEditingLimit(null);
        setNewLimit("");
        fetchAll();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update limit", variant: "destructive" });
    }
  };

  const handleDeleteInstance = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This will remove all users, certificates, and data. This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/superadmin/instances/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Instance Deleted", description: `"${name}" and all associated data have been removed.` });
        fetchAll();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete instance", variant: "destructive" });
    }
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
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied", description: "University URL copied to clipboard." });
  };

  const getLogoSrc = (url: string) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL.replace('/api', '')}${url}`;
  };

  const stats = analytics?.overview;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Super Admin Central</h1>
              <p className="text-muted-foreground">Orchestrate university instances and platform ecosystem</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-indigo-500 border-indigo-500/30 bg-indigo-500/5">
            <Activity className="w-3 h-3" />
            {stats?.activeUniversities || 0} / {stats?.totalUniversities || 0} Active
          </Badge>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="analytics" className="rounded-lg gap-2">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="instances" className="rounded-lg gap-2">
              <Globe className="w-4 h-4" /> Universities
            </TabsTrigger>
            <TabsTrigger value="ai-governance" className="rounded-lg gap-2">
              <Sparkles className="w-4 h-4" /> AI Governance
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg gap-2">
              <Palette className="w-4 h-4" /> Global Branding
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
          <TabsContent value="analytics" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Universities", value: stats?.totalUniversities || 0, icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Certificates", value: stats?.totalCertificates || 0, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Submissions", value: stats?.totalSubmissions || 0, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Blockchain Records", value: stats?.totalBlockchainRecords || 0, icon: Link2, color: "text-purple-500", bg: "bg-purple-500/10" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border-zinc-200 dark:border-zinc-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stat.bg)}>
                            <stat.icon className={cn("w-4 h-4", stat.color)} />
                          </div>
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{Number(stat.value).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* User Role Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Students", count: stats?.totalStudents || 0, color: "bg-blue-500" },
                    { label: "Faculty", count: stats?.totalFaculty || 0, color: "bg-purple-500" },
                    { label: "Admins", count: stats?.totalAdmins || 0, color: "bg-amber-500" },
                  ].map((role) => (
                    <Card key={role.label} className="border-zinc-200 dark:border-zinc-800">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">{role.label}</span>
                          <Badge variant="secondary">{Number(role.count).toLocaleString()}</Badge>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div
                            className={cn("h-2 rounded-full transition-all", role.color)}
                            style={{ width: `${stats?.totalUsers ? (Number(role.count) / Number(stats.totalUsers)) * 100 : 0}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Per-University Usage Table */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Per-University Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.universityBreakdown?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                              <th className="py-3 px-2 font-medium text-muted-foreground">University</th>
                              <th className="py-3 px-2 font-medium text-muted-foreground text-center">Status</th>
                              <th className="py-3 px-2 font-medium text-muted-foreground text-center">Users</th>
                              <th className="py-3 px-2 font-medium text-muted-foreground text-center">Certificates</th>
                              <th className="py-3 px-2 font-medium text-muted-foreground text-center">Submissions</th>
                              <th className="py-3 px-2 font-medium text-muted-foreground text-center">AI Tokens</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.universityBreakdown.map((uni) => (
                              <tr key={uni.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg border flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0" style={{ borderColor: (uni.primary_color || '#666') + '40' }}>
                                      {uni.logo_url ? <img src={getLogoSrc(uni.logo_url) || ''} className="w-4 h-4 object-contain" /> : <Globe className="w-3 h-3 text-zinc-400" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{uni.university_name}</p>
                                      <p className="text-[10px] text-muted-foreground font-mono">/p/{uni.slug}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Badge variant={uni.is_active !== false ? "default" : "destructive"} className={cn("text-[10px]", uni.is_active !== false ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-red-500/10 text-red-600 border-0")}>
                                    {uni.is_active !== false ? "Active" : "Suspended"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-center font-medium">{Number(uni.user_count).toLocaleString()}</td>
                                <td className="py-3 px-2 text-center font-medium">{Number(uni.cert_count).toLocaleString()}</td>
                                <td className="py-3 px-2 text-center font-medium">{Number(uni.sub_count).toLocaleString()}</td>
                                <td className="py-3 px-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="font-medium text-xs">{Number(uni.ai_tokens_used).toLocaleString()}</span>
                                    <div className="w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1">
                                      <div className={cn("h-1 rounded-full", Number(uni.ai_tokens_used) / (Number(uni.ai_token_limit) || 100000) > 0.8 ? "bg-red-500" : "bg-indigo-500")}
                                        style={{ width: `${Math.min((Number(uni.ai_tokens_used) / (Number(uni.ai_token_limit) || 100000)) * 100, 100)}%` }} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No university instances created yet.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══════════════ INSTANCES TAB ═══════════════ */}
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
                      <Label>Primary Color</Label>
                      <Input type="color" className="h-10 p-1" value={instColor} onChange={e => setInstColor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>University Logo</Label>
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-lg border bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {instLogo ? (
                            <img src={getLogoSrc(instLogo) || ''} className="w-full h-full object-contain" />
                          ) : (
                            <Upload className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <Input type="file" accept="image/*" className="text-xs" onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'instance')} disabled={isUploading} />
                      </div>
                      <Input placeholder="Or enter URL directly" value={instLogo} onChange={e => setInstLogo(e.target.value)} className="mt-2 text-xs" />
                    </div>
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <Label className="text-primary font-bold">Admin Credentials</Label>
                      <Input placeholder="admin@oxford.edu" type="email" value={instAdminEmail} onChange={e => setInstAdminEmail(e.target.value)} required />
                      <Input placeholder="Password" type="password" className="mt-2" value={instAdminPass} onChange={e => setInstAdminPass(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                      {isCreating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</>) : "Launch Branded Portal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Instances List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  University Instances <span className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-xs">{instances.length}</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {instances.map((inst) => {
                    const isActive = inst.is_active !== false;
                    const usagePercent = inst.ai_token_limit ? (Number(inst.ai_tokens_used) / Number(inst.ai_token_limit)) * 100 : 0;
                    return (
                      <Card
                        key={inst.id}
                        className={cn(
                          "transition-all cursor-default group",
                          isActive
                            ? "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-md"
                            : "border-red-500/20 bg-red-500/[0.02] opacity-75"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-zinc-50 dark:bg-zinc-900" style={{ borderColor: (inst.primary_color || '#666') + '40' }}>
                                {inst.logo_url ? (
                                  <img src={getLogoSrc(inst.logo_url) || ''} className="w-6 h-6 object-contain" />
                                ) : (
                                  <Globe className="w-5 h-5 text-zinc-400" />
                                )}
                              </div>
                              {!isActive && <Badge variant="destructive" className="text-[9px] bg-red-500/10 text-red-600 border-0 px-1.5 py-0">Suspended</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleToggleStatus(inst.id, isActive)}
                                disabled={togglingStatus === inst.id}
                                className="scale-75"
                              />
                            </div>
                          </div>
                          <CardTitle className="text-base mt-3">{inst.university_name}</CardTitle>
                          <CardDescription className="font-mono text-xs">/p/{inst.slug}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {/* Stats Row */}
                          <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-3 h-3" /> <span className="font-medium text-foreground">{Number(inst.user_count)}</span> users
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <GraduationCap className="w-3 h-3" /> <span className="font-medium text-foreground">{Number(inst.cert_count)}</span> certs
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="w-3 h-3" /> <span className="font-medium text-foreground">{Number(inst.sub_count)}</span> subs
                            </div>
                          </div>

                          {/* AI Usage Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>AI Tokens</span>
                              <span>{Number(inst.ai_tokens_used).toLocaleString()} / {Number(inst.ai_token_limit || 100000).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                              <div className={cn("h-1.5 rounded-full transition-all", usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-indigo-500")}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 pt-1">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2" onClick={() => copyUrl(inst.slug)}>
                              <Copy className="w-3 h-3" /> Copy URL
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 text-primary" onClick={() => window.open(`/p/${inst.slug}`, '_blank')}>
                              <ExternalLink className="w-3 h-3" /> Open
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-auto" onClick={() => handleDeleteInstance(inst.id, inst.university_name)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ AI GOVERNANCE TAB ═══════════════ */}
          <TabsContent value="ai-governance" className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI Token Governance
                </CardTitle>
                <CardDescription>Manage per-university AI token limits for the current semester. Control how much AI capacity each institution can consume.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Global AI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Total AI Tokens Used</p>
                    <p className="text-2xl font-bold text-indigo-600">{Number(stats?.totalAITokens || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Universities with AI</p>
                    <p className="text-2xl font-bold text-emerald-600">{instances.filter(i => Number(i.ai_tokens_used) > 0).length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Near Limit (&gt;80%)</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {instances.filter(i => i.ai_token_limit && (Number(i.ai_tokens_used) / Number(i.ai_token_limit)) > 0.8).length}
                    </p>
                  </div>
                </div>

                {/* Per-University AI Controls */}
                <div className="space-y-3">
                  {instances.filter(i => i.id !== 'default').map((inst) => {
                    const usagePercent = inst.ai_token_limit ? (Number(inst.ai_tokens_used) / Number(inst.ai_token_limit)) * 100 : 0;
                    const isEditing = editingLimit === inst.id;

                    return (
                      <div key={inst.id} className={cn("p-4 rounded-xl border transition-all", usagePercent > 80 ? "border-red-500/30 bg-red-500/[0.02]" : "border-zinc-200 dark:border-zinc-800")}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg border flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0" style={{ borderColor: (inst.primary_color || '#666') + '40' }}>
                              {inst.logo_url ? <img src={getLogoSrc(inst.logo_url) || ''} className="w-5 h-5 object-contain" /> : <Building2 className="w-4 h-4 text-zinc-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{inst.university_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {Number(inst.ai_tokens_used).toLocaleString()} / {Number(inst.ai_token_limit || 100000).toLocaleString()} tokens
                                </span>
                                {usagePercent > 80 && (
                                  <Badge variant="destructive" className="text-[9px] bg-red-500/10 text-red-600 border-0 px-1.5 py-0 gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Near Limit
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Usage Bar */}
                            <div className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 hidden sm:block">
                              <div
                                className={cn("h-2 rounded-full transition-all", usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-indigo-500")}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-12 text-right">{usagePercent.toFixed(0)}%</span>

                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  placeholder="100000"
                                  value={newLimit}
                                  onChange={e => setNewLimit(e.target.value)}
                                  className="w-28 h-8 text-xs"
                                  autoFocus
                                />
                                <Button size="sm" className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleUpdateAILimit(inst.id)}>
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditingLimit(null); setNewLimit(""); }}>
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => { setEditingLimit(inst.id); setNewLimit(String(inst.ai_token_limit || 100000)); }}>
                                <Settings className="w-3 h-3" /> Set Limit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {instances.filter(i => i.id !== 'default').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No university instances to manage yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ BRANDING TAB ═══════════════ */}
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
                    <Label>Logo</Label>
                    <div className="flex gap-4 items-center mb-2">
                       <div className="w-16 h-16 rounded-xl border bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-2">
                          {brandLogo ? (
                            <img src={getLogoSrc(brandLogo) || ''} className="w-full h-full object-contain" />
                          ) : (
                            <Palette className="w-8 h-8 text-zinc-300" />
                          )}
                       </div>
                       <div className="flex-1 space-y-2">
                         <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2 text-xs"
                          onClick={() => document.getElementById('global-logo-upload')?.click()}
                          disabled={isUploading}
                         >
                           <Upload className="w-4 h-4" /> {isUploading ? "Uploading..." : "Upload Logo"}
                         </Button>
                         <input
                          id="global-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'global')}
                         />
                         <Input
                           value={brandLogo}
                           onChange={e => setBrandLogo(e.target.value)}
                           placeholder="Or paste external URL"
                           className="text-xs"
                         />
                       </div>
                    </div>
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
