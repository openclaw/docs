---
read_when:
    - OpenClaw エージェントを Google Meet の通話に参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成させたい
    - Google Meet トランスポートとして Chrome、Chrome ノード、または Twilio を設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、エージェントの音声応答の既定値を使用'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T07:03:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 参加者サポート for OpenClaw — この Plugin は設計上、明示的に動作します。

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、返された URL に参加できます。
- `agent` はデフォルトの応答モードです。リアルタイム文字起こしが聞き取り、設定済みの OpenClaw エージェントが応答し、通常の OpenClaw TTS が Meet に音声を送ります。
- `bidi` は、フォールバックの直接リアルタイム音声モデルモードとして引き続き利用できます。
- エージェントは `mode` で参加動作を選びます。ライブの聞き取り/応答には `agent`、直接リアルタイム音声フォールバックには `bidi`、応答ブリッジなしでブラウザに参加/制御するには `transcribe` を使います。
- 認証は個人の Google OAuth、またはすでにサインイン済みの Chrome プロファイルから始まります。
- 自動の同意アナウンスはありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカルでも、ペアリング済みの Node ホスト上でも実行できます。
- Twilio はダイヤルイン番号に加えて任意の PIN または DTMF シーケンスを受け付けます。Meet URL に直接ダイヤルすることはできません。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、リアルタイム文字起こしプロバイダーと通常の OpenClaw TTS を設定します。OpenAI はデフォルトの文字起こしプロバイダーです。Google Gemini Live も、`realtime.voiceProvider: "google"` を使う別個の `bidi` 音声フォールバックとして動作します。

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

セットアップ出力は、エージェントが読める形式で、モードを考慮するようになっています。Chrome プロファイル、Node の固定、そしてリアルタイム Chrome 参加では BlackHole/SoX 音声ブリッジと遅延リアルタイム導入チェックを報告します。観察専用の参加では、同じトランスポートを `--mode transcribe` で確認してください。このモードはブリッジを通じて聞いたり話したりしないため、リアルタイム音声の前提条件をスキップします。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin、Twilio 認証情報、公開 Webhook 露出が準備できているかも報告します。エージェントに参加を依頼する前に、`ok: false` のチェックは、そのチェック対象のトランスポートとモードに対するブロッカーとして扱ってください。スクリプトや機械可読出力には `openclaw googlemeet setup --json` を使います。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使います。

Twilio では、デフォルトトランスポートが Chrome の場合、必ずトランスポートを明示的に事前確認します。

```bash
openclaw googlemeet setup --transport twilio
```

これにより、エージェントが会議にダイヤルしようとする前に、不足している `voice-call` 配線、Twilio 認証情報、または到達不能な Webhook 露出を検出できます。

会議に参加します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `google_meet` ツール経由で参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

エージェント向けの `google_meet` ツールは、macOS 以外のホストでも、成果物、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node` フローで引き続き利用できます。ローカル Chrome の応答アクションは、同梱の Chrome 音声パスが現在 macOS の `BlackHole 2ch` に依存しているため、そこではブロックされます。Linux では、Chrome の応答参加に `mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使ってください。

新しい会議を作成して参加します。

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API で作成したルームについて、Google アカウントのデフォルトから継承するのではなく、ルームのノック不要ポリシーを明示したい場合は Google Meet `SpaceConfig.accessType` を使います。

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` では、Meet URL を持つ誰でもノックなしで参加できます。`TRUSTED` では、ホスト組織の信頼済みユーザー、招待済みの外部ユーザー、ダイヤルインユーザーがノックなしで参加できます。`RESTRICTED` では、ノック不要の入室が招待者に限定されます。これらの設定は公式の Google Meet API 作成パスにのみ適用されるため、OAuth 認証情報を設定する必要があります。

このオプションが利用可能になる前に Google Meet を認証した場合は、Google OAuth 同意画面に `meetings.space.settings` スコープを追加した後で `openclaw googlemeet auth login --json` を再実行してください。

参加せずに URL だけを作成します。

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2 つのパスがあります。

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使われます。これは最も決定的なパスで、ブラウザ UI 状態に依存しません。
- ブラウザフォールバック: OAuth 認証情報がない場合に使われます。OpenClaw は固定された Chrome Node を使い、`https://meet.google.com/new` を開き、Google が実際の会議コード URL にリダイレクトするのを待ってから、その URL を返します。このパスでは、Node 上の OpenClaw Chrome プロファイルがすでに Google にサインインしている必要があります。ブラウザ自動化は Meet 自体の初回マイクプロンプトを処理します。そのプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` などの無害な URL クエリ文字列を無視するため、エージェントの再試行は 2 つ目の Chrome タブを作成するのではなく、すでに開いている会議にフォーカスするはずです。

コマンド/ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、エージェントはどちらのパスが使われたかを説明できます。`create` はデフォルトで新しい会議に参加し、`joined: true` と参加セッションを返します。URL だけを発行するには、CLI で `create --no-join` を使うか、ツールに `"join": false` を渡します。

または、エージェントに「Google Meet を作成し、エージェント応答モードで参加して、リンクを送って」と伝えます。エージェントは `action: "create"` で `google_meet` を呼び出し、返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

