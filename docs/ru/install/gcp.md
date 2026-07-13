---
read_when:
    - Вы хотите, чтобы OpenClaw работал в GCP круглосуточно.
    - Вам нужен надежный, постоянно работающий Gateway промышленного уровня на собственной виртуальной машине
    - Вам нужен полный контроль над хранением данных, исполняемыми файлами и поведением при перезапуске
summary: Запуск OpenClaw Gateway 24/7 на виртуальной машине GCP Compute Engine (Docker) с постоянным хранилищем состояния
title: GCP
x-i18n:
    generated_at: "2026-07-13T18:15:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway на виртуальной машине GCP Compute Engine с помощью Docker, обеспечив долговременное хранение состояния, встроенные в образ бинарные файлы и безопасное поведение при перезапуске.

Стоимость зависит от типа машины и региона; выберите минимальную виртуальную машину, подходящую для вашей нагрузки, и увеличьте её размер, если возникают ошибки нехватки памяти.

Доступ к Gateway можно получить с ноутбука через перенаправление портов SSH или напрямую открыть порт, если вы самостоятельно управляете межсетевым экраном и токенами.

В этом руководстве используется Debian на GCP Compute Engine. Ubuntu также поддерживается; используйте соответствующие пакеты. Общий процесс работы с Docker описан в разделе [Docker](/ru/install/docker).

## Что потребуется

