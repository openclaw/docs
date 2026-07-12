---
read_when:
    - 모델 제공자를 선택하려는 경우
    - LLM 인증 및 모델 선택을 위한 빠른 설정 예시가 필요한 경우
summary: OpenClaw이 지원하는 모델 제공업체(LLM)
title: 모델 제공자 빠른 시작
x-i18n:
    generated_at: "2026-07-12T01:08:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

제공자를 선택하고 인증한 다음, 기본 모델을 `provider/model` 형식으로 설정합니다.

## 빠른 시작(2단계)

1. 제공자를 통해 인증합니다(일반적으로 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 지원되는 제공자(입문용 목록)

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic(API + Claude CLI)](/ko/providers/anthropic)
- [BytePlus(국제)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [Cohere](/ko/providers/cohere)
- [ComfyUI](/ko/providers/comfy)
- [DeepInfra](/ko/providers/deepinfra)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot)
- [NovitaAI](/ko/providers/novita)
- [OpenAI(API + Codex)](/ko/providers/openai)
- [OpenCode(Zen + Go)](/ko/providers/opencode)
- [OpenRouter](/ko/providers/openrouter)
- [Qianfan](/ko/providers/qianfan)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Venice(Venice AI)](/ko/providers/venice)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [xAI](/ko/providers/xai)
- [Z.AI(GLM)](/ko/providers/zai)

전체 제공자 카탈로그와 고급 구성은
[제공자 디렉터리](/ko/providers/index)와 [모델 제공자](/ko/concepts/model-providers)를 참조하세요.

## 추가 제공자 변형

- `anthropic-vertex` - Vertex 자격 증명을 사용할 수 있을 때 Google Vertex에서 암시적 Anthropic 지원을 사용하려면 `@openclaw/anthropic-vertex-provider`를 설치합니다. 별도의 온보딩 인증 선택 항목은 없습니다.
- `copilot-proxy` - 로컬 VS Code Copilot Proxy 브리지입니다. `openclaw onboard --auth-choice copilot-proxy`를 사용합니다.
- `google-gemini-cli` - 비공식 Gemini CLI OAuth 흐름입니다. 로컬에 `gemini`가 설치되어 있어야 합니다(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`). 기본 모델은 `google-gemini-cli/gemini-3-flash-preview`입니다. `openclaw onboard --auth-choice google-gemini-cli` 또는 `openclaw models auth login --provider google-gemini-cli --set-default`를 사용합니다.

## 관련 항목

- [제공자 디렉터리](/ko/providers/index)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
- [모델 CLI](/ko/cli/models)
