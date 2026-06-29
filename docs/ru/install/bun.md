---
read_when:
    - Вам нужен самый быстрый локальный цикл разработки (bun + watch)
    - Возникли проблемы со сценариями установки, патчей или жизненного цикла Bun
summary: 'Рабочий процесс Bun (экспериментальный): установка и нюансы по сравнению с pnpm'
title: Bun (экспериментально)
x-i18n:
    generated_at: "2026-06-28T23:04:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **не рекомендуется для среды выполнения Gateway** (известные проблемы с WhatsApp и Telegram). Используйте Node для production.
</Warning>

Bun — необязательная локальная среда выполнения для прямого запуска TypeScript (`bun run ...`, `bun --watch ...`). Пакетным менеджером по умолчанию остается `pnpm`, который полностью поддерживается и используется инструментами документации. Bun не может использовать `pnpm-lock.yaml` и будет игнорировать его.

## Установка

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` игнорируются Git, поэтому в репозитории не возникает лишних изменений. Чтобы полностью пропустить запись lock-файла:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Скрипты жизненного цикла

Bun блокирует скрипты жизненного цикла зависимостей, если они явно не доверены. Для этого репозитория обычно блокируемые скрипты не требуются:

- `baileys` `preinstall` -- проверяет, что основная версия Node >= 20 (OpenClaw по умолчанию использует Node 24 и по-прежнему поддерживает Node 22 LTS, сейчас `22.19+`)
- `protobufjs` `postinstall` -- выводит предупреждения о несовместимых схемах версий (без артефактов сборки)

Если вы столкнулись с проблемой во время выполнения, для которой нужны эти скрипты, явно доверьте их:

```sh
bun pm trust baileys protobufjs
```

## Ограничения

В некоторых скриптах пока жестко задан pnpm (например, `check:docs`, `ui:*`, `protocol:check`). Пока запускайте их через pnpm.

## См. также

- [Обзор установки](/ru/install)
- [Node.js](/ru/install/node)
- [Обновление](/ru/install/updating)
