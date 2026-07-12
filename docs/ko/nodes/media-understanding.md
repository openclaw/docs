---
read_when:
    - 미디어 이해 기능 설계 또는 리팩터링
    - 수신 오디오/비디오/이미지 전처리 조정
sidebarTitle: Media understanding
summary: 프로바이더 및 CLI 폴백을 사용하는 수신 이미지/오디오/동영상 이해(선택 사항)
title: 미디어 이해
x-i18n:
    generated_at: "2026-07-12T00:55:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw은 응답 파이프라인이 실행되기 전에 수신 미디어(이미지/오디오/비디오)를 요약할 수 있으므로, 명령어 구문 분석과 라우팅이 원시 바이트 대신 짧은 텍스트를 기반으로 작동합니다. 이해 기능은 로컬 도구 또는 제공업체 키를 자동으로 감지하며, 명시적으로 모델을 구성할 수도 있습니다. 원본 미디어는 항상 평소와 같이 모델에 전달됩니다. 이해 기능이 실패하거나 비활성화되어도 응답 흐름은 변경 없이 계속됩니다.

공급업체 Plugin은 기능 메타데이터(어떤 제공업체가 어떤 미디어 유형을 지원하는지, 기본 모델, 우선순위)를 등록합니다. OpenClaw 코어는 공유 `tools.media` 구성, 폴백 순서, 응답 파이프라인 통합을 담당합니다.

## 작동 방식

<Steps>
  <Step title="첨부 파일 수집">
    수신 첨부 파일(`MediaPaths`, `MediaUrls`, `MediaTypes`)을 수집합니다.
  </Step>
  <Step title="기능별 선택">
    활성화된 각 기능(이미지/오디오/비디오)에 대해 `attachments` 정책(기본값: 첫 번째 첨부 파일만)에 따라 첨부 파일을 선택합니다.
  </Step>
  <Step title="모델 선택">
    사용 가능한 첫 번째 모델 항목(크기 + 기능 + 인증 사용 가능)을 선택합니다.
  </Step>
  <Step title="실패 시 폴백">
    모델에서 오류가 발생하거나 시간이 초과되거나 미디어가 `maxBytes`를 초과하면 다음 항목을 시도합니다.
  </Step>
  <Step title="성공 시 적용">
    `Body`가 `[Image]`, `[Audio]` 또는 `[Video]` 블록으로 바뀝니다. 오디오는 `{{Transcript}}`도 설정합니다. 캡션 텍스트가 있으면 명령어 구문 분석에 이를 사용하고, 그렇지 않으면 전사문을 사용합니다. 캡션은 블록 안에 `User text:`로 보존됩니다.
  </Step>
</Steps>

## 구성

`tools.media`에는 공유 모델 목록과 기능별 재정의가 포함됩니다.

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

기능별(`image`/`audio`/`video`) 키:

| 키                                              | 유형      | 기본값                                               | 참고                                                                                |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 자동(`false`로 비활성화)                             | 이 기능의 자동 감지를 끄려면 `false`로 설정합니다.                                  |
| `models`                                        | 배열      | 없음                                                 | 공유 `tools.media.models` 목록보다 먼저 사용됩니다.                                 |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ maxChars 지침)          | 기본적으로 이미지/비디오에만 적용됩니다.                                            |
| `maxChars`                                      | `number`  | `500`(이미지/비디오), 미설정(오디오)                 | 모델이 더 많은 내용을 반환하면 출력이 잘립니다.                                     |
| `maxBytes`                                      | `number`  | 이미지 `10485760`, 오디오 `20971520`, 비디오 `52428800` | 크기가 초과된 미디어는 건너뛰고 다음 모델을 사용합니다.                          |
| `timeoutSeconds`                                | `number`  | `60`(이미지/오디오), `120`(비디오)                   |                                                                                     |
| `language`                                      | `string`  | 미설정                                               | 오디오 전사 언어 힌트                                                               |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | 제공업체 요청 재정의입니다. [도구 및 사용자 지정 제공업체](/ko/gateway/config-tools)를 참조하세요. |
| `attachments`                                   | 객체      | `{ mode: "first", maxAttachments: 1 }`               | [첨부 파일 정책](#attachment-policy)을 참조하세요.                                  |
| `scope`                                         | 객체      | 미설정                                               | 채널/`chatType`/`keyPrefix`별 제한                                                   |
| `echoTranscript`                                | `boolean` | `false`                                              | 오디오 전용: 에이전트 처리 전에 전사문을 채팅에 다시 표시합니다.                     |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 오디오 전용: `{transcript}` 자리표시자                                               |

Deepgram 전용 옵션은 `providerOptions.deepgram` 아래에 지정합니다(최상위 `deepgram: { detectLanguage, punctuate, smartFormat }` 필드는 더 이상 권장되지 않지만 여전히 읽습니다).

### 모델 항목

각 `models[]` 항목은 **제공업체** 항목(기본값) 또는 **CLI** 항목입니다.

<Tabs>
  <Tab title="제공업체 항목">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI 항목">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI 템플릿에서는 `{{MediaDir}}`(미디어 파일이 있는 디렉터리), `{{OutputDir}}`(이 실행을 위해 생성된 임시 디렉터리), `{{OutputBase}}`(확장자가 없는 임시 파일 기본 경로)도 사용할 수 있습니다.

  </Tab>
</Tabs>

### 제공업체 자격 증명

제공업체 미디어 이해 기능은 일반 모델 호출과 동일한 인증 확인 순서를 사용합니다. 인증 프로필, 환경 변수, `models.providers.<providerId>.apiKey` 순입니다. `tools.media.*.models[]` 항목에는 인라인 `apiKey` 필드를 사용할 수 없습니다.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

프로필, 환경 변수, 사용자 지정 기본 URL은 [도구 및 사용자 지정 제공업체](/ko/gateway/config-tools)를 참조하세요.

## 규칙 및 동작

- `maxBytes`를 초과하는 미디어는 해당 모델을 건너뛰고 다음 모델을 시도합니다.
- 1024바이트 미만의 오디오 파일은 비어 있거나 손상된 것으로 간주하여 전사 전에 건너뜁니다. 대신 에이전트에는 결정론적 자리표시자 전사문이 전달됩니다.
- 활성 기본 이미지 모델이 이미 비전을 기본 지원하면 OpenClaw은 `[Image]` 요약 블록을 생략하고 원본 이미지를 모델에 직접 전달합니다. MiniMax는 예외입니다. 기존 MiniMax M2.x 채팅 메타데이터가 이미지 입력을 지원한다고 표시하더라도 `minimax`, `minimax-cn`, `minimax-portal`, `minimax-portal-cn`은 항상 Plugin이 소유한 `MiniMax-VL-01` 미디어 제공업체를 통해 이미지 이해를 라우팅합니다(`MiniMax-M3` 이상만 비전을 기본 지원하는 것으로 취급합니다).
- Gateway/WebChat 기본 모델이 텍스트 전용이면 이미지 첨부 파일을 오프로딩된 `media://inbound/*` 참조로 보존합니다. 따라서 첨부 파일을 잃지 않고 이미지/PDF 도구나 구성된 이미지 모델에서 계속 검사할 수 있습니다.
- 명시적 `openclaw infer image describe --file <path> --model <provider/model>`(별칭: `openclaw capability image describe`)은 이미지 기능을 지원하는 해당 제공업체/모델을 직접 실행합니다. `models.providers.ollama.models[]` 아래에 일치하는 이미지 지원 모델이 구성되어 있으면 `ollama/qwen2.5vl:7b` 같은 Ollama 참조도 포함됩니다.
- `<capability>.enabled`가 `false`가 아니지만 구성된 모델이 없으면 OpenClaw은 활성 응답 모델의 제공업체가 해당 기능을 지원할 때 그 모델을 시도합니다.

### 자동 감지(기본값)

`tools.media.<capability>.enabled`가 `false`가 아니고 구성된 모델이 없으면 OpenClaw은 다음 순서로 시도하고, 처음 작동하는 옵션에서 중단합니다.

<Steps>
  <Step title="구성된 이미지 모델(이미지 전용)">
    활성 응답 모델이 이미 비전을 기본 지원하지 않는 경우 `agents.defaults.imageModel`의 기본/폴백 참조를 사용합니다. `provider/model` 참조를 권장합니다. 한정되지 않은 참조는 일치 항목이 고유한 경우에만 구성된 이미지 지원 제공업체 모델 항목을 기준으로 한정됩니다.
  </Step>
  <Step title="활성 응답 모델">
    활성 응답 모델의 제공업체가 해당 기능을 지원하면 이 모델을 사용합니다.
  </Step>
  <Step title="제공업체 인증(오디오 전용, 로컬 CLI보다 먼저)">
    오디오를 지원하도록 구성된 `models.providers.*` 항목을 로컬 CLI보다 먼저 시도합니다. 번들 제공업체 우선순위(동률이면 제공업체 ID의 알파벳순): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="로컬 CLI(오디오 전용)">
    준비된 로컬 바이너리가 다음 순서의 폴백 목록이 됩니다.
    - 현재 프로세스의 이전 모델 호출에서 Metal 또는 CUDA가 관찰된 경우에만 `whisper-cli`가 우선
    - CPU 기본값인 `sherpa-onnx-offline`(`tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
    - 가속 기능이 빌드상 가능할 뿐이거나 관찰되지 않은 경우 `whisper-cli`
    - Apple Silicon의 `parakeet-mlx`(MLX 기능 지원, 장치 사용은 관찰되지 않음)
    - `whisper`(Python CLI, 기본값은 `turbo` 모델이며 자동으로 다운로드)

    백엔드 기능 검사는 캐시되며 모델을 로드하지 않습니다. 빌드 기능, 요청된 백엔드 플래그, 실제 호출에서 관찰된 백엔드는 서로 별도로 유지됩니다. 자동 감지된 whisper.cpp는 모델 실행 로그를 활성화한 상태로 두어 업스트림에서 선택한 백엔드 행을 기록할 수 있게 합니다. 명시적 CLI 항목은 구성된 순서, 백엔드 플래그, 출력 플래그를 유지합니다.

  </Step>
  <Step title="제공업체 인증(이미지/비디오)">
    해당 기능을 지원하도록 구성된 `models.providers.*` 항목을 번들 폴백 순서보다 먼저 시도합니다. 이미지 지원 모델이 있는 이미지 전용 구성 제공업체는 번들 공급업체 Plugin이 아니어도 미디어 이해 기능에 자동 등록됩니다.

    번들 제공업체 우선순위(동률이면 제공업체 ID의 알파벳순):
    - 이미지: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 비디오: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI(이미지/비디오 전용)">
    처음 설치된 `agy` 또는 `antigravity` 바이너리(`OPENCLAW_ANTIGRAVITY_CLI`로 재정의)를 미디어 디렉터리로 제한된 샌드박스에서 실행합니다.
  </Step>
</Steps>

기능의 자동 감지를 비활성화하려면 다음과 같이 설정합니다.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
바이너리 감지는 macOS/Linux/Windows에서 최선형으로 수행됩니다. CLI가 `PATH`에 포함되어 있는지 확인하거나(`~`는 확장됨), 전체 명령 경로가 포함된 명시적 CLI 모델 항목을 설정하세요.
</Note>

### 프록시 지원(오디오/비디오 제공업체 호출)

제공업체 기반 **오디오** 및 **비디오** 이해 기능은 `NO_PROXY`/`no_proxy` 우회 규칙을 포함한 표준 아웃바운드 프록시 환경 변수 `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`를 따릅니다. 소문자 변수가 대문자 변수보다 우선합니다. 아무것도 설정되지 않으면 미디어 이해 기능은 직접 송신을 사용합니다. 프록시 값의 형식이 잘못된 경우 OpenClaw은 경고를 기록하고 직접 가져오기로 폴백합니다. 이미지 이해 기능은 이 프록시 경로를 사용하지 않습니다.

## 기능

`models[]` 항목에 `capabilities`를 설정하여 특정 미디어 유형으로 제한합니다. 공유 목록에서는 OpenClaw이 번들 제공업체별 기본값을 추론합니다.

| 제공자                                                                   | 기능                  |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 이미지                |
| `minimax-portal`                                                         | 이미지                |
| `moonshot`                                                               | 이미지 + 동영상       |
| `openrouter`                                                             | 이미지 + 오디오       |
| `google` (Gemini API)                                                    | 이미지 + 오디오 + 동영상 |
| `qwen`                                                                   | 이미지 + 동영상       |
| `deepinfra`                                                              | 이미지 + 오디오       |
| `mistral`                                                                | 오디오                |
| `zai`                                                                    | 이미지                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 오디오                |
| 이미지 지원 모델이 포함된 모든 `models.providers.<id>.models[]` 카탈로그 | 이미지                |

CLI 항목에서는 예상치 못한 일치를 방지하도록 `capabilities`를 명시적으로 설정하세요. 생략하면 해당 항목이 표시되는 모든 기능 목록의 대상이 됩니다.

## 제공자 지원 매트릭스

| 기능   | 제공자                                                                                                                                                  | 참고                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이미지 | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, 구성 제공자         | 공급업체 Plugin이 이미지 지원을 등록합니다. `openai/*`는 API 키 또는 Codex OAuth 라우팅을 사용할 수 있고, `codex/*`는 제한된 Codex app-server 턴을 사용하며, 이미지 지원 구성 제공자는 자동 등록됩니다. |
| 오디오 | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                               | 제공자 음성 변환(Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)입니다.                                                                                                  |
| 동영상 | Google, Moonshot, Qwen                                                                                                                                  | 공급업체 Plugin을 통한 제공자 동영상 이해 기능입니다. Qwen 동영상 이해 기능은 표준 DashScope 엔드포인트를 사용합니다.                                                                               |

<Note>
**MiniMax 참고**: 레거시 MiniMax M2.x 채팅 메타데이터에서 이미지 입력을 지원한다고 명시하더라도 `minimax`, `minimax-cn`, `minimax-portal`, `minimax-portal-cn`의 이미지 이해 기능은 항상 Plugin이 소유한 `MiniMax-VL-01` 미디어 제공자를 통해 제공됩니다.
</Note>

## 모델 선택 지침

- 품질과 안전이 중요할 때는 각 미디어 기능에 가장 강력한 최신 세대 모델을 우선 사용하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 지원 에이전트에는 오래되거나 성능이 낮은 미디어 모델을 사용하지 마세요.
- 가용성을 위해 기능별로 하나 이상의 대체 모델을 유지하세요(고품질 모델 + 더 빠르거나 저렴한 모델).
- CLI 대체 수단(`whisper-cli`, `whisper`, `gemini`)은 제공자 API를 사용할 수 없을 때 유용합니다.
- 알려진 파일 출력 모드가 최종 기준입니다. 추론된 변환 결과 파일이 비어 있거나 없으면 CLI 진행률 출력으로 대체하지 않고 변환 결과를 생성하지 않습니다.
- `parakeet-mlx`: `--output-dir` 및 기본 `{filename}` 출력 템플릿과 함께 `--output-format txt`(또는 `all`)를 사용하세요. 업스트림 `PARAKEET_OUTPUT_FORMAT` 및 `PARAKEET_OUTPUT_TEMPLATE` 환경 변수도 적용됩니다. OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. 기본 `srt` 형식, 기타 형식 및 사용자 지정 출력 템플릿은 계속 표준 출력을 사용합니다.

## 첨부 파일 정책

기능별 `attachments`는 처리할 첨부 파일을 제어합니다.

<ParamField path="mode" type='"first" | "all"' default="first">
  선택한 첫 번째 첨부 파일만 처리하거나 모두 처리합니다.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  처리할 개수의 상한을 설정합니다.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  후보 첨부 파일 중 선택 우선순위를 지정합니다.
</ParamField>

`mode: "all"`이면 출력에 `[이미지 1/2]`, `[오디오 2/2]` 등의 레이블이 지정됩니다.

### 파일 첨부 내용 추출

- 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 신뢰할 수 없는 외부 콘텐츠로 감싸집니다. `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 경계 마커와 `출처: 외부` 메타데이터 줄을 사용합니다.
- 이 경로에서는 미디어 프롬프트를 짧게 유지하기 위해 긴 `보안 알림:` 배너를 의도적으로 생략합니다. 경계 마커와 메타데이터는 계속 적용됩니다.
- 추출할 수 있는 텍스트가 없는 파일에는 `[추출 가능한 텍스트 없음]`이 사용됩니다.
- PDF가 렌더링된 페이지 이미지로 대체되면 OpenClaw는 해당 이미지를 비전 지원 응답 모델로 전달하고 파일 블록에 `[PDF 콘텐츠가 이미지로 렌더링됨]` 자리표시자를 유지합니다.

## 구성 예시

<Tabs>
  <Tab title="공유 모델 + 재정의">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="오디오 + 동영상 전용">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="이미지 전용">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="다중 모달 단일 항목">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 상태 출력

미디어 이해 기능이 실행되면 `/status`에 기능별 요약 줄이 포함됩니다.

```
📎 미디어: 이미지 정상 (openai/gpt-5.6-sol) · 오디오 정상 (whisper-cli 관측됨=metal)
```

사전 점검 인벤토리를 확인하려면 `openclaw capability audio providers`를 실행하세요. 로컬 행은 전역 제공자 선택, 준비 상태, 그리고 구분된 지원 가능/요청됨/관측됨 백엔드 필드와 별도로 로컬 대체 수단의 우선 선택 항목을 표시합니다. 동일한 로컬 선택 사항은 정보성 doctor 결과로도 확인할 수 있습니다.

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## 참고

- 이해 기능은 최선형으로 동작합니다. 오류가 발생해도 응답을 차단하지 않습니다.
- 이해 기능이 비활성화되어 있어도 첨부 파일은 모델에 계속 전달됩니다.
- `scope`를 사용하여 이해 기능이 실행되는 위치를 제한하세요(예: DM에서만 실행).

## 관련 문서

- [구성](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
