---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 按智能体划分的沙箱 + 工具限制、优先级和示例
title: 多智能体沙箱和工具
x-i18n:
    generated_at: "2026-04-26T09:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

在多智能体设置中，每个智能体都可以覆盖全局沙箱和工具策略。此页面介绍按智能体划分的配置、优先级规则和示例。

<CardGroup cols={3}>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing">
    后端和模式 —— 完整的沙箱参考。
  </Card>
  <Card title="沙箱 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated">
    调试“为什么这被阻止了？”
  </Card>
  <Card title="elevated 模式" href="/zh-CN/tools/elevated">
    面向受信任发送者的 elevated exec。
  </Card>
</CardGroup>

<Warning>
凭证按智能体隔离：每个智能体都会从自己的 `agentDir` 凭证存储 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 读取。凭证**不会**在智能体之间共享。绝不要在多个智能体之间复用 `agentDir`。如果你想共享凭证，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。
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
            "name": "个人助手",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "家庭机器人",
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
    - `family` 智能体：在 Docker 中运行（每个智能体一个容器），只能使用 `read` 工具。

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
  <Accordion title="示例 2b：全局 coding 配置 + 仅消息智能体">
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

    - 默认智能体获得 coding 工具。
    - `support` 智能体仅限消息工具（+ Slack 工具）。

  </Accordion>
  <Accordion title="示例 3：每个智能体使用不同的沙箱模式">
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
对于该智能体，`agents.list[].sandbox.{docker,browser,prune}.*` 会覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱作用域解析为 `"shared"` 时将被忽略）。
</Note>

### 工具限制

过滤顺序如下：

<Steps>
  <Step title="工具配置">
    `tools.profile` 或 `agents.list[].tools.profile`。
  </Step>
  <Step title="提供商工具配置">
    `tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="全局工具策略">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="提供商工具策略">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="智能体专属工具策略">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="智能体提供商策略">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙箱工具策略">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="子智能体工具策略">
    `tools.subagents.tools`，如果适用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="优先级规则">
    - 每一层都可以进一步限制工具，但不能重新授予前面层级已拒绝的工具。
    - 如果设置了 `agents.list[].tools.sandbox.tools`，则它会替换该智能体的 `tools.sandbox.tools`。
    - 如果设置了 `agents.list[].tools.profile`，则它会覆盖该智能体的 `tools.profile`。
    - 提供商工具键可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空 allowlist 行为">
    如果该链路中的任何显式 allowlist 最终导致此次运行没有可调用工具，OpenClaw 会在将提示提交给模型之前停止。这是有意设计的：如果某个智能体配置了缺失的工具，例如 `agents.list[].tools.allow: ["query_db"]`，那么在启用注册 `query_db` 的插件之前，它应当明确失败，而不是继续作为纯文本智能体运行。
  </Accordion>
</AccordionGroup>

工具策略支持 `group:*` 简写，可展开为多个工具。完整列表请参阅 [工具组](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

按智能体划分的 elevated 覆盖项（`agents.list[].tools.elevated`）可以进一步限制特定智能体的 elevated exec。详情请参阅 [elevated 模式](/zh-CN/tools/elevated)。

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
旧版 `agent.*` 配置可通过 `openclaw doctor` 迁移；今后请优先使用 `agents.defaults` + `agents.list`。
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

    此配置中的 `sessions_history` 仍会返回一个有界、已净化的回忆视图，而不是原始逐字稿转储。助手回忆会在重写/截断之前去除 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、降级后的工具调用脚手架、泄露的 ASCII / 全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML。

  </Tab>
</Tabs>

---

## 常见陷阱：“non-main”

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 是基于 `session.mainKey`（默认值为 `"main"`）而不是智能体 id。群组/渠道会话始终会获得各自的 key，因此它们会被视为 non-main 并进入沙箱。如果你希望某个智能体永远不使用沙箱，请设置 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 测试

在配置好多智能体沙箱和工具后：

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
    - 验证该智能体无法使用被拒绝的工具。

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
  <Accordion title="尽管设置了 `mode: 'all'`，智能体仍未进入沙箱">
    - 检查是否存在覆盖它的全局 `agents.defaults.sandbox.mode`。
    - 智能体专属配置优先级更高，因此请设置 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="尽管有 deny 列表，工具仍然可用">
    - 检查工具过滤顺序：全局 → 智能体 → 沙箱 → 子智能体。
    - 每一层都只能进一步限制，不能重新授予。
    - 通过日志验证：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器未按智能体隔离">
    - 在智能体专属沙箱配置中设置 `scope: "agent"`。
    - 默认值是 `"session"`，这会为每个会话创建一个容器。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [elevated 模式](/zh-CN/tools/elevated)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱 vs 工具策略 vs elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止了？”
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 完整沙箱参考（模式、作用域、后端、镜像）
- [会话管理](/zh-CN/concepts/session)
