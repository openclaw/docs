---
read_when:
    - ClawHub CLI 사용하기
    - 설치, 업데이트 또는 게시 디버깅
summary: 'CLI 참조: 명령, 플래그, 설정, lockfile 동작.'
x-i18n:
    generated_at: "2026-06-28T00:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 패키지: `clawhub`, 바이너리: `clawhub`.

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

- `--workdir <dir>`: 작업 디렉터리(기본값: cwd, 구성된 경우 Clawdbot 작업공간으로 폴백)
- `--dir <dir>`: workdir 아래의 설치 디렉터리(기본값: `skills`)
- `--site <url>`: 브라우저 로그인용 기본 URL(기본값: `https://clawhub.ai`)
- `--registry <url>`: API 기본 URL(기본값: 발견된 값, 없으면 `https://clawhub.ai`)
- `--no-input`: 프롬프트 비활성화

동등한 환경 변수:

- `CLAWHUB_SITE`(레거시 `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY`(레거시 `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR`(레거시 `CLAWDHUB_WORKDIR`)

### HTTP 프록시

CLI는 기업 프록시나 제한된 네트워크 뒤에 있는 시스템을 위해 표준 HTTP 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

이 변수 중 하나라도 설정되어 있으면 CLI는 나가는 요청을 지정된 프록시를 통해 라우팅합니다. `HTTPS_PROXY`는 HTTPS 요청에 사용되고, `HTTP_PROXY`는 일반 HTTP에 사용됩니다. `NO_PROXY` / `no_proxy`는 특정 호스트나 도메인에 대해 프록시를 우회하는 데 적용됩니다.

이는 직접 나가는 연결이 차단된 시스템(예: Docker 컨테이너, 프록시 전용 인터넷을 사용하는 Hetzner VPS, 기업 방화벽)에서 필요합니다.

예:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

프록시 변수가 설정되어 있지 않으면 동작은 변경되지 않습니다(직접 연결).

## 구성 파일

API 토큰과 캐시된 레지스트리 URL을 저장합니다.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` 또는 `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- 레거시 폴백: `clawhub/config.json`이 아직 없지만 `clawdhub/config.json`이 있으면 CLI는 레거시 경로를 재사용합니다
- 재정의: `CLAWHUB_CONFIG_PATH`(레거시 `CLAWDHUB_CONFIG_PATH`)

## 명령

### `login` / `auth login`

- 기본값: 브라우저를 `<site>/cli/auth`로 열고 loopback 콜백을 통해 완료합니다.
- 헤드리스: `clawhub login --token clh_...`
- 원격/헤드리스 대화형: `clawhub login --device`는 코드를 출력하고 사용자가 `<site>/cli/device`에서 승인하는 동안 기다립니다.

### `whoami`

- `/api/v1/whoami`를 통해 저장된 토큰을 확인합니다.

### `token`

- 저장된 API 토큰을 stdout에 출력합니다.
- 로컬 로그인 토큰을 CI 시크릿 설정 명령으로 파이프할 때 유용합니다.

### `star <skill>` / `unstar <skill>`

- 하이라이트에 스킬을 추가하거나 제거합니다.
- `POST /api/v1/stars/<slug>` 및 `DELETE /api/v1/stars/<slug>`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `search <query...>`

- `/api/v1/search?q=...`를 호출합니다.
- 출력에는 스킬 슬러그, 소유자 핸들, 표시 이름, 관련성 점수가 포함됩니다.
- 검색은 다운로드 인기도보다 정확한 슬러그/이름 토큰 일치를 우선합니다. `map` 같은 독립형 슬러그 토큰은 `amap` 내부의 부분 문자열보다 `personal-map`에 더 강하게 일치합니다.
- 인기도는 작은 순위 사전값일 뿐, 최상위 배치를 보장하지 않습니다.
- 스킬이 표시되어야 하는데 표시되지 않는 경우, 로그인한 상태에서 `clawhub inspect @owner/slug`를 실행해 메타데이터 이름을 바꾸기 전에 소유자에게 보이는 조정 진단을 확인하세요.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt`를 통해 최신 스킬을 나열합니다(`createdAt` 내림차순 정렬).
- 플래그:
  - `--limit <n>`(1-200, 기본값: 25)
  - `--sort newest|updated|rating|downloads|trending`(기본값: newest). 호환성을 위해 레거시 설치 정렬 별칭도 계속 작동합니다.
  - `--json`(기계가 읽을 수 있는 출력)
- 출력: `<slug>  v<version>  <age>  <summary>`(요약은 50자로 잘림).

### `inspect @owner/slug`

- 설치하지 않고 스킬 메타데이터와 버전 파일을 가져옵니다.
- `--version <version>`: 특정 버전을 검사합니다(기본값: 최신).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수(1-200).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만, 200KB 제한).
- `--json`: 기계가 읽을 수 있는 출력.

### `install @owner/slug`

- 지정된 소유자와 스킬의 최신 버전을 확인합니다.
- `/api/v1/download`를 통해 zip을 다운로드합니다.
- `<workdir>/<dir>/<slug>`에 압축을 풉니다.
- 고정된 스킬은 덮어쓰기를 거부합니다. 먼저 `clawhub unpin <skill>`를 실행하세요.
- 다음을 씁니다.
  - `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)
  - `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>`를 제거하고 lockfile 항목을 삭제합니다.
- 로그인한 상태에서는 현재 설치 수를 비활성화할 수 있도록 최선 노력 방식의 텔레메트리를 전송합니다.
- 대화형: 확인을 요청합니다.
- 비대화형(`--no-input`): `--yes`가 필요합니다.

### `list`

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)을 읽습니다.
- `clawhub pin`으로 고정된 스킬 옆에 선택적 이유와 함께 `pinned`를 표시합니다.

