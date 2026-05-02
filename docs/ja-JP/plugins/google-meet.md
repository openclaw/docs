---
read_when:
    - OpenClaw エージェントを Google Meet 通話に参加させたい場合
    - OpenClaw エージェントに新しい Google Meet の通話を作成させたい
    - Google MeetトランスポートとしてChrome、Chromeノード、またはTwilioを設定しています
summary: 'Google Meet プラグイン: 明示的な Meet URL に Chrome または Twilio で参加し、リアルタイム音声のデフォルトを使用する'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T20:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet参加者サポートはOpenClaw向けに、設計上明示的になっています。

- 明示的な`https://meet.google.com/...` URLにのみ参加します。
- Google Meet APIを通じて新しいMeetスペースを作成し、返されたURLに参加できます。
- `realtime`音声がデフォルトモードです。
- リアルタイム音声は、より深い推論やツールが必要な場合に完全なOpenClawエージェントへコールバックできます。
- エージェントは`mode`で参加動作を選択します。ライブの聞き取り/応答には`realtime`を使い、リアルタイム音声ブリッジなしでブラウザーに参加/制御するには`transcribe`を使います。
- 認証は個人のGoogle OAuth、またはすでにサインイン済みのChromeプロファイルから開始します。
- 自動の同意アナウンスはありません。
- デフォルトのChrome音声バックエンドは`BlackHole 2ch`です。
- Chromeはローカル、またはペアリング済みのノードホストで実行できます。
- Twilioはダイヤルイン番号に加えて任意のPINまたはDTMFシーケンスを受け付けますが、Meet URLへ直接ダイヤルすることはできません。
- CLIコマンドは`googlemeet`です。`meet`は、より広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、バックエンドのリアルタイム音声プロバイダーを設定します。デフォルトはOpenAIです。Google Gemini Liveも`realtime.provider: "google"`で動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`は`BlackHole 2ch`仮想音声デバイスをインストールします。Homebrewのインストーラーでは、macOSがデバイスを公開する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Pluginを有効にします。

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

セットアップ出力は、エージェントが読み取りやすく、モードを認識できることを意図しています。Chromeプロファイル、ノード固定、およびリアルタイムChrome参加ではBlackHole/SoX音声ブリッジと遅延リアルタイム導入チェックを報告します。観察専用の参加では、同じトランスポートを`--mode transcribe`で確認します。このモードはブリッジ経由で聞いたり話したりしないため、リアルタイム音声の前提条件をスキップします。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio委任が設定されている場合、セットアップは`voice-call` Plugin、Twilio認証情報、公開Webhook公開の準備ができているかも報告します。エージェントに参加を依頼する前に、`ok: false`のチェックは、その確認対象のトランスポートとモードのブロッカーとして扱ってください。スクリプトや機械可読出力には`openclaw googlemeet setup --json`を使います。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または`--transport twilio`を使います。

Twilioでは、デフォルトのトランスポートがChromeの場合、必ず明示的にトランスポートを事前確認します。

```bash
openclaw googlemeet setup --transport twilio
```

これにより、エージェントが会議へダイヤルを試みる前に、`voice-call`の配線不足、Twilio認証情報の欠落、または到達不能なWebhook公開を検出できます。

会議に参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、`google_meet`ツールを通じてエージェントに参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

エージェント向けの`google_meet`ツールは、非macOSホストでもアーティファクト、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node`フローで引き続き利用できます。ローカルChromeのリアルタイムアクションは、同梱のリアルタイムChrome音声パスが現在macOSの`BlackHole 2ch`に依存しているため、そこでブロックされます。Linuxでは、リアルタイムChrome参加に`mode: "transcribe"`、Twilioダイヤルイン、またはmacOSの`chrome-node`ホストを使ってください。

新しい会議を作成して参加します。

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

APIで作成されるルームでは、Googleアカウントのデフォルトから継承するのではなく、ルームのノック不要ポリシーを明示したい場合にGoogle Meetの`SpaceConfig.accessType`を使います。

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN`は、Meet URLを持つ誰でもノックなしで参加できるようにします。`TRUSTED`は、ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザーがノックなしで参加できるようにします。`RESTRICTED`は、ノック不要の入室を招待者に制限します。これらの設定は公式のGoogle Meet API作成パスにのみ適用されるため、OAuth認証情報を設定する必要があります。

このオプションが利用可能になる前にGoogle Meetを認証していた場合は、Google OAuth同意画面に`meetings.space.settings`スコープを追加した後、`openclaw googlemeet auth login --json`を再実行してください。

参加せずにURLだけを作成します。

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`には2つのパスがあります。

