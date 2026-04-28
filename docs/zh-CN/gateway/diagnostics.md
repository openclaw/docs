---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大负载
    - 查看哪些诊断数据会被记录或脱敏
summary: 为错误报告创建可共享的 Gateway 网关诊断包
title: 诊断导出
x-i18n:
    generated_at: "2026-04-28T11:51:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: eca1381cfd603eb659a24cd92f2f79a7ed6a8aaf7f451d3662713e0be0ee637e
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以创建一个本地诊断 zip 文件，可安全附加到错误报告中。它会合并经过清理的 Gateway 网关状态、健康状况、日志、配置形状以及最近的不含载荷的稳定性事件。

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

## 导出内容

该 zip 包括：

- `summary.md`：供支持人员阅读的人类可读概览。
- `diagnostics.json`：配置、日志、状态、健康状况和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过清理的配置形状和非机密配置详情。
- 经过清理的日志摘要和最近已脱敏的日志行。
- 尽力获取的 Gateway 网关状态和健康状况快照。
- `stability/latest.json`：最新持久化的稳定性包（如果可用）。

即使 Gateway 网关不健康，导出仍然有用。如果 Gateway 网关无法响应状态或健康状况请求，在可用时仍会收集本地日志、配置形状和最新稳定性包。

## 隐私模型

诊断设计为可共享。导出会保留有助于调试的运行数据，例如：

- 子系统名称、插件 ID、提供商 ID、渠道 ID 和已配置模式
- 状态码、持续时间、字节数、队列状态和内存读数
- 经过清理的日志元数据和已脱敏的运行消息
- 配置形状和非机密功能设置

导出会省略或脱敏：

- 聊天文本、提示、指令、webhook 正文和工具输出
- 凭证、API 密钥、令牌、cookie 和机密值
- 原始请求或响应正文
- 账号 ID、消息 ID、原始会话 ID、主机名和本地用户名

当日志消息看起来像用户、聊天、提示或工具载荷文本时，导出只会保留“消息已省略”以及字节数。

## 稳定性记录器

默认情况下，启用诊断时，Gateway 网关会记录一个有界且不含载荷的稳定性流。它用于记录运行事实，而不是内容。

当 Gateway 网关持续运行但 Node.js 事件循环或 CPU 看起来已饱和时，同一个诊断心跳会记录存活性警告。这些 `diagnostic.liveness.warning` 事件包含事件循环延迟、事件循环利用率、CPU 核心比率，以及活跃/等待/排队的会话数量。它们本身不会重启 Gateway 网关。

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

从最新持久化的包创建诊断 zip：

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

- `--output <path>`：写入指定的 zip 路径。
- `--log-lines <count>`：要包含的已清理日志行数上限。
- `--log-bytes <bytes>`：要检查的日志字节数上限。
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

禁用诊断会减少错误报告详情。它不会影响正常的 Gateway 网关日志记录。

## 相关内容

- [健康检查](/zh-CN/gateway/health)
- [Gateway 网关 CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 网关协议](/zh-CN/gateway/protocol#system-and-identity)
- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于将诊断流式传输到收集器的独立流程
