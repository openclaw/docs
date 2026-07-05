---
read_when:
    - OpenClaw エージェントに Google Meet 通話へ参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成させたい
    - Google MeetトランスポートとしてChrome、Chromeノード、またはTwilioを設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、エージェントのトークバック既定値を設定する'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-07-05T11:33:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60b47f2a7bfb2e96a1f75daef4f130851e5190e3f600dd48c0675ec6a5cdc12a
    source_path: plugins/google-meet.md
    workflow: 16
---

`google-meet` Pluginは、OpenClawエージェントの代理として明示的なMeet URLに参加します。意図的に範囲を絞っています:

- `https://meet.google.com/...` URLにのみ参加します。自分で検出した電話番号から会議にダイヤルインすることはありません。
- `googlemeet create` はGoogle Meet API（またはブラウザフォールバック）を通じて新しいMeet URLを作成し、デフォルトでそれに参加できます。
- Chrome参加では、サインイン済みのChromeプロファイルを使用します。必要に応じてペアリング済みノード上で実行できます。Twilio参加では、[音声通話Plugin](/ja-JP/plugins/voice-call)を通じて電話番号とPIN/DTMFに発信します。Meet URLへ直接発信することはできません。
- `mode: "agent"`（デフォルト）は、リアルタイムプロバイダーで参加者の発話を書き起こし、設定済みのOpenClawエージェントへルーティングし、通常のOpenClaw TTSで回答を読み上げます。`mode: "bidi"` では、リアルタイム音声モデルが直接応答できます。`mode: "transcribe"` は、応答音声なしの観察専用で参加します。
- Pluginが通話に参加するとき、自動の同意アナウンスはありません。
- CLIコマンドは `googlemeet` です。`meet` は、より広いエージェント電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールしてから、リアルタイムプロバイダーキーを設定します。OpenAIは `agent` モードのデフォルト書き起こしプロバイダーです。Google Gemini Liveは `bidi` モードの音声プロバイダーとして利用できます:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` は、Chromeが経由する `BlackHole 2ch` 仮想音声デバイスをインストールします。Homebrewのインストーラーでは、macOSがデバイスを公開する前に再起動が必要です:

```bash
sudo reboot
```

再起動後、両方を確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Pluginを有効化します:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

セットアップを確認してから参加します:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` の出力はエージェントが読める形式で、モードとトランスポートを考慮します。Chromeプロファイル、ノード固定、リアルタイムChrome参加の場合はBlackHole/SoX音声ブリッジと遅延イントロチェックを報告します。観察専用の参加では、リアルタイムの前提条件をスキップします:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio委任が設定されている場合、`setup` は `voice-call`、Twilio認証情報、公開Webhook公開が準備できているかも報告します。エージェントが参加する前に、そのトランスポート/モードで `ok: false` のチェックはすべてブロッカーとして扱ってください。機械可読出力には `--json` を使用し、事前に特定のトランスポートをプリフライトするには `--transport chrome|chrome-node|twilio` を使用します:

```bash
openclaw googlemeet setup --transport twilio
```

または、エージェントに `google_meet` ツール経由で参加させます:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

macOS以外のGatewayホストでは、`google_meet` はアーティファクト、カレンダー、セットアップ、書き起こし、Twilio、`chrome-node` アクションでは引き続き表示されます。ただし、ローカルChromeの応答音声（`transport: "chrome"` かつ `mode: "agent"` または `"bidi"`）は音声ブリッジに到達する前にブロックされます。このパスは現在macOSの `BlackHole 2ch` に依存しているためです。代わりに `mode: "transcribe"`、Twilioダイヤルイン、またはmacOSの `chrome-node` ホストを使用してください。

### 会議を作成する

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` には2つのパスがあり、結果の `source` フィールドで報告されます:

- **`api`**: Google Meet OAuth認証情報が設定されている場合に使用されます。決定的で、ブラウザUI状態に依存しません。
- **`browser`**: OAuth認証情報がない場合に使用されます。OpenClawは固定されたChromeノードで `https://meet.google.com/new` を開き、Googleが実際の会議コードURLへリダイレクトするのを待ちます。そのノード上のOpenClaw Chromeプロファイルは、すでにGoogleにサインインしている必要があります。参加と作成はどちらも、新しいタブを開く前に既存のMeetタブ（または進行中の `.../new` / Googleアカウントプロンプトタブ）を再利用します。タブ照合では `authuser` のような無害なクエリ文字列を無視します。

`create` はデフォルトで参加し、`joined: true` と参加セッションを返します。URLだけを作成するには、`--no-join`（CLI）または `"join": false`（ツール）を渡します。

APIで作成されるルームでは、Googleアカウントのデフォルトを継承するのではなく、明示的なアクセスポリシーを設定します:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | ノックなしで参加できるユーザー                                      |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Meet URLを持つ全員                                            |
| `TRUSTED`       | ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザー |
| `RESTRICTED`    | 招待されたユーザーのみ                                                       |

これはAPIで作成されるルームにのみ適用されるため、OAuthを設定する必要があります。このオプションが存在する前に認証した場合は、OAuth同意画面に `meetings.space.settings` スコープを追加した後、`openclaw googlemeet auth login --json` を再実行してください。

ブラウザフォールバックがGoogleログインまたはMeet権限ブロッカーに遭遇した場合、ツールは `manualActionRequired: true` とともに `manualActionReason`、`manualActionMessage`、`browser.nodeId`/`browser.targetId`/`browserUrl` を返します。そのメッセージを報告し、オペレーターがブラウザ手順を完了するまで新しいMeetタブを開くのを停止してください。

### 観察専用参加

