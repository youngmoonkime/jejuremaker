-- 1. 상위 정렬을 위한 인덱스 추가 (조회수 및 좋아요)
CREATE INDEX IF NOT EXISTS idx_items_likes ON items(likes DESC);
CREATE INDEX IF NOT EXISTS idx_items_views ON items(views DESC);

-- 2. 복합 인덱스 (공개 여부와 함께 정렬 시 유리)
CREATE INDEX IF NOT EXISTS idx_items_public_likes ON items(is_public, likes DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_items_public_views ON items(is_public, views DESC) WHERE is_public = true;
