---
read_when:
    - OpenClaw エージェントを Google Meet 通話に参加させたい
    - OpenClawエージェントに新しいGoogle Meet通話を作成させたい場合
    - Google Meet トランスポートとして Chrome、Chrome ノード、または Twilio を構成しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、リアルタイム音声のデフォルト設定を使用'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T05:01:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: af1f327249c45fe318410a15c598fa9aff52bd160961b6354f027cb728b7aa82
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw の Google Meet 参加者サポートは、設計上明示的な Plugin です。

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、返された URL に参加できます。
- `realtime` 音声がデフォルトモードです。
- Realtime 音声は、より深い推論やツールが必要なときに完全な OpenClaw agent へコールバックできます。
- Agents は `mode` で参加動作を選択します。ライブのリッスン/トークバックには `realtime` を使用し、realtime 音声ブリッジなしでブラウザに参加/制御するには `transcribe` を使用します。
- 認証は、個人用の Google OAuth またはすでにサインイン済みの Chrome profile から始まります。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカルまたはペアリング済みの node host で実行できます。
- Twilio はダイヤルイン番号に加えて、任意の PIN または DTMF シーケンスを受け付けます。
- CLI コマンドは `googlemeet` です。`meet` はより広範な agent 電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、バックエンドの realtime 音声プロバイダーを設定します。OpenAI がデフォルトです。Google Gemini Live も `realtime.provider: "google"` で動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想音声デバイスをインストールします。Homebrew のインストーラーでは、macOS がデバイスを公開する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin を有効にします。

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

セットアップ出力は、agent が読み取れる、モードを考慮したものです。Chrome profile、node 固定、および realtime Chrome 参加では BlackHole/SoX 音声ブリッジと遅延 realtime イントロチェックを報告します。観察専用の参加では、同じ transport を `--mode transcribe` で確認します。このモードはブリッジを通じて聞いたり話したりしないため、realtime 音声の前提条件をスキップします。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin、Twilio 認証情報、および公開 Webhook の露出が準備できているかどうかも報告します。agent に参加を依頼する前に、`ok: false` のチェックはすべて、確認対象の transport とモードのブロッカーとして扱ってください。スクリプトまたは機械可読出力には `openclaw googlemeet setup --json` を使用します。agent が試行する前に特定の transport を事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使用します。

Twilio では、デフォルト transport が Chrome の場合、必ず transport を明示的に事前確認します。

```bash
openclaw googlemeet setup --transport twilio
```

これにより、agent が会議にダイヤルしようとする前に、`voice-call` の配線不足、Twilio 認証情報の欠落、または到達できない Webhook 露出を検出できます。

会議に参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、agent に `google_meet` ツール経由で参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

新しい会議を作成して参加します。

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

