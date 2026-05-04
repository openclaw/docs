---
read_when:
    - OpenClaw エージェントを Google Meet の通話に参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成してほしい場合
    - Chrome、Chrome ノード、または Twilio を Google Meet トランスポートとして設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio で参加し、エージェントのトークバック既定値を使用'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T05:00:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9caeb2d4540b833c75cd0f3b5f61a99f0a6bb16ca71a96011d25e4ea103a4601
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 参加者サポートの OpenClaw 対応は、Plugin が設計上明示的になっています。

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、その後、返された URL に参加できます。
- `agent` がデフォルトのトークバックモードです。リアルタイム文字起こしが聞き取り、設定済みの OpenClaw エージェントが応答し、通常の OpenClaw TTS が Meet 内で発話します。
- `bidi` は、フォールバックの直接リアルタイム音声モデルモードとして引き続き利用できます。
- エージェントは `mode` で参加動作を選びます。ライブの聞き取り/トークバックには `agent`、直接リアルタイム音声フォールバックには `bidi`、トークバックブリッジなしでブラウザーに参加/制御するには `transcribe` を使用します。
- 認証は個人の Google OAuth、またはすでにログイン済みの Chrome プロファイルから始まります。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカル、またはペアリング済みのノードホスト上で実行できます。
- Twilio はダイヤルイン番号に加えて、任意の PIN または DTMF シーケンスを受け付けます。Meet URL に直接発信することはできません。
- CLI コマンドは `googlemeet` です。`meet` はより広いエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、リアルタイム文字起こしプロバイダーと通常の OpenClaw TTS を設定します。OpenAI はデフォルトの文字起こしプロバイダーです。Google Gemini Live も、`realtime.voiceProvider: "google"` を使う別の `bidi` 音声フォールバックとして動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想音声デバイスをインストールします。Homebrew のインストーラーでは、macOS がデバイスを公開する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方の要素を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin を有効化します。

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

セットアップを確認します。

```bash
openclaw googlemeet setup
```

セットアップ出力は、エージェントが読み取れる形式で、モードを認識するようになっています。Chrome プロファイル、ノード固定、そしてリアルタイム Chrome 参加の場合は BlackHole/SoX 音声ブリッジと遅延リアルタイム導入チェックを報告します。観察専用の参加では、同じトランスポートを `--mode transcribe` で確認します。このモードは、ブリッジ経由で聞き取ったり発話したりしないため、リアルタイム音声の前提条件をスキップします。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin、Twilio 認証情報、公開 Webhook 公開が準備できているかどうかも報告します。エージェントに参加を依頼する前に、`ok: false` のチェックはすべて、チェック対象のトランスポートとモードに対するブロッカーとして扱います。スクリプトや機械可読出力には `openclaw googlemeet setup --json` を使用します。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使用します。

Twilio では、デフォルトトランスポートが Chrome の場合、必ずトランスポートを明示的に事前確認します。

```bash
openclaw googlemeet setup --transport twilio
```

これにより、エージェントがミーティングに発信しようとする前に、欠落している `voice-call` 接続、Twilio 認証情報、または到達不能な Webhook 公開を検出できます。

ミーティングに参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、`google_meet` ツールを通じてエージェントに参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

エージェント向けの `google_meet` ツールは、macOS 以外のホストでも、アーティファクト、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node` フロー用に引き続き利用できます。ローカル Chrome のトークバック操作は、バンドルされた Chrome 音声パスが現在 macOS の `BlackHole 2ch` に依存しているため、そこでブロックされます。Linux では、Chrome トークバック参加に `mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用します。

新しいミーティングを作成して参加します。

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API で作成するルームでは、Google アカウントのデフォルトから継承するのではなく、ルームのノック不要ポリシーを明示したい場合に Google Meet `SpaceConfig.accessType` を使用します。

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` は Meet URL を持つ誰でもノックなしで参加できるようにします。`TRUSTED` は、ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザーがノックなしで参加できるようにします。`RESTRICTED` は、ノックなしの入室を招待者に制限します。これらの設定は公式 Google Meet API 作成パスにのみ適用されるため、OAuth 認証情報を設定する必要があります。

このオプションが利用可能になる前に Google Meet を認証していた場合は、Google OAuth 同意画面に `meetings.space.settings` スコープを追加した後、`openclaw googlemeet auth login --json` を再実行してください。

参加せずに URL だけを作成します。

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つのパスがあります。

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使用されます。これは最も決定的なパスであり、ブラウザー UI の状態に依存しません。
- ブラウザーフォールバック: OAuth 認証情報がない場合に使用されます。OpenClaw は固定された Chrome ノードを使用し、`https://meet.google.com/new` を開き、Google が実際のミーティングコード URL にリダイレクトするのを待ってから、その URL を返します。このパスでは、ノード上の OpenClaw Chrome プロファイルがすでに Google にログインしている必要があります。ブラウザー自動化は Meet 独自の初回マイクプロンプトを処理します。そのプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` のような無害な URL クエリ文字列を無視するため、エージェントの再試行では 2 つ目の Chrome タブを作成するのではなく、すでに開いているミーティングにフォーカスするはずです。

コマンド/ツール出力には、使用されたパスをエージェントが説明できるように `source` フィールド（`api` または `browser`）が含まれます。`create` はデフォルトで新しいミーティングに参加し、`joined: true` と参加セッションを返します。URL だけを発行するには、CLI で `create --no-join` を使用するか、ツールに `"join": false` を渡します。

