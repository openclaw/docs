---
read_when:
    - 你正在安装、配置或审计策略插件
summary: 添加由策略支持的 Doctor 检查，以验证工作区合规性。
title: 策略插件
x-i18n:
    generated_at: "2026-07-11T20:49:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy 插件

添加由策略支持的 Doctor 检查，以验证工作区合规性。

## 分发

- 软件包：`@openclaw/policy`
- 安装方式：内置于 OpenClaw

## 功能界面

插件

<!-- openclaw-plugin-reference:manual-start -->

## 行为

Policy 插件为策略管理的 OpenClaw 设置和受治理的工作区声明提供 Doctor 健康检查。目前，Policy 涵盖渠道合规性、受治理的工具元数据、MCP 服务器安全状态、模型提供商安全状态、专用网络访问安全状态、Gateway 网关暴露安全状态、Agent 工作区/工具安全状态、已配置的全局/按 Agent 工具安全状态、已配置的沙箱运行时安全状态、入口/渠道访问安全状态、数据处理安全状态，以及 OpenClaw 配置密钥提供商/身份验证配置文件安全状态。

Policy 将编写的要求存储在 `policy.jsonc` 中，将现有 OpenClaw 设置和工作区声明作为证据进行观测，并通过 `openclaw policy check` 和 `openclaw doctor --lint` 报告偏差。检查结果无异常时，会输出策略、证据、发现项和证明哈希，操作员可将其记录用于审计。

`openclaw policy compare --baseline <file>` 会将一个策略文件与另一个策略文件进行比较。它仅检查配置层面的合规性：使用策略规则元数据验证被检查的策略没有缺失编写的基准策略中的要求，也不比基准策略宽松；它不会检查运行时状态、凭据或密钥值。

工具安全状态规则可以要求使用已批准的配置文件、仅限工作区的文件系统工具、范围受限的 Exec 安全性/询问/主机设置、禁用提升权限模式、精确匹配的 `alsoAllow` 条目，以及必需的工具拒绝条目。证据会记录新增的 `alsoAllow` 条目，因为它们可能扩大工具的实际权限范围。这些检查仅观测配置合规性；不会读取运行时审批状态，也不会添加运行时强制措施。

沙箱安全状态规则可以要求使用已批准的沙箱模式/后端、禁止容器使用主机网络、禁止加入容器命名空间、要求容器以只读方式挂载、禁止挂载容器运行时套接字和使用不受限制的容器配置文件，以及要求限定沙箱浏览器的 CDP 来源范围。这些检查仅观测配置合规性；不会读取运行时审批状态、检查正在运行的容器，也不会添加运行时强制措施。

数据处理规则可以要求对日志中的敏感信息进行脱敏、禁止遥测内容采集、要求执行会话保留维护，以及禁止对会话转录内容建立记忆索引。这些检查仅观测配置合规性；不会检查原始日志、遥测导出、转录内容、记忆文件、密钥或个人数据。

`scopes.<scopeName>` 下的命名策略作用域可以为其列出的选择器添加更严格的常规策略部分。`agentIds` 支持 `tools`、`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支持 `ingress.channels`。
未在 `agents.list[]` 中明确列出的运行时 Agent ID，会根据继承的全局/默认安全状态进行检查，而不会在缺少证据的情况下被静默判定为通过。`policy.jsonc` 中的每个作用域都必须对其选择器有效且可执行。叠加规则属于附加要求，因此不会削弱顶层策略；当同一份观测到的配置同时违反两个作用域时，它们可以各自产生发现项。

<!-- openclaw-plugin-reference:manual-end -->

## 相关文档

- [策略](/zh-CN/cli/policy)
