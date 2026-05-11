---
read_when:
    - 엔드포인트 추가/변경
    - CLI ↔ 레지스트리 요청 디버깅
summary: HTTP API 참조(공개 + CLI 엔드포인트 + 인증).
x-i18n:
    generated_at: "2026-05-11T22:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

기본 URL: `https://clawhub.ai`(기본값).

모든 v1 경로는 `/api/v1/...` 아래에 있습니다.
레거시 `/api/...` 및 `/api/cli/...`는 호환성을 위해 유지됩니다(`DEPRECATIONS.md` 참조).
OpenAPI: `/api/v1/openapi.json`.

## 공개 카탈로그 재사용

서드 파티 디렉터리는 공개 읽기 엔드포인트를 사용해 ClawHub Skills를 나열하거나 검색할 수 있습니다. 결과를 캐시하고, `429`/`Retry-After`를 준수하며, 사용자를 정식 ClawHub 목록(`https://clawhub.ai/<owner>/<slug>`)으로 다시 연결하고, ClawHub가 서드 파티 사이트를 보증한다고 암시하지 마세요. 숨겨진 콘텐츠, 비공개 콘텐츠, 또는 검토로 차단된 콘텐츠를 공개 API 표면 밖에서 미러링하려고 시도하지 마세요.

웹 slug 바로 가기는 레지스트리 패밀리 전체에서 해석되지만, API 클라이언트는 라우트 우선순위를 재구성하는 대신 읽기 엔드포인트가 반환하는 정식 URL을 사용해야 합니다.

## 속도 제한

적용 모델:

- 익명 요청: IP별로 적용됩니다.
- 인증된 요청(유효한 Bearer 토큰): 사용자 버킷별로 적용됩니다.
- 토큰이 없거나 유효하지 않으면 동작은 IP 적용으로 대체됩니다.
- 인증된 쓰기 엔드포인트는 서버가 이유를 알고 있을 때 단순한 `Unauthorized`를 반환해서는 안 됩니다. 누락된 토큰, 유효하지 않거나 폐기된 토큰, 삭제/차단/비활성화된 계정은 각각 실행 가능한 텍스트를 받아야 CLI 클라이언트가 사용자에게 무엇이 차단했는지 알려줄 수 있습니다.

- 읽기: IP당 600/분, 키당 2400/분
- 쓰기: IP당 45/분, 키당 180/분
- 다운로드: IP당 30/분, 키당 180/분(`/api/v1/download`)

헤더:

