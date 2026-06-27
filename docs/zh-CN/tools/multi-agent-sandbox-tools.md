---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 按智能体的沙箱 + 工具限制、优先级和示例
title: 多 Agent 沙盒和工具
x-i18n:
    generated_at: "2026-05-11T20:35:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Each agent in a multi-agent setup can override the global sandbox and tool policy. This page covers per-agent configuration, precedence rules, and examples.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing">
    后端和模式 — 完整的沙箱参考。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated">
    调试“为什么这被阻止了？”
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated">
    面向受信任发送者的 elevated exec。
  </Card>
</CardGroup>

<Warning>
凭证按 agent 划定范围：每个 agent 都有自己的 `agentDir` 凭证存储，位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。切勿在多个 agent 之间复用 `agentDir`。当 agent 没有本地配置文件时，可以读取默认/主 agent 的凭证配置文件，但 OAuth 刷新令牌不会克隆到次级 agent 存储中。如果你手动复制凭证，只复制可移植的静态 `api_key` 或 `token` 配置文件。
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

    - `main` agent：在主机上运行，拥有完整工具访问权限。
    - `family` agent：在 Docker 中运行（每个 agent 一个容器），仅允许 `read` 和当前对话消息发送。

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

    - 默认 agent 获得编码工具。
    - `support` agent 仅支持消息传递（+ Slack 工具）。

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

当同时存在全局配置（`agents.defaults.*`）和 agent 专属配置（`agents.list[].*`）时：

### 沙箱配置

agent 专属设置会覆盖全局设置：

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
`agents.list[].sandbox.{docker,browser,prune}.*` 会覆盖该 agent 的 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱范围解析为 `"shared"` 时会被忽略）。
</Note>

### 工具限制

过滤顺序如下：

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
    `tools.subagents.tools`，如适用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - 每一层都可以进一步限制工具，但不能把前面层级已拒绝的工具重新授予回来。
    - 如果设置了 `agents.list[].tools.sandbox.tools`，它会替换该 agent 的 `tools.sandbox.tools`。
    - 如果设置了 `agents.list[].tools.profile`，它会覆盖该 agent 的 `tools.profile`。
    - 提供商工具键既可以接受 `provider`（例如 `google-antigravity`），也可以接受 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    如果该链路中的任何显式允许列表让本次运行没有任何可调用工具，OpenClaw 会在把 prompt 提交给模型之前停止。这是有意设计的：配置了缺失工具的 agent，例如 `agents.list[].tools.allow: ["query_db"]`，应当在注册 `query_db` 的插件启用之前明确失败，而不是作为纯文本 agent 继续运行。
  </Accordion>
</AccordionGroup>

工具策略支持 `group:*` 简写，它们会展开为多个工具。完整列表见 [工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

每个 agent 的 elevated 覆盖项（`agents.list[].tools.elevated`）可以进一步限制特定 agent 的 elevated exec。详情见 [Elevated mode](/zh-CN/tools/elevated)。

---

## 从单 Agent 迁移

<Tabs>
  <Tab title="迁移前（单 Agent）">
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
  <Tab title="迁移后（多 Agent）">
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
旧版 `agent.*` 配置由 `openclaw doctor` 迁移；今后优先使用 `agents.defaults` + `agents.list`。
</Note>

---

## 工具限制示例

<Tabs>
  <Tab title="只读 Agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="启用 Shell 执行但禁用文件系统工具">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    此策略会禁用 OpenClaw 文件系统工具，但 `exec` 仍然是一个 shell，并且可以在所选主机或沙箱文件系统允许的任何位置写入文件。对于只读 Agent，请拒绝 `exec` 和 `process`，或将 shell 访问与沙箱文件系统控制结合使用，例如 `agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"`。
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

    此配置文件中的 `sessions_history` 仍会返回一个有界且已清理的回忆视图，而不是原始转录转储。助手回忆会在编辑/截断之前剥离思考标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）、降级的工具调用脚手架、泄漏的 ASCII/全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML。

  </Tab>
</Tabs>

---

## 常见陷阱："non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认值为 `"main"`），而不是 Agent ID。群组/渠道会话始终会获得自己的键，因此它们会被视为非主会话并进行沙箱隔离。如果你希望某个 Agent 永不沙箱隔离，请设置 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 测试

配置多 Agent 沙箱和工具后：

<Steps>
  <Step title="检查 Agent 解析">
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
    - 验证 Agent 无法使用被拒绝的工具。

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
  <Accordion title="尽管设置了 `mode: 'all'`，Agent 仍未被沙箱隔离">
    - 检查是否存在覆盖它的全局 `agents.defaults.sandbox.mode`。
    - Agent 专用配置优先级更高，因此请设置 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="尽管存在拒绝列表，工具仍然可用">
    - 检查工具过滤顺序：全局 → Agent → 沙箱 → 子 Agent。
    - 每一层只能进一步限制，不能重新授予权限。
    - 使用日志验证：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器未按 Agent 隔离">
    - 在 Agent 专用沙箱配置中设置 `scope: "agent"`。
    - 默认值是 `"session"`，即每个会话创建一个容器。

  </Accordion>
</AccordionGroup>

---

## 相关

- [提权模式](/zh-CN/tools/elevated)
- [多 Agent 路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱与工具策略与提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止了？”
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 完整沙箱参考（模式、范围、后端、镜像）
- [会话管理](/zh-CN/concepts/session)
