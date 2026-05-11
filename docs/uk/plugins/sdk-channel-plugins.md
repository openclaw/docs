---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно розуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin для каналів
x-i18n:
    generated_at: "2026-05-11T20:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник описує створення канального плагіна, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою структурою
  пакета та налаштуванням маніфесту.
</Info>

## Як працюють канальні плагіни

Канальним плагінам не потрібні власні інструменти надсилання/редагування/реакцій. OpenClaw зберігає один
спільний інструмент `message` у ядрі. Ваш плагін відповідає за:

- **Конфігурацію** - визначення облікового запису та майстер налаштування
- **Безпеку** - політику DM і списки дозволених
- **Сполучення** - потік схвалення через DM
- **Граматику сеансу** - те, як ідентифікатори розмов конкретного провайдера зіставляються з базовими чатами, ідентифікаторами потоків і батьківськими резервними варіантами
- **Вихідні повідомлення** - надсилання тексту, медіа та опитувань на платформу
- **Потоки** - те, як відповіді прив’язуються до потоків
- **Індикатор набору для Heartbeat** - необов’язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сеансу,
типовий облік `:thread:` і диспетчеризацію.

Нові канальні плагіни також мають надавати адаптер `message` через
`defineChannelMessageAdapter` з `openclaw/plugin-sdk/channel-message`. Адаптер
оголошує, які довговічні можливості фінального надсилання фактично підтримує нативний транспорт,
і спрямовує надсилання тексту/медіа до тих самих транспортних функцій, що й застарілий адаптер
`outbound`. Оголошуйте можливість лише тоді, коли контрактний тест
підтверджує нативний побічний ефект і повернуту квитанцію.
Повний API-контракт, приклади, матрицю можливостей, правила квитанцій, фіналізацію попереднього перегляду наживо,
політику підтвердження отримання, тести й таблицю міграції див. у
[API повідомлень каналу](/uk/plugins/sdk-channel-message).
Якщо наявний адаптер `outbound` уже має правильні методи надсилання та
метадані можливостей, використовуйте `createChannelMessageAdapterFromOutbound(...)`, щоб
вивести адаптер `message` замість ручного написання ще одного моста.
Надсилання адаптера мають повертати значення `MessageReceipt`. Коли коду сумісності
все ще потрібні застарілі ідентифікатори, виводьте їх через `listMessageReceiptPlatformIds(...)`
або `resolveMessageReceiptPrimaryId(...)` замість підтримання паралельних
полів `messageIds` у новому коді життєвого циклу.
Канали з підтримкою попереднього перегляду також мають оголошувати `message.live.capabilities` з
точним життєвим циклом наживо, яким вони володіють, наприклад `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` або
`quietFinalization`. Канали, які фіналізують чернетковий попередній перегляд на місці, також мають
оголошувати `message.live.finalizer.capabilities`, наприклад `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` і
`retainOnAmbiguousFailure`, та спрямовувати логіку виконання через
`defineFinalizableLivePreviewAdapter(...)` разом із
`deliverWithFinalizableLivePreviewAdapter(...)`. Підкріплюйте ці можливості
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` і
`verifyChannelMessageLiveFinalizerProofs(...)`, щоб нативний попередній перегляд,
прогрес, редагування, резервний варіант/утримання, очищення та поведінка квитанцій не могли непомітно
розійтися.
Вхідні приймачі, які відкладають підтвердження платформи, мають оголошувати
`message.receive.defaultAckPolicy` і `supportedAckPolicies` замість приховування
часу підтвердження в локальному стані монітора. Покрийте кожну оголошену політику
тестами `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Застарілі помічники відповідей/ходів, як-от `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` і `recordInboundSessionAndDispatchReply`,
залишаються доступними для диспетчерів сумісності. Не використовуйте ці назви для нового
коду каналу; нові плагіни мають починати з адаптера `message`, квитанцій і
помічників життєвого циклу отримання/надсилання в `openclaw/plugin-sdk/channel-message`.

Канали, які мігрують вхідну авторизацію, можуть використовувати експериментальний
підшлях `openclaw/plugin-sdk/channel-ingress-runtime` з шляхів отримання під час виконання.
Підшлях залишає пошук платформи та побічні ефекти в плагіні, водночас
спільно використовуючи визначення стану списку дозволених, рішення щодо маршруту/відправника/команди/події/активації,
редаговану діагностику та зіставлення допуску ходу. Залишайте нормалізацію ідентичності
плагіна в дескрипторі, який передаєте до резолвера; не серіалізуйте
сирі значення збігів із визначеного стану або рішення. Див.
[API входу каналу](/uk/plugins/sdk-channel-ingress) для дизайну API,
межі відповідальності та очікувань щодо тестів.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у канальному плагіні. Ядро викликає його з
визначеною ціллю доставки Heartbeat перед початком запуску моделі Heartbeat і
використовує спільний життєвий цикл підтримання/очищення індикатора набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів пісочниці та політики доступу до вихідних медіа,
тож плагінам не потрібні спеціальні випадки в спільному ядрі для параметрів аватарів,
вкладень або зображень обкладинки, специфічних для провайдера.
Віддавайте перевагу поверненню мапи за ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для всіх наданих дій.

Якщо вашому каналу потрібне формування, специфічне для провайдера, для `message(action="send")`,
віддавайте перевагу `actions.prepareSendPayload(...)`. Розміщуйте нативні картки, блоки, вбудовані елементи або
інші довговічні дані в `payload.channelData.<channel>` і дозвольте ядру виконати
фактичне надсилання через адаптер outbound/message. Використовуйте
`actions.handleAction(...)` для надсилання лише як резервний варіант сумісності для
корисних навантажень, які не можна серіалізувати й повторити.

Якщо ваша платформа зберігає додаткову область дії всередині ідентифікаторів розмов, залишайте цей парсинг
у плагіні через `messaging.resolveSessionConversation(...)`. Це канонічний
хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором потоку,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батька до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду плагіна потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірній потік із його батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Помічник
нормалізує числові ідентифікатори потоків так само, як це робить ядро, тому плагінам варто
віддавати йому перевагу над спеціальними порівняннями `String(threadId)`.
Плагіни з граматикою цілей, специфічною для провайдера, можуть інжектувати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримувати ту саму форму цілі маршруту
та семантику резервного потоку, яку використовує ядро.

Вбудовані плагіни, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр плагінів під час виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише батьківські резервні варіанти поверх
типового/сирого ідентифікатора. Якщо існують обидва хуки, ядро спершу використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише
повертається до `resolveParentConversationCandidates(...)`, коли канонічний хук
їх не надає.

## Схвалення та можливості каналу

Більшості канальних плагінів не потрібен код, специфічний для схвалень.

- Ядро володіє `/approve` у тому самому чаті, спільними payload-кнопок схвалення та універсальною резервною доставкою.
- Віддавайте перевагу одному об’єкту `approvalCapability` у channel plugin, коли каналу потрібна поведінка, специфічна для схвалень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативність/render/auth схвалень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; ядро більше не читає approval auth hooks із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним інтерфейсом approval-auth.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності approval auth у тому самому чаті.
- Якщо ваш канал надає native exec approvals, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від same-chat approval auth. Ядро використовує цей exec-specific hook, щоб розрізняти `enabled` і `disabled`, вирішувати, чи initiating channel підтримує native exec approvals, і включати канал до fallback guidance для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для channel-specific поведінки життєвого циклу payload, наприклад приховування дубльованих локальних approval prompts або надсилання typing indicators перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних схвалень або пригнічення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для channel-owned фактів нативного схвалення. Залишайте його lazy на гарячих entrypoints каналу через `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру зібрати життєвий цикл схвалення.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні кастомні payload-схвалення замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь disabled-path пояснювала точні config knobs, потрібні для ввімкнення native exec approvals. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають render шляхи з прив’язкою до account, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Якщо канал може вивести стабільні owner-like DM identities з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити same-chat `/approve` без додавання approval-specific логіки в ядро.
- Якщо каналу потрібна доставка нативних схвалень, тримайте код каналу зосередженим на нормалізації target і фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте channel-specific факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати handler і володіти фільтрацією запитів, маршрутизацією, dedupe, expiry, gateway subscription і сповіщеннями routed-elsewhere. `nativeRuntime` поділено на кілька менших інтерфейсів:
- `createChannelNativeOriginTargetResolver` типово використовує shared channel-route matcher для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише коли канал має provider-specific правила еквівалентності, як-от Slack timestamp prefix matching.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно canonicalize provider ids перед запуском default route matcher або custom `targetsMatch` callback, зберігаючи original target для доставки. Використовуйте `normalizeTarget` лише коли сам resolved delivery target має бути canonicalized.
- `availability` - чи налаштовано account і чи потрібно обробляти request
- `presentation` - відобразити shared approval view model у pending/resolved/expired native payloads або final actions
- `transport` - підготувати targets і send/update/delete native approval messages
- `interactions` - необов’язкові bind/unbind/clear-action hooks для native buttons або reactions
- `observe` - необов’язкові hooks діагностики доставки
- Якщо каналу потрібні runtime-owned objects, як-от client, token, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Generic runtime-context registry дозволяє ядру bootstrap capability-driven handlers зі startup state каналу без додавання approval-specific wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише коли capability-driven інтерфейс ще недостатньо виразний.
- Канали нативних схвалень мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` утримує multi-account approval policy у межах правильного bot account, а `approvalKind` залишає exec vs plugin approval behavior доступною для каналу без hardcoded branches у ядрі.
- Ядро тепер також володіє approval reroute notices. Channel plugins не повинні надсилати власні follow-up messages "approval went to DMs / another channel" з `createChannelNativeApprovalRuntime`; натомість надавайте точну origin + approver-DM routing через shared approval capability helpers і дайте ядру агрегувати actual deliveries перед публікацією будь-якого notice назад в initiating chat.
- Зберігайте kind доставленого approval id наскрізно. Native clients не повинні
  вгадувати або переписувати exec vs plugin approval routing зі стану, локального для каналу.
- Різні approval kinds можуть навмисно надавати різні native surfaces.
  Поточні bundled examples:
  - Slack зберігає native approval routing доступним і для exec, і для plugin ids.
  - Matrix зберігає ту саму native DM/channel routing і reaction UX для exec
    та plugin approvals, водночас дозволяючи auth відрізнятися за approval kind.
- `createApproverRestrictedNativeApprovalAdapter` досі існує як compatibility wrapper, але новий код має віддавати перевагу capability builder і надавати `approvalCapability` у plugin.

Для гарячих entrypoints каналу віддавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
одна частина цієї family:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella
surface.

Безпосередньо для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe setup helpers:
  import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` і delegated
  setup-proxy builders
- `openclaw/plugin-sdk/setup-runtime` включає env-aware adapter seam для
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює optional-install setup
  builders плюс кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує env-driven setup або auth і generic startup/config
flows мають знати ці env names до завантаження runtime, оголосіть їх у
plugin manifest через `channelEnvVars`. Залишайте channel runtime `envVars` або локальні
constants лише для operator-facing copy.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
SecretRef scans до запуску plugin runtime, додайте `openclaw.setupEntry` у
`package.json`. Цей entrypoint має бути безпечним для import у read-only command
paths і має повертати channel metadata, setup-safe config adapter, status
adapter і channel secret target metadata, потрібні для цих summaries. Не
запускайте clients, listeners або transport runtimes із setup entry.

Також тримайте main channel entry import path вузьким. Discovery може оцінити
entry і channel plugin module, щоб зареєструвати capabilities без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати channel
plugin object без імпорту setup wizards, transport clients, socket
listeners, subprocess launchers або service startup modules. Розміщуйте ці runtime
pieces у модулях, завантажених із `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший інтерфейс `openclaw/plugin-sdk/setup` лише коли вам також потрібні
  важчі shared setup/config helpers, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче рекламувати "install this plugin first" у setup
surfaces, віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
adapter/wizard fail closed під час config writes і finalization, і повторно використовує
те саме install-required message у validation, finalize і docs-link
copy.

Для інших гарячих channel paths віддавайте перевагу вузьким helpers над ширшими legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account config і
  default-account fallback
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope і
  record-and-dispatch wiring
- `openclaw/plugin-sdk/messaging-targets` для target parsing/matching
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для media loading плюс outbound
  identity/send delegates і payload planning
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати explicit
  `replyToId`/`threadId` або відновлювати current `:thread:` session
  після того, як base session key усе ще збігається. Provider plugins можуть override
  precedence, suffix behavior і thread id normalization, коли їхня platform
  має native thread delivery semantics.
- `openclaw/plugin-sdk/thread-bindings-runtime` для thread-binding lifecycle
  і adapter registration
- `openclaw/plugin-sdk/agent-media-payload` лише коли legacy agent/media
  payload field layout досі потрібен
- `openclaw/plugin-sdk/telegram-command-config` для Telegram custom-command
  normalization, duplicate/conflict validation і fallback-stable command
  config contract

Auth-only канали зазвичай можуть зупинитися на default path: ядро обробляє approvals, а plugin лише надає outbound/auth capabilities. Канали нативних схвалень, такі як Matrix, Slack, Telegram і custom chat transports, мають використовувати shared native helpers замість власної реалізації життєвого циклу схвалення.

