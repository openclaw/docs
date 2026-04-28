---
read_when:
    - 音声文字起こしやメディア処理を変更する
summary: 受信した音声/ボイスノートがどのようにダウンロード、文字起こしされ、返信に注入されるか
title: 音声とボイスノート
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:51:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# 音声 / ボイスノート（2026-01-17）

## 動作するもの

- **メディア理解（音声）**: 音声理解が有効（または自動検出）になっている場合、OpenClaw は次のように動作します。
  1. 最初の音声添付ファイル（ローカルパスまたは URL）を見つけ、必要ならダウンロードします。
  2. 各 model エントリに送る前に `maxBytes` を適用します。
  3. 対象になる最初の model エントリを順番に実行します（provider または CLI）。
  4. 失敗またはスキップした場合（サイズ/タイムアウト）、次のエントリを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように `CommandBody`/`RawBody` が transcript に設定されます。
- **詳細ログ**: `--verbose` では、文字起こしの実行時と body を置き換えた時にログを出します。

## 自動検出（デフォルト）

**model を設定しておらず**、かつ `tools.media.audio.enabled` が **`false` に設定されていない** 場合、
OpenClaw は次の順に自動検出し、最初に動作した選択肢で停止します。

1. **アクティブな返信 model**（その provider が音声理解をサポートしている場合）。
2. **ローカル CLI**（インストールされている場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR` に encoder/decoder/joiner/tokens が必要）
   - `whisper-cli`（`whisper-cpp` 由来。`WHISPER_CPP_MODEL` またはバンドル済み tiny model を使用）
   - `whisper`（Python CLI。model を自動ダウンロード）
3. **Gemini CLI**（`gemini`）を `read_many_files` で使用
4. **provider auth**
   - 音声をサポートする設定済み `models.providers.*` エントリが先に試されます
   - バンドル済みフォールバック順: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定してください。
カスタマイズするには、`tools.media.audio.models` を設定してください。
注意: バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認してください（`~` は展開されます）。または、完全なコマンドパス付きで明示的な CLI model を設定してください。

## config 例

### provider + CLI フォールバック（OpenAI + Whisper CLI）

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

### スコープ制御付き provider のみ

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

### provider のみ（Deepgram）

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

### provider のみ（Mistral Voxtral）

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

### provider のみ（SenseAudio）

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

### transcript をチャットへエコーする（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // デフォルトは false
        echoFormat: '📝 "{transcript}"', // 任意。{transcript} をサポート
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注意事項と制限

- provider auth は標準の model auth 順序に従います（auth profile、env vars、`models.providers.*.apiKey`）。
- Groq のセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` を使うと、Deepgram は `DEEPGRAM_API_KEY` を読み取ります。
- Deepgram のセットアップ詳細: [Deepgram (audio transcription)](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` を使うと、SenseAudio は `SENSEAUDIO_API_KEY` を読み取ります。
- SenseAudio のセットアップ詳細: [SenseAudio](/ja-JP/providers/senseaudio)。
- 音声 provider は `tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。サイズ超過の音声はその model ではスキップされ、次のエントリが試されます。
- 1024 バイト未満の極小/空音声ファイルは、provider/CLI 文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**です（全文 transcript）。出力を切り詰めるには `tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定してください。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。より高精度にしたい場合は `model: "gpt-4o-transcribe"` を設定してください。
- 複数のボイスノートを処理するには `tools.media.audio.attachments` を使ってください（`mode: "all"` + `maxAttachments`）。
- transcript はテンプレート内で `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。agent 処理前に transcript 確認を元のチャットへ送るには有効にしてください。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします（プレースホルダー: `{transcript}`）。
- CLI stdout には上限があります（5MB）。CLI 出力は簡潔に保ってください。

### proxy 環境サポート

provider ベースの音声文字起こしは、標準の送信 proxy 環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

proxy 環境変数が設定されていない場合は、直接外向き通信が使われます。proxy 設定が不正な場合、OpenClaw は警告を記録し、直接取得にフォールバックします。

## グループ内でのメンション検出

グループチャットで `requireMention: true` が設定されている場合、OpenClaw はメンション確認の**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスノートも処理できます。

**仕組み:**

1. ボイスメッセージにテキスト body がなく、かつグループでメンション必須の場合、OpenClaw は「preflight」文字起こしを実行します。
2. transcript に対してメンションパターン（例: `@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかった場合、メッセージは完全な返信パイプラインへ進みます。
4. ボイスノートがメンションゲートを通過できるよう、メンション検出には transcript が使われます。

**フォールバック動作:**

- preflight 中に文字起こしが失敗した場合（タイムアウト、API エラーなど）、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ（テキスト + 音声）が誤って破棄されることを防ぎます。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループで preflight transcript メンション確認をスキップするには `channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定してください。
- トピックごとに上書きするには `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定してください（`true` でスキップ、`false` で強制有効）。
- デフォルトは `false` です（メンションゲート条件に一致する場合、preflight 有効）。

**例:** `requireMention: true` の Telegram グループで、ユーザーが「Hey @Claude, what's the weather?」と言うボイスノートを送信した場合、そのボイスノートは文字起こしされ、メンションが検出され、agent が返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、`room` に正規化されます。
- CLI が終了コード 0 で終了し、プレーンテキストを出力することを確認してください。JSON は `jq -r .text` などで整形する必要があります。
- `parakeet-mlx` では、`--output-dir` を渡した場合、`--output-format` が `txt`（または省略）のとき OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式では stdout 解析にフォールバックします。
- 返信キューをブロックしないよう、タイムアウト（`timeoutSeconds`、デフォルト 60 秒）は妥当な値に保ってください。
- preflight 文字起こしでメンション検出の対象になるのは**最初の**音声添付ファイルだけです。追加の音声はメインのメディア理解フェーズで処理されます。

## 関連

- [Media understanding](/ja-JP/nodes/media-understanding)
- [Talk mode](/ja-JP/nodes/talk)
- [Voice wake](/ja-JP/nodes/voicewake)