観察専用/ブラウザ制御の参加では、`"mode": "transcribe"` を設定します。これは双方向リアルタイム音声ブリッジを開始せず、BlackHole や SoX を必要とせず、会議に応答音声を返しません。このモードでの Chrome 参加は、OpenClaw のマイク/カメラ権限付与と Meet の **マイクを使用** パスも回避します。Meet が音声選択インタースティシャルを表示した場合、自動化はマイクなしパスを試み、それができない場合はローカルマイクを開くのではなく手動操作を報告します。transcribe モードでは、管理対象 Chrome トランスポートもベストエフォートの Meet キャプション監視をインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、短い `recentTranscript` 末尾を表示するため、オペレーターはブラウザが通話に参加したか、Meet キャプションがテキストを生成しているかを判断できます。
はい/いいえのプローブが必要な場合は、`openclaw googlemeet test-listen <meet-url> --transport chrome-node` を使ってください。これは transcribe モードで参加し、新しいキャプションまたは文字起こしの動きを待ち、`listenVerified`、`listenTimedOut`、手動操作フィールド、最新のキャプション健全性を返します。

リアルタイムセッション中、`google_meet` のステータスには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後の入力/出力タイムスタンプ、バイトカウンター、ブリッジのクローズ状態など、ブラウザと音声ブリッジの健全性が含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザ自動化は可能なときにそれを処理します。ログイン、ホスト承認、ブラウザ/OS 権限プロンプトは、エージェントが伝えられる理由とメッセージ付きの手動操作として報告されます。管理対象 Chrome セッションは、ブラウザの健全性が `inCall: true` を報告した後にのみ導入文やテストフレーズを出力します。それ以外の場合、ステータスは `speechReady: false` を報告し、エージェントが会議に話したふりをするのではなく発話試行をブロックします。

ローカル Chrome は、サインイン済みの OpenClaw ブラウザプロファイルを通じて参加します。リアルタイムモードでは、OpenClaw が使うマイク/スピーカーパスに `BlackHole 2ch` が必要です。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback スタイルのグラフを使います。最初のスモークテストには単一の BlackHole デバイスで十分ですが、エコーする可能性があります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を所有させるだけなら、macOS VM 内に完全な OpenClaw Gateway やモデル API キーは必要ありません。Gateway とエージェントはローカルで実行し、VM 内で Node ホストを実行します。VM 上で同梱 Plugin を一度有効にして、Node が Chrome コマンドを広告するようにします。

どこで何を実行するか:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API キー、リアルタイムプロバイダー、Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/Node ホスト、Google Chrome、SoX、BlackHole 2ch、Google にサインイン済みの Chrome プロファイル。
- VM で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、モデルプロバイダー設定。

VM 依存関係をインストールします。

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

VM に OpenClaw をインストールまたは更新し、そこで同梱 Plugin を有効にします。

```bash
openclaw plugins enable google-meet
```

VM 内で Node ホストを起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で TLS を使っていない場合、その信頼済みプライベートネットワークにオプトインしない限り、Node は平文 WebSocket を拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node を LaunchAgent としてインストールするときも同じ環境変数を使います。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` 設定ではありません。`openclaw node install` は、インストールコマンドに存在する場合、それを LaunchAgent 環境に保存します。

Gateway ホストから Node を承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が Node を認識し、`googlemeet.chrome` とブラウザ機能/`browser.proxy` の両方を広告していることを確認します。

```bash
openclaw nodes status
```

Gateway ホストで、その Node 経由に Meet をルーティングします。

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

これで Gateway ホストから通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `transport: "chrome-node"` で `google_meet` ツールを使うよう依頼します。

セッションを作成または再利用し、既知のフレーズを話し、セッション健全性を表示するワンコマンドのスモークテストは次のとおりです。

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、OpenClaw ブラウザー自動化はゲスト名を入力し、
「参加」/「参加をリクエスト」をクリックし、そのプロンプトが表示された場合は
Meet の初回実行時の「マイクを使用」選択を受け入れます。観察のみの参加またはブラウザーのみの会議作成中は、
同じプロンプトで、マイクなしの選択肢が利用可能な場合にそれを選んで続行します。
ブラウザープロファイルがサインインしていない、Meet がホストの承認を待っている、
リアルタイム参加のために Chrome がマイク/カメラ権限を必要としている、または Meet が
自動化で解決できないプロンプトで停止している場合、参加/test-speech の結果は
`manualActionRequired: true` を `manualActionReason` および
`manualActionMessage` とともに報告します。エージェントは参加の再試行を停止し、
その正確なメッセージと現在の `browserUrl`/`browserTitle` を報告し、手動のブラウザー操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` が省略された場合、OpenClaw は、接続済みノードがちょうど 1 つだけ
`googlemeet.chrome` とブラウザー制御の両方を広告している場合にのみ自動選択します。
対応可能なノードが複数接続されている場合は、`chromeNode.node` をノード ID、
表示名、またはリモート IP に設定します。

一般的な失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway に認識されていますが利用できません。エージェントはそのノードを
  利用可能な Chrome ホストではなく診断状態として扱い、ユーザーが要求していない限り
  別のトランスポートへフォールバックせずにセットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM 内で `openclaw node run` を開始し、
  ペアリングを承認し、VM 内で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認します。また、
  Gateway ホストが `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  で両方のノードコマンドを許可していることも確認します。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch`
  をインストールし、ローカル Chrome 音声を使う前に再起動します。
- `BlackHole 2ch audio device not found on the node`: VM 内に `blackhole-2ch`
  をインストールし、VM を再起動します。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにします。ゲストの自動参加は、
  ノードのブラウザープロキシ経由で OpenClaw ブラウザー自動化を使用します。ノードのブラウザー設定が、
  目的のプロファイルを指していることを確認してください。例:
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイル。
- Meet タブが重複する: `chrome.reuseExistingTab: true` を有効のままにします。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブ化し、ブラウザーによる会議作成では、
  別のタブを開く前に進行中の `https://meet.google.com/new`
  または Google アカウントプロンプトのタブを再利用します。
