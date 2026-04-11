---
read_when:
    - Skills 추가 또는 수정하기
    - Skill 게이팅 또는 로드 규칙 변경하기
summary: 'Skills: 관리형과 워크스페이스형, 게이팅 규칙, 그리고 config/env 연결 방식'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw는 에이전트가 도구 사용법을 익히도록 **[AgentSkills](https://agentskills.io) 호환**
skill 폴더를 사용합니다. 각 skill은 YAML frontmatter와 지침이 들어 있는 `SKILL.md`를 포함한 디렉터리입니다. OpenClaw는 **번들 skill**과 선택적 로컬 override를 함께 로드하고, 환경, config, 바이너리 존재 여부를 기준으로 로드 시점에 필터링합니다.

## 위치 및 우선순위

OpenClaw는 다음 소스에서 skill을 로드합니다:

1. **추가 skill 폴더**: `skills.load.extraDirs`로 구성
2. **번들 skill**: 설치물(npm 패키지 또는 OpenClaw.app)에 포함
3. **관리형/로컬 skill**: `~/.openclaw/skills`
4. **개인 agent skill**: `~/.agents/skills`
5. **프로젝트 agent skill**: `<workspace>/.agents/skills`
6. **워크스페이스 skill**: `<workspace>/skills`

skill 이름이 충돌하는 경우 우선순위는 다음과 같습니다:

`<workspace>/skills`(최우선) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 skill → `skills.load.extraDirs`(최하위)

## 에이전트별 skill vs 공유 skill

**멀티 에이전트** 구성에서는 각 에이전트가 자체 워크스페이스를 가집니다. 즉:

- **에이전트별 skill**은 해당 에이전트 전용 `<workspace>/skills`에 위치합니다.
- **프로젝트 agent skill**은 `<workspace>/.agents/skills`에 위치하며
  일반 워크스페이스 `skills/` 폴더보다 먼저 그 워크스페이스에 적용됩니다.
- **개인 agent skill**은 `~/.agents/skills`에 위치하며
  해당 머신의 모든 워크스페이스에 적용됩니다.
- **공유 skill**은 `~/.openclaw/skills`(관리형/로컬)에 위치하며
  같은 머신의 **모든 에이전트**에서 볼 수 있습니다.
- 여러 에이전트가 공통 skill 팩을 사용하게 하려면 `skills.load.extraDirs`를 통해
  **공유 폴더**를 추가할 수도 있습니다(가장 낮은 우선순위).

같은 이름의 skill이 여러 위치에 있으면 일반적인 우선순위가 적용됩니다:
워크스페이스가 우선이고, 그다음 프로젝트 agent skill, 개인 agent skill,
관리형/로컬, 번들, 추가 디렉터리 순입니다.

## 에이전트 skill allowlist

Skill **위치**와 skill **가시성**은 별도의 제어입니다.

- 위치/우선순위는 같은 이름의 skill 중 어떤 복사본이 선택되는지 결정합니다.
- 에이전트 allowlist는 가시적인 skill 중 에이전트가 실제로 어떤 skill을 사용할 수 있는지 결정합니다.

공유 기준선은 `agents.defaults.skills`를 사용하고, 에이전트별로
`agents.list[].skills`에서 override하세요:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // defaults 대체
      { id: "locked-down", skills: [] }, // skill 없음
    ],
  },
}
```

규칙:

- 기본적으로 skill을 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
- `agents.list[].skills`를 생략하면 `agents.defaults.skills`를 상속합니다.
- skill이 전혀 없게 하려면 `agents.list[].skills: []`를 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  defaults와 병합되지 않습니다.

OpenClaw는 유효한 에이전트 skill 집합을 프롬프트 구성, skill 슬래시 명령 검색,
샌드박스 동기화, skill 스냅샷 전반에 적용합니다.

## Plugins + skills

Plugins는 `openclaw.plugin.json`에 `skills` 디렉터리(플러그인 루트 기준 상대 경로)를
나열하여 자체 skill을 포함할 수 있습니다. plugin이 활성화되면 plugin skill도 로드됩니다.
현재 이 디렉터리들은 `skills.load.extraDirs`와 동일한 저우선순위 경로로 병합되므로,
같은 이름의 번들, 관리형, agent, 워크스페이스 skill이 이를 override합니다.
plugin의 config 항목에서 `metadata.openclaw.requires.config`를 통해 게이팅할 수 있습니다.
검색/구성은 [Plugins](/ko/tools/plugin), 해당 skill이 가르치는 도구 표면은 [Tools](/ko/tools)를 참고하세요.

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw용 공개 skill 레지스트리입니다.
[https://clawhub.ai](https://clawhub.ai)에서 탐색할 수 있습니다. 기본 `openclaw skills`
명령으로 skill을 검색/설치/업데이트하거나, 게시/동기화 워크플로우가 필요할 때는 별도 `clawhub` CLI를 사용하세요.
전체 가이드: [ClawHub](/ko/tools/clawhub).

일반적인 흐름:

- 워크스페이스에 skill 설치:
  - `openclaw skills install <skill-slug>`
- 설치된 모든 skill 업데이트:
  - `openclaw skills update --all`
- 동기화(스캔 + 업데이트 게시):
  - `clawhub sync --all`

기본 `openclaw skills install`은 활성 워크스페이스의 `skills/`
디렉터리에 설치합니다. 별도 `clawhub` CLI도 현재 작업 디렉터리의 `./skills`에 설치하며
(또는 구성된 OpenClaw 워크스페이스로 fallback합니다).
OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.

## 보안 참고

- 서드파티 skill은 **신뢰되지 않은 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
- 신뢰되지 않은 입력과 위험한 도구에는 샌드박스 실행을 우선하세요. [Sandboxing](/ko/gateway/sandboxing)을 참고하세요.
- 워크스페이스 및 extra-dir skill 검색은 확인된 realpath가 구성된 루트 내부에 머무르는 skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 skill 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 메타데이터를 실행하기 전에 내장된 위험 코드 스캐너를 실행합니다. 호출자가 명시적으로 위험 override를 설정하지 않으면 `critical` 결과는 기본적으로 차단되며, 의심스러운 결과는 경고만 표시됩니다.
- `openclaw skills install <slug>`는 다릅니다. 이 명령은 ClawHub skill 폴더를 워크스페이스로 다운로드하며, 위의 설치 메타데이터 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴에 대해 비밀 정보를 **호스트** 프로세스에 주입합니다
  (샌드박스가 아님). 비밀 정보는 프롬프트와 로그에 남기지 마세요.
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
- 임베디드 에이전트에서 사용하는 파서는 **한 줄짜리** frontmatter 키만 지원합니다.
- `metadata`는 **한 줄짜리 JSON 객체**여야 합니다.
- skill 폴더 경로를 참조하려면 지침에서 `{baseDir}`를 사용하세요.
- 선택적 frontmatter 키:
  - `homepage` — macOS Skills UI에서 “Website”로 표시되는 URL (`metadata.openclaw.homepage`로도 지원).
  - `user-invocable` — `true|false` (기본값: `true`). `true`이면 해당 skill은 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false` (기본값: `false`). `true`이면 해당 skill은 모델 프롬프트에서 제외됩니다(여전히 사용자 호출로는 사용 가능).
  - `command-dispatch` — `tool` (선택 사항). `tool`로 설정하면 슬래시 명령은 모델을 우회하고 도구로 직접 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정된 경우 호출할 도구 이름.
  - `command-arg-mode` — `raw` (기본값). 도구 디스패치 시 원시 args 문자열을 도구로 그대로 전달합니다(코어 파싱 없음).

    도구는 다음 params로 호출됩니다:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅 (로드 시점 필터)

