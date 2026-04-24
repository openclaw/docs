---
read_when:
    - OpenClaw で Z.AI / GLM モデルを使いたい場合
    - シンプルな `ZAI_API_KEY` セットアップが必要な場合
summary: OpenClaw で Z.AI（GLM モデル）を使う
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T05:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI は **GLM** モデル向けの API プラットフォームです。GLM 用の REST API を提供し、認証には API key
を使います。Z.AI コンソールで API key を作成してください。OpenClaw は `zai` provider
と Z.AI API key を使います。

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions（Bearer auth）

## はじめに

<Tabs>
  <Tab title="endpoint 自動検出">
    **最適な用途:** ほとんどのユーザー。OpenClaw は key から一致する Z.AI endpoint を検出し、正しい base URL を自動適用します。

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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明示的なリージョナル endpoint">
    **最適な用途:** 特定の Coding Plan または一般 API サーフェスを強制したいユーザー。

    <Steps>
      <Step title="正しいオンボーディング choice を選ぶ">
        ```bash
        # Coding Plan Global（Coding Plan ユーザーに推奨）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（China region）
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN（China region）
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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 組み込みカタログ

OpenClaw は現在、同梱の `zai` provider に次を初期投入しています。

| Model ref | 注記 |
| -------------------- | ------------- |
| `zai/glm-5.1` | デフォルトモデル |
| `zai/glm-5` | |
| `zai/glm-5-turbo` | |
| `zai/glm-5v-turbo` | |
| `zai/glm-4.7` | |
| `zai/glm-4.7-flash` | |
| `zai/glm-4.7-flashx` | |
| `zai/glm-4.6` | |
| `zai/glm-4.6v` | |
| `zai/glm-4.5` | |
| `zai/glm-4.5-air` | |
| `zai/glm-4.5-flash` | |
| `zai/glm-4.5v` | |

<Tip>
GLM モデルは `zai/<model>` として利用できます（例: `zai/glm-5`）。同梱のデフォルト model ref は `zai/glm-5.1` です。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="未知の GLM-5 モデルの forward-resolving">
    未知の `glm-5*` id も、id が
    現在の GLM-5 ファミリー形状に一致する場合、`glm-4.7` テンプレートから provider 所有メタデータを合成することで、同梱 provider パス上で forward-resolve されます。
  </Accordion>

  <Accordion title="tool-call ストリーミング">
    Z.AI の tool-call ストリーミングでは、`tool_stream` がデフォルトで有効です。無効にするには:

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

  <Accordion title="画像理解">
    同梱の Z.AI Plugin は画像理解を登録します。

    | Property | 値 |
    | ------------- | ----------- |
    | Model | `glm-4.6v` |

    画像理解は、設定済みの Z.AI auth から自動解決されます。追加
    config は不要です。

  </Accordion>

  <Accordion title="認証の詳細">
    - Z.AI は API key を使った Bearer auth を使用します。
    - `zai-api-key` の onboarding choice は、key prefix から一致する Z.AI endpoint を自動検出します。
    - 特定の API サーフェスを強制したい場合は、明示的なリージョナル choice（`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`）を使ってください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="GLM model family" href="/ja-JP/providers/glm" icon="microchip">
    GLM のモデルファミリー概要。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
</CardGroup>
