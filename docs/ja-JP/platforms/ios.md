---
read_when:
    - iOS Nodeのペアリングまたは再接続
    - Apple Watch 直接接続 Node の有効化またはトラブルシューティング
    - ソースからiOSアプリを実行する
    - Gateway の検出またはキャンバスコマンドのデバッグ
summary: iOS Nodeアプリ：Gatewayへの接続、ペアリング、キャンバス、トラブルシューティング
title: iOSアプリ
x-i18n:
    generated_at: "2026-07-12T14:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: iPhone アプリのビルドは、リリースで有効になっている場合に Apple のチャネルを通じて配布されます。ローカル開発ビルドはソースから実行することもできます。

## 機能

- WebSocket 経由で Gateway（LAN または tailnet）に接続します。
- ノード機能を公開します: Canvas、画面スナップショット、カメラ撮影、位置情報、トークモード、音声ウェイク。
- `node.invoke` コマンドを受信し、ノードステータスイベントを報告します。
- Agents 画面（Files）から、選択したエージェントのワークスペースを読み取り専用で閲覧できます。ディレクトリのドリルダウン、構文強調表示付きテキストプレビュー、画像プレビュー、共有シートへのエクスポートに対応します。書き込み操作はできません。プレビューのサイズは Gateway によって制限されます。
- ペアリング済み Gateway ごとに、最近のチャットセッションとトランスクリプトの小規模な読み取り専用オフラインキャッシュを保持します。コールド起動時には最後に確認されたトランスクリプトを即座に表示し、Gateway が応答すると更新します。切断中も最近のチャットを閲覧でき、リセットまたは登録解除を行うと保護されたローカルキャッシュが消去されます。
- 切断中に送信されたテキストメッセージを、Gateway ごとの永続的な送信トレイ（最大 50 件）にキューイングします。キュー内の吹き出しはトランスクリプトに表示され、再接続時にべき等な再試行によって順番に送信され、正規の履歴で送信が確認されるまで保持されます。再試行または削除の操作を表示する前にバックオフ付きで再試行し、オフライン状態が 48 時間続いた場合は送信せずに期限切れとなります。リセットまたは登録解除を行うと、キャッシュとともにキューも消去されます。
- 必要に応じてアシスタントのメッセージを読み上げます。Chat でメッセージを長押しし、**Listen** を選択します。アプリは、設定済みの TTS プロバイダーを使用して、Gateway が対応する `tts.speak` クリップを再生します。Gateway の音声を利用できない、または再生できない場合は、デバイス上の音声合成にフォールバックします。セッションの切り替え時またはバックグラウンド移行時に再生を停止します。

## 要件

- 別のデバイス（macOS、Linux、または WSL2 経由の Windows）で稼働している Gateway。
- ネットワーク経路:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の tailnet（ドメイン例: `openclaw.internal.`）、**または**
  - 手動のホスト/ポート（フォールバック）。

## クイックスタート（ペアリングと接続）

1. スマートフォンから到達可能な経路を持つ、認証済みの Gateway を起動します。リモート接続には Tailscale
   Serve を推奨します。

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼できる同一 LAN 環境では、代わりに認証済みの `gateway.bind: "lan"`
を使用します。デフォルトのループバックバインドにはスマートフォンから到達できません。
Gateway がまだ設定されていない場合は、最初に `openclaw onboard` を実行し、
セットアップコードの作成でトークンまたはパスワードによる認証経路を使用できるようにします。

2. [Control UI](/ja-JP/web/control-ui) を開き、**Nodes** を選択して、**Devices** ページの
   **Pair mobile device** をクリックします。

3. iOS アプリで **Settings** -> **Gateway** を開き、QR コードをスキャン（または
   セットアップコードを貼り付け）して接続します。

   セットアップコードに LAN と Tailscale Serve の両方の経路が含まれている場合、アプリは
   順番にプローブし、最初に到達できたエンドポイントを保存します。

4. 公式アプリは自動的に接続します。**Pending approval** にリクエストが表示された場合は、
   承認する前にそのロールとスコープを確認します。

