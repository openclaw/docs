---
read_when:
    - '`tools.*` 정책, 허용 목록 또는 실험적 기능 구성'
    - 사용자 지정 제공자 등록 또는 기본 URL 재정의
    - OpenAI 호환 자체 호스팅 엔드포인트 설정하기
sidebarTitle: Tools and custom providers
summary: 도구 구성(정책, 실험적 토글, 제공자 기반 도구) 및 사용자 지정 제공자/기본 URL 설정
title: 구성 — 도구 및 사용자 지정 제공자
x-i18n:
    generated_at: "2026-07-12T00:45:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 구성 키와 사용자 지정 제공자 / 기본 URL 설정. 에이전트, 채널 및 기타 최상위 구성 키는 [구성 참조](/ko/gateway/configuration-reference)를 확인하세요.

## 도구

### 도구 프로필

`tools.profile`은 `tools.allow`/`tools.deny`보다 먼저 적용되는 기본 허용 목록을 설정합니다.

<Note>
로컬 온보딩에서는 설정되지 않은 새 로컬 구성의 기본값을 `tools.profile: "coding"`으로 지정합니다(기존에 명시적으로 설정된 프로필은 유지됩니다).
</Note>

| 프로필      | 포함 항목                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만                                                                                                                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | 제한 없음(설정하지 않은 경우와 동일)                                                                                                                                                                                         |

`coding`과 `messaging`은 `bundle-mcp`(구성된 MCP 서버)도 암시적으로 허용합니다.

### 도구 그룹

| 그룹               | 도구                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`(`bash`는 `exec`의 별칭으로 허용됨)                                                                                |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | 위의 모든 기본 제공 도구 중 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`를 제외한 도구(Plugin 도구 제외)                              |
| `group:plugins`    | `bundle-mcp`를 통해 노출되는 구성된 MCP 서버를 포함하여 로드된 Plugin이 소유한 도구                                                                   |

`spawn_task`를 사용하면 코딩 에이전트가 후속 작업을 시작하지 않고도 확인 가능한 형태로 제안할 수 있습니다. Control UI는 제목과 요약을 실행 가능한 칩으로 표시하며, Gateway 기반 TUI는 이에 상응하는 대화형 프롬프트를 표시합니다. 어느 쪽이든 수락하면 새 관리형 워크트리 세션을 생성하고 현재 턴을 계속 진행하면서 전체 프롬프트를 해당 세션으로 전송합니다. `dismiss_task`는 `spawn_task`가 반환한 임시 `task_id`를 사용하여 아직 대기 중인 제안을 철회합니다.

이 도구들은 작업을 시작한 운영자 인터페이스가 Gateway 작업 제안 이벤트를 수신하고 처리할 수 있을 때만 제공됩니다. 채널 세션과 로컬/내장 TUI 세션은 이러한 이벤트를 수신하지 않습니다. 채널 전송 계층에서 이 흐름을 안전하게 노출하려면 이식 가능한 형식 지정 작업 액션이 필요합니다. 제안은 프로세스 로컬이며 Gateway가 다시 시작되면 사라집니다. 두 도구 모두 `coding` 프로필과 `group:sessions`에 유지되므로, 인터페이스가 이를 지원할 때 일반적인 `tools.allow` 및 `tools.deny` 정책으로 자동 구성됩니다.

### 샌드박스 도구 정책 내 MCP 및 Plugin 도구

구성된 MCP 서버는 `bundle-mcp` Plugin ID 아래에 Plugin 소유 도구로 노출됩니다. 일반 도구 프로필로 이를 허용할 수 있지만, 샌드박스 세션에는 `tools.sandbox.tools`가 추가 관문으로 적용됩니다. 샌드박스 모드가 `"all"` 또는 `"non-main"`인 경우 MCP/Plugin 도구를 표시하려면 샌드박스 도구 허용 목록에 다음 항목 중 하나를 포함하세요.

- `mcp.servers`의 OpenClaw 관리형 MCP 서버에는 `bundle-mcp`
- 특정 네이티브 Plugin에는 해당 Plugin ID
- 로드된 모든 Plugin 소유 도구에는 `group:plugins`
- 하나의 서버만 허용하려는 경우 `outlook__send_mail` 또는 `outlook__*`와 같은 정확한 MCP 서버 도구 이름이나 서버 글롭

