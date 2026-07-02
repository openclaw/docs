---
read_when:
    - Вы создаете новый Plugin канала обмена сообщениями
    - Вы хотите подключить OpenClaw к платформе обмена сообщениями
    - Необходимо понять интерфейс адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Пошаговое руководство по созданию Plugin канала обмена сообщениями для OpenClaw
title: Создание плагинов каналов
x-i18n:
    generated_at: "2026-07-02T22:43:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Это руководство описывает создание Plugin канала, который подключает OpenClaw к
платформе обмена сообщениями. К концу у вас будет рабочий канал с безопасностью DM,
сопряжением, цепочками ответов и исходящими сообщениями.

<Info>
  Если вы раньше не создавали Plugin OpenClaw, сначала прочитайте
  [Начало работы](/ru/plugins/building-plugins), чтобы узнать базовую структуру пакета
  и настройку манифеста.
</Info>

## Как работают Plugins каналов

Plugins каналов не нуждаются в собственных инструментах отправки/редактирования/реакций. OpenClaw хранит один
общий инструмент `message` в ядре. Ваш Plugin отвечает за:

- **Конфигурацию** - разрешение учетной записи и мастер настройки
- **Безопасность** - политику DM и списки разрешенных
- **Сопряжение** - поток утверждения DM
- **Грамматику сессии** - как специфичные для провайдера идентификаторы разговоров сопоставляются с базовыми чатами, идентификаторами веток и резервными родительскими вариантами
- **Исходящие сообщения** - отправку текста, медиа и опросов на платформу
- **Цепочки** - как ответы объединяются в цепочки
- **Индикатор ввода Heartbeat** - необязательные сигналы ввода/занятости для целей доставки Heartbeat

Ядро отвечает за общий инструмент сообщений, подключение промптов, внешнюю форму ключа сессии,
общий учет `:thread:` и диспетчеризацию.

