---
read_when:
    - OpenClawエージェントをGoogle Meet通話に参加させたい場合
    - OpenClawエージェントに新しいGoogle Meet通話を作成させたい場合
    - Google Meet のトランスポートとして Chrome、Chrome node、または Twilio を設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、リアルタイム音声のデフォルトを使用する'
title: Google Meet Plugin
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:36:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 向けの Google Meet 参加者サポート — このPluginは意図的に明示的な設計になっています。

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、その後、返された
  URL に参加できます。
- `realtime` 音声がデフォルトモードです。
- より深い推論やツールが必要な場合、Realtime 音声は完全な OpenClaw エージェントへコールバックできます。
- エージェントは `mode` で参加動作を選択します。ライブの
  listen/talk-back には `realtime` を使用し、realtime 音声ブリッジなしでブラウザーに参加 / 制御するには `transcribe` を使用します。
- 認証は個人の Google OAuth または、すでにサインイン済みの Chrome プロファイルから始まります。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome オーディオバックエンドは `BlackHole 2ch` です。
- Chrome はローカルでも、ペアリングされた node ホスト上でも実行できます。
- Twilio はダイヤルイン番号に加えて、任意の PIN または DTMF シーケンスを受け付けます。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントの
  テレカンファレンスワークフロー用に予約されています。

## クイックスタート

ローカルのオーディオ依存関係をインストールし、バックエンドの realtime voice
provider を設定します。デフォルトは OpenAI です。Google Gemini Live も
`realtime.provider: "google"` で動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想オーディオデバイスをインストールします。Homebrew の
インストーラーでは、macOS がそのデバイスを公開する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

セットアップ出力は、エージェントが読めることを意図しています。Chrome プロファイル、
オーディオブリッジ、node の固定、遅延 realtime intro、および Twilio delegation
が設定されている場合は、`voice-call` Plugin と Twilio 認証情報の準備状況を報告します。
`ok: false` のチェックは、エージェントに参加を依頼する前のブロッカーとして扱ってください。
スクリプトまたは機械可読出力には `openclaw googlemeet setup --json` を使用します。
エージェントが試す前に特定の transport を事前確認するには `--transport chrome`、`--transport chrome-node`、または `--transport twilio`
を使用します。

会議に参加するには:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `google_meet` ツール経由で参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

新しい会議を作成して参加するには:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

参加せずに URL だけを作成するには:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つの経路があります。

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使用されます。これは
  最も決定的な経路で、ブラウザー UI の状態に依存しません。
- ブラウザーフォールバック: OAuth 認証情報がない場合に使用されます。OpenClaw は
  固定された Chrome node を使い、`https://meet.google.com/new` を開き、Google が実際の会議コード URL にリダイレクトするのを待ってから、その URL を返します。この経路では、
  node 上の OpenClaw Chrome プロファイルがすでに Google にサインイン済みである必要があります。
  ブラウザー自動化は、Meet 自身の初回マイクプロンプトを処理します。このプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローでは、新しいタブを開く前に既存の Meet タブの再利用も試みます。マッチングでは `authuser` のような無害な URL クエリ文字列は無視されるため、
  エージェントの再試行では 2 つ目の Chrome タブを作成する代わりに、すでに開いている会議にフォーカスするはずです。

コマンド / ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、エージェントはどの経路が使われたかを説明できます。`create` はデフォルトで新しい会議に参加し、`joined: true` と参加セッションを返します。URL だけを発行するには、
CLI では `create --no-join` を使うか、ツールに `"join": false` を渡します。

あるいは、エージェントに「Google Meet を作成して、realtime voice で参加し、
リンクを送って」と伝えることもできます。エージェントは `action: "create"` で `google_meet` を呼び出し、
返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

観察専用 / ブラウザー制御の参加には、`"mode": "transcribe"` を設定します。これにより
双方向の realtime model bridge は開始されないため、会議に向かって話し返すことはありません。

