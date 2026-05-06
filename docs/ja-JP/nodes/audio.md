---
read_when:
    - 音声の文字起こしやメディア処理を変更する
summary: 受信した音声/ボイスメモがどのようにダウンロード、文字起こしされ、返信に組み込まれるか
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-05-06T05:11:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f537dc26cfee00816ec200e67198ab659b4e728e422a4fba6a8a8588302c6146
    source_path: nodes/audio.md
    workflow: 16
---

# 音声 / ボイスメモ（2026-01-17）

## 機能すること

- **メディア理解（音声）**: 音声理解が有効な場合（または自動検出された場合）、OpenClaw は次を行います。
  1. 最初の音声添付ファイル（ローカルパスまたは URL）を見つけ、必要に応じてダウンロードします。
  2. 各モデルエントリへ送信する前に `maxBytes` を適用します。
  3. 対象となる最初のモデルエントリを順番に実行します（プロバイダーまたは CLI）。
  4. 失敗またはスキップ（サイズ/タイムアウト）した場合は、次のエントリを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように、`CommandBody`/`RawBody` が文字起こし結果に設定されます。
- **詳細ログ**: `--verbose` では、文字起こしが実行されたタイミングと本文を置き換えたタイミングをログに記録します。

## 自動検出（デフォルト）

**モデルを設定していない**かつ `tools.media.audio.enabled` が `false` に設定されて**いない**場合、
OpenClaw は次の順序で自動検出し、最初に動作したオプションで停止します。

1. プロバイダーが音声理解をサポートしている場合の**アクティブな返信モデル**。
2. **ローカル CLI**（インストール済みの場合）
   - `sherpa-onnx-offline`（encoder/decoder/joiner/tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - `whisper-cli`（`whisper-cpp` 由来。`WHISPER_CPP_MODEL` または同梱の tiny モデルを使用）
   - `whisper`（Python CLI。モデルを自動的にダウンロード）
3. `read_many_files` を使用する **Gemini CLI**（`gemini`）
4. **プロバイダー認証**
   - 音声をサポートする、設定済みの `models.providers.*` エントリが先に試されます
   - 同梱フォールバック順: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。
カスタマイズするには、`tools.media.audio.models` を設定します。
注: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを持つ明示的な CLI モデルを設定してください。

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
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
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

### スコープゲーティング付きプロバイダーのみ

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
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
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

### 文字起こしをチャットにエコー（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注記と制限

- プロバイダー認証は標準のモデル認証順序（認証プロファイル、環境変数、`models.providers.*.apiKey`）に従います。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` が使用されている場合、Deepgram は `DEEPGRAM_API_KEY` を取得します。
- Deepgram のセットアップ詳細: [Deepgram（音声文字起こし）](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` が使用されている場合、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。
- SenseAudio のセットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは `tools.media.audio` を介して `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。上限を超える音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 バイト未満の小さすぎる/空の音声ファイルは、プロバイダー/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**です（完全な文字起こし）。出力を短縮するには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。精度を高めるには `model: "gpt-4o-transcribe"` を設定します。
- 複数のボイスメモを処理するには、`tools.media.audio.attachments` を使用します（`mode: "all"` + `maxAttachments`）。
- 文字起こしはテンプレートで `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。エージェント処理の前に、送信元チャットへ文字起こし確認を送り返すには有効にします。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします（プレースホルダー: `{transcript}`）。
- CLI stdout には上限があります（5MB）。CLI 出力は簡潔にしてください。
- CLI `args` はローカル音声ファイルパスに `{{MediaPath}}` を使用してください。古い `audio.transcription.command` 設定の非推奨 `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します。

### プロキシ環境のサポート

プロバイダーベースの音声文字起こしは、標準の送信プロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合は、直接の外部接続が使用されます。プロキシ設定の形式が不正な場合、OpenClaw は警告をログに記録し、直接 fetch にフォールバックします。

## グループでのメンション検出

グループチャットに `requireMention: true` が設定されている場合、OpenClaw はメンションを確認する**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスメモも処理できます。

**仕組み:**

1. ボイスメッセージにテキスト本文がなく、グループがメンションを要求している場合、OpenClaw は「プリフライト」文字起こしを実行します。
2. 文字起こし結果でメンションパターン（例: `@BotName`、絵文字トリガー）が確認されます。
3. メンションが見つかった場合、メッセージは完全な返信パイプラインに進みます。
4. ボイスメモがメンションゲートを通過できるように、文字起こし結果がメンション検出に使用されます。

**フォールバック動作:**

- プリフライト中に文字起こしが失敗した場合（タイムアウト、API エラーなど）、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ（テキスト + 音声）が誤って破棄されることがなくなります。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループのプリフライト文字起こしメンションチェックをスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（スキップするには `true`、強制的に有効にするには `false`）。
- デフォルトは `false` です（メンションゲート条件に一致する場合、プリフライトが有効）。

**例:** Telegram グループで `requireMention: true` が設定されている状態で、ユーザーが「Hey @Claude, what's the weather?」と言うボイスメモを送信します。ボイスメモが文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、`room` に正規化されます。
- CLI が 0 で終了し、プレーンテキストを出力することを確認してください。JSON は `jq -r .text` で加工する必要があります。
- `parakeet-mlx` で `--output-dir` を渡す場合、`--output-format` が `txt`（または省略）であれば、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式は stdout 解析にフォールバックします。
- 返信キューのブロックを避けるため、タイムアウト（`timeoutSeconds`、デフォルト 60 秒）は妥当な値にしてください。
- プリフライト文字起こしは、メンション検出のために**最初の**音声添付ファイルのみを処理します。追加の音声は、メインのメディア理解フェーズ中に処理されます。

## 関連

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
