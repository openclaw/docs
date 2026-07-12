---
read_when:
    - 音声文字起こしまたはメディア処理の変更
summary: 受信した音声／ボイスメモがダウンロード、文字起こしされ、返信に挿入される仕組み
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-07-11T22:22:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 機能

音声理解が有効な場合（または自動検出された場合）、OpenClaw は次の処理を行います。

1. 最初の音声添付ファイル（ローカルパスまたは URL）を特定し、必要に応じてダウンロードします。
2. 各モデルエントリへ送信する前に `maxBytes` を適用します。
3. 対象となる最初のモデルエントリを順番に実行します（プロバイダーまたは CLI）。エントリが失敗またはスキップされた場合（サイズ超過やタイムアウト）、次のエントリを試します。
4. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。

文字起こしが成功すると、スラッシュコマンドが引き続き動作するように、`CommandBody`/`RawBody` にも文字起こし結果が設定されます。`--verbose` を指定すると、文字起こしの実行時と本文の置換時にログが表示されます。

## 自動検出（デフォルト）

モデルを設定しておらず、`tools.media.audio.enabled` が `false` でない場合、OpenClaw は次の順序で自動検出し、最初に動作した選択肢で停止します。

1. **アクティブな応答モデル**。そのプロバイダーが音声理解に対応している場合。
2. **設定済みのプロバイダー認証** — 音声文字起こしに対応するプロバイダーについて、認証を利用できる任意の `models.providers.*` エントリ。これはローカル CLI より先に確認されるため、設定済みの API キーは常に `PATH` 上のローカルバイナリより優先されます。
   複数設定されている場合のプロバイダー優先順位：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **ローカル CLI**（プロバイダー認証を解決できなかった場合のみ）。OpenClaw は次の順序でフォールバックリストを構築します。
   - `whisper-cli`。現在のプロセスで以前に実行したモデルが Metal または CUDA を検出していた場合のみ、CPU のデフォルトより前
   - デフォルトの CPU プロバイダー上の `sherpa-onnx-offline`（`tokens.txt`、`encoder.onnx`、`decoder.onnx`、`joiner.onnx` を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - `whisper-cli`。Metal/CUDA がビルド可能であることしか判明していない場合、または選択されたバックエンドがほかの方法では未検出の場合
   - Apple Silicon 上の `parakeet-mlx`（MLX 対応。デバイス使用状況は未検出のまま）
   - `whisper`（Python CLI。モデルを自動的にダウンロード）

インストール元やリンク元の情報は機能の証拠であり、実行の証拠ではありません。それだけで候補が CPU の sherpa より前に移動することはありません。OpenClaw は、バックエンドを調査するためだけにセットアップ時やステータス確認時にモデルを読み込みません。
自動検出された whisper.cpp では、OpenClaw がアップストリームの `using … backend` 行を記録できるように、通常のモデル実行ログが有効なままになります。明示的な CLI エントリでは、設定された出力フラグが維持されます。

メディア理解向けの Gemini CLI 自動検出は、画像や動画用のサンドボックス化された Antigravity CLI（`agy`）フォールバックに置き換えられました。音声では、上記のローカルバイナリ以外の CLI フォールバックは使用しません。

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。カスタマイズするには、`tools.media.audio.models` を設定します。

<Note>
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを使用して明示的な CLI モデルを設定してください。
</Note>

音声を文字起こしせずにローカル選択を確認するには、次を実行します。

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

プロバイダー一覧では、ローカルフォールバックの採用候補がグローバルなプロバイダー選択とは別に報告され、さらに利用可能、要求済み、検出済みの各バックエンドフィールドも表示されます。文字起こしの実行後、`/status` はメディア行に要求済みまたは検出済みのバックエンドを表示します。明示的な `tools.media.audio.models` の CLI エントリは、引き続き自動選択を迂回します。sherpa の `--provider=cuda` や whisper.cpp の `--no-gpu`/`--device` など、各バックエンド固有のフラグを使用してください。

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

### 文字起こしをチャットへ返送（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // デフォルトは false
        echoFormat: '📝 "{transcript}"', // 任意、{transcript} に対応
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## 注記と制限

