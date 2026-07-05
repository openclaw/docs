---
read_when:
    - OpenClawでVercel AI Gatewayを使用したい
    - APIキー環境変数またはCLI認証の選択が必要です
summary: Vercel AI Gateway のセットアップ（認証 + モデル選択）
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-07-05T11:47:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一のエンドポイントを通じて数百種類のモデルにアクセスするための統合 API を提供します。

| プロパティ | 値 |
| ------------- | -------------------------------------- |
| プロバイダー | `vercel-ai-gateway` |
| パッケージ | `@openclaw/vercel-ai-gateway-provider` |
| 認証 | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages 互換 |
| ベース URL | `https://ai-gateway.vercel.sh` |
| モデルカタログ | `/v1/models` 経由で自動検出 |

<Tip>
OpenClaw は Gateway の `/v1/models` カタログを自動検出するため、
`/models vercel-ai-gateway` チャットコマンドと
`openclaw models list --provider vercel-ai-gateway` のどちらにも、
`vercel-ai-gateway/openai/gpt-5.5` や
`vercel-ai-gateway/moonshotai/kimi-k2.6` などの現在のモデル参照が含まれます。
</Tip>

## はじめに

<Steps>
  <Step title="プラグインをインストールする">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## モデル ID の省略形

OpenClaw は実行時に Claude の省略形モデル参照を正規化します。

| 省略形の入力 | 正規化後のモデル参照 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
設定ではどちらの形式も使用できます。OpenClaw が正規の
`anthropic/...` 参照を自動的に解決します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    OpenClaw Gateway をデーモン（launchd/systemd）として実行する場合は、
    `AI_GATEWAY_API_KEY` がそのプロセスで利用可能であることを確認してください。

    <Warning>
    対話型シェルでのみエクスポートされたキーは、その環境が明示的にインポートされない限り、
    launchd/systemd デーモンからは見えません。Gateway
    プロセスがキーを読み取れるようにするには、`~/.openclaw/.env` または
    `env.shellEnv` 経由でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="プロバイダールーティング">
    Vercel AI Gateway は、モデル参照プレフィックスで指定された上流プロバイダーに各リクエストをルーティングします。たとえば、`vercel-ai-gateway/anthropic/claude-opus-4.6`
    は Anthropic 経由で、`vercel-ai-gateway/openai/gpt-5.5` は
    OpenAI 経由で、`vercel-ai-gateway/moonshotai/kimi-k2.6` は
    MoonshotAI 経由でルーティングされます。1 つの `AI_GATEWAY_API_KEY` ですべての上流プロバイダーを認証します。
  </Accordion>
  <Accordion title="Thinking レベル">
    `/think` オプションは、OpenClaw が認識している場合、上流モデルのプレフィックスに従います。`vercel-ai-gateway/anthropic/...` は、Claude 4.6 モデルの適応型デフォルトを含む Claude thinking プロファイルを使用します。信頼済みの
    `vercel-ai-gateway/openai/...` 参照（`gpt-5.2` 以降、および
    `gpt-5.1-codex` までの Codex バリアント）は `/think xhigh` を公開します。その他の名前空間付き参照は、カタログメタデータで追加が宣言されていない限り、標準の推論レベルを維持します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
