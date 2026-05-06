---
read_when:
    - Ви створюєте новий Plugin для каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Потрібно зрозуміти інтерфейс адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-05-06T01:10:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83bae4deb19ab4acbcb45873679f34dda189b4da1c2c247cb9e47ba7e58c8059
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник показує, як створити канальний плагін, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють канальні плагіни

Канальним плагінам не потрібні власні інструменти надсилання, редагування чи реакцій. OpenClaw тримає один
спільний інструмент `message` у core. Ваш плагін відповідає за:

- **Конфігурація** — визначення облікового запису та майстер налаштування
- **Безпека** — політика DM і списки дозволених
- **Сполучення** — потік схвалення DM
- **Граматика сеансів** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і батьківськими резервними варіантами
- **Вихідні повідомлення** — надсилання тексту, медіа та опитувань на платформу
- **Потоки** — як відповіді об’єднуються в потоки
- **Heartbeat typing** — необов’язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Core відповідає за спільний інструмент повідомлень, підключення prompt, зовнішню форму ключа сеансу,
загальне ведення обліку `:thread:` і dispatch.

Нові канальні плагіни також мають надавати адаптер `message` за допомогою
`defineChannelMessageAdapter` з `openclaw/plugin-sdk/channel-message`. Адаптер
оголошує, які довговічні можливості фінального надсилання фактично підтримує native-транспорт,
і спрямовує надсилання тексту/медіа до тих самих транспортних функцій, що й
застарілий адаптер `outbound`. Оголошуйте можливість лише тоді, коли контрактний тест
підтверджує native-побічний ефект і повернену квитанцію.
Повний контракт API, приклади, матрицю можливостей, правила квитанцій, фіналізацію live preview, політику ack отримання, тести й таблицю міграції дивіться в
[API повідомлень каналу](/uk/plugins/sdk-channel-message).
Якщо наявний адаптер `outbound` уже має правильні методи надсилання та
метадані можливостей, використовуйте `createChannelMessageAdapterFromOutbound(...)`, щоб
створити адаптер `message`, замість написання ще одного мосту вручну.
Надсилання адаптера мають повертати значення `MessageReceipt`. Коли коду сумісності
ще потрібні застарілі ідентифікатори, виводьте їх за допомогою `listMessageReceiptPlatformIds(...)`
або `resolveMessageReceiptPrimaryId(...)`, а не зберігайте паралельні
поля `messageIds` у новому коді життєвого циклу.
Канали з підтримкою preview також мають оголошувати `message.live.capabilities` з
точним live-життєвим циклом, яким вони володіють, наприклад `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` або
`quietFinalization`. Канали, які фіналізують draft preview на місці, також мають
оголошувати `message.live.finalizer.capabilities`, наприклад `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` і
`retainOnAmbiguousFailure`, та спрямовувати runtime-логіку через
`defineFinalizableLivePreviewAdapter(...)` разом із
`deliverWithFinalizableLivePreviewAdapter(...)`. Підкріплюйте ці можливості
тестами `verifyChannelMessageLiveCapabilityAdapterProofs(...)` і
`verifyChannelMessageLiveFinalizerProofs(...)`, щоб поведінка native preview,
progress, edit, fallback/retention, cleanup і receipt не могла непомітно змінитися.
Вхідні приймачі, які відкладають підтвердження платформи, мають оголошувати
`message.receive.defaultAckPolicy` і `supportedAckPolicies`, а не приховувати
час ack у локальному стані монітора. Покрийте кожну оголошену політику за допомогою
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Застарілі допоміжні засоби відповідей/ходів, як-от `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` і `recordInboundSessionAndDispatchReply`,
залишаються доступними для dispatchers сумісності. Не використовуйте ці назви для нового
канального коду; нові плагіни мають починати з адаптера `message`, квитанцій і
допоміжних засобів життєвого циклу отримання/надсилання в `openclaw/plugin-sdk/channel-message`.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у канальному плагіні. Core викликає його з
визначеною ціллю доставки Heartbeat перед запуском моделі Heartbeat і
використовує спільний життєвий цикл підтримання/очищення typing. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, що переносять джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації sandbox-шляхів і політики доступу до вихідних медіа,
тому плагінам не потрібні спеціальні випадки у shared-core для специфічних для провайдера
параметрів аватара, вкладення чи cover-зображення.
Надавайте перевагу поверненню мапи, індексованої за ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив усе ще працює для параметрів, які
навмисно спільні для кожної відкритої дії.