Новые Plugins каналов также должны предоставлять адаптер `message` с
`defineChannelMessageAdapter` из `openclaw/plugin-sdk/channel-outbound`. Адаптер
объявляет, какие долговечные возможности финальной отправки фактически поддерживает нативный транспорт,
и направляет отправку текста/медиа в те же транспортные функции, что и устаревший адаптер `outbound`. Объявляйте возможность только тогда, когда контрактный тест
доказывает нативный побочный эффект и возвращенную квитанцию.
Полный контракт API, примеры, матрицу возможностей, правила квитанций, финализацию live-предпросмотра, политику подтверждения получения, тесты и таблицу миграции см. в
[API исходящих сообщений канала](/ru/plugins/sdk-channel-outbound).
Если существующий адаптер `outbound` уже имеет нужные методы отправки и
метаданные возможностей, используйте `createChannelMessageAdapterFromOutbound(...)`, чтобы
получить адаптер `message`, вместо ручного написания еще одного моста.
Отправки адаптера должны возвращать значения `MessageReceipt`. Когда коду совместимости
все еще нужны устаревшие идентификаторы, получайте их через `listMessageReceiptPlatformIds(...)`
или `resolveMessageReceiptPrimaryId(...)`, а не храните параллельные
поля `messageIds` в новом коде жизненного цикла.
Каналы с поддержкой предпросмотра также должны объявлять `message.live.capabilities` с
точным live-жизненным циклом, которым они владеют, например `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` или
`quietFinalization`. Каналы, которые финализируют черновик предпросмотра на месте, также должны
объявлять `message.live.finalizer.capabilities`, такие как `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` и
`retainOnAmbiguousFailure`, и направлять логику runtime через
`defineFinalizableLivePreviewAdapter(...)` плюс
`deliverWithFinalizableLivePreviewAdapter(...)`. Подкрепляйте эти возможности
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` и
`verifyChannelMessageLiveFinalizerProofs(...)`, чтобы нативный предпросмотр,
прогресс, редактирование, резервное поведение/сохранение, очистка и поведение квитанций не могли незаметно расходиться.
Входящие получатели, которые откладывают подтверждения платформы, должны объявлять
`message.receive.defaultAckPolicy` и `supportedAckPolicies`, вместо того чтобы скрывать
время подтверждения в локальном состоянии монитора. Покрывайте каждую объявленную политику
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Устаревшие помощники ответов, такие как `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` и `recordInboundSessionAndDispatchReply`,
остаются доступными для диспетчеров совместимости. Не используйте эти имена для нового
кода каналов; новые Plugins должны начинаться с адаптера `message`, квитанций и
помощников жизненного цикла приема/отправки в `openclaw/plugin-sdk/channel-outbound`.

Каналы, мигрирующие входящую авторизацию, могут использовать экспериментальный
подпуть `openclaw/plugin-sdk/channel-ingress-runtime` из путей приема runtime.
Подпуть оставляет поиск платформы и побочные эффекты в Plugin, одновременно
разделяя разрешение состояния списка разрешенных, решения по маршруту/отправителю/команде/событию/активации,
редактированную диагностику и сопоставление допуска хода. Держите
нормализацию идентичности Plugin в дескрипторе, который передаете резолверу; не
сериализуйте сырые значения совпадений из разрешенного состояния или решения. См.
[API входа канала](/ru/plugins/sdk-channel-ingress) для дизайна API,
границы владения и ожиданий по тестам.

Если ваш канал поддерживает индикаторы ввода вне входящих ответов, предоставьте
`heartbeat.sendTyping(...)` в Plugin канала. Ядро вызывает его с
разрешенной целью доставки Heartbeat перед началом модельного запуска Heartbeat и
использует общий жизненный цикл keepalive/cleanup для индикатора ввода. Добавьте `heartbeat.clearTyping(...)`,
когда платформе нужен явный сигнал остановки.

Если ваш канал добавляет параметры инструмента сообщений, которые передают источники медиа, предоставьте эти
имена параметров через `describeMessageTool(...).mediaSourceParams`. Ядро использует
этот явный список для нормализации путей sandbox и политики доступа к исходящим медиа,
поэтому Plugins не нужны специальные случаи в общем ядре для специфичных для провайдера
параметров аватара, вложения или обложки.
Предпочитайте возвращать карту по ключам действий, например
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, чтобы несвязанные действия не
наследовали медиа-аргументы другого действия. Плоский массив по-прежнему работает для параметров, которые
намеренно используются всеми предоставляемыми действиями.
Каналы, которым нужно предоставить временный публичный URL для получения медиа на стороне платформы,
могут использовать `createHostedOutboundMediaStore(...)` из
`openclaw/plugin-sdk/outbound-media` с хранилищами состояния Plugin. Держите
разбор маршрутов платформы и проверку токенов в Plugin канала; общий помощник
отвечает только за загрузку медиа, метаданные истечения срока, строки чанков и очистку.

Если вашему каналу нужна специфичная для провайдера формовка для `message(action="send")`,
предпочитайте `actions.prepareSendPayload(...)`. Помещайте нативные карточки, блоки, embeds или
другие долговечные данные в `payload.channelData.<channel>` и позвольте ядру выполнить
фактическую отправку через адаптер outbound/message. Используйте
`actions.handleAction(...)` для отправки только как резерв совместимости для
полезных нагрузок, которые нельзя сериализовать и повторить.

Если ваша платформа хранит дополнительную область действия внутри идентификаторов разговоров, держите этот разбор
в Plugin с `messaging.resolveSessionConversation(...)`. Это
канонический hook для сопоставления `rawId` с базовым идентификатором разговора, необязательным идентификатором ветки,
явным `baseConversationId` и любыми `parentConversationCandidates`.
Когда вы возвращаете `parentConversationCandidates`, сохраняйте их порядок от
самого узкого родителя к самому широкому/базовому разговору.

Используйте `openclaw/plugin-sdk/channel-route`, когда коду Plugin нужно нормализовать
поля, похожие на маршруты, сравнить дочернюю ветку с ее родительским маршрутом или построить
стабильный ключ дедупликации из `{ channel, to, accountId, threadId }`. Помощник
нормализует числовые идентификаторы веток так же, как это делает ядро, поэтому Plugins должны предпочитать
его ad hoc-сравнениям `String(threadId)`.
Plugins со специфичной для провайдера грамматикой целей должны предоставлять
`messaging.resolveOutboundSessionRoute(...)`, чтобы ядро получало нативную для провайдера
идентичность сессии и ветки без использования парсерных shim-слоев.

Встроенные Plugins, которым нужен такой же разбор до запуска реестра каналов,
также могут предоставлять файл верхнего уровня `session-key-api.ts` с соответствующим
экспортом `resolveSessionConversation(...)`. Ядро использует эту безопасную для bootstrap поверхность
только когда реестр Plugins runtime еще недоступен.

`messaging.resolveParentConversationCandidates(...)` остается доступным как
устаревший резерв совместимости, когда Plugin нужны только родительские резервные варианты поверх
общего/сырого идентификатора. Если существуют оба hook, ядро сначала использует
`resolveSessionConversation(...).parentConversationCandidates` и только затем
переходит к `resolveParentConversationCandidates(...)`, когда канонический hook
их не предоставляет.

## Утверждения и возможности канала

Большинству Plugins каналов не нужен код, специфичный для утверждений.

- Core владеет `/approve` в том же чате, общими payload кнопок подтверждения и универсальной fallback-доставкой.
- Предпочитайте один объект `approvalCapability` в channel plugin, когда каналу нужно поведение, специфичное для подтверждений.
- `ChannelPlugin.approvals` удален. Помещайте факты о доставке/нативном интерфейсе/render/auth подтверждений в `approvalCapability`.
- `plugin.auth` предназначен только для входа/выхода; Core больше не читает хуки auth подтверждений из этого объекта.
- `approvalCapability.authorizeActorAction` и `approvalCapability.getActionAvailabilityState` являются каноническим seam для auth подтверждений.
- Используйте `approvalCapability.getActionAvailabilityState` для доступности auth подтверждений в том же чате. Оставляйте настроенных approvers доступными для `/approve`, даже когда нативная доставка отключена; вместо этого используйте состояние native initiating-surface для подсказок по доставке/настройке.
- Если ваш канал предоставляет нативные exec-подтверждения, используйте `approvalCapability.getExecInitiatingSurfaceState` для состояния initiating-surface/нативного клиента, когда оно отличается от auth подтверждений в том же чате. Core использует этот exec-специфичный хук, чтобы различать `enabled` и `disabled`, решать, поддерживает ли initiating channel нативные exec-подтверждения, и включать канал в подсказки fallback для нативного клиента. `createApproverRestrictedNativeApprovalCapability(...)` заполняет это для типичного случая.
- Используйте `outbound.shouldSuppressLocalPayloadPrompt` или `outbound.beforeDeliverPayload` для специфичного для канала поведения жизненного цикла payload, например скрытия дублирующих локальных запросов подтверждения или отправки индикаторов набора текста перед доставкой.
- Используйте `approvalCapability.delivery` только для нативной маршрутизации подтверждений или подавления fallback.
- Используйте `approvalCapability.nativeRuntime` для принадлежащих каналу фактов нативных подтверждений. Оставляйте его ленивым на горячих entrypoints канала с `createLazyChannelApprovalNativeRuntimeAdapter(...)`, который может импортировать ваш runtime-модуль по требованию, при этом позволяя Core собрать жизненный цикл подтверждения.
- Используйте `approvalCapability.render` только когда каналу действительно нужны кастомные payload подтверждений вместо общего renderer.
- Используйте `approvalCapability.describeExecApprovalSetup`, когда канал хочет, чтобы ответ на disabled-пути объяснял точные config knobs, необходимые для включения нативных exec-подтверждений. Хук получает `{ channel, channelLabel, accountId }`; каналы с именованными аккаунтами должны render пути в области аккаунта, такие как `channels.<channel>.accounts.<id>.execApprovals.*`, вместо верхнеуровневых defaults.
- Используйте `approvalCapability.describePluginApprovalSetup`, когда подсказки при сбое plugin approval безопасно показывать для no-route и timeout сбоев plugin approval. `createApproverRestrictedNativeApprovalCapability(...)` не выводит это из `describeExecApprovalSetup`; передавайте тот же helper явно только когда plugin и exec подтверждения действительно используют одну и ту же нативную настройку.
- Если канал может вывести стабильные DM identity, похожие на владельца, из существующей config, используйте `createResolvedApproverActionAuthAdapter` из `openclaw/plugin-sdk/approval-runtime`, чтобы ограничить `/approve` в том же чате без добавления специфичной для подтверждений логики в Core.
- Если кастомный auth подтверждений намеренно разрешает только fallback в том же чате, возвращайте `markImplicitSameChatApprovalAuthorization({ authorized: true })` из `openclaw/plugin-sdk/approval-auth-runtime`; иначе Core трактует результат как явную авторизацию approver.
- Если принадлежащий каналу нативный callback разрешает подтверждения напрямую, используйте `isImplicitSameChatApprovalAuthorization(...)` перед разрешением, чтобы неявный fallback все равно проходил через обычную actor authorization канала.
- Если каналу нужна нативная доставка подтверждений, держите код канала сосредоточенным на нормализации цели и фактах транспорта/представления. Используйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` и `createApproverRestrictedNativeApprovalCapability` из `openclaw/plugin-sdk/approval-runtime`. Помещайте специфичные для канала факты за `approvalCapability.nativeRuntime`, в идеале через `createChannelApprovalNativeRuntimeAdapter(...)` или `createLazyChannelApprovalNativeRuntimeAdapter(...)`, чтобы Core мог собрать handler и владеть фильтрацией запросов, маршрутизацией, дедупликацией, истечением срока, подпиской Gateway и уведомлениями о маршрутизации в другое место. `nativeRuntime` разделен на несколько меньших seams:
- Используйте `createNativeApprovalChannelRouteGates` из `openclaw/plugin-sdk/approval-native-runtime`, когда канал поддерживает как нативную доставку из session-origin, так и явные цели пересылки подтверждений. Helper централизует выбор config подтверждений, обработку `mode`, фильтры agent/session, привязку аккаунта, сопоставление session-target и сопоставление списка целей, при этом callers по-прежнему владеют id канала, default forwarding mode, lookup аккаунта, проверкой transport-enabled, нормализацией цели и разрешением turn-source target. Не используйте его для создания принадлежащих Core defaults политики канала; передавайте документированный default mode канала явно.
- `createChannelNativeOriginTargetResolver` по умолчанию использует общий matcher маршрутов канала для целей `{ to, accountId, threadId }`. Передавайте `targetsMatch` только когда у канала есть provider-специфичные правила эквивалентности, например сопоставление префикса timestamp в Slack.
- Передавайте `normalizeTargetForMatch` в `createChannelNativeOriginTargetResolver`, когда каналу нужно канонизировать provider ids перед запуском default route matcher или кастомного callback `targetsMatch`, сохраняя исходную цель для доставки. Используйте `normalizeTarget` только когда сама resolved delivery target должна быть канонизирована.
- `availability` - настроен ли аккаунт и должен ли обрабатываться запрос
- `presentation` - отображает общую view model подтверждения в pending/resolved/expired нативные payloads или финальные действия
- `transport` - подготавливает цели и отправляет/обновляет/удаляет нативные сообщения подтверждения
- `interactions` - опциональные хуки bind/unbind/clear-action для нативных кнопок или реакций, плюс опциональный хук `cancelDelivered`. Реализуйте `cancelDelivered`, когда `deliverPending` регистрирует in-process или persistent state (например, хранилище reaction target), чтобы это состояние можно было освободить, если остановка handler отменяет доставку до запуска `bindPending` или когда `bindPending` не возвращает handle
- `observe` - опциональные хуки диагностики доставки
- Если каналу нужны runtime-owned объекты, такие как client, token, Bolt app или webhook receiver, регистрируйте их через `openclaw/plugin-sdk/channel-runtime-context`. Универсальный registry runtime-context позволяет Core bootstrap capability-driven handlers из startup state канала без добавления специфичного для подтверждений wrapper glue.
- Обращайтесь к более низкоуровневым `createChannelApprovalHandler` или `createChannelNativeApprovalRuntime` только когда capability-driven seam пока недостаточно выразителен.
- Каналы нативных подтверждений должны маршрутизировать и `accountId`, и `approvalKind` через эти helpers. `accountId` удерживает policy подтверждений для нескольких аккаунтов в области правильного bot account, а `approvalKind` сохраняет поведение exec vs plugin подтверждений доступным каналу без hardcoded branches в Core.
- Core теперь также владеет уведомлениями о reroute подтверждений. Channel plugins не должны отправлять собственные follow-up сообщения "approval went to DMs / another channel" из `createChannelNativeApprovalRuntime`; вместо этого предоставляйте точную маршрутизацию origin + approver-DM через общие helpers capability подтверждений и позволяйте Core агрегировать фактические доставки перед публикацией любого уведомления обратно в initiating chat.
- Сохраняйте kind доставленного approval id от начала до конца. Нативные clients не должны
  угадывать или переписывать маршрутизацию exec vs plugin approval из локального состояния канала.
