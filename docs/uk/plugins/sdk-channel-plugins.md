---
read_when:
    - Ви створюєте новий плагін каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу повідомлень для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-07T18:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b709fda7527fcf437b119c4668172804f2f9c9a46f5e39a2161467a4f5f1e42f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник покроково пояснює створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
паруванням, гілкуванням відповідей і надсиланням вихідних повідомлень.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у ядрі. Ваш плагін відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM і списки дозволених
- **Pairing** — процес підтвердження DM
- **Session grammar** — як ідентифікатори розмов, специфічні для провайдера, зіставляються з базовими чатами, ідентифікаторами гілок і запасними батьківськими варіантами
- **Outbound** — надсилання тексту, медіа й опитувань на платформу
- **Threading** — як організовуються відповіді в гілки

Ядро відповідає за спільний інструмент message, зв’язування промптів, зовнішню форму
ключа сесії, загальний облік `:thread:` і диспетчеризацію.

Якщо ваша платформа зберігає додатковий контекст в ідентифікаторах розмов, залишайте цей
розбір у плагіні через `messaging.resolveSessionConversation(...)`. Це
канонічний хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх впорядкованими від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для
завантаження поверхню лише тоді, коли реєстр плагінів під час виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий запасний варіант для сумісності, коли плагіну потрібні лише
резервні батьківські варіанти поверх загального/raw id. Якщо існують обидва хуки, ядро спочатку
використовує `resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не повертає.

## Підтвердження та можливості каналу

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну запасну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, якщо каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Виносьте факти про доставку/нативний режим/рендеринг/автентифікацію підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; ядро більше не читає хуки автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шов автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтверджень у тому самому чаті.
- Якщо ваш канал надає нативні підтвердження exec, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану ініціювальної поверхні/нативного клієнта, коли він відрізняється від автентифікації підтверджень у тому самому чаті. Ядро використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал нативні підтвердження exec, і включати канал у рекомендації щодо запасного сценарію для нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дубльованих локальних запитів підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних підтверджень або придушення запасної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативного підтвердження, що належать каналу. Зберігайте його ледачим у гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру збирати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного рендера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкнений шлях пояснювала точні параметри config, потрібні для ввімкнення нативних підтверджень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з областю облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість верхньорівневих типових значень.
- Якщо канал може вивести стабільні схожі на власника DM-ідентичності з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки підтверджень у ядро.
- Якщо каналу потрібна доставка нативних підтверджень, зосередьте код каналу на нормалізації цілі плюс фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і взяти на себе фільтрацію запитів, маршрутизацію, усунення дублікатів, завершення строку дії, підписку шлюзу та сповіщення про перенаправлення. `nativeRuntime` поділено на кілька менших швів:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — перетворення спільної view model підтверджень у нативні payload очікування/вирішення/прострочення або фінальні дії
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от client, token, додаток Bolt або приймач webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє ядру ініціалізувати обробники на основі можливостей зі стану запуску каналу без додавання обгорток, специфічних для підтверджень.
- Звертайтеся до нижчорівневого `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли шов на основі можливостей ще недостатньо виразний.
- Канали з нативними підтвердженнями мають маршрутизувати і `accountId`, і `approvalKind` через ці помічники. `accountId` зберігає область політики підтверджень для багатьох облікових записів прив’язаною до правильного бот-акаунта, а `approvalKind` зберігає для каналу доступною поведінку підтверджень exec чи plugin без жорстко закодованих розгалужень у ядрі.
- Ядро тепер також відповідає за сповіщення про перенаправлення підтверджень. Плагіни каналів не повинні надсилати власні додаткові повідомлення на кшталт «підтвердження надійшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні помічники можливостей підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте тип delivered approval id наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію підтверджень exec чи plugin зі стану, локального для каналу.
- Різні типи підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні приклади вбудованих плагінів:
  - Slack зберігає доступною нативну маршрутизацію підтверджень як для exec, так і для plugin id.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для підтверджень exec
    і plugin, водночас дозволяючи автентифікації відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка для сумісності, але новий код має надавати перевагу будівнику можливостей і експонувати `approvalCapability` у плагіні.

