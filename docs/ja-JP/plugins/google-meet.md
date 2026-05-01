---
read_when:
    - OpenClaw エージェントを Google Meet 通話に参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成させたい
    - Chrome、Chrome ノード、または Twilio を Google Meet のトランスポートとして設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、リアルタイム音声のデフォルトを使用'
title: Google Meet プラグイン
x-i18n:
    generated_at: "2026-05-01T05:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eb6e48964d9592562fad1cebeadd765f2a2bcea9bfe887153e65438bfeaa617
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw の Google Meet 参加者サポート — この Plugin は設計上明示的です:

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、返された URL に参加できます。
- `realtime` 音声がデフォルトのモードです。
- より深い推論やツールが必要な場合、リアルタイム音声は完全な OpenClaw エージェントにコールバックできます。
- エージェントは `mode` で参加動作を選択します。ライブの聞き取り/応答には `realtime` を使い、リアルタイム音声ブリッジなしでブラウザーへ参加/制御するには `transcribe` を使います。
- 認証は個人の Google OAuth、またはすでにログイン済みの Chrome プロファイルとして開始します。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカルでも、ペアリング済みのノードホスト上でも実行できます。
- Twilio はダイヤルイン番号に加えて任意の PIN または DTMF シーケンスを受け付けます。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、バックエンドのリアルタイム音声プロバイダーを設定します。OpenAI がデフォルトです。Google Gemini Live も `realtime.provider: "google"` で動作します:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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

セットアップ出力は、エージェントが読み取れる形式で、モードを認識することを意図しています。Chrome プロファイル、ノード固定、リアルタイム Chrome 参加の場合は BlackHole/SoX 音声ブリッジと遅延リアルタイムイントロのチェックを報告します。監視のみの参加では、同じトランスポートを `--mode transcribe` で確認します。このモードはブリッジを通じて聞いたり話したりしないため、リアルタイム音声の前提条件をスキップします:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin と Twilio 認証情報の準備状況も報告します。エージェントに参加を依頼する前に、`ok: false` のチェックは、チェック対象のトランスポートとモードに対するブロッカーとして扱ってください。スクリプトまたは機械可読出力には `openclaw googlemeet setup --json` を使います。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使います。

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
  "mode": "realtime"
}
```

新しい会議を作成して参加します:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

参加せずに URL だけを作成します:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つの経路があります:

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使われます。これは最も決定的な経路で、ブラウザー UI の状態に依存しません。
- ブラウザーフォールバック: OAuth 認証情報がない場合に使われます。OpenClaw は固定された Chrome ノードを使い、`https://meet.google.com/new` を開き、Google が実際の会議コード URL にリダイレクトするのを待ってから、その URL を返します。この経路では、ノード上の OpenClaw Chrome プロファイルがすでに Google にログインしている必要があります。ブラウザー自動化は Meet 独自の初回マイクプロンプトを処理します。そのプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローでは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` などの無害な URL クエリ文字列を無視するため、エージェントの再試行では 2 つ目の Chrome タブを作成するのではなく、すでに開いている会議にフォーカスするはずです。

コマンド/ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、エージェントはどの経路が使われたかを説明できます。`create` はデフォルトで新しい会議に参加し、`joined: true` と参加セッションを返します。URL だけを発行するには、CLI で `create --no-join` を使うか、ツールに `"join": false` を渡します。

または、エージェントに「Google Meet を作成し、リアルタイム音声で参加して、リンクを送って」と伝えます。エージェントは `action: "create"` で `google_meet` を呼び出し、返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

監視のみ/ブラウザー制御の参加では、`"mode": "transcribe"` を設定します。これは双方向リアルタイムモデルブリッジを開始せず、BlackHole や SoX を必要とせず、会議内で応答しません。このモードでの Chrome 参加では、OpenClaw のマイク/カメラ権限付与も避け、Meet の **マイクを使用** 経路も避けます。Meet が音声選択の中間画面を表示した場合、自動化はマイクなしの経路を試し、それ以外の場合はローカルマイクを開くのではなく手動操作を報告します。

