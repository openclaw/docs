---
read_when:
    - Skills 또는 Plugin 검색, 설치 또는 업데이트
    - Skills 또는 Plugin을 레지스트리에 게시하기
    - clawhub CLI 또는 환경 재정의 구성하기
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills와 Plugin을 위한 공개 레지스트리, 네이티브 설치 흐름 및 clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T06:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub는 **OpenClaw Skills 및 plugins**를 위한 공개 레지스트리입니다.

- 네이티브 `openclaw` 명령을 사용해 Skills를 검색, 설치, 업데이트하고 ClawHub에서 plugins를 설치합니다.
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
    새 OpenClaw 세션을 시작하면 새 Skill이 적용됩니다.
  </Step>
  <Step title="게시(선택 사항)">
    레지스트리 인증 워크플로(게시, 동기화, 관리)의 경우
    별도의 `clawhub` CLI를 설치합니다.

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 네이티브 OpenClaw 흐름

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    네이티브 `openclaw` 명령은 활성 워크스페이스에 설치하고
    소스 메타데이터를 유지하므로 이후 `update` 호출이 ClawHub를 계속 사용할 수 있습니다.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search`는 ClawHub Plugin 카탈로그를 쿼리하고 바로 설치할 수 있는
    패키지 이름을 출력합니다. ClawHub 해석을 원할 때는 `clawhub:<package>`를 사용하세요.
    단순 npm 안전 Plugin 사양은 출시 전환 기간 동안 npm에서 설치됩니다.

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>`도 npm 전용이며, 사양이 모호할 수 있을 때 유용합니다.

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 설치는 아카이브 설치가 실행되기 전에 광고된 `pluginApi` 및
    `minGatewayVersion` 호환성을 검증하므로, 호환되지 않는 호스트는 패키지를 부분적으로 설치하는 대신 초기에 닫힌 상태로 실패합니다.
    패키지 버전이 ClawPack 아티팩트를 게시하면 OpenClaw는 업로드된 정확한 npm-pack `.tgz`를 우선 사용하고, ClawHub
    다이제스트 헤더와 다운로드된 바이트를 검증하며, 이후 업데이트를 위해 아티팩트 종류, npm
    무결성, npm shasum, tarball 이름, ClawPack 다이제스트 메타데이터를 기록합니다.
    ClawPack 메타데이터가 없는 이전 패키지 버전은 계속 기존 패키지 아카이브 검증 경로를 사용합니다.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...`는 설치 가능한 Plugin
패밀리만 허용합니다. ClawHub 패키지가 실제로 Skill이면 OpenClaw는 중지하고
대신 `openclaw skills install <slug>`를 안내합니다.

익명 ClawHub Plugin 설치도 비공개 패키지에 대해서는 닫힌 상태로 실패합니다.
커뮤니티 또는 기타 비공식 채널은 여전히 설치할 수 있지만, OpenClaw는
운영자가 활성화 전에 소스와 검증을 검토할 수 있도록 경고합니다.
</Note>

## ClawHub란

- OpenClaw Skills 및 plugins를 위한 공개 레지스트리입니다.
- Skill 번들과 메타데이터의 버전 관리 저장소입니다.
- 검색, 태그, 사용 신호를 위한 발견 화면입니다.

일반적인 Skill은 다음을 포함하는 파일의 버전 관리 번들입니다.

- 기본 설명과 사용법이 포함된 `SKILL.md` 파일.
- Skill에서 사용하는 선택적 설정, 스크립트 또는 지원 파일.
- 태그, 요약, 설치 요구 사항 같은 메타데이터.

ClawHub는 메타데이터를 사용해 발견 기능을 제공하고 Skill
기능을 안전하게 노출합니다. 레지스트리는 사용 신호(별표, 다운로드)를 추적해
순위와 가시성을 개선합니다. 각 게시는 새 semver
버전을 만들고, 레지스트리는 버전 기록을 보관하므로 사용자가 변경 사항을 감사할 수 있습니다.

## 워크스페이스 및 Skill 로딩

별도의 `clawhub` CLI도 현재 작업 디렉터리 아래의 `./skills`에
Skills를 설치합니다. OpenClaw 워크스페이스가 구성되어 있으면
`clawhub`는 `--workdir`(또는 `CLAWHUB_WORKDIR`)을 재정의하지 않는 한 해당 워크스페이스로 대체합니다.
OpenClaw는 `<workspace>/skills`에서 워크스페이스 Skills를 로드하며 **다음** 세션에서 이를 적용합니다.

이미 `~/.openclaw/skills` 또는 번들 Skills를 사용하고 있다면 워크스페이스
Skills가 우선합니다. Skills가 로드, 공유, 게이트되는 방식에 대한 자세한 내용은
[Skills](/ko/tools/skills)를 참조하세요.

## 서비스 기능

| 기능                     | 참고                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 공개 탐색                | Skills와 해당 `SKILL.md` 콘텐츠를 공개적으로 볼 수 있습니다.        |
| 검색                     | 키워드뿐 아니라 임베딩 기반(벡터 검색)입니다.                       |
| 버전 관리                | Semver, 변경 로그, 태그(`latest` 포함).                             |
| 다운로드                 | 버전별 Zip.                                                         |
| 별표 및 댓글             | 커뮤니티 피드백.                                                    |
| 보안 스캔 요약           | 상세 페이지는 설치 또는 다운로드 전에 최신 스캔 상태를 보여줍니다. |
| 스캐너 상세 페이지       | VirusTotal, ClawScan, 정적 분석 결과에는 딥 링크가 있습니다.        |
| 소유자 복구 대시보드     | 게시자는 `/dashboard`에서 스캔 보류된 소유 콘텐츠를 볼 수 있습니다. |
| 소유자 요청 재스캔       | 소유자는 오탐 복구를 위해 제한된 재스캔을 요청할 수 있습니다.       |
| 모더레이션               | 승인 및 감사.                                                       |
| CLI 친화적 API           | 자동화와 스크립팅에 적합합니다.                                     |

## 보안 및 모더레이션

ClawHub는 기본적으로 열려 있습니다. 누구나 Skills를 업로드할 수 있지만, 게시하려면 GitHub
계정이 **최소 1주일 이상**이어야 합니다. 이렇게 하면 정상적인 기여자를 차단하지 않으면서
악용을 늦출 수 있습니다.

<AccordionGroup>
  <Accordion title="보안 스캔">
    ClawHub는 게시된 Skills와 Plugin
    릴리스에 대해 자동 보안 검사를 실행합니다. 공개 상세 페이지는 현재 결과를 요약하고, 스캐너
    행은 VirusTotal, ClawScan, 정적 분석 전용 상세 페이지로 연결됩니다.

    스캔 보류 또는 차단된 릴리스는 공개 카탈로그와 설치 화면에서 사용할 수 없을 수 있지만,
    소유자는 `/dashboard`에서 계속 볼 수 있습니다.

  </Accordion>
  <Accordion title="보고">
    - 로그인한 모든 사용자는 Skill을 보고할 수 있습니다.
    - 보고 사유는 필수이며 기록됩니다.
    - 각 사용자는 한 번에 최대 20개의 활성 보고를 가질 수 있습니다.
    - 고유 보고가 3개를 초과하는 Skills는 기본적으로 자동 숨김 처리됩니다.

  </Accordion>
  <Accordion title="모더레이션">
    - 모더레이터는 숨겨진 Skills를 보고, 숨김을 해제하고, 삭제하거나 사용자를 차단할 수 있습니다.
    - 보고 기능을 악용하면 계정 차단으로 이어질 수 있습니다.
    - 모더레이터가 되는 데 관심이 있나요? OpenClaw Discord에서 문의하고 모더레이터 또는 유지관리자에게 연락하세요.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

게시/동기화 같은 레지스트리 인증 워크플로에만 필요합니다.

### 전역 옵션

<ParamField path="--workdir <dir>" type="string">
  작업 디렉터리. 기본값: 현재 디렉터리이며, OpenClaw 워크스페이스로 대체됩니다.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 디렉터리이며 workdir 기준 상대 경로입니다.
</ParamField>
<ParamField path="--site <url>" type="string">
  사이트 기본 URL(브라우저 로그인).
</ParamField>
<ParamField path="--registry <url>" type="string">
  레지스트리 API 기본 URL.
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

    - `--token <token>` - API 토큰을 붙여넣습니다.
    - `--label <label>` - 브라우저 로그인 토큰에 저장되는 레이블(기본값: `CLI token`).
    - `--no-browser` - 브라우저를 열지 않습니다(`--token` 필요).

  </Accordion>
  <Accordion title="검색">
    ```bash
    clawhub search "query"
    ```

    Skills를 검색합니다. Plugin/패키지 발견에는 `clawhub package explore`를 사용하세요.

    - `--limit <n>` - 최대 결과 수.

  </Accordion>
  <Accordion title="Plugins 탐색 / 검사">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore`와 `package inspect`는 Plugin/패키지 발견 및 메타데이터 검사를 위한 ClawHub CLI 화면입니다. 네이티브 OpenClaw 설치는 계속 `openclaw plugins install clawhub:<package>`를 사용합니다.

    옵션:

    - `--family skill|code-plugin|bundle-plugin` - 패키지 패밀리를 필터링합니다.
    - `--official` - 공식 패키지만 표시합니다.
    - `--executes-code` - 코드를 실행하는 패키지만 표시합니다.
    - `--version <version>` / `--tag <tag>` - 특정 패키지 버전을 검사합니다.
    - `--versions`, `--files`, `--file <path>` - 패키지 기록과 파일을 검사합니다.
    - `--json` - 기계 판독 가능 출력.

  </Accordion>
  <Accordion title="설치 / 업데이트 / 목록">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    옵션:

    - `--version <version>` - 특정 버전으로 설치 또는 업데이트합니다(`update`에서는 단일 slug만).
    - `--force` - 폴더가 이미 있거나 로컬 파일이 게시된 어떤 버전과도 일치하지 않을 때 덮어씁니다.
    - `clawhub list`는 `.clawhub/lock.json`을 읽습니다.

  </Accordion>
  <Accordion title="Skills 게시">
    ```bash
    clawhub skill publish <path>
    ```

    옵션:

    - `--slug <slug>` - Skill slug.
    - `--name <name>` - 표시 이름.
    - `--version <version>` - semver 버전.
    - `--changelog <text>` - 변경 로그 텍스트(비워 둘 수 있음).
    - `--tags <tags>` - 쉼표로 구분된 태그(기본값: `latest`).

  </Accordion>
  <Accordion title="Plugins 게시">
    ```bash
    clawhub package publish <source>
    ```

    `<source>`는 로컬 폴더, `owner/repo`, `owner/repo@ref` 또는
    GitHub URL일 수 있습니다.

    옵션:

    - `--dry-run` - 아무것도 업로드하지 않고 정확한 게시 계획을 빌드합니다.
    - `--json` - CI용 기계 판독 가능 출력을 내보냅니다.
    - `--source-repo`, `--source-commit`, `--source-ref` - 자동 감지가 충분하지 않을 때 사용하는 선택적 재정의.

  </Accordion>
  <Accordion title="재스캔 요청">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    재스캔 명령에는 로그인한 소유자 토큰이 필요하며 최신
    게시된 Skill 버전 또는 Plugin 릴리스를 대상으로 합니다. 비대화형 실행에서는
    `--yes`를 전달하세요.

    JSON 응답에는 대상 종류, 이름, 버전, 재스캔 상태, 해당 버전 또는 릴리스의
    남은/최대 요청 수가 포함됩니다.

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

    - `--root <dir...>` - 추가 스캔 루트.
    - `--all` - 프롬프트 없이 모든 항목을 업로드합니다.
    - `--dry-run` - 업로드될 내용을 표시합니다.
    - `--bump <type>` - 업데이트에 사용할 `patch|minor|major`(기본값: `patch`).
    - `--changelog <text>` - 비대화형 업데이트용 변경 로그.
    - `--tags <tags>` - 쉼표로 구분된 태그(기본값: `latest`).
    - `--concurrency <n>` - 레지스트리 검사(기본값: `4`).

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
  <Tab title="여러 skill 동기화">
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

