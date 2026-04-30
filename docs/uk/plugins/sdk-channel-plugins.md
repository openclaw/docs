---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Потрібно розуміти інтерфейс адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin для каналів
x-i18n:
    generated_at: "2026-04-30T00:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник показує, як створити Plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, гілкуванням відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного Plugin OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб дізнатися базову структуру
  пакета й налаштування маніфесту.
</Info>

## Як працюють Plugin каналів

Plugin для каналів не потребують власних інструментів надсилання, редагування чи реакцій. OpenClaw тримає один
спільний інструмент `message` у ядрі. Ваш Plugin відповідає за:

- **Конфігурація** — визначення акаунта й майстер налаштування
- **Безпека** — політика DM і списки дозволених
- **Сполучення** — потік схвалення через DM
- **Граматика сеансів** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і батьківськими резервними варіантами
- **Вихідні повідомлення** — надсилання тексту, медіа й опитувань на платформу
- **Гілкування** — як відповіді потрапляють у гілки
- **Набір для Heartbeat** — необов'язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сеансу,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, експонуйте
`heartbeat.sendTyping(...)` у Plugin каналу. Ядро викликає його з
розв'язаною ціллю доставки Heartbeat перед початком запуску моделі Heartbeat і
використовує спільний життєвий цикл підтримання та очищення набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які несуть джерела медіа, експонуйте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів пісочниці й політики доступу до вихідних медіа,
тому Plugin не потребують спеціальних випадків у спільному ядрі для специфічних для провайдера
параметрів аватара, вкладення або зображення обкладинки.
Надавайте перевагу поверненню мапи з ключами за діями, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов'язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної експонованої дії.

Якщо ваша платформа зберігає додаткову область усередині ідентифікаторів розмов, тримайте цей розбір
у Plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов'язковим ідентифікатором гілки,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батька до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірню гілку з її батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Допоміжний засіб
нормалізує числові ідентифікатори гілок так само, як це робить ядро, тому Plugin мають надавати
йому перевагу перед спеціальними порівняннями `String(threadId)`.
Plugin із специфічною для провайдера граматикою цілей можуть ін'єктувати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримати ту саму форму цілі маршруту
та семантику резервних гілок, яку використовує ядро.

Вбудовані Plugin, яким потрібен той самий розбір до завантаження реєстру каналів,
також можуть експонувати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для початкового завантаження поверхню
лише тоді, коли реєстр Plugin часу виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний механізм сумісності, коли Plugin потребує лише батьківських резервних варіантів поверх
загального/сирого ідентифікатора. Якщо існують обидва хуки, ядро спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, коли канонічний хук
їх не надає.

## Схвалення та можливості каналів