リアルタイムセッション中、`google_meet` のステータスには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最終入出力タイムスタンプ、バイトカウンター、ブリッジのクローズ状態など、ブラウザーと音声ブリッジのヘルスが含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザー自動化は可能なときにそれを処理します。ログイン、ホスト承認、ブラウザー/OS 権限プロンプトは、エージェントが中継するための理由とメッセージ付きで手動操作として報告されます。管理対象の Chrome セッションは、ブラウザーのヘルスが `inCall: true` を報告した後にのみイントロまたはテストフレーズを発します。そうでない場合、ステータスは `speechReady: false` を報告し、エージェントが会議で話したふりをするのではなく、発話の試行はブロックされます。

ローカル Chrome は、ログイン済みの OpenClaw ブラウザープロファイルを通じて参加します。リアルタイムモードには、OpenClaw が使うマイク/スピーカー経路として `BlackHole 2ch` が必要です。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback スタイルのグラフを使います。単一の BlackHole デバイスでも最初のスモークテストには十分ですが、エコーする可能性があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM 内に完全な OpenClaw Gateway やモデル API キーは必要ありません。Gateway とエージェントはローカルで実行し、VM 内でノードホストを実行します。ノードが Chrome コマンドを公開するよう、VM 上で同梱 Plugin を一度有効にします:

どこで何を実行するか:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API キー、リアルタイムプロバイダー、Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/ノードホスト、Google Chrome、SoX、BlackHole 2ch、Google にログイン済みの Chrome プロファイル。
- VM 内で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、モデルプロバイダー設定。

VM の依存関係をインストールします:

```bash
brew install blackhole-2ch sox
```

BlackHole のインストール後、macOS が `BlackHole 2ch` を公開するよう VM を再起動します:

```bash
sudo reboot
```

再起動後、VM が音声デバイスと SoX コマンドを認識できることを確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM に OpenClaw をインストールまたは更新し、その後、同梱 Plugin をそこで有効にします:

```bash
openclaw plugins enable google-meet
```

VM でノードホストを開始します:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で、TLS を使っていない場合、その信頼済みプライベートネットワークに明示的に同意しない限り、ノードは平文 WebSocket を拒否します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ノードを LaunchAgent としてインストールする場合も、同じ環境変数を使います:

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

Gateway がノードを認識し、そのノードが `googlemeet.chrome` とブラウザー機能/`browser.proxy` の両方を公開していることを確認します:

```bash
openclaw nodes status
```

Gateway ホストで Meet をそのノード経由にルーティングします:

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

または、エージェントに `transport: "chrome-node"` で `google_meet` ツールを使うよう依頼します。

セッションを作成または再利用し、既知のフレーズを話し、セッションヘルスを出力する 1 コマンドのスモークテスト:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、OpenClaw のブラウザー自動化はゲスト名を入力し、参加/参加をリクエストをクリックし、Meet の初回「マイクを使用」選択肢が表示された場合はそれを受け入れます。監視のみの参加またはブラウザーのみの会議作成中は、利用可能であれば、同じプロンプトをマイクなしで進みます。ブラウザープロファイルがログインしていない、Meet がホスト承認を待っている、Chrome がリアルタイム参加のためにマイク/カメラ権限を必要としている、または Meet が自動化で解決できないプロンプトで止まっている場合、参加/test-speech 結果は `manualActionRequired: true` を `manualActionReason` と `manualActionMessage` 付きで報告します。エージェントは参加の再試行を停止し、その正確なメッセージと現在の `browserUrl`/`browserTitle` を報告し、手動のブラウザー操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` を省略した場合、OpenClaw は、接続済みノードのうち `googlemeet.chrome` とブラウザー制御の両方を公開しているものが 1 つだけのときに限り、自動選択します。対応可能なノードが複数接続されている場合は、`chromeNode.node` にノード ID、表示名、またはリモート IP を設定します。

一般的な失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway に認識されていますが利用できません。エージェントはそのノードを
  利用可能な Chrome ホストではなく診断状態として扱い、ユーザーがそれを求めた場合を除き、
  別のトランスポートへフォールバックするのではなくセットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM で `openclaw node run` を開始し、
  ペアリングを承認して、VM で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認します。さらに、
  Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  で両方のノードコマンドを許可していることも確認します。
- `BlackHole 2ch audio device not found`: 確認対象のホストに `blackhole-2ch` をインストールし、
  ローカル Chrome 音声を使う前に再起動します。
- `BlackHole 2ch audio device not found on the node`: VM に `blackhole-2ch` をインストールし、
  VM を再起動します。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルでログインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにします。ゲストの自動参加は、
  ノードブラウザープロキシ経由で OpenClaw のブラウザー自動操作を使用します。ノードブラウザー設定が目的のプロファイルを指していることを確認してください。たとえば
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイルです。
- Meet タブが重複する: `chrome.reuseExistingTab: true` を有効にしたままにします。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブ化し、
  ブラウザーでの会議作成では、別のタブを開く前に進行中の `https://meet.google.com/new`
  または Google アカウントのプロンプトタブを再利用します。
