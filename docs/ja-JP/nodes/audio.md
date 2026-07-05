---
read_when:
    - 音声文字起こしまたはメディア処理の変更
summary: 受信した音声/ボイスメモがダウンロード、文字起こしされ、返信に注入される仕組み
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-07-05T11:28:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8203660ec2a09e69d5e1369a62d88170a9226dc8c9bb609964addfd4822419fc
    source_path: nodes/audio.md
    workflow: 16
---

## 機能

音声理解が有効な場合（または自動検出された場合）、OpenClaw は次を行います。

1. 最初の音声添付ファイル（ローカルパスまたは URL）を見つけ、必要に応じてダウンロードします。
2. 各モデルエントリへ送信する前に `maxBytes` を適用します。
3. 対象となる最初のモデルエントリを順番に実行します（プロバイダーまたは CLI）。エントリが失敗またはスキップ（サイズ/タイムアウト）された場合は、次のエントリを試します。
4. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。

文字起こしに成功すると、スラッシュコマンドが引き続き動作するように、`CommandBody`/`RawBody` も文字起こし結果に設定されます。`--verbose` では、文字起こしが実行されたタイミングと本文を置き換えたタイミングがログに表示されます。

## 自動検出（デフォルト）

モデルを設定しておらず、`tools.media.audio.enabled` が `false` でない場合、OpenClaw は次の順序で自動検出し、最初に動作したオプションで停止します。

1. **アクティブな返信モデル**。そのプロバイダーが音声理解をサポートしている場合。
2. **設定済みプロバイダー認証** — 音声文字起こしをサポートするプロバイダーで認証が利用可能な任意の `models.providers.*` エントリ。これはローカル CLI より前に確認されるため、設定済みの API キーは常に `PATH` 上のローカルバイナリより優先されます。
   複数設定されている場合のプロバイダー優先順位: Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **ローカル CLI**（プロバイダー認証が解決されなかった場合のみ）。次の順序で確認されます。
   - `sherpa-onnx-offline`（`tokens.txt`、`encoder.onnx`、`decoder.onnx`、`joiner.onnx` を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - `whisper-cli`（`whisper-cpp` 由来。`WHISPER_CPP_MODEL` またはバンドルされた tiny モデルを使用）
   - `whisper`（Python CLI。モデルを自動的にダウンロード）

メディア理解向けの Gemini CLI 自動検出は、画像/動画用のサンドボックス化された Antigravity CLI（`agy`）フォールバックに置き換えられました。音声では、上記のローカルバイナリ以外の CLI フォールバックは使用しません。

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。カスタマイズするには、`tools.media.audio.models` を設定します。

<Note>
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを持つ明示的な CLI モデルを設定してください。
</Note>

## 設定例

### プロバイダー + CLI フォールバック（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### スコープ制御付きプロバイダーのみ

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

### プロバイダーのみ（Deepgram）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### プロバイダーのみ（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### プロバイダーのみ（SenseAudio）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### 文字起こし結果をチャットへエコー（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## 注記と制限

- プロバイダー認証は標準のモデル認証順序（認証プロファイル、環境変数、`models.providers.*.apiKey`）に従います。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` が使用される場合、Deepgram は `DEEPGRAM_API_KEY` を取得します。セットアップ詳細: [Deepgram](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` が使用される場合、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。セットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは `tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。上限を超える音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 バイト未満の音声ファイルは、プロバイダー/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**（全文字起こし）です。出力を切り詰めるには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI 自動検出のデフォルトは `gpt-4o-transcribe` です。より安価/高速なオプションには `model: "gpt-4o-mini-transcribe"` を設定します。
- 複数のボイスメモを処理するには `tools.media.audio.attachments` を使用します（`mode: "all"` と `maxAttachments`、デフォルトは 1）。
- 文字起こし結果はテンプレートで `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。エージェント処理の前に、元のチャットへ文字起こし確認を送信するには有効にします。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします（プレースホルダー: `{transcript}`、デフォルト `📝 "{transcript}"`）。
- CLI 標準出力は 5MB に制限されます。CLI 出力は簡潔にしてください。
- CLI `args` では、ローカル音声ファイルパスに `{{MediaPath}}` を使用してください。古い `audio.transcription.command` 設定から非推奨の `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します（廃止されたキー: `audio.transcription`、`tools.media.audio.models` に置換）。

### プロキシ環境のサポート

プロバイダーベースの音声文字起こしは、undici の `EnvHttpProxyAgent` セマンティクスに合わせて、標準の送信プロキシ環境変数に従います。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小文字の変数は大文字より優先されます。`NO_PROXY`/`no_proxy` エントリ（ホスト名、`*.suffix`、または `host:port`）はプロキシをバイパスします。プロキシ環境変数が設定されていない場合は、直接送信が使用されます。プロキシ設定が失敗した場合（不正な URL）、OpenClaw は警告をログに記録し、直接フェッチにフォールバックします。

## グループでのメンション検出

グループチャットに `requireMention: true` が設定されている場合、OpenClaw はメンションを確認する**前に**音声を文字起こしします。これにより、メッセージにテキスト本文がない場合でも、ボイスメモがメンションゲートを通過できます。

**動作:**

1. ボイスメッセージにテキスト本文がなく、グループがメンションを要求している場合、OpenClaw は最初の音声添付ファイルの事前文字起こしを実行します。
2. 文字起こし結果でメンションパターン（例: `@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかった場合、メッセージは完全な返信パイプラインへ進みます。

**フォールバック動作:** 事前文字起こしが失敗した場合（タイムアウト、API エラーなど）、メッセージはテキストのみのメンション検出にフォールバックするため、混在メッセージ（テキスト + 音声）が破棄されることはありません。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループの事前文字起こしメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（スキップするには `true`、強制的に有効にするには `false`）。
- デフォルトは `false`（メンションゲート条件に一致する場合、事前確認が有効）です。

**例:** Telegram グループで `requireMention: true` が設定されている状態で、ユーザーが「ねえ @Claude、天気はどう？」と言うボイスメモを送信します。ボイスメモは文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、または `channel` に正規化されます。
- CLI が 0 で終了し、プレーンテキストを出力することを確認してください。JSON 出力は `jq -r .text` 経由で整形する必要があります。
- `parakeet-mlx` で `--output-dir` を渡す場合、`--output-format` が `txt`（または省略）であれば、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式では、標準出力の解析にフォールバックします。
- 返信キューのブロックを避けるため、タイムアウト（`timeoutSeconds`、デフォルト 60 秒）は妥当な値にしてください。
- 事前文字起こしは、メンション検出のために**最初の**音声添付ファイルのみを処理します。追加の音声添付ファイルは、メインのメディア理解フェーズで処理されます。

## 関連

- [メディア理解](/ja-JP/nodes/media-understanding)
- [会話モード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