- 레거시 호환성: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 표준화됨: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429`의 경우: `Retry-After`

헤더 의미:

- `X-RateLimit-Reset`: 절대 Unix epoch 초
- `RateLimit-Reset`: 재설정까지 남은 초(지연)
- `Retry-After`: `429`에서 재시도 전 대기할 초(지연)

예시 `429` 응답:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

클라이언트 가이드:

- `Retry-After`가 있으면, 재시도하기 전에 해당 초만큼 기다립니다.
- 동기화된 재시도를 피하기 위해 jitter가 적용된 backoff를 사용합니다.
- `Retry-After`가 없으면 `RateLimit-Reset`으로 대체하거나(`X-RateLimit-Reset`에서 계산) 사용합니다.

IP 소스:

- 기본적으로 클라이언트 IP에 `cf-connecting-ip`(Cloudflare)를 사용합니다.
- ClawHub는 edge에서 클라이언트 IP를 식별하기 위해 신뢰된 포워딩 헤더를 사용합니다.
- 신뢰된 클라이언트 IP를 사용할 수 없으면, 익명 다운로드 요청은 하나의 전역 `ip:unknown` 버킷 대신 엔드포인트 범위 fallback 버킷을 사용합니다. 익명 읽기/쓰기 요청은 여전히 공유 unknown 버킷을 사용하므로 누락된 IP 라우팅이 계속 보이고 보수적으로 유지됩니다.

## 공개 엔드포인트(인증 없음)

### `GET /api/v1/search`

쿼리 매개변수:

- `q`(필수): 쿼리 문자열
- `limit`(선택): 정수
- `highlightedOnly`(선택): 강조된 Skills만 필터링하려면 `true`
- `nonSuspiciousOnly`(선택): 의심스러운(`flagged.suspicious`) Skills를 숨기려면 `true`
- `nonSuspicious`(선택): `nonSuspiciousOnly`의 레거시 별칭

응답:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

참고:

- 결과는 관련도 순서로 반환됩니다(embedding 유사도 + 정확한 slug/name 토큰 boost + 다운로드에서 얻은 popularity prior).
- 관련도는 popularity보다 강합니다. 정확한 slug 또는 표시 이름 토큰 일치는 다운로드 수가 훨씬 많은 더 느슨한 일치보다 높은 순위를 차지할 수 있습니다.
- ASCII 텍스트는 단어 및 문장 부호 경계에서 토큰화됩니다. 예를 들어 `personal-map`에는 독립적인 `map` 토큰이 포함되지만, `amap-jsapi-skill`에는 `amap`, `jsapi`, `skill`이 포함됩니다. 따라서 `map`을 검색하면 `amap-jsapi-skill`보다 `personal-map`이 더 강한 어휘 일치를 얻습니다.
- 다운로드는 기본 순위 신호가 아니라 작은 log-scaled prior 및 tie-breaker로 사용됩니다. 쿼리 텍스트 일치가 약하면 다운로드가 많은 Skills도 더 낮은 순위를 받을 수 있습니다.
- 의심스럽거나 숨겨진 검토 상태는 호출자 필터 및 현재 검토 상태에 따라 공개 검색에서 Skill을 제거할 수 있습니다.

게시자 검색 가능성 가이드:

- 사용자가 실제로 검색할 용어를 표시 이름, 요약, 태그에 넣으세요. 독립적인 slug 토큰은 유지하려는 안정적인 정체성이기도 할 때만 사용하세요.
- 새 slug가 더 나은 장기 정식 이름이 아닌 한, 하나의 쿼리를 좇기 위해 slug 이름을 바꾸지 마세요. 이전 slug는 리디렉션 별칭이 되지만, 정식 URL, 표시되는 slug, 향후 검색 digest는 새 slug를 사용합니다.
- 이름 변경 별칭은 레지스트리를 통해 해석되는 이전 URL 및 설치의 해석을 보존하지만, 검색 순위는 이름 변경이 인덱싱된 후의 정식 Skill 메타데이터를 기준으로 합니다. 기존 통계는 Skill에 그대로 남습니다.
- Skill이 예상치 못하게 보이지 않으면, 순위 관련 메타데이터를 변경하기 전에 로그인한 상태에서 `clawhub inspect <slug>`로 먼저 검토 상태를 확인하세요.

### `GET /api/v1/skills`

쿼리 매개변수:

- `limit`(선택): 정수(1–200)
- `cursor`(선택): `trending`이 아닌 모든 정렬의 페이지네이션 커서
- `sort`(선택): `updated`(기본값), `createdAt`(별칭: `newest`), `downloads`, `stars`(별칭: `rating`), `installsCurrent`(별칭: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly`(선택): 의심스러운(`flagged.suspicious`) Skills를 숨기려면 `true`
- `nonSuspicious`(선택): `nonSuspiciousOnly`의 레거시 별칭

참고:

- `trending`은 최근 7일의 설치 수(telemetry 기반)로 순위를 매깁니다.
- `createdAt`은 새 Skill 크롤에 안정적이며, `updated`는 기존 Skills가 다시 게시될 때 변경됩니다.
- `nonSuspiciousOnly=true`일 때는 페이지 검색 후 의심스러운 Skills가 필터링되므로, 커서 기반 정렬이 한 페이지에서 `limit`보다 적은 항목을 반환할 수 있습니다.
- 있으면 `nextCursor`를 사용해 페이지네이션을 계속하세요. 짧은 페이지 자체가 결과 끝을 의미하지는 않습니다.

응답:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

응답:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

참고:

- 소유자 이름 변경/병합 흐름으로 생성된 이전 slug는 정식 Skill로 해석됩니다.
- `metadata.os`: Skill frontmatter에 선언된 OS 제한(예: `["macos"]`, `["linux"]`). 선언되지 않았으면 `null`.
- `metadata.systems`: Nix 시스템 대상(예: `["aarch64-darwin", "x86_64-linux"]`). 선언되지 않았으면 `null`.
- Skill에 플랫폼 메타데이터가 없으면 `metadata`는 `null`입니다.
- `moderation`은 Skill이 flag되었거나 소유자가 보고 있을 때만 포함됩니다.

