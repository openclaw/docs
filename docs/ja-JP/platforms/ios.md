---
read_when:
    - iOS ノードのペアリングまたは再接続
    - ソースから iOS アプリを実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: 'iOS Node アプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-07-06T10:49:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b118e6983ba0077e9d4752548ef3ea3adfe699a10398f673520610076004da1b
    source_path: platforms/ios.md
    workflow: 16
---

利用可否: iPhone アプリのビルドは、リリースで有効化されている場合に Apple チャネルを通じて配布されます。ローカル開発ビルドもソースから実行できます。

## 何をするか

- WebSocket (LAN または tailnet) 経由で Gateway に接続します。
- ノード capabilities を公開します: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、ノードのステータスイベントを報告します。
- ペアリング済み Gateway ごとに、最近のチャットセッションとトランスクリプトの小さな読み取り専用オフラインキャッシュを保持します: コールドオープン時は最後に確認されたトランスクリプトを即座に描画し、Gateway が応答すると更新します。最近のチャットは切断中も閲覧でき、リセット/忘却により保護されたローカルキャッシュが消去されます。
- 切断中に送信されたテキストメッセージを、Gateway ごとの永続的な送信箱にキューします (最大 50 件): キュー済みの吹き出しはトランスクリプトに表示され、再接続時に idempotency key を使って順番にフラッシュされるため二重送信されません。送信失敗としてメッセージのコンテキストメニューに retry/delete が表示される前にバックオフ付きで再試行し、48 時間オフラインの後は送信せずに期限切れになります。リセット/忘却により、キャッシュとともにキューも消去されます。

## 要件

- 別のデバイス (macOS、Linux、または WSL2 経由の Windows) で実行中の Gateway。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - unicast DNS-SD 経由の Tailnet (例のドメイン: `openclaw.internal.`)、**または**
  - 手動のホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. 電話から到達できるルートを持つ、認証済み Gateway を起動します。Tailscale
   Serve が推奨されるリモート経路です:

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼できる同一 LAN 設定では、代わりに認証済みの `gateway.bind: "lan"` を使用します。デフォルトの loopback bind は電話から到達できません。Gateway がまだ設定されていない場合は、まず `openclaw onboard` を実行して、セットアップコードの作成にトークンまたはパスワード認証経路を用意してください。

2. [Control UI](/ja-JP/web/control-ui) を開き、**Nodes** を選択して、**Devices** カードの
   **Pair mobile device** をクリックします。

3. iOS アプリで **Settings** -> **Gateway** を開き、QR コードをスキャン (またはセットアップコードを貼り付け) して接続します。

   セットアップコードに LAN と Tailscale Serve の両方のルートが含まれている場合、アプリは順番にプローブし、最初に到達可能な endpoint を保存します。

4. 公式アプリは自動的に接続します。**Devices** に保留中のリクエストが表示される場合は、承認する前にその role と scopes を確認してください。

Apple Watch companion には、OpenClaw の個別のペアリング承認はありません。
Apple の Watch アプリで Watch を iPhone とペアリングし、**Watch app -> My Watch -> Available Apps** から OpenClaw をインストールしてから、両方のデバイスで OpenClaw を一度開きます。OpenClaw は Apple Watch のペアリングとインストールの変更に即座に追従します。Gateway のデバイス承認は iPhone ノードを対象にします。

Control UI ボタンには、`operator.admin` を持つ既存のペアリング済みセッションが必要です。
ターミナルのフォールバックとして、iOS アプリで検出された Gateway を選択する (または Manual Host を有効にしてホスト/ポートを入力する) してから、Gateway ホストでリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細 (role/scopes/public key) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` をもう一度実行してください。

任意: iOS ノードが常に厳密に管理された subnet から接続する場合、明示的な CIDR または正確な IP を使って初回ノード自動承認を有効にできます:

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

これはデフォルトでは無効です。要求された scopes がない新規の `role: node` ペアリングにのみ適用されます。Operator/browser ペアリング、および role、scope、metadata、public-key の変更は、引き続き手動承認が必要です。

5. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー backed push

公式に配布される iOS ビルドは、生の APNs token を Gateway に公開する代わりに外部 push relay を使用します。公開リリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` の hosted relay を使用します。この base URL は App Store 配布用にハードコードされており、override は読みません。

