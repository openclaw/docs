---
read_when:
    - Розуміння того, що відбувається під час першого запуску агента
    - Пояснення, де знаходяться файли bootstrap-налаштування
    - Налагодження налаштування identity під час onboarding
sidebarTitle: Bootstrapping
summary: Ритуал bootstrap агента, який ініціалізує workspace та файли identity
title: Bootstrap агента
x-i18n:
    generated_at: "2026-04-23T21:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrap-налаштування — це ритуал **першого запуску**, який готує workspace агента й
збирає деталі identity. Воно відбувається після onboarding, коли агент запускається
вперше.

## Що робить bootstrap-налаштування

Під час першого запуску агента OpenClaw виконує bootstrap-налаштування workspace (за замовчуванням
`~/.openclaw/workspace`):

- Ініціалізує `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Запускає короткий ритуал запитань і відповідей (по одному запитанню за раз).
- Записує identity + preferences у `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Видаляє `BOOTSTRAP.md` після завершення, щоб це виконувалося лише один раз.

## Де це виконується

Bootstrap-налаштування завжди виконується на **host gateway**. Якщо застосунок macOS підключається до
віддаленого Gateway, workspace і файли bootstrap-налаштування живуть на тій віддаленій
машині.

<Note>
Коли Gateway працює на іншій машині, редагуйте файли workspace на host
gateway (наприклад, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Пов’язані документи

- Onboarding застосунку macOS: [Onboarding](/uk/start/onboarding)
- Макет workspace: [Agent workspace](/uk/concepts/agent-workspace)
