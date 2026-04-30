---
read_when:
    - '`tools.*` 정책, 허용 목록 또는 실험적 기능 구성하기'
    - 사용자 지정 제공자 등록 또는 기본 URL 재정의
    - OpenAI 호환 셀프 호스팅 엔드포인트 설정하기
sidebarTitle: Tools and custom providers
summary: 도구 구성(정책, 실험적 토글, 제공자 기반 도구) 및 사용자 지정 제공자/기본 URL 설정
title: 구성 — 도구 및 사용자 지정 제공자
x-i18n:
    generated_at: "2026-04-30T06:29:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 구성 키 및 사용자 지정 프로바이더 / 기본 URL 설정. 에이전트, 채널 및 기타 최상위 구성 키는 [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## 도구

### 도구 프로필

`tools.profile`은 `tools.allow`/`tools.deny` 전에 기본 허용 목록을 설정합니다.

<Note>
로컬 온보딩은 설정되지 않은 새 로컬 구성의 기본값을 `tools.profile: "coding"`으로 지정합니다(기존의 명시적 프로필은 유지됨).
</Note>

| 프로필      | 포함 항목                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 제한 없음(설정하지 않은 것과 동일)                                                                                                  |

### 도구 그룹

| 그룹               | 도구                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`(`bash`는 `exec`의 별칭으로 허용됨)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | 모든 기본 제공 도구(프로바이더 Plugin 제외)                                                                          |

### `tools.allow` / `tools.deny`

전역 도구 허용/거부 정책입니다(거부가 우선). 대소문자를 구분하지 않으며 `*` 와일드카드를 지원합니다. Docker 샌드박스가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

특정 프로바이더 또는 모델의 도구를 추가로 제한합니다. 순서: 기본 프로필 → 프로바이더 프로필 → 허용/거부.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

샌드박스 외부의 승격된 `exec` 액세스를 제어합니다.

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 에이전트별 재정의(`agents.list[].tools.elevated`)는 추가 제한만 할 수 있습니다.
- `/elevated on|off|ask|full`은 세션별로 상태를 저장하며, 인라인 지시문은 단일 메시지에 적용됩니다.
- 승격된 `exec`는 샌드박스를 우회하며 구성된 이스케이프 경로(기본값은 `gateway`, 또는 exec 대상이 `node`일 때는 `node`)를 사용합니다.

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

도구 루프 안전 검사는 **기본적으로 비활성화**되어 있습니다. 탐지를 활성화하려면 `enabled: true`를 설정하세요. 설정은 `tools.loopDetection`에서 전역으로 정의하고 `agents.list[].tools.loopDetection`에서 에이전트별로 재정의할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  루프 분석을 위해 보존되는 최대 도구 호출 기록입니다.
</ParamField>
<ParamField path="warningThreshold" type="number">
  경고에 사용할 반복적인 진행 없음 패턴 임곗값입니다.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  심각한 루프를 차단하기 위한 더 높은 반복 임곗값입니다.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  진행 없는 실행에 대한 강제 중지 임곗값입니다.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  동일한 도구/동일한 인수 호출이 반복되면 경고합니다.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  알려진 폴링 도구(`process.poll`, `command_status` 등)에서 경고/차단합니다.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  진행 없는 교대 쌍 패턴에서 경고/차단합니다.
</ParamField>

<Warning>
`warningThreshold >= criticalThreshold` 또는 `criticalThreshold >= globalCircuitBreakerThreshold`이면 유효성 검사가 실패합니다.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configures inbound media understanding (image/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="미디어 모델 항목 필드">
    **제공자 항목**(`type: "provider"` 또는 생략됨):

    - `provider`: API 제공자 id(`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
    - `model`: 모델 id 재정의
    - `profile` / `preferredProfile`: `auth-profiles.json` 프로필 선택

    **CLI 항목**(`type: "cli"`):

    - `command`: 실행할 실행 파일
    - `args`: 템플릿 인수(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원; `openclaw doctor --fix`는 더 이상 사용되지 않는 `{input}` 플레이스홀더를 `{{MediaPath}}`로 마이그레이션함)

    **공통 필드:**

    - `capabilities`: 선택적 목록(`image`, `audio`, `video`). 기본값: `openai`/`anthropic`/`minimax` → 이미지, `google` → 이미지+오디오+비디오, `groq` → 오디오.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: 항목별 재정의.
    - `tools.media.image.timeoutSeconds`와 일치하는 이미지 모델 `timeoutSeconds` 항목도 에이전트가 명시적 `image` 도구를 호출할 때 적용됩니다.
    - 실패하면 다음 항목으로 대체됩니다.

    제공자 인증은 표준 순서를 따릅니다: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

    **비동기 완료 필드:**

    - `asyncCompletion.directSend`: `true`이면 완료된 비동기 `music_generate` 및 `video_generate` 작업이 먼저 직접 채널 전달을 시도합니다. 기본값: `false`(레거시 요청자 세션 깨우기/모델 전달 경로).

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