- 音声がない: Meet で、マイク/スピーカーを OpenClaw が使用する仮想音声デバイスパスにルーティングします。
  クリーンな双方向音声には、個別の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールメモ

Chrome のトークバック既定値は 2 つの外部ツールを使用します:

- `sox`: コマンドライン音声ユーティリティ。Plugin は、既定の 24 kHz PCM16 音声ブリッジに明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想音声ドライバー。Chrome/Meet が経由してルーティングできる `BlackHole 2ch`
  音声デバイスを作成します。

OpenClaw はどちらのパッケージもバンドルまたは再配布しません。ドキュメントでは、ユーザーに
Homebrew 経由でホスト依存関係としてインストールするよう案内しています。SoX は
`LGPL-2.0-only AND GPL-2.0-only` としてライセンスされ、BlackHole は GPL-3.0 です。BlackHole を OpenClaw と一緒にバンドルする
インストーラーまたはアプライアンスを構築する場合は、BlackHole のアップストリームライセンス条件を確認するか、
Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは、OpenClaw ブラウザー制御を通じて Meet URL を開き、
サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin は起動前に
`BlackHole 2ch` を確認します。設定されている場合、Chrome を開く前に音声ブリッジの
ヘルスコマンドと起動コマンドも実行します。Chrome/音声が Gateway ホスト上にある場合は `chrome` を使用し、
Chrome/音声が Parallels macOS VM などのペアリング済みノード上にある場合は `chrome-node` を使用します。
ローカル Chrome では `browser.defaultProfile` でプロファイルを選択します。
`chrome.browserProfile` は `chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクおよびスピーカー音声をローカル OpenClaw 音声ブリッジ経由でルーティングします。
`BlackHole 2ch` がインストールされていない場合、音声パスなしで黙って参加するのではなく、
セットアップエラーで参加が失敗します。

### Twilio

Twilio トランスポートは、Voice Call Plugin に委譲される厳密なダイヤルプランです。
電話番号を取得するために Meet ページを解析しません。

Chrome 参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。
Google Meet は、その会議用の電話ダイヤルイン番号と PIN を公開している必要があります。
OpenClaw は Meet ページからそれらを検出しません。

Voice Call Plugin は Chrome ノードではなく Gateway ホストで有効化します:

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
`openclaw.json` の外に保てます:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

リアルタイム音声プロバイダーが OpenAI の場合は、代わりに OpenAI provider Plugin と
`OPENAI_API_KEY` で `realtime.provider: "openai"` を使用します。

`voice-call` を有効化した後は Gateway を再起動または再読み込みしてください。Plugin 設定の変更は、
再読み込みされるまで、すでに実行中の Gateway プロセスには反映されません。

次に検証します:

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

会議にカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth と事前確認

OAuth は `googlemeet create` がブラウザー自動化にフォールバックできるため、Meet リンク作成には任意です。
公式 API による作成、スペース解決、または Meet Media API の事前確認が必要な場合に OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープを要求し、Google アカウントを承認してから、結果のリフレッシュトークンを
Google Meet Plugin 設定に保存するか、`OPENCLAW_GOOGLE_MEET_*` 環境変数を提供します。

OAuth は Chrome 参加パスを置き換えるものではありません。Chrome および Chrome-node トランスポートは、
ブラウザー参加を使用する場合、引き続きサインイン済み Chrome プロファイル、BlackHole/SoX、
接続済みノードを通じて参加します。OAuth は公式 Google Meet API パス専用です:
会議スペースの作成、スペースの解決、Meet Media API 事前確認の実行。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効化します。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テストセットアップで機能します。アプリが Testing の間は、
     アプリを承認する各 Google アカウントをテストユーザーとして追加します。
4. OpenClaw が要求するスコープを追加します:
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
`meetings.space.settings` により、OpenClaw は API ルーム作成時に `accessType` などの
`SpaceConfig` 設定を渡せます。
`meetings.conference.media.readonly` は Meet Media API の事前確認とメディア作業用です。
実際の Media API 使用には、Google が Developer Preview への登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略してください。

### リフレッシュトークンを発行する

`oauth.clientId` と必要に応じて `oauth.clientSecret` を設定するか、環境変数として渡してから実行します:

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。PKCE、
`http://localhost:8085/oauth2callback` の localhost コールバック、および `--manual` による手動コピー/貼り付けフローを使用します。

例:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ブラウザーがローカルコールバックに到達できない場合は手動モードを使用します:

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

