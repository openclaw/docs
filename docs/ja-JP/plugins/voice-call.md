---
read_when:
    - OpenClaw から音声通話を発信したい場合
    - voice-call Plugin を設定または開発している場合
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo を使って音声通話を発信・着信し、必要に応じてリアルタイム音声やストリーミング文字起こしを利用する
title: 音声通話 Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw 用の音声通話を提供する Plugin です。発信通知、マルチターン会話、フルデュプレックスのリアルタイム音声、ストリーミング文字起こし、allowlist ポリシー付きの着信通話をサポートします。

**現在の provider:** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（開発用/ネットワークなし）。

<Note>
Voice Call Plugin は **Gateway プロセス内** で動作します。リモート Gateway を使う場合は、Gateway を実行しているマシンに Plugin をインストールして設定し、その後 Gateway を再起動して読み込んでください。
</Note>

## クイックスタート

<Steps>
  <Step title="Plugin をインストール">
    <Tabs>
      <Tab title="npm から（推奨）">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="ローカルフォルダーから（開発用）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    その後、Plugin を読み込むために Gateway を再起動してください。

  </Step>
  <Step title="provider と Webhook を設定">
    `plugins.entries.voice-call.config` 配下に config を設定します（完全な形式は下の [Configuration](#configuration) を参照）。最低限必要なのは、`provider`、provider の認証情報、`fromNumber`、および公開到達可能な Webhook URL です。
  </Step>
  <Step title="セットアップを検証">
    ```bash
    openclaw voicecall setup
    ```

    デフォルト出力はチャットログと端末で読みやすい形式です。Plugin の有効化、provider 認証情報、Webhook 公開、および音声 mode が 1 つだけ（`streaming` または `realtime`）有効になっていることを確認します。スクリプト用には `--json` を使ってください。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトでは dry run です。短い発信通知通話を実際に行うには `--yes` を追加してください。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップは **公開到達可能な Webhook URL** に解決される必要があります。`publicUrl`、tunnel URL、Tailscale URL、または serve fallback が loopback または private network 領域に解決される場合、carrier Webhook を受信できない provider を起動する代わりに setup は失敗します。
</Warning>

## Configuration

`enabled: true` で選択された provider に必要な認証情報が欠けている場合、Gateway 起動時に不足キーを含む setup-incomplete 警告がログに出力され、その runtime の起動はスキップされます。コマンド、RPC 呼び出し、agent tools は、使用時に不足している provider 設定を正確に返し続けます。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="provider の公開とセキュリティに関する注意">
    - Twilio、Telnyx、Plivo はすべて **公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用 provider です（ネットワーク呼び出しなし）。
    - Telnyx では、`skipSignatureVerification` が true でない限り `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok 無料枠では、正確な ngrok URL を `publicUrl` に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrok ローカル agent）の場合にのみ、無効な署名を持つ Twilio Webhook を許可します。ローカル開発専用です。
    - ngrok 無料枠の URL は変わったり、インタースティシャル動作が追加されたりすることがあります。`publicUrl` がずれると Twilio 署名は失敗します。本番では、安定したドメインまたは Tailscale funnel を推奨します。
  </Accordion>
  <Accordion title="ストリーミング接続数の上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを一度も送らないソケットを閉じます。
    - `streaming.maxPendingConnections` は、認証前の pre-start ソケット総数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの認証前 pre-start ソケット数を制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケット総数（pending + active）を制限します。
  </Accordion>
  <Accordion title="旧式 config の移行">
    `provider: "log"`、`twilio.from`、または旧式の `streaming.*` OpenAI キーを使う古い config は `openclaw doctor --fix` によって書き換えられます。ランタイムフォールバックは現時点では古い voice-call キーも受け付けますが、書き換え経路は `openclaw doctor --fix` であり、互換 shim は一時的なものです。

    自動移行される streaming キー:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## リアルタイム音声会話

`realtime` は、ライブ通話音声用のフルデュプレックス realtime voice provider を選択します。これは、音声を realtime transcription provider に転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と併用できません。通話ごとに 1 つの音声 mode を選んでください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録された realtime voice provider を使用します。
- バンドル済みの realtime voice provider: Google Gemini Live（`google`）と OpenAI（`openai`）。各 provider Plugin によって登録されます。
- provider 所有の raw config は `realtime.providers.<providerId>` 配下にあります。
- Voice Call は、共有の `openclaw_agent_consult` realtime tool をデフォルトで公開します。発信者がより深い推論、現在情報、または通常の OpenClaw tools を求めたときに、realtime model はそれを呼び出せます。
- `realtime.provider` が未登録の provider を指している場合、または realtime voice provider がまったく登録されていない場合、Voice Call は警告をログし、Plugin 全体を失敗させる代わりに realtime media をスキップします。
- consult session key は、利用可能なら既存の voice session を再利用し、それ以外では発信者/着信者の電話番号にフォールバックするため、フォローアップの consult 呼び出しは通話中もコンテキストを維持します。

### Tool policy

`realtime.toolPolicy` は consult 実行を制御します。

| Policy | 挙動 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult tool を公開し、通常の agent を `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner` | consult tool を公開し、通常の agent に通常の agent tool policy を使わせます。 |
| `none` | consult tool を公開しません。カスタム `realtime.tools` は引き続き realtime provider に渡されます。 |

### Realtime provider の例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: API key は `realtime.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得。model は `gemini-2.5-flash-native-audio-preview-12-2025`、voice は `Kore`。

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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

provider 固有の realtime voice オプションについては [Google provider](/ja-JP/providers/google) と [OpenAI provider](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用の realtime transcription provider を選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録された realtime transcription provider を使用します。
- バンドル済みの realtime transcription provider: Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI（`xai`）。各 provider Plugin によって登録されます。
- provider 所有の raw config は `streaming.providers.<providerId>` 配下にあります。
- `streaming.provider` が未登録の provider を指している場合、または何も登録されていない場合、Voice Call は警告をログし、Plugin 全体を失敗させる代わりに media streaming をスキップします。

### Streaming provider の例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: API key は `streaming.providers.openai.apiKey` または `OPENAI_API_KEY`。model は `gpt-4o-transcribe`、`silenceDurationMs: 800`、`vadThreshold: 0.5`。

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

  </Tab>
  <Tab title="xAI">
    デフォルト: API key は `streaming.providers.xai.apiKey` または `XAI_API_KEY`。endpoint は `wss://api.x.ai/v1/stt`、encoding は `mulaw`、sample rate は `8000`、`endpointingMs: 800`、`interimResults: true`。

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

  </Tab>
</Tabs>

## 通話用 TTS

Voice Call は、通話中のストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin config 配下で**同じ形式**で override でき、`messages.tts` とディープマージされます。

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

<Warning>
**音声通話では Microsoft speech は無視されます。** テレフォニー音声には PCM が必要ですが、現在の Microsoft トランスポートはテレフォニー用 PCM 出力を公開していません。
</Warning>

挙動に関する注意:

- Plugin config 内の旧式 `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は `openclaw doctor --fix` で修復されます。コミットする config では `tts.providers.<provider>` を使ってください。
- Twilio media streaming が有効なときはコア TTS が使われ、それ以外では通話は provider ネイティブの voice にフォールバックします。
- Twilio media stream がすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で telephony TTS が利用できないと、2 つの再生パスを混在させるのではなく、再生要求は失敗します。
- telephony TTS がセカンダリ provider にフォールバックした場合、Voice Call はデバッグ用に provider チェーン（`from`、`to`、`attempts`）付きの警告をログします。
- Twilio の barge-in または stream teardown によって保留中の TTS キューがクリアされた場合、キュー済みの再生要求は caller が再生完了を待ってハングしないように、完了状態になります。

### TTS の例

<Tabs>
  <Tab title="コア TTS のみ">
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
  </Tab>
  <Tab title="ElevenLabs に override（通話のみ）">
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
  </Tab>
  <Tab title="OpenAI model override（ディープマージ）">
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
  </Tab>
</Tabs>

## 着信通話

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定してください。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` は低保証の caller-ID フィルターです。Plugin は provider が供給した `From` 値を正規化し、`allowFrom` と比較します。Webhook 検証は provider 配信とペイロード完全性を認証しますが、PSTN/VoIP の発信番号所有権を証明するものでは **ありません**。`allowFrom` は強い caller identity ではなく caller-ID フィルタリングとして扱ってください。
</Warning>

自動応答は agent システムを使います。`responseModel`、`responseSystemPrompt`、`responseTimeoutMs` で調整してください。

### 音声出力契約

自動応答では、Voice Call は system prompt に厳密な音声出力契約を追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に音声テキストを抽出します。

- reasoning/error content としてマークされたペイロードは無視します。
- 直接 JSON、コードフェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画/メタ情報らしい先頭段落を除去します。

これにより、音声再生は caller 向けのテキストに集中し、計画テキストが音声へ漏れるのを防ぎます。

### 会話開始時の挙動

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付けられます。

- barge-in キュークリアと自動応答の抑制は、初期 greeting が実際に再生中の間だけ行われます。
- 初期再生が失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio streaming の初期再生は、追加遅延なしで stream 接続時に開始されます。
- barge-in はアクティブ再生を中断し、キュー済みだがまだ再生開始していない Twilio TTS エントリをクリアします。クリアされたエントリは skipped として解決されるため、後続の応答ロジックは再生されない音声を待つことなく続行できます。
- realtime voice 会話では、realtime stream 自身の開始ターンが使われます。Voice Call はその初期メッセージに対して旧式の `<Say>` TwiML update を投稿しないため、発信 `<Connect><Stream>` session は接続状態を維持します。

### Twilio stream 切断の猶予期間

Twilio media stream が切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その猶予期間中に stream が再接続すれば、自動終了はキャンセルされます。
- 猶予期間後に stream が再登録されなければ、通話が stuck な active call になるのを防ぐため、通話は終了されます。

## Stale call reaper

`staleCallReaperSeconds` を使うと、終端 Webhook を受信しない通話（たとえば notify mode のまま完了しない通話）を終了できます。デフォルトは `0`（無効）です。

推奨範囲:

- **本番:** notify 形式フローでは `120`〜`300` 秒
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく** してください。良い開始値は `maxDurationSeconds + 30〜60` 秒です。

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

proxy または tunnel が Gateway の前段にある場合、Plugin は署名検証のために公開 URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダー由来ホストの allowlist。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  allowlist なしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストの remote IP がこの一覧に一致する場合にのみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook の **リプレイ保護** は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは受理されますが、副作用はスキップされます。
- Twilio 会話ターンには `<Gather>` callback 内にターンごとの token が含まれるため、古い/リプレイされた speech callback が新しい pending transcript ターンを満たすことはできません。
- provider が必要とする署名ヘッダーが欠けている場合、未認証の Webhook リクエストは body 読み込み前に拒否されます。
- voice-call Webhook は、署名検証前に共有の pre-auth body profile（64 KB / 5 秒）と IP ごとの同時実行上限を使用します。

安定した公開ホストを使う例:

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` はデフォルトの voice-call 保存パスから `calls.jsonl` を読みます。別のログを指すには `--file <path>` を使い、解析対象を最後の N レコード（デフォルト 200）に制限するには `--last <n>` を使ってください。出力には、ターン遅延および listen-wait 時間の p50/p90/p99 が含まれます。

## Agent tool

tool 名: `voice_call`。

| Action | Args |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message` |
| `speak_to_user` | `callId`, `message` |
| `send_dtmf`     | `callId`, `digits` |
| `end_call`      | `callId` |
| `get_status`    | `callId` |

この repo には、対応する skill doc が `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

| Method | Args |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message` |
| `voicecall.speak`    | `callId`, `message` |
| `voicecall.dtmf`     | `callId`, `digits` |
| `voicecall.end`      | `callId` |
| `voicecall.status`   | `callId` |

## 関連

- [Talk mode](/ja-JP/nodes/talk)
- [Text-to-speech](/ja-JP/tools/tts)
- [Voice wake](/ja-JP/nodes/voicewake)
