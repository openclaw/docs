---
read_when:
    - OpenClaw で StepFun モデルを使いたい場合
    - StepFun のセットアップガイダンスが必要です
summary: OpenClawでStepFunモデルを使用する
title: StepFun
x-i18n:
    generated_at: "2026-04-30T05:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw には、2 つのプロバイダー ID を持つ StepFun プロバイダー Plugin がバンドルされています。

- 標準エンドポイント用の `stepfun`
- Step Plan エンドポイント用の `stepfun-plan`

<Warning>
標準と Step Plan は、エンドポイントとモデル参照プレフィックス（`stepfun/...` と `stepfun-plan/...`）が異なる**別々のプロバイダー**です。`.com` エンドポイントでは中国キーを使い、`.ai` エンドポイントではグローバルキーを使ってください。
</Warning>

## リージョンとエンドポイントの概要

| エンドポイント | 中国（`.com`）                         | グローバル（`.ai`）                    |
| --------- | -------------------------------------- | ------------------------------------- |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

認証環境変数: `STEPFUN_API_KEY`

## 組み込みカタログ

標準（`stepfun`）:

| モデル参照                | コンテキスト | 最大出力 | 備考                  |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | デフォルトの標準モデル |

Step Plan（`stepfun-plan`）:

| モデル参照                          | コンテキスト | 最大出力 | 備考                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | デフォルトの Step Plan モデル |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 追加の Step Plan モデル |

## はじめに

プロバイダーサーフェスを選択し、セットアップ手順に従います。

<Tabs>
  <Tab title="標準">
    **最適な用途:** 標準 StepFun エンドポイントを介した汎用利用。

    <Steps>
      <Step title="エンドポイントリージョンを選択する">
        | 認証選択                      | エンドポイント                         | リージョン        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 国際 |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 中国         |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        または中国エンドポイントの場合:

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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### モデル参照

    - デフォルトモデル: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最適な用途:** Step Plan 推論エンドポイント。

    <Steps>
      <Step title="エンドポイントリージョンを選択する">
        | 認証選択                  | エンドポイント                                | リージョン        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 国際 |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 中国         |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        または中国エンドポイントの場合:

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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### モデル参照

    - デフォルトモデル: `stepfun-plan/step-3.5-flash`
    - 代替モデル: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

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

  <Accordion title="備考">
    - プロバイダーは OpenClaw にバンドルされているため、別途 Plugin をインストールする手順はありません。
    - `step-3.5-flash-2603` は現在 `stepfun-plan` でのみ公開されています。
    - 単一の認証フローが `stepfun` と `stepfun-plan` の両方にリージョン一致のプロファイルを書き込むため、両方のサーフェスをまとめて検出できます。
    - モデルを確認または切り替えるには、`openclaw models list` と `openclaw models set <provider/model>` を使います。

  </Accordion>
</AccordionGroup>

<Note>
より広範なプロバイダー概要については、[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、plugins の完全な設定スキーマ。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルを選択して設定する方法。
  </Card>
  <Card title="StepFun プラットフォーム" href="https://platform.stepfun.com" icon="globe">
    StepFun API キー管理とドキュメント。
  </Card>
</CardGroup>