Більшість Plugin для каналів не потребують коду, специфічного для схвалень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні корисні навантаження кнопок схвалення й загальну резервну доставку.
- Надавайте перевагу одному об'єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для схвалень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку, нативність, рендеринг і автентифікацію схвалень у `approvalCapability`.
- `plugin.auth` призначений лише для входу/виходу; ядро більше не читає хуки автентифікації схвалень із цього об'єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічною точкою інтеграції для автентифікації схвалень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації схвалень у тому самому чаті.
- Якщо ваш канал експонує нативні exec-схвалення, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/нативного клієнта, коли він відрізняється від автентифікації схвалень у тому самому чаті. Ядро використовує цей специфічний для exec хук, щоб відрізняти `enabled` від `disabled`, вирішувати, чи канал ініціювання підтримує нативні exec-схвалення, і включати канал у підказки щодо резервного переходу для нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу корисного навантаження, наприклад приховування дубльованих локальних запитів на схвалення або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних схвалень або пригнічення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для належних каналу фактів про нативні схвалення. Тримайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль часу виконання на вимогу й водночас дозволяє ядру зібрати життєвий цикл схвалень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні корисні навантаження схвалень замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних exec-схвалень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими акаунтами мають рендерити шляхи, обмежені акаунтом, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, замість типових значень верхнього рівня.
- Якщо канал може вивести стабільні DM-ідентичності на кшталт власника з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для схвалень логіки ядра.
- Якщо каналу потрібна доставка нативних схвалень, тримайте код каналу зосередженим на нормалізації цілей і фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розмістіть специфічні для каналу факти за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і відповідати за фільтрацію запитів, маршрутизацію, дедуплікацію, строк дії, підписку Gateway і повідомлення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших точок інтеграції:
- `createChannelNativeOriginTargetResolver` типово використовує спільний зіставлювач channel-route для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має специфічні для провайдера правила еквівалентності, наприклад зіставлення префікса часової мітки Slack.
- Передавайте `normalizeTargetForMatch` до `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати ідентифікатори провайдера перед запуском типового зіставлювача маршрутів або власного callback `targetsMatch`, зберігаючи початкову ціль для доставки. Використовуйте `normalizeTarget` лише тоді, коли сама розв'язана ціль доставки має бути канонізована.
- `availability` — чи налаштовано акаунт і чи потрібно обробляти запит
- `presentation` — зіставлення спільної моделі подання схвалення з очікуваними/вирішеними/простроченими нативними корисними навантаженнями або фінальними діями
- `transport` — підготовка цілей і надсилання/оновлення/видалення нативних повідомлень схвалення
- `interactions` — необов'язкові хуки прив'язування/відв'язування/очищення дії для нативних кнопок або реакцій
- `observe` — необов'язкові хуки діагностики доставки
- Якщо каналу потрібні об'єкти, що належать часу виконання, як-от клієнт, токен, застосунок Bolt або Webhook-приймач, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр контексту часу виконання дозволяє ядру початково завантажувати обробники, керовані можливостями, зі стану запуску каналу без додавання специфічного для схвалень зв'язувального коду обгортки.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли точка інтеграції, керована можливостями, ще недостатньо виразна.
- Канали нативних схвалень мають маршрутизувати і `accountId`, і `approvalKind` через ці допоміжні засоби. `accountId` утримує політику схвалень для кількох акаунтів у межах правильного акаунта бота, а `approvalKind` зберігає доступність поведінки exec-схвалень і схвалень Plugin для каналу без жорстко заданих розгалужень у ядрі.
- Ядро тепер також відповідає за повідомлення про перемаршрутизацію схвалень. Plugin каналів не мають надсилати власні подальші повідомлення "схвалення пішло в DM / інший канал" з `createChannelNativeApprovalRuntime`; натомість експонуйте точну маршрутизацію джерела + DM схвалювача через спільні допоміжні засоби можливостей схвалення й дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад у чат ініціювання.
- Зберігайте тип доставленого ідентифікатора схвалення наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec-схвалень і схвалень Plugin з локального стану каналу.
- Різні типи схвалень можуть навмисно експонувати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступність маршрутизації нативних схвалень і для exec, і для ідентифікаторів Plugin.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу й UX реакцій для exec
    і схвалень Plugin, водночас дозволяючи автентифікації відрізнятися за типом схвалення.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу побудовувачу можливостей і експонувати `approvalCapability` у Plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим підшляхам часу виконання, коли вам потрібна лише
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша загальна
поверхня.

Для налаштування зокрема:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для часу виконання допоміжні засоби налаштування:
  безпечні для імпорту адаптери патчів налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  побудовувачі проксі налаштування
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька, обізнана про змінні середовища
  точка інтеграції адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює побудовувачі налаштування
  необов'язкового встановлення плюс кілька безпечних для налаштування примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або автентифікацію, керовані змінними середовища, і загальні потоки запуску/конфігурації
мають знати ці назви змінних середовища до завантаження часу виконання, оголосіть їх у
маніфесті Plugin через `channelEnvVars`. Тримайте `envVars` часу виконання каналу або локальні
константи лише для текстів, звернених до операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску середовища виконання Plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в шляхах команд
лише для читання і має повертати метадані каналу, безпечний для налаштування
адаптер конфігурації, адаптер статусу та метадані цілі секретів каналу, потрібні
для цих зведень. Не запускайте клієнти, слухачі або транспортні середовища
виконання з точки входу налаштування.

Шлях імпорту головної точки входу каналу також має бути вузьким. Виявлення може
оцінювати точку входу й модуль Plugin каналу, щоб зареєструвати можливості без
активації каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати
об’єкт Plugin каналу без імпорту майстрів налаштування, транспортних клієнтів,
слухачів сокетів, запускувачів підпроцесів або модулів запуску сервісів.
Розміщуйте ці частини середовища виконання в модулях, що завантажуються з
`registerFull(...)`, сетерах середовища виконання або лінивих адаптерах
можливостей.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший шов `openclaw/plugin-sdk/setup` лише тоді, коли вам
  також потрібні важчі спільні помічники налаштування/конфігурації, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати «спершу встановіть цей Plugin» у поверхнях
налаштування, надайте перевагу `createOptionalChannelSetupSurface(...)`.
Згенерований адаптер/майстер безпечно відмовляється від записів конфігурації та
фіналізації, і вони повторно використовують одне й те саме повідомлення про
потрібне встановлення у валідації, фіналізації та тексті посилання на документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким помічникам над
ширшими застарілими поверхнями:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових
  записів і резервного переходу до стандартного облікового запису
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного маршруту/конверта та
  зв’язування запису й диспетчеризації
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа, а також
  вихідних делегатів ідентичності/надсилання та планування корисного
  навантаження
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:` після того,
  як базовий ключ сесії все ще збігається. Plugin провайдера можуть
  перевизначати пріоритет, поведінку суфіксів і нормалізацію ідентифікаторів
  гілок, коли їхня платформа має нативну семантику доставки в гілки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок
  гілок і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла схема полів корисного навантаження агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких
  команд Telegram, валідації дублікатів/конфліктів і стабільного за резервним
  переходом контракту конфігурації команд