または、エージェントに「Google Meet を作成し、エージェントのトークバックモードで参加して、リンクを送って」と伝えます。エージェントは `action: "create"` で `google_meet` を呼び出し、返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

観察専用/ブラウザー制御の参加では、`"mode": "transcribe"` を設定します。これは双方向リアルタイム音声ブリッジを開始せず、BlackHole や SoX を必要とせず、ミーティング内でトークバックしません。このモードの Chrome 参加では、OpenClaw のマイク/カメラ権限付与も回避し、Meet の **マイクを使用** パスも回避します。Meet が音声選択インタースティシャルを表示した場合、自動化はマイクなしのパスを試み、それ以外の場合はローカルマイクを開くのではなく手動操作を報告します。文字起こしモードでは、管理対象 Chrome トランスポートもベストエフォートの Meet キャプション監視をインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、短い `recentTranscript` 末尾を表示するため、オペレーターはブラウザーが通話に参加したかどうか、Meet キャプションがテキストを生成しているかどうかを判断できます。
はい/いいえのプローブが必要な場合は、`openclaw googlemeet test-listen <meet-url> --transport chrome-node` を使用します。これは文字起こしモードで参加し、新しいキャプションまたは文字起こしの動きを待ち、`listenVerified`、`listenTimedOut`、手動操作フィールド、最新のキャプション健全性を返します。

リアルタイムセッション中、`google_meet` のステータスには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最終入力/出力タイムスタンプ、バイトカウンター、ブリッジ終了状態など、ブラウザーと音声ブリッジの健全性が含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザー自動化は可能なときにそれを処理します。ログイン、ホスト承認、ブラウザー/OS 権限プロンプトは、エージェントが中継するための理由とメッセージ付きで手動操作として報告されます。管理対象 Chrome セッションは、ブラウザーの健全性が `inCall: true` を報告した後にのみ導入文またはテストフレーズを送出します。それ以外の場合、ステータスは `speechReady: false` を報告し、エージェントがミーティング内で発話したふりをするのではなく、発話試行をブロックします。

ローカル Chrome 参加は、ログイン済みの OpenClaw ブラウザープロファイルを通じて行われます。リアルタイムモードでは、OpenClaw が使用するマイク/スピーカーパスに `BlackHole 2ch` が必要です。クリーンな双方向音声には、別々の仮想デバイス、または Loopback 形式のグラフを使用します。単一の BlackHole デバイスでも最初のスモークテストには十分ですが、エコーが発生する場合があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM 内に完全な OpenClaw Gateway やモデル API キーは必要ありません。Gateway とエージェントはローカルで実行し、VM ではノードホストを実行します。VM 上でバンドル Plugin を一度有効化し、ノードが Chrome コマンドを広告するようにします。

どこで何を実行するか:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API キー、リアルタイムプロバイダー、Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/ノードホスト、Google Chrome、SoX、BlackHole 2ch、Google にログイン済みの Chrome プロファイル。
- VM で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、モデルプロバイダー設定。

VM の依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHole のインストール後、macOS が `BlackHole 2ch` を公開するように VM を再起動します。

```bash
sudo reboot
```

再起動後、VM が音声デバイスと SoX コマンドを認識できることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM に OpenClaw をインストールまたは更新し、そこでバンドル Plugin を有効化します。

```bash
openclaw plugins enable google-meet
```

VM でノードホストを開始します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で、TLS を使用していない場合、その信頼済みプライベートネットワークに明示的にオプトインしない限り、ノードは平文 WebSocket を拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ノードを LaunchAgent としてインストールする場合も、同じ環境変数を使用します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` 設定ではありません。`openclaw node install` は、インストールコマンド上に存在する場合、それを LaunchAgent 環境に保存します。

Gateway ホストからノードを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway がノードを認識し、`googlemeet.chrome` とブラウザー機能/`browser.proxy` の両方を広告していることを確認します。

```bash
openclaw nodes status
```

Gateway ホストで、そのノード経由に Meet をルーティングします。

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

これで Gateway ホストから通常どおり参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、`transport: "chrome-node"` で `google_meet` ツールを使用するようエージェントに依頼します。

セッションを作成または再利用し、既知のフレーズを発話し、セッションの健全性を出力する 1 コマンドのスモークテストは次のとおりです。

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加時、OpenClaw のブラウザー自動化はゲスト名を入力し、
Join/Ask to join をクリックし、そのプロンプトが表示された場合は Meet の初回実行時の
「Use microphone」選択を受け入れます。観察専用の参加またはブラウザーのみでのミーティング作成時は、
同じプロンプトで、利用可能な場合はマイクなしの選択を使って先へ進みます。
ブラウザープロファイルがサインインしていない、Meet がホストの承認を待っている、
リアルタイム参加のために Chrome がマイク/カメラ権限を必要としている、または
Meet が自動化で解決できないプロンプトで停止している場合、参加/test-speech の結果は
`manualActionRequired: true` を `manualActionReason` および
`manualActionMessage` とともに報告します。エージェントは参加の再試行を停止し、
その正確なメッセージに現在の `browserUrl`/`browserTitle` を添えて報告し、
手動のブラウザー操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` が省略されている場合、OpenClaw は、接続済みノードのうち
`googlemeet.chrome` とブラウザー制御の両方を公開しているものがちょうど1つだけの場合にのみ自動選択します。
対応可能なノードが複数接続されている場合は、`chromeNode.node` にノード ID、
表示名、またはリモート IP を設定します。