リフレッシュトークンを設定に入れたくない場合は、環境変数を優先してください。
設定値と環境値の両方が存在する場合、Plugin はまず設定を解決し、その後に環境へフォールバックします。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、および Meet
会議メディア読み取りアクセスが含まれます。会議作成サポートが存在する前に認証した場合は、
リフレッシュトークンに `meetings.space.created` スコープを持たせるため、
`openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を検証する

高速でシークレットを出力しないヘルスチェックが必要な場合は OAuth doctor を実行します:

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済み Chrome ノードも必要としません。
OAuth 設定が存在すること、およびリフレッシュトークンでアクセストークンを発行できることを確認します。
JSON レポートには `ok`、`configured`、`tokenSource`、`expiresAt`、
チェックメッセージなどのステータスフィールドのみが含まれ、アクセストークン、
リフレッシュトークン、クライアントシークレットは出力されません。

一般的な結果:

| チェック             | 意味                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` に加えて `oauth.refreshToken`、またはキャッシュ済みアクセス トークンが存在します。       |
| `oauth-token`        | キャッシュ済みアクセス トークンがまだ有効であるか、リフレッシュ トークンが新しいアクセス トークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                             |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                               |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用のある作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効になっていること、および認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存の会議スペースへの読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済み Google アカウントがアクセスできる既存スペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効になっている、同意済みリフレッシュ トークンに必要なスコープがない、または Google アカウントがその Meet スペースにアクセスできないことを意味します。リフレッシュ トークン エラーは、`openclaw googlemeet auth login --json` を再実行して新しい `oauth` ブロックを保存する必要があることを意味します。

ブラウザー フォールバックには OAuth 認証情報は不要です。このモードでは、Google 認証は OpenClaw config ではなく、選択したノードでサインイン済みの Chrome プロファイルから取得されます。

これらの環境変数はフォールバックとして受け付けられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

