---
read_when:
    - 你想根据编写好的 policy.jsonc 检查 OpenClaw 设置
    - 你希望在 Doctor lint 中获得策略发现项
    - 你需要一个用于审计证据的策略证明哈希
summary: 用于 `openclaw policy` 一致性检查的 CLI 参考
title: 策略
x-i18n:
    generated_at: "2026-07-05T17:42:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12f20bc0cf4f048ee70bba55540746297cb394a258138f2794dce1a1f6a6d4a2
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由内置 Policy 插件提供。它是在现有 OpenClaw 设置之上的企业级合规层，而不是第二套配置系统。你在 `policy.jsonc` 中编写要求；OpenClaw 将活动工作区作为证据进行观察；policy 通过 `doctor --lint` 报告漂移。policy 不会在请求时强制执行工具调用或改写运行时行为，也不会证明每个 Agent 的凭据存储，例如 `auth-profiles.json`。

Policy 会检查已配置的渠道、MCP 服务器、模型提供商、网络 SSRF 态势、入口/渠道访问、Gateway 网关暴露和节点命令态势、Agent 工作区访问、沙箱态势、数据处理态势、secret 提供商/认证配置文件态势，以及受管工具元数据（`TOOLS.md`）。当工作区需要持久、可检查的声明时使用它，例如 “Telegram 不得启用” 或 “受管工具必须声明风险和所有者元数据。” 如果你只需要本地行为，不需要证明或漂移检测，普通配置就足够了。

## 快速开始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，该插件也会保持启用，因此 Doctor 可以报告缺失的产物，而不是静默跳过检查。

手动编写 `policy.jsonc`；它不会从当前设置生成。每个顶级部分都是一个规则命名空间：只有当其下存在具体规则时，检查才会运行（不支持的部分或键会以 `policy/policy-jsonc-invalid` 失败，而不是被静默忽略）。覆盖每个受支持部分的最小示例：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
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

以下是从下面规则表中不易看出的横切说明：

- 省略 `gateway.bind` 同时禁止非 loopback 绑定，意味着你接受运行时默认值；设置 `gateway.bind: "loopback"` 以实现严格合规。
- 对于只读 Agent，请在适用的默认值/Agent 上将沙箱 `mode` 设置为 `all` 或 `non-main`，并将 `workspaceAccess` 设置为 `none` 或 `ro`。缺失或 `off` 沙箱模式不满足只读 policy。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、`apply_patch`。配置工具拒绝组 `group:fs`（文件变更）和 `group:runtime`（shell/进程）满足等效态势。
- Exec 审批检查只在存在 `execApprovals` 规则时读取实时 `exec-approvals.json` 产物；缺失或无效的产物是不可观察证据，而不是合成通过。
- Secret 和认证配置文件证据只记录提供商/来源态势和 SecretRef 元数据，绝不记录原始值。policy 不会读取或证明每个 Agent 的凭据存储，例如 `auth-profiles.json`。
- 数据处理证据仅为配置级态势（脱敏模式、遥测捕获开关、会话维护模式、转录索引设置）。它不会检查日志、遥测导出、转录或记忆文件，干净结果也不能证明其中不存在个人数据或 secret。

### Policy 规则参考

下面每条规则都是可选的；只有当规则存在时，检查才会运行。观察到的状态是现有 OpenClaw 配置或工作区元数据。

#### 作用域覆盖

当特定 Agent 或渠道需要比顶级基线更严格的 policy 时，使用 `scopes.<scopeName>`。作用域名称只是标签；匹配使用作用域内的选择器。覆盖是增量式的：全局规则仍会运行，作用域规则可以针对同一证据添加自己的发现。