realtime セッション中、`google_meet` のステータスにはブラウザーとオーディオブリッジの
ヘルス情報が含まれます。たとえば `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後の入出力
タイムスタンプ、バイトカウンター、ブリッジのクローズ状態などです。安全な Meet ページプロンプトが表示された場合、
ブラウザー自動化は可能ならそれを処理します。ログイン、ホストの承認、ブラウザー / OS の権限プロンプトは、
エージェントが伝達すべき理由とメッセージ付きの手動アクションとして報告されます。

Chrome はサインイン済みの Chrome プロファイルとして参加します。Meet では、OpenClaw が使用する
マイク / スピーカー経路として `BlackHole 2ch` を選択してください。クリーンな双方向音声のためには、
別々の仮想デバイスまたは Loopback 風のグラフを使用してください。最初のスモークテストには 1 つの BlackHole デバイスでも十分ですが、
エコーが発生する可能性があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM の中に完全な OpenClaw Gateway やモデル API キーは**不要**です。Gateway とエージェントはローカルで実行し、その後 VM 内で
node ホストを実行します。VM 上でバンドル済みPluginを一度有効にして、node が Chrome コマンドを広告するようにします。

各コンポーネントの実行場所:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、model/API keys、realtime
  provider、および Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/node host、Google Chrome、SoX、BlackHole 2ch、
  および Google にサインイン済みの Chrome プロファイル。
- VM で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、または model
  provider の設定。

VM 依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHole のインストール後、macOS が `BlackHole 2ch` を公開するように VM を再起動します。

```bash
sudo reboot
```

再起動後、VM からオーディオデバイスと SoX コマンドが見えることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM に OpenClaw をインストールまたは更新し、そこでバンドル済みPluginを有効にします。

```bash
openclaw plugins enable google-meet
```

VM で node ホストを起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で、TLS を使っていない場合、信頼されたプライベートネットワーク向けに明示的に許可しない限り、
node は平文 WebSocket を拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

node を LaunchAgent としてインストールする場合も、同じ環境変数を使用します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` 設定ではありません。`openclaw node install` は、
インストールコマンド実行時にこれが存在すれば LaunchAgent 環境に保存します。

Gateway ホストから node を承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が node を認識していて、`googlemeet.chrome`
および browser capability/`browser.proxy` の両方を広告していることを確認します。

```bash
openclaw nodes status
```

Gateway ホスト上で、その node に Meet をルーティングします。

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

これで、通常どおり Gateway ホストから参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `transport: "chrome-node"` を指定して `google_meet` ツールを使わせます。

作成または既存セッションの再利用を行い、既知のフレーズを発話し、
セッションヘルスを出力するワンコマンドのスモークテストには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

参加中、OpenClaw のブラウザー自動化は guest name を入力し、Join/Ask
to join をクリックし、そのプロンプトが表示された場合には Meet の初回「Use microphone」選択を受け入れます。ブラウザーのみの会議作成中は、
Meet が use-microphone ボタンを表示しない場合、マイクなしで同じプロンプトを続行することもできます。
ブラウザープロファイルがサインインしていない、Meet がホストの
承認待ちになっている、Chrome にマイク / カメラ権限が必要、または Meet が
自動化で解決できなかったプロンプトで停止している場合、join/test-speech の結果は
`manualActionRequired: true` とともに `manualActionReason` および
`manualActionMessage` を報告します。エージェントは参加の再試行を止め、
その正確なメッセージに現在の `browserUrl`/`browserTitle` を添えて報告し、
手動のブラウザー操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` が省略されている場合、OpenClaw が自動選択するのは
接続済み node のうち `googlemeet.chrome` と browser control の両方を広告するものが
ちょうど 1 つだけの場合に限られます。利用可能な node が複数接続されている場合は、
`chromeNode.node` を node id、display name、または remote IP に設定してください。

一般的な障害確認:

- `Configured Google Meet node ... is not usable: offline`: 固定された node は
  Gateway に認識されていますが利用できません。エージェントはその node を
  使用可能な Chrome ホストではなく診断状態として扱い、
  ユーザーが明示的に求めていない限り、別の transport にフォールバックする代わりに
  セットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM 内で `openclaw node run` を起動し、
  ペアリングを承認し、VM で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行されていることを確認してください。また、
  Gateway ホストが両方の node コマンドを
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` で許可していることも確認してください。
- `BlackHole 2ch audio device not found`: 確認対象のホストに `blackhole-2ch` をインストールし、
  ローカル Chrome オーディオを使う前に再起動してください。
