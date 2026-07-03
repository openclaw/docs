---
read_when:
    - 엔드포인트 추가/변경
    - CLI ↔ 레지스트리 요청 디버깅
summary: HTTP API 참조(공개 + CLI 엔드포인트 + 인증).
x-i18n:
    generated_at: "2026-07-03T09:27:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

기본 URL: `https://clawhub.ai`(기본값).

모든 v1 경로는 `/api/v1/...` 아래에 있습니다.
레거시 `/api/...` 및 `/api/cli/...`는 호환성을 위해 유지됩니다(`DEPRECATIONS.md` 참조).
OpenAPI: `/api/v1/openapi.json`.

## 공개 카탈로그 재사용

타사 디렉터리는 공개 읽기 엔드포인트를 사용하여 ClawHub Skills를 나열하거나 검색할 수 있습니다. 결과를 캐시하고, `429`/`Retry-After`를 준수하며, 사용자를 정식 ClawHub 목록(`https://clawhub.ai/<owner>/skills/<slug>`)으로 다시 연결하고, ClawHub가 타사 사이트를 보증한다는 인상을 주지 마세요. 공개 API 표면 외부에서 숨김, 비공개 또는 조정으로 차단된 콘텐츠를 미러링하려고 시도하지 마세요.

웹 슬러그 바로 가기는 레지스트리 패밀리 전체에서 해석되지만, API 클라이언트는 라우트 우선순위를 재구성하는 대신 읽기 엔드포인트가 반환하는 정식 URL을 사용해야 합니다.

## 속도 제한

적용 모델:

- 익명 요청: IP별로 적용됩니다.
- 인증된 요청(유효한 Bearer 토큰): 사용자 버킷별로 적용됩니다.
- 토큰이 없거나 유효하지 않으면 동작은 IP 적용으로 폴백합니다.
- 인증된 쓰기 엔드포인트는 서버가 이유를 알고 있을 때 단순한 `Unauthorized`만 반환해서는 안 됩니다. 누락된 토큰, 유효하지 않거나 폐기된 토큰, 삭제/차단/비활성화된 계정은 각각 실행 가능한 텍스트를 받아야 CLI 클라이언트가 사용자에게 무엇이 차단했는지 알려줄 수 있습니다.

- 읽기: IP당 3000/분, 키당 12000/분
- 쓰기: IP당 300/분, 키당 3000/분
- 다운로드: IP당 1200/분, 키당 6000/분(다운로드 엔드포인트)

헤더:

- 레거시 호환성: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- 표준화: `RateLimit-Limit`, `RateLimit-Reset`
- `429`에서: `X-RateLimit-Remaining: 0` 및 `RateLimit-Remaining: 0`
- `429`에서: `Retry-After`

헤더 의미:

- `X-RateLimit-Reset`: 절대 Unix epoch 초
- `RateLimit-Reset`: 재설정까지 남은 초(지연)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 존재할 때 정확한 남은 예산.
  샤딩된 성공 요청은 대략적인 전역 값을 반환하는 대신 이 헤더를 생략합니다.
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

클라이언트 지침:

- `Retry-After`가 있으면 재시도하기 전에 해당 초만큼 대기합니다.
- 동기화된 재시도를 피하려면 지터가 적용된 백오프를 사용합니다.
- `Retry-After`가 없으면 `RateLimit-Reset`으로 폴백합니다(또는 `X-RateLimit-Reset`에서 계산).

IP 소스:

- 배포가 신뢰할 수 있는 전달 헤더를 명시적으로 활성화한 경우에만 `cf-connecting-ip`를 포함한 신뢰할 수 있는 클라이언트 IP 헤더를 사용합니다.
- ClawHub는 에지에서 클라이언트 IP를 식별하기 위해 신뢰할 수 있는 전달 헤더를 사용합니다.
- 신뢰할 수 있는 클라이언트 IP를 사용할 수 없으면 익명 요청은 속도 제한 종류로만 범위가 지정된 폴백 버킷을 사용합니다. 이러한 폴백 버킷에는 호출자가 제공한 경로, 슬러그, 패키지 이름, 버전, 쿼리 문자열 또는 기타 아티팩트 매개변수가 포함되지 않습니다.

## 오류 응답

공개 v1 오류 응답은 `content-type: text/plain; charset=utf-8`인 일반 텍스트입니다.
여기에는 유효성 검사 실패(`400`), 누락된 공개 리소스(`404`), 인증 및 권한 실패(`401`/`403`), 속도 제한(`429`), 차단된 다운로드가 포함됩니다. 클라이언트는 응답 본문을 사람이 읽을 수 있는 문자열로 읽어야 합니다. 알 수 없는 쿼리 매개변수는 호환성을 위해 무시되지만, 인식된 쿼리 매개변수에 유효하지 않은 값이 있으면 `400`을 반환합니다.

## 공개 엔드포인트(인증 없음)

### `GET /api/v1/search`

쿼리 매개변수:

- `q`(필수): 쿼리 문자열
- `limit`(선택): 정수
- `highlightedOnly`(선택): 강조 표시된 Skills로 필터링하려면 `true`
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

참고:

- 결과는 관련성 순서로 반환됩니다(임베딩 유사도 + 정확한 슬러그/이름 토큰 부스트 + 작은 인기 사전값).
- 관련성은 인기보다 더 강합니다. 정확한 슬러그 또는 표시 이름 토큰 일치는 참여도가 훨씬 높은 느슨한 일치보다 높은 순위를 차지할 수 있습니다.
- ASCII 텍스트는 단어 및 구두점 경계에서 토큰화됩니다. 예를 들어 `personal-map`에는 독립형 `map` 토큰이 포함되고, `amap-jsapi-skill`에는 `amap`, `jsapi`, `skill`이 포함됩니다. 따라서 `map`을 검색하면 `amap-jsapi-skill`보다 `personal-map`에 더 강한 어휘 일치가 부여됩니다.
- 인기는 로그 스케일로 조정되고 상한이 적용됩니다. 참여도가 높은 Skills도 쿼리 텍스트 일치가 약하면 더 낮은 순위가 될 수 있습니다.
- 의심스럽거나 숨겨진 조정 상태는 호출자 필터와 현재 조정 상태에 따라 공개 검색에서 Skill을 제거할 수 있습니다.

게시자 검색 가능성 지침:

