---
read_when:
    - OpenClaw で Arcee AI を使用する場合
    - API キーの環境変数または CLI 認証方式の選択が必要です
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-07-11T22:36:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) は、OpenAI 互換 API を通じて、エキスパート混合モデルの Trinity ファミリーを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。Arcee は OpenClaw の公式 Plugin ですが、コアには同梱されていないため、オンボーディングの前にインストールが必要です。

Arcee モデルには、Arcee プラットフォームから直接、または [OpenRouter](/ja-JP/providers/openrouter) 経由でアクセスできます。

| プロパティ | 値                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------ |
| プロバイダー | `arcee`                                                                                  |
| 認証       | `ARCEEAI_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter 経由）                    |
| API        | OpenAI 互換                                                                                |
| ベース URL | `https://api.arcee.ai/api/v1`（直接）または `https://openrouter.ai/api/v1`（OpenRouter）   |

## Plugin のインストール

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## はじめに

<Tabs>
  <Tab title="直接（Arcee プラットフォーム）">
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

        直接接続と OpenRouter のどちらの設定でも、同じモデル参照を使用できます。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非対話型セットアップ

<Tabs>
  <Tab title="直接（Arcee プラットフォーム）">
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

| モデル参照                     | 名前                   | 入力     | コンテキスト | 最大出力 | コスト（100万トークンあたりの入出力） | ツール | 備考                                      |
| ------------------------------ | ---------------------- | -------- | ------------ | -------- | --------------------------------------- | ------ | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | テキスト | 256K         | 80K      | $0.25 / $0.90                           | いいえ | デフォルトモデル、拡張思考                |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | テキスト | 128K         | 16K      | $0.25 / $1.00                           | はい   | 汎用、400B パラメーター、13B がアクティブ |
| `arcee/trinity-mini`           | Trinity Mini 26B       | テキスト | 128K         | 80K      | $0.045 / $0.15                          | はい   | 高速かつコスト効率に優れ、関数呼び出しに対応 |

<Tip>
オンボーディングのプリセットでは、`arcee/trinity-large-thinking` がデフォルトモデルとして設定されます。
</Tip>

## 対応機能

| 機能                                          | 対応状況                                            |
| --------------------------------------------- | --------------------------------------------------- |
| ストリーミング                                | はい                                                |
| ツール使用 / 関数呼び出し                    | はい（Trinity Mini、Trinity Large Preview）         |
| 構造化出力（JSON モードおよび JSON スキーマ） | はい                                                |
| 拡張思考                                      | はい（Trinity Large Thinking、ツールは無効）        |

<AccordionGroup>
  <Accordion title="環境に関する注意">
    Gateway がデーモン（launchd/systemd）として実行される場合は、`ARCEEAI_API_KEY`
    （または `OPENROUTER_API_KEY`）をそのプロセスから利用できるようにしてください。たとえば、
    `~/.openclaw/.env` または `env.shellEnv` を使用します。
  </Accordion>

  <Accordion title="OpenRouter のルーティング">
    OpenRouter 経由で Arcee モデルを使用する場合も、同じ `arcee/*` モデル参照を使用します。
    OpenClaw は選択した認証方式に基づいて透過的にルーティングします。OpenRouter 固有の
    設定の詳細については、[OpenRouter プロバイダーのドキュメント](/ja-JP/providers/openrouter)を
    参照してください。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    1 つの API キーで Arcee モデルをはじめとする多数のモデルにアクセスできます。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択について説明します。
  </Card>
</CardGroup>
