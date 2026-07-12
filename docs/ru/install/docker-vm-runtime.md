---
read_when:
    - Вы развёртываете OpenClaw на облачной виртуальной машине с помощью Docker
    - Вам нужен общий процесс сборки бинарного файла, обеспечения постоянства данных и обновления
summary: Этапы настройки общей среды выполнения виртуальной машины Docker для долгосрочно работающих хостов OpenClaw Gateway
title: Среда выполнения виртуальной машины Docker
x-i18n:
    generated_at: "2026-07-12T11:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Общие шаги настройки среды выполнения для установки Docker в виртуальных машинах, например у GCP, Hetzner и аналогичных провайдеров VPS.

## Включение необходимых исполняемых файлов в образ

Устанавливать исполняемые файлы в работающем контейнере — плохая практика: всё установленное во время выполнения теряется после перезапуска. Включайте каждый внешний исполняемый файл, необходимый Skills, в образ на этапе сборки.

В примерах ниже рассматриваются только три исполняемых файла в алфавитном порядке:

- `gog` (из `gogcli`) для доступа к Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Это примеры, а не полный список. Установите по той же схеме столько исполняемых файлов, сколько требуется вашим Skills. Если позднее вы добавите Skills, которому нужен новый исполняемый файл:

1. Обновите Dockerfile.
2. Пересоберите образ.
3. Перезапустите контейнеры.

**Пример Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Пример исполняемого файла 1: CLI для Gmail (gogcli — устанавливается как `gog`)
# Скопируйте URL текущего файла для Linux со страницы https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Пример исполняемого файла 2: CLI для Google Places
# Скопируйте URL текущего файла для Linux со страницы https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Пример исполняемого файла 3: CLI для WhatsApp
# Скопируйте URL текущего файла для Linux со страницы https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Добавьте ниже другие исполняемые файлы по той же схеме

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Приведённые выше URL служат примерами. Для виртуальных машин на базе ARM выбирайте файлы `arm64`. Для воспроизводимых сборок указывайте URL выпусков с фиксированными версиями.
</Note>

## Сборка и запуск

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Если во время `pnpm install --frozen-lockfile` сборка завершается с сообщением `Killed` или кодом выхода 137, виртуальной машине не хватает памяти. Перед повторной попыткой выберите более мощный класс машины.

Проверьте исполняемые файлы:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Ожидаемый вывод:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Убедитесь, что Gateway запущен:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Ответ 200 от `/healthz` подтверждает, что процесс Gateway принимает подключения и работает исправно; встроенная в образ проверка `HEALTHCHECK` опрашивает ту же конечную точку.

## Где и какие данные сохраняются

OpenClaw работает в Docker, но Docker не является источником достоверных данных. Всё долговременное состояние должно сохраняться при перезапусках, пересборках и перезагрузках.

| Компонент                       | Расположение                                           | Механизм сохранения            | Примечания                                                                                                                         |
| ------------------------------- | ------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Конфигурация Gateway            | `/home/node/.openclaw/`                                | Подключение тома хоста         | Включает `openclaw.json`                                                                                                           |
| Учётные данные каналов/провайдеров | `/home/node/.openclaw/credentials/`                 | Подключение тома хоста         | Материалы учётных данных каналов и провайдеров                                                                                      |
| Профили аутентификации моделей  | `/home/node/.openclaw/agents/`                         | Подключение тома хоста         | `agents/<agentId>/agent/auth-profiles.json` (OAuth, ключи API)                                                                      |
| Устаревший файл ключей OAuth    | `/home/node/.config/openclaw/`                         | Подключение тома хоста         | Совместимость только для чтения с дополнительными файлами OAuth до миграции; `openclaw doctor --fix` переносит их в `auth-profiles.json` |
| Конфигурации Skills             | `/home/node/.openclaw/skills/`                         | Подключение тома хоста         | Состояние на уровне Skills                                                                                                         |
| Рабочая область агента          | `/home/node/.openclaw/workspace/`                      | Подключение тома хоста         | Код и артефакты агента                                                                                                             |
| Сеанс WhatsApp                  | `/home/node/.openclaw/`                                | Подключение тома хоста         | Сохраняет вход по QR-коду                                                                                                          |
| Хранилище ключей Gmail          | `/home/node/.openclaw/`                                | Том хоста + пароль             | Требуется `GOG_KEYRING_PASSWORD`                                                                                                   |
| Пакеты Plugin                   | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Подключение тома хоста         | Корневые каталоги загружаемых пакетов Plugin                                                                                        |
| Внешние исполняемые файлы       | `/usr/local/bin/`                                      | Образ Docker                   | Должны включаться на этапе сборки                                                                                                   |
| Среда выполнения Node           | Файловая система контейнера                            | Образ Docker                   | Пересобирается при каждой сборке образа                                                                                             |
| Пакеты ОС                       | Файловая система контейнера                            | Образ Docker                   | Не устанавливайте во время выполнения                                                                                              |
| Контейнер Docker                | Временный                                              | Перезапускаемый                | Можно безопасно удалить                                                                                                            |

## Обновления

Чтобы обновить OpenClaw на виртуальной машине:

```bash
git pull
docker compose build
docker compose up -d
```

## Связанные материалы

- [Docker](/ru/install/docker)
- [Podman](/ru/install/podman)
- [ClawDock](/ru/install/clawdock)
