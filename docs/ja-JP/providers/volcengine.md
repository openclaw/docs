---
read_when:
    - Volcano Engine または Doubao モデルを OpenClaw で使用したい場合
    - Volcengine APIキーの設定が必要です
    - Volcengine Speech のテキスト読み上げを使用したい
summary: Volcano Engine のセットアップ（Doubao モデル、コーディングエンドポイント、Seed Speech TTS）
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-05T11:42:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine プロバイダーは、Volcano Engine でホストされる Doubao モデルとサードパーティモデルへのアクセスを提供し、汎用ワークロードとコーディングワークロード向けに別々のエンドポイントを備えています。同じバンドル済み Plugin は、Volcengine Speech も TTS プロバイダーとして登録します。

| 詳細       | 値                                                         |
| ---------- | ---------------------------------------------------------- |
| プロバイダー | `volcengine` (汎用 + TTS), `volcengine-plan` (コーディング) |
| モデル認証 | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS 認証   | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI 互換モデル、BytePlus Seed Speech TTS                |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話型オンボーディングを実行します。

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    これにより、1 つの API キーから汎用 (`volcengine`) とコーディング (`volcengine-plan`) の両方のプロバイダーが登録されます。

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
非対話型セットアップ (CI、スクリプト) では、キーを直接渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## プロバイダーとエンドポイント

| プロバイダー      | エンドポイント                          | ユースケース       |
| ----------------- | --------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`      | 汎用モデル         |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | コーディングモデル |

<Note>
両方のプロバイダーは 1 つの API キーから設定されます。セットアップでは両方が自動的に登録され、コーディングプロバイダーのモデルピッカーも汎用プロバイダーの認証を再利用します (`volcengine-plan` は `volcengine` の認証エイリアスです)。
</Note>

## 組み込みカタログ

<Tabs>
  <Tab title="汎用 (volcengine)">
    | モデル参照                                   | 名前                            | 入力        | コンテキスト |
    | -------------------------------------------- | ------------------------------- | ----------- | ------------ |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000      |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000      |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000      |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000      |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000      |
  </Tab>
  <Tab title="コーディング (volcengine-plan)">
    | モデル参照                                        | 名前                     | 入力 | コンテキスト |
    | ------------------------------------------------- | ------------------------ | ---- | ------------ |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text | 256,000      |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text | 256,000      |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000      |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text | 200,000      |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text | 256,000      |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text | 256,000      |
  </Tab>
</Tabs>

どちらのカタログも静的 (`/models` 検出呼び出しなし) で、OpenAI 互換のストリーミング使用量計上をサポートします。Volcengine のツール呼び出し API が拒否するため、両方のプロバイダーのツールスキーマでは `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains`、`maxContains` キーワードが自動的に削除されます。

## テキスト読み上げ

Volcengine TTS は BytePlus Seed Speech HTTP API (`voice.ap-southeast-1.bytepluses.com`) を使用し、OpenAI 互換の Doubao モデル API キーとは別に設定されます。BytePlus コンソールで Seed Speech > Settings > API Keys を開き、API キーをコピーしてから、次を設定します。

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

`messages.tts.providers.volcengine` で利用可能なフィールド: `apiKey`、`voice`、`speedRatio` (0.2-3.0)、`emotion`、`cluster`、`resourceId`、`appKey`、`baseUrl`。音声設定の上書きが許可されている場合、`!emotion=<value>` もインライン音声ディレクティブとして機能します。

ボイスメモの対象では、OpenClaw はプロバイダー ネイティブの `ogg_opus` を要求します。通常の音声添付では、`mp3` を要求します。プロバイダーエイリアス `bytedance` と `doubao` もこの音声プロバイダーに解決されます。

デフォルトのリソース ID は `seed-tts-1.0` で、新しく作成された Seed Speech API キーに BytePlus がデフォルトで付与するエンタイトルメントです。プロジェクトに TTS 2.0 エンタイトルメントがある場合は、`VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` を設定します。

<Warning>
`VOLCANO_ENGINE_API_KEY` は ModelArk/Doubao モデルエンドポイント用であり、Seed Speech API キーではありません。TTS には BytePlus Speech Console の Seed Speech API キー、またはレガシーの Speech Console AppID/token ペアが必要です。
</Warning>

レガシーの AppID/token 認証は、古い Speech Console アプリケーション向けに引き続きサポートされています。

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

その他の任意の TTS 環境変数: `VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY`、`VOLCENGINE_TTS_BASE_URL` は、設定されている場合、対応する `messages.tts.providers.volcengine` 設定フィールドを上書きします。

## 高度な設定

<AccordionGroup>
  <Accordion title="オンボーディング後のデフォルトモデル">
    `openclaw onboard --auth-choice volcengine-api-key` は、汎用 `volcengine` カタログも登録しながら、`volcengine-plan/ark-code-latest` をデフォルトモデルとして設定します。
  </Accordion>

  <Accordion title="モデルピッカーのフォールバック動作">
    オンボーディング/設定時のモデル選択中、Volcengine 認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー スコープのピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。
  </Accordion>

  <Accordion title="デーモンプロセス用の環境変数">
    Gateway がデーモン (launchd/systemd) として実行される場合、`VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN` などのモデルおよび TTS 環境変数が、そのプロセスで利用可能であることを確認してください (例: `~/.openclaw/.env` または `env.shellEnv` 経由)。
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw をバックグラウンドサービスとして実行する場合、対話型シェルで設定された環境変数は自動的には継承されません。上記のデーモンに関する注記を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