### `GET /api/v1/skills/{slug}/moderation`

구조화된 검토 상태를 반환합니다.

응답:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

참고:

- 소유자와 moderator는 숨겨진 Skills의 검토 세부 정보에 접근할 수 있습니다.
- 공개 호출자는 이미 flag된 표시 Skills에 대해서만 `200`을 받습니다.
- 공개 호출자의 evidence는 redact되며, 소유자/moderator에게만 원시 snippet이 포함됩니다.

### `POST /api/v1/skills/{slug}/report`

moderator 검토를 위해 Skill을 신고합니다. 신고는 Skill 수준이며, 선택적으로 버전에 연결되고 Skill 신고 queue로 전달됩니다.

인증:

- API 토큰이 필요합니다.

요청:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

응답:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Skill 신고 intake를 위한 moderator/admin 엔드포인트.

쿼리 매개변수:

- `status`(선택): `open`(기본값), `confirmed`, `dismissed`, 또는 `all`
- `limit`(선택): 정수(1-200)
- `cursor`(선택): 페이지네이션 커서

응답:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Skill 신고를 해결하거나 다시 여는 moderator/admin 엔드포인트.

요청:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`는 `confirmed` 및 `dismissed`에 필요합니다. `status`를 다시 `open`으로 설정할 때는 생략할 수 있습니다. 동일한 감사 가능한 workflow에서 Skill을 숨기려면 triage된 신고와 함께 `finalAction: "hide"`를 전달하세요.

### `GET /api/v1/skills/{slug}/versions`

쿼리 매개변수:

- `limit`(선택): 정수
- `cursor`(선택): 페이지네이션 커서

### `GET /api/v1/skills/{slug}/versions/{version}`

버전 메타데이터 + 파일 목록을 반환합니다.

- `version.security`에는 사용 가능한 경우 정규화된 scan verification 상태와 scanner 세부 정보(VirusTotal + LLM)가 포함됩니다.

### `GET /api/v1/skills/{slug}/scan`

Skill 버전의 security scan verification 세부 정보를 반환합니다.

쿼리 매개변수:

- `version`(선택): 특정 버전 문자열.
- `tag`(선택): 태그가 지정된 버전을 해석합니다(예: `latest`).

참고:

- `version`과 `tag`가 모두 제공되지 않으면 최신 버전을 사용합니다.
- 정규화된 verification 상태와 scanner별 세부 정보를 포함합니다.
- `security.capabilityTags`에는 감지된 경우 `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`, `requires-oauth-token`, `posts-externally` 같은 결정론적 capability/risk 레이블이 포함됩니다.
- `security.hasScanResult`는 scanner가 확정 verdict(`clean`, `suspicious`, 또는 `malicious`)를 생성한 경우에만 `true`입니다.
- `moderation`은 최신 버전에서 파생된 현재 Skill 수준 검토 snapshot입니다.
- 과거 버전을 쿼리할 때는 `moderation`과 `security`를 동일한 버전 컨텍스트로 취급하기 전에 `moderation.matchesRequestedVersion` 및 `moderation.sourceVersion`을 확인하세요.

### `GET /api/v1/skills/{slug}/file`

원시 텍스트 콘텐츠를 반환합니다.

쿼리 매개변수:

- `path`(필수)
- `version`(선택)
- `tag`(선택)

참고:

- 기본값은 최신 버전입니다.
- 파일 크기 제한: 200KB.

### `GET /api/v1/packages`

다음을 위한 통합 카탈로그 엔드포인트:

- Skills
- 코드 Plugins
- 번들 Plugins

쿼리 매개변수:

- `limit`(선택 사항): 정수(1–100)
- `cursor`(선택 사항): 페이지네이션 커서
- `family`(선택 사항): `skill`, `code-plugin` 또는 `bundle-plugin`
- `channel`(선택 사항): `official`, `community` 또는 `private`
- `isOfficial`(선택 사항): `true` 또는 `false`
- `executesCode`(선택 사항): `true` 또는 `false`
- `capabilityTag`(선택 사항): Plugin 패키지용 기능 필터
- `target` / `hostTarget`(선택 사항): `host:<target>`의 축약형
- `os`, `arch`, `libc`(선택 사항): 호스트 기능 필터의 축약형
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (선택 사항): 환경 요구 사항 태그의 `true`/`1` 축약형
- `externalService`, `binary`, `osPermission`(선택 사항): 이름이 지정된
  환경 요구 사항 태그의 축약형
- `artifactKind`(선택 사항): `legacy-zip` 또는 `npm-pack`
- `npmMirror`(선택 사항): npm 미러를 통해 사용 가능한 ClawPack 기반 패키지 버전을
  표시하려면 `true`/`1`

참고:

- `GET /api/v1/code-plugins` 및 `GET /api/v1/bundle-plugins`는 고정 패밀리 별칭으로 유지됩니다.
- Skill 항목은 계속 Skill 레지스트리를 기반으로 하며, 여전히 `POST /api/v1/skills`를 통해서만 게시할 수 있습니다.
- `POST /api/v1/packages`는 여전히 code-plugin 및 bundle-plugin 릴리스 전용입니다.
- 익명 호출자는 공개 패키지 채널만 볼 수 있습니다.
- 인증된 호출자는 자신이 속한 게시자의 비공개 패키지를 목록/검색 결과에서 볼 수 있습니다.
- `channel=private`는 인증된 호출자가 읽을 수 있는 패키지만 반환합니다.

### `GET /api/v1/packages/search`

Skills + Plugin 패키지 전반의 통합 카탈로그 검색입니다.

쿼리 매개변수:

- `q`(필수): 쿼리 문자열
- `limit`(선택 사항): 정수(1–100)
- `family`(선택 사항): `skill`, `code-plugin` 또는 `bundle-plugin`
- `channel`(선택 사항): `official`, `community` 또는 `private`
- `isOfficial`(선택 사항): `true` 또는 `false`
- `executesCode`(선택 사항): `true` 또는 `false`
- `capabilityTag`(선택 사항): Plugin 패키지용 기능 필터
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` 및
  `osPermission`은 일반적인 기능 태그의 축약형으로 허용됩니다
