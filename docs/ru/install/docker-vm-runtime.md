---
read_when:
    - Вы развертываете OpenClaw на облачной ВМ с Docker
    - Вам нужен общий процесс сборки бинарного файла, сохранения состояния и обновления
summary: Общие шаги выполнения Docker VM для долгоживущих хостов OpenClaw Gateway
title: Среда выполнения Docker VM
x-i18n:
    generated_at: "2026-06-28T23:05:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6a01c20ac6b85a32167fd1d897368ee0ebc6997cbc95a25f831ea7dd2e623c9
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Общие шаги среды выполнения для Docker-установок на базе VM, таких как GCP, Hetzner и похожие VPS-провайдеры.

## Встройте обязательные бинарные файлы в образ

Установка бинарных файлов внутри запущенного контейнера — ловушка.
Все, что устанавливается во время выполнения, будет потеряно при перезапуске.

Все внешние бинарные файлы, требуемые навыками, должны быть установлены во время сборки образа.

Примеры ниже показывают только три распространенных бинарных файла:

- `gog` (из `gogcli`) для доступа к Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Это примеры, а не полный список.
Вы можете установить столько бинарных файлов, сколько нужно, используя тот же шаблон.

Если позже вы добавите новые навыки, зависящие от дополнительных бинарных файлов, необходимо:

1. Обновить Dockerfile
2. Пересобрать образ
3. Перезапустить контейнеры

**Пример Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

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
URL-адреса выше являются примерами. Для VM на базе ARM выбирайте ресурсы `arm64`. Для воспроизводимых сборок закрепляйте URL-адреса версионированных релизов.
</Note>

## Сборка и запуск

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Если сборка завершается ошибкой `Killed` или `exit code 137` во время `pnpm install --frozen-lockfile`, на VM не хватает памяти.
Перед повторной попыткой используйте класс машины большего размера.

Проверьте бинарные файлы:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Ожидаемый вывод:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Проверьте Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Ожидаемый вывод:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Что где сохраняется

OpenClaw работает в Docker, но Docker не является источником истины.
Все долговременное состояние должно переживать перезапуски, пересборки и перезагрузки.

| Компонент           | Расположение                                           | Механизм сохранения    | Примечания                                                    |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Конфигурация Gateway | `/home/node/.openclaw/`                                | Монтирование тома хоста | Включает `openclaw.json`, `.env`                              |
| Профили авторизации моделей | `/home/node/.openclaw/agents/`                         | Монтирование тома хоста | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API-ключи) |
| Ключ профиля авторизации | `/home/node/.config/openclaw/`                         | Монтирование тома хоста | Локальный ключ шифрования для токенов профиля авторизации OAuth |
| Конфигурации навыков | `/home/node/.openclaw/skills/`                         | Монтирование тома хоста | Состояние уровня навыка                                       |
| Рабочая область агента | `/home/node/.openclaw/workspace/`                      | Монтирование тома хоста | Код и артефакты агента                                       |
| Сессия WhatsApp     | `/home/node/.openclaw/`                                | Монтирование тома хоста | Сохраняет вход по QR-коду                                    |
| Хранилище ключей Gmail | `/home/node/.openclaw/`                                | Том хоста + пароль     | Требует `GOG_KEYRING_PASSWORD`                               |
| Пакеты Plugin       | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Монтирование тома хоста | Корневые каталоги загружаемых пакетов Plugin                  |
| Внешние бинарные файлы | `/usr/local/bin/`                                      | Образ Docker           | Должны быть встроены во время сборки                         |
| Среда выполнения Node | Файловая система контейнера                            | Образ Docker           | Пересобирается при каждой сборке образа                      |
| Пакеты ОС           | Файловая система контейнера                            | Образ Docker           | Не устанавливайте во время выполнения                        |
| Контейнер Docker    | Эфемерный                                             | Перезапускаемый        | Можно безопасно удалить                                      |

## Обновления

Чтобы обновить OpenClaw на VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Связанные материалы

- [Docker](/ru/install/docker)
- [Podman](/ru/install/podman)
- [ClawDock](/ru/install/clawdock)
