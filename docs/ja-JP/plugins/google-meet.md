---
read_when:
    - OpenClawエージェントをGoogle Meet通話に参加させたい場合
    - Google MeetのトランスポートとしてChrome、Chrome Node、またはTwilioを設定しています
summary: 'Google Meet Plugin: 明示的なMeet URLに、ChromeまたはTwilio経由でリアルタイム音声のデフォルト設定を使用して参加する'
title: Google Meetプラグイン
x-i18n:
    generated_at: "2026-04-24T09:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（Plugin）

OpenClaw向けのGoogle Meet参加者サポートです。

このPluginは意図的に明示的な設計になっています。

- 明示的な`https://meet.google.com/...` URLにのみ参加します。
- デフォルトモードは`realtime`音声です。
- より深い推論やツールが必要な場合、リアルタイム音声から完全なOpenClawエージェントにコールバックできます。
- 認証は個人のGoogle OAuth、またはすでにサインイン済みのChromeプロファイルから開始します。
- 自動の同意告知はありません。
- デフォルトのChrome音声バックエンドは`BlackHole 2ch`です。
- Chromeはローカルでも、ペアリングされたNodeホスト上でも実行できます。
- Twilioはダイヤルイン番号に加えて、任意のPINまたはDTMFシーケンスを受け付けます。
- CLIコマンドは`googlemeet`です。`meet`はより広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカルの音声依存関係をインストールし、バックエンドのリアルタイム音声プロバイダーを設定します。デフォルトはOpenAIです。Google Gemini Liveも`realtime.provider: "google"`で動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`は`BlackHole 2ch`仮想音声デバイスをインストールします。Homebrewのインストーラーでは、macOSがこのデバイスを認識する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

会議に参加します。

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

Chromeはサインイン済みのChromeプロファイルとして参加します。Meetでは、OpenClawが使用するマイク/スピーカー経路として`BlackHole 2ch`を選択してください。クリーンな双方向音声のためには、別々の仮想デバイスまたはLoopbackスタイルのグラフを使用してください。最初のスモークテストには単一のBlackHoleデバイスでも十分ですが、エコーが発生する可能性があります。

### ローカルGateway + Parallels Chrome

macOS VMにChromeを所有させるだけであれば、VM内に完全なOpenClaw GatewayやモデルAPIキーは**不要**です。Gatewayとエージェントはローカルで実行し、VM内ではNodeホストを実行します。NodeがChromeコマンドを通知できるよう、VMでバンドルされたPluginを一度有効にしてください。

どこで何を実行するか:

- Gatewayホスト: OpenClaw Gateway、エージェントワークスペース、モデル/APIキー、リアルタイムプロバイダー、Google Meet Plugin設定
- Parallels macOS VM: OpenClaw CLI/Nodeホスト、Google Chrome、SoX、BlackHole 2ch、Googleにサインイン済みのChromeプロファイル
- VMで不要なもの: Gatewayサービス、エージェント設定、OpenAI/GPTキー、またはモデルプロバイダー設定

VMの依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHoleのインストール後、macOSが`BlackHole 2ch`を認識するようにVMを再起動します。

```bash
sudo reboot
```

再起動後、VMが音声デバイスとSoXコマンドを認識できることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM内でOpenClawをインストールまたは更新し、その後そこでバンドルされたPluginを有効にします。

```bash
openclaw plugins enable google-meet
```

VM内でNodeホストを起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`がLAN IPで、TLSを使用していない場合、その信頼されたプライベートネットワーク向けにオプトインしない限り、Nodeは平文WebSocketを拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

