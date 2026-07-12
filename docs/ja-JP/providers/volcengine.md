---
read_when:
    - OpenClaw で Volcano Engine または Doubao のモデルを使用する場合
    - Volcengine API キーのセットアップが必要です
    - Volcengine Speech のテキスト読み上げ機能を使用する場合
summary: Volcano Engine のセットアップ（Doubao モデル、コーディングエンドポイント、Seed Speech TTS）
title: Volcengine（Doubao）
x-i18n:
    generated_at: "2026-07-11T22:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine プロバイダーを使用すると、Volcano Engine でホストされている Doubao モデルとサードパーティモデルにアクセスできます。一般用途とコーディング用途では、それぞれ異なるエンドポイントを使用します。同じバンドル済み Plugin により、Volcengine Speech も TTS プロバイダーとして登録されます。

| 詳細             | 値                                                         |
| ---------------- | ---------------------------------------------------------- |
| プロバイダー     | `volcengine`（一般 + TTS）、`volcengine-plan`（コーディング） |
| モデル認証       | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS 認証         | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API              | OpenAI 互換モデル、BytePlus Seed Speech TTS                |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話形式のオンボーディングを実行します。

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    これにより、1 つの API キーから一般用（`volcengine`）とコーディング用（`volcengine-plan`）の両方のプロバイダーが登録されます。

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
非対話形式のセットアップ（CI、スクリプト処理）では、キーを直接渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## プロバイダーとエンドポイント

| プロバイダー      | エンドポイント                            | 用途                 |
| ----------------- | ----------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 一般モデル           |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | コーディングモデル   |

<Note>
両方のプロバイダーは、1 つの API キーから設定されます。セットアップ時に両方が自動的に登録され、コーディングプロバイダーのモデル選択でも一般プロバイダーの認証が再利用されます（`volcengine-plan` は `volcengine` の認証エイリアスです）。
</Note>

## 組み込みカタログ

<Tabs>
  <Tab title="一般（volcengine）">
    | モデル参照                                    | 名前                            | 入力               | コンテキスト |
    | --------------------------------------------- | ------------------------------- | ------------------ | ------------ |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | テキスト、画像     | 128,000      |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | テキスト、画像     | 256,000      |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | テキスト、画像     | 256,000      |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | テキスト、画像     | 200,000      |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | テキスト、画像     | 256,000      |
  </Tab>
  <Tab title="コーディング（volcengine-plan）">
    | モデル参照                                         | 名前                     | 入力       | コンテキスト |
    | -------------------------------------------------- | ------------------------ | ---------- | ------------ |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | テキスト   | 256,000      |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | テキスト   | 256,000      |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | テキスト   | 256,000      |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | テキスト   | 200,000      |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | テキスト   | 256,000      |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | テキスト   | 256,000      |
  </Tab>
</Tabs>

どちらのカタログも静的であり（`/models` 検出呼び出しは行いません）、OpenAI 互換のストリーミング使用量集計をサポートします。Volcengine のツール呼び出し API では受け付けられないため、両プロバイダーのツールスキーマから `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains`、`maxContains` キーワードが自動的に削除されます。

## テキスト読み上げ

Volcengine TTS は BytePlus Seed Speech HTTP API（`voice.ap-southeast-1.bytepluses.com`）を使用し、OpenAI 互換 Doubao モデルの API キーとは別に設定します。BytePlus コンソールで Seed Speech > Settings > API Keys を開き、API キーをコピーしてから、次のように設定します。

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

次に、`openclaw.json` で有効にします。

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

`messages.tts.providers.volcengine` で使用可能なフィールドは、`apiKey`、`voice`、`speedRatio`（0.2～3.0）、`emotion`、`cluster`、`resourceId`、`appKey`、`baseUrl` です。音声設定の上書きが許可されている場合、`!emotion=<value>` もインライン音声ディレクティブとして機能します。

ボイスメモの送信先では、OpenClaw はプロバイダー固有の `ogg_opus` を要求します。通常の音声添付ファイルでは、`mp3` を要求します。プロバイダーエイリアスの `bytedance` と `doubao` も、この音声プロバイダーとして解決されます。

デフォルトのリソース ID は `seed-tts-1.0` です。これは、新しく作成された Seed Speech API キーに BytePlus がデフォルトで付与する利用権限です。プロジェクトに TTS 2.0 の利用権限がある場合は、`VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` を設定します。

<Warning>
`VOLCANO_ENGINE_API_KEY` は ModelArk/Doubao モデルのエンドポイント用であり、Seed Speech API キーではありません。TTS には、BytePlus Speech Console から取得した Seed Speech API キー、または従来の Speech Console AppID/トークンの組み合わせが必要です。
</Warning>

古い Speech Console アプリケーション向けに、従来の AppID/トークン認証も引き続きサポートされています。

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

その他のオプションの TTS 環境変数として、`VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY`、`VOLCENGINE_TTS_BASE_URL` があります。これらを設定すると、対応する `messages.tts.providers.volcengine` の設定フィールドが上書きされます。

## 高度な設定

<AccordionGroup>
  <Accordion title="オンボーディング後のデフォルトモデル">
    `openclaw onboard --auth-choice volcengine-api-key` は、一般用の `volcengine` カタログも登録しながら、`volcengine-plan/ark-code-latest` をデフォルトモデルとして設定します。
  </Accordion>

  <Accordion title="モデル選択のフォールバック動作">
    オンボーディングまたは設定時にモデルを選択する際、Volcengine の認証選択では `volcengine/*` と `volcengine-plan/*` の両方の行が優先されます。これらのモデルがまだ読み込まれていない場合、OpenClaw はプロバイダー範囲に限定された空の選択画面を表示する代わりに、フィルターされていないカタログへフォールバックします。
  </Accordion>

  <Accordion title="デーモンプロセス用の環境変数">
    Gateway がデーモン（launchd/systemd）として動作する場合は、`VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN` などのモデルおよび TTS 用環境変数を、そのプロセスから利用できるようにしてください（たとえば、`~/.openclaw/.env` または `env.shellEnv` を使用します）。
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw をバックグラウンドサービスとして実行する場合、対話シェルで設定した環境変数は自動的には継承されません。前述のデーモンに関する注記を参照してください。
</Warning>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とデバッグ手順。
  </Card>
  <Card title="よくある質問" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw のセットアップに関するよくある質問。
  </Card>
</CardGroup>
