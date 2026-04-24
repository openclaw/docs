---
read_when:
    - OpenClawでStepFunモデルを使いたい
    - StepFunのセットアップガイダンスが必要です
summary: OpenClawでStepFunモデルを使う
title: StepFun
x-i18n:
    generated_at: "2026-04-24T05:16:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClawには、2つのprovider idを持つバンドル済みStepFunプロバイダPluginが含まれています:

- 標準endpoint用の `stepfun`
- Step Plan endpoint用の `stepfun-plan`

<Warning>
StandardとStep Planは、**異なるendpointと異なるモデルref prefix（`stepfun/...` と `stepfun-plan/...`）を持つ別々のプロバイダ**です。China keyには `.com` endpointを使い、global keyには `.ai` endpointを使ってください。
</Warning>

## リージョンとendpointの概要

| Endpoint | China (`.com`) | Global (`.ai`) |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard | `https://api.stepfun.com/v1` | `https://api.stepfun.ai/v1` |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

認証用env var: `STEPFUN_API_KEY`

## 組み込みcatalog

Standard（`stepfun`）:

| モデルref | Context | 最大出力 | 注記 |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536 | デフォルトのstandardモデル |

Step Plan（`stepfun-plan`）:

| モデルref | Context | 最大出力 | 注記 |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash` | 262,144 | 65,536 | デフォルトのStep Planモデル |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536 | 追加のStep Planモデル |

## はじめに

使いたいproviderサーフェスを選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Standard">
    **最適な用途:** 標準StepFun endpoint経由の汎用利用。

    <Steps>
      <Step title="endpointリージョンを選ぶ">
        | 認証選択 | Endpoint | リージョン |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1` | International |
        | `stepfun-standard-api-key-cn` | `https://api.stepfun.com/v1` | China |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        またはChina endpoint用には:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### モデルref

    - デフォルトモデル: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最適な用途:** Step Plan reasoning endpoint。

    <Steps>
      <Step title="endpointリージョンを選ぶ">
        | 認証選択 | Endpoint | リージョン |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1` | International |
        | `stepfun-plan-api-key-cn` | `https://api.stepfun.com/step_plan/v1` | China |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        またはChina endpoint用には:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非対話型の代替">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### モデルref

    - デフォルトモデル: `stepfun-plan/step-3.5-flash`
    - 代替モデル: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 高度な設定

<AccordionGroup>
  <Accordion title="完全設定: Standardプロバイダ">
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

  <Accordion title="完全設定: Step Planプロバイダ">
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
    - このプロバイダはOpenClawにバンドルされているため、別途Pluginインストール手順はありません。
    - `step-3.5-flash-2603` は現在 `stepfun-plan` でのみ公開されています。
    - 単一の認証フローが、`stepfun` と `stepfun-plan` の両方に対してリージョン一致のprofileを書き込むため、両方のサーフェスを一緒に検出できます。
    - モデルを確認または切り替えるには `openclaw models list` と `openclaw models set <provider/model>` を使ってください。
  </Accordion>
</AccordionGroup>

<Note>
より広いプロバイダ概要については [モデルプロバイダ](/ja-JP/concepts/model-providers) を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダ、モデルref、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダ、モデル、Plugin向けの完全なconfig schema。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API key管理とドキュメント。
  </Card>
</CardGroup>
