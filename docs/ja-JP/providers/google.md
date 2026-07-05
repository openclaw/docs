---
read_when:
    - OpenClaw で Google Gemini モデルを使用したい場合
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini セットアップ (API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-05T11:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c73a556012cf9560a4f5f99838f538e32ab66250fcec902149af79672f1184da
    source_path: providers/google.md
    workflow: 16
---

Google Plugin は、Google AI Studio を通じた Gemini モデルへのアクセスに加えて、画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Gemini Grounding によるウェブ検索を提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agentRuntime.id: "google-gemini-cli"` は Gemini CLI OAuth を再利用しつつ、モデル参照を `google/*` として正規のまま保持します。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio を通じた標準的な Gemini API アクセス。

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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
    **最適な用途:** 個別の API キーではなく、PKCE OAuth による既存の Gemini CLI ログインを再利用する場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式の連携です。この方法で OAuth を使用すると
    アカウント制限を受けると報告しているユーザーもいます。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は、一般的な Windows/npm レイアウトを含め、Homebrew インストールとグローバル npm インストールの両方をサポートします。
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google/gemini-3.1-pro-preview`
    - ランタイム: `google-gemini-cli`
    - エイリアス: `gemini-cli`

    Gemini 3.1 Pro の Gemini API モデル ID は `gemini-3.1-pro-preview` です。OpenClaw は利便性のために短い `google/gemini-3.1-pro` をエイリアスとして受け付け、プロバイダー呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Gemini CLI OAuth リクエストがログイン後に失敗する場合は、Gateway ホストで
    `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザーフローの開始前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照はレガシー互換エイリアスです。新しい
    設定では、ローカル Gemini CLI 実行を使用したい場合、`google/*` モデル参照と `google-gemini-cli`
    ランタイムを使用してください。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` は 2026-03-09 に廃止されました。代わりに `google/gemini-3.1-pro-preview` を使用してください。Gemini API キーのセットアップ（`openclaw onboard --auth-choice gemini-api-key` または `openclaw models auth login --provider google`）を再実行すると、古い設定済みデフォルトが現在のモデルに書き換えられます。
</Note>

## 機能

| 機能                   | サポート                      |
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
| 思考/推論              | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 モデル         | はい                          |

## ウェブ検索

バンドルされた `gemini` ウェブ検索プロバイダーは、Gemini Google Search grounding を使用します。
専用の検索キーを `plugins.entries.google.config.webSearch` に設定するか、
`GEMINI_API_KEY` の後に `models.providers.google.apiKey` を再利用させます。

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

認証情報の優先順位は、専用の `webSearch.apiKey`、次に `GEMINI_API_KEY`、
次に `models.providers.google.apiKey` です。`webSearch.baseUrl` は省略可能で、
運用者のプロキシまたは互換 Gemini API エンドポイント用に存在します。省略された場合、
Gemini ウェブ検索は `models.providers.google.baseUrl` を再利用します。プロバイダー固有のツール動作については
[Gemini 検索](/ja-JP/tools/gemini-search) を参照してください。

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングするため、デフォルト/低レイテンシ実行では無効な
`thinkingBudget` 値を送信しません。

`/think adaptive` は固定の OpenClaw レベルを選ぶ代わりに、Google の動的思考セマンティクスを保持します。
Gemini 3 と Gemini 3.1 は固定の `thinkingLevel` を省略し、
Google がレベルを選択できるようにします。Gemini 2.5 は Google の動的センチネル
`thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は思考モードをサポートします。OpenClaw は
Gemma 4 向けに `thinkingBudget` をサポートされている Google の `thinkingLevel` に書き換えます。
思考を `off` に設定すると、`MINIMAL` にマッピングせずに思考の無効化を保持します。

Gemini 2.5 Pro は思考モードでのみ動作し、明示的な
`thinkingBudget: 0` を拒否します。OpenClaw は Gemini 2.5 Pro リクエストでその値を
送信せずに取り除きます。
</Tip>

## 画像生成

バンドルされた `google` 画像生成プロバイダーのデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストあたり最大 4 画像
- 編集モード: 有効、最大 5 入力画像
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像プロバイダーとして使用するには:

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

バンドルされた `google` Plugin は、共有
`video_generate` ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`（`16:9`、`9:16`）と `resolution`（`720P`、`1080P`）をサポートします。音声出力は現在 Veo でサポートされていません
- サポートされる長さ: **4、6、または 8 秒**（その他の値は最も近い許可値に丸められます）

Google をデフォルトの動画プロバイダーとして使用するには:

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

バンドルされた `google` Plugin は、共有
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、`google/lyria-3-pro-preview` では `wav` も使用可能
- 参照入力: 最大 10 画像
- セッションに基づく実行は、`action: "status"` を含む共有タスク/ステータスフローを通じて切り離されます

Google をデフォルトの音楽プロバイダーとして使用するには:

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

## テキスト読み上げ

バンドルされた `google` 音声プロバイダーは、Gemini API TTS パスを
`gemini-3.1-flash-tts-preview` とともに使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付は WAV、ボイスメモ対象は Opus、Talk/電話は PCM
- ボイスメモ出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

Google のバッチ Gemini TTS パスは、完了した
`generateContent` レスポンスで生成音声を返します。最も低レイテンシな音声会話には、バッチ
TTS ではなく Gemini Live API を基盤とする Google リアルタイム音声プロバイダーを使用してください。

Google をデフォルトの TTS プロバイダーとして使用するには:

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS はスタイル制御に自然言語プロンプトを使用します。
`speakerName` は、音声テキストの前に再利用可能なスタイルプロンプトを追加するために設定します。
プロンプトテキストが名前付き話者に言及する場合は `speakerName` を設定します。

Gemini API TTS は、テキスト内で `[whispers]` や `[laughs]` などの表現豊かな角括弧音声タグも受け付けます。
タグを表示されるチャット返信に含めずに TTS に送るには、
`[[tts:text]]...[[/tts:text]]` ブロック内に入れます。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、この
プロバイダーで有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

バンドルされた `google` Plugin は、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに、
Gemini Live API を基盤とするリアルタイム音声プロバイダーを登録します。

| 設定                  | 設定パス                                                            | デフォルト                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 音声                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | (未設定)                                                                              |
| VAD 開始感度         | `...google.startSensitivity`                                        | (未設定)                                                                              |
| VAD 終了感度         | `...google.endSensitivity`                                          | (未設定)                                                                              |
| 無音時間              | `...google.silenceDurationMs`                                       | (未設定)                                                                              |
| アクティビティ処理    | `...google.activityHandling`                                        | Google デフォルト、`start-of-activity-interrupts`                                     |
| ターン範囲            | `...google.turnCoverage`                                            | Google デフォルト、`only-activity`                                                    |
| 自動 VAD を無効化    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| セッション再開        | `...google.sessionResumption`                                       | `true`                                                                                |
| コンテキスト圧縮      | `...google.contextWindowCompression`                                | `true`                                                                                |
| API キー              | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

Voice Call リアルタイム設定の例:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API は、WebSocket 上で双方向音声と関数呼び出しを使用します。
OpenClaw は電話/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適合させ、
ツール呼び出しを共有リアルタイム音声コントラクト上に維持します。サンプリング変更が必要でない限り、`temperature`
は未設定のままにしてください。Google Live は `temperature: 0` の場合に音声なしで文字起こしを返すことがあるため、
OpenClaw は非正値を省略します。
Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google
SDK は、この API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Control UI Talk は、制約付きの使い捨てトークンによる Google Live ブラウザーセッションをサポートします。
バックエンド専用のリアルタイム音声プロバイダーも、汎用
Gateway リレートランスポート経由で実行でき、プロバイダー認証情報は Gateway に保持されます。
</Note>

メンテナーのライブ検証では、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
を実行します。
このスモークは OpenAI バックエンド/WebRTC パスもカバーします。Google 側は Control UI Talk で使用されるものと同じ
制約付き Live API トークン形状を発行し、ブラウザーの
WebSocket エンドポイントを開き、初期セットアップペイロードを送信して、
`setupComplete` を待機します。

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini キャッシュの直接再利用">
    直接 Gemini API を実行する場合 (`api: "google-generative-ai"`)、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストに渡します。

    - モデルごとまたはグローバルのパラメーターは、
      `cachedContent` またはレガシーの `cached_content` のいずれかで設定します
    - より具体的なスコープのパラメーター (グローバルよりモデルレベル) が常に優先されます。
      同じスコープ内で両方のキーが設定されている場合、`cached_content` が優先されます。
      予期しない動作を避けるため、スコープごとにキーは 1 つだけ使用してください。
    - 値の例: `cachedContents/prebuilt-context`
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

  <Accordion title="Gemini CLI 使用上の注意">
    `google-gemini-cli` OAuth プロバイダーを使用する場合、OpenClaw はデフォルトで Gemini
    CLI の `stream-json` 出力を使用し、最後の
    `stats` ペイロードから使用量を正規化します。レガシーの `--output-format json` 上書きは、引き続き
    JSON パーサーを使用します。

    - ストリーミングされた返信テキストは、アシスタントの `message` イベントから取得されます。
    - レガシー JSON 出力では、返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI が `usage` を空にした場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークンを導出します。

  </Accordion>

  <Accordion title="環境とデーモン設定">
    Gateway がデーモン (launchd/systemd) として実行される場合、`GEMINI_API_KEY`
    がそのプロセスで利用できることを確認してください (たとえば、`~/.openclaw/.env` または
    `env.shellEnv` 経由)。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダー選択。
  </Card>
</CardGroup>
