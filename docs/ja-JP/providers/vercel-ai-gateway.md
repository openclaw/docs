---
read_when:
    - OpenClaw で Vercel AI Gateway を使用したい
    - API キーの環境変数または CLI 認証の選択が必要です
summary: Vercel AI Gateway のセットアップ（認証 + モデル選択）
title: Vercel AI ゲートウェイ
x-i18n:
    generated_at: "2026-06-27T12:51:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一のエンドポイントから数百のモデルへアクセスするための統一 API を提供します。

| プロパティ      | 値                                     |
| ------------- | -------------------------------------- |
| プロバイダー      | `vercel-ai-gateway`                    |
| パッケージ       | `@openclaw/vercel-ai-gateway-provider` |
| 認証          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages 互換                 |
| モデルカタログ | `/v1/models` 経由で自動検出             |

<Tip>
OpenClaw は Gateway `/v1/models` カタログを自動検出するため、
`/models vercel-ai-gateway` には
`vercel-ai-gateway/openai/gpt-5.5` や
`vercel-ai-gateway/moonshotai/kimi-k2.6` などの現在のモデル参照が含まれます。
</Tip>

## はじめに

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
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

スクリプトまたは CI セットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## モデル ID の省略表記

OpenClaw は Vercel Claude の省略モデル参照を受け付け、実行時に正規化します。

| 省略入力                            | 正規化されたモデル参照                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
設定では、省略表記または完全修飾モデル参照のどちらも使用できます。
OpenClaw は正規形式を自動的に解決します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    OpenClaw Gateway をデーモン (launchd/systemd) として実行する場合は、
    `AI_GATEWAY_API_KEY` がそのプロセスで利用できるようにしてください。

    <Warning>
    対話型シェルでのみエクスポートされたキーは、その環境が明示的にインポートされない限り、
    launchd/systemd デーモンからは見えません。Gateway プロセスが読み取れるように、
    キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

  </Accordion>

  <Accordion title="プロバイダーのルーティング">
    Vercel AI Gateway は、モデル参照のプレフィックスに基づいてリクエストを上流プロバイダーへルーティングします。
    たとえば、`vercel-ai-gateway/anthropic/claude-opus-4.6` は Anthropic 経由でルーティングされ、
    `vercel-ai-gateway/openai/gpt-5.5` は OpenAI 経由で、
    `vercel-ai-gateway/moonshotai/kimi-k2.6` は MoonshotAI 経由でルーティングされます。
    単一の `AI_GATEWAY_API_KEY` が、すべての上流プロバイダーの認証を処理します。
  </Accordion>
  <Accordion title="思考レベル">
    OpenClaw が上流プロバイダーの契約を把握している場合、`/think` オプションは信頼済みの上流モデルプレフィックスに従います。
    `vercel-ai-gateway/anthropic/...` は Claude の思考プロファイルを使用し、Claude 4.6 モデル向けの適応型デフォルトも含まれます。
    `vercel-ai-gateway/openai/gpt-5.4`、`gpt-5.5`、および Codex 形式の参照は、
    直接の OpenAI/OpenAI Codex プロバイダーと同様に `/think xhigh` を公開します。
    その他の名前空間付き参照は、カタログメタデータが追加内容を宣言していない限り、通常の推論レベルを維持します。
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
