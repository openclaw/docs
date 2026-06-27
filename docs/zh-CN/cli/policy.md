---
read_when:
    - 你想根据编写好的 `policy.jsonc` 检查 OpenClaw 设置
    - 你希望在 doctor lint 中看到策略检查结果
    - 你需要一个用于审计证据的策略证明哈希
summary: 用于 `openclaw policy` 合规性检查的 CLI 参考
title: 策略
x-i18n:
    generated_at: "2026-06-27T01:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由内置 Policy 插件提供。Policy 是基于现有 OpenClaw 设置的企业合规层。它不会添加第二套配置系统。`policy.jsonc` 定义编写好的要求，OpenClaw 将活动工作区作为证据观察，策略健康检查通过 `doctor --lint` 报告偏移。最终的合规信号是一次干净的 `doctor --lint` 运行；Policy 会向这个共享的 lint 表面贡献发现项，而不是创建单独的健康门禁。

Policy 当前管理已配置的渠道、MCP 服务器、模型提供商、网络 SSRF 姿态、入口/渠道访问姿态、Gateway 网关暴露姿态、Agent 工作区姿态、数据处理姿态、OpenClaw 配置密钥提供商/凭证配置文件姿态，以及受治理的工具声明。例如，IT 或工作区操作员可以记录 Telegram 不是已批准的渠道提供商，将 MCP 服务器和模型引用限制为已批准条目，要求私有网络 fetch/browser 访问保持禁用，要求私信会话隔离和渠道入口姿态保持在已审核边界内，要求 Gateway 网关绑定/凭证/HTTP 暴露保持在已审核边界内，要求 Agent 工作区访问和工具拒绝项保持在已审核姿态内，要求 OpenClaw 配置 SecretRef 使用托管提供商，要求配置凭证配置文件携带提供商/模式元数据，要求受治理的工具携带风险和敏感度元数据，要求敏感日志脱敏，拒绝遥测内容捕获，要求会话保留维护，拒绝会话转录记忆索引，然后使用 `doctor --lint` 作为共享合规门禁。

当工作区需要持久声明（例如“这些渠道不得启用”或“受治理的工具必须声明审批元数据”）并且需要一种可重复的方式来证明 OpenClaw 仍符合该声明时，请使用 Policy。当你只需要本地行为，并且不需要策略发现项或证明输出时，只使用常规配置和工作区文档即可。

## 快速开始

首次使用前启用内置 Policy 插件：

```bash
openclaw plugins enable policy
```

启用 Policy 后，Doctor 可以加载策略健康检查，而无需激活任意插件。如果缺少 `policy.jsonc`，插件仍会保持启用，因此 Doctor 可以报告缺失的构件。

Policy 是编写出来的，而不是从用户当前设置生成的。一个针对渠道、MCP 服务器、模型提供商、网络姿态、入口/渠道访问、Gateway 网关暴露、Agent 工作区姿态、已配置沙箱运行时姿态、OpenClaw 数据处理姿态、配置密钥提供商/凭证配置文件姿态、Exec 审批文件姿态和工具元数据的最小策略如下：

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