## Політика inbound mentions

Тримайте inbound mention handling розділеним на два layers:

- plugin-owned evidence gathering
- shared policy evaluation

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для mention-policy decisions.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише коли вам потрібен ширший inbound
helper barrel.

Добре підходить для plugin-local логіки:

- reply-to-bot detection
- quoted-bot detection
- thread-participation checks
- service/system-message exclusions
- platform-native caches, потрібні для доведення bot participation

Добре підходить для shared helper:

- `requireMention`
- результат явної згадки
- список дозволених неявних згадок
- обхід командою
- остаточне рішення про пропуск

Рекомендований потік:

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

`api.runtime.channel.mentions` надає ті самі спільні допоміжні засоби для згадок для
вбудованих Plugin каналів, які вже залежать від інʼєкції середовища виконання:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження неповʼязаних вхідних
допоміжних засобів середовища виконання.

Старіші допоміжні засоби `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` —
    це те, що робить його Plugin каналу. Повну поверхню метаданих пакета
    див. у [Налаштування Plugin і конфігурація](/uk/plugins/sdk-setup#openclaw-channel):

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
    конфігурації, налаштування та поверхні UI до завантаження середовища виконання Plugin.

  </Step>

  <Step title="Створіть обʼєкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необовʼязкових поверхонь адаптера. Почніть з
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

    Для каналів, які приймають і канонічні DM ключі верхнього рівня, і застарілі вкладені ключі, використовуйте допоміжні засоби з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` зберігають локальні для облікового запису значення перед успадкованими кореневими значеннями. Поєднайте той самий резолвер із відновленням doctor через `normalizeLegacyDmAliases`, щоб середовище виконання й міграція читали той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а будівник компонує їх:

      | Параметр | Що він підʼєднує |
      | --- | --- |
      | `security.dm` | Резолвер безпеки DM із конфігураційних полів із заданою областю |
      | `pairing.text` | Текстовий потік звʼязування DM з обміном кодом |
      | `threading` | Резолвер режиму reply-to (фіксований, привʼязаний до облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передати сирі обʼєкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Сирі вихідні адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необовʼязковий `ctx.formatting` містить рішення форматування під час доставки,
      як-от `maxLinesPerMessage`; застосуйте його перед надсиланням, щоб потоки відповідей
      і межі фрагментів були один раз визначені спільною вихідною доставкою.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли було визначено нативну ціль відповіді, щоб допоміжні засоби payload могли зберігати
      явні теги відповіді без використання неявного одноразового слота відповіді.
    </Accordion>

  </Step>

  <Step title="Підʼєднайте точку входу">
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

    Розміщуйте CLI дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного середовища виконання каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реальної
    реєстрації команд. Залишайте `registerFull(...)` для роботи, що стосується лише середовища виконання.
    Якщо `registerFull(...)` реєструє RPC методи Gateway, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розвʼязуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри див. у [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте точку входу налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу не підтягувати важкий код середовища виконання під час потоків налаштування.
    Докладніше див. у [Налаштування і конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які розділяють безпечні для налаштування експорти в допоміжні
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний сеттер середовища виконання під час налаштування.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — Webhook, який перевіряє запит і
    спрямовує його через вхідний обробник вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен Plugin каналу володіє
      власним вхідним конвеєром. Перегляньте вбудовані Plugin каналів
      (наприклад, пакет Plugin Microsoft Teams або Google Chat) для реальних шаблонів.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Напишіть розміщені поруч тести в `src/channel.test.ts`:

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

    Про спільні допоміжні засоби для тестування див. [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані режими відповіді, режими в межах облікового запису або користувацькі режими
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool та виявлення дій
  </Card>
  <Card title="Розпізнавання цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, підагент через api.runtime
  </Card>
  <Card title="Ядро ходу каналу" icon="bolt" href="/uk/plugins/sdk-channel-turn">
    Спільний життєвий цикл вхідного ходу: отримання, розпізнавання, запис, диспетчеризація, завершення
  </Card>
</CardGroup>

<Note>
Деякі вбудовані допоміжні межі все ще існують для підтримки вбудованих Plugin і
сумісності. Це не рекомендований шаблон для нових Plugin каналів;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не підтримуєте безпосередньо цю родину вбудованих Plugin.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) - повна довідка імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) - утиліти тестування та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) - повна схема маніфесту

## Пов’язано

- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Plugin агентського каркаса](/uk/plugins/sdk-agent-harness)
