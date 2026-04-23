---
read_when:
    - Ви розгортаєте OpenClaw на хмарній VM з Docker
    - Вам потрібні спільний потік binary bake, persistence і оновлення
summary: Спільні кроки runtime Docker VM для довготривалих хостів Gateway OpenClaw
title: Docker VM runtime
x-i18n:
    generated_at: "2026-04-23T20:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 397da2403d46650a3d8a65be010b1393ac5c18e83e9c173f8237f5bb37dad4cc
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

Спільні кроки runtime для Docker-встановлень на VM, таких як GCP, Hetzner та подібні VPS-provider-и.

## Bake потрібних binary у image

Встановлювати binary всередині вже запущеного контейнера — це пастка.
Усе, що встановлюється під час runtime, буде втрачено після перезапуску.

Усі зовнішні binary, потрібні Skills, мають встановлюватися на етапі build image.

Наведені нижче приклади показують лише три поширені binary:

- `gog` для доступу до Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Це приклади, а не повний список.
Ви можете встановити стільки binary, скільки потрібно, за тим самим шаблоном.

Якщо пізніше ви додасте нові Skills, які залежать від додаткових binary, потрібно:

1. Оновити Dockerfile
2. Перебудувати image
3. Перезапустити контейнери

**Приклад Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
Наведені вище URL завантаження призначені для x86_64 (amd64). Для VM на базі ARM (наприклад, Hetzner ARM, GCP Tau T2A) замініть URL завантаження на відповідні ARM64-варіанти зі сторінки релізів кожного інструмента.
</Note>

## Build і запуск

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Якщо build завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM бракує пам’яті.
Перед повторною спробою використайте більший клас машини.

Перевірка binary:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Очікуваний вивід:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Перевірка Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Очікуваний вивід:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Що і де зберігається

OpenClaw працює в Docker, але Docker не є джерелом істини.
Увесь довготривалий стан має переживати перезапуски, перебудови та перезавантаження.

| Компонент           | Розташування                      | Механізм збереження   | Примітки                                                      |
| ------------------- | --------------------------------- | --------------------- | ------------------------------------------------------------- |
| Конфігурація Gateway | `/home/node/.openclaw/`           | Монтування host volume | Включає `openclaw.json`, `.env`                               |
| Профілі auth моделей | `/home/node/.openclaw/agents/`    | Монтування host volume | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Конфігурації Skill  | `/home/node/.openclaw/skills/`    | Монтування host volume | Стан на рівні Skill                                           |
| Workspace агента    | `/home/node/.openclaw/workspace/` | Монтування host volume | Код і артефакти агента                                        |
| Сесія WhatsApp      | `/home/node/.openclaw/`           | Монтування host volume | Зберігає QR-вхід                                              |
| Keyring Gmail       | `/home/node/.openclaw/`           | Host volume + пароль  | Потребує `GOG_KEYRING_PASSWORD`                               |
| Зовнішні binary     | `/usr/local/bin/`                 | Docker image          | Мають бути baked на етапі build                               |
| Runtime Node        | Файлова система контейнера        | Docker image          | Перебудовується під час кожного build image                   |
| Пакети ОС           | Файлова система контейнера        | Docker image          | Не встановлюйте під час runtime                               |
| Docker-контейнер    | Ефемерний                         | Придатний до перезапуску | Його безпечно знищувати                                    |

## Оновлення

Щоб оновити OpenClaw на VM:

```bash
git pull
docker compose build
docker compose up -d
```
