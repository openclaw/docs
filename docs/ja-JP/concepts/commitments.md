---
read_when:
    - OpenClaw に自然なフォローアップを記憶させたい場合
    - 推定チェックインとリマインダーの違いを理解したい場合
    - フォローアップのコミットメントを確認または却下する場合
sidebarTitle: Commitments
summary: 厳密なリマインダーではない確認のために推定されたフォローアップメモリ
title: 推論されたコミットメント
x-i18n:
    generated_at: "2026-07-11T22:09:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Commitment は、有効期間の短いフォローアップ用メモリです。有効にすると、OpenClaw は会話から将来の確認に適した機会が生じたことを検知し、後でその話題を取り上げるよう記憶できます。

例:

- 明日面接があると話した場合、OpenClaw は後でその結果を尋ねることがあります。
- 疲れ切っていると話した場合、OpenClaw は後で眠れたかを尋ねることがあります。
- 何かが変わった後にフォローアップするとエージェントが述べた場合、OpenClaw はその未完了事項を追跡することがあります。

Commitment は `MEMORY.md` のような永続的な事実ではなく、正確なリマインダーでもありません。メモリと自動化の中間に位置します。OpenClaw が会話に紐づく責務を記憶し、期限が来ると Heartbeat がそれを配信します。

## Commitment を有効にする

Commitment はデフォルトで無効です（`commitments.enabled: false`）。設定で有効にします。

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

`commitments.maxPerDay` は、ローリング方式の1日あたりに、エージェントセッションごとに配信できる推測されたフォローアップの数を制限します。デフォルトは `3` です。

## 仕組み

エージェントの応答後、OpenClaw はツールを無効にした別のコンテキストで、非表示のバックグラウンド抽出処理を実行することがあります。この処理は、推測されたフォローアップの Commitment のみを検索します。表示される会話には書き込まず、メインエージェントに抽出について推論するよう求めることもありません。

確度の高い候補が見つかると、OpenClaw は以下の情報を含む Commitment を保存します。

- エージェント ID
- セッションキー
- 元のチャネルと配信先
- 期限の時間枠
- 短い確認メッセージの提案
- 送信するかどうかを Heartbeat が判断するための、指示を含まないメタデータ

配信は Heartbeat を通じて行われます。Commitment の期限が来ると、Heartbeat は同じエージェントおよびチャネルスコープの Heartbeat ターンにその Commitment を追加します。プロンプトでは、Commitment のメタデータが信頼できないことを明示的に警告し、そこに含まれる指示に従ったり、それを理由にツールを使用したりしないようモデルに指示します。モデルは自然な確認メッセージを1件送信するか、`HEARTBEAT_OK` と応答して破棄できます。Heartbeat が `target: "none"` で設定されている場合、期限が来た Commitment は内部に残り、外部への確認メッセージは送信されません。Commitment 配信用プロンプトでは、元の会話テキストは再現せず、提案された確認メッセージとメタデータのみを使用します。また、期限が来た Commitment の Heartbeat ターンは OpenClaw のツールなしで実行されます。

OpenClaw は、推測された Commitment を記録した直後には配信しません。期限は Commitment の作成後、少なくとも1回分の Heartbeat 間隔を空けるよう調整されるため、推測されたのと同じ瞬間にフォローアップがそのまま返されることはありません。

## スコープ

Commitment は、作成されたときと完全に同じエージェントおよびチャネルのコンテキストに限定されます。Discord であるエージェントと話している間に推測されたフォローアップが、別のエージェント、別のチャネル、または無関係なセッションから配信されることはありません。

このスコープは機能の一部です。自然な確認メッセージは、グローバルなリマインダーシステムではなく、同じ会話が続いているように感じられる必要があります。

## Commitment とリマインダーの違い

| 要望                                            | 使用する機能                                      |
| ----------------------------------------------- | ---------------------------------------- |
| 「午後3時にリマインドして」                             | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「20分後に知らせて」                         | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「平日に毎日このレポートを実行して」                 | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「明日、面接があります」                  | Commitment                              |
| 「一晩中起きていました」                            | Commitment                              |
| 「この未解決のスレッドに私が返信しなければフォローアップして」 | Commitment                              |

ユーザーからの明示的な依頼は、すでにスケジューラーの処理対象です。Commitment は推測されたフォローアップ専用です。つまり、ユーザーがリマインダーを依頼してはいないものの、会話から将来の確認が明らかに役立つ状況に使用されます。

## Commitment を管理する

保存された Commitment の確認と削除には CLI を使用します。

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完全なコマンドリファレンスについては、[`openclaw commitments`](/ja-JP/cli/commitments) を参照してください。

## プライバシーとコスト

Commitment の抽出には LLM の処理が使用されるため、有効にすると対象となるターンの後にバックグラウンドでモデルが追加使用されます。この処理はユーザーに表示される会話からは非表示ですが、フォローアップの有無を判断するために必要な直近のやり取りを読み取ることができます。

保存された Commitment は、OpenClaw のローカル状態です。これは運用上のメモリであり、長期メモリではありません。この機能を無効にするには、次を実行します。

```bash
openclaw config set commitments.enabled false
```

## トラブルシューティング

期待したフォローアップが表示されない場合:

- `commitments.enabled` が `true` であることを確認します。
- `openclaw commitments --all` で、保留中、破棄済み、スヌーズ中、または期限切れのレコードを確認します。
- 対象のエージェントで Heartbeat が実行されていることを確認します。
- そのエージェントセッションで `commitments.maxPerDay` にすでに達していないか確認します。
- 明示的なリマインダーは Commitment の抽出対象外であり、代わりに[スケジュール済みタスク](/ja-JP/automation/cron-jobs)に表示されることに注意してください。

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [`openclaw commitments`](/ja-JP/cli/commitments)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#commitments)
