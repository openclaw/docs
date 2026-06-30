---
read_when:
    - API 클라이언트 빌드하기
    - 엔드포인트 또는 스키마 추가
summary: 공개 REST API(v1) 개요 및 규칙.
x-i18n:
    generated_at: "2026-06-30T13:51:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

기본: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 공개 카탈로그 재사용

ClawHub의 공개 읽기 API를 기반으로 서드파티 카탈로그, 디렉터리 또는 검색 화면을 만들 수 있습니다. 공개 Skill 메타데이터와 Skill 파일은 ClawHub의 Skill 라이선스 규칙에 따라 게시되며, API 자체에는 속도 제한이 적용되므로 책임 있게 사용해야 합니다.

지침:

- 카탈로그 목록에는 `GET /api/v1/skills`, `GET /api/v1/search`, `GET /api/v1/skills/{slug}` 같은 공개 읽기 엔드포인트를 사용하세요.
- 공격적으로 폴링하지 말고 응답을 캐시하며 `429`, `Retry-After`, 속도 제한 헤더를 준수하세요.
- 목록을 표시할 때 사용자가 원본 레지스트리 레코드를 확인할 수 있도록 표준 ClawHub Skill URL로 다시 링크하세요.
- `https://clawhub.ai/<owner>/skills/<slug>` 형식의 표준 페이지 URL을 사용하세요.
- ClawHub가 서드파티 사이트를 보증, 검증 또는 운영한다는 인상을 주지 마세요.
- 공개 API 필터나 인증 경계를 우회해 숨겨진 콘텐츠, 비공개 콘텐츠 또는 검토 차단된 콘텐츠를 미러링하지 마세요.

## 인증

- 공개 읽기: 토큰이 필요 없습니다.
- 쓰기 + 계정: `Authorization: Bearer clh_...`.

## 속도 제한

인증 인식 적용:

- 익명 요청: IP별.
- 인증된 요청(유효한 Bearer 토큰): 사용자 버킷별.
- 토큰이 없거나 유효하지 않으면 IP 기준 적용으로 되돌아갑니다.

- 읽기: IP당 3000/분, 키당 12000/분
- 쓰기: IP당 300/분, 키당 3000/분
- 다운로드: IP당 1200/분, 키당 6000/분

헤더: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining`, `Retry-After`는 `429`에 포함됩니다.

의미:

- `X-RateLimit-Reset`: Unix epoch 초(절대 재설정 시간)
- `RateLimit-Reset`: 재설정까지의 지연 시간(초)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 존재하는 경우 정확한 남은 예산. 샤딩된 성공 요청은 대략적인 전역 값을 반환하는 대신 이를 생략합니다.
- `Retry-After`: `429`에서 기다려야 할 지연 시간(초)

`429` 예:

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

- 있는 경우 `Retry-After`를 우선 사용하세요.
- 그렇지 않으면 `RateLimit-Reset`을 사용하거나 `X-RateLimit-Reset`에서 지연 시간을 도출하세요.
- 재시도에 지터를 추가하세요.

## 오류

- v1 오류는 `400`, `401`, `403`, `404`, `429` 및 차단된 다운로드 응답을 포함해 일반 텍스트(`text/plain; charset=utf-8`)입니다.
- 알 수 없는 쿼리 매개변수는 호환성을 위해 무시됩니다.
- 알려진 쿼리 매개변수에 유효하지 않은 값이 있으면 `400`을 반환합니다.

## 엔드포인트

공개 읽기:

- `GET /api/v1/search?q=...`
  - 선택적 필터: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - 레거시 별칭: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`(기본값), `recommended`(`default`), `createdAt`(`newest`), `downloads`, `stars`(`rating`), 레거시 설치 별칭 `installsCurrent`/`installs`/`installsAllTime`은 `downloads`로 매핑, `trending`
  - 유효하지 않은 `sort` 값은 `400`을 반환합니다.
  - `cursor`는 `trending`이 아닌 정렬에 적용됩니다.
  - 선택적 필터: `nonSuspiciousOnly=true`
  - 레거시 별칭: `nonSuspicious=true`
  - `nonSuspiciousOnly=true`를 사용하면 커서 기반 페이지에 `limit`보다 적은 항목이 포함될 수 있습니다. 계속하려면 `nextCursor`를 사용하세요.
  - `recommended`는 참여도와 최신성 신호를 사용합니다.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - 호스팅된 Skills는 결정적 ZIP 바이트를 반환합니다.
  - `clean` 또는 `suspicious` 스캔이 있는 현재 GitHub 기반 Skills는 ClawHub 바이트 대신 JSON `public-github` 인계 설명자를 반환합니다.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - 호스팅된 Skills는 저장된 파일로 내보냅니다.
  - `clean` 또는 `suspicious` 스캔이 있는 현재 GitHub 기반 Skills는 `public-github` 인계 설명자로 내보냅니다.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated`(기본값), `recommended`, `downloads`, 레거시 별칭 `installs`
  - 유효하지 않은 `sort` 값은 `400`을 반환합니다.
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended`(기본값), `downloads`, `updated`, 레거시 별칭 `installs`
- `GET /api/v1/plugins/search?q=...`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

관리자 전용:

- `POST /api/v1/users/reserve`는 소유자 핸들을 위해 루트 슬러그와 비공개 무릴리스 패키지 자리 표시자를 예약합니다.

## 레거시

레거시 `/api/*` 및 `/api/cli/*`는 계속 사용할 수 있습니다. `DEPRECATIONS.md`를 참조하세요.