规则是权威来源。类别块只是一个命名空间；只有在存在具体规则时才会运行检查。OpenClaw 会读取当前 `channels.*` 设置、`mcp.servers.*`、`models.providers.*`、选定的 Agent 模型引用、网络 SSRF 设置、私信会话作用域、渠道私信策略、渠道群组策略、渠道/群组提及门禁、Gateway 网关绑定/凭证/Control UI/Tailscale/远程/HTTP 姿态、OpenClaw 配置中的 Agent 沙箱工作区访问和工具拒绝姿态、数据处理配置姿态、配置密钥提供商和 SecretRef 来源、配置凭证配置文件元数据、已配置的全局/按 Agent 工具姿态，以及 `TOOLS.md` 声明作为证据，然后报告不符合要求的已观察状态。如果策略拒绝非 local loopback 的 Gateway 网关绑定，仅当你愿意审核运行时默认值时才省略 `gateway.bind`；若要严格配置合规，请设置 `gateway.bind=loopback`。对于只读 Agent 姿态，请在适用的默认值或 Agent 上配置沙箱模式，并将 `workspaceAccess` 设置为 `none` 或 `ro`；省略或设置为 `off` 的沙箱模式不满足只读/无写入策略。`agents.workspace.denyTools` 支持 `exec`、`process`、`write`、`edit` 和 `apply_patch`；OpenClaw 配置 `group:fs` 覆盖文件变更工具，`group:runtime` 覆盖 shell/进程工具。工具姿态策略会观察 `tools.profile`、`tools.allow`、`tools.alsoAllow`、`tools.deny`、`tools.fs.workspaceOnly`、`tools.exec.security`、`tools.exec.ask`、`tools.exec.host`、`tools.elevated.enabled`，以及相同的按 Agent `agents.list[].tools.*` 覆盖项。只有存在 `execApprovals` 规则时，Exec 审批策略才会读取具名的 `exec-approvals.json` 产品构件；证据会记录默认值、按 Agent 姿态和允许列表模式，但不会记录套接字令牌或最近使用的命令文本。Policy 不会在运行时强制执行工具调用。密钥证据会记录提供商/来源姿态和 SecretRef 元数据，绝不记录原始密钥值。Policy 不会读取或证明按 Agent 的凭据存储，例如 `auth-profiles.json`；这些存储仍由现有凭证和凭据流程拥有。数据处理证据只是配置级姿态：它检查已配置的脱敏模式、遥测内容捕获开关、会话维护模式和会话转录记忆索引设置。它不会检查原始日志、遥测导出、转录内容、记忆文件，也不会证明不存在个人数据或密钥。

### Policy 规则参考

下面的每个策略字段都是可选的。只有当 `policy.jsonc` 中存在匹配规则时，检查才会运行。观察到的状态是现有 OpenClaw 配置或工作区元数据；Policy 会报告偏移，但不会重写运行时行为，除非修复路径明确可用且已启用。Policy 文件是严格的：不支持的章节或规则键名会报告为 `policy/policy-jsonc-invalid`，而不是被忽略。

Policy 叠加层会让宽泛的顶层规则保持全局适用，然后允许具名作用域块为显式选择器添加更严格的常规策略章节。作用域名称只是描述性分组；匹配使用作用域内部的选择器值。叠加是增量式的：全局声明仍会运行，而作用域声明可以针对同一个观察到的配置发出自己的发现项。

#### 作用域叠加层

当一组 Agent 或渠道需要比顶层基线更严格的策略时，请使用 `scopes.<scopeName>`。Agent 作用域章节使用 `agentIds`，支持 `tools.*`、`agents.workspace.*`、`sandbox.*`、`dataHandling.memory.*` 和 `execApprovals.*`。渠道作用域入口使用 `channelIds`，支持 `ingress.channels.*`。不支持的章节会被拒绝，而不是被忽略。如果某个 `agentIds` 条目不存在于 `agents.list[]` 中，OpenClaw 会针对该运行时 Agent id 继承的全局/默认姿态评估作用域规则。

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

如上所示，当每个作用域治理不同字段时，同一个 Agent 可以出现在多个作用域中。对于同一 Agent 的重复作用域字段，必须根据策略元数据同等严格或更严格；较弱的重复声明会被拒绝。严格度元数据将允许列表视为子集，将拒绝列表视为超集，并将必需布尔值视为固定要求。

容器姿态策略只会基于 OpenClaw 能够为匹配 Agent 观察到的证据进行评估。如果已启用的 `sandbox.containers.*` 规则适用于某个 Agent，但该 Agent 的沙箱后端无法暴露该字段，Policy 会报告 `policy/sandbox-container-posture-unobservable`，而不是将该声明视为通过。对于使用不同沙箱后端的 Agent 组，请使用单独的 `agentIds` 作用域，并在无法观察这些字段的组中保持不支持的容器规则未设置或为 false。

顶层 `ingress.session.requireDmScope` 仍保持全局，因为 `session.dmScope` 不是可归属于渠道的证据。

| 选择器       | 支持的分区                                                                         | 使用场景                                             |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `agentIds`   | `tools`、`agents.workspace`、`sandbox`、`dataHandling.memory` 和 `execApprovals`   | 一个或多个运行时智能体需要更严格的规则。             |
| `channelIds` | `ingress.channels`                                                                 | 一个或多个渠道需要更严格的入口规则。                 |

`policy.jsonc` 中存在的每个作用域都必须有效且可强制执行。