参加せずに URL のみを作成します。

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つのパスがあります。

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使用されます。これは最も決定的なパスであり、ブラウザ UI 状態に依存しません。
- ブラウザフォールバック: OAuth 認証情報がない場合に使用されます。OpenClaw は固定された Chrome node を使用し、`https://meet.google.com/new` を開き、Google が実際の会議コード URL へリダイレクトするのを待ってから、その URL を返します。このパスでは、node 上の OpenClaw Chrome profile がすでに Google にサインインしている必要があります。ブラウザ自動化は Meet 独自の初回マイクプロンプトを処理します。このプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` などの無害な URL クエリ文字列を無視するため、agent の再試行は 2 つ目の Chrome タブを作成するのではなく、すでに開いている会議にフォーカスするはずです。

コマンド/ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、agents はどのパスが使用されたかを説明できます。`create` はデフォルトで新しい会議に参加し、`joined: true` と参加セッションを返します。URL のみを作成するには、CLI で `create --no-join` を使用するか、ツールに `"join": false` を渡します。

または、agent に「Google Meet を作成し、realtime 音声で参加して、リンクを送って」と伝えます。agent は `action: "create"` で `google_meet` を呼び出し、返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

観察専用/ブラウザ制御の参加では、`"mode": "transcribe"` を設定します。これは duplex realtime model bridge を開始せず、BlackHole や SoX を必要とせず、会議に話しかけません。このモードの Chrome 参加では、OpenClaw のマイク/カメラ権限付与と Meet の **Use microphone** パスも回避します。Meet が音声選択インタースティシャルを表示した場合、自動化はマイクなしのパスを試み、それ以外の場合はローカルマイクを開く代わりに手動操作を報告します。transcribe モードでは、managed Chrome transports もベストエフォートの Meet caption observer をインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、および短い `recentTranscript` の末尾を表示するため、operators はブラウザが通話に参加したか、Meet captions がテキストを生成しているかを確認できます。

realtime セッション中、`google_meet` status には、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後の入力/出力タイムスタンプ、バイトカウンター、ブリッジの closed 状態など、ブラウザと音声ブリッジの健全性が含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザ自動化は可能なときにそれを処理します。ログイン、ホスト承認、およびブラウザ/OS 権限プロンプトは、agent が中継できる reason と message 付きの手動操作として報告されます。Managed Chrome sessions は、ブラウザ健全性が `inCall: true` を報告した後にのみイントロまたはテストフレーズを出力します。それ以外の場合、status は `speechReady: false` を報告し、agent が会議で話したふりをするのではなく発話試行がブロックされます。

ローカル Chrome は、サインイン済みの OpenClaw browser profile を通じて参加します。realtime モードでは、OpenClaw が使用するマイク/スピーカーパスに `BlackHole 2ch` が必要です。クリーンな duplex 音声には、別々の仮想デバイスまたは Loopback 風のグラフを使用します。単一の BlackHole デバイスは最初の smoke test には十分ですが、エコーが発生する可能性があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM 内に完全な OpenClaw Gateway や model API key は必要ありません。Gateway と agent をローカルで実行し、VM 内で node host を実行します。VM 上で bundled Plugin を一度有効にして、node が Chrome コマンドを公開するようにします。

どこで何を実行するか:

- Gateway host: OpenClaw Gateway、agent workspace、model/API keys、realtime provider、および Google Meet Plugin config。
- Parallels macOS VM: OpenClaw CLI/node host、Google Chrome、SoX、BlackHole 2ch、および Google にサインイン済みの Chrome profile。
- VM で不要なもの: Gateway service、agent config、OpenAI/GPT key、または model provider setup。

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

VM に OpenClaw をインストールまたは更新し、そこで bundled Plugin を有効にします。

```bash
openclaw plugins enable google-meet
```

VM で node host を起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で、TLS を使用していない場合、その信頼済み private network に明示的に opt in しない限り、node は plaintext WebSocket を拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

LaunchAgent として node をインストールするときも同じ環境変数を使用します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` は process environment であり、`openclaw.json` 設定ではありません。`openclaw node install` は、install command に存在する場合、それを LaunchAgent environment に保存します。

Gateway host から node を承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が node を認識し、`googlemeet.chrome` と browser capability/`browser.proxy` の両方を公開していることを確認します。

```bash
openclaw nodes status
```

Gateway host で Meet をその node にルーティングします。

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

これで Gateway host から通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、agent に `transport: "chrome-node"` で `google_meet` ツールを使用するよう依頼します。

セッションを作成または再利用し、既知のフレーズを話し、セッション健全性を出力する 1 コマンドの smoke test には次を使用します。

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

realtime 参加中、OpenClaw browser automation は guest name を入力し、Join/Ask to join をクリックし、そのプロンプトが表示された場合は Meet の初回 "Use microphone" 選択を受け入れます。観察専用参加またはブラウザのみの会議作成中は、その選択肢が利用可能な場合、同じプロンプトをマイクなしで通過します。browser profile がサインインしていない、Meet が host admission を待っている、Chrome が realtime 参加のために microphone/camera permission を必要としている、または Meet が自動化で解決できないプロンプトで停止している場合、join/test-speech 結果は `manualActionRequired: true` を `manualActionReason` と `manualActionMessage` とともに報告します。Agents は参加の再試行を停止し、その正確な message と現在の `browserUrl`/`browserTitle` を報告し、手動のブラウザ操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` が省略されている場合、OpenClaw は、接続済み node のうち `googlemeet.chrome` と browser control の両方を公開しているものがちょうど 1 つの場合にのみ自動選択します。複数の対応 node が接続されている場合は、`chromeNode.node` を node id、display name、または remote IP に設定します。

一般的な失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway に認識されていますが利用できません。Agent はそのノードを
  使用可能な Chrome ホストではなく診断状態として扱い、ユーザーが明示的に求めた場合を除き、
  別の transport にフォールバックせずセットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM で `openclaw node run` を開始し、
  ペアリングを承認して、VM で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認します。また、
  Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` で
  両方のノードコマンドを許可していることも確認してください。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch` をインストールし、
  ローカル Chrome 音声を使う前に再起動してください。
- `BlackHole 2ch audio device not found on the node`: VM に `blackhole-2ch` を
  インストールし、VM を再起動してください。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにしてください。ゲストの自動参加は、
  ノードのブラウザープロキシを通じた OpenClaw ブラウザー自動化を使用します。ノードのブラウザー設定が
  目的のプロファイルを指していることを確認してください。たとえば
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイルです。
- Meet タブが重複する: `chrome.reuseExistingTab: true` を有効のままにしてください。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブにし、
  ブラウザーでの会議作成では、別のタブを開く前に進行中の `https://meet.google.com/new`
  または Google アカウントプロンプトのタブを再利用します。
