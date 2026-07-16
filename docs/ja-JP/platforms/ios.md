---
read_when:
    - iOS Nodeのペアリングまたは再接続
    - Apple Watch直接Nodeの有効化またはトラブルシューティング
    - ソースからiOSアプリを実行する
    - Gateway 検出または canvas コマンドのデバッグ
summary: iOS Nodeアプリ：Gatewayへの接続、ペアリング、キャンバス、トラブルシューティング
title: iOSアプリ
x-i18n:
    generated_at: "2026-07-16T11:59:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: リリースで有効になっている場合、iPhone アプリのビルドは Apple のチャネルを通じて配布されます。ローカル開発ビルドはソースから実行することもできます。

## 機能

- WebSocket 経由で Gateway（LAN または tailnet）に接続します。
- ノード機能を公開します: Canvas、画面スナップショット、カメラ撮影、位置情報、トークモード、音声ウェイク、およびオプトインのヘルスケア概要。
- `node.invoke` コマンドを受信し、ノードのステータスイベントを報告します。
- Agents 画面（Files）から、選択したエージェントのワークスペースを読み取り専用で参照できます。ディレクトリのドリルダウン、シンタックスハイライト付きテキストプレビュー、画像プレビュー、共有シートへのエクスポートに対応します。書き込み操作は行われず、プレビューのサイズは Gateway によって制限されます。
- ペアリング済み Gateway ごとに、最近のチャットセッションとトランスクリプトの小規模な読み取り専用オフラインキャッシュを保持します。コールド起動時には既知の最新トランスクリプトをすぐに表示し、Gateway が応答すると更新します。切断中も最近のチャットを参照でき、リセットまたは登録解除を行うと保護されたローカルキャッシュが消去されます。
- 切断中に送信されたテキストメッセージを、Gateway ごとの永続的な送信トレイ（最大 50 件）にキューイングします。キュー内の吹き出しはトランスクリプトに表示され、再接続時に冪等な再試行を行いながら順番に送信されます。正式な履歴で送信が確認されるまで保持され、再試行または削除操作を表示する前にバックオフ付きで再試行し、48 時間オフラインのままの場合は送信せず期限切れになります。リセットまたは登録解除を行うと、キャッシュとともにキューも消去されます。
- 必要に応じてアシスタントのメッセージを読み上げます。Chat でメッセージを長押しし、**Listen** を選択します。アプリは、設定された TTS プロバイダーを使用して Gateway が対応する `tts.speak` クリップを再生し、Gateway の音声を利用できない場合や再生できない場合はデバイス上の音声合成にフォールバックします。セッションを切り替えるか、アプリがバックグラウンドに移行すると再生は停止します。

## 要件

- 別のデバイス（macOS、Linux、または WSL2 経由の Windows）で Gateway が実行されていること。
- ネットワーク経路:
  - Bonjour を使用する同一 LAN、**または**
  - ユニキャスト DNS-SD を使用する tailnet（ドメイン例: `openclaw.internal.`）、**または**
  - ホストとポートの手動指定（フォールバック）。

## クイックスタート（ペアリングと接続）

初回起動時に、アプリは短いペアリングの説明と権限ページ
（通知、カメラ、マイク、写真、連絡先、カレンダー、
リマインダー、位置情報）を順に表示します。すべての許可は任意であり、
後から **Settings** -> **Permissions**、または iOS の Settings アプリで
変更できます。

1. スマートフォンから到達可能な経路で、認証済み Gateway を起動します。リモート経路には Tailscale
   Serve を推奨します:

```bash
openclaw gateway --port 18789 --tailscale serve
```

信頼できる同一 LAN 環境では、代わりに認証済みの `gateway.bind: "lan"` を
使用します。デフォルトの loopback バインドにはスマートフォンから到達できません。
Gateway がまだ設定されていない場合は、セットアップコードの作成時にトークンまたはパスワードによる
認証経路を使用できるよう、先に `openclaw onboard` を実行します。

2. [Control UI](/ja-JP/web/control-ui) を開き、**Nodes** を選択して、
   **Devices** ページの **Pair mobile device** をクリックします。完全アクセスが推奨され、
   デフォルトで選択されています。Gateway の管理コントロールを除外する場合にのみ
   Limited access を選択し、**Create setup code** をクリックします。

3. iOS アプリで **Settings** -> **Gateway** を開き、QR コードをスキャン（または
   セットアップコードを貼り付け）して接続します。

   セットアップコードに LAN と Tailscale Serve の両方の経路が含まれている場合、アプリは
   順番にプローブし、最初に到達できたエンドポイントを保存します。