- 音声がない: Meet で、マイクとスピーカーの音声を OpenClaw が使用する仮想音声デバイス
  パスにルーティングします。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールメモ

Chrome リアルタイムのデフォルトでは、2 つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。Plugin は、デフォルトの 24 kHz PCM16 音声ブリッジに明示的な CoreAudio
  デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想音声ドライバー。Chrome/Meet がルーティングできる `BlackHole 2ch`
  音声デバイスを作成します。

OpenClaw はどちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、
ユーザーに Homebrew 経由でホスト依存関係としてインストールするよう案内しています。SoX は
`LGPL-2.0-only AND GPL-2.0-only` としてライセンスされ、BlackHole は GPL-3.0 です。BlackHole を OpenClaw と一緒にバンドルする
インストーラーまたはアプライアンスを構築する場合は、BlackHole の
アップストリームライセンス条件を確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは、OpenClaw ブラウザー制御を通じて Meet URL を開き、
ログイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin が起動前に
`BlackHole 2ch` を確認します。設定されている場合は、Chrome を開く前に音声ブリッジ
ヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は `chrome` を使い、
Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は `chrome-node` を使います。ローカル Chrome では、
`browser.defaultProfile` でプロファイルを選択します。`chrome.browserProfile` は
`chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声をローカル OpenClaw 音声ブリッジにルーティングします。
`BlackHole 2ch` がインストールされていない場合、音声パスなしで黙って参加するのではなく、
セットアップエラーで参加に失敗します。

### Twilio

Twilio トランスポートは、Voice Call Plugin に委譲される厳密なダイヤルプランです。
電話番号を探すために Meet ページを解析することはありません。

Chrome 参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。
Google Meet は会議用の電話ダイヤルイン番号と PIN を公開している必要があります。
OpenClaw は Meet ページからそれらを検出しません。

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

Twilio 認証情報は環境変数または config で指定します。環境変数を使うと
シークレットを `openclaw.json` の外に保てます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` を有効にした後、Gateway を再起動または再読み込みします。Plugin config の変更は、
再読み込みされるまで、すでに実行中の Gateway プロセスには反映されません。

次に確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 委譲が接続されている場合、`googlemeet setup` には成功した
`twilio-voice-call-plugin` と `twilio-voice-call-credentials` のチェックが含まれます。

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

## OAuth とプリフライト

`googlemeet create` はブラウザー自動操作へフォールバックできるため、Meet リンク作成に OAuth は任意です。
公式 API による作成、スペース解決、または Meet Media API のプリフライトチェックが必要な場合に OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープを要求し、Google アカウントを承認してから、生成されたリフレッシュトークンを
Google Meet Plugin config に保存するか、`OPENCLAW_GOOGLE_MEET_*` 環境変数を指定します。

OAuth は Chrome 参加パスを置き換えません。Chrome および Chrome-node トランスポートは、
ブラウザー参加を使う場合も、ログイン済み Chrome プロファイル、BlackHole/SoX、
接続済みノードを通じて参加します。OAuth は公式 Google Meet API パス専用です。
会議スペースの作成、スペース解決、Meet Media API プリフライトチェックを行います。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - Google Workspace 組織では **Internal** が最も簡単です。
   - 個人/テスト環境では **External** が使えます。アプリが Testing の間は、
     アプリを承認する各 Google アカウントをテストユーザーとして追加します。
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
`meetings.conference.media.readonly` は Meet Media API プリフライトとメディア作業用です。
実際の Media API 使用には、Google が Developer Preview 登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略してください。

### リフレッシュトークンを発行する

