---
read_when:
    - iOS Node のペアリングまたは再接続
    - ソースから iOS アプリを実行する
    - Gateway 検出またはキャンバスコマンドのデバッグ
summary: 'iOS ノードアプリ: Gateway への接続、ペアリング、キャンバス、トラブルシューティング'
title: iOS アプリ
x-i18n:
    generated_at: "2026-04-30T05:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

提供状況: 内部プレビューです。iOS アプリはまだ一般配布されていません。

## 機能

- WebSocket 経由で Gateway に接続します (LAN または tailnet)。
- ノード機能を公開します: Canvas、画面スナップショット、カメラキャプチャ、位置情報、トークモード、音声ウェイク。
- `node.invoke` コマンドを受信し、ノードステータスイベントを報告します。

## 要件

- 別のデバイス (macOS、Linux、または WSL2 経由の Windows) で Gateway が実行中であること。
- ネットワークパス:
  - Bonjour 経由の同一 LAN、**または**
  - ユニキャスト DNS-SD 経由の tailnet (例のドメイン: `openclaw.internal.`)、**または**
  - 手動ホスト/ポート (フォールバック)。

## クイックスタート (ペアリング + 接続)

1. Gateway を起動します:

```bash
openclaw gateway --port 18789
```

2. iOS アプリで Settings を開き、検出された gateway を選択します (または Manual Host を有効にしてホスト/ポートを入力します)。

3. gateway ホストでペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前にもう一度 `openclaw devices list` を実行してください。

任意: iOS ノードが常に厳密に制御されたサブネットから接続する場合は、明示的な CIDR または正確な IP を使って
初回ノード自動承認を有効化できます:

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

これはデフォルトで無効です。要求スコープのない新規の `role: node` ペアリングにのみ適用されます。
オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのリレー対応プッシュ

公式配布される iOS ビルドは、未加工の APNs トークンを gateway に公開する代わりに、外部プッシュリレーを使用します。

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

- iOS アプリは App Attest と StoreKit アプリトランザクション JWS を使用してリレーに登録します。
- リレーは不透明なリレーハンドルと、登録スコープの送信許可を返します。
- iOS アプリはペアリング済み gateway のアイデンティティを取得してリレー登録に含めるため、リレー対応登録はその特定の gateway に委任されます。
- アプリはそのリレー対応登録を `push.apns.register` でペアリング済み gateway に転送します。
- gateway は保存されたリレーハンドルを `push.test`、バックグラウンドウェイク、ウェイク促進に使用します。
- gateway のリレーベース URL は、公式/TestFlight iOS ビルドに組み込まれたリレー URL と一致している必要があります。
- 後でアプリが別の gateway、または異なるリレーベース URL のビルドに接続した場合、古いバインディングを再利用せずにリレー登録を更新します。

このパスで gateway が必要と**しない**もの:

- デプロイ全体のリレートークンは不要です。
- 公式/TestFlight のリレー対応送信に直接 APNs キーは不要です。

想定されるオペレーターフロー:

1. 公式/TestFlight iOS ビルドをインストールします。
2. gateway で `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリを gateway にペアリングし、接続完了を待ちます。
4. アプリは APNs トークンを取得し、オペレーターセッションが接続され、リレー登録が成功した後、自動的に `push.apns.register` を公開します。
5. その後、`push.test`、再接続ウェイク、ウェイク促進は保存されたリレー対応登録を使用できます。

## バックグラウンド生存ビーコン

iOS がサイレントプッシュ、バックグラウンド更新、または重要な位置情報イベントでアプリを起動した場合、アプリは短時間のノード再接続を試みた後、`event: "node.presence.alive"` で `node.event` を呼び出します。
gateway は、認証済みノードデバイスのアイデンティティが判明した後にのみ、これをペアリング済みノード/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、gateway レスポンスに `handled: true` が含まれる場合にのみ、バックグラウンドウェイクが正常に記録されたものとして扱います。古い gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。このレスポンスは互換性がありますが、永続的な最終確認時刻の更新としてはカウントされません。

互換性メモ:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、gateway の一時的な env 上書きとして引き続き機能します。

## 認証と信頼フロー

リレーは、公式 iOS ビルドに対して gateway 上の直接 APNs では提供できない 2 つの制約を強制するために存在します:

- Apple 経由で配布された正規の OpenClaw iOS ビルドだけがホスト型リレーを使用できます。
- gateway は、その特定の gateway とペアリングした iOS デバイスに対してのみ、リレー対応プッシュを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`
   - アプリはまず通常の Gateway 認証フローを通じて gateway とペアリングします。
   - これにより、アプリは認証済みノードセッションと認証済みオペレーターセッションを取得します。
   - オペレーターセッションは `gateway.identity.get` の呼び出しに使用されます。

2. `iOS app -> relay`
   - アプリは HTTPS 経由でリレー登録エンドポイントを呼び出します。
   - 登録には App Attest 証明と StoreKit アプリトランザクション JWS が含まれます。
   - リレーはバンドル ID、App Attest 証明、Apple 配布証明を検証し、公式/本番配布パスを要求します。
   - これにより、ローカルの Xcode/dev ビルドがホスト型リレーを使用できなくなります。ローカルビルドは署名されている場合がありますが、リレーが期待する公式 Apple 配布証明を満たしません。

