---
read_when:
    - OpenClawでGoogle Geminiモデルを使用したい
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-02T05:03:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14605b88f0d1d7e01796d429113a73b2b52a48fde6443565dcb3db47653be5e7
    source_path: providers/google.md
    workflow: 16
---

Google プラグインは、Google AI Studio を通じた Gemini モデルへのアクセスに加えて、
画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Gemini Grounding 経由の Web 検索を提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  は Gemini CLI OAuth を再利用しつつ、モデル参照を `google/*` として正規形に保ちます。

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー">
    **最適な用途:** Google AI Studio を通じた標準の Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        またはキーを直接渡します:

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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも受け付けられます。すでに設定済みのものを使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 個別の API キーの代わりに、PKCE OAuth 経由の既存の Gemini CLI ログインを再利用する場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式のインテグレーションです。この方法で OAuth を使用すると
    アカウント制限が発生するという報告があります。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストール">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は Homebrew インストールとグローバル npm インストールの両方に対応しており、
        一般的な Windows/npm レイアウトも含まれます。
      </Step>
      <Step title="OAuth 経由でログイン">
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

    Gemini 3.1 Pro の Gemini API モデル ID は `gemini-3.1-pro-preview` です。OpenClaw は利便性のために短い `google/gemini-3.1-pro` をエイリアスとして受け付け、プロバイダー呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` のバリアント。）

    <Note>
    Gemini CLI OAuth リクエストがログイン後に失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定してから再試行してください。
    </Note>

    <Note>
    ブラウザーフローが始まる前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照はレガシー互換性エイリアスです。新しい
    設定では、ローカルの Gemini CLI 実行が必要な場合、`google/*` モデル参照と `google-gemini-cli`
    ランタイムを使用する必要があります。

  </Tab>
</Tabs>

## 機能

| 機能                   | 対応                          |
| ---------------------- | ----------------------------- |
| チャット補完           | はい                          |
| 画像生成               | はい                          |
| 音楽生成               | はい                          |
| テキスト読み上げ       | はい                          |
| リアルタイム音声       | はい (Google Live API)        |
| 画像理解               | はい                          |
| 音声文字起こし         | はい                          |
| 動画理解               | はい                          |
| Web 検索 (Grounding)   | はい                          |
| 思考/推論              | はい (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 モデル         | はい                          |

## Web 検索

同梱の `gemini` Web 検索プロバイダーは Gemini Google Search grounding を使用します。
専用の検索キーを `plugins.entries.google.config.webSearch` に設定するか、
`GEMINI_API_KEY` の後に `models.providers.google.apiKey` を再利用させます:

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
次に `models.providers.google.apiKey` です。`webSearch.baseUrl` は任意で、
オペレータープロキシまたは互換性のある Gemini API エンドポイント向けに存在します。省略した場合、
Gemini Web 検索は `models.providers.google.baseUrl` を再利用します。プロバイダー固有のツール動作については
[Gemini 検索](/ja-JP/tools/gemini-search) を参照してください。

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングし、デフォルト/低レイテンシの実行で無効化された
`thinkingBudget` 値を送信しないようにします。

`/think adaptive` は、固定の OpenClaw レベルを選ぶ代わりに Google の動的思考セマンティクスを維持します。
Gemini 3 と Gemini 3.1 は固定の `thinkingLevel` を省略し、
Google がレベルを選べるようにします。Gemini 2.5 は Google の動的センチネル
`thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は思考モードに対応しています。OpenClaw は
Gemma 4 向けに `thinkingBudget` を対応する Google `thinkingLevel` に書き換えます。
思考を `off` に設定すると、`MINIMAL` にマッピングするのではなく、
思考が無効のまま保持されます。
</Tip>

## 画像生成

同梱の `google` 画像生成プロバイダーは、デフォルトで
`google/gemini-3.1-flash-image-preview` を使用します。

- `google/gemini-3-pro-image-preview` にも対応
- 生成: リクエストごとに最大 4 枚の画像
- 編集モード: 有効、入力画像は最大 5 枚
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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

同梱の `google` プラグインは、共有の
`video_generate` ツールを通じた動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`、`resolution`、`audio` に対応
- 現在の長さの制限: **4 秒から 8 秒**

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

同梱の `google` プラグインは、共有の
`music_generate` ツールを通じた音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` にも対応
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、さらに `google/lyria-3-pro-preview` では `wav`
- 参照入力: 最大 10 枚の画像
- セッションに基づく実行は、`action: "status"` を含む共有のタスク/ステータスフローを通じて切り離されます

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

## テキスト読み上げ

同梱の `google` 音声プロバイダーは、`gemini-3.1-flash-tts-preview` を使用する
Gemini API TTS パスを使います。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付では WAV、ボイスメモ対象では Opus、Talk/電話では PCM
- ボイスメモ出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS は、スタイル制御に自然言語プロンプトを使用します。
読み上げテキストの前に再利用可能なスタイルプロンプトを追加するには、
`audioProfile` を設定します。プロンプトテキストが名前付き話者に言及する場合は、
`speakerName` を設定します。

Gemini API TTS は、テキスト内の表現豊かな角括弧付き音声タグも受け付けます。
たとえば `[whispers]` や `[laughs]` です。タグを表示されるチャット返信から除外しながら
TTS へ送信するには、`[[tts:text]]...[[/tts:text]]`
ブロック内に入れます:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、この
プロバイダーで有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

同梱の `google` プラグインは、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに
Gemini Live API を基盤とするリアルタイム音声プロバイダーを登録します。

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
                voice: "Kore",
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
Google Live API は、双方向音声と WebSocket 経由の関数呼び出しを使用します。
OpenClaw は電話/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適応させ、
ツール呼び出しを共有リアルタイム音声コントラクト上に維持します。サンプリング変更が必要な場合を除き、`temperature`
は未設定のままにしてください。OpenClaw は正でない値を省略します。
Google Live は `temperature: 0` で音声なしのトランスクリプトを返す場合があるためです。
Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google
SDK はこの API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Control UI Talk は、制約付きの使い捨て
トークンを使った Google Live ブラウザーセッションをサポートします。バックエンド専用のリアルタイム音声プロバイダーも、汎用
Gateway リレートランスポート経由で実行でき、プロバイダー認証情報は Gateway 上に保持されます。
</Note>

メンテナーによるライブ検証では、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` を実行します。
Google 側は Control
UI Talk で使われるものと同じ制約付き Live API トークン形状を発行し、ブラウザー WebSocket エンドポイントを開き、初期セットアップペイロードを送信し、
`setupComplete` を待ちます。

## 高度な設定

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    直接 Gemini API 実行 (`api: "google-generative-ai"`) では、OpenClaw
    は設定された `cachedContent` ハンドルを Gemini リクエストへ渡します。

    - モデルごと、またはグローバルパラメーターとして
      `cachedContent` または従来の `cached_content` で設定します
    - 両方が存在する場合は、`cachedContent` が優先されます
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

  <Accordion title="Gemini CLI JSON usage notes">
    `google-gemini-cli` OAuth プロバイダーを使用する場合、OpenClaw は
    CLI JSON 出力を次のように正規化します。

    - 返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI が `usage` を空のままにした場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` が欠落している場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークンを導出します。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Gateway がデーモン (launchd/systemd) として実行される場合は、`GEMINI_API_KEY`
    がそのプロセスで利用できるようにしてください (たとえば、`~/.openclaw/.env` 内、または
    `env.shellEnv` 経由)。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダー選択。
  </Card>
</CardGroup>