Для гарячих точок входу каналу віддавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
одна частина цієї сім’ї:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша зонтична
поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime помічники налаштування:
  безпечні для імпорту адаптери патчів налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  будівники setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware шов адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює будівники налаштування з необов’язковим встановленням
  плюс кілька безпечних для налаштування примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth на основі env, і загальні процеси запуску/config
мають знати ці назви env до завантаження runtime, оголошуйте їх у
маніфесті плагіна через `channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні
константи лише для копірайту, орієнтованого на операторів.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший шов `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні помічники налаштування/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче повідомляти «спочатку встановіть цей плагін» на
поверхнях налаштування, віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard працюють за принципом fail closed для записів config і фіналізації, а також
повторно використовують те саме повідомлення про обов’язкове встановлення для валідації, фіналізації та тексту
з посиланням на документацію.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким помічникам над ширшими застарілими
поверхнями:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config багатьох облікових записів і
  запасного сценарію облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного маршруту/конверта та
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс делегатів
  ідентичності/надсилання вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок гілок
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише коли все ще потрібна застаріла
  схема полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації спеціальних команд Telegram,
  валідації дублікатів/конфліктів і стабільного при запасному сценарії контракту config команд

Канали лише з auth зазвичай можуть зупинитися на типовому шляху: ядро обробляє підтвердження, а плагін лише надає можливості outbound/auth. Канали з нативними підтвердженнями, як-от Matrix, Slack, Telegram і спеціальні транспортні канали чату, повинні використовувати спільні нативні помічники замість реалізації власного життєвого циклу підтверджень.

## Політика вхідних згадок

Розділяйте обробку вхідних згадок на два рівні:

- збирання доказів, що належить плагіну
- оцінювання спільної політики

Для спільного рівня використовуйте `openclaw/plugin-sdk/channel-inbound`.

Підходить для логіки, локальної для плагіна:

- виявлення відповіді боту
- виявлення цитування бота
- перевірки участі в гілці
- виключення сервісних/системних повідомлень
- платформонативні кеші, потрібні для доведення участі бота

Підходить для спільного помічника:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- остаточне рішення про пропуск

Рекомендований процес:

1. Обчисліть локальні факти згадки.
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

`api.runtime.channel.mentions` надає ті самі спільні помічники згадок для
вбудованих плагінів каналів, які вже залежать від інʼєкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Старіші помічники `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти для сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    робить це плагіном каналу. Повну поверхню метаданих пакета
    дивіться в [Налаштування плагіна і Config](/uk/plugins/sdk-setup#openclawchannel):

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

    <Accordion title="Що для вас робить createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів ви передаєте
      декларативні параметри, а будівник поєднує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Визначення DM-безпеки з областю дії з полів config |
      | `pairing.text` | Текстовий процес парування DM з обміном кодами |
      | `threading` | Визначення режиму reply-to (фіксований, з областю облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ID повідомлень) |

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

    Розміщуйте дескриптори CLI, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише під час runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністратора ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри дивіться в [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте точку входу налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу не підтягувати важкий runtime-код під час процесів налаштування.
    Докладніше дивіться в [Налаштування і Config](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи й переспрямовувати їх до
    OpenClaw. Типовий шаблон — це webhook, який перевіряє запит і
    диспетчеризує його через вхідний обробник вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен плагін каналу відповідає
      за власний вхідний конвеєр. Подивіться на вбудовані плагіни каналів
      (наприклад, пакет плагінів Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Спільні помічники тестування дивіться в [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API-клієнт платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри гілкування" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими відповіді, режими з областю облікового запису або власні
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Помічники runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані допоміжні шви все ще існують для підтримки вбудованих плагінів і
сумісності. Це не рекомендований шаблон для нових плагінів каналів;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте безпосередньо це сімейство вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту
