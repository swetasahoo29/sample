"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Project = {
  id?: number;
  name: string;
  scripting_hours: number;
  shooting_hours: number;
  editing_hours: number;
  audio_hours: number;
  [key: string]: string | number | undefined;
};

type TeamBandwidth = {
  team_name: string;
  max_weekly_hours: number;
};

type TeamStat = TeamBandwidth & {
  used: number;
  status: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");

  async function refreshData() {
    // 1. Fetch data from both tables
    const { data: projectsData } = await supabase.from("projects").select("*");
    const { data: bandwidthData } = await supabase
      .from("team_bandwidth")
      .select("*");

    setProjects(projectsData || []);

    // 2. Calculate capacity status
    const summary = bandwidthData?.map((team: { team_name: string; max_weekly_hours: number; }) => {
      const used = projectsData?.reduce(
        (acc, p) => acc + (p[`${team.team_name.toLowerCase()}_hours`] || 0),
        0,
      );
      return {
        ...team,
        used,
        status:
          used >= team.max_weekly_hours
            ? "🔴 At Capacity"
            : "🟢 Open for Booking",
      };
    });
    setStats(summary || []);
  }

  async function addProject() {
    const { error } = await supabase.from("projects").insert([
      {
        name: name,
        scripting_hours: 10,
        shooting_hours: 10,
        editing_hours: 10,
        audio_hours: 10,
      },
    ]);
    if (error) alert("Error: " + error.message);
    else {
      setName("");
      refreshData(); // Refresh the page automatically
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await refreshData();
    };
    loadData();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8">Agency Capacity Monitor</h1>

      {/* 1. Onboarding Form */}
      <div className="p-6 border rounded-lg shadow-sm bg-gray-50 mb-10">
        <h2 className="font-semibold mb-4">Onboard New Project</h2>
        <input
          className="border p-2 rounded w-64"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Campaign Name"
        />
        <button
          onClick={addProject}
          className="bg-blue-600 text-white p-2 px-6 rounded ml-2 hover:bg-blue-700"
        >
          Add Project
        </button>
      </div>

      {/* 2. Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {stats.map((s) => (
          <div key={s.team_name} className="p-6 border rounded-lg shadow">
            <h2 className="text-xl font-bold">{s.team_name}</h2>
            <p className="text-gray-600 mt-2">
              Load: {s.used} / {s.max_weekly_hours} hours
            </p>
            <p className="text-lg font-bold mt-1">{s.status}</p>
          </div>
        ))}
      </div>

      {/* 3. Project List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Projects</h2>
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="p-4 border rounded hover:bg-gray-50">
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-sm text-gray-500">
                Scripting: {p.scripting_hours}h | Shooting: {p.shooting_hours}h
                | Editing: {p.editing_hours}h | Audio: {p.audio_hours}h
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
