---
read_when:
    - ClawHub CLI 사용하기
    - 설치, 업데이트 또는 게시 디버깅
summary: 'CLI 참조: 명령어, 플래그, 구성 및 잠금 파일 동작.'
x-i18n:
    generated_at: "2026-07-12T21:30:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 498d27d82a34ad43af9fc7bc0d40e844c6a14ededc8a017d6fa33768eec4b452
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 패키지: `clawhub`, 바이너리: `clawhub`.

npm 또는 pnpm으로 전역 설치합니다.

```bash
npm i -g clawhub
# 또는
pnpm add -g clawhub
```

그런 다음 설치를 확인합니다.

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 전역 플래그

- `--workdir <dir>`: 작업 디렉터리(기본값: cwd, 구성된 경우 Clawdbot 작업 공간으로 대체)
- `--dir <dir>`: 작업 디렉터리 아래의 설치 디렉터리(기본값: `skills`)
- `--site <url>`: 브라우저 로그인의 기본 URL(기본값: `https://clawhub.ai`)
- `--registry <url>`: API 기본 URL(기본값: 탐지된 URL, 없으면 `https://clawhub.ai`)
- `--no-input`: 프롬프트 비활성화

동등한 환경 변수:

- `CLAWHUB_SITE`(레거시 `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY`(레거시 `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR`(레거시 `CLAWDHUB_WORKDIR`)

### HTTP 프록시

CLI는 기업 프록시 또는 제한된 네트워크 뒤에 있는 시스템에서 표준 HTTP 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

이 변수 중 하나라도 설정되어 있으면 CLI는 지정된 프록시를 통해 외부 요청을 라우팅합니다. HTTPS 요청에는 `HTTPS_PROXY`가 사용되고 일반 HTTP에는 `HTTP_PROXY`가 사용됩니다. 특정 호스트 또는 도메인에서 프록시를 우회하도록 `NO_PROXY` / `no_proxy`를 따릅니다.

직접 외부 연결이 차단된 시스템(예: Docker 컨테이너, 프록시를 통해서만 인터넷에 연결할 수 있는 Hetzner VPS, 기업 방화벽)에서는 이 설정이 필요합니다.

예:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "내 쿼리"
```

프록시 변수가 설정되지 않은 경우 동작은 변경되지 않습니다(직접 연결).

## 구성 파일

API 토큰과 캐시된 레지스트리 URL을 저장합니다.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` 또는 `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- 레거시 대체 경로: `clawhub/config.json`이 아직 존재하지 않지만 `clawdhub/config.json`이 존재하면 CLI가 레거시 경로를 재사용합니다.
- 재정의: `CLAWHUB_CONFIG_PATH`(레거시 `CLAWDHUB_CONFIG_PATH`)

## 명령

### `login` / `auth login`

- 기본값: 브라우저에서 `<site>/cli/auth`를 열고 루프백 콜백을 통해 완료합니다.
- 헤드리스: `clawhub login --token clh_...`
- 원격/헤드리스 대화형: `clawhub login --device`는 코드를 출력하고 사용자가 `<site>/cli/device`에서 승인하는 동안 기다립니다.

### `whoami`

- `/api/v1/whoami`를 통해 저장된 토큰을 확인합니다.

### `token`

- 저장된 API 토큰을 stdout에 출력합니다.
- 로컬 로그인 토큰을 CI 비밀 설정 명령으로 파이프할 때 유용합니다.

### `star <skill>` / `unstar <skill>`

- 하이라이트에 스킬을 추가하거나 제거합니다.
- `POST /api/v1/stars/<slug>` 및 `DELETE /api/v1/stars/<slug>`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `search <query...>`

- `/api/v1/search?q=...`를 호출합니다.
- 출력에는 스킬 슬러그, 소유자 핸들, 표시 이름 및 관련성 점수가 포함됩니다.
- 검색에서는 다운로드 인기도보다 정확한 슬러그/이름 토큰 일치를 우선합니다. `map`과 같은 독립적인 슬러그 토큰은 `amap` 내부의 부분 문자열보다 `personal-map`과 더 강하게 일치합니다.
- 인기도는 순위에 작은 사전 가중치로 반영되며, 최상위 배치를 보장하지 않습니다.
- 스킬이 표시되어야 하지만 표시되지 않는 경우, 메타데이터 이름을 변경하기 전에 로그인한 상태에서 `clawhub inspect @owner/slug`를 실행하여 소유자에게 표시되는 검토 진단을 확인합니다.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt`를 통해 최신 스킬을 나열합니다(`createdAt` 내림차순 정렬).
- 플래그:
  - `--limit <n>`(1-200, 기본값: 25)
  - `--sort newest|updated|rating|downloads|trending`(기본값: newest). 호환성을 위해 레거시 설치 정렬 별칭도 계속 작동합니다.
  - `--json`(기계 판독 가능 출력)
- 출력: `<slug>  v<version>  <age>  <summary>`(요약은 50자로 잘림).

### `inspect @owner/slug`

- 설치하지 않고 스킬 메타데이터와 버전 파일을 가져옵니다.
- `--version <version>`: 특정 버전을 검사합니다(기본값: 최신).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수(1-200).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만, 200KB 제한).
- `--json`: 기계 판독 가능 출력.

### `install @owner/slug`

- 지정된 소유자 및 스킬의 최신 버전을 확인합니다.
- `/api/v1/download`를 통해 zip을 다운로드합니다.
- `<workdir>/<dir>/<slug>`에 압축을 풉니다.
- 고정된 스킬은 덮어쓰지 않습니다. 먼저 `clawhub unpin <skill>`을 실행하십시오.
- 다음을 작성합니다.
  - `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)
  - `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>`를 제거하고 잠금 파일 항목을 삭제합니다.
- 로그인한 상태에서는 현재 설치 수를 비활성화할 수 있도록 최선형 텔레메트리를 전송합니다.
- 대화형: 확인을 요청합니다.
- 비대화형(`--no-input`): `--yes`가 필요합니다.

### `list`

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)을 읽습니다.
- 선택적 사유를 포함하여 `clawhub pin`으로 동결된 스킬 옆에 `pinned`를 표시합니다.

### `pin <skill>`

- 설치된 스킬을 잠금 파일에서 고정된 상태로 표시합니다.
- `--reason <text>`는 스킬을 동결한 이유를 기록합니다.
- 고정된 스킬은 `update --all`에서 건너뛰며 직접 `update <skill>`을 실행하면 거부됩니다.
- 고정된 스킬은 로컬 바이트가 실수로 교체되지 않도록 `install --force`도 거부합니다.

### `unpin <skill>`

- 설치된 스킬에서 잠금 파일 고정을 제거하여 향후 업데이트에서 수정할 수 있도록 합니다.

### `update [@owner/slug]` / `update --all`

- 로컬 파일에서 지문을 계산합니다.
- 지문이 알려진 버전과 일치하는 경우: 프롬프트를 표시하지 않습니다.
- 지문이 일치하지 않는 경우:
  - 기본적으로 거부합니다.
  - `--force`로 덮어씁니다(대화형인 경우 프롬프트 표시).
- 고정된 스킬은 `--force`를 사용해도 업데이트되지 않습니다.
- `update <skill>`은 고정된 스킬에 대해 즉시 실패하며 먼저 `clawhub unpin <skill>`을 실행하라고 안내합니다.
- `update --all`은 고정된 슬러그를 건너뛰고 동결 상태로 유지된 항목의 요약을 출력합니다.

### `skill publish <path>`

- 로컬 번들 지문을 ClawHub와 비교하고 콘텐츠가 이미 게시된 경우 성공적으로 종료합니다.
- 새 스킬의 기본 버전은 `1.0.0`이며, 변경된 스킬은 기본적으로 다음 패치 버전을 사용합니다.
- `--version <version>`은 버전을 명시적으로 선택하며 콘텐츠가 기존 버전과 일치하더라도 게시합니다.
- `--dry-run`은 업로드하지 않고 게시 작업을 확인하며, `--json`은 기계 판독 가능한 결과를 출력합니다.
- 행위자에게 게시자 액세스 권한이 있으면 `--owner <handle>`을 사용하여 조직/사용자 게시자 핸들로 게시합니다.
- `--migrate-owner`는 새 버전을 게시하면서 기존 스킬을 `--owner`로 이동합니다. 두 게시자 모두에 대한 관리자/소유자 액세스 권한이 필요합니다.
- 소유자 및 검토 동작은 `docs/publishing.md`에 설명되어 있습니다.
- 스킬을 게시하면 ClawHub에서 `MIT-0`으로 릴리스됩니다.
- 게시된 스킬은 저작자 표시 없이 자유롭게 사용, 수정 및 재배포할 수 있습니다.
- ClawHub는 유료 스킬 또는 스킬별 가격 책정을 지원하지 않습니다.
- 레거시 별칭: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub의 재사용 가능한 [`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) 워크플로는 하나의 `skill_path`에 대해 또는 `root`(기본값: `skills`) 아래의 각 직계 스킬 폴더에 대해 `skill publish`를 호출합니다. 변경되지 않은 스킬은 건너뛰며 동일한 자동 패치 버전 동작을 사용합니다.

