---
read_when:
    - OpenClawでXiaomi MiMoモデルを使いたい
    - Xiaomi MiMo 認証または Token Plan セットアップが必要です
summary: OpenClaw で Xiaomi MiMo の従量課金モデルと Token Plan モデルを使用する
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-05T11:42:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo は **MiMo** モデル向けの API プラットフォームです。バンドルされた `xiaomi`
Plugin（`enabledByDefault: true`、インストール手順なし）は、2 つのテキスト
プロバイダーと音声（TTS）プロバイダーを登録します。

- `xiaomi` - 従量課金キー（`sk-...`）
- `xiaomi-token-plan` - 地域別エンドポイントプリセット付きの Token Plan キー（`tp-...`）

| プロパティ | 値 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID | `xiaomi`（従量課金）、`xiaomi-token-plan`（Token Plan） |
| 認証環境変数 | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY` |
| オンボーディングフラグ | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 直接 CLI フラグ | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>` |
| API | OpenAI 互換のチャット補完（`openai-completions`） |
| 音声コントラクト | `speechProviders: ["xiaomi"]` |
| ベース URL | 従量課金: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1` |
| デフォルトモデル | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro` |
| TTS デフォルト | `mimo-v2.5-tts`, 音声 `mimo_default`; voicedesign モデル `mimo-v2.5-tts-voicedesign` |

## はじめに

<Steps>
  <Step title="Get the right key">
    [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) で従量課金キーを作成するか、Token Plan のサブスクリプションページを開き、地域別の OpenAI 互換ベース URL と対応する `tp-...` キーをコピーします。
  </Step>

  <Step title="Run onboarding">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
オンボーディングはキーの形式を検証し、`tp-...` キーが従量課金パスに入力された場合、または `sk-...` キーが Token Plan パスに入力された場合に警告します。
</Tip>

## 従量課金カタログ

| モデル参照 | 入力 | コンテキスト | 最大出力 | 推論 | 注記 |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | テキスト | 262,144 | 8,192 | なし | デフォルトモデル |
| `xiaomi/mimo-v2-pro` | テキスト | 1,048,576 | 32,000 | あり | 大きなコンテキスト |
| `xiaomi/mimo-v2-omni` | テキスト、画像 | 262,144 | 32,000 | あり | マルチモーダル |

## Token Plan カタログ

Xiaomi のサブスクリプション UI に表示される地域別ベース URL と一致する Token Plan 認証選択肢を選びます。

| 認証選択肢 | ベース URL |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn` | `https://token-plan-cn.xiaomimimo.com/v1` |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| モデル参照 | 入力 | コンテキスト | 最大出力 | 推論 | 注記 |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | テキスト | 1,048,576 | 131,072 | あり | デフォルトモデル |
| `xiaomi-token-plan/mimo-v2.5` | テキスト、画像 | 1,048,576 | 131,072 | あり | マルチモーダル |

`xiaomi-token-plan` を解決するには地域別ベース URL が必要です。サポートされるパスは、バンドルされた Token Plan オンボーディング選択肢、または `baseUrl` が設定された明示的な `models.providers.xiaomi-token-plan` 設定ブロックです。いずれかがない場合、このプロバイダーは提供されません。

## 推論モデル

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5`, `mimo-v2.5-pro` は、レベル `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`（デフォルトは `high`）で OpenClaw の [`/think` ディレクティブ](/ja-JP/tools/thinking)をサポートします。
`mimo-v2-flash` は推論をサポートしません。

## Text-to-speech

バンドルされた `xiaomi` Plugin は、`messages.tts` 用の音声プロバイダーとして Xiaomi MiMo も登録します。これは、テキストを `assistant` メッセージとして、任意のスタイルガイダンスを `user` メッセージとして渡し、Xiaomi のチャット補完 TTS コントラクトを呼び出します。

| プロパティ | 値 |
| -------- | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` エイリアス） |
| 認証 | `XIAOMI_API_KEY` |
| API | `audio` を伴う `POST /v1/chat/completions` |
| デフォルト | `mimo-v2.5-tts`, 音声 `mimo_default` |
| 出力 | デフォルトは MP3。設定時は WAV |

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

組み込み音声: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`。プリセット音声モデル（`mimo-v2.5-tts`, `mimo-v2-tts`）は
`audio.voice` を使用するため、OpenClaw はこれらのモデルに `speakerVoice` を送信します。

voicedesign モデル `mimo-v2.5-tts-voicedesign` は、プリセット音声 ID の代わりに自然言語のスタイルプロンプトから音声を生成します。目的の音声説明を `style` に設定します。OpenClaw はそれを `user` メッセージとして送信し、読み上げるテキストを `assistant` メッセージとして送信し、このモデルでは `audio.voice` を省略します。

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

音声メモ合成ターゲットを要求するチャンネル（Discord、Feishu、Matrix、Telegram、WhatsApp）では、OpenClaw は配信前に Xiaomi の出力を `ffmpeg` で 48kHz モノラル Opus にトランスコードします。

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

料金と互換性フラグはバンドルされた Plugin マニフェストに由来するため、設定例では実行時の動作との差異を避けるために `cost` と `compat` を省略しています。

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

料金はバンドルされたマニフェストに由来するため（Token Plan モデルには階層型のキャッシュ読み取り料金が含まれます）、設定例では `cost` を省略しています。

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    `xiaomi` プロバイダーは、環境に `XIAOMI_API_KEY` が設定されている場合、または認証プロファイルが存在する場合に自動的に有効化されます。`xiaomi-token-plan` には地域別ベース URL が必要なため、サポートされるパスはバンドルされた Token Plan オンボーディング選択肢、または明示的な `models.providers.xiaomi-token-plan` 設定ブロックです。
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - 軽量で高速、汎用のテキストタスクに最適です。推論はサポートしません。
    - **mimo-v2-pro** - 長文ドキュメントのワークロード向けに、1M トークンのコンテキストウィンドウで推論をサポートします。
    - **mimo-v2-omni** - テキスト入力と画像入力の両方を受け付ける、推論対応のマルチモーダルモデルです。
    - **mimo-v2.5-pro** - Xiaomi の現在の V2.5 推論スタックを備えた Token Plan のデフォルトです。
    - **mimo-v2.5** - Token Plan のマルチモーダル V2.5 ルートです。

    <Note>
    従量課金モデルは `xiaomi/` プレフィックスを使用します。Token Plan モデルは `xiaomi-token-plan/` プレフィックスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - モデルが表示されない場合は、関連するキー環境変数または認証プロファイルが存在し、有効であることを確認してください。
    - Token Plan では、選択したオンボーディング地域がサブスクリプションページのベース URL と一致していること、およびキーが `tp-` で始まることを確認してください。
    - Gateway がデーモンとして実行される場合は、そのプロセスからキーを利用できることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。

    <Warning>
    対話型シェルにのみ設定されたキーは、デーモン管理の Gateway プロセスからは見えません。永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Thinking levels" href="/ja-JP/tools/thinking" icon="brain">
    `/think` ディレクティブの構文とレベルマッピング。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定リファレンス全体。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo ダッシュボードと API キー管理。
  </Card>
</CardGroup>
