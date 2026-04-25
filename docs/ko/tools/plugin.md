---
read_when:
    - plugin 설치 또는 구성하기
    - plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 plugin 번들로 작업하기
sidebarTitle: Install and Configure
summary: OpenClaw plugin 설치, 구성 및 관리하기
title: Plugins
x-i18n:
    generated_at: "2026-04-25T06:12:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugins는 OpenClaw를 새 capability로 확장합니다: channels, 모델 providers,
에이전트 하니스, 도구, Skills, speech, 실시간 전사, 실시간
음성, media-understanding, 이미지 생성, 비디오 생성, web fetch, web
search 등. 일부 plugins는 **core**(OpenClaw와 함께 제공)이고, 다른 일부는
**external**(커뮤니티가 npm에 게시)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 보기">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="plugin 설치">
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

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 resolver를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 패키지 spec(먼저 ClawHub, 그다음 npm 폴백).

config가 유효하지 않으면 설치는 일반적으로 닫힌 방식으로 실패하고
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`를 선택한 plugins를 위한 제한적인 번들 plugin
재설치 경로입니다.

패키지된 OpenClaw 설치는 모든 번들 plugin의
런타임 의존성 트리를 미리 설치하지 않습니다. 번들된 OpenClaw 소유 plugin이
plugin config, 레거시 channel config, 또는 기본 활성화 manifest로 인해 활성 상태이면,
시작 시 해당 plugin을 import하기 전에 그 plugin이 선언한 런타임 의존성만 복구 설치합니다.
명시적 비활성화는 여전히 우선합니다: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, `channels.<id>.enabled: false`는
해당 plugin/channel에 대한 자동 번들 런타임 의존성 복구를 막습니다.
external plugins와 사용자 지정 load 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## plugin 유형

OpenClaw는 두 가지 plugin 형식을 인식합니다:

| 형식       | 동작 방식                                                        | 예시                                                   |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈; 프로세스 내에서 실행       | 공식 plugins, 커뮤니티 npm 패키지                      |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃; OpenClaw 기능에 매핑          | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list`에 표시됩니다. 번들 세부 사항은 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

네이티브 plugin을 작성 중이라면 [Building Plugins](/ko/plugins/building-plugins)
및 [Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 plugins

### 설치 가능 (npm)

| Plugin          | 패키지                | 문서                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ko/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ko/plugins/zalouser)   |

### core (OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 provider (기본 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 plugins">
    - `memory-core` — 번들 메모리 검색 (`plugins.slots.memory`를 통한 기본값)
    - `memory-lancedb` — 자동 회상/캡처 기능이 있는 주문형 설치 장기 메모리 (`plugins.slots.memory = "memory-lancedb"` 설정)
  </Accordion>

  <Accordion title="speech provider (기본 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — browser 도구, `openclaw browser` CLI, `browser.request` Gateway 메서드, browser 런타임, 기본 browser 제어 서비스용 번들 browser plugin (기본 활성화, 교체 전에 비활성화)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지 (기본 비활성화)
  </Accordion>
</AccordionGroup>

서드파티 plugins를 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

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

| 필드             | 설명                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글 (기본값: `true`)                              |
| `allow`          | plugin 허용 목록 (선택 사항)                              |
| `deny`           | plugin 거부 목록 (선택 사항, deny가 우선)                 |
| `load.paths`     | 추가 plugin 파일/디렉터리                                 |
| `slots`          | 배타적 슬롯 선택기 (예: `memory`, `contextEngine`)        |
| `entries.\<id\>` | plugin별 토글 + config                                    |

config 변경에는 **Gateway 재시작이 필요합니다**. Gateway가 config
watch + 프로세스 내 재시작이 활성화된 상태(기본 `openclaw gateway` 경로)로 실행 중이면,
그 재시작은 대개 config 쓰기가 반영된 직후 자동으로 수행됩니다.
네이티브 plugin 런타임 코드나 수명 주기
훅에 대해서는 지원되는 hot-reload 경로가 없습니다. 업데이트된 `register(api)` 코드,
`api.on(...)` 훅, 도구, 서비스, provider/런타임 훅이 실행되기를 기대하기 전에
실제 live channel을 제공하는 Gateway 프로세스를 재시작하세요.

