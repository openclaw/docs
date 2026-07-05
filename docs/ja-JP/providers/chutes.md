---
read_when:
    - OpenClawでChutesを使用したい
    - OAuth または API キーのセットアップパスが必要です
    - デフォルトモデル、エイリアス、または検出動作が必要な場合
summary: Chutes セットアップ（OAuth または API キー、モデル検出、エイリアス）
title: Chutes
x-i18n:
    generated_at: "2026-07-05T11:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) は、OpenAI 互換 API を通じてオープンソースモデルカタログを公開します。OpenClaw はブラウザー OAuth と API キー認証の両方をサポートしています。

| プロパティ | 値 |
| ---------------- | ------------------------------------------------------- |
| プロバイダー | `chutes` |
| Plugin | 公式外部パッケージ (`@openclaw/chutes-provider`) |
| API | OpenAI 互換 |
| ベース URL | `https://llm.chutes.ai/v1` |
| 認証 | OAuth または API キー (下記参照) |
| ランタイム環境変数 | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN` |

`CHUTES_OAUTH_TOKEN` は、(たとえば CI で) すでに取得済みの OAuth アクセストークンを直接指定し、下記の対話型ブラウザーフローをバイパスします。

## Plugin をインストール

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## はじめに

どちらのパスも、デフォルトモデルを `chutes/zai-org/GLM-4.7-TEE` に設定し、Chutes カタログを登録します。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth オンボーディングフローを実行">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw はブラウザーフローをローカルで起動するか、リモート/ヘッドレスホストでは URL + リダイレクト貼り付けフローを表示します。OAuth トークンは OpenClaw 認証プロファイルを通じて自動更新されます。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API キー">
    <Steps>
      <Step title="API キーを取得">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) でキーを作成します。
      </Step>
      <Step title="API キーのオンボーディングフローを実行">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 検出動作

Chutes 認証が利用可能な場合、OpenClaw はその認証情報で `GET /v1/models` をクエリし、検出されたモデルを使用します。モデルは認証情報ごとに 5 分間キャッシュされます。期限切れまたは未認可のキー (HTTP 401) では、OpenClaw は認証情報なしで一度再試行します。検出がそれでも行を返さない、失敗する、またはその他の非 2xx ステータスを返す場合は、バンドルされた静的カタログにフォールバックします (API キーと OAuth の検出はどちらも同じパスを使用します)。起動時に検出が失敗した場合、静的カタログが自動的に使用されます。

## デフォルトエイリアス

OpenClaw は Chutes カタログに 3 つの便利なエイリアスを登録します。

| エイリアス | ターゲットモデル |
| --------------- | ----------------------------------------------------- |
| `chutes-fast` | `chutes/zai-org/GLM-4.7-FP8` |
| `chutes-pro` | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 組み込みスターターカタログ

バンドルされたフォールバックカタログには 47 個のモデルがあります。現在の ref の代表例:

| モデル ref |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE` |
| `chutes/zai-org/GLM-5-TEE` |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE` |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE` |
| `chutes/openai/gpt-oss-120b-TEE` |

完全な一覧は `openclaw models list --all --provider chutes` を実行してください。

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
  <Accordion title="OAuth オーバーライド">
    任意の環境変数で OAuth フローをカスタマイズします。

    | 変数 | 目的 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth クライアント ID (未設定の場合はプロンプト表示) |
    | `CHUTES_CLIENT_SECRET` | OAuth クライアントシークレット |
    | `CHUTES_OAUTH_REDIRECT_URI` | リダイレクト URI (デフォルト `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | スペース区切りのスコープ (デフォルト `openid profile chutes:invoke`) |

    リダイレクトアプリ要件とヘルプについては、[Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview) を参照してください。

  </Accordion>

  <Accordion title="メモ">
    - Chutes モデルは `chutes/<model-id>` として登録されます。
    - Chutes はストリーミング中のトークン使用量を報告しません (`supportsUsageInStreaming: false`)。使用量の合計はストリーム完了後に引き続き表示されます。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、モデル ref、フェイルオーバー動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes ダッシュボードと API ドキュメント。
  </Card>
  <Card title="Chutes API キー" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API キーを作成および管理します。
  </Card>
</CardGroup>
