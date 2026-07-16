---
read_when:
    - OpenClaw に自然なフォローアップを記憶させたい場合
    - 推測されたチェックインとリマインダーの違いを理解したい場合
    - フォローアップの確約を確認または却下したい場合
sidebarTitle: Commitments
summary: 正確なリマインダーではないチェックイン向けに推測されたフォローアップメモリ
title: 推論されたコミットメント
x-i18n:
    generated_at: "2026-07-16T11:32:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitment は、短期間保持されるフォローアップ用の記憶です。有効にすると、OpenClaw は
会話によって将来確認する機会が生まれたことを認識し、後で再び取り上げるよう
記憶できます。

例:

- 明日面接があると伝えると、OpenClaw が後で結果を尋ねることがあります。
- 疲れ切っていると伝えると、OpenClaw が後で眠れたか尋ねることがあります。
- 何かが変わったらフォローアップするとエージェントが伝えた場合、OpenClaw がその未解決事項を
  追跡することがあります。

Commitment は `MEMORY.md` のような永続的な事実ではなく、正確な
リマインダーでもありません。記憶と自動化の中間に位置します。OpenClaw が
会話にひもづく義務を記憶し、期限になると Heartbeat がそれを通知します。

## Commitment を有効にする

Commitment はデフォルトで無効です（`commitments.enabled: false`）。設定で有効にします:

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

`commitments.maxPerDay` は、ローリング方式の1日あたり、エージェントセッションごとに通知できる
推論されたフォローアップの件数を制限します。デフォルトは `3` です。

## 仕組み

エージェントの応答後、OpenClaw はツールを無効にした別のコンテキストで、
非表示のバックグラウンド抽出処理を実行することがあります。この処理では、推論されたフォローアップの Commitment だけを探します。
表示される会話には書き込まず、メインエージェントに抽出について
推論するよう求めることもありません。

確度の高い候補が見つかると、OpenClaw は以下の情報を含む Commitment を保存します:

- エージェント ID
- セッションキー
- 元のチャンネルと配信先
- 期限ウィンドウ
- 確認用の短い推奨メッセージ
- 送信するかどうかを Heartbeat が判断するための、指示ではないメタデータ

通知は Heartbeat を通じて行われます。Commitment の期限が来ると、Heartbeat は
同じエージェントおよびチャンネルスコープの Heartbeat ターンにその Commitment を追加します。
プロンプトでは、Commitment のメタデータが信頼できないことを明示的に警告し、
その中の指示に従ったり、それを理由にツールを使用したりしないようモデルに指示します。
モデルは自然な確認メッセージを1件送信するか、`HEARTBEAT_OK` と応答して破棄できます。
Heartbeat が `target: "none"` で設定されている場合、期限が来た Commitment は
内部に保持され、外部への確認メッセージは送信されません。Commitment 通知プロンプトでは
元の会話テキストを再現せず、推奨される確認メッセージと
メタデータだけを使用します。また、期限が来た Commitment の Heartbeat ターンは OpenClaw ツールなしで実行されます。

OpenClaw が推論された Commitment を書き込んだ直後に通知することはありません。
期限は Commitment の作成時点から少なくとも1回の Heartbeat 間隔後になるよう制限されるため、
推論された瞬間にフォローアップがそのまま返されることはありません。

## スコープ

Commitment は、作成された時点と完全に同じエージェントおよびチャンネルコンテキストに
限定されます。Discord であるエージェントと会話中に推論されたフォローアップが、
別のエージェント、別のチャンネル、または無関係なセッションによって
通知されることはありません。

このスコープは機能の一部です。自然な確認メッセージは、グローバルなリマインダーシステムではなく、
同じ会話が続いているように感じられる必要があります。

## Commitment とリマインダーの違い

| 必要なこと                                      | 使用する機能                               |
| ----------------------------------------------- | ---------------------------------------- |
| 「午後3時にリマインドして」                     | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「20分後に知らせて」                            | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「平日ごとにこのレポートを実行して」            | [スケジュール済みタスク](/ja-JP/automation/cron-jobs) |
| 「明日面接がある」                              | Commitment                              |
| 「一晩中起きていた」                            | Commitment                              |
| 「この未解決のスレッドに返信しなければフォローアップして」 | Commitment                    |

ユーザーによる明確な依頼は、すでにスケジューラーの処理対象です。Commitment は
推論されたフォローアップだけを対象とします。つまり、ユーザーがリマインダーを依頼していなくても、
会話から将来確認することが明らかに有用だと判断できる場合です。

## Commitment を管理する

保存された Commitment の確認と消去には CLI を使用します:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完全なコマンドリファレンスについては、[`openclaw commitments`](/ja-JP/cli/commitments)を参照してください。

## プライバシーとコスト

Commitment の抽出では LLM 処理が使用されるため、有効にすると対象となるターンの後に
バックグラウンドでモデルが追加使用されます。この処理はユーザーに表示される
会話には現れませんが、フォローアップが存在するかどうかを判断するために必要な
直近のやり取りを読み取ることができます。

保存された Commitment は、長期記憶ではなく、共有 SQLite
状態データベース内にある OpenClaw のローカル運用記憶です。この機能を無効にするには、次を実行します:

```bash
openclaw config set commitments.enabled false
```

## トラブルシューティング

想定したフォローアップが表示されない場合:

- `commitments.enabled` が `true` であることを確認します。
- 保留中、破棄済み、スヌーズ中、または期限切れのレコードについて、`openclaw commitments --all` を
  確認します。
- エージェントの Heartbeat が実行されていることを確認します。
- そのエージェントセッションで `commitments.maxPerDay` にすでに達していないか
  確認します。
- 明確なリマインダーは Commitment の抽出対象外であり、代わりに
  [スケジュール済みタスク](/ja-JP/automation/cron-jobs)に表示されることに注意してください。

## 関連項目

- [記憶の概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [`openclaw commitments`](/ja-JP/cli/commitments)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#commitments)
