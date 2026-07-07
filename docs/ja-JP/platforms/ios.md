---
read_when:
    - iOS ノードのペアリングまたは再接続
    - ソースから iOS アプリを実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: 'iOS Node アプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-07-06T21:49:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae9061342b4f8a04afd1a7d2829b71ce9cd2bdd3b5124a54b9b6196b7ed755c3
    source_path: platforms/ios.md
    workflow: 16
---

Availability: iPhone アプリのビルドは、リリースで有効になっている場合、Apple チャネルを通じて配布されます。ローカル開発ビルドはソースから実行することもできます。

## 機能

- WebSocket 経由で Gateway に接続します（LAN または tailnet）。
- ノード機能を公開します: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、ノードステータスイベントを報告します。
- Agents サーフェス（Files）から、選択したエージェントのワークスペースを読み取り専用で閲覧します: ディレクトリのドリルダウン、シンタックスハイライト付きテキストプレビュー、画像プレビュー、共有シートへのエクスポート。書き込み操作はありません。プレビューは gateway によってサイズ制限されます。
- ペアリング済み gateway ごとに、最近のチャットセッションとトランスクリプトの小さな読み取り専用オフラインキャッシュを保持します: コールドオープンでは最後に認識されているトランスクリプトを即座に描画し、gateway が応答すると更新します。最近のチャットは切断中も閲覧可能で、リセット/忘れる操作により保護されたローカルキャッシュが消去されます。
- 切断中に送信されたテキストメッセージを、gateway ごとの永続的な送信箱にキューイングします（最大 50 件）: キュー内の吹き出しはトランスクリプトに表示され、再接続時に順番どおり冪等なリトライでフラッシュされ、正規の履歴で送信が確認されるまで永続化され、リトライ/削除アクションを表示する前にバックオフ付きで再試行し、48 時間オフラインの後は送信せず期限切れになります。リセット/忘れる操作では、キャッシュとともにキューもクリアされます。
- 必要に応じてアシスタントメッセージを読み上げます: Chat でメッセージを長押しし、**Listen** を選択します。アプリは、設定済みの TTS プロバイダーで対応 Gateway の `tts.speak` クリップを再生し、Gateway 音声が利用できない、または再生できない場合はデバイス上の音声にフォールバックします。セッション切り替えまたはバックグラウンド化で再生は停止します。

## 要件

- 別のデバイス（macOS、Linux、または WSL2 経由の Windows）で Gateway が実行されていること。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の Tailnet（ドメイン例: `openclaw.internal.`）、**または**
  - 手動ホスト/ポート（フォールバック）。

## クイックスタート（ペアリング + 接続）

1. スマートフォンから到達できるルートで、認証済み Gateway を起動します。Tailscale
   Serve が推奨されるリモート経路です:

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼済みの同一 LAN セットアップでは、代わりに認証済みの `gateway.bind: "lan"`
を使用します。デフォルトのループバックバインドはスマートフォンから到達できません。
Gateway がまだ構成されていない場合は、まず `openclaw onboard` を実行して、setup-code
の作成でトークンまたはパスワード認証経路を利用できるようにします。

2. [Control UI](/ja-JP/web/control-ui) を開き、**Nodes** を選択して、
   **Devices** カードの **Pair mobile device** をクリックします。

3. iOS アプリで、**Settings** -> **Gateway** を開き、QR コードをスキャンする（または
   セットアップコードを貼り付ける）ことで接続します。

   セットアップコードに LAN と Tailscale Serve の両方のルートが含まれている場合、アプリは
   それらを順番にプローブし、最初に到達可能なエンドポイントを保存します。

4. 公式アプリは自動的に接続します。**Devices** に保留中の
   リクエストが表示される場合は、承認前にそのロールとスコープを確認します。

Apple Watch companion には、別個の OpenClaw ペアリング承認はありません。
Apple の Watch アプリで Watch を iPhone とペアリングし、
**Watch app -> My Watch -> Available Apps** から OpenClaw をインストールしてから、両方の
デバイスで OpenClaw を一度開きます。OpenClaw は Apple Watch のペアリングとインストール変更に即座に追従します。
Gateway のデバイス承認は iPhone ノードを対象とします。

Control UI ボタンには、`operator.admin` を持つペアリング済みセッションが必要です。
ターミナルのフォールバックとして、iOS アプリで検出済み gateway を選択する（または
Manual Host を有効にしてホスト/ポートを入力する）し、Gateway ホストでリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再度実行します。

任意: iOS ノードが常に厳密に制御されたサブネットから接続する場合、明示的な CIDR または正確な IP を指定して、初回ノード自動承認をオプトインできます:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これはデフォルトで無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。Operator/browser ペアリング、およびロール、スコープ、メタデータ、公開鍵の変更はいずれも、引き続き手動承認が必要です。

5. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルドの Relay-backed push

