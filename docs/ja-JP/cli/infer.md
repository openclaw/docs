---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレスケイパビリティ自動化を設計する
summary: モデル、画像、音声、TTS、動画、ウェブ、埋め込みワークフロー向けの、プロバイダー連携型の推論優先コマンドラインインターフェイス
title: 推論 CLI
x-i18n:
    generated_at: "2026-04-30T05:04:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` は、プロバイダーに支えられた推論ワークフロー向けの標準的なヘッドレスインターフェイスです。

これは意図的に、未加工の Gateway RPC 名や未加工のエージェントツール ID ではなく、機能ファミリーを公開します。

## infer を skill に変換する

これをエージェントにコピーして貼り付けます。

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

適切な infer ベースの skill は、次のようにするべきです。

- 一般的なユーザー意図を正しい infer サブコマンドに対応付ける
- 対象とするワークフローについて、いくつかの標準的な infer の例を含める
- 例や提案では `openclaw infer ...` を優先する
- skill 本文の中で infer インターフェイス全体を再ドキュメント化しない

典型的な infer 中心の skill の対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer を使う理由

`openclaw infer` は、OpenClaw 内でプロバイダーに支えられた推論タスクを扱うための一貫した CLI を提供します。

利点:

- 各バックエンド用に一回限りのラッパーを配線する代わりに、OpenClaw ですでに設定済みのプロバイダーとモデルを使用できます。
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを 1 つのコマンドツリーの下にまとめられます。
- スクリプト、自動化、エージェント駆動のワークフロー向けに、安定した `--json` 出力形式を使用できます。
- タスクの本質が「推論を実行する」ことである場合、ファーストパーティの OpenClaw インターフェイスを優先できます。
- ほとんどの infer コマンドでは、Gateway を必要とせずに通常のローカルパスを使用できます。

エンドツーエンドのプロバイダーチェックでは、低レベルの
プロバイダーテストがグリーンになった後に `openclaw infer ...` を優先してください。これは、プロバイダーリクエストが行われる前に、出荷済み CLI、設定読み込み、
デフォルトエージェント解決、同梱 Plugin の有効化、ランタイム依存関係の修復、
共有機能ランタイムを実行します。

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
    status
    enable
    disable
    set-provider

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

## 一般的なタスク

この表は、一般的な推論タスクを対応する infer コマンドに対応付けます。

| タスク                       | コマンド                                                                                      | 注記                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行する | `openclaw infer model run --prompt "..." --json`                                              | デフォルトでは通常のローカルパスを使用します          |
| 画像に対してモデルプロンプトを実行する | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 複数の画像入力には `--file` を繰り返します            |
| 画像を生成する               | `openclaw infer image generate --prompt "..." --json`                                         | 既存ファイルから開始する場合は `image edit` を使用します |
| 画像ファイルを説明する       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` は画像対応の `<provider/model>` である必要があります |
| 音声を文字起こしする         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` は `<provider/model>` である必要があります  |
| 音声を合成する               | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` は Gateway 指向です                      |
| 動画を生成する               | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` などのプロバイダーヒントをサポートします |
| 動画ファイルを説明する       | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` は `<provider/model>` である必要があります  |
| Web を検索する               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Web ページを取得する         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 埋め込みを作成する           | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 挙動

- `openclaw infer ...` は、これらのワークフロー向けの主要な CLI インターフェイスです。
- 出力を別のコマンドやスクリプトが消費する場合は `--json` を使用します。
- 特定のバックエンドが必要な場合は `--provider` または `--model provider/model` を使用します。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` の形式を使用する必要があります。
- `image describe` では、明示的な `--model` はそのプロバイダー/モデルを直接実行します。モデルは、モデルカタログまたはプロバイダー設定で画像対応である必要があります。`codex/<model>` は、境界付けられた Codex アプリサーバーの画像理解ターンを実行します。`openai-codex/<model>` は OpenAI Codex OAuth プロバイダーパスを使用します。
- ステートレス実行コマンドはデフォルトでローカルになります。
- Gateway 管理の状態コマンドはデフォルトで Gateway になります。
- 通常のローカルパスでは、Gateway が実行中である必要はありません。
- ローカルの `model run` は、軽量な一回限りのプロバイダー補完です。設定済みのエージェントモデルと認証を解決しますが、チャットエージェントターンの開始、ツールの読み込み、同梱 MCP サーバーの起動は行いません。
- `model run --file` は画像ファイルを受け取り、その MIME タイプを検出し、指定されたプロンプトとともに選択したモデルへ送信します。複数の画像には `--file` を繰り返します。
- `model run --file` は画像以外の入力を拒否します。音声ファイルには `infer audio transcribe` を、動画ファイルには `infer video describe` を使用してください。
- `model run --gateway` は Gateway ルーティング、保存済み認証、プロバイダー選択、埋め込みランタイムを実行しますが、それでも未加工のモデルプローブとして実行されます。事前のセッショントランスクリプト、bootstrap/AGENTS コンテキスト、コンテキストエンジン組み立て、ツール、同梱 MCP サーバーなしで、指定されたプロンプトと画像添付を送信します。
- `model run --gateway --model <provider/model>` は、リクエストが Gateway に一回限りのプロバイダー/モデル上書きを実行させるため、信頼されたオペレーターの Gateway 資格情報が必要です。