`oauth.clientId` と、必要に応じて `oauth.clientSecret` を設定するか、
環境変数として渡してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` config ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` の localhost コールバック、
および `--manual` による手動コピー/貼り付けフローを使用します。

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
config と環境変数の両方に値が存在する場合、Plugin は最初に config を解決し、
その後に環境変数へフォールバックします。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、Meet
カンファレンスメディア読み取りアクセスが含まれます。会議作成サポートが存在する前に認証していた場合は、
リフレッシュトークンが `meetings.space.created` スコープを持つように
`openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を確認する

高速でシークレットを含まないヘルスチェックが必要な場合は、OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済み Chrome ノードも必要としません。
OAuth config が存在すること、およびリフレッシュトークンがアクセストークンを発行できることを確認します。
JSON レポートには `ok`、`configured`、`tokenSource`、`expiresAt`、
チェックメッセージなどのステータスフィールドのみが含まれます。アクセストークン、リフレッシュトークン、
クライアントシークレットは出力しません。

一般的な結果:

| チェック             | 意味                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済みアクセストークンが存在します。    |
| `oauth-token`        | キャッシュ済みアクセストークンがまだ有効であるか、リフレッシュトークンが新しいアクセストークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                              |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                         |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用のある作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効であり、
承認済みアカウントが `meetings.space.created` スコープを持つことを確認する必要がある場合に使用します。

既存の会議スペースへの読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、承認済み Google アカウントがアクセスできる既存スペースへの読み取りアクセスを証明します。これらのチェックからの `403` は通常、
Google Meet REST API が無効である、同意済みリフレッシュトークンに必要なスコープがない、
または Google アカウントがその Meet スペースにアクセスできないことを意味します。リフレッシュトークンエラーは、
`openclaw googlemeet auth login
--json` を再実行し、新しい `oauth` ブロックを保存する必要があることを意味します。

ブラウザーフォールバックには OAuth 認証情報は不要です。このモードでは、Google
認証は OpenClaw config ではなく、選択されたノード上のログイン済み Chrome プロファイルから取得されます。

次の環境変数はフォールバックとして受け付けられます:

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

メディア作業の前にプリフライトを実行します:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後で、ミーティングのアーティファクトと出席状況を一覧表示します:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。そのミーティングで保持されているすべてのレコードが必要な場合は、`--all-conference-records` を渡します。

Calendar 参照では、Meet アーティファクトを読み取る前に Google Calendar からミーティング URL を解決できます:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Google Meet リンクを含む Calendar イベントを今日の `primary` カレンダーから検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、非プライマリ Calendar には `--calendar <id>` を使用します。Calendar 参照には、Calendar events 読み取り専用スコープを含む新しい OAuth ログインが必要です。`calendar-events` は一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントに印を付けます。

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

Google がミーティングについて公開している場合、`artifacts` は会議レコードのメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートのリソースメタデータを返します。大規模なミーティングでエントリ参照をスキップするには `--no-transcript-entries` を使用します。`attendance` は参加者を参加者セッション行に展開し、初回/最終確認時刻、合計セッション時間、遅刻/早退フラグ、ログイン済みユーザーまたは表示名でマージされた重複参加者リソースを含めます。生の参加者リソースを分離したままにするには `--no-merge-duplicates` を渡し、遅刻検出を調整するには `--late-after-minutes`、早退検出を調整するには `--early-before-minutes` を渡します。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。`manifest.json` には、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、および部分取得の警告が記録されます。フォルダーの横に持ち運び可能なアーカイブも書き出すには、`--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには、`--include-doc-bodies` を渡します。これには、Drive Meet 読み取り専用スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` がない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。Google がスマートノート一覧、文字起こしエントリ、Drive ドキュメント本文エラーなどの部分的なアーティファクト失敗を返した場合、エクスポート全体を失敗させる代わりに、概要とマニフェストに警告が保持されます。`--dry-run` を使用すると、同じアーティファクト/出席状況データを取得し、フォルダーや ZIP を作成せずにマニフェスト JSON を出力します。これは、大規模なエクスポートを書き出す前や、エージェントが件数、選択されたレコード、警告だけを必要とする場合に便利です。

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

エクスポートマニフェストのみを返し、ファイル書き込みをスキップするには `"dryRun": true` を設定します。

実際に保持されたミーティングに対して、ガード付きライブスモークを実行します:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` はガード付きライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は、保持された Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth
  クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は
  更新トークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本のアーティファクト/出席状況ライブスモークには、
