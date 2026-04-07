---
read_when:
    - Ви створюєте новий плагін каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу повідомлень для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-07T20:09:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23365b6d92006b30e671f9f0afdba40a2b88c845c5d2299d71c52a52985672f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник допоможе вам створити плагін каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, сполученням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у ядрі. Вашому плагіну належать:

- **Конфігурація** — визначення облікового запису та майстер налаштування
- **Безпека** — політика DM і списки дозволених
- **Сполучення** — потік підтвердження DM
- **Граматика сесії** — як ідентифікатори розмов, специфічні для провайдера, зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими елементами
- **Вихідні повідомлення** — надсилання тексту, медіа й опитувань на платформу
- **Потоки** — як групуються відповіді

Ядру належать спільний інструмент message, зв’язування промптів, зовнішня форма
ключа сесії, загальний облік `:thread:` і диспетчеризація.

Якщо ваша платформа зберігає додаткову область дії в ідентифікаторах розмов,
залишайте цей розбір у плагіні за допомогою
`messaging.resolveSessionConversation(...)`. Це канонічний хук для
зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором потоку, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть експортувати файл верхнього рівня `session-key-api.ts` із
відповідним експортом `resolveSessionConversation(...)`. Ядро використовує цю
безпечну для завантаження поверхню лише тоді, коли реєстр плагінів під час
виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише резервні
батьківські елементи поверх загального/raw id. Якщо наявні обидва хуки, ядро
спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
повертається до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не містить.

## Підтвердження та можливості каналів

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Ядру належать `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальна резервна доставка.
- Надавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/нативного відтворення/автентифікації підтверджень у `approvalCapability`.
- `plugin.auth` — лише login/logout; ядро більше не читає з цього об’єкта хуки автентифікації підтверджень.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — канонічний шов автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтверджень у тому самому чаті.
- Якщо ваш канал надає нативні підтвердження exec, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/нативного клієнта, коли він відрізняється від автентифікації підтверджень у тому самому чаті. Ядро використовує цей хук, специфічний для exec, щоб розрізняти `enabled` і `disabled`, вирішувати, чи підтримує канал ініціювання нативні підтвердження exec, і включати канал до підказок щодо резервного варіанту для нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дубльованих локальних підказок підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних підтверджень або придушення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативних підтверджень, що належать каналу. Зберігайте його лінивим у гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру збирати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтверджень замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних підтверджень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами повинні відтворювати шляхи з областю облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, а не значення верхнього рівня за замовчуванням.
- Якщо канал може виводити стабільні DM-ідентичності, схожі на власника, з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки ядра.
- Якщо каналу потрібна доставка нативних підтверджень, зосередьте код каналу на нормалізації цілі та фактах транспорту/подання. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, ідеально через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло збирати обробник і володіти фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою gateway і сповіщеннями про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших швів:
- `availability` — чи налаштований обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з нативними payload у станах pending/resolved/expired або фінальними діями
- `transport` — підготовка цілей і надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, наприклад клієнт, токен, застосунок Bolt або отримувач webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-контексту дозволяє ядру завантажувати обробники, керовані можливостями, зі стану запуску каналу без додавання обгорткового glue-коду, специфічного для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли шов, керований можливостями, ще недостатньо виразний.
- Канали з нативними підтвердженнями повинні маршрутизувати через ці helper-и і `accountId`, і `approvalKind`. `accountId` зберігає політику підтверджень для кількох облікових записів у правильній області бот-облікового запису, а `approvalKind` зберігає для каналу доступну поведінку підтверджень exec або плагіна без жорстко закодованих гілок у ядрі.
- Тепер ядру також належать сповіщення про перемаршрутизацію підтверджень. Плагіни каналів не повинні надсилати власні додаткові повідомлення на кшталт "підтвердження перейшло в DM / інший канал" із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад у чат ініціювання.
- Зберігайте наскрізно тип delivered approval id. Нативні клієнти не повинні вгадувати або переписувати маршрутизацію підтверджень exec чи plugin зі стану, локального для каналу.
- Різні типи підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступною нативну маршрутизацію підтверджень як для exec, так і для plugin id.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для підтверджень exec і plugin, водночас дозволяючи автентифікації відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу побудовнику можливостей і експортувати `approvalCapability` у плагіні.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам,
коли вам потрібна лише одна частина цієї родини:

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

Окремо для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для імпорту адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід нотаток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  побудовники setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware шов
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює побудовники setup
  з необов’язковим встановленням, а також кілька примітивів, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env і загальні потоки
startup/config повинні знати ці назви env ще до завантаження runtime,
оголошуйте їх у маніфесті плагіна через `channelEnvVars`. Зберігайте runtime
`envVars` каналу або локальні константи лише для текстів, орієнтованих на операторів.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший шов `openclaw/plugin-sdk/setup` лише тоді, коли вам
  також потрібні важчі спільні helper-и setup/config, наприклад
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише оголошувати "спочатку встановіть цей плагін" на
поверхнях setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`.
Згенеровані adapter/wizard працюють у безпечному зачиненому режимі щодо
записів конфігурації та фіналізації, а також повторно використовують те саме
повідомлення про необхідність встановлення у валідації, finalize і текстах
посилань на документацію.