- API作成: Google Meet OAuth認証情報が設定されている場合に使われます。これは最も決定的なパスで、ブラウザーUI状態に依存しません。
- ブラウザーフォールバック: OAuth認証情報がない場合に使われます。OpenClawは固定されたChromeノードを使い、`https://meet.google.com/new`を開き、Googleが実際の会議コードURLへリダイレクトするのを待ってから、そのURLを返します。このパスでは、ノード上のOpenClaw ChromeプロファイルがすでにGoogleにサインインしている必要があります。ブラウザー自動化はMeet独自の初回マイクプロンプトを処理します。そのプロンプトはGoogleログイン失敗として扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存のMeetタブも再利用しようとします。照合では`authuser`などの無害なURLクエリ文字列を無視するため、エージェントの再試行は2つ目のChromeタブを作成するのではなく、すでに開いている会議にフォーカスするはずです。

コマンド/ツール出力には`source`フィールド（`api`または`browser`）が含まれるため、エージェントはどのパスが使われたかを説明できます。`create`はデフォルトで新しい会議に参加し、`joined: true`と参加セッションを返します。URLだけを発行するには、CLIで`create --no-join`を使うか、ツールに`"join": false`を渡します。

またはエージェントに「Google Meetを作成し、リアルタイム音声で参加して、リンクを送ってください」と伝えます。エージェントは`action: "create"`で`google_meet`を呼び出し、返された`meetingUri`を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

観察専用/ブラウザー制御の参加では、`"mode": "transcribe"`を設定します。これは双方向リアルタイムモデルブリッジを開始せず、BlackHoleやSoXを必要とせず、会議へ話し返しません。このモードのChrome参加では、OpenClawのマイク/カメラ権限付与とMeetの**マイクを使用**パスも回避します。Meetが音声選択インタースティシャルを表示した場合、自動化はマイクなしパスを試み、それ以外の場合はローカルマイクを開くのではなく手動アクションを報告します。transcribeモードでは、管理対象ChromeトランスポートもベストエフォートのMeet字幕オブザーバーをインストールします。`googlemeet status --json`と`googlemeet doctor`は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、および短い`recentTranscript`末尾を表示するため、オペレーターはブラウザーが通話に参加したか、Meet字幕がテキストを生成しているかを判断できます。
はい/いいえのプローブが必要な場合は、`openclaw googlemeet test-listen <meet-url> --transport chrome-node`を使います。これはtranscribeモードで参加し、新しい字幕またはトランスクリプトの動きを待ち、`listenVerified`、`listenTimedOut`、手動アクションフィールド、最新の字幕ヘルスを返します。

リアルタイムセッション中、`google_meet`ステータスには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最終入力/出力タイムスタンプ、バイトカウンター、ブリッジ終了状態などのブラウザーおよび音声ブリッジのヘルスが含まれます。安全なMeetページプロンプトが表示された場合、ブラウザー自動化は可能な場合に処理します。ログイン、ホスト承認、ブラウザー/OS権限プロンプトは、エージェントが中継するための理由とメッセージ付きで手動アクションとして報告されます。管理対象Chromeセッションは、ブラウザーヘルスが`inCall: true`を報告した後にのみ導入またはテストフレーズを発します。それ以外の場合、ステータスは`speechReady: false`を報告し、エージェントが会議へ話したふりをするのではなく、発話の試行がブロックされます。

ローカルChrome参加は、サインイン済みのOpenClawブラウザープロファイルを通じて行われます。リアルタイムモードでは、OpenClawが使うマイク/スピーカーパスに`BlackHole 2ch`が必要です。クリーンな双方向音声には、別々の仮想デバイスまたはLoopback形式のグラフを使います。初回のスモークテストには単一のBlackHoleデバイスで十分ですが、エコーが発生する可能性があります。

### ローカルGateway + Parallels Chrome

VMにChromeを所有させるだけなら、macOS VM内に完全なOpenClaw GatewayやモデルAPIキーは必要**ありません**。Gatewayとエージェントをローカルで実行し、VMでノードホストを実行します。VM上で同梱Pluginを一度有効にして、ノードがChromeコマンドを公開するようにします。

どこで何を実行するか:

- Gatewayホスト: OpenClaw Gateway、エージェントワークスペース、モデル/APIキー、リアルタイムプロバイダー、Google Meet Plugin設定。
- Parallels macOS VM: OpenClaw CLI/ノードホスト、Google Chrome、SoX、BlackHole 2ch、Googleにサインイン済みのChromeプロファイル。
- VMで不要なもの: Gatewayサービス、エージェント設定、OpenAI/GPTキー、またはモデルプロバイダー設定。

VMの依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHoleのインストール後、macOSが`BlackHole 2ch`を公開するようにVMを再起動します。

```bash
sudo reboot
```

再起動後、VMが音声デバイスとSoXコマンドを認識できることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VMにOpenClawをインストールまたは更新し、そこで同梱Pluginを有効にします。

```bash
openclaw plugins enable google-meet
```

