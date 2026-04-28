---
read_when:
    - OpenClawでZ.AI / GLM modelsを使いたい場合
    - シンプルな `ZAI_API_KEY` セットアップが必要な場合
summary: OpenClawでZ.AI（GLM models）を使う
title: Z.AI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。OpenClaw は Z.AI の API キーとともに `zai` provider を使用します。

- Provider: `zai`
- 認証: `ZAI_API_KEY`
- API: Z.AI Chat Completions（Bearer auth）

## はじめに

<Tabs>
  <Tab title="エンドポイントを自動検出">
    **最適な対象:** ほとんどのユーザー。OpenClaw はキーから一致する Z.AI エンドポイントを検出し、正しいベース URL を自動的に適用します。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明示的なリージョナルエンドポイント">
    **最適な対象:** 特定の Coding Plan または一般 API サーフェスを強制的に使用したいユーザー。

    <Steps>
      <Step title="適切なオンボーディング選択肢を選ぶ">
        ```bash
        # Coding Plan Global（Coding Plan ユーザー向けの推奨）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中国リージョン）
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN（中国リージョン）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 組み込みカタログ

OpenClaw は現在、バンドルされた `zai` provider に以下をシードしています。

| Model ref            | 注記         |
| -------------------- | ------------ |
| `zai/glm-5.1`        | デフォルトモデル |
| `zai/glm-5`          |              |
| `zai/glm-5-turbo`    |              |
| `zai/glm-5v-turbo`   |              |
| `zai/glm-4.7`        |              |
| `zai/glm-4.7-flash`  |              |
| `zai/glm-4.7-flashx` |              |
| `zai/glm-4.6`        |              |
| `zai/glm-4.6v`       |              |
| `zai/glm-4.5`        |              |
| `zai/glm-4.5-air`    |              |
| `zai/glm-4.5-flash`  |              |
| `zai/glm-4.5v`       |              |

<Tip>
GLM モデルは `zai/<model>` として利用できます（例: `zai/glm-5`）。デフォルトのバンドル済み Model ref は `zai/glm-5.1` です。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="未知の GLM-5 モデルの前方解決">
    未知の `glm-5*` id でも、id が現在の GLM-5 ファミリーの形状に一致する場合は、`glm-4.7` テンプレートから provider 所有のメタデータを合成することで、バンドルされた provider パス上で前方解決されます。
  </Accordion>

  <Accordion title="ツール呼び出しストリーミング">
    Z.AI のツール呼び出しストリーミングでは、`tool_stream` がデフォルトで有効になっています。無効にするには、次のようにします。

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

  <Accordion title="Thinking と preserved thinking">
    Z.AI の thinking は OpenClaw の `/think` 制御に従います。thinking がオフの場合、OpenClaw は、可視テキストより前に `reasoning_content` で出力予算が消費される応答を避けるために、`thinking: { type: "disabled" }` を送信します。

    preserved thinking は、Z.AI では履歴上の完全な `reasoning_content` を再送する必要があり、その結果プロンプトトークンが増えるため、オプトインです。モデルごとに有効化します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    有効化されていて thinking がオンの場合、OpenClaw は `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI-compatible transcript に対して以前の `reasoning_content` を再送します。

    高度なユーザーは、`params.extra_body.thinking` を使って正確な provider ペイロードを引き続き上書きできます。

  </Accordion>

  <Accordion title="画像理解">
    バンドルされた Z.AI Plugin は画像理解を登録します。

    | Property      | Value       |
    | ------------- | ----------- |
    | モデル        | `glm-4.6v`  |

    画像理解は、設定済みの Z.AI 認証から自動的に解決されるため、追加設定は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API キーを使った Bearer auth を使用します。
    - `zai-api-key` のオンボーディング選択肢は、キーの接頭辞から一致する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的なリージョン選択肢（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="GLM モデルファミリー" href="/ja-JP/providers/glm" icon="microchip">
    GLM のモデルファミリー概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、Model ref、フェイルオーバー動作の選び方。
  </Card>
</CardGroup>
