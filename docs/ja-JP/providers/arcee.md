---
read_when:
    - OpenClaw で Arcee AI を使いたい場合
    - API キー環境変数または CLI 認証の選択が必要な場合
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T05:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) は、OpenAI 互換 API を通じて Trinity ファミリーの mixture-of-experts モデルへのアクセスを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。

Arcee AI モデルは、Arcee プラットフォーム経由で直接利用することも、[OpenRouter](/ja-JP/providers/openrouter) 経由で利用することもできます。

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter 経由）                   |
| API      | OpenAI 互換                                                                     |
| Base URL | `https://api.arcee.ai/api/v1`（直接）または `https://openrouter.ai/api/v1`（OpenRouter） |

## はじめに

<Tabs>
  <Tab title="Direct（Arcee プラットフォーム）">
    <Steps>
      <Step title="API キーを取得する">
        [Arcee AI](https://chat.arcee.ai/) で API キーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="OpenRouter 経由">
    <Steps>
      <Step title="API キーを取得する">
        [OpenRouter](https://openrouter.ai/keys) で API キーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        同じモデル参照が直接セットアップと OpenRouter セットアップの両方で使えます（たとえば `arcee/trinity-large-thinking`）。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非対話セットアップ

<Tabs>
  <Tab title="Direct（Arcee プラットフォーム）">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter 経由">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 組み込みカタログ

OpenClaw には現在、このバンドル済み Arcee カタログが含まれています。

| Model ref                      | Name                   | Input | Context | Cost（入力/出力、100 万あたり） | Notes                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | デフォルトモデル。reasoning 有効          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 汎用。400B params、13B active  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 高速かつ低コスト。function calling 対応 |

<Tip>
オンボーディングのプリセットは、デフォルトモデルとして `arcee/trinity-large-thinking` を設定します。
</Tip>

## サポートされる機能

| Feature                                       | Supported                    |
| --------------------------------------------- | ---------------------------- |
| ストリーミング                                     | はい                          |
| ツール使用 / function calling                   | はい                          |
| 構造化出力（JSON mode と JSON schema） | はい                          |
| 拡張 thinking                             | はい（Trinity Large Thinking） |

<AccordionGroup>
  <Accordion title="環境に関する注意">
    Gateway がデーモン（launchd/systemd）として動作している場合、`ARCEEAI_API_KEY`
    （または `OPENROUTER_API_KEY`）がそのプロセスから利用可能であることを確認してください（たとえば
    `~/.openclaw/.env` または `env.shellEnv` 内）。
  </Accordion>

  <Accordion title="OpenRouter ルーティング">
    OpenRouter 経由で Arcee モデルを使う場合も、同じ `arcee/*` モデル参照が適用されます。
    OpenClaw は認証選択に基づいて透過的にルーティングを処理します。OpenRouter 固有の
    設定詳細については、[OpenRouter provider docs](/ja-JP/providers/openrouter) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    単一の API キーで Arcee モデルや他の多くのモデルにアクセスします。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
</CardGroup>
