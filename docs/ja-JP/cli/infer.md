---
read_when:
    - '`openclaw infer`コマンドを追加または変更する場合'
    - 安定したヘッドレス機能自動化を設計している場合
summary: プロバイダーバックエンドのモデル、画像、音声、TTS、動画、Web、および埋め込みワークフロー向けのinfer-first CLI
title: 推論CLI
x-i18n:
    generated_at: "2026-04-24T04:50:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`は、プロバイダーバックエンドの推論ワークフローにおける正規のヘッドレスインターフェースです。

これは意図的に、生のgateway RPC名や生のエージェントツールIDではなく、機能ファミリーを公開します。

## inferをSkillにする

これをコピーしてエージェントに貼り付けてください。

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

inferベースの良いSkillは、次のことを行うべきです。

- 一般的なユーザー意図を正しいinferサブコマンドにマッピングする
- 対応するワークフロー向けに、いくつかの正規のinfer例を含める
- 例や提案では`openclaw infer ...`を優先する
- Skill本文の中でinfer全体を再度ドキュメント化しない

一般的なinfer中心のSkill対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## inferを使う理由

`openclaw infer`は、OpenClaw内のプロバイダーバックエンド推論タスク向けに、一貫したCLIを提供します。

利点:

- バックエンドごとに単発のラッパーをつなぎ込む代わりに、OpenClawですでに設定済みのプロバイダーとモデルを使える
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを1つのコマンドツリーにまとめられる
- スクリプト、自動化、エージェント駆動ワークフロー向けに、安定した`--json`出力形式を使える
- タスクの本質が「推論を実行する」ことである場合、ファーストパーティのOpenClawインターフェースを優先できる
- 多くのinferコマンドでgatewayを必要とせず、通常のローカルパスを使える

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

この表は、一般的な推論タスクを対応するinferコマンドに対応付けます。

| タスク | コマンド | 注意 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| テキスト/モデルプロンプトを実行する | `openclaw infer model run --prompt "..." --json` | デフォルトでは通常のローカルパスを使用 |
| 画像を生成する | `openclaw infer image generate --prompt "..." --json` | 既存ファイルから始める場合は`image edit`を使う |
| 画像ファイルを説明する | `openclaw infer image describe --file ./image.png --json` | `--model`は画像対応の`<provider/model>`である必要がある |
| 音声を文字起こしする | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model`は`<provider/model>`である必要がある |
| 音声を合成する | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`はgateway指向 |
| 動画を生成する | `openclaw infer video generate --prompt "..." --json` |  |
| 動画ファイルを説明する | `openclaw infer video describe --file ./clip.mp4 --json` | `--model`は`<provider/model>`である必要がある |
| Webを検索する | `openclaw infer web search --query "..." --json` |  |
| Webページを取得する | `openclaw infer web fetch --url https://example.com --json` |  |
| 埋め込みを作成する | `openclaw infer embedding create --text "..." --json` |  |

## 動作

- `openclaw infer ...`は、これらのワークフローの主要なCLIインターフェースです。
- 出力を別のコマンドやスクリプトで利用する場合は`--json`を使用してください。
- 特定のバックエンドが必要な場合は、`--provider`または`--model provider/model`を使用してください。
- `image describe`、`audio transcribe`、`video describe`では、`--model`は`<provider/model>`形式である必要があります。
- `image describe`では、明示的な`--model`はそのprovider/modelを直接実行します。モデルはモデルカタログまたはプロバイダー設定で画像対応である必要があります。`codex/<model>`は制限付きのCodex app-server画像理解ターンを実行し、`openai-codex/<model>`はOpenAI Codex OAuthプロバイダーパスを使用します。
- ステートレスな実行コマンドはデフォルトでローカルです。
- gateway管理状態のコマンドはデフォルトでgatewayです。
- 通常のローカルパスでは、gatewayが動作中である必要はありません。

## Model

プロバイダーバックエンドのテキスト推論と、モデル/プロバイダーの確認には`model`を使用します。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

注意:

- `model run`はエージェントランタイムを再利用するため、プロバイダー/モデルの上書きは通常のエージェント実行と同様に動作します。
- `model auth login`、`model auth logout`、`model auth status`は保存済みのプロバイダー認証状態を管理します。

## Image

生成、編集、説明には`image`を使用します。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

注意:

- 既存の入力ファイルから始める場合は`image edit`を使用してください。
- `image describe`では、`--model`は画像対応の`<provider/model>`である必要があります。
- ローカルのOllamaビジョンモデルでは、先にモデルをpullし、`OLLAMA_API_KEY`に任意のプレースホルダー値（たとえば`ollama-local`）を設定してください。[Ollama](/ja-JP/providers/ollama#vision-and-image-description)を参照してください。

## Audio

ファイルの文字起こしには`audio`を使用します。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注意:

- `audio transcribe`はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model`は`<provider/model>`である必要があります。

## TTS

音声合成とTTSプロバイダー状態には`tts`を使用します。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意:

- `tts status`はgateway管理のTTS状態を反映するため、デフォルトでgatewayを使用します。
- TTS動作の確認と設定には、`tts providers`、`tts voices`、`tts set-provider`を使用してください。

## Video

生成と説明には`video`を使用します。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注意:

- `video describe`では、`--model`は`<provider/model>`である必要があります。

## Web

検索および取得ワークフローには`web`を使用します。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意:

- 利用可能、設定済み、選択中のプロバイダーを確認するには`web providers`を使用してください。

## Embedding

ベクトル作成と埋め込みプロバイダーの確認には`embedding`を使用します。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON出力

inferコマンドは、共有エンベロープの下でJSON出力を正規化します。

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

## 注意

- `openclaw capability ...`は`openclaw infer ...`のエイリアスです。

## 関連

- [CLI reference](/ja-JP/cli)
- [Models](/ja-JP/concepts/models)
