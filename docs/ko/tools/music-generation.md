---
read_when:
    - 에이전트를 통해 음악 또는 오디오 생성하기
    - 음악 생성 제공자 및 모델 구성하기
    - music_generate 도구 매개변수 이해하기
sidebarTitle: Music generation
summary: Google Lyria, MiniMax, ComfyUI 워크플로 전반에서 music_generate를 통해 음악 생성
title: 음악 생성
x-i18n:
    generated_at: "2026-05-11T20:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 도구를 사용하면 에이전트가 구성된 제공자(Google,
MiniMax, 그리고 현재는 워크플로로 구성된 ComfyUI)를 통해 공유 음악 생성
기능으로 음악이나 오디오를 만들 수 있습니다.

세션 기반 에이전트 실행의 경우 OpenClaw는 음악 생성을 백그라운드 작업으로
시작하고, 이를 작업 원장에 추적한 다음, 트랙이 준비되면 에이전트를 다시 깨워
에이전트가 사용자에게 알리고 완성된 오디오를 첨부할 수 있게 합니다.
메시지 도구만으로 보이는 전달을 사용하는 그룹/채널 채팅에서는 에이전트가
메시지 도구를 통해 결과를 전달합니다. 완료 에이전트가 비공개 최종 응답만
작성하면 OpenClaw는 생성된 미디어를 포함해 직접 채널 전송으로 대체합니다.
완료 깨우기는 해당 경로에서 일반 최종 응답이 비공개라는 점을 에이전트에게
명시적으로 경고합니다.

<Note>
기본 제공 공유 도구는 음악 생성 제공자가 하나 이상 사용 가능할 때만
나타납니다. 에이전트 도구에 `music_generate`가 보이지 않으면
`agents.defaults.musicGenerationModel`을 구성하거나 제공자 API 키를
설정하세요.
</Note>

## 빠른 시작

<Tabs>
  <Tab title="공유 제공자 기반">
    <Steps>
      <Step title="인증 구성">
        최소 하나의 제공자에 대한 API 키를 설정합니다. 예:
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        에이전트가 `music_generate`를 자동으로 호출합니다. 도구 허용 목록은
        필요하지 않습니다.
      </Step>
    </Steps>

    세션 기반 에이전트 실행이 없는 직접 동기 컨텍스트에서도 기본 제공 도구는
    여전히 인라인 생성으로 대체되며, 도구 결과에 최종 미디어 경로를 반환합니다.

  </Tab>
  <Tab title="ComfyUI 워크플로">
    <Steps>
      <Step title="워크플로 구성">
        워크플로 JSON 및 프롬프트/출력 노드로
        `plugins.entries.comfy.config.music`을 구성합니다.
      </Step>
      <Step title="클라우드 인증(선택 사항)">
        Comfy Cloud의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를
        설정합니다.
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

| 제공자 | 기본 모델          | 참조 입력 | 지원되는 제어 항목                                        | 인증                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 이미지 최대 1개    | 워크플로에서 정의한 음악 또는 오디오                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 이미지 최대 10개  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 없음             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 또는 MiniMax OAuth     |

### 기능 매트릭스

`music_generate`, 계약 테스트, 공유 라이브 스윕에서 사용하는 명시적 모드 계약:

| 제공자 | `generate` | `edit` | 편집 제한 | 공유 라이브 레인                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 이미지 1개    | 공유 스윕에는 없음. `extensions/comfy/comfy.live.test.ts`에서 다룸 |
| Google   |     ✓      |   ✓    | 이미지 10개  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 없음       | `generate`                                                                |

런타임에 사용 가능한 공유 제공자와 모델을 확인하려면 `action: "list"`를
사용하세요.

```text
/tool music_generate action=list
```

