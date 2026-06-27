---
read_when:
    - 配置广播群组
    - 调试 WhatsApp 中的多 Agent 回复
sidebarTitle: Broadcast groups
status: experimental
summary: 向多个智能体广播一条 WhatsApp 消息
title: 广播群组
x-i18n:
    generated_at: "2026-06-27T01:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**状态：** 实验性。已在 2026.1.9 中添加。
</Note>

## 概览

广播组允许多个智能体同时处理并响应同一条消息。这让你可以创建专门的智能体团队，在单个 WhatsApp 群组或私信中协同工作，并且全部使用同一个电话号码。

当前范围：**仅限 WhatsApp**（web 渠道）。

广播组会在频道允许列表和群组激活规则之后评估。在 WhatsApp 群组中，这意味着当 OpenClaw 通常会回复时会发生广播（例如：根据你的群组设置，在被提及时）。

## 用例

<AccordionGroup>
  <Accordion title="1. 专门的智能体团队">
    部署多个职责原子化、聚焦的智能体：

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    每个智能体都会处理同一条消息，并提供其专门视角。

  </Accordion>
  <Accordion title="2. 多语言支持">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. 质量保证工作流">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. 任务自动化">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## 配置

### 基本设置

添加一个顶层 `broadcast` 段（与 `bindings` 同级）。键是 WhatsApp peer id：

- 群组聊天：群组 JID（例如 `120363403215116621@g.us`）
- 私信：E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 会在此聊天中回复时，它会运行全部三个智能体。

### 处理策略

控制智能体如何处理消息：

<Tabs>
  <Tab title="parallel（默认）">
    所有智能体同时处理：

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    智能体按顺序处理（一个等待前一个完成）：

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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
  <Step title="传入消息到达">
    一条 WhatsApp 群组或私信消息到达。
  </Step>
  <Step title="路由和准入">
    OpenClaw 应用频道允许列表、群组激活规则，以及已配置的 ACP 绑定所有权。
  </Step>
  <Step title="广播检查">
    如果没有已配置的 ACP 绑定拥有该路由，OpenClaw 会检查 peer ID 是否在 `broadcast` 中。
  </Step>
  <Step title="如果广播适用">
    - 所有列出的智能体都会处理该消息。
    - 每个智能体都有自己的会话键和隔离上下文。
    - 智能体会并行（默认）或顺序处理。

  </Step>
  <Step title="如果广播不适用">
    OpenClaw 会分派普通路由，或分派在路由过程中选定的已配置 ACP 会话路由。
  </Step>
</Steps>

<Note>
广播组不会绕过频道允许列表或群组激活规则（提及/命令等）。它们只会在消息符合处理条件时改变_运行哪些智能体_。
</Note>

### 会话隔离

广播组中的每个智能体都会维护完全独立的：

- **会话键**（`agent:alfred:whatsapp:group:120363...` 与 `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（智能体看不到其他智能体的消息）
- **工作区**（如果已配置，则使用独立沙箱）
- **工具访问权限**（不同的允许/拒绝列表）
- **记忆/上下文**（独立的 IDENTITY.md、SOUL.md 等）
- **群组上下文缓冲区**（用于上下文的最近群组消息）按 peer 共享，因此所有广播智能体在被触发时都会看到相同上下文

这允许每个智能体拥有：

- 不同的人格
- 不同的工具访问权限（例如只读与读写）
- 不同的模型（例如 opus 与 sonnet）
- 安装不同的 Skills

### 示例：隔离会话

在群组 `120363403215116621@g.us` 中，智能体为 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred 的上下文">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel 的上下文">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 最佳实践

<AccordionGroup>
  <Accordion title="1. 保持智能体聚焦">
    为每个智能体设计单一、清晰的职责：

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **好：** 每个智能体有一个任务。❌ **不好：** 一个通用的 “dev-helper” 智能体。

  </Accordion>
  <Accordion title="2. 使用描述性名称">
    清楚说明每个智能体的作用：

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. 配置不同的工具访问权限">
    只给智能体提供它们需要的工具：

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` 是只读的。`fixer` 可以读取和写入。

  </Accordion>
  <Accordion title="4. 监控性能">
    使用许多智能体时，请考虑：

    - 使用 `"strategy": "parallel"`（默认）以提升速度
    - 将广播组限制为 5-10 个智能体
    - 为较简单的智能体使用更快的模型

  </Accordion>
  <Accordion title="5. 优雅处理失败">
    智能体会独立失败。一个智能体的错误不会阻塞其他智能体：

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 兼容性

### 提供商

广播组目前适用于：

- ✅ WhatsApp（已实现）
- 🚧 Telegram（计划中）
- 🚧 Discord（计划中）
- 🚧 Slack（计划中）

### 路由

广播组可与现有路由配合使用：

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
- `GROUP_B`：agent1 和 agent2 都会响应（广播）。

<Note>
**优先级：** `broadcast` 优先于普通路由绑定。已配置的 ACP 绑定（`bindings[].type="acp"`）是独占的：当匹配时，OpenClaw 会分派到已配置的 ACP 会话，而不是扇出广播。
</Note>

## 故障排除

<AccordionGroup>
  <Accordion title="智能体没有响应">
    **检查：**

    1. 智能体 ID 存在于 `agents.list` 中。
    2. Peer ID 格式正确（例如 `120363403215116621@g.us`）。
    3. 智能体不在拒绝列表中。

    **调试：**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="只有一个智能体响应">
    **原因：** Peer ID 可能在普通路由绑定中但不在 `broadcast` 中，或者它可能匹配一个独占的已配置 ACP 绑定。

    **修复：** 将普通路由绑定的 peer 添加到广播配置中，或者如果需要扇出广播，则移除/更改已配置的 ACP 绑定。

  </Accordion>
  <Accordion title="性能问题">
    如果许多智能体导致速度变慢：

    - 减少每个群组的智能体数量。
    - 使用更轻量的模型（使用 sonnet 而不是 opus）。
    - 检查沙箱启动时间。

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

    **用户发送：** 代码片段。

    **响应：**

    - code-formatter：“已修复缩进并添加类型提示”
    - security-scanner：“⚠️ 第 12 行存在 SQL 注入漏洞”
    - test-coverage：“覆盖率为 45%，缺少错误情况测试”
    - docs-checker：“函数 `process_data` 缺少 docstring”

  </Accordion>
  <Accordion title="示例 2：多语言支持">
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
  如何处理智能体。`parallel` 会同时运行所有智能体；`sequential` 会按数组顺序运行它们。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群组 JID、E.164 号码或其他 peer ID。值是应处理消息的智能体 ID 数组。
</ParamField>

## 限制

1. **最大智能体数：** 没有硬性限制，但 10+ 个智能体可能会变慢。
2. **共享上下文：** 智能体不会看到彼此的响应（这是设计使然）。
3. **消息顺序：** 并行响应可能以任意顺序到达。
4. **速率限制：** 所有智能体都会计入 WhatsApp 速率限制。

## 未来增强

计划功能：

- [ ] 共享上下文模式（智能体可以看到彼此的响应）
- [ ] 智能体协调（智能体可以相互发送信号）
- [ ] 动态智能体选择（根据消息内容选择智能体）
- [ ] 智能体优先级（部分智能体先于其他智能体响应）

## 相关

- [频道路由](/zh-CN/channels/channel-routing)
- [群组](/zh-CN/channels/groups)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [配对](/zh-CN/channels/pairing)
- [会话管理](/zh-CN/concepts/session)
