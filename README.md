# LabInsight AI

AI 기반 학교 실험 데이터 분석 플랫폼입니다. 학생은 실험 프로젝트를 만들고 데이터를 입력하거나 CSV/Excel 파일을 업로드해 그래프, AI 분석, 보고서 초안을 생성할 수 있습니다. 교사는 학생 프로젝트를 확인하고 피드백을 작성해 학생에게 반환합니다.

## 주요 기능

- 학생/교사 회원가입 및 로그인
- 학생 4자리 학번 입력
- 교사 인증 코드 기반 가입
- 학교명 검색 및 직접 입력
- 실험 프로젝트 생성
- 표 직접 입력, CSV/Excel 업로드
- 결측값, 이상값, 숫자형/문자형 컬럼 점검
- Recharts 기반 그래프 자동 추천
- OpenAI API 또는 Mock AI 분석
- 오차 원인 분석, 변인 분석, 후속 연구 제안
- AI 보고서 초안, PDF 다운로드
- 교사 대시보드와 피드백 반환

## 로컬 실행

로컬 개발은 Docker 없이 SQLite 파일 DB를 사용합니다.

```bash
cp .env.local.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

접속:

```txt
http://localhost:3000
```

로컬 샘플 계정:

```txt
학생: student@jshs.kr / password123
교사: teacher@jshs.kr / password123
```

이 계정은 `npm run db:seed`를 실행했을 때만 로컬 SQLite DB에 생성됩니다. 기본 seed는 프로젝트를 미리 만들지 않습니다. 데모 프로젝트까지 필요할 때만 `ALLOW_DEMO_PROJECT=true npm run db:seed`처럼 별도 허용값을 지정하세요. 실제 배포에서는 사용자가 `/register`에서 직접 가입합니다.

교사 가입 코드:

```txt
JSHS_TEACHER_2026
```

## 실제 배포

다른 사람이 접속해서 회원가입/로그인을 하려면 Vercel 같은 서버리스 호스팅과 Neon 또는 Supabase PostgreSQL이 필요합니다. SQLite 파일 DB는 배포 환경에서 영구 저장용으로 쓰면 안 됩니다.

### 1. PostgreSQL 만들기

Neon 또는 Supabase에서 PostgreSQL 프로젝트를 만들고 연결 문자열을 복사합니다.

예시:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/labinsight_ai?sslmode=require"
```

### 2. Vercel 환경 변수

Vercel Project Settings > Environment Variables에 아래 값을 등록합니다.

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="긴_랜덤_문자열"
TEACHER_INVITE_CODE="JSHS_TEACHER_2026"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
NEIS_API_KEY=""
```

`NEXTAUTH_SECRET`는 길고 임의적인 값으로 설정하세요.

### 3. Vercel 빌드

`vercel.json`은 배포 빌드에서 아래 스크립트를 실행하도록 설정되어 있습니다.

```bash
npm run build:vercel
```

이 스크립트는 다음을 자동으로 수행합니다.

```bash
node scripts/verify-deploy-env.mjs
prisma db push --schema prisma/schema.postgres.prisma
prisma generate --schema prisma/schema.postgres.prisma
next build
```

즉, Vercel에 `DATABASE_URL`만 올바르게 등록되어 있으면 배포 중 PostgreSQL 테이블이 생성되고, 실제 회원가입/로그인이 가능한 상태로 빌드됩니다.

운영 DB에는 샘플 계정을 넣지 않는 것을 권장합니다. `npm run db:seed:postgres`는 데모 계정을 생성하므로, 테스트용 DB에서만 `ALLOW_DEMO_SEED=true`를 설정하고 실행하세요.

### 4. 배포 후 확인

배포 URL에서 아래를 확인합니다.

- `/register`에서 새 학생 가입
- `/login`에서 가입 계정 로그인
- `/dashboard/student`에서 학생 대시보드
- `/projects/new`에서 프로젝트 생성
- `/dashboard/teacher`에서 교사 계정 확인

## 배포용/로컬용 Prisma 스키마

- 로컬 기본 스키마: `prisma/schema.prisma`
- 배포용 PostgreSQL 스키마: `prisma/schema.postgres.prisma`

로컬은 SQLite라 빠르게 테스트할 수 있고, 배포는 PostgreSQL이라 여러 사용자의 회원가입/로그인 데이터가 유지됩니다.

## OpenAI API

`OPENAI_API_KEY`가 있으면 실제 OpenAI 분석을 사용합니다. 없으면 `lib/ai-analysis.ts`의 Mock 분석 함수가 같은 구조의 결과를 반환합니다.

## 나이스 학교 검색

`NEIS_API_KEY`가 있으면 나이스 학교정보 API를 우선 사용합니다. 키가 없거나 실패하면 로컬 학교 후보 검색과 직접 입력 후보를 제공합니다.
