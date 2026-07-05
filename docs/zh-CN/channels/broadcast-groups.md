---
read_when:
    - 配置广播组
    - 调试 WhatsApp 中的多 Agent 回复
sidebarTitle: Broadcast groups
status: experimental
summary: 向多个智能体广播发送一条 WhatsApp 消息
title: 广播群组
x-i18n:
    generated_at: "2026-07-05T11:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**状态：** 实验性。2026.1.9 添加。仅限 WhatsApp（Web 渠道）。
</Note>

## 概览

广播组会在同一条入站消息上运行**多个智能体**。每个智能体都会在自己的隔离会话中处理消息并发布自己的回复，因此一个 WhatsApp 号码可以在单个群聊或私信中托管一组专用智能体。

广播组会在渠道允许列表和群组激活规则之后评估。在 WhatsApp 群组中，当 OpenClaw 通常会回复时（例如：被提及时，具体取决于你的群组设置），就会发生广播。它们只改变**运行哪些智能体**，绝不会改变消息是否符合处理条件。

实时 WhatsApp QA 通道包含 `whatsapp-broadcast-group-fanout`，用于验证一条被提及的群组消息可以从两个已配置智能体产生不同的可见回复。

## 配置

### 基本设置

添加顶层 `broadcast` 段（与 `bindings` 同级）。键是 WhatsApp 对端 ID，值是智能体 ID 数组：

- 群聊：群组 JID（例如 `120363403215116621@g.us`）
- 私信：发送者 E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 会在此聊天中回复时，它会运行全部三个智能体。

列出的每个智能体 ID 都必须存在于 `agents.list` 中：配置验证会报告未知 ID，运行时会跳过它们并发出 `Broadcast agent <id> not found in agents.list; skipping` 警告。

### 处理策略

`broadcast.strategy` 设置智能体如何处理消息：

| 策略                 | 行为                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`（默认）   | 所有智能体同时处理；回复可以按任意顺序到达。                          |
| `sequential`         | 智能体按数组顺序处理；每个智能体都会等待前一个完成。                  |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完整示例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 工作原理

### 消息流

<Steps>
  <Step title="Incoming message arrives">
    WhatsApp 群组或私信消息到达。
  </Step>
  <Step title="Route and admission">
    OpenClaw 应用渠道允许列表、群组激活规则和已配置的 ACP 绑定所有权。
  </Step>
  <Step title="Broadcast check">
    如果没有已配置的 ACP 绑定拥有该路由，OpenClaw 会检查对端 ID 是否在 `broadcast` 中。
  </Step>
  <Step title="If broadcast applies">
    - 所有列出的智能体都会处理该消息。
    - 每个智能体都有自己的会话键和隔离上下文。
    - 智能体会并行（默认）或顺序处理。
    - 音频附件会在扇出前转写一次，因此智能体共享一份转写稿，而不是分别发起 STT 调用。

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw 会分发普通路由，或分发路由过程中选择的已配置 ACP 会话路由。
  </Step>
</Steps>

<Note>
广播组不会绕过渠道允许列表或群组激活规则（提及/命令等）。当消息符合处理条件时，它们只改变_运行哪些智能体_。
</Note>

### 会话隔离

广播组中的每个智能体都会维护完全独立的：

- **会话键**（`agent:alfred:whatsapp:group:120363...` 与 `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（一个智能体看不到其他智能体的回复）
- **工作区**（如果已配置，则使用单独的沙箱）
- **工具访问**（不同的允许/拒绝列表）
- **记忆/上下文**（单独的 `IDENTITY.md`、`SOUL.md` 等）

有一个例外是有意共享的：**群组上下文缓冲区**（用于上下文的近期群组消息）按对端共享，因此所有广播智能体在被触发时都会看到相同上下文。扇出完成后会清空一次。

这允许每个智能体拥有不同的人设、模型、技能和工具访问权限（例如只读与读写）。

### 示例：隔离会话

在包含智能体 `["alfred", "baerbel"]` 的群组 `120363403215116621@g.us` 中：

<Tabs>
  <Tab title="Alfred's context">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Baerbel's context">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 使用场景

