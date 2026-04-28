---
read_when:
    - OpenClaw で Xiaomi MiMo モデルを使いたい場合
    - '`XIAOMI_API_KEY` の設定が必要です'
summary: Xiaomi MiMo モデルを OpenClaw で使う
title: Xiaomi MiMo
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo は **MiMo** モデル向けの API プラットフォームです。OpenClaw は、API キー認証付きの Xiaomi の OpenAI 互換エンドポイントを使用します。

| プロパティ | 値 |
| -------- | ------------------------------- |
| Provider | `xiaomi` |
| 認証 | `XIAOMI_API_KEY` |
| API | OpenAI 互換 |
| Base URL | `https://api.xiaomimimo.com/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Xiaomi MiMo コンソール](https://platform.xiaomimimo.com/#/console/api-keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    または、キーを直接渡します。

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 組み込みカタログ

| モデル参照 | 入力 | コンテキスト | 最大出力 | 推論 | 注記 |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text | 262,144 | 8,192 | いいえ | デフォルトモデル |
| `xiaomi/mimo-v2-pro` | text | 1,048,576 | 32,000 | はい | 大きなコンテキスト |
| `xiaomi/mimo-v2-omni` | text, image | 262,144 | 32,000 | はい | マルチモーダル |

<Tip>
デフォルトのモデル参照は `xiaomi/mimo-v2-flash` です。`XIAOMI_API_KEY` が設定されているか、認証プロファイルが存在する場合、Provider は自動的に注入されます。
</Tip>

## Text-to-speech

同梱の `xiaomi` プラグインは、`messages.tts` 用の音声 Provider として Xiaomi MiMo も登録します。これは Xiaomi の chat-completions TTS 契約を呼び出し、テキストを `assistant` メッセージとして、任意のスタイルガイダンスを `user` メッセージとして渡します。

| プロパティ | 値 |
| -------- | ---------------------------------------- |
| TTS id | `xiaomi` (`mimo` エイリアス) |
| 認証 | `XIAOMI_API_KEY` |
| API | `POST /v1/chat/completions` と `audio` |
| デフォルト | `mimo-v2.5-tts`, 音声 `mimo_default` |
| 出力 | デフォルトは MP3、設定時は WAV |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

サポートされている組み込み音声には、`mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo`、`Dean` があります。`mimo-v2-tts` は古い MiMo TTS アカウント向けにサポートされており、デフォルトでは現在の MiMo-V2.5 TTS モデルを使用します。Feishu や Telegram のようなボイスノート対象では、OpenClaw は配信前に `ffmpeg` を使って Xiaomi の出力を 48kHz Opus にトランスコードします。

## 設定例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="自動注入の動作">
    `xiaomi` Provider は、環境変数に `XIAOMI_API_KEY` が設定されているか、認証プロファイルが存在する場合に自動的に注入されます。モデルメタデータまたは base URL を上書きしたい場合を除き、Provider を手動で設定する必要はありません。
  </Accordion>

  <Accordion title="モデルの詳細">
    - **mimo-v2-flash** — 軽量で高速。汎用的なテキストタスクに最適です。推論はサポートされません。
    - **mimo-v2-pro** — 1M トークンのコンテキストウィンドウで推論をサポートし、長文ドキュメントのワークロードに適しています。
    - **mimo-v2-omni** — テキストと画像の両方を受け付ける、推論対応のマルチモーダルモデルです。

    <Note>
    すべてのモデルは `xiaomi/` プレフィックスを使用します（例: `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - モデルが表示されない場合は、`XIAOMI_API_KEY` が設定されていて有効であることを確認してください。
    - Gateway がデーモンとして動作している場合は、そのプロセスからキーにアクセスできることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。

    <Warning>
    対話シェルにのみ設定されたキーは、デーモン管理された Gateway プロセスからは参照できません。永続的に利用可能にするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    Provider、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw の完全な設定リファレンス。
  </Card>
  <Card title="Xiaomi MiMo コンソール" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo のダッシュボードと API キー管理。
  </Card>
</CardGroup>
