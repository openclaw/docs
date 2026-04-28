---
read_when:
    - '`openclaw infer` コマンドを追加または変更する'
    - 安定したヘッドレスcapability automationを設計しています
summary: provider対応のmodel、image、audio、TTS、video、web、embeddingワークフロー向けのinfer-first CLI
title: Inference CLI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` は、provider対応のinferenceワークフロー向けの標準的なヘッドレスsurfaceです。

これは、raw Gateway RPC名やraw agent tool idではなく、capabilityファミリーを意図的に公開します。

## inferをSkillにする

これをagentにコピーして貼り付けてください。

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良いinferベースのSkillは、次のことを行うべきです。

- 一般的なユーザー意図を正しいinfer subcommandにマップする
- 対応するワークフロー向けに、いくつかの標準的なinfer例を含める
- 例や提案では `openclaw infer ...` を優先する
- Skill本文の中でinfer surface全体を再度ドキュメント化しない

典型的なinfer中心のSkill対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## inferを使う理由

`openclaw infer` は、OpenClaw内のprovider対応inferenceタスク向けに、一貫した1つのCLIを提供します。

利点:

- backendごとに単発のwrapperを用意する代わりに、OpenClawですでに設定されているproviderとmodelを使える
- model、image、audio transcription、TTS、video、web、embeddingのワークフローを1つのcommand tree配下にまとめられる
- script、automation、agent駆動ワークフロー向けに、安定した `--json` 出力形式を使える
- タスクが本質的に「inferenceを実行する」ことである場合、OpenClawのファーストパーティsurfaceを優先できる
- 多くのinfer commandで、Gatewayを必要とせず通常のローカル経路を使える

エンドツーエンドのprovider確認では、より低レベルのprovider testがgreenになった後は `openclaw infer ...` を優先してください。
これにより、実際に出荷されるCLI、config読み込み、default agent解決、同梱Plugin有効化、runtime dependency修復、および共有capability runtimeが、provider requestの前段で実行されます。

## Command tree

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

## よくあるタスク

この表は、一般的なinferenceタスクを対応するinfer commandに対応付けます。

| タスク | Command | 注記 |
| ------- | ------- | ---- |
| テキスト/model promptを実行する | `openclaw infer model run --prompt "..." --json` | デフォルトでは通常のローカル経路を使用 |
| imageを生成する | `openclaw infer image generate --prompt "..." --json` | 既存ファイルから始める場合は `image edit` を使用 |
| image fileを説明する | `openclaw infer image describe --file ./image.png --json` | `--model` はimage対応の `<provider/model>` である必要があります |
| audioを文字起こしする | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model` は `<provider/model>` である必要があります |
| 音声を合成する | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` はGateway指向です |
| videoを生成する | `openclaw infer video generate --prompt "..." --json` | `--resolution` などのprovider hintをサポート |
| video fileを説明する | `openclaw infer video describe --file ./clip.mp4 --json` | `--model` は `<provider/model>` である必要があります |
| webを検索する | `openclaw infer web search --query "..." --json` | |
| web pageを取得する | `openclaw infer web fetch --url https://example.com --json` | |
| embeddingを作成する | `openclaw infer embedding create --text "..." --json` | |

## 動作

- `openclaw infer ...` は、これらのワークフロー向けの主要なCLI surfaceです。
- 出力を別のcommandやscriptで消費する場合は `--json` を使ってください。
- 特定のbackendが必要な場合は `--provider` または `--model provider/model` を使ってください。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` 形式である必要があります。
- `image describe` では、明示的な `--model` により、そのprovider/modelを直接実行します。modelはmodel catalogまたはprovider configでimage対応である必要があります。`codex/<model>` は境界付きのCodex app-server image-understanding turnを実行し、`openai-codex/<model>` はOpenAI Codex OAuth provider経路を使用します。
- stateless execution commandはデフォルトでlocalです。
- Gateway管理state commandはデフォルトでgatewayです。
- 通常のローカル経路では、Gatewayが起動している必要はありません。
- `model run` はone-shotです。そのcommandのためにagent runtime経由で開かれたMCP serverは、local実行でも `--gateway` 実行でも、応答後に破棄されます。そのため、繰り返しのscript実行でstdio MCP child processが生き残ることはありません。

## Model

provider対応のtext inferenceおよびmodel/provider検査には `model` を使います。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

注記:

- `model run` はagent runtimeを再利用するため、provider/model overrideは通常のagent実行と同様に動作します。
- `model run` はヘッドレスautomation向けであるため、command完了後にsession単位の同梱MCP runtimeを保持しません。
- `model auth login`、`model auth logout`、`model auth status` は保存されたprovider auth stateを管理します。

## Image

生成、編集、説明には `image` を使います。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

注記:

- 既存の入力ファイルから始める場合は `image edit` を使ってください。
- `image edit` で、参照image編集時のgeometry hintをサポートするprovider/modelでは、`--size`、`--aspect-ratio`、`--resolution` を使ってください。
- 透過背景のOpenAI PNG出力には、`--model openai/gpt-image-1.5` とともに `--output-format png --background transparent` を使ってください。`--openai-background` もOpenAI専用aliasとして引き続き使えます。backgroundサポートを宣言していないproviderでは、そのhintは無視されたoverrideとして報告されます。
- 同梱image providerのうち、どれが検出可能か、設定済みか、選択中か、また各providerがどのgeneration/edit capabilityを公開しているかを確認するには、`image providers --json` を使ってください。
- image生成変更の最も狭いlive CLI smokeとして `image generate --model <provider/model> --json` を使ってください。例:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON応答では `ok`、`provider`、`model`、`attempts`、書き込まれたoutput pathが報告されます。`--output` が設定されている場合、最終的な拡張子はproviderが返したMIME typeに従うことがあります。

- `image describe` では、`--model` はimage対応の `<provider/model>` である必要があります。
- ローカルOllama vision modelでは、先にmodelをpullし、`OLLAMA_API_KEY` に任意のプレースホルダー値（たとえば `ollama-local`）を設定してください。[Ollama](/ja-JP/providers/ollama#vision-and-image-description)を参照してください。

## Audio

ファイル文字起こしには `audio` を使います。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注記:

- `audio transcribe` はファイル文字起こし用であり、realtime session管理用ではありません。
- `--model` は `<provider/model>` である必要があります。

## TTS

音声合成およびTTS provider stateには `tts` を使います。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注記:

- `tts status` はGateway管理のTTS stateを反映するため、デフォルトでgatewayを使います。
- TTS動作の確認と設定には、`tts providers`、`tts voices`、`tts set-provider` を使ってください。

## Video

生成と説明には `video` を使います。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け付け、video-generation runtimeへ転送します。
- `video describe` では、`--model` は `<provider/model>` である必要があります。

## Web

検索および取得ワークフローには `web` を使います。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注記:

- 利用可能、設定済み、選択中のproviderを確認するには `web providers` を使ってください。

## Embedding

vector作成およびembedding provider検査には `embedding` を使います。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON出力

infer commandはJSON出力を共有envelope配下で正規化します。

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

トップレベルfieldは安定しています。

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

生成media commandでは、`outputs` にOpenClawが書き込んだファイルが含まれます。
automationでは、人間向けstdoutを解析する代わりに、その配列内の `path`、`mimeType`、`size`、およびmedia固有のdimensionを使ってください。

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

- `openclaw capability ...` は `openclaw infer ...` のaliasです。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Models](/ja-JP/concepts/models)
