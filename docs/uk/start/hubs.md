---
read_when:
    - Вам потрібна повна карта документації
summary: Центри, що посилаються на всю документацію OpenClaw
title: Центри документації
x-i18n:
    generated_at: "2026-04-24T17:33:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: db591029047b57e65141c5992760a81b838580602b1073e94d1bc2690415c0aa
    source_path: start/hubs.md
    workflow: 15
---

<Note>
Якщо ви новачок в OpenClaw, почніть із [Getting Started](/uk/start/getting-started).
</Note>

Використовуйте ці центри, щоб знайти кожну сторінку, включно з поглибленими матеріалами та довідковою документацією, які не відображаються в лівій навігації.

## Почніть тут

- [Індекс](/uk)
- [Getting Started](/uk/start/getting-started)
- [Onboarding](/uk/start/onboarding)
- [Onboarding (CLI)](/uk/start/wizard)
- [Налаштування](/uk/start/setup)
- [Панель керування (local loopback Gateway)](http://127.0.0.1:18789/)
- [Допомога](/uk/help)
- [Каталог документації](/uk/start/docs-directory)
- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Асистент OpenClaw](/uk/start/openclaw)
- [Вітрина](/uk/start/showcase)
- [Лор](/uk/start/lore)

## Встановлення й оновлення

- [Docker](/uk/install/docker)
- [Nix](/uk/install/nix)
- [Оновлення / відкат](/uk/install/updating)
- [Робочий процес Bun (експериментально)](/uk/install/bun)

## Основні концепції

- [Архітектура](/uk/concepts/architecture)
- [Можливості](/uk/concepts/features)
- [Центр мережі](/uk/network)
- [Середовище виконання агента](/uk/concepts/agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Пам’ять](/uk/concepts/memory)
- [Цикл агента](/uk/concepts/agent-loop)
- [Потокове передавання + поділ на частини](/uk/concepts/streaming)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Compaction](/uk/concepts/compaction)
- [Сесії](/uk/concepts/session)
- [Очищення сесій](/uk/concepts/session-pruning)
- [Інструменти сесії](/uk/concepts/session-tool)
- [Черга](/uk/concepts/queue)
- [Команди зі слешем](/uk/tools/slash-commands)
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

## Провайдери й вхідні канали

- [Центр чат-каналів](/uk/channels)
- [Центр провайдерів моделей](/uk/providers/models)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Slack](/uk/channels/slack)
- [Discord](/uk/channels/discord)
- [Mattermost](/uk/channels/mattermost)
- [Signal](/uk/channels/signal)
- [BlueBubbles (iMessage)](/uk/channels/bluebubbles)
- [QQ Bot](/uk/channels/qqbot)
- [iMessage (застаріле)](/uk/channels/imessage)
- [Розпізнавання геолокації](/uk/channels/location)
- [WebChat](/uk/web/webchat)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)

## Gateway та операції

- [Посібник з експлуатації Gateway](/uk/gateway)
- [Мережева модель](/uk/gateway/network-model)
- [Сполучення Gateway](/uk/gateway/pairing)
- [Блокування Gateway](/uk/gateway/gateway-lock)
- [Фоновий процес](/uk/gateway/background-process)
- [Стан системи](/uk/gateway/health)
- [Heartbeat](/uk/gateway/heartbeat)
- [Doctor](/uk/gateway/doctor)
- [Журналювання](/uk/gateway/logging)
- [Ізоляція](/uk/gateway/sandboxing)
- [Панель керування](/uk/web/dashboard)
- [Інтерфейс керування](/uk/web/control-ui)
- [Віддалений доступ](/uk/gateway/remote)
- [README віддаленого Gateway](/uk/gateway/remote-gateway-readme)
- [Tailscale](/uk/gateway/tailscale)
- [Безпека](/uk/gateway/security)
- [Усунення несправностей](/uk/gateway/troubleshooting)

## Інструменти й автоматизація

