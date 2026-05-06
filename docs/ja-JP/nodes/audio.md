---
read_when:
    - 音声文字起こしまたはメディア処理の変更
summary: 受信した音声/ボイスノートをダウンロード、文字起こしし、返信に挿入する方法
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-05-06T17:58:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## 動作する内容

- **メディア理解 (音声)**: 音声理解が有効になっている (または自動検出された) 場合、OpenClaw は次を行います:
  1. 最初の音声添付 (ローカルパスまたは URL) を見つけ、必要に応じてダウンロードします。
  2. 各モデルエントリに送信する前に `maxBytes` を適用します。
  3. 対象となる最初のモデルエントリを順番に実行します (プロバイダーまたは CLI)。
  4. 失敗またはスキップ (サイズ/タイムアウト) した場合、次のエントリを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように、`CommandBody`/`RawBody` が文字起こしに設定されます。
- **詳細ログ**: `--verbose` では、文字起こしの実行時と本文の置き換え時にログを出力します。

## 自動検出 (デフォルト)

**モデルを設定していない**かつ `tools.media.audio.enabled` が `false` に設定されて**いない**場合、
OpenClaw は次の順序で自動検出し、最初に動作するオプションで停止します:

1. プロバイダーが音声理解をサポートしている場合の**アクティブな返信モデル**。
2. **ローカル CLI** (インストール済みの場合)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要)
   - `whisper-cli` (`whisper-cpp` 由来。`WHISPER_CPP_MODEL` または同梱の tiny モデルを使用)
   - `whisper` (Python CLI。モデルを自動的にダウンロード)
3. `read_many_files` を使用する **Gemini CLI** (`gemini`)
4. **プロバイダー認証**
   - 音声をサポートする設定済みの `models.providers.*` エントリが先に試されます
   - 同梱フォールバック順: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。
カスタマイズするには、`tools.media.audio.models` を設定します。
注: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認してください (`~` は展開されます)。または、完全なコマンドパスを持つ明示的な CLI モデルを設定してください。

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

### チャットへ文字起こしをエコー (オプトイン)

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

## 注意事項と制限

- プロバイダー認証は標準のモデル認証順 (認証プロファイル、環境変数、`models.providers.*.apiKey`) に従います。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` が使用される場合、Deepgram は `DEEPGRAM_API_KEY` を取得します。
- Deepgram のセットアップ詳細: [Deepgram (音声文字起こし)](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` が使用される場合、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。
- SenseAudio のセットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは、`tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB (`tools.media.audio.maxBytes`) です。サイズ超過の音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 バイト未満の極小/空の音声ファイルは、プロバイダー/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定** (全文の文字起こし) です。出力をトリムするには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。精度を高めるには `model: "gpt-4o-transcribe"` を設定します。
- 複数のボイスメモを処理するには `tools.media.audio.attachments` を使用します (`mode: "all"` + `maxAttachments`)。
- 文字起こしは `{{Transcript}}` としてテンプレートで利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。有効にすると、エージェント処理の前に、発信元チャットへ文字起こしの確認を送信します。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします (プレースホルダー: `{transcript}`)。
- CLI stdout には上限があります (5MB)。CLI 出力は簡潔に保ってください。
- CLI の `args` は、ローカル音声ファイルパスとして `{{MediaPath}}` を使用する必要があります。古い `audio.transcription.command` 設定から非推奨の `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します。

### プロキシ環境サポート

プロバイダーベースの音声文字起こしは、標準の送信プロキシ環境変数を尊重します:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合、直接の外向き通信が使用されます。プロキシ設定の形式が不正な場合、OpenClaw は警告をログに記録し、直接フェッチにフォールバックします。

## グループでのメンション検出

グループチャットで `requireMention: true` が設定されている場合、OpenClaw はメンション確認の**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスメモでも処理できます。

**仕組み:**

1. 音声メッセージにテキスト本文がなく、グループがメンションを要求している場合、OpenClaw は「preflight」文字起こしを実行します。
2. 文字起こしでメンションパターン (例: `@BotName`、絵文字トリガー) が確認されます。
3. メンションが見つかると、メッセージは完全な返信パイプラインへ進みます。
4. ボイスメモがメンションゲートを通過できるように、文字起こしがメンション検出に使用されます。

**フォールバック動作:**

- preflight 中に文字起こしが失敗した場合 (タイムアウト、API エラーなど)、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ (テキスト + 音声) が誤って破棄されることがなくなります。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループの preflight 文字起こしメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します (スキップするには `true`、強制的に有効化するには `false`)。
- デフォルトは `false` です (メンションゲート条件に一致する場合、preflight は有効)。

**例:** Telegram グループで `requireMention: true` が設定されている状態で、ユーザーが「Hey @Claude, what's the weather?」と言うボイスメモを送信します。ボイスメモは文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、または `room` に正規化されます。
- CLI が 0 で終了し、プレーンテキストを出力することを確認してください。JSON は `jq -r .text` 経由で整形する必要があります。
- `parakeet-mlx` では、`--output-dir` を渡すと、`--output-format` が `txt` (または省略) の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式では stdout 解析にフォールバックします。
- 返信キューをブロックしないように、タイムアウト (`timeoutSeconds`、デフォルト 60 秒) は妥当な値に保ってください。
- preflight 文字起こしは、メンション検出のために**最初の**音声添付のみを処理します。追加の音声は、メインのメディア理解フェーズ中に処理されます。

## 関連

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