Якщо вашому каналу потрібне специфічне для провайдера формування для `message(action="send")`,
надавайте перевагу `actions.prepareSendPayload(...)`. Розміщуйте native-картки, блоки, embeds або
інші довговічні дані в `payload.channelData.<channel>` і дозвольте core виконати
фактичне надсилання через адаптер outbound/message. Використовуйте
`actions.handleAction(...)` для надсилання лише як резервний варіант сумісності для
payload, які не можна серіалізувати й повторити.

Якщо ваша платформа зберігає додаткову область у межах ідентифікаторів розмов, тримайте цей parsing
у плагіні за допомогою `messaging.resolveSessionConversation(...)`. Це
канонічний hook для зіставлення `rawId` із базовим ідентифікатором розмови, необов’язковим ідентифікатором потоку,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського варіанта до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду плагіна потрібно нормалізувати
route-подібні поля, порівняти дочірній потік із його батьківським route або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Допоміжний засіб
нормалізує числові ідентифікатори потоків так само, як це робить core, тому плагінам варто віддавати
йому перевагу над ad hoc порівняннями `String(threadId)`.
Плагіни зі специфічною для провайдера граматикою цілей можуть впровадити свій parser у
`resolveChannelRouteTargetWithParser(...)` і все одно отримати ту саму форму цілі route
та семантику резервного потоку, які використовує core.

Вбудовані плагіни, яким потрібен той самий parsing до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю bootstrap-safe поверхню
лише коли runtime-реєстр плагінів ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише батьківські резервні варіанти поверх
загального/raw id. Якщо існують обидва hooks, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і повертається до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний hook
їх пропускає.

## Схвалення та можливості каналу

Більшості канальних плагінів не потрібен код, специфічний для схвалення.

- Core володіє same-chat `/approve`, спільними payload-кнопок затвердження та загальною fallback-доставкою.
- Надавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для затверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/render/auth/native затверджень у `approvalCapability`.
- `plugin.auth` призначено лише для login/logout; Core більше не читає approval auth hooks з цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним швом approval-auth.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності same-chat approval auth.
- Якщо ваш канал надає native exec approvals, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від same-chat approval auth. Core використовує цей exec-специфічний hook, щоб відрізняти `enabled` від `disabled`, визначати, чи initiating канал підтримує native exec approvals, і включати канал у fallback guidance для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для channel-specific поведінки життєвого циклу payload, наприклад приховування дубльованих local approval prompts або надсилання typing indicators перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації native approval або приглушення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для channel-owned фактів native approval. Тримайте його lazy на гарячих entrypoint каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас даючи Core змогу зібрати життєвий цикл затвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні custom approval payloads замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для disabled-path пояснювала точні config knobs, потрібні для ввімкнення native exec approvals. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими account мають рендерити account-scoped шляхи, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Якщо канал може вивести стабільні owner-like DM identities з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити same-chat `/approve` без додавання core-логіки, специфічної для затверджень.
- Якщо каналу потрібна native approval delivery, тримайте код каналу зосередженим на нормалізації target і фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розмістіть channel-specific факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб Core міг зібрати handler і володіти фільтрацією запитів, маршрутизацією, dedupe, expiry, підпискою Gateway і сповіщеннями routed-elsewhere. `nativeRuntime` поділено на кілька менших швів:
- `createChannelNativeOriginTargetResolver` за замовчуванням використовує спільний matcher маршрутів каналу для target `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має provider-specific правила еквівалентності, наприклад зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати provider ids перед запуском default route matcher або custom callback `targetsMatch`, водночас зберігаючи оригінальний target для доставки. Використовуйте `normalizeTarget` лише тоді, коли сам resolved delivery target має бути канонізований.
- `availability` — чи налаштовано account і чи має оброблятися запит
- `presentation` — відображає спільну approval view model у pending/resolved/expired native payloads або final actions
- `transport` — готує target, а також надсилає/оновлює/видаляє native approval messages
- `interactions` — необов’язкові hooks bind/unbind/clear-action для native buttons або reactions
- `observe` — необов’язкові hooks діагностики доставки
- Якщо каналу потрібні runtime-owned об’єкти, як-от client, token, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний runtime-context registry дає Core змогу bootstrap capability-driven handlers зі startup state каналу без додавання approval-specific wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли capability-driven seam ще недостатньо виразний.
- Native approval channels мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` утримує multi-account approval policy у межах правильного bot account, а `approvalKind` зберігає для каналу доступність поведінки exec проти plugin approval без hardcoded branches у Core.
- Core тепер також володіє approval reroute notices. Плагіни каналів не мають надсилати власні follow-up повідомлення "approval went to DMs / another channel" з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні approval capability helpers і дайте Core агрегувати фактичні доставки перед публікацією будь-якого notice назад у initiating chat.
- Зберігайте kind доставленого approval id end-to-end. Native clients не мають
  вгадувати або переписувати маршрутизацію exec проти plugin approval зі стану, локального для каналу.