#### 渠道

| 策略字段                             | 观测状态                                | 使用场景                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 提供商和启用状态           | 拒绝来自某个提供商（例如 `telegram`）的已配置渠道。          |
| `channels.denyRules[].reason`        | 发现消息和修复提示上下文                | 说明为什么该提供商被拒绝。                                   |

#### MCP 服务器

| 策略字段            | 观测状态            | 使用场景                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ids | 要求每个已配置的 MCP 服务器都在允许列表中。                |
| `mcp.servers.deny`  | `mcp.servers.*` ids | 拒绝特定的已配置 MCP 服务器 ids。                          |

#### 模型提供商

| 策略字段                 | 观测状态                                       | 使用场景                                                                     |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ids 和已选择的模型引用    | 要求已配置的提供商和已选择的模型引用使用已批准的提供商。                     |
| `models.providers.deny`  | `models.providers.*` ids 和已选择的模型引用    | 按提供商 id 拒绝已配置的提供商和已选择的模型引用。                           |

#### 网络

| 策略字段                       | 观测状态                        | 使用场景                                                           |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有网络 SSRF 逃逸通道           | 设为 `false` 以要求私有网络访问保持禁用。                          |

#### 入口和渠道访问

| 策略字段                                  | 观测状态                                                       | 使用场景                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求经过审查的直接消息隔离作用域。                                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和旧版渠道 DM 策略字段                   | 仅允许经过审查的直接消息渠道策略。                                 |
| `ingress.channels.denyOpenGroups`         | 渠道、账号和群组入口策略                                       | 拒绝已配置渠道和账号的开放群组入口。                               |
| `ingress.channels.requireMentionInGroups` | 渠道、账号、群组、服务器和嵌套提及门控配置                     | 当群组入口开放或受提及门控时，要求提及门控。                       |

#### Gateway 网关

| 策略字段                                | 观测状态                                     | 使用场景                                                     |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                               | 设为 `false` 以要求 loopback Gateway 网关绑定。              |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 网关姿态      | 设为 `false` 以拒绝 Tailscale Funnel 暴露。                  |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                          | 设为 `true` 以拒绝禁用的 Gateway 网关认证。                  |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                     | 设为 `true` 以要求显式认证速率限制配置。                     |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全认证/设备/来源开关          | 设为 `false` 以拒绝不安全的 Control UI 暴露开关。            |
| `gateway.remote.allow`                  | 远程 Gateway 网关模式/配置                   | 设为 `false` 以拒绝远程 Gateway 网关模式。                   |
| `gateway.http.denyEndpoints`            | Gateway 网关 HTTP API 端点                   | 拒绝端点 ids，例如 `chatCompletions` 或 `responses`。        |
| `gateway.http.requireUrlAllowlists`     | Gateway 网关 HTTP URL 获取输入               | 设为 `true` 以要求 URL 获取输入使用 URL 允许列表。           |

#### Agent 工作区

| 策略字段                         | 观测状态                                                                              | 使用场景                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 仅允许沙箱工作区访问值，例如 `none` 或 `ro`。                                                                       |
| `agents.workspace.denyTools`     | 全局和按智能体配置的工具拒绝配置                                                      | 要求拒绝工作区/运行时变更工具，例如 `exec`、`process`、`write`、`edit` 或 `apply_patch`。                           |

#### 沙箱姿态

| 策略字段                                              | 观测状态                                              | 使用场景                                                       |
| ----------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和按智能体配置的模式   | 仅允许经过审查的沙箱模式，例如 `all` 或 `non-main`。           |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和按智能体配置的后端 | 仅允许经过审查的沙箱后端，例如 `docker`。                      |
| `sandbox.containers.denyHostNetwork`                  | 容器支持的沙箱/浏览器网络模式                         | 拒绝主机网络模式。                                             |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支持的沙箱/浏览器网络模式                         | 拒绝加入另一个容器网络命名空间。                               |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支持的沙箱/浏览器挂载模式                         | 要求挂载为只读。                                               |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支持的沙箱/浏览器挂载目标                         | 拒绝容器运行时套接字挂载。                                     |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全配置文件姿态                                   | 拒绝未受约束的容器安全配置文件。                               |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱浏览器 CDP 来源范围                                | 要求浏览器 CDP 暴露声明来源范围。                              |