公式配布 iOS ビルドは、raw APNs トークンを gateway に公開する代わりに、外部 push relay を使用します。公開リリースレーンからの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型 relay を使用します。このベース URL は App Store 配布用にハードコードされており、どのオーバーライドも読み取りません。

カスタム relay デプロイには、relay URL が gateway relay URL と一致する、意図的に分離された iOS ビルド/デプロイ経路が必要です。App Store リリースレーンでは、カスタム relay URL は決して受け入れられません。カスタム relay ビルドを使用している場合は、一致する gateway relay URL を設定します:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

フローの仕組み:

- iOS アプリは App Attest と StoreKit app transaction JWS を使用して relay に登録します。
- relay は不透明な relay handle と、登録スコープの send grant を返します。
- iOS アプリはペアリング済み gateway identity（`gateway.identity.get`）を取得し、relay 登録に含めるため、relay-backed registration はその特定の gateway に委任されます。
- アプリはその relay-backed registration を `push.apns.register` でペアリング済み gateway に転送します。
- gateway は保存された relay handle を `push.test`、バックグラウンドウェイク、wake nudges に使用します。
- アプリが後で別の gateway または異なる relay base URL のビルドに接続した場合、古いバインディングを再利用せず relay 登録を更新します。

この経路で gateway に**不要**なもの: デプロイ全体の relay token、公式 App Store relay-backed 送信用の直接 APNs key。

想定されるオペレーターフロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタム relay ビルドを使用している場合にのみ、gateway に `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを gateway にペアリングし、接続完了まで待ちます。
4. アプリは APNs token を取得し、operator session が接続され、relay 登録が成功すると、`push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、wake nudges は保存済みの relay-backed registration を使用できます。

## バックグラウンド alive ビーコン

iOS が silent push、background refresh、または significant-location event でアプリを起こすと、アプリは短いノード再接続を試み、その後 `event: "node.presence.alive"` で `node.event` を呼び出します。gateway は、認証済みノードデバイス identity が判明した後にのみ、ペアリング済みノード/デバイス metadata にこれを `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、gateway response に `handled: true` が含まれる場合にのみ、background wake が正常に記録されたものとして扱います。古い gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。この response は互換性がありますが、永続的な last-seen update としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、gateway の一時的な env override として引き続き機能します（`gateway.push.apns.relay.baseUrl` が config-first の経路です）。
- App Store リリースビルドの push mode はホスト型 relay host をハードコードしており、relay-URL override を決して読み取りません。`OPENCLAW_PUSH_RELAY_BASE_URL` build-time env var は、local/sandbox iOS build modes にのみ影響します。

## 認証と信頼フロー

relay は、公式 iOS ビルドに対して direct APNs-on-gateway では提供できない 2 つの制約を強制するために存在します:

- Apple を通じて配布された正規の OpenClaw iOS ビルドだけが、ホスト型 relay を使用できます。
- gateway は、その特定の gateway とペアリングした iOS デバイスに対してのみ relay-backed push を送信できます。

ホップごと:

1. `iOS app -> gateway`: アプリは通常の Gateway auth flow を通じて gateway とペアリングし、認証済みノードセッションと認証済みオペレーターセッションを取得します。オペレーターセッションは `gateway.identity.get` を呼び出します。
2. `iOS app -> relay`: アプリは App Attest proof と StoreKit app transaction JWS を使用し、HTTPS 経由で relay registration endpoints を呼び出します。relay は bundle ID、App Attest proof、Apple distribution proof を検証し、official/production distribution path を要求します。これにより、local Xcode/dev builds は official Apple distribution proof を満たせないため、hosted relay を使用できません。
3. `gateway identity delegation`: relay 登録の前に、アプリは `gateway.identity.get` からペアリング済み gateway identity を取得し、relay registration payload に含めます。relay は、その gateway identity に委任された relay handle と registration-scoped send grant を返します。
4. `gateway -> relay`: gateway は `push.apns.register` から relay handle と send grant を保存します。`push.test`、再接続ウェイク、wake nudges では、gateway が自身の device identity で送信リクエストに署名します。relay は、保存された send grant と gateway signature の両方を、登録時に委任された gateway identity に照らして検証します。別の gateway は、たとえ何らかの方法で handle を取得したとしても、その保存済み登録を再利用できません。
5. `relay -> APNs`: relay は production APNs credentials と公式ビルド用の raw APNs token を所有します。gateway は relay-backed 公式ビルドの raw APNs token を保存しません。relay はペアリング済み gateway に代わって最終的な push を APNs に送信します。

この設計が作られた理由: production APNs credentials をユーザー gateway から隔離し、official-build APNs tokens の raw 値を gateway に保存せず、公式 OpenClaw iOS ビルドにのみ hosted relay の利用を許可し、ある gateway が別の gateway に属する iOS デバイスへ wake push を送信するのを防ぐためです。

ローカル/手動ビルドは direct APNs のままです。relay なしでそれらのビルドをテストしている場合、gateway には引き続き direct APNs credentials が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは gateway-host runtime env vars であり、Fastlane settings ではありません。`apps/ios/fastlane/.env` は `APP_STORE_CONNECT_KEY_ID` や `APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect auth のみを保存します。local iOS builds の direct APNs delivery は構成しません。

