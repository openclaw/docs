---
read_when:
    - iOS Nodeのペアリングまたは再接続
    - ソースから iOS アプリを実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: 'iOSノードアプリ: Gatewayへの接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-05-07T13:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

利用可能状況: 内部プレビュー。iOSアプリはまだ一般公開されていません。

## これは何をするか

- WebSocket経由でGatewayに接続します（LANまたはtailnet）。
- ノード機能を公開します: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、ノードステータスイベントを報告します。

## 要件

- 別のデバイス（macOS、Linux、またはWSL2経由のWindows）でGatewayが実行されていること。
- ネットワーク経路:
  - Bonjour経由の同一LAN、**または**
  - unicast DNS-SD経由のtailnet（例のドメイン: `openclaw.internal.`）、**または**
  - 手動のホスト/ポート（フォールバック）。

## クイックスタート（ペアリング + 接続）

1. Gatewayを起動します:

```bash
openclaw gateway --port 18789
```

2. iOSアプリでSettingsを開き、検出されたgatewayを選択します（またはManual Hostを有効にしてホスト/ポートを入力します）。

3. gatewayホストでペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認する前に、もう一度 `openclaw devices list` を実行してください。

任意: iOSノードが厳密に管理されたサブネットから常に接続する場合は、明示的なCIDRまたは正確なIPを指定して、初回ノードの自動承認を有効にできます:

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

これはデフォルトでは無効です。要求スコープのない新規の `role: node` ペアリングにのみ適用されます。Operator/browserのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのrelay-backed push

公式配布のiOSビルドでは、生のAPNsトークンをgatewayへ公開する代わりに、外部push relayを使用します。

Gateway側の要件:

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

- iOSアプリは、App AttestとStoreKitアプリトランザクションJWSを使ってrelayに登録します。
- relayは、不透明なrelayハンドルと、登録スコープの送信権限を返します。
- iOSアプリは、ペアリング済みgateway IDを取得し、relay登録に含めます。そのため、relay-backed登録はその特定のgatewayに委任されます。
- アプリは、そのrelay-backed登録を `push.apns.register` でペアリング済みgatewayに転送します。
- Gatewayは、保存されたrelayハンドルを `push.test`、バックグラウンドウェイク、ウェイクナッジに使用します。
- Gatewayのrelay base URLは、公式/TestFlight iOSビルドに組み込まれたrelay URLと一致している必要があります。
- アプリが後で別のgateway、または異なるrelay base URLを持つビルドに接続した場合、古いバインディングを再利用せず、relay登録を更新します。

この経路でgatewayに不要なもの:

- デプロイ全体のrelayトークンは不要です。
- 公式/TestFlightのrelay-backed送信用の直接APNsキーは不要です。

想定されるoperatorフロー:

1. 公式/TestFlight iOSビルドをインストールします。
2. gatewayで `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリをgatewayとペアリングし、接続が完了するまで待ちます。
4. アプリは、APNsトークンを取得し、operatorセッションが接続され、relay登録が成功した後、自動的に `push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、ウェイクナッジは、保存されたrelay-backed登録を使用できます。

## バックグラウンドaliveビーコン

iOSがサイレントpush、バックグラウンド更新、またはsignificant-locationイベントでアプリを起動すると、アプリは短いノード再接続を試み、その後 `event: "node.presence.alive"` で `node.event` を呼び出します。
Gatewayは、認証済みノードデバイスIDが判明した後にのみ、これをペアリング済みノード/デバイスメタデータ上の `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、gatewayのレスポンスに `handled: true` が含まれる場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古いgatewayは `{ "ok": true }` で `node.event` を承認する場合があります。このレスポンスには互換性がありますが、永続的なlast-seen更新としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、gateway用の一時的な環境変数オーバーライドとして引き続き機能します。

## 認証と信頼フロー

relayは、公式iOSビルドに対して、gateway上の直接APNsでは提供できない2つの制約を強制するために存在します:

- Apple経由で配布された正規のOpenClaw iOSビルドだけが、ホストされたrelayを使用できます。
- gatewayは、その特定のgatewayとペアリングしたiOSデバイスに対してのみrelay-backed pushを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`
   - アプリはまず、通常のGateway認証フローを通じてgatewayとペアリングします。
   - これにより、アプリは認証済みノードセッションと認証済みoperatorセッションを取得します。
   - operatorセッションは `gateway.identity.get` の呼び出しに使用されます。

2. `iOS app -> relay`
   - アプリはHTTPS経由でrelay登録エンドポイントを呼び出します。
   - 登録には、App Attest証明とStoreKitアプリトランザクションJWSが含まれます。
   - relayはbundle ID、App Attest証明、Apple配布証明を検証し、公式/本番配布経路を要求します。
   - これにより、ローカルのXcode/devビルドがホストされたrelayを使用できなくなります。ローカルビルドは署名されている場合がありますが、relayが期待する公式Apple配布証明を満たしません。

