---
read_when:
    - 你想快速检查正在运行的 Gateway 网关的健康状态
summary: '`openclaw health` 的 CLI 参考（通过 RPC 获取 Gateway 网关健康快照）'
title: 健康检查
x-i18n:
    generated_at: "2026-04-24T04:01:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

从正在运行的 Gateway 网关获取健康状态。

选项：

- `--json`：机器可读输出
- `--timeout <ms>`：连接超时时间（毫秒，默认 `10000`）
- `--verbose`：详细日志
- `--debug`：`--verbose` 的别名

示例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

说明：

- 默认情况下，`openclaw health` 会向正在运行的 Gateway 网关请求其健康状态快照。当 Gateway 网关已经有新的缓存快照时，它可以返回该缓存载荷，并在后台刷新。
- `--verbose` 会强制执行实时探测、打印 Gateway 网关连接详情，并将人类可读输出扩展为涵盖所有已配置的账户和智能体。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关健康状态](/zh-CN/gateway/health)