| 选择器 | 受支持部分 | 使用场景 |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds` | `tools`、`agents.workspace`、`sandbox`、`dataHandling.memory`、`execApprovals` | 一个或多个运行时 Agent 需要更严格的规则。 |
| `channelIds` | `ingress.channels` | 一个或多个渠道需要更严格的入口规则。 |

如果 `agentIds` 条目不存在于 `agents.list[]` 中，OpenClaw 会改为针对该运行时 Agent ID 的继承全局/默认态势评估作用域规则，而不是跳过它。

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

同一个 Agent 可以出现在多个作用域中，前提是每个作用域治理不同字段，如上所示。同一 Agent 的重复作用域字段必须同等或更严格；较弱的重复声明会被拒绝（允许列表是子集，拒绝列表是超集，必需布尔值固定）。

容器态势规则（`sandbox.containers.*`）只会根据匹配 Agent 的沙箱后端可暴露的证据进行检查。如果某个后端无法观察你为它启用的规则，policy 会报告 `policy/sandbox-container-posture-unobservable`，而不是通过；请将作用域容器规则限定到使用能暴露这些规则的后端的 Agent 组。

顶级 `ingress.session.requireDmScope` 保持全局；`session.dmScope` 不是可归因到渠道的证据，因此无法通过 `channelIds` 设定作用域。

`policy.jsonc` 中存在的每个作用域都必须有效且可执行。

#### 渠道

| Policy 字段 | 观察到的状态 | 使用场景 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 提供商和启用状态 | 拒绝来自某个提供商的已配置渠道，例如 `telegram`。 |
| `channels.denyRules[].reason` | 发现消息和修复提示上下文 | 解释为什么拒绝该提供商。 |

#### MCP 服务器

| Policy 字段 | 观察到的状态 | 使用场景 |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 要求每个已配置 MCP 服务器都在允许列表中。 |
| `mcp.servers.deny` | `mcp.servers.*` ID | 拒绝特定已配置 MCP 服务器 ID。 |

#### 模型提供商

| Policy 字段 | 观察到的状态 | 使用场景 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 和所选模型引用 | 要求已配置提供商和所选模型引用使用已批准的提供商。 |
| `models.providers.deny` | `models.providers.*` ID 和所选模型引用 | 按提供商 ID 拒绝已配置提供商和所选模型引用。 |

#### 网络

| Policy 字段 | 观察到的状态 | 使用场景 |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有网络 SSRF 逃逸开关 | 设置为 `false`，要求私有网络访问保持禁用。 |

#### 入口和渠道访问

| 策略字段                              | 观测状态                                                 | 使用场景                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求经过审查的私信隔离作用域。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和旧版渠道私信策略字段      | 只允许经过审查的私信渠道策略。               |
| `ingress.channels.denyOpenGroups`         | 渠道、账号和群组入口策略                     | 拒绝已配置渠道和账号的开放群组入口。      |
| `ingress.channels.requireMentionInGroups` | 渠道、账号、群组、公会和嵌套提及门控配置 | 当群组入口开放或受提及门控时，要求提及门控。 |

#### Gateway 网关

| 策略字段                            | 观测状态                                 | 使用场景                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 设为 `false` 以要求 Gateway 网关绑定到 loopback。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 网关态势         | 设为 `false` 以拒绝 Tailscale Funnel 暴露。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 设为 `true` 以拒绝禁用 Gateway 网关认证。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 设为 `true` 以要求显式认证速率限制配置。                            |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全认证/设备/来源开关 | 设为 `false` 以拒绝不安全的 Control UI 暴露开关。                         |
| `gateway.remote.allow`                  | 远程 Gateway 网关模式/配置                     | 设为 `false` 以拒绝远程 Gateway 网关模式。                                          |
| `gateway.http.denyEndpoints`            | Gateway 网关 HTTP API 端点                     | 拒绝端点 ID，例如 `chatCompletions` 或 `responses`。                          |
| `gateway.http.requireUrlAllowlists`     | Gateway 网关 HTTP URL 获取输入                  | 设为 `true` 以要求 URL 获取输入使用 URL 允许列表。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 配置中拒绝精确节点命令 ID，例如 `system.run`。 |

`gateway.nodes.denyCommands` 是一条精确、区分大小写的拒绝超集规则。
当策略必须证明特权节点命令已被 OpenClaw 配置显式
拒绝时使用它。有意允许某个特权
节点命令的部署，应在审查后更新 `policy.jsonc`，而不是只依赖
`gateway.nodes.allowCommands`。

#### Agent 工作区

| 策略字段                     | 观测状态                                                                        | 使用场景                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 只允许沙箱工作区访问值，例如 `none` 或 `ro`。                       |
| `agents.workspace.denyTools`     | 全局和每 Agent 工具拒绝配置                                                 | 要求拒绝变更工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。 |

#### 沙箱态势

| 策略字段                                          | 观测状态                                          | 使用场景                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和每 Agent 模式       | 只允许经过审查的沙箱模式，例如 `all` 或 `non-main`。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和每 Agent 后端 | 只允许经过审查的沙箱后端，例如 `docker`。         |
| `sandbox.containers.denyHostNetwork`                  | 容器支持的沙箱/浏览器网络模式           | 拒绝主机网络模式。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支持的沙箱/浏览器网络模式           | 拒绝加入另一个容器网络命名空间。              |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支持的沙箱/浏览器挂载模式             | 要求挂载为只读。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支持的沙箱/浏览器挂载目标          | 拒绝容器运行时套接字挂载。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全配置文件态势                      | 拒绝无限制的容器安全配置文件。                   |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱浏览器 CDP 来源范围                        | 要求浏览器 CDP 暴露声明来源范围。        |

策略会将缺失的 `sandbox.mode` 视为其隐式默认值 `off`，因此
`sandbox.requireMode` 会把全新或未配置的沙箱报告为不在
允许列表（例如 `["all"]`）内。

#### 数据处理

| 策略字段                                        | 观测状态                                                                       | 使用场景                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 设为 `true` 以拒绝 `logging.redactSensitive: "off"`。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 设为 `true` 以拒绝遥测内容捕获。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 设为 `true` 以要求有效会话维护模式为 `enforce`。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 设为 `true` 以拒绝将会话转录索引到记忆中。       |

#### 密钥

| 策略字段                      | 观测状态                                           | 使用场景                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 配置 SecretRefs 和 `secrets.providers.*` 声明 | 设为 `true` 以要求 SecretRefs 指向已声明的提供商。     |
| `secrets.denySources`             | 密钥提供商来源和 SecretRef 来源            | 拒绝来源，例如 `exec`、`file` 或另一个已配置的来源名称。 |
| `secrets.allowInsecureProviders`  | 不安全密钥提供商态势标志                   | 设为 `false` 以拒绝选择不安全态势的提供商。      |

#### Exec 审批

Exec 审批检查会读取运行时 `exec-approvals.json` 构件：
默认是 `~/.openclaw/exec-approvals.json`，或者当设置了
`OPENCLAW_STATE_DIR` 时为 `$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*` 下的态势规则
要求可读取的构件证据；缺失或无效的构件会报告为
不可观测证据，而不是尽力通过。可读取后，省略的
字段会继承运行时默认值：缺失的 `defaults.security` 为 `full`，
缺失的 Agent 安全设置会继承该默认值。证据包括 `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、可选的 `argPattern`、有效的
`autoAllowSkills` 态势和条目来源；绝不包括套接字路径/token、
`commandText`、`lastUsedCommand`、解析后的路径或时间戳。

