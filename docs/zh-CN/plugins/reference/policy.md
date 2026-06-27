---
read_when:
    - 你正在安装、配置或审计策略插件
summary: 添加由策略支撑的 Doctor 检查，用于验证工作区合规性。
title: 策略插件
x-i18n:
    generated_at: "2026-06-27T02:51:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy 插件

为工作区一致性添加由策略支持的 Doctor 检查。

## 分发

- 包：`@openclaw/policy`
- 安装路径：包含在 OpenClaw 中

## 接口面

插件

<!-- openclaw-plugin-reference:manual-start -->

## 行为

Policy 插件为策略管理的 OpenClaw 设置和受治理的工作区声明提供 Doctor 健康检查。策略目前覆盖渠道一致性、受治理的工具元数据、MCP 服务器态势、模型提供商态势、私有网络访问态势、Gateway 网关暴露态势、Agent 工作区/工具态势、已配置的全局/按 Agent 工具态势、已配置的沙箱运行时态势、入口/渠道访问态势、数据处理态势，以及 OpenClaw 配置密钥提供商/凭证配置文件态势。

Policy 将编写的要求存储在 `policy.jsonc` 中，将现有 OpenClaw 设置和工作区声明作为证据观察，并通过 `openclaw policy check` 和 `openclaw doctor --lint` 报告漂移。干净的策略检查会输出策略、证据、发现项和证明哈希，供操作员记录用于审计。

`openclaw policy compare --baseline <file>` 会将一个策略文件与另一个策略文件进行比较。它仅用于配置级一致性：它使用策略规则元数据来验证被检查的策略是否没有缺失，且不弱于编写的基线，并且不会检查运行时状态、凭据或密钥值。

工具态势规则可以要求已批准的配置文件、仅限工作区的文件系统工具、有边界的 exec 安全/询问/主机设置、禁用提升权限模式、精确的 `alsoAllow` 条目，以及必需的工具拒绝条目。证据会记录附加的 `alsoAllow` 条目，因为它们可能扩大有效工具态势。这些检查仅观察配置一致性；它们不会读取运行时审批状态，也不会添加运行时强制执行。

沙箱态势规则可以要求已批准的沙箱模式/后端、拒绝主机容器网络、拒绝容器命名空间加入、要求只读容器挂载、拒绝容器运行时套接字挂载和非受限容器配置文件，并要求沙箱浏览器 CDP 源范围。这些检查仅观察配置一致性；它们不会读取运行时审批状态、检查实时容器，也不会添加运行时强制执行。

数据处理规则可以要求敏感日志脱敏、拒绝遥测内容捕获、要求会话保留维护，并拒绝会话转录记忆索引。这些检查仅观察配置一致性；它们不会检查原始日志、遥测导出、转录、记忆文件、密钥或个人数据。

`scopes.<scopeName>` 下的命名策略范围可以为其列出的选择器添加更严格的普通策略章节。`agentIds` 支持 `tools`、`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支持 `ingress.channels`。未在 `agents.list[]` 中显式列出的运行时 Agent ID 会依据继承的全局/默认态势进行检查，而不是在没有证据的情况下静默通过。`policy.jsonc` 中存在的每个范围都必须对其选择器有效且可强制执行。叠加规则是附加声明，因此它们不会削弱顶层策略，并且当同一观察到的配置同时违反两个范围时，可以生成自己的发现项。

<!-- openclaw-plugin-reference:manual-end -->

## 相关文档

- [策略](/zh-CN/cli/policy)
