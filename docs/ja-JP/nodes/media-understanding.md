---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声/動画/画像の前処理の調整
sidebarTitle: Media understanding
summary: プロバイダー + CLI フォールバックによる受信画像/音声/動画理解（オプション）
title: メディア理解
x-i18n:
    generated_at: "2026-06-27T11:55:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClawは、返信パイプラインが実行される前に**受信メディアを要約**（画像/音声/動画）できます。ローカルツールまたはプロバイダーキーが利用可能な場合は自動検出され、無効化やカスタマイズもできます。理解がオフの場合でも、モデルは通常どおり元のファイル/URLを受け取ります。

ベンダー固有のメディア動作はベンダーPluginによって登録され、OpenClaw coreは共有の`tools.media`設定、フォールバック順序、返信パイプライン統合を所有します。

## 目標

- 任意: 受信メディアを短いテキストに事前消化し、ルーティングの高速化とコマンド解析の改善を行う。
- モデルへの元のメディア配信を保持する（常に）。
- **プロバイダーAPI**と**CLIフォールバック**をサポートする。
- 順序付きフォールバック（エラー/サイズ/タイムアウト）で複数モデルを許可する。

## 高レベルの動作

<Steps>
  <Step title="添付ファイルを収集">
    受信添付ファイル（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
  </Step>
  <Step title="機能ごとに選択">
    有効な各機能（画像/音声/動画）について、ポリシーに従って添付ファイルを選択します（デフォルト: **最初**）。
  </Step>
  <Step title="モデルを選択">
    最初の適格なモデルエントリ（サイズ + 機能 + 認証）を選択します。
  </Step>
  <Step title="失敗時にフォールバック">
    モデルが失敗するかメディアが大きすぎる場合、**次のエントリにフォールバック**します。
  </Step>
  <Step title="成功ブロックを適用">
    成功時:

    - `Body`は`[Image]`、`[Audio]`、または`[Video]`ブロックになります。
    - 音声は`{{Transcript}}`を設定します。コマンド解析は、キャプションテキストが存在する場合はそれを使用し、それ以外の場合は文字起こしを使用します。
    - キャプションはブロック内の`User text:`として保持されます。

  </Step>
</Steps>

理解が失敗するか無効な場合、**返信フローは続行**され、元の本文 + 添付ファイルが使用されます。

## 設定概要

`tools.media`は、**共有モデル**に加えて機能ごとのオーバーライドをサポートします。

<AccordionGroup>
  <Accordion title="トップレベルキー">
    - `tools.media.models`: 共有モデルリスト（ゲートには`capabilities`を使用）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - デフォルト（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
      - プロバイダーオーバーライド（`baseUrl`、`headers`、`providerOptions`）
      - `tools.media.audio.providerOptions.deepgram`によるDeepgram音声オプション
      - 音声文字起こしエコー制御（`echoTranscript`、デフォルト`false`、`echoFormat`）
      - 任意の**機能ごとの`models`リスト**（共有モデルより優先）
      - `attachments`ポリシー（`mode`、`maxAttachments`、`prefer`）
      - `scope`（チャンネル/chatType/セッションキーによる任意のゲート）
    - `tools.media.concurrency`: 同時機能実行の最大数（デフォルト**2**）。

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

各`models[]`エントリは**プロバイダー**または**CLI**にできます。

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
  <Tab title="CLIエントリ">
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

    CLIテンプレートでは次も使用できます。

    - `{{MediaDir}}`（メディアファイルを含むディレクトリ）
    - `{{OutputDir}}`（この実行用に作成されたスクラッチディレクトリ）
    - `{{OutputBase}}`（スクラッチファイルのベースパス、拡張子なし）

  </Tab>
</Tabs>

### プロバイダー認証情報（`apiKey`）

プロバイダーのメディア理解は、通常のモデル呼び出しと同じプロバイダー認証解決を使用します。認証プロファイル、環境変数、その後に`models.providers.<providerId>.apiKey`です。

`tools.media.*.models[]`エントリはインラインの`apiKey`フィールドを受け付けません。`openai`や`moonshot`など、メディアモデルエントリ内の`provider`値には、標準プロバイダー認証ソースのいずれかを通じて認証情報が利用可能である必要があります。

