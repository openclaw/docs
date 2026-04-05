---
read_when:
    - 添加 BOOT.md 清单
summary: BOOT.md 的工作区模板
title: BOOT.md 模板
x-i18n:
    generated_at: "2026-04-05T10:08:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 694e836d2c4010bf723d0e64f40e98800d3c135ca4c4124d42f96f5e050936f8
    source_path: reference/templates/BOOT.md
    workflow: 15
---

# BOOT.md

添加简短、明确的说明，告诉 OpenClaw 启动时应执行什么操作（启用 `hooks.internal.enabled`）。
如果该任务需要发送消息，请使用 message 工具，然后仅回复精确的静默令牌 `NO_REPLY` / `no_reply`。
