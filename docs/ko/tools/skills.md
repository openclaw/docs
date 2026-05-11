---
read_when:
    - Skills 추가 또는 수정
    - Skills 게이팅, 허용 목록 또는 로드 규칙 변경
    - Skills 우선순위와 스냅샷 동작 이해하기
sidebarTitle: Skills
summary: 'Skills: 관리형과 워크스페이스, 게이팅 규칙, 에이전트 허용 목록, 구성 연결'
title: Skills
x-i18n:
    generated_at: "2026-05-11T20:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw는 에이전트에게 도구 사용법을 가르치기 위해 **[AgentSkills](https://agentskills.io)-호환** Skills 폴더를 사용합니다. 각 Skill은 YAML frontmatter와 지침이 포함된 `SKILL.md`가 들어 있는 디렉터리입니다. OpenClaw는 번들 Skills와 선택적 로컬 재정의를 로드하고, 환경, config, 바이너리 존재 여부를 기준으로 로드 시점에 필터링합니다.

## 위치와 우선순위

OpenClaw는 다음 소스에서 Skills를 로드하며, **우선순위가 높은 순서**는 다음과 같습니다.

| #   | 소스                  | 경로                             |
| --- | --------------------- | -------------------------------- |
| 1   | 워크스페이스 Skills   | `<workspace>/skills`             |
| 2   | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills`     |
| 3   | 개인 에이전트 Skills  | `~/.agents/skills`               |
| 4   | 관리/로컬 Skills      | `~/.openclaw/skills`             |
| 5   | 번들 Skills           | 설치와 함께 제공됨              |
| 6   | 추가 Skill 폴더       | `skills.load.extraDirs` (config) |

Skill 이름이 충돌하면 우선순위가 가장 높은 소스가 적용됩니다.

Codex CLI의 기본 `$CODEX_HOME/skills` 디렉터리는 이러한 OpenClaw Skill 루트 중 하나가 아닙니다. Codex harness 모드에서는 로컬 app-server 실행이 에이전트별로 격리된 Codex 홈을 사용하므로 개인 Codex CLI Skills가 암시적으로 로드되지 않습니다. 이를 목록화하려면 `openclaw migrate codex --dry-run`을 사용하고, 현재 OpenClaw 에이전트 워크스페이스로 복사하기 전에 대화형 체크박스 프롬프트로 Skill 디렉터리를 선택하려면 `openclaw migrate codex`를 사용합니다. 비대화형 실행에서는 복사할 정확한 Skills에 대해 `--skill <name>`을 반복해서 지정합니다.

## 에이전트별 Skills와 공유 Skills

**다중 에이전트** 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다.

| 범위                 | 경로                                        | 표시 대상                    |
| -------------------- | ------------------------------------------- | ---------------------------- |
| 에이전트별           | `<workspace>/skills`                        | 해당 에이전트만              |
| 프로젝트 에이전트    | `<workspace>/.agents/skills`                | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트        | `~/.agents/skills`                          | 해당 머신의 모든 에이전트    |
| 공유 관리/로컬       | `~/.openclaw/skills`                        | 해당 머신의 모든 에이전트    |
| 공유 추가 디렉터리   | `skills.load.extraDirs` (가장 낮은 우선순위) | 해당 머신의 모든 에이전트    |

여러 위치에 같은 이름이 있으면 → 우선순위가 가장 높은 소스가 적용됩니다. 워크스페이스가 프로젝트 에이전트보다 우선하고, 프로젝트 에이전트는 개인 에이전트보다, 개인 에이전트는 관리/로컬보다, 관리/로컬은 번들보다, 번들은 추가 디렉터리보다 우선합니다.

## 에이전트 Skill 허용 목록

Skill **위치**와 Skill **표시 여부**는 별개의 제어입니다. 위치/우선순위는 같은 이름의 Skill 사본 중 어느 것이 적용될지 결정하고, 에이전트 허용 목록은 에이전트가 실제로 사용할 수 있는 Skills를 결정합니다.

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
    - 기본적으로 제한 없는 Skills를 사용하려면 `agents.defaults.skills`를 생략합니다.
    - `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략합니다.
    - Skills가 없도록 하려면 `agents.list[].skills: []`를 설정합니다.
    - 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 **최종** 집합입니다. 기본값과 병합되지 않습니다.
    - 유효 허용 목록은 프롬프트 구성, Skill 슬래시 명령 검색, 샌드박스 동기화, Skill 스냅샷 전반에 적용됩니다.

  </Accordion>
