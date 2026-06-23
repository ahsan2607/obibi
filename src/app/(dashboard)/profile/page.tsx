"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Save, ArrowLeft, Check, AlertCircle, Lock } from "lucide-react";

// Preset gradients for avatars
const PRESET_AVATARS = [
  { id: "ocean", label: "Ocean Breeze", class: "bg-gradient-to-tr from-blue-500 to-teal-400 text-white" },
  { id: "sunset", label: "Sunset Glow", class: "bg-gradient-to-tr from-orange-500 to-amber-400 text-white" },
  { id: "berry", label: "Berry Smoothie", class: "bg-gradient-to-tr from-purple-600 to-pink-500 text-white" },
  { id: "forest", label: "Forest Zen", class: "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white" },
  { id: "midnight", label: "Midnight Mystery", class: "bg-gradient-to-tr from-slate-800 to-indigo-950 text-white" },
  { id: "rose", label: "Rose Petal", class: "bg-gradient-to-tr from-rose-500 to-red-400 text-white" },
];

/**
 * ProfilePage component where users can view and update their profile details.
 * Integrates global Auth context updates so modifications sync instantly.
 */
export default function ProfilePage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password renewal state variables
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (!user) {
      setPwdError("User session not found.");
      return;
    }

    if (!oldPassword) {
      setPwdError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdSaving(true);

    try {
      // 1. Verify old password by attempting to sign in
      const { error: authCheckError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      });
      if (authCheckError) {
        throw new Error("Incorrect current password. Please try again.");
      }

      // 2. Update password in Supabase Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authUpdateError) throw authUpdateError;

      // 3. Update password column in patients table to keep it synced
      const { error: dbError } = await supabase
        .from("patients")
        .update({ password: newPassword })
        .eq("id", user.id);
      if (dbError) throw dbError;

      setPwdSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to change password:", err);
      setPwdError(err.message || "Failed to update password. Please try again.");
    } finally {
      setPwdSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      const currentAvatar = user.avatar_url || "ocean";
      setAvatarUrl(currentAvatar);
      
      const isPreset = PRESET_AVATARS.some(preset => preset.id === currentAvatar);
      if (!isPreset && currentAvatar) {
        setCustomUrl(currentAvatar);
        setUseCustomUrl(true);
      } else {
        setUseCustomUrl(false);
      }
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Display Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const finalAvatarUrl = useCustomUrl ? customUrl.trim() : avatarUrl;

    try {
      const { error: updateError } = await supabase
        .from("patients")
        .update({
          name: name.trim()
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Persist the avatar URL selection locally in client-side LocalStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`obibi_avatar_${user.id}`, finalAvatarUrl);
      }

      // Update auth context state to reflect changes globally in app header/sidebar
      login({
        ...user,
        name: name.trim(),
        avatar_url: finalAvatarUrl
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to render active avatar preview
  const renderAvatarPreview = (sizeClass = "w-24 h-24 text-4xl") => {
    const displayAvatar = useCustomUrl ? customUrl : avatarUrl;
    const activePreset = PRESET_AVATARS.find(p => p.id === displayAvatar);
    const initial = name ? name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

    if (useCustomUrl && customUrl.startsWith("http")) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden border-4 border-white shadow-lg`}>
          <img src={customUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => {
            (e.target as any).style.display = 'none';
          }} />
        </div>
      );
    }

    const gradientClass = activePreset ? activePreset.class : "bg-gradient-to-tr from-blue-500 to-teal-400 text-white";
    return (
      <div className={`${sizeClass} rounded-full ${gradientClass} flex items-center justify-center font-bold border-4 border-white shadow-lg select-none`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600 hover:text-gray-900"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">User Profile</h1>
              <p className="text-sm text-gray-500">Manage your account information and preferences.</p>
            </div>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Preview (Left) */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-full bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              {/* Background gradient card */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
              
              {/* Avatar position */}
              <div className="pt-8 z-10">
                {renderAvatarPreview("w-28 h-28 text-5xl")}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-800">{name || "User"}</h3>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                  <Mail size={14} />
                  {user.email}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-gray-100">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  Patient Account
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form (Right) */}
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 animate-shake">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm border border-emerald-100">
                  <Check size={18} className="shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <User size={16} className="text-gray-400" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
                  disabled={saving}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Mail size={16} className="text-gray-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">Email is linked to your login credentials and cannot be edited.</p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-4 pt-2">
                <label className="text-sm font-semibold text-gray-700 block">Select Profile Avatar</label>
                
                {/* Preset Avatar Selection Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = !useCustomUrl && avatarUrl === preset.id;
                    const initial = name ? name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.id);
                          setUseCustomUrl(false);
                        }}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition relative hover:scale-105 active:scale-95 ${
                          isSelected 
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        title={preset.label}
                      >
                        <div className={`w-10 h-10 rounded-full ${preset.class} flex items-center justify-center font-bold text-xs shadow-sm mb-1`}>
                          {initial}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                          {preset.label.split(" ")[0]}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom URL Option */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomUrl"
                      checked={useCustomUrl}
                      onChange={(e) => setUseCustomUrl(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="useCustomUrl" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      Use a custom profile image URL
                    </label>
                  </div>

                  {useCustomUrl && (
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
                      disabled={saving}
                    />
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="px-5 py-3 border border-gray-300 hover:bg-gray-50 rounded-2xl text-sm font-semibold text-gray-700 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Change Password Card */}
            <form onSubmit={handlePasswordChange} className="mt-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-800 tracking-tight border-b border-gray-100 pb-3 flex items-center gap-2">
                <Lock size={18} className="text-blue-600 animate-pulse" />
                Change Password
              </h2>

              {pwdError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm border border-emerald-100">
                  <Check size={18} className="shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
                  disabled={pwdSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
                    disabled={pwdSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
                    disabled={pwdSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pwdSaving}
                >
                  {pwdSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