`~/.openclaw/credentials/` 配下の他の provider credentials と整合する、推奨 gateway-host storage:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、repo checkout 配下に置いたりしないでください。

## 検出経路

### Bonjour（LAN）

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、構成されている場合は同じ wide-area DNS-SD discovery domain を参照します。同一 LAN の gateway は `local.` から自動的に表示されます。クロスネットワーク検出では、beacon type を変更せずに構成済みの wide-area domain を使用できます。

### Tailnet（クロスネットワーク）

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン（ドメインを選択、例: `openclaw.internal.`）と Tailscale split DNS を使用します。CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

Settings で **Manual Host** を有効にし、gateway host + port（デフォルト `18789`）を入力します。

## 複数の gateway

アプリはペアリングしたすべての gateway のレジストリを保持するため、再度ペアリングせずに切り替えられます:

- **設定 -> Gateway** には、アクティブなGatewayがマークされた **ペアリング済みGateway** リストが表示されます。項目をタップすると切り替わります。アプリは現在のセッションを終了し、選択したGatewayへ再接続します。複数のGatewayがペアリングされている場合、接続行の横にクイック切り替えメニューが表示されます。
- 認証情報、TLS 信頼判断、Gatewayごとの設定、キャッシュされたチャット履歴はGatewayごとに保存されます。切り替えてもGateway間で状態が混ざることはなく、プッシュ登録はアクティブなGatewayに従います。
- ペアリング済みGatewayをスワイプするか、コンテキストメニューを使用して **忘れる** を選択すると、その認証情報、デバイストークン、TLS ピン、キャッシュされたチャットが削除されます。
- 検出されたGatewayへ切り替えるには、そのGatewayがネットワーク上で見えている必要があります。手動Gatewayは保存済みのホストとポートで再接続します。

## Canvas + A2UI

iOS ノードは WKWebView canvas をレンダリングします。操作するには `node.invoke` を使用します。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway canvas ホストは、Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルトは `18789`）から `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- iOS ノードは、接続時のデフォルトビューとして組み込みスキャフォールドを保持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、バンドルされたアプリ所有の A2UI ページを使用します。
- リモートGateway A2UI ページは iOS ではレンダリング専用です。ネイティブ A2UI ボタンアクションは、バンドルされたアプリ所有ページからのものだけが受け付けられます。
- 組み込みスキャフォールドに戻るには、`canvas.navigate` と `{"url":""}` を使用します。

## Computer Use との関係

iOS アプリはモバイルノードサーフェスであり、Codex Computer Use バックエンドではありません。Codex Computer Use と `cua-driver mcp` は、MCP ツールを通じてローカルの macOS デスクトップを制御します。iOS アプリは、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などの OpenClaw ノードコマンドを通じて iPhone の機能を公開します。

エージェントはノードコマンドを呼び出すことで、OpenClaw 経由で iOS アプリを操作できますが、これらの呼び出しはGatewayノードプロトコルを通り、iOS のフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS ノード機能についてはこのページを使用してください。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + talk モード

- 音声ウェイクと talk モードは設定で利用できます。
- OpenAI realtime Talk は、`talk.realtime.transport` が `webrtc` の場合、クライアント所有の WebRTC を使用します。明示的な `gateway-relay` 設定は引き続きGateway所有です。[Talk モード](/ja-JP/nodes/talk)を参照してください。
- Talk 対応 iOS ノードは `talk` capability を公開し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。Gateway は、信頼された Talk 対応ノードに対して、これらのプッシュツートークコマンドをデフォルトで許可します。
- iOS はバックグラウンド音声を一時停止する場合があります。アプリがアクティブでない場合、音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドにしてください（canvas/camera/screen コマンドにはこれが必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされた A2UI ページにアプリの WebView から到達できませんでした。アプリを Screen タブでフォアグラウンドにしたまま再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- Watch に iPhone の状態が表示されない: `watch.status` で iPhone が `watchPaired: true`
  および `watchAppInstalled: true` を報告していることを確認してください。ペアリングが false の場合は、Apple の Watch アプリで
  Watch をペアリングしてください。インストールが false の場合は、**My Watch -> Available Apps** からコンパニオンをインストールしてください。どちらかを変更した後、Watch で OpenClaw を一度開いてください。即時到達性には引き続き両方のアプリが実行中である必要がありますが、
  キューに入った更新は後でバックグラウンドで届く場合があります。
- 再インストール後に再接続に失敗する: Keychain のペアリングトークンがクリアされています。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
