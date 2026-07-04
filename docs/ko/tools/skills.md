---
read_when:
    - Skills 추가 또는 수정
    - 스킬 게이팅, 허용 목록 또는 로드 규칙 변경
    - 스킬 우선순위와 스냅샷 동작 이해
sidebarTitle: Skills
summary: Skills는 에이전트에게 도구 사용 방법을 가르칩니다. Skills가 로드되는 방식, 우선순위가 작동하는 방식, 게이팅, 허용 목록, 환경 주입을 구성하는 방법을 알아보세요.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:26:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills는 에이전트가 도구를 사용하는 방법과 시점을 알려 주는 마크다운 지침 파일입니다. 각 Skill은 YAML frontmatter와 마크다운 본문이 포함된 `SKILL.md` 파일을 담은 디렉터리에 있습니다. OpenClaw는 번들 Skills와 로컬 재정의를 로드하고, 로드 시점에 환경, 구성, 바이너리 존재 여부를 기준으로 필터링합니다.

<CardGroup cols={2}>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 Skill을 처음부터 빌드하고 테스트합니다.
  </Card>
  <Card title="Skill 워크숍" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안으로 작성한 Skill 제안을 검토하고 승인합니다.
  </Card>
  <Card title="Skills 구성" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` 구성 스키마와 에이전트 허용 목록입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    커뮤니티 Skills를 탐색하고 설치합니다.
  </Card>
</CardGroup>

## 로드 순서

OpenClaw는 다음 소스에서 로드하며, **가장 높은 우선순위가 먼저** 적용됩니다. 동일한 Skill 이름이 여러 위치에 나타나면 가장 높은 소스가 우선합니다.

| 우선순위 | 소스 | 경로 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 가장 높음 | 워크스페이스 Skills | `<workspace>/skills` |
| 2 | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills` |
| 3 | 개인 에이전트 Skills | `~/.agents/skills` |
| 4 | 관리형 / 로컬 Skills | `~/.openclaw/skills` |
| 5 | 번들 Skills | 설치와 함께 제공됨 |
| 6 — 가장 낮음 | 추가 디렉터리 | `skills.load.extraDirs` + Plugin Skills |

Skill 루트는 그룹화된 레이아웃을 지원합니다. 구성된 루트 아래 어디에서든 `SKILL.md`가 나타나면 OpenClaw가 Skill을 발견합니다.

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

폴더 경로는 정리 용도로만 사용됩니다. Skill의 이름, 슬래시 명령, 허용 목록 키는 모두 `name` frontmatter 필드에서 가져옵니다(`name`이 없으면 디렉터리 이름에서 가져옵니다).

<Note>
  Codex CLI의 기본 `$CODEX_HOME/skills` 디렉터리는 OpenClaw Skill 루트가 **아닙니다**. `openclaw migrate plan codex`를 사용해 해당 Skills의 인벤토리를 만든 다음, `openclaw migrate codex`를 사용해 OpenClaw 워크스페이스로 복사하세요.
</Note>

## 에이전트별 Skills와 공유 Skills

다중 에이전트 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다. 원하는 표시 범위와 일치하는 경로를 사용하세요.

| 범위 | 경로 | 표시 대상 |
| -------------- | ---------------------------- | --------------------------- |
| 에이전트별 | `<workspace>/skills` | 해당 에이전트만 |
| 프로젝트 에이전트 | `<workspace>/.agents/skills` | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트 | `~/.agents/skills` | 이 머신의 모든 에이전트 |
| 공유 관리형 | `~/.openclaw/skills` | 이 머신의 모든 에이전트 |
| 추가 디렉터리 | `skills.load.extraDirs` | 이 머신의 모든 에이전트 |

## 에이전트 허용 목록

