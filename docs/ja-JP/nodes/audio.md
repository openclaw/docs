---
read_when:
    - 音声文字起こしやメディア処理を変更する
summary: 受信した音声/ボイスノートがどのようにダウンロード、文字起こしされ、返信に挿入されるか
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-04-30T05:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# 音声 / ボイスメモ (2026-01-17)

## 動作すること

- **メディア理解 (音声)**: 音声理解が有効な場合 (または自動検出された場合)、OpenClaw は:
  1. 最初の音声添付 (ローカルパスまたは URL) を特定し、必要に応じてダウンロードします。
  2. 各モデルエントリへ送信する前に `maxBytes` を適用します。
  3. 対象となる最初のモデルエントリを順番に実行します (プロバイダーまたは CLI)。
  4. 失敗またはスキップされた場合 (サイズ/タイムアウト)、次のエントリを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように `CommandBody`/`RawBody` が文字起こし結果に設定されます。
- **詳細ログ**: `--verbose` では、文字起こしが実行されたとき、および本文を置き換えたときにログを記録します。

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
   - 音声をサポートする設定済みの `models.providers.*` エントリが最初に試されます
   - 同梱のフォールバック順序: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。
カスタマイズするには、`tools.media.audio.models` を設定します。
注: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか (`~` は展開されます)、完全なコマンドパスを含む明示的な CLI モデルを設定してください。

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

### 文字起こしをチャットへエコー (オプトイン)

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

- プロバイダー認証は標準のモデル認証順序に従います (認証プロファイル、環境変数、`models.providers.*.apiKey`)。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` が使用される場合、Deepgram は `DEEPGRAM_API_KEY` を取得します。
- Deepgram のセットアップ詳細: [Deepgram (音声文字起こし)](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` が使用される場合、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。
- SenseAudio のセットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは `tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB (`tools.media.audio.maxBytes`) です。上限を超える音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 バイト未満の tiny/空の音声ファイルは、プロバイダー/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**です (完全な文字起こし)。出力を短くするには `tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。より高い精度には `model: "gpt-4o-transcribe"` を設定します。
- 複数のボイスメモを処理するには `tools.media.audio.attachments` を使用します (`mode: "all"` + `maxAttachments`)。
- 文字起こしは `{{Transcript}}` としてテンプレートで利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。有効にすると、エージェント処理の前に、元のチャットへ文字起こし確認を送信します。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします (プレースホルダー: `{transcript}`)。
- CLI stdout には上限があります (5MB)。CLI 出力は簡潔にしてください。
- CLI の `args` では、ローカル音声ファイルパスに `{{MediaPath}}` を使用してください。古い `audio.transcription.command` 設定の非推奨 `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します。

### プロキシ環境のサポート

プロバイダーベースの音声文字起こしは、標準の送信プロキシ環境変数に対応しています:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

プロキシ環境変数が設定されていない場合、直接の外向き通信が使用されます。プロキシ設定が不正な形式の場合、OpenClaw は警告をログに記録し、直接取得へフォールバックします。

## グループでのメンション検出

グループチャットに `requireMention: true` が設定されている場合、OpenClaw はメンションを確認する**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスメモも処理できます。

**動作の仕組み:**

1. 音声メッセージにテキスト本文がなく、グループでメンションが必要な場合、OpenClaw は「プリフライト」文字起こしを実行します。
2. 文字起こし結果でメンションパターン (例: `@BotName`、絵文字トリガー) が確認されます。
3. メンションが見つかった場合、メッセージは完全な返信パイプラインに進みます。
4. ボイスメモがメンションゲートを通過できるように、文字起こし結果がメンション検出に使用されます。

**フォールバック動作:**

- プリフライト中に文字起こしが失敗した場合 (タイムアウト、API エラーなど)、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ (テキスト + 音声) が誤って破棄されることはありません。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループのプリフライト文字起こしメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します (`true` でスキップ、`false` で強制的に有効化)。
- デフォルトは `false` です (メンションゲート条件に一致する場合、プリフライトは有効)。

**例:** Telegram グループで `requireMention: true` が設定されている状態で、ユーザーが「ねえ @Claude、天気はどう？」と言うボイスメモを送信します。ボイスメモは文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールでは最初に一致したものが優先されます。`chatType` は `direct`、`group`、または `room` に正規化されます。
- CLI が 0 で終了し、プレーンテキストを出力することを確認してください。JSON は `jq -r .text` 経由で整形する必要があります。
- `parakeet-mlx` では、`--output-dir` を渡した場合、`--output-format` が `txt` (または省略) のときに OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式は stdout 解析へフォールバックします。
- 返信キューをブロックしないように、タイムアウト (`timeoutSeconds`、デフォルト 60 秒) は適切に設定してください。
- プリフライト文字起こしでは、メンション検出のために**最初の**音声添付のみを処理します。追加の音声はメインのメディア理解フェーズで処理されます。

## 関連

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