Канали лише для автентифікації зазвичай можуть зупинитися на стандартному шляху: ядро обробляє схвалення, а Plugin лише надає вихідні/автентифікаційні можливості. Нативні канали схвалення, як-от Matrix, Slack, Telegram і користувацькі чат-транспорти, мають використовувати спільні нативні помічники замість власноручної реалізації життєвого циклу схвалень.

## Політика вхідних згадок

Тримайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, яким володіє Plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики
згадок. Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам
потрібен ширший barrel вхідних помічників.

Добре підходить для локальної логіки Plugin:

- виявлення відповіді боту
- виявлення процитованого бота
- перевірки участі в гілці
- виключення сервісних/системних повідомлень
- нативні для платформи кеші, потрібні для підтвердження участі бота

Добре підходить для спільного помічника:

- `requireMention`
- результат явної згадки
- список дозволених неявних згадок
- обхід команд
- остаточне рішення пропустити

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

`api.runtime.channel.mentions` надає ті самі спільні помічники згадок для
вбудованих Plugin каналів, які вже залежать від ін’єкції середовища виконання:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження
непов’язаних вхідних помічників середовища виконання.

Старіші помічники `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код має
використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` — це те,
    що робить його Plugin каналу. Повну поверхню метаданих пакета див. у
    [Налаштування та конфігурація Plugin](/uk/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` валідує `plugins.entries.acme-chat.config`. Використовуйте її
    для налаштувань, якими володіє Plugin і які не є конфігурацією облікового
    запису каналу. `channelConfigs` валідує `channels.acme-chat` і є джерелом
    холодного шляху, яке використовують схема конфігурації, налаштування та
    UI-поверхні до завантаження середовища виконання Plugin.

  </Step>

  <Step title="Створіть об’єкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптерів.
    Почніть із мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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

    Для каналів, які приймають і канонічні DM-ключі верхнього рівня, і
    застарілі вкладені ключі, використовуйте помічники з
    `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`,
    `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і
    `normalizeChannelDmPolicy` зберігають локальні для облікового запису
    значення перед успадкованими кореневими значеннями. Поєднайте той самий
    резолвер із ремонтом doctor через `normalizeLegacyDmAliases`, щоб
    середовище виконання й міграція читали один і той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він зв’язує |
      | --- | --- |
      | `security.dm` | Обмежений DM-резолвер безпеки з полів конфігурації |
      | `pairing.text` | Текстовий потік DM-сполучення з обміном кодом |
      | `threading` | Резолвер режиму відповіді (фіксований, scoped за обліковим записом або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передати сирі об’єкти адаптерів замість декларативних
      параметрів, якщо вам потрібен повний контроль.

      Адаптери сирого вихідного доставлення можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язкове `ctx.formatting` передає рішення щодо форматування під час доставлення,
      як-от `maxLinesPerMessage`; застосовуйте його перед надсиланням, щоб гілкування відповідей
      і межі фрагментів один раз визначалися спільним вихідним доставленням.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли було визначено нативну ціль відповіді, тож допоміжні функції корисного навантаження можуть зберігати
      явні теги відповіді, не витрачаючи неявний одноразовий слот відповіді.
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

    Розмістіть CLI-дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для справжньої
    реєстрації команд. Залиште `registerFull(...)` для роботи, потрібної лише під час runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розв’язуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Add a setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не налаштований. Це запобігає підтягуванню важкого runtime-коду під час потоків налаштування.
    Докладніше див. [Налаштування й конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Канали з комплектного робочого простору, які виокремлюють безпечні для налаштування експорти в допоміжні
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний runtime-сетер на етапі налаштування.

  </Step>

  <Step title="Handle inbound messages">
    Ваш Plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    передає його через вхідний обробник вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен канальний Plugin володіє
      власним вхідним конвеєром. Перегляньте комплектні канальні Plugins
      (наприклад, пакет Plugin для Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Пишіть колоковані тести в `src/channel.test.ts`:

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

    Про спільні допоміжні засоби тестування див. [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані, прив’язані до облікового запису або користувацькі режими відповіді
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, підагент через api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/uk/plugins/sdk-channel-turn">
    Спільний життєвий цикл вхідного ходу: приймання, розв’язання, запис, передавання, завершення
  </Card>
</CardGroup>

<Note>
Деякі комплектні допоміжні шви все ще існують для обслуговування комплектних Plugins і
сумісності. Вони не є рекомендованим шаблоном для нових канальних Plugins;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не підтримуєте цю родину комплектних Plugins напряму.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повна довідка щодо імпорту підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugins](/uk/plugins/building-plugins)
- [Plugins агентного стенда](/uk/plugins/sdk-agent-harness)
