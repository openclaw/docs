---
read_when:
    - iOS ノードのペアリングまたは再接続
    - ソースから iOS アプリを実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: 'iOS Node アプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOSアプリ
x-i18n:
    generated_at: "2026-05-06T05:12:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: 内部プレビュー。iOSアプリはまだ一般公開されていません。

## 機能

- WebSocket（LANまたはtailnet）経由でGatewayに接続します。
- Node機能を公開します: Canvas、画面スナップショット、カメラキャプチャ、位置情報、トークモード、音声ウェイク。
- `node.invoke` コマンドを受信し、Nodeステータスイベントを報告します。

## 要件

- 別のデバイス（macOS、Linux、またはWSL2経由のWindows）で動作しているGateway。
- ネットワーク経路:
  - Bonjour経由の同一LAN、**または**
  - ユニキャストDNS-SD経由のtailnet（例のドメイン: `openclaw.internal.`）、**または**
  - 手動ホスト/ポート（フォールバック）。

## クイックスタート（ペアリング + 接続）

1. Gatewayを起動します:

```bash
openclaw gateway --port 18789
```

2. iOSアプリで設定を開き、検出されたGatewayを選択します（または手動ホストを有効にしてホスト/ポートを入力します）。

3. Gatewayホストでペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、
以前の保留中のリクエストは置き換えられ、新しい `requestId` が作成されます。
承認前にもう一度 `openclaw devices list` を実行してください。

任意: iOS Nodeが常に厳密に管理されたサブネットから接続する場合は、明示的なCIDRまたは正確なIPで初回Node自動承認を有効にできます:

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

これはデフォルトでは無効です。要求スコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー支援プッシュ

公式配布されるiOSビルドは、生のAPNsトークンをGatewayに公開する代わりに、外部プッシュリレーを使用します。

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

- iOSアプリはApp AttestとStoreKitアプリトランザクションJWSを使用してリレーに登録します。
- リレーは不透明なリレーハンドルと、登録スコープの送信許可を返します。
- iOSアプリはペアリング済みGateway IDを取得してリレー登録に含めるため、リレー支援登録はその特定のGatewayに委任されます。
- アプリはそのリレー支援登録を `push.apns.register` でペアリング済みGatewayに転送します。
- Gatewayは保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、ウェイクナッジに使用します。
- Gatewayのリレーbase URLは、公式/TestFlight iOSビルドに組み込まれたリレーURLと一致している必要があります。
- アプリが後で別のGatewayや異なるリレーbase URLのビルドに接続した場合、古いバインディングを再利用せずにリレー登録を更新します。

この経路でGatewayに**不要**なもの:

- デプロイ全体のリレートークンは不要です。
- 公式/TestFlightのリレー支援送信用の直接APNsキーは不要です。

想定されるオペレーターフロー:

1. 公式/TestFlight iOSビルドをインストールします。
2. Gatewayで `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリをGatewayにペアリングし、接続が完了するまで待ちます。
4. アプリはAPNsトークンを取得し、オペレーターセッションが接続され、リレー登録に成功した後、自動的に `push.apns.register` を発行します。
5. その後、`push.test`、再接続ウェイク、ウェイクナッジは、保存されたリレー支援登録を使用できます。

## バックグラウンドaliveビーコン

iOSがサイレントプッシュ、バックグラウンド更新、または重要な位置情報イベントでアプリをウェイクすると、アプリは短いNode再接続を試み、その後 `event: "node.presence.alive"` で `node.event` を呼び出します。
Gatewayは、認証済みNodeデバイスIDが判明した後にのみ、これをペアリング済みNode/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gatewayレスポンスに `handled: true` が含まれる場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古いGatewayは `{ "ok": true }` で `node.event` に応答する場合があります。このレスポンスは互換性がありますが、永続的なlast-seen更新としては数えられません。

互換性に関する注記:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、Gatewayの一時的なenv上書きとして引き続き機能します。

## 認証と信頼フロー

リレーは、直接APNs-on-Gatewayでは公式iOSビルドに提供できない2つの制約を強制するために存在します:

- Appleを通じて配布された本物のOpenClaw iOSビルドのみが、ホストされたリレーを使用できます。
- Gatewayは、その特定のGatewayとペアリングしたiOSデバイスに対してのみ、リレー支援プッシュを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`
   - アプリはまず通常のGateway認証フローを通じてGatewayとペアリングします。
   - これにより、アプリは認証済みNodeセッションと認証済みオペレーターセッションを取得します。
   - オペレーターセッションは `gateway.identity.get` の呼び出しに使用されます。

2. `iOS app -> relay`
   - アプリはHTTPS経由でリレー登録エンドポイントを呼び出します。
   - 登録にはApp Attestの証明とStoreKitアプリトランザクションJWSが含まれます。
   - リレーはバンドルID、App Attest証明、Apple配布証明を検証し、公式/本番配布経路を要求します。
   - これにより、ローカルのXcode/devビルドがホストされたリレーを使用することを防ぎます。ローカルビルドは署名されている場合がありますが、リレーが期待する公式Apple配布証明を満たしません。

