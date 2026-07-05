---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声/動画/画像の前処理のチューニング
sidebarTitle: Media understanding
summary: プロバイダー + CLI フォールバックによるインバウンド画像/音声/動画理解（任意）
title: メディア理解
x-i18n:
    generated_at: "2026-07-05T11:33:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aabf40780d3528fe8ee3e28782b9e19f624009f5f8684a015357bb27458150ef
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw は、返信パイプラインが実行される前に受信メディア（画像/音声/動画）を要約できるため、コマンド解析とルーティングは生バイトではなく短いテキストをもとに動作します。理解機能はローカルツールやプロバイダーキーを自動検出するか、明示的なモデルを設定できます。元のメディアは通常どおり常にモデルへ渡されます。理解に失敗した場合や無効化されている場合、返信フローは変更されずに続行されます。

ベンダー Plugin はケイパビリティメタデータ（どのプロバイダーがどのメディアタイプをサポートするか、デフォルトモデル、優先度）を登録します。OpenClaw コアは共有の `tools.media` 設定、フォールバック順序、返信パイプライン統合を所有します。

## 仕組み

<Steps>
  <Step title="添付ファイルを収集">
    受信添付ファイル（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
  </Step>
  <Step title="ケイパビリティごとに選択">
    有効化された各ケイパビリティ（画像/音声/動画）について、`attachments` ポリシーに従って添付ファイルを選択します（デフォルト: 最初の添付ファイルのみ）。
  </Step>
  <Step title="モデルを選択">
    最初に適格なモデルエントリ（サイズ + ケイパビリティ + 認証が利用可能）を選びます。
  </Step>
  <Step title="失敗時にフォールバック">
    モデルがエラーになる、タイムアウトする、またはメディアが `maxBytes` を超える場合は、次のエントリを試します。
  </Step>
  <Step title="成功時に適用">
    `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになります。音声では `{{Transcript}}` も設定されます。コマンド解析では、キャプションテキストがある場合はそれを使用し、なければ文字起こしを使用します。キャプションはブロック内の `User text:` として保持されます。
  </Step>
</Steps>

## 設定

`tools.media` は、共有モデルリストとケイパビリティごとのオーバーライドを保持します。

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [
        /* shared list, gate with capabilities */
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

ケイパビリティごとの（`image`/`audio`/`video`）キー:

| キー                                             | 型      | デフォルト                                              | 注記                                                                               |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自動（`false` で無効化）                              | このケイパビリティの自動検出をオフにするには `false` を設定します                             |
| `models`                                        | 配列     | なし                                                 | 共有 `tools.media.models` リストより優先されます                               |
| `prompt`                                        | `string`  | `"Describe the {media}."`（+ maxChars ガイダンス）      | デフォルトでは画像/動画のみ                                                         |
| `maxChars`                                      | `number`  | `500`（画像/動画）、未設定（音声）                   | モデルがそれ以上を返した場合、出力は切り詰められます                                         |
| `maxBytes`                                      | `number`  | 画像 `10485760`、音声 `20971520`、動画 `52428800` | サイズ超過のメディアは次のモデルへスキップします                                             |
| `timeoutSeconds`                                | `number`  | `60`（画像/音声）、`120`（動画）                    |                                                                                     |
| `language`                                      | `string`  | 未設定                                                | 音声文字起こしのヒント                                                            |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | プロバイダーリクエストのオーバーライド。[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照 |
| `attachments`                                   | オブジェクト    | `{ mode: "first", maxAttachments: 1 }`               | [添付ファイルポリシー](#attachment-policy)を参照                                         |
| `scope`                                         | オブジェクト    | 未設定                                                | channel/chatType/keyPrefix で制限                                                  |
| `echoTranscript`                                | `boolean` | `false`                                              | 音声のみ: エージェント処理の前に文字起こしをチャットへ返します            |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 音声のみ: `{transcript}` プレースホルダー                                              |

Deepgram 固有のオプションは `providerOptions.deepgram` の下に置きます（トップレベルの `deepgram: { detectLanguage, punctuate, smartFormat }` フィールドは非推奨ですが、引き続き読み取られます）。

### モデルエントリ

各 `models[]` エントリは **プロバイダー** エントリ（デフォルト）または **CLI** エントリです。

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
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    CLI テンプレートでは、`{{MediaDir}}`（メディアファイルを含むディレクトリ）、`{{OutputDir}}`（この実行用に作成されるスクラッチディレクトリ）、`{{OutputBase}}`（拡張子なしのスクラッチファイルベースパス）も使用できます。

  </Tab>
</Tabs>

### プロバイダー認証情報

プロバイダーのメディア理解では、通常のモデル呼び出しと同じ認証解決を使用します。認証プロファイル、環境変数、その後に `models.providers.<providerId>.apiKey` の順です。`tools.media.*.models[]` エントリはインラインの `apiKey` フィールドを受け付けません。

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

プロファイル、環境変数、カスタムベース URL については、[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## ルールと動作

- `maxBytes` を超えるメディアはそのモデルをスキップし、次のモデルを試します。
- 1024 バイト未満の音声ファイルは空または破損として扱われ、文字起こし前にスキップされます。エージェントには決定的なプレースホルダー文字起こしが代わりに渡されます。
- アクティブなプライマリ画像モデルがすでにビジョンをネイティブにサポートしている場合、OpenClaw は `[Image]` 要約ブロックをスキップし、元の画像をモデルへ直接渡します。MiniMax は例外です。`minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` は、従来の MiniMax M2.x チャットメタデータが画像入力を主張していても、常に Plugin 所有の `MiniMax-VL-01` メディアプロバイダー経由で画像理解をルーティングします（`MiniMax-M3` 以降のみがネイティブにビジョン対応として扱われます）。
- Gateway/WebChat のプライマリモデルがテキストのみの場合、画像添付ファイルはオフロードされた `media://inbound/*` 参照として保持されるため、添付ファイルを失う代わりに画像/PDF ツールまたは設定済みの画像モデルが引き続き検査できます。
- 明示的な `openclaw infer image describe --file <path> --model <provider/model>`（別名: `openclaw capability image describe`）は、画像対応のプロバイダー/モデルを直接実行します。`models.providers.ollama.models[]` の下に一致する画像対応モデルが設定されている場合、`ollama/qwen2.5vl:7b` のような Ollama 参照も含まれます。
- `<capability>.enabled` が `false` ではないがモデルが設定されていない場合、OpenClaw はプロバイダーがそのケイパビリティをサポートしていれば、アクティブな返信モデルを試します。

