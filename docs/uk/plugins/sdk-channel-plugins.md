---
read_when:
    - Ви створюєте новий плагін каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу обміну повідомленнями для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-24T03:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

У цьому посібнику розглянуто створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
сполученням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакунка
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає
один спільний інструмент `message` у core. Ваш плагін відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM і списки дозволених
- **Pairing** — потік підтвердження DM
- **Граматика сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа й опитувань на платформу
- **Потоки** — як організовано потоки відповідей
- **Heartbeat typing** — необов’язкові сигнали набору/зайнятості для цілей доставки heartbeat

Core відповідає за спільний інструмент повідомлень, підключення prompt, зовнішню форму ключа сесії,
загальне ведення `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору тексту поза межами вхідних відповідей,
експонуйте `heartbeat.sendTyping(...)` у плагіні каналу. Core викликає його з
визначеною ціллю доставки heartbeat до початку запуску моделі heartbeat і
використовує спільний життєвий цикл підтримання набору/очищення. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа, експонуйте ці
імена параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів у sandbox і політики доступу до вихідних медіа,
тому плагінам не потрібні особливі випадки в shared-core для специфічних для провайдера
параметрів аватара, вкладення або обкладинки.
Переважно повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов’язані дії не
успадковували медіапараметри іншої дії. Плоский масив також працює для параметрів,
які навмисно спільні для кожної експонованої дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах розмов, залиште
цей розбір у плагіні через `messaging.resolveSessionConversation(...)`. Це
канонічний хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором потоку, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте порядок від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть експонувати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр плагінів часу виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний механізм сумісності, коли плагіну потрібні лише
резервні батьківські значення поверх загального/raw id. Якщо існують обидва хуки, core використовує
спочатку `resolveSessionConversation(...).parentConversationCandidates` і лише потім
повертається до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не надає.

## Підтвердження та можливості каналу

Більшості плагінів каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за same-chat `/approve`, спільні payload кнопок підтвердження та загальну резервну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/нативного режиму/рендерингу/автентифікації підтверджень у `approvalCapability`.
- `plugin.auth` призначено лише для login/logout; core більше не читає з цього об’єкта хуки автентифікації підтверджень.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтверджень same-chat.
- Якщо ваш канал експонує нативні підтвердження exec, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/нативного клієнта, коли він відрізняється від автентифікації підтверджень same-chat. Core використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал нативні підтвердження exec, і включати канал до рекомендацій щодо резервного нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для поширеного випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, як-от приховування дубльованих локальних prompt підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних підтверджень або придушення резервного варіанта.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативних підтверджень, що належать каналу. Залишайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати модуль часу виконання на вимогу, водночас дозволяючи core зібрати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише коли каналу справді потрібні власні payload підтвердження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь у вимкненому шляху пояснювала точні параметри config, потрібні для ввімкнення нативних підтверджень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи з областю облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість верхньорівневих типових значень.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власника, з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити same-chat `/approve` без додавання специфічної для підтверджень логіки в core.
- Якщо каналу потрібна нативна доставка підтверджень, зосередьте код каналу на нормалізації цілей і фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, в ідеалі через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати обробник і взяти на себе фільтрацію запитів, маршрутизацію, дедуплікацію, строк дії, підписку Gateway і сповіщення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з нативними payload у станах очікування/вирішено/прострочено або з фінальними діями
- `transport` — підготовка цілей, а також надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от client, token, Bolt app або приймач Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає core змогу ініціалізувати обробники, керовані можливостями, зі стану запуску каналу без додавання спеціального glue-коду для підтверджень.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, керована можливостями, ще недостатньо виразна.
- Канали з нативними підтвердженнями мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область дії політики підтвердження для кількох облікових записів прив’язаною до правильного облікового запису бота, а `approvalKind` зберігає поведінку підтверджень exec і Plugin доступною для каналу без жорстко закодованих гілок у core.
- Тепер core також відповідає за сповіщення про повторну маршрутизацію підтверджень. Плагіни каналів не повинні надсилати власні подальші повідомлення на кшталт «підтвердження надійшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість експонуйте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтверджень і дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад у чат-ініціатор.
- Зберігайте тип ідентифікатора доставленого підтвердження наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію підтверджень exec чи Plugin на основі локального для каналу стану.
- Різні типи підтверджень можуть навмисно експонувати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає нативну маршрутизацію підтверджень доступною як для ідентифікаторів exec, так і для Plugin.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для підтверджень exec
    і Plugin, водночас дозволяючи автентифікації відрізнятися залежно від типу підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка для сумісності, але новий код має віддавати перевагу builder-у можливостей і експонувати `approvalCapability` у плагіні.

Для гарячих точок входу каналу віддавайте перевагу вужчим підшляхам runtime, коли вам потрібна лише
одна частина цієї групи:

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
парасолькова поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и налаштування:
  безпечні для імпорту адаптери патчів налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вихід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-орієнтована поверхня адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и налаштування з необов’язковим встановленням, а також кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або автентифікацію через env і загальні потоки startup/config
мають знати ці імена env до завантаження runtime, оголосіть їх у маніфесті
плагіна через `channelEnvVars`. Залишайте runtime `envVars` каналу або локальні
константи лише для операторського тексту.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або скануванні SecretRef
до запуску runtime плагіна, додайте `openclaw.setupEntry` у `package.json`.
Ця точка входу має бути безпечною для імпорту в шляхах команд лише для читання і
повинна повертати метадані каналу, безпечний для setup адаптер config, адаптер status і метадані цілей секретів каналу, потрібні для цих зведень. Не запускайте clients, listeners або transport runtime з точки входу setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише повідомляти «спочатку встановіть цей Plugin» у поверхнях
налаштування, віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
адаптер/майстер fail closed під час запису config і фіналізації, і вони повторно використовують
те саме повідомлення про обов’язкове встановлення у валідації, finalize і тексті з посиланням на документацію.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config з кількома обліковими записами та
  резервного облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного маршруту/конверта та
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа та вихідних
  делегатів identity/send і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли вихідний маршрут має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Плагіни провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію ідентифікатора потоку, коли їхня платформа
  має нативну семантику доставки в потоки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла схема полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації власних команд Telegram,
  валідації дублікатів/конфліктів і стабільного для резервного варіанта контракту config команд

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: core обробляє підтвердження, а плагін просто експонує можливості outbound/auth. Канали з нативними підтвердженнями, як-от Matrix, Slack, Telegram і спеціальні транспортні чати, мають використовувати спільні нативні helper-и замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, що належить плагіну
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel допоміжних засобів для inbound.

Добре підходить для локальної логіки плагіна:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- нативні для платформи кеші, потрібні для доведення участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- остаточне рішення про пропуск

Рекомендований потік:

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

`api.runtime.channel.mentions` експонує ті самі спільні helper-и згадок для
вбудованих плагінів каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
helper-ів runtime для inbound.

Старі helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорт для сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакунок і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    робить це плагіном каналу. Повну поверхню метаданих пакунка див.
    у [Налаштування плагіна і Config](/uk/plugins/sdk-setup#openclaw-channel):

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

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Розв’язувач безпеки DM з областю дії з полів config |
      | `pairing.text` | Потік сполучення DM на основі тексту з обміном кодом |
      | `threading` | Розв’язувач режиму reply-to (фіксований, з областю облікового запису або власний) |
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
    тоді як звичайне повне завантаження все одно підхоплює ті самі дескриптори для реєстрації реальних команд.
    Залишайте `registerFull(...)` для роботи лише в runtime.
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Усі
    параметри див. у [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для полегшеного завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє не підтягувати важкий runtime-код під час потоків налаштування.
    Подробиці див. у [Налаштування і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали workspace, які розділяють безпечні для setup експорти в sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через обробник inbound вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // автентифікація, керована плагіном (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш обробник inbound диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
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
      Обробка вхідних повідомлень специфічна для каналу. Кожен плагін каналу
      відповідає за власний pipeline inbound. Дивіться на вбудовані плагіни каналів
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

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, прив’язані до облікового запису або власні режими reply
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper-и runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, субагент через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані допоміжні поверхні все ще існують для підтримки вбудованих плагінів і
сумісності. Вони не є рекомендованим шаблоном для нових плагінів каналів;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної поверхні SDK,
якщо тільки ви безпосередньо не підтримуєте цю родину вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти для тестування та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни harness агента](/uk/plugins/sdk-agent-harness)
