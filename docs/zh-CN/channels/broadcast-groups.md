---
read_when:
    - 配置广播组
    - 调试 WhatsApp 中多个智能体的回复
status: experimental
summary: 将 WhatsApp 消息广播给多个智能体
title: 广播组
x-i18n:
    generated_at: "2026-04-24T03:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**状态：** 实验性  
**版本：** 新增于 2026.1.9

## 概述

广播组允许多个智能体同时处理并回复同一条消息。这让你能够在单个 WhatsApp 群组或私信中创建协同工作的专业化智能体团队——并且全部使用同一个电话号码。

当前范围：**仅支持 WhatsApp**（web 渠道）。

广播组会在渠道 allowlist 和群组激活规则之后进行评估。在 WhatsApp 群组中，这意味着只有在 OpenClaw 原本会回复时才会触发广播（例如：根据你的群组设置，在被提及时）。

## 使用场景

### 1. 专业化智能体团队

部署多个职责单一、目标明确的智能体：

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

每个智能体都会处理同一条消息，并提供自己专业领域的视角。

### 2. 多语言支持

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. 质量保障工作流

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. 任务自动化

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## 配置

### 基本设置

添加一个顶层 `broadcast` 部分（与 `bindings` 同级）。键为 WhatsApp peer id：

- 群聊：群组 JID（例如 `120363403215116621@g.us`）
- 私信：E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 原本会在此聊天中回复时，它会运行这三个智能体。

### 处理策略

控制智能体如何处理消息：

#### 并行（默认）

所有智能体同时处理：

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 顺序执行

智能体按顺序处理（一个智能体等待前一个完成）：

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

1. **传入消息** 到达 WhatsApp 群组
2. **广播检查**：系统检查 peer ID 是否存在于 `broadcast` 中
3. **如果在广播列表中**：
   - 列出的所有智能体都会处理该消息
   - 每个智能体都有自己的会话键和隔离上下文
   - 智能体会并行（默认）或按顺序处理
4. **如果不在广播列表中**：
   - 应用正常路由（第一个匹配的绑定）

注意：广播组不会绕过渠道 allowlist 或群组激活规则（提及 / 命令 / 等）。它们只会改变消息符合处理条件时 _由哪些智能体运行_。

### 会话隔离

广播组中的每个智能体都会维护完全独立的以下内容：

- **会话键**（`agent:alfred:whatsapp:group:120363...` 与 `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（智能体看不到其他智能体的消息）
- **工作区**（如果已配置，则使用独立沙箱）
- **工具访问权限**（不同的允许 / 拒绝列表）
- **记忆 / 上下文**（独立的 `IDENTITY.md`、`SOUL.md` 等）
- **群组上下文缓冲区**（用于上下文的近期群组消息）按 peer 共享，因此所有广播智能体在被触发时看到的上下文相同

这使每个智能体都可以拥有：

- 不同的个性
- 不同的工具访问权限（例如，只读与读写）
- 不同的模型（例如，opus 与 sonnet）
- 安装不同的 Skills

### 示例：隔离会话

在群组 `120363403215116621@g.us` 中，智能体为 `["alfred", "baerbel"]`：

**Alfred 的上下文：**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel 的上下文：**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## 最佳实践

### 1. 保持智能体职责聚焦

为每个智能体设计单一且清晰的职责：

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **推荐：** 每个智能体只负责一项任务  
❌ **不推荐：** 一个通用的 “dev-helper” 智能体

### 2. 使用描述性名称

让每个智能体的职责一目了然：

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 配置不同的工具访问权限

只给智能体它们所需的工具：

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

### 4. 监控性能

当智能体数量较多时，请考虑：

- 使用 `"strategy": "parallel"`（默认）以提升速度
- 将每个广播组限制在 5 - 10 个智能体
- 为较简单的智能体使用更快的模型

### 5. 优雅地处理失败

智能体会独立失败。某个智能体出错不会阻塞其他智能体：

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## 兼容性

### 提供商

广播组当前可用于：

- ✅ WhatsApp（已实现）
- 🚧 Telegram（计划中）
- 🚧 Discord（计划中）
- 🚧 Slack（计划中）

### 路由

广播组可与现有路由机制配合使用：

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

- `GROUP_A`：只有 alfred 回复（正常路由）
- `GROUP_B`：agent1 和 agent2 都会回复（广播）

**优先级：** `broadcast` 的优先级高于 `bindings`。

## 故障排除

### 智能体未回复

**检查：**

1. 智能体 ID 存在于 `agents.list` 中
2. Peer ID 格式正确（例如 `120363403215116621@g.us`）
3. 智能体不在拒绝列表中

**调试：**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 只有一个智能体回复

**原因：** Peer ID 可能存在于 `bindings` 中，但不在 `broadcast` 中。

**修复：** 添加到广播配置中，或从 bindings 中移除。

### 性能问题

**如果多个智能体导致变慢：**

- 减少每个群组中的智能体数量
- 使用更轻量的模型（用 sonnet 替代 opus）
- 检查沙箱启动时间

## 示例

### 示例 1：代码审查团队

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

**用户发送：** 代码片段  
**回复：**

- code-formatter：“已修正缩进并添加类型提示”
- security-scanner：“⚠️ 第 12 行存在 SQL 注入漏洞”
- test-coverage：“覆盖率为 45%，缺少错误场景的测试”
- docs-checker：“函数 `process_data` 缺少 docstring”

### 示例 2：多语言支持

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

## API Reference

### 配置 Schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 字段

- `strategy`（可选）：智能体的处理方式
  - `"parallel"`（默认）：所有智能体同时处理
  - `"sequential"`：智能体按数组顺序处理
- `[peerId]`：WhatsApp 群组 JID、E.164 号码或其他 peer ID
  - 值：应处理消息的智能体 ID 数组

## 限制

1. **最大智能体数：** 没有硬性上限，但 10 个以上智能体可能会变慢
2. **共享上下文：** 智能体看不到彼此的回复（这是有意设计）
3. **消息顺序：** 并行回复可能以任意顺序到达
4. **速率限制：** 所有智能体都会计入 WhatsApp 的速率限制

## 未来增强

计划中的功能：

- [ ] 共享上下文模式（智能体可以看到彼此的回复）
- [ ] 智能体协作（智能体之间可以互相发出信号）
- [ ] 动态智能体选择（根据消息内容选择智能体）
- [ ] 智能体优先级（某些智能体先于其他智能体回复）

## 相关内容

- [Groups](/zh-CN/channels/groups)
- [Channel routing](/zh-CN/channels/channel-routing)
- [Pairing](/zh-CN/channels/pairing)
- [Multi-agent sandbox tools](/zh-CN/tools/multi-agent-sandbox-tools)
- [Session management](/zh-CN/concepts/session)
