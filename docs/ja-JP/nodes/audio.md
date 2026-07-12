---
read_when:
    - 音声文字起こしまたはメディア処理の変更
summary: 受信した音声／ボイスメモがダウンロード、文字起こしされ、返信に挿入される仕組み
title: 音声とボイスメモ
x-i18n:
    generated_at: "2026-07-12T14:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 機能

音声理解が有効な場合（または自動検出された場合）、OpenClaw は次の処理を行います。

1. 最初の音声添付ファイル（ローカルパスまたは URL）を特定し、必要に応じてダウンロードします。
2. 各モデルエントリへ送信する前に `maxBytes` を適用します。
3. 対象となる最初のモデルエントリを順番に実行します（プロバイダーまたは CLI）。エントリが失敗またはスキップされた場合（サイズ超過／タイムアウト）、次のエントリを試行します。
4. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。

文字起こしが成功すると、スラッシュコマンドが引き続き機能するように、`CommandBody`/`RawBody` にも文字起こし結果が設定されます。`--verbose` を指定すると、文字起こしの実行時と本文の置換時にログが表示されます。

## 自動検出（デフォルト）

モデルを設定しておらず、`tools.media.audio.enabled` が `false` でない場合、OpenClaw は次の順序で自動検出し、最初に動作した選択肢で停止します。

1. **アクティブな返信モデル**（そのプロバイダーが音声理解をサポートしている場合）。
2. **設定済みのプロバイダー認証** — 音声文字起こしをサポートするプロバイダーについて、認証を利用できる任意の `models.providers.*` エントリ。これはローカル CLI より先に確認されるため、設定済みの API キーは常に `PATH` 上のローカルバイナリより優先されます。
   複数設定されている場合のプロバイダー優先順位：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **ローカル CLI**（プロバイダー認証を解決できない場合のみ）。OpenClaw は、順序付きのフォールバックリストを構築します。
   - `whisper-cli`。現在のプロセス内で以前のモデル呼び出しが Metal または CUDA を検出していた場合に限り、CPU のデフォルトより先に使用
   - デフォルトの CPU プロバイダー上の `sherpa-onnx-offline`（`tokens.txt`、`encoder.onnx`、`decoder.onnx`、`joiner.onnx` を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - Metal/CUDA がビルド対応しているだけの場合、または選択されたバックエンドがそれ以外の理由で未検出の場合の `whisper-cli`
   - Apple Silicon 上の `parakeet-mlx`（MLX 対応。デバイスの使用状況は未検出のまま）
   - `whisper`（Python CLI。モデルを自動的にダウンロード）

インストール元やリンク元の情報は機能対応の証拠であり、実行の証拠ではありません。それだけで候補が CPU sherpa より優先されることはありません。OpenClaw は、バックエンドを調査するためだけにセットアップ時やステータス確認時にモデルを読み込むことはありません。
自動検出された whisper.cpp では、通常のモデル実行ログが有効なままになるため、OpenClaw は上流の `using … backend` 行を記録できます。明示的な CLI エントリでは、設定された出力フラグが維持されます。

メディア理解向けの Gemini CLI 自動検出は、画像／動画用のサンドボックス化された Antigravity CLI（`agy`）フォールバックに置き換えられました。音声では、上記のローカルバイナリ以外の CLI フォールバックは使用しません。

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。カスタマイズするには、`tools.media.audio.models` を設定します。

<Note>
バイナリ検出は macOS/Linux/Windows 全体でベストエフォートです。CLI が `PATH` 上にあることを確認するか（`~` は展開されます）、完全なコマンドパスを持つ明示的な CLI モデルを設定してください。
</Note>

音声を文字起こしせずに、ローカルでの選択結果を確認します。

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

プロバイダー一覧では、ローカルフォールバックの採用候補がグローバルなプロバイダー選択とは別に報告され、さらに対応可能、要求済み、検出済みの各バックエンドフィールドも表示されます。文字起こしの実行後、`/status` はメディア行に要求済みまたは検出済みのバックエンドを表示します。明示的な `tools.media.audio.models` CLI エントリは引き続き自動選択を迂回します。sherpa の `--provider=cuda` や whisper.cpp の `--no-gpu`/`--device` など、バックエンド固有のフラグを使用してください。

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

