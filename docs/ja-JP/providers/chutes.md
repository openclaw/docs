---
read_when:
    - OpenClawでChutesを使用したい
    - OAuth または API キーのセットアップ手順が必要です
    - デフォルトモデル、エイリアス、または検出動作が必要な場合
summary: Chutes のセットアップ（OAuth または API キー、モデル検出、エイリアス）
title: Chutes
x-i18n:
    generated_at: "2026-04-30T05:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) は、オープンソースのモデルカタログを
OpenAI互換 API を通じて公開します。OpenClaw は、同梱の `chutes` provider 向けに
ブラウザー OAuth と直接 APIキー認証の両方をサポートします。

| プロパティ | 値                           |
| ---------- | ---------------------------- |
| Provider   | `chutes`                     |
| API        | OpenAI互換                   |
| ベース URL | `https://llm.chutes.ai/v1`   |
| 認証       | OAuth または APIキー（下記参照） |

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw はブラウザーフローをローカルで起動するか、リモートまたはヘッドレスホストでは URL とリダイレクト貼り付け
        フローを表示します。OAuth トークンは OpenClaw 認証
        プロファイルを通じて自動更新されます。
      </Step>
      <Step title="Verify the default model">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、同梱の Chutes カタログが
        登録されます。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) でキーを作成します。
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、同梱の Chutes カタログが
        登録されます。
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
どちらの認証パスでも、同梱の Chutes カタログが登録され、デフォルトモデルは
`chutes/zai-org/GLM-4.7-TEE` に設定されます。ランタイム環境変数: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`。
</Note>

## 検出の動作

Chutes 認証が利用可能な場合、OpenClaw はその認証情報を使って Chutes カタログを照会し、
検出されたモデルを使用します。検出に失敗した場合、OpenClaw は
同梱の静的カタログにフォールバックするため、オンボーディングと起動は引き続き動作します。

## デフォルトエイリアス

OpenClaw は、同梱の Chutes カタログに対して 3 つの便利なエイリアスを登録します。

| エイリアス      | 対象モデル                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 組み込みスターターカタログ

同梱のフォールバックカタログには、現在の Chutes refs が含まれます。

| モデル ref                                           |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

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
  <Accordion title="OAuth overrides">
    任意の環境変数で OAuth フローをカスタマイズできます。

    | 変数 | 目的 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | カスタム OAuth クライアント ID |
    | `CHUTES_CLIENT_SECRET` | カスタム OAuth クライアントシークレット |
    | `CHUTES_OAUTH_REDIRECT_URI` | カスタムリダイレクト URI |
    | `CHUTES_OAUTH_SCOPES` | カスタム OAuth スコープ |

    リダイレクトアプリの要件とヘルプについては、[Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview) を参照してください。

  </Accordion>

  <Accordion title="Notes">
    - APIキーと OAuth 検出はどちらも同じ `chutes` provider id を使用します。
    - Chutes モデルは `chutes/<model-id>` として登録されます。
    - 起動時に検出に失敗した場合、同梱の静的カタログが自動的に使用されます。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    Provider ルール、モデル refs、フェイルオーバー動作。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    provider 設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes ダッシュボードと API ドキュメント。
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes APIキーを作成および管理します。
  </Card>
</CardGroup>