| 策略字段                                | 观测状态                                                                         | 使用场景                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 活跃运行时 `exec-approvals.json` 路径                                              | 设为 `true` 以要求审批构件存在并可解析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，默认值为 `full`                                              | 只允许已批准的默认审批安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，继承默认值                                               | 只允许已批准的每 Agent 有效审批安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，继承运行时默认值 | 设为 `false` 以要求严格的手动允许列表，不使用隐式 Skills CLI 审批。 |
| `execApprovals.agents.allowlist.expected`   | 汇总的 `agents.*.allowlist[]` pattern 和可选 argPattern 条目               | 要求审批允许列表匹配经过审查的模式集合。                      |

示例：要求审批构件、拒绝宽松默认值，并只允许
所选 Agent 使用经过审查的 Exec 审批态势。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

#### 凭证配置档

| 策略字段                        | 观测到的状态                                 | 使用场景                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供商和模式元数据         | 要求配置凭证配置档上包含 `provider` 和 `mode` 等元数据键。                                 |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 仅允许受支持的凭证配置档模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。              |

#### 工具元数据

| 策略字段                | 观测到的状态                   | 使用场景                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 声明         | 要求受治理工具声明 `risk`、`sensitivity` 或 `owner` 等元数据键。                           |

#### 工具姿态

