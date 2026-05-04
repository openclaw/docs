---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大载荷
    - 查看记录或脱敏了哪些诊断数据
summary: 为错误报告创建可共享的 Gateway 网关诊断包
title: 诊断信息导出
x-i18n:
    generated_at: "2026-05-04T22:38:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以为 bug 报告创建本地诊断 zip。它会组合经过清理的 Gateway 网关 Status、健康状态、日志、配置形态，以及近期不含载荷的稳定性事件。

在你审阅诊断包之前，请把它们当作密钥处理。它们的设计目标是省略或遮盖载荷和凭证，但仍会概述本地 Gateway 网关日志和主机级运行时状态。

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

所有者可以在聊天中使用 `/diagnostics [note]` 请求本地 Gateway 网关导出。当 bug 发生在真实对话中，并且你想为支持人员提供一份可复制粘贴的报告时，请使用它：

1. 在你发现问题的对话中发送 `/diagnostics`。如果有帮助，可以添加简短说明，例如 `/diagnostics bad tool choice`。
2. OpenClaw 会发送诊断前言，并请求一次明确的执行批准。该批准会运行 `openclaw gateway diagnostics export --json`。不要通过允许全部规则批准诊断。
3. 批准后，OpenClaw 会回复一份可粘贴报告，其中包含本地包路径、清单摘要、隐私说明和相关会话 ID。

在群聊中，所有者仍然可以运行 `/diagnostics`，但 OpenClaw 不会把诊断详细信息发回共享聊天。它会通过私有批准路径向所有者发送前言、批准提示、Gateway 网关导出结果，以及 Codex 会话/线程明细。群聊只会收到一条简短通知，说明诊断流程已私下发送。如果 OpenClaw 找不到私有所有者路径，该命令会关闭失败，并要求所有者从私信中运行。

当活动的 OpenClaw 会话使用原生 OpenAI Codex harness 时，同一次执行批准还会覆盖一次 OpenAI 反馈上传，上传对象是 OpenClaw 知道的 Codex 运行时线程。该上传独立于本地 Gateway 网关 zip，并且只会出现在 Codex harness 会话中。批准前，提示会说明批准诊断也会发送 Codex 反馈，但不会列出 Codex 会话或线程 ID。批准后，聊天回复会列出已发送到 OpenAI 服务器的渠道、OpenClaw 会话 ID、Codex 线程 ID 和本地恢复命令。如果你拒绝或忽略批准，OpenClaw 不会运行导出，不会发送 Codex 反馈，也不会打印 Codex ID。

这让常见的 Codex 调试循环变短：在 Telegram、Discord 或其他渠道中发现异常行为，运行 `/diagnostics`，批准一次，与支持人员共享报告，然后如果你想亲自检查原生 Codex 线程，就在本地运行打印出的 `codex resume <thread-id>` 命令。有关该检查工作流，请参阅 [Codex harness](/zh-CN/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)。

## 导出包含什么

zip 包含：

- `summary.md`：供支持人员阅读的人类可读概览。
- `diagnostics.json`：配置、日志、Status、健康状态和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过清理的配置形态和非密钥配置详情。
- 经过清理的日志摘要和近期已遮盖的日志行。
- 尽力获取的 Gateway 网关 Status 和健康状态快照。
- `stability/latest.json`：可用时的最新持久化稳定性包。

即使 Gateway 网关不健康，导出仍然有用。如果 Gateway 网关无法响应 Status 或健康状态请求，本地日志、配置形态和最新稳定性包在可用时仍会被收集。

## 隐私模型

诊断的设计目标是可共享。导出会保留有助于调试的运维数据，例如：

- 子系统名称、插件 ID、提供商 ID、渠道 ID 和已配置模式
- 状态码、时长、字节数、队列状态和内存读数
- 经过清理的日志元数据和已遮盖的运维消息
- 配置形态和非密钥功能设置

导出会省略或遮盖：

- 聊天文本、提示、指令、webhook 正文和工具输出
- 凭证、API key、令牌、Cookie 和密钥值
- 原始请求或响应正文
- 账号 ID、消息 ID、原始会话 ID、主机名和本地用户名

当日志消息看起来像用户、聊天、提示或工具载荷文本时，导出只会保留消息已被省略这一事实和字节数。

## 稳定性记录器

默认情况下，在诊断启用时，Gateway 网关会记录有界且不含载荷的稳定性流。它用于运维事实，而不是内容。

当 Gateway 网关持续运行但 Node.js 事件循环或 CPU 看起来已饱和时，同一个诊断 Heartbeat 会记录存活性样本。这些 `diagnostic.liveness.warning` 事件包含事件循环延迟、事件循环利用率、CPU 核心比率、活动/等待/排队会话计数、已知时的当前启动/运行时阶段、近期阶段跨度，以及有界的活动/排队工作标签。空闲样本会以 `info` 级别保留在遥测中。只有当工作正在等待或排队，或者活动工作与持续的事件循环延迟重叠时，存活性样本才会成为 Gateway 网关警告。其他方面健康的后台工作期间出现的瞬时最大延迟尖峰会保留在调试日志中。它们本身不会重启 Gateway 网关。

启动阶段还会发出 `diagnostic.phase.completed` 事件，其中包含挂钟时间和 CPU 计时。当最后一次桥接进度看起来是终止性的，例如原始响应项或响应完成事件，但 Gateway 网关仍认为嵌入式运行处于活动状态时，停滞的嵌入式运行诊断会标记 `terminalProgressStale=true`。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后，检查最新持久化稳定性包：

```bash
openclaw gateway stability --bundle latest
```

从最新持久化包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当存在事件时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 有用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入到指定 zip 路径。
- `--log-lines <count>`：要包含的最大清理后日志行数。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于 Status 和健康状态快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于 Status 和健康状态快照的 Gateway 网关令牌。
- `--password <password>`：用于 Status 和健康状态快照的 Gateway 网关密码。
- `--timeout <ms>`：Status 和健康状态快照超时。
- `--no-stability-bundle`：跳过持久化稳定性包查找。
- `--json`：打印机器可读导出元数据。

## 禁用诊断

诊断默认启用。要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少 bug 报告详情。它不会影响正常的 Gateway 网关日志记录。

## 相关

- [健康检查](/zh-CN/gateway/health)
- [Gateway 网关 CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 网关协议](/zh-CN/gateway/protocol#system-and-identity)
- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于将诊断流式传输到收集器的独立流程
