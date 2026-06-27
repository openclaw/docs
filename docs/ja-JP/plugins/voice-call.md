---
read_when:
    - OpenClaw から発信音声通話をかけたい
    - voice-call Pluginを設定または開発している
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で音声通話を発信および着信し、オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-06-27T12:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin 経由で OpenClaw に音声通話を追加します。アウトバウンド通知、
複数ターンの会話、全二重のリアルタイム音声、ストリーミング
文字起こし、allowlist ポリシー付きのインバウンド通話をサポートします。

**現在のプロバイダー:** `twilio` (Programmable Voice + Media Streams)、
`telnyx` (Call Control v2)、`plivo` (Voice API + XML transfer + GetInput
speech)、`mock` (開発用/ネットワークなし)。

<Note>
Voice Call Plugin は **Gateway プロセス内**で実行されます。リモート
Gateway を使用する場合は、Gateway を実行しているマシンに Plugin をインストールして設定し、
その後 Gateway を再起動して読み込ませます。
</Note>

## クイックスタート

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    現在の公式リリースタグに追従するには、bare package を使用します。
    再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。

    その後、Plugin を読み込むために Gateway を再起動します。

  </Step>
  <Step title="Configure provider and webhook">
    `plugins.entries.voice-call.config` 配下に設定します（完全な形は下の
    [設定](#configuration) を参照）。最低限必要なのは、
    `provider`、プロバイダー認証情報、`fromNumber`、公開到達可能な
    Webhook URL です。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    既定の出力はチャットログとターミナルで読みやすい形式です。Plugin の有効化、
    プロバイダー認証情報、Webhook の公開状態、そして有効な音声モード
    (`streaming` または `realtime`) が 1 つだけであることを確認します。
    スクリプトでは `--json` を使用します。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらも既定ではドライランです。短いアウトバウンド通知通話を実際に発信するには、
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve fallback が
loopback やプライベートネットワーク空間に解決される場合、キャリア Webhook を受信できない
プロバイダーを開始する代わりにセットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択されたプロバイダーの認証情報が不足している場合、
Gateway 起動時に不足しているキーを含む setup-incomplete 警告をログに出力し、
ランタイムの開始をスキップします。Commands、RPC 呼び出し、agent tools は、
使用時に不足しているプロバイダー設定をそのまま返します。

<Note>
Voice-call 認証情報は SecretRefs を受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef surface を通じて解決されます。[SecretRef credential surface](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider exposure and security notes">
    - Twilio、Telnyx、Plivo はいずれも **公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです（ネットワーク呼び出しなし）。
    - `skipSignatureVerification` が true でない限り、Telnyx には `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok free tier では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrok ローカルエージェント）の場合に**のみ**、無効な署名を持つ Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok free-tier URL は変更されたり、インタースティシャル動作が追加されたりすることがあります。`publicUrl` がずれると、Twilio 署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、未認証の開始前ソケットの総数を制限します。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの未認証の開始前ソケット数を制限します。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの総数（保留中 + アクティブ）を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーな
    `streaming.*` OpenAI キーを使用する古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは当面、古い音声通話キーも引き続き受け入れますが、
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

## セッションスコープ

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使用するため、
同じ発信者からの繰り返し通話では会話メモリが維持されます。各キャリア通話で
新しいコンテキストを開始する必要がある場合、たとえば受付、予約、IVR、または
同じ電話番号が異なる会議を表す可能性がある Google Meet ブリッジフローでは、
`sessionScope: "per-call"` を設定します。

Voice Call は、生成されたセッションキーを設定済みのエージェント名前空間
（`agent:<agentId>:voice:*`）に保存するため、再起動後に Gateway のセッションキー
正規化が行われても通話メモリは維持されます。明示的な生の連携キーも同じ
エージェント名前空間を使用します。正規の `agent:<configuredAgentId>:*` キーは
その所有者を保持し、そのメインエイリアスはコアの `session.mainKey` とグローバルスコープに従います。
外部または不正な形式の `agent:*` 入力は、設定済みエージェント配下の不透明なキーとしてスコープされます。
`global` と `unknown` はグローバルなセンチネルのままです。Gateway 起動時には、
パスから単一の所有者が証明できるデフォルトストアまたは `{agentId}` テンプレートのストア内にある
古い生キーが昇格されます。固定のカスタムストアでは、曖昧なレガシー行は
所有者を選択するための十分な情報を含まないため変更されません。新しい通話は
正規のエージェントスコープ履歴を使用します。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
これは `streaming` とは別のもので、`streaming` は音声を
リアルタイム文字起こしプロバイダーへ転送するだけです。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。通話ごとに
1 つの音声モードを選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされたリアルタイム音声プロバイダー: Google Gemini Live（`google`）と OpenAI（`openai`）。これらは各プロバイダーPluginによって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` 配下にあります。
- Voice Call は、共有 `openclaw_agent_consult` リアルタイムツールをデフォルトで公開します。発信者がより深い推論、現在の情報、または通常の OpenClaw ツールを求めた場合、リアルタイムモデルはこれを呼び出せます。
- `realtime.consultPolicy` は、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングについて、任意でガイダンスを追加します。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はセッションセットアップ時に、制限付きのエージェント ID と選択されたワークスペースファイルカプセルをリアルタイムプロバイダーの指示へ注入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス化済みメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にそれらのスニペットをリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が true の場合にのみ、完全な consult エージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログに記録し、リアルタイムメディアをスキップします。
- Consult セッションキーは、利用可能な場合は保存済みの通話セッションを再利用し、その後は設定済みの `sessionScope`（デフォルトは `per-phone`、分離された通話では `per-call`）へフォールバックします。

### ツールポリシー

`realtime.toolPolicy` は consult 実行を制御します。

| ポリシー         | 動作                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                                      |
| `none`           | consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                               |

`realtime.consultPolicy` はリアルタイムモデルの指示のみを制御します。

| ポリシー      | ガイダンス                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | デフォルトプロンプトを維持し、consult ツールをいつ呼び出すかの判断をプロバイダーに任せます。              |
| `substantive` | 簡単な会話のつなぎは直接回答し、事実、メモリ、ツール、またはコンテキストの前に consult します。 |
| `always`      | すべての実質的な回答の前に consult します。                                                        |

### エージェント音声コンテキスト

通常のターンでエージェントへの完全なコンサルト往復を発生させずに、音声ブリッジを
設定済みの OpenClaw エージェントのように聞こえさせたい場合は、`realtime.agentContext`
を有効にします。コンテキストカプセルはリアルタイムセッションの作成時に一度だけ追加されるため、
ターンごとのレイテンシは増えません。`openclaw_agent_consult` の呼び出しは引き続き完全な
OpenClaw エージェントを実行し、ツール作業、現在の情報、メモリ検索、ワークスペース状態に使用する必要があります。

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
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得されます。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore` です。
    より長く、再接続可能な通話のために、`sessionResumption` と
    `contextWindowCompression` はデフォルトでオンです。電話音声でより速いターンテイキングを調整するには、
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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
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

`streaming` は、ライブ通話音声のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受け付け済みストリームの `start` メッセージを送信した後、Voice Call はただちにストリームを登録し、プロバイダーの接続中は受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備ができてから最初の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログに記録し、メディアストリーミングをスキップします。

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

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。
Plugin 設定配下で**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

- Plugin 設定内のレガシーな `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダーのネイティブ音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話用 TTS が利用できない場合、再生リクエストは 2 つの再生経路を混在させる代わりに失敗します。
- 電話用 TTS がセカンダリプロバイダーにフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio の割り込みまたはストリーム終了によって保留中の TTS キューがクリアされると、キュー内の再生リクエストは、再生完了を待つ発信者を待機させたままにせず解決されます。

### TTS の例

<Tabs>
  <Tab title="コア TTS のみ">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs に上書き (通話のみ)">
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="OpenAI モデルの上書き (ディープマージ)">
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` は保証度の低い発信者 ID スクリーニングです。
Plugin はプロバイダーから提供された `From` 値を正規化し、それを
`allowFrom` と比較します。Webhook 検証はプロバイダーからの配信と
ペイロードの完全性を認証しますが、PSTN/VoIP 発信者番号の所有権を**証明するものではありません**。
`allowFrom` は強い発信者 ID ではなく、発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号の通話を受け取り、各番号を異なる回線のように動作させたい場合は
`numbers` を使用します。たとえば、ある番号ではカジュアルな個人アシスタントを使用し、
別の番号ではビジネス用のペルソナ、別の応答エージェント、別の TTS 音声を使用できます。

ルートは、プロバイダーから提供されたダイヤル先 `To` 番号から選択されます。キーは
E.164 番号である必要があります。通話が到着すると、Voice Call は一致するルートを一度だけ解決し、
一致したルートを通話レコードに保存し、その有効な設定を挨拶、従来の自動応答パス、
リアルタイムコンサルトパス、TTS 再生に再利用します。一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用されません。通話を開始するときに、発信先、メッセージ、セッションを明示的に渡してください。

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
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### 音声出力契約

自動応答では、Voice Call はシステムプロンプトに厳格な音声出力契約を追加します。

```text
{"spoken":"..."}
```

Voice Call は音声テキストを防御的に抽出します。

- 推論/エラーコンテンツとしてマークされたペイロードを無視します。
- 直接の JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画/メタ情報と思われる導入段落を削除します。

これにより、音声再生を発信者向けテキストに集中させ、計画テキストが音声に漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージの処理はライブ再生状態に結び付いています。

- 割り込みによるキュークリアと自動応答は、最初の挨拶が実際に発話中の場合にのみ抑制されます。
- 最初の再生が失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio ストリーミングの最初の再生は、ストリーム接続時に追加の遅延なしで開始されます。
- 割り込みはアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム自身の開始ターンを使用します。Voice Call はその最初のメッセージに対してレガシーな `<Say>` TwiML 更新を投稿**しない**ため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を
自動終了する前に **2000 ms** 待機します。

- その期間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が停止したままになるのを防ぐため、通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受信しない通話を終了するには、`staleCallReaperSeconds`
を使用します（たとえば、完了しない通知モードの通話）。デフォルトは
`0`（無効）です。

推奨範囲:

- **本番:** 通知スタイルのフローでは `120`〜`300` 秒。
- 通常の通話が完了できるように、この値は **`maxDurationSeconds` より大きく**してください。開始値としては `maxDurationSeconds + 30–60` 秒が適しています。

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

Gateway の前段にプロキシまたはトンネルがある場合、Plugin は
署名検証用の公開 URL を再構築します。これらのオプションは、
どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リスト化します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護**は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio の会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古い、またはリプレイされた音声コールバックが新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーの必須署名ヘッダーが欠落している場合、本文の読み取り前に拒否されます。
- voice-call Webhook は、共有の事前認証本文プロファイル（64 KB / 5 秒）に加え、署名検証前の IP ごとの処理中上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは
Gateway が所有する voice-call ランタイムへ委譲されるため、CLI が 2 つ目の
Webhook サーバーをバインドすることはありません。到達可能な Gateway がない場合、
コマンドはスタンドアロンの CLI ランタイムへフォールバックします。

`latency` はデフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使用し、解析対象を最後の N レコード
（デフォルト 200）に制限するには `--last <n>` を使用します。出力には、ターンレイテンシと
リッスン待機時間の p50/p90/p99 が含まれます。

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

voice-call Plugin には、対応するエージェント Skills が同梱されています。

## Gateway RPC

| メソッド             | 引数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` の場合にのみ有効です。通知モードの通話で
接続後の数字入力が必要な場合は、通話が存在した後に `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップで Webhook 公開に失敗する

Gateway を実行するのと同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が緑である必要があります。
設定済みの `publicUrl` でも、それがローカルまたはプライベートネットワーク空間を指している場合は失敗します。
通信キャリアはそれらのアドレスへコールバックできないためです。`publicUrl` として
`localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、または `fd00::/8` を使用しないでください。

Twilio の通知モードの発信通話は、最初の `<Say>` TwiML を
create-call リクエスト内で直接送信するため、最初に話されるメッセージは Twilio が
Webhook TwiML を取得することに依存しません。ただし、ステータスコールバック、
会話通話、接続前 DTMF、リアルタイムストリーム、接続後の通話制御には公開 Webhook が引き続き必要です。

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

設定を変更した後、Gateway を再起動または再読み込みしてから、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー資格情報が失敗する

選択されたプロバイダーと必須の資格情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、および
  `fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、および `fromNumber`。

資格情報は Gateway ホスト上に存在する必要があります。ローカルのシェルプロファイルを編集しても、
すでに実行中の Gateway には、再起動または環境の再読み込みまで反映されません。

### 通話は開始するがプロバイダー Webhook が届かない

プロバイダーコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次に、ランタイム状態を調べます。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の起動後にトンネル URL が変更された。
- プロキシがリクエストを転送しているが、ホストまたは proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS が公開ホスト名を Gateway 以外の場所へルーティングしている。
- Voice Call Plugin が有効でない状態で Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、
`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスには
`webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、
プロキシ境界が自分の管理下にある場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、受信リクエストから OpenClaw が再構築した公開 URL に対して検証されます。
署名が失敗する場合:

- プロバイダー Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致することを確認します。
- ngrok の無料枠 URL では、トンネルホスト名が変更されたときに `publicUrl` を更新します。
- プロキシが元のホストおよび proto ヘッダーを保持していることを確認するか、
  `webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外では `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加に失敗する

Google Meet は Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を検証します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に、Google Meet トランスポートを明示的に検証します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が緑でも Meet 参加者が参加しない場合は、Meet の
ダイヤルイン番号、PIN、`--dtmf-sequence` を確認してください。通話自体は正常でも、
会議が誤った DTMF シーケンスを拒否または無視することがあります。

Google Meet は `voicecall.start` を通じて、接続前 DTMF シーケンス付きで
Twilio の電話レッグを開始します。PIN から派生したシーケンスには、先頭の Twilio 待機数字として
Google Meet Plugin の `voiceCall.dtmfDelayMs` が含まれます。デフォルトは 12 秒です。
Meet のダイヤルインプロンプトが遅れて到着することがあるためです。その後、Voice Call は
イントロ挨拶が要求される前にリアルタイム処理へリダイレクトします。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet
参加では、次の順序がログに記録されます。

- Google Meet が Twilio 参加を Voice Call へ委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が消費され、リアルタイム処理の前に提供される。
- Voice Call が Twilio 通話向けのリアルタイム TwiML を提供する。
- Google Meet が DTMF 後の遅延の後に `voicecall.speak` でイントロ音声を要求する。

`openclaw voicecall tail` は引き続き永続化された通話レコードを表示します。通話状態と
文字起こしには役立ちますが、すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

有効な音声モードが 1 つだけであることを確認します。`realtime.enabled` と
`streaming.enabled` は同時に true にできません。

リアルタイム Twilio 通話では、次も確認してください。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定であるか、登録済みプロバイダー名を指定している。
- プロバイダー API キーが Gateway プロセスで利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが
  開始され、初期挨拶がキューに入ったことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
