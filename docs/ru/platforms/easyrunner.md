---
read_when:
    - Развертывание OpenClaw на EasyRunner
    - Запуск Gateway за прокси Caddy в EasyRunner
    - Выбор постоянных томов и аутентификации для размещённого Gateway
summary: Запуск OpenClaw Gateway в EasyRunner с помощью Podman и Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-13T18:23:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner размещает Gateway OpenClaw в виде небольшого контейнеризованного приложения за своим
прокси Caddy. В этом руководстве предполагается, что хост EasyRunner запускает совместимые с Podman
приложения Compose и завершает HTTPS-соединения через Caddy.

## Перед началом работы

- Сервер EasyRunner с направленным на него доменом.
- Официальный образ OpenClaw (`ghcr.io/openclaw/openclaw`) или ваша собственная сборка.
- Постоянный том конфигурации для `/home/node/.openclaw`.
- Постоянный том рабочей области для `/home/node/.openclaw/workspace`.
- Надёжный токен или пароль Gateway.

По возможности не отключайте аутентификацию устройств. Если обратный прокси не может
корректно передавать идентификатор устройства, сначала исправьте настройки доверенного прокси (см.
[Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth)); используйте опасные способы
обхода аутентификации только в полностью приватной сети под контролем оператора.

## Приложение Compose

Создайте в EasyRunner приложение с файлом Compose следующего вида:

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

Замените `openclaw.example.com` именем хоста вашего Gateway. Храните
`OPENCLAW_GATEWAY_TOKEN` в диспетчере секретов или переменных среды EasyRunner, а не
фиксируйте его в определении приложения. По умолчанию образ привязывается к loopback-интерфейсу,
поэтому явное указание `--bind lan --port 1455` в `command` необходимо, чтобы Caddy мог
обращаться к контейнеру.

## Настройка OpenClaw

В постоянном томе конфигурации настройте доступность Gateway только через
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

Если Caddy завершает TLS-соединения для Gateway, настройте доверенный прокси для
конкретного маршрута прокси вместо глобального отключения проверок аутентификации. См.
[Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth).

## Проверка

С вашей рабочей станции:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

На хосте EasyRunner для `GET /healthz` (проверка работоспособности) и `GET /readyz`
(проверка готовности) аутентификация не требуется; они используются встроенной в образ
проверкой состояния контейнера. Также проверьте журналы приложения: Gateway должен прослушивать
подключения, а ошибки аутентификации SecretRef, плагинов или каналов при запуске должны отсутствовать.

## Обновления и резервное копирование

- Загрузите или соберите новый образ OpenClaw, затем повторно разверните приложение EasyRunner.
- Создайте резервную копию тома `openclaw-config` перед обновлениями. В нём хранятся
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` и состояние пакетов
  установленных плагинов.
- Создайте резервную копию `openclaw-workspace`, если агенты записывают туда долговременные данные проектов.
- После крупных обновлений выполните `openclaw doctor`, чтобы выявить необходимые миграции конфигурации и
  предупреждения служб.

## Устранение неполадок

- `gateway probe` не удаётся подключиться: убедитесь, что имя хоста Caddy указывает на приложение
  и контейнер прослушивает `0.0.0.0:1455`.
- Ошибка аутентификации: одновременно замените токен в секретах EasyRunner и
  команде локального клиента.
- После восстановления файлы принадлежат пользователю root: образ запускается от имени `node` (uid 1000);
  исправьте права подключённых томов, чтобы этот пользователь мог записывать данные в
  `/home/node/.openclaw` и `/home/node/.openclaw/workspace`.
- Не работают браузерные или канальные плагины: проверьте, доступны ли внутри
  контейнера необходимые внешние исполняемые файлы, исходящие сетевые подключения и подключённые учётные данные.
