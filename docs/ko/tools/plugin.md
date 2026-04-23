---
read_when:
    - Plugin 설치 또는 구성하기
    - Plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 Plugin 번들 작업하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리하기
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:09:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugin은 OpenClaw에 새로운 기능을 추가합니다: 채널, model provider,
tool, Skills, speech, realtime transcription, realtime voice,
media-understanding, image generation, video generation, web fetch, web
search 등. 일부 Plugin은 **core**(OpenClaw에 포함됨)이고, 다른 일부는
**external**(커뮤니티가 npm에 게시함)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 확인">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin 설치">
    ```bash
    # npm에서
    openclaw plugins install @openclaw/voice-call

    # 로컬 디렉터리 또는 아카이브에서
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 config 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 기반 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 해석기를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 패키지 spec(ClawHub 우선, 그다음 npm fallback).

config가 유효하지 않으면 설치는 보통 fail closed되며
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`에 opt-in한 Plugin을 위한
제한적인 번들 Plugin 재설치 경로입니다.

패키지된 OpenClaw 설치는 모든 번들 Plugin의
런타임 종속성 트리를 미리 설치하지 않습니다.
Plugin config, 레거시 채널 config, 또는 기본 활성 manifest를 통해 번들된 OpenClaw 소유 Plugin이 활성 상태이면,
시작 시 import 전에 해당 Plugin의 선언된 런타임 종속성만 복구합니다.
external Plugin 및 사용자 지정 로드 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다:

| 형식       | 동작 방식                                                       | 예시                                                   |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈, 프로세스 내에서 실행      | 공식 Plugin, 커뮤니티 npm 패키지                      |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃, OpenClaw 기능에 매핑됨      | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list`에 표시됩니다. 번들 자세한 내용은 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

기본 Plugin을 작성하고 있다면 [Building Plugins](/ko/plugins/building-plugins)
및 [Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 Plugin

### 설치 가능(npm)

| Plugin          | 패키지                | 문서                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ko/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/ko/plugins/zalouser)   |

### Core(OpenClaw에 포함됨)

<AccordionGroup>
  <Accordion title="Model provider(기본 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — 번들 memory search (`plugins.slots.memory`의 기본값)
    - `memory-lancedb` — 자동 recall/capture가 있는 주문형 설치 장기 memory (`plugins.slots.memory = "memory-lancedb"`로 설정)
  </Accordion>

  <Accordion title="Speech provider(기본 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — browser tool, `openclaw browser` CLI, `browser.request` Gateway 메서드, browser 런타임, 기본 browser control service용 번들 browser Plugin(기본 활성화됨, 교체 전 비활성화 필요)
    - `copilot-proxy` — VS Code Copilot Proxy bridge(기본 비활성화)
  </Accordion>
</AccordionGroup>

서드파티 Plugin을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

## 구성

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 필드             | 설명                                                     |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                              |
| `allow`          | Plugin allowlist(선택 사항)                              |
| `deny`           | Plugin denylist(선택 사항, deny가 우선)                  |
| `load.paths`     | 추가 Plugin 파일/디렉터리                                |
| `slots`          | 배타적 슬롯 선택기(예: `memory`, `contextEngine`)        |
| `entries.\<id\>` | Plugin별 토글 + config                                   |

config 변경은 **Gateway 재시작이 필요**합니다. Gateway가 config
watch + 프로세스 내 재시작 활성화 상태(기본 `openclaw gateway` 경로)로 실행 중이면,
보통 config 쓰기가 반영된 직후 잠시 후 자동으로 재시작됩니다.

<Accordion title="Plugin 상태: disabled vs missing vs invalid">
  - **Disabled**: Plugin은 존재하지만 활성화 규칙에 의해 꺼져 있습니다. config는 보존됩니다.
  - **Missing**: config가 검색에서 찾지 못한 Plugin ID를 참조합니다.
  - **Invalid**: Plugin은 존재하지만 config가 선언된 schema와 일치하지 않습니다.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 검색합니다(첫 번째 일치 항목이 승리):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적인 파일 또는 디렉터리 경로입니다.
  </Step>

  <Step title="Workspace Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 Plugin">
    OpenClaw와 함께 제공됩니다. 많은 Plugin이 기본 활성화됩니다(model provider, speech).
    다른 Plugin은 명시적으로 활성화해야 합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화합니다
- `plugins.deny`는 항상 allow보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다
- workspace 원본 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함)
- 번들 Plugin은 재정의되지 않는 한 내장 기본 활성 집합을 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 Plugin을 강제로 활성화할 수 있습니다

## Plugin 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성 가능):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 비활성화를 위해 "none"
      contextEngine: "legacy", // 또는 Plugin ID
    },
  },
}
```

| 슬롯             | 제어 대상             | 기본값              |
| ---------------- | --------------------- | ------------------- |
| `memory`         | Active Memory Plugin  | `memory-core`       |
| `contextEngine`  | 활성 context engine   | `legacy`(내장)      |

## CLI 참조