`https://www.googleapis.com/auth/meetings.space.readonly` と
`https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar
参照には `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive
ドキュメント本文のエクスポートには
`https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します:

```bash
openclaw googlemeet create
```

このコマンドは、新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は、公式の Google Meet API を使用します。OAuth 認証情報がない場合は、ピン留めされた Chrome ノードのログイン済みブラウザプロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定して `google_meet` ツールを使用し、1 ステップで作成と参加を行えます。URL のみを作成するには、`"join": false` を渡します。

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

ブラウザフォールバックが URL を作成できる前に Google ログインまたは Meet 権限ブロッカーに遭遇した場合、Gateway メソッドは失敗レスポンスを返し、`google_meet` ツールは単純な文字列ではなく構造化された詳細を返します:

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

エージェントが `manualActionRequired: true` を見た場合は、`manualActionMessage` とブラウザのノード/タブコンテキストを報告し、オペレーターがブラウザ手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

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

Meet の作成ではデフォルトで参加も行います。Chrome または Chrome-node トランスポートでブラウザから参加するには、引き続きログイン済みの Google Chrome プロファイルが必要です。プロファイルがログアウトしている場合、OpenClaw は `manualActionRequired: true` またはブラウザフォールバックエラーを報告し、再試行する前にオペレーターに Google ログインの完了を求めます。

Cloud プロジェクト、OAuth プリンシパル、ミーティング参加者が Meet media APIs 向け Google Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定します。

## 設定

一般的な Chrome リアルタイムパスに必要なのは、有効化された Plugin、BlackHole、SoX、バックエンドのリアルタイム音声プロバイダーキーだけです。OpenAI がデフォルトです。Google Gemini Live を使用するには `realtime.provider: "google"` を設定します:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 設定を `plugins.entries.google-meet.config` 配下で設定します:

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
- `chrome.guestName: "OpenClaw Agent"`: ログアウト状態の Meet ゲスト画面で使用する名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザ自動化による、ベストエフォートのゲスト名入力と「今すぐ参加」クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに既存の Meet タブをアクティブ化
- `chrome.waitForInCallMs: 20000`: リアルタイムのイントロがトリガーされる前に、Meet タブが通話中と報告するまで待機
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペア音声形式。電話音声をまだ出力するレガシー/カスタムのコマンドペアにのみ `"g711-ulaw-8khz"` を使用します。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` で音声を書き出す SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` で音声を読み取り、CoreAudio `BlackHole 2ch` に書き込む SoX コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 短い音声応答。より深い回答には `openclaw_agent_consult` を使用
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声準備確認。無音で参加するには `""` に設定
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw エージェント ID。デフォルトは `main`

任意の上書き設定:

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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話と DTMF を Voice Call Plugin に委任します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランの検証と記録を実行できますが、Twilio 通話を発信することはできません。

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

Chrome が Gateway ホストで実行されている場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノードで実行されている場合は `transport: "chrome-node"` を使用します。どちらの場合も、リアルタイムモデルと `openclaw_agent_consult` は Gateway ホストで実行されるため、モデルの認証情報はそこに保持されます。

アクティブなセッションを一覧表示するか、セッション ID を調べるには `action: "status"` を使用します。リアルタイムエージェントにただちに発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` の健全性を返すには `action: "test_speech"` を使用します。`test_speech` は常に `mode: "realtime"` を強制し、`mode: "transcribe"` で実行するよう要求された場合は失敗します。これは、観察専用セッションが意図的に音声を出力できないためです。その `speechOutputVerified` の結果は、このテスト呼び出し中にリアルタイム音声出力バイトが増加したかどうかに基づくため、古い音声を持つ再利用セッションは新しい発話チェックの成功として扱われません。セッションを終了済みにマークするには `action: "leave"` を使用します。

利用可能な場合、`status` には Chrome の健全性が含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見える
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話が機能する前に、ブラウザープロファイルで手動ログイン、Meet ホストによる参加許可、権限付与、またはブラウザー制御の修復が必要
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome の発話が現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを音声ブリッジへ送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に受信した、またはブリッジへ送信した音声

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## リアルタイムエージェント相談

