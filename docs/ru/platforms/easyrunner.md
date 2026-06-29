---
read_when:
    - Развертывание OpenClaw на EasyRunner
    - Запуск Gateway за Caddy-прокси EasyRunner
    - Выбор постоянных томов и аутентификации для размещенного Gateway
summary: Запуск OpenClaw Gateway на EasyRunner с Podman и Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-28T23:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner может размещать OpenClaw Gateway как небольшое контейнеризованное приложение за своим
прокси Caddy. Это руководство предполагает наличие хоста EasyRunner, который запускает совместимые с Podman
приложения Compose и предоставляет HTTPS через Caddy.

## Перед началом

- Сервер EasyRunner с направленным на него доменом.
- Собранный или опубликованный контейнерный образ OpenClaw.
- Постоянный том конфигурации для `/home/node/.openclaw`.
- Постоянный том рабочей области для `/workspace`.
- Надежный токен или пароль Gateway.

По возможности оставляйте аутентификацию устройств включенной. Если ваше развертывание обратного прокси не может
корректно передавать идентификатор устройства, сначала исправьте настройки доверенного прокси; используйте
опасные обходы аутентификации только в полностью частной сети под контролем оператора.

## Приложение Compose

Создайте приложение EasyRunner с файлом Compose следующего вида:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Замените `openclaw.example.com` на имя хоста вашего Gateway. Храните
`OPENCLAW_GATEWAY_TOKEN` в менеджере секретов/переменных окружения EasyRunner, а не
коммитьте его в определение приложения.

## Настройка OpenClaw

Внутри постоянного тома конфигурации оставьте Gateway доступным только через
прокси и требуйте аутентификацию:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Если Caddy завершает TLS для Gateway, настройте параметры доверенного прокси для
точного пути прокси, а не отключайте проверки аутентификации глобально. См.
[Аутентификация доверенного прокси](/ru/gateway/trusted-proxy-auth).

## Проверка

С вашей рабочей станции:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

На хосте EasyRunner проверьте журналы приложения: Gateway должен прослушивать порт, а
при запуске не должно быть сбоев аутентификации SecretRef, Plugin или канала.

## Обновления и резервные копии

- Загрузите или соберите новый образ OpenClaw, затем повторно разверните приложение EasyRunner.
- Сделайте резервную копию тома `openclaw-config` перед обновлениями.
- Сделайте резервную копию `openclaw-workspace`, если агенты записывают туда долговечные данные проектов.
- Запустите `openclaw doctor` после крупных обновлений, чтобы выявить миграции конфигурации и
  предупреждения служб.

## Устранение неполадок

- `gateway probe` не может подключиться: убедитесь, что имя хоста Caddy указывает на приложение
  и что контейнер прослушивает `0.0.0.0:1455`.
- Ошибка аутентификации: одновременно обновите токен в секретах EasyRunner и в локальной клиентской
  команде.
- После восстановления файлы принадлежат root: исправьте смонтированные тома, чтобы
  пользователь контейнера мог записывать в `/home/node/.openclaw` и `/workspace`.
- Браузерные или канальные Plugin не работают: проверьте, доступны ли необходимые внешние
  бинарные файлы, исходящие сетевые подключения и смонтированные учетные данные внутри
  контейнера.
