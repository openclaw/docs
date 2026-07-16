---
read_when:
    - 에이전트 기본값 조정(모델, 사고, 작업 공간, Heartbeat, 미디어, Skills)
    - 멀티 에이전트 라우팅 및 바인딩 구성하기
    - 세션, 메시지 전송 및 대화 모드 동작 조정
summary: 에이전트 기본값, 멀티 에이전트 라우팅, 세션, 메시지 및 대화 구성
title: 구성 — 에이전트
x-i18n:
    generated_at: "2026-07-16T12:36:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, `talk.*` 아래의 에이전트 범위 구성 키입니다. 채널, 도구, Gateway 런타임 및 기타
최상위 키에 대해서는 [구성 참조](/ko/gateway/configuration-reference)를 참조하십시오.

## 에이전트 기본값

### `agents.defaults.workspace`

기본값: 설정된 경우 `OPENCLAW_WORKSPACE_DIR`, 그렇지 않으면 `~/.openclaw/workspace`(또는 `OPENCLAW_PROFILE`가 기본값이 아닌 프로필로 설정된 경우 `~/.openclaw/workspace-<profile>`)입니다.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

명시적인 `agents.defaults.workspace` 값은
`OPENCLAW_WORKSPACE_DIR`보다 우선합니다. 해당 경로를 구성에 기록하지 않고 기본 에이전트가
마운트된 작업 공간을 가리키도록 하려면 환경 변수를 사용하십시오.

### `agents.defaults.repoRoot`

시스템 프롬프트의 런타임 줄에 표시되는 선택적 저장소 루트입니다. 설정하지 않으면 OpenClaw가 작업 공간에서 위쪽으로 이동하며 자동으로 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 에이전트를 위한 선택적 기본 Skills 허용 목록입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

- 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하십시오.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하십시오.
- Skills를 사용하지 않으려면 `agents.list[].skills: []`을 설정하십시오.
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

필수 부트스트랩 파일(`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`)은 계속 작성하면서 선택한 작업 공간 파일의 생성을 건너뜁니다. 유효한 값: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, `IDENTITY.md`.

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

작업 공간 부트스트랩 파일을 시스템 프롬프트에 삽입하는 시점을 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 안전한 연속 턴(완료된 어시스턴트 응답 이후)에서는 작업 공간 부트스트랩의 재삽입을 건너뛰어 프롬프트 크기를 줄입니다. Heartbeat 실행 및 Compaction 이후 재시도에서는 계속 컨텍스트를 다시 구성합니다.
- `"never"`: 모든 턴에서 작업 공간 부트스트랩과 컨텍스트 파일 삽입을 비활성화합니다. 프롬프트 수명 주기를 완전히 자체 관리하는 에이전트(사용자 지정 컨텍스트 엔진, 자체 컨텍스트를 구성하는 네이티브 런타임 또는 부트스트랩이 없는 특수 워크플로)에만 사용하십시오. Heartbeat 및 Compaction 복구 턴에서도 삽입을 건너뜁니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

에이전트별 재정의: `agents.list[].contextInjection`. 생략된 값은
`agents.defaults.contextInjection`을 상속합니다.

### `agents.defaults.bootstrapMaxChars`

잘리기 전 작업 공간 부트스트랩 파일별 최대 문자 수입니다. 기본값: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

에이전트별 재정의: `agents.list[].bootstrapMaxChars`. 생략된 값은
`agents.defaults.bootstrapMaxChars`을 상속합니다.

### `agents.defaults.bootstrapTotalMaxChars`

모든 작업 공간 부트스트랩 파일에서 삽입되는 총 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

에이전트별 재정의: `agents.list[].bootstrapTotalMaxChars`. 생략된 값은
`agents.defaults.bootstrapTotalMaxChars`을 상속합니다.

### 에이전트별 부트스트랩 프로필 재정의

한 에이전트에 공유 기본값과 다른 프롬프트 삽입 동작이 필요한 경우 에이전트별 부트스트랩 프로필 재정의를 사용하십시오. 생략된 필드는
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

부트스트랩 컨텍스트가 잘릴 때 에이전트에 표시되는 시스템 프롬프트 알림을 제어합니다.
기본값: `"always"`.

- `"off"`: 잘림 알림 텍스트를 시스템 프롬프트에 절대 삽입하지 않습니다.
- `"once"`: 고유한 잘림 서명마다 간결한 알림을 한 번 삽입합니다.
- `"always"`: 잘림이 있으면 실행할 때마다 간결한 알림을 삽입합니다(권장).

상세한 원시/삽입 문자 수와 구성 조정 필드는 컨텍스트/상태 보고서 및 로그와 같은
진단에 유지되며, 일반적인 WebChat 사용자/런타임 컨텍스트에는 간결한 복구 알림만
제공됩니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 컨텍스트 예산 소유권 맵

OpenClaw에는 여러 개의 대용량 프롬프트/컨텍스트 예산이 있으며, 하나의 범용
조정 항목을 모두 거치는 대신 의도적으로 하위 시스템별로 분리되어 있습니다.

| 예산                                                         | 적용 범위                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 일반 작업 공간 부트스트랩 삽입                                                                                                                            |
| `agents.defaults.startupContext.*`                             | 최근 일별 `memory/*.md` 파일을 포함한 일회성 재설정/시작 모델 실행 전처리. 일반 채팅 `/new` 및 `/reset`은 모델을 호출하지 않고 확인 처리됩니다 |
| `skills.limits.*`                                              | 시스템 프롬프트에 삽입되는 압축된 Skills 목록                                                                                                         |
| `agents.defaults.contextLimits.*`                              | 제한된 런타임 발췌문과 삽입된 런타임 소유 블록                                                                                                      |
| `memory.qmd.limits.*`                                          | 색인된 메모리 검색 스니펫 및 삽입 크기                                                                                                              |

일치하는 에이전트별 재정의:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

재설정/시작 모델 실행 시 삽입되는 첫 번째 턴 시작 전처리를 제어합니다.
일반 채팅 `/new` 및 `/reset` 명령은 모델을 호출하지 않고 재설정을 확인하므로
이 전처리를 로드하지 않습니다.

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

제한된 런타임 컨텍스트 표면을 위한 공유 기본값입니다.

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

- `memoryGetMaxChars`: 잘림 메타데이터와 계속 알림이 추가되기 전의 기본 `memory_get` 발췌문 한도입니다.
- `memoryGetDefaultLines`: `lines`이 생략된 경우 기본 `memory_get` 줄 범위입니다.
- `toolResultMaxChars`: 영구 저장된 결과와 오버플로 복구에 사용되는 고급 실시간 도구 결과 상한입니다. 모델 컨텍스트 자동 한도를 사용하려면 설정하지 마십시오.
  토큰 100K 미만에서는 `16000`자, 토큰 100K 이상에서는 `32000`자, 토큰 200K 이상에서는 `64000`자입니다. 긴 컨텍스트 모델에는 최대 `1000000`의 명시적 값이 허용되지만,
  유효 한도는 여전히 모델 컨텍스트 창의 약 30%로 제한됩니다. `openclaw doctor --deep`은 유효 한도를 출력하며,
  doctor는 명시적 재정의가 오래되었거나 효과가 없는 경우에만 경고합니다.
- `postCompactionMaxChars`: Compaction 이후 새로 고침 삽입 중 사용되는 AGENTS.md 발췌문 한도입니다.

#### `agents.list[].contextLimits`

공유 `contextLimits` 조정 항목에 대한 에이전트별 재정의입니다. 생략된 필드는
`agents.defaults.contextLimits`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // 이 에이전트의 고급 상한
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

시스템 프롬프트에 삽입되는 압축된 Skills 목록의 전역 한도입니다. 이는 필요에 따라 `SKILL.md` 파일을 읽는 데 영향을 주지 않습니다.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 프롬프트 예산에 대한 에이전트별 재정의입니다.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

공급자 호출 전 대화 기록/도구 이미지 블록에서 이미지의 가장 긴 변에 대한 최대 픽셀 크기입니다.
기본값: `1200`.

값이 낮을수록 일반적으로 스크린샷이 많은 실행의 비전 토큰 사용량과 요청 페이로드 크기가 줄어듭니다.
값이 높을수록 시각적 세부 정보가 더 많이 보존됩니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

파일 경로, URL 및 미디어 참조에서 로드한 이미지에 대한 이미지 도구 압축/세부 정보 기본 설정입니다.
기본값: `auto`.

OpenClaw는 선택한 이미지 모델에 맞게 크기 조정 단계를 조정합니다. 예를 들어 Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL 및 호스팅된 Llama 4 비전 모델은 이전/기본 고세부 비전 경로보다 큰 이미지를 사용할 수 있으며, 여러 이미지가 포함된 턴은 토큰 및 지연 시간 비용을 제어하기 위해 `auto` 모드에서 더 적극적으로 압축됩니다.

값:

- `auto`: 모델 한도와 이미지 수에 맞게 조정합니다.
- `efficient`: 토큰 및 바이트 사용량을 줄이기 위해 더 작은 이미지를 선호합니다.
- `balanced`: 표준 절충형 단계를 사용합니다.
- `high`: 스크린샷, 다이어그램 및 문서 이미지의 세부 정보를 더 많이 보존합니다.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

시스템 프롬프트 컨텍스트의 시간대입니다(메시지 타임스탬프에는 적용되지 않음). 호스트 시간대로 대체됩니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

