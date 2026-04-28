---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大载荷
    - 查看哪些诊断数据会被记录或脱敏
summary: 为错误报告创建可共享的 Gateway 网关诊断包
title: 诊断导出
x-i18n:
    generated_at: "2026-04-28T22:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以为错误报告创建本地诊断 zip。它会组合经过清理的 Gateway 网关状态、健康状况、日志、配置结构，以及最近的不含载荷的稳定性事件。

在审核之前，请像对待密钥一样对待诊断包。它们的设计目标是省略或遮盖载荷和凭证，但仍会汇总本地 Gateway 网关日志和主机级运行时状态。

## 快速开始

```bash
openclaw gateway diagnostics export
```

该命令会打印写入的 zip 路径。要选择路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

所有者可以在聊天中使用 `/diagnostics [note]` 请求本地 Gateway 网关导出。当错误发生在真实对话中，并且你想要一份可复制粘贴的支持报告时，请使用它：

1. 在你发现问题的对话中发送 `/diagnostics`。如果有帮助，可以添加简短备注，例如 `/diagnostics bad tool choice`。
2. OpenClaw 会发送诊断前言，并请求一次明确的 exec 批准。该批准会运行 `openclaw gateway diagnostics export --json`。不要通过 allow-all 规则批准诊断。
3. 批准后，OpenClaw 会回复一份可粘贴的报告，其中包含本地包路径、清单摘要、隐私说明和相关会话 ID。

在群聊中，所有者仍然可以运行 `/diagnostics`，但 OpenClaw 不会把诊断详情发回共享聊天。它会通过私有批准路由，将前言、批准提示、Gateway 网关导出结果，以及 Codex 会话/线程明细发送给所有者。群聊只会收到一条简短通知，说明诊断流程已私下发送。如果 OpenClaw 找不到私有所有者路由，该命令会默认失败，并要求所有者从私信中运行它。

当活动的 OpenClaw 会话正在使用原生 OpenAI Codex harness 时，同一个 exec 批准也会覆盖一次 OpenAI 反馈上传，上传对象是 OpenClaw 已知的 Codex 运行时线程。该上传与本地 Gateway 网关 zip 分开，并且只会出现在 Codex harness 会话中。批准前，提示会说明批准诊断也会发送 Codex 反馈，但不会列出 Codex 会话或线程 ID。批准后，聊天回复会列出已发送到 OpenAI 服务器的线程对应的渠道、OpenClaw 会话 ID、Codex 线程 ID 和本地恢复命令。如果你拒绝或忽略批准，OpenClaw 不会运行导出，不会发送 Codex 反馈，也不会打印 Codex ID。

这让常见的 Codex 调试循环很短：在 Telegram、Discord 或其他渠道中发现异常行为，运行 `/diagnostics`，批准一次，和支持人员共享报告，然后如果想自己检查原生 Codex 线程，就在本地运行打印出的 `codex resume <thread-id>` 命令。该检查工作流请参见 [Codex harness](/zh-CN/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)。

## 导出内容

zip 包含：

- `summary.md`：面向支持人员的可读概览。
- `diagnostics.json`：配置、日志、状态、健康状况和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过清理的配置结构和非密钥配置详情。
- 经过清理的日志摘要和最近经过遮盖的日志行。
- 尽力获取的 Gateway 网关状态和健康状况快照。
- `stability/latest.json`：可用时最新持久化的稳定性包。

即使 Gateway 网关不健康，导出也很有用。如果 Gateway 网关无法响应状态或健康状况请求，在可用时仍会收集本地日志、配置结构和最新稳定性包。

## 隐私模型

诊断的设计目标是可共享。导出会保留有助于调试的运维数据，例如：

- 子系统名称、插件 ID、提供商 ID、渠道 ID 和已配置模式
- 状态码、耗时、字节数、队列状态和内存读数
- 经过清理的日志元数据和经过遮盖的运维消息
- 配置结构和非密钥功能设置

导出会省略或遮盖：

- 聊天文本、提示、指令、webhook 正文和工具输出
- 凭证、API key、令牌、cookie 和密钥值
- 原始请求或响应正文
- 账号 ID、消息 ID、原始会话 ID、主机名和本地用户名

当日志消息看起来像用户、聊天、提示或工具载荷文本时，导出只会保留消息已被省略这一事实以及字节数。

## 稳定性记录器

默认情况下，启用诊断时，Gateway 网关会记录有界的、不含载荷的稳定性流。它用于记录运维事实，而不是内容。

当 Gateway 网关持续运行但 Node.js 事件循环或 CPU 看起来饱和时，同一个诊断心跳会记录存活性警告。这些 `diagnostic.liveness.warning` 事件包含事件循环延迟、事件循环利用率、CPU 核心比率，以及活动/等待/排队会话计数。它们本身不会重启 Gateway 网关。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后，检查最新持久化的稳定性包：

```bash
openclaw gateway stability --bundle latest
```

从最新持久化包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当存在事件时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 常用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入到指定 zip 路径。
- `--log-lines <count>`：要包含的最大清理后日志行数。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于状态和健康状况快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于状态和健康状况快照的 Gateway 网关令牌。
- `--password <password>`：用于状态和健康状况快照的 Gateway 网关密码。
- `--timeout <ms>`：状态和健康状况快照超时时间。
- `--no-stability-bundle`：跳过持久化稳定性包查找。
- `--json`：打印机器可读的导出元数据。

## 禁用诊断

诊断默认启用。要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少错误报告细节。它不会影响正常的 Gateway 网关日志记录。

## 相关

- [健康检查](/zh-CN/gateway/health)
- [Gateway 网关 CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 网关协议](/zh-CN/gateway/protocol#system-and-identity)
- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于将诊断流式传输到收集器的独立流程
