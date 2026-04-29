---
read_when:
    - Ви розгортаєте OpenClaw на хмарній віртуальній машині за допомогою Docker
    - Вам потрібні спільна підготовка бінарного файлу, збереження стану та процес оновлення
summary: Спільні кроки виконання у Docker VM для довготривалих хостів OpenClaw Gateway
title: Середовище виконання Docker VM
x-i18n:
    generated_at: "2026-04-29T02:46:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Спільні кроки середовища виконання для Docker-встановлень на основі віртуальних машин, як-от GCP, Hetzner і подібних постачальників VPS.

## Вбудуйте потрібні бінарні файли в образ

Установлення бінарних файлів усередині запущеного контейнера — це пастка.
Усе, що встановлено під час виконання, буде втрачено після перезапуску.

Усі зовнішні бінарні файли, потрібні для Skills, мають бути встановлені під час збирання образу.

Нижче наведено приклади лише трьох поширених бінарних файлів:

- `gog` (з `gogcli`) для доступу до Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Це приклади, а не повний список.
Ви можете встановити стільки бінарних файлів, скільки потрібно, використовуючи той самий шаблон.

Якщо згодом ви додасте нові Skills, які залежать від додаткових бінарних файлів, потрібно:

1. Оновити Dockerfile
2. Перезібрати образ
3. Перезапустити контейнери

**Приклад Dockerfile**

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
Наведені вище URL є прикладами. Для віртуальних машин на базі ARM вибирайте ресурси `arm64`. Для відтворюваних збірок закріплюйте версійовані URL релізів.
</Note>

## Збирання та запуск

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Якщо збирання завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, на віртуальній машині бракує пам’яті.
Перед повторною спробою використайте більший клас машини.

Перевірте бінарні файли:

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

Перевірте Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Очікуваний вивід:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Що і де зберігається

OpenClaw працює в Docker, але Docker не є джерелом істини.
Увесь довготривалий стан має переживати перезапуски, перезбирання й перезавантаження.

| Компонент           | Розташування                            | Механізм збереження      | Примітки                                                       |
| ------------------- | --------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| Конфігурація Gateway | `/home/node/.openclaw/`                 | Монтування тому хоста    | Містить `openclaw.json`, `.env`                                |
| Профілі автентифікації моделей | `/home/node/.openclaw/agents/` | Монтування тому хоста    | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys)  |
| Конфігурації Skills | `/home/node/.openclaw/skills/`          | Монтування тому хоста    | Стан на рівні Skills                                           |
| Робочий простір агента | `/home/node/.openclaw/workspace/`    | Монтування тому хоста    | Код і артефакти агента                                         |
| Сесія WhatsApp      | `/home/node/.openclaw/`                 | Монтування тому хоста    | Зберігає вхід через QR                                         |
| Сховище ключів Gmail | `/home/node/.openclaw/`                | Том хоста + пароль       | Потребує `GOG_KEYRING_PASSWORD`                                |
| Залежності середовища виконання Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Іменований том Docker | Згенеровані залежності вбудованих plugin і дзеркала середовища виконання |
| Зовнішні бінарні файли | `/usr/local/bin/`                    | Образ Docker             | Мають бути вбудовані під час збирання                          |
| Середовище виконання Node | Файлова система контейнера        | Образ Docker             | Перезбирається під час кожного збирання образу                 |
| Пакети ОС           | Файлова система контейнера              | Образ Docker             | Не встановлюйте під час виконання                              |
| Контейнер Docker    | Тимчасовий                              | Можна перезапустити      | Безпечно знищувати                                             |

## Оновлення

Щоб оновити OpenClaw на віртуальній машині:

```bash
git pull
docker compose build
docker compose up -d
```

## Пов’язане

- [Docker](/uk/install/docker)
- [Podman](/uk/install/podman)
- [ClawDock](/uk/install/clawdock)
