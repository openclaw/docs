---
read_when:
    - iOS ノードのペアリングまたは再接続
    - ソースからiOSアプリを実行する
    - Gateway 検出またはキャンバスコマンドのデバッグ
summary: 'iOS ノードアプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-07-02T22:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: iPhone アプリのビルドは、リリースで有効化されている場合、Apple チャネルを通じて配布されます。ローカル開発ビルドはソースから実行することもできます。

## 機能

- WebSocket 経由で Gateway に接続します (LAN または tailnet)。
- ノード機能を公開します: Canvas、画面スナップショット、カメラ撮影、位置情報、トークモード、音声ウェイク。
- `node.invoke` コマンドを受信し、ノード状態イベントを報告します。

## 要件

- 別のデバイスで実行中の Gateway (macOS、Linux、または WSL2 経由の Windows)。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の tailnet (ドメイン例: `openclaw.internal.`)、**または**
  - 手動ホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. Gateway を起動します:

```bash
openclaw gateway --port 18789
```

2. iOS アプリで Settings を開き、検出された Gateway を選択します (または Manual Host を有効にしてホスト/ポートを入力します)。

3. Gateway ホストでペアリング要求を承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前にもう一度 `openclaw devices list` を実行してください。

任意: iOS ノードが常に厳密に制御されたサブネットから接続する場合は、
明示的な CIDR または正確な IP を指定して、初回ノード自動承認をオプトインできます:

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

これはデフォルトでは無効です。これはリクエストされたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー経由プッシュ

公式に配布される iOS ビルドは、生の APNs トークンを Gateway に公開する代わりに、外部プッシュリレーを使用します。

公開リリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型リレーを使用します。

カスタムリレーデプロイには、リレー URL が Gateway のリレー URL と一致する、意図的に分離された iOS ビルド/デプロイパスが必要です。公開 App Store リリースレーンは、カスタムリレー URL の上書きを受け付けません。カスタムリレービルドを使用している場合は、一致する Gateway リレー URL を設定します:

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
- リレーは不透明なリレーハンドルと、登録スコープの送信許可を返します。
- iOS アプリはペアリング済み Gateway の ID を取得し、リレー登録に含めるため、リレー経由の登録はその特定の Gateway に委任されます。
- アプリは、そのリレー経由の登録を `push.apns.register` でペアリング済み Gateway に転送します。
- Gateway は保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、ウェイク促進に使用します。
- カスタム Gateway リレー URL は、iOS ビルドに組み込まれたリレー URL と一致している必要があります。
- アプリが後で別の Gateway、または別のリレーベース URL を持つビルドに接続した場合、古いバインディングを再利用せずにリレー登録を更新します。

このパスで Gateway に**不要**なもの:

- デプロイ全体のリレートークンは不要です。
- 公式 App Store のリレー経由送信用に、直接 APNs キーは不要です。

想定されるオペレーターフロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway にペアリングし、接続が完了するまで待ちます。
4. アプリは、APNs トークンを取得し、オペレーターセッションが接続され、リレー登録が成功した後、自動的に `push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、ウェイク促進は、保存されたリレー経由登録を使用できます。

## バックグラウンド生存ビーコン

iOS がサイレントプッシュ、バックグラウンド更新、または重要位置情報イベントでアプリを起動した場合、アプリは
短時間のノード再接続を試み、その後 `event: "node.presence.alive"` で `node.event` を呼び出します。
Gateway は、認証済みノードデバイス ID が判明した後にのみ、これをペアリング済みノード/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway レスポンスに `handled: true` が含まれている場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。このレスポンスは
互換性がありますが、永続的な最終確認更新としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、Gateway の一時的な環境変数上書きとして引き続き機能します。
- 公開 App Store リリースレーンは、iOS ビルド向けの `OPENCLAW_PUSH_RELAY_BASE_URL` を拒否します。

## 認証と信頼フロー

リレーは、公式 iOS ビルドにおいて Gateway 上の直接 APNs では提供できない 2 つの制約を強制するために存在します:

- Apple 経由で配布された正規の OpenClaw iOS ビルドのみが、ホスト型リレーを使用できます。
- Gateway は、その特定の Gateway とペアリングした iOS デバイスに対してのみ、リレー経由プッシュを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`
   - アプリはまず通常の Gateway 認証フローを通じて Gateway とペアリングします。
   - これにより、アプリには認証済みノードセッションと認証済みオペレーターセッションが付与されます。
   - オペレーターセッションは `gateway.identity.get` の呼び出しに使用されます。

2. `iOS app -> relay`
   - アプリは HTTPS 経由でリレー登録エンドポイントを呼び出します。
   - 登録には App Attest 証明と StoreKit アプリトランザクション JWS が含まれます。
   - リレーはバンドル ID、App Attest 証明、Apple 配布証明を検証し、
     公式/本番配布パスを要求します。
   - これにより、ローカル Xcode/開発ビルドがホスト型リレーを使用することを防ぎます。ローカルビルドは
     署名されている場合がありますが、リレーが期待する公式 Apple 配布証明を満たしません。

