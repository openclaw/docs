---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-07-02T22:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник пояснює, як створити канальний Plugin, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
спарюванням, ланцюжками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою структурою
  пакета та налаштуванням маніфесту.
</Info>

## Як працюють канальні plugins

Канальним plugins не потрібні власні інструменти send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у ядрі. Ваш Plugin відповідає за:

- **Конфігурація** - визначення облікового запису та майстер налаштування
- **Безпека** - політика DM і списки дозволених
- **Спарювання** - потік схвалення через DM
- **Граматика сесій** - як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і батьківськими fallback-варіантами
- **Вихідні повідомлення** - надсилання тексту, медіа та опитувань на платформу
- **Ланцюжки** - як відповіді об'єднуються в гілки
- **Heartbeat-індикація введення** - необов'язкові сигнали введення/зайнятості для цілей доставки heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Нові канальні plugins також мають надавати адаптер `message` через
`defineChannelMessageAdapter` з `openclaw/plugin-sdk/channel-outbound`. Адаптер
оголошує, які довговічні можливості фінального надсилання справді підтримує нативний транспорт,
і спрямовує надсилання тексту/медіа до тих самих транспортних функцій, що й
застарілий адаптер `outbound`. Оголошуйте можливість лише тоді, коли контрактний тест
підтверджує нативний побічний ефект і повернуту квитанцію.
Повний контракт API, приклади, матрицю можливостей, правила квитанцій, фіналізацію live
preview, політику receive ack, тести та таблицю міграції дивіться в
[API вихідних повідомлень каналу](/uk/plugins/sdk-channel-outbound).
Якщо наявний адаптер `outbound` уже має правильні методи надсилання та
метадані можливостей, використовуйте `createChannelMessageAdapterFromOutbound(...)`, щоб
вивести адаптер `message`, замість того щоб вручну писати ще один міст.
Надсилання адаптера мають повертати значення `MessageReceipt`. Коли коду сумісності
ще потрібні застарілі ідентифікатори, виводьте їх через `listMessageReceiptPlatformIds(...)`
або `resolveMessageReceiptPrimaryId(...)`, замість того щоб зберігати паралельні
поля `messageIds` у новому коді життєвого циклу.
Канали з підтримкою preview також мають оголошувати `message.live.capabilities` з
точним live-життєвим циклом, яким вони володіють, наприклад `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` або
`quietFinalization`. Канали, які фіналізують чернетку preview на місці, також мають
оголошувати `message.live.finalizer.capabilities`, наприклад `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` і
`retainOnAmbiguousFailure`, а також спрямовувати логіку runtime через
`defineFinalizableLivePreviewAdapter(...)` плюс
`deliverWithFinalizableLivePreviewAdapter(...)`. Підкріплюйте ці можливості
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` і
`verifyChannelMessageLiveFinalizerProofs(...)`, щоб поведінка нативного preview,
progress, edit, fallback/retention, cleanup і receipt не могла непомітно змінитися.
Вхідні приймачі, які відкладають підтвердження платформи, мають оголошувати
`message.receive.defaultAckPolicy` і `supportedAckPolicies`, замість того щоб приховувати
таймінг ack у локальному стані монітора. Покрийте кожну оголошену політику через
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Застарілі допоміжні засоби відповідей, як-от `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` і `recordInboundSessionAndDispatchReply`,
залишаються доступними для диспетчерів сумісності. Не використовуйте ці назви для нового
канального коду; нові plugins мають починати з адаптера `message`, квитанцій і
допоміжних засобів життєвого циклу receive/send у `openclaw/plugin-sdk/channel-outbound`.

Канали, що мігрують вхідну авторизацію, можуть використовувати експериментальний
підшлях `openclaw/plugin-sdk/channel-ingress-runtime` з runtime-шляхів receive.
Підшлях залишає пошук платформи та побічні ефекти в Plugin, водночас спільно використовуючи
визначення стану списку дозволених, рішення щодо route/sender/command/event/activation,
редаговану діагностику та зіставлення допуску turn. Зберігайте нормалізацію ідентичності
Plugin у дескрипторі, який передаєте резолверу; не серіалізуйте сирі значення збігів
із визначеного стану або рішення. Дивіться
[API ingress каналу](/uk/plugins/sdk-channel-ingress), щоб ознайомитися з дизайном API,
межею відповідальності та очікуваннями щодо тестів.

Якщо ваш канал підтримує індикатори введення поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у канальному Plugin. Ядро викликає його з
визначеною ціллю доставки heartbeat перед запуском heartbeat-моделі та
використовує спільний життєвий цикл keepalive/cleanup для індикації введення. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри message-tool, що містять джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації sandbox-шляхів і політики доступу до вихідних медіа,
тож plugins не потребують спеціальних випадків у спільному ядрі для специфічних для провайдера
параметрів аватара, вкладення або зображення обкладинки.
Бажано повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов'язані дії не
успадковували медіааргументи іншої дії. Плоский масив усе ще працює для параметрів, які
навмисно спільні для кожної наданої дії.
Канали, яким потрібно надати тимчасову публічну URL-адресу для отримання медіа на боці платформи,
можуть використовувати `createHostedOutboundMediaStore(...)` з
`openclaw/plugin-sdk/outbound-media` зі сховищами стану Plugin. Залишайте розбір маршрутів
платформи та перевірку токенів у канальному Plugin; спільний допоміжний засіб
відповідає лише за завантаження медіа, метадані закінчення строку дії, рядки чанків і cleanup.

Якщо вашому каналу потрібне специфічне для провайдера формування для `message(action="send")`,
віддавайте перевагу `actions.prepareSendPayload(...)`. Розміщуйте нативні картки, блоки, embeds або
інші довговічні дані в `payload.channelData.<channel>` і дозвольте ядру виконати
фактичне надсилання через адаптер outbound/message. Використовуйте
`actions.handleAction(...)` для надсилання лише як fallback сумісності для
payloads, які не можна серіалізувати й повторити.

Якщо ваша платформа зберігає додаткову область у ідентифікаторах розмов, тримайте цей розбір
у Plugin через `messaging.resolveSessionConversation(...)`. Це канонічний
hook для зіставлення `rawId` з базовим ідентифікатором розмови, необов'язковим ідентифікатором гілки,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського елемента до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
route-подібні поля, порівняти дочірню гілку з її батьківським route або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Допоміжний засіб
нормалізує числові ідентифікатори гілок так само, як це робить ядро, тому plugins мають віддавати
йому перевагу над ad hoc порівняннями `String(threadId)`.
Plugins зі специфічною для провайдера граматикою цілей мають надавати
`messaging.resolveOutboundSessionRoute(...)`, щоб ядро отримувало нативну для провайдера
ідентичність сесії та гілки без використання parser shims.

Bundled plugins, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю bootstrap-safe поверхню
лише тоді, коли runtime-реєстр plugins ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий fallback сумісності, коли Plugin потребує лише батьківських fallback-варіантів поверх
загального/сирого ідентифікатора. Якщо існують обидва hooks, ядро спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, коли канонічний hook
їх пропускає.

## Схвалення та можливості каналу

Більшості канальних plugins не потрібен код, специфічний для схвалень.

- Ядро володіє `/approve` у тому самому чаті, спільними payload для кнопок затвердження та універсальною fallback-доставкою.
- Надавайте перевагу одному об’єкту `approvalCapability` у channel plugin, коли каналу потрібна поведінка, специфічна для затверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/native/render/auth затверджень у `approvalCapability`.
- `plugin.auth` призначений лише для входу/виходу; ядро більше не читає auth-хуки затверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічною межею approval-auth.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth затверджень у тому самому чаті. Зберігайте налаштованих затверджувачів доступними для `/approve`, навіть коли native-доставку вимкнено; натомість використовуйте стан native initiating-surface для підказок щодо доставки/налаштування.
- Якщо ваш канал надає native exec approvals, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth затверджень у тому самому чаті. Ядро використовує цей exec-специфічний хук, щоб розрізняти `enabled` і `disabled`, вирішувати, чи initiating-канал підтримує native exec approvals, і включати канал у fallback-підказки native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, як-от приховування дубльованих локальних запитів на затвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації затверджень або пригнічення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native-затверджень, якими володіє канал. Тримайте його lazy на гарячих entrypoint каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру зібрати життєвий цикл затвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload затвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для disabled-path пояснювала точні config-перемикачі, потрібні для ввімкнення native exec approvals. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими account мають рендерити account-scoped шляхи, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Використовуйте `approvalCapability.describePluginApprovalSetup`, коли підказки про збій Plugin approval безпечно показувати для збоїв plugin approval no-route і timeout. `createApproverRestrictedNativeApprovalCapability(...)` не виводить це з `describeExecApprovalSetup`; передавайте той самий helper явно лише тоді, коли plugin і exec approvals справді використовують однакове native-налаштування.
- Якщо канал може вивести стабільні owner-подібні DM-ідентичності з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання core-логіки, специфічної для затверджень.
- Якщо власна approval auth навмисно дозволяє лише fallback у тому самому чаті, повертайте `markImplicitSameChatApprovalAuthorization({ authorized: true })` з `openclaw/plugin-sdk/approval-auth-runtime`; інакше ядро трактує результат як явну авторизацію затверджувача.
- Якщо native callback, яким володіє канал, напряму resolve затвердження, використовуйте `isImplicitSameChatApprovalAuthorization(...)` перед resolve, щоб implicit fallback усе ще проходив через звичайну actor authorization каналу.
- Якщо каналу потрібна native-доставка затверджень, тримайте код каналу зосередженим на нормалізації target плюс фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати handler і володіти фільтрацією запитів, маршрутизацією, дедуплікацією, expiry, Gateway subscription і повідомленнями про routed-elsewhere. `nativeRuntime` поділено на кілька менших меж:
- Використовуйте `createNativeApprovalChannelRouteGates` з `openclaw/plugin-sdk/approval-native-runtime`, коли канал підтримує і session-origin native-доставку, і явні forwarding targets для затверджень. Helper централізує вибір config затверджень, обробку `mode`, фільтри agent/session, прив’язування account, зіставлення session-target і зіставлення target-list, тоді як caller усе ще володіють channel id, default forwarding mode, account lookup, transport-enabled check, target normalization і turn-source target resolution. Не використовуйте його для створення core-owned policy defaults каналу; явно передавайте задокументований default mode каналу.
- `createChannelNativeOriginTargetResolver` за замовчуванням використовує спільний channel-route matcher для target `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має provider-specific правила еквівалентності, як-от зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати provider ids перед запуском default route matcher або власного callback `targetsMatch`, зберігаючи оригінальний target для доставки. Використовуйте `normalizeTarget` лише тоді, коли сам resolved delivery target має бути канонізований.
- `availability` - чи налаштовано account і чи потрібно обробляти запит
- `presentation` - зіставляє спільну approval view model у pending/resolved/expired native payloads або final actions
- `transport` - готує targets і надсилає/оновлює/видаляє native approval messages
- `interactions` - необов’язкові bind/unbind/clear-action хуки для native buttons або reactions, плюс необов’язковий хук `cancelDelivered`. Реалізуйте `cancelDelivered`, коли `deliverPending` реєструє in-process або persistent state (наприклад, reaction target store), щоб цей state можна було звільнити, якщо зупинка handler скасовує доставку до запуску `bindPending` або коли `bindPending` не повертає handle
- `observe` - необов’язкові хуки діагностики доставки
- Якщо каналу потрібні runtime-owned objects, як-от client, token, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Універсальний runtime-context registry дає ядру змогу bootstrap capability-driven handlers зі startup state каналу без додавання approval-specific wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли capability-driven межа ще недостатньо виразна.
- Native approval channels мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` тримає multi-account approval policy scoped до правильного bot account, а `approvalKind` зберігає поведінку exec vs plugin approval доступною для каналу без hardcoded branches у ядрі.
- Ядро тепер також володіє approval reroute notices. Channel plugins не мають надсилати власні follow-up messages "approval went to DMs / another channel" з `createChannelNativeApprovalRuntime`; натомість вони мають надавати точну origin + approver-DM маршрутизацію через спільні approval capability helpers і дозволяти ядру агрегувати фактичні доставки перед публікацією будь-якого notice назад у initiating chat.
- Зберігайте delivered approval id kind end-to-end. Native clients не повинні
  вгадувати або переписувати exec vs plugin approval routing зі стану, локального для каналу.
- Різні approval kinds можуть навмисно надавати різні native surfaces.
  Поточні bundled приклади:
  - Slack зберігає native approval routing доступним і для exec, і для plugin ids.
  - Matrix зберігає ту саму native DM/channel routing і reaction UX для exec
    і plugin approvals, водночас усе ще дозволяючи auth відрізнятися за approval kind.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як compatibility wrapper, але новий код має надавати перевагу capability builder і expose `approvalCapability` на plugin.

Для гарячих entrypoint каналу надавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
одна частина цього сімейства:

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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella
surface.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe setup helpers:
  `createSetupTranslator`, import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  setup-proxy builders
- `openclaw/plugin-sdk/setup-runtime` включає env-aware adapter seam для
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює optional-install setup
  builders плюс кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує env-driven setup або auth і generic startup/config
flows мають знати ці env names до завантаження runtime, оголосіть їх у
plugin manifest через `channelEnvVars`. Тримайте channel runtime `envVars` або локальні
constants лише для operator-facing copy.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
SecretRef scans до старту plugin runtime, додайте `openclaw.setupEntry` у
`package.json`. Цей entrypoint має бути безпечним для import у read-only command
paths і має повертати channel metadata, setup-safe config adapter, status
adapter і channel secret target metadata, потрібні для цих summaries. Не
запускайте clients, listeners або transport runtimes із setup entry.

Тримайте основний import path channel entry також вузьким. Discovery може оцінити
entry і channel plugin module для реєстрації capabilities без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт channel
plugin без імпорту setup wizards, transport clients, socket
listeners, subprocess launchers або service startup modules. Розміщуйте ці runtime
pieces у модулях, завантажених із `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу межу `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні setup/config helpers, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати "спочатку встановіть цей plugin" у setup
surfaces, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
adapter/wizard fail closed на config writes і finalization, і вони повторно використовують
те саме install-required message у validation, finalize і docs-link
copy.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helpers замість ширших legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових записів і
  резервного вибору облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/channel-inbound` для вхідного маршруту/конверта та
  зв’язування запису й диспетчеризації
