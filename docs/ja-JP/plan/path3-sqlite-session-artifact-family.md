---
read_when:
    - clawdbot-d63.2 / clawdbot-04b を実装しています
    - SQLite セッションの保持、リセット、削除、またはエージェント削除時のアーカイブ処理を変更している場合
    - SQLite 時代のアーティファクト群とレガシー JSONL サイドカーを区別する必要があります
summary: セッションに属するすべての SQLite トランスクリプト成果物をアーカイブするためのパス 3 の計画
title: パス 3 SQLite セッションアーティファクトファミリー
x-i18n:
    generated_at: "2026-07-12T14:41:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# パス 3 SQLite セッションアーティファクトファミリー

このメモでは `clawdbot-d63.2` のスコープを定めます。一方、重複する
リセット／削除アーカイブヘルパーは `clawdbot-d63.1` が
`src/config/sessions/session-accessor.sqlite.ts` で担当します。
この作業中、実装ファイルには未コミットの変更があったため、このアーティファクトには、
並行作業中のワーカーと競合しないよう、正確な契約とパッチ箇所を記録します。

## 権威あるファミリー

SQLite への切り替え後、アクティブなセッショントランスクリプトは SQLite の行です。セッションの
アーカイブファミリーは次のとおりです。

- エントリの現在の `sessionId` に対応する `transcript_events`、
  `transcript_event_identities`、および `sessions` の行。
- `entry.compactionCheckpoints[*].preCompaction.sessionId` が参照する
  各 `sessionId` に対応する同じ SQLite トランスクリプト行セット。
- `entry.compactionCheckpoints[*].postCompaction.sessionId` が参照する
  各 `sessionId` に対応する同じ SQLite トランスクリプト行セット。
- `entry.usageFamilySessionIds` 内の各 `sessionId` に対応する
  同じ SQLite トランスクリプト行セット。

残っているどの `session_entries` 行からも、または残っているどのエントリの Compaction
メタデータや使用量ファミリーメタデータからも参照されなくなった行のみをアーカイブします。
これにより、最後の有効な参照がなくなるまで、チェックポイントの分岐／復元と
使用量ロールアップの状態が保持されます。

## 切り替え後の非ファミリーアーティファクト

生成されたトピックトランスクリプトファイルのバリアントとトラジェクトリサイドカーは、アクティブな
SQLite ランタイム状態ではありません。これらはレガシーファイルアーティファクトです。

- `<sessionId>-topic-<thread>.jsonl` などのトピックバリアントは、
  ファイルベースのトランスクリプト形式にのみ存在します。SQLite では、トピックごとの JSONL ファイルではなく、
  正規のセッション ID と `session_routes`／エントリ配信メタデータを使用します。
- `.trajectory.jsonl` や `.trajectory-path.json` などの
  トラジェクトリサイドカーは、実際の JSONL `sessionFile` パスから命名されます。SQLite の `sessionFile` 値は
  `sqlite:<agentId>:<sessionId>:<storePath>` マーカーであり、サイドカー
  ファイルを指すものではありません。
- アーカイブ層のリーダーは、レガシーのアーカイブ済み JSONL ファイルを引き続き読み取る必要がありますが、
  ランタイム保持処理では、SQLite セッションについてアクティブなセッションディレクトリをスキャンしたり、JSONL
  トランスクリプトファイルを再度開いたりしてはなりません。

レガシーのプライマリ JSONL ファイルと、それらに隣接するトラジェクトリサイドカーの移行は、
引き続き Doctor インポートが担当します。ランタイムの SQLite 保持処理に、2 つ目の
インポーターやファイルフォールバックを追加してはなりません。

## パッチ箇所

並列パスを追加するのではなく、`clawdbot-d63.1` で導入された SQLite アーカイブヘルパーを
拡張します。

1. `deleteSqliteSessionStateIfUnreferenced` の近くにローカルコレクターを追加します。
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - `entry.sessionId`、チェックポイントの pre/post セッション ID、および
     `usageFamilySessionIds` を含めます。
   - 空文字列を除外し、決定論的に重複を排除します。

2. 削除後のストア用の参照コレクターを追加します。
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - 現在の `session_entries` を反復処理し、各 `entry_json` を解析して、
     残っているすべてのエントリから同じファミリー ID を収集します。

3. 現在、削除された単一の `sessionId` をアーカイブしている
   リセット／削除／メンテナンスの呼び出し元を変更し、削除されたエントリの完全なファミリーを渡すようにします。

4. 各ファミリー ID について、呼び出し元の理由（`reset` または `deleted`）を使用して
   SQLite トランスクリプト行をアーカイブし、そのファミリー ID が削除後の参照セットに存在しない場合にのみ
   `sessions` 行を削除します。

5. トランスクリプトイベントの削除は、既存の SQLite
   セッション行クリーンアップパスに集約したままにします。アクティブな JSONL の読み取りを追加してはなりません。

## 対象を絞ったテスト

`clawdbot-d63.1` のコミット後、
`src/config/sessions/session-accessor.conformance.test.ts`
または同階層のライフサイクルテストに SQLite 専用テストを追加します。

- Compaction 前のトランスクリプトを持つエントリを削除すると、現在の
  セッションと Compaction 前のセッションの両方がアーカイブされ、その後、両方の SQLite 行セットが削除される。
- Compaction 前のセッションを共有する 2 つのエントリの一方を削除しても、
  最後の参照元エントリが削除されるまでは、共有されている Compaction 前のセッションは何もアーカイブされない。
- `usageFamilySessionIds` を持つエントリを削除すると、その使用量ファミリーを参照する他のエントリがない場合、
  先行する SQLite トランスクリプト行がアーカイブされる。
- SQLite マーカーを持つトピック形式のセッションキーによって、生成された
  トピック JSONL の読み取りやサイドカー検索が発生しない。

対象を絞った検証には、次を使用します。

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

最終的なテストを `store.session-lifecycle-mutation.test.ts` に配置する場合は、同じラッパーを使用して
そのファイルを明示的に実行します。この Codex ワークツリーでは、広範な `pnpm` ゲートは
Crabbox/Testbox 上で実行する必要があります。