一般的な失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway に認識されていますが利用できません。エージェントはそのノードを
  使用可能な Chrome ホストではなく診断状態として扱い、ユーザーが求めていない限り
  別のトランスポートへフォールバックせず、セットアップ上のブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM 内で `openclaw node run` を起動し、
  ペアリングを承認し、VM 内で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認します。また、
  Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  によって両方のノードコマンドを許可していることも確認します。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch`
  をインストールし、ローカル Chrome 音声を使用する前に再起動します。
- `BlackHole 2ch audio device not found on the node`: VM 内に `blackhole-2ch`
  をインストールし、VM を再起動します。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにします。ゲスト自動参加は、
  ノードのブラウザープロキシを通じて OpenClaw のブラウザー自動化を使用します。
  ノードのブラウザー設定が目的のプロファイルを指していることを確認してください。たとえば
  `browser.defaultProfile: "user"`、または名前付きの既存セッションプロファイルです。
- Meet タブの重複: `chrome.reuseExistingTab: true` を有効にしたままにします。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブ化し、
  ブラウザーでのミーティング作成では、別のタブを開く前に進行中の
  `https://meet.google.com/new` または Google アカウントプロンプトのタブを再利用します。
- 音声がない: Meet で、マイク/スピーカーを OpenClaw が使用する仮想音声デバイスパスにルーティングします。
  クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールの注意事項

Chrome のトークバックのデフォルトは、2つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。この Plugin は、デフォルトの 24 kHz PCM16 音声ブリッジに対して
  明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想音声ドライバー。Chrome/Meet がルーティングに使用できる
  `BlackHole 2ch` 音声デバイスを作成します。

OpenClaw はどちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、
ユーザーに Homebrew 経由でホスト依存関係としてインストールするよう案内しています。SoX は
`LGPL-2.0-only AND GPL-2.0-only` としてライセンスされており、BlackHole は GPL-3.0 です。
BlackHole を OpenClaw と一緒にバンドルするインストーラーまたはアプライアンスを構築する場合は、
BlackHole の上流ライセンス条件を確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは、OpenClaw のブラウザー制御を通じて Meet URL を開き、
サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、この Plugin は
起動前に `BlackHole 2ch` を確認します。設定されている場合は、Chrome を開く前に
音声ブリッジのヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は
`chrome` を使用し、Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は
`chrome-node` を使用します。ローカル Chrome では、`browser.defaultProfile` で
プロファイルを選択します。`chrome.browserProfile` は `chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声を、ローカルの OpenClaw 音声ブリッジ経由でルーティングします。
`BlackHole 2ch` がインストールされていない場合、音声パスなしで黙って参加するのではなく、
参加はセットアップエラーで失敗します。

### Twilio

Twilio トランスポートは、Voice Call Plugin に委任される厳格なダイヤルプランです。
Meet ページから電話番号を解析しません。

Chrome での参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。
Google Meet はそのミーティング用の電話ダイヤルイン番号と PIN を公開している必要があります。
OpenClaw は Meet ページからそれらを検出しません。

Voice Call Plugin は Chrome ノードではなく Gateway ホストで有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
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
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Twilio の認証情報は環境または設定で提供します。環境を使うと、シークレットを
`openclaw.json` の外に保てます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

リアルタイム音声プロバイダーがそれである場合は、代わりに OpenAI provider Plugin と
`OPENAI_API_KEY` を使用して `realtime.provider: "openai"` を使います。

`voice-call` を有効にした後は Gateway を再起動またはリロードします。Plugin 設定の変更は、
リロードされるまで、すでに実行中の Gateway プロセスには反映されません。

次に確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委任が配線されると、`googlemeet setup` には成功した
`twilio-voice-call-plugin`、`twilio-voice-call-credentials`、および
`twilio-voice-call-webhook` チェックが含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ミーティングでカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth と事前確認

`googlemeet create` はブラウザー自動化にフォールバックできるため、Meet リンクの作成に
OAuth は任意です。公式 API での作成、スペース解決、または Meet Media API の事前確認が必要な場合に
OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープを要求し、Google アカウントを承認してから、得られたリフレッシュトークンを
Google Meet Plugin 設定に保存するか、`OPENCLAW_GOOGLE_MEET_*` 環境変数を提供します。

OAuth は Chrome 参加パスを置き換えません。ブラウザー参加を使用する場合、Chrome および
Chrome-node トランスポートは引き続き、サインイン済み Chrome プロファイル、BlackHole/SoX、
および接続済みノードを通じて参加します。OAuth は公式 Google Meet API パス専用です。
ミーティングスペースの作成、スペース解決、Meet Media API 事前確認の実行に使います。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テスト用セットアップで機能します。アプリが Testing の間は、
     アプリを承認する各 Google アカウントをテストユーザーとして追加します。
4. OpenClaw が要求するスコープを追加します。
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth クライアント ID を作成します。
   - アプリケーションタイプ: **Web application**。
   - 承認済みリダイレクト URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. クライアント ID とクライアントシークレットをコピーします。

`meetings.space.created` は Google Meet `spaces.create` に必要です。
`meetings.space.readonly` により、OpenClaw は Meet URL/コードをスペースへ解決できます。
`meetings.space.settings` により、OpenClaw は API でのルーム作成時に
`accessType` などの `SpaceConfig` 設定を渡せます。
`meetings.conference.media.readonly` は Meet Media API の事前確認とメディア作業用です。
実際の Media API 使用には、Google が Developer Preview 登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全にスキップします。

### リフレッシュトークンを発行する

`oauth.clientId` と、必要に応じて `oauth.clientSecret` を設定するか、環境変数として渡してから、
次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` の localhost コールバック、および `--manual`
による手動コピー/貼り付けフローを使用します。

例:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ブラウザーがローカルコールバックに到達できない場合は手動モードを使用します。

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 出力には次が含まれます。

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

`oauth` オブジェクトを Google Meet Plugin 設定の下に保存します。

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

リフレッシュトークンを設定に入れたくない場合は、環境変数を優先します。
設定値と環境値の両方が存在する場合、この Plugin はまず設定を解決し、その後に環境へフォールバックします。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、Meet 会議メディア読み取りアクセスが含まれます。
ミーティング作成サポートが存在する前に認証していた場合は、
リフレッシュトークンが `meetings.space.created` スコープを持つように
`openclaw googlemeet auth login --json` を再実行します。

### doctor で OAuth を確認する

高速な、シークレットを含まないヘルスチェックが必要な場合は OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムをロードせず、接続済み Chrome ノードも必要としません。
OAuth 設定が存在すること、およびリフレッシュトークンがアクセストークンを発行できることを確認します。
JSON レポートには `ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージなどの
ステータスフィールドのみが含まれます。アクセストークン、リフレッシュトークン、クライアントシークレットは出力されません。

一般的な結果:

| チェック             | 意味                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `oauth-config`       | `oauth.clientId` に加えて `oauth.refreshToken`、またはキャッシュされたアクセストークンが存在します。 |
| `oauth-token`        | キャッシュされたアクセストークンがまだ有効か、リフレッシュトークンによって新しいアクセストークンが発行されました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                          |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                     |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用を伴う作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効になっていること、および認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存のミーティングスペースへの読み取りアクセスを証明するには、次を実行します。

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済みの Google アカウントがアクセスできる既存スペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効、同意済みのリフレッシュトークンに必要なスコープがない、または Google アカウントがその Meet スペースにアクセスできないことを意味します。リフレッシュトークンエラーの場合は、`openclaw googlemeet auth login
--json` を再実行し、新しい `oauth` ブロックを保存します。

ブラウザフォールバックには OAuth 認証情報は不要です。そのモードでは、Google 認証は OpenClaw 設定ではなく、選択したノード上でサインイン済みの Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け付けられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または `spaces/{id}` を `spaces.get` で解決します。

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア作業の前にプリフライトを実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後で、ミーティングの成果物と出席状況を一覧表示します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。そのミーティングで保持されているすべてのレコードが必要な場合は、`--all-conference-records` を渡します。

Calendar ルックアップは、Meet の成果物を読み取る前に Google Calendar からミーティング URL を解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は今日の `primary` カレンダーから Google Meet リンクを持つ Calendar イベントを検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、非プライマリカレンダーには `--calendar <id>` を使用します。Calendar ルックアップには、Calendar events readonly スコープを含む新しい OAuth ログインが必要です。
`calendar-events` は一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントを示します。

会議レコード ID がすでに分かっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

API で作成したスペースのアクティブな会議を、通話後にルームを閉じたい場合に終了します。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

これは Google Meet `spaces.endActiveConference` を呼び出し、認可済みアカウントが管理できるスペースに対する `meetings.space.created` スコープ付き OAuth を必要とします。OpenClaw は Meet URL、ミーティングコード、または `spaces/{id}` 入力を受け付け、アクティブな会議を終了する前に API スペースリソースへ解決します。
これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止しますが、`end-active-conference` は Google Meet に対して、そのスペースのアクティブな会議を終了するよう要求します。

読みやすいレポートを書き出します。

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` は、Google がそのミーティングについて公開している場合、会議レコードのメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートのリソースメタデータを返します。大規模なミーティングでエントリ検索をスキップするには `--no-transcript-entries` を使用します。`attendance` は、参加者を参加者セッション行に展開し、最初/最後に確認された時刻、合計セッション時間、遅刻/早退フラグ、サインイン済みユーザーまたは表示名でマージされた重複参加者リソースを含めます。生の参加者リソースを分けたままにするには `--no-merge-duplicates`、遅刻判定を調整するには `--late-after-minutes`、早退判定を調整するには `--early-before-minutes` を渡します。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダを書き込みます。
`manifest.json` には、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、および部分的な取得警告が記録されます。フォルダの隣にポータブルアーカイブも書き込むには `--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには `--include-doc-bodies` を渡します。これには Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` を指定しない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。スマートノート一覧、文字起こしエントリ、Drive ドキュメント本文エラーなど、Google が部分的な成果物失敗を返した場合、エクスポート全体を失敗させるのではなく、サマリーとマニフェストに警告を保持します。
同じ成果物/出席データを取得し、フォルダや ZIP を作成せずにマニフェスト JSON を出力するには `--dry-run` を使用します。これは、大きなエクスポートを書き込む前や、エージェントが件数、選択されたレコード、警告だけを必要とする場合に便利です。

エージェントは `google_meet` ツールを使って同じバンドルを作成することもできます。

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ファイル書き込みをスキップしてエクスポートマニフェストのみを返すには、`"dryRun": true` を設定します。

エージェントは明示的なアクセスポリシーを持つ API バックのルームを作成することもできます。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

また、既知のルームのアクティブな会議を終了できます。

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

まず聞く検証では、ミーティングが有用だと主張する前に、エージェントは `test_listen` を使用する必要があります。

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

