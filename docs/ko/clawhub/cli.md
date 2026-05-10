---
read_when:
    - ClawHub CLI 사용하기
    - 설치, 업데이트, 게시 또는 동기화 디버깅
summary: 'CLI 참조: 명령어, 플래그, 구성, 잠금 파일, 동기화 동작.'
x-i18n:
    generated_at: "2026-05-10T19:25:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 패키지: `clawhub`, bin: `clawhub`.

npm 또는 pnpm으로 전역 설치합니다.

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

그런 다음 확인합니다.

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 전역 플래그

- `--workdir <dir>`: 작업 디렉터리(기본값: cwd, 구성된 경우 Clawdbot 워크스페이스로 폴백)
- `--dir <dir>`: workdir 아래의 설치 디렉터리(기본값: `skills`)
- `--site <url>`: 브라우저 로그인을 위한 기본 URL(기본값: `https://clawhub.ai`)
- `--registry <url>`: API 기본 URL(기본값: 발견된 값, 없으면 `https://clawhub.ai`)
- `--no-input`: 프롬프트 비활성화

동등한 환경 변수:

- `CLAWHUB_SITE`(레거시 `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY`(레거시 `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR`(레거시 `CLAWDHUB_WORKDIR`)

### HTTP 프록시

CLI는 기업 프록시 또는 제한된 네트워크 뒤의 시스템을 위해
표준 HTTP 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

이 변수 중 하나라도 설정되어 있으면 CLI는 지정된 프록시를 통해
아웃바운드 요청을 라우팅합니다. `HTTPS_PROXY`는 HTTPS 요청에 사용되고,
`HTTP_PROXY`는 일반 HTTP에 사용됩니다. 특정 호스트 또는 도메인에 대해
프록시를 우회하도록 `NO_PROXY` / `no_proxy`도 적용됩니다.

이는 직접 아웃바운드 연결이 차단된 시스템에서 필요합니다
(예: Docker 컨테이너, 프록시 전용 인터넷을 사용하는 Hetzner VPS, 기업
방화벽).

예:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

프록시 변수가 설정되지 않은 경우 동작은 변경되지 않습니다(직접 연결).

## 구성 파일

API 토큰과 캐시된 레지스트리 URL을 저장합니다.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` 또는 `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- 레거시 폴백: `clawhub/config.json`이 아직 없지만 `clawdhub/config.json`이 있으면 CLI가 레거시 경로를 재사용합니다
- 재정의: `CLAWHUB_CONFIG_PATH`(레거시 `CLAWDHUB_CONFIG_PATH`)

## 명령

### `login` / `auth login`

- 기본값: 브라우저를 `<site>/cli/auth`로 열고 loopback 콜백을 통해 완료합니다.
- 헤드리스: `clawhub login --token clh_...`
- 원격/헤드리스 대화형: `clawhub login --device`는 코드를 출력하고, 사용자가 `<site>/cli/device`에서 인증하는 동안 기다립니다.

### `whoami`

- `/api/v1/whoami`를 통해 저장된 토큰을 확인합니다.

### `star <slug>` / `unstar <slug>`

- 하이라이트에 skill을 추가하거나 제거합니다.
- `POST /api/v1/stars/<slug>` 및 `DELETE /api/v1/stars/<slug>`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `search <query...>`

- `/api/v1/search?q=...`를 호출합니다.
- 검색은 다운로드 인기도보다 정확한 slug/이름 토큰 일치를 우선합니다. `map` 같은 독립 slug 토큰은 `amap` 안의 부분 문자열보다 `personal-map`과 더 강하게 일치합니다.
- 다운로드 수는 작은 인기도 사전값일 뿐, 최상위 배치를 보장하지 않습니다.
- skill이 표시되어야 하는데 표시되지 않는 경우, 메타데이터 이름을 바꾸기 전에 로그인한 상태에서 `clawhub inspect <slug>`를 실행하여 소유자에게 보이는 moderation 진단을 확인하세요.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt`를 통해 최신 skills를 나열합니다(`createdAt` desc 기준 정렬).
- 플래그:
  - `--limit <n>`(1-200, 기본값: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`(기본값: newest)
  - `--json`(기계 판독 가능 출력)
- 출력: `<slug>  v<version>  <age>  <summary>`(summary는 50자로 잘림).

### `inspect <slug>`

- 설치하지 않고 skill 메타데이터와 버전 파일을 가져옵니다.
- `--version <version>`: 특정 버전을 검사합니다(기본값: latest).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수(1-200).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만, 200KB 제한).
- `--json`: 기계 판독 가능 출력.

### `install <slug>`

- `/api/v1/skills/<slug>`를 통해 최신 버전을 확인합니다.
- `/api/v1/download`를 통해 zip을 다운로드합니다.
- `<workdir>/<dir>/<slug>`에 압축을 풉니다.
- 고정된 skills 덮어쓰기를 거부합니다. 먼저 `clawhub unpin <slug>`를 실행하세요.
- 다음을 씁니다.
  - `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)
  - `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>`를 제거하고 lockfile 항목을 삭제합니다.
- 대화형: 확인을 요청합니다.
- 비대화형(`--no-input`): `--yes`가 필요합니다.

### `list`

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)을 읽습니다.
- `clawhub pin`으로 동결된 skills 옆에 선택적 이유를 포함하여 `pinned`를 표시합니다.

### `pin <slug>`

- 설치된 Skills를 lockfile에서 고정된 것으로 표시합니다.
- `--reason <text>`는 Skills가 동결된 이유를 기록합니다.
- 고정된 Skills는 `update --all`에서 건너뛰며, 직접 `update <slug>`로 업데이트하려 하면 거부됩니다.
- 고정된 Skills는 로컬 바이트가 실수로 대체되지 않도록 `install --force`도 거부합니다.

### `unpin <slug>`

- 설치된 Skills에서 lockfile 고정을 제거하여 이후 업데이트가 수정할 수 있게 합니다.

### `update [slug]` / `update --all`

- 로컬 파일에서 fingerprint를 계산합니다.
- fingerprint가 알려진 버전과 일치하면 프롬프트를 표시하지 않습니다.
- fingerprint가 일치하지 않으면:
  - 기본적으로 거부합니다
  - `--force`로 덮어씁니다(또는 대화형인 경우 프롬프트)
- 고정된 Skills는 `--force`로도 절대 업데이트되지 않습니다.
- `update <slug>`는 고정된 slug에 대해 빠르게 실패하며 먼저 `clawhub unpin <slug>`를 실행하라고 안내합니다.
- `update --all`은 고정된 slug를 건너뛰고 동결 상태로 유지된 항목의 요약을 출력합니다.

### `skill publish <path>`

- `POST /api/v1/skills`(multipart)를 통해 게시합니다.
- semver가 필요합니다: `--version 1.2.3`.
- `--owner <handle>`은 행위자에게 게시자 접근 권한이 있을 때 조직/사용자 게시자 핸들 아래에 게시합니다.
- `--migrate-owner`는 새 버전을 게시하면서 기존 Skills를 `--owner`로 이동합니다. 두 게시자 모두에 대한 관리자/소유자 접근 권한이 필요합니다.
- 소유자 및 리뷰 동작은 `docs/publishing.md`에 설명되어 있습니다.
- Skills를 게시한다는 것은 ClawHub에서 `MIT-0`로 릴리스된다는 뜻입니다.
- 게시된 Skills는 attribution 없이 자유롭게 사용, 수정, 재배포할 수 있습니다.
- ClawHub는 유료 Skills 또는 Skills별 가격 책정을 지원하지 않습니다.
- 레거시 별칭: `publish <path>`.

### `delete <slug>`

- Skills를 soft-delete합니다(소유자, moderator 또는 관리자).
- `DELETE /api/v1/skills/{slug}`를 호출합니다.
- 소유자가 시작한 soft delete는 slug를 30일 동안 예약하며, 명령은 만료 시간을 출력합니다.
- `--reason <text>`는 Skills와 감사 로그에 moderation 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `undelete <slug>`

- 숨겨진 Skills를 복원합니다(소유자, moderator 또는 관리자).
- `POST /api/v1/skills/{slug}/undelete`를 호출합니다.
- `--reason <text>`는 Skills와 감사 로그에 moderation 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `hide <slug>`

- Skills를 숨깁니다(소유자, moderator 또는 관리자).
- `delete`의 별칭입니다.

### `unhide <slug>`

- Skills 숨김을 해제합니다(소유자, moderator 또는 관리자).
- `undelete`의 별칭입니다.

### `skill rename <slug> <new-slug>`

- 소유한 Skills의 이름을 변경하고 이전 slug를 redirect 별칭으로 유지합니다.
- `POST /api/v1/skills/{slug}/rename`을 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `skill merge <source-slug> <target-slug>`

- 소유한 Skills 하나를 소유한 다른 Skills에 병합합니다.
- source slug는 공개 목록 표시를 중단하고 target으로 향하는 redirect 별칭이 됩니다.
- `POST /api/v1/skills/{sourceSlug}/merge`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `skill rescan <slug>`

- 최신 게시 Skills 버전에 대한 보안 재스캔을 요청합니다.
- 소유자와 게시자 관리자는 버전별 복구 한도까지 자신의 Skills를 재스캔할 수 있습니다.
- 플랫폼 moderator와 관리자는 모든 Skills를 재스캔할 수 있으며 소유자 복구 한도의 적용을 받지 않지만, 버전당 한 번에 하나의 재스캔만 실행할 수 있습니다.
- `POST /api/v1/skills/{slug}/rescan`을 호출합니다.
- 플래그:
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- 소유권 이전 워크플로입니다.
- 하위 명령:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- 엔드포인트:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- `GET /api/v1/packages` 및 `GET /api/v1/packages/search`를 통해 통합 패키지 catalog를 탐색하거나 검색합니다.
- Plugin 및 기타 package-family 항목에는 이것을 사용하세요. 최상위 `search`는 Skills 검색 표면으로 유지됩니다.
- 플래그:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>`(1-100, 기본값: 25)
  - `--json`

예:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- 설치하지 않고 패키지 메타데이터를 가져옵니다.
- Plugin 메타데이터, 호환성, 검증, 소스, 버전/파일 검사에 이것을 사용하세요.
- `--version <version>`: 특정 버전을 검사합니다(기본값: latest).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수입니다(1-100).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만 해당, 200KB 제한).
- `--json`: 기계 판독 가능 출력입니다.

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact`를 통해 패키지 버전을 확인합니다.
- resolver의 `downloadUrl`에서 artifact를 다운로드합니다.
- 모든 artifact에 대해 ClawHub SHA-256을 검증합니다.
- ClawPack npm-pack artifact의 경우 npm `sha512` integrity, npm shasum, tarball의 `package.json` 이름/버전도 검증합니다.
- 레거시 ZIP 버전은 레거시 ZIP route를 통해 다운로드됩니다.
- 플래그:
  - `--version <version>`: 특정 버전을 다운로드합니다.
  - `--tag <tag>`: 태그가 지정된 버전을 다운로드합니다(기본값: `latest`).
  - `-o, --output <path>`: 출력 파일 또는 디렉터리입니다.
  - `--force`: 기존 출력 파일을 덮어씁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 로컬 artifact에 대해 ClawHub SHA-256, npm `sha512` integrity, npm shasum을 계산합니다.
- `--package`와 함께 사용하면 ClawHub에서 예상 메타데이터를 확인하고 로컬 파일을 게시된 artifact 메타데이터와 비교합니다.
- 직접 digest 플래그를 사용하면 네트워크 조회 없이 검증합니다.
- 플래그:
  - `--package <name>`: 예상 artifact 메타데이터를 확인할 패키지 이름입니다.
  - `--version <version>` 또는 `--tag <tag>`: 예상 패키지 버전입니다.
  - `--sha256 <hex>`: 예상 ClawHub SHA-256입니다.
  - `--npm-integrity <sri>`: 예상 npm integrity입니다.
  - `--npm-shasum <sha1>`: 예상 npm shasum입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- 패키지와 모든 릴리스를 소프트 삭제합니다.
- 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 중재자,
  또는 플랫폼 관리자가 필요합니다.
- 플래그:
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- 최신 게시 패키지 릴리스에 대한 보안 재스캔을 요청합니다.
- 소유자와 게시자 관리자는 릴리스별 복구 제한까지 자신의 패키지를
  재스캔할 수 있습니다.
- 플랫폼 중재자와 관리자는 모든 패키지를 재스캔할 수 있으며
  소유자 복구 제한의 영향을 받지 않지만, 릴리스당 한 번에 하나의 재스캔만 실행할 수 있습니다.
- `POST /api/v1/packages/{name}/rescan`을 호출합니다.
- 플래그:
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- 중재자에게 패키지를 신고하기 위한 인증된 명령입니다.
- `POST /api/v1/packages/{name}/report`를 호출합니다.
- 신고는 패키지 수준이며, 선택적으로 버전에 연결될 수 있고, 검토를 위해
  중재자에게 표시됩니다.
- 신고 자체만으로 패키지를 자동 숨김 처리하거나 다운로드를 차단하지는 않습니다.
- 플래그:
  - `--version <version>`: 신고에 첨부할 선택적 패키지 버전입니다.
  - `--reason <text>`: 필수 신고 사유입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- 릴리스 중재에 이의를 제기하기 위한 소유자/게시자 명령입니다.
- `POST /api/v1/packages/{name}/appeal`을 호출합니다.
- 격리, 취소, 의심, 또는 악성으로 표시된
  릴리스에 대해 이의 제기를 접수합니다.
- 플래그:
  - `--version <version>`: 필수 패키지 버전입니다.
  - `--message <text>`: 필수 이의 제기 메시지입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- 패키지 중재 표시 상태를 확인하기 위한 소유자 명령입니다.
- `GET /api/v1/packages/{name}/moderation`을 호출합니다.
- 현재 패키지 스캔 상태, 열린 신고 수, 최신 릴리스 수동
  중재 상태, 다운로드 차단 상태, 중재 사유를 표시합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 패키지가 향후 OpenClaw 사용에 준비되었는지 확인합니다.
- `GET /api/v1/packages/{name}/readiness`를 호출합니다.
- 공식 상태, ClawPack 가용성, 아티팩트 다이제스트,
  소스 출처, OpenClaw 호환성, 호스트 대상, 환경 메타데이터,
  스캔 상태에 대한 차단 요인을 보고합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 번들 OpenClaw Plugin을 대체할 수 있는 패키지의 운영자 중심 마이그레이션 상태를 표시합니다.
- `package readiness`와 동일한 계산된 준비 상태 엔드포인트를 호출하지만,
  마이그레이션 중심 상태, 최신 버전, 공식 패키지 상태, 검사, 차단 요인을 출력합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages`를 통해 코드 Plugin 또는 번들 Plugin을 게시합니다.
