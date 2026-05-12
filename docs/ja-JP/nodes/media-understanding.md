---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声/動画/画像の前処理のチューニング
sidebarTitle: Media understanding
summary: 受信した画像/音声/動画の理解（任意）、プロバイダー + CLI フォールバック付き
title: メディア理解
x-i18n:
    generated_at: "2026-05-12T08:45:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw は、返信パイプラインが実行される前に **受信メディアを要約**（画像/音声/動画）できます。ローカルツールまたはプロバイダーキーが利用可能な場合は自動検出し、無効化やカスタマイズもできます。理解がオフの場合でも、モデルは通常どおり元のファイル/URL を受け取ります。

ベンダー固有のメディア動作はベンダー Plugin によって登録されます。一方、OpenClaw core は共有の `tools.media` 設定、フォールバック順序、返信パイプライン統合を所有します。

## 目標

- 任意: 受信メディアを短いテキストに事前要約し、より速いルーティングとより良いコマンド解析を実現します。
- モデルへの元のメディア配信を保持します（常に）。
- **プロバイダー API** と **CLI フォールバック** をサポートします。
- 順序付きフォールバック（エラー/サイズ/タイムアウト）で複数モデルを許可します。

## 高レベルの動作

<Steps>
  <Step title="添付ファイルを収集">
    受信添付ファイル（`MediaPaths`, `MediaUrls`, `MediaTypes`）を収集します。
  </Step>
  <Step title="機能ごとに選択">
    有効な各機能（画像/音声/動画）について、ポリシーに従って添付ファイルを選択します（デフォルト: **最初**）。
  </Step>
  <Step title="モデルを選択">
    最初の適格なモデルエントリ（サイズ + 機能 + 認証）を選択します。
  </Step>
  <Step title="失敗時にフォールバック">
    モデルが失敗した場合、またはメディアが大きすぎる場合は、**次のエントリにフォールバック**します。
  </Step>
  <Step title="成功ブロックを適用">
    成功時:

    - `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになります。
    - 音声は `{{Transcript}}` を設定します。キャプションテキストが存在する場合、コマンド解析はそれを使用し、存在しない場合はトランスクリプトを使用します。
    - キャプションはブロック内の `User text:` として保持されます。

  </Step>
</Steps>

理解に失敗した場合、または無効化されている場合でも、**返信フローは続行**され、元の本文 + 添付ファイルが使われます。

## 設定概要

`tools.media` は **共有モデル** に加えて、機能ごとの上書きをサポートします:

<AccordionGroup>
  <Accordion title="トップレベルキー">
    - `tools.media.models`: 共有モデルリスト（`capabilities` を使ってゲートします）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - デフォルト（`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`）
      - プロバイダー上書き（`baseUrl`, `headers`, `providerOptions`）
      - `tools.media.audio.providerOptions.deepgram` 経由の Deepgram 音声オプション
      - 音声トランスクリプトのエコー制御（`echoTranscript`, デフォルト `false`; `echoFormat`）
      - 任意の **機能ごとの `models` リスト**（共有モデルより優先）
      - `attachments` ポリシー（`mode`, `maxAttachments`, `prefer`）
      - `scope`（チャンネル/chatType/セッションキーによる任意のゲート）
    - `tools.media.concurrency`: 同時機能実行の最大数（デフォルト **2**）。

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

### モデルエントリ

各 `models[]` エントリは **プロバイダー** または **CLI** にできます:

<Tabs>
  <Tab title="プロバイダーエントリ">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
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

    CLI テンプレートでは次も使用できます:

    - `{{MediaDir}}`（メディアファイルを含むディレクトリ）
    - `{{OutputDir}}`（この実行用に作成されたスクラッチディレクトリ）
    - `{{OutputBase}}`（拡張子なしのスクラッチファイルベースパス）

  </Tab>
</Tabs>

## デフォルトと制限

推奨デフォルト:

- `maxChars`: 画像/動画は **500**（短く、コマンドに適した長さ）
- `maxChars`: 音声は **未設定**（制限を設定しない限り全文トランスクリプト）
- `maxBytes`:
  - 画像: **10MB**
  - 音声: **20MB**
  - 動画: **50MB**

<AccordionGroup>
  <Accordion title="ルール">
    - メディアが `maxBytes` を超える場合、そのモデルはスキップされ、**次のモデルが試行**されます。
    - **1024 バイト**未満の音声ファイルは空または破損として扱われ、プロバイダー/CLI 文字起こしの前にスキップされます。受信返信コンテキストは決定的なプレースホルダートランスクリプトを受け取るため、エージェントはその音声メモが小さすぎたことを把握できます。
    - モデルが `maxChars` を超える結果を返した場合、出力は切り詰められます。
    - `prompt` のデフォルトは単純な "Describe the {media}." に `maxChars` のガイダンスを加えたものです（画像/動画のみ）。
    - アクティブなプライマリ画像モデルがすでにビジョンをネイティブにサポートしている場合、OpenClaw は `[Image]` 要約ブロックをスキップし、代わりに元の画像をモデルへ渡します。
    - Gateway/WebChat のプライマリモデルがテキストのみの場合、画像添付ファイルはオフロードされた `media://inbound/*` 参照として保持されるため、添付ファイルを失う代わりに、画像/PDF ツールまたは設定済み画像モデルが引き続き検査できます。
    - 明示的な `openclaw infer image describe --model <provider/model>` リクエストは別物です。`ollama/qwen2.5vl:7b` のような Ollama 参照を含め、その画像対応プロバイダー/モデルを直接実行します。
    - `<capability>.enabled: true` だがモデルが設定されていない場合、OpenClaw はそのプロバイダーが機能をサポートしていれば **アクティブな返信モデル** を試行します。

  </Accordion>
