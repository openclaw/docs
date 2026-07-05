---
read_when:
    - 你正在安装、配置或审计策略插件
summary: 新增由策略支持的 Doctor 检查，用于验证工作区符合性。
title: 策略插件
x-i18n:
    generated_at: "2026-07-05T11:30:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy 插件

添加由策略支持的 Doctor 检查，用于验证工作区合规性。

## 分发

- 包：`@openclaw/policy`
- 安装路径：包含在 OpenClaw 中

## 表面

插件

<!-- openclaw-plugin-reference:manual-start -->

## 行为

Policy 插件为受策略管理的 OpenClaw
设置和受治理的工作区声明提供 Doctor 健康检查。Policy 目前覆盖频道
合规性、受治理的工具元数据、MCP 服务器态势、模型提供商态势、
私有网络访问态势、Gateway 网关暴露态势、Agent 工作区/工具
态势、已配置的全局/按 Agent 工具态势、已配置的沙箱运行时
态势、入口/渠道访问态势、数据处理态势，以及 OpenClaw 配置密钥
提供商/凭证配置档案态势。

Policy 将编写的要求存储在 `policy.jsonc` 中，将现有
OpenClaw 设置和工作区声明作为证据进行观察，并通过
`openclaw policy check` 和 `openclaw doctor --lint` 报告漂移。干净的策略
检查会输出策略、证据、发现和证明哈希，供操作员记录用于审计。

`openclaw policy compare --baseline <file>` 会将一个策略文件与另一个
策略文件进行比较。它只做配置级合规性检查：使用策略规则元数据
验证被检查的策略没有缺失，也没有弱于已编写的基线，并且不会检查
运行时状态、凭证或密钥值。

工具态势规则可以要求已批准的配置档案、仅限工作区的文件系统
工具、受限的 Exec 安全性/询问/主机设置、禁用提升权限模式、精确的
`alsoAllow` 条目，以及必需的工具拒绝条目。证据记录会包含附加的
`alsoAllow` 条目，因为它们可能扩大实际工具态势。
这些检查只观察配置合规性；它们不会读取运行时审批
状态，也不会添加运行时强制执行。

沙箱态势规则可以要求已批准的沙箱模式/后端，拒绝主机
容器网络，拒绝容器命名空间加入，要求只读容器
挂载，拒绝容器运行时套接字挂载和非受限容器配置档案，
并要求沙箱浏览器 CDP 来源范围。
这些检查只观察配置合规性；它们不会读取运行时审批
状态、检查实时容器，也不会添加运行时强制执行。

数据处理规则可以要求敏感日志脱敏、拒绝遥测
内容捕获、要求会话保留维护，并拒绝会话
转录记忆索引。这些检查只观察配置合规性；它们
不会检查原始日志、遥测导出、转录、记忆文件、密钥
或个人数据。

`scopes.<scopeName>` 下的命名策略范围可以为其列出的选择器添加更严格的普通策略
章节。`agentIds` 支持 `tools`、
`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支持
`ingress.channels`。
未在 `agents.list[]` 中显式列出的运行时 Agent ID 会根据继承的全局/默认态势进行检查，
而不是在没有证据的情况下静默通过。`policy.jsonc` 中存在的每个范围都必须对其选择器有效且可执行。
叠加规则是附加声明，因此它们不会削弱
顶层策略，并且当同一个已观察到的
配置同时违反两个范围时，可以产生各自的发现。

<!-- openclaw-plugin-reference:manual-end -->

## 相关文档

- [policy](/zh-CN/cli/policy)