デュプレックスのリアルタイムブリッジをスキップするには `"mode": "transcribe"` を設定します（BlackHole/SoX要件なし、応答音声なし）。書き起こしモードのChrome参加では、OpenClawのマイク/カメラ権限付与とMeetの **Use microphone** パスもスキップします。Meetが音声選択インタースティシャルを表示した場合、自動化はまず **Continue without microphone** を試します。このモードの管理対象Chromeトランスポートは、ベストエフォートのMeet字幕オブザーバーをインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、`recentTranscript` の末尾を報告します。

はい/いいえのリッスンプローブの場合:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

これは書き起こしモードで参加し、新しい字幕/書き起こしの動きを待って、`listenVerified`、`listenTimedOut`、手動アクションフィールド、現在の字幕ヘルスを返します。

### リアルタイムセッションヘルス

応答音声セッション中、`google_meet` のステータスはChrome/音声ブリッジのヘルスを報告します: `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後の入力/出力タイムスタンプ、バイトカウンター、ブリッジクローズ状態。管理対象Chromeセッションは、ヘルスが `inCall: true` を報告した後にのみイントロ/テストフレーズを発話します。それ以外の場合は `speechReady: false` となり、発話試行は無音で何もしないのではなくブロックされます。

ローカルChrome参加は、サインイン済みのOpenClawブラウザプロファイルを通じて行われ、マイク/スピーカーパスには `BlackHole 2ch` が必要です。最初のスモークテストには単一のBlackHoleデバイスで十分ですが、エコーが発生する可能性があります。クリーンなデュプレックス音声には、個別の仮想デバイスまたはLoopback形式のグラフを使用してください。

## ローカルGateway + Parallels Chrome

macOS VMにChromeを提供するだけなら、完全なGatewayやモデルAPIキーはVM内に不要です。Gatewayとエージェントはローカルで実行し、VM内でノードホストを実行します。

| 実行場所           | 内容                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gatewayホスト         | OpenClaw Gateway、エージェントワークスペース、モデル/APIキー、リアルタイムプロバイダー、Google Meet Plugin設定 |
| Parallels macOS VM   | OpenClaw CLI/ノードホスト、Chrome、SoX、BlackHole 2ch、Googleにサインイン済みのChromeプロファイル        |
| VM内では不要 | Gatewayサービス、エージェント設定、モデルプロバイダーセットアップ                                             |

VM依存関係をインストールし、再起動して確認します:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM内でPluginを有効化し、ノードホストを開始します:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` がTLSなしのLAN IPの場合、その信頼済みプライベートネットワークに明示的に許可します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

LaunchAgentとしてインストールする場合も同じフラグを使用します（これはプロセス環境であり、インストールコマンドに存在する場合はLaunchAgent環境に保存されます。`openclaw.json` 設定ではありません）:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Gatewayホストからノードを承認し、その後 `googlemeet.chrome` とブラウザ機能/`browser.proxy` の両方をアドバタイズしていることを確認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

そのノード経由でMeetをルーティングします:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

これでGatewayホストから通常どおり参加できます:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

セッションを作成または再利用し、既知のフレーズを発話し、セッションヘルスを出力するワンコマンドのスモークテスト:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、ブラウザ自動化はゲスト名を入力し、Join/Ask to joinをクリックし、Meetの初回実行時の「Use microphone」プロンプトが表示された場合は承認します（観察専用参加とブラウザのみの会議作成では「Continue without microphone」）。プロファイルがサインアウトしている、Meetがホストの承認待ちである、Chromeにマイク/カメラ権限が必要である、またはMeetが未解決のプロンプトで停止している場合、結果は `manualActionRequired: true` と `manualActionReason`、`manualActionMessage` を報告します。再試行を停止し、そのメッセージと `browserUrl`/`browserTitle` を報告し、手動アクションが完了した後にのみ再試行してください。

`chromeNode.node` を省略した場合、OpenClawは、接続済みノードのうち `googlemeet.chrome` とブラウザ制御の両方をアドバタイズするものが1つだけの場合にのみ自動選択します。対応ノードが複数接続されている場合は、`chromeNode.node`（ノードID、表示名、またはリモートIP）を固定してください。

### よくある失敗チェック

