---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 按 Agent 配置的沙箱和工具限制、优先级及示例
title: 多 Agent 沙盒和工具
x-i18n:
    generated_at: "2026-07-11T21:01:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

多智能体设置中的每个智能体都可以覆盖全局沙箱和工具策略。本页介绍按智能体配置、优先级规则和示例。

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing">
    后端和模式——完整的沙箱参考。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated">
    调试“为什么这被阻止了？”
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated">
    面向可信发送者的提升权限 Exec。
  </Card>
</CardGroup>

<Warning>
身份验证按智能体划分作用域：每个智能体在 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` 中都有自己的 `agentDir` 身份验证存储。绝不要在多个智能体之间复用 `agentDir`。当智能体没有本地配置资料时，可以读取默认/主智能体的身份验证配置资料，但 OAuth 刷新令牌不会克隆到辅助智能体的存储中。如果手动复制凭据，只复制可移植的静态 `api_key` 或 `token` 配置资料。
</Warning>

---

## 配置示例

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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

    - `main` 智能体：在主机上运行，可使用全部工具。
    - `family` 智能体：在 Docker 中运行（每个智能体一个容器），只能使用 `read` 并向当前对话发送消息。

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
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
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
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

    - 默认智能体可使用编程工具。
    - `support` 智能体只能收发消息（外加 Slack 工具）。

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
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

当全局配置（`agents.defaults.*`）和智能体专属配置（`agents.list[].*`）同时存在时：

### 沙箱配置

智能体专属设置会覆盖全局设置：

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
对于该智能体，`agents.list[].sandbox.{docker,browser,prune}.*` 会覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱作用域解析为 `"shared"` 时忽略）。
</Note>

### 工具限制

筛选顺序如下：

<Steps>
  <Step title="Tool profile">
    `tools.profile` 或 `agents.list[].tools.profile`。
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`（如适用）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - 每一级都可以进一步限制工具，但不能重新授予此前级别已拒绝的工具。
    - 如果设置了 `agents.list[].tools.sandbox.tools`，它会替换该智能体的 `tools.sandbox.tools`。
    - 如果设置了 `agents.list[].tools.profile`，它会覆盖该智能体的 `tools.profile`。
    - 提供商工具键可以是 `provider`（例如 `google-antigravity`），也可以是 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    如果该链中的任何显式允许列表导致本次运行没有可调用的工具，OpenClaw 会在向模型提交提示词之前停止。这是有意设计的：如果智能体配置了缺失的工具，例如 `agents.list[].tools.allow: ["query_db"]`，那么在启用注册 `query_db` 的插件之前，它应明确失败，而不是作为纯文本智能体继续运行。
  </Accordion>
</AccordionGroup>

工具策略支持 `group:*` 简写形式，可展开为多个工具。完整列表请参阅[工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

按智能体配置的提升权限覆盖项（`agents.list[].tools.elevated`）可以进一步限制特定智能体的提升权限 Exec。详情请参阅[提升权限模式](/zh-CN/tools/elevated)。

---

## 从单智能体迁移

<Tabs>
  <Tab title="Before (single agent)">
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
  <Tab title="After (multi-agent)">
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
旧版 `agents.defaults.*`/`agents.list[].*` 配置键（例如 `sandbox.perSession`、`agentRuntime`、`embeddedPi`）由 `openclaw doctor` 迁移；后续请优先使用 `agents.defaults` + `agents.list`。
</Note>

---

## 工具限制示例

<Tabs>
  <Tab title="Read-only agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shell execution with filesystem tools disabled">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    此策略会禁用 OpenClaw 文件系统工具，但 `exec` 仍然是 shell，可以在所选主机或沙箱文件系统允许的任何位置写入文件。对于只读智能体，请拒绝 `exec` 和 `process`，或者将 shell 访问与沙箱文件系统控制结合使用，例如 `agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"`。
    </Warning>

  </Tab>
  <Tab title="Communication-only">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    此配置资料中的 `sessions_history` 仍返回有界且经过净化的回忆视图，而不是原始记录转储。智能体回忆会在脱敏/截断前移除思考标签、`<relevant-memories>` 框架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及截断的工具调用块）、降级的工具调用框架、泄漏的 ASCII/全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML。

  </Tab>
</Tabs>

---

## 常见陷阱：`"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 会将会话键与主会话键进行比较（始终为 `"main"`；`session.mainKey` 不可由用户配置，OpenClaw 会对任何其他值发出警告并将其忽略），而不是检查智能体 ID。群组/渠道会话始终拥有各自的键，因此会被视为非主会话并进行沙箱隔离。如果你希望某个智能体永不进行沙箱隔离，请设置 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 测试

配置多 Agent 沙盒和工具后：

<Steps>
  <Step title="Check agent resolution">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verify sandbox containers">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Test tool restrictions">
    - 发送一条需要受限工具的消息。
    - 验证智能体无法使用被拒绝的工具。

  </Step>
  <Step title="Monitor logs">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 故障排查

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - 检查是否存在会覆盖它的全局 `agents.defaults.sandbox.mode`。
    - 智能体专属配置优先，因此请设置 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="尽管存在拒绝列表，工具仍然可用">
    - 检查[完整过滤顺序](#tool-restrictions)：配置文件 → 提供商配置文件 → 全局策略 → 提供商策略 → Agent 策略 → Agent 提供商策略 → 沙箱 → 子智能体。
    - 每一级只能进一步限制，不能恢复授权。
    - 有关逐步调试方法，请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。

  </Accordion>
  <Accordion title="容器未按 Agent 隔离">
    - 默认 `scope` 为 `"agent"`（每个 Agent ID 使用一个容器）。
    - 设置 `scope: "session"` 可让每个会话使用一个容器，设置 `scope: "shared"` 可让多个 Agent 共用一个容器。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [提升权限模式](/zh-CN/tools/elevated)
- [多 Agent 路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么此操作被阻止？”
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 完整的沙箱参考（模式、作用域、后端、镜像）
- [会话管理](/zh-CN/concepts/session)
