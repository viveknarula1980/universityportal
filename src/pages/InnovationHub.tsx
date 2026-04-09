import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Rocket, Plus, Users, Search, Building2, Terminal, Lightbulb, Filter, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function InnovationHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', streamTags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiService.createProject(newProject);
      if (response.success) {
        toast({ title: "Success", description: "Project submitted to the Innovation Hub!" });
        setIsCreating(false);
        setNewProject({ title: '', description: '', streamTags: '' });
        loadProjects();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create project", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (id: string) => {
    try {
      const response = await apiService.joinProject(id);
      if (response.success) {
        toast({ title: "Joined!", description: "You are now a collaborator on this project." });
        loadProjects();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to join project", variant: "destructive" });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.stream_tags?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-violet-500/10 border border-primary/20 p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-48 -mt-48" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-2">
                <Rocket className="w-3 h-3" /> INNOVATION HUB
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                Collaborate Across <span className="text-primary">Streams</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join forces with students from different departments to build the future. 
                AI matches you with projects relevant to your academic background.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                <Button onClick={() => setIsCreating(true)} variant="gradient" size="lg" className="rounded-xl gap-2 h-12">
                  <Plus className="w-5 h-5" /> Start a Project
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl gap-2 h-12 bg-background/50">
                  <Users className="w-5 h-5" /> My Teams
                </Button>
              </div>
            </div>
            <div className="w-48 h-48 sm:w-64 sm:h-64 relative animate-float">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
               <div className="relative flex items-center justify-center w-full h-full glass-card rounded-full border-2 border-primary/30 shadow-2xl">
                  <Terminal className="w-20 h-20 sm:w-24 sm:h-24 text-primary" />
               </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50 p-4 rounded-2xl border border-border">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects or stream tags..." 
              className="pl-10 h-11 bg-background" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 h-11 rounded-xl">
              <Filter className="w-4 h-4" /> All Departments
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <p className="text-sm font-medium text-muted-foreground">
              {filteredProjects.length} Projects found
            </p>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-72 glass-card rounded-2xl animate-pulse" />
             ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-2">
               <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
               <h3 className="text-xl font-display font-medium text-muted-foreground">No projects found yet.</h3>
               <p className="text-sm text-muted-foreground mt-2">Be the first to launch an innovation in your university!</p>
               <Button variant="link" className="mt-4" onClick={() => setIsCreating(true)}>Launch Innovation →</Button>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="group relative glass-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full">
                {/* Header/Status */}
                <div className="p-6 pb-4 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      {project.isMatch && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] animate-pulse">
                          ✨ Direct Match for {user?.department}
                        </Badge>
                      )}
                      {project.stream_tags?.split(',').map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] uppercase font-bold tracking-tight bg-secondary/30">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                    {project.description}
                  </p>
                </div>

                <div className="p-6 pt-0 mt-auto">
                   <div className="flex items-center justify-between mb-4 text-xs">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center font-bold text-primary">
                            {project.creator_name?.charAt(0)}
                         </div>
                         <div>
                            <p className="font-semibold">{project.creator_name}</p>
                            <p className="text-muted-foreground">Founder</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-semibold flex items-center justify-end gap-1">
                            <Users className="w-3 h-3" /> {project.member_count}
                         </p>
                         <p className="text-muted-foreground">Members</p>
                      </div>
                   </div>
                   <Button 
                    variant={project.member_count > 1 ? "secondary" : "default"} 
                    className="w-full rounded-xl group"
                    onClick={() => handleJoin(project.id)}
                   >
                     Collaborate <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-md glass-card border border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">Launch Innovation</DialogTitle>
              <DialogDescription>
                Describe your project. We'll tag it for potential collaborators across departments.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. AI-Powered Smart Irrigation" 
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mission & Goals</Label>
                <Textarea 
                  id="description" 
                  placeholder="What problem are you solving? Who do you need?" 
                  className="min-h-[120px]"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Target Streams (comma separated)</Label>
                <Input 
                  id="tags" 
                  placeholder="e.g. Agriculture, Computer Science, Robotics" 
                  value={newProject.streamTags}
                  onChange={(e) => setNewProject({...newProject, streamTags: e.target.value})}
                />
                <p className="text-[10px] text-muted-foreground">Adding tags helps our matchmaker find the right talent.</p>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Broadcast Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
