"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TradingDashboardPremium() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [form, setForm] = useState({ model: "", result: "Win", pnl: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const signIn = async () => {
    const email = prompt("Enter email");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email for login link");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    if (user) fetchTrades();
  }, [user]);

  const fetchTrades = async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: true });

    setTrades(data || []);
  };

  const addTrade = async () => {
    if (!form.model || !form.pnl) return;

    await supabase.from("trades").insert([
      {
        user_id: user.id,
        model: form.model,
        result: form.result,
        pnl: parseFloat(form.pnl)
      }
    ]);

    setForm({ model: "", result: "Win", pnl: "" });
    fetchTrades();
  };

  const totalTrades = trades.length;
  const wins = trades.filter(t => t.result === "Win").length;
  const winRate = totalTrades
    ? ((wins / totalTrades) * 100).toFixed(1)
    : "0";

  const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);

  let running = 0;
  const equity = trades.map((t, i) => {
    running += t.pnl;
    return { trade: i + 1, equity: running };
  });

  const pnlByModel = Object.values(
    trades.reduce((acc: any, t: any) => {
      if (!acc[t.model]) acc[t.model] = { model: t.model, pnl: 0 };
      acc[t.model].pnl += t.pnl;
      return acc;
    }, {})
  );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-gray-400">Track your edge like a professional</p>
          <Button onClick={signIn}>Login</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={signOut}>Logout</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 rounded-2xl shadow-xl">
          <CardContent className="p-6">Trades: {totalTrades}</CardContent>
        </Card>
        <Card className="bg-gray-800 rounded-2xl shadow-xl">
          <CardContent className="p-6">Win Rate: {winRate}%</CardContent>
        </Card>
        <Card className="bg-gray-800 rounded-2xl shadow-xl">
          <CardContent className="p-6">PnL: ${totalPnL}</CardContent>
        </Card>
      </div>

      {/* Add Trade */}
      <Card className="bg-gray-800 rounded-2xl shadow-xl">
        <CardContent className="p-6 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Model"
            value={form.model}
            onChange={e => setForm({ ...form, model: e.target.value })}
          />

          <select
            className="bg-gray-700 p-2 rounded"
            value={form.result}
            onChange={e => setForm({ ...form, result: e.target.value })}
          >
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
          </select>

          <Input
            placeholder="PnL"
            value={form.pnl}
            onChange={e => setForm({ ...form, pnl: e.target.value })}
          />

          <Button onClick={addTrade}>Add Trade</Button>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 rounded-2xl shadow-xl">
          <CardContent className="p-6">
            <h2 className="mb-4">PnL by Model</h2>
            <BarChart width={400} height={250} data={pnlByModel}>
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pnl" />
            </BarChart>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 rounded-2xl shadow-xl">
          <CardContent className="p-6">
            <h2 className="mb-4">Equity Curve</h2>
            <LineChart width={400} height={250} data={equity}>
              <XAxis dataKey="trade" />
              <YAxis />
              <Tooltip />
              <Line dataKey="equity" />
            </LineChart>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
