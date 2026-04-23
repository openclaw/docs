---
read_when:
    - Пошук підтримки ОС або шляхів встановлення
    - Вибір, де запускати Gateway
summary: Огляд підтримки платформ (Gateway + застосунки-компаньйони)
title: Платформи
x-i18n:
    generated_at: "2026-04-23T21:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2c86d30147e18bcce6205cd07e38d0f41034efd2d04d4290878b24d4d481b53
    source_path: platforms/index.md
    workflow: 15
---

Ядро OpenClaw написане на TypeScript. **Node — рекомендований runtime**.
Bun не рекомендується для Gateway (помилки з WhatsApp/Telegram).

Існують застосунки-компаньйони для macOS (застосунок у menu bar) і мобільних вузлів (iOS/Android). Застосунки-компаньйони для Windows і
Linux заплановані, але Gateway уже повністю підтримується.
Нативні застосунки-компаньйони для Windows також заплановані; для Gateway рекомендовано WSL2.

## Виберіть свою ОС

- macOS: [macOS](/uk/platforms/macos)
- iOS: [iOS](/uk/platforms/ios)
- Android: [Android](/uk/platforms/android)
- Windows: [Windows](/uk/platforms/windows)
- Linux: [Linux](/uk/platforms/linux)

## VPS і хостинг

- Хаб VPS: [Хостинг VPS](/uk/vps)
- Fly.io: [Fly.io](/uk/install/fly)
- Hetzner (Docker): [Hetzner](/uk/install/hetzner)
- GCP (Compute Engine): [GCP](/uk/install/gcp)
- Azure (Linux VM): [Azure](/uk/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/uk/install/exe-dev)

## Поширені посилання

- Посібник зі встановлення: [Початок роботи](/uk/start/getting-started)
- Runbook Gateway: [Gateway](/uk/gateway)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)
- Стан сервісу: `openclaw gateway status`

## Встановлення сервісу Gateway (CLI)

Використовуйте один із цих варіантів (усі підтримуються):

- Wizard (рекомендовано): `openclaw onboard --install-daemon`
- Напряму: `openclaw gateway install`
- Потік configure: `openclaw configure` → виберіть **Gateway service**
- Відновлення/міграція: `openclaw doctor` (запропонує встановити або виправити сервіс)

Ціль сервісу залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>`; застаріле `com.openclaw.*`)
- Linux/WSL2: user service systemd (`openclaw-gateway[-<profile>].service`)
- Нативний Windows: Scheduled Task (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`), із запасним per-user login item у папці Startup, якщо створення завдання заборонене