最小例:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

プロファイル、環境変数、カスタムベースURLを含む完全なプロバイダー認証リファレンスについては、[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## デフォルトと制限

推奨デフォルト:

- `maxChars`: 画像/動画は**500**（短く、コマンド向き）
- `maxChars`: 音声は**未設定**（制限を設定しない限り全文字起こし）
- `maxBytes`:
  - 画像: **10MB**
  - 音声: **20MB**
  - 動画: **50MB**

<AccordionGroup>
  <Accordion title="ルール">
    - メディアが`maxBytes`を超える場合、そのモデルはスキップされ、**次のモデルが試行**されます。
    - **1024バイト**未満の音声ファイルは空または破損として扱われ、プロバイダー/CLI文字起こしの前にスキップされます。受信返信コンテキストには決定論的なプレースホルダー文字起こしが渡されるため、エージェントはそのメモが小さすぎたことを認識できます。
    - モデルが`maxChars`を超えて返した場合、出力はトリミングされます。
    - `prompt`のデフォルトは、単純な「Describe the {media}.」に`maxChars`のガイダンスを加えたものです（画像/動画のみ）。
    - アクティブなプライマリ画像モデルがすでにネイティブでビジョンをサポートしている場合、OpenClawは`[Image]`要約ブロックをスキップし、代わりに元の画像をモデルへ渡します。
    - Gateway/WebChatのプライマリモデルがテキスト専用の場合、画像添付ファイルはオフロードされた`media://inbound/*`参照として保持されるため、添付ファイルを失う代わりに画像/PDFツールまたは設定済み画像モデルが引き続き検査できます。
    - 明示的な`openclaw infer image describe --model <provider/model>`リクエストは異なります。`ollama/qwen2.5vl:7b`などのOllama参照を含め、その画像対応プロバイダー/モデルを直接実行します。
    - `<capability>.enabled: true`だがモデルが設定されていない場合、OpenClawは、そのプロバイダーが機能をサポートしているときに**アクティブな返信モデル**を試行します。

  </Accordion>
</AccordionGroup>

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled`が`false`に設定されて**おらず**、モデルを設定していない場合、OpenClawは次の順序で自動検出し、**最初に動作するオプションで停止**します。

<Steps>
  <Step title="アクティブな返信モデル">
    プロバイダーがその機能をサポートしている場合のアクティブな返信モデル。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel`のプライマリ/フォールバック参照（画像のみ）。
    `provider/model`参照を優先します。裸の参照は、一致が一意の場合にのみ、設定済みの画像対応プロバイダーモデルエントリから修飾されます。
  </Step>
  <Step title="ローカルCLI（音声のみ）">
    ローカルCLI（インストール済みの場合）:

    - `sherpa-onnx-offline`（encoder/decoder/joiner/tokensを含む`SHERPA_ONNX_MODEL_DIR`が必要）
    - `whisper-cli`（`whisper-cpp`; `WHISPER_CPP_MODEL`または同梱のtinyモデルを使用）
    - `whisper`（Python CLI; モデルを自動的にダウンロード）

  </Step>
  <Step title="Gemini CLI">
    `read_many_files`を使用する`gemini`。
  </Step>
  <Step title="プロバイダー認証">
    - その機能をサポートする設定済みの`models.providers.*`エントリは、同梱フォールバック順序の前に試行されます。
    - 画像対応モデルを持つ画像専用設定プロバイダーは、同梱ベンダーPluginでなくてもメディア理解に自動登録されます。
    - Ollama画像理解は、`agents.defaults.imageModel`や`openclaw infer image describe --model ollama/<vision-model>`などを通じて明示的に選択された場合に利用できます。

    同梱フォールバック順序:

    - 音声: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 画像: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 動画: Google → Qwen → Moonshot

  </Step>
</Steps>

自動検出を無効にするには、次を設定します。

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
バイナリ検出はmacOS/Linux/Windows全体でベストエフォートです。CLIが`PATH`上にあることを確認するか（`~`は展開されます）、完全なコマンドパスを持つ明示的なCLIモデルを設定してください。
</Note>

### プロキシ環境サポート（プロバイダーモデル）

プロバイダーベースの**音声**および**動画**メディア理解が有効な場合、OpenClawはプロバイダーHTTP呼び出しに対して標準のアウトバウンドプロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合、メディア理解は直接送信を使用します。プロキシ値の形式が不正な場合、OpenClawは警告をログに記録し、直接取得にフォールバックします。

## 機能（任意）

`capabilities`を設定すると、そのエントリはそれらのメディアタイプに対してのみ実行されます。共有リストの場合、OpenClawはデフォルトを推論できます。

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
- 画像対応モデルを含む任意の`models.providers.<id>.models[]`カタログ: **画像**

CLIエントリでは、予期しない一致を避けるために**`capabilities`を明示的に設定**してください。`capabilities`を省略した場合、そのエントリは出現しているリストに対して適格です。

## プロバイダーサポート表（OpenClaw統合）

| 機能 | プロバイダー統合                                                                                                         | 注記                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 画像      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, 設定プロバイダー | ベンダーPluginが画像サポートを登録します。`openai/*`はAPIキーまたはCodex OAuthルーティングを使用できます。`codex/*`は境界付きのCodex app-serverターンを使用します。MiniMaxとMiniMax OAuthはいずれも`MiniMax-VL-01`を使用します。画像対応の設定プロバイダーは自動登録されます。 |
| 音声      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | プロバイダー文字起こし（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                         |
| 動画      | Google, Qwen, Moonshot                                                                                                       | ベンダーPluginを介したプロバイダー動画理解。Qwen動画理解はStandard DashScopeエンドポイントを使用します。                                                                                                                            |

<Note>
**MiniMaxメモ**

- `minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` の画像理解は、Plugin が所有する `MiniMax-VL-01` メディアプロバイダーから提供されます。
- 自動画像ルーティングは、従来の MiniMax M2.x チャットメタデータが画像入力を主張している場合でも、`MiniMax-VL-01` を使い続けます。

</Note>

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア機能で利用可能な最新世代の最強モデルを優先します。
- 信頼できない入力を扱うツール対応エージェントでは、古い、または弱いメディアモデルを避けます。
- 可用性のため、機能ごとに少なくとも 1 つのフォールバックを保持します（高品質モデル + より高速または低コストなモデル）。
- CLI フォールバック（`whisper-cli`、`whisper`、`gemini`）は、プロバイダー API が利用できない場合に有用です。
- `parakeet-mlx` の注記: `--output-dir` を指定すると、出力形式が `txt`（または未指定）の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の形式では stdout にフォールバックします。

## 添付ファイルポリシー

機能ごとの `attachments` は、どの添付ファイルを処理するかを制御します。

<ParamField path="mode" type='"first" | "all"' default="first">
  最初に選択された添付ファイルを処理するか、すべて処理するか。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  処理する数の上限。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候補添付ファイルの中での選択優先度。
</ParamField>

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` などのラベルが付きます。

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - 抽出されたファイルテキストは、メディアプロンプトに追加される前に **信頼できない外部コンテンツ** としてラップされます。
    - 挿入されるブロックは、`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、`Source: External` メタデータ行を含みます。
    - この添付ファイル抽出パスでは、メディアプロンプトの肥大化を避けるため、長い `SECURITY NOTICE:` バナーを意図的に省略します。境界マーカーとメタデータは引き続き残ります。
    - ファイルに抽出可能なテキストがない場合、OpenClaw は `[No extractable text]` を挿入します。
    - このパスで PDF がレンダリング済みページ画像にフォールバックした場合、メディアプロンプトは `[PDF content rendered to images; images not forwarded to model]` プレースホルダーを保持します。この添付ファイル抽出ステップは、レンダリングされた PDF 画像ではなくテキストブロックを転送するためです。

  </Accordion>
</AccordionGroup>

## 設定例

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

これは、機能ごとの結果と、該当する場合は選択されたプロバイダー/モデルを示します。

## 注記

- 理解は **ベストエフォート** です。エラーが返信をブロックすることはありません。
- 理解が無効な場合でも、添付ファイルはモデルに渡されます。
- `scope` を使用して、理解を実行する場所を制限します（例: DM のみ）。

## 関連

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