서버 글롭은 원시 `mcp.servers` 키와 반드시 같지는 않은 제공자 안전 MCP 서버 접두사를 사용합니다. `[A-Za-z0-9_-]` 이외의 문자는 `-`가 되고, 문자로 시작하지 않는 이름에는 `mcp-` 접두사가 붙으며, 길거나 중복된 접두사는 잘리거나 접미사가 붙을 수 있습니다. 예를 들어 `mcp.servers["Outlook Graph"]`는 `outlook-graph__*`와 같은 글롭을 사용합니다.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

해당 샌드박스 계층 항목이 없으면 MCP 서버가 성공적으로 로드되더라도 제공자 요청 전에 해당 도구가 필터링될 수 있습니다. `mcp.servers`의 OpenClaw 관리형 서버에서 이 구성 형태를 감지하려면 `openclaw doctor`를 사용하세요. 번들 Plugin 매니페스트 또는 Claude `.mcp.json`에서 로드된 MCP 서버에도 동일한 샌드박스 관문이 적용되지만, 이 진단 기능은 아직 해당 소스를 열거하지 않습니다. 샌드박스 턴에서 해당 도구가 사라지면 동일한 허용 목록 항목을 사용하세요.

### `tools.codeMode`

`tools.codeMode`는 범용 OpenClaw 코드 모드 인터페이스를 활성화합니다. 도구가 포함된 실행에서 이 기능을 활성화하면 일반 OpenClaw 도구는 샌드박스 내 `tools.*` 카탈로그 브리지 뒤로 이동하고, MCP 도구는 생성된 `MCP` 네임스페이스를 통해 사용할 수 있습니다. 모델에는 일반적으로 `exec`와 `wait`가 표시되며, 구조화된 결과를 JSON 전용 브리지로 전달할 수 없는 `computer` 등의 도구는 직접 제공되는 상태로 유지됩니다.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

축약형도 허용됩니다.

```json5
{
  tools: { codeMode: true },
}
```

코드 모드에서 MCP 선언은 읽기 전용 가상 API 파일 인터페이스를 통해 노출됩니다. 게스트 코드는 `MCP.<server>.<tool>()`을 호출하기 전에 `API.list("mcp")`와 `API.read("mcp/<server>.d.ts")`를 호출하여 TypeScript 형식의 시그니처를 검사할 수 있습니다. 런타임 계약, 제한 사항 및 디버깅 단계는 [코드 모드](/ko/reference/code-mode)를 참조하세요.

### `tools.allow` / `tools.deny`

전역 도구 허용/거부 정책입니다(거부 우선). 대소문자를 구분하지 않으며 `*` 와일드카드를 지원합니다. Docker 샌드박스가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write`와 `apply_patch`는 서로 다른 도구 ID입니다. `allow: ["write"]`는 호환 모델에서 `apply_patch`도 활성화하지만, `deny: ["write"]`는 `apply_patch`를 거부하지 않습니다. 모든 파일 변경을 차단하려면 `group:fs`를 거부하거나 변경 도구를 각각 명시적으로 나열하세요.

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
동일한 범위(`tools`, `tools.byProvider.<id>`, `agents.list[].tools`)에는 `allow`와 `alsoAllow`를 함께 설정할 수 없습니다. 설정 유효성 검사에서 거부됩니다. `alsoAllow` 항목을 `allow`에 병합하거나, `allow`를 제거하고 대신 `profile` + `alsoAllow`를 사용하세요.
</Note>

### `tools.byProvider`

특정 제공자 또는 모델의 도구를 추가로 제한합니다. 적용 순서는 기본 프로필 → 제공자 프로필 → 허용/거부입니다.

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

### `tools.toolsBySender`

특정 요청자 ID의 도구를 제한합니다. 이는 채널 액세스 제어에 추가되는 심층 방어 수단입니다. 발신자 값은 메시지 텍스트가 아니라 채널 어댑터에서 가져와야 합니다.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

키에는 명시적 접두사 `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` 또는 `"*"`를 사용합니다. 채널 ID는 OpenClaw의 정규 ID이며, `teams` 같은 별칭은 `msteams`로 정규화됩니다. 접두사가 없는 레거시 키는 `id:`로만 허용됩니다. 일치 순서는 채널+ID, ID, e164, 사용자 이름, 표시 이름, 와일드카드 순입니다.

에이전트별 `agents.list[].tools.toolsBySender`가 일치하면 빈 `{}` 정책이더라도 전역 발신자 일치를 재정의합니다.

### `tools.elevated`

샌드박스 외부의 상승된 `exec` 액세스를 제어합니다.

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

- 에이전트별 재정의(`agents.list[].tools.elevated`)는 제한을 강화하는 데만 사용할 수 있습니다.
- `/elevated on|off|ask|full`은 세션별 상태를 저장하며, 인라인 지시문은 단일 메시지에 적용됩니다.
- 상승된 `exec`는 샌드박스를 우회하고 구성된 이스케이프 경로를 사용합니다(기본값은 `gateway`이며, exec 대상이 `node`이면 `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

