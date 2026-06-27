---
read_when:
    - 에이전트를 통해 음악 또는 오디오 생성하기
    - 음악 생성 제공자 및 모델 구성
    - music_generate 도구 매개변수 이해하기
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax 및 OpenRouter 워크플로 전반에서 music_generate를 통해 음악 생성
title: 음악 생성
x-i18n:
    generated_at: "2026-06-27T18:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 도구를 사용하면 에이전트가 구성된 제공자(현재 ComfyUI,
fal, Google, MiniMax, OpenRouter)를 통해 공유 음악 생성 기능으로
음악이나 오디오를 만들 수 있습니다.

세션 기반 에이전트 실행의 경우 OpenClaw는 음악 생성을 백그라운드
작업으로 시작하고, 작업 원장에 추적한 다음, 트랙이 준비되면 에이전트를
다시 깨워 사용자에게 알리고 완성된 오디오를 첨부할 수 있게 합니다.
완료 에이전트는 세션의 일반적인 표시 응답 모드를 따릅니다. 구성된 경우
자동 최종 응답 전달을 사용하고, 세션에 메시지 도구가 필요한 경우
`message(action="send")`를 사용합니다. 요청자 세션이 비활성 상태이거나
활성 깨우기가 실패했고, 생성된 오디오 일부가 완료 응답에서 아직 누락된
경우 OpenClaw는 누락된 오디오만 포함하는 멱등 직접 폴백을 보냅니다.

<Note>
기본 제공 공유 도구는 하나 이상의 음악 생성 제공자를 사용할 수 있을 때만
나타납니다. 에이전트 도구에서 `music_generate`가 보이지 않으면
`agents.defaults.musicGenerationModel`을 구성하거나 제공자 API 키를
설정하세요.
</Note>

## 빠른 시작

<Tabs>
  <Tab title="공유 제공자 기반">
    <Steps>
      <Step title="인증 구성">
        하나 이상의 제공자에 API 키를 설정하세요. 예:
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
      <Step title="에이전트에 요청">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        에이전트가 `music_generate`를 자동으로 호출합니다. 도구
        허용 목록 지정은 필요 없습니다.
      </Step>
    </Steps>

    세션 기반 에이전트 실행이 없는 직접 동기 컨텍스트에서도 기본 제공
    도구는 여전히 인라인 생성으로 폴백하고 도구 결과에 최종 미디어
    경로를 반환합니다.

  </Tab>
  <Tab title="ComfyUI 워크플로">
    <Steps>
      <Step title="워크플로 구성">
        워크플로 JSON과 프롬프트/출력 노드로
        `plugins.entries.comfy.config.music`을 구성하세요.
      </Step>
      <Step title="클라우드 인증(선택 사항)">
        Comfy Cloud의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를
        설정하세요.
      </Step>
      <Step title="도구 호출">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

예시 프롬프트:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## 지원되는 제공자

| 제공자     | 기본 모델                    | 참조 입력      | 지원되는 제어                                         | 인증                                   |
| ---------- | ---------------------------- | -------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 이미지 최대 1개 | 워크플로가 정의한 음악 또는 오디오                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 없음           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 또는 `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | 이미지 최대 10개 | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 없음           | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` 또는 MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | 이미지 최대 1개 | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### 기능 매트릭스

`music_generate`, 계약 테스트, 공유 라이브 스윕에서 사용하는 명시적 모드
계약입니다.

| 제공자     | `generate` | `edit` | 편집 제한      | 공유 라이브 레인                                                        |
| ---------- | :--------: | :----: | -------------- | ----------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 이미지 1개     | 공유 스윕에는 없음; `extensions/comfy/comfy.live.test.ts`에서 다룸      |
| fal        |     ✓      |   —    | 없음           | `generate`                                                              |
| Google     |     ✓      |   ✓    | 이미지 10개    | `generate`, `edit`                                                      |
| MiniMax    |     ✓      |   —    | 없음           | `generate`                                                              |
| OpenRouter |     ✓      |   ✓    | 이미지 1개     | `generate`, `edit`                                                      |

런타임에 사용 가능한 공유 제공자와 모델을 살펴보려면 `action: "list"`를
사용하세요.

```text
/tool music_generate action=list
```

활성 세션 기반 음악 작업을 살펴보려면 `action: "status"`를 사용하세요.

