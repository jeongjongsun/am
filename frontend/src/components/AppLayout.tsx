import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { logout } from '@/api/auth';
import { useAuthMe } from '@/hooks/useAuthMe';
import { setAppLocale } from '@/locales';

export function AppLayout() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  return (
    <main className="main" id="top">
      <nav className="navbar navbar-vertical navbar-expand-lg">
        <div className="collapse navbar-collapse" id="navbarVerticalCollapse">
          <div className="navbar-vertical-content">
            <ul className="navbar-nav flex-column" id="navbarVerticalNav">
              <li className="nav-item">
                <p className="navbar-vertical-label">즐겨찾기</p>
                <hr className="navbar-vertical-line" />
                <div className="nav-item-wrapper">
                  <a className="nav-link label-1" href="#!">
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon">
                        <i className="fas fa-star"></i>
                      </span>
                      <span className="nav-link-text-wrapper">
                        <span className="nav-link-text">즐겨찾기 메뉴(동적 예정)</span>
                      </span>
                    </div>
                  </a>
                </div>

                <div className="nav-item-wrapper">
                  <a
                    className="nav-link dropdown-indicator label-1"
                    href="#nv-basic-info"
                    role="button"
                    data-bs-toggle="collapse"
                    aria-expanded="false"
                    aria-controls="nv-basic-info"
                  >
                    <div className="d-flex align-items-center">
                      <div className="dropdown-indicator-icon-wrapper">
                        <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                      </div>
                      <span className="nav-link-icon">
                        <i className="fas fa-folder"></i>
                      </span>
                      <span className="nav-link-text">기초정보 관리</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-basic-info">
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-building"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">화주(법인) 정보</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-users"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">사용자 정보</span>
                            </span>
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="nav-item-wrapper">
                  <a
                    className="nav-link dropdown-indicator label-1"
                    href="#nv-service-ops"
                    role="button"
                    data-bs-toggle="collapse"
                    aria-expanded="false"
                    aria-controls="nv-service-ops"
                  >
                    <div className="d-flex align-items-center">
                      <div className="dropdown-indicator-icon-wrapper">
                        <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                      </div>
                      <span className="nav-link-icon">
                        <i className="fas fa-cogs"></i>
                      </span>
                      <span className="nav-link-text">서비스 운영 정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-service-ops">
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-code"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">공통코드</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-user-shield"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">권한관리</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-sliders-h"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">환경 설정</span>
                            </span>
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="nav-item-wrapper">
                  <a
                    className="nav-link dropdown-indicator label-1"
                    href="#nv-extra-info"
                    role="button"
                    data-bs-toggle="collapse"
                    aria-expanded="false"
                    aria-controls="nv-extra-info"
                  >
                    <div className="d-flex align-items-center">
                      <div className="dropdown-indicator-icon-wrapper">
                        <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                      </div>
                      <span className="nav-link-icon">
                        <i className="fas fa-plus-circle"></i>
                      </span>
                      <span className="nav-link-text">부가정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-extra-info">
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-store"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">쇼핑몰 정보</span>
                            </span>
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="nav-item-wrapper">
                  <a
                    className="nav-link dropdown-indicator label-1"
                    href="#nv-log-info"
                    role="button"
                    data-bs-toggle="collapse"
                    aria-expanded="false"
                    aria-controls="nv-log-info"
                  >
                    <div className="d-flex align-items-center">
                      <div className="dropdown-indicator-icon-wrapper">
                        <span className="fas fa-caret-right dropdown-indicator-icon"></span>
                      </div>
                      <span className="nav-link-icon">
                        <i className="fas fa-history"></i>
                      </span>
                      <span className="nav-link-text">로그 정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-log-info">
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-sign-in-alt"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">접속 로그</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-user-edit"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">사용자 권한 변경 로그</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#!">
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <i className="fas fa-clipboard-list"></i>
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">감사이력 로그</span>
                            </span>
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="nav-item-wrapper mt-3">
                    <Link className="nav-link label-1" to="/home/admin/password-reset">
                      <div className="d-flex align-items-center">
                        <span className="nav-link-icon">
                          <i className="fas fa-key"></i>
                        </span>
                        <span className="nav-link-text-wrapper">
                          <span className="nav-link-text">{t('nav_admin_password_reset')}</span>
                        </span>
                      </div>
                    </Link>
                  </div>
                ) : null}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <nav className="navbar navbar-top fixed-top navbar-expand" id="navbarDefault">
        <div className="collapse navbar-collapse justify-content-between">
          <div className="navbar-logo">
            <button
              className="btn navbar-toggler navbar-toggler-humburger-icon hover-bg-transparent"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarVerticalCollapse"
              aria-controls="navbarVerticalCollapse"
              aria-expanded="false"
              aria-label={t('layout_toggle_navigation')}
            >
              <span className="navbar-toggle-icon">
                <span className="toggle-line"></span>
              </span>
            </button>
            <div className="navbar-brand me-1 me-sm-3">
              <div className="d-flex align-items-center">
                <h5 className="logo-text mb-0">{t('app_title')}</h5>
              </div>
            </div>
          </div>

          <ul className="navbar-nav navbar-nav-icons flex-row align-items-center">
            <li className="nav-item me-2">
              <select
                className="form-select form-select-sm"
                value={i18n.language}
                aria-label={t('layout_language_label')}
                onChange={(e) => setAppLocale(e.target.value)}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="btn btn-sm btn-phoenix-secondary"
                onClick={async () => {
                  try {
                    await logout();
                  } finally {
                    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
                    navigate('/login', { replace: true });
                  }
                }}
              >
                {t('nav_logout')}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="content">
        <Outlet />
      </div>
    </main>
  );
}
