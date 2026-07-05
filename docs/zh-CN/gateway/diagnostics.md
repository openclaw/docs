---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大负载
    - 查看记录或修订了哪些诊断数据
summary: 创建可共享的 Gateway 网关诊断包用于错误报告
title: 诊断导出
x-i18n:
    generated_at: "2026-07-05T11:17:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以为错误报告构建本地诊断 `.zip`：经过清理的 Gateway 网关
状态、健康、日志、配置形状，以及最近的不含载荷稳定性事件。

在审查前，请像处理密钥一样处理诊断包。载荷和凭据按设计会被遮盖，但该包仍会汇总本地 Gateway 网关日志和主机级运行时状态。

## 快速开始

```bash
openclaw gateway diagnostics export
```

打印写入的 zip 路径。选择输出路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

所有者可以在任何对话中运行 `/diagnostics [note]`，请求将本地
Gateway 网关导出为一份可复制粘贴的支持报告：

1. 发送 `/diagnostics`，可选择附带一条简短备注（`/diagnostics bad tool choice`）。
2. OpenClaw 会发送前言并请求一次明确的 exec 审批，该审批会运行
   `openclaw gateway diagnostics export --json`。不要通过允许所有规则批准诊断。
3. 批准后，OpenClaw 会回复本地包路径、清单摘要、隐私说明和相关会话 id。

在群聊中，所有者仍可运行 `/diagnostics`，但 OpenClaw 会将导出结果、审批提示以及 Codex 会话/线程拆分私下发送给所有者。群组只会看到一条简短通知，说明诊断已私下发送。如果不存在私密所有者路由，该命令会失败关闭，并要求所有者从私信中运行。

当活动会话使用原生 OpenAI Codex harness 时，同一个 exec 审批还会覆盖 OpenClaw 已知 Codex 线程的 OpenAI 反馈上传。该上传独立于本地 Gateway 网关 zip，并且只会发生在 Codex harness 会话中。审批提示会说明批准也会发送 Codex 反馈，但不会列出 Codex 会话或线程 id。批准后，回复会列出已发送给 OpenAI 的频道、OpenClaw 会话 id、Codex 线程 id，以及这些线程的本地恢复命令。拒绝或忽略审批会跳过导出、Codex 反馈上传和 Codex id 列表。

这让 Codex 调试循环变短：在某个渠道中发现异常行为，运行 `/diagnostics`，批准一次，共享报告，然后如果想自己检查线程，就在本地运行打印出的 `codex resume <thread-id>` 命令。参见 [Codex harness](/zh-CN/plugins/codex-harness#inspect-codex-threads-locally)。

## 导出包含什么

- `summary.md`：供支持使用的人类可读概览。
- `diagnostics.json`：配置、日志、状态、健康和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过清理的配置形状和非密钥配置详情。
- 经过清理的日志摘要和最近已遮盖的日志行。
- 尽力获取的 Gateway 网关状态和健康快照。
- `stability/latest.json`：可用时为最新持久化稳定性包。

即使 Gateway 网关不健康，该导出仍然有用：如果状态/健康请求失败，仍会在可用时收集本地日志、配置形状和最新稳定性包。

## 隐私模型

保留：子系统名称、插件 id、提供商 id、渠道 id、已配置模式、状态码、持续时间、字节数、队列状态、内存读数、经过清理的日志元数据、已遮盖的操作消息、配置形状和非密钥功能设置。

省略或遮盖：聊天文本、提示词、指令、webhook 正文、工具输出、凭据、API key、token、cookie、密钥值、原始请求/响应正文、账户 id、消息 id、原始会话 id、主机名和本地用户名。

当日志消息看起来像用户、聊天、提示词或工具载荷文本时，导出只会保留消息已被省略这一事实及其字节数。

## 稳定性记录器

默认情况下，启用诊断时，Gateway 网关会记录一个有界且不含载荷的稳定性流。它捕获的是操作事实，而不是内容。

同一个 heartbeat 还会在事件循环或 CPU 看起来饱和时采样活跃性，发出 `diagnostic.liveness.warning` 事件，其中包含事件循环延迟、事件循环利用率、CPU 核心比率、活动/等待/排队会话数、当前启动/运行时阶段（如果已知）、最近阶段跨度和有界工作标签。只有当工作正在等待或排队，或者活动工作与持续事件循环延迟重叠时，这些事件才会成为 Gateway 网关 `warn` 级别日志行；否则它们以 `debug` 级别记录。空闲活跃性样本仍会被记录为诊断事件，但其本身永远不会升级为警告。

启动阶段会发出 `diagnostic.phase.completed` 事件，其中包含墙钟和 CPU 计时。当最后一次桥接进度看起来已经终止（例如原始响应项或响应完成事件），但 Gateway 网关仍认为嵌入式运行处于活动状态时，停滞的嵌入式运行诊断会标记 `terminalProgressStale=true`。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后检查最新持久化包：

```bash
openclaw gateway stability --bundle latest
```

从最新持久化包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

存在事件时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 有用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | 默认值                                                                        | 描述                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 写入到指定 zip 路径（或目录）。                    |
| `--log-lines <count>`   | `5000`                                                                        | 要包含的最大清理后日志行数。                       |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 要检查的最大日志字节数。                           |
| `--url <url>`           | -                                                                             | 用于状态/健康快照的 Gateway 网关 WebSocket URL。   |
| `--token <token>`       | -                                                                             | 用于状态/健康快照的 Gateway 网关 token。           |
| `--password <password>` | -                                                                             | 用于状态/健康快照的 Gateway 网关密码。             |
| `--timeout <ms>`        | `3000`                                                                        | 状态/健康快照超时。                                |
| `--no-stability-bundle` | 关闭                                                                          | 跳过持久化稳定性包查找。                           |
| `--json`                | 关闭                                                                          | 打印机器可读导出元数据。                           |

## 禁用诊断

诊断默认启用。要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少错误报告细节；它不会影响正常的 Gateway 网关日志。

关键内存压力快照默认关闭。要在普通诊断事件之外捕获 OOM 前稳定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

仅在主机能够承受关键内存压力期间额外文件系统扫描和快照写入时使用此功能。关闭快照时，普通内存压力事件仍会记录 RSS、堆、阈值和增长事实（`rss_threshold`、`heap_threshold`、`rss_growth`）。

## 相关

- [健康检查](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 网关协议](/zh-CN/gateway/protocol#rpc-method-families)
- [日志](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) - 用于将诊断流式传输到收集器的独立流程