Chrome のリアルタイムモードは、ライブ音声ループ向けに最適化されています。リアルタイム音声プロバイダーは会議音声を聞き取り、設定済みの音声ブリッジを通じて発話します。リアルタイムモデルがより深い推論、最新情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

相談ツールは、最近の会議トランスクリプトのコンテキストを使って通常の OpenClaw エージェントを裏側で実行し、リアルタイム音声セッションへ簡潔な発話用回答を返します。その後、音声モデルはその回答を会議内で発話できます。これは Voice Call と同じ共有リアルタイム相談ツールを使用します。

デフォルトでは、相談は `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルデフォルト、ツールポリシー、メモリ、セッション履歴に相談する必要がある場合は、`realtime.agentId` を設定します。

`realtime.toolPolicy` は相談実行を制御します。

- `safe-read-only`: 相談ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: 相談ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。
- `none`: リアルタイム音声モデルに相談ツールを公開しません。

相談セッションキーは Meet セッションごとにスコープされるため、同じ会議中の後続の相談呼び出しで以前の相談コンテキストを再利用できます。

Chrome が通話に完全に参加した後で、発話による準備完了チェックを強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全な参加および発話のスモークには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

会議を無人エージェントに引き渡す前に、この手順を使用します。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node 状態:

- `googlemeet setup` はすべて緑です。
- Chrome-node がデフォルトトランスポートであるか、ノードが固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` は選択されたノードが接続済みであることを示します。
- 選択されたノードは `googlemeet.chrome` と `browser.proxy` の両方を広告します。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome 健全性を返します。

Parallels macOS VM などのリモート Chrome ホストの場合、これは Gateway または VM の更新後に行う最短の安全なチェックです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際の会議タブを開く前に、Gateway Plugin が読み込まれていること、VM ノードが現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることが証明されます。

Twilio スモークには、電話ダイヤルイン詳細を公開している会議を使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待される Twilio 状態:

- `googlemeet setup` に緑の `twilio-voice-call-plugin` と `twilio-voice-call-credentials` チェックが含まれます。
- Gateway の再読み込み後、CLI で `voicecall` が利用できます。
- 返されたセッションには `transport: "twilio"` と `twilio.voiceCallId` があります。
- `googlemeet leave <sessionId>` は委任された音声通話を切断します。

## トラブルシューティング

### エージェントが Google Meet ツールを認識できない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway を再読み込みします。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動または再読み込みします。実行中のエージェントは、現在の Gateway プロセスによって登録された Plugin ツールだけを認識します。

### Google Meet 対応ノードが接続されていない

ノードホストで次を実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで、ノードを承認し、コマンドを検証します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードは接続済みで、`googlemeet.chrome` と `browser.proxy` を列挙している必要があります。Gateway 設定では、これらのノードコマンドを許可している必要があります。

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

その後、ノードサービスを再読み込みし、再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くがエージェントが参加できない

`googlemeet test-speech` を実行し、返された Chrome 健全性を確認します。`manualActionRequired: true` が報告された場合は、`manualActionMessage` をオペレーターに表示し、ブラウザー操作が完了するまで再試行を停止します。

一般的な手動操作:

- Chrome プロファイルにサインインする。
- Meet ホストアカウントからゲストを許可する。
- Chrome のネイティブ権限プロンプトが表示されたときに、Chrome のマイク/カメラ権限を付与する。
- 停滞している Meet 権限ダイアログを閉じるか修復する。

Meet に「Do you want people to hear you in the meeting?」と表示されているだけで「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は利用可能な場合、ブラウザー自動化を通じて **Use microphone** をクリックし、実際の会議状態を待ち続けます。作成専用のブラウザーフォールバックでは、URL の作成にリアルタイム音声パスが不要なため、OpenClaw が **Continue without microphone** をクリックする場合があります。