Meet URL、コード、または `spaces/{id}` を `spaces.get` 経由で解決します。

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア作業の前に preflight を実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が conference record を作成した後に、会議アーティファクトと出席状況を一覧表示します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` は既定で最新の conference record を使用します。その会議の保持されているすべての record が必要な場合は `--all-conference-records` を渡します。

Calendar lookup は、Meet アーティファクトを読み取る前に Google Calendar から会議 URL を解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Google Meet リンクを持つ Calendar イベントを今日の `primary` カレンダーから検索します。イベント テキストの一致を検索するには `--event <query>` を、非プライマリ カレンダーには `--calendar <id>` を使用します。Calendar lookup には、Calendar events readonly スコープを含む新しい OAuth ログインが必要です。
`calendar-events` は一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントを示します。

conference record id がすでに分かっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

通話後に room を閉じたい場合は、API で作成されたスペースのアクティブな conference を終了します。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

これは Google Meet `spaces.endActiveConference` を呼び出し、認可済みアカウントが管理できるスペースに対して `meetings.space.created` スコープを持つ OAuth が必要です。OpenClaw は Meet URL、会議コード、または `spaces/{id}` 入力を受け付け、アクティブな conference を終了する前に API スペース リソースへ解決します。
これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止しますが、`end-active-conference` は Google Meet にそのスペースのアクティブな conference の終了を依頼します。

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

`artifacts` は、Google がその会議に対して公開している場合、conference record メタデータに加えて、参加者、録画、文字起こし、構造化された transcript-entry、smart-note リソース メタデータを返します。大規模な会議で entry lookup をスキップするには `--no-transcript-entries` を使用します。`attendance` は参加者を participant-session 行に展開し、初回/最終表示時刻、合計セッション時間、遅刻/早退フラグ、およびサインイン ユーザーまたは表示名でマージされた重複参加者リソースを含めます。生の参加者リソースを分離したままにするには `--no-merge-duplicates` を、遅刻検出を調整するには `--late-after-minutes` を、早退検出を調整するには `--early-before-minutes` を渡します。

`export` は `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。
`manifest.json` は、選択された入力、エクスポート オプション、conference record、出力ファイル、件数、トークン ソース、使用された場合の Calendar イベント、および部分的な取得警告を記録します。フォルダーの横にポータブル アーカイブも書き出すには `--zip` を渡します。リンクされた文字起こしと smart-note Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには `--include-doc-bodies` を渡します。これには Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` なしの場合、エクスポートには Meet メタデータと構造化された transcript entry のみが含まれます。Google が smart-note listing、transcript-entry、Drive document-body エラーなどの部分的なアーティファクト失敗を返した場合、summary と manifest はエクスポート全体を失敗させずに警告を保持します。
フォルダーや ZIP を作成せずに同じ artifact/attendance データを取得し、manifest JSON を出力するには `--dry-run` を使用します。これは、大きなエクスポートを書き出す前や、エージェントが件数、選択された record、警告のみを必要とする場合に便利です。

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

エクスポート manifest のみを返し、ファイル書き込みをスキップするには `"dryRun": true` を設定します。

エージェントは明示的なアクセス ポリシーを持つ API-backed room も作成できます。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

また、既知の room のアクティブな conference を終了できます。

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

listen-first 検証では、エージェントは会議が有用だと主張する前に `test_listen` を使用する必要があります。

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

実際に保持されている会議に対して、ガード付き live smoke を実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Meet captions が利用可能で、誰かが発話する会議に対して、live listen-first ブラウザー probe を実行します。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke 環境:

- `OPENCLAW_LIVE_TEST=1` はガード付き live tests を有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は保持されている Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth
  client id を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は
  refresh token を提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は `OPENCLAW_` prefix なしの同じフォールバック名を使用します。

基本の artifact/attendance live smoke には
`https://www.googleapis.com/auth/meetings.space.readonly` と
`https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar lookup には `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive document-body export には
`https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します。

```bash
openclaw googlemeet create
```

このコマンドは新しい `meeting uri`、ソース、join session を出力します。OAuth 認証情報がある場合は、公式の Google Meet API を使用します。OAuth 認証情報がない場合は、ピン留めされた Chrome ノードのサインイン済みブラウザー プロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定した `google_meet` ツールを使用して、1 ステップで作成して参加できます。URL の作成のみを行う場合は、`"join": false` を渡します。

ブラウザー フォールバックからの JSON 出力例:

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

ブラウザー フォールバックが URL を作成する前に Google ログインまたは Meet 権限ブロッカーに遭遇した場合、Gateway メソッドは失敗したレスポンスを返し、`google_meet` ツールはプレーンな文字列ではなく構造化された詳細を返します。

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

エージェントが `manualActionRequired: true` を確認した場合は、`manualActionMessage` とブラウザーの node/tab コンテキストを報告し、オペレーターがブラウザー手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

API create からの JSON 出力例:

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

Meet を作成すると、デフォルトで参加します。Chrome または Chrome-node トランスポートでブラウザー経由で参加するには、ログイン済みの Google Chrome プロファイルが引き続き必要です。プロファイルがログアウト状態の場合、OpenClaw は `manualActionRequired: true` またはブラウザーのフォールバックエラーを報告し、再試行する前にオペレーターへ Google ログインの完了を求めます。

Cloud プロジェクト、OAuth プリンシパル、会議参加者が Meet media APIs 向け Google Workspace Developer Preview Program に登録されていることを確認した後でのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

共通の Chrome エージェントパスに必要なのは、Plugin の有効化、BlackHole、SoX、リアルタイム文字起こしプロバイダーキー、設定済みの OpenClaw TTS プロバイダーだけです。OpenAI がデフォルトの文字起こしプロバイダーです。デフォルトのエージェントモード文字起こしプロバイダーを変更せずに、`bidi` モードで Google Gemini Live を使用するには、`realtime.voiceProvider` を `"google"` に、`realtime.model` を設定します。

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
- `defaultMode: "agent"`（`"realtime"` は `"agent"` のレガシー互換エイリアスとしてのみ受け付けられます。新しいツール呼び出しでは `"agent"` と指定してください）
- `chromeNode.node`: `chrome-node` 用の任意のノード id/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ログアウト状態の Meet ゲスト画面で使われる名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザー自動化による、ベストエフォートのゲスト名入力と Join Now クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに、既存の Meet タブをアクティブ化します
- `chrome.waitForInCallMs: 20000`: トークバックのイントロがトリガーされる前に、Meet タブが通話中を報告するまで待機します
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペアの音声形式。まだ電話音声を出力するレガシー/カスタムのコマンドペアでのみ `"g711-ulaw-8khz"` を使用してください。
- `chrome.audioBufferBytes: 4096`: 生成された Chrome コマンドペア音声コマンド用の SoX 処理バッファーです。これは SoX のデフォルト 8192 バイトバッファーの半分で、ビジーなホストで増やす余地を残しつつ、デフォルトのパイプレイテンシーを減らします。SoX の最小値を下回る値は 17 バイトにクランプされます。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` で音声を書き込む SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` で音声を読み取り、CoreAudio `BlackHole 2ch` に書き込む SoX コマンド
- `chrome.bargeInInputCommand`: アシスタント再生がアクティブな間の人間による割り込み検出のために、符号付き 16 ビットリトルエンディアンのモノラル PCM を書き込む任意のローカルマイクコマンドです。これは現在、Gateway でホストされる `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` で人間の割り込みとして扱う RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` で人間の割り込みとして扱うピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返される人間の割り込みクリア間の最小遅延
- `mode: "agent"`: デフォルトのトークバックモードです。参加者の発話は、設定済みのリアルタイム文字起こしプロバイダーによって文字起こしされ、会議ごとのサブエージェントセッション内の設定済み OpenClaw エージェントに送信され、通常の OpenClaw TTS ランタイムを通じて読み上げられます。
- `mode: "bidi"`: フォールバックの直接双方向リアルタイムモデルモードです。リアルタイム音声プロバイダーが参加者の発話に直接応答し、より深い/ツール支援の回答には `openclaw_agent_consult` を呼び出すことがあります。
- `mode: "transcribe"`: トークバックブリッジなしの観察専用モードです。
- `realtime.provider: "openai"`: 下記のスコープ付きプロバイダーフィールドが未設定の場合に使われる互換フォールバックです。
- `realtime.transcriptionProvider: "openai"`: `agent` モードがリアルタイム文字起こしに使うプロバイダー id です。
- `realtime.voiceProvider`: `bidi` モードが直接リアルタイム音声に使うプロバイダー id です。エージェントモードの文字起こしを OpenAI のままにしながら Gemini Live を使用するには、これを `"google"` に設定します。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 短い音声応答。より深い回答には `openclaw_agent_consult` を使用します
- `realtime.introMessage`: リアルタイムブリッジ接続時の短い音声準備確認。無音で参加するには `""` に設定します
- `realtime.agentId`: `openclaw_agent_consult` 用の任意の OpenClaw エージェント id。デフォルトは `main`

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
        voice: "Kore",
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
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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

永続的な Meet 音声は `messages.tts.providers.elevenlabs.voiceId` から取得されます。TTS モデルの上書きが有効な場合、エージェント応答では返信ごとの `[[tts:voiceId=... model=eleven_v3]]` ディレクティブも使用できますが、会議では設定が決定的なデフォルトです。参加時には、ログに `transcriptionProvider=elevenlabs` が表示され、読み上げられた各応答で `provider=elevenlabs model=eleven_v3 voice=<voiceId>` がログ出力されるはずです。

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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委譲します。Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存されたイントロテキストを最初のリアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話を発信することはできません。

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