| 症状                                                     | 修正                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Configured Google Meet node ... is not usable: offline` | 固定されたノードは既知ですが利用できません。セットアップのブロッカーを報告してください。依頼がない限り、別のトランスポートへ黙ってフォールバックしないでください。                                                                                                      |
| `No connected Google Meet-capable node`                  | VM 内で `openclaw node run` を実行し、ペアリングを承認して、そこで `openclaw plugins enable google-meet` と `openclaw plugins enable browser` を実行します。`gateway.nodes.allowCommands` に `googlemeet.chrome` と `browser.proxy` が含まれることを確認してください。 |
| `BlackHole 2ch audio device not found`                   | チェック対象のホストに `blackhole-2ch` をインストールし、再起動します。                                                                                                                                                                                                  |
| `BlackHole 2ch audio device not found on the node`       | VM に `blackhole-2ch` をインストールし、VM を再起動します。                                                                                                                                                                                                              |
| Chrome が開くが参加できない                              | VM 内のブラウザープロファイルにサインインするか、`chrome.guestName` を設定したままにします。ゲスト自動参加は、ノードのブラウザープロキシ経由で OpenClaw ブラウザー自動化を使用します。ノードの `browser.defaultProfile`（または名前付きの既存セッションプロファイル）を、使用したいプロファイルに向けてください。 |
| Meet タブが重複する                                      | `chrome.reuseExistingTab: true` のままにします。OpenClaw は同じ URL の既存タブをアクティブ化し、別のタブを開く前に、進行中の `.../new` または Google アカウントのプロンプトタブを再利用して作成します。                                                                  |
| 音声がない                                               | Meet のマイク/スピーカーを OpenClaw が使用する仮想音声パス経由にルーティングします。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback スタイルのルーティングを使用してください。                                                                             |

## インストールメモ

Chrome のトークバック既定値は、OpenClaw が同梱または再配布しない 2 つの外部ツールを使用します。Homebrew 経由でホスト依存関係としてインストールしてください。

- `sox`: コマンドライン音声ユーティリティ。Plugin は、既定の 24 kHz PCM16 音声ブリッジ用に明示的な CoreAudio デバイスコマンドを発行します。
- `blackhole-2ch`: Chrome/Meet が経由してルーティングする `BlackHole 2ch` デバイスを提供する macOS 仮想音声ドライバー。

SoX のライセンスは `LGPL-2.0-only AND GPL-2.0-only` です。BlackHole は GPL-3.0 です。BlackHole を OpenClaw と同梱するインストーラーまたはアプライアンスを構築する場合は、BlackHole のアップストリームライセンスを確認するか、Existential Audio から別のライセンスを取得してください。

## トランスポート

| トランスポート | 使用する場合                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `chrome`       | Chrome/音声が Gateway ホスト上にある場合                                                             |
| `chrome-node`  | Chrome/音声がペアリング済みノード上にある場合（例: Parallels macOS VM）                              |
| `twilio`       | Chrome 参加が利用できない場合に、Voice Call Plugin 経由で電話ダイヤルインへフォールバックする場合 |

### Chrome

OpenClaw ブラウザー制御を通じて Meet URL を開き、サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin は起動前に `BlackHole 2ch` をチェックし、設定されている場合は Chrome を開く前に音声ブリッジのヘルス/起動コマンドを実行します。ローカル Chrome では `browser.defaultProfile` でプロファイルを選択します。`chrome.browserProfile` は代わりに `chrome-node` ホストへ渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイク/スピーカー音声はローカル OpenClaw 音声ブリッジを経由してルーティングされます。`BlackHole 2ch` がインストールされていない場合、音声パスなしで参加するのではなく、セットアップエラーで参加に失敗します。

### Twilio

[Voice call Plugin](/ja-JP/plugins/voice-call) に委任される厳格なダイヤルプランです。Meet ページから電話番号を解析しません。Google Meet は、その会議の電話ダイヤルイン番号と PIN を公開している必要があります。

Chrome ノードではなく、Gateway ホストで Voice Call を有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // または、Twilio を既定にする場合は "twilio" を設定
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "この Google Meet に OpenClaw エージェントとして参加してください。簡潔にしてください。",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

シークレットを `openclaw.json` に入れないように、環境経由で Twilio 認証情報を指定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

OpenAI がリアルタイム音声プロバイダーの場合は、代わりに `OPENAI_API_KEY` とともに `realtime.provider: "openai"` を使用します。

`voice-call` を有効にした後、Gateway を再起動またはリロードしてください。Plugin 設定の変更はリロードまで有効になりません。確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委任が接続されている場合、`googlemeet setup` には `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

カスタムシーケンスには `--dtmf-sequence` を使用します。PIN の前に一時停止を入れるには、先頭に `w` またはカンマを付けます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth と事前チェック

OAuth は Meet リンク作成では任意です。`googlemeet create` はブラウザー自動化にフォールバックできるためです。公式 API 作成、スペース解決、または Meet Media API 事前チェックには OAuth を設定してください。Chrome/Chrome-node 参加は OAuth に依存しません。いずれの場合も、サインイン済み Chrome プロファイル、BlackHole/SoX、（`chrome-node` の場合は）接続済みノードを使用します。

### Google 認証情報を作成する

Google Cloud Console で:

<Steps>
<Step title="プロジェクトを作成または選択する">
</Step>
<Step title="Google Meet REST API を有効にする">
</Step>
<Step title="OAuth 同意画面を設定する">
Google Workspace 組織では Internal が最も簡単です。個人/テストのセットアップでは External が機能します。アプリが Testing の間は、認可する各 Google アカウントをテストユーザーとして追加してください。
</Step>
<Step title="要求されたスコープを追加する">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`（Calendar ルックアップ）
- `https://www.googleapis.com/auth/drive.meet.readonly`（文字起こし/スマートノートのドキュメント本文エクスポート）

</Step>
<Step title="OAuth クライアント ID を作成する">
アプリケーションの種類は **Web application**。承認済みリダイレクト URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="クライアント ID とクライアントシークレットをコピーする">
</Step>
</Steps>

`meetings.space.created` は `spaces.create` に必要です。`meetings.space.readonly` は Meet URL/コードをスペースに解決します。`meetings.space.settings` により、OpenClaw は API ルーム作成中に `accessType` などの `SpaceConfig` 設定を渡せます。`meetings.conference.media.readonly` は Meet Media API 事前チェックとメディア作業用です。実際の Media API 使用には、Google が Developer Preview への登録を要求する場合があります。`calendar.events.readonly` は `--today`/`--event` のカレンダールックアップにのみ必要です。`drive.meet.readonly` は `--include-doc-bodies` エクスポートにのみ必要です。ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全にスキップしてください。

### リフレッシュトークンを発行する

`oauth.clientId` と、任意で `oauth.clientSecret` を設定するか（または環境変数として渡し）、次を実行します。

```bash
openclaw googlemeet auth login --json
```

これは `http://localhost:8085/oauth2callback` の localhost コールバックで PKCE フローを実行し、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。ブラウザーがローカルコールバックに到達できない場合は、コピー/ペーストフロー用に `--manual` を追加します。

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 出力:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Plugin 設定の下に `oauth` オブジェクトを保存します。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

