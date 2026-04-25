---
read_when:
    - '`openclaw infer` 명령 추가 또는 수정'
    - 안정적인 헤드리스 기능 자동화 설계
summary: provider 기반 모델, 이미지, 오디오, TTS, 비디오, 웹, 임베딩 워크플로를 위한 추론 우선 CLI
title: 추론 CLI
x-i18n:
    generated_at: "2026-04-25T18:18:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23242bfa8a354b949473322f47da90876e05a5e54d467ca134f2e59c3ae8bb02
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`는 provider 기반 추론 워크플로를 위한 표준 헤드리스 인터페이스입니다.

이 명령은 원시 Gateway RPC 이름이나 원시 에이전트 도구 ID가 아니라 의도적으로 기능 계열을 노출합니다.

## infer를 skill로 만들기

이 내용을 에이전트에 복사해서 붙여넣으세요:

```text
https://docs.openclaw.ai/cli/infer 를 읽은 뒤, 내 일반적인 워크플로를 `openclaw infer`로 라우팅하는 skill을 만들어줘.
모델 실행, 이미지 생성, 비디오 생성, 오디오 전사, TTS, 웹 검색, 임베딩에 집중해줘.
```

좋은 infer 기반 skill은 다음을 수행해야 합니다:

- 일반적인 사용자 의도를 올바른 infer 하위 명령에 매핑
- 다루는 워크플로에 대해 몇 가지 표준 infer 예시 포함
- 예시와 제안에서 `openclaw infer ...`를 우선 사용
- skill 본문 안에서 infer 전체 인터페이스를 다시 문서화하지 않음

일반적인 infer 중심 skill 범위:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer를 사용하는 이유

`openclaw infer`는 OpenClaw 내부의 provider 기반 추론 작업을 위한 일관된 단일 CLI를 제공합니다.

장점:

- 각 백엔드마다 일회성 래퍼를 따로 구성하는 대신, OpenClaw에 이미 설정된 provider와 모델을 사용할 수 있습니다.
- 모델, 이미지, 오디오 전사, TTS, 비디오, 웹, 임베딩 워크플로를 하나의 명령 트리 아래에서 유지할 수 있습니다.
- 스크립트, 자동화, 에이전트 기반 워크플로를 위해 안정적인 `--json` 출력 형식을 사용할 수 있습니다.
- 작업의 본질이 "추론 실행"일 때 first-party OpenClaw 인터페이스를 우선 사용할 수 있습니다.
- 대부분의 infer 명령에서 Gateway 없이 일반적인 로컬 경로를 사용할 수 있습니다.

종단 간 provider 점검에는, 더 낮은 수준의
provider 테스트가 통과한 후 `openclaw infer ...`를 우선 사용하세요. 이 경로는
실제 배포된 CLI, 설정 로딩,
기본 에이전트 해석, 번들 Plugin 활성화, 런타임 의존성 복구,
그리고 provider 요청이 이루어지기 전의 공용 기능 런타임을 모두 실행합니다.

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

이 표는 일반적인 추론 작업을 해당 infer 명령에 매핑합니다.

| 작업 | 명령 | 참고 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| 텍스트/모델 프롬프트 실행 | `openclaw infer model run --prompt "..." --json`                       | 기본적으로 일반적인 로컬 경로를 사용 |
| 이미지 생성 | `openclaw infer image generate --prompt "..." --json`                  | 기존 파일에서 시작하는 경우 `image edit` 사용 |
| 이미지 파일 설명 | `openclaw infer image describe --file ./image.png --json`              | `--model`은 이미지 처리 가능한 `<provider/model>`이어야 함 |
| 오디오 전사 | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model`은 `<provider/model>`이어야 함 |
| 음성 합성 | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`는 Gateway 지향적임 |
| 비디오 생성 | `openclaw infer video generate --prompt "..." --json`                  | `--resolution` 같은 provider 힌트를 지원 |
| 비디오 파일 설명 | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model`은 `<provider/model>`이어야 함 |
| 웹 검색 | `openclaw infer web search --query "..." --json`                       |                                                       |
| 웹 페이지 가져오기 | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| 임베딩 생성 | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## 동작

- `openclaw infer ...`는 이러한 워크플로를 위한 기본 CLI 인터페이스입니다.
- 출력이 다른 명령이나 스크립트에서 소비될 경우 `--json`을 사용하세요.
- 특정 백엔드가 필요할 때는 `--provider` 또는 `--model provider/model`을 사용하세요.
- `image describe`, `audio transcribe`, `video describe`에서는 `--model`이 반드시 `<provider/model>` 형식을 사용해야 합니다.
- `image describe`에서 명시적인 `--model`은 해당 provider/model을 직접 실행합니다. 모델은 모델 카탈로그 또는 provider 설정에서 이미지 처리 가능해야 합니다. `codex/<model>`은 제한된 Codex app-server 이미지 이해 턴을 실행하고, `openai-codex/<model>`은 OpenAI Codex OAuth provider 경로를 사용합니다.
- 상태 비저장 실행 명령은 기본적으로 로컬을 사용합니다.
- Gateway가 관리하는 상태 명령은 기본적으로 gateway를 사용합니다.
- 일반적인 로컬 경로는 Gateway가 실행 중일 필요가 없습니다.
- `model run`은 단발성입니다. 해당 명령을 위해 에이전트 런타임을 통해 열린 MCP 서버는 로컬 실행과 `--gateway` 실행 모두에서 응답 후 종료되므로, 반복적인 스크립트 호출이 stdio MCP 자식 프로세스를 계속 유지하지 않습니다.

## Model

provider 기반 텍스트 추론과 모델/provider 점검에는 `model`을 사용하세요.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

참고:

- `model run`은 에이전트 런타임을 재사용하므로 provider/model 재정의가 일반적인 에이전트 실행처럼 동작합니다.
- `model run`은 헤드리스 자동화를 위한 것이므로, 명령이 끝난 뒤 세션별 번들 MCP 런타임을 유지하지 않습니다.
- `model auth login`, `model auth logout`, `model auth status`는 저장된 provider 인증 상태를 관리합니다.

## Image

생성, 편집, 설명에는 `image`를 사용하세요.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

참고:

- 기존 입력 파일에서 시작하는 경우 `image edit`를 사용하세요.
- `image providers --json`을 사용하면 어떤 번들 이미지 provider를
  발견할 수 있는지, 설정되었는지, 선택되었는지, 그리고 각 provider가 어떤 생성/편집 기능을
  노출하는지 확인할 수 있습니다.
- 이미지 생성 변경에 대한 가장 좁은 범위의 라이브
  CLI 스모크 테스트로 `image generate --model <provider/model> --json`을 사용하세요. 예:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 응답은 `ok`, `provider`, `model`, `attempts`, 그리고 기록된
  출력 경로를 보고합니다. `--output`이 설정되어 있으면 최종 확장자는
  provider가 반환한 MIME 타입을 따를 수 있습니다.

- `image describe`에서 `--model`은 반드시 이미지 처리 가능한 `<provider/model>`이어야 합니다.
- 로컬 Ollama 비전 모델의 경우 먼저 모델을 pull하고 `OLLAMA_API_KEY`를 아무 플레이스홀더 값으로 설정하세요. 예: `ollama-local`. 자세한 내용은 [Ollama](/ko/providers/ollama#vision-and-image-description)를 참조하세요.

## Audio

파일 전사에는 `audio`를 사용하세요.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

참고:

- `audio transcribe`는 파일 전사를 위한 것이며 실시간 세션 관리를 위한 것은 아닙니다.
- `--model`은 반드시 `<provider/model>`이어야 합니다.

## TTS

음성 합성과 TTS provider 상태에는 `tts`를 사용하세요.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

참고:

- `tts status`는 Gateway가 관리하는 TTS 상태를 반영하므로 기본적으로 gateway를 사용합니다.
- TTS 동작을 점검하고 구성하려면 `tts providers`, `tts voices`, `tts set-provider`를 사용하세요.

## Video

생성과 설명에는 `video`를 사용하세요.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

참고:

- `video generate`는 `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, `--timeout-ms`를 허용하며 이를 비디오 생성 런타임으로 전달합니다.
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

- 사용 가능하고, 설정되어 있으며, 선택된 provider를 점검하려면 `web providers`를 사용하세요.

## Embedding

벡터 생성과 임베딩 provider 점검에는 `embedding`을 사용하세요.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 출력

Infer 명령은 JSON 출력을 공통 envelope 아래로 정규화합니다:

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

최상위 필드는 안정적으로 유지됩니다:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

생성된 미디어 명령의 경우 `outputs`에는 OpenClaw가 기록한 파일이 들어 있습니다. 자동화에서는 사람이 읽기 쉬운 stdout을 파싱하는 대신
해당 배열의 `path`, `mimeType`, `size`, 그리고 미디어별 차원 정보를
사용하세요.

## 일반적인 함정

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 참고

- `openclaw capability ...`는 `openclaw infer ...`의 별칭입니다.

## 관련 문서

- [CLI reference](/ko/cli)
- [Models](/ko/concepts/models)