- 音声がない: Meet で、マイク/スピーカーを OpenClaw が使用する仮想オーディオデバイスの
  パスにルーティングしてください。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールメモ

Chrome リアルタイムのデフォルトは 2 つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。Plugin は、デフォルトの 24 kHz PCM16 音声ブリッジに
  明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想オーディオドライバー。Chrome/Meet がルーティングできる
  `BlackHole 2ch` 音声デバイスを作成します。

OpenClaw はどちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、ユーザーに
Homebrew を通じてホスト依存関係としてインストールするよう案内しています。SoX のライセンスは
`LGPL-2.0-only AND GPL-2.0-only`、BlackHole は GPL-3.0 です。OpenClaw と一緒に
BlackHole をバンドルするインストーラーまたはアプライアンスを構築する場合は、BlackHole の
上流ライセンス条項を確認するか、Existential Audio から別途ライセンスを取得してください。

## Transports

### Chrome

Chrome transport は、OpenClaw ブラウザー制御を通じて Meet URL を開き、
サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin が起動前に
`BlackHole 2ch` を確認します。設定されている場合は、Chrome を開く前に音声ブリッジの
ヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は `chrome` を使用し、
Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は `chrome-node` を使用します。ローカル Chrome では、
`browser.defaultProfile` でプロファイルを選択します。`chrome.browserProfile` は
`chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声をローカル OpenClaw 音声ブリッジ経由でルーティングします。
`BlackHole 2ch` がインストールされていない場合、参加は音声パスなしで黙って参加するのではなく、
セットアップエラーで失敗します。

### Twilio

Twilio transport は、Voice Call Plugin に委譲される厳密なダイヤルプランです。
Meet ページから電話番号を解析しません。

Chrome での参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。
Google Meet は会議の電話ダイヤルイン番号と PIN を公開している必要があります。OpenClaw は
それらを Meet ページから検出しません。

Chrome ノードではなく Gateway ホストで Voice Call Plugin を有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

Twilio 認証情報は環境または config で指定します。環境を使うと、
シークレットを `openclaw.json` の外に置けます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` を有効にした後、Gateway を再起動またはリロードします。Plugin config の変更は、
リロードされるまで、すでに実行中の Gateway プロセスには反映されません。

その後、確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委譲が接続されている場合、`googlemeet setup` には成功した
`twilio-voice-call-plugin`、`twilio-voice-call-credentials`、および
`twilio-voice-call-webhook` チェックが含まれます。

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

`googlemeet create` はブラウザー自動化にフォールバックできるため、Meet リンクの作成に OAuth は任意です。
公式 API による作成、スペース解決、または Meet Media API の事前チェックが必要な場合に OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープをリクエストし、Google アカウントを認可してから、
結果のリフレッシュトークンを Google Meet Plugin config に保存するか、
`OPENCLAW_GOOGLE_MEET_*` 環境変数を指定します。

OAuth は Chrome 参加パスを置き換えません。ブラウザー参加を使用する場合、Chrome と Chrome-node transport は
引き続き、サインイン済みの Chrome プロファイル、BlackHole/SoX、接続済みノードを通じて参加します。
OAuth は公式 Google Meet API パス専用です。会議スペースの作成、スペースの解決、
Meet Media API の事前チェックを実行します。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成するか選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テスト設定で機能します。アプリが Testing 中の間は、
     アプリを認可する各 Google アカウントをテストユーザーとして追加します。