NodeをLaunchAgentとしてインストールする場合も、同じ環境変数を使用します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`はプロセス環境であり、`openclaw.json`の設定ではありません。`openclaw node install`は、インストールコマンド実行時にこの環境変数が存在していれば、それをLaunchAgent環境に保存します。

GatewayホストからNodeを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

GatewayがNodeを認識し、`googlemeet.chrome`を通知していることを確認します。

```bash
openclaw nodes status
```

Gatewayホスト上で、そのNode経由でMeetをルーティングします。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
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

または、`transport: "chrome-node"`を指定してエージェントに`google_meet`ツールを使わせてください。

`chromeNode.node`が省略されている場合、OpenClawが自動選択するのは、接続されたNodeのうち`googlemeet.chrome`を通知しているものがちょうど1つだけのときです。対応可能なNodeが複数接続されている場合は、`chromeNode.node`にNode ID、表示名、またはリモートIPを設定してください。

一般的な障害確認:

- `No connected Google Meet-capable node`: VMで`openclaw node run`を開始し、ペアリングを承認し、VM内で`openclaw plugins enable google-meet`を実行したことを確認してください。また、Gatewayホストが`gateway.nodes.allowCommands: ["googlemeet.chrome"]`でそのNodeコマンドを許可していることも確認してください。
- `BlackHole 2ch audio device not found on the node`: VMに`blackhole-2ch`をインストールし、VMを再起動してください。
- Chromeは開くが参加できない: VM内でChromeにサインインし、そのプロファイルでMeet URLに手動参加できることを確認してください。
- 音が出ない: Meetで、マイク/スピーカーをOpenClawが使用する仮想音声デバイス経路にルーティングしてください。クリーンな双方向音声のために、別々の仮想デバイスまたはLoopbackスタイルのルーティングを使用してください。

## インストールに関する注意

Chromeのリアルタイムデフォルトでは、2つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。Pluginは、デフォルトの8 kHz G.711 mu-law音声ブリッジのために`rec`および`play`コマンドを使用します。
- `blackhole-2ch`: macOS仮想音声ドライバー。Chrome/Meetがルーティングできる`BlackHole 2ch`音声デバイスを作成します。

OpenClawは、これらのパッケージを同梱も再配布もしません。ドキュメントでは、ユーザーに対してHomebrew経由でホスト依存関係としてインストールするよう案内しています。SoXのライセンスは`LGPL-2.0-only AND GPL-2.0-only`で、BlackHoleはGPL-3.0です。OpenClawとともにBlackHoleを含むインストーラーまたはアプライアンスを構築する場合は、BlackHole上流のライセンス条件を確認するか、Existential Audioから別ライセンスを取得してください。

## トランスポート

### Chrome

Chromeトランスポートは、Google ChromeでMeet URLを開き、サインイン済みのChromeプロファイルとして参加します。macOSでは、Pluginは起動前に`BlackHole 2ch`の存在を確認します。設定されていれば、Chromeを開く前に音声ブリッジのヘルスコマンドと起動コマンドも実行します。Chrome/音声がGatewayホスト上にある場合は`chrome`を使用し、Chrome/音声がParallels macOS VMのようなペアリング済みNode上にある場合は`chrome-node`を使用してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chromeのマイクおよびスピーカー音声を、ローカルのOpenClaw音声ブリッジ経由でルーティングします。`BlackHole 2ch`がインストールされていない場合、音声経路なしで黙って参加するのではなく、セットアップエラーで参加に失敗します。

### Twilio

Twilioトランスポートは、Voice Call Pluginに委譲される厳格なダイヤルプランです。Meetページから電話番号を解析しません。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

会議にカスタムシーケンスが必要な場合は`--dtmf-sequence`を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuthと事前確認

Google Meet Media APIアクセスでは、まず個人用OAuthクライアントを使用します。`oauth.clientId`を設定し、必要に応じて`oauth.clientSecret`も設定してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む`oauth`設定ブロックを出力します。PKCE、`http://localhost:8085/oauth2callback`でのlocalhostコールバック、そして`--manual`による手動コピー&ペーストフローを使用します。

