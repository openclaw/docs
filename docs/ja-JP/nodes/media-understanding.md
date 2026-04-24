---
read_when:
    - メディア理解を設計またはリファクタリングしています
    - 受信音声/動画/画像の前処理を調整しています
summary: プロバイダー + CLI フォールバックによる受信画像/音声/動画理解（任意）
title: メディア理解
x-i18n:
    generated_at: "2026-04-24T05:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# メディア理解 - 受信（2026-01-17）

OpenClaw は、返信パイプラインが実行される前に**受信メディア**（画像/音声/動画）を要約できます。ローカルツールやプロバイダーキーが利用可能なときを自動検出し、無効化やカスタマイズも可能です。理解がオフでも、モデルには引き続き元のファイル/URL が通常どおり渡されます。

ベンダー固有のメディア挙動はベンダー Plugin によって登録されますが、OpenClaw
core は共有の `tools.media` config、フォールバック順序、返信パイプライン統合を担います。

## 目標

- 任意機能: 受信メディアを短いテキストに事前要約し、ルーティング高速化 + コマンド解析改善に役立てる。
- 元のメディア配信をモデルに対して常に保持する。
- **プロバイダー API** と **CLI フォールバック** をサポートする。
- 複数モデルを順序付きフォールバック（error/size/timeout）で使えるようにする。

## 高レベルな挙動

1. 受信添付（`MediaPaths`, `MediaUrls`, `MediaTypes`）を収集する。
2. 有効な各 capability（image/audio/video）について、ポリシーに従って添付を選択する（デフォルト: **first**）。
3. 最初に適格なモデルエントリー（size + capability + auth）を選ぶ。
4. モデルが失敗するかメディアが大きすぎる場合、**次のエントリーにフォールバック**する。
5. 成功時:
   - `Body` は `[Image]`, `[Audio]`, `[Video]` ブロックになる。
   - 音声では `{{Transcript}}` を設定する。コマンド解析は caption text があればそれを使い、なければ transcript を使う。
   - caption はブロック内で `User text:` として保持される。

理解に失敗した場合や無効な場合でも、**返信フローは継続**し、元の body + attachments を使います。

## config 概要

`tools.media` は、**共有 models** と capability ごとの上書きをサポートします。

- `tools.media.models`: 共有モデル一覧（制御には `capabilities` を使用）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト（`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`）
  - プロバイダー上書き（`baseUrl`, `headers`, `providerOptions`）
  - `tools.media.audio.providerOptions.deepgram` 経由の Deepgram 音声オプション
  - 音声 transcript echo 制御（`echoTranscript`, デフォルト `false`; `echoFormat`）
  - 任意の **capability ごとの `models` 一覧**（共有 models より優先）
  - `attachments` ポリシー（`mode`, `maxAttachments`, `prefer`）
  - `scope`（任意の channel/chatType/session key によるゲーティング）
- `tools.media.concurrency`: capability 実行の最大同時数（デフォルト **2**）。

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
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

### モデルエントリー

各 `models[]` エントリーは **provider** または **CLI** にできます。

```json5
{
  type: "provider", // omitted の場合のデフォルト
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

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

CLI テンプレートでは次も使えます。

- `{{MediaDir}}`（メディアファイルを含むディレクトリ）
- `{{OutputDir}}`（この実行用に作成される scratch dir）
- `{{OutputBase}}`（拡張子なしの scratch file base path）

## デフォルトと制限

推奨デフォルト:

- `maxChars`: image/video は **500**（短く、コマンド向き）
- `maxChars`: audio は **unset**（制限を設定しない限り全文 transcript）
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

ルール:

- メディアが `maxBytes` を超える場合、そのモデルはスキップされ、**次のモデルが試されます**。
- **1024 bytes** 未満の音声ファイルは空/破損とみなされ、provider/CLI transcription 前にスキップされます。
- モデルが `maxChars` を超える内容を返した場合、出力は切り詰められます。
- `prompt` のデフォルトはシンプルな 「Describe the {media}.」 に `maxChars` ガイダンスを加えたものです（image/video のみ）。
- アクティブな primary image モデルがすでにネイティブに vision をサポートしている場合、OpenClaw
  は `[Image]` summary block をスキップし、元の画像をそのまま
  モデルに渡します。
- Gateway/WebChat の primary モデルが text-only の場合、image 添付は offloaded `media://inbound/*` ref として保持されるため、添付を失うことなく image tool または設定済み
  image モデルが引き続きそれを確認できます。
- 明示的な `openclaw infer image describe --model <provider/model>` リクエストは別です。これらは、その image-capable provider/model を直接実行し、`ollama/qwen2.5vl:7b` のような Ollama ref も含みます。
- `<capability>.enabled: true` だが models が未設定の場合、OpenClaw はその capability をサポートするなら **アクティブな reply model** を試します。

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled` が **`false` に設定されていない** かつ
models を設定していない場合、OpenClaw は次の順序で自動検出し、**最初に動作した選択肢で停止**します。

1. そのプロバイダーが capability をサポートしている場合の **アクティブな reply model**
2. **`agents.defaults.imageModel`** の primary/fallback ref（image のみ）
3. **ローカル CLI**（audio のみ。インストール済みの場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR` に encoder/decoder/joiner/tokens が必要）
   - `whisper-cli`（`whisper-cpp`; `WHISPER_CPP_MODEL` またはバンドル済み tiny model を使用）
   - `whisper`（Python CLI; モデルを自動ダウンロード）