</AccordionGroup>

## Plugins와 Skills

Plugin은 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 제공할 수 있습니다(경로는 Plugin 루트를 기준으로 상대 경로). Plugin Skills는 Plugin이 활성화될 때 로드됩니다. 이는 도구 설명에 넣기에는 너무 길지만 Plugin이 설치될 때마다 사용할 수 있어야 하는 도구별 운영 가이드를 두기에 적합한 위치입니다. 예를 들어 브라우저 Plugin은 다단계 브라우저 제어를 위한 `browser-automation` Skill을 제공합니다.

Plugin Skill 디렉터리는 `skills.load.extraDirs`와 같은 낮은 우선순위 경로로 병합되므로, 같은 이름의 번들, 관리, 에이전트 또는 워크스페이스 Skill이 이를 재정의합니다. Plugin의 config 항목에서 `metadata.openclaw.requires.config`를 통해 게이트할 수 있습니다.

검색/config는 [Plugins](/ko/tools/plugin)를, 해당 Skills가 가르치는 도구 표면은 [Tools](/ko/tools)를 참조하세요.

## Skill Workshop

선택적 실험 기능인 **Skill Workshop** Plugin은 에이전트 작업 중 관찰된 재사용 가능한 절차로부터 워크스페이스 Skills를 만들거나 업데이트할 수 있습니다. 기본적으로 비활성화되어 있으며 `plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 쓰고, 생성된 콘텐츠를 스캔하며, 승인 대기 또는 자동 안전 쓰기를 지원하고, 안전하지 않은 제안을 격리하며, 쓰기가 성공한 뒤 Skill 스냅샷을 새로 고쳐 Gateway 재시작 없이 새 Skills를 사용할 수 있게 합니다.

_"다음에는 GIF 저작자 표시를 확인"_ 같은 수정 사항이나 미디어 QA 체크리스트 같은 어렵게 얻은 워크플로에 사용하세요. 승인 대기로 시작하고, 자동 쓰기는 제안을 검토한 뒤 신뢰할 수 있는 워크스페이스에서만 사용하세요. 전체 가이드: [Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 및 동기화)

[ClawHub](https://clawhub.ai)는 OpenClaw의 공개 Skills 레지스트리입니다. 검색/설치/업데이트에는 기본 `openclaw skills` 명령을 사용하고, 게시/동기화 워크플로에는 별도의 `clawhub` CLI를 사용하세요. 전체 가이드: [ClawHub](/ko/clawhub).

| 작업                               | 명령                                   |
| ---------------------------------- | -------------------------------------- |
| 워크스페이스에 Skill 설치          | `openclaw skills install <skill-slug>` |
| 설치된 모든 Skills 업데이트        | `openclaw skills update --all`         |
| 동기화(스캔 + 업데이트 게시)       | `clawhub sync --all`                   |

기본 `openclaw skills install`은 활성 워크스페이스의 `skills/` 디렉터리에 설치합니다. 별도의 `clawhub` CLI도 현재 작업 디렉터리 아래의 `./skills`에 설치합니다(또는 구성된 OpenClaw 워크스페이스로 폴백합니다). OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.
구성된 Skill 루트는 `skills/<group>/<skill>/SKILL.md`처럼 한 단계의 그룹화도 지원하므로, 관련된 타사 Skills를 광범위한 재귀 스캔 없이 공유 폴더 아래에 보관할 수 있습니다.

비공개 비-ClawHub 전달이 필요한 Gateway 클라이언트는 `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`으로 zip Skill 아카이브를 준비한 다음, 커밋된 업로드를 `skills.install({ source: "upload", uploadId, slug, force?, sha256? })`로 설치할 수 있습니다. 이는 신뢰할 수 있는 클라이언트를 위한 명시적 관리자 업로드 경로이며, 일반적인 `openclaw skills install <slug>` 또는 ClawHub 설치 흐름이 아닙니다. 기본적으로 꺼져 있으며 `openclaw.json`에서 `skills.install.allowUploadedArchives: true`가 설정된 경우에만 작동합니다. 업로드 모드도 기본 에이전트 워크스페이스 `skills/<slug>` 디렉터리에 설치합니다. 아카이브의 내부 폴더 이름은 최종 설치 대상에서 무시됩니다.

ClawHub Skill 페이지는 설치 전에 최신 보안 스캔 상태를 노출하며, VirusTotal, ClawScan, 정적 분석을 위한 스캐너 세부 정보 페이지를 제공합니다. `openclaw skills install <slug>`는 여전히 설치 경로일 뿐입니다. 게시자는 ClawHub 대시보드 또는 `clawhub skill rescan <slug>`를 통해 오탐을 복구합니다.

## 보안

<Warning>
타사 Skills를 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어 보세요. 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 선호하세요. 에이전트 측 제어는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Warning>

- 워크스페이스 및 추가 디렉터리 Skill 검색은 확인된 realpath가 구성된 루트 내부에 유지되는 Skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 비공개 아카이브 설치는 기본적으로 꺼져 있습니다. 명시적으로 활성화된 경우, `SKILL.md`가 포함된 커밋된 zip 업로드가 필요하며 ClawHub Skill 설치와 동일한 아카이브 추출, 경로 순회, 심볼릭 링크, 강제 적용, 롤백 보호를 재사용합니다. `skills.install.allowUploadedArchives`로 게이트되며, 일반 ClawHub 설치에는 해당 설정이 필요하지 않습니다.
- Gateway 기반 Skill 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 관리자 메타데이터를 실행하기 전에 내장 위험 코드 스캐너를 실행합니다. `critical` 결과는 호출자가 위험 override를 명시적으로 설정하지 않는 한 기본적으로 차단됩니다. 의심스러운 결과는 계속 경고만 표시합니다.
- `openclaw skills install <slug>`는 다릅니다. 이는 ClawHub Skill 폴더를 워크스페이스로 다운로드하며 위의 설치 관리자 메타데이터 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴의 **호스트** 프로세스(샌드박스가 아님)에 secrets를 주입합니다. secrets를 프롬프트와 로그에 넣지 마세요.

더 넓은 위협 모델과 체크리스트는 [보안](/ko/gateway/security)을 참조하세요.

## SKILL.md 형식

`SKILL.md`에는 최소한 다음이 포함되어야 합니다.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw는 레이아웃/의도에 대해 AgentSkills 사양을 따릅니다. 임베디드 에이전트가 사용하는 파서는 **단일 줄** frontmatter 키만 지원합니다. `metadata`는 **단일 줄 JSON 객체**여야 합니다. 지침에서 Skill 폴더 경로를 참조하려면 `{baseDir}`를 사용하세요.

### 선택적 frontmatter 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 URL입니다. `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 Skill이 사용자 슬래시 명령으로 노출됩니다.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw는 Skill의 지침을 에이전트의 일반 프롬프트에서 제외합니다. Skill은 계속 설치된 상태이며, `user-invocable`도 `true`인 경우 슬래시 명령으로 명시적으로 실행할 수 있습니다.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하고 도구로 직접 디스패치됩니다.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정되었을 때 호출할 도구 이름입니다.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 디스패치의 경우 원시 args 문자열을 도구로 전달합니다(코어 파싱 없음). 도구는 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`로 호출됩니다.
</ParamField>

## 게이팅(로드 시점 필터)

OpenClaw는 `metadata`(단일 줄 JSON)를 사용해 로드 시점에 Skills를 필터링합니다.

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
  `true`이면 항상 skill을 포함합니다(다른 게이트 건너뜀).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI에서 사용하는 선택적 이모지입니다.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI에서 "웹사이트"로 표시되는 선택적 URL입니다.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  선택적 플랫폼 목록입니다. 설정하면 해당 skill은 지정된 OS에서만 대상이 됩니다.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  각각은 `PATH`에 존재해야 합니다.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  하나 이상이 `PATH`에 존재해야 합니다.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var가 존재하거나 config에 제공되어야 합니다.
</ParamField>
<ParamField path="requires.config" type="string[]">
  truthy여야 하는 `openclaw.json` 경로 목록입니다.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 Env var 이름입니다.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 관리자 사양입니다(brew/node/go/uv/download).
</ParamField>

`metadata.openclaw`가 없으면 skill은 항상 대상이 됩니다(설정에서 비활성화되었거나
bundled skills에 대해 `skills.allowBundled`로 차단된 경우 제외).

<Note>
`metadata.openclaw`가 없을 때는 기존 `metadata.clawdbot` 블록도 계속 허용되므로,
이전에 설치된 skill은 dependency gates와 설치 관리자 힌트를 유지합니다. 새 skill과
업데이트된 skill은 `metadata.openclaw`를 사용해야 합니다.
</Note>

### 샌드박싱 참고 사항

- `requires.bins`는 skill 로드 시 **호스트**에서 확인됩니다.
- 에이전트가 샌드박스 처리된 경우, 바이너리는 **컨테이너 내부**에도 존재해야 합니다. `agents.defaults.sandbox.docker.setupCommand`(또는 커스텀 이미지)를 통해 설치하세요. `setupCommand`는 컨테이너가 생성된 뒤 한 번 실행됩니다. 패키지 설치에는 네트워크 송신, 쓰기 가능한 루트 FS, 샌드박스의 root 사용자도 필요합니다.
- 예: `summarize` skill(`skills/summarize/SKILL.md`)은 샌드박스 컨테이너에서 실행되려면 그 안에 `summarize` CLI가 필요합니다.

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
    - 여러 설치 관리자가 나열된 경우, Gateway는 선호 옵션 하나를 선택합니다(사용 가능하면 brew, 아니면 node).
    - 모든 설치 관리자가 `download`인 경우, OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 나열합니다.
    - 설치 관리자 사양에는 플랫폼별로 옵션을 필터링하기 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm; 옵션: npm/pnpm/yarn/bun). 이는 skill 설치에만 영향을 줍니다. Gateway 런타임은 계속 Node여야 하며, Bun은 WhatsApp/Telegram에 권장되지 않습니다.
    - Gateway 기반 설치 관리자 선택은 선호도 기반입니다. 설치 사양에 여러 종류가 섞여 있으면, OpenClaw는 `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 선호한 다음, `uv`, 구성된 node 관리자, `go`나 `download` 같은 다른 대체 옵션 순으로 선택합니다.
    - 모든 설치 사양이 `download`이면, OpenClaw는 하나의 선호 설치 관리자로 축약하지 않고 모든 다운로드 옵션을 표시합니다.

  </Accordion>
  <Accordion title="설치 관리자별 세부 정보">
    - **Go 설치:** `go`가 없고 `brew`를 사용할 수 있으면, Gateway는 먼저 Homebrew를 통해 Go를 설치하고 가능한 경우 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
    - **다운로드 설치:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: archive 감지 시 auto), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Config 재정의

