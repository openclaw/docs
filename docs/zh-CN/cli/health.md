---
read_when:
    - 你想快速检查正在运行的 Gateway 网关的健康状态
summary: '`openclaw health` 的 CLI 参考（通过 RPC 获取 Gateway 网关健康快照）'
title: health
x-i18n:
    generated_at: "2026-04-05T08:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

从正在运行的 Gateway 网关获取健康信息。

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

注意事项：

- 默认情况下，`openclaw health` 会向正在运行的 Gateway 网关请求其健康快照。当 Gateway 网关已经有一个新的缓存快照时，它可以返回该缓存负载，并在后台刷新。
- `--verbose` 会强制执行实时探测、打印 Gateway 网关连接详情，并将面向人的输出扩展为涵盖所有已配置的账号和智能体。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
