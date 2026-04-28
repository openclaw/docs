---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 按智能体设置的沙箱 + 工具限制、优先级和示例
title: 多智能体沙箱和工具
x-i18n:
    generated_at: "2026-04-28T12:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c43b9ff881d05c49f3e9d93859dd620e7b8e9febfddb16b7a9fd8b8e331e65
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

每个多智能体设置中的智能体都可以覆盖全局沙箱和工具策略。本页介绍按智能体配置、优先级规则和示例。

<CardGroup cols={3}>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing">
    后端和模式 — 完整沙箱参考。
  </Card>
  <Card title="沙箱与工具策略与提权" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated">
    调试“为什么这被阻止了？”
  </Card>
  <Card title="提权模式" href="/zh-CN/tools/elevated">
    面向受信发送者的提权 exec。
  </Card>
</CardGroup>

<Warning>
凭证按智能体隔离：每个智能体都会从自己的 `agentDir` 凭证存储读取，位置是 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。凭据**不会**在智能体之间共享。切勿在多个智能体之间复用 `agentDir`。如果你想共享凭据，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir`。
</Warning>

---

## 配置示例

<AccordionGroup>
  <Accordion title="示例 1：个人智能体 + 受限家庭智能体">
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

    - `main` 智能体：在主机上运行，拥有完整工具访问权限。
    - `family` 智能体：在 Docker 中运行（每个智能体一个容器），仅有 `read` 工具。

  </Accordion>
  <Accordion title="示例 2：使用共享沙箱的工作智能体">
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
  <Accordion title="示例 2b：全局编码配置 + 仅消息智能体">
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

    - 默认智能体获得编码工具。
    - `support` 智能体仅用于消息（+ Slack 工具）。

  </Accordion>
  <Accordion title="示例 3：每个智能体使用不同沙箱模式">
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

当全局配置（`agents.defaults.*`）和智能体特定配置（`agents.list[].*`）同时存在时：

### 沙箱配置

智能体特定设置会覆盖全局设置：

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
`agents.list[].sandbox.{docker,browser,prune}.*` 会覆盖该智能体的 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱 scope 解析为 `"shared"` 时忽略）。
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
  <Step title="智能体特定工具策略">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="智能体提供商策略">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙箱工具策略">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="子智能体工具策略">
    `tools.subagents.tools`，如适用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="优先级规则">
    - 每一层都可以进一步限制工具，但不能重新授予前面层级已拒绝的工具。
    - 如果设置了 `agents.list[].tools.sandbox.tools`，它会替换该智能体的 `tools.sandbox.tools`。
    - 如果设置了 `agents.list[].tools.profile`，它会覆盖该智能体的 `tools.profile`。
    - 提供商工具键既可以接受 `provider`（例如 `google-antigravity`），也可以接受 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空允许列表行为">
    如果该链中的任何显式允许列表让本次运行没有可调用工具，OpenClaw 会在向模型提交提示之前停止。这是有意设计的：配置了缺失工具的智能体，例如 `agents.list[].tools.allow: ["query_db"]`，应当在注册 `query_db` 的插件启用之前明确失败，而不是继续作为纯文本智能体运行。
  </Accordion>
</AccordionGroup>

工具策略支持 `group:*` 简写，它们会展开为多个工具。完整列表见[工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

按智能体提权覆盖（`agents.list[].tools.elevated`）可以进一步限制特定智能体的提权 exec。详情见[提权模式](/zh-CN/tools/elevated)。

---

## 从单智能体迁移

<Tabs>
  <Tab title="之前（单智能体）">
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
  <Tab title="之后（多智能体）">
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
旧版 `agent.*` 配置会由 `openclaw doctor` 迁移；后续优先使用 `agents.defaults` + `agents.list`。
</Note>

---

## 工具限制示例

<Tabs>
  <Tab title="只读智能体">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="安全执行（不修改文件）">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
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

    此 profile 中的 `sessions_history` 仍会返回有界且经过清理的回忆视图，而不是原始转录转储。助手回忆会在脱敏/截断前移除 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块）、降级后的工具调用脚手架、泄漏的 ASCII/全角模型控制 token，以及格式异常的 MiniMax 工具调用 XML。

  </Tab>
</Tabs>

---

## 常见陷阱：`non-main`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认为 `"main"`），而不是智能体 ID。群组/渠道会话始终获得自己的键，因此会被视为非 main 并被沙箱隔离。如果你希望某个智能体永远不进入沙箱，请设置 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 测试

配置多智能体沙箱和工具后：

<Steps>
  <Step title="检查智能体解析">
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
    - 验证智能体无法使用被拒绝的工具。

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
  <Accordion title="尽管设置了 `mode: 'all'`，智能体仍未被沙箱隔离">
    - 检查是否存在覆盖它的全局 `agents.defaults.sandbox.mode`。
    - 智能体特定配置优先，因此请设置 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="尽管有 deny list，工具仍可用">
    - 检查工具过滤顺序：全局 → 智能体 → 沙箱 → 子智能体。
    - 每一层只能进一步限制，不能重新授予。
    - 使用日志验证：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器未按智能体隔离">
    - 在智能体特定沙箱配置中设置 `scope: "agent"`。
    - 默认值是 `"session"`，即每个会话创建一个容器。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [提权模式](/zh-CN/tools/elevated)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱与工具策略与提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止了？”
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 完整沙箱参考（模式、scope、后端、镜像）
- [会话管理](/zh-CN/concepts/session)
