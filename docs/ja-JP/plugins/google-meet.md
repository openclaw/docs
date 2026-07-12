---
read_when:
    - OpenClawエージェントをGoogle Meet通話に参加させたい場合
    - OpenClawエージェントに新しいGoogle Meet通話を作成させる場合
    - Google Meet のトランスポートとして Chrome、Chrome node、または Twilio を設定しています
summary: Google Meet Plugin：Chrome または Twilio を使用して明示的な Meet URL に参加し、エージェントの音声応答をデフォルトで有効化
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-07-12T14:38:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

`google-meet` Plugin は、OpenClaw エージェントに代わって明示的な Meet URL に参加します。意図的に対象を限定しています。

- `https://meet.google.com/...` URL にのみ参加します。自ら検出した電話番号を使って会議にダイヤルインすることはありません。
- `googlemeet create` は、Google Meet API（またはブラウザーのフォールバック）を使用して新しい Meet URL を発行でき、デフォルトではその会議に参加します。
- Chrome からの参加には、ログイン済みの Chrome プロファイルを使用します。必要に応じて、ペアリング済み Node 上で実行できます。Twilio からの参加では、[Voice call Plugin](/ja-JP/plugins/voice-call) を通じて電話番号と PIN/DTMF をダイヤルします。Meet URL に直接ダイヤルすることはできません。
- `mode: "agent"`（デフォルト）は、リアルタイムプロバイダーで参加者の発言を文字起こしし、設定された OpenClaw エージェントにルーティングして、通常の OpenClaw TTS で回答を読み上げます。`mode: "bidi"` では、リアルタイム音声モデルが直接回答します。`mode: "transcribe"` は、応答音声なしの観察専用モードで参加します。
- Plugin が通話に参加するとき、同意に関するアナウンスは自動では行われません。
- CLI コマンドは `googlemeet` です。`meet` は、より広範なエージェントの電話会議ワークフロー用に予約されています。

## クイックスタート

ローカルの音声依存関係をインストールしてから、リアルタイムプロバイダーのキーを設定します。`agent` モードでは OpenAI がデフォルトの文字起こしプロバイダーです。Google Gemini Live は、`bidi` モードの音声プロバイダーとして利用できます。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# bidi モードで realtime.voiceProvider が "google" の場合のみ必要
export GEMINI_API_KEY=...
```

`blackhole-2ch` は、Chrome が音声をルーティングする `BlackHole 2ch` 仮想オーディオデバイスをインストールします。Homebrew のインストーラーを使用した場合、macOS がデバイスを認識するには再起動が必要です。

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

セットアップを確認してから参加します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` の出力はエージェントが読み取り可能で、モードとトランスポートを考慮します。Chrome プロファイル、Node の固定、およびリアルタイム Chrome 参加の場合は BlackHole/SoX オーディオブリッジと遅延イントロのチェックを報告します。観察専用の参加では、リアルタイムの前提条件を省略します。

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio への委任が設定されている場合、`setup` は `voice-call`、Twilio 認証情報、公開 Webhook が使用可能かどうかも報告します。エージェントが参加する前に、対象のトランスポート／モードで `ok: false` となるチェックはすべてブロッカーとして扱ってください。機械可読の出力には `--json` を使用し、特定のトランスポートを事前に確認するには `--transport chrome|chrome-node|twilio` を使用します。

```bash
openclaw googlemeet setup --transport twilio
```

または、エージェントに `google_meet` ツールを通じて参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

macOS 以外の Gateway ホストでも、`google_meet` はアーティファクト、カレンダー、セットアップ、文字起こし、Twilio、`chrome-node` の各アクションで引き続き表示されます。ただし、ローカル Chrome の応答音声（`transport: "chrome"` と `mode: "agent"` または `"bidi"` の組み合わせ）は、オーディオブリッジに到達する前にブロックされます。これは、現時点でこの経路が macOS の `BlackHole 2ch` に依存しているためです。代わりに `mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### 会議を作成する

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` には 2 つの経路があり、結果の `source` フィールドで報告されます。

- **`api`**：Google Meet OAuth 認証情報が設定されている場合に使用されます。動作は決定的で、ブラウザー UI の状態には依存しません。
- **`browser`**：OAuth 認証情報がない場合に使用されます。OpenClaw は、固定された Chrome Node 上で `https://meet.google.com/new` を開き、Google が実際の会議コード URL にリダイレクトするまで待機します。その Node 上の OpenClaw Chrome プロファイルは、あらかじめ Google にログインしている必要があります。参加と作成のどちらでも、新しいタブを開く前に、既存の Meet タブ（または処理中の `.../new`／Google アカウントのプロンプトタブ）を再利用します。タブの照合では、`authuser` のような無害なクエリ文字列を無視します。

`create` はデフォルトで参加し、`joined: true` と参加セッションを返します。URL の発行だけを行うには、`--no-join`（CLI）または `"join": false`（ツール）を指定します。

API で作成したルームでは、Google アカウントのデフォルトを継承せず、明示的なアクセスポリシーを設定します。

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | ノックせずに参加できるユーザー                                      |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Meet URL を知っているすべてのユーザー                              |
| `TRUSTED`       | ホスト組織の信頼済みユーザー、招待された外部ユーザー、ダイヤルインユーザー |
| `RESTRICTED`    | 招待されたユーザーのみ                                              |

これは API で作成したルームにのみ適用されるため、OAuth の設定が必要です。このオプションが追加される前に認証した場合は、OAuth consent screen に `meetings.space.settings` スコープを追加した後、`openclaw googlemeet auth login --json` を再実行してください。

ブラウザーのフォールバックで Google ログインまたは Meet の権限ブロッカーが発生した場合、ツールは `manualActionRequired: true` を、`manualActionReason`、`manualActionMessage`、`browser.nodeId`／`browser.targetId`／`browserUrl` とともに返します。そのメッセージを報告し、オペレーターがブラウザーでの手順を完了するまで、新しい Meet タブを開かないでください。

### 観察専用で参加する

`"mode": "transcribe"` を設定すると、双方向リアルタイムブリッジを省略します（BlackHole/SoX は不要で、応答音声もありません）。文字起こしモードの Chrome 参加では、OpenClaw によるマイク／カメラ権限の付与と Meet の **Use microphone** 経路も省略します。Meet に音声選択の中間画面が表示された場合、自動化は最初に **Continue without microphone** を試みます。このモードの管理対象 Chrome トランスポートでは、ベストエフォートの Meet 字幕オブザーバーをインストールします。`googlemeet status --json` と `googlemeet doctor` は、`captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`、および `recentTranscript` の末尾部分を報告します。

上限付きのセッション文字起こしを取得するには、追跡対象の Meet タブを正確に読み取ります。

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

