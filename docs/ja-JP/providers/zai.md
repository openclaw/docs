---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使いたい場合
    - シンプルな ZAI_API_KEY のセットアップが必要です
summary: OpenClawでZ.AI（GLMモデル）を使用する
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T05:04:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、認証には API キーを使用します。Z.AI コンソールで API キーを作成してください。OpenClaw は Z.AI API キーとともに `zai` プロバイダーを使用します。

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer 認証)

## はじめに

<Tabs>
  <Tab title="エンドポイントの自動検出">
    **最適な用途:** ほとんどのユーザー。OpenClaw はキーから一致する Z.AI エンドポイントを検出し、正しいベース URL を自動的に適用します。

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
      <Step title="モデルが一覧に表示されることを確認する">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明示的なリージョンエンドポイント">
    **最適な用途:** 特定の Coding Plan または汎用 API サーフェスを強制したいユーザー。

    <Steps>
      <Step title="適切なオンボーディングの選択肢を選ぶ">
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
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
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

## 組み込みカタログ

OpenClaw はバンドルされた `zai` プロバイダーカタログを Plugin マニフェストで同梱しているため、読み取り専用の一覧表示ではプロバイダーランタイムを読み込まずに既知の GLM 行を表示できます。

```bash
openclaw models list --all --provider zai
```

マニフェストに基づくカタログには現在、次が含まれます。

| モデル参照         | 注記             |
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
GLM モデルは `zai/<model>` として利用できます (例: `zai/glm-5`)。デフォルトのバンドルモデル参照は `zai/glm-5.1` です。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="未知の GLM-5 モデルの前方解決">
    未知の `glm-5*` ID も、その ID が現在の GLM-5 ファミリーの形状に一致する場合、`glm-4.7` テンプレートからプロバイダー所有のメタデータを合成することで、バンドルされたプロバイダーパス上で引き続き前方解決されます。
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

  <Accordion title="Thinking と保持された thinking">
    Z.AI thinking は OpenClaw の `/think` コントロールに従います。thinking がオフの場合、OpenClaw は、表示テキストの前に `reasoning_content` で出力予算を消費する応答を避けるために、`thinking: { type: "disabled" }` を送信します。

    保持された thinking はオプトインです。これは、Z.AI が完全な履歴 `reasoning_content` の再生を必要とし、プロンプトトークンが増えるためです。モデルごとに有効化します。

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

    有効化され、thinking がオンの場合、OpenClaw は `thinking: { type: "enabled", clear_thinking: false }` を送信し、同じ OpenAI 互換トランスクリプトについて以前の `reasoning_content` を再生します。

    上級ユーザーは、`params.extra_body.thinking` で正確なプロバイダーペイロードを引き続き上書きできます。

  </Accordion>

  <Accordion title="画像理解">
    バンドルされた Z.AI Plugin は画像理解を登録します。

    | プロパティ    | 値          |
    | ------------- | ----------- |
    | モデル        | `glm-4.6v`  |

    画像理解は、設定済みの Z.AI 認証から自動解決されます。追加設定は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API キーによる Bearer 認証を使用します。
    - `zai-api-key` オンボーディングの選択肢は、キーのプレフィックスから一致する Z.AI エンドポイントを自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的なリージョン選択肢 (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) を使用します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="GLM モデルファミリー" href="/ja-JP/providers/glm" icon="microchip">
    GLM のモデルファミリー概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
