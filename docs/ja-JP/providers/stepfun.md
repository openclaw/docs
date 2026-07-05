---
read_when:
    - OpenClaw で StepFun モデルを使いたい
    - StepFun のセットアップガイダンスが必要です
summary: OpenClaw で StepFun モデルを使用する
title: StepFun
x-i18n:
    generated_at: "2026-07-05T11:46:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 172b7ad5c2cf7cac9a99e391d0454efa4611acedd378d92b2b7ca47511bc0e5e
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun は、2つのプロバイダー ID を持つ外部公式 Plugin（`@openclaw/stepfun-provider`）として提供されます:

- 標準エンドポイント用の `stepfun`
- Step Plan エンドポイント用の `stepfun-plan`

<Warning>
標準と Step Plan は、エンドポイントとモデル参照プレフィックス（`stepfun/...` と `stepfun-plan/...`）が異なる**別々のプロバイダー**です。`.com` エンドポイントには中国キーを、`.ai` エンドポイントにはグローバルキーを使用してください。
</Warning>

## Plugin をインストール

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## リージョンとエンドポイントの概要

| エンドポイント | 中国（`.com`）                         | グローバル（`.ai`）                  |
| --------- | -------------------------------------- | ------------------------------------- |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

認証環境変数: `STEPFUN_API_KEY`

## 組み込みカタログ

標準（`stepfun`）:

| モデル参照               | コンテキスト | 最大出力 | 備考                   |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | デフォルトの標準モデル |

Step Plan（`stepfun-plan`）:

| モデル参照                         | コンテキスト | 最大出力 | 備考                          |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | デフォルトの Step Plan モデル |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 追加の Step Plan モデル        |

## はじめに

<Tabs>
  <Tab title="標準">
    標準の StepFun エンドポイント経由の汎用用途に最適です。

    <Steps>
      <Step title="エンドポイントのリージョンを選択">
        | 認証の選択                    | エンドポイント                | リージョン |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | 国際 |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | 中国 |
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        中国エンドポイント:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替手段">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    デフォルトモデル: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    Step Plan 推論エンドポイントに最適です。

    <Steps>
      <Step title="エンドポイントのリージョンを選択">
        | 認証の選択                 | エンドポイント                           | リージョン |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | 国際 |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | 中国 |
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        中国エンドポイント:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替手段">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    デフォルトモデル: `stepfun-plan/step-3.5-flash`
    代替モデル: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

単一の認証フローで、`stepfun` と `stepfun-plan` の両方に対してリージョンが一致したプロファイルが書き込まれるため、1回のオンボーディング実行後に両方のサーフェスがまとめて検出されます。

## 高度な設定

<AccordionGroup>
  <Accordion title="完全な設定: 標準プロバイダー">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="完全な設定: Step Plan プロバイダー">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="注記">
    - `step-3.5-flash-2603` は現在 `stepfun-plan` でのみ公開されています。
    - モデルを確認または切り替えるには、`openclaw models list` と `openclaw models set <provider/model>` を使用してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、Plugin の完全な設定スキーマ。
  </Card>
  <Card title="モデル CLI" href="/ja-JP/concepts/models" icon="brain">
    モデルの選択と設定方法。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API キー管理とドキュメント。
  </Card>
</CardGroup>
