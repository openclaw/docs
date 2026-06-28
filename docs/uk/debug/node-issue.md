---
read_when:
    - Налагодження скриптів розробки, призначених лише для Node, або збоїв у режимі спостереження
    - Дослідження збоїв завантажувача tsx/esbuild в OpenClaw
summary: Примітки щодо збою Node + tsx "__name is not a function" і способи обходу
title: Збій Node + tsx
x-i18n:
    generated_at: "2026-05-06T15:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Збій Node + tsx "\_\_name is not a function"

## Підсумок

Запуск OpenClaw через Node з `tsx` завершується помилкою під час старту:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Це почалося після переходу dev-скриптів з Bun на `tsx` (коміт `2871657e`, 2026-01-06). Той самий runtime-шлях працював із Bun.

## Середовище

- Node: v25.x (спостерігалося на v25.3.0)
- tsx: 4.21.0
- ОС: macOS (відтворення також імовірне на інших платформах, де працює Node 25)

## Відтворення (лише Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Мінімальне відтворення в репозиторії

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Перевірка версії Node

- Node 25.3.0: падає
- Node 22.22.0 (Homebrew `node@22`): падає
- Node 24: тут ще не встановлено; потребує перевірки

## Нотатки / гіпотеза

- `tsx` використовує esbuild для трансформації TS/ESM. `keepNames` в esbuild створює допоміжну функцію `__name` і обгортає визначення функцій у `__name(...)`.
- Збій вказує, що `__name` існує, але під час виконання не є функцією, що означає, що допоміжна функція відсутня або перезаписана для цього модуля в шляху завантажувача Node 25.
- Схожі проблеми з допоміжною функцією `__name` повідомлялися в інших споживачів esbuild, коли допоміжна функція була відсутня або переписувалася.

## Історія регресії

- `2871657e` (2026-01-06): скрипти змінено з Bun на tsx, щоб зробити Bun необов'язковим.
- До цього (шлях Bun) `openclaw status` і `gateway:watch` працювали.

## Обхідні рішення

- Використовуйте Bun для dev-скриптів (поточний тимчасовий відкат).
- Використовуйте `tsgo` для перевірки типів репозиторію, потім запускайте зібраний вивід:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Історична примітка: `tsc` використовувався тут під час налагодження цієї проблеми Node/tsx, але зараз lanes перевірки типів репозиторію використовують `tsgo`.
- Вимкніть esbuild keepNames у TS-завантажувачі, якщо можливо (це запобігає вставленню допоміжної функції `__name`); наразі tsx цього не надає.
- Перевірте Node LTS (22/24) з `tsx`, щоб з'ясувати, чи проблема специфічна для Node 25.

## Посилання

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Наступні кроки

- Відтворити на Node 22/24, щоб підтвердити регресію Node 25.
- Перевірити nightly-версію `tsx` або закріпити ранішу версію, якщо існує відома регресія.
- Якщо відтворюється на Node LTS, подати мінімальне відтворення upstream зі стеком `__name`.

## Пов'язане

- [Встановлення Node.js](/uk/install/node)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
