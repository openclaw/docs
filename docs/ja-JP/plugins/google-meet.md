---
read_when:
    - OpenClaw エージェントを Google Meet 通話に参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成させたい
    - Chrome、Chrome ノード、または Twilio を Google Meet トランスポートとして設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、agent のトークバックをデフォルトにする'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-06-27T12:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 参加者サポートの OpenClaw 対応は、設計上明示的です:

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API 経由で新しい Meet スペースを作成し、返された URL に参加できます。
- `agent` がデフォルトの応答発話モードです。リアルタイム文字起こしが聞き取り、設定済みの OpenClaw エージェントが回答し、通常の OpenClaw TTS が Meet に発話します。
- `bidi` は、直接リアルタイム音声モデルモードのフォールバックとして引き続き利用できます。
- エージェントは `mode` で参加動作を選びます。ライブの聞き取り/応答発話には `agent`、直接リアルタイム音声フォールバックには `bidi`、応答発話ブリッジなしでブラウザへ参加/制御するには `transcribe` を使います。
- 認証は、個人用 Google OAuth またはすでにサインイン済みの Chrome プロファイルから開始します。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカルでも、ペアリング済みノードホスト上でも実行できます。
- Twilio はダイヤルイン番号と任意の PIN または DTMF シーケンスを受け付けますが、Meet URL に直接ダイヤルすることはできません。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントのテレビ会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、リアルタイム文字起こしプロバイダーと通常の OpenClaw TTS を設定します。OpenAI はデフォルトの文字起こしプロバイダーです。Google Gemini Live も、`realtime.voiceProvider: "google"` を指定した別個の `bidi` 音声フォールバックとして機能します:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想音声デバイスをインストールします。Homebrew のインストーラーでは、macOS がデバイスを公開する前に再起動が必要です:

```bash
sudo reboot
```

再起動後、両方を確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin を有効にします:

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

セットアップを確認します:

```bash
openclaw googlemeet setup
```

セットアップ出力は、エージェントが読み取れることとモード認識を意図しています。Chrome プロファイル、ノード固定、そしてリアルタイム Chrome 参加の場合は BlackHole/SoX 音声ブリッジと遅延リアルタイム導入チェックを報告します。観察専用参加では、同じトランスポートを `--mode transcribe` で確認します。このモードは、ブリッジ経由で聞き取ったり発話したりしないため、リアルタイム音声の前提条件をスキップします:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin、Twilio 認証情報、公開 Webhook 露出の準備状況も報告します。エージェントに参加を依頼する前に、`ok: false` のチェックは、確認対象のトランスポートとモードに対するブロッカーとして扱ってください。スクリプトまたは機械可読出力には `openclaw googlemeet setup --json` を使います。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使います。

Twilio では、デフォルトトランスポートが Chrome の場合、常にトランスポートを明示的に事前確認します:

```bash
openclaw googlemeet setup --transport twilio
```

これにより、エージェントが会議へダイヤルしようとする前に、`voice-call` 配線の欠落、Twilio 認証情報、または到達不能な Webhook 露出を検出できます。

会議に参加します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
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

エージェント向けの `google_meet` ツールは、macOS 以外のホストでも、アーティファクト、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node` フローで引き続き利用できます。ローカル Chrome の応答発話アクションは、バンドルされた Chrome 音声パスが現在 macOS の `BlackHole 2ch` に依存しているため、そこでブロックされます。Linux では、Chrome 応答発話参加に `mode: "transcribe"`、Twilio ダイヤルイン、または macOS `chrome-node` ホストを使います。

新しい会議を作成して参加します:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API で作成するルームでは、Google アカウントのデフォルトから継承するのではなく、ルームのノック不要ポリシーを明示したい場合に Google Meet `SpaceConfig.accessType` を使います:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` は、Meet URL を持つ全員がノックなしで参加できるようにします。`TRUSTED` は、ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザーがノックなしで参加できるようにします。`RESTRICTED` は、ノックなしの入室を招待者に限定します。これらの設定は公式 Google Meet API 作成パスにのみ適用されるため、OAuth 認証情報を設定する必要があります。

このオプションが利用可能になる前に Google Meet を認証していた場合は、Google OAuth 同意画面に `meetings.space.settings` スコープを追加した後、`openclaw googlemeet auth login --json` を再実行します。