### 自動検出（デフォルト）

`tools.media.<capability>.enabled` が `false` ではなく、モデルが設定されていない場合、OpenClaw は次を順に試し、最初に動作するオプションで停止します。

<Steps>
  <Step title="設定済み画像モデル（画像のみ）">
    アクティブな返信モデルがすでにビジョンをネイティブにサポートしていない限り、`agents.defaults.imageModel` のプライマリ/フォールバック参照を使用します。`provider/model` 参照を優先します。ベア参照は、一致が一意の場合のみ、設定済みの画像対応プロバイダーモデルエントリから修飾されます。
  </Step>
  <Step title="アクティブな返信モデル">
    プロバイダーがそのケイパビリティをサポートしている場合、アクティブな返信モデルを使用します。
  </Step>
  <Step title="プロバイダー認証（音声のみ、ローカル CLI より前）">
    音声をサポートする設定済みの `models.providers.*` エントリは、ローカル CLI より前に試されます。バンドルされたプロバイダーの優先順序（同順位はプロバイダー ID のアルファベット順で決定）: Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="ローカル CLI（音声のみ）">
    最初にインストール済みのローカルバイナリを、次の順序で使用します。
    - `sherpa-onnx-offline`（`tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` を含む `SHERPA_ONNX_MODEL_DIR` が必要）
    - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL` またはバンドルされた tiny モデルを使用）
    - `whisper`（Python CLI。デフォルトは `turbo` モデルで、自動的にダウンロード）

  </Step>
  <Step title="プロバイダー認証（画像/動画）">
    そのケイパビリティをサポートする設定済みの `models.providers.*` エントリは、バンドルされたフォールバック順序より前に試されます。画像対応モデルを持つ画像専用設定プロバイダーは、バンドルされたベンダー Plugin でなくても、メディア理解用に自動登録されます。

    バンドルされたプロバイダーの優先順序（同順位はプロバイダー ID のアルファベット順で決定）:
    - 画像: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 動画: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI（画像/動画のみ）">
    最初にインストール済みの `agy` または `antigravity` バイナリ（`OPENCLAW_ANTIGRAVITY_CLI` で上書き可能）を、メディアのディレクトリに対してサンドボックス化して使用します。
  </Step>
</Steps>

ケイパビリティの自動検出を無効にするには:

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
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあること（`~` は展開されます）を確認するか、完全なコマンドパスを持つ明示的な CLI モデルエントリを設定してください。
</Note>

### プロキシサポート（音声/動画プロバイダー呼び出し）

プロバイダーベースの **音声** および **動画** 理解は、`NO_PROXY`/`no_proxy` バイパスルールを含む標準のアウトバウンドプロキシ環境変数に従います: `HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小文字の変数は大文字より優先されます。いずれも設定されていない場合、メディア理解は直接送信を使用します。プロキシ値が不正な形式の場合、OpenClaw は警告をログに記録し、直接フェッチにフォールバックします。画像理解はこのプロキシパスを通りません。