リフレッシュトークンを設定に入れたくない場合は、環境変数を優先してください。設定が最初に解決され、その後フォールバックとして環境が使われます。会議作成、カレンダールックアップ、またはドキュメント本文エクスポートのサポートが存在する前に認証した場合は、リフレッシュトークンが現在のスコープセットをカバーするように `openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を確認する

```bash
openclaw googlemeet doctor --oauth --json
```

これは、Chrome ランタイムを読み込んだり接続済みノードを要求したりせずに、OAuth 設定が存在し、リフレッシュトークンでアクセストークンを発行できることを確認します。レポートにはステータスフィールド（`ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージ）のみが含まれ、アクセストークン、リフレッシュトークン、クライアントシークレットは決して出力されません。

| チェック             | 意味                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュされたアクセストークンが存在する |
| `oauth-token`        | キャッシュされたアクセストークンがまだ有効、またはリフレッシュトークンが新しいものを発行した |
| `meet-spaces-get`    | 任意の `--meeting` チェックで既存の Meet スペースを解決した                              |
| `meet-spaces-create` | 任意の `--create-space` チェックで新しい Meet スペースを作成した                         |

副作用を伴う作成チェックで、Meet API の有効化と `spaces.create` スコープを証明します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

既存スペースへの読み取りアクセスを証明します。

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

これらのチェックで `403` が返る場合、通常は Meet REST API が無効、リフレッシュトークンに必要なスコープがない、またはその Google アカウントがそのスペースへアクセスできないことを意味します。リフレッシュトークンエラーの場合は、`openclaw googlemeet auth login --json` を再実行し、新しい `oauth` ブロックを保存します。

ブラウザフォールバックには OAuth は不要です。そこでの Google 認証は OpenClaw 設定ではなく、選択されたノード上のログイン済み Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け付けられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

### 解決、事前チェック、アーティファクトの読み取り

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。保持されているすべてのレコードを対象にするには `--all-conference-records` を渡します。

カレンダー検索は、アーティファクトを読み取る前に Google Calendar から会議 URL を解決します（Calendar events readonly スコープを含むリフレッシュトークンが必要です）。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は今日の `primary` カレンダーから Meet リンク付きのイベントを検索します。`--event <query>` は一致するイベントテキストを検索します。`--calendar <id>` は非 primary カレンダーを対象にします。`calendar-events` は一致するイベントをプレビューし、`latest`/`artifacts`/`attendance`/`export` がどれを選択するかを示します。

会議レコード ID がすでに分かっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

API で作成されたスペースのルームを閉じます。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

`spaces.endActiveConference` を呼び出し、承認済みアカウントが管理できるスペースに対して `meetings.space.created` スコープを持つ OAuth が必要です。Meet URL、会議コード、または `spaces/{id}` を受け付け、まず API スペースリソースへ解決します。これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止します。`end-active-conference` はそのスペースのアクティブな会議を終了するよう Google Meet に要求します。

読みやすいレポートを書き出します。

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` は、Google が公開している場合、会議レコードのメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートのリソースメタデータを返します。`--no-transcript-entries` は大規模な会議でエントリ検索をスキップします。`attendance` は参加者を参加者セッション行へ展開し、初回/最終検出時刻、合計セッション時間、遅刻/早退フラグ、ログイン済みユーザーまたは表示名でマージされた重複参加者リソースを含めます。`--no-merge-duplicates` は生のリソースを分離したままにし、`--late-after-minutes`/`--early-before-minutes` はしきい値を調整します。

`export` は `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。`manifest.json` は、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された Calendar イベント、部分取得の警告を記録します。`--zip` はフォルダーの隣にポータブルアーカイブも書き出します。`--include-doc-bodies` は、Drive `files.export` を通じてリンクされた文字起こし/スマートノートの Google Docs テキストをエクスポートします（Drive Meet readonly スコープが必要です）。指定しない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。部分的なアーティファクト失敗（スマートノート一覧、文字起こしエントリ、またはドキュメント本文エラー）は、エクスポート全体を失敗させる代わりに、警告を summary/manifest に保持します。`--dry-run` は同じデータを取得し、フォルダーや ZIP を作成せずに manifest JSON を出力します。

