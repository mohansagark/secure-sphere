"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { ProfessionalInfo } from "@/types";

export const ProfessionalInfoManager: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfessionalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfessionalInfo | null>(
    null
  );
  const [formData, setFormData] = useState<{
    fullName: string;
    jobTitle: string;
    company: string;
    email: string;
    phone: string;
    linkedIn: string;
    address: string;
    skills: string;
    notes: string;
    category: "work" | "personal" | "emergency" | "reference";
  }>({
    fullName: "",
    jobTitle: "",
    company: "",
    email: "",
    phone: "",
    linkedIn: "",
    address: "",
    skills: "",
    notes: "",
    category: "work",
  });

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/professional-info?userId=${user.uid}`);
      if (response.ok) {
        const profilesData = await response.json();
        setProfiles(profilesData);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user, fetchProfiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const method = editingProfile ? "PUT" : "POST";
      const url = editingProfile
        ? `/api/professional-info?id=${editingProfile.id}&userId=${user.uid}`
        : "/api/professional-info";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user.uid,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        await fetchProfiles();
        setShowAddForm(false);
        setEditingProfile(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user || !confirm("Are you sure you want to delete this profile?"))
      return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/professional-info?id=${profileId}&userId=${user.uid}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchProfiles();
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (profile: ProfessionalInfo) => {
    setEditingProfile(profile);
    setFormData({
      fullName: profile.fullName,
      jobTitle: profile.jobTitle,
      company: profile.company,
      email: profile.email,
      phone: profile.phone || "",
      linkedIn: profile.linkedIn || "",
      address: profile.address || "",
      skills: profile.skills.join(", "),
      notes: profile.notes || "",
      category: profile.category,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      jobTitle: "",
      company: "",
      email: "",
      phone: "",
      linkedIn: "",
      address: "",
      skills: "",
      notes: "",
      category: "work",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work":
        return (
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
      case "personal":
        return <User className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "emergency":
        return <Phone className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Professional Information
          </h1>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(true);
            resetForm();
            setEditingProfile(null);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingProfile ? "Edit Profile" : "Add New Profile"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="John Doe"
              required
            />
            <Input
              label="Job Title"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              placeholder="Software Engineer"
              required
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              placeholder="Tech Corp"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              required
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
            <Input
              label="LinkedIn"
              value={formData.linkedIn}
              onChange={(e) =>
                setFormData({ ...formData, linkedIn: e.target.value })
              }
              placeholder="linkedin.com/in/johndoe"
            />
            <div className="md:col-span-2">
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Skills (comma-separated)"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="JavaScript, React, Node.js, Python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as typeof formData.category,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency Contact</option>
                <option value="reference">Reference</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProfile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingProfile ? "Update" : "Add"} Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Profiles</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No professional profiles added yet. Add your first profile to get
            started.
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    {getCategoryIcon(profile.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {profile.fullName}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {profile.category}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {profile.jobTitle} at {profile.company}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        {profile.email}
                      </div>
                      {profile.phone && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2" />
                          {profile.phone}
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {profile.address}
                        </div>
                      )}
                    </div>
                    {profile.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 5 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                              +{profile.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {profile.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(profile)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
