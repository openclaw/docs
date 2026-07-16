---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使用する場合
    - 簡単な ZAI_API_KEY の設定が必要です
summary: OpenClaw で Z.AI（GLM モデル）を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T12:13:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、
認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。
OpenClaw は Z.AI API キーとともに `zai` プロバイダーを使用します。

| プロパティ | 値                                           |
| ---------- | -------------------------------------------- |
| プロバイダー | `zai`                                        |
| パッケージ | `@openclaw/zai-provider`                     |
| 認証       | `ZAI_API_KEY`（レガシーエイリアス: `Z_AI_API_KEY`） |
| API        | Z.AI Chat Completions（Bearer 認証）          |

## GLM モデル

GLM はモデルファミリーであり、独立したプロバイダーではありません。OpenClaw では、GLM モデルは
`zai/glm-5.2` のような参照を使用します。プロバイダーは `zai`、モデル ID は `glm-5.2` です。

## はじめに

まずプロバイダー Plugin をインストールします。

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="エンドポイントを自動検出">
    **最適な対象:** ほとんどのユーザー。OpenClaw は API キーを使用して、サポートされている Z.AI エンドポイントを検査し、正しいベース URL を自動的に適用します。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="モデルが一覧に表示されることを確認">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="リージョン別エンドポイントを明示的に指定">
    **最適な対象:** 特定の Coding Plan または汎用 API サーフェスを強制的に使用したいユーザー。

    <Steps>
      <Step title="適切なオンボーディング項目を選択">
        ```bash
        # Coding Plan Global（Coding Plan ユーザーに推奨）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中国リージョン）
        openclaw onboard --auth-choice zai-coding-cn

        # 汎用 API
        openclaw onboard --auth-choice zai-global

        # 汎用 API CN（中国リージョン）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="モデルが一覧に表示されることを確認">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### エンドポイント

| オンボーディング項目 | ベース URL                                     | デフォルトモデル |
| -------------------- | --------------------------------------------- | ---------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` は、キーを各エンドポイントの chat-completions API に対して検査し、
これら 4 つのうち 1 つを自動検出します。汎用エンドポイント（`zai-global`、
次に `zai-cn`）を Coding Plan エンドポイント（`zai-coding-global`、次に
`zai-coding-cn`）より先に確認し、リクエストを最初に受け付けたエンドポイントで停止します。
キーが両方で動作する場合に Coding Plan エンドポイントを強制するには、明示的な
`--auth-choice` を使用します。

## レート制限と過負荷

Z.AI のドキュメントでは、Coding Plan と汎用エージェントツールは容量が
管理されるサービスとされています。Z.AI のドキュメントによると次のとおりです。

