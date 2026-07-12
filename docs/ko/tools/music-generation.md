---
read_when:
    - 에이전트를 통한 음악 또는 오디오 생성
    - 음악 생성 제공자 및 모델 구성하기
    - music_generate 도구 매개변수 이해하기
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax 및 OpenRouter 워크플로 전반에서 music_generate를 통해 음악 생성
title: 음악 생성
x-i18n:
    generated_at: "2026-07-12T01:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 도구는 ComfyUI, fal, Google, MiniMax 및 OpenRouter를 기반으로 하는 공유 음악 생성 기능을 통해 음악이나 오디오를 생성합니다.

<Note>
`music_generate`는 명시적인 `agents.defaults.musicGenerationModel` 구성 또는 인증이 구성된 제공자(예: 설정된 API 키)처럼 사용 가능한 음악 생성 제공자가 하나 이상인 경우에만 표시됩니다.
</Note>

세션 기반 에이전트 실행에서 `music_generate`는 백그라운드 작업으로 시작하여 작업 원장에서 진행 상황을 추적한 다음, 트랙이 준비되면 에이전트를 깨워 사용자에게 알리고 완성된 오디오를 첨부하도록 합니다. 완료 에이전트는 세션의 표시 응답 계약을 따릅니다. 구성된 경우 자동으로 최종 응답을 보내고, 세션에서 메시지 도구를 요구하는 경우 `message(action="send")`를 사용합니다. 요청자 세션이 비활성 상태이거나 깨우기에 실패했고 생성된 오디오가 응답에 여전히 누락되어 있으면, OpenClaw는 누락된 오디오만 포함한 멱등성 직접 폴백을 전송합니다.

## 빠른 시작

<Tabs>
  <Tab title="공유 제공자 기반">
    <Steps>
      <Step title="인증 구성">
        하나 이상의 제공자에 API 키를 설정합니다. 예:
        `GEMINI_API_KEY` 또는 `MINIMAX_API_KEY`.
      </Step>
      <Step title="기본 모델 선택(선택 사항)">
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
      </Step>
      <Step title="에이전트에게 요청">
        _"네온 도시를 가로지르는 야간 드라이브를 주제로 경쾌한 신스팝 트랙을 생성해 줘."_

        에이전트가 `music_generate`를 자동으로 호출합니다. 도구 허용 목록에 추가할 필요가 없습니다.
      </Step>
    </Steps>

    세션 기반 에이전트 실행이 없는 직접/로컬 컨텍스트에서는 도구가 인라인으로 실행되고 동일한 도구 결과에 최종 미디어 경로를 반환합니다.

  </Tab>
  <Tab title="ComfyUI 워크플로">
    <Steps>
      <Step title="워크플로 구성">
        워크플로 JSON 및 프롬프트/출력 Node를 사용하여 `plugins.entries.comfy.config.music`을 구성합니다.
      </Step>
      <Step title="클라우드 인증(선택 사항)">
        Comfy Cloud의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를 설정합니다.
      </Step>
      <Step title="도구 호출">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

프롬프트 예시:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

사용 가능한 제공자/모델을 확인하려면 `action: "list"`를 사용하고, 활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용합니다.

```text
/tool music_generate action=list
/tool music_generate action=status
```

직접 생성 예시:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 지원되는 제공자