4. OpenClaw が要求するスコープを追加します。
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
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
`meetings.conference.media.readonly` は Meet Media API の事前チェックとメディア作業用です。
Google は実際の Media API 使用に Developer Preview への登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略してください。

### リフレッシュトークンを発行する

`oauth.clientId` と任意で `oauth.clientSecret` を設定するか、環境変数として渡してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` config ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` の localhost コールバック、および `--manual` による
手動コピー/貼り付けフローを使用します。

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

JSON 出力には以下が含まれます。

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

`oauth` オブジェクトを Google Meet Plugin config の下に保存します。

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

リフレッシュトークンを config に入れたくない場合は、環境変数を優先してください。
config と環境値の両方が存在する場合、Plugin はまず config を解決し、その後に環境フォールバックを使います。

OAuth 同意には、Meet スペースの作成、Meet スペースの読み取りアクセス、Meet 会議メディアの読み取りアクセスが含まれます。
会議作成サポートが存在する前に認証していた場合は、リフレッシュトークンに
`meetings.space.created` スコープが含まれるように `openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を確認する

高速でシークレットを含まないヘルスチェックが必要な場合は、OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムをロードせず、接続済み Chrome ノードも必要としません。
OAuth config が存在すること、およびリフレッシュトークンがアクセストークンを発行できることを確認します。
JSON レポートには `ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージなどのステータスフィールドのみが含まれます。
アクセストークン、リフレッシュトークン、クライアントシークレットは出力しません。

一般的な結果:

| チェック             | 意味                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済みアクセストークンが存在します。       |
| `oauth-token`        | キャッシュ済みアクセストークンがまだ有効か、リフレッシュトークンが新しいアクセストークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                             |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                               |

Google Meet API の有効化と `spaces.create` スコープも証明するには、
副作用のある作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効であり、
認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存の会議スペースへの読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済み Google アカウントがアクセスできる
既存スペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合は通常、
Google Meet REST API が無効、同意済みリフレッシュトークンに必要なスコープがない、
または Google アカウントがその Meet スペースにアクセスできないことを意味します。
リフレッシュトークンエラーの場合は、`openclaw googlemeet auth login --json` を再実行して
新しい `oauth` ブロックを保存してください。

ブラウザーフォールバックには OAuth 認証情報は不要です。このモードでは、Google 認証は
OpenClaw config ではなく、選択されたノード上のサインイン済み Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け入れられます:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または `spaces/{id}` を `spaces.get` で解決します:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア処理の前にプリフライトを実行します:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後に、会議アーティファクトと出席状況を一覧表示します:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。その会議で保持されているすべてのレコードが必要な場合は、`--all-conference-records` を渡します。

Calendar ルックアップでは、Meet アーティファクトを読み取る前に Google Calendar から会議 URL を解決できます:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Google Meet リンクを含む Calendar イベントを今日の `primary` カレンダーで検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、非プライマリカレンダーには `--calendar <id>` を使用します。Calendar ルックアップには、Calendar events readonly スコープを含む新しい OAuth ログインが必要です。`calendar-events` は一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントを示します。

