"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// FIXED: All required icons imported
import { ShieldCheck, Copy, Check, Loader2, Award, Zap, Landmark } from "lucide-react";

export default function StudentVault() {
  const [admission, setAdmission] = useState("");
  const [univSearch, setUnivSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRecord = async () => {
    if (!admission || !univSearch) return alert("Fill both fields.");
    setLoading(true);
    const { data: res } = await supabase.from('certificates')
      .select('*').eq('university_name', univSearch.trim()).eq('roll_no', admission.trim()).single();
    
    if (res) setData(res);
    else alert("Record not found on secure ledger.");
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12 bg-[#fef7f0]">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black italic tracking-tighter text-gray-800">Vault<span className="text-amber-500">.</span></h2>
        <div className="max-w-md mx-auto space-y-4 pt-6">
          <Input placeholder="UNIVERSITY NAME" className="h-16 bg-white border-amber-200 rounded-2xl px-6 font-bold text-gray-800 placeholder:text-amber-400" onChange={e => setUnivSearch(e.target.value)} />
          <Input placeholder="ADMISSION NUMBER" className="h-16 bg-white border-amber-200 rounded-2xl px-6 font-bold text-gray-800 placeholder:text-amber-400" onChange={e => setAdmission(e.target.value)} />
          <Button onClick={fetchRecord} className="w-full h-16 bg-amber-500 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-300 shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-600/20">
            {loading ? <Loader2 className="animate-spin" /> : "Unlock My Certificate"}
          </Button>
        </div>
      </div>

      {data && (
        <div className="certificate-warm p-1 relative max-w-2xl w-full rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="bg-[#fef7f0]/90 backdrop-blur-3xl rounded-[2.9rem] p-10 space-y-12 relative overflow-hidden border border-amber-200/50">
            <ShieldCheck size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Zap size={12} className="text-amber-600" />
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest italic">Blockchain Verified</span>
                </div>
                <h3 className="text-6xl font-black leading-none text-white tracking-tighter">{data.student_name}</h3>
              </div>
              <div className="bg-white p-2 rounded-2xl shadow-2xl border-4 border-white/10">
                <QRCodeSVG value={`${window.location.origin}/employer?hash=${data.hash}`} size={90} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-10 relative z-10">
              <CertField label="Issuing Node" value={data.university_name} icon={<Landmark size={14} />} />
              <CertField label="Admission ID" value={data.roll_no} icon={<Award size={14} />} />
              <CertField label="Degree" value={data.degree_name} />
              <CertField label="Class Of" value={data.year_of_passing} />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between px-1">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Ledger Hash</p>
                {copied && <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Copied!</span>}
              </div>
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                <code className="text-[10px] text-amber-800 font-mono truncate mr-4">{data.hash}</code>
                <button onClick={handleCopy} className={`p-2.5 rounded-xl transition-all duration-300 ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white'}`}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertField({ label, value, icon }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black text-white italic tracking-tight leading-none">{value}</p>
    </div>
  );
}