- Разные kinds подтверждений могут намеренно предоставлять разные нативные surfaces.
  Текущие встроенные примеры:
  - Slack сохраняет нативную маршрутизацию подтверждений доступной как для exec, так и для plugin ids.
  - Matrix сохраняет ту же нативную маршрутизацию DM/channel и UX реакций для exec
    и plugin approvals, при этом все еще позволяя auth различаться по kind подтверждения.
- `createApproverRestrictedNativeApprovalAdapter` все еще существует как compatibility wrapper, но новый код должен предпочитать capability builder и предоставлять `approvalCapability` в plugin.

Для горячих entrypoints канала предпочитайте более узкие runtime subpaths, когда вам нужна только
одна часть этого семейства:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Аналогично, предпочитайте `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` и
`openclaw/plugin-sdk/reply-chunking`, когда вам не нужна более широкая umbrella
surface.

Конкретно для setup:

- `openclaw/plugin-sdk/setup-runtime` покрывает runtime-safe helpers setup:
  `createSetupTranslator`, import-safe adapters патчей setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вывод lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` и delegated
  builders setup-proxy
- `openclaw/plugin-sdk/setup-runtime` включает env-aware adapter seam для
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` покрывает builders setup для optional-install
  плюс несколько setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Если ваш канал поддерживает setup или auth, управляемые env, и универсальные startup/config
