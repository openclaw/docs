---
read_when:
    - モデルプロバイダーを選びたい場合
    - LLM 認証とモデル選択のクイックセットアップ例が欲しい場合
summary: OpenClaw がサポートするモデルプロバイダー（LLM）
title: モデルプロバイダーのクイックスタート
x-i18n:
    generated_at: "2026-04-24T05:15:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# モデルプロバイダー

OpenClaw は多くの LLM プロバイダーを使えます。1 つ選び、認証し、その後
デフォルトモデルを `provider/model` として設定してください。

## クイックスタート（2 ステップ）

1. プロバイダーで認証する（通常は `openclaw onboard` 経由）。
2. デフォルトモデルを設定する:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされるプロバイダー（スターターセット）

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [BytePlus（International）](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [ComfyUI](/ja-JP/providers/comfy)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GLM models](/ja-JP/providers/glm)
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

## 追加の bundled プロバイダーバリアント

- `anthropic-vertex` - Vertex 認証情報が利用可能な場合の暗黙的な Google Vertex 上の Anthropic サポート。別個のオンボーディング auth choice はありません
- `copilot-proxy` - ローカル VS Code Copilot Proxy bridge。`openclaw onboard --auth-choice copilot-proxy` を使ってください
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フロー。ローカルに `gemini` のインストールが必要です（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。デフォルトモデルは `google-gemini-cli/gemini-3-flash-preview`。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使ってください

完全なプロバイダーカタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [モデル failover](/ja-JP/concepts/model-failover)
- [Models CLI](/ja-JP/cli/models)