オブザーバーは、Meet ページ内に完了済みの字幕行を最大 2,000 行保持します。表示中の漸進的なテキストは、字幕行が完了するまでステータスのヘルス末尾部分に残るため、`nextIndex` を保存しても後続のテキスト展開を取りこぼすことはありません。退出時には、スナップショットの前に表示中の行が確定されます。上限を超えたときに先頭から失われた行数は、`droppedLines` で報告されます。直近に終了した 4 件のセッションの文字起こしは、Gateway が再起動するまで引き続き読み取れます。それより古い終了済み文字起こしは `evicted: true` を返します。これは意図的にランタイムメモリに保持されるもので、永続的な会議履歴ストレージではありません。Gateway の再起動、スナップショット前のタブの終了、または記載された上限の超過により、字幕が失われる可能性があります。

はい／いいえ形式のリッスンプローブを実行するには、次のコマンドを使用します。

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

文字起こしモードで参加し、新しい字幕／文字起こしの変化を待機して、`listenVerified`、`listenTimedOut`、手動操作フィールド、および現在の字幕ヘルスを返します。

### リアルタイムセッションのヘルス

応答音声を伴うセッション中、`google_meet` のステータスは Chrome／オーディオブリッジのヘルスを報告します。これには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最新の入出力タイムスタンプ、バイトカウンター、ブリッジ終了状態が含まれます。管理対象の Chrome セッションは、ヘルスが `inCall: true` を報告した後にのみ、イントロ／テストフレーズを読み上げます。それ以外の場合は `speechReady: false` となり、何も起きないまま黙って処理されるのではなく、発話の試行がブロックされます。

ローカル Chrome は、ログイン済みの OpenClaw ブラウザープロファイルを通じて参加し、マイク／スピーカー経路に `BlackHole 2ch` が必要です。最初のスモークテストには BlackHole デバイスが 1 つあれば十分ですが、エコーが発生する場合があります。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のグラフを使用してください。

## ローカル Gateway + Parallels Chrome

macOS VM に Chrome を提供するだけであれば、完全な Gateway やモデル API キーを VM 内に用意する必要はありません。Gateway とエージェントはローカルで実行し、Node ホストを VM 内で実行します。

| 実行場所             | 内容                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway ホスト       | OpenClaw Gateway、エージェントワークスペース、モデル／API キー、リアルタイムプロバイダー、Google Meet Plugin の設定 |
| Parallels macOS VM   | OpenClaw CLI／Node ホスト、Chrome、SoX、BlackHole 2ch、Google にログイン済みの Chrome プロファイル |
| VM 内では不要        | Gateway サービス、エージェント設定、モデルプロバイダーのセットアップ                         |

VM の依存関係をインストールし、再起動して確認します。

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM 内で Plugin を有効にし、Node ホストを起動します。

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` が TLS を使用しない LAN IP の場合は、その信頼できるプライベートネットワークの使用を明示的に許可します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

LaunchAgent としてインストールするときも同じフラグを使用します（これはプロセス環境であり、インストールコマンドに指定されている場合は LaunchAgent の環境に保存されます。`openclaw.json` の設定ではありません）。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Gateway ホストから Node を承認し、`googlemeet.chrome` とブラウザー機能／`browser.proxy` の両方が公開されていることを確認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Meet をその Node 経由でルーティングします。

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

これで、Gateway ホストから通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

セッションを作成または再利用し、既知のフレーズを読み上げ、セッションのヘルスを出力する 1 コマンドのスモークテストには、次を使用します。

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

リアルタイム参加時には、ブラウザー自動化がゲスト名を入力し、Join／Ask to join をクリックして、Meet の初回表示の "Use microphone" プロンプトが表示された場合はそれを承認します（観察専用での参加およびブラウザーのみでの会議作成時は "Continue without microphone"）。プロファイルがログアウトしている場合、Meet がホストの承認を待っている場合、Chrome にマイク／カメラの権限が必要な場合、または Meet が未解決のプロンプトで停止している場合、結果は `manualActionRequired: true` を `manualActionReason` および `manualActionMessage` とともに報告します。再試行を停止し、そのメッセージを `browserUrl`／`browserTitle` とともに報告して、手動操作が完了した後にのみ再試行してください。

`chromeNode.node` を省略した場合、`googlemeet.chrome` とブラウザー制御の両方を公開する接続済み Node がちょうど 1 つ存在するときに限り、OpenClaw が自動選択します。対応可能な Node が複数接続されている場合は、`chromeNode.node`（Node ID、表示名、またはリモート IP）を固定してください。

### 一般的な失敗の確認項目

| 症状                                                     | 修正方法                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | 固定された Node は認識されていますが、利用できません。セットアップを妨げている要因を報告してください。依頼されない限り、別のトランスポートへ暗黙的にフォールバックしないでください。                                                                                           |
| `No connected Google Meet-capable node`                  | VM で `openclaw node run` を実行し、ペアリングを承認してから、そこで `openclaw plugins enable google-meet` と `openclaw plugins enable browser` を実行します。`gateway.nodes.allowCommands` に `googlemeet.chrome` と `browser.proxy` が含まれていることを確認してください。 |
| `BlackHole 2ch audio device not found`                   | チェック対象のホストに `blackhole-2ch` をインストールし、再起動してください。                                                                                                                                                                                                 |
| `BlackHole 2ch audio device not found on the node`       | VM に `blackhole-2ch` をインストールし、VM を再起動してください。                                                                                                                                                                                                              |
| Chrome は開くが参加できない                              | VM のブラウザープロファイルにログインするか、`chrome.guestName` を設定したままにしてください。ゲストの自動参加では、Node のブラウザープロキシを介して OpenClaw のブラウザー自動化を使用します。Node の `browser.defaultProfile`（または既存セッションを使用する名前付きプロファイル）を、使用するプロファイルに指定してください。 |
| Meet タブが重複する                                     | `chrome.reuseExistingTab: true` のままにしてください。OpenClaw は同じ URL の既存タブをアクティブ化し、別のタブを開く前に、作成処理中の `.../new` タブまたは Google アカウントのプロンプトタブを再利用します。                                                                     |
| 音声がない                                               | Meet のマイクとスピーカーを OpenClaw が使用する仮想オーディオ経路にルーティングしてください。クリーンな双方向音声には、別々の仮想デバイスまたは Loopback 形式のルーティングを使用します。                                                                                        |

## インストールに関する注意事項

Chrome のトークバックのデフォルト設定では、OpenClaw が同梱も再配布もしない 2 つの外部ツールを使用します。Homebrew を介してホストの依存関係としてインストールしてください。

- `sox`: コマンドライン音声ユーティリティ。Plugin は、デフォルトの 24 kHz PCM16 オーディオブリッジ用に明示的な CoreAudio デバイスコマンドを発行します。
- `blackhole-2ch`: Chrome/Meet がルーティングに使用する `BlackHole 2ch` デバイスを提供する macOS 仮想オーディオドライバー。

SoX のライセンスは `LGPL-2.0-only AND GPL-2.0-only`、BlackHole は GPL-3.0 です。BlackHole を OpenClaw と同梱するインストーラーまたはアプライアンスを構築する場合は、BlackHole のアップストリームライセンスを確認するか、Existential Audio から別途ライセンスを取得してください。

## トランスポート

| トランスポート | 使用する状況                                                                               |
| -------------- | ------------------------------------------------------------------------------------------ |
| `chrome`       | Chrome と音声が Gateway ホスト上で動作する場合                                             |
| `chrome-node`  | Chrome と音声がペアリング済み Node 上で動作する場合（例: Parallels macOS VM）              |
| `twilio`       | Chrome で参加できない場合に、Voice Call Plugin を介して電話ダイヤルインへフォールバックする場合 |

### Chrome

OpenClaw のブラウザー制御を介して Meet URL を開き、ログイン済みの OpenClaw ブラウザープロファイルとして参加します。macOS では、Plugin は起動前に `BlackHole 2ch` を確認し、設定されている場合は Chrome を開く前にオーディオブリッジのヘルスチェック／起動コマンドを実行します。ローカル Chrome では `browser.defaultProfile` でプロファイルを選択します。代わりに、`chrome.browserProfile` は `chrome-node` ホストへ渡されます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome のマイク／スピーカー音声は、ローカルの OpenClaw オーディオブリッジを通じてルーティングされます。`BlackHole 2ch` がインストールされていない場合、音声経路なしで参加する代わりに、セットアップエラーで参加に失敗します。

### Twilio

[Voice Call Plugin](/ja-JP/plugins/voice-call) に委譲される厳格なダイヤルプランです。電話番号を取得するために Meet ページを解析することはありません。Google Meet が会議用の電話ダイヤルイン番号と PIN を公開している必要があります。

Chrome Node ではなく、Gateway ホスト上で Voice Call を有効にします。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // Twilio をデフォルトにする場合は "twilio" を設定
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
            instructions: "OpenClaw エージェントとしてこの Google Meet に参加してください。簡潔に話してください。",
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

シークレットを `openclaw.json` に含めないように、Twilio の認証情報は環境変数で指定します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

リアルタイム音声プロバイダーが OpenAI の場合は、代わりに `OPENAI_API_KEY` とともに `realtime.provider: "openai"` を使用します。

`voice-call` を有効にした後、Gateway を再起動または再読み込みしてください。Plugin の設定変更は、再読み込みするまで反映されません。次のコマンドで確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio への委譲が接続されると、`googlemeet setup` のチェックに `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` が含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

カスタムシーケンスには `--dtmf-sequence` を使用します。PIN の前に一時停止を挿入するには、先頭に `w` またはカンマを付けます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth と事前確認

`googlemeet create` はブラウザー自動化にフォールバックできるため、Meet リンクの作成に OAuth は必須ではありません。公式 API による作成、スペースの解決、または Meet Media API の事前確認を行う場合は、OAuth を設定してください。Chrome／Chrome-node での参加は OAuth に依存しません。どちらの場合も、ログイン済み Chrome プロファイル、BlackHole／SoX、および（`chrome-node` の場合は）接続済み Node を使用します。

### Google 認証情報を作成する

Google Cloud Console で次の操作を行います。

<Steps>
<Step title="プロジェクトを作成または選択する">
</Step>
<Step title="Google Meet REST API を有効にする">
</Step>
<Step title="OAuth 同意画面を設定する">
Google Workspace 組織では Internal が最も簡単です。個人／テスト環境では External を使用できます。アプリが Testing の間は、認可に使用する各 Google アカウントをテストユーザーとして追加してください。
</Step>
<Step title="要求されるスコープを追加する">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`（カレンダー検索）
- `https://www.googleapis.com/auth/drive.meet.readonly`（文字起こし／スマートノート文書本文のエクスポート）