flows должны знать эти env names до загрузки runtime, объявите их в
plugin manifest через `channelEnvVars`. Оставляйте channel runtime `envVars` или локальные
constants только для operator-facing copy.

Если ваш канал может появляться в `status`, `channels list`, `channels status` или
SecretRef scans до запуска plugin runtime, добавьте `openclaw.setupEntry` в
`package.json`. Этот entrypoint должен быть безопасен для импорта в read-only command
paths и должен возвращать channel metadata, setup-safe config adapter, status
adapter и metadata channel secret target, нужные для этих summaries. Не
запускайте clients, listeners или transport runtimes из setup entry.

Сохраняйте узким и import path main channel entry. Discovery может оценить
entry и module channel plugin, чтобы зарегистрировать capabilities без активации
канала. Файлы вроде `channel-plugin-api.ts` должны экспортировать объект channel
plugin без импорта setup wizards, transport clients, socket
listeners, subprocess launchers или modules startup сервиса. Помещайте эти runtime
части в modules, загружаемые из `registerFull(...)`, runtime setters или lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` и
`splitSetupEntries`

- используйте более широкий seam `openclaw/plugin-sdk/setup` только когда вам также нужны
  более тяжелые общие helpers setup/config, такие как
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Если ваш канал хочет только рекламировать "сначала установите этот plugin" в setup
surfaces, предпочитайте `createOptionalChannelSetupSurface(...)`. Сгенерированный
adapter/wizard закрыто отказывают при config writes и finalization, и они переиспользуют
одно и то же сообщение install-required в validation, finalize и copy docs-link.

Для других горячих путей канала предпочитайте узкие helpers более широким legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` и
  `openclaw/plugin-sdk/account-helpers` для конфигурации с несколькими аккаунтами и
  резервного выбора аккаунта по умолчанию
