---
read_when:
    - 你想快速检查正在运行的 Gateway 网关的健康状态
summary: '`openclaw health` 的 CLI 参考（通过 RPC 获取的 Gateway 健康快照）'
title: 健康
x-i18n:
    generated_at: "2026-07-05T11:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

通过 WebSocket RPC 从正在运行的 Gateway 网关获取健康快照（CLI 不直接使用渠道 socket）。

## 选项

| 标志             | 默认值 | 描述                                                                       |
| ---------------- | ------- | --------------------------------------------------------------------------------- |
| `--json`         | `false` | 打印机器可读的 JSON，而不是文本。                                      |
| `--timeout <ms>` | `10000` | 连接超时时间，单位为毫秒。                                               |
| `--verbose`      | `false` | 强制执行实时探测，并展开所有已配置账户和智能体的输出。 |
| `--debug`        | `false` | `--verbose` 的别名。                                                            |

示例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 行为

- 不带 `--verbose` 时，Gateway 网关可以返回缓存快照（最长 60 秒内保持新鲜，并且与实时渠道运行时状态一致），并在后台刷新它，供下一个调用方使用。
- `--verbose` 强制执行实时探测（按渠道的账户探测），打印 Gateway 网关连接详情，并将人类可读输出展开到所有已配置账户和智能体，而不只是默认智能体。
- `--json` 始终返回完整快照：渠道、按账户的探测、插件加载状态、上下文引擎隔离状态、模型定价缓存状态、事件循环健康状态，以及按智能体的会话存储。

## 相关

- [CLI 参考](/zh-CN/cli)
- [`openclaw status`](/zh-CN/cli/status) — 本地诊断和渠道探测，不包含完整健康快照
- [Gateway 健康](/zh-CN/gateway/health)