세션 도구(`sessions_list`, `sessions_history`, `sessions_send`)가 대상으로 지정할 수 있는 세션을 제어합니다.

기본값: `tree`(현재 세션 + 하위 에이전트처럼 현재 세션이 생성한 세션).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="가시성 범위">
    - `self`: 현재 세션 키만.
    - `tree`: 현재 세션 + 현재 세션이 생성한 세션(하위 에이전트).
    - `agent`: 현재 에이전트 id에 속한 모든 세션(동일한 에이전트 id 아래에서 보낸 사람별 세션을 실행하는 경우 다른 사용자를 포함할 수 있음).
    - `all`: 모든 세션. 에이전트 간 대상 지정에는 여전히 `tools.agentToAgent`가 필요합니다.
    - 샌드박스 제한: 현재 세션이 샌드박스 처리되어 있고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`이면, `tools.sessions.visibility="all"`이어도 가시성이 `tree`로 강제됩니다.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn`의 인라인 첨부 파일 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="첨부 파일 참고 사항">
    - 첨부 파일은 `runtime: "subagent"`에서만 지원됩니다. ACP 런타임은 이를 거부합니다.
    - 파일은 `.manifest.json`과 함께 자식 작업 공간의 `.openclaw/attachments/<uuid>/`에 구체화됩니다.
    - 첨부 파일 콘텐츠는 transcript 지속 저장에서 자동으로 수정됩니다.
    - Base64 입력은 엄격한 알파벳/패딩 검사와 디코딩 전 크기 가드로 검증됩니다.
    - 파일 권한은 디렉터리의 경우 `0700`, 파일의 경우 `0600`입니다.
    - 정리는 `cleanup` 정책을 따릅니다. `delete`는 항상 첨부 파일을 제거하고, `keep`은 `retainOnSessionKeep: true`인 경우에만 유지합니다.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

실험적 내장 도구 플래그입니다. strict-agentic GPT-5 자동 활성화 규칙이 적용되지 않는 한 기본값은 꺼짐입니다.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: 단순하지 않은 다단계 작업 추적을 위한 구조화된 `update_plan` 도구를 활성화합니다.
- 기본값: OpenAI 또는 OpenAI Codex GPT-5 계열 실행에서 `agents.defaults.embeddedPi.executionContract`(또는 에이전트별 재정의)가 `"strict-agentic"`으로 설정되지 않는 한 `false`입니다. 해당 범위 밖에서 도구를 강제로 켜려면 `true`로 설정하고, strict-agentic GPT-5 실행에서도 꺼진 상태로 유지하려면 `false`로 설정합니다.
- 활성화되면 시스템 프롬프트는 모델이 이 도구를 상당한 작업에만 사용하고 `in_progress` 단계가 최대 하나만 유지되도록 사용 지침도 추가합니다.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 생성된 하위 에이전트의 기본 모델입니다. 생략하면 하위 에이전트는 호출자의 모델을 상속합니다.
- `allowAgents`: 요청 에이전트가 자체 `subagents.allowAgents`를 설정하지 않을 때 `sessions_spawn`의 대상 에이전트 ID 기본 허용 목록입니다(`["*"]` = 모두, 기본값: 동일 에이전트만).
- `runTimeoutSeconds`: 도구 호출에서 `runTimeoutSeconds`를 생략할 때 `sessions_spawn`의 기본 제한 시간(초)입니다. `0`은 제한 시간이 없음을 의미합니다.
- 하위 에이전트별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## 사용자 지정 공급자와 기본 URL

