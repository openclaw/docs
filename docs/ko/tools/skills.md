---
read_when:
    - Skills 추가 또는 수정하기
    - Skill 게이팅 또는 로드 규칙 변경하기
summary: 'Skills: 관리형 vs workspace, 게이팅 규칙, 그리고 config/env 연결 wiring'
title: Skills
x-i18n:
    generated_at: "2026-04-25T06:13:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw는 도구 사용 방법을 에이전트에게 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** Skill 폴더를 사용합니다. 각 Skill은 YAML frontmatter와 지침이 포함된 `SKILL.md`를 가진 디렉터리입니다. OpenClaw는 **번들된 Skills**와 선택적 로컬 재정의를 로드하고, 환경, config, 바이너리 존재 여부에 따라 로드 시점에 필터링합니다.

## 위치와 우선순위

OpenClaw는 다음 소스에서 Skills를 로드합니다:

1. **추가 Skill 폴더**: `skills.load.extraDirs`로 구성
2. **번들된 Skills**: 설치물과 함께 제공됨(npm 패키지 또는 OpenClaw.app)
3. **관리형/로컬 Skills**: `~/.openclaw/skills`
4. **개인 agent Skills**: `~/.agents/skills`
5. **프로젝트 agent Skills**: `<workspace>/.agents/skills`
6. **Workspace Skills**: `<workspace>/skills`

Skill 이름이 충돌하면 우선순위는 다음과 같습니다:

`<workspace>/skills` (가장 높음) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들된 Skills → `skills.load.extraDirs` (가장 낮음)

## 에이전트별 Skills vs 공유 Skills

**멀티 에이전트** 구성에서는 각 에이전트가 자체 workspace를 가집니다. 즉:

- **에이전트별 Skills**는 해당 에이전트 전용 `<workspace>/skills`에 위치합니다.
- **프로젝트 agent Skills**는 `<workspace>/.agents/skills`에 위치하며, 일반 workspace `skills/` 폴더보다 먼저 해당 workspace에 적용됩니다.
- **개인 agent Skills**는 `~/.agents/skills`에 위치하며, 해당 머신의 여러 workspace에 걸쳐 적용됩니다.
- **공유 Skills**는 `~/.openclaw/skills`(관리형/로컬)에 위치하며, 같은 머신의 **모든 에이전트**에서 볼 수 있습니다.
- **공유 폴더**는 여러 에이전트가 사용하는 공통 Skills 팩이 필요할 경우 `skills.load.extraDirs`를 통해 추가할 수도 있습니다(가장 낮은 우선순위).

같은 Skill 이름이 여러 위치에 있으면 일반 우선순위가 적용됩니다:
workspace가 우선이고, 그다음 프로젝트 agent Skills, 개인 agent Skills,
관리형/로컬, 번들, extra dirs 순입니다.

## 에이전트 Skill allowlist

Skill의 **위치**와 Skill의 **가시성**은 별개의 제어입니다.

- 위치/우선순위는 같은 이름의 Skill 중 어느 복사본이 이기는지 결정합니다.
- 에이전트 allowlist는 보이는 Skill 중 어떤 것을 에이전트가 실제로 사용할 수 있는지 결정합니다.

공유 기준선에는 `agents.defaults.skills`를 사용하고, 에이전트별 재정의에는
`agents.list[].skills`를 사용하세요:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // defaults 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

규칙:

- 기본적으로 제한 없는 Skills를 원하면 `agents.defaults.skills`를 생략하세요.
- `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills가 없게 하려면 `agents.list[].skills: []`를 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  defaults와 병합되지 않습니다.

OpenClaw는 실제 에이전트 Skill 집합을 프롬프트 구성, Skill 슬래시 명령 검색, sandbox 동기화, Skill 스냅샷 전반에 적용합니다.

## Plugins + Skills

Plugins는 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 함께 제공할 수 있습니다(경로는 Plugin 루트 기준 상대 경로). Plugin이 활성화되면 Plugin Skills도 로드됩니다. 이는 도구 설명에 넣기에는 너무 길지만 Plugin이 설치되어 있을 때 항상 사용할 수 있어야 하는 도구별 운영 가이드를 두기에 적절한 위치입니다. 예를 들어 브라우저 Plugin은 다단계 브라우저 제어를 위한 `browser-automation` Skill을 함께 제공합니다. 현재 이러한 디렉터리는 `skills.load.extraDirs`와 동일한 낮은 우선순위 경로에 병합되므로, 같은 이름의 번들, 관리형, agent, 또는 workspace Skill이 이를 재정의합니다.
Plugin config 항목의 `metadata.openclaw.requires.config`를 통해 이를 게이팅할 수 있습니다.
검색/config는 [Plugins](/ko/tools/plugin)를, 이러한 Skills가 설명하는 도구 표면은 [Tools](/ko/tools)를 참고하세요.

## Skill Workshop

선택적이며 실험적인 Skill Workshop Plugin은 에이전트 작업 중 관찰된 재사용 가능한 절차로부터 workspace Skills를 생성하거나 업데이트할 수 있습니다. 이 기능은 기본적으로 비활성화되어 있으며 `plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 기록하고, 생성된 콘텐츠를 검사하며,
보류 중 승인 또는 자동 안전 쓰기를 지원하고, 안전하지 않은 제안은 격리하며,
성공적으로 기록한 뒤 Skill 스냅샷을 새로 고쳐 Gateway 재시작 없이 새 Skill이 사용 가능해질 수 있게 합니다.

