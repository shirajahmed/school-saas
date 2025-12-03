'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useTheme } from '@/providers/theme-provider';
import { useLanguage } from '@/providers/language-provider';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'हिन्दी', value: 'hi' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.settings')}</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                options={themeOptions}
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose your preferred color scheme
              </p>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                options={languageOptions}
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select your preferred language
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications in browser
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive important updates via SMS
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Active Sessions
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Login History
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>
              Control your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Privacy Settings
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              Data Retention
            </Button>
            
            <Button variant="destructive" className="w-full justify-start">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
