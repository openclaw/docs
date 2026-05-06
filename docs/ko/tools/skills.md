---
read_when:
    - Skills 추가 또는 수정
    - 스킬 게이팅, 허용 목록 또는 로드 규칙 변경
    - 스킬 우선순위 및 스냅샷 동작 이해
sidebarTitle: Skills
summary: 'Skills: 관리형과 작업공간, 게이팅 규칙, 에이전트 허용 목록 및 구성 연결'
title: Skills
x-i18n:
    generated_at: "2026-05-06T06:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw는 에이전트에게 도구 사용법을 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** Skills 폴더를 사용합니다. 각 Skills는 YAML frontmatter와 지침이 포함된 `SKILL.md`를 담은 디렉터리입니다. OpenClaw는 번들 Skills와 선택적 로컬 재정의를 로드하고, 환경, 구성, 바이너리 존재 여부를 기준으로 로드 시점에 필터링합니다.

## 위치와 우선순위

OpenClaw는 다음 소스에서 Skills를 로드하며, **가장 높은 우선순위가 먼저** 적용됩니다.

| #   | 소스                  | 경로                             |
| --- | --------------------- | -------------------------------- |
| 1   | 워크스페이스 Skills   | `<workspace>/skills`             |
| 2   | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills`     |
| 3   | 개인 에이전트 Skills  | `~/.agents/skills`               |
| 4   | 관리형/로컬 Skills    | `~/.openclaw/skills`             |
| 5   | 번들 Skills           | 설치 시 함께 제공됨             |
| 6   | 추가 Skills 폴더      | `skills.load.extraDirs` (구성)   |

Skills 이름이 충돌하면 가장 높은 소스가 우선합니다.

Codex CLI의 기본 `$CODEX_HOME/skills` 디렉터리는 이러한 OpenClaw Skills 루트 중 하나가 아닙니다. Codex 하네스 모드에서는 로컬 앱 서버 실행이 에이전트별로 격리된 Codex 홈을 사용하므로, 개인 Codex CLI Skills는 암시적으로 로드되지 않습니다. 이를 인벤토리하려면 `openclaw migrate codex --dry-run`을 사용하고, 현재 OpenClaw 에이전트 워크스페이스로 복사하기 전에 대화형 체크박스 프롬프트로 Skills 디렉터리를 선택하려면 `openclaw migrate codex`를 사용하세요. 비대화형 실행의 경우 복사할 정확한 Skills마다 `--skill <name>`을 반복해서 지정하세요.

## 에이전트별 Skills와 공유 Skills

**멀티 에이전트** 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다.

| 범위                 | 경로                                        | 표시 대상                   |
| -------------------- | ------------------------------------------- | --------------------------- |
| 에이전트별           | `<workspace>/skills`                        | 해당 에이전트만             |
| 프로젝트 에이전트    | `<workspace>/.agents/skills`                | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트        | `~/.agents/skills`                          | 해당 머신의 모든 에이전트   |
| 공유 관리형/로컬     | `~/.openclaw/skills`                        | 해당 머신의 모든 에이전트   |
| 공유 추가 디렉터리   | `skills.load.extraDirs` (가장 낮은 우선순위) | 해당 머신의 모든 에이전트   |

여러 위치에 같은 이름이 있으면 → 가장 높은 소스가 우선합니다. 워크스페이스가 프로젝트 에이전트보다, 프로젝트 에이전트가 개인 에이전트보다, 개인 에이전트가 관리형/로컬보다, 관리형/로컬이 번들보다, 번들이 추가 디렉터리보다 우선합니다.

## 에이전트 Skills 허용 목록

Skills **위치**와 Skills **가시성**은 별도의 제어 항목입니다. 위치/우선순위는 같은 이름의 Skills 중 어떤 복사본이 우선하는지 결정하고, 에이전트 허용 목록은 에이전트가 실제로 사용할 수 있는 Skills를 결정합니다.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="허용 목록 규칙">
    - 기본적으로 Skills에 제한을 두지 않으려면 `agents.defaults.skills`를 생략하세요.
    - `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략하세요.
    - Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정하세요.
    - 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 **최종** 집합입니다. 기본값과 병합되지 않습니다.
    - 유효 허용 목록은 프롬프트 구성, Skills 슬래시 명령 검색, 샌드박스 동기화, Skills 스냅샷 전반에 적용됩니다.
  </Accordion>
