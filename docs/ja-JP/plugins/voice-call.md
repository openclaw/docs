---
read_when:
    - OpenClawから音声通話を発信したい場合
    - 音声通話Pluginを設定または開発しています
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo を介して音声通話を発信・着信し、オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-07-12T14:49:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin を介した OpenClaw の音声通話：アウトバウンド通知、複数ターンの
会話、全二重リアルタイム音声、ストリーミング文字起こし、および
許可リストポリシーを使用した着信通話。

**プロバイダー：** `mock`（開発用、ネットワーク不要）、`plivo`（Voice API + XML 転送 +
GetInput 音声認識）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice +
Media Streams）。

<Note>
Voice Call Plugin は **Gateway プロセス内** で実行されます。リモート
Gateway を使用する場合は、Gateway を実行しているマシンに Plugin を
インストールして設定し、Gateway を再起動して読み込んでください。
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

    現在のリリースタグに追従するには、バージョン指定なしのパッケージを使用します。再現可能な
    インストールが必要な場合にのみ、正確なバージョンを固定してください。その後、Plugin が
    読み込まれるように Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します（以下の
    [設定](#configuration)を参照）。最低限必要なのは、`provider`、プロバイダーの
    認証情報、`fromNumber`、およびパブリックに到達可能な Webhook URL です。
  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Plugin の有効化、プロバイダーの認証情報、Webhook の公開状態、および
    1 つの音声モード（`streaming` または `realtime`）だけが有効であることを確認します。

  </Step>
  <Step title="スモークテストを実行する">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。短いアウトバウンド
    通知通話を発信するには、`--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップによって **パブリック Webhook URL** が解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
ループバックまたはプライベートネットワーク空間に解決される場合、通信事業者の Webhook を
受信できないプロバイダーを起動するのではなく、セットアップが失敗します。
</Warning>

## 設定

`enabled: true` である一方、選択したプロバイダーの認証情報が不足している場合、Gateway の
起動時に不足しているキーを含むセットアップ未完了の警告がログに記録され、
ランタイムの起動がスキップされます。コマンド、RPC 呼び出し、エージェントツールを使用した場合も、
不足している設定が正確に返されます。

<Note>
音声通話の認証情報には SecretRef を使用できます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、および `plugins.entries.voice-call.config.tts.providers.*.apiKey` は、標準の SecretRef サーフェスを介して解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // または "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // または Twilio の TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cardsです。どのようなご用件でしょうか？",
              responseSystemPrompt: "簡潔に回答する野球カードの専門家です。",
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
            // region: "ie1", // 任意: us1 | ie1 | au1、デフォルトは us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal で取得した Telnyx Webhook 公開鍵
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

          // Webhook のセキュリティ（トンネル／プロキシで推奨）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公開方法（いずれか1つを選択）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* ストリーミング文字起こしを参照 */ },
          realtime: { enabled: false /* リアルタイム音声会話を参照 */ },
        },
      },
    },
  },
}
```

### 設定リファレンス

上記に記載されていない `plugins.entries.voice-call.config` 直下のキー：

| キー                            | デフォルト   | 備考                                                                                         |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 全体のオン／オフスイッチ。                                                                   |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。[着信](#inbound-calls)を参照。             |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` 用の E.164 許可リスト。                                          |
| `maxDurationSeconds`            | `300`        | 通話ごとの厳格な時間上限。応答済みかどうかにかかわらず適用されます。                         |
| `staleCallReaperSeconds`        | `120`        | [古い通話の回収処理](#stale-call-reaper)を参照。`0` で無効化します。                         |
| `silenceTimeoutMs`              | `800`        | 従来型（非リアルタイム）フローで発話終了を判定する無音時間。                                 |
| `transcriptTimeoutMs`           | `180000`     | 1ターンを断念するまで発信者の文字起こしを待つ最大時間。                                      |
| `ringTimeoutMs`                 | `30000`      | 発信時の呼び出しタイムアウト。                                                               |
| `maxConcurrentCalls`            | `1`          | この上限を超える発信は拒否されます。                                                         |
| `outbound.notifyHangupDelaySec` | `3`          | 通知モードで TTS 後に自動切断するまでの待機秒数。                                            |
| `skipSignatureVerification`     | `false`      | ローカルテスト専用。本番環境では絶対に有効化しないでください。                               |
| `store`                         | 未設定       | デフォルトの通話ログパス `~/.openclaw/voice-calls` を上書きします。                          |
| `agentId`                       | `"main"`     | 応答生成とセッション保存に使用するエージェント。                                             |
| `responseModel`                 | 未設定       | 従来型（非リアルタイム）応答のデフォルトモデルを上書きします。                               |
| `responseSystemPrompt`          | 自動生成     | 従来型応答用のカスタムシステムプロンプト。                                                   |
| `responseTimeoutMs`             | `30000`      | 従来型の応答生成タイムアウト（ms）。                                                          |

Twilio はデフォルトで US1 REST エンドポイントを使用します。サポート対象の
米国外 Region で通話を処理するには、`twilio.region` を `ie1` または `au1` に設定し、
その Region の認証情報を使用してください。詳細は
[Twilio の米国外 REST API ガイド](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)を参照してください。

<AccordionGroup>
  <Accordion title="プロバイダーの公開とセキュリティに関する注意事項">
    - Twilio、Telnyx、Plivo はすべて、**外部から到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです（ネットワーク呼び出しは行いません）。
    - `skipSignatureVerification` が true でない限り、Telnyx には `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料プランでは、`publicUrl` に正確な ngrok URL を設定してください。署名検証は常に適用されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` がループバック（ngrok ローカルエージェント）の場合に**限り**、無効な署名を持つ Twilio Webhook を許可します。ローカル開発専用です。
    - ngrok 無料プランの URL は変更されたり、中間ページの動作が追加されたりする可能性があります。`publicUrl` がずれると、Twilio の署名検証は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続の上限">
    - `streaming.preStartTimeoutMs`（デフォルト `5000`）は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections`（デフォルト `32`）は、認証前の開始待ちソケット総数を制限します。
    - `streaming.maxPendingConnectionsPerIp`（デフォルト `4`）は、送信元 IP ごとの認証前の開始待ちソケット数を制限します。
    - `streaming.maxConnections`（デフォルト `128`）は、開いているすべてのメディアストリームソケット（待機中 + アクティブ）を制限します。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    設定解析では、以下のレガシーキーが自動的に正規化され、置換先のパスを示す
    警告がログに記録されます。この互換用処理は将来のリリース
    （`2026.6.0`）で削除されるため、`openclaw doctor --fix` を実行して、
    コミット済みの設定を正規形に書き換えてください。

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` は削除されました（リアルタイムコンテキストでは、生成されたエージェントプロンプトが使用されるようになりました）

  </Accordion>
</AccordionGroup>

## セッションスコープ

デフォルトでは、Voice Call は `sessionScope: "per-phone"` を使用するため、
同じ発信者から繰り返し通話があった場合も会話メモリが保持されます。受付、予約、
IVR、Google Meet ブリッジフローなど、同じ電話番号が異なる会議を表す可能性があり、
通信事業者の通話ごとに新しいコンテキストで開始する必要がある場合は、
`sessionScope: "per-call"` を設定してください。

Voice Call は、生成したセッションキーを設定済みのエージェント名前空間
（`agent:<agentId>:voice:*`）に保存します。明示的な未加工の連携キーも同じ名前空間に
解決されます。正規の `agent:<configuredAgentId>:*` キーはその所有者を維持し、
コアの `session.mainKey`／グローバルスコープのエイリアス処理に従います。別の
エージェントに属する、または不正な形式の `agent:*` 入力は、設定済みエージェント配下の
不透明なキーとしてスコープ設定されます。`global` と `unknown` はグローバルな
センチネルのままです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声に使用する全二重のリアルタイム音声プロバイダーを選択します。
これは、音声をリアルタイム文字起こしプロバイダーに転送するだけの `streaming` とは別の機能です。

<Warning>
`realtime.enabled` と `streaming.enabled` を同時に使用することはできません。
通話ごとに音声モードを1つ選択してください。
</Warning>

現在のランタイム動作：

- `realtime.enabled` は Twilio と Telnyx でサポートされています。
- `realtime.provider` は省略可能です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされているリアルタイム音声プロバイダー: Google Gemini Live（`google`）と OpenAI（`openai`）。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダーが所有する生の設定は `realtime.providers.<providerId>` 配下にあります。
- Voice Call は、共有リアルタイムツール `openclaw_agent_consult` をデフォルトで公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めた場合、リアルタイムモデルはこのツールを呼び出せます。
- `realtime.consultPolicy` では、リアルタイムモデルが `openclaw_agent_consult` を呼び出すべきタイミングに関するガイダンスを任意で追加できます。
- `realtime.agentContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はセッションのセットアップ時に、制限されたエージェント ID と選択されたワークスペースファイルのカプセルをリアルタイムプロバイダーの指示へ注入します。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまずコンサルトの質問についてインデックス化されたメモリ／セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にそれらのスニペットをリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が true の場合に限り、完全なコンサルトエージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログへ記録し、リアルタイムメディアをスキップします。
- `realtime.enabled` が true の場合、`inboundPolicy` を `"disabled"` にしてはなりません。`validateProviderConfig` はこの組み合わせを拒否します。
- コンサルトセッションキーは、保存済みの通話セッションが利用可能であればそれを再利用し、その後、設定された `sessionScope`（デフォルトは `per-phone`、分離された通話の場合は `per-call`）へフォールバックします。

### ツールポリシー

`realtime.toolPolicy` はコンサルト実行を制御します。

| ポリシー         | 動作                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | コンサルトツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` のみに制限します。 |
| `owner`          | コンサルトツールを公開し、通常のエージェントが通常のエージェントツールポリシーを使用できるようにします。                                                     |
| `none`           | コンサルトツールを公開しません。カスタムの `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                                                  |

`realtime.consultPolicy` はリアルタイムモデルへの指示のみを制御します。

| ポリシー      | ガイダンス                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `auto`        | デフォルトのプロンプトを維持し、コンサルトツールを呼び出すタイミングの判断をプロバイダーに委ねます。         |
| `substantive` | 単純な会話のつなぎには直接回答し、事実、メモリ、ツール、またはコンテキストが必要な場合は先にコンサルトします。 |
| `always`      | 内容のある回答を行う前に毎回コンサルトします。                                                               |

### エージェントの音声コンテキスト

通常のターンごとに完全なエージェントコンサルトの往復コストを負担せず、
設定済みの OpenClaw エージェントのように音声ブリッジが応答する必要がある場合は、
`realtime.agentContext` を有効にします。コンテキストカプセルはリアルタイムセッションの
作成時に一度だけ追加されるため、ターンごとのレイテンシーは増加しません。
`openclaw_agent_consult` の呼び出しでは引き続き完全な OpenClaw エージェントが実行され、
ツール作業、最新情報、メモリ検索、またはワークスペースの状態に使用する必要があります。

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
    音声は `Kore` です。長時間で再接続可能な通話のため、
    `sessionResumption` と `contextWindowCompression` はデフォルトでオンです。
    電話音声でより高速なターン交代を調整するには、`silenceDurationMs`、
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
                instructions: "簡潔に話してください。より高度なツールを使用する前に openclaw_agent_consult を呼び出してください。",
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

`streaming` は、ライブ通話音声用のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は省略可能です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI（`xai`）。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダーが所有する生の設定は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信すると、Voice Call は直ちにストリームを登録し、プロバイダーの接続中は受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備が完了した後にのみ最初の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログへ記録し、メディアストリーミングをスキップします。

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
                    apiKey: "sk-...", // OPENAI_API_KEY が設定されている場合は省略可能
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
                    apiKey: "${XAI_API_KEY}", // XAI_API_KEY が設定されている場合は省略可能
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
Plugin 設定配下で**同じ形式**を使用して上書きできます。
この設定は `messages.tts` とディープマージされます。

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
**Microsoft 音声は音声通話では無視されます。** 電話向け音声合成には、
電話向け出力を実装するプロバイダーが必要です。Microsoft 音声プロバイダーは
それを実装していないため、通話ではスキップされ、代わりにフォールバックチェーン内の
他のプロバイダーが試行されます。
</Warning>

動作に関する注記:

- Plugin 設定内の従来の `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は `openclaw doctor --fix` によって修復されます。コミットする設定では `tts.providers.<provider>` を使用する必要があります。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用され、それ以外の場合、通話はプロバイダー固有の音声へフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` へフォールバックしません。その状態で電話向け TTS が利用できない場合、2 つの再生経路を混在させる代わりに再生リクエストが失敗します。
- 電話向け TTS がセカンダリプロバイダーへフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン（`from`、`to`、`attempts`）を含む警告をログへ記録します。
- Twilio の割り込みまたはストリームの終了によって保留中の TTS キューがクリアされた場合、再生完了を待っている発信者をハングさせる代わりに、キュー内の再生リクエストが完了状態になります。

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
  inboundGreeting: "こんにちは！どのようなご用件でしょうか？",
}
```

<Warning>
`inboundPolicy: "allowlist"` は、保証レベルの低い発信者番号スクリーニングです。Plugin は、
プロバイダーから提供された `From` 値を正規化し、`allowFrom` と比較します。
Webhook 検証では、プロバイダーからの配信とペイロードの完全性を認証しますが、
PSTN/VoIP 発信者番号の所有権を証明するものでは**ありません**。
`allowFrom` は強力な発信者 ID ではなく、発信者番号フィルタリングとして扱ってください。
</Warning>

自動応答ではエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号への着信を受け、各番号を
別々の回線のように動作させる場合は、`numbers` を使用します。たとえば、
ある番号では親しみやすいパーソナルアシスタントを使用し、別の番号ではビジネス向けの
ペルソナ、異なる応答エージェント、異なる TTS 音声を使用できます。

ルートは、プロバイダーから提供された着信先の `To` 番号に基づいて選択されます。キーは
E.164 番号でなければなりません。着信時に Voice Call は一致する
ルートを一度だけ解決し、一致したルートを通話レコードに保存して、その
有効な設定を挨拶、従来の自動応答パス、リアルタイム
相談パス、TTS 再生で再利用します。一致するルートがない場合は、グローバルな Voice Call
設定が使用されます。発信通話では `numbers` を使用しません。通話開始時に、
発信先、メッセージ、セッションを明示的に渡してください。

現在、ルートのオーバーライドでは以下がサポートされています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ルートの `tts` 値はグローバルな Voice Call の `tts` 設定にディープマージされるため、
通常はプロバイダーの音声だけをオーバーライドできます。

```json5
{
  inboundGreeting: "メイン回線にお電話いただきありがとうございます。",
  responseSystemPrompt: "あなたはデフォルトの音声アシスタントです。",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards です。ご用件をどうぞ。",
      responseSystemPrompt: "あなたは簡潔に回答する野球カードの専門家です。",
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

自動応答の場合、Voice Call は `{"spoken":"..."}` JSON 応答を要求する
厳格な音声出力契約をシステムプロンプトに追加します。Voice Call は
音声テキストを防御的に抽出します。

- 推論またはエラーコンテンツとしてマークされたペイロードを無視します。
- 直接の JSON、フェンスで囲まれた JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報と思われる冒頭の段落を削除します。

これにより、音声再生を発信者向けのテキストに集中させ、計画テキストが
音声に漏れることを防ぎます。

### 会話開始時の動作

発信の `conversation` 通話では、最初のメッセージの処理はライブ
再生状態に連動します。

- 割り込みによるキューのクリアと自動応答は、最初の挨拶が実際に再生されている間だけ抑制されます。
- 最初の再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行のためキューに残ります。
- Twilio ストリーミングの最初の再生は、ストリーム接続時に追加の遅延なしで開始されます。
- 割り込みは進行中の再生を中止し、キューに入っているもののまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップ済みとして解決されるため、後続の応答ロジックは、再生されることのない音声を待たずに続行できます。
- リアルタイム音声会話では、リアルタイムストリーム独自の開始ターンを使用します。Voice Call はその最初のメッセージに対して従来の `<Say>` TwiML 更新を送信**しない**ため、発信の `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断時の猶予期間

Twilio メディアストリームが切断されると、Voice Call は通話を
自動終了するまで **2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されなかった場合、アクティブな通話が停止状態のまま残ることを防ぐため、通話を終了します。

## 古い通話のリーパー

応答されず、ライブ会話状態にも到達しない通話を終了するには、
`staleCallReaperSeconds`（デフォルトは **120**）を使用します。たとえば、
プロバイダーが終端 Webhook を配信しない通知モードの通話が該当します。無効にするには `0` に
設定します。

リーパーは 30 秒ごとに実行され、`answeredAt` タイムスタンプがなく、
かつ終端状態またはライブ状態（`speaking`/`listening`）にない通話だけを
終了します。そのため、応答済みの会話がこのタイマーによって終了されることはありません。
`maxDurationSeconds`（デフォルトは 300）は、長時間継続する応答済み通話を終了する
別の上限です。

通信事業者による呼び出しまたは応答 Webhook の配信が遅くなる可能性がある通知形式の
フローでは、正常だが遅い通話が早期に終了されないよう、
`staleCallReaperSeconds` をデフォルトより大きくしてください。本番環境では
`120`～`300` 秒が妥当な範囲です。

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

プロキシまたはトンネルが Gateway の前段にある場合、Plugin は署名検証のために
公開 URL を再構築します。次のオプションでは、どの転送ヘッダーを
信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リストに登録します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合のみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護機能：

- Webhook の**リプレイ保護**は、Twilio、Telnyx、Plivo で有効です。再送された有効な Webhook リクエストには確認応答しますが、副作用の処理はスキップします。
- Twilio の会話ターンでは、`<Gather>` コールバックにターンごとのトークンを含めるため、古い、または再送された音声コールバックが、より新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーが要求する署名ヘッダーがない場合、本文を読み取る前に拒否されます。
- voice-call Webhook は、署名検証の前に、共有の認証前本文読み取りプロファイル（本文の最大サイズ 64 KB、読み取りタイムアウト 5 秒）と、キーごとの処理中リクエスト上限（デフォルトではキーごとに同時 8 リクエスト）を使用します。

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
openclaw voicecall call --to "+15555550123" --message "OpenClaw からこんにちは"
openclaw voicecall start --to "+15555550123"   # call のエイリアス
openclaw voicecall continue --call-id <id> --message "ご質問はありますか？"
openclaw voicecall speak --call-id <id> --message "少々お待ちください"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # ログからターンのレイテンシーを要約
openclaw voicecall expose --mode funnel
```

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは
Gateway が所有する voice-call ランタイムに処理を委譲するため、CLI が
2 つ目の Webhook サーバーをバインドすることはありません。到達可能な Gateway がない場合、
コマンドはスタンドアロンの CLI ランタイムにフォールバックします。

`latency` は、デフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使用し、分析を最後の N 件のレコード
（デフォルトは 200）に制限するには `--last <n>` を使用します。出力には、ターンの
レイテンシーと待受時間について、最小値、最大値、平均値、p50、p95 が含まれます。

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

voice-call Plugin には、対応するエージェント Skill が同梱されています。

## Gateway RPC

| メソッド                    | 引数                                                             | 備考                                                                                |
| --------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to` が省略された場合、`toNumber` 設定にフォールバックします。                      |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate` と同じですが、接続前の `dtmfSequence` も受け付けます。                   |
| `voicecall.continue`        | `callId`, `message`                                              | ターンが解決するまでブロックし、文字起こしを返します。                              |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同期バリアント：`operationId` を即座に返します。                                  |
| `voicecall.continue.result` | `operationId`                                                    | 保留中の `voicecall.continue.start` 操作をポーリングして結果を取得します。           |
| `voicecall.speak`           | `callId`, `message`                                              | 待機せずに発話します。`realtime.enabled` の場合はリアルタイムブリッジを使用します。 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                     |
| `voicecall.end`             | `callId`                                                         |                                                                                     |
| `voicecall.status`          | `callId?`                                                        | すべてのアクティブな通話を一覧表示するには、`callId` を省略します。                  |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。通知モードの通話で
接続後の数字入力が必要な場合は、通話の作成後に `voicecall.dtmf` を
使用してください。

## トラブルシューティング

### セットアップで Webhook の公開に失敗する

Gateway を実行する環境と同じ環境でセットアップを実行してください。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が正常でなければなりません。
設定済みの `publicUrl` であっても、ローカルまたはプライベートな
ネットワーク空間を指している場合は失敗します。通信事業者はそれらのアドレスへ
コールバックできないためです。`publicUrl` には、`localhost`、`127.0.0.1`、`0.0.0.0`、
`10.x`、`172.16.x`～`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、
`fd00::/8`、またはその他の通信事業者向け NAT 範囲を使用しないでください。

Twilio の通知モードの発信通話では、最初の `<Say>` TwiML を通話作成リクエスト内で
直接送信するため、最初の音声メッセージは Twilio による Webhook TwiML の取得に
依存しません。ただし、ステータスコールバック、会話通話、接続前の DTMF、
リアルタイムストリーム、接続後の通話制御には、引き続き公開 Webhook が必要です。

公開方法は 1 つだけ使用してください。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // または
          tunnel: { provider: "ngrok" },
          // または
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

`--yes` を渡さない限り、`voicecall smoke` はドライランです。

### プロバイダーの認証情報で失敗する

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

プロバイダーのコンソールが、正確な公開 Webhook URL を指していることを確認します。

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
- プロキシがリクエストを転送する際に、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS によって、公開ホスト名が Gateway 以外の場所にルーティングされている。
- Voice Call Plugin を有効にせずに Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、
`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスには
`webhookSecurity.trustedProxyIPs` を使用します。
`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を
自身で管理している場合にのみ使用してください。

### 署名検証に失敗する

プロバイダーの署名は、OpenClaw が受信リクエストから再構築した公開 URL に対して
検証されます。署名検証に失敗する場合:

- プロバイダーの Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致することを確認する。
- ngrok の無料プランの URL では、トンネルのホスト名が変わったら `publicUrl` を更新する。
- プロキシが元の host および proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定する。
- ローカルテスト以外では `skipSignatureVerification` を有効にしない。

### Google Meet の Twilio 参加に失敗する

Google Meet は、Twilio のダイヤルイン参加にこの Plugin を使用します。まず Voice
Call を確認します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に、Google Meet トランスポートを明示的に確認します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が正常でも Meet の参加者が参加しない場合は、Meet の
ダイヤルイン番号、PIN、`--dtmf-sequence` を確認してください。電話通話自体は正常でも、
DTMF シーケンスが誤っていると、ミーティング側で拒否または無視されることがあります。

Google Meet は、接続前の DTMF シーケンスを指定して `voicecall.start` を呼び出し、
Twilio の電話回線を開始します。PIN から生成されたシーケンスには、Google Meet
Plugin の `voiceCall.dtmfDelayMs`（デフォルト **12000 ms**）が先頭の Twilio
待機数字として含まれます。これは、Meet のダイヤルインプロンプトが遅れて届くことが
あるためです。その後、Voice Call は、開始時の挨拶が要求される前に
リアルタイム処理へリダイレクトします。

ライブのフェーズトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet
参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が消費され、リアルタイム処理の前に提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- Google Meet が DTMF 後の遅延後に `voicecall.speak` で開始時の音声を要求する。

`openclaw voicecall tail` には、引き続き永続化された通話レコードが表示されます。
通話状態や文字起こしの確認には役立ちますが、すべての Webhook/リアルタイム遷移が
表示されるわけではありません。

### リアルタイム通話で音声が出ない

有効な音声モードが 1 つだけであることを確認してください。`realtime.enabled` と
`streaming.enabled` を同時に true にすることはできません。

リアルタイムの Twilio/Telnyx 通話では、さらに以下を確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定であるか、登録済みのプロバイダーを指定している。
- プロバイダーの API キーを Gateway プロセスから利用できる。
- `openclaw logs --follow` に、リアルタイム TwiML の提供、リアルタイムブリッジの開始、開始時の挨拶のキュー追加が表示されている。

## 関連項目

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
