# AM (백오피스)

Spring Boot + React 기반 백오피스 애플리케이션을 지향합니다. 표준·운영 규칙은 **`docs/guide/`** 아래 문서와 **`.cursor/rules/`** 를 따릅니다.

**백엔드**: Spring Boot 초기 모듈이 **`backend/`** 에 포함되어 있으며, 바로 아래 **백엔드 설정 완료 요약** 절에서 구성·범위를 확인할 수 있습니다.

---

## 백엔드 설정 완료 요약

| 구분 | 내용 |
|------|------|
| 위치 | `backend/` (루트 `pom.xml`, `mvnw` / `mvnw.cmd`) |
| 스택 | Java **17** 이상, Spring Boot **3.4**, **Maven Wrapper** (`./mvnw` — 로컬 Maven 없이 빌드 가능) |
| 의존성 | Web, Validation, Security, Actuator, **MyBatis**, **PostgreSQL JDBC**, 테스트용 **H2** |
| 패키지 | `com.am.backoffice` — `api/v1`, `common/dto`, `config`, **`mapper`(MyBatis)** |
| 설정(OM 정렬) | 기본 프로파일 **`dev`** (`SPRING_PROFILES_ACTIVE`로 변경 가능). DB 접속은 **`application-dev.yml` + 환경 변수**만 사용(비밀 Git 금지). |
| 제공 API | `GET /api/v1/auth/me` — 미인증 시 **401** + 표준 래퍼(`success`, `code` 등, `ERR_UNAUTHORIZED`) |
| 관찰 가능성 | `GET /actuator/health`, `GET /actuator/info` |
| 테스트 | `src/test/java/.../AuthControllerTest` — MockMvc로 `/api/v1/auth/me` 응답 검증 |
| CORS | 개발용으로 `http://localhost:5173` 허용·쿠키 허용 (`CorsConfig`) |

**아직 포함되지 않은 것(이후 작업)**

- **Flyway/Liquibase**, 도메인별 `mapper/*.xml`·서비스 계층, 실제 **로그인·세션·OM 사용자 연동**, `@ControllerAdvice` 전역 예외
- 운영 환경에 맞는 **CSRF·세션 저장소** 등 — `docs/guide/06-보안-표준.md`, `docs/guide/11-트랜잭션-표준.md`

**OM 연동 시 DB 실행 예** (`dev` 프로파일, 값은 채팅/저장소에 넣지 말고 셸·CI 시크릿으로만 설정)

```bash
export SPRING_DATASOURCE_URL='jdbc:postgresql://...?sslmode=require&options=-c%20TimeZone%3DAsia/Seoul'
export SPRING_DATASOURCE_USERNAME='...'
export SPRING_DATASOURCE_PASSWORD='...'
cd backend && ./mvnw spring-boot:run
```

---

## 1. 프로젝트 전체 구조

