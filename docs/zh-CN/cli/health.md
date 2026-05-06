---
read_when:
    - 你想快速检查正在运行的 Gateway 网关的健康状态
summary: '`openclaw health` 的 CLI 参考（通过 RPC 获取 Gateway 网关健康状态快照）'
title: 运行状况
x-i18n:
    generated_at: "2026-05-06T07:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

从正在运行的 Gateway 网关获取健康状态。

选项：

- `--json`：机器可读输出
- `--timeout <ms>`：连接超时时间，以毫秒为单位（默认 `10000`）
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

- 默认的 `openclaw health` 会向正在运行的 Gateway 网关请求其健康状态快照。当
  Gateway 网关已有新的缓存快照时，它可以返回该缓存载荷，并在后台刷新。
- `--verbose` 会强制执行实时探测，打印 Gateway 网关连接详情，并将
  人类可读输出扩展到所有已配置的账号和智能体。
- 配置了多个智能体时，输出会包含每个智能体的会话存储。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关健康状态](/zh-CN/gateway/health)
