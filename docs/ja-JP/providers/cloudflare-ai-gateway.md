---
read_when:
    - OpenClaw で Cloudflare AI Gateway を使用したい
    - アカウント ID、Gateway ID、または API キー環境変数が必要です
summary: Cloudflare AI Gateway のセットアップ（認証 + モデル選択）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T05:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway はプロバイダー API の前段に配置され、分析、キャッシュ、制御を追加できます。Anthropic の場合、OpenClaw は Gateway エンドポイント経由で Anthropic Messages API を使用します。

| プロパティ      | 値                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| プロバイダー      | `cloudflare-ai-gateway`                                                                  |
| ベース URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| デフォルトモデル | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| APIキー       | `CLOUDFLARE_AI_GATEWAY_API_KEY`（Gateway 経由のリクエストに使用するプロバイダー APIキー） |

<Note>
Cloudflare AI Gateway 経由でルーティングされる Anthropic モデルでは、プロバイダーキーとして **Anthropic APIキー** を使用します。
</Note>

Anthropic Messages モデルで thinking が有効な場合、OpenClaw は Cloudflare AI Gateway 経由でペイロードを送信する前に、末尾の assistant prefill ターンを取り除きます。Anthropic は extended thinking でのレスポンスの prefilling を拒否しますが、通常の thinking なしの prefill は引き続き利用できます。

## はじめに

<Steps>
  <Step title="プロバイダー APIキーと Gateway 詳細を設定する">
    オンボーディングを実行し、Cloudflare AI Gateway の認証オプションを選択します。

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    これにより、アカウント ID、Gateway ID、APIキーの入力が求められます。

  </Step>
  <Step title="デフォルトモデルを設定する">
    OpenClaw 設定にモデルを追加します。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非対話型の例

スクリプトや CI のセットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 高度な設定

<AccordionGroup>
  <Accordion title="認証付き Gateway">
    Cloudflare で Gateway 認証を有効にした場合は、`cf-aig-authorization` ヘッダーを追加します。これはプロバイダー APIキー**に加えて**必要です。

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` ヘッダーは Cloudflare Gateway 自体に対して認証し、プロバイダー APIキー（たとえば Anthropic キー）はアップストリームのプロバイダーに対して認証します。
    </Tip>

  </Accordion>

  <Accordion title="環境に関する注意">
    Gateway がデーモン（launchd/systemd）として実行されている場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がそのプロセスで利用できるようにしてください。

    <Warning>
    `~/.profile` のみに置かれたキーは、その環境もそこへインポートされていない限り、launchd/systemd デーモンには役立ちません。Gateway プロセスが読み取れるように、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

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
