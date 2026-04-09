import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { ShieldCheck, Award, FileText, Link2, ExternalLink, GraduationCap, Building2, Mail, Loader2, Sparkles, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PublicProfile() {
  const { slug } = useParams();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await apiService.getPublicProfile(slug!);
        if (response.success) {
          setProfileData(response.data);
        } else {
          setError(response.error || 'Profile not found');
        }
      } catch (err: any) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4 glass-card p-12 rounded-3xl border-destructive/20">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
             <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const { profile, certificates, assignments } = profileData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans selection:bg-primary selection:text-primary-foreground">
      {/* ═══ Floating University Branding ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-border/50 px-6 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
               <img src={profile.university_logo || '/logo.png'} alt="University Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight">{profile.university_name}</span>
         </div>
         <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blockchain-secondary text-blockchain border-blockchain/20 gap-1 text-[10px] font-bold">
               <ShieldCheck className="w-3 h-3" /> VERIFIED PORTFOLIO
            </Badge>
         </div>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-12">
        {/* ═══ Profile Hero ═══ */}
        <section className="relative glass-card p-8 sm:p-12 rounded-[2.5rem] border border-primary/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-primary via-violet-500 to-accent shadow-xl">
               <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-5xl font-display font-bold text-primary">
                  {profile.name.charAt(0)}
               </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight flex items-center justify-center gap-3">
                {profile.name}
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3">
                 <Badge variant="secondary" className="capitalize px-4 py-1 text-xs font-semibold rounded-full">
                    {profile.role}
                 </Badge>
                 <Badge variant="outline" className="px-4 py-1 text-xs font-semibold rounded-full gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {profile.department}
                 </Badge>
              </div>
            </div>

            <p className="max-w-2xl text-muted-foreground leading-relaxed">
              {profile.bio || "No bio provided."}
            </p>

            <div className="flex gap-4">
               <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5">
                  <Mail className="w-4 h-4" /> Message
               </Button>
               <Button variant="default" className="rounded-full gap-2 shadow-lg shadow-primary/20">
                  <Globe className="w-4 h-4" /> Explore Work
               </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-5 items-start">
          {/* ═══ Left: Certificates ═══ */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 px-2">
               <Award className="w-5 h-5 text-amber-500" />
               Academic Credentials
            </h2>
            <div className="space-y-4">
              {certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">No verified degrees yet.</p>
              ) : (
                certificates.map((cert: any, i: number) => (
                  <div key={i} className="glass-card p-5 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{cert.degree_type}</p>
                        <h4 className="font-bold text-sm leading-tight text-foreground">{cert.degree_name}</h4>
                        <p className="text-xs text-muted-foreground">{new Date(Number(cert.issue_date)).toLocaleDateString()}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blockchain-secondary flex items-center justify-center shrink-0">
                         <Link2 className="w-5 h-5 text-blockchain" />
                      </div>
                    </div>
                    {cert.blockchain_hash && (
                       <a 
                        href={`/verify?hash=${cert.blockchain_hash}`}
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blockchain-secondary text-[10px] font-bold text-blockchain hover:bg-blockchain-secondary/80 transition-colors uppercase tracking-widest"
                       >
                         Verify on Blockchain
                       </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ═══ Right: Featured Work ═══ */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 px-2">
               <FileText className="w-5 h-5 text-primary" />
               Verified Submissions
            </h2>
            <div className="grid gap-4">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">No assignments shared in portfolio yet.</p>
              ) : (
                assignments.map((task: any, i: number) => (
                  <div key={i} className="glass-card p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-lg">{task.title}</h4>
                           <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                              Grade: {task.grade}
                           </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{task.course}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                         <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-px bg-border/50" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">Blockchain Authenticated</span>
                       <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                       <div className="text-[10px] text-muted-foreground">
                          ID: <span className="font-mono">{task.blockchain_hash?.substring(0, 12)}...</span>
                       </div>
                       <Badge variant="outline" className="bg-success-secondary text-success border-success/20 gap-1.5 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                       </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border/50 text-center">
         <div className="flex items-center justify-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-display font-medium">Powered by EduChain University Portal</span>
         </div>
      </footer>
    </div>
  );
}
