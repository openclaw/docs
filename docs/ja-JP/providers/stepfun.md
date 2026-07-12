---
read_when:
    - OpenClaw で StepFun モデルを使用したい場合
    - StepFun のセットアップ手順が必要です
summary: OpenClaw で StepFun モデルを使用する
title: StepFun
x-i18n:
    generated_at: "2026-07-11T22:37:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun は、2 つのプロバイダー ID を持つ外部公式 Plugin（`@openclaw/stepfun-provider`）として提供されます。

- 標準エンドポイント用の `stepfun`
- Step Plan エンドポイント用の `stepfun-plan`

<Warning>
標準と Step Plan は、エンドポイントとモデル参照プレフィックス（`stepfun/...` と `stepfun-plan/...`）が異なる**別々のプロバイダー**です。`.com` エンドポイントには中国向けキーを、`.ai` エンドポイントにはグローバル向けキーを使用してください。
</Warning>

## Plugin のインストール

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## リージョンとエンドポイントの概要

| エンドポイント | 中国（`.com`）                         | グローバル（`.ai`）                  |
| -------------- | -------------------------------------- | ------------------------------------- |
| 標準           | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan      | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

認証環境変数: `STEPFUN_API_KEY`

## 組み込みカタログ

標準（`stepfun`）:

| モデル参照               | コンテキスト | 最大出力 | 備考                           |
| ------------------------ | ------------ | -------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144      | 65,536   | デフォルトの標準モデル         |
| `stepfun/step-3.7-flash` | 262,144      | 262,144  | マルチモーダル画像入力に対応   |

Step Plan（`stepfun-plan`）:

| モデル参照                         | コンテキスト | 最大出力 | 備考                             |
| ---------------------------------- | ------------ | -------- | -------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144      | 65,536   | デフォルトの Step Plan モデル    |
| `stepfun-plan/step-3.7-flash`      | 262,144      | 262,144  | マルチモーダル画像入力に対応     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144      | 65,536   | 追加の Step Plan モデル          |

## はじめに

<Tabs>
  <Tab title="標準">
    標準の StepFun エンドポイントを介した汎用的な利用に最適です。

    <Steps>
      <Step title="エンドポイントのリージョンを選択">
        | 認証の選択                     | エンドポイント                | リージョン |
        | ------------------------------ | ----------------------------- | ---------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | 国際       |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | 中国       |
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        中国向けエンドポイント:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替手順">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    デフォルトモデル: `stepfun/step-3.5-flash`
    代替モデル: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Step Plan 推論エンドポイントに最適です。

    <Steps>
      <Step title="エンドポイントのリージョンを選択">
        | 認証の選択                  | エンドポイント                           | リージョン |
        | --------------------------- | ---------------------------------------- | ---------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | 国際       |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | 中国       |
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        中国向けエンドポイント:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替手順">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    デフォルトモデル: `stepfun-plan/step-3.5-flash`
    代替モデル: `stepfun-plan/step-3.7-flash`、`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

1 回の認証フローで `stepfun` と `stepfun-plan` の両方にリージョンが一致するプロファイルが書き込まれるため、オンボーディングを 1 回実行すると、両方のインターフェースがまとめて検出されます。

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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash` は OpenClaw を介したテキスト入力と画像入力を受け付けます。StepFun の API は動画にも対応していますが、OpenClaw ではまだモデル入力モダリティとして対応していません。
    - Step 3.7 は `low`、`medium`、`high` の推論強度に対応しています。このモデルには推論を行わないモードがないため、`/think off` は `low` にマッピングされます。
    - `step-3.5-flash-2603` は現在 `stepfun-plan` でのみ公開されています。
    - モデルを確認または切り替えるには、`openclaw models list` と `openclaw models set <provider/model>` を使用します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要です。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、Plugin の完全な設定スキーマです。
  </Card>
  <Card title="モデル CLI" href="/ja-JP/concepts/models" icon="brain">
    モデルを選択して設定する方法です。
  </Card>
  <Card title="StepFun プラットフォーム" href="https://platform.stepfun.com" icon="globe">
    StepFun API キーの管理とドキュメントです。
  </Card>
</CardGroup>