- 사용자가 실제로 검색할 용어를 표시 이름, 요약, 태그에 넣으세요. 독립형 슬러그 토큰은 유지하려는 안정적인 정체성이기도 할 때만 사용하세요.
- 새 슬러그가 더 나은 장기 정식 이름이 아닌 한, 특정 쿼리 하나를 쫓기 위해 슬러그를 바꾸지 마세요. 이전 슬러그는 리디렉션 별칭이 되지만 정식 URL, 표시되는 슬러그, 향후 검색 다이제스트는 새 슬러그를 사용합니다.
- 이름 변경 별칭은 레지스트리를 통해 해석되는 이전 URL 및 설치의 해석을 보존하지만, 검색 순위는 이름 변경이 인덱싱된 후의 정식 Skill 메타데이터를 기준으로 합니다. 기존 통계는 Skill에 유지됩니다.
- Skill이 예기치 않게 보이지 않으면 순위 관련 메타데이터를 변경하기 전에 로그인한 상태에서 `clawhub inspect @owner/slug`로 먼저 조정 상태를 확인하세요.

### `GET /api/v1/skills`

쿼리 매개변수:

- `limit`(선택): 정수(1–200)
- `cursor`(선택): `trending`이 아닌 모든 정렬에 대한 페이지네이션 커서
- `sort`(선택): `updated`(기본값), `recommended`(별칭: `default`), `createdAt`(별칭: `newest`), `downloads`, `stars`(별칭: `rating`), 레거시 설치 별칭 `installsCurrent`/`installs`/`installsAllTime`은 `downloads`에 매핑됨, `trending`
- `nonSuspiciousOnly`(선택): 의심스러운(`flagged.suspicious`) Skills를 숨기려면 `true`
- `nonSuspicious`(선택): `nonSuspiciousOnly`의 레거시 별칭

유효하지 않은 `sort` 값은 `400`을 반환합니다.

참고:

- `recommended`는 참여도 및 최신성 신호를 사용합니다.
- `trending`은 최근 7일간의 설치 수(텔레메트리 기반)로 순위를 매깁니다.
- `createdAt`은 새 Skill 크롤링에 안정적이며, `updated`는 기존 Skills가 다시 게시될 때 변경됩니다.
- `nonSuspiciousOnly=true`일 때 커서 기반 정렬은 페이지 검색 후 의심스러운 Skills가 필터링되므로 한 페이지에 `limit`보다 적은 항목을 반환할 수 있습니다.
- 존재하는 경우 페이지네이션을 계속하려면 `nextCursor`를 사용하세요. 짧은 페이지 자체가 결과의 끝을 의미하지는 않습니다.

응답:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- 소유자 이름 변경/병합 흐름으로 생성된 이전 슬러그는 정식 Skill로 해석됩니다.
- `metadata.os`: Skill frontmatter에 선언된 OS 제한(예: `["macos"]`, `["linux"]`). 선언되지 않은 경우 `null`.
- `metadata.systems`: Nix 시스템 대상(예: `["aarch64-darwin", "x86_64-linux"]`). 선언되지 않은 경우 `null`.
- Skill에 플랫폼 메타데이터가 없으면 `metadata`는 `null`입니다.
- `moderation`은 Skill이 플래그 지정되었거나 소유자가 보고 있을 때만 포함됩니다.

### `GET /api/v1/skills/{slug}/moderation`

구조화된 조정 상태를 반환합니다.

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

- 소유자와 조정자는 숨겨진 Skills의 조정 세부 정보에 접근할 수 있습니다.
- 공개 호출자는 이미 플래그 지정된 표시 가능한 Skills에 대해서만 `200`을 받습니다.
- 증거는 공개 호출자에게 편집되어 제공되며, 원시 스니펫은 소유자/조정자에게만 포함됩니다.

### `POST /api/v1/skills/{slug}/report`

조정자 검토를 위해 Skill을 신고합니다. 신고는 Skill 수준이며, 선택적으로 버전에 연결되고 Skill 신고 대기열로 전달됩니다.

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

Skill 신고 접수를 위한 조정자/관리자 엔드포인트입니다.

쿼리 매개변수:

- `status`(선택): `open`(기본값), `confirmed`, `dismissed` 또는 `all`
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

Skill 신고를 해결하거나 다시 열기 위한 조정자/관리자 엔드포인트입니다.

