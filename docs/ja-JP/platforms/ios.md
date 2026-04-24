---
read_when:
    - iOS node をペアリングまたは再接続する
    - iOS アプリをソースから実行する
    - Gateway 検出または canvas コマンドをデバッグしています
summary: 'iOS node アプリ: Gateway への接続、ペアリング、canvas、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-04-24T05:07:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

利用状況: 内部プレビュー。iOS アプリはまだ一般公開配布されていません。

## できること

- WebSocket 経由で Gateway に接続する（LAN または tailnet）。
- node capability を公開する: Canvas、Screen snapshot、Camera capture、Location、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、node status event を報告する。

## 要件

- 別デバイス上で動作している Gateway（macOS、Linux、または WSL2 経由の Windows）。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - unicast DNS-SD 経由の tailnet（例: `openclaw.internal.` ドメイン）、**または**
  - 手動 host/port（フォールバック）。

## クイックスタート（pair + connect）

1. Gateway を起動します:

```bash
openclaw gateway --port 18789
```

2. iOS アプリで Settings を開き、検出された gateway を選びます（または Manual Host を有効にして host/port を入力します）。

3. Gateway ホスト上でペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが認証詳細（role/scopes/public key）の変更付きでペアリングを再試行すると、
前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に再度 `openclaw devices list` を実行してください。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向け relay ベース push

公式配布された iOS ビルドは、生の APNs
token を Gateway に公開する代わりに外部 push relay を使います。

Gateway 側の要件:

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

- iOS アプリは、App Attest と app receipt を使って relay に登録します。
- relay は、不透明な relay handle と、登録スコープ付き send grant を返します。
- iOS アプリは、ペア済み Gateway identity を取得して relay 登録に含めるため、その relay ベース登録はその特定の Gateway に委譲されます。
- アプリは、その relay ベース登録を `push.apns.register` でペア済み Gateway に転送します。
- Gateway は、その保存済み relay handle を `push.test`、バックグラウンド wake、wake nudge に使用します。
- Gateway relay base URL は、公式/TestFlight iOS ビルドに焼き込まれた relay URL と一致していなければなりません。
- その後アプリが別の Gateway や、別の relay base URL を持つビルドに接続した場合、
  古いバインディングを再利用する代わりに relay 登録を更新します。

この経路で Gateway が **不要** なもの:

- デプロイ全体での relay token は不要
- 公式/TestFlight の relay ベース送信に direct APNs key は不要

想定される operator フロー:

1. 公式/TestFlight iOS ビルドをインストールする。
2. Gateway 上で `gateway.push.apns.relay.baseUrl` を設定する。
3. アプリを Gateway にペアリングし、接続完了まで待つ。
4. アプリは、APNs token を取得し、operator セッションが接続され、relay 登録が成功した後、自動的に `push.apns.register` を公開する。
5. その後、`push.test`、再接続 wake、wake nudge は保存済み relay ベース登録を使用できる。

互換性の注記:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、Gateway の一時的な env 上書きとして引き続き動作します。

## 認証と信頼フロー

relay は、公式 iOS ビルドに対して direct APNs-on-gateway では提供できない
2 つの制約を強制するために存在します。

- Apple 経由で配布された正規の OpenClaw iOS ビルドだけが hosted relay を利用できる。
- Gateway は、その特定の
  Gateway とペアリングした iOS デバイスに対してのみ relay ベース push を送信できる。

ホップごと:

1. `iOS app -> gateway`
   - アプリはまず通常の Gateway auth フローを通じて Gateway とペアリングします。
   - これにより、アプリは認証済み node セッションと認証済み operator セッションを取得します。
   - operator セッションは `gateway.identity.get` の呼び出しに使われます。

