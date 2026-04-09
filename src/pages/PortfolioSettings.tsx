import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Globe, Shield, User, Link, FileText, CheckCircle2, ChevronRight, Eye, Copy, Save, Loader2, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function PortfolioSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    slug: '',
    bio: '',
    isPublic: false,
    portfolioData: { selectedAssignmentIds: [] }
  });
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadAssignments();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiService.getProfileSettings();
      if (response.success && response.data) {
        const data = response.data;
        setSettings({
          slug: data.slug || '',
          bio: data.bio || '',
          isPublic: data.is_public === 1,
          portfolioData: data.portfolio_data ? JSON.parse(data.portfolio_data) : { selectedAssignmentIds: [] }
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await apiService.getAssignments();
      if (response.success) {
        // Filter only graded assignments
        setAssignments(response.data.filter((a: any) => a.status === 'graded'));
      }
    } catch (error) {
      console.error("Failed to load assignments");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateProfileSettings(settings);
      if (response.success) {
        toast({ title: "Saved!", description: "Your portfolio settings have been updated." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignment = (id: string) => {
    const selected = settings.portfolioData.selectedAssignmentIds || [];
    const newSelected = selected.includes(id) 
      ? selected.filter((sid: string) => sid !== id)
      : [...selected, id];
    
    setSettings({
      ...settings,
      portfolioData: { ...settings.portfolioData, selectedAssignmentIds: newSelected }
    });
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/profile/${settings.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Portfolio link copied to clipboard." });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Public Portfolio</h1>
            <p className="text-muted-foreground">Showcase your verified achievements to the world.</p>
          </div>
          <Button variant="gradient" size="lg" className="rounded-xl h-12 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Settings */}
          <div className="md:col-span-2 space-y-6">
            <section className="glass-card rounded-2xl p-6 border border-border/50 space-y-6">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Visibility & Identity
              </h3>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Public Presence</Label>
                  <p className="text-xs text-muted-foreground">Make your portfolio accessible via a unique URL.</p>
                </div>
                <Switch 
                  checked={settings.isPublic}
                  onCheckedChange={(val) => setSettings({...settings, isPublic: val})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Portfolio URL</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-secondary/30 rounded-lg px-3 border border-border text-sm text-muted-foreground">
                    university.edu/profile/
                    <input 
                      id="slug"
                      className="bg-transparent border-none focus:ring-0 text-foreground font-medium flex-1 h-10 ml-1"
                      value={settings.slug}
                      onChange={(e) => setSettings({...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="your-name"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={copyUrl} className="h-10 w-10 shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Use a unique name or student ID as your URL slug.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea 
                  id="bio"
                  placeholder="Share your goals, skills, and academic focus..."
                  className="min-h-[120px] bg-secondary/10"
                  value={settings.bio}
                  onChange={(e) => setSettings({...settings, bio: e.target.value})}
                />
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6 border border-border/50 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Showcase Assignments
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {settings.portfolioData.selectedAssignmentIds.length} Selected
                </Badge>
              </div>

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 bg-secondary/10 rounded-xl border border-dashed">
                    <p className="text-xs text-muted-foreground">Complete and grade assignments to showcase them here.</p>
                  </div>
                ) : (
                  assignments.map((a: any) => (
                    <div 
                      key={a.id} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                        settings.portfolioData.selectedAssignmentIds.includes(a.id)
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border hover:border-primary/20"
                      )}
                      onClick={() => toggleAssignment(a.id)}
                    >
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                           settings.portfolioData.selectedAssignmentIds.includes(a.id) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                         )}>
                            <CheckCircle2 className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold">{a.title}</p>
                            <p className="text-[10px] text-muted-foreground">{a.course} • Grade: {a.grade}</p>
                         </div>
                      </div>
                      <Link className={cn(
                        "w-4 h-4 transition-all opacity-0 group-hover:opacity-100",
                        settings.portfolioData.selectedAssignmentIds.includes(a.id) ? "text-primary opacity-100" : "text-muted-foreground"
                      )} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Preview/Info */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold">Portfolio Preview</h4>
              <p className="text-xs text-muted-foreground">See how your profile looks to recruiters and peers.</p>
              <Button 
                variant="outline" 
                className="w-full rounded-xl gap-2 h-10 border-primary/30"
                onClick={() => window.open(`/profile/${settings.slug}`, '_blank')}
              >
                <Eye className="w-4 h-4" /> Live Preview
              </Button>
            </div>

            <div className="p-6 space-y-4 rounded-2xl bg-secondary/20 border border-border">
              <h4 className="text-sm font-bold flex items-center gap-2">
                 <Building2 className="w-4 h-4" /> Institutional Integration
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your portfolio is automatically linked to the **${localStorage.getItem('university_name') || 'EduChain'}** academic network. All certificates shown are cryptographically signed and verifiable on the blockchain.
              </p>
              <div className="pt-2">
                 <Badge className="bg-success/10 text-success border-success/20 text-[9px] font-bold">
                    TRUSTED PROFILE
                 </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