표시된 값은 `applyPatch.allowModels`를 제외하고 모두 기본값입니다(`applyPatch.allowModels`는 기본적으로 비어 있거나 설정되지 않으며, 이는 모든 호환 모델이 `apply_patch`를 사용할 수 있음을 의미합니다). 승인을 기반으로 실행되는 exec가 오래 지속되면 `approvalRunningNoticeMs`가 실행 중 알림을 보냅니다. `0`으로 설정하면 비활성화됩니다.

### `tools.loopDetection`

도구 루프 안전 검사는 **기본적으로 비활성화되어 있습니다**. 감지를 활성화하려면 `enabled: true`를 설정하세요. 설정은 `tools.loopDetection`에서 전역으로 정의할 수 있으며, 에이전트별로 `agents.list[].tools.loopDetection`에서 재정의할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  루프 분석을 위해 유지할 최대 도구 호출 기록 수입니다.
</ParamField>
<ParamField path="warningThreshold" type="number">
  경고를 발생시키는 진행 없는 반복 패턴 임계값입니다.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  사용할 수 없거나 알 수 없는 동일한 도구 이름의 호출이 이 횟수만큼 실패하면 이후 반복 호출을 차단합니다.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  심각한 루프를 차단하기 위한 더 높은 반복 임계값입니다.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  진행이 없는 모든 실행을 강제로 중단하는 임계값입니다.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  동일한 도구와 동일한 인수를 사용한 호출이 반복되면 경고합니다.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  알려진 폴링 도구(`process.poll`, `command_status` 등)에서 진행이 없으면 경고하거나 차단합니다.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  진행 없는 두 패턴이 번갈아 반복되면 경고하거나 차단합니다.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  자동 Compaction 후 가드가 활성 상태를 유지하는 시도 횟수입니다. 해당 범위 내에서 에이전트가 동일한 (도구, 인수, 결과)를 반복하면 중단합니다.
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
        apiKey: "brave_api_key", // 또는 BRAVE_API_KEY 환경 변수(Brave 제공자)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 선택 사항. 자동 감지하려면 생략
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

표시된 값은 `provider`와 `userAgent`를 제외하고 모두 기본값입니다. `maxResponseBytes`는 32000~10000000 범위로 제한되며, `maxChars`는 `maxCharsCap`으로 제한됩니다(더 큰 응답을 허용하려면 `maxCharsCap`을 늘리세요).

### `tools.media`

수신 미디어 이해(이미지/오디오/동영상)를 구성합니다.

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 지원 중단됨: 완료 결과는 에이전트를 통해 전달됨
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

`concurrency`(기본값 `2`), `audio.maxBytes`(기본값 20MB), `video.maxBytes`(기본값 50MB)는 기본값으로 표시되어 있으며, `image.maxBytes`의 기본값은 10MB입니다. 기능별 요청 제한 시간 기본값은 이미지/오디오의 경우 `60`초, 동영상의 경우 `120`초입니다.

