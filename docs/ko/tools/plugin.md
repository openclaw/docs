---
read_when:
    - 플러그인 설치 또는 구성
    - 플러그인 검색 및 로드 규칙 이해
    - Codex/Claude 호환 플러그인 번들 작업
sidebarTitle: Install and Configure
summary: OpenClaw 플러그인 설치, 구성 및 관리
title: 플러그인
x-i18n:
    generated_at: "2026-04-25T18:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

플러그인은 OpenClaw에 새로운 기능을 추가합니다: 채널, 모델 provider, agent 하니스, 도구, Skills, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색 등. 일부 플러그인은 **core**(OpenClaw와 함께 제공)이고, 다른 일부는 **external**(커뮤니티가 npm에 게시)입니다.

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

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 config 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 resolver를 사용합니다: 로컬 경로/아카이브, 명시적 `clawhub:<pkg>`, 또는 버전 없는 패키지 spec(먼저 ClawHub, 그다음 npm fallback).

config가 유효하지 않으면 설치는 일반적으로 실패하도록 닫혀 있으며 `openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는 `openclaw.install.allowInvalidConfigRecovery`를 opt-in한 플러그인을 위한 제한적인 번들 플러그인 재설치 경로입니다.

패키지형 OpenClaw 설치는 모든 번들 플러그인의 런타임 의존성 트리를 미리 설치하지 않습니다. 번들된 OpenClaw 소유 플러그인이 플러그인 config, 레거시 채널 config, 또는 기본 활성화 매니페스트를 통해 활성 상태일 때, 시작 복구는 해당 플러그인을 import하기 전에 그 플러그인이 선언한 런타임 의존성만 복구합니다. 명시적 비활성화는 여전히 우선합니다: `plugins.entries.<id>.enabled: false`, `plugins.deny`, `plugins.enabled: false`, `channels.<id>.enabled: false`는 해당 플러그인/채널에 대한 자동 번들 런타임 의존성 복구를 방지합니다. 외부 플러그인과 커스텀 로드 경로는 여전히 `openclaw plugins install`을 통해 설치해야 합니다.

## 플러그인 유형

OpenClaw는 두 가지 플러그인 형식을 인식합니다.

| 형식       | 동작 방식                                                      | 예시                                                   |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈; 프로세스 내에서 실행됨   | 공식 플러그인, 커뮤니티 npm 패키지                     |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃; OpenClaw 기능으로 매핑됨    | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list`에 표시됩니다. 번들 세부 사항은 [Plugin Bundles](/ko/plugins/bundles)를 참고하세요.

