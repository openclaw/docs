---
read_when:
    - Вы хотите выбрать канал чата для OpenClaw
    - Вам нужен краткий обзор поддерживаемых платформ обмена сообщениями
summary: Платформы обмена сообщениями, к которым может подключаться OpenClaw
title: Каналы чата
x-i18n:
    generated_at: "2026-06-28T22:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw может общаться с вами в любом чат-приложении, которым вы уже пользуетесь. Каждый канал подключается через Gateway.
Текст поддерживается везде; медиа и реакции зависят от канала.

## Примечания о доставке

- Ответы Telegram, содержащие синтаксис изображений Markdown, например `![alt](url)`,
  по возможности преобразуются в медиаответы на финальном исходящем пути.
- Многопользовательские DM в Slack маршрутизируются как групповые чаты, поэтому к MPIM-разговорам
  применяются групповая политика, поведение упоминаний и правила групповых сессий.
- Настройка WhatsApp выполняется по требованию: первичная настройка может показать поток настройки до
  установки пакета плагина, а Gateway загружает внешний
  плагин ClawHub/npm только когда канал действительно активен.
- Каналы, принимающие входящие сообщения от ботов, могут использовать общую
  [защиту от зацикливания ботов](/ru/channels/bot-loop-protection), чтобы пары ботов не
  отвечали друг другу бесконечно.
- Поддерживаемые постоянно активные комнаты могут использовать [фоновые события комнат](/ru/channels/ambient-room-events),
  чтобы разговоры в комнате без упоминаний становились тихим контекстом, если агент не отправляет сообщение с помощью
  инструмента `message`.

## Поддерживаемые каналы

- [Discord](/ru/channels/discord) - Discord Bot API + Gateway; поддерживает серверы, каналы и DM.
- [Feishu](/ru/channels/feishu) - бот Feishu/Lark через WebSocket (встроенный плагин).
- [Google Chat](/ru/channels/googlechat) - приложение Google Chat API через HTTP Webhook (загружаемый плагин).
- [iMessage](/ru/channels/imessage) - нативная интеграция macOS через мост `imsg` на Mac с выполненным входом (или SSH-обертку, если Gateway работает в другом месте), включая действия частного API для ответов, tapback-реакций, эффектов, вложений и управления группами. Предпочтительно для новых настроек OpenClaw iMessage, когда разрешения хоста и доступ к Messages подходят.
- [IRC](/ru/channels/irc) - классические серверы IRC; каналы и DM с контролем сопряжения и списков разрешений.
- [LINE](/ru/channels/line) - бот LINE Messaging API (загружаемый плагин).
- [Matrix](/ru/channels/matrix) - протокол Matrix (загружаемый плагин).
- [Mattermost](/ru/channels/mattermost) - Bot API + WebSocket; каналы, группы, DM (загружаемый плагин).
- [Microsoft Teams](/ru/channels/msteams) - Bot Framework; корпоративная поддержка (встроенный плагин).
- [Nextcloud Talk](/ru/channels/nextcloud-talk) - самостоятельный чат через Nextcloud Talk (встроенный плагин).
- [Nostr](/ru/channels/nostr) - децентрализованные DM через NIP-04 (встроенный плагин).
- [QQ Bot](/ru/channels/qqbot) - QQ Bot API; приватный чат, групповой чат и насыщенные медиа (встроенный плагин).
- [Raft](/ru/channels/raft) - мост пробуждения Raft CLI для совместной работы людей и агентов (внешний плагин).
- [Signal](/ru/channels/signal) - signal-cli; ориентирован на приватность.
- [Slack](/ru/channels/slack) - Bolt SDK; приложения рабочих пространств.
- [SMS](/ru/channels/sms) - SMS на базе Twilio через Webhook Gateway (официальный плагин).
- [Synology Chat](/ru/channels/synology-chat) - Synology NAS Chat через исходящие и входящие Webhook (встроенный плагин).
- [Telegram](/ru/channels/telegram) - Bot API через grammY; поддерживает группы.
- [Tlon](/ru/channels/tlon) - мессенджер на базе Urbit (встроенный плагин).
- [Twitch](/ru/channels/twitch) - чат Twitch через IRC-соединение (встроенный плагин).
- [Voice Call](/ru/plugins/voice-call) - телефония через Plivo или Twilio (плагин, устанавливается отдельно).
- [WebChat](/ru/web/webchat) - интерфейс Gateway WebChat через WebSocket.
- [WeChat](/ru/channels/wechat) - плагин Tencent iLink Bot через QR-вход; только приватные чаты (внешний плагин).
- [WhatsApp](/ru/channels/whatsapp) - самый популярный; использует Baileys и требует QR-сопряжения.
- [Yuanbao](/ru/channels/yuanbao) - бот Tencent Yuanbao (внешний плагин).
- [Zalo](/ru/channels/zalo) - Zalo Bot API; популярный мессенджер во Вьетнаме (встроенный плагин).
- [Zalo ClawBot](/ru/channels/zaloclawbot) - персональный ассистент Zalo через QR-вход; привязан к владельцу (внешний плагин).
- [Zalo Personal](/ru/channels/zalouser) - личная учетная запись Zalo через QR-вход (встроенный плагин).

## Примечания

- Каналы могут работать одновременно; настройте несколько, и OpenClaw будет маршрутизировать по каждому чату.
- Самая быстрая настройка обычно у **Telegram** (простой токен бота). WhatsApp требует QR-сопряжения и
  хранит больше состояния на диске.
- Поведение групп зависит от канала; см. [Группы](/ru/channels/groups).
- Сопряжение DM и списки разрешений применяются для безопасности; см. [Безопасность](/ru/gateway/security).
- Устранение неполадок: [Устранение неполадок каналов](/ru/channels/troubleshooting).
- Поставщики моделей документированы отдельно; см. [Поставщики моделей](/ru/providers/models).