활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요.

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
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 제공자를 검사합니다.
</ParamField>
<ParamField path="model" type="string">
  제공자/모델 재정의입니다(예: `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  제공자가 명시적 가사 입력을 지원할 때 사용할 선택적 가사입니다.
</ParamField>
<ParamField path="instrumental" type="boolean">
  제공자가 지원할 때 보컬 없는 출력만 요청합니다.
</ParamField>
<ParamField path="image" type="string">
  단일 참조 이미지 경로 또는 URL입니다.
</ParamField>
<ParamField path="images" type="string[]">
  여러 참조 이미지입니다(지원하는 제공자에서 최대 10개).
</ParamField>
<ParamField path="durationSeconds" type="number">
  제공자가 길이 힌트를 지원할 때 목표 길이(초)입니다.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  제공자가 지원할 때 출력 형식 힌트입니다.
</ParamField>
<ParamField path="filename" type="string">출력 파일 이름 힌트입니다.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 제공자 요청 제한 시간(밀리초)입니다. 생략하면 구성된 경우 OpenClaw는 `agents.defaults.musicGenerationModel.timeoutMs`를 사용합니다. 10000ms보다 낮은 값은 10000ms로 올려지며 도구 결과에 보고됩니다.</ParamField>

<Note>
모든 제공자가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 제출 전에
입력 개수 같은 엄격한 제한을 여전히 검증합니다. 제공자가 길이를 지원하지만
요청한 값보다 더 짧은 최댓값을 사용하는 경우 OpenClaw는 가장 가까운 지원
길이로 제한합니다. 선택한 제공자나 모델이 실제로 처리할 수 없는 선택적 힌트는
경고와 함께 무시됩니다. 도구 결과는 적용된 설정을 보고하며,
`details.normalization`은 요청값에서 적용값으로의 모든 매핑을 캡처합니다.
</Note>

## 비동기 동작

세션 기반 음악 생성은 백그라운드 작업으로 실행됩니다.

- **백그라운드 작업:** `music_generate`는 백그라운드 작업을 만들고,
  시작됨/작업 응답을 즉시 반환한 다음, 나중에 후속 에이전트 메시지에서
  완성된 트랙을 게시합니다.
- **중복 방지:** 작업이 `queued` 또는 `running` 상태인 동안에는 같은 세션의
  이후 `music_generate` 호출이 다른 생성을 시작하는 대신 작업 상태를
  반환합니다. 명시적으로 확인하려면 `action: "status"`를 사용하세요.
- **상태 조회:** `openclaw tasks list` 또는 `openclaw tasks show <taskId>`는
  대기 중, 실행 중, 종료 상태를 검사합니다.
- **완료 깨우기:** OpenClaw는 모델이 사용자에게 보이는 후속 메시지를 직접
  작성할 수 있도록 같은 세션에 내부 완료 이벤트를 다시 주입합니다.
- **프롬프트 힌트:** 같은 세션의 이후 사용자/수동 턴은 음악 작업이 이미
  진행 중일 때 작은 런타임 힌트를 받으므로, 모델이 무작정 `music_generate`를
  다시 호출하지 않습니다.
- **세션 없음 대체:** 실제 에이전트 세션이 없는 직접/로컬 컨텍스트는 인라인으로
  실행되고 같은 턴에 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

| 상태       | 의미                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 작업이 생성되었으며 제공자가 수락하기를 기다리는 중입니다.                                           |
| `running`   | 제공자가 처리 중입니다(일반적으로 제공자와 길이에 따라 30초에서 3분). |
| `succeeded` | 트랙이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                 |
| `failed`    | 제공자 오류 또는 제한 시간 초과입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                                 |

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
        fallbacks: ["minimax/music-2.6"],
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
   - 현재 기본 제공자가 먼저;
   - 나머지 등록된 음악 생성 제공자를 제공자 ID 순서대로.

제공자가 실패하면 다음 후보가 자동으로 시도됩니다. 모두 실패하면 오류에 각
시도의 세부 정보가 포함됩니다.

명시적 `model`, `primary`, `fallbacks` 항목만 사용하려면
`agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

## 제공자 참고 사항

<AccordionGroup>
  <Accordion title="ComfyUI">
    워크플로 기반이며 프롬프트/출력 필드에 대한 구성된 그래프와 노드 매핑에
    의존합니다. 번들 `comfy` Plugin은 음악 생성 제공자 레지스트리를 통해
    공유 `music_generate` 도구에 연결됩니다.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 배치 생성을 사용합니다. 현재 번들 플로는 프롬프트, 선택적 가사
    텍스트, 선택적 참조 이미지를 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    배치 `music_generation` 엔드포인트를 사용합니다. `minimax` API 키 인증
    또는 `minimax-portal` OAuth를 통해 프롬프트, 선택적 가사, 보컬 없는 모드,
    길이 조정, mp3 출력을 지원합니다.
  </Accordion>
</AccordionGroup>

## 올바른 경로 선택

- **공유 제공자 기반**: 모델 선택, 제공자 장애 조치, 기본 제공 비동기
  작업/상태 플로가 필요할 때 사용합니다.
- **Plugin 경로(ComfyUI)**: 사용자 지정 워크플로 그래프나 공유 번들 음악
  기능에 포함되지 않은 제공자가 필요할 때 사용합니다.

ComfyUI 관련 동작을 디버깅하는 경우
[ComfyUI](/ko/providers/comfy)를 참조하세요. 공유 제공자 동작을 디버깅하는 경우
[Google (Gemini)](/ko/providers/google) 또는 [MiniMax](/ko/providers/minimax)부터
시작하세요.

## 제공자 기능 모드

공유 음악 생성 계약은 명시적 모드 선언을 지원합니다.

- 프롬프트만 사용하는 생성에는 `generate`.
- 요청에 하나 이상의 참조 이미지가 포함된 경우 `edit`.

새 제공자 구현은 명시적 모드 블록을 선호해야 합니다.

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
편집 지원을 광고하기에 **충분하지 않습니다**. 제공자는 라이브 테스트, 계약
테스트, 공유 `music_generate` 도구가 모드 지원을 결정적으로 검증할 수 있도록
`generate`와 `edit`를 명시적으로 선언해야 합니다.

## 라이브 테스트

공유 번들 제공자에 대한 옵트인 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

저장소 래퍼:

```bash
pnpm test:live:media music
```

이 라이브 파일은 누락된 제공자 환경 변수를 `~/.profile`에서 로드하고, 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선하며, 제공자가 편집 모드를 활성화하면 `generate`와 선언된 `edit` 커버리지를 모두 실행합니다. 현재 커버리지:

- `google`: `generate`와 `edit`
- `minimax`: `generate`만
- `comfy`: 별도의 Comfy 라이브 커버리지이며, 공유 제공자 스윕에는 포함되지 않음

번들로 제공되는 ComfyUI 음악 경로의 라이브 커버리지를 사용하려면 다음을 선택적으로 활성화하세요.

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy 라이브 파일은 해당 섹션이 구성된 경우 Comfy 이미지 및 비디오 워크플로도 포함합니다.

## 관련 항목

- [백그라운드 작업](/ko/automation/tasks) — 분리된 `music_generate` 실행을 위한 작업 추적
- [ComfyUI](/ko/providers/comfy)
- [구성 참고 자료](/ko/gateway/config-agents#agent-defaults) — `musicGenerationModel` 구성
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [모델](/ko/concepts/models) — 모델 구성 및 장애 조치
- [도구 개요](/ko/tools)
