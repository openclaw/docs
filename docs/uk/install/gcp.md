---
read_when:
    - Ви хочете, щоб OpenClaw працював у GCP цілодобово й без вихідних
    - Вам потрібен готовий до промислової експлуатації, постійно доступний Gateway на власній віртуальній машині
    - Ви хочете мати повний контроль над збереженням даних, бінарними файлами та поведінкою під час перезапуску
summary: Запускайте OpenClaw Gateway цілодобово на віртуальній машині GCP Compute Engine (Docker) зі збереженням стану даних
title: GCP
x-i18n:
    generated_at: "2026-07-12T13:26:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Запустіть постійний OpenClaw Gateway на віртуальній машині GCP Compute Engine за допомогою Docker зі збереженням стану, вбудованими в образ бінарними файлами та безпечною поведінкою під час перезапуску.

Ціни залежать від типу машини та регіону; виберіть найменшу віртуальну машину, достатню для вашого навантаження, і збільште її ресурси, якщо виникатимуть помилки через нестачу пам’яті.

Доступ до Gateway можна отримати з ноутбука через перенаправлення портів SSH або безпосередньо відкривши порт, якщо ви самостійно керуєте брандмауером і токенами.

У цьому посібнику використовується Debian у GCP Compute Engine. Ubuntu також підтримується; відповідно зіставте пакети. Загальний процес для Docker див. у розділі [Docker](/uk/install/docker).

## Що вам потрібно

