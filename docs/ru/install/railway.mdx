---
read_when:
    - Развертывание OpenClaw в Railway
    - Вам нужно облачное развертывание в один клик с браузерным Control UI
summary: Разверните OpenClaw на Railway с помощью шаблона в один клик
title: Railway
x-i18n:
    generated_at: "2026-06-28T23:08:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 16
---

# Railway

Разверните OpenClaw на Railway с помощью шаблона в один клик и получайте доступ к нему через веб-интерфейс Control UI.
Это самый простой путь «без терминала на сервере»: Railway запускает Gateway за вас.

## Краткий контрольный список (для новых пользователей)

1. Нажмите **Deploy on Railway** (ниже).
2. Добавьте **Volume**, смонтированный в `/data`.
3. Задайте обязательные **Variables** (как минимум `OPENCLAW_GATEWAY_PORT` и `OPENCLAW_GATEWAY_TOKEN`).
4. Включите **HTTP Proxy** на порту `8080`.
5. Откройте `https://<your-railway-domain>/openclaw` и подключитесь, используя настроенный общий секрет. По умолчанию этот шаблон использует `OPENCLAW_GATEWAY_TOKEN`; если вы замените его аутентификацией по паролю, используйте этот пароль.

## Развертывание в один клик

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

После развертывания найдите публичный URL в **Railway → your service → Settings → Domains**.

Railway либо:

- выдаст вам сгенерированный домен (часто `https://<something>.up.railway.app`), либо
- использует ваш пользовательский домен, если вы его подключили.

Затем откройте:

- `https://<your-railway-domain>/openclaw` — Control UI

## Что вы получаете

- Размещенные OpenClaw Gateway + Control UI
- Постоянное хранилище через Railway Volume (`/data`), благодаря которому `openclaw.json`,
  `auth-profiles.json` для каждого агента, состояние каналов/провайдеров, сеансы и
  рабочая область сохраняются после повторных развертываний

## Обязательные настройки Railway

### Публичная сеть

Включите **HTTP Proxy** для сервиса.

- Порт: `8080`

### Volume (обязательно)

Подключите том, смонтированный в:

- `/data`

### Variables

Задайте эти переменные для сервиса:

- `OPENCLAW_GATEWAY_PORT=8080` (обязательно — должен совпадать с портом в разделе «Публичная сеть»)
- `OPENCLAW_GATEWAY_TOKEN` (обязательно; обращайтесь с ним как с секретом администратора)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (рекомендуется)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (рекомендуется)

## Подключение канала

Используйте Control UI по адресу `/openclaw` или запустите `openclaw onboard` через shell Railway, чтобы получить инструкции по настройке канала:

- [Telegram](/ru/channels/telegram) (самый быстрый вариант — нужен только токен бота)
- [Discord](/ru/channels/discord)
- [Все каналы](/ru/channels)

## Резервное копирование и миграция

Экспортируйте состояние, конфигурацию, профили аутентификации и рабочую область:

```bash
openclaw backup create
```

Это создает переносимый архив резервной копии с состоянием OpenClaw и любой настроенной
рабочей областью. Подробнее см. в разделе [Резервное копирование](/ru/cli/backup).

## Следующие шаги

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Поддерживайте OpenClaw в актуальном состоянии: [Обновление](/ru/install/updating)
