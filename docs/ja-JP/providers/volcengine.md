---
read_when:
    - OpenClaw で Volcano Engine または Doubao model を使いたい場合
    - Volcengine API key の設定が必要です
summary: Volcano Engine のセットアップ（Doubao model、general + coding endpoint）
title: Volcengine（Doubao）
x-i18n:
    generated_at: "2026-04-23T14:09:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine（Doubao）

Volcengine provider は、Volcano Engine でホストされる Doubao model とサードパーティ model へのアクセスを提供し、general ワークロード用と coding
ワークロード用に別々の endpoint を持ちます。

| 詳細      | 値                                                  |
| --------- | --------------------------------------------------- |
| Providers | `volcengine`（general）+ `volcengine-plan`（coding） |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | OpenAI 互換                                         |

## はじめに

<Steps>
  <Step title="API key を設定する">
    対話型オンボーディングを実行します:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    これにより、1 つの API key から general（`volcengine`）と coding（`volcengine-plan`）の両 provider が登録されます。

  </Step>
  <Step title="デフォルト model を設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="model が利用可能であることを確認する">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
非対話型セットアップ（CI、scripting）では、key を直接渡してください:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers と endpoints

| Provider          | Endpoint                                  | 用途             |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | general model    |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | coding model     |

<Note>
両 provider は 1 つの API key から設定されます。セットアップでは両方が自動的に登録されます。
</Note>

## 利用可能な model

<Tabs>
  <Tab title="General (volcengine)">
    | Model ref                                    | 名前                            | 入力        | コンテキスト |
    | -------------------------------------------- | ------------------------------- | ----------- | ------------ |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000      |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000      |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000      |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000      |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000      |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | 名前                     | 入力  | コンテキスト |
    | ------------------------------------------------- | ------------------------ | ----- | ------------ |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000      |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000      |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000      |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000      |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000      |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000      |
  </Tab>
</Tabs>

## 詳細メモ

<AccordionGroup>
  <Accordion title="オンボーディング後のデフォルト model">
    `openclaw onboard --auth-choice volcengine-api-key` は現在、
    general の `volcengine` catalog も登録しつつ、
    `volcengine-plan/ark-code-latest` をデフォルト model として設定します。
  </Accordion>

  <Accordion title="model picker の fallback 動作">
    オンボーディング/設定時の model 選択では、Volcengine の auth choice は
    `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。それらの model が
    まだ読み込まれていない場合、OpenClaw は空の
    provider スコープ picker を表示する代わりに、filter なしの catalog にフォールバックします。
  </Accordion>

  <Accordion title="daemon process 用の環境変数">
    Gateway を daemon（launchd/systemd）として実行している場合は、
    `VOLCANO_ENGINE_API_KEY` がその process から利用可能であることを確認してください（たとえば、
    `~/.openclaw/.env` または `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw をバックグラウンド service として実行する場合、
対話 shell に設定した環境変数は自動では引き継がれません。上記の daemon の注記を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、および failover 動作の選び方。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    agents、models、および providers の完全な config リファレンス。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
