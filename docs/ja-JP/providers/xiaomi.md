---
read_when:
    - OpenClaw で Xiaomi MiMo モデルを使用したい場合
    - Xiaomi MiMo 認証または Token Plan のセットアップが必要です
summary: OpenClaw で Xiaomi MiMo の従量課金制モデルと Token Plan モデルを使用する
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-11T22:39:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo は、**MiMo** モデル向けの API プラットフォームです。同梱の `xiaomi`
plugin（`enabledByDefault: true`、インストール手順なし）は、2 つのテキスト
プロバイダーと音声（TTS）プロバイダーを登録します。

- `xiaomi` - 従量課金キー（`sk-...`）
- `xiaomi-token-plan` - リージョン別エンドポイントのプリセットを備えた Token Plan キー（`tp-...`）

| プロパティ         | 値                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID    | `xiaomi`（従量課金）、`xiaomi-token-plan`（Token Plan）                                                                                            |
| 認証環境変数       | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| オンボーディングフラグ | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 直接指定する CLI フラグ | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                 |
| API                | OpenAI 互換のチャット補完（`openai-completions`）                                                                                                  |
| 音声コントラクト   | `speechProviders: ["xiaomi"]`                                                                                                                      |
| ベース URL         | 従量課金：`https://api.xiaomimimo.com/v1`、Token Plan：`token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                                 |
| デフォルトモデル   | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS デフォルト     | `mimo-v2.5-tts`、音声 `mimo_default`、音声設計モデル `mimo-v2.5-tts-voicedesign`                                                                    |

## はじめに

<Steps>
  <Step title="Get the right key">
    [Xiaomi MiMo コンソール](https://platform.xiaomimimo.com/#/console/api-keys)で従量課金キーを作成するか、Token Plan のサブスクリプションページを開き、リージョン別の OpenAI 互換ベース URL と対応する `tp-...` キーをコピーします。
  </Step>

  <Step title="Run onboarding">
    従量課金：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan：

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    または、キーを直接渡します。

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
オンボーディングではキーの形式を検証し、`tp-...` キーが従量課金の経路に入力された場合、または `sk-...` キーが Token Plan の経路に入力された場合に警告します。
</Tip>

## 従量課金カタログ

| モデル参照             | 入力        | コンテキスト | 最大出力 | 推論 | 備考               |
| ---------------------- | ----------- | ------------ | -------- | ---- | ------------------ |
| `xiaomi/mimo-v2-flash` | テキスト    | 262,144      | 8,192    | なし | デフォルトモデル   |
| `xiaomi/mimo-v2-pro`   | テキスト    | 1,048,576    | 32,000   | あり | 大規模コンテキスト |
| `xiaomi/mimo-v2-omni`  | テキスト、画像 | 262,144   | 32,000   | あり | マルチモーダル     |

## Token Plan カタログ

Xiaomi のサブスクリプション UI に表示されるリージョン別ベース URL と一致する Token Plan の認証方法を選択します。

| 認証方法                | ベース URL                                 |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| モデル参照                        | 入力           | コンテキスト | 最大出力 | 推論 | 備考             |
| --------------------------------- | -------------- | ------------ | -------- | ---- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | テキスト       | 1,048,576    | 131,072  | あり | デフォルトモデル |
| `xiaomi-token-plan/mimo-v2.5`     | テキスト、画像 | 1,048,576    | 131,072  | あり | マルチモーダル   |

`xiaomi-token-plan` の解決にはリージョン別ベース URL が必要です。サポートされる方法は、
同梱の Token Plan オンボーディング方法を選択するか、`baseUrl` を設定した明示的な
`models.providers.xiaomi-token-plan` 設定ブロックを使用することです。いずれも
指定されていない場合、このプロバイダーは提供されません。

## 推論モデル

`mimo-v2-pro`、`mimo-v2-omni`、`mimo-v2.5`、`mimo-v2.5-pro` は、
OpenClaw の [`/think` ディレクティブ](/ja-JP/tools/thinking)を `off`、
`minimal`、`low`、`medium`、`high`、`xhigh`、`max` の各レベルで
サポートします（デフォルトは `high`）。`mimo-v2-flash` は推論を
サポートしません。

## テキスト読み上げ

同梱の `xiaomi` plugin は、`messages.tts` 用の音声プロバイダーとして
Xiaomi MiMo も登録します。Xiaomi のチャット補完 TTS コントラクトを呼び出し、
テキストを `assistant` メッセージとして、任意のスタイル指示を `user`
メッセージとして送信します。

| プロパティ | 値                                       |
| ---------- | ---------------------------------------- |
| TTS ID     | `xiaomi`（`mimo` エイリアス）            |
| 認証       | `XIAOMI_API_KEY`                         |
| API        | `audio` を含む `POST /v1/chat/completions` |
| デフォルト | `mimo-v2.5-tts`、音声 `mimo_default`     |
| 出力       | デフォルトは MP3、設定時は WAV           |

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

組み込み音声：`mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、
`Milo`、`Dean`。プリセット音声モデル（`mimo-v2.5-tts`、`mimo-v2-tts`）は
`audio.voice` を使用するため、OpenClaw はこれらのモデルに `speakerVoice` を送信します。

