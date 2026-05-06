---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на GCP
    - Вам потрібен Gateway промислового рівня, який постійно працює на вашій власній віртуальній машині.
    - Вам потрібен повний контроль над збереженням стану, бінарними файлами та поведінкою перезапуску
summary: Запуск OpenClaw Gateway 24/7 на віртуальній машині GCP Compute Engine (Docker) із надійним збереженням стану
title: GCP
x-i18n:
    generated_at: "2026-05-06T01:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Запустіть постійний OpenClaw Gateway на VM GCP Compute Engine за допомогою Docker, із тривалим збереженням стану, вбудованими бінарними файлами та безпечною поведінкою перезапуску.

Якщо вам потрібен «OpenClaw 24/7 приблизно за $5-12/міс.», це надійне налаштування в Google Cloud.
Ціна залежить від типу машини та регіону; виберіть найменшу VM, яка підходить для вашого навантаження, і збільшуйте ресурси, якщо натрапите на OOM.

## Що ми робимо (простими словами)?

- Створюємо проєкт GCP і вмикаємо білінг
- Створюємо VM Compute Engine
- Встановлюємо Docker (ізольоване середовище виконання застосунку)
- Запускаємо OpenClaw Gateway у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (зберігається після перезапусків/перезбирань)
- Отримуємо доступ до інтерфейсу керування з вашого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` включає `openclaw.json`, окремі для кожного агента
`agents/<agentId>/agent/auth-profiles.json` і `.env`.

До Gateway можна отримати доступ через:

- SSH-переадресацію портів із вашого ноутбука
- Пряме відкриття порту, якщо ви самостійно керуєте firewall і токенами

У цьому посібнику використовується Debian на GCP Compute Engine.
Ubuntu також працює; зіставте пакети відповідно.
Для загального процесу Docker див. [Docker](/uk/install/docker).

---

## Швидкий шлях (досвідчені оператори)

1. Створіть проєкт GCP + увімкніть Compute Engine API
2. Створіть VM Compute Engine (e2-small, Debian 12, 20GB)
3. Підключіться до VM через SSH
4. Встановіть Docker
5. Клонуйте репозиторій OpenClaw
6. Створіть постійні директорії на хості
7. Налаштуйте `.env` і `docker-compose.yml`
8. Вбудуйте потрібні бінарні файли, зберіть і запустіть

---

## Що вам потрібно

- Обліковий запис GCP (free tier підходить для e2-micro)
- Встановлений gcloud CLI (або використовуйте Cloud Console)
- SSH-доступ із вашого ноутбука
- Базова впевненість у роботі з SSH + копіюванням/вставлянням
- ~20-30 хвилин
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані провайдерів
  - QR WhatsApp
  - токен бота Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Встановіть gcloud CLI (або використовуйте Console)">
    **Варіант A: gcloud CLI** (рекомендовано для автоматизації)

    Встановіть із [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Ініціалізуйте й автентифікуйтеся:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Варіант B: Cloud Console**

    Усі кроки можна виконати через вебінтерфейс за адресою [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Створіть проєкт GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Увімкніть білінг на [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (потрібно для Compute Engine).

    Увімкніть Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Перейдіть до IAM & Admin > Create Project
    2. Назвіть його та створіть
    3. Увімкніть білінг для проєкту
    4. Перейдіть до APIs & Services > Enable APIs > знайдіть "Compute Engine API" > Enable

  </Step>

  <Step title="Створіть VM">
    **Типи машин:**

    | Тип       | Характеристики           | Вартість           | Примітки                                     |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/міс.          | Найнадійніший для локальних збірок Docker    |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/міс.          | Мінімально рекомендований для збірки Docker  |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Доступний у free tier | Часто завершується помилкою OOM під час збірки Docker (exit 137) |

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
    6. Створіть

  </Step>

  <Step title="Підключіться до VM через SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Натисніть кнопку "SSH" поруч із вашою VM на панелі Compute Engine.

    Примітка: поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Якщо з’єднання відхилено, зачекайте й повторіть спробу.

  </Step>

  <Step title="Встановіть Docker (на VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Вийдіть і зайдіть знову, щоб зміна групи набула чинності:

    ```bash
    exit
    ```

    Потім знову підключіться через SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Цей посібник передбачає, що ви збиратимете власний образ, щоб гарантувати збереження бінарних файлів.

  </Step>

  <Step title="Створіть постійні директорії на хості">
    Контейнери Docker є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

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

    Залиште `OPENCLAW_GATEWAY_TOKEN` порожнім, якщо ви явно не хочете
    керувати ним через `.env`; OpenClaw під час першого запуску записує
    випадковий токен gateway у конфігурацію. Згенеруйте пароль keyring і вставте його в
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для середовища контейнера/середовища виконання, наприклад `OPENCLAW_GATEWAY_TOKEN`.
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

  <Step title="Спільні кроки середовища виконання Docker VM">
    Використовуйте спільний посібник із середовища виконання для типового процесу Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Зберіть і запустіть](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Примітки щодо запуску для GCP">
    На GCP, якщо збірка завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM бракує пам’яті. Використовуйте щонайменше `e2-small` або `e2-medium` для надійніших перших збірок.

    Під час прив’язування до LAN (`OPENCLAW_GATEWAY_BIND=lan`) налаштуйте довірене джерело браузера, перш ніж продовжувати:

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

    Якщо UI запитує автентифікацію shared-secret, вставте налаштований токен або
    пароль у параметри інтерфейсу керування. Цей процес Docker типово записує токен;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Якщо інтерфейс керування показує `unauthorized` або `disconnected (1008): pairing required`, схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Знову потрібна довідка щодо спільного збереження стану й оновлень?
    Див. [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where) і [оновлення Docker VM Runtime](/uk/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Усунення несправностей

**SSH-з’єднання відхилено**

Поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Зачекайте й повторіть спробу.

**Проблеми з OS Login**

Перевірте свій профіль OS Login:

```bash
gcloud compute os-login describe-profile
```

Переконайтеся, що ваш обліковий запис має потрібні дозволи IAM (Compute OS Login або Compute OS Admin Login).

**Брак пам’яті (OOM)**

Якщо збірка Docker завершується помилкою `Killed` і `exit code 137`, VM було завершено через OOM. Перейдіть на e2-small (мінімум) або e2-medium (рекомендовано для надійних локальних збірок):

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Сервісні облікові записи (найкраща практика безпеки)

Для особистого використання ваш стандартний обліковий запис користувача працює нормально.

Для автоматизації або CI/CD-пайплайнів створіть окремий сервісний обліковий запис із мінімальними дозволами:

1. Створіть сервісний обліковий запис:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Надайте роль Compute Instance Admin (або вужчу користувацьку роль):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Уникайте використання ролі Owner для автоматизації. Дотримуйтеся принципу найменших привілеїв.

Див. [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles), щоб дізнатися більше про ролі IAM.

---

## Наступні кроки

- Налаштуйте канали повідомлень: [Канали](/uk/channels)
- Сполучіть локальні пристрої як вузли: [Вузли](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Azure](/uk/install/azure)
- [VPS-хостинг](/uk/vps)
