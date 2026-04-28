---
read_when:
    - Ви створюєте новий Plugin каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу повідомлень для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-04-28T00:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f005ea0e7928dfb055758e928f10a333979c8e67a0b85353d663940abb6a7b4
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник проведе вас через створення Plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
паруванням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють Plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш Plugin відповідає за:

- **Конфігурацію** — визначення облікового запису та майстер налаштування
- **Безпеку** — політику DM та списки дозволених
- **Парування** — потік підтвердження DM
- **Граматику сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Вихідні повідомлення** — надсилання тексту, медіа та опитувань на платформу
- **Потоки** — як групуються відповіді
- **Набір Heartbeat typing** — необов’язкові сигнали набору/зайнятості для цілей доставки heartbeat

Core відповідає за спільний інструмент message, підключення prompt, зовнішню форму ключа сесії,
загальний облік `:thread:` та диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза межами вхідних відповідей, надайте
`heartbeat.sendTyping(...)` у Plugin каналу. Core викликає його з
визначеною ціллю доставки heartbeat перед початком запуску моделі heartbeat і
використовує спільний життєвий цикл keepalive/cleanup для набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента message, що містять джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів sandbox і політики доступу до вихідних медіа,
щоб Plugin не потребували особливих випадків у спільному core для специфічних для провайдера
параметрів avatar, attachment або cover-image.
Краще повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах розмов, тримайте цей
розбір у Plugin за допомогою `messaging.resolveSessionConversation(...)`. Це
канонічний хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором потоку, явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
поля, схожі на route, порівняти дочірній потік з його батьківським route або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Цей helper
нормалізує числові ідентифікатори потоків так само, як це робить core, тому Plugin мають
надавати йому перевагу замість спеціальних порівнянь `String(threadId)`.
Plugin зі специфічною для провайдера граматикою цілі можуть передати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримати ту саму форму route target
і семантику резервного потоку, яку використовує core.

Вбудовані Plugin, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр Plugin середовища виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий сумісний резервний варіант, коли Plugin потребує лише батьківських резервних значень
поверх загального/raw id. Якщо існують обидва хуки, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і переходить до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний хук їх
не повертає.

## Підтвердження та можливості каналу

Більшості Plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` вилучено. Розміщуйте факти про доставку/native/render/auth підтверджень у `approvalCapability`.
- `plugin.auth` — лише для login/logout; core більше не читає хуки auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шов auth для підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал надає native exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у тому самому чаті. Core використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал native exec-підтвердження, і включати канал у резервні вказівки для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дубльованих локальних prompt підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або пригнічення резервного варіанту.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native-підтверджень, що належать каналу. Тримайте його лінивим у гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль runtime за запитом, водночас дозволяючи core збирати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкнений шлях пояснювала точні параметри конфігурації, потрібні для ввімкнення native exec-підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи з областю дії облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не top-level значення за замовчуванням.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власників, з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки, специфічної для підтверджень, у core.
- Якщо каналу потрібна native-доставка підтверджень, тримайте код каналу зосередженим на нормалізації цілі та фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати обробник і керувати фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою Gateway та сповіщеннями про перенаправлення в інше місце. `nativeRuntime` поділено на кілька менших швів:
- `createChannelNativeOriginTargetResolver` типово використовує спільний matcher channel-route для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має специфічні для провайдера правила еквівалентності, наприклад зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` у `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати ідентифікатори провайдера перед запуском типового matcher route або власного callback `targetsMatch`, зберігаючи початкову ціль для доставки. Використовуйте `normalizeTarget` лише тоді, коли сама визначена ціль доставки має бути канонізована.
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з pending/resolved/expired native payload або фінальними діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення native-повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от client, token, застосунок Bolt або отримувач Webhook, зареєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає core змогу ініціалізувати обробники, керовані можливостями, зі стану запуску каналу без додавання обгорткового glue, специфічного для підтверджень.
- Використовуйте нижчорівневі `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли шов, керований можливостями, ще недостатньо виразний.
- Канали native-підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper. `accountId` зберігає політику підтверджень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає доступність поведінки exec проти Plugin-підтверджень для каналу без жорстко закодованих розгалужень у core.
- Core тепер також відповідає за сповіщення про перенаправлення підтверджень. Plugin каналів не повинні надсилати власні подальші повідомлення на кшталт «підтвердження перейшло в DM / в інший канал» з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper можливостей підтвердження та дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте тип delivered approval id від початку до кінця. Native-клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи Plugin-підтверджень на основі локального для каналу стану.
- Різні види підтверджень можуть навмисно надавати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступність native-маршрутизації підтверджень як для exec, так і для Plugin id.
  - Matrix зберігає ту саму native DM/channel-маршрутизацію та UX реакцій для exec
    і Plugin-підтверджень, водночас дозволяючи auth відрізнятися за видом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу builder можливостей і надавати `approvalCapability` у Plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим підшляхам runtime, коли вам потрібна лише
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша
загальна поверхня.

Окремо для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper setup:
  безпечні для імпорту адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і builder delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder optional-install setup
  плюс кілька примітивів, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth, керовані env, і загальні потоки startup/config
