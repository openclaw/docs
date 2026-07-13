---
read_when:
    - Развертывание OpenClaw в Railway
    - Вам нужно развертывание в облаке одним щелчком с веб-интерфейсом управления
summary: Разверните OpenClaw на Railway с помощью шаблона для установки в один клик
title: Railway
x-i18n:
    generated_at: "2026-07-13T18:16:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Разверните OpenClaw в Railway с помощью шаблона для установки в один клик и работайте с ним через веб-интерфейс управления. Это самый простой способ обойтись без терминала на сервере: Railway запускает Gateway за вас.

## Развертывание в один клик

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Развернуть в Railway
</a>

<Steps>
  <Step title="Разверните шаблон">
    Нажмите **Deploy on Railway** выше.
  </Step>

<Step title="Добавьте том">
  Подключите том, смонтированный в `/data` (необходимо для постоянного хранения состояния).
</Step>

  <Step title="Задайте переменные">
    Задайте обязательные **Variables** для сервиса:

    - `OPENCLAW_GATEWAY_PORT=8080` (обязательно — должен соответствовать порту в Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (обязательно; считайте секретом администратора)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (рекомендуется)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (рекомендуется)

  </Step>

<Step title="Включите публичную сеть">
  В разделе **Public Networking** включите **HTTP Proxy** для сервиса на порту `8080`.
</Step>

  <Step title="Подключитесь">
    Найдите публичный URL-адрес в разделе **Railway -> your service -> Settings -> Domains** — это либо сгенерированный домен (часто `https://<something>.up.railway.app`), либо подключенный пользовательский домен.

    Откройте `https://<your-railway-domain>/openclaw` и подключитесь с помощью настроенного общего секрета. По умолчанию шаблон использует `OPENCLAW_GATEWAY_TOKEN`; если вы замените его аутентификацией по паролю, используйте вместо него этот пароль.

  </Step>
</Steps>

## Что вы получите

- Размещенные в облаке Gateway OpenClaw и веб-интерфейс управления
- Постоянное хранилище в томе Railway (`/data`), благодаря которому `openclaw.json`, файлы `auth-profiles.json` отдельных агентов, состояние каналов и провайдеров, сеансы и рабочее пространство сохраняются при повторных развертываниях

## Подключение канала

Используйте веб-интерфейс управления по адресу `/openclaw` или выполните `openclaw onboard` в оболочке Railway, чтобы получить инструкции по настройке каналов:

- [Discord](/ru/channels/discord)
- [Telegram](/ru/channels/telegram) (самый быстрый вариант — нужен только токен бота)
- [Все каналы](/ru/channels)

## Резервное копирование и миграция

Экспортируйте состояние, конфигурацию, профили аутентификации и рабочее пространство:

```bash
openclaw backup create
```

Эта команда создает переносимый архив резервной копии с состоянием OpenClaw и всеми настроенными рабочими пространствами. Подробности см. в разделе [Резервное копирование](/ru/cli/backup).

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Поддерживайте OpenClaw в актуальном состоянии: [Обновление](/ru/install/updating)