| 策略字段                        | 观测到的状态                                              | 使用场景                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`            | 仅允许工具配置档 id，例如 `minimal`、`messaging` 或 `coding`。                                           |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和每 Agent 的 `tools.fs` 覆盖      | 设置为 `true`，以要求仅限工作区的文件系统工具姿态。                                                     |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和每 Agent 的 exec 安全配置           | 仅允许 `deny` 或 `allowlist` 等 exec 安全模式。                                                          |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和每 Agent 的 exec 询问模式                | 要求 `always` 等审批姿态。                                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 和每 Agent 的 exec 主机路由               | 仅允许 `sandbox` 等 exec 主机路由模式。                                                                  |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和每 Agent 的提升权限姿态          | 设置为 `false`，以要求提升权限工具模式保持禁用。                                                        |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和每 Agent 的 `tools.alsoAllow`           | 要求精确的 `alsoAllow` 条目，并报告缺失或意外增加的工具授权。                                           |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                  | 要求已配置的工具拒绝列表包含工具 id 或分组，例如 `group:runtime` 和 `group:fs`。                         |

## 运行检查

在编写期间运行仅策略检查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 只运行策略检查集，并输出证据、发现项和证明哈希。当启用 Policy 插件时，相同的发现项也会出现在 `openclaw doctor --lint` 中。

将操作员策略文件与编写的基线进行比较：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 会用策略文件语法检查策略文件语法；它不会检查运行时状态、证据、凭据或密钥。它使用与作用域覆盖相同的规则元数据：允许列表必须保持相等或更窄，拒绝列表必须保持相等或更宽，必需布尔值必须保持其值，有序字符串只能朝配置顺序中更严格的一端移动，精确列表必须匹配。基线可以是组织编写的策略；被检查的策略可以添加更严格的值或额外规则。当顶层被检查规则同等或更严格时，它可以满足作用域基线规则。文件之间的作用域名称不需要匹配；比较按选择器（`agentIds`/`channelIds`）和字段建立键。

干净的 compare（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

干净的 `policy check --json` 输出包含操作员或监督器可以记录的稳定哈希：

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

| 设置                      | 用途                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也启用策略检查。                  |
| `workspaceRepairs`        | 允许 `doctor --fix` 编辑由策略管理的工作区设置。                |
| `expectedHash`            | 已批准策略工件的可选哈希锁。                                   |
| `expectedAttestationHash` | 上一次已接受的干净策略检查的可选哈希锁。                       |
| `path`                    | 策略工件相对于工作区的位置。                                   |

将 `plugins.entries.policy.config.enabled` 设置为 `false`，可在保持插件已安装的情况下禁用某个工作区的策略检查。

## 接受策略状态

示例 JSON 输出：

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

`attestation.policy.hash` 标识已编写的规则工件。`evidence` 记录检查使用的观测到的 OpenClaw 状态，而 `workspace.hash` 标识该证据载荷。`findingsHash` 标识精确的发现项集合。`checkedAt` 记录检查运行时间。`attestationHash` 标识稳定声明（策略哈希、证据哈希、发现项哈希以及干净/脏状态），并有意排除 `checkedAt`，因此相同的策略状态始终会产生相同的证明哈希。这四个值共同构成一次策略检查的审计元组。

如果 Gateway 网关或监督器使用策略来阻止、批准或注释运行时动作，它应记录上一次干净检查的证明哈希。`checkedAt` 会保留在 JSON 输出中用于审计日志，但不是稳定哈希的一部分。

接受策略状态的生命周期：

1. 编写或审查 `policy.jsonc`。
2. 运行 `openclaw policy check --json`。
3. 如果干净，将 `attestation.policy.hash` 记录为 `expectedHash`。
4. 将 `attestation.attestationHash` 记录为 `expectedAttestationHash`。
5. 在 CI 或发布门禁中重新运行 `openclaw doctor --lint`。

如果策略规则是有意更改的，请从一次干净检查中更新两个已接受的哈希。如果只是工作区设置改变（策略保持不变），通常只有 `expectedAttestationHash` 会改变。

启用或升级 `agents.workspace` 规则会向工作区哈希和证明哈希添加 `agentWorkspace` 证据；请审查新证据，并在启用后刷新已接受的证明哈希。启用或升级工具姿态规则也会以相同方式添加 `toolPosture` 证据。

`openclaw policy watch` 会重新运行检查，并在当前证据不再匹配 `expectedAttestationHash` 时报告：

```bash
openclaw policy watch --json
```

在 CI 或需要单次漂移评估的脚本中使用 `--once`。如果没有 `--once`，默认每两秒轮询一次；使用 `--interval-ms` 更改间隔。

## 发现项

| 检查 ID                                                 | 发现项                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 策略已启用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 策略无法解析，或包含格式错误的规则条目。                       |
| `policy/policy-hash-mismatch`                            | 策略与配置的 `expectedHash` 不匹配。                                  |
| `policy/attestation-hash-mismatch`                       | 当前策略证据不再匹配已接受的证明。               |
| `policy/policy-conformance-invalid`                      | 基线或被检查的策略文件包含无效的比较语法。                  |
| `policy/policy-conformance-missing`                      | 被检查的策略文件缺少基线策略文件要求的规则。     |
| `policy/policy-conformance-weaker`                       | 被检查的策略文件的值弱于基线策略文件。           |
| `policy/channels-denied-provider`                        | 已启用的渠道匹配某条渠道拒绝规则。                                   |
| `policy/mcp-denied-server`                               | 已配置的 MCP 服务器被策略拒绝。                                      |
| `policy/mcp-unapproved-server`                           | 已配置的 MCP 服务器不在允许列表中。                                 |
| `policy/models-denied-provider`                          | 已配置的模型提供商或模型引用使用了被拒绝的提供商。                  |
| `policy/models-unapproved-provider`                      | 已配置的模型提供商或模型引用不在允许列表中。                |
| `policy/network-private-access-enabled`                  | 策略拒绝私有网络 SSRF 逃生口时，该逃生口却已启用。             |
| `policy/ingress-dm-policy-unapproved`                    | 渠道私信策略不在策略允许列表中。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 与策略要求的私信隔离范围不匹配。          |
| `policy/ingress-open-groups-denied`                      | 策略拒绝开放群组入口时，渠道群组策略却为 `open`。          |
| `policy/ingress-group-mention-required`                  | 策略要求提及门控时，渠道或群组条目却禁用了提及门控。       |
| `policy/gateway-non-loopback-bind`                       | 策略拒绝时，Gateway 网关绑定姿态却允许非 loopback 暴露。         |
| `policy/gateway-auth-disabled`                           | 策略要求认证时，Gateway 网关认证却已禁用。                     |
| `policy/gateway-rate-limit-missing`                      | 策略要求时，Gateway 网关认证速率限制姿态未显式配置。          |
| `policy/gateway-control-ui-insecure`                     | Gateway 网关 Control UI 的不安全暴露开关已启用。                         |
| `policy/gateway-tailscale-funnel`                        | 策略拒绝时，Gateway 网关 Tailscale Funnel 暴露却已启用。               |
| `policy/gateway-remote-enabled`                          | 策略拒绝时，Gateway 网关远程模式却处于活动状态。                              |
| `policy/gateway-http-endpoint-enabled`                   | 策略拒绝时，Gateway 网关 HTTP API 端点却已启用。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway 网关 HTTP URL 获取输入缺少必需的 URL 允许列表。                      |
| `policy/gateway-node-command-denied`                     | 被策略拒绝的节点命令未被 OpenClaw 配置拒绝。                 |
| `policy/agents-workspace-access-denied`                  | Agent 沙箱模式或工作区访问不在策略允许列表中。           |
| `policy/agents-tool-not-denied`                          | Agent 或默认配置未拒绝策略要求拒绝的工具。               |
| `policy/tools-profile-unapproved`                        | 已配置的全局或按 Agent 配置的工具配置文件不在允许列表中。           |
| `policy/tools-fs-workspace-only-required`                | 文件系统工具未配置为仅限工作区路径姿态。             |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在策略允许列表中。                               |
| `policy/tools-exec-ask-unapproved`                       | Exec 询问模式不在策略允许列表中。                                    |
| `policy/tools-exec-host-unapproved`                      | Exec 主机路由不在策略允许列表中。                                |
| `policy/tools-elevated-enabled`                          | 策略拒绝时，提升权限的工具模式却已启用。                              |
| `policy/tools-also-allow-missing`                        | 已配置的 `alsoAllow` 列表缺少策略要求的条目。             |
| `policy/tools-also-allow-unexpected`                     | 已配置的 `alsoAllow` 列表包含策略未预期的条目。           |
| `policy/tools-required-deny-missing`                     | 全局或按 Agent 配置的工具拒绝列表未包含必需拒绝的工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在策略允许列表中。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙箱后端不在策略允许列表中。                                  |
| `policy/sandbox-container-posture-unobservable`          | 为无法观测该姿态的后端启用了容器姿态规则。         |
| `policy/sandbox-container-host-network-denied`           | 容器支撑的沙箱或浏览器使用主机网络模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 容器支撑的沙箱或浏览器加入了另一个容器命名空间。          |
| `policy/sandbox-container-mount-mode-required`           | 容器支撑的沙箱或浏览器挂载不是只读的。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支撑的沙箱或浏览器挂载暴露了容器运行时套接字。 |
| `policy/sandbox-container-unconfined-profile`            | 策略拒绝时，容器沙箱配置文件却未受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 策略要求时，沙箱浏览器 CDP 来源范围缺失。             |
| `policy/data-handling-redaction-disabled`                | 策略要求时，敏感日志脱敏却已禁用。                  |
| `policy/data-handling-telemetry-content-capture`         | 策略拒绝时，遥测内容捕获却已启用。                       |
| `policy/data-handling-session-retention-not-enforced`    | 策略要求时，会话保留维护未强制执行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 策略拒绝时，会话转录记忆索引却已启用。              |
| `policy/secrets-unmanaged-provider`                      | 配置 SecretRef 引用了未在 `secrets.providers` 下声明的提供商。  |
| `policy/secrets-denied-provider-source`                  | 配置密钥提供商或 SecretRef 使用了被策略拒绝的来源。             |
| `policy/secrets-insecure-provider`                       | 策略拒绝时，密钥提供商却选择了不安全姿态。               |
| `policy/auth-profile-invalid-metadata`                   | 配置认证配置文件缺少有效的提供商或模式元数据。                 |
| `policy/auth-profile-unapproved-mode`                    | 配置认证配置文件模式不在策略允许列表中。                       |
| `policy/exec-approvals-missing`                          | 策略要求 `exec-approvals.json`，但该产物缺失。               |
| `policy/exec-approvals-invalid`                          | 已配置的 Exec 审批产物无法解析。                          |
| `policy/exec-approvals-default-security-unapproved`      | Exec 审批默认值使用了不在策略允许列表中的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 按 Agent 生效的 Exec 审批安全模式不在允许列表中。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 策略拒绝时，Exec 审批 Agent 却隐式自动允许 Skills CLI。   |
| `policy/exec-approvals-allowlist-missing`                | 审批允许列表缺少策略要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 审批允许列表包含策略未预期的模式。                |
| `policy/tools-missing-risk-level`                        | 受治理的工具声明缺少风险元数据。                             |
| `policy/tools-unknown-risk-level`                        | 受治理的工具声明使用了未知风险值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具声明缺少敏感度元数据。                      |
| `policy/tools-missing-owner`                             | 受治理的工具声明缺少所有者元数据。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具声明使用了未知敏感度值。                    |

发现项可以同时包含 `target`（观测到的不符合要求的工作区对象）和 `requirement`（使其成为发现项的已编写规则）。目前二者都是 `oc://` 地址字符串，但字段名称描述的是策略角色，而不是地址格式。

