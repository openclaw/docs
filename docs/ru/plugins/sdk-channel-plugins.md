---
read_when:
    - Вы создаете новый Plugin канала обмена сообщениями
    - Вы хотите подключить OpenClaw к платформе обмена сообщениями
    - Вам нужно понять интерфейс адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Пошаговое руководство по созданию Plugin канала обмена сообщениями для OpenClaw
title: Создание Plugin для каналов
x-i18n:
    generated_at: "2026-06-28T23:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Это руководство показывает, как создать канальный Plugin, который подключает OpenClaw к
платформе обмена сообщениями. К концу у вас будет рабочий канал с безопасностью личных сообщений,
сопряжением, цепочками ответов и исходящими сообщениями.

<Info>
  Если вы еще не создавали Plugin для OpenClaw, сначала прочитайте
  [Начало работы](/ru/plugins/building-plugins), чтобы узнать базовую структуру пакета
  и настройку манифеста.
</Info>

## Как работают канальные Plugins

Канальным Plugins не нужны собственные инструменты отправки, редактирования или реакций. OpenClaw хранит один
общий инструмент `message` в core. Ваш Plugin отвечает за:

- **Конфигурация** - разрешение аккаунта и мастер настройки
- **Безопасность** - политика личных сообщений и списки разрешений
- **Сопряжение** - поток подтверждения в личных сообщениях
- **Грамматика сессий** - как идентификаторы бесед, специфичные для провайдера, сопоставляются с базовыми чатами, идентификаторами цепочек и родительскими fallback-вариантами
- **Исходящие сообщения** - отправка текста, медиа и опросов на платформу
- **Цепочки** - как ответы объединяются в цепочки
- **Heartbeat typing** - необязательные индикаторы набора/занятости для целей доставки Heartbeat

Core отвечает за общий инструмент сообщений, подключение prompt, внешнюю форму ключа сессии,
общий учет `:thread:` и диспетчеризацию.

Новые канальные Plugins также должны предоставлять адаптер `message` с помощью
`defineChannelMessageAdapter` из `openclaw/plugin-sdk/channel-outbound`. Адаптер
объявляет, какие устойчивые возможности финальной отправки фактически поддерживает нативный транспорт,
и направляет отправку текста/медиа в те же транспортные функции, что и устаревший адаптер
`outbound`. Объявляйте возможность только тогда, когда contract test
доказывает нативный побочный эффект и возвращенную квитанцию.
Полный контракт API, примеры, матрицу возможностей, правила квитанций, финализацию live preview,
политику подтверждений получения, тесты и таблицу миграции см. в
[API исходящих сообщений канала](/ru/plugins/sdk-channel-outbound).
Если существующий адаптер `outbound` уже имеет нужные методы отправки и
метаданные возможностей, используйте `createChannelMessageAdapterFromOutbound(...)`, чтобы
получить адаптер `message` вместо ручного написания еще одного моста.
Отправки адаптера должны возвращать значения `MessageReceipt`. Когда коду совместимости
по-прежнему нужны устаревшие идентификаторы, получайте их через `listMessageReceiptPlatformIds(...)`
или `resolveMessageReceiptPrimaryId(...)`, а не храните параллельные
поля `messageIds` в новом коде жизненного цикла.
Каналы с поддержкой preview также должны объявлять `message.live.capabilities` с
точным live-жизненным циклом, которым они владеют, например `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` или
`quietFinalization`. Каналы, которые финализируют черновой preview на месте, также должны
объявлять `message.live.finalizer.capabilities`, например `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` и
`retainOnAmbiguousFailure`, и направлять логику runtime через
`defineFinalizableLivePreviewAdapter(...)` плюс
`deliverWithFinalizableLivePreviewAdapter(...)`. Подкрепляйте эти возможности
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` и
`verifyChannelMessageLiveFinalizerProofs(...)`, чтобы поведение нативного preview,
progress, edit, fallback/retention, cleanup и receipt не могло незаметно разойтись.
Входящие приемники, которые откладывают подтверждения платформы, должны объявлять
`message.receive.defaultAckPolicy` и `supportedAckPolicies`, а не скрывать
тайминг ack в локальном состоянии монитора. Покройте каждую объявленную политику
с помощью `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Устаревшие помощники ответов, такие как `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` и `recordInboundSessionAndDispatchReply`,
остаются доступными для диспетчеров совместимости. Не используйте эти имена в новом
коде каналов; новые Plugins должны начинать с адаптера `message`, квитанций и
помощников жизненного цикла receive/send из `openclaw/plugin-sdk/channel-outbound`.