| 제공자     | 기본 모델                    | 참조 입력       | 지원되는 제어 항목                                      | 인증                                   |
| ---------- | ---------------------------- | --------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 이미지 최대 1개 | 워크플로에서 정의한 음악 또는 오디오                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 없음            | `lyrics`, `instrumental`, `durationSeconds`, `format`   | `FAL_KEY` 또는 `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | 이미지 최대 10개 | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 없음            | `lyrics`, `instrumental`, `format`(mp3만 지원)          | `MINIMAX_API_KEY` 또는 MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | 이미지 최대 1개 | `lyrics`, `instrumental`, `durationSeconds`, `format`   | `OPENROUTER_API_KEY`                   |

MiniMax는 동일한 모델을 공유하는 두 개의 제공자 ID를 등록합니다. API 키 인증에는 `minimax`, OAuth에는 `minimax-portal`을 사용합니다. 모델 참조는 인증 경로를 따릅니다(`minimax/music-2.6`과 `minimax-portal/music-2.6`). 자세한 내용은 [MiniMax](/ko/providers/minimax#music-generation)를 참조하세요.

fal은 기본 MiniMax 기반 모델 외에도 `fal-ai/ace-step/prompt-to-audio`(wav, 가사 미지원, 인스트루멘털 전환 미지원)와 `fal-ai/stable-audio-25/text-to-audio`(wav, 프롬프트만 지원)를 제공합니다. Google의 기본 `lyria-3-clip-preview`는 mp3만 출력하며, `lyria-3-pro-preview`는 wav도 지원합니다. MiniMax는 `music-2.6-free`, `music-cover`, `music-cover-free`도 제공합니다. OpenRouter는 `google/lyria-3-clip-preview`도 제공합니다.

### 기능 매트릭스

`music_generate`, 계약 테스트 및 공유 라이브 점검에서 사용하는 명시적 모드 계약:

| 제공자     | `generate` | `edit` | 편집 한도     | 공유 라이브 경로                                                         |
| ---------- | :--------: | :----: | ------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 이미지 1개    | 공유 점검에는 포함되지 않으며 `extensions/comfy/comfy.live.test.ts`에서 다룸 |
| fal        |     ✓      |   —    | 없음          | `generate`                                                                |
| Google     |     ✓      |   ✓    | 이미지 10개   | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | 없음          | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 이미지 1개    | `generate`, `edit`                                                        |

## 도구 매개변수

<ParamField path="prompt" type="string" required>
  음악 생성 프롬프트입니다. `action: "generate"`에 필수입니다.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 제공자를 확인합니다.
</ParamField>
<ParamField path="model" type="string">
  제공자/모델 재정의입니다(예: `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  제공자가 명시적 가사 입력을 지원할 때 사용할 선택적 가사입니다.
</ParamField>
<ParamField path="instrumental" type="boolean">
  제공자가 지원할 때 인스트루멘털 전용 출력을 요청합니다.
</ParamField>
<ParamField path="image" type="string">
  단일 참조 이미지 경로 또는 URL입니다.
</ParamField>
<ParamField path="images" type="string[]">
  여러 참조 이미지입니다(지원하는 제공자에서 최대 10개).
</ParamField>
<ParamField path="durationSeconds" type="number">
  제공자가 길이 힌트를 지원할 때 사용할 목표 길이(초)입니다.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  제공자가 지원할 때 사용할 출력 형식 힌트입니다.
</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 제출 전에 입력 개수와 같은 엄격한 제한을 계속 검증합니다. 제공자가 길이를 지원하지만 요청한 값보다 최대 길이가 짧은 경우 OpenClaw는 가장 가까운 지원 길이로 제한합니다. 선택한 제공자나 모델이 실제로 지원할 수 없는 선택적 힌트는 경고와 함께 무시됩니다. 도구 결과에는 적용된 설정이 보고되며, `details.normalization`에는 요청 값이 적용 값으로 매핑된 내용이 기록됩니다.
</Note>

제공자 요청 시간 제한은 운영자 구성 전용입니다. OpenClaw는 구성된 경우 `agents.defaults.musicGenerationModel.timeoutMs`를 사용하고, 120000ms 미만의 값은 120000ms로 올리며, 그 외에는 제공자 요청의 기본값으로 300000ms를 사용합니다.

## 비동기 동작

세션 기반 음악 생성은 백그라운드 작업으로 실행됩니다.