</AccordionGroup>

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled` が `false` に設定されて**おらず**、モデルを設定していない場合、OpenClaw は次の順序で自動検出し、**最初に動作するオプションで停止**します:

<Steps>
  <Step title="アクティブな返信モデル">
    そのプロバイダーが機能をサポートしている場合のアクティブな返信モデル。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` のプライマリ/フォールバック参照（画像のみ）。
    `provider/model` 参照を優先します。ベア参照は、一致が一意な場合に限り、設定済みの画像対応プロバイダーモデルエントリから修飾されます。
  </Step>
  <Step title="ローカル CLI（音声のみ）">
    ローカル CLI（インストール済みの場合）:

    - `sherpa-onnx-offline`（encoder/decoder/joiner/tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要）
    - `whisper-cli`（`whisper-cpp`; `WHISPER_CPP_MODEL` またはバンドルされた tiny モデルを使用）
    - `whisper`（Python CLI; モデルを自動的にダウンロード）

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` を使用する `gemini`。
  </Step>
  <Step title="プロバイダー認証">
    - 機能をサポートする設定済みの `models.providers.*` エントリは、バンドルされたフォールバック順序より前に試行されます。
    - 画像対応モデルを持つ画像専用の設定プロバイダーは、バンドルされたベンダー Plugin でなくてもメディア理解に自動登録されます。
    - Ollama 画像理解は、たとえば `agents.defaults.imageModel` または `openclaw infer image describe --model ollama/<vision-model>` 経由で明示的に選択された場合に利用できます。

    バンドルされたフォールバック順序:

    - 音声: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 画像: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 動画: Google → Qwen → Moonshot

  </Step>
</Steps>

自動検出を無効にするには、次を設定します:

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
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開します）、完全なコマンドパスを持つ明示的な CLI モデルを設定してください。
</Note>

### プロキシ環境サポート（プロバイダーモデル）

プロバイダーベースの **音声** および **動画** メディア理解が有効な場合、OpenClaw はプロバイダー HTTP 呼び出しに対して標準の送信プロキシ環境変数を尊重します:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合、メディア理解は直接送信を使用します。プロキシ値の形式が不正な場合、OpenClaw は警告をログに記録し、直接フェッチにフォールバックします。

## 機能（任意）

`capabilities` を設定した場合、そのエントリはそれらのメディアタイプに対してのみ実行されます。共有リストの場合、OpenClaw はデフォルトを推論できます:

- `openai`, `anthropic`, `minimax`: **画像**
- `minimax-portal`: **画像**
- `moonshot`: **画像 + 動画**
- `openrouter`: **画像 + 音声**
- `google`（Gemini API）: **画像 + 音声 + 動画**
- `qwen`: **画像 + 動画**
- `mistral`: **音声**
- `zai`: **画像**
- `groq`: **音声**
- `xai`: **音声**
- `deepgram`: **音声**
- 画像対応モデルを持つ任意の `models.providers.<id>.models[]` カタログ: **画像**

CLI エントリでは、予期しない一致を避けるために **`capabilities` を明示的に設定**してください。`capabilities` を省略した場合、そのエントリは表示されているリストで適格になります。

## プロバイダーサポートマトリクス（OpenClaw 統合）

| 機能 | プロバイダー統合                                                                                                         | 注記                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 画像      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, 設定プロバイダー | ベンダー Plugin が画像サポートを登録します。`openai-codex/*` は OAuth プロバイダー配管を使用します。`codex/*` は境界付きの Codex app-server ターンを使用します。MiniMax と MiniMax OAuth はどちらも `MiniMax-VL-01` を使用します。画像対応の設定プロバイダーは自動登録されます。 |
| 音声      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | プロバイダー文字起こし（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                     |
| 動画      | Google, Qwen, Moonshot                                                                                                       | ベンダー Plugin 経由のプロバイダー動画理解。Qwen 動画理解は Standard DashScope エンドポイントを使用します。                                                                                                                        |

<Note>
**MiniMax 注記**

- `minimax` と `minimax-portal` の画像理解は、Plugin 所有の `MiniMax-VL-01` メディアプロバイダーから提供されます。
- バンドルされた MiniMax テキストカタログは引き続きテキストのみで開始します。明示的な `models.providers.minimax` エントリは、画像対応の M2.7 chat 参照を実体化します。

</Note>

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア機能で利用可能な最も強力な最新世代モデルを優先してください。
- 信頼できない入力を処理するツール有効エージェントでは、古い/弱いメディアモデルを避けてください。
- 可用性のために、機能ごとに少なくとも 1 つのフォールバックを維持してください（高品質モデル + より高速/低コストなモデル）。
- CLI フォールバック（`whisper-cli`, `whisper`, `gemini`）は、プロバイダー API が利用できない場合に有用です。
- `parakeet-mlx` 注記: `--output-dir` を指定した場合、出力形式が `txt`（または未指定）のとき、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の形式は stdout にフォールバックします。

## 添付ファイルポリシー

機能ごとの `attachments` は、どの添付ファイルを処理するかを制御します:

<ParamField path="mode" type='"first" | "all"' default="first">
  最初に選択された添付ファイルを処理するか、すべてを処理するか。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  処理する数を制限します。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候補の添付ファイル間での選択優先度。
</ParamField>

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` などのラベルが付けられます。

<AccordionGroup>
  <Accordion title="ファイル添付の抽出動作">
    - 抽出されたファイルテキストは、メディアプロンプトに追加される前に **信頼されていない外部コンテンツ** としてラップされます。
    - 注入されるブロックは `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、`Source: External` メタデータ行を含みます。
    - この添付ファイル抽出パスでは、メディアプロンプトの肥大化を避けるため、長い `SECURITY NOTICE:` バナーを意図的に省略しています。境界マーカーとメタデータは引き続き残ります。
    - ファイルに抽出可能なテキストがない場合、OpenClaw は `[No extractable text]` を注入します。
    - このパスで PDF がレンダリング済みページ画像にフォールバックする場合、添付ファイル抽出ステップはレンダリング済み PDF 画像ではなくテキストブロックを転送するため、メディアプロンプトにはプレースホルダー `[PDF content rendered to images; images not forwarded to model]` が保持されます。

  </Accordion>
</AccordionGroup>

## 設定例

<Tabs>
  <Tab title="共有モデル + オーバーライド">
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
  <Tab title="マルチモーダルの単一エントリ">
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

メディア理解が実行されると、`/status` には短い概要行が含まれます。

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

これは機能ごとの結果と、該当する場合は選択されたプロバイダー/モデルを示します。

## 注記

- 理解は **ベストエフォート** です。エラーが返信をブロックすることはありません。
- 理解が無効な場合でも、添付ファイルは引き続きモデルに渡されます。
- `scope` を使用して、理解を実行する場所を制限します（例: DM のみ）。

## 関連

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
