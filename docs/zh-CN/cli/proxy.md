---
read_when:
    - 你需要在本地捕获 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、blob 或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，本地调试代理和捕获检查器'
title: 代理
x-i18n:
    generated_at: "2026-04-24T04:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

运行本地显式调试代理并检查捕获的流量。

这是一个用于传输层排查的调试命令。它可以启动本地代理、在启用捕获的情况下运行子命令、列出捕获会话、查询常见流量模式、读取捕获的 blob，以及清除本地捕获数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 查询预设

`openclaw proxy query --preset <name>` 接受以下值：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 说明

- `start` 默认使用 `127.0.0.1`，除非设置了 `--host`。
- `run` 会先启动本地调试代理，然后运行 `--` 之后的命令。
- 捕获内容属于本地调试数据；完成后请使用 `openclaw proxy purge` 清除。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)
