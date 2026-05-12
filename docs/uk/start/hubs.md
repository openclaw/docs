---
read_when:
    - Вам потрібна повна карта документації
summary: Хаби, що посилаються на кожен документ OpenClaw
title: Хаби документації
x-i18n:
    generated_at: "2026-05-12T00:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4675773105bbff55e1f38c8449d688dcefc6ad70d9f5e572193f1e0c638e243
    source_path: start/hubs.md
    workflow: 16
---

<Note>
Якщо ви новачок в OpenClaw, почніть із [Початку роботи](/uk/start/getting-started).
</Note>

Використовуйте ці хаби, щоб знайти кожну сторінку, включно з поглибленими матеріалами та довідковою документацією, яких немає в лівій навігації.

## Почніть тут

- [Індекс](/uk)
- [Початок роботи](/uk/start/getting-started)
- [Онбординг](/uk/start/onboarding)
- [Онбординг (CLI)](/uk/start/wizard)
- [Налаштування](/uk/start/setup)
- [Панель керування (локальний Gateway)](http://127.0.0.1:18789/)
- [Довідка](/uk/help)
- [Каталог документації](/uk/start/docs-directory)
- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Асистент OpenClaw](/uk/start/openclaw)
- [Вітрина](/uk/start/showcase)
- [Лор](/uk/start/lore)

## Встановлення + оновлення

- [Docker](/uk/install/docker)
- [Nix](/uk/install/nix)
- [Оновлення / відкат](/uk/install/updating)
- [Робочий процес Bun (експериментально)](/uk/install/bun)

## Основні концепції

- [Архітектура](/uk/concepts/architecture)
- [Функції](/uk/concepts/features)
- [Мережевий хаб](/uk/network)
- [Середовище виконання агента](/uk/concepts/agent)
- [Робоча область агента](/uk/concepts/agent-workspace)
- [Памʼять](/uk/concepts/memory)
- [Цикл агента](/uk/concepts/agent-loop)
- [Потокове передавання + розбиття на фрагменти](/uk/concepts/streaming)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Compaction](/uk/concepts/compaction)
- [Сесії](/uk/concepts/session)
- [Обрізання сесій](/uk/concepts/session-pruning)
- [Інструменти сесії](/uk/concepts/session-tool)
- [Черга](/uk/concepts/queue)
- [Команди зі скісною рискою](/uk/tools/slash-commands)
- [Адаптери RPC](/uk/reference/rpc)
- [Схеми TypeBox](/uk/concepts/typebox)
- [Обробка часових поясів](/uk/concepts/timezone)
- [Присутність](/uk/concepts/presence)
- [Виявлення + транспорти](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групи](/uk/channels/groups)
- [Групові повідомлення](/uk/channels/group-messages)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
- [OAuth](/uk/concepts/oauth)

## Провайдери + вхідний трафік

- [Хаб чат-каналів](/uk/channels)
- [Хаб провайдерів моделей](/uk/providers/models)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Slack](/uk/channels/slack)
- [Discord](/uk/channels/discord)
- [Mattermost](/uk/channels/mattermost)
- [Signal](/uk/channels/signal)
- [QQ Bot](/uk/channels/qqbot)
- [iMessage](/uk/channels/imessage)
- [Розбір місцезнаходження](/uk/channels/location)
- [WebChat](/uk/web/webchat)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + операції

- [Операційний посібник Gateway](/uk/gateway)
- [Мережева модель](/uk/network#core-model)
- [Сполучення Gateway](/uk/gateway/pairing)
- [Блокування Gateway](/uk/gateway/gateway-lock)
- [Фоновий процес](/uk/gateway/background-process)
- [Стан](/uk/gateway/health)
- [Heartbeat](/uk/gateway/heartbeat)
- [Doctor](/uk/gateway/doctor)
- [Журналювання](/uk/gateway/logging)
- [Ізоляція в пісочниці](/uk/gateway/sandboxing)
- [Панель керування](/uk/web/dashboard)
- [Інтерфейс керування](/uk/web/control-ui)
- [Віддалений доступ](/uk/gateway/remote)
- [README віддаленого Gateway](/uk/gateway/remote-gateway-readme)
- [Tailscale](/uk/gateway/tailscale)
- [Безпека](/uk/gateway/security)
- [Усунення несправностей](/uk/gateway/troubleshooting)

## Інструменти + автоматизація

- [Поверхня інструментів](/uk/tools)
- [OpenProse](/uk/prose)
- [Довідник CLI](/uk/cli)
- [Інструмент Exec](/uk/tools/exec)
- [Інструмент PDF](/uk/tools/pdf)
- [Підвищений режим](/uk/tools/elevated)
- [Завдання Cron](/uk/automation/cron-jobs)
- [Автоматизація](/uk/automation)
- [Мислення + докладний режим](/uk/tools/thinking)
- [Моделі](/uk/concepts/models)
- [Субагенти](/uk/tools/subagents)
- [CLI надсилання агенту](/uk/tools/agent-send)
- [Термінальний інтерфейс](/uk/web/tui)
- [Керування браузером](/uk/tools/browser)
- [Браузер (усунення несправностей у Linux)](/uk/tools/browser-linux-troubleshooting)
- [Опитування](/uk/cli/message)

## Вузли, медіа, голос

- [Огляд вузлів](/uk/nodes)
- [Камера](/uk/nodes/camera)
- [Зображення](/uk/nodes/images)
- [Аудіо](/uk/nodes/audio)
- [Команда місцезнаходження](/uk/nodes/location-command)
- [Голосове пробудження](/uk/nodes/voicewake)
- [Режим розмови](/uk/nodes/talk)

## Платформи

- [Огляд платформ](/uk/platforms)
- [macOS](/uk/platforms/macos)
- [iOS](/uk/platforms/ios)
- [Android](/uk/platforms/android)
- [Windows (WSL2)](/uk/platforms/windows)
- [Linux](/uk/platforms/linux)
- [Вебповерхні](/uk/web)

## Супутній застосунок macOS (розширено)

- [Налаштування розробки macOS](/uk/platforms/mac/dev-setup)
- [Панель меню macOS](/uk/platforms/mac/menu-bar)
- [Голосове пробудження macOS](/uk/platforms/mac/voicewake)
- [Голосове накладання macOS](/uk/platforms/mac/voice-overlay)
- [WebChat macOS](/uk/platforms/mac/webchat)
- [Canvas macOS](/uk/platforms/mac/canvas)
- [Дочірній процес macOS](/uk/platforms/mac/child-process)
- [Стан macOS](/uk/platforms/mac/health)
- [Піктограма macOS](/uk/platforms/mac/icon)
- [Журналювання macOS](/uk/platforms/mac/logging)
- [Дозволи macOS](/uk/platforms/mac/permissions)
- [Віддалений доступ macOS](/uk/platforms/mac/remote)
- [Підписування macOS](/uk/platforms/mac/signing)
- [Gateway macOS (launchd)](/uk/platforms/mac/bundled-gateway)
- [XPC macOS](/uk/platforms/mac/xpc)
- [Skills macOS](/uk/platforms/mac/skills)
- [Peekaboo macOS](/uk/platforms/mac/peekaboo)

## Plugins

- [Огляд Plugins](/uk/tools/plugin)
- [Створення plugins](/uk/plugins/building-plugins)
- [Хуки Plugin](/uk/plugins/hooks)
- [Маніфест Plugin](/uk/plugins/manifest)
- [Інструменти агента](/uk/plugins/building-plugins#registering-agent-tools)
- [Пакети Plugin](/uk/plugins/bundles)
- [ClawHub](/uk/clawhub)
- [Кулінарна книга можливостей](/uk/plugins/adding-capabilities)
- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Plugin користувача Zalo](/uk/plugins/zalouser)

## Робоча область + шаблони

- [Skills](/uk/tools/skills)
- [ClawHub](/uk/clawhub)
- [Конфігурація Skills](/uk/tools/skills-config)
- [Стандартний AGENTS](/uk/reference/AGENTS.default)
- [Шаблони: AGENTS](/uk/reference/templates/AGENTS)
- [Шаблони: BOOTSTRAP](/uk/reference/templates/BOOTSTRAP)
- [Шаблони: HEARTBEAT](/uk/reference/templates/HEARTBEAT)
- [Шаблони: IDENTITY](/uk/reference/templates/IDENTITY)
- [Шаблони: SOUL](/uk/reference/templates/SOUL)
- [Шаблони: TOOLS](/uk/reference/templates/TOOLS)
- [Шаблони: USER](/uk/reference/templates/USER)

## Проєкт

- [Автори](/uk/reference/credits)

## Тестування + реліз

- [Тестування](/uk/reference/test)
- [Політика релізів](/uk/reference/RELEASING)
- [Моделі пристроїв](/uk/reference/device-models)

## Повʼязане

- [Початок роботи](/uk/start/getting-started)