VMでノードホストを開始します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`がLAN IPで、TLSを使っていない場合、その信頼済みプライベートネットワークに明示的にオプトインしない限り、ノードはプレーンテキストWebSocketを拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ノードをLaunchAgentとしてインストールする場合も、同じ環境変数を使います。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`はプロセス環境であり、`openclaw.json`設定ではありません。`openclaw node install`は、インストールコマンドに存在する場合、それをLaunchAgent環境に保存します。

Gatewayホストからノードを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gatewayがノードを認識し、`googlemeet.chrome`とブラウザー機能/`browser.proxy`の両方を公開していることを確認します。

```bash
openclaw nodes status
```

Gatewayホストで、そのノードを通じてMeetをルーティングします。

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

これでGatewayホストから通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに`transport: "chrome-node"`で`google_meet`ツールを使うよう依頼します。

セッションを作成または再利用し、既知のフレーズを発話し、セッションヘルスを出力するワンコマンドのスモークテスト:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、OpenClaw のブラウザー自動化はゲスト名を入力し、参加/参加をリクエストをクリックし、そのプロンプトが表示された場合は Meet の初回実行時の「マイクを使用」選択を受け入れます。観察のみの参加中またはブラウザーのみの会議作成中は、その選択肢が利用可能な場合、マイクなしで同じプロンプトを先に進めます。ブラウザープロファイルがサインインしていない場合、Meet がホストの承認を待っている場合、リアルタイム参加に Chrome のマイク/カメラ権限が必要な場合、または Meet が自動化で解決できなかったプロンプトで停止している場合、参加/test-speech 結果は `manualActionRequired: true` と `manualActionReason` および `manualActionMessage` を報告します。エージェントは参加の再試行を停止し、その正確なメッセージに現在の `browserUrl`/`browserTitle` を添えて報告し、手動のブラウザー操作が完了した後でのみ再試行する必要があります。

`chromeNode.node` が省略された場合、OpenClaw は接続済みノードのうち、`googlemeet.chrome` とブラウザー制御の両方を通知しているノードがちょうど 1 つだけの場合にのみ自動選択します。対応可能なノードが複数接続されている場合は、`chromeNode.node` をノード ID、表示名、またはリモート IP に設定します。

よくある失敗の確認:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは Gateway に認識されていますが、利用できません。エージェントは、そのノードを利用可能な Chrome ホストとしてではなく診断状態として扱い、ユーザーが求めた場合を除き、別のトランスポートにフォールバックするのではなくセットアップ上のブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM で `openclaw node run` を開始し、ペアリングを承認し、VM で `openclaw plugins enable google-meet` と `openclaw plugins enable browser` が実行済みであることを確認します。また、Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` で両方のノードコマンドを許可していることも確認します。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch` をインストールし、ローカル Chrome 音声を使用する前に再起動します。
- `BlackHole 2ch audio device not found on the node`: VM に `blackhole-2ch` をインストールし、VM を再起動します。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、ゲスト参加用に `chrome.guestName` を設定したままにします。ゲスト自動参加は、ノードのブラウザープロキシを介して OpenClaw のブラウザー自動化を使用します。たとえば `browser.defaultProfile: "user"` や名前付きの既存セッションプロファイルなど、ノードのブラウザー設定が使用したいプロファイルを指していることを確認します。
- Meet タブが重複する: `chrome.reuseExistingTab: true` を有効にしたままにします。OpenClaw は新しいタブを開く前に、同じ Meet URL の既存タブをアクティブ化します。また、ブラウザーでの会議作成は、別のタブを開く前に進行中の `https://meet.google.com/new` または Google アカウントのプロンプトタブを再利用します。
- 音声がない: Meet で、OpenClaw が使用する仮想オーディオデバイスパスを通してマイク/スピーカーをルーティングします。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールメモ

Chrome リアルタイムのデフォルトは 2 つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。Plugin は、デフォルトの 24 kHz PCM16 音声ブリッジに明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想オーディオドライバー。Chrome/Meet が経由してルーティングできる `BlackHole 2ch` オーディオデバイスを作成します。