策略将缺失的 `sandbox.mode` 视为隐式默认值 `off`，因此
`sandbox.requireMode` 会将全新或未配置的沙箱报告为不在
`["all"]` 等允许列表内。

#### 数据处理

| 策略字段                                            | 观测状态                                                                           | 使用场景                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                          | 设为 `true` 以拒绝 `logging.redactSensitive: "off"`。                  |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                  | 设为 `true` 以拒绝遥测内容捕获。                                       |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                         | 设为 `true` 以要求有效会话维护模式为 `enforce`。                       |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 设为 `true` 以拒绝将会话转录索引到记忆中。                             |

#### 密钥

| 策略字段                          | 观测状态                                                  | 使用场景                                                                |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 配置 SecretRefs 和 `secrets.providers.*` 声明             | 设为 `true` 以要求 SecretRefs 指向已声明的提供商。                      |
| `secrets.denySources`             | 密钥提供商来源和 SecretRef 来源                           | 拒绝来源，例如 `exec`、`file` 或另一个已配置的来源名称。                |
| `secrets.allowInsecureProviders`  | 不安全密钥提供商姿态标志                                  | 设为 `false` 以拒绝选择使用不安全姿态的提供商。                         |

#### Exec 审批

Exec 审批策略会观测活动运行时 `exec-approvals.json`
工件。默认情况下这是 `~/.openclaw/exec-approvals.json`；当设置
`OPENCLAW_STATE_DIR` 时，Policy 会读取
`$OPENCLAW_STATE_DIR/exec-approvals.json`。实际姿态规则，例如
`execApprovals.defaults.*` 或 `execApprovals.agents.*`，需要可读取的工件
证据；缺失或无效的工件会被报告为不可观测证据，而不是基于合成运行时默认值进行尽力通过。
工件可读取后，省略的审批字段会继承运行时默认值：缺失的
`defaults.security` 为 `full`，缺失的智能体安全设置会继承该默认值。
证据包括 `defaults`、`agents.*` 和
`agents.*.allowlist[].pattern`，以及可选的 `argPattern`、有效的
`autoAllowSkills` 姿态和条目来源。它不包括套接字
路径/令牌、`commandText`、`lastUsedCommand`、已解析路径或时间戳。

| 策略字段                                | 观测状态                                                                         | 使用场景                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 活跃运行时 `exec-approvals.json` 路径                                              | 设为 `true`，要求审批产物存在并可解析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，默认值为 `full`                                              | 仅允许已批准的默认审批安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，继承默认值                                               | 仅允许已批准的按智能体生效审批安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，继承运行时默认值 | 设为 `false`，要求严格的手动允许列表，不隐式批准 Skills CLI。 |
| `execApprovals.agents.allowlist.expected`   | 聚合的 `agents.*.allowlist[]` pattern 和可选 argPattern 条目               | 要求审批允许列表与已审核的模式集合匹配。                      |

例如，要求审批产物，拒绝宽松默认值，并且只允许所选智能体使用已审核的 exec 审批姿态：

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

#### 凭证配置文件

| 策略字段                    | 观测状态                               | 使用场景                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供商和模式元数据 | 要求配置凭证配置文件包含 `provider` 和 `mode` 等元数据键。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 仅允许受支持的凭证配置文件模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具元数据

| 策略字段            | 观测状态                   | 使用场景                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 声明 | 要求受治理的工具声明 `risk`、`sensitivity` 或 `owner` 等元数据键。 |

#### 工具姿态

