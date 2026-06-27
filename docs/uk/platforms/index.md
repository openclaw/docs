---
read_when:
    - Шукаєте підтримку ОС або шляхи встановлення
    - Вибір місця запуску Gateway
summary: Огляд підтримки платформ (Gateway + супровідні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-06-27T17:46:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core написано TypeScript. **Node є рекомендованим середовищем виконання**.
Bun не рекомендовано для Gateway — відомі проблеми з каналами WhatsApp і
Telegram; докладніше див. [Bun (експериментально)](/uk/install/bun).

Супровідні застосунки доступні для Windows Hub, macOS (застосунок у рядку меню) і мобільних вузлів
(iOS/Android). Супровідні застосунки для Linux заплановано, але Gateway уже повністю
підтримується. У Windows виберіть Windows Hub для настільного застосунку, нативне
встановлення PowerShell для роботи насамперед із термінала або WSL2 для найбільш
сумісного з Linux середовища виконання Gateway.

## Виберіть свою ОС

- macOS: [macOS](/uk/platforms/macos)
- iOS: [iOS](/uk/platforms/ios)
- Android: [Android](/uk/platforms/android)
- Windows: [Windows](/uk/platforms/windows)
- Linux: [Linux](/uk/platforms/linux)

## VPS і хостинг

- VPS-хаб: [VPS-хостинг](/uk/vps)
- Fly.io: [Fly.io](/uk/install/fly)
- Hetzner (Docker): [Hetzner](/uk/install/hetzner)
- GCP (Compute Engine): [GCP](/uk/install/gcp)
- Azure (Linux VM): [Azure](/uk/install/azure)
- exe.dev (VM + HTTPS-проксі): [exe.dev](/uk/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/uk/platforms/easyrunner)

## Поширені посилання

- Посібник зі встановлення: [Початок роботи](/uk/start/getting-started)
- Windows Hub: [Windows](/uk/platforms/windows)
- Операційний посібник Gateway: [Gateway](/uk/gateway)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)
- Стан служби: `openclaw gateway status`

## Встановлення служби Gateway (CLI)

Використайте один із цих варіантів (усі підтримуються):

- Майстер (рекомендовано): `openclaw onboard --install-daemon`
- Напряму: `openclaw gateway install`
- Потік конфігурації: `openclaw configure` → виберіть **служба Gateway**
- Виправлення/міграція: `openclaw doctor` (пропонує встановити або виправити службу)

Ціль служби залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>`; застаріле `com.openclaw.*`)
- Linux/WSL2: користувацька служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативна Windows: заплановане завдання (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`), із резервним елементом входу в папці автозавантаження для кожного користувача, якщо створення завдання заборонено

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Windows Hub](/uk/platforms/windows)
- [застосунок macOS](/uk/platforms/macos)
- [застосунок iOS](/uk/platforms/ios)
