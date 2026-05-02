---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレス機能自動化の設計
summary: 推論優先のCLIによる、プロバイダー基盤のモデル、画像、音声、音声合成、動画、ウェブ、埋め込みワークフロー
title: 推論 CLI
x-i18n:
    generated_at: "2026-05-02T04:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04f8b4aeb70e960835612eedcc0a22202957803ca4e5eeb3f1e107e8c736e458
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` は、プロバイダー基盤の推論ワークフロー向けの正規のヘッドレスインターフェイスです。

これは意図的に、未加工の Gateway RPC 名や未加工のエージェントツール ID ではなく、機能ファミリーを公開します。

## infer をスキルにする

これをエージェントにコピーして貼り付けます。

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

優れた infer ベースのスキルでは、次のことを行うべきです。

- 一般的なユーザーの意図を正しい infer サブコマンドに対応付ける
- 対象とするワークフローについて、標準的な infer の例をいくつか含める
- 例や提案では `openclaw infer ...` を優先する
- スキル本文の中で infer の全体像を再文書化することは避ける

典型的な infer 中心のスキルの対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer を使う理由

`openclaw infer` は、OpenClaw 内のプロバイダー基盤の推論タスクに対して一貫した CLI を提供します。

利点:

- バックエンドごとに一回限りのラッパーを配線する代わりに、OpenClaw ですでに設定されているプロバイダーとモデルを使用できます。
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを 1 つのコマンドツリーにまとめられます。
- スクリプト、自動化、エージェント駆動のワークフロー向けに安定した `--json` 出力形式を使用できます。
- タスクの本質が「推論を実行する」ことである場合は、ファーストパーティの OpenClaw インターフェイスを優先できます。
- ほとんどの infer コマンドで Gateway を必要とせず、通常のローカルパスを使用できます。

エンドツーエンドのプロバイダーチェックでは、低レベルのプロバイダーテストが成功してから `openclaw infer ...` を優先してください。これは、プロバイダーリクエストが行われる前に、出荷済み CLI、設定の読み込み、デフォルトエージェントの解決、同梱 Plugin の有効化、共有機能ランタイムを実行します。

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

## よく使うタスク

この表は、一般的な推論タスクを対応する infer コマンドに対応付けます。

| タスク                         | コマンド                                                                                       | 注記                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行する      | `openclaw infer model run --prompt "..." --json`                                              | デフォルトでは通常のローカルパスを使用                 |
| 画像に対してモデルプロンプトを実行する | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 複数の画像入力には `--file` を繰り返す             |
| 画像を生成する            | `openclaw infer image generate --prompt "..." --json`                                         | 既存ファイルから開始する場合は `image edit` を使用  |
| 画像ファイルを説明する       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` は画像対応の `<provider/model>` である必要がある |
| 音声を書き起こす             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` は `<provider/model>` である必要がある                  |
| 音声を合成する            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` は Gateway 向け                      |
| 動画を生成する             | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` などのプロバイダーヒントをサポート        |
| 動画ファイルを説明する        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` は `<provider/model>` である必要がある                  |
| Web を検索する               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Web ページを取得する             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 埋め込みを作成する            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 動作

