---
read_when:
    - Ви створюєте новий плагін каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу повідомлень для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-22T05:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник проводить через створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
спарюванням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для базової структури пакета
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає
один спільний інструмент `message` у ядрі. Ваш плагін відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM і списки дозволених
- **Pairing** — потік підтвердження DM
- **Граматика сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як організовуються потоки відповідей
- **Heartbeat typing** — необов’язкові сигнали typing/busy для цілей доставки Heartbeat

Ядро відповідає за спільний інструмент message, підключення промптів, зовнішню форму
ключа сесії, загальне ведення `:thread:` та диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, надайте
`heartbeat.sendTyping(...)` у плагіні каналу. Ядро викликає його з визначеною
ціллю доставки Heartbeat перед початком запуску моделі Heartbeat і
використовує спільний життєвий цикл підтримання typing keepalive/cleanup. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента message, які містять джерела медіа, надайте ці
імена параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів у sandbox і політики доступу до вихідних медіа,
тому плагінам не потрібні special case у спільному ядрі для специфічних для провайдера
параметрів avatar, attachment або cover-image.
Надавайте перевагу поверненню мапи з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах розмов, залишайте цей розбір
у плагіні через `messaging.resolveSessionConversation(...)`. Це канонічний хук для
зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором потоку,
явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського значення до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр плагінів runtime ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише
резервні батьківські значення поверх загального/raw id. Якщо існують обидва хуки, ядро використовує
спочатку `resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не вказує.

## Підтвердження та можливості каналів

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/native/render/auth для підтверджень у `approvalCapability`.
- `plugin.auth` — це лише login/logout; ядро більше не зчитує хуки auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня auth підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал надає native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у тому самому чаті. Ядро використовує цей exec-специфічний хук, щоб розрізняти `enabled` і `disabled`, вирішувати, чи підтримує ініціюючий канал native exec підтвердження, і включати канал до інструкцій резервного шляху native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дубльованих локальних промптів підтвердження або надсилання індикаторів typing перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або придушення резервного шляху.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native-підтверджень, що належать каналу. Залишайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль runtime за потреби, водночас дозволяючи ядру збирати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтверджень замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні ручки config, потрібні для ввімкнення native exec підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з областю видимості облікового запису, такі як `channels.<channel>.accounts.<id>.execApprovals.*`, а не значення верхнього рівня за замовчуванням.
- Якщо канал може виводити стабільні owner-подібні DM-ідентичності з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки в ядро.
- Якщо каналу потрібна native-доставка підтверджень, зосередьте код каналу на нормалізації цілей плюс фактах транспортування/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати handler і керувати фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою Gateway і повідомленнями про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з pending/resolved/expired native payload або фінальними діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення native-повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, наприклад client, token, Bolt app або Webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає ядру змогу bootstrap capability-driven handlers зі стану запуску каналу без додавання glue-коду, специфічного для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня на основі capabilities ще недостатньо виразна.
- Канали native-підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область видимості політики підтверджень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає поведінку exec порівняно з підтвердженнями Plugin доступною для каналу без жорстко закодованих гілок у ядрі.
- Тепер ядро також відповідає за повідомлення про повторну маршрутизацію підтверджень. Плагіни каналів не повинні надсилати власні follow-up повідомлення на кшталт «підтвердження пішло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад до чату-ініціатора.
- Зберігайте тип ідентифікатора доставленого підтвердження наскрізно. Native-клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи Plugin-підтверджень зі стану, локального для каналу.
- Різні типи підтверджень можуть навмисно надавати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає native-маршрутизацію підтверджень доступною як для exec, так і для ідентифікаторів plugin.
  - Matrix зберігає ту саму native-маршрутизацію DM/каналів і UX реакцій для exec
    і Plugin-підтверджень, водночас дозволяючи auth відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` все ще існує як обгортка сумісності, але новий код має надавати перевагу builder-у capabilities і надавати `approvalCapability` у плагіні.

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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-
поверхня.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для імпорту patched-адаптери setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и setup для optional-install
  плюс кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env і загальні потоки startup/config
мають знати ці env-імена до завантаження runtime, оголосіть їх у
маніфесті плагіна через `channelEnvVars`. Залишайте `envVars` runtime каналу або локальні
константи лише для копії, орієнтованої на операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску runtime плагіна, додайте `openclaw.setupEntry` у `package.json`.
Ця точка входу має бути безпечною для імпорту в read-only командних шляхах і
має повертати метадані каналу, безпечний для setup адаптер config, адаптер status
і метадані цілей секретів каналу, потрібні для цих зведень. Не запускайте clients, listeners
або transport runtime із точки входу setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче рекламувати «спочатку встановіть цей плагін» у поверхнях
setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються в безпечний спосіб під час запису config і завершення, а також повторно використовують
те саме повідомлення install-required у copy для валідації, finalize та посилань на документацію.

Для інших гарячих шляхів каналів надавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config з кількома обліковими записами та
  резервного шляху для облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного маршруту/envelope та
  підключення record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound-
  делегатів identity/send і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Плагіни провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію ідентифікаторів потоків, коли їхня платформа
  має native-семантику доставки в потоки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  та реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібне застаріле
  компонування полів payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  валідації дублікатів/конфліктів і стабільного контракту config команд для резервного шляху

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: ядро обробляє підтвердження, а плагін просто надає можливості outbound/auth. Канали native-підтверджень, такі як Matrix, Slack, Telegram і користувацькі чат-транспорти, мають використовувати спільні native helper-и замість реалізації власного життєвого циклу підтверджень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два шари:

- збирання доказів, що належить плагіну
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel допоміжних засобів для inbound.

Добре підходить для локальної логіки плагіна:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- native-кеші платформи, потрібні для доведення участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід команд
- фінальне рішення про пропуск

Бажаний потік:

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

`api.runtime.channel.mentions` надає ті самі спільні helper-и згадок для
вбудованих плагінів каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
helper-ів inbound runtime.

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорт для сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    робить це плагіном каналу. Повну поверхню метаданих пакета
    дивіться в [Налаштування плагіна та Config](/uk/plugins/sdk-setup#openclaw-channel):

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Побудуйте об’єкт плагіна каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть з
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
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а builder компонує їх:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-резолвер безпеки DM із полів config |
      | `pairing.text` | Потік спарювання DM на основі тексту з обміном кодами |
      | `threading` | Резолвер режиму reply-to (фіксований, у межах облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.
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
    тоді як звичайні повні завантаження все одно підхоплюють ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи, яка потрібна лише runtime.
    Якщо `registerFull(...)` реєструє gateway RPC-методи, використовуйте
    префікс, специфічний для плагіна. Простори назв адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для полегшеного завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підключення важкого runtime-коду під час потоків setup.
    Докладніше див. у [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали workspace, які розділяють безпечні для setup експорти в sidecar-
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setup-time setter runtime.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Вашому плагіну потрібно отримувати повідомлення з платформи та переспрямовувати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через inbound handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, керований плагіном (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш inbound handler диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // реальний приклад дивіться у пакеті вбудованого плагіна Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень залежить від каналу. Кожен плагін каналу відповідає
      за власний вхідний конвеєр. Подивіться на вбудовані плагіни каналів
      (наприклад, пакет плагіна Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
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

    Спільні helper-и для тестів дивіться в [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою config
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

## Додаткові теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими reply, режими в межах облікового запису або користувацькі режими
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper-и runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі поверхні вбудованих helper-ів усе ще існують для підтримки вбудованих плагінів і
сумісності. Це не рекомендований шаблон для нових плагінів каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви безпосередньо не підтримуєте цю родину вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту
