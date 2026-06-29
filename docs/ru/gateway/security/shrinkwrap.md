---
read_when:
    - Вы хотите узнать, что означает npm shrinkwrap в выпуске OpenClaw
    - Вы проверяете lock-файлы пакетов, изменения зависимостей или риски цепочки поставок
    - Вы проверяете корневые или plugin npm-пакеты перед публикацией
summary: Простое и техническое объяснение npm shrinkwrap в релизах OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-28T23:01:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Исходные рабочие копии OpenClaw используют `pnpm-lock.yaml`. Опубликованные npm-пакеты OpenClaw
используют `npm-shrinkwrap.json`, публикуемый lockfile зависимостей npm, поэтому
при установке пакетов используется граф зависимостей, проверенный во время релиза.

## Простая версия

Shrinkwrap — это квитанция для дерева зависимостей, поставляемого с npm-пакетом.
Он указывает npm, какие точные версии транзитивных пакетов нужно установить.

Для релизов OpenClaw это означает:

- опубликованный пакет не просит npm придумывать новый граф зависимостей во
  время установки;
- изменения зависимостей легче проверять, потому что они появляются в lockfile;
- валидация релиза может тестировать тот же граф, который будут устанавливать пользователи;
- неожиданности с размером пакета или нативными зависимостями легче обнаружить до
  публикации.

Shrinkwrap — это не песочница. Сам по себе он не делает зависимость безопасной и
не заменяет изоляцию хоста, `openclaw security audit`, происхождение пакетов
или smoke-тесты установки.

Краткая ментальная модель:

| Файл                  | Где он важен              | Что это означает                 |
| --------------------- | ------------------------- | -------------------------------- |
| `pnpm-lock.yaml`      | Исходная рабочая копия OpenClaw | Граф зависимостей для сопровождающих |
| `npm-shrinkwrap.json` | Опубликованный npm-пакет  | Граф установки npm для пользователей |
| `package-lock.json`   | Локальные npm-приложения  | Не контракт публикации OpenClaw |

## Почему OpenClaw использует его

OpenClaw — это Gateway, хост Plugin, маршрутизатор моделей и среда выполнения агента. Установка по умолчанию
может влиять на время запуска, использование диска, загрузки нативных пакетов и
риски цепочки поставок.

Shrinkwrap дает проверке релиза стабильную границу:

- рецензенты могут видеть движение транзитивных зависимостей;
- валидаторы пакетов могут отклонять неожиданный дрейф lockfile;
- приемка пакетов может тестировать установки с графом, который будет поставлен;
- пакеты Plugin могут нести собственный зафиксированный граф зависимостей вместо того,
  чтобы полагаться на корневой пакет как владельца зависимостей только для Plugin.

Цель — не «больше lockfile». Цель — воспроизводимые установки релизов
с четким владением.

## Технические подробности

Корневой npm-пакет `openclaw` и npm-пакеты Plugin, принадлежащие OpenClaw, включают
`npm-shrinkwrap.json` при публикации. Подходящие пакеты Plugin, принадлежащие OpenClaw,
также могут публиковаться с явными `bundledDependencies`, чтобы их файлы зависимостей
среды выполнения переносились в tarball Plugin, а не зависели только от
разрешения во время установки.

Поддерживайте эту границу так:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Генератор разрешает публикуемый npm формат lockfile, но отклоняет сгенерированные
версии пакетов, которые еще не присутствуют в `pnpm-lock.yaml`. Это сохраняет
границу возраста зависимостей pnpm, переопределений и проверки патчей.

Используйте команды только для корня только при намеренном обновлении корневого пакета
без изменения пакетов Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Проверяйте эти файлы как чувствительные с точки зрения безопасности:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- полезные нагрузки зависимостей bundled Plugin
- любой diff `package-lock.json`

Валидаторы пакетов OpenClaw требуют shrinkwrap в новых tarball корневого пакета.
Путь публикации npm для Plugin проверяет локальный для Plugin shrinkwrap, устанавливает
локальные для пакета bundled-зависимости, а затем упаковывает или публикует. Валидаторы пакетов
отклоняют `package-lock.json` для опубликованных пакетов OpenClaw.

Чтобы проверить опубликованный корневой пакет:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Чтобы проверить пакет Plugin, принадлежащий OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Справка: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
