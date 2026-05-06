---
read_when:
    - 최고의 오픈 소스 LLM에 사용할 단일 API 키가 필요합니다
    - OpenClaw에서 DeepInfra의 API를 통해 모델을 실행하려고 합니다
summary: DeepInfra의 통합 API를 사용하여 OpenClaw에서 가장 인기 있는 오픈 소스 및 프런티어 모델에 액세스하세요
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T06:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra는 단일 엔드포인트와 API 키 뒤에서 가장 인기 있는 오픈 소스 및 프런티어 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL을 바꾸는 것만으로 작동합니다.

## API 키 받기

1. [https://deepinfra.com/](https://deepinfra.com/)로 이동합니다
2. 로그인하거나 계정을 만듭니다
3. Dashboard / Keys로 이동하여 새 API 키를 생성하거나 자동 생성된 키를 사용합니다

## CLI 설정

```bash
openclaw onboard --deepinfra-api-key <key>
```

또는 환경 변수를 설정합니다:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 구성 스니펫

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## 지원되는 OpenClaw 영역

번들 Plugin은 현재 OpenClaw 제공자 계약과 일치하는 모든 DeepInfra 영역을 등록합니다:

| 영역                     | 기본 모델                          | OpenClaw 구성/도구                                      |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| 채팅 / 모델 제공자       | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| 이미지 생성/편집         | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| 미디어 이해              | 이미지용 `moonshotai/Kimi-K2.5`    | 인바운드 이미지 이해                                     |
| 음성 텍스트 변환         | `openai/whisper-large-v3-turbo`    | 인바운드 오디오 전사                                     |
| 텍스트 음성 변환         | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| 비디오 생성              | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| 메모리 임베딩            | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra는 리랭킹, 분류, 객체 감지 및 기타 네이티브 모델 유형도 제공합니다. OpenClaw에는 현재 해당 범주에 대한 일급 제공자 계약이 없으므로 이 Plugin은 아직 이를 등록하지 않습니다.

## 사용 가능한 모델

OpenClaw는 시작 시 사용 가능한 DeepInfra 모델을 동적으로 검색합니다. 사용 가능한 전체 모델 목록을 보려면 `/models deepinfra`를 사용하세요.

[DeepInfra.com](https://deepinfra.com/)에서 사용 가능한 모든 모델은 `deepinfra/` 접두사와 함께 사용할 수 있습니다:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...그 외 다수
```

## 참고

- 모델 참조는 `deepinfra/<provider>/<model>`입니다(예: `deepinfra/Qwen/Qwen3-Max`).
- 기본 모델: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- 기본 URL: `https://api.deepinfra.com/v1/openai`
- 네이티브 비디오 생성은 `https://api.deepinfra.com/v1/inference/<model>`을 사용합니다.

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
