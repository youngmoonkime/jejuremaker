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

---

## 2. 보안 규칙 (Security)

### 2-1. API 키 관리
- **절대 금지**: 클라이언트 번들에 민감한 API 키 노출 금지
- 프로덕션에서는 반드시 서버(Edge Function, API Route 등) 내에서 처리
- 스토리지 자격 증명은 클라이언트에 절대 노출 금지
- `.env` 파일은 `.gitignore`에 포함 필수

### 2-2. 인증 및 권한
- 관리자/역할 정보는 하드코딩 금지 → DB 기반 역할 관리 사용
- RLS (Row Level Security): Supabase 테이블에 반드시 활성화

### 2-3. 입력 검증
- 모든 사용자 입력은 타입 검증 후 서버에 전달
- `JSON.parse`는 항상 `try-catch`로 감싸기

---

## 3. 컴포넌트 규칙 (Components)

- 단일 컴포넌트 파일은 **500줄 이하** 권장
- 라우트 단위 컴포넌트는 `React.lazy()` + `<Suspense>` 사용
- Prop Drilling 3단계 이상이면 Context로 이동
- props에 `any` 타입 사용 금지
- 핸들러 네이밍: 내부는 `handle*`, Props 콜백은 `on*`

---

## 4. 상태 관리 규칙 (State Management)

- 관련 있는 상태끼리만 같은 Context에 묶기
- `useState` 함수형 업데이트 사용: `setItems(prev => [...])`
- `useEffect` 의존성에 함수 포함 시 `useCallback` 사용
- localStorage: 캐시 목적으로만, `try-catch` 필수, `[앱명]_` 접두사

---

## 5. 성능 최적화 규칙 (Performance)

- 이미지: 목적에 맞는 크기 최적화, `loading="lazy"` 필수
- 동시 요청: `Promise.all()` 사용
- 큰 라이브러리: 동적 import로 필요 시점에 로드
- 사용하지 않는 import 제거

---

## 6. Supabase 규칙

- Edge Function에 CORS 헤더 반드시 포함
- 시크릿은 `supabase secrets set`으로 설정 (하드코딩 금지)
- 실시간 구독은 컴포넌트 언마운트 시 반드시 해제
- 마이그레이션 파일에 RLS 정책 포함

---

## 7. 배포 전 체크리스트

- [ ] `.env`에 프로덕션 시크릿 미포함 확인
- [ ] TypeScript 에러 없이 빌드 완료
- [ ] 새 환경 변수 추가 시 `.env.example` 업데이트
- [ ] Supabase Edge Function 변경 시 별도 배포

---

## 8. 타입 규칙 (TypeScript)

- 공통 타입: `types.ts`에서 단일 정의
- `any` 사용 금지
- `as` 타입 단언 최소화, 불가피 시 주석 명시

---

## 9. 에러 처리 규칙

```typescript
try {
  // ...
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : '알 수 없는 오류';
  console.error("컨텍스트:", err);
  showToast(`오류: ${message}`, 'error');
}
```

- ErrorBoundary를 라우트 단위로 적용
- `JSON.parse` 항상 `try-catch`로 감싸기

---

## 10. 코딩 컨벤션

- 모든 주석과 설명은 한국어로 작성
- import 순서: React → 외부 라이브러리 → 내부 컴포넌트 → hooks → 서비스/유틸 → 타입
- TODO/FIXME: 구체적인 내용과 함께 작성
