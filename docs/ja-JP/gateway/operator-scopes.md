---
read_when:
    - 不足している operator スコープエラーのデバッグ
    - デバイスまたはノードのペアリング承認をレビューする
    - Gateway RPC メソッドの追加または分類
summary: Gateway クライアントのオペレーター役割、スコープ、承認時チェック
title: オペレーターのスコープ
x-i18n:
    generated_at: "2026-07-05T11:26:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfbaf4dc1d8e8cc07bfb10c4e9abf53df34868185f51546f74c12bd785fa380
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator スコープは、Gateway クライアントが認証後に実行できることを制限します。
これは、1つの信頼された Gateway オペレーター ドメイン内の制御プレーンのガードレールであり、
敵対的なマルチテナント分離ではありません。人、チーム、またはマシン間で強い分離が必要な場合は、
別々の OS ユーザーまたはホストで別々の Gateway を実行してください。

関連: [セキュリティ](/ja-JP/gateway/security), [Gateway プロトコル](/ja-JP/gateway/protocol),
[Gateway ペアリング](/ja-JP/gateway/pairing), [デバイス CLI](/ja-JP/cli/devices).

## ロール

すべての Gateway WebSocket クライアントは、1つのロールで接続します。

- `operator`: CLI、Control UI、自動化、および
  信頼されたヘルパープロセスなどの制御プレーンクライアント。
- `node`: `node.invoke` を通じて
  コマンドを公開する機能ホスト (macOS、iOS、Android、ヘッドレス)。

Operator RPC メソッドには `operator` ロールが必要です。node 発のメソッドには
`node` ロールが必要です。

## スコープ レベル

| スコープ                | 意味                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 読み取り専用のステータス、リスト、カタログ、ログ、セッション読み取り、およびその他の非変更呼び出し。                                                        |
| `operator.write`        | 変更を伴う operator アクション: メッセージ送信、ツール呼び出し、トーク/音声設定の更新、node コマンド リレー。`operator.read` も満たします。                  |
| `operator.admin`        | 管理アクセス。すべての `operator.*` スコープを満たします。config 変更、更新、ネイティブ フック、予約済み名前空間、および高リスク承認に必要です。             |
| `operator.pairing`      | デバイスと node のペアリング管理: 一覧表示、承認、拒否、削除、ローテーション、取り消し。                                                                      |
| `operator.approvals`    | Exec および plugin 承認 API。                                                                                                                                 |
| `operator.talk.secrets` | シークレットを含めた Talk 設定の読み取り。                                                                                                                    |

将来の未知の `operator.*` スコープは、呼び出し元がすでに `operator.admin` を
保持していない限り、完全一致が必要です。

## メソッド スコープは最初のゲートにすぎない

各 Gateway RPC には、リクエストがハンドラーに到達できるかどうかを決める
最小権限のメソッド スコープがあります。その後、一部のハンドラーは、承認または変更される
具体的な対象に基づいて、より厳密なチェックを適用します。

- `device.pair.approve` は `operator.pairing` で到達できますが、operator デバイスの承認で
  発行または維持できるのは、呼び出し元がすでに保持しているスコープだけです。
- `node.pair.approve` は `operator.pairing` で到達でき、その後、保留中の node が宣言したコマンド一覧から
  追加の承認スコープを導出します。
- `chat.send` は write スコープのメソッドですが、`/config set` および
  `/config unset` チャット コマンドには、呼び出し元の chat-send スコープに関係なく、
  さらに `operator.admin` が必要です。

これにより、低スコープの operator は、すべてのペアリング承認を admin 限定にすることなく、
低リスクのペアリング アクションを実行できます。

## デバイス ペアリング承認

デバイス ペアリング レコードは、承認済みロールとスコープの永続的なソースです。
すでにペアリング済みのデバイスが、暗黙的により広いアクセスを得ることはありません。より広いロールまたは
より広いスコープを要求する再接続は、新しい保留中のアップグレード リクエストを作成します。

デバイス リクエストの承認:

- operator ロールを含まないリクエストには、operator スコープ承認は不要です。
- 非 operator デバイス ロール (たとえば `node`) のリクエストには、
  `device.pair.approve` 自体は `operator.pairing` だけを必要とする場合でも、
  `operator.admin` が必要です。
- `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing`、または `operator.talk.secrets` のリクエストには、呼び出し元がすでに
  そのスコープ、または `operator.admin` を保持している必要があります。
- `operator.admin` のリクエストには `operator.admin` が必要です。
- 明示的なスコープを含まない修復リクエストは、既存の operator
  トークンのスコープを継承できます。そのトークンが admin スコープの場合でも、承認には
  `operator.admin` が必要です。

非 admin の共有シークレット セッションと信頼済みプロキシ セッションは、自身が宣言した
operator スコープ内でのみ operator-device リクエストを承認できます。これらのセッションが
それ以外では `operator.pairing` を使用できる場合でも、非 operator ロールの承認は admin 限定です。

ペアリング済みデバイス トークン セッションでは、呼び出し元が `operator.admin` を持たない限り、
管理は自己スコープです。非 admin の呼び出し元は自身のペアリング エントリだけを確認でき、
自身のデバイス エントリだけを承認、拒否、ローテーション、取り消し、または削除できます。

## Node ペアリング承認

従来の `node.pair.*` メソッドは、Gateway 所有の別個の node ペアリング ストアを使用します。
WS node は代わりにデバイス ペアリング (`role: node`) を使用しますが、同じ承認
語彙が適用されます。2つのストアの関係については、[Gateway ペアリング](/ja-JP/gateway/pairing) を参照してください。

`node.pair.approve` は、保留中のリクエストのコマンド一覧から追加の必須スコープを導出します。

| 宣言されたコマンド                                      | 必須スコープ                          |
| ----------------------------------------------------- | ------------------------------------- |
| なし                                                  | `operator.pairing`                    |
| 非 exec node コマンド                                 | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, または `system.which` | `operator.pairing` + `operator.admin` |

Node ペアリングはアイデンティティと信頼を確立します。node 自身の
`system.run` exec 承認ポリシーを置き換えるものではありません。

## 共有シークレット認証

共有 gateway トークン/パスワード認証は、その Gateway に対する信頼された operator アクセスとして扱われます。
OpenAI 互換 HTTP サーフェス、`/tools/invoke`、および HTTP
セッション履歴エンドポイントは、呼び出し元がより狭い宣言済みスコープを送信した場合でも、
共有シークレット bearer 認証に対して完全なデフォルト operator スコープ セットを復元します。

信頼済みプロキシ認証や private-ingress `none` などの identity-bearing モードは、
明示的な宣言済みスコープを引き続き尊重できます。実際の信頼境界の分離には、別々の Gateway を使用してください。