### 文字起こし結果をチャットへエコー（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // デフォルトは false
        echoFormat: '📝 "{transcript}"', // 任意、{transcript} をサポート
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
- デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。上限を超える音声はそのモデルではスキップされ、次のエントリが試行されます。
- 1024 バイト未満の音声ファイルは、プロバイダー／CLI による文字起こしの前にスキップされます。
- 音声のデフォルトの `maxChars` は**未設定**です（文字起こし全文）。出力を切り詰めるには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動検出時のデフォルトは `gpt-4o-transcribe` です。より低コストで高速な選択肢には `model: "gpt-4o-mini-transcribe"` を設定します。
- 複数のボイスノートを処理するには、`tools.media.audio.attachments` を使用します（`mode: "all"` と `maxAttachments`、デフォルト 1）。
- 文字起こし結果は、テンプレートで `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトで無効です。有効にすると、エージェント処理の前に、発信元チャットへ文字起こし確認を送信します。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします（プレースホルダー：`{transcript}`、デフォルト：`📝 "{transcript}"`）。
- CLI の stdout は 5MB に制限されます。CLI 出力は簡潔にしてください。
- CLI の `args` では、ローカル音声ファイルのパスに `{{MediaPath}}` を使用してください。以前の `audio.transcription.command` 設定にある非推奨の `{input}` プレースホルダーを移行するには、`openclaw doctor --fix` を実行します（廃止されたキー：`audio.transcription`、`tools.media.audio.models` に置き換え）。
- `tools.media.concurrency` はメディアタスク数を制限します。GPU スケジューラーではありません。

### 常駐ローカル STT

自動検出されたローカル STT は、引き続きリクエストごとにプロセスを起動します。標準の Homebrew `whisper-cpp` パッケージではそのサーバーが無効になっており、上流のサンプルには設定済みの上限制御付き受付キューがないため、OpenClaw は現在、常駐 whisper.cpp サーバーを管理しません。Plugin が所有する常駐ライフサイクルを安全に有効化するには、正常性確認／起動、モデル常駐、上限制御付きキューイング、キャンセル／タイムアウト、ループバック限定の認証なし動作、およびクラウドフォールバックなしを備えた、保守されているパッケージ済みワーカーが必要です。

### プロキシ環境のサポート

プロバイダー経由の音声文字起こしは、undici の `EnvHttpProxyAgent` のセマンティクスに従い、標準の送信プロキシ環境変数を使用します。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小文字の変数は大文字より優先されます。`NO_PROXY`/`no_proxy` エントリ（ホスト名、`*.suffix`、または `host:port`）はプロキシを迂回します。プロキシ環境変数が設定されていない場合は、直接外部へ接続します。プロキシのセットアップに失敗した場合（不正な URL）、OpenClaw は警告をログに記録し、直接取得へフォールバックします。

## グループ内のメンション検出

音声の事前処理をサポートするチャンネルでは、グループチャットに `requireMention: true` が設定されている場合、OpenClaw はメンションを確認する**前に**音声を文字起こしします。これにより、キャプションのないボイスノートでも、その文字起こしに設定済みのメンションパターンが含まれていれば、メンションゲートを通過できます。代わりにテキスト入力されたメンションが必要なトランスポートについては、チャンネル固有のドキュメントで説明しています。

**動作の仕組み：**

1. ボイスメッセージにテキスト本文がなく、グループでメンションが必須の場合、OpenClaw は最初の音声添付ファイルを事前文字起こしします。
2. 文字起こし結果でメンションパターン（例：`@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかると、メッセージは完全な返信パイプラインへ進みます。

**フォールバック動作：**事前文字起こしに失敗した場合（タイムアウト、API エラーなど）、メッセージはテキストのみのメンション検出へフォールバックするため、混合メッセージ（テキスト + 音声）が破棄されることはありません。

**Telegram のグループ／トピックごとのオプトアウト：**

- そのグループで事前文字起こしによるメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（スキップするには `true`、強制的に有効にするには `false`）。
- デフォルトは `false` です（メンションゲートの条件に一致すると、事前処理が有効になります）。

**例：**ユーザーが `requireMention: true` の Telegram グループで「Hey @Claude, what's the weather?」と言うボイスノートを送信します。ボイスノートが文字起こしされ、メンションが検出されて、エージェントが返信します。

## 注意事項

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、`channel` のいずれかに正規化されます。
- CLI が終了コード 0 で終了し、プレーンテキストを出力することを確認してください。JSON 出力は `jq -r .text` で整形する必要があります。
- 既知のファイル出力モードが優先されます。推定された文字起こしファイルが空または存在しない場合、CLI の進行状況出力へフォールバックせず、文字起こし結果なしとなります。
- `parakeet-mlx` では、`--output-dir` およびデフォルトの `{filename}` 出力テンプレートとともに、`--output-format txt`（または `all`）を使用してください。上流の `PARAKEET_OUTPUT_FORMAT` および `PARAKEET_OUTPUT_TEMPLATE` 環境変数も使用されます。OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。デフォルトの `srt` 形式、その他の形式、カスタム出力テンプレートでは、引き続き stdout を使用します。
- 返信キューをブロックしないよう、タイムアウト（`timeoutSeconds`、デフォルト 60s）は妥当な値にしてください。
- メンション検出の事前文字起こしでは、**最初の**音声添付ファイルのみを処理します。追加の音声添付ファイルは、メインのメディア理解フェーズで処理されます。

## 関連項目

- [メディア理解](/ja-JP/nodes/media-understanding)
- [トークモード](/ja-JP/nodes/talk)
- [音声ウェイク](/ja-JP/nodes/voicewake)
