---
read_when:
    - 配置广播群组
    - 调试 WhatsApp 中的多 Agent 回复
sidebarTitle: Broadcast groups
status: experimental
summary: 向多个智能体广播一条 WhatsApp 消息
title: 广播群组
x-i18n:
    generated_at: "2026-07-11T20:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**状态：** 实验性功能。于 2026.1.9 添加。仅支持 WhatsApp（Web 渠道）。
</Note>

## 概览

广播群组会针对同一条入站消息运行**多个智能体**。每个智能体都在各自隔离的会话中处理消息并发送自己的回复，因此一个 WhatsApp 号码可以在单个群聊或私信中承载一支由专业智能体组成的团队。

广播群组在渠道允许列表和群组激活规则之后求值。在 WhatsApp 群组中，当 OpenClaw 通常会回复时（例如：被提及时，具体取决于你的群组设置），就会进行广播。广播只会改变**运行哪些智能体**，绝不会改变消息是否符合处理条件。

WhatsApp 实时 QA 测试通道包含 `whatsapp-broadcast-group-fanout`，用于验证一条提及智能体的群组消息能够让两个已配置的智能体分别生成不同的可见回复。

## 配置

### 基本设置

添加一个顶层 `broadcast` 部分（与 `bindings` 同级）。键是 WhatsApp 对端 ID，值是智能体 ID 数组：

- 群聊：群组 JID（例如 `120363403215116621@g.us`）
- 私信：发送者的 E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 通常会在此聊天中回复时，它会运行全部三个智能体。

列出的每个智能体 ID 都必须存在于 `agents.list` 中：配置验证会报告未知 ID，而运行时会跳过它们并显示 `Broadcast agent <id> not found in agents.list; skipping` 警告。

### 处理策略

`broadcast.strategy` 设置智能体处理消息的方式：

| 策略                 | 行为                                                       |
| -------------------- | ---------------------------------------------------------- |
| `parallel`（默认）   | 所有智能体同时处理；回复可以按任意顺序到达。               |
| `sequential`         | 智能体按数组顺序处理；每个智能体等待前一个智能体完成。     |

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
  <Step title="入站消息到达">
    一条 WhatsApp 群组或私信消息到达。
  </Step>
  <Step title="路由和准入">
    OpenClaw 应用渠道允许列表、群组激活规则以及已配置 ACP 绑定的所有权规则。
  </Step>
  <Step title="广播检查">
    如果没有已配置的 ACP 绑定拥有该路由，OpenClaw 会检查对端 ID 是否位于 `broadcast` 中。
  </Step>
  <Step title="如果广播适用">
    - 所有列出的智能体都会处理该消息。
    - 每个智能体都有自己的会话键和隔离上下文。
    - 智能体采用并行（默认）或顺序方式处理。
    - 音频附件会在扇出前仅转录一次，因此智能体会共享同一份转录文本，而不会分别发起 STT 调用。

  </Step>
  <Step title="如果广播不适用">
    OpenClaw 会分派普通路由，或分派路由期间选定的已配置 ACP 会话路由。
  </Step>
</Steps>

<Note>
广播群组不会绕过渠道允许列表或群组激活规则（提及、命令等）。它们只会在消息符合处理条件时改变_运行哪些智能体_。
</Note>

### 会话隔离

广播群组中的每个智能体都分别维护完全独立的：

- **会话键**（`agent:alfred:whatsapp:group:120363...` 与 `agent:baerbel:whatsapp:group:120363...`）
- **对话历史记录**（智能体看不到其他智能体的回复）
- **工作区**（如果已配置，则使用不同的沙箱）
- **工具访问权限**（不同的允许/拒绝列表）
- **记忆/上下文**（独立的 `IDENTITY.md`、`SOUL.md` 等）

有一个有意共享的例外：**群组上下文缓冲区**（用于提供上下文的近期群组消息）按对端共享，因此触发时所有广播智能体都会看到相同的上下文。扇出完成后，该缓冲区会统一清除一次。

这使每个智能体都可以拥有不同的个性、模型、Skills 和工具访问权限（例如只读与读写）。

### 示例：隔离的会话

在群组 `120363403215116621@g.us` 中配置智能体 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred 的上下文">
    ```text
    会话：agent:alfred:whatsapp:group:120363403215116621@g.us
    历史记录：[用户消息，alfred 之前的回复]
    工作区：~/openclaw-alfred/
    工具：读取、写入、执行
    ```
  </Tab>
  <Tab title="Baerbel 的上下文">
    ```text
    会话：agent:baerbel:whatsapp:group:120363403215116621@g.us
    历史记录：[用户消息，baerbel 之前的回复]
    工作区：~/openclaw-baerbel/
    工具：只读
    ```
  </Tab>
