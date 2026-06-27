---
read_when:
    - Робота над кодом або тестами середовища виконання агентів OpenClaw
    - Запуск лінтингу, перевірки типів і потоків живих тестів agent-runtime
summary: 'Робочий процес розробника для середовища виконання агентів OpenClaw: збирання, тестування та live-валідація'
title: Робочий процес середовища виконання агента OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Раціональний робочий процес для роботи над середовищем виконання агента OpenClaw в OpenClaw.

## Перевірка типів і лінтинг

- Типовий локальний контроль: `pnpm check`
- Контроль збірки: `pnpm build`, коли зміна може вплинути на результат збірки, пакування або межі lazy-loading/модулів
- Повний контроль перед злиттям для змін середовища виконання агента: `pnpm check && pnpm test`

## Запуск тестів середовища виконання агента

Запустіть набір тестів середовища виконання агента напряму через Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Щоб включити перевірку з live-провайдером:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Це покриває основні модульні набори тестів середовища виконання агента:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Ручне тестування

Рекомендований потік:

- Запустіть Gateway у режимі розробки:
  - `pnpm gateway:dev`
- Запустіть агента напряму:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Використовуйте TUI для інтерактивного налагодження:
  - `pnpm tui`

Для поведінки викликів інструментів попросіть дію `read` або `exec`, щоб побачити потокове передавання даних інструмента й обробку payload.

## Скидання до чистого стану

Стан зберігається в каталозі стану OpenClaw. Типове значення — `~/.openclaw`. Якщо встановлено `OPENCLAW_STATE_DIR`, натомість використовуйте цей каталог.

Щоб скинути все:

- `openclaw.json` для конфігурації
- `agents/<agentId>/agent/auth-profiles.json` для профілів автентифікації моделей (ключі API + OAuth)
- `credentials/` для стану провайдера/каналу, який досі зберігається поза сховищем профілів автентифікації
- `agents/<agentId>/sessions/` для історії сесій агента
- `agents/<agentId>/sessions/sessions.json` для індексу сесій
- `sessions/`, якщо існують застарілі шляхи
- `workspace/`, якщо потрібен порожній робочий простір

Якщо потрібно скинути лише сесії, видаліть `agents/<agentId>/sessions/` для цього агента. Якщо потрібно зберегти автентифікацію, залиште `agents/<agentId>/agent/auth-profiles.json` і будь-який стан провайдера в `credentials/` на місці.

## Довідкові матеріали

- [Тестування](/uk/help/testing)
- [Початок роботи](/uk/start/getting-started)

## Пов’язане

- [Архітектура середовища виконання агента OpenClaw](/uk/agent-runtime-architecture)