코드 Plugin은 `package.json`에 필수 OpenClaw 메타데이터를 포함해야 합니다.

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

게시된 패키지는 **빌드된 JavaScript**를 제공하고 `runtimeExtensions`가 해당 출력물을 가리키도록 해야 합니다. Git 체크아웃 설치는 빌드된 파일이 없을 때 여전히 TypeScript 소스로 폴백할 수 있지만, 빌드된 런타임 항목은 시작, doctor, Plugin 로딩 경로에서 런타임 TypeScript 컴파일을 피합니다.

## 버전 관리, lockfile, telemetry

<AccordionGroup>
  <Accordion title="버전 관리 및 태그">
    - 게시할 때마다 새 **semver** `SkillVersion`이 생성됩니다.
    - 태그(예: `latest`)는 버전을 가리킵니다. 태그를 이동하면 롤백할 수 있습니다.
    - 변경 로그는 버전별로 첨부되며, 업데이트를 동기화하거나 게시할 때 비어 있을 수 있습니다.

  </Accordion>
  <Accordion title="로컬 변경 사항과 registry 버전">
    업데이트는 콘텐츠 해시를 사용해 로컬 skill 콘텐츠를 registry 버전과 비교합니다. 로컬 파일이 게시된 어떤 버전과도 일치하지 않으면 CLI는 덮어쓰기 전에 확인을 요청합니다(또는 비대화형 실행에서는 `--force`가 필요합니다).
  </Accordion>
  <Accordion title="동기화 스캔 및 폴백 루트">
    `clawhub sync`는 먼저 현재 작업 디렉터리를 스캔합니다. skill을 찾지 못하면 알려진 레거시 위치(예: `~/openclaw/skills` 및 `~/.openclaw/skills`)로 폴백합니다. 이는 추가 플래그 없이 이전 skill 설치를 찾도록 설계되었습니다.
  </Accordion>
  <Accordion title="스토리지 및 lockfile">
    - 설치된 skill은 작업 디렉터리 아래 `.clawhub/lock.json`에 기록됩니다.
    - 인증 토큰은 ClawHub CLI 설정 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의).

  </Accordion>
  <Accordion title="Telemetry(설치 횟수)">
    로그인한 상태에서 `clawhub sync`를 실행하면 CLI는 설치 횟수를 계산하기 위해 최소한의 스냅샷을 보냅니다. 이를 완전히 비활성화할 수 있습니다.

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수

| 변수                          | 효과                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | 사이트 URL을 재정의합니다.                      |
| `CLAWHUB_REGISTRY`            | registry API URL을 재정의합니다.                |
| `CLAWHUB_CONFIG_PATH`         | CLI가 토큰/설정을 저장하는 위치를 재정의합니다. |
| `CLAWHUB_WORKDIR`             | 기본 작업 디렉터리를 재정의합니다.              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync`에서 telemetry를 비활성화합니다.          |

## 관련 항목

- [커뮤니티 Plugin](/ko/plugins/community)
- [Plugin](/ko/tools/plugin)
- [Skills](/ko/tools/skills)