Control UI のボタンを使用するには、`operator.admin` を持つペアリング済みセッションが必要です。
ターミナルから操作する場合は、iOS アプリで検出された Gateway を選択するか、Manual Host を有効にして
ホスト/ポートを入力してから、Gateway ホスト上でリクエストを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証情報（ロール、スコープ、公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` をもう一度実行してください。

任意: iOS ノードが常に厳密に管理されたサブネットから接続する場合は、明示的な CIDR または正確な IP を指定して、初回のノード自動承認をオプトインで有効にできます。

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

これはデフォルトで無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

5. 接続を確認します。

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

デフォルトでは、Apple Watch コンパニオンは既存の iPhone リレーを引き続き使用するため、
個別に Gateway とペアリングする必要はありません。Apple の Watch アプリで Watch を iPhone と
ペアリングし、**Watch app -> My Watch -> Available
Apps** から OpenClaw をインストールしてから、両方のデバイスで OpenClaw を一度開きます。

## コマンド承認の確認

`operator.admin` を持つオペレーター接続、または Gateway によって明示的に対象として指定された
ペアリング済みの `operator.approvals` 接続は、iPhone で保留中の exec リクエストを確認できます。
承認カードには、Gateway によってサニタイズされたコマンドプレビュー、警告、ホストコンテキスト、
有効期限、およびそのリクエストで提示された決定のみが表示されます。ペアリング済みの Apple Watch は、
既存の iPhone リレーを通じて同じレビュアー向けの安全なプロンプトを受信し、
簡潔な 1 回のみ許可/拒否の決定項目を提示します。Watch の Gateway 直接接続モードでは、
承認プロンプトは伝送されません。

承認状態は Control UI および対応するチャット画面と共有されます。
最初に確定された回答が優先されます。iPhone と Watch は、別の画面がリクエストを解決した後、
リモートの解決済み通知を受信した後、および解決確認応答が失われた可能性がある場合に、
Gateway の正規の最終レコードを取得します。その読み戻しによってリクエストがまだ保留中かどうかが
確認されるまで、操作は利用できません。

承認の所有権は、選択された Gateway に関連付けられます。Gateway を切り替えても、古いプロンプトを
新しい接続に適用することはできません。統合承認メソッドより前の Gateway では、
リリース済みの exec 固有メソッドにフォールバックします。保持される最終状態と、
より詳細な画面間の結果を利用するには、更新済みの Gateway が必要です。

## 任意の Apple Watch 直接ノード

直接モードでは、Watch に独自の署名済みノード ID と Gateway 接続が付与されます。
OpenClaw がアクティブな間は、ペアリング済みの iPhone が利用できない場合でも、
Watch の Wi-Fi またはモバイル通信経由で、対応するノードコマンドが引き続き動作します。

要件:

- iPhone が `operator.admin` スコープで Gateway に接続されていること。
- セットアップコードが、watchOS によって信頼される証明書を持つ `wss://` Gateway エンドポイントを通知していること。
  Watch は対応する `https://` オリジンをポーリングします。プレーン HTTP、および自己署名証明書や
  フィンガープリントのみに基づく信頼には対応していません。エンドポイントの設定については、
  [Gateway が管理するペアリング](/ja-JP/gateway/pairing)を参照してください。ループバック、iPhone のみ、
  および tailnet のみの経路には、Watch から単独では到達できません。
- モバイル通信を使用するには、モバイル通信対応の Apple Watch と有効なサービスが必要です。
- Watch 上で OpenClaw がアクティブであること。Apple は通常の watchOS アプリが
  汎用 WebSocket/TCP 接続を維持することを許可していないため、直接ノードは短い HTTPS
  ポーリングを使用し、アプリがフォアグラウンドに戻ると再接続します。Apple の
  [watchOS の低レベルネットワークに関するガイダンス](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)を参照してください。

セットアップ:

1. iPhone で **Settings -> Apple Watch** を開きます。
2. **Enable Direct Gateway Connection** をタップします。
3. 有効期間の短いセットアップコードが期限切れになる前に、Watch で OpenClaw を開きます。
4. `openclaw nodes status` で個別の Apple Watch 行を確認します。

