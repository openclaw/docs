---
read_when:
    - Ви створюєте новий плагін каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу обміну повідомленнями для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-25T02:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac64ec8cc8963eaa5aff862e9b318951a156f10c2f6963cd7fce24780fb028ac
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник допоможе вам створити плагін каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, паруванням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у ядрі. Ваш плагін відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM і списки дозволених
- **Pairing** — потік підтвердження DM
- **Session grammar** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як організуються потоки відповідей
- **Heartbeat typing** — необов’язкові сигнали typing/busy для цілей доставки heartbeat

Ядро відповідає за спільний інструмент повідомлень, прив’язку промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза межами вхідних відповідей,
надайте `heartbeat.sendTyping(...)` у плагіні каналу. Ядро викликає його з
визначеною ціллю доставки heartbeat до початку запуску моделі heartbeat і
використовує спільний життєвий цикл keepalive/cleanup для typing. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які передають джерела
медіа, надайте ці назви параметрів через `describeMessageTool(...).mediaSourceParams`.
Ядро використовує цей явний список для нормалізації шляхів sandbox і політики
доступу до вихідних медіа, тому плагінам не потрібні спеціальні випадки в
спільному ядрі для специфічних для провайдера параметрів аватара, вкладення
або обкладинки.
Рекомендується повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для
параметрів, які навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах
розмов, залишайте цей розбір у плагіні через `messaging.resolveSessionConversation(...)`.
Це канонічний хук для зіставлення `rawId` із базовим ідентифікатором розмови,
необов’язковим `thread` id, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для
bootstrap поверхню лише тоді, коли реєстр плагінів часу виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише
резервні батьківські значення поверх загального/сирого id. Якщо обидва хуки
існують, ядро спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не повертає.

## Підтвердження та можливості каналів

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/native/render/auth підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; ядро більше не читає хуки auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна межа для auth підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал надає native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у тому самому чаті. Ядро використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал native exec підтвердження, і включати канал до підказок резервного переходу для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, такої як приховування дубльованих локальних промптів підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або пригнічення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native-підтверджень, що належать каналу. Зберігайте його lazy на гарячих entrypoint каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може за потреби імпортувати модуль вашого часу виконання, водночас дозволяючи ядру збирати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь у вимкненому стані пояснювала точні параметри config, потрібні для ввімкнення native exec підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з областю видимості облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не значення верхнього рівня за замовчуванням.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власника, з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки в ядро.
- Якщо каналу потрібна native-доставка підтверджень, зосередьте код каналу на нормалізації цілі плюс фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і взяти на себе фільтрацію запитів, маршрутизацію, усунення дублікатів, завершення строку дії, підписку Gateway і сповіщення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших меж:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з native payload у стані pending/resolved/expired або з фінальними діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення native-повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать часу виконання, такі як client, token, Bolt app або Webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє ядру bootstrap capability-driven обробників зі стану запуску каналу без додавання обгорткового glue-коду, специфічного для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли межа capability-driven ще недостатньо виразна.
- Канали native-підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область видимості політики підтверджень для кількох облікових записів у межах правильного bot account, а `approvalKind` зберігає доступність поведінки exec і Plugin-підтверджень для каналу без жорстко закодованих розгалужень у ядрі.
- Ядро тепер також відповідає за сповіщення про перенаправлення підтверджень. Плагіни каналів не повинні надсилати власні follow-up повідомлення на кшталт «підтвердження надійшло в DM / інший канал» з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад у чат-ініціатор.
- Зберігайте тип id доставленого підтвердження наскрізно. Native-клієнти не повинні
  вгадувати чи переписувати маршрутизацію exec або Plugin-підтверджень на основі локального стану каналу.
- Різні типи підтверджень можуть навмисно надавати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступність native-маршрутизації підтверджень як для exec, так і для Plugin id.
  - Matrix зберігає ту саму native-маршрутизацію DM/каналу та UX реакцій для exec
    і Plugin-підтверджень, водночас дозволяючи auth відрізнятися залежно від типу підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу конструктору можливостей і надавати `approvalCapability` у плагіні.

Для гарячих entrypoint каналу надавайте перевагу вужчим підшляхам часу виконання, коли вам потрібна лише
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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша
узагальнена поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для часу виконання helper-и налаштування:
  безпечні для імпорту patched-адаптери налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  конструктори setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware межа адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює конструктори налаштування з необов’язковим встановленням
  плюс кілька примітивів, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth через env і загальні потоки startup/config
