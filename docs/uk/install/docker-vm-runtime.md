---
read_when:
    - Ви розгортаєте OpenClaw на хмарній віртуальній машині за допомогою Docker
    - Вам потрібен спільний процес створення бінарного образу, збереження стану й оновлення
summary: Кроки налаштування спільного середовища виконання віртуальної машини Docker для довготривалої роботи хостів OpenClaw Gateway
title: Середовище виконання віртуальної машини Docker
x-i18n:
    generated_at: "2026-07-12T13:17:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Спільні кроки налаштування середовища виконання для встановлень Docker на основі віртуальних машин, як-от GCP, Hetzner та подібні постачальники VPS.

## Вбудуйте необхідні виконувані файли в образ

Установлення виконуваних файлів у запущеному контейнері — хибний підхід: усе встановлене
під час виконання втрачається після перезапуску. Вбудовуйте кожен зовнішній виконуваний файл, потрібний Skills,
в образ під час його збирання.

Наведені нижче приклади охоплюють лише три виконувані файли в алфавітному порядку:

- `gog` (з `gogcli`) для доступу до Gmail
- `goplaces` для Google Places
- `wacli` для WhatsApp

Це лише приклади, а не повний список. Установлюйте за цим самим шаблоном стільки виконуваних файлів, скільки
потрібно вашим Skills. Коли згодом ви додасте Skills, якому потрібен новий
виконуваний файл:

1. Оновіть Dockerfile.
2. Повторно зберіть образ.
3. Перезапустіть контейнери.

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
Наведені вище URL є прикладами. Для віртуальних машин на основі ARM вибирайте ресурси `arm64`. Для відтворюваних збірок закріплюйте URL випусків із зазначенням версії.
</Note>

## Збирання та запуск

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Якщо під час `pnpm install --frozen-lockfile` збірка завершується помилкою `Killed` або кодом виходу 137, віртуальній машині бракує пам’яті. Перш ніж повторити спробу, виберіть потужніший клас машини.

Перевірте виконувані файли:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Очікуваний результат:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Переконайтеся, що Gateway працює:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Відповідь 200 від `/healthz` підтверджує, що процес Gateway прослуховує запити й працює належним чином; вбудована в образ перевірка `HEALTHCHECK` опитує ту саму кінцеву точку.

## Що й де зберігається

OpenClaw працює в Docker, але Docker не є джерелом істини. Усі довготривалі дані стану мають зберігатися після перезапусків, повторних збирань і перезавантажень системи.

| Компонент              | Розташування                                           | Механізм збереження    | Примітки                                                                                                            |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Конфігурація Gateway   | `/home/node/.openclaw/`                                | Монтування тому хоста  | Містить `openclaw.json`                                                                                             |
| Облікові дані каналів і постачальників | `/home/node/.openclaw/credentials/`                    | Монтування тому хоста  | Матеріали облікових даних каналів і постачальників                                                                  |
| Профілі автентифікації моделей | `/home/node/.openclaw/agents/`                         | Монтування тому хоста  | `agents/<agentId>/agent/auth-profiles.json` (OAuth, ключі API)                                                       |
| Застарілий файл ключів OAuth | `/home/node/.config/openclaw/`                         | Монтування тому хоста  | Сумісність лише для читання із супровідними файлами OAuth до міграції; `openclaw doctor --fix` переносить їх до `auth-profiles.json` |
| Конфігурації Skills    | `/home/node/.openclaw/skills/`                         | Монтування тому хоста  | Стан на рівні Skills                                                                                                |
| Робочий простір агента | `/home/node/.openclaw/workspace/`                      | Монтування тому хоста  | Код і артефакти агента                                                                                              |
| Сеанс WhatsApp         | `/home/node/.openclaw/`                                | Монтування тому хоста  | Зберігає вхід за QR-кодом                                                                                           |
| Сховище ключів Gmail   | `/home/node/.openclaw/`                                | Том хоста + пароль     | Потребує `GOG_KEYRING_PASSWORD`                                                                                     |
| Пакети Plugin          | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Монтування тому хоста  | Кореневі каталоги завантажуваних пакетів Plugin                                                                     |
| Зовнішні виконувані файли | `/usr/local/bin/`                                      | Образ Docker           | Мають бути вбудовані під час збирання                                                                                |
| Середовище виконання Node | Файлова система контейнера                             | Образ Docker           | Перебудовується під час кожного збирання образу                                                                      |
| Пакети ОС              | Файлова система контейнера                             | Образ Docker           | Не встановлюйте під час виконання                                                                                    |
| Контейнер Docker       | Тимчасовий                                             | Перезапускний          | Можна безпечно видаляти                                                                                              |

## Оновлення

Щоб оновити OpenClaw на віртуальній машині:

```bash
git pull
docker compose build
docker compose up -d
```

## Пов’язані матеріали

- [Docker](/uk/install/docker)
- [Podman](/uk/install/podman)
- [ClawDock](/uk/install/clawdock)
