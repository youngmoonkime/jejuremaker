# React + TypeScript 개발 가이드라인

> **목적**: 사이트/앱 개발 시 참고할 수 있는 유연한 가이드라인
> **마지막 업데이트**: 2026-03-20

---

> ### 이 문서의 사용 방법
>
> 이 가이드라인은 **강제 규칙이 아닙니다.**
> 상황과 맥락에 따라 판단하여 선택적으로 적용하세요.
>
> - 프로젝트 규모, 팀 구성, 긴급도에 따라 유연하게 조정 가능
> - 모든 항목을 동시에 따를 필요는 없습니다
> - "왜 이 항목이 있는가"를 이해하고, 상황에 맞게 적용 여부를 판단하세요
> - 가이드라인이 오히려 생산성을 해친다면 무시해도 됩니다

---

## 0. 기본 원칙 (상황에 관계없이 지키면 좋은 것들)

### 0-1. 언어 규칙
- 답변, 주석, 설명은 **한국어**로 작성 (소통 효율을 위해)
- 코드 내 변수명/함수명은 영어 사용, 주석은 한국어 권장
- 사용자에게 노출되는 텍스트는 한국어 우선

### 0-2. 코드 수정 전 계획 수립
> 규모가 있는 작업이라면, 코드 작성 전에 계획을 먼저 공유하는 것을 권장합니다.

필요하다고 판단될 때 아래 항목을 포함해 계획을 수립합니다:
1. **목표**: 무엇을 달성하려는지 한 문장으로 정의
2. **영향 범위**: 변경이 영향을 미치는 파일/컴포넌트/기능
3. **접근 방법**: 변경 순서 및 방법
4. **주의사항**: 사이드 이펙트, 성능 영향 등 잠재적 위험 요소

```
[계획 예시]
목표: 로그인 폼에 소셜 로그인 버튼 추가
영향 범위: AuthModal.tsx, AuthContext.tsx, types.ts
접근 방법:
  1. types.ts에 소셜 로그인 Provider 타입 추가
  2. AuthContext에 소셜 로그인 핸들러 구현
  3. AuthModal UI에 버튼 추가
주의사항: 기존 이메일 로그인 흐름에 영향 없도록 확인
```

- 간단한 수정(오타, 스타일 조정 등)은 계획 없이 바로 진행해도 됩니다

---

## 1. 프로젝트 아키텍처 개요

| 항목 | 기술 예시 |
|------|------|
| 프레임워크 | React + TypeScript |
| 빌드 도구 | Vite |
| CSS | Tailwind CSS |
| 백엔드 | Supabase (Auth, DB, Edge Functions, RPC) |
| 파일 저장 | Cloudflare R2 또는 S3 호환 스토리지 (서버 프록시 경유) |
| AI 서비스 | 외부 AI API (서버 사이드에서만 호출) |
| 배포 | Cloudflare Pages / Vercel / Netlify |
| 라우팅 | URL Query Parameter 기반 SPA 라우팅 또는 React Router |

> 이 문서는 특정 기술 스택에 종속되지 않으며, 프로젝트 실정에 맞게 항목을 조정하세요.

---

## 2. 보안 규칙 (Security)

### 2-1. API 키 관리
- **절대 금지**: `VITE_` 등 클라이언트 번들에 포함되는 접두사로 민감한 API 키 노출 금지
  - AI API 키, 결제 키, 시크릿 등은 **로컬 개발 전용**으로만 허용
  - 프로덕션에서는 반드시 **서버(Edge Function, API Route 등)** 내에서 처리
- 스토리지 자격 증명(`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` 등)은 **클라이언트에 절대 노출 금지**
  - 업로드/삭제는 서버 프록시를 통해서만 수행
- `.env` 파일은 `.gitignore`에 포함 필수

### 2-2. 인증 및 권한
- 관리자/역할 정보는 하드코딩 금지 → DB 기반 역할 관리 사용
  ```typescript
  // ❌ 금지 (하드코딩)
  const isAdmin = user?.id === 'abc-123...';

  // ✅ 권장 (DB 기반)
  const isAdmin = userProfile?.role === 'admin';
  ```