- `openclaw/plugin-sdk/inbound-envelope` и
  `openclaw/plugin-sdk/channel-inbound` для входящего маршрута/конверта и
  связки записи и диспетчеризации
- `openclaw/plugin-sdk/channel-targets` для вспомогательных функций разбора целей
- `openclaw/plugin-sdk/outbound-media` для загрузки медиа и
  `openclaw/plugin-sdk/channel-outbound` для делегатов исходящей идентичности/отправки
  и планирования полезной нагрузки
- `buildThreadAwareOutboundSessionRoute(...)` из
  `openclaw/plugin-sdk/channel-core`, когда исходящий маршрут должен сохранять
  явный `replyToId`/`threadId` или восстанавливать текущую сессию `:thread:`
  после того, как базовый ключ сессии все еще совпадает. Плагины провайдеров могут переопределять
  приоритет, поведение суффиксов и нормализацию идентификатора ветки, когда их платформа
  имеет нативную семантику доставки в ветках.
- `openclaw/plugin-sdk/thread-bindings-runtime` для жизненного цикла привязок веток
  и регистрации адаптеров
- `openclaw/plugin-sdk/agent-media-payload` только когда по-прежнему требуется
  устаревшая структура полей полезной нагрузки агента/медиа
- `openclaw/plugin-sdk/telegram-command-config` для нормализации пользовательских команд
  Telegram, проверки дубликатов/конфликтов и стабильного резервного контракта
  конфигурации команд