시스템 프롬프트의 시간 형식입니다. 기본값: `auto`(OS 기본 설정).

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // 전역 기본 제공자 매개변수
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 문자열 형식은 기본 모델만 설정합니다.
  - 객체 형식은 기본 모델과 순서가 지정된 장애 조치 모델을 설정합니다.
- `utilityModel`: 짧은 내부 작업을 위한 선택적 `provider/model` 참조 또는 별칭입니다. 현재 생성되는 Control UI 세션 제목, Telegram DM 주제 제목, Discord 자동 스레드 제목 및 [진행 상황 초안 내레이션](/ko/concepts/progress-drafts#narrated-status)에 사용됩니다. 설정하지 않으면 OpenClaw는 기본 공급자에 선언된 소형 모델 기본값이 있는 경우 이를 사용합니다(OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`). 그렇지 않으면 제목 작업은 에이전트의 기본 모델로 대체되며 내레이션은 비활성화됩니다. 유틸리티 라우팅을 완전히 비활성화하려면 `utilityModel: ""`을 설정하십시오. `agents.list[].utilityModel`은 기본값을 재정의하며, 에이전트별 값이 비어 있으면 해당 에이전트에서는 비활성화됩니다. 작업별 모델 재정의는 이 두 설정에 모두 우선합니다. 유틸리티 작업은 별도의 모델 호출을 수행하고 작업별 콘텐츠를 선택한 모델 공급자에게 전송합니다. 대시보드 제목 생성은 명령이 아닌 첫 번째 메시지의 처음 1,000자까지만 전송합니다. 내레이션은 수신 요청과 간결하게 수정된 도구 요약을 전송합니다. 비용 및 데이터 처리 요구 사항에 맞는 공급자를 선택하십시오.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 활성 모델이 이미지를 받을 수 없을 때 `image` 도구 경로에서 비전 모델 구성으로 사용됩니다. 대신 네이티브 비전 모델은 불러온 이미지 바이트를 직접 받습니다.
  - 선택된 모델 또는 기본 모델이 이미지 입력을 받을 수 없을 때 대체 라우팅에도 사용됩니다.
  - 명시적인 `provider/model` 참조를 권장합니다. 호환성을 위해 공급자 없는 ID도 허용됩니다. 공급자 없는 ID가 `models.providers.*.models`에 구성된 이미지 지원 항목 하나와 고유하게 일치하면 OpenClaw가 해당 공급자로 한정합니다. 구성된 항목 중 일치하는 것이 여러 개이면 명시적인 공급자 접두사가 필요합니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 이미지 생성 기능과 이미지를 생성하는 향후 모든 도구/Plugin 표면에서 사용됩니다.
  - 일반적인 값: 네이티브 Gemini 이미지 생성에는 `google/gemini-3.1-flash-image-preview`, fal에는 `fal/fal-ai/flux/dev`, OpenAI Images에는 `openai/gpt-image-2`, 투명 배경 OpenAI PNG/WebP 출력에는 `openai/gpt-image-1.5`을 사용합니다.
  - 공급자/모델을 직접 선택하는 경우 일치하는 공급자 인증도 구성하십시오(예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5`에는 `OPENAI_API_KEY` 또는 OpenAI Codex OAuth, `fal/*`에는 `FAL_KEY`).
  - 생략해도 `image_generate`에서 인증 기반 공급자 기본값을 추론할 수 있습니다. 먼저 현재 기본 공급자를 시도한 다음, 공급자 ID 순서대로 나머지 등록된 이미지 생성 공급자를 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 음악 생성 기능과 기본 제공 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` 또는 `minimax/music-2.6`입니다.
  - 생략해도 `music_generate`에서 인증 기반 공급자 기본값을 추론할 수 있습니다. 먼저 현재 기본 공급자를 시도한 다음, 공급자 ID 순서대로 나머지 등록된 음악 생성 공급자를 시도합니다.
  - 공급자/모델을 직접 선택하는 경우 일치하는 공급자 인증/API 키도 구성하십시오.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공유 동영상 생성 기능과 기본 제공 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` 또는 `qwen/wan2.7-r2v`입니다.
  - 생략해도 `video_generate`에서 인증 기반 공급자 기본값을 추론할 수 있습니다. 먼저 현재 기본 공급자를 시도한 다음, 공급자 ID 순서대로 나머지 등록된 동영상 생성 공급자를 시도합니다.
  - 공급자/모델을 직접 선택하는 경우 일치하는 공급자 인증/API 키도 구성하십시오.
  - 공식 Qwen 동영상 생성 Plugin은 출력 동영상 최대 1개, 입력 이미지 1개, 입력 동영상 4개, 재생 시간 10초와 공급자 수준의 `size`, `aspectRatio`, `resolution`, `audio` 및 `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 모델 라우팅을 위해 `pdf` 도구에서 사용됩니다.
  - 생략하면 PDF 도구는 먼저 `imageModel`로 대체한 다음, 확인된 세션/기본 모델로 대체합니다.
- `pdfMaxBytesMb`: 호출 시 `maxBytesMb`가 전달되지 않았을 때 `pdf` 도구에 적용되는 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` 도구의 추출 대체 모드에서 고려하는 기본 최대 페이지 수입니다.
- `verboseDefault`: 에이전트의 기본 상세 출력 수준입니다. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `toolProgressDetail`: `/verbose` 도구 요약 및 진행 상황 초안의 도구 줄에 적용되는 상세 정보 모드입니다. 값: `"explain"`(기본값, 간결하고 사람이 이해하기 쉬운 레이블) 또는 `"raw"`(가능한 경우 원시 명령/세부 정보 추가). 에이전트별 `agents.list[].toolProgressDetail`이 이 기본값을 재정의합니다.
- `reasoningDefault`: 에이전트의 기본 추론 표시 설정입니다. 값: `"off"`, `"on"`, `"stream"`. 에이전트별 `agents.list[].reasoningDefault`이 이 기본값을 재정의합니다. 구성된 추론 기본값은 메시지별 또는 세션별 추론 재정의가 설정되지 않은 경우에만 소유자, 승인된 발신자 또는 운영자 관리자 Gateway 컨텍스트에 적용됩니다.
- `elevatedDefault`: 에이전트의 기본 권한 상승 출력 수준입니다. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: Codex OAuth 액세스의 경우 `openai/gpt-5.6-sol`). 공급자를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 이어서 해당 모델 ID와 정확히 일치하는 구성된 공급자가 하나뿐인지 확인한 후, 마지막으로 구성된 기본 공급자로 대체합니다. 이는 더 이상 권장되지 않는 호환성 동작이므로 명시적인 `provider/model`을 권장합니다. 해당 공급자가 구성된 기본 모델을 더 이상 제공하지 않으면 OpenClaw는 제거된 공급자의 오래된 기본값을 오류로 표시하는 대신 구성된 첫 번째 공급자/모델로 대체합니다.
- `models`: `/model`의 구성된 모델 카탈로그 및 허용 목록입니다. 각 항목에는 `alias`(바로 가기)과 `params`(공급자별 설정, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` 라우팅, `chat_template_kwargs`, `extra_body`/`extraBody`)을 포함할 수 있습니다.
  - 모든 모델 ID를 수동으로 나열하지 않고 선택한 공급자에서 검색된 모델을 모두 표시하려면 `"openai/*": {}` 또는 `"vllm/*": {}` 같은 `provider/*` 항목을 사용하십시오.
  - 해당 공급자에서 동적으로 검색된 모든 모델이 동일한 런타임을 사용해야 하는 경우 `provider/*` 항목에 `agentRuntime`을 추가하십시오. 정확히 일치하는 `provider/model` 런타임 정책이 여전히 와일드카드보다 우선합니다.
  - 안전한 편집: 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`을 사용하십시오. `--replace`을 전달하지 않으면 `config set`은 기존 허용 목록 항목을 제거하는 교체를 거부합니다.
  - 공급자 범위의 구성/온보딩 흐름은 선택한 공급자 모델을 이 맵에 병합하고 이미 구성된 관련 없는 공급자를 유지합니다.
  - 직접 OpenAI Responses 모델의 경우 서버 측 Compaction이 자동으로 활성화됩니다. `context_management` 주입을 중단하려면 `params.responsesServerCompaction: false`을 사용하고, 임계값을 재정의하려면 `params.responsesCompactThreshold`을 사용하십시오. [OpenAI 서버 측 Compaction](/ko/providers/openai#advanced-configuration)을 참조하십시오.
- `params`: 모든 모델에 적용되는 전역 기본 공급자 매개변수입니다. `agents.defaults.params`에서 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(구성): `agents.defaults.params`(전역 기반)를 `agents.defaults.models["provider/model"].params`(모델별)가 재정의한 다음, `agents.list[].params`(일치하는 에이전트 ID)가 키별로 재정의합니다. 자세한 내용은 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하십시오.
- `models.providers.openrouter.params.provider`: OpenRouter 전체에 적용되는 기본 공급자 라우팅 정책입니다. OpenClaw는 이를 OpenRouter 요청의 `provider` 객체로 전달하며, 모델별 `agents.defaults.models["openrouter/<model>"].params.provider`과 에이전트 매개변수가 키별로 재정의합니다. [OpenRouter 공급자 라우팅](/ko/providers/openrouter#advanced-configuration)을 참조하십시오.
- `params.extra_body`/`params.extraBody`: OpenAI 호환 프록시의 `api: "openai-completions"` 요청 본문에 병합되는 고급 통과 JSON입니다. 생성된 요청 키와 충돌하면 추가 본문이 우선하며, 네이티브가 아닌 completions 경로는 이후에도 OpenAI 전용 `store`을 제거합니다.
- `params.chat_template_kwargs`: 최상위 `api: "openai-completions"` 요청 본문에 병합되는 vLLM/OpenAI 호환 채팅 템플릿 인수입니다. 사고 기능이 꺼진 `vllm/nemotron-3-*`의 경우 기본 제공 vLLM Plugin이 `enable_thinking: false` 및 `force_nonempty_content: true`을 자동으로 전송합니다. 명시적인 `chat_template_kwargs`은 생성된 기본값을 재정의하며 `extra_body.chat_template_kwargs`이 여전히 최종 우선순위를 갖습니다. 구성된 vLLM Qwen 및 Nemotron 사고 모델은 여러 단계의 노력 수준 대신 이진 `/think` 선택 항목(`off`, `on`)을 표시합니다.
- `compat.thinkingFormat`: OpenAI 호환 사고 페이로드 형식입니다. Together 형식의 `reasoning.enabled`에는 `"together"`을, Qwen 형식의 최상위 `enable_thinking`에는 `"qwen"`을 사용하십시오. vLLM처럼 요청 수준의 채팅 템플릿 kwargs를 지원하는 Qwen 계열 백엔드에서 `chat_template_kwargs.enable_thinking`을 사용하려면 `"qwen-chat-template"`을 사용하십시오. OpenClaw는 비활성화된 사고를 `false`에, 활성화된 사고를 `true`에 매핑하며, 구성된 vLLM Qwen 모델은 이러한 형식에 대해 이진 `/think` 선택 항목을 표시합니다.
- `compat.supportedReasoningEfforts`: 모델별 OpenAI 호환 추론 노력 수준 목록입니다. 이를 실제로 허용하는 사용자 지정 엔드포인트에는 `"xhigh"`을 포함하십시오. 그러면 OpenClaw는 해당 구성된 공급자/모델의 명령 메뉴, Gateway 세션 행, 세션 패치 검증, 에이전트 CLI 검증 및 `llm-task` 검증에 `/think xhigh`을 표시합니다. 백엔드에서 표준 수준에 대응하는 공급자별 값이 필요한 경우 `compat.reasoningEffortMap`을 사용하십시오.
- `params.preserveThinking`: 보존된 사고 기능을 사용하기 위한 Z.AI 전용 선택 설정입니다. 활성화되어 있고 사고 기능이 켜져 있으면 OpenClaw는 `thinking.clear_thinking: false`을 전송하고 이전 `reasoning_content`을 재생합니다. [Z.AI 사고 및 보존된 사고](/ko/providers/zai#advanced-configuration)를 참조하십시오.
- `localService`: 로컬/자체 호스팅 모델 서버를 위한 선택적 공급자 수준 프로세스 관리자입니다. 선택한 모델이 해당 공급자에 속하면 OpenClaw는 `healthUrl`(또는 `baseUrl + "/models"`)을 검사하고, 엔드포인트가 중단된 경우 `args`을 사용하여 `command`을 시작하고, 최대 `readyTimeoutMs`까지 기다린 다음 모델 요청을 전송합니다. `command`은 절대 경로여야 합니다. `idleStopMs: 0`은 OpenClaw가 종료될 때까지 프로세스를 계속 실행합니다. 양수 값이면 지정된 유휴 밀리초가 지난 후 OpenClaw가 시작한 프로세스를 중지합니다. [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하십시오.
- 런타임 정책은 `agents.defaults`이 아니라 제공자 또는 모델에 속합니다. 제공자 전체에 적용되는 규칙에는 `models.providers.<provider>.agentRuntime`을 사용하고, 모델별 규칙에는 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`을 사용하십시오. 제공자/모델 접두사만으로는 하네스가 선택되지 않습니다. 런타임이 설정되지 않았거나 `auto`인 경우, 작성자가 지정한 요청 재정의가 없는 정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로에 한해서만 OpenAI가 Codex를 암시적으로 선택할 수 있습니다. [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)을 참조하십시오.
- 이러한 필드를 변경하는 구성 작성기(예: `/models set`, `/models set-image`, 대체 항목 추가/제거 명령)는 정규 객체 형식으로 저장하며, 가능한 경우 기존 대체 목록을 유지합니다.
- `maxConcurrent`: 세션 간 최대 병렬 에이전트 실행 수입니다(각 세션 내에서는 계속 직렬로 실행됨). 기본값: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, 등록된 Plugin 하네스 ID 또는 지원되는 CLI 백엔드 별칭입니다. 번들 Codex Plugin은 `codex`을 등록하며, 번들 Anthropic Plugin은 `claude-cli` CLI 백엔드를 제공합니다.
- `id: "auto"`을 사용하면 등록된 Plugin 하네스가 지원 계약을 선언하거나 달리 충족하는 유효 경로를 담당할 수 있으며, 일치하는 하네스가 없으면 OpenClaw를 사용합니다. `id: "codex"` 같은 명시적 Plugin 런타임에는 해당 하네스와 호환되는 유효 경로가 필요합니다. 둘 중 하나라도 사용할 수 없거나 실행이 실패하면 닫힌 상태로 실패합니다.
- `id: "pi"`은 v2026.5.22 및 이전 버전에서 배포된 구성을 보존하기 위한 `openclaw`의 사용 중단된 별칭으로만 허용됩니다. 새 구성에서는 `openclaw`을 사용해야 합니다.
- 런타임 우선순위는 먼저 정확한 모델 정책(`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` 또는 `models.providers.<provider>.models[]`), 그다음 `agents.list[]` / `agents.defaults.models["provider/*"]`, 마지막으로 `models.providers.<provider>.agentRuntime`의 공급자 전체 정책 순입니다.
- 전체 에이전트 런타임 키는 레거시입니다. 런타임 선택에서는 `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, 세션 런타임 고정값 및 `OPENCLAW_AGENT_RUNTIME`을 무시합니다. 오래된 값을 제거하려면 `openclaw doctor --fix`을 실행하십시오.
- 작성된 요청 재정의가 없는 적격한 정확한 공식 HTTPS OpenAI Responses/ChatGPT 경로는 Codex 하네스를 암시적으로 사용할 수 있습니다. 공급자/모델 `agentRuntime.id: "codex"`은 Codex를 닫힌 상태로 실패하는 필수 요건으로 만들지만, 호환되지 않는 경로를 호환되게 만들지는 않습니다.
- Claude CLI 배포에서는 `model: "anthropic/claude-opus-4-8"`와 모델 범위의 `agentRuntime.id: "claude-cli"`을 함께 사용하는 것이 좋습니다. 레거시 `claude-cli/<model>` 참조는 호환성을 위해 계속 작동하지만, 새 구성에서는 공급자/모델 선택을 정규 형태로 유지하고 실행 백엔드를 공급자/모델 런타임 정책에 배치해야 합니다.
- 이는 텍스트 에이전트 턴 실행만 제어합니다. 미디어 생성, 비전, PDF, 음악, 비디오 및 TTS에는 계속 해당 공급자/모델 설정이 사용됩니다.

**기본 제공 별칭 축약형**(`agents.defaults.models`에 모델이 있는 경우에만 적용됨):

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

구성한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`을 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 사고 모드를 자동으로 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍에 대해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`으로 설정하십시오.
Anthropic Claude Opus 4.8은 OpenClaw에서 기본적으로 사고 기능을 끈 상태로 유지합니다. 적응형 사고를 명시적으로 활성화하면 Anthropic 공급자가 소유하는 노력 수준 기본값은 `high`입니다. 명시적인 사고 수준을 설정하지 않으면 Claude 4.6 모델의 기본값은 `adaptive`입니다.

### `agents.defaults.cliBackends`

텍스트 전용 폴백 실행을 위한 선택적 CLI 백엔드입니다(도구 호출 없음). API 공급자가 실패할 때 백업으로 유용합니다.

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
          // 또는 CLI가 프롬프트 파일 플래그를 허용하는 경우 systemPromptFileArg를 사용합니다.
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
- `sessionArg`이 설정된 경우 세션이 지원됩니다.
- `imageArg`이 파일 경로를 허용하는 경우 이미지 패스스루가 지원됩니다.
- `reseedFromRawTranscriptWhenUncompacted: true`을 사용하면 첫 번째 Compaction 요약이 생성되기 전에 제한된 원시 OpenClaw 트랜스크립트 끝부분을 사용하여 안전하게 무효화된 세션을 백엔드가 복구할 수 있습니다. 인증 프로필 또는 자격 증명 에포크가 변경된 경우에는 여전히 원시 데이터를 다시 시드하지 않습니다.

### `agents.defaults.promptOverlays`

OpenClaw가 조립한 프롬프트 표면에 모델 계열별로 적용되는 공급자 독립적 프롬프트 오버레이입니다. GPT-5 계열 모델 ID는 OpenClaw/공급자 경로 전반에서 공유 동작 계약을 받으며, `personality`은 친근한 상호작용 스타일 계층만 제어합니다. 네이티브 Codex 앱 서버 경로는 이 OpenClaw GPT-5 오버레이 대신 Codex 소유의 기본/모델 지침을 유지하며, OpenClaw는 네이티브 스레드에서 Codex의 기본 제공 성격을 비활성화합니다.

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

- `"friendly"`(기본값) 및 `"on"`은 친근한 상호작용 스타일 계층을 활성화합니다.
- `"off"`은 친근한 계층만 비활성화하며, 태그가 지정된 GPT-5 동작 계약은 계속 활성화됩니다.
- 이 공유 설정이 지정되지 않은 경우에도 레거시 `plugins.entries.openai.config.personality`을 계속 읽습니다.

### `agents.defaults.heartbeat`

주기적인 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m은 비활성화
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 기본값: true; false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략
        lightContext: false, // 기본값: false; true이면 워크스페이스 부트스트랩 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true이면 각 Heartbeat를 새 세션에서 실행(대화 기록 없음)
        skipWhenBusy: false, // 기본값: false; true이면 이 에이전트의 서브에이전트/중첩 레인도 대기
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow(기본값) | block
        target: "none", // 기본값: none | 옵션: last | whatsapp | telegram | discord | ...
        prompt: "HEARTBEAT.md가 있으면 읽으십시오...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 기간 문자열(ms/s/m/h)입니다. 기본값: `30m`(API 키 인증) 또는 `1h`(OAuth 인증). 비활성화하려면 `0m`으로 설정하십시오.
- `includeSystemPromptSection`: false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략하고 부트스트랩 컨텍스트에 `HEARTBEAT.md`을 삽입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 표시하지 않습니다.
- `timeoutSeconds`: Heartbeat 에이전트 턴이 중단되기 전에 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`이 설정된 경우 해당 값을 사용하고, 그렇지 않으면 최대 600초로 제한된 Heartbeat 주기를 사용합니다.
- `directPolicy`: 직접/DM 전달 정책입니다. `allow`(기본값)은 직접 대상 전달을 허용합니다. `block`은 직접 대상 전달을 억제하고 `reason=dm-blocked`을 내보냅니다.
- `lightContext`: true이면 Heartbeat 실행에서 경량 부트스트랩 컨텍스트를 사용하고 워크스페이스 부트스트랩 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 Heartbeat가 이전 대화 기록이 없는 새 세션에서 실행됩니다. Cron `sessionTarget: "isolated"`와 동일한 격리 패턴입니다. Heartbeat당 토큰 비용을 약 100K에서 약 2-5K 토큰으로 줄입니다.
- `skipWhenBusy`: true이면 Heartbeat 실행이 해당 에이전트의 추가 사용 중인 레인, 즉 자체 세션 키 기반 서브에이전트 또는 중첩 명령 작업이 끝날 때까지 지연됩니다. Cron 레인은 이 플래그가 없어도 항상 Heartbeat를 지연합니다.
- 에이전트별 설정: `agents.list[].heartbeat`을 설정하십시오. 에이전트 중 하나라도 `heartbeat`을 정의하면 **해당 에이전트만** Heartbeat를 실행합니다.
- Heartbeat는 전체 에이전트 턴을 실행하므로, 간격이 짧을수록 더 많은 토큰을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 등록된 Compaction 공급자 Plugin의 ID(선택 사항)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "배포 ID, 티켓 ID 및 host:port 쌍을 정확히 보존하십시오.", // identifierPolicy=custom일 때 사용
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 선택적 도구 루프 압력 검사
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md 섹션 재삽입을 사용하려면 선택
        model: "openrouter/anthropic/claude-sonnet-4-6", // 선택적 Compaction 전용 모델 재정의
        truncateAfterCompaction: true, // Compaction 후 더 작은 후속 JSONL로 교체
        maxActiveTranscriptBytes: "20mb", // 선택적 사전 로컬 Compaction 트리거
        notifyUser: true, // Compaction 시작/완료 및 메모리 플러시 성능 저하 시 알림(기본값: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 선택적 메모리 플러시 전용 모델 재정의
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "세션이 Compaction에 가까워지고 있습니다. 지금 지속성 메모리를 저장하십시오.",
          prompt: "지속적으로 보존할 메모를 memory/YYYY-MM-DD.md에 작성하십시오. 저장할 내용이 없으면 정확한 무응답 토큰 NO_REPLY로 응답하십시오.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 기록을 위한 청크 단위 요약)입니다. [Compaction](/ko/concepts/compaction)을 참조하십시오.
- `provider`: 등록된 Compaction 제공자 Plugin의 ID입니다. 설정하면 내장 LLM 요약 대신 제공자의 `summarize()`이 호출됩니다. 실패 시 내장 방식으로 대체됩니다. 제공자를 설정하면 `mode: "safeguard"`이 강제됩니다. [Compaction](/ko/concepts/compaction)을 참조하십시오.
- `timeoutSeconds`: OpenClaw가 단일 Compaction 작업을 중단하기 전까지 허용되는 최대 시간(초)입니다. 기본값: `180`.
- `reserveTokens`: Compaction 후 모델 출력과 향후 도구 결과에 사용할 수 있도록 확보해 두는 토큰 여유분입니다. 모델 컨텍스트 창을 알 수 있는 경우 OpenClaw는 유효 예약량이 프롬프트 예산을 소모하지 않도록 상한을 적용합니다.
- `reserveTokensFloor`: 임베디드 런타임에서 강제하는 최소 예약량입니다. 하한을 비활성화하려면 `0`으로 설정하십시오. 이 하한에는 활성 컨텍스트 창 상한이 계속 적용됩니다.
- `keepRecentTokens`: 가장 최근의 트랜스크립트 꼬리 부분을 원문 그대로 유지하기 위한 에이전트 절단 지점 예산입니다. 명시적으로 설정한 경우 수동 `/compact`에서 이를 준수하며, 그렇지 않으면 수동 Compaction은 엄격한 체크포인트로 작동합니다.
- `recentTurnsPreserve`: 보호 요약 외부에서 원문 그대로 유지하는 가장 최근 사용자/어시스턴트 턴 수입니다. 기본값: `3`.
- `maxHistoryShare`: Compaction 후 유지되는 기록에 허용되는 전체 컨텍스트 예산의 최대 비율입니다(범위 `0.1`-`0.9`).
- `identifierPolicy`: `strict`(기본값), `off` 또는 `custom`입니다. `strict`은 Compaction 요약 중에 불투명 식별자를 유지하기 위한 내장 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용하는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `qualityGuard`: 보호 요약의 잘못된 출력에 대한 재시도 검사입니다. 보호 모드에서는 기본적으로 활성화되며, 감사를 건너뛰려면 `enabled: false`로 설정하십시오.
- `midTurnPrecheck`: 선택적 도구 루프 압력 검사입니다. `enabled: true`이면 OpenClaw는 도구 결과를 추가한 후 다음 모델 호출 전에 컨텍스트 압력을 확인합니다. 컨텍스트가 더 이상 맞지 않으면 프롬프트를 제출하기 전에 현재 시도를 중단하고, 기존 사전 검사 복구 경로를 재사용하여 도구 결과를 잘라내거나 Compaction한 후 재시도합니다. `default` 및 `safeguard` Compaction 모드 모두에서 작동합니다. 기본값: 비활성화.
- `postIndexSync`: Compaction 후 세션 메모리 재색인 모드입니다. 기본값: `"async"`. 최신성을 최대한 보장하려면 `"await"`, Compaction 지연 시간을 줄이려면 `"async"`, 세션 메모리 동기화를 다른 곳에서 처리하는 경우에만 `"off"`를 사용하십시오.
- `postCompactionSections`: Compaction 후 다시 삽입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 설정하지 않거나 `[]`으로 설정하면 재삽입이 비활성화됩니다. `["Session Startup", "Red Lines"]`을 명시적으로 설정하면 해당 쌍이 활성화되고 기존 `Every Session`/`Safety` 대체 동작이 유지됩니다. 추가 컨텍스트가 Compaction 요약에 이미 포함된 프로젝트 지침을 중복할 위험보다 가치가 있을 때만 활성화하십시오.
- `model`: Compaction 요약에만 사용할 선택적 `provider/model-id` 또는 `agents.defaults.models`의 단순 별칭입니다. 단순 별칭은 디스패치 전에 해석되며, 충돌 시 구성된 리터럴 모델 ID가 우선합니다. 기본 세션에서는 한 모델을 유지하면서 Compaction 요약은 다른 모델에서 실행해야 할 때 사용하십시오. 설정하지 않으면 Compaction은 세션의 기본 모델을 사용합니다.
- `truncateAfterCompaction`: Compaction 후 활성 세션 트랜스크립트를 순환하여 이후 턴에서는 요약과 요약되지 않은 꼬리 부분만 불러오고, 이전 전체 트랜스크립트는 보관되도록 합니다. 장기 실행 세션에서 활성 트랜스크립트가 무제한으로 증가하는 것을 방지합니다. 기본값: `false`.
- `maxActiveTranscriptBytes`: 트랜스크립트 기록이 임계값을 초과하면 실행 전에 일반 로컬 Compaction을 트리거하는 선택적 바이트 임계값(`number` 또는 `"20mb"`과 같은 문자열)입니다. 성공한 Compaction이 더 작은 후속 트랜스크립트로 순환할 수 있도록 `truncateAfterCompaction`이 필요합니다. 설정하지 않거나 `0`이면 비활성화됩니다.
- `notifyUser`: `true`이면 사용자에게 간단한 컨텍스트 유지 관리 알림을 보냅니다. Compaction이 시작되고 완료될 때(예: "컨텍스트를 Compaction하는 중..." 및 "Compaction 완료"), 그리고 Compaction 전 메모리 플러시가 소진되어 성능이 저하된 상태로 응답을 계속할 때(예: "메모리 유지 관리가 일시적으로 실패했습니다. 응답을 계속합니다.") 알립니다. 이러한 알림을 표시하지 않도록 기본적으로 비활성화되어 있습니다.
- `memoryFlush`: 지속성 메모리를 저장하기 위해 자동 Compaction 전에 실행되는 무음 에이전트 턴입니다. 이 유지 관리 턴을 로컬 모델에서 계속 실행해야 하는 경우 `model`을 `ollama/qwen3:8b`과 같은 정확한 제공자/모델로 설정하십시오. 이 재정의는 활성 세션의 대체 체인을 상속하지 않습니다. `forceFlushTranscriptBytes`는 토큰 카운터가 오래된 경우에도 트랜스크립트 크기가 임계값에 도달하면 플러시를 강제합니다. 워크스페이스가 읽기 전용이면 건너뜁니다.

### `agents.defaults.runRetries`

장애 복구 중 무한 실행 루프를 방지하기 위한 임베디드 에이전트 런타임 외부 실행 루프의 재시도 반복 횟수 경계입니다. 이 설정은 ACP 또는 CLI 런타임이 아닌 임베디드 에이전트 런타임에만 적용됩니다.

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
        runRetries: { max: 50 }, // 선택적 에이전트별 재정의
      },
    ],
  },
}
```

- `base`: 외부 실행 루프의 기본 실행 재시도 반복 횟수입니다. 기본값: `24`.
- `perProfile`: 각 대체 프로필 후보에 추가로 부여되는 실행 재시도 반복 횟수입니다. 기본값: `8`.
- `min`: 실행 재시도 반복 횟수의 절대 최솟값입니다. 기본값: `32`.
- `max`: 통제 불능 실행을 방지하기 위한 실행 재시도 반복 횟수의 절대 최댓값입니다. 기본값: `160`.

### `agents.defaults.contextPruning`

LLM에 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크의 세션 기록은 수정하지 **않습니다**. 기본적으로 비활성화되어 있으며, 활성화하려면 `mode: "cache-ttl"`으로 설정하십시오.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off(기본값) | cache-ttl
        ttl: "1h", // 기간(ms/s/m/h), 기본 단위: 분, 기본값: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[오래된 도구 결과 콘텐츠가 지워짐]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 모드 동작">

- `mode: "cache-ttl"`은 정리 단계를 활성화합니다.
- `ttl`은 마지막 캐시 접근 후 정리를 다시 실행할 수 있는 빈도를 제어합니다. 기본값: `5m`.
- 정리는 먼저 지나치게 큰 도구 결과를 소프트 트림한 다음, 필요한 경우 더 오래된 도구 결과를 완전히 지웁니다.
- `softTrimRatio` 및 `hardClearRatio`은 `0.0`부터 `1.0`까지의 값을 허용하며, 구성 검증에서 이 범위를 벗어난 값을 거부합니다.

**소프트 트림**은 시작과 끝을 유지하고 중간에 `...`을 삽입합니다.

**완전 삭제**는 전체 도구 결과를 자리표시자로 대체합니다.

참고:

- 이미지 블록은 잘라내거나 지우지 않습니다.
- 비율은 정확한 토큰 수가 아닌 문자 기준의 근삿값입니다.
- 어시스턴트 메시지가 `keepLastAssistants`개보다 적으면 정리를 건너뜁니다.

</Accordion>

동작 세부 정보는 [세션 정리](/ko/concepts/session-pruning)를 참조하십시오.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off(기본값) | natural | custom(minMs/maxMs 사용)
    },
  },
}
```

- Telegram 이외의 채널에서 블록 응답을 활성화하려면 명시적 `*.streaming.block.enabled: true`이 필요합니다. QQ Bot은 예외입니다. `streaming.block` 키가 없으며, `channels.qqbot.streaming.mode`이 `"off"`이 아닌 한 블록 응답을 스트리밍합니다.
- 채널 재정의: `channels.<channel>.streaming.block.coalesce`(및 계정별 변형)입니다. Discord, Google Chat, Mattermost, MS Teams, Signal 및 Slack의 기본값은 `minChars: 1500` / `idleMs: 1000`입니다.
- `blockStreamingChunk.breakPreference`: 선호하는 청크 경계(`"paragraph" | "newline" | "sentence"`)입니다.
- `humanDelay`: 블록 응답 사이의 무작위 일시 중지 시간입니다. 기본값: `off`. `natural` = 800-2500ms. `custom`은 `minMs`/`maxMs`을 사용합니다(설정하지 않은 경계는 자연스러운 범위로 대체됨). 에이전트별 재정의: `agents.list[].humanDelay`.

동작 및 청크 처리 세부 정보는 [스트리밍](/ko/concepts/streaming)을 참조하십시오.

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

- 기본값: 직접 채팅/멘션은 `instant`, 멘션되지 않은 그룹 채팅은 `message`입니다.
- `typingIntervalSeconds` 기본값: `6`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

[입력 중 표시기](/ko/concepts/typing-indicators)를 참조하십시오.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

임베디드 에이전트를 위한 선택적 샌드박싱입니다. 전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하십시오.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (기본값) | non-main | all
        backend: "docker", // docker (기본값) | ssh | openshell
        scope: "agent", // session | agent (기본값) | shared
        workspaceAccess: "none", // none (기본값) | ro | rw
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
          gpus: "all",
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
          // SecretRef / 인라인 콘텐츠도 지원합니다:
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

위에 표시된 기본값(`off`/`docker`/`agent`/`none`/`bookworm-slim` 이미지/`none` 네트워크 등)은 단순한 예시 값이 아니라 실제 OpenClaw 기본값입니다.

<Accordion title="샌드박스 세부 정보">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 범용 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`을 선택하면 런타임별 설정이
`plugins.entries.openshell.config`으로 이동합니다.

**SSH 백엔드 구성:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 워크스페이스에 사용되는 절대 원격 루트(기본값: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 구체화하는 인라인 콘텐츠 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 호스트 키 정책 설정(둘 다 기본값은 `true`)

**SSH 인증 우선순위:**

- `identityData`이 `identityFile`보다 우선합니다
- `certificateData`이 `certificateFile`보다 우선합니다
- `knownHostsData`이 `knownHostsFile`보다 우선합니다
- SecretRef 기반 `*Data` 값은 샌드박스 세션이 시작되기 전에 활성 시크릿 런타임 스냅샷에서 확인됩니다

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 워크스페이스를 한 번 초기화합니다
- 그런 다음 원격 SSH 워크스페이스를 정본으로 유지합니다
- `exec`, 파일 도구 및 미디어 경로를 SSH를 통해 라우팅합니다
- 원격 변경 사항을 호스트로 자동 동기화하지 않습니다
- 샌드박스 브라우저 컨테이너를 지원하지 않습니다

**워크스페이스 접근:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 샌드박스 워크스페이스(기본값)
- `ro`: `/workspace`의 샌드박스 워크스페이스, `/agent`에 읽기 전용으로 마운트된 에이전트 워크스페이스
- `rw`: `/workspace`에 읽기/쓰기로 마운트된 에이전트 워크스페이스

**범위:**

- `session`: 세션별 컨테이너 + 워크스페이스
- `agent`: 에이전트별 컨테이너 + 워크스페이스 하나(기본값)
- `shared`: 공유 컨테이너 및 워크스페이스(세션 간 격리 없음)

**OpenShell Plugin 구성:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (기본값) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 선택 사항
          gatewayEndpoint: "https://lab.example", // 선택 사항
          policy: "strict", // 선택적 OpenShell 정책 ID
          providers: ["openai"], // 선택 사항
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 모드:**

- `mirror`: 실행 전에 로컬에서 원격으로 초기화하고 실행 후 다시 동기화합니다. 로컬 워크스페이스가 정본으로 유지됩니다
- `remote`: 샌드박스 생성 시 원격을 한 번 초기화한 다음 원격 워크스페이스를 정본으로 유지합니다

`remote` 모드에서는 초기화 단계 이후 OpenClaw 외부에서 이루어진 호스트 로컬 편집 내용이 샌드박스로 자동 동기화되지 않습니다.
전송은 SSH를 통해 OpenShell 샌드박스로 이루어지지만, 샌드박스 수명 주기와 선택적 미러 동기화는 Plugin이 관리합니다.

**`setupCommand`**은 컨테이너 생성 후(`sh -lc`을 통해) 한 번 실행됩니다. 네트워크 송신, 쓰기 가능한 루트 및 루트 사용자가 필요합니다.

**컨테이너의 기본값은 `network: "none"`입니다** — 에이전트에 외부 접근이 필요한 경우 `"bridge"`(또는 사용자 지정 브리지 네트워크)으로 설정하십시오.
`"host"`은 차단됩니다. `"container:<id>"`은 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`(비상용)을 명시적으로 설정하지 않는 한 기본적으로 차단됩니다.
활성 OpenClaw 샌드박스에서 Codex 앱 서버의 턴은 네이티브 코드 모드 네트워크 접근에 이와 동일한 송신 설정을 사용합니다.

**수신 첨부 파일**은 활성 워크스페이스의 `media/inbound/*`에 준비됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 바인드와 에이전트별 바인드가 병합됩니다.

**샌드박스 브라우저**(`sandbox.browser.enabled`, 기본값 `false`): 컨테이너의 Chromium + CDP입니다. noVNC URL이 시스템 프롬프트에 삽입됩니다. `openclaw.json`에 `browser.enabled`이 필요하지 않습니다.
noVNC 관찰자 접근은 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 수명이 짧은 토큰 URL을 생성합니다.

- `allowHostControl: false`(기본값)은 샌드박스 세션이 호스트 브라우저를 대상으로 지정하지 못하도록 차단합니다.
- `network`의 기본값은 `openclaw-sandbox-browser`(전용 브리지 네트워크)입니다. 전역 브리지 연결을 명시적으로 원하는 경우에만 `bridge`으로 설정하십시오. 여기서도 `"host"`은 차단됩니다.
- `cdpSourceRange`는 선택적으로 컨테이너 경계의 CDP 수신을 CIDR 범위(예: `172.21.0.1/32`)로 제한합니다.
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 샌드박스 브라우저 컨테이너에만 마운트합니다. 설정하면(`[]` 포함) 브라우저 컨테이너의 `docker.binds`을 대체합니다.
- 샌드박스 브라우저 컨테이너의 Chromium은 항상 `--no-sandbox --disable-setuid-sandbox`과 함께 실행됩니다(컨테이너에는 Chrome 자체 샌드박스에 필요한 커널 기본 요소가 없습니다). 이를 위한 구성 토글은 없습니다.
- 실행 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`은
    기본적으로 활성화되며 WebGL/3D 사용에 필요한 경우
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`을 사용하여 비활성화할 수 있습니다.
  - `--disable-extensions`(기본적으로 활성화됨). 워크플로가 확장 프로그램에 의존하는 경우 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`이
    확장 프로그램을 다시 활성화합니다.
  - 기본값은 `--renderer-process-limit=2`입니다. `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`로 변경할 수 있으며,
    Chromium의 기본 프로세스 제한을 사용하려면 `0`으로 설정하십시오.
  - `headless`이 활성화된 경우에만 `--headless=new`입니다.
  - 기본값은 컨테이너 이미지 기준값입니다. 컨테이너 기본값을 변경하려면 사용자 지정
    진입점이 있는 사용자 지정 브라우저 이미지를 사용하십시오.

</Accordion>

브라우저 샌드박싱과 `sandbox.docker.binds`은 Docker에서만 사용할 수 있습니다.

이미지를 빌드하려면(소스 체크아웃에서):

```bash
scripts/sandbox-setup.sh           # 기본 샌드박스 이미지
scripts/sandbox-browser-setup.sh   # 선택적 브라우저 이미지
```

소스 체크아웃 없이 npm으로 설치하는 경우 인라인 `docker build` 명령은 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)을 참조하십시오.

### `agents.list`(에이전트별 재정의)

`agents.list[].tts`을 사용하여 에이전트마다 자체 TTS 제공자, 음성, 모델,
스타일 또는 자동 TTS 모드를 지정하십시오. 에이전트 블록은 전역
`messages.tts` 위에 깊은 병합되므로 공유 자격 증명은 한곳에 유지하면서 개별
에이전트는 필요한 음성 또는 제공자 필드만 재정의할 수 있습니다. 활성 에이전트의
재정의는 자동 음성 응답, `/tts audio`, `/tts status` 및
`tts` 에이전트 도구에 적용됩니다. 제공자 예시와 우선순위는
[텍스트 음성 변환](/ko/tools/tts#per-agent-voice-overrides)을 참조하십시오.

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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // 에이전트별 사고 수준 재정의
        reasoningDefault: "on", // 에이전트별 추론 표시 여부 재정의
        fastModeDefault: false, // 에이전트별 빠른 모드 재정의
        params: { cacheRetention: "none" }, // 일치하는 defaults.models 매개변수를 키별로 재정의
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 설정하면 agents.defaults.skills를 대체
        identity: {
          name: "Samantha",
          theme: "도움이 되는 나무늘보",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: 여러 개가 설정된 경우 첫 번째 항목이 우선합니다(경고가 기록됨). 설정된 항목이 없으면 목록의 첫 번째 항목이 기본값입니다.
- `model`: 문자열 형식은 모델 대체가 없는 엄격한 에이전트별 기본 모델을 설정합니다. 객체 형식 `{ primary }`도 `fallbacks`을 추가하지 않으면 엄격하게 동작합니다. 해당 에이전트가 대체 모델을 사용하도록 하려면 `{ primary, fallbacks: [...] }`을 사용하고, 엄격한 동작을 명시적으로 지정하려면 `{ primary, fallbacks: [] }`을 사용하십시오. `primary`만 재정의하는 Cron 작업은 `fallbacks: []`을 설정하지 않는 한 기본 대체 모델을 계속 상속합니다.
- `utilityModel`: 생성된 세션 및 스레드 제목과 같은 짧은 내부 작업을 위한 선택적 에이전트별 재정의입니다. `agents.defaults.utilityModel`, 기본 공급자가 선언한 소형 모델 기본값, 해당 에이전트의 기본 모델 순으로 대체됩니다. 빈 문자열은 이 에이전트의 유틸리티 라우팅을 비활성화합니다.
- `params`: `agents.defaults.models`에서 선택된 모델 항목 위에 병합되는 에이전트별 스트림 매개변수입니다. 전체 모델 카탈로그를 복제하지 않고 `cacheRetention`, `temperature`, `maxTokens`과 같은 에이전트별 재정의를 적용할 때 사용하십시오.
- `tts`: 선택적 에이전트별 텍스트 음성 변환 재정의입니다. 이 블록은 `messages.tts` 위에 깊은 병합되므로, 공유 공급자 자격 증명과 대체 정책은 `messages.tts`에 유지하고 공급자, 음성, 모델, 스타일 또는 자동 모드와 같은 페르소나별 값만 여기에 설정하십시오.
- `skills`: 선택적 에이전트별 Skills 허용 목록입니다. 생략하면 설정된 경우 에이전트가 `agents.defaults.skills`을 상속합니다. 명시적 목록은 기본값과 병합되지 않고 이를 대체하며, `[]`은 Skills가 없음을 의미합니다.
- `thinkingDefault`: 선택적 에이전트별 기본 사고 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`)입니다. 메시지별 또는 세션별 재정의가 설정되지 않은 경우 이 에이전트의 `agents.defaults.thinkingDefault`을 재정의합니다. 선택한 공급자/모델 프로필에 따라 유효한 값이 결정됩니다. Google Gemini의 경우 `adaptive`은 공급자가 관리하는 동적 사고를 유지합니다(Gemini 3/3.1에서는 `thinkingLevel` 생략, Gemini 2.5에서는 `thinkingBudget: -1`).
- `reasoningDefault`: 선택적 에이전트별 기본 추론 표시 여부(`on | off | stream`)입니다. 메시지별 또는 세션별 추론 재정의가 설정되지 않은 경우 이 에이전트의 `agents.defaults.reasoningDefault`을 재정의합니다.
- `fastModeDefault`: 선택적 에이전트별 빠른 모드 기본값(`"auto" | true | false`)입니다. 메시지별 또는 세션별 빠른 모드 재정의가 설정되지 않은 경우 적용됩니다.
- `models`: 전체 `provider/model` ID를 키로 사용하는 선택적 에이전트별 모델 카탈로그/런타임 재정의입니다. 에이전트별 런타임 예외에는 `models["provider/model"].agentRuntime`을 사용하십시오.
- `runtime`: 선택적 에이전트별 런타임 설명자입니다. 에이전트가 기본적으로 ACP 하네스 세션을 사용해야 하는 경우 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)과 함께 `type: "acp"`을 사용하십시오.
- `identity.avatar`: 작업 공간 상대 경로, `http(s)` URL 또는 `data:` URI입니다.
- 로컬 작업 공간 상대 `identity.avatar` 이미지 파일은 2 MB로 제한됩니다. `http(s)` URL과 `data:` URI에는 로컬 파일 크기 제한이 적용되지 않습니다.
- `identity`은 기본값을 파생합니다. `emoji`에서 `ackReaction`을, `name`/`emoji`에서 `mentionPatterns`을 파생합니다.
- `subagents.allowAgents`: 명시적 `sessions_spawn.agentId` 대상에 사용할 구성된 에이전트 ID 허용 목록입니다(`["*"]` = 구성된 모든 대상, 기본값: 동일한 에이전트만). 자신을 대상으로 하는 `agentId` 호출을 허용하려면 요청자 ID를 포함하십시오. 에이전트 구성이 삭제되어 오래된 항목은 `sessions_spawn`에서 거부되고 `agents_list`에서 생략됩니다. 이를 정리하려면 `openclaw doctor --fix`을 실행하거나, 해당 대상이 기본값을 상속하면서 계속 생성 가능해야 한다면 최소한의 `agents.list[]` 항목을 추가하십시오.
- 샌드박스 상속 보호: 요청자 세션이 샌드박스에서 실행되는 경우 `sessions_spawn`은 샌드박스 없이 실행되는 대상을 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`을 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제, 기본값: false).
- `subagents.maxConcurrent`: 하위 에이전트 실행 전체에서 동시에 실행할 수 있는 자식 에이전트의 최대 수입니다. 기본값: `8`.
- `subagents.maxChildrenPerAgent`: 단일 에이전트 세션이 생성할 수 있는 활성 자식의 최대 수입니다. 기본값: `5`.
- `subagents.maxSpawnDepth`: 하위 에이전트 생성의 최대 중첩 깊이(`1`-`5`)입니다. 기본값: `1`(중첩 없음).
- `subagents.archiveAfterMinutes`: 완료된 하위 에이전트 상태가 보관되기 전까지의 기간입니다. 기본값: `60`.

---

## 다중 에이전트 라우팅

하나의 Gateway 안에서 격리된 여러 에이전트를 실행합니다. [다중 에이전트](/ko/concepts/multi-agent)를 참조하십시오.

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

- `type`(선택 사항): 일반 라우팅에는 `route`(type이 없으면 route가 기본값), 지속적 ACP 대화 바인딩에는 `acp`를 사용합니다.
- `match.channel`(필수)
- `match.accountId`(선택 사항, `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer`(선택 사항, `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId`(선택 사항, 채널별)
- `acp`(선택 사항, `type: "acp"`에만 해당): `{ mode, label, cwd, backend }`

**결정적 일치 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확히 일치, 피어/길드/팀 없음)
5. `match.accountId: "*"`(채널 전체)
6. 기본 에이전트

각 계층에서는 처음 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 ID(`match.channel` + 계정 + `match.peer.id`)를 기준으로 확인하며, 위의 라우트 바인딩 계층 순서를 사용하지 않습니다.

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

<Accordion title="읽기 전용 도구 + 작업 공간">

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

<Accordion title="파일 시스템 액세스 없음(메시징만 가능)">

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

우선순위 세부 정보는 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하십시오.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce(기본값) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // 기간 또는 false
      maxDiskBytes: "500mb", // 선택적 하드 제한
      highWaterBytes: "400mb", // 선택적 정리 목표
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 기본 비활성 자동 포커스 해제 시간(`0`은 비활성화)
      maxAgeHours: 0, // 기본 최대 유지 시간(`0`은 비활성화)
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

<Accordion title="세션 필드 세부 정보">

- **`scope`**: 그룹 채팅 컨텍스트의 기본 세션 그룹화 전략입니다.
  - `per-sender` (기본값): 각 발신자는 채널 컨텍스트 내에서 격리된 세션을 사용합니다.
  - `global`: 채널 컨텍스트의 모든 참여자가 단일 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용하십시오).
- **`dmScope`**: DM을 그룹화하는 방식입니다.
  - `main`: 모든 DM이 기본 세션을 공유합니다.
  - `per-peer`: 채널 전체에서 발신자 ID별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(여러 사용자가 사용하는 받은편지함에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(다중 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위해 정규 ID를 공급자 접두사가 붙은 피어에 매핑합니다. `/dock_discord` 같은 도킹 명령은 동일한 맵을 사용하여 활성 세션의 응답 경로를 연결된 다른 채널 피어로 전환합니다. [채널 도킹](/ko/concepts/channel-docking)을 참조하십시오.
- **`reset`**: 기본 재설정 정책입니다. `daily`은 현지 시간 `atHour`에 재설정하며, `idle`은 `idleMinutes` 후에 재설정합니다. 둘 다 구성된 경우 먼저 만료되는 정책이 적용됩니다. 일일 재설정의 최신 여부는 세션 행의 `sessionStartedAt`을 사용하고, 유휴 재설정의 최신 여부는 `lastInteractionAt`을 사용합니다. Heartbeat, Cron 깨우기, 실행 알림, Gateway 관리 기록 같은 백그라운드/시스템 이벤트 쓰기는 `updatedAt`을 업데이트할 수 있지만, 일일/유휴 세션을 최신 상태로 유지하지는 않습니다.
- **`resetByType`**: 유형별 재정의입니다(`direct`, `group`, `thread`). 레거시 `dm`은 `direct`의 별칭으로 허용됩니다.
- **`resetByChannel`**: 공급자/채널 ID를 키로 사용하는 채널별 재설정 재정의입니다. 세션 채널에 일치하는 항목이 있으면 해당 세션에 대해 `resetByType`/`reset`보다 무조건 우선합니다. 한 채널에 유형 수준 정책과 다른 재설정 동작이 필요한 경우에만 사용하십시오.
- **`mainKey`**: 레거시 필드입니다. 런타임은 기본 직접 채팅 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: 에이전트 간 교환 중 에이전트 사이에서 응답을 주고받는 최대 횟수입니다(정수, 범위: `0`-`20`, 기본값: `5`). `0`은 핑퐁 연결을 비활성화합니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` 별칭 포함), `keyPrefix` 또는 `rawKeyPrefix`을 기준으로 일치시킵니다. 첫 번째 거부 항목이 적용됩니다.
- **`maintenance`**: 세션 저장소 정리 및 보존 제어입니다.
  - `mode`: `enforce`은 정리를 적용하며 기본값입니다. `warn`은 경고만 출력합니다.
  - `pruneAfter`: 오래된 항목의 기간 기준점입니다(기본값 `30d`).
  - `maxEntries`: SQLite 세션 항목의 최대 개수입니다(기본값 `500`). 런타임 쓰기는 프로덕션 규모 제한을 위해 작은 상한 여유분을 두고 일괄 정리를 수행하며, `openclaw sessions cleanup --enforce`은 제한을 즉시 적용합니다.
  - 수명이 짧은 Gateway 모델 실행 프로브 세션에는 고정된 `24h` 보존 기간이 적용되지만, 정리는 압력이 있을 때만 수행됩니다. 즉, 세션 항목 유지 관리/제한 압력에 도달한 경우에만 오래된 엄격한 모델 실행 프로브 행을 제거합니다. `agent:*:explicit:model-run-<uuid>`과 일치하는 명시적인 엄격한 프로브 키만 대상이며, 일반 직접, 그룹, 스레드, Cron, 훅, Heartbeat, ACP 및 하위 에이전트 세션에는 이 24h 보존 기간이 적용되지 않습니다. 모델 실행 정리가 수행될 때는 더 광범위한 `pruneAfter` 오래된 항목 정리 및 `maxEntries` 제한보다 먼저 수행됩니다.
  - 레거시 `rotateBytes`은 현재 스키마에서 거부됩니다. `openclaw doctor --fix`은 이전 구성에서 이를 제거합니다.
  - `resetArchiveRetention`: 재설정되거나 삭제된 대화 기록 아카이브의 기간 기반 보존입니다. 기본적으로 아카이브는 디스크 예산에 따른 제거가 이루어질 때까지 유지됩니다. 경과 시간 기준 삭제를 사용하려면 기간을 설정하고, 명시적으로 비활성화하려면 `false`을 설정하십시오.
  - `maxDiskBytes`: 선택적인 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후의 선택적 목표값입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`writeLock`**: 세션 대화 기록 쓰기 잠금 제어입니다. 정상적인 대화 기록 준비, 정리, Compaction 또는 미러 작업의 경합이 기본 정책보다 오래 지속되는 경우에만 조정하십시오.
  - `acquireTimeoutMs`: 잠금을 획득하는 동안 세션을 사용 중으로 보고하기 전까지 기다리는 시간(밀리초)입니다. 기본값: `60000`, 환경 변수 재정의: `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: 기존 잠금을 오래된 것으로 간주하고 회수하기까지의 시간(밀리초)입니다. 기본값: `1800000`, 환경 변수 재정의: `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: 프로세스 내에서 획득한 잠금을 감시기가 해제하기 전까지 유지할 수 있는 시간(밀리초)입니다. 기본값: `300000`, 환경 변수 재정의: `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: 스레드 바인딩 세션 기능의 전역 기본값입니다.
  - `enabled`: 기본 마스터 스위치입니다(공급자가 재정의할 수 있으며, Discord는 `channels.discord.threadBindings.enabled`을 사용합니다).
  - `idleHours`: 비활성 상태에서 자동으로 포커스를 해제하기까지의 기본 시간입니다(`0`은 비활성화하며, 공급자가 재정의할 수 있습니다).
  - `maxAgeHours`: 기본 최대 수명(시간)입니다(`0`은 비활성화하며, 공급자가 재정의할 수 있습니다).
  - `spawnSessions`: `sessions_spawn` 및 ACP 스레드 생성에서 스레드 바인딩 작업 세션을 생성하기 위한 기본 게이트입니다. 스레드 바인딩이 활성화되면 기본값은 `true`이며, 공급자/계정에서 재정의할 수 있습니다.
  - `defaultSpawnContext`: 스레드 바인딩 생성의 기본 네이티브 하위 에이전트 컨텍스트입니다(`"fork"` 또는 `"isolated"`). 기본값은 `"fork"`입니다.

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer(기본값) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize(기본값)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0은 비활성화
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 응답 접두사

채널별/계정별 재정의: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

결정 순서(가장 구체적인 항목이 우선): 계정 → 채널 → 전역. `""`은 비활성화하고 연쇄 적용을 중단합니다. `"auto"`은 `[{identity.name}]`을 파생합니다.

**템플릿 변수:**

| 변수              | 설명                   | 예시                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름         | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 공급자 이름            | `anthropic`                 |
| `{thinkingLevel}` | 현재 사고 수준         | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 ID 이름       | (`"auto"`과 동일)          |

변수는 대소문자를 구분하지 않습니다. `{think}`은 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 에이전트의 `identity.emoji`이며, 없으면 `"👀"`입니다. 비활성화하려면 `""`을 설정하십시오.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 결정 순서: 계정 → 채널 → `messages.ackReaction` → ID 대체값.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all` 또는 `off`/`none`(확인 반응을 완전히 비활성화)입니다.
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp, iMessage처럼 반응을 지원하는 채널에서 응답 후 확인 반응을 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram 및 WhatsApp에서 수명 주기 상태 반응을 활성화합니다.
  Discord에서는 설정하지 않은 경우 확인 반응이 활성화되어 있으면 상태 반응도 활성화된 상태로 유지됩니다.
  Slack, Signal, Telegram 및 WhatsApp에서는 수명 주기 상태 반응을 활성화하려면 이를 명시적으로 `true`으로 설정하십시오.
  Slack은 기본적으로 네이티브 어시스턴트 스레드 상태와 순환 로딩 메시지를 진행 상황 표시에 사용하며, 구성된 확인 반응은 정적으로 유지합니다.
- `messages.statusReactions.emojis`: 수명 주기 이모지 키를 재정의합니다.
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` 및 `stallHard`.
  Telegram은 고정된 반응 세트만 허용하므로 지원되지 않는 구성 이모지는
  해당 채팅에서 지원되는 가장 가까운 상태 변형으로 대체됩니다.

### 대기열

- `mode`: 세션 실행이 활성 상태일 때 도착하는 인바운드 메시지의 대기열 전략입니다. 기본값: `"steer"`.
  - `steer`: 새 프롬프트를 활성 실행에 삽입합니다.
  - `followup`: 활성 실행이 완료된 후 새 프롬프트를 실행합니다.
  - `collect`: 호환되는 메시지를 일괄 처리하여 나중에 함께 실행합니다.
  - `interrupt`: 최신 프롬프트를 시작하기 전에 활성 실행을 중단합니다.
- `debounceMs`: 대기열에 추가되거나 조정된 메시지를 디스패치하기 전의 지연 시간입니다. 기본값: `500`.
- `cap`: 삭제 정책이 적용되기 전까지 대기할 수 있는 최대 메시지 수입니다. 기본값: `20`.
- `drop`: 제한을 초과했을 때의 전략입니다. `"summarize"`(기본값)은 가장 오래된 항목을 삭제하되 압축된 요약은 유지하고, `"old"`은 요약 없이 가장 오래된 항목을 삭제하며, `"new"`은 최신 항목을 거부합니다.
- `byChannel`: 공급자 ID를 키로 사용하는 채널별 `mode` 재정의입니다.
- `debounceMsByChannel`: 공급자 ID를 키로 사용하는 채널별 `debounceMs` 재정의입니다.

### 인바운드 디바운스

동일한 발신자가 빠르게 연속으로 보낸 텍스트 전용 메시지를 하나의 에이전트 턴으로 묶습니다. 미디어/첨부 파일은 즉시 플러시됩니다. 제어 명령은 디바운스를 우회합니다. 기본 `debounceMs`: `2000`.

### 기타 메시지 키

- `messages.messagePrefix`: 인바운드 사용자 메시지가 에이전트 런타임에 도달하기 전에 앞에 추가되는 접두사 텍스트입니다. 채널 컨텍스트 표시에만 제한적으로 사용하십시오.
- `messages.visibleReplies`: 직접, 그룹 및 채널 대화에서 표시되는 출처 응답을 제어합니다(`"message_tool"`은 표시되는 출력을 위해 `message(action=send)`이 필요하며, `"automatic"`은 이전처럼 일반 응답을 게시합니다).
- `messages.usageTemplate` / `messages.responseUsage`: 사용자 지정 `/usage` 바닥글 템플릿 및 기본 응답별 사용 모드입니다(`off | tokens | full`, 그리고 `tokens`의 레거시 별칭인 `on`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: 그룹 메시지 멘션 트리거 및 기록 창 크기입니다.
- `messages.suppressToolErrors`: `true`인 경우 사용자에게 표시되는 `⚠️` 도구 오류 경고를 숨깁니다(에이전트는 컨텍스트에서 오류를 계속 확인하고 재시도할 수 있습니다). 기본값: `false`.

### TTS(텍스트 음성 변환)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (기본값) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto`은 기본 자동 TTS 모드인 `off`, `always`, `inbound` 또는 `tagged`를 제어합니다. `/tts on|off`은 로컬 환경설정을 재정의할 수 있으며, `/tts status`은 실제 적용 상태를 표시합니다.
- `summaryModel`은 자동 요약에 사용되는 `agents.defaults.model.primary`을 재정의합니다.
- `modelOverrides`은 기본적으로 활성화되며(`enabled !== false`), `modelOverrides.allowProvider`은 선택적으로 활성화해야 합니다.
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 대체됩니다.
- 번들 음성 제공자는 Plugin에서 관리합니다. `plugins.allow`이 설정된 경우, 사용하려는 각 TTS 제공자 Plugin을 포함하십시오. 예를 들어 Edge TTS에는 `microsoft`을 포함합니다. 기존 `edge` 제공자 ID는 `microsoft`의 별칭으로 허용됩니다.
- `providers.openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 구성, `OPENAI_TTS_BASE_URL`, `https://api.openai.com/v1` 순입니다.
- `providers.openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면 OpenClaw는 이를 OpenAI 호환 TTS 서버로 취급하고 모델/음성 검증을 완화합니다.

---

## Talk

Talk 모드(macOS/iOS/Android 및 브라우저 Control UI)의 기본값입니다.

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "따뜻한 어조로 말하고 답변은 간결하게 유지하십시오.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- 여러 Talk 제공자가 구성된 경우 `talk.provider`은 `talk.providers`의 키와 일치해야 합니다.
- 기존의 평면형 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 목적으로만 제공됩니다. 영구 저장된 구성을 `talk.providers.<provider>` 형식으로 다시 작성하려면 `openclaw doctor --fix`을 실행하십시오.
- 음성 ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 대체됩니다(macOS Talk 클라이언트 동작).
- `providers.*.apiKey`은 일반 텍스트 문자열 또는 SecretRef 객체를 허용합니다.
- `ELEVENLABS_API_KEY` 대체 동작은 Talk API 키가 구성되지 않은 경우에만 적용됩니다.
- `providers.*.voiceAliases`을 사용하면 Talk 지시문에서 알아보기 쉬운 이름을 사용할 수 있습니다.
- `providers.mlx.modelId`은 macOS 로컬 MLX 도우미에서 사용하는 Hugging Face 저장소를 선택합니다. 생략하면 macOS에서 `mlx-community/Soprano-80M-bf16`을 사용합니다.
- macOS MLX 재생은 번들 `openclaw-mlx-tts` 도우미가 있으면 이를 통해 실행되고, 그렇지 않으면 `PATH`의 실행 파일을 통해 실행됩니다. `OPENCLAW_MLX_TTS_BIN`은 개발을 위해 도우미 경로를 재정의합니다.
- `consultThinkingLevel`은 Control UI Talk 실시간 `openclaw_agent_consult` 호출을 지원하는 전체 OpenClaw 에이전트 실행의 사고 수준을 제어합니다. 일반 세션/모델 동작을 유지하려면 설정하지 마십시오.
- `consultFastMode`은 세션의 일반 고속 모드 설정을 변경하지 않고 Control UI Talk 실시간 상담에 일회성 고속 모드 재정의를 설정합니다.
- `speechLocale`은 iOS/macOS Talk 음성 인식에 사용되는 BCP 47 로캘 ID를 설정합니다. 기기 기본값을 사용하려면 설정하지 마십시오.
- `silenceTimeoutMs`은 사용자가 침묵한 후 Talk 모드가 전사문을 전송하기까지 기다리는 시간을 제어합니다. 설정하지 않으면 플랫폼의 기본 일시 정지 시간(`700 ms on macOS and Android, 900 ms on iOS`)을 유지합니다.
- `realtime.instructions`은 제공자용 시스템 지침을 OpenClaw의 기본 실시간 프롬프트에 추가하므로, 기본 `openclaw_agent_consult` 지침을 잃지 않고 음성 스타일을 구성할 수 있습니다.
- `realtime.vadThreshold`은 제공자의 음성 활동 임계값을 `0`(가장 민감함)에서 `1`(가장 덜 민감함) 사이로 설정합니다. 설정하지 않으면 제공자 기본값을 유지합니다.
- `realtime.silenceDurationMs`은 제공자가 실시간 사용자 턴을 확정하기 전의 양의 정수 무음 구간을 설정합니다. 설정하지 않으면 제공자 기본값을 유지합니다.
- `realtime.prefixPaddingMs`은 음성이 감지되기 전에 보존되는 오디오의 양을 음수가 아닌 정수로 설정합니다. 설정하지 않으면 제공자 기본값을 유지합니다.
- `realtime.reasoningEffort`은 실시간 세션에 사용할 제공자별 추론 수준을 설정합니다. 설정하지 않으면 제공자 기본값을 유지합니다.
- `realtime.consultRouting`: `"provider-direct"`(기본값)은 실시간 제공자가 `openclaw_agent_consult` 없이 최종 사용자 전사문을 생성할 때 제공자의 직접 응답을 유지합니다. 대신 `"force-agent-consult"`은 확정된 요청을 OpenClaw를 통해 라우팅합니다.

---

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference) — 기타 모든 구성 키
- [구성](/ko/gateway/configuration) — 일반적인 작업 및 빠른 설정
- [구성 예시](/ko/gateway/configuration-examples)
