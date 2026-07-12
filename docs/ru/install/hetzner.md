---
read_when:
    - Вы хотите, чтобы OpenClaw круглосуточно работал на облачном VPS (а не на вашем ноутбуке)
    - Вам нужен готовый к промышленной эксплуатации, постоянно работающий Gateway на собственном VPS.
    - Вам нужен полный контроль над постоянным хранением данных, исполняемыми файлами и поведением при перезапуске
    - Вы запускаете OpenClaw в Docker на Hetzner или у аналогичного провайдера
summary: Запустите OpenClaw Gateway круглосуточно на недорогом VPS Hetzner (Docker) с постоянным хранилищем состояния и встроенными бинарными файлами
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T11:30:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw на VPS Hetzner с помощью Docker, обеспечив долговременное хранение состояния, встроенные в образ исполняемые файлы и безопасное поведение при перезапуске.

Цены Hetzner меняются; выберите минимальный VPS с Debian/Ubuntu, соответствующий требованиям, и увеличьте его ресурсы, если столкнётесь с ошибками нехватки памяти (OOM).

Доступ к Gateway можно получить с ноутбука через перенаправление портов SSH или напрямую открыть порт, если вы самостоятельно управляете межсетевым экраном и токенами.

Напоминание о модели безопасности:

- Общие агенты компании допустимы, если все находятся в одной границе доверия, а среда выполнения используется только для рабочих задач.
- Соблюдайте строгую изоляцию: отдельный VPS/среда выполнения и отдельные учётные записи; не используйте на этом сервере личные профили Apple, Google, браузеров или менеджеров паролей.
- Если пользователи могут действовать враждебно по отношению друг к другу, разделяйте их по экземплярам Gateway, хостам или пользователям ОС.

См. разделы [Безопасность](/ru/gateway/security) и [Размещение на VPS](/ru/vps).

В этом руководстве предполагается использование Ubuntu или Debian на Hetzner. Для другого VPS с Linux подберите соответствующие пакеты. Общий порядок работы с Docker описан в разделе [Docker](/ru/install/docker).

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
6. Встройте необходимые исполняемые файлы в образ
7. Выполните `docker compose up -d`
8. Проверьте сохранение состояния и доступ к Gateway

<Steps>
  <Step title="Подготовка VPS">
    Создайте VPS с Ubuntu или Debian в Hetzner, затем подключитесь к нему как root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Рассматривайте VPS как инфраструктуру с сохраняемым состоянием, а не как одноразовый ресурс.

  </Step>

  <Step title="Установка Docker (на VPS)">
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

  <Step title="Клонирование репозитория OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    В этом руководстве создаётся собственный образ, поэтому встроенные в него исполняемые файлы сохраняются после перезапусков.

  </Step>

  <Step title="Создание постоянных каталогов на хосте">
    Контейнеры Docker эфемерны, поэтому всё долговременное состояние должно храниться на хосте.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Назначьте владельцем пользователя контейнера (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Настройка переменных окружения">
    Создайте файл `.env` в корне репозитория:

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
    `.env`; в противном случае настройте `gateway.auth.token`, прежде чем рассчитывать
    на работу клиентов после перезапусков. Если не задано ни одно из этих значений,
    OpenClaw использует только для текущего запуска токен среды выполнения. Создайте
    пароль связки ключей для `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не добавляйте этот файл в репозиторий.** Он содержит переменные окружения
    контейнера и среды выполнения, например `OPENCLAW_GATEWAY_TOKEN`. Сохранённые
    данные аутентификации провайдеров через OAuth или ключи API находятся в
    подключённом файле `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Настройка Docker Compose">
    Создайте или обновите файл `docker-compose.yml`:

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
          # Рекомендуется: оставьте Gateway доступным на VPS только через loopback; подключайтесь через туннель SSH.
          # Чтобы открыть к нему публичный доступ, удалите префикс `127.0.0.1:` и соответствующим образом настройте межсетевой экран.
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

    Параметр `--allow-unconfigured` предназначен только для упрощения первоначального запуска и не заменяет полноценную настройку Gateway. Обязательно настройте аутентификацию (`gateway.auth.token` или пароль) и безопасный режим привязки для своей среды.

  </Step>

  <Step title="Общие действия для среды выполнения виртуальной машины Docker">
    Следуйте общему руководству по среде выполнения для стандартной настройки хоста Docker:

    - [Встраивание необходимых исполняемых файлов в образ](/ru/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Сборка и запуск](/ru/install/docker-vm-runtime#build-and-launch)
    - [Что и где сохраняется](/ru/install/docker-vm-runtime#what-persists-where)
    - [Обновления](/ru/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ с учётом особенностей Hetzner">
    После выполнения общих действий по сборке и запуску откройте туннель.

    **Предварительное условие:** убедитесь, что конфигурация sshd на VPS разрешает
    перенаправление TCP. Если вы усилили безопасность конфигурации SSH, проверьте
    `/etc/ssh/sshd_config` и задайте:

    ```text
    AllowTcpForwarding local
    ```

    Значение `local` разрешает локальное перенаправление `ssh -L` с ноутбука, блокируя
    удалённое перенаправление с сервера. При значении `no` туннель завершится ошибкой:
    `channel 3: open failed: administratively prohibited: open failed`

    Убедившись, что перенаправление TCP включено, перезапустите службу SSH
    (`systemctl restart ssh`) и запустите туннель с ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Откройте `http://127.0.0.1:18789/` и вставьте настроенный общий секрет.
    В этом руководстве по умолчанию используется токен Gateway; если вы перешли
    на аутентификацию по паролю, используйте вместо него настроенный пароль.

  </Step>
</Steps>

Общая схема сохранения данных приведена в разделе [Среда выполнения виртуальной машины Docker](/ru/install/docker-vm-runtime#what-persists-where).

## Инфраструктура как код (Terraform)

Для команд, предпочитающих подход «инфраструктура как код», поддерживаемая сообществом конфигурация Terraform предоставляет:

- Модульную конфигурацию Terraform с удалённым управлением состоянием
- Автоматическую подготовку с помощью cloud-init
- Сценарии развёртывания (первоначальная настройка, развёртывание, резервное копирование и восстановление)
- Усиление безопасности (межсетевой экран, UFW, доступ только по SSH)
- Настройку туннеля SSH для доступа к Gateway

**Репозитории:**

- Инфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфигурация Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Этот подход дополняет описанную выше настройку Docker воспроизводимыми развёртываниями, инфраструктурой под управлением системы контроля версий и автоматизированным аварийным восстановлением.

<Note>
Поддерживается сообществом. Сообщить о проблемах или внести вклад можно по указанным выше ссылкам на репозитории.
</Note>

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Регулярно обновляйте OpenClaw: [Обновление](/ru/install/updating)

## Связанные материалы

- [Обзор установки](/ru/install)
- [Fly.io](/ru/install/fly)
- [Docker](/ru/install/docker)
- [Размещение на VPS](/ru/vps)