네이티브 플러그인을 작성하는 경우 [Building Plugins](/ko/plugins/building-plugins) 및 [Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 플러그인

### 설치 가능 (npm)

| 플러그인       | 패키지                | 문서                                 |
| -------------- | --------------------- | ------------------------------------ |
| Matrix         | `@openclaw/matrix`    | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams| `@openclaw/msteams`   | [Microsoft Teams](/ko/channels/msteams) |
| Nostr          | `@openclaw/nostr`     | [Nostr](/ko/channels/nostr)             |
| Voice Call     | `@openclaw/voice-call`| [Voice Call](/ko/plugins/voice-call)    |
| Zalo           | `@openclaw/zalo`      | [Zalo](/ko/channels/zalo)               |
| Zalo Personal  | `@openclaw/zalouser`  | [Zalo Personal](/ko/plugins/zalouser)   |

### Core (OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 provider (기본 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 플러그인">
    - `memory-core` — 번들 메모리 검색(`plugins.slots.memory`를 통한 기본값)
    - `memory-lancedb` — 주문형 설치 장기 메모리(auto-recall/capture 포함) (`plugins.slots.memory = "memory-lancedb"` 설정)
  </Accordion>

  <Accordion title="음성 provider (기본 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — 브라우저 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스용 번들 브라우저 플러그인(기본 활성화; 교체 전에 비활성화 필요)
    - `copilot-proxy` — VS Code Copilot Proxy bridge (기본 비활성화)
  </Accordion>
</AccordionGroup>

서드파티 플러그인을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참고하세요.

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

| 필드            | 설명                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                               |
| `allow`          | 플러그인 allowlist(선택 사항)                             |
| `deny`           | 플러그인 denylist(선택 사항, deny 우선)                   |
| `load.paths`     | 추가 플러그인 파일/디렉터리                               |
| `slots`          | 배타적 슬롯 선택기(예: `memory`, `contextEngine`)         |
| `entries.\<id\>` | 플러그인별 토글 + config                                  |

config 변경에는 **gateway 재시작이 필요합니다**. Gateway가 config 감시 + 프로세스 내 재시작 활성화 상태(기본 `openclaw gateway` 경로)로 실행 중이면, 그 재시작은 보통 config 쓰기가 반영된 직후 자동으로 수행됩니다. 네이티브 플러그인 런타임 코드나 수명 주기 hook에 대해 지원되는 핫 리로드 경로는 없습니다. 업데이트된 `register(api)` 코드, `api.on(...)` hook, 도구, 서비스, 또는 provider/런타임 hook이 실행되기를 기대하기 전에 실제 채널을 제공하는 Gateway 프로세스를 재시작하세요.

`openclaw plugins list`는 로컬 플러그인 레지스트리/config 스냅샷입니다. 여기서 플러그인이 `enabled`로 표시된다는 것은 지속 저장된 레지스트리와 현재 config가 해당 플러그인의 참여를 허용한다는 의미입니다. 이미 실행 중인 원격 Gateway 자식 프로세스가 동일한 플러그인 코드로 재시작되었음을 증명하지는 않습니다. VPS/컨테이너 설정에서 래퍼 프로세스를 사용하는 경우, 재시작 신호를 실제 `openclaw gateway run` 프로세스로 보내거나 실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="플러그인 상태: disabled vs missing vs invalid">
  - **Disabled**: 플러그인은 존재하지만 활성화 규칙에 의해 꺼져 있습니다. config는 유지됩니다.
  - **Missing**: config가 플러그인 id를 참조하지만 검색에서 해당 플러그인을 찾지 못했습니다.
  - **Invalid**: 플러그인은 존재하지만 config가 선언된 스키마와 일치하지 않습니다.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 플러그인을 스캔합니다(먼저 일치한 항목이 우선):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로.
  </Step>

  <Step title="Workspace 플러그인">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 플러그인">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 플러그인">
    OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화되어 있습니다(모델 provider, 음성).
    다른 항목은 명시적 활성화가 필요합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 플러그인을 비활성화합니다
- `plugins.deny`는 항상 allow보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 플러그인을 비활성화합니다
- Workspace 출처 플러그인은 **기본적으로 비활성화**되어 있습니다(명시적으로 활성화해야 함)
- 번들 플러그인은 override되지 않는 한 내장 기본 활성화 세트를 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 플러그인을 강제로 활성화할 수 있습니다
- 일부 번들 opt-in 플러그인은 provider 모델 ref, 채널 config, 또는 하니스 런타임처럼 플러그인 소유 표면이 config에 이름으로 지정되면 자동으로 활성화됩니다
- OpenAI 계열 Codex 경로는 별도의 플러그인 경계를 유지합니다:
  `openai-codex/*`는 OpenAI 플러그인에 속하고, 번들 Codex app-server 플러그인은 `embeddedHarness.runtime: "codex"` 또는 레거시 `codex/*` 모델 ref로 선택됩니다

## 런타임 hook 문제 해결

플러그인이 `plugins list`에는 나타나지만 `register(api)` 부작용이나 hook이 실제 채팅 트래픽에서 실행되지 않는다면, 먼저 다음을 확인하세요.

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성 Gateway URL, 프로필, config 경로, 프로세스가 현재 편집 중인 대상인지 확인합니다.
- 플러그인 설치/config/코드 변경 후 실제 Gateway를 재시작합니다. 래퍼 컨테이너에서는 PID 1이 감독자일 수 있으므로 자식 `openclaw gateway run` 프로세스를 재시작하거나 신호를 보내세요.
- `openclaw plugins inspect <id> --json`을 사용해 hook 등록과 diagnostics를 확인하세요. `llm_input`, `llm_output`, `agent_end` 같은 번들 외 conversation hook에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 우선 사용하세요. 이는 agent turn의 모델 해석 전에 실행됩니다. `llm_output`은 모델 시도가 assistant 출력을 생성한 후에만 실행됩니다.
- 실제 세션 모델을 증명하려면 `openclaw sessions` 또는 Gateway session/status 표면을 사용하고, provider payload를 디버깅할 때는 `--raw-stream --raw-stream-path <path>`와 함께 Gateway를 시작하세요.

## 플러그인 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성화 가능).

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 슬롯            | 제어 대상              | 기본값              |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 메모리 플러그인   | `memory-core`       |
| `contextEngine` | 활성 context engine   | `legacy` (내장)     |

## CLI 참조

```bash
openclaw plugins list                       # 간결한 인벤토리
openclaw plugins list --enabled            # 활성화된 플러그인만
openclaw plugins list --verbose            # 플러그인별 상세 줄
openclaw plugins list --json               # 시스템이 읽을 수 있는 인벤토리
openclaw plugins inspect <id>              # 심층 세부 정보
openclaw plugins inspect <id> --json       # 시스템이 읽을 수 있는 형식
openclaw plugins inspect --all             # 전체 플러그인 표
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # 지속 저장된 레지스트리 상태 확인
openclaw plugins registry --refresh        # 지속 저장된 레지스트리 재구성

openclaw plugins install <package>         # 설치 (먼저 ClawHub, 그다음 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 없음)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 해석된 정확한 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 플러그인 하나 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 모두 업데이트
openclaw plugins uninstall <id>          # config/설치 기록 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 플러그인은 OpenClaw와 함께 제공됩니다. 많은 플러그인이 기본적으로 활성화되어 있습니다(예: 번들 모델 provider, 번들 음성 provider, 번들 브라우저 플러그인). 다른 번들 플러그인은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 플러그인 또는 hook pack을 제자리에서 덮어씁니다. 추적 중인 npm 플러그인의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요. `--link`와는 함께 지원되지 않습니다. `--link`는 관리형 설치 대상을 복사하는 대신 원본 경로를 재사용하기 때문입니다.

`plugins.allow`가 이미 설정되어 있는 경우 `openclaw plugins install`은 설치된 플러그인 id를 해당 allowlist에 추가한 후 활성화하므로, 재시작 후 즉시 로드할 수 있습니다.

OpenClaw는 플러그인 인벤토리, 기여 소유권, 시작 계획을 위한 콜드 읽기 모델로 지속 저장된 로컬 플러그인 레지스트리를 유지합니다. 설치, 업데이트, 제거, 활성화, 비활성화 흐름은 플러그인 상태를 변경한 후 이 레지스트리를 새로 고칩니다. 레지스트리가 없거나 오래되었거나 잘못된 경우, `openclaw plugins registry --refresh`는 플러그인 런타임 모듈을 로드하지 않고 내구성 있는 설치 원장, config 정책, 매니페스트/패키지 메타데이터에서 이를 다시 빌드합니다.

`openclaw plugins update <id-or-npm-spec>`는 추적된 설치에 적용됩니다. dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을 추적된 플러그인 기록으로 다시 해석하고, 이후 업데이트를 위해 새 spec을 기록합니다. 버전 없이 패키지 이름만 전달하면 정확한 버전으로 고정된 설치를 레지스트리의 기본 릴리스 라인으로 되돌립니다. 설치된 npm 플러그인이 이미 해석된 버전 및 기록된 아티팩트 식별자와 일치하면, OpenClaw는 다운로드, 재설치, config 재기록 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. marketplace 설치는 npm spec 대신 marketplace 소스 메타데이터를 유지하므로 `--marketplace`와 함께 지원되지 않습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한 긴급 우회 override입니다. 플러그인 설치 및 플러그인 업데이트가 내장 `critical` 결과를 넘어 계속 진행되도록 허용하지만, 여전히 플러그인 `before_install` 정책 차단이나 스캔 실패 차단은 우회하지 않습니다.

이 CLI 플래그는 플러그인 install/update 흐름에만 적용됩니다. Gateway 기반 skill 의존성 설치는 대신 대응하는 `dangerouslyForceUnsafeInstall` 요청 override를 사용하며, `openclaw skills install`은 별도의 ClawHub skill 다운로드/설치 흐름으로 유지됩니다.

호환 번들은 동일한 플러그인 list/inspect/enable/disable 흐름에 참여합니다. 현재 런타임 지원에는 번들 Skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` 및 매니페스트 선언 `lspServers` 기본값, Cursor command-skills, 호환 Codex hook 디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 플러그인에 대해 감지된 번들 기능과 지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

Marketplace 소스는 `~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름, 로컬 marketplace 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 리포지토리 URL, 또는 git URL일 수 있습니다. 원격 marketplace의 경우 플러그인 항목은 클론된 marketplace 리포지토리 내부에 머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 세부 사항은 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 참고하세요.

## Plugin API 개요

네이티브 플러그인은 `register(api)`를 노출하는 엔트리 객체를 export합니다. 오래된 플러그인은 여전히 레거시 별칭으로 `activate(api)`를 사용할 수 있지만, 새 플러그인은 `register`를 사용해야 합니다.

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

OpenClaw는 엔트리 객체를 로드하고 플러그인 활성화 중에 `register(api)`를 호출합니다. 로더는 여전히 오래된 플러그인을 위해 `activate(api)`로 fallback하지만, 번들 플러그인과 새로운 외부 플러그인은 `register`를 공개 계약으로 취급해야 합니다.

`api.registrationMode`는 플러그인에 엔트리가 로드되는 이유를 알려줍니다.

| 모드            | 의미                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 런타임 활성화. 도구, hook, 서비스, 명령어, 라우트, 기타 실제 부작용을 등록합니다.                                               |
| `discovery`     | 읽기 전용 capability 검색. provider와 메타데이터를 등록하며, 신뢰된 플러그인 엔트리 코드는 로드될 수 있지만 실제 부작용은 건너뜁니다. |
| `setup-only`    | 경량 setup 엔트리를 통한 채널 setup 메타데이터 로딩입니다.                                                                       |
| `setup-runtime` | 런타임 엔트리도 필요한 채널 setup 로딩입니다.                                                                                     |
| `cli-metadata`  | CLI 명령 메타데이터 수집만 수행합니다.                                                                                            |

소켓, 데이터베이스, 백그라운드 워커, 장기 실행 클라이언트를 여는 플러그인 엔트리는 이러한 부작용을 `api.registrationMode === "full"`로 가드해야 합니다. 검색 로드는 활성화 로드와 별도로 캐시되며 실행 중인 Gateway 레지스트리를 대체하지 않습니다. 검색은 비활성화 방식일 뿐 import-free는 아닙니다. OpenClaw는 스냅샷을 구성하기 위해 신뢰된 플러그인 엔트리나 채널 플러그인 모듈을 평가할 수 있습니다. 모듈 최상위는 가볍고 부작용이 없도록 유지하고, 네트워크 클라이언트, 서브프로세스, 리스너, 자격 증명 읽기, 서비스 시작은 전체 런타임 경로 뒤로 이동하세요.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상                    |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 provider (LLM)         |
| `registerChannel`                       | 채팅 채널                   |
| `registerTool`                          | agent 도구                  |
| `registerHook` / `on(...)`              | 수명 주기 hook              |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT      |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성          |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석          |
| `registerImageGenerationProvider`       | 이미지 생성                 |
| `registerMusicGenerationProvider`       | 음악 생성                   |
| `registerVideoGenerationProvider`       | 비디오 생성                 |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 provider |
| `registerWebSearchProvider`             | 웹 검색                     |
| `registerHttpRoute`                     | HTTP 엔드포인트             |
| `registerCommand` / `registerCli`       | CLI 명령어                  |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | 백그라운드 서비스           |

타입 지정 수명 주기 hook의 guard 동작:

- `before_tool_call`: `{ block: true }`는 종료 동작이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료 동작이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료 동작이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 이전 cancel을 해제하지 않습니다.

네이티브 Codex app-server 실행은 Codex 네이티브 도구 이벤트를 이 hook 표면으로 다시 브리지합니다. 플러그인은 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고, `after_tool_call`을 통해 결과를 관찰하며, Codex `PermissionRequest` 승인에 참여할 수 있습니다. 브리지는 아직 Codex 네이티브 도구 인수를 재작성하지 않습니다. 정확한 Codex 런타임 지원 경계는 [Codex harness v1 support contract](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 타입 지정 hook 동작은 [SDK overview](/ko/plugins/sdk-overview#hook-decision-semantics)를 참고하세요.

## 관련 항목

- [플러그인 빌드](/ko/plugins/building-plugins) — 직접 플러그인 만들기
- [Plugin bundles](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin manifest](/ko/plugins/manifest) — 매니페스트 스키마
- [도구 등록](/ko/plugins/building-plugins#registering-agent-tools) — 플러그인에 agent 도구 추가
- [Plugin internals](/ko/plugins/architecture) — capability 모델 및 로드 파이프라인
- [커뮤니티 플러그인](/ko/plugins/community) — 서드파티 목록