3. `gateway identity delegation`
   - リレー登録の前に、アプリは `gateway.identity.get` からペアリング済み gateway のアイデンティティを取得します。
   - アプリはその gateway アイデンティティをリレー登録ペイロードに含めます。
   - リレーは、その gateway アイデンティティに委任されたリレーハンドルと登録スコープの送信許可を返します。

4. `gateway -> relay`
   - gateway は `push.apns.register` からのリレーハンドルと送信許可を保存します。
   - `push.test`、再接続ウェイク、ウェイク促進の際、gateway は自身のデバイスアイデンティティで送信リクエストに署名します。
   - リレーは、保存された送信許可と gateway 署名の両方を、登録時に委任された gateway アイデンティティに照らして検証します。
   - 別の gateway は、たとえ何らかの方法でハンドルを取得しても、その保存済み登録を再利用できません。

5. `relay -> APNs`
   - リレーは本番 APNs 認証情報と、公式ビルドの未加工 APNs トークンを所有します。
   - gateway は、リレー対応の公式ビルドについて未加工の APNs トークンを保存しません。
   - リレーは、ペアリング済み gateway の代わりに最終的なプッシュを APNs に送信します。

この設計が作成された理由:

- 本番 APNs 認証情報をユーザーの gateway から分離するため。
- 公式ビルドの未加工 APNs トークンを gateway に保存しないようにするため。
- 公式/TestFlight OpenClaw ビルドだけにホスト型リレーの使用を許可するため。
- ある gateway が別の gateway に属する iOS デバイスへウェイクプッシュを送信することを防ぐため。

ローカル/手動ビルドは直接 APNs のままです。リレーなしでそれらのビルドをテストする場合、gateway には引き続き直接 APNs 認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

これらは gateway ホストのランタイム env vars であり、Fastlane 設定ではありません。`apps/ios/fastlane/.env` は `ASC_KEY_ID` や `ASC_ISSUER_ID` などの App Store Connect / TestFlight 認証のみを保存します。ローカル iOS ビルド向けの直接 APNs 配信は設定しません。

推奨される gateway ホスト上の保存場所:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` ファイルをコミットしたり、リポジトリのチェックアウト配下に置いたりしないでください。

## 検出パス

### Bonjour (LAN)

iOS アプリは `local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じワイドエリア DNS-SD 検出ドメインを参照します。同一 LAN の gateway は `local.` から自動的に表示されます。クロスネットワーク検出では、ビーコンタイプを変更せずに設定済みワイドエリアドメインを使用できます。

### Tailnet (クロスネットワーク)

mDNS がブロックされている場合は、ユニキャスト DNS-SD ゾーン (ドメインを選択。例:
`openclaw.internal.`) と Tailscale split DNS を使用します。
CoreDNS の例については [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

### 手動ホスト/ポート

Settings で **Manual Host** を有効にし、gateway ホスト + ポート (デフォルト `18789`) を入力します。

## Canvas + A2UI

iOS ノードは WKWebView canvas をレンダリングします。`node.invoke` を使用して操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

メモ:

- Gateway canvas ホストは `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- Gateway HTTP サーバーから提供されます (`gateway.port` と同じポート、デフォルト `18789`)。
- canvas ホスト URL が広告されている場合、iOS ノードは接続時に自動的に A2UI へ移動します。
- `canvas.navigate` と `{"url":""}` で組み込みのスキャフォールドに戻ります。

## Computer Use との関係

iOS アプリはモバイルノードサーフェスであり、Codex Computer Use バックエンドではありません。Codex Computer Use と `cua-driver mcp` は、MCP ツールを通じてローカル macOS デスクトップを制御します。iOS アプリは、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などの OpenClaw ノードコマンドを通じて iPhone 機能を公開します。

エージェントはノードコマンドを呼び出すことで OpenClaw 経由で iOS アプリを操作できますが、それらの呼び出しは gateway ノードプロトコルを経由し、iOS のフォアグラウンド/バックグラウンド制限に従います。ローカルデスクトップ制御には [Codex Computer Use](/ja-JP/plugins/codex-computer-use) を使用し、iOS ノード機能についてはこのページを使用してください。

### Canvas eval / スナップショット

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 音声ウェイク + トークモード

- 音声ウェイクとトークモードは Settings で利用できます。
- iOS はバックグラウンドオーディオを一時停止する場合があります。アプリがアクティブでないときは、音声機能をベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOS アプリをフォアグラウンドにしてください (canvas/camera/screen コマンドにはこれが必要です)。
- `A2UI_HOST_NOT_CONFIGURED`: Gateway が canvas ホスト URL を広告していません。 [Gateway configuration](/ja-JP/gateway/configuration) の `canvasHost` を確認してください。
- ペアリングプロンプトが表示されない: `openclaw devices list` を実行し、手動で承認してください。
- 再インストール後に再接続が失敗する: Keychain のペアリングトークンがクリアされました。ノードを再ペアリングしてください。

## 関連ドキュメント

- [Pairing](/ja-JP/channels/pairing)
- [Discovery](/ja-JP/gateway/discovery)
- [Bonjour](/ja-JP/gateway/bonjour)