- **专用智能体团队**：在开发群组中，`code-reviewer`、`security-auditor`、`test-generator` 和 `docs-checker` 分别从自己的角度回答同一条消息。
- **多语言支持**：一个支持聊天中，`support-en`、`support-de`、`support-es` 使用各自语言响应。
- **质量保证**：`support-agent` 回答，同时 `qa-agent` 进行审查，并且只在发现问题时响应。
- **任务自动化**：`task-tracker`、`time-logger` 和 `report-generator` 都消费同一条状态更新。

## 最佳实践

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
    给每个智能体一个单一、明确的职责（`formatter`、`linter`、`tester`），而不是一个通用的 “dev-helper” 智能体。
  </Accordion>
  <Accordion title="2. Use descriptive ids and names">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configure different tool access">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` 是只读的。`fixer` 可以读写。

  </Accordion>
  <Accordion title="4. Monitor performance">
    如果有很多智能体，优先使用 `"strategy": "parallel"`（默认），将广播组限制为少量智能体，并为较简单的智能体使用更快的模型。
  </Accordion>
  <Accordion title="5. Failures stay isolated">
    智能体会独立失败。某个智能体的错误会被记录（`Broadcast agent <id> failed: ...`），且不会阻塞其他智能体。
  </Accordion>
</AccordionGroup>

## 兼容性

### 提供商

广播组目前仅为 WhatsApp（Web 渠道）实现。其他渠道会忽略 `broadcast` 配置。

### 路由

广播组可与现有路由一起工作：

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`：只有 alfred 响应（普通路由）。
- `GROUP_B`：agent1 和 agent2 都响应（广播）。

<Note>
**优先级：** `broadcast` 优先于普通路由绑定。已配置的 ACP 绑定（`bindings[].type="acp"`）是排他的：当其中一个匹配时，OpenClaw 会分发到已配置的 ACP 会话，而不是进行扇出广播。
</Note>

## 故障排查

<AccordionGroup>
  <Accordion title="Agents not responding">
    **检查：**

    1. 智能体 ID 存在于 `agents.list` 中（配置验证会拒绝未知 ID）。
    2. 对端 ID 格式正确（群组 JID 如 `120363403215116621@g.us`，或私信使用 E.164，如 `+15551234567`）。
    3. 消息通过了普通门控（提及/激活规则仍然适用）。

    **调试：**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    成功扇出会记录 `Broadcasting message to <n> agents (<strategy>)`。

  </Accordion>
  <Accordion title="Only one agent responding">
    **原因：** 对端 ID 可能在普通路由绑定中，但不在 `broadcast` 中；或者它可能匹配了一个排他的已配置 ACP 绑定。

    **修复：** 将普通路由绑定的对端添加到广播配置中，或者如果需要扇出广播，则移除/更改已配置的 ACP 绑定。

  </Accordion>
  <Accordion title="Performance issues">
    如果大量智能体导致速度变慢：减少每个群组的智能体数量，使用更轻量的模型，并检查沙箱启动时间。
  </Accordion>
</AccordionGroup>

## 示例

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    群组中的一个代码片段会产生四条回复：格式修复、安全发现、覆盖率缺口和文档小问题。

  </Accordion>
  <Accordion title="Example 2: Multi-language pipeline">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API 参考

### 配置 schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 字段

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  如何处理智能体。`parallel` 会同时运行所有智能体；`sequential` 会按数组顺序运行它们。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群组 JID 或 E.164 电话号码。值是智能体 ID 数组，这些智能体都应处理来自该对端的消息。
</ParamField>

## 限制

1. **最大智能体数：** 没有硬性限制，但很多智能体（10 个以上）可能会变慢。
2. **共享上下文：** 智能体不会看到彼此的响应（设计如此）。
3. **消息顺序：** 并行响应可能按任意顺序到达。
4. **速率限制：** 所有回复都来自一个 WhatsApp 账号，因此每个智能体的回复都会计入同一组 WhatsApp 速率限制。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing)
- [群组](/zh-CN/channels/groups)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [配对](/zh-CN/channels/pairing)
- [会话管理](/zh-CN/concepts/session)
