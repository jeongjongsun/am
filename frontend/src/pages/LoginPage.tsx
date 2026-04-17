import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff, Lock, Mail, User } from 'react-feather';

import { login, verifySecondFactor } from '@/api/auth';
import { useAuthMe } from '@/hooks/useAuthMe';
import { setAppLocale } from '@/locales';
import { clearRememberedLoginUserId, readRememberedLoginUserId, writeRememberedLoginUserId } from '@/utils/rememberLoginUserId';
import { showError } from '@/utils/swal';

const FORM_ICON = { size: 18, strokeWidth: 2 } as const;
const HERO_CHECK_ICON = { size: 18, strokeWidth: 2 } as const;

export function LoginPage() {
  const { t, i18n } = useTranslation(['common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPending, data } = useAuthMe();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const secondCodeId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState(() => readRememberedLoginUserId() ?? '');
  const [rememberUserId, setRememberUserId] = useState(() => readRememberedLoginUserId() !== null);
  const [password, setPassword] = useState('');
  const [awaitingSecondFactor, setAwaitingSecondFactor] = useState(false);
  const [secondFactorUserId, setSecondFactorUserId] = useState('');
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    userId?: string;
    password?: string;
    secondFactorCode?: string;
  }>({});

  if (isPending) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center gap-3 bg-body-tertiary">
        <div className="spinner-border text-primary" role="status" aria-label={t('login.loading')} />
        <span className="text-body-secondary small">{t('login.loading')}</span>
      </div>
    );
  }

  if (data?.success === true) {
    return <Navigate to="/home" replace />;
  }

  return (
    <main className="main position-relative" id="top">
      <div className="position-absolute top-0 end-0 p-3 z-1 d-flex align-items-center gap-2">
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={i18n.language}
          aria-label={t('login.language_label')}
          onChange={(e) => setAppLocale(e.target.value)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="container-fluid bg-body-tertiary dark__bg-gray-1200">
        <div
          className="bg-holder bg-auth-card-overlay"
          style={{ backgroundImage: "url('/assets/img/bg/37.png')" }}
        />

        <div className="row flex-center position-relative min-vh-100 g-0 py-5">
          <div className="col-11 col-sm-10 col-xl-8 mx-auto login-auth-shell">
            <div className="card border border-translucent auth-card">
              <div className="card-body pe-md-0">
                <div className="row align-items-center gx-0 gy-7">
                  <div className="col-auto bg-body-highlight dark__bg-gray-1100 rounded-3 position-relative overflow-hidden auth-title-box">
                    <div
                      className="bg-holder opacity-50"
                      style={{ backgroundImage: "url('/assets/img/bg/38.png')" }}
                    />

                    <div className="position-relative px-4 px-lg-7 pt-7 pb-7 pb-sm-5 text-center text-md-start pb-lg-7 pb-md-7">
                      <h3 className="mb-3 text-body-emphasis fs-7">
                        <span className="d-block text-body-secondary fs-8 fw-semibold">
                          {t('app_client_title')}
                        </span>
                        <span className="d-block mt-1">{t('app_title')}</span>
                      </h3>
                      <p className="text-body-tertiary mb-0">{t('login.hero_subtitle')}</p>
                      <div className="mt-4 text-start mx-auto mx-md-0" style={{ maxWidth: '22rem' }}>
                        <p className="small fw-semibold text-body-secondary mb-1 d-flex align-items-center">
                          <span className="text-success me-2 flex-shrink-0 d-inline-flex" aria-hidden="true">
                            <CheckCircle {...HERO_CHECK_ICON} />
                          </span>
                          {t('login.hero_forgot_lead')}
                        </p>
                        <p className="small text-body-tertiary mb-3">{t('login.hero_forgot_detail')}</p>
                        <p className="small fw-semibold text-body-secondary mb-1 d-flex align-items-center">
                          <span className="text-success me-2 flex-shrink-0 d-inline-flex" aria-hidden="true">
                            <CheckCircle {...HERO_CHECK_ICON} />
                          </span>
                          {t('login.hero_tip_account')}
                        </p>
                        <p className="small text-body-tertiary mb-0">{t('login.hero_tip_session')}</p>
                      </div>
                    </div>
                    <div className="position-relative z-n1 mb-6 d-none d-md-block text-center mt-md-15">
                      <img
                        className="auth-title-box-img d-dark-none"
                        src="/assets/img/spot-illustrations/auth.png"
                        alt=""
                      />
                      <img
                        className="auth-title-box-img d-light-none"
                        src="/assets/img/spot-illustrations/auth-dark.png"
                        alt=""
                      />
                    </div>
                  </div>

                  <div className="col mx-auto">
                    <div className="auth-form-box">
                      <div className="text-center mb-7">
                        <div className="d-flex flex-center mb-4">
                          <div className="d-flex align-items-center fw-bolder fs-5 d-inline-block gap-2 text-body-highlight">
                            <img src="/vite.svg" alt="" width={40} height={40} />
                            <span>{t('app_title')}</span>
                          </div>
                        </div>
                        <h3 className="text-body-highlight">
                          {awaitingSecondFactor ? t('login.second_factor_title') : t('login.form_title')}
                        </h3>
                        {awaitingSecondFactor ? (
                          <p className="text-body-tertiary mb-0">{t('login.second_factor_hint')}</p>
                        ) : null}
                      </div>

                      <form
                        noValidate
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (isSubmitting) return;

                          if (awaitingSecondFactor) {
                            const code = secondFactorCode.trim();
                            const nextErrors: { secondFactorCode?: string } = {};
                            if (!code) {
                              nextErrors.secondFactorCode = t('validation:second_factor_code_required');
                            }
                            if (Object.keys(nextErrors).length > 0) {
                              setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
                              return;
                            }
                            setFieldErrors((prev) => ({ ...prev, secondFactorCode: undefined }));
                            setIsSubmitting(true);
                            try {
                              const response = await verifySecondFactor({
                                userId: secondFactorUserId,
                                code,
                              });
                              if (response.success && response.data) {
                                if (rememberUserId) {
                                  writeRememberedLoginUserId(secondFactorUserId);
                                } else {
                                  clearRememberedLoginUserId();
                                }
                                queryClient.setQueryData(['auth', 'me'], response);
                                navigate('/home', { replace: true });
                                return;
                              }
                              await showError(
                                t('login.swal_error_title'),
                                response.message ?? t('login.error_default'),
                              );
                            } catch (err) {
                              let message = t('login.error_default');
                              if (axios.isAxiosError(err)) {
                                const body = err.response?.data as { message?: string } | undefined;
                                if (body?.message) message = body.message;
                              }
                              await showError(t('login.swal_error_title'), message);
                            } finally {
                              setIsSubmitting(false);
                            }
                            return;
                          }

                          const uid = userId.trim();
                          const nextErrors: { userId?: string; password?: string } = {};
                          if (!uid) {
                            nextErrors.userId = t('validation:user_id_required');
                          }
                          if (!password.trim()) {
                            nextErrors.password = t('validation:password_required');
                          }
                          if (Object.keys(nextErrors).length > 0) {
                            setFieldErrors(nextErrors);
                            return;
                          }
                          setFieldErrors({});
                          setIsSubmitting(true);
                          try {
                            const response = await login({ userId: uid, password });
                            if (
                              response.success &&
                              response.data?.secondFactorRequired &&
                              response.code === 'SECOND_FACTOR_REQUIRED'
                            ) {
                              setAwaitingSecondFactor(true);
                              setSecondFactorUserId(uid);
                              setSecondFactorCode('');
                              return;
                            }
                            if (response.success && response.data) {
                              if (rememberUserId) {
                                writeRememberedLoginUserId(uid);
                              } else {
                                clearRememberedLoginUserId();
                              }
                              queryClient.setQueryData(['auth', 'me'], response);
                              navigate('/home', { replace: true });
                              return;
                            }
                            await showError(
                              t('login.swal_error_title'),
                              response.message ?? t('login.error_default'),
                            );
                          } catch (err) {
                            let message = t('login.error_default');
                            if (axios.isAxiosError(err)) {
                              const body = err.response?.data as { message?: string } | undefined;
                              if (body?.message) message = body.message;
                            }
                            await showError(t('login.swal_error_title'), message);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        <div className="mb-3 text-start">
                          <label className="form-label" htmlFor={emailId}>
                            {t('login.user_id_label')}
                          </label>
                          <div className="form-icon-container">
                            <input
                              className={`form-control form-icon-input${fieldErrors.userId ? ' is-invalid' : ''}`}
                              id={emailId}
                              name="userId"
                              type="text"
                              autoComplete="username"
                              placeholder={t('login.user_id_placeholder')}
                              value={userId}
                              onChange={(event) => {
                                setUserId(event.target.value);
                                if (fieldErrors.userId) {
                                  setFieldErrors((prev) => ({ ...prev, userId: undefined }));
                                }
                              }}
                              disabled={isSubmitting || awaitingSecondFactor}
                              aria-invalid={fieldErrors.userId ? true : undefined}
                              aria-describedby={fieldErrors.userId ? `${emailId}-error` : undefined}
                            />
                            <span
                              className="text-body fs-9 form-icon d-inline-flex align-items-center justify-content-center"
                              aria-hidden="true"
                            >
                              <User {...FORM_ICON} />
                            </span>
                          </div>
                          {fieldErrors.userId ? (
                            <div className="invalid-feedback d-block" id={`${emailId}-error`}>
                              {fieldErrors.userId}
                            </div>
                          ) : null}
                        </div>

                        {!awaitingSecondFactor ? (
                          <div className="mb-3 text-start">
                            <label className="form-label" htmlFor={passwordId}>
                              {t('login.password_label')}
                            </label>
                            <div className="form-icon-container position-relative" data-password="data-password">
                              <input
                                className={`form-control form-icon-input pe-6${fieldErrors.password ? ' is-invalid' : ''}`}
                                id={passwordId}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder={t('login.password_placeholder')}
                                data-password-input="data-password-input"
                                value={password}
                                onChange={(event) => {
                                  setPassword(event.target.value);
                                  if (fieldErrors.password) {
                                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                                  }
                                }}
                                disabled={isSubmitting}
                                aria-invalid={fieldErrors.password ? true : undefined}
                                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                              />
                              <span
                                className="text-body fs-9 form-icon d-inline-flex align-items-center justify-content-center"
                                aria-hidden="true"
                              >
                                <Lock {...FORM_ICON} />
                              </span>
                              <button
                                type="button"
                                className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary d-inline-flex align-items-center justify-content-center"
                                data-password-toggle="data-password-toggle"
                                aria-label={
                                  showPassword ? t('login.password_hide') : t('login.password_show')
                                }
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? (
                                  <EyeOff size={18} strokeWidth={2} aria-hidden />
                                ) : (
                                  <Eye size={18} strokeWidth={2} aria-hidden />
                                )}
                              </button>
                            </div>
                            {fieldErrors.password ? (
                              <div className="invalid-feedback d-block" id={`${passwordId}-error`}>
                                {fieldErrors.password}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mb-3 text-start">
                            <label className="form-label" htmlFor={secondCodeId}>
                              {t('login.second_factor_code_label')}
                            </label>
                            <div className="form-icon-container">
                              <input
                                className={`form-control form-icon-input${fieldErrors.secondFactorCode ? ' is-invalid' : ''}`}
                                id={secondCodeId}
                                name="secondFactorCode"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder={t('login.second_factor_code_placeholder')}
                                value={secondFactorCode}
                                onChange={(event) => {
                                  setSecondFactorCode(event.target.value);
                                  if (fieldErrors.secondFactorCode) {
                                    setFieldErrors((prev) => ({ ...prev, secondFactorCode: undefined }));
                                  }
                                }}
                                disabled={isSubmitting}
                                aria-invalid={fieldErrors.secondFactorCode ? true : undefined}
                                aria-describedby={
                                  fieldErrors.secondFactorCode ? `${secondCodeId}-error` : undefined
                                }
                              />
                              <span
                                className="text-body fs-9 form-icon d-inline-flex align-items-center justify-content-center"
                                aria-hidden="true"
                              >
                                <Mail {...FORM_ICON} />
                              </span>
                            </div>
                            {fieldErrors.secondFactorCode ? (
                              <div className="invalid-feedback d-block" id={`${secondCodeId}-error`}>
                                {fieldErrors.secondFactorCode}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {!awaitingSecondFactor ? (
                          <div className="mb-7">
                            <div className="form-check mb-0">
                              <input
                                className="form-check-input"
                                id={rememberId}
                                name="rememberUserId"
                                type="checkbox"
                                checked={rememberUserId}
                                onChange={(e) => setRememberUserId(e.target.checked)}
                                disabled={isSubmitting}
                              />
                              <label className="form-check-label mb-0" htmlFor={rememberId}>
                                {t('login.remember_user_id')}
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-7 text-end">
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-decoration-none p-0 fs-9"
                              onClick={() => {
                                setAwaitingSecondFactor(false);
                                setSecondFactorUserId('');
                                setSecondFactorCode('');
                                setFieldErrors({});
                              }}
                            >
                              {t('login.second_factor_back')}
                            </button>
                          </div>
                        )}

                        <button className="btn btn-primary w-100 mb-3" type="submit">
                          {isSubmitting
                            ? t('login.submitting')
                            : awaitingSecondFactor
                              ? t('login.second_factor_submit')
                              : t('login.submit')}
                        </button>
                      </form>

                      <p className="text-body-tertiary text-center small mb-0">{t('login.backend_notice')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
