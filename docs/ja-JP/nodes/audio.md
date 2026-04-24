---
read_when:
    - 音声文字起こしまたはメディア処理を変更する場合
summary: 受信した音声/ボイスノートがどのようにダウンロード、文字起こしされ、返信に取り込まれるか
title: 音声とボイスノート
x-i18n:
    generated_at: "2026-04-24T05:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# 音声 / ボイスノート（2026-01-17）

## 動作するもの

- **メディア理解（音声）**: 音声理解が有効（または自動検出）されている場合、OpenClawは次を行います:
  1. 最初の音声添付を見つける（ローカルパスまたはURL）必要ならダウンロードする。
  2. 各モデルエントリへ送る前に`maxBytes`を適用する。
  3. 順序どおりに最初の適格モデルエントリ（プロバイダーまたはCLI）を実行する。
  4. 失敗またはスキップした場合（サイズ/タイムアウト）、次のエントリを試す。
  5. 成功した場合、`Body`を`[Audio]`ブロックで置き換え、`{{Transcript}}`を設定する。
- **コマンド解析**: 文字起こしに成功すると、`CommandBody`/`RawBody`が文字起こし結果に設定されるため、slash commandが引き続き動作します。
- **詳細ログ**: `--verbose`では、文字起こしが実行されたときと、bodyを置き換えたときを記録します。

## 自動検出（デフォルト）

**モデルを設定していない**かつ`tools.media.audio.enabled`が**`false`に設定されていない**場合、
OpenClawは次の順で自動検出し、最初に動作した選択肢で停止します。

1. **有効な返信モデル**（そのプロバイダーが音声理解をサポートしている場合）
2. **ローカルCLI**（インストールされている場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR`にencoder/decoder/joiner/tokensが必要）
   - `whisper-cli`（`whisper-cpp`由来。`WHISPER_CPP_MODEL`または同梱tiny modelを使用）
   - `whisper`（Python CLI。モデルを自動ダウンロード）
3. **Gemini CLI**（`gemini`）の`read_many_files`使用
4. **プロバイダー認証**
   - 音声対応の設定済み`models.providers.*`エントリを先に試す
   - バンドルされたフォールバック順: OpenAI → Groq → Deepgram → Google → Mistral

自動検出を無効化するには、`tools.media.audio.enabled: false`を設定してください。
カスタマイズするには、`tools.media.audio.models`を設定してください。
注意: バイナリ検出はmacOS/Linux/Windows間でベストエフォートです。CLIが`PATH`上にあることを確認するか（`~`は展開されます）、完全なコマンドパスを持つ明示的なCLIモデルを設定してください。

## 設定例

### プロバイダー + CLIフォールバック（OpenAI + Whisper CLI）

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

### 文字起こしをチャットへエコーする（オプトイン）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // デフォルトはfalse
        echoFormat: '📝 "{transcript}"', // 任意、{transcript}をサポート
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注意と制限

- プロバイダー認証は標準のモデル認証順序に従います（authプロファイル、env vars、`models.providers.*.apiKey`）。
- Groqのセットアップ詳細: [Groq](/ja-JP/providers/groq)。
- `provider: "deepgram"`を使う場合、Deepgramは`DEEPGRAM_API_KEY`を読み取ります。
- Deepgramのセットアップ詳細: [Deepgram (audio transcription)](/ja-JP/providers/deepgram)。
- Mistralのセットアップ詳細: [Mistral](/ja-JP/providers/mistral)。
- 音声プロバイダーは`tools.media.audio`経由で`baseUrl`、`headers`、`providerOptions`を上書きできます。
- デフォルトのサイズ上限は20MB（`tools.media.audio.maxBytes`）です。サイズ超過の音声はそのモデルではスキップされ、次のエントリが試されます。
- 1024 bytes未満の小さすぎる/空の音声ファイルは、プロバイダー/CLI文字起こしの前にスキップされます。
- 音声用のデフォルト`maxChars`は**未設定**（全文字起こし）です。出力を切り詰めるには、`tools.media.audio.maxChars`またはエントリごとの`maxChars`を設定してください。
- OpenAIの自動デフォルトは`gpt-4o-mini-transcribe`です。より高精度が必要な場合は`model: "gpt-4o-transcribe"`を設定してください。
- 複数のボイスノートを処理するには`tools.media.audio.attachments`を使用してください（`mode: "all"` + `maxAttachments`）。
- 文字起こしはテンプレート内で`{{Transcript}}`として利用できます。
- `tools.media.audio.echoTranscript`はデフォルトでオフです。エージェント処理前に元のチャットへ文字起こし確認を返送したい場合は有効にしてください。
- `tools.media.audio.echoFormat`でエコーテキストをカスタマイズできます（プレースホルダー: `{transcript}`）。
- CLIのstdoutは5MBに制限されます。CLI出力は簡潔にしてください。

### プロキシ環境サポート

プロバイダーベースの音声文字起こしは、標準の送信プロキシenv varを尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシenv varが設定されていない場合は、直接egressが使われます。プロキシ設定が不正な場合、OpenClawは警告を記録し、直接取得へフォールバックします。

## グループでのメンション検出

グループチャットに`requireMention: true`が設定されている場合、OpenClawはメンションを確認する**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスノートも処理できます。

**仕組み:**

1. ボイスメッセージにテキストbodyがなく、かつグループでメンションが必要な場合、OpenClawは「preflight」文字起こしを行います。
2. 文字起こし結果に対してメンションパターン（例: `@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかった場合、そのメッセージは完全な返信パイプラインへ進みます。
4. ボイスノートがメンションゲートを通過できるよう、メンション検出には文字起こし結果が使われます。

**フォールバック動作:**

- preflight中に文字起こしが失敗した場合（タイムアウト、APIエラーなど）、そのメッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ（テキスト + 音声）が誤ってドロップされることはありません。

**Telegramグループ/トピックごとのオプトアウト:**

- そのグループでpreflight文字起こしメンションチェックをスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true`を設定します。
- トピックごとの上書きには、`channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`を設定します（`true`でスキップ、`false`で強制有効）。
- デフォルトは`false`です（メンションゲート条件に一致した場合はpreflight有効）。

**例:** `requireMention: true`のTelegramグループで、ユーザーが「Hey @Claude, what's the weather?」と言うボイスノートを送ります。ボイスノートは文字起こしされ、メンションが検出され、エージェントが返信します。

## 注意点

- スコープルールは最初に一致したものが勝ちます。`chatType`は`direct`、`group`、または`room`に正規化されます。
- CLIは必ずexit 0で終了し、プレーンテキストを出力するようにしてください。JSONは`jq -r .text`などで整形する必要があります。
- `parakeet-mlx`では、`--output-dir`を渡した場合、`--output-format`が`txt`（または省略）なら、OpenClawは`<output-dir>/<media-basename>.txt`を読み取ります。`txt`以外の出力形式ではstdout解析へフォールバックします。
- 返信キューをブロックしないよう、タイムアウト（`timeoutSeconds`、デフォルト60秒）は妥当な値にしてください。
- preflight文字起こしは、メンション検出のために**最初の**音声添付のみを処理します。追加の音声はメインのメディア理解フェーズで処理されます。

## 関連

- [Media understanding](/ja-JP/nodes/media-understanding)
- [Talk mode](/ja-JP/nodes/talk)
- [Voice wake](/ja-JP/nodes/voicewake)