- **백그라운드 작업:** `music_generate`는 백그라운드 작업을 생성하고 시작됨/작업 응답을 즉시 반환한 다음, 완료된 트랙을 후속 에이전트 메시지로 나중에 게시합니다.
- **중복 방지:** 작업이 `queued` 또는 `running` 상태인 동안 동일한 세션에서 이후에 호출된 `music_generate`는 다른 생성을 시작하는 대신 작업 상태를 반환합니다. 명시적으로 확인하려면 `action: "status"`를 사용합니다. 최근 완료된 일치 요청도 2분 동안 중복 제거됩니다.
- **상태 조회:** `openclaw tasks list` 또는 `openclaw tasks show <taskId>`로 대기 중, 실행 중 및 종료 상태를 확인합니다.
- **완료 시 깨우기:** OpenClaw는 내부 완료 이벤트를 동일한 세션에 다시 주입하여 모델이 사용자에게 표시되는 후속 메시지를 직접 작성할 수 있도록 합니다.
- **프롬프트 힌트:** 음악 작업이 이미 진행 중인 경우 동일한 세션의 후속 사용자/수동 턴에는 작은 런타임 힌트가 제공되므로 모델이 무작정 `music_generate`를 다시 호출하지 않습니다.
- **세션 없음 폴백:** 실제 에이전트 세션이 없는 직접/로컬 컨텍스트에서는 인라인으로 실행되며 동일한 턴에 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

음악 작업은 일반 작업 레지스트리와 동일한 상태를 표시합니다. `timed_out`, `cancelled`, `lost`를 포함한 전체 상태 머신은 [백그라운드 작업](/ko/automation/tasks#task-lifecycle)을 참조하세요. 대부분의 음악 실행은 다음 상태를 거칩니다.

| 상태        | 의미                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | 작업이 생성되어 제공자가 수락하기를 기다리는 중입니다.                                        |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 길이에 따라 30초~3분).                             |
| `succeeded` | 트랙이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                   |
| `failed`    | 제공자 오류 또는 시간 초과가 발생했습니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.       |

CLI에서 상태를 확인합니다.

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### 제공자 선택 순서

OpenClaw는 다음 순서로 제공자를 시도합니다.

1. 도구 호출의 `model` 매개변수(에이전트가 지정한 경우).
2. 구성의 `musicGenerationModel.primary`.
3. 순서대로 `musicGenerationModel.fallbacks`.
4. 인증 기반 제공자의 기본값만 사용한 자동 감지:
   - 현재 기본 텍스트 모델 제공자가 음악 생성도 제공하는 경우 해당 제공자를 먼저 사용
   - 나머지 등록된 음악 생성 제공자를 제공자 ID의 알파벳순으로 사용

제공자에 실패하면 다음 후보를 자동으로 시도합니다. 모두 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

