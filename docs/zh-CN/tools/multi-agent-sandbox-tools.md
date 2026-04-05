---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “按智能体的沙箱隔离 + 工具限制、优先级和示例”
title: 多智能体沙箱隔离与工具
x-i18n:
    generated_at: "2026-04-05T10:12:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# 多智能体沙箱隔离与工具配置

在多智能体设置中，每个智能体都可以覆盖全局沙箱隔离和工具
策略。本页介绍按智能体的配置、优先级规则以及
示例。

- **沙箱后端和模式**：参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- **调试被阻止的工具**：参见 [沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) 和 `openclaw sandbox explain`。
- **Elevated exec**：参见 [Elevated Mode](/zh-CN/tools/elevated)。

认证是按智能体划分的：每个智能体都从自己的 `agentDir` 认证存储读取，
路径为 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。
凭据**不会**在智能体之间共享。绝不要在多个智能体之间复用 `agentDir`。
如果你想共享凭据，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。

---

## 配置示例

### 示例 1：个人智能体 + 受限家庭智能体

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**结果：**

- `main` 智能体：在主机上运行，具有完整工具访问权限
- `family` 智能体：在 Docker 中运行（每个智能体一个容器），仅有 `read` 工具

---

### 示例 2：使用共享沙箱的工作智能体

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### 示例 2b：全局 coding 配置 + 仅限消息的智能体

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**结果：**

- 默认智能体会获得 coding 工具
- `support` 智能体仅限消息功能（+ Slack 工具）

---

### 示例 3：每个智能体使用不同的沙箱模式

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // 全局默认值
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // 覆盖：main 永不使用沙箱
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // 覆盖：public 始终使用沙箱
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## 配置优先级

当同时存在全局（`agents.defaults.*`）和按智能体（`agents.list[].*`）配置时：

### 沙箱配置

按智能体设置会覆盖全局设置：

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**说明：**

- 对于该智能体，`agents.list[].sandbox.{docker,browser,prune}.*` 会覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱范围解析为 `"shared"` 时会被忽略）。

### 工具限制

过滤顺序为：

1. **工具 profile**（`tools.profile` 或 `agents.list[].tools.profile`）
2. **提供商工具 profile**（`tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`）
3. **全局工具策略**（`tools.allow` / `tools.deny`）
4. **提供商工具策略**（`tools.byProvider[provider].allow/deny`）
5. **按智能体的工具策略**（`agents.list[].tools.allow/deny`）
6. **智能体提供商策略**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **沙箱工具策略**（`tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`）
8. **Subagent 工具策略**（`tools.subagents.tools`，如果适用）

每一层都可以进一步限制工具，但不能重新授予之前层级已拒绝的工具。
如果设置了 `agents.list[].tools.sandbox.tools`，它会替换该智能体的 `tools.sandbox.tools`。
如果设置了 `agents.list[].tools.profile`，它会覆盖该智能体的 `tools.profile`。
提供商工具键可以接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

工具策略支持 `group:*` 简写，可展开为多个工具。完整列表参见 [工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

按智能体的 Elevated 覆盖（`agents.list[].tools.elevated`）还可以进一步限制特定智能体的 elevated exec。详情参见 [Elevated Mode](/zh-CN/tools/elevated)。

---

## 从单智能体迁移

**之前（单智能体）：**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**之后（具有不同配置的多智能体）：**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

旧版 `agent.*` 配置会由 `openclaw doctor` 迁移；今后请优先使用 `agents.defaults` + `agents.list`。

---

## 工具限制示例

### 只读智能体

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 安全执行智能体（不允许文件修改）

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 仅通信智能体

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

此配置中的 `sessions_history` 仍然返回有界、已净化的 recall
视图，而不是原始 transcript 倾倒。助手 recall 会剥离 thinking 标签、
`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷
（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>` 以及被截断的工具调用块）、
降级后的工具调用脚手架、泄露的 ASCII/全角模型控制
token，以及格式错误的 MiniMax 工具调用 XML，然后才进行脱敏/截断。

---

## 常见陷阱：“non-main”

`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认值为 `"main"`），
而不是智能体 id。群组/渠道会话始终拥有自己的 key，因此它们
会被视为 non-main，并进入沙箱。如果你希望某个智能体永不进入
沙箱，请设置 `agents.list[].sandbox.mode: "off"`。

---

## 测试

配置好多智能体沙箱隔离和工具后：

1. **检查智能体解析：**

   ```exec
   openclaw agents list --bindings
   ```

2. **验证沙箱容器：**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **测试工具限制：**
   - 发送一条需要受限工具的消息
   - 验证该智能体无法使用被拒绝的工具

4. **监控日志：**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## 故障排除

### 尽管设置了 `mode: "all"`，智能体仍未进入沙箱

- 检查是否存在覆盖它的全局 `agents.defaults.sandbox.mode`
- 按智能体配置优先级更高，因此请设置 `agents.list[].sandbox.mode: "all"`

### 尽管在拒绝列表中，工具仍然可用

- 检查工具过滤顺序：全局 → 智能体 → 沙箱 → subagent
- 每一层只能进一步限制，不能重新授予
- 通过日志验证：`[tools] filtering tools for agent:${agentId}`

### 容器没有按智能体隔离

- 在按智能体的沙箱配置中设置 `scope: "agent"`
- 默认值是 `"session"`，这会为每个会话创建一个容器

---

## 另见

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整的沙箱参考（模式、范围、后端、镜像）
- [沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么这个被阻止了？”
- [Elevated Mode](/zh-CN/tools/elevated)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)
- [会话管理](/zh-CN/concepts/session)