参加せずに URL だけを作成します:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つのパスがあります:

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使われます。これは最も決定的なパスであり、ブラウザ UI の状態に依存しません。
- ブラウザフォールバック: OAuth 認証情報がない場合に使われます。OpenClaw は固定された Chrome ノードを使い、`https://meet.google.com/new` を開き、Google が実際の会議コード URL にリダイレクトするのを待ってから、その URL を返します。このパスでは、ノード上の OpenClaw Chrome プロファイルがすでに Google にサインインしている必要があります。ブラウザ自動化は Meet 自体の初回マイクプロンプトを処理します。そのプロンプトは Google ログイン失敗としては扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` などの無害な URL クエリ文字列を無視するため、エージェントの再試行では 2 つ目の Chrome タブを作成するのではなく、すでに開いている会議にフォーカスするはずです。

コマンド/ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、エージェントはどのパスが使われたかを説明できます。`create` はデフォルトで新しい会議に参加し、`joined: true` と参加セッションを返します。URL だけを発行するには、CLI で `create --no-join` を使うか、ツールに `"join": false` を渡します。

または、エージェントに「Google Meet を作成し、エージェント応答発話モードで参加して、リンクを送って」と伝えます。エージェントは `google_meet` を `action: "create"` で呼び出し、返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

観察専用/ブラウザ制御の参加では、`"mode": "transcribe"` を設定します。これは双方向リアルタイム音声ブリッジを開始せず、BlackHole や SoX を必要とせず、会議内で応答発話しません。このモードでの Chrome 参加は、OpenClaw のマイク/カメラ権限付与も避け、Meet の **マイクを使用** パスも避けます。Meet が音声選択インタースティシャルを表示した場合、自動化はマイクなしのパスを試み、それ以外の場合はローカルマイクを開く代わりに手動アクションを報告します。transcribe モードでは、管理対象 Chrome トランスポートもベストエフォートの Meet キャプションオブザーバーをインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、短い `recentTranscript` 末尾を表示するため、オペレーターはブラウザが通話に参加したか、Meet キャプションがテキストを生成しているかを判断できます。
はい/いいえのプローブが必要な場合は、`openclaw googlemeet test-listen <meet-url> --transport chrome-node` を使います。これは transcribe モードで参加し、新しいキャプションまたは文字起こしの動きを待ち、`listenVerified`、`listenTimedOut`、手動アクションフィールド、最新のキャプションヘルスを返します。

リアルタイムセッション中、`google_meet` ステータスには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最終入力/出力タイムスタンプ、バイトカウンター、ブリッジのクローズ状態など、ブラウザと音声ブリッジのヘルスが含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザ自動化は可能なときにそれを処理します。ログイン、ホスト承認、ブラウザ/OS 権限プロンプトは、エージェントが中継するための理由とメッセージ付きの手動アクションとして報告されます。管理対象 Chrome セッションは、ブラウザヘルスが `inCall: true` を報告した後にのみ導入またはテストフレーズを出力します。それ以外の場合、ステータスは `speechReady: false` を報告し、エージェントが会議で話したふりをする代わりに発話試行をブロックします。

ローカル Chrome 参加は、サインイン済みの OpenClaw ブラウザプロファイルを通じて行われます。リアルタイムモードでは、OpenClaw が使うマイク/スピーカーパスに `BlackHole 2ch` が必要です。クリーンな双方向音声には、別個の仮想デバイスまたは Loopback 形式のグラフを使います。単一の BlackHole デバイスでも最初のスモークテストには十分ですが、エコーが発生する可能性があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM 内に完全な OpenClaw Gateway やモデル API キーは必要ありません。Gateway とエージェントをローカルで実行し、VM 内でノードホストを実行します。VM 上でバンドルされた Plugin を一度有効にし、ノードが Chrome コマンドを通知するようにします:

どこで何を実行するか:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API キー、リアルタイムプロバイダー、Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/ノードホスト、Google Chrome、SoX、BlackHole 2ch、Google にサインイン済みの Chrome プロファイル。
- VM で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、モデルプロバイダー設定。

VM の依存関係をインストールします:

```bash
brew install blackhole-2ch sox
```

BlackHole のインストール後、macOS が `BlackHole 2ch` を公開するように VM を再起動します:

```bash
sudo reboot
```

再起動後、VM が音声デバイスと SoX コマンドを認識できることを確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM に OpenClaw をインストールまたは更新し、そこでバンドルされた Plugin を有効にします:

```bash
openclaw plugins enable google-meet
```

VM 内でノードホストを開始します:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で、TLS を使っていない場合、その信頼済みプライベートネットワークに明示的に同意しない限り、ノードは平文 WebSocket を拒否します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ノードを LaunchAgent としてインストールする場合も同じ環境変数を使います:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` 設定ではありません。`openclaw node install` は、インストールコマンド上に存在する場合、それを LaunchAgent 環境に保存します。

Gateway ホストからノードを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway がノードを認識し、そのノードが `googlemeet.chrome` とブラウザ機能/`browser.proxy` の両方を通知していることを確認します:

```bash
openclaw nodes status
```

Gateway ホスト上で Meet をそのノード経由にルーティングします:

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

これで Gateway ホストから通常どおり参加できます:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、`transport: "chrome-node"` で `google_meet` ツールを使うようエージェントに依頼します。

セッションを作成または再利用し、既知のフレーズを話し、セッションヘルスを出力する 1 コマンドのスモークテスト:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、OpenClaw のブラウザー自動化はゲスト名を入力し、
Join/Ask to join をクリックし、そのプロンプトが表示された場合は Meet の初回実行時の
「Use microphone」選択を受け入れます。観察専用参加またはブラウザーのみの会議作成中は、
その選択が利用可能な場合、マイクなしで同じプロンプトを進めます。
ブラウザープロファイルがサインインしていない、Meet がホストの承認待ちである、
リアルタイム参加に Chrome のマイク/カメラ権限が必要である、または Meet が自動化では
解決できないプロンプトで止まっている場合、参加/test-speech の結果は
`manualActionRequired: true` を `manualActionReason` および
`manualActionMessage` とともに報告します。エージェントは参加の再試行を停止し、
その正確なメッセージに現在の `browserUrl`/`browserTitle` を添えて報告し、
手動のブラウザー操作が完了してからのみ再試行する必要があります。

`chromeNode.node` が省略された場合、OpenClaw は、接続済みノードのうち
`googlemeet.chrome` とブラウザー制御の両方を通知しているものがちょうど 1 つの場合にのみ
自動選択します。対応可能なノードが複数接続されている場合は、`chromeNode.node` を
ノード ID、表示名、またはリモート IP に設定してください。