| 策略字段                    | 观测状态                                              | 使用场景                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`           | 仅允许 `minimal`、`messaging` 或 `coding` 等工具配置文件 ID。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和按智能体 `tools.fs` 覆盖 | 设为 `true`，要求仅工作区的文件系统工具姿态。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和按智能体 exec 安全设置           | 仅允许 `deny` 或 `allowlist` 等 exec 安全模式。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和按智能体 exec ask 模式                | 要求 `always` 等审批姿态。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 和按智能体 exec 主机路由           | 仅允许 `sandbox` 等 exec 主机路由模式。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和按智能体提升权限姿态     | 设为 `false`，要求提升权限工具模式保持禁用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和按智能体 `tools.alsoAllow`           | 要求精确的 `alsoAllow` 条目，并报告缺失或意外新增的工具授权。                 |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                 | 要求已配置的工具拒绝列表包含 `group:runtime` 和 `group:fs` 等工具 ID 或组。 |

在编写期间运行仅策略检查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 只运行策略检查集，并输出证据、发现项和证明哈希。同样的发现项也会在启用 Policy 插件时出现在 `openclaw doctor --lint` 中。

将操作员策略文件与已编写的基线策略文件进行比较：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 比较策略文件语法与策略文件语法。它不会检查 OpenClaw 运行时状态、证据、凭据或密钥。该命令使用与作用域覆盖层相同的策略规则元数据：允许列表必须保持相等或更窄，拒绝列表必须保持相等或更宽，必需布尔值必须保留其必需值，有序字符串只能向已配置顺序中更严格的一端移动，精确列表必须匹配。

基线文件可以是组织编写的策略。被检查的策略可以使用更严格的值或添加额外策略规则。当顶层被检查规则同样或更严格时，也可以满足作用域基线规则，因为顶层策略会广泛应用。作用域名称无需匹配；作用域比较按选择器值（例如 `agentIds` 或 `channelIds`）以及被检查的策略字段作为键。

干净比较 JSON 输出示例只报告策略文件比较状态：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

干净的 `policy check --json` 输出示例包含可由操作员或监督者记录的稳定哈希：

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

| 设置                   | 用途                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | 即使在 `policy.jsonc` 存在之前也启用策略检查。         |
| `workspaceRepairs`        | 允许 `doctor --fix` 编辑由策略管理的工作区设置。 |
| `expectedHash`            | 已批准策略产物的可选哈希锁。            |
| `expectedAttestationHash` | 上次已接受的干净策略检查的可选哈希锁。    |
| `path`                    | 策略产物相对于工作区的位置。             |

将 `plugins.entries.policy.config.enabled` 设为 `false`，可在保持插件已安装的同时为某个工作区禁用策略检查。

工具元数据要求在 `policy.jsonc` 中通过 `tools.requireMetadata` 编写，例如 `["risk", "sensitivity", "owner"]`。

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

策略哈希用于标识编写的规则工件。证据块记录策略检查使用的已观测 OpenClaw 状态。`workspace.hash` 值用于标识该已检查作用域的证据载荷。发现哈希用于标识检查返回的精确发现集合。`checkedAt` 记录评估运行的时间。证明哈希用于标识稳定声明：策略哈希、证据哈希、发现哈希，以及结果是否干净。它有意不包含 `checkedAt`，因此相同的策略状态会在重复检查中生成相同的证明。这些共同构成该策略检查的审计元组。

如果后续 Gateway 网关或监督器使用策略来阻止、批准或注释运行时操作，它应记录上一次干净策略检查的证明哈希。`checkedAt` 会保留在 JSON 输出中用于审计日志，但不属于稳定证明哈希的一部分。

接受策略状态时使用此生命周期：

1. 编写或审查 `policy.jsonc`。
2. 运行 `openclaw policy check --json`。
3. 如果结果干净，将 `attestation.policy.hash` 记录为 `expectedHash`。
4. 将 `attestation.attestationHash` 记录为 `expectedAttestationHash`。
5. 在 CI 或发布关卡中重新运行 `openclaw doctor --lint`。

如果有意更改策略规则，请从一次干净检查更新两个已接受哈希。如果工作区设置有意更改但策略保持不变，通常只有 `expectedAttestationHash` 会改变。

启用或升级 `agents.workspace` 规则会将 `agentWorkspace` 证据加入工作区哈希和证明哈希。操作员应在启用这些规则后审查新证据并刷新已接受的证明哈希。启用或升级工具姿态规则会以相同方式加入 `toolPosture` 证据。

`openclaw policy watch` 会重复运行相同检查，并在当前证据不再匹配 `expectedAttestationHash` 时报告：

```bash
openclaw policy watch --json
```

在只需要一次漂移评估的 CI 或脚本中使用 `--once`。如果没有 `--once`，该命令默认每两秒轮询一次；使用 `--interval-ms` 选择不同的间隔。

## 发现

策略当前验证：

| 检查 ID                                                 | 发现项                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 策略已启用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 策略无法解析，或包含格式错误的规则条目。                       |
| `policy/policy-hash-mismatch`                            | 策略与配置的 `expectedHash` 不匹配。                                  |
| `policy/attestation-hash-mismatch`                       | 当前策略证据不再与已接受的证明匹配。               |
| `policy/policy-conformance-invalid`                      | 基线或已检查的策略文件包含无效的比较语法。                  |
| `policy/policy-conformance-missing`                      | 已检查的策略文件缺少基线策略文件要求的规则。     |
| `policy/policy-conformance-weaker`                       | 已检查的策略文件的值弱于基线策略文件。           |
| `policy/channels-denied-provider`                        | 已启用的渠道匹配了渠道拒绝规则。                                   |
| `policy/mcp-denied-server`                               | 已配置的 MCP 服务器被策略拒绝。                                      |
| `policy/mcp-unapproved-server`                           | 已配置的 MCP 服务器不在允许列表中。                                 |
| `policy/models-denied-provider`                          | 已配置的模型提供商或模型引用使用了被拒绝的提供商。                  |
| `policy/models-unapproved-provider`                      | 已配置的模型提供商或模型引用不在允许列表中。                |
| `policy/network-private-access-enabled`                  | 策略拒绝私有网络 SSRF 逃逸开关时，该开关却被启用。             |
| `policy/ingress-dm-policy-unapproved`                    | 渠道私信策略不在策略允许列表中。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 与策略要求的私信隔离范围不匹配。          |
| `policy/ingress-open-groups-denied`                      | 策略拒绝开放群组入口时，渠道群组策略为 `open`。          |
| `policy/ingress-group-mention-required`                  | 策略要求提及门控时，渠道或群组条目却禁用了提及门控。       |
| `policy/gateway-non-loopback-bind`                       | 策略拒绝时，Gateway 网关绑定状态允许非 loopback 暴露。         |
| `policy/gateway-auth-disabled`                           | 策略要求认证时，Gateway 网关认证却被禁用。                     |
| `policy/gateway-rate-limit-missing`                      | 策略要求时，Gateway 网关认证速率限制状态未明确配置。          |
| `policy/gateway-control-ui-insecure`                     | Gateway 网关 Control UI 的不安全暴露开关已启用。                         |
| `policy/gateway-tailscale-funnel`                        | 策略拒绝时，Gateway 网关 Tailscale Funnel 暴露却被启用。               |
| `policy/gateway-remote-enabled`                          | 策略拒绝时，Gateway 网关远程模式却处于活动状态。                              |
| `policy/gateway-http-endpoint-enabled`                   | 策略拒绝时，Gateway 网关 HTTP API 端点却被启用。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway 网关 HTTP URL 获取输入缺少必需的 URL 允许列表。                      |
| `policy/agents-workspace-access-denied`                  | 智能体沙箱模式或工作区访问不在策略允许列表中。           |
| `policy/agents-tool-not-denied`                          | 智能体或默认配置未拒绝策略要求拒绝的工具。               |
| `policy/tools-profile-unapproved`                        | 已配置的全局或按智能体的工具配置档不在允许列表中。           |
| `policy/tools-fs-workspace-only-required`                | 文件系统工具未配置为仅限工作区路径状态。             |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在策略允许列表中。                               |
| `policy/tools-exec-ask-unapproved`                       | Exec 询问模式不在策略允许列表中。                                    |
| `policy/tools-exec-host-unapproved`                      | Exec 主机路由不在策略允许列表中。                                |
| `policy/tools-elevated-enabled`                          | 策略拒绝时，提升权限工具模式却被启用。                              |
| `policy/tools-also-allow-missing`                        | 已配置的 `alsoAllow` 列表缺少策略要求的条目。             |
| `policy/tools-also-allow-unexpected`                     | 已配置的 `alsoAllow` 列表包含策略未预期的条目。           |
| `policy/tools-required-deny-missing`                     | 全局或按智能体的工具拒绝列表未包含必需拒绝的工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在策略允许列表中。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙箱后端不在策略允许列表中。                                  |
| `policy/sandbox-container-posture-unobservable`          | 容器状态规则已为无法观察它的后端启用。         |
| `policy/sandbox-container-host-network-denied`           | 容器支持的沙箱或浏览器使用主机网络模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 容器支持的沙箱或浏览器加入另一个容器命名空间。          |
| `policy/sandbox-container-mount-mode-required`           | 容器支持的沙箱或浏览器挂载不是只读的。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支持的沙箱或浏览器挂载暴露了容器运行时套接字。 |
| `policy/sandbox-container-unconfined-profile`            | 策略拒绝时，容器沙箱配置档为不受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 策略要求沙箱浏览器 CDP 来源范围时，该范围缺失。             |
| `policy/data-handling-redaction-disabled`                | 策略要求时，敏感日志脱敏却被禁用。                  |
| `policy/data-handling-telemetry-content-capture`         | 策略拒绝时，遥测内容捕获却被启用。                       |
| `policy/data-handling-session-retention-not-enforced`    | 策略要求时，会话保留维护未强制执行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 策略拒绝时，会话转录记忆索引却被启用。              |
| `policy/secrets-unmanaged-provider`                      | 配置 SecretRef 引用了未在 `secrets.providers` 下声明的提供商。  |
| `policy/secrets-denied-provider-source`                  | 配置密钥提供商或 SecretRef 使用了被策略拒绝的来源。             |
| `policy/secrets-insecure-provider`                       | 策略拒绝时，密钥提供商却选择了不安全状态。               |
| `policy/auth-profile-invalid-metadata`                   | 配置认证配置档缺少有效的提供商或模式元数据。                 |
| `policy/auth-profile-unapproved-mode`                    | 配置认证配置档模式不在策略允许列表中。                       |
| `policy/exec-approvals-missing`                          | 策略要求 `exec-approvals.json`，但该构件缺失。               |
| `policy/exec-approvals-invalid`                          | 已配置的 exec 审批构件无法解析。                          |
| `policy/exec-approvals-default-security-unapproved`      | Exec 审批默认值使用了不在策略允许列表中的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 按智能体生效的 exec 审批安全模式不在允许列表中。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 策略拒绝时，exec 审批智能体却隐式自动允许 Skills CLI。   |
| `policy/exec-approvals-allowlist-missing`                | 审批允许列表缺少策略要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 审批允许列表包含策略未预期的模式。                |
| `policy/tools-missing-risk-level`                        | 受治理的工具声明缺少风险元数据。                             |
| `policy/tools-unknown-risk-level`                        | 受治理的工具声明使用了未知的风险值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具声明缺少敏感度元数据。                      |
| `policy/tools-missing-owner`                             | 受治理的工具声明缺少所有者元数据。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具声明使用了未知的敏感度值。                    |

策略发现项可以同时包含 `target` 和 `requirement`。`target` 是观察到的不符合要求的工作区对象。`requirement` 是使其成为发现项的已编写策略规则。如今这两个值都是地址，通常是 `oc://` 路径，但字段名描述的是它们的策略角色，而不是地址格式。