- プロバイダー認証は標準のモデル認証順序（認証プロファイル、環境変数、`models.providers.*.apiKey`）に従います。
- Groq のセットアップ詳細：[Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"` を使用すると、Deepgram は `DEEPGRAM_API_KEY` を取得します。セットアップ詳細：[Deepgram](/ja-JP/providers/deepgram)。
- Mistral のセットアップ詳細：[Mistral](/ja-JP/providers/mistral)。
- `provider: "senseaudio"` を使用すると、SenseAudio は `SENSEAUDIO_API_KEY` を取得します。セットアップ詳細：[SenseAudio](/ja-JP/providers/senseaudio)。
- 音声プロバイダーは、`tools.media.audio` を介して `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。上限を超えた音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 バイト未満の音声ファイルは、プロバイダーまたは CLI による文字起こしの前にスキップされます。
- 音声のデフォルトの `maxChars` は**未設定**です（文字起こし全文）。出力を切り詰めるには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動検出デフォルトは `gpt-4o-transcribe` です。より低コストで高速な選択肢には `model: "gpt-4o-mini-transcribe"` を設定します。
- 複数の音声メモを処理するには、`tools.media.audio.attachments` を使用します（`mode: "all"` と `maxAttachments`。デフォルトは 1）。
- 文字起こし結果は、テンプレート内で `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトで無効です。有効にすると、エージェント処理の前に、元のチャットへ文字起こし確認を返送します。
- `tools.media.audio.echoFormat` は返送テキストをカスタマイズします（プレースホルダー：`{transcript}`、デフォルト：`📝 "{transcript}"`）。
- CLI の標準出力は 5MB に制限されます。CLI の出力は簡潔にしてください。
- CLI の `args` では、ローカル音声ファイルのパスに `{{MediaPath}}` を使用してください。古い `audio.transcription.command` 設定の非推奨 `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します（廃止されたキー：`audio.transcription`、置き換え先：`tools.media.audio.models`）。
- `tools.media.concurrency` はメディアタスク数を制限します。GPU スケジューラーではありません。

### 常駐型ローカル STT

自動検出されたローカル STT は、引き続きリクエストごとにプロセスを起動します。OpenClaw は現在、常駐型 whisper.cpp サーバーを管理しません。標準の Homebrew `whisper-cpp` パッケージではそのサーバーが無効化されており、アップストリームの例には上限付き受け入れキューが設定されていないためです。Plugin が所有する常駐ライフサイクルを安全に有効化するには、ヘルスチェックと起動管理、モデルの常駐、上限付きキューイング、キャンセルとタイムアウト、local loopback のみで認証なしの動作、クラウドへのフォールバックなしを備えた、保守されているパッケージ済みワーカーが必要です。

### プロキシ環境のサポート

プロバイダーによる音声文字起こしでは、undici の `EnvHttpProxyAgent` セマンティクスに従い、標準の送信プロキシ環境変数が尊重されます。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小文字の変数が大文字より優先されます。`NO_PROXY`/`no_proxy` のエントリ（ホスト名、`*.suffix`、または `host:port`）はプロキシを迂回します。プロキシ環境変数が設定されていない場合は、直接外部接続を使用します。プロキシのセットアップが失敗した場合（不正な形式の URL）、OpenClaw は警告をログに記録し、直接取得へフォールバックします。

## グループ内のメンション検出

音声の事前処理に対応するチャンネルでは、グループチャットに `requireMention: true` が設定されている場合、OpenClaw はメンションを確認する**前に**音声を文字起こしします。これにより、キャプションのない音声メモでも、その文字起こしに設定済みのメンションパターンが含まれていれば、メンション判定を通過できます。入力されたメンションが必要なトランスポートについては、チャンネル固有のドキュメントで説明しています。

**仕組み：**

1. 音声メッセージにテキスト本文がなく、グループでメンションが必須の場合、OpenClaw は最初の音声添付ファイルを事前に文字起こしします。
2. 文字起こし結果でメンションパターン（例：`@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかると、メッセージは完全な応答パイプラインへ進みます。

**フォールバック動作：** 事前文字起こしが失敗した場合（タイムアウト、API エラーなど）、メッセージはテキストのみのメンション検出へフォールバックするため、複合メッセージ（テキスト + 音声）が破棄されることはありません。

**Telegram のグループまたはトピックごとのオプトアウト：**

- そのグループで事前文字起こしによるメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（`true` でスキップ、`false` で強制的に有効化）。
- デフォルトは `false` です（メンション必須の条件に一致すると事前処理が有効）。

**例：** `requireMention: true` が設定された Telegram グループで、ユーザーが「ねえ @Claude、天気はどう？」と言う音声メモを送信します。音声メモが文字起こしされ、メンションが検出され、エージェントが応答します。

## 注意事項

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、`channel` のいずれかに正規化されます。
- CLI が終了コード 0 で終了し、プレーンテキストを出力することを確認してください。JSON 出力は `jq -r .text` で加工する必要があります。
- 既知のファイル出力モードが優先されます。推論された文字起こしファイルが空または存在しない場合、CLI の進捗出力へフォールバックせず、文字起こしなしになります。
- `parakeet-mlx` では、`--output-dir` およびデフォルトの `{filename}` 出力テンプレートとともに、`--output-format txt`（または `all`）を使用します。アップストリームの `PARAKEET_OUTPUT_FORMAT` および `PARAKEET_OUTPUT_TEMPLATE` 環境変数も尊重されます。OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。デフォルトの `srt` 形式、その他の形式、カスタム出力テンプレートでは、引き続き標準出力を使用します。
- 応答キューのブロックを避けるため、タイムアウト（`timeoutSeconds`、デフォルト 60 秒）は妥当な値にしてください。
- メンション検出の事前文字起こしで処理されるのは、**最初の**音声添付ファイルのみです。追加の音声添付ファイルは、メインのメディア理解フェーズで処理されます。

## 関連項目

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
