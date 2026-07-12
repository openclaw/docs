---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレス機能自動化の設計
summary: プロバイダー対応のモデル、画像、音声、TTS、動画、Web、埋め込みワークフロー向け推論優先CLI
title: 推論 CLI
x-i18n:
    generated_at: "2026-07-11T22:06:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` は、プロバイダーを利用した推論のための標準的なヘッドレスインターフェースです。生の Gateway RPC 名やエージェントツール ID ではなく、機能ファミリー（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`）を公開します。`openclaw capability ...` は同じコマンドツリーのエイリアスです。

単発のプロバイダーラッパーよりも推奨される理由は次のとおりです。

- OpenClaw ですでに設定済みのプロバイダーとモデルを再利用します。
- スクリプトやエージェント駆動の自動化に適した安定した `--json` エンベロープを提供します（[JSON 出力](#json-output)を参照）。
- ほとんどのサブコマンドでは、Gateway を介さず通常のローカル経路で実行します。
- エンドツーエンドのプロバイダーチェックでは、プロバイダーへのリクエストが送信される前に、リリース版の CLI、設定の読み込み、デフォルトエージェントの解決、同梱 Plugin の有効化、共有機能ランタイムを実行します。

## infer を Skills にする

次の内容をコピーしてエージェントに貼り付けます。

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

優れた infer ベースの Skills は、一般的なユーザーの意図を適切なサブコマンドに対応付け、ワークフローごとに標準的な例をいくつか含め、低レベルの代替手段より `openclaw infer ...` を優先し、Skills 本文で infer の全機能を改めて文書化しません。

## コマンドツリー

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>` は、このツリーをデータ（機能 ID、トランスポート、説明）として表示します。

## 一般的なタスク

| タスク                        | コマンド                                                                                      | 注記                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト／モデルプロンプトを実行する | `openclaw infer model run --prompt "..." --json`                                              | デフォルトではローカル                                |
| 画像に対してモデルプロンプトを実行する | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 複数の画像には `--file` を繰り返し指定                |
| 画像を生成する                | `openclaw infer image generate --prompt "..." --json`                                         | 既存ファイルから始める場合は `image edit` を使用      |
| 画像ファイルまたは URL を説明する | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` は画像対応の `<provider/model>` であること |
| 音声を文字起こしする          | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` は `<provider/model>` であること            |
| 音声を合成する                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` のみ Gateway 経由で実行                  |
| 動画を生成する                | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` などのプロバイダーヒントに対応         |
| 動画ファイルを説明する        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` は `<provider/model>` であること            |
| ウェブを検索する              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ウェブページを取得する        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 埋め込みを作成する            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 動作

- 出力を別のコマンドやスクリプトに渡す場合は `--json` を使用し、それ以外ではテキスト出力を使用します。
- 特定のバックエンドに固定するには、`--provider` または `--model provider/model` を使用します。
- 1 回限りの思考／推論レベルを上書きするには、`model run --thinking <level>` を使用します。指定できる値は `off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh`、`max` です。
- `image describe`、`audio transcribe`、`video describe` では、`--model` を `<provider/model>` 形式で指定する必要があります。
- `image describe` の `--file` にはローカルパスと HTTP(S) URL を指定できます。リモート URL には通常のメディア取得 SSRF ポリシーが適用されます。
- ステートレスな実行コマンド（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）は、デフォルトでローカル実行されます。Gateway が管理する状態コマンド（`tts status`）は、デフォルトで Gateway 経由になります。
- ローカル経路では、Gateway が稼働している必要はありません。
- ローカルの `model run` は、簡潔な 1 回限りのプロバイダー補完です。設定済みのエージェントモデルと認証を解決しますが、チャットエージェントのターンを開始せず、ツールを読み込まず、同梱 MCP サーバーも開きません。
- `model run --file` は画像ファイル（MIME タイプを自動検出）をプロンプトに添付します。複数の画像には `--file` を繰り返し指定します。画像以外のファイルは拒否されるため、代わりに `infer audio transcribe` または `infer video describe` を使用してください。
- `model run --gateway` は、Gateway のルーティング、保存済み認証、プロバイダー選択、組み込みランタイムを実行しますが、生のモデルプローブのままです。以前のセッショントランスクリプト、ブートストラップ／AGENTS コンテキスト、ツール、同梱 MCP サーバーは含まれません。
- `model run --gateway --model <provider/model>` は Gateway に 1 回限りのプロバイダー／モデル上書きを要求するため、信頼されたオペレーター用の Gateway 認証情報が必要です。

## モデル

テキスト推論とモデル／プロバイダーの確認。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gateway を起動したりエージェントツールインターフェースを読み込んだりせずに、1 つのプロバイダーをスモークテストするには、`--local` と完全な `<provider/model>` 参照を使用します。

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

注記：

- ローカルの `model run` は、プロバイダー／モデル／認証の正常性を確認するための最小限の CLI スモークテストです。ChatGPT-Codex 以外のプロバイダーには、指定されたプロンプトのみを送信します。
- ローカルの `model run --model <provider/model>` は、そのプロバイダーが設定に書き込まれる前でも、同梱された静的カタログの完全一致行（`openclaw models list --all` が表示するものと同じ）を解決できます。プロバイダー認証は引き続き必要です。認証情報がない場合は、`Unknown model` ではなく認証エラーになります。
- Mistral Medium 3.5 の推論プローブでは、temperature を未設定／デフォルトのままにしてください。Mistral は `temperature: 0` での `reasoning_effort="high"` を拒否します。デフォルトの temperature または `0.7` などのゼロ以外の値を使用してください。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）のローカルプローブは、トランスポートが必須の `instructions` フィールドを設定できるように、最小限のシステム指示を追加します。完全なエージェントコンテキスト、ツール、メモリ、セッショントランスクリプトは含まれません。
- `model run --file` は、画像コンテンツを単一のユーザーメッセージに直接添付します。一般的な形式（PNG、JPEG、WebP）は、MIME タイプが `image/*` として検出される場合に使用できます。未対応または認識できないファイルは、プロバイダーを呼び出す前に失敗します。直接的なマルチモーダルモデルのプローブではなく、OpenClaw の画像モデルルーティングとフォールバックを使用したい場合は、代わりに `infer image describe` を使用してください。
- 選択するモデルは画像入力に対応している必要があります。テキスト専用モデルでは、プロバイダー層でリクエストが拒否される場合があります。
- `model run --prompt` には空白以外のテキストが必要です。空のプロンプトは、プロバイダーまたは Gateway を呼び出す前に拒否されます。
- ローカルの `model run` は、プロバイダーがテキスト出力を返さない場合にゼロ以外で終了するため、到達不能なプロバイダーや空の補完が成功したプローブとして扱われることはありません。
- モデル入力を生のまま維持しつつ Gateway のルーティングまたはエージェントランタイムの設定をテストするには、`model run --gateway` を使用します。完全なエージェントコンテキスト、ツール、メモリ、セッショントランスクリプトを使用するには、`openclaw agent` またはチャットインターフェースを使用します。
- `--thinking adaptive` は補完ランタイムレベルの `medium` に対応します。`--thinking max` は、ネイティブの最大推論強度に対応する OpenAI モデルでは `max` に、それ以外では `xhigh` に対応します。
- `model auth login`、`model auth logout`、`model auth status` は、保存済みのプロバイダー認証状態を管理します。

## 画像

生成、編集、説明。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

注記：

- 既存の入力ファイルから開始する場合は `image edit` を使用します。`--size`、`--aspect-ratio`、`--resolution` は、それらをサポートするプロバイダーやモデルにジオメトリのヒントを追加します。
- `--model openai/gpt-image-1.5` とともに `--output-format png --background transparent` を指定すると、背景が透明な OpenAI PNG 出力が得られます。`--openai-background` は、同じヒントに対する OpenAI 固有のエイリアスです。背景指定のサポートを宣言していないプロバイダーでは、無視されたオーバーライドとして報告されます（[JSON エンベロープ](#json-output)の `ignoredOverrides` を参照）。
- `--quality low|medium|high|auto` は、OpenAI を含む、画像品質のヒントをサポートするプロバイダーで使用できます。OpenAI では `--openai-moderation low|auto` も使用できます。
- `image providers --json` は、バンドルされた画像プロバイダーのうち、検出可能、設定済み、選択済みのものと、それぞれが公開する生成／編集機能を一覧表示します。
- `image generate --model <provider/model> --json` は、画像生成の変更に対する最小範囲のライブスモークテストです。

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  レスポンスには、`ok`、`provider`、`model`、`attempts`、および書き込まれた出力パスが含まれます。`--output` が設定されている場合、最終的な拡張子はプロバイダーから返された MIME タイプに従うことがあります。

- `image describe` と `image describe-many` では、タスク固有の指示（OCR、比較、UI の検査、簡潔なキャプション作成）に `--prompt` を使用します。
- 低速なローカル視覚モデルや、コールドスタート時の Ollama には `--timeout-ms` を使用します。
- `image describe` では、明示的な `--model`（画像対応の `<provider/model>` である必要があります）が最初に実行され、その呼び出しが失敗した場合は、設定済みの `agents.defaults.imageModel.fallbacks` が試行されます。入力準備エラー（ファイルがない、URL がサポートされていない）はフォールバックの試行前に失敗し、モデルカタログまたはプロバイダー設定で画像対応モデルとして定義されている必要があります。
- ローカルの Ollama 視覚モデルでは、最初にモデルを取得し、`OLLAMA_API_KEY` に任意のプレースホルダー値（例: `ollama-local`）を設定します。[Ollama](/ja-JP/providers/ollama#vision-and-image-description)を参照してください。

## 音声

ファイルの文字起こし（リアルタイムのセッション管理ではありません）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` は `<provider/model>` である必要があります。

## TTS

音声合成と TTS プロバイダー／ペルソナの状態。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

注記:

- `tts status` は `--gateway` のみをサポートします（Gateway が管理する TTS の状態を反映します）。
- TTS の動作を確認および設定するには、`tts providers`、`tts voices`、`tts personas`、`tts set-provider`、`tts set-persona` を使用します。

## 動画

生成と説明。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け付け、動画生成ランタイムに転送します。
- `video describe` の `--model` は `<provider/model>` である必要があります。

## Web

検索と取得。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` は、検索および取得に使用可能、設定済み、選択済みのプロバイダーを一覧表示します。

## 埋め込み

ベクトルの作成と埋め込みプロバイダーの確認。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 出力

Infer コマンドは、共通のエンベロープ配下に JSON 出力を正規化します。

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

安定した最上位フィールド:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs`（該当する場合、リクエストとともに送信された画像添付ファイル）
- `outputs`
- `ignoredOverrides`（該当する場合、プロバイダーがサポートしていないヒントのキー）
- `error`

生成メディアのコマンドでは、`outputs` に OpenClaw が書き込んだファイルが含まれます。自動化では、人間が読める標準出力を解析する代わりに、その配列内の `path`、`mimeType`、`size`、およびメディア固有の寸法を使用します。

## よくある落とし穴

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [モデル](/ja-JP/concepts/models)
