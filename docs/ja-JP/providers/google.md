---
read_when:
    - OpenClaw で Google Gemini モデルを使用する場合
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-07-16T12:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Google Pluginは、Google AI Studioを通じてGeminiモデルへのアクセスを提供するほか、画像生成、メディア理解（画像／音声／動画）、テキスト読み上げ、Gemini Groundingによるウェブ検索も提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agentRuntime.id: "google-gemini-cli"` はGemini CLI OAuthを再利用しつつ、モデル参照を正規の `google/*` として維持します。

## はじめに

希望する認証方法を選択し、セットアップ手順に従います。

<Tabs>
  <Tab title="APIキー">
    **最適な用途:** Google AI Studioを通じた標準的なGemini APIアクセス。

    <Steps>
      <Step title="APIキーを取得する">
        [Google AI Studio](https://aistudio.google.com/apikey)で無料のキーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも使用できます。すでに設定済みのものを使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 個別のAPIキーを使用せず、Gemini CLI OAuthを通じてGoogleアカウントでログインする場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式の統合です。この方法でOAuthを使用すると、
    アカウントが制限されたと報告するユーザーもいます。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLIをインストールする">
        ローカルの `gemini` コマンドが `PATH` で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # または npm
        npm install -g @google/gemini-cli
        ```

        OpenClawは、一般的なWindows/npmレイアウトを含め、Homebrewによるインストールと
        npmのグローバルインストールの両方をサポートしています。
      </Step>
      <Step title="OAuthでログインする">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google/gemini-3.1-pro-preview`
    - ランタイム: `google-gemini-cli`
    - エイリアス: `gemini-cli`

    Gemini 3.1 ProのGemini APIモデルIDは `gemini-3.1-pro-preview` です。OpenClawは便宜上、短い `google/gemini-3.1-pro` をエイリアスとして受け入れ、プロバイダーを呼び出す前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    ログイン後にGemini CLI OAuthリクエストが失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定し、再試行してください。
    </Note>

    <Note>
    ブラウザフローが開始する前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` に含まれていることを確認してください。
    </Note>

    オンボーディングの自動検出では既存のGemini CLIログインが一覧表示されますが、
    Gemini CLIにはツール不要のプローブがないため、自動テストは行われません。続行するには、
    Gemini CLI OAuthまたはGemini APIキーを選択してください。

    `google-gemini-cli/*` モデル参照は、レガシー互換性のためのエイリアスです。ローカルでGemini CLIを実行する
    新しい設定では、`google/*` モデル参照と `google-gemini-cli`
    ランタイムを使用してください。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` は2026-03-09に廃止されました。代わりに `google/gemini-3.1-pro-preview` を使用してください。Gemini APIキーのセットアップ（`openclaw onboard --auth-choice gemini-api-key` または `openclaw models auth login --provider google`）を再実行すると、設定に残っている古いデフォルトが現在のモデルに書き換えられます。
</Note>

## 機能

| 機能                   | サポート状況                  |
| ---------------------- | ----------------------------- |
| チャット補完           | はい                          |
| 画像生成               | はい                          |
| 音楽生成               | はい                          |
| テキスト読み上げ       | はい                          |
| リアルタイム音声       | はい（Google Live API）       |
| 画像理解               | はい                          |
| 音声文字起こし         | はい                          |
| 動画理解               | はい                          |
| ウェブ検索（Grounding）| はい                          |
| 思考／推論             | はい（Gemini 2.5+ / Gemini 3+）|
| Gemma 4モデル          | はい                          |

## ウェブ検索

同梱の `gemini` ウェブ検索プロバイダーは、Gemini Google Search Groundingを使用します。
`plugins.entries.google.config.webSearch` で専用の検索キーを設定するか、
`GEMINI_API_KEY` の後に `models.providers.google.apiKey` を再利用させます。

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY または models.providers.google.apiKey が設定されている場合は省略可能
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // models.providers.google.baseUrl にフォールバック
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

認証情報の優先順位は、専用の `webSearch.apiKey`、次に `GEMINI_API_KEY`、
その次に `models.providers.google.apiKey` です。`webSearch.baseUrl` は省略可能であり、
運用者のプロキシまたは互換性のあるGemini APIエンドポイント用に存在します。省略した場合、
Geminiウェブ検索は `models.providers.google.baseUrl` を再利用します。プロバイダー固有のツール動作については、
[Gemini検索](/ja-JP/tools/gemini-search)を参照してください。

<Tip>
Gemini 3モデルでは、`thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClawは、
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングし、デフォルトまたは低レイテンシーの実行で無効な
`thinkingBudget` 値が送信されないようにします。

`/think adaptive` は、固定のOpenClawレベルを選択する代わりに、Googleの動的思考セマンティクスを維持します。
Gemini 3とGemini 3.1では固定の `thinkingLevel` を省略してGoogleがレベルを選択できるようにし、
Gemini 2.5ではGoogleの動的センチネル `thinkingBudget: -1` を送信します。

Gemma 4モデル（例: `gemma-4-26b-a4b-it`）は思考モードをサポートしています。OpenClawは、
Gemma 4向けに `thinkingBudget` をサポートされているGoogleの `thinkingLevel` に書き換えます。
思考を `off` に設定すると、`MINIMAL` にマッピングせず、思考を無効のまま維持します。

Gemini 2.5 Proは思考モードでのみ動作し、明示的な
`thinkingBudget: 0` を拒否します。OpenClawはその値を送信せず、
Gemini 2.5 Proリクエストから取り除きます。
</Tip>

## 画像生成

同梱の `google` 画像生成プロバイダーのデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` にも対応
- 生成: リクエストあたり最大4枚の画像
- 編集モード: 有効、入力画像は最大5枚
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Googleをデフォルトの画像プロバイダーとして使用するには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
共通のツールパラメーター、プロバイダーの選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

## 動画生成

同梱の `google` Pluginは、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画の参照フロー
- `aspectRatio`（`16:9`、`9:16`）および `resolution`（`720P`、`1080P`）に対応。現在、Veoは音声出力に対応していません
- 対応する長さ: **4秒、6秒、または8秒**（その他の値は、許可されている最も近い値に調整されます）

Googleをデフォルトの動画プロバイダーとして使用するには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
共通のツールパラメーター、プロバイダーの選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 音楽生成

同梱の `google` Pluginは、共有の
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` にも対応
- プロンプト制御: `lyrics` および `instrumental`
- 出力形式: デフォルトは `mp3`、`google/lyria-3-pro-preview` では `wav` も使用可能
- 参照入力: 最大10枚の画像
- セッションを利用する実行は、`action: "status"` を含む共有のタスク／ステータスフローを通じてデタッチされます

Googleをデフォルトの音楽プロバイダーとして使用するには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
共通のツールパラメーター、プロバイダーの選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation)を参照してください。
</Note>

## テキスト読み上げ

同梱の `google` 音声プロバイダーは、
`gemini-3.1-flash-tts-preview` を使用するGemini API TTSパスを利用します。

- デフォルトの音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常のTTS添付ファイルではWAV、ボイスメモの宛先ではOpus、Talk／テレフォニーではPCM
- ボイスメモ出力: Google PCMはWAVとしてラップされ、`ffmpeg` を使用して48 kHz Opusにトランスコードされます

GoogleのバッチGemini TTSパスは、完了した
`generateContent` レスポンスで生成済み音声を返します。最小レイテンシーの音声会話には、
バッチTTSではなく、Gemini Live APIを基盤とするGoogleのリアルタイム音声プロバイダーを使用してください。

GoogleをデフォルトのTTSプロバイダーとして使用するには、次のように設定します。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "落ち着いた口調でプロフェッショナルに話してください。",
        },
      },
    },
  },
}
```

Gemini API TTSでは、スタイル制御に自然言語のプロンプトを使用します。
読み上げるテキストの前に再利用可能なスタイルプロンプトを付加するには、`audioProfile` を設定します。
プロンプトテキストで名前付きの話者を参照する場合は、`speakerName` を設定します。

Gemini API TTSでは、テキスト内に `[whispers]` や `[laughs]` などの
表現力のある角括弧付き音声タグも使用できます。タグを表示されるチャット返信には含めず、
TTSには送信するには、`[[tts:text]]...[[/tts:text]]` ブロック内に配置します。

```text
これは表示用の簡潔な返信テキストです。

[[tts:text]][whispers] これは読み上げ用のバージョンです。[[/tts:text]]
```

<Note>
Gemini APIに制限されたGoogle Cloud Console APIキーは、このプロバイダーで有効です。
これは別個のCloud Text-to-Speech APIパスではありません。
</Note>

## リアルタイム音声

同梱の `google` Pluginは、Voice CallやGoogle Meetなどのバックエンド音声ブリッジ向けに、
Gemini Live APIを基盤とするリアルタイム音声プロバイダーを登録します。

| 設定                  | 設定パス                                                            | デフォルト                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 音声                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | （未設定）                                                                            |
| VAD 開始感度          | `...google.startSensitivity`                                        | （未設定）                                                                            |
| VAD 終了感度          | `...google.endSensitivity`                                          | （未設定）                                                                            |
| 無音時間              | `...google.silenceDurationMs`                                       | （未設定）                                                                            |
| アクティビティ処理    | `...google.activityHandling`                                        | Google のデフォルト、`start-of-activity-interrupts`                                   |
| ターンの対象範囲      | `...google.turnCoverage`                                            | Google のデフォルト、`audio-activity-and-all-video`                                   |
| 自動 VAD を無効化     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| セッション再開        | `...google.sessionResumption`                                       | `true`                                                                                |
| コンテキスト圧縮      | `...google.contextWindowCompression`                                | `true`                                                                                |
| API キー              | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

Voice Call のリアルタイム設定例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API は、WebSocket 経由の双方向音声と関数呼び出しを使用します。
OpenClaw は、電話／Meet ブリッジの音声を Gemini の PCM Live API ストリームに適合させ、
ツール呼び出しには共有リアルタイム音声コントラクトを使用します。サンプリングの変更が必要な場合を除き、`temperature`
は未設定のままにしてください。Google Live は `temperature: 0` に対して音声なしで文字起こしを返すことがあるため、
OpenClaw は正でない値を省略します。
Gemini API の文字起こしは `languageCodes` なしで有効になります。現在の Google
SDK は、この API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Gemini 3.1 Live はリアルタイム入力を介して会話テキストを受け付け、
逐次関数呼び出しを使用します。OpenClaw は、このモデルでは古い `NON_BLOCKING`、関数
応答のスケジューリング、および感情対話フィールドを省略します。
`thinkingLevel` を推奨します。設定された正の `thinkingBudget` 値はサポートされる最も近いレベルに
マッピングされ、`-1` の場合は Google のデフォルトが維持されます。[Gemini Live の機能比較](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
を参照してください。
</Note>

<Note>
Control UI Talk は、制約付きの使い捨てトークンを使用する Google Live ブラウザセッションをサポートします。
バックエンド専用のリアルタイム音声プロバイダーも、汎用
Gateway リレートランスポートを介して実行でき、プロバイダーの認証情報は Gateway に保持されます。
</Note>

メンテナーがライブ検証を行うには、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` を実行します。
このスモークテストは OpenAI のバックエンド／WebRTC パスも対象とします。Google の処理では、Control UI Talk が使用するものと同じ
制約付き Live API トークン形式を発行し、ブラウザの
WebSocket エンドポイントを開いて、初期セットアップペイロードを送信し、
`setupComplete` を待機します。

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini キャッシュの直接再利用">
    Gemini API を直接実行する場合（`api: "google-generative-ai"`）、OpenClaw は、
    設定された `cachedContent` ハンドルを Gemini リクエストにそのまま渡します。

    - モデルごとまたはグローバルのパラメーターは、
      `cachedContent` または従来の `cached_content` のいずれかで設定します
    - より具体的なスコープのパラメーター（グローバルよりモデルレベル）が常に優先されます。
      同じスコープ内で両方のキーが設定されている場合は、`cached_content` が優先されます。
      予期しない動作を避けるため、スコープごとに使用するキーは 1 つだけにしてください。
    - 値の例：`cachedContents/prebuilt-context`
    - Gemini のキャッシュヒット使用量は、上流の `cachedContentTokenCount` から
      OpenClaw の `cacheRead` に正規化されます

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI の使用上の注意">
    `google-gemini-cli` OAuth プロバイダーを使用する場合、OpenClaw はデフォルトで Gemini
    CLI の `stream-json` 出力を使用し、最後の
    `stats` ペイロードから使用量を正規化します。従来の `--output-format json` オーバーライドでは、引き続き
    JSON パーサーを使用します。

    - ストリーミングされた応答テキストは、アシスタントの `message` イベントから取得されます。
    - 従来の JSON 出力では、応答テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI で `usage` が空の場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークン数を算出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン（launchd/systemd）として実行する場合は、そのプロセスから `GEMINI_API_KEY`
    を利用できることを確認してください（たとえば `~/.openclaw/.env` 内で設定するか、
    `env.shellEnv` を使用します）。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダーの選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダーの選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダーの選択。
  </Card>
</CardGroup>
