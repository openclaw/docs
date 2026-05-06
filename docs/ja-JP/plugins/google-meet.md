---
read_when:
    - OpenClaw エージェントを Google Meet 通話に参加させたい
    - OpenClaw エージェントに新しい Google Meet 通話を作成させたい
    - Chrome、Chrome ノード、または Twilio を Google Meet トランスポートとして設定しています
summary: 'Google Meet Plugin: 明示的な Meet URL に Chrome または Twilio 経由で参加し、エージェントのトークバック既定値を使用'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw の Google Meet 参加者サポートは、設計上明示的な Plugin です:

- 明示的な `https://meet.google.com/...` URL にのみ参加します。
- Google Meet API を通じて新しい Meet スペースを作成し、その後に返された URL へ参加できます。
- `agent` はデフォルトの応答モードです。リアルタイム文字起こしが聞き取り、設定済みの OpenClaw エージェントが回答し、通常の OpenClaw TTS が Meet に音声を流します。
- `bidi` は、フォールバックの直接リアルタイム音声モデルモードとして引き続き利用できます。
- エージェントは `mode` で参加動作を選択します。ライブの聞き取り/応答には `agent`、直接リアルタイム音声フォールバックには `bidi`、応答ブリッジなしでブラウザへ参加/制御するには `transcribe` を使います。
- 認証は個人の Google OAuth、またはすでにサインイン済みの Chrome プロファイルとして開始します。
- 自動の同意告知はありません。
- デフォルトの Chrome 音声バックエンドは `BlackHole 2ch` です。
- Chrome はローカルでも、ペアリング済みの Node ホスト上でも実行できます。
- Twilio はダイヤルイン番号に加えて任意の PIN または DTMF シーケンスを受け付けますが、Meet URL へ直接ダイヤルすることはできません。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカル音声依存関係をインストールし、リアルタイム文字起こしプロバイダーと通常の OpenClaw TTS を設定します。OpenAI はデフォルトの文字起こしプロバイダーです。Google Gemini Live も、`realtime.voiceProvider: "google"` による別個の `bidi` 音声フォールバックとして動作します:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想オーディオデバイスをインストールします。Homebrew のインストーラーでは、macOS がデバイスを公開する前に再起動が必要です:

```bash
sudo reboot
```

再起動後、両方を確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin を有効化します:

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

セットアップ出力は、エージェントが読め、モードを認識するものとして設計されています。Chrome プロファイル、Node 固定、リアルタイム Chrome 参加では BlackHole/SoX 音声ブリッジと遅延リアルタイム導入チェックを報告します。観察のみの参加では、同じトランスポートを `--mode transcribe` で確認します。このモードはブリッジ経由で聞き取ったり話したりしないため、リアルタイム音声の前提条件をスキップします:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 委任が設定されている場合、セットアップは `voice-call` Plugin、Twilio 認証情報、公開 Webhook の外部公開が準備できているかも報告します。エージェントに参加を依頼する前に、`ok: false` のチェックは、確認対象のトランスポートとモードに対するブロッカーとして扱ってください。スクリプトまたは機械可読出力には `openclaw googlemeet setup --json` を使います。エージェントが試行する前に特定のトランスポートを事前確認するには、`--transport chrome`、`--transport chrome-node`、または `--transport twilio` を使います。

Twilio では、デフォルトのトランスポートが Chrome の場合、常にトランスポートを明示的に事前確認します:

```bash
openclaw googlemeet setup --transport twilio
```

これにより、エージェントがミーティングへダイヤルする前に、不足している `voice-call` 配線、Twilio 認証情報、または到達不能な Webhook 外部公開を検出できます。

ミーティングに参加します:

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

エージェント向けの `google_meet` ツールは、macOS 以外のホストでも、アーティファクト、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node` フローで引き続き利用できます。ローカル Chrome の応答アクションは、同梱 Chrome 音声パスが現在 macOS の `BlackHole 2ch` に依存しているため、そこでブロックされます。Linux では、Chrome 応答参加に `mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使います。

新しいミーティングを作成して参加します:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API で作成したルームで、ルームのノックなしポリシーを Google アカウントのデフォルトから継承するのではなく明示したい場合は、Google Meet の `SpaceConfig.accessType` を使います:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` は、Meet URL を持つ誰でもノックなしで参加できるようにします。`TRUSTED` は、ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザーがノックなしで参加できるようにします。`RESTRICTED` は、ノックなし参加を招待者に限定します。これらの設定は公式 Google Meet API の作成パスにのみ適用されるため、OAuth 認証情報を設定する必要があります。

このオプションが利用可能になる前に Google Meet を認証していた場合は、Google OAuth 同意画面に `meetings.space.settings` スコープを追加した後、`openclaw googlemeet auth login --json` を再実行します。

参加せず URL だけを作成します:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` には 2つのパスがあります:

- API 作成: Google Meet OAuth 認証情報が設定されている場合に使われます。これは最も決定的なパスであり、ブラウザ UI 状態に依存しません。
- ブラウザフォールバック: OAuth 認証情報がない場合に使われます。OpenClaw は固定された Chrome Node を使い、`https://meet.google.com/new` を開き、Google が実際のミーティングコード URL にリダイレクトするのを待ってから、その URL を返します。このパスでは、Node 上の OpenClaw Chrome プロファイルがすでに Google にサインインしている必要があります。ブラウザ自動化は Meet 自身の初回マイクプロンプトを処理します。そのプロンプトは Google ログイン失敗として扱われません。
  参加フローと作成フローは、新しいタブを開く前に既存の Meet タブの再利用も試みます。照合では `authuser` など無害な URL クエリ文字列を無視するため、エージェントの再試行では 2つ目の Chrome タブを作成するのではなく、すでに開いているミーティングにフォーカスするはずです。

コマンド/ツール出力には `source` フィールド（`api` または `browser`）が含まれるため、エージェントはどのパスが使われたかを説明できます。`create` はデフォルトで新しいミーティングに参加し、`joined: true` と参加セッションを返します。URL の発行だけを行うには、CLI で `create --no-join` を使うか、ツールに `"join": false` を渡します。

またはエージェントに「Google Meet を作成し、エージェント応答モードで参加して、リンクを送って」と指示します。エージェントは `action: "create"` で `google_meet` を呼び出し、その後返された `meetingUri` を共有する必要があります。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