“다음에는 GIF 출처를 확인해라” 같은 수정 사항이나 미디어 QA 체크리스트 같은 힘들게 얻은 워크플로를 지속 가능한 절차적 지침으로 만들고 싶을 때 사용하세요. 보류 승인부터 시작하고, 제안을 검토한 뒤 신뢰할 수 있는 workspace에서만 자동 쓰기를 사용하세요. 전체 가이드:
[Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw용 공개 Skills 레지스트리입니다.
[https://clawhub.ai](https://clawhub.ai)에서 둘러볼 수 있습니다. 검색/설치/업데이트에는 네이티브 `openclaw skills`
명령을 사용하고, 게시/동기화 워크플로가 필요할 때는 별도의 `clawhub` CLI를 사용하세요.
전체 가이드: [ClawHub](/ko/tools/clawhub).

일반적인 흐름:

- Skill을 workspace에 설치:
  - `openclaw skills install <skill-slug>`
- 설치된 모든 Skill 업데이트:
  - `openclaw skills update --all`
- 동기화(스캔 + 업데이트 게시):
  - `clawhub sync --all`

네이티브 `openclaw skills install`은 활성 workspace의 `skills/`
디렉터리에 설치합니다. 별도의 `clawhub` CLI도 현재 작업 디렉터리 아래 `./skills`에 설치하며
(또는 구성된 OpenClaw workspace로 대체합니다).
OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.

## 보안 참고

- 서드파티 Skills는 **신뢰할 수 없는 코드**로 취급하세요. 활성화 전에 읽어보세요.
- 신뢰할 수 없는 입력 및 위험한 도구에는 sandbox 실행을 우선하세요. [Sandboxing](/ko/gateway/sandboxing)을 참고하세요.
- Workspace 및 extra-dir Skill 검색은 확인된 realpath가 구성된 루트 안에 머무는 Skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 Skill 종속성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 메타데이터를 실행하기 전에 내장 dangerous-code 스캐너를 실행합니다. `critical` 발견 사항은 호출자가 위험 재정의를 명시적으로 설정하지 않는 한 기본적으로 차단되고, 의심스러운 항목은 경고만 합니다.
- `openclaw skills install <slug>`는 다릅니다. 이것은 ClawHub Skill 폴더를 workspace에 다운로드할 뿐이며 위의 설치 메타데이터 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴 동안 **호스트** 프로세스에 비밀 값을 주입합니다
  (sandbox가 아님). 프롬프트와 로그에는 비밀을 넣지 마세요.
- 더 넓은 위협 모델과 체크리스트는 [Security](/ko/gateway/security)를 참고하세요.

## 형식 (AgentSkills + Pi 호환)

`SKILL.md`에는 최소한 다음이 포함되어야 합니다:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

참고:

- 레이아웃/의도는 AgentSkills 사양을 따릅니다.
- 내장 에이전트가 사용하는 파서는 **단일 줄** frontmatter 키만 지원합니다.
- `metadata`는 **단일 줄 JSON 객체**여야 합니다.
- Skill 폴더 경로를 참조하려면 지침에서 `{baseDir}`를 사용하세요.
- 선택적 frontmatter 키:
  - `homepage` — macOS Skills UI에 “Website”로 표시되는 URL(`metadata.openclaw.homepage`로도 지원).
  - `user-invocable` — `true|false`(기본값: `true`). `true`이면 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false`(기본값: `false`). `true`이면 모델 프롬프트에서 제외됩니다(사용자 호출은 계속 가능).
  - `command-dispatch` — `tool`(선택 사항). `tool`로 설정하면 슬래시 명령이 모델을 우회하고 도구로 직접 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정된 경우 호출할 도구 이름.
  - `command-arg-mode` — `raw`(기본값). 도구 디스패치 시 원시 args 문자열을 도구로 전달합니다(core 파싱 없음).

    도구는 다음 params로 호출됩니다:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅 (로드 시 필터)

OpenClaw는 `metadata`(단일 줄 JSON)를 사용해 **로드 시점에 Skills를 필터링**합니다:

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

- `always: true` — 항상 포함(다른 게이트 건너뜀).
- `emoji` — macOS Skills UI에서 사용하는 선택적 emoji.
- `homepage` — macOS Skills UI에 “Website”로 표시되는 선택적 URL.
- `os` — 선택적 플랫폼 목록(`darwin`, `linux`, `win32`). 설정되면 해당 OS에서만 Skill 사용 가능.
- `requires.bins` — 목록, 각 항목이 `PATH`에 존재해야 함.
- `requires.anyBins` — 목록, 최소 하나가 `PATH`에 존재해야 함.
- `requires.env` — 목록, env var가 존재해야 하거나 config에서 제공되어야 함.
- `requires.config` — truthy여야 하는 `openclaw.json` 경로 목록.
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연결된 env var 이름.
- `install` — macOS Skills UI에서 사용하는 선택적 installer spec 배열(brew/node/go/uv/download).

`metadata.openclaw`가 없을 때는 레거시 `metadata.clawdbot` 블록도 계속 허용되므로,
오래전에 설치된 Skill도 종속성 게이트와 installer 힌트를 유지합니다. 새 Skill과 업데이트된 Skill은
`metadata.openclaw`를 사용해야 합니다.

sandboxing 관련 참고:

- `requires.bins`는 Skill 로드 시점에 **호스트**에서 검사됩니다.
- 에이전트가 sandboxed 상태라면, 해당 바이너리는 **컨테이너 내부에도** 있어야 합니다.
  `agents.defaults.sandbox.docker.setupCommand`(또는 사용자 지정 이미지)로 설치하세요.
  `setupCommand`는 컨테이너 생성 후 한 번 실행됩니다.
  패키지 설치에는 sandbox 내부의 네트워크 이그레스, 쓰기 가능한 루트 FS, 루트 사용자도 필요합니다.
  예: `summarize` Skill(`skills/summarize/SKILL.md`)은 sandbox에서 실행하려면
  sandbox 컨테이너 안에 `summarize` CLI가 필요합니다.

Installer 예시:

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

참고:

- 여러 installer가 나열되어 있으면 gateway는 **하나의** 선호 옵션만 선택합니다(brew가 가능하면 brew, 아니면 node).
- 모든 installer가 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 모두 나열합니다.
- Installer spec은 플랫폼별 옵션 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
- Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun).
  이는 **Skill 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 하며
  (Bun은 WhatsApp/Telegram에 권장되지 않음).
- Gateway 기반 installer 선택은 node 전용이 아니라 선호도 기반입니다:
  install spec이 여러 kind를 섞고 있으면 OpenClaw는
  `skills.install.preferBrew`가 활성화되어 있고 `brew`가 있으면 Homebrew를 우선하고, 그다음 `uv`, 그다음 구성된 node manager, 그다음 `go`나 `download` 같은 다른 대체 경로를 선택합니다.
- 모든 install spec이 `download`이면 OpenClaw는 하나의 선호 installer로 축소하지 않고
  모든 다운로드 옵션을 표시합니다.
- Go 설치: `go`가 없고 `brew`가 있으면 gateway는 먼저 Homebrew로 Go를 설치하고 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
- Download 설치: `url`(필수), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: archive 감지 시 자동), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면, 해당 Skill은 항상 사용할 수 있습니다
(config에서 비활성화되었거나 번들된 Skill에 대해 `skills.allowBundled`로 차단된 경우 제외).

## Config 재정의 (`~/.openclaw/openclaw.json`)

번들/관리형 Skills는 토글할 수 있고 env 값을 제공할 수 있습니다:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 평문 문자열
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

참고: Skill 이름에 하이픈이 포함되면 키를 따옴표로 감싸세요(JSON5는 따옴표가 있는 키를 허용함).

OpenClaw 내부에서 기본 이미지 생성/편집을 원한다면 번들 Skill 대신
`agents.defaults.imageGenerationModel`과 함께 core
`image_generate` 도구를 사용하세요. 여기의 Skill 예시는 사용자 지정 또는 서드파티 워크플로용입니다.

네이티브 이미지 분석에는 `agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요.
네이티브 이미지 생성/편집에는
`agents.defaults.imageGenerationModel`과 함께 `image_generate`를 사용하세요. `openai/*`, `google/*`,
`fal/*` 또는 다른 프로바이더 전용 이미지 모델을 선택한다면, 해당 프로바이더의 인증/API
키도 함께 추가하세요.

Config 키는 기본적으로 **Skill 이름**과 일치합니다. Skill이
`metadata.openclaw.skillKey`를 정의했다면 `skills.entries` 아래에서 해당 키를 사용하세요.

규칙:

- `enabled: false`는 번들/설치되어 있어도 해당 Skill을 비활성화합니다.
- `env`: 프로세스에 해당 변수가 아직 설정되어 있지 **않을 때만** 주입됩니다.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언한 Skills를 위한 편의 기능입니다.
  평문 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.
- `config`: 사용자 지정 per-skill 필드를 위한 선택적 bag입니다. 사용자 지정 키는 여기에 있어야 합니다.
- `allowBundled`: **번들된** Skills 전용 선택적 allowlist입니다. 설정되면 목록에 있는 번들 Skill만 사용 가능합니다(관리형/workspace Skills는 영향 없음).

## 환경 주입 (에이전트 실행별)

에이전트 실행이 시작되면 OpenClaw는:

1. Skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를
   `process.env`에 적용합니다.
3. **사용 가능한** Skills로 시스템 프롬프트를 구성합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

이것은 전역 셸 환경이 아니라 **에이전트 실행 범위**에 한정됩니다.

번들된 `claude-cli` 백엔드의 경우, OpenClaw는 같은
사용 가능 스냅샷을 임시 Claude Code Plugin으로도 구체화하고,
`--plugin-dir`과 함께 전달합니다. 그러면 Claude Code는 자체 네이티브 Skill resolver를 사용할 수 있고, OpenClaw는 여전히 우선순위, 에이전트별 allowlist, 게이팅,
`skills.entries.*` env/API 키 주입을 계속 소유합니다. 다른 CLI 백엔드는 프롬프트
카탈로그만 사용합니다.

## 세션 스냅샷 (성능)

OpenClaw는 세션이 시작될 때 사용 가능한 Skills를 **스냅샷**하고 같은 세션의 이후 턴에 그 목록을 재사용합니다. Skills 또는 config에 대한 변경 사항은 다음 새 세션에서 적용됩니다.

Skills watcher가 활성화되었거나 새로 사용 가능한 원격 Node가 나타나면 세션 중간에도 Skills를 새로 고칠 수 있습니다(아래 참조). 이를 **핫 리로드**처럼 생각하면 됩니다. 새로 고쳐진 목록은 다음 에이전트 턴에서 반영됩니다.

해당 세션의 실제 에이전트 Skill allowlist가 변경되면, OpenClaw는 현재 에이전트와 표시되는 Skills가 계속 일치하도록 스냅샷을 새로 고칩니다.

## 원격 macOS Node (Linux gateway)

Gateway가 Linux에서 실행되지만 **macOS Node**가 연결되어 있고 **`system.run`이 허용되는 경우**(Exec approvals security가 `deny`로 설정되지 않음), OpenClaw는 필요한 바이너리가 해당 Node에 존재할 때 macOS 전용 Skills를 사용 가능한 것으로 취급할 수 있습니다. 에이전트는 `host=node`와 함께 `exec` 도구를 통해 해당 Skills를 실행해야 합니다.

이것은 Node가 자신의 명령 지원 상태를 보고하고 `system.run`을 통한 bin probe를 수행하는 것에 의존합니다. 나중에 macOS Node가 오프라인이 되더라도 Skills는 계속 표시되며, Node가 다시 연결될 때까지 호출이 실패할 수 있습니다.

## Skills watcher (자동 새로 고침)

기본적으로 OpenClaw는 Skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 Skills 스냅샷을 갱신합니다. 이는 `skills.load` 아래에서 구성합니다:

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

## 토큰 영향 (Skills 목록)

Skills를 사용할 수 있을 때 OpenClaw는 사용 가능한 Skills의 간결한 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다:

- **기본 오버헤드 (Skill이 1개 이상일 때만):** 195자
- **Skill당:** 97자 + XML escape 처리된 `<name>`, `<description>`, `<location>` 값 길이

공식 (문자 수):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고:

- XML escape는 `& < > " '`를 엔티티(`&amp;`, `&lt;` 등)로 확장하므로 길이가 늘어납니다.
- 토큰 수는 모델 tokenizer에 따라 다릅니다. 대략 OpenAI 스타일 추정으로는 약 4자/토큰이므로, **97자 ≈ 24토큰**이며 여기에 실제 필드 길이가 추가됩니다.

## 관리형 Skills 수명 주기

OpenClaw는 설치물(npm 패키지 또는 OpenClaw.app)의 일부로 **번들된 Skills**라는 기본 Skill 세트를 제공합니다. `~/.openclaw/skills`는 로컬 재정의용으로 존재합니다(예: 번들된 복사본을 변경하지 않고 Skill을 고정/패치). Workspace Skills는 사용자 소유이며 이름 충돌 시 둘 다 재정의합니다.

## Config 참조

전체 config 스키마는 [Skills config](/ko/tools/skills-config)를 참고하세요.

## 더 많은 Skills를 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)에서 둘러보세요.

---

## 관련 항목

- [Skills 만들기](/ko/tools/creating-skills) — 사용자 지정 Skills 빌드
- [Skills Config](/ko/tools/skills-config) — Skill 구성 참조
- [Slash Commands](/ko/tools/slash-commands) — 사용 가능한 모든 슬래시 명령어
- [Plugins](/ko/tools/plugin) — Plugin 시스템 개요
