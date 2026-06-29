---
read_when:
    - Вам нужна полная карта документации
summary: Центры, которые ссылаются на всю документацию OpenClaw
title: Центры документации
x-i18n:
    generated_at: "2026-06-28T23:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7d3f089e2caea1e1487c7c0375c62dfb007db05827a77d4e5616839023b9457
    source_path: start/hubs.md
    workflow: 16
---

<Note>
Если вы впервые знакомитесь с OpenClaw, начните с [Начало работы](/ru/start/getting-started).
</Note>

Используйте эти хабы, чтобы найти все страницы, включая подробные разборы и справочную документацию, которые не отображаются в левой навигации.

## Начните здесь

- [Индекс](/ru)
- [Начало работы](/ru/start/getting-started)
- [Онбординг](/ru/start/onboarding)
- [Онбординг (CLI)](/ru/start/wizard)
- [Настройка](/ru/start/setup)
- [Панель управления (локальный Gateway)](http://127.0.0.1:18789/)
- [Помощь](/ru/help)
- [Каталог документации](/ru/start/docs-directory)
- [Конфигурация](/ru/gateway/configuration)
- [Примеры конфигурации](/ru/gateway/configuration-examples)
- [Ассистент OpenClaw](/ru/start/openclaw)
- [Витрина](/ru/start/showcase)
- [Лор](/ru/start/lore)

## Установка и обновления

- [Docker](/ru/install/docker)
- [Nix](/ru/install/nix)
- [Обновление / откат](/ru/install/updating)
- [Рабочий процесс Bun (экспериментально)](/ru/install/bun)

## Основные концепции

- [Архитектура](/ru/concepts/architecture)
- [Функции](/ru/concepts/features)
- [Сетевой хаб](/ru/network)
- [Среда выполнения агента](/ru/concepts/agent)
- [Рабочая область агента](/ru/concepts/agent-workspace)
- [Память](/ru/concepts/memory)
- [Цикл агента](/ru/concepts/agent-loop)
- [Потоковая передача и разбиение на фрагменты](/ru/concepts/streaming)
- [Маршрутизация нескольких агентов](/ru/concepts/multi-agent)
- [Compaction](/ru/concepts/compaction)
- [Сессии](/ru/concepts/session)
- [Очистка сессий](/ru/concepts/session-pruning)
- [Инструменты сессий](/ru/concepts/session-tool)
- [Очередь](/ru/concepts/queue)
- [Слэш-команды](/ru/tools/slash-commands)
- [Адаптеры RPC](/ru/reference/rpc)
- [Схемы TypeBox](/ru/concepts/typebox)
- [Обработка часовых поясов](/ru/concepts/timezone)
- [Присутствие](/ru/concepts/presence)
- [Обнаружение и транспорты](/ru/gateway/discovery)
- [Bonjour](/ru/gateway/bonjour)
- [Маршрутизация каналов](/ru/channels/channel-routing)
- [Группы](/ru/channels/groups)
- [Групповые сообщения](/ru/channels/group-messages)
- [Переключение моделей при сбое](/ru/concepts/model-failover)
- [OAuth](/ru/concepts/oauth)

## Провайдеры и входящий трафик

- [Хаб чат-каналов](/ru/channels)
- [Хаб провайдеров моделей](/ru/providers/models)
- [WhatsApp](/ru/channels/whatsapp)
- [Telegram](/ru/channels/telegram)
- [Slack](/ru/channels/slack)
- [Discord](/ru/channels/discord)
- [Mattermost](/ru/channels/mattermost)
- [Signal](/ru/channels/signal)
- [QQ Bot](/ru/channels/qqbot)
- [iMessage](/ru/channels/imessage)
- [Разбор местоположения](/ru/channels/location)
- [WebChat](/ru/web/webchat)
- [Webhooks](/ru/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/ru/automation/cron-jobs#gmail-pubsub-integration)

## Gateway и эксплуатация

- [Инструкции по эксплуатации Gateway](/ru/gateway)
- [Сетевая модель](/ru/network#core-model)
- [Сопряжение Gateway](/ru/gateway/pairing)
- [Блокировка Gateway](/ru/gateway/gateway-lock)
- [Фоновый процесс](/ru/gateway/background-process)
- [Состояние](/ru/gateway/health)
- [Heartbeat](/ru/gateway/heartbeat)
- [Doctor](/ru/gateway/doctor)
- [Журналирование](/ru/gateway/logging)
- [Песочница](/ru/gateway/sandboxing)
- [Панель управления](/ru/web/dashboard)
- [Интерфейс управления](/ru/web/control-ui)
- [Удаленный доступ](/ru/gateway/remote)
- [README удаленного Gateway](/ru/gateway/remote-gateway-readme)
- [Tailscale](/ru/gateway/tailscale)
- [Безопасность](/ru/gateway/security)
- [Устранение неполадок](/ru/gateway/troubleshooting)

## Инструменты и автоматизация

- [Поверхность инструментов](/ru/tools)
- [OpenProse](/ru/prose)
- [Справочник CLI](/ru/cli)
- [Инструмент Exec](/ru/tools/exec)
- [Инструмент PDF](/ru/tools/pdf)
- [Режим повышенных прав](/ru/tools/elevated)
- [Задания Cron](/ru/automation/cron-jobs)
- [Автоматизация](/ru/automation)
- [Мышление и подробный вывод](/ru/tools/thinking)
- [Модели](/ru/concepts/models)
- [Субагенты](/ru/tools/subagents)
- [CLI отправки агенту](/ru/tools/agent-send)
- [Терминальный интерфейс](/ru/web/tui)
- [Управление браузером](/ru/tools/browser)
- [Браузер (устранение неполадок в Linux)](/ru/tools/browser-linux-troubleshooting)
- [Опросы](/ru/cli/message)

## Узлы, медиа, голос

- [Обзор узлов](/ru/nodes)
- [Камера](/ru/nodes/camera)
- [Изображения](/ru/nodes/images)
- [Аудио](/ru/nodes/audio)
- [Команда местоположения](/ru/nodes/location-command)
- [Голосовое пробуждение](/ru/nodes/voicewake)
- [Режим разговора](/ru/nodes/talk)

## Платформы

- [Обзор платформ](/ru/platforms)
- [macOS](/ru/platforms/macos)
- [iOS](/ru/platforms/ios)
- [Android](/ru/platforms/android)
- [Хаб Windows](/ru/platforms/windows)
- [Linux](/ru/platforms/linux)
- [Веб-поверхности](/ru/web)

## Сопутствующее приложение macOS (расширенно)

- [Настройка среды разработки macOS](/ru/platforms/mac/dev-setup)
- [Строка меню macOS](/ru/platforms/mac/menu-bar)
- [Голосовое пробуждение macOS](/ru/platforms/mac/voicewake)
- [Голосовое наложение macOS](/ru/platforms/mac/voice-overlay)
- [macOS WebChat](/ru/platforms/mac/webchat)
- [macOS Canvas](/ru/platforms/mac/canvas)
- [Дочерний процесс macOS](/ru/platforms/mac/child-process)
- [Состояние macOS](/ru/platforms/mac/health)
- [Значок macOS](/ru/platforms/mac/icon)
- [Журналирование macOS](/ru/platforms/mac/logging)
- [Разрешения macOS](/ru/platforms/mac/permissions)
- [Удаленный доступ macOS](/ru/platforms/mac/remote)
- [Подписание macOS](/ru/platforms/mac/signing)
- [Gateway macOS (launchd)](/ru/platforms/mac/bundled-gateway)
- [macOS XPC](/ru/platforms/mac/xpc)
- [Skills macOS](/ru/platforms/mac/skills)
- [macOS Peekaboo](/ru/platforms/mac/peekaboo)

## Plugins

- [Обзор Plugins](/ru/tools/plugin)
- [Создание Plugins](/ru/plugins/building-plugins)
- [Хуки Plugin](/ru/plugins/hooks)
- [Манифест Plugin](/ru/plugins/manifest)
- [Инструменты агента](/ru/plugins/building-plugins#registering-agent-tools)
- [Пакеты Plugin](/ru/plugins/bundles)
- [ClawHub](/ru/clawhub)
- [Рецепты возможностей](/ru/plugins/adding-capabilities)
- [Plugin голосовых вызовов](/ru/plugins/voice-call)
- [Пользовательский Plugin Zalo](/ru/plugins/zalouser)

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

- [Благодарности](/ru/reference/credits)

## Тестирование и выпуск

- [Тестирование](/ru/reference/test)
- [Политика выпусков](/ru/reference/RELEASING)
- [Модели устройств](/ru/reference/device-models)

## Связанное

- [Начало работы](/ru/start/getting-started)