- `openclaw/plugin-sdk/channel-targets` для допоміжних засобів розбору цілей
- `openclaw/plugin-sdk/outbound-media` для завантаження медіа та
  `openclaw/plugin-sdk/channel-outbound` для вихідної ідентичності/делегатів надсилання
  і планування корисного навантаження
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Provider plugins можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію ідентифікатора потоку, коли їхня платформа
  має власну семантику доставлення потоків.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли застаріле компонування полів
  корисного навантаження агента/медіа все ще потрібне
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації власних команд Telegram,
  перевірки дублікатів/конфліктів і стабільного контракту конфігурації команд із резервним режимом

Канали лише для автентифікації зазвичай можуть зупинитися на шляху за замовчуванням: ядро обробляє схвалення, а Plugin просто надає вихідні можливості та можливості автентифікації. Нативні канали схвалення, як-от Matrix, Slack, Telegram і власні чат-транспорти, мають використовувати спільні нативні допоміжні засоби замість реалізації власного життєвого циклу схвалення.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два шари:

- збирання доказів, що належить Plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли потрібен ширший barrel
вхідних допоміжних засобів.

Добре підходить для локальної логіки Plugin:

- виявлення відповіді боту
- виявлення цитування бота
- перевірки участі в потоці
- виключення службових/системних повідомлень
- платформні нативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного допоміжного засобу:

- `requireMention`
- результат явної згадки
- allowlist неявних згадок
- обхід команд
- остаточне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадок.
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
вбудованих каналів Plugin, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб не завантажувати непов’язані вхідні
runtime-допоміжні засоби.

Використовуйте `resolveInboundMentionDecision({ facts, policy })` для шлюзування згадок.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json`
    робить це канальним Plugin. Повну поверхню метаданих пакета
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
    налаштувань, що належать Plugin і не є конфігурацією облікового запису каналу. `channelConfigs`
    перевіряє `channels.acme-chat` і є джерелом холодного шляху, яке використовують схема
    конфігурації, налаштування та UI-поверхні до завантаження runtime Plugin.

  </Step>

  <Step title="Створіть об’єкт канального Plugin">
    Інтерфейс `ChannelPlugin` має багато необов’язкових адаптерних поверхонь. Почніть із
    мінімуму - `id` і `setup` - і додавайте адаптери за потреби.

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

    Для каналів, які приймають як канонічні DM-ключі верхнього рівня, так і застарілі вкладені ключі, використовуйте допоміжні засоби з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` зберігають локальні для облікового запису значення попереду успадкованих кореневих значень. Поєднайте той самий resolver із виправленням doctor через `normalizeLegacyDmAliases`, щоб runtime і міграція читали один і той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а builder складає їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Обмежений resolver безпеки DM з полів конфігурації |
      | `pairing.text` | Текстовий потік сполучення DM з обміном кодом |
      | `threading` | Resolver режиму відповіді (фіксований, обмежений обліковим записом або власний) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати необроблені об’єкти адаптера замість декларативних параметрів,
      якщо потрібен повний контроль.

      Необроблені вихідні адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язковий `ctx.formatting` містить рішення форматування під час доставлення,
      як-от `maxLinesPerMessage`; застосуйте його перед надсиланням, щоб потоки відповідей
      і межі фрагментів були розв’язані один раз спільним вихідним доставленням.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли нативну ціль відповіді було розв’язано, тож допоміжні засоби корисного навантаження можуть зберігати
      явні теги відповіді без споживання неявного одноразового слота відповіді.
    </Accordion>

  </Step>

  <Step title="Підключіть точку входу">
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

    Розмістіть CLI-дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження й надалі підхоплюватимуть ті самі дескриптори для справжньої
    реєстрації команд. Залиште `registerFull(...)` для роботи, що стосується лише runtime.
    Якщо `registerFull(...)` реєструє RPC-методи gateway, використовуйте
    префікс, специфічний для plugin. Основні адміністраторські простори імен (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    вирішуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте точку входу для налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу не підтягувати важкий runtime-код під час потоків налаштування.
    Докладніше див. [Налаштування й конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Канали bundled workspace, які відокремлюють безпечні для налаштування експорти в допоміжні
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час налаштування.

  </Step>

  <Step title="Обробіть вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — webhook, який перевіряє запит і
    передає його через вхідний обробник вашого каналу:

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
      Обробка вхідних повідомлень є специфічною для каналу. Кожен channel plugin володіє
      власним вхідним конвеєром. Перегляньте bundled channel plugins
      (наприклад, пакет plugin Microsoft Teams або Google Chat) для реальних шаблонів.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тест">
Пишіть розміщені поруч тести в `src/channel.test.ts`:

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

    Спільні тестові помічники див. у [Тестуванні](/uk/plugins/sdk-testing).

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
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими відповідей, режими відповідей у межах облікового запису або власні режими
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime-помічники" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
  <Card title="Вхідний API каналу" icon="bolt" href="/uk/plugins/sdk-channel-inbound">
    Спільний життєвий цикл вхідної події: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Деякі bundled helper seams усе ще існують для обслуговування bundled-plugin і
сумісності. Вони не є рекомендованим шаблоном для нових channel plugins;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні
SDK, якщо ви не підтримуєте цю родину bundled plugin безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugin-и](/uk/plugins/sdk-provider-plugins) - якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) - тестові утиліти й контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) - повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Agent harness plugins](/uk/plugins/sdk-agent-harness)
