---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на GCP
    - Ви хочете production-grade Gateway, що працює постійно, на вашій власній VM
    - Ви хочете повний контроль над збереженням даних, бінарними файлами та поведінкою перезапуску
summary: Запустіть Gateway OpenClaw 24/7 на VM GCP Compute Engine (Docker) зі стійким станом
title: GCP
x-i18n:
    generated_at: "2026-04-18T17:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw на GCP Compute Engine (Docker, посібник для production VPS)

## Мета

Запустити постійний Gateway OpenClaw на VM GCP Compute Engine за допомогою Docker, зі стійким станом, вбудованими бінарними файлами та безпечною поведінкою перезапуску.

Якщо ви хочете "OpenClaw 24/7 приблизно за $5-12/міс", це надійне налаштування на Google Cloud.
Вартість залежить від типу машини та регіону; виберіть найменшу VM, яка відповідає вашому навантаженню, і збільшуйте її, якщо почнете отримувати OOM.

## Що ми робимо (простими словами)?

- Створюємо проєкт GCP і вмикаємо білінг
- Створюємо VM Compute Engine
- Встановлюємо Docker (ізольоване середовище виконання застосунку)
- Запускаємо Gateway OpenClaw у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перезбірки)
- Отримуємо доступ до Control UI з вашого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` включає `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` для кожного агента та `.env`.

До Gateway можна отримати доступ через:

- переадресацію SSH-порту з вашого ноутбука
- пряме відкриття порту, якщо ви самостійно керуєте firewall і токенами

У цьому посібнику використовується Debian на GCP Compute Engine.
Ubuntu також підійде; зіставте пакети відповідним чином.
Загальний процес Docker див. у [Docker](/uk/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Створіть проєкт GCP + увімкніть API Compute Engine
2. Створіть VM Compute Engine (e2-small, Debian 12, 20GB)
3. Підключіться до VM через SSH
4. Встановіть Docker
5. Клонуйте репозиторій OpenClaw
6. Створіть постійні каталоги на хості
7. Налаштуйте `.env` і `docker-compose.yml`
8. Вбудуйте потрібні бінарні файли, зберіть і запустіть

---

## Що вам знадобиться

- обліковий запис GCP (рівень free tier доступний для e2-micro)
- встановлений CLI `gcloud` (або використовуйте Cloud Console)
- доступ SSH з вашого ноутбука
- базове розуміння SSH + копіювання/вставлення
- ~20-30 хвилин
- Docker і Docker Compose
- облікові дані автентифікації моделі
- необов’язкові облікові дані провайдерів
  - QR WhatsApp
  - токен бота Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Встановіть CLI gcloud (або використовуйте Console)">
    **Варіант A: CLI `gcloud`** (рекомендовано для автоматизації)

    Встановіть за посиланням [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Ініціалізуйте та автентифікуйтеся:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Варіант B: Cloud Console**

    Усі кроки можна виконати через веб-інтерфейс за адресою [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Створіть проєкт GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Увімкніть білінг на [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (обов’язково для Compute Engine).

    Увімкніть API Compute Engine:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Перейдіть до IAM & Admin > Create Project
    2. Вкажіть назву та створіть проєкт
    3. Увімкніть білінг для проєкту
    4. Перейдіть до APIs & Services > Enable APIs > знайдіть "Compute Engine API" > Enable

  </Step>

  <Step title="Створіть VM">
    **Типи машин:**

    | Type      | Specs                    | Cost               | Notes                                           |
    | --------- | ------------------------ | ------------------ | ----------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mo            | Найнадійніший варіант для локальних збірок Docker |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mo            | Мінімально рекомендований для збірки Docker     |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Free tier eligible | Часто завершується помилкою OOM під час збірки Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Перейдіть до Compute Engine > VM instances > Create instance
    2. Назва: `openclaw-gateway`
    3. Регіон: `us-central1`, зона: `us-central1-a`
    4. Тип машини: `e2-small`
    5. Завантажувальний диск: Debian 12, 20GB
    6. Створіть інстанс

  </Step>

  <Step title="Підключіться до VM через SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Натисніть кнопку "SSH" поруч із вашою VM на панелі Compute Engine.

    Примітка: поширення SSH-ключів може тривати 1-2 хвилини після створення VM. Якщо з’єднання відхиляється, зачекайте та повторіть спробу.

  </Step>

  <Step title="Встановіть Docker (на VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Вийдіть із сеансу та увійдіть знову, щоб зміна групи набула чинності:

    ```bash
    exit
    ```

    Потім знову підключіться через SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Налаштуйте змінні середовища">
    Створіть `.env` у корені репозиторію.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Залиште `OPENCLAW_GATEWAY_TOKEN` порожнім, якщо ви не хочете явно
    керувати ним через `.env`; під час першого запуску OpenClaw записує
    випадковий токен Gateway у конфігурацію. Згенеруйте пароль keyring і
    вставте його в `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для змінних середовища контейнера/середовища виконання, таких як `OPENCLAW_GATEWAY_TOKEN`.
    Збережена автентифікація провайдерів через OAuth/API-ключі знаходиться у змонтованому
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
          # Рекомендовано: залишайте Gateway доступним лише через loopback на VM; підключайтеся через SSH-тунель.
          # Щоб відкрити його публічно, приберіть префікс `127.0.0.1:` і відповідно налаштуйте firewall.
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

    `--allow-unconfigured` призначений лише для зручності початкового налаштування, він не замінює належну конфігурацію Gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для вашого розгортання.

  </Step>

  <Step title="Спільні кроки середовища виконання Docker VM">
    Для стандартного процесу Docker-хоста використовуйте спільний посібник із середовища виконання:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збірка та запуск](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Примітки щодо запуску на GCP">
    На GCP, якщо збірка завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM не вистачає пам’яті. Використовуйте щонайменше `e2-small` або `e2-medium` для більш надійних перших збірок.

    Під час прив’язки до LAN (`OPENCLAW_GATEWAY_BIND=lan`) перед продовженням налаштуйте довірене джерело браузера:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Якщо ви змінили порт gateway, замініть `18789` на налаштований порт.

  </Step>

  <Step title="Доступ із вашого ноутбука">
    Створіть SSH-тунель для переадресації порту Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Відкрийте у браузері:

    `http://127.0.0.1:18789/`

    Повторно виведіть чисте посилання на панель:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Якщо UI просить автентифікацію через shared secret, вставте налаштований токен або
    пароль у налаштуваннях Control UI. У цьому процесі Docker за замовчуванням записується токен;
    якщо ви переключите конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Якщо в Control UI показується `unauthorized` або `disconnected (1008): pairing required`, схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Потрібне ще раз посилання на спільний довідник про збереження даних і оновлення?
    Див. [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where) і [оновлення Docker VM Runtime](/uk/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Усунення несправностей

**SSH connection refused**

Поширення SSH-ключів може тривати 1-2 хвилини після створення VM. Зачекайте та повторіть спробу.

**Проблеми з OS Login**

Перевірте свій профіль OS Login:

```bash
gcloud compute os-login describe-profile
```

Переконайтеся, що ваш обліковий запис має потрібні IAM-дозволи (Compute OS Login або Compute OS Admin Login).

**Брак пам’яті (OOM)**

Якщо збірка Docker завершується з `Killed` і `exit code 137`, процес був завершений через нестачу пам’яті. Перейдіть на e2-small (мінімум) або e2-medium (рекомендовано для надійних локальних збірок):

```bash
# Спочатку зупиніть VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Змініть тип машини
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Запустіть VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Сервісні облікові записи (найкраща практика безпеки)

Для особистого використання ваш стандартний обліковий запис користувача цілком підходить.

Для автоматизації або конвеєрів CI/CD створіть окремий сервісний обліковий запис із мінімальними дозволами:

1. Створіть сервісний обліковий запис:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Надайте роль Compute Instance Admin (або вужчу спеціальну роль):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Не використовуйте роль Owner для автоматизації. Дотримуйтеся принципу найменших привілеїв.

Докладніше про ролі IAM див. за посиланням [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Під’єднайте локальні пристрої як Node: [Node](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
