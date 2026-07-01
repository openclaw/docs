---
read_when:
    - Skills 추가 또는 수정
    - Skills 게이팅, 허용 목록 또는 로드 규칙 변경
    - Skills 우선순위 및 스냅샷 동작 이해하기
sidebarTitle: Skills
summary: Skills는 에이전트에게 도구 사용 방법을 가르칩니다. Skills가 로드되는 방식, 우선순위가 작동하는 방식, 게이팅, 허용 목록, 환경 주입을 구성하는 방법을 알아보세요.
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:34:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills는 에이전트에게 도구를 언제 어떻게 사용할지 알려 주는 마크다운 지침 파일입니다. 각 skill은 YAML frontmatter와 마크다운 본문이 포함된 `SKILL.md` 파일이 있는 디렉터리에 위치합니다. OpenClaw는 번들 Skills와 로컬 재정의를 로드하고, 환경, 구성, 바이너리 존재 여부를 기준으로 로드 시점에 필터링합니다.

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
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    커뮤니티 Skills를 찾아보고 설치합니다.
  </Card>
</CardGroup>

## 로드 순서

OpenClaw는 다음 소스에서 로드하며, **우선순위가 높은 순서**입니다. 같은 skill 이름이 여러 위치에 있으면, 가장 높은 소스가 적용됩니다.

