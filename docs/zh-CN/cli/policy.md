---
read_when:
    - 你想根据编写好的 policy.jsonc 检查 OpenClaw 设置
    - 你想在 doctor lint 中看到策略发现项
    - 你需要一个用于审计证据的策略证明哈希
summary: '`openclaw policy` 符合性检查的 CLI 参考'
title: 策略
x-i18n:
    generated_at: "2026-07-05T01:55:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25dbf0d9d1ed2f1f61a92300279d5fce3f9dc528479701d3b3de739f04685e9c
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由内置的 Policy 插件提供。Policy 是现有 OpenClaw 设置之上的企业合规层。它不会添加第二套配置系统。`policy.jsonc` 定义编写好的要求，OpenClaw 将活动工作区作为证据进行观察，策略健康检查通过 `doctor --lint` 报告漂移。最终合规信号是一次干净的 `doctor --lint` 运行；Policy 会将发现贡献到这个共享的 lint 表面，而不是创建单独的健康门禁。

Policy 目前管理已配置的渠道、MCP 服务器、模型提供商、网络 SSRF 姿态、入口/渠道访问姿态、Gateway 网关暴露和节点命令姿态、智能体工作区姿态、数据处理姿态、OpenClaw 配置密钥提供商/认证配置文件姿态，以及受治理的工具声明。例如，IT 或工作区操作员可以记录 Telegram 不是获批的渠道提供商，将 MCP 服务器和模型引用限制为获批条目，要求私有网络 fetch/浏览器访问保持禁用，要求私信会话隔离和渠道入口姿态保持在已审查范围内，要求 Gateway 网关绑定/认证/HTTP 暴露和特权节点命令保持在已审查范围内，要求智能体工作区访问和工具拒绝项保持在已审查姿态，要求 OpenClaw 配置 SecretRef 使用托管提供商，要求配置认证配置文件携带提供商/模式元数据，要求受治理工具携带风险和敏感度元数据，要求敏感日志脱敏，拒绝遥测内容捕获，要求会话保留维护，拒绝会话转录记忆索引，然后使用 `doctor --lint` 作为共享合规门禁。

当工作区需要一条持久声明，例如“这些渠道不得启用”或“受治理工具必须声明审批元数据”，并且需要一种可重复的方法来证明 OpenClaw 仍符合该声明时，请使用 Policy。当你只需要本地行为，并且不需要策略发现或证明输出时，仅使用常规配置和工作区文档即可。

## 快速开始

首次使用前启用内置的 Policy 插件：

```bash
openclaw plugins enable policy
```

启用 Policy 后，Doctor 可以加载策略健康检查，而不激活任意插件。即使缺少 `policy.jsonc`，该插件也会保持启用，因此 Doctor 可以报告缺少该制品。

Policy 是编写出来的，不是从用户当前设置生成的。一个用于渠道、MCP 服务器、模型提供商、网络姿态、入口/渠道访问、Gateway 网关暴露、智能体工作区姿态、已配置沙箱运行时姿态、OpenClaw 数据处理姿态、配置密钥提供商/认证配置文件姿态、Exec 审批文件姿态和工具元数据的最小策略如下：

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

