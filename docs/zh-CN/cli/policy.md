---
read_when:
    - 你想根据编写的 `policy.jsonc` 检查 OpenClaw 设置
    - 你希望在 Doctor lint mode 中查看策略问题。
    - 你需要一个策略证明哈希，作为审计证据
summary: '`openclaw policy` 一致性检查的 CLI 参考'
title: 策略
x-i18n:
    generated_at: "2026-07-12T14:23:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由内置的 Policy 插件提供。它是在现有 OpenClaw 设置之上的企业级合规层，而不是第二套配置系统。你在 `policy.jsonc` 中编写要求；OpenClaw 将活动工作区作为证据进行观测；Policy 通过 `doctor --lint` 报告偏差。Policy 不会在请求时强制执行工具调用或重写运行时行为，也不会认证每个智能体的凭据存储，例如 `auth-profiles.json`。

Policy 会检查已配置的渠道、MCP 服务器、模型提供商、网络 SSRF 防护状态、入口/渠道访问权限、Gateway 网关暴露情况和节点命令防护状态、智能体工作区访问权限、沙箱防护状态、数据处理防护状态、密钥提供商/身份验证配置文件防护状态，以及受治理的工具元数据（`TOOLS.md`）。当工作区需要持久且可检查的声明时，请使用它，例如“不得启用 Telegram”或“受治理的工具必须声明风险和所有者元数据”。如果你只需要本地行为，不需要认证或偏差检测，使用普通配置即可。

## 快速开始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，插件也会保持启用，这样 Doctor 就能报告缺失的工件，而不是静默跳过检查。

请手动编写 `policy.jsonc`；它不会根据当前设置生成。每个顶层部分都是一个规则命名空间：只有其中存在具体规则时，检查才会运行（不支持的部分或键会以 `policy/policy-jsonc-invalid` 失败，而不是被静默忽略）。以下最小示例涵盖所有支持的部分：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "此工作区未批准使用 Telegram。",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

以下是从下方规则表中不易直接看出的跨领域注意事项：

- 在禁止非 local loopback 绑定时省略 `gateway.bind`，意味着你接受运行时默认值；要实现严格合规，请设置 `gateway.bind: "loopback"`。
- 对于只读智能体，请在适用的默认设置/智能体上将沙箱 `mode` 设置为 `all` 或 `non-main`，并将 `workspaceAccess` 设置为 `none` 或 `ro`。缺少沙箱模式或将其设置为 `off` 均不满足只读策略。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、`apply_patch`。配置中的工具拒绝组 `group:fs`（文件修改）和 `group:runtime`（shell/进程）可满足等效的防护要求。
- 仅当存在 `execApprovals` 规则时，Exec 审批检查才会读取实时的 `exec-approvals.json` 工件；缺失或无效的工件属于无法观测的证据，而不是人为生成的通过结果。
- 密钥和身份验证配置文件证据仅记录提供商/来源防护状态及 SecretRef 元数据，绝不记录原始值。Policy 不会读取或认证每个智能体的凭据存储，例如 `auth-profiles.json`。
- 数据处理证据仅反映配置级防护状态（脱敏模式、遥测采集开关、会话维护模式、会话记录索引设置）。它不会检查日志、遥测导出、会话记录或记忆文件，而干净的结果也无法证明其中不存在个人数据或密钥。

### Policy 规则参考

以下每条规则均为可选；只有规则存在时，检查才会运行。观测状态来自现有 OpenClaw 配置或工作区元数据。

#### 作用域覆盖

当特定智能体或渠道需要比顶层基线更严格的策略时，请使用 `scopes.<scopeName>`。作用域名称只是标签；匹配使用作用域内的选择器。覆盖规则采用叠加方式：全局规则仍会运行，而作用域规则可以针对同一证据添加自己的发现项。

| 选择器       | 支持的部分                                                                     | 使用场景                                             |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `agentIds`   | `tools`、`agents.workspace`、`sandbox`、`dataHandling.memory`、`execApprovals` | 一个或多个运行时智能体需要更严格的规则。             |
| `channelIds` | `ingress.channels`                                                             | 一个或多个渠道需要更严格的入口规则。                 |

