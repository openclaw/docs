---
read_when:
    - Ви хочете найшвидший локальний цикл розробки (bun + watch)
    - Ви зіткнулися з проблемами Bun під час встановлення/patch/lifecycle scripts
summary: 'Робочий процес Bun (експериментально): встановлення та підводні камені порівняно з pnpm'
title: Bun (експериментально)
x-i18n:
    generated_at: "2026-04-23T20:56:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c67b27bd25b0a018976c4730704994371f4e9bc7495ae0f84d179764f663bd6
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **не рекомендується для runtime Gateway** (відомі проблеми з WhatsApp і Telegram). Для production використовуйте Node.
</Warning>

Bun — це необов’язкове локальне runtime-середовище для прямого запуску TypeScript (`bun run ...`, `bun --watch ...`). Типовим пакетним менеджером залишається `pnpm`, який повністю підтримується та використовується інструментами документації. Bun не може використовувати `pnpm-lock.yaml` і ігноруватиме його.

## Встановлення

<Steps>
  <Step title="Встановіть залежності">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` додано до gitignore, тому репозиторій не засмічується. Щоб повністю пропустити запис lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Зберіть і протестуйте">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle scripts

Bun блокує lifecycle scripts залежностей, якщо їх явно не позначено як trusted. Для цього репозиторію часто заблоковані скрипти не є обов’язковими:

- `@whiskeysockets/baileys` `preinstall` -- перевіряє, що основна версія Node >= 20 (OpenClaw типово використовує Node 24 і все ще підтримує Node 22 LTS, наразі `22.14+`)
- `protobufjs` `postinstall` -- виводить попередження про несумісні схеми версій (без build-артефактів)

Якщо ви натрапите на runtime-проблему, яка потребує цих скриптів, явно довірте їм:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Застереження

Деякі скрипти все ще жорстко прив’язані до pnpm (наприклад, `docs:build`, `ui:*`, `protocol:check`). Наразі запускайте їх через pnpm.
