---
read_when:
    - 최고의 오픈 소스 LLM을 위한 단일 API 키를 원합니다
    - OpenClaw에서 DeepInfra의 API를 통해 모델을 실행하려는 경우
summary: DeepInfra의 통합 API를 사용하여 OpenClaw에서 가장 인기 있는 오픈 소스 및 프런티어 모델에 액세스하세요
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:01:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra는 단일 엔드포인트와 API 키 뒤에서 가장 인기 있는 오픈 소스 및 프런티어 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL만 바꾸면 작동합니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API 키 받기

1. [https://deepinfra.com/](https://deepinfra.com/)으로 이동합니다
2. 로그인하거나 계정을 만듭니다
3. Dashboard / Keys로 이동하여 새 API 키를 생성하거나 자동 생성된 키를 사용합니다

## CLI 설정

```bash
openclaw onboard --deepinfra-api-key <key>
```

또는 환경 변수를 설정합니다.

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 설정 스니펫

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## 지원되는 OpenClaw 영역

Plugin은 현재 OpenClaw 제공자 계약과 일치하는 모든 DeepInfra 영역을 등록합니다. 채팅, 이미지 생성, 비디오 생성은 `DEEPINFRA_API_KEY`가 구성되어 있을 때 `/v1/openai/models?sort_by=openclaw&filter=with_meta`에서 모델 카탈로그를 실시간으로 새로고침하며, 다른 영역은 아래의 선별된 정적 기본값을 사용합니다.

| 영역                     | 기본 모델                                                                                              | OpenClaw 설정/도구                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 채팅 / 모델 제공자       | 라이브 카탈로그에서 첫 번째 채팅 태그 항목(매니페스트 대체값 `deepseek-ai/DeepSeek-V4-Flash`)         | `agents.defaults.model`                                  |
| 이미지 생성/편집         | 라이브 카탈로그에서 첫 번째 `image-gen` 태그 항목(정적 대체값 `black-forest-labs/FLUX-1-schnell`)     | `image_generate`, `agents.defaults.imageGenerationModel` |
| 미디어 이해              | 이미지에는 `moonshotai/Kimi-K2.5`                                                                      | 인바운드 이미지 이해                                    |
| 음성-텍스트 변환         | `openai/whisper-large-v3-turbo`                                                                        | 인바운드 오디오 전사                                    |
| 텍스트-음성 변환         | `hexgrad/Kokoro-82M`                                                                                   | `messages.tts.provider: "deepinfra"`                     |
| 비디오 생성              | 라이브 카탈로그에서 첫 번째 `video-gen` 태그 항목(정적 대체값 `Pixverse/Pixverse-T2V`)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| 메모리 임베딩            | `BAAI/bge-m3`                                                                                          | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra는 재순위 지정, 분류, 객체 감지 및 기타 네이티브 모델 유형도 노출합니다. OpenClaw는 현재 해당 범주에 대한 일급 제공자 계약을 갖고 있지 않으므로, 이 Plugin은 아직 이를 등록하지 않습니다.

## 사용 가능한 모델

OpenClaw는 시작 시 사용 가능한 DeepInfra 모델을 동적으로 검색합니다. 사용 가능한 전체 모델 목록을 보려면 `/models deepinfra`를 사용하세요.

[DeepInfra.com](https://deepinfra.com/)에서 사용할 수 있는 모든 모델은 `deepinfra/` 접두사와 함께 사용할 수 있습니다.

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## 참고 사항

- 모델 참조는 `deepinfra/<provider>/<model>` 형식입니다(예: `deepinfra/Qwen/Qwen3-Max`).
- 기본 모델: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 기본 URL: `https://api.deepinfra.com/v1/openai`
- 네이티브 비디오 생성은 `https://api.deepinfra.com/v1/inference/<model>`을 사용합니다.

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
