---
read_when:
    - OpenClaw で Xiaomi MiMo モデルを使いたい
    - Xiaomi MiMo 認証または Token Plan セットアップが必要です
summary: OpenClaw で Xiaomi MiMo の従量課金モデルと Token Plan モデルを使用する
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T12:53:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo は **MiMo** モデル向けの API プラットフォームです。OpenClaw には、2つのテキストプロバイダープリセットを持つバンドル済み Xiaomi Plugin が含まれています。

- 従量課金キー（`sk-...`）向けの `xiaomi`
- リージョン別エンドポイントプリセットを持つ Token Plan キー（`tp-...`）向けの `xiaomi-token-plan`

同じ Plugin は `xiaomi` 音声（TTS）プロバイダーも登録します。

| プロパティ         | 値                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID     | `xiaomi`（従量課金）、`xiaomi-token-plan`（Token Plan）                                                                                              |
| Plugin           | バンドル済み、`enabledByDefault: true`                                                                                                               |
| 認証環境変数       | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| オンボーディングフラグ | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 直接 CLI フラグ    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| コントラクト       | チャット補完 + `speechProviders`                                                                                                                     |
| API              | OpenAI 互換（`openai-completions`）                                                                                                                  |
| ベース URL         | 従量課金: `https://api.xiaomimimo.com/v1`; Token Plan プリセット: `token-plan-{cn,sgp,ams}...`                                                       |
| デフォルトモデル    | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS デフォルト     | `mimo-v2.5-tts`、音声 `mimo_default`; voicedesign モデル `mimo-v2.5-tts-voicedesign`                                                                  |

## はじめに

<Steps>
  <Step title="適切なキーを取得する">
    [Xiaomi MiMo コンソール](https://platform.xiaomimimo.com/#/console/api-keys)で従量課金キーを作成するか、Token Plan のサブスクリプションページを開いて、リージョン別の OpenAI 互換ベース URL と対応する `tp-...` キーをコピーします。
  </Step>

  <Step title="オンボーディングを実行する">
    従量課金:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    またはキーを直接渡します。

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## 従量課金カタログ

| モデル参照              | 入力        | コンテキスト | 最大出力   | 推論 | 注記             |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | テキスト      | 262,144   | 8,192      | いいえ | デフォルトモデル |
| `xiaomi/mimo-v2-pro`   | テキスト      | 1,048,576 | 32,000     | はい | 大きなコンテキスト |
| `xiaomi/mimo-v2-omni`  | テキスト、画像 | 262,144   | 32,000     | はい | マルチモーダル    |

<Tip>
デフォルトモデル参照は `xiaomi/mimo-v2-flash` です。`XIAOMI_API_KEY` が設定されているか、認証プロファイルが存在する場合、プロバイダーは自動的に注入されます。
</Tip>

## Token Plan カタログ

Xiaomi のサブスクリプション UI に表示されるリージョン別ベース URL と一致する Token Plan 認証選択肢を選びます。

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| モデル参照                         | 入力        | コンテキスト | 最大出力   | 推論 | 注記             |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | テキスト      | 1,048,576 | 131,072    | はい | デフォルトモデル |
| `xiaomi-token-plan/mimo-v2.5`     | テキスト、画像 | 1,048,576 | 131,072    | はい | マルチモーダル    |

<Tip>
Token Plan のオンボーディングはキーの形状を検証し、`tp-...` キーが従量課金パスに入力された場合、または `sk-...` キーが Token Plan パスに入力された場合に警告します。
</Tip>

## テキスト読み上げ

バンドル済みの `xiaomi` Plugin は、Xiaomi MiMo を `messages.tts` 向けの音声プロバイダーとしても登録します。テキストを `assistant` メッセージとして、任意のスタイル指示を `user` メッセージとして、Xiaomi のチャット補完 TTS コントラクトを呼び出します。

| プロパティ | 値                                      |
| -------- | ---------------------------------------- |
| TTS ID   | `xiaomi`（`mimo` エイリアス）                  |
| 認証     | `XIAOMI_API_KEY`                         |
| API      | `audio` を使用する `POST /v1/chat/completions` |
| デフォルト | `mimo-v2.5-tts`、音声 `mimo_default`    |
| 出力     | デフォルトは MP3、設定時は WAV      |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

サポートされる組み込み音声には、`mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo`、`Dean` が含まれます。プリセット音声モデルは `audio.voice` を使うため、OpenClaw は `mimo-v2.5-tts` と `mimo-v2-tts` に対して `speakerVoice` を送信します。

Xiaomi の voicedesign モデルである `mimo-v2.5-tts-voicedesign` は、プリセット音声 ID ではなく自然言語のスタイルプロンプトから音声を生成します。目的の音声説明で `style` を設定します。OpenClaw はそれを `user` メッセージとして送信し、読み上げるテキストを `assistant` メッセージとして送信し、このモデルでは `audio.voice` を省略します。

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Feishu や Telegram などのボイスメモ対象では、OpenClaw は配信前に Xiaomi の出力を `ffmpeg` で 48kHz Opus にトランスコードします。

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

価格と互換性フラグはバンドル済み Plugin マニフェストから取得されるため、設定例ではランタイム動作との乖離を避けるために `cost` と `compat` を省略しています。

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

価格はバンドル済みマニフェストから取得されるため（Token Plan モデルには階層型キャッシュ読み取り価格が含まれます）、設定例では `cost` を省略しています。

<AccordionGroup>
  <Accordion title="自動注入の動作">
    `XIAOMI_API_KEY` が環境に設定されているか、認証プロファイルが存在する場合、`xiaomi` プロバイダーは自動的に注入されます。`xiaomi-token-plan` にはリージョン別ベース URL が必要なため、サポートされるパスはバンドル済みの Token Plan オンボーディング選択肢、または明示的な `models.providers.xiaomi-token-plan` 設定ブロックです。
  </Accordion>

  <Accordion title="モデル詳細">
    - **mimo-v2-flash** — 軽量で高速。汎用テキストタスクに最適です。推論はサポートしません。
    - **mimo-v2-pro** — 長文ドキュメントのワークロード向けに、1M トークンのコンテキストウィンドウで推論をサポートします。
    - **mimo-v2-omni** — テキスト入力と画像入力の両方を受け付ける、推論対応のマルチモーダルモデルです。
    - **mimo-v2.5-pro** — Xiaomi の現行 V2.5 推論スタックを使用する Token Plan のデフォルトです。
    - **mimo-v2.5** — Token Plan のマルチモーダル V2.5 ルートです。

    <Note>
    従量課金モデルは `xiaomi/` プレフィックスを使用します。Token Plan モデルは `xiaomi-token-plan/` プレフィックスを使用します。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - モデルが表示されない場合は、関連するキー環境変数または認証プロファイルが存在し、有効であることを確認します。
    - Token Plan では、選択したオンボーディングリージョンがサブスクリプションページのベース URL と一致し、キーが `tp-` で始まることを確認します。
    - Gateway がデーモンとして実行される場合、そのプロセスからキーを利用できることを確認します（たとえば `~/.openclaw/.env` 内、または `env.shellEnv` 経由）。

    <Warning>
    インタラクティブシェルのみに設定されたキーは、デーモン管理の Gateway プロセスからは見えません。永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定リファレンス全体。
  </Card>
  <Card title="Xiaomi MiMo コンソール" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo ダッシュボードと API キー管理。
  </Card>
</CardGroup>
