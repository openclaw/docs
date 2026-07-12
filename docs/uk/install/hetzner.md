---
read_when:
    - Ви хочете, щоб OpenClaw цілодобово працював на хмарному VPS (а не на вашому ноутбуці)
    - Вам потрібен готовий до промислової експлуатації, постійно активний Gateway на власному VPS
    - Вам потрібен повний контроль над збереженням даних, бінарними файлами та поведінкою під час перезапуску
    - Ви запускаєте OpenClaw у Docker на Hetzner або в аналогічного провайдера
summary: Запускайте OpenClaw Gateway цілодобово на недорогому VPS від Hetzner (Docker) зі стійким станом і вбудованими бінарними файлами
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T13:23:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Запустіть постійний OpenClaw Gateway на VPS Hetzner за допомогою Docker зі збережуваним станом, вбудованими бінарними файлами та безпечною поведінкою під час перезапуску.

Ціни Hetzner змінюються; виберіть найменший VPS із Debian/Ubuntu, який відповідає вимогам, і збільште його ресурси, якщо виникатимуть помилки через нестачу пам’яті.

Доступ до Gateway можна отримати з вашого ноутбука через перенаправлення порту SSH або шляхом прямого відкриття порту, якщо ви самостійно керуєте брандмауером і токенами.

Нагадування щодо моделі безпеки:

- Спільні агенти компанії цілком прийнятні, якщо всі перебувають у межах одного контуру довіри, а середовище виконання використовується лише для робочих завдань.
- Дотримуйтеся суворого розділення: окремий VPS/середовище виконання та окремі облікові записи; на цьому хості не повинно бути особистих профілів Apple, Google, браузера чи менеджера паролів.
- Якщо користувачі можуть діяти вороже один до одного, розділіть їх за Gateway, хостами або користувачами ОС.

Див. [Безпека](/uk/gateway/security) і [Хостинг на VPS](/uk/vps).

У цьому посібнику передбачається використання Ubuntu або Debian на Hetzner. Для іншого VPS із Linux підберіть відповідні пакунки. Загальний процес роботи з Docker описано в розділі [Docker](/uk/install/docker).

## Що вам знадобиться

- VPS Hetzner із доступом root
- Доступ SSH із вашого ноутбука
- Docker і Docker Compose
- Облікові дані для автентифікації моделі
- Необов’язкові облікові дані провайдерів (QR-код WhatsApp, токен бота Telegram, OAuth Gmail)
- Приблизно 20 хвилин

## Швидкий шлях

1. Створіть VPS Hetzner
2. Установіть Docker
3. Клонуйте репозиторій OpenClaw
4. Створіть постійні каталоги на хості
5. Налаштуйте `.env` і `docker-compose.yml`
6. Вбудуйте необхідні бінарні файли в образ
7. Виконайте `docker compose up -d`
8. Перевірте збереження стану та доступ до Gateway

<Steps>
  <Step title="Створення VPS">
    Створіть VPS з Ubuntu або Debian у Hetzner, а потім підключіться як root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Розглядайте VPS як інфраструктуру зі станом, а не як одноразову.

  </Step>

  <Step title="Установлення Docker (на VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Перевірте:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Клонування репозиторію OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    У цьому посібнику створюється власний образ, щоб усі вбудовані в нього бінарні файли зберігалися після перезапусків.

  </Step>

  <Step title="Створення постійних каталогів на хості">
    Контейнери Docker є тимчасовими; увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Призначте власником користувача контейнера (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Налаштування змінних середовища">
    Створіть `.env` у корені репозиторію:

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

    Задайте `OPENCLAW_GATEWAY_TOKEN`, щоб керувати стабільним токеном Gateway через
    `.env`; інакше налаштуйте `gateway.auth.token`, перш ніж покладатися на роботу клієнтів
    після перезапусків. Якщо не задано жодного з них, OpenClaw використовує лише тимчасовий токен
    середовища виконання для цього запуску. Згенеруйте пароль сховища ключів для `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не додавайте цей файл до репозиторію.** Він містить змінні середовища контейнера/середовища виконання, як-от
    `OPENCLAW_GATEWAY_TOKEN`. Збережені дані автентифікації провайдера OAuth/API-ключем містяться в
    підключеному файлі `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Налаштування Docker Compose">
    Створіть або оновіть `docker-compose.yml`:

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
          # Рекомендовано: залиште Gateway доступним лише через loopback на VPS; підключайтеся через тунель SSH.
          # Щоб відкрити до нього публічний доступ, видаліть префікс `127.0.0.1:` і налаштуйте брандмауер відповідним чином.
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

    `--allow-unconfigured` призначений лише для зручності початкового налаштування й не замінює повноцінну конфігурацію Gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і безпечний режим прив’язки для свого розгортання.

  </Step>

  <Step title="Спільні кроки для середовища виконання віртуальної машини Docker">
    Дотримуйтеся спільного посібника із середовища виконання для типового процесу на хості Docker:

    - [Вбудуйте необхідні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збирання та запуск](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що й де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ, специфічний для Hetzner">
    Після виконання спільних кроків зі збирання та запуску відкрийте тунель.

    **Передумова:** переконайтеся, що конфігурація sshd на VPS дозволяє перенаправлення TCP. Якщо ви
    посилили захист конфігурації SSH, перевірте `/etc/ssh/sshd_config` і задайте:

    ```text
    AllowTcpForwarding local
    ```

    Значення `local` дозволяє локальне перенаправлення `ssh -L` із вашого ноутбука, водночас блокуючи
    зворотне перенаправлення із сервера. Значення `no` спричиняє помилку тунелю:
    `channel 3: open failed: administratively prohibited: open failed`

    Переконавшись, що перенаправлення TCP увімкнено, перезапустіть службу SSH
    (`systemctl restart ssh`) і запустіть тунель із ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Відкрийте `http://127.0.0.1:18789/` і вставте налаштований спільний секрет.
    У цьому посібнику за замовчуванням використовується токен Gateway; якщо ви перейшли на автентифікацію
    за паролем, натомість використовуйте налаштований пароль.

  </Step>
</Steps>

Спільну схему збереження стану наведено в розділі [Середовище виконання віртуальної машини Docker](/uk/install/docker-vm-runtime#what-persists-where).

## Інфраструктура як код (Terraform)

Для команд, які надають перевагу процесам «інфраструктура як код», підтримуване спільнотою налаштування Terraform надає:

- Модульну конфігурацію Terraform із віддаленим керуванням станом
- Автоматизоване створення ресурсів за допомогою cloud-init
- Скрипти розгортання (початкове налаштування, розгортання, резервне копіювання/відновлення)
- Посилення безпеки (брандмауер, UFW, доступ лише через SSH)
- Конфігурацію тунелю SSH для доступу до Gateway

**Репозиторії:**

- Інфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфігурація Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Цей підхід доповнює описане вище налаштування Docker відтворюваними розгортаннями, інфраструктурою під керуванням версій та автоматизованим аварійним відновленням.

<Note>
Підтримується спільнотою. Щоб повідомити про проблеми або зробити внесок, скористайтеся наведеними вище посиланнями на репозиторії.
</Note>

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Docker](/uk/install/docker)
- [Хостинг на VPS](/uk/vps)
