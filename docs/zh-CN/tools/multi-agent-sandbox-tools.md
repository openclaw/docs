---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 每个智能体的沙箱 + 工具限制、优先级和示例
title: 多 Agent 沙盒和工具
x-i18n:
    generated_at: "2026-05-10T19:51:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

每个多 Agent 设置中的 agent 都可以覆盖全局沙箱和工具策略。本页介绍按 agent 配置、优先级规则和示例。

<CardGroup cols={3}>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing">
    后端和模式 — 完整沙箱参考。
  </Card>
  <Card title="沙箱与工具策略与提权模式" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated">
    调试“为什么这被阻止？”
  </Card>
  <Card title="提权模式" href="/zh-CN/tools/elevated">
    面向可信发送者的提权 exec。
  </Card>
</CardGroup>

<Warning>
认证按 agent 划分作用域：每个 agent 都有自己的 `agentDir` 认证存储，位置是 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。绝不要在多个 agent 之间复用 `agentDir`。当 agent 没有本地 profile 时，可以读取默认/主 agent 的认证 profiles，但 OAuth 刷新令牌不会被克隆到次级 agent 存储。如果你手动复制凭证，只复制可移植的静态 `api_key` 或 `token` profiles。
</Warning>

---

## 配置示例

<AccordionGroup>
  <Accordion title="示例 1：个人 + 受限的家庭 agent">
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

    - `main` agent：在主机上运行，拥有完整工具访问权限。
    - `family` agent：在 Docker 中运行（每个 agent 一个容器），仅可使用 `read` 工具。

  </Accordion>
  <Accordion title="示例 2：使用共享沙箱的工作 agent">
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
  </Accordion>
  <Accordion title="示例 2b：全局编码 profile + 仅消息传递的 agent">
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

    - 默认 agent 获得编码工具。
    - `support` agent 仅用于消息传递（+ Slack 工具）。

  </Accordion>
  <Accordion title="示例 3：每个 agent 使用不同的沙箱模式">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
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
  </Accordion>
</AccordionGroup>

---

## 配置优先级

当全局配置（`agents.defaults.*`）和 agent 专用配置（`agents.list[].*`）同时存在时：

### 沙箱配置

agent 专用设置会覆盖全局设置：

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` 会为该 agent 覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱作用域解析为 `"shared"` 时会被忽略）。
</Note>

### 工具限制

过滤顺序如下：

<Steps>
  <Step title="工具 profile">
    `tools.profile` 或 `agents.list[].tools.profile`。
  </Step>
  <Step title="提供商工具 profile">
    `tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="全局工具策略">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="提供商工具策略">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="agent 专用工具策略">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="agent 提供商策略">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙箱工具策略">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="子 agent 工具策略">
    `tools.subagents.tools`，如适用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="优先级规则">
    - 每一层都可以进一步限制工具，但不能重新授予前面层级已拒绝的工具。
    - 如果设置了 `agents.list[].tools.sandbox.tools`，它会为该 agent 替换 `tools.sandbox.tools`。
    - 如果设置了 `agents.list[].tools.profile`，它会为该 agent 覆盖 `tools.profile`。
    - 提供商工具键可以接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空 allowlist 行为">
    如果该链条中的任何显式 allowlist 让本次运行没有可调用工具，OpenClaw 会在向模型提交 prompt 之前停止。这是有意设计的：配置了缺失工具的 agent，例如 `agents.list[].tools.allow: ["query_db"]`，应当明确失败，直到注册 `query_db` 的插件被启用，而不是作为纯文本 agent 继续运行。
  </Accordion>
</AccordionGroup>

工具策略支持 `group:*` 简写，可展开为多个工具。完整列表见 [工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

按 agent 的提权覆盖（`agents.list[].tools.elevated`）可以进一步限制特定 agent 的提权 exec。详情见 [提权模式](/zh-CN/tools/elevated)。

---

## 从单 agent 迁移

<Tabs>
  <Tab title="之前（单 agent）">
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
  </Tab>
  <Tab title="之后（多 Agent）">
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
  </Tab>
</Tabs>

<Note>
旧版 `agent.*` 配置会由 `openclaw doctor` 迁移；之后请优先使用 `agents.defaults` + `agents.list`。
</Note>

---

## 工具限制示例

<Tabs>
  <Tab title="只读 agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="启用 shell 执行但禁用文件系统工具">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    此策略会禁用 OpenClaw 文件系统工具，但 `exec` 仍然是 shell，并且可以在所选主机或沙箱文件系统允许的位置写入文件。对于只读 agent，请拒绝 `exec` 和 `process`，或将 shell 访问与沙箱文件系统控制结合使用，例如 `agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"`。
    </Warning>

  </Tab>
  <Tab title="仅通信">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    此 profile 中的 `sessions_history` 仍然返回有界且经过清理的回忆视图，而不是原始 transcript dump。Assistant 回忆会在删减/截断前剥离 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、降级的工具调用脚手架、泄漏的 ASCII/全角模型控制 token，以及格式异常的 MiniMax 工具调用 XML。

  </Tab>
</Tabs>

---

## 常见陷阱：`"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是 agent id。群组/渠道会话始终会获得自己的键，因此会被视为 non-main 并进入沙箱。如果你希望某个 agent 永远不使用沙箱，请设置 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 测试

配置多 Agent 沙箱和工具后：

<Steps>
  <Step title="检查 agent 解析">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="验证沙箱容器">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="测试工具限制">
    - 发送一条需要受限工具的消息。
    - 验证 agent 无法使用被拒绝的工具。

  </Step>
  <Step title="监控日志">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 故障排除

<AccordionGroup>
  <Accordion title="尽管设置了 `mode: 'all'`，agent 仍未进入沙箱">
    - 检查是否有全局 `agents.defaults.sandbox.mode` 覆盖了它。
    - agent 专用配置优先级更高，因此请设置 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="尽管有 deny list，工具仍然可用">
    - 检查工具过滤顺序：全局 → agent → 沙箱 → 子 agent。
    - 每一层只能进一步限制，不能重新授予。
    - 使用日志验证：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器没有按 agent 隔离">
    - 在 agent 专用沙箱配置中设置 `scope: "agent"`。
    - 默认是 `"session"`，会为每个会话创建一个容器。

  </Accordion>
</AccordionGroup>

---

## 相关

- [提升模式](/zh-CN/tools/elevated)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱与工具策略与提升模式](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止？”
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 完整沙箱参考（模式、范围、后端、镜像）
- [会话管理](/zh-CN/concepts/session)
