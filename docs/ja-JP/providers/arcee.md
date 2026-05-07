---
read_when:
    - OpenClaw で Arcee AI を使用したい場合
    - API キーの環境変数、または CLI 認証の選択が必要です
summary: Arcee AI のセットアップ（認証 + モデル選択）
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) は、OpenAI 互換 API を通じて mixture-of-experts モデルの Trinity ファミリーへのアクセスを提供します。すべての Trinity モデルは Apache 2.0 ライセンスです。

Arcee AI モデルには、Arcee プラットフォームから直接、または [OpenRouter](/ja-JP/providers/openrouter) 経由でアクセスできます。

| プロパティ | 値                                                                                 |
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

        同じモデル ref は、直接セットアップと OpenRouter セットアップの両方で機能します (例: `arcee/trinity-large-thinking`)。
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

OpenClaw には現在、このバンドル済み Arcee カタログが含まれています。

| モデル ref                      | 名前                   | 入力 | コンテキスト | コスト (1M あたりの入力/出力) | 注記                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | デフォルトモデル。reasoning が有効          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 汎用。400B パラメーター、13B アクティブ  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 高速でコスト効率が高い。function calling |

<Tip>
オンボーディングのプリセットは、`arcee/trinity-large-thinking` をデフォルトモデルとして設定します。
</Tip>

## サポートされる機能

| 機能                                       | サポート                                    |
| --------------------------------------------- | -------------------------------------------- |
| ストリーミング                                     | はい                                          |
| ツール使用 / function calling                   | はい (Trinity Mini、Trinity Large Preview)    |
| 構造化出力 (JSON mode と JSON schema) | はい                                          |
| 拡張 thinking                             | はい (Trinity Large Thinking。ツールは無効) |

<AccordionGroup>
  <Accordion title="環境に関する注意">
    Gateway がデーモン (launchd/systemd) として実行される場合は、`ARCEEAI_API_KEY`
    (または `OPENROUTER_API_KEY`) がそのプロセスで利用可能であることを確認してください (たとえば、
    `~/.openclaw/.env` または `env.shellEnv` 経由)。
  </Accordion>

  <Accordion title="OpenRouter ルーティング">
    OpenRouter 経由で Arcee モデルを使用する場合も、同じ `arcee/*` モデル ref が適用されます。
    OpenClaw は、認証の選択に基づいてルーティングを透過的に処理します。OpenRouter 固有の
    設定の詳細については、[OpenRouter プロバイダードキュメント](/ja-JP/providers/openrouter) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ja-JP/providers/openrouter" icon="shuffle">
    単一の API キーで Arcee モデルやその他多数のモデルにアクセスします。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
