---
read_when:
    - モデル provider を選びたい場合
    - LLM の認証とモデル選択のクイックセットアップ例が必要な場合
summary: OpenClaw がサポートするモデル provider（LLM）
title: モデル provider のクイックスタート
x-i18n:
    generated_at: "2026-04-23T14:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# モデル provider

OpenClaw は多くの LLM provider を使用できます。1 つ選び、認証し、その後デフォルトモデルを `provider/model` として設定してください。

## クイックスタート（2 ステップ）

1. provider で認証します（通常は `openclaw onboard` 経由）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされている provider（スターターセット）

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [BytePlus（国際版）](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [ComfyUI](/ja-JP/providers/comfy)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GLM モデル](/ja-JP/providers/glm)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
- [OpenAI（API + Codex）](/ja-JP/providers/openai)
- [OpenCode（Zen + Go）](/ja-JP/providers/opencode)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [Venice（Venice AI）](/ja-JP/providers/venice)
- [xAI](/ja-JP/providers/xai)
- [Z.AI](/ja-JP/providers/zai)

## 追加の同梱 provider バリアント

- `anthropic-vertex` - Vertex 認証情報が利用可能な場合の Google Vertex 上の暗黙的な Anthropic サポート。個別のオンボーディング認証選択は不要
- `copilot-proxy` - ローカルの VS Code Copilot Proxy ブリッジ。`openclaw onboard --auth-choice copilot-proxy` を使用
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フロー。ローカルの `gemini` インストールが必要（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。デフォルトモデルは `google-gemini-cli/gemini-3-flash-preview`。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使用

完全な provider カタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデル provider](/ja-JP/concepts/model-providers) を参照してください。