- `artifactKind`(선택 사항): `legacy-zip` 또는 `npm-pack`
- `npmMirror`(선택 사항): npm 미러를 통해 사용 가능한 ClawPack 기반 패키지 버전을
  검색하려면 `true`/`1`

참고:

- 익명 호출자는 공개 패키지 채널만 볼 수 있습니다.
- 인증된 호출자는 자신이 속한 게시자의 비공개 패키지를 검색할 수 있습니다.
- `channel=private`는 인증된 호출자가 읽을 수 있는 패키지만 반환합니다.
- 아티팩트 필터는 인덱싱된 기능 태그를 기반으로 합니다:
  `artifact:legacy-zip`, `artifact:npm-pack`, `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

패키지 상세 메타데이터를 반환합니다.

참고:

- Skills도 통합 카탈로그에서 이 경로를 통해 해석될 수 있습니다.
- 호출자가 소유 게시자를 읽을 수 없는 경우 비공개 패키지는 `404`를 반환합니다.

### `DELETE /api/v1/packages/{name}`

패키지와 모든 릴리스를 소프트 삭제합니다.

참고:

- 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 모더레이터 또는 플랫폼 관리자의 API 토큰이 필요합니다.

### `GET /api/v1/packages/{name}/versions`

버전 기록을 반환합니다.

쿼리 매개변수:

- `limit`(선택 사항): 정수(1–100)
- `cursor`(선택 사항): 페이지네이션 커서

참고:

- 호출자가 소유 게시자를 읽을 수 없는 경우 비공개 패키지는 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/versions/{version}`

파일 메타데이터, 호환성, 기능, 검증, 아티팩트 메타데이터 및 스캔 데이터를 포함한 하나의 패키지 버전을 반환합니다.

참고:

- `version.artifact.kind`는 이전 방식 패키지 아카이브의 경우 `legacy-zip`,
  ClawPack 기반 릴리스의 경우 `npm-pack`입니다.
