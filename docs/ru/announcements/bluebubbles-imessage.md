---
read_when:
    - Вы использовали старый канал BlueBubbles и теперь должны перейти на iMessage
    - Вы выбираете поддерживаемую конфигурацию iMessage для OpenClaw
    - Вам нужно краткое объяснение удаления BlueBubbles
summary: Поддержка BlueBubbles была удалена из OpenClaw. Для новых и перенесённых конфигураций iMessage используйте встроенный плагин iMessage с imsg.
title: Удаление BlueBubbles и путь iMessage через imsg
x-i18n:
    generated_at: "2026-07-13T17:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Удаление BlueBubbles и переход на iMessage через imsg

OpenClaw больше не поставляется с каналом BlueBubbles. Поддержка iMessage работает через встроенный плагин `imessage`: Gateway запускает [`imsg`](https://github.com/steipete/imsg) как дочерний процесс локально или через SSH-обёртку и обменивается с ним данными по JSON-RPC через stdin/stdout. Без сервера, Webhook и порта.

Если ваша конфигурация всё ещё содержит `channels.bluebubbles`, перенесите её в `channels.imessage`. Старый URL документации `/channels/bluebubbles` перенаправляет на страницу [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles), где приведены полная таблица преобразования конфигурации и контрольный список перехода.

## Что изменилось

- Поддерживаемый способ работы с iMessage не использует HTTP-сервер BlueBubbles, маршрут Webhook, пароль REST или среду выполнения плагина BlueBubbles.
- OpenClaw читает и отслеживает сообщения через `imsg` на компьютере Mac, где выполнен вход в Messages.app.
- Базовые функции отправки, получения, просмотра истории и работы с медиа используют стандартные интерфейсы `imsg` и разрешения macOS.
- Для расширенных действий (ответов в ветках, реакций tapback, редактирования, отмены отправки, эффектов, уведомлений о прочтении, индикаторов набора текста и управления группами) требуется мост к закрытому API: запустите `imsg launch`, для чего необходимо отключить SIP.
- Gateway на Linux и Windows по-прежнему могут использовать iMessage, если в `channels.imessage.cliPath` указать SSH-обёртку, которая запускает `imsg` на компьютере Mac с выполненным входом.

## Что нужно сделать

1. Установите и проверьте `imsg` на компьютере Mac с Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Предоставьте разрешения Full Disk Access и Automation контексту процесса, в котором выполняются `imsg` и OpenClaw.

3. Преобразуйте старую конфигурацию:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Перезапустите Gateway и выполните проверку:

   ```bash
   openclaw channels status --probe
   ```

5. Прежде чем удалять старый сервер BlueBubbles, протестируйте личные сообщения, группы, вложения и все используемые вами действия закрытого API.

## Примечания по миграции

- У `channels.bluebubbles.serverUrl` и `channels.bluebubbles.password` нет эквивалентов в iMessage: здесь нет сервера, с которым нужно устанавливать соединение или проходить аутентификацию.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` и `actions.*` сохраняют своё значение в `channels.imessage`.
- `channels.imessage.includeAttachments` по-прежнему по умолчанию отключён. Включите его явно, если входящие фотографии, голосовые сообщения, видео или файлы должны передаваться агенту.
- При использовании `groupPolicy: "allowlist"` скопируйте старый блок `groups`, включая запись с подстановочным знаком `"*"`, если она есть. Списки разрешённых отправителей групп и реестр групп — это отдельные механизмы допуска; блок `groups` с записями, но без соответствующего `chat_id` (или без `"*"`) приводит к отбрасыванию сообщения во время выполнения, а пустой блок `groups` регистрирует предупреждение при запуске, хотя фильтрация отправителей по-прежнему пропускает сообщения.
- В привязках ACP значение `match.channel: "bluebubbles"` необходимо заменить на `"imessage"`.
- Старые ключи сеансов BlueBubbles не становятся ключами сеансов iMessage. Подтверждения сопряжения привязаны к идентификаторам отправителей, поэтому скопированные записи `allowFrom` продолжат работать, но история разговоров, связанная с ключами сеансов BlueBubbles, не переносится.

## См. также

- [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles)
- [iMessage](/ru/channels/imessage)
- [Справочник по конфигурации — iMessage](/ru/gateway/config-channels#imessage)