Skill **위치**(우선순위)와 Skill **표시 범위**(어떤 에이전트가 사용할 수 있는지)는 별도의 제어 항목입니다. 허용 목록을 사용해 로드 위치와 관계없이 에이전트가 볼 수 있는 Skills를 제한하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="허용 목록 규칙">
    - 기본적으로 모든 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
    - `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략하세요.
    - 해당 에이전트에 어떤 Skills도 노출하지 않으려면 `agents.list[].skills: []`로 설정하세요.
    - 비어 있지 않은 `agents.list[].skills` 목록은 **최종** 집합입니다. 기본값과 병합되지 않습니다.
    - 유효한 허용 목록은 프롬프트 빌드, 슬래시 명령 발견, 샌드박스 동기화, Skill 스냅샷 전반에 적용됩니다.
    - 이는 호스트 셸 권한 부여 경계가 아닙니다. 동일한 에이전트가 `exec`를 사용할 수 있다면, 샌드박싱, OS 사용자 격리, exec 거부/허용 목록, 리소스별 자격 증명으로 해당 셸을 별도로 제한하세요.
  </Accordion>
</AccordionGroup>

## Plugin과 Skills

Plugin은 `openclaw.plugin.json`에 `skills` 디렉터리를 나열해 자체 Skills를 제공할 수 있습니다(경로는 Plugin 루트를 기준으로 상대 경로). Plugin Skills는 Plugin이 활성화될 때 로드됩니다. 예를 들어 브라우저 Plugin은 다단계 브라우저 제어를 위한 `browser-automation` Skill을 제공합니다.

Plugin Skill 디렉터리는 `skills.load.extraDirs`와 동일한 낮은 우선순위 수준에서 병합되므로, 같은 이름의 번들, 관리형, 에이전트 또는 워크스페이스 Skill이 이를 재정의합니다. Plugin의 구성 항목에서 `metadata.openclaw.requires.config`를 통해 게이트하세요.

전체 Plugin 시스템은 [Plugin](/ko/tools/plugin) 및 [도구](/ko/tools)를 참조하세요.

## Skill 워크숍

[Skill 워크숍](/ko/tools/skill-workshop)은 에이전트와 활성 Skill 파일 사이의 제안 대기열입니다. 에이전트가 재사용 가능한 작업을 발견하면 `SKILL.md`에 직접 쓰는 대신 제안 초안을 작성합니다. 변경 사항이 적용되기 전에 검토하고 승인합니다.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

전체 수명 주기, CLI 참조, 구성은 [스킬 워크숍](/ko/tools/skill-workshop)을
참조하세요.

## ClawHub에서 설치

[ClawHub](https://clawhub.ai)는 공개 스킬 레지스트리입니다. 설치와
업데이트에는 `openclaw skills` 명령을 사용하고, 게시와 동기화에는
`clawhub` CLI를 사용하세요.

| 작업                             | 명령                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| 작업공간에 스킬 설치 | `openclaw skills install @owner/<slug>`                |
| Git 저장소에서 설치      | `openclaw skills install git:owner/repo@ref`           |
| 로컬 스킬 디렉터리 설치    | `openclaw skills install ./path/to/skill --as my-tool` |
| 모든 로컬 에이전트에 설치       | `openclaw skills install @owner/<slug> --global`       |
| 모든 작업공간 스킬 업데이트        | `openclaw skills update --all`                         |
| 공유 관리형 스킬 업데이트      | `openclaw skills update @owner/<slug> --global`        |
| 모든 공유 관리형 스킬 업데이트   | `openclaw skills update --all --global`                |
| 스킬의 신뢰 엔벌로프 확인    | `openclaw skills verify @owner/<slug>`                 |
| 생성된 스킬 카드 출력     | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI로 게시 / 동기화     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="설치 세부 정보">
    `openclaw skills install`은 기본적으로 활성 작업공간의 `skills/`
    디렉터리에 설치합니다. 모든 로컬 에이전트가 볼 수 있는 공유
    `~/.openclaw/skills` 디렉터리에 설치하려면 `--global`을 추가하세요.
    단, 에이전트 허용 목록이 범위를 좁힐 수 있습니다.

    Git 및 로컬 설치는 소스 루트에 `SKILL.md`가 있어야 합니다. 슬러그는
    유효한 경우 `SKILL.md` 프런트매터의 `name`에서 가져오고, 그렇지 않으면
    디렉터리 또는 저장소 이름으로 대체됩니다. 재정의하려면 `--as <slug>`를
    사용하세요. `openclaw skills update`는 ClawHub 설치만 추적합니다. Git
    또는 로컬 소스는 새로 고치려면 다시 설치하세요.

  </Accordion>
  <Accordion title="검증 및 보안 검사">
    `openclaw skills verify @owner/<slug>`는 ClawHub에 스킬의
    `clawhub.skill.verify.v1` 신뢰 엔벌로프를 요청합니다. 설치된 ClawHub
    스킬은 `.clawhub/origin.json`에 기록된 버전 및 레지스트리를 기준으로
    검증됩니다. 기존에 설치된 스킬이나 모호하지 않은 스킬에는 소유자 없는
    슬러그도 계속 허용되지만, 소유자 한정 참조는 게시자 모호성을 방지합니다.

    ClawHub 스킬 페이지는 설치 전에 최신 보안 검사 상태를 표시하며,
    VirusTotal, ClawScan, 정적 분석의 세부 정보 페이지를 제공합니다.
    ClawHub가 검증 실패로 표시하면 명령은 0이 아닌 종료 코드로 종료됩니다.
    게시자는 ClawHub 대시보드 또는 `clawhub skill rescan @owner/<slug>`를
    통해 오탐을 복구합니다.

  </Accordion>
  <Accordion title="비공개 아카이브 설치">
    ClawHub가 아닌 전달이 필요한 Gateway 클라이언트는
    `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`으로
    zip 스킬 아카이브를 스테이징한 다음
    `skills.install({ source: "upload", ... })`로 설치할 수 있습니다. 이 경로는
    기본적으로 꺼져 있으며 `openclaw.json`에서
    `skills.install.allowUploadedArchives: true`가 필요합니다. 일반적인
    ClawHub 설치에는 이 설정이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 보안

<Warning>
  타사 스킬은 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
  신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 선호하세요. 에이전트 측
  제어는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

<AccordionGroup>
  <Accordion title="경로 격리">
    작업공간, 프로젝트 에이전트, 추가 디렉터리 스킬 검색은
    `skills.load.allowSymlinkTargets`가 대상 루트를 명시적으로 신뢰하지 않는 한,
    해석된 실제 경로가 구성된 루트 안에 유지되는 스킬 루트만 허용합니다.
    스킬 워크숍은 `skills.workshop.allowSymlinkTargetWrites`가 활성화된 경우에만
    이러한 신뢰된 대상에 씁니다. 관리형 `~/.openclaw/skills`와 개인
    `~/.agents/skills`에는 심볼릭 링크된 스킬 폴더가 포함될 수 있지만, 모든
    `SKILL.md` 실제 경로는 여전히 해석된 해당 스킬 디렉터리 안에 있어야 합니다.
  </Accordion>
  <Accordion title="운영자 설치 정책">
    스킬 설치를 계속하기 전에 신뢰할 수 있는 로컬 정책 명령을 실행하려면
    `security.installPolicy`를 구성하세요. 정책은 메타데이터와 스테이징된
    소스 경로를 받으며, ClawHub, 업로드, Git, 로컬, 업데이트, 의존성 설치
    경로에 적용되고, 명령이 유효한 결정을 반환할 수 없으면 실패 시 차단합니다.
  </Accordion>
  <Accordion title="시크릿 주입 범위">
    `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴에
    대해서만 **호스트** 프로세스에 시크릿을 주입하며, 샌드박스에는 주입하지
    않습니다. 프롬프트와 로그에 시크릿을 넣지 마세요.
  </Accordion>