一般的な失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway には認識されていますが利用できません。エージェントはそのノードを
  利用可能な Chrome ホストではなく診断状態として扱い、ユーザーがそれを求めていない限り、
  別のトランスポートへフォールバックせずにセットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM 内で `openclaw node run` を開始し、
  ペアリングを承認し、VM 内で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認してください。また、
  Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  で両方のノードコマンドを許可していることも確認してください。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch` を
  インストールし、ローカル Chrome 音声を使用する前に再起動してください。
- `BlackHole 2ch audio device not found on the node`: VM 内に `blackhole-2ch` を
  インストールし、VM を再起動してください。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにしてください。ゲストの自動参加は、
  ノードのブラウザープロキシ経由で OpenClaw のブラウザー自動化を使用します。ノードの
  ブラウザー設定が目的のプロファイルを指していることを確認してください。たとえば
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイルです。
- Meet タブの重複: `chrome.reuseExistingTab: true` を有効のままにしてください。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブ化し、ブラウザーでの会議作成では、
  別のタブを開く前に進行中の `https://meet.google.com/new` または Google アカウントの
  プロンプトタブを再利用します。
- 音声がない: Meet 内で、マイク/スピーカーを OpenClaw が使用する仮想音声デバイス経路に
  ルーティングしてください。クリーンな双方向音声には、別々の仮想デバイスまたは
  Loopback スタイルのルーティングを使用してください。

## インストールメモ

Chrome のトークバック既定値は、2 つの外部ツールを使用します:

- `sox`: コマンドライン音声ユーティリティ。Plugin は、既定の 24 kHz PCM16 音声ブリッジ用に
  明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想音声ドライバー。Chrome/Meet が経由してルーティングできる
  `BlackHole 2ch` 音声デバイスを作成します。

OpenClaw はどちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、ユーザーに
Homebrew 経由でホスト依存関係としてインストールするよう案内しています。SoX のライセンスは
`LGPL-2.0-only AND GPL-2.0-only`、BlackHole は GPL-3.0 です。BlackHole を OpenClaw と
一緒にバンドルするインストーラーまたはアプライアンスを構築する場合は、BlackHole の
上流ライセンス条件を確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは、OpenClaw ブラウザー制御を通じて Meet URL を開き、
サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin は
起動前に `BlackHole 2ch` を確認します。設定されている場合、Chrome を開く前に音声ブリッジの
ヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は
`chrome` を使用し、Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は
`chrome-node` を使用します。ローカル Chrome では `browser.defaultProfile` でプロファイルを
選択します。`chrome.browserProfile` は `chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声を、ローカルの OpenClaw 音声ブリッジにルーティングしてください。
`BlackHole 2ch` がインストールされていない場合、音声経路なしで黙って参加するのではなく、
セットアップエラーで参加は失敗します。

### Twilio

Twilio トランスポートは、Voice Call Plugin に委任される厳格なダイヤルプランです。
Meet ページから電話番号を解析しません。

Chrome での参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に
使用してください。Google Meet は、その会議の電話ダイヤルイン番号と PIN を公開している必要があります。
OpenClaw は Meet ページからそれらを検出しません。

Voice Call Plugin は Chrome ノードではなく Gateway ホストで有効にしてください:

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

Twilio 認証情報は環境または設定を通じて提供します。環境を使うと、シークレットを
`openclaw.json` の外に置けます:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

リアルタイム音声プロバイダーがそれである場合は、代わりに OpenAI プロバイダー Plugin と
`OPENAI_API_KEY` で `realtime.provider: "openai"` を使用してください。

`voice-call` を有効化した後、Gateway を再起動または再読み込みしてください。Plugin 設定の変更は、
再読み込みされるまで、すでに実行中の Gateway プロセスには反映されません。

次に確認します:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委任が配線されている場合、`googlemeet setup` には成功した
`twilio-voice-call-plugin`、`twilio-voice-call-credentials`、および
`twilio-voice-call-webhook` チェックが含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

会議でカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth とプリフライト

`googlemeet create` はブラウザー自動化にフォールバックできるため、Meet リンクの作成に
OAuth は任意です。公式 API による作成、スペース解決、または Meet Media API の
プリフライトチェックが必要な場合に OAuth を設定してください。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープをリクエストし、Google アカウントを認可してから、得られた更新トークンを
Google Meet Plugin 設定に保存するか、`OPENCLAW_GOOGLE_MEET_*` 環境変数を提供します。

OAuth は Chrome 参加経路を置き換えません。ブラウザー参加を使用する場合、Chrome および
Chrome-node トランスポートは、サインイン済みの Chrome プロファイル、BlackHole/SoX、および
接続済みノードを通じて引き続き参加します。OAuth は公式 Google Meet API 経路専用です:
会議スペースの作成、スペースの解決、Meet Media API プリフライトチェックの実行です。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テストセットアップで機能します。アプリが Testing の間は、
     アプリを認可する各 Google アカウントをテストユーザーとして追加してください。
4. OpenClaw がリクエストするスコープを追加します:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth クライアント ID を作成します。
   - アプリケーションの種類: **Web application**。
   - 承認済みリダイレクト URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. クライアント ID とクライアントシークレットをコピーします。

`meetings.space.created` は Google Meet `spaces.create` に必要です。
`meetings.space.readonly` により、OpenClaw は Meet URL/コードをスペースに解決できます。
`meetings.space.settings` により、OpenClaw は API ルーム作成中に `accessType` などの
`SpaceConfig` 設定を渡せます。
`meetings.conference.media.readonly` は Meet Media API プリフライトおよびメディア作業用です。
実際の Media API 使用には、Google が Developer Preview への登録を求める場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略してください。

### 更新トークンを発行する

`oauth.clientId` と、必要に応じて `oauth.clientSecret` を設定するか、環境変数として渡してから、
次を実行します:

```bash
openclaw googlemeet auth login --json
```

このコマンドは、更新トークンを含む `oauth` 設定ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` の localhost コールバック、および `--manual` による
手動コピー/貼り付けフローを使用します。

例:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ブラウザーがローカルコールバックに到達できない場合は、手動モードを使用します:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 出力には次が含まれます:

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

`oauth` オブジェクトを Google Meet Plugin 設定の下に保存します:

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

更新トークンを設定内に置きたくない場合は、環境変数を優先してください。設定値と環境値の両方が
存在する場合、Plugin はまず設定を解決し、その後に環境フォールバックを使用します。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、および Meet 会議メディア
読み取りアクセスが含まれます。会議作成サポートが存在する前に認証した場合は、
`openclaw googlemeet auth login --json` を再実行して、更新トークンに
`meetings.space.created` スコープを持たせてください。

### doctor で OAuth を確認する

高速でシークレットを含まないヘルスチェックが必要な場合は、OAuth doctor を実行します:

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済みの Chrome ノードも必要としません。
OAuth 設定が存在し、更新トークンがアクセストークンを発行できることを確認します。JSON レポートには
`ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージなどのステータスフィールドのみが
含まれます。アクセストークン、更新トークン、クライアントシークレットは出力しません。

一般的な結果:

| チェック             | 意味                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` に加えて `oauth.refreshToken`、またはキャッシュされたアクセストークンが存在します。 |
| `oauth-token`        | キャッシュされたアクセストークンがまだ有効であるか、リフレッシュトークンが新しいアクセストークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                         |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                    |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用を伴う作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効になっており、認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存のミーティングスペースへの読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済み Google アカウントがアクセスできる既存スペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効である、同意済みのリフレッシュトークンに必要なスコープがない、または Google アカウントがその Meet スペースにアクセスできないことを意味します。リフレッシュトークンエラーは、`openclaw googlemeet auth login --json` を再実行し、新しい `oauth` ブロックを保存する必要があることを意味します。

ブラウザフォールバックには OAuth 認証情報は不要です。このモードでは、Google 認証は OpenClaw 設定ではなく、選択したノード上でサインイン済みの Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け入れられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または `spaces/{id}` を `spaces.get` 経由で解決します。

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア処理の前に事前チェックを実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後、ミーティング成果物と出席状況を一覧表示します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。そのミーティングについて保持されているすべてのレコードが必要な場合は、`--all-conference-records` を渡します。

Calendar ルックアップは、Meet 成果物を読み取る前に Google Calendar からミーティング URL を解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Google Meet リンクを持つ Calendar イベントを今日の `primary` カレンダーから検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、非プライマリカレンダーには `--calendar <id>` を使用します。Calendar ルックアップには、Calendar イベントの読み取り専用スコープを含む新しい OAuth ログインが必要です。`calendar-events` は、一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントを示します。

会議レコード ID がすでに分かっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

通話後にルームを閉じたい場合は、API で作成されたスペースのアクティブな会議を終了します。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

これは Google Meet `spaces.endActiveConference` を呼び出し、認可済みアカウントが管理できるスペースに対して `meetings.space.created` スコープ付きの OAuth を必要とします。OpenClaw は Meet URL、ミーティングコード、または `spaces/{id}` 入力を受け付け、アクティブな会議を終了する前に API スペースリソースへ解決します。これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止し、`end-active-conference` は Google Meet に対してそのスペースのアクティブな会議の終了を依頼します。

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

`artifacts` は、Google がそのミーティングについて公開している場合、会議レコードメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートのリソースメタデータを返します。大規模なミーティングでエントリ検索をスキップするには `--no-transcript-entries` を使用します。`attendance` は参加者を参加者セッション行に展開し、最初/最後に確認された時刻、合計セッション時間、遅刻/早退フラグ、サインイン済みユーザーまたは表示名でマージされた重複参加者リソースを含めます。未加工の参加者リソースを別々に保持するには `--no-merge-duplicates` を渡し、遅刻検出を調整するには `--late-after-minutes`、早退検出を調整するには `--early-before-minutes` を渡します。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。`manifest.json` は、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、および部分的な取得警告を記録します。フォルダーの横にポータブルアーカイブも書き出すには `--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには、`--include-doc-bodies` を渡します。これには Drive Meet 読み取り専用スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` がない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。スマートノート一覧、文字起こしエントリ、Drive ドキュメント本文エラーなど、Google が部分的な成果物エラーを返した場合、エクスポート全体を失敗させる代わりに、サマリーとマニフェストに警告が保持されます。フォルダーや ZIP を作成せずに同じ成果物/出席データを取得し、マニフェスト JSON を出力するには `--dry-run` を使用します。これは、大規模なエクスポートを書き出す前や、エージェントが件数、選択されたレコード、警告だけを必要とする場合に便利です。

エージェントは `google_meet` ツール経由でも同じバンドルを作成できます。

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

エクスポートマニフェストのみを返し、ファイル書き込みをスキップするには `"dryRun": true` を設定します。

エージェントは、明示的なアクセスポリシーを持つ API ベースのルームも作成できます。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

また、既知のルームのアクティブな会議を終了することもできます。

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

リッスン優先の検証では、エージェントはミーティングが有用であると主張する前に `test_listen` を使用する必要があります。

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

実際に保持されたミーティングに対して、ガード付きライブスモークを実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