| 우선순위 | 소스 | 경로 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 최고 | 작업공간 Skills | `<workspace>/skills` |
| 2 | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills` |
| 3 | 개인 에이전트 Skills | `~/.agents/skills` |
| 4 | 관리형 / 로컬 Skills | `~/.openclaw/skills` |
| 5 | 번들 Skills | 설치와 함께 제공됨 |
| 6 — 최저 | 추가 디렉터리 | `skills.load.extraDirs` + Plugin Skills |

Skill 루트는 그룹화된 레이아웃을 지원합니다. OpenClaw는 구성된 루트 아래 어디에든 `SKILL.md`가 나타나면 skill을 발견합니다.

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

폴더 경로는 구성 목적으로만 사용됩니다. skill의 이름, 슬래시 명령, 허용 목록 키는 모두 `name` frontmatter 필드에서 가져오며, `name`이 없으면 디렉터리 이름에서 가져옵니다.

<Note>
  Codex CLI의 네이티브 `$CODEX_HOME/skills` 디렉터리는 OpenClaw skill 루트가 **아닙니다**. 해당 Skills를 인벤토리화하려면 `openclaw migrate plan codex`를 사용한 다음, OpenClaw 작업공간으로 복사하려면 `openclaw migrate codex`를 사용하세요.
</Note>

## 에이전트별 Skills와 공유 Skills

다중 에이전트 설정에서는 각 에이전트에 자체 작업공간이 있습니다. 원하는 가시성에 맞는 경로를 사용하세요.

| 범위 | 경로 | 표시 대상 |
| -------------- | ---------------------------- | --------------------------- |
| 에이전트별 | `<workspace>/skills` | 해당 에이전트만 |
| 프로젝트 에이전트 | `<workspace>/.agents/skills` | 해당 작업공간의 에이전트만 |
| 개인 에이전트 | `~/.agents/skills` | 이 머신의 모든 에이전트 |
| 공유 관리형 | `~/.openclaw/skills` | 이 머신의 모든 에이전트 |
| 추가 디렉터리 | `skills.load.extraDirs` | 이 머신의 모든 에이전트 |

## 에이전트 허용 목록

Skill **위치**(우선순위)와 skill **가시성**(어떤 에이전트가 사용할 수 있는지)은 별도의 제어입니다. 허용 목록을 사용해 Skills가 어디에서 로드되었는지와 관계없이 에이전트가 볼 수 있는 Skills를 제한하세요.

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
    - 해당 에이전트에 Skills를 노출하지 않으려면 `agents.list[].skills: []`를 설정하세요.
    - 비어 있지 않은 `agents.list[].skills` 목록은 **최종** 집합입니다. 기본값과 병합되지 않습니다.
    - 유효한 허용 목록은 프롬프트 빌드, 슬래시 명령 발견, 샌드박스 동기화, skill 스냅샷 전반에 적용됩니다.
    - 이는 호스트 셸 권한 부여 경계가 아닙니다. 같은 에이전트가 `exec`를 사용할 수 있다면, 샌드박싱, OS 사용자 격리, exec 거부/허용 목록, 리소스별 자격 증명으로 해당 셸을 별도로 제한하세요.

  </Accordion>
</AccordionGroup>

## Plugins 및 Skills

Plugins는 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 제공할 수 있습니다(경로는 Plugin 루트를 기준으로 상대 경로). Plugin이 활성화되면 Plugin Skills가 로드됩니다. 예를 들어 브라우저 Plugin은 다단계 브라우저 제어를 위한 `browser-automation` skill을 제공합니다.

Plugin skill 디렉터리는 `skills.load.extraDirs`와 같은 낮은 우선순위 수준에서 병합되므로, 이름이 같은 번들, 관리형, 에이전트 또는 작업공간 skill이 이를 재정의합니다. Plugin 구성 항목의 `metadata.openclaw.requires.config`를 통해 게이트하세요.

전체 Plugin 시스템은 [Plugins](/ko/tools/plugin) 및 [도구](/ko/tools)를 참조하세요.

## Skill Workshop

[Skill Workshop](/ko/tools/skill-workshop)은 에이전트와 활성 skill 파일 사이의 제안 대기열입니다. 에이전트가 재사용 가능한 작업을 발견하면 `SKILL.md`에 직접 쓰는 대신 제안을 초안으로 작성합니다. 변경 전에 사용자가 검토하고 승인합니다.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

전체 수명 주기, CLI 참조, 구성은 [Skill Workshop](/ko/tools/skill-workshop)을 참조하세요.

## ClawHub에서 설치

[ClawHub](https://clawhub.ai)는 공개 Skills 레지스트리입니다. 설치 및 업데이트에는 `openclaw skills` 명령을 사용하고, 게시 및 동기화에는 `clawhub` CLI를 사용하세요.

| 작업 | 명령 |
| ---------------------------------- | ------------------------------------------------------ |
| 작업공간에 skill 설치 | `openclaw skills install @owner/<slug>` |
| Git 저장소에서 설치 | `openclaw skills install git:owner/repo@ref` |
| 로컬 skill 디렉터리 설치 | `openclaw skills install ./path/to/skill --as my-tool` |
| 모든 로컬 에이전트용으로 설치 | `openclaw skills install @owner/<slug> --global` |
| 모든 작업공간 Skills 업데이트 | `openclaw skills update --all` |
| 공유 관리형 skill 업데이트 | `openclaw skills update @owner/<slug> --global` |
| 모든 공유 관리형 Skills 업데이트 | `openclaw skills update --all --global` |
| skill의 신뢰 엔벌로프 검증 | `openclaw skills verify @owner/<slug>` |
| 생성된 Skill Card 출력 | `openclaw skills verify @owner/<slug> --card` |
| ClawHub CLI를 통해 게시 / 동기화 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="설치 세부 정보">
    `openclaw skills install`은 기본적으로 활성 작업공간의 `skills/` 디렉터리에 설치합니다. 에이전트 허용 목록으로 범위를 좁히지 않는 한 모든 로컬 에이전트에 표시되는 공유 `~/.openclaw/skills` 디렉터리에 설치하려면 `--global`을 추가하세요.

    Git 및 로컬 설치는 소스 루트에 `SKILL.md`가 있어야 합니다. slug는 유효한 경우 `SKILL.md` frontmatter의 `name`에서 가져오며, 그렇지 않으면 디렉터리 또는 저장소 이름으로 대체됩니다. 재정의하려면 `--as <slug>`를 사용하세요. `openclaw skills update`는 ClawHub 설치만 추적합니다. Git 또는 로컬 소스를 새로 고치려면 다시 설치하세요.

  </Accordion>
  <Accordion title="검증 및 보안 스캔">
    `openclaw skills verify @owner/<slug>`는 ClawHub에 skill의 `clawhub.skill.verify.v1` 신뢰 엔벌로프를 요청합니다. 설치된 ClawHub Skills는 `.clawhub/origin.json`에 기록된 버전 및 레지스트리에 대해 검증됩니다. 기존에 설치되었거나 명확한 Skills에 대해서는 bare slug도 계속 허용되지만, 소유자가 포함된 참조는 게시자 모호성을 피합니다.

    ClawHub skill 페이지는 설치 전에 최신 보안 스캔 상태를 표시하며, VirusTotal, ClawScan, 정적 분석에 대한 세부 페이지를 제공합니다. ClawHub가 검증 실패로 표시하면 명령은 0이 아닌 코드로 종료됩니다. 게시자는 ClawHub 대시보드 또는 `clawhub skill rescan @owner/<slug>`를 통해 오탐을 복구합니다.

  </Accordion>
  <Accordion title="비공개 아카이브 설치">
    ClawHub가 아닌 전달이 필요한 Gateway 클라이언트는 `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`으로 zip skill 아카이브를 스테이징한 다음, `skills.install({ source: "upload", ... })`로 설치할 수 있습니다. 이 경로는 기본적으로 꺼져 있으며 `openclaw.json`에서 `skills.install.allowUploadedArchives: true`가 필요합니다. 일반 ClawHub 설치에는 해당 설정이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 보안

<Warning>
  타사 Skills를 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어 보세요. 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 선호하세요. 에이전트 측 제어는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

<AccordionGroup>
  <Accordion title="경로 격리">
    작업공간, 프로젝트 에이전트, 추가 디렉터리 skill 발견은 `skills.load.allowSymlinkTargets`가 대상 루트를 명시적으로 신뢰하지 않는 한, 해석된 realpath가 구성된 루트 내부에 유지되는 skill 루트만 허용합니다. Skill Workshop은 `skills.workshop.allowSymlinkTargetWrites`가 활성화된 경우에만 해당 신뢰된 대상에 씁니다. 관리형 `~/.openclaw/skills` 및 개인 `~/.agents/skills`에는 심볼릭 링크된 skill 폴더가 포함될 수 있지만, 모든 `SKILL.md` realpath는 여전히 해석된 skill 디렉터리 내부에 있어야 합니다.
  </Accordion>
  <Accordion title="운영자 설치 정책">
    skill 설치가 계속되기 전에 신뢰할 수 있는 로컬 정책 명령을 실행하도록 `security.installPolicy`를 구성하세요. 이 정책은 메타데이터와 스테이징된 소스 경로를 받고, ClawHub, 업로드, Git, 로컬, 업데이트, 의존성 설치 경로에 적용되며, 명령이 유효한 결정을 반환하지 못하면 fail closed됩니다.
  </Accordion>
  <Accordion title="비밀 주입 범위">
    `skills.entries.*.env` 및 `skills.entries.*.apiKey`는 해당 에이전트 턴에만 **호스트** 프로세스에 비밀을 주입하며, 샌드박스에는 주입하지 않습니다. 프롬프트와 로그에 비밀을 남기지 마세요.
  </Accordion>
</AccordionGroup>

더 넓은 위협 모델과 보안 체크리스트는 [보안](/ko/gateway/security)을 참조하세요.

## SKILL.md 형식

모든 skill에는 frontmatter에 최소한 `name`과 `description`이 필요합니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw는 [AgentSkills](https://agentskills.io) 사양을 따릅니다. frontmatter 파서는 **단일 줄 키만** 지원합니다. `metadata`는 단일 줄 JSON 객체여야 합니다. 본문에서 skill 폴더 경로를 참조하려면 `{baseDir}`를 사용하세요.
</Note>

### 선택적 frontmatter 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 URL입니다. `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 skill이 사용자가 호출할 수 있는 슬래시 명령으로 노출됩니다.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw는 skill의 지침을 에이전트의 일반 프롬프트에서 제외합니다. `user-invocable`도 `true`이면 skill은 여전히 슬래시 명령으로 사용할 수 있습니다.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하여 등록된 도구로 직접 디스패치됩니다.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정된 경우 호출할 도구 이름입니다.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우, 원시 인수 문자열을 코어 파싱 없이 도구로 전달합니다.
  도구는
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`를 받습니다.
</ParamField>

## 게이팅

OpenClaw는 로드 시점에 `metadata.openclaw`(프런트매터의 한 줄
JSON)를 사용해 스킬을 필터링합니다. `metadata.openclaw` 블록이 없는 스킬은 명시적으로 비활성화되지 않는 한 항상
대상에 포함됩니다.

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
  `true`이면 항상 스킬을 포함하고 다른 모든 게이트를 건너뜁니다.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI에 표시되는 선택적 이모지입니다.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 선택적 URL입니다.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  플랫폼 필터입니다. 설정하면 스킬은 나열된 OS에서만 대상에 포함됩니다.
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
  각 `openclaw.json` 경로는 truthy여야 합니다.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 env var 이름입니다.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 관리자 사양입니다(brew / node / go / uv / download).
</ParamField>

<Note>
  `metadata.openclaw`가 없을 때 레거시 `metadata.clawdbot` 블록도 여전히 허용되므로,
  이전에 설치된 스킬은 종속성 게이트와 설치 관리자 힌트를 유지합니다. 새 스킬은
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
    - 여러 설치 관리자가 나열된 경우 Gateway는 선호 옵션 하나를 선택합니다
      (사용 가능하면 brew, 그렇지 않으면 node).
    - 모든 설치 관리자가 `download`이면, OpenClaw는 사용 가능한 모든 아티팩트를 볼 수 있도록
      각 항목을 나열합니다.
    - 사양에는 플랫폼별 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다
      (기본값: npm; 옵션: npm / pnpm / yarn / bun). 이는 스킬
      설치에만 영향을 주며, Gateway 런타임은 여전히 Node여야 합니다.
    - Gateway 설치 관리자 선호도: Homebrew → uv → 구성된 node manager →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw는 Homebrew를 자동 설치하거나 brew
      formula를 시스템 패키지 명령으로 변환하지 않습니다. `brew`가 없는 Linux 컨테이너에서는
      brew 전용 설치 관리자가 숨겨집니다. 커스텀 이미지를 사용하거나
      종속성을 수동으로 설치하세요.
    - **Go:** `go`가 없고 `brew`를 사용할 수 있으면 Gateway는
      먼저 Homebrew를 통해 Go를 설치하고 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
    - **Download:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`),
      `extract`(기본값: 아카이브가 감지되면 auto), `stripComponents`,
      `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins`는 스킬 로드 시점에 **호스트**에서 확인됩니다. 에이전트가
    샌드박스에서 실행되는 경우, 바이너리는 **컨테이너 내부**에도 존재해야 합니다.
    `agents.defaults.sandbox.docker.setupCommand` 또는 커스텀
    이미지를 통해 설치하세요. `setupCommand`는 컨테이너 생성 후 한 번 실행되며
    네트워크 송신, 쓰기 가능한 루트 FS, 샌드박스의 root 사용자가 필요합니다.
  </Accordion>