发现项示例：

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
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
  "message": "MCP server 'remote' is not in the policy allowlist.",
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
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
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
  "message": "Network setting 'browser-private-network' allows private-network access.",
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
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
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
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修复

`doctor --lint` 和 `policy check` 是只读的。

只有在显式启用 `workspaceRepairs` 时，`doctor --fix` 才会编辑由 policy 管理的工作区设置；否则，检查只会报告它们将修复的内容，并保持设置不变。

在此版本中，修复可以禁用被 `channels.denyRules` 拒绝的渠道，并应用下面列出的自动收窄修复。请仅在 policy 文件经过审核后启用 `workspaceRepairs`，因为有效规则可能会更改工作区配置：

- 当全局 policy 禁止提升权限的工具时，设置 `tools.elevated.enabled=false`
- 将不安全的 `gateway.controlUi.*` 开关设置为 `false`
- 当 policy 拒绝远程 Gateway 网关模式时，设置 `gateway.mode=local`
- 当 policy 要求对敏感日志进行脱敏时，设置 `logging.redactSensitive=tools`
- 当 policy 拒绝遥测内容捕获时，设置 `diagnostics.otel.captureContent=false`，或针对对象形式的遥测捕获设置，设置 `diagnostics.otel.captureContent.enabled=false`

按作用域的提升权限工具修复仅做检测。按作用域的数据处理修复在发现项报告共享日志或遥测配置时也会跳过，因为更改共享设置会影响超过该作用域 policy 目标的范围。

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

## 退出码

| 命令             | `0`                                                    | `1`                                                              | `2`                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------- | -------------------- |
| `policy check`   | 没有达到阈值的发现项。                                 | 一个或多个发现项达到阈值。                                       | 参数或运行时失败。   |
| `policy compare` | policy 文件至少与基线一样严格。                        | policy 文件无效、缺失，或弱于基线规则。                          | 参数或运行时失败。   |
| `policy watch`   | 没有发现项，且已接受的哈希是最新的。                   | 存在发现项，或已接受的证明已过期。                               | 参数或运行时失败。   |

## 相关内容

- [Doctor lint mode](/zh-CN/cli/doctor#lint-mode)
- [路径 CLI](/zh-CN/cli/path)