Chrome が Gateway ホスト上で実行される場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノード上で実行される場合は `transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと `openclaw_agent_consult` は Gateway ホスト上で実行されるため、モデル認証情報はそこに保持されます。デフォルトの `mode: "agent"` では、リアルタイム文字起こしプロバイダーがリスニングを処理し、設定済みの OpenClaw エージェントが回答を生成し、通常の OpenClaw TTS がそれを Meet に読み上げます。リアルタイム音声モデルに直接回答させたい場合は `mode: "bidi"` を使用します。生の `mode: "realtime"` は `mode: "agent"` のレガシー互換エイリアスとして引き続き受け付けられますが、エージェントツールスキーマではもう公開されていません。エージェントモードのログには、ブリッジ起動時に解決された文字起こしプロバイダー/モデルと、合成された各応答後の TTS プロバイダー、モデル、音声、出力形式、サンプルレートが含まれます。

アクティブなセッション一覧を表示する、またはセッション ID を調べるには `action: "status"` を使用します。リアルタイムエージェントに即座に発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` ヘルスを返すには `action: "test_speech"` を使用します。`test_speech` は常に `mode: "agent"` を強制し、観察専用セッションは意図的に発話を出力できないため、`mode: "transcribe"` で実行するよう求められると失敗します。その `speechOutputVerified` 結果は、このテスト呼び出し中にリアルタイム音声出力バイト数が増加したかどうかに基づくため、古い音声がある再利用セッションは新しい発話成功チェックとしては数えられません。セッションを終了済みとしてマークするには `action: "leave"` を使用します。

利用可能な場合、`status` には Chrome ヘルスが含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見えます
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話を機能させる前に、ブラウザープロファイルに手動ログイン、Meet ホストの承認、権限、またはブラウザー制御の修復が必要です
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome 発話が現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを音声ブリッジへ送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に見られた、またはブリッジへ送信された音声
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet タブのメディア出力が、ブリッジで使われる BlackHole デバイスへ能動的にルーティングされたかどうか
- `lastSuppressedInputAt` / `suppressedInputBytes`: アシスタント再生がアクティブな間に無視されたループバック入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## エージェントと Bidi モード

Chrome `agent` モードは、「自分のエージェントが会議にいる」動作に最適化されています。リアルタイム文字起こしプロバイダーが会議音声を聞き取り、参加者の最終トランスクリプトは設定済みの OpenClaw エージェントへルーティングされ、回答は通常の OpenClaw TTS ランタイムを通じて読み上げられます。リアルタイム音声モデルに直接回答させたい場合は `mode: "bidi"` を設定します。近接した最終トランスクリプト断片は consult の前に結合されるため、1 つの発話ターンが複数の古い部分回答を生むことはありません。キューされたアシスタント音声がまだ再生中の間はリアルタイム入力も抑制され、エージェント consult の前には最近のアシスタントらしいトランスクリプトエコーが無視されるため、BlackHole ループバックによってエージェントが自分自身の発話に回答することはありません。

| モード  | 誰が回答を決めるか              | 音声出力パス                         | 使用する場面                                                |
| ------- | ------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `agent` | 設定済みの OpenClaw エージェント | 通常の OpenClaw TTS ランタイム       | 「自分のエージェントが会議にいる」動作が必要な場合          |
| `bidi`  | リアルタイム音声モデル          | リアルタイム音声プロバイダーの音声応答 | 最低レイテンシーの会話型音声ループが必要な場合              |

`bidi` モードでは、リアルタイムモデルがより深い推論、現在の情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出すことができます。

consult ツールは、最近の会議文字起こしコンテキストを使って通常の OpenClaw エージェントを背後で実行し、簡潔な音声回答を返します。`agent` モードでは、OpenClaw はその回答を TTS ランタイムへ直接送信します。`bidi` モードでは、リアルタイム音声モデルが consult 結果を会議内で読み上げられます。Voice Call と同じ共有 consult 機構を使用します。

デフォルトでは、consult は `main` エージェントに対して実行されます。Meet レーンが専用の OpenClaw エージェントワークスペース、モデルのデフォルト、ツールポリシー、メモリ、セッション履歴を consult する必要がある場合は、`realtime.agentId` を設定します。

エージェントモードの consult は、会議ごとの `agent:<id>:subagent:google-meet:<session>` セッションキーを使用するため、フォローアップ質問は会議コンテキストを維持しながら、設定済みエージェントの通常のエージェントポリシーを継承します。

`realtime.toolPolicy` は consult 実行を制御します。

- `safe-read-only`: consult ツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: consult ツールを公開し、通常のエージェントに通常のエージェントツールポリシーを使用させます。
- `none`: consult ツールをリアルタイム音声モデルに公開しません。

consult セッションキーは Meet セッションごとにスコープされるため、フォローアップの consult 呼び出しは同じ会議中に以前の consult コンテキストを再利用できます。

Chrome が通話に完全に参加した後、音声の準備完了チェックを強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全な参加して発話する smoke には:

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

想定される Chrome-node の状態:

- `googlemeet setup` がすべて緑です。
- Chrome-node がデフォルト transport であるか node が固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` に、選択された node が接続済みとして表示されます。
- 選択された node が `googlemeet.chrome` と `browser.proxy` の両方を通知します。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome ヘルスを返します。

Parallels macOS VM などのリモート Chrome ホストでは、Gateway または VM を更新した後の最短で安全なチェックは次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、Gateway Plugin が読み込まれていること、VM node が現在のトークンで接続されていること、エージェントが実際の会議タブを開く前に Meet 音声ブリッジが利用可能であることを確認できます。

Twilio smoke には、電話ダイヤルイン詳細を公開する会議を使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

想定される Twilio の状態:

- `googlemeet setup` に、緑の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。
- Gateway のリロード後、CLI で `voicecall` を利用できます。
- 返されたセッションに `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` に、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、初期グリーティングがキューに入ったリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` が委任された音声通話を切断します。

