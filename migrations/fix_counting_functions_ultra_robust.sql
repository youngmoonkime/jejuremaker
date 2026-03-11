-- 1. 기존 함수들 정리 (서명별로 확실히 삭제)
DROP FUNCTION IF EXISTS increment_likes(BIGINT, INTEGER);
DROP FUNCTION IF EXISTS increment_likes(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_views(BIGINT);
DROP FUNCTION IF EXISTS increment_views(UUID);

-- 2. TEXT를 입력받아 내부에서 캐스팅하는 만능 처리 함수 (가장 유연함)
CREATE OR REPLACE FUNCTION increment_likes(row_id TEXT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  IF amount NOT IN (1, -1) THEN
    RAISE EXCEPTION 'amount must be 1 or -1';
  END IF;
  
  -- ID가 UUID 형식이면 UUID로, 아니면 BIGINT로 처리 시도
  UPDATE items
  SET likes = COALESCE(likes, 0) + amount
  WHERE (id::TEXT = row_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(row_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET views = COALESCE(views, 0) + 1
  WHERE (id::TEXT = row_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION increment_likes(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_views(TEXT) TO anon, authenticated;