示例 JSON 发现项：

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

示例工具发现项：

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

示例 MCP 发现项：

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

示例模型提供商发现项：

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

示例网络发现项：

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

示例 Gateway 网关暴露发现：

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

示例智能体工作区发现：

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

`doctor --lint` 和 `policy check` 为只读。

`doctor --fix` 只有在显式启用 `workspaceRepairs` 时，才会编辑由策略管理的工作区设置。如果没有选择启用，策略检查会报告它们将修复的内容，并保持设置不变。

在此版本中，修复可以禁用已在 OpenClaw 配置中启用、但被 `channels.denyRules` 拒绝的渠道。只有在策略文件已经过审核后，才启用 `workspaceRepairs`，因为有效的拒绝规则可以关闭已配置的渠道：

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

| 命令             | `0`                                      | `1`                                                | `2`                |
| ---------------- | ---------------------------------------- | -------------------------------------------------- | ------------------ |
| `policy check`   | 阈值下没有发现项。                       | 一个或多个发现项达到阈值。                         | 参数或运行时失败。 |
| `policy compare` | 策略文件至少与基线同样严格。             | 策略文件无效、缺失，或比基线规则更宽松。           | 参数或运行时失败。 |
| `policy watch`   | 没有发现项，且已接受的哈希是最新的。     | 存在发现项，或已接受的证明已过期。                 | 参数或运行时失败。 |

## 相关内容

- [Doctor lint mode](/zh-CN/cli/doctor#lint-mode)
- [路径 CLI](/zh-CN/cli/path)
