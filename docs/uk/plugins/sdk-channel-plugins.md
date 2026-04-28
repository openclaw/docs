---
read_when:
    - Ви створюєте новий Plugin для каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-04-28T11:19:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70a3f8fb671c7291a0566f71a56e45232ed51bb43a8fe470e651a03e994e4aa2
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник описує створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, ланцюжками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою структурою
  пакета й налаштуванням маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти надсилання/редагування/реакцій. OpenClaw тримає один
спільний інструмент `message` у ядрі. Ваш плагін відповідає за:

- **Конфігурацію** — визначення облікового запису й майстер налаштування
- **Безпеку** — політику DM і списки дозволених
- **Сполучення** — процес підтвердження через DM
- **Граматику сесій** — те, як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами ланцюжків і резервними батьківськими варіантами
- **Вихідні повідомлення** — надсилання тексту, медіа й опитувань на платформу
- **Ланцюжки** — те, як відповіді об’єднуються в ланцюжки
- **Heartbeat-індикацію набору** — необов’язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у плагіні каналу. Ядро викликає його з
визначеною ціллю доставки Heartbeat перед запуском моделі Heartbeat і
використовує спільний життєвий цикл keepalive/очищення для індикації набору. Додайте `heartbeat.clearTyping(...)`,
якщо платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів sandbox і політики доступу до вихідних медіа,
тому плагінам не потрібні спеціальні випадки у спільному ядрі для специфічних для провайдера
параметрів аватара, вкладення або зображення обкладинки.
Бажано повертати карту з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додаткову область видимості всередині ідентифікаторів розмов, залиште цей розбір
у плагіні через `messaging.resolveSessionConversation(...)`. Це канонічний
гачок для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором ланцюжка,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батька до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду плагіна потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірній ланцюжок із його батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Помічник
нормалізує числові ідентифікатори ланцюжків так само, як це робить ядро, тому плагінам варто віддавати
йому перевагу над ситуативними порівняннями `String(threadId)`.
Плагіни зі специфічною для провайдера граматикою цілей можуть ін’єктувати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримувати ту саму форму цілі маршруту
та семантику резервного ланцюжка, яку використовує ядро.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для bootstrap поверхню
лише тоді, коли runtime-реєстр плагінів ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резерв сумісності, коли плагіну потрібні лише батьківські резервні варіанти поверх
загального/сирого ідентифікатора. Якщо існують обидва гачки, ядро спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, коли канонічний гачок
їх пропускає.

