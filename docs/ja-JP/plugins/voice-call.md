---
read_when:
    - OpenClaw から音声通話を発信したい場合
    - voice-call Pluginを設定または開発しています
    - 電話でリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け付けます。オプションでリアルタイム音声とストリーミング文字起こしにも対応します
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-05-06T05:15:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc608883e8f36cdd2075c3a8c7ab002d89d0616e119f488437bd18c995f066f9
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw 用の音声通話を Plugin 経由で提供します。アウトバウンド通知、
マルチターン会話、全二重リアルタイム音声、ストリーミング
文字起こし、許可リストポリシー付きのインバウンド通話に対応します。

**現在のプロバイダー:** `twilio` (Programmable Voice + Media Streams)、
`telnyx` (Call Control v2)、`plivo` (Voice API + XML transfer + GetInput
speech)、`mock` (開発用/ネットワークなし)。

<Note>
Voice Call Plugin は **Gateway プロセス内**で実行されます。リモート
Gateway を使う場合は、Gateway を実行しているマシンに Plugin をインストールして設定し、
その後 Gateway を再起動して読み込ませます。
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

    現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能な
    インストールが必要な場合にのみ、正確なバージョンを固定してください。

    その後、Plugin を読み込ませるために Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します (全体の形式は下の
    [設定](#configuration) を参照)。最低限必要なのは、
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な
    Webhook URL です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    ```

    デフォルト出力はチャットログとターミナルで読みやすい形式です。
    Plugin の有効化、プロバイダー認証情報、Webhook の公開状態、
    有効な音声モード (`streaming` または `realtime`) が 1 つだけであることを確認します。
    スクリプトでは `--json` を使用します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。実際に短いアウトバウンド通知通話を
    発信するには `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
local loopback やプライベートネットワーク空間に解決される場合、キャリア Webhook を受信できない
プロバイダーを起動する代わりに、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` で、選択されたプロバイダーに認証情報がない場合、
Gateway 起動時に不足しているキーを含むセットアップ未完了警告をログに出力し、
ランタイムの起動をスキップします。コマンド、RPC 呼び出し、エージェントツールは、
使用時に不足しているプロバイダー設定を正確に返します。

<Note>
音声通話の認証情報は SecretRefs に対応しています。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef サーフェス経由で解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
  <Accordion title="プロバイダー公開とセキュリティに関するメモ">
    - Twilio、Telnyx、Plivo はすべて、**公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx は、`skipSignatureVerification` が true でない限り、`telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) を必要とします。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料枠では、`publicUrl` を正確な ngrok URL に設定します。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が local loopback (ngrok ローカルエージェント) の場合に**のみ**、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok の無料枠 URL は変更されたり、中間ページの動作が追加されたりすることがあります。`publicUrl` がずれると Twilio 署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、未認証の開始前ソケットの総数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの未認証の開始前ソケットを制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの総数 (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーの
    `streaming.*` OpenAI キーを使用する古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは、今のところ古い音声通話キーを引き続き受け入れますが、
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

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使用するため、
同じ発信者からの繰り返し通話では会話メモリが維持されます。各キャリア通話で
新しいコンテキストから開始する必要がある場合は、`sessionScope: "per-call"` を設定します。
たとえば、受付、予約、IVR、または同じ電話番号が異なる会議を表す可能性のある
Google Meet ブリッジフローなどです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
これは、音声をリアルタイム文字起こしプロバイダーへ転送するだけの
`streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。通話ごとに
音声モードを 1 つ選んでください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされるリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` 配下にあります。
- Voice Call は、共有の `openclaw_agent_consult` リアルタイムツールをデフォルトで公開します。発信者がより深い推論、現在の情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはこれを呼び出せます。
- `realtime.consultPolicy` は、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングのガイダンスを任意で追加します。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call は、境界付けられたエージェント ID、システムプロンプトのオーバーライド、選択されたワークスペースファイルカプセルを、セッションセットアップ時にリアルタイムプロバイダーの指示へ注入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス済みメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にそれらのスニペットをリアルタイムモデルへ返します。`realtime.fastContext.fallbackToConsult` が true の場合にのみ、完全な consult エージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は警告をログに出力し、Plugin 全体を失敗させるのではなくリアルタイムメディアをスキップします。
- consult セッションキーは、利用可能な場合は保存済みの通話セッションを再利用し、その後、設定された `sessionScope` (`per-phone` がデフォルト、分離された通話では `per-call`) にフォールバックします。

### ツールポリシー

`realtime.toolPolicy` は consult 実行を制御します。

| ポリシー           | 動作                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                                      |
| `none`           | consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                               |

`realtime.consultPolicy` はリアルタイムモデルの指示のみを制御します。

| ポリシー        | ガイダンス                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | デフォルトプロンプトを維持し、consult ツールをいつ呼び出すかはプロバイダーに判断させます。              |
| `substantive` | 単純な会話のつなぎは直接回答し、事実、メモリ、ツール、コンテキストの前に consult します。 |
| `always`      | すべての実質的な回答の前に consult します。                                                        |

### エージェント音声コンテキスト

音声ブリッジが、通常のターンでエージェント consult の往復コストを払わずに、
設定済みの OpenClaw エージェントのように聞こえるべき場合は、`realtime.agentContext` を有効にします。
コンテキストカプセルはリアルタイムセッションの作成時に一度だけ追加されるため、
ターンごとのレイテンシは増えません。
`openclaw_agent_consult` の呼び出しは引き続き完全な OpenClaw エージェントを実行するため、
ツール作業、現在の情報、メモリ検索、ワークスペース状態に使用してください。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### リアルタイム provider の例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: APIキーは `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得されます。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore` です。
    長く再接続可能な通話では、`sessionResumption` と `contextWindowCompression` がデフォルトで有効です。電話音声でより速いターンテイキングを調整するには、`silenceDurationMs`、`startSensitivity`、および
    `endSensitivity` を使用します。

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
                consultPolicy: "substantive",
                agentContext: { enabled: true },
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

provider 固有のリアルタイム音声オプションについては、[Google provider](/ja-JP/providers/google) と
[OpenAI provider](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` はライブ通話音声用のリアルタイム文字起こし provider を選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こし provider を使用します。
- 同梱されているリアルタイム文字起こし provider: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれの provider Plugin によって登録されます。
- provider 所有の raw 設定は `streaming.providers.<providerId>` の下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call は即座にストリームを登録し、provider が接続している間は受信メディアを文字起こし provider にキューし、リアルタイム文字起こしの準備ができてから最初の挨拶を開始します。
- `streaming.provider` が未登録の provider を指している場合、または登録済み provider がない場合、Voice Call は警告をログに記録し、Plugin 全体を失敗させる代わりにメディアストリーミングをスキップします。

### ストリーミング provider の例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: APIキーは `streaming.providers.openai.apiKey` または
    `OPENAI_API_KEY`、モデルは `gpt-4o-transcribe`、`silenceDurationMs: 800`、
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
    デフォルト: APIキーは `streaming.providers.xai.apiKey` または `XAI_API_KEY`、
    エンドポイントは `wss://api.x.ai/v1/stt`、エンコーディングは `mulaw`、サンプルレートは `8000`、
    `endpointingMs: 800`、`interimResults: true` です。

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

Voice Call は通話でのストリーミング音声に、コアの `messages.tts` 設定を使用します。Plugin 設定の下で
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
現在の Microsoft transport は電話用 PCM 出力を公開していません。
</Warning>

動作メモ:

- Plugin 設定内のレガシーな `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミットされる設定では `tts.providers.<provider>` を使用する必要があります。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話は provider ネイティブの音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話用 TTS が利用できない場合、再生リクエストは 2 つの再生パスを混在させる代わりに失敗します。
- 電話用 TTS がセカンダリ provider にフォールバックすると、Voice Call はデバッグ用に provider チェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio の割り込みまたはストリームの終了によって保留中の TTS キューがクリアされると、キューされた再生リクエストは、発信者を再生完了待ちでハングさせる代わりに解決されます。

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
`inboundPolicy: "allowlist"` は保証の低い発信者IDスクリーニングです。
Plugin は provider から提供された `From` 値を正規化し、
`allowFrom` と比較します。Webhook 検証は provider による配信と
ペイロードの完全性を認証しますが、PSTN/VoIP の発信者番号の
所有を**証明するものではありません**。`allowFrom` は強力な発信者
ID ではなく、発信者IDフィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号への通話を受け取り、各番号を別々の回線のように動作させる必要がある場合は、`numbers` を使用します。たとえば、ある番号ではカジュアルな個人アシスタントを使用し、別の番号ではビジネス用のペルソナ、別の応答エージェント、別の TTS 音声を使用できます。

ルートは provider から提供された発信先の `To` 番号から選択されます。キーは
E.164 番号である必要があります。通話が到着すると、Voice Call は一致するルートを一度だけ解決し、
一致したルートを通話レコードに保存し、その有効な設定を挨拶、クラシックな自動応答パス、リアルタイム consult パス、TTS
再生に再利用します。一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用されません。通話開始時に発信先、メッセージ、セッションを明示的に渡してください。

ルート上書きは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call の `tts` 設定にディープマージされるため、
通常は provider 音声だけを上書きできます。

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

### 発話出力契約

自動応答では、Voice Call は厳格な発話出力契約をシステムプロンプトに追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に発話テキストを抽出します。

- reasoning/error コンテンツとしてマークされたペイロードを無視します。
- 直接の JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報と思われる冒頭段落を削除します。

これにより、発話再生を発信者向けテキストに集中させ、計画テキストが音声に漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージの処理はライブ再生状態に結び付いています。

- 割り込み時のキュークリアと自動応答は、最初の挨拶が実際に発話中の間だけ抑制されます。
- 最初の再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューされたままになります。
- Twilio ストリーミングでの最初の再生は、ストリーム接続時に追加遅延なしで開始されます。
- 割り込みはアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話では、リアルタイムストリーム自身の冒頭ターンを使用します。Voice Call はその最初のメッセージに対してレガシーな `<Say>` TwiML 更新を投稿しないため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続した場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が停止したままになるのを防ぐため、通話は終了されます。

## 古い通話の reaper

終端 Webhook を受信しない通話（たとえば、完了しない notify-mode 通話）を終了するには、`staleCallReaperSeconds` を使用します。デフォルトは `0`（無効）です。

推奨範囲:

- **本番:** 通知スタイルのフローでは `120`〜`300` 秒。
- 通常の呼び出しが完了できるように、この値は **`maxDurationSeconds` より大きく** してください。開始点としては `maxDurationSeconds + 30–60` 秒が適切です。

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

プロキシまたはトンネルが Gateway の前段にある場合、この Plugin は
署名検証用の公開 URL を再構築します。これらのオプションは、
どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リストに登録します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護** は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio の会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古い、またはリプレイされた音声コールバックが新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーが要求する署名ヘッダーがない場合、本文の読み取り前に拒否されます。
- voice-call Webhook は、共有の認証前本文プロファイル（64 KB / 5 秒）に加えて、署名検証前の IP ごとの処理中上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは
Gateway が所有する voice-call ランタイムに委譲されるため、CLI が 2 つ目の
Webhook サーバーをバインドすることはありません。到達可能な Gateway がない場合、
コマンドはスタンドアロンの CLI ランタイムにフォールバックします。

`latency` は、デフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使い、分析対象を直近 N 件のレコード（デフォルト 200）に制限するには `--last <n>` を使います。出力には、ターン遅延と待ち受け時間の
p50/p90/p99 が含まれます。

## エージェントツール

ツール名: `voice_call`。

| アクション      | 引数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

このリポジトリには、対応する Skills ドキュメントが `skills/voice-call/SKILL.md` に同梱されています。

## Gateway RPC

| メソッド             | 引数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。通知モードの通話で
接続後の数字入力が必要な場合は、通話が存在するようになってから `voicecall.dtmf` を使ってください。

## トラブルシューティング

### セットアップで Webhook 公開に失敗する

Gateway を実行している環境と同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` がグリーンである必要があります。
設定済みの `publicUrl` でも、ローカルまたはプライベートネットワーク空間を指している場合は失敗します。キャリアはそれらのアドレスにコールバックできないためです。
`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、または `fd00::/8` を使用しないでください。

Twilio の通知モードの発信通話は、最初の `<Say>` TwiML を通話作成リクエストで直接送信するため、
最初に読み上げられるメッセージは Twilio が Webhook TwiML を取得することに依存しません。
公開 Webhook は、ステータスコールバック、会話通話、接続前 DTMF、リアルタイムストリーム、
および接続後の通話制御には引き続き必要です。

公開用の経路を 1 つ使用します。

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

設定を変更した後、Gateway を再起動またはリロードしてから、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー認証情報が失敗する

選択したプロバイダーと必要な認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、および
  `fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、および `fromNumber`。

認証情報は Gateway ホスト上に存在する必要があります。ローカルシェルプロファイルを編集しても、
すでに実行中の Gateway には、再起動または環境のリロードが行われるまで影響しません。

### 通話は開始するがプロバイダー Webhook が届かない

プロバイダーコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次にランタイム状態を調べます。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の起動後にトンネル URL が変更された。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS により、公開ホスト名が Gateway 以外の場所にルーティングされている。
- Voice Call Plugin を有効にせずに Gateway が再起動された。

リバースプロキシまたはトンネルが Gateway の前段にある場合は、
`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスには
`webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、
プロキシ境界が自分の管理下にある場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、OpenClaw が受信リクエストから再構築した公開 URL に対して検証されます。
署名が失敗する場合:

- プロバイダーの Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致していることを確認します。
- ngrok の無料枠 URL では、トンネルのホスト名が変わったときに `publicUrl` を更新します。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、
  `webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外では `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加に失敗する

Google Meet は Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を確認します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に Google Meet トランスポートを明示的に確認します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call がグリーンでも Meet 参加者が参加しない場合は、Meet の
ダイヤルイン番号、PIN、`--dtmf-sequence` を確認します。通話自体は正常でも、
会議が不正な DTMF シーケンスを拒否または無視することがあります。

Google Meet は Meet の DTMF シーケンスと導入テキストを `voicecall.start` に渡します。
Twilio 通話では、Voice Call はまず DTMF TwiML を提供し、Webhook にリダイレクトしてから、
リアルタイムメディアストリームを開きます。これにより、電話参加者が会議に参加した後に
保存済みの導入が生成されます。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet
参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML がリアルタイム処理の前に消費され、提供される。
- Voice Call が Twilio 通話のリアルタイム TwiML を提供する。
- 初期挨拶がキューに入った状態でリアルタイムブリッジが開始される。

`openclaw voicecall tail` は永続化された通話レコードを引き続き表示します。通話状態や文字起こしには有用ですが、
すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

有効になっている音声モードが 1 つだけであることを確認します。`realtime.enabled` と
`streaming.enabled` の両方を true にすることはできません。

リアルタイム Twilio 通話では、次も確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定であるか、登録済みプロバイダーを指している。
- プロバイダー API キーが Gateway プロセスで利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML の提供、リアルタイムブリッジの開始、
  初期挨拶のキュー投入が表示されている。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
