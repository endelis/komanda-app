import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/auth/LoginModal'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <nav className="landing-nav">
        <div className="nav__logo">
          <span className="nav__mark">S</span>
          <span className="nav__wordmark">KOMANDA</span>
        </div>
        <button className="btn btn--gold btn--sm" onClick={() => setLoginOpen(true)}>
          {t('nav.login')}
        </button>
      </nav>

      <main className="landing-hero">
        <div className="hero__content">
          <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
          <h1 className="hero__headline">
            {t('hero.headline_1')}
            <br />
            <span className="gold">{t('hero.headline_2')}</span>
          </h1>
          <p className="hero__sub">{t('hero.subheading')}</p>
          <div className="hero__ctas">
            <button className="btn btn--gold" onClick={() => setLoginOpen(true)}>
              {t('hero.cta_login')}
            </button>
            <button className="btn btn--ghost" onClick={() => setLoginOpen(true)}>
              {t('hero.cta_demo')}
            </button>
          </div>
        </div>

        <div className="hero__mockups">
          {/* Parent view — faded, offset down */}
          <div className="phone phone--secondary">
            <div className="phone__notch" />
            <div className="phone__screen">
              <div className="mock-card">
                <p className="mock-label">{t('mockup.parent.label')}</p>
                <p className="mock-title">{t('mockup.parent.title')}</p>
                <p className="mock-sub">{t('mockup.parent.time')}</p>
              </div>
              <div className="mock-chips">
                <span className="mock-chip">{t('mockup.parent.stat1')}</span>
                <span className="mock-chip">{t('mockup.parent.stat2')}</span>
                <span className="mock-chip">{t('mockup.parent.stat3')}</span>
              </div>
            </div>
          </div>

          {/* Coach view — main */}
          <div className="phone phone--primary">
            <div className="phone__notch" />
            <div className="phone__screen">
              <div className="mock-card">
                <p className="mock-title">{t('mockup.coach.title')}</p>
                <div className="mock-stats">
                  <span className="mock-stat">{t('mockup.coach.stat1')}</span>
                  <span className="mock-stat">{t('mockup.coach.stat2')}</span>
                </div>
              </div>
              <ul className="mock-list">
                <li className="mock-player">
                  <span className="mock-player__name">{t('mockup.coach.player1')}</span>
                  <span className="mock-tag mock-tag--present">{t('mockup.coach.tag_present')}</span>
                </li>
                <li className="mock-player">
                  <span className="mock-player__name">{t('mockup.coach.player2')}</span>
                  <span className="mock-tag mock-tag--present">{t('mockup.coach.tag_present')}</span>
                </li>
                <li className="mock-player">
                  <span className="mock-player__name">{t('mockup.coach.player3')}</span>
                  <span className="mock-tag mock-tag--absent">{t('mockup.coach.tag_absent')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  )
}