规则才是权威。类别块只是命名空间；只有在存在具体规则时才会运行检查。OpenClaw 会读取当前 `channels.*` 设置、`mcp.servers.*`、`models.providers.*`、选定的智能体模型引用、网络 SSRF 设置、私信会话范围、渠道私信策略、渠道群组策略、渠道/群组提及门禁、Gateway 网关绑定/认证/Control UI/Tailscale/远程/HTTP 姿态、Gateway 网关节点命令姿态、OpenClaw 配置智能体沙箱工作区访问和工具拒绝姿态、数据处理配置姿态、配置密钥提供商和 SecretRef 来源、配置认证配置文件元数据、已配置的全局/按智能体工具姿态，以及 `TOOLS.md` 声明作为证据，然后报告不符合的已观察状态。如果策略拒绝非 loopback Gateway 网关绑定，只有在你愿意审查运行时默认值时才省略 `gateway.bind`；若要严格配置合规，请设置 `gateway.bind=loopback`。对于只读智能体姿态，请在适用的默认值或智能体上配置沙箱模式，并将 `workspaceAccess` 设置为 `none` 或 `ro`；省略沙箱模式或设置为 `off` 不满足只读/禁止写入策略。`agents.workspace.denyTools` 支持 `exec`、`process`、`write`、`edit` 和 `apply_patch`；OpenClaw 配置 `group:fs` 覆盖文件变更工具，`group:runtime` 覆盖 shell/进程工具。工具姿态策略会观察 `tools.profile`、`tools.allow`、`tools.alsoAllow`、`tools.deny`、`tools.fs.workspaceOnly`、`tools.exec.security`、`tools.exec.ask`、`tools.exec.host`、`tools.elevated.enabled`，以及同样的按智能体 `agents.list[].tools.*` 覆盖项。仅当存在 `execApprovals` 规则时，Exec 审批策略才会读取命名的 `exec-approvals.json` 产品制品；证据会记录默认值、按智能体姿态和 allowlist 模式，但不会记录 socket 令牌或最近使用的命令文本。Policy 不会在运行时强制执行工具调用。密钥证据会记录提供商/来源姿态和 SecretRef 元数据，绝不会记录原始密钥值。Policy 不会读取或证明按智能体凭证存储，例如 `auth-profiles.json`；这些存储仍由现有认证和凭证流程拥有。数据处理证据仅是配置级姿态：它检查已配置的脱敏模式、遥测内容捕获开关、会话维护模式，以及会话转录记忆索引设置。它不会检查原始日志、遥测导出、转录内容、记忆文件，也不会证明不存在个人数据或密钥。

### 策略规则参考

下面的每个策略字段都是可选的。只有当匹配规则存在于 `policy.jsonc` 中时，检查才会运行。观察到的状态是现有 OpenClaw 配置或工作区元数据；Policy 会报告漂移，但不会重写运行时行为，除非明确有可用并已启用的修复路径。
Policy 文件是严格的：不支持的章节或规则键会报告为 `policy/policy-jsonc-invalid`，而不是被忽略。

Policy 叠加层会保留宽泛的顶层规则作为全局规则，然后允许命名范围块为显式选择器添加更严格的普通策略章节。范围名称只是描述性分组；匹配使用范围内部的选择器值。叠加是累加式的：全局声明仍会运行，范围声明也可以针对同一个已观察配置发出自己的发现。

#### 范围叠加层

当一组智能体或渠道需要比顶层基线更严格的策略时，请使用 `scopes.<scopeName>`。按智能体划分的章节使用 `agentIds`，支持 `tools.*`、`agents.workspace.*`、`sandbox.*`、`dataHandling.memory.*` 和 `execApprovals.*`。按渠道划分的入口使用 `channelIds`，支持 `ingress.channels.*`。不支持的章节会被拒绝，而不是被忽略。如果某个 `agentIds` 条目不存在于 `agents.list[]` 中，OpenClaw 会针对该运行时智能体 ID 继承的全局/默认姿态评估范围规则。

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

同一个智能体可以出现在多个范围中，只要每个范围治理不同字段，如上所示。对于同一个智能体，重复的范围字段必须根据策略元数据同等严格或更严格；较弱的重复声明会被拒绝。严格性元数据将 allow-list 视为子集，将 deny-list 视为超集，并将必需布尔值视为固定要求。

容器姿态策略只会针对 OpenClaw 能够为匹配智能体观察到的证据进行评估。如果启用的 `sandbox.containers.*` 规则应用于某个智能体，而该智能体的沙箱后端无法暴露该字段，Policy 会报告 `policy/sandbox-container-posture-unobservable`，而不是将该声明视为通过。对于使用不同沙箱后端的智能体组，请使用单独的 `agentIds` 范围，并为无法观察到这些字段的组将不支持的容器规则保持未设置或 false。

顶层 `ingress.session.requireDmScope` 仍是全局的，因为 `session.dmScope` 不是可归因到渠道的证据。

| 选择器 | 支持的部分 | 使用场景 |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | 一个或多个运行时智能体需要更严格的规则。 |
| `channelIds` | `ingress.channels`                                                                 | 一个或多个渠道需要更严格的入口规则。 |

`policy.jsonc` 中存在的每个作用域都必须有效且可强制执行。

#### 渠道

| 策略字段 | 观测状态 | 使用场景 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 提供商和启用状态 | 拒绝来自某个提供商（例如 `telegram`）的已配置渠道。 |
| `channels.denyRules[].reason`        | 发现消息和修复提示上下文 | 说明为什么拒绝该提供商。 |