요청:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` 및 `dismissed`에는 `note`가 필요합니다. `status`를 다시 `open`으로 설정할 때는 생략할 수 있습니다. 감사 가능한 동일한 워크플로에서 Skill을 숨기려면 분류된 신고와 함께 `finalAction: "hide"`를 전달하세요.

### `GET /api/v1/skills/{slug}/versions`

쿼리 매개변수:

- `limit`(선택): 정수
- `cursor`(선택): 페이지네이션 커서

### `GET /api/v1/skills/{slug}/versions/{version}`

버전 메타데이터 + 파일 목록을 반환합니다.

- `version.security`는 사용 가능한 경우 정규화된 스캔 검증 상태와 스캐너 세부 정보(VirusTotal + LLM)를 포함합니다.

### `GET /api/v1/skills/{slug}/scan`

Skill 버전에 대한 보안 스캔 검증 세부 정보를 반환합니다.

쿼리 매개변수:

- `version`(선택): 특정 버전 문자열.
- `tag`(선택): 태그된 버전(예: `latest`)을 해석합니다.

참고:

- `version`과 `tag`가 모두 제공되지 않으면 최신 버전을 사용합니다.
- 정규화된 검증 상태와 스캐너별 세부 정보를 포함합니다.
- `security.hasScanResult`는 스캐너가 확정적인 판정(`clean`, `suspicious` 또는 `malicious`)을 생성한 경우에만 `true`입니다.
- `moderation`은 최신 버전에서 파생된 현재 skill 수준의 moderation 스냅샷입니다.
- 과거 버전을 쿼리할 때는 `moderation`과 `security`를 동일한 버전 컨텍스트로 취급하기 전에 `moderation.matchesRequestedVersion`과 `moderation.sourceVersion`을 확인하세요.

### `POST /api/v1/skills/-/scan`

새 ClawScan 작업을 위한 인증된 제출 엔드포인트입니다.

로컬 업로드 스캔은 더 이상 지원되지 않습니다. `multipart/form-data` 또는 `{ "source": { "kind": "upload" } }`를 사용하는 요청은 `410`을 반환합니다.

게시된 스캔은 JSON을 사용합니다.

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

참고:

- 스캔 요청 페이로드와 다운로드 가능한 보고서는 보존 기간이 지나면 스캔 요청 저장소에서 만료됩니다.
- 게시된 스캔에는 소유자/게시자 관리 접근 권한 또는 플랫폼 moderator/admin 권한이 필요합니다.
- 게시된 스캔은 `update: true`이고 스캔이 성공적으로 완료된 경우에만 다시 기록합니다.
- 응답은 `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`와 함께 `202`입니다.
- 스캔 작업은 비동기입니다. 수동 스캔 요청은 일반 publish/backfill 작업보다 우선 처리되지만, 완료는 여전히 worker 가용성에 따라 달라집니다.

### `GET /api/v1/skills/-/scan/{scanId}`

제출된 스캔을 위한 인증된 폴링 엔드포인트입니다.

- queued/running/succeeded/failed 상태를 반환합니다.
- 대기 중일 때 `queue.queuedAhead`와 `queue.position`을 반환하므로 클라이언트가 요청 앞에 우선순위가 지정된 수동 스캔이 몇 개 있는지 표시할 수 있습니다. 매우 큰 큐는 제한되며 `queuedAheadIsEstimate: true`로 보고됩니다.
- 사용 가능한 경우 `report`에는 `clawscan`, `skillspector`, `staticAnalysis`, `virustotal` 섹션이 포함됩니다.
- 실패한 스캔 작업은 `lastError`와 함께 `status: "failed"`를 반환합니다.

### `GET /api/v1/skills/-/scan/{scanId}/download`

인증된 보고서 아카이브 엔드포인트입니다.

- 성공한 스캔이 필요합니다. 종료되지 않은 스캔은 `409`를 반환합니다.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, `README.md`가 포함된 ZIP을 반환합니다.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

제출된 버전을 위한 인증된 저장 보고서 아카이브 엔드포인트입니다.

- skill 또는 plugin에 대한 소유자/게시자 관리 접근 권한 또는 플랫폼 moderator/admin 권한이 필요합니다.
- 차단되거나 숨겨진 버전을 포함하여 정확히 제출된 버전의 저장된 스캔 결과를 반환합니다.
- `kind`의 기본값은 `skill`입니다. plugin/package 스캔에는 `kind=plugin`을 사용하세요.
- 스캔 요청 다운로드와 동일한 ZIP 형태를 반환합니다.

### `POST /api/v1/skills/-/scan/batch`

admin 전용 표준 배치 재스캔 라우트입니다. 레거시 `POST /api/v1/skills/-/rescan-batch`와 동일한 페이로드 형태를 허용합니다.

### `POST /api/v1/skills/-/scan/batch/status`

admin 전용 표준 배치 상태 라우트입니다. `{ "jobIds": ["..."] }`를 허용하고 레거시 `POST /api/v1/skills/-/rescan-batch/status`와 동일한 집계 카운터를 반환합니다.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify`에서 사용하는 Skill Card 검증 envelope을 반환합니다.

쿼리 매개변수:

- `version`(선택 사항): 특정 버전 문자열입니다.
- `tag`(선택 사항): 태그가 지정된 버전을 해석합니다(예: `latest`).

참고:

- `ok`는 선택된 버전에 생성된 Skill Card가 있고, moderation에 의해 malware 차단되지 않았으며, ClawScan 검증이 clean인 경우에만 `true`입니다.
- skill ID, 게시자 ID 및 선택된 버전 메타데이터는 최상위 envelope 필드(`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`)이므로 shell 자동화가 중첩된 wrapper를 풀지 않고 읽을 수 있습니다.
- `security`는 최상위 ClawScan/security 판정입니다. 자동화는 `ok`, `decision`, `reasons`, `security.status`를 기준으로 삼아야 합니다.
- `security.signals`에는 `staticScan`, `virusTotal`, `skillSpector`와 같은 지원 스캐너 증거가 포함됩니다.
- `security.signals.dependencyRegistry`는 v1 응답 호환성을 위해 유지되지만, dependency registry 존재 스캐너는 폐기되었으며 이 키는 항상 `null`입니다.
- `provenance`는 ClawHub가 publish 또는 import 중에 GitHub repo/ref/commit/path를 해석하고 저장한 경우에만 `server-resolved-github-import`이며, 그 외에는 `unavailable`입니다.

### `POST /api/v1/skills/-/security-verdicts`

정확한 skill 버전에 대한 현재 compact security 판정을 반환합니다. 이 collection 엔드포인트는 OpenClaw Control UI처럼 표시해야 할 설치된 ClawHub skill 버전을 이미 알고 있는 클라이언트를 위한 것입니다.

요청:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

참고:

- `items`에는 고유한 `{ slug, version }` 쌍이 1-100개 포함되어야 합니다.
- 결과는 항목별입니다. 하나의 누락된 skill 또는 버전이 전체 응답을 실패시키지는 않습니다.
- 응답은 security 전용입니다. Skill Card 데이터, 생성된 card 상태, artifact 파일 목록 또는 자세한 스캐너 페이로드는 포함하지 않습니다.
- `security.signals`에는 상태 수준의 지원 증거만 포함됩니다. 전체 스캐너 세부 정보가 필요하면 `/scan` 또는 ClawHub security-audit 페이지를 사용하세요.
- `security.signals.dependencyRegistry`는 v1 응답 호환성을 위해 유지되지만, dependency registry 존재 스캐너는 폐기되었으며 이 키는 항상 `null`입니다.
- Skill Card 부재는 이 엔드포인트의 `ok`, `decision` 또는 `reasons`에 영향을 주지 않습니다. 클라이언트는 card 콘텐츠가 필요할 때 설치된 `skill-card.md`를 로컬에서 읽어야 합니다.
- 단일 skill Skill Card 검증 envelope이 필요하면 `/verify`를, 생성된 card Markdown이 필요하면 `/card`를, 자세한 스캐너 데이터가 필요하면 `/scan`을 사용하세요.

응답:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

원시 텍스트 콘텐츠를 반환합니다.

쿼리 매개변수:

- `path` (필수)
- `version` (선택 사항)
- `tag` (선택 사항)

참고:

