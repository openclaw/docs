---
read_when:
    - 你在维护仍使用 `openclaw clawbot ...` 的旧脚本
    - 你需要迁移到当前命令的指导
summary: '`openclaw clawbot` 的 CLI 参考（旧版别名命名空间）'
title: clawbot
x-i18n:
    generated_at: "2026-04-05T08:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1db82065ecb0107d1ab1a2c6ddaee9df1dd02b983ca1f759974c9d73f0ee3bde
    source_path: cli/clawbot.md
    workflow: 15
---

# `openclaw clawbot`

为向后兼容而保留的旧版别名命名空间。

当前支持的别名：

- `openclaw clawbot qr`（与 [`openclaw qr`](/cli/qr) 的行为相同）

## 迁移

优先直接使用现代顶层命令：

- `openclaw clawbot qr` -> `openclaw qr`
