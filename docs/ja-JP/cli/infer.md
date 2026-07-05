---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレス機能自動化の設計
summary: プロバイダーに支えられたモデル、画像、音声、TTS、動画、Web、埋め込みワークフロー向けの推論優先CLI
title: 推論 CLI
x-i18n:
    generated_at: "2026-07-05T11:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d2835d278be996aa1ae536ae7c2a4e8b2b093ba22e06358574e0180772d9b6e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` は、プロバイダーに支えられた推論のための標準的なヘッドレスサーフェスです。生の gateway RPC 名や agent tool ID ではなく、機能ファミリー（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`）を公開します。`openclaw capability ...` は同じコマンドツリーのエイリアスです。

一回限りのプロバイダーラッパーよりもこれを優先する理由:

- OpenClaw ですでに設定済みのプロバイダーとモデルを再利用します。
- スクリプトや agent 駆動の自動化向けに安定した `--json` エンベロープを提供します（[JSON 出力](#json-output)を参照）。
- ほとんどのサブコマンドでは Gateway なしで通常のローカルパスを実行します。
- エンドツーエンドのプロバイダーチェックでは、プロバイダーリクエストが送信される前に、出荷済み CLI、設定読み込み、デフォルト agent 解決、同梱 Plugin の有効化、共有機能ランタイムを実行します。

## infer を skill に変換する

これを agent にコピーして貼り付けます:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

優れた infer ベースの skill は、一般的なユーザー意図を適切なサブコマンドに対応付け、ワークフローごとにいくつかの標準例を含め、低レベルの代替手段よりも `openclaw infer ...` を優先し、skill 本文で infer サーフェス全体を再ドキュメント化しません。

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

| タスク                          | コマンド                                                                                       | 注記                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行する       | `openclaw infer model run --prompt "..." --json`                                              | デフォルトではローカル                                      |
| 画像に対してモデルプロンプトを実行する  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 複数の画像には `--file` を繰り返します                   |
| 画像を生成する             | `openclaw infer image generate --prompt "..." --json`                                         | 既存ファイルから開始する場合は `image edit` を使用します  |
| 画像ファイルまたは URL を説明する | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` は画像対応の `<provider/model>` である必要があります |
| 音声を文字起こしする              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` は `<provider/model>` である必要があります                  |
| 音声を合成する             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` は Gateway 経由でのみ実行されます            |
| 動画を生成する              | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` などのプロバイダーヒントをサポートします        |
| 動画ファイルを説明する         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` は `<provider/model>` である必要があります                  |
| Web を検索する                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Web ページを取得する              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 埋め込みを作成する             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 動作

- 出力を別のコマンドやスクリプトに渡す場合は `--json` を使用します。それ以外はテキスト出力を使用します。
- 特定のバックエンドを固定するには、`--provider` または `--model provider/model` を使用します。
- 一回限りの thinking/reasoning 上書きには `model run --thinking <level>` を使用します: `off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh`、または `max`。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` 形式を使用する必要があります。
- `image describe` では、`--file` はローカルパスと HTTP(S) URL を受け付けます。リモート URL は通常のメディア取得 SSRF ポリシーを通ります。
- ステートレス実行コマンド（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）はデフォルトでローカルです。Gateway 管理の状態コマンド（`tts status`）はデフォルトで Gateway です。
- ローカルパスでは Gateway の実行は不要です。
- ローカル `model run` は軽量な一回限りのプロバイダー補完です。設定済み agent モデルと認証を解決しますが、chat-agent ターンを開始したり、ツールを読み込んだり、同梱 MCP サーバーを開いたりしません。
- `model run --file` は画像ファイル（MIME タイプは自動検出）をプロンプトに添付します。複数の画像には `--file` を繰り返します。画像以外のファイルは拒否されます。代わりに `infer audio transcribe` または `infer video describe` を使用してください。
- `model run --gateway` は Gateway ルーティング、保存済み認証、プロバイダー選択、組み込みランタイムを実行しますが、生のモデルプローブのままです。以前のセッショントランスクリプト、bootstrap/AGENTS コンテキスト、ツール、同梱 MCP サーバーはありません。
- `model run --gateway --model <provider/model>` には信頼されたオペレーターの Gateway 資格情報が必要です。これは Gateway に一回限りのプロバイダー/モデル上書きの実行を依頼するためです。

## モデル

テキスト推論とモデル/プロバイダー検査。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.5 --json
```

Gateway の起動や agent tool サーフェスの読み込みなしに 1 つのプロバイダーをスモークテストするには、`--local` で完全な `<provider/model>` 参照を使用します:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

注記:

- ローカル `model run` は、プロバイダー/モデル/認証の健全性に対する最も狭い CLI スモークです。非 ChatGPT-Codex プロバイダーでは、指定されたプロンプトだけを送信します。
- ローカル `model run --model <provider/model>` は、そのプロバイダーが設定に書き込まれる前に、同梱の静的カタログの正確な行（`openclaw models list --all` が表示するのと同じ行）を解決できます。プロバイダー認証は引き続き必要です。資格情報がない場合は、`Unknown model` ではなく認証エラーとして失敗します。
- Mistral Medium 3.5 の reasoning プローブでは、temperature を未設定/デフォルトのままにします。Mistral は `temperature: 0` で `reasoning_effort="high"` を拒否します。デフォルト temperature、または `0.7` などの非ゼロ値を使用します。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）のローカルプローブは、トランスポートが必須の `instructions` フィールドを設定できるように最小限の system instruction を追加します。完全な agent コンテキスト、ツール、メモリ、セッショントランスクリプトはありません。
- `model run --file` は画像コンテンツを単一のユーザーメッセージに直接添付します。一般的な形式（PNG、JPEG、WebP）は、MIME タイプが `image/*` として検出される場合に動作します。サポートされていない、または認識されないファイルは、プロバイダーが呼び出される前に失敗します。直接的なマルチモーダルモデルプローブではなく OpenClaw の画像モデルルーティングとフォールバックを使いたい場合は、代わりに `infer image describe` を使用します。
- 選択したモデルは画像入力をサポートしている必要があります。テキスト専用モデルはプロバイダーレイヤーでリクエストを拒否する場合があります。
- `model run --prompt` には空白以外のテキストが含まれている必要があります。空のプロンプトは、プロバイダーまたは Gateway の呼び出し前に拒否されます。
- ローカル `model run` は、プロバイダーがテキスト出力を返さない場合に非ゼロで終了するため、到達不能なプロバイダーや空の補完が成功したプローブのようには見えません。
- モデル入力を生のままにしつつ Gateway ルーティングまたは agent-runtime セットアップをテストするには、`model run --gateway` を使用します。完全な agent コンテキスト、ツール、メモリ、セッショントランスクリプトには `openclaw agent` またはチャットサーフェスを使用します。
- `--thinking adaptive` は completion-runtime レベル `medium` に対応します。`--thinking max` は、ネイティブの max effort をサポートする OpenAI モデルでは `max` に、それ以外では `xhigh` に対応します。
- `model auth login`、`model auth logout`、`model auth status` は、保存済みプロバイダー認証状態を管理します。

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

注記:

- 既存の入力ファイルから開始する場合は `image edit` を使用します。`--size`、`--aspect-ratio`、または `--resolution` は、それらをサポートするプロバイダー/モデルにジオメトリのヒントを追加します。
- `--model openai/gpt-image-1.5` とともに `--output-format png --background transparent` を指定すると、背景が透明な OpenAI PNG 出力が得られます。`--openai-background` は同じヒントに対する OpenAI 固有のエイリアスです。背景サポートを宣言していないプロバイダーは、これを無視されたオーバーライドとして報告します（[JSON エンベロープ](#json-output)の `ignoredOverrides` を参照）。
- `--quality low|medium|high|auto` は、OpenAI を含む画像品質ヒントをサポートするプロバイダーで機能します。OpenAI は `--openai-moderation low|auto` も受け付けます。
- `image providers --json` は、どのバンドル画像プロバイダーが検出可能、設定済み、選択済みであり、それぞれがどの生成/編集機能を公開しているかを一覧表示します。
- `image generate --model <provider/model> --json` は、画像生成の変更に対する最小範囲のライブスモークテストです。

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  レスポンスは `ok`、`provider`、`model`、`attempts`、および書き込まれた出力パスを報告します。`--output` が設定されている場合、最終的な拡張子はプロバイダーが返した MIME タイプに従うことがあります。

- `image describe` と `image describe-many` では、タスク固有の指示（OCR、比較、UI 検査、簡潔なキャプション作成）に `--prompt` を使用します。
- 遅いローカルビジョンモデルや Ollama のコールドスタートには `--timeout-ms` を使用します。
- `image describe` では、明示的な `--model`（画像対応の `<provider/model>` である必要があります）が最初に実行され、その呼び出しが失敗した場合に設定済みの `agents.defaults.imageModel.fallbacks` を試します。入力準備エラー（ファイル欠落、サポートされていない URL）はフォールバックの試行前に失敗し、モデルはモデルカタログまたはプロバイダー設定で画像対応である必要があります。
- ローカルの Ollama ビジョンモデルでは、先にモデルを取得し、`OLLAMA_API_KEY` を任意のプレースホルダー値（例: `ollama-local`）に設定します。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## 音声

ファイル文字起こし（リアルタイムのセッション管理ではありません）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` は `<provider/model>` である必要があります。

## TTS

音声合成と TTS プロバイダー/ペルソナ状態。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

注記:

- `tts status` は `--gateway` のみをサポートします（Gateway 管理の TTS 状態を反映します）。
- TTS の動作を検査および設定するには、`tts providers`、`tts voices`、`tts personas`、`tts set-provider`、`tts set-persona` を使用します。

## 動画

生成と説明。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け付け、動画生成ランタイムへ転送します。
- `video describe` の `--model` は `<provider/model>` である必要があります。

## Web

検索と取得。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` は、検索と取得で利用可能、設定済み、選択済みのプロバイダーを一覧表示します。

## 埋め込み

ベクトル作成と埋め込みプロバイダーの検査。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 出力

Infer コマンドは、共有エンベロープの下に JSON 出力を正規化します。

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

安定したトップレベルフィールド:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs`（該当する場合、リクエストとともに送信された画像添付）
- `outputs`
- `ignoredOverrides`（該当する場合、プロバイダーがサポートしないヒントキー）
- `error`

生成メディアコマンドでは、`outputs` に OpenClaw が書き込んだファイルが含まれます。自動化では、人間が読める stdout を解析する代わりに、その配列内の `path`、`mimeType`、`size`、およびメディア固有の寸法を使用してください。

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

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル](/ja-JP/concepts/models)
