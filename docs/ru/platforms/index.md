---
read_when:
    - Ищете сведения о поддержке ОС или способах установки
    - Выбор места для запуска Gateway
summary: Обзор поддержки платформ (Gateway и приложения-компаньоны)
title: Платформы
x-i18n:
    generated_at: "2026-07-13T19:57:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Основной код OpenClaw написан на TypeScript. **Node — обязательная среда выполнения**, поскольку
каноническое хранилище состояния использует `node:sqlite`. Bun по-прежнему доступен для
установки зависимостей и запуска скриптов пакетов; см. [Bun](/ru/install/bun).

Существуют приложения-компаньоны для Windows Hub, macOS (приложение в строке меню) и мобильных узлов
(iOS/Android). Приложения-компаньоны для Linux запланированы, однако Gateway уже
полностью поддерживается. В Windows выберите Windows Hub в качестве настольного приложения, нативную
установку через PowerShell для работы преимущественно в терминале или WSL2 для среды выполнения Gateway,
наиболее совместимой с Linux.

## Выберите ОС

- macOS: [macOS](/ru/platforms/macos)
- iOS: [iOS](/ru/platforms/ios)
- Android: [Android](/ru/platforms/android)
- Windows: [Windows](/ru/platforms/windows)
- Linux: [Linux](/ru/platforms/linux)

## VPS и хостинг

- Центральный узел VPS: [Хостинг на VPS](/ru/vps)
- Fly.io: [Fly.io](/ru/install/fly)
- Hetzner (Docker): [Hetzner](/ru/install/hetzner)
- GCP (Compute Engine): [GCP](/ru/install/gcp)
- Azure (виртуальная машина Linux): [Azure](/ru/install/azure)
- exe.dev (виртуальная машина + HTTPS-прокси): [exe.dev](/ru/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/ru/platforms/easyrunner)

## Основные ссылки

- Руководство по установке: [Начало работы](/ru/start/getting-started)
- Windows Hub: [Windows](/ru/platforms/windows)
- Инструкция по эксплуатации Gateway: [Gateway](/ru/gateway)
- Конфигурация Gateway: [Конфигурация](/ru/gateway/configuration)
- Состояние службы: `openclaw gateway status`

## Установка службы Gateway (CLI)

Используйте один из следующих вариантов (поддерживаются все):

- Мастер (рекомендуется): `openclaw onboard --install-daemon`
- Напрямую: `openclaw gateway install`
- Процесс настройки: `openclaw configure` → выберите **Служба Gateway**
- Исправление/миграция: `openclaw doctor` (предлагает установить или исправить службу)

Целевая служба зависит от ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` или `ai.openclaw.<profile>` для именованного профиля)
- Linux/WSL2: пользовательская служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативная Windows: запланированная задача (`OpenClaw Gateway` или `OpenClaw Gateway (<profile>)`), с резервным вариантом в виде элемента входа в пользовательской папке автозагрузки, если создание задачи запрещено

## Связанные материалы

- [Обзор установки](/ru/install)
- [Windows Hub](/ru/platforms/windows)
- [Приложение для macOS](/ru/platforms/macos)
- [Приложение для iOS](/ru/platforms/ios)
