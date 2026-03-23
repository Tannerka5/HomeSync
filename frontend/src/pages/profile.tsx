import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Profile · HomeSync";
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  }, [user]);

  const normalizedUser = useMemo(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
    }),
    [user],
  );

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    const touchedPassword = currentPassword.length > 0 || newPassword.length > 0;
    if (touchedPassword) {
      if (!currentPassword) nextErrors.currentPassword = "Current password is required.";
      if (!newPassword) nextErrors.newPassword = "New password is required.";
      if (newPassword && newPassword.length < 8) {
        nextErrors.newPassword = "New password must be at least 8 characters.";
      }
      if (newPassword !== confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormMessage("");

    if (!validate()) return;

    const payload: Record<string, string> = {};
    if (firstName.trim() !== normalizedUser.firstName) payload.firstName = firstName.trim();
    if (lastName.trim() !== normalizedUser.lastName) payload.lastName = lastName.trim();
    if (email.trim().toLowerCase() !== normalizedUser.email.toLowerCase()) {
      payload.email = email.trim().toLowerCase();
    }

    const touchedPassword = currentPassword.length > 0 || newPassword.length > 0;
    if (touchedPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setFormMessage("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(payload);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setFormMessage("Profile updated.");
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Update your account settings.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName ? (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName ? (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Role</Label>
              <Input
                id="userType"
                value={user?.userType ?? ""}
                disabled
                className="capitalize disabled:opacity-90"
              />
              <p className="text-xs text-muted-foreground">Role changes are currently disabled.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errors.currentPassword ? (
                <p className="text-xs text-destructive">{errors.currentPassword}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword ? (
                <p className="text-xs text-destructive">{errors.newPassword}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {formMessage ? <p className="text-sm text-muted-foreground">{formMessage}</p> : null}

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