如果某个 `agentIds` 条目不存在于 `agents.list[]` 中，OpenClaw 会根据该运行时智能体 ID 继承的全局/默认防护状态评估作用域规则，而不是跳过该规则。

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

如上所示，如果每个作用域治理不同的字段，同一个智能体可以出现在多个作用域中。对于同一智能体重复声明的作用域字段，其限制程度必须相同或更严格；限制更宽松的重复声明会被拒绝（允许列表必须是子集，拒绝列表必须是超集，必需的布尔值不可更改）。

容器防护规则（`sandbox.containers.*`）仅根据匹配智能体的沙箱后端能够提供的证据进行检查。如果某个后端无法观测你为其启用的规则，Policy 会报告 `policy/sandbox-container-posture-unobservable`，而不是将其判定为通过；请将容器规则限定到使用能够提供相应证据的后端的智能体组。

顶层的 `ingress.session.requireDmScope` 始终是全局规则；`session.dmScope` 不是可归因于渠道的证据，因此无法按 `channelIds` 限定作用域。

`policy.jsonc` 中的每个作用域都必须有效且可执行。

#### 渠道

| Policy 字段                          | 观测状态                                | 使用场景                                                      |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*` 提供商和启用状态           | 禁止配置来自 `telegram` 等提供商的渠道。                      |
| `channels.denyRules[].reason`        | 发现消息和修复提示的上下文              | 说明禁止该提供商的原因。                                      |

#### MCP 服务器

| Policy 字段         | 观测状态            | 使用场景                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID  | 要求每个已配置的 MCP 服务器都在允许列表中。                |
| `mcp.servers.deny`  | `mcp.servers.*` ID  | 禁止特定的已配置 MCP 服务器 ID。                           |

#### 模型提供商

| Policy 字段              | 观测状态                                         | 使用场景                                                                         |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 和所选模型引用           | 要求已配置的提供商和所选模型引用使用获批准的提供商。                             |
| `models.providers.deny`  | `models.providers.*` ID 和所选模型引用           | 按提供商 ID 禁止已配置的提供商和所选模型引用。                                   |

#### 网络

| Policy 字段                    | 观测状态                          | 使用场景                                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 专用网络 SSRF 绕过机制            | 设置为 `false`，要求专用网络访问保持禁用。                         |

#### 入口和渠道访问

| 策略字段                                  | 观测到的状态                                                   | 使用场景                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求使用经过审查的私信隔离范围。                                   |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和旧版渠道私信策略字段                   | 仅允许经过审查的私信渠道策略。                                     |
| `ingress.channels.denyOpenGroups`         | 渠道、账户和群组入口策略                                       | 拒绝已配置渠道和账户的开放群组入口。                               |
| `ingress.channels.requireMentionInGroups` | 渠道、账户、群组、服务器和嵌套提及门控配置                     | 当群组入口开放或受提及门控时，要求启用提及门控。                   |

#### Gateway 网关

| 策略字段                                | 观测到的状态                                   | 使用场景                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 设为 `false`，要求 Gateway 网关绑定到环回地址。                                      |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 的 Gateway 网关安全态势 | 设为 `false`，拒绝通过 Tailscale Funnel 暴露。                                       |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 设为 `true`，拒绝禁用 Gateway 网关身份验证。                                         |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 设为 `true`，要求显式配置身份验证速率限制。                                          |
| `gateway.controlUi.allowInsecure`       | Control UI 的不安全身份验证/设备/来源开关      | 设为 `false`，拒绝启用不安全的 Control UI 暴露开关。                                 |
| `gateway.remote.allow`                  | 远程 Gateway 网关模式/配置                     | 设为 `false`，拒绝远程 Gateway 网关模式。                                            |
| `gateway.http.denyEndpoints`            | Gateway 网关 HTTP API 端点                     | 拒绝 `chatCompletions` 或 `responses` 等端点 ID。                                    |
| `gateway.http.requireUrlAllowlists`     | Gateway 网关 HTTP URL 获取输入                 | 设为 `true`，要求 URL 获取输入使用 URL 允许列表。                                    |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 配置中拒绝 `system.run` 等精确的节点命令 ID。                        |

`gateway.nodes.denyCommands` 是一条精确且区分大小写的拒绝超集规则。
当策略必须证明 OpenClaw 配置已显式拒绝特权节点命令时，请使用此规则。
如果某个部署有意允许特权节点命令，应在审查后更新 `policy.jsonc`，而不是
仅依赖 `gateway.nodes.allowCommands`。

#### Agent 工作区

| 策略字段                         | 观测到的状态                                                                          | 使用场景                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 仅允许 `none` 或 `ro` 等经过审查的沙箱工作区访问值。                                     |
| `agents.workspace.denyTools`     | 全局和按智能体配置的工具拒绝配置                                                      | 要求拒绝变更工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。                   |

#### 沙箱安全态势

| 策略字段                                              | 观测到的状态                                            | 使用场景                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和按智能体配置的模式     | 仅允许 `all` 或 `non-main` 等经过审查的沙箱模式。              |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和按智能体配置的后端  | 仅允许 `docker` 等经过审查的沙箱后端。                         |
| `sandbox.containers.denyHostNetwork`                  | 基于容器的沙箱/浏览器网络模式                           | 拒绝主机网络模式。                                             |
| `sandbox.containers.denyContainerNamespaceJoin`       | 基于容器的沙箱/浏览器网络模式                           | 拒绝加入其他容器的网络命名空间。                               |
| `sandbox.containers.requireReadOnlyMounts`            | 基于容器的沙箱/浏览器挂载模式                           | 要求以只读方式挂载。                                           |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 基于容器的沙箱/浏览器挂载目标                           | 拒绝挂载容器运行时套接字。                                     |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全配置文件的安全态势                              | 拒绝不受限的容器安全配置文件。                                 |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱浏览器 CDP 来源范围                                 | 要求浏览器 CDP 暴露声明来源范围。                              |

策略将缺失的 `sandbox.mode` 视为其隐式默认值 `off`，因此
`sandbox.requireMode` 会将全新或未配置的沙箱报告为不在
`["all"]` 等允许列表中。

#### 数据处理

| 策略字段                                            | 观测状态                                                                             | 使用场景                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 设为 `true` 以拒绝 `logging.redactSensitive: "off"`。                 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 设为 `true` 以拒绝遥测内容捕获。                                      |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 设为 `true` 以要求有效会话维护模式为 `enforce`。                       |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 设为 `true` 以拒绝将会话转录索引到记忆中。                            |

#### 密钥

| 策略字段                          | 观测状态                                               | 使用场景                                                               |
| --------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 配置 SecretRef 和 `secrets.providers.*` 声明           | 设为 `true` 以要求 SecretRef 指向已声明的提供商。                      |
| `secrets.denySources`             | 密钥提供商来源和 SecretRef 来源                        | 拒绝 `exec`、`file` 或其他已配置来源名称等来源。                       |
| `secrets.allowInsecureProviders`  | 不安全的密钥提供商安全态势标志                         | 设为 `false` 以拒绝选择启用不安全态势的提供商。                        |

#### Exec 审批

Exec 审批检查会读取运行时 `exec-approvals.json` 工件：
默认路径为 `~/.openclaw/exec-approvals.json`，设置 `OPENCLAW_STATE_DIR` 时则为
`$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*` 下的安全态势规则
要求提供可读取的工件证据；工件缺失或无效时会报告为
无法观测的证据，而不是尽力而为地判定通过。工件可读取后，省略的
字段会继承运行时默认值：缺失的 `defaults.security` 为 `full`，
缺失的智能体安全设置会继承该默认值。证据包括 `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、可选的 `argPattern`、有效的
`autoAllowSkills` 安全态势以及条目来源，但绝不包括套接字路径/令牌、
`commandText`、`lastUsedCommand`、解析后的路径或时间戳。