会議レコード ID がすでに分かっている場合は、直接指定します:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` は、Google がその会議について公開している場合、会議レコードメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートのリソースメタデータを返します。大規模な会議でエントリのルックアップをスキップするには、`--no-transcript-entries` を使用します。`attendance` は参加者を participant-session 行に展開し、初回/最終表示時刻、合計セッション時間、遅刻/早退フラグ、サインイン済みユーザーまたは表示名で統合された重複参加者リソースを含めます。未加工の参加者リソースを個別に保持するには `--no-merge-duplicates`、遅刻検出を調整するには `--late-after-minutes`、早退検出を調整するには `--early-before-minutes` を渡します。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。`manifest.json` には、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、部分的な取得警告が記録されます。フォルダーの隣にポータブルアーカイブも書き出すには、`--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには、`--include-doc-bodies` を渡します。これには Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` を指定しない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。Google がスマートノート一覧、文字起こしエントリ、Drive ドキュメント本文エラーなどの部分的なアーティファクト失敗を返した場合、エクスポート全体を失敗させる代わりに、サマリーとマニフェストに警告が保持されます。`--dry-run` を使用すると、同じアーティファクト/出席データを取得し、フォルダーや ZIP を作成せずにマニフェスト JSON を出力します。これは、大規模なエクスポートを書き出す前や、エージェントが件数、選択されたレコード、警告だけを必要とする場合に便利です。

エージェントは `google_meet` ツールを通じて同じバンドルを作成することもできます:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ファイル書き込みをスキップし、エクスポートマニフェストのみを返すには、`"dryRun": true` を設定します。

保持されている実際の会議に対して、保護されたライブスモークを実行します:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` は、保護されたライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は、保持されている Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth
  クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は
  リフレッシュトークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本のアーティファクト/出席ライブスモークには、`https://www.googleapis.com/auth/meetings.space.readonly` と `https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar ルックアップには `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには `https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します:

```bash
openclaw googlemeet create
```

このコマンドは、新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は、公式の Google Meet API を使用します。OAuth 認証情報がない場合は、ピン留めされた Chrome ノードのサインイン済みブラウザプロファイルをフォールバックとして使用します。エージェントは、`google_meet` ツールで `action: "create"` を使用して、作成と参加を 1 ステップで行えます。URL の作成のみを行うには、`"join": false` を渡します。

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

ブラウザフォールバックが URL を作成する前に Google ログインまたは Meet 権限ブロッカーに当たった場合、Gateway メソッドは失敗応答を返し、`google_meet` ツールは単なる文字列ではなく構造化された詳細を返します:

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

エージェントが `manualActionRequired: true` を確認した場合、`manualActionMessage` とブラウザのノード/タブのコンテキストを報告し、オペレーターがブラウザ手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

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

Meet の作成はデフォルトで参加も行います。Chrome または Chrome-node トランスポートでブラウザ経由で参加するには、引き続きサインイン済みの Google Chrome プロファイルが必要です。プロファイルがサインアウトされている場合、OpenClaw は `manualActionRequired: true` またはブラウザフォールバックエラーを報告し、再試行する前にオペレーターへ Google ログインの完了を求めます。

Cloud プロジェクト、OAuth プリンシパル、会議参加者が Meet メディア API の Google Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定します。

## 設定

一般的な Chrome リアルタイムパスに必要なのは、Plugin の有効化、BlackHole、SoX、バックエンドのリアルタイム音声プロバイダーキーだけです。OpenAI がデフォルトです。Google Gemini Live を使用するには、`realtime.provider: "google"` を設定します:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 設定を `plugins.entries.google-meet.config` に設定します:

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
- `chromeNode.node`: `chrome-node` 用の任意のノード ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウト済みの Meet ゲスト画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザ自動化を通じた、ベストエフォートのゲスト名入力と Join Now クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに既存の Meet タブをアクティブ化します
- `chrome.waitForInCallMs: 20000`: リアルタイムのイントロがトリガーされる前に、Meet タブが通話中を報告するまで待機します
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペア音声形式。テレフォニー音声をまだ出力するレガシー/カスタムコマンドペアでのみ `"g711-ulaw-8khz"` を使用します。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` で音声を書き出す SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` で音声を読み取り、CoreAudio `BlackHole 2ch` に書き出す SoX コマンド
- `chrome.bargeInInputCommand`: アシスタント再生がアクティブな間、人間の割り込み検出用に符号付き 16 ビットリトルエンディアンのモノラル PCM を書き出す、任意のローカルマイクコマンド。これは現在、Gateway がホストする `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` で人間の割り込みとしてカウントされる RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` で人間の割り込みとしてカウントされるピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返しの人間による割り込みクリアの間の最小遅延
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: より深い回答には `openclaw_agent_consult` を使用する、短い音声応答
- `realtime.introMessage`: リアルタイムブリッジが接続したときの短い音声準備確認。無音で参加するには `""` に設定します
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw エージェント ID。デフォルトは `main`

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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話、DTMF、導入あいさつを Voice Call Plugin に委譲します。Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存済みの導入テキストを最初のリアルタイムあいさつとして使います。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランの検証と記録はできますが、Twilio 通話を発信することはできません。

## ツール

エージェントは `google_meet` ツールを使用できます:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome が Gateway ホスト上で実行されている場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノード上で実行されている場合は `transport: "chrome-node"` を使用します。どちらの場合も、リアルタイムモデルと `openclaw_agent_consult` は Gateway ホスト上で実行されるため、モデル認証情報はそこに残ります。