- **RLS (Row Level Security)**: Supabase 테이블에 반드시 활성화
  - 모든 테이블에 적절한 정책 설정 확인
  - 새 테이블 생성 시 RLS 정책을 함께 작성

### 2-3. 입력 검증
- 모든 사용자 입력은 타입 검증 후 서버에 전달
- UUID 등 식별자는 형식 검증 후 사용
- Supabase RPC 호출 시 파라미터를 항상 타입 검증 후 전달
- `JSON.parse`는 항상 `try-catch`로 감싸기

---

## 3. 컴포넌트 규칙 (Components)

### 3-1. 파일 크기 제한
> 단일 컴포넌트 파일은 **500줄 이하**를 권장합니다.

- 500줄 초과 시 기능별 하위 컴포넌트로 분리
  - 예: `ProductDetail/` → `ProductHeader.tsx`, `ProductComments.tsx`, `ProductActions.tsx`
- 새 컴포넌트 작성 시 500줄 초과 前 분리 계획 수립

### 3-2. 코드 스플리팅
- 라우트 단위 컴포넌트는 반드시 `React.lazy()` + `<Suspense>` 사용
- 초기 렌더링에 필요한 컴포넌트만 즉시 로드, 나머지는 lazy 적용
  ```typescript
  const Dashboard = React.lazy(() => import('./components/Dashboard'));
  ```

### 3-3. Props 전달 규칙
- **Prop Drilling 최소화**: 3단계 이상 전달이 필요한 데이터는 Context로 이동
- 컴포넌트 props에 `any` 타입 사용 금지
  ```typescript
  // ❌ 금지
  metadata?: any;

  // ✅ 권장
  metadata?: ProductMetadata;
  ```

### 3-4. 이벤트 핸들러 네이밍
- `handle*` 접두사: 컴포넌트 내부 핸들러 (예: `handleSubmit`)
- `on*` 접두사: Props로 전달되는 콜백 (예: `onItemSelect`)
- 일관성 유지 필수

---

## 4. 상태 관리 규칙 (State Management)

### 4-1. Context 구조 원칙
- 관련 있는 상태끼리만 같은 Context에 묶기 (불필요한 리렌더링 방지)
- 새 전역 상태 추가 시 기존 Context에 추가할지, 별도 Context를 생성할지 판단

```
RootProvider
├── ToastProvider       (알림 토스트)
├── AuthProvider        (인증/사용자)
├── ThemeProvider       (다크모드/언어/테마)
└── [도메인별 Provider]  (비즈니스 데이터)
```

### 4-2. 상태 업데이트 패턴
- `useState`의 함수형 업데이트 사용:
  ```typescript
  // ❌ 이전 값 직접 참조
  setItems([newItem, ...items]);

  // ✅ 함수형 업데이트
  setItems(prev => [newItem, ...prev.filter(i => i.id !== newItem.id)]);
  ```
- `useEffect` 의존성 배열에 콜백 함수 포함 시 `useCallback`으로 감싸기

### 4-3. localStorage 사용
- 캐시 목적으로만 사용 (단일 진실 공급원은 항상 서버)
- `try-catch`로 감싸기 (시크릿 모드/용량 초과 대비)
- 키 네이밍: `[앱명]_` 접두사 사용 (예: `myapp_user_prefs`)

---

## 5. 성능 최적화 규칙 (Performance)

### 5-1. 이미지 최적화
- 이미지 URL은 목적에 맞는 크기로 최적화하여 요청
  ```typescript
  // 목록 썸네일: 작은 크기, 낮은 품질
  getOptimizedImageUrl(url, 400, 80);
  // 상세 페이지: 큰 크기, 높은 품질
  getOptimizedImageUrl(url, 800, 90);
  ```
- `<img>` 태그에 반드시 `loading="lazy"` 속성 추가 (뷰포트 밖 이미지)
- `width` / `height` 속성 명시로 레이아웃 시프트(CLS) 방지

### 5-2. API 호출 최적화
- 독립적인 동시 요청은 `Promise.all()` 사용:
  ```typescript
  await Promise.all([fetchUsers(), fetchProducts(), fetchCategories()]);
  ```