OpenClaw はどちらのパッケージも同梱または再配布しません。ドキュメントでは、ユーザーに Homebrew 経由でホスト依存関係としてインストールするよう案内しています。SoX のライセンスは `LGPL-2.0-only AND GPL-2.0-only`、BlackHole は GPL-3.0 です。BlackHole を OpenClaw とともに同梱するインストーラーやアプライアンスを構築する場合は、BlackHole の upstream ライセンス条件を確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは OpenClaw のブラウザー制御を通じて Meet URL を開き、サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin は起動前に `BlackHole 2ch` を確認します。設定されている場合は、Chrome を開く前に音声ブリッジのヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は `chrome` を使用します。Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は `chrome-node` を使用します。ローカル Chrome では、`browser.defaultProfile` でプロファイルを選択します。`chrome.browserProfile` は `chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声をローカルの OpenClaw 音声ブリッジ経由でルーティングします。`BlackHole 2ch` がインストールされていない場合、音声パスなしで暗黙に参加するのではなく、セットアップエラーで参加に失敗します。

### Twilio

Twilio トランスポートは Voice Call Plugin に委譲される厳密なダイヤルプランです。Meet ページから電話番号を解析しません。

Chrome 参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。Google Meet は、その会議用の電話ダイヤルイン番号と PIN を公開している必要があります。OpenClaw はそれらを Meet ページから検出しません。

Voice Call Plugin は Chrome ノードではなく Gateway ホストで有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // または Twilio をデフォルトにする場合は "twilio" を設定
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio 認証情報は環境または設定で提供します。環境を使うと、シークレットを `openclaw.json` の外に置けます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` を有効にした後、Gateway を再起動または再読み込みします。Plugin 設定の変更は、再読み込みされるまで、すでに実行中の Gateway プロセスには反映されません。

次に検証します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委譲が接続されている場合、`googlemeet setup` には成功した `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

会議にカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth と事前チェック

`googlemeet create` はブラウザー自動化にフォールバックできるため、Meet リンクの作成に OAuth は任意です。公式 API での作成、スペース解決、または Meet Media API の事前チェックが必要な場合に OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、必要なスコープをリクエストし、Google アカウントを承認してから、結果のリフレッシュトークンを Google Meet Plugin 設定に保存するか、`OPENCLAW_GOOGLE_MEET_*` 環境変数を提供します。

OAuth は Chrome 参加パスを置き換えません。ブラウザー参加を使用する場合、Chrome および Chrome-node トランスポートは引き続き、サインイン済みの Chrome プロファイル、BlackHole/SoX、接続済みノードを通じて参加します。OAuth は公式 Google Meet API パス専用です。会議スペースを作成し、スペースを解決し、Meet Media API の事前チェックを実行します。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テストセットアップで機能します。アプリが Testing 中の場合、アプリを承認する各 Google アカウントをテストユーザーとして追加します。
4. OpenClaw がリクエストするスコープを追加します。
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
`meetings.space.settings` により、OpenClaw は API でのルーム作成時に `accessType` などの `SpaceConfig` 設定を渡せます。
`meetings.conference.media.readonly` は Meet Media API の事前チェックとメディア作業用です。実際の Media API 使用には、Google が Developer Preview への登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略してください。

### リフレッシュトークンを発行する

`oauth.clientId` と任意で `oauth.clientSecret` を設定するか、それらを環境変数として渡してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。PKCE、`http://localhost:8085/oauth2callback` 上の localhost コールバック、および `--manual` による手動コピー/貼り付けフローを使用します。

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

リフレッシュトークンを設定に入れたくない場合は、環境変数を優先します。設定値と環境値の両方が存在する場合、Plugin はまず設定を解決し、その後で環境フォールバックを使用します。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、Meet 会議メディア読み取りアクセスが含まれます。会議作成サポートが存在する前に認証した場合は、リフレッシュトークンが `meetings.space.created` スコープを持つように、`openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を検証する

高速でシークレットを出力しないヘルスチェックが必要な場合は、OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済み Chrome ノードも必要としません。OAuth 設定が存在すること、およびリフレッシュトークンでアクセストークンを発行できることを確認します。JSON レポートには、`ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージなどのステータスフィールドのみが含まれます。アクセストークン、リフレッシュトークン、クライアントシークレットは出力されません。

よくある結果:

| チェック             | 意味                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済みアクセストークンが存在します。 |
| `oauth-token`        | キャッシュ済みアクセストークンがまだ有効であるか、リフレッシュトークンが新しいアクセストークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                       |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                  |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用のある作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効になっていること、および認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存のミーティングスペースへの読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済みの Google アカウントがアクセスできる既存のスペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効、同意済みのリフレッシュトークンに必要なスコープがない、または Google アカウントがその Meet スペースにアクセスできないことを意味します。リフレッシュトークンエラーは、`openclaw googlemeet auth login --json` を再実行して新しい `oauth` ブロックを保存する必要があることを意味します。

ブラウザーフォールバックには OAuth 認証情報は不要です。このモードでは、Google 認証は OpenClaw 設定ではなく、選択した Node 上でサインイン済みの Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け付けられます:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または `spaces/{id}` を `spaces.get` 経由で解決します:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア作業の前に事前確認を実行します:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後に、ミーティングの成果物と出席状況を一覧表示します:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。そのミーティングで保持されているすべてのレコードが必要な場合は、`--all-conference-records` を渡します。

Calendar 検索では、Meet 成果物を読み取る前に Google Calendar からミーティング URL を解決できます:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、今日の `primary` カレンダーから Google Meet リンクを持つ Calendar イベントを検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、非プライマリカレンダーには `--calendar <id>` を使用します。Calendar 検索には、Calendar events readonly スコープを含む新しい OAuth ログインが必要です。
`calendar-events` は一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントを示します。

会議レコード ID がすでにわかっている場合は、直接指定します:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

通話後にルームを閉じたい場合は、API で作成されたスペースのアクティブな会議を終了します:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

これは Google Meet `spaces.endActiveConference` を呼び出し、認可済みアカウントが管理できるスペースについて `meetings.space.created` スコープを持つ OAuth が必要です。
OpenClaw は Meet URL、ミーティングコード、または `spaces/{id}` 入力を受け付け、アクティブな会議を終了する前に API スペースリソースへ解決します。
これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止しますが、`end-active-conference` は Google Meet に対して、そのスペースのアクティブな会議を終了するよう要求します。

読みやすいレポートを書き出します:

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

`artifacts` は、Google がそのミーティングについて公開している場合、会議レコードのメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリー、スマートノートのリソースメタデータを返します。大規模なミーティングでエントリー検索をスキップするには `--no-transcript-entries` を使用します。`attendance` は参加者を参加者セッション行に展開し、最初/最後に確認された時刻、合計セッション時間、遅刻/早退フラグ、およびサインイン済みユーザーまたは表示名でマージされた重複参加者リソースを含めます。生の参加者リソースを分けたままにするには `--no-merge-duplicates`、遅刻判定を調整するには `--late-after-minutes`、早退判定を調整するには `--early-before-minutes` を渡します。

`export` は `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。
`manifest.json` は、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、および部分的な取得警告を記録します。フォルダーの横にポータブルなアーカイブも書き出すには `--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには、`--include-doc-bodies` を渡します。これには Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` がない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリーのみが含まれます。スマートノート一覧、文字起こしエントリー、または Drive ドキュメント本文エラーなど、Google が部分的な成果物エラーを返した場合、エクスポート全体を失敗させる代わりに、サマリーとマニフェストに警告が保持されます。
`--dry-run` を使用すると、同じ成果物/出席データを取得し、フォルダーや ZIP を作成せずにマニフェスト JSON を出力します。これは、大規模なエクスポートを書き出す前、またはエージェントが件数、選択されたレコード、警告だけを必要とする場合に便利です。

エージェントは `google_meet` ツール経由でも同じバンドルを作成できます:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ファイル書き込みをスキップしてエクスポートマニフェストだけを返すには、`"dryRun": true` を設定します。

エージェントは、明示的なアクセスポリシーを持つ API ベースのルームも作成できます:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

また、既知のルームのアクティブな会議を終了できます:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

リッスンファースト検証では、エージェントはミーティングが有用だと主張する前に `test_listen` を使用する必要があります:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

実際に保持されているミーティングに対して、保護付きライブスモークを実行します:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

誰かが発話し、Meet の字幕が利用できるミーティングに対して、ライブのリッスンファーストブラウザープローブを実行します:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` は保護付きライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は保持済みの Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth
  クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は
  リフレッシュトークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本の成果物/出席ライブスモークには
