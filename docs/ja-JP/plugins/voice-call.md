---
read_when:
    - OpenClawから発信音声通話をかけたい場合
    - voice-call Pluginを設定または開発している場合
summary: Voice Call Plugin：Twilio/Telnyx/Plivo経由の発信・着信通話（Pluginのインストール + 設定 + CLI）
title: Voice call Plugin
x-i18n:
    generated_at: "2026-04-24T09:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（Plugin）

Plugin経由でOpenClawの音声通話を提供します。発信通知と、着信ポリシーを備えた
複数ターンの会話をサポートします。

現在のプロバイダー：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用 / ネットワークなし）

簡単な考え方：

- Pluginをインストールする
- Gatewayを再起動する
- `plugins.entries.voice-call.config` で設定する
- `openclaw voicecall ...` または `voice_call` ツールを使う

## 実行場所（ローカル vs リモート）

Voice Call Pluginは**Gatewayプロセス内**で実行されます。

リモートGatewayを使用している場合は、**Gatewayを実行しているマシン**にPluginをインストール / 設定し、その後Pluginを読み込むためにGatewayを再起動してください。

## インストール

### オプションA：npmからインストールする（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後、Gatewayを再起動してください。

### オプションB：ローカルフォルダーからインストールする（開発用、コピーなし）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gatewayを再起動してください。

## 設定

`plugins.entries.voice-call.config` の下に設定します：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // または "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // または Twilio では TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal の Telnyx webhook 公開鍵
            // （Base64文字列。TELNYX_PUBLIC_KEY でも設定可能）。
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhookサーバー
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhookセキュリティ（トンネル / プロキシでは推奨）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公開方法（いずれか1つを選択）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 任意。未設定時は最初に登録された realtime transcription provider
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY が設定されていれば任意
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // 任意。未設定時は最初に登録された realtime voice provider
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

注意：

- Twilio/Telnyxでは、**外部から到達可能な**Webhook URLが必要です。
- Plivoでも、**外部から到達可能な**Webhook URLが必要です。
- `mock` はローカル開発用プロバイダーです（ネットワーク呼び出しなし）。
- 古い設定で `provider: "log"`、`twilio.from`、または従来の `streaming.*` OpenAIキーをまだ使っている場合は、`openclaw doctor --fix` を実行して書き換えてください。
- Telnyxでは、`skipSignatureVerification` が true でない限り、`telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカルテスト専用です。
- ngrokの無料プランを使う場合は、`publicUrl` を正確なngrok URLに設定してください。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrokローカルエージェント）の場合にのみ、無効な署名のTwilio Webhookを許可します。ローカル開発専用で使用してください。
- ngrok無料プランのURLは変更されたり、中継ページのような挙動が追加されたりすることがあります。`publicUrl` がずれると、Twilio署名は失敗します。本番環境では、安定したドメインまたはTailscale funnelを推奨します。
- `realtime.enabled` は完全な音声対音声会話を開始します。`streaming.enabled` と同時に有効化しないでください。
- Streamingのセキュリティのデフォルト：
  - `streaming.preStartTimeoutMs` は、有効な `start` フレームを一度も送らないソケットを閉じます。
- `streaming.maxPendingConnections` は、認証前の開始待ちソケット総数を制限します。
- `streaming.maxPendingConnectionsPerIp` は、送信元IPごとの認証前開始待ちソケット数を制限します。
- `streaming.maxConnections` は、開いているメディアストリームソケット総数（待機中 + アクティブ）を制限します。
- 実行時フォールバックでは、現時点ではそれらの古いvoice-callキーも引き続き受け入れますが、書き換え経路は `openclaw doctor --fix` であり、互換性シムは一時的なものです。

## Realtime音声会話

`realtime` は、ライブ通話音声向けの全二重 realtime voice provider を選択します。
これは `streaming` とは別で、`streaming` は音声を realtime
transcription provider に転送するだけです。

現在のランタイム動作：

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.enabled` は `streaming.enabled` と組み合わせられません。
- `realtime.provider` は任意です。未設定の場合、Voice Callは最初に
  登録された realtime voice provider を使用します。
