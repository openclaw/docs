---
read_when:
    - '`openclaw infer` 명령 추가 또는 수정'
    - 안정적인 헤드리스 기능 자동화 설계
summary: 제공자 기반 모델, 이미지, 오디오, TTS, 동영상, 웹 및 임베딩 워크플로를 위한 추론 우선 CLI
title: 추론 CLI
x-i18n:
    generated_at: "2026-07-12T15:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer`는 공급자 기반 추론을 위한 표준 헤드리스 인터페이스입니다. 원시 Gateway RPC 이름이나 에이전트 도구 ID가 아니라 기능 패밀리(`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`)를 노출합니다. `openclaw capability ...`는 동일한 명령어 트리의 별칭입니다.

일회성 공급자 래퍼보다 이를 선호해야 하는 이유는 다음과 같습니다.

- OpenClaw에 이미 구성된 공급자와 모델을 재사용합니다.
- 스크립트 및 에이전트 기반 자동화를 위한 안정적인 `--json` 봉투를 제공합니다([JSON 출력](#json-output) 참조).
- 대부분의 하위 명령어에서 Gateway 없이 일반적인 로컬 경로를 실행합니다.
- 엔드투엔드 공급자 검사 시 공급자 요청이 전송되기 전에 배포된 CLI, 구성 로딩, 기본 에이전트 확인, 번들 Plugin 활성화 및 공유 기능 런타임을 실행합니다.

## infer를 skill로 전환하기

다음을 복사하여 에이전트에 붙여 넣으십시오.

```text
https://docs.openclaw.ai/cli/infer를 읽은 다음, 자주 사용하는 워크플로를 `openclaw infer`로 라우팅하는 skill을 만드십시오.
모델 실행, 이미지 생성, 동영상 생성, 오디오 전사, TTS, 웹 검색 및 임베딩에 중점을 두십시오.
```

좋은 infer 기반 skill은 일반적인 사용자 의도를 적절한 하위 명령어에 매핑하고, 워크플로마다 몇 가지 표준 예제를 포함하며, 저수준 대안보다 `openclaw infer ...`를 우선하고, skill 본문에서 전체 infer 인터페이스를 다시 문서화하지 않습니다.

## 명령어 트리

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>`는 이 트리를 데이터(기능 ID, 전송 방식, 설명)로 표시합니다.

## 일반적인 작업

| 작업                          | 명령어                                                                                       | 참고                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 텍스트/모델 프롬프트 실행       | `openclaw infer model run --prompt "..." --json`                                              | 기본적으로 로컬에서 실행합니다                                      |
| 이미지에 모델 프롬프트 실행      | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 이미지가 여러 개이면 `--file`을 반복해서 사용합니다                   |
| 이미지 생성                    | `openclaw infer image generate --prompt "..." --json`                                         | 기존 파일에서 시작할 때는 `image edit`를 사용합니다                  |
| 이미지 파일 또는 URL 설명       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model`은 이미지 기능을 지원하는 `<provider/model>`이어야 합니다 |
| 오디오 전사                    | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model`은 `<provider/model>`이어야 합니다                  |
| 음성 합성                      | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status`는 Gateway를 통해서만 실행됩니다            |
| 동영상 생성                    | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution`과 같은 공급자 힌트를 지원합니다        |
| 동영상 파일 설명                | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model`은 `<provider/model>`이어야 합니다                  |
| 웹 검색                        | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 웹 페이지 가져오기              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 임베딩 생성                    | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 동작

- 출력이 다른 명령어나 스크립트의 입력으로 전달될 때는 `--json`을 사용하고, 그 외에는 텍스트 출력을 사용하십시오.
- 특정 백엔드를 고정하려면 `--provider` 또는 `--model provider/model`을 사용하십시오.
- 일회성 사고/추론 재정의에는 `model run --thinking <level>`을 사용하십시오. 사용 가능한 값은 `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` 또는 `max`입니다.
- `image describe`, `audio transcribe`, `video describe`에서 `--model`은 `<provider/model>` 형식을 사용해야 합니다.
- `image describe`에서 `--file`은 로컬 경로와 HTTP(S) URL을 허용하며, 원격 URL에는 일반 미디어 가져오기 SSRF 정책이 적용됩니다.
- 상태 비저장 실행 명령어(`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`)는 기본적으로 로컬에서 실행됩니다. Gateway에서 관리하는 상태 명령어(`tts status`)는 기본적으로 Gateway에서 실행됩니다.
- 로컬 경로는 Gateway가 실행 중일 것을 요구하지 않습니다.
- 로컬 `model run`은 간결한 일회성 공급자 완성 요청입니다. 구성된 에이전트 모델과 인증을 확인하지만, 채팅 에이전트 턴을 시작하거나 도구를 로드하거나 번들 MCP 서버를 열지 않습니다.
- `model run --file`은 이미지 파일(자동 감지된 MIME 유형)을 프롬프트에 첨부합니다. 이미지가 여러 개이면 `--file`을 반복해서 사용하십시오. 이미지가 아닌 파일은 거부됩니다. 대신 `infer audio transcribe` 또는 `infer video describe`를 사용하십시오.
- `model run --gateway`는 Gateway 라우팅, 저장된 인증, 공급자 선택 및 내장 런타임을 실행하지만 원시 모델 프로브로 유지됩니다. 이전 세션 기록, 부트스트랩/AGENTS 컨텍스트, 도구 또는 번들 MCP 서버는 포함되지 않습니다.
- `model run --gateway --model <provider/model>`은 Gateway에 일회성 공급자/모델 재정의를 실행하도록 요청하므로 신뢰할 수 있는 운영자용 Gateway 자격 증명이 필요합니다.

## 모델

텍스트 추론 및 모델/공급자 검사입니다.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gateway를 시작하거나 에이전트 도구 인터페이스를 로드하지 않고 하나의 공급자를 스모크 테스트하려면 `--local`과 함께 전체 `<provider/model>` 참조를 사용하십시오.

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

참고:

- 로컬 `model run`은 공급자/모델/인증 상태를 확인하기 위한 가장 좁은 범위의 CLI 스모크 테스트입니다. ChatGPT-Codex 이외의 공급자에는 제공된 프롬프트만 전송합니다.
- 로컬 `model run --model <provider/model>`은 해당 공급자가 구성에 기록되기 전에 정확한 번들 정적 카탈로그 행(`openclaw models list --all`에 표시되는 동일한 행)을 확인할 수 있습니다. 공급자 인증은 여전히 필요하며, 자격 증명이 없으면 `Unknown model`이 아니라 인증 오류가 발생합니다.
- Mistral Medium 3.5 추론 프로브에서는 온도를 설정하지 않거나 기본값으로 두십시오. Mistral은 `temperature: 0`에서 `reasoning_effort="high"`를 거부합니다. 기본 온도 또는 `0.7`과 같은 0이 아닌 값을 사용하십시오.
- OpenAI ChatGPT/Codex OAuth(`openai-chatgpt-responses` API) 로컬 프로브는 전송 계층이 필수 `instructions` 필드를 채울 수 있도록 최소한의 시스템 지침을 추가합니다. 전체 에이전트 컨텍스트, 도구, 메모리 또는 세션 기록은 포함하지 않습니다.
- `model run --file`은 이미지 콘텐츠를 단일 사용자 메시지에 직접 첨부합니다. MIME 유형이 `image/*`로 감지되면 일반적인 형식(PNG, JPEG, WebP)이 작동하며, 지원되지 않거나 인식되지 않는 파일은 공급자를 호출하기 전에 실패합니다. 직접 멀티모달 모델을 프로브하는 대신 OpenClaw의 이미지 모델 라우팅과 폴백을 사용하려면 `infer image describe`를 사용하십시오.
- 선택한 모델은 이미지 입력을 지원해야 합니다. 텍스트 전용 모델은 공급자 계층에서 요청을 거부할 수 있습니다.
- `model run --prompt`에는 공백이 아닌 텍스트가 포함되어야 합니다. 빈 프롬프트는 공급자나 Gateway를 호출하기 전에 거부됩니다.
- 공급자가 텍스트 출력을 반환하지 않으면 로컬 `model run`은 0이 아닌 코드로 종료되므로, 연결할 수 없는 공급자와 빈 완성이 성공한 프로브처럼 보이지 않습니다.
- 모델 입력을 원시 상태로 유지하면서 Gateway 라우팅 또는 에이전트 런타임 설정을 테스트하려면 `model run --gateway`를 사용하십시오. 전체 에이전트 컨텍스트, 도구, 메모리 및 세션 기록을 사용하려면 `openclaw agent` 또는 채팅 인터페이스를 사용하십시오.
- `--thinking adaptive`는 완성 런타임 수준 `medium`에 매핑됩니다. `--thinking max`는 네이티브 최대 노력을 지원하는 OpenAI 모델에서는 `max`에 매핑되고, 그 외에는 `xhigh`에 매핑됩니다.
- `model auth login`, `model auth logout`, `model auth status`는 저장된 공급자 인증 상태를 관리합니다.

## 이미지

생성, 편집 및 설명입니다.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

참고:

- 기존 입력 파일에서 시작할 때는 `image edit`를 사용하십시오. `--size`, `--aspect-ratio` 또는 `--resolution`은 이를 지원하는 제공자/모델에 기하 정보 힌트를 추가합니다.
- `--model openai/gpt-image-1.5`와 함께 `--output-format png --background transparent`를 사용하면 배경이 투명한 OpenAI PNG 출력이 생성됩니다. `--openai-background`는 동일한 힌트에 대한 OpenAI 전용 별칭입니다. 배경 지원을 선언하지 않은 제공자는 이를 무시된 재정의로 보고합니다([JSON 엔벌로프](#json-output)의 `ignoredOverrides` 참조).
- `--quality low|medium|high|auto`는 OpenAI를 포함하여 이미지 품질 힌트를 지원하는 제공자에서 작동합니다. OpenAI는 `--openai-moderation low|auto`도 허용합니다.
- `image providers --json`은 번들 이미지 제공자 중 검색 가능하고, 구성되고, 선택된 제공자와 각 제공자가 노출하는 생성/편집 기능을 나열합니다.
- `image generate --model <provider/model> --json`은 이미지 생성 변경 사항을 위한 가장 범위가 좁은 실시간 스모크 테스트입니다.

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "텍스트 없이 흰색 배경에 파란색 정사각형 하나가 있는 미니멀한 플랫 테스트 이미지." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  응답은 `ok`, `provider`, `model`, `attempts` 및 기록된 출력 경로를 보고합니다. `--output`을 설정하면 최종 확장자는 제공자가 반환한 MIME 유형을 따를 수 있습니다.

- `image describe`와 `image describe-many`에서는 작업별 지침(OCR, 비교, UI 검사, 간결한 캡션 작성)에 `--prompt`를 사용하십시오.
- 느린 로컬 비전 모델이나 Ollama 콜드 스타트에는 `--timeout-ms`를 사용하십시오.
- `image describe`에서 명시적 `--model`(이미지를 처리할 수 있는 `<provider/model>`이어야 함)을 지정하면 해당 모델을 먼저 실행한 후 호출이 실패할 경우 구성된 `agents.defaults.imageModel.fallbacks`를 시도합니다. 입력 준비 오류(파일 누락, 지원되지 않는 URL)는 대체 시도 전에 실패하며, 모델 카탈로그 또는 제공자 구성에서 해당 모델이 이미지를 처리할 수 있어야 합니다.
- 로컬 Ollama 비전 모델의 경우 먼저 모델을 가져오고 `OLLAMA_API_KEY`를 임의의 자리표시자 값(예: `ollama-local`)으로 설정하십시오. [Ollama](/ko/providers/ollama#vision-and-image-description)를 참조하십시오.

## 오디오

파일 전사(실시간 세션 관리 제외).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "이름과 실행 항목에 집중" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model`은 `<provider/model>`이어야 합니다.

## TTS

음성 합성 및 TTS 제공자/페르소나 상태.

```bash
openclaw infer tts convert --text "OpenClaw에서 보내는 안녕하세요" --output ./hello.mp3 --json
openclaw infer tts convert --text "빌드가 완료되었습니다" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

참고:

- `tts status`는 `--gateway`만 지원합니다(Gateway에서 관리하는 TTS 상태를 반영함).
- TTS 동작을 검사하고 구성하려면 `tts providers`, `tts voices`, `tts personas`, `tts set-provider`, `tts set-persona`를 사용하십시오.

## 비디오

생성 및 설명.

```bash
openclaw infer video generate --prompt "바다 위의 영화 같은 일몰" --json
openclaw infer video generate --prompt "숲속 호수 위를 천천히 비행하는 드론 촬영" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

참고:

- `video generate`는 비디오 생성 런타임으로 전달되는 `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, `--timeout-ms`를 허용합니다.
- `video describe`의 `--model`은 `<provider/model>`이어야 합니다.

## 웹

검색 및 가져오기.

```bash
openclaw infer web search --query "OpenClaw 문서" --json
openclaw infer web search --query "OpenClaw infer 웹 제공자" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers`는 검색 및 가져오기에 사용 가능하고, 구성되고, 선택된 제공자를 나열합니다.

## 임베딩

벡터 생성 및 임베딩 제공자 검사.

```bash
openclaw infer embedding create --text "친근한 바닷가재" --json
openclaw infer embedding create --text "고객 지원 티켓: 배송 지연" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 출력

Infer 명령은 공유 엔벌로프 아래에서 JSON 출력을 정규화합니다.

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

안정적인 최상위 필드:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (해당하는 경우 요청과 함께 전송된 이미지 첨부 파일)
- `outputs`
- `ignoredOverrides` (해당하는 경우 제공자가 지원하지 않는 힌트 키)
- `error`

생성된 미디어 명령의 경우 `outputs`에는 OpenClaw가 기록한 파일이 포함됩니다. 자동화에서는 사람이 읽을 수 있는 표준 출력을 파싱하는 대신 해당 배열의 `path`, `mimeType`, `size` 및 미디어별 크기 정보를 사용하십시오.

## 일반적인 문제

```bash
# 잘못된 예
openclaw infer media image generate --prompt "친근한 바닷가재"

# 올바른 예
openclaw infer image generate --prompt "친근한 바닷가재"
```

```bash
# 잘못된 예
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 올바른 예
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [모델](/ko/concepts/models)
