-- 1. 기존 중복/잘못된 함수들 삭제 (서명 명확히)
DROP FUNCTION IF EXISTS increment_likes(BIGINT, INTEGER);
DROP FUNCTION IF EXISTS increment_likes(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_views(BIGINT);
DROP FUNCTION IF EXISTS increment_views(UUID);

-- 2. UUID 프로젝트 ID를 지원하는 새로운 함수 정의 (NULL 방어 포함)
CREATE OR REPLACE FUNCTION increment_likes(row_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  IF amount NOT IN (1, -1) THEN
    RAISE EXCEPTION 'amount must be 1 or -1';
  END IF;
  UPDATE items
  SET likes = COALESCE(likes, 0) + amount
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET views = COALESCE(views, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION increment_likes(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon, authenticated;