Каналы только для аутентификации обычно могут ограничиться стандартным путем: ядро обрабатывает подтверждения, а плагин просто предоставляет исходящие возможности и возможности аутентификации. Нативные каналы подтверждений, такие как Matrix, Slack, Telegram и пользовательские чат-транспорты, должны использовать общие нативные вспомогательные функции вместо собственной реализации жизненного цикла подтверждений.

## Политика входящих упоминаний

Разделяйте обработку входящих упоминаний на два слоя:

- сбор доказательств, принадлежащий плагину
- оценка общей политики

Используйте `openclaw/plugin-sdk/channel-mention-gating` для решений политики упоминаний.
Используйте `openclaw/plugin-sdk/channel-inbound` только когда нужен более широкий barrel
входящих вспомогательных функций.

Хорошо подходит для локальной логики плагина:

- обнаружение ответа боту
- обнаружение цитирования бота
- проверки участия в ветке
- исключения служебных/системных сообщений
- нативные кэши платформы, нужные для доказательства участия бота

Хорошо подходит для общей вспомогательной функции:

- `requireMention`
- результат явного упоминания
- список разрешенных неявных упоминаний
- обход для команд
- итоговое решение о пропуске

Предпочтительный поток:

1. Вычислите локальные факты об упоминании.
2. Передайте эти факты в `resolveInboundMentionDecision({ facts, policy })`.
3. Используйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` и `decision.shouldSkip` во входящем шлюзе.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` предоставляет те же общие вспомогательные функции упоминаний для
встроенных плагинов каналов, которые уже зависят от внедрения runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Если нужны только `implicitMentionKindWhen` и
`resolveInboundMentionDecision`, импортируйте из
`openclaw/plugin-sdk/channel-mention-gating`, чтобы не загружать несвязанные входящие
вспомогательные функции runtime.

Используйте `resolveInboundMentionDecision({ facts, policy })` для шлюзования упоминаний.

