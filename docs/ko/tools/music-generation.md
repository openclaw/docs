---
read_when:
    - 에이전트를 통해 음악 또는 오디오 생성하기
    - 음악 생성 provider 및 모델 구성하기
    - '`music_generate` 도구 매개변수 이해하기'
sidebarTitle: Music generation
summary: Google Lyria, MiniMax 및 ComfyUI 워크플로 전반에서 `music_generate`로 음악 생성하기
title: 음악 생성
x-i18n:
    generated_at: "2026-04-26T11:40:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 도구를 사용하면 에이전트가 구성된 provider를 통해 공용 음악 생성 기능으로 음악이나 오디오를 만들 수 있습니다. 현재는 Google, MiniMax, 그리고 워크플로 기반으로 구성된 ComfyUI를 지원합니다.

세션 기반 에이전트 실행에서는 OpenClaw가 음악 생성을 백그라운드 작업으로 시작하고, 작업 원장에 추적한 다음, 트랙이 준비되면 에이전트를 다시 깨워 원래 채널에 완성된 오디오를 게시할 수 있게 합니다.

<Note>
내장 공용 도구는 하나 이상의 음악 생성 provider를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에 `music_generate`가 보이지 않는다면 `agents.defaults.musicGenerationModel`을 구성하거나 provider API key를 설정하세요.
</Note>

## 빠른 시작

<Tabs>
  <Tab title="공용 provider 기반">
    <Steps>
      <Step title="인증 구성">
        최소 하나의 provider에 API key를 설정합니다. 예를 들어
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
        _"네온 도시를 가로지르는 야간 드라이브를 주제로 경쾌한 신스팝 트랙을 만들어줘."_

        에이전트가 자동으로 `music_generate`를 호출합니다. 도구 허용 목록 설정은 필요하지 않습니다.
      </Step>
    </Steps>

    세션 기반 에이전트 실행이 없는 직접 동기 컨텍스트에서는
    내장 도구가 여전히 인라인 생성으로 대체되고 도구 결과에서 최종
    미디어 경로를 반환합니다.

  </Tab>
  <Tab title="ComfyUI 워크플로">
    <Steps>
      <Step title="워크플로 구성">
        워크플로 JSON 및 프롬프트/출력 노드를 사용해
        `plugins.entries.comfy.config.music`를 구성합니다.
      </Step>
      <Step title="클라우드 인증(선택 사항)">
        Comfy Cloud의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를 설정합니다.
      </Step>
      <Step title="도구 호출">
        ```text
        /tool music_generate prompt="부드러운 테이프 질감이 있는 따뜻한 앰비언트 신스 루프"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

예시 프롬프트:

```text
보컬 없이 부드러운 스트링이 들어간 영화 같은 피아노 트랙을 생성해줘.
```

```text
해돋이 때 로켓을 발사하는 내용을 담은 에너지 넘치는 칩튠 루프를 생성해줘.
```

## 지원되는 provider

| Provider | 기본 모델          | 참조 입력 | 지원되는 제어                                        | 인증                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 이미지 최대 1개    | 워크플로로 정의된 음악 또는 오디오                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 이미지 최대 10개  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 없음             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 또는 MiniMax OAuth     |

### 기능 매트릭스

`music_generate`, 계약 테스트, 공용 라이브 스윕에서 사용하는 명시적 모드 계약:

| Provider | `generate` | `edit` | 편집 한도 | 공용 라이브 레인                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 이미지 1개    | 공용 스윕에는 없음. `extensions/comfy/comfy.live.test.ts`에서 커버 |
| Google   |     ✓      |   ✓    | 이미지 10개  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 없음       | `generate`                                                                |

런타임에서 사용 가능한 공용 provider와 모델을 확인하려면
`action: "list"`를 사용하세요.

```text
/tool music_generate action=list
```

활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요.

```text
/tool music_generate action=status
```

직접 생성 예시:

```text
/tool music_generate prompt="비닐 질감과 잔잔한 빗소리가 있는 몽환적인 로파이 힙합" instrumental=true
```

## 도구 매개변수

<ParamField path="prompt" type="string" required>
  음악 생성 프롬프트. `action: "generate"`에서 필수입니다.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`는 현재 세션 작업을 반환하고, `"list"`는 provider를 조회합니다.
