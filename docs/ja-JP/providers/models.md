---
read_when:
    - モデルプロバイダーを選択したい場合
    - LLM認証とモデル選択のクイックセットアップ例が必要な場合
summary: OpenClaw が対応するモデルプロバイダー（LLM）
title: モデルプロバイダーのクイックスタート
x-i18n:
    generated_at: "2026-07-11T22:36:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

プロバイダーを選択して認証し、デフォルトモデルを `provider/model` として設定します。

## クイックスタート（2 ステップ）

1. プロバイダーで認証します（通常は `openclaw onboard` を使用します）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 対応プロバイダー（基本セット）

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [BytePlus（国際版）](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [Cohere](/ja-JP/providers/cohere)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepInfra](/ja-JP/providers/deepinfra)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
- [NovitaAI](/ja-JP/providers/novita)
- [OpenAI（API + Codex）](/ja-JP/providers/openai)
- [OpenCode（Zen + Go）](/ja-JP/providers/opencode)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Venice（Venice AI）](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [xAI](/ja-JP/providers/xai)
- [Z.AI（GLM）](/ja-JP/providers/zai)

プロバイダーの完全なカタログと高度な設定については、
[プロバイダーディレクトリ](/ja-JP/providers/index)および[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。

## その他のプロバイダーバリアント

- `anthropic-vertex` - Vertex の認証情報を利用できる場合に、Google Vertex 上の Anthropic を暗黙的にサポートするには `@openclaw/anthropic-vertex-provider` をインストールします。オンボーディングで個別の認証方法を選択する必要はありません
- `copilot-proxy` - ローカルの VS Code Copilot Proxy ブリッジです。`openclaw onboard --auth-choice copilot-proxy` を使用します
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フローです。ローカルへの `gemini` のインストール（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）が必要です。デフォルトモデルは `google-gemini-cli/gemini-3-flash-preview` です。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使用します

## 関連項目

- [プロバイダーディレクトリ](/ja-JP/providers/index)
- [モデルの選択](/ja-JP/concepts/model-providers)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
- [モデル CLI](/ja-JP/cli/models)
