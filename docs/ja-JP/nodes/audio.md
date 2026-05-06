---
read_when:
    - 音声文字起こしまたはメディア処理の変更
summary: 受信した音声/ボイスメモがダウンロードされ、文字起こしされ、返信に挿入される仕組み
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-05-06T09:06:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# 音声 / ボイスメモ (2026-01-17)

## 動作すること

- **メディア理解 (音声)**: 音声理解が有効化されている (または自動検出された) 場合、OpenClaw は以下を行います。
  1. 最初の音声添付 (ローカルパスまたは URL) を見つけ、必要に応じてダウンロードします。
  2. 各モデルエントリに送信する前に `maxBytes` を適用します。
  3. 条件を満たす最初のモデルエントリを順に実行します (プロバイダーまたは CLI)。
  4. 失敗またはスキップ (サイズ/タイムアウト) した場合は、次のエントリを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように、`CommandBody`/`RawBody` がトランスクリプトに設定されます。
- **詳細ログ**: `--verbose` では、文字起こしの実行時と本文を置き換えた時点でログを出力します。

## 自動検出 (デフォルト)

**モデルを設定していない**かつ `tools.media.audio.enabled` が **`false` に設定されていない**場合、
OpenClaw は次の順序で自動検出し、最初に動作する選択肢で停止します。

1. プロバイダーが音声理解をサポートしている場合の**アクティブな返信モデル**。
2. **ローカル CLI** (インストール済みの場合)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要)
   - `whisper-cli` (`whisper-cpp` 由来。`WHISPER_CPP_MODEL` または同梱の tiny モデルを使用)
   - `whisper` (Python CLI。モデルを自動的にダウンロード)
3. `read_many_files` を使用する **Gemini CLI** (`gemini`)
4. **プロバイダー認証**
   - 音声をサポートする設定済みの `models.providers.*` エントリが最初に試行されます
   - 同梱フォールバック順: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。
カスタマイズするには、`tools.media.audio.models` を設定します。
注: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか ( `~` は展開します)、完全なコマンドパスを含む明示的な CLI モデルを設定してください。

## 設定例

### プロバイダー + CLI フォールバック (OpenAI + Whisper CLI)

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

### スコープ制御付きのプロバイダーのみ

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

### プロバイダーのみ (Deepgram)

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

### プロバイダーのみ (Mistral Voxtral)

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

### プロバイダーのみ (SenseAudio)

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

### トランスクリプトをチャットにエコーする (オプトイン)

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

- プロバイダー認証は標準のモデル認証順序 (認証プロファイル、環境変数、`models.providers.*.apiKey`) に従います。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` が使用されている場合、Deepgram は `DEEPGRAM_API_KEY` を取得します。
- Deepgram のセットアップ詳細: [Deepgram (音声文字起こし)](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` が使用されている場合、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。
- SenseAudio のセットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは `tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB (`tools.media.audio.maxBytes`) です。上限を超える音声はそのモデルではスキップされ、次のエントリが試行されます。
- 1024 バイト未満の小さすぎる/空の音声ファイルは、プロバイダー/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**です (全文トランスクリプト)。出力をトリミングするには `tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。精度を高めるには `model: "gpt-4o-transcribe"` を設定します。
- 複数のボイスメモを処理するには `tools.media.audio.attachments` を使用します (`mode: "all"` + `maxAttachments`)。
- トランスクリプトはテンプレートで `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。エージェント処理の前に、発信元チャットへトランスクリプト確認を送信するには有効にします。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします (プレースホルダー: `{transcript}`)。
- CLI stdout には上限があります (5MB)。CLI 出力は簡潔にしてください。
- CLI の `args` では、ローカル音声ファイルパスに `{{MediaPath}}` を使用してください。古い `audio.transcription.command` 設定の非推奨 `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します。

### プロキシ環境のサポート

プロバイダーベースの音声文字起こしは、標準のアウトバウンドプロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合は、直接の外向き通信が使用されます。プロキシ設定の形式が不正な場合、OpenClaw は警告をログに記録し、直接フェッチにフォールバックします。

## グループでのメンション検出

グループチャットで `requireMention: true` が設定されている場合、OpenClaw はメンション確認の**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスメモも処理できます。

**仕組み:**

1. ボイスメッセージにテキスト本文がなく、グループがメンションを要求している場合、OpenClaw は「プリフライト」文字起こしを実行します。
2. トランスクリプトでメンションパターン (例: `@BotName`、絵文字トリガー) が確認されます。
3. メンションが見つかると、メッセージは完全な返信パイプラインに進みます。
4. ボイスメモがメンションゲートを通過できるように、トランスクリプトがメンション検出に使用されます。

**フォールバック動作:**

- プリフライト中に文字起こしが失敗した場合 (タイムアウト、API エラーなど)、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混合メッセージ (テキスト + 音声) が誤って破棄されることはありません。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループでプリフライトのトランスクリプトメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します (`true` でスキップ、`false` で強制有効化)。
- デフォルトは `false` です (メンションゲート条件に一致する場合、プリフライトは有効)。

**例:** Telegram グループで `requireMention: true` が設定されているとき、ユーザーが「ねえ @Claude、天気はどう？」というボイスメモを送信します。ボイスメモが文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、または `room` に正規化されます。
- CLI が 0 で終了し、プレーンテキストを出力することを確認してください。JSON は `jq -r .text` で整形する必要があります。
- `parakeet-mlx` で `--output-dir` を渡した場合、`--output-format` が `txt` (または省略) のとき、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式では stdout 解析にフォールバックします。
- 返信キューをブロックしないように、タイムアウト (`timeoutSeconds`、デフォルト 60 秒) は妥当な値にしてください。
- プリフライト文字起こしは、メンション検出のために**最初の**音声添付のみを処理します。追加の音声はメインのメディア理解フェーズで処理されます。

## 関連

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
