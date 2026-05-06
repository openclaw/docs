---
read_when:
    - モデルプロバイダーを選択したい
    - 大規模言語モデルの認証 + モデル選択をすばやく設定する例が必要な場合
summary: OpenClaw でサポートされているモデルプロバイダー（LLM）
title: モデルプロバイダーのクイックスタート
x-i18n:
    generated_at: "2026-05-06T18:00:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw は多くの LLM プロバイダーを使用できます。1 つ選び、認証してから、既定の
モデルを `provider/model` として設定します。

## クイックスタート（2 ステップ）

1. プロバイダーで認証します（通常は `openclaw onboard` 経由）。
2. 既定のモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされるプロバイダー（スターターセット）

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ja-JP/providers/anthropic)
- [BytePlus (International)](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [ComfyUI](/ja-JP/providers/comfy)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [DeepInfra](/ja-JP/providers/deepinfra)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GLM モデル](/ja-JP/providers/glm)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
- [OpenAI (API + Codex)](/ja-JP/providers/openai)
- [OpenCode (Zen + Go)](/ja-JP/providers/opencode)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/ja-JP/providers/venice)
- [xAI](/ja-JP/providers/xai)
- [Z.AI](/ja-JP/providers/zai)

## 追加の同梱プロバイダーバリアント

- `anthropic-vertex` - Vertex 認証情報が利用可能な場合の、Google Vertex 上の Anthropic の暗黙的なサポート。別個のオンボーディング認証選択肢はありません
- `copilot-proxy` - ローカルの VS Code Copilot Proxy ブリッジ。`openclaw onboard --auth-choice copilot-proxy` を使用します
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フロー。ローカルの `gemini` インストールが必要です（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。既定のモデルは `google-gemini-cli/gemini-3-flash-preview` です。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使用します

完全なプロバイダーカタログ（xAI、Groq、Mistral など）と高度な設定については、
[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
- [Models CLI](/ja-JP/cli/models)
