---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使いたい場合
    - シンプルな ZAI_API_KEY の設定が必要です
summary: OpenClaw で Z.AI（GLM モデル）を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T12:53:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。
OpenClaw は Z.AI API キーとともに `zai` プロバイダーを使用します。

| プロパティ | 値                                           |
| ---------- | -------------------------------------------- |
| プロバイダー | `zai`                                        |
| パッケージ | `@openclaw/zai-provider`                     |
| 認証       | `ZAI_API_KEY`（レガシーエイリアス: `Z_AI_API_KEY`） |
| API        | Z.AI Chat Completions（Bearer 認証）          |

## GLM モデル

GLM はモデルファミリーであり、別個のプロバイダーではありません。OpenClaw では、GLM モデルは
`zai/glm-5.2` のような参照を使用します: プロバイダー `zai`、モデル ID `glm-5.2`。

## はじめに

まずプロバイダー Plugin をインストールします。

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最適な対象:** ほとんどのユーザー。OpenClaw は API キーを使ってサポートされている Z.AI エンドポイントをプローブし、正しいベース URL を自動的に適用します。

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
    **最適な対象:** 特定の Coding Plan または汎用 API サーフェスを強制したいユーザー。

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

## 設定例

<Tip>
`zai-api-key` は、OpenClaw がキーから一致する Z.AI エンドポイントを検出し、
正しいベース URL を自動的に適用できるようにします。特定の Coding Plan または汎用 API サーフェスを
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

`zai` プロバイダー Plugin は Plugin マニフェスト内にカタログを同梱しているため、読み取り専用の
一覧表示では、プロバイダーランタイムを読み込まずに既知の GLM 行を表示できます。

```bash
openclaw models list --all --provider zai
```

マニフェストに基づくカタログには現在、次が含まれます。

| モデル参照           | 注記                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan のデフォルト; 1M コンテキスト |
| `zai/glm-5.1`        | 汎用 API のデフォルト           |
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

<Tip>
GLM-5.2 は `off`、`low`、`high`、`max` の thinking レベルをサポートします。OpenClaw は
`low` と `high` を Z.AI の高い reasoning effort に、`max` を最大 effort にマッピングします。
</Tip>

<Note>
Coding Plan セットアップはデフォルトで `zai/glm-5.2` を使用します。汎用 API セットアップは
`zai/glm-5.1` を維持します。エンドポイントの自動検出は、選択されたプランが GLM-5.2 を公開していない場合、
`glm-5.1` または `glm-4.7` にフォールバックします。GLM のバージョンと可用性は
変わることがあります。インストール済みバージョンが認識しているカタログを確認するには、
`openclaw models list --all --provider zai` を実行してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    不明な `glm-5*` ID は、ID が現在の GLM-5 ファミリーの形状に一致する場合、
    `glm-4.7` テンプレートからプロバイダー所有のメタデータを合成することで、
    プロバイダーパス上で引き続き前方解決されます。
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI のツール呼び出しストリーミングでは、`tool_stream` がデフォルトで有効です。無効にするには:

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

  <Accordion title="Thinking and preserved thinking">
    Z.AI の thinking は OpenClaw の `/think` コントロールに従います。thinking がオフの場合、
    OpenClaw は、表示されるテキストの前に `reasoning_content` で出力予算を消費する応答を避けるため、
    `thinking: { type: "disabled" }` を送信します。

    preserved thinking はオプトインです。これは、Z.AI が完全な履歴
    `reasoning_content` の再生を要求し、プロンプトトークンが増えるためです。モデルごとに有効化します。

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

    有効化され、thinking がオンの場合、OpenClaw は
    `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI 互換トランスクリプトについて過去の
    `reasoning_content` を再生します。

    上級ユーザーは、`params.extra_body.thinking` で正確なプロバイダーペイロードを引き続き上書きできます。

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI Plugin は画像理解を登録します。

    | プロパティ | 値          |
    | ---------- | ----------- |
    | モデル     | `glm-4.6v`  |

    画像理解は、設定済みの Z.AI 認証から自動解決されます。追加の設定は不要です。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI は API キーによる Bearer 認証を使用します。
    - `zai-api-key` オンボーディング選択は、キーを使ってサポートされているエンドポイントをプローブし、一致する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的な地域選択（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）を使用してください。
    - レガシー環境変数 `Z_AI_API_KEY` は引き続き受け入れられます。`ZAI_API_KEY` が未設定の場合、OpenClaw は起動時にそれを `ZAI_API_KEY` にコピーします。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーとモデル設定を含む、完全な OpenClaw 設定スキーマ。
  </Card>
</CardGroup>