3. `gateway identity delegation`
   - リレー登録前に、アプリは `gateway.identity.get` からペアリング済み Gateway の ID を取得します。
   - アプリはその Gateway ID をリレー登録ペイロードに含めます。
   - リレーは、その Gateway ID に委任されたリレーハンドルと登録スコープの送信許可を返します。

4. `gateway -> relay`
   - Gateway は `push.apns.register` からのリレーハンドルと送信許可を保存します。
   - `push.test`、再接続ウェイク、ウェイク促進時に、Gateway は自身のデバイス ID で送信リクエストに署名します。
   - リレーは、保存された送信許可と Gateway 署名の両方を、登録時に委任された Gateway ID と照合して検証します。
   - 別の Gateway は、たとえ何らかの方法でハンドルを取得したとしても、その保存済み登録を再利用できません。

5. `relay -> APNs`
   - リレーは、公式ビルド用の本番 APNs 認証情報と生の APNs トークンを所有します。
   - Gateway は、リレー経由の公式ビルドについて生の APNs トークンを保存しません。
   - リレーは、ペアリング済み Gateway に代わって APNs に最終プッシュを送信します。

この設計が作成された理由:

- 本番 APNs 認証情報をユーザーの Gateway から切り離しておくため。
- 公式ビルドの生の APNs トークンを Gateway に保存しないため。
- 公式 OpenClaw iOS ビルドにのみホスト型リレーの使用を許可するため。
- ある Gateway が別の Gateway に属する iOS デバイスへウェイクプッシュを送信することを防ぐため。

ローカル/手動ビルドは直接 APNs のままです。リレーなしでこれらのビルドをテストする場合、
Gateway には引き続き直接 APNs 認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストのランタイム環境変数であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は
`APP_STORE_CONNECT_KEY_ID` や
`APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect 認証のみを保存します。ローカル iOS ビルド向けの直接 APNs 配信は構成しません。

推奨される Gateway ホストの保存先:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリチェックアウト配下に置いたりしないでください。

## 検出パス

### Bonjour (LAN)

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ
広域 DNS-SD 検出ドメインを参照します。同一 LAN の Gateway は `local.` から自動的に表示されます。
クロスネットワーク検出では、ビーコンタイプを変更せずに設定済みの広域ドメインを使用できます。

### Tailnet (クロスネットワーク)

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン (ドメインを選択します。例:
`openclaw.internal.`) と Tailscale 分割 DNS を使用します。
CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

Settings で **Manual Host** を有効にし、Gateway ホスト + ポート (デフォルト `18789`) を入力します。

## Canvas + A2UI

iOS ノードは WKWebView Canvas をレンダリングします。`node.invoke` で操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway の Canvas ホストは `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- これは Gateway HTTP サーバーから提供されます (`gateway.port` と同じポート、デフォルト `18789`)。
- iOS ノードは、接続時のデフォルトビューとして組み込みスキャフォールドを保持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、バンドルされたアプリ所有の A2UI ページを使用します。
- リモート Gateway A2UI ページは iOS ではレンダリング専用です。ネイティブ A2UI ボタンアクションは、バンドルされたアプリ所有ページからのみ受け付けられます。
- `canvas.navigate` と `{"url":""}` で組み込みスキャフォールドに戻ります。

## Computer Use との関係

iOS アプリはモバイルノードサーフェスであり、Codex Computer Use バックエンドではありません。Codex
Computer Use と `cua-driver mcp` は MCP ツールを通じてローカル macOS デスクトップを制御します。
iOS アプリは OpenClaw ノードコマンドを通じて iPhone 機能を公開します。
たとえば `canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` です。

エージェントはノードコマンドを呼び出すことで、OpenClaw 経由で iOS アプリを操作できますが、
これらの呼び出しは Gateway ノードプロトコルを通過し、iOS のフォアグラウンド/バックグラウンド制限に従います。
ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS ノード機能についてはこのページを使用してください。

### Canvas 評価 / スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは Settings で利用できます。
- OpenAI realtime Talk は、`talk.realtime.transport` が `webrtc` の場合、クライアント所有の WebRTC を使用します。明示的な `gateway-relay` 構成は引き続き Gateway 所有です。[トークモード](/ja-JP/nodes/talk) を参照してください。
- トーク対応 iOS ノードは `talk` 機能を通知し、
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。
  Gateway は、信頼されたトーク対応ノードに対して、これらのプッシュトゥトークコマンドをデフォルトで許可します。
- iOS はバックグラウンド音声を一時停止する場合があります。アプリがアクティブでない場合、音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドにしてください (Canvas/カメラ/画面コマンドには必要です)。
- `A2UI_HOST_UNAVAILABLE`: バンドルされた A2UI ページにアプリ WebView から到達できませんでした。アプリを Screen タブでフォアグラウンドに保ち、再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続に失敗する: Keychain のペアリングトークンが消去されました。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