| 策略字段                                    | 观测状态                                                                               | 使用场景                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 当前运行时 `exec-approvals.json` 路径                                                  | 设为 `true` 以要求审批工件存在且可解析。                                                 |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，默认值为 `full`                                                   | 仅允许已批准的默认审批安全模式。                                                         |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，继承默认值                                                        | 仅允许已批准的每智能体有效审批安全模式。                                                 |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，继承运行时默认值             | 设为 `false`，以要求使用严格的手动允许列表，不允许隐式 Skills CLI 审批。                 |
| `execApprovals.agents.allowlist.expected`   | 汇总的 `agents.*.allowlist[]` 模式和可选的 argPattern 条目                             | 要求审批允许列表与经过审查的模式集匹配。                                                 |

示例：要求审批工件存在，拒绝宽松的默认设置，并且仅允许
所选智能体采用经过审查的 Exec 审批安全态势。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // 安全模式："deny"、"allowlist" 或 "full"。
      // 此默认值仅允许严格锁定的拒绝策略。
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // 选定的智能体可以使用经过审核的允许列表策略，但不能使用 "full"。
          "allowSecurity": ["allowlist"],
          // false 表示技能 CLI 必须出现在经过审核的允许列表中，而不是
          // 由 autoAllowSkills 隐式批准。
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // 简单条目：精确匹配经过审核的可执行文件模式，不含 argPattern。
              "travel-hub",
              // 受约束条目：模式以及经过审核的参数正则表达式。
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### 身份验证配置文件

