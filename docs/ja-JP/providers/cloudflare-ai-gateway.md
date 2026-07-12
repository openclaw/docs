---
read_when:
    - OpenClaw で Cloudflare AI Gateway を使用する場合
    - アカウント ID、Gateway ID、または API キーの環境変数が必要です
summary: Cloudflare AI Gateway のセットアップ（認証 + モデル選択）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-11T22:34:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) はプロバイダー API の前段に配置され、分析、キャッシュ、制御を追加します。Anthropic の場合、OpenClaw は Gateway エンドポイントを介して Anthropic Messages API を使用します。

| プロパティ | 値 |
| ------------- | ---------------------------------------------------------------------------------------- |
| プロバイダー | `cloudflare-ai-gateway` |
| Plugin | 公式の外部パッケージ（`@openclaw/cloudflare-ai-gateway-provider`） |
| ベース URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic` |
| デフォルトモデル | `cloudflare-ai-gateway/claude-sonnet-4-6` |
| API キー | `CLOUDFLARE_AI_GATEWAY_API_KEY`（Gateway 経由のリクエストに使用するプロバイダー API キー） |

<Note>
Cloudflare AI Gateway 経由でルーティングされる Anthropic モデルでは、プロバイダーキーとして **Anthropic API キー**を使用してください。
</Note>

Anthropic Messages モデルで思考が有効な場合、OpenClaw は Cloudflare AI Gateway を介してペイロードを送信する前に、末尾のアシスタント事前入力ターンを取り除きます。
Anthropic は拡張思考でのレスポンス事前入力を拒否しますが、通常の非思考事前入力は引き続き利用できます。

## Plugin をインストールする

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="プロバイダー API キーと Gateway の詳細を設定する">
    オンボーディングを実行し、Cloudflare AI Gateway の認証オプションを選択します。

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    アカウント ID、Gateway ID、API キーの入力を求められます。

  </Step>
  <Step title="デフォルトモデルを設定する">
    OpenClaw の設定にモデルを追加します。

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
    Cloudflare で Gateway 認証を有効にした場合は、`cf-aig-authorization` ヘッダーを追加します。これはプロバイダー API キーに**加えて**必要です。

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
    `cf-aig-authorization` ヘッダーは Cloudflare Gateway 自体での認証に使用され、プロバイダー API キー（たとえば Anthropic キー）は上流プロバイダーでの認証に使用されます。
    </Tip>

  </Accordion>

  <Accordion title="環境に関する注意事項">
    Gateway をデーモン（launchd/systemd）として実行する場合は、そのプロセスから `CLOUDFLARE_AI_GATEWAY_API_KEY` を利用できることを確認してください。

    <Warning>
    対話型シェルでのみエクスポートしたキーは、その環境も launchd/systemd にインポートしない限り、デーモンでは利用できません。Gateway プロセスがキーを読み取れるように、`~/.openclaw/.env` または `env.shellEnv` を使用してキーを設定してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとよくある質問。
  </Card>
</CardGroup>