## Підтвердження й можливості каналів

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload-и кнопок підтвердження й загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативність/рендеринг/автентифікацію підтверджень у `approvalCapability`.
- `plugin.auth` призначено лише для входу/виходу; ядро більше не читає гачки автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним швом автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтверджень у тому самому чаті.
- Якщо ваш канал надає нативні exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану ініціювальної поверхні/нативного клієнта, коли він відрізняється від автентифікації підтверджень у тому самому чаті. Ядро використовує цей специфічний для exec гачок, щоб розрізняти `enabled` і `disabled`, вирішувати, чи підтримує ініціювальний канал нативні exec-підтвердження, і включати канал до підказок щодо резервного нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload-а, наприклад приховування дубльованих локальних prompt-ів підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних підтверджень або приглушення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для належних каналу фактів нативних підтверджень. Тримайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу й водночас дозволяє ядру зібрати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload-и підтверджень замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь у disabled-шляху пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних exec-підтверджень. Гачок отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи в межах облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, замість стандартних значень верхнього рівня.
- Якщо канал може вивести стабільні DM-ідентичності, подібні до власників, з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки ядра.
- Якщо каналу потрібна нативна доставка підтверджень, тримайте код каналу сфокусованим на нормалізації цілей і фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і відповідати за фільтрацію запитів, маршрутизацію, дедуплікацію, завершення строку дії, підписку Gateway і сповіщення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших швів:
- `createChannelNativeOriginTargetResolver` типово використовує спільний зіставник channel-route для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має специфічні для провайдера правила еквівалентності, наприклад зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` у `createChannelNativeOriginTargetResolver`, коли канал має канонізувати ідентифікатори провайдера перед запуском стандартного зіставника маршрутів або власного callback-а `targetsMatch`, зберігаючи початкову ціль для доставки. Використовуйте `normalizeTarget` лише тоді, коли саму визначену ціль доставки потрібно канонізувати.
- `availability` — чи налаштовано обліковий запис і чи має оброблятися запит
- `presentation` — зіставлення спільної view model підтвердження з pending/resolved/expired нативними payload-ами або фінальними діями
- `transport` — підготовка цілей і надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові гачки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові гачки діагностики доставки
- Якщо каналу потрібні об’єкти, якими володіє runtime, наприклад клієнт, токен, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає ядру змогу bootstrap-ити обробники, керовані можливостями, зі стану запуску каналу без додавання wrapper glue, специфічного для підтверджень.
- Звертайтеся до нижчерівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли шов на основі можливостей ще недостатньо виразний.
- Канали нативних підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці помічники. `accountId` утримує політику підтверджень для кількох облікових записів у межах правильного bot-облікового запису, а `approvalKind` зберігає доступність поведінки exec і plugin-підтверджень для каналу без жорстко закодованих гілок у ядрі.
- Ядро тепер також відповідає за сповіщення про перемаршрутизацію підтверджень. Плагінам каналів не слід надсилати власні подальші повідомлення "approval went to DMs / another channel" з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні помічники можливості підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте тип доставленого ідентифікатора підтвердження наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec і plugin-підтверджень зі стану, локального для каналу.
- Різні типи підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає нативну маршрутизацію підтверджень доступною і для exec-, і для plugin-ідентифікаторів.
  - Matrix зберігає ту саму нативну DM/канальну маршрутизацію й UX реакцій для exec-
    і plugin-підтверджень, водночас дозволяючи автентифікації відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` досі існує як wrapper сумісності, але новий код має віддавати перевагу builder-у можливостей і надавати `approvalCapability` у плагіні.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
одна частина цієї родини:

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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-
поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-безпечні помічники налаштування:
  import-safe адаптери патчів налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и налаштування optional-install
  плюс кілька setup-safe примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або автентифікацію, керовані env, і загальні startup/config
потоки мають знати ці назви env до завантаження runtime, оголосіть їх у
маніфесті плагіна через `channelEnvVars`. Залишайте runtime `envVars` каналу або локальні
константи лише для operator-facing тексту.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску runtime Plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в read-only шляхах
команд і має повертати метадані каналу, setup-safe адаптер конфігурації, адаптер
статусу та метадані цілей секретів каналу, потрібні для цих зведень. Не
запускайте клієнти, слухачі або transport runtimes із setup entry.

Також тримайте шлях імпорту основної точки входу каналу вузьким. Discovery може
оцінити entry і модуль Plugin каналу, щоб зареєструвати можливості без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт Plugin
каналу без імпорту setup wizards, транспортних клієнтів, socket listeners,
subprocess launchers або модулів запуску сервісу. Розміщуйте ці runtime-частини
в модулях, що завантажуються з `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам
  також потрібні важчі спільні помічники setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати «спочатку встановіть цей Plugin» у
setup-поверхнях, віддавайте перевагу `createOptionalChannelSetupSurface(...)`.
Згенерований adapter/wizard fail closed під час записів конфігурації та
finalization, і вони повторно використовують те саме повідомлення про потрібне
встановлення у validation, finalize та тексті посилання на docs.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким помічникам замість
ширших legacy-поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account конфігурації та
  fallback стандартного акаунта
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope та
  record-and-dispatch wiring
- `openclaw/plugin-sdk/messaging-targets` для parsing/matching цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  identity/send delegates і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:` після того,
  як базовий ключ сесії все ще збігається. Provider plugins можуть
  перевизначати пріоритет, поведінку suffix і нормалізацію thread id, коли їхня
  платформа має native thread delivery semantics.
- `openclaw/plugin-sdk/thread-bindings-runtime` для lifecycle thread-binding
  та реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли legacy layout поля
  agent/media payload усе ще потрібний
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації кастомних
  команд Telegram, перевірки дублікатів/конфліктів і fallback-stable контракту
  конфігурації команд

