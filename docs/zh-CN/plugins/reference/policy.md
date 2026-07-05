---
read_when:
    - 你正在安装、配置或审计策略插件
summary: 为工作空间合规性添加由策略支撑的 Doctor 检查。
title: 策略插件
x-i18n:
    generated_at: "2026-07-05T01:58:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af7b8db65e0e7baac10481d2508c771e297e29e51174c706bdbdff8f39ad4f5
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy 插件

为工作区合规性添加由策略支持的 Doctor 检查。

## 分发

- 包：`@openclaw/policy`
- 安装路径：包含在 OpenClaw 中

## 表面

插件

<!-- openclaw-plugin-reference:manual-start -->

## 行为

Policy 插件为策略管理的 OpenClaw 设置和受治理的工作区声明提供 Doctor 健康检查。Policy 目前覆盖渠道合规性、受治理的工具元数据、MCP 服务器状态、模型提供商状态、私有网络访问状态、Gateway 网关暴露状态、Agent 工作区/工具和节点命令状态、已配置的全局/按 Agent 工具状态、已配置的沙箱运行时状态、入口/渠道访问状态、数据处理状态，以及 OpenClaw 配置密钥提供商/认证配置文件状态。

Policy 将编写的要求存储在 `policy.jsonc` 中，将现有 OpenClaw 设置和工作区声明作为证据进行观察，并通过 `openclaw policy check` 和 `openclaw doctor --lint` 报告漂移。干净的策略检查会输出策略、证据、发现和证明哈希，供操作人员记录以用于审计。

`openclaw policy compare --baseline <file>` 会将一个策略文件与另一个策略文件进行比较。它仅进行配置级合规性检查：使用策略规则元数据来验证被检查的策略没有缺失或弱于已编写的基线，并且不会检查运行时状态、凭证或密钥值。

工具状态规则可以要求使用已批准的配置文件、仅限工作区的文件系统工具、有界的 exec 安全/询问/主机设置、禁用提升权限模式、精确的 `alsoAllow` 条目，以及必需的工具拒绝条目。证据会记录附加的 `alsoAllow` 条目，因为它们可能扩大有效工具状态。这些检查仅观察配置合规性；它们不会读取运行时审批状态，也不会添加运行时强制执行。

Gateway 网关节点命令规则可以要求在 OpenClaw 配置 `gateway.nodes.denyCommands` 中存在精确且区分大小写的命令 ID，例如 `system.run`。这些检查仅观察配置合规性；它们不会添加运行时强制执行，也不会更改 Gateway 网关命令允许列表。

沙箱状态规则可以要求使用已批准的沙箱模式/后端、拒绝主机容器网络、拒绝容器命名空间加入、要求只读容器挂载、拒绝容器运行时套接字挂载和非受限容器配置文件，并要求沙箱浏览器 CDP 来源范围。
这些检查仅观察配置合规性；它们不会读取运行时审批状态、检查实时容器，也不会添加运行时强制执行。

数据处理规则可以要求敏感日志脱敏、拒绝遥测内容捕获、要求会话保留维护，并拒绝会话转录记忆索引。这些检查仅观察配置合规性；它们不会检查原始日志、遥测导出、转录、记忆文件、密钥或个人数据。

`scopes.<scopeName>` 下的命名策略作用域可以为其列出的选择器添加更严格的常规策略分区。`agentIds` 支持 `tools`、`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支持 `ingress.channels`。
未在 `agents.list[]` 中明确列出的运行时 Agent ID 会根据继承的全局/默认状态进行检查，而不是在没有证据的情况下静默通过。`policy.jsonc` 中存在的每个作用域都必须对其选择器有效且可强制执行。叠加规则是额外声明，因此它们不会削弱顶层策略，并且当同一项观察到的配置同时违反两个作用域时，可以产生自己的发现。

<!-- openclaw-plugin-reference:manual-end -->

## 相关文档

- [policy](/zh-CN/cli/policy)