エージェントは `google_meet` ツール（`export`、`accessType` 付きの `create`、`end_active_conference`、`test_listen`）を通じて同じアクションを使用します。[ツール](#tool) を参照してください。

### ライブスモークテスト

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| 変数                                                                                                                      | 目的                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | ガード付きライブテストを有効にします                                   |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | 保持されている Meet URL、コード、または `spaces/{id}`                  |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth クライアント ID                                                  |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | リフレッシュトークン                                                   |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 任意。`OPENCLAW_` プレフィックスなしの同じフォールバック名も動作します |

基本のアーティファクト/出席スモークには `meetings.space.readonly` と `meetings.conference.media.readonly` が必要です。カレンダー検索には `calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには `drive.meet.readonly` が必要です。

### 作成例

```bash
openclaw googlemeet create
```

新しい会議 URI、ソース、参加セッションを出力します。OAuth ありでは Meet API を使用します。なしでは固定された Chrome ノードのログイン済みプロファイルを使用します。ブラウザフォールバック JSON:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

ブラウザフォールバックが先に Google ログインまたは Meet 権限ブロッカーに当たった場合、`google_meet` はプレーン文字列ではなく構造化された詳細を返します。

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

API 作成 JSON:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

作成時はデフォルトで参加しますが、Chrome/Chrome-node でブラウザ経由で参加するには、ログイン済みの Google プロファイルが引き続き必要です。ログアウトしている場合、OpenClaw は `manualActionRequired: true` またはブラウザフォールバックエラーを報告し、再試行前にオペレーターへ Google ログインの完了を求めます。

Cloud プロジェクト、OAuth プリンシパル、会議参加者が Meet media APIs 向け Google Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定します。

## 設定

一般的な Chrome エージェントパスに必要なのは、Plugin の有効化、BlackHole、SoX、リアルタイムプロバイダーキー、設定済みの OpenClaw TTS プロバイダーだけです。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

### デフォルト

| キー                              | デフォルト                               | 注記                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` は `"agent"` のレガシーエイリアスとして受け入れられます。新しい呼び出し元は `"agent"` を指定してください                                                                                            |
| `chromeNode.node`                 | 未設定                                   | `chrome-node` の Node ID/名前/IP。対応可能な Node が複数接続される可能性がある場合に必須                                                                                                                         |
| `chrome.launch`                   | `true`                                   | 参加のために Chrome を起動します。すでに開いているセッションを再利用する場合にのみ `false` を設定してください                                                                                                     |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | サインアウト状態の Meet ゲスト画面に表示されます                                                                                                                                                                  |
| `chrome.autoJoin`                 | `true`                                   | `chrome-node` 上で、ゲスト名入力と「今すぐ参加」クリックをベストエフォートで実行します                                                                                                                            |
| `chrome.reuseExistingTab`         | `true`                                   | 重複して開く代わりに、既存の Meet タブをアクティブ化します                                                                                                                                                        |
| `chrome.waitForInCallMs`          | `20000`                                  | トークバックのイントロが発火する前に、Meet タブが通話中を報告するまで待機します                                                                                                                                   |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | コマンドペアの音声形式。`"g711-ulaw-8khz"` は、電話音声を出力するレガシー/カスタムのコマンドペア専用です                                                                                                         |
| `chrome.audioBufferBytes`         | `4096`                                   | 生成されたコマンドペア音声コマンド用の SoX 処理バッファー（SoX のデフォルト 8192 バイトバッファーの半分で、パイプ遅延を下げます）。値は最小 17 バイトに制限されます                                             |
| `chrome.audioInputCommand`        | 生成された SoX コマンド                  | CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` の音声を書き込みます                                                                                                                                 |
| `chrome.audioOutputCommand`       | 生成された SoX コマンド                  | `chrome.audioFormat` の音声を読み取り、CoreAudio `BlackHole 2ch` に書き込みます                                                                                                                                   |
| `chrome.bargeInInputCommand`      | 未設定                                   | アシスタント再生中の人間による割り込み検出のため、符号付き 16 ビットリトルエンディアンのモノラル PCM を書き込む任意のローカルマイクコマンド。Gateway ホストのコマンドペアブリッジに適用されます                 |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 人間の割り込みとしてカウントされる RMS レベル                                                                                                                                                                     |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 人間の割り込みとしてカウントされるピークレベル                                                                                                                                                                    |
| `chrome.bargeInCooldownMs`        | `900`                                    | 繰り返し発生する割り込みクリア間の最小遅延                                                                                                                                                                        |
| `mode`（リクエスト単位）          | `"agent"`                                | トークバックモード。[Agent と bidi モード](#agent-and-bidi-modes)の表を参照してください                                                                                                                          |
| `realtime.provider`               | `"openai"`                               | 下記のスコープ付きフィールドが未設定の場合に使用される互換性フォールバック                                                                                                                                        |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` モードがリアルタイム文字起こしに使用するプロバイダー ID                                                                                                                                                   |
| `realtime.voiceProvider`          | 未設定                                   | `bidi` モードが直接リアルタイム音声に使用するプロバイダー ID。エージェントモードの文字起こしを OpenAI のままにしつつ Gemini Live を使うには `"google"` に設定します。特定の Gemini Live モデルを選ぶには `realtime.model` と組み合わせます。 |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | [Agent と bidi モード](#agent-and-bidi-modes)を参照してください                                                                                                                                                   |
| `realtime.instructions`           | 短い音声応答の指示                       | モデルに短く話し、より深い回答には `openclaw_agent_consult` を使うよう伝えます                                                                                                                                    |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | リアルタイムブリッジ接続時に一度だけ発話されます。無音で参加するには `""` に設定してください                                                                                                                     |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult` に使用される OpenClaw エージェント ID                                                                                                                                                    |
| `voiceCall.enabled`               | `true`                                   | Twilio PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委任します                                                                                                                                             |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | PIN 由来の DTMF シーケンスを Twilio 経由で再生する前の先行待機                                                                                                                                                    |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call が Twilio レッグを開始した後、リアルタイムのイントロ挨拶をリクエストするまでの遅延                                                                                                                    |

`chrome.audioBridgeCommand` と `chrome.audioBridgeHealthCommand` を使うと、`chrome.audioInputCommand`/`chrome.audioOutputCommand` の代わりに外部ブリッジがローカル音声パス全体を所有できます。どのモードで使用できるかの制約については[注記](#notes)を参照してください。

レガシーの `realtime.provider: "google"` 形状には `openclaw doctor --fix` マイグレーションがあります。これらのフィールドがまだ設定されていない場合、その意図を `realtime.voiceProvider: "google"` と `realtime.transcriptionProvider: "openai"` に移します。

### 任意のオーバーライド

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

エージェントモードのリスニングと発話の両方に ElevenLabs を使う場合:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

永続的な Meet 音声は `messages.tts.providers.elevenlabs.speakerVoiceId` から取得されます。TTS モデルのオーバーライドが有効な場合、エージェントの返信では返信単位の `[[tts:speakerVoiceId=... model=eleven_v3]]` ディレクティブも使用できますが、会議では設定が決定的なデフォルトです。参加時、ログには `transcriptionProvider=elevenlabs` が表示され、各音声返信のログには `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` が表示されます。

Twilio 専用設定:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled: true`（デフォルト）かつ Twilio トランスポートの場合、Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを送信し、その後、保存済みのイントロテキストを初回のリアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話を発信することはできません。

## ツール

エージェントは `google_meet` ツールを使用します:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | 目的                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | 明示的な Meet URL に参加する                                                                      |
| `create`                | スペースを作成する（デフォルトで参加もする）。`accessType`/`entryPointAccess` をサポートする      |
| `status`                | アクティブなセッションを一覧表示する、または `sessionId` で 1 つを調べる                          |
| `setup_status`          | `googlemeet setup` と同じチェックを実行する                                                       |
| `resolve_space`         | `spaces.get` で URL/コード/`spaces/{id}` を解決する                                               |
| `preflight`             | OAuth とミーティング解決の前提条件を検証する                                                      |
| `latest`                | ミーティングの最新の会議レコードを見つける                                                        |
| `calendar_events`       | Meet リンク付きの Calendar イベントをプレビューする                                               |
| `artifacts`             | 会議レコードと参加者/録画/文字起こし/スマートノートのメタデータを一覧表示する                    |
| `attendance`            | 参加者と参加者セッションを一覧表示する                                                            |
| `export`                | アーティファクト/出席/文字起こし/マニフェストのバンドルを書き出す。マニフェストのみなら `"dryRun": true` を設定する |
| `recover_current_tab`   | 新しいタブを開かずに既存の Meet タブへフォーカス/検査する                                        |
| `leave`                 | セッションを終了する（委任セッションでは基盤の Twilio 通話を切断する）                            |
| `end_active_conference` | API 管理スペースのアクティブな Google Meet 会議を終了する                                         |
| `speak`                 | `sessionId` と `message` を指定して、リアルタイムエージェントに即座に話させる                     |
| `test_speech`           | セッションを作成/再利用し、既知のフレーズをトリガーし、Chrome の健全性を返す                     |
| `test_listen`           | 観察専用セッションを作成/再利用し、キャプション/文字起こしの動きを待つ                           |

`test_speech` は常に `mode: "agent"` または `"bidi"` を強制し、`mode: "transcribe"` で実行するよう求められると失敗します。観察専用セッションは音声を出力できないためです。その `speechOutputVerified` 結果は、その呼び出し中にリアルタイム音声出力バイト数が増加したかに基づくため、古い音声がある再利用セッションは新しいチェックとしては数えられません。

Chrome が Gateway ホストで実行される場合は `transport: "chrome"` を使用し、ペアリング済みノードで実行される場合は `transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと `openclaw_agent_consult` は Gateway ホストで実行されるため、モデル認証情報はそこに留まります。エージェントモードのログには、ブリッジ起動時に解決された文字起こしプロバイダー/モデルと、各合成応答後の TTS プロバイダー/モデル/音声/出力形式/サンプルレートが含まれます。生の `mode: "realtime"` は `mode: "agent"` のレガシー互換エイリアスとしてまだ受け付けられますが、ツールの `mode` enum ではもう案内されません。

API バックのルームと明示的なアクセス ポリシーで `create` する例:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

既知のルームのアクティブな会議を終了する例:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

ミーティングが有用だと主張する前の、リッスン優先の検証:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

オンデマンドで発話する例:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

`status` には、利用可能な場合 Chrome の健全性が含まれます:

| フィールド                                                            | 意味                                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome は Meet 通話内にいるように見える                                                                                |
| `micMuted`                                                            | ベストエフォートの Meet マイク状態                                                                                     |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 音声が動作する前に、ブラウザプロファイルで手動ログイン、Meet ホストの入室許可、権限、またはブラウザ制御の修復が必要   |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 管理対象 Chrome の音声が現在許可されているか。`speechReady: false` は OpenClaw が導入/テストフレーズを送信しなかったことを意味する |
| `providerConnected` / `realtimeReady`                                 | リアルタイム音声ブリッジの状態                                                                                         |
| `lastInputAt` / `lastOutputAt`                                        | ブリッジから最後に確認された/ブリッジへ送信された音声                                                                  |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet タブのメディア出力がブリッジの BlackHole デバイスへアクティブにルーティングされたか                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | アシスタント再生がアクティブな間に無視されたループバック入力                                                           |

## エージェントと bidi モード

| モード  | 回答を決める主体              | 音声出力パス                           | 使用する場面                                           |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 設定済みの OpenClaw エージェント | 通常の OpenClaw TTS ランタイム         | 「自分のエージェントがミーティングにいる」挙動が必要な場合 |
| `bidi`  | リアルタイム音声モデル        | リアルタイム音声プロバイダーの音声応答 | 最低レイテンシの会話音声ループが必要な場合             |

`agent` モード: リアルタイム文字起こしプロバイダーがミーティング音声を聞き、最終的な参加者の文字起こしは設定済みの OpenClaw エージェントへルーティングされ、回答は通常の OpenClaw TTS を通じて発話されます。近接する最終文字起こし断片は consult の前に結合されるため、1 回の発話ターンで古い部分回答が複数生成されることはありません。キューに入ったアシスタント音声がまだ再生中の間はリアルタイム入力が抑制され、最近のアシスタントらしい文字起こしエコーは consult の前に無視されるため、BlackHole ループバックによってエージェントが自分自身の発話に回答することはありません。

`bidi` モード: リアルタイム音声モデルが直接回答し、より深い推論、最新情報、または通常の OpenClaw ツールのために `openclaw_agent_consult` を呼び出せます。consult ツールは、最近のミーティング文字起こしコンテキストを使って通常の OpenClaw エージェントを背後で実行し、簡潔な発話用回答を返します。`agent` モードでは OpenClaw がその回答を直接 TTS に送信し、`bidi` モードではリアルタイム音声モデルがそれを発話できます。これは Voice Call と同じ共有 consult 機構を使用します。

デフォルトでは consult は `main` エージェントに対して実行されます。Meet レーンを専用のエージェントワークスペース、モデルデフォルト、ツールポリシー、メモリ、セッション履歴に向けるには `realtime.agentId` を設定します。エージェントモードの consult は、ミーティングごとの `agent:<id>:subagent:google-meet:<session>` セッションキーを使用するため、フォローアップの質問は通常のエージェントポリシーを継承しながらミーティングコンテキストを維持します。エージェントがエージェントモードで `google_meet` を呼び出すと、consultant セッションは参加者の発話に回答する前に呼び出し元の現在の文字起こしをフォークします。Meet セッションは分離されたままなので、ミーティングのフォローアップが呼び出し元の文字起こしを直接変更することはありません。

`realtime.toolPolicy` は consult 実行を制御します:

| ポリシー         | 挙動                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult ツールを公開する。通常のエージェントを `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` に制限する |
| `owner`          | consult ツールを公開する。通常のエージェントに通常のツールポリシーを使わせる                                                     |
| `none`           | consult ツールをリアルタイム音声モデルに公開しない                                                                               |

consult セッションキーは Meet セッションごとにスコープされるため、同じミーティング中のフォローアップ consult 呼び出しは以前の consult コンテキストを再利用します。

Chrome が完全に参加した後に発話準備チェックを強制する例:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

参加して発話する完全なスモーク:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテスト チェックリスト

無人エージェントにミーティングを引き渡す前に:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node 状態:

- `googlemeet setup` はすべて緑で、Chrome-node がデフォルト transport の場合、またはノードが固定されている場合は `chrome-node-connected` を含む。
- `nodes status` は、選択されたノードが接続され、`googlemeet.chrome` と `browser.proxy` の両方を広告していることを示す。
- Meet タブが参加し、`test-speech` は `inCall: true` を含む Chrome の健全性を返す。

Parallels macOS VM などのリモート Chrome ホストでは、Gateway または VM 更新後の最短の安全なチェックは次のとおりです:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際のミーティングタブを開く前に、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることを証明できます。

Twilio スモークでは、電話ダイヤルイン詳細を公開しているミーティングを使用します:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待される Twilio 状態:

- `googlemeet setup` は緑の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックを含む。
- Gateway リロード後、CLI で `voicecall` が利用可能である。
- 返されたセッションには `transport: "twilio"` と `twilio.voiceCallId` がある。
- `openclaw logs --follow` は、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、初期挨拶がキューに入ったリアルタイムブリッジを示す。
- `googlemeet leave <sessionId>` は委任された音声通話を切断する。

## トラブルシューティング

### エージェントが Google Meet ツールを認識できない

Plugin が有効であることを確認し、Gateway をリロードします。実行中のエージェントは、現在の Gateway プロセスによって登録された Plugin ツールだけを認識します:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

非 macOS の Gateway ホストでは、`google_meet` は表示されたままですが、ローカル Chrome のトークバックアクションは音声ブリッジに到達する前にブロックされます。デフォルトのローカル Chrome エージェントパスではなく、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### 接続済みの Google Meet 対応ノードがない

ノードホスト上で:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードは接続済みで、`googlemeet.chrome` と `browser.proxy` を列挙している必要があります。Gateway 設定では両方を許可する必要があります:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` で失敗する場合、または Gateway ログが `gateway token mismatch` を報告する場合は、現在の Gateway トークンでノードを再インストールまたは再起動してください:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、ノードサービスを再読み込みして再実行します:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザは開くがエージェントが参加できない

観察のみの参加には `googlemeet test-listen`、リアルタイム参加には `googlemeet test-speech` を実行し、返された Chrome ヘルスを確認します。どちらかが `manualActionRequired: true` を報告した場合は、オペレーターに `manualActionMessage` を表示し、ブラウザアクションが完了するまで再試行を停止してください。

よくある手動アクション: Chrome プロファイルにサインインする、Meet ホストアカウントからゲストを承認する、ネイティブプロンプトが表示されたときに Chrome のマイク/カメラ権限を付与する、固着した Meet 権限ダイアログを閉じるか修復する。

Meet が「会議で他のユーザーにあなたの音声を聞こえるようにしますか?」と尋ねるだけで「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は利用可能な場合、ブラウザ自動化を通じて **マイクを使用** をクリックし、実際の会議状態を待ち続けます。作成のみのブラウザフォールバックでは、リアルタイム音声パスが URL の発行に不要なため、代わりに **マイクなしで続行** をクリックする場合があります。

### 会議作成に失敗する

`googlemeet create` は、OAuth が設定されている場合は Meet API の `spaces.create` を使用し、それ以外の場合は固定された Chrome ノードブラウザを使用します。確認してください:

- **API 作成**: `oauth.clientId` と `oauth.refreshToken`（または対応する `OPENCLAW_GOOGLE_MEET_*` 環境変数）が存在し、更新トークンが作成サポートの追加後に発行されていること。古いトークンには `meetings.space.created` がない場合があるため、`openclaw googlemeet auth login --json` を再実行してください。
- **ブラウザフォールバック**: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済みノードを指していること。そのノード上の OpenClaw Chrome プロファイルがサインイン済みで、`https://meet.google.com/new` を開けること。
- **ブラウザフォールバックの再試行**: 新しいタブを開く前に、既存の `.../new` または Google アカウントプロンプトタブを再利用します。別のタブを手動で開くのではなく、ツール呼び出しを再試行してください。
- **手動アクション**: ツールが `manualActionRequired: true` を返した場合は、`browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使ってオペレーターを案内してください。ループで再試行しないでください。
- **音声選択インタースティシャル**: Meet が「会議で他のユーザーにあなたの音声を聞こえるようにしますか?」を表示した場合は、タブを開いたままにします。OpenClaw は **マイクを使用** または（作成のみでは）**マイクなしで続行** をクリックし、生成された URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

STT -> OpenClaw エージェント -> TTS パスには `mode: "agent"` を使用し、直接リアルタイム音声フォールバックには `mode: "bidi"` を使用します。`mode: "transcribe"` は意図的にトークバックブリッジを開始しません。観察のみのデバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が true なのに `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、オブザーバーのインストール後に誰も話していない、Meet UI が変更された、または会議の言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスを確認し、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け付けた可能性がありますが、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達するのを確認できていません。

併せて確認してください: リアルタイムプロバイダーキー（`OPENAI_API_KEY` または `GEMINI_API_KEY`）が Gateway ホストで利用可能であること。`BlackHole 2ch` が Chrome ホストで表示されていること。`sox` がそこに存在すること。Meet のマイク/スピーカーが仮想音声パス経由でルーティングされていること（ローカル Chrome リアルタイム参加では、`doctor` が `meet output routed: yes` を表示する必要があります）。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、手動アクション理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入力/出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザ URL を出力します。生の JSON には `googlemeet status [session-id] --json` を使用し、トークンを公開せずに OAuth 更新を検証するには `googlemeet doctor --oauth`（`--meeting` または `--create-space` を追加）を使用します。

エージェントがタイムアウトし、Meet タブがすでに開いている場合は、別のタブを開かずに確認してください:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。これは、新しいタブやセッションを開かずに、選択されたトランスポート（`chrome` ではローカルブラウザ制御、`chrome-node` では設定済みノード）の既存の Meet タブにフォーカスして検査し、現在のブロッカー（ログイン、入室許可、権限、音声選択状態）を報告します。CLI コマンドは設定済みの Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` ではノードも接続されている必要があります。

### Twilio セットアップチェックが失敗する

`twilio-voice-call-plugin` は、`voice-call` が許可されていない、または有効化されていない場合に失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効化して、Gateway をリロードしてください。

`twilio-voice-call-credentials` は、Twilio バックエンドにアカウント SID、認証トークン、発信者番号がない場合に失敗します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` は、`voice-call` に公開 Webhook がない場合、または `publicUrl` がループバック/プライベートネットワーク空間を指している場合に失敗します。`publicUrl` には `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。通信事業者のコールバックはそこへ到達できません。`plugins.entries.voice-call.config.publicUrl` を公開 URL に設定するか、トンネル/Tailscale 公開を設定してください。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

ローカル開発では、プライベートホスト URL ではなく、トンネルまたは Tailscale 公開を使用してください。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Gateway を再起動またはリロードしてから、次を実行します。

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトでは準備確認のみを行います。特定の番号をドライランします。

```bash
openclaw voicecall smoke --to "+15555550123"
```

意図的に実際の発信通話を行う場合のみ、`--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが会議に入らない

Meet イベントに電話ダイヤルインの詳細が公開されていることを確認し、正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN の前に一時停止を入れるには、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

通話は作成されたものの、Meet の参加者一覧にダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>`: 委譲された Twilio 通話 ID、DTMF がキューに入ったかどうか、イントロのあいさつが要求されたかどうかを確認します。
- `openclaw voicecall status --call-id <id>`: 通話がまだアクティブであることを確認します。
- `openclaw voicecall tail`: Twilio Webhook が Gateway に到着していることを確認します。
- `openclaw logs --follow`: Twilio Meet シーケンスを探します。Google Meet が参加を委譲し、Voice Call が接続前 DTMF TwiML を保存して配信し、Voice Call が Twilio 通話用のリアルタイム TwiML を配信し、その後 Google Meet が `voicecall.speak` でイントロ音声を要求します。
- `openclaw googlemeet setup --transport twilio` を再実行します。セットアップチェックがグリーンであることは必須ですが、会議の PIN シーケンスが正しいことまでは証明しません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合、または接続前 DTMF の送信後も通話トランスクリプトに PIN プロンプトが表示される場合は、`voiceCall.dtmfDelayMs` をデフォルトの 12 秒から増やします。
- 参加者は入室しているのにあいさつが聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` リクエストと、メディアストリーム TTS 再生または Twilio `<Say>` フォールバックを確認します。トランスクリプトにまだ「会議の PIN を入力してください」と表示される場合、電話側はまだ Meet ルームに参加していないため、参加者には音声が聞こえません。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグしてください。プロバイダーは `plugins.entries.voice-call.config.publicUrl` または設定済みトンネルに到達できる必要があります。[Voice call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注意事項

Google Meet の公式メディア API は受信指向であるため、通話で発話するには引き続き参加者経路が必要です。この Plugin はその境界を見える状態に保ちます。Chrome はブラウザ参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome のトークバックモードには `BlackHole 2ch` に加えて、次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がブリッジを所有し、`chrome.audioFormat` の音声をこれらのコマンドと選択されたプロバイダーの間でパイプします。`agent` モードはリアルタイム文字起こしと通常の TTS を使用します。`bidi` モードはリアルタイム音声プロバイダーを使用します。デフォルト経路は `chrome.audioBufferBytes: 4096` の 24 kHz PCM16 です。8 kHz G.711 mu-law は、レガシーのコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声経路全体を所有し、デーモンの起動または検証後に終了する必要があります。`bidi` でのみ有効です。`agent` モードでは TTS のためにコマンドペアへの直接アクセスが必要だからです。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタント再生をクリアできます。これにより、共有 BlackHole ループバック入力がアシスタント再生中に一時的に抑制されている間でも、人間の発話をアシスタント出力より優先できます。`chrome.audioInputCommand`/`chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。信頼できる明示的なコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトは使用しないでください。

クリーンな双方向音声のために、Meet 出力と Meet マイクを別々の仮想デバイス、または Loopback 形式の仮想デバイスグラフにルーティングしてください。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話に戻ってエコーする可能性があります。

`googlemeet speak` は Chrome セッションのアクティブなトークバック音声ブリッジをトリガーします。`googlemeet leave` はそれを停止します（また、Voice Call 経由で委任された Twilio セッションでは、基盤となる通話を切断します）。API 管理のスペースでアクティブな Google Meet 会議も閉じるには、`googlemeet end-active-conference` を使用します。

## 関連

- [Voice call plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
