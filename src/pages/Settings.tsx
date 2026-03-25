import { User, Bell, Shield, Palette, HelpCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-lg">Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user.email} disabled />
            </div>
            {user.role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input id="student-id" defaultValue={user.studentId} disabled />
              </div>
            )}
            {user.role === 'faculty' && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue={user.department} disabled />
              </div>
            )}
            {user.role === 'admin' && (
               <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Portal Administrator" disabled />
              </div>
            )}
          </div>

          <Button>Save Changes</Button>
        </div>

        {/* Notifications Section */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-ai" />
            </div>
            <h2 className="font-display font-semibold text-lg">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Assignment Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming deadlines
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Usage Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alert when AI quota is running low
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Blockchain Confirmations</p>
                <p className="text-sm text-muted-foreground">
                  Notify when submissions are verified
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blockchain-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-blockchain" />
            </div>
            <h2 className="font-display font-semibold text-lg">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Public AI Declarations</p>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your AI usage history
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-lg">Help & Support</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Need help? Contact our support team or check the documentation.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">Documentation</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
