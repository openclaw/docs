---
read_when:
    - Налагодження збоїв dev-скриптів лише для Node або режиму watch
    - Розслідування збоїв завантажувача tsx/esbuild в OpenClaw
summary: Нотатки про збій Node + tsx "__name is not a function" і обхідні шляхи
title: Збій Node + tsx
x-i18n:
    generated_at: "2026-04-18T17:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Збій Node + tsx "`__name is not a function`"

## Підсумок

Запуск OpenClaw через Node з `tsx` завершується помилкою під час старту:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Це почалося після перемикання dev-скриптів з Bun на `tsx` (коміт `2871657e`, 2026-01-06). Той самий шлях виконання раніше працював із Bun.

## Середовище

- Node: v25.x (спостерігалося на v25.3.0)
- tsx: 4.21.0
- ОС: macOS (відтворення також імовірне на інших платформах, де запускається Node 25)

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

- Node 25.3.0: помилка
- Node 22.22.0 (Homebrew `node@22`): помилка
- Node 24: тут ще не встановлено; потрібна перевірка

## Нотатки / гіпотеза

- `tsx` використовує esbuild для трансформації TS/ESM. `keepNames` в esbuild створює допоміжний елемент `__name` і обгортає визначення функцій у `__name(...)`.
- Збій означає, що `__name` існує, але не є функцією під час виконання, а це вказує на те, що допоміжний елемент відсутній або перезаписаний для цього модуля в шляху завантажувача Node 25.
- Про схожі проблеми з допоміжним елементом `__name` уже повідомляли в інших споживачів esbuild, коли цей допоміжний елемент відсутній або переписаний.

## Історія регресії

- `2871657e` (2026-01-06): скрипти змінено з Bun на tsx, щоб зробити Bun необов’язковим.
- До цього (шлях Bun) `openclaw status` і `gateway:watch` працювали.

## Обхідні шляхи

- Використовувати Bun для dev-скриптів (поточне тимчасове повернення).
- Використовувати `tsgo` для перевірки типів у репозиторії, а потім запускати зібраний вивід:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Історична примітка: `tsc` тут використовувався під час налагодження цієї проблеми Node/tsx, але тепер у репозиторії для перевірки типів використовуються шляхи `tsgo`.
- Вимкнути esbuild `keepNames` у TS-завантажувачі, якщо це можливо (це запобігає вставці допоміжного елемента `__name`); наразі tsx не надає такого параметра.
- Перевірити Node LTS (22/24) із `tsx`, щоб з’ясувати, чи проблема специфічна для Node 25.

## Посилання

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Наступні кроки

- Відтворити на Node 22/24, щоб підтвердити регресію Node 25.
- Перевірити `tsx` nightly або зафіксувати попередню версію, якщо відома регресія справді існує.
- Якщо проблема відтворюється на Node LTS, створити мінімальне відтворення upstream із трасуванням стека `__name`.