観察のみ/ブラウザ制御の参加では、`"mode": "transcribe"` を設定します。これは双方向リアルタイム音声ブリッジを開始せず、BlackHole や SoX を必要とせず、ミーティングに応答しません。このモードの Chrome 参加では、OpenClaw のマイク/カメラ権限付与と Meet の **マイクを使用** パスも避けます。Meet が音声選択インタースティシャルを表示した場合、自動化はマイクなしのパスを試し、それ以外の場合はローカルマイクを開くのではなく手動アクションを報告します。transcribe モードでは、管理対象の Chrome トランスポートもベストエフォートの Meet キャプション監視をインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、短い `recentTranscript` 末尾を表示するため、オペレーターはブラウザが通話に参加したか、Meet キャプションがテキストを生成しているかを判断できます。
明確な可否プローブが必要な場合は、`openclaw googlemeet test-listen <meet-url> --transport chrome-node` を使います。これは transcribe モードで参加し、新しいキャプションまたは文字起こしの進行を待ち、`listenVerified`、`listenTimedOut`、手動アクションフィールド、最新のキャプション健全性を返します。

リアルタイムセッション中、`google_meet` ステータスには `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最終入力/出力タイムスタンプ、バイトカウンター、ブリッジのクローズ状態など、ブラウザと音声ブリッジの健全性が含まれます。安全な Meet ページプロンプトが表示された場合、ブラウザ自動化は可能なときにそれを処理します。ログイン、ホストによる参加許可、ブラウザ/OS 権限プロンプトは、エージェントが伝達するための理由とメッセージ付きの手動アクションとして報告されます。管理対象 Chrome セッションは、ブラウザ健全性が `inCall: true` を報告した後にのみ導入フレーズまたはテストフレーズを発します。それ以外の場合、ステータスは `speechReady: false` を報告し、エージェントがミーティング内で話したふりをするのではなく、発話試行をブロックします。

ローカル Chrome は、サインイン済みの OpenClaw ブラウザプロファイル経由で参加します。リアルタイムモードでは、OpenClaw が使うマイク/スピーカーパスに `BlackHole 2ch` が必要です。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback スタイルのグラフを使います。単一の BlackHole デバイスでも最初のスモークテストには十分ですが、エコーが発生することがあります。

### ローカル Gateway + Parallels Chrome

VM に Chrome を担当させるだけなら、macOS VM 内に完全な OpenClaw Gateway やモデル API キーは不要です。Gateway とエージェントをローカルで実行し、その後 VM 内で Node ホストを実行します。Node が Chrome コマンドを広告するように、同梱 Plugin を VM で一度有効化します:

どこで何を実行するか:

- Gateway ホスト: OpenClaw Gateway、エージェントワークスペース、モデル/API キー、リアルタイムプロバイダー、Google Meet Plugin 設定。
- Parallels macOS VM: OpenClaw CLI/Node ホスト、Google Chrome、SoX、BlackHole 2ch、Google にサインイン済みの Chrome プロファイル。
- VM 内で不要なもの: Gateway サービス、エージェント設定、OpenAI/GPT キー、モデルプロバイダー設定。

VM の依存関係をインストールします:

```bash
brew install blackhole-2ch sox
```

BlackHole をインストールした後、macOS が `BlackHole 2ch` を公開するように VM を再起動します:

```bash
sudo reboot
```

再起動後、VM がオーディオデバイスと SoX コマンドを認識できることを確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM 内で OpenClaw をインストールまたは更新し、その後そこでも同梱 Plugin を有効化します:

```bash
openclaw plugins enable google-meet
```

VM 内で Node ホストを起動します:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が LAN IP で TLS を使っていない場合、その信頼済みプライベートネットワークに対して明示的に許可しない限り、Node は平文 WebSocket を拒否します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node を LaunchAgent としてインストールする場合も、同じ環境変数を使います:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` 設定ではありません。`openclaw node install` は、インストールコマンドに存在する場合、それを LaunchAgent 環境に保存します。

Gateway ホストから Node を承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が Node を認識し、`googlemeet.chrome` とブラウザ機能/`browser.proxy` の両方を広告していることを確認します:

```bash
openclaw nodes status
```

Gateway ホスト上で、その Node 経由で Meet をルーティングします:

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

セッションの作成または再利用、既知のフレーズの発話、セッション健全性の出力を行うワンコマンドのスモークテストには、次を使います:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加中、OpenClaw のブラウザー自動化はゲスト名を入力し、
Join/Ask to join をクリックし、そのプロンプトが表示された場合は Meet の初回実行時の
「Use microphone」の選択を承認します。観察のみの参加、またはブラウザーのみでのミーティング作成中は、
その選択肢が利用できる場合、マイクなしで同じプロンプトを先へ進めます。
ブラウザープロファイルがサインインしていない場合、Meet がホストの承認を待っている場合、
リアルタイム参加のために Chrome がマイク/カメラ権限を必要としている場合、または
Meet が自動化で解決できないプロンプトで止まっている場合、join/test-speech の結果は
`manualActionReason` と `manualActionMessage` とともに
`manualActionRequired: true` を報告します。エージェントは参加の再試行を停止し、
その正確なメッセージに現在の `browserUrl`/`browserTitle` を添えて報告し、
手動のブラウザー操作が完了した後にのみ再試行する必要があります。

`chromeNode.node` が省略された場合、OpenClaw は接続済みノードがちょうど 1 つだけ
`googlemeet.chrome` とブラウザー制御の両方を通知している場合にのみ自動選択します。
対応可能なノードが複数接続されている場合は、`chromeNode.node` をノード ID、
表示名、またはリモート IP に設定します。

よくある失敗チェック:

- `Configured Google Meet node ... is not usable: offline`: 固定されたノードは
  Gateway には認識されていますが、利用できません。エージェントはそのノードを
  利用可能な Chrome ホストではなく診断状態として扱い、ユーザーがそれを求めた場合を除き、
  別のトランスポートにフォールバックするのではなくセットアップのブロッカーを報告する必要があります。
- `No connected Google Meet-capable node`: VM で `openclaw node run` を開始し、
  ペアリングを承認し、VM で `openclaw plugins enable google-meet` と
  `openclaw plugins enable browser` が実行済みであることを確認します。また、
  Gateway ホストが
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  で両方のノードコマンドを許可していることも確認します。
- `BlackHole 2ch audio device not found`: チェック対象のホストに `blackhole-2ch`
  をインストールし、ローカル Chrome 音声を使用する前に再起動します。