- `<source>`는 다음을 허용합니다.
  - 로컬 폴더 경로: `./my-plugin`
  - 로컬 ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub 저장소: `owner/repo` 또는 `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- 메타데이터는 `package.json`, `openclaw.plugin.json` 및
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json` 같은 실제 OpenClaw 번들 마커에서 자동 감지됩니다.
- `.tgz` 소스는 ClawPack으로 처리됩니다. CLI는 정확한 npm-pack
  바이트를 업로드하고 추출된 `package/` 내용은 검증 및
  메타데이터 사전 입력에만 사용합니다.
- 코드 Plugin 폴더는 업로드 전에 ClawPack npm tarball로 패키징되어
  OpenClaw 설치가 정확한 아티팩트를 검증할 수 있습니다. 번들 Plugin 폴더는 계속
  추출 파일 게시 경로를 사용합니다.
- GitHub 소스의 경우 저장소, 확인된 커밋, 참조, 하위 경로에서 소스 귀속 정보가 자동 입력됩니다.
- 로컬 폴더의 경우 origin 원격이 GitHub를 가리키면 로컬 git에서 소스 귀속 정보가 자동 감지됩니다.
- 외부 코드 Plugin은 `openclaw.compat.pluginApi`와
  `openclaw.build.openclawVersion`을 명시적으로 선언해야 합니다.
  최상위 `package.json.version`은 게시 검증의 대체값으로 사용되지 않습니다.
