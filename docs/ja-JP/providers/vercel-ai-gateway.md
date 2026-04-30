---
read_when:
    - OpenClaw で Vercel AI Gateway を使用したい場合
    - API キー環境変数または CLI 認証の選択が必要です
summary: Vercel AI Gateway のセットアップ (認証 + モデル選択)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-30T05:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

The [Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一のエンドポイントを通じて数百のモデルにアクセスするための統一 API を提供します。

| プロパティ | 値 |
| ------------- | -------------------------------- |
| プロバイダー | `vercel-ai-gateway` |
| 認証 | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages 互換 |
| モデルカタログ | `/v1/models` で自動検出 |

<Tip>
OpenClaw は Gateway `/v1/models` カタログを自動検出するため、`/models vercel-ai-gateway` には `vercel-ai-gateway/openai/gpt-5.5` や `vercel-ai-gateway/moonshotai/kimi-k2.6` などの現在のモデル参照が含まれます。
</Tip>

## はじめに

<Steps>
  <Step title="API キーを設定する">
    オンボーディングを実行し、AI Gateway 認証オプションを選択します。

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを設定する">
    OpenClaw 設定にモデルを追加します。

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

スクリプト化されたセットアップや CI セットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## モデル ID の省略形

OpenClaw は Vercel Claude の省略形モデル参照を受け入れ、実行時に正規化します。

| 省略形入力 | 正規化されたモデル参照 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
設定では、省略形または完全修飾モデル参照のどちらでも使用できます。OpenClaw は正準形式を自動的に解決します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    OpenClaw Gateway がデーモン（launchd/systemd）として実行される場合は、`AI_GATEWAY_API_KEY` がそのプロセスで利用可能であることを確認してください。

    <Warning>
    `~/.profile` にのみ設定されたキーは、その環境が明示的にインポートされない限り、launchd/systemd デーモンからは見えません。Gateway プロセスが読み取れるようにするには、`~/.openclaw/.env` または `env.shellEnv` 経由でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="プロバイダーのルーティング">
    Vercel AI Gateway は、モデル参照のプレフィックスに基づいてリクエストを上流プロバイダーへルーティングします。たとえば、`vercel-ai-gateway/anthropic/claude-opus-4.6` は Anthropic 経由でルーティングされ、`vercel-ai-gateway/openai/gpt-5.5` は OpenAI 経由で、`vercel-ai-gateway/moonshotai/kimi-k2.6` は MoonshotAI 経由でルーティングされます。単一の `AI_GATEWAY_API_KEY` が、すべての上流プロバイダーの認証を処理します。
  </Accordion>
  <Accordion title="思考レベル">
    `/think` オプションは、OpenClaw が上流プロバイダーの契約を把握している場合、信頼された上流モデルプレフィックスに従います。`vercel-ai-gateway/anthropic/...` は、Claude 4.6 モデル向けの適応的なデフォルトを含む Claude 思考プロファイルを使用します。`vercel-ai-gateway/openai/gpt-5.4`、`gpt-5.5`、および Codex スタイルの参照は、直接の OpenAI/OpenAI Codex プロバイダーと同様に `/think xhigh` を公開します。その他の名前空間付き参照は、カタログメタデータで追加が宣言されていない限り、通常の推論レベルを維持します。
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
