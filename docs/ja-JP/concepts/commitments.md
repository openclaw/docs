---
read_when:
    - OpenClaw に自然なフォローアップを記憶させたい
    - 推論されたチェックインがリマインダーとどう違うかを理解したい
    - 後続対応の約束を確認または却下したい
sidebarTitle: Commitments
summary: 推測されたフォローアップメモリ（正確なリマインダーではないチェックイン用）
title: 推定されるコミットメント
x-i18n:
    generated_at: "2026-07-05T11:13:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

コミットメントは短期間だけ保持されるフォローアップ用のメモリです。有効にすると、OpenClaw は
会話から将来のチェックイン機会が生まれたことに気づき、あとで
再び取り上げるように記憶できます。

例:

- 明日の面接について触れた場合。OpenClaw はその後にチェックインすることがあります。
- 疲れ切っていると言った場合。OpenClaw はあとで眠れたかどうかを尋ねることがあります。
- エージェントが何かが変わった後にフォローアップすると言った場合。OpenClaw はその未解決ループを追跡することがあります。

コミットメントは `MEMORY.md` のような永続的な事実ではなく、正確な
リマインダーでもありません。メモリと自動化の中間にあります。OpenClaw は
会話に紐づく義務を記憶し、その期限が来ると Heartbeat がそれを配信します。

## コミットメントを有効にする

コミットメントはデフォルトでオフです (`commitments.enabled: false`)。設定で有効にします:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

同等の `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` は、推定されたフォローアップをローリング日単位で
エージェントセッションごとに配信できる数を制限します。デフォルトは `3` です。

## 仕組み

エージェントの返信後、OpenClaw はツールを無効にした別コンテキストで、
隠れたバックグラウンド抽出パスを実行することがあります。そのパスは推定されたフォローアップコミットメントだけを探します。
可視の会話には書き込まず、メインエージェントに抽出について
推論させることもありません。

高信頼度の候補が見つかると、OpenClaw は次の情報を含むコミットメントを保存します:

- エージェント ID
- セッションキー
- 元のチャネルと配信先
- 期限ウィンドウ
- 短い推奨チェックイン
- 送信するかどうかを Heartbeat が判断するための、指示ではないメタデータ

配信は Heartbeat を通じて行われます。コミットメントの期限が来ると、Heartbeat は
同じエージェントおよびチャネルスコープの Heartbeat ターンにそのコミットメントを追加します。
プロンプトはコミットメントメタデータが信頼できないことを明示的に警告し、
その中の指示に従ったり、それを理由にツールを使ったりしないよう
モデルに指示します。モデルは自然なチェックインを 1 件送るか、`HEARTBEAT_OK` と返信して破棄できます。
Heartbeat が `target: "none"` で設定されている場合、期限が来たコミットメントは
内部に留まり、外部チェックインは送信しません。コミットメント配信用プロンプトは
元の会話テキストを再生せず、推奨チェックインと
メタデータのみを含みます。また、期限到来コミットメントの Heartbeat ターンは OpenClaw ツールなしで実行されます。

OpenClaw は、推定されたコミットメントを書き込んだ直後に配信することはありません。
期限は、コミットメント作成後少なくとも 1 Heartbeat 間隔以降に丸められるため、
推定されたのと同じ瞬間にフォローアップが返ってくることはありません。

## スコープ

コミットメントは、作成された正確なエージェントとチャネルのコンテキストにスコープされます。
Discord で 1 つのエージェントと話している間に推定されたフォローアップは、
別のエージェント、別のチャネル、または無関係なセッションからは配信されません。

このスコープは機能の一部です。自然なチェックインは、グローバルなリマインダーシステムのようではなく、
同じ会話が続いているように感じられるべきです。

## コミットメントとリマインダーの違い

| 必要なこと                                        | 使用するもの                              |
| ----------------------------------------------- | ---------------------------------------- |
| 「午後3時にリマインドして」                       | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「20分後に通知して」                              | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「このレポートを平日ごとに実行して」              | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「明日面接がある」                                | コミットメント                            |
| 「徹夜していた」                                  | コミットメント                            |
| 「この未解決スレッドに回答しなければフォローアップして」 | コミットメント                            |

正確なユーザー要求はすでにスケジューラー経路に属します。コミットメントは
推定されたフォローアップ専用です。つまり、ユーザーがリマインダーを求めてはいないが、
会話から将来の有用なチェックインが明確に生まれた場面です。

## コミットメントを管理する

保存されたコミットメントを確認してクリアするには CLI を使います:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完全なコマンドリファレンスについては [`openclaw commitments`](/ja-JP/cli/commitments) を参照してください。

## プライバシーとコスト

コミットメント抽出は LLM パスを使用するため、有効にすると対象ターンの後にバックグラウンドのモデル
使用量が追加されます。このパスはユーザーに見える
会話からは隠されていますが、フォローアップが存在するかどうかを判断するために必要な最近のやり取りを読むことがあります。

保存されたコミットメントは OpenClaw のローカル状態です。これは運用上のメモリであり、
長期メモリではありません。この機能を無効にするには:

```bash
openclaw config set commitments.enabled false
```

## トラブルシューティング

期待したフォローアップが表示されない場合:

- `commitments.enabled` が `true` であることを確認します。
- 保留中、破棄済み、スヌーズ済み、または期限切れの
  レコードがないか `openclaw commitments --all` を確認します。
- 対象エージェントで Heartbeat が実行されていることを確認します。
- そのエージェントセッションで `commitments.maxPerDay` にすでに達していないか確認します。
- 正確なリマインダーはコミットメント抽出ではスキップされ、代わりに
  [スケジュール済みタスク](/ja-JP/automation/cron-jobs) の下に表示されるべきことを覚えておいてください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [Active memory](/ja-JP/concepts/active-memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [`openclaw commitments`](/ja-JP/cli/commitments)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#commitments)