以下の環境変数をフォールバックとして使用できます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID`または`GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`または`GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN`または`GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`または`GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`または`GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING`または`GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK`または`GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または`spaces/{id}`を`spaces.get`経由で解決します。

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア処理の前に事前確認を実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Cloudプロジェクト、OAuth principal、および会議参加者がMeet media APIs向けGoogle Workspace Developer Preview Programに登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true`を設定してください。

## 設定

一般的なChromeリアルタイム経路では、Pluginの有効化、BlackHole、SoX、およびバックエンドのリアルタイム音声プロバイダーキーだけが必要です。デフォルトはOpenAIです。Google Gemini Liveを使うには`realtime.provider: "google"`を設定してください。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin設定は`plugins.entries.google-meet.config`の下に設定します。

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

デフォルト値:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node`用の任意のNode ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: 8 kHz G.711 mu-law音声をstdoutに書き出すSoXの`rec`コマンド
- `chrome.audioOutputCommand`: stdinから8 kHz G.711 mu-law音声を読み込むSoXの`play`コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: より深い回答には`openclaw_agent_consult`を使う、簡潔な音声応答
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声レディネス確認。無言で参加するには`""`に設定してください

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
    provider: "google",
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

ChromeがGatewayホスト上で動作している場合は`transport: "chrome"`を使用します。ChromeがParallels VMのようなペアリング済みNode上で動作している場合は`transport: "chrome-node"`を使用します。どちらの場合も、リアルタイムモデルと`openclaw_agent_consult`はGatewayホスト上で動作するため、モデル資格情報はそこに保持されます。

`action: "status"`を使用すると、アクティブなセッションの一覧表示や、セッションIDの確認ができます。`action: "speak"`に`sessionId`と`message`を指定すると、リアルタイムエージェントに即座に発話させることができます。`action: "leave"`を使用すると、セッションを終了済みとしてマークします。

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## リアルタイムエージェント相談

Chromeのリアルタイムモードは、ライブ音声ループ向けに最適化されています。リアルタイム音声プロバイダーは会議の音声を聞き取り、設定された音声ブリッジを通じて発話します。より深い推論、最新情報、または通常のOpenClawツールが必要になった場合、リアルタイムモデルは`openclaw_agent_consult`を呼び出せます。

consultツールは、最近の会議トランスクリプトのコンテキストを使って、通常のOpenClawエージェントをバックグラウンドで実行し、リアルタイム音声セッションに簡潔な音声回答を返します。その後、音声モデルはその回答を会議に向けて発話できます。

`realtime.toolPolicy`はconsult実行を制御します。

- `safe-read-only`: consultツールを公開し、通常のエージェントを`read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get`に制限します。
- `owner`: consultツールを公開し、通常のエージェントが通常のエージェントツールポリシーを使えるようにします。
- `none`: リアルタイム音声モデルにconsultツールを公開しません。

consultセッションキーはMeetセッションごとにスコープされるため、同じ会議中の後続のconsult呼び出しで、以前のconsultコンテキストを再利用できます。

Chromeが通話に完全に参加した後で、音声による準備完了確認を強制するには、次を実行します。

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## 注意

Google Meetの公式メディアAPIは受信指向のため、Meet通話で発話するには依然として参加者経路が必要です。このPluginはその境界を明確に保ちます。Chromeはブラウザーでの参加とローカル音声ルーティングを担当し、Twilioは電話のダイヤルイン参加を担当します。

Chromeのリアルタイムモードには、次のいずれかが必要です。

- `chrome.audioInputCommand`と`chrome.audioOutputCommand`: OpenClawがリアルタイムモデルブリッジを所有し、それらのコマンドと選択されたリアルタイム音声プロバイダーの間で8 kHz G.711 mu-law音声をパイプします。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声経路全体を所有し、そのデーモンを起動または検証した後に終了する必要があります。

クリーンな双方向音声のために、Meet出力とMeetマイクを別々の仮想デバイス、またはLoopbackスタイルの仮想デバイスグラフ経由でルーティングしてください。単一の共有BlackHoleデバイスでは、他の参加者の音声が通話にエコーバックされる場合があります。

`googlemeet speak`は、Chromeセッション用のアクティブなリアルタイム音声ブリッジをトリガーします。`googlemeet leave`はそのブリッジを停止します。Voice Call Plugin経由で委譲されたTwilioセッションでは、`leave`は基盤となる音声通話も切断します。

## 関連

- [Voice call Plugin](/ja-JP/plugins/voice-call)
- [Talk mode](/ja-JP/nodes/talk)
- [Pluginの作成](/ja-JP/plugins/building-plugins)