4. 公式アプリは自動的に接続します。**Pending approval** にリクエストが
   表示された場合は、承認前にそのロールとスコープを確認します。

   **Settings → Gateway** には、保存されたオペレーター接続が
   **Full** アクセスか **Limited** アクセスかが表示されます。プレーンテキスト LAN の `ws://` セットアップは、
   ベアラートークンの安全性を確保するため自動的に制限されます。制限されている場合は、`wss://` または
   Tailscale Serve を設定し、Control UI または `openclaw qr` から新しい完全アクセスコードをスキャンして、
   再接続すると設定とアップグレードが有効になります。

Control UI のボタンを使用するには、`operator.admin` を持つペアリング済みセッションが必要です。
ターミナルをフォールバックとして使用する場合は、iOS アプリで検出された Gateway を選択するか
（または Manual Host を有効にしてホストとポートを入力し）、Gateway ホスト上でリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが認証情報（ロール、スコープ、公開鍵）を変更してペアリングを再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前にもう一度 `openclaw devices list` を実行します。

任意: iOS ノードが常に厳密に管理されたサブネットから接続する場合は、CIDR または正確な IP を明示して、初回のノード自動承認をオプトインで有効にできます:

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

これはデフォルトで無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーターまたはブラウザーのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

5. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## ヘルスケア概要

iOS ノードは、現在の暦日について、オプトインの読み取り専用 HealthKit 集計を返すことができます。
iPhone での同意と、明示的な Gateway コマンドの認可は、
それぞれ独立した条件です。セットアップ、呼び出し、ペイロードフィールド、プライバシー動作、トラブルシューティングについては、
[HealthKit の概要](/ja-JP/platforms/ios-healthkit)を参照してください。

デフォルトでは、Apple Watch コンパニオンは既存の iPhone リレーを引き続き使用し、
個別に Gateway とペアリングする必要はありません。Apple の Watch アプリで Watch を iPhone とペアリングし、
**Watch app -> My Watch -> Available
Apps** から OpenClaw をインストールしてから、両方のデバイスで OpenClaw を一度開きます。

## コマンド承認の確認

`operator.admin` を持つオペレーター接続、または Gateway が明示的に対象として指定した
ペアリング済み `operator.approvals` 接続は、iPhone 上で保留中の実行リクエストを確認できます。
承認カードには、Gateway によってサニタイズされたコマンドプレビュー、警告、ホストコンテキスト、有効期限、および
そのリクエストで提示される決定のみが表示されます。ペアリング済み Apple Watch は、既存の
iPhone リレーを通じて同じ確認者向けの安全なプロンプトを受信し、簡略化された
1 回のみ許可または拒否の選択肢を提示します。Watch の直接 Gateway モードでは、
承認プロンプトは伝送されません。

承認状態は Control UI および対応するチャット画面と共有されます。
最初に確定した回答が採用されます。iPhone と Watch は、別の画面でリクエストが解決された後、
リモートから解決済み通知を受けた後、および解決確認応答が
失われた可能性がある場合に、Gateway の正式な終了記録を取得します。その読み戻しにより
リクエストが引き続き保留中かどうか確認されるまで、操作は利用できません。

承認の所有権は、選択した Gateway に関連付けられます。Gateway を切り替えても、
古いプロンプトを切り替え後の接続に適用することはできません。統一承認メソッドより前の
Gateway は、出荷済みの実行固有メソッドにフォールバックします。
保持された終了状態およびより詳細な画面間結果を使用するには、Gateway の更新が必要です。

## 任意の Apple Watch 直接ノード

直接モードでは、Watch が独自の署名済みノード ID と Gateway 接続を持ちます。
OpenClaw がアクティブであれば、ペアリング済み iPhone を利用できない場合でも、
対応するノードコマンドは Watch の Wi-Fi またはモバイル通信を介して引き続き動作します。

要件:

- iPhone が `operator.admin` スコープで Gateway に接続されていること。
- セットアップコードが、watchOS によって信頼された証明書を持つ `wss://` Gateway エンドポイントを通知していること。
  Watch は対応する `https://` オリジンをポーリングします。プレーン HTTP、および
  自己署名またはフィンガープリントのみの信頼はサポートされません。エンドポイントの設定については、
  [Gateway 所有のペアリング](/ja-JP/gateway/pairing)を参照してください。loopback、iPhone のみ、
  および tailnet のみの経路には、Watch から単独で到達できません。