| 策略字段                        | 观测状态                                     | 适用场景                                                                                           |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供商和模式元数据         | 要求配置中的身份验证配置文件包含 `provider` 和 `mode` 等元数据键。                                 |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 仅允许受支持的身份验证配置文件模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。                 |

#### 工具元数据

| 策略字段                | 观测状态                         | 适用场景                                                                                       |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 声明         | 要求受治理的工具声明 `risk`、`sensitivity` 或 `owner` 等元数据键。                              |

#### 工具策略

| 策略字段                        | 观测状态                                                    | 适用场景                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`            | 仅允许 `minimal`、`messaging` 或 `coding` 等工具配置文件 ID。                                            |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和按智能体设置的 `tools.fs` 覆盖项 | 设为 `true`，要求文件系统工具采用仅限工作区的策略。                                                      |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和按智能体设置的 Exec 安全模式        | 仅允许 `deny` 或 `allowlist` 等 Exec 安全模式。                                                          |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和按智能体设置的 Exec 询问模式             | 要求采用 `always` 等审批策略。                                                                           |
| `tools.exec.allowHosts`         | `tools.exec.host` 和按智能体设置的 Exec 主机路由            | 仅允许 `sandbox` 等 Exec 主机路由模式。                                                                  |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和按智能体设置的提升权限策略       | 设为 `false`，要求提升权限的工具模式保持禁用。                                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和按智能体设置的 `tools.alsoAllow`        | 要求 `alsoAllow` 条目完全匹配，并报告缺失或意外增加的工具授权。                                         |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                  | 要求配置的工具拒绝列表包含工具 ID 或工具组，例如 `group:runtime` 和 `group:fs`。                         |

## 运行检查

编写期间运行仅限策略的检查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 仅运行策略检查集，并生成证据、发现项和证明哈希。
启用 Policy 插件后，相同的发现项也会出现在
`openclaw doctor --lint` 中。

将操作员策略文件与编写的基线进行比较：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 根据策略文件语法检查策略文件语法；它不会
检查运行时状态、证据、凭据或机密。它使用治理作用域覆盖项的相同
规则元数据：允许列表必须保持相同或收窄，拒绝列表必须保持相同或扩大，
必需的布尔值必须保持其值，有序字符串只能向所配置顺序中更严格的一端
移动，而精确列表必须匹配。基线可以是组织编写的策略；被检查的策略可以
添加更严格的值或额外规则。当顶层被检查规则具有同等或更严格的限制时，
它可以满足作用域基线规则。文件之间的作用域名称无需匹配；比较以选择器
（`agentIds`/`channelIds`）和字段为键。

无差异比较（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

无发现项的 `policy check --json` 输出包含操作员或监督程序可以记录的
稳定哈希：

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## 配置策略

策略配置位于 `plugins.entries.policy.config` 下。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| 设置                      | 用途                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也启用策略检查。                     |
| `workspaceRepairs`        | 允许 `doctor --fix` 编辑由策略管理的工作区设置。                   |
| `expectedHash`            | 已批准策略工件的可选哈希锁。                                       |
| `expectedAttestationHash` | 最近一次通过的策略检查的可选哈希锁。                               |
| `path`                    | 策略工件相对于工作区的位置。                                       |

将 `plugins.entries.policy.config.enabled` 设为 `false`，可在保留插件安装的
同时禁用工作区的策略检查。

## 接受策略状态

JSON 输出示例：

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` 标识编写的规则工件。`evidence`
记录检查所使用的 OpenClaw 观测状态，而
`workspace.hash` 标识该证据载荷。`findingsHash` 标识
确切的发现项集合。`checkedAt` 记录检查的运行时间。
`attestationHash` 标识稳定声明（策略哈希、证据哈希、
发现项哈希以及通过/未通过状态），并有意排除 `checkedAt`，
因此相同的策略状态始终生成相同的证明哈希。这四个值共同构成
一次策略检查的审计元组。

