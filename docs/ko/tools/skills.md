---
read_when:
    - Skills 추가 또는 수정
    - Skill 게이팅, 허용 목록 또는 로드 규칙 변경
    - Skill 우선순위와 스냅샷 동작 이해
sidebarTitle: Skills
summary: 'Skills: 관리형과 워크스페이스, 게이팅 규칙, 에이전트 허용 목록, 구성 연결'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw는 도구 사용 방법을 에이전트에 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** Skill
폴더를 사용합니다. 각 Skill은
YAML 프론트매터와 지침이 포함된 `SKILL.md`를 담고 있는 디렉터리입니다. OpenClaw는
번들된 Skills와 선택적 로컬 재정의를 로드하고,
환경, 구성, 바이너리 존재 여부에 따라 로드 시점에 이를 필터링합니다.

## 위치 및 우선순위

OpenClaw는 다음 소스에서 Skills를 로드하며, **우선순위가 높은 순서부터** 나열됩니다:

| #   | 소스                  | 경로                             |
| --- | --------------------- | -------------------------------- |
| 1   | 워크스페이스 Skills   | `<workspace>/skills`             |
| 2   | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills`  |
| 3   | 개인 에이전트 Skills  | `~/.agents/skills`               |
| 4   | 관리형/로컬 Skills    | `~/.openclaw/skills`             |
| 5   | 번들된 Skills         | 설치와 함께 제공됨               |
| 6   | 추가 Skill 폴더       | `skills.load.extraDirs` (구성)   |

Skill 이름이 충돌하면 가장 우선순위가 높은 소스가 사용됩니다.

## 에이전트별 Skills vs 공유 Skills

**멀티 에이전트** 구성에서는 각 에이전트가 자체 워크스페이스를 가집니다:

| 범위               | 경로                                        | 표시 대상                  |
| ------------------ | ------------------------------------------- | -------------------------- |
| 에이전트별         | `<workspace>/skills`                        | 해당 에이전트만            |
| 프로젝트 에이전트  | `<workspace>/.agents/skills`                | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트      | `~/.agents/skills`                          | 해당 머신의 모든 에이전트  |
| 공유 관리형/로컬   | `~/.openclaw/skills`                        | 해당 머신의 모든 에이전트  |
| 공유 추가 디렉터리 | `skills.load.extraDirs` (가장 낮은 우선순위) | 해당 머신의 모든 에이전트  |

같은 이름이 여러 위치에 있으면 → 가장 우선순위가 높은 소스가 사용됩니다. 워크스페이스가
프로젝트 에이전트보다 우선하고, 프로젝트 에이전트는 개인 에이전트보다, 개인 에이전트는 관리형/로컬보다, 관리형/로컬은 번들보다,
번들은 추가 디렉터리보다 우선합니다.

## 에이전트 Skill 허용 목록

Skill **위치**와 Skill **가시성**은 별개의 제어입니다.
위치/우선순위는 같은 이름의 Skill 중 어떤 복사본이 사용될지를 결정하고, 에이전트
허용 목록은 에이전트가 실제로 어떤 Skills를 사용할 수 있는지를 결정합니다.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="허용 목록 규칙">
    - 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
    - `agents.list[].skills`를 생략하면 `agents.defaults.skills`를 상속합니다.
    - Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정하세요.
    - 비어 있지 않은 `agents.list[].skills` 목록은 해당
      에이전트의 **최종** 집합이며 기본값과 병합되지 않습니다.
    - 유효 허용 목록은 프롬프트 빌드, Skill
      슬래시 명령 검색, 샌드박스 동기화, Skill 스냅샷 전반에 적용됩니다.
  </Accordion>
</AccordionGroup>

## Plugins 및 Skills

Plugins는
`openclaw.plugin.json`에 `skills` 디렉터리(Plugin 루트 기준 상대 경로)를 나열하여 자체 Skills를 제공할 수 있습니다. Plugin Skills는
Plugin이 활성화되면 로드됩니다. 이는 도구 설명에는 너무 길지만
Plugin이 설치될 때마다 사용 가능해야 하는 도구별
운영 가이드를 두기에 적절한 위치입니다. 예를 들어 브라우저
Plugin은 다단계 브라우저 제어를 위한 `browser-automation` Skill을 제공합니다.

Plugin Skill 디렉터리는
`skills.load.extraDirs`와 동일한 낮은 우선순위 경로에 병합되므로,
같은 이름의 번들, 관리형, 에이전트 또는
워크스페이스 Skill이 이를 재정의합니다. 다음을 통해 게이트할 수 있습니다:
Plugin 구성 항목의 `metadata.openclaw.requires.config`.

검색/구성은 [Plugins](/ko/tools/plugin)를, 이러한 Skills가 설명하는
도구 표면은 [Tools](/ko/tools)를 참조하세요.

## Skill Workshop

선택적이며 실험적인 **Skill Workshop** Plugin은 에이전트 작업 중 관찰된 재사용 가능한 절차를 바탕으로
워크스페이스 Skills를 생성하거나 업데이트할 수 있습니다. 기본적으로 비활성화되어 있으며
`plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 기록하고, 생성된
콘텐츠를 검사하며, 보류 중 승인 또는 자동 안전 쓰기를 지원하고,
안전하지 않은 제안은 격리하며, 쓰기가 성공하면 Skill 스냅샷을 새로 고쳐
Gateway 재시작 없이 새 Skills를 사용할 수 있게 합니다.