</AccordionGroup>

## Plugin과 Skills

Plugin은 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 제공할 수 있습니다(경로는 Plugin 루트 기준 상대 경로). Plugin이 활성화되면 Plugin Skills가 로드됩니다. 이는 도구 설명에 넣기에는 너무 길지만 Plugin이 설치되어 있을 때 항상 사용할 수 있어야 하는 도구별 운영 가이드를 두기에 적합한 위치입니다. 예를 들어 브라우저 Plugin은 다단계 브라우저 제어를 위한 `browser-automation` Skills를 제공합니다.

Plugin Skills 디렉터리는 `skills.load.extraDirs`와 같은 낮은 우선순위 경로로 병합되므로, 같은 이름의 번들, 관리형, 에이전트 또는 워크스페이스 Skills가 이를 재정의합니다. Plugin의 구성 항목에서 `metadata.openclaw.requires.config`를 통해 게이트를 설정할 수 있습니다.

검색/구성은 [Plugins](/ko/tools/plugin)를, 해당 Skills가 가르치는 도구 표면은 [도구](/ko/tools)를 참조하세요.

## Skill Workshop

선택 사항이자 실험적인 **Skill Workshop** Plugin은 에이전트 작업 중 관찰된 재사용 가능한 절차에서 워크스페이스 Skills를 생성하거나 업데이트할 수 있습니다. 기본적으로 비활성화되어 있으며 `plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 쓰고, 생성된 콘텐츠를 스캔하며, 승인 대기 또는 자동 안전 쓰기를 지원하고, 안전하지 않은 제안을 격리하며, 성공적으로 쓰기 작업을 마친 뒤 Skills 스냅샷을 새로 고쳐 Gateway 재시작 없이 새 Skills를 사용할 수 있게 합니다.

_"다음번에는 GIF 출처를 확인"_ 같은 수정 사항이나 미디어 QA 체크리스트처럼 힘들게 얻은 워크플로에 사용하세요. 승인 대기부터 시작하고, 자동 쓰기는 제안을 검토한 뒤 신뢰할 수 있는 워크스페이스에서만 사용하세요. 전체 가이드: [Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 및 동기화)

[ClawHub](https://clawhub.ai)는 OpenClaw의 공개 Skills 레지스트리입니다. 검색/설치/업데이트에는 기본 `openclaw skills` 명령을 사용하거나, 게시/동기화 워크플로에는 별도의 `clawhub` CLI를 사용하세요. 전체 가이드: [ClawHub](/ko/tools/clawhub).

| 작업                               | 명령                                   |
| ---------------------------------- | -------------------------------------- |
| 워크스페이스에 Skills 설치         | `openclaw skills install <skill-slug>` |
| 설치된 모든 Skills 업데이트        | `openclaw skills update --all`         |
| 동기화(스캔 + 업데이트 게시)       | `clawhub sync --all`                   |

기본 `openclaw skills install`은 활성 워크스페이스의 `skills/` 디렉터리에 설치합니다. 별도의 `clawhub` CLI도 현재 작업 디렉터리 아래의 `./skills`에 설치합니다(또는 구성된 OpenClaw 워크스페이스로 대체). OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.
구성된 Skills 루트는 `skills/<group>/<skill>/SKILL.md`처럼 한 단계의 그룹화도 지원하므로, 관련 타사 Skills를 광범위한 재귀 스캔 없이 공유 폴더 아래에 보관할 수 있습니다.

ClawHub Skills 페이지는 설치 전에 최신 보안 스캔 상태를 표시하며, VirusTotal, ClawScan, 정적 분석에 대한 스캐너 상세 페이지를 제공합니다. `openclaw skills install <slug>`는 여전히 설치 경로일 뿐입니다. 게시자는 ClawHub 대시보드 또는 `clawhub skill rescan <slug>`를 통해 오탐을 복구합니다.

## 보안

<Warning>
타사 Skills를 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요. 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 선호하세요. 에이전트 측 제어는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

- 워크스페이스 및 추가 디렉터리 Skills 검색은 해석된 실제 경로가 구성된 루트 내부에 남아 있는 Skills 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 Skills 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 관리자 메타데이터를 실행하기 전에 내장 위험 코드 스캐너를 실행합니다. 호출자가 위험한 재정의를 명시적으로 설정하지 않는 한 `critical` 결과는 기본적으로 차단됩니다. 의심스러운 결과는 여전히 경고만 표시합니다.
- `openclaw skills install <slug>`는 다릅니다. 이는 ClawHub Skills 폴더를 워크스페이스로 다운로드하며, 위의 설치 관리자 메타데이터 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴의 **호스트** 프로세스(샌드박스가 아님)에 시크릿을 주입합니다. 시크릿을 프롬프트와 로그에 포함하지 마세요.

더 넓은 위협 모델과 체크리스트는 [보안](/ko/gateway/security)을 참조하세요.

## SKILL.md 형식

`SKILL.md`에는 최소한 다음이 포함되어야 합니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw는 레이아웃/의도에 대해 AgentSkills 사양을 따릅니다. 내장 에이전트가 사용하는 파서는 **단일 줄** frontmatter 키만 지원합니다. `metadata`는 **단일 줄 JSON 객체**여야 합니다. 지침에서 Skills 폴더 경로를 참조하려면 `{baseDir}`을 사용하세요.

### 선택적 frontmatter 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 URL입니다. `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 Skills가 사용자 슬래시 명령으로 노출됩니다.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw는 해당 Skills의 지침을 에이전트의 일반 프롬프트에서 제외합니다. Skills는 여전히 설치되어 있으며, `user-invocable`도 `true`일 때 슬래시 명령으로 명시적으로 실행할 수 있습니다.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령은 모델을 우회하고 도구로 직접 디스패치됩니다.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정되었을 때 호출할 도구 이름입니다.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우 원시 args 문자열을 도구에 전달합니다(코어 파싱 없음). 도구는 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`로 호출됩니다.
</ParamField>

## 게이팅(로드 시점 필터)

OpenClaw는 `metadata`(단일 줄 JSON)를 사용하여 로드 시점에 Skills를 필터링합니다.

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

`metadata.openclaw` 아래의 필드:

<ParamField path="always" type="boolean">
  `true`이면 항상 Skills를 포함합니다(다른 게이트 건너뜀).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI에서 사용하는 선택적 이모지입니다.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 선택적 URL입니다.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  선택적 플랫폼 목록입니다. 설정하면 해당 OS에서만 Skills가 대상이 됩니다.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  각각이 `PATH`에 있어야 합니다.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  최소 하나가 `PATH`에 있어야 합니다.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var가 존재하거나 구성에서 제공되어야 합니다.
</ParamField>
<ParamField path="requires.config" type="string[]">
  참이어야 하는 `openclaw.json` 경로 목록입니다.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 Env var 이름입니다.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 관리자 사양입니다(brew/node/go/uv/download).
</ParamField>

`metadata.openclaw`가 없으면 Skills는 항상 대상이 됩니다(구성에서 비활성화되었거나 번들 Skills에 대해 `skills.allowBundled`로 차단된 경우 제외).

<Note>
레거시 `metadata.clawdbot` 블록은 `metadata.openclaw`가 없을 때 여전히 허용되므로, 이전에 설치된 Skills는 의존성 게이트와 설치 관리자 힌트를 계속 유지합니다. 새 Skills와 업데이트된 Skills는 `metadata.openclaw`를 사용해야 합니다.
</Note>

### 샌드박싱 참고 사항

- `requires.bins`는 Skills 로드 시점에 **호스트**에서 확인됩니다.
- 에이전트가 샌드박스 처리된 경우 바이너리는 **컨테이너 내부**에도 있어야 합니다. `agents.defaults.sandbox.docker.setupCommand`(또는 사용자 지정 이미지)를 통해 설치하세요. `setupCommand`는 컨테이너가 생성된 뒤 한 번 실행됩니다. 패키지 설치에는 네트워크 이그레스, 쓰기 가능한 루트 FS, 샌드박스의 루트 사용자도 필요합니다.
- 예: `summarize` Skills(`skills/summarize/SKILL.md`)가 샌드박스 컨테이너에서 실행되려면 해당 컨테이너 안에 `summarize` CLI가 필요합니다.

### 설치 관리자 사양

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
  <Accordion title="설치 관리자 선택 규칙">
    - 여러 설치 관리자가 나열된 경우 Gateway는 하나의 선호 옵션을 선택합니다. 사용 가능한 경우 brew를 선택하고, 그렇지 않으면 node를 선택합니다.
    - 모든 설치 관리자가 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 나열합니다.
    - 설치 관리자 사양에는 플랫폼별로 옵션을 필터링하기 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun). 이는 skill 설치에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 하며, Bun은 WhatsApp/Telegram에 권장되지 않습니다.
    - Gateway 기반 설치 관리자 선택은 선호도에 따라 이루어집니다. 설치 사양에 여러 종류가 섞여 있으면 OpenClaw는 `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 선호한 다음, `uv`, 구성된 node 관리자, 그리고 `go` 또는 `download` 같은 다른 대체 항목 순으로 선택합니다.
    - 모든 설치 사양이 `download`이면 OpenClaw는 하나의 선호 설치 관리자로 축약하지 않고 모든 다운로드 옵션을 표시합니다.

  </Accordion>
  <Accordion title="설치 관리자별 세부 정보">
    - **Go 설치:** `go`가 없고 `brew`를 사용할 수 있으면 Gateway는 먼저 Homebrew로 Go를 설치하고, 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
    - **다운로드 설치:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: 아카이브가 감지되면 자동), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## 구성 재정의

번들 및 관리형 skill은 `~/.openclaw/openclaw.json`의 `skills.entries` 아래에서 토글하고 env 값을 제공할 수 있습니다.

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false`는 skill이 번들로 제공되었거나 설치되어 있더라도 비활성화합니다.
  번들 `coding-agent` skill은 옵트인 방식입니다. 에이전트에 노출하기 전에
  `skills.entries.coding-agent.enabled: true`를 설정한 다음,
  `claude`, `codex`, `opencode`, `pi` 중 하나가 설치되어 있고
  자체 CLI에 인증되어 있는지 확인하세요.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 skill을 위한 편의 기능입니다. 일반 텍스트 또는 SecretRef를 지원합니다.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  변수가 프로세스에 아직 설정되어 있지 않은 경우에만 주입됩니다.
</ParamField>
<ParamField path="config" type="object">
  사용자 지정 skill별 필드를 위한 선택적 모음입니다. 사용자 지정 키는 반드시 여기에 있어야 합니다.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **번들** skill에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들 skill만 대상이 됩니다(관리형/작업공간 skill에는 영향 없음).
</ParamField>

skill 이름에 하이픈이 포함되어 있으면 키를 따옴표로 감싸세요(JSON5는 따옴표로 감싼 키를 허용합니다). 구성 키는 기본적으로 **skill 이름**과 일치합니다. skill이 `metadata.openclaw.skillKey`를 정의하는 경우 `skills.entries` 아래에서 해당 키를 사용하세요.

<Note>
OpenClaw 내부의 기본 이미지 생성/편집에는 번들 skill 대신
`agents.defaults.imageGenerationModel`과 함께 핵심 `image_generate` 도구를 사용하세요.
여기의 skill 예시는 사용자 지정 또는 서드파티 워크플로용입니다.
네이티브 이미지 분석에는 `agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요.
`openai/*`, `google/*`, `fal/*` 또는 다른 제공자별 이미지 모델을 선택하는 경우 해당 제공자의
인증/API 키도 추가하세요.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

1. skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 및 `skills.entries.<key>.apiKey`를 `process.env`에 적용합니다.
3. **대상** skill을 포함해 시스템 프롬프트를 빌드합니다.
4. 실행이 끝난 뒤 원래 환경을 복원합니다.

환경 주입은 전역 셸 환경이 아니라 **에이전트 실행으로 범위가 제한**됩니다.

번들 `claude-cli` 백엔드의 경우 OpenClaw는 동일한 대상 스냅샷을 임시 Claude Code Plugin으로도 구체화하고 `--plugin-dir`와 함께 전달합니다. 그러면 Claude Code는 네이티브 skill 해석기를 사용할 수 있으며, OpenClaw는 여전히 우선순위, 에이전트별 허용 목록, 게이팅, `skills.entries.*` env/API 키 주입을 관리합니다. 다른 CLI 백엔드는 프롬프트 카탈로그만 사용합니다.

## 스냅샷 및 새로고침

OpenClaw는 **세션이 시작될 때** 대상 skill의 스냅샷을 만들고 같은 세션의 이후 턴에서 그 목록을 재사용합니다. skill 또는 구성 변경 사항은 다음 새 세션부터 적용됩니다.

다음 두 가지 경우에는 세션 중간에도 skill이 새로고침될 수 있습니다.

- skill 감시자가 활성화된 경우.
- 새 대상 원격 노드가 나타난 경우.

이를 **핫 리로드**로 생각하면 됩니다. 새로고침된 목록은 다음 에이전트 턴에서 반영됩니다. 해당 세션의 유효한 에이전트 skill 허용 목록이 변경되면 OpenClaw는 표시되는 skill이 현재 에이전트와 계속 일치하도록 스냅샷을 새로고침합니다.

### skill 감시자

기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 skill 스냅샷을 갱신합니다. `skills.load` 아래에서 구성하세요.

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### 원격 macOS 노드(Linux gateway)

Gateway가 Linux에서 실행되지만 **macOS 노드**가 연결되어 있고
`system.run`이 허용되어 있으면(Exec 승인 보안이 `deny`로 설정되지 않음)
OpenClaw는 필요한 바이너리가 해당 노드에 있을 때 macOS 전용 skill을 대상으로 간주할 수 있습니다. 에이전트는 `host=node`와 함께 `exec` 도구를 사용해 해당 skill을 실행해야 합니다.

이는 노드가 명령 지원 정보를 보고하고 `system.which` 또는 `system.run`을 통한 bin 프로브가 이루어지는 것에 의존합니다. 오프라인 노드는 원격 전용 skill을 표시하지 **않습니다**. 연결된 노드가 bin 프로브에 응답하지 않으면 OpenClaw는 캐시된 bin 일치 항목을 지워 에이전트가 현재 실행할 수 없는 skill을 더 이상 보지 않도록 합니다.

## 토큰 영향

skill이 대상이 되면 OpenClaw는 사용 가능한 skill의 간결한 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다.

- **기본 오버헤드**(skill이 1개 이상일 때만): 195자.
- **skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이.

공식(문자 수):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 이스케이프는 `& < > " '`를 엔터티(`&amp;`, `&lt;` 등)로 확장하여 길이를 늘립니다.
토큰 수는 모델 토크나이저에 따라 달라집니다. 대략적인 OpenAI 스타일 추정치는 약 4자/토큰이므로, skill당 **97자 ≈ 24토큰**에 실제 필드 길이가 더해집니다.

## 관리형 skill 수명 주기

OpenClaw는 설치(npm 패키지 또는 OpenClaw.app)와 함께 기준 skill 세트를 **번들 skill**로 제공합니다. `~/.openclaw/skills`는 로컬 재정의를 위해 존재합니다. 예를 들어 번들 복사본을 변경하지 않고 skill을 고정하거나 패치할 수 있습니다. 작업공간 skill은 사용자가 소유하며 이름 충돌 시 둘 모두를 재정의합니다.

## 더 많은 skill을 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)를 살펴보세요. 전체 구성 스키마: [Skills 구성](/ko/tools/skills-config).

## 관련 항목

- [ClawHub](/ko/tools/clawhub) - 공개 skill 레지스트리
- [skill 만들기](/ko/tools/creating-skills) - 사용자 지정 skill 빌드
- [Plugins](/ko/tools/plugin) - Plugin 시스템 개요
- [Skill Workshop plugin](/ko/plugins/skill-workshop) - 에이전트 작업에서 skill 생성
- [Skills 구성](/ko/tools/skills-config) - skill 구성 참조
- [슬래시 명령](/ko/tools/slash-commands) - 사용 가능한 모든 슬래시 명령
