---
read_when:
    - OpenClaw で Volcano Engine または Doubao モデルを使いたい場合
    - Volcengine API キーのセットアップが必要な場合
summary: Volcano Engine のセットアップ（Doubao モデル、一般用途 + コーディング endpoint）
title: Volcengine（Doubao）
x-i18n:
    generated_at: "2026-04-24T05:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Volcengine provider は、Doubao モデルと
Volcano Engine 上でホストされるサードパーティモデルへのアクセスを提供し、一般用途とコーディング
ワークロード向けに別々の endpoint を持ちます。

| Detail    | Value                                               |
| --------- | --------------------------------------------------- |
| Providers | `volcengine`（一般用途）+ `volcengine-plan`（コーディング） |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | OpenAI 互換                                   |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話型オンボーディングを実行します。

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    これにより、1 つの API キーから一般用途 (`volcengine`) とコーディング (`volcengine-plan`) の両方の provider が登録されます。

  </Step>
  <Step title="デフォルトモデルを設定する">
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
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
非対話セットアップ（CI、スクリプト）では、キーを直接渡してください:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers と endpoints

| Provider          | Endpoint                                  | 用途       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 一般用途モデル |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | コーディングモデル  |

<Note>
両 provider は 1 つの API キーから設定されます。セットアップ時に両方が自動登録されます。
</Note>

## 組み込みカタログ

<Tabs>
  <Tab title="General（volcengine）">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Coding（volcengine-plan）">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## 高度な設定

<AccordionGroup>
  <Accordion title="オンボーディング後のデフォルトモデル">
    `openclaw onboard --auth-choice volcengine-api-key` は現在、
    デフォルトモデルとして `volcengine-plan/ark-code-latest` を設定しつつ、
    一般用途の `volcengine` カタログも登録します。
  </Accordion>

  <Accordion title="モデル picker のフォールバック動作">
    オンボーディング/設定時のモデル選択では、Volcengine の auth choice は
    `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルが
    まだロードされていない場合、OpenClaw は空の provider スコープ picker を表示する代わりに
    フィルタなしカタログへフォールバックします。
  </Accordion>

  <Accordion title="デーモンプロセス用の環境変数">
    Gateway がデーモン（launchd/systemd）として動作している場合は、
    `VOLCANO_ENGINE_API_KEY` がそのプロセスで利用可能であることを確認してください（たとえば
    `~/.openclaw/.env` または `env.shellEnv` 内）。
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw をバックグラウンドサービスとして実行する場合、対話シェルで設定した環境変数は
自動では継承されません。上記のデーモンに関する注意を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    エージェント、モデル、provider の完全な config リファレンス。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