- [汎用エージェントツール](https://docs.z.ai/devpack/tool/others)（OpenClaw を含む）は、
  ベストエフォート方式で提供されます。推論負荷が高い時間帯（通常はシンガポール時間の午後 2～6 時頃）には、
  一部のリクエストが一時的なレート制限の対象となる場合があります。
- [Coding Plan のレートおよび同時実行数の制限](https://docs.z.ai/devpack/usage-policy)は
  プランの階層に連動し、リソースの可用性に応じて動的に調整される場合があります。
  オフピーク時間帯には、同時実行数が増える場合があります。
- [API エラーコード `1302`](https://docs.z.ai/api-reference/api-code)は
  「リクエストのレート制限に達しました」を意味します。API エラーコード `1305` は
  「サービスが一時的に過負荷になっている可能性があります。後でもう一度お試しください」を意味します。

混雑時間帯に一時的な `429` または `1305` レスポンスが表示された場合は、待機してから
リクエストを再試行してください。ピーク時間外でも障害が繰り返し発生する場合、または
1 つのエンドポイント、モデル、リクエスト形式でのみ発生する場合は、まず設定済みのエンドポイントと
モデルを確認します。

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding Plan キーでは `https://api.z.ai/api/coding/paas/v4` などの Coding Plan エンドポイントを使用し、
汎用 API キーでは `https://api.z.ai/api/paas/v4` などの汎用 API エンドポイントを使用する必要があります。
同じキーとエンドポイントで障害が継続する場合は、通常のピーク負荷によるスロットリングではなく、
プロバイダー側での拒否またはプランの制限を示している可能性があります。

## 設定例

<Tip>
`zai-api-key` を使用すると、OpenClaw はキーに一致する Z.AI エンドポイントを検出し、
正しいベース URL を自動的に適用できます。特定の Coding Plan または汎用 API サーフェスを
強制的に使用する場合は、リージョン別の明示的な項目を使用してください。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 は Coding Plan エンドポイントを使用します。
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 組み込みカタログ

`zai` プロバイダー Plugin はカタログを Plugin マニフェストに同梱しているため、
読み取り専用の一覧表示ではプロバイダーランタイムを読み込まずに既知の GLM 行を表示できます。

```bash
openclaw models list --all --provider zai
```

マニフェストに基づくカタログには現在、次の項目が含まれています。

| モデル参照           | 備考                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan のデフォルト、1M コンテキスト |
| `zai/glm-5.1`        | 汎用 API のデフォルト            |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM モデルは `zai/<model>` として利用できます（例: `zai/glm-5`）。
</Tip>

<Note>
Coding Plan のセットアップではデフォルトで `zai/glm-5.2` が使用され、汎用 API のセットアップでは
`zai/glm-5.1` が維持されます。Coding Plan エンドポイントでは、キーまたはプランで GLM-5.2 が公開されていない場合、
自動検出は `glm-5.1`、次に `glm-4.7` へフォールバックします。GLM の
バージョンと可用性は変更される可能性があります。インストール済みバージョンが認識しているカタログを確認するには、
`openclaw models list --all --provider zai` を実行してください。
</Note>

## 思考レベル

<Tabs>
  <Tab title="GLM-5.2">
    全範囲: `off`、`low`、`high`、`max`（デフォルトは `off`）。OpenClaw は
    リクエストペイロードの `reasoning_effort` を介して、`low` と `high` を Z.AI の
    `high` 推論エフォートに、`max` を Z.AI の `max` エフォートにマッピングします。
  </Tab>
  <Tab title="その他の GLM モデル">
    バイナリ切り替えのみ: `off` と `low`（選択画面では `on` と表示）、デフォルトは
    `off` です。思考を `off` に設定すると `thinking: { type: "disabled" }` が送信されます。
    その他のレベルではリクエストペイロードは変更されません（Z.AI 独自のデフォルトの
    推論動作が適用されます）。
  </Tab>
</Tabs>

思考を `off` に設定すると、表示テキストより先に `reasoning_content` で
出力予算を消費するレスポンスを回避できます。

## 高度な設定

<AccordionGroup>
  <Accordion title="不明な GLM-5 モデルの前方解決">
    不明な `glm-5*` ID でも、その ID が現在の GLM-5 ファミリーの形式に一致する場合は、
    `glm-4.7` テンプレートからプロバイダー所有のメタデータを合成することで、
    プロバイダーパス上で引き続き前方解決されます。
  </Accordion>

  <Accordion title="ツール呼び出しのストリーミング">
    Z.AI のツール呼び出しストリーミングでは、デフォルトで `tool_stream` が有効です。無効にするには次のようにします。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="思考の保持">
    思考の保持はオプトインです。Z.AI では過去の `reasoning_content` 全体を
    再送する必要があり、プロンプトトークンが増加するためです。モデルごとに有効にします。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    有効になっており、かつ思考がオンの場合、OpenClaw は
    `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI 互換トランスクリプトの過去の
    `reasoning_content` を再送します。スネークケースの
    `preserve_thinking` パラメーターキーもエイリアスとして機能します。

    上級ユーザーは `params.extra_body.thinking` を使用して、正確なプロバイダーペイロードを
    引き続き上書きできます。

  </Accordion>

  <Accordion title="画像理解">
    Z.AI Plugin は画像理解を登録します。

    | プロパティ    | 値          |
    | ------------- | ----------- |
    | モデル        | `glm-4.6v`  |

    画像理解は設定済みの Z.AI 認証から自動的に解決されるため、
    追加設定は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API キーによる Bearer 認証を使用します。
    - `zai-api-key` オンボーディング項目は、キーを使用してサポート対象のエンドポイントを検査し、一致する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制的に使用する場合は、リージョン別の明示的な項目（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）を使用します。
    - レガシー環境変数 `Z_AI_API_KEY` も引き続き受け付けられます。`ZAI_API_KEY` が未設定の場合、OpenClaw は起動時にその値を `ZAI_API_KEY` にコピーします。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーとモデルの設定を含む、OpenClaw の完全な設定スキーマです。
  </Card>
</CardGroup>