```
am/
├── .cursor/
│   └── rules/              # Cursor 에이전트·에디터 규칙 (표준 문서와 연동)
├── backend/                # Spring Boot API (초기 설정 완료)
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd      # Maven Wrapper
│   ├── src/main/java/com/am/backoffice/
│   │   ├── api/v1/         # REST (예: auth)
│   │   ├── common/dto/     # ApiResponse 등 공통 DTO
│   │   ├── config/         # Security, CORS
│   │   └── mapper/         # MyBatis 매퍼 인터페이스
│   └── src/main/resources/
│       ├── application.yml, application-dev.yml, application-test.yml
│       └── mapper/         # MyBatis XML
├── docs/
│   └── guide/              # 개발 표준·가이드 (01~11, 바이브코딩 설정 등)
│       └── menu/           # 메뉴(화면)별 기능 문서 (신규 화면 추가 시 작성)
├── frontend/               # React (Vite + TypeScript) 백오피스 UI
│   ├── app-public/         # 런타임 정적 자산 (Vite publicDir)
│   ├── public/             # Phoenix 원본 테마 참조본(앱 런타임 미사용)
│   ├── src/
│   │   ├── api/            # API 호출 (axios)
│   │   ├── components/     # 공통 UI
│   │   ├── features/       # 기능 단위 화면·훅
│   │   ├── hooks/          # 전역 훅
│   │   ├── locales/        # i18n 리소스
│   │   ├── pages/          # 라우트 단위 페이지
│   │   ├── types/          # 공통 타입 (ApiResponse 등)
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

**참고**

- **DDL/DML SQL** 위치는 `docs/guide/08-DB-표준.md` 및 `.cursor/rules/03-database.mdc` (`docs/ddl/`, `docs/dml/`)를 참고합니다.

---

## 2. 프론트·백엔드 서비스 실행 방법

### 프론트엔드 (Vite)

```bash
cd frontend
npm install
npm run dev
```

- 기본 URL: **http://localhost:5173**
- 개발 서버는 **`/api`** 요청을 프록시합니다. 기본 대상은 **http://localhost:8080** (`frontend/vite.config.ts`, 환경 변수 `VITE_PROXY_TARGET`으로 변경 가능).
- API 베이스 URL이 필요하면 `frontend/.env`에 설정합니다. 예시는 `frontend/.env.example` 참고.
- 정적 파일 정책: `frontend/public`은 **참조 전용**이며, 실제 앱 정적 자산은 `frontend/app-public`에서만 서빙됩니다 (`publicDir: 'app-public'`).
- `frontend/dist`는 `npm run build` 시 생성되는 **배포 산출물 폴더(output)** 이며, 소스/참조 자산 폴더로 사용하지 않습니다.

```bash
# 프로덕션 빌드·로컬 프리뷰
npm run build
npm run preview
```

기타 스크립트: `npm run lint`, `npm run format`

### 백엔드 (Spring Boot)

**요구사항**: JDK **17** 이상 (Spring Boot 3.4 기준).

```bash
cd backend
./mvnw spring-boot:run
```

- 로컬에 Maven이 있으면 `mvn spring-boot:run` 도 동일합니다.
- 기본 URL: **http://localhost:8080**
- 헬스체크: **GET** `/actuator/health`
- 인증 예시 API: **GET** `/api/v1/auth/me` — 미로그인 시 `401` + 표준 `ApiResponse` (`code`: `ERR_UNAUTHORIZED`). 로그인·세션 연동은 `docs/guide/02-개발-표준.md`, `docs/guide/06-보안-표준.md` 를 참고해 확장합니다.

```bash
# 테스트
./mvnw test

# JAR 빌드
./mvnw package
java -jar target/backoffice-0.0.1-SNAPSHOT.jar
```

프론트와 백엔드를 동시에 띄운 뒤, 브라우저에서 프론트(5173)로 접속하면 API 호출이 Vite 프록시를 통해 백엔드(8080)로 전달됩니다.

**빠른 확인**

```bash
# 터미널 1
cd backend && ./mvnw spring-boot:run