명시적 `model`, `primary`, `fallbacks` 항목만 사용하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`로 설정합니다.

## 제공자 참고 사항

<AccordionGroup>
  <Accordion title="ComfyUI">
    워크플로 기반이며, 구성된 그래프와 프롬프트/출력 필드의 노드 매핑에
    따라 달라집니다. 번들 `comfy` Plugin은 음악 생성 제공자
    레지스트리를 통해 공유 `music_generate` 도구에 연결됩니다.
  </Accordion>
  <Accordion title="fal">
    공유 제공자 인증 경로를 통해 fal 모델 엔드포인트를 사용합니다. 번들
    제공자는 기본적으로 `fal-ai/minimax-music/v2.6`을 사용하며, 프롬프트-오디오
    요청을 위해 `fal-ai/ace-step/prompt-to-audio`와
    `fal-ai/stable-audio-25/text-to-audio`도 제공합니다.
    가사와 연주곡 모드는 MiniMax 모델에서만 지원되며, 나머지 두
    모델은 프롬프트만 지원합니다.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 일괄 생성을 사용합니다. 현재 번들 흐름은
    프롬프트, 선택적 가사 텍스트, 선택적 참조 이미지를 지원합니다.
    기본 `lyria-3-clip-preview` 모델은 mp3만 출력하며,
    `lyria-3-pro-preview` 모델은 wav도 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    일괄 `music_generation` 엔드포인트를 사용합니다. `minimax`
    API 키 인증 또는 `minimax-portal` OAuth를 통해 프롬프트, 선택적
    가사, 연주곡 모드, mp3 출력을 지원합니다. 또한 `music-2.6-free`,
    `music-cover`, `music-cover-free` 모델도 제공합니다.
  </Accordion>
  <Accordion title="OpenRouter">
    스트리밍을 활성화한 OpenRouter 채팅 완성 오디오 출력을 사용합니다.
    번들 제공자는 기본적으로 `google/lyria-3-pro-preview`를 사용하며,
    `openrouter/google/lyria-3-clip-preview`도 제공합니다.
  </Accordion>
</AccordionGroup>

## 적합한 경로 선택

- 모델 선택, 제공자 장애 조치, 기본 제공 비동기 작업/상태 흐름이
  필요하면 **공유 제공자 기반** 경로를 사용합니다.
- 사용자 지정 워크플로 그래프나 공유 번들 음악 기능에 포함되지 않은
  제공자가 필요하면 **Plugin 경로(ComfyUI)**를 사용합니다.

ComfyUI 관련 동작을 디버깅하는 경우
[ComfyUI](/ko/providers/comfy)를 참조하세요. 공유 제공자 동작을
디버깅하는 경우 [fal](/ko/providers/fal), [Google (Gemini)](/ko/providers/google),
[MiniMax](/ko/providers/minimax), [OpenRouter](/ko/providers/openrouter)부터 확인하세요.

## 제공자 기능 모드

공유 음악 생성 계약은 명시적인 모드 선언을 지원합니다.

- 프롬프트만 사용하는 생성에는 `generate`를 사용합니다.
- 요청에 하나 이상의 참조 이미지가 포함되면 `edit`를 사용합니다.

새 제공자 구현에서는 명시적인 모드 블록을 사용하는 것이 좋습니다.

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

`maxInputImages`, `supportsLyrics`, `supportsFormat` 같은 기존의 평면
필드만으로는 편집 지원을 알리기에 **충분하지 않습니다**. 제공자는
실시간 테스트, 계약 테스트, 공유 `music_generate` 도구가 모드 지원을
결정론적으로 검증할 수 있도록 `generate`와 `edit`를 명시적으로 선언해야
합니다.

## 실시간 테스트

공유 번들 제공자(fal, Google, MiniMax, OpenRouter)의 선택적 실시간
테스트 범위:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

동일한 테스트 파일을 실행하는 동등한 저장소 래퍼:

```bash
pnpm test:live:media:music
```

이 실시간 테스트 파일은 기본적으로 저장된 인증 프로필보다 이미 내보낸
제공자 환경 변수를 우선 사용하며, 제공자가 편집 모드를 활성화한 경우
`generate`와 선언된 `edit` 테스트를 모두 실행합니다. 현재 테스트 범위:

- `google`: `generate` 및 `edit`
- `fal`: `generate`만
- `minimax`: `generate`만
- `openrouter`: `generate` 및 `edit`
- `comfy`: 공유 제공자 전체 테스트가 아닌 별도의 Comfy 실시간 테스트 범위

번들 ComfyUI 음악 경로의 선택적 실시간 테스트 범위:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy 실시간 테스트 파일은 해당 섹션이 구성된 경우 comfy 이미지 및
비디오 워크플로도 테스트합니다.

## 관련 항목

- [백그라운드 작업](/ko/automation/tasks) — 분리 실행된 `music_generate`의 작업 추적
- [ComfyUI](/ko/providers/comfy)
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — `musicGenerationModel` 구성
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [모델](/ko/concepts/models) — 모델 구성 및 장애 조치
- [도구 개요](/ko/tools)