- `BlackHole 2ch audio device not found on the node`: VM に `blackhole-2ch`
  をインストールし、VM を再起動してください。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  guest 参加用に `chrome.guestName` を設定したままにしてください。guest auto-join は OpenClaw の
  ブラウザー自動化を node browser proxy 経由で使用します。node browser
  設定が希望するプロファイルを指していることを確認してください。たとえば
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイルです。
- 重複した Meet タブ: `chrome.reuseExistingTab: true` を有効のままにしてください。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブにし、
  ブラウザー会議作成では別のタブを開く前に進行中の `https://meet.google.com/new`
  または Google アカウントプロンプトタブを再利用します。
- 音が出ない: Meet で、マイク / スピーカーを OpenClaw が使用する仮想オーディオデバイス経路にルーティングしてください。クリーンな双方向音声には、
  別々の仮想デバイスまたは Loopback 風のルーティングを使用してください。

## インストールに関する注意

Chrome realtime のデフォルトでは 2 つの外部ツールを使用します。

- `sox`: コマンドラインオーディオユーティリティ。Plugin はデフォルトの 8 kHz G.711 mu-law オーディオブリッジに
  その `rec` および `play` コマンドを使用します。
- `blackhole-2ch`: macOS 仮想オーディオドライバー。Chrome/Meet がルーティングできる
  `BlackHole 2ch` オーディオデバイスを作成します。

OpenClaw はどちらのパッケージもバンドルも再配布もしません。ドキュメントでは、
それらを Homebrew 経由のホスト依存関係としてインストールするようユーザーに案内しています。SoX のライセンスは
`LGPL-2.0-only AND GPL-2.0-only`、BlackHole は GPL-3.0 です。OpenClaw と一緒に BlackHole をバンドルする
インストーラーまたはアプライアンスを作成する場合は、BlackHole の
upstream ライセンス条件を確認するか、Existential Audio から別ライセンスを取得してください。

## トランスポート

### Chrome

Chrome transport は Google Chrome で Meet URL を開き、サインイン済みの
Chrome プロファイルとして参加します。macOS では、Plugin は起動前に `BlackHole 2ch` を確認します。
設定されている場合は、Chrome を開く前にオーディオブリッジのヘルスコマンドと起動コマンドも実行します。
Chrome / オーディオが Gateway ホスト上にある場合は `chrome` を使用してください。
Chrome / オーディオが Parallels macOS VM などのペアリング済み node 上にある場合は `chrome-node` を使用してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクおよびスピーカー音声を、ローカルの OpenClaw オーディオ
ブリッジ経由にルーティングします。`BlackHole 2ch` がインストールされていない場合、参加は
音声経路なしで黙って参加するのではなく、セットアップエラーで失敗します。

### Twilio

Twilio transport は Voice Call Plugin に委譲される厳格なダイヤルプランです。
Meet ページから電話番号を解析しません。

これは、Chrome での参加が利用できない場合や、電話ダイヤルインのフォールバックが必要な場合に使用します。Google Meet はその
会議用の電話ダイヤルイン番号と PIN を公開している必要があります。OpenClaw はそれらを Meet ページから検出しません。

Voice Call Plugin は Chrome node ではなく Gateway ホスト上で有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // または、Twilio をデフォルトにする場合は "twilio" を設定
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

