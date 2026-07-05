---
read_when:
    - モデルプロバイダーを選択したい場合
    - LLM 認証とモデル選択のクイックセットアップ例が必要です
summary: OpenClaw がサポートするモデルプロバイダー (LLM)
title: モデルプロバイダーのクイックスタート
x-i18n:
    generated_at: "2026-07-05T11:44:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

プロバイダーを選択し、認証してから、デフォルトモデルを `provider/model` として設定します。

## クイックスタート（2 ステップ）

1. プロバイダーで認証します（通常は `openclaw onboard` 経由）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 対応プロバイダー（スターターセット）

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

完全なプロバイダーカタログと高度な設定については、
[プロバイダーディレクトリ](/ja-JP/providers/index) と [モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。

## 追加のプロバイダーバリアント

- `anthropic-vertex` - Vertex 認証情報が利用可能な場合に、Google Vertex 上の暗黙的な Anthropic サポートのために `@openclaw/anthropic-vertex-provider` をインストールします。個別のオンボーディング認証選択肢はありません
- `copilot-proxy` - ローカルの VS Code Copilot Proxy ブリッジ。`openclaw onboard --auth-choice copilot-proxy` を使用します
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フロー。ローカルの `gemini` インストールが必要です（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。デフォルトモデルは `google-gemini-cli/gemini-3-flash-preview` です。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使用します

## 関連

- [プロバイダーディレクトリ](/ja-JP/providers/index)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
- [Models CLI](/ja-JP/cli/models)