- [Поверхня інструментів](/uk/tools)
- [OpenProse](/uk/prose)
- [Довідник CLI](/uk/cli)
- [Інструмент Exec](/uk/tools/exec)
- [Інструмент PDF](/uk/tools/pdf)
- [Підвищений режим](/uk/tools/elevated)
- [Cron jobs](/uk/automation/cron-jobs)
- [Автоматизація й завдання](/uk/automation)
- [Мислення + докладний режим](/uk/tools/thinking)
- [Моделі](/uk/concepts/models)
- [Субагенти](/uk/tools/subagents)
- [CLI для надсилання агенту](/uk/tools/agent-send)
- [Термінальний інтерфейс](/uk/web/tui)
- [Керування браузером](/uk/tools/browser)
- [Браузер (усунення несправностей у Linux)](/uk/tools/browser-linux-troubleshooting)
- [Опитування](/uk/cli/message)

## Node, медіа, голос

- [Огляд Node](/uk/nodes)
- [Камера](/uk/nodes/camera)
- [Зображення](/uk/nodes/images)
- [Аудіо](/uk/nodes/audio)
- [Команда геолокації](/uk/nodes/location-command)
- [Активація голосом](/uk/nodes/voicewake)
- [Режим розмови](/uk/nodes/talk)

## Платформи

- [Огляд платформ](/uk/platforms)
- [macOS](/uk/platforms/macos)
- [iOS](/uk/platforms/ios)
- [Android](/uk/platforms/android)
- [Windows (WSL2)](/uk/platforms/windows)
- [Linux](/uk/platforms/linux)
- [Веб-поверхні](/uk/web)

## Супутній застосунок macOS (розширено)

- [Налаштування середовища розробки macOS](/uk/platforms/mac/dev-setup)
- [Рядок меню macOS](/uk/platforms/mac/menu-bar)
- [Голосова активація macOS](/uk/platforms/mac/voicewake)
- [Голосове накладання macOS](/uk/platforms/mac/voice-overlay)
- [WebChat для macOS](/uk/platforms/mac/webchat)
- [Canvas для macOS](/uk/platforms/mac/canvas)
- [Дочірній процес macOS](/uk/platforms/mac/child-process)
- [Стан системи macOS](/uk/platforms/mac/health)
- [Іконка macOS](/uk/platforms/mac/icon)
- [Журналювання macOS](/uk/platforms/mac/logging)
- [Дозволи macOS](/uk/platforms/mac/permissions)
- [Віддалений доступ macOS](/uk/platforms/mac/remote)
- [Підписування macOS](/uk/platforms/mac/signing)
- [Gateway macOS (launchd)](/uk/platforms/mac/bundled-gateway)
- [XPC у macOS](/uk/platforms/mac/xpc)
- [Skills для macOS](/uk/platforms/mac/skills)
- [Peekaboo для macOS](/uk/platforms/mac/peekaboo)

## Plugins

- [Огляд Plugins](/uk/tools/plugin)
- [Створення plugins](/uk/plugins/building-plugins)
- [Хуки Plugin](/uk/plugins/hooks)
- [Маніфест Plugin](/uk/plugins/manifest)
- [Інструменти агента](/uk/plugins/building-plugins#registering-agent-tools)
- [Пакети Plugin](/uk/plugins/bundles)
- [Спільнотні plugins](/uk/plugins/community)
- [Збірник прикладів можливостей](/uk/plugins/architecture)
- [Plugin голосових дзвінків](/uk/plugins/voice-call)
- [Plugin користувача Zalo](/uk/plugins/zalouser)

## Робочий простір і шаблони

- [Skills](/uk/tools/skills)
- [ClawHub](/uk/tools/clawhub)
- [Конфігурація Skills](/uk/tools/skills-config)
- [Стандартні AGENTS](/uk/reference/AGENTS.default)
- [Шаблони: AGENTS](/uk/reference/templates/AGENTS)
- [Шаблони: BOOTSTRAP](/uk/reference/templates/BOOTSTRAP)
- [Шаблони: HEARTBEAT](/uk/reference/templates/HEARTBEAT)
- [Шаблони: IDENTITY](/uk/reference/templates/IDENTITY)
- [Шаблони: SOUL](/uk/reference/templates/SOUL)
- [Шаблони: TOOLS](/uk/reference/templates/TOOLS)
- [Шаблони: USER](/uk/reference/templates/USER)

## Проєкт

- [Подяки](/uk/reference/credits)

## Тестування й випуск

- [Тестування](/uk/reference/test)
- [Політика випусків](/uk/reference/RELEASING)
- [Моделі пристроїв](/uk/reference/device-models)

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
