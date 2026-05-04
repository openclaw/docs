---
read_when:
    - OpenClaw から発信音声通話をかけたい
    - 音声通話Pluginを設定または開発している場合
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け付けます。任意でリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話 Plugin
x-i18n:
    generated_at: "2026-05-04T05:01:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClawの音声通話をPlugin経由で利用できます。アウトバウンド通知、
マルチターン会話、全二重リアルタイム音声、ストリーミング
文字起こし、許可リストポリシー付きの着信通話をサポートします。

**現在のプロバイダー:** `twilio` (Programmable Voice + Media Streams)、
`telnyx` (Call Control v2)、`plivo` (Voice API + XML transfer + GetInput
speech)、`mock` (開発用/ネットワークなし)。

<Note>
Voice Call Pluginは**Gatewayプロセス内**で実行されます。リモート
Gatewayを使用している場合は、Gatewayを実行しているマシンに
Pluginをインストールして設定し、その後Gatewayを再起動して読み込みます。
</Note>

## クイックスタート

<Steps>
  <Step title="Pluginをインストールする">
    <Tabs>
      <Tab title="npmから">
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

    現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ
    正確なバージョンに固定してください。

    その後、Pluginを読み込むためにGatewayを再起動します。

  </Step>
  <Step title="プロバイダーとWebhookを設定する">
    `plugins.entries.voice-call.config` の下に設定を指定します (完全な形は下の
    [設定](#configuration) を参照)。少なくとも
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な
    Webhook URLが必要です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    ```

    デフォルト出力はチャットログやターミナルで読みやすい形式です。Pluginの有効化、
    プロバイダー認証情報、Webhookの公開状態、1つの音声モード
    (`streaming` または `realtime`) だけが有効かどうかを確認します。スクリプトでは
    `--json` を使用します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短いアウトバウンド通知通話を実際に発信するには
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivoでは、セットアップが**公開Webhook URL**に解決される必要があります。
`publicUrl`、トンネルURL、Tailscale URL、またはserveフォールバックが
local loopbackまたはプライベートネットワーク空間に解決される場合、キャリアWebhookを受信できないプロバイダーを開始する代わりに、
セットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択されたプロバイダーの認証情報が不足している場合、
Gateway起動時に、不足しているキーを含むセットアップ未完了の警告がログ出力され、
ランタイムの開始はスキップされます。コマンド、RPC呼び出し、エージェントツールは、使用時に
不足しているプロバイダー設定を正確に返します。

<Note>
Voice-call認証情報はSecretRefsを受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準のSecretRefサーフェスを通じて解決されます。[SecretRef認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
  <Accordion title="プロバイダー公開とセキュリティの注記">
    - Twilio、Telnyx、Plivoはいずれも**公開到達可能な**Webhook URLを必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyxでは、`skipSignatureVerification` がtrueでない限り `telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok無料枠では、`publicUrl` を正確なngrok URLに設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` がlocal loopback (ngrokローカルエージェント) の場合に**のみ**、無効な署名を持つTwilio Webhookを許可します。ローカル開発専用です。
    - Ngrok無料枠のURLは変更されたり、インタースティシャル動作が追加されたりすることがあります。`publicUrl` がずれると、Twilio署名は失敗します。本番環境では、安定したドメインまたはTailscale funnelを推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、認証前の開始待ちソケットの合計数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元IPごとの認証前の開始待ちソケット数を制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの合計数 (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシー
    `streaming.*` OpenAIキーを使用する古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは当面、古いvoice-callキーを引き続き受け付けますが、
    書き換えパスは `openclaw doctor --fix` であり、互換シムは
    一時的なものです。

    自動移行されるストリーミングキー:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## セッションスコープ

デフォルトでは、Voice Callは `sessionScope: "per-phone"` を使用するため、同じ発信者からの繰り返し通話では
会話メモリが保持されます。各キャリア通話を新しいコンテキストで開始したい場合、たとえば受付、
予約、IVR、または同じ電話番号が異なる会議を表す可能性があるGoogle Meetブリッジフローでは、
`sessionScope: "per-call"` を設定します。

## リアルタイム音声会話

`realtime` は、ライブ通話音声のための全二重リアルタイム音声プロバイダーを選択します。
これは `streaming` とは別であり、`streaming` は音声をリアルタイム文字起こしプロバイダーに
転送するだけです。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。通話ごとに
音声モードを1つ選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` はTwilio Media Streamsでサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Callは最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされているリアルタイム音声プロバイダー: Google Gemini Live (`google`) とOpenAI (`openai`)。それぞれのプロバイダーPluginによって登録されます。
- プロバイダー所有のraw設定は `realtime.providers.<providerId>` の下にあります。
- Voice Callはデフォルトで共有 `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、現在の情報、または通常のOpenClawツールを求めた場合、リアルタイムモデルはこれを呼び出せます。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Callはまずconsult質問についてインデックス済みメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にそれらのスニペットをリアルタイムモデルに返します。その後、`realtime.fastContext.fallbackToConsult` がtrueの場合にのみ、完全なconsultエージェントにフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice CallはPlugin全体を失敗させるのではなく、警告をログ出力してリアルタイムメディアをスキップします。
- Consultセッションキーは、利用可能な場合は保存済みの通話セッションを再利用し、その後、設定された `sessionScope` (`per-phone` がデフォルト、分離された通話では `per-call`) にフォールバックします。

### ツールポリシー

`realtime.toolPolicy` はconsult実行を制御します。

| ポリシー         | 動作                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consultツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consultツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                             |
| `none`           | consultツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーに渡されます。                                  |

### リアルタイムプロバイダーの例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: APIキーは `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得されます。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore` です。
    `sessionResumption` と `contextWindowCompression` は、より長く再接続可能な通話のために
    デフォルトでオンです。電話音声でより速いターンテイキングに調整するには、
    `silenceDurationMs`、`startSensitivity`、`endSensitivity` を使用します。

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
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

[Google プロバイダー](/ja-JP/providers/google) と
[OpenAI プロバイダー](/ja-JP/providers/openai) で、プロバイダー固有のリアルタイム音声
オプションを参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call はただちにストリームを登録し、プロバイダーの接続中は文字起こしプロバイダー経由で受信メディアをキューに入れ、リアルタイム文字起こしの準備ができてから最初の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は警告をログに記録し、Plugin 全体を失敗させる代わりにメディアストリーミングをスキップします。

### ストリーミングプロバイダーの例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: API キー `streaming.providers.openai.apiKey` または
    `OPENAI_API_KEY`、モデル `gpt-4o-transcribe`、`silenceDurationMs: 800`、
    `vadThreshold: 0.5`。

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
    デフォルト: API キー `streaming.providers.xai.apiKey` または `XAI_API_KEY`、
    エンドポイント `wss://api.x.ai/v1/stt`、エンコーディング `mulaw`、サンプルレート `8000`、
    `endpointingMs: 800`、`interimResults: true`。

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

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin 設定配下で
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
**Microsoft 音声は音声通話では無視されます。** 電話音声には PCM が必要です。
現在の Microsoft トランスポートは電話用 PCM 出力を公開していません。
</Warning>

動作メモ:

- Plugin 設定内のレガシー `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダーネイティブの音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話用 TTS が利用できない場合、2 つの再生パスを混在させる代わりに再生リクエストは失敗します。
- 電話用 TTS がセカンダリプロバイダーにフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio の割り込みまたはストリーム終了によって保留中の TTS キューがクリアされると、キュー内の再生リクエストは再生完了を待つ発信者をハングさせる代わりに解決されます。

### TTS の例

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` は低保証の発信者 ID スクリーニングです。
Plugin はプロバイダーが提供する `From` 値を正規化し、
`allowFrom` と比較します。Webhook 検証はプロバイダーからの配送と
ペイロードの整合性を認証しますが、PSTN/VoIP の発信者番号の
所有権を証明するものでは**ありません**。`allowFrom` は強固な発信者
本人性ではなく、発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号の通話を受け取り、各番号を異なる回線のように動作させる場合は `numbers` を使用します。たとえば、一方の番号では気軽な個人アシスタントを使い、別の番号ではビジネス用の人格、別の応答エージェント、別の TTS 音声を使用できます。

ルートは、プロバイダーが提供するダイヤル先の `To` 番号から選択されます。キーは
E.164 番号でなければなりません。通話が到着すると、Voice Call は一致するルートを一度解決し、
一致したルートを通話レコードに保存し、その有効な設定を挨拶、従来の自動応答パス、リアルタイム相談パス、TTS
再生に再利用します。一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用しません。通話開始時に発信先、メッセージ、セッションを明示的に渡してください。

ルート上書きは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call `tts` 設定にディープマージされるため、
通常はプロバイダー音声だけを上書きできます。

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### 音声出力コントラクト

自動応答では、Voice Call はシステムプロンプトに厳密な音声出力コントラクトを追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に音声テキストを抽出します。

- reasoning/error コンテンツとしてマークされたペイロードを無視します。
- 直接 JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報らしい導入段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声に漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に紐づきます。

- 割り込みによるキュークリアと自動応答は、最初の挨拶が実際に発話中の場合にのみ抑制されます。
- 最初の再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio ストリーミングの最初の再生は、ストリーム接続時に追加の遅延なしで開始されます。
- 割り込みはアクティブな再生を中止し、キュー内にあるがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに継続できます。
- リアルタイム音声会話は、リアルタイムストリーム自身の開始ターンを使用します。Voice Call はその最初のメッセージに対してレガシーな `<Say>` TwiML 更新を投稿**しない**ため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブ通話の詰まりを防ぐため通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受け取らない通話 (たとえば、完了しない通知モードの通話) を終了するには、`staleCallReaperSeconds` を使用します。デフォルトは
`0` (無効) です。

推奨範囲:

- **本番環境:** 通知スタイルのフローでは `120`～`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく**してください。開始点としては `maxDurationSeconds + 30～60` 秒が適しています。

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

プロキシまたはトンネルが Gateway の前にある場合、Plugin は署名検証のために公開 URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リスト化します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護**は Twilio と Plivo で有効です。再生された有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio 会話ターンには `<Gather>` コールバック内にターンごとのトークンが含まれるため、古いまたは再生された音声コールバックは新しい保留中の文字起こしターンを満たせません。
- 認証されていない Webhook リクエストは、プロバイダーの必須署名ヘッダーが欠落している場合、本文を読み取る前に拒否されます。
- voice-call Webhook は共有の事前認証本文プロファイル (64 KB / 5 秒) に加え、署名検証前の IP ごとの処理中上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは Gateway が所有する音声通話ランタイムに委譲するため、CLI が 2 つ目の webhook サーバーをバインドすることはありません。Gateway に到達できない場合、コマンドはスタンドアロンの CLI ランタイムにフォールバックします。

`latency` はデフォルトの音声通話ストレージパスから `calls.jsonl` を読み取ります。別のログを指定するには `--file <path>` を使用し、分析を最後の N 件のレコード（デフォルトは 200）に制限するには `--last <n>` を使用します。出力にはターンレイテンシと待機リッスン時間の p50/p90/p99 が含まれます。

## エージェントツール

ツール名: `voice_call`.

| アクション      | 引数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

このリポジトリには、対応する skill ドキュメントが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

| メソッド             | 引数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` の場合にのみ有効です。通知モードの通話で接続後の数字入力が必要な場合は、通話が存在するようになってから `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップで webhook 公開に失敗する

Gateway を実行している環境と同じ環境からセットアップを実行してください。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が緑である必要があります。設定済みの `publicUrl` でも、それがローカルまたはプライベートネットワーク空間を指している場合は失敗します。通信事業者がそれらのアドレスへコールバックできないためです。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、または `fd00::/8` を使用しないでください。

Twilio の通知モードの発信通話では、最初の `<Say>` TwiML を通話作成リクエストで直接送信するため、最初に読み上げられるメッセージは Twilio が webhook TwiML を取得することに依存しません。公開 webhook は、ステータスコールバック、会話通話、接続前 DTMF、リアルタイムストリーム、接続後の通話制御には引き続き必要です。

公開用の経路を 1 つ使用してください。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

設定を変更した後、Gateway を再起動または再読み込みし、次を実行してください。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダーの認証情報が失敗する

選択したプロバイダーと必要な認証情報フィールドを確認してください。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、`fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`。

認証情報は Gateway ホスト上に存在する必要があります。ローカルのシェルプロファイルを編集しても、Gateway が再起動するか環境を再読み込みするまでは、すでに実行中の Gateway には影響しません。

### 通話は開始するがプロバイダーの webhook が届かない

プロバイダーコンソールが正確な公開 webhook URL を指していることを確認してください。

```text
https://voice.example.com/voice/webhook
```

次にランタイム状態を調べます。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

よくある原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の起動後にトンネル URL が変更された。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS が公開ホスト名を Gateway 以外の場所へルーティングしている。
- Voice Call Plugin が有効化されないまま Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスに対して `webhookSecurity.trustedProxyIPs` を使用してください。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を自分で管理している場合にのみ使用してください。

### 署名検証に失敗する

プロバイダー署名は、OpenClaw が受信リクエストから再構築した公開 URL に対して検証されます。署名が失敗する場合:

- プロバイダー webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致していることを確認してください。
- ngrok の無料階層 URL では、トンネルのホスト名が変わったら `publicUrl` を更新してください。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定してください。
- ローカルテスト以外で `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加に失敗する

Google Meet は Twilio のダイヤルイン参加にこの Plugin を使用します。まず Voice Call を確認してください。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に Google Meet トランスポートを明示的に確認します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が緑でも Meet 参加者が参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認してください。通話自体は正常でも、会議が誤った DTMF シーケンスを拒否または無視していることがあります。

Google Meet は Meet の DTMF シーケンスと導入テキストを `voicecall.start` に渡します。Twilio 通話では、Voice Call が DTMF TwiML を最初に提供し、webhook にリダイレクトしてから、保存された導入が電話参加者の会議参加後に生成されるようにリアルタイムメディアストリームを開きます。

ライブ段階のトレースには `openclaw logs --follow` を使用してください。正常な Twilio Meet 参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が消費され、リアルタイム処理の前に提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- リアルタイムブリッジが、初期あいさつをキューに入れた状態で開始する。

`openclaw voicecall tail` には永続化された通話レコードが引き続き表示されます。これは通話状態と文字起こしには有用ですが、すべての webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

音声モードが 1 つだけ有効になっていることを確認してください。`realtime.enabled` と `streaming.enabled` を同時に true にすることはできません。

リアルタイム Twilio 通話では、次も確認してください。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定、または登録済みプロバイダーを指定している。
- プロバイダー API キーが Gateway プロセスで利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始し、初期あいさつがキューに入ったことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
