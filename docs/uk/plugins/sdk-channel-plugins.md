---
read_when:
    - Ви створюєте новий плагін каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу обміну повідомленнями для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-10T20:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник покроково пояснює створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із захистом DM,
сполученням, потоками відповідей та вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає
один спільний інструмент `message` у core. Ваш плагін відповідає за:

- **Конфігурацію** — визначення облікового запису та майстер налаштування
- **Безпеку** — політику DM і allowlist-списки
- **Сполучення** — потік підтвердження DM
- **Граматику сесій** — як ідентифікатори розмов, специфічні для провайдера, відображаються на базові чати, ідентифікатори потоків і резервні батьківські значення
- **Вихідні повідомлення** — надсилання тексту, медіа та опитувань на платформу
- **Потоковість** — як організовуються потоки відповідей

Core відповідає за спільний інструмент повідомлень, підключення prompt, зовнішню форму ключа сесії,
загальне ведення обліку `:thread:` та диспетчеризацію.

Якщо ваша платформа зберігає додаткову область видимості всередині ідентифікаторів розмов,
залишайте цей парсинг у плагіні за допомогою `messaging.resolveSessionConversation(...)`. Це канонічний хук
для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором потоку,
явним `baseConversationId` та будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть експортувати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр runtime-плагінів ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як застарілий
резервний механізм сумісності, коли плагіну потрібні лише резервні батьківські значення
поверх загального/raw id. Якщо існують обидва хуки, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
повертається до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не вказує.

## Підтвердження та можливості каналу

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні payload-кнопок підтвердження та загальну резервну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, якщо каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/нативного режиму/рендерингу/автентифікації підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; core більше не читає хуки автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня для auth підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал надає нативні exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану ініціювальної поверхні/нативного клієнта, коли він відрізняється від auth підтвердження в тому самому чаті. Core використовує цей exec-специфічний хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал нативні exec-підтвердження, і включати канал до інструкцій резервного сценарію нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дубльованих локальних prompt-підтверджень або надсилання індикаторів набору тексту перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації підтверджень або придушення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативних підтверджень, що належать каналу. Зберігайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи core зібрати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкнений шлях пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних exec-підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи з областю облікового запису, такі як `channels.<channel>.accounts.<id>.execApprovals.*`, замість дефолтів верхнього рівня.
- Якщо канал може вивести стабільні DM-ідентичності на кшталт власника з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки підтверджень у core.
- Якщо каналу потрібна нативна доставка підтверджень, зосередьте код каналу на нормалізації цілі та фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати обробник і відповідати за фільтрацію запитів, маршрутизацію, dedupe, строки дії, підписку gateway та сповіщення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштований обліковий запис і чи потрібно обробляти запит
- `presentation` — відображення спільної view model підтверджень у нативні payload у станах pending/resolved/expired або фінальні дії
- `transport` — підготовка цілей, а також надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, наприклад клієнт, токен, застосунок Bolt або отримувач webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-контексту дає core змогу bootstrap-ити обробники на основі можливостей зі стану запуску каналу без додавання обгорток, специфічних для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, заснована на можливостях, ще недостатньо виразна.
- Канали з нативними підтвердженнями мають передавати через ці helper-и і `accountId`, і `approvalKind`. `accountId` зберігає політику підтверджень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає поведінку exec чи плагіна доступною для каналу без жорстко закодованих гілок у core.
- Тепер core також відповідає за сповіщення про повторну маршрутизацію підтверджень. Плагіни каналів не повинні надсилати власні додаткові повідомлення на кшталт «підтвердження перейшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтверджень і дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте тип ідентифікатора доставленого підтвердження від початку до кінця. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи plugin підтвердження на основі локального стану каналу.
- Різні типи підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні приклади вбудованих плагінів:
  - Slack зберігає нативну маршрутизацію підтверджень доступною як для exec-, так і для plugin-id.
  - Matrix зберігає ту саму нативну DM/канальну маршрутизацію та UX реакцій для exec
    і plugin-підтверджень, водночас дозволяючи auth відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має віддавати перевагу builder-у можливостей і експонувати `approvalCapability` у плагіні.