- モバイル通信を使用するには、モバイル通信対応の Apple Watch と有効なサービスが必要です。
- Watch 上で OpenClaw がアクティブであること。Apple は通常の watchOS アプリによる
  汎用 WebSocket/TCP 接続の維持を許可していないため、直接ノードは短時間の HTTPS
  ポーリングを使用し、アプリがフォアグラウンドに戻ったときに再接続します。Apple の
  [watchOS の低レベルネットワークに関するガイダンス](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)を参照してください。

セットアップ:

1. iPhone で **Settings -> Apple Watch** を開きます。
2. __Enable Direct Gateway Connection** をタップします。
3. 有効期間の短いセットアップコードが期限切れになる前に、Watch 上で OpenClaw を開きます。
4. `openclaw nodes status` で個別の Apple Watch 行を確認します。

セットアップコードには、有効期間が短くノード専用のブートストラップ認証情報が含まれます。
期限切れになるまではパスワードと同様に扱ってください。iPhone に保存された Gateway の
パスワードやトークンが含まれることはありません。ペアリング後、Watch は独自のデバイストークンを保存し、
ブートストラップ認証情報を削除します。直接モードで対応するのは、以下のコマンドのみです。
Chat、Talk、承認、および既存の `watch.*` 通知フローは引き続き
iPhone リレーの機能であり、ペアリング済み iPhone が必要です。

watchOS の直接ノードコマンド:

| サーフェス       | コマンド                       | 備考                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| デバイス        | `device.info`, `device.status` | Watch の ID、バッテリー、温度状態、ストレージ、ネットワーク。 |
| 通知 | `system.notify`                | アプリがアクティブな間のみ。Watch の権限が必要です。     |

watchOS はサードパーティ製アプリに WebKit を公開していないため、Watch の直接ノードは
Canvas コマンドを通知しません。

## 公式ビルド向けのリレーベースのプッシュ通知

公式に配布される iOS ビルドは、生の APNs トークンを Gateway に公開する代わりに、外部プッシュリレーを使用します。公開リリースレーンの公式 App Store ビルドは、`https://ios-push-relay.openclaw.ai` のホスト型リレーを使用します。このベース URL は App Store 配布用にハードコードされており、オーバーライドを読み取りません。

カスタムリレーをデプロイするには、リレー URL が Gateway のリレー URL と一致する、意図的に分離された iOS ビルドおよびデプロイ経路が必要です。App Store リリースレーンではカスタムリレー URL は受け付けられません。カスタムリレービルドを使用している場合は、一致する Gateway リレー URL を設定します:

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
- リレーは、不透明なリレーハンドルと登録スコープの送信許可を返します。
- iOS アプリは、ペアリング済み Gateway の ID（`gateway.identity.get`）を取得してリレー登録に含めるため、リレーベースの登録はその特定の Gateway に委任されます。
- アプリは、`push.apns.register` を使用して、そのリレーベースの登録をペアリング済み Gateway に転送します。
- Gateway は、保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、およびウェイク通知に使用します。
- アプリが後で別の Gateway または異なるリレーベース URL を持つビルドに接続した場合、古い関連付けを再利用せず、リレー登録を更新します。

この経路で Gateway に**不要**なもの: デプロイ全体で使用するリレートークンも、公式 App Store のリレーベース送信用の直接 APNs キーも必要ありません。

想定されるオペレーターのフロー:

1. 公式 iOS アプリをインストールします。
2. 任意: 意図的に分離されたカスタムリレービルドを使用する場合にのみ、Gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを Gateway とペアリングし、接続が完了するまで待ちます。
4. APNs トークンを取得し、オペレーターセッションが接続され、リレー登録が成功すると、アプリは `push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、およびウェイク通知で、保存されたリレーベースの登録を使用できます。

## バックグラウンドの生存ビーコン

サイレントプッシュ、バックグラウンド更新、または位置情報の大幅な変更イベントによってiOSがアプリを起動すると、アプリはNodeへの短時間の再接続を試みてから、`event: "node.presence.alive"`を指定して`node.event`を呼び出します。Gatewayは、認証済みNodeデバイスのアイデンティティが判明した後にのみ、ペアリング済みNode／デバイスのメタデータへこれを`lastSeenAtMs`/`lastSeenReason`として記録します。

アプリは、Gatewayの応答に`handled: true`が含まれる場合にのみ、バックグラウンド起動が正常に記録されたものとして扱います。古いGatewayは`node.event`に`{ "ok": true }`で応答する場合があります。この応答には互換性がありますが、永続的な最終確認日時の更新にはカウントされません。

互換性に関する注意:

- `OPENCLAW_APNS_RELAY_BASE_URL`は、Gatewayの一時的な環境変数オーバーライドとして引き続き機能します（`gateway.push.apns.relay.baseUrl`が設定優先のパスです）。
- App Storeリリースビルドのプッシュモードでは、ホスト型リレーのホストがハードコードされており、リレーURLのオーバーライドは一切読み取られません。ビルド時環境変数`OPENCLAW_PUSH_RELAY_BASE_URL`が影響するのは、ローカル／サンドボックスのiOSビルドモードのみです。

## 認証と信頼のフロー

このリレーは、Gateway上でAPNsに直接接続する方式では公式iOSビルドに対して実現できない、次の2つの制約を適用するために存在します。

- Appleを通じて配布された正規のOpenClaw iOSビルドのみが、ホスト型リレーを使用できます。
- Gatewayがリレー経由のプッシュを送信できるのは、そのGatewayとペアリングしたiOSデバイスに対してのみです。

ホップごとの流れ:

1. `iOS app -> gateway`: アプリは通常のGateway認証フローを通じてGatewayとペアリングし、認証済みNodeセッションと認証済みオペレーターセッションを取得します。オペレーターセッションが`gateway.identity.get`を呼び出します。
2. `iOS app -> relay`: アプリは、App Attestの証明とStoreKitアプリトランザクションJWSを使用して、HTTPS経由でリレー登録エンドポイントを呼び出します。リレーはバンドルID、App Attestの証明、Appleによる配布証明を検証し、公式／本番の配布経路を必須とします。ローカルビルドでは公式のApple配布証明を満たせないため、これによってローカルのXcode／開発ビルドがホスト型リレーを使用できないようにしています。
3. `gateway identity delegation`: リレーへ登録する前に、アプリは`gateway.identity.get`からペアリング済みGatewayのアイデンティティを取得し、リレー登録ペイロードに含めます。リレーは、そのGatewayアイデンティティに委任されたリレーハンドルと、登録スコープの送信権限を返します。
4. `gateway -> relay`: Gatewayは、`push.apns.register`から取得したリレーハンドルと送信権限を保存します。`push.test`、再接続による起動、および起動を促す通知の際、Gatewayは自身のデバイスアイデンティティで送信リクエストに署名します。リレーは、保存された送信権限とGatewayの署名の両方を、登録時に委任されたGatewayアイデンティティに照らして検証します。別のGatewayは、何らかの方法でハンドルを取得したとしても、保存されたその登録を再利用できません。
5. `relay -> APNs`: リレーは、本番APNsの認証情報と公式ビルドの生のAPNsトークンを保持します。リレー経由の公式ビルドでは、Gatewayが生のAPNsトークンを保存することはありません。リレーが、ペアリング済みGatewayに代わって最終的なプッシュをAPNsへ送信します。

この設計が作られた理由は、本番APNsの認証情報をユーザーのGatewayに置かないこと、公式ビルドの生のAPNsトークンをGatewayに保存しないこと、ホスト型リレーを公式OpenClaw iOSビルドのみが使用できるようにすること、そしてあるGatewayが別のGatewayに属するiOSデバイスへ起動プッシュを送信できないようにすることです。

ローカル／手動ビルドでは、引き続きAPNsへ直接接続します。リレーを使わずにこれらのビルドをテストする場合、Gatewayには引き続きAPNsへの直接接続用認証情報が必要です。

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらはGatewayホストの実行時環境変数であり、Fastlaneの設定ではありません。`apps/ios/fastlane/.env`が保存するのは、`APP_STORE_CONNECT_KEY_ID`や`APP_STORE_CONNECT_ISSUER_ID`などのApp Store Connect認証情報のみです。ローカルiOSビルド向けにAPNsへの直接配信を設定するものではありません。

`~/.openclaw/credentials/`配下にある他のプロバイダー認証情報と整合する、推奨されるGatewayホスト上の保存方法:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8`ファイルをコミットしたり、リポジトリのチェックアウト配下に配置したりしないでください。

## 検出経路

### Bonjour（LAN）

iOSアプリは`local.`上で`_openclaw-gw._tcp`を参照し、設定されている場合は同じ広域DNS-SD検出ドメインも参照します。同一LAN上のGatewayは`local.`から自動的に表示されます。ネットワークをまたぐ検出では、ビーコンタイプを変更せずに、設定済みの広域ドメインを使用できます。

### Tailnet（ネットワーク間）

mDNSがブロックされている場合は、ユニキャストDNS-SDゾーン（ドメインを選択。例: `openclaw.internal.`）とTailscaleのスプリットDNSを使用します。CoreDNSの例については、[Bonjour](/ja-JP/gateway/bonjour)を参照してください。

### ホスト／ポートの手動設定

Settingsで**Manual Host**を有効にし、Gatewayのホストとポート（デフォルトは`18789`）を入力します。