- Різні approval kinds можуть навмисно відкривати різні native surfaces.
  Поточні bundled приклади:
  - Slack зберігає доступною native approval routing для ids як exec, так і plugin.
  - Matrix зберігає однакову native DM/channel routing і reaction UX для exec
    та plugin approvals, водночас усе ще дозволяючи auth відрізнятися за approval kind.
- `createApproverRestrictedNativeApprovalAdapter` досі існує як compatibility wrapper, але новий код має віддавати перевагу capability builder і відкривати `approvalCapability` у плагіні.

Для гарячих entrypoint каналу надавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
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

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe setup helpers:
  import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  setup-proxy builders
- `openclaw/plugin-sdk/setup-adapter-runtime` є вузьким env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює optional-install setup
  builders і кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує env-driven setup або auth і generic startup/config
flows мають знати ці env names до завантаження runtime, оголосіть їх у
маніфесті плагіна через `channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні
константи лише для operator-facing copy.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
SecretRef scans до старту runtime плагіна, додайте `openclaw.setupEntry` у
`package.json`. Цей entrypoint має бути безпечним для імпорту в read-only command
paths і має повертати metadata каналу, setup-safe config adapter, status
adapter і channel secret target metadata, потрібні для цих summary. Не
запускайте clients, listeners або transport runtimes із setup entry.

Тримайте вузьким і import path головного entry каналу. Discovery може оцінити
entry і module плагіна каналу, щоб зареєструвати capabilities без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт плагіна
каналу без імпорту setup wizards, transport clients, socket
listeners, subprocess launchers або service startup modules. Розміщуйте ці runtime
частини в модулях, завантажених із `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі shared setup/config helpers, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати "install this plugin first" у setup
surfaces, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
adapter/wizard fail closed під час config writes і finalization, і вони повторно використовують
одне й те саме install-required message у validation, finalize і docs-link
copy.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helpers над ширшими legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account config і
  default-account fallback
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope та
  record-and-dispatch wiring
- `openclaw/plugin-sdk/messaging-targets` для parsing/matching target
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для media loading плюс outbound
  identity/send delegates і payload planning
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну session `:thread:`
  після того, як base session key усе ще збігається. Provider plugins можуть перевизначати
  precedence, suffix behavior і нормалізацію thread id, коли їхня платформа
  має native thread delivery semantics.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  та реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли legacy agent/media
  payload field layout все ще потрібний
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації custom-command Telegram,
  валідації duplicate/conflict і fallback-stable command
  config contract

Auth-only channels зазвичай можуть зупинитися на default path: Core обробляє затвердження, а плагін лише відкриває outbound/auth capabilities. Native approval channels, як-от Matrix, Slack, Telegram і custom chat transports, мають використовувати спільні native helpers замість того, щоб самостійно реалізовувати життєвий цикл approval.

