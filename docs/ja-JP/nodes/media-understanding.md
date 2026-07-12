---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声・動画・画像の前処理の調整
sidebarTitle: Media understanding
summary: プロバイダー + CLI フォールバックによる受信画像・音声・動画の理解（任意）
title: メディア理解
x-i18n:
    generated_at: "2026-07-11T22:22:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw は、応答パイプラインが実行される前に受信メディア（画像/音声/動画）を要約できるため、コマンド解析とルーティングでは生のバイト列ではなく短いテキストを使用できます。メディア理解機能はローカルツールまたはプロバイダーキーを自動検出しますが、モデルを明示的に設定することもできます。元のメディアは常に通常どおりモデルへ渡されます。メディア理解に失敗した場合や無効になっている場合でも、応答フローは変更されずに続行されます。

ベンダー Plugin は、機能メタデータ（各メディアタイプをサポートするプロバイダー、デフォルトモデル、優先度）を登録します。OpenClaw コアは、共有の `tools.media` 設定、フォールバック順序、および応答パイプラインとの統合を管理します。

## 仕組み

<Steps>
  <Step title="添付ファイルを収集">
    受信した添付ファイル（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
  </Step>
  <Step title="機能ごとに選択">
    有効な各機能（画像/音声/動画）について、`attachments` ポリシーに従って添付ファイルを選択します（デフォルト: 最初の添付ファイルのみ）。
  </Step>
  <Step title="モデルを選択">
    利用可能な最初のモデルエントリを選択します（サイズ、機能、認証の利用可否に基づきます）。
  </Step>
  <Step title="失敗時にフォールバック">
    モデルでエラーやタイムアウトが発生した場合、またはメディアが `maxBytes` を超える場合は、次のエントリを試します。
  </Step>
  <Step title="成功時に適用">
    `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになります。音声の場合は `{{Transcript}}` も設定されます。コマンド解析では、キャプションテキストがある場合はそれを使用し、ない場合は文字起こしを使用します。キャプションはブロック内に `User text:` として保持されます。
  </Step>
</Steps>

## 設定

`tools.media` には、共有モデルリストと機能ごとのオーバーライドを指定します。

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

機能ごとの（`image`/`audio`/`video`）キー:

| キー                                            | 型        | デフォルト                                           | 注記                                                                                |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自動（`false` で無効化）                             | `false` に設定すると、この機能の自動検出を無効にします                             |
| `models`                                        | 配列      | なし                                                 | 共有の `tools.media.models` リストより先に使用されます                              |
| `prompt`                                        | `string`  | `"Describe the {media}."`（+ maxChars の指示）       | デフォルトでは画像/動画のみ                                                        |
| `maxChars`                                      | `number`  | `500`（画像/動画）、未設定（音声）                   | モデルからの出力がこれを超えた場合は切り詰められます                              |
| `maxBytes`                                      | `number`  | 画像 `10485760`、音声 `20971520`、動画 `52428800`   | サイズ超過のメディアでは次のモデルへ進みます                                      |
| `timeoutSeconds`                                | `number`  | `60`（画像/音声）、`120`（動画）                     |                                                                                     |
| `language`                                      | `string`  | 未設定                                               | 音声文字起こしのヒント                                                            |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | プロバイダーリクエストのオーバーライド。[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照 |
| `attachments`                                   | オブジェクト | `{ mode: "first", maxAttachments: 1 }`            | [添付ファイルポリシー](#attachment-policy)を参照                                   |
| `scope`                                         | オブジェクト | 未設定                                             | channel/chatType/keyPrefix による制限                                              |
| `echoTranscript`                                | `boolean` | `false`                                              | 音声のみ: エージェント処理の前に文字起こしをチャットへ送り返します                |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 音声のみ: `{transcript}` プレースホルダー                                          |

Deepgram 固有のオプションは `providerOptions.deepgram` の下に指定します（トップレベルの `deepgram: { detectLanguage, punctuate, smartFormat }` フィールドは非推奨ですが、引き続き読み込まれます）。

### モデルエントリ

各 `models[]` エントリは、**プロバイダー**エントリ（デフォルト）または **CLI** エントリです。

<Tabs>
  <Tab title="プロバイダーエントリ">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
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

    CLI テンプレートでは、`{{MediaDir}}`（メディアファイルを含むディレクトリ）、`{{OutputDir}}`（この実行用に作成されるスクラッチディレクトリ）、および `{{OutputBase}}`（拡張子なしのスクラッチファイルのベースパス）も使用できます。

  </Tab>
</Tabs>

### プロバイダー認証情報

プロバイダーによるメディア理解では、通常のモデル呼び出しと同じ認証解決順序（認証プロファイル、環境変数、`models.providers.<providerId>.apiKey`）を使用します。`tools.media.*.models[]` エントリでは、インラインの `apiKey` フィールドは使用できません。

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

- `maxBytes` を超えるメディアでは、そのモデルをスキップして次のモデルを試します。
- 1024 バイト未満の音声ファイルは空または破損しているものとして扱われ、文字起こし前にスキップされます。代わりに、エージェントには決定的なプレースホルダー文字起こしが渡されます。
- 有効なプライマリ画像モデルがすでにネイティブに画像認識をサポートしている場合、OpenClaw は `[Image]` 要約ブロックを省略し、元の画像をモデルへ直接渡します。MiniMax は例外です。`minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` は、従来の MiniMax M2.x チャットメタデータが画像入力に対応していると示している場合でも、常に Plugin が管理する `MiniMax-VL-01` メディアプロバイダーを通じて画像理解を処理します（`MiniMax-M3` 以降のみがネイティブな画像認識対応として扱われます）。
- Gateway/WebChat のプライマリモデルがテキスト専用の場合、画像添付ファイルはオフロードされた `media://inbound/*` 参照として保持されるため、添付ファイルを失うことなく、画像/PDF ツールまたは設定済みの画像モデルで引き続き検査できます。
- 明示的な `openclaw infer image describe --file <path> --model <provider/model>`（エイリアス: `openclaw capability image describe`）は、その画像対応プロバイダー/モデルを直接実行します。`models.providers.ollama.models[]` に一致する画像対応モデルが設定されている場合は、`ollama/qwen2.5vl:7b` などの Ollama 参照も対象になります。
- `<capability>.enabled` が `false` ではなく、モデルが設定されていない場合、そのプロバイダーが機能をサポートしていれば、OpenClaw は有効な応答モデルを試します。

