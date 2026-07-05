---
read_when:
    - 你维护使用 `openclaw clawbot ...` 的旧脚本
    - 你需要迁移到当前命令的指南
summary: '`openclaw clawbot` 的 CLI 参考（旧版别名命名空间）'
title: Clawbot
x-i18n:
    generated_at: "2026-07-05T11:06:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

为向后兼容保留的旧别名命名空间。它注册与顶级 CLI 相同的 QR 命令，因此 `openclaw clawbot qr` 接受所有 [`openclaw qr`](/zh-CN/cli/qr) 标志。

## 迁移

优先使用现代顶级命令：

- `openclaw clawbot qr` -> `openclaw qr`

## 相关

- [CLI 参考](/zh-CN/cli)
