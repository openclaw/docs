---
read_when:
    - OpenClawエージェントをGoogle Meet通話に参加させたい場合
    - Google MeetのトランスポートとしてChrome、Chrome Node、またはTwilioを設定している場合
summary: 'Google Meet Plugin: ChromeまたはTwilio経由で明示的なMeet URLに参加し、realtime voiceデフォルトを使用する'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T05:10:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89587eeab8440b2ded2c352cc73209753fc4697d9fdf44cfe39de9d1d76b3f
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（Plugin）

OpenClaw向けのGoogle Meet参加者サポートです。

このPluginは意図的に明示的な設計になっています。

- 明示的な`https://meet.google.com/...` URLにのみ参加します。
- デフォルトモードは`realtime` voiceです。
- realtime voiceは、より深い推論やツールが必要な場合に、完全なOpenClawエージェントへコールバックできます。
- 認証は、個人Google OAuthまたはすでにサインイン済みのChromeプロファイルから始まります。
- 自動的な同意アナウンスはありません。
- デフォルトのChrome音声バックエンドは`BlackHole 2ch`です。
- Chromeはローカルでも、ペアリング済みNodeホスト上でも実行できます。
- Twilioはダイヤルイン番号と、任意のPINまたはDTMFシーケンスを受け付けます。
- CLIコマンドは`googlemeet`です。`meet`は、より広いエージェント
  テレカンファレンスワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、realtimeプロバイダーがOpenAIを使えることを確認します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch`は`BlackHole 2ch`仮想音声デバイスをインストールします。Homebrewの
インストーラーでは、macOSがそのデバイスを認識する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Pluginを有効化します。

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

ミーティングに参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに`google_meet`ツール経由で参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chromeは、サインイン済みのChromeプロファイルとして参加します。Meet内で、
OpenClawが使用するマイク/スピーカーパスとして`BlackHole 2ch`を選択してください。クリーンな全二重音声には、
別々の仮想デバイスまたはLoopback風のグラフを使ってください。単一のBlackHoleデバイスでも
最初のスモークテストには十分ですが、エコーが発生することがあります。

### ローカルGateway + Parallels Chrome

macOS VM内でChromeを実行させるだけなら、VM内に完全なOpenClaw GatewayやモデルAPI keyは**不要**です。
Gatewayとエージェントはローカルで実行し、VM内ではnode hostを実行してください。
バンドルPluginをVM上で一度有効化すれば、そのnodeがChromeコマンドを広告します。

どこで何が動くか:

- Gatewayホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API keys、realtime
  provider、およびGoogle Meet Plugin設定。
- Parallels macOS VM: OpenClaw CLI/node host、Google Chrome、SoX、BlackHole 2ch、
  およびGoogleにサインイン済みのChromeプロファイル。
- VM内で不要なもの: Gatewayサービス、エージェント設定、OpenAI/GPT key、またはモデル
  プロバイダー設定。

VM依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHoleをインストールした後、macOSが`BlackHole 2ch`を認識するようにVMを再起動します。

```bash
sudo reboot
```

再起動後、VMが音声デバイスとSoXコマンドを認識できることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM内でOpenClawをインストールまたは更新し、その後そこでバンドルPluginを有効化します。

```bash
openclaw plugins enable google-meet
```

VM内でnode hostを起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

GatewayホストからそのNodeを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

GatewayがそのNodeを認識し、`googlemeet.chrome`を広告していることを確認します。

```bash
openclaw nodes status
```

Gatewayホスト上でMeetをそのNode経由にルーティングします。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

これで、Gatewayホストから通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに`transport: "chrome-node"`付きで`google_meet`ツールを使わせてください。

`chromeNode.node`を省略した場合、接続済みNodeがちょうど1つだけ
`googlemeet.chrome`を広告しているときにのみ、OpenClawは自動選択します。複数の対応Nodeが
接続されている場合は、`chromeNode.node`にNode id、表示名、またはリモートIPを設定してください。

よくある失敗チェック:

- `No connected Google Meet-capable node`: VM内で`openclaw node run`を起動し、
  ペアリングを承認し、VM内で`openclaw plugins enable google-meet`が実行済みか確認してください。
- `BlackHole 2ch audio device not found on the node`: VM内に`blackhole-2ch`
  をインストールし、VMを再起動してください。
- Chromeは開くが参加できない: VM内でChromeへサインインし、その
  プロファイルがMeet URLへ手動参加できることを確認してください。
- 音が出ない: Meet内で、OpenClawが使用する仮想音声デバイスパスへ
  マイク/スピーカーをルーティングしてください。クリーンな全二重音声には、別々の仮想デバイスまたはLoopback風ルーティングを使ってください。

## インストールに関する注意

Chrome realtimeデフォルトは、2つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。このPluginは、デフォルトの8 kHz G.711 mu-law音声ブリッジに
  `rec`および`play`コマンドを使用します。
- `blackhole-2ch`: macOS仮想音声ドライバー。Chrome/Meetがルーティングできる
  `BlackHole 2ch`音声デバイスを作成します。

OpenClawは、どちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、ユーザーに
Homebrew経由でホスト依存関係としてインストールするよう案内しています。SoXのライセンスは
`LGPL-2.0-only AND GPL-2.0-only`、BlackHoleはGPL-3.0です。BlackHoleを
OpenClawと一緒にバンドルしたインストーラーまたはアプライアンスを構築する場合は、BlackHoleの
upstreamライセンス条件を確認するか、Existential Audioから別途ライセンスを取得してください。

## トランスポート

### Chrome

Chromeトランスポートは、Meet URLをGoogle Chromeで開き、サインイン済み
Chromeプロファイルとして参加します。macOSでは、Pluginは起動前に`BlackHole 2ch`を確認します。
設定されていれば、Chromeを開く前に音声ブリッジのヘルスコマンドと起動コマンドも実行します。Chrome/音声がGatewayホスト上にある場合は`chrome`を使用してください。
Chrome/音声がParallels
macOS VMのようなペアリング済みNode上にある場合は`chrome-node`を使用してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chromeのマイクおよびスピーカー音声を、ローカルのOpenClaw音声
ブリッジ経由にルーティングしてください。`BlackHole 2ch`がインストールされていない場合、
音声パスなしで静かに参加するのではなく、joinはセットアップエラーで失敗します。

### Twilio

Twilioトランスポートは、Voice Call Pluginへ委譲されるstrictなダイヤルプランです。
Meetページから電話番号を解析することはありません。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ミーティングにカスタムシーケンスが必要な場合は`--dtmf-sequence`を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuthとpreflight

Google Meet Media APIアクセスでは、まず個人OAuth clientを使用します。
`oauth.clientId`と任意の`oauth.clientSecret`を設定し、その後次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、refresh tokenを含む`oauth`設定ブロックを表示します。これはPKCE、
`http://localhost:8085/oauth2callback`でのlocalhost callback、および
`--manual`による手動コピーペーストフローを使用します。

