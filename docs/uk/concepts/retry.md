---
read_when:
    - Оновлення поведінки або типових значень повторних спроб provider-а
    - Налагодження помилок надсилання provider-а або обмежень швидкості
summary: Політика повторних спроб для вихідних викликів provider-а
title: Політика повторних спроб
x-i18n:
    generated_at: "2026-04-23T20:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86d2ae5b467fa2dce06873d91c64e0ac62cc57377c3b17e788efdd5646c31fa
    source_path: concepts/retry.md
    workflow: 15
---

## Цілі

- Повторювати спроби для кожного HTTP-запиту, а не для всього багатокрокового flow.
- Зберігати порядок, повторюючи лише поточний крок.
- Уникати дублювання неідемпотентних операцій.

## Типові значення

- Кількість спроб: 3
- Максимальна межа затримки: 30000 мс
- Jitter: 0.1 (10 відсотків)
- Типові значення для provider-ів:
  - Telegram мінімальна затримка: 400 мс
  - Discord мінімальна затримка: 500 мс

## Поведінка

### Model providers

- OpenClaw дозволяє SDK provider-ів обробляти звичайні короткі повторні спроби.
- Для SDK на основі Stainless, таких як Anthropic і OpenAI, відповіді, придатні
  для повторної спроби (`408`, `409`, `429` і `5xx`), можуть містити `retry-after-ms` або
  `retry-after`. Коли це очікування довше за 60 секунд, OpenClaw додає `x-should-retry: false`, щоб SDK одразу повернув помилку, а failover моделі міг переключитися на інший auth profile або fallback model.
- Перевизначте межу через `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Установіть `0`, `false`, `off`, `none` або `disabled`, щоб дозволити SDK внутрішньо дотримуватися довгих пауз `Retry-After`.

### Discord

- Повторні спроби виконуються лише при помилках rate limit (HTTP 429).
- Використовує `retry_after` Discord, коли він доступний, інакше — exponential backoff.

### Telegram

- Повторні спроби виконуються при тимчасових помилках (429, timeout, connect/reset/closed, temporarily unavailable).
- Використовує `retry_after`, коли він доступний, інакше — exponential backoff.
- Помилки розбору Markdown не повторюються; замість цього використовується plain text.

## Конфігурація

Задайте політику повторних спроб для кожного provider-а в `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Примітки

- Повторні спроби застосовуються до кожного запиту окремо (надсилання повідомлення, вивантаження медіа, reaction, poll, sticker).
- Складені flow не повторюють уже завершені кроки.
