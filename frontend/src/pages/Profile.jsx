import React, { useState, useEffect, useMemo } from "react";
import { User as UserIcon, Key, Save, AlertCircle } from "lucide-react";
import LayoutShell from "../components/layout/LayoutShell";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const Profile = () => {
  const { user: reduxUser, token: reduxToken } = useSelector((s) => s.auth);

  const lsToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const lsUserRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const lsUser = (() => { try { return lsUserRaw ? JSON.parse(lsUserRaw) : null; } catch { return null; } })();
  const token = reduxToken || lsToken;
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const initialPrefill = useMemo(() => ({
    name: reduxUser?.name || lsUser?.name || "",
    username: reduxUser?.username || lsUser?.username || "",
    designation: reduxUser?.designation || lsUser?.designation || "",
    email: reduxUser?.email || lsUser?.email || "",
    contact: reduxUser?.contact || lsUser?.contact || "",
    photo: reduxUser?.photo || lsUser?.photo || "",
    signature: reduxUser?.signature || lsUser?.signature || ""
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const [profile, setProfile] = useState(initialPrefill);
  const [initialProfile, setInitialProfile] = useState(initialPrefill);

  // files selected by user
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile.photo || "");
  const [signaturePreview, setSignaturePreview] = useState(profile.signature || "");

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Username availability
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState("");

  const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isTextDirty = !deepEqual(
    { ...profile, photo: undefined, signature: undefined },
    { ...initialProfile, photo: undefined, signature: undefined }
  );
  const isFilesDirty = !!photoFile || !!signatureFile;
  const isProfileDirty = isTextDirty || isFilesDirty;
  const isPasswordDirty = !!passwords.currentPassword && !!passwords.newPassword;

  // Fetch from DB
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.user) throw new Error(data?.message || "Failed to load profile");

        const u = data.user;
        const filled = {
          name: u.name || "",
          username: u.username || "",
          designation: u.designation || "",
          email: u.email || "",
          contact: u.contact || "",
          photo: u.photo || "",
          signature: u.signature || "",
        };
        setProfile(filled);
        setInitialProfile(filled);
        setPhotoPreview(filled.photo || "");
        setSignaturePreview(filled.signature || "");
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_BASE_URL, token]);

  // Debounced username check
  const checkUsername = useMemo(
    () => debounce(async (value) => {
      if (!token || !value || value === initialProfile.username) {
        setUsernameAvailable(true); setUsernameMsg(""); setCheckingUsername(false); return;
      }
      try {
        setCheckingUsername(true);
        const res = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || "Check failed");
        setUsernameAvailable(data.available);
        setUsernameMsg(data.available ? "" : "Username is already taken");
      } catch {
        setUsernameAvailable(false);
        setUsernameMsg("Unable to verify username right now");
      } finally { setCheckingUsername(false); }
    }, 400),
    [API_BASE_URL, token, initialProfile.username]
  );

  useEffect(() => { if (profile.username) checkUsername(profile.username); }, [profile.username, checkUsername]);

  // Previews on file selection
  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!signatureFile) return;
    const url = URL.createObjectURL(signatureFile);
    setSignaturePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureFile]);

  // Submit profile (multipart FormData)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You need to log in again.");
    if (!isProfileDirty) return;
    if (!usernameAvailable) return toast.error("Please choose a different username.");

    try {
      setLoading(true);
      const fd = new FormData();
      // text fields (only append if not undefined to keep payload tidy)
      fd.append('name', profile.name ?? '');
      fd.append('username', profile.username ?? '');
      fd.append('designation', profile.designation ?? '');
      fd.append('email', profile.email ?? '');
      fd.append('contact', profile.contact ?? '');
      if (photoFile) fd.append('photo', photoFile);
      if (signatureFile) fd.append('signature', signatureFile);

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }, // DON'T set Content-Type; browser sets multipart boundary
        body: fd
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.user) throw new Error(data?.message || "Profile update failed");

      toast.success("Profile updated successfully!");

      const u = data.user;
      const updated = {
        name: u.name || "",
        username: u.username || "",
        designation: u.designation || "",
        email: u.email || "",
        contact: u.contact || "",
        photo: u.photo || "",
        signature: u.signature || "",
      };
      setProfile(updated);
      setInitialProfile(updated);
      setPhotoPreview(updated.photo || "");
      setSignaturePreview(updated.signature || "");
      setPhotoFile(null);
      setSignatureFile(null);

      try {
        const stored = lsUser || {};
        localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      } catch {}
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Error updating profile");
    } finally { setLoading(false); }
  };

  // Submit password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You need to log in again.");
    if (!isPasswordDirty) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Password change failed");
      toast.success("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error("Password update error:", err);
      toast.error(err.message || "Error changing password");
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <LayoutShell pageTitle="Profile">
        <main className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              You’re not logged in. Please <a className="underline" href="/login">log in</a> to view your profile.
            </p>
          </div>
        </main>
      </LayoutShell>
    );
  }

  if (loading && !initialProfile.name && !initialProfile.username && !initialProfile.designation) {
    return (
      <LayoutShell pageTitle="Profile">
        <main className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </main>
      </LayoutShell>
    );
  }

  if (error) {
    return (
      <LayoutShell pageTitle="Profile">
        <main className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </main>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell pageTitle="Profile">
      <main className="p-6 space-y-6 overflow-auto flex-1 max-w-3xl mx-auto">

        {/* Profile Update Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-blue-600" /> Profile Information
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className={`mt-1 block w-full rounded-md border ${
                  usernameAvailable ? 'border-gray-300' : 'border-red-400'
                } shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {!usernameAvailable && <p className="mt-1 text-sm text-red-600">{usernameMsg}</p>}
              {checkingUsername && <p className="mt-1 text-sm text-gray-500">Checking username…</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input
                type="text"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="tel"
                value={profile.contact}
                onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Signature</label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="w-40 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="signature preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">No signature</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isProfileDirty || !usernameAvailable || checkingUsername}
              className={`px-4 py-2 rounded text-white flex items-center ${
                loading || !isProfileDirty || !usernameAvailable || checkingUsername
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </button>
          </form>
        </div>

        {/* Password Change Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2 text-green-600" /> Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordDirty}
              className={`px-4 py-2 rounded text-white flex items-center ${
                loading || !isPasswordDirty ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Save className="w-4 h-4 mr-2" /> Update Password
            </button>
          </form>
        </div>
      </main>
    </LayoutShell>
  );
};

export default Profile;
