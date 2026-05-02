---
read_when:
    - OpenClaw から発信音声通話をかけたい場合
    - 音声通話Pluginを設定または開発しています
    - 電話通信でリアルタイム音声またはストリーミング文字起こしが必要な場合
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け付けます。任意でリアルタイム音声とストリーミング文字起こしに対応します
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-05-02T05:03:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw の Plugin による音声通話。アウトバウンド通知、
複数ターンの会話、全二重のリアルタイム音声、ストリーミング
文字起こし、allowlist ポリシー付きのインバウンド通話をサポートします。

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

    npm が OpenClaw 所有のパッケージを deprecated と報告する場合、そのパッケージバージョンは
    古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、
    現在のパッケージ化済み OpenClaw ビルド、またはローカルフォルダーパスを使用してください。

    その後、Plugin を読み込むために Gateway を再起動します。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` 配下に設定します (全体の形は下の
    [設定](#configuration) を参照)。最低限必要なのは、
    `provider`、プロバイダーの認証情報、`fromNumber`、公開到達可能な
    Webhook URL です。
  </Step>
  <Step title="セットアップを確認する">
    ```bash
    openclaw voicecall setup
    ```

    既定の出力はチャットログや端末で読みやすい形式です。
    Plugin の有効化、プロバイダー認証情報、Webhook の公開状態、
    そして音声モード (`streaming` または `realtime`) が 1 つだけ有効であることを
    確認します。スクリプトでは `--json` を使用してください。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらも既定ではドライランです。実際に短いアウトバウンド通知通話を
    発信するには `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
ループバックやプライベートネットワーク空間に解決される場合、キャリアの Webhook を
受信できないプロバイダーを起動する代わりに、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択したプロバイダーに認証情報がない場合、
Gateway 起動時に不足キーを含むセットアップ未完了警告をログに出し、
ランタイムの起動をスキップします。コマンド、RPC 呼び出し、エージェントツールは、
使用時に不足しているプロバイダー設定をそのまま返します。

<Note>
Voice-call の認証情報は SecretRefs を受け付けます。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey`、`plugins.entries.voice-call.config.tts.providers.*.apiKey` は標準の SecretRef サーフェスを通じて解決されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
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
  <Accordion title="プロバイダー公開とセキュリティの注意事項">
    - Twilio、Telnyx、Plivo はすべて、**公開到達可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx では、`skipSignatureVerification` が true でない限り、`telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok の無料枠では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` がループバック (ngrok ローカルエージェント) の場合に限り、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok 無料枠の URL は変更されたり、インタースティシャル動作が追加されたりすることがあります。`publicUrl` がずれると Twilio の署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、認証前の pre-start ソケット総数に上限を設けます。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの認証前 pre-start ソケット数に上限を設けます。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの総数 (保留中 + アクティブ) に上限を設けます。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーな
    `streaming.*` OpenAI キーを使用する古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは、現時点では古い voice-call キーも受け付けますが、
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

## リアルタイム音声会話

`realtime` は、ライブ通話音声向けの全二重リアルタイム音声プロバイダーを選択します。
音声をリアルタイム文字起こしプロバイダーへ転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせられません。通話ごとに
音声モードを 1 つ選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- 同梱のリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の raw config は `realtime.providers.<providerId>` 配下に置きます。
- Voice Call は既定で共有の `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはこれを呼び出せます。
- `realtime.fastContext.enabled` は既定でオフです。有効にすると、Voice Call はまず consult 質問についてインデックス化されたメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 内にそれらのスニペットをリアルタイムモデルへ返します。その後、`realtime.fastContext.fallbackToConsult` が true の場合に限り、フル consult エージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログに出し、リアルタイムメディアをスキップします。
- consult セッションキーは、利用可能な場合は既存の音声セッションを再利用し、その後は発信者/着信者の電話番号へフォールバックします。これにより、通話中の後続 consult 呼び出しでもコンテキストが維持されます。

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
    既定値: `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` からの API キー。モデルは
    `gemini-2.5-flash-native-audio-preview-12-2025`、音声は `Kore`。

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

プロバイダー固有のリアルタイム音声オプションについては、
[Google プロバイダー](/ja-JP/providers/google) と
[OpenAI プロバイダー](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声向けのリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- 同梱のリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の raw config は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call はストリームを即座に登録し、プロバイダーが接続する間は受信メディアを文字起こしプロバイダー経由でキューに入れ、リアルタイム文字起こしの準備ができた後にのみ最初の挨拶を開始します。
- `streaming.provider` が未登録のプロバイダーを指している場合、または何も登録されていない場合、Voice Call は警告をログに記録し、Plugin 全体を失敗させる代わりにメディアストリーミングをスキップします。

### ストリーミングプロバイダーの例

<Tabs>
  <Tab title="OpenAI">
    デフォルト: API キー `streaming.providers.openai.apiKey` または
    `OPENAI_API_KEY`; モデル `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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
    デフォルト: API キー `streaming.providers.xai.apiKey` または `XAI_API_KEY`;
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

Voice Call は通話でストリーミング音声を使うために、コアの `messages.tts` 設定を使用します。Plugin 設定配下で**同じ形状**で上書きできます。これは `messages.tts` とディープマージされます。

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
**Microsoft speech は音声通話では無視されます。** テレフォニー音声には PCM が必要です。現在の Microsoft トランスポートはテレフォニー PCM 出力を公開していません。
</Warning>

動作メモ:

- Plugin 設定内のレガシーな `tts.<provider>` キー (`openai`, `elevenlabs`, `microsoft`, `edge`) は `openclaw doctor --fix` によって修復されます。コミット済み設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダー native の音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態でテレフォニー TTS が利用できない場合、2 つの再生パスを混在させる代わりに再生リクエストは失敗します。
- テレフォニー TTS がセカンダリプロバイダーにフォールバックすると、Voice Call はデバッグ用にプロバイダーチェーン (`from`, `to`, `attempts`) を含む警告をログに記録します。
- Twilio の barge-in またはストリームの破棄によって保留中の TTS キューがクリアされると、キューに入っていた再生リクエストは、発信者を再生完了待ちでハングさせる代わりに解決されます。

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
  <Tab title="OpenAI モデル上書き (ディープマージ)">
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
`inboundPolicy: "allowlist"` は保証度の低い発信者 ID スクリーニングです。この
Plugin はプロバイダーから提供された `From` 値を正規化し、それを
`allowFrom` と比較します。Webhook 検証はプロバイダー配信と
ペイロードの完全性を認証しますが、PSTN/VoIP の発信者番号の
所有権を証明するものでは**ありません**。`allowFrom` は強力な発信者
ID ではなく、発信者 ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 音声出力の契約

自動応答の場合、Voice Call は厳密な音声出力契約をシステムプロンプトに追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に発話テキストを抽出します。

- reasoning/error content としてマークされたペイロードを無視します。
- 直接 JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報らしい導入段落を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声に漏れることを避けられます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に紐づきます。

- barge-in のキュークリアと自動応答は、最初の挨拶がアクティブに話されている間だけ抑制されます。
- 最初の再生が失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio ストリーミングの最初の再生は、ストリーム接続時に追加遅延なしで開始されます。
- barge-in はアクティブな再生を中止し、キューに入っているがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話では、リアルタイムストリーム自身の開始ターンを使用します。Voice Call はその最初のメッセージに対してレガシーな `<Say>` TwiML 更新を投稿**しない**ため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断の猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その時間枠内にストリームが再接続した場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が詰まるのを防ぐために通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受信しない通話 (たとえば、完了しない notify モードの通話) を終了するには、`staleCallReaperSeconds` を使用します。デフォルトは `0` (無効) です。

推奨範囲:

- **本番:** notify スタイルのフローでは `120`–`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく**してください。良い開始点は `maxDurationSeconds + 30–60` 秒です。

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

プロキシまたはトンネルが Gateway の前段にある場合、この Plugin は署名検証用に公開 URL を再構成します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを allowlist にします。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  allowlist なしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストと一致する場合にのみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護** は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio 会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古いまたはリプレイされた音声コールバックが新しい保留中の文字起こしターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーの必須署名ヘッダーが欠落している場合、body の読み取り前に拒否されます。
- voice-call Webhook は、共有の事前認証 body プロファイル (64 KB / 5 秒) に加えて、署名検証前の IP ごとの in-flight 上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは Gateway 所有の voice-call ランタイムに委譲されるため、CLI は 2 つ目の Webhook サーバーを bind しません。到達可能な Gateway がない場合、コマンドはスタンドアロン CLI ランタイムにフォールバックします。

`latency` はデフォルトの voice-call ストレージパスから `calls.jsonl` を読み取ります。別のログを指すには `--file <path>` を使用し、解析を最後の N レコード (デフォルト 200) に制限するには `--last <n>` を使用します。出力にはターンレイテンシと listen-wait 時間の p50/p90/p99 が含まれます。

## エージェントツール

ツール名: `voice_call`.

| アクション      | Args                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

このリポジトリには、対応する skill doc が `skills/voice-call/SKILL.md` に同梱されています。

## Gateway RPC

| メソッド             | Args                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` は `mode: "conversation"` でのみ有効です。notify モードの通話で接続後の数字が必要な場合は、通話が存在するようになった後に `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップで Webhook 公開に失敗する

Gateway を実行するのと同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が green である必要があります。設定済みの `publicUrl` でも、ローカルまたはプライベートネットワーク空間を指している場合は失敗します。これは、通信事業者がそれらのアドレスへコールバックできないためです。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

Twilio の notify-mode 発信通話は、最初の `<Say>` TwiML を create-call リクエストで直接送信するため、最初に読み上げられるメッセージは Twilio が Webhook TwiML を取得できるかどうかに依存しません。ステータスコールバック、会話通話、接続前 DTMF、リアルタイムストリーム、接続後の通話制御には、引き続き公開 Webhook が必要です。

公開する経路を 1 つ使用します。

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

設定を変更したら、Gateway を再起動またはリロードしてから、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は `--yes` を渡さない限りドライランです。

### プロバイダー認証情報が失敗する

選択したプロバイダーと必須の認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、`fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、`fromNumber`。

認証情報は Gateway ホスト上に存在する必要があります。ローカルのシェルプロファイルを編集しても、すでに実行中の Gateway には、再起動または環境のリロードが行われるまで反映されません。

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
- Gateway の起動後にトンネル URL が変わった。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS により、公開ホスト名が Gateway 以外の場所へルーティングされている。
- Voice Call Plugin が有効化されないまま Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスに対して `webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を自分で管理している場合にのみ使用してください。

### 署名検証が失敗する

プロバイダー署名は、受信リクエストから OpenClaw が再構築する公開 URL に対してチェックされます。署名が失敗する場合:

- プロバイダー Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致していることを確認します。
- ngrok の無料枠 URL では、トンネルのホスト名が変わったら `publicUrl` を更新します。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外では `skipSignatureVerification` を有効にしないでください。

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

Voice Call が green でも Meet 参加者が参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認してください。通話自体は正常でも、会議が不正な DTMF シーケンスを拒否または無視していることがあります。

Google Meet は Meet DTMF シーケンスとイントロテキストを `voicecall.start` に渡します。Twilio 通話では、Voice Call が最初に DTMF TwiML を提供し、Webhook にリダイレクトしてから、リアルタイムメディアストリームを開きます。そのため、保存済みのイントロは電話参加者が会議に参加した後に生成されます。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet 参加では、この順序でログに記録されます。

- Google Meet が Twilio 参加を Voice Call に委任する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が消費され、リアルタイム処理の前に提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- リアルタイムブリッジが初期あいさつをキューに入れた状態で開始する。

`openclaw voicecall tail` は引き続き永続化された通話レコードを表示します。通話状態や文字起こしには有用ですが、すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

有効な音声モードが 1 つだけであることを確認します。`realtime.enabled` と `streaming.enabled` を両方とも true にすることはできません。

リアルタイム Twilio 通話では、次も確認します。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定、または登録済みプロバイダーを指定している。
- プロバイダー API キーを Gateway プロセスが利用できる。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始され、初期あいさつがキューに入れられたことが表示される。

## 関連

- [Talk モード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
