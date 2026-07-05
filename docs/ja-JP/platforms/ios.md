---
read_when:
    - iOS ノードをペアリングまたは再接続する
    - ソースから iOS アプリを実行する
    - Gateway 検出またはキャンバスコマンドのデバッグ
summary: 'iOS ノードアプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-07-05T11:35:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627b48b8ae742423c21eabf65a55bbb4477c96447565ad6f5469e9cfb51b0ca1
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: iPhone アプリのビルドは、リリースで有効化されている場合に Apple チャネル経由で配布されます。ローカル開発ビルドもソースから実行できます。

## 機能

- WebSocket 経由で Gateway に接続します (LAN または tailnet)。
- ノード機能を公開します: Canvas、画面スナップショット、カメラ撮影、位置情報、トークモード、音声ウェイク。
- `node.invoke` コマンドを受信し、ノードステータスイベントを報告します。

## 要件

- 別のデバイスで Gateway が実行されていること (macOS、Linux、または WSL2 経由の Windows)。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の Tailnet (ドメイン例: `openclaw.internal.`)、**または**
  - 手動ホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. スマートフォンから到達できるルートで、認証済み Gateway を開始します。Tailscale
   Serve が推奨リモート経路です:

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼済みの同一 LAN セットアップでは、代わりに認証済みの `gateway.bind: "lan"` を使用します。
デフォルトのループバックバインドにはスマートフォンから到達できません。Gateway がまだ設定されていない場合は、セットアップコードの作成にトークンまたはパスワード認証経路を持たせるため、先に `openclaw onboard` を実行します。

2. [Control UI](/ja-JP/web/control-ui) を開き、**ノード**を選択して、**デバイス**カードの
   **モバイルデバイスをペアリング**をクリックします。

3. iOS アプリで **設定** -> **Gateway** を開き、QR コードをスキャンするか、セットアップコードを貼り付けて接続します。

4. 公式アプリは自動的に接続します。**デバイス**に保留中のリクエストが表示されている場合は、承認前にそのロールとスコープを確認します。

Control UI ボタンには、`operator.admin` を持つ既存のペアリング済みセッションが必要です。
ターミナルのフォールバックとして、iOS アプリで検出された Gateway を選択するか、手動ホストを有効にしてホスト/ポートを入力し、Gateway ホストでリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再度実行してください。

任意: iOS ノードが常に厳密に管理されたサブネットから接続する場合、明示的な CIDR または正確な IP を指定して、初回ノード自動承認を有効化できます:

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

これはデフォルトで無効です。要求スコープのない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

5. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー支援プッシュ

公式配布の iOS ビルドは、生の APNs トークンを Gateway に公開する代わりに、外部プッシュリレーを使用します。公開リリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型リレーを使用します。このベース URL は App Store 配布用にハードコードされており、上書き設定は読み取りません。

カスタムリレーのデプロイには、リレー URL が Gateway リレー URL と一致する、意図的に分離された iOS ビルド/デプロイ経路が必要です。App Store リリースレーンはカスタムリレー URL を受け付けません。カスタムリレービルドを使用している場合は、一致する Gateway リレー URL を設定します:

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
- iOS アプリはペアリング済み Gateway のアイデンティティ (`gateway.identity.get`) を取得し、リレー登録に含めます。これにより、リレー支援登録はその特定の Gateway に委任されます。
- アプリは、そのリレー支援登録を `push.apns.register` でペアリング済み Gateway に転送します。
- Gateway は、保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、ウェイク促進に使用します。
- アプリが後で別の Gateway、または異なるリレーベース URL のビルドに接続した場合、古いバインディングを再利用せずにリレー登録を更新します。

この経路で Gateway が必要と**しない**もの: デプロイ全体のリレートークン、公式 App Store のリレー支援送信用の直接 APNs キー。

