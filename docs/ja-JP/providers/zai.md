---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使用する場合
    - シンプルな ZAI_API_KEY の設定が必要です
summary: OpenClaw で Z.AI（GLM モデル）を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-07-11T22:39:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
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
| 認証       | `ZAI_API_KEY`（従来の別名: `Z_AI_API_KEY`） |
| API        | Z.AI Chat Completions（Bearer 認証）         |

## GLM モデル

GLM はモデルファミリーであり、独立したプロバイダーではありません。OpenClaw では、GLM モデルは
`zai/glm-5.2` のような参照を使用します。プロバイダーは `zai`、モデル ID は `glm-5.2` です。

## はじめに

まずプロバイダー Plugin をインストールします。

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="エンドポイントの自動検出">
    **最適なユーザー:** ほとんどのユーザー。OpenClaw は API キーを使用して対応する Z.AI エンドポイントを検査し、正しいベース URL を自動的に適用します。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="モデルが一覧に表示されることを確認する">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明示的なリージョンエンドポイント">
    **最適なユーザー:** 特定の Coding Plan または一般 API サーフェスを強制的に使用したいユーザー。

    <Steps>
      <Step title="適切なオンボーディング項目を選択する">
        ```bash
        # Coding Plan グローバル（Coding Plan ユーザーに推奨）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan 中国（中国リージョン）
        openclaw onboard --auth-choice zai-coding-cn

        # 一般 API
        openclaw onboard --auth-choice zai-global

        # 一般 API 中国（中国リージョン）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="モデルが一覧に表示されることを確認する">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### エンドポイント

| オンボーディング項目 | ベース URL                                    | デフォルトモデル |
| -------------------- | --------------------------------------------- | ---------------- |
| `zai-global`         | `https://api.z.ai/api/paas/v4`                | `glm-5.1`        |
| `zai-cn`             | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`        |
| `zai-coding-global`  | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`        |
| `zai-coding-cn`      | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`        |

`zai-api-key` は、各エンドポイントの Chat Completions API に対してキーを検査し、
これら 4 つのいずれかを自動検出します。一般エンドポイント（`zai-global`、
次に `zai-cn`）を Coding Plan エンドポイント（`zai-coding-global`、次に
`zai-coding-cn`）より先に確認し、リクエストを受け付けた最初のエンドポイントで停止します。
キーが両方で機能する場合に Coding Plan エンドポイントを強制するには、明示的な
`--auth-choice` を使用してください。

## 設定例

<Tip>
`zai-api-key` を使用すると、OpenClaw はキーから一致する Z.AI エンドポイントを検出し、
正しいベース URL を自動的に適用できます。特定の Coding Plan または一般 API サーフェスを
強制的に使用したい場合は、明示的なリージョン項目を使用してください。
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

`zai` プロバイダー Plugin はカタログを Plugin マニフェストに同梱しているため、読み取り専用の
一覧表示では、プロバイダーのランタイムを読み込まずに既知の GLM 行を表示できます。

```bash
openclaw models list --all --provider zai
```

マニフェストに基づくカタログには現在、以下が含まれています。

| モデル参照            | 備考                            |
| --------------------- | ------------------------------- |
| `zai/glm-5.2`         | Coding Plan のデフォルト、1M コンテキスト |
| `zai/glm-5.1`         | 一般 API のデフォルト           |
| `zai/glm-5`           |                                 |
| `zai/glm-5-turbo`     |                                 |
| `zai/glm-5v-turbo`    |                                 |
| `zai/glm-4.7`         |                                 |
| `zai/glm-4.7-flash`   |                                 |
| `zai/glm-4.7-flashx`  |                                 |
| `zai/glm-4.6`         |                                 |
| `zai/glm-4.6v`        |                                 |
| `zai/glm-4.5`         |                                 |
| `zai/glm-4.5-air`     |                                 |
| `zai/glm-4.5-flash`   |                                 |
| `zai/glm-4.5v`        |                                 |

<Tip>
GLM モデルは `zai/<model>` として利用できます（例: `zai/glm-5`）。
</Tip>

<Note>
Coding Plan のセットアップではデフォルトで `zai/glm-5.2` が使用され、一般 API のセットアップでは
`zai/glm-5.1` が維持されます。Coding Plan エンドポイントでは、キーまたはプランで GLM-5.2 が
提供されていない場合、自動検出によって `glm-5.1`、次に `glm-4.7` にフォールバックします。GLM の
バージョンと提供状況は変更される場合があります。インストール済みバージョンが認識しているカタログを
確認するには、`openclaw models list --all --provider zai` を実行してください。
</Note>

## 思考レベル

<Tabs>
  <Tab title="GLM-5.2">
    全範囲: `off`、`low`、`high`、`max`（デフォルトは `off`）。OpenClaw は、
    `low` と `high` を Z.AI の `high` 推論強度に、`max` を Z.AI の
    `max` 強度に、リクエストペイロードの `reasoning_effort` を介してマッピングします。
  </Tab>
  <Tab title="その他の GLM モデル">
    二値切り替えのみ: `off` と `low`（選択画面では `on` と表示）。デフォルトは
    `off` です。思考を `off` に設定すると `thinking: { type: "disabled" }` が送信され、
    その他のレベルではリクエストペイロードは変更されません（Z.AI 独自のデフォルトの
    推論動作が適用されます）。
  </Tab>
</Tabs>

思考を `off` に設定すると、表示テキストの前に `reasoning_content` で出力予算を
消費する応答を回避できます。

## 高度な設定

<AccordionGroup>
  <Accordion title="不明な GLM-5 モデルの前方解決">
    不明な `glm-5*` ID でも、ID が現在の GLM-5 ファミリーの形式に一致する場合は、
    `glm-4.7` テンプレートからプロバイダー所有のメタデータを合成することで、
    プロバイダーパス上で引き続き前方解決されます。
  </Accordion>

  <Accordion title="ツール呼び出しのストリーミング">
    Z.AI のツール呼び出しストリーミングでは、`tool_stream` がデフォルトで有効です。無効にするには、次のように設定します。

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

  <Accordion title="保持される思考">
    Z.AI では過去の `reasoning_content` 全体を再生する必要があり、プロンプトトークンが増加するため、
    思考の保持はオプトインです。モデルごとに有効にします。

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

    有効で思考がオンの場合、OpenClaw は
    `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ
    OpenAI 互換トランスクリプトに対して以前の `reasoning_content` を再生します。snake_case の
    `preserve_thinking` パラメーターキーも別名として使用できます。

    上級ユーザーは、`params.extra_body.thinking` を使用してプロバイダーペイロードを
    引き続き厳密に上書きできます。

  </Accordion>

  <Accordion title="画像理解">
    Z.AI Plugin は画像理解を登録します。

    | プロパティ | 値          |
    | ---------- | ----------- |
    | モデル     | `glm-4.6v`  |

    画像理解は、設定済みの Z.AI 認証から自動的に解決されます。追加の設定は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API キーによる Bearer 認証を使用します。
    - `zai-api-key` オンボーディング項目は、キーを使用して対応エンドポイントを検査し、一致する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制的に使用したい場合は、明示的なリージョン項目（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）を使用してください。
    - 従来の環境変数 `Z_AI_API_KEY` も引き続き使用できます。`ZAI_API_KEY` が未設定の場合、OpenClaw は起動時にその値を `ZAI_API_KEY` へコピーします。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーとモデルの設定を含む、OpenClaw の完全な設定スキーマ。
  </Card>
</CardGroup>
