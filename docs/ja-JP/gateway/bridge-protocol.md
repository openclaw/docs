---
read_when:
    - 古い node クライアントコードまたはアーカイブされたペアリングログの調査
    - 従来のノードサーフェスが以前公開していた内容を監査する
summary: '履歴ブリッジプロトコル（レガシーノード）: TCP JSONL、ペアリング、スコープ付き RPC'
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-07-05T11:23:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドにはブリッジリスナーは含まれておらず、`bridge.*` 設定キーはスキーマに存在しません。このページは履歴参照のみです。すべてのノード/オペレータークライアントには [Gateway プロトコル](/ja-JP/gateway/protocol)を使用してください。
</Warning>

## 存在していた理由

- **セキュリティ境界**: Gateway API サーフェス全体ではなく、小さな許可リストを公開していました。
- **ペアリング + ノード ID**: ノードの受け入れは Gateway が所有し、ノードごとのトークンに紐づいていました。
- **検出 UX**: ノードは LAN 上の Bonjour 経由で Gateway を検出するか、tailnet 経由で直接接続できました。
- **Loopback WS**: 完全な WS 制御プレーンは、SSH 経由でトンネルされない限りローカルに留まりました。

## トランスポート

- TCP、1 行につき 1 つの JSON オブジェクト (JSONL)。
- オプションの TLS (`bridge.tls.enabled: true`)。
- デフォルトのリスナーポートは `18790` でした。

TLS が有効な場合、検出 TXT レコードには非秘密のヒントとして `bridgeTls=1` と `bridgeTlsSha256` が含まれていました。Bonjour/mDNS TXT レコードは認証されません。クライアントは、他のアウトオブバンド検証なしに、通知されたフィンガープリントを権威あるピンとして扱うことはできませんでした。

## ハンドシェイクとペアリング

1. クライアントはノードメタデータとトークン (すでにペアリング済みの場合) を含む `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error` (`NOT_PAIRED` / `UNAUTHORIZED`) を返します。
3. クライアントは `pair-request` を送信します。
4. Gateway は承認を待ち、その後 `pair-ok` と `hello-ok` を送信します。

`hello-ok` は以前 `serverName` を返していました。ホストされた Plugin サーフェスは、現在の Gateway プロトコルの `pluginSurfaceUrls` を通じて通知されるようになりました (Canvas/A2UI は `pluginSurfaceUrls.canvas` を使用します)。

## フレーム

クライアントから Gateway へ:

- `req` / `res`: スコープ付き Gateway RPC (チャット、セッション、設定、ヘルス、voicewake、skills.bins)。
- `event`: ノードシグナル (音声トランスクリプト、エージェントリクエスト、チャット購読、exec ライフサイクル)。

Gateway からクライアントへ:

- `invoke` / `invoke-res`: ノードコマンド (`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`)。
- `event`: 購読中セッションのチャット更新。
- `ping` / `pong`: キープアライブ。

許可リストの強制は `src/gateway/server-bridge.ts` にありました (削除済み)。

## Exec ライフサイクルイベント

ノードは完了した `system.run` アクティビティを表面化するために `exec.finished` を送出し、Gateway によってシステムイベントへマッピングされていました (レガシーノードは `exec.started` も送出できました)。`exec.denied` は、拒否された `system.run` 試行を、システムイベントのキュー投入やエージェント作業の起動を行わない終端的な拒否としてマークしました。

ペイロードフィールド (注記がない限りすべて任意):

| フィールド                       | 注記                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sessionKey`                     | 必須。イベント相関、および `exec.finished` ではシステムイベント配信に使うエージェントセッション。 |
| `runId`                          | グルーピング用の一意な exec ID。                                                               |
| `command`                        | 生または整形済みのコマンド文字列。                                                             |
| `exitCode`, `timedOut`, `output` | 完了の詳細 (`finished` のみ)。                                                                 |
| `reason`                         | 拒否理由 (`denied` のみ)。                                                                     |

## 履歴上の tailnet 利用

- ブリッジを tailnet IP にバインド: `~/.openclaw/openclaw.json` の `bridge.bind: "tailnet"` (履歴上のみ。`bridge.*` は有効な設定ではなくなりました)。
- クライアントは MagicDNS 名または tailnet IP 経由で接続していました。
- Bonjour はネットワークをまたぎません。それ以外の場合は、広域 DNS-SD または手動のホスト/ポートが必要でした。

## バージョニング

ブリッジは暗黙的な v1 で、最小/最大のネゴシエーションはありませんでした。現在のノード/オペレータークライアントは WebSocket [Gateway プロトコル](/ja-JP/gateway/protocol)を使用し、これはプロトコルバージョン範囲をネゴシエートします。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [ノード](/ja-JP/nodes)