OpenClaw는 로드 시점에 `metadata`(한 줄 JSON)를 사용하여 skill을 **필터링**합니다:

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

- `always: true` — 항상 skill을 포함합니다(다른 게이트 무시).
- `emoji` — macOS Skills UI에서 사용하는 선택적 이모지.
- `homepage` — macOS Skills UI에서 “Website”로 표시되는 선택적 URL.
- `os` — 선택적 플랫폼 목록(`darwin`, `linux`, `win32`). 설정된 경우 해당 OS에서만 skill이 유효합니다.
- `requires.bins` — 목록; 각각이 `PATH`에 존재해야 합니다.
- `requires.anyBins` — 목록; 이 중 하나 이상이 `PATH`에 존재해야 합니다.
- `requires.env` — 목록; 환경 변수가 존재해야 하며 **또는** config에서 제공되어야 합니다.
- `requires.config` — truthy여야 하는 `openclaw.json` 경로 목록.
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연결된 환경 변수 이름.
- `install` — macOS Skills UI에서 사용하는 선택적 설치 프로그램 사양 배열(brew/node/go/uv/download).

샌드박싱 관련 참고:

- `requires.bins`는 skill 로드 시점에 **호스트**에서 검사됩니다.
- 에이전트가 샌드박스에 있으면 해당 바이너리도 **컨테이너 내부**에 있어야 합니다.
  `agents.defaults.sandbox.docker.setupCommand`(또는 커스텀 이미지)로 설치하세요.
  `setupCommand`는 컨테이너 생성 후 한 번 실행됩니다.
  패키지 설치에는 네트워크 egress, 쓰기 가능한 루트 파일시스템, 그리고 샌드박스 내 root 사용자도 필요합니다.
  예: `summarize` skill(`skills/summarize/SKILL.md`)은 샌드박스 컨테이너 안에
  `summarize` CLI가 있어야 거기서 실행할 수 있습니다.

