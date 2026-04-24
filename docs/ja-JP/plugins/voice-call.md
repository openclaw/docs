---
read_when:
    - OpenClaw から発信音声通話をかけたい場合
    - 音声通話 Plugin を設定または開発している場合
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo 経由の発信 + 着信通話（Plugin インストール + config + CLI）'
title: Voice call Plugin
x-i18n:
    generated_at: "2026-04-24T05:13:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# 音声通話（Plugin）

Plugin 経由で OpenClaw に音声通話機能を追加します。発信通知と、
着信ポリシーを備えたマルチターン会話をサポートします。

現在のプロバイダー:

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用/ネットワークなし）

クイックメンタルモデル:

- Plugin をインストール
- Gateway を再起動
- `plugins.entries.voice-call.config` 配下で設定
- `openclaw voicecall ...` または `voice_call` tool を使う

## 実行場所（local と remote）

Voice Call Plugin は **Gateway プロセス内** で動作します。

remote Gateway を使っている場合は、**Gateway が動作しているマシン** に Plugin をインストール/設定し、その後 Gateway を再起動して読み込んでください。

## インストール

### オプション A: npm からインストール（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後、Gateway を再起動してください。

### オプション B: ローカルフォルダーからインストール（開発用、コピーなし）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動してください。

## 設定

設定は `plugins.entries.voice-call.config` 配下に置きます。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // または "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // または Twilio 用の TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal の Telnyx Webhook 公開鍵
            // （Base64 文字列。TELNYX_PUBLIC_KEY でも設定可能）。
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook サーバー
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook セキュリティ（トンネル/プロキシに推奨）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公開方法（いずれか 1 つを選択）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 未設定時は、最初に登録された realtime transcription provider を使用
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
        },
      },
    },
  },
}
```

注:

- Twilio/Telnyx には **公開到達可能な** Webhook URL が必要です。
- Plivo にも **公開到達可能な** Webhook URL が必要です。
- `mock` はローカル開発用プロバイダーです（ネットワーク呼び出しなし）。
- 古い config がまだ `provider: "log"`、`twilio.from`、または旧式の `streaming.*` OpenAI key を使っている場合は、`openclaw doctor --fix` を実行して書き換えてください。
- Telnyx では、`skipSignatureVerification` が true でない限り `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカルテスト専用です。
- ngrok free tier を使う場合は、`publicUrl` に正確な ngrok URL を設定してください。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrok ローカルエージェント）の場合に限り、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
- ngrok free tier の URL は変わったり、中間ページ挙動が追加されたりすることがあります。`publicUrl` がずれると Twilio 署名は失敗します。本番では、安定したドメインまたは Tailscale funnel を推奨します。
- ストリーミングセキュリティのデフォルト:
  - `streaming.preStartTimeoutMs` は、有効な `start` frame を送らない socket を閉じます。
- `streaming.maxPendingConnections` は、認証前の pre-start socket 全体数の上限です。
- `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの認証前 pre-start socket 数の上限です。
- `streaming.maxConnections` は、開いている media stream socket 全体数（pending + active）の上限です。
- ランタイムのフォールバックは、今のところこれらの古い voice-call key も引き続き受け付けますが、書き換え経路は `openclaw doctor --fix` であり、この互換 shim は一時的なものです。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用の realtime transcription provider を選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に
  登録された realtime transcription provider を使います。
- 同梱の realtime transcription provider には Deepgram（`deepgram`）、
  ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI
  （`xai`）があり、それぞれの provider plugin によって登録されます。
- provider 所有の raw config は `streaming.providers.<providerId>` 配下にあります。
- `streaming.provider` が未登録の provider を指している場合、または realtime
  transcription provider がまったく登録されていない場合、Voice Call は警告をログに出し、
  Plugin 全体を失敗させるのではなく media streaming をスキップします。

OpenAI ストリーミング文字起こしのデフォルト:

- API key: `streaming.providers.openai.apiKey` または `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI ストリーミング文字起こしのデフォルト:

