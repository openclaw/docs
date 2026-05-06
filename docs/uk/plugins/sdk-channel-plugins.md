---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно розуміти інтерфейсну поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Розробка Plugin для каналів
x-i18n:
    generated_at: "2026-05-06T02:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник показує, як створити канальний Plugin, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin для OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета й налаштуванням маніфесту.
</Info>

## Як працюють канальні Plugin

Канальним Plugin не потрібні власні інструменти надсилання/редагування/реакцій. OpenClaw тримає один
спільний інструмент `message` в core. Ваш Plugin відповідає за:

- **Конфігурація** - визначення облікового запису й майстер налаштування
- **Безпека** - політика DM і списки дозволених
- **Сполучення** - потік схвалення через DM
- **Граматика сеансу** - як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими варіантами
- **Вихідні повідомлення** - надсилання тексту, медіа й опитувань на платформу
- **Потоки** - як відповіді об'єднуються в потоки
- **Індикатор набору Heartbeat** - необов'язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Core відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сеансу,
загальний облік `:thread:` і диспетчеризацію.

Нові канальні Plugin також мають надавати адаптер `message` через
`defineChannelMessageAdapter` з `openclaw/plugin-sdk/channel-message`. Адаптер
оголошує, які довговічні можливості фінального надсилання насправді підтримує нативний транспорт,
і спрямовує надсилання тексту/медіа до тих самих транспортних функцій, що й
застарілий адаптер `outbound`. Оголошуйте можливість лише тоді, коли контрактний тест
підтверджує нативний побічний ефект і повернену квитанцію.
Повний контракт API, приклади, матрицю можливостей, правила квитанцій, фіналізацію
живого попереднього перегляду, політику ack для отримання, тести й таблицю міграції дивіться в
[API повідомлень каналу](/uk/plugins/sdk-channel-message).
Якщо наявний адаптер `outbound` уже має потрібні методи надсилання й
метадані можливостей, використовуйте `createChannelMessageAdapterFromOutbound(...)`, щоб
вивести адаптер `message`, замість ручного написання ще одного мосту.
Надсилання адаптера мають повертати значення `MessageReceipt`. Коли коду сумісності
досі потрібні застарілі ідентифікатори, виводьте їх через `listMessageReceiptPlatformIds(...)`
або `resolveMessageReceiptPrimaryId(...)`, замість підтримувати паралельні
поля `messageIds` у новому коді життєвого циклу.
Канали з підтримкою попереднього перегляду також мають оголошувати `message.live.capabilities` з
точним живим життєвим циклом, яким вони володіють, наприклад `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` або
`quietFinalization`. Канали, які фіналізують чернетку попереднього перегляду на місці, також мають
оголошувати `message.live.finalizer.capabilities`, наприклад `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` і
`retainOnAmbiguousFailure`, та спрямовувати runtime-логіку через
`defineFinalizableLivePreviewAdapter(...)` разом із
`deliverWithFinalizableLivePreviewAdapter(...)`. Підкріплюйте ці можливості
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` і
`verifyChannelMessageLiveFinalizerProofs(...)`, щоб поведінка нативного попереднього перегляду,
прогресу, редагування, fallback/утримання, очищення й квитанцій не могла непомітно
розійтися.
Вхідні отримувачі, які відкладають підтвердження платформи, мають оголошувати
`message.receive.defaultAckPolicy` і `supportedAckPolicies`, а не приховувати
час ack у локальному стані монітора. Покрийте кожну оголошену політику через
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Застарілі помічники відповідей/ходів, такі як `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` і `recordInboundSessionAndDispatchReply`,
залишаються доступними для диспетчерів сумісності. Не використовуйте ці назви для нового
коду каналу; нові Plugin мають починати з адаптера `message`, квитанцій і
помічників життєвого циклу отримання/надсилання в `openclaw/plugin-sdk/channel-message`.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у канальному Plugin. Core викликає його з
визначеною ціллю доставки Heartbeat перед початком модельного запуску Heartbeat і
використовує спільний життєвий цикл підтримання/очищення індикатора набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, що переносять медіаджерела, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації sandbox-шляхів і політики доступу до вихідних медіа,
тому Plugin не потребують спеціальних випадків у спільному core для специфічних для провайдера
параметрів аватара, вкладення чи зображення обкладинки.
Віддавайте перевагу поверненню мапи, індексованої ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов'язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної відкритої дії.

Якщо вашому каналу потрібне специфічне для провайдера формування для `message(action="send")`,
віддавайте перевагу `actions.prepareSendPayload(...)`. Розміщуйте нативні картки, блоки, вбудовані елементи або
інші довговічні дані в `payload.channelData.<channel>` і дозвольте core виконати
фактичне надсилання через адаптер outbound/message. Використовуйте
`actions.handleAction(...)` для надсилання лише як резервний варіант сумісності для
payload, які неможливо серіалізувати й повторити.

Якщо ваша платформа зберігає додаткову область у межах ідентифікаторів розмов, тримайте цей парсинг
у Plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний hook для зіставлення `rawId` із базовим ідентифікатором розмови, необов'язковим ідентифікатором потоку,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, тримайте їх упорядкованими від
найвужчого батьківського варіанта до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірній потік із його батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Помічник
нормалізує числові ідентифікатори потоків так само, як це робить core, тому Plugin мають віддавати
йому перевагу над ad hoc порівняннями `String(threadId)`.
Plugin зі специфічною для провайдера граматикою цілей можуть ін'єктувати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримати ту саму форму цілі маршруту
та семантику резервного потоку, яку використовує core.

Вбудовані Plugin, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли runtime-реєстр Plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли Plugin потрібні лише батьківські fallback
поверх загального/raw ідентифікатора. Якщо існують обидва hooks, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і повертається до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний hook
їх пропускає.

## Схвалення й можливості каналу

Більшості канальних Plugin не потрібен код, специфічний для схвалення.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload-и кнопок затвердження та загальну fallback-доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, коли каналу потрібна поведінка, специфічна для затверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/native/render/auth для затверджень у `approvalCapability`.
- `plugin.auth` призначено лише для login/logout; ядро більше не читає hooks auth для затверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним seam для auth затверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth затверджень у тому самому чаті.
- Якщо ваш канал надає native exec-затвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth затверджень у тому самому чаті. Ядро використовує цей exec-специфічний hook, щоб відрізняти `enabled` від `disabled`, вирішувати, чи initiating-канал підтримує native exec-затвердження, і включати канал у fallback-підказки для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для життєвого циклу payload, специфічного для каналу, наприклад приховування дубльованих локальних prompts затвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації native-затверджень або пригнічення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для native-фактів затвердження, якими володіє канал. Залишайте його лінивим на гарячих entrypoints каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру зібрати життєвий цикл затвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload-и затвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь disabled-path пояснювала точні config-перемикачі, потрібні для ввімкнення native exec-затверджень. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими акаунтами мають рендерити шляхи, scoped до акаунта, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Якщо канал може вивести стабільні owner-подібні DM-ідентичності з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки ядра, специфічної для затверджень.
- Якщо каналу потрібна native-доставка затверджень, тримайте код каналу зосередженим на нормалізації target і фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати handler і відповідати за фільтрацію запитів, маршрутизацію, dedupe, expiry, підписку Gateway і routed-elsewhere notices. `nativeRuntime` розділено на кілька менших seams:
- `createChannelNativeOriginTargetResolver` типово використовує спільний matcher маршрутів каналу для targets `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має provider-специфічні правила еквівалентності, наприклад prefix matching timestamp у Slack.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонікалізувати provider ids перед запуском default route matcher або власного callback `targetsMatch`, зберігаючи оригінальний target для доставки. Використовуйте `normalizeTarget` лише тоді, коли сам resolved delivery target має бути канонікалізований.
- `availability` - чи акаунт налаштовано і чи треба обробляти запит
- `presentation` - відображає спільну view model затвердження у pending/resolved/expired native payloads або фінальні дії
- `transport` - готує targets і надсилає/оновлює/видаляє native-повідомлення затвердження
- `interactions` - необов’язкові hooks bind/unbind/clear-action для native-кнопок або реакцій
- `observe` - необов’язкові hooks діагностики доставки
- Якщо каналу потрібні об’єкти, якими володіє runtime, як-от client, token, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний registry runtime-context дає ядру змогу bootstrap capability-driven handlers зі startup state каналу без додавання approval-specific wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли capability-driven seam ще недостатньо виразний.
- Native-канали затвердження мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` утримує multi-account policy затверджень у scope правильного bot account, а `approvalKind` зберігає поведінку exec vs plugin approvals доступною для каналу без hardcoded branches у ядрі.
- Ядро тепер також відповідає за notices про reroute затвердження. Channel plugins не мають надсилати власні follow-up messages "approval went to DMs / another channel" із `createChannelNativeApprovalRuntime`; натомість надавайте точну origin + approver-DM маршрутизацію через спільні helpers capability затвердження і дайте ядру агрегувати фактичні доставки перед публікацією будь-якого notice назад в initiating chat.
- Зберігайте kind доставленого approval id наскрізно. Native clients не мають
  вгадувати або переписувати маршрутизацію exec vs plugin approval зі стану, локального для каналу.
- Різні види затверджень можуть навмисно відкривати різні native surfaces.
  Поточні вбудовані приклади:
  - Slack залишає native-маршрутизацію затверджень доступною і для exec, і для plugin ids.
  - Matrix зберігає ту саму native DM/channel маршрутизацію і UX реакцій для exec
    і plugin approvals, водночас дозволяючи auth відрізнятися за видом затвердження.
- `createApproverRestrictedNativeApprovalAdapter` досі існує як compatibility wrapper, але новий код має віддавати перевагу capability builder і expose `approvalCapability` у plugin.

Для гарячих entrypoints каналу віддавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
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

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella
surface.

Саме для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe helpers setup:
  import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` і delegated
  setup-proxy builders