`https://www.googleapis.com/auth/meetings.space.readonly` と
`https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar 検索には `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには
`https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します:

```bash
openclaw googlemeet create
```

このコマンドは新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は公式の Google Meet API を使用します。OAuth 認証情報がない場合は、固定された Chrome Node のサインイン済みブラウザープロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定して `google_meet` ツールを使用し、1 ステップで作成と参加を実行できます。URL のみを作成する場合は、`"join": false` を渡します。

ブラウザーフォールバックからの JSON 出力例:

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

ブラウザーフォールバックが URL を作成する前に Google ログインまたは Meet 権限ブロッカーに到達した場合、Gateway メソッドは失敗レスポンスを返し、`google_meet` ツールは単なる文字列ではなく構造化された詳細を返します:

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

エージェントが `manualActionRequired: true` を確認した場合、`manualActionMessage` とブラウザーの Node/タブのコンテキストを報告し、オペレーターがブラウザー手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

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

Meet の作成ではデフォルトで参加します。Chrome または Chrome Node トランスポートでブラウザー経由で参加するには、サインイン済みの Google Chrome プロファイルが引き続き必要です。プロファイルがサインアウトしている場合、OpenClaw は `manualActionRequired: true` またはブラウザーフォールバックエラーを報告し、再試行する前に Google ログインを完了するようオペレーターに求めます。

Cloud プロジェクト、OAuth プリンシパル、ミーティング参加者が Meet メディア API 向けの Google Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定します。

## 設定

一般的な Chrome リアルタイムパスに必要なのは、有効化された Plugin、BlackHole、SoX、およびバックエンドのリアルタイム音声プロバイダーキーだけです。デフォルトは OpenAI です。Google Gemini Live を使用するには `realtime.provider: "google"` を設定します:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node` の任意のノード ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウトした Meet ゲスト画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザー自動化による、ベストエフォートのゲスト名入力と「Join Now」クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに、既存の Meet タブをアクティブにする
- `chrome.waitForInCallMs: 20000`: リアルタイムのイントロがトリガーされる前に、Meet タブが通話中を報告するまで待機する
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペアの音声形式。電話音声をまだ出力するレガシー/カスタムのコマンドペアにのみ `"g711-ulaw-8khz"` を使用します。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` の音声を書き出す SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` の音声を読み取り、CoreAudio `BlackHole 2ch` に書き込む SoX コマンド
- `chrome.bargeInInputCommand`: アシスタントの再生中に人間の割り込み検出のため、符号付き 16 ビットリトルエンディアンのモノラル PCM を書き出す任意のローカルマイクコマンド。これは現在、Gateway がホストする `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` で人間の割り込みとして扱う RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` で人間の割り込みとして扱うピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返しの人間の割り込みクリア間の最小遅延
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: より深い回答には `openclaw_agent_consult` を使う、短い音声応答
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声準備確認。無音で参加するには `""` に設定します
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw エージェント ID。デフォルトは `main`

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
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委任します。Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存されたイントロテキストを最初のリアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話は発信できません。

## ツール

エージェントは `google_meet` ツールを使用できます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome が Gateway ホストで実行される場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノードで実行される場合は `transport: "chrome-node"` を使用します。どちらの場合も、リアルタイムモデルと `openclaw_agent_consult` は Gateway ホストで実行されるため、モデル認証情報はそこに保持されます。

アクティブなセッションを一覧表示するか、セッション ID を確認するには `action: "status"` を使用します。リアルタイムエージェントにすぐ話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` ヘルスを返すには `action: "test_speech"` を使用します。`test_speech` は常に `mode: "realtime"` を強制し、意図的に発話を出力できない観察専用セッションであるため、`mode: "transcribe"` で実行するよう求められた場合は失敗します。その `speechOutputVerified` 結果は、このテスト呼び出し中にリアルタイム音声出力バイトが増加したことに基づくため、古い音声がある再利用セッションは新しい発話確認の成功として扱われません。セッションを終了済みとしてマークするには `action: "leave"` を使用します。

`status` には、利用可能な場合 Chrome ヘルスが含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見える
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話が機能する前に、ブラウザープロファイルで手動ログイン、Meet ホストによる許可、権限、またはブラウザー制御の修復が必要
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome の発話が現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを音声ブリッジへ送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に見られた、またはブリッジへ送信された音声
- `lastSuppressedInputAt` / `suppressedInputBytes`: アシスタント再生中に無視されたループバック入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## リアルタイムエージェントコンサルト

Chrome リアルタイムモードは、ライブ音声ループに最適化されています。リアルタイム音声プロバイダーは会議音声を聞き、設定された音声ブリッジを通じて話します。リアルタイムモデルがより深い推論、現在の情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

コンサルトツールは、最近の会議文字起こしコンテキストを使って背後で通常の OpenClaw エージェントを実行し、リアルタイム音声セッションへ簡潔な音声回答を返します。その後、音声モデルはその回答を会議に話し返せます。Voice Call と同じ共有リアルタイムコンサルトツールを使用します。