- 기본값은 최신 버전입니다.
- 파일 크기 제한: 200KB.

### `GET /api/v1/packages`

다음 항목을 위한 통합 카탈로그 엔드포인트:

- Skills
- 코드 Plugin
- 번들 Plugin

쿼리 매개변수:

- `limit` (선택 사항): 정수 (1–100)
- `cursor` (선택 사항): 페이지 매김 커서
- `family` (선택 사항): `skill`, `code-plugin` 또는 `bundle-plugin`
- `channel` (선택 사항): `official`, `community` 또는 `private`
- `isOfficial` (선택 사항): `true` 또는 `false`
- `sort` (선택 사항): `updated`(기본값), `recommended`, `trending`, `downloads`, 레거시 별칭 `installs`
- `category` (선택 사항): Plugin 카테고리 필터. 요청 범위가 Plugin 패키지
  (`/api/v1/plugins`, `/api/v1/code-plugins`, `/api/v1/bundle-plugins` 또는
  `family=code-plugin`/`family=bundle-plugin`이 있는 패키지 엔드포인트)로
  제한된 경우에만 지원됩니다. 제어된 카테고리와 레거시 v1 필터 별칭은
  `GET /api/v1/plugins` 아래에 문서화되어 있습니다.

참고:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` 또는 `sort`의 값이 유효하지 않으면 `400`을 반환합니다. 알 수 없는 쿼리 매개변수는 무시됩니다.
- `GET /api/v1/code-plugins` 및 `GET /api/v1/bundle-plugins`는 고정 family 별칭으로 유지됩니다.
- Skill 항목은 계속 Skill 레지스트리를 기반으로 하며, 여전히 `POST /api/v1/skills`를 통해서만 게시할 수 있습니다.
- `POST /api/v1/packages`는 여전히 code-plugin 및 bundle-plugin 릴리스 전용입니다.
- 익명 호출자는 공개 패키지 채널만 볼 수 있습니다.
- 인증된 호출자는 목록/검색 결과에서 자신이 속한 게시자의 비공개 패키지를 볼 수 있습니다.
- `channel=private`은 인증된 호출자가 읽을 수 있는 패키지만 반환합니다.

### `GET /api/v1/packages/search`

Skills와 Plugin 패키지 전반의 통합 카탈로그 검색입니다.

쿼리 매개변수:

- `q` (필수): 쿼리 문자열
- `limit` (선택 사항): 정수 (1–100)
- `family` (선택 사항): `skill`, `code-plugin` 또는 `bundle-plugin`
- `channel` (선택 사항): `official`, `community` 또는 `private`
- `isOfficial` (선택 사항): `true` 또는 `false`
- `category` (선택 사항): Plugin 카테고리 필터. 요청 범위가 Plugin
  패키지로 제한된 경우에만 지원됩니다. 제어된 카테고리와 레거시 v1
  필터 별칭은 `GET /api/v1/plugins` 아래에 문서화되어 있습니다.

참고:

- `family`, `channel`, `isOfficial`, `featured` 또는
  `highlightedOnly`의 값이 유효하지 않으면 `400`을 반환합니다. 알 수 없는 쿼리 매개변수는 무시됩니다.
- 익명 호출자는 공개 패키지 채널만 볼 수 있습니다.
- 인증된 호출자는 자신이 속한 게시자의 비공개 패키지를 검색할 수 있습니다.
- `channel=private`은 인증된 호출자가 읽을 수 있는 패키지만 반환합니다.

### `GET /api/v1/plugins`

code-plugin 및 bundle-plugin 패키지 전반을 탐색하는 Plugin 전용 카탈로그입니다.

쿼리 매개변수:

- `limit` (선택 사항): 정수 (1-100)
- `cursor` (선택 사항): 페이지 매김 커서
- `isOfficial` (선택 사항): `true` 또는 `false`
- `sort` (선택 사항): `recommended`(기본값), `trending`, `downloads`, `updated`, 레거시 별칭 `installs`
- `category` (선택 사항): Plugin 카테고리 필터. 현재 값:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

레거시 v1 필터 별칭은 읽기 엔드포인트에서 계속 허용됩니다.

- `mcp-tooling`, `data`, `automation`은 `tools`로 해석됩니다.
- `observability`와 `deployment`는 `gateway`로 해석됩니다.
- `dev-tools`는 `runtime`으로 해석됩니다.

`trending`은 7일 설치/다운로드 순위표이며 전체 기간 합계를 사용하지 않습니다.
통합 `/api/v1/packages` 엔드포인트에서는 Plugin 전용입니다. Skill 카탈로그에는
`/api/v1/skills?sort=trending`을 사용하세요.

레거시 별칭은 저장되거나 작성자가 선언한 카테고리 값으로 허용되지 않습니다.

### `GET /api/v1/skills/export`

오프라인 분석을 위한 최신 공개 Skills의 대량 내보내기입니다.

인증:

- API 토큰이 필요합니다.

쿼리 매개변수:

- `startDate` (필수): Skill `updatedAt`의 Unix 밀리초 하한값입니다.
- `endDate` (필수): Skill `updatedAt`의 Unix 밀리초 상한값입니다.
- `limit` (선택 사항): 정수 (1-250), 기본값 `250`.
- `cursor` (선택 사항): 이전 응답의 페이지 매김 커서입니다.

응답:

- 본문: ZIP 아카이브.
- 내보낸 각 Skill은 `{publisher}/{slug}/`를 루트로 합니다.
- 호스팅된 Skills에는 최신 저장 버전 파일이 포함되며
  `_manifest.json`에 `sourceRef: "public-clawhub"`로 나열됩니다.
- 현재 GitHub 기반 Skills 중 `clean` 또는 `suspicious` 스캔이 있는 항목에는
  `sourceRef: "public-github"`, 저장소, 커밋, 경로,
  콘텐츠 해시 및 아카이브 URL이 포함된 `_source_handoff.json`이 포함됩니다. ClawHub 호스팅 소스 파일은 포함되지 않습니다.
- 각 Skill에는 `_export_skill_meta.json`이 포함됩니다.
- `_manifest.json`은 항상 ZIP 루트에 포함됩니다.
- 개별 Skills 또는 파일을 내보낼 수 없는 경우 `_errors.json`이 포함됩니다.

헤더:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

오프라인 분석을 위해 최신 공개 Plugin 릴리스를 대량 내보내기합니다.

인증:

- API 토큰이 필요합니다.

쿼리 매개변수:

- `startDate` (필수): Plugin `updatedAt`의 Unix 밀리초 하한값입니다.
- `endDate` (필수): Plugin `updatedAt`의 Unix 밀리초 상한값입니다.
- `limit` (선택 사항): 정수(1-250), 기본값은 `250`입니다.
- `cursor` (선택 사항): 이전 응답의 페이지네이션 커서입니다.
- `family` (선택 사항): `code-plugin` 또는 `bundle-plugin`입니다. 생략하면 두
  Plugin 패밀리를 모두 의미합니다.

응답:

- 본문: ZIP 아카이브입니다.
- 내보낸 각 Plugin은 `{family}/{packageName}/`에 루트를 둡니다.
- 내보낸 각 Plugin에는 최신 릴리스의 저장된 파일이 포함됩니다.
- Plugin별 내보내기 메타데이터는
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`에 저장됩니다.
- `_manifest.json`은 항상 ZIP 루트에 포함됩니다.
- 개별 Plugin 또는 파일을 내보낼 수 없을 때 `_errors.json`이 포함됩니다.