</Step>
<Step title="OAuth クライアント ID を作成する">
Application type は **Web application**。Authorized redirect URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="クライアント ID とクライアントシークレットをコピーする">
</Step>
</Steps>

`meetings.space.created` は `spaces.create` に必要です。`meetings.space.readonly` は Meet URL／コードをスペースに解決します。`meetings.space.settings` により、API で会議室を作成する際に、OpenClaw が `accessType` などの `SpaceConfig` 設定を渡せるようになります。`meetings.conference.media.readonly` は Meet Media API の事前確認とメディア処理用です。実際に Media API を使用するには、Google による Developer Preview への登録が必要な場合があります。`calendar.events.readonly` は `--today`／`--event` によるカレンダー検索にのみ必要です。`drive.meet.readonly` は `--include-doc-bodies` によるエクスポートにのみ必要です。ブラウザーベースの Chrome 参加だけが必要な場合は、OAuth を完全に省略できます。

### リフレッシュトークンを発行する

`oauth.clientId` と、必要に応じて `oauth.clientSecret` を設定するか、環境変数として渡してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

これにより、`http://localhost:8085/oauth2callback` の localhost コールバックを使用した PKCE フローが実行され、リフレッシュトークンを含む `oauth` 設定ブロックが出力されます。ブラウザーからローカルコールバックにアクセスできない場合は、コピー＆ペースト方式のフロー用に `--manual` を追加します。

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 出力:

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

`oauth` オブジェクトを Plugin 設定の下に保存します。

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

リフレッシュトークンを設定に含めたくない場合は、環境変数を推奨します。最初に設定が解決され、その後、フォールバックとして環境変数が使用されます。会議作成、カレンダー検索、または文書本文エクスポートのサポートが存在する前に認証した場合は、リフレッシュトークンが現在のスコープセットをカバーするように、`openclaw googlemeet auth login --json` を再実行してください。

### doctor で OAuth を確認する

```bash
openclaw googlemeet doctor --oauth --json
```

このコマンドは、Chrome ランタイムを読み込んだり、接続済み Node を必要としたりせずに、OAuth 設定が存在し、リフレッシュトークンからアクセストークンを発行できることを確認します。レポートにはステータスフィールド（`ok`、`configured`、`tokenSource`、`expiresAt`、チェックメッセージ）のみが含まれ、アクセストークン、リフレッシュトークン、クライアントシークレットは決して出力されません。

| チェック             | 意味                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` と `oauth.refreshToken`、またはキャッシュ済みアクセストークンが存在する                  |
| `oauth-token`        | キャッシュ済みアクセストークンがまだ有効であるか、リフレッシュトークンによって新しいトークンが発行された |
| `meet-spaces-get`    | 任意の `--meeting` チェックによって既存の Meet スペースが解決された                                      |
| `meet-spaces-create` | 任意の `--create-space` チェックによって新しい Meet スペースが作成された                                  |

副作用を伴う作成チェックにより、Meet API の有効化と `spaces.create` スコープを確認します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

既存のスペースへの読み取りアクセスを確認します。

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

これらのチェックで `403` が返される場合、通常は Meet REST API が無効になっている、更新トークンに必要なスコープがない、または Google アカウントがそのスペースにアクセスできないことを意味します。更新トークンエラーの場合は、`openclaw googlemeet auth login --json` を再実行し、新しい `oauth` ブロックを保存してください。

ブラウザフォールバックには OAuth は不要です。この場合の Google 認証は、OpenClaw の設定ではなく、選択した Node でログイン済みの Chrome プロファイルから取得されます。

以下の環境変数をフォールバックとして使用できます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

### 解決、事前確認、アーティファクトの読み取り

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet が会議レコードを作成した後は、次を実行します。

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` を指定した場合、`artifacts` と `attendance` はデフォルトで最新の会議レコードを使用します。保持されているすべてのレコードを対象にするには、`--all-conference-records` を渡します。

