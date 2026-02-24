'use client';

import { useState, useCallback } from 'react';
import { Users, Plus, Mail, MoreHorizontal, Shield, Trash2, UserMinus, Crown, X } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

const INK2   = '#161B26';
const GREEN  = '#00C896';
const ORANGE = '#FF5C28';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';

// Sin datos ficticios — lista vacía hasta que existan usuarios reales
const INITIAL_MEMBERS: TeamMember[] = [];

const ROLE_CONFIG = {
  owner:  { label: 'Propietario', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Crown className="w-3 h-3" /> },
  admin:  { label: 'Admin',       color: '#1A6BFF', bg: 'rgba(26,107,255,0.12)', icon: <Shield className="w-3 h-3" /> },
  member: { label: 'Miembro',     color: MUTED,     bg: 'rgba(255,255,255,0.06)', icon: null },
};

export default function TeamsPage() {
  const [members, setMembers]           = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [showInviteModal, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState<'admin' | 'member'>('member');
  const [activeDropdown, setDropdown]   = useState<string | null>(null);

  const handleInvite = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail,
      email: inviteEmail,
      initials: inviteEmail.substring(0, 2).toUpperCase(),
      role: inviteRole,
      status: 'pending',
      joinedAt: 'Pendiente',
    };
    setMembers(p => [...p, newMember]);
    setInviteEmail('');
    setShowInvite(false);
  }, [inviteEmail, inviteRole]);

  const handleRemove = useCallback((id: string) => {
    setMembers(p => p.filter(m => m.id !== id));
    setDropdown(null);
  }, []);

  const handleChangeRole = useCallback((id: string, role: 'admin' | 'member') => {
    setMembers(p => p.map(m => m.id === id ? { ...m, role } : m));
    setDropdown(null);
  }, []);

  const active  = members.filter(m => m.status === 'active');
  const pending = members.filter(m => m.status === 'pending');
  const admins  = members.filter(m => m.role === 'admin' || m.role === 'owner');

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: GREEN }}>
              // ToneBOX — Gestión de Tóners
            </div>
            <h1 className="font-syne text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>
              Equipo
            </h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Gestiona los accesos a tu cuenta ToneBOX
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-syne font-bold text-sm transition-all hover:-translate-y-px"
            style={{ background: GREEN, color: '#0B0E14', border: 'none' }}
          >
            <Plus className="w-4 h-4" />
            Invitar miembro
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Activos',    val: active.length,  icon: <Users className="w-4 h-4" />,  color: GREEN },
            { label: 'Pendientes', val: pending.length, icon: <Mail className="w-4 h-4" />,   color: '#F59E0B' },
            { label: 'Admins',     val: admins.length,  icon: <Shield className="w-4 h-4" />, color: '#1A6BFF' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: INK2, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}1A`, color: s.color }}
              >
                {s.icon}
              </div>
              <div>
                <p className="font-syne font-extrabold text-lg leading-none" style={{ color: 'white' }}>{s.val}</p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista de miembros */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h3 className="font-syne font-bold" style={{ color: 'white' }}>Miembros del equipo</h3>
          </div>

          {members.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="font-semibold" style={{ color: MUTED }}>Sin miembros aún</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Invita a tu equipo para gestionar pedidos juntos
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {members.map(member => {
                const roleCfg = ROLE_CONFIG[member.role];
                return (
                  <div
                    key={member.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                      >
                        {member.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'white' }}>{member.name}</p>
                        <p className="text-xs truncate" style={{ color: MUTED }}>{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Role badge */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ color: roleCfg.color, background: roleCfg.bg }}
                      >
                        {roleCfg.icon}
                        {roleCfg.label}
                      </span>

                      {/* Pending badge */}
                      {member.status === 'pending' && (
                        <span
                          className="hidden sm:inline px-2 py-1 rounded-full text-xs font-bold"
                          style={{ color: ORANGE, background: 'rgba(255,92,40,0.1)' }}
                        >
                          Pendiente
                        </span>
                      )}

                      {/* Dropdown */}
                      {member.role !== 'owner' && (
                        <div className="relative">
                          <button
                            onClick={() => setDropdown(p => p === member.id ? null : member.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: MUTED }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {activeDropdown === member.id && (
                            <div
                              className="absolute right-0 mt-1 w-44 rounded-xl py-1 z-10"
                              style={{ background: '#1E2432', border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                            >
                              <button
                                onClick={() => handleChangeRole(member.id, 'admin')}
                                className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                              >
                                <Shield className="w-3.5 h-3.5" /> Hacer Admin
                              </button>
                              <button
                                onClick={() => handleChangeRole(member.id, 'member')}
                                className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Hacer Miembro
                              </button>
                              <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2"
                                style={{ color: ORANGE }}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal invitar */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: INK2, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-syne font-extrabold text-lg tracking-tight" style={{ color: 'white' }}>
                Invitar miembro
              </h2>
              <button onClick={() => setShowInvite(false)} style={{ color: MUTED }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colega@empresa.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${BORDER}`, color: 'white' }}
                  onFocus={e  => (e.currentTarget.style.borderColor = GREEN)}
                  onBlur={e   => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${BORDER}`, color: 'white', appearance: 'none' }}
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ border: `1px solid ${BORDER}`, color: MUTED, background: 'transparent' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-px"
                  style={{ background: GREEN, color: '#0B0E14', border: 'none' }}
                >
                  Enviar invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