- **중복 호출 방지**: 낙관적 업데이트 후 서버 동기화 패턴 사용
- 쿼리에 필요한 컬럼만 `select()` 지정

### 5-3. 번들 최적화
- 프로덕션 빌드에서 `console.*` / `debugger` 자동 제거 설정 (`vite.config.ts` 확인)
- 사용하지 않는 import 제거
- 큰 라이브러리는 동적 import 활용:
  ```typescript
  // ❌ 항상 번들에 포함
  import HeavyLib from 'heavy-lib';

  // ✅ 필요 시점에 로드
  const HeavyLib = (await import('heavy-lib')).default;
  ```

### 5-4. CSS 프레임워크 주의사항
> CDN 방식으로 CSS 프레임워크를 로드하면 오프라인/CDN 장애 시 스타일이 깨질 수 있습니다.

- 프로덕션에서는 `npm install`로 설치하여 번들에 포함하는 방식 권장
- CDN 사용 시 fallback 또는 `integrity` 해시 추가 검토

---

## 6. Supabase 규칙

### 6-1. Edge Function 작성 규칙
- 위치: `supabase/functions/[function-name]/index.ts`
- 공통 모듈: `supabase/functions/_shared/`
- **CORS 헤더** 반드시 포함
- 시크릿: `supabase secrets set KEY=VALUE`로 설정 (코드에 하드코딩 금지)

### 6-2. DB 스키마 변경
- 마이그레이션 파일을 `migrations/` 폴더에 생성
- RLS 정책을 마이그레이션에 포함
- RPC 함수는 `SECURITY DEFINER` 사용 시 주의 (필요 최소 권한만 부여)

### 6-3. 실시간 구독
- 컴포넌트 언마운트 시 반드시 구독 해제:
  ```typescript
  useEffect(() => {
    const channel = supabase.channel('...');
    // ... subscribe
    return () => { supabase.removeChannel(channel); };
  }, []);
  ```

---

## 7. 배포 규칙 (Deployment)

### 7-1. 빌드 및 배포 절차
```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 빌드
npm run build

# 3. 배포 (플랫폼에 따라 다름)
# Cloudflare: wrangler pages deploy dist
# Vercel: vercel --prod
```

### 7-2. 배포 전 체크리스트
- [ ] `.env`에 프로덕션 시크릿이 포함되지 않았는지 확인
- [ ] TypeScript 에러 없이 빌드 완료 확인
- [ ] 새로운 환경 변수 추가 시 `.env.example` 업데이트
- [ ] Supabase Edge Function 변경 시 별도 배포 (`supabase functions deploy [name]`)
- [ ] 중요 로직이 `console.log`에 의존하지 않는지 확인

### 7-3. 환경 변수 분리 원칙
- 클라이언트 노출 가능: `VITE_` 접두사 (공개 키만)
- 서버 전용: 플랫폼 시크릿 설정 (절대 클라이언트에 포함 금지)

---

## 8. 타입 규칙 (TypeScript)

### 8-1. 타입 정의 위치
- 공통 타입: `types.ts` (프로젝트 루트 또는 `src/`)
- 컴포넌트 전용 타입: 해당 컴포넌트 파일 상단 또는 같은 폴더의 `types.ts`
- `any` 사용 금지 → 점진적으로 구체적 타입으로 교체

### 8-2. 공통 타입 단일 정의 원칙
- 동일한 타입이 여러 파일에 중복 정의되는 경우 `types.ts`로 통합
  ```typescript
  // types.ts에서 단일 정의 후 import
  export type ViewState = 'home' | 'detail' | 'profile' | 'settings';
  ```

### 8-3. 타입 단언 최소화
- `as` 타입 단언은 런타임 오류를 숨길 수 있으므로 최소화
- 불가피한 경우 주석으로 이유 명시

---

## 9. 에러 처리 규칙