설치 프로그램 예시:

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

참고:

- 여러 설치 프로그램이 나열되어 있으면 gateway는 **하나의** 선호 옵션을 선택합니다(brew가 가능하면 brew, 아니면 node).
- 모든 설치 프로그램이 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 모두 표시합니다.
- 설치 프로그램 사양에는 플랫폼별 옵션 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
- Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun).
  이는 **skill 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node를 사용해야 합니다
  (WhatsApp/Telegram에는 Bun이 권장되지 않음).
- Gateway 기반 설치 프로그램 선택은 node 전용이 아니라 선호도 기반입니다:
  설치 사양에 여러 종류가 섞여 있으면 OpenClaw는
  `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 우선하고, 그다음 `uv`, 그다음
  구성된 node manager, 그다음 `go`나 `download` 같은 다른 fallback을 사용합니다.
- 모든 설치 사양이 `download`이면 OpenClaw는 하나의 선호 설치 프로그램으로 축약하지 않고
  모든 다운로드 옵션을 표시합니다.
- Go 설치: `go`가 없고 `brew`가 있으면 gateway는 먼저 Homebrew로 Go를 설치하고, 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
- 다운로드 설치: `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: archive가 감지되면 자동), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면 해당 skill은 항상 유효합니다
(config에서 비활성화되었거나 번들 skill에 대해 `skills.allowBundled`로 차단된 경우 제외).

## Config override (`~/.openclaw/openclaw.json`)

번들/관리형 skill은 토글할 수 있으며 env 값도 제공할 수 있습니다:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
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

참고: skill 이름에 하이픈이 포함되어 있으면 키를 따옴표로 감싸세요(JSON5는 따옴표 친 키를 허용함).

OpenClaw 자체 안에서 기본 이미지 생성/편집을 사용하려면 번들
skill 대신 코어 `image_generate` 도구와 `agents.defaults.imageGenerationModel`을 사용하세요.
여기 skill 예시는 사용자 정의 또는 서드파티 워크플로우용입니다.