- `openclaw/plugin-sdk/setup-adapter-runtime` - це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює optional-install setup
  builders плюс кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує env-driven setup або auth і загальні startup/config
flows мають знати ці env names до завантаження runtime, оголосіть їх у
plugin manifest через `channelEnvVars`. Залишайте runtime `envVars` каналу або локальні
constants лише для operator-facing copy.

Якщо ваш канал може з’являтися у `status`, `channels list`, `channels status` або
SecretRef scans до запуску plugin runtime, додайте `openclaw.setupEntry` в
`package.json`. Цей entrypoint має бути безпечним для імпорту в read-only command
paths і має повертати metadata каналу, setup-safe config adapter, status
adapter і metadata secret target каналу, потрібні для цих summaries. Не
запускайте clients, listeners або transport runtimes із setup entry.

Також тримайте вузьким основний import path entry каналу. Discovery може evaluate
entry і module plugin каналу, щоб зареєструвати capabilities без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт plugin
каналу без імпорту setup wizards, transport clients, socket
listeners, subprocess launchers або service startup modules. Розміщуйте ці runtime
pieces у modules, що завантажуються з `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helpers setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати "спершу встановіть цей plugin" у setup
surfaces, віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
adapter/wizard fail closed під час config writes і finalization, і вони повторно використовують
те саме повідомлення install-required у validation, finalize і docs-link
copy.

Для інших гарячих paths каналу віддавайте перевагу вузьким helpers над ширшими legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account config і
  default-account fallback
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope і
  wiring record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для parsing/matching target
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для media loading плюс outbound
  identity/send delegates і payload planning
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати явний
  `replyToId`/`threadId` або відновлювати поточний `:thread:` session
  після того, як base session key усе ще збігається. Provider plugins можуть перевизначати
  precedence, suffix behavior і normalization thread id, коли їхня platform
  має native thread delivery semantics.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли legacy agent/media
  payload field layout усе ще потрібний
- `openclaw/plugin-sdk/telegram-command-config` для normalization Telegram custom-command,
  validation duplicates/conflicts і fallback-stable command
  config contract

Auth-only канали зазвичай можуть зупинитися на default path: ядро обробляє затвердження, а plugin лише надає outbound/auth capabilities. Native-канали затвердження, такі як Matrix, Slack, Telegram і власні chat transports, мають використовувати спільні native helpers замість власної реалізації життєвого циклу затверджень.

## Політика inbound mention

Тримайте обробку inbound mention розділеною на два шари:

- збирання доказів, яким володіє plugin
- оцінювання спільної policy

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для mention-policy decisions.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший inbound
helper barrel.

Добре підходить для plugin-local logic:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки thread-participation
- виключення service/system-message
- platform-native caches, потрібні для доведення bot participation

Добре підходить для shared helper:

- `requireMention`
- результат явного згадування
- allowlist неявних згадувань
- обхід команди
- остаточне рішення про пропуск

Бажаний потік:

1. Обчисліть локальні факти згадування.
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

`api.runtime.channel.mentions` надає ті самі спільні помічники згадувань для
вбудованих канальних Plugins, які вже залежать від runtime-інʼєкції:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження неповʼязаних вхідних
runtime-помічників.

Старіші помічники `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` —
    це те, що робить його канальним Plugin. Повну поверхню метаданих пакета
    див. у [Налаштування та конфігурація Plugin](/uk/plugins/sdk-setup#openclaw-channel):

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
    конфігурації, налаштування та UI-поверхні до завантаження runtime Plugin.

  </Step>

  <Step title="Створіть обʼєкт канального Plugin">
    Інтерфейс `ChannelPlugin` має багато необовʼязкових адаптерних поверхонь. Почніть із
    мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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

    Для каналів, які приймають і канонічні DM-ключі верхнього рівня, і застарілі вкладені ключі, використовуйте помічники з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` зберігають локальні для облікового запису значення перед успадкованими кореневими значеннями. Поєднайте той самий резолвер із doctor-виправленням через `normalizeLegacyDmAliases`, щоб runtime і міграція читали той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить за вас">
      Замість ручної реалізації низькорівневих адаптерних інтерфейсів ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він підʼєднує |
      | --- | --- |
      | `security.dm` | Обмежений DM-резолвер безпеки з полів конфігурації |
      | `pairing.text` | Текстовий потік DM-спарювання з обміном кодом |
      | `threading` | Резолвер режиму reply-to (фіксований, обмежений обліковим записом або власний) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передати сирі обʼєкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Сирі outbound-адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необовʼязковий `ctx.formatting` містить рішення щодо форматування під час доставки,
      як-от `maxLinesPerMessage`; застосовуйте його перед надсиланням, щоб reply-threading
      і межі фрагментів один раз визначалися спільною outbound-доставкою.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли нативну ціль відповіді було визначено, щоб помічники payload могли зберігати
      явні теги відповіді без споживання неявного одноразового слота відповіді.
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

    Розміщуйте CLI-дескриптори, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для справжньої
    реєстрації команд. Залиште `registerFull(...)` для роботи, потрібної лише runtime.
    Якщо `registerFull(...)` реєструє Gateway RPC-методи, використовуйте
    специфічний для Plugin префікс. Простори імен адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    резолвляться в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте setup-точку входу">
    Створіть `setup-entry.ts` для легковагового завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не сконфігурований. Це дає змогу не підтягувати важкий runtime-код під час setup-потоків.
    Докладніше див. у [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які розділяють setup-безпечні експорти в sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний runtime-setter під час setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — Webhook, який перевіряє запит і
    диспетчеризує його через вхідний обробник вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен канальний plugin володіє
      власним вхідним конвеєром. Перегляньте bundled канальні plugins
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні патерни.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Напишіть колоковані тести в `src/channel.test.ts`:

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

    Спільні тестові helper-и див. у [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані, обмежені обліковим записом або користувацькі режими відповіді
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool та виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, субагент через api.runtime
  </Card>
  <Card title="Ядро канального ходу" icon="bolt" href="/uk/plugins/sdk-channel-turn">
    Спільний життєвий цикл вхідного ходу: приймання, визначення, запис, відправлення, завершення
  </Card>
</CardGroup>

<Note>
Деякі bundled допоміжні seams все ще існують для підтримки bundled-plugin і
сумісності. Вони не є рекомендованим патерном для нових канальних plugins;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не підтримуєте цю родину bundled plugin напряму.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) - повна довідка імпорту підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) - тестові утиліти та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) - повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Plugins агентського harness](/uk/plugins/sdk-agent-harness)