Для гарячих точок входу каналу віддавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша
узагальнювальна поверхня.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює runtime-безпечні helper-и setup:
  безпечні для імпорту patched-адаптери setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и setup для необов’язкового встановлення
  плюс кілька setup-безпечних примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env, і загальні потоки startup/config
мають знати ці env-імена до завантаження runtime, оголосіть їх у маніфесті плагіна через
`channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні константи лише для копірайту, видимого операторам.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати в поверхнях setup повідомлення «спочатку встановіть цей плагін»,
віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються з відмовою для записів конфігурації та фіналізації, і повторно використовують
те саме повідомлення про необхідність встановлення для перевірки, finalize і тексту з посиланням на документацію.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових записів та
  резервного переходу до облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для route/envelope вхідних повідомлень та
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для парсингу/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс
  делегатів ідентичності/надсилання вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібне
  застаріле компонування полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  перевірки дублікатів/конфліктів і стабільного резервного контракту конфігурації команд

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: core обробляє підтвердження, а плагін лише надає можливості outbound/auth. Канали з нативними підтвердженнями, такі як Matrix, Slack, Telegram і власні транспортні чати, мають використовувати спільні нативні helper-и замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, що належить плагіну
- спільне оцінювання політики

Використовуйте `openclaw/plugin-sdk/channel-inbound` для спільного рівня.

Добре підходить для локальної логіки плагіна:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- платформено-нативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід для команд
- фінальне рішення про пропуск

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

`api.runtime.channel.mentions` надає ті самі спільні helper-и згадок для
вбудованих плагінів каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорт сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json` —
    це те, що робить цей плагін плагіном каналу. Повну поверхню метаданих пакета
    див. у [Налаштування плагіна та конфігурація](/uk/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Підключіть OpenClaw до Acme Chat."
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
      "description": "Плагін каналу Acme Chat",
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
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть із
    мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

    Створіть `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ваш клієнт API платформи

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

      // Безпека DM: хто може писати боту
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Сполучення: потік підтвердження для нових контактів у DM
      pairing: {
        text: {
          idLabel: "Ім’я користувача Acme Chat",
          message: "Надішліть цей код, щоб підтвердити свою особу:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Потоковість: як доставляються відповіді
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: надсилання повідомлень на платформу
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

    <Accordion title="Що робить для вас createChatChannelPlugin">
      Замість того щоб вручну реалізовувати низькорівневі інтерфейси адаптера, ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Резолвер безпеки DM з областю дії на основі полів конфігурації |
      | `pairing.text` | Потік сполучення через текстовий DM з обміном кодом |
      | `threading` | Резолвер режиму відповіді (фіксований, з областю облікового запису або кастомний) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптера замість декларативних параметрів,
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
      description: "Плагін каналу Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Керування Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Керування Acme Chat",
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
    Якщо `registerFull(...)` реєструє gateway RPC-методи, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністратора core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    резолвляться в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри див. у [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує цей файл замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дозволяє уникнути підтягування важкого runtime-коду під час потоків setup.
    Докладніше див. у [Налаштування та конфігурація](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це webhook, який перевіряє запит і
    диспетчеризує його через вхідний обробник вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, керований плагіном (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш вхідний обробник диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // реальний приклад див. у вбудованому пакеті плагіна Microsoft Teams або Google Chat.
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
      за власний вхідний pipeline. Подивіться на вбудовані плагіни каналів
      (наприклад, пакет плагіна Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
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

    Спільні helper-и для тестування див. у [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою конфігурації
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # Клієнт API платформи
    └── runtime.ts            # Runtime-сховище (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоковості" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими відповіді, режими з областю облікового запису або кастомні режими
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Резолюція цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані поверхні helper-ів усе ще існують для супроводу вбудованих плагінів і
сумісності. Це не рекомендований шаблон для нових плагінів каналів;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не супроводжуєте безпосередньо цю сім’ю вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за підшляхами
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту
