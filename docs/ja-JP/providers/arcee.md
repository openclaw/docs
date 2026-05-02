---
read_when:
    - OpenClaw で Arcee AI を使用したい
    - API キーの環境変数または CLI 認証方法の選択が必要です
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) は、OpenAI 互換 API を通じて mixture-of-experts モデルの Trinity ファミリーへのアクセスを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。

Arcee AI モデルには、Arcee プラットフォームから直接、または [OpenRouter](/ja-JP/providers/openrouter) 経由でアクセスできます。

| プロパティ | 値                                                                                    |
| -------- | ------------------------------------------------------------------------------------- |
| プロバイダー | `arcee`                                                                               |
| 認証     | `ARCEEAI_API_KEY` (直接) または `OPENROUTER_API_KEY` (OpenRouter 経由)                   |
| API      | OpenAI 互換                                                                     |
| ベース URL | `https://api.arcee.ai/api/v1` (直接) または `https://openrouter.ai/api/v1` (OpenRouter) |

## はじめに

<Tabs>
  <Tab title="直接 (Arcee プラットフォーム)">
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

        同じモデル参照は、直接設定と OpenRouter 設定の両方で機能します (例: `arcee/trinity-large-thinking`)。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非対話型セットアップ

<Tabs>
  <Tab title="直接 (Arcee プラットフォーム)">
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

OpenClaw は現在、このバンドル済み Arcee カタログを同梱しています。

| モデル参照                      | 名前                   | 入力 | コンテキスト | コスト (100 万あたりの入力/出力) | メモ                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | デフォルトモデル。推論が有効。ツールなし |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 汎用。400B パラメーター、13B アクティブ   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 高速かつコスト効率が高い。関数呼び出し  |

<Tip>
オンボーディングプリセットは `arcee/trinity-large-thinking` をデフォルトモデルとして設定します。これは推論/テキスト専用で、ツール使用や関数呼び出しには対応していません。
</Tip>

## 対応機能

| 機能                                       | 対応                                   |
| --------------------------------------------- | ------------------------------------------- |
| ストリーミング                                     | はい                                         |
| ツール使用 / 関数呼び出し                   | モデル依存。Trinity Large Thinking は非対応 |
| 構造化出力 (JSON モードと JSON スキーマ) | はい                                         |
| 拡張思考                             | はい (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="環境に関する注意">
    Gateway がデーモン (launchd/systemd) として実行される場合は、`ARCEEAI_API_KEY`
    (または `OPENROUTER_API_KEY`) がそのプロセスで利用可能であることを確認してください (たとえば
    `~/.openclaw/.env` 内、または `env.shellEnv` 経由)。
  </Accordion>

  <Accordion title="OpenRouter ルーティング">
    OpenRouter 経由で Arcee モデルを使用する場合も、同じ `arcee/*` モデル参照が適用されます。
    OpenClaw は、認証の選択に基づいてルーティングを透過的に処理します。OpenRouter 固有の
    設定の詳細については、[OpenRouter プロバイダードキュメント](/ja-JP/providers/openrouter) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    単一の API キーで Arcee モデルやその他多数のモデルにアクセスできます。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