헤더:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin 및 bundle-plugin 패키지를 대상으로 하는 Plugin 전용 검색입니다.

쿼리 매개변수:

- `q` (필수): 쿼리 문자열
- `limit` (선택 사항): 정수(1-100)
- `isOfficial` (선택 사항): `true` 또는 `false`
- `category` (선택 사항): Plugin 카테고리 필터입니다. 현재 값:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

참고:

- `GET /api/v1/plugins` 아래에 문서화된 레거시 v1 필터 별칭도
  허용됩니다.
- 카테고리 필터링은 Plugin 카테고리 다이제스트 행을 기반으로 하는 실제 API
  필터이며, 검색 쿼리 재작성 방식이 아닙니다.
- 결과는 관련도 순서로 반환되며 현재 페이지네이션을 지원하지 않습니다.
- Plugin 검색의 브라우저 UI 정렬 컨트롤은 로드된 관련도 결과를 재정렬하며,
  현재 `/skills` 탐색 동작과 일치합니다.

### `GET /api/v1/packages/{name}`

패키지 상세 메타데이터를 반환합니다.

참고:

- Skills도 통합 카탈로그에서 이 경로를 통해 확인될 수 있습니다.
- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.

### `DELETE /api/v1/packages/{name}`

패키지와 모든 릴리스를 소프트 삭제합니다.

참고:

- 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 중재자 또는 플랫폼 관리자의 API 토큰이 필요합니다.

### `GET /api/v1/packages/{name}/versions`

버전 기록을 반환합니다.

쿼리 매개변수:

- `limit` (선택 사항): 정수(1–100)
- `cursor` (선택 사항): 페이지네이션 커서

참고:

- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/versions/{version}`

파일 메타데이터, 호환성, 검증, 아티팩트 메타데이터, 스캔 데이터를 포함한 패키지 버전 하나를 반환합니다.

참고:

- `version.artifact.kind`는 이전 방식의 패키지 아카이브의 경우 `legacy-zip`,
  ClawPack 기반 릴리스의 경우 `npm-pack`입니다.
- ClawPack 릴리스에는 npm 호환 `npmIntegrity`, `npmShasum`,
  `npmTarballName` 필드가 포함됩니다.
- `version.sha256hash`는 이전 클라이언트를 위한 사용 중단된 호환성 메타데이터입니다. 이는
  `/api/v1/packages/{name}/download`가 반환하는 정확한 ZIP 바이트를 해시합니다.
  최신 클라이언트는 정식 릴리스 아티팩트를 식별하는 `version.artifact.sha256`을
  사용해야 합니다.
- 스캔 데이터가 있으면 `version.vtAnalysis`, `version.llmAnalysis`,
  `version.staticScan`이 포함됩니다.
- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/versions/{version}/security`

설치 클라이언트를 위한 정확한 패키지 릴리스 보안 및 신뢰 요약을 반환합니다. 이는
확인된 릴리스를 설치할 수 있는지 결정하기 위한 공개 OpenClaw 소비 표면입니다.

인증:

- 공개 읽기 엔드포인트입니다. 소유자, 게시자, 중재자 또는 관리자 토큰이
  필요하지 않습니다.

응답:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

응답 필드:

- `package.name`, `package.displayName`, `package.family`은 확인된
  레지스트리 패키지를 식별합니다.
- `release.releaseId`, `release.version`, `release.createdAt`은 평가된
  정확한 릴리스를 식별합니다.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, `release.npmTarballName`은 릴리스 아티팩트에 대해
  알려진 경우 제공됩니다.
- `trust.scanStatus`는 스캐너 입력 및 수동 릴리스 중재에서 파생된 유효 신뢰 상태입니다.
- `trust.moderationState`는 null일 수 있습니다. 수동 릴리스 중재가 없으면
  `null`입니다.
- `trust.blockedFromDownload`는 설치 차단 신호입니다. OpenClaw 및 기타
  설치 클라이언트는 스캐너 또는 중재 필드에서 차단 규칙을 다시 도출하는 대신
  이 값이 `true`이면 설치를 차단해야 합니다.
- `trust.reasons`는 사용자 표시 및 감사 설명 목록입니다. 이유 코드는
  `manual:quarantined`, `scan:malicious`, `package:malicious`와 같은
  안정적이고 간결한 문자열입니다.
- `trust.pending`은 하나 이상의 신뢰 입력이 아직 완료를 기다리고 있음을 의미합니다.
- `trust.stale`은 신뢰 요약이 오래된 입력에서 계산되었으며, 높은 신뢰도의 허용
  결정을 내리기 전에 새로 고침이 필요한 것으로 취급해야 함을 의미합니다.

참고:

- 이 엔드포인트는 버전 정확성을 갖습니다. 클라이언트는 최신 패키지 메타데이터를
  읽은 직후가 아니라, 설치하려는 패키지 버전을 확인한 뒤 호출해야 합니다.
- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.
- 이 엔드포인트는 소유자/중재자 중재 엔드포인트보다 의도적으로 범위가 좁습니다.
  신고자 신원, 신고 본문, 비공개 증거 또는 내부 검토 타임라인이 아니라
  설치 결정과 공개 설명을 노출합니다.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