## モデル

プロバイダーに支えられたテキスト推論とモデル/プロバイダー検査には `model` を使用します。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gateway を起動したり、完全なエージェントツールインターフェイスを読み込んだりせずに、特定のプロバイダーをスモークテストするには、完全な `<provider/model>` 参照を使用します。

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

注記:

- ローカルの `model run` は、指定されたプロンプトだけを選択したモデルへ送信するため、プロバイダー/モデル/認証の健全性を確認する最も狭い CLI スモークです。
- ローカルの `model run --file` は、その軽量なパスを維持し、画像コンテンツを単一のユーザーメッセージへ直接添付します。PNG、JPEG、WebP などの一般的な画像ファイルは、MIME タイプが `image/*` として検出される場合に動作します。サポートされていないファイルや認識できないファイルは、プロバイダーが呼び出される前に失敗します。
- `model run --file` は、選択したマルチモーダルテキストモデルを直接テストしたい場合に最適です。OpenClaw の画像理解プロバイダー選択とデフォルト画像モデルルーティングを使用したい場合は `infer image describe` を使用します。
- 選択したモデルは画像入力をサポートしている必要があります。テキスト専用モデルはプロバイダー層でリクエストを拒否する場合があります。
- `model run --prompt` には空白以外のテキストを含める必要があります。空のプロンプトは、ローカルプロバイダーまたは Gateway が呼び出される前に拒否されます。
- ローカルの `model run` は、プロバイダーがテキスト出力を返さない場合にゼロ以外で終了するため、到達不能なローカルプロバイダーや空の補完が成功したプローブのように見えることはありません。
- モデル入力を未加工に保ちながら Gateway ルーティング、エージェントランタイム設定、または Gateway 管理のプロバイダー状態をテストする必要がある場合は `model run --gateway` を使用します。完全なエージェントコンテキスト、ツール、メモリ、セッショントランスクリプトが必要な場合は、`openclaw agent` またはチャットインターフェイスを使用します。
- `model auth login`、`model auth logout`、`model auth status` は、保存済みプロバイダー認証状態を管理します。

## 画像

生成、編集、説明には `image` を使用します。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

注記:

- 既存の入力ファイルから開始する場合は `image edit` を使用します。
- 参照画像編集でジオメトリヒントをサポートするプロバイダー/モデルには、`image edit` とともに `--size`、`--aspect-ratio`、または `--resolution` を使用します。
- 透過背景の OpenAI PNG 出力には、
  `--model openai/gpt-image-1.5` とともに `--output-format png --background transparent` を使用します。
  `--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。背景サポートを宣言していないプロバイダーは、そのヒントを無視された上書きとして報告します。
- どの同梱画像プロバイダーが検出可能で、設定済みで、選択済みであり、各プロバイダーがどの生成/編集機能を公開しているかを確認するには、`image providers --json` を使用します。
- 画像生成変更の最も狭いライブ CLI スモークとして `image generate --model <provider/model> --json` を使用します。例:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON レスポンスは `ok`、`provider`、`model`、`attempts`、および書き込まれた
  出力パスを報告します。`--output` が設定されている場合、最終的な拡張子は
  プロバイダーから返された MIME タイプに従うことがあります。

- `image describe` と `image describe-many` では、`--prompt` を使って、OCR、比較、UI 検査、簡潔なキャプション作成など、ビジョンモデルにタスク固有の指示を与えます。
- 遅いローカルビジョンモデルやコールドスタートの Ollama には `--timeout-ms` を使用します。
- `image describe` では、`--model` は画像対応の `<provider/model>` である必要があります。
- ローカル Ollama ビジョンモデルでは、先にモデルを pull し、`OLLAMA_API_KEY` に任意のプレースホルダー値、たとえば `ollama-local` を設定します。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## オーディオ

ファイル文字起こしには `audio` を使用します。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注記:

- `audio transcribe` はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model` は `<provider/model>` である必要があります。

## TTS

音声合成と TTS プロバイダー状態には `tts` を使用します。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注記:

- `tts status` は Gateway が管理する TTS 状態を反映するため、デフォルトで Gateway を使用します。
- TTS の動作を確認および設定するには、`tts providers`、`tts voices`、`tts set-provider` を使用します。

## 動画

生成と説明には `video` を使用します。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け取り、それらを動画生成ランタイムに転送します。
- `video describe` では、`--model` は `<provider/model>` である必要があります。

## Web

検索と取得のワークフローには `web` を使用します。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注記:

- 利用可能、設定済み、選択済みのプロバイダーを確認するには、`web providers` を使用します。

## 埋め込み

ベクトル作成と埋め込みプロバイダーの確認には `embedding` を使用します。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 出力

Infer コマンドは、共有エンベロープの下で JSON 出力を正規化します。

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

トップレベルフィールドは安定しています。

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

生成メディアコマンドでは、`outputs` に OpenClaw によって書き込まれたファイルが含まれます。自動化では、
人間が読める stdout を解析するのではなく、その配列内の
`path`、`mimeType`、`size`、およびメディア固有の寸法を使用してください。

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

## 注記

- `openclaw capability ...` は `openclaw infer ...` のエイリアスです。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル](/ja-JP/concepts/models)