Calendar 検索では、アーティファクトを読み取る前に Google Calendar からミーティング URL を解決します（Calendar イベントの読み取り専用スコープを含む更新トークンが必要です）。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "週次同期"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` は、Meet リンクを持つイベントを今日の `primary` カレンダーから検索します。`--event <query>` は一致するイベントテキストを検索し、`--calendar <id>` はプライマリ以外のカレンダーを対象にします。`calendar-events` は一致するイベントをプレビューし、`latest`/`artifacts`/`attendance`/`export` がどれを選択するかを示します。

会議レコード ID がすでに分かっている場合は、直接指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

API で作成したスペースのルームを閉じます。

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

`spaces.endActiveConference` を呼び出します。認可済みアカウントが管理できるスペースに対して、`meetings.space.created` スコープを持つ OAuth が必要です。Meet URL、ミーティングコード、または `spaces/{id}` を受け取り、最初に API のスペースリソースへ解決します。これは `googlemeet leave` とは別の操作です。`leave` は OpenClaw のローカルまたはセッションでの参加を停止し、`end-active-conference` はそのスペースで進行中の会議を終了するよう Google Meet に要求します。

読みやすいレポートを書き出します。

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` は、Google が公開している場合、会議レコードのメタデータに加え、参加者、録画、文字起こし、構造化された文字起こしエントリ、スマートノートの各リソースメタデータを返します。大規模なミーティングでエントリ検索を省略するには、`--no-transcript-entries` を使用します。`attendance` は参加者を参加者セッションの行に展開し、最初と最後に確認された時刻、セッションの合計時間、遅刻と早退のフラグを含めます。また、重複する参加者リソースをログイン済みユーザーまたは表示名で統合します。`--no-merge-duplicates` を指定すると未加工のリソースを別々に保持し、`--late-after-minutes`/`--early-before-minutes` でしきい値を調整できます。

`export` は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json` を含むフォルダーを書き出します。`manifest.json` には、選択した入力、エクスポートオプション、会議レコード、出力ファイル、件数、トークンの取得元、使用した Calendar イベント、部分取得の警告が記録されます。`--zip` を指定すると、フォルダーの隣に移植可能なアーカイブも書き出されます。`--include-doc-bodies` は、リンクされた文字起こしやスマートノートの Google Docs テキストを Drive の `files.export` 経由でエクスポートします（Drive Meet の読み取り専用スコープが必要です）。これを指定しない場合、エクスポートには Meet のメタデータと構造化された文字起こしエントリのみが含まれます。アーティファクトの一部でエラー（スマートノートの一覧取得、文字起こしエントリ、ドキュメント本文のエラー）が発生しても、エクスポート全体を失敗させず、概要とマニフェストに警告を保持します。`--dry-run` は同じデータを取得し、フォルダーや ZIP を作成せずにマニフェストの JSON を出力します。

エージェントは `google_meet` ツール（`export`、`accessType` を指定した `create`、`end_active_conference`、`test_listen`）を通じて同じアクションを使用します。[ツール](#tool)を参照してください。

### ライブスモークテスト

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| 変数                                                                                                                      | 用途                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | 保護されたライブテストを有効にする                                     |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | 保持されている Meet URL、コード、または `spaces/{id}`                  |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth クライアント ID                                                  |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | 更新トークン                                                           |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 任意。`OPENCLAW_` プレフィックスのない同名のフォールバックも使用可能   |

基本的なアーティファクトと出席状況のスモークテストには、`meetings.space.readonly` と `meetings.conference.media.readonly` が必要です。Calendar 検索には `calendar.events.readonly` が必要です。Drive のドキュメント本文のエクスポートには `drive.meet.readonly` が必要です。

### 作成例

```bash
openclaw googlemeet create
```

新しいミーティング URI、取得元、参加セッションを出力します。OAuth がある場合は Meet API を使用し、ない場合は固定された Chrome Node のログイン済みプロファイルを使用します。ブラウザフォールバックの JSON は次のとおりです。

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

ブラウザフォールバックが最初に Google ログイン画面または Meet の権限ブロッカーに遭遇した場合、`google_meet` は単純な文字列ではなく、構造化された詳細を返します。

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw のブラウザプロファイルで Google にログインしてから、ミーティングの作成を再試行してください。",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw のブラウザプロファイルで Google にログインしてから、ミーティングの作成を再試行してください。",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Google アカウントにログイン"
  }
}
```

API 作成時の JSON は次のとおりです。

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

作成時はデフォルトで参加しますが、Chrome/Chrome-node からブラウザ経由で参加するには、引き続きログイン済みの Google プロファイルが必要です。ログアウトしている場合、OpenClaw は `manualActionRequired: true` またはブラウザフォールバックエラーを報告し、再試行する前にオペレーターが Google へのログインを完了するよう求めます。

Cloud プロジェクト、OAuth プリンシパル、ミーティング参加者が Meet メディア API 向け Google Workspace Developer Preview Program に登録されていることを確認した後でのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

一般的な Chrome エージェントのパスに必要なのは、Plugin の有効化、BlackHole、SoX、リアルタイムプロバイダーキー、設定済みの OpenClaw TTS プロバイダーのみです。

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

### デフォルト