実際に保持されているミーティングに対して、ガード付きライブスモークを実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Meet のキャプションが利用可能で、誰かが発話するミーティングに対して、まず聞くライブブラウザプローブを実行します。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` はガード付きライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は保持されている Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` はリフレッシュトークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本の成果物/出席ライブスモークには、
`https://www.googleapis.com/auth/meetings.space.readonly` と
`https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar ルックアップには `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには
`https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します。

```bash
openclaw googlemeet create
```

このコマンドは新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は公式の Google Meet API を使用します。OAuth 認証情報がない場合は、固定された Chrome ノードのサインイン済みブラウザプロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定して `google_meet` ツールを使用し、作成と参加を 1 ステップで実行できます。URL の作成のみを行う場合は、`"join": false` を渡します。

ブラウザフォールバックからの JSON 出力例:

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

ブラウザフォールバックが URL を作成できる前に Google ログインまたは Meet 権限ブロッカーに遭遇した場合、Gateway メソッドは失敗レスポンスを返し、`google_meet` ツールはプレーン文字列ではなく構造化された詳細を返します。

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

エージェントが `manualActionRequired: true` を見た場合、`manualActionMessage` に加えてブラウザのノード/タブコンテキストを報告し、オペレーターがブラウザ手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

API 作成からの JSON 出力例:

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

Meet を作成すると、デフォルトで参加します。Chrome または Chrome-node トランスポートでブラウザから参加するには、サインイン済みの Google Chrome プロファイルが引き続き必要です。プロファイルがサインアウト状態の場合、OpenClaw は `manualActionRequired: true` またはブラウザのフォールバックエラーを報告し、再試行する前にオペレーターへ Google ログインを完了するよう求めます。

Cloud プロジェクト、OAuth プリンシパル、会議参加者が Google Workspace Developer Preview Program for Meet media APIs に登録済みであることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

共通の Chrome エージェントパスで必要なのは、Plugin を有効にすること、BlackHole、SoX、リアルタイム文字起こしプロバイダーキー、および設定済みの OpenClaw TTS プロバイダーだけです。OpenAI がデフォルトの文字起こしプロバイダーです。デフォルトのエージェントモード文字起こしプロバイダーを変更せずに `bidi` モードで Google Gemini Live を使用するには、`realtime.voiceProvider` を `"google"` に設定し、`realtime.model` を設定します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 設定を `plugins.entries.google-meet.config` の下に設定します。

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

デフォルト:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"`（`"realtime"` は `"agent"` のレガシー互換エイリアスとしてのみ受け入れられます。新しいツール呼び出しでは `"agent"` を指定してください）
- `chromeNode.node`: `chrome-node` 用の任意のノード ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウト状態の Meet ゲスト画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザ自動化による、ベストエフォートのゲスト名入力と「今すぐ参加」クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに既存の Meet タブをアクティブ化します
- `chrome.waitForInCallMs: 20000`: 応答音声イントロがトリガーされる前に、Meet タブが通話中を報告するまで待機します
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペア音声形式。現在も電話音声を出力するレガシー/カスタムのコマンドペアにのみ `"g711-ulaw-8khz"` を使用してください。
- `chrome.audioBufferBytes: 4096`: 生成された Chrome コマンドペア音声コマンド用の SoX 処理バッファです。これは SoX のデフォルト 8192 バイトバッファの半分であり、デフォルトのパイプレイテンシを削減しつつ、負荷の高いホストで引き上げる余地を残します。SoX の最小値を下回る値は 17 バイトにクランプされます。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` の音声を書き込む SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` の音声を読み取り、CoreAudio `BlackHole 2ch` に書き込む SoX コマンド
- `chrome.bargeInInputCommand`: アシスタント再生が有効な間、人間の割り込み発話検出のために signed 16-bit little-endian mono PCM を書き込む任意のローカルマイクコマンドです。これは現在、Gateway でホストされる `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` で人間による割り込みとして扱われる RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` で人間による割り込みとして扱われるピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返される人間による割り込みクリアの最小間隔
- `mode: "agent"`: デフォルトの応答音声モードです。参加者の発話は、設定済みのリアルタイム文字起こしプロバイダーによって文字起こしされ、会議ごとのサブエージェントセッション内の設定済み OpenClaw エージェントへ送信され、通常の OpenClaw TTS ランタイムを通じて読み上げられます。
- `mode: "bidi"`: フォールバック用の直接双方向リアルタイムモデルモードです。リアルタイム音声プロバイダーが参加者の発話に直接応答し、より深い/ツールに支えられた回答のために `openclaw_agent_consult` を呼び出す場合があります。
- `mode: "transcribe"`: 応答音声ブリッジなしの観察専用モードです。
- `realtime.provider: "openai"`: 以下のスコープ付きプロバイダーフィールドが未設定の場合に使用される互換性フォールバックです。
- `realtime.transcriptionProvider: "openai"`: `agent` モードでリアルタイム文字起こしに使用されるプロバイダー ID です。
- `realtime.voiceProvider`: `bidi` モードで直接リアルタイム音声に使用されるプロバイダー ID です。エージェントモードの文字起こしを OpenAI のままにしながら Gemini Live を使用するには、これを `"google"` に設定します。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 簡潔な音声応答。より深い回答には `openclaw_agent_consult` を使用します
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声による準備完了チェック。無言で参加するには `""` に設定します
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw エージェント ID。デフォルトは `main` です

任意のオーバーライド:

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
        voice: "Kore",
      },
    },
  },
}
```

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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委譲します。Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存されたイントロテキストを初期リアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話は発信できません。

## ツール

