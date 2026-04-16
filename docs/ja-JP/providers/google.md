---
read_when:
    - OpenClawでGoogle Geminiモデルを使用したい場合
    - API キーまたはOAuth認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、Web 検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-16T19:31:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2d62855f5e80efda758aad71bcaa95c38b1e41761fa1100d47a06c62881419
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Google Pluginは、Google AI Studioを通じたGeminiモデルへのアクセスに加えて、
Gemini Groundingによる画像生成、メディア理解（画像/音声/動画）、テキスト読み上げ、Web検索を提供します。

- Provider: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替Provider: `google-gemini-cli`（OAuth）

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studioを通じた標準的なGemini APIアクセス。

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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも使用できます。すでに設定済みのものを使ってください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別のAPIキーではなく、PKCE OAuthを通じて既存のGemini CLIログインを再利用する場合。

    <Warning>
    `google-gemini-cli` Providerは非公式の統合です。一部のユーザーは、
    この方法でOAuthを使用した際にアカウント制限がかかったと報告しています。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLIをインストール">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClawはHomebrewインストールとグローバルnpmインストールの両方をサポートしており、
        一般的なWindows/npmレイアウトも含まれます。
      </Step>
      <Step title="OAuthでログイン">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    - エイリアス: `gemini-cli`

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    Gemini CLI OAuthリクエストがログイン後に失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザフローが始まる前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    OAuth専用の `google-gemini-cli` Providerは、別個のテキスト推論
    サーフェスです。画像生成、メディア理解、Gemini Groundingは
    引き続き `google` Provider id にあります。

  </Tab>
</Tabs>

## 機能

| 機能                     | サポート状況      |
| ------------------------ | ----------------- |
| チャット補完             | はい              |
| 画像生成                 | はい              |
| 音楽生成                 | はい              |
| テキスト読み上げ         | はい              |
| 画像理解                 | はい              |
| 音声文字起こし           | はい              |
| 動画理解                 | はい              |
| Web検索（Grounding）     | はい              |
| Thinking/reasoning       | はい（Gemini 3.1+） |
| Gemma 4モデル            | はい              |

<Tip>
Gemma 4モデル（たとえば `gemma-4-26b-a4b-it`）はthinking modeをサポートします。OpenClawは
Gemma 4向けに `thinkingBudget` をサポートされているGoogleの `thinkingLevel` に
書き換えます。thinkingを `off` に設定すると、`MINIMAL` にマッピングせずに
thinking無効のまま維持されます。
</Tip>

## 画像生成

バンドルされた `google` 画像生成Providerのデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストごとに最大4枚
- 編集モード: 有効、最大5枚の入力画像に対応
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Googleをデフォルトの画像Providerとして使用するには、次のようにします。

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
共通のツールパラメーター、Provider選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

## 動画生成

バンドルされた `google` Pluginは、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、single-video referenceフロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の時間制限: **4〜8秒**

Googleをデフォルトの動画Providerとして使用するには、次のようにします。

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
共通のツールパラメーター、Provider選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 音楽生成

バンドルされた `google` Pluginは、共有の
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトで `mp3`、`google/lyria-3-pro-preview` では `wav` も対応
- 参照入力: 最大10枚の画像
- セッションに裏打ちされた実行は、`action: "status"` を含む共有のタスク/ステータスフローを通じて分離されます

Googleをデフォルトの音楽Providerとして使用するには、次のようにします。

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
共通のツールパラメーター、Provider選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation)を参照してください。
</Note>

## テキスト読み上げ

バンドルされた `google` 音声Providerは、Gemini APIのTTSパスで
`gemini-3.1-flash-tts-preview` を使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常のTTS添付ではWAV、Talk/電話向けではPCM
- ネイティブなボイスノート出力: APIがOpusではなくPCMを返すため、このGemini APIパスでは非対応

GoogleをデフォルトのTTS Providerとして使用するには、次のようにします。

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
        },
      },
    },
  },
}
```

Gemini API TTSは、`[whispers]` や `[laughs]` のような表現付きの角括弧音声タグをテキスト内で受け付けます。
タグを表示されるチャット返信から除外しつつ
TTSに送るには、`[[tts:text]]...[[/tts:text]]` ブロック内に入れてください。

```text
ここに整形済みの返信テキストがあります。

[[tts:text]][whispers] こちらが読み上げ版です。[[/tts:text]]
```

<Note>
Gemini APIのみに制限されたGoogle Cloud Console APIキーは、この
Providerで有効です。これは別個のCloud Text-to-Speech APIパスではありません。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Geminiキャッシュの直接再利用">
    直接のGemini API実行（`api: "google-generative-ai"`）では、OpenClawは
    設定された `cachedContent` ハンドルをGeminiリクエストにそのまま渡します。

    - モデルごと、またはグローバルのparamsで
      `cachedContent` または旧来の `cached_content` を設定できます
    - 両方ある場合は、`cachedContent` が優先されます
    - 値の例: `cachedContents/prebuilt-context`
    - Geminiのキャッシュヒット使用量は、上流の `cachedContentTokenCount` から
      OpenClawの `cacheRead` に正規化されます

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

  <Accordion title="Gemini CLI JSON使用時の注意">
    `google-gemini-cli` OAuth Providerを使用する場合、OpenClawは
    CLIのJSON出力を次のように正規化します。

    - 返信テキストはCLI JSONの `response` フィールドから取得します。
    - CLIが `usage` を空のままにした場合、使用量は `stats` にフォールバックします。
    - `stats.cached` はOpenClawの `cacheRead` に正規化されます。
    - `stats.input` がない場合、OpenClawは
      `stats.input_tokens - stats.cached` から入力トークン数を導出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gatewayがデーモン（launchd/systemd）として動作する場合は、`GEMINI_API_KEY`
    がそのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
    `env.shellEnv` 内）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    Provider、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとProvider選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとProvider選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽ツールパラメーターとProvider選択。
  </Card>
</CardGroup>