### `pin <skill>`

- 설치된 스킬을 lockfile에서 고정 상태로 표시합니다.
- `--reason <text>`는 스킬이 고정된 이유를 기록합니다.
- 고정된 스킬은 `update --all`에서 건너뛰며 직접 `update <skill>`에서도 거부됩니다.
- 고정된 스킬은 로컬 바이트가 실수로 대체되지 않도록 `install --force`도 거부합니다.

### `unpin <skill>`

- 설치된 스킬에서 lockfile 고정을 제거해 향후 업데이트가 수정할 수 있게 합니다.

### `update [@owner/slug]` / `update --all`

- 로컬 파일에서 지문을 계산합니다.
- 지문이 알려진 버전과 일치하면 프롬프트가 표시되지 않습니다.
- 지문이 일치하지 않으면:
  - 기본적으로 거부합니다
  - `--force`로 덮어씁니다(또는 대화형인 경우 프롬프트)
- 고정된 스킬은 `--force`로도 절대 업데이트되지 않습니다.
- `update <skill>`은 고정된 스킬에 대해 빠르게 실패하고 먼저 `clawhub unpin <skill>`를 실행하라고 안내합니다.
- `update --all`은 고정된 슬러그를 건너뛰고 고정 상태로 남은 항목의 요약을 출력합니다.

### `skill publish <path>`

- 로컬 번들 지문을 ClawHub와 비교하고 콘텐츠가 이미 게시되어 있으면 성공적으로 종료합니다.
- 새 스킬은 기본적으로 `1.0.0`이 됩니다. 변경된 스킬은 기본적으로 다음 패치 버전이 됩니다.
- `--version <version>`은 버전을 명시적으로 선택하며 콘텐츠가 기존 버전과 일치해도 게시합니다.
- `--dry-run`은 업로드 없이 게시를 확인합니다. `--json`은 기계가 읽을 수 있는 결과를 출력합니다.
- `--owner <handle>`은 행위자에게 게시자 액세스 권한이 있을 때 조직/사용자 게시자 핸들 아래에 게시합니다.
- `--migrate-owner`는 새 버전을 게시하면서 기존 스킬을 `--owner`로 이동합니다. 두 게시자 모두에 대한 관리자/소유자 액세스가 필요합니다.
- 소유자 및 검토 동작은 `docs/publishing.md`에 설명되어 있습니다.
- 스킬을 게시한다는 것은 ClawHub에서 `MIT-0`으로 릴리스된다는 의미입니다.
- 게시된 스킬은 저작자 표시 없이 자유롭게 사용, 수정, 재배포할 수 있습니다.
- ClawHub는 유료 스킬이나 스킬별 가격 책정을 지원하지 않습니다.
- 레거시 별칭: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub의 재사용 가능한
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow는 하나의 `skill_path`에 대해, 또는 `root`(기본값: `skills`) 바로 아래의 각 스킬 폴더에 대해 `skill publish`를 호출합니다. 변경되지 않은 스킬은 건너뛰며 동일한 자동 패치 버전 동작을 사용합니다.