エージェントは `google_meet` ツールを使用できます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Chrome が Gateway ホスト上で実行される場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノード上で実行される場合は `transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと `openclaw_agent_consult` は Gateway ホスト上で実行されるため、モデル認証情報はそこに留まります。デフォルトの `mode: "agent"` では、リアルタイム文字起こしプロバイダーが聞き取りを処理し、設定済みの OpenClaw エージェントが回答を生成し、通常の OpenClaw TTS がそれを Meet に読み上げます。リアルタイム音声モデルに直接回答させたい場合は `mode: "bidi"` を使用します。生の `mode: "realtime"` は、`mode: "agent"` のレガシー互換エイリアスとして引き続き受け入れられますが、エージェントツールスキーマではもう告知されません。

アクティブなセッションを一覧表示するか、セッション ID を調べるには `action: "status"` を使用します。リアルタイムエージェントに即座に発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` の健全性を返すには、`action: "test_speech"` を使用します。`test_speech` は常に `mode: "agent"` を強制し、`mode: "transcribe"` で実行するよう求められると失敗します。観察専用セッションは意図的に発話を出力できないためです。その `speechOutputVerified` 結果は、このテスト呼び出し中にリアルタイム音声出力バイトが増加したかどうかに基づくため、古い音声を持つ再利用セッションは、新規の成功した発話チェックとしては扱われません。セッションを終了済みとしてマークするには `action: "leave"` を使用します。

`status` には利用可能な場合 Chrome の健全性が含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見えます
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 音声が機能する前に、ブラウザプロファイルで手動ログイン、Meet ホストによる入室許可、権限、またはブラウザ制御の修復が必要です
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome の発話が現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを音声ブリッジに送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に検出した音声、またはブリッジへ最後に送信した音声
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet タブのメディア出力が、ブリッジで使用される BlackHole デバイスにアクティブにルーティングされていたかどうか
- `lastSuppressedInputAt` / `suppressedInputBytes`: アシスタント再生が有効な間に無視されたループバック入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## エージェントと Bidi モード

Chrome `agent` モードは、「自分のエージェントが会議に参加している」挙動向けに最適化されています。リアルタイム文字起こしプロバイダーが会議音声を聞き取り、確定した参加者の文字起こしは設定済みの OpenClaw エージェントへルーティングされ、回答は通常の OpenClaw TTS ランタイムを通じて読み上げられます。リアルタイム音声モデルに直接回答させたい場合は `mode: "bidi"` を設定します。
近接する確定文字起こし断片は相談前に結合されるため、1 つの発話ターンから複数の古い部分回答が生成されません。キューに入ったアシスタント音声がまだ再生中の間はリアルタイム入力も抑制され、エージェント相談の前に最近のアシスタントらしい文字起こしエコーが無視されるため、BlackHole ループバックによってエージェントが自分自身の発話に回答することはありません。

| モード  | 回答を決める主体              | 音声出力パス                           | 使う場面                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 設定済みの OpenClaw エージェント | 通常の OpenClaw TTS ランタイム         | 「自分のエージェントが会議に参加している」挙動が必要な場合 |
| `bidi`  | リアルタイム音声モデル        | リアルタイム音声プロバイダーの音声応答 | 最小レイテンシの会話音声ループが必要な場合            |

`bidi` モードでは、リアルタイムモデルがより深い推論、現在の情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

相談ツールは、最近の会議文字起こしコンテキストを使って背後で通常の OpenClaw エージェントを実行し、簡潔な音声回答を返します。`agent` モードでは、OpenClaw がその回答を TTS ランタイムへ直接送信します。`bidi` モードでは、リアルタイム音声モデルが相談結果を会議内で読み上げられます。これは Voice Call と同じ共有相談の仕組みを使用します。

デフォルトでは、相談は `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルデフォルト、ツールポリシー、メモリ、セッション履歴に相談する必要がある場合は、`realtime.agentId` を設定します。

エージェントモードの相談は、会議ごとの `agent:<id>:subagent:google-meet:<session>` セッションキーを使用するため、フォローアップの質問は、設定済みエージェントから通常のエージェントポリシーを継承しつつ、会議コンテキストを維持できます。

`realtime.toolPolicy` は相談実行を制御します。

- `safe-read-only`: 相談ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: 相談ツールを公開し、通常のエージェントが通常のエージェントツールポリシーを使用できるようにします。
- `none`: リアルタイム音声モデルに相談ツールを公開しません。

相談セッションキーは Meet セッションごとにスコープされているため、同じ会議中のフォローアップ相談呼び出しで以前の相談コンテキストを再利用できます。

Chrome が通話に完全に参加した後で、音声による準備完了チェックを強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全な参加および発話のスモークには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストのチェックリスト

無人エージェントにミーティングを渡す前に、この手順を使用します:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

想定される Chrome-node の状態:

- `googlemeet setup` がすべて緑です。
- Chrome-node がデフォルトのトランスポートであるか、ノードが固定されている場合、
  `googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` に、選択されたノードが接続済みとして表示されます。
- 選択されたノードが `googlemeet.chrome` と `browser.proxy` の両方を公開します。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome の健全性を返します。

Parallels macOS VM のようなリモート Chrome ホストでは、Gateway または VM を更新した後の
最短で安全な確認は次のとおりです:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、
エージェントが実際のミーティングタブを開く前に Meet 音声ブリッジが利用可能であることを証明できます。

Twilio のスモークには、電話ダイヤルイン詳細を公開するミーティングを使用します:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

想定される Twilio の状態:

- `googlemeet setup` に、緑の `twilio-voice-call-plugin`、
  `twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。