## トラブルシューティング

### エージェントが Google Meet ツールを認識できない

Plugin が Gateway 設定で有効化されていることを確認し、Gateway をリロードします。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動またはリロードします。実行中のエージェントは、現在の Gateway プロセスによって登録された Plugin ツールのみを認識します。

macOS 以外の Gateway ホストでは、エージェント向けの `google_meet` ツールは表示されたままですが、ローカル Chrome のトークバックアクションは音声ブリッジに到達する前にブロックされます。ローカル Chrome のトークバック音声は現在 macOS の `BlackHole 2ch` に依存しているため、Linux エージェントはデフォルトのローカル Chrome エージェントパスではなく、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用する必要があります。

### 接続済みの Google Meet 対応 node がない

node ホストで実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで、node を承認し、コマンドを確認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node は接続済みで、`googlemeet.chrome` と `browser.proxy` を一覧表示している必要があります。Gateway 設定では、それらの node コマンドを許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` で失敗する場合、または Gateway ログに `gateway token mismatch` が報告される場合は、現在の Gateway トークンで node を再インストールまたは再起動します。LAN Gateway では通常、これは次を意味します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、node サービスをリロードし、再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザは開くがエージェントが参加できない

観察専用の参加には `googlemeet test-listen` を、リアルタイム参加には `googlemeet test-speech` を実行し、その後返された Chrome ヘルスを確認します。どちらかのプローブが `manualActionRequired: true` を報告した場合は、`manualActionMessage` をオペレーターに表示し、ブラウザ操作が完了するまで再試行を停止します。

一般的な手動操作:

- Chrome プロファイルにサインインします。
- Meet ホストアカウントからゲストを許可します。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome のマイク/カメラ権限を付与します。
- 固まった Meet 権限ダイアログを閉じるか修復します。

Meet に「Do you want people to hear you in the meeting?」と表示されているだけで、「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は利用可能な場合、ブラウザ自動化を通じて **Use microphone** をクリックし、実際の会議状態を待ち続けます。作成専用のブラウザフォールバックでは、URL 作成にリアルタイム音声パスは不要なため、OpenClaw は **Continue without microphone** をクリックすることがあります。

### 会議作成が失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、まず Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合は、固定された Chrome node ブラウザにフォールバックします。確認事項:

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されているか、一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在します。
- API 作成の場合: refresh token は作成サポートが追加された後に発行されたものです。古いトークンには `meetings.space.created` スコープがない場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新します。
- ブラウザフォールバックの場合: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済み node を指しています。
- ブラウザフォールバックの場合: その node 上の OpenClaw Chrome プロファイルが Google にサインインしており、`https://meet.google.com/new` を開けます。
- ブラウザフォールバックの場合: 再試行は、新しいタブを開く前に既存の `https://meet.google.com/new` または Google アカウントプロンプトタブを再利用します。エージェントがタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行します。
- ブラウザフォールバックの場合: ツールが `manualActionRequired: true` を返した場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用してオペレーターを案内します。その操作が完了するまでループで再試行しないでください。
- ブラウザフォールバックの場合: Meet に「Do you want people to hear you in the meeting?」と表示されたら、タブを開いたままにします。OpenClaw はブラウザ自動化を通じて **Use microphone**、または作成専用フォールバックでは **Continue without microphone** をクリックし、生成された Meet URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### エージェントは参加するが話さない

リアルタイムパスを確認します。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

通常の STT -> OpenClaw エージェント -> TTS トークバックパスには `mode: "agent"` を使用し、直接リアルタイム音声フォールバックには `mode: "bidi"` を使用します。`mode: "transcribe"` は意図的にトークバックブリッジを開始しません。観察専用のデバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が true なのに `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、オブザーバーがインストールされてから誰も話していない、Meet UI が変更された、または会議の言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスを確認し、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け付けた可能性がありますが、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達するのを確認できませんでした。

次も確認します。

- `OPENAI_API_KEY` や `GEMINI_API_KEY` などのリアルタイムプロバイダーキーが Gateway ホストで利用可能です。
- `BlackHole 2ch` が Chrome ホストで表示されています。
- `sox` が Chrome ホストに存在します。
- Meet のマイクとスピーカーが OpenClaw で使用される仮想音声パスを通るようにルーティングされています。ローカル Chrome のリアルタイム参加では、`doctor` に `meet output routed: yes` が表示される必要があります。

`googlemeet doctor [session-id]` は、セッション、node、通話中状態、手動操作理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザ URL を出力します。生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用します。トークンを露出せずに Google Meet OAuth refresh を検証する必要がある場合は `googlemeet doctor --oauth` を使用します。Google Meet API の証明も必要な場合は `--meeting` または `--create-space` を追加します。

エージェントがタイムアウトし、Meet タブがすでに開いているのが見える場合は、別のタブを開かずにそのタブを確認します。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。選択された transport の既存の Meet タブにフォーカスして検査します。`chrome` では、Gateway 経由のローカルブラウザ制御を使用します。`chrome-node` では、設定済みの Chrome node を使用します。新しいタブを開いたり新しいセッションを作成したりはしません。ログイン、入室許可、権限、音声選択状態など、現在のブロッカーを報告します。CLI コマンドは設定済み Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では Chrome node も接続されている必要があります。

### Twilio セットアップチェックが失敗する

`voice-call` が許可されていない、または有効化されていない場合、`twilio-voice-call-plugin` は失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効化して、Gateway をリロードします。

Twilio バックエンドに account SID、auth token、または caller number がない場合、`twilio-voice-call-credentials` は失敗します。Gateway ホストでこれらを設定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` に公開 Webhook 露出がない場合、または `publicUrl` がループバックやプライベートネットワーク空間を指している場合、`twilio-voice-call-webhook` は失敗します。`plugins.entries.voice-call.config.publicUrl` を公開プロバイダー URL に設定するか、`voice-call` トンネル/Tailscale 露出を設定します。