</AccordionGroup>

더 넓은 위협 모델과 보안 체크리스트는 [보안](/ko/gateway/security)을
참조하세요.

## SKILL.md 형식

모든 스킬은 최소한 프런트매터에 `name`과 `description`이 필요합니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw는 [AgentSkills](https://agentskills.io) 사양을 따릅니다.
  프런트매터 파서는 **한 줄 키만** 지원합니다. 즉, `metadata`는 한 줄
  JSON 객체여야 합니다. 본문에서 스킬 폴더 경로를 참조하려면 `{baseDir}`를
  사용하세요.
</Note>

### 선택적 프런트매터 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 URL입니다. 
  `metadata.openclaw.homepage`로도 지원됩니다.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 스킬이 사용자가 호출할 수 있는 슬래시 명령으로 노출됩니다.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw는 스킬 지침을 에이전트의 일반 프롬프트에 포함하지
  않습니다. `user-invocable`도 `true`이면 스킬은 계속 슬래시 명령으로 사용할
  수 있습니다.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하고 등록된 도구로 직접
  디스패치됩니다.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정된 경우 호출할 도구 이름입니다.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우, 코어 파싱 없이 원시 args 문자열을 도구에
  전달합니다. 도구는
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`를 받습니다.
</ParamField>

## 게이팅

OpenClaw는 로드 시점에 `metadata.openclaw`(frontmatter의 한 줄
JSON)를 사용하여 Skills를 필터링합니다. `metadata.openclaw` 블록이 없는 skill은 명시적으로
비활성화되지 않는 한 항상 적격입니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  `true`이면 항상 해당 skill을 포함하고 다른 모든 게이트를 건너뜁니다.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI에 표시되는 선택적 이모지입니다.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 선택적 URL입니다.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  플랫폼 필터입니다. 설정하면 해당 skill은 나열된 OS에서만 적격입니다.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  각 바이너리는 `PATH`에 존재해야 합니다.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  하나 이상의 바이너리가 `PATH`에 존재해야 합니다.
</ParamField>

<ParamField path="requires.env" type="string[]">
  각 env var는 프로세스에 존재하거나 config를 통해 제공되어야 합니다.
</ParamField>

<ParamField path="requires.config" type="string[]">
  각 `openclaw.json` 경로는 참이어야 합니다.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 env var 이름입니다.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 관리자 사양입니다(brew / node / go / uv / download).
</ParamField>

<Note>
  `metadata.openclaw`가 없으면 레거시 `metadata.clawdbot` 블록도 계속 허용되므로,
  이전에 설치된 skills는 종속성 게이트와 설치 관리자 힌트를 유지합니다. 새 skills는
  `metadata.openclaw`를 사용해야 합니다.
</Note>

### 설치 관리자 사양

설치 관리자 사양은 macOS Skills UI에 종속성을 설치하는 방법을 알려줍니다.

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - 여러 설치 관리자가 나열된 경우, gateway는 선호하는 옵션 하나를 선택합니다
      (사용 가능하면 brew, 그렇지 않으면 node).
    - 모든 설치 관리자가 `download`이면 OpenClaw는 사용 가능한 모든 아티팩트를
      볼 수 있도록 각 항목을 나열합니다.
    - 사양에는 플랫폼별 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다
      (기본값: npm; 옵션: npm / pnpm / yarn / bun). 이는 skill
      설치에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다.
    - Gateway 설치 관리자 선호 순서: Homebrew → uv → 구성된 node manager →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw는 Homebrew를 자동 설치하거나 brew
      formula를 시스템 패키지 명령으로 변환하지 않습니다. `brew`가 없는 Linux 컨테이너에서는
      brew 전용 설치 관리자가 숨겨집니다. 사용자 지정 이미지를 사용하거나 종속성을
      수동으로 설치하세요.
    - **Go:** OpenClaw는 자동 skill 설치에 Go 1.21 이상을 요구하며
      기존 `GOBIN`, `GOPATH`, `GOTOOLCHAIN` 설정을 보존합니다. 구성된
      toolchain이 모듈의 필수 Go 버전을 충족할 수 없으면, onboarding은 설치
      시도 후 해당 skill을 수동 Go 사전 요구 사항과 함께 그룹화합니다. `go`가 없고
      Homebrew를 사용할 수 있으면 OpenClaw는 먼저 Homebrew를 통해 Go를 설치하고
      `GOBIN`을 Homebrew의 `bin`으로 설정합니다. Linux에서는 새로 고친
      `golang-go` 후보가 최소 버전을 충족할 때 OpenClaw가 대신 root로 또는
      암호 없는 `sudo`를 통해 `apt-get`을 사용할 수 있습니다.
    - **Download:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`),
      `extract`(기본값: 아카이브 감지 시 자동), `stripComponents`,
      `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins`는 skill 로드 시점에 **호스트**에서 확인됩니다. 에이전트가
    sandbox에서 실행되는 경우, 바이너리도 **컨테이너 내부**에 존재해야 합니다.
    `agents.defaults.sandbox.docker.setupCommand` 또는 사용자 지정
    이미지를 통해 설치하세요. `setupCommand`는 컨테이너 생성 후 한 번 실행되며
    네트워크 송신, 쓰기 가능한 root FS, sandbox의 root 사용자가 필요합니다.
  </Accordion>