次の環境変数がフォールバックとして受け付けられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID`または`GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`または`GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN`または`GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`または`GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING`または`GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK`または`GOOGLE_MEET_PREVIEW_ACK`

`spaces.get`を通じてMeet URL、コード、または`spaces/{id}`を解決します。

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア作業の前にpreflightを実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Cloud
project、OAuth principal、および会議参加者がMeet media APIs用のGoogle
Workspace Developer Preview Programに登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true`を設定してください。

## 設定

一般的なChrome realtimeパスでは、Pluginの有効化、BlackHole、SoX、
およびOpenAI keyだけが必要です。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Plugin設定は`plugins.entries.google-meet.config`の下に置きます。

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
- `chromeNode.node`: `chrome-node`用の任意のnode id/name/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: stdoutへ8 kHz G.711 mu-law
  音声を書き出すSoX `rec`コマンド
- `chrome.audioOutputCommand`: stdinから8 kHz G.711 mu-law
  音声を読み込むSoX `play`コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 簡潔な音声応答。より深い回答には
  `openclaw_agent_consult`を使用

任意の上書き:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
  },
}
```

Twilio専用設定:

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

## ツール

エージェントは`google_meet`ツールを使用できます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ChromeがGatewayホスト上で動作する場合は`transport: "chrome"`を使用してください。
ChromeがParallels
VMのようなペアリング済みNode上で動作する場合は`transport: "chrome-node"`を使用してください。どちらの場合でも、realtimeモデルと`openclaw_agent_consult`は
Gatewayホスト上で実行されるため、モデル資格情報はそこに留まります。

有効なセッション一覧やセッションIDの確認には`action: "status"`を使用してください。
セッション終了済みとしてマークするには`action: "leave"`を使用してください。

## Realtime agent consult

Chrome realtimeモードは、ライブ音声ループ向けに最適化されています。realtime voice
providerは会議音声を聞き取り、設定済み音声ブリッジ経由で話します。
realtimeモデルが、より深い推論、現在情報、または通常の
OpenClawツールを必要とする場合、`openclaw_agent_consult`を呼び出せます。

consultツールは、最近の会議transcriptコンテキスト付きで、通常のOpenClawエージェントを
背後で実行し、その結果を簡潔な音声回答としてrealtime
voiceセッションへ返します。その後voiceモデルは、その回答を会議へ向けて話すことができます。

`realtime.toolPolicy`はconsult実行を制御します。

- `safe-read-only`: consultツールを公開し、通常エージェントを
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、および
  `memory_get`に限定する。
- `owner`: consultツールを公開し、通常エージェントに通常の
  エージェントツールポリシーを使わせる。
- `none`: consultツールをrealtime voiceモデルへ公開しない。

consult session keyはMeetセッションごとにスコープされるため、同じ会議中の後続consult呼び出しで以前のconsultコンテキストを再利用できます。

## 注意

Google Meetの公式media APIは受信指向であるため、Meet
通話内で話すには、引き続き参加者パスが必要です。このPluginはその境界を明示的に保ちます:
Chromeはブラウザー参加とローカル音声ルーティングを担当し、Twilioは
電話ダイヤルイン参加を担当します。

Chrome realtimeモードには次のいずれかが必要です。

- `chrome.audioInputCommand`と`chrome.audioOutputCommand`: OpenClawが
  realtimeモデルブリッジを管理し、それらの
  コマンドと選択されたrealtime voice providerの間で8 kHz G.711 mu-law音声をパイプする。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を管理し、
  そのデーモンを起動または検証した後に終了しなければならない。

クリーンな全二重音声のためには、Meet出力とMeetマイクを別々の
仮想デバイス、またはLoopback風の仮想デバイスグラフ経由でルーティングしてください。単一の共有
BlackHoleデバイスでは、他の参加者の音声が通話へエコーして戻ることがあります。

`googlemeet leave`は、Chromeセッション用のコマンドペアrealtime音声ブリッジを停止します。Voice Call Plugin経由で委譲されたTwilioセッションでは、基盤となる音声通話も切断します。

## 関連

- [Voice call plugin](/ja-JP/plugins/voice-call)
- [Talk mode](/ja-JP/nodes/talk)
- [Building plugins](/ja-JP/plugins/building-plugins)