- `BlackHole 2ch audio device not found on the node`: VM に `blackhole-2ch`
  をインストールし、VM を再起動します。
- Chrome は開くが参加できない: VM 内のブラウザープロファイルにサインインするか、
  ゲスト参加用に `chrome.guestName` を設定したままにします。ゲスト自動参加は
  ノードブラウザープロキシを介した OpenClaw ブラウザー自動化を使用します。
  ノードブラウザー設定が使用したいプロファイルを指していることを確認してください。例:
  `browser.defaultProfile: "user"` または名前付きの既存セッションプロファイル。
- Meet タブの重複: `chrome.reuseExistingTab: true` を有効にしたままにします。OpenClaw は
  新しいタブを開く前に同じ Meet URL の既存タブをアクティブ化し、ブラウザーでの
  ミーティング作成も、別のタブを開く前に進行中の `https://meet.google.com/new`
  または Google アカウントプロンプトのタブを再利用します。
- 音声がない: Meet で、OpenClaw が使用する仮想音声デバイスパスに
  マイク/スピーカー音声をルーティングします。クリーンな双方向音声には、
  個別の仮想デバイスまたは Loopback 形式のルーティングを使用します。

## インストールに関する注記

Chrome トークバックのデフォルトは 2 つの外部ツールを使用します。

- `sox`: コマンドライン音声ユーティリティ。Plugin はデフォルトの 24 kHz PCM16
  音声ブリッジに明示的な CoreAudio デバイスコマンドを使用します。
- `blackhole-2ch`: macOS 仮想音声ドライバー。Chrome/Meet がルーティングできる
  `BlackHole 2ch` 音声デバイスを作成します。

OpenClaw はどちらのパッケージも同梱または再配布しません。ドキュメントでは、
ユーザーに Homebrew を通じてホスト依存関係としてインストールするよう案内しています。
SoX は `LGPL-2.0-only AND GPL-2.0-only` としてライセンスされており、
BlackHole は GPL-3.0 です。BlackHole を OpenClaw と一緒に同梱する
インストーラーまたはアプライアンスを構築する場合は、BlackHole のアップストリームの
ライセンス条件を確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

### Chrome

Chrome トランスポートは OpenClaw のブラウザー制御を通じて Meet URL を開き、
サインイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、
Plugin が起動前に `BlackHole 2ch` を確認します。設定されている場合は、
Chrome を開く前に音声ブリッジのヘルスコマンドと起動コマンドも実行します。
Chrome/音声が Gateway ホスト上にある場合は `chrome` を使用し、Chrome/音声が
Parallels macOS VM などのペアリング済みノード上にある場合は `chrome-node`
を使用します。ローカル Chrome では `browser.defaultProfile` でプロファイルを選択します。
`chrome.browserProfile` は `chrome-node` ホストに渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイクとスピーカー音声をローカルの OpenClaw 音声ブリッジ経由で
ルーティングします。`BlackHole 2ch` がインストールされていない場合、
参加は音声パスなしで黙って参加するのではなく、セットアップエラーで失敗します。

### Twilio

Twilio トランスポートは Voice Call Plugin に委任される厳密なダイヤルプランです。
電話番号を取得するために Meet ページを解析することはありません。

Chrome 参加が利用できない場合、または電話ダイヤルインのフォールバックが必要な場合に使用します。
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

Twilio 認証情報は環境または設定を通じて提供します。環境を使用すると、
シークレットを `openclaw.json` の外に保てます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

リアルタイム音声プロバイダーがそれである場合は、代わりに OpenAI プロバイダー
Plugin と `OPENAI_API_KEY` を使って `realtime.provider: "openai"` を使用します。

`voice-call` を有効にした後、Gateway を再起動または再読み込みします。Plugin 設定の変更は、
再読み込みされるまで、すでに実行中の Gateway プロセスには現れません。

次に検証します。

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

ミーティングにカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth とプリフライト

`googlemeet create` はブラウザー自動化にフォールバックできるため、
Meet リンクの作成に OAuth は任意です。公式 API による作成、スペース解決、
または Meet Media API のプリフライトチェックが必要な場合に OAuth を設定します。

Google Meet API アクセスはユーザー OAuth を使用します。Google Cloud OAuth クライアントを作成し、
必要なスコープをリクエストし、Google アカウントを承認してから、結果のリフレッシュトークンを
Google Meet Plugin 設定に保存するか、`OPENCLAW_GOOGLE_MEET_*`
環境変数を提供します。

OAuth は Chrome 参加パスを置き換えるものではありません。Chrome と Chrome-node
トランスポートは、ブラウザー参加を使用する場合、引き続きサインイン済みの
Chrome プロファイル、BlackHole/SoX、接続済みノードを通じて参加します。
OAuth は公式 Google Meet API パス、つまりミーティングスペースの作成、
スペースの解決、Meet Media API プリフライトチェックの実行にのみ使用されます。

### Google 認証情報を作成する

Google Cloud Console で:

1. Google Cloud プロジェクトを作成または選択します。
2. そのプロジェクトで **Google Meet REST API** を有効にします。
3. OAuth 同意画面を設定します。
   - **Internal** は Google Workspace 組織では最も簡単です。
   - **External** は個人/テストセットアップで機能します。アプリが Testing 中の間は、
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
`meetings.space.readonly` により、OpenClaw は Meet URL/コードをスペースに解決できます。
`meetings.space.settings` により、OpenClaw は API ルーム作成中に `accessType`
などの `SpaceConfig` 設定を渡せます。
`meetings.conference.media.readonly` は Meet Media API のプリフライトとメディア作業用です。
実際の Media API 使用には、Google が Developer Preview への登録を要求する場合があります。
ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全にスキップしてください。

### リフレッシュトークンを発行する

`oauth.clientId` と、任意で `oauth.clientSecret` を設定するか、環境変数として渡してから実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。
PKCE、`http://localhost:8085/oauth2callback` の localhost コールバック、
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
設定値と環境値の両方が存在する場合、Plugin は先に設定を解決し、その後に環境フォールバックを使用します。

