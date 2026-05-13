---
read_when:
    - API 클라이언트 구축
    - 엔드포인트 또는 스키마 추가하기
summary: 공개 REST API(v1) 개요 및 규칙.
x-i18n:
    generated_at: "2026-05-13T05:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

기본: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 공개 카탈로그 재사용

ClawHub의 공개 읽기 API를 기반으로 서드파티 카탈로그, 디렉터리 또는 검색 화면을 만들 수 있습니다. 공개 Skills 메타데이터와 Skills 파일은 ClawHub의 Skills 라이선스 규칙에 따라 게시되며, API 자체에는 요청 제한이 적용되므로 책임 있게 사용해야 합니다.

가이드라인:

- 카탈로그 목록에는 `GET /api/v1/skills`, `GET /api/v1/search`, `GET /api/v1/skills/{slug}` 같은 공개 읽기 엔드포인트를 사용하세요.
- 과도하게 폴링하지 말고 응답을 캐시하며 `429`, `Retry-After`, 요청 제한 헤더를 준수하세요.
- 목록을 표시할 때는 사용자가 원본 레지스트리 레코드를 확인할 수 있도록 표준 ClawHub Skills URL로 다시 연결하세요.
- 표준 페이지 URL은 `https://clawhub.ai/<owner>/<slug>` 형식을 사용하세요.
- ClawHub가 서드파티 사이트를 보증, 검증 또는 운영한다고 암시하지 마세요.
- 공개 API 필터나 인증 경계를 우회하여 숨겨진 콘텐츠, 비공개 콘텐츠 또는 중재로 차단된 콘텐츠를 미러링하지 마세요.

## 인증

- 공개 읽기: 토큰이 필요하지 않습니다.
- 쓰기 + 계정: `Authorization: Bearer clh_...`.

## 요청 제한

인증 인식 적용:

- 익명 요청: IP별.
- 인증된 요청(유효한 Bearer 토큰): 사용자 버킷별.
- 토큰이 없거나 유효하지 않으면 IP 기준 적용으로 대체됩니다.

- 읽기: IP당 600/분, 키당 2400/분
- 쓰기: IP당 45/분, 키당 180/분

헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`(`429`에서).

의미:

- `X-RateLimit-Reset`: Unix 에포크 초(절대 재설정 시간)
- `RateLimit-Reset`: 재설정까지의 지연 시간(초)
- `Retry-After`: `429`에서 대기할 지연 시간(초)

`429` 예시:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

클라이언트 처리:

- `Retry-After`가 있으면 우선 사용하세요.
- 그렇지 않으면 `RateLimit-Reset`을 사용하거나 `X-RateLimit-Reset`에서 지연 시간을 도출하세요.
- 재시도에 지터를 추가하세요.

## 엔드포인트

공개 읽기:

- `GET /api/v1/search?q=...`
  - 선택적 필터: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - 레거시 별칭: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`(기본값), `createdAt`(`newest`), `downloads`, `stars`(`rating`), `installsCurrent`(`installs`), `installsAllTime`, `trending`
  - `cursor`는 `trending`이 아닌 정렬에 적용됩니다.
  - 선택적 필터: `nonSuspiciousOnly=true`
  - 레거시 별칭: `nonSuspicious=true`
  - `nonSuspiciousOnly=true`를 사용하면 커서 기반 페이지에 `limit`보다 적은 항목이 포함될 수 있습니다. 계속하려면 `nextCursor`를 사용하세요.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

인증 필요:

- `POST /api/v1/skills`(게시, multipart 권장)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

관리자 전용:

- `POST /api/v1/users/reserve`는 소유자 핸들에 대해 루트 slug와 비공개 무릴리스 패키지 플레이스홀더를 예약합니다.

## 레거시

레거시 `/api/*` 및 `/api/cli/*`는 계속 사용할 수 있습니다. `DEPRECATIONS.md`를 참조하세요.
