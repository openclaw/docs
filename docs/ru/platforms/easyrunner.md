---
read_when:
    - Развёртывание OpenClaw на EasyRunner
    - Запуск Gateway за прокси-сервером Caddy от EasyRunner
    - Выбор постоянных томов и аутентификации для размещённого Gateway
summary: Запуск Gateway OpenClaw в EasyRunner с помощью Podman и Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T11:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner размещает Gateway OpenClaw в виде небольшого контейнерного приложения за своим прокси-сервером Caddy. В этом руководстве предполагается, что узел EasyRunner запускает совместимые с Podman приложения Compose, а завершение HTTPS выполняется через Caddy.

## Перед началом

- Сервер EasyRunner с направленным на него доменом.
- Официальный образ OpenClaw (`ghcr.io/openclaw/openclaw`) или собственная сборка.
- Постоянный том конфигурации для `/home/node/.openclaw`.
- Постоянный том рабочего пространства для `/home/node/.openclaw/workspace`.
- Надёжный токен или пароль Gateway.

По возможности не отключайте аутентификацию устройств. Если обратный прокси-сервер не может корректно передавать идентификационные данные устройства, сначала исправьте настройки доверенного прокси-сервера (см. [Аутентификация через доверенный прокси-сервер](/ru/gateway/trusted-proxy-auth)); используйте опасные способы обхода аутентификации только в полностью частной сети, управляемой оператором.

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Замените `openclaw.example.com` именем узла Gateway. Храните `OPENCLAW_GATEWAY_TOKEN` в диспетчере секретов или переменных окружения EasyRunner, а не добавляйте его в определение приложения. По умолчанию образ привязывается к local loopback, поэтому явные параметры `--bind lan --port 1455` в `command` необходимы, чтобы Caddy мог обращаться к контейнеру.

## Настройка OpenClaw

В постоянном томе конфигурации обеспечьте доступность Gateway только через прокси-сервер и требуйте аутентификацию:

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

Если Caddy завершает TLS для Gateway, настройте доверенный прокси-сервер для точного пути прохождения запросов, а не отключайте проверки аутентификации глобально. См. [Аутентификация через доверенный прокси-сервер](/ru/gateway/trusted-proxy-auth).

## Проверка

С рабочей станции:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

На узле EasyRunner запросы `GET /healthz` (проверка работоспособности) и `GET /readyz` (проверка готовности) не требуют аутентификации и используются встроенной в образ проверкой состояния контейнера. Также проверьте журналы приложения: Gateway должен прослушивать подключения, а ошибки запуска, связанные с SecretRef, plugin или аутентификацией каналов, должны отсутствовать.

## Обновления и резервное копирование

- Загрузите или соберите новый образ OpenClaw, затем повторно разверните приложение EasyRunner.
- Перед обновлением создайте резервную копию тома `openclaw-config`. В нём хранятся `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` и состояние установленных пакетов plugin.
- Создавайте резервную копию `openclaw-workspace`, если агенты записывают туда долговременные данные проектов.
- После крупных обновлений запускайте `openclaw doctor`, чтобы выявить необходимость миграции конфигурации и предупреждения служб.

## Устранение неполадок

- `gateway probe` не может подключиться: убедитесь, что имя узла Caddy указывает на приложение и контейнер прослушивает `0.0.0.0:1455`.
- Ошибка аутентификации: одновременно замените токен в секретах EasyRunner и в команде локального клиента.
- После восстановления владельцем файлов является root: образ запускается от имени `node` (uid 1000); исправьте права подключённых томов, чтобы этот пользователь мог записывать данные в `/home/node/.openclaw` и `/home/node/.openclaw/workspace`.
- Не работают браузерные plugin или plugin каналов: проверьте, доступны ли внутри контейнера необходимые внешние исполняемые файлы, исходящие сетевые подключения и подключённые учётные данные.