アクティブなセッションを一覧表示する、またはセッション ID を調べるには `action: "status"` を使用します。リアルタイムエージェントにすぐ発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合は `inCall` ヘルスを返すには `action: "test_speech"` を使用します。`test_speech` は常に `mode: "realtime"` を強制し、`mode: "transcribe"` で実行するよう求められた場合は失敗します。監視専用セッションは意図的に音声を出力できないためです。その `speechOutputVerified` 結果は、このテスト呼び出し中にリアルタイム音声出力バイト数が増加したかどうかに基づくため、古い音声を含む再利用セッションは新規の成功した発話チェックとして数えられません。セッション終了としてマークするには `action: "leave"` を使用します。

`status` には、利用可能な場合 Chrome ヘルスが含まれます:

- `inCall`: Chrome が Meet 通話内にいるように見える
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話が機能する前に、ブラウザプロファイルで手動ログイン、Meet ホストによる承認、権限付与、またはブラウザ制御の修復が必要
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome の発話が現在許可されているかどうか。`speechReady: false` は、OpenClaw が導入またはテストフレーズを音声ブリッジへ送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジ状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に受信した、またはブリッジへ最後に送信した音声
- `lastSuppressedInputAt` / `suppressedInputBytes`: アシスタント再生中に無視されたループバック入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## リアルタイムエージェント相談

Chrome リアルタイムモードは、ライブ音声ループ向けに最適化されています。リアルタイム音声プロバイダーは会議音声を聞き取り、設定された音声ブリッジを通じて発話します。リアルタイムモデルがより深い推論、最新情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

相談ツールは、最近の会議文字起こしコンテキストを使って通常の OpenClaw エージェントを背後で実行し、リアルタイム音声セッションに簡潔な発話用回答を返します。音声モデルはその回答を会議に向けて発話できます。これは Voice Call と同じ共有リアルタイム相談ツールを使用します。

デフォルトでは、相談は `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルデフォルト、ツールポリシー、メモリ、セッション履歴に相談する必要がある場合は、`realtime.agentId` を設定します。

`realtime.toolPolicy` は相談実行を制御します:

- `safe-read-only`: 相談ツールを公開し、通常エージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: 相談ツールを公開し、通常エージェントに標準のエージェントツールポリシーを使用させます。
- `none`: リアルタイム音声モデルに相談ツールを公開しません。

相談セッションキーは Meet セッションごとにスコープされるため、同じ会議中の後続の相談呼び出しは以前の相談コンテキストを再利用できます。

Chrome が通話に完全に参加した後に、発話による準備完了チェックを強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

参加して発話するフルスモークには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

無人エージェントに会議を渡す前に、この順序を使用します:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node 状態:

- `googlemeet setup` はすべて緑です。
- Chrome-node がデフォルトトランスポート、またはノードが固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` は選択されたノードが接続されていることを示します。
- 選択されたノードは `googlemeet.chrome` と `browser.proxy` の両方を通知します。
- Meet タブが通話に参加し、`test-speech` は `inCall: true` を含む Chrome ヘルスを返します。

Parallels macOS VM などのリモート Chrome ホストでは、Gateway または VM を更新した後の最短で安全なチェックは次のとおりです:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際の会議タブを開く前に、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることを確認できます。

Twilio スモークには、電話ダイヤルイン詳細を公開している会議を使用します:

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
- 返されたセッションには `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` では、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、最初のあいさつがキューに入ったリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` は委譲された音声通話を終了します。

## トラブルシューティング

### エージェントに Google Meet ツールが表示されない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway をリロードします:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集した直後の場合は、Gateway を再起動またはリロードしてください。実行中のエージェントに表示されるのは、現在の Gateway プロセスによって登録された Plugin ツールだけです。

### 接続済みの Google Meet 対応ノードがない

ノードホストで次を実行します:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで、ノードを承認してコマンドを検証します:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードは接続済みで、`googlemeet.chrome` と `browser.proxy` を一覧表示している必要があります。Gateway 設定では、それらのノードコマンドを許可する必要があります:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` に失敗する、または Gateway ログに `gateway token mismatch` が報告される場合は、現在の Gateway トークンでノードを再インストールまたは再起動してください。LAN Gateway の場合、通常は次を意味します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、ノードサービスをリロードして再実行します:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザは開くがエージェントが参加できない