誰かが話し、Meet 字幕が利用可能なミーティングに対して、ライブのリッスン優先ブラウザプローブを実行します。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` はガード付きライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は、保持された Meet URL、コード、または `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` は OAuth クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` はリフレッシュトークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本の成果物/出席ライブスモークには `https://www.googleapis.com/auth/meetings.space.readonly` と `https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar ルックアップには `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには `https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します。

```bash
openclaw googlemeet create
```

このコマンドは新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は公式 Google Meet API を使用します。OAuth 認証情報がない場合は、固定された Chrome ノードのサインイン済みブラウザプロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定した `google_meet` ツールを使用して、作成と参加を 1 ステップで実行できます。URL のみを作成するには、`"join": false` を渡します。

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

ブラウザフォールバックが URL を作成する前に Google ログインまたは Meet 権限のブロッカーに遭遇した場合、Gateway メソッドは失敗したレスポンスを返し、`google_meet` ツールはプレーンな文字列ではなく構造化された詳細を返します。

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

エージェントが `manualActionRequired: true` を見た場合、`manualActionMessage` とブラウザのノード/タブコンテキストを報告し、オペレーターがブラウザ手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

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

Meet を作成すると、デフォルトで参加します。Chrome または Chrome-node トランスポートで
ブラウザ経由で参加するには、ログイン済みの Google Chrome プロファイルが引き続き
必要です。プロファイルがログアウトしている場合、OpenClaw は `manualActionRequired: true` または
ブラウザのフォールバックエラーを報告し、再試行する前にオペレーターへ Google ログインの完了を
求めます。

Cloud プロジェクト、OAuth プリンシパル、会議参加者が Meet media APIs 向けの Google
Workspace Developer Preview Program に登録されていることを確認した後にのみ、
`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

共通の Chrome agent パスに必要なのは、Plugin の有効化、BlackHole、SoX、
リアルタイム文字起こしプロバイダーキー、設定済みの OpenClaw TTS プロバイダーだけです。
OpenAI がデフォルトの文字起こしプロバイダーです。デフォルトの agent-mode 文字起こし
プロバイダーを変更せずに、`bidi` モードで Google Gemini Live を使うには、
`realtime.voiceProvider` を `"google"` に、`realtime.model` を設定します。

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
- `defaultMode: "agent"`（`"realtime"` は `"agent"` のレガシー互換エイリアスとしてのみ
  受け付けられます。新しいツール呼び出しでは `"agent"` と指定してください）
- `chromeNode.node`: `chrome-node` の任意の node id/name/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ログアウト状態の Meet ゲスト画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザ自動化による、
  ベストエフォートのゲスト名入力と Join Now クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに既存の Meet タブをアクティブ化
- `chrome.waitForInCallMs: 20000`: トークバックのイントロがトリガーされる前に、
  Meet タブが通話中を報告するまで待機
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペアの音声形式。まだテレフォニー音声を
  出力するレガシー/カスタムのコマンドペアにのみ `"g711-ulaw-8khz"` を使用します。
- `chrome.audioBufferBytes: 4096`: 生成された Chrome コマンドペア音声コマンド用の
  SoX 処理バッファ。これは SoX のデフォルト 8192 バイトバッファの半分で、
  ビジーなホストで増やす余地を残しつつ、デフォルトのパイプレイテンシーを低減します。
  SoX の最小値を下回る値は 17 バイトにクランプされます。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、
  `chrome.audioFormat` で音声を書き出す SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` の音声を読み取り、
  CoreAudio `BlackHole 2ch` へ書き込む SoX コマンド
- `chrome.bargeInInputCommand`: assistant の再生中に人間の割り込み検出のため、
  signed 16-bit little-endian mono PCM を書き込む任意のローカルマイクコマンド。
  これは現在、Gateway ホストの `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` 上で人間の
  割り込みとして扱われる RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` 上で人間の
  割り込みとして扱われるピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返し発生する人間の割り込みクリア間の最小遅延
- `mode: "agent"`: デフォルトのトークバックモード。参加者の発話は設定済みの
  リアルタイム文字起こしプロバイダーによって文字起こしされ、会議ごとのサブエージェント
  セッション内で設定済みの OpenClaw agent に送信され、通常の OpenClaw TTS runtime を通じて
  音声で返されます。
- `mode: "bidi"`: フォールバックの直接双方向リアルタイムモデルモード。リアルタイム音声
  プロバイダーが参加者の発話に直接応答し、より深い/ツールに基づく回答のために
  `openclaw_agent_consult` を呼び出す場合があります。
- `mode: "transcribe"`: トークバックブリッジなしの観察専用モード。
- `realtime.provider: "openai"`: 下記のスコープ付きプロバイダーフィールドが未設定の場合に
  使用される互換フォールバック。
- `realtime.transcriptionProvider: "openai"`: `agent` モードでリアルタイム文字起こしに
  使用されるプロバイダー id。
- `realtime.voiceProvider`: `bidi` モードで直接リアルタイム音声に使用されるプロバイダー id。
  agent-mode の文字起こしを OpenAI のままにしながら Gemini Live を使うには、これを
  `"google"` に設定します。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 短い音声応答。より深い回答には `openclaw_agent_consult` を使用
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声レディネス確認。
  無音で参加するには `""` に設定
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw agent id。
  デフォルトは `main`

任意の上書き:

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

agent-mode のリスニングと発話の両方に ElevenLabs を使う場合:

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

永続的な Meet 音声は `messages.tts.providers.elevenlabs.speakerVoiceId` から取得されます。
TTS モデルの上書きが有効な場合、agent の返信では返信ごとの
`[[tts:speakerVoiceId=... model=eleven_v3]]` ディレクティブも使用できますが、
会議では設定が決定的なデフォルトです。参加時、ログには `transcriptionProvider=elevenlabs`
が表示され、各音声返信では
`provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` がログに記録されるはずです。

