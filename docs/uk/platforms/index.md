---
read_when:
    - Пошук підтримки ОС або шляхів установлення
    - Вибір місця для запуску Gateway
summary: Огляд підтримки платформ (Gateway + супутні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-07-16T18:10:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Ядро OpenClaw написано мовою TypeScript. **Node є обов’язковим середовищем виконання**, оскільки
канонічне сховище стану використовує `node:sqlite`. Bun залишається доступним для
встановлення залежностей і виконання скриптів пакунків; див. [Bun](/uk/install/bun).

Супутні застосунки доступні для Windows Hub, macOS (застосунок у рядку меню) і мобільних вузлів
(iOS/Android). Супутні застосунки для Linux заплановано, але Gateway уже
повністю підтримується. У Windows виберіть Windows Hub як настільний застосунок, нативне
встановлення через PowerShell для роботи переважно в терміналі або WSL2 для середовища виконання
Gateway із найкращою сумісністю з Linux.

## Виберіть свою ОС

- macOS: [macOS](/uk/platforms/macos)
- iOS: [iOS](/uk/platforms/ios)
- Android: [Android](/uk/platforms/android)
- Windows: [Windows](/uk/platforms/windows)
- Linux: [Linux](/uk/platforms/linux)

## VPS і хостинг

- VPS-вузол: [Хостинг на VPS](/uk/vps)
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
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)
- Стан служби: `openclaw gateway status`

## Встановлення служби Gateway (CLI)

Скористайтеся одним із цих способів (усі підтримуються):

- Майстер (рекомендовано): `openclaw onboard --install-daemon`
- Безпосередньо: `openclaw gateway install`
- Процес конфігурації: `openclaw configure` → виберіть **службу Gateway**
- Відновлення/міграція: `openclaw doctor` (пропонує встановити або виправити службу)

Цільова служба залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>` для іменованого профілю)
- Linux/WSL2: користувацька служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативна Windows: заплановане завдання (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`) із резервним варіантом у вигляді елемента входу до системи в користувацькій папці автозавантаження, якщо створення завдання заборонено

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Windows Hub](/uk/platforms/windows)
- [Застосунок для macOS](/uk/platforms/macos)
- [Застосунок для iOS](/uk/platforms/ios)
