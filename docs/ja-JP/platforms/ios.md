---
read_when:
    - iOS Nodeをペアリングまたは再接続する場合
    - ソースからiOS appを実行する場合
    - gateway検出またはcanvasコマンドをデバッグする場合
summary: 'iOS Node app: Gatewayへの接続、ペアリング、canvas、トラブルシューティング'
title: iOS app
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

利用状況: internal preview。iOS appはまだ一般公開されていません。

## できること

- WebSocket経由でGatewayに接続します（LANまたはtailnet）。
- Node機能を公開します: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke`コマンドを受け取り、Nodeステータスイベントを報告します。

## 要件

- 別のデバイス上で動作しているGateway（macOS、Linux、またはWSL2経由のWindows）。
- ネットワーク経路:
  - 同一LAN上のBonjour、**または**
  - unicast DNS-SD経由のtailnet（例のドメイン: `openclaw.internal.`）、**または**
  - 手動のhost/port（フォールバック）。

## クイックスタート（ペアリング + 接続）

1. Gatewayを起動します:

```bash
openclaw gateway --port 18789
```

2. iOS appでSettingsを開き、検出されたgatewayを選択します（またはManual Hostを有効にしてhost/portを入力します）。

3. gateway hostでペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

appが変更された認証詳細（role/scopes/public key）でペアリングを再試行した場合、
以前の保留中リクエストは置き換えられ、新しい`requestId`が作成されます。
承認前にもう一度`openclaw devices list`を実行してください。

任意: iOS Nodeが常に厳密に管理されたサブネットから接続する場合は、
明示的なCIDRまたは正確なIPで、初回Node自動承認にオプトインできます。

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

これはデフォルトで無効です。適用されるのは、要求スコープのない新規`role: node`ペアリングにのみ
限られます。operator/browserのペアリングや、role、scope、metadata、
public-keyの変更には、引き続き手動承認が必要です。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのrelayバックエンドpush

公式配布のiOSビルドでは、rawなAPNs
tokenをgatewayに公開する代わりに、外部push relayを使用します。

gateway側の要件:

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

- iOS appは、App Attestとapp receiptを使ってrelayに登録します。
- relayは、不透明なrelay handleと登録スコープ付きsend grantを返します。
- iOS appは、ペアリング済みgateway identityを取得してrelay登録に含めるため、そのrelayバックエンド登録はその特定gatewayに委譲されます。
- appは、そのrelayバックエンド登録を`push.apns.register`でペアリング済みgatewayへ転送します。
- gatewayは、`push.test`、background wake、wake nudgeにその保存済みrelay handleを使います。
- gateway relayのbase URLは、公式/TestFlight iOSビルドに埋め込まれたrelay URLと一致している必要があります。
- appが後で別のgatewayまたは別のrelay base URLを持つビルドへ接続した場合、古いバインディングを再利用する代わりにrelay登録を更新します。

この経路でgatewayが**不要**なもの:

- デプロイ全体で共有するrelay tokenは不要です。
- 公式/TestFlightのrelayバックエンド送信には、直接のAPNs keyは不要です。

想定されるoperatorフロー:

1. 公式/TestFlight iOSビルドをインストールします。
2. gatewayで`gateway.push.apns.relay.baseUrl`を設定します。
3. appをgatewayへペアリングし、接続完了まで待ちます。
4. appは、APNs tokenを取得し、operator sessionが接続され、relay登録が成功すると、自動的に`push.apns.register`を公開します。
5. その後、`push.test`、再接続wake、wake nudgeで保存済みrelayバックエンド登録を使えるようになります。

互換性に関する注記:

- `OPENCLAW_APNS_RELAY_BASE_URL`は、引き続きgateway用の一時的な環境変数上書きとして使えます。

## 認証と信頼のフロー

relayが存在するのは、公式iOSビルドに対して、gatewayでの直接APNsでは実現できない2つの制約を
強制するためです。

- Apple経由で配布された本物のOpenClaw iOSビルドだけが、ホストされたrelayを使えます。
- gatewayは、その特定のgatewayとペアリングしたiOSデバイスに対してのみ、relayバックエンドpushを送れます。

ホップごとに見ると:

1. `iOS app -> gateway`
   - appはまず通常のGateway authフローを通じてgatewayとペアリングします。
   - これにより、appは認証済みNode sessionと認証済みoperator sessionを取得します。
   - operator sessionは`gateway.identity.get`の呼び出しに使われます。

2. `iOS app -> relay`
   - appはHTTPS経由でrelay登録エンドポイントを呼び出します。
   - 登録にはApp Attest証明とapp receiptが含まれます。
   - relayはbundle ID、App Attest証明、Apple receiptを検証し、
     公式/本番配布経路を要求します。
   - これにより、ローカルXcode/devビルドはホストrelayを使えません。ローカルビルドでも
     署名されていることはありますが、relayが期待する公式Apple配布の証明は満たしません。

3. `gateway identity delegation`
   - relay登録の前に、appは
     `gateway.identity.get`からペアリング済みgateway identityを取得します。
   - appはそのgateway identityをrelay登録ペイロードに含めます。
   - relayは、そのgateway identityに委譲されたrelay handleと登録スコープ付きsend grantを返します。

4. `gateway -> relay`
   - gatewayは、`push.apns.register`からrelay handleとsend grantを保存します。
   - `push.test`、再接続wake、wake nudge時に、gatewayは
     自身のdevice identityで送信リクエストに署名します。
   - relayは、保存済みsend grantとgateway署名の両方を、登録時に委譲された
     gateway identityに対して検証します。
   - たとえhandleを何らかの形で取得できたとしても、別のgatewayはその保存済み登録を再利用できません。

5. `relay -> APNs`
   - relayは、公式ビルド用の本番APNs認証情報とrawなAPNs tokenを所有します。
   - gatewayは、relayバックエンドの公式ビルド用raw APNs tokenを保存しません。
   - relayは、ペアリング済みgatewayを代理してAPNsへ最終pushを送信します。

この設計が作られた理由:

- 本番APNs認証情報をユーザーgatewayから切り離すため。
- gateway上に公式ビルドのraw APNs tokenを保存しないようにするため。
- ホストrelayの利用を公式/TestFlight OpenClawビルドのみに制限するため。
- あるgatewayが、別のgatewayに属するiOSデバイスへwake pushを送ることを防ぐため。

ローカル/手動ビルドは引き続き直接APNsを使います。relayなしでそれらの
ビルドをテストする場合、gatewayには引き続き直接APNs認証情報が必要です。

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらはgateway hostのランタイム環境変数であり、Fastlane設定ではありません。`apps/ios/fastlane/.env`には
`ASC_KEY_ID`や`ASC_ISSUER_ID`のようなApp Store Connect / TestFlight認証のみが保存され、
ローカルiOSビルドの直接APNs配信は設定しません。

推奨されるgateway host保存場所:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8`ファイルをコミットしたり、リポジトリチェックアウト配下に置いたりしないでください。