토큰 없이 미리 보려면 `dry_run: true`를 설정하세요. 실제 게시는 `clawhub_token` 시크릿이 필요합니다.

### `sync`

- 현재 workdir, 구성된 skills 디렉터리, 그리고 `SKILL.md` 또는 `skill.md`를 포함하는 로컬 스킬 폴더를 찾기 위해 모든 `--root <dir>` 폴더를 스캔합니다.
- 각 로컬 스킬 지문을 ClawHub와 비교하고 새 스킬이나 변경된 스킬만 게시합니다.
- 새 스킬은 `1.0.0`으로 게시됩니다. 변경된 스킬은 기본적으로 다음 패치 버전으로 게시됩니다. 더 큰 semver 단계로 이동해야 하는 업데이트 배치에는 `--bump minor|major`를 사용하세요.
- `--dry-run`은 업로드 없이 게시 계획을 보여줍니다. `--json`은 기계가 읽을 수 있는 계획을 출력합니다.
- `--all`은 프롬프트 없이 모든 새 스킬 또는 변경된 스킬을 게시합니다. `--all`이 없으면 대화형 터미널에서 게시할 스킬을 선택할 수 있습니다.
- `--owner <handle>`은 행위자에게 게시자 액세스 권한이 있을 때 조직/사용자 게시자 핸들 아래에 게시합니다.
- `sync`는 단방향 게시만 수행합니다. 설치, 업데이트, 다운로드 또는 설치/다운로드 텔레메트리 보고를 하지 않습니다.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login`이 필요합니다.
- `POST /api/v1/skills/-/scan`을 통해 ClawHub ClawScan을 실행한 다음, 스캔이 종료 상태가 될 때까지 폴링합니다.
- 스캔은 비동기식이며 완료하는 데 시간이 걸릴 수 있습니다. 대기열에 있는 동안 터미널 스피너는 현재 우선순위 스캔 위치와 앞에 있는 스캔 수를 표시합니다.
- 게시된 스캔에는 소유권 또는 게시자 관리 액세스 권한이 필요합니다. 조정자/관리자는 `clawhub-admin`을 통해 동일한 백엔드를 사용할 수 있습니다.
- `--update`는 `--slug`와 함께 사용할 때만 유효합니다. 성공한 게시 스캔 결과를 선택한 버전에 다시 씁니다.
- `--output <file.zip>`은 `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, `README.md`가 포함된 전체 보고서 아카이브를 다운로드합니다.
- `--json`은 자동화를 위해 전체 폴링 응답을 출력합니다.
- 로컬 경로 스캔은 더 이상 지원되지 않습니다. 새 버전을 업로드한 다음 `scan download`를 사용해 제출된 해당 버전에 대해 저장된 스캔 결과를 가져오세요.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login`이 필요합니다.
- ClawHub 보안 검사로 차단되었거나 숨겨진 버전을 포함하여 제출된 스킬 또는 Plugin 버전에 대해 저장된 스캔 보고서 ZIP을 다운로드합니다.
- 스킬 다운로드는 스킬 슬러그를 사용하며 기본값은 `--kind skill`입니다.
- Plugin 다운로드는 패키지 이름을 사용하며 `--kind plugin`이 필요합니다.
- `--version`은 작성자가 ClawHub에 의해 차단된 정확한 제출 버전을 검사할 수 있도록 필수입니다.
- `--output <file.zip>`은 대상 경로를 선택합니다.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub는 스킬 저장소와 카탈로그 저장소를 위해 공식 재사용 가능 workflow를
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
에서 제공합니다.

일반적인 카탈로그 설정:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

참고:

- `root`는 카탈로그 저장소에서 기본적으로 `skills`입니다.
- 하나의 스킬 폴더를 처리하려면 `skill_path: skills/review-helper`를 전달하세요.
- `owner`는 CLI `--owner` 플래그에 매핑됩니다. 인증된 사용자로 게시하려면 생략하세요.
- V1 스킬 게시는 `clawhub_token`을 사용합니다. GitHub OIDC 신뢰 게시하기는 현재 패키지 전용입니다.

### `delete <skill>`

- `--version`이 없으면 스킬을 소프트 삭제합니다(소유자, 중재자 또는 관리자).
- `DELETE /api/v1/skills/{slug}`를 호출합니다.
- 소유자가 시작한 소프트 삭제는 30일 동안 슬러그를 예약하며, 명령은 만료 시간을 출력합니다.
- `--version <version>`은 실패 시 닫히는 버전별 경로를 통해 소유한 최신이 아닌 버전 하나를 영구 삭제합니다.
  삭제된 버전은 복원하거나 다시 게시할 수 없습니다. 현재 최신 버전을 삭제하기 전에 대체 버전을 게시하세요.
  플랫폼 스태프는 이 버전 전용 흐름에서 소유권을 우회하지 않습니다.
- `--reason <text>`는 전체 스킬 소프트 삭제와 감사 로그에 중재 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `undelete <skill>`

- 숨겨진 스킬을 복원합니다(소유자, 중재자 또는 관리자).
- 버전 삭제 취소는 없습니다. 영구 삭제된 버전은 복원할 수 없습니다.
- `POST /api/v1/skills/{slug}/undelete`를 호출합니다.
- `--reason <text>`는 스킬과 감사 로그에 중재 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `hide <skill>`

- 스킬을 숨깁니다(소유자, 중재자 또는 관리자).
- `delete`의 별칭입니다.

### `unhide <skill>`

- 스킬 숨김을 해제합니다(소유자, 중재자 또는 관리자).
- `undelete`의 별칭입니다.

### `skill rename <skill> <new-name>`

- 소유한 스킬의 이름을 바꾸고 이전 슬러그를 리디렉션 별칭으로 유지합니다.
- `POST /api/v1/skills/{slug}/rename`을 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `skill merge <source> <target>`

- 소유한 스킬 하나를 소유한 다른 스킬에 병합합니다.
- 소스 슬러그는 공개 목록 표시를 중단하고 대상에 대한 리디렉션 별칭이 됩니다.
- `POST /api/v1/skills/{sourceSlug}/merge`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `transfer`

- 소유권 이전 워크플로입니다.
- 사용자 핸들로 이전하면 수신자가 수락해야 하는 보류 중 요청이 생성됩니다.
- 조직/게시자 핸들로 이전하는 경우, 행위자가 현재 소유자와 대상 게시자 모두에 대한 관리자 액세스 권한이 있을 때만 즉시 적용됩니다.
- 하위 명령:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- 엔드포인트:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- `GET /api/v1/packages` 및 `GET /api/v1/packages/search`를 통해 통합 패키지 카탈로그를 탐색하거나 검색합니다.
- 플러그인 및 기타 패키지 계열 항목에는 이것을 사용하세요. 최상위 `search`는 계속 스킬 검색 표면으로 유지됩니다.
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

예시:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- 설치하지 않고 패키지 메타데이터를 가져옵니다.
- 플러그인 메타데이터, 호환성, 검증, 소스, 버전/파일 검사에 이것을 사용하세요.
- `--version <version>`: 특정 버전을 검사합니다(기본값: 최신).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수(1-100).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만, 200KB 제한).
- `--json`: 기계가 읽을 수 있는 출력입니다.

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact`를 통해 패키지 버전을 확인합니다.
- 리졸버의 `downloadUrl`에서 아티팩트를 다운로드합니다.
- 모든 아티팩트에 대해 ClawHub SHA-256을 검증합니다.
- ClawPack npm-pack 아티팩트의 경우 npm `sha512` 무결성, npm shasum, tarball의 `package.json` 이름/버전도 검증합니다.
- 레거시 ZIP 버전은 레거시 ZIP 경로를 통해 다운로드됩니다.
- 플래그:
  - `--version <version>`: 특정 버전을 다운로드합니다.
  - `--tag <tag>`: 태그가 지정된 버전을 다운로드합니다(기본값: `latest`).
  - `-o, --output <path>`: 출력 파일 또는 디렉터리입니다.
  - `--force`: 기존 출력 파일을 덮어씁니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 로컬 아티팩트에 대해 ClawHub SHA-256, npm `sha512` 무결성, npm shasum을 계산합니다.
