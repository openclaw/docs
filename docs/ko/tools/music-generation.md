---
read_when:
    - 에이전트를 통해 음악 또는 오디오 생성하기
    - 음악 생성 provider 및 모델 구성하기
    - '`music_generate` 도구 매개변수 이해하기'
summary: 공유 provider를 사용해 음악 생성하기(워크플로 기반 Plugin 포함)
title: 음악 생성
x-i18n:
    generated_at: "2026-04-25T06:12:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc6da03cd1cc5728e903b3c5bf0c47da65642842e38c1006419e2f2ce2400bda
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 도구를 사용하면 에이전트가 Google,
MiniMax, 워크플로 기반 ComfyUI 같은 구성된 provider를 통해
공유 음악 생성 capability로 음악이나 오디오를 만들 수 있습니다.

공유 provider 기반 에이전트 세션의 경우, OpenClaw는 음악 생성을
백그라운드 작업으로 시작하고, 작업 ledger에서 이를 추적한 뒤, 트랙이 준비되면
에이전트를 다시 깨워 원래 채널에 완성된 오디오를 다시 게시할 수 있게 합니다.

<Note>
내장 공유 도구는 최소 하나 이상의 음악 생성 provider를 사용할 수 있을 때만 나타납니다. 에이전트 도구 목록에 `music_generate`가 보이지 않는다면, `agents.defaults.musicGenerationModel`을 구성하거나 provider API 키를 설정하세요.
</Note>

## 빠른 시작

### 공유 provider 기반 생성

1. 예를 들어 `GEMINI_API_KEY` 또는
   `MINIMAX_API_KEY`처럼 최소 하나의 provider에 대한 API 키를 설정합니다.
2. 선택적으로 선호 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. 에이전트에게 이렇게 요청합니다: _"네온 도시를 달리는 밤 드라이브에 관한 경쾌한 신스팝 트랙을 생성해줘."_