- 同梱の realtime voice provider には、各provider Pluginによって登録される Google Gemini Live（`google`）と
  OpenAI（`openai`）が含まれます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` の下に置かれます。
- `realtime.provider` が未登録のプロバイダーを指している場合、または realtime
  voice provider がまったく登録されていない場合、Voice Callは警告を記録し、
  Plugin全体を失敗させるのではなく realtime メディアをスキップします。

Google Gemini Live realtime のデフォルト：

- APIキー：`realtime.providers.google.apiKey`、`GEMINI_API_KEY`、または
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model：`gemini-2.5-flash-native-audio-preview-12-2025`
- voice：`Kore`

例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "簡潔に話し、ツールを使う前に確認してください。",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

代わりにOpenAIを使う場合：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

プロバイダー固有の realtime voice オプションについては、
[Google provider](/ja-JP/providers/google) と [OpenAI provider](/ja-JP/providers/openai)
を参照してください。

## Streaming文字起こし

`streaming` は、ライブ通話音声向けの realtime transcription provider を選択します。

現在のランタイム動作：

- `streaming.provider` は任意です。未設定の場合、Voice Callは最初に
  登録された realtime transcription provider を使用します。
- 同梱の realtime transcription provider には、各provider Pluginによって登録される Deepgram（`deepgram`）、
  ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、および xAI
  （`xai`）が含まれます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` の下に置かれます。
- `streaming.provider` が未登録のプロバイダーを指している場合、または realtime
  transcription provider がまったく登録されていない場合、Voice Callは警告を記録し、
  Plugin全体を失敗させるのではなくメディアストリーミングをスキップします。

OpenAI streaming transcription のデフォルト：

- APIキー：`streaming.providers.openai.apiKey` または `OPENAI_API_KEY`
- model：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI streaming transcription のデフォルト：

- APIキー：`streaming.providers.xai.apiKey` または `XAI_API_KEY`
- endpoint：`wss://api.x.ai/v1/stt`
- `encoding`：`mulaw`
- `sampleRate`：`8000`
- `endpointingMs`：`800`
- `interimResults`：`true`

例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY が設定されていれば任意
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

代わりにxAIを使う場合：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY が設定されていれば任意
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

従来のキーは、引き続き `openclaw doctor --fix` によって自動移行されます：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 古い通話の回収

終端Webhookを受信しない通話
（たとえば、完了しない notify モードの通話）を終了するには、`staleCallReaperSeconds` を使用します。デフォルトは `0`
（無効）です。

推奨範囲：

- **本番環境:** notifyスタイルのフローでは `120`～`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく** してください。
  よい開始値は `maxDurationSeconds + 30–60` 秒です。

例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhookセキュリティ

プロキシまたはトンネルがGatewayの前段にある場合、Pluginは署名検証のために
公開URLを再構築します。これらのオプションは、どの転送ヘッダーを
信頼するかを制御します。

`webhookSecurity.allowedHosts` は、転送ヘッダーからのホストを許可リスト化します。

`webhookSecurity.trustForwardingHeaders` は、許可リストなしで転送ヘッダーを信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストの
リモートIPが一覧と一致する場合にのみ転送ヘッダーを信頼します。

Webhookのリプレイ保護はTwilioとPlivoで有効です。再送された有効なWebhook
リクエストは受理されますが、副作用はスキップされます。

Twilioの会話ターンには、`<Gather>` コールバック内にターンごとのトークンが含まれるため、
古い / 再送された音声コールバックが、より新しい保留中の文字起こしターンを満たすことはできません。

未認証のWebhookリクエストは、プロバイダーで必要な署名ヘッダーが欠けている場合、
本文を読む前に拒否されます。

voice-call Webhookは、共有の事前認証本文プロファイル（64 KB / 5秒）に加えて、
署名検証前のIPごとの同時実行上限を使用します。

安定した公開ホストを使う例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 通話のためのTTS

Voice Callは、通話で音声をストリーミング再生するためにコアの `messages.tts` 設定を使用します。これをPlugin設定の下で**同じ形**で上書きできます。これは `messages.tts` とディープマージされます。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

注意：

- Plugin設定内の従来の `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は、読み込み時に `tts.providers.<provider>` へ自動移行されます。コミットする設定では `providers` 形式を推奨します。
- **Microsoft speech は音声通話では無視されます**（電話音声にはPCMが必要ですが、現在のMicrosoft transportは電話用PCM出力を提供していません）。
- Twilioメディアストリーミングが有効な場合はコアTTSが使用されます。それ以外の場合、通話はプロバイダーのネイティブ音声へフォールバックします。
- Twilioメディアストリームがすでにアクティブな場合、Voice CallはTwiML `<Say>` へフォールバックしません。その状態で電話TTSが利用できない場合、2つの再生経路を混在させるのではなく、再生リクエストは失敗します。
- 電話TTSがセカンダリプロバイダーへフォールバックした場合、Voice Callはデバッグ用にプロバイダーチェーン（`from`、`to`、`attempts`）を含む警告を記録します。

