---
read_when:
    - OpenClaw と通信する外部アプリ、スクリプト、ダッシュボード、CI ジョブ、または IDE 拡張機能を構築しています
    - Gateway RPC と Plugin SDK のどちらを使用するか選択しています
    - Gateway のエージェント実行、セッション、イベント、承認、モデル、またはツールと統合している場合
    - ホスティングコントローラーを外部ウェイクスケジューラーと連携させています
sidebarTitle: External apps
summary: 外部アプリ、スクリプト、ダッシュボード、CIジョブ、IDE拡張機能向けの現在の統合パス
title: 外部アプリ向けのGateway統合
x-i18n:
    generated_at: "2026-07-11T22:11:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

外部アプリは Gateway プロトコル（WebSocket トランスポートと RPC メソッド）を介して OpenClaw と通信します。スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能、または別のプロセスから、エージェント実行の開始、イベントのストリーミング、結果の待機、処理のキャンセル、Gateway リソースの調査を行う場合に使用します。

<Warning>
  公開 npm クライアントパッケージはまだありません。リリースノートでパッケージの公開が発表され、このページにインストール手順が掲載されるまで、OpenClaw クライアントのパッケージ名をアプリケーションの依存関係に追加しないでください。
</Warning>

<Note>
  このページは、OpenClaw プロセスの外部にあるコードを対象としています。OpenClaw 内で実行される Plugin コードでは、代わりに文書化されている `openclaw/plugin-sdk/*` サブパスを使用してください。
</Note>

## 現在利用できるもの

| サーフェス                              | 状態     | 用途                                                                                                   |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| [Gateway プロトコル](/ja-JP/gateway/protocol) | 利用可能 | WebSocket トランスポート、接続ハンドシェイク、認証スコープ、プロトコルのバージョニング、イベント。    |
| [Gateway RPC リファレンス](/ja-JP/reference/rpc) | 利用可能 | エージェント、セッション、タスク、モデル、ツール、成果物、承認に関する現在の Gateway メソッド。       |
| [`openclaw agent`](/ja-JP/cli/agent)          | 利用可能 | CLI をシェルから呼び出すだけで十分な場合の、単発のスクリプト統合。                                    |
| [`openclaw message`](/ja-JP/cli/message)      | 利用可能 | スクリプトからのメッセージまたはチャンネルアクションの送信。                                         |

将来のクライアントライブラリパッケージは内部で開発中ですが、まだ公開インストールサーフェスではありません。公開されたバージョン付きパッケージがリリースで発表されるまでは、プレビュー段階の実装詳細として扱ってください。

## 推奨手順

1. Gateway を実行または検出します。
2. [Gateway プロトコル](/ja-JP/gateway/protocol)を介して接続します。
3. [Gateway RPC リファレンス](/ja-JP/reference/rpc)に記載された RPC メソッドを呼び出します。
4. テスト対象の OpenClaw バージョンを固定します。
5. OpenClaw のアップグレード時に RPC リファレンスを再確認します。

エージェント実行では、`agent` RPC から開始し、最終結果を得るために `agent.wait` と組み合わせます。永続的な会話状態には `sessions.*` メソッドを使用します。UI 統合では Gateway イベントを購読し、アプリが理解できるイベントファミリーだけをレンダリングします。

## ホストの協調的なサスペンド

実行中のプロセスを凍結またはスナップショットするホスティングコントローラーでは、ホストに依存しない次のサスペンドハンドシェイクを使用できます。

1. ホストが制御する外部からの受信を停止します。
2. 安定した一意の `requestId` を指定して `gateway.suspend.prepare` を呼び出します。
3. 応答が `busy` の場合は、プロセスを実行したままにして後で再試行します。
4. `ready` の場合は、返された `suspensionId` を保存し、`expiresAtMs` より前にプロセスを凍結またはスナップショットします。
5. 凍結解除後、またはサスペンドを中止した場合は、既存の WebSocket または Admin HTTP 制御パスを介して、その `suspensionId` を指定して `gateway.suspend.resume` を呼び出します。

準備済みの Gateway は新しい WebSocket ハンドシェイクを拒否します。WebSocket コントローラーは、ホスト操作中も認証済み接続を開いたままにする必要があります。それを保証できない場合は、準備前に [Admin HTTP RPC Plugin](/ja-JP/plugins/admin-http-rpc)を有効化して使用してください。制御パスが失われた場合は、再接続する前に 2 分間のリースが期限切れになるまで待ってください。期限切れになると受け入れが自動的に再開されます。

RPC コントラクトは次のとおりです。

- `gateway.suspend.prepare` — `operator.admin`、パラメーター
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`、パラメーター
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`、パラメーター
  `{ "suspensionId": "id-from-prepare" }`

ID は前後の空白が除去され、空白以外の文字を含む必要があり、128 文字に制限されます。ビジー状態の準備結果には `status: "busy"`、`reason`、`retryAfterMs`、`activeCount`、`blockers` が含まれます。準備完了の結果は次の形式です。

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

ステータスは `{"status":"running"}`、または `expiresAtMs` を含む準備完了結果を返します。再開は `{"ok":true,"status":"running","resumed":true}` を返します。正常に再開した後に繰り返すと、`resumed: false` が返されます。

