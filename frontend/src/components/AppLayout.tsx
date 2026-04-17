import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  Clipboard,
  Code,
  Edit3,
  Folder,
  Home,
  Key,
  List,
  LogIn,
  PlusCircle,
  Settings,
  Shield,
  ShoppingBag,
  Sliders,
  Star,
  Users,
  X,
  XSquare,
} from 'react-feather';

import { logout } from '@/api/auth';
import { useAuthMe } from '@/hooks/useAuthMe';
import { setAppLocale } from '@/locales';

/** 세션 저장·탭 표시용(메뉴와 동일 Feather 아이콘 매핑) */
type TabIconId =
  | 'home'
  | 'briefcase'
  | 'users'
  | 'code'
  | 'shield'
  | 'sliders'
  | 'shoppingBag'
  | 'logIn'
  | 'edit3'
  | 'clipboard'
  | 'key';

type TabItem = {
  path: string;
  title: string;
  closable: boolean;
  iconId: TabIconId;
};

const HOME_PATH = '/home';
const TAB_STORAGE_KEY = 'am.openTabs.v1';
const MAX_TABS = 10;

/** Phoenix 세로 메뉴 `nav-link-icon` 최소 너비(16px)에 맞춘 Feather 크기 */
const NAV_ICON = { size: 16, strokeWidth: 2 } as const;
const DROPDOWN_CHEVRON = { size: 14, strokeWidth: 2 } as const;
const TAB_CLOSE_ICON = { size: 14, strokeWidth: 2 } as const;
/** 탭 라벨 앞 메뉴 아이콘(본문과 비슷한 시각 무게) */
const TAB_MENU_ICON = { size: 15, strokeWidth: 2 } as const;
/** 탭 개별 닫기(X)와 구분: 사각 프레임 + 조금 큰 스트로크 */
const CLOSE_ALL_TABS_ICON = { size: 18, strokeWidth: 2.25 } as const;

const PATH_TAB_ICON: Record<string, TabIconId> = {
  [HOME_PATH]: 'home',
  '/home/basic/shipper-corp': 'briefcase',
  '/home/basic/users': 'users',
  '/home/admin/common-code': 'code',
  '/home/service/permissions': 'shield',
  '/home/service/settings': 'sliders',
  '/home/extra/mall-info': 'shoppingBag',
  '/home/logs/access': 'logIn',
  '/home/logs/auth-change': 'edit3',
  '/home/logs/audit': 'clipboard',
  '/home/admin/password-reset': 'key',
};

function getTabIconIdForPath(path: string): TabIconId {
  return PATH_TAB_ICON[path] ?? 'home';
}

function TabMenuIcon({ id }: { id: TabIconId }) {
  const p = TAB_MENU_ICON;
  switch (id) {
    case 'home':
      return <Home {...p} aria-hidden />;
    case 'briefcase':
      return <Briefcase {...p} aria-hidden />;
    case 'users':
      return <Users {...p} aria-hidden />;
    case 'code':
      return <Code {...p} aria-hidden />;
    case 'shield':
      return <Shield {...p} aria-hidden />;
    case 'sliders':
      return <Sliders {...p} aria-hidden />;
    case 'shoppingBag':
      return <ShoppingBag {...p} aria-hidden />;
    case 'logIn':
      return <LogIn {...p} aria-hidden />;
    case 'edit3':
      return <Edit3 {...p} aria-hidden />;
    case 'clipboard':
      return <Clipboard {...p} aria-hidden />;
    case 'key':
      return <Key {...p} aria-hidden />;
    default:
      return <Home {...p} aria-hidden />;
  }
}

function normalizeStoredTab(tab: Partial<TabItem> & { path: string; title: string }): TabItem {
  return {
    path: tab.path,
    title: tab.title,
    closable: tab.path !== HOME_PATH,
    /** JSON 복원 시 `iconId`가 string으로 넓어지므로 경로 기준으로만 결정 */
    iconId: getTabIconIdForPath(tab.path),
  };
}

/** 홈 탭 리터럴이 `title: string`과 함께 쓰일 때 `iconId`가 string으로 넓어지는 것을 막음 */
function createHomeTabItem(title: string): TabItem {
  return { path: HOME_PATH, title, closable: false, iconId: 'home' };
}