`googlemeet test-speech` を実行し、返された Chrome ヘルスを確認します。`manualActionRequired: true` が報告された場合は、`manualActionMessage` をオペレーターに表示し、ブラウザ操作が完了するまで再試行を停止します。

一般的な手動操作:

- Chrome プロファイルにサインインする。
- Meet ホストアカウントからゲストを承認する。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome のマイク/カメラ権限を付与する。
- 停滞している Meet 権限ダイアログを閉じる、または修復する。

Meet に「Do you want people to hear you in the meeting?」と表示されるだけで「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は利用可能な場合、ブラウザ自動化を通じて **Use microphone** をクリックし、実際の会議状態を待ち続けます。作成専用ブラウザフォールバックでは、URL の作成にリアルタイム音声パスが不要なため、OpenClaw は **Continue without microphone** をクリックする場合があります。

### 会議の作成に失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、まず Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合、固定された Chrome ノードブラウザにフォールバックします。次を確認してください:

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されている、または一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在する。
- API 作成の場合: 更新トークンが、作成サポート追加後に発行されている。古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新してください。
- ブラウザフォールバックの場合: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を備えた接続済みノードを指している。
- ブラウザフォールバックの場合: そのノード上の OpenClaw Chrome プロファイルが Google にサインイン済みで、`https://meet.google.com/new` を開ける。
- ブラウザフォールバックの場合: 再試行では、新しいタブを開く前に既存の `https://meet.google.com/new` または Google アカウントプロンプトタブを再利用する。エージェントがタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行してください。
- ブラウザフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使ってオペレーターを案内してください。その操作が完了するまで、ループで再試行しないでください。
- ブラウザフォールバックの場合: Meet に「Do you want people to hear you in the meeting?」と表示されたら、タブを開いたままにしてください。OpenClaw は、ブラウザ自動化を通じて **Use microphone**、または作成専用フォールバックでは **Continue without microphone** をクリックし、生成された Meet URL を待ち続けるはずです。できない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認します:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` は、リッスン/トークバックに使用します。`mode: "transcribe"` は意図的に
双方向リアルタイム音声ブリッジを開始しません。観察のみのデバッグでは、
参加者が発話した後に `openclaw googlemeet status --json <session-id>` を実行し、
`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が
true なのに `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、
オブザーバーのインストール後に誰も発話していない、Meet UI が変更された、または
会議の言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイム経路を確認し、その実行で
ブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で
`speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け付けたものの、
OpenClaw は新しい出力バイトが Chrome オーディオブリッジに到達するのを確認できなかった可能性があります。

次も確認してください。

- Gateway ホストで、`OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーを利用できる。
- `BlackHole 2ch` が Chrome ホストで表示されている。
- `sox` が Chrome ホストに存在する。
- Meet のマイクとスピーカーが OpenClaw で使用する仮想オーディオ経路を通るようにルーティングされている。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、
手動アクション理由、リアルタイムプロバイダー接続、`realtimeReady`、オーディオ
入力/出力アクティビティ、最後のオーディオタイムスタンプ、バイトカウンター、ブラウザー URL を出力します。
生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用します。
トークンを公開せずに Google Meet OAuth 更新を検証する必要がある場合は
`googlemeet doctor --oauth` を使用します。Google Meet API の証明も必要な場合は
`--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いていることを確認できる場合は、別のタブを開かずにそのタブを検査します。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。選択したトランスポートについて、
既存の Meet タブにフォーカスして検査します。`chrome` では Gateway 経由のローカル
ブラウザー制御を使用し、`chrome-node` では設定済みの Chrome ノードを使用します。
新しいタブを開いたり、新しいセッションを作成したりはしません。ログイン、入室許可、権限、
オーディオ選択状態など、現在のブロッカーを報告します。
CLI コマンドは設定済みの Gateway と通信するため、Gateway が実行中である必要があります。
`chrome-node` では Chrome ノードも接続されている必要があります。

### Twilio セットアップチェックが失敗する

`voice-call` が許可されていない、または有効になっていない場合、
`twilio-voice-call-plugin` は失敗します。`plugins.allow` に追加し、
`plugins.entries.voice-call` を有効にして、Gateway を再読み込みしてください。

