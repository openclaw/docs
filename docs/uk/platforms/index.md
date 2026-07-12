---
read_when:
    - Пошук підтримки ОС або шляхів установлення
    - Вибір місця для запуску Gateway
summary: Огляд підтримки платформ (Gateway + супутні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-07-12T13:28:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Ядро OpenClaw написано мовою TypeScript. **Node — рекомендоване середовище виконання**.
Bun не рекомендовано для Gateway через відомі проблеми з каналами WhatsApp і
Telegram; докладніше див. у розділі [Bun (експериментально)](/uk/install/bun).

Допоміжні застосунки доступні для Windows Hub, macOS (застосунок у смузі меню) та мобільних вузлів
(iOS/Android). Допоміжні застосунки для Linux заплановано, але Gateway уже
повністю підтримується. У Windows виберіть Windows Hub як настільний застосунок, нативне
встановлення через PowerShell для роботи переважно з терміналом або WSL2 для середовища виконання Gateway,
найбільш сумісного з Linux.

## Виберіть свою ОС

- macOS: [macOS](/uk/platforms/macos)
- iOS: [iOS](/uk/platforms/ios)
- Android: [Android](/uk/platforms/android)
- Windows: [Windows](/uk/platforms/windows)
- Linux: [Linux](/uk/platforms/linux)

## VPS і хостинг

- Вузол VPS: [Хостинг на VPS](/uk/vps)
- Fly.io: [Fly.io](/uk/install/fly)
- Hetzner (Docker): [Hetzner](/uk/install/hetzner)
- GCP (Compute Engine): [GCP](/uk/install/gcp)
- Azure (віртуальна машина Linux): [Azure](/uk/install/azure)
- exe.dev (віртуальна машина + проксі HTTPS): [exe.dev](/uk/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/uk/platforms/easyrunner)

## Поширені посилання

- Посібник зі встановлення: [Початок роботи](/uk/start/getting-started)
- Windows Hub: [Windows](/uk/platforms/windows)
- Інструкція з експлуатації Gateway: [Gateway](/uk/gateway)
- Налаштування Gateway: [Налаштування](/uk/gateway/configuration)
- Стан служби: `openclaw gateway status`

## Встановлення служби Gateway (CLI)

Скористайтеся одним із наведених способів (підтримуються всі):

- Майстер (рекомендовано): `openclaw onboard --install-daemon`
- Безпосередньо: `openclaw gateway install`
- Процес налаштування: `openclaw configure` → виберіть **Служба Gateway**
- Відновлення/міграція: `openclaw doctor` (пропонує встановити або виправити службу)

Цільова служба залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>` для іменованого профілю)
- Linux/WSL2: користувацька служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативна Windows: заплановане завдання (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`) із резервним варіантом у вигляді елемента входу до системи в користувацькій папці автозавантаження, якщо створення завдання заборонено

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Windows Hub](/uk/platforms/windows)
- [Застосунок для macOS](/uk/platforms/macos)
- [Застосунок для iOS](/uk/platforms/ios)
