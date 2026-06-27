---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大载荷
    - 查看记录或隐去的诊断数据
summary: 为错误报告创建可分享的 Gateway 网关诊断包
title: 诊断导出
x-i18n:
    generated_at: "2026-06-27T02:00:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以为错误报告创建本地诊断 zip。它会组合已清理的 Gateway 网关状态、健康、日志、配置形状以及最近的不含载荷的稳定性事件。

在审阅之前，请像对待机密一样对待诊断包。它们设计为省略或编辑载荷和凭据，但仍会汇总本地 Gateway 网关日志和主机级运行时状态。

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

所有者可以在聊天中使用 `/diagnostics [note]` 请求本地 Gateway 网关导出。当错误发生在真实对话中，并且你希望获得一份可复制粘贴的支持报告时，请使用它：

1. 在你注意到问题的对话中发送 `/diagnostics`。如果有帮助，可以添加简短备注，例如 `/diagnostics bad tool choice`。
2. OpenClaw 会发送诊断前言，并请求一次明确的 exec 审批。该审批会运行 `openclaw gateway diagnostics export --json`。不要通过允许所有规则批准诊断。
3. 审批后，OpenClaw 会回复一份可粘贴报告，其中包含本地包路径、清单摘要、隐私说明和相关会话 ID。

在群聊中，所有者仍然可以运行 `/diagnostics`，但 OpenClaw 不会把诊断详情发回共享聊天。它会通过私有审批路径向所有者发送前言、审批提示、Gateway 网关导出结果，以及 Codex 会话/线程明细。群聊只会收到一条简短通知，说明诊断流程已私下发送。如果 OpenClaw 找不到私有所有者路径，该命令会以失败关闭方式终止，并要求所有者从私信中运行它。

当活动 OpenClaw 会话使用原生 OpenAI Codex harness 时，同一次 exec 审批还会覆盖 OpenClaw 已知的 Codex 运行时线程的 OpenAI 反馈上传。该上传独立于本地 Gateway 网关 zip，并且只会出现在 Codex harness 会话中。审批前，提示会说明批准诊断也会发送 Codex 反馈，但不会列出 Codex 会话或线程 ID。审批后，聊天回复会列出已发送到 OpenAI 服务器的频道、OpenClaw 会话 ID、Codex 线程 ID，以及本地恢复命令。如果你拒绝或忽略审批，OpenClaw 不会运行导出，不会发送 Codex 反馈，也不会打印 Codex ID。

这让常见的 Codex 调试循环变得很短：在 Telegram、Discord 或其他渠道中注意到异常行为，运行 `/diagnostics`，审批一次，把报告分享给支持人员，然后如果你想自己检查原生 Codex 线程，就在本地运行打印出的 `codex resume <thread-id>` 命令。有关该检查工作流，请参阅 [Codex harness](/zh-CN/plugins/codex-harness#inspect-codex-threads-locally)。

## 导出内容

zip 包括：

- `summary.md`：面向支持人员的可读概览。
- `diagnostics.json`：配置、日志、状态、健康和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 已清理的配置形状和非机密配置详情。
- 已清理的日志摘要和最近已编辑的日志行。
- 尽力获取的 Gateway 网关状态和健康快照。
- `stability/latest.json`：最新持久化稳定性包（如果可用）。

即使 Gateway 网关不健康，导出仍然有用。如果 Gateway 网关无法响应状态或健康请求，本地日志、配置形状和最新稳定性包在可用时仍会被收集。

## 隐私模型

诊断设计为可共享。导出会保留有助于调试的运行数据，例如：

- 子系统名称、插件 ID、提供商 ID、渠道 ID 和已配置模式
- 状态码、耗时、字节数、队列状态和内存读数
- 已清理的日志元数据和已编辑的运行消息
- 配置形状和非机密功能设置

导出会省略或编辑：

- 聊天文本、提示、指令、webhook 正文和工具输出
- 凭据、API key、token、cookie 和机密值
- 原始请求或响应正文
- 账号 ID、消息 ID、原始会话 ID、主机名和本地用户名

当日志消息看起来像用户、聊天、提示或工具载荷文本时，导出只会保留一条消息已被省略以及字节数。

## 稳定性记录器

默认情况下，当诊断启用时，Gateway 网关会记录有界、不含载荷的稳定性流。它用于运行事实，而不是内容。

当 Gateway 网关保持运行但 Node.js event loop 或 CPU 看起来饱和时，同一个诊断心跳会记录存活样本。这些 `diagnostic.liveness.warning` 事件包括 event-loop 延迟、event-loop 利用率、CPU 核心比、活动/等待/排队会话数量、已知时的当前启动/运行时阶段、最近阶段跨度，以及有界的活动/排队工作标签。空闲样本会以 `info` 级别留在遥测中。只有当工作正在等待或排队，或活动工作与持续的 event-loop 延迟重叠时，存活样本才会成为 Gateway 网关警告。在其他健康后台工作期间的瞬时最大延迟峰值会保留在调试日志中。它们本身不会重启 Gateway 网关。

启动阶段还会发出带有挂钟和 CPU 计时的 `diagnostic.phase.completed` 事件。当最后的桥接进度看起来像终止状态（例如原始响应项或响应完成事件），但 Gateway 网关仍认为嵌入式运行处于活动状态时，停滞的嵌入式运行诊断会标记 `terminalProgressStale=true`。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后，检查最新的持久化稳定性包：

```bash
openclaw gateway stability --bundle latest
```

从最新的持久化包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当事件存在时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 有用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入到指定 zip 路径。
- `--log-lines <count>`：要包含的最大已清理日志行数。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于状态和健康快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于状态和健康快照的 Gateway 网关 token。
- `--password <password>`：用于状态和健康快照的 Gateway 网关密码。
- `--timeout <ms>`：状态和健康快照超时。
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

禁用诊断会减少错误报告详情。它不会影响正常的 Gateway 网关日志。

关键内存压力快照默认关闭。要保留诊断事件，并同时捕获 OOM 前的稳定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

仅在能够承受关键内存压力期间额外文件系统扫描和快照写入的主机上使用此项。当快照关闭时，普通内存压力事件仍会记录 RSS、堆、阈值和增长事实。

## 相关

- [健康检查](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 协议](/zh-CN/gateway/protocol#system-and-identity)
- [日志](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 将诊断流式传输到收集器的独立流程