_“다음에는 GIF 출처를 확인하기”_ 같은 수정 사항이나
미디어 QA 체크리스트 같은 힘들게 얻은 워크플로에 사용하세요. 먼저 보류 중 승인으로 시작하고,
제안을 검토한 뒤 신뢰할 수 있는 워크스페이스에서만 자동 쓰기를 사용하세요.
전체 가이드: [Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 및 동기화)

[ClawHub](https://clawhub.ai)는 OpenClaw용 공개 Skills 레지스트리입니다.
검색/설치/업데이트에는 네이티브 `openclaw skills` 명령을 사용하고, 게시/동기화 워크플로에는
별도의 `clawhub` CLI를 사용하세요. 전체 가이드:
[ClawHub](/ko/tools/clawhub).

| 작업                                  | 명령                                   |
| ------------------------------------- | -------------------------------------- |
| 워크스페이스에 Skill 설치             | `openclaw skills install <skill-slug>` |
| 설치된 모든 Skills 업데이트           | `openclaw skills update --all`         |
| 동기화(스캔 + 업데이트 게시)          | `clawhub sync --all`                   |

네이티브 `openclaw skills install`은 활성 워크스페이스의
`skills/` 디렉터리에 설치합니다. 별도의 `clawhub` CLI도
현재 작업 디렉터리 아래 `./skills`에 설치하며(또는 구성된 OpenClaw 워크스페이스로 대체됨),
OpenClaw는 다음 세션에서 이를
`<workspace>/skills`로 인식합니다.

## 보안

<Warning>
서드파티 Skills는 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 우선 사용하세요.
에이전트 측 제어는
[샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

- 워크스페이스 및 추가 디렉터리 Skill 검색은 확인된 realpath가 구성된 루트 내부에 머무는 Skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 Skill 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 프로그램 메타데이터를 실행하기 전에 내장 위험 코드 스캐너를 실행합니다. `critical` 탐지 결과는 호출자가 명시적으로 위험 재정의를 설정하지 않는 한 기본적으로 차단되며, 의심스러운 탐지 결과는 여전히 경고만 표시합니다.
- `openclaw skills install <slug>`는 다릅니다. ClawHub Skill 폴더를 워크스페이스로 다운로드하며 위 설치 프로그램 메타데이터 경로는 사용하지 않습니다.
- `skills.entries.*.env` 및 `skills.entries.*.apiKey`는 해당 에이전트 턴에 대해 **호스트** 프로세스에 비밀 정보를 주입합니다(샌드박스가 아님). 비밀 정보가 프롬프트와 로그에 들어가지 않게 하세요.

더 넓은 위협 모델과 체크리스트는 [보안](/ko/gateway/security)을 참조하세요.

## `SKILL.md` 형식

`SKILL.md`에는 최소한 다음이 포함되어야 합니다:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw는 레이아웃/의도에 대해 AgentSkills 사양을 따릅니다. 내장된 에이전트가 사용하는 파서는
**한 줄짜리** 프론트매터 키만 지원합니다.
`metadata`는 **한 줄짜리 JSON 객체**여야 합니다. 지침에서
Skill 폴더 경로를 참조하려면 `{baseDir}`를 사용하세요.

### 선택적 프론트매터 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 URL. `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 Skill이 사용자 슬래시 명령으로 노출됩니다.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 Skill이 모델 프롬프트에서 제외됩니다(사용자 호출로는 여전히 사용 가능).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하고 직접 도구로 디스패치됩니다.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정된 경우 호출할 도구 이름.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우 원시 args 문자열을 도구에 전달합니다(코어 파싱 없음). 도구는 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`로 호출됩니다.
</ParamField>

## 게이팅(로드 시 필터)

OpenClaw는 `metadata`(한 줄 JSON)를 사용해 로드 시점에 Skills를 필터링합니다:

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

`metadata.openclaw` 아래 필드:

<ParamField path="always" type="boolean">
  `true`이면 Skill을 항상 포함합니다(다른 게이트 건너뜀).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI에서 사용하는 선택적 이모지.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI에 "Website"로 표시되는 선택적 URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  선택적 플랫폼 목록. 설정하면 Skill은 해당 OS에서만 적격합니다.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  각각 `PATH`에 존재해야 합니다.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  최소 하나는 `PATH`에 존재해야 합니다.
</ParamField>
<ParamField path="requires.env" type="string[]">
  환경 변수가 존재하거나 구성에서 제공되어야 합니다.
</ParamField>
<ParamField path="requires.config" type="string[]">
  참값이어야 하는 `openclaw.json` 경로 목록.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 환경 변수 이름.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 프로그램 사양(brew/node/go/uv/download).
</ParamField>

`metadata.openclaw`가 없으면 Skill은 항상 적격합니다(
구성에서 비활성화되었거나 번들된 Skills에 대해 `skills.allowBundled`에 의해 차단된 경우 제외).

<Note>
레거시 `metadata.clawdbot` 블록도
`metadata.openclaw`가 없을 때는 여전히 허용되므로, 이전에 설치된 Skills가
의존성 게이트와 설치 프로그램 힌트를 계속 유지할 수 있습니다. 새 Skills와 업데이트된 Skills는
`metadata.openclaw`를 사용해야 합니다.
</Note>

### 샌드박싱 참고

- `requires.bins`는 Skill 로드 시점에 **호스트**에서 확인됩니다.
- 에이전트가 샌드박싱된 경우 바이너리는 **컨테이너 내부에도** 있어야 합니다. `agents.defaults.sandbox.docker.setupCommand`(또는 사용자 지정 이미지)를 통해 설치하세요. `setupCommand`는 컨테이너 생성 후 한 번 실행됩니다. 패키지 설치에는 샌드박스 내부의 네트워크 송신, 쓰기 가능한 루트 FS, 루트 사용자도 필요합니다.
- 예: `summarize` Skill(`skills/summarize/SKILL.md`)은 샌드박스 컨테이너에서 실행하려면 컨테이너 내부에 `summarize` CLI가 필요합니다.

### 설치 프로그램 사양

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
              "label": "Gemini CLI 설치 (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="설치 프로그램 선택 규칙">
    - 여러 설치 프로그램이 나열되어 있으면 Gateway는 선호되는 단일 옵션을 선택합니다(`brew`를 사용할 수 있으면 `brew`, 아니면 `node`).
    - 모든 설치 프로그램이 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 모두 나열합니다.
    - 설치 프로그램 사양에는 플랫폼별로 옵션을 필터링하기 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun). 이는 Skill 설치에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 하며 WhatsApp/Telegram에는 Bun을 권장하지 않습니다.
    - Gateway 기반 설치 프로그램 선택은 선호도 기반입니다. 설치 사양에 여러 종류가 섞여 있으면 OpenClaw는 `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 우선하고, 그다음 `uv`, 그다음 구성된 node manager, 이후 `go` 또는 `download` 같은 다른 대체 수단을 사용합니다.
    - 모든 설치 사양이 `download`이면 OpenClaw는 하나의 선호 설치 프로그램으로 축약하지 않고 모든 다운로드 옵션을 표시합니다.

  </Accordion>
  <Accordion title="설치 프로그램별 세부 사항">
    - **Go 설치:** `go`가 없고 `brew`를 사용할 수 있으면 Gateway는 먼저 Homebrew를 통해 Go를 설치하고, 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
    - **다운로드 설치:** `url`(필수), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (기본값: 아카이브 감지 시 자동), `stripComponents`, `targetDir` (기본값: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## 구성 재정의

번들 및 관리형 Skills는 `~/.openclaw/openclaw.json`의
`skills.entries` 아래에서 토글하고 환경 값을 제공할 수 있습니다:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 문자열
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
  `false`이면 번들되었거나 설치된 Skill이라도 비활성화됩니다.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언한 Skills를 위한 편의 기능입니다. 일반 문자열 또는 SecretRef를 지원합니다.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  해당 변수가 프로세스에 아직 설정되어 있지 않은 경우에만 주입됩니다.
</ParamField>
<ParamField path="config" type="object">
  사용자 지정 Skill별 필드를 위한 선택적 저장소입니다. 사용자 지정 키는 여기에 있어야 합니다.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **번들된** Skills 전용 선택적 허용 목록입니다. 설정되면 목록에 있는 번들 Skills만 적격하며(관리형/워크스페이스 Skills는 영향 없음).
</ParamField>

Skill 이름에 하이픈이 포함되어 있으면 키를 따옴표로 감싸세요(JSON5는
따옴표가 있는 키를 허용합니다). 구성 키는 기본적으로 **Skill 이름**과 일치합니다.
Skill이 `metadata.openclaw.skillKey`를 정의한 경우
`skills.entries` 아래에서 해당 키를 사용하세요.

<Note>
OpenClaw 내부에서 기본 이미지 생성/편집을 사용하려면 번들 Skill 대신
`agents.defaults.imageGenerationModel`과 함께 코어
`image_generate` 도구를 사용하세요. 여기의 Skill 예시는 사용자 지정 또는 서드파티
워크플로용입니다. 네이티브 이미지 분석에는
`agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요. `openai/*`, `google/*`,
`fal/*` 또는 다른 제공자별 이미지 모델을 선택하는 경우 해당 제공자의
인증/API 키도 추가하세요.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다:

1. Skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env`와 `skills.entries.<key>.apiKey`를 `process.env`에 적용합니다.
3. **적격한** Skills로 시스템 프롬프트를 빌드합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

환경 주입은 전역 셸 환경이 아니라 **에이전트 실행 범위로 제한**됩니다.

번들된 `claude-cli` 백엔드의 경우 OpenClaw는 동일한
적격 스냅샷을 임시 Claude Code Plugin으로도 구체화하고
`--plugin-dir`로 전달합니다. 그러면 Claude Code는 네이티브 Skill 확인자를 사용할 수 있고, 동시에 OpenClaw는 우선순위, 에이전트별 허용 목록, 게이팅, 그리고
`skills.entries.*` 환경/API 키 주입을 계속 관리합니다. 다른 CLI 백엔드는
프롬프트 카탈로그만 사용합니다.

## 스냅샷 및 새로 고침

OpenClaw는 세션이 시작될 때 **적격한 Skills를 스냅샷**하고
동일한 세션의 이후 턴에서도 그 목록을 재사용합니다. Skills 또는 구성 변경 사항은 다음 새 세션부터 적용됩니다.

다음 두 경우에는 세션 중간에도 Skills가 새로 고쳐질 수 있습니다:

- Skills watcher가 활성화되어 있는 경우
- 새 적격 원격 Node가 나타나는 경우

이를 **핫 리로드**로 생각하면 됩니다. 새로 고쳐진 목록은 다음
에이전트 턴에서 반영됩니다. 해당 세션의 유효 에이전트 Skill 허용 목록이 변경되면
OpenClaw는 보이는 Skills가 현재 에이전트와 계속 일치하도록 스냅샷을 새로 고칩니다.

### Skills watcher

기본적으로 OpenClaw는 Skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면
Skills 스냅샷을 갱신합니다. `skills.load` 아래에서 구성합니다:

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

### 원격 macOS Nodes (Linux Gateway)

Gateway가 Linux에서 실행되지만 **macOS Node**가
`system.run` 허용 상태로 연결되어 있으면(Exec approvals 보안이 `deny`로 설정되지 않음),
OpenClaw는 해당 Node에 필요한
바이너리가 존재할 때 macOS 전용 Skills를 적격한 것으로 간주할 수 있습니다. 에이전트는
그러한 Skills를 `host=node`와 함께 `exec` 도구로 실행해야 합니다.

이는 Node가 명령 지원을 보고하고
`system.which` 또는 `system.run`을 통한 바이너리 프로브에 의존합니다. 오프라인 Nodes는
원격 전용 Skills를 보이게 하지 **않습니다**. 연결된 Node가 바이너리 프로브에 더 이상 응답하지 않으면
OpenClaw는 캐시된 바이너리 일치를 지워 에이전트가 현재 실행할 수 없는
Skills를 더 이상 보지 않도록 합니다.

## 토큰 영향

Skills가 적격하면 OpenClaw는 사용 가능한
Skills의 간결한 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의
`formatSkillsForPrompt` 사용). 비용은 결정적입니다:

- **기본 오버헤드**(Skill이 1개 이상일 때만): 195자
- **Skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이

공식(문자 수):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 이스케이프는 `& < > " '`를 엔터티(`&amp;`, `&lt;` 등)로 확장하여
길이를 늘립니다. 토큰 수는 모델 토크나이저에 따라 달라집니다. 대략적인
OpenAI 스타일 추정치는 약 4자/토큰이므로, **97자는 약 24토큰**이며
여기에 실제 필드 길이가 더해집니다.

## 관리형 Skills 수명 주기

OpenClaw는 설치물(npm 패키지 또는 OpenClaw.app)과 함께 제공되는
**번들된 Skills** 기본 세트를 포함합니다. `~/.openclaw/skills`는
로컬 재정의를 위한 용도입니다. 예를 들어 번들 복사본을 변경하지 않고
Skill을 고정하거나 패치할 수 있습니다. 워크스페이스 Skills는 사용자 소유이며
이름 충돌 시 둘 다 재정의합니다.

## 더 많은 Skills를 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)를 둘러보세요. 전체 구성
스키마: [Skills config](/ko/tools/skills-config).

## 관련 항목

- [ClawHub](/ko/tools/clawhub) — 공개 Skills 레지스트리
- [Skills 만들기](/ko/tools/creating-skills) — 사용자 지정 Skills 구축
- [Plugins](/ko/tools/plugin) — Plugin 시스템 개요
- [Skill Workshop Plugin](/ko/plugins/skill-workshop) — 에이전트 작업에서 Skills 생성
- [Skills config](/ko/tools/skills-config) — Skill 구성 참조
- [슬래시 명령](/ko/tools/slash-commands) — 사용 가능한 모든 슬래시 명령