- `--package`와 함께 사용하면 ClawHub에서 예상 메타데이터를 확인하고 로컬 파일을 게시된 아티팩트 메타데이터와 비교합니다.
- 직접 다이제스트 플래그를 사용하면 네트워크 조회 없이 검증합니다.
- 플래그:
  - `--package <name>`: 예상 아티팩트 메타데이터를 확인할 패키지 이름입니다.
  - `--version <version>` 또는 `--tag <tag>`: 예상 패키지 버전입니다.
  - `--sha256 <hex>`: 예상 ClawHub SHA-256입니다.
  - `--npm-integrity <sri>`: 예상 npm 무결성입니다.
  - `--npm-shasum <sha1>`: 예상 npm shasum입니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 로컬 플러그인 패키지 폴더에 대해 ClawHub CLI에 번들된 Plugin Inspector를 실행합니다.
- 로컬 OpenClaw 체크아웃을 찾거나 가져오지 않고 오프라인/정적 검증을 기본값으로 사용합니다.
- 엄격한 호환성 오류가 있으면 0이 아닌 코드로 종료됩니다. 경고만 있는 발견 사항은 출력되지만 0으로 종료됩니다.
- 플래그:
  - `--out <dir>`: Plugin Inspector 보고서를 이 디렉터리에 씁니다.
  - `--openclaw <path>`: 명시적인 로컬 OpenClaw 체크아웃을 기준으로 검사합니다.
  - `--runtime`: 런타임 캡처를 활성화합니다. 플러그인 코드를 가져옵니다.
  - `--allow-execute`: 격리된 작업 공간에서 런타임 캡처를 허용합니다.
  - `--no-mock-sdk`: 런타임 캡처 중 모의 OpenClaw SDK를 비활성화합니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package validate ./example-plugin
