---
read_when:
    - Control UIのデバイスページでライブステータスをデバッグする
    - 重複または古いインスタンス行の調査
    - Gateway WebSocket 接続またはシステムイベントビーコンの変更
summary: OpenClawのプレゼンスエントリが生成、統合、表示される仕組み
title: プレゼンス
x-i18n:
    generated_at: "2026-07-12T14:25:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

OpenClawの「プレゼンス」は、以下を軽量かつベストエフォートで示すビューです。

- **Gateway**自体
- **Gatewayに接続されている、ユーザーに表示されるクライアント**（Macアプリ、WebChat、Nodeなど）

プレゼンスは、Control UIの**デバイス**ページとmacOSアプリの**インスタンス**タブに、リアルタイムの接続メタデータを表示します。

このページでは、Gatewayのクライアント一覧について説明します。最後に使用したMacを検出して、そこにNodeのアラートをルーティングする方法については、[アクティブなコンピューターのプレゼンス](/nodes/presence)を参照してください。

## プレゼンスのフィールド（表示される内容）

プレゼンスのエントリは、次のようなフィールドを持つ構造化オブジェクトです。

- `instanceId`（省略可能ですが、強く推奨）：安定したクライアントID（通常は`connect.client.instanceId`）
- `host`：人が読みやすいホスト名
- `ip`：ベストエフォートで取得したIPアドレス
- `version`：クライアントのバージョン文字列
- `deviceFamily` / `modelIdentifier`：ハードウェアに関するヒント
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：判明している場合、最後のユーザー入力からの経過秒数
- `reason`：クライアントが指定する自由形式の文字列。Gateway自体が出力するのは`self`、`connect`、`disconnect`のみ
- `deviceId`、`roles`、`scopes`：接続ハンドシェイクから得られるデバイスIDとロール／スコープのヒント
- `ts`：最終更新のタイムスタンプ（エポックからの経過ミリ秒）

## 生成元（プレゼンスの取得元）

プレゼンスのエントリは複数のソースによって生成され、**マージ**されます。

### 1) Gateway自身のエントリ

クライアントが接続する前でもUIにGatewayホストが表示されるように、Gatewayは起動時に必ず「self」エントリを初期登録します。

### 2) WebSocket接続

すべてのWSクライアントは`connect`リクエストから開始します。ハンドシェイクが成功すると、Gatewayはその接続のプレゼンスエントリをupsertします。

#### 一時的なコントロールプレーン接続が表示されない理由

CLIコマンド、バックエンドRPCクライアント、プローブは、多くの場合短時間だけ接続します。その変動をプレゼンスTTLの全期間にわたって保持しないように、`cli`、`backend`、`probe`モードのクライアントはプレゼンスエントリに**変換されません**。テストスイートでは実際のクライアントの代替として使用されるため、テストモードのクライアントは追跡され続けます。

### 3) `system-event`ビーコン

クライアントは`system-event`メソッドを介して、より詳細な定期ビーコンを送信できます。Macアプリはこれを使用して、ホスト名、IP、`lastInputSeconds`を報告します。

### 4) Node接続（ロール：node）

Nodeが`role: node`を指定してGateway WebSocket経由で接続すると、GatewayはそのNodeのプレゼンスエントリをupsertします（他のWSクライアントと同じフロー）。

## マージと重複排除のルール（`instanceId`が重要な理由）

プレゼンスのエントリは、単一のインメモリマップに保存されます。キーには、次のうち最初に利用できる値が順番に使用され、大文字と小文字は区別されません。ペアリング済みデバイスID、`connect.client.instanceId`、または最後の手段として接続ごとのIDです。

一時的なコントロールプレーンのクライアントは追跡対象から完全に除外されるため（前述）、その接続IDがキーになることはありません。それ以外のすべてのクライアントでは、接続IDへのフォールバックにより、安定した`instanceId`なしで再接続したクライアントは**重複した**行として表示されます。

## TTLとサイズ上限

プレゼンスは意図的に一時的なものです。

- **TTL：** 5分より古いエントリは削除されます
- **最大エントリ数：** 200（古いものから順に削除）

これにより、一覧を最新の状態に保ち、メモリ使用量が無制限に増加することを防ぎます。

## リモート／トンネルに関する注意事項（ループバックIP）

クライアントがSSHトンネル／ローカルポートフォワーディング経由で接続すると、Gatewayにはリモートアドレスが`127.0.0.1`として見える場合があります。そのトンネルアドレスをクライアントのIPとして記録しないように、ローカル（ループバック）として検出されたクライアントについては、接続処理でループバックアドレスをエントリに書き込むのではなく、`ip`を完全に省略します。

## 利用側

### Control UIのデバイスページ

**デバイス**ページでは、`system-presence`を永続的なペアリングおよびNodeのレコードと結合します。Gateway自身のビーコンを先頭に固定し、一致するデバイスIDまたはインスタンスIDを使用して、リアルタイムのプラットフォーム、バージョン、モデル、入力からの経過時間に関するメタデータを表示します。

### macOSのインスタンスタブ

macOSアプリは`system-presence`の出力を表示し、最終更新からの経過時間に基づいて小さなステータスインジケーター（アクティブ／アイドル／古い）を適用します。

## デバッグのヒント

- 生の一覧を確認するには、Gatewayに対して`system-presence`を呼び出します。
- 重複が表示される場合：
  - クライアントがハンドシェイクで安定した`client.instanceId`を送信していることを確認します
  - 定期ビーコンが同じ`instanceId`を使用していることを確認します
  - 接続から生成されたエントリに`instanceId`がないかどうかを確認します（その場合、重複は想定どおりです）

## 関連項目

<CardGroup cols={2}>
  <Card title="アクティブなコンピューターのプレゼンス" href="/nodes/presence" icon="computer-mouse">
    物理的なMacへの入力によってアクティブなNodeが選択され、接続アラートがルーティングされる仕組み。
  </Card>
  <Card title="入力中インジケーター" href="/ja-JP/concepts/typing-indicators" icon="ellipsis">
    入力中インジケーターが送信されるタイミングと、その調整方法。
  </Card>
  <Card title="ストリーミングとチャンク分割" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング、チャンク分割、チャンネルごとのフォーマット。
  </Card>
  <Card title="Gatewayアーキテクチャ" href="/ja-JP/concepts/architecture" icon="diagram-project">
    Gatewayのコンポーネントと、プレゼンス更新を駆動するWebSocketプロトコル。
  </Card>
  <Card title="Gatewayプロトコル" href="/ja-JP/gateway/protocol" icon="plug">
    `connect`、`system-event`、`system-presence`のワイヤープロトコル。
  </Card>
</CardGroup>