`openclaw plugins list`는 로컬 CLI/config 스냅샷입니다. 거기서 `loaded` plugin은
해당 CLI 호출이 보는 config/파일에서 plugin을 검색하고 로드할 수 있음을 의미합니다.
이미 실행 중인 원격 Gateway child가
같은 plugin 코드로 재시작되었음을 증명하지는 않습니다. wrapper
프로세스가 있는 VPS/container 환경에서는 실제 `openclaw gateway run` 프로세스에 재시작을 보내거나,
실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="plugin 상태: disabled vs missing vs invalid">
  - **Disabled**: plugin은 존재하지만 활성화 규칙에 의해 꺼져 있습니다. config는 유지됩니다.
  - **Missing**: config가 plugin id를 참조하지만 검색에서 찾지 못했습니다.
  - **Invalid**: plugin은 존재하지만 그 config가 선언된 스키마와 일치하지 않습니다.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 plugins를 스캔합니다(첫 번째 일치가 우선):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로.
  </Step>

  <Step title="작업 공간 plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 plugins">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 plugins">
    OpenClaw와 함께 제공됩니다. 많은 항목이 기본 활성화되어 있습니다(모델 providers, speech).
    나머지는 명시적 활성화가 필요합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 plugins를 비활성화합니다
- `plugins.deny`는 항상 allow보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 plugin을 비활성화합니다
- 작업 공간 origin plugins는 **기본 비활성화**입니다 (명시적으로 활성화해야 함)
- 번들 plugins는 재정의되지 않는 한 내장 기본 활성 세트를 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 plugin을 강제로 활성화할 수 있습니다
- 일부 번들 opt-in plugins는 config가
  provider 모델 ref, channel config, 또는 harness
  runtime 같은 plugin 소유 표면을 이름으로 지정할 때 자동 활성화됩니다
- OpenAI 계열 Codex 경로는 별도의 plugin 경계를 유지합니다:
  `openai-codex/*`는 OpenAI plugin에 속하고, 번들 Codex
  app-server plugin은 `embeddedHarness.runtime: "codex"` 또는 레거시
  `codex/*` 모델 ref로 선택됩니다

## 런타임 훅 문제 해결

plugin이 `plugins list`에는 표시되지만 `register(api)` 부작용 또는 훅이
실제 채팅 트래픽에서 실행되지 않는다면, 먼저 다음을 확인하세요:

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성
  Gateway URL, 프로필, config 경로, 프로세스가 실제로 편집 중인 대상인지 확인하세요.
- plugin 설치/config/코드 변경 후 실제 Gateway를 재시작하세요. wrapper
  container에서는 PID 1이 단순 supervisor일 수 있으므로, child
  `openclaw gateway run` 프로세스를 재시작하거나 signal을 보내야 합니다.
- 훅 등록과
  진단을 확인하려면 `openclaw plugins inspect <id> --json`을 사용하세요. 비번들 conversation 훅인 `llm_input`,
  `llm_output`, `agent_end`는
  `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 우선 사용하세요. 이것은 에이전트 턴의 모델
  확인 전에 실행됩니다. `llm_output`은 모델 시도가 어시스턴트 출력을 생성한 후에만 실행됩니다.
- 유효 세션 모델의 증거를 보려면 `openclaw sessions` 또는
  Gateway 세션/status 표면을 사용하고, provider 페이로드를 디버깅할 때는
  `--raw-stream --raw-stream-path <path>`로 Gateway를 시작하세요.

## plugin 슬롯 (배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 비활성화를 위해 "none"
      contextEngine: "legacy", // 또는 plugin id
    },
  },
}
```