<AccordionGroup>
  <Accordion title="미디어 모델 항목 필드">
    **제공자 항목** (`type: "provider"` 또는 생략):

    - `provider`: API 제공자 ID(`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
    - `model`: 모델 ID 재정의
    - `profile` / `preferredProfile`: `auth-profiles.json` 프로필 선택

    **CLI 항목** (`type: "cli"`):

    - `command`: 실행할 실행 파일
    - `args`: 템플릿 인수(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등을 지원하며, `openclaw doctor --fix`는 지원 중단된 `{input}` 플레이스홀더를 `{{MediaPath}}`로 마이그레이션함)

    **공통 필드:**

    - `capabilities`: 선택적 목록(`image`, `audio`, `video`). 각 제공자 Plugin은 자체 기본 기능 집합을 선언합니다. 예를 들어 번들 `openai` 제공자의 기본값은 이미지+오디오, `anthropic`/`minimax`는 이미지, `google`은 이미지+오디오+동영상, `groq`는 오디오입니다.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: 항목별 재정의입니다.
    - `tools.media.image.timeoutSeconds`와 해당 이미지 모델의 `timeoutSeconds` 항목은 에이전트가 명시적 `image` 도구를 호출할 때도 적용됩니다. 이미지 이해의 경우 이 제한 시간은 요청 자체에 적용되며 이전 준비 작업으로 인해 줄어들지 않습니다.
    - 실패하면 다음 항목으로 대체됩니다.

    제공자 인증은 표준 순서를 따릅니다. `auth-profiles.json` → 환경 변수 → `models.providers.*.apiKey`.

    **비동기 완료 필드:**

    - `asyncCompletion.directSend`: 지원 중단된 호환성 플래그입니다. 완료된 비동기 미디어 작업은 요청자 세션을 통해 계속 전달되므로, 에이전트가 결과를 수신하고 사용자에게 알릴 방법을 결정하며 원본 전달에 필요한 경우 메시지 도구를 사용합니다.

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

기본값: `tree`(현재 세션과 하위 에이전트 등 현재 세션에서 생성된 세션).

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
    - `self`: 현재 세션 키만 포함합니다.
    - `tree`: 현재 세션과 현재 세션에서 생성된 세션(하위 에이전트)을 포함합니다.
    - `agent`: 현재 에이전트 ID에 속한 모든 세션입니다(동일한 에이전트 ID에서 발신자별 세션을 실행하는 경우 다른 사용자의 세션도 포함될 수 있음).
    - `all`: 모든 세션입니다. 다른 에이전트를 대상으로 지정하려면 여전히 `tools.agentToAgent`가 필요합니다.
    - 샌드박스 제한: 현재 세션이 샌드박스에서 실행되고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`(기본값)이면 `tools.sessions.visibility="all"`인 경우에도 가시성이 `tree`로 강제됩니다.
    - `all`이 아닐 때 `sessions_list`에는 유효 모드를 설명하는 간략한 `visibility` 필드와 현재 범위를 벗어난 일부 세션이 생략될 수 있다는 경고가 포함됩니다.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn`의 인라인 첨부 파일 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 명시적 활성화: 인라인 파일 첨부를 허용하려면 true로 설정
        maxTotalBytes: 5242880, // 모든 파일을 합해 총 5MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 파일당 1MB
        retainOnSessionKeep: false, // cleanup="keep"일 때 첨부 파일 유지
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="첨부 파일 참고 사항">
    - 첨부 파일을 사용하려면 `enabled: true`가 필요합니다.
    - 하위 에이전트 첨부 파일은 `.manifest.json`과 함께 하위 작업 공간의 `.openclaw/attachments/<uuid>/`에 생성됩니다.
    - ACP 첨부 파일은 이미지만 지원하며 동일한 파일 수, 파일당 바이트 및 총 바이트 제한을 통과한 후 ACP 런타임에 인라인으로 전달됩니다.
    - 첨부 파일 콘텐츠는 트랜스크립트 영속화에서 자동으로 마스킹됩니다.
    - Base64 입력은 엄격한 알파벳/패딩 검사와 디코딩 전 크기 제한 검사를 통해 유효성이 확인됩니다.
    - 하위 에이전트 첨부 파일 권한은 디렉터리의 경우 `0700`, 파일의 경우 `0600`입니다.
    - 하위 에이전트 정리는 `cleanup` 정책을 따릅니다. `delete`는 항상 첨부 파일을 제거하며, `keep`은 `retainOnSessionKeep: true`인 경우에만 첨부 파일을 유지합니다.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

실험적 내장 도구 플래그입니다. 엄격한 에이전트형 GPT-5 자동 활성화 규칙이 적용되지 않는 한 기본적으로 비활성화됩니다.

```json5
{
  tools: {
    experimental: {
      planTool: true, // 실험적 update_plan 활성화
    },
  },
}
```

- `planTool`: 중요하고 여러 단계로 이루어진 작업을 추적할 수 있도록 구조화된 `update_plan` 도구를 활성화합니다.
- 기본값: `agents.defaults.embeddedAgent.executionContract`(또는 에이전트별 재정의)가 GPT-5 계열 모델 ID를 대상으로 하는 `openai` 제공자 실행에서 `"strict-agentic"`으로 설정된 경우를 제외하면 `false`입니다(Codex 인증/모델 라우팅이 `openai` 제공자에 속하므로 OpenAI Codex CLI 실행도 포함됨). 해당 범위 밖에서 도구를 강제로 활성화하려면 `true`로 설정하고, 엄격한 에이전트형 GPT-5 실행에서도 비활성화하려면 `false`로 설정하세요.
- 활성화하면 시스템 프롬프트에도 사용 지침이 추가되어 모델이 중요한 작업에만 이 도구를 사용하고 `in_progress` 단계를 최대 하나만 유지하도록 합니다.

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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 생성된 하위 에이전트의 기본 모델입니다. 생략하면 하위 에이전트가 호출자의 모델을 상속합니다.
- `allowAgents`: 요청 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 `sessions_spawn`에 적용되는 구성된 대상 에이전트 ID의 기본 허용 목록입니다(`["*"]` = 구성된 모든 대상, 기본값: 동일한 에이전트만). 에이전트 구성이 삭제되어 오래된 항목은 `sessions_spawn`에서 거부되고 `agents_list`에서 생략됩니다. 정리하려면 `openclaw doctor --fix`를 실행하세요.
- `maxConcurrent`: 동시에 실행할 수 있는 최대 하위 에이전트 실행 수입니다. 기본값: `8`.
- `runTimeoutSeconds`: 호출자가 자체 재정의를 전달하지 않았을 때 `sessions_spawn`에 적용되는 제한 시간(초)입니다. 기본값: `0`(제한 시간 없음). 위에 표시된 `900`은 일반적인 명시적 설정값이며 내장 기본값이 아닙니다.
- `announceTimeoutMs`: Gateway `agent` 알림 전달 시도별 제한 시간(밀리초)입니다. 기본값: `120000`. 일시적 재시도로 인해 총 알림 대기 시간이 구성된 제한 시간 하나보다 길어질 수 있습니다.
- `archiveAfterMinutes`: 하위 에이전트 세션이 완료된 후 자동으로 보관되기까지의 시간(분)입니다. 기본값: `60`. `0`은 자동 보관을 비활성화합니다.
- 하위 에이전트별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## 사용자 지정 제공자 및 기본 URL

제공자 Plugin은 자체 모델 카탈로그 행을 게시합니다. 구성의 `models.providers` 또는 `~/.openclaw/agents/<agentId>/agent/models.json`을 통해 사용자 지정 제공자를 추가하세요.

사용자 지정/로컬 제공자의 `baseUrl` 구성은 모델 HTTP 요청에 대한 제한적인 네트워크 신뢰 결정이기도 합니다. OpenClaw는 별도 구성 옵션을 추가하거나 다른 비공개 오리진을 신뢰하지 않고, 보호된 가져오기 경로를 통해 정확히 해당 `scheme://host:port` 오리진만 허용합니다.

```json5
{
  models: {
    mode: "merge", // merge(기본값) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | 기타
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
  <Accordion title="인증 및 병합 우선순위">
    - 사용자 지정 인증이 필요한 경우 `authHeader: true` + `headers`를 사용합니다.
    - `OPENCLAW_AGENT_DIR`로 에이전트 구성 루트를 재정의합니다.
    - 일치하는 제공자 ID의 병합 우선순위:
      - 비어 있지 않은 에이전트 `models.json`의 `baseUrl` 값이 우선합니다.
      - 비어 있지 않은 에이전트 `apiKey` 값은 현재 구성/인증 프로필 컨텍스트에서 해당 제공자가 SecretRef로 관리되지 않는 경우에만 우선합니다.
      - SecretRef로 관리되는 제공자의 `apiKey` 값은 확인된 비밀을 영구 저장하는 대신 소스 마커(환경 변수 참조의 경우 `ENV_VAR_NAME`, 파일/실행 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
      - SecretRef로 관리되는 제공자 헤더 값은 소스 마커(환경 변수 참조의 경우 `secretref-env:ENV_VAR_NAME`, 파일/실행 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
      - 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`은 구성의 `models.providers`로 대체됩니다.
      - 일치하는 모델의 `contextWindow`/`maxTokens`: 명시적 구성 값이 존재하고 유효한 경우(양의 유한수) 해당 값이 우선하며, 그렇지 않으면 암시적/생성된 카탈로그 값이 사용됩니다.
      - 일치하는 모델의 `contextTokens`에도 동일하게 명시적 값 우선, 없으면 암시적 값 사용 규칙이 적용됩니다. 네이티브 모델 메타데이터를 변경하지 않고 유효 컨텍스트를 제한하는 데 사용합니다.
      - 제공자 Plugin 카탈로그는 에이전트의 Plugin 상태 아래에 생성된 Plugin 소유 카탈로그 샤드로 저장됩니다.
      - 구성이 `models.json`을 완전히 다시 작성하고 Plugin 소유 카탈로그 샤드 병합을 건너뛰게 하려면 `models.mode: "replace"`를 사용합니다.
      - 마커 영구 저장은 소스를 기준으로 합니다. 마커는 확인된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷(확인 전)에서 기록됩니다.

  </Accordion>
</AccordionGroup>

### 제공자 필드 세부 정보

<AccordionGroup>
  <Accordion title="최상위 카탈로그">
    - `models.mode`: 제공자 카탈로그 동작(`merge` 또는 `replace`).
    - `models.providers`: 제공자 ID를 키로 사용하는 사용자 지정 제공자 맵.
      - 안전한 편집: 추가 업데이트에는 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 또는 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`를 사용합니다. `--replace`를 전달하지 않으면 `config set`은 파괴적인 교체를 거부합니다.

  </Accordion>
  <Accordion title="제공자 연결 및 인증">
    - `models.providers.*.api`: 요청 어댑터(`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). MLX, vLLM, SGLang 및 대부분의 OpenAI 호환 로컬 서버와 같은 자체 호스팅 `/v1/chat/completions` 백엔드에는 `openai-completions`를 사용합니다. `baseUrl`은 있지만 `api`가 없는 사용자 지정 제공자는 기본적으로 `openai-completions`를 사용합니다. 백엔드가 `/v1/responses`를 지원하는 경우에만 `openai-responses`를 설정합니다.
    - `models.providers.*.apiKey`: 제공자 자격 증명(SecretRef/환경 변수 치환 권장).
    - `models.providers.*.auth`: 인증 전략(`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: 모델 항목에 `contextWindow`가 설정되지 않았을 때 이 제공자에 속한 모델의 기본 네이티브 컨텍스트 창.
    - `models.providers.*.contextTokens`: 모델 항목에 `contextTokens`가 설정되지 않았을 때 이 제공자에 속한 모델의 기본 유효 런타임 컨텍스트 한도.
    - `models.providers.*.maxTokens`: 모델 항목에 `maxTokens`가 설정되지 않았을 때 이 제공자에 속한 모델의 기본 출력 토큰 한도.
    - `models.providers.*.timeoutSeconds`: 연결, 헤더, 본문 및 전체 요청 중단 처리를 포함하는 선택적 제공자별 모델 HTTP 요청 시간 제한(초).
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`의 경우 요청에 `options.num_ctx`를 삽입합니다(기본값: `true`).
    - `models.providers.*.authHeader`: 필요한 경우 `Authorization` 헤더를 통한 자격 증명 전송을 강제합니다.
    - `models.providers.*.baseUrl`: 업스트림 API 기본 URL.
    - `models.providers.*.headers`: 프록시/테넌트 라우팅용 추가 정적 헤더.

  </Accordion>
  <Accordion title="요청 전송 재정의">
    `models.providers.*.request`: 모델 제공자 HTTP 요청의 전송 재정의입니다.

    - `request.headers`: 추가 헤더(제공자 기본값과 병합됨). 값에 SecretRef를 사용할 수 있습니다.
    - `request.auth`: 인증 전략 재정의. 모드: `"provider-default"`(제공자의 기본 제공 인증 사용), `"authorization-bearer"`(`token`과 함께 사용), `"header"`(`headerName`, `value`, 선택적 `prefix`와 함께 사용).
    - `request.proxy`: HTTP 프록시 재정의. 모드: `"env-proxy"`(`HTTP_PROXY`/`HTTPS_PROXY` 환경 변수 사용), `"explicit-proxy"`(`url`과 함께 사용). 두 모드 모두 선택적 `tls` 하위 객체를 허용합니다.
    - `request.tls`: 직접 연결의 TLS 재정의. 필드: `ca`, `cert`, `key`, `passphrase`(모두 SecretRef 허용), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true`이면 제공자 HTTP 가져오기 보호를 통해 사설, CGNAT 또는 유사 범위로 모델 제공자 HTTP 요청을 허용합니다. 사용자 지정/로컬 제공자 기본 URL은 이미 정확히 구성된 오리진을 신뢰하지만, 메타데이터/링크 로컬 오리진은 명시적으로 허용하지 않는 한 계속 차단됩니다. 정확한 오리진 신뢰를 사용하지 않으려면 이를 `false`로 설정합니다. WebSocket은 헤더/TLS에 동일한 `request`를 사용하지만 해당 가져오기 SSRF 게이트는 사용하지 않습니다. 기본값은 `false`입니다.

  </Accordion>
  <Accordion title="모델 카탈로그 항목">
    - `models.providers.*.models`: 명시적 제공자 모델 카탈로그 항목.
    - `models.providers.*.models.*.input`: 모델 입력 모달리티. 텍스트 전용 모델에는 `["text"]`를, 네이티브 이미지/비전 모델에는 `["text", "image"]`를 사용합니다. 선택한 모델이 이미지 지원으로 표시된 경우에만 이미지 첨부 파일이 에이전트 턴에 삽입됩니다.
    - `models.providers.*.models.*.contextWindow`: 네이티브 모델 컨텍스트 창 메타데이터. 해당 모델에 대해 제공자 수준의 `contextWindow`를 재정의합니다.
    - `models.providers.*.models.*.contextTokens`: 선택적 런타임 컨텍스트 한도. 제공자 수준의 `contextTokens`를 재정의합니다. 모델의 네이티브 `contextWindow`보다 더 작은 유효 컨텍스트 예산을 원할 때 사용합니다. 두 값이 다르면 `openclaw models list`에 둘 다 표시됩니다.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트. 비어 있지 않은 비네이티브 `baseUrl`(호스트가 `api.openai.com`이 아님)을 사용하는 `api: "openai-completions"`의 경우 OpenClaw는 런타임에 이를 `false`로 강제합니다. 비어 있거나 생략된 `baseUrl`은 기본 OpenAI 동작을 유지합니다.
    - `models.providers.*.models.*.compat.requiresStringContent`: 문자열 전용 OpenAI 호환 채팅 엔드포인트를 위한 선택적 호환성 힌트. `true`이면 OpenClaw는 요청을 보내기 전에 순수 텍스트 `messages[].content` 배열을 일반 문자열로 평탄화합니다.
    - `models.providers.*.models.*.compat.strictMessageKeys`: 엄격한 OpenAI 호환 채팅 엔드포인트를 위한 선택적 호환성 힌트. `true`이면 OpenClaw는 요청을 보내기 전에 발신 Chat Completions 메시지 객체에서 `role`과 `content`만 남깁니다.
    - `models.providers.*.models.*.compat.thinkingFormat`: 선택적 사고 페이로드 힌트. Together 스타일 `reasoning.enabled`에는 `"together"`를, 최상위 `enable_thinking`에는 `"qwen"`을, vLLM처럼 요청 수준 채팅 템플릿 키워드 인수를 지원하는 Qwen 계열 OpenAI 호환 서버의 `chat_template_kwargs.enable_thinking`에는 `"qwen-chat-template"`을 사용합니다. 구성된 vLLM Qwen 모델은 이러한 형식에 대해 이진 `/think` 선택지(`off`, `on`)를 제공합니다.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: 재생 시 이전 어시스턴트 메시지에 `reasoning_content`를 유지해야 하는 DeepSeek 스타일 Chat Completions 백엔드를 위한 선택적 호환성 힌트. `true`이면 OpenClaw는 발신 어시스턴트 메시지에서 해당 필드를 보존합니다. 추론이 제거된 후 요청을 거부하는 사용자 지정 DeepSeek 호환 프록시를 연결할 때 사용합니다. 기본값은 `false`입니다.

  </Accordion>
  <Accordion title="Amazon Bedrock 검색">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 자동 검색 설정 루트.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 암시적 검색을 켜거나 끕니다.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 검색에 사용할 AWS 리전.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 대상 검색을 위한 선택적 제공자 ID 필터.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 검색 새로 고침 폴링 간격.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 검색된 모델의 대체 컨텍스트 창.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 검색된 모델의 대체 최대 출력 토큰 수.

  </Accordion>
</AccordionGroup>

대화형 사용자 지정 제공자 온보딩은 GPT-4o/GPT-4.1/GPT-5+, `o1`/`o3`/`o4` 추론 계열, Claude, Gemini, `-vl` 접미사가 붙은 모든 ID(Qwen-VL 및 유사 모델), LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, GLM-4V 등의 명명된 계열을 포함하여 알려진 비전 모델 ID 패턴의 이미지 입력을 추론합니다. 알려진 텍스트 전용 계열(Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama 및 vl/vision 접미사가 없는 기본 Qwen ID)에는 추가 질문을 건너뜁니다. 알 수 없는 모델 ID의 경우 이미지 지원 여부를 계속 묻습니다. 비대화형 온보딩도 동일한 추론을 사용합니다. 이미지 지원 메타데이터를 강제하려면 `--custom-image-input`을, 텍스트 전용 메타데이터를 강제하려면 `--custom-text-input`을 전달합니다.

### 제공자 예시

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    공식 외부 `cerebras` 제공자 Plugin은 `openclaw onboard --auth-choice cerebras-api-key`를 통해 이를 구성할 수 있습니다. 기본값을 재정의하는 경우에만 명시적 제공자 구성을 사용합니다.

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
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 호환 기본 제공자입니다. 단축 명령: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="로컬 모델(LM Studio)">
    [로컬 모델](/ko/gateway/local-models)을 참조하세요. 요약: 고성능 하드웨어에서 LM Studio Responses API를 통해 대규모 로컬 모델을 실행하고, 폴백을 위해 호스팅 모델을 병합된 상태로 유지하세요.
  </Accordion>
  <Accordion title="MiniMax M3(직접 연결)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY`를 설정하세요. 단축 명령: `openclaw onboard --auth-choice minimax-global-api` 또는 `openclaw onboard --auth-choice minimax-cn-api`. 모델 카탈로그의 기본값은 M3이며 M2.7 변형도 포함합니다. Anthropic 호환 스트리밍 경로에서 OpenClaw는 사용자가 `thinking`을 명시적으로 설정하지 않는 한 기본적으로 MiniMax M2.x의 사고 기능을 비활성화합니다. MiniMax-M3 및 M3.x는 기본적으로 공급자의 생략형/적응형 사고 경로를 유지합니다. `/fast on` 또는 `params.fastMode: true`를 사용하면 `MiniMax-M2.7`이 `MiniMax-M2.7-highspeed`로 재작성됩니다.

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

    중국 엔드포인트의 경우 `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`을 사용하세요.

    네이티브 Moonshot 엔드포인트는 공유 `openai-completions` 전송 방식에서 스트리밍 사용량 정보와의 호환성을 명시하며, OpenClaw는 내장 공급자 ID만이 아니라 엔드포인트 기능을 기준으로 이를 활성화합니다.

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

    `OPENCODE_API_KEY` 또는 `OPENCODE_ZEN_API_KEY`를 설정하세요. Zen 카탈로그에는 `opencode/...` 참조를, Go 카탈로그에는 `opencode-go/...` 참조를 사용하세요. 단축 명령: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`.

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

    기본 URL에서 `/v1`을 제외해야 합니다(Anthropic 클라이언트가 이를 추가합니다). 단축 명령: `openclaw onboard --auth-choice synthetic-api-key`.

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

    `ZAI_API_KEY`를 설정하세요. 모델 참조에는 표준 `zai/*` 공급자 ID를 사용합니다. 단축 명령: `openclaw onboard --auth-choice zai-api-key`.

    - 일반 엔드포인트: `https://api.z.ai/api/paas/v4`
    - 코딩 엔드포인트: `https://api.z.ai/api/coding/paas/v4`
    - 기본 `zai-api-key` 인증 선택지는 키를 검사하여 해당 키가 어느 엔드포인트에 속하는지 자동으로 감지합니다. 감지 결과가 확실하지 않으면 입력을 요청하며, 기본값은 글로벌입니다. 명시적으로 선택할 수 있는 전용 CN 및 Coding-Plan 인증 선택지도 제공됩니다.
    - 일반 엔드포인트의 경우 기본 URL을 재정의한 사용자 지정 공급자를 정의하세요.

  </Accordion>
</AccordionGroup>

---

## 관련 항목

- [구성 — 에이전트](/ko/gateway/config-agents)
- [구성 — 채널](/ko/gateway/config-channels)
- [구성 참조](/ko/gateway/configuration-reference) — 기타 최상위 키
- [도구 및 Plugin](/ko/tools)