### 自動検出（デフォルト）

`tools.media.<capability>.enabled` が `false` ではなく、モデルが設定されていない場合、OpenClaw は次の順序で試し、最初に動作した選択肢で停止します。

<Steps>
  <Step title="設定済み画像モデル（画像のみ）">
    有効な応答モデルがすでにネイティブに画像認識をサポートしている場合を除き、`agents.defaults.imageModel` のプライマリ/フォールバック参照を使用します。`provider/model` 参照を優先します。プロバイダーの指定がない参照は、設定済みの画像対応プロバイダーモデルエントリとの一致が一意の場合にのみ修飾されます。
  </Step>
  <Step title="有効な応答モデル">
    プロバイダーが機能をサポートしている場合、有効な応答モデルを使用します。
  </Step>
  <Step title="プロバイダー認証（音声のみ、ローカル CLI より前）">
    音声をサポートする設定済みの `models.providers.*` エントリは、ローカル CLI より前に試されます。同梱プロバイダーの優先順位（同順位の場合はプロバイダー ID のアルファベット順）: Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="ローカル CLI（音声のみ）">
    使用可能なローカルバイナリは、次の順序のフォールバックリストになります。
    - 現在のプロセス内で、それ以前のモデル呼び出しによって Metal または CUDA が検出された場合に限り、`whisper-cli` が最初
    - CPU がデフォルトの `sherpa-onnx-offline`（`tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` を含む `SHERPA_ONNX_MODEL_DIR` が必要）
    - アクセラレーションがビルドで利用可能なだけ、または未検出の場合は `whisper-cli`
    - Apple Silicon 上の `parakeet-mlx`（MLX 対応、デバイス使用は未検出）
    - `whisper`（Python CLI。デフォルトは `turbo` モデルで、自動的にダウンロード）

    バックエンド機能の検査結果はキャッシュされ、モデルは読み込まれません。ビルド機能、要求されたバックエンドフラグ、実際の呼び出しで検出されたバックエンドは、それぞれ別に保持されます。自動検出された whisper.cpp ではモデル実行ログが有効なままになるため、アップストリームが選択したバックエンドを示す行を記録できます。明示的な CLI エントリでは、設定された順序、バックエンドフラグ、出力フラグが維持されます。

  </Step>
  <Step title="プロバイダー認証（画像/動画）">
    機能をサポートする設定済みの `models.providers.*` エントリは、同梱のフォールバック順序より前に試されます。画像対応モデルを持つ画像専用設定プロバイダーは、同梱のベンダー Plugin ではない場合でも、メディア理解用に自動登録されます。

    同梱プロバイダーの優先順位（同順位の場合はプロバイダー ID のアルファベット順）:
    - 画像: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 動画: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI（画像/動画のみ）">
    最初にインストール済みと判定された `agy` または `antigravity` バイナリ（`OPENCLAW_ANTIGRAVITY_CLI` で上書き可能）を、メディアのディレクトリに制限されたサンドボックス内で使用します。
  </Step>
