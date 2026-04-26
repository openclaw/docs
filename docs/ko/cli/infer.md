---
read_when:
    - '`openclaw infer` 명령 추가 또는 수정하기'
    - 안정적인 헤드리스 기능 자동화 설계하기
summary: provider 기반 모델, 이미지, 오디오, TTS, 비디오, 웹 및 임베딩 워크플로를 위한 infer-first CLI
title: Inference CLI
x-i18n:
    generated_at: "2026-04-26T11:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`는 provider 기반 inference 워크플로를 위한 표준 헤드리스 표면입니다.

이 명령은 의도적으로 원시 gateway RPC 이름이나 원시 에이전트 도구 ID가 아니라 기능 계열을 노출합니다.

## infer를 Skills로 만들기

다음 내용을 복사해 에이전트에 붙여 넣으세요.

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

좋은 infer 기반 Skills는 다음을 충족해야 합니다.

- 일반적인 사용자 의도를 올바른 infer 하위 명령에 매핑
- 다루는 워크플로에 대한 몇 가지 표준 infer 예시 포함
- 예시와 제안에서 `openclaw infer ...`를 우선 사용
- skill 본문 안에서 infer 전체 표면을 다시 문서화하지 않음

일반적인 infer 중심 Skills 범위:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer를 사용하는 이유

`openclaw infer`는 OpenClaw 내부의 provider 기반 inference 작업을 위한 일관된 단일 CLI를 제공합니다.

장점:

- 각 백엔드마다 일회성 래퍼를 따로 연결하는 대신, OpenClaw에 이미 구성된 provider와 모델을 사용할 수 있습니다.
- 모델, 이미지, 오디오 전사, TTS, 비디오, 웹, 임베딩 워크플로를 하나의 명령 트리 아래에서 관리할 수 있습니다.
- 스크립트, 자동화, 에이전트 기반 워크플로를 위해 안정적인 `--json` 출력 형식을 사용할 수 있습니다.
- 작업의 본질이 "inference 실행"이라면 1st-party OpenClaw 표면을 우선 사용할 수 있습니다.
- 대부분의 infer 명령은 gateway 없이도 일반적인 로컬 경로로 사용할 수 있습니다.

종단 간 provider 점검에는, 하위 수준
provider 테스트가 통과한 뒤 `openclaw infer ...`를 우선 사용하세요. 이 명령은 provider 요청이 수행되기 전에
배포된 CLI, config 로딩,
기본 agent 해석, 번들 Plugin 활성화, 런타임 종속성 복구,
공유 기능 런타임을 함께 검증합니다.

## 명령 트리

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
    status
    enable
    disable
    set-provider

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

## 일반적인 작업

이 표는 일반적인 inference 작업을 해당 infer 명령에 매핑합니다.

| 작업                    | 명령                                                                  | 참고                                                   |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 텍스트/모델 프롬프트 실행 | `openclaw infer model run --prompt "..." --json`                     | 기본적으로 일반적인 로컬 경로를 사용                   |
| 이미지 생성             | `openclaw infer image generate --prompt "..." --json`                  | 기존 파일에서 시작할 때는 `image edit` 사용            |
| 이미지 파일 설명        | `openclaw infer image describe --file ./image.png --json`              | `--model`은 이미지 지원 `<provider/model>`이어야 함    |
| 오디오 전사             | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model`은 `<provider/model>`이어야 함                |
| 음성 합성               | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`는 gateway 지향적임                        |
| 비디오 생성             | `openclaw infer video generate --prompt "..." --json`                  | `--resolution` 같은 provider 힌트 지원                 |
| 비디오 파일 설명        | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model`은 `<provider/model>`이어야 함                |
| 웹 검색                 | `openclaw infer web search --query "..." --json`                       |                                                        |
| 웹 페이지 가져오기      | `openclaw infer web fetch --url https://example.com --json`            |                                                        |
| 임베딩 생성             | `openclaw infer embedding create --text "..." --json`                  |                                                        |

## 동작

- `openclaw infer ...`는 이러한 워크플로를 위한 기본 CLI 표면입니다.
- 출력이 다른 명령이나 스크립트에서 소비될 경우 `--json`을 사용하세요.
- 특정 백엔드가 필요하면 `--provider` 또는 `--model provider/model`을 사용하세요.
- `image describe`, `audio transcribe`, `video describe`에서는 `--model`이 반드시 `<provider/model>` 형식이어야 합니다.
- `image describe`에서 명시적인 `--model`은 해당 provider/model을 직접 실행합니다. 모델은 모델 카탈로그나 provider config에서 이미지 지원 가능해야 합니다. `codex/<model>`은 제한된 Codex 앱 서버 이미지 이해 턴을 실행하고, `openai-codex/<model>`은 OpenAI Codex OAuth provider 경로를 사용합니다.
- 상태 비저장 실행 명령은 기본적으로 로컬입니다.
- gateway 관리 상태 명령은 기본적으로 gateway입니다.
- 일반적인 로컬 경로는 gateway 실행을 요구하지 않습니다.
- `model run`은 원샷입니다. 해당 명령을 위해 에이전트 런타임을 통해 열린 MCP 서버는 로컬과 `--gateway` 실행 모두에서 응답 후 정리되므로, 반복적인 스크립트 호출이 stdio MCP 하위 프로세스를 계속 살려 두지 않습니다.

## Model

provider 기반 텍스트 inference 및 model/provider 점검에는 `model`을 사용하세요.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

참고:

- `model run`은 에이전트 런타임을 재사용하므로 provider/model override가 일반 에이전트 실행처럼 동작합니다.
- `model run`은 헤드리스 자동화를 위한 것이므로, 명령이 끝난 뒤 세션별 번들 MCP 런타임을 유지하지 않습니다.
- `model auth login`, `model auth logout`, `model auth status`는 저장된 provider 인증 상태를 관리합니다.

## Image

생성, 편집, 설명에는 `image`를 사용하세요.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

참고:

- 기존 입력 파일에서 시작할 때는 `image edit`를 사용하세요.
- `image edit`에서 참조 이미지 편집 시 geometry 힌트를 지원하는 provider/모델에는 `--size`, `--aspect-ratio`, `--resolution`을 사용하세요.
- 투명 배경 OpenAI PNG 출력에는 `--model openai/gpt-image-1.5`와 함께 `--output-format png --background transparent`를 사용하세요. `--openai-background`도 OpenAI 전용 별칭으로 계속 사용할 수 있습니다. 배경 지원을 선언하지 않은 provider는 이 힌트를 무시된 override로 보고합니다.
- 어떤 번들 이미지 provider를 검색할 수 있고, 구성되어 있으며, 선택되었는지, 그리고 각 provider가 어떤 생성/편집 기능을 노출하는지 확인하려면 `image providers --json`을 사용하세요.
- 이미지 생성 변경의 가장 좁은 라이브 CLI 스모크 테스트로는 `image generate --model <provider/model> --json`을 사용하세요. 예:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 응답은 `ok`, `provider`, `model`, `attempts`, 기록된
  출력 경로를 보고합니다. `--output`이 설정되면 최종 확장자는
  provider가 반환한 MIME 타입을 따를 수 있습니다.

- `image describe`에서 `--model`은 이미지 지원 `<provider/model>`이어야 합니다.
- 로컬 Ollama 비전 모델의 경우 먼저 모델을 pull하고 `OLLAMA_API_KEY`를 아무 플레이스홀더 값으로 설정하세요. 예: `ollama-local`. 자세한 내용은 [Ollama](/ko/providers/ollama#vision-and-image-description)를 참조하세요.

## Audio

파일 전사에는 `audio`를 사용하세요.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

참고:

- `audio transcribe`는 파일 전사용이며 실시간 세션 관리를 위한 것이 아닙니다.
- `--model`은 반드시 `<provider/model>`이어야 합니다.

## TTS

음성 합성 및 TTS provider 상태에는 `tts`를 사용하세요.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

참고:

- `tts status`는 gateway 관리 TTS 상태를 반영하므로 기본적으로 gateway를 사용합니다.
- `tts providers`, `tts voices`, `tts set-provider`를 사용해 TTS 동작을 점검하고 구성하세요.

## Video

생성 및 설명에는 `video`를 사용하세요.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

참고:

- `video generate`는 `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, `--timeout-ms`를 받아 비디오 생성 런타임에 전달합니다.
- `video describe`에서 `--model`은 반드시 `<provider/model>`이어야 합니다.

## Web

검색 및 가져오기 워크플로에는 `web`을 사용하세요.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

참고:

- 사용 가능하고 구성되었으며 선택된 provider를 점검하려면 `web providers`를 사용하세요.

## Embedding

벡터 생성 및 임베딩 provider 점검에는 `embedding`을 사용하세요.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 출력

infer 명령은 공유 엔벌로프 아래에서 JSON 출력을 정규화합니다.

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

최상위 필드는 안정적으로 유지됩니다.

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

생성형 미디어 명령의 경우 `outputs`에는 OpenClaw가 기록한 파일이 포함됩니다. 자동화에서는 사람이 읽는 stdout을 파싱하는 대신
이 배열의 `path`, `mimeType`, `size`, 그리고 미디어별 크기 정보를 사용하세요.

## 일반적인 함정

```bash
# 나쁨
openclaw infer media image generate --prompt "friendly lobster"

# 좋음
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# 나쁨
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 좋음
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 참고

- `openclaw capability ...`는 `openclaw infer ...`의 별칭입니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [모델](/ko/concepts/models)