</AccordionGroup>

## Config 오버라이드

`~/.openclaw/openclaw.json`의 `skills.entries` 아래에서 번들 또는 관리형 스킬을 토글하고 구성합니다.

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
  `false`는 번들되었거나 설치된 경우에도 스킬을 비활성화합니다. `coding-agent`
  번들 스킬은 옵트인입니다. `skills.entries.coding-agent.enabled: true`를 설정하고
  `claude`, `codex`, `opencode` 또는 지원되는 다른 CLI 중 하나가
  설치 및 인증되어 있는지 확인하세요.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 스킬을 위한 편의 필드입니다.
  일반 텍스트 문자열 또는 SecretRef 객체를 지원합니다.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  에이전트 실행에 주입되는 환경 변수입니다. 변수는 프로세스에 아직 설정되어 있지 않은 경우에만
  주입됩니다.
</ParamField>

<ParamField path="config" type="object">
  커스텀 스킬별 구성 필드를 위한 선택적 백입니다.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **번들** 스킬에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들 스킬만
  대상에 포함됩니다. 관리형 및 워크스페이스 스킬에는 영향을 주지 않습니다.
</ParamField>

<Note>
  Config 키는 기본적으로 **스킬 이름**과 일치합니다. 스킬이
  `metadata.openclaw.skillKey`를 정의하면 `skills.entries` 아래에서 해당 키를 사용하세요.
  하이픈이 포함된 이름은 따옴표로 감싸세요. JSON5는 따옴표로 감싼 키를 허용합니다.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw는 게이팅 규칙, 허용 목록, config 오버라이드를 적용해 에이전트에 대한
    유효 스킬 목록을 해석합니다.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env`와 `skills.entries.<key>.apiKey`가 실행 기간 동안
    `process.env`에 적용됩니다.
  </Step>
  <Step title="Builds the system prompt">
    대상 스킬은 압축된 XML 블록으로 컴파일되어 시스템 프롬프트에 주입됩니다.
  </Step>
  <Step title="Restores the environment">
    실행이 종료된 후 원래 환경이 복원됩니다.
  </Step>
</Steps>

<Warning>
  Env 주입은 샌드박스가 아니라 **호스트** 에이전트 실행으로 범위가 제한됩니다. 샌드박스 내부에서는
  `env`와 `apiKey`가 효과가 없습니다. 샌드박스 실행에 비밀 값을 전달하는 방법은
  [Skills config](/ko/tools/skills-config#sandboxed-skills-and-env-vars)를 참조하세요.
</Warning>

번들 `claude-cli` 백엔드의 경우, OpenClaw는 동일한 대상 스킬 스냅샷을
임시 Claude Code Plugin으로도 구체화하고 `--plugin-dir`을 통해 전달합니다.
다른 CLI 백엔드는 프롬프트 카탈로그만 사용합니다.

## 스냅샷 및 새로 고침

OpenClaw는 **세션이 시작될 때** 대상 스킬의 스냅샷을 만들고 세션의 모든 후속 턴에서
그 목록을 재사용합니다. 스킬 또는 config 변경 사항은 다음 새 세션에 적용됩니다.

세션 중 스킬은 두 가지 경우에 새로 고쳐집니다.

- Skills 감시자가 `SKILL.md` 변경을 감지합니다.
- 새 대상 원격 노드가 연결됩니다.

새로 고쳐진 목록은 다음 에이전트 턴에서 사용됩니다. 유효 에이전트 허용 목록이 변경되면,
OpenClaw는 보이는 스킬이 일치하도록 스냅샷을 새로 고칩니다.

<AccordionGroup>
  <Accordion title="Skills watcher">
    기본적으로 OpenClaw는 스킬 폴더를 감시하고 `SKILL.md` 파일이 변경되면
    스냅샷을 갱신합니다. `skills.load` 아래에서 구성합니다.

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

    `allowSymlinkTargets`는 스킬 루트 심볼릭 링크가 구성된 루트 밖을 가리키는
    의도적인 심볼릭 링크 레이아웃에 사용하세요. 예:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Skill Workshop도 신뢰된 심볼릭 링크 경로를 통해 제안을 적용해야 하는 경우에만
    `skills.workshop.allowSymlinkTargetWrites`를 활성화하세요.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Gateway가 Linux에서 실행되지만 **macOS 노드**가 `system.run` 허용 상태로
    연결된 경우, 필요한 바이너리가 해당 노드에 있으면 OpenClaw는 macOS 전용 스킬을
    대상에 포함된 것으로 처리할 수 있습니다. 에이전트는 `host=node`와 함께 `exec`
    도구를 사용해 해당 스킬을 실행해야 합니다.

    오프라인 노드는 원격 전용 스킬을 표시하지 **않습니다**. 노드가 bin 프로브에
    응답을 중지하면 OpenClaw는 캐시된 bin 매치를 지웁니다.

  </Accordion>
</AccordionGroup>

## 토큰 영향

스킬이 대상에 포함되면 OpenClaw는 압축된 XML 블록을 시스템 프롬프트에 주입합니다.
비용은 결정적입니다.

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **기본 오버헤드**(스킬이 1개 이상일 때만): 약 195자
- **스킬당:** 약 97자 + `name`, `description`, `location` 필드 길이
- XML 이스케이프는 `& < > " '`를 엔터티로 확장하여 발생할 때마다 몇 글자를 추가합니다
- 약 4자/token 기준으로, 97자는 필드 길이를 제외하고 스킬당 약 24 token입니다

프롬프트 오버헤드를 최소화하려면 description을 짧고 설명적으로 유지하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ko/tools/creating-skills" icon="hammer">
    커스텀 스킬을 작성하는 단계별 가이드입니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안 작성한 스킬을 위한 제안 대기열입니다.
  </Card>
  <Card title="Skills config" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` config 스키마 및 에이전트 허용 목록입니다.
  </Card>
  <Card title="Slash commands" href="/ko/tools/slash-commands" icon="terminal">
    스킬 슬래시 명령이 등록되고 라우팅되는 방식입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    공개 레지스트리에서 스킬을 탐색하고 게시합니다.
  </Card>
  <Card title="Plugins" href="/ko/tools/plugin" icon="plug">
    Plugin은 문서화하는 도구와 함께 스킬을 제공할 수 있습니다.
  </Card>
</CardGroup>