- ClawPack 릴리스에는 npm 호환 `npmIntegrity`, `npmShasum` 및
  `npmTarballName` 필드가 포함됩니다.
- 스캔 데이터가 존재하면 `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` 및 `version.staticScan`이 포함됩니다.
- 호출자가 소유 게시자를 읽을 수 없는 경우 비공개 패키지는 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

패키지 버전에 대한 명시적 아티팩트 리졸버 메타데이터를 반환합니다.

참고:

- 레거시 패키지 버전은 `legacy-zip` 아티팩트와 레거시 ZIP
  `downloadUrl`을 반환합니다.
- ClawPack 버전은 `npm-pack` 아티팩트, npm 무결성 필드,
  `tarballUrl` 및 레거시 ZIP 호환성 URL을 반환합니다.
- 이는 OpenClaw 리졸버 표면이며, 공유 URL에서 아카이브 형식을 추측하는 것을 방지합니다.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

명시적 리졸버 경로를 통해 버전 아티팩트를 다운로드합니다.

참고:

- ClawPack 버전은 업로드된 정확한 npm-pack `.tgz` 바이트를 스트리밍합니다.
- 레거시 ZIP 버전은 `/api/v1/packages/{name}/download?version=`으로 리디렉션합니다.
- 다운로드 속도 버킷을 사용합니다.

### `GET /api/v1/packages/{name}/readiness`

향후 OpenClaw 소비를 위해 계산된 준비 상태를 반환합니다.

준비 상태 검사는 다음을 포함합니다:

- 공식 채널 상태
- 최신 버전 가용성
- ClawPack npm-pack 아티팩트 가용성
- 아티팩트 다이제스트
- 소스 저장소 및 커밋 출처
- OpenClaw 호환성 메타데이터
- 호스트 대상
- 스캔 상태

응답:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

공식 OpenClaw Plugin 마이그레이션 행을 나열하는 모더레이터 엔드포인트입니다.

인증:

- 모더레이터 또는 관리자 사용자의 API 토큰이 필요합니다.

쿼리 매개변수:

- `phase`(선택 사항): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` 또는
  `all`(기본값).
- `limit`(선택 사항): 정수(1-100)
- `cursor`(선택 사항): 페이지네이션 커서

응답:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

공식 Plugin 마이그레이션 행을 생성하거나 업데이트하는 관리자 엔드포인트입니다.

인증:

- 관리자 사용자의 API 토큰이 필요합니다.

요청 본문:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

참고:

- `bundledPluginId`는 소문자로 정규화되며 안정적인 upsert 키입니다.
- `packageName`은 npm 이름으로 정규화됩니다. 계획된 마이그레이션의 경우 패키지가 없을 수 있습니다.
- 이는 마이그레이션 준비 상태만 추적합니다. OpenClaw를 변경하거나 ClawPack을 생성하지 않습니다.

### `GET /api/v1/packages/moderation/queue`

패키지 릴리스 검토 대기열을 위한 모더레이터/관리자 엔드포인트입니다.

인증:

- 모더레이터 또는 관리자 사용자의 API 토큰이 필요합니다.

쿼리 매개변수:

- `status`(선택 사항): `open`(기본값), `blocked`, `manual` 또는 `all`
- `limit`(선택 사항): 정수(1-100)
- `cursor`(선택 사항): 페이지네이션 커서

상태 의미:

- `open`: 의심됨, 악성, 보류 중, 격리됨, 철회됨 또는 신고된 릴리스입니다.
- `blocked`: 격리됨, 철회됨 또는 악성 릴리스입니다.
- `manual`: 수동 모더레이션 재정의가 있는 모든 릴리스입니다.
- `all`: 수동 재정의, 정상이 아닌 스캔 상태 또는 패키지 신고가 있는 모든 릴리스입니다.

응답:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

모더레이터 검토를 위해 패키지를 신고합니다. 신고는 패키지 수준이며, 선택적으로 버전에 연결됩니다. 신고는 모더레이션 대기열에 반영되지만 그 자체로 다운로드를 자동 숨김 처리하거나 차단하지는 않습니다. 모더레이터는 릴리스 모더레이션을 사용하여 아티팩트를 승인, 격리 또는 철회해야 합니다.

인증:

- API 토큰이 필요합니다.

요청:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

응답:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

패키지 신고 접수를 위한 모더레이터/관리자 엔드포인트입니다.

인증:

- 모더레이터 또는 관리자 사용자의 API 토큰이 필요합니다.

쿼리 매개변수:

- `status`(선택 사항): `open`(기본값), `confirmed`, `dismissed` 또는 `all`
- `limit`(선택 사항): 정수(1-100)
- `cursor`(선택 사항): 페이지네이션 커서

응답:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

패키지 모더레이션 가시성을 위한 소유자/모더레이터 엔드포인트입니다.

인증:

- 패키지 소유자, 게시자 멤버, 모더레이터 또는 관리자 사용자의 API 토큰이 필요합니다.

응답:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

패키지 신고를 해결하거나 다시 여는 모더레이터/관리자 엔드포인트입니다.

요청:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note`는 `confirmed` 및 `dismissed`에 필요합니다. `status`를 다시 `open`으로 설정할 때는 생략할 수 있습니다. 확인된 보고서에 `finalAction: "quarantine"` 또는 `finalAction: "revoke"`를 함께 전달하면 동일한 감사 가능한 워크플로에서 릴리스 조정을 적용할 수 있습니다.