## Політика inbound mention

Тримайте обробку inbound mention розділеною на два шари:

- plugin-owned evidence gathering
- shared policy evaluation

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень mention-policy.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший inbound
helper barrel.

Добре підходить для plugin-local логіки:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки thread-participation
- виключення service/system-message
- platform-native caches, потрібні для доведення участі bot

Добре підходить для shared helper:

- `requireMention`
- результат явної згадки
- список дозволених неявних згадок
- обхід команди
- остаточне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадування.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашій перевірці вхідних повідомлень.

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

`api.runtime.channel.mentions` надає ті самі спільні допоміжні функції для згадок для
вбудованих Plugin каналу, які вже залежать від інʼєкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб не завантажувати неповʼязані допоміжні функції runtime
для вхідних повідомлень.

Старіші допоміжні функції `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

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
    налаштувань, які належать Plugin і не є конфігурацією облікового запису каналу. `channelConfigs`
    перевіряє `channels.acme-chat` і є джерелом холодного шляху, яке використовується схемою конфігурації,
    налаштуванням і UI-поверхнями до завантаження runtime Plugin.

  </Step>

  <Step title="Створіть обʼєкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необовʼязкових поверхонь адаптера. Почніть із
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

    Для каналів, які приймають і канонічні DM-ключі верхнього рівня, і застарілі вкладені ключі, використовуйте допоміжні функції з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` тримають локальні значення облікового запису попереду успадкованих кореневих значень. Поєднайте той самий resolver із repair у doctor через `normalizeLegacyDmAliases`, щоб runtime і міграція читали той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви передаєте
      декларативні параметри, а builder компонуватиме їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Обмежений DM security resolver з полів конфігурації |
      | `pairing.text` | Текстовий потік DM pairing з обміном кодом |
      | `threading` | Resolver режиму відповіді (фіксований, scoped до облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ID повідомлень) |

      Ви також можете передати сирі обʼєкти адаптерів замість декларативних параметрів,
      якщо потрібен повний контроль.

      Сирі outbound-адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необовʼязкове `ctx.formatting` містить рішення щодо форматування під час доставки,
      як-от `maxLinesPerMessage`; застосуйте його перед надсиланням, щоб threading відповідей
      і межі фрагментів один раз визначалися спільною outbound-доставкою.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли було визначено нативну ціль відповіді, тож допоміжні функції payload можуть зберігати
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

    Розміщуйте CLI-дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    а звичайні повні завантаження все одно підхоплювали ті самі дескриптори для справжньої
    реєстрації команд. Залишайте `registerFull(...)` для роботи, потрібної лише під час runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Адміністративні простори імен core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри див. у [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте точку входу налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не сконфігуровано. Це уникає підтягування важкого runtime-коду під час потоків налаштування.
    Докладніше див. у [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали workspace, які виносять setup-safe експорти в sidecar
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний runtime setter під час налаштування.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    передає його через inbound handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      Обробка вхідних повідомлень залежить від каналу. Кожен канальний плагін володіє
      власним вхідним конвеєром. Перегляньте вбудовані канальні плагіни
      (наприклад, пакет плагіна Microsoft Teams або Google Chat) для реальних шаблонів.
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

    Для спільних тестових помічників див. [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані, прив’язані до облікового запису або власні режими відповіді
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Помічники середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, субагент через api.runtime
  </Card>
  <Card title="Ядро ходу каналу" icon="bolt" href="/uk/plugins/sdk-channel-turn">
    Спільний життєвий цикл вхідного ходу: отримання, визначення, запис, передавання, завершення
  </Card>
</CardGroup>

<Note>
Деякі вбудовані допоміжні точки розширення все ще існують для підтримки вбудованих плагінів і
сумісності. Це не рекомендований шаблон для нових канальних плагінів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не підтримуєте безпосередньо цю родину вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни каркаса агента](/uk/plugins/sdk-agent-harness)
