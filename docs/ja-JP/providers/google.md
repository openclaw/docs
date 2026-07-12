---
read_when:
    - OpenClaw で Google Gemini モデルを使用する場合
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-07-12T14:47:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Google Plugin は、Google AI Studio 経由で Gemini モデルへのアクセスを提供するほか、画像生成、メディア理解（画像／音声／動画）、テキスト読み上げ、Gemini Grounding によるウェブ検索を提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agentRuntime.id: "google-gemini-cli"` は、モデル参照を正規の `google/*` のまま維持しつつ、Gemini CLI OAuth を再利用します。

## はじめに

希望する認証方式を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー">
    **最適な用途:** Google AI Studio 経由での標準的な Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行">
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
      <Step title="デフォルトモデルを設定">
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
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも使用できます。すでに設定済みの方を使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI（OAuth）">
    **最適な用途:** 別の API キーを使用せず、PKCE OAuth による既存の Gemini CLI ログインを再利用する場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式の統合です。この方法で OAuth を使用すると、
    アカウントが制限される場合があるとの報告があります。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストール">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # または npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は Homebrew インストールとグローバル npm インストールの両方をサポートしており、
        一般的な Windows/npm の配置にも対応しています。
      </Step>
      <Step title="OAuth でログイン">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google/gemini-3.1-pro-preview`
    - ランタイム: `google-gemini-cli`
    - エイリアス: `gemini-cli`

    Gemini 3.1 Pro の Gemini API モデル ID は `gemini-3.1-pro-preview` です。OpenClaw は便宜的なエイリアスとして短い `google/gemini-3.1-pro` も受け入れ、プロバイダー呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、Gateway ホストで
    `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザフローの開始前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照は、レガシー互換性のためのエイリアスです。ローカルで
    Gemini CLI を実行する新しい設定では、`google/*` モデル参照と
    `google-gemini-cli` ランタイムを使用してください。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` は 2026-03-09 に廃止されました。代わりに `google/gemini-3.1-pro-preview` を使用してください。Gemini API キーのセットアップ（`openclaw onboard --auth-choice gemini-api-key` または `openclaw models auth login --provider google`）を再実行すると、設定済みの古いデフォルトが現在のモデルに書き換えられます。
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
| 思考／推論             | はい（Gemini 2.5+ / Gemini 3+）|
| Gemma 4 モデル         | はい                          |

## ウェブ検索

同梱の `gemini` ウェブ検索プロバイダーは、Gemini Google Search Grounding を使用します。
`plugins.entries.google.config.webSearch` に専用の検索キーを設定するか、
`GEMINI_API_KEY` の後に `models.providers.google.apiKey` を再利用できます。

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

認証情報の優先順位は、専用の `webSearch.apiKey`、`GEMINI_API_KEY`、
`models.providers.google.apiKey` の順です。`webSearch.baseUrl` は任意であり、
運用者のプロキシまたは互換性のある Gemini API エンドポイント用に用意されています。省略した場合、
Gemini ウェブ検索は `models.providers.google.baseUrl` を再利用します。プロバイダー固有のツール動作については、
[Gemini 検索](/ja-JP/tools/gemini-search)を参照してください。

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は、
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングするため、デフォルトまたは低レイテンシーの実行で、無効化された
`thinkingBudget` 値は送信されません。

`/think adaptive` は固定の OpenClaw レベルを選択せず、Google の動的思考セマンティクスを維持します。
Gemini 3 と Gemini 3.1 では固定の `thinkingLevel` を省略し、
Google がレベルを選択できるようにします。Gemini 2.5 では Google の動的センチネル
`thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は思考モードをサポートします。OpenClaw は
Gemma 4 向けに `thinkingBudget` をサポートされている Google の `thinkingLevel` に
書き換えます。思考を `off` に設定すると、`MINIMAL` にマッピングせず、
思考を無効にした状態を維持します。

Gemini 2.5 Pro は思考モードでのみ動作し、明示的な
`thinkingBudget: 0` を拒否します。OpenClaw は Gemini 2.5 Pro のリクエストからその値を削除し、
送信しません。
</Tip>

## 画像生成

同梱の `google` 画像生成プロバイダーは、デフォルトで
`google/gemini-3.1-flash-image-preview` を使用します。

- `google/gemini-3-pro-image-preview` にも対応
- 生成: 1 リクエストあたり最大 4 枚の画像
- 編集モード: 有効、入力画像は最大 5 枚
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像プロバイダーとして使用するには、次のように設定します。

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

## 動画生成

同梱の `google` Plugin は、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`（`16:9`、`9:16`）と `resolution`（`720P`、`1080P`）に対応。現在、Veo は音声出力に対応していません
- 対応する長さ: **4、6、または 8 秒**（それ以外の値は、許可されている最も近い値に丸められます）

Google をデフォルトの動画プロバイダーとして使用するには、次のように設定します。

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 音楽生成

同梱の `google` Plugin は、共有の
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` にも対応
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`。`google/lyria-3-pro-preview` では `wav` にも対応
- 参照入力: 最大 10 枚の画像
- セッションに基づく実行は、`action: "status"` を含む共有のタスク／ステータスフローを通じてデタッチされます

Google をデフォルトの音楽プロバイダーとして使用するには、次のように設定します。

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation)を参照してください。
</Note>

## テキスト読み上げ

同梱の `google` 音声プロバイダーは、
`gemini-3.1-flash-tts-preview` を使用する Gemini API TTS パスを使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付ファイルには WAV、ボイスメモ対象には Opus、Talk／テレフォニーには PCM
- ボイスメモ出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

Google のバッチ Gemini TTS パスは、完了した
`generateContent` レスポンス内で生成済み音声を返します。最小レイテンシーの音声会話には、バッチ
TTS ではなく、Gemini Live API を基盤とする Google リアルタイム音声プロバイダーを使用してください。

Google をデフォルトの TTS プロバイダーとして使用するには、次のように設定します。

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

Gemini API TTS は、スタイル制御に自然言語プロンプトを使用します。
`audioProfile` を設定すると、読み上げるテキストの前に再利用可能なスタイルプロンプトが付加されます。
プロンプトテキストで名前付きの話者を参照する場合は、`speakerName` を設定してください。

Gemini API TTS は、テキスト内の `[whispers]` や `[laughs]` など、
表現力を指定する角括弧付きの音声タグも受け入れます。タグを表示されるチャット返信には含めず、
TTS に送信するには、`[[tts:text]]...[[/tts:text]]` ブロック内に配置します。

```text
これは簡潔な返信テキストです。

[[tts:text]][whispers] これは読み上げ版です。[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、この
プロバイダーで有効です。これは別の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

同梱の `google` Plugin は、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに、
Gemini Live API を基盤とするリアルタイム音声プロバイダーを登録します。

| 設定                         | 設定パス                                                            | デフォルト                                                                            |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 音声                         | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature                  | `...google.temperature`                                             | （未設定）                                                                            |
| VAD 開始感度                 | `...google.startSensitivity`                                        | （未設定）                                                                            |
| VAD 終了感度                 | `...google.endSensitivity`                                          | （未設定）                                                                            |
| 無音時間                     | `...google.silenceDurationMs`                                       | （未設定）                                                                            |
| アクティビティ処理           | `...google.activityHandling`                                        | Google のデフォルト、`start-of-activity-interrupts`                                   |
| ターンの対象範囲             | `...google.turnCoverage`                                            | Google のデフォルト、`audio-activity-and-all-video`                                   |
| 自動 VAD を無効化            | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| セッション再開               | `...google.sessionResumption`                                       | `true`                                                                                |
| コンテキスト圧縮             | `...google.contextWindowCompression`                                | `true`                                                                                |
| API キー                     | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、`GOOGLE_API_KEY` の順にフォールバック |

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
ツール呼び出しには共有のリアルタイム音声コントラクトを使用します。サンプリングを変更する必要がない限り、
`temperature` は未設定のままにしてください。Google Live では `temperature: 0` の場合に
音声なしで文字起こしが返されることがあるため、OpenClaw は正でない値を省略します。
Gemini API の文字起こしは `languageCodes` なしで有効になります。現在の Google
SDK は、この API パスでは言語コードのヒントを拒否します。
</Note>

<Note>
Gemini 3.1 Live はリアルタイム入力を通じて会話テキストを受け入れ、
関数を順次呼び出します。OpenClaw は、このモデルでは従来の `NON_BLOCKING`、関数
応答のスケジューリング、感情対話フィールドを省略します。`thinkingLevel` を優先してください。
設定された正の `thinkingBudget` 値は、サポートされている最も近いレベルにマッピングされ、
`-1` の場合は Google のデフォルトが維持されます。
[Gemini Live の機能比較](https://ai.google.dev/gemini-api/docs/live-api/capabilities)を参照してください。
</Note>

<Note>
Control UI Talk は、制限付きの使い捨てトークンを使用する Google Live ブラウザーセッションをサポートします。
バックエンド専用のリアルタイム音声プロバイダーも、汎用の
Gateway リレートランスポートを通じて実行できます。この方式では、プロバイダーの認証情報が Gateway に保持されます。
</Note>

メンテナーがライブ検証を行うには、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
を実行します。このスモークテストでは OpenAI のバックエンド／WebRTC パスも対象になります。Google の処理では、
Control UI Talk で使用されるものと同じ制限付き Live API トークン形式を発行し、ブラウザーの
WebSocket エンドポイントを開き、初期セットアップペイロードを送信して、
`setupComplete` を待ちます。

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini キャッシュの直接再利用">
    Gemini API を直接実行する場合（`api: "google-generative-ai"`）、OpenClaw は
    設定された `cachedContent` ハンドルを Gemini リクエストにそのまま渡します。

    - モデル単位またはグローバルのパラメーターを、
      `cachedContent` または旧形式の `cached_content` で設定します
    - より具体的なスコープのパラメーター（グローバルよりモデルレベル）が常に優先されます。
      同じスコープで両方のキーが設定されている場合は、`cached_content` が優先されます。
      予期しない動作を避けるため、スコープごとにキーを 1 つだけ使用してください。
    - 値の例：`cachedContents/prebuilt-context`
    - Gemini のキャッシュヒット使用量は、アップストリームの `cachedContentTokenCount` から
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
    CLI の `stream-json` 出力を使用し、最後の `stats` ペイロードから使用量を正規化します。
    従来の `--output-format json` オーバーライドでは、引き続き JSON パーサーが使用されます。

    - ストリーミングされた応答テキストは、アシスタントの `message` イベントから取得されます。
    - 従来の JSON 出力では、応答テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI の `usage` が空の場合、使用量には `stats` がフォールバックとして使用されます。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークン数を算出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン（launchd/systemd）として実行する場合は、`GEMINI_API_KEY` を
    そのプロセスで利用できるようにしてください（たとえば、`~/.openclaw/.env` または
    `env.shellEnv` を使用します）。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
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