- `openclaw infer ...` は、これらのワークフローの主要な CLI インターフェイスです。
- 出力を別のコマンドやスクリプトで消費する場合は `--json` を使用します。
- 特定のバックエンドが必要な場合は `--provider` または `--model provider/model` を使用します。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` 形式を使用する必要があります。
- `image describe` では、明示的な `--model` により、そのプロバイダー/モデルを直接実行します。モデルカタログまたはプロバイダー設定で、そのモデルが画像対応である必要があります。`codex/<model>` は、境界付きの Codex アプリサーバー画像理解ターンを実行します。`openai-codex/<model>` は OpenAI Codex OAuth プロバイダーパスを使用します。
- ステートレスな実行コマンドはデフォルトでローカルになります。
- Gateway 管理の状態コマンドはデフォルトで Gateway になります。
- 通常のローカルパスでは Gateway が実行中である必要はありません。
- ローカルの `model run` は、軽量な 1 回限りのプロバイダー補完です。設定済みエージェントモデルと認証を解決しますが、チャットエージェントターンの開始、ツールの読み込み、同梱 MCP サーバーの起動は行いません。
- `model run --file` は画像ファイルを受け取り、その MIME タイプを検出し、指定されたプロンプトとともに選択されたモデルへ送信します。複数の画像には `--file` を繰り返します。
- `model run --file` は画像以外の入力を拒否します。音声ファイルには `infer audio transcribe` を、動画ファイルには `infer video describe` を使用します。
- `model run --gateway` は Gateway ルーティング、保存済み認証、プロバイダー選択、組み込みランタイムを実行しますが、それでも未加工のモデルプローブとして動作します。指定されたプロンプトと画像添付を、以前のセッショントランスクリプト、bootstrap/AGENTS コンテキスト、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーなしで送信します。
- `model run --gateway --model <provider/model>` は、リクエストが Gateway に 1 回限りのプロバイダー/モデル上書きを実行させるため、信頼済みオペレーターの Gateway 資格情報が必要です。

## モデル

プロバイダー基盤のテキスト推論とモデル/プロバイダーの検査には `model` を使用します。

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

- ローカルの `model run` は、指定されたプロンプトだけを選択されたモデルに送信するため、プロバイダー/モデル/認証の健全性を確認する最も狭い CLI スモークです。
- ローカルの `model run --file` はその軽量なパスを保ち、画像コンテンツを単一のユーザーメッセージに直接添付します。PNG、JPEG、WebP などの一般的な画像ファイルは、MIME タイプが `image/*` として検出される場合に機能します。サポートされていないファイルや認識できないファイルは、プロバイダーが呼び出される前に失敗します。
- `model run --file` は、選択したマルチモーダルテキストモデルを直接テストしたい場合に最適です。OpenClaw の画像理解プロバイダー選択とデフォルト画像モデルルーティングを使いたい場合は、`infer image describe` を使用します。
- 選択されたモデルは画像入力をサポートしている必要があります。テキスト専用モデルはプロバイダーレイヤーでリクエストを拒否する場合があります。
- `model run --prompt` には空白以外のテキストが含まれている必要があります。空のプロンプトは、ローカルプロバイダーまたは Gateway が呼び出される前に拒否されます。
- ローカルの `model run` は、プロバイダーがテキスト出力を返さない場合に非ゼロで終了するため、到達不能なローカルプロバイダーや空の補完が成功したプローブのように見えることはありません。
- モデル入力を未加工に保ちながら Gateway ルーティング、エージェントランタイム設定、または Gateway 管理のプロバイダー状態をテストする必要がある場合は、`model run --gateway` を使用します。完全なエージェントコンテキスト、ツール、メモリ、セッショントランスクリプトが必要な場合は、`openclaw agent` またはチャットインターフェイスを使用します。
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
- 参照画像編集でジオメトリヒントをサポートするプロバイダー/モデルでは、`image edit` とともに `--size`、`--aspect-ratio`、または `--resolution` を使用します。
- 透明背景の OpenAI PNG 出力には、`--model openai/gpt-image-1.5` とともに `--output-format png --background transparent` を使用します。`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。背景サポートを宣言していないプロバイダーは、そのヒントを無視された上書きとして報告します。
- `image providers --json` を使用して、どの同梱画像プロバイダーが検出可能で、設定済みで、選択されているか、および各プロバイダーが公開する生成/編集機能を確認します。
- 画像生成変更に対する最も狭いライブ CLI スモークとして、`image generate --model <provider/model> --json` を使用します。例:

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
  provider が返した MIME タイプに従うことがあります。

- `image describe` と `image describe-many` では、`--prompt` を使用して、OCR、比較、UI 検査、簡潔なキャプション作成など、ビジョンモデルにタスク固有の指示を与えます。
- 遅いローカルビジョンモデルやコールドスタートした Ollama では `--timeout-ms` を使用します。
- `image describe` では、`--model` は画像対応の `<provider/model>` である必要があります。
- ローカル Ollama ビジョンモデルでは、まずモデルを pull し、`OLLAMA_API_KEY` に任意のプレースホルダー値、たとえば `ollama-local` を設定します。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## 音声

ファイル文字起こしには `audio` を使用します。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

メモ:

- `audio transcribe` はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model` は `<provider/model>` である必要があります。

## TTS

音声合成と TTS provider の状態には `tts` を使用します。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

メモ:

- `tts status` は Gateway 管理の TTS 状態を反映するため、デフォルトで gateway になります。
- TTS の動作を調査および設定するには、`tts providers`、`tts voices`、`tts set-provider` を使用します。

## 動画

生成と説明には `video` を使用します。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

メモ:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け取り、それらを動画生成ランタイムへ転送します。
- `video describe` では、`--model` は `<provider/model>` である必要があります。

## Web

検索と fetch ワークフローには `web` を使用します。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

メモ:

- 利用可能、設定済み、選択済みの provider を調査するには `web providers` を使用します。

## 埋め込み

ベクトル作成と埋め込み provider の調査には `embedding` を使用します。

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

トップレベルのフィールドは安定しています。

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

生成メディアコマンドでは、`outputs` には OpenClaw によって書き込まれたファイルが含まれます。自動化では、人間が読める stdout を解析する代わりに、その配列内の `path`、`mimeType`、`size`、およびメディア固有の寸法を使用してください。

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

## メモ

- `openclaw capability ...` は `openclaw infer ...` のエイリアスです。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル](/ja-JP/concepts/models)