Twilio のみの設定:

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

`voiceCall.enabled` はデフォルトで `true` です。Twilio トランスポートでは、実際の
PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委譲します。Voice Call は
リアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存された
イントロテキストを最初のリアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、
Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話を発信することはできません。

## ツール

Agents は `google_meet` ツールを使用できます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Chrome が Gateway ホスト上で動作する場合は `transport: "chrome"` を使用します。
Chrome が Parallels VM などのペアリング済み node 上で動作する場合は
`transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと
`openclaw_agent_consult` は Gateway ホスト上で実行されるため、モデル認証情報はそこに
保持されます。デフォルトの `mode: "agent"` では、リアルタイム文字起こしプロバイダーが
リスニングを処理し、設定済みの OpenClaw agent が回答を生成し、通常の OpenClaw TTS が
それを Meet に発話します。リアルタイム音声モデルに直接応答させたい場合は
`mode: "bidi"` を使用します。生の `mode: "realtime"` は `mode: "agent"` の
レガシー互換エイリアスとして引き続き受け付けられますが、agent ツールスキーマでは
もう案内されません。Agent-mode のログには、ブリッジ起動時に解決済みの文字起こし
プロバイダー/モデルが含まれ、各合成返信後に TTS プロバイダー、モデル、音声、出力形式、
サンプルレートが含まれます。

アクティブなセッションを一覧表示する、またはセッション ID を調べるには
`action: "status"` を使用します。リアルタイム agent に即座に発話させるには、
`sessionId` と `message` とともに `action: "speak"` を使用します。セッションを作成または再利用し、
既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` ヘルスを返すには
`action: "test_speech"` を使用します。`test_speech` は常に `mode: "agent"` を強制し、
`mode: "transcribe"` での実行を求められると失敗します。観察専用セッションは意図的に
音声を出力できないためです。その `speechOutputVerified` の結果は、このテスト呼び出し中に
リアルタイム音声出力バイトが増加したかに基づくため、古い音声がある再利用セッションは、
新しい成功した音声チェックとしては数えられません。セッションを終了済みとしてマークするには
`action: "leave"` を使用します。

`status` には、利用可能な場合 Chrome のヘルスが含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見える
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話が機能する前に、
  ブラウザプロファイルで手動ログイン、Meet ホストの入室許可、権限、またはブラウザ制御の
  修復が必要
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome 発話が
  現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを
  音声ブリッジへ送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に見えた、またはブリッジへ送信された音声
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet タブのメディア出力が、ブリッジで
  使用される BlackHole デバイスへアクティブにルーティングされたかどうか
- `lastSuppressedInputAt` / `suppressedInputBytes`: assistant の再生中に無視された
  loopback 入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## agent と bidi モード

Chrome `agent` モードは、「自分の agent が会議に参加している」動作に最適化されています。
リアルタイム文字起こしプロバイダーが会議音声を聞き取り、最終的な参加者の文字起こしは
設定済みの OpenClaw agent にルーティングされ、回答は通常の OpenClaw TTS runtime を通じて
発話されます。リアルタイム音声モデルに直接応答させたい場合は `mode: "bidi"` を設定します。
近接する最終文字起こし断片は consult の前に結合されるため、1 回の発話ターンが複数の
古い部分回答を生成することはありません。キュー内の assistant 音声がまだ再生中の間は
リアルタイム入力も抑制され、agent consult の前には最近の assistant らしい文字起こしエコーが
無視されるため、BlackHole loopback によって agent が自分自身の発話に回答することはありません。

| モード | 回答を決定するもの | 音声出力パス | 使用する場面 |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 設定済みの OpenClaw agent | 通常の OpenClaw TTS runtime | 「自分の agent が会議に参加している」動作が必要な場合 |
| `bidi`  | リアルタイム音声モデル | リアルタイム音声プロバイダーの音声応答 | 最低レイテンシーの会話音声ループが必要な場合 |

`bidi` モードでは、リアルタイムモデルがより深い推論、現在の情報、または通常の OpenClaw
ツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

consult ツールは、最近の会議トランスクリプトのコンテキストを使って通常の OpenClaw エージェントをバックグラウンドで実行し、簡潔な音声向け回答を返します。`agent` モードでは、OpenClaw がその回答を TTS ランタイムへ直接送信します。`bidi` モードでは、リアルタイム音声モデルが consult 結果を会議内で発話できます。Voice Call と同じ共有 consult 仕組みを使用します。

デフォルトでは、consult は `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルのデフォルト、ツールポリシー、メモリ、セッション履歴を参照する必要がある場合は、`realtime.agentId` を設定します。

エージェントモードの consult は、会議ごとの `agent:<id>:subagent:google-meet:<session>` セッションキーを使用するため、フォローアップ質問は、設定済みエージェントから通常のエージェントポリシーを継承しながら会議コンテキストを保持します。

`realtime.toolPolicy` は consult 実行を制御します。

- `safe-read-only`: consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: consult ツールを公開し、通常のエージェントが通常のエージェントツールポリシーを使用できるようにします。
- `none`: consult ツールをリアルタイム音声モデルに公開しません。

consult セッションキーは Meet セッションごとにスコープされるため、フォローアップの consult 呼び出しは同じ会議中に以前の consult コンテキストを再利用できます。

Chrome が通話に完全に参加した後に、音声による準備完了チェックを強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

参加して発話する完全なスモークには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

会議を無人エージェントに引き渡す前に、このシーケンスを使用します。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node 状態:

- `googlemeet setup` がすべて緑です。
- Chrome-node がデフォルトトランスポートであるか、ノードが固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` に、選択したノードが接続済みとして表示されます。
- 選択したノードが `googlemeet.chrome` と `browser.proxy` の両方を通知します。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome ヘルスを返します。