```

검증에서 패키지, 매니페스트, SDK 가져오기 또는 아티팩트 발견 사항이 보고되면 [Plugin 검증 수정](/ko/clawhub/plugin-validation-fixes)을 참조한 다음 명령을 다시 실행하세요.

### `package delete <name>`

- `--version`이 없으면 패키지와 모든 릴리스를 소프트 삭제합니다.
- `--version <version>`은 실패 시 닫히는 버전별 경로를 통해 소유한 최신이 아닌 릴리스 하나를 영구 삭제합니다.
  삭제된 버전은 복원하거나 다시 게시할 수 없습니다. 현재 최신 버전을 삭제하기 전에 대체 버전을 게시하세요.
  이 버전 전용 흐름에는 패키지 소유자 또는 조직 게시자 관리자가 필요합니다. 플랫폼 스태프는 패키지 소유권을 우회하지 않습니다.
- 전체 패키지 소프트 삭제에는 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 중재자 또는 플랫폼 관리자가 필요합니다.
- 플래그:
  - `--version <version>`: 최신이 아닌 버전 하나를 영구 삭제합니다.
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 소프트 삭제된 패키지와 릴리스를 복원합니다.
- 버전 삭제 취소는 없습니다. 영구 삭제된 버전은 복원할 수 없습니다.
- 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 중재자 또는 플랫폼 관리자가 필요합니다.
- `POST /api/v1/packages/{name}/undelete`를 호출합니다.
- 플래그:
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 패키지를 다른 게시자에게 이전합니다.
- 플랫폼 관리자가 수행하지 않는 한, 현재 패키지 소유자와 대상 게시자 모두에 대한 관리자 액세스 권한이 필요합니다.
- 범위가 지정된 패키지 이름은 일치하는 범위 소유자에게 이전해야 합니다.
- `POST /api/v1/packages/{name}/transfer`를 호출합니다.
- 플래그:
  - `--to <owner>`: 대상 게시자 핸들입니다.
  - `--reason <text>`: 선택적 감사 사유입니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 중재자에게 패키지를 신고하기 위한 인증된 명령입니다.
- `POST /api/v1/packages/{name}/report`를 호출합니다.
- 신고는 패키지 수준이며, 선택적으로 버전에 연결될 수 있고 검토를 위해 중재자에게 표시됩니다.
- 신고 자체만으로 패키지를 자동으로 숨기거나 다운로드를 차단하지 않습니다.
- 플래그:
  - `--version <version>`: 신고에 첨부할 선택적 패키지 버전입니다.
  - `--reason <text>`: 필수 신고 사유입니다.
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 패키지 중재 표시 상태를 확인하는 소유자 명령입니다.
- `GET /api/v1/packages/{name}/moderation`을 호출합니다.
- 현재 패키지 스캔 상태, 열린 신고 수, 최신 릴리스 수동 중재 상태, 다운로드 차단 상태, 중재 사유를 표시합니다.
- 플래그:
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 패키지가 향후 OpenClaw 소비에 준비되었는지 확인합니다.
- `GET /api/v1/packages/{name}/readiness`를 호출합니다.
- 공식 상태, ClawPack 사용 가능 여부, 아티팩트 다이제스트, 소스 출처, OpenClaw 호환성, 호스트 대상, 환경 메타데이터, 스캔 상태에 대한 차단 요인을 보고합니다.
- 플래그:
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 번들된 OpenClaw 플러그인을 대체할 수 있는 패키지에 대해 운영자 지향 마이그레이션 상태를 표시합니다.
- `package readiness`와 동일한 계산된 준비 상태 엔드포인트를 호출하지만, 마이그레이션 중심 상태, 최신 버전, 공식 패키지 상태, 검사, 차단 요인을 출력합니다.
- 플래그:
  - `--json`: 기계가 읽을 수 있는 출력입니다.

예시:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 인증된 사용자가 소유하는 조직 게시자를 생성합니다.
- 핸들은 소문자로 정규화되며 `@`를 포함하거나 포함하지 않고 전달할 수 있습니다.
- 새로 생성된 조직 게시자는 기본적으로 신뢰됨/공식 상태가 아닙니다.
- 핸들이 기존 게시자, 사용자 또는 예약된 경로에서 이미 사용 중이면 실패합니다.

```bash
clawhub publisher create opik --display-name "Opik"
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
  바이트를 업로드하고, 추출된 `package/` 콘텐츠는 검증 및
  메타데이터 사전 채우기에만 사용합니다.