패키지 버전에 대한 명시적 아티팩트 리졸버 메타데이터를 반환합니다.

참고:

- 레거시 패키지 버전은 `legacy-zip` 아티팩트와 레거시 ZIP
  `downloadUrl`을 반환합니다.
- ClawPack 버전은 `npm-pack` 아티팩트, npm 무결성 필드,
  `tarballUrl`, 레거시 ZIP 호환성 URL을 반환합니다.
- 이는 OpenClaw 리졸버 표면이며, 공유 URL에서 아카이브 형식을 추측하지 않도록 합니다.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

명시적 리졸버 경로를 통해 버전 아티팩트를 다운로드합니다.

참고:

- ClawPack 버전은 업로드된 정확한 npm-pack `.tgz` 바이트를 스트리밍합니다.
- 레거시 ZIP 버전은 `/api/v1/packages/{name}/download?version=`으로 리디렉션합니다.
- 다운로드 속도 버킷을 사용합니다.

### `GET /api/v1/packages/{name}/readiness`

향후 OpenClaw 소비를 위해 계산된 준비 상태를 반환합니다.

준비 상태 검사는 다음을 포함합니다.

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

공식 OpenClaw Plugin 마이그레이션 행을 나열하기 위한 중재자 엔드포인트입니다.

인증:

- 중재자 또는 관리자 사용자의 API 토큰이 필요합니다.

쿼리 매개변수:

- `phase` (선택 사항): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` 또는
  `all`(기본값).
- `limit` (선택 사항): 정수(1-100)
- `cursor` (선택 사항): 페이지네이션 커서

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

공식 Plugin 마이그레이션 행을 생성하거나 업데이트하기 위한 관리자 엔드포인트입니다.

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
- `packageName`은 npm 이름으로 정규화됩니다. 계획된 마이그레이션에서는 패키지가 없을 수 있습니다.
- 이는 마이그레이션 준비 상태만 추적합니다. OpenClaw를 변경하거나
  ClawPack을 생성하지 않습니다.

### `GET /api/v1/packages/moderation/queue`

패키지 릴리스 검토 대기열을 위한 중재자/관리자 엔드포인트입니다.

인증:

- 중재자 또는 관리자 사용자의 API 토큰이 필요합니다.

쿼리 매개변수:

- `status` (선택 사항): `open`(기본값), `blocked`, `manual` 또는 `all`
- `limit` (선택 사항): 정수(1-100)
- `cursor` (선택 사항): 페이지네이션 커서

상태 의미:

- `open`: 의심스러운, 악성, 대기 중, 격리된, 취소된 또는 신고된 릴리스입니다.
- `blocked`: 격리된, 취소된 또는 악성 릴리스입니다.
- `manual`: 수동 중재 재정의가 있는 모든 릴리스입니다.
- `all`: 수동 재정의, clean이 아닌 스캔 상태 또는 패키지 신고가 있는 모든 릴리스입니다.

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

중재자 검토를 위해 패키지를 신고합니다. 신고는 패키지 수준이며, 선택적으로
버전에 연결될 수 있습니다. 이는 중재 대기열에 반영되지만 자체적으로 다운로드를
자동 숨김 처리하거나 차단하지는 않습니다. 중재자는 릴리스 중재를 사용해
아티팩트를 승인, 격리 또는 취소해야 합니다.

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

조정자/관리자용 패키지 신고 접수 엔드포인트입니다.

인증:

- 조정자 또는 관리자 사용자용 API 토큰이 필요합니다.

쿼리 매개변수:

- `status` (선택 사항): `open` (기본값), `confirmed`, `dismissed` 또는 `all`
- `limit` (선택 사항): 정수 (1-100)
- `cursor` (선택 사항): 페이지네이션 커서

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

패키지 조정 가시성을 위한 소유자/조정자 엔드포인트입니다.

인증:

- 패키지 소유자, 게시자 구성원, 조정자 또는 관리자 사용자용 API 토큰이
  필요합니다.

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

패키지 신고를 해결하거나 다시 여는 조정자/관리자 엔드포인트입니다.

요청:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` 및 `dismissed`에는 `note`가 필요합니다. `status`를 다시 `open`으로
설정할 때는 생략할 수 있습니다. 확정된 신고와 함께 `finalAction: "quarantine"` 또는
`finalAction: "revoke"`를 전달하면 동일한 감사 가능한 워크플로에서 릴리스 조정을
적용합니다.

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

패키지 릴리스 검토를 위한 조정자/관리자 엔드포인트입니다.

요청:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

지원되는 상태:

- `approved`: 수동으로 검토되어 허용됨.
- `quarantined`: 후속 조치 대기 중 차단됨.
- `revoked`: 이전에 신뢰된 릴리스가 이후 차단됨.

격리 및 폐기된 릴리스는 아티팩트 다운로드 라우트에서 `403`을 반환합니다.
모든 변경은 감사 로그 항목을 작성합니다.

### `GET /api/v1/packages/{name}/file`

패키지 파일의 원시 텍스트 콘텐츠를 반환합니다.

쿼리 매개변수:

- `path` (필수)
- `version` (선택 사항)
- `tag` (선택 사항)

참고:

- 기본값은 최신 릴리스입니다.
- 다운로드 버킷이 아니라 읽기 속도 버킷을 사용합니다.
- 바이너리 파일은 `415`를 반환합니다.
- 파일 크기 제한: 200KB.
- 대기 중인 VirusTotal 검사는 읽기를 차단하지 않습니다. 악성 릴리스는 다른 곳에서 계속 보류될 수 있습니다.
- 비공개 패키지는 호출자가 소유 게시자를 읽을 수 없는 한 `404`를 반환합니다.

### `GET /api/v1/packages/{name}/download`

패키지 릴리스의 레거시 결정적 ZIP 아카이브를 다운로드합니다.

쿼리 매개변수:

- `version` (선택 사항)
- `tag` (선택 사항)

참고:

- 기본값은 최신 릴리스입니다.
- Skills는 `GET /api/v1/download`로 리디렉션됩니다.
- Plugin/패키지 아카이브는 이전 OpenClaw 클라이언트가 계속 작동하도록
  `package/` 루트가 있는 zip 파일입니다.