Twilio 認証情報は環境変数または設定で指定します。環境変数を使うと
シークレットを `openclaw.json` に含めずに済みます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` を有効にした後は Gateway を再起動または再読み込みしてください。Plugin 設定の変更は、
すでに実行中の Gateway プロセスでは再読み込みされるまで反映されません。

その後、確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio delegation が正しく接続されている場合、`googlemeet setup` には成功した
`twilio-voice-call-plugin` および `twilio-voice-call-credentials` チェックが含まれます。

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

## OAuth と事前確認

Meet リンクの作成に OAuth は必須ではありません。`googlemeet create` は
ブラウザー自動化にフォールバックできるためです。公式 API による作成、
space 解決、または Meet Media API の事前確認チェックを行いたい場合に OAuth を設定してください。

Google Meet API アクセスにはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープを要求し、Google アカウントを認可してから、
生成された refresh token を Google Meet Plugin 設定に保存するか、
`OPENCLAW_GOOGLE_MEET_*` 環境変数を指定します。

OAuth は Chrome 参加経路を置き換えるものではありません。Chrome および Chrome-node transport は
ブラウザー参加を使用する場合、引き続きサインイン済みの Chrome プロファイル、BlackHole/SoX、
および接続済み node を通じて参加します。OAuth は公式 Google
Meet API 経路専用です。会議 space の作成、space の解決、Meet Media API の事前確認チェックに使用します。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - Google Workspace 組織では **Internal** が最も簡単です。
   - **External** は個人 / テスト構成で使えます。アプリが Testing 状態の間は、
     アプリを認可する各 Google アカウントをテストユーザーとして追加してください。
4. OpenClaw が要求するスコープを追加します。
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth クライアント ID を作成します。
   - アプリケーションタイプ: **Web application**。
   - 許可されたリダイレクト URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. クライアント ID とクライアントシークレットをコピーします。

`meetings.space.created` は Google Meet の `spaces.create` に必要です。
`meetings.space.readonly` により OpenClaw は Meet URL / コードを space に解決できます。
`meetings.conference.media.readonly` は Meet Media API の事前確認およびメディア
処理用です。実際の Media API 利用には Google が Developer Preview 参加を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要なら、OAuth は完全に省略できます。

### refresh token を発行する

`oauth.clientId` と必要に応じて `oauth.clientSecret` を設定するか、
環境変数として渡してから次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは refresh token を含む `oauth` 設定ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` での localhost コールバック、および
`--manual` を使う手動のコピー / ペーストフローを使用します。

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

refresh token を設定に入れたくない場合は環境変数を推奨します。
設定値と環境変数値の両方が存在する場合、Plugin はまず設定を解決し、
次に環境変数へフォールバックします。

OAuth 同意には Meet space 作成、Meet space 読み取りアクセス、および Meet
conference media 読み取りアクセスが含まれます。会議作成
サポートが存在する前に認証した場合は、refresh
token に `meetings.space.created` スコープが付与されるよう `openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を確認する

シークレットを表示しない高速なヘルスチェックが必要な場合は OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済み Chrome node も必要としません。
OAuth 設定が存在すること、および refresh token で access
token を発行できることを確認します。JSON レポートには `ok`、`configured`、
`tokenSource`、`expiresAt`、チェックメッセージなどのステータス項目だけが含まれます。
access token、refresh token、client secret は出力されません。

一般的な結果:

| Check                | Meaning                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済み access token が存在します。 |
| `oauth-token`        | キャッシュ済み access token がまだ有効、または refresh token により新しい access token が発行されました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックで既存の Meet space が解決されました。                             |
| `meet-spaces-create` | 任意の `--create-space` チェックで新しい Meet space が作成されました。                         |

Google Meet API の有効化と `spaces.create` スコープも確認するには、
副作用のある作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud
プロジェクトで Meet API が有効になっていること、および認可された
アカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用してください。

既存の会議 space への読み取りアクセスを確認するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済み Google アカウントがアクセスできる既存
space への読み取りアクセスを確認します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効、
同意済み refresh token に必要なスコープがない、または Google アカウントがその Meet
space にアクセスできないことを意味します。refresh-token エラーが出た場合は、`openclaw googlemeet auth login
--json` を再実行して新しい `oauth` ブロックを保存してください。

ブラウザーフォールバックには OAuth 認証情報は不要です。そのモードでは、Google
認証は OpenClaw 設定からではなく、選択された node 上のサインイン済み Chrome プロファイルから取得されます。

フォールバックとして受け付けられる環境変数は次のとおりです。

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

メディア処理の前に事前確認を実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が conference record を作成した後で、会議アーティファクトと出席情報を一覧表示します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定した場合、`artifacts` と `attendance` はデフォルトで
最新の conference record を使用します。その会議の保持されているすべての record が必要な場合は `--all-conference-records` を渡してください。

Calendar lookup は、Meet アーティファクトを読む前に Google Calendar から会議 URL を解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は今日の `primary` カレンダーを検索し、
Google Meet リンク付きの Calendar event を探します。一致する event テキストを検索するには `--event <query>` を、
primary 以外のカレンダーには `--calendar <id>` を使用します。Calendar lookup には、
Calendar events readonly スコープを含む新しい OAuth ログインが必要です。
`calendar-events` は一致した Meet event をプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択する event を示します。

conference record id がすでに分かっている場合は、直接指定します。

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

`artifacts` は、Google がその会議向けに公開している場合、conference record metadata に加えて participant、
recording、transcript、構造化された transcript-entry、および smart-note resource metadata を返します。大規模な
会議では、entry lookup を省略するために `--no-transcript-entries` を使用してください。`attendance` は
participants を participant-session row に展開し、初回 / 最終確認時刻、総セッション時間、
遅刻 / 早退フラグ、およびサインイン済みユーザーまたは表示名ごとに重複 participant resource を
マージします。生の participant
resource を分けたままにするには `--no-merge-duplicates` を、遅刻判定の調整には `--late-after-minutes` を、
早退判定の調整には `--early-before-minutes` を渡してください。

`export` は `summary.md`、`attendance.csv`、
`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。
`manifest.json` には、選択した入力、エクスポートオプション、conference records、
出力ファイル、件数、token source、使用された場合の Calendar event、および部分取得の警告が記録されます。
フォルダーの横に可搬性のあるアーカイブも書き出すには `--zip` を渡してください。
リンクされた transcript と smart-note の Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには `--include-doc-bodies` を渡してください。これには、
Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。
`--include-doc-bodies` を使わない場合、エクスポートには Meet metadata と構造化された transcript
entries のみが含まれます。Google が smart-note
listing、transcript-entry、または Drive document-body エラーのような部分的な artifact failure を返した場合、summary と
manifest はエクスポート全体を失敗させる代わりに警告を保持します。
同じ artifact / attendance データを取得し、フォルダーや ZIP を作成せずに
manifest JSON を出力するには `--dry-run` を使用してください。これは、大きなエクスポートを書き出す前や、
エージェントが件数、選択された records、および
警告だけを必要とする場合に便利です。

