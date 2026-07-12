---
read_when:
    - 古い Node クライアントコードまたはアーカイブ済みのペアリングログを調査する
    - 従来の Node サーフェスが以前公開していた内容の監査
summary: 従来のブリッジプロトコル（レガシー Node）：TCP JSONL、ペアリング、スコープ付き RPC
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-07-11T22:14:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドにはブリッジリスナーが含まれておらず、`bridge.*` 設定キーもスキーマから削除されています。このページは過去の参考資料としてのみ提供されています。すべての Node/オペレータークライアントには [Gateway プロトコル](/ja-JP/gateway/protocol)を使用してください。
</Warning>

## 存在していた理由

- **セキュリティ境界**: Gateway API の全領域ではなく、小規模な許可リストのみを公開していました。
- **ペアリング + Node ID**: Node の受け入れは Gateway が管理し、Node ごとのトークンに関連付けられていました。
- **検出 UX**: Node は LAN 上の Bonjour を介して Gateway を検出するか、tailnet 経由で直接接続できました。
- **ループバック WS**: 完全な WS コントロールプレーンは、SSH 経由でトンネリングしない限りローカルに留まりました。

## トランスポート

- TCP。1 行につき 1 つの JSON オブジェクト（JSONL）。
- オプションの TLS（`bridge.tls.enabled: true`）。
- デフォルトのリスナーポートは `18790` でした。

TLS が有効な場合、検出用 TXT レコードには、機密情報ではないヒントとして `bridgeTls=1` と `bridgeTlsSha256` が含まれていました。Bonjour/mDNS の TXT レコードは認証されません。クライアントは、別の帯域外検証を行わずに、通知されたフィンガープリントを信頼できるピンとして扱うことはできませんでした。

## ハンドシェイクとペアリング

1. クライアントが Node のメタデータとトークン（すでにペアリング済みの場合）を含む `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error`（`NOT_PAIRED` / `UNAUTHORIZED`）を返します。
3. クライアントが `pair-request` を送信します。
4. Gateway は承認を待ってから、`pair-ok` と `hello-ok` を送信します。

以前の `hello-ok` は `serverName` を返していました。現在、ホストされる Plugin サーフェスは、現行の Gateway プロトコルの `pluginSurfaceUrls` を通じて通知されます（Canvas/A2UI は `pluginSurfaceUrls.canvas` を使用します）。

## フレーム

クライアントから Gateway へ:

- `req` / `res`: スコープが限定された Gateway RPC（チャット、セッション、設定、ヘルス、音声ウェイク、skills.bins）。
- `event`: Node シグナル（音声文字起こし、エージェントリクエスト、チャット購読、実行ライフサイクル）。

Gateway からクライアントへ:

- `invoke` / `invoke-res`: Node コマンド（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）。
- `event`: 購読中のセッションに対するチャット更新。
- `ping` / `pong`: キープアライブ。

許可リストの適用は `src/gateway/server-bridge.ts` に実装されていました（削除済み）。

## 実行ライフサイクルイベント

Node は、完了した `system.run` アクティビティを通知するために `exec.finished` を発行し、Gateway がそれをシステムイベントに変換していました（旧式の Node は `exec.started` も発行できました）。`exec.denied` は、拒否された `system.run` の試行を、システムイベントをキューに追加したりエージェント処理を起動したりせず、終端の拒否として記録しました。

ペイロードフィールド（注記がない限り、すべてオプション）:

| フィールド                       | 注記                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sessionKey`                     | 必須。イベントの関連付け、および `exec.finished` の場合はシステムイベントの配信に使用するエージェントセッション。 |
| `runId`                          | グループ化に使用する一意の実行 ID。                                                                                |
| `command`                        | 未加工または整形済みのコマンド文字列。                                                                             |
| `exitCode`, `timedOut`, `output` | 完了の詳細（完了時のみ）。                                                                                         |
| `reason`                         | 拒否理由（拒否時のみ）。                                                                                           |

## 過去の tailnet 使用方法

- ブリッジを tailnet IP にバインドする: `~/.openclaw/openclaw.json` で `bridge.bind: "tailnet"` を指定（過去の使用方法のみ。`bridge.*` は有効な設定ではなくなりました）。
- クライアントは MagicDNS 名または tailnet IP を使用して接続していました。
- Bonjour はネットワークを越えて動作しないため、それ以外の場合は広域 DNS-SD またはホスト/ポートの手動指定が必要でした。

## バージョニング

ブリッジは暗黙的な v1 であり、最小/最大バージョンのネゴシエーションはありませんでした。現在の Node/オペレータークライアントは、プロトコルのバージョン範囲をネゴシエーションする WebSocket [Gateway プロトコル](/ja-JP/gateway/protocol)を使用します。

## 関連項目

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Node](/ja-JP/nodes)