### 追加の例

コアTTSのみを使う（上書きなし）：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

通話に対してのみElevenLabsへ上書きする（それ以外ではコアのデフォルトを維持）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

通話に対してのみOpenAIモデルを上書きする（ディープマージの例）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## 着信通話

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定します：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "こんにちは！どのようにお手伝いできますか？",
}
```

`inboundPolicy: "allowlist"` は、保証レベルの低い発信者番号スクリーニングです。Pluginはプロバイダーから渡された `From` 値を正規化し、`allowFrom` と比較します。Webhook検証はプロバイダー配信とペイロード完全性を認証しますが、PSTN/VoIPの発信番号の所有権までは証明しません。`allowFrom` は強い発信者本人確認ではなく、発信者番号フィルタリングとして扱ってください。

自動応答はエージェントシステムを使用します。以下で調整できます：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 発話出力の契約

自動応答では、Voice Callはシステムプロンプトに厳格な発話出力契約を追加します：

- `{"spoken":"..."}`

その後、Voice Callは防御的に発話テキストを抽出します：

- reasoning/errorコンテンツとしてマークされたペイロードは無視します。
- 直接JSON、フェンス付きJSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストへフォールバックし、計画 / メタの導入段落らしい部分を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声へ漏れることを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付けられています：

- 割り込み時のキュークリアと自動応答の抑制は、初回の挨拶が実際に発話中の間だけ行われます。
- 初回再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio streamingの初回再生は、追加の遅延なしでストリーム接続時に開始されます。

### Twilioストリーム切断の猶予

Twilioメディアストリームが切断されると、Voice Callは通話を自動終了する前に `2000ms` 待機します：

- その間にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後もストリームが再登録されない場合、アクティブ通話が固着するのを防ぐために通話は終了されます。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call のエイリアス
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # ログからターン遅延を要約
openclaw voicecall expose --mode funnel
```

`latency` はデフォルトのvoice-callストレージパスから `calls.jsonl` を読み込みます。別のログを指定するには `--file <path>` を使い、分析対象を最後のN件に制限するには `--last <n>` を使います（デフォルトは200）。出力には、ターン遅延と listen-wait 時間の p50 / p90 / p99 が含まれます。

## エージェントツール

ツール名：`voice_call`

アクション：

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `send_dtmf`（callId, digits）
- `end_call`（callId）
- `get_status`（callId）

このリポジトリには、対応するSkillsドキュメントが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

- `voicecall.initiate`（`to?`, `message`, `mode?`）
- `voicecall.continue`（`callId`, `message`）
- `voicecall.speak`（`callId`, `message`）
- `voicecall.dtmf`（`callId`, `digits`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）

## 関連

- [Text-to-speech](/ja-JP/tools/tts)
- [Talk mode](/ja-JP/nodes/talk)
- [Voice wake](/ja-JP/nodes/voicewake)
