---
read_when:
    - OpenClaw から音声通話を発信したい場合
    - 音声通話プラグインを設定または開発しています
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け付けます。オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-05-06T09:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice Call は Plugin を介して OpenClaw に音声通話を提供します。発信通知、
マルチターン会話、全二重リアルタイム音声、ストリーミング
文字起こし、allowlist ポリシー付きの着信通話をサポートします。

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

    現在の公式リリースタグに追従するには、素のパッケージを使用します。
    再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。

    その後、Plugin を読み込むために Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します (完全な形は下の
    [設定](#configuration) を参照してください)。少なくとも、
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な
    Webhook URL が必要です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    ```

    デフォルト出力はチャットログやターミナルで読みやすい形式です。Plugin の有効化、
    プロバイダー認証情報、Webhook の公開状態、そして音声モード
    (`streaming` または `realtime`) が 1 つだけ有効であることをチェックします。
    スクリプトでは `--json` を使用します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短い発信通知通話を実際に開始するには、
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
ループバックやプライベートネットワーク空間に解決される場合、キャリア Webhook を受信できない
プロバイダーを起動する代わりにセットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択されたプロバイダーの認証情報が不足している場合、
Gateway 起動時に不足キーを含むセットアップ未完了警告をログに出力し、
ランタイムの起動をスキップします。コマンド、RPC 呼び出し、エージェントツールは、
使用時に不足しているプロバイダー設定を正確に返します。

<Note>
Voice Call の認証情報は SecretRefs を受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は、標準の SecretRef サーフェス経由で解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
  <Accordion title="プロバイダー公開とセキュリティの注意">
    - Twilio、Telnyx、Plivo はすべて **公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx では、`skipSignatureVerification` が true でない限り `telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料枠では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` がループバック (ngrok ローカルエージェント) の場合にのみ、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok の無料枠 URL は変更されたり中間ページの挙動が追加されたりすることがあります。`publicUrl` がずれると Twilio 署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、未認証の開始前ソケットの合計数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの未認証の開始前ソケット数を制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの合計数 (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーの
    `streaming.*` OpenAI キーを使用している古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは当面、古い voice-call キーも受け付けますが、
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
同じ発信者からの繰り返し通話では会話メモリが保持されます。各キャリア通話を
新しいコンテキストで開始する必要がある場合は、`sessionScope: "per-call"` を設定します。
たとえば、受付、予約、IVR、または同じ電話番号が異なる会議を表す可能性がある
Google Meet ブリッジフローなどです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
音声をリアルタイム文字起こしプロバイダーに転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。通話ごとに
音声モードを 1 つ選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされているリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` 配下に置きます。
- Voice Call はデフォルトで共有 `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはこれを呼び出せます。
- `realtime.consultPolicy` は、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングのガイダンスを任意で追加します。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はセッションセットアップ時に、制限付きのエージェント ID、システムプロンプト上書き、選択されたワークスペースファイルカプセルをリアルタイムプロバイダーの指示に注入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス済みメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 内にそれらのスニペットをリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が true の場合にのみ、完全な consult エージェントへフォールバックします。
- `realtime.provider` が未登録プロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させるのではなく、警告をログに出力してリアルタイムメディアをスキップします。
- Consult セッションキーは、利用可能な場合は保存済み通話セッションを再利用し、その後、設定された `sessionScope` (`per-phone` がデフォルト、分離された通話では `per-call`) にフォールバックします。

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
| `auto`        | デフォルトプロンプトを維持し、consult ツールを呼び出すタイミングはプロバイダーに判断させます。              |
| `substantive` | 簡単な会話のつなぎは直接回答し、事実、メモリ、ツール、またはコンテキストの前に consult します。 |
| `always`      | すべての実質的な回答の前に consult します。                                                        |

### エージェント音声コンテキスト

通常のターンで完全なエージェント consult の往復を支払わずに、音声ブリッジを
設定済み OpenClaw エージェントのように聞こえさせたい場合は、`realtime.agentContext` を有効にします。
コンテキストカプセルはリアルタイムセッション作成時に一度だけ追加されるため、
ターンごとのレイテンシーは増えません。`openclaw_agent_consult` の呼び出しは引き続き
完全な OpenClaw エージェントを実行し、ツール作業、最新情報、メモリ検索、または
ワークスペース状態に使用する必要があります。

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

### リアルタイムプロバイダーの例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: API キーは `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得します。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore` です。
    `sessionResumption` と `contextWindowCompression` は、より長く、
    再接続可能な通話向けにデフォルトでオンになります。電話音声でより速いターンテイキングを調整するには、
    `silenceDurationMs`、`startSensitivity`、および
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

プロバイダー固有のリアルタイム音声オプションについては、[Google プロバイダー](/ja-JP/providers/google) と
[OpenAI プロバイダー](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、および xAI (`xai`)。それぞれのプロバイダープラグインによって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` の下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call はストリームを即座に登録し、プロバイダーが接続している間は受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備ができてから初回の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または登録済みプロバイダーがない場合、Voice Call はプラグイン全体を失敗させる代わりに警告をログに記録し、メディアストリーミングをスキップします。

### ストリーミングプロバイダーの例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: API キーは `streaming.providers.openai.apiKey` または
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
    デフォルト: API キーは `streaming.providers.xai.apiKey` または `XAI_API_KEY`、
    エンドポイントは `wss://api.x.ai/v1/stt`、エンコードは `mulaw`、サンプルレートは `8000`、
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

## 通話向け TTS

Voice Call は、通話上のストリーミング音声にコアの `messages.tts` 設定を使用します。
プラグイン設定の下で**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

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

- プラグイン設定内のレガシーな `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダーのネイティブ音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話用 TTS が利用できない場合、2 つの再生パスを混在させる代わりに再生リクエストは失敗します。
- 電話用 TTS がセカンダリプロバイダーにフォールバックする場合、Voice Call はデバッグ用にプロバイダーチェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio の割り込みまたはストリーム終了によって保留中の TTS キューがクリアされると、キュー内の再生リクエストは、発信者を再生完了待ちでハングさせる代わりに解決されます。

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
`inboundPolicy: "allowlist"` は信頼性の低い発信者 ID スクリーニングです。
プラグインはプロバイダーから提供された `From` 値を正規化し、
`allowFrom` と比較します。Webhook 検証はプロバイダーによる配信と
ペイロードの整合性を認証しますが、PSTN/VoIP の発信者番号の所有権を
**証明するものではありません**。`allowFrom` は強力な発信者 ID ではなく、
発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、および `responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call プラグインが複数の電話番号の通話を受け取り、
それぞれの番号を別の回線のように動作させたい場合は `numbers` を使用します。
たとえば、ある番号ではカジュアルな個人アシスタントを使用し、別の番号ではビジネス用ペルソナ、
異なる応答エージェント、異なる TTS 音声を使用できます。

ルートは、プロバイダーから提供されるダイヤル先の `To` 番号から選択されます。キーは
E.164 番号である必要があります。通話が到着すると、Voice Call は一致するルートを一度解決し、
一致したルートを通話レコードに保存し、その有効設定を挨拶、従来の自動応答パス、
リアルタイム相談パス、TTS 再生で再利用します。どのルートにも一致しない場合は、
グローバルな Voice Call 設定が使用されます。
発信通話は `numbers` を使用しません。通話開始時に発信先、メッセージ、
セッションを明示的に渡してください。

ルート上書きは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call `tts` 設定の上にディープマージされるため、
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

### 発話出力コントラクト

自動応答では、Voice Call はシステムプロンプトに厳密な発話出力コントラクトを追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に発話テキストを抽出します。

- 推論/エラーコンテンツとしてマークされたペイロードを無視します。
- 直接の JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画/メタ情報と思われる導入段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、
計画テキストが音声に漏れることを防ぎます。

### 会話開始時の動作

発信の `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付けられます。

- 割り込みキューのクリアと自動応答は、初回の挨拶が実際に発話中の場合にのみ抑制されます。
- 初回再生が失敗した場合、通話は `listening` に戻り、初回メッセージは再試行用にキューに残ります。
- Twilio ストリーミングの初回再生は、ストリーム接続時に追加遅延なしで開始されます。
- 割り込みはアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム自体の開始ターンを使用します。Voice Call はその初回メッセージに対してレガシーな `<Say>` TwiML 更新を投稿**しない**ため、発信の `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に
**2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話がスタックするのを防ぐため通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受け取らない通話（たとえば、完了しない通知モードの通話）を終了するには、
`staleCallReaperSeconds` を使用します。デフォルトは `0`（無効）です。

推奨範囲:

- **本番環境:** notify スタイルのフローでは `120`〜`300` 秒。
- 通常の呼び出しが完了できるよう、この値は **`maxDurationSeconds` より大きく**してください。開始値としては `maxDurationSeconds + 30〜60` 秒が適しています。

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

プロキシまたはトンネルが Gateway の前段にある場合、Plugin は署名検証のために公開 URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リストに追加します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストに一致する場合のみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護**は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio の会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古い、またはリプレイされた音声コールバックで新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーが要求する署名ヘッダーがない場合、ボディ読み取りの前に拒否されます。
- voice-call Webhook は、共有の事前認証ボディプロファイル（64 KB / 5 秒）に加えて、署名検証前に IP ごとの処理中上限を使用します。

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

## コマンドライン

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは Gateway が所有する voice-call ランタイムに委譲するため、コマンドラインは 2 つ目の Webhook サーバーをバインドしません。到達可能な Gateway がない場合、コマンドはスタンドアロンのコマンドラインランタイムにフォールバックします。

`latency` は既定の voice-call ストレージパスから `calls.jsonl` を読み取ります。別のログを指定するには `--file <path>` を使用し、分析を直近 N 件のレコード（既定 200）に制限するには `--last <n>` を使用します。出力には、ターンレイテンシと待ち受け時間の p50/p90/p99 が含まれます。

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

このリポジトリには、対応する skill ドキュメントが `skills/voice-call/SKILL.md` として含まれています。

## Gateway RPC

| メソッド             | 引数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。notify モードの呼び出しで接続後の数字入力が必要な場合は、呼び出しの作成後に `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップが Webhook 公開に失敗する

Gateway を実行する環境と同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が成功状態である必要があります。設定済みの `publicUrl` でも、ローカルまたはプライベートネットワーク空間を指している場合は失敗します。通信キャリアがそれらのアドレスへコールバックできないためです。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` は使用しないでください。

Twilio の notify モードの発信呼び出しは、最初の `<Say>` TwiML を create-call リクエストで直接送信するため、最初の読み上げメッセージは Twilio が Webhook TwiML を取得することに依存しません。ただし、ステータスコールバック、会話呼び出し、接続前 DTMF、リアルタイムストリーム、接続後の呼び出し制御には、公開 Webhook が引き続き必要です。

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

設定を変更した後、Gateway を再起動またはリロードし、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー認証情報が失敗する

選択されたプロバイダーと必要な認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、`fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`。

認証情報は Gateway ホスト上に存在している必要があります。ローカルシェルプロファイルを編集しても、すでに実行中の Gateway が再起動または環境をリロードするまでは影響しません。

### 呼び出しは開始するが、プロバイダー Webhook が到着しない

プロバイダーコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次に、ランタイム状態を確認します。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の起動後にトンネル URL が変わった。
- プロキシがリクエストを転送しているが、ホスト/プロトヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS により、公開ホスト名が Gateway 以外にルーティングされている。
- Voice Call Plugin が有効でない状態で Gateway が再起動された。

リバースプロキシまたはトンネルが Gateway の前段にある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスには `webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を自分で制御している場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、OpenClaw が受信リクエストから再構築する公開 URL に対して確認されます。署名が失敗する場合:

- プロバイダー Webhook URL が `publicUrl` と完全に一致していることを確認します。スキーム、ホスト、パスを含めます。
- ngrok の無料枠 URL では、トンネルのホスト名が変わったら `publicUrl` を更新します。
- プロキシが元のホストヘッダーとプロトヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外で `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加が失敗する

Google Meet は Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を確認します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に、Google Meet トランスポートを明示的に確認します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が成功状態でも Meet 参加者がまったく参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認します。電話呼び出し自体は正常でも、会議が不正な DTMF シーケンスを拒否または無視することがあります。

Google Meet は、接続前 DTMF シーケンス付きの `voicecall.start` を通じて Twilio の電話側を開始します。PIN 由来のシーケンスには、先頭の Twilio 待機数字として Google Meet Plugin の `voiceCall.dtmfDelayMs` が含まれます。Meet のダイヤルインプロンプトが遅れて到着する場合があるため、既定値は 12 秒です。その後、Voice Call は導入あいさつが要求される前にリアルタイム処理へリダイレクトします。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet 参加では、次の順序でログが出力されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio 初期 TwiML がリアルタイム処理の前に消費され、提供される。
- Voice Call が Twilio 呼び出し用のリアルタイム TwiML を提供する。
- Google Meet が DTMF 後の遅延後に `voicecall.speak` で導入音声を要求する。

`openclaw voicecall tail` には永続化された呼び出しレコードが引き続き表示されます。呼び出し状態と文字起こしには便利ですが、すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム呼び出しで音声がない

音声モードが 1 つだけ有効であることを確認します。`realtime.enabled` と `streaming.enabled` を同時に true にすることはできません。

リアルタイム Twilio 呼び出しでは、次も確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定であるか、登録済みプロバイダー名を指定している。
- プロバイダー API キーが Gateway プロセスから利用できる。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始され、最初のあいさつがキューに入ったことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