# 터미널 2 (백엔드만 검증)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/actuator/health
curl -s http://localhost:8080/api/v1/auth/me   # 401 + JSON 바디 기대
```

---

## 3. `application.yml` 구조 및 설명

백엔드 설정은 **OM(`shopeasy-api`)과 동일한 전제**(동일 도메인·세션·PostgreSQL, MyBatis, 서버 압축·세션 타임아웃 등)에 맞춰 **`backend/src/main/resources/`** 에 나뉘어 있습니다. **DB 비밀번호·Neon 키 등은 Git에 커밋하지 않습니다.**

| 파일 | 역할 |
|------|------|
| `application.yml` | 공통: `spring.application.name`(AM: `am-backoffice`), **기본 프로파일 `dev`**(`SPRING_PROFILES_ACTIVE`로 변경), MyBatis(`mapper/**/*.xml`, `type-aliases-package`), `server`(포트 8080, **compression**, 세션 **30m**, 쿠키 `http-only`/`same-site: lax`), Actuator, 로깅(`com.am.backoffice`, OM 이전 대비 `com.shopeasy`). |
| `application-dev.yml` | **PostgreSQL** 접속 — `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` **환경 변수 필수**. Neon 시 타임존 쿼리는 `docs/guide/08-DB-표준.md` 참고. |
| `application-test.yml` | **Maven 테스트** 전용(Surefire가 `spring.profiles.active=test` 설정). 인메모리 **H2**(PostgreSQL 호환 모드). |
| `application-local.yml.example` | 로컬/Neon 값을 YAML에 둘 때의 안내(복사해 `application-local.yml` 사용). |
| `application-local.yml` | (선택) Git 미추적 — `backend/.gitignore`. |

**보안·운영**

- 채팅·이슈 등 **외부에 노출된 DB 비밀번호는 즉시 DB 제공측에서 키 회전(재발급)** 할 것.
- **`spring.autoconfigure.exclude`**: 기본 임시 `UserDetailsService` 비활성화. 로그인 구현 시 `docs/guide/06-보안-표준.md`에 맞게 조정.

**추가 예정(도입 시)**

- Flyway/Liquibase, `@ControllerAdvice` 전역 예외, 세션 저장소·Redis, 운영 CSRF 정책 — `docs/guide/06-보안-표준.md`, `docs/guide/11-트랜잭션-표준.md`

---

## 4. 소스를 처음 받은 개발자가 할 일

1. **저장소 클론** 후 `frontend` 에서 `npm install`, `backend` 에서 `./mvnw test`(또는 `./mvnw -q verify`)로 빌드·테스트를 한 번 통과시킵니다.
2. **표준 문서 순서**는 `docs/guide/01-표준-인덱스.md` 에 정리되어 있습니다. 최소한 **02-개발-표준**, 담당 영역(프론트면 03-부록-타입·04-코딩-스타일, 백엔드면 04·08·11 등)을 읽습니다.
3. **Cursor 규칙**: `.cursor/rules/` 의 `00-project-standards.mdc` 가 항상 적용되는 요약이며, 파일 종류별로 `01-backend.mdc`, `02-frontend.mdc` 등이 추가로 적용됩니다. 에디터에서 프로젝트 루트를 연 채로 작업하면 규칙이 자동으로 참고됩니다.
4. **바이브코딩·에이전트 협업** 방식은 `docs/guide/바이브코딩을 위한 전역 설정.md` 를 참고합니다 (설계 검증·승인 후 구현 등).
5. **커밋 메시지**: `.cursor/rules/11-commit-message-policy.mdc` (한글, 파일 단위 커밋 등).
6. **Cursor 사용자 설정**을 바꾸고 싶다면 Cursor 설정 UI 또는 팀 공유 `settings.json` 정책을 따릅니다. (저장소에 `.vscode/settings.json`을 두는지는 팀 규칙에 따름.)

---

## 5. 가이드 기타 안내

### 메뉴(화면)별 개발 문서

- 화면 단위 유지보수·QA용 문서는 **`docs/guide/menu/`** 에 둡니다. 파일명은 메뉴명(예: `상품관리.md`)을 사용합니다.
- 상세 규칙: **`.cursor/rules/07-menu-docs.mdc`**, 인덱스 안내: `docs/guide/01-표준-인덱스.md`.

### Cursor(에이전트) 작업과 메뉴 문서

- 메뉴 문서는 빌드 파이프라인이 “자동 생성”하는 것이 아니라, **프로젝트 규칙상 메뉴·화면을 추가·변경할 때마다 작성·갱신**하는 산출물입니다.
- Cursor AI로 개발할 때도 **`.cursor/rules/07-menu-docs.mdc`** 에 따라, 해당 작업 범위에 맞게 `docs/guide/menu/` 의 문서를 **생성하거나 수정**하도록 되어 있습니다. (에이전트가 작업을 마친 뒤 이 문서를 함께 반영하는 것이 기대 동작입니다.)
- `07-menu-docs.mdc` 에는 `pageRegistry`, `Sidebar` 등 레이아웃 파일 경로 예시가 있을 수 있습니다. 실제 프로젝트 구조에 맞춰 등록 위치만 조정하면 됩니다.

### 그 밖에 알아두면 좋은 것

- API 응답 형식, React Query, 권한(`GET /api/v1/auth/me`) 등은 **`docs/guide/02-개발-표준.md`**.
- 다국어: **`docs/guide/09-다국어-표준.md`**, CSS: **`docs/guide/10-CSS-표준.md`**.
- SQL·DDL/DML 폴더 규칙: **`docs/guide/08-DB-표준.md`**.

---

## 관련 경로 요약

| 내용 | 경로 |
|------|------|
| 표준 문서 인덱스 | `docs/guide/01-표준-인덱스.md` |
| 메뉴 기능 문서 | `docs/guide/menu/` |
| Cursor 규칙 | `.cursor/rules/` |
| 백엔드 설정 | `backend/src/main/resources/application.yml` |
| 백엔드 Java 루트 | `backend/src/main/java/com/am/backoffice/` |
| 백엔드 산출물(JAR) | `backend/target/backoffice-0.0.1-SNAPSHOT.jar` (`./mvnw package` 후) |