| 슬롯             | 제어 대상              | 기본값             |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 메모리 plugin    | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진    | `legacy` (내장)     |

## CLI 참조

```bash
openclaw plugins list                       # 간단 인벤토리
openclaw plugins list --enabled            # 로드된 plugins만
openclaw plugins list --verbose            # plugin별 상세 줄
openclaw plugins list --json               # 머신 판독 가능한 인벤토리
openclaw plugins inspect <id>              # 심층 상세 정보
openclaw plugins inspect <id> --json       # 머신 판독 가능
openclaw plugins inspect --all             # 전체 테이블
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # 진단

openclaw plugins install <package>         # 설치 (먼저 ClawHub, 그다음 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 안 함)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확히 확인된 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # plugin 하나 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 전체 업데이트
openclaw plugins uninstall <id>          # config/설치 레코드 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 plugins는 OpenClaw와 함께 제공됩니다. 많은 항목이 기본 활성화되어 있습니다(예:
번들 모델 providers, 번들 speech providers, 번들 browser
plugin). 다른 번들 plugins는 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존 설치된 plugin 또는 훅 팩을 제자리에서 덮어씁니다. 추적되는 npm
plugins의 일반 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
이 옵션은 `--link`와 함께 지원되지 않으며, `--link`는 관리 대상 설치 위치에
복사하는 대신 source 경로를 재사용합니다.

`plugins.allow`가 이미 설정되어 있으면 `openclaw plugins install`은
설치된 plugin id를 해당 허용 목록에 추가한 뒤 활성화하므로, 재시작 후 즉시 로드할 수 있습니다.

`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을
추적된 plugin 레코드로 다시 확인하고 이후 업데이트를 위한 새 spec을 기록합니다.
버전 없는 패키지 이름을 전달하면 정확히 고정된 설치를
registry의 기본 릴리스 라인으로 되돌립니다. 설치된 npm plugin이 이미
확인된 버전과 기록된 아티팩트 ID와 일치하면 OpenClaw는 다운로드, 재설치,
config 재기록 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. `--marketplace`와는 지원되지 않는데,
marketplace 설치는 npm spec 대신 marketplace source 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 dangerous-code 스캐너의
오탐을 위한 break-glass 재정의입니다. 내장 `critical` 발견 사항이 있어도
plugin 설치와 plugin 업데이트를 계속 진행하게 하지만,
plugin `before_install` 정책 차단이나 스캔 실패 차단까지 우회하지는 않습니다.

이 CLI 플래그는 plugin install/update 흐름에만 적용됩니다. Gateway 기반 skill
의존성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청
재정의를 사용하며, `openclaw skills install`은 별도의 ClawHub
skill 다운로드/설치 흐름으로 유지됩니다.

호환 번들도 동일한 plugin list/inspect/enable/disable
흐름에 참여합니다. 현재 런타임 지원에는 bundle Skills, Claude command-skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 manifest 선언
`lspServers` 기본값, Cursor command-skills, 호환 Codex hook
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 감지된 번들 capability와
bundle 기반 plugins의 지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

