import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useCoaches } from '../hooks/useCoaches'
import { useBranches } from '../hooks/useBranches'
import { useSeasons } from '../hooks/useSeasons'
import InviteCoachModal from '../components/admin/InviteCoachModal'
import BranchModal from '../components/admin/BranchModal'
import SeasonModal from '../components/admin/SeasonModal'
import { supabase } from '../lib/supabase'
import './AdminPage.css'

// ─── Club setup (shown when superadmin has no club yet) ────────
function ClubSetupView({ userId, onDone }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1 = create club, 2 = create first branch
  const [newClubId, setNewClubId] = useState(null)

  const [clubNameVal, setClubNameVal] = useState('')
  const [savingClub, setSavingClub] = useState(false)
  const [clubError, setClubError] = useState('')

  const [branchNameVal, setBranchNameVal] = useState('')
  const [savingBranch, setSavingBranch] = useState(false)
  const [branchError, setBranchError] = useState('')

  async function handleCreateClub() {
    if (!clubNameVal.trim()) return
    setSavingClub(true)
    setClubError('')

    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .insert({ name: clubNameVal.trim() })
      .select('id')
      .single()

    if (clubErr) { setSavingClub(false); setClubError(t('admin.error_generic')); return }

    const { error: userErr } = await supabase
      .from('users')
      .update({ club_id: club.id })
      .eq('id', userId)

    setSavingClub(false)
    if (userErr) { setClubError(t('admin.error_generic')); return }

    setNewClubId(club.id)
    setStep(2)
  }

  async function handleCreateBranch() {
    if (!branchNameVal.trim()) return
    setSavingBranch(true)
    setBranchError('')

    const { error: branchErr } = await supabase
      .from('branches')
      .insert({ club_id: newClubId, name: branchNameVal.trim() })

    setSavingBranch(false)
    if (branchErr) { setBranchError(t('admin.error_generic')); return }

    onDone()
  }

  return (
    <div className="admin-page fade-up">
      <div className="admin-page__header">
        <h1 className="admin-page__title">{t('admin.title')}</h1>
      </div>

      <div className="admin-setup">
        {step === 1 && (
          <>
            <div className="admin-setup__notice">
              <p className="admin-setup__notice-title">{t('admin.no_club_title')}</p>
              <p className="admin-setup__notice-sub">{t('admin.no_club_sub')}</p>
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.club_name_label')}</label>
              <input
                className="form-input"
                value={clubNameVal}
                onChange={e => setClubNameVal(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateClub()}
              />
            </div>

            {clubError && <p className="admin-modal__error">{clubError}</p>}

            <div className="admin-setup__footer">
              <button
                className="btn btn--gold"
                onClick={handleCreateClub}
                disabled={savingClub || !clubNameVal.trim()}
              >
                {t('admin.create_club')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="admin-setup__notice admin-setup__notice--success">
              <p className="admin-setup__notice-sub">{t('admin.club_created_prompt')}</p>
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.branch_name')}</label>
              <input
                className="form-input"
                value={branchNameVal}
                onChange={e => setBranchNameVal(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
              />
            </div>

            {branchError && <p className="admin-modal__error">{branchError}</p>}

            <div className="admin-setup__footer">
              <button className="btn" onClick={onDone}>{t('admin.skip')}</button>
              <button
                className="btn btn--gold"
                onClick={handleCreateBranch}
                disabled={savingBranch || !branchNameVal.trim()}
              >
                {t('admin.add_first_branch')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Branch row with inline edit ───────────────────────────────
function BranchRow({ branch, stats, onSaved, onAddSeason }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(branch.name)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = nameVal.trim()
    if (!trimmed) { setEditing(false); setNameVal(branch.name); return }
    if (trimmed === branch.name) { setEditing(false); return }
    setSaving(true)
    await supabase.from('branches').update({ name: trimmed }).eq('id', branch.id)
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  function handleCancel() {
    setEditing(false)
    setNameVal(branch.name)
  }

  const playerCount = stats?.playerCount ?? null
  const coachCount  = stats?.coachCount  ?? null
  const season      = stats?.currentSeason ?? null

  const metaParts = []
  if (playerCount !== null) metaParts.push(`${playerCount} ${t('admin.stat_players')}`)
  if (coachCount  !== null) metaParts.push(`${coachCount} ${t('admin.stat_coaches')}`)
  if (season)               metaParts.push(season.name)
  else if (playerCount !== null) metaParts.push(t('admin.no_season'))

  return (
    <div className="admin-row admin-row--branch">
      <div className="admin-row__info">
        {editing ? (
          <input
            className="form-input branch-name-input"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
            autoFocus
          />
        ) : (
          <span className="admin-row__primary">{branch.name}</span>
        )}
        {metaParts.length > 0 && (
          <span className="admin-row__meta">{metaParts.join(' · ')}</span>
        )}
      </div>

      <div className="admin-row__actions">
        {editing ? (
          <>
            <button className="btn btn--sm btn--gold" onClick={handleSave} disabled={saving}>
              {t('admin.save')}
            </button>
            <button className="btn btn--sm" onClick={handleCancel}>
              {t('admin.cancel')}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--sm btn--ghost" onClick={() => onAddSeason(branch.id)}>
              {t('admin.add_season')}
            </button>
            <button className="btn btn--sm" onClick={() => setEditing(true)}>
              {t('admin.edit_name')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main admin page ───────────────────────────────────────────
export default function AdminPage() {
  const { t } = useTranslation()
  const { clubId, user, loading: authLoading, refreshProfile } = useAuth()

  const [tab, setTab] = useState('coaches')
  const [selectedBranchId, setSelectedBranchId] = useState(null)

  const { coaches, pendingInvites, loading: coachLoading, refetch: refetchCoaches } = useCoaches(clubId)
  const { branches, loading: branchLoading, refetch: refetchBranches } = useBranches(clubId)
  const { seasons, loading: seasonLoading, refetch: refetchSeasons } = useSeasons(selectedBranchId)

  // Branch stats: player count, coach count, current season
  const [branchStats, setBranchStats] = useState({})

  const [showInviteCoach, setShowInviteCoach] = useState(false)
  const [showAddBranch,   setShowAddBranch]   = useState(false)
  const [showAddSeason,    setShowAddSeason]    = useState(false)
  const [seasonBranchId,   setSeasonBranchId]   = useState(null)

  // Auto-select first branch for the seasons tab
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id)
    }
  }, [branches, selectedBranchId])

  // Load branch stats whenever branches are available
  useEffect(() => {
    if (!branches.length || !clubId) { setBranchStats({}); return }

    const bids = branches.map(b => b.id)

    Promise.all([
      supabase.from('players').select('branch_id').in('branch_id', bids).is('archived_at', null),
      supabase.from('coach_access').select('user_id, branch_id').in('branch_id', bids),
      supabase.from('seasons').select('id, name, branch_id').in('branch_id', bids).eq('is_current', true),
    ]).then(([playersRes, coachRes, seasonsRes]) => {
      const stats = {}
      bids.forEach(bid => {
        stats[bid] = {
          playerCount:   (playersRes.data ?? []).filter(p => p.branch_id === bid).length,
          coachCount:    new Set((coachRes.data ?? []).filter(ca => ca.branch_id === bid).map(ca => ca.user_id)).size,
          currentSeason: (seasonsRes.data ?? []).find(s => s.branch_id === bid) ?? null,
        }
      })
      setBranchStats(stats)
    })
  }, [branches, clubId])

  async function handleSetCurrent(seasonId) {
    if (!selectedBranchId) return
    await supabase.from('seasons').update({ is_current: false }).eq('branch_id', selectedBranchId)
    await supabase.from('seasons').update({ is_current: true }).eq('id', seasonId)
    refetchSeasons()
  }

  function scopeLabel(coach) {
    const accesses = coach.coach_access ?? []
    if (accesses.length === 0) return t('admin.access_none')
    return accesses.map(a =>
      `${a.branches?.name ?? '—'} · ${a.age_group ?? t('admin.all_groups')}`
    ).join(', ')
  }

  function openAddSeason(branchId) {
    setSeasonBranchId(branchId)
    setShowAddSeason(true)
  }

  // Show club setup flow if auth is done and club doesn't exist
  if (!authLoading && !clubId) {
    return (
      <ClubSetupView
        userId={user?.id}
        onDone={refreshProfile}
      />
    )
  }

  return (
    <div className="admin-page fade-up">
      <div className="admin-page__header">
        <h1 className="admin-page__title">{t('admin.title')}</h1>
      </div>

      <div className="admin-page__tabs">
        {['coaches', 'branches', 'seasons'].map(key => (
          <button
            key={key}
            className={`admin-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`admin.tab_${key}`)}
          </button>
        ))}
      </div>

      {/* ── COACHES ── */}
      {tab === 'coaches' && (
        <div className="admin-section">
          <div className="admin-section__toolbar">
            <button className="btn btn--gold btn--sm" onClick={() => setShowInviteCoach(true)}>
              {t('admin.invite_coach')}
            </button>
          </div>

          {coachLoading ? (
            <div>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{height:'56px',borderRadius:'10px',marginBottom:'8px'}} />
              ))}
            </div>
          ) : coaches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <p className="empty-title">{t('admin.coaches_empty')}</p>
            </div>
          ) : (
            <div className="admin-list">
              {coaches.map(coach => (
                <div key={coach.id} className="admin-row">
                  <div className="admin-row__info">
                    <span className="admin-row__primary">
                      {coach.display_name || coach.email}
                    </span>
                    {coach.display_name && (
                      <span className="admin-row__secondary">{coach.email}</span>
                    )}
                    <span className="admin-row__meta">{scopeLabel(coach)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingInvites.length > 0 && (
            <>
              <p className="admin-section__sublabel">{t('admin.pending_invites')}</p>
              <div className="admin-list">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="admin-row admin-row--pending">
                    <div className="admin-row__info">
                      <span className="admin-row__primary">{inv.invited_email}</span>
                      <span className="admin-row__meta">
                        {inv.branches?.name ?? '—'} · {inv.age_group ?? t('admin.all_groups')}
                      </span>
                    </div>
                    <span className="tag tag-amber">{t('admin.pending_badge')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BRANCHES ── */}
      {tab === 'branches' && (
        <div className="admin-section">
          <div className="admin-section__toolbar">
            <button className="btn btn--gold btn--sm" onClick={() => setShowAddBranch(true)}>
              {t('admin.add_branch')}
            </button>
          </div>

          {branchLoading ? (
            <div>
              {[1,2].map(i => (
                <div key={i} className="skeleton" style={{height:'56px',borderRadius:'10px',marginBottom:'8px'}} />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <p className="empty-title">{t('admin.branches_empty')}</p>
            </div>
          ) : (
            <div className="admin-list">
              {branches.map(b => (
                <BranchRow
                  key={b.id}
                  branch={b}
                  stats={branchStats[b.id]}
                  onSaved={() => { refetchBranches() }}
                  onAddSeason={openAddSeason}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SEASONS ── */}
      {tab === 'seasons' && (
        <div className="admin-section">
          <div className="admin-section__toolbar">
            <select
              className="form-input admin-branch-select"
              value={selectedBranchId ?? ''}
              onChange={e => setSelectedBranchId(e.target.value)}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button className="btn btn--gold btn--sm" onClick={() => openAddSeason(selectedBranchId)}>
              {t('admin.add_season')}
            </button>
          </div>

          {seasonLoading ? (
            <div>
              {[1,2].map(i => (
                <div key={i} className="skeleton" style={{height:'56px',borderRadius:'10px',marginBottom:'8px'}} />
              ))}
            </div>
          ) : seasons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <p className="empty-title">{t('admin.seasons_empty')}</p>
            </div>
          ) : (
            <div className="admin-list">
              {seasons.map(s => (
                <div key={s.id} className="admin-row">
                  <div className="admin-row__info">
                    <span className="admin-row__primary">{s.name}</span>
                    <span className="admin-row__meta">
                      {s.start_date} – {s.end_date}
                    </span>
                  </div>
                  <div className="admin-row__actions">
                    {s.is_current ? (
                      <span className="tag tag-green">{t('admin.current_badge')}</span>
                    ) : (
                      <button
                        className="btn btn--sm"
                        onClick={() => handleSetCurrent(s.id)}
                      >
                        {t('admin.set_current')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showInviteCoach && (
        <InviteCoachModal
          branches={branches}
          onClose={() => setShowInviteCoach(false)}
          onSaved={() => { refetchCoaches() }}
        />
      )}
      {showAddBranch && (
        <BranchModal
          onClose={() => setShowAddBranch(false)}
          onSaved={() => { setShowAddBranch(false); refetchBranches() }}
        />
      )}
      {showAddSeason && seasonBranchId && (
        <SeasonModal
          branchId={seasonBranchId}
          onClose={() => { setShowAddSeason(false); setSeasonBranchId(null) }}
          onSaved={() => {
            setShowAddSeason(false)
            setSeasonBranchId(null)
            refetchSeasons()
            // Reload branch stats to reflect new current season
            refetchBranches()
          }}
        />
      )}
    </div>
  )
}