#### MCP 服务器

| 策略字段 | 观测状态 | 使用场景 |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ids | 要求每个已配置的 MCP 服务器都在允许列表中。 |
| `mcp.servers.deny`  | `mcp.servers.*` ids | 拒绝特定的已配置 MCP 服务器 id。 |

#### 模型提供商

| 策略字段 | 观测状态 | 使用场景 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ids 和已选择的模型引用 | 要求已配置的提供商和已选择的模型引用使用已批准的提供商。 |
| `models.providers.deny`  | `models.providers.*` ids 和已选择的模型引用 | 按提供商 id 拒绝已配置的提供商和已选择的模型引用。 |

#### 网络

| 策略字段 | 观测状态 | 使用场景 |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有网络 SSRF 逃逸通道 | 设为 `false`，以要求私有网络访问保持禁用。 |

#### 入口和渠道访问

| 策略字段 | 观测状态 | 使用场景 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求经过审查的直接消息隔离作用域。 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和旧版渠道私信策略字段 | 仅允许经过审查的直接消息渠道策略。 |
| `ingress.channels.denyOpenGroups`         | 渠道、账户和群组入口策略 | 拒绝已配置渠道和账户的开放群组入口。 |
| `ingress.channels.requireMentionInGroups` | 渠道、账户、群组、服务器和嵌套提及门控配置 | 当群组入口开放或受提及门控时，要求启用提及门控。 |

#### Gateway 网关

| 策略字段 | 观测状态 | 使用场景 |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 设为 `false`，以要求 Gateway 网关绑定到回环地址。 |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 网关暴露姿态 | 设为 `false`，以拒绝 Tailscale Funnel 暴露。 |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 设为 `true`，以拒绝禁用的 Gateway 网关身份验证。 |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 设为 `true`，以要求显式配置身份验证速率限制。 |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全的身份验证/设备/来源开关 | 设为 `false`，以拒绝不安全的 Control UI 暴露开关。 |
| `gateway.remote.allow`                  | 远程 Gateway 网关模式/配置 | 设为 `false`，以拒绝远程 Gateway 网关模式。 |
| `gateway.http.denyEndpoints`            | Gateway 网关 HTTP API 端点 | 拒绝端点 id，例如 `chatCompletions` 或 `responses`。 |
| `gateway.http.requireUrlAllowlists`     | Gateway 网关 HTTP URL 获取输入 | 设为 `true`，以要求 URL 获取输入使用 URL 允许列表。 |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 配置中拒绝精确的节点命令 id，例如 `system.run`。 |

`gateway.nodes.denyCommands` 是精确且区分大小写的拒绝超集规则。
当策略必须证明特权节点命令已由 OpenClaw 配置显式拒绝时使用它。
有意允许某个特权节点命令的部署，应在审查后更新 `policy.jsonc`，
而不是仅依赖 `gateway.nodes.allowCommands`。

#### Agent 工作区

| 策略字段 | 观测状态 | 使用场景 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 仅允许沙箱工作区访问值，例如 `none` 或 `ro`。 |
| `agents.workspace.denyTools`     | 全局和按智能体配置的工具拒绝配置 | 要求拒绝工作区/运行时变更工具，例如 `exec`、`process`、`write`、`edit` 或 `apply_patch`。 |

#### 沙箱姿态

| 策略字段 | 观测状态 | 使用场景 |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和按智能体配置的模式 | 仅允许经过审查的沙箱模式，例如 `all` 或 `non-main`。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和按智能体配置的后端 | 仅允许经过审查的沙箱后端，例如 `docker`。 |
| `sandbox.containers.denyHostNetwork`                  | 容器支持的沙箱/浏览器网络模式 | 拒绝主机网络模式。 |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支持的沙箱/浏览器网络模式 | 拒绝加入另一个容器网络命名空间。 |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支持的沙箱/浏览器挂载模式 | 要求挂载为只读。 |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支持的沙箱/浏览器挂载目标 | 拒绝容器运行时套接字挂载。 |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全配置文件姿态 | 拒绝不受限制的容器安全配置文件。 |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱浏览器 CDP 来源范围 | 要求浏览器 CDP 暴露声明来源范围。 |

