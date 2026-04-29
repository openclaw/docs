---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на хмарному VPS (а не на вашому ноутбуці)
    - Вам потрібен Gateway виробничого рівня, який завжди працює, на вашому власному VPS
    - Вам потрібен повний контроль над постійним зберіганням, бінарними файлами та поведінкою перезапуску
    - Ви запускаєте OpenClaw у Docker на Hetzner або в подібного провайдера
summary: Запуск OpenClaw Gateway 24/7 на недорогому VPS Hetzner (Docker) із персистентним станом і вбудованими бінарними файлами
title: Hetzner
x-i18n:
    generated_at: "2026-04-29T03:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw на Hetzner (Docker, посібник для виробничого VPS)

## Мета

Запустити постійний OpenClaw Gateway на Hetzner VPS за допомогою Docker, зі стійким станом, вбудованими бінарними файлами та безпечною поведінкою перезапуску.

Якщо вам потрібен «OpenClaw 24/7 приблизно за $5», це найпростіше надійне налаштування.
Ціни Hetzner змінюються; оберіть найменший Debian/Ubuntu VPS і масштабуйтеся вгору, якщо зіткнетеся з OOM.

Нагадування про модель безпеки:

- Агенти, спільні для компанії, підходять, коли всі перебувають в одній межі довіри, а середовище виконання призначене лише для бізнесу.
- Дотримуйтеся суворого розділення: окремий VPS/середовище виконання + окремі облікові записи; жодних особистих профілів Apple/Google/браузера/менеджера паролів на цьому хості.
- Якщо користувачі можуть бути ворожими один до одного, розділяйте за gateway/хостом/користувачем ОС.

Див. [Безпека](/uk/gateway/security) і [хостинг VPS](/uk/vps).

## Що ми робимо (простими словами)?

- Орендуємо невеликий Linux-сервер (Hetzner VPS)
- Встановлюємо Docker (ізольоване середовище виконання застосунку)
- Запускаємо OpenClaw Gateway у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перебудови)
- Отримуємо доступ до інтерфейсу керування з ноутбука через SSH-тунель

Змонтований стан `~/.openclaw` містить `openclaw.json`, індивідуальні для агентів
`agents/<agentId>/agent/auth-profiles.json` і `.env`.

До Gateway можна отримати доступ через:

- Переадресацію SSH-порту з вашого ноутбука
- Пряме відкриття порту, якщо ви самостійно керуєте firewall і токенами

Цей посібник передбачає Ubuntu або Debian на Hetzner.  
Якщо ви використовуєте інший Linux VPS, зіставте пакети відповідним чином.
Для загального процесу Docker див. [Docker](/uk/install/docker).

---

## Швидкий шлях (досвідчені оператори)

1. Створіть Hetzner VPS
2. Встановіть Docker
3. Клонуйте репозиторій OpenClaw
4. Створіть постійні каталоги на хості
5. Налаштуйте `.env` і `docker-compose.yml`
6. Вбудуйте потрібні бінарні файли в образ
7. `docker compose up -d`
8. Перевірте збереження стану й доступ до Gateway

---

## Що потрібно

- Hetzner VPS із root-доступом
- SSH-доступ із вашого ноутбука
- Базова впевненість у роботі з SSH + копіюванням/вставленням
- Приблизно 20 хвилин
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані провайдерів
  - QR для WhatsApp
  - Токен бота Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Підготуйте VPS">
    Створіть Ubuntu або Debian VPS у Hetzner.

    Підключіться як root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Цей посібник передбачає, що VPS є stateful.
    Не розглядайте його як одноразову інфраструктуру.

  </Step>

  <Step title="Встановіть Docker (на VPS)">
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

  <Step title="Клонуйте репозиторій OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Цей посібник передбачає, що ви зберете власний образ, щоб гарантувати збереження бінарних файлів.

  </Step>

  <Step title="Створіть постійні каталоги на хості">
    Контейнери Docker є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

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
    керувати ним через `.env`; OpenClaw під час першого запуску записує випадковий токен gateway у
    конфігурацію. Згенеруйте пароль keyring і вставте його в
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для змінних середовища контейнера/середовища виконання, як-от `OPENCLAW_GATEWAY_TOKEN`.
    Збережена OAuth/API-key автентифікація провайдерів міститься у змонтованому
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

    `--allow-unconfigured` призначений лише для зручності початкового налаштування, це не заміна належної конфігурації gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для вашого розгортання.

  </Step>

  <Step title="Спільні кроки середовища виконання Docker VM">
    Використовуйте спільний посібник середовища виконання для загального процесу Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Зберіть і запустіть](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ, специфічний для Hetzner">
    Після спільних кроків збирання й запуску виконайте таке налаштування, щоб відкрити тунель:

    **Передумова:** Переконайтеся, що конфігурація sshd вашого VPS дозволяє TCP forwarding. Якщо ви
    посилили конфігурацію SSH, перевірте `/etc/ssh/sshd_config` і встановіть:

    ```
    AllowTcpForwarding local
    ```

    `local` дозволяє локальні переадресації `ssh -L` з вашого ноутбука, одночасно блокуючи
    remote forwards із сервера. Значення `no` призведе до збою тунелю з:
    `channel 3: open failed: administratively prohibited: open failed`

    Після підтвердження, що TCP forwarding увімкнено, перезапустіть службу SSH
    (`systemctl restart ssh`) і запустіть тунель із вашого ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Відкрийте:

    `http://127.0.0.1:18789/`

    Вставте налаштований спільний секрет. Цей посібник типово використовує токен gateway;
    якщо ви перейшли на автентифікацію паролем, натомість використайте цей пароль.

  </Step>
</Steps>

Спільна карта збереження стану міститься в [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where).

## Інфраструктура як код (Terraform)

Для команд, які віддають перевагу workflow інфраструктури як коду, підтримуване спільнотою налаштування Terraform надає:

- Модульну конфігурацію Terraform із керуванням віддаленим станом
- Автоматичне створення через cloud-init
- Скрипти розгортання (bootstrap, deploy, backup/restore)
- Посилення безпеки (firewall, UFW, доступ лише через SSH)
- Конфігурацію SSH-тунелю для доступу до gateway

**Репозиторії:**

- Інфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфігурація Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Цей підхід доповнює наведене вище налаштування Docker відтворюваними розгортаннями, інфраструктурою під контролем версій і автоматизованим аварійним відновленням.

<Note>
Підтримується спільнотою. Щодо проблем або внесків див. посилання на репозиторії вище.
</Note>

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Docker](/uk/install/docker)
- [Хостинг VPS](/uk/vps)