- Gateway の再読み込み後、CLI で `voicecall` が利用可能です。
- 返されたセッションに `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` には、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、
  初期の挨拶がキューに入ったリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` は委任された音声通話を切断します。

## トラブルシューティング

### エージェントに Google Meet ツールが表示されない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway を再読み込みします:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動または再読み込みします。
実行中のエージェントには、現在の Gateway プロセスによって登録された Plugin ツールだけが表示されます。

macOS 以外の Gateway ホストでは、エージェント向けの `google_meet` ツールは表示されたままですが、
ローカル Chrome のトークバック操作は音声ブリッジに到達する前にブロックされます。
ローカル Chrome のトークバック音声は現在 macOS の `BlackHole 2ch` に依存しているため、
Linux エージェントはデフォルトのローカル Chrome エージェントパスではなく、`mode: "transcribe"`、
Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### Google Meet 対応ノードが接続されていない

ノードホストで次を実行します:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで、ノードを承認し、コマンドを確認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードは接続済みで、`googlemeet.chrome` と `browser.proxy` を一覧表示している必要があります。
Gateway 設定では、これらのノードコマンドを許可する必要があります:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` で失敗する、または Gateway ログが
`gateway token mismatch` を報告する場合は、現在の Gateway トークンでノードを再インストールまたは再起動します。
LAN Gateway の場合、通常は次を意味します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、ノードサービスを再読み込みし、再実行します:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザは開くがエージェントが参加できない

観察のみの参加には `googlemeet test-listen`、リアルタイム参加には `googlemeet test-speech` を実行し、
返された Chrome の健全性を確認します。どちらかのプローブが `manualActionRequired: true` を報告した場合は、
オペレーターに `manualActionMessage` を表示し、ブラウザ操作が完了するまで再試行を停止します。

一般的な手動操作:

- Chrome プロファイルにサインインします。
- Meet ホストアカウントからゲストを承認します。
- Chrome のネイティブ権限プロンプトが表示されたときに、Chrome のマイク/カメラ権限を付与します。
- 固まった Meet 権限ダイアログを閉じるか修復します。

Meet に「Do you want people to hear you in the meeting?」と表示されるだけで
「not signed in」と報告しないでください。これは Meet の音声選択インタースティシャルです。
OpenClaw は利用可能な場合、ブラウザ自動化で **Use microphone** をクリックし、
実際のミーティング状態を待ち続けます。作成のみのブラウザフォールバックでは、URL の作成に
リアルタイム音声パスは不要なため、OpenClaw が **Continue without microphone** をクリックすることがあります。

### ミーティング作成に失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、最初に Google Meet API の
`spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合は、固定された Chrome ノードブラウザにフォールバックします。次を確認します:

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されているか、
  対応する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在します。
- API 作成の場合: 更新トークンは作成サポートが追加された後に発行されています。
  古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新します。
- ブラウザフォールバックの場合: `defaultTransport: "chrome-node"` と
  `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済みノードを指しています。
- ブラウザフォールバックの場合: そのノード上の OpenClaw Chrome プロファイルが Google にサインイン済みで、
  `https://meet.google.com/new` を開けます。
- ブラウザフォールバックの場合: 再試行では、新しいタブを開く前に既存の `https://meet.google.com/new`
  または Google アカウントプロンプトタブを再利用します。エージェントがタイムアウトした場合は、
  別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行します。
- ブラウザフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、
  返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用して
  オペレーターを案内します。その操作が完了するまでループで再試行しないでください。
- ブラウザフォールバックの場合: Meet に「Do you want people to hear you in the
  meeting?」と表示されたら、タブを開いたままにします。OpenClaw はブラウザ自動化で **Use microphone**、
  または作成のみのフォールバックでは **Continue without microphone** をクリックし、生成された Meet URL を待ち続ける必要があります。
  それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認します:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

通常の STT -> OpenClaw エージェント -> TTS トークバックパスには `mode: "agent"` を使用し、
直接リアルタイム音声フォールバックには `mode: "bidi"` を使用します。`mode: "transcribe"` は意図的に
トークバックブリッジを開始しません。観察のみのデバッグでは、参加者が話した後に
`openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、
`lastCaptionText` を確認します。`inCall` が true でも `transcriptLines` が `0` のままの場合、
Meet の字幕が無効である、オブザーバーがインストールされてから誰も話していない、Meet UI が変更された、
またはミーティングの言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスを確認し、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。
`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け入れた可能性がありますが、
OpenClaw は Chrome 音声ブリッジに到達する新しい出力バイトを確認できていません。

次も確認します:

- Gateway ホストで `OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーが利用可能です。
- Chrome ホストで `BlackHole 2ch` が表示されています。
- Chrome ホストに `sox` が存在します。
- Meet のマイクとスピーカーが、OpenClaw が使用する仮想音声パスを経由するようにルーティングされています。
  ローカル Chrome のリアルタイム参加では、`doctor` に `meet output routed: yes` が表示される必要があります。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、手動操作の理由、
リアルタイムプロバイダー接続、`realtimeReady`、音声入力/出力アクティビティ、最後の音声タイムスタンプ、
バイトカウンター、ブラウザ URL を出力します。生の JSON が必要な場合は
`googlemeet status [session-id] --json` を使用します。トークンを公開せずに Google Meet OAuth 更新を確認する必要がある場合は
`googlemeet doctor --oauth` を使用します。Google Meet API の証明も必要な場合は `--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いていることが見える場合は、別のタブを開かずにそのタブを調査します:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツール操作は `recover_current_tab` です。これは選択されたトランスポートの既存の Meet タブにフォーカスし、調査します。
`chrome` では Gateway を通じたローカルブラウザ制御を使用し、`chrome-node` では設定された Chrome ノードを使用します。
新しいタブを開いたり、新しいセッションを作成したりしません。ログイン、承認、権限、音声選択状態など、現在のブロッカーを報告します。
CLI コマンドは設定された Gateway と通信するため、Gateway が実行中である必要があります。
`chrome-node` では Chrome ノードも接続されている必要があります。