```bash
openclaw plugins list                       # 간단한 인벤토리
openclaw plugins list --enabled            # 로드된 Plugin만
openclaw plugins list --verbose            # Plugin별 상세 행
openclaw plugins list --json               # 기계 판독 가능 인벤토리
openclaw plugins inspect <id>              # 상세 정보
openclaw plugins inspect <id> --json       # 기계 판독 가능
openclaw plugins inspect --all             # 전체 표
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # 진단

openclaw plugins install <package>         # 설치(ClawHub 우선, 그다음 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치를 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 link(복사 없음)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확히 해석된 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # Plugin 하나 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 모두 업데이트
openclaw plugins uninstall <id>          # config/설치 기록 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 Plugin은 OpenClaw와 함께 제공됩니다. 많은 Plugin이 기본 활성화됩니다(예:
번들 model provider, 번들 speech provider, 번들 browser
Plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 Plugin 또는 hook pack을 제자리에서 덮어씁니다. 추적되는 npm
Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
`--link`와 함께는 지원되지 않습니다. `--link`는 관리되는 설치 대상을 복사하는 대신
소스 경로를 재사용하기 때문입니다.

`plugins.allow`가 이미 설정된 경우 `openclaw plugins install`은
설치된 Plugin ID를 해당 allowlist에 추가한 뒤 활성화하므로, 재시작 후 즉시 로드할 수 있습니다.

`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을
추적된 Plugin 레코드로 다시 해석하고 향후 업데이트를 위해 새 spec을 기록합니다.
버전 없는 패키지 이름을 전달하면 정확히 고정된 설치를
레지스트리의 기본 릴리스 라인으로 되돌립니다. 설치된 npm Plugin이 이미 해석된 버전과
기록된 아티팩트 ID와 일치하면, OpenClaw는 다운로드, 재설치, config 재작성 없이
업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. marketplace 설치는 npm spec 대신
marketplace 소스 메타데이터를 저장하므로 `--marketplace`와 함께 지원되지 않습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐에 대한
break-glass 재정의입니다. 내장 `critical` 결과를 지나서도 Plugin 설치
및 Plugin 업데이트를 계속 진행할 수 있게 하지만,
Plugin `before_install` 정책 차단이나 스캔 실패 차단까지 우회하지는 않습니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 Skills
종속성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며,
`openclaw skills install`은 별도의 ClawHub Skills 다운로드/설치 흐름으로 유지됩니다.

호환 번들은 동일한 Plugin list/inspect/enable/disable 흐름에 참여합니다.
현재 런타임 지원에는 번들 Skills, Claude command-Skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 manifest 선언
`lspServers` 기본값, Cursor command-Skills, 호환 Codex hook
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 capability와
지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

Marketplace 소스는 `~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름,
로컬 marketplace 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 저장소
URL, 또는 git URL이 될 수 있습니다. 원격 marketplace의 경우 Plugin 항목은 반드시
클론된 marketplace 저장소 내부에 있어야 하며 상대 경로 소스만 사용해야 합니다.

전체 내용은 [`openclaw plugins` CLI reference](/ko/cli/plugins)를 참조하세요.

## Plugin API 개요

기본 Plugin은 `register(api)`를 노출하는 entry 객체를 export합니다. 오래된
Plugin은 여전히 레거시 alias로 `activate(api)`를 사용할 수 있지만, 새 Plugin은
`register`를 사용해야 합니다.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw는 entry 객체를 로드하고 Plugin
활성화 중에 `register(api)`를 호출합니다. 로더는 오래된 Plugin에 대해 여전히 `activate(api)`로 fallback하지만,
번들 Plugin과 새 external Plugin은 `register`를 공개 계약으로 취급해야 합니다.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상                    |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | model provider (LLM)         |
| `registerChannel`                       | 채팅 채널                    |
| `registerTool`                          | agent tool                   |
| `registerHook` / `on(...)`              | 수명 주기 hook               |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT       |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                 |
| `registerRealtimeVoiceProvider`         | 양방향 realtime voice        |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석           |
| `registerImageGenerationProvider`       | 이미지 생성                  |
| `registerMusicGenerationProvider`       | 음악 생성                    |
| `registerVideoGenerationProvider`       | 비디오 생성                  |
| `registerWebFetchProvider`              | web fetch / scrape provider  |
| `registerWebSearchProvider`             | web search                   |
| `registerHttpRoute`                     | HTTP 엔드포인트              |
| `registerCommand` / `registerCli`       | CLI 명령                     |
| `registerContextEngine`                 | context engine               |
| `registerService`                       | 백그라운드 서비스            |

타입 지정된 lifecycle hook의 hook guard 동작:

- `before_tool_call`: `{ block: true }`는 종료형입니다. 더 낮은 우선순위 handler는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료형입니다. 더 낮은 우선순위 handler는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료형입니다. 더 낮은 우선순위 handler는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 이전 cancel을 해제하지 않습니다.

전체 타입 지정 hook 동작은 [SDK Overview](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련

- [Building Plugins](/ko/plugins/building-plugins) — 자체 Plugin 만들기
- [Plugin Bundles](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin Manifest](/ko/plugins/manifest) — manifest schema
- [Registering Tools](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 agent tool 추가하기
- [Plugin Internals](/ko/plugins/architecture) — capability 모델 및 로드 파이프라인
- [Community Plugins](/ko/plugins/community) — 서드파티 목록
