-- 1. "내 프로젝트" 조회 성능 개선 (로그인 사용자별 최신순)
CREATE INDEX IF NOT EXISTS idx_items_owner_created_at ON items(owner_id, created_at DESC);

-- 2. "탐색(메인)" 조회 성능 개선 (공개 프로젝트 최신순)
CREATE INDEX IF NOT EXISTS idx_items_public_created_at ON items(is_public, created_at DESC) WHERE is_public = true;

-- 3. "인기급상승" 조회 성능 개선 (이미 드렸지만 다시 한번 포함)
CREATE INDEX IF NOT EXISTS idx_items_public_likes_views ON items(is_public, likes DESC, views DESC) WHERE is_public = true;

-- 4. 카테고리 필터링 성능 개선 (필요시)
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
