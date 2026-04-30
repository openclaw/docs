---
read_when:
    - OpenClaw に自然なフォローアップを記憶させたい場合
    - 推論されたチェックインがリマインダーとどう異なるかを理解したい場合
    - フォローアップの約束事項を確認または却下したい
sidebarTitle: Commitments
summary: 正確なリマインダーではないチェックイン向けの推論されたフォローアップメモリ
title: 推定されたコミットメント
x-i18n:
    generated_at: "2026-04-30T05:07:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

コミットメントは短期間だけ残るフォローアップ記憶です。有効にすると、OpenClaw は
会話が将来の確認機会を生んだことに気づき、あとでそれを持ち出すように
覚えておけます。

例:

- 明日の面接について話す。OpenClaw はその後に確認することがあります。
- 疲れ切っていると言う。OpenClaw はあとで眠れたか尋ねることがあります。
- 何かが変わったあとでフォローアップするとエージェントが言う。OpenClaw はその
  未完了のループを追跡することがあります。

コミットメントは `MEMORY.md` のような永続的な事実ではなく、正確な
リマインダーでもありません。記憶と自動化の中間にあります。OpenClaw は
会話に紐づく義務を記憶し、期限が来たら heartbeat がそれを届けます。

## コミットメントを有効にする

コミットメントはデフォルトでオフです。config で有効にします:

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

`commitments.maxPerDay` は、推測されたフォローアップをローリング 1 日あたり
エージェントセッションごとにいくつ届けられるかを制限します。デフォルトは `3` です。

## 仕組み

エージェントの返信後、OpenClaw は別のコンテキストで隠れたバックグラウンド抽出パスを
実行することがあります。そのパスは、推測されたフォローアップコミットメントだけを探します。
表示される会話には書き込まず、抽出について推論するようメインエージェントに
求めることもありません。

高信頼度の候補が見つかると、OpenClaw は次の情報を含むコミットメントを保存します:

- エージェント id
- セッションキー
- 元のチャネルと配信先
- 期限ウィンドウ
- 短い推奨の確認
- heartbeat が送信するかどうかを判断するために十分なソースコンテキスト

配信は heartbeat を通じて行われます。コミットメントの期限が来ると、heartbeat は
同じエージェントとチャネルスコープの heartbeat ターンにそのコミットメントを追加します。
モデルは自然な確認を 1 つ送信するか、`HEARTBEAT_OK` と返信して却下できます。

OpenClaw は、推測されたコミットメントを書き込んだ直後に配信することはありません。
期限時刻は、コミットメント作成後の少なくとも 1 heartbeat 間隔後に制限されるため、
フォローアップが推測されたその瞬間にそのまま返ってくることはありません。

## スコープ

コミットメントは、作成された正確なエージェントとチャネルコンテキストにスコープされます。
Discord であるエージェントと会話中に推測されたフォローアップが、別のエージェント、
別のチャネル、または無関係なセッションによって配信されることはありません。

このスコープは機能の一部です。自然な確認は、グローバルなリマインダーシステムではなく、
同じ会話が続いているように感じられるべきです。

## コミットメントとリマインダー

| 必要なこと                                      | 使用するもの                                |
| ----------------------------------------------- | ------------------------------------------- |
| 「午後 3 時にリマインドして」                  | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「20 分後に通知して」                          | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「このレポートを平日毎日実行して」             | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「明日面接がある」                             | コミットメント                              |
| 「一晩中起きていた」                           | コミットメント                              |
| 「この未完了スレッドに回答しなかったらフォローアップして」 | コミットメント                    |

ユーザーからの明確なリクエストは、すでにスケジューラーパスの対象です。コミットメントは
推測されたフォローアップ専用です。つまり、ユーザーがリマインダーを依頼していなくても、
会話から将来の有用な確認が明確に生まれた場面のためのものです。

## コミットメントを管理する

保存されたコミットメントを確認してクリアするには CLI を使用します:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

コマンドリファレンスについては [`openclaw commitments`](/ja-JP/cli/commitments) を参照してください。

## プライバシーとコスト

コミットメント抽出は LLM パスを使用するため、有効にすると対象となるターンの後に
バックグラウンドのモデル使用量が追加されます。このパスはユーザーに表示される
会話からは隠されていますが、フォローアップが存在するかどうかを判断するために必要な
直近のやり取りを読み取ることがあります。

保存されたコミットメントはローカルの OpenClaw 状態です。これは運用上の記憶であり、
長期記憶ではありません。この機能を無効にするには、次を実行します:

```bash
openclaw config set commitments.enabled false
```

## トラブルシューティング

期待したフォローアップが表示されない場合:

- `commitments.enabled` が `true` であることを確認します。
- 保留中、却下済み、スヌーズ済み、または期限切れのレコードがないか
  `openclaw commitments --all` を確認します。
- エージェントの heartbeat が実行中であることを確認します。
- そのエージェントセッションで `commitments.maxPerDay` にすでに達していないか確認します。
- 明確なリマインダーはコミットメント抽出ではスキップされ、代わりに
  [スケジュール済みタスク](/ja-JP/automation/cron-jobs) に表示されるべきであることを覚えておいてください。

## 関連

- [記憶の概要](/ja-JP/concepts/memory)
- [Active memory](/ja-JP/concepts/active-memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [`openclaw commitments`](/ja-JP/cli/commitments)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#commitments)
