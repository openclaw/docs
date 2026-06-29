---
read_when:
    - Поиск поддержки ОС или путей установки
    - Выбор места запуска Gateway
summary: Обзор поддержки платформ (Gateway + приложения-компаньоны)
title: Платформы
x-i18n:
    generated_at: "2026-06-28T23:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

Ядро OpenClaw написано на TypeScript. **Node — рекомендуемая среда выполнения**.
Bun не рекомендуется для Gateway из-за известных проблем с каналами WhatsApp и
Telegram; подробности см. в [Bun (экспериментально)](/ru/install/bun).

Сопутствующие приложения существуют для Windows Hub, macOS (приложение в строке меню) и мобильных узлов
(iOS/Android). Сопутствующие приложения для Linux планируются, но Gateway уже полностью
поддерживается. В Windows выберите Windows Hub для настольного приложения, нативную
установку через PowerShell для работы в первую очередь из терминала или WSL2 для наиболее
совместимой с Linux среды выполнения Gateway.

## Выберите свою ОС

- macOS: [macOS](/ru/platforms/macos)
- iOS: [iOS](/ru/platforms/ios)
- Android: [Android](/ru/platforms/android)
- Windows: [Windows](/ru/platforms/windows)
- Linux: [Linux](/ru/platforms/linux)

## VPS и хостинг

- VPS-хаб: [VPS-хостинг](/ru/vps)
- Fly.io: [Fly.io](/ru/install/fly)
- Hetzner (Docker): [Hetzner](/ru/install/hetzner)
- GCP (Compute Engine): [GCP](/ru/install/gcp)
- Azure (Linux VM): [Azure](/ru/install/azure)
- exe.dev (VM + HTTPS-прокси): [exe.dev](/ru/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/ru/platforms/easyrunner)

## Общие ссылки

- Руководство по установке: [Начало работы](/ru/start/getting-started)
- Windows Hub: [Windows](/ru/platforms/windows)
- Руководство по эксплуатации Gateway: [Gateway](/ru/gateway)
- Конфигурация Gateway: [Конфигурация](/ru/gateway/configuration)
- Статус службы: `openclaw gateway status`

## Установка службы Gateway (CLI)

Используйте один из этих вариантов (все поддерживаются):

- Мастер (рекомендуется): `openclaw onboard --install-daemon`
- Напрямую: `openclaw gateway install`
- Процесс настройки: `openclaw configure` → выберите **Служба Gateway**
- Восстановление/миграция: `openclaw doctor` (предлагает установить или исправить службу)

Цель службы зависит от ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` или `ai.openclaw.<profile>`; устаревшее `com.openclaw.*`)
- Linux/WSL2: пользовательская служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативная Windows: запланированная задача (`OpenClaw Gateway` или `OpenClaw Gateway (<profile>)`) с резервным элементом входа в папке Startup для текущего пользователя, если создание задачи запрещено

## Связанные материалы

- [Обзор установки](/ru/install)
- [Windows Hub](/ru/platforms/windows)
- [Приложение для macOS](/ru/platforms/macos)
- [Приложение для iOS](/ru/platforms/ios)
