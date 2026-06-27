---
read_when:
    - Skills 추가 또는 수정
    - Skills 게이팅, 허용 목록 또는 로드 규칙 변경
    - Skills 우선순위 및 스냅샷 동작 이해
sidebarTitle: Skills
summary: Skills는 에이전트에게 도구 사용 방법을 가르칩니다. Skills가 로드되는 방식, 우선순위가 작동하는 방식, 게이팅, 허용 목록, 환경 주입을 구성하는 방법을 알아보세요.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:16:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills는 에이전트에게 도구를 사용하는 방법과 시점을 알려 주는 Markdown 지침 파일입니다. 각 skill은 YAML frontmatter와 Markdown 본문이 포함된 `SKILL.md` 파일을 가진 디렉터리에 있습니다. OpenClaw는 번들 Skills와 로컬 오버라이드를 로드하며, 환경, 구성, 바이너리 존재 여부에 따라 로드 시점에 필터링합니다.

<CardGroup cols={2}>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 skill을 처음부터 빌드하고 테스트합니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안으로 작성한 skill 제안을 검토하고 승인합니다.
  </Card>
  <Card title="Skills 구성" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` 구성 스키마와 에이전트 허용 목록입니다.
  </Card>
  <Card title="ClawHub" href="/ko/clawhub" icon="cloud">
    커뮤니티 Skills를 찾아보고 설치합니다.
  </Card>
</CardGroup>

## 로드 순서

OpenClaw는 다음 소스에서 **우선순위가 높은 순서대로** 로드합니다. 동일한 skill 이름이 여러 위치에 나타나면 우선순위가 가장 높은 소스가 적용됩니다.

| 우선순위 | 소스 | 경로 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 최고 | 워크스페이스 Skills | `<workspace>/skills` |
| 2 | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills` |
| 3 | 개인 에이전트 Skills | `~/.agents/skills` |
| 4 | 관리형 / 로컬 Skills | `~/.openclaw/skills` |
| 5 | 번들 Skills | 설치와 함께 제공됨 |
| 6 — 최저 | 추가 디렉터리 | `skills.load.extraDirs` + plugin skills |

Skill 루트는 그룹화된 레이아웃을 지원합니다. OpenClaw는 구성된 루트 아래 어디에서든 `SKILL.md`가 나타나면 skill을 발견합니다.

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

폴더 경로는 정리용일 뿐입니다. Skill의 이름, 슬래시 명령, 허용 목록 키는 모두 `name` frontmatter 필드에서 오며, `name`이 없으면 디렉터리 이름에서 옵니다.

<Note>
  Codex CLI의 기본 `$CODEX_HOME/skills` 디렉터리는 OpenClaw skill 루트가 **아닙니다**. `openclaw migrate plan codex`를 사용해 해당 Skills의 인벤토리를 만든 다음, `openclaw migrate codex`로 OpenClaw 워크스페이스에 복사하세요.
</Note>

## 에이전트별 Skills와 공유 Skills

다중 에이전트 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다. 원하는 표시 범위에 맞는 경로를 사용하세요.

| 범위 | 경로 | 표시 대상 |
| -------------- | ---------------------------- | --------------------------- |
| 에이전트별 | `<workspace>/skills` | 해당 에이전트만 |
| 프로젝트 에이전트 | `<workspace>/.agents/skills` | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트 | `~/.agents/skills` | 이 머신의 모든 에이전트 |
| 공유 관리형 | `~/.openclaw/skills` | 이 머신의 모든 에이전트 |
| 추가 디렉터리 | `skills.load.extraDirs` | 이 머신의 모든 에이전트 |

## 에이전트 허용 목록

