---
read_when:
    - Skills 또는 Plugin 검색, 설치 또는 업데이트
    - 레지스트리에 Skills 또는 Plugin 게시
    - clawhub CLI 또는 해당 환경 재정의 구성
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills 및 Plugin용 공개 레지스트리, 네이티브 설치 흐름, 그리고 clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:39:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub는 **OpenClaw Skills 및 Plugin**을 위한 공개 레지스트리입니다.

- Skills 검색, 설치, 업데이트와 ClawHub에서 Plugin 설치에는 네이티브 `openclaw` 명령을 사용하세요.
- 레지스트리 인증, 게시, 삭제/삭제 취소, 동기화 워크플로에는 별도의 `clawhub` CLI를 사용하세요.

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
    새 OpenClaw 세션을 시작하세요 — 새 Skill이 반영됩니다.
  </Step>
  <Step title="게시(선택 사항)">
    레지스트리 인증이 필요한 워크플로(게시, 동기화, 관리)에는
    별도의 `clawhub` CLI를 설치하세요:

    ```bash
    npm i -g clawhub
    # 또는
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
    소스 메타데이터를 유지하므로 이후 `update` 호출도 ClawHub를 계속 사용할 수 있습니다.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    npm에 안전한 형식의 Plugin 지정자만 써도 npm보다 먼저 ClawHub에서 시도합니다:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Plugin 설치는 아카이브 설치를 실행하기 전에 광고된 `pluginApi`와
    `minGatewayVersion` 호환성을 검증하므로,
    호스트가 호환되지 않으면 패키지가 부분 설치되는 대신 초기에 안전하게 실패합니다.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...`는 설치 가능한 Plugin
패밀리만 허용합니다. ClawHub 패키지가 실제로는 Skill이면 OpenClaw는 중단하고
대신 `openclaw skills install <slug>`를 안내합니다.

익명 ClawHub Plugin 설치도 비공개 패키지에 대해서는 안전하게 실패합니다.
커뮤니티 또는 기타 비공식 채널은 여전히 설치할 수 있지만, OpenClaw는
활성화 전에 운영자가 소스와 검증 상태를 검토할 수 있도록 경고를 표시합니다.
</Note>

## ClawHub란 무엇인가

- OpenClaw Skills 및 Plugin용 공개 레지스트리
- Skill 번들과 메타데이터의 버전 관리 저장소
- 검색, 태그, 사용 신호를 위한 발견 표면

일반적인 Skill은 파일로 이루어진 버전 관리 번들이며 다음을 포함합니다:

- 기본 설명과 사용법이 들어 있는 `SKILL.md` 파일
- Skill이 사용하는 선택적 구성, 스크립트 또는 보조 파일
- 태그, 요약, 설치 요구 사항 같은 메타데이터

ClawHub는 메타데이터를 사용해 검색을 지원하고 Skill
기능을 안전하게 노출합니다. 레지스트리는 사용 신호(별점, 다운로드 수)를 추적하여
순위와 가시성을 개선합니다. 각 게시마다 새로운 semver
버전이 생성되며, 레지스트리는 사용자가 변경 사항을 감사할 수 있도록
버전 기록을 유지합니다.

## 워크스페이스 및 Skill 로딩

별도의 `clawhub` CLI도 현재 작업 디렉터리 아래
`./skills`에 Skills를 설치합니다. OpenClaw 워크스페이스가 구성되어 있으면
`clawhub`는 `--workdir`
(또는 `CLAWHUB_WORKDIR`)로 재정의하지 않는 한 해당 워크스페이스로 대체합니다. OpenClaw는
`<workspace>/skills`에서 워크스페이스 Skills를 로드하고 **다음** 세션에서 이를 반영합니다.

이미 `~/.openclaw/skills` 또는 번들된 Skills를 사용 중이라면
워크스페이스 Skills가 우선합니다. Skills가 어떻게 로드되고,
공유되고, 게이트되는지에 대한 자세한 내용은 [Skills](/ko/tools/skills)를 참조하세요.

## 서비스 기능