デフォルトでは、コンサルトは `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルデフォルト、ツールポリシー、メモリ、セッション履歴を参照すべき場合は `realtime.agentId` を設定します。

`realtime.toolPolicy` はコンサルト実行を制御します。

- `safe-read-only`: コンサルトツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: コンサルトツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。
- `none`: リアルタイム音声モデルにコンサルトツールを公開しません。

コンサルトセッションキーは Meet セッションごとにスコープされるため、同じ会議中の後続のコンサルト呼び出しでは、以前のコンサルトコンテキストを再利用できます。

Chrome が通話に完全に参加した後で音声準備確認を強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全な参加と発話のスモークには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

無人エージェントに会議を引き渡す前に、このシーケンスを使用します。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

想定される Chrome-node 状態:

- `googlemeet setup` がすべて緑である。
- Chrome-node がデフォルトトランスポートであるか、ノードが固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれる。
- `nodes status` に、選択されたノードが接続済みとして表示される。
- 選択されたノードが `googlemeet.chrome` と `browser.proxy` の両方をアドバタイズしている。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome ヘルスを返す。

Parallels macOS VM などのリモート Chrome ホストの場合、Gateway または VM を更新した後の最短で安全な確認は次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際の会議タブを開く前に、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることを確認できます。

Twilio スモークには、電話ダイヤルイン詳細を公開している会議を使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

想定される Twilio 状態:

- `googlemeet setup` に、緑の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれる。
- Gateway の再読み込み後、CLI で `voicecall` が利用可能である。
- 返されたセッションに `transport: "twilio"` と `twilio.voiceCallId` がある。
- `openclaw logs --follow` で、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、最初の挨拶がキューに入ったリアルタイムブリッジが表示される。
- `googlemeet leave <sessionId>` が、委任された音声通話を切断する。

## トラブルシューティング

### エージェントに Google Meet ツールが表示されない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway を再読み込みします。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動または再読み込みします。実行中のエージェントには、現在の Gateway プロセスによって登録された Plugin ツールのみが表示されます。

macOS 以外の Gateway ホストでは、エージェント向けの `google_meet` ツールは表示されたままですが、ローカル Chrome リアルタイムアクションは音声ブリッジに到達する前にブロックされます。ローカル Chrome リアルタイム音声は現在 macOS `BlackHole 2ch` に依存しているため、Linux エージェントはデフォルトのローカル Chrome リアルタイムパスの代わりに、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS `chrome-node` ホストを使用してください。

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

ノードは接続済みで、`googlemeet.chrome` と `browser.proxy` を一覧表示している必要があります。Gateway 設定では、これらのノードコマンドを許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` に失敗するか、Gateway ログで `gateway token mismatch` が報告される場合は、現在の Gateway トークンでノードを再インストールまたは再起動します。LAN Gateway の場合、通常は次を意味します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、ノードサービスを再読み込みし、再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くがエージェントが参加できない

観察専用参加には `googlemeet test-listen` を、リアルタイム参加には `googlemeet test-speech` を実行し、返された Chrome ヘルスを確認します。どちらかのプローブが `manualActionRequired: true` を報告した場合は、`manualActionMessage` をオペレーターに表示し、ブラウザー操作が完了するまで再試行を停止します。

一般的な手動操作:

- Chrome プロファイルにサインインする。
- Meet ホストアカウントからゲストを承認する。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome のマイク/カメラ権限を付与する。
- スタックした Meet 権限ダイアログを閉じる、または修復する。

Meet に「Do you want people to
hear you in the meeting?」と表示されるだけで「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は利用可能な場合、ブラウザ自動化で **Use microphone** をクリックし、実際の会議状態を待ち続けます。作成のみのブラウザフォールバックでは、URL の作成にリアルタイム音声パスは不要なため、OpenClaw が **Continue without microphone** をクリックする場合があります。

### 会議の作成に失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、まず Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合は、固定された Chrome ノードブラウザにフォールバックします。次を確認してください。

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されている、または一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在する。
- API 作成の場合: 作成サポートが追加された後にリフレッシュトークンが発行されている。古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新してください。
- ブラウザフォールバックの場合: `defaultTransport: "chrome-node"` であり、`chromeNode.node` が `browser.proxy` と `googlemeet.chrome` を持つ接続済みノードを指している。
- ブラウザフォールバックの場合: そのノード上の OpenClaw Chrome プロファイルが Google にサインインしており、`https://meet.google.com/new` を開ける。
- ブラウザフォールバックの場合: 新しいタブを開く前に、既存の `https://meet.google.com/new` または Google アカウントプロンプトのタブを再利用する。エージェントがタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行してください。
- ブラウザフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使ってオペレーターを案内してください。そのアクションが完了するまでループで再試行しないでください。
- ブラウザフォールバックの場合: Meet に「Do you want people to hear you in the
  meeting?」と表示されたら、タブを開いたままにしてください。OpenClaw はブラウザ自動化で **Use microphone**、または作成のみのフォールバックでは **Continue without microphone** をクリックし、生成された Meet URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認してください。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

listen/talk-back には `mode: "realtime"` を使用します。`mode: "transcribe"` は、意図的に双方向のリアルタイム音声ブリッジを開始しません。観察のみのデバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が true なのに `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、オブザーバーがインストールされてから誰も話していない、Meet UI が変更された、またはその会議言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスを確認し、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で、`speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け入れた可能性がありますが、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達したことを確認できませんでした。

次も確認してください。

- `OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーが Gateway ホストで利用できる。
- `BlackHole 2ch` が Chrome ホストで見える。
- `sox` が Chrome ホストに存在する。
- Meet のマイクとスピーカーが OpenClaw で使用される仮想音声パス経由でルーティングされている。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、手動アクションの理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入力/出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザ URL を出力します。生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用してください。トークンを公開せずに Google Meet OAuth リフレッシュを検証する必要がある場合は `googlemeet doctor --oauth` を使用し、Google Meet API の証明も必要な場合は `--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いていることを確認できる場合は、別のタブを開かずにそのタブを検査します。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。選択されたトランスポートの既存の Meet タブにフォーカスして検査します。`chrome` では Gateway 経由のローカルブラウザ制御を使用し、`chrome-node` では設定済みの Chrome ノードを使用します。新しいタブを開いたり、新しいセッションを作成したりしません。ログイン、入室許可、権限、音声選択状態など、現在のブロッカーを報告します。CLI コマンドは設定済みの Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では Chrome ノードも接続されている必要があります。