エージェントは `google_meet` ツールを通じて同じバンドルを作成することもできます。

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ファイル書き込みを省略して export manifest のみを返すには `"dryRun": true` を設定します。

保持された実際の会議に対して、保護付き live smoke を実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

live smoke 環境:

- `OPENCLAW_LIVE_TEST=1` は保護付き live test を有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は保持された Meet URL、code、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth
  client id を指定します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は
  refresh token を指定します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` には、`OPENCLAW_` 接頭辞なしの
  同じフォールバック名を使用します。

基本の artifact / attendance live smoke には
`https://www.googleapis.com/auth/meetings.space.readonly` と
`https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar
lookup には `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive
document-body export には
`https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet space を作成します。

```bash
openclaw googlemeet create
```

このコマンドは、新しい `meeting uri`、source、および join session を出力します。OAuth
認証情報がある場合は公式の Google Meet API を使用します。OAuth 認証情報がない場合は、
フォールバックとして固定された Chrome node のサインイン済みブラウザープロファイルを使用します。エージェントは
`action: "create"` を指定した `google_meet` ツールを使って、1 ステップで作成と参加を行えます。URL のみを作成するには、`"join": false` を渡してください。

ブラウザーフォールバックの JSON 出力例:

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

ブラウザーフォールバックが、URL を作成する前に Google ログインまたは Meet の権限ブロッカーに遭遇した場合、
Gateway メソッドは失敗レスポンスを返し、`google_meet` ツールは単なる文字列ではなく
構造化された詳細を返します。

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw browser profile で Google にサインインしてから、会議作成を再試行してください。",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw browser profile で Google にサインインしてから、会議作成を再試行してください。",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

エージェントが `manualActionRequired: true` を見た場合、`manualActionMessage` と
ブラウザー node / tab のコンテキストを報告し、オペレーターがブラウザーステップを完了するまで新しい
Meet タブを開くのをやめる必要があります。

API create の JSON 出力例:

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

Meet の作成ではデフォルトで参加も行います。Chrome または Chrome-node transport では、
ブラウザー経由で参加するために引き続き Google にサインイン済みの Chrome プロファイルが必要です。その
プロファイルがサインアウトされている場合、OpenClaw は `manualActionRequired: true` または
ブラウザーフォールバックエラーを報告し、Google ログインを完了してから
再試行するようオペレーターに求めます。

Cloud
project、OAuth principal、および会議参加者が Meet media APIs 用 Google
Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

一般的な Chrome realtime 経路では、必要なのは Plugin の有効化、BlackHole、SoX、
およびバックエンド realtime voice provider key だけです。デフォルトは OpenAI です。
Google Gemini Live を使用するには `realtime.provider: "google"` を設定します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 設定は `plugins.entries.google-meet.config` の下に設定します。

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
- `chromeNode.node`: `chrome-node` 用の任意の node id / name / IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウト状態の Meet guest
  画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上での OpenClaw ブラウザー自動化による
  ベストエフォートの guest name 入力と Join Now クリック
- `chrome.reuseExistingTab: true`: 重複を開く代わりに既存の Meet タブをアクティブ化
- `chrome.waitForInCallMs: 20000`: realtime intro がトリガーされる前に Meet タブが in-call を報告するまで待機
- `chrome.audioInputCommand`: 8 kHz G.711 mu-law
  オーディオを stdout に書き出す SoX `rec` コマンド
- `chrome.audioOutputCommand`: stdin から 8 kHz G.711 mu-law
  オーディオを読み込む SoX `play` コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 短い音声応答。より深い回答には
  `openclaw_agent_consult` を使用
- `realtime.introMessage`: realtime bridge
  接続時の短い音声準備確認。無音で参加するには `""` に設定

任意の上書き設定:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "正確にこう言って: I'm here.",
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

`voiceCall.enabled` のデフォルトは `true` です。Twilio transport では、実際の
PSTN 通話と DTMF は Voice Call Plugin に委譲されます。`voice-call` が有効でない場合でも、
Google Meet はダイヤルプランの検証と記録はできますが、
Twilio 通話を発信することはできません。

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

Chrome が Gateway ホスト上で動作する場合は `transport: "chrome"` を使用します。
Chrome が Parallels
VM などのペアリング済み node 上で動作する場合は `transport: "chrome-node"` を使用します。どちらの場合も、realtime model と `openclaw_agent_consult` は
Gateway ホスト上で動作するため、model 認証情報はそこに保持されます。

アクティブなセッション一覧やセッション ID の確認には `action: "status"` を使用します。
realtime エージェントに即座に話させるには `sessionId` と `message` を付けて `action: "speak"` を使用します。セッションを作成または再利用し、
既知のフレーズをトリガーして、Chrome ホストが報告できる場合は `inCall` ヘルスを返すには `action: "test_speech"` を使用します。セッション終了を記録するには `action: "leave"` を使用します。

`status` には、利用可能な場合は Chrome のヘルスも含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見える
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 音声を機能させる前に、
  ブラウザープロファイルでの手動ログイン、Meet ホスト承認、権限、または
  ブラウザー制御の修復が必要
- `providerConnected` / `realtimeReady`: realtime voice bridge の状態
- `lastInputAt` / `lastOutputAt`: ブリッジから受信 / ブリッジへ送信した最後の音声時刻

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "正確にこう言って: I'm here and listening."
}
```