</AccordionGroup>

## Config 재정의

`~/.openclaw/openclaw.json`의 `skills.entries` 아래에서 번들 또는 관리형 skills를
토글하고 구성합니다.

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false`는 번들되었거나 설치되었더라도 해당 skill을 비활성화합니다. `coding-agent`
  번들 skill은 옵트인입니다. `skills.entries.coding-agent.enabled: true`를
  설정하고 `claude`, `codex`, `opencode` 또는 지원되는 다른 CLI 중 하나가
  설치 및 인증되어 있는지 확인하세요.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 skills를 위한 편의 필드입니다.
  평문 문자열 또는 SecretRef 객체를 지원합니다.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  에이전트 실행에 주입되는 환경 변수입니다. 해당 변수가 프로세스에 이미 설정되어 있지
  않은 경우에만 주입됩니다.
</ParamField>

<ParamField path="config" type="object">
  skill별 사용자 지정 구성 필드를 위한 선택적 bag입니다.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **번들** skills에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들 skills만
  적격입니다. 관리형 및 workspace skills에는 영향을 주지 않습니다.
</ParamField>

<Note>
  Config 키는 기본적으로 **skill name**과 일치합니다. skill이
  `metadata.openclaw.skillKey`를 정의하는 경우, `skills.entries` 아래에서 해당 키를
  사용하세요. 하이픈이 포함된 이름은 따옴표로 감싸세요. JSON5는 따옴표로 감싼 키를 허용합니다.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw는 게이팅 규칙, 허용 목록, config 재정의를 적용하여 에이전트의 유효한
    skill 목록을 확인합니다.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env`와 `skills.entries.<key>.apiKey`가 실행 기간 동안
    `process.env`에 적용됩니다.
  </Step>
  <Step title="Builds the system prompt">
    적격 skills는 compact XML 블록으로 컴파일되어 system prompt에 주입됩니다.
  </Step>
  <Step title="Restores the environment">
    실행이 끝나면 원래 환경이 복원됩니다.
  </Step>