- API key: `streaming.providers.xai.apiKey` または `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

例:

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

代わりに xAI を使う:

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

旧式キーは `openclaw doctor --fix` によって引き続き自動移行されます。

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 古い通話の回収

端末 Webhook を受け取らないままの通話
（たとえば完了しない notify mode の通話）を終了するには `staleCallReaperSeconds` を使います。デフォルトは `0`
（無効）です。

推奨範囲:

- **本番:** notify スタイルフローには `120`〜`300` 秒。
- 通常の通話が完了できるように、この値は **`maxDurationSeconds` より大きく** してください。
  開始値としては `maxDurationSeconds + 30〜60` 秒が適切です。

例:

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

## Webhook セキュリティ

proxy またはトンネルが Gateway の前段にある場合、Plugin は
署名検証のために公開 URL を再構築します。これらのオプションは、どの forwarded
header を信頼するかを制御します。

`webhookSecurity.allowedHosts` は forwarding header からの host を allowlist 化します。

`webhookSecurity.trustForwardingHeaders` は allowlist なしで forwarded header を信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストの
送信元 IP が一覧に一致する場合にのみ forwarded header を信頼します。

Webhook のリプレイ保護は Twilio と Plivo で有効です。リプレイされた有効な Webhook
リクエストは受理されますが、副作用はスキップされます。

Twilio の会話ターンには `<Gather>` コールバック内にターン単位 token が含まれるため、
古い/リプレイされた speech コールバックが、新しい pending transcript ターンを満たすことはできません。

未認証の Webhook リクエストは、provider が必要とする署名ヘッダーが欠けている場合、
body 読み取り前に拒否されます。

voice-call Webhook は、署名検証前に共有の pre-auth body profile（64 KB / 5 秒）
と、IP ごとの in-flight 上限を使います。

安定した公開 host を使う例:

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

## 通話用 TTS

Voice Call は、通話中の
ストリーミング音声に core の `messages.tts` 設定を使います。plugin config 配下で、
**同じ形状**のまま上書きできます。これは `messages.tts` と deep‑merge されます。

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

注:

- Plugin config 内の旧式 `tts.<provider>` キー（`openai`, `elevenlabs`, `microsoft`, `edge`）は、読み込み時に `tts.providers.<provider>` へ自動移行されます。コミットする config では `providers` 形状を使ってください。
- **Microsoft speech は音声通話では無視されます**（電話音声には PCM が必要ですが、現在の Microsoft トランスポートは電話向け PCM 出力を公開していません）。
- Twilio media streaming が有効な場合は core TTS が使われます。それ以外では、通話は provider ネイティブ音声にフォールバックします。
- Twilio media stream がすでにアクティブな場合、Voice Call は TwiML `<Say>` へフォールバックしません。その状態で電話向け TTS が利用できない場合、再生リクエストは 2 つの再生経路を混在させるのではなく失敗します。
- 電話向け TTS が二次プロバイダーへフォールバックした場合、Voice Call はデバッグ用に provider chain（`from`, `to`, `attempts`）を含む警告をログ出力します。

### さらに例

core TTS のみを使う（上書きなし）:

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

通話に対してだけ ElevenLabs へ上書きする（他では core デフォルトを維持）:

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

通話用に OpenAI model だけを上書きする（deep‑merge の例）:

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

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` は、保証水準の低い caller-ID フィルターです。Plugin は
provider から渡された `From` 値を正規化し、`allowFrom` と比較します。
Webhook 検証は provider 配信と payload 整合性を認証しますが、
PSTN/VoIP の発信者番号所有権を証明するものではありません。`allowFrom` は
強い発信者 identity ではなく、caller-ID フィルタリングとして扱ってください。

自動応答はエージェントシステムを使います。次で調整します。

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 音声出力契約

自動応答では、Voice Call はシステムプロンプトに厳格な音声出力契約を追加します。

- `{"spoken":"..."}`

その後、Voice Call は音声テキストを防御的に抽出します。

- reasoning/error コンテンツとしてマークされた payload は無視する。
- 直接 JSON、fenced JSON、またはインラインの `"spoken"` キーを解析する。
- プレーンテキストにフォールバックし、planning/meta の先頭段落と思われるものを除去する。

これにより、音声再生は発信者向けテキストに集中し、planning テキストが音声に漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付いています。

- barge-in キュークリアと自動応答は、初期 greeting が実際に再生中の間だけ抑制されます。
- 初期再生に失敗した場合、通話は `listening` に戻り、初期メッセージは再試行のためキューされたままになります。
- Twilio ストリーミングでの初期再生は、追加遅延なしでストリーム接続時に開始されます。

### Twilio ストリーム切断猶予

Twilio media stream が切断されると、Voice Call は通話を自動終了する前に `2000ms` 待機します。

- その間にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後もストリームが再登録されない場合、通話が stuck なアクティブ状態になるのを防ぐため、通話は終了されます。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call の別名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # ログからターンレイテンシを要約
openclaw voicecall expose --mode funnel
```

`latency` はデフォルトの voice-call ストレージパスにある `calls.jsonl` を読み取ります。
別のログを指すには `--file <path>` を使い、分析対象を最後の N レコードに制限するには `--last <n>` を使ってください（デフォルト 200）。出力には、ターン
レイテンシと listen-wait 時間の p50/p90/p99 が含まれます。

## エージェント tool

tool 名: `voice_call`

action:

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `send_dtmf`（callId, digits）
- `end_call`（callId）
- `get_status`（callId）

このリポジトリには、対応する skill ドキュメント `skills/voice-call/SKILL.md` が同梱されています。

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
