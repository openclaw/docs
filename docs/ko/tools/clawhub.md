---
read_when:
    - Skills 또는 Plugin 검색, 설치 또는 업데이트
    - 레지스트리에 Skills 또는 Plugin 게시하기
    - clawhub CLI 또는 해당 환경 오버라이드 구성하기
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills 및 Plugin을 위한 공개 레지스트리, 네이티브 설치 흐름, clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T06:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub은 **OpenClaw Skills 및 Plugin**을 위한 공개 레지스트리입니다.

- 기본 `openclaw` 명령을 사용해 Skills를 검색, 설치, 업데이트하고 ClawHub에서 Plugin을 설치합니다.
- 레지스트리 인증, 게시, 삭제/삭제 취소, 동기화 워크플로에는 별도의 `clawhub` CLI를 사용합니다.

사이트: [clawhub.ai](https://clawhub.ai)

## 빠른 시작

<Steps>
  <Step title="검색">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="설치">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="사용">
    새 OpenClaw 세션을 시작하면 새 Skills가 반영됩니다.
  </Step>
  <Step title="게시(선택 사항)">
    레지스트리 인증 워크플로(게시, 동기화, 관리)의 경우 별도의 `clawhub` CLI를 설치합니다.

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 기본 OpenClaw 흐름

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    기본 `openclaw` 명령은 활성 워크스페이스에 설치하고 소스 메타데이터를 유지하므로 이후 `update` 호출이 ClawHub를 계속 사용할 수 있습니다.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    npm에 안전한 단순 Plugin 명세도 npm보다 먼저 ClawHub에서 시도됩니다.

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    ClawHub 조회 없이 npm 전용 해석을 원할 때는 `npm:<package>`를 사용합니다.

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 설치는 아카이브 설치가 실행되기 전에 광고된 `pluginApi` 및 `minGatewayVersion` 호환성을 검증하므로, 호환되지 않는 호스트는 패키지가 부분적으로 설치되는 대신 초기에 안전하게 실패합니다.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...`는 설치 가능한 Plugin 계열만 허용합니다. ClawHub 패키지가 실제로 Skills인 경우 OpenClaw는 중단하고 대신 `openclaw skills install <slug>`를 안내합니다.

익명 ClawHub Plugin 설치도 비공개 패키지에 대해 안전하게 실패합니다. 커뮤니티 또는 기타 비공식 채널은 여전히 설치할 수 있지만, OpenClaw는 운영자가 활성화 전에 소스와 검증 상태를 검토할 수 있도록 경고합니다.
</Note>

## ClawHub이란

- OpenClaw Skills 및 Plugin을 위한 공개 레지스트리입니다.
- Skills 번들과 메타데이터의 버전 관리 저장소입니다.
- 검색, 태그, 사용 신호를 위한 탐색 화면입니다.

일반적인 Skills는 다음을 포함하는 버전 관리된 파일 번들입니다.

- 기본 설명과 사용법이 들어 있는 `SKILL.md` 파일.
- Skills에서 사용하는 선택적 구성, 스크립트 또는 지원 파일.
- 태그, 요약, 설치 요구 사항과 같은 메타데이터.

ClawHub은 메타데이터를 사용해 탐색을 지원하고 Skills 기능을 안전하게 노출합니다. 레지스트리는 사용 신호(별표, 다운로드)를 추적해 순위와 가시성을 개선합니다. 게시할 때마다 새 semver 버전이 생성되며, 레지스트리는 사용자가 변경 사항을 감사할 수 있도록 버전 기록을 보관합니다.

## 워크스페이스 및 Skills 로딩

별도의 `clawhub` CLI도 현재 작업 디렉터리 아래의 `./skills`에 Skills를 설치합니다. OpenClaw 워크스페이스가 구성되어 있으면, `--workdir`(또는 `CLAWHUB_WORKDIR`)로 재정의하지 않는 한 `clawhub`은 해당 워크스페이스로 대체합니다. OpenClaw는 `<workspace>/skills`에서 워크스페이스 Skills를 로드하고 **다음** 세션에서 이를 반영합니다.

이미 `~/.openclaw/skills` 또는 번들 Skills를 사용하는 경우 워크스페이스 Skills가 우선합니다. Skills가 로드, 공유, 제한되는 방식에 대한 자세한 내용은 [Skills](/ko/tools/skills)를 참조하세요.

## 서비스 기능

| 기능                     | 참고                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 공개 탐색                | Skills 및 해당 `SKILL.md` 콘텐츠를 공개적으로 볼 수 있습니다.       |
| 검색                     | 단순 키워드가 아니라 임베딩 기반(벡터 검색)입니다.                  |
| 버전 관리                | Semver, 변경 로그, 태그(`latest` 포함).                             |
| 다운로드                 | 버전별 Zip.                                                         |
| 별표 및 댓글            | 커뮤니티 피드백.                                                    |
| 보안 스캔 요약           | 상세 페이지는 설치 또는 다운로드 전에 최신 스캔 상태를 표시합니다. |
| 스캐너 상세 페이지       | VirusTotal, ClawScan, 정적 분석 결과에는 딥 링크가 있습니다.        |
| 소유자 복구 대시보드     | 게시자는 `/dashboard`에서 스캔으로 보류된 소유 콘텐츠를 볼 수 있습니다. |
| 소유자 요청 재스캔       | 소유자는 오탐 복구를 위해 제한된 재스캔을 요청할 수 있습니다.       |
| 검토                     | 승인 및 감사.                                                       |
| CLI 친화적 API           | 자동화 및 스크립팅에 적합합니다.                                    |

## 보안 및 검토

ClawHub은 기본적으로 열려 있습니다. 누구나 Skills를 업로드할 수 있지만 게시하려면 GitHub 계정이 **최소 1주일 이상** 되어야 합니다. 이는 정상적인 기여자를 차단하지 않으면서 악용을 늦춥니다.

<AccordionGroup>
  <Accordion title="보안 스캔">
    ClawHub은 게시된 Skills 및 Plugin 릴리스에 대해 자동 보안 검사를 실행합니다. 공개 상세 페이지는 현재 결과를 요약하고, 스캐너 행은 VirusTotal, ClawScan, 정적 분석 전용 상세 페이지로 연결됩니다.

    스캔으로 보류되거나 차단된 릴리스는 공개 카탈로그 및 설치 화면에서 사용할 수 없을 수 있지만, 소유자의 `/dashboard`에는 계속 표시됩니다.

  </Accordion>
  <Accordion title="신고">
    - 로그인한 모든 사용자는 Skills를 신고할 수 있습니다.
    - 신고 사유는 필수이며 기록됩니다.
    - 각 사용자는 한 번에 최대 20개의 활성 신고를 보유할 수 있습니다.
    - 고유 신고가 3개를 초과한 Skills는 기본적으로 자동 숨김 처리됩니다.

  </Accordion>
  <Accordion title="검토">
    - 검토자는 숨겨진 Skills를 보고, 숨김 해제하고, 삭제하거나 사용자를 차단할 수 있습니다.
    - 신고 기능을 악용하면 계정 차단으로 이어질 수 있습니다.
    - 검토자가 되는 데 관심이 있나요? OpenClaw Discord에서 문의하고 검토자 또는 메인테이너에게 연락하세요.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

게시/동기화 같은 레지스트리 인증 워크플로에만 필요합니다.

### 전역 옵션

<ParamField path="--workdir <dir>" type="string">
  작업 디렉터리입니다. 기본값: 현재 디렉터리, OpenClaw 워크스페이스로 대체됩니다.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  workdir 기준 상대 경로의 Skills 디렉터리입니다.
</ParamField>
<ParamField path="--site <url>" type="string">
  사이트 기본 URL입니다(브라우저 로그인).
</ParamField>
<ParamField path="--registry <url>" type="string">
  레지스트리 API 기본 URL입니다.
</ParamField>
<ParamField path="--no-input" type="boolean">
  프롬프트를 비활성화합니다(비대화형).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI 버전을 출력합니다.
</ParamField>

### 명령

<AccordionGroup>
  <Accordion title="인증(로그인 / 로그아웃 / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    로그인 옵션:

    - `--token <token>` — API 토큰을 붙여 넣습니다.
    - `--label <label>` — 브라우저 로그인 토큰에 저장되는 레이블입니다(기본값: `CLI token`).
    - `--no-browser` — 브라우저를 열지 않습니다(`--token` 필요).

  </Accordion>
  <Accordion title="검색">
    ```bash
    clawhub search "query"
    ```

    Skills를 검색합니다. Plugin/패키지 탐색에는 `clawhub package explore`를 사용합니다.

    - `--limit <n>` — 최대 결과 수입니다.

  </Accordion>
  <Accordion title="Plugin 탐색 / 검사">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` 및 `package inspect`는 Plugin/패키지 탐색과 메타데이터 검사를 위한 ClawHub CLI 화면입니다. 기본 OpenClaw 설치는 여전히 `openclaw plugins install clawhub:<package>`를 사용합니다.

    옵션:

    - `--family skill|code-plugin|bundle-plugin` — 패키지 계열을 필터링합니다.
    - `--official` — 공식 패키지만 표시합니다.
    - `--executes-code` — 코드를 실행하는 패키지만 표시합니다.
    - `--version <version>` / `--tag <tag>` — 특정 패키지 버전을 검사합니다.
    - `--versions`, `--files`, `--file <path>` — 패키지 기록과 파일을 검사합니다.
    - `--json` — 기계가 읽을 수 있는 출력입니다.

  </Accordion>
  <Accordion title="설치 / 업데이트 / 목록">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    옵션:

    - `--version <version>` — 특정 버전으로 설치하거나 업데이트합니다(`update`에서는 단일 slug에만 해당).
    - `--force` — 폴더가 이미 있거나 로컬 파일이 게시된 어떤 버전과도 일치하지 않을 때 덮어씁니다.
    - `clawhub list`는 `.clawhub/lock.json`을 읽습니다.

  </Accordion>
  <Accordion title="Skills 게시">
    ```bash
    clawhub skill publish <path>
    ```

    옵션:

    - `--slug <slug>` — Skills slug입니다.
    - `--name <name>` — 표시 이름입니다.
    - `--version <version>` — semver 버전입니다.
    - `--changelog <text>` — 변경 로그 텍스트입니다(비어 있을 수 있음).
    - `--tags <tags>` — 쉼표로 구분된 태그입니다(기본값: `latest`).

  </Accordion>
  <Accordion title="Plugin 게시">
    ```bash
    clawhub package publish <source>
    ```

    `<source>`는 로컬 폴더, `owner/repo`, `owner/repo@ref` 또는 GitHub URL일 수 있습니다.

    옵션:

    - `--dry-run` — 아무것도 업로드하지 않고 정확한 게시 계획을 빌드합니다.
    - `--json` — CI용 기계 판독 가능 출력을 내보냅니다.
    - `--source-repo`, `--source-commit`, `--source-ref` — 자동 감지만으로 충분하지 않을 때의 선택적 재정의입니다.

  </Accordion>
  <Accordion title="재스캔 요청">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    재스캔 명령에는 로그인한 소유자 토큰이 필요하며, 최신 게시 Skills 버전 또는 Plugin 릴리스를 대상으로 합니다. 비대화형 실행에서는 `--yes`를 전달합니다.

    JSON 응답에는 대상 종류, 이름, 버전, 재스캔 상태, 해당 버전 또는 릴리스의 남은/최대 요청 횟수가 포함됩니다.

  </Accordion>
  <Accordion title="삭제 / 삭제 취소(소유자 또는 관리자)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="동기화(로컬 스캔 + 신규 또는 업데이트 게시)">
    ```bash
    clawhub sync
    ```

    옵션:

    - `--root <dir...>` — 추가 스캔 루트입니다.
    - `--all` — 프롬프트 없이 모든 항목을 업로드합니다.
    - `--dry-run` — 업로드될 내용을 표시합니다.
    - `--bump <type>` — 업데이트에 사용할 `patch|minor|major`입니다(기본값: `patch`).
    - `--changelog <text>` — 비대화형 업데이트용 변경 로그입니다.
    - `--tags <tags>` — 쉼표로 구분된 태그입니다(기본값: `latest`).
    - `--concurrency <n>` — 레지스트리 검사입니다(기본값: `4`).

  </Accordion>
</AccordionGroup>

## 일반 워크플로

<Tabs>
  <Tab title="검색">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Plugin 찾기">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="설치">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="모두 업데이트">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="단일 skill 게시">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="여러 skills 동기화">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="GitHub에서 Plugin 게시">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin 패키지 메타데이터

코드 plugins는 `package.json`에 필요한 OpenClaw 메타데이터를 포함해야 합니다.

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

게시된 패키지는 **빌드된 JavaScript**를 함께 배포하고 `runtimeExtensions`가 해당 출력을 가리키도록 해야 합니다. Git 체크아웃 설치는 빌드된 파일이 없을 때 여전히 TypeScript 소스로 폴백할 수 있지만, 빌드된 런타임 엔트리는 시작, doctor, Plugin 로딩 경로에서 런타임 TypeScript 컴파일을 피합니다.

## 버전 관리, lockfile, 텔레메트리

<AccordionGroup>
  <Accordion title="버전 관리 및 태그">
    - 게시할 때마다 새 **semver** `SkillVersion`이 생성됩니다.
    - 태그(예: `latest`)는 버전을 가리킵니다. 태그를 이동하면 롤백할 수 있습니다.
    - 변경 로그는 버전별로 첨부되며, 동기화하거나 업데이트를 게시할 때 비어 있을 수 있습니다.

  </Accordion>
  <Accordion title="로컬 변경 사항과 레지스트리 버전">
    업데이트는 콘텐츠 해시를 사용해 로컬 skill 콘텐츠를 레지스트리 버전과 비교합니다. 로컬 파일이 게시된 어떤 버전과도 일치하지 않으면 CLI는 덮어쓰기 전에 확인을 요청합니다(또는 비대화형 실행에서는 `--force`가 필요합니다).
  </Accordion>
  <Accordion title="동기화 스캔 및 폴백 루트">
    `clawhub sync`는 먼저 현재 작업 디렉터리를 스캔합니다. skills를 찾지 못하면 알려진 레거시 위치(예: `~/openclaw/skills` 및 `~/.openclaw/skills`)로 폴백합니다. 이는 추가 플래그 없이 이전 skill 설치를 찾도록 설계되었습니다.
  </Accordion>
  <Accordion title="저장소 및 lockfile">
    - 설치된 skills는 작업 디렉터리 아래 `.clawhub/lock.json`에 기록됩니다.
    - 인증 토큰은 ClawHub CLI 구성 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의 가능).

  </Accordion>
  <Accordion title="텔레메트리(설치 수)">
    로그인한 상태에서 `clawhub sync`를 실행하면 CLI가 설치 수를 계산하기 위해 최소한의 스냅샷을 전송합니다. 이를 완전히 비활성화할 수 있습니다.

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수

| 변수                          | 효과                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 사이트 URL을 재정의합니다.                      |
| `CLAWHUB_REGISTRY`            | 레지스트리 API URL을 재정의합니다.              |
| `CLAWHUB_CONFIG_PATH`         | CLI가 토큰/구성을 저장하는 위치를 재정의합니다. |
| `CLAWHUB_WORKDIR`             | 기본 작업 디렉터리를 재정의합니다.              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync`의 텔레메트리를 비활성화합니다.           |

## 관련 항목

- [커뮤니티 plugins](/ko/plugins/community)
- [Plugins](/ko/tools/plugin)
- [Skills](/ko/tools/skills)
