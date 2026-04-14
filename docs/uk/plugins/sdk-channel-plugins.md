---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-04-14T16:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення Plugin каналів

Цей посібник описує створення Plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, сполученням, ланцюжками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins) про базову структуру пакета та
  налаштування маніфесту.
</Info>

## Як працюють Plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у ядрі. Ваш Plugin відповідає за:

- **Конфігурацію** — визначення облікових записів і майстер налаштування
- **Безпеку** — політику DM і списки дозволених
- **Сполучення** — процес схвалення DM
- **Граматику сесії** — як ідентифікатори розмов, специфічні для провайдера, відображаються на базові чати, ідентифікатори гілок і резервні батьківські варіанти
- **Вихідні повідомлення** — надсилання тексту, медіа й опитувань на платформу
- **Ланцюжки** — як організовуються відповіді в гілках

Ядро відповідає за спільний інструмент повідомлень, підключення промптів, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа, вкажіть ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Ядро використовує
цей явний список для нормалізації шляхів sandbox і політики доступу до вихідних медіа,
тому Plugin не потребують особливих винятків у спільному ядрі для специфічних для провайдера
параметрів аватарів, вкладень або зображень обкладинки.
Переважно повертати мапу, прив’язану до дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не успадковували
медіааргументи іншої дії. Плоский масив також працює для параметрів, які
навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах розмов, зберігайте цей розбір
у Plugin за допомогою `messaging.resolveSessionConversation(...)`. Це канонічний хук
для відображення `rawId` на базовий ідентифікатор розмови, необов’язковий ідентифікатор гілки,
явний `baseConversationId` і будь-які `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського варіанта до найширшої/базової розмови.

Вбудовані Plugin, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр Plugin середовища виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як застарілий резервний варіант сумісності, коли Plugin потрібні лише
резервні батьківські варіанти поверх загального/raw id. Якщо існують обидва хуки, ядро використовує
спочатку `resolveSessionConversation(...).parentConversationCandidates` і лише потім
повертається до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не вказує.

## Схвалення та можливості каналів

Більшості Plugin каналів не потрібен код, специфічний для схвалень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок схвалення та загальну резервну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для схвалень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативний режим/рендеринг/автентифікацію схвалень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; ядро більше не читає хуки автентифікації схвалень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня автентифікації схвалень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації схвалень у тому самому чаті.
- Якщо ваш канал надає нативні exec-схвалення, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану ініціювальної поверхні/нативного клієнта, коли він відрізняється від автентифікації схвалень у тому самому чаті. Ядро використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал нативні exec-схвалення, і включати канал у підказки резервного сценарію для нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для поширеного випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дублікатів локальних підказок схвалення або надсилання індикаторів набору тексту перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації схвалень або вимкнення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативних схвалень, що належать каналу. Зберігайте його ледачим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль середовища виконання на вимогу, водночас дозволяючи ядру збирати життєвий цикл схвалення.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload схвалення замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкнений шлях пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних exec-схвалень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають виводити шляхи з областю видимості облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не значення верхнього рівня за замовчуванням.
- Якщо канал може вивести стабільні схожі на власника DM-ідентичності з наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для схвалень логіки ядра.
- Якщо каналу потрібна нативна доставка схвалень, зосередьте код каналу на нормалізації цілі та фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і керувати фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою Gateway і повідомленнями про переспрямування. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — відображення спільної моделі перегляду схвалень у нативні payload pending/resolved/expired або фінальні дії
- `transport` — підготовка цілей і надсилання/оновлення/видалення нативних повідомлень схвалення
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать середовищу виконання, як-от клієнт, токен, Bolt app або отримувач Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє ядру ініціалізувати обробники, керовані можливостями, зі стану запуску каналу без додавання специфічного для схвалень обгорткового коду.
- Використовуйте нижчорівневі `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, керована можливостями, ще недостатньо виразна.
- Канали нативних схвалень мають маршрутизувати і `accountId`, і `approvalKind` через ці допоміжні засоби. `accountId` зберігає політику схвалень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає поведінку exec і Plugin-схвалень доступною для каналу без жорстко закодованих розгалужень у ядрі.
- Ядро тепер також відповідає за повідомлення про переспрямування схвалень. Plugin каналів не повинні надсилати власні додаткові повідомлення на кшталт «схвалення перейшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні допоміжні засоби можливостей схвалень і дозволяйте ядру агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад в ініціювальний чат.
- Зберігайте тип ідентифікатора доставленого схвалення наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи Plugin-схвалень на основі локального для каналу стану.
- Різні типи схвалень можуть навмисно надавати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступною маршрутизацію нативних схвалень як для exec-, так і для Plugin-ідентифікаторів.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для exec-
    і Plugin-схвалень, водночас дозволяючи автентифікації відрізнятися за типом схвалення.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має віддавати перевагу конструктору можливостей і надавати `approvalCapability` у Plugin.

Для гарячих точок входу каналів віддавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
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
`openclaw/plugin-sdk/reply-chunking`, якщо вам не потрібна ширша
узагальнювальна поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime допоміжні засоби налаштування:
  безпечні для імпорту адаптери patch налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення приміток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  конструктори setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює конструктори налаштування з необов’язковим встановленням
  плюс кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або автентифікацію, керовані env, і загальні процеси запуску/конфігурації
мають знати ці назви env до завантаження runtime, оголосіть їх у
маніфесті Plugin за допомогою `channelEnvVars`. Зберігайте `envVars` runtime каналу або локальні
константи лише для копії, орієнтованої на операторів.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup`, лише якщо вам також потрібні
  важчі спільні допоміжні засоби setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати «спочатку встановіть цей Plugin» на поверхнях налаштування,
віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard за замовчуванням забороняють запис у конфігурацію та завершення, і вони повторно використовують
те саме повідомлення про необхідність встановлення для перевірки, завершення та тексту
з посиланням на документацію.

Для інших гарячих шляхів каналів віддавайте перевагу вузьким helper замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових записів і
  резервного використання облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта вхідних даних і
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс делегатів
  ідентичності/надсилання вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язки гілок
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише коли все ще потрібна застаріла
  схема полів payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram, перевірки дублікатів/конфліктів і стабільного щодо резервного сценарію контракту конфігурації команд

Канали лише з автентифікацією зазвичай можуть зупинитися на стандартному шляху: ядро обробляє схвалення, а Plugin лише надає можливості outbound/auth. Канали нативних схвалень, як-от Matrix, Slack, Telegram і спеціальні транспортні засоби чату, мають використовувати спільні нативні helper, а не реалізовувати власний життєвий цикл схвалень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два шари:

- збір доказів, що належить Plugin
- оцінка спільної політики

Для спільного шару використовуйте `openclaw/plugin-sdk/channel-inbound`.

Добре підходить для локальної логіки Plugin:

- виявлення відповіді боту
- виявлення цитування бота
- перевірки участі в гілці
- виключення службових/системних повідомлень
- платформонативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- фінальне рішення про пропуск

Рекомендований процес:

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

`api.runtime.channel.mentions` надає ті самі спільні helper для згадок для
вбудованих Plugin каналів, які вже залежать від інʼєкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Старіші helper `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` — це
    те, що робить його Plugin каналу. Повну поверхню метаданих пакета
    див. у [Налаштування Plugin і конфігурація](/uk/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Створіть обʼєкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необовʼязкових поверхонь адаптера. Почніть із
    мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

    Створіть `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ваш API-клієнт платформи

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

      // Сполучення: процес схвалення для нових контактів у DM
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Ланцюжки: як доставляються відповіді
      threading: { topLevelReplyToMode: "reply" },

      // Вихідні повідомлення: надсилання повідомлень на платформу
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
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а конструктор поєднує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-розвʼязувач безпеки DM із полів конфігурації |
      | `pairing.text` | Текстовий процес сполучення в DM з обміном кодами |
      | `threading` | Розвʼязувач режиму reply-to (фіксований, у межах облікового запису або спеціальний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі обʼєкти адаптерів замість декларативних параметрів,
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
    тоді як звичайні повні завантаження все одно підхоплять ті самі дескриптори для реєстрації
    реальних команд. Зберігайте `registerFull(...)` для роботи лише в runtime.
    Якщо `registerFull(...)` реєструє RPC-методи Gateway, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністрування ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    розвʼязуються в `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри див. у [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для полегшеного завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує цей файл замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дозволяє не підтягувати важкий runtime-код під час процесів налаштування.
    Докладніше див. у [Налаштування і конфігурація](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через вхідний обробник вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // автентифікація під керуванням Plugin (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш вхідний обробник диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // див. реальний приклад у вбудованому пакеті Plugin Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень залежить від конкретного каналу. Кожен Plugin каналу
      володіє власним вхідним конвеєром. Подивіться на вбудовані Plugin каналів
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

    Для спільних helper тестування див. [Тестування](/uk/plugins/sdk-testing).

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
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API-клієнт платформи
    └── runtime.ts            # Runtime-сховище (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри ланцюжків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, scoped до облікового запису або спеціальні режими відповіді
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Розв’язання цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані поверхні helper усе ще існують для підтримки вбудованих Plugin і
сумісності. Вони не є рекомендованим шаблоном для нових Plugin каналів;
віддавайте перевагу загальним channel/setup/reply/runtime-підшляхам зі спільної
поверхні SDK, якщо лише ви не підтримуєте цю родину вбудованих Plugin безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за підшляхами
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту
