---
read_when:
    - 최고의 오픈 소스 LLM을 위한 단일 API 키를 원합니다
    - OpenClaw에서 DeepInfra의 API를 통해 모델을 실행하려고 합니다
summary: DeepInfra의 통합 API를 사용하여 OpenClaw에서 가장 인기 있는 오픈 소스 및 프런티어 모델에 액세스합니다
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T15:39:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra는 단일 OpenAI 호환 엔드포인트와 API 키를 통해 널리 사용되는 오픈 소스 및 최첨단 모델로 요청을 라우팅합니다. 대부분의 OpenAI SDK는 기본 URL을 변경하면 사용할 수 있습니다.

## Plugin 설치

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API 키 받기

1. [deepinfra.com](https://deepinfra.com/)에 로그인합니다
2. Dashboard / Keys로 이동하여 키를 생성하거나 자동 생성된 키를 사용합니다

## CLI 설정

```bash
openclaw onboard --deepinfra-api-key <key>
```

또는 환경 변수를 설정합니다.

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 구성 스니펫

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

## 지원되는 기능 영역

채팅, 이미지 생성 및 동영상 생성은 `DEEPINFRA_API_KEY`가 구성되면 `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`에서 모델 카탈로그를 실시간으로 새로 고칩니다. 다른 기능 영역은 동일한 실시간 카탈로그로 이전될 때까지 아래의 정적 기본값을 사용합니다.

| 기능 영역                  | 기본 모델                                                                                         | OpenClaw 구성/도구                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 채팅 / 모델 제공자    | 실시간 카탈로그에서 채팅 태그가 지정된 첫 번째 항목(정적 대체 모델 `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| 이미지 생성/편집 | 실시간 카탈로그에서 `image-gen` 태그가 지정된 첫 번째 항목(정적 대체 모델 `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| 미디어 이해      | 이미지에는 `moonshotai/Kimi-K2.5` 사용                                                                     | 수신 이미지 이해                              |
| 음성-텍스트 변환           | `openai/whisper-large-v3-turbo`                                                                       | 수신 오디오 전사                              |
| 텍스트-음성 변환           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 동영상 생성         | 정적 대체 모델 `Pixverse/Pixverse-T2V`(현재 DeepInfra의 실시간 video-gen 행 없음)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| 메모리 임베딩        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra는 재순위화, 분류, 객체 감지 및 기타 네이티브 모델 유형도 제공합니다. OpenClaw에는 아직 해당 범주에 대한 제공자 계약이 없으므로 이 Plugin은 이를 등록하지 않습니다.

## 사용 가능한 모델

키가 구성되면 OpenClaw가 DeepInfra 모델을 동적으로 검색합니다. 현재 목록을 확인하려면 `/models deepinfra` 또는 `openclaw models list --provider deepinfra`를 사용하십시오.

[deepinfra.com](https://deepinfra.com/)의 모든 모델을 `deepinfra/` 접두사와 함께 사용할 수 있습니다.

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...외 다수
```

## 참고 사항

- 모델 참조 형식은 `deepinfra/<provider>/<model>`입니다(예: `deepinfra/Qwen/Qwen3-Max`).
- 기본 채팅 모델: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 기본 URL: `https://api.deepinfra.com/v1/openai`
- 네이티브 동영상 생성에는 `https://api.deepinfra.com/v1/inference/<model>`을 사용합니다.

## 관련 문서

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