## Realtime エージェント consult

Chrome realtime モードは、ライブの音声ループ向けに最適化されています。realtime voice
provider は会議音声を聞き、設定済みオーディオブリッジを通じて発話します。
realtime model がより深い推論、最新情報、または通常の OpenClaw ツールを必要とする場合、
`openclaw_agent_consult` を呼び出すことができます。

consult ツールは、最近の会議 transcript コンテキストを使って通常の OpenClaw エージェントを
裏側で実行し、realtime voice セッション向けに簡潔な音声回答を返します。voice model は
その回答を会議に向けて話し返すことができます。
これは Voice Call と同じ共有 realtime consult ツールを使用します。

`realtime.toolPolicy` は consult 実行を制御します。

- `safe-read-only`: consult ツールを公開し、通常エージェントを
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、および
  `memory_get` に制限します。
- `owner`: consult ツールを公開し、通常エージェントに通常の
  エージェントツールポリシーの使用を許可します。
- `none`: realtime voice model に consult ツールを公開しません。

consult session key は Meet セッションごとにスコープされるため、後続の consult 呼び出しでも
同じ会議中であれば以前の consult コンテキストを再利用できます。

Chrome が通話に完全参加した後で、音声による準備確認を強制するには:

```bash
openclaw googlemeet speak meet_... "正確にこう言って: I'm here and listening."
```

完全な join-and-speak smoke については:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live test チェックリスト

会議を無人エージェントに引き渡す前に、この手順を使用してください。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

想定される Chrome-node の状態:

- `googlemeet setup` がすべてグリーンであること。
- Chrome-node がデフォルト transport であるか、node が固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれること。
- `nodes status` に選択した node が接続済みとして表示されること。
- 選択した node が `googlemeet.chrome` と `browser.proxy` の両方を広告していること。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome health を返すこと。

Parallels macOS VM のようなリモート Chrome ホストでは、Gateway または VM を更新した後の最短の安全確認は次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際の会議タブを開く前に、Gateway Plugin がロードされていること、VM node が現在の token で接続されていること、および Meet オーディオブリッジが利用可能であることを確認できます。

Twilio smoke には、電話ダイヤルイン詳細を公開している会議を使用してください。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

想定される Twilio の状態:

- `googlemeet setup` にグリーンの `twilio-voice-call-plugin` と
  `twilio-voice-call-credentials` チェックが含まれること。
- Gateway の再読み込み後に CLI で `voicecall` が利用可能であること。
- 返されるセッションに `transport: "twilio"` と `twilio.voiceCallId` があること。
- `googlemeet leave <sessionId>` で委譲された voice call が切断されること。

## トラブルシューティング

### エージェントが Google Meet ツールを参照できない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway を再読み込みしてください。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりなら、Gateway を再起動または再読み込みしてください。
実行中のエージェントが見えるのは、現在の Gateway
process に登録されている Plugin ツールだけです。

### 接続済みの Google Meet 対応 node がない

node ホスト上で次を実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホスト上で、node を承認してコマンドを確認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node は接続されていて、`googlemeet.chrome` と `browser.proxy` を一覧表示している必要があります。
Gateway 設定ではそれらの node コマンドを許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` で `chrome-node-connected` が失敗するか、Gateway ログに
`gateway token mismatch` が表示される場合は、現在の Gateway
token で node を再インストールまたは再起動してください。LAN Gateway では通常、次のようになります。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、node サービスを再読み込みして次を再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くがエージェントが参加できない

`googlemeet test-speech` を実行して、返される Chrome health を確認してください。
`manualActionRequired: true` が報告された場合は、`manualActionMessage` をオペレーターに表示し、
ブラウザー操作が完了するまで再試行を止めてください。

一般的な手動操作:

- Chrome プロファイルにサインインする。
- Meet ホストアカウントから guest を承認する。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome にマイク / カメラ権限を付与する。
- 固まった Meet 権限ダイアログを閉じるか修復する。

Meet に「Do you want people to hear you in the meeting?」と表示されているだけで「サインインしていない」と報告しないでください。これは Meet のオーディオ選択インタースティシャルです。OpenClaw は利用可能な場合、
ブラウザー自動化で **Use microphone** をクリックし、実際の会議状態になるまで待機を続けます。作成専用のブラウザーフォールバックでは、
URL 作成に realtime オーディオ経路は不要なため、OpenClaw は **Continue without microphone** をクリックすることがあります。

### 会議作成に失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合は最初に Google Meet API の `spaces.create` endpoint を使用します。
OAuth 認証情報がない場合は、固定された Chrome node ブラウザーにフォールバックします。次を確認してください。

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されているか、
  対応する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在すること。
- API 作成の場合: refresh token が create サポート追加後に発行されたものであること。
  古い token には `meetings.space.created` スコープがない可能性があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新してください。
- ブラウザーフォールバックの場合: `defaultTransport: "chrome-node"` と
  `chromeNode.node` が、`browser.proxy` と
  `googlemeet.chrome` を持つ接続済み node を指していること。
- ブラウザーフォールバックの場合: その node 上の OpenClaw Chrome プロファイルが Google にサインイン済みで、
  `https://meet.google.com/new` を開けること。
- ブラウザーフォールバックの場合: 再試行では、新しいタブを開く前に既存の `https://meet.google.com/new`
  または Google アカウントプロンプトタブを再利用すること。エージェントがタイムアウトした場合は、
  別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行してください。
- ブラウザーフォールバックの場合: ツールが `manualActionRequired: true` を返したら、
  返された `browser.nodeId`、`browser.targetId`、`browserUrl`、および
  `manualActionMessage` を使ってオペレーターを案内してください。その
  操作が完了するまでループで再試行しないでください。
- ブラウザーフォールバックの場合: Meet に「Do you want people to hear you in the
  meeting?」が表示されたら、そのタブは開いたままにしてください。OpenClaw は
  ブラウザー自動化で **Use microphone**、または作成専用フォールバックでは **Continue without microphone** をクリックして、
  生成された Meet URL の待機を続けるはずです。それができない場合、エラーには
  `google-login-required` ではなく `meet-audio-choice-required` が記載されるはずです。

