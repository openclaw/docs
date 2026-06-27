---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin для каналів
x-i18n:
    generated_at: "2026-06-27T18:03:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник показує, як створити Plugin каналу, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із
безпекою прямих повідомлень, спарюванням, гілкуванням відповідей і вихідними
повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють Plugin-и каналів

Plugin-и каналів не потребують власних інструментів надсилання, редагування чи реакцій. OpenClaw зберігає один
спільний інструмент `message` у ядрі. Ваш Plugin відповідає за:

- **Конфігурація** - визначення облікового запису та майстер налаштування
- **Безпека** - політика прямих повідомлень і списки дозволених
- **Спарювання** - потік схвалення через прямі повідомлення
- **Граматика сесії** - як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і батьківськими резервними варіантами
- **Вихідні повідомлення** - надсилання тексту, медіа та опитувань на платформу
- **Гілкування** - як відповіді організуються в гілки
- **Індикатор набору Heartbeat** - необов'язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Нові Plugin-и каналів також мають надавати адаптер `message` через
`defineChannelMessageAdapter` з `openclaw/plugin-sdk/channel-outbound`. Адаптер
оголошує, які довговічні можливості фінального надсилання фактично підтримує
нативний транспорт, і спрямовує надсилання тексту/медіа до тих самих транспортних
функцій, що й застарілий адаптер `outbound`. Оголошуйте можливість лише тоді,
коли контрактний тест доводить нативний побічний ефект і повернену квитанцію.
Повний контракт API, приклади, матрицю можливостей, правила квитанцій, фіналізацію
попереднього перегляду наживо, політику підтверджень отримання, тести та таблицю
міграції дивіться в розділі
[API вихідних повідомлень каналу](/uk/plugins/sdk-channel-outbound).
Якщо наявний адаптер `outbound` уже має правильні методи надсилання та
метадані можливостей, використовуйте `createChannelMessageAdapterFromOutbound(...)`,
щоб отримати адаптер `message`, замість того щоб вручну писати ще один міст.
Надсилання через адаптер мають повертати значення `MessageReceipt`. Коли коду
сумісності все ще потрібні застарілі ідентифікатори, отримуйте їх через
`listMessageReceiptPlatformIds(...)` або `resolveMessageReceiptPrimaryId(...)`,
замість того щоб зберігати паралельні поля `messageIds` у новому коді життєвого циклу.
Канали з підтримкою попереднього перегляду також мають оголошувати
`message.live.capabilities` із точним життєвим циклом наживо, яким вони володіють,
наприклад `draftPreview`, `previewFinalization`, `progressUpdates`,
`nativeStreaming` або `quietFinalization`. Канали, які фіналізують чернетку
попереднього перегляду на місці, також мають оголошувати
`message.live.finalizer.capabilities`, наприклад `finalEdit`, `normalFallback`,
`discardPending`, `previewReceipt` і `retainOnAmbiguousFailure`, та спрямовувати
логіку виконання через `defineFinalizableLivePreviewAdapter(...)` разом із
`deliverWithFinalizableLivePreviewAdapter(...)`. Підкріплюйте ці можливості
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` і
`verifyChannelMessageLiveFinalizerProofs(...)`, щоб поведінка нативного
попереднього перегляду, прогресу, редагування, резервного варіанта/утримання,
очищення та квитанцій не могла непомітно розійтися.
Вхідні приймачі, які відкладають підтвердження платформи, мають оголошувати
`message.receive.defaultAckPolicy` і `supportedAckPolicies`, замість того щоб
ховати час підтвердження в локальному стані монітора. Покрийте кожну оголошену
політику через `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Застарілі допоміжні засоби відповідей, як-от `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` і `recordInboundSessionAndDispatchReply`,
залишаються доступними для диспетчерів сумісності. Не використовуйте ці назви
для нового коду каналу; нові Plugin-и мають починати з адаптера `message`,
квитанцій і допоміжних засобів життєвого циклу отримання/надсилання з
`openclaw/plugin-sdk/channel-outbound`.

