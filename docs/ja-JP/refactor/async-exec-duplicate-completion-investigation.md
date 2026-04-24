---
read_when:
    - 繰り返し発生する Node exec 完了イベントをデバッグする դեպքում +#+#+#+#+#+analysis to=functions.read code  天天中彩票提款json  content{"path":"../AGENTS.md"}
    - Heartbeat / システムイベントの重複排除に取り組む場合
summary: 重複する非同期 exec 完了注入に関する調査メモ
title: 非同期 exec の重複完了調査
x-i18n:
    generated_at: "2026-04-24T05:18:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## スコープ

- セッション: `agent:main:telegram:group:-1003774691294:topic:1`
- 症状: 同じ非同期 exec 完了（セッション/run `keen-nexus`）が、LCM にユーザーターンとして 2 回記録された。
- 目標: これが重複セッション注入によるものか、単なる送信リトライによるものかを特定する。

## 結論

最も可能性が高いのは、これは純粋な送信リトライではなく、**重複セッション注入**です。

Gateway 側で最も強い欠落は、**Node exec 完了パス**にあります。

1. Node 側の exec 完了が、完全な `runId` 付きで `exec.finished` を送出する。
2. Gateway の `server-node-events` が、それをシステムイベントに変換し、Heartbeat を要求する。
3. Heartbeat 実行が、排出したシステムイベントブロックをエージェントプロンプトに注入する。
4. 埋め込み runner が、そのプロンプトをセッショントランスクリプト内の新しいユーザーターンとして永続化する。

同じ `runId` の `exec.finished` が何らかの理由（リプレイ、再接続による重複、上流の再送、重複 producer）で Gateway に 2 回到達した場合、OpenClaw には現在、このパスに対して `runId`/`contextKey` でキー付けされた**冪等性チェックがありません**。2 回目のコピーも同じ内容の 2 つ目のユーザーメッセージになります。

## 正確なコードパス

### 1. Producer: Node exec 完了イベント

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` が event `exec.finished` を持つ `node.event` を送出する。
  - ペイロードには `sessionKey` と完全な `runId` が含まれる。

### 2. Gateway イベント取り込み

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` を処理する。
  - 次のようなテキストを構築する:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 次でキューに入れる:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 直後に wake を要求する:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. システムイベント重複排除の弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` は**連続した重複テキスト**だけを抑制する:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` は保存するが、**冪等性には使っていない**。
  - drain 後は重複抑制がリセットされる。

これは、同じ `runId` の再送された `exec.finished` が後で再び受け入れられうることを意味します。コードにはすでに安定した冪等性候補（`exec:<runId>`）があったにもかかわらずです。

### 4. Wake 処理は主たる重複要因ではない

- `src/infra/heartbeat-wake.ts:79-117`
  - wake は `(agentId, sessionKey)` で coalesce される。
  - 同じターゲットに対する重複 wake 要求は、1 つの pending wake エントリーに折りたたまれる。

このため、**wake 処理の重複だけ**で説明するより、イベント取り込みの重複のほうがより強い説明になります。

### 5. Heartbeat がイベントを消費し、プロンプト入力に変える

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight で pending system event を peek し、exec-event 実行を分類する。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` がそのセッションのキューを排出する。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 排出されたシステムイベントブロックがエージェントプロンプト本文の先頭に追加される。

### 6. トランスクリプト注入ポイント

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` が完全なプロンプトを埋め込み PI セッションに送る。
  - ここが、完了由来のプロンプトが永続化されたユーザーターンになるポイントである。

したがって、同じシステムイベントが 2 回プロンプトに再構築されれば、LCM に重複ユーザーメッセージが出るのは当然です。

## なぜ単なる送信リトライの可能性は低いのか

Heartbeat runner には実際に送信失敗パスがあります。

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 返信は先に生成される。
  - 送信配信はその後で `deliverOutboundPayloads(...)` によって行われる。
  - そこでの失敗は `{ status: "failed" }` を返す。

しかし、同じシステムイベントキューエントリーに対して、これだけでは**重複ユーザーターン**を説明するには不十分です。

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - システムイベントキューは、送信配信の前にすでに drain されている。

したがって、チャネル送信リトライだけでは、まったく同じキュー済みイベントを再作成できません。外部配信の欠落/失敗は説明できますが、それだけでは同一のセッションユーザーメッセージが 2 回出ることは説明できません。

## 二次的で、より低信頼の可能性

エージェント runner には完全実行リトライループがあります。

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 一部の一過性失敗では、実行全体をリトライし、同じ `commandBody` を再送信できる。

これは、リトライ条件が発動する前にプロンプトがすでに追記されていた場合、**同じ reply 実行内で**
永続化されたユーザープロンプトを重複させる可能性があります。

ただし、私はこれを `exec.finished` 重複取り込みより低く評価します。理由は:

- 観測されたギャップが約 51 秒であり、プロセス内リトライよりも 2 回目の wake/turn に見えること;
- レポートがすでに繰り返しの message send failure に言及しており、即時のモデル/ランタイムリトライよりも、別の後続ターンを示唆していること。

## 根本原因仮説

最も信頼度の高い仮説:

- `keen-nexus` の完了は **Node exec イベントパス**を通ってきた。
- 同じ `exec.finished` が `server-node-events` に 2 回届いた。
- `enqueueSystemEvent(...)` が `contextKey` / `runId` で重複排除しないため、Gateway は両方を受け入れた。
- 受け入れられた各イベントが Heartbeat を発火し、PI トランスクリプトにユーザーターンとして注入された。

## 提案する小さく外科的な修正

修正するなら、最も小さく効果の高い変更は次です。

- exec/system-event の冪等性で、少なくとも短い時間範囲について、厳密な `(sessionKey, contextKey, text)` の重複に対して `contextKey` を考慮するようにする;
- または `server-node-events` に `(sessionKey, runId, event kind)` をキーにした `exec.finished` 専用の重複排除を追加する。

これにより、再送された `exec.finished` の重複が、セッションターンになる前に直接ブロックされます。

## 関連

- [Exec tool](/ja-JP/tools/exec)
- [セッション管理](/ja-JP/concepts/session)
