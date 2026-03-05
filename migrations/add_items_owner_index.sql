-- 이 스크립트를 Supabase 대시보드의 SQL Editor에 붙여넣고 [Run] 버튼을 눌러 실행하세요.

-- 1. fetchMyProjects 쿼리를 위한 복합 인덱스 추가 (핵심 타임아웃 해결)
-- owner_id로 필터링하고 created_at으로 정렬하는 쿼리를 최저 부하로 스캔하게 해줍니다.
CREATE INDEX IF NOT EXISTS idx_items_owner_created 
ON items (owner_id, created_at DESC);

-- 2. fetchProjects (Discovery 탭) 등에서 범용적으로 사용할 카테고리 필터 인덱스
-- category 필터링 속도를 높여 줍니다.
CREATE INDEX IF NOT EXISTS idx_items_category 
ON items (category);

-- 3. fetchProjects (메인 피드) 전체 목록의 날짜 정렬 Timeout(57014) 방어용 인덱스
-- 조건 없이 가장 최근 게시물 50개를 정렬해서 가져올 때 부하를 완전히 없애줍니다.
CREATE INDEX IF NOT EXISTS idx_items_created_at 
ON items (created_at DESC);

-- 실행 완료 로그를 보기 위한 간단한 쿼리
SELECT '3개의 성능 최적화용 인덱스 생성이 모두 완료되었습니다. 화면을 새로고침하세요.' AS success_message;