export function AppLayout() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';
  const homeTitle = t('home.content_title');
  const hasHydratedTabs = useRef(false);

  const routeTitleMap = useMemo(
    () => ({
      [HOME_PATH]: homeTitle,
      '/home/basic/shipper-corp': '화주(법인) 정보',
      '/home/basic/users': '사용자 정보',
      '/home/admin/common-code': t('nav_admin_common_code'),
      '/home/service/permissions': '권한관리',
      '/home/service/settings': '환경 설정',
      '/home/extra/mall-info': '쇼핑몰 정보',
      '/home/logs/access': '접속 로그',
      '/home/logs/auth-change': '사용자 권한 변경 로그',
      '/home/logs/audit': '감사이력 로그',
      '/home/admin/password-reset': t('nav_admin_password_reset'),
    }),
    [homeTitle, t],
  );

  const [tabs, setTabs] = useState<TabItem[]>(() => [createHomeTabItem('Home')]);

  useEffect(() => {
    if (hasHydratedTabs.current) return;
    hasHydratedTabs.current = true;
    try {
      const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
      if (!raw) {
        setTabs([createHomeTabItem(homeTitle)]);
        return;
      }
      const parsed = JSON.parse(raw) as { tabs?: Partial<TabItem>[]; activePath?: string };
      const hydrated = (parsed.tabs ?? [])
        .filter((tab) => tab?.path && tab?.title)
        .map((tab) => normalizeStoredTab(tab as Partial<TabItem> & { path: string; title: string }))
        .slice(0, MAX_TABS);
      const hasHome = hydrated.some((tab) => tab.path === HOME_PATH);
      const normalized = hasHome
        ? hydrated.map((tab) => (tab.path === HOME_PATH ? createHomeTabItem(homeTitle) : tab))
        : [createHomeTabItem(homeTitle), ...hydrated].slice(0, MAX_TABS);
      setTabs(normalized);
      if (parsed.activePath && normalized.some((tab) => tab.path === parsed.activePath)) {
        navigate(parsed.activePath, { replace: true });
      }
    } catch {
      setTabs([createHomeTabItem(homeTitle)]);
    }
  }, [homeTitle, navigate]);

  useEffect(() => {
    const title = routeTitleMap[location.pathname as keyof typeof routeTitleMap];
    if (!title) return;
    setTabs((prev) => {
      const existing = prev.find((tab) => tab.path === location.pathname);
      if (existing) {
        return prev.map((tab) => (tab.path === location.pathname ? { ...tab, title } : tab));
      }
      if (prev.length >= MAX_TABS) {
        return prev;
      }
      return [
        ...prev,
        {
          path: location.pathname,
          title,
          closable: location.pathname !== HOME_PATH,
          iconId: getTabIconIdForPath(location.pathname),
        },
      ];
    });
  }, [location.pathname, routeTitleMap]);

  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({ tabs, activePath: location.pathname }));
  }, [tabs, location.pathname]);

  useEffect(() => {
    setTabs((prev) => prev.map((tab) => (tab.path === HOME_PATH ? createHomeTabItem(homeTitle) : tab)));
  }, [homeTitle]);

  const openMenuTab = (path: string, title: string, iconId: TabIconId) => {
    const existing = tabs.some((tab) => tab.path === path);
    if (!existing && tabs.length >= MAX_TABS) {
      window.alert('탭은 최대 10개까지만 열 수 있습니다.');
      return;
    }
    setTabs((prev) => {
      const already = prev.some((tab) => tab.path === path);
      if (already) return prev;
      return [...prev, { path, title, closable: path !== HOME_PATH, iconId }];
    });
    navigate(path);
  };

  const closeTab = (path: string) => {
    if (path === HOME_PATH) return;
    setTabs((prev) => {
      const idx = prev.findIndex((tab) => tab.path === path);
      if (idx < 0) return prev;
      const next = prev.filter((tab) => tab.path !== path);
      if (location.pathname === path) {
        const fallback = next[idx - 1] ?? next[idx] ?? next[0] ?? { path: HOME_PATH };
        navigate(fallback.path);
      }
      return next;
    });
  };

  const closeAllTabs = () => {
    setTabs([createHomeTabItem(homeTitle)]);
    navigate(HOME_PATH);
  };

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
                        <Star {...NAV_ICON} aria-hidden />
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
                        <span className="dropdown-indicator-icon d-inline-flex align-items-center justify-content-center">
                          <ChevronRight {...DROPDOWN_CHEVRON} aria-hidden />
                        </span>
                      </div>
                      <span className="nav-link-icon">
                        <Folder {...NAV_ICON} aria-hidden />
                      </span>
                      <span className="nav-link-text">기초정보 관리</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-basic-info">
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/basic/shipper-corp"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/basic/shipper-corp', '화주(법인) 정보', 'briefcase');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Briefcase {...NAV_ICON} aria-hidden />
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">화주(법인) 정보</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/basic/users"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/basic/users', '사용자 정보', 'users');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Users {...NAV_ICON} aria-hidden />
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
                        <span className="dropdown-indicator-icon d-inline-flex align-items-center justify-content-center">
                          <ChevronRight {...DROPDOWN_CHEVRON} aria-hidden />
                        </span>
                      </div>
                      <span className="nav-link-icon">
                        <Settings {...NAV_ICON} aria-hidden />
                      </span>
                      <span className="nav-link-text">서비스 운영 정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-service-ops">
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/service/permissions"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/service/permissions', '권한관리', 'shield');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Shield {...NAV_ICON} aria-hidden />
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">권한관리</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/service/settings"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/service/settings', '환경 설정', 'sliders');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Sliders {...NAV_ICON} aria-hidden />
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
                        <span className="dropdown-indicator-icon d-inline-flex align-items-center justify-content-center">
                          <ChevronRight {...DROPDOWN_CHEVRON} aria-hidden />
                        </span>
                      </div>
                      <span className="nav-link-icon">
                        <PlusCircle {...NAV_ICON} aria-hidden />
                      </span>
                      <span className="nav-link-text">부가정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-extra-info">
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/extra/mall-info"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/extra/mall-info', '쇼핑몰 정보', 'shoppingBag');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <ShoppingBag {...NAV_ICON} aria-hidden />
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
                        <span className="dropdown-indicator-icon d-inline-flex align-items-center justify-content-center">
                          <ChevronRight {...DROPDOWN_CHEVRON} aria-hidden />
                        </span>
                      </div>
                      <span className="nav-link-icon">
                        <List {...NAV_ICON} aria-hidden />
                      </span>
                      <span className="nav-link-text">로그 정보</span>
                    </div>
                  </a>
                  <div className="parent-wrapper label-1">
                    <ul className="nav collapse parent" id="nv-log-info">
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/logs/access"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/logs/access', '접속 로그', 'logIn');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <LogIn {...NAV_ICON} aria-hidden />
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">접속 로그</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/logs/auth-change"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/logs/auth-change', '사용자 권한 변경 로그', 'edit3');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Edit3 {...NAV_ICON} aria-hidden />
                            </span>
                            <span className="nav-link-text-wrapper">
                              <span className="nav-link-text">사용자 권한 변경 로그</span>
                            </span>
                          </div>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          className="nav-link"
                          href="/home/logs/audit"
                          onClick={(e) => {
                            e.preventDefault();
                            openMenuTab('/home/logs/audit', '감사이력 로그', 'clipboard');
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <span className="nav-link-icon">
                              <Clipboard {...NAV_ICON} aria-hidden />
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
                    <p className="navbar-vertical-label mb-1">{t('nav_admin_menu_label')}</p>
                    <a
                      className="nav-link label-1"
                      href="/home/admin/common-code"
                      onClick={(e) => {
                        e.preventDefault();
                        openMenuTab('/home/admin/common-code', t('nav_admin_common_code'), 'code');
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <span className="nav-link-icon">
                          <Code {...NAV_ICON} aria-hidden />
                        </span>
                        <span className="nav-link-text-wrapper">
                          <span className="nav-link-text">{t('nav_admin_common_code')}</span>
                        </span>
                      </div>
                    </a>
                    <a
                      className="nav-link label-1"
                      href="/home/admin/password-reset"
                      onClick={(e) => {
                        e.preventDefault();
                        openMenuTab('/home/admin/password-reset', t('nav_admin_password_reset'), 'key');
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <span className="nav-link-icon">
                          <Key {...NAV_ICON} aria-hidden />
                        </span>
                        <span className="nav-link-text-wrapper">
                          <span className="nav-link-text">{t('nav_admin_password_reset')}</span>
                        </span>
                      </div>
                    </a>
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
        <div className="app-tabs-bar d-flex align-items-end border-bottom bg-body">
          <ul className="nav nav-tabs flex-nowrap app-tabs-list border-0 mb-0 flex-grow-1 min-w-0">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <li className="nav-item app-tab-item" key={tab.path}>
                  <button
                    type="button"
                    className={`nav-link app-tab-trigger ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                    title={tab.title}
                  >
                    <span className="app-tab-icon text-body-secondary" aria-hidden="true">
                      <TabMenuIcon id={tab.iconId} />
                    </span>
                    <span className="app-tab-title">{tab.title}</span>
                  </button>
                  {tab.closable ? (
                    <button
                      type="button"
                      className="app-tab-close-btn"
                      aria-label={`${tab.title} 닫기`}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.path);
                      }}
                    >
                      <X {...TAB_CLOSE_ICON} aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <a
            href="#"
            className="app-tabs-close-all-btn"
            onClick={(e) => {
              e.preventDefault();
              closeAllTabs();
            }}
            title={t('layout_close_all_tabs')}
            aria-label={t('layout_close_all_tabs')}
          >
            <XSquare {...CLOSE_ALL_TABS_ICON} aria-hidden />
          </a>
        </div>
        <Outlet />
      </div>
    </main>
  );
}