OpenClaw는 내장 모델 카탈로그를 사용합니다. config 또는 `~/.openclaw/agents/<agentId>/agent/models.json`의 `models.providers`를 통해 사용자 지정 공급자를 추가합니다.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="인증과 병합 우선순위">
    - 사용자 지정 인증 요구 사항에는 `authHeader: true` + `headers`를 사용합니다.
    - `OPENCLAW_AGENT_DIR`(또는 레거시 환경 변수 별칭인 `PI_CODING_AGENT_DIR`)로 에이전트 config 루트를 재정의합니다.
    - 일치하는 공급자 ID의 병합 우선순위:
      - 비어 있지 않은 에이전트 `models.json`의 `baseUrl` 값이 우선합니다.
      - 비어 있지 않은 에이전트 `apiKey` 값은 해당 공급자가 현재 config/auth-profile 컨텍스트에서 SecretRef로 관리되지 않을 때만 우선합니다.
      - SecretRef로 관리되는 공급자 `apiKey` 값은 확인된 비밀을 영속화하는 대신 소스 마커(env 참조의 경우 `ENV_VAR_NAME`, file/exec 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
      - SecretRef로 관리되는 공급자 헤더 값은 소스 마커(env 참조의 경우 `secretref-env:ENV_VAR_NAME`, file/exec 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
      - 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`은 config의 `models.providers`로 폴백합니다.
      - 일치하는 모델 `contextWindow`/`maxTokens`는 명시적 config 값과 암시적 카탈로그 값 중 더 높은 값을 사용합니다.
      - 일치하는 모델 `contextTokens`는 존재할 때 명시적 런타임 한도를 보존합니다. 네이티브 모델 메타데이터를 변경하지 않고 유효 컨텍스트를 제한하려면 이를 사용합니다.
      - config가 `models.json`을 완전히 다시 작성하도록 하려면 `models.mode: "replace"`를 사용합니다.
      - 마커 영속성은 소스가 권위입니다. 마커는 확인된 런타임 비밀 값이 아니라 활성 소스 config 스냅샷(확인 전)에서 작성됩니다.

  </Accordion>
</AccordionGroup>

### 공급자 필드 세부 정보

<AccordionGroup>
  <Accordion title="최상위 카탈로그">
    - `models.mode`: 공급자 카탈로그 동작(`merge` 또는 `replace`)입니다.
    - `models.providers`: 공급자 ID를 키로 하는 사용자 지정 공급자 맵입니다.
      - 안전한 편집: 추가 업데이트에는 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 또는 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`를 사용합니다. `config set`은 `--replace`를 전달하지 않으면 파괴적 대체를 거부합니다.

  </Accordion>
  <Accordion title="공급자 연결 및 인증">
    - `models.providers.*.api`: 요청 어댑터(`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` 등)입니다. MLX, vLLM, SGLang 및 대부분의 OpenAI 호환 로컬 서버처럼 자체 호스팅 `/v1/chat/completions` 백엔드에는 `openai-completions`를 사용합니다. `baseUrl`은 있지만 `api`가 없는 사용자 지정 공급자는 기본값이 `openai-completions`입니다. 백엔드가 `/v1/responses`를 지원할 때만 `openai-responses`를 설정합니다.
    - `models.providers.*.apiKey`: 공급자 자격 증명입니다(SecretRef/env 치환 권장).
    - `models.providers.*.auth`: 인증 전략(`api-key`, `token`, `oauth`, `aws-sdk`)입니다.
    - `models.providers.*.contextWindow`: 모델 항목이 `contextWindow`를 설정하지 않을 때 이 공급자 아래 모델의 기본 네이티브 컨텍스트 창입니다.
    - `models.providers.*.contextTokens`: 모델 항목이 `contextTokens`를 설정하지 않을 때 이 공급자 아래 모델의 기본 유효 런타임 컨텍스트 한도입니다.
    - `models.providers.*.maxTokens`: 모델 항목이 `maxTokens`를 설정하지 않을 때 이 공급자 아래 모델의 기본 출력 토큰 한도입니다.
    - `models.providers.*.timeoutSeconds`: 연결, 헤더, 본문 및 전체 요청 중단 처리를 포함하는 선택적 공급자별 모델 HTTP 요청 제한 시간(초)입니다.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`의 경우 요청에 `options.num_ctx`를 주입합니다(기본값: `true`).
    - `models.providers.*.authHeader`: 필요할 때 `Authorization` 헤더에서 자격 증명 전송을 강제합니다.
    - `models.providers.*.baseUrl`: 업스트림 API 기본 URL입니다.
    - `models.providers.*.headers`: 프록시/테넌트 라우팅을 위한 추가 정적 헤더입니다.

  </Accordion>
  <Accordion title="요청 전송 재정의">
    `models.providers.*.request`: 모델 공급자 HTTP 요청에 대한 전송 재정의입니다.

    - `request.headers`: 추가 헤더입니다(공급자 기본값과 병합됨). 값은 SecretRef를 허용합니다.
    - `request.auth`: 인증 전략 재정의입니다. 모드: `"provider-default"`(공급자의 내장 인증 사용), `"authorization-bearer"`(`token` 사용), `"header"`(`headerName`, `value`, 선택적 `prefix` 사용).
    - `request.proxy`: HTTP 프록시 재정의입니다. 모드: `"env-proxy"`(`HTTP_PROXY`/`HTTPS_PROXY` 환경 변수 사용), `"explicit-proxy"`(`url` 사용). 두 모드 모두 선택적 `tls` 하위 객체를 허용합니다.
    - `request.tls`: 직접 연결을 위한 TLS 재정의입니다. 필드: `ca`, `cert`, `key`, `passphrase`(모두 SecretRef 허용), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true`이면 공급자 HTTP fetch 가드를 통해 DNS가 프라이빗, CGNAT 또는 유사 범위로 확인되는 경우에도 `baseUrl`에 대한 HTTPS를 허용합니다(신뢰할 수 있는 자체 호스팅 OpenAI 호환 엔드포인트에 대한 운영자 옵트인). `localhost`, `127.0.0.1`, `[::1]` 같은 루프백 모델 공급자 스트림 URL은 이를 명시적으로 `false`로 설정하지 않는 한 자동으로 허용됩니다. LAN, tailnet 및 프라이빗 DNS 호스트는 여전히 옵트인이 필요합니다. WebSocket은 헤더/TLS에 동일한 `request`를 사용하지만 해당 fetch SSRF 게이트는 사용하지 않습니다. 기본값은 `false`입니다.

  </Accordion>
  <Accordion title="모델 카탈로그 항목">
    - `models.providers.*.models`: 명시적 공급자 모델 카탈로그 항목입니다.
    - `models.providers.*.models.*.input`: 모델 입력 모달리티입니다. 텍스트 전용 모델에는 `["text"]`를, 네이티브 이미지/비전 모델에는 `["text", "image"]`를 사용합니다. 이미지 첨부 파일은 선택된 모델이 이미지 지원으로 표시된 경우에만 에이전트 턴에 주입됩니다.
    - `models.providers.*.models.*.contextWindow`: 네이티브 모델 컨텍스트 창 메타데이터입니다. 이는 해당 모델에 대한 공급자 수준 `contextWindow`를 재정의합니다.
    - `models.providers.*.models.*.contextTokens`: 선택적 런타임 컨텍스트 한도입니다. 이는 공급자 수준 `contextTokens`를 재정의합니다. 모델의 네이티브 `contextWindow`보다 더 작은 유효 컨텍스트 예산을 원할 때 사용합니다. 값이 다르면 `openclaw models list`가 두 값을 모두 표시합니다.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트입니다. 비어 있지 않은 비네이티브 `baseUrl`(호스트가 `api.openai.com`이 아님)과 함께 `api: "openai-completions"`를 사용하는 경우 OpenClaw는 런타임에 이를 `false`로 강제합니다. 비어 있거나 생략된 `baseUrl`은 기본 OpenAI 동작을 유지합니다.
    - `models.providers.*.models.*.compat.requiresStringContent`: 문자열 전용 OpenAI 호환 채팅 엔드포인트를 위한 선택적 호환성 힌트입니다. `true`이면 OpenClaw는 요청을 보내기 전에 순수 텍스트 `messages[].content` 배열을 일반 문자열로 평탄화합니다.

  </Accordion>
  <Accordion title="Amazon Bedrock 발견">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 자동 발견 설정 루트입니다.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 암시적 발견을 켜거나 끕니다.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 발견을 위한 AWS 리전입니다.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 대상 발견을 위한 선택적 공급자 ID 필터입니다.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 발견 새로 고침을 위한 폴링 간격입니다.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 발견된 모델의 폴백 컨텍스트 창입니다.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 발견된 모델의 폴백 최대 출력 토큰입니다.

  </Accordion>
</AccordionGroup>

대화형 사용자 지정 공급자 온보딩은 GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, GLM-4V 같은 일반적인 비전 모델 ID에 대해 이미지 입력을 추론하고, 알려진 텍스트 전용 계열에는 추가 질문을 건너뜁니다. 알 수 없는 모델 ID는 여전히 이미지 지원 여부를 묻습니다. 비대화형 온보딩은 동일한 추론을 사용합니다. 이미지 지원 메타데이터를 강제하려면 `--custom-image-input`을 전달하고, 텍스트 전용 메타데이터를 강제하려면 `--custom-text-input`을 전달합니다.

### 공급자 예시

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    번들된 `cerebras` 공급자 Plugin은 `openclaw onboard --auth-choice cerebras-api-key`를 통해 이를 구성할 수 있습니다. 기본값을 재정의할 때만 명시적 공급자 config를 사용합니다.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras에는 `cerebras/zai-glm-4.7`을 사용하고, Z.AI 직접 연결에는 `zai/glm-4.7`을 사용합니다.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 호환 내장 공급자입니다. 바로 가기: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="로컬 모델(LM Studio)">
    [로컬 모델](/ko/gateway/local-models)을 참조하세요. 요약: 충분한 하드웨어에서 LM Studio Responses API를 통해 대형 로컬 모델을 실행하고, fallback을 위해 호스팅 모델을 병합된 상태로 유지하세요.
  </Accordion>
  <Accordion title="MiniMax M2.7(직접)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY`를 설정하세요. 바로 가기: `openclaw onboard --auth-choice minimax-global-api` 또는 `openclaw onboard --auth-choice minimax-cn-api`. 모델 카탈로그는 기본적으로 M2.7만 사용합니다. Anthropic 호환 스트리밍 경로에서는 사용자가 직접 `thinking`을 명시적으로 설정하지 않는 한 OpenClaw가 기본적으로 MiniMax thinking을 비활성화합니다. `/fast on` 또는 `params.fastMode: true`는 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.

  </Accordion>
  <Accordion title="Moonshot AI(Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    중국 엔드포인트의 경우: `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`.

    네이티브 Moonshot 엔드포인트는 공유 `openai-completions` 전송에서 스트리밍 사용량 호환성을 알리며, OpenClaw는 기본 제공 provider id만이 아니라 엔드포인트 기능을 기준으로 이를 판단합니다.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 설정하세요. Zen 카탈로그에는 `opencode/...` 참조를, Go 카탈로그에는 `opencode-go/...` 참조를 사용하세요. 바로 가기: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic(Anthropic 호환)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    기본 URL은 `/v1`을 생략해야 합니다(Anthropic 클라이언트가 이를 추가합니다). 바로 가기: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI(GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    `ZAI_API_KEY`를 설정하세요. `z.ai/*`와 `z-ai/*`는 허용되는 alias입니다. 바로 가기: `openclaw onboard --auth-choice zai-api-key`.

    - 일반 엔드포인트: `https://api.z.ai/api/paas/v4`
    - 코딩 엔드포인트(기본값): `https://api.z.ai/api/coding/paas/v4`
    - 일반 엔드포인트의 경우, 기본 URL 재정의를 포함한 사용자 지정 provider를 정의하세요.

  </Accordion>
</AccordionGroup>

---

## 관련

- [구성 — agents](/ko/gateway/config-agents)
- [구성 — channels](/ko/gateway/config-channels)
- [구성 참조](/ko/gateway/configuration-reference) — 기타 최상위 키
- [도구 및 plugins](/ko/tools)