如果 Gateway 网关或监督程序使用策略来阻止、批准运行时操作或为其添加注释，
则应记录最近一次通过的检查中的证明哈希。`checkedAt` 会保留在 JSON 输出中
供审计日志使用，但不属于稳定哈希的一部分。

接受策略状态的生命周期：

1. 编写或审核 `policy.jsonc`。
2. 运行 `openclaw policy check --json`。
3. 如果检查通过，将 `attestation.policy.hash` 记录为 `expectedHash`。
4. 将 `attestation.attestationHash` 记录为 `expectedAttestationHash`。
5. 在 CI 或发布门禁中重新运行 `openclaw doctor --lint`。

如果策略规则是有意更改的，请基于一次干净的检查更新两个已接受的哈希。如果仅工作区设置发生变化（策略保持不变），通常只有 `expectedAttestationHash` 会变化。

启用或升级 `agents.workspace` 规则会将 `agentWorkspace` 证据添加到工作区哈希和证明哈希中；启用后请审查新证据并刷新已接受的证明哈希。启用或升级工具安全态势规则也会以相同方式添加 `toolPosture` 证据。

`openclaw policy watch` 会重新运行检查，并在当前证据不再匹配 `expectedAttestationHash` 时报告：

```bash
openclaw policy watch --json
```

在需要执行一次漂移评估的 CI 或脚本中使用 `--once`。如果不使用 `--once`，默认每两秒轮询一次；使用 `--interval-ms` 可更改间隔。

## 检查结果

