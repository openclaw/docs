---
read_when:
    - OpenClaw で Google Gemini モデルを使用したい
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、Web 検索）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T12:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Google pluginは、Google AI Studioを通じてGeminiモデルへのアクセスを提供し、さらに
画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Gemini Grounding経由のWeb検索も提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: provider/model `agentRuntime.id: "google-gemini-cli"` は、
  モデル参照を正規の `google/*` のまま保ちながら、Gemini CLI OAuthを再利用します。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="APIキー">
    **最適な用途:** Google AI Studioを通じた標準的なGemini APIアクセス。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        またはキーを直接渡します。

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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも受け付けられます。すでに設定済みのものを使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別のAPIキーの代わりに、PKCE OAuthによる既存のGemini CLIログインを再利用する場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式の連携です。この方法でOAuthを使用すると、
    アカウント制限が発生するという報告があります。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLIをインストールする">
        local の `gemini` コマンドが `PATH` で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClawは、一般的なWindows/npmレイアウトを含め、Homebrewインストールとグローバルnpmインストールの両方をサポートします。
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

    Gemini 3.1 ProのGemini APIモデルIDは `gemini-3.1-pro-preview` です。OpenClawは利便性のために短い `google/gemini-3.1-pro` をエイリアスとして受け付け、プロバイダー呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    ログイン後にGemini CLI OAuthリクエストが失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザフローが開始する前にログインが失敗する場合は、local の `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照はレガシー互換エイリアスです。新しい
    設定では、local のGemini CLI実行を使いたい場合、`google/*` モデル参照と `google-gemini-cli`
    ランタイムを使用してください。

  </Tab>
</Tabs>

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
| Web検索（Grounding）   | はい                          |
| Thinking/推論          | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4モデル          | はい                          |

## Web検索

バンドルされた `gemini` Web検索プロバイダーは、Gemini Google Search groundingを使用します。
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
次に `models.providers.google.apiKey` です。`webSearch.baseUrl` は任意であり、
オペレータープロキシや互換Gemini APIエンドポイント向けに存在します。省略した場合、
Gemini Web検索は `models.providers.google.baseUrl` を再利用します。プロバイダー固有のツール動作については
[Gemini検索](/ja-JP/tools/gemini-search) を参照してください。

<Tip>
Gemini 3モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClawは、
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングするため、デフォルト/低レイテンシ実行では無効化された
`thinkingBudget` 値を送信しません。

`/think adaptive` は、固定のOpenClawレベルを選ぶ代わりにGoogleの動的Thinkingセマンティクスを維持します。
Gemini 3とGemini 3.1は固定の `thinkingLevel` を省略するため、
Googleがレベルを選択できます。Gemini 2.5はGoogleの動的センチネル
`thinkingBudget: -1` を送信します。

Gemma 4モデル（例: `gemma-4-26b-a4b-it`）はThinkingモードをサポートします。OpenClawは、
Gemma 4向けに `thinkingBudget` をサポートされるGoogle `thinkingLevel` に書き換えます。
Thinkingを `off` に設定すると、`MINIMAL` にマッピングする代わりにThinking無効を保持します。
</Tip>

## 画像生成

バンドルされた `google` 画像生成プロバイダーのデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストあたり最大4枚の画像
- 編集モード: 有効、入力画像は最大5枚
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Googleをデフォルトの画像プロバイダーとして使用するには:

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

バンドルされた `google` pluginは、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`（`16:9`、`9:16`）と `resolution`（`720P`、`1080P`）をサポート。Veoは現在、音声出力をサポートしていません
- サポートされる長さ: **4、6、または8秒**（その他の値は最も近い許可値に丸められます）

Googleをデフォルトの動画プロバイダーとして使用するには:

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

バンドルされた `google` pluginは、共有の
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、さらに `google/lyria-3-pro-preview` では `wav`
- 参照入力: 最大10枚の画像
- セッションに基づく実行は、`action: "status"` を含む共有タスク/ステータスフローを通じてデタッチされます

Googleをデフォルトの音楽プロバイダーとして使用するには:

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

バンドルされた `google` 音声プロバイダーは、Gemini API TTSパスを
`gemini-3.1-flash-tts-preview` とともに使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常のTTS添付ではWAV、ボイスメモターゲットではOpus、Talk/テレフォニーではPCM
- ボイスメモ出力: Google PCMはWAVとしてラップされ、`ffmpeg` で48 kHz Opusにトランスコードされます

GoogleのバッチGemini TTSパスは、完了した
`generateContent` レスポンス内で生成音声を返します。最も低レイテンシな音声会話には、バッチ
TTSではなく、Gemini Live APIに基づくGoogleリアルタイム音声プロバイダーを使用してください。

GoogleをデフォルトのTTSプロバイダーとして使用するには:

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

Gemini API TTSは、スタイル制御に自然言語プロンプトを使用します。
発話テキストの前に再利用可能なスタイルプロンプトを付加するには、`audioProfile` を設定します。
プロンプトテキストが名前付き話者を参照する場合は、`speakerName` を設定します。

Gemini API TTSは、テキスト内の `[whispers]` や `[laughs]` のような表現力のある角括弧付き音声タグも受け付けます。
タグを表示されるチャット返信に出さずにTTSへ送信するには、`[[tts:text]]...[[/tts:text]]`
ブロック内に入れます。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini APIに制限されたGoogle Cloud Console APIキーは、この
プロバイダーで有効です。これは別のCloud Text-to-Speech APIパスではありません。
</Note>

## リアルタイム音声

バンドルされた `google` pluginは、Voice CallやGoogle Meetなどのバックエンド音声ブリッジ向けに、
Gemini Live APIに基づくリアルタイム音声プロバイダーを登録します。

| 設定                  | 設定パス                                                            | デフォルト                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 音声                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | (未設定)                                                                              |
| VAD 開始感度          | `...google.startSensitivity`                                        | (未設定)                                                                              |
| VAD 終了感度          | `...google.endSensitivity`                                          | (未設定)                                                                              |
| 無音時間              | `...google.silenceDurationMs`                                       | (未設定)                                                                              |
| アクティビティ処理    | `...google.activityHandling`                                        | Google のデフォルト、`start-of-activity-interrupts`                                   |
| ターン範囲            | `...google.turnCoverage`                                            | Google のデフォルト、`only-activity`                                                  |
| 自動 VAD を無効化     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| セッション再開        | `...google.sessionResumption`                                       | `true`                                                                                |
| コンテキスト圧縮      | `...google.contextWindowCompression`                                | `true`                                                                                |
| API キー              | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

Voice Call リアルタイム設定例:

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
Google Live API は、WebSocket 経由で双方向音声と関数呼び出しを使用します。
OpenClaw は電話/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適合させ、
ツール呼び出しを共有リアルタイム音声コントラクト上に維持します。サンプリング変更が必要な場合を除き、
`temperature` は未設定のままにしてください。Google Live は `temperature: 0` で音声なしの文字起こしを返すことがあるため、
OpenClaw は非正の値を省略します。
Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google
SDK はこの API パスで言語コードヒントを拒否します。
</Note>

<Note>
Control UI Talk は、制約付きの使い捨てトークンを使う Google Live ブラウザーセッションをサポートします。
バックエンド専用のリアルタイム音声プロバイダーも、汎用
Gateway リレー転送を通じて実行できます。この方式ではプロバイダーの認証情報は Gateway に保持されます。
</Note>

メンテナー向けのライブ検証では、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
を実行します。
このスモークは OpenAI バックエンド/WebRTC パスも対象にします。Google 側では Control UI Talk で使われるものと同じ
制約付き Live API トークン形状を発行し、ブラウザー
WebSocket エンドポイントを開き、初期セットアップペイロードを送信して、
`setupComplete` を待ちます。

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini キャッシュの直接再利用">
    Gemini API の直接実行 (`api: "google-generative-ai"`) では、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストに渡します。

    - モデルごと、またはグローバルのパラメーターを
      `cachedContent` またはレガシーの `cached_content` で設定します
    - 両方が存在する場合、`cachedContent` が優先されます
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

  <Accordion title="Gemini CLI の使用メモ">
    `google-gemini-cli` OAuth プロバイダーを使用する場合、OpenClaw はデフォルトで Gemini
    CLI の `stream-json` 出力を使用し、最終的な
    `stats` ペイロードから使用量を正規化します。レガシーの `--output-format json` オーバーライドでは、引き続き
    JSON パーサーを使用します。

    - ストリーミングされた返信テキストは、アシスタントの `message` イベントから取得されます。
    - レガシー JSON 出力では、返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI が `usage` を空のままにした場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークンを導出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway がデーモン (launchd/systemd) として実行される場合、`GEMINI_API_KEY`
    がそのプロセスで利用可能であることを確認してください。たとえば、`~/.openclaw/.env` または
    `env.shellEnv` 経由で設定します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
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
