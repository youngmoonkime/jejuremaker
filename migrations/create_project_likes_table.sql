-- 1. 사용자별 좋아요 관계 테이블 생성
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id) -- 중복 좋아요 방지
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);

-- 3. RLS 설정
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all likes" ON project_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON project_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON project_likes;

CREATE POLICY "Users can view all likes"
ON project_likes FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own likes"
ON project_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON project_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. 만능 RPC 함수 보강 (project_likes 테이블도 함께 업데이트)
CREATE OR REPLACE FUNCTION increment_likes(row_id TEXT, amount INTEGER)
RETURNS VOID AS $$
DECLARE
  target_id UUID;
  current_uid UUID;
BEGIN
  -- 1. 입력받은 TEXT ID를 UUID로 변환 시도
  BEGIN
    target_id := row_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    -- UUID 형식이 아니면 (기존 BIGINT 등) 무시하거나 별도 처리
    -- 현재는 모두 UUID로 전환 중이므로 UUID 기반으로 items 테이블 업데이트 시도
    UPDATE items SET likes = COALESCE(likes, 0) + amount WHERE (id::TEXT = row_id);
    RETURN;
  END;

  -- 2. 현재 사용자 ID 획득
  current_uid := auth.uid();

  -- 3. amount가 1이면 추가 (좋아요)
  IF amount = 1 THEN
    INSERT INTO project_likes (user_id, project_id)
    VALUES (current_uid, target_id)
    ON CONFLICT (user_id, project_id) DO NOTHING;
    
    UPDATE items SET likes = COALESCE(likes, 0) + 1 WHERE id = target_id;
  
  -- 4. amount가 -1이면 삭제 (좋아요 취소)
  ELSIF amount = -1 THEN
    DELETE FROM project_likes 
    WHERE user_id = current_uid AND project_id = target_id;
    
    UPDATE items SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
