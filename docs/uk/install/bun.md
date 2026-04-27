---
read_when:
    - Вам потрібен найшвидший локальний цикл розробки (bun + watch)
    - Ви зіткнулися з проблемами Bun під час встановлення/застосування patch/виконання lifecycle-скриптів
summary: 'Робочий процес Bun (експериментальний): встановлення та підводні камені порівняно з pnpm'
title: Bun (експериментально)
x-i18n:
    generated_at: "2026-04-27T07:08:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **не рекомендується для runtime Gateway** (відомі проблеми з WhatsApp і Telegram). Для production використовуйте Node.
</Warning>

Bun — це необов’язковий локальний runtime для прямого запуску TypeScript (`bun run ...`, `bun --watch ...`). Типовим менеджером пакетів залишається `pnpm`, який повністю підтримується та використовується інструментами документації. Bun не може використовувати `pnpm-lock.yaml` і ігноруватиме його.

## Встановлення

<Steps>
  <Step title="Встановіть залежності">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` додано до gitignore, тому в репозиторії не буде зайвих змін. Щоб повністю пропустити запис lockfile:

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

## Lifecycle-скрипти

Bun блокує lifecycle-скрипти залежностей, якщо їм явно не довірено. Для цього репозиторію скрипти, які зазвичай блокуються, не є обов’язковими:

- `@whiskeysockets/baileys` `preinstall` -- перевіряє, що основна версія Node >= 20 (OpenClaw типово використовує Node 24 і також підтримує Node 22 LTS, наразі `22.14+`)
- `protobufjs` `postinstall` -- виводить попередження про несумісні схеми версій (без артефактів збірки)

Якщо ви зіткнулися з проблемою runtime, яка вимагає цих скриптів, явно надайте їм довіру:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Застереження

Деякі скрипти все ще жорстко прив’язані до pnpm (наприклад, `docs:build`, `ui:*`, `protocol:check`). Наразі запускайте їх через pnpm.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Node.js](/uk/install/node)
- [Оновлення](/uk/install/updating)