</Steps>

機能の自動検出を無効にするには、次のように設定します。

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
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを指定した明示的な CLI モデルエントリを設定してください。
</Note>

### プロキシサポート（音声/動画プロバイダー呼び出し）

プロバイダーによる**音声**および**動画**の理解では、`NO_PROXY`/`no_proxy` のバイパスルールを含む標準の送信プロキシ環境変数 `HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy` が使用されます。小文字の変数が大文字の変数より優先されます。いずれも設定されていない場合、メディア理解は直接外部へ接続します。プロキシ値の形式が不正な場合、OpenClaw は警告をログに記録し、直接取得へフォールバックします。画像理解では、このプロキシ経路は使用されません。

## 機能

`models[]` エントリに `capabilities` を設定すると、特定のメディアタイプに限定できます。共有リストの場合、OpenClaw は同梱プロバイダーごとにデフォルトを推測します。

| プロバイダー                                                             | 機能                  |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 画像                  |
| `minimax-portal`                                                         | 画像                  |
| `moonshot`                                                               | 画像 + 動画           |
| `openrouter`                                                             | 画像 + 音声           |
| `google` (Gemini API)                                                    | 画像 + 音声 + 動画    |
| `qwen`                                                                   | 画像 + 動画           |
| `deepinfra`                                                              | 画像 + 音声           |
| `mistral`                                                                | 音声                  |
| `zai`                                                                    | 画像                  |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音声                  |
| 画像対応モデルを含む任意の `models.providers.<id>.models[]` カタログ    | 画像                  |

CLI エントリでは、意図しない一致を避けるために `capabilities` を明示的に設定してください。省略すると、そのエントリは記載されているすべての機能リストで候補になります。

## プロバイダー対応表

| 機能 | プロバイダー                                                                                                                                               | 注記                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 画像      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, 設定プロバイダー | ベンダー Plugin が画像対応を登録します。`openai/*` は API キーまたは Codex OAuth ルーティングを使用できます。`codex/*` は制限付きの Codex app-server ターンを使用します。画像対応の設定プロバイダーは自動登録されます。 |
| 音声      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | プロバイダーによる文字起こし（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                     |
| 動画      | Google, Moonshot, Qwen                                                                                                                                  | ベンダー Plugin によるプロバイダーの動画理解。Qwen の動画理解では標準の DashScope エンドポイントを使用します。                                                                        |