мають знати ці назви env до завантаження часу виконання, оголошуйте їх у
маніфесті плагіна через `channelEnvVars`. Зберігайте `envVars` часу виконання каналу
або локальні константи лише для операторського тексту.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або в перевірках SecretRef
до запуску часу виконання плагіна, додайте `openclaw.setupEntry` у `package.json`.
Ця entrypoint має бути безпечною для імпорту в read-only шляхах команд і
повертати метадані каналу, безпечний для setup адаптер config, адаптер status
і метадані цілей секретів каналу, потрібні для цих зведень. Не запускайте
clients, listeners або transport runtime з entry налаштування.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу межу `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише повідомляти «спочатку встановіть цей плагін» у поверхнях
налаштування, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard безпечно відмовляють у записах config і фіналізації та повторно
використовують те саме повідомлення про потрібне встановлення для валідації, finalize
і тексту з посиланням на документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config з кількома обліковими записами та
  резервного переходу до облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного route/envelope та
  прив’язки record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс вихідних
  делегатів identity/send і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Плагіни провайдерів можуть
  перевизначати пріоритет, поведінку суфіксів і нормалізацію thread id, коли їхня платформа
  має native-семантику доставки в потоки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язки потоків
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли застаріле
  компонування полів payload агента/медіа все ще потрібне
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  власних команд Telegram, валідації дублікатів/конфліктів і стабільного при резервному переході контракту config команд

Для каналів лише з auth зазвичай достатньо шляху за замовчуванням: ядро обробляє підтвердження, а плагін лише надає можливості outbound/auth. Канали native-підтверджень, такі як Matrix, Slack, Telegram і спеціальні chat-транспорти, мають використовувати спільні native helper-и замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Обробку вхідних згадок слід тримати розділеною на два шари:

- збирання доказів, що належить плагіну
- оцінка спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel helper-ів для вхідних даних.

Добре підходить для локальної логіки плагіна:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення сервісних/системних повідомлень
- специфічні для платформи native-кеші, потрібні для доведення участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- остаточне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадки.
2. Передайте ці факти до `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у своєму вхідному gate.

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

`api.runtime.channel.mentions` надає ті самі спільні helper-и для згадок для
вбудованих плагінів каналів, які вже залежать від injection часу виконання:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
helper-ів вхідного часу виконання.

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    робить цей плагін плагіном каналу. Повну поверхню метаданих пакета
    див. у [Налаштування плагіна та Config](/uk/plugins/sdk-setup#openclaw-channel):

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
    налаштувань, що належать плагіну і не є config облікового запису каналу. `channelConfigs`
    перевіряє `channels.acme-chat` і є джерелом холодного шляху, яке використовується config
    schema, setup і UI-поверхнями до завантаження часу виконання плагіна.

  </Step>

  <Step title="Створіть об’єкт плагіна каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть із
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

    <Accordion title="Що для вас робить createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Resolver безпеки DM з областю видимості на основі полів config |
      | `pairing.text` | Потік парування DM на основі тексту з обміном кодами |
      | `threading` | Resolver режиму reply-to (фіксований, з областю видимості облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ID повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Сирі outbound-адаптери можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язковий `ctx.formatting` містить рішення форматування на момент доставки,
      наприклад `maxLinesPerMessage`; застосовуйте його перед надсиланням, щоб потоки відповідей
      і межі chunk вирішувалися один раз спільною вихідною доставкою.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли було визначено native-ціль відповіді, щоб helper-и payload могли зберігати
      явні теги відповіді, не витрачаючи неявний одноразовий слот reply.
    </Accordion>

  </Step>

  <Step title="Підключіть entry point">
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
    міг показувати їх у кореневій довідці без активації повного часу виконання каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для фактичної
    реєстрації команд. Залишайте `registerFull(...)` для роботи лише під час виконання.
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністратора ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє це розділення режимів реєстрації. Див.
    [Entry Points](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте entry point для setup">
    Створіть `setup-entry.ts` для полегшеного завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повного entry, коли канал вимкнений
    або не налаштований. Це дає змогу уникнути підключення важкого коду часу виконання під час потоків setup.
    Докладніше див. у [Налаштування та Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані workspace-канали, які розділяють безпечні для setup експорти на sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter часу виконання для setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через вхідний обробник вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, яким керує плагін (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш вхідний обробник диспетчеризує повідомлення до OpenClaw.
          // Точна прив’язка залежить від SDK вашої платформи —
          // реальний приклад див. у пакеті вбудованого плагіна Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень є специфічною для каналу. Кожен плагін каналу
      відповідає за власний вхідний pipeline. Подивіться на вбудовані плагіни каналів
      (наприклад, пакет плагіна Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть колоковані тести у `src/channel.test.ts`:

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

    Для спільних helper-ів тестування див. [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі schema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні експорти часу виконання (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API client платформи
    └── runtime.ts            # Сховище часу виконання (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, з областю видимості облікового запису або власні режими відповіді
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper-и часу виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper-seam усе ще існують для підтримки вбудованих плагінів і
сумісності. Це не рекомендований шаблон для нових плагінів каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте безпосередньо це сімейство вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник щодо імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна schema маніфесту

## Пов’язане

- [Налаштування SDK плагіна](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни harness агента](/uk/plugins/sdk-agent-harness)
