---
read_when:
    - Control UI のデバイスページでライブステータスをデバッグする
    - 重複または古いインスタンス行の調査
    - Gateway WebSocket 接続またはシステムイベントビーコンの変更
summary: OpenClaw のプレゼンスエントリが生成、統合、表示される仕組み
title: プレゼンス
x-i18n:
    generated_at: "2026-07-14T13:39:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClawの「プレゼンス」は、以下を軽量かつベストエフォートで把握するためのビューです。

- **Gateway**自体、および
- **Gatewayに接続されているユーザー向けクライアント**（Macアプリ、WebChat、Nodeなど）

プレゼンスでは、Control UIの**Devices**ページ
（**Settings → Devices**内）と、macOSアプリの**Instances**タブにライブ接続メタデータが表示されます。

このページでは、Gatewayのクライアント一覧について説明します。最後に使用したMacを検出し、
NodeのアラートをそのMacにルーティングする方法については、
[アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)を参照してください。

## プレゼンスフィールド（表示される内容）

プレゼンスエントリは、次のようなフィールドを持つ構造化オブジェクトです。

- `instanceId`（任意ですが強く推奨）：安定したクライアントID（通常は`connect.client.instanceId`）
- `host`：人が識別しやすいホスト名
- `ip`：ベストエフォートで取得したIPアドレス
- `version`：クライアントのバージョン文字列
- `deviceFamily` / `modelIdentifier`：ハードウェア情報のヒント
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：判明している場合、最後のユーザー入力からの経過秒数
- `reason`：クライアントが指定する自由形式の文字列。Gateway自体が出力するのは`self`、`connect`、`disconnect`のみ
- `deviceId`、`roles`、`scopes`：接続ハンドシェイクから得られるデバイスIDとロール／スコープのヒント
- `ts`：最終更新時刻（エポックからのミリ秒）

## 生成元（プレゼンスの取得元）

プレゼンスエントリは複数のソースによって生成され、**マージ**されます。

### 1) Gatewayの自己エントリ

Gatewayは、クライアントが接続する前でもUIにGatewayホストが表示されるよう、
起動時に必ず「自己」エントリを登録します。

### 2) WebSocket接続

すべてのWSクライアントは、`connect`リクエストから開始します。ハンドシェイクが成功すると、
Gatewayはその接続のプレゼンスエントリをupsertします。

#### 一時的なコントロールプレーン接続が表示されない理由

CLIコマンド、バックエンドRPCクライアント、プローブは、多くの場合短時間だけ接続します。
その頻繁な変動をプレゼンスTTLの期間全体にわたって保持しないよう、
`cli`、`backend`、`probe`モードのクライアントは
プレゼンスエントリに**変換されません**。テストモードのクライアントは、
テストスイートで実際のクライアントの代わりとして使用されるため、追跡されます。

### 3) `system-event`ビーコン

クライアントは、`system-event`メソッドを介して、より詳細な定期ビーコンを送信できます。Mac
アプリはこれを使用して、ホスト名、IP、`lastInputSeconds`を報告します。

### 4) Node接続（ロール：Node）

Nodeが`role: node`を使用してGateway WebSocket経由で接続すると、Gatewayは
そのNodeのプレゼンスエントリをupsertします（他のWSクライアントと同じフロー）。

## マージと重複排除のルール（`instanceId`が重要な理由）

プレゼンスエントリは、単一のメモリ内マップに格納されます。キーには、大文字と小文字を区別せず、
次の順序で最初に利用可能なものが使用されます。ペアリング済みデバイスID、`connect.client.instanceId`、
最後の手段として接続ごとのID。

一時的なコントロールプレーンクライアントは追跡対象から完全に除外されるため（前述）、
その接続IDがキーになることはありません。それ以外のすべてのクライアントでは、
接続IDへのフォールバックにより、安定した`instanceId`を持たずに再接続したクライアントは
**重複した**行として表示されます。

## TTLと上限サイズ

プレゼンスは意図的に一時的なものです。

- **TTL：**5分より古いエントリは削除
- **最大エントリ数：**200（古いものから削除）

これにより、一覧を最新の状態に保ち、メモリ使用量の無制限な増加を防ぎます。

## リモート／トンネルに関する注意事項（ループバックIP）

クライアントがSSHトンネル／ローカルポートフォワーディング経由で接続すると、Gatewayには
リモートアドレスが`127.0.0.1`として見える場合があります。そのトンネルアドレスを
クライアントのIPとして記録しないよう、接続処理では、ローカル（ループバック）として検出された
クライアントについて、ループバックアドレスをエントリに書き込む代わりに
`ip`自体を省略します。

## 利用側

### Control UIのDevicesページ

**Devices**ページは、`system-presence`を永続的なペアリングレコードおよびNodeレコードと
結合します。Gatewayの自己ビーコンを先頭に固定し、一致するデバイスIDまたは
インスタンスIDを使用して、ライブのプラットフォーム、バージョン、モデル、入力からの経過時間の
メタデータを表示します。

### macOSのInstancesタブ

macOSアプリは`system-presence`の出力を表示し、最終更新からの経過時間に基づいて
小さなステータスインジケーター（Active/Idle/Stale）を適用します。

## デバッグのヒント

- 未加工の一覧を確認するには、Gatewayに対して`system-presence`を呼び出します。
- 重複が表示される場合：
  - クライアントがハンドシェイクで安定した`client.instanceId`を送信していることを確認します
  - 定期ビーコンが同じ`instanceId`を使用していることを確認します
  - 接続から生成されたエントリに`instanceId`がないか確認します（その場合、重複は想定どおりです）

## 関連項目

<CardGroup cols={2}>
  <Card title="アクティブなコンピューターのプレゼンス" href="/ja-JP/nodes/presence" icon="computer-mouse">
    Macの物理入力によってアクティブなNodeを選択し、接続アラートをルーティングする仕組み。
  </Card>
  <Card title="入力中インジケーター" href="/ja-JP/concepts/typing-indicators" icon="ellipsis">
    入力中インジケーターが送信されるタイミングと、その調整方法。
  </Card>
  <Card title="ストリーミングとチャンク分割" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング、チャンク分割、チャンネルごとの書式設定。
  </Card>
  <Card title="Gatewayアーキテクチャ" href="/ja-JP/concepts/architecture" icon="diagram-project">
    Gatewayのコンポーネントと、プレゼンス更新を駆動するWebSocketプロトコル。
  </Card>
  <Card title="Gatewayプロトコル" href="/ja-JP/gateway/protocol" icon="plug">
    `connect`、`system-event`、`system-presence`のワイヤープロトコル。
  </Card>
</CardGroup>
