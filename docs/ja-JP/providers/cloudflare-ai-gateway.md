---
read_when:
    - OpenClaw で Cloudflare AI Gateway を使用したい場合
    - アカウント ID、Gateway ID、または API キー環境変数が必要です
summary: Cloudflare AI Gateway のセットアップ（認証 + モデル選択）
title: Cloudflare AI ゲートウェイ
x-i18n:
    generated_at: "2026-06-27T12:41:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway はプロバイダー API の前段に配置され、分析、キャッシュ、制御を追加できます。Anthropic では、OpenClaw は Gateway エンドポイント経由で Anthropic Messages API を使用します。

| プロパティ      | 値                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| プロバイダー      | `cloudflare-ai-gateway`                                                                  |
| ベース URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| デフォルトモデル | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API キー       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway 経由のリクエストに使うプロバイダー API キー) |

<Note>
Cloudflare AI Gateway 経由でルーティングされる Anthropic モデルでは、プロバイダーキーとして **Anthropic API キー** を使用してください。
</Note>

Anthropic Messages モデルで thinking が有効な場合、OpenClaw はペイロードを Cloudflare AI Gateway 経由で送信する前に、末尾の assistant prefill ターンを取り除きます。
Anthropic は extended thinking でのレスポンス prefilling を拒否しますが、通常の non-thinking prefill は引き続き利用できます。

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="プロバイダー API キーと Gateway の詳細を設定する">
    オンボーディングを実行し、Cloudflare AI Gateway 認証オプションを選択します。

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    これにより、アカウント ID、gateway ID、API キーの入力を求められます。

  </Step>
  <Step title="デフォルトモデルを設定する">
    OpenClaw config にモデルを追加します。

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
    Cloudflare で Gateway 認証を有効にしている場合は、`cf-aig-authorization` ヘッダーを追加します。これはプロバイダー API キー**に加えて**必要です。

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
    `cf-aig-authorization` ヘッダーは Cloudflare Gateway 自体を認証し、プロバイダー API キー (たとえば Anthropic キー) はアップストリームプロバイダーを認証します。
    </Tip>

  </Accordion>

  <Accordion title="環境に関する注意">
    Gateway がデーモン (launchd/systemd) として実行される場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がそのプロセスから利用できることを確認してください。

    <Warning>
    対話型シェルでのみ export されたキーは、その環境もそこにインポートされていない限り、launchd/systemd デーモンには役立ちません。gateway プロセスがキーを読み取れるようにするには、`~/.openclaw/.env` または `env.shellEnv` でキーを設定してください。
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
