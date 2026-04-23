---
read_when:
    - Додавання контрольного списку до BOOT.md
summary: Шаблон workspace для BOOT.md
title: Шаблон BOOT.md
x-i18n:
    generated_at: "2026-04-23T21:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 259bbe6a13f083671648db92ed42a886121056279a33f53d09560fef2b36ac00
    source_path: reference/templates/BOOT.md
    workflow: 15
---

# BOOT.md

Додайте короткі, явні інструкції про те, що OpenClaw має робити під час запуску (увімкніть `hooks.internal.enabled`).
Якщо завдання надсилає повідомлення, використовуйте tool message, а потім дайте відповідь точним
тихим token-ом `NO_REPLY` / `no_reply`.
