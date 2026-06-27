---
read_when:
    - Вам потрібна повна мапа документації
summary: Хаби, що посилаються на кожну документацію OpenClaw
title: Центри документації
x-i18n:
    generated_at: "2026-06-27T18:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7d3f089e2caea1e1487c7c0375c62dfb007db05827a77d4e5616839023b9457
    source_path: start/hubs.md
    workflow: 16
---

<Note>
Якщо ви новачок в OpenClaw, почніть із [Початку роботи](/uk/start/getting-started).
</Note>

Використовуйте ці центри, щоб знайти кожну сторінку, зокрема поглиблені матеріали та довідкову документацію, яких немає в лівій навігації.

## Почніть тут

- [Індекс](/uk)
- [Початок роботи](/uk/start/getting-started)
- [Початкове налаштування](/uk/start/onboarding)
- [Початкове налаштування (CLI)](/uk/start/wizard)
- [Налаштування](/uk/start/setup)
- [Панель керування (локальний Gateway)](http://127.0.0.1:18789/)
- [Довідка](/uk/help)
- [Каталог документації](/uk/start/docs-directory)
- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Помічник OpenClaw](/uk/start/openclaw)
- [Вітрина](/uk/start/showcase)
- [Лор](/uk/start/lore)

## Встановлення + оновлення

- [Docker](/uk/install/docker)
- [Nix](/uk/install/nix)
- [Оновлення / відкат](/uk/install/updating)
- [Робочий процес Bun (експериментально)](/uk/install/bun)

## Основні поняття

- [Архітектура](/uk/concepts/architecture)
- [Функції](/uk/concepts/features)
- [Центр мережі](/uk/network)
- [Середовище виконання агента](/uk/concepts/agent)
- [Робоча область агента](/uk/concepts/agent-workspace)
- [Пам’ять](/uk/concepts/memory)
- [Цикл агента](/uk/concepts/agent-loop)
- [Потокове передавання + розбиття на фрагменти](/uk/concepts/streaming)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Compaction](/uk/concepts/compaction)
- [Сеанси](/uk/concepts/session)
- [Обрізання сеансів](/uk/concepts/session-pruning)
- [Інструменти сеансу](/uk/concepts/session-tool)
- [Черга](/uk/concepts/queue)
- [Слеш-команди](/uk/tools/slash-commands)
- [Адаптери RPC](/uk/reference/rpc)
- [Схеми TypeBox](/uk/concepts/typebox)
- [Обробка часового поясу](/uk/concepts/timezone)
- [Присутність](/uk/concepts/presence)
- [Виявлення + транспорти](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групи](/uk/channels/groups)
- [Групові повідомлення](/uk/channels/group-messages)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
- [OAuth](/uk/concepts/oauth)

## Провайдери + вхідний трафік

- [Центр чат-каналів](/uk/channels)
- [Центр провайдерів моделей](/uk/providers/models)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Slack](/uk/channels/slack)
- [Discord](/uk/channels/discord)
- [Mattermost](/uk/channels/mattermost)
- [Signal](/uk/channels/signal)
- [QQ Bot](/uk/channels/qqbot)
- [iMessage](/uk/channels/imessage)
- [Розбір місця розташування](/uk/channels/location)
- [WebChat](/uk/web/webchat)
- [Webhook-и](/uk/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + операції

- [Інструкція з експлуатації Gateway](/uk/gateway)
- [Мережева модель](/uk/network#core-model)
- [Сполучення Gateway](/uk/gateway/pairing)
- [Блокування Gateway](/uk/gateway/gateway-lock)
- [Фоновий процес](/uk/gateway/background-process)
- [Стан працездатності](/uk/gateway/health)
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
- [Інструмент виконання](/uk/tools/exec)
- [Інструмент PDF](/uk/tools/pdf)
- [Режим підвищених прав](/uk/tools/elevated)
- [Завдання Cron](/uk/automation/cron-jobs)
- [Автоматизація](/uk/automation)
- [Міркування + докладний режим](/uk/tools/thinking)
- [Моделі](/uk/concepts/models)
- [Субагенти](/uk/tools/subagents)
- [CLI надсилання агенту](/uk/tools/agent-send)
- [Термінальний інтерфейс](/uk/web/tui)
- [Керування браузером](/uk/tools/browser)
- [Браузер (усунення несправностей Linux)](/uk/tools/browser-linux-troubleshooting)
- [Опитування](/uk/cli/message)

## Node-и, медіа, голос

- [Огляд Node-ів](/uk/nodes)
- [Камера](/uk/nodes/camera)
- [Зображення](/uk/nodes/images)
- [Аудіо](/uk/nodes/audio)
- [Команда місця розташування](/uk/nodes/location-command)
- [Голосова активація](/uk/nodes/voicewake)
- [Режим розмови](/uk/nodes/talk)

## Платформи

- [Огляд платформ](/uk/platforms)
- [macOS](/uk/platforms/macos)
- [iOS](/uk/platforms/ios)
- [Android](/uk/platforms/android)
- [Центр Windows](/uk/platforms/windows)
- [Linux](/uk/platforms/linux)
- [Вебповерхні](/uk/web)

## Супровідний застосунок macOS (розширено)

- [Налаштування середовища розробки macOS](/uk/platforms/mac/dev-setup)
- [Рядок меню macOS](/uk/platforms/mac/menu-bar)
- [Голосова активація macOS](/uk/platforms/mac/voicewake)
- [Голосове накладання macOS](/uk/platforms/mac/voice-overlay)
- [WebChat macOS](/uk/platforms/mac/webchat)
- [Canvas macOS](/uk/platforms/mac/canvas)
- [Дочірній процес macOS](/uk/platforms/mac/child-process)
- [Стан працездатності macOS](/uk/platforms/mac/health)
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
- [Типові AGENTS](/uk/reference/AGENTS.default)
- [Шаблони: AGENTS](/uk/reference/templates/AGENTS)
- [Шаблони: BOOTSTRAP](/uk/reference/templates/BOOTSTRAP)
- [Шаблони: HEARTBEAT](/uk/reference/templates/HEARTBEAT)
- [Шаблони: IDENTITY](/uk/reference/templates/IDENTITY)
- [Шаблони: SOUL](/uk/reference/templates/SOUL)
- [Шаблони: TOOLS](/uk/reference/templates/TOOLS)
- [Шаблони: USER](/uk/reference/templates/USER)

## Проєкт

- [Подяки](/uk/reference/credits)

## Тестування + випуск

- [Тестування](/uk/reference/test)
- [Політика випусків](/uk/reference/RELEASING)
- [Моделі пристроїв](/uk/reference/device-models)

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
