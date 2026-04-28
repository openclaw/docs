---
read_when:
    - OpenClaw で Volcano Engine または Doubao models を使用したい場合
    - Volcengine API キーのセットアップが必要です
    - Volcengine Speech のテキスト読み上げを使いたい場合
summary: Volcano Engine のセットアップ（Doubao models、coding endpoints、Seed Speech TTS）
title: Volcengine（Doubao）
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:39:26Z"
  model: gpt-5.4
  provider: openai
  source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
  source_path: providers/volcengine.md
  workflow: 15
---

Volcengine provider は、一般用途およびコーディング用途で分かれたエンドポイントを通じて、Volcano Engine 上でホストされる Doubao models とサードパーティ models へのアクセスを提供します。同じバンドル済みPluginで、Volcengine Speech を TTS provider として登録することもできます。

| Detail     | Value                                                      |
| ---------- | ---------------------------------------------------------- |
| Providers  | `volcengine`（一般 + TTS）+ `volcengine-plan`（コーディング） |
| Model auth | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS auth   | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI互換 models、BytePlus Seed Speech TTS                |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話式オンボーディングを実行します:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    これにより、1つの API キーから一般用の provider（`volcengine`）とコーディング用の provider（`volcengine-plan`）の両方が登録されます。

  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
非対話式セットアップ（CI、スクリプト）では、キーを直接渡します:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers とエンドポイント

| Provider          | Endpoint                                  | Use case |
| ----------------- | ----------------------------------------- | -------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 一般モデル |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | コーディングモデル |

<Note>
両方の provider は 1 つの API キーから設定されます。セットアップでは両方が自動的に登録されます。
</Note>

## 組み込みカタログ

<Tabs>
  <Tab title="一般（volcengine）">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="コーディング（volcengine-plan）">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## テキスト読み上げ

Volcengine TTS は BytePlus Seed Speech HTTP API を使用し、OpenAI互換の Doubao model API キーとは別に設定されます。BytePlus
console で Seed Speech > Settings > API Keys を開き、API キーをコピーしてから、次を設定します:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

次に、`openclaw.json` でこれを有効にします:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

voice-note ターゲットでは、OpenClaw は provider ネイティブの
`ogg_opus` を Volcengine に要求します。通常の音声添付では `mp3` を要求します。provider aliases の
`bytedance` と `doubao` も同じ speech provider に解決されます。

デフォルトの resource id は `seed-tts-1.0` です。これは BytePlus がデフォルト project 内で新規作成された Seed Speech API キーに付与する値だからです。project に TTS 2.0 entitlement がある場合は、`VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` を設定してください。

<Warning>
`VOLCANO_ENGINE_API_KEY` は ModelArk/Doubao model エンドポイント用であり、Seed Speech API キーではありません。TTS には、BytePlus Speech
Console の Seed Speech API キー、または旧来の Speech Console AppID/token ペアが必要です。
</Warning>

旧来の AppID/token 認証は、古い Speech Console アプリケーション向けに引き続きサポートされています:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## 高度な設定

<AccordionGroup>
  <Accordion title="オンボーディング後のデフォルトモデル">
    `openclaw onboard --auth-choice volcengine-api-key` は現在、
    一般用の `volcengine` カタログも登録しつつ、
    `volcengine-plan/ark-code-latest` をデフォルトモデルとして設定します。
  </Accordion>

  <Accordion title="モデルピッカーのフォールバック動作">
    オンボーディング / configure のモデル選択時に、Volcengine auth choice は
    `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルが
    まだ読み込まれていない場合、OpenClaw は provider スコープ付きの空の picker を表示する代わりに、フィルタなしカタログへフォールバックします。
  </Accordion>

  <Accordion title="デーモンプロセス向けの環境変数">
    Gateway がデーモン（launchd/systemd）として動作している場合は、`VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、
    `BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID`、および
    `VOLCENGINE_TTS_TOKEN` などの model / TTS 環境変数が、そのプロセスから利用可能であることを確認してください（たとえば
    `~/.openclaw/.env` または `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw をバックグラウンドサービスとして実行する場合、対話シェルで設定した環境変数は自動では継承されません。上記のデーモンに関する注記を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    Providers、model refs、およびフェイルオーバー動作の選び方。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    エージェント、models、providers の完全な設定リファレンス。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