OAuth 同意には、Meet スペース作成、Meet スペース読み取りアクセス、
および Meet 会議メディア読み取りアクセスが含まれます。ミーティング作成サポートが存在する前に
認証していた場合は、リフレッシュトークンが `meetings.space.created` スコープを持つように、
`openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を検証する

高速でシークレットを含まないヘルスチェックが必要な場合は、OAuth doctor を実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これは Chrome ランタイムを読み込まず、接続済みの Chrome ノードも必要としません。
OAuth 設定が存在すること、およびリフレッシュトークンがアクセストークンを発行できることを確認します。
JSON レポートには `ok`、`configured`、`tokenSource`、`expiresAt`、
チェックメッセージなどのステータスフィールドのみが含まれます。アクセストークン、
リフレッシュトークン、クライアントシークレットは出力しません。

よくある結果:

| チェック             | 意味                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済みアクセストークンが存在します。 |
| `oauth-token`        | キャッシュ済みアクセストークンがまだ有効、または更新トークンが新しいアクセストークンを発行しました。 |
| `meet-spaces-get`    | 任意の `--meeting` チェックが既存の Meet スペースを解決しました。                     |
| `meet-spaces-create` | 任意の `--create-space` チェックが新しい Meet スペースを作成しました。                |

Google Meet API の有効化と `spaces.create` スコープも証明するには、副作用を伴う作成チェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` は使い捨ての Meet URL を作成します。Google Cloud プロジェクトで Meet API が有効になっており、認可済みアカウントに `meetings.space.created` スコープがあることを確認する必要がある場合に使用します。

既存のミーティングスペースへの読み取りアクセスを証明するには、次を実行します。

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` と `resolve-space` は、認可済み Google アカウントがアクセスできる既存スペースへの読み取りアクセスを証明します。これらのチェックで `403` が返る場合、通常は Google Meet REST API が無効、同意済みの更新トークンに必要なスコープがない、または Google アカウントがその Meet スペースにアクセスできないことを意味します。更新トークンエラーは、`openclaw googlemeet auth login
--json` を再実行し、新しい `oauth` ブロックを保存する必要があることを意味します。

ブラウザフォールバックには OAuth 認証情報は不要です。このモードでは、Google 認証は OpenClaw 設定ではなく、選択したノード上のサインイン済み Chrome プロファイルから取得されます。

次の環境変数はフォールバックとして受け付けられます。

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

メディア作業の前にプリフライトを実行します。

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後に、ミーティング成果物と出席情報を一覧表示します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定すると、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。そのミーティングの保持済みレコードをすべて取得したい場合は、`--all-conference-records` を渡します。

Meet 成果物を読み取る前に、Calendar 参照で Google Calendar からミーティング URL を解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Google Meet リンクを含む Calendar イベントを今日の `primary` カレンダーから検索します。一致するイベントテキストを検索するには `--event <query>` を使用し、プライマリ以外のカレンダーには `--calendar <id>` を使用します。Calendar 参照には、Calendar events readonly スコープを含む新しい OAuth ログインが必要です。
`calendar-events` は、一致する Meet イベントをプレビューし、`latest`、`artifacts`、`attendance`、または `export` が選択するイベントをマークします。

会議レコード ID がすでにわかっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

通話後にルームを閉じたい場合は、API で作成されたスペースのアクティブな会議を終了します。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

これは Google Meet `spaces.endActiveConference` を呼び出し、認可済みアカウントが管理できるスペースに対する `meetings.space.created` スコープ付き OAuth を必要とします。
OpenClaw は Meet URL、ミーティングコード、または `spaces/{id}` 入力を受け取り、アクティブな会議を終了する前に API スペースリソースへ解決します。
これは `googlemeet leave` とは別です。`leave` は OpenClaw のローカル/セッション参加を停止しますが、`end-active-conference` は Google Meet にスペースのアクティブな会議を終了するよう要求します。

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

Google がそのミーティング向けに公開している場合、`artifacts` は会議レコードのメタデータに加えて、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートリソースのメタデータを返します。大規模なミーティングでエントリ参照をスキップするには `--no-transcript-entries` を使用します。`attendance` は、参加者を参加者セッション行に展開し、初回/最終確認時刻、合計セッション時間、遅刻/早退フラグ、サインイン済みユーザーまたは表示名によってマージされた重複参加者リソースを含めます。生の参加者リソースを分けたままにするには `--no-merge-duplicates` を渡し、遅刻検出を調整するには `--late-after-minutes`、早退検出を調整するには `--early-before-minutes` を渡します。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダを書き出します。
`manifest.json` には、選択された入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンソース、使用された場合の Calendar イベント、部分的な取得警告が記録されます。フォルダの横にポータブルアーカイブも書き出すには `--zip` を渡します。リンクされた文字起こしとスマートノートの Google Docs テキストを Google Drive `files.export` 経由でエクスポートするには、`--include-doc-bodies` を渡します。これには Drive Meet readonly スコープを含む新しい OAuth ログインが必要です。`--include-doc-bodies` がない場合、エクスポートには Meet メタデータと構造化された文字起こしエントリのみが含まれます。スマートノート一覧、文字起こしエントリ、Drive ドキュメント本文エラーなど、Google が部分的な成果物失敗を返した場合、エクスポート全体を失敗させるのではなく、概要とマニフェストに警告を保持します。
同じ成果物/出席データを取得し、フォルダや ZIP を作成せずにマニフェスト JSON を出力するには `--dry-run` を使用します。これは大きなエクスポートを書き出す前や、エージェントが件数、選択されたレコード、警告だけを必要とする場合に役立ちます。

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

エージェントは、明示的なアクセスポリシー付きで API ベースのルームも作成できます。

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

リッスン優先の検証では、ミーティングが有用だと主張する前に、エージェントは `test_listen` を使用する必要があります。

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

実際に保持されているミーティングに対して、保護付きライブスモークを実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

誰かが話し、Meet の字幕が利用できるミーティングに対して、ライブのリッスン優先ブラウザプローブを実行します。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

ライブスモーク環境:

- `OPENCLAW_LIVE_TEST=1` は保護付きライブテストを有効にします。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` は保持済みの Meet URL、コード、または
  `spaces/{id}` を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID` は OAuth クライアント ID を提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN` は更新トークンを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` は、`OPENCLAW_` プレフィックスなしの同じフォールバック名を使用します。

基本の成果物/出席ライブスモークには、`https://www.googleapis.com/auth/meetings.space.readonly` と `https://www.googleapis.com/auth/meetings.conference.media.readonly` が必要です。Calendar 参照には `https://www.googleapis.com/auth/calendar.events.readonly` が必要です。Drive ドキュメント本文のエクスポートには `https://www.googleapis.com/auth/drive.meet.readonly` が必要です。