### 会議の作成に失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、まず Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合は、固定された Chrome ノードブラウザーにフォールバックします。次を確認します。

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されている、または一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在する。
- API 作成の場合: リフレッシュトークンは作成サポートが追加された後に発行されている。古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新します。
- ブラウザーフォールバックの場合: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済みノードを指している。
- ブラウザーフォールバックの場合: そのノード上の OpenClaw Chrome プロファイルが Google にサインインしており、`https://meet.google.com/new` を開ける。
- ブラウザーフォールバックの場合: 再試行では、新しいタブを開く前に既存の `https://meet.google.com/new` または Google アカウントプロンプトタブを再利用する。エージェントがタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行します。
- ブラウザーフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用してオペレーターを案内します。その操作が完了するまでループで再試行しないでください。
- ブラウザーフォールバックの場合: Meet に「Do you want people to hear you in the meeting?」と表示されたら、タブを開いたままにします。OpenClaw はブラウザー自動化を通じて **Use microphone**、または作成専用フォールバックでは **Continue without microphone** をクリックし、生成された Meet URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認します。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

聞き取り/返答には `mode: "realtime"` を使用します。`mode: "transcribe"` は意図的に双方向のリアルタイム音声ブリッジを開始しません。`googlemeet test-speech` は常にリアルタイムパスをチェックし、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で、`speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け付けたものの、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達するのを確認できなかった可能性があります。

次も確認します。

- Gateway ホストで `OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーが利用可能である。
- Chrome ホストで `BlackHole 2ch` が表示されている。
- Chrome ホストに `sox` が存在する。
- Meet のマイクとスピーカーが、OpenClaw が使用する仮想音声パスを経由してルーティングされている。

`googlemeet doctor [session-id]` は、セッション、ノード、通話中状態、手動操作理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入力/出力アクティビティ、最終音声タイムスタンプ、バイトカウンター、ブラウザー URL を出力します。生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用します。トークンを公開せずに Google Meet OAuth 更新を検証する必要がある場合は `googlemeet doctor --oauth` を使用します。Google Meet API の証明も必要な場合は、`--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いていることを確認できる場合は、別のタブを開かずにそのタブを調べます。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。選択されたトランスポートの既存の Meet タブにフォーカスし、検査します。`chrome` では Gateway を通じたローカルブラウザー制御を使用し、`chrome-node` では設定済みの Chrome ノードを使用します。新しいタブを開いたり、新しいセッションを作成したりしません。ログイン、参加許可、権限、音声選択状態など、現在のブロッカーを報告します。CLI コマンドは設定済みの Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では Chrome ノードも接続済みである必要があります。

### Twilio セットアップチェックが失敗する

`twilio-voice-call-plugin` は `voice-call` が許可されていない、または有効になっていない場合に失敗します。
`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway を再読み込みします。

`twilio-voice-call-credentials` は、Twilio バックエンドにアカウント
SID、認証トークン、または発信者番号がない場合に失敗します。Gateway ホストでこれらを設定してください。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

次に Gateway を再起動または再読み込みして、以下を実行します。

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトでは準備状態の確認のみです。特定の番号でドライランするには、次を実行します。

```bash
openclaw voicecall smoke --to "+15555550123"
```

意図的にライブのアウトバウンド通知通話を発信したい場合にのみ、`--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始されるが、会議に参加しない

Meet イベントが電話ダイヤルインの詳細を公開していることを確認します。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN を入力する前にプロバイダー側で一時停止が必要な場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

## 注意事項

Google Meet の公式メディア API は受信向けのため、Meet 通話に話しかけるには引き続き参加者パスが必要です。この Plugin はその境界を見える状態に保ちます。Chrome はブラウザー参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome リアルタイムモードには `BlackHole 2ch` に加えて、次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がリアルタイムモデルブリッジを所有し、これらのコマンドと選択されたリアルタイム音声プロバイダーの間で `chrome.audioFormat` の音声をパイプします。デフォルトの Chrome パスは 24 kHz PCM16 です。8 kHz G.711 mu-law はレガシーコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を所有し、デーモンを起動または検証した後に終了する必要があります。

クリーンな双方向音声のために、Meet 出力と Meet マイクを別々の仮想デバイス、または Loopback 形式の仮想デバイスグラフ経由でルーティングしてください。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

`googlemeet speak` は Chrome セッションのアクティブなリアルタイム音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin 経由で委任された Twilio セッションでは、`leave` は基盤となる音声通話も切断します。

## 関連

- [音声通話Plugin](/ja-JP/plugins/voice-call)
- [通話モード](/ja-JP/nodes/talk)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
