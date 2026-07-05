---
read_when:
    - OpenClawから発信音声通話をかけたい
    - 音声通話Pluginを設定または開発している
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要です
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信通話を行い、着信通話を受け付けます。任意でリアルタイム音声とストリーミング文字起こしにも対応します
title: 音声通話 Plugin
x-i18n:
    generated_at: "2026-07-05T11:41:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6691a5764bd537a3782a2236e3f5744d411576c0f864b20a01f12096d8f7068
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin 経由で OpenClaw の音声通話を利用できます。アウトバウンド通知、複数ターンの
会話、全二重リアルタイム音声、ストリーミング文字起こし、
許可リストポリシー付きのインバウンド通話に対応します。

**プロバイダー:** `mock` (開発用、ネットワークなし)、`plivo` (Voice API + XML transfer +
GetInput speech)、`telnyx` (Call Control v2)、`twilio` (Programmable Voice +
Media Streams)。

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
      <Tab title="ローカルフォルダーから (開発用)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    現在のリリースタグに追従するには、素のパッケージを使います。再現可能な
    インストールが必要な場合だけ、正確なバージョンに固定してください。その後、
    Plugin が読み込まれるように Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します (下の
    [設定](#configuration) を参照)。最低限必要なのは、`provider`、プロバイダー
    認証情報、`fromNumber`、公開到達可能な Webhook URL です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Plugin の有効化、プロバイダー認証情報、Webhook の公開状態、
    そして音声モード (`streaming` または `realtime`) が 1 つだけ有効であることを確認します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短いアウトバウンド通知通話を発信するには
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
loopback やプライベートネットワーク空間に解決される場合、キャリア Webhook を受信できない
プロバイダーを起動するのではなく、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` でも、選択されたプロバイダーの認証情報が不足している場合、Gateway
の起動ログには不足キーを含むセットアップ未完了の警告が出力され、ランタイムの起動は
スキップされます。コマンド、RPC 呼び出し、エージェントツールは、使用時に
不足している設定を正確に返します。

<Note>
Voice-call 認証情報は SecretRef を受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef サーフェスを通じて解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### 設定リファレンス

上に示していない `plugins.entries.voice-call.config` 配下のトップレベルキー:

| キー                            | デフォルト | 注記                                                                                       |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `enabled`                       | `false`    | マスターオン/オフスイッチ。                                                                |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。[インバウンド通話](#inbound-calls) を参照。 |
| `allowFrom`                     | `[]`       | `inboundPolicy: "allowlist"` 用の E.164 許可リスト。                                       |
| `maxDurationSeconds`            | `300`      | 応答済み状態に関係なく適用される、通話ごとの厳格な時間上限。                              |
| `staleCallReaperSeconds`        | `120`      | [古い通話リーパー](#stale-call-reaper) を参照。`0` で無効化します。                         |
| `silenceTimeoutMs`              | `800`      | クラシック (非リアルタイム) フローの発話終了無音検出。                                     |
| `transcriptTimeoutMs`           | `180000`   | ターンを諦める前に発信者の文字起こしを待つ最大時間。                                      |
| `ringTimeoutMs`                 | `30000`    | アウトバウンド通話の呼び出しタイムアウト。                                                 |
| `maxConcurrentCalls`            | `1`        | この上限を超えるアウトバウンド通話は拒否されます。                                        |
| `outbound.notifyHangupDelaySec` | `3`        | 通知モードで TTS 後に自動切断するまで待つ秒数。                                           |
| `skipSignatureVerification`     | `false`    | ローカルテスト専用。本番では絶対に有効化しないでください。                                |
| `store`                         | 未設定     | デフォルトの `~/.openclaw/voice-calls` 通話ログパスを上書きします。                       |
| `agentId`                       | `"main"`   | 応答生成とセッション保存に使うエージェント。                                              |
| `responseModel`                 | 未設定     | クラシック (非リアルタイム) 応答用のデフォルトモデルを上書きします。                      |
| `responseSystemPrompt`          | 生成       | クラシック応答用のカスタムシステムプロンプト。                                            |
| `responseTimeoutMs`             | `30000`    | クラシック応答生成のタイムアウト (ms)。                                                    |

<AccordionGroup>
  <Accordion title="プロバイダー公開とセキュリティの注記">
    - Twilio、Telnyx、Plivo はいずれも **公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx では、`skipSignatureVerification` が true でない限り、`telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料枠では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback (ngrok ローカルエージェント) の場合 **のみ**、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok 無料枠の URL は変更されたりインタースティシャル動作を追加したりする場合があります。`publicUrl` がずれると、Twilio 署名は失敗します。本番では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` (デフォルト `5000`) は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` (デフォルト `32`) は、認証前の開始待ちソケットの合計数を制限します。
    - `streaming.maxPendingConnectionsPerIp` (デフォルト `4`) は、送信元 IP ごとの認証前の開始待ちソケット数を制限します。
    - `streaming.maxConnections` (デフォルト `128`) は、開いているすべてのメディアストリームソケット (保留中 + アクティブ) を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    設定解析では、これらのレガシーキーが自動的に正規化され、置換先パスを示す
    警告がログに記録されます。この shim は将来のリリース (`2026.6.0`) で削除されるため、
    `openclaw doctor --fix` を実行して、コミット済みの設定を正規の形に書き換えてください。

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` は削除されました (リアルタイムコンテキストは現在、生成されたエージェントプロンプトを使用します)

  </Accordion>
</AccordionGroup>

## セッションスコープ

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使うため、同じ発信者からの
繰り返し通話では会話メモリが維持されます。各キャリア通話を新しいコンテキストで
開始する必要がある場合は、`sessionScope: "per-call"` を設定します。たとえば受付、
予約、IVR、または同じ電話番号が別々の会議を表す可能性がある Google Meet ブリッジ
フローなどです。

Voice Call は、設定されたエージェント名前空間 (`agent:<agentId>:voice:*`) の下に
生成されたセッションキーを保存します。生の明示的な統合キーは同じ名前空間に解決されます。
正規の `agent:<configuredAgentId>:*` キーはその所有者を保持し、コアの
`session.mainKey`/グローバルスコープのエイリアスを尊重します。外部または不正な形式の
`agent:*` 入力は、設定されたエージェント配下の不透明なキーとしてスコープされます。
`global` と `unknown` はグローバルセンチネルのままです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
これは、音声をリアルタイム文字起こしプロバイダーへ転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` を `streaming.enabled` と組み合わせることはできません。通話ごとに
音声モードを 1 つ選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio と Telnyx でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドル済みリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダーPluginによって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` 配下にあります。
- Voice Call は共有 `openclaw_agent_consult` リアルタイムツールをデフォルトで公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めた場合、リアルタイムモデルはそれを呼び出せます。
- `realtime.consultPolicy` は、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングのガイダンスを任意で追加します。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はセッション設定時に、境界付きのエージェントIDと選択されたワークスペースファイルカプセルをリアルタイムプロバイダーの指示に注入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス済みメモリ/セッションコンテキストを検索し、完全な consult エージェントへフォールバックする前に、`realtime.fastContext.timeoutMs` 内でそれらのスニペットをリアルタイムモデルへ返します。ただし、完全な consult エージェントへフォールバックするのは `realtime.fastContext.fallbackToConsult` が true の場合のみです。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call はPlugin全体を失敗させる代わりに警告をログに記録し、リアルタイムメディアをスキップします。
- `realtime.enabled` が true の場合、`inboundPolicy` は `"disabled"` であってはなりません。`validateProviderConfig` はこの組み合わせを拒否します。
- consult セッションキーは、利用可能な場合は保存済みの通話セッションを再利用し、その後、設定された `sessionScope`（デフォルトでは `per-phone`、分離された通話では `per-call`）へフォールバックします。

### ツールポリシー

`realtime.toolPolicy` は consult 実行を制御します。

| ポリシー       | 動作                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                                      |
| `none`           | consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                               |

`realtime.consultPolicy` はリアルタイムモデルの指示のみを制御します。

| ポリシー      | ガイダンス                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | デフォルトプロンプトを維持し、consult ツールを呼び出すタイミングはプロバイダーに判断させます。              |
| `substantive` | 単純な会話のつなぎは直接回答し、事実、メモリ、ツール、またはコンテキストの前に consult します。 |
| `always`      | すべての実質的な回答の前に consult します。                                                        |

### エージェント音声コンテキスト

通常のターンで完全なエージェント consult の往復を発生させずに、音声ブリッジを設定済みの OpenClaw エージェントのように聞こえさせたい場合は、`realtime.agentContext` を有効にします。コンテキストカプセルはリアルタイムセッションの作成時に一度だけ追加されるため、ターンごとのレイテンシは増えません。`openclaw_agent_consult` への呼び出しは引き続き完全な OpenClaw エージェントを実行するため、ツール作業、最新情報、メモリ検索、またはワークスペース状態に使用してください。

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
    デフォルト: API キーは `realtime.providers.google.apiKey`、`GEMINI_API_KEY`、
    または `GOOGLE_API_KEY` から取得されます。モデルは `gemini-2.5-flash-native-audio-preview-12-2025`、
    音声は `Kore` です。`sessionResumption` と `contextWindowCompression` は、より長く再接続可能な通話向けにデフォルトでオンです。
    電話音声でより高速なターンテイキングを調整するには、`silenceDurationMs`、
    `startSensitivity`、`endSensitivity` を使用します。

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

`streaming` はライブ通話音声のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドル済みリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダーPluginによって登録されます。
- プロバイダー所有の生設定は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受け入れ済みストリームの `start` メッセージを送信した後、Voice Call はただちにストリームを登録し、プロバイダーが接続する間、受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備ができてから初回あいさつを開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call はPlugin全体を失敗させる代わりに警告をログに記録し、メディアストリーミングをスキップします。

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
    デフォルト: API キーは `streaming.providers.xai.apiKey` または `XAI_API_KEY`（どちらも設定されていない場合は xAI OAuth 認証プロファイルへフォールバック）、
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

## 通話向け TTS

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin設定配下で**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

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
**Microsoft speech は音声通話では無視されます。** 電話音声合成には、電話向け出力を実装するプロバイダーが必要です。Microsoft speech プロバイダーはそれを実装していないため、通話ではスキップされ、代わりにフォールバックチェーン内の他のプロバイダーが試行されます。
</Warning>

動作メモ:

- Plugin設定内のレガシー `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合は、コア TTS が使用されます。それ以外の場合、通話はプロバイダーのネイティブ音声へフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` へフォールバックしません。その状態で電話向け TTS が利用できない場合、2つの再生経路を混在させる代わりに再生リクエストは失敗します。
- 電話向け TTS がセカンダリプロバイダーへフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン（`from`、`to`、`attempts`）を含む警告をログに記録します。
- Twilio barge-in またはストリームの破棄によって保留中の TTS キューがクリアされると、キュー内の再生リクエストは、再生完了を待つ発信者をハングさせる代わりに解決されます。

### TTS の例

<Tabs>
  <Tab title="Core TTS only">
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
`inboundPolicy: "allowlist"` は低保証の発信者 ID スクリーニングです。Plugin は
プロバイダーから提供された `From` 値を正規化し、`allowFrom` と比較します。
Webhook 検証はプロバイダーによる配信とペイロードの整合性を認証しますが、
PSTN/VoIP 発信者番号の所有権を証明するものでは**ありません**。
`allowFrom` は強固な発信者 ID ではなく、発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号の通話を受信し、各番号を別々の回線のように動作させる必要がある場合は、`numbers` を使用します。たとえば、
一方の番号ではカジュアルなパーソナルアシスタントを使用し、もう一方ではビジネス向けのペルソナ、別の応答エージェント、別の TTS 音声を使用できます。

ルートは、プロバイダーから提供された発信先 `To` 番号から選択されます。キーは
E.164 番号である必要があります。通話が着信すると、Voice Call は一致する
ルートを一度解決し、一致したルートを通話レコードに保存し、その有効な設定を
挨拶、従来の自動応答パス、リアルタイム相談パス、TTS 再生に再利用します。
一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用しません。通話を開始するときに、発信先、
メッセージ、セッションを明示的に渡してください。

ルートオーバーライドは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call `tts` 設定にディープマージされるため、
通常はプロバイダー音声だけをオーバーライドできます。

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

自動応答では、Voice Call は `{"spoken":"..."}` JSON 応答を要求する厳格な音声出力契約を
システムプロンプトに追加します。Voice Call は音声テキストを防御的に抽出します。

- reasoning/error コンテンツとしてマークされたペイロードを無視します。
- 直接の JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報らしい導入段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声に漏れることを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージの処理はライブ再生状態に結び付けられます。

- バージインのキュークリアと自動応答は、最初の挨拶が実際に発話中の場合にのみ抑制されます。
- 初回再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行のためにキューに残ります。
- Twilio ストリーミングの初回再生は、追加の遅延なしにストリーム接続時に開始されます。
- バージインはアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム独自の開始ターンを使用します。Voice Call はその初期メッセージに対して従来の `<Say>` TwiML 更新を投稿**しない**ため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に
**2000 ms** 待機します。

- その期間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブ通話が詰まるのを防ぐために通話は終了されます。

## 古い通話のリーパー

応答されず、ライブ会話状態にも到達しない通話を終了するには、`staleCallReaperSeconds`
（デフォルト **120**）を使用します。たとえば、プロバイダーが終端 Webhook を配信しない
通知モード通話が該当します。無効にするには `0` に設定します。

リーパーは 30 秒ごとに実行され、`answeredAt` タイムスタンプがなく、終端状態またはライブ
（`speaking`/`listening`）状態にもない通話だけを終了します。そのため、応答済みの会話が
このタイマーでリープされることはありません。`maxDurationSeconds`（デフォルト 300）は、
長時間実行されすぎた応答済み通話を終了する別の上限です。

キャリアによる呼び出し/応答 Webhook の配信が遅くなることがある通知スタイルのフローでは、
遅いが正常な通話が早期にリープされないよう、`staleCallReaperSeconds` をデフォルトより大きくしてください。
`120`-`300` 秒が本番環境での妥当な範囲です。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook セキュリティ

プロキシまたはトンネルが Gateway の前にある場合、Plugin は署名検証のために
公開 URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リスト化します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストに一致する場合にのみ転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護** は Twilio、Telnyx、Plivo で有効です。リプレイされた有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio 会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古い、またはリプレイされた音声コールバックが新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーが要求する署名ヘッダーがない場合、本文読み取り前に拒否されます。
- voice-call Webhook は、共有の認証前本文読み取りプロファイル（最大本文 64 KB、読み取りタイムアウト 5 秒）に加え、署名検証前にキーごとの処理中上限（デフォルトでキーごとに同時 8 リクエスト）を使用します。

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
Gateway が所有する voice-call ランタイムに委譲されるため、CLI が 2 つ目の
Webhook サーバーをバインドすることはありません。到達可能な Gateway がない場合、
コマンドはスタンドアロン CLI ランタイムにフォールバックします。

`latency` はデフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使用し、分析を最後の N 件のレコード
（デフォルト 200）に制限するには `--last <n>` を使用します。出力には、ターンレイテンシと
待機リッスン時間の min/max/avg、p50、p95 が含まれます。

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

voice-call Plugin には対応するエージェントスキルが同梱されています。

## Gateway RPC

| メソッド                    | 引数                                                             | 備考                                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to` が省略された場合、`toNumber` 設定にフォールバックします。            |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate` と同じですが、接続前の `dtmfSequence` も受け入れます。         |
| `voicecall.continue`        | `callId`, `message`                                              | ターンが解決されるまでブロックし、文字起こしを返します。                 |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同期バリアント: 直ちに `operationId` を返します。                       |
| `voicecall.continue.result` | `operationId`                                                    | 保留中の `voicecall.continue.start` 操作の結果をポーリングします。        |
| `voicecall.speak`           | `callId`, `message`                                              | 待たずに発話します。`realtime.enabled` の場合はリアルタイムブリッジを使用します。 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | すべてのアクティブ通話を一覧表示するには `callId` を省略します。          |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。通知モードの通話で
接続後の数字入力が必要な場合は、通話が存在した後に `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップで Webhook 公開に失敗する

Gateway を実行するのと同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` がグリーンである必要があります。
設定済みの `publicUrl` であっても、ローカルまたはプライベートネットワーク空間を指している場合は失敗します。キャリアがそれらのアドレスへコールバックできないためです。
`localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8`、またはその他のキャリアグレード NAT
範囲を `publicUrl` として使用しないでください。

Twilio の通知モード発信通話は、最初の `<Say>` TwiML を create-call リクエスト内で直接送信するため、
最初に発話されるメッセージは Twilio が Webhook TwiML を取得することに依存しません。
公開 Webhook は、ステータスコールバック、会話通話、接続前 DTMF、リアルタイムストリーム、
接続後の通話制御には引き続き必要です。

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

設定を変更したら、Gateway を再起動またはリロードし、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー認証情報が失敗する

選択されたプロバイダーと必要な認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、
  `fromNumber`、または `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID`、
  `TELNYX_PUBLIC_KEY`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`、または
  `PLIVO_AUTH_ID` と `PLIVO_AUTH_TOKEN`。

認証情報は Gateway ホスト上に存在している必要があります。ローカルのシェルプロファイルを編集しても、すでに実行中の Gateway には、再起動または環境の再読み込みが行われるまで反映されません。

### 通話は開始するが、プロバイダーの Webhook が届かない

プロバイダーコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次にランタイム状態を確認します。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の開始後にトンネル URL が変わった。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS により、公開ホスト名が Gateway 以外の場所にルーティングされている。
- Voice Call plugin を有効にせずに Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスには `webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界が自分の管理下にある場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、受信リクエストから OpenClaw が再構築する公開 URL に対して確認されます。署名が失敗する場合:

- プロバイダーの Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致していることを確認します。
- ngrok の無料枠 URL では、トンネルのホスト名が変わったら `publicUrl` を更新します。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外では `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加が失敗する

Google Meet は Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を検証します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に Google Meet トランスポートを明示的に検証します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call は正常なのに Meet の参加者が参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認します。電話通話自体は正常でも、ミーティングが不正な DTMF シーケンスを拒否または無視していることがあります。

Google Meet は、接続前 DTMF シーケンス付きの `voicecall.start` を通じて Twilio 電話レッグを開始します。PIN から派生したシーケンスには、Google Meet plugin の `voiceCall.dtmfDelayMs`（デフォルト **12000 ms**）が先頭の Twilio 待機桁として含まれます。これは、Meet のダイヤルインプロンプトが遅れて到着することがあるためです。その後 Voice Call は、イントロ挨拶がリクエストされる前にリアルタイム処理へリダイレクトします。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet 参加では、次の順序でログが出力されます。

- Google Meet が Twilio 参加を Voice Call に委任する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が消費され、リアルタイム処理の前に提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- Google Meet が DTMF 後の遅延後に `voicecall.speak` でイントロ音声をリクエストする。

`openclaw voicecall tail` には永続化された通話レコードが引き続き表示されます。通話状態と文字起こしには有用ですが、すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

音声モードが 1 つだけ有効になっていることを確認します。`realtime.enabled` と `streaming.enabled` を同時に true にすることはできません。

リアルタイム Twilio/Telnyx 通話では、さらに次を確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定、または登録済みプロバイダーを指定している。
- プロバイダー API キーが Gateway プロセスで利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始され、初期挨拶がキューに入れられたことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
