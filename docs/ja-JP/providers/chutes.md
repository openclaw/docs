---
read_when:
    - OpenClawでChutesを使いたい
    - OAuthまたはAPI keyのセットアップ手順が必要です
    - デフォルトモデル、aliases、または検出動作を知りたい
summary: Chutesのセットアップ（OAuthまたはAPI key、モデル検出、aliases）
title: Chutes
x-i18n:
    generated_at: "2026-04-24T05:14:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) は、OpenAI互換APIを通じてオープンソースモデルカタログを提供します。OpenClawは、バンドル済み `chutes` プロバイダに対して、ブラウザOAuthと直接API key認証の両方をサポートしています。

| プロパティ | 値 |
| -------- | ---------------------------- |
| プロバイダ | `chutes` |
| API      | OpenAI互換 |
| Base URL | `https://llm.chutes.ai/v1` |
| 認証     | OAuth または API key（下記参照） |

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuthオンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClawはローカルではブラウザフローを起動し、リモート/ヘッドレスホストではURL + redirect貼り付けフローを表示します。OAuthトークンはOpenClaw auth profiles経由で自動更新されます。
      </Step>
      <Step title="デフォルトモデルを確認する">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、バンドル済みChutes catalogが登録されます。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="API keyを取得する">
        キーを
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        で作成します。
      </Step>
      <Step title="API keyオンボーディングフローを実行する">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを確認する">
        オンボーディング後、デフォルトモデルは
        `chutes/zai-org/GLM-4.7-TEE` に設定され、バンドル済みChutes catalogが登録されます。
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
どちらの認証経路でも、バンドル済みChutes catalogが登録され、デフォルトモデルは
`chutes/zai-org/GLM-4.7-TEE` に設定されます。ランタイム環境変数: `CHUTES_API_KEY`、
`CHUTES_OAUTH_TOKEN`。
</Note>

## 検出動作

Chutes認証が利用可能な場合、OpenClawはその認証情報でChutes catalogを問い合わせ、検出されたモデルを使います。検出に失敗した場合でも、オンボーディングと起動が引き続き動作するよう、OpenClawはバンドル済み静的catalogへフォールバックします。

## デフォルトaliases

OpenClawは、バンドル済みChutes catalogに対して3つの便利なaliasを登録します:

| Alias | 対象モデル |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8` |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 組み込みstarter catalog

バンドル済みフォールバックcatalogには、現在のChutes refが含まれます:

| モデルref |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE` |
| `chutes/zai-org/GLM-5-TEE` |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE` |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE` |
| `chutes/openai/gpt-oss-120b-TEE` |

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
  <Accordion title="OAuth上書き">
    任意の環境変数を使ってOAuthフローをカスタマイズできます:

    | 変数 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | カスタムOAuth client ID |
    | `CHUTES_CLIENT_SECRET` | カスタムOAuth client secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | カスタムredirect URI |
    | `CHUTES_OAUTH_SCOPES` | カスタムOAuth scopes |

    redirect-app要件と詳細については [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)
    を参照してください。

  </Accordion>

  <Accordion title="注記">
    - API-key検出とOAuth検出は、どちらも同じ `chutes` provider idを使います。
    - Chutesモデルは `chutes/<model-id>` として登録されます。
    - 起動時に検出が失敗した場合、バンドル済み静的catalogが自動的に使われます。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダルール、モデルref、フェイルオーバー動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダ設定を含む完全なconfig schema。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    ChutesダッシュボードとAPI docs。
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API keyの作成と管理。
  </Card>
</CardGroup>