### Twilio セットアップチェックに失敗する

`twilio-voice-call-plugin` は、`voice-call` が許可されていない、または有効になっていない場合に失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway を再読み込みしてください。

`twilio-voice-call-credentials` は、Twilio バックエンドにアカウント SID、認証トークン、または発信者番号がない場合に失敗します。Gateway ホストでこれらを設定してください。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` は、`voice-call` に公開 Webhook 露出がない場合、または `publicUrl` が loopback やプライベートネットワーク空間を指している場合に失敗します。`plugins.entries.voice-call.config.publicUrl` を公開プロバイダー URL に設定するか、`voice-call` のトンネル/Tailscale 露出を設定してください。

Loopback とプライベート URL は、通信事業者のコールバックには有効ではありません。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

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

ローカル開発では、プライベートホスト URL の代わりにトンネルまたは Tailscale 露出を使用してください。

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

`voicecall smoke` はデフォルトで準備状況のみを確認します。特定の番号でドライランするには:

```bash
openclaw voicecall smoke --to "+15555550123"
```

ライブの発信通知通話を意図的に開始したい場合にのみ、`--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが会議に入らない

Meet イベントが電話ダイヤルインの詳細を公開していることを確認してください。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

プロバイダーが PIN 入力前に一時停止を必要とする場合は、`--dtmf-sequence` の先頭に `w` またはカンマを使用してください。

電話通話が作成されても Meet の参加者リストにダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>` を実行し、委譲された Twilio 通話 ID、DTMF がキューに入ったかどうか、イントロ挨拶が要求されたかどうかを確認する。
- `openclaw voicecall status --call-id <id>` を実行し、通話がまだアクティブであることを確認する。
- `openclaw voicecall tail` を実行し、Twilio Webhook が Gateway に到着していることを確認する。
- `openclaw logs --follow` を実行し、Twilio Meet シーケンスを探す: Google Meet が参加を委譲し、Voice Call が電話レッグを開始し、Google Meet が `voiceCall.dtmfDelayMs` 待機し、`voicecall.dtmf` で DTMF を送信し、`voiceCall.postDtmfSpeechDelayMs` 待機してから `voicecall.speak` でイントロ音声を要求する。
- `openclaw googlemeet setup --transport twilio` を再実行する。緑のセットアップチェックは必須ですが、会議 PIN シーケンスが正しいことを証明するものではありません。
- ダイヤルイン番号が PIN と同じ Meet 招待および地域に属していることを確認する。
- Meet の応答が遅い場合、または DTMF 送信後も通話の文字起こしに PIN を求めるプロンプトが残る場合は、`voiceCall.dtmfDelayMs` を増やす。
- 参加者は入室したが挨拶が聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` リクエストと、media-stream TTS 再生または Twilio `<Say>` フォールバックを確認する。通話の文字起こしにまだ「enter the meeting PIN」が含まれている場合、電話レッグはまだ Meet ルームに参加していないため、会議参加者に音声は聞こえません。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグしてください。プロバイダーは `plugins.entries.voice-call.config.publicUrl` または設定済みトンネルに到達できる必要があります。[Voice call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注記

Google Meet の公式メディア API は受信指向であるため、Meet 通話で話すには引き続き参加者パスが必要です。この Plugin はその境界を明示したままにします。Chrome はブラウザ参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome リアルタイムモードには、`BlackHole 2ch` に加えて次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がリアルタイムモデルブリッジを所有し、それらのコマンドと選択されたリアルタイム音声プロバイダーの間で `chrome.audioFormat` の音声をパイプします。デフォルトの Chrome パスは 24 kHz PCM16 です。8 kHz G.711 mu-law はレガシーコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を所有し、そのデーモンの開始または検証後に終了する必要があります。

クリーンな双方向音声には、Meet 出力と Meet マイクを別々の仮想デバイス、または Loopback スタイルの仮想デバイスグラフ経由でルーティングしてください。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタント再生をクリアできます。これにより、共有 BlackHole loopback 入力がアシスタント再生中に一時的に抑制されている場合でも、人間の発話をアシスタント出力より優先できます。`chrome.audioInputCommand` や `chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。明示的に信頼されたコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は、Chrome セッションのアクティブなリアルタイム音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin 経由で委譲された Twilio セッションでは、`leave` は基盤となる音声通話も切断します。API 管理スペースのアクティブな Google Meet 会議も閉じたい場合は、`googlemeet end-active-conference` を使用してください。

## 関連

- [Voice call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
