---
read_when:
    - OpenClaw から音声通話を発信する場合
    - 音声通話Pluginを設定または開発している場合
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要です
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo を使用して音声通話を発信・着信し、オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-07-11T22:33:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw 用の音声通話 Plugin：発信通知、複数ターンの会話、全二重リアルタイム音声、ストリーミング文字起こし、許可リストポリシーを使用した着信通話に対応します。

**プロバイダー：** `mock`（開発用、ネットワーク不要）、`plivo`（Voice API + XML 転送 + GetInput 音声認識）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice + Media Streams）。

<Note>
Voice Call Plugin は **Gateway プロセス内**で実行されます。リモート Gateway を使用する場合は、Gateway を実行しているマシンに Plugin をインストールして設定し、Plugin を読み込むために Gateway を再起動してください。
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
      <Tab title="ローカルフォルダーから（開発用）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    現在のリリースタグに追従するには、バージョンを付けずにパッケージを指定します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。その後、Plugin を読み込むために Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します（後述の[設定](#configuration)を参照）。最低限必要なのは、`provider`、プロバイダーの認証情報、`fromNumber`、および外部から到達可能な Webhook URL です。
  </Step>
  <Step title="セットアップを確認する">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Plugin が有効であること、プロバイダーの認証情報、Webhook の公開状態、および音声モード（`streaming` または `realtime`）が一方だけ有効であることを確認します。

  </Step>
  <Step title="スモークテストを実行する">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短い発信通知通話を実際に開始するには、`--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップによって**公開 Webhook URL**を解決できる必要があります。`publicUrl`、トンネル URL、Tailscale URL、または serve のフォールバックがループバックやプライベートネットワーク空間に解決される場合、通信事業者の Webhook を受信できないプロバイダーを起動する代わりに、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` でありながら、選択したプロバイダーの認証情報が不足している場合、Gateway の起動時に不足しているキーを含むセットアップ未完了の警告がログに記録され、ランタイムの起動はスキップされます。コマンド、RPC 呼び出し、およびエージェントツールを使用した場合も、不足している設定が正確に返されます。

<Note>
音声通話の認証情報では SecretRef を使用できます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、および `plugins.entries.voice-call.config.tts.providers.*.apiKey` は、標準の SecretRef サーフェスを介して解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // または "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // Twilio では TWILIO_FROM_NUMBER も使用可能
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cardsです。どのようなご用件でしょうか？",
              responseSystemPrompt: "簡潔に回答する野球カードの専門家として振る舞ってください。",
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
            // region: "ie1", // 任意：us1 | ie1 | au1。デフォルトは us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal から取得した Telnyx Webhook 公開鍵
            // （Base64。TELNYX_PUBLIC_KEY でも設定可能）。
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

          // Webhook セキュリティ（トンネル／プロキシでは推奨）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 外部公開（いずれかを選択）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 「ストリーミング文字起こし」を参照 */ },
          realtime: { enabled: false /* 「リアルタイム音声会話」を参照 */ },
        },
      },
    },
  },
}
```

### 設定リファレンス

上記に示していない `plugins.entries.voice-call.config` 配下の最上位キー：

| キー                            | デフォルト   | 備考                                                                                              |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 全体のオン／オフスイッチ。                                                                        |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。[着信通話](#inbound-calls)を参照。               |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` 用の E.164 許可リスト。                                               |
| `maxDurationSeconds`            | `300`        | 通話ごとの厳格な時間上限。応答済みかどうかにかかわらず適用されます。                              |
| `staleCallReaperSeconds`        | `120`        | [古い通話のリーパー](#stale-call-reaper)を参照。`0` で無効になります。                            |
| `silenceTimeoutMs`              | `800`        | 従来の（非リアルタイム）フローにおける発話終了の無音検出。                                        |
| `transcriptTimeoutMs`           | `180000`     | ターンを断念するまで発信者の文字起こしを待機する最大時間。                                        |
| `ringTimeoutMs`                 | `30000`      | 発信通話の呼び出しタイムアウト。                                                                  |
| `maxConcurrentCalls`            | `1`          | この上限を超える発信通話は拒否されます。                                                          |
| `outbound.notifyHangupDelaySec` | `3`          | 通知モードで TTS の完了後、自動切断まで待機する秒数。                                             |
| `skipSignatureVerification`     | `false`      | ローカルテスト専用。本番環境では絶対に有効にしないでください。                                    |
| `store`                         | 未設定       | デフォルトの `~/.openclaw/voice-calls` 通話ログパスを上書きします。                               |
| `agentId`                       | `"main"`     | 応答生成とセッション保存に使用するエージェント。                                                  |
| `responseModel`                 | 未設定       | 従来の（非リアルタイム）応答に使用するデフォルトモデルを上書きします。                            |
| `responseSystemPrompt`          | 自動生成     | 従来の応答用のカスタムシステムプロンプト。                                                        |
| `responseTimeoutMs`             | `30000`      | 従来の応答生成のタイムアウト（ミリ秒）。                                                          |

Twilio はデフォルトで US1 REST エンドポイントを使用します。サポート対象の米国外 Region で通話を処理するには、`twilio.region` を `ie1` または `au1` に設定し、その Region の認証情報を使用してください。[Twilio の米国外 REST API ガイド](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)を参照してください。

<AccordionGroup>
  <Accordion title="プロバイダーの公開とセキュリティに関する注意事項">
    - Twilio、Telnyx、Plivo では、いずれも**外部から到達可能な** Webhook URL が必要です。
    - `mock` はローカル開発用プロバイダーです（ネットワーク呼び出しは行いません）。
    - `skipSignatureVerification` が true でない限り、Telnyx には `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料プランでは、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に実施されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` を指定すると、`tunnel.provider="ngrok"` かつ `serve.bind` がループバック（ngrok ローカルエージェント）の場合**に限り**、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok の無料プランの URL は変更されたり、中間ページが追加されたりする場合があります。`publicUrl` が変わると、Twilio の署名検証は失敗します。本番環境では、安定したドメインまたは Tailscale funnel の使用を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続数の上限">
    - `streaming.preStartTimeoutMs`（デフォルト `5000`）は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections`（デフォルト `32`）は、未認証の開始前ソケットの合計数を制限します。
    - `streaming.maxPendingConnectionsPerIp`（デフォルト `4`）は、送信元 IP ごとの未認証の開始前ソケット数を制限します。
    - `streaming.maxConnections`（デフォルト `128`）は、開いているすべてのメディアストリームソケット数（保留中 + アクティブ）を制限します。

  </Accordion>
  <Accordion title="旧設定の移行">
    設定の解析時に、以下の旧キーは自動的に正規化され、置換先のパスを示す警告がログに記録されます。この互換シムは将来のリリース（`2026.6.0`）で削除されるため、`openclaw doctor --fix` を実行して、コミット済みの設定を正規形に書き換えてください。

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` は削除されました（リアルタイムコンテキストでは、生成されたエージェントプロンプトを使用するようになりました）

  </Accordion>
</AccordionGroup>

## セッションスコープ

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使用するため、同じ発信者からの繰り返しの通話でも会話の記憶が維持されます。通信事業者の通話ごとに新しいコンテキストで開始する必要がある場合は、`sessionScope: "per-call"` を設定してください。たとえば、同じ電話番号が異なる会議を表す可能性のある受付、予約、IVR、Google Meet ブリッジのフローが該当します。

Voice Call は、設定されたエージェント名前空間（`agent:<agentId>:voice:*`）に生成済みセッションキーを保存します。明示的な未加工の連携キーも同じ名前空間に解決されます。正規の `agent:<configuredAgentId>:*` キーはその所有者を維持し、コアの `session.mainKey`／グローバルスコープのエイリアス処理に従います。別のエージェントに属する、または形式が不正な `agent:*` 入力は、設定されたエージェント配下の不透明なキーとしてスコープされます。`global` と `unknown` は引き続きグローバルセンチネルとして扱われます。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。音声をリアルタイム文字起こしプロバイダーに転送するだけの `streaming` とは別の機能です。

<Warning>
`realtime.enabled` と `streaming.enabled` を同時に使用することはできません。通話ごとにいずれか一方の音声モードを選択してください。
</Warning>

現在のランタイム動作：

- `realtime.enabled` は Twilio と Telnyx でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- 同梱のリアルタイム音声プロバイダー: Google Gemini Live（`google`）と OpenAI（`openai`）。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダーが所有する生の設定は `realtime.providers.<providerId>` 配下に置かれます。
- Voice Call はデフォルトで共有リアルタイムツール `openclaw_agent_consult` を公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めた場合、リアルタイムモデルはこのツールを呼び出せます。
- `realtime.consultPolicy` では、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングに関するガイダンスを任意で追加できます。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はセッションのセットアップ時に、範囲を制限したエージェント ID と選択されたワークスペースファイルのカプセルを、リアルタイムプロバイダーの指示へ挿入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまずコンサルトの質問についてインデックス化されたメモリ／セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にその抜粋をリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が `true` の場合にのみ、完全なコンサルトエージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログへ記録し、リアルタイムメディアをスキップします。
- `realtime.enabled` が `true` の場合、`inboundPolicy` を `"disabled"` にしてはなりません。`validateProviderConfig` はこの組み合わせを拒否します。
- コンサルトセッションキーは、保存済みの通話セッションが利用可能な場合はそれを再利用し、その後、設定された `sessionScope`（デフォルトは `per-phone`、分離された通話では `per-call`）へフォールバックします。

### ツールポリシー

`realtime.toolPolicy` はコンサルト実行を制御します。

| ポリシー         | 動作                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | コンサルトツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` のみに制限します。 |
| `owner`          | コンサルトツールを公開し、通常のエージェントが通常のエージェントツールポリシーを使用できるようにします。                                           |
| `none`           | コンサルトツールを公開しません。カスタムの `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                                        |

`realtime.consultPolicy` はリアルタイムモデルの指示のみを制御します。

| ポリシー      | ガイダンス                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `auto`        | デフォルトのプロンプトを維持し、コンサルトツールを呼び出すタイミングをプロバイダーに判断させます。       |
| `substantive` | 単純な会話上のつなぎには直接回答し、事実、メモリ、ツール、またはコンテキストを扱う前にコンサルトします。 |
| `always`      | 内容のある回答を行う前に毎回コンサルトします。                                                           |

### エージェント音声コンテキスト

通常のターンごとに完全なエージェントコンサルトの往復処理を発生させず、音声ブリッジを設定済みの OpenClaw エージェントらしい話し方にする場合は、`realtime.agentContext` を有効にします。コンテキストカプセルはリアルタイムセッションの作成時に一度だけ追加されるため、ターンごとのレイテンシーは増加しません。`openclaw_agent_consult` の呼び出しでは引き続き完全な OpenClaw エージェントが実行されるため、ツール処理、最新情報、メモリ検索、またはワークスペースの状態に使用してください。

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
    または `GOOGLE_API_KEY`、モデルは `gemini-3.1-flash-live-preview`、
    音声は `Kore` です。長時間で再接続可能な通話向けに、
    `sessionResumption` と `contextWindowCompression` はデフォルトでオンです。
    電話音声でより素早いターン交代を調整するには、`silenceDurationMs`、
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
                    model: "gemini-3.1-flash-live-preview",
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

プロバイダー固有のリアルタイム音声オプションについては、
[Google プロバイダー](/ja-JP/providers/google)および
[OpenAI プロバイダー](/ja-JP/providers/openai)を参照してください。

## ストリーミング文字起こし

`streaming` は、通話中のライブ音声に使用するリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- 同梱のリアルタイム文字起こしプロバイダー: Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI（`xai`）。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダーが所有する生の設定は `streaming.providers.<providerId>` 配下に置かれます。
- Twilio が受理済みストリームの `start` メッセージを送信すると、Voice Call はストリームを直ちに登録し、プロバイダーの接続中は受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備が完了した後にのみ最初の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、またはプロバイダーが登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログへ記録し、メディアストリーミングをスキップします。

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
                    apiKey: "sk-...", // OPENAI_API_KEY が設定されている場合は任意
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
    デフォルト: API キーは `streaming.providers.xai.apiKey` または `XAI_API_KEY`
    （どちらも設定されていない場合は xAI OAuth 認証プロファイルへフォールバック）、
    エンドポイントは `wss://api.x.ai/v1/stt`、エンコーディングは `mulaw`、
    サンプルレートは `8000`、`endpointingMs: 800`、`interimResults: true` です。

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
                    apiKey: "${XAI_API_KEY}", // XAI_API_KEY が設定されている場合は任意
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

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin 設定配下で**同じ構造**を使用して上書きできます。この設定は `messages.tts` とディープマージされます。

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
**Microsoft 音声は音声通話では無視されます。** 電話合成には、電話向け出力を実装するプロバイダーが必要です。Microsoft 音声プロバイダーはこれを実装していないため、通話ではスキップされ、代わりにフォールバックチェーン内のほかのプロバイダーが試行されます。
</Warning>

動作に関する注意:

- Plugin 設定内の従来の `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は `openclaw doctor --fix` によって修復されます。コミットする設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダー固有の音声へフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` へフォールバックしません。その状態で電話用 TTS が利用できない場合、2 つの再生経路を混在させる代わりに再生リクエストが失敗します。
- 電話用 TTS がセカンダリプロバイダーへフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン（`from`、`to`、`attempts`）を含む警告をログへ記録します。
- Twilio の割り込み発話またはストリーム終了処理によって保留中の TTS キューがクリアされた場合、キュー内の再生リクエストは、再生完了を待つ発信者を待機させたままにせず完了状態になります。

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

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次のように設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` は、保証レベルの低い発信者番号の照合です。Plugin は
プロバイダーが提供する `From` 値を正規化し、`allowFrom` と比較します。
Webhook 検証はプロバイダーからの配信とペイロードの完全性を認証しますが、
PSTN/VoIP の発信者番号の所有権を証明するものでは**ありません**。
`allowFrom` は強固な発信者本人確認ではなく、発信者番号のフィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1つの Voice Call Plugin で複数の電話番号への着信を受け付け、それぞれの番号を
異なる回線のように動作させる場合は、`numbers` を使用します。たとえば、ある番号では
カジュアルなパーソナルアシスタントを使用し、別の番号ではビジネス向けの人格、
異なる応答エージェント、異なる TTS 音声を使用できます。

ルートは、プロバイダーが提供するダイヤル先の `To` 番号から選択されます。キーは
E.164 番号でなければなりません。着信時に Voice Call は一致するルートを
一度だけ解決し、一致したルートを通話レコードに保存して、その有効な設定を
挨拶、従来の自動応答パス、リアルタイム相談パス、TTS 再生に再利用します。
一致するルートがない場合は、Voice Call のグローバル設定が使用されます。
発信通話では `numbers` を使用しません。通話を開始するときに、発信先、
メッセージ、セッションを明示的に渡してください。

現在、ルートの上書きでは以下をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ルートの `tts` 値は、Voice Call のグローバルな `tts` 設定に対して
ディープマージされるため、通常はプロバイダー音声のみを上書きできます。

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

### 音声出力の契約

自動応答では、Voice Call は `{"spoken":"..."}` 形式の JSON 応答を要求する
厳格な音声出力契約をシステムプロンプトに追加します。Voice Call は
防御的に読み上げテキストを抽出します。

- 推論またはエラー内容としてマークされたペイロードを無視します。
- 直接記述された JSON、コードフェンス内の JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報と思われる冒頭の段落を削除します。

これにより、音声再生を発信者向けのテキストに集中させ、計画テキストが
音声に漏れることを防ぎます。

### 会話開始時の動作

発信の `conversation` 通話では、最初のメッセージの処理が
実際の再生状態に連動します。

- 割り込みによるキューのクリアと自動応答は、最初の挨拶を実際に読み上げている間だけ抑制されます。
- 最初の再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューへ残ります。
- Twilio ストリーミングの最初の再生は、ストリーム接続時に追加の遅延なしで開始されます。
- 割り込みは進行中の再生を中止し、キューにある未再生の Twilio TTS エントリをクリアします。クリアされたエントリはスキップ済みとして解決されるため、再生されない音声を待たずに後続の応答ロジックを続行できます。
- リアルタイム音声会話では、リアルタイムストリーム独自の最初のターンを使用します。Voice Call はその最初のメッセージに対して従来の `<Say>` TwiML 更新を送信**しない**ため、発信の `<Connect><Stream>` セッションは接続状態を維持します。

### Twilio ストリーム切断の猶予期間

Twilio メディアストリームが切断された場合、Voice Call は通話を
自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後もストリームが再登録されない場合、通話がアクティブなまま停止することを防ぐため、通話を終了します。

## 古い通話のリーパー

応答されず、実際の会話状態にも到達しない通話を終了するには、
`staleCallReaperSeconds`（デフォルトは **120**）を使用します。たとえば、
プロバイダーが終了 Webhook を送信しない通知モードの通話が該当します。
無効にするには `0` に設定します。

リーパーは30秒ごとに実行され、`answeredAt` タイムスタンプがなく、
終了状態または実際の会話状態（`speaking`/`listening`）になっていない
通話だけを終了します。そのため、応答済みの会話がこのタイマーによって
終了されることはありません。長時間継続する応答済み通話を終了する
独立した上限は、`maxDurationSeconds`（デフォルトは300）です。

通信事業者による呼び出し中または応答 Webhook の配信が遅くなる可能性がある
通知形式のフローでは、遅いだけで正常な通話が早期に終了されないように、
`staleCallReaperSeconds` をデフォルト値より大きくしてください。
本番環境では `120`～`300` 秒が妥当な範囲です。

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

## Webhook のセキュリティ

Gateway の前段にプロキシまたはトンネルがある場合、Plugin は署名検証用の
公開 URL を再構築します。以下のオプションは、どの転送ヘッダーを
信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストの許可リスト。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護機能は以下のとおりです。

- Twilio、Telnyx、Plivo では Webhook の**リプレイ保護**が有効です。再送された有効な Webhook リクエストには応答しますが、副作用を伴う処理はスキップします。
- Twilio の会話ターンでは `<Gather>` コールバックにターンごとのトークンを含めるため、古い、または再送された音声コールバックが、より新しい保留中の文字起こしターンを満たすことはありません。
- プロバイダーに必須の署名ヘッダーがない場合、未認証の Webhook リクエストは本文を読み取る前に拒否されます。
- voice-call Webhook は、署名検証の前に、共有の認証前本文読み取りプロファイル（本文の最大サイズ64 KB、読み取りタイムアウト5秒）と、キーごとの処理中リクエスト数の上限（デフォルトではキーごとに同時8リクエスト）を使用します。

安定した公開ホストを使用する例：

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
Gateway が所有する voice-call ランタイムへ処理を委譲するため、
CLI が2つ目の Webhook サーバーをバインドすることはありません。
到達可能な Gateway がない場合、コマンドはスタンドアロンの
CLI ランタイムにフォールバックします。

`latency` は、デフォルトの voice-call ストレージパスから `calls.jsonl` を
読み取ります。別のログを指定するには `--file <path>` を使用し、分析を
最後の N 件のレコード（デフォルトは200件）に制限するには `--last <n>` を
使用します。出力には、ターンのレイテンシと待受時間について、最小値、最大値、
平均値、p50、p95 が含まれます。

## エージェントツール

ツール名：`voice_call`。

| アクション      | 引数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call Plugin には、対応するエージェント Skills が付属します。

## Gateway RPC

| メソッド                    | 引数                                                             | 注記                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to` が省略された場合は `toNumber` 設定にフォールバックします。          |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate` と同じですが、接続前の `dtmfSequence` も受け付けます。        |
| `voicecall.continue`        | `callId`, `message`                                              | ターンが解決するまでブロックし、文字起こしを返します。                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同期版です。`operationId` を即座に返します。                           |
| `voicecall.continue.result` | `operationId`                                                    | 保留中の `voicecall.continue.start` 操作をポーリングして結果を取得します。 |
| `voicecall.speak`           | `callId`, `message`                                              | 待機せずに読み上げます。`realtime.enabled` の場合はリアルタイムブリッジを使用します。 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | すべてのアクティブな通話を一覧表示するには `callId` を省略します。       |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。通知モードの通話で
接続後の数字入力が必要な場合は、通話の作成後に `voicecall.dtmf` を
使用してください。

## トラブルシューティング

### セットアップ時の Webhook 公開に失敗する

Gateway を実行する環境と同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が正常でなければ
なりません。設定済みの `publicUrl` であっても、ローカルまたは
プライベートネットワーク空間を指している場合は失敗します。これは、
通信事業者がそれらのアドレスにコールバックできないためです。
`localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`～`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8`、またはその他の
キャリアグレード NAT 範囲を `publicUrl` として使用しないでください。

Twilio の通知モードの発信通話では、最初の `<Say>` TwiML を通話作成
リクエストで直接送信するため、最初の読み上げメッセージは Twilio による
Webhook TwiML の取得に依存しません。ステータスコールバック、会話通話、
接続前 DTMF、リアルタイムストリーム、接続後の通話制御には、引き続き
公開 Webhook が必要です。

公開経路は1つだけ使用してください。

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

設定を変更した後、Gateway を再起動または再読み込みしてから、以下を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダーの認証情報が無効になる

選択したプロバイダーと必須の認証情報フィールドを確認してください。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、
  `fromNumber`、または `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID`、
  `TELNYX_PUBLIC_KEY`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`、または
  `PLIVO_AUTH_ID` と `PLIVO_AUTH_TOKEN`。

認証情報は Gateway ホスト上に存在する必要があります。ローカルのシェルプロファイルを
編集しても、すでに実行中の Gateway が再起動するか環境を再読み込みするまでは
影響しません。

### 通話は開始するがプロバイダーの Webhook が届かない

プロバイダーのコンソールが正確な公開 Webhook URL を指していることを確認します。

```text
https://voice.example.com/voice/webhook
```

次に、ランタイムの状態を調べます。

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

一般的な原因:

- `publicUrl` が `serve.path` とは異なるパスを指している。
- Gateway の起動後にトンネル URL が変更された。
- プロキシがリクエストを転送する際に、ホストまたはプロトコルヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS により、公開ホスト名が Gateway 以外にルーティングされている。
- Voice Call Plugin を有効にせずに Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、
`webhookSecurity.allowedHosts` に公開ホスト名を設定するか、既知のプロキシアドレスには
`webhookSecurity.trustedProxyIPs` を使用します。
`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を
自分で管理している場合にのみ使用してください。

### 署名検証に失敗する

プロバイダーの署名は、OpenClaw が受信リクエストから再構築した公開 URL に対して
検証されます。署名検証に失敗する場合:

- プロバイダーの Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と正確に一致することを確認する。
- ngrok の無料プランの URL では、トンネルのホスト名が変更されたときに `publicUrl` を更新する。
- プロキシが元のホストヘッダーとプロトコルヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定する。
- ローカルテスト以外では `skipSignatureVerification` を有効にしない。

### Google Meet の Twilio 参加に失敗する

Google Meet は、Twilio のダイヤルイン参加にこの Plugin を使用します。まず Voice
Call を検証します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に、Google Meet のトランスポートを明示的に検証します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が正常でも Meet の参加者が参加しない場合は、Meet の
ダイヤルイン番号、PIN、`--dtmf-sequence` を確認してください。通話自体は正常でも、
DTMF シーケンスが誤っていると、会議側で拒否または無視されることがあります。

Google Meet は、接続前の DTMF シーケンスを指定して `voicecall.start` 経由で
Twilio の電話回線を開始します。PIN から生成されたシーケンスでは、Google Meet
Plugin の `voiceCall.dtmfDelayMs`（デフォルトは **12000 ms**）が先頭の Twilio
待機桁として含まれます。これは、Meet のダイヤルインプロンプトが遅れて届くことがあるためです。
その後、Voice Call は導入時の挨拶が要求される前に、リアルタイム処理へリダイレクトします。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet
参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF の TwiML を保存する。
- リアルタイム処理の前に、Twilio の初期 TwiML が消費され、提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- DTMF 後の遅延の後、Google Meet が `voicecall.speak` で導入音声を要求する。

`openclaw voicecall tail` には、引き続き永続化された通話記録が表示されます。
通話状態や文字起こしの確認には便利ですが、すべての Webhook やリアルタイム遷移が
表示されるわけではありません。

### リアルタイム通話で音声が出ない

有効になっている音声モードが 1 つだけであることを確認してください。`realtime.enabled` と
`streaming.enabled` を同時に true にすることはできません。

リアルタイムの Twilio/Telnyx 通話では、次の点も確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定であるか、登録済みのプロバイダーを指定している。
- プロバイダーの API キーを Gateway プロセスから利用できる。
- `openclaw logs --follow` に、リアルタイム TwiML の提供、リアルタイムブリッジの開始、初回の挨拶のキューへの追加が表示されている。

## 関連項目

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
