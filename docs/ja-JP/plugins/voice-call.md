---
read_when:
    - OpenClaw から音声通話を発信したい
    - voice-call Pluginを設定または開発しています
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け、オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-04-30T05:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw の Plugin による音声通話。アウトバウンド通知、
複数ターンの会話、全二重リアルタイム音声、ストリーミング
文字起こし、許可リストポリシー付きのインバウンド通話をサポートします。

**現在のプロバイダー:** `twilio` (Programmable Voice + Media Streams)、
`telnyx` (Call Control v2)、`plivo` (Voice API + XML transfer + GetInput
speech)、`mock` (開発用/ネットワークなし)。

<Note>
Voice Call Plugin は **Gateway プロセス内**で実行されます。リモート
Gateway を使用する場合は、Gateway を実行しているマシンに Plugin を
インストールして設定し、その後 Gateway を再起動して読み込ませます。
</Note>

## クイックスタート

<Steps>
  <Step title="Plugin をインストールする">
    <Tabs>
      <Tab title="npm から">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="ローカルフォルダーから (開発)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm が OpenClaw 所有のパッケージを非推奨として報告する場合、そのパッケージバージョンは
    古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、現在のパッケージ化済み OpenClaw
    ビルド、またはローカルフォルダーのパスを使用してください。

    その後、Gateway を再起動して Plugin を読み込ませます。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` の下に設定します (完全な形は下の
    [設定](#configuration) を参照してください)。最低限、
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な
    Webhook URL が必要です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    ```

    デフォルトの出力はチャットログとターミナルで読みやすい形式です。
    Plugin の有効化、プロバイダー認証情報、Webhook の公開状態、
    1 つの音声モード (`streaming` または `realtime`) だけが有効であることを確認します。
    スクリプトでは `--json` を使用します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短いアウトバウンド通知通話を実際に発信するには、
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
local loopback またはプライベートネットワーク空間に解決される場合、
キャリア Webhook を受信できないプロバイダーを起動する代わりに、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択されたプロバイダーに認証情報がない場合、
Gateway 起動時に不足キーを含むセットアップ未完了の警告がログに記録され、
ランタイムの起動はスキップされます。コマンド、RPC 呼び出し、エージェントツールは、使用時に
不足しているプロバイダー設定をそのまま返します。

<Note>
音声通話の認証情報は SecretRefs を受け付けます。`plugins.entries.voice-call.config.twilio.authToken` と `plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef サーフェス経由で解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
</Note>

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
  <Accordion title="プロバイダー公開とセキュリティに関する注意">
    - Twilio、Telnyx、Plivo はすべて、**公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx では、`skipSignatureVerification` が true でない限り、`telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok 無料枠では、`publicUrl` を正確な ngrok URL に設定します。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が local loopback (ngrok ローカルエージェント) の場合に**のみ**、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok 無料枠の URL は変更されたり、中間ページの動作が追加されたりすることがあります。`publicUrl` がずれると、Twilio の署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、認証前の start 前ソケットの総数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの認証前の start 前ソケット数を制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの総数 (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーな
    `streaming.*` OpenAI キーを使用している古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは当面、古い voice-call キーをまだ受け付けますが、
    書き換えパスは `openclaw doctor --fix` であり、互換 shim は
    一時的なものです。

    自動移行されるストリーミングキー:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
これは、音声をリアルタイム文字起こしプロバイダーへ転送するだけの `streaming` とは別のものです。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。
通話ごとに音声モードを 1 つ選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- 同梱のリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` の下にあります。
- Voice Call は、デフォルトで共有 `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、現在の情報、または通常の OpenClaw ツールを求めたときに、リアルタイムモデルはそれを呼び出せます。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログに記録し、リアルタイムメディアをスキップします。
- 相談セッションキーは、利用可能な場合は既存の音声セッションを再利用し、その後、発信者/着信者の電話番号にフォールバックするため、通話中の後続の相談呼び出しでコンテキストが維持されます。

### ツールポリシー

`realtime.toolPolicy` は相談実行を制御します。

| ポリシー           | 動作                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 相談ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | 相談ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                                      |
| `none`           | 相談ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                               |

### リアルタイムプロバイダーの例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: API キーは `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得されます。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore` です。

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

プロバイダー固有のリアルタイム音声オプションについては、[Google プロバイダー](/ja-JP/providers/google) と
[OpenAI プロバイダー](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- 同梱のリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` の下にあります。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログに記録し、メディアストリーミングをスキップします。

### ストリーミングプロバイダーの例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: API キーは `streaming.providers.openai.apiKey` または
    `OPENAI_API_KEY` から取得されます。モデルは `gpt-4o-transcribe`、`silenceDurationMs: 800`、
    `vadThreshold: 0.5` です。

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
    既定値: API キー `streaming.providers.xai.apiKey` または `XAI_API_KEY`;
    エンドポイント `wss://api.x.ai/v1/stt`; エンコーディング `mulaw`; サンプルレート `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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

## 通話の TTS

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin 設定の下で
**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

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
**Microsoft speech は音声通話では無視されます。** 電話音声には PCM が必要です。
現在の Microsoft トランスポートは電話用 PCM 出力を公開していません。
</Warning>

動作メモ:

- Plugin 設定内のレガシー `tts.<provider>` キー（`openai`, `elevenlabs`, `microsoft`, `edge`）は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダー標準の音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話向け TTS が利用できない場合、2 つの再生経路を混在させる代わりに再生リクエストは失敗します。
- 電話向け TTS がセカンダリプロバイダーにフォールバックする場合、Voice Call はデバッグ用にプロバイダーチェーン（`from`, `to`, `attempts`）を含む警告をログに記録します。
- Twilio の割り込みまたはストリーム終了によって保留中の TTS キューがクリアされると、キュー内の再生リクエストは、再生完了を待つ発信者を待たせたままにするのではなく解決されます。

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
  <Tab title="ElevenLabs に上書き（通話のみ）">
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
  <Tab title="OpenAI モデルの上書き（ディープマージ）">
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

着信ポリシーの既定値は `disabled` です。着信通話を有効にするには、次を設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` は信頼性の低い発信者 ID スクリーニングです。
Plugin はプロバイダーから提供された `From` 値を正規化し、それを
`allowFrom` と比較します。Webhook 検証はプロバイダー配信と
ペイロード整合性を認証しますが、PSTN/VoIP の発信者番号
所有権を証明するものでは**ありません**。`allowFrom` は強力な発信者
識別ではなく、発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`,
`responseSystemPrompt`, `responseTimeoutMs` で調整します。

### 音声出力コントラクト

自動応答では、Voice Call は厳格な音声出力コントラクトを
システムプロンプトに追加します。

```text
{"spoken":"..."}
```

Voice Call は音声テキストを防御的に抽出します。

- reasoning/error コンテンツとしてマークされたペイロードを無視します。
- 直接 JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報と思われる冒頭段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、
計画テキストが音声に漏れることを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ
再生状態に結び付けられています。

- 割り込みキューのクリアと自動応答は、初回あいさつが実際に発話中の場合にのみ抑制されます。
- 初回再生が失敗した場合、通話は `listening` に戻り、初回メッセージは再試行のためキューに残ります。
- Twilio ストリーミングの初回再生は、ストリーム接続時に追加遅延なしで開始されます。
- 割り込みはアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは、再生されることのない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム自身の開始ターンを使用します。Voice Call はその初回メッセージに対してレガシー `<Say>` TwiML 更新を投稿しないため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を
自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続した場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が詰まったままになるのを防ぐため、通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受信しない通話（たとえば、完了しない通知モードの通話）を終了するには
`staleCallReaperSeconds` を使用します。既定値は `0`（無効）です。

推奨範囲:

- **本番環境:** 通知スタイルのフローでは `120`〜`300` 秒。
- 通常の通話が完了できるように、この値は **`maxDurationSeconds` より大きく**してください。開始点としては `maxDurationSeconds + 30〜60` 秒が適切です。

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

プロキシまたはトンネルが Gateway の前段にある場合、Plugin は
署名検証用に公開 URL を再構築します。これらのオプションは、
どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストの許可リスト。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護** は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは受領されますが、副作用はスキップされます。
- Twilio の会話ターンには `<Gather>` コールバックごとのターントークンが含まれるため、古いまたはリプレイされた音声コールバックが、より新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーが要求する署名ヘッダーが欠落している場合、本文読み取り前に拒否されます。
- voice-call Webhook は、共有の認証前本文プロファイル（64 KB / 5 秒）に加えて、署名検証前の IP ごとの処理中上限を使用します。

安定した公開ホストの例:

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

`latency` は既定の voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指すには `--file <path>` を使用し、分析を直近 N 件のレコード（既定 200）に制限するには
`--last <n>` を使用します。出力にはターンレイテンシと listen-wait 時間の
p50/p90/p99 が含まれます。

## エージェントツール

ツール名: `voice_call`.

| アクション      | 引数                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

このリポジトリには、対応する skill ドキュメントが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

| メソッド             | 引数                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