### エージェントは参加するが話さない

realtime 経路を確認してください。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

listen/talk-back には `mode: "realtime"` を使用してください。`mode: "transcribe"` は意図的に
双方向 realtime voice bridge を開始しません。

あわせて次も確認してください。

- `OPENAI_API_KEY` や `GEMINI_API_KEY` などの realtime provider key が Gateway ホスト上で利用可能であること。
- Chrome ホスト上で `BlackHole 2ch` が見えていること。
- Chrome ホスト上で `rec` と `play` が存在すること。
- Meet のマイクとスピーカーが OpenClaw の使用する仮想オーディオ経路にルーティングされていること。

`googlemeet doctor [session-id]` はセッション、node、in-call 状態、
手動操作理由、realtime provider 接続、`realtimeReady`、オーディオ
入出力アクティビティ、最後のオーディオタイムスタンプ、バイトカウンター、およびブラウザー URL を表示します。
生の JSON が必要な場合は `googlemeet status [session-id]` を使用してください。
token を公開せずに Google Meet OAuth refresh を確認する必要がある場合は `googlemeet doctor --oauth` を使用し、
Google Meet API の確認も必要なら `--meeting` または `--create-space` を追加してください。

エージェントがタイムアウトし、すでに Meet タブが開いているのが見える場合は、
別のタブを開かずにそのタブを調べてください。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

対応するツールアクションは `recover_current_tab` です。これは選択された transport の既存 Meet タブにフォーカスして調査します。`chrome` では Gateway 経由のローカル
ブラウザー制御を使用し、`chrome-node` では設定済み
Chrome node を使用します。新しいタブを開いたり新しいセッションを作成したりはせず、
ログイン、承認、権限、またはオーディオ選択状態などの現在のブロッカーを報告します。
CLI コマンドは設定済み Gateway と通信するため、Gateway は実行中である必要があります。
`chrome-node` では Chrome node の接続も必要です。

### Twilio のセットアップチェックに失敗する

`twilio-voice-call-plugin` は `voice-call` が許可されていないか有効でない場合に失敗します。
これを `plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、
Gateway を再読み込みしてください。

`twilio-voice-call-credentials` は Twilio バックエンドに account
SID、auth token、または caller number がない場合に失敗します。Gateway ホストで次を設定してください。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

その後、Gateway を再起動または再読み込みして次を実行します。

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトで準備確認のみです。特定の番号に対する dry-run を行うには:

```bash
openclaw voicecall smoke --to "+15555550123"
```

実際にライブの発信通知通話を行いたい場合にのみ `--yes` を付けてください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は始まるが会議に入れない

Meet event が電話ダイヤルイン詳細を公開していることを確認してください。正確なダイヤルイン
番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

provider が PIN 入力前に待機を必要とする場合は、`--dtmf-sequence` に先頭の `w` またはカンマを使用してください。

## 注記

Google Meet の公式 media API は受信指向のため、Meet
通話に向かって話すには依然として participant 経路が必要です。このPluginはその境界を明示したままにします。
Chrome はブラウザー参加とローカルオーディオルーティングを処理し、Twilio は
電話ダイヤルイン参加を処理します。

Chrome realtime モードには次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw が
  realtime model bridge を所有し、それらの
  コマンドと選択された realtime voice provider の間で 8 kHz G.711 mu-law オーディオをパイプします。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル
  オーディオ経路全体を所有し、その daemon の開始または検証後に終了する必要があります。

クリーンな双方向音声のために、Meet 出力と Meet マイクは別々の
仮想デバイスまたは Loopback 風の仮想デバイスグラフにルーティングしてください。共有の
単一 BlackHole デバイスでは、他の参加者の音声が会議にエコーして戻ることがあります。

`googlemeet speak` は Chrome
セッションのアクティブな realtime オーディオブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin 経由で委譲された Twilio セッションでは、
`leave` は基盤の voice call も切断します。

## 関連

- [Voice call plugin](/ja-JP/plugins/voice-call)
- [Talk mode](/ja-JP/nodes/talk)
- [Building plugins](/ja-JP/plugins/building-plugins)
