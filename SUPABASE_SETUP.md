# Supabase 데이터베이스 설정 가이드

## 1단계: SQL 마이그레이션 실행

1. **Supabase 대시보드 열기**
   - https://supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor로 이동**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 실행**
   - `supabase_migration.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **실행 확인**
   - 에러 없이 완료되었는지 확인
   - "Table Editor"에서 `user_tokens` 테이블 생성 확인

## 2단계: Cron Jobs 설정 (선택사항)

> [!NOTE]
> Cron Jobs는 Supabase Pro 플랜에서만 사용 가능합니다. 무료 플랜에서는 클라이언트 측 체크로 대체됩니다.

1. **Database → Cron Jobs** 메뉴로 이동

2. **토큰 리셋 작업 추가**
   - Name: `Reset User Tokens`
   - Schedule: `0 0 * * *` (매일 자정)
   - SQL: `SELECT reset_user_tokens();`

3. **프로젝트 삭제 스케줄링 작업**
   - Name: `Schedule Old Projects`
   - Schedule: `0 0 * * *` (매일 자정)
   - SQL: `SELECT schedule_old_project_deletions();`

4. **예약된 프로젝트 삭제 작업**
   - Name: `Delete Scheduled Projects`
   - Schedule: `0 1 * * *` (매일 오전 1시)
   - SQL: `SELECT delete_scheduled_projects();`

## 3단계: Storage Bucket 확인

1. **Storage 메뉴로 이동**

2. **`project-images` 버킷 확인**
   - 자동 생성되어 있어야 함
   - Public 설정 확인

3. **Policies 확인**
   - "Users can upload their own images" 정책 존재 확인
   - "Public images are viewable by everyone" 정책 존재 확인

## 4단계: 테스트

### 토큰 시스템 테스트

1. 애플리케이션에 로그인
2. 브라우저 콘솔(F12) 열기
3. 다음 로그 확인:
   - "Creating new token record for user" (신규 사용자)
   - 또는 토큰 개수 표시

4. 위자드로 프로젝트 생성
5. 토큰이 5개 감소하는지 확인
6. 로그아웃 후 재로그인
7. 토큰이 유지되는지 확인

### 프로젝트 저장 테스트

1. 위자드로 프로젝트 생성
2. "내 정보" 탭에서 프로젝트 확인
3. Supabase Table Editor에서 `items` 테이블 확인
4. `owner_id`, `is_public: false` 확인

### 삭제/공개 테스트

1. "내 정보"에서 프로젝트 선택
2. "공개하기" 클릭
3. 브라우저 콘솔에서 "Publishing project: [ID]" 확인
4. "탐색" 탭에서 공개된 프로젝트 확인
5. "삭제" 버튼 테스트

## 문제 해결

### "Failed to create token record" 에러

**원인**: `user_tokens` 테이블이 생성되지 않았거나 RLS 정책 문제

**해결**:
```sql
-- Table Editor에서 user_tokens 테이블 확인
-- 없으면 SQL 재실행

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'user_tokens';
```

### "Failed to publish/delete" 에러

**원인**: `items` 테이블에 `owner_id`, `is_public` 컬럼 없음

**해결**:
```sql
-- 컬럼 추가
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
```

### 토큰이 리셋되지 않음

**원인**: Cron Job 미설정 (무료 플랜)

**해결**: 클라이언트 측 체크가 자동으로 작동합니다. 로그인 시 30일 경과 여부를 확인하고 자동 리셋합니다.

## 다음 단계

✅ 데이터베이스 설정 완료
✅ 토큰 시스템 작동
✅ 프로젝트 저장/삭제/공개 작동

이제 애플리케이션을 사용할 준비가 되었습니다!