- 이 라우트는 ZIP 전용으로 유지됩니다. ClawPack `.tgz` 파일을 스트리밍하지 않습니다.
- 응답에는 리졸버 무결성 검사를 위한 `ETag`, `Digest`, `X-ClawHub-Artifact-Type`,
  `X-ClawHub-Artifact-Sha256` 헤더가 포함됩니다.
- 레지스트리 전용 메타데이터는 다운로드된 아카이브에 삽입되지 않습니다.
- 대기 중인 VirusTotal 검사는 다운로드를 차단하지 않습니다. 악성 릴리스는 `403`을 반환합니다.
- 비공개 패키지는 호출자가 소유자가 아닌 한 `404`를 반환합니다.

### `GET /api/npm/{package}`

ClawPack 기반 패키지 버전에 대한 npm 호환 팩큐먼트를 반환합니다.

참고:

- 업로드된 ClawPack npm-pack tarball이 있는 버전만 나열됩니다.
- 레거시 ZIP 전용 버전은 의도적으로 생략됩니다.
- `dist.tarball`, `dist.integrity`, `dist.shasum`은 사용자가 원할 경우 npm이 미러를
  가리키도록 할 수 있게 npm 호환 필드를 사용합니다.
- 범위 지정 패키지 팩큐먼트는 `/api/npm/@scope/name`과 npm의 인코딩된
  `/api/npm/@scope%2Fname` 요청 경로를 모두 지원합니다.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm 미러 클라이언트를 위해 업로드된 정확한 ClawPack tarball 바이트를 스트리밍합니다.

참고:

- 다운로드 속도 버킷을 사용합니다.
- 다운로드 헤더에는 ClawHub SHA-256과 npm 무결성/shasum 메타데이터가 포함됩니다.
- 조정 및 비공개 패키지 접근 검사도 계속 적용됩니다.

### `GET /api/v1/resolve`

CLI가 로컬 지문을 알려진 버전에 매핑하는 데 사용합니다.

쿼리 매개변수:

- `slug` (필수)
- `hash` (필수): 번들 지문의 64자 16진수 sha256

응답:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

호스팅된 Skills 버전 ZIP을 다운로드하거나, 현재 GitHub 기반 Skills에 `clean` 또는
`suspicious` 검사가 있고 호스팅된 버전이 없는 경우 GitHub 소스 인계를 반환합니다.

쿼리 매개변수:

- `slug` (필수)
- `version` (선택 사항): semver 문자열
- `tag` (선택 사항): 태그 이름 (예: `latest`)

참고:

- `version`과 `tag`가 모두 제공되지 않으면 최신 버전이 사용됩니다.
- 소프트 삭제된 버전은 `410`을 반환합니다.
- GitHub 기반 Skills 인계는 바이트를 프록시하거나 미러링하지 않습니다. JSON 응답에는
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  `archiveUrl`이 포함됩니다. 검사/현재 상태는 게이트이며 성공 페이로드 메타데이터로
  포함되지 않습니다.
- 다운로드 통계는 UTC 날짜별 고유 ID로 계산됩니다(API 토큰이 유효하면 `userId`, 그렇지 않으면 IP).

## 인증 엔드포인트 (Bearer 토큰)

모든 엔드포인트에는 다음이 필요합니다.

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

토큰을 검증하고 사용자 핸들을 반환합니다.

### `POST /api/v1/skills`

새 버전을 게시합니다.

- 권장: `payload` JSON + `files[]` blob이 포함된 `multipart/form-data`.
- `files`가 있는 JSON 본문(storageId 기반)도 허용됩니다.
- 선택적 페이로드 필드: `ownerHandle`. 있으면 API가 서버 측에서 해당 게시자를 확인하며
  행위자에게 게시자 접근 권한이 있어야 합니다.
- 선택적 페이로드 필드: `migrateOwner`. `ownerHandle`과 함께 `true`이면 행위자가 현재 및
  대상 게시자 모두에서 관리자/소유자인 경우 기존 Skills가 해당 소유자로 이동할 수 있습니다.
  이 옵트인이 없으면 소유자 변경은 거부됩니다.

### `POST /api/v1/packages`

code-plugin 또는 bundle-plugin 릴리스를 게시합니다.

- Bearer 토큰 인증이 필요합니다.
- `multipart/form-data`가 필요합니다.
- 허용되는 양식 필드는 `payload`, 반복되는 `files` blob, 또는 하나의 `clawpack`
  tarball 참조입니다. `clawpack`은 `.tgz` blob이거나 upload-url 흐름에서 반환된
  스토리지 ID일 수 있습니다. 스테이징된 스토리지 ID 게시는 해당 업로드 URL과 함께 반환된
  `clawpackUploadTicket`도 포함해야 합니다.
- 동일한 요청에서 `files` 또는 `clawpack` 중 하나만 사용하고 둘 다 사용하지 마세요.
- JSON 본문과 호출자가 제공한 `payload.files` / `payload.artifact`
  메타데이터는 거부됩니다.
- 직접 multipart 게시 요청은 18MB로 제한됩니다. ClawPack tarball은 upload-url 흐름을
  사용해 120MB tarball 한도까지 사용할 수 있습니다.
- 선택적 페이로드 필드: `ownerHandle`. 있으면 관리자만 해당 소유자를 대신해 게시할 수 있습니다.

검증 주요 사항:

- `family`는 `code-plugin` 또는 `bundle-plugin`이어야 합니다.
- Plugin 패키지에는 `openclaw.plugin.json`이 필요합니다. ClawPack `.tgz` 업로드에는
  `package/openclaw.plugin.json` 위치에 이 파일이 포함되어야 합니다.
- 코드 Plugin에는 `package.json`, 소스 저장소 메타데이터, 소스 커밋
  메타데이터, 구성 스키마 메타데이터, `openclaw.compat.pluginApi`,
  `openclaw.build.openclawVersion`이 필요합니다.
- `openclaw.hostTargets` 및 `openclaw.environment`는 선택적 메타데이터입니다.
- `openclaw` 조직 게시자와 현재 `openclaw` 조직 구성원의 개인 게시자만
  `official` 채널에 게시할 수 있습니다.
- 대리 게시는 여전히 대상 소유자 계정을 기준으로 official 채널 자격을 검증합니다.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skills를 소프트 삭제/복원합니다(소유자, 조정자 또는 관리자).

선택적 JSON 본문:

```json
{ "reason": "Held for moderation pending legal review." }
```

있으면 `reason`은 Skills 조정 메모로 저장되고 감사 로그에 복사됩니다.
소유자가 시작한 소프트 삭제는 slug를 30일 동안 예약한 뒤, 다른 게시자가 해당 slug를
청구할 수 있습니다. 이 만료가 적용되면 삭제 응답에 `slugReservedUntil`이 포함됩니다.
조정자/관리자 숨김 및 보안 제거에는 이런 방식의 만료가 없습니다.

삭제 응답:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

상태 코드:

- `200`: 정상
- `401`: 인증되지 않음
- `403`: 금지됨
- `404`: Skills/사용자를 찾을 수 없음
- `500`: 내부 서버 오류

### `POST /api/v1/users/publisher`

관리자 전용입니다. 핸들에 대한 조직 게시자가 존재하도록 보장합니다. 핸들이 아직
레거시 공유 사용자/개인 게시자를 가리키는 경우, 엔드포인트가 먼저 이를 조직 게시자로 마이그레이션합니다.
새로 생성된 조직의 경우 `memberHandle`을 제공하세요. 작업을 수행하는 관리자는 구성원으로 추가되지 않습니다.
`memberRole`의 기본값은 `owner`입니다.

- 본문: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- 응답: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

인증된 셀프서비스 조직 게시자 생성입니다. 새 조직 게시자를 만들고 호출자를 소유자로 추가합니다.
이 엔드포인트는 기존 사용자/개인 핸들을 마이그레이션하지 않으며 게시자를 신뢰/공식으로 표시하지 않습니다.

- 본문: `{ "handle": "opik", "displayName": "Opik" }`
- 응답: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- 핸들이 게시자, 사용자 또는 개인 게시자에서 이미 사용 중이면 `409`를 반환합니다.

### `POST /api/v1/users/reserve`

관리자 전용입니다. 릴리스를 게시하지 않고 정당한 소유자를 위해 루트 slug와 패키지 이름을 예약합니다.
패키지 이름은 릴리스 행이 없는 비공개 자리표시자 패키지가 되므로, 동일한 소유자가 나중에
실제 code-plugin 또는 bundle-plugin 릴리스를 해당 이름으로 게시할 수 있습니다.

- 본문: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 응답: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

관리자 전용입니다. Convex Auth 계정 행을 편집하지 않고 검증된 대체 GitHub OAuth 주체에 대한
개인 게시자를 복구합니다. 요청은 두 불변 GitHub 제공자 계정 ID를 모두 지정해야 합니다.
변경 가능한 핸들은 운영자 대상 가드로만 사용됩니다.

엔드포인트는 기본적으로 드라이런입니다. 복구를 적용하려면 직원이 두 GitHub 주체 간의 연속성을 독립적으로 확인한 뒤 `dryRun: false`와
`confirmIdentityVerified: true`가 필요합니다. 대상 사용자의 현재 개인 게시자에 Skills, 패키지 또는 GitHub Skills 소스가 있으면 복구는 안전하게 실패합니다.
복구는 또한 복구된 게시자의 Skills, Skills 슬러그 별칭, 패키지, 패키지 검사기 경고, 파생 검색 다이제스트 행의 기존 `ownerUserId` 필드도 마이그레이션하여
직접 소유자 경로가 새 게시자 권한과 일치하도록 합니다. 복구된 핸들에 대한 활성 보호된 핸들 예약도 대체 사용자에게 재할당되어 이후
프로필 동기화가 이전 사용자의 경쟁 권한을 복원할 수 없게 합니다. 각 기본 테이블은 적용 트랜잭션당
100개 행으로 제한됩니다. 더 큰 복구는 먼저 재개 가능한 소유자 마이그레이션을 사용해야 합니다.
GitHub Skills 소스는 게시자 범위이며 다시 작성되지 않고 확인됨으로 보고됩니다.

- 본문: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- 응답: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 소유자 슬러그 관리 엔드포인트

- `POST /api/v1/skills/{slug}/rename`
  - 본문: `{ "newSlug": "new-canonical-slug" }`
  - 응답: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 본문: `{ "targetSlug": "canonical-target-slug" }`
  - 응답: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

참고:

- 두 엔드포인트 모두 API 토큰 인증이 필요하며 Skills 소유자에게만 작동합니다.
- `rename`은 이전 슬러그를 리디렉션 별칭으로 보존합니다.
- `merge`는 소스 목록을 숨기고 소스 슬러그를 대상 목록으로 리디렉션합니다.

### 소유권 이전 엔드포인트

- `POST /api/v1/skills/{slug}/transfer`
  - 본문: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - 응답: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 응답(accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 응답 형식: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

사용자를 차단하고 소유한 Skills를 하드 삭제합니다(모더레이터/관리자 전용).

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

사용자 차단을 해제하고 복원 가능한 Skills를 복원합니다(관리자 전용).

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

### `POST /api/v1/users/reclassify-ban`

차단을 해제하거나 콘텐츠를 복원하지 않고 기존 차단에 저장된 사유를 변경합니다(관리자 전용).
`dryRun`이 `false`가 아니면 기본적으로 드라이런입니다.

본문:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

또는

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

응답:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

사용자 역할을 변경합니다(관리자 전용).

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

사용자를 나열하거나 검색합니다(관리자 전용).

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

## 기존 CLI 엔드포인트(사용 중단됨)

이전 CLI 버전에서도 계속 지원됩니다.

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

제거 계획은 `DEPRECATIONS.md`를 참조하세요.

`POST /api/cli/upload-url`는 `uploadUrl`과 `uploadTicket`을 반환합니다. ClawPack 타르볼을 준비하는 패키지
게시 작업은 결과 스토리지 ID를 `clawpack`으로, 반환된 티켓을 `clawpackUploadTicket`으로 보내야 합니다.

## Registry 검색(`/.well-known/clawhub.json`)

CLI는 사이트에서 Registry/인증 설정을 검색할 수 있습니다.

- `/.well-known/clawhub.json`(JSON, 권장)
- `/.well-known/clawdhub.json`(기존)

스키마:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

자체 호스팅하는 경우 이 파일을 제공하세요(또는 `CLAWHUB_REGISTRY`를 명시적으로 설정하세요. 기존 `CLAWDHUB_REGISTRY`).