Auth-only канали зазвичай можуть зупинитися на стандартному шляху: core обробляє approvals, а Plugin лише надає outbound/auth можливості. Native approval channels, як-от Matrix, Slack, Telegram і custom chat transports, мають використовувати спільні native helpers замість створення власного approval lifecycle.

## Політика inbound-згадок

Тримайте обробку inbound-згадок розділеною на два шари:

- збирання evidence, яким володіє Plugin
- оцінювання спільної policy

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень
mention-policy. Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді,
коли вам потрібен ширший barrel inbound helpers.

Добре підходить для plugin-local логіки:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки thread-participation
- виключення service/system-message
- platform-native кеші, потрібні для доведення участі бота

Добре підходить для спільного helper:

- `requireMention`
- результат explicit mention
- implicit mention allowlist
- command bypass
- фінальне рішення skip

Рекомендований потік:

1. Обчисліть локальні факти mention.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому inbound gate.

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

`api.runtime.channel.mentions` надає ті самі спільні mention helpers для
bundled channel plugins, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження
непов’язаних inbound runtime helpers.

Старіші helpers `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як compatibility exports. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і manifest">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` — це те,
    що робить його Plugin каналу. Повну поверхню package-metadata дивіться в
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

    `configSchema` перевіряє `plugins.entries.acme-chat.config`. Використовуйте
    його для налаштувань, якими володіє Plugin і які не є конфігурацією акаунта
    каналу. `channelConfigs` перевіряє `channels.acme-chat` і є cold-path
    джерелом, яке використовують config schema, setup та UI-поверхні до
    завантаження runtime Plugin.

  </Step>

  <Step title="Побудуйте об’єкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових adapter surfaces.
    Почніть із мінімуму — `id` і `setup` — і додавайте adapters у міру потреби.

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

    <Accordion title="Що createChatChannelPlugin робить для вас">
      Замість ручної реалізації низькорівневих adapter interfaces ви передаєте
      декларативні options, а builder компонує їх:

      | Опція | Що вона підключає |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver з полів конфігурації |
      | `pairing.text` | Text-based DM pairing flow з обміном кодом |
      | `threading` | Reply-to-mode resolver (фіксований, account-scoped або custom) |
      | `outbound.attachedResults` | Функції надсилання, що повертають result metadata (message IDs) |

      Ви також можете передати raw adapter objects замість декларативних options,
      якщо вам потрібен повний контроль.

      Raw outbound adapters можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язкове `ctx.formatting` переносить delivery-time formatting decisions,
      такі як `maxLinesPerMessage`; застосуйте його перед надсиланням, щоб reply
      threading і межі chunk були один раз розв’язані спільною outbound delivery.
      Send contexts також містять `replyToIdSource` (`implicit` або `explicit`),
      коли native reply target було розв’язано, щоб payload helpers могли
      зберігати explicit reply tags без споживання implicit single-use reply slot.
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

    Розміщуйте CLI-дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для справжньої реєстрації
    команд. Залиште `registerFull(...)` для роботи, потрібної лише під час runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Основні адміністративні простори назв (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розвʼязуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Перегляньте
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry), щоб дізнатися про всі
    параметри.

  </Step>

  <Step title="Додайте запис налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повного запису, коли канал вимкнено
    або не налаштовано. Це дає змогу не підтягувати важкий код runtime під час потоків налаштування.
    Докладніше див. [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Канали bundled workspace, які відокремлюють безпечні для налаштування експорти в sidecar
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час налаштування.

  </Step>

  <Step title="Обробіть вхідні повідомлення">
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
      Обробка вхідних повідомлень залежить від каналу. Кожен channel Plugin володіє
      власним вхідним pipeline. Перегляньте bundled channel Plugins
      (наприклад, пакет Plugin Microsoft Teams або Google Chat) для реальних шаблонів.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тест">
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

    Спільні тестові помічники див. у [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані, привʼязані до облікового запису або власні режими відповіді
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Розвʼязання цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Помічники runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі bundled helper seams досі існують для підтримки bundled-plugin та
сумісності. Вони не є рекомендованим шаблоном для нових channel Plugins;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо ви не підтримуєте цю родину bundled Plugin безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту

## Повʼязане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugins](/uk/plugins/building-plugins)
- [Plugins для агентського harness](/uk/plugins/sdk-agent-harness)