セットアップコードには、有効期間の短いノード専用ブートストラップ認証情報が含まれます。
期限切れになるまではパスワードと同様に扱ってください。iPhone に保存されている Gateway の
パスワードやトークンが含まれることはありません。ペアリング後、Watch は独自のデバイストークンを
保存し、ブートストラップ認証情報を削除します。直接モードが対象とするのは、以下のコマンドのみです。
Chat、Talk、承認、および既存の `watch.*` 通知フローは引き続き iPhone リレー機能であり、
ペアリング済みの iPhone が必要です。

watchOS 直接ノードコマンド:

| サーフェス    | コマンド                       | 備考                                                         |
| ------------- | ------------------------------ | ------------------------------------------------------------ |
| デバイス      | `device.info`, `device.status` | Watch の ID、バッテリー、温度、ストレージ、ネットワーク。   |
| 通知          | `system.notify`                | アプリがアクティブな間のみ。Watch の権限が必要です。         |

watchOS はサードパーティ製アプリに WebKit を公開していないため、Watch の直接ノードは
Canvas コマンドを通知しません。

## 公式ビルド向けのリレー型プッシュ通知

公式に配布される iOS ビルドでは、生の APNs トークンを Gateway に公開する代わりに、外部プッシュリレーを使用します。公開リリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型リレーを使用します。このベース URL は App Store 配布用にハードコードされており、オーバーライドを読み取りません。

カスタムリレーのデプロイには、リレー URL が Gateway のリレー URL と一致する、明確に分離された iOS ビルド/デプロイ経路が必要です。App Store リリースレーンではカスタムリレー URL を一切受け付けません。カスタムリレービルドを使用する場合は、一致する Gateway リレー URL を設定します。

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

- iOS アプリは、App Attest と StoreKit アプリトランザクション JWS を使用してリレーに登録します。
- リレーは、不透明なリレーハンドルと、登録スコープの送信許可を返します。
- iOS アプリはペアリング済み Gateway の ID（`gateway.identity.get`）を取得し、リレー登録に含めます。これにより、リレー型登録はその特定の Gateway に委任されます。
- アプリは、そのリレー型登録を `push.apns.register` でペアリング済み Gateway に転送します。
- Gateway は、保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、ウェイクナッジに使用します。
- その後アプリが別の Gateway、または異なるリレーベース URL を持つビルドに接続した場合は、古いバインディングを再利用せず、リレー登録を更新します。

この経路で Gateway に**不要**なもの: デプロイ全体のリレートークン、および公式 App Store のリレー型送信に使用する直接 APNs キーはいずれも不要です。

想定されるオペレーターの手順:

1. 公式 iOS アプリをインストールします。
2. 任意: 明確に分離されたカスタムリレービルドを使用する場合に限り、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway とペアリングし、接続が完了するまで待ちます。
4. APNs トークンが取得され、オペレーターセッションが接続され、リレー登録が成功すると、アプリは `push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、ウェイクナッジで、保存済みのリレー型登録を使用できます。

## バックグラウンド生存ビーコン

サイレントプッシュ、バックグラウンド更新、または重要な位置情報イベントによって iOS がアプリを起動すると、アプリは短時間のノード再接続を試みた後、`event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済みノードのデバイス ID が判明した後に限り、ペアリング済みノード/デバイスのメタデータにこれを `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway の応答に `handled: true` が含まれている場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。この応答には互換性がありますが、永続的な最終確認時刻の更新としては扱われません。

互換性に関する注記:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、Gateway の一時的な環境変数オーバーライドとして引き続き機能します（設定優先の経路は `gateway.push.apns.relay.baseUrl` です）。
- App Store リリースビルドのプッシュモードでは、ホスト型リレーのホストがハードコードされており、リレー URL のオーバーライドを読み取ることはありません。`OPENCLAW_PUSH_RELAY_BASE_URL` ビルド時環境変数が影響するのは、ローカル/サンドボックス iOS ビルドモードのみです。

## 認証と信頼のフロー

リレーは、Gateway から APNs に直接接続する方式では公式 iOS ビルドに対して実現できない、次の 2 つの制約を適用するために存在します。

- Apple を通じて配布された正規の OpenClaw iOS ビルドのみが、ホスト型リレーを使用できます。
- Gateway は、その特定の Gateway とペアリングされた iOS デバイスに対してのみ、リレー型プッシュを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`: アプリは通常の Gateway 認証フローを通じて Gateway とペアリングし、認証済みの Node セッションと認証済みのオペレーターセッションを取得します。オペレーターセッションは `gateway.identity.get` を呼び出します。
2. `iOS app -> relay`: アプリは、App Attest 証明と StoreKit アプリトランザクション JWS を使用して、HTTPS 経由でリレー登録エンドポイントを呼び出します。リレーはバンドル ID、App Attest 証明、Apple 配布証明を検証し、公式の本番配布経路を必須とします。ローカルビルドは公式の Apple 配布証明を満たせないため、これによってローカルの Xcode/開発ビルドがホスト型リレーを使用できないようになります。
3. `gateway identity delegation`: リレー登録の前に、アプリは `gateway.identity.get` からペアリング済み Gateway の ID を取得し、リレー登録ペイロードに含めます。リレーは、リレーハンドルと、その Gateway ID に委任された登録スコープの送信許可を返します。
4. `gateway -> relay`: Gateway は `push.apns.register` から取得したリレーハンドルと送信許可を保存します。`push.test`、再接続ウェイク、ウェイクナッジでは、Gateway は自身のデバイス ID を使用して送信リクエストに署名します。リレーは、保存された送信許可と Gateway の署名の両方を、登録時に委任された Gateway ID に照らして検証します。別の Gateway は、何らかの方法でハンドルを取得した場合でも、その保存済み登録を再利用できません。
5. `relay -> APNs`: リレーは、本番 APNs 認証情報と公式ビルド用の生の APNs トークンを保持します。リレーを使用する公式ビルドでは、Gateway が生の APNs トークンを保存することはありません。リレーが、ペアリング済み Gateway に代わって最終的なプッシュを APNs に送信します。

この設計の目的は、本番 APNs 認証情報をユーザーの Gateway に置かず、公式ビルドの生の APNs トークンを Gateway に保存せず、公式 OpenClaw iOS ビルドだけがホスト型リレーを使用できるようにし、ある Gateway が別の Gateway に属する iOS デバイスへウェイクプッシュを送信することを防ぐことです。

ローカル/手動ビルドでは、引き続き直接 APNs を使用します。リレーを使わずにこれらのビルドをテストする場合、Gateway には直接 APNs 認証情報が必要です。

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは Gateway ホストのランタイム環境変数であり、Fastlane の設定ではありません。`apps/ios/fastlane/.env` に保存されるのは、`APP_STORE_CONNECT_KEY_ID` や `APP_STORE_CONNECT_ISSUER_ID` などの App Store Connect 認証情報だけです。ローカル iOS ビルド向けの直接 APNs 配信は設定されません。

`~/.openclaw/credentials/` にある他のプロバイダー認証情報と整合する、推奨の Gateway ホスト保存方法は次のとおりです。

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリのチェックアウト配下に配置したりしないでください。

## 検出経路

### Bonjour（LAN）

iOS アプリは `local.` 上の `_openclaw-gw._tcp` を参照し、設定されている場合は同じ広域 DNS-SD 検出ドメインも参照します。同じ LAN 上の Gateway は `local.` から自動的に表示されます。ネットワークをまたぐ検出では、ビーコンタイプを変更せずに、設定済みの広域ドメインを使用できます。

