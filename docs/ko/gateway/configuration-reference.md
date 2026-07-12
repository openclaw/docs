---
read_when:
    - 정확한 필드 수준의 구성 의미 체계 또는 기본값이 필요합니다
    - 채널, 모델, Gateway 또는 도구 구성 블록을 검증하고 있습니다
summary: 핵심 OpenClaw 키, 기본값 및 전용 하위 시스템 참조 링크에 대한 Gateway 구성 참조 자료
title: 구성 참조 안내서
x-i18n:
    generated_at: "2026-07-12T21:34:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json`의 필드 수준 참조: 키, 기본값 및 더 자세한 하위 시스템 페이지 링크를 제공합니다. 작업 중심의 설정 지침은 [구성](/ko/gateway/configuration)을 참조하십시오. 채널 및 Plugin이 소유하는 명령 카탈로그와 심층 메모리/QMD 조정 항목은 여기가 아닌 각각의 전용 페이지에서 다룹니다.

구성 형식은 **JSON5**입니다(주석 및 후행 쉼표 허용). 모든 필드는 선택 사항이며, 생략하면 OpenClaw가 안전한 기본값을 사용합니다.

코드의 실제 동작이 이 페이지보다 우선합니다.

- `openclaw config schema`는 검증 및 Control UI에 사용되는 실제 JSON Schema를 출력하며, 번들/Plugin/채널 메타데이터가 병합되어 있습니다.
- 에이전트는 구성을 편집하기 전에 정확한 경로 범위의 스키마 노드 하나를 조회하기 위해 `gateway` 도구 작업 `config.schema.lookup`을 호출해야 합니다.
- `pnpm config:docs:check` / `pnpm config:docs:gen`은 현재 스키마 표면을 기준으로 이 문서의 기준 해시를 검증합니다.