- Учётная запись GCP (`e2-micro` соответствует условиям бесплатного уровня)
- CLI `gcloud` или [Cloud Console](https://console.cloud.google.com)
- Доступ по SSH с ноутбука
- Docker и Docker Compose
- Учётные данные для аутентификации в модели
- Необязательные учётные данные провайдеров (QR-код WhatsApp, токен бота Telegram, OAuth Gmail)
- Около 20–30 минут

## Краткий порядок действий

1. Создайте проект GCP, включите оплату и API Compute Engine
2. Создайте виртуальную машину Compute Engine (`e2-small`, Debian 12, 20GB)
3. Подключитесь к виртуальной машине по SSH и установите Docker
4. Клонируйте репозиторий OpenClaw
5. Создайте постоянные каталоги на хосте
6. Настройте `.env` и `docker-compose.yml`
7. Встройте необходимые бинарные файлы, соберите и запустите систему

<Steps>
  <Step title="Установка CLI gcloud (или использование Console)">
    Установите его по инструкции на [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), затем выполните:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Вместо этого все приведённые ниже действия можно выполнить через веб-интерфейс [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Создание проекта GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Включите оплату на странице [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (это необходимо для Compute Engine).

    Аналогичные действия в Console: IAM & Admin > Create Project, включите оплату, затем APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Создание виртуальной машины">
    | Тип       | Характеристики            | Стоимость                 | Примечания                                             |
    | --------- | ------------------------- | ------------------------- | ------------------------------------------------------ |
    | e2-medium | 2 vCPU, 4GB ОЗУ           | Около $25 в месяц         | Наиболее надёжный вариант для локальной сборки Docker  |
    | e2-small  | 2 vCPU, 2GB ОЗУ           | Около $12 в месяц         | Рекомендуемый минимум для сборки Docker                |
    | e2-micro  | 2 vCPU (общие), 1GB ОЗУ   | Доступен бесплатный уровень | Сборка Docker часто завершается из-за нехватки памяти (код 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Подключение к виртуальной машине по SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    В Console нажмите "SSH" рядом с виртуальной машиной на панели Compute Engine.

    Распространение ключа SSH после создания виртуальной машины может занять 1–2 минуты; если в подключении отказано, подождите и повторите попытку.

  </Step>

  <Step title="Установка Docker (на виртуальной машине)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Чтобы изменение группы вступило в силу, выйдите из системы, снова войдите и повторно подключитесь по SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    В этом руководстве создаётся пользовательский образ, чтобы встроенные в него бинарные файлы сохранялись после перезапусков.

  </Step>

  <Step title="Создание постоянных каталогов на хосте">
    Контейнеры Docker являются временными; всё долговременное состояние должно храниться на хосте.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Настройка переменных окружения">
    Создайте `.env` в корне репозитория:

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

    Задайте `OPENCLAW_GATEWAY_TOKEN`, чтобы управлять постоянным токеном Gateway через
    `.env`; в противном случае настройте `gateway.auth.token`, прежде чем полагаться на клиентов
    после перезапусков. Если не задано ни одно из этих значений, OpenClaw использует только временный токен
    для текущего запуска. Создайте пароль связки ключей для `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не добавляйте этот файл в репозиторий.** В нём хранятся переменные окружения контейнера и среды выполнения, например
    `OPENCLAW_GATEWAY_TOKEN`. Сохранённые данные аутентификации OAuth и API-ключей провайдеров находятся в
    подключённом каталоге `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Настройка Docker Compose">
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
          # Рекомендуется: оставьте Gateway доступным только через loopback-интерфейс виртуальной машины; подключайтесь через туннель SSH.
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

    `--allow-unconfigured` предназначен только для упрощения первоначальной настройки и не заменяет полноценную конфигурацию Gateway. Обязательно настройте аутентификацию (`gateway.auth.token` или пароль) и безопасный режим привязки для своей среды.

  </Step>

  <Step title="Общие этапы настройки среды выполнения Docker на виртуальной машине">
    Выполните действия из общего руководства по среде выполнения на хосте Docker:

    - [Встройте необходимые бинарные файлы в образ](/ru/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Соберите и запустите](/ru/install/docker-vm-runtime#build-and-launch)
    - [Какие данные и где сохраняются](/ru/install/docker-vm-runtime#what-persists-where)
    - [Обновления](/ru/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Особенности запуска в GCP">
    Если во время `pnpm install --frozen-lockfile` сборка завершается с ошибкой `Killed` или `exit code 137`, виртуальной машине не хватает памяти. Используйте как минимум `e2-small` или `e2-medium` для более надёжной первоначальной сборки.

    При привязке к локальной сети (`OPENCLAW_GATEWAY_BIND=lan`) перед продолжением настройте доверенный источник браузера:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Если вы изменили порт, замените `18789` на настроенный номер порта.

  </Step>

  <Step title="Доступ с ноутбука">
    Создайте туннель SSH для перенаправления порта Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Откройте `http://127.0.0.1:18789/` в браузере.

    Повторно выведите корректную ссылку на панель управления:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Если интерфейс запрашивает аутентификацию с общим секретом, вставьте настроенный токен или
    пароль в настройки Control UI (по умолчанию этот процесс Docker записывает токен;
    если вы перешли на аутентификацию по паролю, используйте вместо него настроенный пароль).

    Если Control UI отображает `unauthorized` или `disconnected (1008): pairing required`, подтвердите устройство браузера:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Общую схему постоянного хранения данных см. в разделе [Среда выполнения Docker на виртуальной машине](/ru/install/docker-vm-runtime#what-persists-where), а процедуру обновления — в разделе [обновлений](/ru/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Устранение неполадок

**Отказ в подключении по SSH**

Распространение ключа SSH после создания виртуальной машины может занять 1–2 минуты. Подождите и повторите попытку.

**Проблемы с OS Login**

Проверьте профиль OS Login:

```bash
gcloud compute os-login describe-profile
```

Убедитесь, что у вашей учётной записи есть необходимые разрешения IAM (Compute OS Login или Compute OS Admin Login).

**Недостаточно памяти (OOM)**

Если сборка Docker завершается с `Killed` и `exit code 137`, процесс виртуальной машины был завершён из-за нехватки памяти:

```bash
# Сначала остановите виртуальную машину
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Измените тип машины
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Запустите виртуальную машину
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Сервисные аккаунты (рекомендуемая практика безопасности)

Для личного использования достаточно вашей обычной учётной записи пользователя. Для автоматизации или CI/CD создайте отдельный сервисный аккаунт с минимальными разрешениями:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Не используйте роль Owner для автоматизации; назначьте наиболее узкую подходящую роль. См. раздел [Общие сведения о ролях](https://cloud.google.com/iam/docs/understanding-roles).

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Свяжите локальные устройства как узлы: [Узлы](/ru/nodes)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)

## См. также

- [Обзор установки](/ru/install)
- [Azure](/ru/install/azure)
- [Размещение на VPS](/ru/vps)
