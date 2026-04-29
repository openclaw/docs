---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin-ів каналів
x-i18n:
    generated_at: "2026-04-29T15:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03384057a4316b87c6088d3859d16ed4546c803f7c64639cd12be293f4841258
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Цей посібник покроково показує, як створити Plugin каналу, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
спарюванням, ланцюжками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб дізнатися про базову структуру
  пакета та налаштування маніфесту.
</Info>

## Як працюють Plugins каналів

Plugins каналів не потребують власних інструментів надсилання/редагування/реакцій. OpenClaw тримає один
спільний інструмент `message` у ядрі. Ваш Plugin відповідає за:

- **Конфігурація** — визначення акаунта та майстер налаштування
- **Безпека** — політика DM та списки дозволених
- **Спарювання** — потік підтвердження через DM
- **Граматика сесії** — як ідентифікатори розмов конкретного провайдера відображаються на базові чати, ідентифікатори ланцюжків і батьківські резервні варіанти
- **Вихідні повідомлення** — надсилання тексту, медіа та опитувань на платформу
- **Ланцюжки** — як групуються відповіді
- **Heartbeat typing** — необов'язкові сигнали набору/зайнятості для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, експонуйте
`heartbeat.sendTyping(...)` у Plugin каналу. Ядро викликає його з
визначеною ціллю доставки Heartbeat перед початком запуску моделі Heartbeat і
використовує спільний життєвий цикл підтримання/очищення індикатора набору. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, що несуть джерела медіа, експонуйте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів sandbox і політики доступу до вихідних медіа,
тож Plugins не потребують спеціальних випадків у спільному ядрі для параметрів аватарів,
вкладень або обкладинок, специфічних для провайдера.
Бажано повертати мапу за ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов'язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для всіх експонованих дій.

Якщо ваша платформа зберігає додатковий scope всередині ідентифікаторів розмов, тримайте цей парсинг
у Plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний хук для відображення `rawId` на базовий ідентифікатор розмови, необов'язковий ідентифікатор ланцюжка,
явний `baseConversationId` і будь-які `parentConversationCandidates`.
Коли повертаєте `parentConversationCandidates`, тримайте їх упорядкованими від
найвужчого батьківського елемента до найширшої/базової розмови.

Використовуйте `openclaw/plugin-sdk/channel-route`, коли коду Plugin потрібно нормалізувати
поля, схожі на маршрути, порівняти дочірній ланцюжок із його батьківським маршрутом або побудувати
стабільний ключ дедуплікації з `{ channel, to, accountId, threadId }`. Помічник
нормалізує числові ідентифікатори ланцюжків так само, як це робить ядро, тому Plugins мають віддавати
йому перевагу над ситуативними порівняннями `String(threadId)`.
Plugins із граматикою цілей, специфічною для провайдера, можуть інжектувати свій парсер у
`resolveChannelRouteTargetWithParser(...)` і все одно отримувати ту саму форму цілі маршруту
та семантику резервного ланцюжка, яку використовує ядро.

Вбудовані Plugins, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть експонувати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для bootstrap поверхню
лише тоді, коли runtime-реєстр Plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резерв сумісності, коли Plugin потребує лише батьківських резервних варіантів поверх
загального/raw ідентифікатора. Якщо існують обидва хуки, ядро спершу використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише
переходить до `resolveParentConversationCandidates(...)`, коли канонічний хук
їх пропускає.

## Підтвердження та можливості каналу