## 検出経路

### Bonjour（LAN）

iOS appは`local.`上の`_openclaw-gw._tcp`を探索し、設定されている場合は同じ
広域DNS-SD検出ドメインも探索します。同一LAN上のgatewayは`local.`から自動的に表示されます。
ネットワークをまたぐ検出では、beacon typeを変えずに設定済み広域ドメインを使えます。

### tailnet（ネットワーク間）

mDNSがブロックされている場合は、unicast DNS-SDゾーン（ドメインを選択。例:
`openclaw.internal.`）とTailscale split DNSを使います。
CoreDNSの例については[Bonjour](/ja-JP/gateway/bonjour)を参照してください。

### 手動host/port

Settingsで**Manual Host**を有効にし、gateway host + port（デフォルト`18789`）を入力します。

## Canvas + A2UI

iOS NodeはWKWebView canvasを描画します。これを駆動するには`node.invoke`を使います。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注:

- Gateway canvas hostは`/__openclaw__/canvas/`と`/__openclaw__/a2ui/`を提供します。
- これはGateway HTTPサーバーから配信されます（`gateway.port`と同じポート。デフォルト`18789`）。
- iOS Nodeは、canvas host URLが通知されている場合、接続時にA2UIへ自動移動します。
- 組み込みscaffoldへ戻るには、`canvas.navigate`に`{"url":""}`を渡します。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wakeとtalk modeはSettingsで利用できます。
- iOSはバックグラウンド音声を停止することがあるため、appがアクティブでないときの音声機能はベストエフォートと考えてください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS appをフォアグラウンドへ戻してください（canvas/camera/screenコマンドには前面表示が必要です）。
- `A2UI_HOST_NOT_CONFIGURED`: Gatewayがcanvas host URLを通知していませんでした。[Gateway configuration](/ja-JP/gateway/configuration)の`canvasHost`を確認してください。
- ペアリングプロンプトが表示されない: `openclaw devices list`を実行し、手動で承認してください。
- 再インストール後に再接続できない: Keychainのペアリングtokenが消去されています。Nodeを再ペアリングしてください。

## 関連ドキュメント

- [Pairing](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
