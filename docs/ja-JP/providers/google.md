---
read_when:
    - OpenClaw で Google Gemini モデルを使用したい
    - APIキーまたはOAuth認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

Google Plugin は、Google AI Studio 経由で Gemini モデルへのアクセスを提供し、さらに
画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Gemini Grounding による Web検索も提供します。

- Provider: `google`
- Auth: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime オプション: provider/model `agentRuntime.id: "google-gemini-cli"` は
  モデル参照を正規の `google/*` として保ちながら Gemini CLI OAuth を再利用します。

## はじめに

任意の認証方式を選び、セットアップ手順に従います。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio 経由の標準的な Gemini API アクセス。

    <Steps>
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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも利用できます。すでに設定している方を使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別の API キーではなく、PKCE OAuth 経由の既存の Gemini CLI ログインを再利用する場合。

    <Warning>
    `google-gemini-cli` provider は非公式の統合です。一部のユーザーは、
    この方法で OAuth を使用するとアカウント制限が発生すると報告しています。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストールする">
        ローカルの `gemini` コマンドが `PATH` で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は Homebrew インストールとグローバル npm インストールの両方をサポートしており、
        一般的な Windows/npm レイアウトも含みます。
      </Step>
      <Step title="OAuth 経由でログインする">
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
    - Runtime: `google-gemini-cli`
    - エイリアス: `gemini-cli`

    Gemini 3.1 Pro の Gemini API モデル ID は `gemini-3.1-pro-preview` です。OpenClaw は利便性のため、短い `google/gemini-3.1-pro` をエイリアスとして受け入れ、provider 呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、gateway ホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定してから再試行してください。
    </Note>

    <Note>
    ブラウザーフローが開始する前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照はレガシー互換エイリアスです。新しい
    設定では、ローカルの Gemini CLI 実行を使用したい場合、`google/*` モデル参照と `google-gemini-cli`
    runtime を併用してください。

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
| 思考/推論              | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 モデル         | はい                          |

## Web検索

バンドルされた `gemini` Web検索 provider は Gemini Google Search grounding を使用します。
`plugins.entries.google.config.webSearch` の下に専用の検索キーを設定するか、
`GEMINI_API_KEY` の後で `models.providers.google.apiKey` を再利用させます。

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
operator プロキシまたは互換性のある Gemini API エンドポイント向けに存在します。省略した場合、
Gemini Web検索は `models.providers.google.baseUrl` を再利用します。provider 固有のツール動作については
[Gemini search](/ja-JP/tools/gemini-search) を参照してください。

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は、
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を
`thinkingLevel` にマッピングするため、デフォルト/低レイテンシの実行で無効化された
`thinkingBudget` 値は送信されません。

`/think adaptive` は、固定の OpenClaw レベルを選ぶのではなく、Google の動的思考セマンティクスを維持します。
Gemini 3 と Gemini 3.1 は固定の `thinkingLevel` を省略するため、
Google がレベルを選択できます。Gemini 2.5 は Google の動的センチネル
`thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は思考モードをサポートします。OpenClaw は、
Gemma 4 向けに `thinkingBudget` をサポート対象の Google `thinkingLevel` に書き換えます。
思考を `off` に設定すると、`MINIMAL` にマッピングするのではなく、
思考の無効化が維持されます。
</Tip>

## 画像生成

バンドルされた `google` 画像生成 provider は、デフォルトで
`google/gemini-3.1-flash-image-preview` を使用します。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストあたり最大 4 画像
- 編集モード: 有効、入力画像は最大 5 枚
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像 provider として使用するには:

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
共有ツールパラメーター、provider 選択、フェイルオーバー動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

バンドルされた `google` Plugin は、共有の
`video_generate` ツール経由で動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`（`16:9`、`9:16`）と `resolution`（`720P`、`1080P`）をサポート。Veo は現在、音声出力をサポートしていません
- サポートされる長さ: **4、6、または 8 秒**（その他の値は最も近い許容値に丸められます）

Google をデフォルトの動画 provider として使用するには:

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
共有ツールパラメーター、provider 選択、フェイルオーバー動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

バンドルされた `google` Plugin は、共有の
`music_generate` ツール経由で音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、さらに `google/lyria-3-pro-preview` では `wav`
- 参照入力: 最大 10 画像
- セッションに基づく実行は、`action: "status"` を含む共有タスク/ステータスフローを通じて切り離されます

Google をデフォルトの音楽 provider として使用するには:

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
共有ツールパラメーター、provider 選択、フェイルオーバー動作については [Music Generation](/ja-JP/tools/music-generation) を参照してください。
</Note>

## テキスト読み上げ

バンドルされた `google` 音声 provider は、
`gemini-3.1-flash-tts-preview` を使用する Gemini API TTS パスを使用します。

- デフォルト音声: `Kore`
- Auth: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付では WAV、音声メモターゲットでは Opus、Talk/テレフォニーでは PCM
- 音声メモ出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

Google のバッチ Gemini TTS パスは、完了した
`generateContent` レスポンスで生成済み音声を返します。最も低レイテンシの音声会話には、バッチ
TTS ではなく Gemini Live API によって支えられた
Google リアルタイム音声 provider を使用してください。

Google をデフォルトの TTS provider として使用するには:

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
`audioProfile` を設定すると、話されるテキストの前に再利用可能なスタイルプロンプトを付加できます。
プロンプト本文で名前付きの話者に言及する場合は、`speakerName` を設定してください。

Gemini API TTS は、テキスト内の表現豊かな角括弧の音声タグも受け付けます。
たとえば `[whispers]` や `[laughs]` です。TTS に送信しながら、表示されるチャット返信からタグを除外するには、
それらを `[[tts:text]]...[[/tts:text]]`
ブロック内に置きます。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、この
provider で有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

バンドルされた `google` Plugin は、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに、
Gemini Live API によって支えられたリアルタイム音声 provider を登録します。

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
Google Live API は WebSocket 上で双方向音声と関数呼び出しを使用します。
OpenClaw は電話/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適応し、
ツール呼び出しを共有リアルタイム音声コントラクト上に保持します。サンプリング変更が必要な場合を除き、
`temperature` は未設定のままにしてください。OpenClaw は正でない値を省略します。
Google Live は `temperature: 0` の場合、音声なしで文字起こしを返すことがあるためです。
Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google
SDK はこの API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Control UI Talk は、制約付きの 1 回使用トークンによる Google Live ブラウザーセッションをサポートします。
バックエンド専用のリアルタイム音声プロバイダーも、汎用 Gateway リレートランスポートを通じて実行できます。
これにより、プロバイダー認証情報は Gateway 上に保持されます。
</Note>

メンテナー向けのライブ検証では、
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` を実行します。
この smoke は OpenAI バックエンド/WebRTC パスも対象にします。Google 側は Control UI Talk で使用されるものと同じ
制約付き Live API トークン形式を発行し、ブラウザーの
WebSocket エンドポイントを開き、初期セットアップペイロードを送信して、
`setupComplete` を待ちます。

## 高度な設定

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    直接 Gemini API 実行 (`api: "google-generative-ai"`) では、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストへ渡します。

    - モデルごとまたはグローバルパラメーターを、
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
    - `stats.input` がない場合、OpenClaw は入力トークンを
      `stats.input_tokens - stats.cached` から導出します。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Gateway がデーモン (launchd/systemd) として実行される場合、`GEMINI_API_KEY` が
    そのプロセスで利用可能であることを確認してください (たとえば、`~/.openclaw/.env` または
    `env.shellEnv` 経由)。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールパラメーターとプロバイダー選択。
  </Card>
</CardGroup>