## Пошаговое руководство

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет и манифест">
    Создайте стандартные файлы плагина. Поле `channel` в `package.json` —
    именно то, что делает это плагином канала. Полную поверхность метаданных пакета
    см. в [Настройка и конфигурация Plugin](/ru/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` проверяет `plugins.entries.acme-chat.config`. Используйте ее для
    настроек, принадлежащих плагину, которые не являются конфигурацией аккаунта канала. `channelConfigs`
    проверяет `channels.acme-chat` и является источником холодного пути, используемым схемой
    конфигурации, настройкой и UI-поверхностями до загрузки runtime плагина.

  </Step>

  <Step title="Соберите объект плагина канала">
    Интерфейс `ChannelPlugin` имеет много необязательных поверхностей адаптера. Начните с
    минимума — `id` и `setup` — и добавляйте адаптеры по мере необходимости.

    Создайте `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Для каналов, которые принимают и канонические ключи DM верхнего уровня, и устаревшие вложенные ключи, используйте вспомогательные функции из `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` и `normalizeChannelDmPolicy` сохраняют локальные для аккаунта значения с приоритетом над унаследованными корневыми значениями. Сочетайте тот же резолвер с восстановлением doctor через `normalizeLegacyDmAliases`, чтобы runtime и миграция читали один и тот же контракт.

    <Accordion title="Что createChatChannelPlugin делает за вас">
      Вместо ручной реализации низкоуровневых интерфейсов адаптеров вы передаете
      декларативные параметры, а builder компонует их:

      | Параметр | Что он связывает |
      | --- | --- |
      | `security.dm` | Резолвер безопасности DM с областью действия из полей конфигурации |
      | `pairing.text` | Текстовый поток связывания DM с обменом кодом |
      | `threading` | Резолвер режима ответа (фиксированный, привязанный к аккаунту или пользовательский) |
      | `outbound.attachedResults` | Функции отправки, возвращающие метаданные результата (идентификаторы сообщений) |

      Если нужен полный контроль, также можно передать необработанные объекты адаптеров
      вместо декларативных параметров.

      Необработанные исходящие адаптеры могут определять функцию `chunker(text, limit, ctx)`.
      Необязательное `ctx.formatting` содержит решения форматирования времени доставки,
      такие как `maxLinesPerMessage`; применяйте его перед отправкой, чтобы ветвление ответов
      и границы фрагментов один раз разрешались общей исходящей доставкой.
      Контексты отправки также включают `replyToIdSource` (`implicit` или `explicit`),
      когда была разрешена нативная цель ответа, чтобы вспомогательные функции полезной нагрузки могли сохранять
      явные теги ответа без расходования неявного одноразового слота ответа.
    </Accordion>

  </Step>

  <Step title="Подключите точку входа">
    Создайте `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Помещайте принадлежащие каналу дескрипторы CLI в `registerCliMetadata(...)`, чтобы OpenClaw
    мог показывать их в корневой справке без активации полного рантайма канала,
    при этом обычные полные загрузки по-прежнему будут использовать те же дескрипторы для реальной
    регистрации команд. Оставьте `registerFull(...)` для работы, относящейся только к рантайму.
    Если `registerFull(...)` регистрирует методы gateway RPC, используйте
    префикс, специфичный для плагина. Административные пространства имен ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) остаются зарезервированными и всегда
    разрешаются в `operator.admin`.
    `defineChannelPluginEntry` обрабатывает разделение режимов регистрации автоматически. См.
    [точки входа](/ru/plugins/sdk-entrypoints#definechannelpluginentry) для всех
    параметров.

  </Step>

  <Step title="Add a setup entry">
    Создайте `setup-entry.ts` для облегченной загрузки во время онбординга:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw загружает его вместо полной точки входа, когда канал отключен
    или не настроен. Это позволяет не загружать тяжелый код рантайма во время потоков настройки.
    Подробности см. в разделе [настройка и конфигурация](/ru/plugins/sdk-setup#setup-entry).

    Каналы из bundled workspace, которые выносят безопасные для настройки экспорты во вспомогательные
    модули, могут использовать `defineBundledChannelSetupEntry(...)` из
    `openclaw/plugin-sdk/channel-entry-contract`, когда им также нужен
    явный сеттер рантайма на этапе настройки.

  </Step>

  <Step title="Handle inbound messages">
    Ваш плагин должен получать сообщения с платформы и пересылать их в
    OpenClaw. Типичный шаблон — Webhook, который проверяет запрос и
    передает его через входящий обработчик вашего канала:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обработка входящих сообщений зависит от канала. Каждый плагин канала владеет
      собственным входящим конвейером. Посмотрите bundled-плагины каналов
      (например, пакет плагина Microsoft Teams или Google Chat) для реальных шаблонов.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Пишите colocated-тесты в `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Для общих тестовых вспомогательных средств см. [тестирование](/ru/plugins/sdk-testing).

</Step>
</Steps>

## Структура файлов

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Расширенные темы

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/ru/plugins/sdk-entrypoints#registration-mode">
    Фиксированные, привязанные к учетной записи или пользовательские режимы ответа
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ru/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool и обнаружение действий
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ru/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, STT, медиа, субагент через api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/ru/plugins/sdk-channel-inbound">
    Общий жизненный цикл входящего события: прием, разрешение, запись, отправка, завершение
  </Card>
</CardGroup>

<Note>
Некоторые bundled вспомогательные швы все еще существуют для сопровождения bundled-плагинов и
совместимости. Это не рекомендуемый шаблон для новых плагинов каналов;
предпочитайте универсальные подпути channel/setup/reply/runtime из общей поверхности SDK,
если только вы не сопровождаете это семейство bundled-плагинов напрямую.
</Note>

## Следующие шаги

- [Плагины провайдеров](/ru/plugins/sdk-provider-plugins) - если ваш плагин также предоставляет модели
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов подпутей
- [Тестирование SDK](/ru/plugins/sdk-testing) - тестовые утилиты и контрактные тесты
- [Манифест плагина](/ru/plugins/manifest) - полная схема манифеста

## Связанные разделы

- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
- [Плагины agent harness](/ru/plugins/sdk-agent-harness)
