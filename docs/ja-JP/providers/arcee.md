---
read_when:
    - OpenClaw で Arcee AI を使用する
    - API キーの環境変数または CLI 認証の選択が必要です
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-07-05T11:38:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) は、OpenAI互換APIを通じて mixture-of-experts モデルの Trinity ファミリーを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。Arcee は公式の OpenClaw Pluginであり、coreにはバンドルされていないため、オンボーディングの前にインストール手順が必要です。

Arcee モデルには、Arcee プラットフォームから直接アクセスするか、[OpenRouter](/ja-JP/providers/openrouter) 経由でアクセスできます。

| プロパティ | 値                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| プロバイダー | `arcee`                                                                               |
| 認証     | `ARCEEAI_API_KEY` (直接) または `OPENROUTER_API_KEY` (OpenRouter経由)                   |
| API      | OpenAI互換                                                                     |
| ベースURL | `https://api.arcee.ai/api/v1` (直接) または `https://openrouter.ai/api/v1` (OpenRouter) |

## Pluginをインストール

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## はじめに

<Tabs>
  <Tab title="直接 (Arcee プラットフォーム)">
    <Steps>
      <Step title="APIキーを取得">
        [Arcee AI](https://chat.arcee.ai/) でAPIキーを作成します。
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
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

  <Tab title="OpenRouter経由">
    <Steps>
      <Step title="APIキーを取得">
        [OpenRouter](https://openrouter.ai/keys) でAPIキーを作成します。
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        同じモデルrefは、直接設定とOpenRouter設定の両方で動作します。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非対話セットアップ

<Tabs>
  <Tab title="直接 (Arcee プラットフォーム)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter経由">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 組み込みカタログ

| モデルref                      | 名前                   | 入力 | コンテキスト | 最大出力 | コスト (100万あたりの入力/出力) | ツール | 注記                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | テキスト  | 256K    | 80K        | $0.25 / $0.90        | いいえ    | デフォルトモデル、拡張思考          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | テキスト  | 128K    | 16K        | $0.25 / $1.00        | はい   | 汎用、400Bパラメーター、13Bアクティブ  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | テキスト  | 128K    | 80K        | $0.045 / $0.15       | はい   | 高速かつコスト効率が高い、関数呼び出し |

<Tip>
オンボーディングプリセットは、`arcee/trinity-large-thinking` をデフォルトモデルとして設定します。
</Tip>

## サポートされる機能

| 機能                                       | サポート                                    |
| --------------------------------------------- | -------------------------------------------- |
| ストリーミング                                     | はい                                          |
| ツール使用 / 関数呼び出し                   | はい (Trinity Mini、Trinity Large Preview)    |
| 構造化出力 (JSONモードとJSONスキーマ) | はい                                          |
| 拡張思考                             | はい (Trinity Large Thinking、ツールは無効) |

<AccordionGroup>
  <Accordion title="環境に関する注記">
    Gateway がデーモン (launchd/systemd) として実行される場合は、`ARCEEAI_API_KEY`
    (または `OPENROUTER_API_KEY`) がそのプロセスで利用可能であることを確認してください。たとえば、
    `~/.openclaw/.env` または `env.shellEnv` 経由で設定します。
  </Accordion>

  <Accordion title="OpenRouterルーティング">
    OpenRouter経由でArceeモデルを使用する場合も、同じ `arcee/*` モデルrefが適用されます。
    OpenClaw は認証の選択に基づいて透過的にルーティングします。OpenRouter固有の
    設定詳細については、[OpenRouterプロバイダードキュメント](/ja-JP/providers/openrouter) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    単一のAPIキーでArceeモデルやその他多数のモデルにアクセスできます。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデルref、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