| 기능               | 참고 사항                                                    |
| ------------------ | ------------------------------------------------------------ |
| 공개 탐색          | Skills와 해당 `SKILL.md` 콘텐츠는 공개적으로 볼 수 있습니다. |
| 검색               | 키워드만이 아니라 임베딩 기반(벡터 검색)입니다.              |
| 버전 관리          | Semver, 변경 로그, 태그(`latest` 포함).                      |
| 다운로드           | 버전별 Zip.                                                  |
| 별점 및 댓글       | 커뮤니티 피드백.                                             |
| 검토               | 승인 및 감사.                                                |
| CLI 친화적 API     | 자동화 및 스크립팅에 적합.                                   |

## 보안 및 검토

ClawHub는 기본적으로 개방형입니다 — 누구나 Skills를 업로드할 수 있지만,
게시하려면 GitHub 계정이 **최소 1주일 이상** 되어야 합니다. 이는
정상적인 기여자를 막지 않으면서 악용을 늦추기 위한 조치입니다.

<AccordionGroup>
  <Accordion title="신고">
    - 로그인한 모든 사용자는 Skill을 신고할 수 있습니다.
    - 신고 사유는 필수이며 기록됩니다.
    - 각 사용자는 한 번에 최대 20개의 활성 신고를 가질 수 있습니다.
    - 고유한 신고가 3개를 초과한 Skills는 기본적으로 자동 숨김 처리됩니다.
  </Accordion>
  <Accordion title="검토">
    - 검토자는 숨겨진 Skills를 보고, 숨김 해제하거나, 삭제하거나, 사용자를 차단할 수 있습니다.
    - 신고 기능을 악용하면 계정 차단이 될 수 있습니다.
    - 검토자가 되고 싶으신가요? OpenClaw Discord에서 문의하고 검토자 또는 유지 관리자에게 연락하세요.
  </Accordion>
</AccordionGroup>

## ClawHub CLI

이 도구는 게시/동기화 같은 레지스트리 인증 워크플로에만 필요합니다.

### 전역 옵션

<ParamField path="--workdir <dir>" type="string">
  작업 디렉터리. 기본값: 현재 디렉터리; OpenClaw 워크스페이스로 대체될 수 있습니다.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  workdir 기준 Skills 디렉터리.
</ParamField>
<ParamField path="--site <url>" type="string">
  사이트 기본 URL(브라우저 로그인).
</ParamField>
<ParamField path="--registry <url>" type="string">
  레지스트리 API 기본 URL.
</ParamField>
<ParamField path="--no-input" type="boolean">
  프롬프트 비활성화(비대화형).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI 버전 출력.
</ParamField>

### 명령

<AccordionGroup>
  <Accordion title="인증 (login / logout / whoami)">
    ```bash
    clawhub login              # 브라우저 흐름
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    로그인 옵션:

    - `--token <token>` — API 토큰 붙여넣기.
    - `--label <label>` — 브라우저 로그인 토큰에 저장할 레이블(기본값: `CLI token`).
    - `--no-browser` — 브라우저를 열지 않음(`--token` 필요).

  </Accordion>
  <Accordion title="검색">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — 최대 결과 수.

  </Accordion>
  <Accordion title="설치 / 업데이트 / 목록">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    옵션:

    - `--version <version>` — 특정 버전으로 설치 또는 업데이트(`update`에서는 단일 slug에만 적용).
    - `--force` — 폴더가 이미 존재하거나 로컬 파일이 게시된 어떤 버전과도 일치하지 않을 때 덮어쓰기.
    - `clawhub list`는 `.clawhub/lock.json`을 읽습니다.

  </Accordion>
  <Accordion title="Skills 게시">
    ```bash
    clawhub skill publish <path>
    ```

    옵션:

    - `--slug <slug>` — Skill slug.
    - `--name <name>` — 표시 이름.
    - `--version <version>` — semver 버전.
    - `--changelog <text>` — 변경 로그 텍스트(비워 둘 수 있음).
    - `--tags <tags>` — 쉼표로 구분된 태그(기본값: `latest`).

  </Accordion>
  <Accordion title="Plugins 게시">
    ```bash
    clawhub package publish <source>
    ```

    `<source>`는 로컬 폴더, `owner/repo`, `owner/repo@ref`, 또는
    GitHub URL일 수 있습니다.

    옵션:

    - `--dry-run` — 아무것도 업로드하지 않고 정확한 게시 계획만 빌드.
    - `--json` — CI용 기계 판독 가능 출력.
    - `--source-repo`, `--source-commit`, `--source-ref` — 자동 감지로 충분하지 않을 때 사용할 선택적 재정의.

  </Accordion>
  <Accordion title="삭제 / 삭제 취소 (소유자 또는 관리자)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="동기화 (로컬 스캔 + 신규 또는 업데이트 게시)">
    ```bash
    clawhub sync
    ```

    옵션:

    - `--root <dir...>` — 추가 스캔 루트.
    - `--all` — 프롬프트 없이 모두 업로드.
    - `--dry-run` — 업로드될 내용을 표시.
    - `--bump <type>` — 업데이트용 `patch|minor|major` (기본값: `patch`).
    - `--changelog <text>` — 비대화형 업데이트용 변경 로그.
    - `--tags <tags>` — 쉼표로 구분된 태그(기본값: `latest`).
    - `--concurrency <n>` — 레지스트리 검사 수(기본값: `4`).

  </Accordion>
</AccordionGroup>

## 일반적인 워크플로

<Tabs>
  <Tab title="검색">
    ```bash
    clawhub search "postgres backups"
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
  <Tab title="단일 Skill 게시">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="여러 Skills 동기화">
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

