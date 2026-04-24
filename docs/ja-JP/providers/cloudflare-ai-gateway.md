---
read_when:
    - OpenClaw で Cloudflare AI Gateway を使いたい場合
    - account ID、gateway ID、または API キー環境変数が必要な場合
summary: Cloudflare AI Gateway のセットアップ（認証 + モデル選択）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T05:14:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway はプロバイダー API の前段に置かれ、分析、キャッシュ、制御を追加できます。Anthropic については、OpenClaw はあなたの Gateway endpoint を通じて Anthropic Messages API を使用します。

| Property      | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Default model | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API key       | `CLOUDFLARE_AI_GATEWAY_API_KEY`（Gateway 経由リクエスト用のプロバイダー API キー） |

<Note>
Cloudflare AI Gateway 経由でルーティングされる Anthropic モデルでは、プロバイダーキーとして **Anthropic API キー** を使用してください。
</Note>

## はじめに

<Steps>
  <Step title="プロバイダー API キーと Gateway 詳細を設定する">
    オンボーディングを実行し、Cloudflare AI Gateway の認証オプションを選択します。

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    これにより account ID、gateway ID、API キーの入力を求められます。

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

## 非対話の例

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
    Cloudflare で Gateway 認証を有効にしている場合は、`cf-aig-authorization` ヘッダーを追加してください。これはプロバイダー API キーに**加えて**必要です。

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
    `cf-aig-authorization` ヘッダーは Cloudflare Gateway 自体を認証し、プロバイダー API キー（たとえば Anthropic キー）は上流プロバイダーを認証します。
    </Tip>

  </Accordion>

  <Accordion title="環境に関する注意">
    Gateway がデーモン（launchd/systemd）として動作している場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がそのプロセスで利用可能であることを確認してください。

    <Warning>
    `~/.profile` にだけあるキーは、その環境がそこにも取り込まれていない限り、launchd/systemd デーモンには役立ちません。gateway プロセスが読めるようにするには、`~/.openclaw/.env` または `env.shellEnv` でキーを設定してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
