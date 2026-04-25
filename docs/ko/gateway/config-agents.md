---
read_when:
    - 에이전트 기본값 조정하기(모델, thinking, workspace, Heartbeat, 미디어, Skills)
    - 다중 에이전트 라우팅 및 바인딩 구성하기
    - 세션, 메시지 전달, talk 모드 동작 조정하기
summary: 에이전트 기본값, 다중 에이전트 라우팅, 세션, 메시지, talk 구성
title: 구성 — 에이전트
x-i18n:
    generated_at: "2026-04-25T06:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f90c51056f82494f893eaab9e3d2acf509c05096e5a1f64b33611ca34125c2b
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, `talk.*` 아래의 에이전트 범위 구성 키입니다. 채널, 도구, gateway 런타임 및 기타
최상위 키는 [Configuration reference](/ko/gateway/configuration-reference)를 참고하세요.

## 에이전트 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system prompt의 Runtime 줄에 표시되는 선택적 리포지토리 루트입니다. 설정하지 않으면 OpenClaw가 workspace에서 위로 탐색하며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 에이전트에 대한 선택적 기본 skill allowlist입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // skill 없음
    ],
  },
}
```

- 기본적으로 제한 없는 Skills를 사용하려면 `agents.defaults.skills`를 생략하세요.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills가 없게 하려면 `agents.list[].skills: []`를 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

workspace bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap 파일을 system prompt에 언제 주입할지 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 안전한 연속 턴(완료된 assistant 응답 이후)은 workspace bootstrap 재주입을 건너뛰어 prompt 크기를 줄입니다. Heartbeat 실행과 post-Compaction 재시도는 여전히 컨텍스트를 다시 구성합니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘리기 전 workspace bootstrap 파일당 최대 문자 수입니다. 기본값: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 workspace bootstrap 파일에 걸쳐 주입되는 총 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap 컨텍스트가 잘렸을 때 에이전트에 표시되는 경고 텍스트를 제어합니다.
기본값: `"once"`.

- `"off"`: system prompt에 경고 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 시그니처마다 한 번만 경고를 주입합니다(권장).
- `"always"`: 잘림이 존재할 때마다 모든 실행에서 경고를 주입합니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 컨텍스트 예산 소유 맵

OpenClaw에는 대용량 prompt/컨텍스트 예산이 여러 개 있으며,
모두 하나의 일반적인 설정으로 흐르지 않도록 의도적으로 하위 시스템별로 분리되어 있습니다.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  일반 workspace bootstrap 주입.
- `agents.defaults.startupContext.*`:
  최근 일일
  `memory/*.md` 파일을 포함한 일회성 `/new` 및 `/reset` 시작 prelude.
- `skills.limits.*`:
  system prompt에 주입되는 압축된 Skills 목록.
- `agents.defaults.contextLimits.*`:
  제한된 런타임 발췌 및 주입되는 런타임 소유 블록.
- `memory.qmd.limits.*`:
  인덱싱된 메모리 검색 스니펫 및 주입 크기 제한.

한 에이전트에만 다른
예산이 필요할 때만 해당하는 에이전트별 재정의를 사용하세요.

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

기본 `/new` 및 `/reset`
실행에서 주입되는 첫 턴 시작 prelude를 제어합니다.

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

제한된 런타임 컨텍스트 표면을 위한 공용 기본값입니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 잘림 메타데이터와 continuation 알림이 추가되기 전
  기본 `memory_get` 발췌 제한.
- `memoryGetDefaultLines`: `lines`가
  생략되었을 때 기본 `memory_get` 줄 범위.
- `toolResultMaxChars`: 저장된 결과와
  오버플로 복구에 사용되는 실시간 도구 결과 제한.
- `postCompactionMaxChars`: post-Compaction
  새로 고침 주입 중 사용되는 AGENTS.md 발췌 제한.

#### `agents.list[].contextLimits`

공용 `contextLimits` 설정에 대한 에이전트별 재정의입니다. 생략된 필드는
`agents.defaults.contextLimits`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

system prompt에 주입되는 압축된 Skills 목록의 전역 제한입니다. 이는 필요 시 `SKILL.md` 파일을 읽는 동작에는 영향을 주지 않습니다.

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

Skills prompt 예산에 대한 에이전트별 재정의입니다.

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

provider 호출 전에 transcript/tool 이미지 블록에서 가장 긴 이미지 변의 최대 픽셀 크기입니다.
기본값: `1200`.

값이 낮을수록 일반적으로 스크린샷이 많은 실행에서 vision token 사용량과 요청 payload 크기가 줄어듭니다.
값이 높을수록 더 많은 시각적 세부 정보가 유지됩니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt 컨텍스트용 시간대입니다(메시지 타임스탬프 아님). 호스트 시간대로 fallback합니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt의 시간 형식입니다. 기본값: `auto`(OS 기본 설정).

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
      params: { cacheRetention: "long" }, // 전역 기본 provider params
      embeddedHarness: {
        runtime: "pi", // pi | auto | 등록된 harness id(예: codex)
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 문자열 형식은 primary 모델만 설정합니다.
  - 객체 형식은 primary와 순서가 있는 failover 모델을 함께 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `image` 도구 경로에서 비전 모델 config로 사용됩니다.
  - 선택된/기본 모델이 이미지 입력을 받을 수 없을 때 fallback 라우팅에도 사용됩니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공용 이미지 생성 capability와 앞으로 이미지 생성을 수행하는 모든 도구/plugin 표면에서 사용됩니다.
  - 일반적인 값: Gemini 네이티브 이미지 생성용 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, 또는 OpenAI Images용 `openai/gpt-image-2`.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증도 함께 구성하세요(예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/gpt-image-2`에는 `OPENAI_API_KEY` 또는 OpenAI Codex OAuth, `fal/*`에는 `FAL_KEY`).
  - 생략해도 `image_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 이미지 생성 provider를 provider-id 순서로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공용 음악 생성 capability와 내장 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, 또는 `minimax/music-2.5+`.
  - 생략해도 `music_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 음악 생성 provider를 provider-id 순서로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 함께 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공용 비디오 생성 capability와 내장 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, 또는 `qwen/wan2.7-r2v`.
  - 생략해도 `video_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 나머지 등록된 비디오 생성 provider를 provider-id 순서로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 함께 구성하세요.
  - 번들 Qwen 비디오 생성 provider는 최대 출력 비디오 1개, 입력 이미지 1개, 입력 비디오 4개, 길이 10초, 그리고 provider 수준 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `pdf` 도구의 모델 라우팅에 사용됩니다.
  - 생략하면 PDF 도구는 `imageModel`로 fallback한 다음, 확인된 세션/기본 모델로 fallback합니다.
- `pdfMaxBytesMb`: 호출 시점에 `maxBytesMb`가 전달되지 않았을 때 `pdf` 도구에 적용되는 기본 PDF 크기 제한.
- `pdfMaxPages`: `pdf` 도구의 추출 fallback 모드에서 고려하는 기본 최대 페이지 수.
- `verboseDefault`: 에이전트의 기본 verbose 수준. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `elevatedDefault`: 에이전트의 기본 elevated-output 수준. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: API 키 접근용 `openai/gpt-5.4` 또는 Codex OAuth용 `openai-codex/gpt-5.5`). provider를 생략하면 OpenClaw는 먼저 alias를 시도하고, 다음으로 정확한 모델 id에 대한 고유한 구성 provider 일치를 찾은 뒤, 그 다음에만 구성된 기본 provider로 fallback합니다(지원 중단된 호환 동작이므로 명시적인 `provider/model`을 권장). 해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면, OpenClaw는 오래되어 제거된 provider 기본값을 표시하는 대신 첫 번째 구성된 provider/model으로 fallback합니다.
- `models`: `/model`용으로 구성된 모델 카탈로그이자 allowlist입니다. 각 항목은 `alias`(단축키)와 `params`(provider별 설정값, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`)를 포함할 수 있습니다.
  - 안전한 편집: 항목 추가에는 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않는 한 기존 allowlist 항목을 제거하는 대체 작업을 거부합니다.
  - provider 범위 configure/onboarding 흐름은 선택된 provider 모델을 이 맵에 병합하고 이미 구성된 관련 없는 provider는 보존합니다.
  - 직접 OpenAI Responses 모델의 경우 서버 측 Compaction이 자동 활성화됩니다. `context_management` 주입을 중지하려면 `params.responsesServerCompaction: false`를 사용하고, 임계값을 재정의하려면 `params.responsesCompactThreshold`를 사용하세요. 자세한 내용은 [OpenAI server-side compaction](/ko/providers/openai#server-side-compaction-responses-api)를 참고하세요.
- `params`: 모든 모델에 적용되는 전역 기본 provider 파라미터입니다. `agents.defaults.params`에서 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(config): `agents.defaults.params`(전역 기본값)가 `agents.defaults.models["provider/model"].params`(모델별)로 재정의되고, 그 다음 `agents.list[].params`(일치하는 에이전트 id)가 키별로 재정의합니다. 자세한 내용은 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.
- `params.extra_body`/`params.extraBody`: OpenAI 호환 프록시의 `api: "openai-completions"` 요청 본문에 병합되는 고급 pass-through JSON입니다. 생성된 요청 키와 충돌하면 extra body가 우선하며, 네이티브가 아닌 completions 경로는 이후에도 OpenAI 전용 `store`를 제거합니다.
- `embeddedHarness`: 기본 하위 수준 임베디드 에이전트 런타임 정책입니다. runtime을 생략하면 기본값은 OpenClaw Pi입니다. `runtime: "pi"`는 내장 PI harness를 강제하고, `runtime: "auto"`는 등록된 plugin harness가 지원하는 모델을 처리하도록 하며, `runtime: "codex"`처럼 등록된 harness id를 지정할 수도 있습니다. 자동 PI fallback을 비활성화하려면 `fallback: "none"`을 설정하세요. `codex` 같은 명시적 plugin runtime은 같은 재정의 범위에서 `fallback: "pi"`를 설정하지 않는 한 기본적으로 fail closed입니다. 모델 ref는 `provider/model`의 표준 형식으로 유지하고, Codex, Claude CLI, Gemini CLI 및 기타 실행 백엔드는 레거시 runtime provider 접두사 대신 runtime config를 통해 선택하세요. provider/model 선택과 어떻게 다른지는 [Agent runtimes](/ko/concepts/agent-runtimes)를 참고하세요.
- 이 필드를 변경하는 config 작성기(예: `/models set`, `/models set-image`, fallback 추가/제거 명령)는 가능한 경우 표준 객체 형식으로 저장하고 기존 fallback 목록을 보존합니다.
- `maxConcurrent`: 세션 전체에서 병렬 에이전트 실행의 최대 수입니다(각 세션은 여전히 직렬화됨). 기본값: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`는 어떤 하위 수준 실행기가 임베디드 에이전트 턴을 실행할지 제어합니다.
대부분의 배포에서는 기본 OpenClaw Pi 런타임을 유지해야 합니다.
번들
Codex app-server harness와 같이 신뢰할 수 있는 plugin이 네이티브 harness를 제공할 때 사용하세요. 개념적 모델은
[Agent runtimes](/ko/concepts/agent-runtimes)를 참고하세요.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"`, 또는 등록된 plugin harness id. 번들 Codex plugin은 `codex`를 등록합니다.
- `fallback`: `"pi"` 또는 `"none"`. `runtime: "auto"`에서는 생략된 fallback의 기본값이 `"pi"`이므로 오래된 config도 어떤 plugin harness도 실행을 처리하지 않을 때 PI를 계속 사용할 수 있습니다. `runtime: "codex"` 같은 명시적 plugin runtime 모드에서는 생략된 fallback의 기본값이 `"none"`이므로 harness가 없으면 조용히 PI를 사용하는 대신 실패합니다. runtime 재정의는 더 넓은 범위의 fallback을 상속하지 않으므로, 의도적으로 해당 호환 fallback을 원할 때는 명시적 runtime과 함께 `fallback: "pi"`를 설정하세요. 선택된 plugin harness 실패는 항상 직접 노출됩니다.
- 환경 변수 재정의: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`는 `runtime`을 재정의하고, `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none`은 해당 프로세스의 fallback을 재정의합니다.
- Codex 전용 배포의 경우 `model: "openai/gpt-5.5"`와 `embeddedHarness.runtime: "codex"`를 설정하세요. 가독성을 위해 `embeddedHarness.fallback: "none"`도 명시적으로 설정할 수 있으며, 이는 명시적 plugin runtime의 기본값입니다.
- harness 선택은 첫 번째 임베디드 실행 이후 세션 id별로 고정됩니다. config/env 변경은 새 세션 또는 재설정된 세션에만 영향을 주며, 기존 transcript에는 영향을 주지 않습니다. transcript 히스토리는 있지만 기록된 고정값이 없는 레거시 세션은 PI에 고정된 것으로 처리됩니다. `/status`는 `Runtime: OpenClaw Pi Default` 또는 `Runtime: OpenAI Codex`처럼 유효 runtime을 보고합니다.
- 이는 임베디드 채팅 harness만 제어합니다. 미디어 생성, vision, PDF, 음악, 비디오, TTS는 여전히 각 provider/model 설정을 사용합니다.

**내장 alias 단축키**(`agents.defaults.models`에 모델이 있을 때만 적용됨):

| Alias               | 모델                                               |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` 또는 구성된 Codex OAuth GPT-5.5   |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

구성한 alias는 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 자동으로 thinking 모드를 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않으면 기본적으로 `adaptive` thinking을 사용합니다.

### `agents.defaults.cliBackends`

텍스트 전용 fallback 실행(도구 호출 없음)을 위한 선택적 CLI 백엔드입니다. API provider가 실패할 때 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
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
- `sessionArg`가 설정된 경우 세션을 지원합니다.
- `imageArg`가 파일 경로를 받을 수 있으면 이미지 pass-through를 지원합니다.

### `agents.defaults.systemPromptOverride`

OpenClaw가 조합한 전체 system prompt를 고정 문자열로 교체합니다. 기본 수준(`agents.defaults.systemPromptOverride`) 또는 에이전트별(`agents.list[].systemPromptOverride`)로 설정할 수 있습니다. 에이전트별 값이 우선하며, 빈 값 또는 공백만 있는 값은 무시됩니다. 통제된 prompt 실험에 유용합니다.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

모델 계열별로 적용되는 provider 독립적 prompt overlay입니다. GPT-5 계열 모델 id는 provider 전반에서 공용 동작 계약을 적용받으며, `personality`는 친화적인 상호작용 스타일 계층만 제어합니다.

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

- `"friendly"`(기본값)와 `"on"`은 친화적인 상호작용 스타일 계층을 활성화합니다.
- `"off"`는 친화적인 계층만 비활성화하며, 태그된 GPT-5 동작 계약은 계속 활성화됩니다.
- 레거시 `plugins.entries.openai.config.personality`는 이 공용 설정이 없을 때 여전히 읽힙니다.

### `agents.defaults.heartbeat`

주기적인 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m이면 비활성화
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 기본값: true; false이면 system prompt에서 Heartbeat 섹션 생략
        lightContext: false, // 기본값: false; true이면 workspace bootstrap 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true이면 각 heartbeat를 새 세션에서 실행(대화 기록 없음)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow(기본값) | block
        target: "none", // 기본값: none | 옵션: last | whatsapp | telegram | discord | ...
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
- `includeSystemPromptSection`: false이면 system prompt에서 Heartbeat 섹션을 생략하고 bootstrap 컨텍스트에 `HEARTBEAT.md`를 주입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 heartbeat 실행 중 도구 오류 경고 payload를 표시하지 않습니다.
- `timeoutSeconds`: 중단되기 전 heartbeat 에이전트 턴에 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`를 사용합니다.
- `directPolicy`: direct/DM 전달 정책입니다. `allow`(기본값)는 direct 대상 전달을 허용합니다. `block`은 direct 대상 전달을 억제하고 `reason=dm-blocked`를 기록합니다.
- `lightContext`: true이면 heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 heartbeat는 이전 대화 기록 없이 새 세션에서 실행됩니다. cron `sessionTarget: "isolated"`와 같은 격리 패턴입니다. heartbeat당 token 비용을 약 100K에서 약 2~5K token으로 줄입니다.
- 에이전트별: `agents.list[].heartbeat`를 설정하세요. 어떤 에이전트든 `heartbeat`를 정의하면 **그 에이전트들만** Heartbeat를 실행합니다.
- Heartbeat는 전체 에이전트 턴을 실행하므로, 간격이 짧을수록 더 많은 token을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 등록된 compaction provider plugin의 id(선택 사항)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom일 때 사용
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // []이면 재주입 비활성화
        model: "openrouter/anthropic/claude-sonnet-4-6", // 선택적 compaction 전용 모델 재정의
        notifyUser: true, // compaction 시작/완료 시 짧은 알림 전송(기본값: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 히스토리를 위한 청크 단위 요약). 자세한 내용은 [Compaction](/ko/concepts/compaction)을 참고하세요.
- `provider`: 등록된 compaction provider plugin의 id입니다. 설정되면 내장 LLM 요약 대신 provider의 `summarize()`가 호출됩니다. 실패하면 내장 방식으로 fallback합니다. provider를 설정하면 `mode: "safeguard"`가 강제됩니다. 자세한 내용은 [Compaction](/ko/concepts/compaction)을 참고하세요.
- `timeoutSeconds`: 단일 compaction 작업에 허용되는 최대 시간(초)입니다. 기본값: `900`.
- `keepRecentTokens`: 가장 최근 transcript tail을 원문 그대로 유지하기 위한 Pi cut-point 예산입니다. 수동 `/compact`는 명시적으로 설정되었을 때 이를 따르며, 그렇지 않으면 수동 compaction은 하드 체크포인트입니다.
- `identifierPolicy`: `strict`(기본값), `off`, 또는 `custom`. `strict`는 compaction 요약 중 내장된 불투명 식별자 보존 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용되는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `qualityGuard`: safeguard 요약에 대한 잘못된 출력 재시도 검사입니다. safeguard 모드에서는 기본적으로 활성화되며, 감사를 건너뛰려면 `enabled: false`로 설정하세요.
- `postCompactionSections`: compaction 후 다시 주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 기본값은 `["Session Startup", "Red Lines"]`이며, 재주입을 비활성화하려면 `[]`로 설정하세요. 설정하지 않았거나 명시적으로 해당 기본 쌍으로 설정된 경우, 이전 `Every Session`/`Safety` 제목도 레거시 fallback으로 허용됩니다.
- `model`: compaction 요약 전용 선택적 `provider/model-id` 재정의입니다. 메인 세션은 하나의 모델을 유지하고 compaction 요약은 다른 모델에서 실행되도록 하려면 이를 사용하세요. 설정하지 않으면 compaction은 세션의 primary 모델을 사용합니다.
- `notifyUser`: `true`이면 compaction 시작과 완료 시 사용자에게 짧은 알림을 보냅니다(예: "Compacting context..." 및 "Compaction complete"). 기본적으로는 compaction을 조용하게 유지하기 위해 비활성화됩니다.
- `memoryFlush`: 자동 compaction 전에 내구성 있는 메모리를 저장하기 위한 조용한 에이전트 턴입니다. workspace가 읽기 전용이면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM으로 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크에 저장된 세션 히스토리는 **수정하지 않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 기간(ms/s/m/h), 기본 단위: 분
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

<Accordion title="cache-ttl 모드 동작">

- `mode: "cache-ttl"`은 정리 패스를 활성화합니다.
- `ttl`은 정리를 다시 실행할 수 있는 빈도를 제어합니다(마지막 캐시 접근 이후).
- 정리는 먼저 너무 큰 도구 결과를 soft-trim하고, 필요하면 더 오래된 도구 결과를 hard-clear합니다.

**Soft-trim**은 앞부분과 끝부분을 유지하고 중간에 `...`를 삽입합니다.

**Hard-clear**는 전체 도구 결과를 placeholder로 교체합니다.

참고:

- 이미지 블록은 절대 trim/clear되지 않습니다.
- 비율은 정확한 token 수가 아니라 문자 수 기반의 근사치입니다.
- assistant 메시지가 `keepLastAssistants`보다 적으면 정리를 건너뜁니다.

</Accordion>

동작 세부 사항은 [Session Pruning](/ko/concepts/session-pruning)을 참고하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs 사용)
    },
  },
}
```

- Telegram이 아닌 채널은 블록 응답을 활성화하려면 명시적인 `*.blockStreaming: true`가 필요합니다.
- 채널 재정의: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본 `minChars`는 `1500`입니다.
- `humanDelay`: 블록 응답 사이의 무작위 대기입니다. `natural` = 800–2500ms. 에이전트별 재정의: `agents.list[].humanDelay`.

동작 및 청킹 세부 사항은 [Streaming](/ko/concepts/streaming)을 참고하세요.

### 입력 중 표시기

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

- 기본값: direct 채팅/멘션에는 `instant`, 멘션되지 않은 그룹 채팅에는 `message`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

자세한 내용은 [Typing Indicators](/ko/concepts/typing-indicators)를 참고하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

임베디드 에이전트를 위한 선택적 sandboxing입니다. 전체 가이드는 [Sandboxing](/ko/gateway/sandboxing)을 참고하세요.

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
          // SecretRef / 인라인 내용도 지원:
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

<Accordion title="Sandbox 세부 사항">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 일반 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`을 선택하면 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH 백엔드 config:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 workspace에 사용되는 절대 원격 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 구체화하는 인라인 내용 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key 정책 설정값

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선합니다
- `certificateData`가 `certificateFile`보다 우선합니다
- `knownHostsData`가 `knownHostsFile`보다 우선합니다
- SecretRef 기반 `*Data` 값은 sandbox 세션 시작 전에 활성 secrets 런타임 스냅샷에서 확인됩니다

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 workspace를 한 번 시드합니다
- 이후 원격 SSH workspace를 기준본으로 유지합니다
- `exec`, 파일 도구, 미디어 경로를 SSH를 통해 라우팅합니다
- 원격 변경 사항을 자동으로 호스트에 다시 동기화하지 않습니다
- sandbox browser 컨테이너를 지원하지 않습니다

**Workspace 접근:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 sandbox workspace
- `ro`: `/workspace`의 sandbox workspace, `/agent`에 읽기 전용으로 마운트된 에이전트 workspace
- `rw`: `/workspace`에 읽기/쓰기로 마운트된 에이전트 workspace

**범위:**

- `session`: 세션별 컨테이너 + workspace
- `agent`: 에이전트별 하나의 컨테이너 + workspace(기본값)
- `shared`: 공유 컨테이너 및 workspace(세션 간 격리 없음)

**OpenShell plugin config:**

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

- `mirror`: exec 전에 로컬에서 원격으로 시드하고 exec 후 다시 동기화합니다. 로컬 workspace가 기준본으로 유지됩니다
- `remote`: sandbox가 생성될 때 원격을 한 번 시드한 뒤 원격 workspace를 기준본으로 유지합니다

`remote` 모드에서는 OpenClaw 외부에서 이루어진 호스트 로컬 편집이 시드 단계 이후 sandbox로 자동 동기화되지 않습니다.
전송은 OpenShell sandbox로의 SSH이지만, sandbox 수명 주기와 선택적 mirror sync는 plugin이 관리합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번 실행됩니다(`sh -lc` 사용). 네트워크 송신, 쓰기 가능한 루트, 루트 사용자가 필요합니다.

**컨테이너 기본값은 `network: "none"`**입니다 — 에이전트에 아웃바운드 접근이 필요하면 `"bridge"`(또는 사용자 지정 bridge network)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`도 기본적으로 차단되며,
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 명시적으로 설정한 경우에만 허용됩니다(비상용).

**인바운드 첨부 파일**은 활성 workspace의 `media/inbound/*`에 staging됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 및 에이전트별 bind는 병합됩니다.

**Sandboxed browser**(`sandbox.browser.enabled`): 컨테이너 안의 Chromium + CDP입니다. noVNC URL이 system prompt에 주입됩니다. `openclaw.json`에서 `browser.enabled`가 필요하지 않습니다.
noVNC 관찰자 접근은 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 짧은 수명의 토큰 URL을 생성합니다.

- `allowHostControl: false`(기본값)는 sandbox 세션이 호스트 browser를 대상으로 삼는 것을 차단합니다.
- `network` 기본값은 `openclaw-sandbox-browser`(전용 bridge network)입니다. 전역 bridge 연결이 명시적으로 필요할 때만 `bridge`로 설정하세요.
- `cdpSourceRange`는 선택적으로 컨테이너 경계에서 CDP 인바운드 접근을 CIDR 범위로 제한합니다(예: `172.21.0.1/32`).
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 sandbox browser 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) browser 컨테이너에서는 `docker.binds`를 대체합니다.
- 시작 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다:
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
    기본적으로 활성화되며, WebGL/3D 사용에 필요하면
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로가 확장 기능에
    의존하는 경우 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 확장 기능을 다시 활성화합니다.
  - `--renderer-process-limit=2`는
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있으며, Chromium의
    기본 프로세스 제한을 사용하려면 `0`으로 설정하세요.
  - 그리고 `noSandbox`가 활성화된 경우 `--no-sandbox` 및 `--disable-setuid-sandbox`.
  - 기본값은 컨테이너 이미지 기준값이며, 컨테이너 기본값을 변경하려면 사용자 지정
    entrypoint가 있는 사용자 지정 browser 이미지를 사용하세요.

</Accordion>

Browser sandboxing과 `sandbox.docker.binds`는 Docker 전용입니다.

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # 메인 sandbox 이미지
scripts/sandbox-browser-setup.sh   # 선택적 browser 이미지
```

### `agents.list`(에이전트별 재정의)

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
        model: "anthropic/claude-opus-4-6", // 또는 { primary, fallbacks }
        thinkingDefault: "high", // 에이전트별 thinking 수준 재정의
        reasoningDefault: "on", // 에이전트별 reasoning 가시성 재정의
        fastModeDefault: false, // 에이전트별 fast mode 재정의
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 일치하는 defaults.models params를 키별로 재정의
        skills: ["docs-search"], // 설정되면 agents.defaults.skills를 대체
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

- `id`: 안정적인 에이전트 id(필수).
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 로그 기록). 아무것도 설정되지 않으면 첫 번째 목록 항목이 기본값입니다.
- `model`: 문자열 형식은 `primary`만 재정의하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 재정의합니다(`[]`는 전역 fallback 비활성화). `primary`만 재정의하는 Cron 작업은 `fallbacks: []`를 설정하지 않는 한 여전히 기본 fallback을 상속합니다.
- `params`: `agents.defaults.models`의 선택된 모델 항목 위에 병합되는 에이전트별 스트림 params입니다. 전체 모델 카탈로그를 복제하지 않고 `cacheRetention`, `temperature`, `maxTokens` 같은 에이전트별 재정의에 사용하세요.
- `skills`: 선택적 에이전트별 skill allowlist. 생략하면 에이전트는 설정된 경우 `agents.defaults.skills`를 상속하고, 명시적 목록은 병합 대신 기본값을 대체하며, `[]`는 skill 없음입니다.
- `thinkingDefault`: 선택적 에이전트별 기본 thinking 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`). 메시지별 또는 세션별 재정의가 없을 때 이 에이전트에 대해 `agents.defaults.thinkingDefault`를 재정의합니다. 선택한 provider/model 프로필이 어떤 값이 유효한지 제어합니다. Google Gemini의 경우 `adaptive`는 provider 소유의 동적 thinking을 유지합니다(Gemini 3/3.1에서는 `thinkingLevel` 생략, Gemini 2.5에서는 `thinkingBudget: -1`).
- `reasoningDefault`: 선택적 에이전트별 기본 reasoning 가시성(`on | off | stream`). 메시지별 또는 세션별 reasoning 재정의가 없을 때 적용됩니다.
- `fastModeDefault`: 선택적 에이전트별 기본 fast mode(`true | false`). 메시지별 또는 세션별 fast-mode 재정의가 없을 때 적용됩니다.
- `embeddedHarness`: 선택적 에이전트별 하위 수준 harness 정책 재정의입니다. 한 에이전트만 Codex 전용으로 만들고 다른 에이전트는 `auto` 모드의 기본 PI fallback을 유지하려면 `{ runtime: "codex" }`를 사용하세요.
- `runtime`: 선택적 에이전트별 runtime descriptor입니다. 에이전트가 기본적으로 ACP harness 세션을 사용해야 할 때는 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)과 함께 `type: "acp"`를 사용하세요.
- `identity.avatar`: workspace 기준 상대 경로, `http(s)` URL 또는 `data:` URI.
- `identity`는 기본값을 파생합니다: `emoji`에서 `ackReaction`, `name`/`emoji`에서 `mentionPatterns`.
- `subagents.allowAgents`: `sessions_spawn`용 에이전트 id allowlist(`["*"]` = 아무 에이전트나; 기본값: 같은 에이전트만).
- Sandbox 상속 보호: 요청자 세션이 sandboxed 상태이면 `sessions_spawn`은 sandbox 없이 실행될 대상을 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제, 기본값: false).

---

## 다중 에이전트 라우팅

하나의 Gateway 안에서 여러 개의 격리된 에이전트를 실행합니다. 자세한 내용은 [Multi-Agent](/ko/concepts/multi-agent)를 참고하세요.

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

- `type`(선택 사항): 일반 라우팅용 `route`(type이 없으면 기본값은 route), 영구 ACP 대화 바인딩용 `acp`
- `match.channel`(필수)
- `match.accountId`(선택 사항; `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer`(선택 사항; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId`(선택 사항; 채널별)
- `acp`(선택 사항; `type: "acp"`에만 해당): `{ mode, label, cwd, backend }`

**결정적 일치 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확 일치, peer/guild/team 없음)
5. `match.accountId: "*"`(채널 전체)
6. 기본 에이전트

같은 단계 안에서는 먼저 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 ID(`match.channel` + account + `match.peer.id`)로 확인하며 위의 route 바인딩 단계 순서를 사용하지 않습니다.

### 에이전트별 접근 프로필

<Accordion title="전체 접근(샌드박스 없음)">

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

<Accordion title="읽기 전용 도구 + workspace">

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

<Accordion title="파일 시스템 접근 없음(메시징 전용)">

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

우선순위 세부 사항은 [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

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
    parentForkMaxTokens: 100000, // 이 token 수를 넘으면 부모 thread 포크 건너뜀(0이면 비활성화)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 기간 또는 false
      maxDiskBytes: "500mb", // 선택적 하드 예산
      highWaterBytes: "400mb", // 선택적 정리 목표
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 기본 비활성 자동 unfocus 시간(0이면 비활성화)
      maxAgeHours: 0, // 기본 하드 최대 사용 시간(0이면 비활성화)
    },
    mainKey: "main", // 레거시(런타임은 항상 "main" 사용)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="세션 필드 세부 사항">

- **`scope`**: 그룹 채팅 컨텍스트를 위한 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 채널 컨텍스트 내에서 각 발신자는 격리된 세션을 가집니다.
  - `global`: 채널 컨텍스트의 모든 참가자가 하나의 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM을 어떻게 그룹화할지 정의합니다.
  - `main`: 모든 DM이 main 세션을 공유합니다.
  - `per-peer`: 채널 전체에서 발신자 id별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(다중 사용자 inbox에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(다중 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위한 provider 접두사가 붙은 peer를 표준 id에 매핑합니다.
- **`reset`**: 기본 reset 정책입니다. `daily`는 로컬 시간 `atHour`에 reset하고, `idle`은 `idleMinutes` 후 reset합니다. 둘 다 설정된 경우 먼저 만료되는 쪽이 우선합니다.
- **`resetByType`**: 유형별 재정의(`direct`, `group`, `thread`). 레거시 `dm`도 `direct`의 alias로 허용됩니다.
- **`parentForkMaxTokens`**: 포크된 thread 세션을 만들 때 허용되는 부모 세션 `totalTokens`의 최대값입니다(기본값 `100000`).
  - 부모 `totalTokens`가 이 값을 초과하면, OpenClaw는 부모 transcript 히스토리를 상속하는 대신 새 thread 세션을 시작합니다.
  - 이 보호 기능을 비활성화하고 항상 부모 포크를 허용하려면 `0`으로 설정하세요.
- **`mainKey`**: 레거시 필드입니다. 런타임은 main direct-chat 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: 에이전트 간 교환 중 에이전트 사이의 최대 응답 왕복 턴 수입니다(정수, 범위: `0`–`5`). `0`이면 ping-pong 체인이 비활성화됩니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` alias 포함), `keyPrefix`, 또는 `rawKeyPrefix`로 일치시킵니다. 첫 번째 deny가 우선합니다.
- **`maintenance`**: 세션 저장소 정리 및 보존 제어입니다.
  - `mode`: `warn`은 경고만 기록하고, `enforce`는 정리를 실제로 적용합니다.
  - `pruneAfter`: 오래된 항목의 보존 기간 기준값입니다(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수입니다(기본값 `500`).
  - `rotateBytes`: `sessions.json`이 이 크기를 넘으면 회전합니다(기본값 `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive의 보존 기간입니다. 기본값은 `pruneAfter`이며, 비활성화하려면 `false`로 설정하세요.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후 도달할 선택적 목표값입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: thread 바인딩 세션 기능에 대한 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치(provider가 재정의 가능, Discord는 `channels.discord.threadBindings.enabled` 사용)
  - `idleHours`: 기본 비활성 자동 unfocus 시간(`0`이면 비활성화, provider가 재정의 가능)
  - `maxAgeHours`: 기본 하드 최대 사용 시간(`0`이면 비활성화, provider가 재정의 가능)

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0이면 비활성화
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

확인 순서(가장 구체적인 항목 우선): account → channel → global. `""`는 비활성화하며 상위 확인도 중단합니다. `"auto"`는 `[{identity.name}]`를 생성합니다.

**템플릿 변수:**

| 변수              | 설명                | 예시                        |
| ----------------- | ------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름      | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자    | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 이름       | `anthropic`                 |
| `{thinkingLevel}` | 현재 thinking 수준  | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 ID 이름    | (`"auto"`와 동일)           |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 alias입니다.

### ack 반응

- 기본값은 활성 에이전트의 `identity.emoji`이며, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 확인 순서: account → channel → `messages.ackReaction` → ID fallback.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram에서 응답 후 ack를 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram에서 수명 주기 상태 반응을 활성화합니다.
  Slack과 Discord에서는 설정하지 않으면 ack 반응이 활성화된 경우 상태 반응도 활성화된 상태를 유지합니다.
  Telegram에서는 수명 주기 상태 반응을 활성화하려면 명시적으로 `true`로 설정해야 합니다.

### 인바운드 debounce

같은 발신자의 빠른 텍스트 전용 메시지를 하나의 에이전트 턴으로 묶습니다. 미디어/첨부 파일은 즉시 flush됩니다. 제어 명령은 debounce를 우회합니다.

### TTS(text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
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
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto`는 기본 자동 TTS 모드를 제어합니다: `off`, `always`, `inbound`, 또는 `tagged`. `/tts on|off`는 로컬 설정을 재정의할 수 있으며, `/tts status`는 유효 상태를 표시합니다.
- `summaryModel`은 자동 요약에 대해 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`입니다(opt-in).
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 fallback합니다.
- 번들 음성 provider는 plugin이 소유합니다. `plugins.allow`가 설정되어 있으면 사용하려는 각 TTS provider plugin을 포함하세요. 예를 들어 Edge TTS에는 `microsoft`를 포함합니다. 레거시 `edge` provider id는 `microsoft`의 alias로 허용됩니다.
- `providers.openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
- `providers.openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면, OpenClaw는 이를 OpenAI 호환 TTS 서버로 처리하고 모델/음성 검증을 완화합니다.

---

## Talk

Talk 모드(macOS/iOS/Android)의 기본값입니다.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider`는 여러 Talk provider가 구성된 경우 `talk.providers`의 키와 일치해야 합니다.
- 레거시 평면 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용이며 자동으로 `talk.providers.<provider>`로 마이그레이션됩니다.
- 음성 ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 fallback합니다.
- `providers.*.apiKey`는 일반 텍스트 문자열 또는 SecretRef 객체를 받을 수 있습니다.
- `ELEVENLABS_API_KEY` fallback은 Talk API 키가 구성되지 않았을 때만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 Talk 지시어에서 친숙한 이름을 사용할 수 있습니다.
- `silenceTimeoutMs`는 사용자가 말을 멈춘 뒤 Talk 모드가 transcript를 전송하기 전에 대기하는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 대기 창이 유지됩니다(`macOS 및 Android는 700 ms, iOS는 900 ms`).

---

## 관련

- [Configuration reference](/ko/gateway/configuration-reference) — 기타 모든 config 키
- [Configuration](/ko/gateway/configuration) — 일반 작업 및 빠른 설정
- [Configuration examples](/ko/gateway/configuration-examples)
