---
read_when:
    - OpenClaw で Chutes を使用する場合
    - OAuth または API キーのセットアップ手順が必要です
    - デフォルトモデル、エイリアス、または検出動作を設定したい場合
summary: Chutes のセットアップ（OAuth または API キー、モデル検出、エイリアス）
title: Chutes
x-i18n:
    generated_at: "2026-07-11T22:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) は、OpenAI 互換 API を通じてオープンソースモデルのカタログを提供します。OpenClaw は、ブラウザー OAuth と API キー認証の両方をサポートします。

| プロパティ       | 値                                                      |
| ---------------- | ------------------------------------------------------- |
| プロバイダー     | `chutes`                                                |
| Plugin           | 公式外部パッケージ (`@openclaw/chutes-provider`)        |
| API              | OpenAI 互換                                             |
| ベース URL       | `https://llm.chutes.ai/v1`                              |
| 認証             | OAuth または API キー（以下を参照）                     |
| 実行時環境変数   | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` は、取得済みの OAuth アクセストークンを直接指定し（CI での使用など）、以下の対話型ブラウザーフローを省略します。

## Plugin のインストール

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## はじめに

どちらの方法でも、デフォルトモデルが `chutes/zai-org/GLM-4.7-TEE` に設定され、Chutes カタログが登録されます。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth オンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw はローカル環境ではブラウザーフローを起動し、リモートまたはヘッドレスホストでは URL とリダイレクト先の貼り付けによるフローを表示します。OAuth トークンは OpenClaw の認証プロファイルを通じて自動更新されます。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API キー">
    <Steps>
      <Step title="API キーを取得する">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) でキーを作成します。
      </Step>
      <Step title="API キーのオンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 検出の動作

Chutes の認証情報が利用可能な場合、OpenClaw はその認証情報を使用して `GET /v1/models` を照会し、検出したモデルを使用します。結果は認証情報ごとに 5 分間キャッシュされます。期限切れまたは未認証のキー（HTTP 401）の場合、OpenClaw は認証情報なしで 1 回再試行します。それでも検出結果が空の場合、失敗した場合、またはその他の 2xx 以外のステータスが返された場合は、同梱の静的カタログにフォールバックします（API キーと OAuth の検出はどちらも同じ経路を使用します）。起動時に検出が失敗した場合は、静的カタログが自動的に使用されます。

## デフォルトエイリアス

OpenClaw は、Chutes カタログ向けに 3 つの便利なエイリアスを登録します。

| エイリアス      | 対象モデル                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 組み込みスターターカタログ

同梱のフォールバックカタログには 47 個のモデルがあります。現在のモデル参照の代表例は次のとおりです。

| モデル参照                                            |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

完全な一覧を表示するには、`openclaw models list --all --provider chutes` を実行します。

## 設定例

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth の上書き設定">
    オプションの環境変数を使用して OAuth フローをカスタマイズできます。

    | 変数 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth クライアント ID（未設定の場合は入力を求められます） |
    | `CHUTES_CLIENT_SECRET` | OAuth クライアントシークレット |
    | `CHUTES_OAUTH_REDIRECT_URI` | リダイレクト URI（デフォルトは `http://127.0.0.1:1456/oauth-callback`） |
    | `CHUTES_OAUTH_SCOPES` | スペース区切りのスコープ（デフォルトは `openid profile chutes:invoke`） |

    リダイレクトアプリの要件とヘルプについては、[Chutes OAuth ドキュメント](https://chutes.ai/docs/sign-in-with-chutes/overview)を参照してください。

  </Accordion>

  <Accordion title="注記">
    - Chutes モデルは `chutes/<model-id>` として登録されます。
    - Chutes はストリーミング中にトークン使用量を報告しません（`supportsUsageInStreaming: false`）。使用量の合計はストリーム完了後に表示されます。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーのルール、モデル参照、フェイルオーバーの動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes のダッシュボードと API ドキュメント。
  </Card>
  <Card title="Chutes API キー" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API キーを作成および管理します。
  </Card>
</CardGroup>
