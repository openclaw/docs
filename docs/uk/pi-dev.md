---
read_when:
    - Працюєте над кодом або тестами інтеграції Pi
    - Запуск специфічних для Pi процесів lint, typecheck і live-тестування
summary: 'Робочий процес розробки для інтеграції Pi: збирання, тестування та перевірка в реальному часі'
title: Робочий процес розробки Pi
x-i18n:
    generated_at: "2026-04-27T07:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 15
---

Раціональний робочий процес для роботи над інтеграцією Pi в OpenClaw.

## Перевірка типів і linting

- Локальний gate за замовчуванням: `pnpm check`
- Gate збирання: `pnpm build`, коли зміна може вплинути на результат збирання, пакування або межі lazy-loading/module
- Повний landing gate для змін, що значною мірою стосуються Pi: `pnpm check && pnpm test`

## Запуск тестів Pi

Запускайте набір тестів, зосереджений на Pi, безпосередньо через Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Щоб включити live-перевірку провайдера:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Це охоплює основні набори unit-тестів Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Ручне тестування

Рекомендований потік:

- Запустіть gateway у режимі dev:
  - `pnpm gateway:dev`
- Запустіть агента безпосередньо:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Використовуйте TUI для інтерактивного налагодження:
  - `pnpm tui`

Для поведінки викликів інструментів сформулюйте запит на дію `read` або `exec`, щоб побачити streaming інструментів і обробку payload.

## Скидання до чистого стану

Стан зберігається в каталозі стану OpenClaw. За замовчуванням це `~/.openclaw`. Якщо встановлено `OPENCLAW_STATE_DIR`, використовуйте натомість цей каталог.

Щоб скинути все:

- `openclaw.json` для конфігурації
- `agents/<agentId>/agent/auth-profiles.json` для профілів автентифікації моделі (API-ключі + OAuth)
- `credentials/` для стану провайдера/каналу, який усе ще зберігається поза сховищем профілів автентифікації
- `agents/<agentId>/sessions/` для історії сеансів агента
- `agents/<agentId>/sessions/sessions.json` для індексу сеансів
- `sessions/`, якщо існують застарілі шляхи
- `workspace/`, якщо вам потрібна порожня робоча область

Якщо ви хочете скинути лише сеанси, видаліть `agents/<agentId>/sessions/` для цього агента. Якщо ви хочете зберегти автентифікацію, залиште `agents/<agentId>/agent/auth-profiles.json` і будь-який стан провайдера в `credentials/` без змін.

## Посилання

- [Тестування](/uk/help/testing)
- [Початок роботи](/uk/start/getting-started)

## Пов’язане

- [Архітектура інтеграції Pi](/uk/pi)