Більшості Plugins каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за same-chat `/approve`, спільні payload підтверджувальних кнопок і загальну резервну доставку.
- Віддавайте перевагу одному об'єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/native/render/auth для підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для входу/виходу; ядро більше не читає хуки auth підтверджень із цього об'єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` є канонічним seam auth підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth same-chat підтверджень.
- Якщо ваш канал експонує native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth same-chat підтверджень. Ядро використовує цей exec-специфічний хук, щоб розрізняти `enabled` і `disabled`, вирішувати, чи підтримує початковий канал native exec підтвердження, і включати канал у fallback-підказки native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дубльованих локальних промптів підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації native підтверджень або пригнічення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native підтверджень, якими володіє канал. Тримайте його lazy на гарячих entrypoints каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру зібрати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь disabled-path пояснювала точні перемикачі конфігурації, потрібні для ввімкнення native exec підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими акаунтами мають рендерити шляхи в межах акаунта, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість top-level defaults.
- Якщо канал може вивести стабільні owner-like DM ідентичності з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити same-chat `/approve` без додавання логіки ядра, специфічної для підтверджень.
- Якщо каналу потрібна доставка native підтверджень, зосередьте код каналу на нормалізації цілі та фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати handler і відповідати за фільтрацію запитів, маршрутизацію, дедуплікацію, завершення терміну дії, підписку Gateway і сповіщення про маршрутизацію в інше місце. `nativeRuntime` розділено на кілька менших seam:
- `createChannelNativeOriginTargetResolver` за замовчуванням використовує спільний matcher channel-route для цілей `{ to, accountId, threadId }`. Передавайте `targetsMatch` лише тоді, коли канал має специфічні для провайдера правила еквівалентності, наприклад зіставлення префікса timestamp у Slack.
- Передавайте `normalizeTargetForMatch` у `createChannelNativeOriginTargetResolver`, коли каналу потрібно канонізувати ідентифікатори провайдера перед запуском стандартного route matcher або власного callback `targetsMatch`, зберігаючи оригінальну ціль для доставки. Використовуйте `normalizeTarget` лише тоді, коли саму визначену ціль доставки потрібно канонізувати.
- `availability` — чи налаштовано акаунт і чи потрібно обробляти запит
- `presentation` — відображає спільну view model підтвердження в pending/resolved/expired native payload або фінальні дії
- `transport` — готує цілі та надсилає/оновлює/видаляє native повідомлення підтвердження
- `interactions` — необов'язкові хуки bind/unbind/clear-action для native кнопок або реакцій
- `observe` — необов'язкові хуки діагностики доставки
- Якщо каналу потрібні runtime-об'єкти, якими він володіє, наприклад client, token, Bolt app або webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає ядру змогу bootstrap capability-driven handlers зі стану запуску каналу без додавання glue wrapper, специфічного для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли capability-driven seam ще недостатньо виразний.
- Канали native підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helpers. `accountId` утримує політику підтверджень для кількох акаунтів у межах правильного bot account, а `approvalKind` зберігає поведінку exec і plugin підтверджень доступною для каналу без hardcoded branches у ядрі.
- Тепер ядро також відповідає за сповіщення про reroute підтверджень. Plugins каналів не мають надсилати власні follow-up повідомлення "підтвердження пішло в DM / інший канал" із `createChannelNativeApprovalRuntime`; натомість експонуйте точну маршрутизацію origin + approver-DM через спільні helpers capability підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад у початковий чат.
- Зберігайте тип доставленого ідентифікатора підтвердження end-to-end. Native clients не повинні
  вгадувати або переписувати маршрутизацію exec vs plugin підтверджень зі стану, локального для каналу.
- Різні типи підтверджень можуть навмисно експонувати різні native поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає native маршрутизацію підтверджень доступною і для exec, і для plugin ids.
  - Matrix зберігає ту саму native маршрутизацію DM/каналу та UX реакцій для exec
    і plugin підтверджень, водночас дозволяючи auth відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` все ще існує як wrapper сумісності, але новий код має віддавати перевагу builder capability і експонувати `approvalCapability` у Plugin.

Для гарячих entrypoints каналу віддавайте перевагу вужчим runtime subpaths, коли вам потрібна лише
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

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella
поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-safe helpers налаштування:
  import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builders setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builders налаштування optional-install
  плюс кілька setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth на основі env і загальні потоки startup/config
мають знати ці env назви до завантаження runtime, оголосіть їх у
маніфесті Plugin через `channelEnvVars`. Тримайте runtime `envVars` каналу або локальні
константи лише для operator-facing copy.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску середовища виконання plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в шляхах команд
лише для читання й має повертати метадані каналу, безпечний для налаштування адаптер конфігурації, адаптер статусу
та метадані цілі секретів каналу, потрібні для цих зведень. Не
запускайте клієнти, слухачі або транспортні середовища виконання з точки входу налаштування.

Також тримайте шлях імпорту основної точки входу каналу вузьким. Виявлення може оцінити
точку входу й модуль channel plugin, щоб зареєструвати можливості без активації
каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт channel
plugin без імпорту майстрів налаштування, транспортних клієнтів, socket
listeners, засобів запуску підпроцесів або модулів запуску сервісу. Розміщуйте ці runtime
частини в модулях, завантажених із `registerFull(...)`, runtime setters або lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні помічники налаштування/конфігурації, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише показувати "спершу встановіть цей plugin" на поверхнях
налаштування, віддайте перевагу `createOptionalChannelSetupSurface(...)`. Згенерований
адаптер/майстер fail closed під час записів конфігурації та фіналізації, і вони повторно використовують
те саме повідомлення про обов’язкове встановлення у валідації, фіналізації та тексті
посилання на документацію.

