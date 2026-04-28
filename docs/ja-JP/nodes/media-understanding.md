---
read_when:
    - メディア理解を設計またはリファクタリングすること
    - 受信音声/動画/画像の前処理を調整すること
sidebarTitle: Media understanding
summary: 受信画像/音声/動画の理解（任意）。provider + CLI フォールバック付き
title: メディア理解
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:34:46Z"
  model: gpt-5.4
  provider: openai
  source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
  source_path: nodes/media-understanding.md
  workflow: 15
---

OpenClaw は、返信パイプラインの実行前に **受信メディアを要約**（画像/音声/動画）できます。ローカルツールや provider キーが利用可能なときは自動検出し、無効化やカスタマイズも可能です。理解機能がオフでも、モデルには元のファイル/URL が通常どおり渡されます。

vendor 固有のメディア動作は vendor Plugin によって登録され、OpenClaw core は共有の `tools.media` config、フォールバック順、返信パイプライン統合を管理します。

## 目標

- 任意機能: より高速なルーティングとよりよいコマンド解析のため、受信メディアを短いテキストに事前要約する。
- モデルへの元のメディア配信は常に維持する。
- **provider API** と **CLI フォールバック** をサポートする。
- 順序付きフォールバックを持つ複数モデルを許可する（エラー/サイズ/タイムアウト）。

## 高レベル動作

