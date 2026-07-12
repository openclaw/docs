---
read_when:
    - 你维护使用 `openclaw clawbot ...` 的旧版脚本
    - 你需要有关迁移到当前命令的指导
summary: '`openclaw clawbot` 的 CLI 参考（旧版别名命名空间）'
title: Clawbot
x-i18n:
    generated_at: "2026-07-11T20:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

为向后兼容而保留的旧版别名命名空间。它注册了与顶层 CLI 相同的二维码命令，因此 `openclaw clawbot qr` 接受 [`openclaw qr`](/zh-CN/cli/qr) 的所有标志。

## 迁移

建议使用现代的顶层命令：

- `openclaw clawbot qr` -> `openclaw qr`

## 相关内容

- [CLI 参考](/zh-CN/cli)
