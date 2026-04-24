---
read_when:
    - 플러그인 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해
    - Codex/Claude 호환 Plugin 번들 작업하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리
title: 플러그인
x-i18n:
    generated_at: "2026-04-24T15:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

플러그인은 채널, 모델 제공자, 에이전트 하네스, 도구, Skills, 음성, 실시간 전사, 실시간
음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹
검색 등 다양한 새 기능으로 OpenClaw를 확장합니다. 일부 플러그인은 **코어**
(OpenClaw와 함께 제공)이고, 다른 플러그인은 **외부**
(커뮤니티가 npm에 게시)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 보기">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="플러그인 설치">
    ```bash
    # npm에서
    openclaw plugins install @openclaw/voice-call

    # 로컬 디렉터리 또는 아카이브에서
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 다시 시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 구성 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 기반 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 확인자를 사용합니다. 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 패키지 지정(먼저 ClawHub, 그다음 npm 대체)입니다.

구성이 올바르지 않으면 설치는 일반적으로 안전하게 실패하며
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`를 선택한 플러그인에 대한
제한적인 번들 플러그인 재설치 경로입니다.

패키징된 OpenClaw 설치는 모든 번들 플러그인의
런타임 의존성 트리를 즉시 설치하지 않습니다. 번들된 OpenClaw 소유 플러그인이
플러그인 구성, 레거시 채널 구성 또는 기본 활성화된 매니페스트에서 활성 상태이면
시작 시 해당 플러그인을 가져오기 전에 그 플러그인이 선언한 런타임 의존성만
복구합니다. 외부 플러그인과 사용자 지정 로드 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## 플러그인 유형

OpenClaw는 두 가지 플러그인 형식을 인식합니다.

| 형식 | 동작 방식 | 예시 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈, 프로세스 내에서 실행 | 공식 플러그인, 커뮤니티 npm 패키지 |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃, OpenClaw 기능에 매핑 | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list`에 표시됩니다. 번들 세부 정보는 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

Native Plugin을 작성하고 있다면 [Building Plugins](/ko/plugins/building-plugins) 및
[Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 플러그인

### 설치 가능(npm)

| Plugin | 패키지 | 문서 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ko/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ko/plugins/zalouser)   |

### 코어(OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 제공자(기본적으로 활성화됨)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 플러그인">
    - `memory-core` — 번들 메모리 검색(`plugins.slots.memory`를 통한 기본값)
    - `memory-lancedb` — 필요 시 설치되는 장기 메모리로 자동 회상/캡처 제공(`plugins.slots.memory = "memory-lancedb"` 설정)
  </Accordion>

  <Accordion title="음성 제공자(기본적으로 활성화됨)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — 브라우저 도구, `openclaw browser` CLI, `browser.request` Gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스용 번들 브라우저 플러그인(기본적으로 활성화됨, 교체하기 전 비활성화 필요)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본적으로 비활성화됨)
  </Accordion>
</AccordionGroup>

서드파티 플러그인을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

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

| 필드 | 설명 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`) |
| `allow`          | Plugin 허용 목록(선택 사항) |
| `deny`           | Plugin 거부 목록(선택 사항, 거부가 우선) |
| `load.paths`     | 추가 플러그인 파일/디렉터리 |
| `slots`          | 배타적 슬롯 선택기(예: `memory`, `contextEngine`) |
| `entries.\<id\>` | 플러그인별 토글 + 구성 |

구성 변경은 **Gateway 재시작이 필요합니다**. Gateway가 구성 감시 + 프로세스 내 재시작을
활성화한 상태로 실행 중이면(기본 `openclaw gateway` 경로),
구성 쓰기가 완료된 직후 일반적으로 자동으로 재시작됩니다.
Native Plugin 런타임 코드 또는 수명 주기 훅에 대해 지원되는 핫 리로드 경로는 없습니다.
업데이트된 `register(api)` 코드, `api.on(...)` 훅, 도구, 서비스 또는
제공자/런타임 훅이 실행되길 기대하기 전에 라이브 채널을 제공하는
Gateway 프로세스를 재시작하세요.

`openclaw plugins list`는 로컬 CLI/구성 스냅샷입니다. 여기서 `loaded` 플러그인은
해당 CLI 호출이 확인한 구성/파일에서 플러그인을 검색하고 로드할 수 있음을 뜻합니다.
이미 실행 중인 원격 Gateway 자식 프로세스가
동일한 플러그인 코드로 재시작되었음을 보장하지는 않습니다. 래퍼 프로세스가 있는
VPS/컨테이너 설정에서는 실제 `openclaw gateway run` 프로세스로 재시작 신호를 보내거나,
실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="플러그인 상태: 비활성화 vs 누락 vs 유효하지 않음">
  - **비활성화됨**: 플러그인은 존재하지만 활성화 규칙에 의해 꺼져 있습니다. 구성은 유지됩니다.
  - **누락됨**: 구성이 플러그인 id를 참조하지만 검색에서 찾지 못했습니다.
  - **유효하지 않음**: 플러그인은 존재하지만 구성이 선언된 스키마와 일치하지 않습니다.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 플러그인을 검색합니다(먼저 일치한 항목이 우선):

<Steps>
  <Step title="구성 경로">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로.
  </Step>

  <Step title="워크스페이스 플러그인">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 플러그인">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 플러그인">
    OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(모델 제공자, 음성).
    다른 항목은 명시적 활성화가 필요합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 플러그인을 비활성화합니다
- `plugins.deny`는 항상 allow보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 플러그인을 비활성화합니다
- 워크스페이스 원본 플러그인은 **기본적으로 비활성화됨**(명시적으로 활성화해야 함)
- 번들 플러그인은 재정의되지 않는 한 기본 내장 활성화 집합을 따릅니다
- 배타적 슬롯은 해당 슬롯에 대해 선택된 플러그인을 강제로 활성화할 수 있습니다
- 일부 번들 선택형 플러그인은 구성이
  제공자 모델 ref, 채널 구성 또는 하네스 런타임과 같이 플러그인 소유 표면을 지정하면
  자동으로 활성화됩니다
- OpenAI 계열 Codex 경로는 별도의 플러그인 경계를 유지합니다.
  `openai-codex/*`는 OpenAI Plugin에 속하고, 번들 Codex
  app-server Plugin은 `embeddedHarness.runtime: "codex"` 또는 레거시
  `codex/*` 모델 ref로 선택됩니다

## 런타임 훅 문제 해결

플러그인이 `plugins list`에는 나타나지만 `register(api)` 부작용이나 훅이
실제 채팅 트래픽에서 실행되지 않는다면, 먼저 다음을 확인하세요.

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성
  Gateway URL, 프로필, 구성 경로 및 프로세스가 현재 편집 중인 대상과 일치하는지 확인하세요.
- 플러그인 설치/구성/코드 변경 후 실제 Gateway를 재시작하세요. 래퍼
  컨테이너에서는 PID 1이 감독자일 뿐일 수 있으므로 자식
  `openclaw gateway run` 프로세스를 재시작하거나 신호를 보내야 합니다.
- `openclaw plugins inspect <id> --json`을 사용해 훅 등록과
  진단 정보를 확인하세요. `llm_input`,
  `llm_output`, `agent_end` 같은 비번들 대화 훅에는
  `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 우선 사용하세요. 이 훅은 에이전트 턴의
  모델 해석 전에 실행되며, `llm_output`은 모델 시도가
  어시스턴트 출력을 생성한 후에만 실행됩니다.
- 실제 세션 모델을 확인하려면 `openclaw sessions` 또는
  Gateway 세션/상태 표면을 사용하고, 제공자 페이로드를 디버깅할 때는
  `--raw-stream --raw-stream-path <path>`와 함께 Gateway를 시작하세요.

## 플러그인 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성화 가능).

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 비활성화하려면 "none"
      contextEngine: "legacy", // 또는 플러그인 id
    },
  },
}
```

| 슬롯 | 제어 대상 | 기본값 |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 메모리 플러그인 | `memory-core` |
| `contextEngine` | 활성 컨텍스트 엔진 | `legacy` (내장) |

## CLI 참조

