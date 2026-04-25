---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレス機能の自動化を設計する
summary: プロバイダーバックのモデル、画像、音声、TTS、動画、Web、埋め込みワークフロー向けの推論優先CLI
title: 推論CLI
x-i18n:
    generated_at: "2026-04-25T18:16:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23242bfa8a354b949473322f47da90876e05a5e54d467ca134f2e59c3ae8bb02
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` は、プロバイダーバックの推論ワークフロー向けの正規のヘッドレスサーフェスです。

これは意図的に、未加工の gateway RPC 名や未加工のエージェントツール ID ではなく、機能ファミリーを公開します。

## infer を Skill にする

これをエージェントにコピーして貼り付けます:

```text
https://docs.openclaw.ai/cli/infer を読んでから、私の一般的なワークフローを `openclaw infer` にルーティングする Skill を作成してください。
モデル実行、画像生成、動画生成、音声文字起こし、TTS、Web 検索、埋め込みに重点を置いてください。
```

優れた infer ベースの Skill は次のようになります:

- 一般的なユーザー意図を正しい infer サブコマンドに対応付ける
- 対応対象のワークフローについて、いくつかの正規の infer 例を含める
- 例や提案では `openclaw infer ...` を優先する
- Skill 本文内で infer サーフェス全体を再文書化しない

典型的な infer 重視の Skill の対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer を使う理由

`openclaw infer` は、OpenClaw 内のプロバイダーバック推論タスク向けに一貫した単一の CLI を提供します。

利点:

- バックエンドごとに単発のラッパーを配線するのではなく、OpenClaw ですでに設定されているプロバイダーとモデルを使えます。
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを、1 つのコマンドツリーの下にまとめられます。
- スクリプト、自動化、エージェント駆動ワークフロー向けに、安定した `--json` 出力形式を使えます。
- タスクが本質的に「推論を実行する」ものである場合は、ファーストパーティの OpenClaw サーフェスを優先できます。
- ほとんどの infer コマンドでは、gateway を必要とせず通常のローカルパスを使えます。

エンドツーエンドのプロバイダーチェックでは、下位レベルの
プロバイダーテストがグリーンになったら `openclaw infer ...` を優先します。これにより、プロバイダーリクエストが実行される前に、出荷済み CLI、設定読み込み、
デフォルトエージェント解決、同梱 Plugin の有効化、ランタイム依存関係の修復、
共有機能ランタイムが実行されます。

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

| タスク | コマンド | 注記 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行する | `openclaw infer model run --prompt "..." --json` | デフォルトで通常のローカルパスを使います |
| 画像を生成する | `openclaw infer image generate --prompt "..." --json` | 既存ファイルから始める場合は `image edit` を使います |
| 画像ファイルを説明する | `openclaw infer image describe --file ./image.png --json` | `--model` は画像対応の `<provider/model>` である必要があります |
| 音声を文字起こしする | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model` は `<provider/model>` である必要があります |
| 音声を合成する | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` は gateway 指向です |
| 動画を生成する | `openclaw infer video generate --prompt "..." --json` | `--resolution` のようなプロバイダーヒントをサポートします |
| 動画ファイルを説明する | `openclaw infer video describe --file ./clip.mp4 --json` | `--model` は `<provider/model>` である必要があります |
| Web を検索する | `openclaw infer web search --query "..." --json` |  |
| Web ページを取得する | `openclaw infer web fetch --url https://example.com --json` |  |
| 埋め込みを作成する | `openclaw infer embedding create --text "..." --json` |  |

## 動作

- `openclaw infer ...` は、これらのワークフロー向けの主要な CLI サーフェスです。
- 出力を別のコマンドやスクリプトで利用する場合は `--json` を使います。
- 特定のバックエンドが必要な場合は `--provider` または `--model provider/model` を使います。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` 形式である必要があります。
- `image describe` では、明示的な `--model` はその provider/model を直接実行します。モデルはモデルカタログまたはプロバイダー設定で画像対応である必要があります。`codex/<model>` は境界付きの Codex app-server 画像理解ターンを実行し、`openai-codex/<model>` は OpenAI Codex OAuth プロバイダーパスを使います。
- ステートレス実行コマンドのデフォルトは local です。
- gateway 管理状態コマンドのデフォルトは gateway です。
- 通常のローカルパスでは、gateway を実行しておく必要はありません。
- `model run` はワンショットです。そのコマンドのエージェントランタイム経由で開かれた MCP サーバーは、local と `--gateway` 実行のどちらでも応答後に終了するため、繰り返しのスクリプト呼び出しで stdio MCP 子プロセスが生き続けることはありません。

## Model

`model` は、プロバイダーバックのテキスト推論と model/provider の検査に使います。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

注記:

- `model run` はエージェントランタイムを再利用するため、プロバイダー/モデルのオーバーライドは通常のエージェント実行と同様に動作します。
- `model run` はヘッドレス自動化を目的としているため、コマンド終了後にセッションごとの同梱 MCP ランタイムを保持しません。
- `model auth login`、`model auth logout`、`model auth status` は、保存済みのプロバイダー認証状態を管理します。

## 画像

`image` は、生成、編集、説明に使います。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

注記:

- 既存の入力ファイルから始める場合は `image edit` を使います。
- `image providers --json` を使うと、どの同梱画像プロバイダーが
  検出可能か、設定済みか、選択済みか、また各プロバイダーがどの生成/編集機能を
  公開しているかを確認できます。
- `image generate --model <provider/model> --json` は、画像生成変更に対する最も限定的なライブ
  CLI スモークとして使います。例:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 応答は `ok`、`provider`、`model`、`attempts`、書き込まれた
  出力パスを報告します。`--output` が設定されている場合、最終拡張子は
  プロバイダーが返した MIME type に従うことがあります。

- `image describe` では、`--model` は画像対応の `<provider/model>` である必要があります。
- ローカルの Ollama ビジョンモデルでは、最初にモデルを pull し、`OLLAMA_API_KEY` を任意のプレースホルダー値、たとえば `ollama-local` に設定します。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## 音声

`audio` はファイルの文字起こしに使います。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注記:

- `audio transcribe` はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model` は `<provider/model>` である必要があります。

## TTS

`tts` は音声合成と TTS プロバイダー状態に使います。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注記:

- `tts status` は gateway 管理の TTS 状態を反映するため、デフォルトで gateway を使います。
- `tts providers`、`tts voices`、`tts set-provider` を使って TTS の動作を検査および設定します。

## 動画

`video` は生成と説明に使います。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け付け、それらを動画生成ランタイムに転送します。
- `video describe` では、`--model` は `<provider/model>` である必要があります。

## Web

`web` は検索と取得のワークフローに使います。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注記:

- `web providers` を使うと、利用可能、設定済み、選択済みのプロバイダーを検査できます。

## 埋め込み

`embedding` はベクトル作成と埋め込みプロバイダーの検査に使います。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 出力

infer コマンドは、JSON 出力を共有エンベロープの下に正規化します:

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

トップレベルフィールドは安定しています:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

生成メディアコマンドでは、`outputs` に OpenClaw が書き込んだファイルが入ります。自動化では、
人間向けの stdout を解析する代わりに、その配列内の `path`、`mimeType`、`size`、およびメディア固有の寸法を使ってください。

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