Для інших гарячих шляхів каналів надавайте перевагу вузьким helper-ам замість
ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох
  облікових записів і резервного варіанта з обліковим записом за
  замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта
  вхідних повідомлень і зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа та
  делегатів identity/send для вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу
  прив’язок потоків і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще
  потрібне застаріле компонування полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  користувацьких команд Telegram, валідації дублікатів/конфліктів і стабільного
  для fallback контракту конфігурації команд

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: ядро
обробляє підтвердження, а плагін просто надає можливості outbound/auth. Канали
з нативними підтвердженнями, як-от Matrix, Slack, Telegram і користувацькі
chat-транспорти, мають використовувати спільні нативні helper-и замість
створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Розділяйте обробку вхідних згадок на два шари:

- збирання доказів, що належить плагіну
- спільна оцінка політики

Для спільного шару використовуйте `openclaw/plugin-sdk/channel-inbound`.

Добре підходить для локальної логіки плагіна:

- виявлення відповіді боту
- виявлення цитати бота
- перевірки участі в потоці
- виключення службових/системних повідомлень
- специфічні для платформи нативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- фінальне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадок.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у своїй вхідній перевірці.

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
вбудованих плагінів каналів, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
повинен використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    робить цей пакет плагіном каналу. Повну поверхню метаданих пакета див. у
    [Налаштування плагіна та конфігурація](/uk/plugins/sdk-setup#openclawchannel):

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

  <Step title="Створіть об’єкт плагіна каналу">
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

    <Accordion title="Що для вас робить createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви
      передаєте декларативні параметри, а побудовник їх компонуватиме:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Визначення політики DM з областю дії за полями конфігурації |
      | `pairing.text` | Потік текстового сполучення DM з обміном коду |
      | `threading` | Визначення режиму reply-to (фіксований, з областю облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних
      параметрів, якщо вам потрібен повний контроль.
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

    Розміщуйте дескриптори CLI, що належать каналу, у `registerCliMetadata(...)`,
    щоб OpenClaw міг показувати їх у кореневій довідці без активації повного
    runtime каналу, тоді як звичайні повні завантаження все одно підхоплюють
    ті самі дескриптори для реєстрації реальних команд. Зберігайте
    `registerFull(...)` для роботи лише під час runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністратора ядра
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються
    зарезервованими й завжди зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ за режимами реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry), щоб
    переглянути всі параметри.

  </Step>

  <Step title="Додайте запис setup">
    Створіть `setup-entry.ts` для полегшеного завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дозволяє не підтягувати важкий runtime-код під час
    потоків setup.
    Докладніше див. у [Setup і конфігурація](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи та пересилати їх у
    OpenClaw. Типовий шаблон — це webhook, який перевіряє запит і
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
      Обробка вхідних повідомлень є специфічною для каналу. Кожен плагін каналу
      володіє власним вхідним конвеєром. Дивіться на вбудовані плагіни каналів
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

    Спільні helper-и для тестування див. у [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # маніфест зі схемою конфігурації
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # публічні експорти (необов’язково)
├── runtime-api.ts            # внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # тести
    ├── client.ts             # клієнт API платформи
    └── runtime.ts            # сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими відповідей, режими з областю облікового запису або користувацькі
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper seams усе ще існують для підтримки вбудованих плагінів і
сумісності. Вони не є рекомендованим шаблоном для нових плагінів каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви безпосередньо не підтримуєте цю родину
вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з імпортів за підшляхами
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту
