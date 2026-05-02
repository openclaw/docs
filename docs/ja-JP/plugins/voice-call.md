---
read_when:
    - OpenClaw から発信音声通話をかけたい場合
    - voice-call Pluginを設定または開発しています
    - テレフォニーでリアルタイム音声またはストリーミング文字起こしが必要
sidebarTitle: Voice call
summary: Twilio、Telnyx、または Plivo 経由で発信音声通話を行い、着信音声通話を受け付けます。オプションでリアルタイム音声とストリーミング文字起こしを利用できます
title: 音声通話Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin 経由で OpenClaw の音声通話を提供します。発信通知、
マルチターン会話、全二重リアルタイム音声、ストリーミング
文字起こし、許可リストポリシー付きの着信通話をサポートします。

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

    その後、Gateway を再起動して Plugin を読み込ませます。

  </Step>
  <Step title="プロバイダーと Webhook を設定する">
    `plugins.entries.voice-call.config` の下に設定します (完全な形は下の
    [設定](#configuration) を参照してください)。最低限必要なのは、
    `provider`、プロバイダーの認証情報、`fromNumber`、公開アクセス可能な
    Webhook URL です。
  </Step>
  <Step title="セットアップを確認する">
    ```bash
    openclaw voicecall setup
    ```

    デフォルトの出力はチャットログと端末で読みやすい形式です。Plugin の有効化、
    プロバイダー認証情報、Webhook の公開状態、1 つの音声モード
    (`streaming` または `realtime`) だけが有効かどうかを確認します。
    スクリプトでは `--json` を使用します。

  </Step>
  <Step title="スモークテスト">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    どちらもデフォルトではドライランです。実際に短い発信通知通話をかけるには
    `--yes` を追加します。

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio、Telnyx、Plivo では、セットアップが **公開 Webhook URL** に解決される必要があります。
`publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが
local loopback やプライベートネットワーク空間に解決される場合、キャリアの
Webhook を受信できないプロバイダーを起動する代わりに、セットアップは失敗します。
</Warning>

## 設定

`enabled: true` だが選択されたプロバイダーの認証情報が不足している場合、
Gateway の起動時に不足キーを含むセットアップ未完了の警告をログに記録し、
ランタイムの起動をスキップします。コマンド、RPC 呼び出し、エージェントツールは、
使用時に不足しているプロバイダー設定を正確に返します。

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
  <Accordion title="プロバイダーの公開とセキュリティに関する注意">
    - Twilio、Telnyx、Plivo はいずれも **公開アクセス可能な** Webhook URL を必要とします。
    - `mock` はローカル開発用プロバイダーです (ネットワーク呼び出しなし)。
    - Telnyx は、`skipSignatureVerification` が true でない限り `telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) を必要とします。
    - `skipSignatureVerification` はローカルテスト専用です。
    - ngrok 無料枠では、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に適用されます。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が local loopback (ngrok ローカルエージェント) の場合に**のみ**、無効な署名の Twilio Webhook を許可します。ローカル開発専用です。
    - Ngrok の無料枠 URL は変更されたり中間ページの挙動が追加されたりすることがあります。`publicUrl` がずれると、Twilio の署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。

  </Accordion>
  <Accordion title="ストリーミング接続上限">
    - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
    - `streaming.maxPendingConnections` は、未認証の開始前ソケットの合計数に上限を設けます。
    - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの未認証の開始前ソケット数に上限を設けます。
    - `streaming.maxConnections` は、開いているメディアストリームソケットの合計数 (保留中 + アクティブ) に上限を設けます。

  </Accordion>
  <Accordion title="レガシー設定の移行">
    `provider: "log"`、`twilio.from`、またはレガシーな
    `streaming.*` OpenAI キーを使用している古い設定は、`openclaw doctor --fix` によって書き換えられます。
    ランタイムフォールバックは現時点では古い voice-call キーも引き続き受け付けますが、
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
同じ発信者からの繰り返し通話では会話メモリが保持されます。各キャリア通話を
新しいコンテキストで開始する必要がある場合は、`sessionScope: "per-call"` を設定します。
たとえば、受付、予約、IVR、または同じ電話番号が異なる会議を表す可能性のある
Google Meet ブリッジフローなどです。

## リアルタイム音声会話

`realtime` は、ライブ通話音声用の全二重リアルタイム音声プロバイダーを選択します。
これは、音声をリアルタイム文字起こしプロバイダーへ転送するだけの `streaming` とは別です。

<Warning>
`realtime.enabled` は `streaming.enabled` と組み合わせることはできません。
通話ごとに 1 つの音声モードを選択してください。
</Warning>

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声プロバイダーを使用します。
- バンドルされているリアルタイム音声プロバイダー: Google Gemini Live (`google`) と OpenAI (`openai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の生設定は `realtime.providers.<providerId>` の下にあります。
- Voice Call はデフォルトで共有の `openclaw_agent_consult` リアルタイムツールを公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはそれを呼び出せます。
- `realtime.fastContext.enabled` はデフォルトでオフです。有効にすると、Voice Call はまず consult 質問についてインデックス化されたメモリ/セッションコンテキストを検索し、`realtime.fastContext.timeoutMs` 以内にそれらのスニペットをリアルタイムモデルへ返します。`realtime.fastContext.fallbackToConsult` が true の場合にのみ、完全な consult エージェントへフォールバックします。
- `realtime.provider` が未登録のプロバイダーを指している場合、またはリアルタイム音声プロバイダーがまったく登録されていない場合、Voice Call は Plugin 全体を失敗させるのではなく、警告をログに記録してリアルタイムメディアをスキップします。
- Consult セッションキーは、利用可能な場合は保存済みの通話セッションを再利用し、その後、設定された `sessionScope` (デフォルトは `per-phone`、分離された通話では `per-call`) にフォールバックします。

### ツールポリシー

`realtime.toolPolicy` は consult 実行を制御します。

| ポリシー         | 動作                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。 |
| `owner`          | consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。                                             |
| `none`           | consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイムプロバイダーへ渡されます。                                  |

### リアルタイムプロバイダーの例

<Tabs>
  <Tab title="Google Gemini Live">
    デフォルト: API キーは `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY` から取得します。モデルは
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

プロバイダー固有のリアルタイム音声オプションについては、
[Google プロバイダー](/ja-JP/providers/google) と
[OpenAI プロバイダー](/ja-JP/providers/openai) を参照してください。

## ストリーミング文字起こし

`streaming` は、ライブ通話音声用のリアルタイム文字起こしプロバイダーを選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こしプロバイダーを使用します。
- バンドルされているリアルタイム文字起こしプロバイダー: Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`)、xAI (`xai`)。それぞれのプロバイダー Plugin によって登録されます。
- プロバイダー所有の raw config は `streaming.providers.<providerId>` 配下にあります。
- Twilio が受理済みストリームの `start` メッセージを送信した後、Voice Call はストリームを即座に登録し、プロバイダーの接続中は受信メディアを文字起こしプロバイダーへキューし、リアルタイム文字起こしの準備ができてから初回グリーティングを開始します。
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

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin 設定配下で、**同じ形状**で上書きできます。これは `messages.tts` と deep-merge されます。

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
**Microsoft speech は音声通話では無視されます。** 電話音声には PCM が必要です。現在の Microsoft transport は電話向け PCM 出力を公開していません。
</Warning>

挙動メモ:

- Plugin 設定内の従来の `tts.<provider>` キー (`openai`、`elevenlabs`、`microsoft`、`edge`) は `openclaw doctor --fix` によって修復されます。コミットする設定では `tts.providers.<provider>` を使用してください。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話はプロバイダー native の voice にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話向け TTS が利用できない場合、2 つの再生パスを混在させる代わりに再生リクエストは失敗します。
- 電話向け TTS がセカンダリプロバイダーへフォールバックした場合、Voice Call はデバッグ用にプロバイダーチェーン (`from`、`to`、`attempts`) を含む警告をログに記録します。
- Twilio barge-in またはストリームの破棄によって保留中の TTS キューがクリアされると、キュー済みの再生リクエストは、発信者が再生完了を待ったままになる代わりに解決されます。

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
  <Tab title="OpenAI モデルの上書き（deep-merge）">
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
`inboundPolicy: "allowlist"` は信頼度の低い caller-ID スクリーニングです。
Plugin はプロバイダーから提供された `From` 値を正規化し、
`allowFrom` と比較します。Webhook 検証はプロバイダー配信と
ペイロードの完全性を認証しますが、PSTN/VoIP の発信者番号の
所有権を証明するものでは**ありません**。`allowFrom` は強固な発信者
 identity ではなく、caller-ID フィルタリングとして扱ってください。
</Warning>

自動応答はエージェントシステムを使用します。`responseModel`、
`responseSystemPrompt`、`responseTimeoutMs` で調整します。

### 番号ごとのルーティング

1 つの Voice Call Plugin が複数の電話番号への通話を受け、各番号を別の回線のように動作させたい場合は、`numbers` を使用します。たとえば、ある番号ではカジュアルな個人アシスタントを使用し、別の番号ではビジネス用の人格、別の応答エージェント、別の TTS voice を使用できます。

ルートは、プロバイダーから提供された発信先 `To` 番号から選択されます。キーは E.164 番号である必要があります。通話が到着すると、Voice Call は一致するルートを一度だけ解決し、一致したルートを通話レコードに保存し、その有効設定をグリーティング、従来の自動応答パス、リアルタイム相談パス、TTS 再生で再利用します。一致するルートがない場合は、グローバルな Voice Call 設定が使用されます。
発信通話では `numbers` は使用しません。通話を開始するときに、発信先、メッセージ、セッションを明示的に渡してください。

ルート上書きは現在、次をサポートしています。

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` ルート値はグローバルな Voice Call `tts` 設定の上に deep-merge されるため、通常はプロバイダー voice だけを上書きできます。

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

自動応答では、Voice Call は厳格な音声出力コントラクトをシステムプロンプトに追加します。

```text
{"spoken":"..."}
```

Voice Call は防御的に音声テキストを抽出します。

- reasoning/error content としてマークされたペイロードを無視します。
- 直接の JSON、フェンスされた JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画やメタ情報らしい導入段落を削除します。

これにより、音声再生は発信者向けのテキストに集中し、計画テキストが音声へ漏れるのを防げます。

### 会話開始時の挙動

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に関連付けられます。

- barge-in によるキュークリアと自動応答は、初回グリーティングが実際に発話中の場合にのみ抑制されます。
- 初回再生が失敗した場合、通話は `listening` に戻り、初回メッセージは再試行のためキューに残ります。
- Twilio ストリーミングの初回再生は、ストリーム接続時に追加の遅延なしで開始されます。
- barge-in はアクティブな再生を中止し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリは skipped として解決されるため、後続の応答ロジックは再生されない音声を待たずに続行できます。
- リアルタイム音声会話は、リアルタイムストリーム自身のオープニングターンを使用します。Voice Call はその初回メッセージに対して従来の `<Say>` TwiML 更新を投稿**しない**ため、発信 `<Connect><Stream>` セッションは接続されたままになります。

### Twilio ストリーム切断猶予

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に **2000 ms** 待機します。

- その時間内にストリームが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後にストリームが再登録されない場合、アクティブな通話が詰まったままになるのを防ぐため、通話は終了されます。

## 古い通話のリーパー

終端 Webhook を受信しない通話（たとえば、完了しない notify-mode 通話）を終了するには、`staleCallReaperSeconds` を使用します。デフォルトは `0`（無効）です。

推奨範囲:

- **本番:** notify-style フローでは `120`〜`300` 秒。
- 通常の通話が完了できるように、この値は **`maxDurationSeconds` より大きく**してください。よい開始点は `maxDurationSeconds + 30–60` 秒です。

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

Proxy または tunnel が Gateway の前段にある場合、Plugin は署名検証用の公開 URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  転送ヘッダーからのホストを許可リスト化します。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  許可リストなしで転送ヘッダーを信頼します。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  リクエストのリモート IP がリストに一致する場合にのみ、転送ヘッダーを信頼します。
</ParamField>

追加の保護:

- Webhook **リプレイ保護**は Twilio と Plivo で有効です。再送された有効な Webhook リクエストは確認応答されますが、副作用はスキップされます。
- Twilio 会話ターンでは `<Gather>` コールバックにターンごとのトークンが含まれるため、古いまたはリプレイされた音声コールバックが新しい保留中の transcript ターンを満たすことはできません。
- 認証されていない Webhook リクエストは、プロバイダーに必要な署名ヘッダーが欠落している場合、body の読み取り前に拒否されます。
- voice-call Webhook は、共有の pre-auth body profile（64 KB / 5 秒）に加え、署名検証前の IP ごとの in-flight 上限を使用します。

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

Gateway がすでに実行中の場合、運用用の `voicecall` コマンドは Gateway 所有の voice-call runtime に委譲されるため、CLI が 2 つ目の Webhook サーバーをバインドすることはありません。到達可能な Gateway がない場合、コマンドはスタンドアロン CLI runtime にフォールバックします。

`latency` は、デフォルトの音声通話ストレージパスから `calls.jsonl` を読み取ります。
別のログを指定するには `--file <path>` を使用し、解析を直近 N 件のレコード
（デフォルトは 200 件）に制限するには `--last <n>` を使用します。出力には、ターンレイテンシと待ち受け時間の p50/p90/p99 が含まれます。

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

`dtmfSequence` は `mode: "conversation"` の場合にのみ有効です。notify モードの通話で接続後の数字入力が必要な場合は、通話が存在するようになってから `voicecall.dtmf` を使用してください。

## トラブルシューティング

### セットアップで Webhook 公開に失敗する

Gateway を実行しているのと同じ環境からセットアップを実行します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`、`telnyx`、`plivo` では、`webhook-exposure` が緑である必要があります。設定済みの `publicUrl` であっても、ローカルまたはプライベートネットワーク空間を指している場合は失敗します。キャリアがそれらのアドレスへコールバックできないためです。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` は使用しないでください。

Twilio の notify モードのアウトバウンド通話は、最初の `<Say>` TwiML を create-call リクエスト内で直接送信するため、最初に読み上げられるメッセージは Twilio が Webhook TwiML を取得することに依存しません。ただし、ステータスコールバック、conversation 通話、接続前 DTMF、リアルタイムストリーム、接続後の通話制御には、公開 Webhook が引き続き必要です。

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

設定を変更したら、Gateway を再起動またはリロードしてから、次を実行します。

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` は、`--yes` を渡さない限りドライランです。

### プロバイダー認証情報に失敗する

選択されたプロバイダーと必須の認証情報フィールドを確認します。

- Twilio: `twilio.accountSid`、`twilio.authToken`、`fromNumber`、または
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM_NUMBER`。
- Telnyx: `telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey`、および
  `fromNumber`。
- Plivo: `plivo.authId`、`plivo.authToken`、および `fromNumber`。

認証情報は Gateway ホスト上に存在している必要があります。ローカルのシェルプロファイルを編集しても、Gateway が再起動するか環境をリロードするまでは、すでに実行中の Gateway には影響しません。

### 通話は開始するがプロバイダー Webhook が届かない

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
- Gateway の起動後にトンネル URL が変更された。
- プロキシがリクエストを転送しているが、host/proto ヘッダーを削除または書き換えている。
- ファイアウォールまたは DNS が、公開ホスト名を Gateway 以外の場所へルーティングしている。
- Voice Call Plugin が有効でない状態で Gateway が再起動された。

Gateway の前段にリバースプロキシまたはトンネルがある場合は、`webhookSecurity.allowedHosts` を公開ホスト名に設定するか、既知のプロキシアドレスに対して `webhookSecurity.trustedProxyIPs` を使用します。`webhookSecurity.trustForwardingHeaders` は、プロキシ境界を自分で管理している場合にのみ使用してください。

### 署名検証に失敗する

プロバイダー署名は、OpenClaw が受信リクエストから再構築する公開 URL に対して検証されます。署名に失敗する場合:

- プロバイダー Webhook URL が、スキーム、ホスト、パスを含めて `publicUrl` と完全に一致していることを確認します。
- ngrok の無料枠 URL では、トンネルホスト名が変更されたときに `publicUrl` を更新します。
- プロキシが元の host ヘッダーと proto ヘッダーを保持していることを確認するか、`webhookSecurity.allowedHosts` を設定します。
- ローカルテスト以外では `skipSignatureVerification` を有効にしないでください。

### Google Meet の Twilio 参加に失敗する

Google Meet は、Twilio ダイヤルイン参加にこの Plugin を使用します。まず Voice Call を検証します。

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

次に Google Meet トランスポートを明示的に検証します。

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call が緑であるにもかかわらず Meet 参加者が参加しない場合は、Meet のダイヤルイン番号、PIN、`--dtmf-sequence` を確認します。電話通話自体は正常でも、会議が不正な DTMF シーケンスを拒否または無視している可能性があります。

Google Meet は Meet の DTMF シーケンスとイントロテキストを `voicecall.start` に渡します。Twilio 通話では、Voice Call が最初に DTMF TwiML を提供し、Webhook にリダイレクトしてからリアルタイムメディアストリームを開くため、保存されたイントロは電話参加者が会議に参加した後に生成されます。

ライブフェーズのトレースには `openclaw logs --follow` を使用します。正常な Twilio Meet 参加では、次の順序でログが記録されます。

- Google Meet が Twilio 参加を Voice Call に委譲する。
- Voice Call が接続前 DTMF TwiML を保存する。
- Twilio の初期 TwiML が、リアルタイム処理の前に消費され提供される。
- Voice Call が Twilio 通話用のリアルタイム TwiML を提供する。
- リアルタイムブリッジが、初期挨拶をキューに入れた状態で開始する。

`openclaw voicecall tail` には、引き続き永続化された通話レコードが表示されます。通話状態と文字起こしには有用ですが、すべての Webhook/リアルタイム遷移がそこに表示されるわけではありません。

### リアルタイム通話で音声がない

音声モードが 1 つだけ有効になっていることを確認します。`realtime.enabled` と `streaming.enabled` の両方を true にすることはできません。

リアルタイム Twilio 通話では、次も確認してください。

- リアルタイムプロバイダー Plugin が読み込まれ、登録されている。
- `realtime.provider` が未設定、または登録済みプロバイダーの名前である。
- プロバイダー API キーが Gateway プロセスで利用可能である。
- `openclaw logs --follow` に、リアルタイム TwiML が提供され、リアルタイムブリッジが開始され、初期挨拶がキューに入れられたことが表示される。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [音声ウェイク](/ja-JP/nodes/voicewake)
