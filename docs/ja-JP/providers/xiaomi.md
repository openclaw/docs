---
read_when:
    - OpenClawでXiaomi MiMoモデルを使いたい
    - XIAOMI_API_KEY のセットアップが必要です
summary: Xiaomi MiMo モデルを OpenClaw で使用する
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T05:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo は **MiMo** モデル向けの API プラットフォームです。OpenClaw には、同じ `XIAOMI_API_KEY` に対して OpenAI 互換のチャットプロバイダーと音声 (TTS) プロバイダーの両方を登録する、バンドル済みの `xiaomi` Plugin が含まれています。

| プロパティ        | 値                                    |
| --------------- | ---------------------------------------- |
| プロバイダー ID     | `xiaomi`                                 |
| Plugin          | バンドル済み、`enabledByDefault: true`        |
| 認証環境変数    | `XIAOMI_API_KEY`                         |
| オンボーディングフラグ | `--auth-choice xiaomi-api-key`           |
| 直接 CLI フラグ | `--xiaomi-api-key <key>`                 |
| コントラクト       | チャット補完 + `speechProviders`     |
| API             | OpenAI 互換 (`openai-completions`) |
| ベース URL        | `https://api.xiaomimimo.com/v1`          |
| デフォルトモデル   | `xiaomi/mimo-v2-flash`                   |
| TTS デフォルト     | `mimo-v2.5-tts`、音声 `mimo_default`    |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Xiaomi MiMo コンソール](https://platform.xiaomimimo.com/#/console/api-keys)で API キーを作成します。
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

| モデル参照              | 入力       | コンテキスト   | 最大出力 | 推論 | 注記         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | テキスト        | 262,144   | 8,192      | なし        | デフォルトモデル |
| `xiaomi/mimo-v2-pro`   | テキスト        | 1,048,576 | 32,000     | あり       | 大きなコンテキスト |
| `xiaomi/mimo-v2-omni`  | テキスト、画像 | 262,144   | 32,000     | あり       | マルチモーダル    |

<Tip>
デフォルトのモデル参照は `xiaomi/mimo-v2-flash` です。`XIAOMI_API_KEY` が設定されているか、認証プロファイルが存在する場合、プロバイダーは自動的に注入されます。
</Tip>

## テキスト読み上げ

バンドル済みの `xiaomi` Plugin は、`messages.tts` 向けの音声プロバイダーとしても Xiaomi MiMo を登録します。テキストを `assistant` メッセージとして、任意のスタイル指示を `user` メッセージとして指定し、Xiaomi のチャット補完 TTS コントラクトを呼び出します。

| プロパティ | 値                                    |
| -------- | ---------------------------------------- |
| TTS ID   | `xiaomi` (`mimo` エイリアス)                  |
| 認証     | `XIAOMI_API_KEY`                         |
| API      | `audio` 付きの `POST /v1/chat/completions` |
| デフォルト  | `mimo-v2.5-tts`、音声 `mimo_default`    |
| 出力   | デフォルトでは MP3、設定時は WAV      |

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

サポートされている組み込み音声には、`mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo`、`Dean` が含まれます。`mimo-v2-tts` は古い MiMo TTS アカウント向けにサポートされています。デフォルトでは現在の MiMo-V2.5 TTS モデルを使用します。Feishu や Telegram などのボイスメモ対象では、OpenClaw は配信前に Xiaomi の出力を `ffmpeg` で 48kHz Opus にトランスコードします。

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
    `XIAOMI_API_KEY` が環境に設定されているか、認証プロファイルが存在する場合、`xiaomi` プロバイダーは自動的に注入されます。モデルメタデータまたはベース URL を上書きしたい場合を除き、プロバイダーを手動で設定する必要はありません。
  </Accordion>

  <Accordion title="モデルの詳細">
    - **mimo-v2-flash** — 軽量で高速な、汎用テキストタスクに適したモデルです。推論はサポートしません。
    - **mimo-v2-pro** — 長文ドキュメントのワークロード向けに、1M トークンのコンテキストウィンドウで推論をサポートします。
    - **mimo-v2-omni** — テキスト入力と画像入力の両方を受け付ける、推論対応のマルチモーダルモデルです。

    <Note>
    すべてのモデルは `xiaomi/` プレフィックスを使用します (例: `xiaomi/mimo-v2-pro`)。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - モデルが表示されない場合は、`XIAOMI_API_KEY` が設定され、有効であることを確認してください。
    - Gateway がデーモンとして実行される場合は、そのプロセスからキーを利用できるようにしてください (例: `~/.openclaw/.env` または `env.shellEnv` 経由)。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の Gateway プロセスからは見えません。永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンス。
  </Card>
  <Card title="Xiaomi MiMo コンソール" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo ダッシュボードと API キー管理。
  </Card>
</CardGroup>