코드 Plugin은 `package.json`에 필요한 OpenClaw 메타데이터를 포함해야 합니다:

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

게시된 패키지는 **빌드된 JavaScript**를 포함하고
`runtimeExtensions`가 해당 출력물을 가리키도록 해야 합니다. Git 체크아웃 설치는
빌드된 파일이 없을 때 여전히 TypeScript 소스로 대체될 수 있지만,
빌드된 런타임 엔트리는 시작, doctor, Plugin 로딩 경로에서
런타임 TypeScript 컴파일을 피할 수 있게 해줍니다.

## 버전 관리, lockfile, 텔레메트리

<AccordionGroup>
  <Accordion title="버전 관리 및 태그">
    - 각 게시마다 새로운 **semver** `SkillVersion`이 생성됩니다.
    - `latest` 같은 태그는 특정 버전을 가리키며, 태그를 이동해 롤백할 수 있습니다.
    - 변경 로그는 버전별로 첨부되며 동기화나 업데이트 게시 시 비워 둘 수 있습니다.
  </Accordion>
  <Accordion title="로컬 변경 사항과 레지스트리 버전">
    업데이트는 콘텐츠 해시를 사용해 로컬 Skill 내용을 레지스트리 버전과 비교합니다. 로컬 파일이 게시된 어떤 버전과도 일치하지 않으면,
    CLI는 덮어쓰기 전에 확인을 요청합니다(또는 비대화형 실행에서는
    `--force`가 필요합니다).
  </Accordion>
  <Accordion title="동기화 스캔 및 대체 루트">
    `clawhub sync`는 먼저 현재 workdir을 스캔합니다. Skills를
    찾지 못하면 알려진 레거시 위치(예:
    `~/openclaw/skills` 및 `~/.openclaw/skills`)로 대체합니다. 이는
    추가 플래그 없이 오래된 Skill 설치를 찾기 위한 설계입니다.
  </Accordion>
  <Accordion title="저장소 및 lockfile">
    - 설치된 Skills는 workdir 아래 `.clawhub/lock.json`에 기록됩니다.
    - 인증 토큰은 ClawHub CLI 구성 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의 가능).
  </Accordion>
  <Accordion title="텔레메트리 (설치 수)">
    로그인한 상태에서 `clawhub sync`를 실행하면 CLI는 설치 수 계산을 위해 최소한의
    스냅샷을 전송합니다. 이를 완전히 비활성화할 수 있습니다:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수

| 변수                          | 효과                                         |
| ----------------------------- | -------------------------------------------- |
| `CLAWHUB_SITE`                | 사이트 URL을 재정의합니다.                   |
| `CLAWHUB_REGISTRY`            | 레지스트리 API URL을 재정의합니다.           |
| `CLAWHUB_CONFIG_PATH`         | CLI가 토큰/구성을 저장하는 위치를 재정의합니다. |
| `CLAWHUB_WORKDIR`             | 기본 workdir을 재정의합니다.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync`의 텔레메트리를 비활성화합니다.        |

## 관련 항목

- [커뮤니티 Plugins](/ko/plugins/community)
- [Plugins](/ko/tools/plugin)
- [Skills](/ko/tools/skills)