</ParamField>
<ParamField path="model" type="string">
  provider/model 재정의(예: `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  provider가 명시적 가사 입력을 지원할 때 사용하는 선택적 가사입니다.
</ParamField>
<ParamField path="instrumental" type="boolean">
  provider가 지원할 때 연주곡만 출력하도록 요청합니다.
</ParamField>
<ParamField path="image" type="string">
  단일 참조 이미지 경로 또는 URL.
</ParamField>
<ParamField path="images" type="string[]">
  여러 참조 이미지(지원 provider에서는 최대 10개).
</ParamField>
<ParamField path="durationSeconds" type="number">
  provider가 길이 힌트를 지원할 때 목표 길이(초)입니다.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  provider가 지원할 때 출력 형식 힌트입니다.
</ParamField>
<ParamField path="filename" type="string">출력 파일명 힌트.</ParamField>
<ParamField path="timeoutMs" type="number">선택적 provider 요청 타임아웃(밀리초).</ParamField>

<Note>
모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 제출 전에 입력 수 같은 하드 제한은 여전히 검증합니다. provider가 길이를 지원하지만 요청값보다 더 짧은 최대값을 사용하는 경우, OpenClaw는 가장 가까운 지원 길이로 값을 제한합니다. 실제로 지원되지 않는 선택적 힌트는 선택한 provider 또는 모델이 이를 처리할 수 없을 때 경고와 함께 무시됩니다. 도구 결과는 적용된 설정을 보고하며, `details.normalization`은 요청값에서 적용값으로의 매핑을 기록합니다.
</Note>

## 비동기 동작

세션 기반 음악 생성은 백그라운드 작업으로 실행됩니다.

- **백그라운드 작업:** `music_generate`는 백그라운드 작업을 만들고, 즉시 시작됨/작업 응답을 반환한 다음, 나중에 후속 에이전트 메시지에서 완성된 트랙을 게시합니다.
- **중복 방지:** 같은 세션에서 작업이 `queued` 또는 `running` 상태인 동안 이후의 `music_generate` 호출은 새 생성을 시작하는 대신 작업 상태를 반환합니다. 명시적으로 확인하려면 `action: "status"`를 사용하세요.
- **상태 조회:** `openclaw tasks list` 또는 `openclaw tasks show <taskId>`로 대기 중, 실행 중, 종료 상태를 확인합니다.
- **완료 wake:** OpenClaw는 모델이 사용자용 후속 메시지를 직접 작성할 수 있도록 내부 완료 이벤트를 같은 세션에 다시 주입합니다.
- **프롬프트 힌트:** 같은 세션의 이후 사용자/수동 턴에는 음악 작업이 이미 진행 중일 때 작은 런타임 힌트가 제공되므로, 모델이 무작정 `music_generate`를 다시 호출하지 않습니다.
- **세션 없음 fallback:** 실제 에이전트 세션이 없는 직접/로컬 컨텍스트에서는 인라인으로 실행되고 같은 턴에서 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

| 상태       | 의미                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 작업이 생성되었고 provider가 수락하기를 기다리는 중입니다.                                           |
| `running`   | provider가 처리 중입니다(일반적으로 provider와 길이에 따라 30초~3분). |
| `succeeded` | 트랙이 준비되었습니다. 에이전트가 깨어나 대화에 게시합니다.                                 |
| `failed`    | provider 오류 또는 타임아웃입니다. 에이전트가 오류 세부 정보와 함께 깨어납니다.                                 |

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

### provider 선택 순서

OpenClaw는 다음 순서로 provider를 시도합니다.

1. 도구 호출의 `model` 매개변수(에이전트가 지정한 경우).
2. 구성의 `musicGenerationModel.primary`.
3. 순서대로 `musicGenerationModel.fallbacks`.
4. 인증 기반 provider 기본값만 사용하는 자동 감지:
   - 현재 기본 provider 우선
   - 나머지 등록된 음악 생성 provider를 provider-id 순서로

provider가 실패하면 다음 후보를 자동으로 시도합니다. 모두
실패하면 오류에 각 시도에 대한 세부 정보가 포함됩니다.

명시적인 `model`, `primary`, `fallbacks` 항목만 사용하려면
`agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

## provider 참고 사항

<AccordionGroup>
  <Accordion title="ComfyUI">
    워크플로 기반이며 구성된 그래프와 프롬프트/출력 필드용 노드 매핑에 따라 달라집니다. 번들된 `comfy` Plugin은 음악 생성 provider 레지스트리를 통해 공용 `music_generate` 도구에 연결됩니다.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 배치 생성을 사용합니다. 현재 번들된 흐름은 프롬프트, 선택적 가사 텍스트, 선택적 참조 이미지를 지원합니다.
  </Accordion>
  <Accordion title="MiniMax">
    배치 `music_generation` 엔드포인트를 사용합니다. 프롬프트, 선택적 가사, 연주곡 모드, 길이 조정, `minimax` API-key 인증 또는 `minimax-portal` OAuth를 통한 mp3 출력을 지원합니다.
  </Accordion>
</AccordionGroup>

## 적절한 경로 선택

- **공용 provider 기반**: 모델 선택, provider failover, 내장된 비동기 작업/상태 흐름이 필요할 때.
- **Plugin 경로(ComfyUI)**: 사용자 지정 워크플로 그래프가 필요하거나 공용 번들 음악 기능에 포함되지 않은 provider가 필요할 때.

ComfyUI 전용 동작을 디버깅하는 경우
[ComfyUI](/ko/providers/comfy)를 참고하세요. 공용 provider 동작을
디버깅하는 경우 [Google (Gemini)](/ko/providers/google) 또는
[MiniMax](/ko/providers/minimax)부터 시작하세요.

## provider 기능 모드

공용 음악 생성 계약은 명시적 모드 선언을 지원합니다.

- 프롬프트만으로 생성하는 `generate`
- 하나 이상의 참조 이미지가 요청에 포함될 때 사용하는 `edit`

새 provider 구현에서는 명시적 모드 블록을 사용하는 것이 좋습니다.

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

`maxInputImages`, `supportsLyrics`, `supportsFormat` 같은
레거시 평면 필드만으로는 편집 지원을 알리기에 **충분하지 않습니다**. provider는 `generate`와 `edit`를 명시적으로 선언해야 라이브 테스트, 계약 테스트, 공용 `music_generate` 도구가 모드 지원을 결정적으로 검증할 수 있습니다.

## 라이브 테스트

공용 번들 provider에 대한 opt-in 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

저장소 래퍼:

```bash
pnpm test:live:media music
```

이 라이브 파일은 `~/.profile`에서 누락된 provider 환경 변수를 로드하고,
기본적으로 저장된 인증 프로필보다 라이브/환경 변수 API key를 우선 사용하며,
provider가 edit 모드를 활성화하면 `generate`와 선언된 `edit` 커버리지를 모두 실행합니다. 현재 커버리지:

- `google`: `generate` 및 `edit`
- `minimax`: `generate`만
- `comfy`: 별도 Comfy 라이브 커버리지이며, 공용 provider 스윕은 아님

번들된 ComfyUI 음악 경로에 대한 opt-in 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy 라이브 파일은 해당 섹션이 구성된 경우 comfy 이미지 및 비디오 워크플로도 함께 다룹니다.

## 관련 항목

- [백그라운드 작업](/ko/automation/tasks) — 분리된 `music_generate` 실행을 위한 작업 추적
- [ComfyUI](/ko/providers/comfy)
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — `musicGenerationModel` 구성
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [Models](/ko/concepts/models) — 모델 구성 및 failover
- [도구 개요](/ko/tools)