策略将缺失的 `sandbox.mode` 视为隐式默认值 `off`，因此
`sandbox.requireMode` 会将新的或未配置的沙箱报告为不在
类似 `["all"]` 的允许列表中。

#### 数据处理

| 策略字段 | 观测状态 | 使用场景 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 设为 `true`，以拒绝 `logging.redactSensitive: "off"`。 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 设为 `true`，以拒绝遥测内容捕获。 |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 设为 `true`，以要求有效的会话维护模式为 `enforce`。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 设为 `true`，以拒绝将会话转录索引到记忆中。 |

#### 密钥

| 策略字段 | 观测状态 | 使用场景 |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 配置 SecretRefs 和 `secrets.providers.*` 声明 | 设为 `true`，以要求 SecretRefs 指向已声明的提供商。 |
| `secrets.denySources`             | 密钥提供商来源和 SecretRef 来源 | 拒绝来源，例如 `exec`、`file` 或另一个已配置的来源名称。 |
| `secrets.allowInsecureProviders`  | 不安全的密钥提供商姿态标志 | 设为 `false`，以拒绝选择使用不安全姿态的提供商。 |

#### Exec 审批

Exec 审批策略会观察活动运行时的 `exec-approvals.json`
工件。默认情况下这是 `~/.openclaw/exec-approvals.json`；当设置了
`OPENCLAW_STATE_DIR` 时，Policy 会读取
`$OPENCLAW_STATE_DIR/exec-approvals.json`。实际态势规则，例如
`execApprovals.defaults.*` 或 `execApprovals.agents.*`，需要可读取的工件
证据；缺失或无效的工件会被报告为不可观察证据，而不是基于合成的运行时默认值
进行尽力通过。一旦工件可读取，省略的审批字段会继承运行时默认值：缺失的
`defaults.security` 为 `full`，缺失的 Agent 安全设置会继承该
默认值。证据包括 `defaults`、`agents.*` 和
`agents.*.allowlist[].pattern`，以及可选的 `argPattern`、有效的
`autoAllowSkills` 态势和条目来源。它不包括套接字
路径/令牌、`commandText`、`lastUsedCommand`、解析后的路径或时间戳。

| Policy 字段                                | 观察到的状态                                                                         | 使用场景                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 活动运行时 `exec-approvals.json` 路径                                              | 设置为 `true` 以要求审批工件必须存在并可解析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，默认为 `full`                                              | 仅允许已批准的默认审批安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，继承默认值                                               | 仅允许已批准的按 Agent 生效审批安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，继承运行时默认值 | 设置为 `false` 以要求严格的手动允许列表，不进行隐式 Skills CLI 审批。 |
| `execApprovals.agents.allowlist.expected`   | 聚合的 `agents.*.allowlist[]` pattern 和可选 argPattern 条目               | 要求审批允许列表匹配已审核的模式集合。                      |

例如，要求审批工件存在、拒绝宽松默认值，并且
仅允许选定 Agent 使用已审核的 Exec 审批态势：

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

#### 凭证配置档案

| Policy 字段                    | 观察到的状态                               | 使用场景                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供商和模式元数据 | 要求配置凭证配置档案上存在 `provider` 和 `mode` 等元数据键。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 仅允许受支持的凭证配置档案模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具元数据

| Policy 字段            | 观察到的状态                   | 使用场景                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 声明 | 要求受治理的工具声明 `risk`、`sensitivity` 或 `owner` 等元数据键。 |

#### 工具态势