新しい Meet スペースを作成します。

```bash
openclaw googlemeet create
```

このコマンドは、新しい `meeting uri`、ソース、参加セッションを出力します。OAuth 認証情報がある場合は公式 Google Meet API を使用します。OAuth 認証情報がない場合は、ピン留めされた Chrome ノードのサインイン済みブラウザプロファイルをフォールバックとして使用します。エージェントは `action: "create"` を指定した `google_meet` ツールを使用して、1 ステップで作成して参加できます。URL のみを作成するには、`"join": false` を渡します。

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

ブラウザフォールバックが URL を作成する前に Google ログインまたは Meet 権限ブロッカーに当たった場合、Gateway メソッドは失敗レスポンスを返し、`google_meet` ツールはプレーン文字列ではなく構造化された詳細を返します。

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

エージェントが `manualActionRequired: true` を確認した場合は、`manualActionMessage` とブラウザのノード/タブコンテキストを報告し、オペレーターがブラウザ手順を完了するまで新しい Meet タブを開くのを停止する必要があります。

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

Meet を作成すると、デフォルトで参加します。Chrome または Chrome-node トランスポートでブラウザー経由で参加するには、引き続きサインイン済みの Google Chrome プロファイルが必要です。プロファイルがサインアウトしている場合、OpenClaw は `manualActionRequired: true` またはブラウザーのフォールバックエラーを報告し、再試行する前にオペレーターへ Google ログインの完了を求めます。

Cloud プロジェクト、OAuth プリンシパル、ミーティング参加者が Meet media APIs 向け Google Workspace Developer Preview Program に登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

共通の Chrome エージェントパスに必要なのは、Plugin の有効化、BlackHole、SoX、リアルタイム文字起こしプロバイダーキー、設定済みの OpenClaw TTS プロバイダーだけです。OpenAI がデフォルトの文字起こしプロバイダーです。デフォルトのエージェントモードの文字起こしプロバイダーを変更せずに、`bidi` モードで Google Gemini Live を使用するには、`realtime.voiceProvider` を `"google"` に設定し、`realtime.model` を設定します。

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
- `defaultMode: "agent"`（`"realtime"` は `"agent"` のレガシー互換エイリアスとしてのみ受け付けられます。新しいツール呼び出しでは `"agent"` を指定してください）
- `chromeNode.node`: `chrome-node` 用の任意のノード ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウト済みの Meet ゲスト画面で使用される名前
- `chrome.autoJoin: true`: `chrome-node` 上の OpenClaw ブラウザー自動操作による、ベストエフォートのゲスト名入力と Join Now クリック
- `chrome.reuseExistingTab: true`: 重複して開く代わりに、既存の Meet タブをアクティブ化します
- `chrome.waitForInCallMs: 20000`: トークバックのイントロがトリガーされる前に、Meet タブが通話中を報告するのを待ちます
- `chrome.audioFormat: "pcm16-24khz"`: コマンドペア音声形式。テレフォニー音声をまだ出力するレガシー/カスタムのコマンドペアにのみ `"g711-ulaw-8khz"` を使用してください。
- `chrome.audioBufferBytes: 4096`: 生成された Chrome コマンドペア音声コマンド用の SoX 処理バッファー。これは SoX のデフォルト 8192 バイトバッファーの半分で、混雑したホストで増やす余地を残しつつ、デフォルトのパイプレイテンシーを減らします。SoX の最小値を下回る値は 17 バイトに制限されます。
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` から読み取り、`chrome.audioFormat` で音声を書き込む SoX コマンド
- `chrome.audioOutputCommand`: `chrome.audioFormat` の音声を読み取り、CoreAudio `BlackHole 2ch` に書き込む SoX コマンド
- `chrome.bargeInInputCommand`: アシスタント再生がアクティブな間に、人間の割り込み検出用に符号付き 16 ビットリトルエンディアンのモノラル PCM を書き込む任意のローカルマイクコマンド。これは現在、Gateway でホストされる `chrome` コマンドペアブリッジに適用されます。
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` で人間の割り込みとして扱う RMS レベル
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` で人間の割り込みとして扱うピークレベル
- `chrome.bargeInCooldownMs: 900`: 繰り返しの人間の割り込みクリア間の最小遅延
- `mode: "agent"`: デフォルトのトークバックモード。参加者の発話は設定済みのリアルタイム文字起こしプロバイダーによって文字起こしされ、ミーティングごとのサブエージェントセッション内の設定済み OpenClaw エージェントへ送信され、通常の OpenClaw TTS ランタイムを通じて読み上げられます。
- `mode: "bidi"`: フォールバック用の直接双方向リアルタイムモデルモード。リアルタイム音声プロバイダーが参加者の発話に直接応答し、より深い/ツールベースの回答のために `openclaw_agent_consult` を呼び出す場合があります。
- `mode: "transcribe"`: トークバックブリッジなしの観察専用モード。
- `realtime.provider: "openai"`: 下記のスコープ付きプロバイダーフィールドが未設定の場合に使用される互換フォールバック。
- `realtime.transcriptionProvider: "openai"`: `agent` モードでリアルタイム文字起こしに使用されるプロバイダー ID。
- `realtime.voiceProvider`: `bidi` モードで直接リアルタイム音声に使用されるプロバイダー ID。エージェントモードの文字起こしを OpenAI のままにしながら Gemini Live を使用するには、これを `"google"` に設定します。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 短い音声応答。より深い回答には `openclaw_agent_consult` を使用します
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

エージェントモードのリスニングと読み上げの両方に ElevenLabs を使用する場合:

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

永続的な Meet 音声は `messages.tts.providers.elevenlabs.voiceId` から取得されます。TTS モデルのオーバーライドが有効な場合、エージェントの返信では返信ごとの `[[tts:voiceId=... model=eleven_v3]]` ディレクティブも使用できますが、ミーティングでは設定が決定的なデフォルトです。参加時には、ログに `transcriptionProvider=elevenlabs` が表示され、各音声返信で `provider=elevenlabs model=eleven_v3 voice=<voiceId>` がログに記録されるはずです。

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

`voiceCall.enabled` のデフォルトは `true` です。Twilio トランスポートでは、実際の PSTN 通話、DTMF、イントロ挨拶を Voice Call Plugin に委譲します。Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを再生し、その後、保存されたイントロテキストを初期リアルタイム挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話を発信することはできません。

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

Chrome が Gateway ホスト上で実行される場合は `transport: "chrome"` を使用します。Chrome が Parallels VM などのペアリング済みノード上で実行される場合は `transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと `openclaw_agent_consult` は Gateway ホスト上で実行されるため、モデル認証情報はそこに保持されます。デフォルトの `mode: "agent"` では、リアルタイム文字起こしプロバイダーがリスニングを処理し、設定済み OpenClaw エージェントが回答を生成し、通常の OpenClaw TTS がそれを Meet に読み上げます。リアルタイム音声モデルに直接回答させたい場合は `mode: "bidi"` を使用します。生の `mode: "realtime"` は `mode: "agent"` のレガシー互換エイリアスとして引き続き受け付けられますが、エージェントツールスキーマではもう提示されません。エージェントモードのログには、ブリッジ起動時に解決された文字起こしプロバイダー/モデルが含まれ、各合成返信後に TTS プロバイダー、モデル、音声、出力形式、サンプルレートが含まれます。