응답:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

패키지 릴리스 검토를 위한 중재자/관리자 엔드포인트입니다.

요청:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

지원되는 상태:

- `approved`: 수동으로 검토되어 허용됨.
- `quarantined`: 후속 조치가 있을 때까지 차단됨.
- `revoked`: 이전에 신뢰된 릴리스가 차단됨.

격리되거나 취소된 릴리스는 아티팩트 다운로드 라우트에서 `403`을 반환합니다.
모든 변경 사항은 감사 로그 항목을 기록합니다.

### `POST /api/v1/packages/backfill/artifacts`

이전 패키지 릴리스에 명시적인 아티팩트 종류 메타데이터를 레이블링하기 위한 관리자 전용 유지 관리 엔드포인트입니다.

요청 본문:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

응답:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

참고:

- 기본값은 드라이 런입니다.
- ClawPack 스토리지가 없는 릴리스는 `legacy-zip`으로 레이블링됩니다.
- `artifactKind`가 누락된 기존 ClawPack 기반 행은 `npm-pack`으로 복구됩니다.
- 이는 ClawPack을 생성하거나 아티팩트 바이트를 변경하지 않습니다.

### `GET /api/v1/packages/{name}/file`

패키지 파일의 원시 텍스트 콘텐츠를 반환합니다.

쿼리 매개변수:

- `path`(필수)
- `version`(선택 사항)
- `tag`(선택 사항)

참고:

- 기본값은 최신 릴리스입니다.
- 다운로드 버킷이 아니라 읽기 속도 버킷을 사용합니다.
- 바이너리 파일은 `415`를 반환합니다.
- 파일 크기 제한: 200KB.
- 대기 중인 VirusTotal 스캔은 읽기를 차단하지 않습니다. 악성 릴리스는 다른 곳에서 계속 보류될 수 있습니다.
- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/download`

패키지 릴리스에 대한 레거시 결정적 ZIP 아카이브를 다운로드합니다.

쿼리 매개변수:

- `version`(선택 사항)
- `tag`(선택 사항)

참고:

- 기본값은 최신 릴리스입니다.
- Skills는 `GET /api/v1/download`로 리디렉션됩니다.
- Plugin/패키지 아카이브는 이전 OpenClaw 클라이언트가 계속 작동하도록 `package/` 루트를 포함하는 zip 파일입니다.
- 이 라우트는 ZIP 전용으로 유지됩니다. ClawPack `.tgz` 파일을 스트리밍하지 않습니다.
- 응답에는 리졸버 무결성 검사를 위한 `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, `X-ClawHub-Artifact-Sha256` 헤더가 포함됩니다.
- 레지스트리 전용 메타데이터는 다운로드된 아카이브에 주입되지 않습니다.
- 대기 중인 VirusTotal 스캔은 다운로드를 차단하지 않습니다. 악성 릴리스는 `403`을 반환합니다.
- 비공개 패키지는 호출자가 소유자가 아닌 한 `404`를 반환합니다.