| Policy 字段                    | 观察到的状态                                              | 使用场景                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`           | 仅允许 `minimal`、`messaging` 或 `coding` 等工具配置档案 ID。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和按 Agent 配置的 `tools.fs` 覆盖 | 设置为 `true` 以要求仅限工作区的文件系统工具态势。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和按 Agent 配置的 Exec 安全设置           | 仅允许 `deny` 或 `allowlist` 等 Exec 安全模式。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和按 Agent 配置的 Exec 询问模式                | 要求 `always` 等审批态势。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 和按 Agent 配置的 Exec 主机路由           | 仅允许 `sandbox` 等 Exec 主机路由模式。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和按 Agent 配置的提升权限态势     | 设置为 `false` 以要求提升权限工具模式保持禁用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和按 Agent 配置的 `tools.alsoAllow`           | 要求精确的 `alsoAllow` 条目，并报告缺失或意外新增的工具授权。                 |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                 | 要求已配置的工具拒绝列表包含工具 ID 或组，例如 `group:runtime` 和 `group:fs`。 |

在编写期间运行仅限策略的检查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 仅运行策略检查集，并输出证据、发现和
证明哈希。当启用 Policy 插件时，相同发现也会出现在 `openclaw doctor --lint`
中。

将操作者策略文件与编写的基线策略文件进行比较：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 会将策略文件语法与策略文件语法进行比较。它不会
检查 OpenClaw 运行时状态、证据、凭据或密钥。该命令
使用与作用域叠加层相同的策略规则元数据：允许列表必须
保持相等或更窄，拒绝列表必须保持相等或更宽，必需布尔值
必须保留其必需值，有序字符串只能朝配置顺序中更
严格的一端移动，精确列表必须匹配。

基线文件可以是组织编写的策略。被检查的策略可以
使用更严格的值或添加额外的策略规则。顶层被检查规则也可以
在同等或更严格时满足作用域基线规则，因为
顶层策略会广泛适用。作用域名称不需要匹配；作用域
比较会按选择器值（例如 `agentIds` 或 `channelIds`）以及
被检查的策略字段进行键控。

示例干净 compare JSON 输出仅报告策略文件比较状态：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

示例干净 `policy check --json` 输出包含可由
操作者或监督者记录的稳定哈希：

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

## 配置 Policy

Policy 配置位于 `plugins.entries.policy.config` 下。

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

| 设置                   | 用途                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | 即使在 `policy.jsonc` 存在之前也启用策略检查。         |
| `workspaceRepairs`        | 允许 `doctor --fix` 编辑由策略管理的工作区设置。 |
| `expectedHash`            | 已批准策略工件的可选哈希锁定。            |
| `expectedAttestationHash` | 上一次已接受的干净策略检查的可选哈希锁定。    |
| `path`                    | 策略工件相对于工作区的位置。             |

将 `plugins.entries.policy.config.enabled` 设置为 `false`，可以在保留插件安装的同时
为工作区禁用策略检查。

工具元数据要求通过 `tools.requireMetadata` 在 `policy.jsonc` 中编写，
例如 `["risk", "sensitivity", "owner"]`。

## 接受 Policy 状态

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

策略哈希标识已编写的规则工件。证据块记录策略检查使用的已观察 OpenClaw 状态。`workspace.hash` 值标识针对已检查范围的该证据载荷。发现项哈希标识检查返回的确切发现项集合。`checkedAt` 记录评估运行的时间。证明哈希标识稳定声明：策略哈希、证据哈希、发现项哈希，以及结果是否干净。它有意不包含 `checkedAt`，因此相同的策略状态会在重复检查中生成相同的证明。这些共同构成此策略检查的审计元组。

如果后续 Gateway 网关或监督器使用策略来阻止、批准或注释某个运行时操作，它应记录上一次干净策略检查的证明哈希。`checkedAt` 保留在 JSON 输出中用于审计日志，但不属于稳定证明哈希的一部分。

接受策略状态时使用此生命周期：

1. 编写或审查 `policy.jsonc`。
2. 运行 `openclaw policy check --json`。
3. 如果结果干净，将 `attestation.policy.hash` 记录为 `expectedHash`。
4. 将 `attestation.attestationHash` 记录为 `expectedAttestationHash`。
5. 在 CI 或发布门禁中重新运行 `openclaw doctor --lint`。

如果策略规则有意更改，请从一次干净检查中更新两个已接受哈希。如果工作区设置有意更改但策略保持不变，通常只有 `expectedAttestationHash` 会变化。

启用或升级 `agents.workspace` 规则会将 `agentWorkspace` 证据添加到工作区哈希和证明哈希中。操作员应审查新证据，并在启用这些规则后刷新已接受的证明哈希。启用或升级工具态势规则会以相同方式添加 `toolPosture` 证据。

`openclaw policy watch` 会重复运行相同检查，并在当前证据不再匹配 `expectedAttestationHash` 时报告：

```bash
openclaw policy watch --json
```

在只需要一次漂移评估的 CI 或脚本中使用 `--once`。不带 `--once` 时，命令默认每两秒轮询一次；使用 `--interval-ms` 可选择不同的间隔。

## 发现项

策略当前验证：

| 检查 ID                                                 | 发现项                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 策略已启用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 策略无法解析，或包含格式错误的规则条目。                       |
| `policy/policy-hash-mismatch`                            | 策略与配置的 `expectedHash` 不匹配。                                  |
| `policy/attestation-hash-mismatch`                       | 当前策略证据不再与已接受的证明匹配。               |
| `policy/policy-conformance-invalid`                      | 基线或已检查的策略文件包含无效的比较语法。                  |
| `policy/policy-conformance-missing`                      | 已检查的策略文件缺少基线策略文件要求的规则。     |
| `policy/policy-conformance-weaker`                       | 已检查的策略文件中的值弱于基线策略文件。           |
| `policy/channels-denied-provider`                        | 已启用的渠道匹配渠道拒绝规则。                                   |
| `policy/mcp-denied-server`                               | 配置的 MCP 服务器被策略拒绝。                                      |
| `policy/mcp-unapproved-server`                           | 配置的 MCP 服务器不在允许列表中。                                 |
| `policy/models-denied-provider`                          | 配置的模型提供商或模型引用使用了被拒绝的提供商。                  |
| `policy/models-unapproved-provider`                      | 配置的模型提供商或模型引用不在允许列表中。                |
| `policy/network-private-access-enabled`                  | 策略拒绝时启用了私有网络 SSRF 逃生开关。             |
| `policy/ingress-dm-policy-unapproved`                    | 渠道私信策略不在策略允许列表中。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 与策略要求的私信隔离范围不匹配。          |
| `policy/ingress-open-groups-denied`                      | 策略拒绝开放群组入口时，渠道群组策略为 `open`。          |
| `policy/ingress-group-mention-required`                  | 策略要求提及门控时，渠道或群组条目禁用了提及门控。       |
| `policy/gateway-non-loopback-bind`                       | 策略拒绝时，Gateway 网关绑定态势允许非 loopback 暴露。         |
| `policy/gateway-auth-disabled`                           | 策略要求身份验证时，Gateway 网关身份验证被禁用。                     |
| `policy/gateway-rate-limit-missing`                      | 策略要求时，Gateway 网关身份验证速率限制态势未明确。          |
| `policy/gateway-control-ui-insecure`                     | Gateway 网关 Control UI 不安全暴露开关已启用。                         |
| `policy/gateway-tailscale-funnel`                        | 策略拒绝时，Gateway 网关 Tailscale Funnel 暴露已启用。               |
| `policy/gateway-remote-enabled`                          | 策略拒绝时，Gateway 网关远程模式处于活动状态。                              |
| `policy/gateway-http-endpoint-enabled`                   | 策略拒绝时，Gateway 网关 HTTP API 端点已启用。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway 网关 HTTP URL 获取输入缺少必需的 URL 允许列表。                      |
| `policy/gateway-node-command-denied`                     | 被策略拒绝的节点命令未被 OpenClaw 配置拒绝。                 |
| `policy/agents-workspace-access-denied`                  | 智能体沙箱模式或工作区访问不在策略允许列表中。           |
| `policy/agents-tool-not-denied`                          | 智能体或默认配置未拒绝策略要求拒绝的工具。               |
| `policy/tools-profile-unapproved`                        | 配置的全局或按智能体工具配置文件不在允许列表中。           |
| `policy/tools-fs-workspace-only-required`                | 文件系统工具未配置为仅限工作区的路径态势。             |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在策略允许列表中。                               |
| `policy/tools-exec-ask-unapproved`                       | Exec 询问模式不在策略允许列表中。                                    |
| `policy/tools-exec-host-unapproved`                      | Exec 主机路由不在策略允许列表中。                                |
| `policy/tools-elevated-enabled`                          | 策略拒绝时，提升权限的工具模式已启用。                              |
| `policy/tools-also-allow-missing`                        | 配置的 `alsoAllow` 列表缺少策略要求的条目。             |
| `policy/tools-also-allow-unexpected`                     | 配置的 `alsoAllow` 列表包含策略未预期的条目。           |
| `policy/tools-required-deny-missing`                     | 全局或按智能体工具拒绝列表未包含必需拒绝的工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在策略允许列表中。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙箱后端不在策略允许列表中。                                  |
| `policy/sandbox-container-posture-unobservable`          | 为无法观测该规则的后端启用了容器态势规则。         |
| `policy/sandbox-container-host-network-denied`           | 容器支持的沙箱或浏览器使用主机网络模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 容器支持的沙箱或浏览器加入了另一个容器命名空间。          |
| `policy/sandbox-container-mount-mode-required`           | 容器支持的沙箱或浏览器挂载不是只读的。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支持的沙箱或浏览器挂载暴露了容器运行时套接字。 |
| `policy/sandbox-container-unconfined-profile`            | 策略拒绝时，容器沙箱配置文件未受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 策略要求时，沙箱浏览器 CDP 源范围缺失。             |
| `policy/data-handling-redaction-disabled`                | 策略要求时，敏感日志脱敏被禁用。                  |
| `policy/data-handling-telemetry-content-capture`         | 策略拒绝时，遥测内容捕获已启用。                       |
| `policy/data-handling-session-retention-not-enforced`    | 策略要求时，会话保留维护未强制执行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 策略拒绝时，会话转录记忆索引已启用。              |
| `policy/secrets-unmanaged-provider`                      | 配置 SecretRef 引用了未在 `secrets.providers` 下声明的提供商。  |
| `policy/secrets-denied-provider-source`                  | 配置密钥提供商或 SecretRef 使用了被策略拒绝的来源。             |
| `policy/secrets-insecure-provider`                       | 策略拒绝时，密钥提供商选择使用不安全态势。               |
| `policy/auth-profile-invalid-metadata`                   | 配置身份验证配置文件缺少有效的提供商或模式元数据。                 |
| `policy/auth-profile-unapproved-mode`                    | 配置身份验证配置文件模式不在策略允许列表中。                       |
| `policy/exec-approvals-missing`                          | 策略要求 `exec-approvals.json`，但缺少该工件。               |
| `policy/exec-approvals-invalid`                          | 配置的 Exec 审批工件无法解析。                          |
| `policy/exec-approvals-default-security-unapproved`      | Exec 审批默认值使用了不在策略允许列表中的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 按智能体生效的 Exec 审批安全模式不在允许列表中。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 策略拒绝时，Exec 审批智能体隐式自动允许 Skills CLI。   |
| `policy/exec-approvals-allowlist-missing`                | 审批允许列表缺少策略要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 审批允许列表包含策略未预期的模式。                |
| `policy/tools-missing-risk-level`                        | 受治理的工具声明缺少风险元数据。                             |
| `policy/tools-unknown-risk-level`                        | 受治理的工具声明使用了未知风险值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具声明缺少敏感度元数据。                      |
| `policy/tools-missing-owner`                             | 受治理的工具声明缺少所有者元数据。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具声明使用了未知敏感度值。                    |

策略发现项可以同时包含 `target` 和 `requirement`。`target` 是观测到的不符合要求的工作区对象。`requirement` 是使其成为发现项的已编写策略规则。如今这两个值都是地址，通常是 `oc://` 路径，但字段名描述的是它们在策略中的角色，而不是地址格式。