에이전트가 `music_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은 필요 없습니다.

세션 기반 에이전트 실행이 없는 직접 동기 컨텍스트에서는,
내장 도구가 여전히 인라인 생성으로 대체되며 도구 결과에 최종 미디어 경로를 반환합니다.

예시 프롬프트:

```text
보컬 없이 부드러운 스트링이 들어간 영화 같은 피아노 트랙을 생성해줘.
```

```text
해 뜰 때 로켓을 발사하는 장면에 대한 에너지 넘치는 칩튠 루프를 생성해줘.
```

### 워크플로 기반 Comfy 생성

번들 `comfy` Plugin은
음악 생성 provider registry를 통해 공유 `music_generate` 도구에 연결됩니다.

1. `plugins.entries.comfy.config.music`에 워크플로 JSON과
   프롬프트/출력 노드를 구성합니다.
2. Comfy Cloud를 사용한다면 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를 설정합니다.
3. 에이전트에게 음악을 요청하거나 도구를 직접 호출합니다.

예시:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 공유 번들 provider 지원

| Provider | 기본 모델          | 참조 입력 | 지원 제어                                        | API 키                                |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 최대 1개 이미지    | 워크플로로 정의된 음악 또는 오디오                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 최대 10개 이미지  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | 없음             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### 선언된 capability 매트릭스

이것은 `music_generate`, 계약 테스트,
공유 live sweep에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `edit` | 편집 한도 | 공유 live lane                                                         |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | 예        | 예    | 1개 이미지    | 공유 sweep에는 없음, `extensions/comfy/comfy.live.test.ts`에서 다룸 |
| Google   | 예        | 예    | 10개 이미지  | `generate`, `edit`                                                        |
| MiniMax  | 예        | 아니요     | 없음       | `generate`                                                                |

런타임에 사용 가능한 공유 provider와 모델을 확인하려면 `action: "list"`를 사용하세요:

```text
/tool music_generate action=list
```

활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요:

```text
/tool music_generate action=status
```

직접 생성 예시:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 내장 도구 매개변수

| 매개변수         | 타입     | 설명                                                                                       |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | 음악 생성 프롬프트 (`action: "generate"`일 때 필수)                                       |
| `action`          | string   | `"generate"` (기본값), 현재 세션 작업용 `"status"`, provider 확인용 `"list"` |
| `model`           | string   | provider/모델 재정의, 예: `google/lyria-3-pro-preview` 또는 `comfy/workflow`                    |
| `lyrics`          | string   | provider가 명시적 가사 입력을 지원할 때 사용하는 선택적 가사                                   |
| `instrumental`    | boolean  | provider가 지원할 때 반주 전용 출력을 요청                                    |
| `image`           | string   | 단일 참조 이미지 경로 또는 URL                                                                |
| `images`          | string[] | 다중 참조 이미지 (최대 10개)                                                              |
| `durationSeconds` | number   | provider가 길이 힌트를 지원할 때 사용하는 목표 길이(초)                              |
| `timeoutMs`       | number   | 선택적 provider 요청 제한 시간(밀리초)                                                 |
| `format`          | string   | provider가 지원할 때 사용하는 출력 형식 힌트 (`mp3` 또는 `wav`)                                 |
| `filename`        | string   | 출력 파일명 힌트                                                                              |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 제출 전에도
입력 수 같은 하드 한도를 검증합니다. provider가 길이는 지원하지만
요청한 값보다 짧은 최대 길이를 사용하는 경우, OpenClaw는 자동으로 가장 가까운 지원 길이로
clamp합니다. 선택한 provider 또는 모델이 실제로 지원하지 않는 선택적 힌트는
경고와 함께 무시됩니다.

도구 결과는 적용된 설정을 보고합니다. provider fallback 중 OpenClaw가 길이를 clamp하면,
반환되는 `durationSeconds`는 제출된 값을 반영하고 `details.normalization.durationSeconds`는 요청값과 적용값의 매핑을 보여줍니다.

## 공유 provider 기반 경로의 비동기 동작

- 세션 기반 에이전트 실행: `music_generate`는 백그라운드 작업을 만들고, 즉시 started/task 응답을 반환하며, 나중에 후속 에이전트 메시지에서 완성된 트랙을 게시합니다.
- 중복 방지: 동일 세션에서 해당 백그라운드 작업이 여전히 `queued` 또는 `running` 상태이면, 이후의 `music_generate` 호출은 새 생성을 시작하지 않고 작업 상태를 반환합니다.
- 상태 조회: 새 생성을 시작하지 않고 현재 활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요.
- 작업 추적: 생성의 queued, running, terminal 상태를 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.
- 완료 wake: OpenClaw는 내부 완료 이벤트를 동일 세션에 다시 주입하여 모델이 사용자용 후속 메시지를 직접 작성하게 합니다.
- 프롬프트 힌트: 동일 세션에서 이후 사용자/수동 턴은 이미 음악 작업이 진행 중일 때 작은 런타임 힌트를 받아 모델이 무작정 다시 `music_generate`를 호출하지 않도록 합니다.
- no-session fallback: 실제 에이전트 세션이 없는 직접/로컬 컨텍스트에서는 여전히 인라인으로 실행되며 같은 턴에서 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

각 `music_generate` 요청은 네 가지 상태를 거칩니다:

1. **queued** -- 작업이 생성되었고 provider가 수락하기를 기다리는 중입니다.
2. **running** -- provider가 처리 중입니다(보통 provider와 길이에 따라 30초에서 3분).
3. **succeeded** -- 트랙이 준비되었고, 에이전트가 깨어나 이를 대화에 게시합니다.
4. **failed** -- provider 오류 또는 제한 시간 초과이며, 에이전트가 오류 세부 정보와 함께 깨어납니다.

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대해 음악 작업이 이미 `queued` 또는 `running`이면, `music_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다. 새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Provider 선택 순서

