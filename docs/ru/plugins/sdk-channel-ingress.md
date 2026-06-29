---
read_when:
    - Создание или миграция Plugin для канала сообщений
    - Изменение списков разрешенных DM или групп, шлюзов маршрутизации, авторизации команд, авторизации событий или активации упоминанием
    - Проверка редактирования входящих данных канала или границ совместимости SDK
sidebarTitle: Channel Ingress
summary: Экспериментальный API входящего канала для авторизации входящих сообщений
title: API входа канала
x-i18n:
    generated_at: "2026-06-28T23:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# API входящих событий каналов

Входящие события каналов — это экспериментальная граница контроля доступа для входящих
событий каналов. Используйте `openclaw/plugin-sdk/channel-ingress-runtime` для путей приема.
Более старый подпуть `openclaw/plugin-sdk/channel-ingress` остается экспортируемым как
устаревший совместимый фасад для сторонних plugins.

Plugins владеют фактами платформы и побочными эффектами. Ядро владеет общей политикой: списками
разрешенных DM/групп, DM-записями хранилища сопряжения, шлюзами маршрутов, шлюзами команд, авторизацией событий,
активацией по упоминанию, редактированными диагностическими данными и допуском.

## Runtime Resolver

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Не вычисляйте заранее эффективные списки разрешенных, владельцев команд или группы команд. Resolver
выводит их из исходных списков разрешенных, callback-функций хранилища, дескрипторов маршрутов,
групп доступа, политики и типа беседы.

## Результат

Встроенные plugins должны напрямую использовать современные проекции:

- `ingress`: упорядоченное решение шлюза и допуск
- `senderAccess`: только авторизация отправителя/беседы
- `routeAccess`: проекция маршрута и отправителя маршрута
- `commandAccess`: авторизация команды; `false`, если шлюз команд не запускался
- `activationAccess`: результат упоминания/активации

Авторизация событий остается доступной в упорядоченном `ingress.graph` и решающем
`ingress.reasonCode`; отдельная проекция события не создается.

Устаревшие helpers SDK для сторонних разработчиков могут внутренне пересобирать старые формы. Новые
встроенные пути приема не должны переводить современные результаты обратно в локальные DTO.

## Группы доступа

Записи `accessGroup:<name>` остаются редактированными. Ядро само разрешает статические
группы `message.senders` и вызывает `resolveAccessGroupMembership` только
для динамических групп, которым требуется поиск на платформе. Отсутствующие, неподдерживаемые и
сбойные группы закрываются с отказом.

## Режимы событий

| `authMode`       | Значение                                         |
| ---------------- | ------------------------------------------------ |
| `inbound`        | обычные шлюзы входящего отправителя              |
| `command`        | шлюзы команд для callbacks или кнопок с областью |
| `origin-subject` | актор должен совпадать с субъектом исходного сообщения |
| `route-only`     | только шлюзы маршрута для доверенных событий в области маршрута |
| `none`           | внутренние события, принадлежащие plugin, обходят общую авторизацию |

Используйте `mayPair: false` для реакций, кнопок, callbacks и нативных команд.

## Маршруты и активация

Используйте дескрипторы маршрутов для политики комнаты, темы, гильдии, треда или вложенного маршрута:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Используйте `channelIngressRoutes(...)`, когда у plugin есть несколько необязательных
дескрипторов маршрутов; он отфильтровывает отключенные ветви, сохраняя факты маршрута универсальными и
упорядоченными по `precedence` каждого дескриптора.

Шлюз упоминаний является шлюзом активации. Промах упоминания возвращает
`admission: "skip"`, чтобы ядро turn не обрабатывало turn только для наблюдения.
Большинству каналов следует оставлять активацию после шлюзов отправителя и команд. Публичные
чат-поверхности, которым нужно приглушать трафик без упоминаний до шума
списка разрешенных отправителей, могут включить `activation.order: "before-sender"`, когда обход
текстовыми командами отключен. Каналы с неявной активацией, например ответы в bot
threads, могут передавать `activation.allowedImplicitMentionKinds`; спроецированное
`activationAccess.shouldBypassMention` затем сообщает, когда команда или неявная
активация обошли явное упоминание.

## Редактирование

Сырые значения отправителя и сырые записи списков разрешенных являются только входными данными resolver. Они не должны
появляться в разрешенном состоянии, решениях, диагностике, снимках или
фактах совместимости. Используйте непрозрачные идентификаторы субъектов, идентификаторы записей, идентификаторы маршрутов и
диагностические идентификаторы.

## Проверка

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