Marketplace source는
`~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 marketplace 이름,
로컬 marketplace 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub repo
URL 또는 git URL이 될 수 있습니다. 원격 marketplaces의 경우, plugin 항목은
복제된 marketplace repo 안에 머물러야 하며 상대 경로 source만 사용해야 합니다.

전체 세부 사항은 [`openclaw plugins` CLI reference](/ko/cli/plugins)를 참조하세요.

## plugin API 개요

네이티브 plugins는 `register(api)`를 노출하는 엔트리 객체를 export합니다. 이전
plugins는 레거시 별칭으로 여전히 `activate(api)`를 사용할 수 있지만, 새 plugins는
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

OpenClaw는 엔트리 객체를 로드하고 plugin
활성화 중에 `register(api)`를 호출합니다. 로더는 이전 plugins를 위해 여전히 `activate(api)`로 폴백하지만,
번들 plugins와 새 external plugins는 `register`를 공개 계약으로 취급해야 합니다.

`api.registrationMode`는 엔트리가 왜 로드되는지 plugin에 알려줍니다:

| 모드             | 의미                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`           | 런타임 활성화. 도구, 훅, 서비스, 명령, 라우트 및 기타 실제 부작용을 등록합니다.                                                  |
| `discovery`      | 읽기 전용 capability 검색. providers와 메타데이터를 등록합니다. 신뢰된 plugin 엔트리 코드는 로드될 수 있지만 실제 부작용은 건너뜁니다. |
| `setup-only`     | 경량 setup 엔트리를 통한 channel setup 메타데이터 로딩.                                                                          |
| `setup-runtime`  | 런타임 엔트리도 필요한 channel setup 로딩.                                                                                        |
| `cli-metadata`   | CLI 명령 메타데이터 수집 전용.                                                                                                   |

소켓, 데이터베이스, 백그라운드 worker, 장기 실행
클라이언트를 여는 plugin 엔트리는 해당 부작용을 `api.registrationMode === "full"`로
보호해야 합니다. 검색 로드는 활성화 로드와 별도로 캐시되며 실행 중인 Gateway registry를 대체하지 않습니다. 검색은 비활성화 방식일 뿐 import-free는 아닙니다:
OpenClaw는 스냅샷을 만들기 위해 신뢰된 plugin 엔트리 또는 channel plugin 모듈을 평가할 수 있습니다.
모듈 최상위는 가볍고 부작용이 없게 유지하고, 네트워크 클라이언트, 서브프로세스, 리스너, 자격 증명 읽기, 서비스 시작은
full-runtime 경로 뒤로 옮기세요.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상                    |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 provider (LLM)         |
| `registerChannel`                       | 채팅 channel                |
| `registerTool`                          | 에이전트 도구               |
| `registerHook` / `on(...)`              | 수명 주기 훅                |
| `registerSpeechProvider`                | text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성          |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석          |
| `registerImageGenerationProvider`       | 이미지 생성                 |
| `registerMusicGenerationProvider`       | 음악 생성                   |
| `registerVideoGenerationProvider`       | 비디오 생성                 |
| `registerWebFetchProvider`              | web fetch / scrape provider |
| `registerWebSearchProvider`             | web search                  |
| `registerHttpRoute`                     | HTTP 엔드포인트             |
| `registerCommand` / `registerCli`       | CLI 명령                    |
| `registerContextEngine`                 | 컨텍스트 엔진               |
| `registerService`                       | 백그라운드 서비스           |

타입이 지정된 수명 주기 훅의 가드 동작:

- `before_tool_call`: `{ block: true }`는 최종적이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 최종적이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 최종적이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 이전 cancel을 해제하지 않습니다.

네이티브 Codex app-server 실행은 Codex 네이티브 도구 이벤트를 이
훅 표면으로 다시 브리지합니다. plugins는 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고,
`after_tool_call`을 통해 결과를 관찰하며, Codex
`PermissionRequest` 승인에 참여할 수 있습니다. 브리지는 아직 Codex 네이티브 도구
인수를 재작성하지 않습니다. 정확한 Codex 런타임 지원 경계는
[Codex harness v1 support contract](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 타입 지정 훅 동작은 [SDK overview](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련

- [plugin 빌드하기](/ko/plugins/building-plugins) — 직접 plugin 만들기
- [Plugin 번들](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin manifest](/ko/plugins/manifest) — manifest 스키마
- [도구 등록하기](/ko/plugins/building-plugins#registering-agent-tools) — plugin에 에이전트 도구 추가
- [Plugin 내부 구조](/ko/plugins/architecture) — capability 모델과 로드 파이프라인
- [커뮤니티 plugins](/ko/plugins/community) — 서드파티 목록
