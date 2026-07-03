---
read_when:
    - 에이전트 기본값 조정(모델, 사고, 작업 공간, Heartbeat, 미디어, Skills)
    - 다중 에이전트 라우팅 및 바인딩 구성
    - 세션, 메시지 전달 및 대화 모드 동작 조정
summary: Agent 기본값, 멀티 Agent 라우팅, 세션, 메시지 및 대화 설정
title: 구성 — 에이전트
x-i18n:
    generated_at: "2026-07-03T13:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, `talk.*` 아래의 에이전트 범위 구성 키입니다. 채널, 도구, Gateway 런타임 및 기타
최상위 키는 [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## 에이전트 기본값

### `agents.defaults.workspace`

기본값: 설정된 경우 `OPENCLAW_WORKSPACE_DIR`, 그렇지 않으면 `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

명시적인 `agents.defaults.workspace` 값은
`OPENCLAW_WORKSPACE_DIR`보다 우선합니다. 해당 경로를 구성에 쓰고 싶지 않을 때
환경 변수를 사용해 기본 에이전트가 마운트된 작업 공간을 가리키도록 하세요.

### `agents.defaults.repoRoot`

시스템 프롬프트의 Runtime 줄에 표시되는 선택적 저장소 루트입니다. 설정하지 않으면 OpenClaw가 작업 공간에서 위로 올라가며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 에이전트를 위한
선택적 기본 Skills 허용 목록입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills를 사용하지 않으려면 `agents.list[].skills: []`를 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

작업 공간 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

필수 부트스트랩 파일은 계속 쓰면서 선택한 선택적 작업 공간 파일 생성을 건너뜁니다. 유효한 값: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

작업 공간 부트스트랩 파일을 시스템 프롬프트에 주입하는 시점을 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 안전한 이어가기 턴(완료된 어시스턴트 응답 이후)은 작업 공간 부트스트랩 재주입을 건너뛰어 프롬프트 크기를 줄입니다. Heartbeat 실행과 Compaction 이후 재시도는 여전히 컨텍스트를 다시 빌드합니다.
- `"never"`: 모든 턴에서 작업 공간 부트스트랩 및 컨텍스트 파일 주입을 비활성화합니다. 프롬프트 수명 주기를 완전히 직접 소유하는 에이전트(사용자 지정 컨텍스트 엔진, 자체 컨텍스트를 빌드하는 네이티브 런타임 또는 특수한 부트스트랩 없는 워크플로)에만 사용하세요. Heartbeat 및 Compaction 복구 턴도 주입을 건너뜁니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

에이전트별 재정의: `agents.list[].contextInjection`. 생략된 값은
`agents.defaults.contextInjection`을 상속합니다.

### `agents.defaults.bootstrapMaxChars`

잘리기 전 작업 공간 부트스트랩 파일당 최대 문자 수입니다. 기본값: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

에이전트별 재정의: `agents.list[].bootstrapMaxChars`. 생략된 값은
`agents.defaults.bootstrapMaxChars`를 상속합니다.

### `agents.defaults.bootstrapTotalMaxChars`

모든 작업 공간 부트스트랩 파일에 걸쳐 주입되는 총 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

에이전트별 재정의: `agents.list[].bootstrapTotalMaxChars`. 생략된 값은
`agents.defaults.bootstrapTotalMaxChars`를 상속합니다.

### 에이전트별 부트스트랩 프로필 재정의

한 에이전트에 공유 기본값과 다른 프롬프트 주입 동작이 필요할 때
에이전트별 부트스트랩 프로필 재정의를 사용하세요. 생략된 필드는
`agents.defaults`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

부트스트랩 컨텍스트가 잘릴 때 에이전트에 보이는 시스템 프롬프트 알림을 제어합니다.
기본값: `"always"`.

- `"off"`: 시스템 프롬프트에 잘림 알림 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 서명당 한 번 간결한 알림을 주입합니다.
- `"always"`: 잘림이 있으면 모든 실행에서 간결한 알림을 주입합니다(권장).

자세한 원시/주입 카운트와 구성 조정 필드는 컨텍스트/상태 보고서 및 로그와 같은
진단에 남으며, 일상적인 WebChat 사용자/런타임 컨텍스트에는
간결한 복구 알림만 포함됩니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 컨텍스트 예산 소유권 맵

OpenClaw에는 여러 고용량 프롬프트/컨텍스트 예산이 있으며, 이들은
하나의 일반 노브를 통과하도록 하지 않고 의도적으로 하위 시스템별로 나뉩니다.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  일반 작업 공간 부트스트랩 주입.
- `agents.defaults.startupContext.*`:
  최근 일일 `memory/*.md` 파일을 포함하는 일회성 재설정/시작 모델 실행 전주입니다. 단순 채팅 `/new` 및 `/reset` 명령은
  모델을 호출하지 않고 확인됩니다.
- `skills.limits.*`:
  시스템 프롬프트에 주입되는 압축된 Skills 목록.
- `agents.defaults.contextLimits.*`:
  제한된 런타임 발췌 및 주입된 런타임 소유 블록.
- `memory.qmd.limits.*`:
  색인된 메모리 검색 스니펫 및 주입 크기.

한 에이전트에 다른 예산이 필요할 때만 일치하는 에이전트별 재정의를 사용하세요.

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

재설정/시작 모델 실행 시 첫 턴 시작 전주 주입을 제어합니다.
단순 채팅 `/new` 및 `/reset` 명령은 모델을 호출하지 않고
재설정을 확인하므로 이 전주를 로드하지 않습니다.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

제한된 런타임 컨텍스트 표면에 대한 공유 기본값입니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 잘림 메타데이터와 이어가기 알림이 추가되기 전
  기본 `memory_get` 발췌 상한입니다.
- `memoryGetDefaultLines`: `lines`가 생략되었을 때 기본 `memory_get` 줄 범위입니다.
- `toolResultMaxChars`: 유지되는 결과 및 오버플로 복구에 사용되는 고급 라이브 도구 결과 상한입니다. 모델 컨텍스트 자동 상한을 사용하려면 설정하지 마세요:
  100K 토큰 미만에서는 `16000`자, 100K+ 토큰에서는 `32000`자, 200K+ 토큰에서는 `64000`
  자입니다. 장문 컨텍스트 모델의 경우 최대 `1000000`까지 명시적 값을 허용하지만,
  유효 상한은 여전히 모델 컨텍스트 창의 약 30%로 제한됩니다. `openclaw doctor --deep`은 유효 상한을 출력하며,
  doctor는 명시적 재정의가 오래되었거나 효과가 없을 때만 경고합니다.
- `postCompactionMaxChars`: Compaction 이후
  새로 고침 주입 중 사용되는 AGENTS.md 발췌 상한입니다.

#### `agents.list[].contextLimits`

공유 `contextLimits` 노브에 대한 에이전트별 재정의입니다. 생략된 필드는
`agents.defaults.contextLimits`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

시스템 프롬프트에 주입되는 압축된 Skills 목록의 전역 상한입니다. 이는
필요 시 `SKILL.md` 파일을 읽는 데 영향을 주지 않습니다.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 프롬프트 예산에 대한 에이전트별 재정의입니다.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

제공자 호출 전 대화 기록/도구 이미지 블록에서 이미지의 가장 긴 변에 대한 최대 픽셀 크기입니다.
기본값: `1200`.

낮은 값은 일반적으로 스크린샷이 많은 실행에서 비전 토큰 사용량과 요청 페이로드 크기를 줄입니다.
높은 값은 더 많은 시각적 세부 정보를 보존합니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

파일 경로, URL 및 미디어 참조에서 로드된 이미지에 대한 이미지 도구 압축/세부 정보 선호도입니다.
기본값: `auto`.

OpenClaw는 선택한 이미지 모델에 맞게 크기 조정 단계를 조정합니다. 예를 들어 Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL 및 호스팅된 Llama 4 비전 모델은 오래된/기본 고세부 비전 경로보다 더 큰 이미지를 사용할 수 있으며, 여러 이미지 턴은 토큰 및 지연 비용을 제어하기 위해 `auto` 모드에서 더 적극적으로 압축됩니다.

값:

- `auto`: 모델 제한과 이미지 수에 맞게 조정합니다.
- `efficient`: 더 낮은 토큰 및 바이트 사용량을 위해 더 작은 이미지를 선호합니다.
- `balanced`: 표준 중간 단계 조정을 사용합니다.
- `high`: 스크린샷, 다이어그램, 문서 이미지의 세부 정보를 더 많이 보존합니다.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

시스템 프롬프트 컨텍스트의 시간대입니다(메시지 타임스탬프가 아님). 호스트 시간대로 대체됩니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

시스템 프롬프트의 시간 형식입니다. 기본값: `auto`(OS 선호도).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 문자열 형식은 기본 모델만 설정합니다.
  - 객체 형식은 기본 모델과 순서가 있는 장애 조치 모델을 함께 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - `image` 도구 경로에서 비전 모델 구성으로 사용됩니다.
  - 선택된/기본 모델이 이미지 입력을 받을 수 없을 때 대체 라우팅으로도 사용됩니다.
  - 명시적인 `provider/model` 참조를 권장합니다. 호환성을 위해 단독 ID도 허용됩니다. 단독 ID가 `models.providers.*.models`에 구성된 이미지 지원 항목과 고유하게 일치하면 OpenClaw가 해당 provider로 한정합니다. 구성된 일치 항목이 모호하면 명시적인 provider 접두사가 필요합니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 이미지 생성 기능과 이미지를 생성하는 향후 도구/Plugin 표면에서 사용됩니다.
  - 일반적인 값: 네이티브 Gemini 이미지 생성용 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, OpenAI Images용 `openai/gpt-image-2`, 또는 투명 배경 OpenAI PNG/WebP 출력용 `openai/gpt-image-1.5`.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증도 구성하세요(예: `google/*`용 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5`용 `OPENAI_API_KEY` 또는 OpenAI Codex OAuth, `fal/*`용 `FAL_KEY`).
  - 생략하면 `image_generate`가 인증 기반 provider 기본값을 여전히 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, 등록된 나머지 이미지 생성 provider를 provider ID 순서대로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 음악 생성 기능과 내장 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, 또는 `minimax/music-2.6`.
  - 생략하면 `music_generate`가 인증 기반 provider 기본값을 여전히 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, 등록된 나머지 음악 생성 provider를 provider ID 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 비디오 생성 기능과 내장 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, 또는 `qwen/wan2.7-r2v`.
  - 생략하면 `video_generate`가 인증 기반 provider 기본값을 여전히 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, 등록된 나머지 비디오 생성 provider를 provider ID 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 구성하세요.
  - 공식 Qwen 비디오 생성 Plugin은 최대 출력 비디오 1개, 입력 이미지 1개, 입력 비디오 4개, 10초 길이, 그리고 provider 수준의 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - `pdf` 도구에서 모델 라우팅에 사용됩니다.
  - 생략하면 PDF 도구는 `imageModel`로, 그다음 확인된 세션/기본 모델로 대체됩니다.
- `pdfMaxBytesMb`: 호출 시점에 `maxBytesMb`가 전달되지 않았을 때 `pdf` 도구의 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` 도구의 추출 대체 모드에서 고려되는 기본 최대 페이지 수입니다.
- `verboseDefault`: 에이전트의 기본 상세 출력 수준입니다. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `toolProgressDetail`: `/verbose` 도구 요약과 진행 초안 도구 줄의 세부 정보 모드입니다. 값: `"explain"`(기본값, 간결한 사람이 읽는 레이블) 또는 `"raw"`(사용 가능한 경우 원시 명령/세부 정보 추가). 에이전트별 `agents.list[].toolProgressDetail`이 이 기본값을 재정의합니다.
- `reasoningDefault`: 에이전트의 기본 추론 표시 여부입니다. 값: `"off"`, `"on"`, `"stream"`. 에이전트별 `agents.list[].reasoningDefault`가 이 기본값을 재정의합니다. 구성된 추론 기본값은 메시지별 또는 세션 추론 재정의가 설정되지 않은 경우에만 소유자, 권한 있는 발신자, 또는 운영자 관리자 Gateway 컨텍스트에 적용됩니다.
- `elevatedDefault`: 에이전트의 기본 elevated 출력 수준입니다. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: OpenAI API 키 또는 Codex OAuth 접근용 `openai/gpt-5.5`). provider를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 그다음 해당 정확한 모델 ID와 고유하게 일치하는 구성된 provider를 시도하며, 그 후에야 구성된 기본 provider로 대체됩니다(더 이상 권장되지 않는 호환성 동작이므로 명시적인 `provider/model`을 권장합니다). 해당 provider가 구성된 기본 모델을 더 이상 노출하지 않으면 OpenClaw는 오래된 제거된 provider 기본값을 표시하는 대신 첫 번째로 구성된 provider/model로 대체됩니다.
- `models`: `/model`에 대한 구성된 모델 카탈로그와 허용 목록입니다. 각 항목에는 `alias`(단축키)와 `params`(provider별, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` 라우팅, `chat_template_kwargs`, `extra_body`/`extraBody`)를 포함할 수 있습니다.
  - 모든 모델 ID를 수동으로 나열하지 않고 선택한 provider에서 발견된 모든 모델을 표시하려면 `"openai/*": {}` 또는 `"vllm/*": {}` 같은 `provider/*` 항목을 사용하세요.
  - 해당 provider에 대해 동적으로 발견되는 모든 모델이 동일한 런타임을 사용해야 하는 경우 `provider/*` 항목에 `agentRuntime`을 추가하세요. 정확한 `provider/model` 런타임 정책은 여전히 와일드카드보다 우선합니다.
  - 안전한 편집: 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않는 한 기존 허용 목록 항목을 제거하는 교체를 거부합니다.
  - provider 범위 구성/온보딩 흐름은 선택한 provider 모델을 이 맵에 병합하고 이미 구성된 관련 없는 provider를 보존합니다.
  - 직접 OpenAI Responses 모델의 경우 서버 측 Compaction이 자동으로 활성화됩니다. `context_management` 주입을 중지하려면 `params.responsesServerCompaction: false`를 사용하고, 임계값을 재정의하려면 `params.responsesCompactThreshold`를 사용하세요. [OpenAI 서버 측 Compaction](/ko/providers/openai#server-side-compaction-responses-api)을 참조하세요.
- `params`: 모든 모델에 적용되는 전역 기본 provider 매개변수입니다. `agents.defaults.params`에 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(구성): `agents.defaults.params`(전역 기준)는 `agents.defaults.models["provider/model"].params`(모델별)에 의해 재정의되고, 그다음 `agents.list[].params`(일치하는 에이전트 ID)가 키별로 재정의합니다. 자세한 내용은 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.
- `models.providers.openrouter.params.provider`: OpenRouter 전체 기본 provider 라우팅 정책입니다. OpenClaw는 이를 OpenRouter 요청의 `provider` 객체로 전달합니다. 모델별 `agents.defaults.models["openrouter/<model>"].params.provider`와 에이전트 params가 키별로 재정의합니다. [OpenRouter provider 라우팅](/ko/providers/openrouter#advanced-configuration)을 참조하세요.
- `params.extra_body`/`params.extraBody`: OpenAI 호환 프록시용 `api: "openai-completions"` 요청 본문에 병합되는 고급 통과 JSON입니다. 생성된 요청 키와 충돌하면 추가 본문이 우선합니다. 비네이티브 completions 경로는 이후에도 OpenAI 전용 `store`를 제거합니다.
- `params.chat_template_kwargs`: 최상위 `api: "openai-completions"` 요청 본문에 병합되는 vLLM/OpenAI 호환 chat-template 인수입니다. thinking이 꺼진 `vllm/nemotron-3-*`의 경우, 번들 vLLM Plugin이 자동으로 `enable_thinking: false`와 `force_nonempty_content: true`를 전송합니다. 명시적인 `chat_template_kwargs`는 생성된 기본값을 재정의하고, `extra_body.chat_template_kwargs`가 여전히 최종 우선순위를 가집니다. 구성된 vLLM Qwen 및 Nemotron thinking 모델은 다단계 effort 계단 대신 이진 `/think` 선택지(`off`, `on`)를 노출합니다.
- `compat.thinkingFormat`: OpenAI 호환 thinking 페이로드 스타일입니다. Together 스타일 `reasoning.enabled`에는 `"together"`를, Qwen 스타일 최상위 `enable_thinking`에는 `"qwen"`을, vLLM처럼 요청 수준 chat-template kwargs를 지원하는 Qwen 계열 백엔드의 `chat_template_kwargs.enable_thinking`에는 `"qwen-chat-template"`을 사용하세요. OpenClaw는 비활성화된 thinking을 `false`로, 활성화된 thinking을 `true`로 매핑하며, 구성된 vLLM Qwen 모델은 이러한 형식에 대해 이진 `/think` 선택지를 노출합니다.
- `compat.supportedReasoningEfforts`: 모델별 OpenAI 호환 reasoning effort 목록입니다. 이를 실제로 허용하는 사용자 지정 엔드포인트에는 `"xhigh"`를 포함하세요. 그러면 OpenClaw는 해당 구성된 provider/model에 대해 명령 메뉴, Gateway 세션 행, 세션 패치 검증, 에이전트 CLI 검증, `llm-task` 검증에서 `/think xhigh`를 노출합니다. 백엔드가 정규 수준에 대해 provider별 값을 요구하는 경우 `compat.reasoningEffortMap`을 사용하세요.
- `params.preserveThinking`: 보존된 thinking을 위한 Z.AI 전용 옵트인입니다. 활성화되고 thinking이 켜져 있으면 OpenClaw는 `thinking.clear_thinking: false`를 전송하고 이전 `reasoning_content`를 재생합니다. [Z.AI thinking과 보존된 thinking](/ko/providers/zai#thinking-and-preserved-thinking)을 참조하세요.
- `localService`: 로컬/자체 호스팅 모델 서버를 위한 선택적 provider 수준 프로세스 관리자입니다. 선택된 모델이 해당 provider에 속하면 OpenClaw는 `healthUrl`(또는 `baseUrl + "/models"`)을 검사하고, 엔드포인트가 내려가 있으면 `args`와 함께 `command`를 시작하며, 최대 `readyTimeoutMs`까지 기다린 다음 모델 요청을 보냅니다. `command`는 절대 경로여야 합니다. `idleStopMs: 0`은 OpenClaw가 종료될 때까지 프로세스를 유지합니다. 양수 값은 해당 시간(밀리초)만큼 유휴 상태가 지속된 후 OpenClaw가 시작한 프로세스를 중지합니다. [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.
- 런타임 정책은 `agents.defaults`가 아니라 provider 또는 모델에 속합니다. provider 전체 규칙에는 `models.providers.<provider>.agentRuntime`을 사용하고, 모델별 규칙에는 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`을 사용하세요. 공식 OpenAI provider의 OpenAI 에이전트 모델은 기본적으로 Codex를 선택합니다.
- 이러한 필드를 변경하는 구성 작성기(예: `/models set`, `/models set-image`, 대체 추가/제거 명령)는 정규 객체 형식으로 저장하고 가능하면 기존 대체 목록을 보존합니다.
- `maxConcurrent`: 세션 간 최대 병렬 에이전트 실행 수입니다(각 세션은 여전히 직렬화됩니다). 기본값: 4.

### 런타임 정책

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, 등록된 Plugin 하네스 id, 또는 지원되는 CLI 백엔드 별칭입니다. 번들 Codex Plugin은 `codex`를 등록하고, 번들 Anthropic Plugin은 `claude-cli` CLI 백엔드를 제공합니다.
- `id: "auto"`는 등록된 Plugin 하네스가 지원되는 턴을 가져가도록 하고, 일치하는 하네스가 없으면 OpenClaw를 사용합니다. `id: "codex"` 같은 명시적 Plugin 런타임은 해당 하네스를 필요로 하며, 사용할 수 없거나 실패하면 안전하게 닫힌 상태로 실패합니다.
- `id: "pi"`는 v2026.5.22 및 이전 버전에서 배포된 설정을 보존하기 위한 `openclaw`의 폐기 예정 별칭으로만 허용됩니다. 새 설정은 `openclaw`를 사용해야 합니다.
- 런타임 우선순위는 먼저 정확한 모델 정책(`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, 또는 `models.providers.<provider>.models[]`)이고, 그다음 `agents.list[]` / `agents.defaults.models["provider/*"]`, 그다음 `models.providers.<provider>.agentRuntime`의 제공자 전체 정책입니다.
- 전체 에이전트 런타임 키는 레거시입니다. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, 세션 런타임 고정값, `OPENCLAW_AGENT_RUNTIME`은 런타임 선택에서 무시됩니다. 오래된 값을 제거하려면 `openclaw doctor --fix`를 실행하세요.
- OpenAI 에이전트 모델은 기본적으로 Codex 하네스를 사용합니다. 이를 명시하고 싶을 때 provider/model `agentRuntime.id: "codex"`는 계속 유효합니다.
- Claude CLI 배포에서는 `model: "anthropic/claude-opus-4-8"`와 모델 범위 `agentRuntime.id: "claude-cli"`를 함께 사용하는 것을 권장합니다. 레거시 `claude-cli/claude-opus-4-7` 모델 참조는 호환성을 위해 여전히 작동하지만, 새 설정은 provider/model 선택을 표준으로 유지하고 실행 백엔드는 provider/model 런타임 정책에 두어야 합니다.
- 이는 텍스트 에이전트 턴 실행만 제어합니다. 미디어 생성, 비전, PDF, 음악, 비디오, TTS는 계속 해당 provider/model 설정을 사용합니다.

**내장 별칭 단축형**(`agents.defaults.models`에 모델이 있을 때만 적용):

| 별칭                | 모델                            |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

직접 설정한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 사고 모드를 자동으로 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude Opus 4.8은 OpenClaw에서 기본적으로 사고를 꺼 둡니다. 적응형 사고가 명시적으로 활성화되면 Anthropic 제공자가 소유한 노력 수준 기본값은 `high`입니다. Claude 4.6 모델은 명시적 사고 수준이 설정되지 않았을 때 기본값이 `adaptive`입니다.

### `agents.defaults.cliBackends`

텍스트 전용 폴백 실행을 위한 선택적 CLI 백엔드입니다(도구 호출 없음). API 제공자가 실패할 때 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 백엔드는 텍스트 우선이며, 도구는 항상 비활성화됩니다.
- `sessionArg`가 설정되어 있으면 세션이 지원됩니다.
- `imageArg`가 파일 경로를 허용하면 이미지 전달이 지원됩니다.
- `reseedFromRawTranscriptWhenUncompacted: true`는 첫 번째 Compaction 요약이 존재하기 전에, 제한된 원시 OpenClaw transcript 꼬리에서 백엔드가 안전하게 무효화된 세션을 복구할 수 있게 합니다. 인증 프로필 또는 자격 증명 epoch 변경은 여전히 원시 reseed를 절대 수행하지 않습니다.

### `agents.defaults.promptOverlays`

OpenClaw가 조립한 프롬프트 표면에 모델 계열별로 적용되는 제공자 독립 프롬프트 오버레이입니다. GPT-5 계열 모델 id는 OpenClaw/provider 경로 전반에서 공유 동작 계약을 받습니다. `personality`는 친근한 상호작용 스타일 계층만 제어합니다. 네이티브 Codex 앱 서버 경로는 이 OpenClaw GPT-5 오버레이 대신 Codex가 소유한 기본/모델 지침을 유지하며, OpenClaw는 네이티브 스레드에서 Codex의 내장 personality를 비활성화합니다.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`(기본값)와 `"on"`은 친근한 상호작용 스타일 계층을 활성화합니다.
- `"off"`는 친근한 계층만 비활성화합니다. 태그가 지정된 GPT-5 동작 계약은 계속 활성화됩니다.
- 이 공유 설정이 지정되지 않은 경우 레거시 `plugins.entries.openai.config.personality`는 여전히 읽힙니다.

### `agents.defaults.heartbeat`

주기적 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 기간 문자열(ms/s/m/h). 기본값: `30m`(API 키 인증) 또는 `1h`(OAuth 인증). 비활성화하려면 `0m`으로 설정하세요.
- `includeSystemPromptSection`: false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략하고 부트스트랩 컨텍스트에 `HEARTBEAT.md`를 주입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 억제합니다.
- `timeoutSeconds`: Heartbeat 에이전트 턴이 중단되기 전에 허용되는 최대 시간(초)입니다. 설정하지 않으면, 설정된 경우 `agents.defaults.timeoutSeconds`를 사용하고, 그렇지 않으면 Heartbeat 주기를 600초로 제한한 값을 사용합니다.
- `directPolicy`: direct/DM 전달 정책입니다. `allow`(기본값)는 직접 대상 전달을 허용합니다. `block`은 직접 대상 전달을 억제하고 `reason=dm-blocked`를 내보냅니다.
- `lightContext`: true이면 Heartbeat 실행은 경량 부트스트랩 컨텍스트를 사용하고 워크스페이스 부트스트랩 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 Heartbeat가 이전 대화 기록 없이 새 세션에서 실행됩니다. cron `sessionTarget: "isolated"`와 동일한 격리 패턴입니다. Heartbeat당 토큰 비용을 약 100K에서 약 2-5K 토큰으로 줄입니다.
- `skipWhenBusy`: true이면 Heartbeat 실행은 해당 에이전트의 추가 busy lane, 즉 자체 세션 키 기반 하위 에이전트 또는 중첩 명령 작업이 있을 때 지연됩니다. Cron lane은 이 플래그가 없어도 항상 Heartbeat를 지연합니다.
- 에이전트별: `agents.list[].heartbeat`를 설정하세요. 어떤 에이전트든 `heartbeat`를 정의하면, **그 에이전트들만** Heartbeat를 실행합니다.
- Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 기록을 위한 청크 단위 요약). [Compaction](/ko/concepts/compaction)을 참조하세요.
- `provider`: 등록된 Compaction 제공자 plugin의 ID. 설정하면 내장 LLM 요약 대신 제공자의 `summarize()`가 호출됩니다. 실패하면 내장 방식으로 폴백합니다. 제공자를 설정하면 `mode: "safeguard"`가 강제됩니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
- `timeoutSeconds`: OpenClaw가 중단하기 전 단일 Compaction 작업에 허용되는 최대 시간(초)입니다. 기본값: `180`.
- `keepRecentTokens`: 가장 최근 transcript 끝부분을 원문 그대로 유지하기 위한 에이전트 절단 지점 예산입니다. 수동 `/compact`는 명시적으로 설정된 경우 이를 따르며, 그렇지 않으면 수동 Compaction은 하드 체크포인트가 됩니다.
- `identifierPolicy`: `strict`(기본값), `off` 또는 `custom`. `strict`는 Compaction 요약 중 내장 불투명 식별자 보존 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용되는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `qualityGuard`: safeguard 요약에 대한 잘못된 형식 출력 재시도 검사입니다. safeguard 모드에서 기본적으로 활성화되며, 감사를 건너뛰려면 `enabled: false`로 설정하세요.
- `midTurnPrecheck`: 선택적 도구 루프 압력 검사입니다. `enabled: true`이면 OpenClaw는 도구 결과가 추가된 뒤, 다음 모델 호출 전에 컨텍스트 압력을 검사합니다. 컨텍스트가 더 이상 맞지 않으면 프롬프트를 제출하기 전에 현재 시도를 중단하고, 기존 사전 검사 복구 경로를 재사용하여 도구 결과를 자르거나 Compaction한 뒤 재시도합니다. `default` 및 `safeguard` Compaction 모드 모두에서 작동합니다. 기본값: 비활성화.
- `postCompactionSections`: Compaction 후 다시 주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 설정하지 않거나 `[]`로 설정하면 재주입이 비활성화됩니다. `["Session Startup", "Red Lines"]`를 명시적으로 설정하면 해당 쌍이 활성화되고 기존 `Every Session`/`Safety` 폴백이 보존됩니다. 추가 컨텍스트가 Compaction 요약에 이미 캡처된 프로젝트 지침을 중복할 위험을 감수할 만큼 가치가 있을 때만 활성화하세요.
- `model`: Compaction 요약에만 사용할 선택적 `provider/model-id` 또는 `agents.defaults.models`의 단순 별칭입니다. 단순 별칭은 디스패치 전에 해석되며, 설정된 리터럴 모델 ID는 충돌 시 우선순위를 유지합니다. 기본 세션은 한 모델을 유지하되 Compaction 요약은 다른 모델에서 실행해야 할 때 사용하세요. 설정하지 않으면 Compaction은 세션의 기본 모델을 사용합니다.
- `maxActiveTranscriptBytes`: 활성 JSONL이 임계값을 초과해 커졌을 때 실행 전에 일반 로컬 Compaction을 트리거하는 선택적 바이트 임계값(`number` 또는 `"20mb"` 같은 문자열)입니다. 성공적인 Compaction이 더 작은 후속 transcript로 회전할 수 있도록 `truncateAfterCompaction`이 필요합니다. 설정하지 않거나 `0`이면 비활성화됩니다.
- `notifyUser`: `true`이면 Compaction이 시작될 때와 완료될 때 사용자에게 짧은 알림을 보냅니다(예: "Compacting context..." 및 "Compaction complete"). Compaction을 조용히 유지하기 위해 기본적으로 비활성화되어 있습니다.
- `memoryFlush`: durable memory를 저장하기 위해 자동 Compaction 전에 수행되는 조용한 에이전트 턴입니다. 이 정리 턴을 로컬 모델에 유지해야 하는 경우 `model`을 `ollama/qwen3:8b` 같은 정확한 제공자/모델로 설정하세요. 이 오버라이드는 활성 세션 폴백 체인을 상속하지 않습니다. 워크스페이스가 읽기 전용이면 건너뜁니다.

### `agents.defaults.runRetries`

실패 복구 중 무한 실행 루프를 방지하기 위한 내장 에이전트 런타임의 외부 실행 루프 재시도 반복 경계입니다. 이 설정은 현재 내장 에이전트 런타임에만 적용되며 ACP 또는 CLI 런타임에는 적용되지 않습니다.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: 외부 실행 루프의 기본 실행 재시도 반복 횟수입니다. 기본값: `24`.
- `perProfile`: 폴백 프로필 후보마다 부여되는 추가 실행 재시도 반복 횟수입니다. 기본값: `8`.
- `min`: 실행 재시도 반복의 최소 절대 한도입니다. 기본값: `32`.
- `max`: runaway 실행을 방지하기 위한 실행 재시도 반복의 최대 절대 한도입니다. 기본값: `160`.

### `agents.defaults.contextPruning`

LLM에 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크의 세션 기록은 수정하지 **않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"`은 정리 패스를 활성화합니다.
- `ttl`은 정리를 다시 실행할 수 있는 빈도(마지막 캐시 터치 이후)를 제어합니다.
- 정리는 먼저 크기가 큰 도구 결과를 소프트 트림한 다음, 필요하면 더 오래된 도구 결과를 하드 클리어합니다.
- `softTrimRatio`와 `hardClearRatio`는 `0.0`부터 `1.0`까지의 값을 허용합니다. 구성 검증은 이 범위를 벗어난 값을 거부합니다.

**소프트 트림**은 시작 부분과 끝부분을 유지하고 가운데에 `...`를 삽입합니다.

**하드 클리어**는 전체 도구 결과를 placeholder로 대체합니다.

참고:

- 이미지 블록은 절대 트림/클리어되지 않습니다.
- 비율은 정확한 토큰 수가 아니라 문자 기반(근사치)입니다.
- `keepLastAssistants`보다 assistant 메시지가 적으면 정리를 건너뜁니다.

</Accordion>

동작 세부 정보는 [세션 정리](/ko/concepts/session-pruning)를 참조하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram이 아닌 채널은 블록 답장을 활성화하려면 명시적인 `*.blockStreaming: true`가 필요합니다.
- 채널 오버라이드: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본값은 `minChars: 1500`입니다.
- `humanDelay`: 블록 답장 사이의 무작위 일시 중지입니다. `natural` = 800~2500ms. 에이전트별 오버라이드: `agents.list[].humanDelay`.

동작 및 청크 처리 세부 정보는 [스트리밍](/ko/concepts/streaming)을 참조하세요.

### 입력 표시기

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 기본값: 직접 채팅/멘션에는 `instant`, 멘션되지 않은 그룹 채팅에는 `message`.
- 세션별 오버라이드: `session.typingMode`, `session.typingIntervalSeconds`.

[입력 표시기](/ko/concepts/typing-indicators)를 참조하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

내장 에이전트를 위한 선택적 샌드박싱입니다. 전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 일반 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`이 선택되면 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH 백엔드 구성:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 워크스페이스에 사용되는 절대 원격 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 구체화하는 인라인 콘텐츠 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 호스트 키 정책 노브

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선합니다
- `certificateData`가 `certificateFile`보다 우선합니다
- `knownHostsData`가 `knownHostsFile`보다 우선합니다
- SecretRef 기반 `*Data` 값은 샌드박스 세션이 시작되기 전에 활성 secrets 런타임 스냅샷에서 해석됩니다

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 워크스페이스를 한 번 시드합니다
- 그런 다음 원격 SSH 워크스페이스를 canonical 상태로 유지합니다
- `exec`, 파일 도구, 미디어 경로를 SSH를 통해 라우팅합니다
- 원격 변경 사항을 호스트로 자동 동기화하지 않습니다
- 샌드박스 브라우저 컨테이너를 지원하지 않습니다

**워크스페이스 액세스:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 샌드박스 워크스페이스
- `ro`: `/workspace`의 샌드박스 워크스페이스, `/agent`에 읽기 전용으로 마운트된 에이전트 워크스페이스
- `rw`: `/workspace`에 읽기/쓰기 권한으로 마운트된 에이전트 워크스페이스

**범위:**

- `session`: 세션별 컨테이너 + 워크스페이스
- `agent`: 에이전트별 컨테이너 + 워크스페이스(기본값)
- `shared`: 공유 컨테이너 및 워크스페이스(세션 간 격리 없음)

**OpenShell plugin 구성:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 모드:**

- `mirror`: 실행 전에 로컬에서 원격을 시드하고, 실행 후 다시 동기화합니다. 로컬 워크스페이스가 계속 기준입니다.
- `remote`: 샌드박스가 생성될 때 원격을 한 번 시드한 다음, 원격 워크스페이스를 기준으로 유지합니다.

`remote` 모드에서는 시드 단계 이후 OpenClaw 외부에서 이루어진 호스트 로컬 편집이 샌드박스로 자동 동기화되지 않습니다.
전송은 OpenShell 샌드박스로의 SSH이지만, Plugin이 샌드박스 수명 주기와 선택적 미러 동기화를 소유합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번 실행됩니다(`sh -lc` 사용). 네트워크 송신, 쓰기 가능한 루트, 루트 사용자가 필요합니다.

**컨테이너 기본값은 `network: "none"`**입니다. 에이전트에 외부 접속이 필요하면 `"bridge"`(또는 사용자 지정 브리지 네트워크)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`는
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 명시적으로 설정하지 않는 한 기본적으로 차단됩니다(비상용).
활성 OpenClaw 샌드박스의 Codex 앱 서버 턴은 네이티브 코드 모드 네트워크 액세스에 이 동일한 송신 설정을 사용합니다.

**인바운드 첨부 파일**은 활성 워크스페이스의 `media/inbound/*`에 스테이징됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트합니다. 전역 바인드와 에이전트별 바인드가 병합됩니다.

**샌드박스 브라우저**(`sandbox.browser.enabled`): 컨테이너의 Chromium + CDP입니다. noVNC URL이 시스템 프롬프트에 주입됩니다. `openclaw.json`의 `browser.enabled`가 필요하지 않습니다.
noVNC 관찰자 액세스는 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 수명이 짧은 토큰 URL을 내보냅니다.

- `allowHostControl: false`(기본값)는 샌드박스 세션이 호스트 브라우저를 대상으로 삼지 못하게 차단합니다.
- `network` 기본값은 `openclaw-sandbox-browser`(전용 브리지 네트워크)입니다. 전역 브리지 연결을 명시적으로 원하는 경우에만 `bridge`로 설정하세요.
- `cdpSourceRange`는 선택적으로 컨테이너 경계에서 CDP 수신을 CIDR 범위로 제한합니다(예: `172.21.0.1/32`).
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 샌드박스 브라우저 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) 브라우저 컨테이너에 대해 `docker.binds`를 대체합니다.
- 실행 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다.
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`(기본적으로 활성화됨)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`는
    기본적으로 활성화되며 WebGL/3D 사용에 필요하면
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로가 확장 프로그램에 의존하는 경우 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로
    확장 프로그램을 다시 활성화합니다.
  - `--renderer-process-limit=2`는
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있습니다. Chromium의
    기본 프로세스 제한을 사용하려면 `0`으로 설정하세요.
  - 또한 `noSandbox`가 활성화된 경우 `--no-sandbox`가 추가됩니다.
  - 기본값은 컨테이너 이미지 기준선입니다. 컨테이너 기본값을 변경하려면 사용자 지정
    엔트리포인트가 있는 사용자 지정 브라우저 이미지를 사용하세요.

</Accordion>

브라우저 샌드박싱과 `sandbox.docker.binds`는 Docker 전용입니다.

이미지 빌드(소스 체크아웃에서):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

소스 체크아웃 없이 npm으로 설치하는 경우, 인라인 `docker build` 명령은 [샌드박싱 § 이미지와 설정](/ko/gateway/sandboxing#images-and-setup)을 참조하세요.

### `agents.list`(에이전트별 재정의)

`agents.list[].tts`를 사용해 에이전트에 자체 TTS 제공자, 음성, 모델,
스타일 또는 자동 TTS 모드를 지정하세요. 에이전트 블록은 전역
`messages.tts` 위에 딥 머지되므로, 공유 자격 증명은 한곳에 유지하면서 개별
에이전트는 필요한 음성 또는 제공자 필드만 재정의할 수 있습니다. 활성 에이전트의
재정의는 자동 음성 응답, `/tts audio`, `/tts status`, 그리고
`tts` 에이전트 도구에 적용됩니다. 제공자 예시와 우선순위는 [텍스트 음성 변환](/ko/tools/tts#per-agent-voice-overrides)을 참조하세요.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 안정적인 에이전트 ID입니다(필수).
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고가 기록됨). 아무것도 설정되지 않으면 첫 번째 목록 항목이 기본값입니다.
- `model`: 문자열 형식은 모델 폴백 없이 엄격한 에이전트별 기본 모델을 설정합니다. 객체 형식 `{ primary }`도 `fallbacks`를 추가하지 않는 한 엄격합니다. `{ primary, fallbacks: [...] }`를 사용하면 해당 에이전트가 폴백을 사용하도록 선택할 수 있고, `{ primary, fallbacks: [] }`를 사용하면 엄격한 동작을 명시할 수 있습니다. `primary`만 재정의하는 Cron 작업은 `fallbacks: []`를 설정하지 않는 한 여전히 기본 폴백을 상속합니다.
- `params`: `agents.defaults.models`에서 선택된 모델 항목 위에 병합되는 에이전트별 스트림 매개변수입니다. 전체 모델 카탈로그를 중복하지 않고 `cacheRetention`, `temperature`, `maxTokens` 같은 에이전트별 재정의에 사용하세요.
- `tts`: 선택적 에이전트별 텍스트 음성 변환 재정의입니다. 이 블록은 `messages.tts` 위에 딥 머지되므로, 공유 제공자 자격 증명과 폴백 정책은 `messages.tts`에 유지하고 제공자, 음성, 모델, 스타일, 자동 모드 같은 페르소나별 값만 여기에서 설정하세요.
- `skills`: 선택적 에이전트별 Skills 허용 목록입니다. 생략하면 설정된 경우 에이전트가 `agents.defaults.skills`를 상속합니다. 명시적 목록은 병합하지 않고 기본값을 대체하며, `[]`는 Skills가 없음을 의미합니다.
- `thinkingDefault`: 선택적 에이전트별 기본 사고 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`)입니다. 메시지별 또는 세션 재정의가 설정되지 않은 경우 이 에이전트에 대해 `agents.defaults.thinkingDefault`를 재정의합니다. 선택된 제공자/모델 프로필이 유효한 값을 제어합니다. Google Gemini의 경우 `adaptive`는 제공자 소유의 동적 사고를 유지합니다(Gemini 3/3.1에서는 `thinkingLevel` 생략, Gemini 2.5에서는 `thinkingBudget: -1`).
- `reasoningDefault`: 선택적 에이전트별 기본 추론 표시 여부(`on | off | stream`)입니다. 메시지별 또는 세션 추론 재정의가 설정되지 않은 경우 이 에이전트에 대해 `agents.defaults.reasoningDefault`를 재정의합니다.
- `fastModeDefault`: 빠른 모드의 선택적 에이전트별 기본값(`"auto" | true | false`)입니다. 메시지별 또는 세션 빠른 모드 재정의가 설정되지 않은 경우 적용됩니다.
- `models`: 전체 `provider/model` ID를 키로 하는 선택적 에이전트별 모델 카탈로그/런타임 재정의입니다. 에이전트별 런타임 예외에는 `models["provider/model"].agentRuntime`을 사용하세요.
- `runtime`: 선택적 에이전트별 런타임 설명자입니다. 에이전트가 ACP 하네스 세션을 기본값으로 사용해야 할 때 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)과 함께 `type: "acp"`를 사용하세요.
- `identity.avatar`: 워크스페이스 상대 경로, `http(s)` URL 또는 `data:` URI입니다.
- 로컬 워크스페이스 상대 `identity.avatar` 이미지 파일은 2MB로 제한됩니다. `http(s)` URL과 `data:` URI는 로컬 파일 크기 제한으로 확인하지 않습니다.
- `identity`는 기본값을 파생합니다. `emoji`에서 `ackReaction`, `name`/`emoji`에서 `mentionPatterns`를 파생합니다.
- `subagents.allowAgents`: 명시적 `sessions_spawn.agentId` 대상에 대해 구성된 에이전트 ID의 허용 목록입니다(`["*"]` = 구성된 모든 대상, 기본값: 동일 에이전트만). 자기 자신을 대상으로 하는 `agentId` 호출을 허용해야 하는 경우 요청자 ID를 포함하세요. 에이전트 구성이 삭제된 오래된 항목은 `sessions_spawn`에서 거부되고 `agents_list`에서 생략됩니다. 이를 정리하려면 `openclaw doctor --fix`를 실행하거나, 기본값을 상속하면서 해당 대상을 계속 스폰 가능하게 유지해야 한다면 최소한의 `agents.list[]` 항목을 추가하세요.
- 샌드박스 상속 가드: 요청자 세션이 샌드박스화되어 있으면 `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략하는 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택을 강제함, 기본값: false).

---

## 다중 에이전트 라우팅

하나의 Gateway 안에서 여러 격리된 에이전트를 실행합니다. [다중 에이전트](/ko/concepts/multi-agent)를 참조하세요.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 바인딩 일치 필드

- `type`(선택 사항): 일반 라우팅에는 `route`(type 누락 시 기본값은 route), 지속 ACP 대화 바인딩에는 `acp`입니다.
- `match.channel`(필수)
- `match.accountId`(선택 사항, `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer`(선택 사항, `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId`(선택 사항, 채널별)
- `acp`(선택 사항, `type: "acp"`에만 해당): `{ mode, label, cwd, backend }`

**결정적 일치 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확히 일치, peer/guild/team 없음)
5. `match.accountId: "*"`(채널 전체)
6. 기본 에이전트

각 계층 안에서는 처음 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 ID(`match.channel` + 계정 + `match.peer.id`)로 해석하며, 위의 라우트 바인딩 계층 순서를 사용하지 않습니다.

### 에이전트별 액세스 프로필

<Accordion title="전체 액세스(샌드박스 없음)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="읽기 전용 도구 + 워크스페이스">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="No filesystem access (messaging only)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

우선순위 세부 정보는 [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

---

## 세션

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field details">

- **`scope`**: 그룹 채팅 컨텍스트의 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 각 발신자는 채널 컨텍스트 안에서 격리된 세션을 받습니다.
  - `global`: 채널 컨텍스트의 모든 참여자가 단일 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM을 그룹화하는 방식입니다.
  - `main`: 모든 DM이 기본 세션을 공유합니다.
  - `per-peer`: 채널 전체에서 발신자 id별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(다중 사용자 받은편지함에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(다중 계정에 권장).
- **`identityLinks`**: 교차 채널 세션 공유를 위해 표준 id를 공급자 접두사가 붙은 피어에 매핑합니다. `/dock_discord` 같은 도킹 명령은 동일한 맵을 사용해 활성 세션의 답장 경로를 연결된 다른 채널 피어로 전환합니다. [채널 도킹](/ko/concepts/channel-docking)을 참조하세요.
- **`reset`**: 기본 초기화 정책입니다. `daily`는 현지 시간 `atHour`에 초기화하고, `idle`은 `idleMinutes` 이후 초기화합니다. 둘 다 구성된 경우 먼저 만료되는 쪽이 적용됩니다. 일일 초기화 신선도는 세션 행의 `sessionStartedAt`을 사용하고, 유휴 초기화 신선도는 `lastInteractionAt`을 사용합니다. Heartbeat, Cron 웨이크업, exec 알림, Gateway 장부 기록 같은 백그라운드/시스템 이벤트 쓰기는 `updatedAt`을 갱신할 수 있지만, 일일/유휴 세션을 신선하게 유지하지는 않습니다.
- **`resetByType`**: 유형별 재정의(`direct`, `group`, `thread`)입니다. 레거시 `dm`은 `direct`의 별칭으로 허용됩니다.
- **`mainKey`**: 레거시 필드입니다. 런타임은 기본 직접 채팅 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: 에이전트 간 교환 중 에이전트 사이의 최대 답장 왕복 턴 수입니다(정수, 범위: `0`-`20`, 기본값: `5`). `0`은 핑퐁 체이닝을 비활성화합니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` 별칭 포함), `keyPrefix` 또는 `rawKeyPrefix`로 매칭합니다. 첫 번째 거부가 적용됩니다.
- **`maintenance`**: 세션 저장소 정리 + 보존 제어입니다.
  - `mode`: `enforce`는 정리를 적용하며 기본값입니다. `warn`은 경고만 내보냅니다.
  - `pruneAfter`: 오래된 항목의 나이 기준값입니다(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수입니다(기본값 `500`). 런타임은 프로덕션 규모의 한도를 위해 작은 상한 버퍼로 일괄 정리를 기록합니다. `openclaw sessions cleanup --enforce`는 한도를 즉시 적용합니다.
  - 수명이 짧은 Gateway 모델 실행 프로브 세션은 고정 `24h` 보존을 사용하지만 정리는 압력 기반으로 게이트됩니다. 세션 항목 유지관리/한도 압력에 도달했을 때만 오래된 엄격 모델 실행 프로브 행을 제거합니다. `agent:*:explicit:model-run-<uuid>`와 일치하는 엄격한 명시적 프로브 키만 대상입니다. 일반 직접, 그룹, 스레드, Cron, hook, Heartbeat, ACP, 하위 에이전트 세션은 이 24시간 보존을 상속하지 않습니다. 모델 실행 정리가 실행되면 더 넓은 `pruneAfter` 오래된 항목 정리와 `maxEntries` 한도 적용 전에 실행됩니다.
  - `rotateBytes`: 사용 중단되었고 무시됩니다. `openclaw doctor --fix`는 이전 구성에서 이를 제거합니다.
  - `resetArchiveRetention`: `*.reset.<timestamp>` 트랜스크립트 아카이브의 보존 기간입니다. 기본값은 `pruneAfter`입니다. 비활성화하려면 `false`로 설정합니다.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션을 먼저 제거합니다.
  - `highWaterBytes`: 예산 정리 후 선택적 목표값입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: 스레드 바인딩 세션 기능의 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치입니다(공급자가 재정의할 수 있음. Discord는 `channels.discord.threadBindings.enabled` 사용).
  - `idleHours`: 시간 단위의 기본 비활성 자동 포커스 해제입니다(`0`은 비활성화, 공급자가 재정의할 수 있음).
  - `maxAgeHours`: 시간 단위의 기본 절대 최대 나이입니다(`0`은 비활성화, 공급자가 재정의할 수 있음).
  - `spawnSessions`: `sessions_spawn` 및 ACP 스레드 스폰에서 스레드 바인딩 작업 세션 생성을 위한 기본 게이트입니다. 스레드 바인딩이 활성화되면 기본값은 `true`입니다. 공급자/계정이 재정의할 수 있습니다.
  - `defaultSpawnContext`: 스레드 바인딩 스폰의 기본 네이티브 하위 에이전트 컨텍스트입니다(`"fork"` 또는 `"isolated"`). 기본값은 `"fork"`입니다.

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 응답 접두사

채널/계정별 재정의: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

해결 방식(가장 구체적인 항목이 우선): 계정 → 채널 → 전역. `""`는 비활성화하고 cascade를 중지합니다. `"auto"`는 `[{identity.name}]`에서 파생됩니다.

**템플릿 변수:**

| 변수              | 설명                 | 예시                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름       | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자     | `anthropic/claude-opus-4-6` |
| `{provider}`      | 공급자 이름          | `anthropic`                 |
| `{thinkingLevel}` | 현재 사고 수준       | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 ID 이름     | (`"auto"`와 동일)           |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 에이전트의 `identity.emoji`이며, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정합니다.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 해결 순서: 계정 → 채널 → `messages.ackReaction` → ID fallback.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp, iMessage처럼 반응을 지원하는 채널에서 답장 후 확인 반응을 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram, WhatsApp에서 수명 주기 상태 반응을 활성화합니다.
  Slack 및 Discord에서는 설정하지 않으면 확인 반응이 활성 상태일 때 상태 반응이 활성화된 상태로 유지됩니다.
  Signal, Telegram, WhatsApp에서는 수명 주기 상태 반응을 활성화하려면 이를 명시적으로 `true`로 설정합니다.
- `messages.statusReactions.emojis`: 수명 주기 이모지 키를 재정의합니다:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, `stallHard`.
  Telegram은 고정된 반응 세트만 허용하므로, 지원되지 않는 구성 이모지는
  해당 채팅에서 가장 가까운 지원 상태 변형으로 fallback됩니다.

### 인바운드 디바운스

동일한 발신자가 빠르게 보내는 텍스트 전용 메시지를 단일 에이전트 턴으로 묶습니다. 미디어/첨부 파일은 즉시 플러시됩니다. 제어 명령은 디바운스를 우회합니다.

### TTS(텍스트 음성 변환)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto`는 기본 자동 TTS 모드를 제어합니다: `off`, `always`, `inbound`, `tagged`. `/tts on|off`는 로컬 기본 설정을 재정의할 수 있고, `/tts status`는 유효 상태를 표시합니다.
- `summaryModel`은 자동 요약을 위해 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`입니다(옵트인).
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY`와 `OPENAI_API_KEY`로 폴백됩니다.
- 번들된 음성 제공자는 Plugin 소유입니다. `plugins.allow`가 설정되어 있으면 사용하려는 각 TTS 제공자 Plugin을 포함하세요. 예를 들어 Edge TTS에는 `microsoft`를 포함합니다. 레거시 `edge` 제공자 ID는 `microsoft`의 별칭으로 허용됩니다.
- `providers.openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 설정, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
- `providers.openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면, OpenClaw는 이를 OpenAI 호환 TTS 서버로 취급하고 모델/음성 검증을 완화합니다.

---

## Talk

Talk 모드(macOS/iOS/Android)의 기본값입니다.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 여러 Talk 제공자가 구성된 경우 `talk.provider`는 `talk.providers`의 키와 일치해야 합니다.
- 레거시 플랫 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용입니다. `openclaw doctor --fix`를 실행하여 저장된 설정을 `talk.providers.<provider>`로 다시 작성하세요.
- 음성 ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 폴백됩니다.
- `providers.*.apiKey`는 일반 텍스트 문자열 또는 SecretRef 객체를 허용합니다.
- `ELEVENLABS_API_KEY` 폴백은 Talk API 키가 구성되지 않은 경우에만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 Talk 지시문에서 친숙한 이름을 사용할 수 있습니다.
- `providers.mlx.modelId`는 macOS 로컬 MLX 헬퍼가 사용하는 Hugging Face 저장소를 선택합니다. 생략하면 macOS는 `mlx-community/Soprano-80M-bf16`을 사용합니다.
- macOS MLX 재생은 번들된 `openclaw-mlx-tts` 헬퍼가 있으면 이를 통해 실행되며, 없으면 `PATH`의 실행 파일을 통해 실행됩니다. `OPENCLAW_MLX_TTS_BIN`은 개발용 헬퍼 경로를 재정의합니다.
- `consultThinkingLevel`은 Control UI Talk 실시간 `openclaw_agent_consult` 호출 뒤의 전체 OpenClaw 에이전트 실행에 대한 사고 수준을 제어합니다. 일반 세션/모델 동작을 보존하려면 설정하지 않은 상태로 두세요.
- `consultFastMode`는 세션의 일반 fast-mode 설정을 변경하지 않고 Control UI Talk 실시간 상담에 대한 일회성 fast-mode 재정의를 설정합니다.
- `speechLocale`은 iOS/macOS Talk 음성 인식에 사용되는 BCP 47 로케일 ID를 설정합니다. 장치 기본값을 사용하려면 설정하지 않은 상태로 두세요.
- `silenceTimeoutMs`는 Talk 모드가 사용자 침묵 후 transcript를 전송하기 전에 기다리는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 일시 중지 시간(`macOS 및 Android에서는 700 ms, iOS에서는 900 ms`)을 유지합니다.
- `realtime.instructions`는 OpenClaw의 내장 실시간 프롬프트에 제공자용 시스템 지침을 추가하므로, 기본 `openclaw_agent_consult` 지침을 잃지 않고 음성 스타일을 구성할 수 있습니다.
- `realtime.consultRouting`은 실시간 제공자가 `openclaw_agent_consult` 없이 최종 사용자 transcript를 생성할 때 Gateway 릴레이 폴백을 제어합니다. `provider-direct`는 직접 제공자 응답을 보존하고, `force-agent-consult`는 최종화된 요청을 OpenClaw를 통해 라우팅합니다.

---

## 관련 항목

- [설정 참조](/ko/gateway/configuration-reference) — 기타 모든 설정 키
- [설정](/ko/gateway/configuration) — 일반 작업 및 빠른 설정
- [설정 예시](/ko/gateway/configuration-examples)