アクティブなセッションを一覧表示する、またはセッション ID を調べるには `action: "status"` を使用します。リアルタイムエージェントに即座に発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用します。セッションを作成または再利用し、既知のフレーズをトリガーし、Chrome ホストが報告できる場合に `inCall` ヘルスを返すには `action: "test_speech"` を使用します。`test_speech` は常に `mode: "agent"` を強制し、観察専用セッションは意図的に音声を出力できないため、`mode: "transcribe"` で実行するよう求められると失敗します。その `speechOutputVerified` 結果は、このテスト呼び出し中にリアルタイム音声出力バイトが増加したかどうかに基づくため、古い音声を持つ再利用セッションは新しい成功した発話チェックとしてはカウントされません。セッションを終了済みとしてマークするには `action: "leave"` を使用します。

`status` には、利用可能な場合に Chrome のヘルスが含まれます。

- `inCall`: Chrome が Meet 通話内にいるように見えます
- `micMuted`: ベストエフォートの Meet マイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 音声が動作する前に、ブラウザープロファイルで手動ログイン、Meet ホストの許可、権限、またはブラウザー制御の修復が必要です
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 管理対象 Chrome 音声が現在許可されているかどうか。`speechReady: false` は、OpenClaw がイントロ/テストフレーズを音声ブリッジに送信しなかったことを意味します。
- `providerConnected` / `realtimeReady`: リアルタイム音声ブリッジの状態
- `lastInputAt` / `lastOutputAt`: ブリッジから最後に確認された、またはブリッジへ送信された音声
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet タブのメディア出力が、ブリッジで使用される BlackHole デバイスへ能動的にルーティングされたかどうか
- `lastSuppressedInputAt` / `suppressedInputBytes`: アシスタント再生がアクティブな間に無視されたループバック入力

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## agent と bidi モード

Chrome の `agent` モードは、「自分のエージェントがミーティングにいる」動作向けに最適化されています。リアルタイム文字起こしプロバイダーがミーティング音声を聞き取り、最終的な参加者の文字起こしは設定済み OpenClaw エージェントへルーティングされ、回答は通常の OpenClaw TTS ランタイムを通じて読み上げられます。リアルタイム音声モデルに直接回答させたい場合は、`mode: "bidi"` を設定します。近接する最終文字起こし断片は consult 前に結合されるため、1 回の発話ターンが複数の古い部分回答を生成することはありません。キューに入ったアシスタント音声がまだ再生中の間はリアルタイム入力も抑制され、最近のアシスタントらしい文字起こしエコーはエージェント consult の前に無視されるため、BlackHole ループバックによってエージェントが自分自身の発話に回答することはありません。

| モード  | 回答を決める主体              | 音声出力パス                           | 使用する場面                                                     |
| ------- | ----------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `agent` | 設定済みの OpenClaw エージェント | 通常の OpenClaw TTS ランタイム          | 「自分のエージェントがミーティングにいる」動作が必要な場合       |
| `bidi`  | リアルタイム音声モデル        | リアルタイム音声プロバイダーの音声応答 | 最低レイテンシーの会話音声ループが必要な場合                    |

`bidi` モードでは、リアルタイムモデルがより深い推論、現在の情報、または通常の OpenClaw ツールを必要とする場合、`openclaw_agent_consult` を呼び出すことができます。

consult ツールは、最近の会議トランスクリプトのコンテキストを使って通常の OpenClaw agent を背後で実行し、簡潔な音声回答を返します。`agent` モードでは、OpenClaw はその回答を TTS ランタイムに直接送信します。`bidi` モードでは、リアルタイム音声モデルが consult 結果を会議に向けて発話できます。これは Voice Call と同じ共有 consult 仕組みを使用します。

デフォルトでは、consult は `main` agent に対して実行されます。Meet レーンで専用の OpenClaw agent ワークスペース、モデルのデフォルト、ツールポリシー、メモリ、セッション履歴を consult する必要がある場合は、`realtime.agentId` を設定します。

agent モードの consult は、会議ごとの `agent:<id>:subagent:google-meet:<session>` セッションキーを使用するため、フォローアップの質問は設定済み agent から通常の agent ポリシーを継承しながら、会議コンテキストを保持します。

`realtime.toolPolicy` は consult 実行を制御します。

- `safe-read-only`: consult ツールを公開し、通常の agent を `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
- `owner`: consult ツールを公開し、通常の agent が通常の agent ツールポリシーを使用できるようにします。
- `none`: consult ツールをリアルタイム音声モデルに公開しません。

consult セッションキーは Meet セッションごとにスコープされるため、フォローアップの consult 呼び出しは同じ会議中に以前の consult コンテキストを再利用できます。

Chrome が通話に完全に参加した後で、発話による準備完了チェックを強制するには、次を実行します。

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全な参加して発話するスモークには、次を使用します。

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

無人 agent に会議を引き渡す前に、この順序を使用します。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node の状態:

- `googlemeet setup` がすべて緑です。
- Chrome-node がデフォルトの transport であるか、node が固定されている場合、`googlemeet setup` に `chrome-node-connected` が含まれます。
- `nodes status` に、選択された node が接続済みとして表示されます。
- 選択された node が `googlemeet.chrome` と `browser.proxy` の両方を通知します。
- Meet タブが通話に参加し、`test-speech` が `inCall: true` を含む Chrome ヘルスを返します。

Parallels macOS VM などのリモート Chrome ホストでは、Gateway または VM を更新した後の最短の安全なチェックは次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、Gateway Plugin が読み込まれていること、VM node が現在のトークンで接続されていること、agent が実際の会議タブを開く前に Meet 音声ブリッジが利用可能であることを証明できます。

Twilio スモークには、電話ダイヤルインの詳細を公開する会議を使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待される Twilio の状態:

- `googlemeet setup` に、緑の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。
- Gateway の再読み込み後、CLI で `voicecall` が利用できます。
- 返されたセッションに `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` で、リアルタイム TwiML の前に DTMF TwiML が提供され、その後、初期あいさつがキューに入ったリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` が委任された音声通話を切断します。