</Steps>

<Warning>
  Env 주입은 sandbox가 아니라 **호스트** 에이전트 실행 범위에 적용됩니다. sandbox 내부에서는
  `env`와 `apiKey`가 효과가 없습니다. sandbox 실행에 secrets를 전달하는 방법은
  [Skills config](/ko/tools/skills-config#sandboxed-skills-and-env-vars)를 참조하세요.
</Warning>

번들 `claude-cli` backend의 경우, OpenClaw는 동일한 적격 skill snapshot을
임시 Claude Code Plugin으로도 구체화하고 `--plugin-dir`을 통해 전달합니다.
다른 CLI backend는 prompt catalog만 사용합니다.

## Snapshots 및 새로 고침

OpenClaw는 **세션이 시작될 때** 적격 skills의 snapshot을 만들고, 세션의 모든 후속
턴에서 해당 목록을 재사용합니다. skills 또는 config 변경 사항은 다음 새 세션부터
적용됩니다.

세션 중 skills는 두 가지 경우에 새로 고쳐집니다.

- skills watcher가 `SKILL.md` 변경을 감지합니다.
- 새로운 적격 remote node가 연결됩니다.

새로 고친 목록은 다음 에이전트 턴에서 반영됩니다. 유효한 에이전트 허용 목록이
변경되면, OpenClaw는 표시되는 skills가 일치하도록 snapshot을 새로 고칩니다.

<AccordionGroup>
  <Accordion title="Skills watcher">
    기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면
    snapshot을 갱신합니다. `skills.load` 아래에서 구성합니다.

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    skill root symlink가 구성된 root 밖을 가리키는 의도적인 symlink 레이아웃에는
    `allowSymlinkTargets`를 사용하세요. 예:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Skill Workshop도 신뢰할 수 있는 이러한 symlink 경로를 통해 제안을 적용해야 할 때만
    `skills.workshop.allowSymlinkTargetWrites`를 활성화하세요.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Gateway가 Linux에서 실행되지만 **macOS node**가 `system.run` 허용 상태로
    연결되어 있는 경우, 필수 바이너리가 해당 node에 있으면 OpenClaw는 macOS 전용
    skills를 적격으로 처리할 수 있습니다. 에이전트는 `host=node`와 함께 `exec` 도구를
    통해 해당 skills를 실행해야 합니다.

    오프라인 node는 remote 전용 skills를 표시하지 **않습니다**. node가 bin probe에
    응답하지 않으면 OpenClaw는 캐시된 bin 일치 항목을 지웁니다.

  </Accordion>
</AccordionGroup>

## 토큰 영향

skills가 적격이면 OpenClaw는 compact XML 블록을 system
prompt에 주입합니다. 비용은 결정적입니다.

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **기본 오버헤드**(skill이 1개 이상일 때만): 약 195자
- **skill당:** 약 97자 + `name`, `description`, `location` 필드 길이
- XML 이스케이프는 `& < > " '`를 엔터티로 확장하여, 발생할 때마다 몇 글자를 추가합니다
- 약 4자/token 기준으로, 97자는 필드 길이를 제외하고 skill당 약 24 tokens입니다

prompt 오버헤드를 최소화하려면 descriptions를 짧고 설명적으로 유지하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 skill을 작성하는 단계별 가이드입니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안으로 작성한 skills를 위한 제안 큐입니다.
  </Card>
  <Card title="Skills config" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` config schema와 에이전트 허용 목록입니다.
  </Card>
  <Card title="Slash commands" href="/ko/tools/slash-commands" icon="terminal">
    skill slash commands가 등록되고 라우팅되는 방식입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    공개 registry에서 skills를 탐색하고 게시합니다.
  </Card>
  <Card title="Plugins" href="/ko/tools/plugin" icon="plug">
    Plugins는 문서화하는 도구와 함께 skills를 제공할 수 있습니다.
  </Card>
</CardGroup>