### 9-1. 기본 패턴
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // 성공 처리
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : '알 수 없는 오류';
  console.error("컨텍스트 설명:", err);
  showToast(`오류가 발생했습니다: ${message}`, 'error');
}
```

### 9-2. ErrorBoundary
- `ErrorBoundary` 컴포넌트를 라우트 단위로 적용
- 에러 발생 시 사용자에게 친화적인 메시지 + 복구 버튼 제공

### 9-3. 네트워크 에러 대응
- 파일 업로드 실패: 재시도 로직 추가 검토
- 외부 API 타임아웃: 클라이언트에 적절한 피드백 제공
- 응답 파싱 오류: `JSON.parse`를 항상 `try-catch`로 감싸기

---

## 10. 다국어 (i18n) 규칙

### 10-1. 번역 처리
- 번역 키를 별도 파일(`constants/translations.ts` 또는 i18n 라이브러리)로 관리
- 새 UI 텍스트는 반드시 지원하는 모든 언어로 작성
- 인라인 삼항 패턴 (소규모 프로젝트):
  ```typescript
  language === 'ko' ? '저장' : 'Save'
  ```

### 10-2. 날짜/숫자 포맷
- `Intl.DateTimeFormat` 또는 `toLocaleString()` 사용하여 로케일 자동 처리
- 하드코딩된 날짜 포맷 문자열 지양

---

## 11. 코딩 컨벤션

### 11-1. 권장 파일 구조
```
src/
├── components/     # UI 컴포넌트
├── contexts/       # React Context & Providers
├── services/       # 외부 API 통신 모듈
├── constants/      # 상수 값 (번역, 설정 등)
├── utils/          # 유틸리티 함수
├── hooks/          # 커스텀 훅
├── types.ts        # 공통 타입 정의
└── App.tsx         # 메인 앱 (라우팅, 상태 연결)
```

### 11-2. import 순서
1. React / 외부 라이브러리
2. 내부 컴포넌트
3. Context hooks
4. 서비스 / 유틸리티
5. 타입

### 11-3. 주석 규칙
- 함수 상단: JSDoc 스타일로 목적 설명
- 복잡한 로직: 인라인 주석으로 **왜** 그렇게 했는지 설명
- TODO/FIXME: 구체적인 내용과 함께 작성

---

## 12. 기술 부채 관리

| 우선순위 | 항목 | 설명 |
|---------|------|------|
| 🔴 높음 | 대형 컴포넌트 분리 | 500줄 이상 컴포넌트 하위 컴포넌트로 분할 |
| 🔴 높음 | 테스트 인프라 구축 | 테스트 없는 경우 Vitest 도입 검토 |
| 🟡 중간 | `any` 타입 제거 | 구체적 타입으로 점진적 교체 |
| 🟡 중간 | CDN CSS → npm 전환 | 빌드 타임 최적화 및 안정성 |
| 🟡 중간 | 역할 관리 DB화 | 하드코딩된 관리자 ID → DB role 기반 전환 |
| 🟢 낮음 | 공통 타입 통합 | 중복 타입 정의를 `types.ts`로 통합 |

---

## 13. 인앱 브라우저 대응 규칙

- Instagram / KakaoTalk 등 인앱 브라우저에서 제한되는 기능:
  - `getUserMedia` (카메라/마이크) → 외부 브라우저 리다이렉트 안내
  - OAuth 로그인 → 외부 브라우저에서 진행하도록 유도
- 인앱 브라우저 감지: `navigator.userAgent` 기반 체크
- 외부 브라우저 오픈: `window.open()` 또는 intent URL 사용

---

## 14. 파일 스토리지 규칙 (S3 / R2 등)

### 14-1. 업로드
- 반드시 서버 프록시(Edge Function, API Route 등) 경유
- `FormData`에 `Content-Type` 수동 설정 금지 (브라우저 자동 설정)
- 파일명 정규화: 공백 → 언더스코어, 특수문자 제거

### 14-2. 삭제
- DB 레코드 삭제 → 스토리지 파일 정리 순서로 진행
- 삭제 실패 시 로그만 남기고 사용자 경험 중단하지 않기

### 14-3. URL 관리
- 스토리지 URL 패턴을 상수로 관리하여 하드코딩 방지
- URL에서 스토리지 키 추출 시 유틸리티 함수로 일관 처리
