---
read_when:
    - OpenClaw で Chutes を使いたい
    - OAuth または API キーのセットアップ手順が必要です
    - デフォルトのモデル、エイリアス、または検出動作が必要な場合
summary: Chutes のセットアップ（OAuth または API キー、モデル検出、エイリアス）
title: Chutes
x-i18n:
    generated_at: "2026-06-27T12:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) は、OpenAI互換APIを通じてオープンソースモデルカタログを公開します。OpenClaw は `chutes` プロバイダーで、ブラウザーOAuthと直接APIキー認証の両方をサポートします。

| プロパティ | 値                           |
| ---------- | ---------------------------- |
| プロバイダー | `chutes`                     |
| API        | OpenAI互換                   |
| ベースURL  | `https://llm.chutes.ai/v1`   |
| 認証       | OAuthまたはAPIキー（下記参照） |

## Pluginをインストール

公式Pluginをインストールしてから、Gatewayを再起動します。

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuthオンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw はブラウザーフローをローカルで起動します。リモートまたはヘッドレスホストでは、URLとリダイレクト貼り付けフローを表示します。OAuthトークンは OpenClaw 認証プロファイルを通じて自動更新されます。
      </Step>
      <Step title="デフォルトモデルを確認する">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、Chutes 静的カタログが登録されます。
      </Step>
    </Steps>
  </Tab>
  <Tab title="APIキー">
    <Steps>
      <Step title="APIキーを取得する">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) でキーを作成します。
      </Step>
      <Step title="APIキーオンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを確認する">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、Chutes 静的カタログが登録されます。
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
どちらの認証パスも Chutes 静的カタログを登録し、デフォルトモデルを
`chutes/zai-org/GLM-4.7-TEE` に設定します。ランタイム環境変数: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`。
</Note>

## 検出動作

Chutes 認証が利用可能な場合、OpenClaw はその認証情報で Chutes カタログを問い合わせ、検出されたモデルを使用します。検出に失敗した場合、OpenClaw は静的カタログにフォールバックするため、オンボーディングと起動は引き続き動作します。

## デフォルトエイリアス

OpenClaw は Chutes 静的カタログ向けに3つの便利なエイリアスを登録します。

| エイリアス      | 対象モデル                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 組み込みスターターカタログ

静的フォールバックカタログには、現在の Chutes 参照が含まれます。

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
  <Accordion title="OAuthのオーバーライド">
    任意の環境変数でOAuthフローをカスタマイズできます。

    | 変数 | 目的 |
    | ---- | ---- |
    | `CHUTES_CLIENT_ID` | カスタムOAuthクライアントID |
    | `CHUTES_CLIENT_SECRET` | カスタムOAuthクライアントシークレット |
    | `CHUTES_OAUTH_REDIRECT_URI` | カスタムリダイレクトURI |
    | `CHUTES_OAUTH_SCOPES` | カスタムOAuthスコープ |

    リダイレクトアプリの要件とヘルプについては、[Chutes OAuthドキュメント](https://chutes.ai/docs/sign-in-with-chutes/overview)を参照してください。

  </Accordion>

  <Accordion title="メモ">
    - APIキー検出とOAuth検出はどちらも同じ `chutes` プロバイダーIDを使用します。
    - Chutes モデルは `chutes/<model-id>` として登録されます。
    - 起動時に検出が失敗した場合、静的カタログが自動的に使用されます。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、モデル参照、フェイルオーバー動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes ダッシュボードとAPIドキュメント。
  </Card>
  <Card title="Chutes APIキー" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes APIキーを作成および管理します。
  </Card>
</CardGroup>