음악을 생성할 때 OpenClaw는 다음 순서로 provider를 시도합니다:

1. 에이전트가 지정한 경우 도구 호출의 `model` 매개변수
2. config의 `musicGenerationModel.primary`
3. 순서대로 `musicGenerationModel.fallbacks`
4. 인증 기반 provider 기본값만 사용한 자동 감지:
   - 먼저 현재 기본 provider
   - 그다음 등록된 나머지 음악 생성 provider를 provider ID 순서대로

provider가 실패하면 다음 후보가 자동으로 시도됩니다. 모두 실패하면
오류에 각 시도의 세부 정보가 포함됩니다.

음악 생성에 명시적 `model`, `primary`, `fallbacks`
항목만 사용하게 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

## Provider 참고

- Google은 Lyria 3 배치 생성을 사용합니다. 현재 번들 흐름은
  프롬프트, 선택적 가사 텍스트, 선택적 참조 이미지를 지원합니다.
- MiniMax는 배치 `music_generation` 엔드포인트를 사용합니다. 현재 번들 흐름은
  프롬프트, 선택적 가사, 반주 모드, 길이 조정,
  mp3 출력을 지원합니다.
- ComfyUI 지원은 워크플로 기반이며, 구성된 그래프와
  프롬프트/출력 필드용 노드 매핑에 따라 달라집니다.

## Provider capability 모드

공유 음악 생성 계약은 이제 명시적 모드 선언을 지원합니다:

- 프롬프트만 사용하는 생성용 `generate`
- 요청에 하나 이상의 참조 이미지가 포함될 때의 `edit`

새 provider 구현은 명시적 모드 블록을 선호해야 합니다:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`, `supportsLyrics`,
`supportsFormat` 같은 레거시 평면 필드는 edit 지원을 알리기에 충분하지 않습니다. Provider는
`generate`와 `edit`를 명시적으로 선언해야 live 테스트, 계약 테스트,
공유 `music_generate` 도구가 모드 지원을 결정론적으로 검증할 수 있습니다.

## 올바른 경로 선택하기

- 모델 선택, provider 장애 조치, 내장 비동기 작업/상태 흐름이 필요하다면 공유 provider 기반 경로를 사용하세요.
- 사용자 지정 워크플로 그래프나 공유 번들 음악 capability에 포함되지 않은 provider가 필요하다면 ComfyUI 같은 Plugin 경로를 사용하세요.
- ComfyUI별 동작을 디버깅하는 경우 [ComfyUI](/ko/providers/comfy)를 참조하세요. 공유 provider 동작을 디버깅하는 경우에는 [Google (Gemini)](/ko/providers/google) 또는 [MiniMax](/ko/providers/minimax)부터 시작하세요.

## Live 테스트

공유 번들 provider에 대한 opt-in live coverage:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

repo wrapper:

```bash
pnpm test:live:media music
```

이 live 파일은 `~/.profile`에서 누락된 provider env vars를 로드하고,
기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하며,
provider가 edit 모드를 활성화한 경우
`generate`와 선언된 `edit` coverage를 모두 실행합니다.

현재 기준:

- `google`: `generate` + `edit`
- `minimax`: `generate`만
- `comfy`: 공유 provider sweep이 아니라 별도의 Comfy live coverage

번들 ComfyUI 음악 경로에 대한 opt-in live coverage:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live 파일은 해당 섹션이 구성된 경우 comfy 이미지 및 비디오 워크플로도 함께 다룹니다.

## 관련 항목

- [Background Tasks](/ko/automation/tasks) - 분리된 `music_generate` 실행을 위한 작업 추적
- [Configuration Reference](/ko/gateway/config-agents#agent-defaults) - `musicGenerationModel` config
- [ComfyUI](/ko/providers/comfy)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [Models](/ko/concepts/models) - 모델 구성 및 장애 조치
- [Tools Overview](/ko/tools)
