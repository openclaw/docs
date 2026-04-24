---
read_when:
    - OpenClaw で Google Gemini モデルを使いたい場合
    - API キーまたは OAuth 認証フローが必要な場合
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、Web 検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-24T05:14:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Google Plugin は、Google AI Studio 経由の Gemini モデルに加え、
画像生成、メディア理解（画像/音声/動画）、text-to-speech、Gemini Grounding 経由の Web 検索を提供します。

- Provider: `google`
- Auth: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替プロバイダー: `google-gemini-cli`（OAuth）

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー">
    **最適な用途:** Google AI Studio 経由の標準的な Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        または、キーを直接渡す:

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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも受け付けられます。すでに設定してあるほうを使ってください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI（OAuth）">
    **最適な用途:** 別の API キーではなく、既存の Gemini CLI ログインを PKCE OAuth 経由で再利用したい場合。

    <Warning>
    `google-gemini-cli` provider は非公式の統合です。この方法で OAuth を使うとアカウント制限がかかったという報告があります。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストールする">
        ローカルの `gemini` コマンドが `PATH` 上に存在している必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # または npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は Homebrew インストールとグローバル npm インストールの両方をサポートし、
        一般的な Windows/npm レイアウトもサポートしています。
      </Step>
      <Step title="OAuth 経由でログインする">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
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
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    browser フローが始まる前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされていて `PATH` 上にあることを確認してください。
    </Note>

    OAuth 専用の `google-gemini-cli` provider は、別個の text-inference
    サーフェスです。画像生成、メディア理解、Gemini Grounding は引き続き
    `google` provider ID 上にあります。

  </Tab>
</Tabs>

## 機能

| 機能                   | サポート状況                      |
| ---------------------- | --------------------------------- |
| Chat completions       | はい                              |
| 画像生成               | はい                              |
| 音楽生成               | はい                              |
| Text-to-speech         | はい                              |
| 画像理解               | はい                              |
| 音声文字起こし         | はい                              |
| 動画理解               | はい                              |
| Web 検索（Grounding）  | はい                              |
| Thinking/reasoning     | はい（Gemini 2.5+ / Gemini 3+）   |
| Gemma 4 モデル         | はい                              |

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使います。OpenClaw は
Gemini 3、Gemini 3.1、`gemini-*-latest` エイリアスの reasoning 制御を
`thinkingLevel` にマッピングするため、デフォルト/低レイテンシ実行で無効な
`thinkingBudget` 値は送信されません。

Gemma 4 モデル（たとえば `gemma-4-26b-a4b-it`）は thinking mode をサポートします。OpenClaw
は Gemma 4 に対して `thinkingBudget` をサポートされる Google の `thinkingLevel` に書き換えます。
thinking を `off` に設定すると、`MINIMAL` にマッピングするのではなく thinking 無効が保持されます。
</Tip>

## 画像生成

bundled の `google` image-generation provider は、デフォルトで
`google/gemini-3.1-flash-image-preview` を使います。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストごとに最大 4 枚
- 編集モード: 有効。最大 5 枚の入力画像
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像 provider として使うには:

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
共有 tool パラメーター、provider 選択、failover 動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

bundled の `google` Plugin は、共有
`video_generate` tool を通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、single-video 参照フロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の duration clamp: **4〜8 秒**

Google をデフォルトの動画 provider として使うには:

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
共有 tool パラメーター、provider 選択、failover 動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

bundled の `google` Plugin は、共有
`music_generate` tool を通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトで `mp3`、`google/lyria-3-pro-preview` では `wav` も可
- 参照入力: 最大 10 枚の画像
- セッションに裏打ちされた実行は、`action: "status"` を含む共有 task/status フローを通じて切り離される

Google をデフォルトの音楽 provider として使うには:

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
共有 tool パラメーター、provider 選択、failover 動作については [Music Generation](/ja-JP/tools/music-generation) を参照してください。
</Note>

## Text-to-speech

bundled の `google` speech provider は、Gemini API の TTS パスで
`gemini-3.1-flash-tts-preview` を使います。

- デフォルト voice: `Kore`
- Auth: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付には WAV、Talk/電話通信には PCM
- ネイティブなボイスノート出力: この Gemini API パスでは非サポート。API が Opus ではなく PCM を返すため

Google をデフォルトの TTS provider として使うには:

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

Gemini API TTS は、`[whispers]` や `[laughs]` のような、表現的な角括弧付き音声タグをテキスト内に受け付けます。タグを見えるチャット返信からは除外しつつ、TTS に送るには、`[[tts:text]]...[[/tts:text]]` ブロックの中に入れてください。

```text
これは見える返信テキストです。

[[tts:text]][whispers] これは読み上げ版です。[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API キーは、この
provider で有効です。これは別の Cloud Text-to-Speech API パスではありません。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="直接 Gemini キャッシュ再利用">
    直接 Gemini API 実行（`api: "google-generative-ai"`）では、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストにそのまま渡します。

    - `cachedContent` または旧来の `cached_content` のどちらでも、
      モデルごとまたはグローバルな params を設定できます
    - 両方存在する場合は `cachedContent` が優先されます
    - 例の値: `cachedContents/prebuilt-context`
    - Gemini の cache-hit 使用量は、上流の `cachedContentTokenCount` から
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

  <Accordion title="Gemini CLI JSON 使用量に関する注意">
    `google-gemini-cli` OAuth provider を使う場合、OpenClaw は
    CLI JSON 出力を次のように正規化します。

    - 返信テキストは CLI JSON の `response` フィールドから取得されます。
    - 使用量は、CLI が `usage` を空にした場合 `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` が欠けている場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力 token を導出します。

  </Accordion>

  <Accordion title="環境と daemon セットアップ">
    Gateway が daemon（launchd/systemd）として動作する場合は、`GEMINI_API_KEY`
    がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
    `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、failover 動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像 tool パラメーターと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画 tool パラメーターと provider 選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽 tool パラメーターと provider 選択。
  </Card>
</CardGroup>