Twilio バックエンドにアカウント SID、認証トークン、または発信者番号がない場合、
`twilio-voice-call-credentials` は失敗します。Gateway ホストでこれらを設定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` に公開 Webhook 露出がない場合、または `publicUrl` がループバックや
プライベートネットワーク空間を指している場合、`twilio-voice-call-webhook` は失敗します。
`plugins.entries.voice-call.config.publicUrl` を公開プロバイダー URL に設定するか、
`voice-call` のトンネル/Tailscale 露出を設定します。

ループバック URL とプライベート URL は、通信事業者のコールバックには有効ではありません。
`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

安定した公開 URL の例:

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

ローカル開発では、プライベートホスト URL の代わりにトンネルまたは Tailscale 露出を使用します。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // または
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

その後、Gateway を再起動または再読み込みして次を実行します。

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトで準備状況のみを確認します。特定の番号でドライランするには:

```bash
openclaw voicecall smoke --to "+15555550123"
```

ライブのアウトバウンド通知通話を意図的に発信したい場合にのみ `--yes` を追加します。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが会議に参加しない

Meet イベントで電話ダイヤルインの詳細が公開されていることを確認します。正確なダイヤルイン
番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

プロバイダーが PIN 入力前の一時停止を必要とする場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

電話通話は作成されたものの、Meet の参加者一覧にダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>` を実行して、委任された Twilio
  通話 ID、DTMF がキューに入ったかどうか、イントロあいさつが要求されたかどうかを確認します。
- `openclaw voicecall status --call-id <id>` を実行し、通話がまだアクティブであることを確認します。
- `openclaw voicecall tail` を実行し、Twilio Webhook が Gateway に到着していることを確認します。
- `openclaw logs --follow` を実行し、Twilio Meet シーケンスを確認します。Google
  Meet が参加を委任し、Voice Call が接続前 DTMF TwiML を保存し、
  その初期 TwiML を配信し、その後リアルタイム TwiML を配信して、
  `initialGreeting=queued` でリアルタイムブリッジを開始します。
- `openclaw googlemeet setup --transport twilio` を再実行します。セットアップチェックが緑であることは
  必須ですが、会議 PIN シーケンスが正しいことの証明にはなりません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合は、`--dtmf-sequence` の先頭の一時停止を増やします。
  例: `wwww123456#`。
- 参加者は参加しているがあいさつが聞こえない場合は、
  `openclaw logs --follow` でリアルタイム TwiML、リアルタイムブリッジ起動、
  `initialGreeting=queued` を確認します。あいさつは、リアルタイムブリッジ接続後の初期
  `voicecall.start` メッセージから生成されます。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグしてください。プロバイダーが
`plugins.entries.voice-call.config.publicUrl` または設定済みトンネルに到達できる必要があります。
[Voice call トラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注記

Google Meet の公式メディア API は受信指向であるため、Meet 通話に話しかけるには
引き続き参加者経路が必要です。この Plugin はその境界を明確に保ちます。
Chrome はブラウザー参加とローカルオーディオルーティングを処理し、Twilio は
電話ダイヤルイン参加を処理します。

Chrome リアルタイムモードには、`BlackHole 2ch` と次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw が
  リアルタイムモデルブリッジを所有し、これらのコマンドと選択されたリアルタイム音声プロバイダーの間で
  `chrome.audioFormat` のオーディオをパイプします。デフォルトの Chrome 経路は
  24 kHz PCM16 です。8 kHz G.711 mu-law は従来のコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカルオーディオ経路全体を所有し、
  デーモンの開始または検証後に終了する必要があります。

クリーンな双方向オーディオのために、Meet 出力と Meet マイクを別々の仮想デバイス、または
Loopback スタイルの仮想デバイスグラフにルーティングしてください。単一の共有
BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、
人間が話し始めたときにアシスタント再生をクリアできます。これにより、共有 BlackHole
ループバック入力がアシスタント再生中に一時的に抑制されている場合でも、人間の発話を
アシスタント出力より優先できます。`chrome.audioInputCommand` や
`chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。
明示的に信頼されたコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は Chrome セッションのアクティブなリアルタイムオーディオブリッジをトリガーします。
`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin 経由で委任された
Twilio セッションでは、`leave` は基になる音声通話も切断します。

## 関連

- [Voice call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