## ケイパビリティ

`models[]` エントリに `capabilities` を設定して、特定のメディアタイプに制限します。共有リストの場合、OpenClaw はバンドルされたプロバイダーごとにデフォルトを推論します。

| プロバイダー                                                                 | 機能          |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 画像                 |
| `minimax-portal`                                                         | 画像                 |
| `moonshot`                                                               | 画像 + 動画         |
| `openrouter`                                                             | 画像 + 音声         |
| `google` (Gemini API)                                                    | 画像 + 音声 + 動画 |
| `qwen`                                                                   | 画像 + 動画         |
| `deepinfra`                                                              | 画像 + 音声         |
| `mistral`                                                                | 音声                 |
| `zai`                                                                    | 画像                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音声                 |
| 画像対応モデルを含む任意の `models.providers.<id>.models[]` カタログ | 画像                 |

CLI エントリでは、意図しない一致を避けるために `capabilities` を明示的に設定する。省略した場合、そのエントリは出現するすべての機能リストの対象になる。

## プロバイダーサポート表

| 機能 | プロバイダー                                                                                                                                               | 注記                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 画像      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, config プロバイダー | ベンダー Plugin が画像サポートを登録する。`openai/*` は API キーまたは Codex OAuth ルーティングを使用できる。`codex/*` は境界付けられた Codex app-server ターンを使用する。画像対応の config プロバイダーは自動登録される。 |
| 音声      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | プロバイダー文字起こし (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)。                                                                                     |
| 動画      | Google, Moonshot, Qwen                                                                                                                                  | ベンダー Plugin によるプロバイダー動画理解。Qwen の動画理解は標準の DashScope エンドポイントを使用する。                                                                        |

<Note>
**MiniMax 注記**: `minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` の画像理解は、レガシー MiniMax M2.x チャットメタデータが画像入力を主張していても、常に Plugin 所有の `MiniMax-VL-01` メディアプロバイダーから提供される。
</Note>

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア機能で最も強力な現行世代モデルを優先する。
- 信頼できない入力を扱うツール有効化エージェントでは、古いまたは弱いメディアモデルを避ける。
- 可用性のために、機能ごとに少なくとも 1 つのフォールバックを維持する (高品質モデル + 高速または低コストのモデル)。
- CLI フォールバック (`whisper-cli`、`whisper`、`gemini`) は、プロバイダー API が利用できない場合に役立つ。
- `parakeet-mlx`: `--output-dir` を指定すると、出力形式が `txt` または未指定の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取る。他の形式では stdout にフォールバックする。

## 添付ファイルポリシー

機能ごとの `attachments` は、どの添付ファイルを処理するかを制御する。

<ParamField path="mode" type='"first" | "all"' default="first">
  選択された最初の添付ファイルのみ、またはすべてを処理する。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  処理数に上限を設定する。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候補添付ファイル間の選択優先度。
</ParamField>

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` などのラベルが付く。

### ファイル添付ファイルの抽出

- 抽出されたファイルテキストは、メディアプロンプトに追加される前に、`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような境界マーカーと `Source: External` メタデータ行を使用して、信頼できない外部コンテンツとしてラップされる。
- このパスでは、メディアプロンプトを短く保つために長い `SECURITY NOTICE:` バナーを意図的に省略する。境界マーカーとメタデータは引き続き適用される。
- 抽出可能なテキストがないファイルは `[No extractable text]` になる。
- PDF がレンダリング済みページ画像にフォールバックした場合、OpenClaw はそれらの画像を視覚対応の返信モデルに転送し、ファイルブロックにはプレースホルダー `[PDF content rendered to images]` を保持する。

## 構成例

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
  <Tab title="Image only">
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
              { provider: "anthropic", model: "claude-opus-4-8" },
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

メディア理解が実行されると、`/status` には機能ごとの概要行が含まれる。

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

## 注記

- 理解はベストエフォートで行われる。エラーは返信をブロックしない。
- 理解が無効な場合でも、添付ファイルはモデルに渡される。
- 理解を実行する場所を制限するには `scope` を使用する (たとえば、DM のみ)。

## 関連

- [構成](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