3. `gateway identity delegation`
   - リレー登録の前に、アプリは `gateway.identity.get` からペアリング済みGateway IDを取得します。
   - アプリはそのGateway IDをリレー登録ペイロードに含めます。
   - リレーは、そのGateway IDに委任されたリレーハンドルと登録スコープの送信許可を返します。

4. `gateway -> relay`
   - Gatewayは `push.apns.register` からリレーハンドルと送信許可を保存します。
   - `push.test`、再接続ウェイク、ウェイクナッジでは、Gatewayは自身のデバイスIDで送信リクエストに署名します。
   - リレーは、保存された送信許可とGateway署名の両方を、登録時に委任されたGateway IDに照らして検証します。
   - 別のGatewayは、たとえ何らかの方法でハンドルを取得したとしても、その保存済み登録を再利用できません。

5. `relay -> APNs`
   - リレーは公式ビルド用の本番APNs資格情報と生のAPNsトークンを所有します。
   - Gatewayはリレー支援の公式ビルドについて、生のAPNsトークンを保存しません。
   - リレーはペアリング済みGatewayに代わって、最終的なプッシュをAPNsに送信します。

この設計が作成された理由:

- 本番APNs資格情報をユーザーのGateway外に保持するため。
- 公式ビルドの生APNsトークンをGatewayに保存しないようにするため。
- 公式/TestFlight OpenClawビルドにのみ、ホストされたリレーの利用を許可するため。
- あるGatewayが別のGatewayに所有されるiOSデバイスへウェイクプッシュを送信することを防ぐため。

ローカル/手動ビルドは引き続き直接APNsを使用します。リレーなしでそれらのビルドをテストする場合、Gatewayには引き続き直接APNs資格情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらはGatewayホストのランタイムenv varsであり、Fastlane設定ではありません。`apps/ios/fastlane/.env` は `ASC_KEY_ID` や `ASC_ISSUER_ID` などのApp Store Connect / TestFlight認証のみを保存します。ローカルiOSビルド向けの直接APNs配信は設定しません。

推奨されるGatewayホスト側の保存場所:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリのチェックアウト配下に置いたりしないでください。

## 検出経路

### Bonjour（LAN）

iOSアプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ広域DNS-SD検出ドメインを参照します。同一LANのGatewayは `local.` から自動的に表示されます。ネットワークをまたぐ検出では、ビーコン種別を変更せずに設定済みの広域ドメインを使用できます。

### Tailnet（ネットワーク間）

mDNSがブロックされている場合は、ユニキャストDNS-SDゾーン（ドメインを選択します。例:
`openclaw.internal.`）とTailscale split DNSを使用します。
CoreDNSの例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

設定で**手動ホスト**を有効にし、Gatewayホスト + ポート（デフォルト `18789`）を入力します。

## Canvas + A2UI

iOS NodeはWKWebViewキャンバスをレンダリングします。`node.invoke` を使用して操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注記:

- Gateway canvas hostは `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- Gateway HTTPサーバー（`gateway.port` と同じポート、デフォルト `18789`）から提供されます。
- iOS Nodeは、canvas host URLが通知されている場合、接続時に自動的にA2UIへ移動します。
- `canvas.navigate` と `{"url":""}` で組み込みスキャフォールドに戻ります。

## Computer Useとの関係

iOSアプリはモバイルNodeサーフェスであり、Codex Computer Useバックエンドではありません。Codex Computer Useと `cua-driver mcp` は、MCPツールを通じてローカルmacOSデスクトップを制御します。iOSアプリは、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などのOpenClaw Nodeコマンドを通じてiPhone機能を公開します。

エージェントはNodeコマンドを呼び出すことでOpenClaw経由でiOSアプリを操作できますが、これらの呼び出しはGateway Nodeプロトコルを経由し、iOSのフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS Node機能についてはこのページを使用してください。

### Canvas eval / スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは設定で利用できます。
- Talk対応iOS Nodeは `talk` 機能を通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。Gatewayは信頼済みのTalk対応Nodeに対して、これらのプッシュツートークコマンドをデフォルトで許可します。
- iOSはバックグラウンド音声を一時停止することがあります。アプリがアクティブでない場合、音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOSアプリをフォアグラウンドに移動します（canvas/camera/screenコマンドではこれが必要です）。
- `A2UI_HOST_NOT_CONFIGURED`: Gatewayがcanvas host URLを通知していません。 [Gateway設定](/ja-JP/gateway/configuration) の `canvasHost` を確認してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続が失敗する: Keychainのペアリングトークンが消去されています。Nodeを再ペアリングしてください。

## 関連ドキュメント

- [Pairing](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
