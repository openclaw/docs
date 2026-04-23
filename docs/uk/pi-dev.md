---
read_when:
    - Робота над кодом або тестами інтеграції Pi
    - Запуск специфічних для Pi потоків lint, typecheck і live test】【”】【analysis to=functions.read ულია  重庆时时彩的json  content={"path":"docs/help/pi-development-workflow.md","offset":1,"limit":400}
summary: 'Робочий процес розробника для інтеграції Pi: збірка, тестування та перевірка в реальному середовищі'
title: Робочий процес розробки Pi
x-i18n:
    generated_at: "2026-04-23T20:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84eb5b7c3256fa5dd2f9719136b16ee435876952888efde0d81f8bfa8a63b1f0
    source_path: pi-dev.md
    workflow: 15
---

Цей посібник підсумовує здоровий робочий процес для роботи над інтеграцією Pi в OpenClaw.

## Перевірка типів і linting

- Типовий локальний gate: `pnpm check`
- Build gate: `pnpm build`, коли зміна може впливати на build output, packaging або межі lazy-loading/module
- Повний landing gate для змін, що сильно зачіпають Pi: `pnpm check && pnpm test`

## Запуск тестів Pi

Запустіть набір тестів, зосереджених на Pi, напряму через Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Щоб включити live-вправу для provider-а:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Це покриває основні unit-набори Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Ручне тестування

Рекомендований процес:

- Запустіть gateway у dev-режимі:
  - `pnpm gateway:dev`
- Запустіть агента напряму:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Використовуйте TUI для інтерактивного налагодження:
  - `pnpm tui`

Для поведінки викликів інструментів дайте prompt на дію `read` або `exec`, щоб побачити потокове передавання інструмента й обробку payload.

## Скидання до чистого стану

State зберігається в каталозі стану OpenClaw. Типово це `~/.openclaw`. Якщо задано `OPENCLAW_STATE_DIR`, використовуйте натомість цей каталог.

Щоб скинути все:

- `openclaw.json` для конфігурації
- `agents/<agentId>/agent/auth-profiles.json` для model auth profiles (API keys + OAuth)
- `credentials/` для стану provider-а/каналу, який іще живе поза сховищем auth profile
- `agents/<agentId>/sessions/` для історії сесій агента
- `agents/<agentId>/sessions/sessions.json` для індексу сесій
- `sessions/`, якщо існують legacy paths
- `workspace/`, якщо ви хочете порожній робочий простір

Якщо ви хочете скинути лише сесії, видаліть `agents/<agentId>/sessions/` для цього агента. Якщо хочете зберегти auth, не чіпайте `agents/<agentId>/agent/auth-profiles.json` і будь-який стан provider-а в `credentials/`.

## Посилання

- [Testing](/uk/help/testing)
- [Getting Started](/uk/start/getting-started)