Канали, що мігрують вхідну авторизацію, можуть використовувати експериментальний
підшлях `openclaw/plugin-sdk/channel-ingress-runtime` з runtime-шляхів отримання.
Підшлях залишає пошук платформи та побічні ефекти в Plugin, водночас надаючи
спільне визначення стану списку дозволених, рішення щодо маршруту/відправника/команди/події/активації,
редаговану діагностику та зіставлення допуску до ходу. Зберігайте нормалізацію
ідентичності Plugin у дескрипторі, який передаєте до резолвера; не серіалізуйте
сирі значення збігу з визначеного стану чи рішення. Дивіться
[API входу каналу](/uk/plugins/sdk-channel-ingress), щоб ознайомитися з дизайном API,
межею відповідальності та очікуваннями до тестів.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у Plugin каналу. Ядро викликає його з визначеною
ціллю доставки Heartbeat перед запуском моделі Heartbeat і використовує спільний
життєвий цикл підтримання/очищення індикатора набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, що переносять джерела медіа, надайте
назви цих параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації sandbox-шляхів і політики доступу до вихідних медіа,
тому Plugin-и не потребують спеціальних випадків у спільному ядрі для специфічних для
провайдера параметрів аватара, вкладення чи зображення обкладинки.
Надавайте перевагу поверненню мапи за ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов'язані дії не
успадковували медіааргументи іншої дії. Плоский масив усе ще працює для параметрів,
які навмисно спільні для кожної наданої дії.
Канали, яким потрібно надати тимчасову публічну URL-адресу для отримання медіа
на стороні платформи, можуть використовувати `createHostedOutboundMediaStore(...)` з
`openclaw/plugin-sdk/outbound-media` зі сховищами стану Plugin. Залишайте розбір
маршрутів платформи та перевірку токенів у Plugin каналу; спільний допоміжний засіб
відповідає лише за завантаження медіа, метадані строку дії, рядки чанків і очищення.

Якщо вашому каналу потрібне специфічне для провайдера формування для `message(action="send")`,
надавайте перевагу `actions.prepareSendPayload(...)`. Розміщуйте нативні картки, блоки,
вбудовані об'єкти або інші довговічні дані в `payload.channelData.<channel>` і дозвольте
ядру виконати фактичне надсилання через адаптер outbound/message. Використовуйте
`actions.handleAction(...)` для надсилання лише як резервний варіант сумісності для
payload-ів, які неможливо серіалізувати й повторити.

Якщо ваша платформа зберігає додаткову область дії всередині ідентифікаторів розмов,
залишайте цей розбір у Plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний hook для зіставлення `rawId` з базовим ідентифікатором розмови,
необов'язковим ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`. Коли повертаєте `parentConversationCandidates`,
зберігайте їх упорядкованими від найвужчого батьківського елемента до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірню гілку з її батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Допоміжний засіб
нормалізує числові ідентифікатори гілок так само, як це робить ядро, тому Plugin-и мають
надавати йому перевагу над ситуативними порівняннями `String(threadId)`.
Plugin-и зі специфічною для провайдера граматикою цілей мають надавати
`messaging.resolveOutboundSessionRoute(...)`, щоб ядро отримувало нативну для провайдера
ідентичність сесії та гілки без використання parser shim-ів.

Вбудовані Plugin-и, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю bootstrap-безпечну поверхню
лише тоді, коли runtime-реєстр Plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли Plugin потребує лише батьківських
резервних варіантів поверх загального/сирого ідентифікатора. Якщо існують обидва hook-и,
ядро спершу використовує `resolveSessionConversation(...).parentConversationCandidates` і лише
потім повертається до `resolveParentConversationCandidates(...)`, коли канонічний hook
їх не надає.

## Схвалення та можливості каналу

Більшість Plugin-ів каналів не потребують коду, специфічного для схвалень.