### Tailnet（ネットワーク間）

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン（ドメインを選択。例: `openclaw.internal.`）と Tailscale のスプリット DNS を使用してください。CoreDNS の例については、[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### ホスト/ポートの手動指定

Settings で **Manual Host** を有効にし、Gateway のホストとポート（デフォルトは `18789`）を入力します。

## 複数の Gateway

アプリは、これまでにペアリングしたすべての Gateway のレジストリを保持するため、再度ペアリングせずに切り替えられます。

- **Settings -> Gateway** には、アクティブな Gateway が示された **Paired Gateways** リストが表示されます。エントリをタップすると切り替わり、アプリは現在のセッションを終了して、選択した Gateway に再接続します。複数の Gateway がペアリングされている場合は、接続行の横にクイック切り替えメニューが表示されます。
- 認証情報、TLS 信頼の判断、Gateway ごとの設定、キャッシュ済みチャット履歴は、Gateway ごとに保存されます。切り替えても Gateway 間で状態が混在することはなく、プッシュ登録はアクティブな Gateway に追従します。
- ペアリング済み Gateway をスワイプするか、そのコンテキストメニューを使用して **Forget** を選択すると、その認証情報、デバイストークン、TLS ピン、キャッシュ済みチャットが削除されます。
- 検出された Gateway に切り替えるには、その Gateway がネットワーク上で可視である必要があります。手動設定した Gateway は、保存済みのホストとポートを使用して再接続します。

## Canvas + A2UI

iOS Node は WKWebView Canvas をレンダリングします。`node.invoke` を使用して操作します。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注:

- Gateway Canvas ホストは、Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルトは `18789`）から `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を配信します。
- iOS Node は、組み込みスキャフォールドを接続時のデフォルトビューとして維持します。`canvas.a2ui.push` と `canvas.a2ui.reset` は、アプリにバンドルされ、アプリが所有する A2UI ページを使用します。
- リモート Gateway の A2UI ページは、iOS ではレンダリング専用です。ネイティブ A2UI ボタンアクションは、アプリにバンドルされ、アプリが所有するページからのみ受け付けられます。
- `canvas.navigate` と `{"url":""}` を使用すると、組み込みスキャフォールドに戻ります。

## Computer Use との関係

iOS アプリはモバイル Node サーフェスであり、Codex Computer Use バックエンドではありません。Codex Computer Use と `cua-driver mcp` は MCP ツールを通じてローカルの macOS デスクトップを制御します。一方、iOS アプリは `canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などの OpenClaw Node コマンドを通じて iPhone の機能を公開します。

エージェントは Node コマンドを呼び出すことで、OpenClaw を通じて iOS アプリを操作できます。ただし、これらの呼び出しは Gateway Node プロトコルを経由し、iOS のフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップの制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS Node の機能についてはこのページを参照してください。

### Canvas の評価/スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは Settings で使用できます。
- `talk.realtime.transport` が `webrtc` の場合、OpenAI リアルタイム Talk はクライアント所有の WebRTC を使用します。明示的な `gateway-relay` 設定は引き続き Gateway 所有です。[トークモード](/ja-JP/nodes/talk) を参照してください。
- Talk 対応の iOS Node は `talk` 機能を通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` を宣言できます。Gateway は、信頼された Talk 対応 Node に対して、これらのプッシュトゥトークコマンドをデフォルトで許可します。
- iOS はバックグラウンド音声を一時停止する場合があります。アプリがアクティブでない場合、音声機能はベストエフォートとして扱ってください。

## 一般的なエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドに移動してください（Canvas/カメラ/画面コマンドには必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされた A2UI ページにアプリの WebView から到達できませんでした。Screen タブを表示したままアプリをフォアグラウンドに維持し、再試行してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- Watch に iPhone の状態が表示されない: `watch.status` で iPhone が `watchPaired: true`
  および `watchAppInstalled: true` を報告していることを確認してください。ペアリングが false の場合は、Apple の Watch アプリで
  Watch をペアリングしてください。インストールが false の場合は、**My Watch -> Available Apps** から
  コンパニオンをインストールしてください。いずれかを変更した後、Watch で OpenClaw を一度開いてください。
  即時到達性には引き続き両方のアプリが実行中である必要がありますが、
  キューに入った更新は後でバックグラウンドで到着する場合があります。
- 再インストール後に再接続できない: Keychain のペアリングトークンが消去されています。Node を再度ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
