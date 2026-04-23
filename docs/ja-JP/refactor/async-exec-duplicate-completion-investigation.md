---
read_when:
    - 繰り返し発生するNode exec完了イベントをデバッグする。
    - Heartbeat/system-eventの重複排除に取り組んでいる。
summary: 重複する非同期exec完了注入に関する調査メモ
title: 非同期Exec重複完了調査
x-i18n:
    generated_at: "2026-04-23T14:09:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# 非同期Exec重複完了調査

## スコープ

- Session: `agent:main:telegram:group:-1003774691294:topic:1`
- 症状: 同じsession/run `keen-nexus` の非同期exec完了が、LCMにユーザーturnとして2回記録された。
- 目標: これが重複session注入によるものか、それとも単なるoutbound配信リトライによるものかを特定する。

## 結論

もっとも可能性が高いのは、これが純粋なoutbound配信リトライではなく、**重複session注入**だということです。

Gateway側でもっとも強い欠落箇所は、**node exec完了パス**にあります:

1. Node側のexec終了が、完全な `runId` を含む `exec.finished` を発行する。
2. Gatewayの `server-node-events` がそれをsystem eventに変換し、heartbeatを要求する。
3. Heartbeat runが、drainされたsystem event blockをagent promptに注入する。
4. Embedded runnerが、そのpromptをsession transcript内の新しいユーザーturnとして永続化する。

何らかの理由で（replay、reconnect duplicate、upstream resend、重複producer）、同じ `runId` の同じ `exec.finished` がGatewayに2回届いた場合、このパスには現在 **`runId`/`contextKey` によるidempotency checkがありません**。2つ目のコピーは、同じ内容を持つ2つ目のユーザーメッセージになります。

## 正確なコードパス

### 1. Producer: node exec完了イベント

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` がイベント `exec.finished` を持つ `node.event` を発行します。
  - Payloadには `sessionKey` と完全な `runId` が含まれます。

### 2. Gatewayイベント取り込み

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` を処理します。
  - テキストを構築します:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - これを次でenqueueします:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 直後にwakeを要求します:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. System event重複排除の弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` は **連続した重複テキスト** だけを抑制します:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` は保存しますが、idempotencyには **使っていません**。
  - Drain後は、重複抑制はリセットされます。

つまり、同じ `runId` を持つreplayされた `exec.finished` は、コードがすでに安定したidempotency候補（`exec:<runId>`）を持っているにもかかわらず、後で再び受理され得ます。

### 4. Wake処理は主な重複要因ではない

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakeは `(agentId, sessionKey)` ごとにcoalesceされます。
  - 同じ対象に対する重複wake要求は、1つのpending wake entryに畳み込まれます。

そのため、**重複wake処理だけ**を説明にするのは、重複イベント取り込みより弱いです。

### 5. Heartbeatがイベントを消費し、prompt入力に変換する

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflightがpending system eventsをpeekし、exec-event runsを分類します。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` がそのsessionのqueueをdrainします。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Drainされたsystem event blockがagent prompt bodyの先頭に追加されます。

### 6. Transcript注入地点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` が完全なpromptをembedded PI sessionへ送信します。
  - これが、completion由来のpromptが永続化されたユーザーturnになる地点です。

したがって、同じsystem eventが2回promptに再構築されれば、LCMでの重複ユーザーメッセージは当然発生します。

## なぜ単なるoutbound配信リトライの可能性が低いのか

Heartbeat runnerには実際にoutbound failure pathがあります:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - まずreplyが生成されます。
  - その後で `deliverOutboundPayloads(...)` によりoutbound配信が行われます。
  - そこで失敗すると `{ status: "failed" }` が返ります。

しかし、同じsystem event queue entryに関しては、これだけでは **重複ユーザーturn** を説明するには不十分です:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - system event queueは、outbound配信より前にすでにdrainされています。

したがって、channel send retryそれ自体では、まったく同じqueued eventは再作成されません。外部配信の欠落/失敗は説明できても、それだけで同じsessionユーザーメッセージが2回になることは説明できません。

## 二次的で、確信度が低い可能性

Agent runnerには完全runのretry loopがあります:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 特定のtransient failuresでは、run全体をretryして同じ `commandBody` を再送信することがあります。

これにより、retry条件が発火する前にpromptがすでにappendされていた場合、**同じreply execution内**で永続化されたユーザーpromptが重複する可能性があります。

ただし、これを duplicate `exec.finished` ingestion より低く評価する理由は次のとおりです:

- 観測された間隔が約51秒であり、プロセス内retryよりも2回目のwake/turnに見える;
- レポートには、繰り返しのmessage send failuresもすでに言及されており、即時のmodel/runtime retryよりも、後の別turnを示している。

## 根本原因の仮説

もっとも確信度の高い仮説:

- `keen-nexus` の完了は **node exec eventパス** を通った。
- 同じ `exec.finished` が `server-node-events` に2回届けられた。
- Gatewayは、`enqueueSystemEvent(...)` が `contextKey` / `runId` で重複排除しないため、その両方を受け入れた。
- 受け入れられた各イベントがheartbeatをトリガーし、PI transcriptにユーザーturnとして注入された。

## 提案する小さく外科的な修正

修正するなら、もっとも小さく効果の高い変更は次のいずれかです:

- 少なくとも厳密な `(sessionKey, contextKey, text)` の繰り返しに対して、短い期間はexec/system-event idempotencyが `contextKey` を尊重するようにする;
- または、`server-node-events` に `(sessionKey, runId, event kind)` をキーとした `exec.finished` 専用の重複排除を追加する。

これにより、replayされた `exec.finished` の重複がsession turnになる前に直接ブロックされます。
