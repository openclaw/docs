---
read_when:
    - 配置广播组
    - 在 WhatsApp 中调试多智能体回复
sidebarTitle: Broadcast groups
status: experimental
summary: 将 WhatsApp 消息广播给多个智能体
title: 广播组
x-i18n:
    generated_at: "2026-04-26T09:05:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Status：** 实验性功能。新增于 2026.1.9。
</Note>

## 概览

广播组允许多个智能体同时处理并响应同一条消息。这样你就可以创建协同工作的专业化智能体团队，在同一个 WhatsApp 群组或私信中一起工作——而且只使用一个电话号码。

当前范围：**仅支持 WhatsApp**（web 渠道）。

广播组会在渠道 allowlist 和群组激活规则之后进行评估。在 WhatsApp 群组中，这意味着只有在 OpenClaw 原本会回复时才会触发广播（例如：根据你的群组设置，在被提及时）。

## 使用场景

<AccordionGroup>
  <Accordion title="1. 专业化智能体团队">
    部署多个职责原子化且聚焦明确的智能体：

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    每个智能体都会处理同一条消息，并提供自己专业领域的视角。

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

添加一个顶层 `broadcast` 部分（与 `bindings` 同级）。键是 WhatsApp peer id：

- 群聊：群组 JID（例如 `120363403215116621@g.us`）
- 私信：E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 在这个聊天中原本会回复时，它将运行这三个智能体。

### 处理策略

控制智能体如何处理消息：

<Tabs>
  <Tab title="parallel (default)">
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
    智能体按顺序处理（一个会等待前一个完成）：

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
  <Step title="收到传入消息">
    收到一条 WhatsApp 群组或私信消息。
  </Step>
  <Step title="广播检查">
    系统检查 peer ID 是否在 `broadcast` 中。
  </Step>
  <Step title="如果在广播列表中">
    - 所有列出的智能体都会处理这条消息。
    - 每个智能体都有自己的会话键和隔离上下文。
    - 智能体会以并行（默认）或串行方式处理。

  </Step>
  <Step title="如果不在广播列表中">
    应用正常路由规则（第一个匹配的绑定）。
  </Step>
</Steps>

<Note>
广播组不会绕过渠道 allowlist 或群组激活规则（提及 / 命令 / 等）。它们只会改变当一条消息符合处理条件时，_由哪些智能体运行_。
</Note>

### 会话隔离

广播组中的每个智能体都会维护完全独立的以下内容：

- **会话键**（`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（智能体看不到其他智能体的消息）
- **工作区**（如果已配置，则使用独立沙箱）
- **工具访问权限**（不同的允许 / 拒绝列表）
- **记忆 / 上下文**（独立的 `IDENTITY.md`、`SOUL.md` 等）
- **群组上下文缓冲区**（用于上下文的近期群组消息）按 peer 共享，因此所有广播智能体在触发时都能看到相同上下文

这让每个智能体都可以拥有：

- 不同的人格
- 不同的工具访问权限（例如，只读 vs. 读写）
- 不同的模型（例如，opus vs. sonnet）
- 安装不同的 Skills

### 示例：隔离会话

在群组 `120363403215116621@g.us` 中，智能体为 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
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
  <Accordion title="1. 保持智能体职责聚焦">
    为每个智能体设计单一、明确的职责：

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **推荐：** 每个智能体只做一项工作。❌ **不推荐：** 使用一个通用的“dev-helper”智能体。

  </Accordion>
  <Accordion title="2. 使用描述性名称">
    让每个智能体的作用一目了然：

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
    只给智能体分配它们需要的工具：

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // 只读
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // 读写
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. 监控性能">
    当智能体较多时，请考虑：

    - 为了速度使用 `"strategy": "parallel"`（默认）
    - 将每个广播组的智能体数量限制在 5–10 个
    - 为较简单的智能体使用更快的模型

  </Accordion>
  <Accordion title="5. 优雅地处理失败">
    智能体会独立失败。一个智能体出错不会阻塞其他智能体：

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 兼容性

### 提供商

广播组当前可用于：

- ✅ WhatsApp（已实现）
- 🚧 Telegram（计划中）
- 🚧 Discord（计划中）
- 🚧 Slack（计划中）

### 路由

广播组可与现有路由机制同时使用：

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

- `GROUP_A`：只有 alfred 回复（正常路由）。
- `GROUP_B`：agent1 和 agent2 都会回复（广播）。

<Note>
**优先级：** `broadcast` 的优先级高于 `bindings`。
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
    **原因：** Peer ID 可能在 `bindings` 中，但不在 `broadcast` 中。

    **修复：** 将其添加到广播配置中，或从 bindings 中移除。

  </Accordion>
  <Accordion title="性能问题">
    如果在有很多智能体时运行缓慢：

    - 减少每个群组中的智能体数量。
    - 使用更轻量的模型（用 sonnet 代替 opus）。
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

    **回复：**

    - code-formatter：“已修复缩进并添加类型提示”
    - security-scanner：“⚠️ 第 12 行存在 SQL 注入漏洞”
    - test-coverage：“覆盖率为 45%，缺少错误场景的测试”
    - docs-checker：“函数 `process_data` 缺少文档字符串”

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
  指定智能体的处理方式。`parallel` 会同时运行所有智能体；`sequential` 会按数组顺序运行它们。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群组 JID、E.164 号码或其他 peer ID。值是应处理消息的智能体 ID 数组。
</ParamField>

## 限制

1. **最大智能体数量：** 没有硬性上限，但 10 个以上智能体可能会较慢。
2. **共享上下文：** 智能体看不到彼此的回复（这是设计如此）。
3. **消息顺序：** 并行回复可能以任意顺序到达。
4. **速率限制：** 所有智能体的请求都会计入 WhatsApp 的速率限制。

## 未来增强

计划中的功能：

- [ ] 共享上下文模式（智能体可以看到彼此的回复）
- [ ] 智能体协调（智能体可以互相发送信号）
- [ ] 动态选择智能体（根据消息内容选择智能体）
- [ ] 智能体优先级（某些智能体先于其他智能体回复）

## 相关内容

- [渠道路由](/zh-CN/channels/channel-routing)
- [群组](/zh-CN/channels/groups)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [配对](/zh-CN/channels/pairing)
- [会话管理](/zh-CN/concepts/session)