### Twilio セットアップチェックが失敗する

`voice-call` が許可または有効化されていない場合、`twilio-voice-call-plugin` は失敗します。
`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway を再読み込みします。

Twilio バックエンドにアカウント SID、認証トークン、または発信者番号がない場合、
`twilio-voice-call-credentials` は失敗します。Gateway ホストでこれらを設定します:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` に公開 Webhook 露出がない場合、または `publicUrl` がループバックまたはプライベートネットワーク空間を指している場合、
`twilio-voice-call-webhook` は失敗します。
`plugins.entries.voice-call.config.publicUrl` を公開プロバイダー URL に設定するか、
`voice-call` トンネル/Tailscale 露出を設定します。

ループバック URL とプライベート URL は通信事業者コールバックには無効です。
`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、または `fd00::/8` を使用しないでください。

安定した公開 URL の場合:

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

ローカル開発では、プライベートホスト URL ではなく、トンネルまたは Tailscale 露出を使用します:

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

その後、Gateway を再起動または再読み込みし、次を実行します:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトで準備状況のみを確認します。特定の番号でドライランするには:

```bash
openclaw voicecall smoke --to "+15555550123"
```

ライブのアウトバウンド通知通話を意図的に発信したい場合にのみ、`--yes` を追加します:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するがミーティングに入らない

Meet イベントが電話ダイヤルイン詳細を公開していることを確認します。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

プロバイダーが PIN を入力する前に一時停止を必要とする場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

電話通話は作成されたものの、Meet の参加者一覧にダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>` を実行して、委任された Twilio の通話 ID、DTMF がキューに入ったかどうか、イントロのあいさつが要求されたかどうかを確認します。
- `openclaw voicecall status --call-id <id>` を実行し、通話がまだアクティブであることを確認します。
- `openclaw voicecall tail` を実行し、Twilio の Webhook が Gateway に到達していることを確認します。
- `openclaw logs --follow` を実行し、Twilio Meet シーケンスを探します。Google Meet が参加を委任し、Voice Call が電話レッグを開始し、Google Meet が `voiceCall.dtmfDelayMs` だけ待機し、`voicecall.dtmf` で DTMF を送信し、`voiceCall.postDtmfSpeechDelayMs` だけ待機してから、`voicecall.speak` でイントロ音声を要求します。
- `openclaw googlemeet setup --transport twilio` を再実行します。緑のセットアップチェックは必須ですが、会議 PIN シーケンスが正しいことの証明にはなりません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合、または DTMF 送信後も通話トランスクリプトに PIN の入力を求めるプロンプトが表示される場合は、`voiceCall.dtmfDelayMs` を増やします。
- 参加者は参加しているのにあいさつが聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` 要求と、メディアストリーム TTS 再生または Twilio の `<Say>` フォールバックを確認します。通話トランスクリプトにまだ「enter the meeting PIN」が含まれている場合、電話レッグはまだ Meet ルームに参加していないため、会議参加者には音声が聞こえません。

Webhook が到達しない場合は、まず Voice Call Plugin をデバッグします。プロバイダーは `plugins.entries.voice-call.config.publicUrl` または構成済みトンネルに到達できる必要があります。[Voice Call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注記

Google Meet の公式メディア API は受信指向であるため、Meet 通話で発話するには引き続き参加者パスが必要です。この Plugin はその境界を明示したままにします。Chrome はブラウザー参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome のトークバックモードには `BlackHole 2ch` に加えて、次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がブリッジを所有し、`chrome.audioFormat` の音声をこれらのコマンドと選択されたプロバイダーの間でパイプします。agent モードはリアルタイム文字起こしと通常の TTS を使用し、bidi モードはリアルタイム音声プロバイダーを使用します。デフォルトの Chrome パスは 24 kHz PCM16、`chrome.audioBufferBytes: 4096` です。8 kHz G.711 mu-law は、レガシーのコマンドペア向けに引き続き使用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を所有し、デーモンの起動または検証後に終了する必要があります。これは `bidi` でのみ有効です。`agent` モードでは TTS 用にコマンドペアへの直接アクセスが必要なためです。

クリーンなデュプレックス音声を得るには、Meet の出力と Meet のマイクを別々の仮想デバイス、または Loopback 形式の仮想デバイスグラフにルーティングします。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタントの再生をクリアできます。これにより、共有 BlackHole ループバック入力がアシスタント再生中に一時的に抑制されていても、人間の発話がアシスタント出力より優先されます。`chrome.audioInputCommand` や `chrome.audioOutputCommand` と同様に、これはオペレーターが構成するローカルコマンドです。明示的に信頼されたコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は Chrome セッションのアクティブなトークバック音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin を介して委任された Twilio セッションでは、`leave` は基盤となる音声通話も切断します。API 管理スペースのアクティブな Google Meet 会議も閉じたい場合は、`googlemeet end-active-conference` を使用します。

## 関連

- [Voice Call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
