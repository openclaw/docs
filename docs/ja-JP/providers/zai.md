---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使いたい
    - シンプルな ZAI_API_KEY セットアップが必要です
summary: OpenClawでZ.AI（GLMモデル）を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-07-05T11:47:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI は **GLM** モデルの API プラットフォームです。GLM 向けの REST API を提供し、
認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。
OpenClaw は Z.AI API キーとともに `zai` プロバイダーを使用します。

| プロパティ | 値                                           |
| ---------- | -------------------------------------------- |
| プロバイダー | `zai`                                        |
| パッケージ | `@openclaw/zai-provider`                     |
| 認証       | `ZAI_API_KEY` (レガシーエイリアス: `Z_AI_API_KEY`) |
| API        | Z.AI Chat Completions (Bearer 認証)          |

## GLM モデル

GLM はモデルファミリーであり、別のプロバイダーではありません。OpenClaw では、GLM モデルは
`zai/glm-5.2` のような参照を使用します。プロバイダーは `zai`、モデル ID は `glm-5.2` です。

## はじめに

まずプロバイダー Plugin をインストールします。

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最適な対象:** ほとんどのユーザー。OpenClaw は API キーでサポートされている Z.AI エンドポイントをプローブし、正しいベース URL を自動的に適用します。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **最適な対象:** 特定の Coding Plan または一般 API サーフェスを強制したいユーザー。

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### エンドポイント

| オンボーディング選択 | ベース URL                                     | デフォルトモデル |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` は、各エンドポイントの chat-completions API に対してキーをプローブし、
Coding Plan エンドポイント (`zai-coding-global`、その後 `zai-coding-cn`) より前に
一般エンドポイント (`zai-global`、その後 `zai-cn`) を確認し、リクエストを受け入れる
最初のエンドポイントで停止することで、これら 4 つのいずれかを自動検出します。
キーが両方で機能する場合に Coding Plan エンドポイントを強制するには、明示的な
`--auth-choice` を使用してください。

## 設定例

<Tip>
`zai-api-key` により、OpenClaw はキーから対応する Z.AI エンドポイントを検出し、
正しいベース URL を自動的に適用できます。特定の Coding Plan または一般 API サーフェスを
強制したい場合は、明示的な地域選択を使用してください。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 組み込みカタログ

`zai` プロバイダー Plugin は Plugin マニフェストにカタログを同梱しているため、読み取り専用の
一覧表示ではプロバイダーランタイムを読み込まずに既知の GLM 行を表示できます。

```bash
openclaw models list --all --provider zai
```

マニフェストに基づくカタログには現在、次が含まれます。

| モデル参照           | 注記                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan デフォルト、1M コンテキスト |
| `zai/glm-5.1`        | 一般 API デフォルト             |
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
GLM モデルは `zai/<model>` として利用できます (例: `zai/glm-5`)。
</Tip>

<Note>
Coding Plan セットアップのデフォルトは `zai/glm-5.2` です。一般 API セットアップでは
`zai/glm-5.1` が維持されます。Coding Plan エンドポイントでは、キーまたはプランで GLM-5.2 が
公開されていない場合、自動検出は `glm-5.1`、その後 `glm-4.7` にフォールバックします。GLM の
バージョンと可用性は変わる可能性があります。インストール済みバージョンが認識しているカタログを
確認するには、`openclaw models list --all --provider zai` を実行してください。
</Note>

## 思考レベル

<Tabs>
  <Tab title="GLM-5.2">
    全範囲: `off`、`low`、`high`、`max` (デフォルトは `off`)。OpenClaw は、
    リクエストペイロードの `reasoning_effort` を通じて、`low` と `high` を Z.AI の
    `high` 推論エフォートに、`max` を Z.AI の `max` エフォートにマッピングします。
  </Tab>
  <Tab title="Other GLM models">
    バイナリ切り替えのみ: `off` と `low` (ピッカーでは `on` と表示)、デフォルトは
    `off`。思考を `off` に設定すると `thinking: { type: "disabled" }` を送信します。
    それ以外のレベルではリクエストペイロードは変更されません (Z.AI 独自のデフォルト推論動作が適用されます)。
  </Tab>
</Tabs>

思考を `off` に設定すると、表示テキストの前に `reasoning_content` で出力予算を消費する
応答を避けられます。

## 高度な設定

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    不明な `glm-5*` ID は、現在の GLM-5 ファミリー形状に ID が一致する場合、
    `glm-4.7` テンプレートからプロバイダー所有のメタデータを合成することで、
    プロバイダーパス上で引き続き前方解決されます。
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI ツール呼び出しストリーミングでは、`tool_stream` がデフォルトで有効です。無効にするには:

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

  <Accordion title="Preserved thinking">
    保持された思考はオプトインです。Z.AI では履歴全体の `reasoning_content` を再生する必要があり、
    それによりプロンプトトークンが増えるためです。モデルごとに有効化します。

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

    有効化され、思考がオンの場合、OpenClaw は
    `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI 互換トランスクリプトの
    以前の `reasoning_content` を再生します。snake_case の `preserve_thinking` パラメーターキーは
    エイリアスとして機能します。

    高度なユーザーは、引き続き `params.extra_body.thinking` で正確なプロバイダーペイロードを
    上書きできます。

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI Plugin は画像理解を登録します。

    | プロパティ   | 値          |
    | ------------- | ----------- |
    | モデル        | `glm-4.6v`  |

    画像理解は、設定済みの Z.AI 認証から自動解決されます。追加の設定は不要です。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI は API キーによる Bearer 認証を使用します。
    - `zai-api-key` オンボーディング選択は、キーでサポート対象エンドポイントをプローブして、対応する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的な地域選択 (`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`) を使用してください。
    - レガシー環境変数 `Z_AI_API_KEY` は引き続き受け付けられます。`ZAI_API_KEY` が未設定の場合、OpenClaw は起動時にそれを `ZAI_API_KEY` にコピーします。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーとモデル設定を含む、OpenClaw 設定スキーマ全体。
  </Card>
</CardGroup>
