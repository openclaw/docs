---
read_when:
    - OpenClawでZ.AI / GLMモデルを使いたい場合
    - 簡単な ZAI_API_KEY の設定が必要です
summary: OpenClaw で Z.AI (GLM モデル) を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI は **GLM** モデル用の API プラットフォームです。GLM 向けの REST API を提供し、認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。OpenClaw は Z.AI API キーとともに `zai` provider を使用します。

- Provider: `zai`
- 認証: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer 認証)

## はじめに

<Tabs>
  <Tab title="エンドポイントの自動検出">
    **最適な用途:** ほとんどのユーザー。OpenClaw はキーから対応する Z.AI エンドポイントを検出し、正しいベース URL を自動的に適用します。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明示的なリージョンエンドポイント">
    **最適な用途:** 特定の Coding Plan または一般 API サーフェスを強制したいユーザー。

    <Steps>
      <Step title="適切なオンボーディングの選択肢を選ぶ">
        ```bash
        # Coding Plan Global (Coding Plan ユーザーに推奨)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (中国リージョン)
        openclaw onboard --auth-choice zai-coding-cn

        # 一般 API
        openclaw onboard --auth-choice zai-global

        # 一般 API CN (中国リージョン)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 組み込みカタログ

OpenClaw は現在、バンドルされた `zai` provider に次をシードします。

| モデル参照             | 注記             |
| -------------------- | ------------- |
| `zai/glm-5.1`        | デフォルトモデル |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
GLM モデルは `zai/<model>` として利用できます (例: `zai/glm-5`)。デフォルトのバンドル済みモデル参照は `zai/glm-5.1` です。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="未知の GLM-5 モデルの前方解決">
    未知の `glm-5*` ID は、その ID が現在の GLM-5 ファミリーの形状に一致する場合、`glm-4.7` テンプレートから provider 所有のメタデータを合成することで、バンドルされた provider パス上で引き続き前方解決されます。
  </Accordion>

  <Accordion title="ツール呼び出しストリーミング">
    Z.AI のツール呼び出しストリーミングでは、`tool_stream` がデフォルトで有効です。無効にするには、次のようにします。

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

  <Accordion title="思考と保持される思考">
    Z.AI の思考は OpenClaw の `/think` コントロールに従います。思考がオフの場合、OpenClaw は `thinking: { type: "disabled" }` を送信し、可視テキストの前に `reasoning_content` で出力予算を消費する応答を避けます。

    保持される思考はオプトインです。これは Z.AI が完全な履歴 `reasoning_content` の再生を要求し、プロンプトトークンが増えるためです。モデルごとに有効化します。

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

    有効化され、思考がオンの場合、OpenClaw は `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI 互換トランスクリプトに対して以前の `reasoning_content` を再生します。

    上級ユーザーは、引き続き `params.extra_body.thinking` で正確な provider ペイロードを上書きできます。

  </Accordion>

  <Accordion title="画像理解">
    バンドルされた Z.AI Plugin は画像理解を登録します。

    | プロパティ      | 値          |
    | ------------- | ----------- |
    | モデル         | `glm-4.6v`  |

    画像理解は、設定された Z.AI 認証から自動解決されます。追加の設定は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API キーで Bearer 認証を使用します。
    - `zai-api-key` オンボーディングの選択肢は、キーのプレフィックスから対応する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的なリージョン選択肢 (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) を使用します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="GLM モデルファミリー" href="/ja-JP/providers/glm" icon="microchip">
    GLM のモデルファミリー概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
