---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレス機能自動化の設計
summary: プロバイダーバックのモデル、画像、音声、TTS、動画、Web、埋め込みワークフロー向けの infer-first CLI
title: 推論 CLI
x-i18n:
    generated_at: "2026-04-23T14:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# 推論 CLI

`openclaw infer` は、プロバイダーバックの推論ワークフロー向けの標準的なヘッドレス画面です。

これは意図的に、生の gateway RPC 名や生の agent tool id ではなく、機能ファミリーを公開します。

## infer を Skills にする

これをエージェントにコピーして貼り付けてください:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

優れた infer ベースの Skills は、次のようにすべきです。

- 一般的なユーザー意図を正しい infer サブコマンドに対応付ける
- 対応するワークフロー向けに、いくつかの標準的な infer 例を含める
- 例や提案では `openclaw infer ...` を優先する
- Skills 本文内で infer の全面を丸ごと再説明しない

典型的な infer 中心の Skills 対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer を使う理由

`openclaw infer` は、OpenClaw 内でのプロバイダーバック推論タスクに対して、一貫した 1 つの CLI を提供します。

利点:

- バックエンドごとに場当たり的なラッパーを組む代わりに、OpenClaw ですでに設定済みのプロバイダーとモデルを使えます。
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを 1 つのコマンドツリーにまとめられます。
- スクリプト、自動化、エージェント駆動ワークフロー向けに、安定した `--json` 出力形式を使えます。
- タスクの本質が「推論を実行する」である場合は、ファーストパーティの OpenClaw 画面を優先できます。
- 多くの infer コマンドで Gateway を必要とせず、通常のローカルパスを使えます。

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

この表は、一般的な推論タスクを対応する infer コマンドに対応付けたものです。

| タスク                 | コマンド                                                               | 注記                                                  |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行 | `openclaw infer model run --prompt "..." --json`                       | 既定では通常のローカルパスを使います                 |
| 画像を生成する         | `openclaw infer image generate --prompt "..." --json`                  | 既存ファイルから始める場合は `image edit` を使います |
| 画像ファイルを説明する | `openclaw infer image describe --file ./image.png --json`              | `--model` は画像対応の `<provider/model>` である必要があります |
| 音声を文字起こしする   | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` は `<provider/model>` である必要があります  |
| 音声を合成する         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` は Gateway 指向です                      |
| 動画を生成する         | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| 動画ファイルを説明する | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` は `<provider/model>` である必要があります  |
| Web を検索する         | `openclaw infer web search --query "..." --json`                       |                                                       |
| Web ページを取得する   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| 埋め込みを作成する     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## 動作

- `openclaw infer ...` は、これらのワークフロー向けの主要 CLI 画面です。
- 出力を別のコマンドやスクリプトで消費する場合は `--json` を使ってください。
- 特定のバックエンドが必要な場合は、`--provider` または `--model provider/model` を使ってください。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` の形式でなければなりません。
- `image describe` では、明示的な `--model` により、その provider/model を直接実行します。モデルはモデルカタログまたは provider config 上で画像対応である必要があります。
- ステートレスな実行コマンドの既定は local です。
- Gateway 管理の state コマンドの既定は gateway です。
- 通常のローカルパスでは Gateway の起動は不要です。

## Model

プロバイダーバックのテキスト推論と model/provider の確認には `model` を使います。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

注記:

- `model run` は agent runtime を再利用するため、provider/model の上書きは通常の agent 実行と同じように動作します。
- `model auth login`、`model auth logout`、`model auth status` は、保存済みの provider 認証状態を管理します。

## Image

生成、編集、説明には `image` を使います。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

注記:

- 既存の入力ファイルから始める場合は `image edit` を使ってください。
- `image describe` では、`--model` は画像対応の `<provider/model>` でなければなりません。
- ローカルの Ollama ビジョンモデルでは、まずモデルを pull してから、`OLLAMA_API_KEY` に任意のプレースホルダー値、たとえば `ollama-local` を設定してください。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## Audio

ファイル文字起こしには `audio` を使います。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注記:

- `audio transcribe` はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model` は `<provider/model>` でなければなりません。

## TTS

音声合成と TTS provider state には `tts` を使います。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注記:

- `tts status` は Gateway 管理の TTS state を反映するため、既定で gateway を使います。
- TTS の動作を確認・設定するには `tts providers`、`tts voices`、`tts set-provider` を使ってください。

## Video

生成と説明には `video` を使います。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注記:

- `video describe` の `--model` は `<provider/model>` でなければなりません。

## Web

検索および取得ワークフローには `web` を使います。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注記:

- 利用可能・設定済み・選択中の provider を確認するには `web providers` を使ってください。

## Embedding

ベクトル作成および embedding provider の確認には `embedding` を使います。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 出力

infer コマンドは JSON 出力を共有エンベロープ配下に正規化します。

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

## よくある落とし穴

```bash
# 悪い例
openclaw infer media image generate --prompt "friendly lobster"

# 良い例
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# 悪い例
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 良い例
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 注記

- `openclaw capability ...` は `openclaw infer ...` のエイリアスです。
