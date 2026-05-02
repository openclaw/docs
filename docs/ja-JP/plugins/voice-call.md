---
read_when:
    - OpenClaw から発信音声通話をかけたい場合
    - voice-call Pluginを設定または開発しています
    - 電話通信でリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、またはPlivo経由で発信音声通話を行い、着信音声通話を受け付けます。オプションでリアルタイム音声とストリーミング文字起こしに対応します。
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-05-02T21:04:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a plugin. Supports outbound notifications,
multi-turn conversations, full-duplex realtime voice, streaming
transcription, and inbound calls with allowlist policies.

**Current providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML 転送 + GetInput
音声), `mock` (開発用/ネットワークなし).

<Note>
Voice Call plugin は **Gateway プロセス内**で実行されます。リモート
Gateway を使う場合は、Gateway を実行しているマシンに plugin をインストールして設定し、その後 Gateway を再起動して読み込ませます。
</Note>

## クイックスタート

<Steps>
  <Step title="Plugin をインストール">
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

    npm が OpenClaw 所有のパッケージを非推奨として報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、現在のパッケージ化済み OpenClaw ビルドまたはローカルフォルダーパスを使用してください。

    その後、Gateway を再起動して plugin を読み込ませます。

  </Step>
  <Step title="プロバイダーと Webhook を設定">
    `plugins.entries.voice-call.config` 配下に設定します (完全な形は下の
    [設定](#configuration) を参照)。最低限必要なのは、
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な Webhook URL です。
  </Step>
  <Step title="設定を検証">
    ```bash
    openclaw voicecall setup
    ```

    デフォルト出力はチャットログとターミナルで読みやすい形式です。plugin の有効化、プロバイダー認証情報、Webhook の公開状態、音声モード (`streaming` または `realtime`) が 1 つだけ有効であることを確認します。スクリプトでは `--json` を使用してください。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。実際に短い発信通知通話を行うには `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、設定が **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが local loopback やプライベートネットワーク空間に解決される場合、キャリア Webhook を受信できないプロバイダーを起動する代わりに設定は失敗します。
</Warning>

## 設定

`enabled: true` で選択したプロバイダーに認証情報がない場合、Gateway 起動時に不足キーを含む setup-incomplete 警告をログに出力し、ランタイムの起動をスキップします。コマンド、RPC 呼び出し、エージェントツールは、使用時に不足しているプロバイダー設定を正確に返します。

<Note>
音声通話の認証情報は SecretRef を受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef サーフェスを通じて解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
  <Accordion title="プロバイダー公開とセキュリティの注意事項">
    - Twilio、Telnyx、Plivo はすべて **公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - `skipSignatureVerification` が true でない限り、Telnyx には `telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料枠では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が local loopback (ngrok ローカルエージェント) の場合にのみ、無効な署名を持つ Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok 無料枠 URL は変更されたり、インタースティシャル動作が追加されたりする可能性があります。`publicUrl` がずれると、Twilio 署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は未認証の開始前ソケット総数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は送信元 IP ごとの未認証の開始前ソケット数を制限します。
    - `streaming.maxConnections` は開いているメディアストリームソケット総数 (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシー
    `streaming.*` OpenAI キーを使う古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは現時点では古い voice-call キーも受け付けますが、書き換えパスは `openclaw doctor --fix` であり、互換 shim は一時的なものです。

    自動移行される streaming キー:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## セッションスコープ

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使用するため、同じ発信者からの繰り返し通話は会話メモリを保持します。各キャリア通話を新しいコンテキストで開始する必要がある場合は、`sessionScope: "per-call"` を設定します。たとえば、受付、予約、IVR、または同じ電話番号が異なる会議を表す可能性がある Google Meet ブリッジフローなどです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。これは、音声をリアルタイム文字起こしプロバイダーへ転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせられません。通話ごとに音声モードを 1 つ選んでください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- 同梱のリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。各プロバイダー plugin によって登録されます。
- プロバイダー所有の raw config は `realtime.providers.<providerId>` 配下にあります。
- Voice Call はデフォルトで共有 `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはそれを呼び出せます。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス化済みメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 内にそれらのスニペットをリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が true の場合にのみ、完全な consult エージェントへフォールバックします。
- `realtime.provider` が未登録プロバイダーを指す場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は plugin 全体を失敗させる代わりに警告をログに出力し、リアルタイムメディアをスキップします。
- Consult セッションキーは、利用可能な場合は保存済み通話セッションを再利用し、その後、設定された `sessionScope` (デフォルトは `per-phone`、分離通話では `per-call`) にフォールバックします。

### ツールポリシー

`realtime.toolPolicy` は consult 実行を制御します。

| ポリシー           | 動作                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                                      |
| `none`           | consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                               |

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
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダーPluginによって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call はストリームを即座に登録し、プロバイダーの接続中は受信メディアを文字起こしプロバイダーにキューし、リアルタイム文字起こしの準備が整ってから初回の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は警告をログに記録し、Plugin全体を失敗させる代わりにメディアストリーミングをスキップします。

### ストリーミングプロバイダーの例

<Tabs>
  <Tab title="OpenAI">
    既定値: APIキー `streaming.providers.openai.apiKey` または
    `OPENAI_API_KEY`; モデル `gpt-4o-transcribe`; `silenceDurationMs: 800`;
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
    既定値: APIキー `streaming.providers.xai.apiKey` または `XAI_API_KEY`;
    エンドポイント `wss://api.x.ai/v1/stt`; エンコーディング `mulaw`; サンプルレート `8000`;
    `endpointingMs: 800`; `interimResults: true`。

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

## 通話用TTS

Voice Call は、通話のストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin設定内で**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

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
**Microsoft speech は音声通話では無視されます。** 電話音声には PCM が必要です。現在の Microsoft トランスポートは電話用 PCM 出力を公開していません。
</Warning>

動作メモ:

- Plugin設定内のレガシーな `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコアTTSが使用されます。それ以外の場合、通話はプロバイダー固有の音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話TTSを利用できない場合、再生リクエストは2つの再生経路を混在させる代わりに失敗します。
- 電話TTSがセカンダリプロバイダーにフォールバックする場合、Voice Call はデバッグ用にプロバイダーチェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio の割り込みまたはストリームの終了によって保留中のTTSキューがクリアされると、キュー内の再生リクエストは、発信者を再生完了待ちのままにせず解決されます。

### TTSの例

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

着信ポリシーの既定値は `disabled` です。着信通話を有効にするには、次を設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` は保証度の低い発信者IDフィルターです。この
Pluginは、プロバイダーから提供された `From` 値を正規化し、
`allowFrom` と比較します。Webhook検証はプロバイダーの配信と
ペイロードの完全性を認証しますが、PSTN/VoIP 発信者番号の
所有権を証明するものでは**ありません**。`allowFrom` は強力な発信者
IDではなく、発信者IDフィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1つの Voice Call Pluginが複数の電話番号の通話を受け取り、各番号を別々の回線のように動作させる必要がある場合は、`numbers` を使用します。たとえば、ある番号ではカジュアルな個人アシスタントを使い、別の番号ではビジネス向けのペルソナ、別の応答エージェント、別のTTS音声を使えます。

ルートは、プロバイダーから提供されたダイヤル先の `To` 番号から選択されます。キーは E.164 番号である必要があります。通話が到着すると、Voice Call は一致するルートを一度だけ解決し、一致したルートを通話レコードに保存し、その有効な設定を挨拶、クラシックな自動応答パス、リアルタイム相談パス、TTS再生に再利用します。一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用しません。通話を開始するときに、発信先、メッセージ、セッションを明示的に渡してください。

ルート上書きは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call の `tts` 設定に対してディープマージされるため、通常はプロバイダーの音声だけを上書きできます。

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

### 音声出力契約

自動応答では、Voice Call は厳格な音声出力契約をシステムプロンプトに追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に読み上げテキストを抽出します。

- 推論/エラーコンテンツとしてマークされたペイロードを無視します。
- 直接のJSON、フェンス付きJSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画/メタ情報らしい導入段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声へ漏れることを避けられます。

### 会話開始時の動作

発信の `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付けられます。

- 割り込み時のキュークリアと自動応答は、初回の挨拶が実際に読み上げ中の間だけ抑制されます。
- 初回再生に失敗した場合、通話は `listening` に戻り、初回メッセージは再試行のためキューに残ります。
- Twilio ストリーミングの初回再生は、ストリーム接続時に追加の遅延なく開始します。
- 割り込みはアクティブな再生を中止し、まだ再生されていないキュー済みの Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム自体の開始ターンを使用します。Voice Call はその初回メッセージに対してレガシーな `<Say>` TwiML 更新を投稿**しない**ため、発信の `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が固着しないように通話は終了されます。

## 古い通話のリーパー

終端のWebhookを受け取らない通話 (たとえば、完了しない通知モードの通話) を終了するには、`staleCallReaperSeconds` を使用します。既定値は `0` (無効) です。

推奨範囲:

- **本番:** 通知スタイルのフローでは `120`〜`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく**してください。開始点としては `maxDurationSeconds + 30–60` 秒が適切です。

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

プロキシまたはトンネルが Gateway の前にある場合、このPluginは署名検証用の公開URLを再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リスト化します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモートIPがリストに一致する場合のみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護** は Twilio と Plivo で有効です。再送された有効なWebhookリクエストは確認応答されますが、副作用はスキップされます。
- Twilio の会話ターンでは、`<Gather>` コールバックにターンごとのトークンが含まれるため、古い/再送された音声コールバックは新しい保留中の文字起こしターンを満たせません。
- 未認証のWebhookリクエストは、プロバイダーが必要とする署名ヘッダーが欠落している場合、本文読み取り前に拒否されます。
- voice-call Webhook は、共有の事前認証本文プロファイル (64 KB / 5秒) に加え、署名検証前のIPごとの処理中上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは Gateway 所有の voice-call ランタイムに委譲されるため、CLI が2つ目のWebhookサーバーをバインドすることはありません。到達可能な Gateway がない場合、コマンドはスタンドアロンのCLIランタイムにフォールバックします。

`latency` は、デフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使い、分析を最後の N 件のレコード（デフォルト 200 件）に制限するには `--last <n>` を使います。出力には、ターン遅延とリッスン待機時間の p50/p90/p99 が含まれます。

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

このリポジトリには、対応するスキルドキュメントが `skills/voice-call/SKILL.md` に同梱されています。

## Gateway RPC

| メソッド             | 引数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。notify モードの通話で接続後の数字入力が必要な場合は、通話が作成された後に `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップが Webhook 公開で失敗する

Gateway を実行している環境と同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が緑である必要があります。設定済みの `publicUrl` でも、それがローカルまたはプライベートネットワーク空間を指している場合は失敗します。通信事業者がそれらのアドレスへコールバックできないためです。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

Twilio の notify モードの発信通話は、最初の `<Say>` TwiML を create-call リクエストで直接送信するため、最初に読み上げられるメッセージは Twilio が Webhook TwiML を取得することに依存しません。それでも、ステータスコールバック、会話通話、接続前 DTMF、リアルタイムストリーム、接続後の通話制御には公開 Webhook が必要です。

公開経路を 1 つ使用します。

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

設定を変更した後、Gateway を再起動または再読み込みし、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー認証情報が失敗する

選択されたプロバイダーと必須の認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、`fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`。

認証情報は Gateway ホスト上に存在している必要があります。ローカルのシェルプロファイルを編集しても、すでに実行中の Gateway には、再起動または環境の再読み込みまで反映されません。

### 通話は開始するがプロバイダー Webhook が届かない

プロバイダーコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次に実行時状態を確認します。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` と異なるパスを指している。
- Gateway 起動後にトンネル URL が変更された。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS が公開ホスト名を Gateway 以外の場所へルーティングしている。
- Voice Call Plugin を有効にせずに Gateway を再起動した。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスに対して `webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を自分で管理している場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、OpenClaw が受信リクエストから再構築した公開 URL に対して検証されます。署名が失敗する場合:

- プロバイダー Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致することを確認します。
- ngrok の無料枠 URL では、トンネルのホスト名が変わったら `publicUrl` を更新します。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外で `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加が失敗する

Google Meet は Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を確認します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に Google Meet トランスポートを明示的に確認します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が緑でも Meet 参加者が参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認します。電話通話自体は正常でも、会議が誤った DTMF シーケンスを拒否または無視していることがあります。

Google Meet は Meet の DTMF シーケンスとイントロテキストを `voicecall.start` に渡します。Twilio 通話では、Voice Call が DTMF TwiML を先に提供し、Webhook にリダイレクトしてから、電話参加者が会議に参加した後で保存済みのイントロが生成されるようにリアルタイムメディアストリームを開きます。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet 参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が、リアルタイム処理の前に消費され提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- 初期挨拶がキューに入った状態でリアルタイムブリッジが開始する。

`openclaw voicecall tail` は引き続き永続化された通話レコードを表示します。通話状態とトランスクリプトには有用ですが、すべての Webhook/リアルタイム遷移が表示されるわけではありません。

### リアルタイム通話で音声がない

有効な音声モードが 1 つだけであることを確認します。`realtime.enabled` と `streaming.enabled` を同時に true にすることはできません。

リアルタイム Twilio 通話では、次も確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定、または登録済みプロバイダー名である。
- プロバイダー API キーが Gateway プロセスから利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始し、初期挨拶がキューに入ったことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
