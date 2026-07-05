---
read_when:
    - iOS ノードのペアリングまたは再接続
    - iOSアプリをソースから実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: 'iOS Node アプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOSアプリ
x-i18n:
    generated_at: "2026-07-05T17:42:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44e1f065bedeca67fcbb11d9666865cebfb2a7636f8eeeb2216d90a72c29e0b6
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: iPhone アプリのビルドは、リリースで有効化されている場合、Apple のチャネルを通じて配布されます。ローカル開発ビルドはソースから実行することもできます。

## 何をするか

- WebSocket 経由で Gateway に接続します (LAN または tailnet)。
- ノード機能を公開します: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、ノード状態イベントを報告します。

## 要件

- 別のデバイス (macOS、Linux、または WSL2 経由の Windows) で実行中の Gateway。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の Tailnet (例のドメイン: `openclaw.internal.`)、**または**
  - 手動ホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. スマートフォンから到達できるルートを持つ、認証済み Gateway を起動します。Tailscale
   Serve が推奨されるリモート経路です:

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼できる同一 LAN セットアップでは、代わりに認証済みの `gateway.bind: "lan"`
を使用します。デフォルトのループバックバインドはスマートフォンから到達できません。
Gateway がまだ設定されていない場合は、まず `openclaw onboard` を実行して、セットアップコードの
作成にトークンまたはパスワード認証経路があるようにします。

2. [Control UI](/ja-JP/web/control-ui) を開き、**Nodes** を選択して、**Devices** カードの
   **Pair mobile device** をクリックします。

3. iOS アプリで **Settings** -> **Gateway** を開き、QR コードをスキャン (または
   セットアップコードを貼り付け) して接続します。

   セットアップコードに LAN と Tailscale Serve の両方のルートが含まれている場合、アプリは
   順にプローブし、最初に到達できたエンドポイントを保存します。

4. 公式アプリは自動的に接続します。**Devices** に保留中の
   リクエストが表示される場合は、承認する前にそのロールとスコープを確認してください。

Control UI ボタンには、`operator.admin` を持つ既存のペアリング済みセッションが必要です。
ターミナルでのフォールバックとして、iOS アプリで検出済み Gateway を選択する (または
Manual Host を有効にしてホスト/ポートを入力する) したうえで、Gateway ホストでリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前にもう一度 `openclaw devices list` を実行してください。

任意: iOS ノードが常に厳密に制御されたサブネットから接続する場合、明示的な CIDR または正確な IP で初回ノード自動承認をオプトインできます:

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

これはデフォルトで無効です。要求スコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザーのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

5. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー backed プッシュ

公式に配布される iOS ビルドは、raw APNs トークンを Gateway に公開する代わりに、外部プッシュリレーを使用します。パブリックリリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型リレーを使用します。このベース URL は App Store 配信用にハードコードされており、オーバーライドは一切読み取りません。

カスタムリレーデプロイメントには、リレー URL が Gateway のリレー URL と一致する、意図的に分離された iOS ビルド/デプロイメント経路が必要です。App Store リリースレーンがカスタムリレー URL を受け付けることはありません。カスタムリレービルドを使用している場合は、一致する Gateway リレー URL を設定します:

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

- iOS アプリは App Attest と StoreKit アプリトランザクション JWS を使用してリレーに登録します。
- リレーは opaque なリレーハンドルと、登録スコープの送信許可を返します。
- iOS アプリはペアリング済み Gateway の ID (`gateway.identity.get`) を取得し、それをリレー登録に含めるため、リレー backed 登録はその特定の Gateway に委任されます。
- アプリはそのリレー backed 登録を `push.apns.register` でペアリング済み Gateway に転送します。
- Gateway は保存されたリレーハンドルを `push.test`、バックグラウンド wake、wake nudges に使用します。
- アプリが後で別の Gateway、または別のリレーベース URL を持つビルドに接続した場合、古いバインディングを再利用せずにリレー登録を更新します。

この経路で Gateway が**不要**なもの: デプロイメント全体のリレートークンは不要、公式 App Store のリレー backed 送信用の直接 APNs キーは不要。

想定されるオペレーターフロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway に `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway にペアリングし、接続完了を待ちます。
4. アプリは、APNs トークンを取得し、オペレーターセッションが接続され、リレー登録が成功すると、`push.apns.register` を一度公開します。
5. その後、`push.test`、再接続 wake、wake nudges は保存済みのリレー backed 登録を使用できます。

## バックグラウンド alive ビーコン

iOS が silent push、バックグラウンド更新、または significant-location イベントでアプリを起動すると、アプリは短時間のノード再接続を試み、その後 `event: "node.presence.alive"` で `node.event` を呼び出します。Gateway は、認証済みノードデバイス ID が判明した後にのみ、これをペアリング済みノード/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway レスポンスに `handled: true` が含まれる場合にのみ、バックグラウンド wake が正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` に応答する場合があります。このレスポンスには互換性がありますが、永続的な最終確認更新としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は Gateway の一時的な env オーバーライドとして引き続き動作します (`gateway.push.apns.relay.baseUrl` が設定優先の経路です)。
- App Store リリースビルドのプッシュモードは、ホスト型リレーホストをハードコードしており、リレー URL オーバーライドを読み取ることはありません。`OPENCLAW_PUSH_RELAY_BASE_URL` ビルド時 env var は、ローカル/サンドボックス iOS ビルドモードにのみ影響します。

## 認証と信頼フロー

このリレーは、公式 iOS ビルドについて、Gateway 上の直接 APNs では提供できない 2 つの制約を強制するために存在します:

- Apple を通じて配布された正規の OpenClaw iOS ビルドだけが、ホスト型リレーを使用できます。
- Gateway は、その特定の Gateway とペアリングした iOS デバイスに対してのみ、リレー backed プッシュを送信できます。

ホップごと:

1. `iOS app -> gateway`: アプリは通常の Gateway 認証フローを通じて Gateway とペアリングし、認証済みノードセッションと認証済みオペレーターセッションを取得します。オペレーターセッションは `gateway.identity.get` を呼び出します。
2. `iOS app -> relay`: アプリは App Attest 証明と StoreKit アプリトランザクション JWS を添えて、HTTPS 経由でリレー登録エンドポイントを呼び出します。リレーはバンドル ID、App Attest 証明、Apple 配布証明を検証し、公式/本番配布経路を要求します。これにより、ローカルビルドは公式 Apple 配布証明を満たせないため、ローカル Xcode/dev ビルドがホスト型リレーを使用できなくなります。
3. `gateway identity delegation`: リレー登録の前に、アプリは `gateway.identity.get` からペアリング済み Gateway ID を取得し、リレー登録ペイロードに含めます。リレーは、その Gateway ID に委任されたリレーハンドルと登録スコープの送信許可を返します。
4. `gateway -> relay`: Gateway は `push.apns.register` からのリレーハンドルと送信許可を保存します。`push.test`、再接続 wake、wake nudges では、Gateway は自身のデバイス ID で送信リクエストに署名します。リレーは、登録時に委任された Gateway ID に対して、保存済み送信許可と Gateway 署名の両方を検証します。別の Gateway は、たとえハンドルを何らかの形で取得しても、その保存済み登録を再利用できません。
5. `relay -> APNs`: リレーは、公式ビルド用の本番 APNs 認証情報と raw APNs トークンを所有します。Gateway はリレー backed 公式ビルドの raw APNs トークンを保存しません。リレーはペアリング済み Gateway に代わって最終プッシュを APNs に送信します。

この設計が作られた理由: 本番 APNs 認証情報をユーザーの Gateway の外に置き、公式ビルドの raw APNs トークンを Gateway に保存しないようにし、ホスト型リレーの使用を公式 OpenClaw iOS ビルドだけに許可し、ある Gateway が別の Gateway に属する iOS デバイスへ wake プッシュを送信することを防ぐためです。

ローカル/手動ビルドは直接 APNs のままです。リレーなしでそれらのビルドをテストする場合、Gateway には引き続き直接 APNs 認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストのランタイム env vars であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は `APP_STORE_CONNECT_KEY_ID` や `APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect 認証のみを保存します。ローカル iOS ビルドの直接 APNs 配信は設定しません。

`~/.openclaw/credentials/` 配下の他のプロバイダー認証情報と一貫した、推奨される Gateway ホストの保存先:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリのチェックアウト配下に置いたりしないでください。

## 検出経路

### Bonjour (LAN)

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ広域 DNS-SD 検出ドメインを参照します。同一 LAN の Gateway は `local.` から自動的に表示されます。クロスネットワーク検出では、ビーコンタイプを変更せずに、設定された広域ドメインを使用できます。

### Tailnet (クロスネットワーク)

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン (ドメインを選択。例: `openclaw.internal.`) と Tailscale split DNS を使用します。CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

Settings で **Manual Host** を有効にし、Gateway ホスト + ポート (デフォルト `18789`) を入力します。

## Canvas + A2UI

iOS ノードは WKWebView Canvas をレンダリングします。`node.invoke` を使用して操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway Canvas ホストは、Gateway HTTP サーバー ( `gateway.port` と同じポート、デフォルト `18789`) から `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- iOS ノードは、組み込みスキャフォールドを接続時のデフォルトビューとして保持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、バンドルされたアプリ所有の A2UI ページを使用します。
- リモート Gateway A2UI ページは iOS ではレンダリングのみです。ネイティブ A2UI ボタンアクションは、バンドルされたアプリ所有ページからのみ受け付けられます。
- `canvas.navigate` と `{"url":""}` で組み込みスキャフォールドに戻ります。

## Computer Use との関係

iOS アプリはモバイルノードサーフェスであり、Codex Computer Use バックエンドではありません。Codex Computer Use と `cua-driver mcp` は MCP ツールを通じてローカルの macOS デスクトップを制御します。iOS アプリは `canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などの OpenClaw ノードコマンドを通じて iPhone 機能を公開します。

Agents はノードコマンドを呼び出すことで、OpenClaw 経由で iOS アプリを操作することもできますが、それらの呼び出しは Gateway ノードプロトコルを通り、iOS のフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS ノード機能にはこのページを使用してください。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- 音声ウェイクとトークモードは設定で利用できます。
- OpenAI realtime Talk は、`talk.realtime.transport` が `webrtc` の場合、クライアント所有の WebRTC を使用します。明示的な `gateway-relay` 設定は引き続き Gateway 所有です。[トークモード](/ja-JP/nodes/talk)を参照してください。
- トーク対応の iOS ノードは `talk` ケイパビリティを通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。Gateway は、信頼されたトーク対応ノードに対して、これらのプッシュ・トゥ・トークコマンドをデフォルトで許可します。
- iOS はバックグラウンド音声を一時停止する場合があります。アプリがアクティブでないときは、音声機能をベストエフォートとして扱ってください。

## 一般的なエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドに移動してください（キャンバス/カメラ/画面コマンドにはそれが必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされた A2UI ページにアプリの WebView から到達できませんでした。アプリを Screen タブでフォアグラウンドのままにして再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続に失敗する: Keychain のペアリングトークンがクリアされました。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
