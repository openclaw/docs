---
read_when:
    - Вы хотите, чтобы OpenClaw работал круглосуточно на облачном VPS (а не на вашем ноутбуке)
    - Вам нужен готовый к промышленной эксплуатации, постоянно работающий Gateway на собственном VPS
    - Вам нужен полный контроль над постоянным хранением данных, бинарными файлами и поведением при перезапуске
    - Вы запускаете OpenClaw в Docker на Hetzner или у аналогичного провайдера
summary: Запустите OpenClaw Gateway круглосуточно на недорогом VPS Hetzner (Docker) с постоянным состоянием и встроенными бинарными файлами
title: Hetzner
x-i18n:
    generated_at: "2026-07-13T18:19:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw на VPS Hetzner с помощью Docker, обеспечив долговременное хранение состояния, встроенные в образ бинарные файлы и безопасное поведение при перезапуске.

Цены Hetzner меняются; выберите самый компактный VPS с Debian/Ubuntu, отвечающий требованиям, и увеличьте его ресурсы, если возникнут ошибки нехватки памяти.

Доступ к Gateway можно получить с ноутбука через перенаправление портов SSH или напрямую открыть порт, если вы самостоятельно управляете межсетевым экраном и токенами.

Напоминание о модели безопасности:

- Общие корпоративные агенты допустимы, если все находятся в одной границе доверия, а среда выполнения используется только для рабочих задач.
- Соблюдайте строгую изоляцию: отдельный VPS/среда выполнения и отдельные учётные записи; не используйте на этом хосте личные профили Apple, Google, браузеров или менеджеров паролей.
- Если пользователи могут действовать друг против друга, разделите их по экземплярам Gateway, хостам или пользователям ОС.

См. разделы [Безопасность](/ru/gateway/security) и [Размещение на VPS](/ru/vps).

В этом руководстве предполагается использование Ubuntu или Debian на Hetzner. На другом VPS с Linux подберите соответствующие пакеты. Общий процесс работы с Docker описан в разделе [Docker](/ru/install/docker).

## Что потребуется

- VPS Hetzner с доступом root
- Доступ по SSH с ноутбука
- Docker и Docker Compose
- Учётные данные для аутентификации в модели
- Необязательные учётные данные провайдеров (QR-код WhatsApp, токен бота Telegram, OAuth Gmail)
- Около 20 минут

## Краткий порядок действий

1. Подготовьте VPS Hetzner
2. Установите Docker
3. Клонируйте репозиторий OpenClaw
4. Создайте постоянные каталоги на хосте
5. Настройте `.env` и `docker-compose.yml`
6. Встройте необходимые бинарные файлы в образ
7. `docker compose up -d`
8. Проверьте сохранение состояния и доступ к Gateway

<Steps>
  <Step title="Подготовьте VPS">
    Создайте VPS с Ubuntu или Debian в Hetzner, затем подключитесь от имени root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Рассматривайте VPS как инфраструктуру с сохраняемым состоянием, а не как одноразовую.

  </Step>

  <Step title="Установите Docker (на VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Проверьте установку:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Клонируйте репозиторий OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    В этом руководстве создаётся пользовательский образ, поэтому все встроенные в него бинарные файлы сохраняются после перезапусков.

  </Step>

  <Step title="Создайте постоянные каталоги на хосте">
    Контейнеры Docker являются временными; всё долговременное состояние должно храниться на хосте.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Назначьте владельцем пользователя контейнера (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Настройте переменные среды">
    Создайте `.env` в корне репозитория:

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

    Задайте `OPENCLAW_GATEWAY_TOKEN`, чтобы управлять постоянным токеном Gateway через
    `.env`; в противном случае настройте `gateway.auth.token`, прежде чем рассчитывать на работу клиентов
    после перезапусков. Если не задано ни одно из этих значений, OpenClaw использует только временный токен
    для текущего запуска. Создайте пароль связки ключей для `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не добавляйте этот файл в репозиторий.** Он содержит переменные среды контейнера и среды выполнения, например
    `OPENCLAW_GATEWAY_TOKEN`. Сохранённые данные аутентификации провайдеров через OAuth или ключи API находятся в
    подключённом каталоге `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Конфигурация Docker Compose">
    Создайте или обновите `docker-compose.yml`:

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
          # Рекомендуется: оставьте Gateway доступным только через loopback-интерфейс VPS; подключайтесь через туннель SSH.
          # Чтобы открыть его для общего доступа, удалите префикс `127.0.0.1:` и соответствующим образом настройте межсетевой экран.
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

    `--allow-unconfigured` предназначен только для упрощения первоначального запуска и не заменяет полноценную конфигурацию Gateway. Обязательно настройте аутентификацию (`gateway.auth.token` или пароль) и безопасный режим привязки для своего развёртывания.

  </Step>

  <Step title="Общие шаги для среды выполнения виртуальной машины Docker">
    Следуйте общему руководству по стандартному процессу настройки хоста Docker:

    - [Встройте необходимые бинарные файлы в образ](/ru/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Соберите и запустите](/ru/install/docker-vm-runtime#build-and-launch)
    - [Где сохраняются данные](/ru/install/docker-vm-runtime#what-persists-where)
    - [Обновления](/ru/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ с учётом особенностей Hetzner">
    После выполнения общих шагов сборки и запуска откройте туннель.

    **Предварительное условие:** убедитесь, что конфигурация sshd на VPS разрешает перенаправление TCP. Если вы
    усилили защиту конфигурации SSH, проверьте `/etc/ssh/sshd_config` и задайте:

    ```text
    AllowTcpForwarding local
    ```

    `local` разрешает локальное перенаправление `ssh -L` с ноутбука, одновременно блокируя
    удалённое перенаправление с сервера. Если задать значение `no`, туннель завершится с ошибкой:
    `channel 3: open failed: administratively prohibited: open failed`

    Убедившись, что перенаправление TCP включено, перезапустите службу SSH
    (`systemctl restart ssh`) и запустите туннель с ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Откройте `http://127.0.0.1:18789/` и вставьте настроенный общий секрет.
    В этом руководстве по умолчанию используется токен Gateway; если вы перешли на аутентификацию по паролю,
    используйте вместо него настроенный пароль.

  </Step>
</Steps>

Общая схема хранения постоянных данных приведена в разделе [Среда выполнения виртуальной машины Docker](/ru/install/docker-vm-runtime#what-persists-where).

## Инфраструктура как код (Terraform)

Для команд, предпочитающих процессы «инфраструктура как код», поддерживаемая сообществом конфигурация Terraform предоставляет:

- Модульную конфигурацию Terraform с удалённым управлением состоянием
- Автоматическую подготовку с помощью cloud-init
- Сценарии развёртывания (первоначальная настройка, развёртывание, резервное копирование и восстановление)
- Усиление защиты (межсетевой экран, UFW, доступ только по SSH)
- Настройку туннеля SSH для доступа к Gateway

**Репозитории:**

- Инфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфигурация Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Этот подход дополняет описанную выше настройку Docker воспроизводимыми развёртываниями, инфраструктурой под управлением системы контроля версий и автоматизированным аварийным восстановлением.

<Note>
Поддерживается сообществом. Сообщить о проблемах или внести вклад можно по ссылкам на репозитории выше.
</Note>

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Поддерживайте OpenClaw в актуальном состоянии: [Обновление](/ru/install/updating)

## Связанные разделы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Docker](/ru/install/docker)
- [Размещение на VPS](/ru/vps)