## トラブルシューティング

### agent が Google Meet ツールを認識できない

Gateway 設定で Plugin が有効になっていることを確認し、Gateway を再読み込みします。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` を編集したばかりの場合は、Gateway を再起動または再読み込みしてください。実行中の agent は、現在の Gateway プロセスによって登録された Plugin ツールだけを認識します。

macOS 以外の Gateway ホストでは、agent 向けの `google_meet` ツールは表示されたままですが、ローカル Chrome のトークバックアクションは音声ブリッジに到達する前にブロックされます。ローカル Chrome のトークバック音声は現在 macOS の `BlackHole 2ch` に依存しているため、Linux agent はデフォルトのローカル Chrome agent パスの代わりに、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### 接続済みの Google Meet 対応 node がない

node ホストで、次を実行します。

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

node は接続済みで、`browser.proxy` に加えて `googlemeet.chrome` を一覧表示する必要があります。Gateway 設定では、これらの node コマンドを許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` が `chrome-node-connected` で失敗するか、Gateway ログに `gateway token mismatch` が報告される場合は、現在の Gateway トークンで node を再インストールまたは再起動します。LAN Gateway では通常、次のようになります。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、node サービスを再読み込みし、再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くが agent が参加できない

observe-only 参加には `googlemeet test-listen` を、リアルタイム参加には `googlemeet test-speech` を実行し、返された Chrome ヘルスを確認します。どちらかのプローブが `manualActionRequired: true` を報告した場合は、operator に `manualActionMessage` を表示し、ブラウザーアクションが完了するまで再試行を停止します。

一般的な手動アクション:

- Chrome プロファイルにサインインします。
- Meet ホストアカウントからゲストを承認します。
- Chrome のネイティブ権限プロンプトが表示されたら、Chrome のマイク/カメラ権限を付与します。
- 停滞した Meet 権限ダイアログを閉じるか修復します。

Meet に「会議で自分の音声を他の参加者に聞こえるようにしますか？」と表示されているだけで、「サインインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。OpenClaw は可能な場合、ブラウザー自動化を通じて **マイクを使用** をクリックし、実際の会議状態を待ち続けます。作成専用のブラウザーフォールバックでは、URL の作成にリアルタイム音声パスが不要なため、OpenClaw が **マイクを使用せずに続行** をクリックする場合があります。

### 会議の作成が失敗する

`googlemeet create` は、OAuth 認証情報が設定されている場合、まず Google Meet API の `spaces.create` エンドポイントを使用します。OAuth 認証情報がない場合は、固定された Chrome node ブラウザーにフォールバックします。次を確認してください。

- API 作成の場合: `oauth.clientId` と `oauth.refreshToken` が設定されているか、一致する `OPENCLAW_GOOGLE_MEET_*` 環境変数が存在します。
- API 作成の場合: リフレッシュトークンが、作成サポートが追加された後に発行されています。古いトークンには `meetings.space.created` スコープが欠けている場合があります。`openclaw googlemeet auth login --json` を再実行し、Plugin 設定を更新してください。
- ブラウザーフォールバックの場合: `defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を持つ接続済み node を指しています。
- ブラウザーフォールバックの場合: その node 上の OpenClaw Chrome プロファイルが Google にサインインしており、`https://meet.google.com/new` を開けます。
- ブラウザーフォールバックの場合: 再試行では、新しいタブを開く前に既存の `https://meet.google.com/new` または Google アカウントプロンプトタブを再利用します。agent がタイムアウトした場合は、別の Meet タブを手動で開くのではなく、ツール呼び出しを再試行してください。
- ブラウザーフォールバックの場合: ツールが `manualActionRequired: true` を返す場合は、返された `browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用して operator を案内します。そのアクションが完了するまで、ループで再試行しないでください。
- ブラウザーフォールバックの場合: Meet に「会議で自分の音声を他の参加者に聞こえるようにしますか？」と表示されたら、タブを開いたままにしてください。OpenClaw はブラウザー自動化を通じて **マイクを使用**、または作成専用フォールバックでは **マイクを使用せずに続行** をクリックし、生成された Meet URL を待ち続ける必要があります。それができない場合、エラーは `google-login-required` ではなく `meet-audio-choice-required` に言及する必要があります。

### agent が参加するが話さない

リアルタイムパスを確認します。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

通常の STT -> OpenClaw agent -> TTS トークバックパスには `mode: "agent"` を使用し、直接リアルタイム音声フォールバックには `mode: "bidi"` を使用します。`mode: "transcribe"` は意図的にトークバックブリッジを開始しません。observe-only デバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認します。`inCall` が true なのに `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、observer がインストールされてから誰も話していない、Meet UI が変更された、または会議の言語/アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイムパスをチェックし、その呼び出しでブリッジ出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーは発話を受け入れた可能性がありますが、OpenClaw は新しい出力バイトが Chrome 音声ブリッジに到達するのを確認できませんでした。

次も確認してください。

- `OPENAI_API_KEY` や `GEMINI_API_KEY` など、リアルタイムプロバイダーキーが Gateway ホストで利用できます。
- `BlackHole 2ch` が Chrome ホストで表示されています。
- `sox` が Chrome ホストに存在します。
- Meet のマイクとスピーカーが、OpenClaw が使用する仮想音声パスを経由してルーティングされています。ローカル Chrome のリアルタイム参加では、`doctor` に `meet output routed: yes` が表示される必要があります。