- Обліковий запис GCP (`e2-micro` відповідає умовам безкоштовного рівня)
- CLI `gcloud` або [Cloud Console](https://console.cloud.google.com)
- Доступ через SSH із ноутбука
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані постачальників (QR-код WhatsApp, токен бота Telegram, OAuth Gmail)
- Приблизно 20–30 хвилин

## Швидкий шлях

1. Створіть проєкт GCP, увімкніть виставлення рахунків і API Compute Engine
2. Створіть віртуальну машину Compute Engine (`e2-small`, Debian 12, 20 ГБ)
3. Підключіться до віртуальної машини через SSH та встановіть Docker
4. Клонуйте репозиторій OpenClaw
5. Створіть постійні каталоги на хості
6. Налаштуйте `.env` і `docker-compose.yml`
7. Вбудуйте необхідні бінарні файли, зберіть образ і запустіть його

<Steps>
  <Step title="Установлення CLI gcloud (або використання консолі)">
    Установіть його за інструкціями на [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), а потім виконайте:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Або виконайте всі наведені нижче кроки через вебінтерфейс [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Створення проєкту GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Увімкніть виставлення рахунків на [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (це обов’язково для Compute Engine).

    Еквівалентні дії в консолі: IAM & Admin > Create Project, увімкніть виставлення рахунків, а потім APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Створення віртуальної машини">
    | Тип       | Характеристики            | Вартість                      | Примітки                                                   |
    | --------- | ------------------------- | ----------------------------- | ---------------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 ГБ оперативної пам’яті          | приблизно $25/міс.            | Найнадійніший варіант для локального збирання Docker       |
    | e2-small  | 2 vCPU, 2 ГБ оперативної пам’яті          | приблизно $12/міс.            | Мінімально рекомендований варіант для збирання Docker      |
    | e2-micro  | 2 vCPU (спільні), 1 ГБ оперативної пам’яті | Відповідає безкоштовному рівню | Збирання Docker часто завершується через нестачу пам’яті (код виходу 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Підключення до віртуальної машини через SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    У консолі: натисніть "SSH" поруч із віртуальною машиною на панелі Compute Engine.

    Поширення ключа SSH після створення віртуальної машини може тривати 1–2 хвилини; якщо в підключенні відмовлено, зачекайте та повторіть спробу.

  </Step>

  <Step title="Установлення Docker (на віртуальній машині)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Вийдіть із системи та ввійдіть знову, щоб зміна групи набула чинності, а потім повторно підключіться через SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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
    Контейнери Docker є ефемерними; увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Налаштування змінних середовища">
    Створіть файл `.env` у корені репозиторію:

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

    Задайте `OPENCLAW_GATEWAY_TOKEN`, щоб керувати постійним токеном Gateway через
    `.env`; інакше налаштуйте `gateway.auth.token`, перш ніж покладатися на роботу клієнтів
    після перезапусків. Якщо не задано жодного з них, OpenClaw використовує лише тимчасовий токен
    для поточного запуску. Згенеруйте пароль сховища ключів для `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не додавайте цей файл до репозиторію.** Він містить змінні середовища контейнера й середовища виконання, як-от
    `OPENCLAW_GATEWAY_TOKEN`. Збережені облікові дані автентифікації постачальників за допомогою OAuth або ключа API містяться у
    змонтованому файлі `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Конфігурація Docker Compose">
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
          # Рекомендовано: залиште Gateway доступним лише через loopback на віртуальній машині; отримуйте доступ через тунель SSH.
          # Щоб зробити його загальнодоступним, видаліть префікс `127.0.0.1:` і відповідно налаштуйте брандмауер.
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

    `--allow-unconfigured` призначений лише для зручності початкового налаштування, а не як заміна справжньої конфігурації Gateway. Обов’язково налаштуйте автентифікацію (`gateway.auth.token` або пароль) і безпечний режим прив’язки для вашого розгортання.

  </Step>

  <Step title="Спільні кроки середовища виконання віртуальної машини Docker">
    Дотримуйтеся спільного посібника із середовища виконання для типового процесу на хості Docker:

    - [Вбудуйте необхідні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Зберіть і запустіть](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що й де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Примітки щодо запуску в GCP">
    Якщо збирання завершується помилкою `Killed` або `exit code 137` під час виконання `pnpm install --frozen-lockfile`, віртуальній машині бракує пам’яті. Використовуйте щонайменше `e2-small` або `e2-medium` для надійнішого першого збирання.

    У разі прив’язки до локальної мережі (`OPENCLAW_GATEWAY_BIND=lan`) перед продовженням налаштуйте довірене джерело браузера:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Якщо ви змінили порт, замініть `18789` на налаштоване значення.

  </Step>

  <Step title="Доступ із ноутбука">
    Створіть тунель SSH для перенаправлення порту Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Відкрийте `http://127.0.0.1:18789/` у браузері.

    Повторно виведіть чисте посилання на панель керування:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Якщо інтерфейс запитує автентифікацію за допомогою спільного секрету, вставте налаштований токен або
    пароль у налаштування Control UI (цей процес Docker за замовчуванням записує токен; якщо ви перейшли на
    автентифікацію за паролем, натомість використовуйте налаштований пароль).

    Якщо Control UI показує `unauthorized` або `disconnected (1008): pairing required`, схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Спільну схему збереження стану див. у розділі [Середовище виконання віртуальної машини Docker](/uk/install/docker-vm-runtime#what-persists-where), а процедуру оновлення — у розділі [процес оновлення](/uk/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Усунення несправностей

**У підключенні SSH відмовлено**

Поширення ключа SSH після створення віртуальної машини може тривати 1–2 хвилини. Зачекайте та повторіть спробу.

**Проблеми з OS Login**

Перевірте свій профіль OS Login:

```bash
gcloud compute os-login describe-profile
```

Переконайтеся, що ваш обліковий запис має необхідні дозволи IAM (Compute OS Login або Compute OS Admin Login).

**Нестача пам’яті**

Якщо збирання Docker завершується повідомленням `Killed` і кодом `exit code 137`, процес віртуальної машини було завершено через нестачу пам’яті:

```bash
# Спочатку зупиніть віртуальну машину
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Змініть тип машини
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Запустіть віртуальну машину
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Сервісні облікові записи (рекомендована практика безпеки)

Для особистого використання цілком підходить ваш стандартний обліковий запис користувача. Для автоматизації або CI/CD створіть окремий сервісний обліковий запис із мінімальними дозволами:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Не використовуйте роль Owner для автоматизації; виберіть найвужчу роль, якої достатньо. Див. [Відомості про ролі](https://cloud.google.com/iam/docs/understanding-roles).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Сполучіть локальні пристрої як вузли: [Вузли](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Azure](/uk/install/azure)
- [Розміщення на VPS](/uk/vps)