<Note>
**MiniMax に関する注記**: `minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` の画像理解には、従来の MiniMax M2.x チャットメタデータが画像入力対応を示している場合でも、常に Plugin が所有する `MiniMax-VL-01` メディアプロバイダーが使用されます。
</Note>

## モデル選択の指針

- 品質と安全性が重要な場合は、各メディア機能で現行世代の最も高性能なモデルを優先してください。
- 信頼できない入力を処理するツール対応エージェントでは、古い、または性能の低いメディアモデルを避けてください。
- 可用性を確保するため、機能ごとに少なくとも 1 つのフォールバックを維持してください（高品質モデル + 高速または低コストのモデル）。
- プロバイダー API が利用できない場合は、CLI フォールバック（`whisper-cli`、`whisper`、`gemini`）が役立ちます。
- 既知のファイル出力モードが優先されます。推測された文字起こしファイルが空または存在しない場合、CLI の進捗出力へフォールバックせず、文字起こしは生成されません。
- `parakeet-mlx`: `--output-dir` およびデフォルトの `{filename}` 出力テンプレートとともに、`--output-format txt`（または `all`）を使用してください。アップストリームの `PARAKEET_OUTPUT_FORMAT` および `PARAKEET_OUTPUT_TEMPLATE` 環境変数も使用されます。OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。デフォルトの `srt` 形式、その他の形式、カスタム出力テンプレートでは、引き続き標準出力が使用されます。

## 添付ファイルポリシー

機能ごとの `attachments` は、処理する添付ファイルを制御します。

<ParamField path="mode" type='"first" | "all"' default="first">
  選択された最初の添付ファイルのみ、またはすべてを処理します。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  処理する数の上限を設定します。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  添付ファイル候補から選択する際の優先基準です。
</ParamField>

`mode: "all"` の場合、出力には `[画像 1/2]`、`[音声 2/2]` などのラベルが付けられます。

### 添付ファイルからの抽出

- 抽出されたファイルテキストは、メディアプロンプトに追加される前に、信頼できない外部コンテンツとしてラップされます。`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような境界マーカーと、`Source: External` メタデータ行が使用されます。
- この経路では、メディアプロンプトを短く保つため、長い `SECURITY NOTICE:` バナーを意図的に省略しています。境界マーカーとメタデータは引き続き適用されます。
- 抽出可能なテキストがないファイルには `[抽出可能なテキストなし]` が設定されます。
- PDF がレンダリング済みページ画像にフォールバックした場合、OpenClaw はそれらの画像を視覚対応の応答モデルに転送し、ファイルブロック内にプレースホルダー `[PDF コンテンツは画像としてレンダリング済み]` を保持します。

## 設定例

<Tabs>
  <Tab title="共有モデル + オーバーライド">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
              { provider: "openai", model: "gpt-5.6-sol" },
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
  <Tab title="単一のマルチモーダルエントリ">
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

メディア理解が実行されると、`/status` に機能ごとの概要行が含まれます。

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

事前確認用のインベントリには、`openclaw capability audio providers` を実行してください。ローカル行では、ローカルのフォールバック候補が、グローバルなプロバイダー選択、準備状態、および個別の対応可能、要求済み、観測済みバックエンドフィールドとは分けて表示されます。同じローカル選択は、情報レベルの doctor 検出結果としても確認できます。

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## 注記

- 理解処理はベストエフォートです。エラーが発生しても応答はブロックされません。
- 理解処理が無効でも、添付ファイルは引き続きモデルに渡されます。
- `scope` を使用して、理解処理を実行する場所を制限できます（たとえば、DM のみに限定）。

## 関連項目

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