<Steps>
  <Step title="添付を収集する">
    受信添付（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
  </Step>
  <Step title="capability ごとに選択する">
    有効な capability（image/audio/video）ごとに、ポリシーに従って添付を選択します（デフォルト: **最初**）。
  </Step>
  <Step title="model を選ぶ">
    最初に条件を満たす model エントリ（サイズ + capability + auth）を選択します。
  </Step>
  <Step title="失敗時はフォールバックする">
    model が失敗するかメディアが大きすぎる場合、**次のエントリにフォールバック**します。
  </Step>
  <Step title="成功ブロックを適用する">
    成功時:

    - `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになります。
    - Audio は `{{Transcript}}` を設定します。コマンド解析では、caption テキストがあればそれを、なければ transcript を使用します。
    - caption はブロック内の `User text:` として保持されます。

  </Step>
</Steps>

理解に失敗した場合や無効化されている場合でも、**返信フローは継続**し、元の body + attachments が使われます。

## Config 概要

`tools.media` は **共有 model** と capability ごとのオーバーライドをサポートします。

<AccordionGroup>
  <Accordion title="トップレベルキー">
    - `tools.media.models`: 共有 model リスト（制御には `capabilities` を使用）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - デフォルト（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
      - provider オーバーライド（`baseUrl`、`headers`、`providerOptions`）
      - `tools.media.audio.providerOptions.deepgram` による Deepgram 音声オプション
      - 音声 transcript エコー制御（`echoTranscript`。デフォルト `false`、`echoFormat`）
      - 任意の capability ごとの `models` リスト（共有 model より優先）
      - `attachments` ポリシー（`mode`、`maxAttachments`、`prefer`）
      - `scope`（任意。channel/chatType/session key によるゲート）
    - `tools.media.concurrency`: capability 実行の最大同時数（デフォルト **2**）。

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Model エントリ

各 `models[]` エントリは **provider** または **CLI** にできます。

<Tabs>
  <Tab title="Provider エントリ">
    ```json5
    {
      type: "provider", // 省略時のデフォルト
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // 任意。multi-modal エントリに使用
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI エントリ">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI テンプレートでは次も使用できます。

    - `{{MediaDir}}`（メディアファイルを含むディレクトリ）
    - `{{OutputDir}}`（この実行用に作成される scratch dir）
    - `{{OutputBase}}`（拡張子なしの scratch ファイルベースパス）

  </Tab>
</Tabs>

## デフォルトと制限

推奨デフォルト:

- `maxChars`: image/video は **500**（短く、コマンドフレンドリー）
- `maxChars`: audio は **未設定**（制限を設定しない限り完全 transcript）
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="ルール">
    - メディアが `maxBytes` を超える場合、その model はスキップされ、**次の model が試されます**。
    - **1024 バイト**未満の音声ファイルは、provider/CLI の文字起こし前に空または破損として扱われスキップされます。受信返信コンテキストには、ノートが小さすぎたことを agent が理解できるよう、決定的なプレースホルダー transcript が入ります。
    - model が `maxChars` より多く返した場合、出力は切り詰められます。
    - `prompt` のデフォルトは単純な 「Describe the {media}.」 に `maxChars` ガイダンスを加えたものです（image/video のみ）。
    - active な primary image model がすでにネイティブに vision をサポートしている場合、OpenClaw は `[Image]` 要約ブロックをスキップし、代わりに元の画像をそのまま model に渡します。
    - Gateway/WebChat の primary model が text-only の場合、画像添付は offloaded な `media://inbound/*` ref として保持されるため、画像/PDF ツールや設定済み image model が添付を失わずに引き続き調査できます。
    - 明示的な `openclaw infer image describe --model <provider/model>` リクエストは別です。これは、その image-capable provider/model を直接実行します。`ollama/qwen2.5vl:7b` のような Ollama ref も含みます。
    - `<capability>.enabled: true` だが model が設定されていない場合、OpenClaw は、その provider が capability をサポートしていれば **active な reply model** を試します。

  </Accordion>
</AccordionGroup>

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled` が **`false` に設定されておらず**、model を設定していない場合、OpenClaw は次の順序で自動検出し、**最初に動作した選択肢で停止**します。

<Steps>
  <Step title="Active な reply model">
    provider が capability をサポートしている場合の active な reply model。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` の primary/fallback ref（image のみ）。
  </Step>
  <Step title="ローカル CLI（audio のみ）">
    インストール済みの場合のローカル CLI:

    - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR` に encoder/decoder/joiner/tokens が必要）
    - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL` またはバンドル済み tiny model を使用）
    - `whisper`（Python CLI。model を自動ダウンロード）

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` を使う `gemini`。
  </Step>
  <Step title="Provider 認証">
    - capability をサポートする設定済み `models.providers.*` エントリは、バンドル済みフォールバック順より先に試されます。
    - image-capable な model を持つ image-only config provider は、バンドル済み vendor Plugin でなくてもメディア理解用に自動登録されます。
    - Ollama の image 理解は、たとえば `agents.defaults.imageModel` や `openclaw infer image describe --model ollama/<vision-model>` を通じて明示的に選択された場合に利用できます。

    バンドル済みフォールバック順:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

自動検出を無効化するには、次のように設定します。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
バイナリ検出は macOS/Linux/Windows でベストエフォートです。CLI が `PATH` 上にあることを確認してください（`~` は展開されます）。または、完全な command path を持つ明示的な CLI model を設定してください。
</Note>

### プロキシ環境変数サポート（provider model）

provider ベースの **audio** および **video** メディア理解が有効な場合、OpenClaw は provider HTTP 呼び出しに対して標準の送信プロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ env var が設定されていない場合、メディア理解は直接外向き通信を使用します。プロキシ値の形式が不正な場合、OpenClaw は警告をログに記録し、直接取得にフォールバックします。

## Capabilities（任意）

`capabilities` を設定した場合、そのエントリはそれらのメディア型に対してのみ実行されます。共有リストでは、OpenClaw はデフォルトを推論できます。

- `openai`、`anthropic`、`minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google`（Gemini API）: **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- image-capable な model を持つ任意の `models.providers.<id>.models[]` カタログ: **image**

CLI エントリについては、予期しない一致を避けるため **`capabilities` を明示的に設定してください**。`capabilities` を省略すると、そのエントリは出現したリストに対して有効になります。

## Provider サポートマトリクス（OpenClaw 統合）

| Capability | Provider 統合                                                                                                                 | 注記                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI、OpenAI Codex OAuth、Codex app-server、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、config provider | vendor Plugin が image support を登録します。`openai-codex/*` は OAuth provider の配線を使用し、`codex/*` は制限付きの Codex app-server ターンを使用します。MiniMax と MiniMax OAuth はどちらも `MiniMax-VL-01` を使用し、image-capable な config provider は自動登録されます。 |
| Audio      | OpenAI、Groq、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral                                                          | provider 文字起こし（Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                                    |
| Video      | Google、Qwen、Moonshot                                                                                                        | vendor Plugin による provider 動画理解。Qwen の動画理解は Standard DashScope エンドポイントを使用します。                                                                                                                              |

<Note>
**MiniMax に関する注記**

`minimax` と `minimax-portal` の image 理解は、Plugin 所有の `MiniMax-VL-01` media provider から提供されます。バンドル済み MiniMax テキストカタログは引き続き text-only から始まります。明示的な `models.providers.minimax` エントリによって、image-capable な M2.7 chat ref が具体化されます。
</Note>

## Model 選択ガイダンス

- 品質と安全性が重要な場合は、各メディア capability に対して利用可能な最新世代の最も強力な model を優先してください。
- 信頼できない入力を扱うツール有効 agent では、古い/弱いメディア model は避けてください。
- 可用性のため、capability ごとに少なくとも 1 つのフォールバックを維持してください（高品質 model + 高速/低コスト model）。
- CLI フォールバック（`whisper-cli`、`whisper`、`gemini`）は、provider API が利用できない場合に有用です。
- `parakeet-mlx` に関する注記: `--output-dir` を使用すると、出力形式が `txt`（または未指定）の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の形式では stdout にフォールバックします。

## 添付ポリシー

capability ごとの `attachments` は、どの添付を処理するかを制御します。

<ParamField path="mode" type='"first" | "all"' default="first">
  最初に選択された添付だけを処理するか、すべて処理するか。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  処理数の上限。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候補添付の中での選択優先順位。
</ParamField>

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` などのラベルが付きます。

<AccordionGroup>
  <Accordion title="ファイル添付の抽出動作">
    - 抽出されたファイルテキストは、メディアプロンプトに追加される前に **信頼されていない外部コンテンツ** としてラップされます。
    - 注入されるブロックは、`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、`Source: External` メタデータ行を含みます。
    - この添付抽出経路では、メディアプロンプトが膨らみすぎないように、長い `SECURITY NOTICE:` バナーを意図的に省略します。ただし、境界マーカーとメタデータ自体は残ります。
    - ファイルに抽出可能なテキストがない場合、OpenClaw は `[No extractable text]` を注入します。
    - PDF がこの経路でレンダリング済みページ画像にフォールバックした場合、メディアプロンプトには `[PDF content rendered to images; images not forwarded to model]` というプレースホルダーが残ります。これは、この添付抽出ステップがレンダリング済み PDF 画像ではなくテキストブロックを転送するためです。

  </Accordion>
</AccordionGroup>

## Config 例

<Tabs>
  <Tab title="共有 model + オーバーライド">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="音声 + 動画のみ">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="画像のみ">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="単一エントリのマルチモーダル">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## ステータス出力

メディア理解が実行されると、`/status` には短い要約行が含まれます。

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

これは、capability ごとの結果と、該当する場合の選択された provider/model を示します。

## 注記

- 理解は **ベストエフォート** です。エラーがあっても返信はブロックされません。
- 理解が無効でも、添付は引き続きモデルに渡されます。
- 理解を実行する場所を制限するには `scope` を使ってください（例: DM のみ）。

## 関連

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