2. `iOS app -> relay`
   - アプリは HTTPS 経由で relay 登録 endpoint を呼び出します。
   - 登録には App Attest の proof と app receipt が含まれます。
   - relay は bundle ID、App Attest proof、Apple receipt を検証し、
     公式/本番の配布経路を要求します。
   - これにより、ローカルの Xcode/dev ビルドは hosted relay を使えません。ローカルビルドは
     署名済みでも、relay が期待する公式 Apple 配布の proof を満たしません。

3. `gateway identity delegation`
   - relay 登録の前に、アプリは
     `gateway.identity.get` からペア済み Gateway identity を取得します。
   - アプリはその Gateway identity を relay 登録 payload に含めます。
   - relay は、その Gateway identity に委譲された relay handle と登録スコープ付き send grant を返します。

4. `gateway -> relay`
   - Gateway は、`push.apns.register` から relay handle と send grant を保存します。
   - `push.test`、再接続 wake、wake nudge 時に、Gateway は自分自身の device identity で send request に署名します。
   - relay は、保存済み send grant と Gateway 署名の両方を、登録時に委譲された
     Gateway identity に対して検証します。
   - 別の Gateway は、たとえ somehow handle を取得できたとしても、その保存済み登録を再利用できません。

5. `relay -> APNs`
   - relay は、本番 APNs 認証情報と、公式ビルド用の生の APNs token を所有します。
   - Gateway は、relay ベースの公式ビルド向けに生の APNs token を保存しません。
   - relay は、ペア済み Gateway を代理して APNs に最終 push を送信します。

この設計が作られた理由:

- 本番 APNs 認証情報をユーザー Gateway から隔離するため。
- 公式ビルドの生の APNs token を Gateway に保存しないため。
- hosted relay を公式/TestFlight OpenClaw ビルドにのみ許可するため。
- ある Gateway が、別の Gateway 所有の iOS デバイスに wake push を送るのを防ぐため。

ローカル/手動ビルドは引き続き direct APNs を使います。relay なしでそれらの
ビルドをテストする場合、Gateway には引き続き direct APNs 認証情報が必要です。

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストのランタイム env var であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は
`ASC_KEY_ID` や `ASC_ISSUER_ID` のような App Store Connect / TestFlight 認証のみを保存し、
ローカル iOS ビルド向け direct APNs 配信は設定しません。

推奨される Gateway ホスト保存場所:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルを commit したり、repo checkout 配下に置いたりしないでください。

## 検出経路

### Bonjour（LAN）

iOS アプリは `local.` 上の `_openclaw-gw._tcp` を browse し、設定されていれば
同じ wide-area DNS-SD discovery ドメインも browse します。同一 LAN の gateway は `local.` から自動表示されます。
ネットワークをまたぐ検出では、beacon type を変更せずに設定済み wide-area ドメインを使用できます。

### Tailnet（ネットワーク越し）

mDNS がブロックされている場合は、unicast DNS-SD zone（ドメインを選択。例:
`openclaw.internal.`）と Tailscale split DNS を使用します。
CoreDNS 例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動 host/port

Settings で **Manual Host** を有効にし、Gateway host + port（デフォルト `18789`）を入力します。

## Canvas + A2UI

iOS node は WKWebView canvas を描画します。駆動には `node.invoke` を使用します。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注:

- Gateway canvas host は `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- これは Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルト `18789`）から提供されます。
- iOS node は、canvas host URL が通知されると接続時に自動で A2UI に遷移します。
- `canvas.navigate` と `{"url":""}` で組み込み scaffold に戻れます。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake と Talk mode は Settings で利用できます。
- iOS はバックグラウンド音声を停止することがあるため、アプリがアクティブでないときの音声機能はベストエフォートと考えてください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドに戻してください（canvas/camera/screen コマンドにはそれが必要です）。
- `A2UI_HOST_NOT_CONFIGURED`: Gateway が canvas host URL を通知していません。 [Gateway configuration](/ja-JP/gateway/configuration) の `canvasHost` を確認してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行して手動で承認してください。
- 再インストール後に再接続できない: Keychain の pairing token が消去されました。node を再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
