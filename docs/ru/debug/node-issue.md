---
read_when:
    - Отладка скриптов разработки только для Node или сбоев в режиме наблюдения
    - Исследование сбоев загрузчика tsx/esbuild в OpenClaw
summary: Примечания и обходные решения для сбоя Node + tsx "__name is not a function"
title: Сбой Node + tsx
x-i18n:
    generated_at: "2026-06-28T22:54:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# Сбой Node + tsx «\_\_name is not a function»

## Сводка

Запуск OpenClaw через Node с `tsx` завершается ошибкой при старте:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Это началось после переключения dev-скриптов с Bun на `tsx` (коммит `2871657e`, 2026-01-06). Тот же путь выполнения работал с Bun.

## Окружение

- Node: v25.x (наблюдалось на v25.3.0)
- tsx: 4.21.0
- ОС: macOS (воспроизведение также вероятно на других платформах, где работает Node 25)

## Воспроизведение (только Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Минимальное воспроизведение в репозитории

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Проверка версии Node

- Node 25.3.0: ошибка
- Node 22.22.0 (Homebrew `node@22`): ошибка
- Node 24: здесь пока не установлен; требуется проверка

## Заметки / гипотеза

- `tsx` использует esbuild для преобразования TS/ESM. `keepNames` в esbuild генерирует вспомогательную функцию `__name` и оборачивает определения функций в `__name(...)`.
- Сбой указывает, что `__name` существует, но во время выполнения не является функцией; это подразумевает, что вспомогательная функция отсутствует или перезаписана для этого модуля в пути загрузчика Node 25.
- Похожие проблемы со вспомогательной функцией `__name` отмечались у других потребителей esbuild, когда вспомогательная функция отсутствовала или переписывалась.

## История регрессии

- `2871657e` (2026-01-06): скрипты изменены с Bun на tsx, чтобы сделать Bun необязательным.
- До этого (путь Bun) `openclaw status` и `gateway:watch` работали.

## Обходные пути

- Использовать Bun для dev-скриптов (текущий временный откат).
- Использовать `tsgo` для проверки типов репозитория, затем запускать собранный вывод:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Историческая заметка: `tsc` использовался здесь при отладке этой проблемы Node/tsx, но сейчас lanes проверки типов репозитория используют `tsgo`.
- Отключить esbuild keepNames в загрузчике TS, если возможно (это предотвращает вставку вспомогательной функции `__name`); tsx сейчас этого не предоставляет.
- Проверить Node LTS (22/24) с `tsx`, чтобы понять, специфична ли проблема для Node 25.

## Ссылки

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Следующие шаги

- Воспроизвести на Node 22/24, чтобы подтвердить регрессию Node 25.
- Проверить ночную сборку `tsx` или закрепить более раннюю версию, если существует известная регрессия.
- Если воспроизводится на Node LTS, отправить минимальный пример воспроизведения upstream со стеком вызовов `__name`.

## Связанные материалы

- [Установка Node.js](/ru/install/node)
- [Устранение неполадок Gateway](/ru/gateway/troubleshooting)