전용 심층 참조:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` 및 `plugins.entries.memory-core.config.dreaming` 아래의 Dreaming 구성을 다루는 [메모리 구성 참조](/ko/reference/memory-config).
- 현재 기본 제공 및 번들 명령 카탈로그를 다루는 [슬래시 명령](/ko/tools/slash-commands).
- 채널별 명령 표면을 다루는 해당 채널/Plugin 페이지.

---

## 채널

채널별 구성 키는 [구성 - 채널](/ko/gateway/config-channels)에 있습니다. Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 및 기타 번들 채널의 인증, 액세스 제어, 다중 계정, 멘션 게이팅에는 `channels.*`를 사용합니다.

## 에이전트 기본값, 다중 에이전트, 세션 및 메시지

다음 내용은 [구성 - 에이전트](/ko/gateway/config-agents)를 참조하십시오.

- `agents.defaults.*`(작업 공간, 모델, 사고, Heartbeat, 메모리, 미디어, Skills, 샌드박스)
- `multiAgent.*`(멀티 에이전트 라우팅 및 바인딩)
- `session.*`(세션 수명 주기, Compaction, 정리)
- `messages.*` (메시지 전달, TTS, 마크다운 렌더링)
- `talk.*` (대화 모드)
  - `talk.consultThinkingLevel`: Control UI Talk 실시간 상담을 지원하는 전체 OpenClaw 에이전트 실행의 사고 수준 재정의
  - `talk.consultFastMode`: Control UI Talk 실시간 상담을 위한 일회성 고속 모드 재정의
  - `talk.speechLocale`: iOS/macOS의 Talk 음성 인식을 위한 선택적 BCP 47 로케일 ID
  - `talk.silenceTimeoutMs`: 설정하지 않으면 Talk는 트랜스크립트를 전송하기 전 플랫폼 기본 일시 중지 시간을 유지합니다(`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult`을 건너뛰는 최종 확정된 실시간 Talk 트랜스크립트를 위한 Gateway 릴레이 폴백

## 도구 및 사용자 지정 공급자

도구 정책, 실험적 토글, 공급자 기반 도구 구성 및 사용자 지정
공급자 / 기본 URL 설정에 관한 내용은
[구성 - 도구 및 사용자 지정 공급자](/ko/gateway/config-tools)에서 확인할 수 있습니다.

## 모델

제공자 정의, 모델 허용 목록 및 사용자 지정 제공자 설정은
[구성 - 도구 및 사용자 지정 제공자](/ko/gateway/config-tools#custom-providers-and-base-urls)에 있습니다.
`models` 루트는 전역 모델 카탈로그 동작도 관리합니다.

```json5
{
  models: {
    // 선택 사항입니다. 기본값: true. 변경 시 Gateway를 다시 시작해야 합니다.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: 제공자 카탈로그 동작입니다(`merge` 또는 `replace`).
- `models.providers`: 제공자 ID를 키로 사용하는 사용자 지정 제공자 맵입니다.
- `models.providers.*.localService`: 로컬 모델 서버를 위한 선택적 온디맨드 프로세스 관리자입니다.
  OpenClaw는 구성된 상태 확인 엔드포인트를 탐색하고, 필요할 때 절대 경로의 `command`를 시작하며,
  준비될 때까지 기다린 후 모델 요청을 전송합니다. [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하십시오.
- `models.pricing.enabled`: 사이드카와 채널이 Gateway 준비 경로에 도달한 후
  시작되는 백그라운드 가격 정보 부트스트랩을 제어합니다. `false`이면
  Gateway는 OpenRouter 및 LiteLLM 가격 카탈로그 가져오기를 건너뛰지만, 구성된
  `models.providers.*.models[].cost` 값은 로컬 비용 추정에 계속 사용됩니다.

## MCP

OpenClaw에서 관리하는 MCP 서버 정의는 `mcp.servers` 아래에 있으며,
내장 OpenClaw 및 기타 런타임 어댑터에서 사용됩니다. `openclaw mcp list`,
`show`, `set`, `unset` 명령은 구성을 편집하는 동안 대상 서버에 연결하지 않고
이 블록을 관리합니다.

```json5
{
  mcp: {
    // 선택 사항입니다. 기본값: 600000 ms(10분). 유휴 제거를 비활성화하려면 0으로 설정합니다.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // 선택적 Codex 앱 서버 프로젝션 제어입니다.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: 구성된 MCP 도구를 노출하는 런타임을 위한 명명된 stdio 또는 원격 MCP 서버 정의입니다.
  원격 항목은 `transport: "streamable-http"` 또는 `transport: "sse"`를 사용합니다.
  `type: "http"`는 `openclaw mcp set` 및 `openclaw doctor --fix`가
  정식 `transport` 필드로 정규화하는 CLI 네이티브 별칭입니다.
- `mcp.servers.<name>.enabled`: 저장된 서버 정의는 유지하면서 내장 OpenClaw MCP 검색 및
  도구 프로젝션에서 제외하려면 `false`로 설정합니다.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: 서버별 MCP 요청 제한 시간으로,
  초 또는 밀리초 단위입니다.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: 서버별 연결 제한 시간으로,
  초 또는 밀리초 단위입니다.
- `mcp.servers.<name>.supportsParallelToolCalls`: 병렬 MCP 도구 호출 여부를 선택할 수 있는
  어댑터를 위한 선택적 동시성 힌트입니다.
- `mcp.servers.<name>.auth`: OAuth가 필요한 HTTP MCP 서버에는 `"oauth"`로 설정합니다.
  OpenClaw 상태 아래에 토큰을 저장하려면 `openclaw mcp login <name>`을 실행합니다.
- `mcp.servers.<name>.oauth`: 선택적 OAuth 범위, 리디렉션 URL 및 클라이언트 메타데이터 URL 재정의입니다.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: 비공개 엔드포인트 및 상호 TLS를 위한
  HTTP TLS 제어입니다.
- `mcp.servers.<name>.toolFilter`: 선택적 서버별 도구 선택입니다. `include`는
  검색된 MCP 도구를 일치하는 이름으로 제한하고, `exclude`는 일치하는 이름을 숨깁니다.
  항목은 정확한 MCP 도구 이름 또는 단순한 `*` 글로브입니다. 리소스나 프롬프트가 있는 서버는
  유틸리티 도구 이름(`resources_list`, `resources_read`, `prompts_list`, `prompts_get`)도
  생성하며, 이러한 이름에도 동일한 필터가 적용됩니다.
- `mcp.servers.<name>.codex`: 선택적 Codex 앱 서버 프로젝션 제어입니다.
  이 블록은 Codex 앱 서버 스레드 전용 OpenClaw 메타데이터이며, ACP 세션,
  일반 Codex 하네스 구성 또는 기타 런타임 어댑터에는 영향을 주지 않습니다.
  비어 있지 않은 `codex.agents`는 서버를 나열된 OpenClaw 에이전트 ID로 제한합니다.
  비어 있거나 공백이거나 유효하지 않은 범위 지정 에이전트 목록은 구성 검증에서 거부되며,
  전역으로 적용되는 대신 런타임 프로젝션 경로에서 생략됩니다.
  `codex.defaultToolsApprovalMode`는 해당 서버에 대해 Codex의 네이티브
  `default_tools_approval_mode`를 내보냅니다. OpenClaw는 네이티브 `mcp_servers`
  구성을 Codex에 전달하기 전에 `codex` 블록을 제거합니다. Codex의 기본 MCP 승인 동작을
  사용하여 모든 Codex 앱 서버 에이전트에 서버를 계속 프로젝션하려면 이 블록을 생략합니다.
- `mcp.sessionIdleTtlMs`: 세션 범위의 번들 MCP 런타임에 대한 유휴 TTL입니다.
  일회성 내장 실행은 실행 종료 정리를 요청하며, 이 TTL은 장기 실행 세션과 향후 호출자를 위한
  최종 안전장치입니다.
- `mcp.*` 아래의 변경 사항은 캐시된 세션 MCP 런타임을 폐기하여 즉시 적용됩니다.
  다음 도구 검색/사용 시 새 구성에서 다시 생성되므로 제거된 `mcp.servers` 항목은
  유휴 TTL을 기다리지 않고 즉시 정리됩니다.
- 런타임 검색은 해당 세션의 캐시된 카탈로그를 삭제하여 MCP 도구 목록 변경 알림도 반영합니다.
  리소스나 프롬프트를 제공한다고 알리는 서버에는 리소스 나열/읽기 및 프롬프트 나열/가져오기를
  위한 유틸리티 도구가 제공됩니다. 도구 호출이 반복해서 실패하면 다시 호출을 시도하기 전에
  영향을 받은 서버를 잠시 일시 중지합니다.

런타임 동작은 [MCP](/ko/cli/mcp#openclaw-as-an-mcp-client-registry) 및
[CLI 백엔드](/ko/gateway/cli-backends#bundle-mcp-overlays)를 참조하십시오.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 번들 Skills에만 적용되는 선택적 허용 목록입니다(관리형/워크스페이스 Skills에는 영향을 주지 않음).
- `load.extraDirs`: 추가 공유 Skill 루트입니다(우선순위가 가장 낮음).
- `load.allowSymlinkTargets`: 링크가 구성된 소스 루트 외부에 있을 때 Skill 심볼릭 링크가
  가리킬 수 있는 신뢰할 수 있는 실제 대상 루트입니다.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop 적용 작업이 이미 신뢰된 심볼릭 링크 대상을 통해
  쓰기를 수행하도록 허용합니다(기본값: false).
- `install.preferBrew`: true이면 `brew`를 사용할 수 있을 때 다른 설치 프로그램 유형으로
  대체하기 전에 Homebrew 설치 프로그램을 우선 사용합니다.
- `install.nodeManager`: `metadata.openclaw.install` 사양에 대한 Node 설치 프로그램 기본 설정입니다
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: 신뢰할 수 있는 `operator.admin` Gateway 클라이언트가
  `skills.upload.*`를 통해 준비된 비공개 zip 아카이브를 설치하도록 허용합니다
  (기본값: false). 이는 업로드된 아카이브 경로만 활성화하며, 일반 ClawHub 설치에는 필요하지 않습니다.
- `entries.<skillKey>.enabled: false`는 번들되거나 설치된 Skill도 비활성화합니다.
- `entries.<skillKey>.apiKey`: 기본 환경 변수를 선언하는 Skills를 위한 편의 설정입니다(일반 텍스트 문자열 또는 SecretRef 객체).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: Skill 검색과 모델에 제공되는 Skills 프롬프트의 범위를 제한합니다.
- Skill Workshop 자율성/승인 설정(`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`)은 [Skills 구성](/ko/tools/skills-config)에 설명되어 있습니다.

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions` 및 `<workspace>/.openclaw/extensions` 아래의 패키지 또는 번들 디렉터리와 `plugins.load.paths`에 나열된 파일 또는 디렉터리에서 로드됩니다.
- 독립 실행형 Plugin 파일은 `plugins.load.paths`에 배치하십시오. 자동 탐색되는 확장 루트는 최상위 `.js`, `.mjs`, `.ts` 파일을 무시하므로 해당 루트의 헬퍼 스크립트가 시작을 방해하지 않습니다.
- 탐색에서는 네이티브 OpenClaw Plugin뿐 아니라 호환되는 Codex 번들과 Claude 번들(매니페스트가 없는 Claude 기본 레이아웃 번들 포함)도 허용합니다.
- **설정 변경 사항을 적용하려면 Gateway를 다시 시작해야 합니다.**
- `allow`: 선택적 허용 목록입니다(목록에 포함된 Plugin만 로드됨). `deny`가 우선합니다.
- `plugins.entries.<id>.apiKey`: Plugin 수준의 API 키 편의 필드입니다(Plugin에서 지원하는 경우).
- `plugins.entries.<id>.env`: Plugin 범위의 환경 변수 맵입니다.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 코어가 `before_prompt_build`를 차단하고 레거시 `before_agent_start`의 프롬프트 변경 필드를 무시하되, 레거시 `modelOverride` 및 `providerOverride`는 유지합니다. 네이티브 Plugin 훅과 지원되는 번들 제공 훅 디렉터리에 적용됩니다.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true`이면 신뢰할 수 있는 비번들 Plugin이 `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`와 같은 형식화된 훅에서 원시 대화 콘텐츠를 읽을 수 있습니다.
- `plugins.entries.<id>.subagent.allowModelOverride`: 이 Plugin이 백그라운드 하위 에이전트 실행별로 `provider` 및 `model` 재정의를 요청할 수 있도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.subagent.allowedModels`: 신뢰할 수 있는 하위 에이전트 재정의에 사용할 정규 `provider/model` 대상의 선택적 허용 목록입니다. 모든 모델을 허용하려는 경우에만 `"*"`를 사용하십시오.
- `plugins.entries.<id>.llm.allowModelOverride`: 이 Plugin이 `api.runtime.llm.complete`의 모델 재정의를 요청할 수 있도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.llm.allowedModels`: 신뢰할 수 있는 Plugin LLM 완성 재정의에 사용할 정규 `provider/model` 대상의 선택적 허용 목록입니다. 모든 모델을 허용하려는 경우에만 `"*"`를 사용하십시오.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: 이 Plugin이 기본값이 아닌 에이전트 ID를 대상으로 `api.runtime.llm.complete`를 실행할 수 있도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.config`: Plugin이 정의한 설정 객체입니다(사용 가능한 경우 네이티브 OpenClaw Plugin 스키마로 검증됨).
- 채널 Plugin 계정/런타임 설정은 `channels.<id>` 아래에 있으며, 중앙 OpenClaw 옵션 레지스트리가 아니라 소유 Plugin의 매니페스트 `channelConfigs` 메타데이터에 설명되어야 합니다.

### Codex 하네스 Plugin 설정

번들 `codex` Plugin은 `plugins.entries.codex.config` 아래의 네이티브 Codex
앱 서버 하네스 설정을 소유합니다. 전체 설정 영역은
[Codex 하네스 레퍼런스](/ko/plugins/codex-harness-reference)를, 런타임 모델은
[Codex 하네스](/ko/plugins/codex-harness)를 참조하십시오.

`codexPlugins`는 네이티브 Codex 하네스를 선택하는 세션에만 적용됩니다.
OpenClaw 공급자 실행, ACP 대화 바인딩 또는 Codex가 아닌 하네스에는
Codex Plugin을 활성화하지 않습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex 하네스의 네이티브
  Codex Plugin/앱 지원을 활성화합니다. 기본값: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: 인증된 Codex
  계정에 연결되어 현재 접근할 수 있는 모든 앱을 각각의 새로운 네이티브
  Codex 스레드에 노출합니다. 기본값: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  설정된 Plugin 앱 요청의 기본 파괴적 작업 정책입니다.
  프롬프트 없이 안전한 Codex 승인 스키마를 수락하려면 `true`, 거부하려면
  `false`, Codex에 필요한 승인을 OpenClaw Plugin 승인을 통해 처리하려면
  `"auto"`, 영구 승인 없이 모든 Plugin 쓰기/파괴적 작업에 대한 확인을
  요청하려면 `"ask"`를 사용하십시오. `"ask"` 모드는 영향을 받는 앱의
  도구별 영구 Codex 승인 재정의를 지우고 Codex 스레드가 시작되기 전에
  해당 앱의 검토자로 사람 승인 검토자를 선택합니다.
  기본값: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: 전역
  `codexPlugins.enabled`도 true일 때 설정된 Plugin 항목을 활성화합니다.
  명시적 항목의 기본값: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  안정적인 마켓플레이스 식별자이며, 확인된 모든 항목에서 `pluginName`과
  함께 필수입니다. `"openai-curated"` 및 `"workspace-directory"`를
  지원합니다. 식별자 필드 중 하나라도 없는 항목은 무시됩니다.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 안정적인
  Codex Plugin 식별자이며, `marketplaceName`과 함께 필수입니다.
  `workspace-directory` 항목은 `plugin/list`가 반환한 마켓플레이스 한정
  `summary.id`를 정확히 사용해야 합니다(예:
  `"example-plugin@workspace-directory"`).
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin별 파괴적 작업 재정의입니다. 생략하면 전역
  `allow_destructive_actions` 값이 사용됩니다. Plugin별 값은 동일하게
  `true`, `false`, `"auto"` 또는 `"ask"` 정책을 허용합니다.

허용된 각 Plugin 앱에서 `"ask"`를 사용하면 해당 앱의 승인 요청이 사람
검토자에게 전달됩니다. 다른 앱과 앱이 아닌 스레드 승인은 설정된 검토자를
유지하므로 혼합 Plugin 정책은 `"ask"` 동작을 상속하지 않습니다.

`codexPlugins.enabled`는 전역 활성화 지시문입니다. 마이그레이션에서 작성한
명시적 Plugin 항목은 영구적으로 선별된 설치 및 복구 적격 집합입니다.
수동으로 설정한 `workspace-directory` 항목은 이미 설치 및 활성화되어 있어야
하며, 항목이 소유한 앱에 접근할 수 있어야 합니다. OpenClaw는 이를 설치하거나
인증하지 않습니다. Codex가 명시적 워크스페이스 카탈로그 요청을 거부하면
활성화된 워크스페이스 항목은 `marketplace_missing`으로 안전하게 실패하고,
기본 카탈로그의 선별된 항목은 계속 사용할 수 있습니다. `plugins["*"]`는
지원되지 않으며 `install` 스위치도 없습니다. 또한 로컬 `marketplacePath`
값은 호스트별로 다르므로 의도적으로 설정 필드에서 제외되었습니다. 앱 서버
버전 및 준비 상태 요구 사항은
[네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하십시오.

`app/list` 준비 상태 검사는 1시간 동안 캐시되며 오래된 경우 비동기식으로
새로 고쳐집니다. Codex 스레드 앱 설정은 매 턴이 아니라 Codex 하네스 세션을
설정할 때 계산됩니다. 네이티브 Plugin 설정을 변경한 후에는 `/new`, `/reset`
또는 Gateway 재시작을 사용하십시오.

`codexPlugins.allow_all_plugins`는 현재 접근할 수 있는 모든 계정 앱의
스냅샷을 각각의 새로운 네이티브 Codex 스레드에 포함합니다. Plugin이나 앱을
설치하지 않으며, 접근할 수 없는 앱은 계속 제외됩니다. 계정 앱에는 전역
`codexPlugins.allow_destructive_actions` 정책이 사용됩니다. 동일한 앱이
두 경로에 모두 있으면 명시적 Plugin 항목이 우선합니다. `app/list`를 읽을 수
없으면 계정 전체 노출은 안전하게 실패합니다.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl 웹 가져오기 공급자 설정입니다.
  - `apiKey`: 더 높은 한도를 위한 선택적 Firecrawl API 키입니다(SecretRef 허용). `plugins.entries.firecrawl.config.webSearch.apiKey`, 레거시 `tools.web.fetch.firecrawl.apiKey` 또는 `FIRECRAWL_API_KEY` 환경 변수로 대체됩니다.
  - `baseUrl`: Firecrawl API 기본 URL입니다(기본값: `https://api.firecrawl.dev`; 자체 호스팅 재정의는 비공개/내부 엔드포인트를 대상으로 해야 함).
  - `onlyMainContent`: 페이지에서 주요 콘텐츠만 추출합니다(기본값: `true`).
  - `maxAgeMs`: 최대 캐시 수명(밀리초)입니다(기본값: `172800000` / 2일).
  - `timeoutSeconds`: 스크레이프 요청 제한 시간(초)입니다(기본값: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search(Grok 웹 검색) 설정입니다.
  - `enabled`: X Search 공급자를 활성화합니다.
  - `model`: 검색에 사용할 Grok 모델입니다(예: `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: 메모리 Dreaming 설정입니다. 단계 및 임계값은 [Dreaming](/ko/concepts/dreaming)을 참조하십시오.
  - `enabled`: Dreaming 마스터 스위치입니다(기본값 `false`).
  - `frequency`: 각 전체 Dreaming 순회의 Cron 주기입니다(기본값 `"0 3 * * *"`).
  - `model`: 선택적 Dream Diary 하위 에이전트 모델 재정의입니다. `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요하며, 대상을 제한하려면 `allowedModels`와 함께 사용하십시오. 모델을 사용할 수 없다는 오류가 발생하면 세션 기본 모델로 한 번 재시도합니다. 신뢰 또는 허용 목록 실패 시에는 자동으로 대체하지 않습니다.
  - 단계 정책 및 임계값은 구현 세부 정보입니다(사용자 대상 설정 키가 아님).
- 전체 메모리 설정은 [메모리 설정 레퍼런스](/ko/reference/memory-config)에 있습니다.
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 활성화된 Claude 번들 Plugin은 `settings.json`에서 임베드된 OpenClaw 기본값을 제공할 수도 있습니다. OpenClaw는 이를 원시 OpenClaw 설정 패치가 아니라 정제된 에이전트 설정으로 적용합니다.
- `plugins.slots.memory`: 활성 메모리 Plugin ID를 선택하거나, 메모리 Plugin을 비활성화하려면 `"none"`을 선택합니다.
- `plugins.slots.contextEngine`: 활성 컨텍스트 엔진 Plugin ID를 선택합니다. 다른 엔진을 설치하고 선택하지 않으면 기본값은 `"legacy"`입니다.

[Plugin](/ko/tools/plugin)을 참조하십시오.

---

## 약속

`commitments`는 추론된 후속 조치 메모리를 제어합니다. OpenClaw는 대화 턴에서 확인 약속을 감지하고 Heartbeat 실행을 통해 전달할 수 있습니다.

- `commitments.enabled`: 추론된 후속 조치 약속에 대한 숨겨진 LLM 추출, 저장 및 Heartbeat 전달을 활성화합니다. 기본값: `false`.
- `commitments.maxPerDay`: 하루 이동 기간 동안 에이전트 세션별로 전달되는 추론된 후속 조치 약속의 최대 수입니다. 기본값: `3`.

[추론된 약속](/ko/concepts/commitments)을 참조하십시오.

---

## 브라우저

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰할 수 있는 비공개 네트워크 접근에만 명시적으로 동의
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`는 `act:evaluate`와 `wait --fn`을 비활성화합니다.
- `tabCleanup`은 유휴 시간이 지난 후 또는 세션이 상한을 초과할 때 추적 중인 기본 에이전트 탭을 회수합니다. 개별 정리 모드를 비활성화하려면 `idleMinutes: 0` 또는 `maxTabsPerSession: 0`으로 설정하십시오.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정하지 않으면 비활성화되므로, 브라우저 탐색은 기본적으로 엄격하게 유지됩니다.
- 비공개 네트워크 브라우저 탐색을 의도적으로 신뢰하는 경우에만 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`로 설정하십시오.
- 엄격 모드에서는 원격 CDP 프로필 엔드포인트(`profiles.*.cdpUrl`)에도 도달 가능성/검색 검사 중 동일한 비공개 네트워크 차단이 적용됩니다.
- `ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.
- 엄격 모드에서 명시적인 예외를 지정하려면 `ssrfPolicy.hostnameAllowlist`와 `ssrfPolicy.allowedHostnames`를 사용하십시오.
- 원격 프로필은 연결 전용입니다(시작/중지/재설정 비활성화).
- `profiles.*.cdpUrl`은 `http://`, `https://`, `ws://`, `wss://`를 허용합니다.
  OpenClaw가 `/json/version`을 검색하도록 하려면 HTTP(S)를 사용하고,
  공급자가 직접 DevTools WebSocket URL을 제공하는 경우에는 WS(S)를 사용하십시오.
- `remoteCdpTimeoutMs`와 `remoteCdpHandshakeTimeoutMs`는 원격 및
  `attachOnly` CDP 도달 가능성과 탭 열기 요청에 적용됩니다. 관리형 루프백
  프로필은 로컬 CDP 기본값을 유지합니다. 지속형 원격 Playwright 탭
  열거는 더 큰 값을 작업 기한으로 사용합니다.
- 외부에서 관리되는 CDP 서비스에 루프백을 통해 도달할 수 있다면 해당
  프로필의 `attachOnly: true`를 설정하십시오. 그렇지 않으면 OpenClaw가 루프백 포트를
  로컬 관리형 브라우저 프로필로 취급하여 로컬 포트 소유권 오류를 보고할 수 있습니다.
- `existing-session` 프로필은 CDP 대신 Chrome MCP를 사용하며 선택한
  호스트 또는 연결된 브라우저 Node를 통해 연결할 수 있습니다.
- `existing-session` 프로필은 `userDataDir`을 설정하여 Brave 또는 Edge와 같은
  특정 Chromium 기반 브라우저 프로필을 대상으로 지정할 수 있습니다.
- Chrome이 이미 DevTools HTTP(S) 검색 엔드포인트 또는 직접 WS(S)
  엔드포인트 뒤에서 실행 중인 경우 `existing-session` 프로필에 `cdpUrl`을 설정할 수 있습니다. 이
  모드에서 OpenClaw는 자동 연결을 사용하는 대신 엔드포인트를 Chrome MCP에 전달하며,
  Chrome MCP 실행 인수에서는 `userDataDir`이 무시됩니다.
- `existing-session` 프로필은 현재 Chrome MCP 경로 제한을 유지합니다.
  CSS 선택자 대상 지정 대신 스냅샷/참조 기반 작업, 단일 파일 업로드
  훅, 대화 상자 시간 초과 재정의 없음, `wait --load networkidle` 미지원,
  그리고 `responsebody`, PDF 내보내기, 다운로드 가로채기 또는 일괄 작업 미지원입니다.
- 로컬 관리형 `openclaw` 프로필은 `cdpPort`와 `cdpUrl`을 자동 할당합니다.
  원격 CDP 프로필 또는 기존 세션 엔드포인트 연결에만 `cdpUrl`을 명시적으로 설정하십시오.
- 로컬 관리형 프로필은 해당 프로필에 대해 전역 `browser.executablePath`를 재정의하도록
  `executablePath`를 설정할 수 있습니다. 이를 사용하여 한 프로필은 Chrome에서,
  다른 프로필은 Brave에서 실행하십시오.
- 로컬 관리형 프로필은 프로세스 시작 후 Chrome CDP HTTP 검색에
  `browser.localLaunchTimeoutMs`를 사용하고, 실행 후 CDP WebSocket 준비에는
  `browser.localCdpReadyTimeoutMs`를 사용합니다. Chrome이 성공적으로 시작되지만
  준비 검사가 시작 과정과 경합하는 느린 호스트에서는 값을 늘리십시오. 두 값 모두
  `120000`ms 이하의 양의 정수여야 하며, 잘못된 구성 값은 거부됩니다.
- 자동 감지 순서: Chromium 기반인 경우 기본 브라우저 → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath`와 `browser.profiles.<name>.executablePath`는 모두
  Chromium 실행 전에 OS 홈 디렉터리를 나타내는 `~`와 `~/...`를 허용합니다.
  `existing-session` 프로필의 프로필별 `userDataDir`에도 물결표 확장이 적용됩니다.
- 제어 서비스: 루프백 전용(`gateway.port`에서 파생된 포트, 기본값 `18791`).
- `extraArgs`는 로컬 Chromium 시작에 추가 실행 플래그를 덧붙입니다(예:
  `--disable-gpu`, 창 크기 지정 또는 디버그 플래그).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 이모지, 짧은 텍스트, 이미지 URL 또는 데이터 URI
    },
  },
}
```

- `seamColor`: 네이티브 앱 UI 크롬의 강조 색상(Talk Mode 말풍선 색조 등).
- `assistant`: Control UI ID 재정의입니다. 활성 에이전트 ID로 대체됩니다.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // 로컬 | 원격
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // 없음 | 토큰 | 비밀번호 | 신뢰할 수 있는 프록시
      token: "your-token",
      // password: "your-password", // 또는 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy용. /gateway/trusted-proxy-auth 참조
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // 끄기 | 제공 | 퍼널
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // 도구 호출에 AI 목적 제목 사용(유틸리티 모델 토큰 소비)
      // embedSandbox: "scripts", // 엄격 | 스크립트 | 신뢰
      // allowExternalEmbedUrls: false, // 위험: 절대 외부 http(s) 임베드 URL 허용
      // chatMessageMaxWidth: "min(1280px, 82%)", // 선택적 중앙 정렬 채팅 기록 최대 너비
      // allowedOrigins: ["https://control.example.com"], // 루프백이 아닌 Control UI에 필수
      // dangerouslyAllowHostHeaderOriginFallback: false, // 위험한 Host 헤더 출처 대체 모드
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | 직접
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 선택 사항. 기본값은 false입니다.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 선택 사항. 기본적으로 설정되지 않음/비활성화됨.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // SSH 검증 자동 승인. 기본값: 활성화됨(true).
        // SSH 검증만 비활성화하려면 false로 설정하십시오. 위의
        // autoApproveCidrs에는 영향을 주지 않습니다. 수동 전용 Node 페어링의 경우 false로 설정하고
        // autoApproveCidrs도 설정 해제하십시오. 조정하려면 객체를 전달하십시오: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 추가 /tools/invoke HTTP 거부 항목
      deny: ["browser"],
      // 소유자/관리자 호출자에 대해 기본 HTTP 거부 목록에서 도구 제거
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 필드 세부 정보">

- `mode`: `local`(Gateway 실행) 또는 `remote`(원격 Gateway에 연결)입니다. `local`이 아니면 Gateway가 시작되지 않습니다.
- `port`: WS + HTTP용 단일 다중화 포트입니다. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback`(기본값), `lan`(`0.0.0.0`), `tailnet`(사용 가능한 경우 Tailscale IPv4, 그렇지 않으면 루프백) 또는 `custom`(IPv4 주소 하나)입니다. 확인된 `tailnet` 주소와 `127.0.0.1` 또는 `0.0.0.0`이 아닌 모든 `custom` 주소는 동일 호스트 클라이언트를 위해 같은 포트의 `127.0.0.1`을 필요로 하며, 어느 리스너든 바인딩할 수 없으면 시작에 실패합니다. 루프백 이외의 노출은 선택한 인터페이스로 계속 제한됩니다.
- **레거시 바인딩 별칭**: 호스트 별칭(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)이 아니라 `gateway.bind`의 바인딩 모드 값(`auto`, `loopback`, `lan`, `tailnet`, `custom`)을 사용하십시오.
- **Docker 참고 사항**: 기본 `loopback` 바인딩은 컨테이너 내부의 `127.0.0.1`에서 수신 대기합니다. Docker 브리지 네트워킹(`-p 18789:18789`)에서는 트래픽이 `eth0`으로 들어오므로 Gateway에 연결할 수 없습니다. 모든 인터페이스에서 수신 대기하려면 `--network host`를 사용하거나 `bind: "lan"`(또는 `customBindHost: "0.0.0.0"`과 함께 `bind: "custom"`)을 설정하십시오.
- **인증**: 기본적으로 필수입니다. 루프백 이외의 바인딩에는 Gateway 인증이 필요합니다. 실제로는 공유 토큰/비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 설정된 ID 인식 리버스 프록시를 의미합니다. 온보딩 마법사는 기본적으로 토큰을 생성합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성된 경우(SecretRef 포함) `gateway.auth.mode`를 `token` 또는 `password`로 명시적으로 설정하십시오. 둘 다 구성되어 있으나 모드가 설정되지 않으면 시작 및 서비스 설치/복구 흐름이 실패합니다.
- `gateway.auth.mode: "none"`: 명시적인 무인증 모드입니다. 신뢰할 수 있는 로컬 루프백 설정에만 사용하십시오. 의도적으로 온보딩 프롬프트에서는 제공되지 않습니다.
- `gateway.auth.mode: "trusted-proxy"`: 브라우저/사용자 인증을 ID 인식 리버스 프록시에 위임하고 `gateway.trustedProxies`의 ID 헤더를 신뢰합니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조). 이 모드는 기본적으로 **루프백이 아닌** 프록시 소스를 예상합니다. 동일 호스트의 루프백 리버스 프록시에는 명시적인 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다. 내부 동일 호스트 호출자는 `gateway.auth.password`를 로컬 직접 대체 수단으로 사용할 수 있으며, `gateway.auth.token`은 trusted-proxy 모드와 계속 상호 배타적입니다.
- `gateway.auth.allowTailscale`: `true`이면 Tailscale Serve ID 헤더가 Control UI/WebSocket 인증을 충족할 수 있습니다(`tailscale whois`로 확인). HTTP API 엔드포인트는 해당 Tailscale 헤더 인증을 사용하지 **않으며**, 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다. 이 토큰 없는 흐름은 Gateway 호스트가 신뢰할 수 있다고 가정합니다. `tailscale.mode = "serve"`이면 기본값은 `true`입니다.
- `gateway.auth.rateLimit`: 선택적인 인증 실패 제한기입니다. 클라이언트 IP별 및 인증 범위별로 적용됩니다(공유 비밀과 기기 토큰은 독립적으로 추적됩니다). 차단된 시도는 `429` + `Retry-After`를 반환합니다.
  - 비동기 Tailscale Serve Control UI 경로에서는 동일한 `{scope, clientIp}`에 대한 실패 시도가 실패 기록 전에 직렬화됩니다. 따라서 동일한 클라이언트에서 동시에 발생한 잘못된 시도는 둘 다 단순 불일치로 경합하여 통과하는 대신 두 번째 요청에서 제한기를 작동시킬 수 있습니다.
  - `gateway.auth.rateLimit.exemptLoopback`의 기본값은 `true`입니다. localhost 트래픽에도 의도적으로 속도 제한을 적용하려면(테스트 설정 또는 엄격한 프록시 배포의 경우) `false`로 설정하십시오.
- 브라우저 출처의 WS 인증 시도에는 루프백 예외가 비활성화된 상태로 항상 제한이 적용됩니다(브라우저 기반 localhost 무차별 대입 공격에 대한 심층 방어).
- 루프백에서는 해당 브라우저 출처 잠금이 정규화된 `Origin`
  값별로 격리되므로, 한 localhost 출처의 반복된 실패가 자동으로
  다른 출처를 잠그지는 않습니다.
- `tailscale.mode`: `serve`(tailnet 전용, 루프백 바인딩) 또는 `funnel`(공개, 인증 필요)입니다.
- `tailscale.serviceName`: Serve 모드에서 사용할 선택적인 Tailscale Service 이름입니다(예:
  `svc:openclaw`). 설정하면 OpenClaw가 이를 `tailscale serve
--service`에 전달하므로, Control UI를 기기 호스트 이름 대신 명명된 Service를 통해
  노출할 수 있습니다. 값은 Tailscale의 `svc:<dns-label>`
  Service 이름 형식을 사용해야 하며, 시작 시 파생된 Service URL이 보고됩니다.
- `tailscale.preserveFunnel`: `true`이고 `tailscale.mode = "serve"`이면 OpenClaw는
  시작 시 Serve를 다시 적용하기 전에 `tailscale funnel status`를 확인하며,
  외부에서 구성된 Funnel 경로가 이미 Gateway 포트를 포괄하는 경우 이를 건너뜁니다.
  기본값은 `false`입니다.
- `controlUi.allowedOrigins`: Gateway WebSocket 연결을 위한 명시적인 브라우저 출처 허용 목록입니다. 공개된 루프백 외 브라우저 출처에 필요합니다. 루프백, RFC1918/링크 로컬, `.local`, `.ts.net` 또는 Tailscale CGNAT 호스트에서 로드되는 비공개 동일 출처 LAN/Tailnet UI는 Host 헤더 대체를 활성화하지 않아도 허용됩니다.
- `controlUi.toolTitles`: Control UI 채팅에서 도구 호출에 AI가 생성한 목적 제목을 사용하도록 옵트인합니다. 기본값: `false`(도구 렌더링은 백그라운드 모델 호출 없이 완전히 결정적으로 유지됩니다). 활성화하면 `chat.toolTitles` 메서드는 표준 유틸리티 모델 라우팅, 즉 에이전트의 `utilityModel`(모든 유틸리티 작업과 마찬가지로 제한된 도구 인수를 선택한 제공자에게 전송할 수 있는 운영자 결정) 또는 세션 제공자가 선언한 소형 모델 기본값(OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`)을 통해 복잡한 호출에 레이블을 지정하고, 결과를 에이전트별 상태 데이터베이스에 캐시하여 반복 조회에 다시 요금이 부과되지 않도록 합니다. `utilityModel: \"\"`은 다른 모든 유틸리티 작업과 마찬가지로 제목을 비활성화하며, 제목은 기본 모델로 절대 대체되지 않습니다.
- `controlUi.chatMessageMaxWidth`: 중앙에 배치된 Control UI 채팅 기록의 선택적 최대 너비입니다. `960px`, `82%`, `min(1280px, 82%)`, `calc(100% - 2rem)`과 같이 제한된 CSS 너비 값을 허용합니다.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 의도적으로 Host 헤더 출처 정책에 의존하는 배포에서 Host 헤더 출처 대체를 활성화하는 위험한 모드입니다.
- `terminal.enabled`: 관리자 범위의 운영자 터미널을 사용하도록 옵트인합니다. 기본값: `false`. 터미널은 선택한 에이전트 작업 공간에서 호스트 PTY를 시작하고 Gateway 프로세스 환경을 상속하며, `sandbox.mode: "all"`인 에이전트에서는 거부됩니다. 신뢰할 수 있는 운영자 배포에서만 활성화하십시오. 이 값을 변경하면 Gateway가 다시 시작되고 Control UI 콘텐츠 보안 정책이 업데이트됩니다.
- `terminal.shell`: 선택적인 셸 실행 파일입니다. 설정하지 않으면 OpenClaw는 Unix에서 `$SHELL`, Windows에서 `%ComSpec%`을 사용합니다.
- `terminal.detachedSessionTimeoutSeconds`: 터미널 세션의 연결이 끊어진 후(페이지 새로고침, 노트북 절전) 최근 출력을 재생하는 `terminal.attach`를 통해 다시 연결할 수 있는 상태로 세션이 유지되는 시간입니다. 기본값: `300`. 연결이 끊기는 즉시 세션을 종료하려면 `0`으로 설정하십시오. 분리된 세션은 명령을 계속 실행하므로 공유되거나 노출된 호스트에서는 이 시간을 줄이십시오.
- `remote.transport`: `ssh`(기본값) 또는 `direct`(ws/wss)입니다. `direct`의 경우 공개 호스트에서는 `remote.url`이 `wss://`여야 합니다. 평문 `ws://`는 루프백, LAN, 링크 로컬, `.local`, `.ts.net` 및 Tailscale CGNAT 호스트에서만 허용됩니다.
- `remote.remotePort`: 원격 SSH 호스트의 Gateway 포트입니다. 기본값은 `18789`입니다. 로컬 터널 포트가 원격 Gateway 포트와 다를 때 사용하십시오.
- `remote.sshHostKeyPolicy`: macOS SSH 터널 호스트 키 정책입니다. `strict`가 기본값이며 이미 신뢰된 키가 필요합니다. `openssh`는 관리되는 별칭에 유효한 OpenSSH 구성을 사용하기 위한 명시적인 옵트인입니다. 사용하기 전에 일치하는 사용자 및 시스템 SSH 설정을 검토하십시오. macOS 앱과 `configure-remote`는 대상을 변경할 때 다시 명시적으로 옵트인하지 않으면 이 정책을 `strict`로 재설정합니다.
- `gateway.remote.token` / `.password`는 원격 클라이언트 자격 증명 필드입니다. 그 자체로 Gateway 인증을 구성하지는 않습니다.
- `gateway.push.apns.relay.baseUrl`: 릴레이 기반 iOS 빌드가 등록 정보를 Gateway에 게시한 후 사용하는 외부 APNs 릴레이의 기본 HTTPS URL입니다. 공개 App Store 빌드는 호스팅되는 OpenClaw 릴레이를 사용합니다. 사용자 지정 릴레이 URL은 해당 릴레이를 가리키는 릴레이 URL을 가진 의도적으로 별도 구성된 iOS 빌드/배포 경로와 일치해야 합니다.
- `gateway.push.apns.relay.timeoutMs`: Gateway에서 릴레이로 전송할 때의 제한 시간(밀리초)입니다. 기본값은 `10000`입니다.
- 릴레이 기반 등록은 특정 Gateway ID에 위임됩니다. 페어링된 iOS 앱은 `gateway.identity.get`을 가져와 해당 ID를 릴레이 등록에 포함하고, 등록 범위의 전송 권한을 Gateway에 전달합니다. 다른 Gateway는 저장된 해당 등록을 재사용할 수 없습니다.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 위 릴레이 구성을 위한 임시 환경 변수 재정의입니다.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 루프백 HTTP 릴레이 URL을 위한 개발 전용 우회 수단입니다. 프로덕션 릴레이 URL은 HTTPS를 유지해야 합니다.
- `gateway.handshakeTimeoutMs`: 인증 전 Gateway WebSocket 핸드셰이크 제한 시간(밀리초)입니다. 기본값: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS`가 설정되면 우선합니다. 시작 준비가 아직 안정화되는 동안 로컬 클라이언트가 연결할 수 있는, 부하가 높거나 성능이 낮은 호스트에서는 이 값을 늘리십시오.
- `gateway.channelHealthCheckMinutes`: 채널 상태 모니터 간격(분)입니다. 상태 모니터에 의한 재시작을 전역으로 비활성화하려면 `0`으로 설정하십시오. 기본값: `5`.
- `gateway.channelStaleEventThresholdMinutes`: 오래된 소켓 임계값(분)입니다. 이 값을 `gateway.channelHealthCheckMinutes` 이상으로 유지하십시오. 기본값: `30`.
- `gateway.channelMaxRestartsPerHour`: 이동식 1시간 동안 채널/계정별 상태 모니터 재시작의 최대 횟수입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터는 활성화된 상태로 유지하면서 채널별로 상태 모니터 재시작을 옵트아웃합니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 다중 계정 채널의 계정별 재정의입니다. 설정하면 채널 수준 재정의보다 우선합니다.
- 로컬 Gateway 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체 수단으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었으나 확인되지 않으면 확인 과정이 실패 시 차단됩니다(원격 대체 수단으로 오류를 가리지 않음).
- `trustedProxies`: TLS를 종료하거나 전달된 클라이언트 헤더를 삽입하는 리버스 프록시 IP입니다. 사용자가 제어하는 프록시만 나열하십시오. 루프백 항목은 동일 호스트 프록시/로컬 감지 설정(예: Tailscale Serve 또는 로컬 리버스 프록시)에도 유효하지만, 루프백 요청이 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있게 하지는 **않습니다**.
- `allowRealIpFallback`: `true`이면 `X-Forwarded-For`가 없을 때 Gateway가 `X-Real-IP`를 허용합니다. 실패 시 차단 동작을 위해 기본값은 `false`입니다.
- `gateway.nodes.pairing.autoApproveCidrs`: 요청된 범위가 없는 최초 Node 기기 페어링을 자동 승인하기 위한 선택적인 CIDR/IP 허용 목록입니다. 설정하지 않으면 비활성화됩니다. 운영자/브라우저/Control UI/WebChat 페어링을 자동 승인하지 않으며, 역할, 범위, 메타데이터 또는 공개 키 업그레이드도 자동 승인하지 않습니다.
- `gateway.nodes.pairing.sshVerify`: 최초 Node 기기 페어링을 위한 SSH 검증 자동 승인입니다(기본값: 활성화). Gateway는 페어링 호스트에 SSH로 역접속하고(BatchMode, 엄격한 호스트 키) `openclaw node identity`의 기기 키가 정확히 일치하는 경우에만 승인합니다. 적격성 하한은 `autoApproveCidrs`와 동일하며, `cidrs`로 재정의하지 않는 한 프로브는 비공개/CGNAT 소스 주소로 제한됩니다. 비활성화하려면 `false`로 설정하고, 조정하려면 `{ user, identity, timeoutMs, cidrs }`를 설정하십시오. [Node 페어링](/ko/gateway/pairing#ssh-verified-device-auto-approval-default)을 참조하십시오.
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 페어링 및 플랫폼 허용 목록 평가 이후 선언된 Node 명령에 적용되는 전역 허용/거부 구성입니다. `allowCommands`를 사용하여 `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search`, `sms.send`와 같은 위험한 Node 명령을 명시적으로 허용하십시오. `denyCommands`는 플랫폼 기본값이나 명시적 허용에 의해 포함되는 명령도 제거합니다. iOS 건강 권한, Android SMS 권한, Gateway 명령 권한 부여는 서로 독립적입니다. Node가 선언된 명령 목록을 변경한 후에는 해당 기기 페어링을 거부한 다음 다시 승인하여 Gateway가 업데이트된 명령 스냅샷을 저장하도록 하십시오.
  - `gateway.tools.deny`: HTTP `POST /tools/invoke`에서 차단할 추가 도구 이름입니다(기본 거부 목록을 확장합니다).
  - `gateway.tools.allow`: 소유자/관리자 호출자에 대해 기본 HTTP 거부 목록에서 도구 이름을 제거합니다. 이 설정은 ID 정보를 포함하는 `operator.write` 호출자를 소유자/관리자 액세스 권한으로 승격하지 않습니다. `cron`, `gateway`, `nodes`는 허용 목록에 포함되어 있어도 소유자가 아닌 호출자에게 계속 제공되지 않습니다.

</Accordion>

### OpenAI 호환 엔드포인트

- 관리자 HTTP RPC: `admin-http-rpc` Plugin으로 기본적으로 비활성화되어 있습니다. Plugin을 활성화하면 `POST /api/v1/admin/rpc`가 등록됩니다. [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 참조하십시오.
- Chat Completions: 기본적으로 비활성화되어 있습니다. `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화하십시오.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL 입력 보안 강화:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    빈 허용 목록은 설정되지 않은 것으로 처리됩니다. URL 가져오기를 비활성화하려면 `gateway.http.endpoints.responses.files.allowUrl=false`
    및/또는 `gateway.http.endpoints.responses.images.allowUrl=false`를 사용하십시오.
- 선택적 응답 보안 강화 헤더:
  - `gateway.http.securityHeaders.strictTransportSecurity` (직접 제어하는 HTTPS 오리진에만 설정하십시오. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts)을 참조하십시오.)

### 다중 인스턴스 격리

고유한 포트와 상태 디렉터리를 사용하여 하나의 호스트에서 여러 Gateway를 실행하십시오.

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

편의 플래그: `--dev`(`~/.openclaw-dev` + 포트 `19001` 사용), `--profile <name>`(`~/.openclaw-<name>` 사용).

[여러 Gateway](/ko/gateway/multiple-gateways)를 참조하십시오.

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: Gateway 리스너에서 TLS 종료(HTTPS/WSS)를 활성화합니다(기본값: `false`).
- `autoGenerate`: 명시적 파일이 구성되지 않은 경우 로컬 자체 서명 인증서/키 쌍을 자동 생성합니다. 로컬/개발 용도로만 사용하십시오.
- `certPath`: TLS 인증서 파일의 파일 시스템 경로입니다.
- `keyPath`: TLS 개인 키 파일의 파일 시스템 경로입니다. 권한을 제한된 상태로 유지하십시오.
- `caPath`: 클라이언트 검증 또는 사용자 지정 신뢰 체인을 위한 선택적 CA 번들 경로입니다.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: 런타임에 구성 편집 사항이 적용되는 방식을 제어합니다.
  - `"off"`: 실시간 편집을 무시합니다. 변경 사항을 적용하려면 명시적으로 다시 시작해야 합니다.
  - `"restart"`: 구성이 변경될 때마다 항상 Gateway 프로세스를 다시 시작합니다.
  - `"hot"`: 다시 시작하지 않고 프로세스 내에서 변경 사항을 적용합니다.
  - `"hybrid"`(기본값): 먼저 핫 리로드를 시도하고, 필요한 경우 다시 시작으로 대체합니다.
- `debounceMs`: 구성 변경 사항이 적용되기 전의 디바운스 시간(밀리초)입니다(0 이상의 정수, 기본값: `300`).
- `deferralTimeoutMs`: 진행 중인 작업이 완료되기를 기다린 후 강제로 다시 시작하거나 채널 핫 리로드를 수행할 때까지의 선택적 최대 시간(밀리초)입니다. 기본 제한 대기 시간(`300000`)을 사용하려면 생략하십시오. 무기한 대기하면서 아직 보류 중이라는 경고를 주기적으로 기록하려면 `0`으로 설정하십시오.

---

## 클라우드 워커 환경

클라우드 워커는 옵트인 방식입니다. `cloudWorkers`가 없거나 `profiles`가 비어 있으면 OpenClaw는 새 워커 생성을 허용하지 않습니다. 이전에 생성된 영구 레코드는 계속 조정되며 표시 상태를 유지합니다. 기존 Gateway/Node 프로젝션은 변경되지 않습니다.

모든 워커 제공자는 신뢰할 수 있는 프로비저닝 출력에서 SSH `hostKey`를 호스트 이름이나 설명 없이 정확히 `algorithm base64` 형식으로 반환해야 합니다. 부트스트랩은 해당 키를 격리된 `known_hosts` 파일에 기록하고 `StrictHostKeyChecking=yes`를 사용하며, 제공자가 키를 누락하면 연결을 열기 전에 실패합니다. 최초 사용 시 신뢰하는 대체 동작은 없습니다.

터널 설정은 프로비저닝 과정의 일부가 아니라 필요할 때 수행됩니다. 시작되면 Gateway는 워커 로컬 Unix 소켓을 해당 루프백 WebSocket 엔드포인트로 역방향 포워딩합니다. 소켓은 무작위로 할당된 소유자 전용 원격 디렉터리에 위치합니다. 루프백 TCP 포트와 달리 다중 사용자 워커의 다른 계정에서 접근할 수 없으며 다른 환경의 포트와 충돌할 수도 없습니다. SSH 연결 유지와 상한이 적용된 재연결 백오프는 터널 소유자가 현재 소유자로 유지되는 동안에만 실행됩니다. 터널을 중지하면 SSH 프로세스를 닫기 전에 재연결을 차단합니다.

제어 트래픽과 작업 공간 전송은 별도의 SSH 연결을 사용합니다. 두 연결 모두 동일하게 확인된 ID와 격리되어 고정된 `known_hosts` 파일을 재사용하지만, 작업 공간 전송은 장기 실행 터널과 SSH 연결 다중화를 공유하지 않으므로 rsync가 제어 트래픽을 차단할 수 없습니다.

### Crabbox 프로필

번들 `crabbox` 제공자는 로컬 Crabbox CLI를 통해 SSH를 지원하는 리스를 프로비저닝합니다. 내부 `settings.provider`는 Crabbox 백엔드를 선택하며 외부 OpenClaw 제공자 ID와는 별개입니다.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Default; use "npm" only for a released gateway version.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Optional absolute path. Default: sibling ../crabbox/bin/crabbox, then PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider`(필수): `--provider`를 통해 전달되는 Crabbox 백엔드입니다. 검사 출력에 SSH 엔드포인트가 포함되는 백엔드를 사용하십시오. `aws`는 직접 AWS 백엔드를 선택합니다.
- `settings.class`(필수): `--class`에 전달되는 Crabbox 머신 클래스입니다.
- `settings.ttl` 및 `settings.idleTimeout`(필수): `--ttl` 및 `--idle-timeout`에 전달되는 양수 Go 기간 문자열입니다. 이러한 제공자 측 안전장치는 아래의 OpenClaw 저장 `lifetime` 정책과 별개입니다.
- `settings.binary`: 선택적 Crabbox 실행 파일 절대 경로입니다. 지정하지 않으면 OpenClaw는 형제 Crabbox 체크아웃, `PATH`의 실행 가능 항목 순으로 확인하고, 마지막으로 `crabbox`를 호출하여 CLI 누락이 표시 가능한 제공자 오류로 유지되도록 합니다.

알 수 없는 설정은 거부됩니다. Crabbox 자격 증명과 백엔드별 계정 구성은 계속 Crabbox가 소유하므로 `settings`에 넣지 마십시오. OpenClaw는 로컬 CLI만 호출하며 이 Plugin에서 제공자 네트워크 호출을 수행하지 않습니다. 프로비저닝 시 항상 `--keep=true`를 전달합니다. OpenClaw가 외부 수명 주기를 소유하며 `crabbox stop`으로 리스를 폐기합니다.

<Warning>
  OpenClaw는 제공자 소유 보안 비밀 확인자를 통해 Crabbox의 리스 로컬 `sshKey` 경로를 확인합니다. 현재 `crabbox inspect --json` 출력은 프로비저닝된 `sshHostKey`를 노출하지 않으므로 Crabbox 기반 워커는 부트스트랩 또는 터널 설정 전에 계속 실패 폐쇄됩니다. Crabbox는 신뢰할 수 있는 리스별 호스트 키를 프로비저닝하고 호스트 이름이나 설명 없이 정확히 `algorithm base64` 형식으로 `sshHostKey`를 반환해야 합니다. 현재의 리스 로컬 `known_hosts` 캐시는 프로비저닝 신뢰 자료가 아닙니다.
</Warning>

### 정적 SSH 개발 프로필

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: 공백을 제거한 비어 있지 않은 ID를 사용하는 명명된 워커 프로필입니다. 각 프로필은 Plugin이 등록한 제공자를 선택합니다.
- `provider`: 비어 있지 않은 워커 제공자 ID입니다. 예제에서는 번들 `crabbox` 제공자와 QA Lab `static-ssh` 제공자를 사용합니다.
- `install`: 워커 설치 방식입니다. `"bundle"`(기본값)은 Gateway에 설치된 빌드의 콘텐츠 해시 번들을 전송하며 릴리스, 개발 및 미릴리스 버전을 지원합니다. `"npm"`은 수정되지 않은 패키지 릴리스를 위한 옵트인 최적화입니다. 공개 npm 레지스트리에서 `openclaw@<exact gateway version>`을 설치하며 `latest`는 절대 설치하지 않습니다.
- 번들 제공자 Plugin은 구성 시 자동으로 선택되지만 명시적 비활성화와 `plugins.allow`는 여전히 적용됩니다. 허용 목록이 구성된 경우 제공자 ID(예: `crabbox`)를 포함하십시오. 외부 제공자 Plugin도 설치하고 명시적으로 활성화해야 합니다.
- `settings`: 제공자가 소유하는 제한된 JSON입니다. 선택한 Plugin이 키를 정의하고 검증합니다. 보안 비밀을 포함하는 값에는 [SecretRef 객체](/ko/gateway/secrets)를 사용하십시오. 정적 SSH 제공자에는 `host`, `user`, `hostKey`, `keyRef`가 필요하며 `port`의 기본값은 `22`입니다. `hostKey`는 알려진 호스트 또는 다른 신뢰할 수 있는 채널에서 얻은 하나의 OpenSSH 공개 호스트 키 줄(`algorithm base64`)이어야 하며 옵션 접두사가 없어야 합니다.
- `lifetime.idleTimeoutMinutes`: 이후 유휴 회수 정책을 위해 저장되는 양의 정수(분)입니다.
- `lifetime.maxLifetimeMinutes`: 이후 수명 주기 정책을 위해 저장되는 양의 정수(분)입니다.

지원되는 Node 런타임(22.19+, 23.11+ 또는 24+)이 워커에 이미 설치되어 있어야 합니다. 옵트인 `"npm"` 방식에는 `npm`과 공개 npm 레지스트리에 대한 아웃바운드 HTTPS 접근도 필요합니다. 네트워크를 사용하는 도구 체인 설정은 제공자 정책입니다. 부트스트랩은 도구 체인을 직접 설치하는 대신 조치 가능한 오류를 보고합니다.

이 기반 기능은 Gateway 빌드를 설치하고 검증하며 터널 시작/중지 수명 주기를 제공하지만, 일반 OpenClaw CLI는 실행하지 않습니다. 자체 완결형 워커 진입점과 루프는 다음 클라우드 워커 마일스톤에 포함됩니다.

각 영구 환경 레코드는 검증된 제공자 설정, 확인된 설치 방식 및 수명 정책을 생성 시점의 프로필 스냅샷에 보존합니다. 명명된 프로필을 변경하거나 제거하면 새 생성에 영향을 줍니다. 기존 레코드는 소유 Plugin을 계속 사용할 수 있는 한 해당 스냅샷을 사용하여 수명 주기 조정을 계속합니다.

첫 번째 클라우드 워커 릴리스에서 수명 값은 데이터일 뿐이며, 자동 적용은 이후 수명 주기 작업에 포함됩니다. 프로필 변경 사항을 적용하려면 Gateway를 다시 시작해야 합니다.

<Warning>
  `static-ssh` 제공자는 소스 트리 QA Lab 개발 하네스이며 패키지 배포판에서 제외됩니다. 공유 호스트에서 실행되는 워커는 관련 없는 호스트 데이터를 읽을 수 있으므로 이 제공자를 프로덕션 격리 경계로 사용하지 마십시오.
  운영자는 예상되는 `hostKey`를 제공해야 합니다. OpenClaw는 최초 연결에서 키를 학습하거나 수락하지 않습니다.
  리스를 폐기해도 OpenClaw의 논리적 레코드만 해제되며 호스트를 중지하거나 정리하지 않습니다.
</Warning>

---

## 훅

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

인증: `Authorization: Bearer <token>` 또는 `x-openclaw-token: <token>`.
쿼리 문자열 훅 토큰은 거부됩니다.

검증 및 안전 참고 사항:

- `hooks.enabled=true`에는 비어 있지 않은 `hooks.token`이 필요합니다.
- `hooks.token`은 활성 Gateway 공유 비밀 인증(`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)과 달라야 합니다. 재사용이 감지되면 시작 시 치명적이지 않은 보안 경고가 기록됩니다.
- `openclaw security audit`은 훅/Gateway 인증 재사용을 심각한 문제로 표시하며, 감사 시점에만 제공된 Gateway 비밀번호 인증(`--auth password --password <password>`)도 포함합니다. `openclaw doctor --fix`를 실행하여 영구 저장된 재사용 `hooks.token`을 교체한 다음, 외부 훅 발신자가 새 훅 토큰을 사용하도록 업데이트하십시오.
- `hooks.path`는 `/`일 수 없습니다. `/hooks`와 같은 전용 하위 경로를 사용하십시오.
- `hooks.allowRequestSessionKey=true`인 경우 `hooks.allowedSessionKeyPrefixes`를 제한하십시오(예: `["hook:"]`).
- 매핑 또는 프리셋이 템플릿화된 `sessionKey`를 사용하는 경우 `hooks.allowedSessionKeyPrefixes`와 `hooks.allowRequestSessionKey=true`를 설정하십시오. 정적 매핑 키에는 이러한 명시적 허용이 필요하지 않습니다.

**엔드포인트:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 요청 페이로드의 `sessionKey`는 `hooks.allowRequestSessionKey=true`인 경우에만 허용됩니다(기본값: `false`).
- `POST /hooks/<name>` → `hooks.mappings`를 통해 확인됩니다.
  - 템플릿으로 렌더링된 매핑의 `sessionKey` 값은 외부에서 제공된 것으로 취급되며 `hooks.allowRequestSessionKey=true`도 필요합니다.

<Accordion title="매핑 세부 정보">

- `match.path`는 `/hooks` 뒤의 하위 경로와 일치합니다(예: `/hooks/gmail` → `gmail`).
- `match.source`는 일반 경로의 페이로드 필드와 일치합니다.
- `{{messages[0].subject}}`와 같은 템플릿은 페이로드에서 값을 읽습니다.
- `transform`은 훅 작업을 반환하는 JS/TS 모듈을 가리킬 수 있습니다.
  - `transform.module`은 상대 경로여야 하며 `hooks.transformsDir` 내부에 있어야 합니다(절대 경로와 경로 순회는 거부됩니다).
  - `hooks.transformsDir`은 `~/.openclaw/hooks/transforms` 아래에 두십시오. 워크스페이스 스킬 디렉터리는 거부됩니다. `openclaw doctor`가 이 경로를 유효하지 않다고 보고하면 변환 모듈을 훅 변환 디렉터리로 옮기거나 `hooks.transformsDir`을 제거하십시오.
- `agentId`는 특정 에이전트로 라우팅합니다. 알 수 없는 ID는 기본 에이전트로 대체됩니다.
- `allowedAgentIds`: `agentId`가 생략된 경우의 기본 에이전트 경로를 포함하여 실질적인 에이전트 라우팅을 제한합니다(`*` 또는 생략 = 모두 허용, `[]` = 모두 거부).
- `defaultSessionKey`: 명시적인 `sessionKey` 없이 실행되는 훅 에이전트를 위한 선택적 고정 세션 키입니다.
- `allowRequestSessionKey`: `/hooks/agent` 호출자와 템플릿 기반 매핑 세션 키가 `sessionKey`를 설정하도록 허용합니다(기본값: `false`).
- `allowedSessionKeyPrefixes`: 명시적 `sessionKey` 값(요청 + 매핑)을 위한 선택적 접두사 허용 목록입니다(예: `["hook:"]`). 매핑 또는 프리셋에서 템플릿화된 `sessionKey`를 사용하는 경우 필수입니다.
- `deliver: true`는 최종 응답을 채널로 전송합니다. `channel`의 기본값은 `last`입니다.
- `model`은 이 훅 실행의 LLM을 재정의합니다(모델 카탈로그가 설정된 경우 허용된 모델이어야 함).

</Accordion>

### Gmail 통합

- 기본 제공 Gmail 프리셋은 `sessionKey: "hook:gmail:{{messages[0].id}}"`를 사용합니다.
- 메시지별 라우팅을 유지하려면 `hooks.allowRequestSessionKey: true`를 설정하고 `hooks.allowedSessionKeyPrefixes`를 Gmail 네임스페이스와 일치하도록 제한하십시오(예: `["hook:", "hook:gmail:"]`).
- `hooks.allowRequestSessionKey: false`가 필요하면 템플릿화된 기본값 대신 정적 `sessionKey`로 프리셋을 재정의하십시오.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 구성된 경우 Gateway는 부팅 시 `gog gmail watch serve`를 자동으로 시작합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하십시오.
- Gateway와 함께 별도의 `gog gmail watch serve`를 실행하지 마십시오.

---

## Canvas plugin 호스트

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // 또는 OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 에이전트가 편집할 수 있는 HTML/CSS/JS 및 A2UI를 Gateway 포트 아래의 HTTP를 통해 제공합니다.
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 로컬 전용: `gateway.bind: "loopback"`을 유지하십시오(기본값).
- 루프백이 아닌 바인딩: Canvas 경로에는 다른 Gateway HTTP 표면과 마찬가지로 Gateway 인증(토큰/비밀번호/신뢰할 수 있는 프록시)이 필요합니다.
- Node WebView는 일반적으로 인증 헤더를 전송하지 않습니다. Node가 페어링되고 연결되면 Gateway가 Canvas/A2UI 액세스를 위한 Node 범위 기능 URL을 알립니다.
- 기능 URL은 활성 Node WS 세션에 바인딩되며 빠르게 만료됩니다. IP 기반 대체 경로는 사용되지 않습니다.
- 제공되는 HTML에 라이브 다시 로드 클라이언트를 삽입합니다.
- 비어 있는 경우 시작용 `index.html`을 자동으로 생성합니다.
- `/__openclaw__/a2ui/`에서도 A2UI를 제공합니다.
- 변경 사항을 적용하려면 Gateway를 다시 시작해야 합니다.
- 큰 디렉터리 또는 `EMFILE` 오류가 발생하는 경우 라이브 다시 로드를 비활성화하십시오.

---

## 검색

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`(기본값): TXT 레코드에서 `cliPath` + `sshPort`를 생략합니다.
- `full`: `cliPath` + `sshPort`를 포함합니다. LAN 멀티캐스트 광고를 사용하려면 번들 `bonjour` plugin이 여전히 활성화되어 있어야 합니다.
- `off`: plugin 활성화 상태를 변경하지 않고 LAN 멀티캐스트 광고를 억제합니다.
- 번들 `bonjour` plugin은 macOS 호스트에서 자동으로 시작되며 Linux, Windows 및 컨테이너화된 Gateway 배포에서는 명시적으로 활성화해야 합니다.
- 호스트 이름이 유효한 DNS 레이블인 경우 기본값은 시스템 호스트 이름이며, 그렇지 않으면 `openclaw`로 대체됩니다. `OPENCLAW_MDNS_HOSTNAME`으로 재정의할 수 있습니다.
- `OPENCLAW_DISABLE_BONJOUR=1`은 `discovery.mdns.mode`를 재정의하여 mDNS 광고를 완전히 비활성화합니다.

### 광역(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 아래에 유니캐스트 DNS-SD 영역을 작성합니다. 네트워크 간 검색을 위해 DNS 서버(CoreDNS 권장) + Tailscale 분할 DNS와 함께 사용하십시오.

설정: `openclaw dns setup --apply`.

---

## 환경

### `env`(인라인 환경 변수)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 인라인 환경 변수는 프로세스 환경에 해당 키가 없는 경우에만 적용됩니다.
- `.env` 파일: CWD의 `.env` + `~/.openclaw/.env`(둘 다 기존 변수를 재정의하지 않음).
- `shellEnv`: 로그인 셸 프로필에서 누락된 예상 키를 가져옵니다.
- 전체 우선순위는 [환경](/ko/help/environment)을 참조하십시오.

### 환경 변수 치환

`${VAR_NAME}`을 사용하여 모든 구성 문자열에서 환경 변수를 참조하십시오.

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 대문자 이름만 일치합니다: `[A-Z_][A-Z0-9_]*`.
- 누락되거나 빈 변수는 구성을 불러올 때 오류를 발생시킵니다.
- 리터럴 `${VAR}`에는 `$${VAR}`로 이스케이프하십시오.
- `$include`와 함께 작동합니다.

---

## 비밀 정보

비밀 참조는 추가 방식입니다. 일반 텍스트 값도 계속 작동합니다.

### `SecretRef`

다음 객체 형태 중 하나를 사용하십시오.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

검증:

- `provider` 패턴: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` ID 패턴: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ID: 절대 JSON 포인터(예: `"/providers/openai/apiKey"`)
- `source: "exec"` ID 패턴: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`(AWS 스타일 `secret#json_key` 선택자 지원)
- `source: "exec"` ID에는 슬래시로 구분된 `.` 또는 `..` 경로 세그먼트가 포함될 수 없습니다(예: `a/../b`는 거부됨).

### 지원되는 자격 증명 표면

- 표준 매트릭스: [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- `secrets apply`는 지원되는 `openclaw.json` 자격 증명 경로를 대상으로 합니다.
- `auth-profiles.json` 참조는 런타임 확인 및 감사 범위에 포함됩니다.

### 비밀 정보 공급자 구성

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 선택적 명시적 환경 공급자
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

참고:

- `file` 공급자는 `mode: "json"` 및 `mode: "singleValue"`를 지원합니다(singleValue 모드에서는 `id`가 `"value"`여야 함).
- Windows ACL 검증을 사용할 수 없는 경우 파일 및 실행 공급자 경로는 실패 시 닫힘 방식으로 동작합니다. 검증할 수 없는 신뢰할 수 있는 경로에만 `allowInsecurePath: true`를 설정하십시오.
- `exec` 공급자는 절대 `command` 경로가 필요하며 stdin/stdout에서 프로토콜 페이로드를 사용합니다.
- 기본적으로 심볼릭 링크 명령 경로는 거부됩니다. 확인된 대상 경로를 검증하면서 심볼릭 링크 경로를 허용하려면 `allowSymlinkCommand: true`를 설정하십시오.
- `trustedDirs`가 구성된 경우 신뢰할 수 있는 디렉터리 검사는 확인된 대상 경로에 적용됩니다.
- `exec` 자식 환경은 기본적으로 최소화되어 있습니다. 필요한 변수는 `passEnv`로 명시적으로 전달하십시오.
- 비밀 참조는 활성화 시 메모리 내 스냅샷으로 확인되며, 이후 요청 경로는 해당 스냅샷만 읽습니다.
- 활성화 중 활성 표면 필터링이 적용됩니다. 활성화된 표면의 확인되지 않은 참조는 시작/다시 불러오기를 실패시키며, 비활성 표면은 진단 정보와 함께 건너뜁니다.

---

## 인증 저장소

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- 에이전트별 프로필은 `<agentDir>/auth-profiles.json`에 저장됩니다.
- `auth-profiles.json`은 정적 자격 증명 모드에 대해 값 수준 참조(`api_key`의 `keyRef`, `token`의 `tokenRef`)를 지원합니다.
- `{ "provider": { "apiKey": "..." } }`와 같은 레거시 평면형 `auth-profiles.json` 맵은 런타임 형식이 아닙니다. `openclaw doctor --fix`는 `.legacy-flat.*.bak` 백업을 생성하고 이를 표준 `provider:default` API 키 프로필로 다시 작성합니다.
- OAuth 모드 프로필(`auth.profiles.<id>.mode = "oauth"`)은 SecretRef 기반 인증 프로필 자격 증명을 지원하지 않습니다.
- 정적 런타임 자격 증명은 메모리 내에서 확인된 스냅샷에서 가져옵니다. 레거시 정적 `auth.json` 항목은 발견 시 제거됩니다.
- 레거시 OAuth 가져오기는 `~/.openclaw/credentials/oauth.json`에서 수행됩니다.
- [OAuth](/ko/concepts/oauth)를 참조하십시오.
- 비밀 정보 런타임 동작 및 `audit/configure/apply` 도구: [비밀 정보 관리](/ko/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: 프로필이 실제 결제/크레딧 부족 오류로 실패할 때 적용하는 기본 백오프 시간(단위: 시간, 기본값: `5`)입니다. 명시적인 결제 관련 텍스트는 `401`/`403` 응답에서도 여기에 해당할 수 있지만, 제공자별 텍스트 매처는 해당 매처를 소유한 제공자 범위로 제한됩니다(예: OpenRouter `Key limit exceeded`). 재시도 가능한 HTTP `402` 사용량 기간 또는 조직/워크스페이스 지출 한도 메시지는 대신 `rate_limit` 경로에 유지됩니다.
- `billingBackoffHoursByProvider`: 제공자별 결제 백오프 시간을 재정의하는 선택적 설정입니다.
- `billingMaxHours`: 결제 백오프의 지수 증가 상한(단위: 시간, 기본값: `24`)입니다.
- `authPermanentBackoffMinutes`: 신뢰도가 높은 `auth_permanent` 실패에 적용하는 기본 백오프 시간(단위: 분, 기본값: `10`)입니다.
- `authPermanentMaxMinutes`: `auth_permanent` 백오프 증가 상한(단위: 분, 기본값: `60`)입니다.
- `failureWindowHours`: 백오프 카운터에 사용하는 이동 시간 범위(단위: 시간, 기본값: `24`)입니다.
- `overloadedProfileRotations`: 과부하 오류 발생 시 모델 폴백으로 전환하기 전에 허용하는 동일 제공자 인증 프로필 순환의 최대 횟수(기본값: `1`)입니다. `ModelNotReadyException`과 같은 제공자 사용량 폭주 형태가 여기에 해당합니다.
- `overloadedBackoffMs`: 과부하 상태인 제공자/프로필 순환을 재시도하기 전에 적용하는 고정 지연 시간(기본값: `0`)입니다.
- `rateLimitedProfileRotations`: 사용량 제한 오류 발생 시 모델 폴백으로 전환하기 전에 허용하는 동일 제공자 인증 프로필 순환의 최대 횟수(기본값: `1`)입니다. 이 사용량 제한 버킷에는 `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `resource exhausted`와 같은 제공자 형식의 텍스트가 포함됩니다.

---

## 감사

```json5
{
  audit: {
    enabled: true,
    messages: "off", // 끄기 | 직접 대화 | 전체
  },
}
```

Gateway는 에이전트 실행 및 도구 작업에 대한 **메타데이터 전용** 감사 이벤트를 공유 상태 데이터베이스에 기록합니다. 메시지 수명 주기 메타데이터는 별도로 명시적으로 활성화해야 합니다. 원장에는 신원, 타이밍, 도구 이름, 정규화된 결과가 저장되지만 프롬프트, 메시지 본문, 도구 인수, 결과 또는 원시 오류 텍스트는 절대 저장되지 않습니다. 메시지 행에는 원시 플랫폼 계정, 대화, 메시지 및 대상 ID가 저장되지 않습니다. 실행/도구 세션 키는 상관관계를 분석하는 데 계속 사용할 수 있으며, 키 자체에 플랫폼 계정 또는 피어 ID가 포함될 수 있습니다. 레코드는 30일 후 만료되며 원장은 최대 100,000개 행으로 제한됩니다. [`openclaw audit`](/ko/cli/audit) 또는 [`audit.activity.list`](/ko/gateway/protocol#audit-ledger-rpc) Gateway RPC를 사용하여 조회하십시오. 전체 데이터 모델, 개인정보 보호 의미 체계, 적용 범위 제한은 [감사 기록](/ko/gateway/audit)을 참조하십시오.

- `enabled`: 새 감사 이벤트를 기록합니다(기본값: `true`). 사고 발생 후에만 활성화된 감사 추적은 해당 사고를 설명할 수 없으므로 원장은 기본적으로 활성화됩니다. `false`로 설정하면 Gateway가 다시 시작된 후 새 이벤트 삽입이 중지되며, 기존 레코드는 만료될 때까지 계속 읽을 수 있습니다. 다시 활성화하면 해당 시점부터 기록이 재개되며, 공백 기간은 소급하여 채워지지 않습니다.
- `messages`: 메시지 메타데이터 범위입니다(기본값: `"off"`). `"direct"`는 확인된 직접 대화만 기록합니다. `"all"`은 그룹, 채널 및 알 수 없는 대화 유형도 기록합니다. 두 모드 모두 콘텐츠를 저장하지 않으며, 상관관계 분석이 가능한 경우 원시 식별자를 설치 로컬 키 기반 가명으로 대체합니다. 이는 익명화가 아닌 상관관계 분석 보조 수단입니다. 상태 데이터베이스에는 파생 키가 저장되지만 RPC 및 CLI 내보내기에는 포함되지 않습니다.

실행 중인 Gateway는 시작 시 `audit.enabled`와 `audit.messages`를 캡처하므로, 두 설정 중 하나를 변경한 후에는 다시 시작하십시오. 현재 메시지 적용 범위에는 코어 디스패치에 도달한 수락된 인바운드 메시지와 공유 영구 전달에 도달한 원본 논리 아웃바운드 응답 페이로드별 단일 종료 행이 포함됩니다. 이러한 공유 경계를 우회하는 Plugin 로컬 경로 및 직접 전송 경로는 아직 포함되지 않습니다. 용량이 제한된 백그라운드 작성기는 최선형 방식이며 무손실 규정 준수 아카이브가 아닙니다.

---

## 로깅

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // 보기 좋게 | 간결하게 | json
    redactSensitive: "tools", // 끄기 | 도구
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 기본 로그 파일: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- 고정 경로를 사용하려면 `logging.file`을 설정하십시오.
- `--verbose`를 사용하면 `consoleLevel`이 `debug`로 올라갑니다.
- `maxFileBytes`: 순환하기 전 활성 로그 파일의 최대 크기(바이트)입니다(양의 정수, 기본값: `104857600` = 100 MB). OpenClaw는 활성 파일 옆에 번호가 지정된 아카이브를 최대 5개까지 유지합니다.
- `redactSensitive` / `redactPatterns`: 콘솔 출력, 파일 로그, OTLP 로그 레코드 및 영구 저장된 세션 트랜스크립트 텍스트에 적용하는 최선형 마스킹입니다. `redactSensitive: "off"`는 이 일반 로그/트랜스크립트 정책만 비활성화합니다. UI/도구/진단 안전 영역에서는 내보내기 전에 계속 비밀을 삭제합니다.

---

## 진단

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 계측 출력의 마스터 토글입니다(기본값: `true`).
- `flags`: 대상 로그 출력을 활성화하는 플래그 문자열 배열입니다(`"telegram.*"` 또는 `"*"` 같은 와일드카드 지원).
- `stuckSessionWarnMs`: 장시간 실행되는 처리 세션을 `session.long_running`, `session.stalled` 또는 `session.stuck`으로 분류하기 위한 진행 없음 경과 시간 임계값(단위: ms, 기본값: `120000`)입니다. 응답, 도구, 상태, 블록 및 ACP 진행이 타이머를 초기화하며, 상태가 변경되지 않는 동안 반복되는 `session.stuck` 진단에는 백오프가 적용됩니다.
- `stuckSessionAbortMs`: 복구를 위해 중단 가능한 정체 상태의 활성 작업을 중단 및 배출하기 전 진행 없음 경과 시간 임계값(단위: ms)입니다. 설정하지 않으면 OpenClaw는 최소 5분 및 `stuckSessionWarnMs`의 3배인 더 안전하고 확장된 임베디드 실행 기간을 사용합니다.
- `memoryPressureSnapshot`: 메모리 압력이 `critical`에 도달하면 수정된 OOM 이전 안정성 스냅샷을 캡처합니다(기본값: `false`). 일반 메모리 압력 이벤트를 유지하면서 안정성 번들 파일 검색/쓰기를 추가하려면 `true`로 설정하십시오.
- `otel.enabled`: OpenTelemetry 내보내기 파이프라인을 활성화합니다(기본값: `false`). 전체 구성, 신호 카탈로그 및 개인정보 보호 모델은 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하십시오.
- `otel.endpoint`: OTel 내보내기에 사용할 수집기 URL입니다.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 선택적인 신호별 OTLP 엔드포인트입니다. 설정하면 해당 신호에 대해서만 `otel.endpoint`를 재정의합니다.
- `otel.protocol`: `"http/protobuf"`(기본값) 또는 `"grpc"`입니다.
- `otel.headers`: OTel 내보내기 요청과 함께 전송되는 추가 HTTP/gRPC 메타데이터 헤더입니다.
- `otel.serviceName`: 리소스 속성에 사용할 서비스 이름입니다.
- `otel.traces` / `otel.metrics` / `otel.logs`: 추적, 메트릭 또는 로그 내보내기를 활성화합니다.
- `otel.logsExporter`: 로그 내보내기 대상입니다. `"otlp"`(기본값), stdout의 각 줄에 JSON 객체 하나를 출력하는 `"stdout"` 또는 `"both"`를 사용할 수 있습니다.
- `otel.sampleRate`: 추적 샘플링 비율 `0`-`1`입니다.
- `otel.flushIntervalMs`: 주기적 텔레메트리 플러시 간격(단위: ms)입니다.
- `otel.captureContent`: OTEL 스팬 속성의 원시 콘텐츠 캡처를 명시적으로 활성화합니다. 기본적으로 비활성화되어 있습니다. 불리언 `true`는 시스템 외 메시지/도구 콘텐츠를 캡처하며, 객체 형식을 사용하면 `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, `toolDefinitions`를 명시적으로 활성화할 수 있습니다.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` 스팬 이름, `CLIENT` 스팬 종류 및 레거시 `gen_ai.system` 대신 `gen_ai.provider.name`을 포함하는 최신 실험적 GenAI 추론 스팬 형식의 환경 토글입니다. 기본적으로 호환성을 위해 스팬은 `openclaw.model.call`과 `gen_ai.system`을 유지하며, GenAI 메트릭은 제한된 의미 체계 속성을 사용합니다.
- `OPENCLAW_OTEL_PRELOADED=1`: 전역 OpenTelemetry SDK를 이미 등록한 호스트용 환경 토글입니다. 이 경우 OpenClaw는 진단 리스너를 활성 상태로 유지하면서 Plugin 소유 SDK의 시작/종료를 건너뜁니다.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 일치하는 구성 키가 설정되지 않은 경우 사용되는 신호별 엔드포인트 환경 변수입니다.
- `cacheTrace.enabled`: 임베디드 실행의 캐시 추적 스냅샷을 기록합니다(기본값: `false`).
- `cacheTrace.filePath`: 캐시 추적 JSONL의 출력 경로입니다(기본값: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 캐시 추적 출력에 포함할 항목을 제어합니다(모두 기본값: `true`).

---

## 업데이트

```json5
{
  update: {
    channel: "stable", // 안정 | 확장 안정 | 베타 | 개발
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: 릴리스 채널로 `"stable"`, `"extended-stable"`, `"beta"` 또는 `"dev"`를 사용할 수 있습니다. 확장 안정 버전은 패키지 전용입니다. 포그라운드 명령이 설치를 담당하며 Gateway는 읽기 전용 업데이트 알림을 표시할 수 있습니다.
- `checkOnStart`: Gateway 시작 시 npm 업데이트를 확인합니다(기본값: `true`). 저장된 확장 안정 선택 항목은 동일한 읽기 전용 알림과 24시간 알림 일정을 사용합니다.
- `auto.enabled`: 안정 및 베타 패키지 설치의 백그라운드 자동 업데이트를 활성화합니다(기본값: `false`). 확장 안정 버전은 자동으로 적용되지 않습니다.
- `auto.stableDelayHours`: 안정 채널 자동 적용 전 최소 지연 시간(단위: 시간, 기본값: `6`, 최댓값: `168`)입니다.
- `auto.stableJitterHours`: 추가 안정 채널 롤아웃 분산 기간(단위: 시간, 기본값: `12`, 최댓값: `168`)입니다.
- `auto.betaCheckIntervalHours`: 베타 채널 확인 실행 간격(단위: 시간, 기본값: `1`, 최댓값: `24`)입니다. 안정 채널의 지연/지터 및 베타 폴링 설정은 확장 안정 버전에 적용되지 않습니다.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // 실시간 | 최종만
      hiddenBoundarySeparator: "paragraph", // 없음 | 공백 | 줄 바꿈 | 문단
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: 전역 ACP 기능 게이트입니다(기본값: `true`; ACP 디스패치 및 생성 기능을 숨기려면 `false`로 설정하십시오).
- `dispatch.enabled`: ACP 세션 턴 디스패치를 위한 독립 게이트입니다(기본값: `true`). ACP 명령은 계속 사용할 수 있게 하면서 실행을 차단하려면 `false`로 설정하십시오.
- `backend`: 기본 ACP 런타임 백엔드 ID입니다(등록된 ACP 런타임 Plugin과 일치해야 합니다).
  먼저 백엔드 Plugin을 설치하고, `plugins.allow`가 설정되어 있다면 백엔드 Plugin ID(예: `acpx`)를 포함하십시오. 그렇지 않으면 ACP 백엔드가 로드되지 않습니다.
- `fallbacks`: 기본 백엔드가 출력을 생성하기 전에 일시적인 것으로 보이는 오류(사용 불가, 속도 제한, 할당량 소진 또는 과부하)로 조기에 실패할 때 시도할 대체 ACP 백엔드 ID의 순서 있는 목록입니다. 각 항목은 등록된 ACP 런타임 Plugin 백엔드와 일치해야 합니다.
- `defaultAgent`: 생성 시 명시적 대상을 지정하지 않은 경우 사용할 대체 ACP 대상 에이전트 ID입니다.
- `allowedAgents`: ACP 런타임 세션에 허용되는 에이전트 ID의 허용 목록입니다. 비어 있으면 추가 제한이 없습니다.
- `maxConcurrentSessions`: 동시에 활성화할 수 있는 ACP 세션의 최대 수입니다.
- `stream.coalesceIdleMs`: 스트리밍 텍스트의 유휴 플러시 대기 시간(ms)입니다.
- `stream.maxChunkChars`: 스트리밍 블록 프로젝션을 분할하기 전의 최대 청크 크기입니다.
- `stream.repeatSuppression`: 턴별로 반복되는 상태/도구 줄을 억제합니다(기본값: `true`).
- `stream.deliveryMode`: `"live"`는 증분 방식으로 스트리밍하고, `"final_only"`는 턴 종료 이벤트까지 버퍼링합니다.
- `stream.hiddenBoundarySeparator`: 숨겨진 도구 이벤트 뒤의 표시 텍스트 앞에 사용할 구분자입니다(기본값: `"paragraph"`).
- `stream.maxOutputChars`: ACP 턴마다 프로젝션되는 어시스턴트 출력의 최대 문자 수입니다.
- `stream.maxSessionUpdateChars`: 프로젝션되는 ACP 상태/업데이트 줄의 최대 문자 수입니다.
- `stream.tagVisibility`: 스트리밍 이벤트의 태그 이름별 불리언 표시 여부 재정의 레코드입니다.
- `runtime.ttlMinutes`: ACP 세션 워커가 정리 대상이 되기 전까지의 유휴 TTL(분)입니다.
- `runtime.installCommand`: ACP 런타임 환경을 부트스트랩할 때 실행할 선택적 설치 명령입니다.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`은 배너 태그라인 스타일을 제어합니다:
  - `"random"` (기본값): 재미있거나 계절에 맞는 태그라인이 번갈아 표시됩니다.
  - `"default"`: 고정된 중립적 태그라인(`All your chats, one OpenClaw.`).
  - `"off"`: 태그라인 텍스트 없음(배너 제목/버전은 계속 표시됨).
- 태그라인뿐만 아니라 배너 전체를 숨기려면 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하십시오.

---

## 마법사

CLI 안내형 설정 흐름(`onboard`, `configure`, `doctor`)에서 작성하는 메타데이터:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## ID 정보

[에이전트 기본값](/ko/gateway/config-agents#agent-defaults)에서 `agents.list` ID 필드를 참조하십시오.

---

## 브리지(레거시, 제거됨)

현재 빌드에는 더 이상 TCP 브리지가 포함되지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다. `bridge.*` 키는 더 이상 구성 스키마에 포함되지 않습니다(제거할 때까지 유효성 검사가 실패하며, `openclaw doctor --fix`로 알 수 없는 키를 삭제할 수 있습니다).

<Accordion title="레거시 브리지 구성(과거 참조용)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // 기본값; Cron 디스패치 + 격리된 Cron 에이전트 턴 실행
    webhook: "https://example.invalid/legacy", // 저장된 notify:true 작업을 위한 사용 중단된 폴백
    webhookToken: "replace-with-dedicated-token", // 아웃바운드 Webhook 인증을 위한 선택적 전달자 토큰
    sessionRetention: "24h", // 기간 문자열 또는 false
    runLog: {
      maxBytes: "2mb", // 기본값 2_000_000바이트
      keepLines: 2000, // 기본값 2000
    },
  },
}
```

- `sessionRetention`: 완료된 격리 Cron 실행 세션의 SQLite 세션 행을 정리하기 전까지 보관할 기간입니다. 보관 처리된 삭제 Cron 트랜스크립트의 정리도 제어합니다. 기본값: `24h`; 비활성화하려면 `false`로 설정하십시오.
- `runLog.maxBytes`: 이전 파일 기반 Cron 실행 로그와의 호환성을 위해 허용됩니다. 기본값: `2_000_000`바이트입니다.
- `runLog.keepLines`: 작업별로 보존되는 최신 SQLite 실행 기록 행 수입니다. 기본값: `2000`입니다.
- `webhookToken`: Cron Webhook POST 전송(`delivery.mode = "webhook"`)에 사용되는 전달자 토큰입니다. 생략하면 인증 헤더가 전송되지 않습니다.
- `webhook`: 아직 `notify: true`가 설정된 저장 작업을 마이그레이션하기 위해 `openclaw doctor --fix`가 사용하는 사용 중단된 레거시 폴백 Webhook URL(http/https)입니다. 런타임 전송에서는 작업별 `delivery.mode="webhook"` 및 `delivery.to`를 사용하며, 알림 전송을 유지할 때는 `delivery.completionDestination`을 사용합니다.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 일시적 오류 발생 시 cron 작업의 최대 재시도 횟수입니다(기본값: `3`, 범위: `0`-`10`).
- `backoffMs`: 각 재시도에 적용할 백오프 지연 시간(ms)의 배열입니다(기본값: `[30000, 60000, 300000]`, 항목 1-10개).
- `retryOn`: 재시도를 트리거하는 오류 유형입니다. `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`를 사용할 수 있습니다. 모든 일시적 오류 유형을 재시도하려면 생략하십시오.

일회성 작업은 재시도 횟수를 모두 소진할 때까지 활성화된 상태를 유지하며, 이후 최종 오류 상태를 보존한 채 비활성화됩니다. 반복 작업은 동일한 일시적 오류 재시도 정책을 사용하여 다음 예약 시간대 전에 백오프 후 다시 실행합니다. 영구적 오류가 발생하거나 일시적 오류 재시도를 모두 소진하면 오류 백오프가 적용된 일반 반복 일정으로 돌아갑니다.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron 작업의 실패 알림을 활성화합니다(기본값: `false`).
- `after`: 알림이 발생하기 전까지의 연속 실패 횟수입니다(양의 정수, 최솟값: `1`).
- `cooldownMs`: 동일한 작업에 반복 알림을 보내는 최소 간격(밀리초)입니다(음이 아닌 정수).
- `includeSkipped`: 연속으로 건너뛴 실행을 알림 임계값에 포함합니다(기본값: `false`). 건너뛴 실행은 별도로 추적되며 실행 오류 백오프에는 영향을 주지 않습니다.
- `mode`: 전달 모드입니다. `"announce"`는 채널 메시지로 전송하고, `"webhook"`은 구성된 Webhook으로 게시합니다.
- `accountId`: 알림 전달 범위를 지정하는 선택적 계정 또는 채널 ID입니다.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 모든 작업에 적용되는 cron 실패 알림의 기본 대상입니다.
- `mode`: `"announce"` 또는 `"webhook"`입니다. 대상 데이터가 충분하면 기본값은 `"announce"`입니다.
- `channel`: 공지 전달에 사용할 채널을 재정의합니다. `"last"`는 마지막으로 알려진 전달 채널을 재사용합니다.
- `to`: 명시적인 공지 대상 또는 Webhook URL입니다. Webhook 모드에서는 필수입니다.
- `accountId`: 전달에 사용할 선택적 계정 재정의입니다.
- 작업별 `delivery.failureDestination`은 이 전역 기본값보다 우선합니다.
- 전역 및 작업별 실패 대상이 모두 설정되지 않은 경우, 이미 `announce`로 전달하는 작업은 실패 시 해당 기본 공지 대상을 사용합니다.
- `delivery.failureDestination`은 작업의 기본 `delivery.mode`가 `"webhook"`인 경우를 제외하면 `sessionTarget="isolated"` 작업에서만 지원됩니다.

[Cron 작업](/ko/automation/cron-jobs)을 참조하십시오. 격리된 cron 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

---

## 미디어 모델 템플릿 변수

`tools.media.models[].args`에서 확장되는 템플릿 자리표시자입니다.

| 변수               | 설명                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 전체 수신 메시지 본문                             |
| `{{RawBody}}`      | 원시 본문(기록/발신자 래퍼 없음)                  |
| `{{BodyStripped}}` | 그룹 멘션이 제거된 본문                           |
| `{{From}}`         | 발신자 식별자                                     |
| `{{To}}`           | 대상 식별자                                       |
| `{{MessageSid}}`   | 채널 메시지 ID                                    |
| `{{SessionId}}`    | 현재 세션 UUID                                    |
| `{{IsNewSession}}` | 새 세션이 생성되었으면 `"true"`                   |
| `{{MediaUrl}}`     | 수신 미디어 의사 URL                              |
| `{{MediaPath}}`    | 로컬 미디어 경로                                  |
| `{{MediaType}}`    | 미디어 유형(이미지/오디오/문서/…)                 |
| `{{Transcript}}`   | 오디오 전사문                                     |
| `{{Prompt}}`       | CLI 항목에 대해 해석된 미디어 프롬프트            |
| `{{MaxChars}}`     | CLI 항목에 대해 해석된 최대 출력 문자 수          |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                         |
| `{{GroupSubject}}` | 그룹 제목(최선의 방식으로 제공)                   |
| `{{GroupMembers}}` | 그룹 구성원 미리 보기(최선의 방식으로 제공)       |
| `{{SenderName}}`   | 발신자 표시 이름(최선의 방식으로 제공)            |
| `{{SenderE164}}`   | 발신자 전화번호(최선의 방식으로 제공)             |
| `{{Provider}}`     | 제공자 힌트(whatsapp, telegram, discord 등)        |

---

## 구성 포함(`$include`)

구성을 여러 파일로 분할합니다.

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**병합 동작:**

- 단일 파일: 포함하는 객체를 대체합니다.
- 파일 배열: 순서대로 심층 병합합니다(뒤의 파일이 앞의 파일을 재정의함).
- 형제 키: 포함 처리가 끝난 후 병합합니다(포함된 값을 재정의함).
- 중첩 포함: 최대 10단계 깊이까지 지원합니다.
- 경로: 포함하는 파일을 기준으로 해석되지만 최상위 구성 디렉터리(`openclaw.json`의 `dirname`) 내부에 있어야 합니다. 절대 경로 및 `../` 형식은 해석된 결과가 이 경계 내부에 있는 경우에만 허용됩니다. 구성 디렉터리 외부의 추가 루트를 허용하려면 `OPENCLAW_INCLUDE_ROOTS`에 절대 경로를 설정하십시오.
- 제한: 경로에는 null 바이트가 포함될 수 없으며, 해석 전후 모두 4096자보다 엄격하게 짧아야 합니다. 포함되는 각 파일의 최대 크기는 2 MB입니다.
- 단일 파일 포함이 적용된 최상위 섹션 하나만 변경하는 OpenClaw 소유 쓰기 작업은 해당 포함 파일에 직접 기록합니다. 예를 들어 `plugins install`은 `plugins: { $include: "./plugins.json5" }`를 `plugins.json5`에서 업데이트하며 `openclaw.json`은 그대로 둡니다.
- 루트 포함, 포함 배열 및 형제 재정의가 있는 포함은 OpenClaw 소유 쓰기 작업에서 읽기 전용입니다. 이러한 쓰기 작업은 구성을 평탄화하는 대신 안전하게 실패합니다.
- 오류: 파일 누락, 구문 분석 오류, 순환 포함, 잘못된 경로 형식 및 과도한 길이에 대해 명확한 메시지를 제공합니다.

---

## 관련 항목

- [구성](/ko/gateway/configuration)
- [구성 예시](/ko/gateway/configuration-examples)
- [Doctor](/ko/gateway/doctor)
