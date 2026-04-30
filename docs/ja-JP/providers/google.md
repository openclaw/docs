---
read_when:
    - OpenClawでGoogle Geminiモデルを使用したい場合
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ (API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T05:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Google plugin は、Google AI Studio 経由で Gemini モデルへのアクセスを提供し、さらに画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Gemini Grounding によるウェブ検索も提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  は Gemini CLI OAuth を再利用しつつ、モデル参照を `google/*` として正規化された状態に保ちます。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio 経由の標準的な Gemini API アクセス。

    <Steps>
      <Step title="Run onboarding">
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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも使用できます。すでに設定済みのものを使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 個別の API キーではなく、PKCE OAuth による既存の Gemini CLI ログインを再利用する場合。

    <Warning>
    `google-gemini-cli` プロバイダーは非公式の連携です。この方法で OAuth を使用すると、アカウント制限が発生したという報告があります。自己責任で使用してください。
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

        OpenClaw は、Homebrew インストールとグローバル npm インストールの両方をサポートし、一般的な Windows/npm レイアウトにも対応しています。
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

    Gemini 3.1 Pro の Gemini API モデル ID は `gemini-3.1-pro-preview` です。OpenClaw は利便性のため、短い `google/gemini-3.1-pro` をエイリアスとして受け付け、プロバイダー呼び出しの前に正規化します。

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザーフローが開始する前にログインが失敗する場合は、ローカルの `gemini` コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照はレガシー互換性のためのエイリアスです。新しい設定では、ローカル Gemini CLI 実行を使いたい場合、`google/*` モデル参照と `google-gemini-cli` ランタイムを使用してください。

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
| ウェブ検索（Grounding） | はい                          |
| 思考/推論              | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 モデル         | はい                          |

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は、Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論制御を `thinkingLevel` にマッピングするため、デフォルト/低レイテンシ実行では無効化された `thinkingBudget` 値を送信しません。

`/think adaptive` は、固定の OpenClaw レベルを選ぶのではなく、Google の動的思考セマンティクスを維持します。Gemini 3 と Gemini 3.1 は固定の `thinkingLevel` を省略するため、Google がレベルを選択できます。Gemini 2.5 は Google の動的センチネル `thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は思考モードをサポートします。OpenClaw は Gemma 4 向けに `thinkingBudget` をサポートされている Google の `thinkingLevel` に書き換えます。思考を `off` に設定すると、`MINIMAL` にマッピングするのではなく、思考無効の状態を維持します。
</Tip>

## 画像生成

バンドルされている `google` 画像生成プロバイダーは、デフォルトで `google/gemini-3.1-flash-image-preview` を使用します。

- `google/gemini-3-pro-image-preview` もサポート
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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

## 動画生成

バンドルされている `google` plugin は、共有 `video_generate` ツールを通じて動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: テキストから動画、画像から動画、単一動画参照フロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の長さの制限: **4 秒から 8 秒**

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 音楽生成

バンドルされている `google` plugin は、共有 `music_generate` ツールを通じて音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、`google/lyria-3-pro-preview` では `wav` も使用可能
- 参照入力: 最大 10 枚の画像
- セッションベースの実行は、`action: "status"` を含む共有タスク/ステータスフローを通じてデタッチされます

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation)を参照してください。
</Note>

## テキスト読み上げ

バンドルされている `google` 音声プロバイダーは、`gemini-3.1-flash-tts-preview` を使う Gemini API TTS パスを使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付ファイルでは WAV、ボイスメモ対象では Opus、Talk/電話では PCM
- ボイスメモ出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS は、スタイル制御に自然言語プロンプトを使用します。読み上げテキストの前に再利用可能なスタイルプロンプトを付加するには、`audioProfile` を設定します。プロンプトテキストが名前付きの話者に言及する場合は、`speakerName` を設定します。

Gemini API TTS は、テキスト内の `[whispers]` や `[laughs]` などの表現力のある角括弧付き音声タグも受け付けます。タグを表示されるチャット返信に出さずに TTS に送信するには、`[[tts:text]]...[[/tts:text]]` ブロック内に入れます。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、このプロバイダーで有効です。これは別の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

バンドルされている `google` plugin は、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに、Gemini Live API を基盤とするリアルタイム音声プロバイダーを登録します。

| 設定                  | 設定パス                                                            | デフォルト                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 音声                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | （未設定）                                                                            |
| VAD 開始感度          | `...google.startSensitivity`                                        | （未設定）                                                                            |
| VAD 終了感度          | `...google.endSensitivity`                                          | （未設定）                                                                            |
| 無音時間              | `...google.silenceDurationMs`                                       | （未設定）                                                                            |
| アクティビティ処理    | `...google.activityHandling`                                        | Google デフォルト、`start-of-activity-interrupts`                                     |
| ターンカバレッジ      | `...google.turnCoverage`                                            | Google デフォルト、`only-activity`                                                    |
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
Google Live API は、WebSocket 上で双方向音声と関数呼び出しを使用します。
OpenClaw はテレフォニー/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適合させ、
ツール呼び出しを共有リアルタイム音声コントラクト上に維持します。サンプリングの変更が必要な場合を除き、`temperature`
は未設定のままにしてください。Google Live は `temperature: 0` の場合に音声なしで文字起こしを返すことがあるため、
OpenClaw は正でない値を省略します。
Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google
SDK は、この API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Control UI Talk は、制約付きの使い切りトークンを使用する Google Live ブラウザーセッションに対応しています。
バックエンド専用のリアルタイム音声プロバイダーも、汎用の
Gateway リレー transport 経由で実行でき、プロバイダーの認証情報は Gateway 上に保持されます。
</Note>

メンテナーによるライブ検証では、次を実行します。
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
Google 側は Control
UI Talk で使用されるものと同じ制約付き Live API トークン形状を発行し、ブラウザーの WebSocket エンドポイントを開き、初期セットアップペイロードを送信して、
`setupComplete` を待機します。

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini の直接キャッシュ再利用">
    Gemini API の直接実行（`api: "google-generative-ai"`）では、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストへ渡します。

    - モデルごと、またはグローバル params で
      `cachedContent` またはレガシーの `cached_content` を設定します
    - 両方が存在する場合は、`cachedContent` が優先されます
    - 値の例: `cachedContents/prebuilt-context`
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

  <Accordion title="Gemini CLI JSON 使用量の注意事項">
    `google-gemini-cli` OAuth プロバイダーを使用する場合、OpenClaw は
    CLI JSON 出力を次のように正規化します。

    - 応答テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI が `usage` を空のままにした場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークンを導出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway がデーモン（launchd/systemd）として実行される場合は、`GEMINI_API_KEY`
    がそのプロセスから利用できることを確認してください（たとえば、`~/.openclaw/.env` 内、または
    `env.shellEnv` 経由）。
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