Каналы, мигрирующие входящую авторизацию, могут использовать экспериментальный
подпуть `openclaw/plugin-sdk/channel-ingress-runtime` из runtime-путей получения.
Подпуть оставляет поиск платформы и побочные эффекты в Plugin, при этом
разделяя разрешение состояния списков разрешений, решения route/sender/command/event/activation,
редактированную диагностику и сопоставление допуска turn. Держите нормализацию
идентичности Plugin в дескрипторе, который вы передаете resolver; не
сериализуйте сырые значения совпадений из разрешенного состояния или решения. См.
[API входящих сообщений канала](/ru/plugins/sdk-channel-ingress) для дизайна API,
границы владения и ожиданий к тестам.

Если ваш канал поддерживает индикаторы набора вне входящих ответов, предоставьте
`heartbeat.sendTyping(...)` в канальном Plugin. Core вызывает его с
разрешенной целью доставки Heartbeat до начала модельного запуска Heartbeat и
использует общий жизненный цикл keepalive/cleanup для индикатора набора. Добавьте `heartbeat.clearTyping(...)`,
когда платформе нужен явный сигнал остановки.

Если ваш канал добавляет параметры инструмента сообщений, которые несут источники медиа, предоставьте эти
имена параметров через `describeMessageTool(...).mediaSourceParams`. Core использует
этот явный список для нормализации путей sandbox и политики доступа к исходящим медиа,
поэтому Plugins не нужны специальные случаи в shared-core для специфичных для провайдера
параметров avatar, attachment или cover-image.
Предпочитайте возвращать map по ключам действий, например
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, чтобы несвязанные действия не
наследовали медиа-аргументы другого действия. Плоский массив по-прежнему работает для параметров, которые
намеренно общие для каждого предоставленного действия.
Каналы, которым нужно предоставить временный публичный URL для получения медиа на стороне платформы,
могут использовать `createHostedOutboundMediaStore(...)` из
`openclaw/plugin-sdk/outbound-media` с хранилищами состояния Plugin. Держите
разбор маршрутов платформы и проверку токенов в канальном Plugin; общий помощник
отвечает только за загрузку медиа, метаданные истечения срока действия, строки фрагментов и очистку.

Если вашему каналу нужно специфичное для провайдера формирование для `message(action="send")`,
предпочитайте `actions.prepareSendPayload(...)`. Помещайте нативные cards, blocks, embeds или
другие устойчивые данные в `payload.channelData.<channel>` и позвольте core выполнить
фактическую отправку через адаптер outbound/message. Используйте
`actions.handleAction(...)` для отправки только как fallback совместимости для
payloads, которые нельзя сериализовать и повторить.

Если ваша платформа хранит дополнительную область внутри идентификаторов бесед, оставьте этот разбор
в Plugin с `messaging.resolveSessionConversation(...)`. Это
канонический hook для сопоставления `rawId` с базовым идентификатором беседы, необязательным идентификатором цепочки,
явным `baseConversationId` и любыми `parentConversationCandidates`.
Когда вы возвращаете `parentConversationCandidates`, держите их упорядоченными от
самого узкого родителя к самой широкой/базовой беседе.

Используйте `openclaw/plugin-sdk/channel-route`, когда коду Plugin нужно нормализовать
поля, похожие на маршруты, сравнить дочернюю цепочку с ее родительским маршрутом или построить
стабильный ключ дедупликации из `{ channel, to, accountId, threadId }`. Помощник
нормализует числовые идентификаторы цепочек так же, как это делает core, поэтому Plugins должны предпочитать
его ad hoc-сравнениям `String(threadId)`.
Plugins с целевой грамматикой, специфичной для провайдера, должны предоставлять
`messaging.resolveOutboundSessionRoute(...)`, чтобы core получал нативную для провайдера
идентичность сессии и цепочки без parser shims.

