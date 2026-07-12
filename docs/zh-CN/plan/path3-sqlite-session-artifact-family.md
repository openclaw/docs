---
read_when:
    - 你正在实现 clawdbot-d63.2 / clawdbot-04b
    - 你正在处理 SQLite 会话保留、重置、删除或 Agent 删除归档
    - 你需要区分 SQLite 时代的工件族与旧版 JSONL 边车文件
summary: 路径 3：归档属于某个会话的所有 SQLite 对话记录工件的计划
title: Path 3 SQLite 会话工件族
x-i18n:
    generated_at: "2026-07-12T14:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Path 3 SQLite 会话工件族

本说明界定 `clawdbot-d63.2` 的范围；与此同时，`clawdbot-d63.1` 负责 `src/config/sessions/session-accessor.sqlite.ts` 中范围重叠的重置/删除归档辅助函数。本轮处理期间，实现文件存在未提交修改，因此本工件记录确切的契约和补丁位置，以避免与并行工作的同级工作者发生冲突。

## 权威工件族

切换到 SQLite 后，活跃会话转录是 SQLite 行。一个会话的归档工件族包括：

- 当前条目的 `sessionId` 对应的 `transcript_events`、`transcript_event_identities` 和 `sessions` 行。
- `entry.compactionCheckpoints[*].preCompaction.sessionId` 引用的每个 `sessionId` 所对应的同一组 SQLite 转录行。
- `entry.compactionCheckpoints[*].postCompaction.sessionId` 引用的每个 `sessionId` 所对应的同一组 SQLite 转录行。
- `entry.usageFamilySessionIds` 中每个 `sessionId` 所对应的同一组 SQLite 转录行。

仅归档不再被任何剩余 `session_entries` 行或任何剩余条目的压缩或用量工件族元数据引用的行。这样会保留检查点分支/恢复和用量汇总状态，直至最后一个活跃引用消失。

## 切换后的非工件族工件

生成的主题转录文件变体和轨迹边车文件并非活跃的 SQLite 运行时状态。它们是旧版文件工件：

- `<sessionId>-topic-<thread>.jsonl` 等主题变体仅存在于基于文件的转录格式中。SQLite 使用规范会话 ID 加 `session_routes`/条目投递元数据，而不是按主题划分的 JSONL 文件。
- `.trajectory.jsonl` 和 `.trajectory-path.json` 等轨迹边车文件根据真实 JSONL `sessionFile` 路径命名。SQLite 的 `sessionFile` 值是 `sqlite:<agentId>:<sessionId>:<storePath>` 标记，并不指向边车文件。
- 归档层读取器必须继续读取旧版已归档 JSONL 文件，但运行时保留机制不得扫描活跃会话目录，也不得为 SQLite 会话重新打开 JSONL 转录文件。

Doctor 导入仍是旧版主 JSONL 文件及其相邻轨迹边车文件的迁移所有者。SQLite 运行时保留机制不应添加第二个导入器或文件回退路径。

## 补丁位置

扩展 `clawdbot-d63.1` 引入的 SQLite 归档辅助函数，而不是添加并行路径。

1. 在 `deleteSqliteSessionStateIfUnreferenced` 附近添加一个本地收集器：
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - 包含 `entry.sessionId`、检查点的压缩前/后会话 ID 以及 `usageFamilySessionIds`。
   - 过滤空字符串，并以确定性方式去重。

2. 为移除后的存储添加一个引用收集器：
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - 遍历当前 `session_entries`，解析每个 `entry_json`，并从每个保留条目中收集相同的工件族 ID。

3. 修改当前仅归档一个已移除 `sessionId` 的重置/删除/维护调用方，使其传入已移除条目的完整工件族。

4. 对于每个工件族 ID，使用调用方给出的原因（`reset` 或 `deleted`）归档 SQLite 转录行，然后仅当移除后的引用集中不存在该工件族 ID 时，才删除 `sessions` 行。

5. 继续通过现有 SQLite 会话行清理路径集中删除转录事件。不要添加活跃 JSONL 读取。

## 聚焦测试

在 `clawdbot-d63.1` 提交后，将仅限 SQLite 的测试添加到 `src/config/sessions/session-accessor.conformance.test.ts` 或同级生命周期测试中：

- 删除包含压缩前转录的条目时，会归档当前会话和压缩前会话，然后移除两组 SQLite 行。
- 删除共享同一压缩前会话的两个条目之一时，不会归档共享的压缩前会话，直至最后一个引用它的条目被移除。
- 删除包含 `usageFamilySessionIds` 的条目时，如果没有其他条目引用该用量工件族，则归档前序 SQLite 转录行。
- 带有 SQLite 标记且形似主题的会话键不会导致读取任何生成的主题 JSONL 文件或查找边车文件。

聚焦验证应使用：

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

如果最终测试位于 `store.session-lifecycle-mutation.test.ts`，请使用同一包装器显式运行该文件。对于此 Codex 工作树，广泛的 `pnpm` 检查应继续在 Crabbox/Testbox 上运行。