- Core відповідає за `/approve` у тому самому чаті, спільні корисні навантаження кнопок схвалення та загальне резервне доставлення.
- Надавайте перевагу одному об’єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для схвалень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставлення/нативність/рендеринг/авторизацію схвалень у `approvalCapability`.
- `plugin.auth` призначений лише для входу/виходу; Core більше не читає хуки авторизації схвалень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним стиком авторизації схвалень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності авторизації схвалень у тому самому чаті.
- Якщо ваш канал надає нативні схвалення exec, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану ініціювальної поверхні/нативного клієнта, коли він відрізняється від авторизації схвалень у тому самому чаті. Core використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, вирішувати, чи підтримує ініціювальний канал нативні схвалення exec, і включати канал до резервних підказок для нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу корисного навантаження, як-от приховування дубльованих локальних запитів схвалення або надсилання індикаторів набору перед доставленням.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних схвалень або пригнічення резервного шляху.
- Використовуйте `approvalCapability.nativeRuntime` для нативних фактів схвалення, що належать каналу. Тримайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль runtime на вимогу й водночас дозволяє Core зібрати життєвий цикл схвалення.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні корисні навантаження схвалення замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних схвалень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи в межах облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Якщо канал може вивести стабільні DM-ідентичності, подібні до власника, з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для схвалень логіки в Core.
- Якщо власна авторизація схвалень навмисно дозволяє лише резервний шлях у тому самому чаті, повертайте `markImplicitSameChatApprovalAuthorization({ authorized: true })` з `openclaw/plugin-sdk/approval-auth-runtime`; інакше Core трактує результат як явну авторизацію схвалювача.
- Якщо нативний callback, що належить каналу, напряму розв’язує схвалення, використовуйте `isImplicitSameChatApprovalAuthorization(...)` перед розв’язанням, щоб неявний резервний шлях усе одно проходив через звичайну авторизацію актора каналу.
- Якщо каналу потрібне нативне доставлення схвалень, зосередьте код каналу на нормалізації цілі та фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб Core міг зібрати handler і володіти фільтрацією запитів, маршрутизацією, дедуплікацією, завершенням терміну дії, підпискою Gateway і сповіщеннями про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших стиків:
- Використовуйте `createNativeApprovalChannelRouteGates` з `openclaw/plugin-sdk/approval-native-runtime`, коли канал підтримує і нативне доставлення з джерела сесії, і явні цілі переспрямування схвалень. Helper централізує вибір конфігурації схвалень, обробку `mode`, фільтри агентів/сесій, прив’язку облікового запису, зіставлення цілі сесії та зіставлення списку цілей, тоді як callers і далі володіють id каналу, стандартним режимом переспрямування, пошуком облікового запису, перевіркою ввімкненого транспорту, нормалізацією цілі та розв’язанням цілі джерела turn. Не використовуйте його для створення defaults політики каналу, що належать Core; передавайте задокументований стандартний режим каналу явно.
- `createChannelNativeOriginTargetResolver` за замовчуванням використовує спільний matcher маршрутів каналу для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має специфічні для провайдера правила еквівалентності, як-от зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати id провайдера перед запуском стандартного matcher маршрутів або власного callback `targetsMatch`, зберігаючи оригінальну ціль для доставлення. Використовуйте `normalizeTarget` лише тоді, коли сама розв’язана ціль доставлення має бути канонізована.
- `availability` - чи налаштований обліковий запис і чи має оброблятися запит
- `presentation` - відображає спільну модель подання схвалення в нативні корисні навантаження pending/resolved/expired або фінальні дії
- `transport` - готує цілі та надсилає/оновлює/видаляє нативні повідомлення схвалення
- `interactions` - необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій, а також необов’язковий хук `cancelDelivered`. Реалізуйте `cancelDelivered`, коли `deliverPending` реєструє in-process або постійний стан (наприклад, сховище цілей реакцій), щоб цей стан можна було звільнити, якщо зупинка handler скасовує доставлення до запуску `bindPending` або коли `bindPending` не повертає handle
- `observe` - необов’язкові хуки діагностики доставлення
- Якщо каналу потрібні об’єкти, що належать runtime, як-от клієнт, token, Bolt app або receiver Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний registry runtime-context дозволяє Core bootstrap handlers на основі capability зі стартового стану каналу без додавання специфічного для схвалень wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли стик на основі capability ще недостатньо виразний.
- Канали нативних схвалень мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` утримує політику схвалень для кількох облікових записів у межах правильного облікового запису bot, а `approvalKind` залишає поведінку схвалень exec і plugin доступною каналу без жорстко закодованих branches у Core.
- Core тепер також володіє сповіщеннями про reroute схвалень. Plugins каналів не повинні надсилати власні follow-up повідомлення "схвалення пішло в DMs / інший канал" з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helpers capability схвалень і дозвольте Core агрегувати фактичні доставлення перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте тип доставленого id схвалення наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію схвалень exec і plugin зі стану, локального для каналу.
- Різні типи схвалень можуть навмисно надавати різні нативні поверхні.
  Поточні bundled приклади:
  - Slack зберігає нативну маршрутизацію схвалень доступною і для exec, і для plugin ids.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для exec
    і схвалень plugin, водночас дозволяючи авторизації відрізнятися за типом схвалення.
- `createApproverRestrictedNativeApprovalAdapter` досі існує як wrapper сумісності, але новий код має надавати перевагу builder capability і відкривати `approvalCapability` на plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
одна частина цієї сім’ї:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Так само надавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша парасолькова
поверхня.

Спеціально для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe helpers setup:
  `createSetupTranslator`, import-safe adapters patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builders setup-proxy
- `openclaw/plugin-sdk/setup-runtime` включає env-aware adapter seam для
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builders setup для optional-install
  плюс кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env і загальні startup/config
flows мають знати ці env names до завантаження runtime, оголосіть їх у
маніфесті plugin через `channelEnvVars`. Залишайте runtime `envVars` каналу або локальні
константи лише для тексту, зверненого до операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску runtime plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в read-only command
paths і має повертати метадані каналу, setup-safe config adapter, status
adapter і метадані цілей секретів каналу, потрібні для цих summary. Не
запускайте clients, listeners або transport runtimes із setup entry.

Також тримайте основний шлях імпорту точки входу каналу вузьким. Discovery може оцінити
entry і модуль plugin каналу, щоб зареєструвати capabilities без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт plugin
каналу без імпорту setup wizards, transport clients, socket
listeners, subprocess launchers або service startup modules. Розміщуйте ці runtime
частини в modules, завантажених із `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший стик `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helpers setup/config, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати "спочатку встановіть цей plugin" у setup
surfaces, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
adapter/wizard fail closed під час записів конфігурації та finalization, і вони повторно використовують
те саме повідомлення install-required у validation, finalize і docs-link
copy.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helpers над ширшими legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` та
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових записів і
  резервного вибору облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/channel-inbound` для вхідного маршруту/конверта та
  зв’язування запису й диспетчеризації
- `openclaw/plugin-sdk/channel-targets` для допоміжних засобів розбору цілей
- `openclaw/plugin-sdk/outbound-media` для завантаження медіа та
  `openclaw/plugin-sdk/channel-outbound` для делегатів вихідної ідентичності/надсилання
  і планування корисного навантаження
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Provider plugins можуть перевизначати
  пріоритет, поведінку суфікса та нормалізацію ідентифікатора потоку, коли їхня платформа
  має нативну семантику доставлення потоків.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  і реєстрації адаптера
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли застаріле компонування поля
  корисного навантаження агента/медіа все ще потрібне
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  перевірки дублікатів/конфліктів і контракту конфігурації команд зі стабільним резервним варіантом

Канали лише для автентифікації зазвичай можуть обмежитися типовим шляхом: core обробляє схвалення, а Plugin просто надає вихідні можливості та можливості автентифікації. Нативні канали схвалення, як-от Matrix, Slack, Telegram, і користувацькі чат-транспорти мають використовувати спільні нативні допоміжні засоби замість створення власного життєвого циклу схвалення.

## Політика вхідних згадок

Тримайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, яким володіє Plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший barrel
вхідних допоміжних засобів.

Добре підходить для локальної логіки Plugin:

- виявлення відповіді боту
- виявлення цитування бота
- перевірки участі в потоці
- виключення службових/системних повідомлень
- нативні кеші платформи, потрібні для доведення участі бота

Добре підходить для спільного допоміжного засобу:

- `requireMention`
- результат явної згадки
- список дозволених неявних згадок
- обхід команд
- остаточне рішення про пропуск

Бажаний потік:

1. Обчисліть локальні факти згадки.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому вхідному шлюзі.

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

`api.runtime.channel.mentions` надає ті самі спільні допоміжні засоби згадок для
вбудованих channel plugins, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження непов’язаних вхідних
допоміжних засобів runtime.

Використовуйте `resolveInboundMentionDecision({ facts, policy })` для шлюзування згадок.

## Покроковий посібник

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` —
    це те, що робить його channel plugin. Повну поверхню метаданих пакета
    див. у [Налаштування й конфігурація Plugin](/uk/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` перевіряє `plugins.entries.acme-chat.config`. Використовуйте його для
    налаштувань, якими володіє Plugin і які не є конфігурацією облікового запису каналу. `channelConfigs`
    перевіряє `channels.acme-chat` і є джерелом холодного шляху, яке використовують схема
    конфігурації, налаштування та поверхні UI до завантаження runtime Plugin.

  </Step>

  <Step title="Build the channel plugin object">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть із
    мінімуму - `id` і `setup` - та додавайте адаптери за потреби.

    Створіть `src/channel.ts`:

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

    Для каналів, які приймають і канонічні ключі DM верхнього рівня, і застарілі вкладені ключі, використовуйте допоміжні засоби з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` зберігають локальні для облікового запису значення попереду успадкованих кореневих значень. Поєднуйте той самий resolver із виправленням doctor через `normalizeLegacyDmAliases`, щоб runtime і міграція читали той самий контракт.

    <Accordion title="What createChatChannelPlugin does for you">
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а builder компонуватиме їх:

      | Параметр | Що він зв’язує |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver з полів конфігурації |
      | `pairing.text` | Текстовий потік сполучення DM з обміном кодом |
      | `threading` | Resolver режиму відповіді (фіксований, scoped для облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передати необроблені об’єкти адаптера замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Необроблені вихідні адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язковий `ctx.formatting` передає рішення форматування під час доставлення,
      як-от `maxLinesPerMessage`; застосовуйте його перед надсиланням, щоб потоки відповідей
      і межі фрагментів один раз розв’язувалися спільним вихідним доставленням.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли нативну ціль відповіді було розв’язано, тож допоміжні засоби корисного навантаження можуть зберігати
      явні теги відповіді без споживання неявного одноразового слота відповіді.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    Створіть `index.ts`:

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

    Розміщуйте CLI-дескриптори, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюють ті самі дескриптори для реєстрації
    справжніх команд. Залишайте `registerFull(...)` для роботи, потрібної лише runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розв’язуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Див.
    [точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Add a setup entry">
    Створіть `setup-entry.ts` для полегшеного завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу не підтягувати важкий runtime-код під час setup-потоків.
    Докладніше див. у [налаштуванні та конфігурації](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які виносять setup-безпечні експорти в допоміжні
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Handle inbound messages">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — Webhook, який перевіряє запит і
    передає його через inbound-обробник вашого каналу:

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
      Обробка inbound-повідомлень є специфічною для каналу. Кожен Plugin каналу володіє
      власним inbound-конвеєром. Перегляньте вбудовані Plugin-и каналів
      (наприклад, пакет Plugin для Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Пишіть співрозміщені тести в `src/channel.test.ts`:

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

    Спільні тестові helpers див. у [тестуванні](/uk/plugins/sdk-testing).

</Step>
</Steps>

## Структура файлів

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

## Розширені теми

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, прив’язані до облікового запису або кастомні режими відповіді
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/uk/plugins/sdk-channel-inbound">
    Спільний життєвий цикл inbound-події: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper seams досі існують для супроводу вбудованих Plugin-ів і
сумісності. Вони не є рекомендованим шаблоном для нових Plugin-ів каналів;
віддавайте перевагу загальним subpaths channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не супроводжуєте цю сім’ю вбудованих Plugin-ів напряму.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів subpath
- [Тестування SDK](/uk/plugins/sdk-testing) - тестові утиліти й контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) - повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
- [Plugin-и агентних harness](/uk/plugins/sdk-agent-harness)