Bundled Plugins, которым нужен тот же разбор до запуска реестра каналов,
также могут предоставлять файл верхнего уровня `session-key-api.ts` с соответствующим
экспортом `resolveSessionConversation(...)`. Core использует эту bootstrap-safe поверхность
только когда runtime-реестр Plugins еще недоступен.

`messaging.resolveParentConversationCandidates(...)` остается доступным как
устаревший fallback совместимости, когда Plugin нужны только родительские fallback-варианты поверх
общего/сырого идентификатора. Если существуют оба hook, core сначала использует
`resolveSessionConversation(...).parentConversationCandidates` и переходит к
`resolveParentConversationCandidates(...)` только когда канонический hook
их опускает.

## Подтверждения и возможности каналов

Большинству канальных Plugins не нужен код, специфичный для подтверждений.

- Ядро владеет `/approve` в том же чате, общими payload утверждений для кнопок и универсальной fallback-доставкой.
- Предпочитайте один объект `approvalCapability` в канальном Plugin, когда каналу требуется поведение, специфичное для утверждений.
- `ChannelPlugin.approvals` удален. Размещайте факты доставки/нативного отображения/render/auth для утверждений в `approvalCapability`.
- `plugin.auth` предназначен только для входа/выхода; ядро больше не читает auth-хуки утверждений из этого объекта.
- `approvalCapability.authorizeActorAction` и `approvalCapability.getActionAvailabilityState` являются каноничным seam для auth утверждений.
- Используйте `approvalCapability.getActionAvailabilityState` для доступности auth утверждений в том же чате.
- Если ваш канал предоставляет нативные утверждения exec, используйте `approvalCapability.getExecInitiatingSurfaceState` для состояния инициирующей поверхности/нативного клиента, когда оно отличается от auth утверждений в том же чате. Ядро использует этот exec-специфичный хук, чтобы различать `enabled` и `disabled`, решать, поддерживает ли инициирующий канал нативные утверждения exec, и включать канал в подсказки fallback для нативного клиента. `createApproverRestrictedNativeApprovalCapability(...)` заполняет это для обычного случая.
- Используйте `outbound.shouldSuppressLocalPayloadPrompt` или `outbound.beforeDeliverPayload` для поведения жизненного цикла payload, специфичного для канала, например скрытия дублирующихся локальных запросов утверждения или отправки индикаторов набора перед доставкой.
- Используйте `approvalCapability.delivery` только для нативной маршрутизации утверждений или подавления fallback.
- Используйте `approvalCapability.nativeRuntime` для принадлежащих каналу нативных фактов утверждений. Оставляйте его ленивым на горячих entrypoint канала с помощью `createLazyChannelApprovalNativeRuntimeAdapter(...)`, который может импортировать ваш runtime-модуль по требованию, при этом позволяя ядру собирать жизненный цикл утверждения.
- Используйте `approvalCapability.render` только когда каналу действительно нужны пользовательские payload утверждений вместо общего renderer.
- Используйте `approvalCapability.describeExecApprovalSetup`, когда канал хочет, чтобы ответ для отключенного пути объяснял точные параметры конфигурации, необходимые для включения нативных утверждений exec. Хук получает `{ channel, channelLabel, accountId }`; каналы с именованными аккаунтами должны отображать пути в области аккаунта, например `channels.<channel>.accounts.<id>.execApprovals.*`, вместо верхнеуровневых значений по умолчанию.
- Если канал может вывести стабильные DM-идентичности, похожие на владельцев, из существующей конфигурации, используйте `createResolvedApproverActionAuthAdapter` из `openclaw/plugin-sdk/approval-runtime`, чтобы ограничить `/approve` в том же чате без добавления логики ядра, специфичной для утверждений.
- Если пользовательский auth утверждений намеренно разрешает только same-chat fallback, возвращайте `markImplicitSameChatApprovalAuthorization({ authorized: true })` из `openclaw/plugin-sdk/approval-auth-runtime`; иначе ядро трактует результат как явную авторизацию утверждающего.
- Если принадлежащий каналу нативный callback напрямую разрешает утверждения, используйте `isImplicitSameChatApprovalAuthorization(...)` перед разрешением, чтобы неявный fallback все равно проходил через обычную авторизацию actor канала.
- Если каналу нужна нативная доставка утверждений, держите код канала сфокусированным на нормализации target и фактах транспорта/представления. Используйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` и `createApproverRestrictedNativeApprovalCapability` из `openclaw/plugin-sdk/approval-runtime`. Помещайте факты, специфичные для канала, за `approvalCapability.nativeRuntime`, в идеале через `createChannelApprovalNativeRuntimeAdapter(...)` или `createLazyChannelApprovalNativeRuntimeAdapter(...)`, чтобы ядро могло собрать handler и владеть фильтрацией запросов, маршрутизацией, дедупликацией, истечением срока, подпиской Gateway и уведомлениями о маршрутизации в другое место. `nativeRuntime` разделен на несколько меньших seams:
- Используйте `createNativeApprovalChannelRouteGates` из `openclaw/plugin-sdk/approval-native-runtime`, когда канал поддерживает и нативную доставку из session-origin, и явные цели пересылки утверждений. Helper централизует выбор конфигурации утверждений, обработку `mode`, фильтры agent/session, привязку аккаунта, сопоставление session-target и сопоставление списка targets, при этом вызывающие стороны по-прежнему владеют id канала, режимом пересылки по умолчанию, lookup аккаунта, проверкой включенного транспорта, нормализацией target и разрешением turn-source target. Не используйте его для создания принадлежащих ядру политик канала по умолчанию; передавайте документированный режим по умолчанию канала явно.
- `createChannelNativeOriginTargetResolver` по умолчанию использует общий matcher маршрутов канала для targets `{ to, accountId, threadId }`. Передавайте `targetsMatch` только когда у канала есть правила эквивалентности, специфичные для provider, например сопоставление префикса timestamp в Slack.
- Передавайте `normalizeTargetForMatch` в `createChannelNativeOriginTargetResolver`, когда каналу нужно канонизировать provider ids перед запуском стандартного matcher маршрутов или пользовательского callback `targetsMatch`, сохраняя исходный target для доставки. Используйте `normalizeTarget` только когда сам разрешенный target доставки должен быть канонизирован.
- `availability` - настроен ли аккаунт и должен ли запрос обрабатываться
- `presentation` - отображение общей view model утверждения в ожидающие/разрешенные/истекшие нативные payload или финальные действия
- `transport` - подготовка targets и отправка/обновление/удаление нативных сообщений утверждения
- `interactions` - необязательные хуки bind/unbind/clear-action для нативных кнопок или реакций, плюс необязательный хук `cancelDelivered`. Реализуйте `cancelDelivered`, когда `deliverPending` регистрирует внутрипроцессное или постоянное состояние (например, хранилище target реакций), чтобы это состояние можно было освободить, если остановка handler отменяет доставку до запуска `bindPending` или когда `bindPending` не возвращает handle
- `observe` - необязательные хуки диагностики доставки
- Если каналу нужны runtime-объекты, такие как client, token, Bolt app или webhook receiver, регистрируйте их через `openclaw/plugin-sdk/channel-runtime-context`. Универсальный registry runtime-context позволяет ядру bootstrap-ить handlers на основе capabilities из startup-состояния канала без добавления wrapper-glue, специфичного для утверждений.
- Обращайтесь к более низкоуровневым `createChannelApprovalHandler` или `createChannelNativeApprovalRuntime` только когда seam на основе capability пока недостаточно выразителен.
- Нативные каналы утверждений должны маршрутизировать и `accountId`, и `approvalKind` через эти helpers. `accountId` удерживает политику утверждений для нескольких аккаунтов в области правильного bot account, а `approvalKind` сохраняет доступность поведения утверждений exec и Plugin для канала без захардкоженных ветвлений в ядре.
- Теперь ядро также владеет уведомлениями о перемаршрутизации утверждений. Канальные Plugins не должны отправлять собственные follow-up сообщения "утверждение ушло в DM / другой канал" из `createChannelNativeApprovalRuntime`; вместо этого раскрывайте точную маршрутизацию origin + approver-DM через общие helpers capability утверждений и позволяйте ядру агрегировать фактические доставки перед публикацией любого уведомления обратно в инициирующий чат.
- Сохраняйте kind доставленного approval id сквозным образом. Нативные клиенты не должны
  угадывать или переписывать маршрутизацию утверждений exec и Plugin из локального состояния канала.
- Разные kinds утверждений могут намеренно предоставлять разные нативные поверхности.
  Текущие встроенные примеры:
  - Slack сохраняет нативную маршрутизацию утверждений доступной и для exec, и для Plugin ids.
  - Matrix сохраняет одинаковую нативную маршрутизацию DM/канала и UX реакций для утверждений exec
    и Plugin, при этом все еще позволяя auth отличаться по kind утверждения.
- `createApproverRestrictedNativeApprovalAdapter` все еще существует как wrapper совместимости, но новый код должен предпочитать builder capability и раскрывать `approvalCapability` в Plugin.

Для горячих entrypoint канала предпочитайте более узкие runtime subpaths, когда вам нужна только
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
  `createSetupTranslator`, import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вывод lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` и делегированные
  builders setup-proxy
- `openclaw/plugin-sdk/setup-runtime` включает env-aware adapter seam для
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` покрывает builders setup для optional-install
  плюс несколько setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Если ваш канал поддерживает setup или auth на основе env, а универсальные startup/config
flows должны знать эти имена env до загрузки runtime, объявите их в
манифесте Plugin через `channelEnvVars`. Оставляйте runtime `envVars` канала или локальные
константы только для copy, обращенной к операторам.

Если ваш канал может появляться в `status`, `channels list`, `channels status` или
сканированиях SecretRef до запуска runtime Plugin, добавьте `openclaw.setupEntry` в
`package.json`. Этот entrypoint должен быть безопасен для импорта в command
paths только для чтения и должен возвращать метаданные канала, setup-safe config adapter, status
adapter и метаданные secret target канала, необходимые для этих сводок. Не
запускайте clients, listeners или transport runtimes из setup entry.

Сохраняйте основной import path entry канала тоже узким. Discovery может оценить
entry и модуль канального Plugin, чтобы зарегистрировать capabilities без активации
канала. Файлы вроде `channel-plugin-api.ts` должны экспортировать объект канального
Plugin без импорта setup wizards, transport clients, socket
listeners, subprocess launchers или service startup modules. Помещайте эти runtime
части в модули, загружаемые из `registerFull(...)`, runtime setters или lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` и
`splitSetupEntries`