JSON 发现项示例：

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

工具发现项示例：

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

MCP 发现项示例：

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

模型提供商发现项示例：

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

网络发现示例：

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

Gateway 网关暴露发现示例：

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

Gateway 网关节点命令发现示例：

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

Agent 工作区发现示例：

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

只有在显式启用 `workspaceRepairs` 时，`doctor --fix` 才会编辑由策略管理的工作区设置。没有该选择加入时，策略检查会报告它们将修复的内容，并保持设置不变。

在此版本中，修复可以禁用 OpenClaw 配置中已启用但被 `channels.denyRules` 拒绝的渠道。仅在策略文件已完成审查后启用 `workspaceRepairs`，因为有效的拒绝规则可以关闭已配置的渠道：

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

| 命令             | `0`                            | `1`                                      | `2`              |
| ---------------- | ------------------------------ | ---------------------------------------- | ---------------- |
| `policy check`   | 阈值下没有发现。               | 一个或多个发现达到了阈值。              | 参数或运行时失败。 |
| `policy compare` | 策略文件至少与基线一样严格。   | 策略文件无效、缺失或弱于基线规则。      | 参数或运行时失败。 |
| `policy watch`   | 没有发现，且已接受哈希为最新。 | 存在发现，或已接受的证明已过期。        | 参数或运行时失败。 |

## 相关内容

- [Doctor lint mode](/zh-CN/cli/doctor#lint-mode)
- [Path CLI](/zh-CN/cli/path)
