---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大负载
    - 检查记录或脱敏了哪些诊断数据
summary: 创建可分享的 Gateway 网关诊断包，用于错误报告
title: 诊断导出
x-i18n:
    generated_at: "2026-07-11T20:31:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以为错误报告生成本地诊断 `.zip`：经过清理的 Gateway 网关状态、健康信息、日志、配置结构，以及近期不含载荷的稳定性事件。

在审查前，应将诊断包视同机密信息。按照设计，载荷和凭据会被隐去，但诊断包仍会汇总本地 Gateway 网关日志和主机级运行时状态。

## 快速开始

```bash
openclaw gateway diagnostics export
```

输出写入的 zip 路径。选择输出路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

所有者可以在任何对话中运行 `/diagnostics [note]`，请求将本地 Gateway 网关导出为一份可复制粘贴的支持报告：

1. 发送 `/diagnostics`，可选择附加简短说明（`/diagnostics bad tool choice`）。
2. OpenClaw 会发送前置说明，并请求一次明确的 Exec 审批，以运行
   `openclaw gateway diagnostics export --json`。不要通过全量允许规则批准诊断操作。
3. 获得批准后，OpenClaw 会回复本地诊断包路径、清单摘要、隐私说明和相关会话 ID。

在群聊中，所有者仍可运行 `/diagnostics`，但 OpenClaw 会将导出结果、审批提示以及 Codex 会话/线程明细私下发送给所有者。群组中只会显示一条简短通知，说明诊断信息已私下发送。如果不存在面向所有者的私信路由，该命令会以安全方式失败，并要求所有者从私信中运行。

当活跃会话使用原生 OpenAI Codex harness 时，同一次 Exec 审批还会包含针对 OpenClaw 已知 Codex 线程的 OpenAI 反馈上传。该上传与本地 Gateway 网关 zip 分开，并且仅适用于 Codex harness 会话。审批提示会说明批准操作还会发送 Codex 反馈，但不会列出 Codex 会话或线程 ID。获得批准后，回复会列出渠道、OpenClaw 会话 ID、Codex 线程 ID，以及已发送至 OpenAI 的线程所对应的本地恢复命令。拒绝或忽略审批会跳过导出、Codex 反馈上传和 Codex ID 列表。

这样可以缩短 Codex 调试流程：在渠道中发现异常行为后，运行 `/diagnostics`，批准一次，分享报告；如果你想自行检查线程，再在本地运行输出的 `codex resume <thread-id>` 命令。请参阅 [Codex harness](/zh-CN/plugins/codex-harness#inspect-codex-threads-locally)。

## 导出内容

- `summary.md`：供支持人员阅读的概览。
- `diagnostics.json`：配置、日志、状态、健康信息和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过清理的配置结构和非机密配置详情。
- 经过清理的日志摘要和近期已隐去敏感信息的日志行。
- 尽力获取的 Gateway 网关状态和健康快照。
- `stability/latest.json`：最新持久化稳定性诊断包（如有）。

即使 Gateway 网关运行不正常，导出仍然有用：如果状态/健康请求失败，仍会尽可能收集本地日志、配置结构和最新的稳定性诊断包。

## 隐私模型

保留：子系统名称、插件 ID、提供商 ID、渠道 ID、已配置模式、状态码、持续时间、字节数、队列状态、内存读数、经过清理的日志元数据、已隐去敏感信息的运行消息、配置结构，以及非机密功能设置。

省略或隐去：聊天文本、提示词、指令、Webhook 正文、工具输出、凭据、API 密钥、令牌、Cookie、机密值、原始请求/响应正文、账户 ID、消息 ID、原始会话 ID、主机名和本地用户名。

当日志消息看起来包含用户、聊天、提示词或工具载荷文本时，导出中仅保留消息已省略的标记及其字节数。

## 稳定性记录器

启用诊断时，Gateway 网关默认记录有界且不含载荷的稳定性事件流。它捕获的是运行事实，而非内容。

当事件循环或 CPU 看起来饱和时，同一 Heartbeat 还会采样存活状态，并发出 `diagnostic.liveness.warning` 事件，其中包含事件循环延迟、事件循环利用率、CPU 核心占用比、活跃/等待/排队的会话数量、当前启动/运行时阶段（如已知）、近期阶段跨度和有界工作标签。只有在有工作正在等待或排队，或者活跃工作与持续的事件循环延迟重叠时，这些事件才会成为 Gateway 网关 `warn` 级别日志行；否则会以 `debug` 级别记录。空闲时的存活状态样本仍会记录为诊断事件，但其本身绝不会升级为警告。

启动阶段会发出 `diagnostic.phase.completed` 事件，其中包含墙上时钟时间和 CPU 计时。对于停滞的嵌入式运行诊断，如果最后一次桥接进度看起来已到达终止状态（例如原始响应项或响应完成事件），但 Gateway 网关仍认为嵌入式运行处于活跃状态，则会标记 `terminalProgressStale=true`。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后，检查最新的持久化诊断包：

```bash
openclaw gateway stability --bundle latest
```

根据最新的持久化诊断包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

存在事件时，持久化诊断包位于 `~/.openclaw/logs/stability/` 下。

## 实用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| 标志                    | 默认值                                                                        | 说明                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 写入指定的 zip 路径（或目录）。                    |
| `--log-lines <count>`   | `5000`                                                                        | 要包含的经过清理的日志行数上限。                   |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 要检查的日志字节数上限。                           |
| `--url <url>`           | -                                                                             | 用于状态/健康快照的 Gateway 网关 WebSocket URL。   |
| `--token <token>`       | -                                                                             | 用于状态/健康快照的 Gateway 网关令牌。             |
| `--password <password>` | -                                                                             | 用于状态/健康快照的 Gateway 网关密码。             |
| `--timeout <ms>`        | `3000`                                                                        | 状态/健康快照超时时间。                            |
| `--no-stability-bundle` | 关闭                                                                          | 跳过查找持久化稳定性诊断包。                       |
| `--json`                | 关闭                                                                          | 输出机器可读的导出元数据。                         |

## 禁用诊断

诊断功能默认启用。要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少错误报告中的详细信息，但不会影响正常的 Gateway 网关日志记录。

关键内存压力快照默认关闭。要在正常诊断事件之外捕获 OOM 前的稳定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

仅应在能够承受关键内存压力期间额外执行文件系统扫描和快照写入的主机上使用此功能。关闭快照时，正常的内存压力事件仍会记录 RSS、堆、阈值和增长情况（`rss_threshold`、`heap_threshold`、`rss_growth`）。

## 相关内容

- [健康检查](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 网关协议](/zh-CN/gateway/protocol#rpc-method-families)
- [日志](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) - 用于将诊断信息流式传输至收集器的独立流程