- `--dry-run`은 업로드 없이 확인된 게시 페이로드를 미리 보여줍니다.
- `--json`은 CI용 기계 판독 가능 출력을 내보냅니다.
- `--owner <handle>`은 행위자에게 게시자 접근 권한이 있을 때 사용자 또는 조직 게시자 핸들 아래에 게시합니다.
- 범위가 지정된 패키지 이름은 선택한 소유자와 일치해야 합니다. `docs/publishing.md`를 참조하세요.
- 기존 플래그(`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`)는 계속 재정의값으로 작동합니다.
- 비공개 GitHub 저장소에는 `GITHUB_TOKEN`이 필요합니다.

#### 권장 로컬 흐름

라이브 릴리스를 만들기 전에 확인된 패키지 메타데이터와
소스 귀속 정보를 확인할 수 있도록 먼저 `--dry-run`을 사용하세요.

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 로컬 폴더 흐름

코드 Plugin의 경우 폴더 게시는 패키지 폴더에서 ClawPack 아티팩트를 빌드하고 업로드합니다.

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin`용 최소 `package.json`

외부 코드 Plugin에는 `package.json`에 소량의 OpenClaw 메타데이터가 필요합니다.
이 최소 매니페스트만으로도 성공적으로 게시할 수 있습니다.

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

필수 필드:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

참고:

- `package.json.version`은 패키지 릴리스 버전이지만,
  OpenClaw 호환성/빌드 검증의 대체값으로 사용되지 않습니다.
- `openclaw.hostTargets`와 `openclaw.environment`는 선택적 메타데이터입니다.
  ClawHub는 이 값들이 있으면 표시할 수 있지만, 게시에 필수는 아닙니다.
- `openclaw.compat.minGatewayVersion`과
  `openclaw.build.pluginSdkVersion`은 더 자세한 호환성 메타데이터를 게시하려는 경우 사용할 수 있는 선택적 추가 항목입니다.
- 이전 `clawhub` CLI 릴리스를 사용 중이라면 업로드 전에 로컬 사전 검사가 실행되도록
  게시하기 전에 업그레이드하세요.

#### GitHub Actions

ClawHub는 Plugin 저장소용 공식 재사용 가능 워크플로도
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)에 제공합니다.

일반적인 호출자 설정:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

참고:

- 재사용 가능 워크플로는 기본적으로 `source`를 호출자 저장소로 설정합니다.
- 모노레포의 경우 워크플로가 Plugin 패키지 폴더를 게시하도록 `source_path`를 전달하세요.
  예: `source_path: extensions/codex`.
- 재사용 가능 워크플로를 안정 태그 또는 전체 커밋 SHA에 고정하세요. `@main`에서 릴리스 게시를 실행하지 마세요.
- `pull_request`는 CI를 오염시키지 않도록 `dry_run: true`를 사용해야 합니다.
- 실제 게시는 `workflow_dispatch` 또는 태그 푸시 같은 신뢰할 수 있는 이벤트로 제한해야 합니다.
- 비밀 없는 신뢰 게시자는 `workflow_dispatch`에서만 작동합니다. 태그 푸시에는 여전히 `clawhub_token`이 필요합니다.
- 첫 게시, 신뢰되지 않은 패키지, 또는 비상 게시를 위해 `clawhub_token`을 사용할 수 있게 유지하세요.
- 워크플로는 JSON 결과를 아티팩트로 업로드하고 워크플로 출력으로 노출합니다.

### `sync`

- 로컬 Skill 폴더를 스캔하고 새 항목 또는 변경된 항목을 게시합니다.
- 루트는 Skills 디렉터리 또는 `SKILL.md`가 있는 단일 Skill 폴더 등 어떤 폴더든 가능합니다.
- `~/.clawdbot/clawdbot.json`이 있으면 Clawdbot Skill 루트를 자동 추가합니다.
  - `agent.workspace/skills`(기본 에이전트)
  - `routing.agents.*.workspace/skills`(에이전트별)
  - `~/.clawdbot/skills`(공유)
  - `skills.load.extraDirs`(공유 팩)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` 및 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`을 준수합니다.
- 플래그:
  - `--root <dir...>` 추가 스캔 루트
  - `--all` 확인 없이 업로드
  - `--dry-run` 계획만 표시
  - `--bump patch|minor|major`(기본값: patch)
  - `--changelog <text>`(비대화형)
  - `--tags a,b,c`(기본값: latest)
  - `--concurrency <n>`(기본값: 4)

텔레메트리:

- 로그인 상태에서 `sync` 중 전송됩니다. 단, `CLAWHUB_DISABLE_TELEMETRY=1`(레거시 `CLAWDHUB_DISABLE_TELEMETRY=1`)인 경우는 제외합니다.
- 자세한 내용: `docs/telemetry.md`.