### `GET /api/npm/{package}`

ClawPack 기반 패키지 버전에 대한 npm 호환 packument를 반환합니다.

참고:

- 업로드된 ClawPack npm-pack tarball이 있는 버전만 나열됩니다.
- 레거시 ZIP 전용 버전은 의도적으로 생략됩니다.
- `dist.tarball`, `dist.integrity`, `dist.shasum`은 사용자가 선택할 경우 npm이 미러를 가리키도록 할 수 있게 npm 호환 필드를 사용합니다.
- 범위 지정 패키지 packument는 `/api/npm/@scope/name`과 npm의 인코딩된 `/api/npm/@scope%2Fname` 요청 경로를 모두 지원합니다.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm 미러 클라이언트를 위해 업로드된 정확한 ClawPack tarball 바이트를 스트리밍합니다.

참고:

- 다운로드 속도 버킷을 사용합니다.
- 다운로드 헤더에는 ClawHub SHA-256과 npm 무결성/shasum 메타데이터가 포함됩니다.
- 조정 및 비공개 패키지 액세스 검사는 계속 적용됩니다.

### `GET /api/v1/resolve`

CLI가 로컬 지문을 알려진 버전에 매핑하는 데 사용됩니다.

쿼리 매개변수:

- `slug`(필수)
- `hash`(필수): 번들 지문의 64자 hex sha256

응답:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

스킬 버전의 zip을 다운로드합니다.

쿼리 매개변수:

- `slug`(필수)
- `version`(선택 사항): semver 문자열
- `tag`(선택 사항): 태그 이름(예: `latest`)

참고:

- `version`과 `tag`가 모두 제공되지 않으면 최신 버전이 사용됩니다.
- 소프트 삭제된 버전은 `410`을 반환합니다.
- 다운로드 통계는 시간당 고유 ID로 집계됩니다(API 토큰이 유효하면 `userId`, 그렇지 않으면 IP).

## 인증 엔드포인트(Bearer 토큰)

모든 엔드포인트에는 다음이 필요합니다.

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

토큰을 검증하고 사용자 핸들을 반환합니다.

### `POST /api/v1/skills`

새 버전을 게시합니다.

- 권장: `payload` JSON + `files[]` blob을 포함한 `multipart/form-data`.
- `files`(storageId 기반)를 포함한 JSON 본문도 허용됩니다.
- 선택적 페이로드 필드: `ownerHandle`. 있는 경우 API는 서버 측에서 해당 게시자를 확인하며, 행위자에게 게시자 액세스 권한이 있어야 합니다.
- 선택적 페이로드 필드: `migrateOwner`. `ownerHandle`과 함께 `true`인 경우, 행위자가 현재 게시자와 대상 게시자 모두에서 관리자/소유자이면 기존 스킬을 해당 소유자로 이동할 수 있습니다. 이 명시적 동의가 없으면 소유자 변경은 거부됩니다.

### `POST /api/v1/packages`

code-plugin 또는 bundle-plugin 릴리스를 게시합니다.

- Bearer 토큰 인증이 필요합니다.
- 권장: `payload` JSON + `files[]` blob을 포함한 `multipart/form-data`.
- `files`(storageId 기반)를 포함한 JSON 본문도 허용됩니다.
- 선택적 페이로드 필드: `ownerHandle`. 있는 경우 관리자만 해당 소유자를 대신하여 게시할 수 있습니다.

검증 주요 사항:

- `family`는 `code-plugin` 또는 `bundle-plugin`이어야 합니다.
- Plugin 패키지에는 `openclaw.plugin.json`이 필요합니다. ClawPack `.tgz` 업로드에는 `package/openclaw.plugin.json` 위치에 포함되어야 합니다.
- 코드 Plugin에는 `package.json`, 소스 저장소 메타데이터, 소스 커밋 메타데이터, 구성 스키마 메타데이터, `openclaw.compat.pluginApi`, `openclaw.build.openclawVersion`이 필요합니다.
- `openclaw.hostTargets` 및 `openclaw.environment`는 선택적 메타데이터입니다.
- 신뢰할 수 있는 게시자만 `official` 채널에 게시할 수 있습니다.
- 대리 게시도 공식 채널 자격을 대상 소유자 계정 기준으로 검증합니다.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