`googlemeet doctor [session-id]` は、セッション、node、通話中状態、手動アクション理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザー URL を出力します。生の JSON が必要な場合は `googlemeet status [session-id] --json` を使用します。トークンを公開せずに Google Meet OAuth refresh を確認する必要がある場合は `googlemeet doctor --oauth` を使用し、Google Meet API の証明も必要な場合は `--meeting` または `--create-space` を追加します。

agent がタイムアウトし、Meet タブがすでに開いていることを確認できる場合は、別のタブを開かずにそのタブを検査します。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。これは、選択された transport の既存の Meet タブにフォーカスして検査します。`chrome` では、Gateway 経由のローカルブラウザー制御を使用します。`chrome-node` では、設定済み Chrome node を使用します。新しいタブを開いたり、新しいセッションを作成したりしません。ログイン、承認、権限、音声選択状態など、現在のブロッカーを報告します。CLI コマンドは設定済み Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では、Chrome node も接続されている必要があります。

### Twilio setup チェックが失敗する

`voice-call` が許可されていないか有効になっていない場合、`twilio-voice-call-plugin` は失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway を再読み込みします。

Twilio バックエンドにアカウント SID、認証トークン、または発信者番号がない場合、`twilio-voice-call-credentials` は失敗します。Gateway ホストでこれらを設定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` に公開 Webhook 露出がない場合、または `publicUrl` が loopback やプライベートネットワーク空間を指している場合、`twilio-voice-call-webhook` は失敗します。`plugins.entries.voice-call.config.publicUrl` を公開プロバイダー URL に設定するか、`voice-call` トンネル/Tailscale 露出を設定します。

loopback とプライベート URL はキャリアコールバックには有効ではありません。`publicUrl` として `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、または `fd00::/8` を使用しないでください。

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

ローカル開発では、プライベートなホスト URL の代わりにトンネルまたは Tailscale 公開を使用します。

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

その後、Gateway を再起動またはリロードして、次を実行します。

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` はデフォルトでは準備状況の確認のみを行います。特定の番号でドライランするには、次を実行します。

```bash
openclaw voicecall smoke --to "+15555550123"
```

ライブの発信通知通話を意図的に開始したい場合にのみ、`--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話が開始してもミーティングに入らない

Meet イベントが電話のダイヤルイン詳細を公開していることを確認します。正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

プロバイダーが PIN 入力前に一時停止を必要とする場合は、`--dtmf-sequence` で先頭の `w` またはカンマを使用します。

電話通話は作成されたものの、Meet の参加者一覧にダイヤルイン参加者が表示されない場合は、次を確認します。

- `openclaw googlemeet doctor <session-id>` を実行して、委任された Twilio 通話 ID、DTMF がキューに入ったかどうか、導入あいさつが要求されたかどうかを確認します。
- `openclaw voicecall status --call-id <id>` を実行して、通話がまだアクティブであることを確認します。
- `openclaw voicecall tail` を実行して、Twilio Webhook が Gateway に到着していることを確認します。
- `openclaw logs --follow` を実行して、Twilio Meet シーケンスを探します。Google Meet が参加を委任し、Voice Call が事前接続 DTMF TwiML を保存して配信し、Voice Call が Twilio 通話用のリアルタイム TwiML を配信し、その後 Google Meet が `voicecall.speak` で導入音声を要求します。
- `openclaw googlemeet setup --transport twilio` を再実行します。緑のセットアップチェックは必須ですが、ミーティング PIN シーケンスが正しいことを証明するものではありません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認します。
- Meet の応答が遅い場合、または事前接続 DTMF の送信後も通話トランスクリプトに PIN を求めるプロンプトが残る場合は、`voiceCall.dtmfDelayMs` をデフォルトの 12 秒から増やします。
- 参加者は参加したがあいさつが聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` 要求と、メディアストリーム TTS 再生または Twilio `<Say>` フォールバックを確認します。通話トランスクリプトにまだ「enter the meeting PIN」が含まれる場合、その電話レッグはまだ Meet ルームに参加していないため、ミーティング参加者には音声が聞こえません。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグします。プロバイダーは `plugins.entries.voice-call.config.publicUrl` または設定済みのトンネルに到達できる必要があります。[Voice call のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注記

Google Meet の公式メディア API は受信指向のため、Meet 通話で発話するには引き続き参加者経路が必要です。この Plugin はその境界を明確に保ちます。Chrome はブラウザー参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルイン参加を処理します。

Chrome のトークバックモードには、`BlackHole 2ch` に加えて次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClaw がブリッジを所有し、これらのコマンドと選択されたプロバイダーの間で `chrome.audioFormat` の音声をパイプします。エージェントモードはリアルタイム文字起こしと通常の TTS を使用し、bidi モードはリアルタイム音声プロバイダーを使用します。デフォルトの Chrome 経路は 24 kHz PCM16、`chrome.audioBufferBytes: 4096` です。8 kHz G.711 mu-law は、レガシーなコマンドペア向けに引き続き利用できます。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声経路全体を所有し、そのデーモンの開始または検証後に終了する必要があります。これは `bidi` の場合のみ有効です。`agent` モードでは TTS のためにコマンドペアへの直接アクセスが必要だからです。

エージェントがエージェントモードで `google_meet` ツールを呼び出すと、ミーティングコンサルタントセッションは参加者の発話に応答する前に、呼び出し元の現在のトランスクリプトをフォークします。Meet セッションは引き続き別のままです（`agent:<agentId>:subagent:google-meet:<sessionId>`）。そのため、ミーティングのフォローアップが呼び出し元のトランスクリプトを直接変更することはありません。

クリーンな双方向音声のために、Meet の出力と Meet のマイクを別々の仮想デバイス、または Loopback 形式の仮想デバイスグラフにルーティングします。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話にエコーバックされる可能性があります。

コマンドペアの Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人間が話し始めたときにアシスタントの再生をクリアできます。これにより、アシスタント再生中に共有 BlackHole ループバック入力が一時的に抑制されている場合でも、人間の発話がアシスタント出力より優先されます。`chrome.audioInputCommand` や `chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。明示的に信頼できるコマンドパスまたは引数リストを使用し、信頼できない場所のスクリプトを指さないでください。

`googlemeet speak` は、Chrome セッションのアクティブなトークバック音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin を通じて委任された Twilio セッションでは、`leave` は基盤となる音声通話も切断します。API 管理スペースのアクティブな Google Meet 会議も閉じたい場合は、`googlemeet end-active-conference` を使用します。

## 関連

- [Voice Call Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
