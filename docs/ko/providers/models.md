---
read_when:
    - 모델 제공자를 선택하려는 경우
    - LLM 인증 + 모델 선택을 위한 빠른 설정 예제가 필요합니다
summary: OpenClaw가 지원하는 모델 제공자(LLM)
title: Model 제공자 빠른 시작
x-i18n:
    generated_at: "2026-06-27T18:02:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw는 여러 LLM 제공자를 사용할 수 있습니다. 하나를 선택하고 인증한 다음 기본
모델을 `provider/model`로 설정하세요.

## 빠른 시작(두 단계)

1. 제공자에 인증합니다(보통 `openclaw onboard`를 통해).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 지원되는 제공자(시작 세트)

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [Cohere](/ko/providers/cohere)
- [ComfyUI](/ko/providers/comfy)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [DeepInfra](/ko/providers/deepinfra)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
- [OpenAI (API + Codex)](/ko/providers/openai)
- [OpenCode (Zen + Go)](/ko/providers/opencode)
- [OpenRouter](/ko/providers/openrouter)
- [Qianfan](/ko/providers/qianfan)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/ko/providers/venice)
- [xAI](/ko/providers/xai)
- [Z.AI (GLM)](/ko/providers/zai)

## 추가 제공자 변형

- `anthropic-vertex` - Vertex 자격 증명을 사용할 수 있을 때 Google Vertex에서 암시적 Anthropic 지원을 위해 `@openclaw/anthropic-vertex-provider`를 설치하세요. 별도의 온보딩 인증 선택은 없습니다.
- `copilot-proxy` - 로컬 VS Code Copilot Proxy 브리지입니다. `openclaw onboard --auth-choice copilot-proxy`를 사용하세요.
- `google-gemini-cli` - 비공식 Gemini CLI OAuth 흐름입니다. 로컬 `gemini` 설치가 필요합니다(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`). 기본 모델은 `google-gemini-cli/gemini-3-flash-preview`입니다. `openclaw onboard --auth-choice google-gemini-cli` 또는 `openclaw models auth login --provider google-gemini-cli --set-default`를 사용하세요.

전체 제공자 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[모델 제공자](/ko/concepts/model-providers)를 참조하세요.

## 관련 항목

- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
- [모델 CLI](/ko/cli/models)