Для інших гарячих шляхів каналів віддавайте перевагу вузьким помічникам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, і
  `openclaw/plugin-sdk/account-helpers` для багаторахункової конфігурації та
  fallback для стандартного акаунта
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope та
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  identity/send delegates і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Provider plugins можуть перевизначати
  пріоритет, поведінку суфікса та нормалізацію thread id, коли їхня платформа
  має нативну семантику доставки в thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації адаптера
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна застаріла розкладка полів agent/media
  payload
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  валідації дублікатів/конфліктів і fallback-stable контракту конфігурації
  команд

Канали лише з автентифікацією зазвичай можуть зупинитися на стандартному шляху: core обробляє approvals, а plugin лише відкриває outbound/auth можливості. Нативні канали approval, такі як Matrix, Slack, Telegram і користувацькі chat transports, мають використовувати спільні нативні помічники замість написання власного життєвого циклу approval.

## Політика inbound згадок

Тримайте обробку inbound згадок розділеною на два шари:

- збирання доказів, що належить plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень mention-policy.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший inbound
barrel помічників.

Добре підходить для plugin-local логіки:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки thread-participation
- виключення service/system-message
- platform-native кеші, потрібні для доведення участі bot

Добре підходить для спільного помічника:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід команд
- остаточне рішення про пропуск

Бажаний потік:

1. Обчисліть локальні факти згадок.
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

`api.runtime.channel.mentions` відкриває ті самі спільні помічники згадок для
вбудованих channel plugins, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних inbound
runtime helpers.

Старіші помічники `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий огляд

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json` — це
    те, що робить це channel plugin. Повну поверхню package-metadata див.
    у [Налаштування й конфігурація Plugin](/uk/plugins/sdk-setup#openclaw-channel):

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
    налаштувань, що належать plugin і не є конфігурацією акаунта каналу. `channelConfigs`
    валідує `channels.acme-chat` і є cold-path джерелом, яке використовують schema конфігурації,
    налаштування та UI поверхні до завантаження runtime plugin.

  </Step>

  <Step title="Побудуйте об’єкт channel plugin">
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

    Для каналів, які приймають і канонічні top-level DM keys, і застарілі вкладені ключі, використовуйте помічники з `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` і `normalizeChannelDmPolicy` тримають account-local значення попереду успадкованих root значень. Поєднайте той самий resolver із doctor repair через `normalizeLegacyDmAliases`, щоб runtime і migration читали той самий контракт.

    <Accordion title="Що createChatChannelPlugin робить за вас">
      Замість того, щоб реалізовувати низькорівневі інтерфейси адаптерів вручну, ви передаєте
      декларативні параметри, а builder компонуватиме їх:

      | Параметр | Що він зв’язує |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver з полів конфігурації |
      | `pairing.text` | Текстовий потік DM pairing з обміном кодом |
      | `threading` | Resolver режиму reply-to (фіксований, account-scoped або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають result metadata (message IDs) |

      Ви також можете передати необроблені об’єкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Raw outbound adapters may define a `chunker(text, limit, ctx)` function.
      The optional `ctx.formatting` carries delivery-time formatting decisions
      such as `maxLinesPerMessage`; apply it before sending so reply threading
      and chunk boundaries are resolved once by shared outbound delivery.
      Send contexts also include `replyToIdSource` (`implicit` or `explicit`)
      when a native reply target was resolved, so payload helpers can preserve
      explicit reply tags without consuming an implicit single-use reply slot.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    Create `index.ts`:

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
    реєстрації команд. Залиште `registerFull(...)` для роботи, потрібної лише під час runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Основні адміністративні простори імен (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розв’язуються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Add a setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дає змогу не підтягувати важкий runtime-код під час потоків налаштування.
    Докладніше див. [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Канали bundled workspace, які виносять setup-safe експорти в sidecar
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Handle inbound messages">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий патерн — Webhook, який перевіряє запит і
    передає його через inbound-обробник вашого каналу:

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
      Обробка inbound-повідомлень є специфічною для каналу. Кожен channel Plugin володіє
      власним inbound pipeline. Перегляньте bundled channel Plugins
      (наприклад, пакет Plugin для Microsoft Teams або Google Chat) для реальних патернів.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Пишіть colocated тести в `src/channel.test.ts`:

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

    Для спільних test helpers див. [Тестування](/uk/plugins/sdk-testing).

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
    Фіксовані, account-scoped або користувацькі режими відповіді
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі bundled helper seams досі існують для супроводу bundled-plugin і
сумісності. Вони не є рекомендованим патерном для нових channel Plugins;
віддавайте перевагу generic channel/setup/reply/runtime subpaths зі спільної поверхні SDK,
якщо ви не супроводжуєте цю сім’ю bundled Plugins безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти й contract tests
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugins](/uk/plugins/building-plugins)
- [Agent harness Plugins](/uk/plugins/sdk-agent-harness)