| 检查 ID                                                 | 检查结果                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 策略已启用，但缺少 `policy.jsonc`。                                               |
| `policy/policy-jsonc-invalid`                            | 无法解析策略，或策略包含格式错误的规则条目。                                      |
| `policy/policy-hash-mismatch`                            | 策略与配置的 `expectedHash` 不匹配。                                              |
| `policy/attestation-hash-mismatch`                       | 当前策略证据不再匹配已接受的证明。                                                |
| `policy/policy-conformance-invalid`                      | 基准策略文件或受检查的策略文件包含无效的比较语法。                                |
| `policy/policy-conformance-missing`                      | 受检查的策略文件缺少基准策略文件所要求的规则。                                    |
| `policy/policy-conformance-weaker`                       | 受检查的策略文件中的值弱于基准策略文件中的值。                                    |
| `policy/channels-denied-provider`                        | 已启用的渠道匹配渠道拒绝规则。                                                    |
| `policy/mcp-denied-server`                               | 已配置的 MCP 服务器被策略拒绝。                                                   |
| `policy/mcp-unapproved-server`                           | 已配置的 MCP 服务器不在允许列表中。                                               |
| `policy/models-denied-provider`                          | 已配置的模型提供商或模型引用使用了被拒绝的提供商。                                |
| `policy/models-unapproved-provider`                      | 已配置的模型提供商或模型引用不在允许列表中。                                      |
| `policy/network-private-access-enabled`                  | 策略拒绝私有网络 SSRF 逃逸通道时，该通道仍处于启用状态。                          |
| `policy/ingress-dm-policy-unapproved`                    | 渠道私信策略不在策略允许列表中。                                                  |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 与策略要求的私信隔离范围不匹配。                                |
| `policy/ingress-open-groups-denied`                      | 策略拒绝开放群组入口时，某个渠道群组策略仍为 `open`。                             |
| `policy/ingress-group-mention-required`                  | 策略要求提及门控时，某个渠道或群组条目却禁用了该门控。                            |
| `policy/gateway-non-loopback-bind`                       | 策略拒绝非回环暴露时，Gateway 网关绑定态势仍允许非回环暴露。                      |
| `policy/gateway-auth-disabled`                           | 策略要求身份验证时，Gateway 网关身份验证却被禁用。                                |
| `policy/gateway-rate-limit-missing`                      | 策略要求明确指定时，Gateway 网关身份验证速率限制态势未显式配置。                  |
| `policy/gateway-control-ui-insecure`                     | Gateway 网关 Control UI 的不安全暴露开关已启用。                                  |
| `policy/gateway-tailscale-funnel`                        | 策略拒绝 Gateway 网关 Tailscale Funnel 暴露时，该暴露仍处于启用状态。             |
| `policy/gateway-remote-enabled`                          | 策略拒绝远程模式时，Gateway 网关远程模式仍处于活动状态。                          |
| `policy/gateway-http-endpoint-enabled`                   | 策略拒绝某个 Gateway 网关 HTTP API 端点时，该端点仍处于启用状态。                 |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway 网关 HTTP URL 获取输入缺少必需的 URL 允许列表。                           |
| `policy/gateway-node-command-denied`                     | 被策略拒绝的节点命令未被 OpenClaw 配置拒绝。                                      |
| `policy/agents-workspace-access-denied`                  | Agent 沙箱模式或工作区访问权限不在策略允许列表中。                                |
| `policy/agents-tool-not-denied`                          | 某个 Agent 或默认配置未拒绝策略要求拒绝的工具。                                   |
| `policy/tools-profile-unapproved`                        | 已配置的全局或按 Agent 配置的工具配置文件不在允许列表中。                         |
| `policy/tools-fs-workspace-only-required`                | 文件系统工具未配置为仅限工作区的路径态势。                                        |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在策略允许列表中。                                                 |
| `policy/tools-exec-ask-unapproved`                       | Exec 询问模式不在策略允许列表中。                                                 |
| `policy/tools-exec-host-unapproved`                      | Exec 主机路由不在策略允许列表中。                                                 |
| `policy/tools-elevated-enabled`                          | 策略拒绝提升权限的工具模式时，该模式仍处于启用状态。                              |
| `policy/tools-also-allow-missing`                        | 已配置的 `alsoAllow` 列表缺少策略要求的条目。                                     |
| `policy/tools-also-allow-unexpected`                     | 已配置的 `alsoAllow` 列表包含策略未预期的条目。                                   |
| `policy/tools-required-deny-missing`                     | 全局或按 Agent 配置的工具拒绝列表未包含必需拒绝的工具。                           |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在策略允许列表中。                                                      |
| `policy/sandbox-backend-unapproved`                      | 沙箱后端不在策略允许列表中。                                                      |
| `policy/sandbox-container-posture-unobservable`          | 为无法观测容器态势的后端启用了容器态势规则。                                      |
| `policy/sandbox-container-host-network-denied`           | 容器支持的沙箱或浏览器使用主机网络模式。                                          |
| `policy/sandbox-container-namespace-join-denied`         | 容器支持的沙箱或浏览器加入了另一个容器的命名空间。                                |
| `policy/sandbox-container-mount-mode-required`           | 容器支持的沙箱或浏览器挂载不是只读的。                                            |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支持的沙箱或浏览器挂载暴露了容器运行时套接字。                                |
| `policy/sandbox-container-unconfined-profile`            | 策略拒绝无限制配置文件时，容器沙箱配置文件仍处于无限制状态。                      |
| `policy/sandbox-browser-cdp-source-range-missing`        | 策略要求沙箱浏览器 CDP 来源范围时，该范围缺失。                                   |
| `policy/data-handling-redaction-disabled`                | 策略要求对敏感日志进行脱敏时，脱敏却被禁用。                                      |
| `policy/data-handling-telemetry-content-capture`         | 策略拒绝遥测内容捕获时，该功能仍处于启用状态。                                    |
| `policy/data-handling-session-retention-not-enforced`    | 策略要求执行会话保留维护时，该要求未得到强制执行。                                |
| `policy/data-handling-session-transcript-memory-enabled` | 策略拒绝会话记录记忆索引时，该功能仍处于启用状态。                                |
| `policy/secrets-unmanaged-provider`                      | 配置中的 SecretRef 引用了未在 `secrets.providers` 下声明的提供商。                |
| `policy/secrets-denied-provider-source`                  | 配置中的机密提供商或 SecretRef 使用了被策略拒绝的来源。                           |
| `policy/secrets-insecure-provider`                       | 策略拒绝不安全态势时，机密提供商仍选择启用该态势。                                |
| `policy/auth-profile-invalid-metadata`                   | 配置中的身份验证配置文件缺少有效的提供商或模式元数据。                            |
| `policy/auth-profile-unapproved-mode`                    | 配置中的身份验证配置文件模式不在策略允许列表中。                                  |
| `policy/exec-approvals-missing`                          | 策略要求提供 `exec-approvals.json`，但缺少该工件。                                |
| `policy/exec-approvals-invalid`                          | 无法解析已配置的 Exec 审批工件。                                                  |
| `policy/exec-approvals-default-security-unapproved`      | Exec 审批默认值使用了不在策略允许列表中的安全模式。                               |
| `policy/exec-approvals-agent-security-unapproved`        | 某个按 Agent 配置的有效 Exec 审批安全模式不在允许列表中。                         |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 策略拒绝时，某个 Exec 审批 Agent 仍隐式自动允许 Skills CLI。                      |
| `policy/exec-approvals-allowlist-missing`                | 审批允许列表缺少策略要求的模式。                                                  |
| `policy/exec-approvals-allowlist-unexpected`             | 审批允许列表包含策略未预期的模式。                                                |
| `policy/tools-missing-risk-level`                        | 受治理的工具声明缺少风险元数据。                                                  |
| `policy/tools-unknown-risk-level`                        | 受治理的工具声明使用了未知的风险值。                                              |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具声明缺少敏感度元数据。                                                |
| `policy/tools-missing-owner`                             | 受治理的工具声明缺少所有者元数据。                                                |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具声明使用了未知的敏感度值。                                            |