音声設計モデル `mimo-v2.5-tts-voicedesign` は、プリセット音声 ID の代わりに
自然言語のスタイルプロンプトから音声を生成します。`style` に希望する音声の説明を
設定してください。OpenClaw はそれを `user` メッセージとして、読み上げるテキストを
`assistant` メッセージとして送信し、このモデルでは `audio.voice` を省略します。

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

音声メモ合成ターゲットを要求するチャンネル（Discord、Feishu、
Matrix、Telegram、WhatsApp）では、OpenClaw は配信前に `ffmpeg` を使用して
Xiaomi の出力を 48kHz モノラル Opus にトランスコードします。

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

料金と互換性フラグは同梱の plugin マニフェストから取得されるため、設定例では実行時の動作との不一致を避けるために `cost` と `compat` を省略しています。

Token Plan：

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

料金は同梱のマニフェストから取得されます（Token Plan モデルには段階制のキャッシュ読み取り料金が含まれます）。そのため、設定例では `cost` を省略しています。

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    `XIAOMI_API_KEY` が環境に設定されているか、認証プロファイルが存在する場合、`xiaomi` プロバイダーは自動的に有効になります。`xiaomi-token-plan` にはリージョン別ベース URL が必要なため、サポートされる方法は、同梱の Token Plan オンボーディング方法を選択するか、明示的な `models.providers.xiaomi-token-plan` 設定ブロックを使用することです。
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - 軽量かつ高速で、汎用的なテキストタスクに適しています。推論はサポートしません。
    - **mimo-v2-pro** - 長文ドキュメントのワークロード向けに、100 万トークンのコンテキストウィンドウによる推論をサポートします。
    - **mimo-v2-omni** - テキストと画像の両方を入力として受け付ける、推論対応のマルチモーダルモデルです。
    - **mimo-v2.5-pro** - Xiaomi の現行 V2.5 推論スタックを使用する Token Plan のデフォルトモデルです。
    - **mimo-v2.5** - Token Plan のマルチモーダル V2.5 ルートです。

    <Note>
    従量課金モデルは `xiaomi/` プレフィックスを使用します。Token Plan モデルは `xiaomi-token-plan/` プレフィックスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - モデルが表示されない場合は、該当するキーの環境変数または認証プロファイルが存在し、有効であることを確認してください。
    - Token Plan では、選択したオンボーディングのリージョンがサブスクリプションページのベース URL と一致し、キーが `tp-` で始まることを確認してください。
    - Gateway をデーモンとして実行する場合は、そのプロセスからキーを利用できることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` を使用します）。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の Gateway プロセスから参照できません。永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Thinking levels" href="/ja-JP/tools/thinking" icon="brain">
    `/think` ディレクティブの構文とレベルの対応関係。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw の完全な設定リファレンス。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo のダッシュボードと API キー管理。
  </Card>
</CardGroup>