4. `read_many_files` を使う **Gemini CLI**（`gemini`）
5. **プロバイダー認証**
   - capability をサポートする設定済み `models.providers.*` エントリーは、
     バンドル済みフォールバック順序より前に試されます。
   - image-capable model を持つ image-only config provider は、
     バンドル済みベンダー Plugin でなくても media understanding 用に自動登録されます。
   - Ollama image understanding は、たとえば `agents.defaults.imageModel` または
     `openclaw infer image describe --model ollama/<vision-model>` によって
     明示的に選択されたときに利用できます。
   - バンドル済みフォールバック順序:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

自動検出を無効にするには、次を設定します。

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

注: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを持つ明示的な CLI model を設定してください。

### プロキシ環境サポート（provider models）

プロバイダーベースの **audio** と **video** のメディア理解が有効な場合、OpenClaw
は provider HTTP 呼び出しに対して標準の送信プロキシ env var を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ env var が設定されていない場合、メディア理解は direct egress を使います。
プロキシ値が不正な場合、OpenClaw は警告をログに出し、direct
fetch にフォールバックします。

## capabilities（任意）

`capabilities` を設定した場合、そのエントリーはそのメディア種別に対してのみ実行されます。共有
リストでは、OpenClaw はデフォルトを推測できます。

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google`（Gemini API）: **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- image-capable model を持つ任意の `models.providers.<id>.models[]` カタログ:
  **image**

CLI エントリーでは、意図しない一致を避けるため **`capabilities` を明示的に設定**してください。
`capabilities` を省略した場合、そのエントリーは置かれた一覧に対して適格になります。

## プロバイダーサポートマトリクス（OpenClaw integrations）

| Capability | Provider integration | Notes |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor Plugin が image support を登録します。`openai-codex/*` は OAuth provider plumbing を使用し、`codex/*` は制限付き Codex app-server turn を使用します。MiniMax と MiniMax OAuth はどちらも `MiniMax-VL-01` を使用します。image-capable config provider は自動登録されます。 |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral | Provider transcription（Whisper/Deepgram/Gemini/Voxtral）。 |
| Video      | Google, Qwen, Moonshot | Vendor Plugin 経由の provider video understanding。Qwen の video understanding は Standard DashScope endpoint を使用します。 |

MiniMax 注記:

- `minimax` と `minimax-portal` の image understanding は、Plugin 所有の
  `MiniMax-VL-01` media provider から提供されます。
- バンドル済み MiniMax text catalog は引き続き text-only で始まります。明示的な
  `models.providers.minimax` エントリーにより、image-capable な M2.7 chat ref が materialize されます。

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア capability に対して利用可能な最新世代の最も強いモデルを優先してください。
- 信頼できない入力を扱う tool-enabled エージェントでは、古い/弱いメディアモデルは避けてください。
- 可用性のために capability ごとに少なくとも 1 つのフォールバックを維持してください（高品質モデル + 高速/低コストモデル）。
- CLI フォールバック（`whisper-cli`, `whisper`, `gemini`）は、provider API が利用できないときに有用です。
- `parakeet-mlx` 注記: `--output-dir` を使う場合、OpenClaw は出力形式が `txt`（または未指定）のときに `<output-dir>/<media-basename>.txt` を読みます。`txt` 以外の形式では stdout にフォールバックします。

## 添付ポリシー

capability ごとの `attachments` は、どの添付を処理するかを制御します。

- `mode`: `first`（デフォルト）または `all`
- `maxAttachments`: 処理数の上限（デフォルト **1**）
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` の場合、出力には `[Image 1/2]`, `[Audio 2/2]` などのラベルが付きます。

ファイル添付の抽出挙動:

- 抽出されたファイルテキストは、
  メディアプロンプトに追加される前に **信頼できない外部コンテンツ** としてラップされます。
- 注入されるブロックは、
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な boundary marker を使い、
  `Source: External` メタデータ行を含みます。
- この添付抽出パスでは、メディアプロンプトの肥大化を避けるため、
  長い `SECURITY NOTICE:` バナーは意図的に省略されます。それでも boundary
  marker とメタデータは保持されます。
- ファイルに抽出可能なテキストがない場合、OpenClaw は `[No extractable text]` を注入します。
- このパスで PDF がレンダリングされたページ画像へフォールバックした場合でも、メディアプロンプトは
  `[PDF content rendered to images; images not forwarded to model]`
  というプレースホルダーを保持します。これは、この添付抽出ステップが転送するのは
  レンダリング済み PDF 画像ではなくテキストブロックだからです。

## config 例

### 1) 共有モデル一覧 + 上書き

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

### 2) Audio + Video のみ（image オフ）

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

### 3) 任意の image understanding

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
          { provider: "anthropic", model: "claude-opus-4-6" },
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

### 4) マルチモーダル単一エントリー（明示的 capabilities）

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

## ステータス出力

メディア理解が実行されると、`/status` には短い要約行が含まれます。

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

これは capability ごとの結果と、該当する場合は選択された provider/model を示します。

## 注意

- 理解は **ベストエフォート** です。エラーがあっても返信はブロックされません。
- 理解が無効でも、添付は引き続きモデルに渡されます。
- 理解をどこで実行するかを制限するには `scope` を使用します（例: DM のみ）。

## 関連ドキュメント

- [Configuration](/ja-JP/gateway/configuration)
- [Image & Media Support](/ja-JP/nodes/images)
