---
read_when:
    - OpenClaw で Arcee AI を使用したい
    - API キー環境変数または CLI 認証の選択が必要です
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T12:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) は、OpenAI 互換 API を通じて、エキスパート混合モデルの Trinity ファミリーへのアクセスを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。

Arcee AI モデルには、Arcee プラットフォームから直接、または [OpenRouter](/ja-JP/providers/openrouter) 経由でアクセスできます。

| プロパティ | 値                                                                                    |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `arcee`                                                                               |
| 認証       | `ARCEEAI_API_KEY` (直接) または `OPENROUTER_API_KEY` (OpenRouter 経由)                 |
| API        | OpenAI 互換                                                                           |
| ベース URL | `https://api.arcee.ai/api/v1` (直接) または `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## はじめに

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        [Arcee AI](https://chat.arcee.ai/) で API キーを作成します。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        [OpenRouter](https://openrouter.ai/keys) で API キーを作成します。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        同じモデル参照は、直接セットアップと OpenRouter セットアップの両方で機能します (例: `arcee/trinity-large-thinking`)。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非対話型セットアップ

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 組み込みカタログ

OpenClaw は現在、この Arcee 静的カタログを同梱しています。

| モデル参照                     | 名前                   | 入力     | コンテキスト | コスト (100万あたりの入力/出力) | 注記                                      |
| ------------------------------ | ---------------------- | -------- | ------------ | ------------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | テキスト | 256K         | $0.25 / $0.90                   | デフォルトモデル。推論が有効              |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | テキスト | 128K         | $0.25 / $1.00                   | 汎用。400B パラメータ、13B アクティブ     |
| `arcee/trinity-mini`           | Trinity Mini 26B       | テキスト | 128K         | $0.045 / $0.15                  | 高速でコスト効率が高い。関数呼び出し対応 |

<Tip>
オンボーディングプリセットは `arcee/trinity-large-thinking` をデフォルトモデルとして設定します。
</Tip>

## 対応機能

| 機能                                          | 対応                                         |
| --------------------------------------------- | -------------------------------------------- |
| ストリーミング                                | はい                                         |
| ツール使用 / 関数呼び出し                     | はい (Trinity Mini、Trinity Large Preview)   |
| 構造化出力 (JSON モードと JSON スキーマ)      | はい                                         |
| 拡張思考                                      | はい (Trinity Large Thinking。ツールは無効)  |

<AccordionGroup>
  <Accordion title="Environment note">
    Gateway をデーモン (launchd/systemd) として実行する場合は、`ARCEEAI_API_KEY`
    (または `OPENROUTER_API_KEY`) がそのプロセスで利用できることを確認してください (例:
    `~/.openclaw/.env`、または `env.shellEnv` 経由)。
  </Accordion>

  <Accordion title="OpenRouter routing">
    OpenRouter 経由で Arcee モデルを使用する場合も、同じ `arcee/*` モデル参照が適用されます。
    OpenClaw は認証の選択に基づいてルーティングを透過的に処理します。OpenRouter 固有の
    設定詳細については、[OpenRouter プロバイダードキュメント](/ja-JP/providers/openrouter) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    1 つの API キーで Arcee モデルやその他多くのモデルにアクセスできます。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