```text
/tool music_generate action=status
```

직접 생성 예시:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 도구 매개변수

<ParamField path="prompt" type="string" required>
  음악 생성 프롬프트입니다. `action: "generate"`에 필요합니다.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 제공자를 살펴봅니다.
</ParamField>
<ParamField path="model" type="string">
  제공자/모델 재정의입니다(예: `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  제공자가 명시적 가사 입력을 지원할 때 사용하는 선택적 가사입니다.
</ParamField>
<ParamField path="instrumental" type="boolean">
  제공자가 지원하는 경우 반주 전용 출력을 요청합니다.
</ParamField>
<ParamField path="image" type="string">
  단일 참조 이미지 경로 또는 URL입니다.
</ParamField>
<ParamField path="images" type="string[]">
  여러 참조 이미지입니다(지원 제공자에서 최대 10개).
</ParamField>
<ParamField path="durationSeconds" type="number">
  제공자가 길이 힌트를 지원할 때 사용하는 목표 길이(초)입니다.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  제공자가 지원할 때 사용하는 출력 형식 힌트입니다.
</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하지는 않습니다. OpenClaw는 제출 전에
입력 개수 같은 엄격한 제한을 계속 검증합니다. 제공자가 길이를 지원하지만
요청된 값보다 짧은 최대값을 사용하는 경우 OpenClaw는 가장 가까운 지원
길이로 제한합니다. 선택된 제공자나 모델이 실제로 처리할 수 없는 지원되지
않는 선택적 힌트는 경고와 함께 무시됩니다. 도구 결과는 적용된 설정을
보고하며, `details.normalization`은 요청값에서 적용값으로의 매핑을
캡처합니다.
</Note>

제공자 요청 시간제한은 운영자 구성 전용입니다. OpenClaw는 구성된 경우
`agents.defaults.musicGenerationModel.timeoutMs`를 사용하고, 120000ms보다
낮은 값은 120000ms로 올리며, 그 외에는 제공자 요청 기본값을 300000ms로
설정합니다.

## 비동기 동작

세션 기반 음악 생성은 백그라운드 작업으로 실행됩니다.

- **백그라운드 작업:** `music_generate`는 백그라운드 작업을 만들고,
  시작됨/작업 응답을 즉시 반환한 다음, 나중에 후속 에이전트 메시지로
  완성된 트랙을 게시합니다.
- **중복 방지:** 작업이 `queued` 또는 `running`인 동안 같은 세션에서
  이후 `music_generate` 호출은 또 다른 생성을 시작하는 대신 작업 상태를
  반환합니다. 명시적으로 확인하려면 `action: "status"`를 사용하세요.
- **상태 조회:** `openclaw tasks list` 또는 `openclaw tasks show <taskId>`는
  대기 중, 실행 중, 종료 상태를 살펴봅니다.
- **완료 깨우기:** OpenClaw는 내부 완료 이벤트를 같은 세션에 다시 주입하여
  모델이 사용자 대상 후속 메시지를 직접 작성할 수 있게 합니다.
- **프롬프트 힌트:** 같은 세션의 이후 사용자/수동 턴은 음악 작업이 이미
  진행 중일 때 작은 런타임 힌트를 받으므로, 모델이 무작정
  `music_generate`를 다시 호출하지 않습니다.
- **세션 없음 폴백:** 실제 에이전트 세션이 없는 직접/로컬 컨텍스트는
  인라인으로 실행되고 같은 턴에 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

| 상태        | 의미                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 작업이 생성되었고, 제공자가 수락하기를 기다리는 중입니다.                                      |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 길이에 따라 30초에서 3분).                          |
| `succeeded` | 트랙이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                    |
| `failed`    | 제공자 오류 또는 시간제한입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                  |

CLI에서 상태 확인:

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
4. 인증 기반 제공자 기본값만 사용한 자동 감지:
   - 현재 기본 제공자를 먼저 사용합니다.
   - 나머지 등록된 음악 생성 제공자를 제공자 ID 순서로 사용합니다.

제공자가 실패하면 다음 후보가 자동으로 시도됩니다. 모두 실패하면 오류에
각 시도의 세부 정보가 포함됩니다.

명시적 `model`, `primary`, `fallbacks` 항목만 사용하려면
`agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

## 제공자 참고 사항

<AccordionGroup>
  <Accordion title="ComfyUI">
    워크플로 기반이며 프롬프트/출력 필드에 대해 구성된 그래프와 노드 매핑에
    따라 달라집니다. 번들 `comfy` Plugin은 음악 생성 제공자 레지스트리를
    통해 공유 `music_generate` 도구에 연결됩니다.
  </Accordion>
  <Accordion title="fal">
    공유 제공자 인증 경로를 통해 fal 모델 엔드포인트를 사용합니다. 번들
    제공자의 기본값은 `fal-ai/minimax-music/v2.6`이며, 프롬프트-오디오
    요청을 위해 `fal-ai/ace-step/prompt-to-audio`와
    `fal-ai/stable-audio-25/text-to-audio`도 노출합니다.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 배치 생성을 사용합니다. 현재 번들 흐름은 프롬프트, 선택적 가사
    텍스트, 선택적 참조 이미지를 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    배치 `music_generation` 엔드포인트를 사용합니다. 프롬프트, 선택적 가사,
    반주 모드, 그리고 `minimax` API 키 인증 또는 `minimax-portal` OAuth를
    통한 mp3 출력을 지원합니다.
  </Accordion>
  <Accordion title="OpenRouter">
    스트리밍이 활성화된 OpenRouter 채팅 완성 오디오 출력을 사용합니다.
    번들 제공자의 기본값은 `google/lyria-3-pro-preview`이며
    `openrouter/google/lyria-3-clip-preview`도 노출합니다.
  </Accordion>
</AccordionGroup>

## 올바른 경로 선택

- 모델 선택, 제공자 장애 조치, 기본 제공 비동기 작업/상태 흐름이 필요하면
  **공유 제공자 기반**을 사용하세요.
- 사용자 지정 워크플로 그래프가 필요하거나 공유 번들 음악 기능에 포함되지
  않은 제공자가 필요하면 **Plugin 경로(ComfyUI)**를 사용하세요.

ComfyUI별 동작을 디버깅하는 경우
[ComfyUI](/ko/providers/comfy)를 참조하세요. 공유 provider
동작을 디버깅하는 경우 [fal](/ko/providers/fal), [Google (Gemini)](/ko/providers/google),
[MiniMax](/ko/providers/minimax) 또는 [OpenRouter](/ko/providers/openrouter)부터 시작하세요.

## Provider 기능 모드

공유 음악 생성 계약은 명시적 모드 선언을 지원합니다.

- 프롬프트만 사용하는 생성을 위한 `generate`.
- 요청에 하나 이상의 참조 이미지가 포함될 때의 `edit`.

새 provider 구현은 명시적 모드 블록을 우선적으로 사용해야 합니다.

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

`maxInputImages`, `supportsLyrics`, `supportsFormat` 같은 레거시 플랫 필드만으로는
`edit` 지원을 알리기에 **충분하지 않습니다**. provider는 live 테스트, 계약
테스트, 공유 `music_generate` 도구가 모드 지원을 결정적으로 검증할 수 있도록
`generate`와 `edit`를 명시적으로 선언해야 합니다.

## Live 테스트

공유 번들 provider에 대한 opt-in live 범위:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo 래퍼:

```bash
pnpm test:live:media music
```

이 live 파일은 기본적으로 저장된 인증 프로필보다 이미 내보낸 provider 환경 변수를
우선 사용하며, provider가 edit 모드를 활성화하면 `generate`와 선언된 `edit` 범위를
모두 실행합니다. 현재 범위:

- `google`: `generate` 및 `edit`
- `fal`: `generate`만
- `minimax`: `generate`만
- `openrouter`: `generate` 및 `edit`
- `comfy`: 공유 provider 스윕이 아닌 별도의 Comfy live 범위

번들 ComfyUI 음악 경로에 대한 opt-in live 범위:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live 파일은 해당 섹션이 구성된 경우 comfy 이미지 및 비디오 워크플로도
포함합니다.

## 관련 항목

- [백그라운드 작업](/ko/automation/tasks) — 분리된 `music_generate` 실행의 작업 추적
- [ComfyUI](/ko/providers/comfy)
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — `musicGenerationModel` 구성
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [모델](/ko/concepts/models) — 모델 구성 및 failover
- [도구 개요](/ko/tools)
