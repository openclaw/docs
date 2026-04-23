---
read_when:
    - Налагодження збоїв dev-скриптів або режиму watch лише в Node
    - Дослідження збоїв завантажувача tsx/esbuild в OpenClaw
summary: Нотатки про збій Node + tsx `"__name is not a function"` і способи обходу
title: Збій Node + tsx
x-i18n:
    generated_at: "2026-04-23T20:53:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6de878f9c95415f7d55e9e3336129da3e0e07e780cc87565c9f2fddc728834bd
    source_path: debug/node-issue.md
    workflow: 15
---

# Збій Node + tsx `\_\_name is not a function`

## Підсумок

Запуск OpenClaw через Node з `tsx` завершується помилкою на старті:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Це почалося після перемикання dev-скриптів з Bun на `tsx` (коміт `2871657e`, 2026-01-06). Той самий шлях виконання раніше працював із Bun.

## Середовище

- Node: v25.x (спостерігалося на v25.3.0)
- tsx: 4.21.0
- OS: macOS (імовірно, відтворюється й на інших платформах, де працює Node 25)

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

- Node 25.3.0: збій
- Node 22.22.0 (Homebrew `node@22`): збій
- Node 24: тут ще не встановлено; потрібно перевірити

## Примітки / гіпотеза

- `tsx` використовує esbuild для перетворення TS/ESM. `keepNames` в esbuild генерує допоміжну функцію `__name` і обгортає визначення функцій у `__name(...)`.
- Збій вказує на те, що `__name` існує, але не є функцією під час виконання, що означає, що для цього модуля в шляху завантажувача Node 25 допоміжна функція відсутня або перезаписана.
- Подібні проблеми з допоміжною функцією `__name` уже повідомлялися в інших користувачів esbuild, коли цю допоміжну функцію було пропущено або переписано.

## Історія регресії

- `2871657e` (2026-01-06): скрипти змінено з Bun на tsx, щоб зробити Bun необов’язковим.
- До цього (шлях Bun) `openclaw status` і `gateway:watch` працювали.

## Способи обходу

- Використовуйте Bun для dev-скриптів (поточне тимчасове повернення).
- Використовуйте `tsgo` для перевірки типів у репозиторії, а потім запускайте зібраний результат:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Історична примітка: під час налагодження цієї проблеми Node/tsx тут використовувався `tsc`, але тепер для перевірки типів у репозиторії використовуються шляхи `tsgo`.
- Вимкніть esbuild keepNames у TS-завантажувачі, якщо це можливо (це запобігає вставленню допоміжної функції `__name`); наразі tsx не надає такого параметра.
- Перевірте Node LTS (22/24) із `tsx`, щоб з’ясувати, чи проблема є специфічною для Node 25.

## Посилання

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Наступні кроки

- Відтворити на Node 22/24, щоб підтвердити регресію в Node 25.
- Перевірити `tsx` nightly або зафіксувати попередню версію, якщо відома конкретна регресія.
- Якщо проблема відтворюється на Node LTS, подайте upstream мінімальне відтворення зі stack trace `__name`.