Parallels macOS VM のようなリモート Chrome ホストでは、Gateway または VM の更新後、これが最短の安全なチェックです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際の会議タブを開く前に、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることを証明できます。

Twilio スモークでは、電話ダイヤルイン詳細を公開する会議を使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待される Twilio 状態:

- `googlemeet setup` に、緑の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。
- Gateway のリロード後、CLI で `voicecall` が利用可能です。
- 返されるセッションに `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` に、リアルタイム TwiML の前に提供された DTMF TwiML が表示され、その後、初期挨拶がキューに入ったリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` が委任された音声通話を切断します。

## トラブルシューティング

### エージェントが Google Meet ツールを確認できない

Plugin が Gateway 設定で有効になっていることを確認し、Gateway をリロードします。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動またはリロードします。実行中のエージェントには、現在の Gateway プロセスによって登録された Plugin ツールだけが表示されます。

macOS 以外の Gateway ホストでは、エージェント向けの `google_meet` ツールは表示されたままですが、ローカル Chrome のトークバックアクションは音声ブリッジに到達する前にブロックされます。ローカル Chrome のトークバック音声は現在 macOS の `BlackHole 2ch` に依存しているため、Linux エージェントはデフォルトのローカル Chrome エージェントパスではなく、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### 接続済みの Google Meet 対応ノードがない

ノードホストで実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで、ノードを承認し、コマンドを確認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードは接続済みであり、`googlemeet.chrome` と `browser.proxy` を一覧表示する必要があります。Gateway 設定では、それらのノードコマンドを許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` に失敗するか、Gateway ログが `gateway token mismatch` を報告する場合は、現在の Gateway トークンでノードを再インストールまたは再起動します。LAN Gateway の場合、通常は次のようになります。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

次に、ノードサービスをリロードして再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くがエージェントが参加できない

観察のみの参加には `googlemeet test-listen` を、リアルタイム参加には `googlemeet test-speech` を実行し、返された Chrome ヘルスを調べます。どちらかのプローブが `manualActionRequired: true` を報告する場合は、`manualActionMessage` をオペレーターに表示し、ブラウザーアクションが完了するまで再試行を停止します。

一般的な手動アクション:

- Chrome プロファイルにサインインします。
- Meet ホストアカウントからゲストを承認します。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome のマイク/カメラ権限を付与します。
- 固着した Meet 権限ダイアログを閉じるか修復します。

Meet に「会議で他のユーザーにあなたの音声を聞かせますか?」と表示されているだけで、「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は、利用可能な場合はブラウザー自動化を通じて **マイクを使用** をクリックし、実際の会議状態を待ち続けます。作成のみのブラウザーフォールバックでは、URL の作成にリアルタイム音声パスが不要なため、OpenClaw が **マイクなしで続行** をクリックする場合があります。

### 会議の作成に失敗する

`googlemeet create` は、OAuth 資格情報が設定されている場合、最初に Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 資格情報がない場合は、固定された Chrome ノードブラウザーにフォールバックします。次を確認します。

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されているか、一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在します。
- API 作成の場合: 更新トークンは作成サポートが追加された後に発行されています。古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新してください。
- ブラウザーフォールバックの場合: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済みノードを指しています。
- ブラウザーフォールバックの場合: そのノード上の OpenClaw Chrome プロファイルが Google にサインインしており、`https://meet.google.com/new` を開けます。
- ブラウザーフォールバックの場合: 再試行では、新しいタブを開く前に、既存の `https://meet.google.com/new` または Google アカウントプロンプトタブを再利用します。エージェントがタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行してください。
- ブラウザーフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用してオペレーターを誘導します。そのアクションが完了するまでループで再試行しないでください。
- ブラウザーフォールバックの場合: Meet に「会議で他のユーザーにあなたの音声を聞かせますか?」と表示されたら、タブを開いたままにします。OpenClaw はブラウザー自動化を通じて **マイクを使用**、または作成のみのフォールバックでは **マイクなしで続行** をクリックし、生成された Meet URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認します。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

通常の STT -> OpenClaw エージェント -> TTS トークバックパスには `mode: "agent"` を使用し、直接のリアルタイム音声フォールバックには `mode: "bidi"` を使用します。`mode: "transcribe"` は意図的にトークバックブリッジを開始しません。観察のみのデバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が true でも `transcriptLines` が `0` のままの場合、Meet の字幕が無効である、オブザーバーがインストールされて以降だれも話していない、Meet UI が変更された、または会議の言語/アカウントでライブ字幕が利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスを確認し、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け付けたものの、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達するのを確認できなかった可能性があります。

次も確認します。

- `OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーが Gateway ホストで利用可能です。
- Chrome ホストで `BlackHole 2ch` が表示されています。
- Chrome ホストに `sox` があります。
- Meet のマイクとスピーカーが、OpenClaw が使用する仮想音声パスを通じてルーティングされています。ローカル Chrome のリアルタイム参加では、`doctor` に `meet output routed: yes` が表示される必要があります。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、手動アクション理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入力/出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザー URL を出力します。生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用します。トークンを公開せずに Google Meet OAuth 更新を確認する必要がある場合は `googlemeet doctor --oauth` を使用します。Google Meet API の証明も必要な場合は `--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いていることを確認できる場合は、別のタブを開かずにそのタブを調べます。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。選択したトランスポートの既存の Meet タブにフォーカスし、調べます。`chrome` では Gateway 経由のローカルブラウザー制御を使用します。`chrome-node` では設定済み Chrome ノードを使用します。新しいタブを開いたり、新しいセッションを作成したりはしません。ログイン、承認、権限、音声選択状態など、現在のブロッカーを報告します。CLI コマンドは設定済み Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では、Chrome ノードも接続されている必要があります。