- 코드 Plugin 폴더는 업로드 전에 ClawPack npm tarball로 패키징되어
  OpenClaw 설치가 정확한 아티팩트를 검증할 수 있게 합니다. 번들 Plugin 폴더는 계속
  추출된 파일 게시 경로를 사용합니다.
- GitHub 소스의 경우 소스 출처가 저장소, 확인된 커밋, ref, 하위 경로에서 자동으로 채워집니다.
- 로컬 폴더의 경우 origin remote가 GitHub를 가리키면 로컬 git에서 소스 출처가 자동 감지됩니다.
- 외부 코드 Plugin은 `openclaw.compat.pluginApi`와
  `openclaw.build.openclawVersion`을 명시적으로 선언해야 합니다.
  최상위 `package.json.version`은 게시 검증의 fallback으로 사용되지 않습니다.
- `--dry-run`은 업로드하지 않고 확인된 게시 페이로드를 미리 봅니다.
- `--json`은 CI용 machine-readable 출력을 내보냅니다.
- `--owner <handle>`은 행위자에게 게시자 접근 권한이 있을 때 사용자 또는 조직 게시자 핸들 아래에 게시합니다.
- 범위가 지정된 패키지 이름은 선택한 소유자와 일치해야 합니다. `docs/publishing.md`를 참조하세요.
- 기존 플래그(`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`)는 계속 override로 작동합니다.
- 비공개 GitHub 저장소에는 `GITHUB_TOKEN`이 필요합니다.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 권장 로컬 흐름

실제 릴리스를 만들기 전에 확인된 패키지 메타데이터와
소스 출처를 확인할 수 있도록 먼저 `--dry-run`을 사용하세요.

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

외부 코드 Plugin에는 `package.json`에 소량의 OpenClaw 메타데이터가 필요합니다. 이 최소 manifest면 성공적으로 게시하기에 충분합니다.

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

- `package.json.version`은 패키지 릴리스 버전이지만, OpenClaw 호환성/빌드 검증의 fallback으로 사용되지 않습니다.
- `openclaw.hostTargets`와 `openclaw.environment`는 선택적 메타데이터입니다.
  ClawHub는 존재할 때 이를 표시할 수 있지만, 게시에 필수는 아닙니다.
- 더 자세한 호환성 메타데이터를 게시하려면 `openclaw.compat.minGatewayVersion`과
  `openclaw.build.pluginSdkVersion`을 선택적 추가 항목으로 사용할 수 있습니다.
