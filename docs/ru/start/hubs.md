---
read_when:
    - Вам нужна полная карта документации
summary: Центральные страницы со ссылками на всю документацию OpenClaw
title: Центры документации
x-i18n:
    generated_at: "2026-07-13T20:18:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 9b51fc77155b2e7ed6cb6e36d375585ebd457c3d89f97c4151877d1aae20717f
    source_path: start/hubs.md
    workflow: 16
---

<Note>
Если вы впервые знакомитесь с OpenClaw, начните с раздела [Начало работы](/ru/start/getting-started).
</Note>

Используйте эти разделы, чтобы найти все страницы, включая подробные руководства и справочную документацию, которые не отображаются в левой панели навигации.

## Начните здесь

- [Главная](/ru)
- [Начало работы](/ru/start/getting-started)
- [Первоначальная настройка](/ru/start/onboarding)
- [Первоначальная настройка (CLI)](/ru/start/wizard)
- [Установка и настройка](/ru/start/setup)
- [Панель управления (локальный Gateway)](http://127.0.0.1:18789/)
- [Справка](/ru/help)
- [Каталог документации](/ru/start/docs-directory)
- [Конфигурация](/ru/gateway/configuration)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
- [Ассистент OpenClaw](/ru/start/openclaw)
- [Демонстрация возможностей](/ru/start/showcase)
- [История проекта](/ru/start/lore)

## Установка и обновления

- [Docker](/ru/install/docker)
- [Nix](/ru/install/nix)
- [Обновление и откат](/ru/install/updating)
- [Рабочий процесс Bun (экспериментальный)](/ru/install/bun)

## Основные понятия

- [Архитектура](/ru/concepts/architecture)
- [Возможности](/ru/concepts/features)
- [Сетевой центр](/ru/network)
- [Среда выполнения агента](/ru/concepts/agent)
- [Рабочая область агента](/ru/concepts/agent-workspace)
- [Память](/ru/concepts/memory)
- [Цикл агента](/ru/concepts/agent-loop)
- [Потоковая передача и разбиение на фрагменты](/ru/concepts/streaming)
- [Маршрутизация между агентами](/ru/concepts/multi-agent)
- [Compaction](/ru/concepts/compaction)
- [Сеансы](/ru/concepts/session)
- [Очистка сеансов](/ru/concepts/session-pruning)
- [Инструменты сеанса](/ru/concepts/session-tool)
- [Очередь](/ru/concepts/queue)
- [Команды с косой чертой](/ru/tools/slash-commands)
- [Адаптеры RPC](/ru/reference/rpc)
- [Схемы TypeBox](/ru/concepts/typebox)
- [Работа с часовыми поясами](/ru/concepts/timezone)
- [Присутствие](/ru/concepts/presence)
- [Обнаружение и транспортные протоколы](/ru/gateway/discovery)
- [Bonjour](/ru/gateway/bonjour)
- [Маршрутизация каналов](/ru/channels/channel-routing)
- [Группы](/ru/channels/groups)
- [Групповые сообщения](/ru/channels/group-messages)
- [Переключение моделей при сбое](/ru/concepts/model-failover)
- [OAuth](/ru/concepts/oauth)

## Провайдеры и входящие подключения

- [Центр каналов чата](/ru/channels)
- [Центр провайдеров моделей](/ru/providers/models)
- [Discord](/ru/channels/discord)
- [iMessage](/ru/channels/imessage)
- [Mattermost](/ru/channels/mattermost)
- [QQ Bot](/ru/channels/qqbot)
- [Signal](/ru/channels/signal)
- [Slack](/ru/channels/slack)
- [Telegram](/ru/channels/telegram)
- [WebChat](/ru/web/webchat)
- [WhatsApp](/ru/channels/whatsapp)
- [Разбор местоположения](/ru/channels/location)
- [Вебхуки](/ru/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration)

## Gateway и эксплуатация

- [Руководство по эксплуатации Gateway](/ru/gateway)
- [Сетевая модель](/ru/network#core-model)
- [Сопряжение Gateway](/ru/gateway/pairing)
- [Блокировка Gateway](/ru/gateway/gateway-lock)
- [Фоновый процесс](/ru/gateway/background-process)
- [Состояние системы](/ru/gateway/health)
- [Heartbeat](/ru/gateway/heartbeat)
- [Диагностика](/ru/gateway/doctor)
- [Ведение журналов](/ru/gateway/logging)
- [Изоляция в песочнице](/ru/gateway/sandboxing)
- [Панель управления](/ru/web/dashboard)
- [Интерфейс управления](/ru/web/control-ui)
- [Удалённый доступ](/ru/gateway/remote)
- [README удалённого Gateway](/ru/gateway/remote-gateway-readme)
- [Tailscale](/ru/gateway/tailscale)
- [Безопасность](/ru/gateway/security)
- [Устранение неполадок](/ru/gateway/troubleshooting)

## Инструменты и автоматизация

- [Набор инструментов](/ru/tools)
- [OpenProse](/ru/prose)
- [Справочник CLI](/ru/cli)
- [Инструмент Exec](/ru/tools/exec)
- [Инструмент PDF](/ru/tools/pdf)
- [Режим повышенных привилегий](/ru/tools/elevated)
- [Задания Cron](/ru/automation/cron-jobs)
- [Автоматизация](/ru/automation)
- [Рассуждение и подробный вывод](/ru/tools/thinking)
- [Модели](/ru/concepts/models)
- [Подагенты](/ru/tools/subagents)
- [Отправка агенту через CLI](/ru/tools/agent-send)
- [Терминальный интерфейс](/ru/web/tui)
- [Управление браузером](/ru/tools/browser)
- [Браузер (устранение неполадок в Linux)](/ru/tools/browser-linux-troubleshooting)
- [Опросы](/ru/cli/message)

## Узлы, мультимедиа и голос

- [Обзор узлов](/ru/nodes)
- [Камера](/ru/nodes/camera)
- [Изображения](/ru/nodes/images)
- [Аудио](/ru/nodes/audio)
- [Команда определения местоположения](/ru/nodes/location-command)
- [Голосовая активация](/ru/nodes/voicewake)
- [Режим разговора](/ru/nodes/talk)

## Платформы

- [Обзор платформ](/ru/platforms)
- [macOS](/ru/platforms/macos)
- [iOS](/ru/platforms/ios)
- [Android](/ru/platforms/android)
- [Центр Windows](/ru/platforms/windows)
- [Linux](/ru/platforms/linux)
- [Веб-интерфейсы](/ru/web)

## Вспомогательное приложение для macOS (для опытных пользователей)

- [Настройка среды разработки для macOS](/ru/platforms/mac/dev-setup)
- [Строка меню macOS](/ru/platforms/mac/menu-bar)
- [Голосовая активация в macOS](/ru/platforms/mac/voicewake)
- [Голосовая панель в macOS](/ru/platforms/mac/voice-overlay)
- [WebChat для macOS](/ru/platforms/mac/webchat)
- [Холст macOS](/ru/platforms/mac/canvas)
- [Дочерний процесс macOS](/ru/platforms/mac/child-process)
- [Состояние системы macOS](/ru/platforms/mac/health)
- [Значок macOS](/ru/platforms/mac/icon)
- [Ведение журналов в macOS](/ru/platforms/mac/logging)
- [Разрешения macOS](/ru/platforms/mac/permissions)
- [Удалённый доступ в macOS](/ru/platforms/mac/remote)
- [Подписание приложения для macOS](/ru/platforms/mac/signing)
- [Gateway для macOS (launchd)](/ru/platforms/mac/bundled-gateway)
- [XPC в macOS](/ru/platforms/mac/xpc)
- [Skills для macOS](/ru/platforms/mac/skills)
- [Peekaboo для macOS](/ru/platforms/mac/peekaboo)

## Плагины

- [Обзор плагинов](/ru/tools/plugin)
- [Создание плагинов](/ru/plugins/building-plugins)
- [Хуки плагинов](/ru/plugins/hooks)
- [Манифест плагина](/ru/plugins/manifest)
- [Инструменты агента](/ru/plugins/building-plugins#registering-agent-tools)
- [Пакеты плагинов](/ru/plugins/bundles)
- [ClawHub](/ru/clawhub)
- [Сборник рецептов для возможностей](/ru/plugins/adding-capabilities)
- [Плагин голосовых вызовов](/ru/plugins/voice-call)
- [Пользовательский плагин Zalo](/ru/plugins/zalouser)

## Рабочая область и шаблоны

- [Skills](/ru/tools/skills)
- [ClawHub](/ru/clawhub)
- [Конфигурация Skills](/ru/tools/skills-config)
- [AGENTS по умолчанию](/ru/reference/AGENTS.default)
- [Шаблоны: AGENTS](/ru/reference/templates/AGENTS)
- [Шаблоны: BOOTSTRAP](/ru/reference/templates/BOOTSTRAP)
- [Шаблоны: HEARTBEAT](/ru/reference/templates/HEARTBEAT)
- [Шаблоны: IDENTITY](/ru/reference/templates/IDENTITY)
- [Шаблоны: SOUL](/ru/reference/templates/SOUL)
- [Шаблоны: TOOLS](/ru/reference/templates/TOOLS)
- [Шаблоны: USER](/ru/reference/templates/USER)

## Проект

- [Участники проекта](/ru/reference/credits)

## Тестирование и выпуск

- [Тестирование](/ru/reference/test)
- [Политика выпуска](/ru/reference/RELEASING)
- [Модели устройств](/ru/reference/device-models)

## Связанные материалы

- [Начало работы](/ru/start/getting-started)
