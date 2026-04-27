---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на хмарному VPS (а не на вашому ноутбуці)
    - Вам потрібен production-рівня Gateway, який завжди працює, на власному VPS
    - Ви хочете повного контролю над збереженням стану, бінарними файлами й поведінкою перезапуску
    - Ви запускаєте OpenClaw у Docker на Hetzner або схожому провайдері
summary: Запуск OpenClaw Gateway 24/7 на недорогому VPS Hetzner (Docker) зі стійким станом і вбудованими бінарними файлами
title: Hetzner
x-i18n:
    generated_at: "2026-04-27T06:26:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c81b597601daf9af4daa5fb6061fa847c0fd19990de6cfcc8de405fdacbb011d
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw на Hetzner (Docker, посібник для production VPS)

## Мета

Запустити постійний Gateway OpenClaw на VPS Hetzner за допомогою Docker, зі стійким станом, вбудованими бінарними файлами та безпечною поведінкою перезапуску.

Якщо вам потрібен «OpenClaw 24/7 приблизно за $5», це найпростіше надійне налаштування.
Ціни Hetzner змінюються; оберіть найменший VPS на Debian/Ubuntu і збільшуйте ресурси, якщо почнете отримувати OOM.

Нагадування про модель безпеки:

- Спільні агенти для компанії — це нормально, коли всі перебувають у межах однієї довіреної зони, а runtime використовується лише для бізнесу.
- Дотримуйтеся жорсткого розділення: окремий VPS/runtime + окремі акаунти; без особистих профілів Apple/Google/браузера/менеджера паролів на цьому хості.
- Якщо користувачі є взаємно недовіреними, розділяйте за gateway/host/користувачем ОС.

Див. [Безпека](/uk/gateway/security) і [VPS hosting](/uk/vps).

## Що ми робимо (простими словами)?

- Орендуємо невеликий Linux-сервер (VPS Hetzner)
- Встановлюємо Docker (ізольоване runtime середовище застосунку)
- Запускаємо Gateway OpenClaw у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перебудови)
- Отримуємо доступ до Control UI з вашого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` включає `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
для кожного агента та `.env`.

До Gateway можна отримати доступ через:

- Переадресацію порту SSH з вашого ноутбука
- Пряме відкриття порту, якщо ви самі керуєте firewall і токенами

Цей посібник розрахований на Ubuntu або Debian на Hetzner.  
Якщо ви використовуєте інший Linux VPS, підберіть відповідні пакети.
Загальний сценарій для Docker див. у [Docker](/uk/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Підготуйте VPS Hetzner
2. Встановіть Docker
3. Клонуйте репозиторій OpenClaw
4. Створіть постійні каталоги на хості
5. Налаштуйте `.env` і `docker-compose.yml`
6. Вбудуйте потрібні бінарні файли в образ
7. `docker compose up -d`
8. Перевірте збереження стану та доступ до Gateway

---

## Що вам потрібно

- VPS Hetzner з root-доступом
- SSH-доступ з вашого ноутбука
- Базове вміння працювати з SSH + копіюванням/вставленням
- ~20 хвилин
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані провайдерів
  - QR WhatsApp
  - токен бота Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Підготуйте VPS">
    Створіть VPS з Ubuntu або Debian у Hetzner.

    Підключіться як root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    У цьому посібнику припускається, що VPS є stateful.
    Не розглядайте його як одноразову інфраструктуру.

  </Step>

  <Step title="Встановіть Docker (на VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Перевірка:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Клонуйте репозиторій OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    У цьому посібнику припускається, що ви збиратимете власний образ, щоб гарантувати збереження бінарних файлів.

  </Step>

  <Step title="Створіть постійні каталоги на хості">
    Контейнери Docker є ефемерними.
    Усі довготривалі дані мають зберігатися на хості.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Налаштуйте змінні середовища">
    Створіть `.env` у корені репозиторію.

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

    Залиште `OPENCLAW_GATEWAY_TOKEN` порожнім, якщо ви явно не хочете
    керувати ним через `.env`; OpenClaw записує випадковий токен gateway у
    конфігурацію під час першого запуску. Згенеруйте пароль keyring і вставте його в
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для env контейнера/runtime, наприклад `OPENCLAW_GATEWAY_TOKEN`.
    Збережена OAuth/API-key автентифікація провайдера живе в змонтованому
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Конфігурація Docker Compose">
    Створіть або оновіть `docker-compose.yml`.

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

    `--allow-unconfigured` призначено лише для зручності початкового налаштування, це не заміна належної конфігурації gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для вашого розгортання.

  </Step>

  <Step title="Спільні кроки runtime Docker VM">
    Скористайтеся спільним посібником runtime для типового сценарію Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збирання та запуск](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ, специфічний для Hetzner">
    Після спільних кроків збирання та запуску створіть тунель зі свого ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Відкрийте:

    `http://127.0.0.1:18789/`

    Вставте налаштований спільний секрет. Цей посібник за замовчуванням використовує токен gateway;
    якщо ви перейшли на автентифікацію за паролем, використовуйте натомість цей пароль.

  </Step>
</Steps>

Спільна схема збереження стану наведена в [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where).

## Інфраструктура як код (Terraform)

Для команд, які віддають перевагу сценаріям infrastructure-as-code, community-maintained конфігурація Terraform надає:

- Модульну конфігурацію Terraform з керуванням віддаленим станом
- Автоматизоване підготування через cloud-init
- Скрипти розгортання (bootstrap, deploy, backup/restore)
- Посилення безпеки (firewall, UFW, доступ лише через SSH)
- Налаштування SSH-тунелю для доступу до gateway

**Репозиторії:**

- Інфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфігурація Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Цей підхід доповнює наведене вище налаштування Docker відтворюваними розгортаннями, інфраструктурою під контролем версій і автоматизованим аварійним відновленням.

<Note>
Підтримується спільнотою. Якщо у вас є проблеми або внески, перегляньте посилання на репозиторії вище.
</Note>

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Docker](/uk/install/docker)
- [VPS hosting](/uk/vps)
