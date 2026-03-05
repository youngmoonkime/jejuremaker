-- 1. 예전의 "나의 프로필만 볼 수 있다" 라는 아주 좁은 규칙을 삭제합니다.
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- 2. "모두가 모든 프로필을 읽을(보기) 수 있다" 로 새롭게 읽기 권한을 개방합니다.
-- 이 코드가 있어야 메인 피드에서 다른 사람들의 프로필 사진과 닉네임이 정상적으로 불러와집니다!
CREATE POLICY "Anyone can view user_profiles" ON user_profiles
  FOR SELECT USING (true);

-- (UPSERT 충돌 방지) 기존 Insert 정책을 확인하고 필요하면 Update와 함께 안전하게 구성
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 완료 메시지
SELECT '프로필 동기화 및 렌더링 버그 해결(RLS 완화)이 완료되었습니다.' AS success_message;