Skill **위치**(우선순위)와 skill **표시 여부**(어떤 에이전트가 사용할 수 있는지)는 별도의 제어 항목입니다. 허용 목록을 사용하면 Skills가 어디에서 로드되었는지와 관계없이 에이전트가 볼 수 있는 Skills를 제한할 수 있습니다.

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
    - 기본적으로 모든 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략합니다.
    - `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략합니다.
    - 해당 에이전트에 Skills를 노출하지 않으려면 `agents.list[].skills: []`를 설정합니다.
    - 비어 있지 않은 `agents.list[].skills` 목록은 **최종** 집합입니다. 기본값과 병합되지 않습니다.
    - 유효 허용 목록은 프롬프트 빌드, 슬래시 명령 발견, sandbox 동기화, skill 스냅샷 전반에 적용됩니다.
  </Accordion>
</AccordionGroup>

## Plugin과 Skills

Plugin은 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 제공할 수 있습니다. 경로는 plugin 루트를 기준으로 합니다. Plugin이 활성화되면 plugin Skills가 로드됩니다. 예를 들어 브라우저 plugin은 다단계 브라우저 제어를 위한 `browser-automation` skill을 제공합니다.

Plugin skill 디렉터리는 `skills.load.extraDirs`와 동일한 낮은 우선순위 수준에서 병합되므로, 같은 이름의 번들, 관리형, 에이전트, 워크스페이스 skill이 이를 덮어씁니다. Plugin의 구성 항목에서 `metadata.openclaw.requires.config`를 통해 게이트하세요.

전체 plugin 시스템은 [Plugin](/ko/tools/plugin) 및 [도구](/ko/tools)를 참조하세요.

## Skill Workshop

[Skill Workshop](/ko/tools/skill-workshop)은 에이전트와 활성 skill 파일 사이의 제안 대기열입니다. 에이전트가 재사용 가능한 작업을 발견하면 `SKILL.md`에 직접 쓰는 대신 제안을 초안으로 작성합니다. 변경 사항이 적용되기 전에 사용자가 검토하고 승인합니다.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

전체 수명 주기, CLI 참조, 구성은 [Skill Workshop](/ko/tools/skill-workshop)을 참조하세요.

## ClawHub에서 설치하기

[ClawHub](https://clawhub.ai)는 공개 skills 레지스트리입니다. 설치 및 업데이트에는
`openclaw skills` 명령을 사용하고, 게시 및 동기화에는 `clawhub` CLI를 사용합니다.

| 작업                               | 명령                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| 워크스페이스에 skill 설치          | `openclaw skills install @owner/<slug>`                |
| Git 저장소에서 설치                | `openclaw skills install git:owner/repo@ref`           |
| 로컬 skill 디렉터리 설치           | `openclaw skills install ./path/to/skill --as my-tool` |
| 모든 로컬 에이전트에 설치          | `openclaw skills install @owner/<slug> --global`       |
| 모든 워크스페이스 skills 업데이트  | `openclaw skills update --all`                         |
| 공유 관리형 skill 업데이트         | `openclaw skills update @owner/<slug> --global`        |
| 모든 공유 관리형 skills 업데이트   | `openclaw skills update --all --global`                |
| skill의 신뢰 엔벨로프 확인         | `openclaw skills verify @owner/<slug>`                 |
| 생성된 Skill Card 출력             | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI로 게시 / 동기화        | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="설치 세부 정보">
    `openclaw skills install`은 기본적으로 활성 워크스페이스의 `skills/`
    디렉터리에 설치합니다. `--global`을 추가하면 공유
    `~/.openclaw/skills` 디렉터리에 설치하며, 에이전트 허용 목록이 범위를 좁히지 않는 한
    모든 로컬 에이전트에 표시됩니다.

    Git 및 로컬 설치는 소스 루트에 `SKILL.md`가 있어야 합니다. slug는
    유효한 경우 `SKILL.md` 프런트매터의 `name`에서 가져오며, 그렇지 않으면
    디렉터리 또는 저장소 이름으로 대체됩니다. 재정의하려면 `--as <slug>`를 사용하세요.
    `openclaw skills update`는 ClawHub 설치만 추적합니다. Git 또는
    로컬 소스는 새로 고치려면 다시 설치하세요.

  </Accordion>
  <Accordion title="확인 및 보안 스캔">
    `openclaw skills verify @owner/<slug>`는 ClawHub에 skill의
    `clawhub.skill.verify.v1` 신뢰 엔벨로프를 요청합니다. 설치된 ClawHub skills는
    `.clawhub/origin.json`에 기록된 버전 및 레지스트리를 기준으로 확인됩니다.
    기존에 설치되었거나 모호하지 않은 skills에는 소유자 없는 slug도 계속 허용되지만,
    소유자가 포함된 참조는 게시자 모호성을 피할 수 있습니다.

    ClawHub skill 페이지는 설치 전에 최신 보안 스캔 상태를 표시하며,
    VirusTotal, ClawScan, 정적 분석에 대한 상세 페이지를 제공합니다. ClawHub가
    확인 실패로 표시하면 명령은 0이 아닌 코드로 종료됩니다. 게시자는
    ClawHub 대시보드 또는 `clawhub skill rescan @owner/<slug>`를 통해
    오탐을 복구할 수 있습니다.

  </Accordion>
  <Accordion title="비공개 아카이브 설치">
    ClawHub가 아닌 전달 방식이 필요한 Gateway 클라이언트는
    `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`으로 zip skill 아카이브를
    준비한 뒤 `skills.install({ source: "upload", ... })`로 설치할 수 있습니다. 이 경로는
    기본적으로 꺼져 있으며 `openclaw.json`에서
    `skills.install.allowUploadedArchives: true`가 필요합니다. 일반 ClawHub 설치에는
    이 설정이 전혀 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 보안

<Warning>
  서드파티 skills는 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
  신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 선호하세요. 에이전트 측 제어는
  [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

<AccordionGroup>
  <Accordion title="경로 격리">
    워크스페이스, 프로젝트 에이전트, 추가 디렉터리 skill 탐색은
    `skills.load.allowSymlinkTargets`가 대상 루트를 명시적으로 신뢰하지 않는 한,
    확인된 실제 경로가 구성된 루트 안에 유지되는 skill 루트만 허용합니다.
    Skill Workshop은 `skills.workshop.allowSymlinkTargetWrites`가 활성화된 경우에만
    이러한 신뢰된 대상에 씁니다.
    관리형 `~/.openclaw/skills` 및 개인 `~/.agents/skills`에는
    심볼릭 링크된 skill 폴더가 포함될 수 있지만, 모든 `SKILL.md` 실제 경로는
    여전히 확인된 skill 디렉터리 안에 있어야 합니다.
  </Accordion>
  <Accordion title="운영자 설치 정책">
    skill 설치를 계속하기 전에 신뢰할 수 있는 로컬 정책 명령을 실행하도록
    `security.installPolicy`를 구성하세요. 정책은 메타데이터와 준비된
    소스 경로를 받으며 ClawHub, 업로드, Git, 로컬, 업데이트,
    의존성 설치 경로에 적용되고, 명령이 유효한 결정을 반환하지 못하면
    실패 시 차단합니다.
  </Accordion>
  <Accordion title="비밀 주입 범위">
    `skills.entries.*.env` 및 `skills.entries.*.apiKey`는 해당 에이전트 턴 동안에만
    비밀을 **호스트** 프로세스에 주입하며, 샌드박스에는 주입하지 않습니다. 비밀을
    프롬프트와 로그에 포함하지 마세요.
  </Accordion>
</AccordionGroup>

더 넓은 위협 모델과 보안 체크리스트는
[보안](/ko/gateway/security)을 참조하세요.

## SKILL.md 형식

모든 skill에는 최소한 프런트매터에 `name`과 `description`이 필요합니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw는 [AgentSkills](https://agentskills.io) 사양을 따릅니다.
  프런트매터 파서는 **한 줄 키만** 지원합니다. `metadata`는
  한 줄 JSON 객체여야 합니다. 본문에서 skill 폴더 경로를 참조하려면
  `{baseDir}`을 사용하세요.
</Note>

### 선택적 프런트매터 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 URL입니다. 또한
  `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 skill이 사용자가 호출할 수 있는 슬래시 명령으로 노출됩니다.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw는 skill의 지침을 에이전트의 일반
  프롬프트에 포함하지 않습니다. `user-invocable`도 `true`이면
  skill은 여전히 슬래시 명령으로 사용할 수 있습니다.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하고 등록된 도구로
  직접 디스패치됩니다.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정된 경우 호출할 도구 이름입니다.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우 코어 파싱 없이 원시 args 문자열을 도구에 전달합니다.
  도구는
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`를 받습니다.
</ParamField>

## 게이팅

OpenClaw는 로드 시점에 `metadata.openclaw`(frontmatter의 한 줄 JSON)를 사용해 Skills를 필터링합니다. `metadata.openclaw` 블록이 없는 skill은 명시적으로 비활성화되지 않는 한 항상 대상이 됩니다.

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
  `true`이면 항상 skill을 포함하고 다른 모든 게이트를 건너뜁니다.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI에 표시되는 선택적 이모지입니다.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 선택적 URL입니다.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  플랫폼 필터입니다. 설정하면 나열된 OS에서만 skill이 대상이 됩니다.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  각 바이너리는 `PATH`에 있어야 합니다.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  최소 하나의 바이너리가 `PATH`에 있어야 합니다.
</ParamField>

<ParamField path="requires.env" type="string[]">
  각 env var는 프로세스에 있거나 config를 통해 제공되어야 합니다.
</ParamField>

<ParamField path="requires.config" type="string[]">
  각 `openclaw.json` 경로는 truthy여야 합니다.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 env var 이름입니다.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 프로그램 사양입니다(brew / node / go / uv / download).
</ParamField>

<Note>
  `metadata.openclaw`가 없으면 레거시 `metadata.clawdbot` 블록도 계속 허용되므로,
  이전에 설치된 Skills는 dependency 게이트와 설치 프로그램 힌트를 유지합니다. 새 Skills는
  `metadata.openclaw`를 사용해야 합니다.
</Note>

### 설치 프로그램 사양

설치 프로그램 사양은 macOS Skills UI에 dependency 설치 방법을 알려줍니다.

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
  <Accordion title="설치 프로그램 선택 규칙">
    - 여러 설치 프로그램이 나열되면 Gateway가 선호 옵션 하나를 선택합니다
      (사용 가능하면 brew, 그렇지 않으면 node).
    - 모든 설치 프로그램이 `download`이면, OpenClaw는 사용 가능한 모든 아티팩트를
      볼 수 있도록 각 항목을 나열합니다.
    - 사양에는 플랫폼별 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다
      (기본값: npm, 옵션: npm / pnpm / yarn / bun). 이는 skill 설치에만 영향을 주며,
      Gateway 런타임은 여전히 Node여야 합니다.
    - Gateway 설치 프로그램 선호도: Homebrew → uv → 구성된 node manager →
      go → download.
  </Accordion>
  <Accordion title="설치 프로그램별 세부 정보">
    - **Homebrew:** OpenClaw는 Homebrew를 자동 설치하거나 brew formula를
      시스템 패키지 명령으로 변환하지 않습니다. `brew`가 없는 Linux 컨테이너에서는
      brew 전용 설치 프로그램이 숨겨집니다. 커스텀 이미지를 사용하거나 dependency를
      수동으로 설치하세요.
    - **Go:** `go`가 없고 `brew`가 사용 가능하면, Gateway는 먼저 Homebrew를 통해
      Go를 설치하고 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
    - **Download:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`),
      `extract`(기본값: archive 감지 시 auto), `stripComponents`,
      `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="샌드박싱 참고 사항">
    `requires.bins`는 skill 로드 시점에 **호스트**에서 확인됩니다. agent가
    sandbox에서 실행되면 바이너리도 **컨테이너 내부**에 있어야 합니다.
    `agents.defaults.sandbox.docker.setupCommand` 또는 커스텀 이미지를 통해
    설치하세요. `setupCommand`는 컨테이너 생성 후 한 번 실행되며, 네트워크 송신,
    쓰기 가능한 루트 FS, sandbox의 root 사용자가 필요합니다.
  </Accordion>
</AccordionGroup>

## Config 재정의

`~/.openclaw/openclaw.json`의 `skills.entries` 아래에서 번들 또는 관리형 Skills를
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
  `false`는 번들되었거나 설치된 경우에도 skill을 비활성화합니다. `coding-agent`
  번들 skill은 opt-in입니다. `skills.entries.coding-agent.enabled: true`를 설정하고
  `claude`, `codex`, `opencode` 또는 지원되는 다른 CLI 중 하나가 설치 및 인증되어
  있는지 확인하세요.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 Skills를 위한 편의 필드입니다.
  일반 텍스트 문자열 또는 SecretRef 객체를 지원합니다.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  agent 실행에 주입되는 환경 변수입니다. 변수는 프로세스에 아직 설정되어 있지 않을 때만 주입됩니다.
</ParamField>

<ParamField path="config" type="object">
  skill별 커스텀 구성 필드를 위한 선택적 bag입니다.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **번들** Skills에만 적용되는 선택적 allowlist입니다. 설정하면 목록에 있는 번들 Skills만
  대상이 됩니다. 관리형 및 workspace Skills에는 영향을 주지 않습니다.
</ParamField>

<Note>
  Config 키는 기본적으로 **skill 이름**과 일치합니다. skill이
  `metadata.openclaw.skillKey`를 정의하면 `skills.entries` 아래에서 해당 키를 사용하세요.
  하이픈이 포함된 이름은 따옴표로 감싸세요. JSON5는 따옴표로 감싼 키를 허용합니다.
</Note>

## 환경 주입

agent 실행이 시작되면 OpenClaw는 다음을 수행합니다.

<Steps>
  <Step title="skill metadata 읽기">
    OpenClaw는 게이팅 규칙, allowlist, config 재정의를 적용해 agent의 유효 skill 목록을
    해석합니다.
  </Step>
  <Step title="env 및 API 키 주입">
    `skills.entries.<key>.env`와 `skills.entries.<key>.apiKey`가 실행 기간 동안
    `process.env`에 적용됩니다.
  </Step>
  <Step title="시스템 프롬프트 빌드">
    대상 Skills가 압축된 XML 블록으로 컴파일되어 시스템 프롬프트에 주입됩니다.
  </Step>
  <Step title="환경 복원">
    실행이 끝나면 원래 환경이 복원됩니다.
  </Step>
</Steps>

<Warning>
  Env 주입은 sandbox가 아니라 **호스트** agent 실행으로 범위가 제한됩니다. sandbox 내부에서는
  `env`와 `apiKey`가 효과가 없습니다. sandbox 실행에 secret을 전달하는 방법은
  [Skills config](/ko/tools/skills-config#sandboxed-skills-and-env-vars)를 참조하세요.
</Warning>

번들 `claude-cli` 백엔드의 경우 OpenClaw는 동일한 대상 skill snapshot을 임시 Claude Code
Plugin으로도 materialize하고 `--plugin-dir`를 통해 전달합니다. 다른 CLI 백엔드는 프롬프트
catalog만 사용합니다.

## Snapshot 및 새로고침

OpenClaw는 **session이 시작될 때** 대상 Skills의 snapshot을 만들고, session의 이후 모든 turn에서
그 목록을 재사용합니다. Skills 또는 config 변경 사항은 다음 새 session부터 적용됩니다.

Skills는 두 가지 경우 session 중간에 새로고침됩니다.

- Skills watcher가 `SKILL.md` 변경을 감지합니다.
- 새 대상 remote node가 연결됩니다.

새로고침된 목록은 다음 agent turn에 반영됩니다. 유효한 agent allowlist가 변경되면 OpenClaw는
보이는 Skills가 정렬되도록 snapshot을 새로고침합니다.

<AccordionGroup>
  <Accordion title="Skills watcher">
    기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 snapshot을
    갱신합니다. `skills.load` 아래에서 구성하세요.

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
    Skill Workshop이 신뢰된 symlink 경로를 통해 제안도 적용해야 하는 경우에만
    `skills.workshop.allowSymlinkTargetWrites`를 활성화하세요.

  </Accordion>
  <Accordion title="Remote macOS node (Linux Gateway)">
    Gateway가 Linux에서 실행되지만 **macOS node**가 `system.run` 허용 상태로 연결되어 있으면,
    OpenClaw는 필요한 바이너리가 해당 node에 있을 때 macOS 전용 Skills를 대상으로 간주할 수
    있습니다. agent는 `host=node`와 함께 `exec` 도구를 사용해 해당 Skills를 실행해야 합니다.

    오프라인 node는 remote 전용 Skills를 보이게 만들지 **않습니다**. node가 bin probe에 응답하지
    않으면 OpenClaw는 캐시된 bin match를 지웁니다.

  </Accordion>
</AccordionGroup>

## 토큰 영향

Skills가 대상이면 OpenClaw는 압축된 XML 블록을 시스템 프롬프트에 주입합니다.
비용은 결정적입니다.

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **기본 오버헤드**(skill이 1개 이상일 때만): 약 195자
- **skill당:** 약 97자 + `name`, `description`, `location` 필드 길이
- XML 이스케이프는 `& < > " '`를 entity로 확장해, 발생할 때마다 몇 글자를 추가합니다
- 약 4자/token 기준, 97자는 필드 길이 제외 skill당 약 24 tokens입니다

프롬프트 오버헤드를 최소화하려면 설명을 짧고 명확하게 유지하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    커스텀 skill을 작성하는 단계별 가이드입니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    agent가 초안 작성한 Skills를 위한 제안 queue입니다.
  </Card>
  <Card title="Skills config" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` config schema와 agent allowlist입니다.
  </Card>
  <Card title="Slash commands" href="/ko/tools/slash-commands" icon="terminal">
    skill slash command가 등록되고 라우팅되는 방식입니다.
  </Card>
  <Card title="ClawHub" href="/ko/clawhub" icon="cloud">
    공개 registry에서 Skills를 찾아보고 게시합니다.
  </Card>
  <Card title="Plugins" href="/ko/tools/plugin" icon="plug">
    Plugins는 문서화하는 도구와 함께 Skills를 제공할 수 있습니다.
  </Card>
</CardGroup>