3. `gateway identity delegation`
   - relay登録の前に、アプリは `gateway.identity.get` からペアリング済みgateway IDを取得します。
   - アプリはそのgateway IDをrelay登録ペイロードに含めます。
   - relayは、そのgateway IDに委任されたrelayハンドルと登録スコープの送信権限を返します。

4. `gateway -> relay`
   - Gatewayは `push.apns.register` からrelayハンドルと送信権限を保存します。
   - `push.test`、再接続ウェイク、ウェイクナッジでは、gatewayが自身のデバイスIDで送信リクエストに署名します。
   - relayは、保存された送信権限とgateway署名の両方を、登録時に委任されたgateway IDに対して検証します。
   - 別のgatewayは、たとえ何らかの方法でハンドルを入手しても、その保存済み登録を再利用できません。

5. `relay -> APNs`
   - relayは、本番APNs認証情報と公式ビルド用の生のAPNsトークンを保持します。
   - Gatewayは、relay-backed公式ビルド用の生のAPNsトークンを保存しません。
   - relayは、ペアリング済みgatewayに代わってAPNsへ最終pushを送信します。

この設計が作成された理由:

- 本番APNs認証情報をユーザーのgatewayから切り離すため。
- 公式ビルドの生のAPNsトークンをgatewayに保存しないため。
- ホストされたrelayの使用を、公式/TestFlight OpenClawビルドのみに許可するため。
- あるgatewayが、別のgatewayに属するiOSデバイスへウェイクpushを送信するのを防ぐため。

ローカル/手動ビルドは引き続き直接APNsを使用します。relayなしでこれらのビルドをテストする場合、gatewayには引き続き直接APNs認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらはgatewayホストの実行時環境変数であり、Fastlane設定ではありません。`apps/ios/fastlane/.env` は `ASC_KEY_ID` や `ASC_ISSUER_ID` などのApp Store Connect / TestFlight認証のみを保存します。ローカルiOSビルド向けの直接APNs配信は設定しません。

推奨されるgatewayホスト上の保存場所:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、repo checkoutの下に配置したりしないでください。

## 検出経路

### Bonjour（LAN）

iOSアプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じwide-area DNS-SD検出ドメインを参照します。同一LANのgatewayは `local.` から自動的に表示されます。クロスネットワーク検出では、ビーコンタイプを変更せずに、設定済みのwide-areaドメインを使用できます。

### Tailnet（クロスネットワーク）

mDNSがブロックされている場合は、unicast DNS-SDゾーン（ドメインを選択します。例:
`openclaw.internal.`）とTailscale split DNSを使用します。
CoreDNSの例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

Settingsで **Manual Host** を有効にし、gatewayのホスト + ポート（デフォルトは `18789`）を入力します。

## Canvas + A2UI

iOSノードはWKWebView canvasをレンダリングします。`node.invoke` で操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway canvasホストは `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- Gateway HTTPサーバーから提供されます（`gateway.port` と同じポート、デフォルトは `18789`）。
- iOSノードは、canvasホストURLが通知されると、接続時に自動でA2UIへ移動します。
- `canvas.navigate` と `{"url":""}` で組み込みscaffoldに戻ります。

## Computer Useとの関係

iOSアプリはモバイルノードサーフェスであり、Codex Computer Useバックエンドではありません。Codex
Computer Useと `cua-driver mcp` は、MCPツールを通じてローカルmacOSデスクトップを制御します。一方、iOSアプリは `canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などのOpenClawノードコマンドを通じてiPhone機能を公開します。

Agentsは、ノードコマンドを呼び出すことでOpenClaw経由でiOSアプリを操作できますが、これらの呼び出しはgatewayノードプロトコルを通り、iOSのフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOSノード機能についてはこのページを使用してください。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wakeとtalk modeはSettingsで利用できます。
- Talk対応のiOSノードは `talk` capabilityを通知でき、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。
  Gatewayは、信頼済みのTalk対応ノードに対して、これらのpush-to-talkコマンドをデフォルトで許可します。
- iOSはバックグラウンド音声を一時停止する場合があります。アプリがアクティブでないときの音声機能はbest-effortとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOSアプリをフォアグラウンドに移動してください（canvas/camera/screenコマンドにはこれが必要です）。
- `A2UI_HOST_NOT_CONFIGURED`: GatewayがCanvas PluginサーフェスURLを通知しませんでした。[Gateway設定](/ja-JP/gateway/configuration) の `plugins.entries.canvas.config.host` を確認してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続が失敗する: Keychainのペアリングトークンがクリアされています。ノードを再ペアリングしてください。

## 関連ドキュメント

- [Pairing](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