스킬을 소프트 삭제/복원합니다(소유자, 중재자 또는 관리자).

선택적 JSON 본문:

```json
{ "reason": "Held for moderation pending legal review." }
```

있는 경우 `reason`은 스킬 조정 메모로 저장되고 감사 로그에 복사됩니다.
소유자가 시작한 소프트 삭제는 슬러그를 30일 동안 예약하며, 이후 다른 게시자가 해당 슬러그를 사용할 수 있습니다.
이 만료가 적용되는 경우 삭제 응답에는 `slugReservedUntil`이 포함됩니다.
중재자/관리자 숨김 및 보안 제거는 이 방식으로 만료되지 않습니다.

삭제 응답:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

상태 코드:

- `200`: 정상
- `401`: 인증되지 않음
- `403`: 금지됨
- `404`: 스킬/사용자를 찾을 수 없음
- `500`: 내부 서버 오류

### `POST /api/v1/users/publisher`

관리자 전용입니다. 핸들에 대한 조직 게시자가 존재하도록 보장합니다. 핸들이 여전히 레거시 공유 사용자/개인 게시자를 가리키는 경우 엔드포인트는 먼저 이를 조직 게시자로 마이그레이션합니다.

- 본문: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 응답: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

관리자 전용입니다. 릴리스를 게시하지 않고 정당한 소유자를 위해 루트 슬러그와 패키지 이름을 예약합니다. 패키지 이름은 릴리스 행이 없는 비공개 플레이스홀더 패키지가 되므로, 같은 소유자는 나중에 실제 code-plugin 또는 bundle-plugin 릴리스를 해당 이름으로 게시할 수 있습니다.

- 본문: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 응답: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 소유자 슬러그 관리 엔드포인트

- `POST /api/v1/skills/{slug}/rename`
  - 본문: `{ "newSlug": "new-canonical-slug" }`
  - 응답: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 본문: `{ "targetSlug": "canonical-target-slug" }`
  - 응답: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

참고:

- 두 엔드포인트 모두 API 토큰 인증이 필요하며 스킬 소유자에게만 작동합니다.
- `rename`은 이전 슬러그를 리디렉션 별칭으로 보존합니다.
- `merge`는 소스 목록을 숨기고 소스 슬러그를 대상 목록으로 리디렉션합니다.

### 소유권 이전 엔드포인트

- `POST /api/v1/skills/{slug}/transfer`
  - 본문: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - 응답: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 응답(수락/거부/취소): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 응답 형태: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

사용자를 차단하고 소유한 스킬을 하드 삭제합니다(중재자/관리자만).

본문:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

또는

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

응답:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

사용자 차단을 해제하고 적격 스킬을 복원합니다(관리자만).

본문:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

또는

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

응답:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

사용자 역할을 변경합니다(관리자만).

본문:

```json
{ "handle": "user_handle", "role": "moderator" }
```

또는

```json
{ "userId": "users_...", "role": "admin" }
```

응답:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

사용자를 나열하거나 검색합니다(관리자만).

쿼리 매개변수:

- `q`(선택 사항): 검색 쿼리
- `query`(선택 사항): `q`의 별칭
- `limit`(선택 사항): 최대 결과 수(기본값 20, 최대 200)

응답:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

별표(하이라이트)를 추가/제거합니다. 두 엔드포인트 모두 멱등적입니다.

응답:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 레거시 CLI 엔드포인트(사용 중단됨)

이전 CLI 버전에서도 계속 지원됩니다.

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

제거 계획은 `DEPRECATIONS.md`를 참조하세요.

## 레지스트리 검색(`/.well-known/clawhub.json`)

CLI는 사이트에서 레지스트리/인증 설정을 검색할 수 있습니다.

- `/.well-known/clawhub.json`(JSON, 권장)
- `/.well-known/clawdhub.json`(레거시)

스키마:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

자체 호스팅하는 경우 이 파일을 제공하세요(또는 `CLAWHUB_REGISTRY`를 명시적으로 설정하세요. 레거시 `CLAWDHUB_REGISTRY`).
