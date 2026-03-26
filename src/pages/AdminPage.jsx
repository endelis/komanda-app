import { useState } from 'react'
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

export default function AdminPage() {
  const { t } = useTranslation()
  const { clubId } = useAuth()

  const [tab, setTab] = useState('coaches')
  const [selectedBranchId, setSelectedBranchId] = useState(null)

  const { coaches, pendingInvites, loading: coachLoading, refetch: refetchCoaches } = useCoaches(clubId)
  const { branches, loading: branchLoading, refetch: refetchBranches } = useBranches(clubId)
  const { seasons, loading: seasonLoading, refetch: refetchSeasons } = useSeasons(selectedBranchId)

  const [showInviteCoach, setShowInviteCoach] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [showAddSeason, setShowAddSeason] = useState(false)

  // Set selectedBranchId to first branch when branches load
  if (!selectedBranchId && branches.length > 0) {
    setSelectedBranchId(branches[0].id)
  }

  async function handleSetCurrent(seasonId) {
    if (!selectedBranchId) return
    // Clear current for this branch, then set the selected one
    await supabase
      .from('seasons')
      .update({ is_current: false })
      .eq('branch_id', selectedBranchId)
    await supabase
      .from('seasons')
      .update({ is_current: true })
      .eq('id', seasonId)
    refetchSeasons()
  }

  function scopeLabel(coach) {
    const accesses = coach.coach_access ?? []
    if (accesses.length === 0) return t('admin.access_none')
    return accesses.map(a =>
      `${a.branches?.name ?? '—'} · ${a.age_group ?? t('admin.all_groups')}`
    ).join(', ')
  }

  return (
    <div className="admin-page">
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
            <p className="admin-empty">{t('app.loading')}</p>
          ) : coaches.length === 0 ? (
            <p className="admin-empty">{t('admin.coaches_empty')}</p>
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
                    <span className="tag-amber">{t('admin.pending_badge')}</span>
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
            <p className="admin-empty">{t('app.loading')}</p>
          ) : branches.length === 0 ? (
            <p className="admin-empty">{t('admin.branches_empty')}</p>
          ) : (
            <div className="admin-list">
              {branches.map(b => (
                <div key={b.id} className="admin-row">
                  <span className="admin-row__primary">{b.name}</span>
                </div>
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
            <button className="btn btn--gold btn--sm" onClick={() => setShowAddSeason(true)}>
              {t('admin.add_season')}
            </button>
          </div>

          {seasonLoading ? (
            <p className="admin-empty">{t('app.loading')}</p>
          ) : seasons.length === 0 ? (
            <p className="admin-empty">{t('admin.seasons_empty')}</p>
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
                      <span className="tag-green">{t('admin.current_badge')}</span>
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

      {showAddSeason && selectedBranchId && (
        <SeasonModal
          branchId={selectedBranchId}
          onClose={() => setShowAddSeason(false)}
          onSaved={() => { setShowAddSeason(false); refetchSeasons() }}
        />
      )}
    </div>
  )
}