```bash
openclaw plugins list                       # 간단한 인벤토리
openclaw plugins list --enabled            # 로드된 플러그인만
openclaw plugins list --verbose            # 플러그인별 상세 줄
openclaw plugins list --json               # 기계 판독 가능 인벤토리
openclaw plugins inspect <id>              # 상세 정보
openclaw plugins inspect <id> --json       # 기계 판독 가능
openclaw plugins inspect --all             # 전체 테이블
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # 진단

openclaw plugins install <package>         # 설치(먼저 ClawHub, 그다음 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 안 함)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확히 해석된 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 플러그인 하나 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 모두 업데이트
openclaw plugins uninstall <id>          # 구성/설치 기록 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 플러그인은 OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(예:
번들 모델 제공자, 번들 음성 제공자, 번들 브라우저
플러그인). 다른 번들 플러그인은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 플러그인 또는 훅 팩을 그 자리에서 덮어씁니다. 추적되는 npm
플러그인의 일반적인 업그레이드에는
`openclaw plugins update <id-or-npm-spec>`를 사용하세요.
이 옵션은 관리되는 설치 대상에 복사하는 대신 원본 경로를 재사용하는 `--link`와는
함께 지원되지 않습니다.

`plugins.allow`가 이미 설정되어 있으면 `openclaw plugins install`은
설치된 플러그인 id를 활성화하기 전에 해당 허용 목록에 추가하므로, 재시작 후
즉시 로드할 수 있습니다.

`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을
추적된 플러그인 레코드에 다시 매핑하고 향후 업데이트를 위해 새 spec을 기록합니다.
버전 없이 패키지 이름만 전달하면 정확히 고정된 설치를 다시
레지스트리의 기본 릴리스 라인으로 되돌립니다. 설치된 npm 플러그인이 이미
해결된 버전 및 기록된 아티팩트 식별성과 일치하면 OpenClaw는 다운로드,
재설치 또는 구성 재작성 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. `--marketplace`와는 함께 지원되지 않습니다.
마켓플레이스 설치는 npm spec 대신 마켓플레이스 소스 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장된 위험 코드 스캐너의 오탐에 대한
비상 우회 옵션입니다. 이 옵션은 내장 `critical` 탐지 결과가 있어도
플러그인 설치 및 플러그인 업데이트를 계속 진행할 수 있게 하지만,
플러그인 `before_install` 정책 차단이나 스캔 실패 차단까지 우회하지는 않습니다.

이 CLI 플래그는 플러그인 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 Skills
의존성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며,
`openclaw skills install`은 별도의 ClawHub Skills 다운로드/설치 흐름으로 유지됩니다.

호환되는 번들은 동일한 플러그인 list/inspect/enable/disable
흐름에 참여합니다. 현재 런타임 지원에는 번들 Skills, Claude command-skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 매니페스트에 선언된
`lspServers` 기본값, Cursor command-skills, 호환되는 Codex 훅
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 플러그인에 대해 감지된 번들 기능과
지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

마켓플레이스 소스는
`~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 마켓플레이스 이름,
로컬 마켓플레이스 루트 또는 `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub 리포지토리 URL 또는 git URL이 될 수 있습니다.
원격 마켓플레이스의 경우 플러그인 항목은 복제된 마켓플레이스 리포지토리 내부에
머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 세부 정보는 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 확인하세요.

## Plugin API 개요

Native Plugin은 `register(api)`를 노출하는 엔트리 객체를 내보냅니다. 오래된
플러그인은 여전히 레거시 별칭인 `activate(api)`를 사용할 수 있지만,
새 플러그인은 `register`를 사용해야 합니다.

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

OpenClaw는 엔트리 객체를 로드하고 플러그인 활성화 중에 `register(api)`를 호출합니다.
로더는 여전히 오래된 플러그인에 대해 `activate(api)`로 대체 동작을 수행하지만,
번들 플러그인과 새로운 외부 플러그인은 `register`를
공개 계약으로 취급해야 합니다.

일반적인 등록 메서드:

| 메서드 | 등록 대상 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 제공자(LLM) |
| `registerChannel`                       | 채팅 채널 |
| `registerTool`                          | 에이전트 도구 |
| `registerHook` / `on(...)`              | 수명 주기 훅 |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성 |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석 |
| `registerImageGenerationProvider`       | 이미지 생성 |
| `registerMusicGenerationProvider`       | 음악 생성 |
| `registerVideoGenerationProvider`       | 비디오 생성 |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 제공자 |
| `registerWebSearchProvider`             | 웹 검색 |
| `registerHttpRoute`                     | HTTP 엔드포인트 |
| `registerCommand` / `registerCli`       | CLI 명령 |
| `registerContextEngine`                 | 컨텍스트 엔진 |
| `registerService`                       | 백그라운드 서비스 |

타입이 지정된 수명 주기 훅의 훅 가드 동작:

- `before_tool_call`: `{ block: true }`는 최종 결정이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 아무 동작도 하지 않으며, 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 최종 결정이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 아무 동작도 하지 않으며, 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 최종 결정이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 아무 동작도 하지 않으며, 이전 취소를 해제하지 않습니다.

전체 타입 지정 훅 동작은 [SDK Overview](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련 항목

- [Building Plugins](/ko/plugins/building-plugins) — 직접 Plugin 만들기
- [Plugin Bundles](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin Manifest](/ko/plugins/manifest) — 매니페스트 스키마
- [Registering Tools](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 에이전트 도구 추가
- [Plugin Internals](/ko/plugins/architecture) — 기능 모델 및 로드 파이프라인
- [Community Plugins](/ko/plugins/community) — 서드파티 목록