| キー                              | デフォルト                               | 注記                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` は `"agent"` のレガシーエイリアスとして受け入れられます。新しい呼び出し元では `"agent"` を指定してください                                                                                           |
| `chromeNode.node`                 | 未設定                                   | `chrome-node` の Node ID/名前/IP。対応可能な Node が複数接続される可能性がある場合は必須です                                                                                                                      |
| `chrome.launch`                   | `true`                                   | 参加時に Chrome を起動します。すでに開いているセッションを再利用する場合にのみ `false` に設定してください                                                                                                        |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | ログアウト状態の Meet ゲスト画面に表示されます                                                                                                                                                                   |
| `chrome.autoJoin`                 | `true`                                   | `chrome-node` で可能な範囲でゲスト名を入力し、Join Now をクリックします                                                                                                                                          |
| `chrome.reuseExistingTab`         | `true`                                   | 重複するタブを開かず、既存の Meet タブをアクティブにします                                                                                                                                                        |
| `chrome.waitForInCallMs`          | `20000`                                  | トークバックのイントロが開始される前に、Meet タブが通話中と報告するまで待機します                                                                                                                               |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | コマンドペアの音声形式。`"g711-ulaw-8khz"` は、電話音声を出力するレガシーまたはカスタムのコマンドペア専用です                                                                                                     |
| `chrome.audioBufferBytes`         | `4096`                                   | 生成されたコマンドペア音声コマンド用の SoX 処理バッファ（SoX のデフォルトである 8192 バイトの半分にしてパイプ遅延を低減）。値は最小 17 バイトに制限されます                                                         |
| `chrome.audioInputCommand`        | 生成された SoX コマンド                  | CoreAudio の `BlackHole 2ch` から読み取り、`chrome.audioFormat` の音声を書き込みます                                                                                                                               |
| `chrome.audioOutputCommand`       | 生成された SoX コマンド                  | `chrome.audioFormat` の音声を読み取り、CoreAudio の `BlackHole 2ch` に書き込みます                                                                                                                                |
| `chrome.bargeInInputCommand`      | 未設定                                   | アシスタントの再生中に人間の割り込みを検出するため、符号付き 16 ビットリトルエンディアンのモノラル PCM を書き込む任意のローカルマイクコマンド。Gateway がホストするコマンドペアブリッジに適用されます               |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 人間による割り込みと見なされる RMS レベル                                                                                                                                                                        |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 人間による割り込みと見なされるピークレベル                                                                                                                                                                       |
| `chrome.bargeInCooldownMs`        | `900`                                    | 繰り返される割り込み解除の最小間隔                                                                                                                                                                                |
| `mode`（リクエストごと）         | `"agent"`                                | トークバックモード。[エージェントモードと双方向モード](#agent-and-bidi-modes)の表を参照してください                                                                                                             |
| `realtime.provider`               | `"openai"`                               | 以下のスコープ付きフィールドが未設定の場合に使用される互換性フォールバック                                                                                                                                       |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` モードでリアルタイム文字起こしに使用されるプロバイダー ID                                                                                                                                                 |
| `realtime.voiceProvider`          | 未設定                                   | `bidi` モードで直接リアルタイム音声に使用されるプロバイダー ID。エージェントモードの文字起こしには OpenAI を使用したまま Gemini Live を利用するには `"google"` に設定します。特定の Gemini Live モデルを選択するには `realtime.model` と組み合わせてください。 |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | [エージェントモードと双方向モード](#agent-and-bidi-modes)を参照してください                                                                                                                                      |
| `realtime.instructions`           | 簡潔な音声応答の指示                     | 簡潔に話し、より詳しい回答には `openclaw_agent_consult` を使用するようモデルに指示します                                                                                                                          |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | リアルタイムブリッジの接続時に一度だけ読み上げられます。無音で参加するには `""` に設定します                                                                                                                      |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult` に使用される OpenClaw エージェント ID                                                                                                                                                    |
| `voiceCall.enabled`               | `true`                                   | Twilio PSTN 通話、DTMF、イントロの挨拶を Voice Call Plugin に委任します                                                                                                                                           |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Twilio 経由で PIN から生成した DTMF シーケンスを再生する前の待機時間                                                                                                                                              |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call が Twilio 側の通話を開始した後、リアルタイムのイントロ挨拶を要求するまでの遅延                                                                                                                         |

`chrome.audioBridgeCommand` と `chrome.audioBridgeHealthCommand` を使用すると、`chrome.audioInputCommand`/`chrome.audioOutputCommand` の代わりに外部ブリッジがローカル音声パス全体を管理できます。使用可能なモードに関する制約については、[注記](#notes)を参照してください。

レガシーな `realtime.provider: "google"` 形式には `openclaw doctor --fix` マイグレーションが用意されています。これらのフィールドがまだ設定されていない場合、その意図を `realtime.voiceProvider: "google"` と `realtime.transcriptionProvider: "openai"` に移行します。

### 任意の上書き設定

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
    model: "gemini-3.1-flash-live-preview",
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

エージェントモードの聞き取りと発話の両方に ElevenLabs を使用する場合：

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

Meet で常時使用される音声は `messages.tts.providers.elevenlabs.speakerVoiceId` から取得されます。TTS モデルの上書きが有効な場合、エージェントの応答では応答ごとに `[[tts:speakerVoiceId=... model=eleven_v3]]` ディレクティブも使用できますが、会議では設定が決定論的なデフォルトになります。参加時のログには `transcriptionProvider=elevenlabs` が表示され、音声応答ごとに `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` が記録されます。

Twilio のみの設定：

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

`voiceCall.enabled: true`（デフォルト）かつ Twilio トランスポートの場合、Voice Call はリアルタイムメディアストリームを開く前に DTMF シーケンスを送信し、その後、保存されたイントロテキストをリアルタイムの最初の挨拶として使用します。`voice-call` が有効でない場合でも、Google Meet はダイヤルプランを検証して記録できますが、Twilio 通話を発信することはできません。

`voiceCall.gatewayUrl` を未設定のままにすると、ローカルの信頼された Gateway ランタイムが使用され、通話全体を通して呼び出し元のエージェントが維持されます。Gateway URL を設定した場合は、引き続き明示的な WebSocket ターゲットとなり、Plugin の出自を認証できません。デフォルト以外のエージェントの参加は、別のエージェントを暗黙的に使用せず、フェイルクローズします。エージェント単位のルーティングが必要な場合は、Google Meet と Voice Call を同じ Gateway プロセスで実行してください。

## ツール

エージェントは `google_meet` ツールを使用します。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | 目的                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `join`                  | 明示的な Meet URL に参加する                                                                              |
| `create`                | スペースを作成する（デフォルトでは参加も行う）。`accessType`/`entryPointAccess` をサポート                 |
| `status`                | アクティブなセッションを一覧表示するか、`sessionId` で個別に確認する                                      |
| `setup_status`          | `googlemeet setup` と同じチェックを実行する                                                               |
| `resolve_space`         | URL、コード、または `spaces/{id}` を `spaces.get` で解決する                                              |
| `preflight`             | OAuth とミーティング解決の前提条件を検証する                                                              |
| `latest`                | ミーティングの最新の会議レコードを検索する                                                                |
| `calendar_events`       | Meet リンクを含む Calendar イベントをプレビューする                                                       |
| `artifacts`             | 会議レコードと、参加者、録画、文字起こし、スマートノートのメタデータを一覧表示する                        |
| `attendance`            | 参加者と参加者セッションを一覧表示する                                                                    |
| `export`                | 成果物、出席情報、文字起こし、マニフェストのバンドルを書き出す。マニフェストのみの場合は `"dryRun": true` |
| `recover_current_tab`   | 新しいタブを開かずに、既存の Meet タブへフォーカスして確認する                                            |
| `transcript`            | 上限付きの字幕文字起こしを読み取る。`sinceIndex` で前回の `nextIndex` から再開する                         |
| `leave`                 | セッションを終了する（Chrome では Leave をクリックし、自身が開いたタブのみを閉じる。Twilio は切断する）  |
| `end_active_conference` | API 管理のスペースでアクティブな Google Meet 会議を終了する                                               |
| `speak`                 | `sessionId` と `message` を指定し、リアルタイムエージェントに即座に発話させる                              |
| `test_speech`           | セッションを作成または再利用し、既知のフレーズを発話させ、Chrome の健全性を返す                           |
| `test_listen`           | リスニング専用セッションを作成または再利用し、字幕または文字起こしの進行を待つ                            |

`test_speech` は常に `mode: "agent"` または `"bidi"` を強制し、`mode: "transcribe"` での実行を要求された場合は失敗します。リスニング専用セッションでは音声を出力できないためです。その `speechOutputVerified` の結果は、その呼び出し中にリアルタイム音声出力バイト数が増加したかどうかに基づくため、再利用されたセッションに以前の音声があっても、新しいチェックとしては扱われません。

Chrome トランスポートでは、`leave` は Meet の Leave call ボタンをクリックした後も、再利用されたユーザー所有のタブを開いたままにします。OpenClaw が開いたタブは退出後に閉じられます。

Chrome が Gateway ホストで動作する場合は `transport: "chrome"`、ペアリングされた Node で動作する場合は `transport: "chrome-node"` を使用します。どちらの場合も、モデルプロバイダーと `openclaw_agent_consult` は Gateway ホストで動作するため、モデルの認証情報はそこに保持されます。エージェントモードのログには、ブリッジ起動時に解決された文字起こしプロバイダーとモデルが記録され、合成された各応答の後に TTS プロバイダー、モデル、音声、出力形式、サンプルレートが記録されます。生の `mode: "realtime"` は、`mode: "agent"` のレガシー互換エイリアスとして引き続き受け付けられますが、ツールの `mode` 列挙型には表示されなくなりました。

API バックエンドのルームと明示的なアクセスポリシーを指定した `create`：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

既知のルームでアクティブな会議を終了する：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

ミーティングが有用であると判断する前に、まずリスニングを検証する：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

オンデマンドで発話する：

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "正確に次のように言ってください：私はここにいて、聞いています。"
}
```

`status` には、利用可能な場合に Chrome の健全性が含まれます。

| フィールド                                                            | 意味                                                                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome が Meet 通話内にいるように見える                                                                                            |
| `micMuted`                                                            | ベストエフォートで判定した Meet のマイク状態                                                                                       |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 発話を機能させる前に、ブラウザープロファイルで手動ログイン、Meet ホストによる参加承認、権限付与、またはブラウザー制御の修復が必要 |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 管理対象 Chrome で現在発話が許可されているか。`speechReady: false` は、OpenClaw が導入またはテストフレーズを送信しなかったことを意味する |
| `providerConnected` / `realtimeReady`                                 | リアルタイム音声ブリッジの状態                                                                                                     |
| `lastInputAt` / `lastOutputAt`                                        | ブリッジから最後に受信した、またはブリッジへ最後に送信した音声                                                                      |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet タブのメディア出力がブリッジの BlackHole デバイスへ能動的にルーティングされたか                                                |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | アシスタントの再生中に無視されたループバック入力                                                                                    |

## エージェントモードと bidi モード

| モード  | 応答を決定する主体              | 音声出力経路                             | 使用する場面                                             |
| ------- | ------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `agent` | 設定された OpenClaw エージェント | 通常の OpenClaw TTS ランタイム            | 「自分のエージェントがミーティングに参加している」動作が必要な場合 |
| `bidi`  | リアルタイム音声モデル           | リアルタイム音声プロバイダーの音声応答    | 最低レイテンシーの対話型音声ループが必要な場合           |

`agent` モード：リアルタイム文字起こしプロバイダーがミーティング音声を聞き取り、参加者の確定文字起こしを設定済みの OpenClaw エージェントにルーティングし、応答を通常の OpenClaw TTS で発話します。近接する確定文字起こしの断片はコンサルト前にまとめられるため、1 回の発話ターンから古い部分応答が複数生成されることはありません。キュー内のアシスタント音声が再生されている間はリアルタイム入力が抑制され、コンサルト前に最近のアシスタントらしい文字起こしのエコーが無視されるため、BlackHole のループバックによってエージェントが自身の発話に応答することはありません。

`bidi` モード：リアルタイム音声モデルが直接応答し、より深い推論、最新情報、または通常の OpenClaw ツールが必要な場合は `openclaw_agent_consult` を呼び出せます。コンサルトツールは、直近のミーティング文字起こしコンテキストを使って通常の OpenClaw エージェントをバックグラウンドで実行し、発話向けの簡潔な回答を返します。`agent` モードでは OpenClaw がその回答を TTS に直接送信し、`bidi` モードではリアルタイム音声モデルがそれを読み上げられます。Voice Call と同じ共有コンサルト機構を使用します。

デフォルトでは、コンサルトは `main` エージェントに対して実行されます。Meet レーンを専用のエージェントワークスペース、モデルのデフォルト設定、ツールポリシー、メモリ、セッション履歴に関連付けるには、`realtime.agentId` を設定します。エージェントモードのコンサルトでは、ミーティングごとの `agent:<id>:subagent:google-meet:<session>` セッションキーが使用されるため、フォローアップの質問は通常のエージェントポリシーを継承しながらミーティングのコンテキストを維持します。エージェントがエージェントモードで `google_meet` を呼び出すと、参加者の発話に応答する前に、コンサルタントセッションが呼び出し元の現在の文字起こしからフォークされます。Meet セッションは分離されたままなので、ミーティング内のフォローアップによって呼び出し元の文字起こしが直接変更されることはありません。

`realtime.toolPolicy` はコンサルトの実行を制御します。

| ポリシー         | 動作                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | コンサルトツールを公開し、通常のエージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限する |
| `owner`          | コンサルトツールを公開し、通常のエージェントが通常のツールポリシーを使用できるようにする                                         |
| `none`           | リアルタイム音声モデルにコンサルトツールを公開しない                                                                             |

コンサルトのセッションキーは Meet セッションごとにスコープされるため、同じミーティング中のフォローアップのコンサルト呼び出しでは、以前のコンサルトコンテキストが再利用されます。

Chrome が完全に参加した後、発話による準備状況チェックを強制する：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

参加から発話までを行う完全なスモークテスト：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストのチェックリスト

無人エージェントにミーティングを任せる前に：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待される Chrome-node の状態：

- `googlemeet setup` がすべて成功しており、Chrome-node がデフォルトのトランスポートであるか、Node が固定されている場合は `chrome-node-connected` が含まれている。
- `nodes status` に、選択した Node が接続済みとして表示され、`googlemeet.chrome` と `browser.proxy` の両方が公開されている。
- Meet タブが参加し、`test-speech` が `inCall: true` を含む Chrome の健全性を返す。

Parallels macOS VM のようなリモート Chrome ホストでは、Gateway または VM の更新後に行う最短で安全なチェックは次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、エージェントが実際のミーティングタブを開く前に、Gateway Plugin が読み込まれていること、VM の Node が現在のトークンで接続されていること、Meet 音声ブリッジが利用可能であることが確認されます。

Twilio のスモークテストには、電話によるダイヤルイン情報を公開するミーティングを使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待される Twilio の状態：

- `googlemeet setup` には、緑色の `twilio-voice-call-plugin`、`twilio-voice-call-credentials`、`twilio-voice-call-webhook` チェックが含まれます。
- `voicecall` は Gateway のリロード後に CLI で使用できます。
- 返されるセッションには `transport: "twilio"` と `twilio.voiceCallId` があります。
- `openclaw logs --follow` には、リアルタイム TwiML より先に DTMF TwiML が提供され、続いて最初の挨拶がキューに追加されたリアルタイムブリッジが表示されます。
- `googlemeet leave <sessionId>` は、委譲された音声通話を切断します。

## トラブルシューティング

### エージェントから Google Meet ツールが見えない

Plugin が有効であることを確認し、Gateway をリロードしてください。実行中のエージェントから見えるのは、現在の Gateway プロセスによって登録された Plugin ツールだけです。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

macOS 以外の Gateway ホストでも `google_meet` は表示されたままですが、ローカル Chrome の音声応答アクションは、オーディオブリッジに到達する前にブロックされます。デフォルトのローカル Chrome エージェント経路の代わりに、`mode: "transcribe"`、Twilio ダイヤルイン、または macOS の `chrome-node` ホストを使用してください。

### 接続済みの Google Meet 対応 Node がない

Node ホストで次を実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ホストで次を実行します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node は接続済みで、`googlemeet.chrome` と `browser.proxy` の両方が一覧に表示される必要があります。また、Gateway 設定で両方を許可する必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` の `chrome-node-connected` が失敗する場合、または Gateway ログに `gateway token mismatch` と表示される場合は、現在の Gateway トークンを使用して Node を再インストールまたは再起動してください。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、Node サービスをリロードし、次を再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ブラウザーは開くがエージェントが参加できない

監視のみの参加には `googlemeet test-listen`、リアルタイム参加には `googlemeet test-speech` を実行し、返された Chrome の健全性情報を確認してください。いずれかで `manualActionRequired: true` が報告された場合は、オペレーターに `manualActionMessage` を表示し、ブラウザーでの操作が完了するまで再試行を停止してください。

一般的に必要となる手動操作：Chrome プロファイルにログインする、Meet のホストアカウントからゲストの参加を許可する、ネイティブプロンプトが表示されたときに Chrome のマイク／カメラ権限を付与する、停止した Meet の権限ダイアログを閉じるか修復する。

Meet に「Do you want people to hear you in the meeting?」と表示されたという理由だけで「ログインしていない」と報告しないでください。これは Meet の音声選択インタースティシャルです。利用可能な場合、OpenClaw はブラウザー自動化によって **Use microphone** をクリックし、実際の会議状態を待ち続けます。作成専用のブラウザーフォールバックでは、URL の発行にリアルタイム音声経路が不要なため、代わりに **Continue without microphone** をクリックすることがあります。

### 会議の作成に失敗する

OAuth が設定されている場合、`googlemeet create` は Meet API の `spaces.create` を使用し、それ以外の場合は固定された Chrome Node ブラウザーを使用します。次を確認してください。

- **API による作成**：`oauth.clientId` と `oauth.refreshToken`（または対応する `OPENCLAW_GOOGLE_MEET_*` 環境変数）が存在し、作成サポートの追加後にリフレッシュトークンが発行されていること。古いトークンには `meetings.space.created` が含まれていない場合があるため、`openclaw googlemeet auth login --json` を再実行してください。
- **ブラウザーフォールバック**：`defaultTransport: "chrome-node"` と `chromeNode.node` が、`browser.proxy` と `googlemeet.chrome` を備えた接続済み Node を指していること。その Node 上の OpenClaw Chrome プロファイルがログイン済みで、`https://meet.google.com/new` を開けること。
- **ブラウザーフォールバックの再試行**：新しいタブを開く前に、既存の `.../new` タブまたは Google アカウントのプロンプトタブを再利用してください。別のタブを手動で開くのではなく、ツール呼び出しを再試行してください。
- **手動操作**：ツールが `manualActionRequired: true` を返した場合は、`browser.nodeId`、`browser.targetId`、`browserUrl`、`manualActionMessage` を使用してオペレーターを案内してください。ループで再試行しないでください。
- **音声選択インタースティシャル**：Meet に「Do you want people to hear you in the meeting?」と表示された場合は、タブを開いたままにしてください。OpenClaw は **Use microphone** または（作成専用の場合）**Continue without microphone** をクリックし、生成された URL を待ち続ける必要があります。それができない場合、エラーには `google-login-required` ではなく `meet-audio-choice-required` が記載される必要があります。

### エージェントは参加するが話さない

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

STT -> OpenClaw エージェント -> TTS の経路には `mode: "agent"`、直接リアルタイム音声フォールバックには `mode: "bidi"` を使用してください。`mode: "transcribe"` では意図的に音声応答ブリッジを開始しません。監視のみのデバッグでは、参加者が話した後に `openclaw googlemeet status --json <session-id>` を実行し、`captioning`、`transcriptLines`、`lastCaptionText` を確認してください。`inCall` が true でも `transcriptLines` が `0` のままの場合、Meet の字幕が無効になっている、オブザーバーの導入後に誰も話していない、Meet の UI が変更された、または会議の言語／アカウントでライブ字幕を利用できない可能性があります。

`googlemeet test-speech` は常にリアルタイム経路を確認し、その呼び出しでブリッジの出力バイトが観測されたかどうかを報告します。`speechOutputVerified` が false で `speechOutputTimedOut` が true の場合、リアルタイムプロバイダーが発話を受け付けたものの、新しい出力バイトが Chrome オーディオブリッジに到達したことを OpenClaw が確認できなかった可能性があります。

次も確認してください。リアルタイムプロバイダーキー（`OPENAI_API_KEY` または `GEMINI_API_KEY`）が Gateway ホストで使用可能であること、Chrome ホストで `BlackHole 2ch` が表示されること、そのホストに `sox` が存在すること、Meet のマイク／スピーカーが仮想オーディオ経路を介してルーティングされていること（ローカル Chrome のリアルタイム参加では、`doctor` に `meet output routed: yes` と表示される必要があります）。

`googlemeet doctor [session-id]` は、セッション、Node、通話中の状態、手動操作の理由、リアルタイムプロバイダー接続、`realtimeReady`、音声入出力アクティビティ、最後の音声タイムスタンプ、バイトカウンター、ブラウザー URL を出力します。未加工の JSON には `googlemeet status [session-id] --json` を使用し、トークンを公開せずに OAuth の更新を確認するには `googlemeet doctor --oauth`（`--meeting` または `--create-space` を追加）を使用してください。

エージェントがタイムアウトし、Meet タブがすでに開いている場合は、別のタブを開かずに調査してください。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

同等のツールアクションは `recover_current_tab` です。新しいタブやセッションを開かずに、選択したトランスポート（`chrome` の場合はローカルブラウザー制御、`chrome-node` の場合は設定済み Node）で既存の Meet タブにフォーカスして調査し、現在の阻害要因（ログイン、参加許可、権限、音声選択状態）を報告します。CLI コマンドは設定済みの Gateway と通信するため、Gateway が実行中である必要があります。`chrome-node` では Node も接続済みである必要があります。

### Twilio のセットアップチェックに失敗する

`voice-call` が許可または有効化されていない場合、`twilio-voice-call-plugin` は失敗します。`plugins.allow` に追加し、`plugins.entries.voice-call` を有効にして、Gateway をリロードしてください。

Twilio バックエンドにアカウント SID、認証トークン、または発信元番号がない場合、`twilio-voice-call-credentials` は失敗します。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` に公開 Webhook がない場合、または `publicUrl` がループバック／プライベートネットワーク空間を指している場合、`twilio-voice-call-webhook` は失敗します。`publicUrl` に `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` を使用しないでください。通信事業者からのコールバックはこれらに到達できません。`plugins.entries.voice-call.config.publicUrl` を公開 URL に設定するか、トンネル／Tailscale 公開を設定してください。

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

ローカル開発では、プライベートホスト URL の代わりにトンネルまたは Tailscale 公開を使用してください。

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

Gateway を再起動またはリロードしてから、次を実行します。

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

デフォルトでは、`voicecall smoke` は準備状態の確認のみを行います。特定の番号に対してドライランを実行するには、次を使用します。

```bash
openclaw voicecall smoke --to "+15555550123"
```

意図的に実際の発信通話を開始する場合にのみ、`--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話は開始するが会議に参加しない

Meet イベントに電話ダイヤルイン情報が公開されていることを確認し、正確なダイヤルイン番号と PIN、またはカスタム DTMF シーケンスを渡してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN の前に一時停止を入れるには、`--dtmf-sequence` の先頭に `w` またはカンマを使用してください。

通話が作成されても Meet の参加者一覧にダイヤルイン参加者が表示されない場合：

- `openclaw googlemeet doctor <session-id>`：委譲された Twilio 通話 ID、DTMF がキューに追加されたかどうか、導入時の挨拶が要求されたかどうかを確認します。
- `openclaw voicecall status --call-id <id>`：通話がまだアクティブであることを確認します。
- `openclaw voicecall tail`：Twilio Webhook が Gateway に到着していることを確認します。
- `openclaw logs --follow`：Twilio Meet シーケンスを探します。Google Meet が参加を委譲し、Voice Call が接続前 DTMF TwiML を保存して提供し、Twilio 通話用のリアルタイム TwiML を提供した後、Google Meet が `voicecall.speak` で導入音声を要求します。
- `openclaw googlemeet setup --transport twilio` を再実行してください。緑色のセットアップチェックは必須ですが、会議の PIN シーケンスが正しいことを証明するものではありません。
- ダイヤルイン番号が、PIN と同じ Meet 招待およびリージョンに属していることを確認してください。
- Meet の応答が遅い場合、または接続前 DTMF の送信後も通話の文字起こしに PIN プロンプトが表示される場合は、`voiceCall.dtmfDelayMs` をデフォルトの 12 秒から増やしてください。
- 参加者は参加できても挨拶が聞こえない場合は、`openclaw logs --follow` で DTMF 後の `voicecall.speak` リクエストと、メディアストリームの TTS 再生または Twilio の `<Say>` フォールバックを確認してください。文字起こしに「enter the meeting PIN」と引き続き表示される場合、電話側はまだ Meet ルームに参加していないため、参加者には音声が聞こえません。

Webhook が到着しない場合は、まず Voice Call Plugin をデバッグしてください。プロバイダーが `plugins.entries.voice-call.config.publicUrl` または設定済みのトンネルに到達できる必要があります。[音声通話のトラブルシューティング](/ja-JP/plugins/voice-call#troubleshooting)を参照してください。

## 注記

Google Meet の公式メディア API は受信を主目的としているため、通話中に話すには引き続き参加者経路が必要です。この Plugin は、その境界を明確に保ちます。Chrome はブラウザーでの参加とローカル音声ルーティングを処理し、Twilio は電話ダイヤルインによる参加を処理します。

Chrome の音声応答モードには、`BlackHole 2ch` と次のいずれかが必要です。

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`：OpenClaw がブリッジを所有し、これらのコマンドと選択したプロバイダーの間で `chrome.audioFormat` の音声をパイプします。`agent` モードはリアルタイム文字起こしと通常の TTS を使用し、`bidi` モードはリアルタイム音声プロバイダーを使用します。デフォルト経路は `chrome.audioBufferBytes: 4096` を使用する 24 kHz PCM16 です。従来のコマンドペア向けには、8 kHz G.711 μ-law も引き続き使用できます。
- `chrome.audioBridgeCommand`：外部ブリッジコマンドがローカル音声経路全体を所有し、そのデーモンの起動または検証後に終了する必要があります。`agent` モードでは TTS 用にコマンドペアへ直接アクセスする必要があるため、`bidi` でのみ有効です。

コマンドペア方式の Chrome ブリッジでは、`chrome.bargeInInputCommand` が別のローカルマイクをリッスンし、人が話し始めたときにアシスタントの再生を停止できます。これにより、アシスタントの再生中に共有 BlackHole ループバック入力が一時的に抑制されていても、人の発話をアシスタントの出力より優先できます。`chrome.audioInputCommand`/`chrome.audioOutputCommand` と同様に、これはオペレーターが設定するローカルコマンドです。信頼できる明示的なコマンドパスまたは引数リストを使用し、信頼できない場所にあるスクリプトは決して使用しないでください。

クリーンな双方向音声を実現するには、Meet の出力と Meet のマイクを別々の仮想デバイス、または Loopback 形式の仮想デバイスグラフを介してルーティングしてください。単一の共有 BlackHole デバイスでは、他の参加者の音声が通話内にエコーバックされる可能性があります。

`googlemeet speak` は Chrome セッションのアクティブなトークバック音声ブリッジを開始し、`googlemeet leave` はそれを停止します（Voice Call 経由で委任された Twilio セッションの場合は、基盤となる通話も切断します）。API 管理スペースのアクティブな Google Meet 会議も終了するには、`googlemeet end-active-conference` を使用してください。

## 関連項目

- [音声通話 Plugin](/ja-JP/plugins/voice-call)
- [トークモード](/ja-JP/nodes/talk)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