カスタム relay deployment には、relay URL が Gateway relay URL と一致する、意図的に分離された iOS build/deployment 経路が必要です。App Store リリースレーンはカスタム relay URL を決して受け入れません。カスタム relay ビルドを使用している場合は、一致する Gateway relay URL を設定してください:

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

- iOS アプリは App Attest と StoreKit app transaction JWS を使って relay に登録します。
- relay は不透明な relay handle と registration-scoped send grant を返します。
- iOS アプリはペアリング済み Gateway identity (`gateway.identity.get`) を取得して relay registration に含めるため、relay-backed registration はその特定の Gateway に委任されます。
- アプリはその relay-backed registration を `push.apns.register` でペアリング済み Gateway に転送します。
- Gateway は、その保存済み relay handle を `push.test`、background wake、wake nudge に使用します。
- アプリが後で別の Gateway、または異なる relay base URL を持つビルドに接続した場合、古い binding を再利用せずに relay registration を更新します。

この経路で Gateway が必要と**しない**もの: deployment-wide relay token は不要、公式 App Store relay-backed send 用の直接 APNs key は不要です。

想定される operator フロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタム relay ビルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway にペアリングし、接続完了まで待ちます。
4. アプリは APNs token を取得し、operator session が接続され、relay registration が成功すると、`push.apns.register` を公開します。
5. その後、`push.test`、reconnect wake、wake nudge は保存済み relay-backed registration を使用できます。

## Background alive beacon

iOS が silent push、background refresh、または significant-location event でアプリを起動すると、アプリは短時間のノード再接続を試み、その後 `event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済みノードデバイス identity が判明した後にのみ、これをペアリング済みノード/デバイス metadata の `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway の応答に `handled: true` が含まれる場合にのみ、background wake が正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` を acknowledge する場合があります。この応答は互換性がありますが、永続的な last-seen 更新としては数えられません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は Gateway の一時的な env override として引き続き機能します (`gateway.push.apns.relay.baseUrl` が config-first 経路です)。
- App Store リリースビルドの push mode は hosted relay host をハードコードしており、relay-URL override は決して読みません。`OPENCLAW_PUSH_RELAY_BASE_URL` build-time env var は local/sandbox iOS build mode にのみ影響します。

## 認証と信頼フロー

relay は、公式 iOS ビルドにおいて direct APNs-on-gateway では提供できない 2 つの制約を適用するために存在します:

- Apple を通じて配布された本物の OpenClaw iOS ビルドだけが hosted relay を使用できます。
- Gateway は、その特定の Gateway とペアリングした iOS デバイスに対してのみ relay-backed push を送信できます。

hop ごとの流れ:

1. `iOS app -> gateway`: アプリは通常の Gateway auth flow を通じて Gateway とペアリングし、認証済み node session と認証済み operator session を取得します。operator session は `gateway.identity.get` を呼び出します。
2. `iOS app -> relay`: アプリは HTTPS 経由で、App Attest proof と StoreKit app transaction JWS を添えて relay registration endpoint を呼び出します。relay は bundle ID、App Attest proof、Apple distribution proof を検証し、公式/production distribution 経路を要求します。これにより、local build は公式 Apple distribution proof を満たせないため、local Xcode/dev build が hosted relay を使用することを防ぎます。
3. `gateway identity delegation`: relay registration の前に、アプリは `gateway.identity.get` からペアリング済み Gateway identity を取得し、relay registration payload に含めます。relay は、その Gateway identity に委任された relay handle と registration-scoped send grant を返します。
4. `gateway -> relay`: Gateway は `push.apns.register` から relay handle と send grant を保存します。`push.test`、reconnect wake、wake nudge では、Gateway が自身の device identity で send request に署名します。relay は、保存済み send grant と Gateway signature の両方を、registration から委任された Gateway identity に照らして検証します。別の Gateway は、たとえ何らかの方法で handle を取得したとしても、その保存済み registration を再利用できません。
5. `relay -> APNs`: relay は公式ビルド用の production APNs credential と生の APNs token を所有します。Gateway は relay-backed 公式ビルド用の生の APNs token を保存しません。relay は、ペアリング済み Gateway に代わって最終的な push を APNs に送信します。

この設計が作成された理由: production APNs credential をユーザーの Gateway から遠ざけ、公式ビルドの生 APNs token を Gateway に保存することを避け、公式 OpenClaw iOS ビルドにのみ hosted relay の使用を許可し、ある Gateway が別の Gateway に属する iOS デバイスへ wake push を送信することを防ぐためです。

ローカル/手動ビルドは direct APNs のままです。relay なしでこれらのビルドをテストする場合、Gateway には引き続き direct APNs credential が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストの runtime env vars であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は `APP_STORE_CONNECT_KEY_ID` や `APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect auth のみを保存します。local iOS build 用の direct APNs delivery は設定しません。

`~/.openclaw/credentials/` 配下の他の provider credential と整合する、推奨される Gateway ホスト storage:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、repo checkout 配下に置いたりしないでください。

## Discovery 経路

### Bonjour (LAN)

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ wide-area DNS-SD discovery domain を参照します。同一 LAN の Gateway は `local.` から自動的に表示されます。cross-network discovery は beacon type を変更せずに、設定済みの wide-area domain を使用できます。

### Tailnet (cross-network)

mDNS がブロックされている場合は、unicast DNS-SD zone (ドメインを選択します。例: `openclaw.internal.`) と Tailscale split DNS を使用します。CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### Manual host/port

Settings で **Manual Host** を有効にし、Gateway host + port (デフォルト `18789`) を入力します。

## Canvas + A2UI

iOS ノードは WKWebView canvas をレンダリングします。`node.invoke` で操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway canvas host は、Gateway HTTP server から `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します (`gateway.port` と同じポート、デフォルト `18789`)。
- iOS ノードは組み込み scaffold を接続時のデフォルトビューとして保持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、バンドルされた app-owned A2UI page を使用します。
- Remote Gateway A2UI page は iOS では render-only です。native A2UI button action は、バンドルされた app-owned page からのみ受け入れられます。
- `canvas.navigate` と `{"url":""}` で組み込み scaffold に戻ります。

## Computer Use との関係

iOSアプリはモバイルノードサーフェスであり、Codex Computer Useバックエンドではありません。Codex Computer Useと`cua-driver mcp`はMCPツールを通じてローカルのmacOSデスクトップを制御します。一方、iOSアプリは`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*`などのOpenClawノードコマンドを通じてiPhone機能を公開します。

エージェントはノードコマンドを呼び出すことで、OpenClaw経由でiOSアプリを操作できますが、それらの呼び出しはGatewayノードプロトコルを通り、iOSのフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を使用し、iOSノード機能についてはこのページを参照してください。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは設定で利用できます。
- `talk.realtime.transport`が`webrtc`の場合、OpenAI realtime Talkはクライアント所有のWebRTCを使用します。明示的な`gateway-relay`設定は引き続きGateway所有です。[トークモード](/ja-JP/nodes/talk)を参照してください。
- Talk対応のiOSノードは`talk`機能を通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once`を宣言できます。Gatewayは、信頼済みのTalk対応ノードに対して、これらのプッシュツートークコマンドをデフォルトで許可します。
- iOSはバックグラウンド音声を停止する場合があります。アプリがアクティブでないときの音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOSアプリをフォアグラウンドにしてください（canvas/camera/screenコマンドでは必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされたA2UIページにアプリのWebViewから到達できませんでした。アプリをScreenタブでフォアグラウンドにしたまま再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list`を実行し、手動で承認してください。
- WatchにiPhoneの状態が表示されない: `watch.status`でiPhoneが`watchPaired: true`
  および`watchAppInstalled: true`を報告していることを確認してください。ペアリングがfalseの場合は、AppleのWatchアプリで
  Watchをペアリングしてください。インストールがfalseの場合は、**My Watch -> Available Apps**からコンパニオンをインストールしてください。どちらかを変更した後、WatchでOpenClawを
  一度開いてください。即時到達性には引き続き両方のアプリが実行中である必要がありますが、
  キューに入った更新は後でバックグラウンドで到着する場合があります。
- 再インストール後に再接続できない: Keychainのペアリングトークンが消去されました。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