想定されるオペレーターフロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway とペアリングし、接続完了を待ちます。
4. アプリは、APNs トークンを取得し、オペレーターセッションが接続され、リレー登録が成功すると、`push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、ウェイク促進は、保存されたリレー支援登録を使用できます。

## バックグラウンド生存ビーコン

iOS がサイレントプッシュ、バックグラウンド更新、または重要な位置情報イベントでアプリを起動すると、アプリは短時間のノード再接続を試行し、その後 `event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済みノードデバイスのアイデンティティが判明した後にのみ、これをペアリング済みノード/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway 応答に `handled: true` が含まれる場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` を確認する場合があります。この応答は互換性がありますが、永続的な最終確認更新としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、Gateway の一時的な env 上書きとして引き続き機能します (`gateway.push.apns.relay.baseUrl` が設定優先の経路です)。
- App Store リリースビルドのプッシュモードは、ホスト型リレーホストをハードコードしており、リレー URL 上書きを読み取りません。`OPENCLAW_PUSH_RELAY_BASE_URL` ビルド時 env var は、ローカル/サンドボックス iOS ビルドモードにのみ影響します。

## 認証と信頼フロー

リレーは、公式 iOS ビルドに対して Gateway 上の直接 APNs では提供できない 2 つの制約を強制するために存在します:

- Apple 経由で配布された正規の OpenClaw iOS ビルドのみが、ホスト型リレーを使用できます。
- Gateway は、その特定の Gateway とペアリングした iOS デバイスに対してのみ、リレー支援プッシュを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`: アプリは通常の Gateway 認証フローを通じて Gateway とペアリングし、認証済みノードセッションと認証済みオペレーターセッションを取得します。オペレーターセッションは `gateway.identity.get` を呼び出します。
2. `iOS app -> relay`: アプリは App Attest 証明と StoreKit アプリトランザクション JWS を使い、HTTPS 経由でリレー登録エンドポイントを呼び出します。リレーはバンドル ID、App Attest 証明、Apple 配布証明を検証し、公式/本番配布経路を要求します。これにより、ローカルビルドは公式 Apple 配布証明を満たせないため、ローカル Xcode/開発ビルドがホスト型リレーを使用できなくなります。
3. `gateway identity delegation`: リレー登録の前に、アプリは `gateway.identity.get` からペアリング済み Gateway のアイデンティティを取得し、リレー登録ペイロードに含めます。リレーは、その Gateway アイデンティティに委任されたリレーハンドルと登録スコープの送信許可を返します。
4. `gateway -> relay`: Gateway は `push.apns.register` からリレーハンドルと送信許可を保存します。`push.test`、再接続ウェイク、ウェイク促進の際、Gateway は自身のデバイスアイデンティティで送信リクエストに署名します。リレーは、保存された送信許可と Gateway 署名の両方を、登録時に委任された Gateway アイデンティティと照合して検証します。別の Gateway は、たとえ何らかの方法でハンドルを取得しても、その保存済み登録を再利用できません。
5. `relay -> APNs`: リレーは公式ビルドの本番 APNs 認証情報と生の APNs トークンを所有します。Gateway はリレー支援の公式ビルドについて生の APNs トークンを保存しません。リレーはペアリング済み Gateway に代わって最終プッシュを APNs に送信します。

この設計が作られた理由: 本番 APNs 認証情報をユーザーの Gateway から隔離し、公式ビルドの生の APNs トークンを Gateway に保存しないようにし、公式 OpenClaw iOS ビルドにのみホスト型リレーの使用を許可し、ある Gateway が別の Gateway に所有される iOS デバイスへウェイクプッシュを送信することを防ぐためです。

ローカル/手動ビルドは直接 APNs のままです。リレーなしでこれらのビルドをテストする場合、Gateway には引き続き直接 APNs 認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストのランタイム env vars であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は `APP_STORE_CONNECT_KEY_ID` や `APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect 認証のみを保存します。ローカル iOS ビルド向けの直接 APNs 配信は設定しません。

`~/.openclaw/credentials/` 配下の他のプロバイダー認証情報と一貫した、推奨 Gateway ホストストレージ:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリチェックアウト配下に置いたりしないでください。

## 検出経路

### Bonjour (LAN)

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ広域 DNS-SD 検出ドメインを参照します。同一 LAN の Gateway は `local.` から自動的に表示されます。クロスネットワーク検出では、ビーコンタイプを変更せずに、設定された広域ドメインを使用できます。

### Tailnet (クロスネットワーク)

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン (ドメインを選択。例: `openclaw.internal.`) と Tailscale split DNS を使用します。CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

設定で **手動ホスト** を有効にし、Gateway ホスト + ポート (デフォルト `18789`) を入力します。

## Canvas + A2UI

iOS ノードは WKWebView Canvas をレンダリングします。`node.invoke` を使用して操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway Canvas ホストは、Gateway HTTP サーバー ( `gateway.port` と同じポート、デフォルト `18789`) から `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を配信します。
- iOS ノードは、組み込みスキャフォールドを接続時のデフォルトビューとして維持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、バンドルされたアプリ所有の A2UI ページを使用します。
- リモート Gateway A2UI ページは iOS ではレンダー専用です。ネイティブ A2UI ボタンアクションは、バンドルされたアプリ所有ページからのみ受け付けられます。
- `canvas.navigate` と `{"url":""}` で組み込みスキャフォールドに戻ります。

## Computer Use との関係

iOS アプリはモバイルノードサーフェスであり、Codex Computer Use バックエンドではありません。Codex Computer Use と `cua-driver mcp` は MCP ツール経由でローカル macOS デスクトップを制御します。iOS アプリは、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などの OpenClaw ノードコマンドを通じて iPhone 機能を公開します。

エージェントはノードコマンドを呼び出すことで、OpenClaw 経由で iOS アプリを操作できますが、それらの呼び出しは Gateway ノードプロトコルを通り、iOS のフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS ノード機能についてはこのページを使用してください。

### Canvas eval / スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは設定で利用できます。
- OpenAI realtime Talk は、`talk.realtime.transport` が `webrtc` の場合、クライアント所有の WebRTC を使用します。明示的な `gateway-relay` 設定は引き続き Gateway 所有です。[トークモード](/ja-JP/nodes/talk)を参照してください。
- Talk 対応 iOS ノードは `talk` capability を通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。Gateway は、信頼済みの Talk 対応ノードに対して、これらのプッシュトゥトークコマンドをデフォルトで許可します。
- iOS はバックグラウンド音声を一時停止する場合があります。アプリがアクティブでない場合、音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドに移動してください（canvas/camera/screen コマンドにはこれが必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされた A2UI ページにアプリの WebView から到達できませんでした。アプリを Screen タブでフォアグラウンドにしたまま再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続が失敗する: Keychain のペアリングトークンが消去されています。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