- 이전 `clawhub` CLI 릴리스를 사용 중이라면 업로드 전에 로컬 preflight 검사가 실행되도록 게시 전에 업그레이드하세요.
- 검증에서 remediation code가 보고되면
  [Plugin 검증 수정](/ko/clawhub/plugin-validation-fixes)을 참조하세요.

#### GitHub Actions

ClawHub는 Plugin 저장소용 공식 재사용 가능 workflow도
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
에 제공합니다.

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

- 재사용 가능 workflow는 기본적으로 `source`를 호출자 저장소로 설정합니다.
- monorepo의 경우 workflow가 Plugin
  패키지 폴더를 게시하도록 `source_path`를 전달하세요. 예: `source_path: extensions/codex`.
- 재사용 가능 workflow를 안정적인 태그 또는 전체 커밋 SHA에 고정하세요. `@main`에서 릴리스 게시를 실행하지 마세요.
- `pull_request`는 CI가 오염되지 않도록 `dry_run: true`를 사용해야 합니다.
- 실제 게시는 `workflow_dispatch` 또는 태그 push 같은 신뢰할 수 있는 이벤트로 제한해야 합니다.
- 비밀 없이 신뢰할 수 있는 게시는 `workflow_dispatch`에서만 작동합니다. 태그 push에는 여전히 `clawhub_token`이 필요합니다.
- 첫 게시, 신뢰할 수 없는 패키지 또는 비상 게시를 위해 `clawhub_token`을 계속 사용할 수 있게 유지하세요.
- workflow는 JSON 결과를 아티팩트로 업로드하고 workflow 출력으로 노출합니다.

### `package trusted-publisher get <name>`

- 패키지의 GitHub Actions 신뢰할 수 있는 게시자 구성을 표시합니다.
- 구성을 설정한 뒤 저장소, workflow 파일 이름,
  선택적 환경 고정을 확인할 때 사용하세요.
- 플래그:
  - `--json`: machine-readable 출력.

예:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 기존 패키지에 GitHub Actions 신뢰할 수 있는 게시자 구성을 연결하거나 교체합니다.
- 패키지는 먼저 일반 수동 또는 token-authenticated
  `clawhub package publish`를 통해 생성되어야 합니다.
- 구성이 설정되면 이후 지원되는 GitHub Actions 게시는 장기 ClawHub 토큰 없이
  OIDC/신뢰할 수 있는 게시를 사용할 수 있습니다.
- `--repository <repo>`는 `owner/repo`여야 합니다.
- `--workflow-filename <file>`은
  `.github/workflows/`의 workflow 파일 이름과 일치해야 합니다.
- `--environment <name>`은 선택 사항입니다. 구성된 경우 OIDC claim의 GitHub Actions
  환경이 정확히 일치해야 합니다.
- 이 명령이 실행될 때 ClawHub는 구성된 GitHub 저장소를 검증합니다.
  공개 저장소는 공개 GitHub 메타데이터를 통해 검증할 수 있습니다. 비공개
  저장소는 예를 들어 향후 ClawHub GitHub App 설치 또는 다른 승인된
  GitHub 통합을 통해 ClawHub가 해당 저장소에 GitHub 접근 권한을 가져야 합니다.
- 플래그:
  - `--repository <repo>`: GitHub 저장소, 예: `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflow 파일 이름, 예: `package-publish.yml`.
  - `--environment <name>`: 선택적 exact-match GitHub Actions 환경.
  - `--json`: machine-readable 출력.

예:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 패키지에서 신뢰할 수 있는 게시자 구성을 제거합니다.
- workflow, 저장소 또는 환경 고정을 비활성화하거나 다시 만들어야 할 때 rollback으로 사용하세요.
- 이후 실제 게시는 구성이 다시 설정될 때까지 일반 인증 게시를 사용해야 합니다.
- 플래그:
  - `--json`: machine-readable 출력.

예:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 설치 telemetry

- 로그인된 상태에서 `clawhub install <slug>` 이후 전송됩니다. 단,
  `CLAWHUB_DISABLE_TELEMETRY=1`이 설정된 경우는 제외합니다.
- 보고는 best-effort입니다. telemetry를 사용할 수 없어도 설치 명령은 실패하지 않습니다.
- 자세한 내용: `docs/telemetry.md`.