토큰 없이 미리 보려면 `dry_run: true`로 설정합니다. 실제 게시에는 `clawhub_token` 비밀이 필요합니다.

### `sync`

- 현재 작업 디렉터리, 구성된 스킬 디렉터리 및 모든 `--root <dir>` 폴더에서 `SKILL.md` 또는 `skill.md`가 포함된 로컬 스킬 폴더를 검색합니다.
- 각 로컬 스킬 지문을 ClawHub와 비교하고 새 스킬 또는 변경된 스킬만 게시합니다.
- 새 스킬은 `1.0.0`으로 게시되며 변경된 스킬은 기본적으로 다음 패치 버전으로 게시됩니다. 더 큰 SemVer 단계로 이동해야 하는 업데이트 일괄 처리에는 `--bump minor|major`를 사용합니다.
- `--dry-run`은 업로드하지 않고 게시 계획을 표시하며, `--json`은 기계 판독 가능한 계획을 출력합니다.
- `--all`은 프롬프트 없이 모든 새 스킬 또는 변경된 스킬을 게시합니다. `--all`이 없으면 대화형 터미널에서 게시할 스킬을 선택할 수 있습니다.
- 행위자에게 게시자 액세스 권한이 있으면 `--owner <handle>`을 사용하여 조직/사용자 게시자 핸들로 게시합니다.
- `sync`는 단방향 게시만 수행합니다. 설치, 업데이트, 다운로드 또는 설치/다운로드 텔레메트리 보고는 수행하지 않습니다.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login`이 필요합니다.
- `POST /api/v1/skills/-/scan`을 통해 ClawHub ClawScan을 실행한 다음 스캔이 종료 상태가 될 때까지 폴링합니다.
- 스캔은 비동기식이며 완료하는 데 시간이 걸릴 수 있습니다. 대기열에 있는 동안 터미널 스피너는 현재 우선순위 스캔 위치와 앞에 있는 스캔 수를 표시합니다.
- 게시된 스캔에는 소유권 또는 게시자 관리 액세스 권한이 필요합니다. 중재자/관리자는 `clawhub-admin`을 통해 동일한 백엔드를 사용할 수 있습니다.
- `--update`는 `--slug`와 함께 사용할 때만 유효하며, 성공한 게시 스캔 결과를 선택한 버전에 다시 기록합니다.
- `--output <file.zip>`은 `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` 및 `README.md`가 포함된 전체 보고서 아카이브를 다운로드합니다.
- `--json`은 자동화를 위해 전체 폴링 응답을 출력합니다.
- 로컬 경로 스캔은 더 이상 지원되지 않습니다. 새 버전을 업로드한 다음 `scan download`를 사용하여 제출된 해당 버전에 저장된 스캔 결과를 가져오십시오.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login`이 필요합니다.
- ClawHub 보안 검사로 차단되거나 숨겨진 버전을 포함하여 제출된 스킬 또는 Plugin 버전에 저장된 스캔 보고서 ZIP을 다운로드합니다.
- 스킬 다운로드는 스킬 슬러그를 사용하며 기본값은 `--kind skill`입니다.
- Plugin 다운로드는 패키지 이름을 사용하며 `--kind plugin`이 필요합니다.
- 작성자가 ClawHub에서 차단된 정확한 제출 버전을 검사할 수 있도록 `--version`이 필요합니다.
- `--output <file.zip>`은 대상 경로를 선택합니다.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub는 스킬 저장소 및 카탈로그 저장소를 위한 공식 재사용 가능 워크플로를 [`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/skill-publish.yml)에서 제공합니다.

일반적인 카탈로그 설정:

```yaml
name: 스킬 게시

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

- 카탈로그 저장소에서 `root`의 기본값은 `skills`입니다.
- 하나의 스킬 폴더를 처리하려면 `skill_path: skills/review-helper`를 전달합니다.
- `owner`는 CLI `--owner` 플래그에 매핑됩니다. 인증된 사용자로 게시하려면 생략합니다.
- V1 스킬 게시에서는 `clawhub_token`을 사용합니다. GitHub OIDC 신뢰할 수 있는 게시는 현재 패키지에만 적용됩니다.

### `delete <skill>`

- `--version`을 지정하지 않으면 Skills를 소프트 삭제합니다(소유자, 중재자 또는 관리자).
- `DELETE /api/v1/skills/{slug}`를 호출합니다.
- 소유자가 시작한 소프트 삭제는 슬러그를 30일 동안 예약하며, 명령은 만료 시간을 출력합니다.
- `--version <version>`은 실패 시 차단되는 버전별 경로를 통해 소유한 최신 버전이 아닌 버전 하나를 영구 삭제합니다.
  삭제된 버전은 복원하거나 다시 게시할 수 없습니다. 현재 최신 버전을 삭제하기 전에 대체 버전을 게시하십시오.
  이 버전 전용 흐름에서는 플랫폼 직원도 소유권 검사를 우회하지 않습니다.
- `--reason <text>`는 Skills 전체 소프트 삭제 및 감사 로그에 중재 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `undelete <skill>`

- 숨겨진 Skills를 복원합니다(소유자, 중재자 또는 관리자).
- 버전 삭제 취소 기능은 없으며, 영구 삭제된 버전은 복원할 수 없습니다.
- `POST /api/v1/skills/{slug}/undelete`를 호출합니다.
- `--reason <text>`는 Skills 및 감사 로그에 중재 메모를 기록합니다.
- `--note <text>`는 `--reason`의 별칭입니다.
- `--yes`는 확인을 건너뜁니다.

### `hide <skill>`

- Skills를 숨깁니다(소유자, 중재자 또는 관리자).
- `delete`의 별칭입니다.

### `unhide <skill>`

- Skills 숨김을 해제합니다(소유자, 중재자 또는 관리자).
- `undelete`의 별칭입니다.

### `skill rename <skill> <new-name>`

- 소유한 Skills의 이름을 변경하고 이전 슬러그를 리디렉션 별칭으로 유지합니다.
- `POST /api/v1/skills/{slug}/rename`을 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `skill merge <source> <target>`

- 소유한 Skills 하나를 소유한 다른 Skills에 병합합니다.
- 소스 슬러그는 공개 목록에 더 이상 표시되지 않으며 대상의 리디렉션 별칭이 됩니다.
- `POST /api/v1/skills/{sourceSlug}/merge`를 호출합니다.
- `--yes`는 확인을 건너뜁니다.

### `transfer`

- 소유권 이전 워크플로입니다.
- 사용자 핸들로 이전하면 수신자가 수락해야 하는 대기 중 요청이 생성됩니다.
- 조직/게시자 핸들로 이전하는 경우, 작업자가 현재 소유자와 대상 게시자 모두에 대한
  관리자 액세스 권한이 있을 때만 즉시 적용됩니다.
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
- Plugin 및 기타 패키지 계열 항목에는 이 명령을 사용하십시오. 최상위 `search`는 계속 Skills 검색 인터페이스로 사용됩니다.
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
  - `--limit <n>` (1-100, 기본값: 25)
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
- Plugin 메타데이터, 호환성, 검증, 소스 및 버전/파일 검사에 이 명령을 사용하십시오.
- `--version <version>`: 특정 버전을 검사합니다(기본값: 최신).
- `--tag <tag>`: 태그가 지정된 버전을 검사합니다(예: `latest`).
- `--versions`: 버전 기록을 나열합니다(첫 페이지).
- `--limit <n>`: 나열할 최대 버전 수입니다(1-100).
- `--files`: 선택한 버전의 파일을 나열합니다.
- `--file <path>`: 원시 파일 콘텐츠를 가져옵니다(텍스트 파일만 해당, 200KB 제한).
- `--json`: 기계 판독 가능 출력입니다.

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact`를 통해
  패키지 버전을 확인합니다.
- 확인자의 `downloadUrl`에서 아티팩트를 다운로드합니다.
- 모든 아티팩트의 ClawHub SHA-256을 검증합니다.
- ClawPack npm-pack 아티팩트의 경우 npm `sha512` 무결성,
  npm shasum 및 tarball의 `package.json` 이름/버전도 검증합니다.
- 레거시 ZIP 버전은 레거시 ZIP 경로를 통해 다운로드합니다.
- 플래그:
  - `--version <version>`: 특정 버전을 다운로드합니다.
  - `--tag <tag>`: 태그가 지정된 버전을 다운로드합니다(기본값: `latest`).
  - `-o, --output <path>`: 출력 파일 또는 디렉터리입니다.
  - `--force`: 기존 출력 파일을 덮어씁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 로컬 아티팩트의 ClawHub SHA-256, npm `sha512` 무결성 및 npm shasum을
  계산합니다.
- `--package`를 사용하면 ClawHub에서 예상 메타데이터를 확인하고
  로컬 파일을 게시된 아티팩트 메타데이터와 비교합니다.
- 다이제스트 플래그를 직접 사용하면 네트워크 조회 없이 검증합니다.
- 플래그:
  - `--package <name>`: 예상 아티팩트 메타데이터를 확인할 패키지 이름입니다.
  - `--version <version>` 또는 `--tag <tag>`: 예상 패키지 버전입니다.
  - `--sha256 <hex>`: 예상 ClawHub SHA-256입니다.
  - `--npm-integrity <sri>`: 예상 npm 무결성 값입니다.
  - `--npm-shasum <sha1>`: 예상 npm shasum입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 로컬 Plugin 패키지 폴더에 대해 ClawHub CLI에 포함된 Plugin Inspector를
  실행합니다.
- 기본적으로 로컬 OpenClaw 체크아웃을 찾거나 가져오지 않고 오프라인/정적 검증을
  수행합니다.
- 심각한 호환성 오류가 있으면 0이 아닌 코드로 종료합니다. 경고만 있는 결과는 출력하지만
  종료 코드는 0입니다.
- 플래그:
  - `--out <dir>`: Plugin Inspector 보고서를 이 디렉터리에 기록합니다.
  - `--openclaw <path>`: 명시적인 로컬 OpenClaw 체크아웃을 기준으로 검사합니다.
  - `--runtime`: 런타임 캡처를 활성화하며 Plugin 코드를 가져옵니다.
  - `--allow-execute`: 격리된 작업 공간에서 런타임 캡처를 허용합니다.
  - `--no-mock-sdk`: 런타임 캡처 중 모의 OpenClaw SDK를 비활성화합니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package validate ./example-plugin
```

검증에서 패키지, 매니페스트, SDK 가져오기 또는 아티팩트 관련 결과가 보고되면
[Plugin 검증 수정](/clawhub/plugin-validation-fixes)을 참조한 후 명령을 다시 실행하십시오.

### `package delete <name>`

- `--version`을 지정하지 않으면 패키지와 모든 릴리스를 소프트 삭제합니다.
- `--version <version>`은 실패 시 차단되는 버전별 경로를 통해 소유한 최신 릴리스가 아닌 릴리스 하나를 영구 삭제합니다.
  삭제된 버전은 복원하거나 다시 게시할 수 없습니다. 현재 최신 버전을 삭제하기 전에 대체 버전을 게시하십시오.
  이 버전 전용 흐름에는 패키지 소유자 또는 조직 게시자 관리자가 필요하며,
  플랫폼 직원도 패키지 소유권 검사를 우회하지 않습니다.
- 전체 패키지 소프트 삭제에는 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼
  중재자 또는 플랫폼 관리자가 필요합니다.
- 플래그:
  - `--version <version>`: 최신 버전이 아닌 버전 하나를 영구 삭제합니다.
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 소프트 삭제된 패키지와 릴리스를 복원합니다.
- 버전 삭제 취소 기능은 없으며, 영구 삭제된 버전은 복원할 수 없습니다.
- 패키지 소유자, 조직 게시자 소유자/관리자, 플랫폼 중재자
  또는 플랫폼 관리자가 필요합니다.
- `POST /api/v1/packages/{name}/undelete`를 호출합니다.
- 플래그:
  - `--yes`: 확인을 건너뜁니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 패키지를 다른 게시자에게 이전합니다.
- 플랫폼 관리자가 수행하는 경우를 제외하고, 현재 패키지 소유자와 대상
  게시자 모두에 대한 관리자 액세스 권한이 필요합니다.
- 범위가 지정된 패키지 이름은 일치하는 범위 소유자에게 이전해야 합니다.
- `POST /api/v1/packages/{name}/transfer`를 호출합니다.
- 플래그:
  - `--to <owner>`: 대상 게시자 핸들입니다.
  - `--reason <text>`: 선택적 감사 사유입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 패키지를 중재자에게 신고하기 위한 인증된 명령입니다.
- `POST /api/v1/packages/{name}/report`를 호출합니다.
- 신고는 패키지 수준이며, 선택적으로 버전에 연결할 수 있고 중재자가 검토할 수 있도록
  표시됩니다.
- 신고 자체만으로 패키지가 자동으로 숨겨지거나 다운로드가 차단되지는 않습니다.
- 플래그:
  - `--version <version>`: 신고에 첨부할 선택적 패키지 버전입니다.
  - `--reason <text>`: 필수 신고 사유입니다.
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "의심스러운 네이티브 페이로드"
```

### `package moderation-status`

- 패키지 중재 공개 상태를 확인하는 소유자 명령입니다.
- `GET /api/v1/packages/{name}/moderation`을 호출합니다.
- 현재 패키지 검사 상태, 미처리 신고 수, 최신 릴리스의 수동
  중재 상태, 다운로드 차단 상태 및 중재 사유를 표시합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 패키지가 향후 OpenClaw에서 사용할 준비가 되었는지 확인합니다.
- `GET /api/v1/packages/{name}/readiness`를 호출합니다.
- 공식 상태, ClawPack 가용성, 아티팩트 다이제스트,
  소스 출처, OpenClaw 호환성, 호스트 대상, 환경 메타데이터
  및 검사 상태에 대한 차단 요소를 보고합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 번들 OpenClaw Plugin을 대체할 수 있는 패키지의 운영자용 마이그레이션 상태를
  표시합니다.
- `package readiness`와 동일하게 계산된 준비 상태 엔드포인트를 호출하지만,
  마이그레이션 중심 상태, 최신 버전, 공식 패키지 상태, 검사 및
  차단 요소를 출력합니다.
- 플래그:
  - `--json`: 기계 판독 가능 출력입니다.

예시:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 인증된 사용자가 소유하는 조직 게시자를 생성합니다.
- 핸들은 소문자로 정규화되며 `@`를 포함하거나 포함하지 않고 전달할 수 있습니다.
- 새로 생성된 조직 게시자는 기본적으로 신뢰되거나 공식으로 지정되지 않습니다.
- 기존 게시자, 사용자 또는 예약된 경로에서 핸들을 이미 사용하는 경우 실패합니다.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages`를 통해 코드 Plugin 또는 번들 Plugin을 게시합니다.
- `<source>`에 다음을 사용할 수 있습니다.
  - 로컬 폴더 경로: `./my-plugin`
  - 로컬 ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub 저장소: `owner/repo` 또는 `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- 메타데이터는 `package.json`, `openclaw.plugin.json` 및
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`,
  `.cursor-plugin/plugin.json`과 같은 실제 OpenClaw 번들 마커에서 자동으로 감지됩니다.
- `.tgz` 소스는 ClawPack으로 처리됩니다. CLI는 npm-pack의 정확한
  바이트를 업로드하고, 추출된 `package/` 콘텐츠는 검증 및
  메타데이터 사전 입력에만 사용합니다.
- 코드 Plugin 폴더는 업로드 전에 ClawPack npm tarball로 패키징되므로
  OpenClaw 설치 시 정확한 아티팩트를 검증할 수 있습니다. 번들 Plugin 폴더는 계속
  추출된 파일 게시 경로를 사용합니다.
- GitHub 소스의 경우 저장소, 확인된 커밋, ref 및 하위 경로를 바탕으로 소스 출처가 자동 입력됩니다.
- 로컬 폴더의 경우 origin 원격 저장소가 GitHub를 가리키면 로컬 git에서 소스 출처가 자동으로 감지됩니다.
- 외부 코드 Plugin은 `openclaw.compat.pluginApi` 및
  `openclaw.build.openclawVersion`을 명시적으로 선언해야 합니다.
  최상위 `package.json.version`은 게시 검증의 대체 값으로 사용되지 않습니다.
- `--dry-run`은 업로드하지 않고 확인된 게시 페이로드를 미리 보여 줍니다.
- `--json`은 CI용 머신 판독 가능 출력을 생성합니다.
- `--owner <handle>`은 실행 주체에 게시자 권한이 있는 경우 사용자 또는 조직 게시자 핸들로 게시합니다.
- 범위가 지정된 패키지 이름은 선택한 소유자와 일치해야 합니다. `docs/publishing.md`를 참조하십시오.
- 기존 플래그(`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`)도 계속 재정의 값으로 사용할 수 있습니다.
- 비공개 GitHub 저장소에는 `GITHUB_TOKEN`이 필요합니다.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 권장 로컬 흐름

실제 릴리스를 생성하기 전에 확인된 패키지 메타데이터와
소스 출처를 확인할 수 있도록 먼저 `--dry-run`을 사용하십시오.

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 로컬 폴더 흐름

코드 Plugin의 경우 폴더 게시를 수행하면 패키지 폴더에서 ClawPack 아티팩트를
빌드하고 업로드합니다.

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin`용 최소 `package.json`

외부 코드 Plugin은 `package.json`에 소량의 OpenClaw 메타데이터가
필요합니다. 다음 최소 매니페스트만으로 게시에 성공할 수 있습니다.

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

- `package.json.version`은 패키지 릴리스 버전이지만 OpenClaw
  호환성/빌드 검증의 대체 값으로 사용되지 않습니다.
- `openclaw.hostTargets`와 `openclaw.environment`는 선택적 메타데이터입니다.
  값이 있으면 ClawHub에 표시될 수 있지만 게시에 필수는 아닙니다.
- 더 자세한 호환성 메타데이터를 게시하려면
  `openclaw.compat.minGatewayVersion`과
  `openclaw.build.pluginSdkVersion`을 선택적으로 추가할 수 있습니다.
- 이전 `clawhub` CLI 릴리스를 사용하고 있다면 업로드 전에
  로컬 사전 검사가 실행되도록 게시하기 전에 업그레이드하십시오.
- 검증에서 해결 코드가 보고되면
  [Plugin 검증 수정 사항](/clawhub/plugin-validation-fixes)을 참조하십시오.

#### GitHub Actions

ClawHub는 Plugin 저장소용 공식 재사용 가능 워크플로도
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/package-publish.yml)에 제공합니다.

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

- 재사용 가능 워크플로의 `source` 기본값은 호출자 저장소입니다.
- 모노레포에서는 워크플로가 Plugin 패키지 폴더를 게시하도록
  `source_path`를 전달하십시오. 예: `source_path: extensions/codex`.
- 재사용 가능 워크플로를 안정 태그 또는 전체 커밋 SHA에 고정하십시오. `@main`에서 릴리스 게시를 실행하지 마십시오.
- CI가 게시물을 생성하지 않도록 `pull_request`에서는 `dry_run: true`를 사용해야 합니다.
- 실제 게시는 `workflow_dispatch` 또는 태그 푸시와 같은 신뢰할 수 있는 이벤트로 제한해야 합니다.
- 비밀 값 없는 신뢰할 수 있는 게시는 `workflow_dispatch`에서만 작동하며, 태그 푸시에는 여전히 `clawhub_token`이 필요합니다.
- 최초 게시, 신뢰할 수 없는 패키지 또는 비상 게시를 위해 `clawhub_token`을 사용할 수 있도록 유지하십시오.
- 워크플로는 JSON 결과를 아티팩트로 업로드하고 워크플로 출력으로 노출합니다.

### `package trusted-publisher get <name>`

- 패키지의 GitHub Actions 신뢰할 수 있는 게시자 구성을 표시합니다.
- 구성을 설정한 후 이 명령을 사용하여 저장소, 워크플로 파일 이름 및
  선택적 환경 고정을 확인하십시오.
- 플래그:
  - `--json`: 머신 판독 가능 출력입니다.

예:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 기존 패키지에 GitHub Actions 신뢰할 수 있는 게시자 구성을 연결하거나 교체합니다.
- 먼저 일반 수동 또는 토큰 인증 방식의
  `clawhub package publish`를 통해 패키지를 생성해야 합니다.
- 구성을 설정한 후에는 지원되는 향후 GitHub Actions 게시에서
  장기 ClawHub 토큰 없이 OIDC/신뢰할 수 있는 게시를 사용할 수 있습니다.
- `--repository <repo>`는 `owner/repo` 형식이어야 합니다.
- `--workflow-filename <file>`은 `.github/workflows/`의
  워크플로 파일 이름과 일치해야 합니다.
- `--environment <name>`은 선택 사항입니다. 구성한 경우 OIDC 클레임의
  GitHub Actions 환경이 정확히 일치해야 합니다.
- 이 명령이 실행되면 ClawHub가 구성된 GitHub 저장소를 검증합니다.
  공개 저장소는 공개 GitHub 메타데이터를 통해 검증할 수 있습니다. 비공개
  저장소를 검증하려면 향후 ClawHub GitHub App 설치 또는 다른 승인된
  GitHub 통합 등을 통해 ClawHub가 해당 저장소에 접근할 수 있어야 합니다.
- 플래그:
  - `--repository <repo>`: GitHub 저장소입니다. 예: `openclaw/example-plugin`.
  - `--workflow-filename <file>`: 워크플로 파일 이름입니다. 예: `package-publish.yml`.
  - `--environment <name>`: 선택적인 정확히 일치하는 GitHub Actions 환경입니다.
  - `--json`: 머신 판독 가능 출력입니다.

예:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 패키지에서 신뢰할 수 있는 게시자 구성을 제거합니다.
- 워크플로, 저장소 또는 환경 고정을 비활성화하거나 다시 생성해야 하는 경우
  롤백 용도로 사용하십시오.
- 구성을 다시 설정할 때까지 이후의 실제 게시에는 일반 인증 게시를 사용해야 합니다.
- 플래그:
  - `--json`: 머신 판독 가능 출력입니다.

예:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 설치 원격 측정

- 로그인한 상태에서 `clawhub install <slug>` 실행 후 전송됩니다. 단,
  `CLAWHUB_DISABLE_TELEMETRY=1`이 설정된 경우에는 전송되지 않습니다.
- 보고는 최선형 방식으로 수행됩니다. 원격 측정을 사용할 수 없어도 설치 명령은
  실패하지 않습니다.
- 자세한 내용: `docs/telemetry.md`.