- используйте более широкий seam `openclaw/plugin-sdk/setup` только когда вам также нужны
  более тяжелые общие helpers setup/config, такие как
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Если ваш канал хочет только рекламировать "сначала установите этот Plugin" в setup
surfaces, предпочитайте `createOptionalChannelSetupSurface(...)`. Сгенерированные
adapter/wizard fail closed при config writes и finalization, и они повторно используют
одно и то же сообщение install-required в validation, finalize и copy docs-link.

Для других горячих путей канала предпочитайте узкие helpers более широким legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` и
  `openclaw/plugin-sdk/account-helpers` для конфигурации нескольких аккаунтов и
  отката к аккаунту по умолчанию
- `openclaw/plugin-sdk/inbound-envelope` и
  `openclaw/plugin-sdk/channel-inbound` для входящего маршрута/конверта и
  связки записи и диспетчеризации
- `openclaw/plugin-sdk/channel-targets` для вспомогательных функций разбора целей
- `openclaw/plugin-sdk/outbound-media` для загрузки медиа и
  `openclaw/plugin-sdk/channel-outbound` для делегатов исходящей идентификации/отправки
  и планирования полезной нагрузки
- `buildThreadAwareOutboundSessionRoute(...)` из
  `openclaw/plugin-sdk/channel-core`, когда исходящий маршрут должен сохранить
  явный `replyToId`/`threadId` или восстановить текущую сессию `:thread:`
  после того, как базовый ключ сессии все еще совпадает. Provider plugins могут переопределять
  приоритет, поведение суффиксов и нормализацию идентификатора треда, когда у их платформы
  есть нативная семантика доставки в треды.
- `openclaw/plugin-sdk/thread-bindings-runtime` для жизненного цикла привязок тредов
  и регистрации адаптера
- `openclaw/plugin-sdk/agent-media-payload` только когда все еще требуется устаревшая
  структура полей полезной нагрузки агент/медиа
- `openclaw/plugin-sdk/telegram-command-config` для нормализации пользовательских команд
  Telegram, проверки дубликатов/конфликтов и контракта конфигурации команд со стабильным откатом

Каналы только для аутентификации обычно могут остановиться на пути по умолчанию: ядро обрабатывает подтверждения, а Plugin лишь предоставляет исходящие возможности и возможности аутентификации. Нативные каналы подтверждений, такие как Matrix, Slack, Telegram и пользовательские чат-транспорты, должны использовать общие нативные вспомогательные функции вместо реализации собственного жизненного цикла подтверждений.

## Политика входящих упоминаний

Держите обработку входящих упоминаний разделенной на два слоя:

- сбор доказательств, принадлежащий Plugin
- оценка общей политики

Используйте `openclaw/plugin-sdk/channel-mention-gating` для решений политики упоминаний.
Используйте `openclaw/plugin-sdk/channel-inbound` только когда нужен более широкий barrel входящих
вспомогательных функций.

Хорошо подходит для локальной логики Plugin:

- обнаружение ответа боту
- обнаружение цитирования бота
- проверки участия в треде
- исключения служебных/системных сообщений
- платформенно-нативные кэши, нужные для подтверждения участия бота

Хорошо подходит для общего вспомогательного модуля:

- `requireMention`
- результат явного упоминания
- allowlist неявных упоминаний
- обход команды
- окончательное решение о пропуске

Предпочтительный поток:

1. Вычислите локальные факты упоминания.
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
встроенных канальных plugins, которые уже зависят от инъекции runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Если вам нужны только `implicitMentionKindWhen` и
`resolveInboundMentionDecision`, импортируйте из
`openclaw/plugin-sdk/channel-mention-gating`, чтобы не загружать несвязанные входящие
вспомогательные функции runtime.

Используйте `resolveInboundMentionDecision({ facts, policy })` для шлюза упоминаний.

## Пошаговое руководство

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет и манифест">
    Создайте стандартные файлы Plugin. Поле `channel` в `package.json` —
    это то, что делает его канальным Plugin. Полную поверхность метаданных пакета
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

    `configSchema` проверяет `plugins.entries.acme-chat.config`. Используйте его для
    настроек, принадлежащих Plugin, которые не являются конфигурацией аккаунта канала. `channelConfigs`
    проверяет `channels.acme-chat` и является источником холодного пути, используемым поверхностями
    схемы конфигурации, настройки и UI до загрузки runtime Plugin.

  </Step>

  <Step title="Соберите объект канального Plugin">
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

    Для каналов, которые принимают как канонические DM-ключи верхнего уровня, так и устаревшие вложенные ключи, используйте вспомогательные функции из `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` и `normalizeChannelDmPolicy` сохраняют локальные для аккаунта значения перед унаследованными корневыми значениями. Свяжите тот же resolver с исправлением doctor через `normalizeLegacyDmAliases`, чтобы runtime и миграция читали один и тот же контракт.

    <Accordion title="Что createChatChannelPlugin делает за вас">
      Вместо ручной реализации низкоуровневых интерфейсов адаптеров вы передаете
      декларативные параметры, а builder компонует их:

      | Параметр | Что подключает |
      | --- | --- |
      | `security.dm` | Scoped resolver безопасности DM из полей конфигурации |
      | `pairing.text` | Текстовый поток DM-сопряжения с обменом кодом |
      | `threading` | Resolver режима ответа (фиксированный, привязанный к аккаунту или пользовательский) |
      | `outbound.attachedResults` | Функции отправки, возвращающие метаданные результата (идентификаторы сообщений) |

      Вы также можете передать необработанные объекты адаптеров вместо декларативных параметров,
      если вам нужен полный контроль.

      Необработанные исходящие адаптеры могут определять функцию `chunker(text, limit, ctx)`.
      Необязательный `ctx.formatting` несет решения форматирования на момент доставки,
      такие как `maxLinesPerMessage`; применяйте их перед отправкой, чтобы трединг ответов
      и границы фрагментов были один раз разрешены общей исходящей доставкой.
      Контексты отправки также включают `replyToIdSource` (`implicit` или `explicit`),
      когда нативная цель ответа была разрешена, чтобы вспомогательные функции полезной нагрузки могли сохранять
      явные теги ответа, не потребляя неявный одноразовый слот ответа.
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
    мог показывать их в корневой справке без активации полного runtime канала,
    при этом обычные полные загрузки по-прежнему будут получать те же дескрипторы для реальной
    регистрации команд. Оставьте `registerFull(...)` для работы, относящейся только к runtime.
    Если `registerFull(...)` регистрирует методы RPC Gateway, используйте
    префикс, специфичный для Plugin. Пространства имен администрирования ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) остаются зарезервированными и всегда
    разрешаются в `operator.admin`.
    `defineChannelPluginEntry` автоматически обрабатывает разделение режимов регистрации. См.
    [Точки входа](/ru/plugins/sdk-entrypoints#definechannelpluginentry) для всех
    вариантов.

  </Step>

  <Step title="Добавьте точку входа настройки">
    Создайте `setup-entry.ts` для облегченной загрузки во время онбординга:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw загружает ее вместо полной точки входа, когда канал отключен
    или не настроен. Это позволяет не подтягивать тяжелый код runtime во время потоков настройки.
    Подробности см. в [Настройка и конфигурация](/ru/plugins/sdk-setup#setup-entry).

    Каналы из комплектного рабочего пространства, которые выносят безопасные для настройки экспорты в боковые
    модули, могут использовать `defineBundledChannelSetupEntry(...)` из
    `openclaw/plugin-sdk/channel-entry-contract`, когда им также нужен
    явный setter runtime на этапе настройки.

  </Step>

  <Step title="Обработайте входящие сообщения">
    Ваш Plugin должен получать сообщения с платформы и пересылать их в
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
      Обработка входящих сообщений зависит от канала. Каждый Plugin канала владеет
      собственным входящим конвейером. Посмотрите комплектные Plugins каналов
      (например, пакет Plugin Microsoft Teams или Google Chat) для реальных шаблонов.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Протестируйте">
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

    Общие вспомогательные средства для тестов см. в [Тестирование](/ru/plugins/sdk-testing).

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

## Продвинутые темы

<CardGroup cols={2}>
  <Card title="Параметры потоков" icon="git-branch" href="/ru/plugins/sdk-entrypoints#registration-mode">
    Фиксированные, привязанные к учетной записи или пользовательские режимы ответа
  </Card>
  <Card title="Интеграция инструмента сообщений" icon="puzzle" href="/ru/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool и обнаружение действий
  </Card>
  <Card title="Разрешение цели" icon="crosshair" href="/ru/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Вспомогательные средства runtime" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, STT, медиа, subagent через api.runtime
  </Card>
  <Card title="API входящих событий канала" icon="bolt" href="/ru/plugins/sdk-channel-inbound">
    Общий жизненный цикл входящего события: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Некоторые комплектные вспомогательные seams все еще существуют для поддержки комплектных Plugins
и совместимости. Это не рекомендуемый шаблон для новых Plugins каналов;
предпочитайте универсальные подпути channel/setup/reply/runtime из общей поверхности SDK,
если вы не поддерживаете это семейство комплектных Plugins напрямую.
</Note>

## Следующие шаги

- [Provider Plugins](/ru/plugins/sdk-provider-plugins) - если ваш Plugin также предоставляет модели
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов подпутей
- [Тестирование SDK](/ru/plugins/sdk-testing) - утилиты тестирования и контрактные тесты
- [Манифест Plugin](/ru/plugins/manifest) - полная схема манифеста

## Связанные материалы

- [Настройка SDK Plugin](/ru/plugins/sdk-setup)
- [Создание Plugins](/ru/plugins/building-plugins)
- [Plugins harness агента](/ru/plugins/sdk-agent-harness)