### Twilio セットアップチェックが失敗する

`voice-call` が許可されていないか有効になっていない場合、`twilio-voice-call-plugin` は失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway をリロードします。

Twilio バックエンドにアカウント SID、認証トークン、または発信者番号がない場合、`twilio-voice-call-credentials` は失敗します。Gateway ホストでこれらを設定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` にパブリック Webhook 公開がない場合、または `publicUrl` がループバックやプライベートネットワーク空間を指している場合、`twilio-voice-call-webhook` は失敗します。`plugins.entries.voice-call.config.publicUrl` をパブリックプロバイダー URL に設定するか、`voice-call` トンネル/Tailscale 公開を設定します。

ループバック URL とプライベート URL はキャリアコールバックには有効ではありません。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

安定したパブリック URL には:

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

ローカル開発では、プライベートホスト URL ではなくトンネルまたは Tailscale 公開を使用します。

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

その後、Gateway を再起動または再読み込みして、次を実行します。

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトでは準備状態の確認のみです。特定の番号でドライランするには次を実行します。

```bash
openclaw voicecall smoke --to "+15555550123"
```

意図的にライブのアウトバウンド通知通話を発信したい場合にのみ `--yes` を追加します。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが会議に参加しない

Meet イベントが電話のダイヤルイン詳細を公開していることを確認します。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN を入力する前にプロバイダーが一時停止を必要とする場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

電話通話は作成されるものの、Meet の参加者一覧にダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>` を実行して、委任された Twilio 通話 ID、DTMF がキューに入ったかどうか、イントロ挨拶がリクエストされたかどうかを確認します。
- `openclaw voicecall status --call-id <id>` を実行し、通話がまだアクティブであることを確認します。
- `openclaw voicecall tail` を実行し、Twilio Webhook が Gateway に到着していることを確認します。
- `openclaw logs --follow` を実行し、Twilio Meet シーケンスを探します。Google Meet が参加を委任し、Voice Call が接続前 DTMF TwiML を保存して提供し、Voice Call が Twilio 通話用のリアルタイム TwiML を提供し、その後 Google Meet が `voicecall.speak` でイントロ音声をリクエストします。
- `openclaw googlemeet setup --transport twilio` を再実行します。緑のセットアップチェックは必須ですが、会議 PIN シーケンスが正しいことまでは証明しません。
- ダイヤルイン番号が PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合、または接続前 DTMF の送信後も通話トランスクリプトに PIN の入力を求めるプロンプトが表示される場合は、`voiceCall.dtmfDelayMs` をデフォルトの 12 秒から増やします。
- 参加者は参加しているが挨拶が聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` リクエストと、メディアストリーム TTS 再生または Twilio `<Say>` フォールバックを確認します。通話トランスクリプトにまだ「enter the meeting PIN」が含まれている場合、電話側はまだ Meet ルームに参加していないため、会議参加者には音声が聞こえません。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグします。プロバイダーは `plugins.entries.voice-call.config.publicUrl` または設定済みのトンネルに到達できる必要があります。[Voice call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注意事項

Google Meet の公式メディア API は受信指向のため、Meet 通話で発話するには引き続き参加者パスが必要です。この Plugin はその境界を明確に保ちます。Chrome はブラウザー参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome のトークバックモードには `BlackHole 2ch` と、次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がブリッジを所有し、それらのコマンドと選択されたプロバイダーの間で `chrome.audioFormat` の音声をパイプします。エージェントモードではリアルタイム文字起こしと通常の TTS を使用します。bidi モードではリアルタイム音声プロバイダーを使用します。デフォルトの Chrome パスは 24 kHz PCM16 と `chrome.audioBufferBytes: 4096` です。8 kHz G.711 mu-law はレガシーコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を所有し、デーモンの起動または検証後に終了する必要があります。これは `bidi` の場合のみ有効です。`agent` モードでは TTS のためにコマンドペアへの直接アクセスが必要なためです。

エージェントモードでエージェントが `google_meet` ツールを呼び出すと、会議コンサルタントセッションは参加者の発話に応答する前に呼び出し元の現在のトランスクリプトをフォークします。Meet セッションは引き続き別個のままです (`agent:<agentId>:subagent:google-meet:<sessionId>`)。そのため、会議のフォローアップが呼び出し元のトランスクリプトを直接変更することはありません。

クリーンな二重音声のために、Meet 出力と Meet マイクを別々の仮想デバイス、または Loopback スタイルの仮想デバイスグラフにルーティングします。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタント再生をクリアできます。これにより、アシスタント再生中に共有 BlackHole ループバック入力が一時的に抑制されている場合でも、人間の発話をアシスタント出力より優先できます。`chrome.audioInputCommand` や `chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。明示的に信頼されたコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は Chrome セッションのアクティブなトークバック音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin を通じて委任された Twilio セッションでは、`leave` は基礎となる音声通話も切断します。API 管理のスペースでアクティブな Google Meet 会議も閉じたい場合は、`googlemeet end-active-conference` を使用します。

## 関連

- [Voice call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