Bundled 및 managed skills는 `~/.openclaw/openclaw.json`의 `skills.entries` 아래에서
토글하고 env 값을 제공할 수 있습니다.

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
  `false`는 bundled 또는 설치된 skill이어도 해당 skill을 비활성화합니다.
  bundled `coding-agent` skill은 opt-in입니다. 에이전트에 노출하기 전에
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
  skill별 커스텀 필드를 위한 선택적 모음입니다. 커스텀 키는 여기에 있어야 합니다.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **bundled** skills 전용 선택적 허용 목록입니다. 설정하면 목록에 있는 bundled skills만 대상이 됩니다(managed/workspace skills에는 영향 없음).
</ParamField>

skill 이름에 하이픈이 포함된 경우 키를 따옴표로 묶으세요(JSON5는 따옴표로 묶은
키를 허용합니다). Config 키는 기본적으로 **skill 이름**과 일치합니다. skill이
`metadata.openclaw.skillKey`를 정의하는 경우, `skills.entries` 아래에서 그 키를 사용하세요.

<Note>
OpenClaw 내부의 기본 이미지 생성/편집에는 bundled skill 대신
`agents.defaults.imageGenerationModel`과 함께 코어 `image_generate` 도구를 사용하세요.
여기의 skill 예시는 커스텀 또는 서드파티 workflow용입니다. 네이티브 이미지 분석에는
`agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요. `openai/*`, `google/*`,
`fal/*` 또는 다른 provider-specific 이미지 모델을 선택한 경우, 해당 provider의
auth/API 키도 추가하세요.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

1. skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 및 `skills.entries.<key>.apiKey`를 `process.env`에 적용합니다.
3. **대상** skill로 시스템 프롬프트를 빌드합니다.
4. 실행이 끝난 뒤 원래 환경을 복원합니다.

환경 주입은 전역 셸 환경이 아니라 **에이전트 실행 범위**에만 적용됩니다.

bundled `claude-cli` 백엔드의 경우, OpenClaw는 동일한 대상 스냅샷을 임시 Claude Code Plugin으로
구체화하고 `--plugin-dir`와 함께 전달합니다. 그러면 Claude Code는 자체 네이티브 skill resolver를
사용할 수 있고, OpenClaw는 여전히 precedence, 에이전트별 allowlists, gating,
`skills.entries.*` env/API 키 주입을 소유합니다. 다른 CLI 백엔드는
프롬프트 카탈로그만 사용합니다.

## 스냅샷과 새로 고침

OpenClaw는 **세션이 시작될 때** 대상 skill의 스냅샷을 만들고,
같은 세션의 이후 턴에서는 그 목록을 재사용합니다. skill 또는 config 변경 사항은
다음 새 세션부터 적용됩니다.

skill은 두 가지 경우에 세션 중간에 새로 고쳐질 수 있습니다.

- skills watcher가 활성화되어 있습니다.
- 새 대상 remote node가 나타납니다.

이를 **핫 리로드**로 생각하면 됩니다. 새로 고쳐진 목록은 다음 에이전트 턴에
반영됩니다. 해당 세션의 유효 에이전트 skill allowlist가 변경되면,
OpenClaw는 보이는 skill이 현재 에이전트와 정렬되도록 스냅샷을 새로 고칩니다.

### Skills watcher

기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 skills 스냅샷을
증가시킵니다. `skills.load` 아래에서 구성하세요.

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

내장 skill 루트에 symlink가 포함되는 의도적인 sibling-repo 레이아웃에는
`allowSymlinkTargets`를 사용하세요. 예:
`~/.agents/skills/manager -> ~/Projects/manager/skills`. 대상 목록은
realpath 해석 후 매칭되며 좁게 유지해야 합니다.

### 원격 macOS 노드(Linux gateway)

Gateway가 Linux에서 실행되지만 **macOS 노드**가 연결되어 있고
`system.run`이 허용된 경우(Exec 승인 보안이 `deny`로 설정되지 않음),
필요한 바이너리가 해당 노드에 있으면 OpenClaw는 macOS 전용 skill을 대상으로 간주할 수 있습니다.
에이전트는 `host=node`와 함께 `exec` 도구를 통해 해당 skill을 실행해야 합니다.

이는 노드가 command support를 보고하고 `system.which` 또는 `system.run`을 통한 bin probe에
의존합니다. 오프라인 노드는 remote-only skill을 보이게 하지 **않습니다**.
연결된 노드가 bin probe에 응답하지 않으면, OpenClaw는 캐시된 bin match를 지워
현재 그곳에서 실행할 수 없는 skill이 에이전트에 더 이상 보이지 않도록 합니다.

## 토큰 영향

skill이 대상이 되면, OpenClaw는 사용 가능한 skill의 간결한 XML 목록을 시스템 프롬프트에
주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다.

- **기본 오버헤드**(skill이 1개 이상일 때만): 195자.
- **skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이.

공식(문자 수):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 이스케이프는 `& < > " '`를 엔티티(`&amp;`, `&lt;` 등)로 확장하여
길이를 늘립니다. 토큰 수는 모델 tokenizer에 따라 달라집니다. 대략적인
OpenAI 스타일 추정치는 약 4 chars/token이므로, **97 chars ≈ 24 tokens** per
skill에 실제 필드 길이를 더한 값입니다.

## Managed skills lifecycle

OpenClaw는 설치(npm package 또는 OpenClaw.app)와 함께 baseline skill 집합을 **bundled skills**로
제공합니다. `~/.openclaw/skills`는 로컬 재정의를 위해 존재합니다. 예를 들어 bundled copy를
변경하지 않고 skill을 고정하거나 패치할 수 있습니다. Workspace skills는 사용자 소유이며
이름 충돌 시 둘 모두를 재정의합니다.

## 더 많은 skill을 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)를 둘러보세요. 전체 구성
스키마: [Skills config](/ko/tools/skills-config).

## 관련

- [ClawHub](/ko/clawhub) - 공개 skills 레지스트리
- [Creating skills](/ko/tools/creating-skills) - 커스텀 skill 만들기
- [Plugins](/ko/tools/plugin) - plugin 시스템 개요
- [Skill Workshop plugin](/ko/plugins/skill-workshop) - 에이전트 작업에서 skill 생성
- [Skills config](/ko/tools/skills-config) - skill 구성 참조
- [Slash commands](/ko/tools/slash-commands) - 사용 가능한 모든 slash command