检查结果可以同时包含 `target`（观测到的不合规工作区对象）和 `requirement`（导致该检查结果的已编写规则）。目前两者都是 `oc://` 地址字符串，但字段名称描述的是策略角色，而不是地址格式。

检查结果示例：

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "渠道 'telegram' 使用了被拒绝的提供商 'telegram'。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "此工作区未批准使用 Telegram。"
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md 工具 'deploy' 没有明确的风险分类。",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP 服务器 'remote' 不在策略允许列表中。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "模型引用 'anthropic/claude-sonnet-4.7' 使用了未经批准的提供商 'anthropic'。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "网络设置 'browser-private-network' 允许访问专用网络。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway 网关绑定设置 'gateway-bind' 允许非环回暴露。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "策略拒绝了 Gateway 网关节点命令 'system.run'，但 OpenClaw 配置未拒绝该命令。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "将 'system.run' 添加到 gateway.nodes.denyCommands，或在审查后更新策略。"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "策略不允许 agents.defaults 沙箱 workspaceAccess 使用 'rw'。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修复

`doctor --lint` 和 `policy check` 均为只读操作。

仅当显式启用 `workspaceRepairs` 时，`doctor --fix` 才会编辑由策略管理的工作区设置；否则，检查会报告其将要修复的内容，并保持设置不变。