競合するリクエスト ID、または一時的なスケジューラー再開失敗では、`retryAfterMs` を含む再試行可能な `UNAVAILABLE` が返されます。スケジューラーの復旧中は、準備、ステータス、再開のすべてでこのエラーが返され、Gateway は準備未完了かつフェイルクローズの状態を維持するため、ホストは凍結またはスナップショットしてはいけません。OpenClaw はスケジューラーを自動的に再試行し、復旧に成功した後にのみ受け入れを再開します。一致しない再開 ID では `INVALID_REQUEST` が返されます。準備処理は、1 分あたり 3 回までという Gateway のコントロールプレーン書き込みバジェットを共有します。返された再試行遅延に従ってください。WebSocket クライアントはデバイスと IP ごとにバケット分けされます。Admin HTTP コントローラーは解決済みのクライアント IP ごとにバケット分けされるため、1 つのプロキシの背後にあるコントローラーはバジェットを共有する場合があります。

準備処理は拒否専用です。OpenClaw は新しいルート、セッション、コマンドの受け入れを閉じ、自動 Cron ティックを一時停止し、処理を同期的に調査します。何かがアクティブな場合は、`busy` を返す前にスケジューラーを再開して受け入れを再開します。その処理を中断したり、完了まで待ったりすることはありません。準備完了リースは 2 分間継続します。同じ `requestId` で `prepare` を繰り返すとリースが更新されます。期限切れ時には、受け入れを再開する前にスケジューラーが再開されます。
準備完了リース中に期限を迎えた再起動通知は、リースが再開されるまで待機します。実行中の再起動がある場合、準備処理は `busy` を返します。

準備完了中も `/healthz` は稼働を維持し、`/readyz` は `503` を返します。ローカルまたは認証済みの準備状態応答には `gateway-draining` が含まれます。認証されていないリモートプローブには `{ "ready": false }` だけが返されます。HTTP ヘルスプローブ、既存の WebSocket 接続上のサスペンドメソッド、すでに有効化されている Admin HTTP RPC ルートは引き続き利用できます。その他の RPC は再試行可能な `UNAVAILABLE` を返します。OpenAI 互換 API、ツールおよびセッション操作、Node ウォッチ、構成済みフックを含む、組み込みの HTTP ユーザー処理ルートと通常の Plugin HTTP ルートは、`error.code: "gateway_unavailable"` とともに `503` を返します。Plugin が所有する新しい WebSocket アップグレードも `503` を返します。これはアップグレードの所有権を対象とし、確立済みの Plugin ソケット上で後から実行される処理は対象外です。

このハンドシェイクは受信メッセージを永続化せず、サードパーティーのチャンネルトランスポートを停止せず、ホスティングプラットフォームを制御しません。ホストは準備前に受信を遮断する必要があり、ウェイク、スナップショットまたは凍結、停止について引き続き責任を負います。`activeCount` は追跡対象処理の総数であり、`blockers` にはゼロ以外のカテゴリ別件数と、上限付きのタスク詳細が含まれます。これは汎用的なプロセス静止バリアではありません。`background-exec` ブロッカーは集計値のみです。コマンドテキスト、プロセス ID、出力、セッション識別子またはスコープ識別子がプロトコルを通過することはありません。チャンネルの健全性確認、メンテナンス、キャッシュ更新、確立済みの Plugin WebSocket セッション、未登録の Plugin 所有バックグラウンド処理は、アクティブなままになる場合があります。
ホスティングプラットフォームは、プロセスツリー全体とそのファイルシステムを一貫して凍結またはスナップショットする必要があります。この最初のコントラクトでは、未登録の処理がアイドル状態であることを証明できません。

<Tip>
  ホストのウェイクスケジューリングでは、OpenClaw 側の部分をプロセス内 Plugin に保持し、冪等な完全スナップショットを外部ホストアダプターへ投影してください。ホスティングコントローラーで Plugin SDK をインポートしたり、イベント差分から Cron 状態を再構築したりしないでください。[安全な外部 Cron 投影](/ja-JP/plugins/hooks#safe-external-cron-projection)を参照してください。
</Tip>

## アプリコードと Plugin コード

コードが OpenClaw の外部にある場合は Gateway RPC を使用します。

- エージェント実行を開始または監視する Node スクリプト
- Gateway を呼び出す CI ジョブ
- ダッシュボードと管理パネル
- IDE 拡張機能
- チャンネル Plugin になる必要がない外部ブリッジ
- 偽または実際の Gateway トランスポートを使用する統合テスト

コードが OpenClaw 内で実行される場合は Plugin SDK を使用します。

- プロバイダー Plugin
- チャンネル Plugin
- ツールまたはライフサイクルフック
- エージェントハーネス Plugin
- 信頼済みのランタイムヘルパー

外部アプリでは `openclaw/plugin-sdk/*` をインポートしないでください。これらのサブパスは OpenClaw が読み込む Plugin 用です。

## 関連項目

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [CLI エージェントコマンド](/ja-JP/cli/agent)
- [CLI メッセージコマンド](/ja-JP/cli/message)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [セッション](/ja-JP/concepts/session)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