기본 이미지 분석에는 `agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요.
기본 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과 함께 `image_generate`를 사용하세요.
`openai/*`, `google/*`,
`fal/*` 또는 다른 provider 전용 이미지 모델을 선택했다면, 해당 provider의 인증/API
키도 추가하세요.

Config 키는 기본적으로 **skill 이름**과 일치합니다. skill이
`metadata.openclaw.skillKey`를 정의하면 `skills.entries` 아래에서 그 키를 사용하세요.

규칙:

- `enabled: false`이면 번들/설치된 skill이라도 비활성화됩니다.
- `env`: 해당 변수가 프로세스에 이미 설정되어 있지 않은 경우에만 **주입됩니다**.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언한 skill을 위한 편의 기능입니다.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.
- `config`: 사용자 정의 skill별 필드를 위한 선택적 묶음입니다. 사용자 정의 키는 여기에 있어야 합니다.
- `allowBundled`: **번들** skill 전용 선택적 allowlist입니다. 설정하면
  목록에 있는 번들 skill만 유효합니다(관리형/워크스페이스 skill에는 영향 없음).

## 환경 주입 (에이전트 실행별)

에이전트 실행이 시작되면 OpenClaw는:

1. skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를
   `process.env`에 적용합니다.
3. **유효한** skill로 시스템 프롬프트를 구성합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

이것은 전역 셸 환경이 아니라 **에이전트 실행 범위로 한정**됩니다.

번들된 `claude-cli` 백엔드의 경우, OpenClaw는 동일한
유효 스냅샷을 임시 Claude Code plugin으로도 구성하고
`--plugin-dir`와 함께 전달합니다. 그러면 Claude Code는 자체 네이티브 skill 확인자를 사용할 수 있고,
OpenClaw는 여전히 우선순위, 에이전트별 allowlist, 게이팅,
`skills.entries.*` env/API 키 주입을 관리합니다. 다른 CLI 백엔드는 프롬프트
카탈로그만 사용합니다.

## 세션 스냅샷 (성능)

OpenClaw는 **세션 시작 시** 유효한 skill을 스냅샷으로 저장하고, 같은 세션의 이후 턴에서는 그 목록을 재사용합니다. skill 또는 config 변경은 다음 새 세션에서 적용됩니다.

skills watcher가 활성화되어 있거나 새로운 유효 원격 노드가 나타나면, 세션 중간에도 skill이 새로 고쳐질 수 있습니다(아래 참고). 이를 **핫 리로드**처럼 생각하면 됩니다. 새로 고쳐진 목록은 다음 에이전트 턴에서 반영됩니다.

해당 세션에 대한 유효 에이전트 skill allowlist가 변경되면, OpenClaw는
현재 에이전트와 보이는 skill이 계속 일치하도록 스냅샷을 새로 고칩니다.

## 원격 macOS 노드 (Linux gateway)

Gateway가 Linux에서 실행 중이지만 **macOS 노드**가 연결되어 있고 **`system.run`이 허용된 경우**
(Exec approvals 보안이 `deny`로 설정되지 않음), OpenClaw는 해당 노드에 필요한 바이너리가 존재할 때
macOS 전용 skill도 유효한 것으로 취급할 수 있습니다. 에이전트는 해당 skill을 `exec` 도구와 `host=node`를 사용해 실행해야 합니다.

이는 노드가 명령 지원을 보고하고 `system.run`을 통한 바이너리 프로브를 수행하는 데 의존합니다. 나중에 macOS 노드가 오프라인이 되더라도 skill은 계속 보입니다. 노드가 다시 연결될 때까지 호출은 실패할 수 있습니다.

## Skills watcher (자동 새로 고침)

기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 skill 스냅샷을 갱신합니다. 이는 `skills.load` 아래에서 구성합니다:

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

## 토큰 영향 (skills 목록)

skill이 유효하면 OpenClaw는 사용 가능한 skill의 간결한 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다:

- **기본 오버헤드(1개 이상의 skill이 있을 때만):** 195자
- **skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값 길이

공식(문자 수):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고:

- XML 이스케이프는 `& < > " '`를 엔터티(`&amp;`, `&lt;` 등)로 확장하므로 길이가 늘어납니다.
- 토큰 수는 모델 토크나이저에 따라 달라집니다. 대략적인 OpenAI 스타일 추정으로는 약 4자/토큰이므로, **97자 ≈ skill당 24토큰** 정도이며 여기에 실제 필드 길이가 추가됩니다.

## 관리형 skill 수명 주기

OpenClaw는 설치물(npm 패키지 또는 OpenClaw.app)의 일부로
기본 skill 집합을 **번들 skill**로 제공합니다. `~/.openclaw/skills`는 로컬
override용으로 존재합니다(예: 번들 복사본을 바꾸지 않고 skill을 고정/패치).
워크스페이스 skill은 사용자 소유이며, 이름 충돌 시 둘 다 override합니다.

## 구성 참조

전체 구성 스키마는 [Skills config](/ko/tools/skills-config)를 참고하세요.

## 더 많은 skill을 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)에서 둘러보세요.

---

## 관련 항목

- [Creating Skills](/ko/tools/creating-skills) — 사용자 정의 skill 만들기
- [Skills Config](/ko/tools/skills-config) — skill 구성 참조
- [Slash Commands](/ko/tools/slash-commands) — 사용 가능한 모든 슬래시 명령
- [Plugins](/ko/tools/plugin) — plugin 시스템 개요