</Tabs>

## 使用场景

- **专业智能体团队**：在一个开发群组中，`code-reviewer`、`security-auditor`、`test-generator` 和 `docs-checker` 分别从各自角度回答同一条消息。
- **多语言支持**：在一个支持聊天中，由 `support-en`、`support-de`、`support-es` 使用各自的语言回复。
- **质量保证**：`support-agent` 负责回答，`qa-agent` 负责审查，并且仅在发现问题时回复。
- **任务自动化**：`task-tracker`、`time-logger` 和 `report-generator` 共同处理同一条状态更新。

## 最佳实践

<AccordionGroup>
  <Accordion title="1. 让智能体专注于单一职责">
    为每个智能体分配一个明确的职责（`formatter`、`linter`、`tester`），而不是使用一个通用的“开发辅助”智能体。
  </Accordion>
  <Accordion title="2. 使用描述性 ID 和名称">
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
  <Accordion title="3. 配置不同的工具访问权限">
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

    `reviewer` 为只读。`fixer` 可以读取和写入。

  </Accordion>
  <Accordion title="4. 监控性能">
    使用多个智能体时，优先选择 `"strategy": "parallel"`（默认），将广播群组限制为少量智能体，并为较简单的智能体使用速度更快的模型。
  </Accordion>
  <Accordion title="5. 故障保持隔离">
    智能体之间的故障互不影响。单个智能体的错误会被记录（`Broadcast agent <id> failed: ...`），且不会阻塞其他智能体。
  </Accordion>
</AccordionGroup>

## 兼容性

### 提供商

广播群组目前仅为 WhatsApp（Web 渠道）实现。其他渠道会忽略 `broadcast` 配置。

### 路由

广播群组可与现有路由配合使用：

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

- `GROUP_A`：仅 alfred 回复（普通路由）。
- `GROUP_B`：agent1 和 agent2 都会回复（广播）。

<Note>
**优先级：** `broadcast` 的优先级高于普通路由绑定。已配置的 ACP 绑定（`bindings[].type="acp"`）具有独占性：匹配时，OpenClaw 会分派到已配置的 ACP 会话，而不是进行扇出广播。
</Note>

## 故障排查

<AccordionGroup>
  <Accordion title="智能体未响应">
    **检查：**

    1. 智能体 ID 存在于 `agents.list` 中（配置验证会拒绝未知 ID）。
    2. 对端 ID 格式正确（群组 JID，例如 `120363403215116621@g.us`；私信使用 E.164 格式，例如 `+15551234567`）。
    3. 消息通过了常规门控（提及/激活规则仍然适用）。

    **调试：**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    成功扇出时会记录 `Broadcasting message to <n> agents (<strategy>)`。

  </Accordion>
  <Accordion title="只有一个智能体响应">
    **原因：** 对端 ID 可能位于普通路由绑定中，但不在 `broadcast` 中；或者它可能匹配了具有独占性的已配置 ACP 绑定。

    **解决方法：** 将普通路由绑定的对端添加到广播配置中；如果需要扇出广播，则移除或更改已配置的 ACP 绑定。

  </Accordion>
  <Accordion title="性能问题">
    如果使用多个智能体时速度较慢：减少每个群组中的智能体数量、使用更轻量的模型，并检查沙箱启动时间。
  </Accordion>
</AccordionGroup>

## 示例

<AccordionGroup>
  <Accordion title="示例 1：代码审查团队">
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

    群组中的一个代码片段会产生四条回复：格式修复、安全问题、覆盖率缺口和文档细节问题。

  </Accordion>
  <Accordion title="示例 2：多语言流水线">
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

### 配置架构

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
  智能体的处理方式。`parallel` 同时运行所有智能体；`sequential` 按数组顺序运行智能体。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群组 JID 或 E.164 电话号码。值为智能体 ID 数组，其中所有智能体都应处理来自该对端的消息。
</ParamField>

## 限制

1. **智能体数量上限：** 没有硬性限制，但智能体数量较多（10 个以上）时可能会变慢。
2. **共享上下文：** 智能体看不到彼此的回复（这是有意设计的行为）。
3. **消息顺序：** 并行回复可能按任意顺序到达。
4. **速率限制：** 所有回复都来自同一个 WhatsApp 账户，因此每个智能体的回复都会计入同一组 WhatsApp 速率限制。

## 相关内容

- [频道路由](/zh-CN/channels/channel-routing)
- [群组](/zh-CN/channels/groups)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [配对](/zh-CN/channels/pairing)
- [会话管理](/zh-CN/concepts/session)