ループバック URL とプライベート URL は、キャリア callback には有効ではありません。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。

安定した公開 URL には:

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

ローカル開発では、プライベートホスト URL ではなく、トンネルまたは Tailscale 公開を使用します。

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

`voicecall smoke` はデフォルトでは準備状況のみを確認します。特定の番号でドライランするには、次を実行します。

```bash
openclaw voicecall smoke --to "+15555550123"
```

ライブのアウトバウンド通知通話を発信する意図がある場合にのみ、`--yes` を追加します。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが、ミーティングに参加しない

Meet イベントで電話ダイヤルイン情報が公開されていることを確認します。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

プロバイダーが PIN 入力前の一時停止を必要とする場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

電話通話は作成されているのに Meet の参加者一覧にダイヤルイン参加者が表示されない場合:

- `openclaw googlemeet doctor <session-id>` を実行し、委任された Twilio 通話 ID、DTMF がキューに入ったかどうか、イントロのあいさつがリクエストされたかどうかを確認します。
- `openclaw voicecall status --call-id <id>` を実行し、通話がまだアクティブであることを確認します。
- `openclaw voicecall tail` を実行し、Twilio Webhook が Gateway に届いていることを確認します。
- `openclaw logs --follow` を実行し、Twilio Meet シーケンスを探します。Google Meet が参加を委任し、Voice Call が電話レッグを開始し、Google Meet が `voiceCall.dtmfDelayMs` 待機し、`voicecall.dtmf` で DTMF を送信し、`voiceCall.postDtmfSpeechDelayMs` 待機してから、`voicecall.speak` でイントロ音声をリクエストします。
- `openclaw googlemeet setup --transport twilio` を再実行します。セットアップチェックが緑であることは必須ですが、ミーティング PIN シーケンスが正しいことを証明するものではありません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合、または DTMF 送信後も通話トランスクリプトに PIN を求めるプロンプトが表示される場合は、`voiceCall.dtmfDelayMs` を増やします。
- 参加者は参加しているのにあいさつが聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` リクエストと、メディアストリーム TTS 再生または Twilio `<Say>` フォールバックを確認します。通話トランスクリプトにまだ「enter the meeting PIN」が含まれている場合、電話レッグはまだ Meet ルームに参加していないため、ミーティング参加者には音声が聞こえません。

Webhook が届かない場合は、まず Voice Call Plugin をデバッグします。プロバイダーが `plugins.entries.voice-call.config.publicUrl` または設定済みトンネルに到達できる必要があります。[Voice Call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## メモ

Google Meet の公式メディア API は受信指向であるため、Meet 通話で発話するには引き続き参加者経路が必要です。この Plugin はその境界を見える形に保ちます。Chrome はブラウザー参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome のトークバックモードには `BlackHole 2ch` と、次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がブリッジを所有し、`chrome.audioFormat` の音声をそれらのコマンドと選択されたプロバイダーの間でパイプします。エージェントモードはリアルタイム文字起こしと通常の TTS を使用し、bidi モードはリアルタイム音声プロバイダーを使用します。デフォルトの Chrome パスは、`chrome.audioBufferBytes: 4096` の 24 kHz PCM16 です。8 kHz G.711 mu-law は、レガシーのコマンドペア向けに引き続き使用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声パス全体を所有し、そのデーモンの起動または検証後に終了する必要があります。これは `bidi` でのみ有効です。`agent` モードでは TTS のためにコマンドペアへの直接アクセスが必要なためです。

エージェントモードでエージェントが `google_meet` ツールを呼び出すと、ミーティングコンサルタントセッションは参加者の発話に応答する前に、呼び出し元の現在のトランスクリプトをフォークします。Meet セッションは引き続き別個のままです (`agent:<agentId>:subagent:google-meet:<sessionId>`)。そのため、ミーティングのフォローアップが呼び出し元のトランスクリプトを直接変更することはありません。

クリーンな双方向音声のために、Meet の出力と Meet のマイクを別々の仮想デバイス、または Loopback スタイルの仮想デバイスグラフ経由でルーティングします。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタントの再生をクリアできます。これにより、アシスタント再生中に共有 BlackHole ループバック入力が一時的に抑制されている場合でも、人間の発話をアシスタント出力より優先できます。`chrome.audioInputCommand` および `chrome.audioOutputCommand` と同様に、これはオペレーター設定のローカルコマンドです。明示的に信頼されたコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は、Chrome セッションのアクティブなトークバック音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin 経由で委任された Twilio セッションでは、`leave` は基礎となる音声通話も切断します。API 管理スペースのアクティブな Google Meet 会議も閉じたい場合は、`googlemeet end-active-conference` を使用します。

## 関連

- [Voice Call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
