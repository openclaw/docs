---
read_when:
    - Потрібна інформація про підтримку ОС або шляхи встановлення
    - Вибір місця для запуску Gateway
summary: Огляд підтримки платформ (Gateway + супутні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-05-05T23:38:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core написано мовою TypeScript. **Node є рекомендованим середовищем виконання**.
Bun не рекомендовано для Gateway через відомі проблеми з каналами WhatsApp і
Telegram; подробиці див. у [Bun (експериментально)](/uk/install/bun).

Супутні застосунки доступні для macOS (застосунок у рядку меню) і мобільних вузлів (iOS/Android). Супутні застосунки для Windows і
Linux заплановано, але Gateway повністю підтримується вже сьогодні.
Нативні супутні застосунки для Windows також заплановано; Gateway рекомендовано запускати через WSL2.

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
- exe.dev (VM + HTTPS-проксі): [exe.dev](/uk/install/exe-dev)

## Поширені посилання

- Посібник зі встановлення: [Початок роботи](/uk/start/getting-started)
- Операційний довідник Gateway: [Gateway](/uk/gateway)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)
- Стан служби: `openclaw gateway status`

## Встановлення служби Gateway (CLI)

Використайте один із цих варіантів (усі підтримуються):

- Майстер (рекомендовано): `openclaw onboard --install-daemon`
- Напряму: `openclaw gateway install`
- Потік налаштування: `openclaw configure` → виберіть **службу Gateway**
- Відновлення/міграція: `openclaw doctor` (пропонує встановити або виправити службу)

Ціль служби залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>`; застарілий `com.openclaw.*`)
- Linux/WSL2: користувацька служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативна Windows: заплановане завдання (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`) із резервним елементом запуску під час входу з папки Startup для кожного користувача, якщо створення завдання заборонено

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Застосунок macOS](/uk/platforms/macos)
- [Застосунок iOS](/uk/platforms/ios)