мають знати ці імена env до завантаження runtime, оголосіть їх у маніфесті Plugin через
`channelEnvVars`. Зберігайте `envVars` runtime каналу або локальні константи лише для копії, видимої оператору.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску runtime Plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в командних шляхах лише для читання
і повинна повертати метадані каналу, безпечний для setup адаптер конфігурації, адаптер status і метадані цілі секретів каналу, потрібні для цих зведень. Не
запускайте clients, listeners або transport runtime з точки входу setup.

Також тримайте вузьким шлях імпорту основної точки входу каналу. Під час виявлення можуть оцінюватися
точка входу та модуль Plugin каналу для реєстрації можливостей без активації каналу.
Такі файли, як `channel-plugin-api.ts`, мають експортувати об’єкт Plugin каналу без імпорту
майстрів setup, transport clients, socket listeners, launcher підпроцесів або модулів запуску сервісів. Розміщуйте ці частини runtime в модулях, які завантажуються з `registerFull(...)`, setter runtime або лінивих адаптерів можливостей.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати «спочатку встановіть цей Plugin» у поверхнях
setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються за замовчуванням для записів конфігурації та фіналізації й повторно використовують
те саме повідомлення про потребу встановлення для validation, finalize і копії з посиланням на документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації з кількома обліковими записами та
  резервного варіанту default-account
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для route/envelope вхідних повідомлень та
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс делегатів
  ідентифікації/надсилання вихідних повідомлень і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний route має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`,
  якщо базовий ключ сесії все ще збігається. Plugin провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію ідентифікаторів потоків, якщо їхня платформа
  має нативну семантику доставки в потоки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла схема полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  користувацьких команд Telegram, validation дублікатів/конфліктів і стабільного при резервних варіантах контракту конфігурації команд

Канали лише з auth зазвичай можуть зупинитися на типовому шляху: core обробляє підтвердження, а Plugin лише надає можливості outbound/auth. Канали з native-підтвердженнями, як-от Matrix, Slack, Telegram і власні chat transport, мають використовувати спільні native-helper замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Тримайте обробку вхідних згадок розділеною на два шари:

- збирання доказів, що належить Plugin
- спільне оцінювання політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel helper для вхідних повідомлень.

Добре підходить для локальної логіки Plugin:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- нативні для платформи кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід команд
- остаточне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадок.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому вхідному gate.

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

`api.runtime.channel.mentions` надає ті самі спільні helper для згадок для
вбудованих Plugin каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
helper runtime для вхідних повідомлень.

Старіші helper `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json`
    робить це Plugin каналу. Для повної поверхні метаданих пакета
    див. [Налаштування та конфігурація Plugin](/uk/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` валідує `plugins.entries.acme-chat.config`. Використовуйте його для
    налаштувань, що належать Plugin і не є конфігурацією облікового запису каналу. `channelConfigs`
    валідує `channels.acme-chat` і є джерелом холодного шляху, яке використовують схема конфігурації,
    setup і поверхні UI до завантаження runtime Plugin.

  </Step>

  <Step title="Побудуйте об’єкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптерів. Почніть із
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

    <Accordion title="Що `createChatChannelPlugin` робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-резолвер безпеки DM з полів конфігурації |
      | `pairing.text` | Потік парування DM на основі тексту з обміном кодами |
      | `threading` | Резолвер режиму reply-to (фіксований, прив’язаний до облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Сирі адаптери outbound можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язковий `ctx.formatting` містить рішення щодо форматування під час доставки,
      такі як `maxLinesPerMessage`; застосовуйте їх перед надсиланням, щоб потоки відповідей
      і межі chunk були визначені один раз спільною доставкою outbound.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли було визначено нативну ціль відповіді, щоб helper payload могли зберігати
      явні теги відповіді без використання неявного одноразового слота reply.
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

    Розміщуйте дескриптори CLI, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    водночас звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише в runtime.
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє це розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для полегшеного завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підтягування важкого коду runtime під час потоків setup.
    Докладніше див. у [Setup і конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які виносять безпечні для setup експорти в sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime на час setup.

  </Step>

  <Step title="Обробіть вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через обробник вхідних повідомлень вашого каналу:

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
      Обробка вхідних повідомлень є специфічною для каналу. Кожен Plugin каналу
      відповідає за власний конвеєр вхідних повідомлень. Подивіться на вбудовані Plugin каналів
      (наприклад, пакет Plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть colocated-тести в `src/channel.test.ts`:

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

    Спільні helper для тестування див. у [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою конфігурації
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні експорти runtime (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API-клієнт платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, прив’язані до облікового запису або власні режими reply
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper seam усе ще існують для підтримки вбудованих Plugin і
сумісності. Вони не є рекомендованим шаблоном для нових Plugin каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте цю сім’ю вбудованих Plugin безпосередньо.
</Note>

## Наступні кроки

- [Plugin провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з імпортів за підшляхами
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Setup Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Plugin обв’язки агента](/uk/plugins/sdk-agent-harness)