在此版本中，修复功能可以禁用被 `channels.denyRules` 拒绝的渠道，并应用下列自动收紧修复。请仅在审查策略文件后启用 `workspaceRepairs`，因为有效规则可能会更改工作区配置：

- 当全局策略禁止提升权限的工具时，设置 `tools.elevated.enabled=false`
- 当策略要求拒绝这些工具时，将缺失的必拒工具 ID 添加到 `tools.deny` 或
  `agents.list[].tools.deny`
- 将不安全的 `gateway.controlUi.*` 开关设置为 `false`
- 当策略拒绝远程 Gateway 网关模式时，设置 `gateway.mode=local`
- 当策略拒绝 Gateway 网关 HTTP API 端点时，将报告的
  `gateway.http.endpoints.*.enabled` 路径设置为 `false`
- 当策略拒绝开放群组入口时，将报告的渠道入口 `groupPolicy` 路径设置为
  `allowlist`
- 当策略要求群组提及时，将报告的渠道入口 `requireMention` 路径设置为
  `true`
- 当策略要求对日志中的敏感信息进行脱敏时，设置
  `logging.redactSensitive=tools`
- 当策略拒绝捕获遥测内容时，设置 `diagnostics.otel.captureContent=false`；
  对于对象形式的遥测捕获设置，则设置
  `diagnostics.otel.captureContent.enabled=false`

限定范围的提升权限工具修复仅执行检测。如果发现项报告的是共享日志或遥测配置，限定范围的数据处理修复也会被跳过，因为更改共享设置会影响限定范围策略目标之外的对象。

当发现项报告继承的根级 `tools.deny` 时，限定范围的必拒修复会被跳过，因为将所需工具添加到根配置会影响限定范围策略目标之外的对象。智能体本地的必拒修复可以更新报告的 `agents.list[].tools.deny` 路径。

当发现项报告继承的 `channels.defaults.*` 时，限定范围的渠道入口修复会被跳过，因为更改共享渠道默认值会影响限定范围策略目标之外的对象。Gateway 网关 HTTP URL 获取允许列表发现项仍需手动处理，因为自动修复无法选择正确的端点 URL 允许列表值。

Gateway 网关绑定和节点命令发现项仍需审查。当
`policy/gateway-non-loopback-bind` 或 `policy/gateway-node-command-denied`
可以映射到配置路径时，`doctor --fix` 会将建议的 `gateway.bind` 或
`gateway.nodes.denyCommands` 更改报告为已跳过的预览指导。它不会应用更改；在操作员审查并更新配置或策略之前，该发现项不会被计为已修复。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## 退出代码

| 命令             | `0`                                                    | `1`                                                        | `2`                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------- | -------------------- |
| `policy check`   | 没有达到阈值的发现项。                                 | 一个或多个发现项达到阈值。                                 | 参数或运行时失败。   |
| `policy compare` | 策略文件的严格程度不低于基准。                         | 策略文件无效、缺失，或比基准规则更宽松。                   | 参数或运行时失败。   |
| `policy watch`   | 没有发现项，且已接受的哈希为最新状态。                 | 存在发现项，或已接受的证明已过期。                         | 参数或运行时失败。   |

## 相关内容

- [Doctor lint mode](/zh-CN/cli/doctor#lint-mode)
- [路径 CLI](/zh-CN/cli/path)
