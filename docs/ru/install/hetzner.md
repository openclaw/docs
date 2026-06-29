---
read_when:
    - Вам нужен OpenClaw, работающий 24/7 на облачном VPS (а не на вашем ноутбуке)
    - Вам нужен Gateway промышленного уровня, постоянно работающий на вашем собственном VPS
    - Вам нужен полный контроль над постоянным хранением, бинарными файлами и поведением при перезапуске
    - Вы запускаете OpenClaw в Docker на Hetzner или у аналогичного провайдера
summary: Запускайте OpenClaw Gateway 24/7 на дешевом VPS Hetzner (Docker) с сохраняемым состоянием и встроенными бинарными файлами
title: Hetzner
x-i18n:
    generated_at: "2026-06-28T23:06:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
---

## Цель

Запустить постоянный OpenClaw Gateway на Hetzner VPS с помощью Docker, с долговечным состоянием, встроенными бинарными файлами и безопасным поведением при перезапуске.

Если вам нужен «OpenClaw 24/7 примерно за $5», это самая простая надежная настройка.
Цены Hetzner меняются; выберите самый маленький VPS на Debian/Ubuntu и масштабируйтесь, если столкнетесь с OOM.

Напоминание о модели безопасности:

- Общие агенты компании допустимы, когда все находятся в одной границе доверия, а среда выполнения используется только для рабочих задач.
- Соблюдайте строгую изоляцию: выделенный VPS/среда выполнения + выделенные учетные записи; никаких личных профилей Apple/Google/браузера/менеджера паролей на этом хосте.
- Если пользователи потенциально враждебны друг к другу, разделяйте их по gateway/хосту/пользователю ОС.

См. [Безопасность](/ru/gateway/security) и [VPS-хостинг](/ru/vps).

## Что мы делаем (простыми словами)?

- Арендуем небольшой Linux-сервер (Hetzner VPS)
- Устанавливаем Docker (изолированную среду выполнения приложения)
- Запускаем OpenClaw Gateway в Docker
- Сохраняем `~/.openclaw` + `~/.openclaw/workspace` на хосте (переживает перезапуски/пересборки)
- Получаем доступ к Control UI с ноутбука через SSH-туннель

Это смонтированное состояние `~/.openclaw` включает `openclaw.json`, поагентные
`agents/<agentId>/agent/auth-profiles.json` и `.env`.

Доступ к Gateway можно получить через:

- проброс SSH-порта с вашего ноутбука
- прямое открытие порта, если вы самостоятельно управляете firewall и токенами

Это руководство предполагает Ubuntu или Debian на Hetzner.  
Если вы используете другой Linux VPS, сопоставьте пакеты соответствующим образом.
Общий поток Docker см. в [Docker](/ru/install/docker).

---

## Быстрый путь (для опытных операторов)

1. Подготовьте Hetzner VPS
2. Установите Docker
3. Клонируйте репозиторий OpenClaw
4. Создайте постоянные каталоги на хосте
5. Настройте `.env` и `docker-compose.yml`
6. Встройте необходимые бинарные файлы в образ
7. `docker compose up -d`
8. Проверьте сохранение состояния и доступ к Gateway

---

## Что вам понадобится

- Hetzner VPS с root-доступом
- SSH-доступ с вашего ноутбука
- Базовый навык работы с SSH и copy/paste
- ~20 минут
- Docker и Docker Compose
- Учетные данные для авторизации модели
- Необязательные учетные данные провайдеров
  - QR-код WhatsApp
  - токен бота Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    Создайте VPS на Ubuntu или Debian в Hetzner.

    Подключитесь как root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Это руководство предполагает, что VPS является stateful.
    Не рассматривайте его как одноразовую инфраструктуру.

  </Step>

  <Step title="Install Docker (on the VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Проверьте:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Это руководство предполагает, что вы соберете собственный образ, чтобы гарантировать сохранность бинарных файлов.

  </Step>

  <Step title="Create persistent host directories">
    Контейнеры Docker эфемерны.
    Все долгоживущее состояние должно находиться на хосте.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    Создайте `.env` в корне репозитория.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Задайте `OPENCLAW_GATEWAY_TOKEN`, если хотите управлять стабильным токеном
    Gateway через `.env`; иначе настройте `gateway.auth.token` до того, как
    полагаться на клиентов между перезапусками. Если ни один источник не существует, OpenClaw использует
    токен только для среды выполнения в рамках этого запуска. Сгенерируйте пароль keyring и вставьте
    его в `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не коммитьте этот файл.**

    Этот файл `.env` предназначен для env контейнера/среды выполнения, например `OPENCLAW_GATEWAY_TOKEN`.
    Сохраненная авторизация OAuth/API-key провайдера находится в смонтированном
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose configuration">
    Создайте или обновите `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` нужен только для удобства bootstrap, это не замена правильной конфигурации gateway. Все равно настройте auth (`gateway.auth.token` или пароль) и используйте безопасные настройки bind для вашего развертывания.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Используйте общее руководство по среде выполнения для стандартного потока хоста Docker:

    - [Встроить необходимые бинарные файлы в образ](/ru/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Собрать и запустить](/ru/install/docker-vm-runtime#build-and-launch)
    - [Что и где сохраняется](/ru/install/docker-vm-runtime#what-persists-where)
    - [Обновления](/ru/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    После общих шагов сборки и запуска завершите следующую настройку, чтобы открыть туннель:

    **Предварительное условие:** убедитесь, что конфигурация sshd на VPS разрешает TCP forwarding. Если вы
    усиливали конфигурацию SSH, проверьте `/etc/ssh/sshd_config` и задайте:

    ```
    AllowTcpForwarding local
    ```

    `local` разрешает локальные пробросы `ssh -L` с вашего ноутбука и при этом блокирует
    удаленные пробросы с сервера. Значение `no` приведет к сбою туннеля
    с:
    `channel 3: open failed: administratively prohibited: open failed`

    После подтверждения, что TCP forwarding включен, перезапустите службу SSH
    (`systemctl restart ssh`) и запустите туннель с вашего ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Откройте:

    `http://127.0.0.1:18789/`

    Вставьте настроенный общий секрет. Это руководство по умолчанию использует токен gateway;
    если вы переключились на авторизацию по паролю, используйте этот пароль.

  </Step>
</Steps>

Общая карта сохранения состояния находится в [Docker VM Runtime](/ru/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Для команд, предпочитающих workflows infrastructure-as-code, поддерживаемая сообществом настройка Terraform предоставляет:

- Модульную конфигурацию Terraform с управлением удаленным состоянием
- Автоматизированное выделение ресурсов через cloud-init
- Скрипты развертывания (bootstrap, deploy, backup/restore)
- Усиление безопасности (firewall, UFW, доступ только по SSH)
- Конфигурацию SSH-туннеля для доступа к gateway

**Репозитории:**

- Инфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфигурация Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Этот подход дополняет описанную выше настройку Docker воспроизводимыми развертываниями, инфраструктурой под версионным контролем и автоматизированным аварийным восстановлением.

<Note>
Поддерживается сообществом. По вопросам или предложениям изменений см. ссылки на репозитории выше.
</Note>

## Следующие шаги

- Настройте каналы сообщений: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Поддерживайте OpenClaw в актуальном состоянии: [Обновление](/ru/install/updating)

## Связанные материалы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Docker](/ru/install/docker)
- [VPS-хостинг](/ru/vps)
