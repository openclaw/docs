---
read_when:
    - Ви розгортаєте OpenClaw на хмарній віртуальній машині з Docker
    - Вам потрібні спільне збирання бінарного файлу, збереження стану та процес оновлення
summary: Спільні кроки запуску віртуальної машини Docker для довготривалих хостів OpenClaw Gateway
title: Середовище виконання Docker VM
x-i18n:
    generated_at: "2026-04-28T11:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1561022cea1e8534f55942186def31d2cb11ab554351b0bf1d9b5940ad6458b
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Спільні кроки середовища виконання для Docker-встановлень на базі VM, як-от GCP, Hetzner та подібних постачальників VPS.

## Вбудуйте потрібні бінарні файли в образ

Встановлення бінарних файлів усередині запущеного контейнера — це пастка.
Усе, встановлене під час виконання, буде втрачено після перезапуску.

Усі зовнішні бінарні файли, потрібні для Skills, мають бути встановлені під час збирання образу.

Наведені нижче приклади показують лише три поширені бінарні файли:

- `gog` для доступу до Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Це приклади, а не повний список.
Ви можете встановити стільки бінарних файлів, скільки потрібно, використовуючи той самий шаблон.

Якщо пізніше ви додасте нові Skills, які залежать від додаткових бінарних файлів, потрібно:

1. Оновити Dockerfile
2. Перезібрати образ
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
Наведені вище URL для завантаження призначені для x86_64 (amd64). Для VM на базі ARM (наприклад, Hetzner ARM, GCP Tau T2A) замініть URL для завантаження на відповідні варіанти ARM64 зі сторінки релізів кожного інструмента.
</Note>

## Зберіть і запустіть

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Якщо збирання завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM бракує пам’яті.
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

## Що де зберігається

OpenClaw працює в Docker, але Docker не є джерелом істини.
Увесь довготривалий стан має переживати перезапуски, перезбирання й перезавантаження.

| Компонент           | Розташування                            | Механізм збереження        | Примітки                                                      |
| ------------------- | ---------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Конфігурація Gateway | `/home/node/.openclaw/`                  | Монтування тому хоста      | Містить `openclaw.json`, `.env`                               |
| Профілі автентифікації моделей | `/home/node/.openclaw/agents/`           | Монтування тому хоста      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, ключі API) |
| Конфігурації Skills | `/home/node/.openclaw/skills/`           | Монтування тому хоста      | Стан на рівні Skills                                          |
| Робочий простір агента | `/home/node/.openclaw/workspace/`        | Монтування тому хоста      | Код і артефакти агентів                                      |
| Сеанс WhatsApp      | `/home/node/.openclaw/`                  | Монтування тому хоста      | Зберігає вхід через QR                                       |
| Зв’язка ключів Gmail | `/home/node/.openclaw/`                  | Том хоста + пароль         | Потрібен `GOG_KEYRING_PASSWORD`                               |
| Залежності середовища виконання Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Іменований том Docker      | Згенеровані залежності вбудованих Plugin і дзеркала середовища виконання |
| Зовнішні бінарні файли | `/usr/local/bin/`                        | Образ Docker               | Потрібно вбудовувати під час збирання                         |
| Середовище виконання Node | Файлова система контейнера               | Образ Docker               | Перезбирається під час кожного збирання образу                |
| Пакети ОС           | Файлова система контейнера               | Образ Docker               | Не встановлюйте під час виконання                             |
| Контейнер Docker    | Ефемерний                               | Можна перезапустити        | Безпечно знищувати                                           |

## Оновлення

Щоб оновити OpenClaw на VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Пов’язане

- [Docker](/uk/install/docker)
- [Podman](/uk/install/podman)
- [ClawDock](/uk/install/clawdock)