## 複数のGateway

アプリはペアリングしたすべてのGatewayのレジストリを保持するため、再度ペアリングせずに切り替えられます。

- **Settings -> Gateway**には、アクティブなGatewayが示された**Paired Gateways**リストが表示されます。項目をタップすると切り替わります。アプリは現在のセッションを終了し、選択したGatewayへ再接続します。複数のGatewayとペアリングしている場合は、接続行の横にクイック切り替えメニューが表示されます。
- 認証情報、TLSの信頼判断、Gatewayごとの設定、およびキャッシュされたチャット履歴はGatewayごとに保存されます。切り替えによってGateway間の状態が混在することはなく、プッシュ登録はアクティブなGatewayに追従します。
- ペアリング済みGatewayをスワイプするか、そのコンテキストメニューを使用して**Forget**すると、その認証情報、デバイストークン、TLSピン、およびキャッシュされたチャットが削除されます。
- 検出されたGatewayへ切り替えるには、そのGatewayがネットワーク上で可視である必要があります。手動設定したGatewayには、保存されたホストとポートを使用して再接続します。

## Canvas + A2UI

iOS NodeはWKWebViewのCanvasをレンダリングします。操作には`node.invoke`を使用します。

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意:

- GatewayのCanvasホストは、GatewayのHTTPサーバー（`gateway.port`と同じポート、デフォルトは`18789`）から`/__openclaw__/canvas/`と`/__openclaw__/a2ui/`を配信します。
- iOS Nodeは、内蔵スキャフォールドを接続時のデフォルトビューとして維持します。`canvas.a2ui.push`と`canvas.a2ui.reset`は、アプリにバンドルされ、アプリが所有するA2UIページを使用します。
- リモートGatewayのA2UIページは、iOS上ではレンダリング専用です。ネイティブA2UIボタンのアクションは、アプリにバンドルされ、アプリが所有するページからのみ受け付けられます。
- `canvas.navigate`と`{"url":""}`を使用すると、内蔵スキャフォールドに戻れます。

## Computer Useとの関係

iOSアプリはモバイルNodeのサーフェスであり、Codex Computer Useのバックエンドではありません。Codex Computer Useと`cua-driver mcp`はMCPツールを介してローカルのmacOSデスクトップを操作します。一方、iOSアプリは、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*`などのOpenClaw Nodeコマンドを介してiPhoneの機能を公開します。

エージェントはNodeコマンドを呼び出すことで、OpenClawを介してiOSアプリを操作できます。ただし、それらの呼び出しはGatewayのNodeプロトコルを経由し、iOSのフォアグラウンド／バックグラウンド制限に従います。ローカルデスクトップの操作については[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を、iOS Nodeの機能についてはこのページを参照してください。

### Canvasの評価／スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声起動 + トークモード

- 音声起動とトークモードはSettingsで利用できます。
- `talk.realtime.transport`が`webrtc`の場合、OpenAIリアルタイムTalkはクライアント所有のWebRTCを使用します。明示的な`gateway-relay`設定は、引き続きGatewayが所有します。[トークモード](/ja-JP/nodes/talk)を参照してください。
- Talk対応のiOS Nodeは`talk`機能を通知し、`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once`を宣言できます。Gatewayは、信頼済みのTalk対応Nodeに対して、これらのプッシュトゥトークコマンドをデフォルトで許可します。
- iOSはバックグラウンドオーディオを一時停止する場合があります。アプリがアクティブでないときの音声機能は、ベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOSアプリをフォアグラウンドに移動してください（Canvas／カメラ／画面コマンドにはフォアグラウンドが必要です）。
- `A2UI_HOST_UNAVAILABLE`: バンドルされたA2UIページにアプリのWebViewからアクセスできませんでした。アプリをScreenタブでフォアグラウンドに維持し、再試行してください。
- ペアリングのプロンプトが表示されない: `openclaw devices list`を実行し、手動で承認してください。
- WatchにiPhoneの状態が表示されない: `watch.status`で、iPhoneが`watchPaired: true`
  と`watchAppInstalled: true`を報告していることを確認してください。ペアリングがfalseの場合は、AppleのWatchアプリで
  Watchをペアリングしてください。インストールがfalseの場合は、**My Watch -> Available Apps**から
  コンパニオンアプリをインストールしてください。いずれかを変更した後、WatchでOpenClawを一度
  開いてください。即時の到達可能性には引き続き両方のアプリが実行中である必要がありますが、
  キューに入った更新は後からバックグラウンドで届く場合があります。
- 再インストール後に再接続できない: Keychainのペアリングトークンが消去されています。Nodeを再度ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
