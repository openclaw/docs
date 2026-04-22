---
read_when:
    - Ви створюєте новий plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу обміну повідомленнями для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-22T01:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення plugin каналів

Цей посібник описує створення plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, сполученням, гілками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у ядрі. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політику DM та списки дозволених адрес
- **Pairing** — потік підтвердження DM
- **Session grammar** — як ідентифікатори розмов, специфічні для провайдера, зіставляються з базовими чатами, ідентифікаторами гілок і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа й опитувань на платформу
- **Threading** — як організовуються гілки відповідей

Ядро відповідає за спільний інструмент повідомлень, прив’язку промптів, зовнішню
форму ключа сесії, загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал додає параметри інструмента повідомлень, які передають джерела
медіа, відкрийте ці назви параметрів через
`describeMessageTool(...).mediaSourceParams`. Ядро використовує цей явний список
для нормалізації шляхів sandbox і політики доступу до вихідних медіа, тому
plugin не потребують спеціальних винятків у спільному ядрі для параметрів
аватарів, вкладень або зображень обкладинки, специфічних для провайдера.
Краще повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб несуміжні дії не
успадковували медіа-аргументи іншої дії. Плаский масив також працює для
параметрів, які навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додаткову область видимості всередині
ідентифікаторів розмов, залиште цей розбір у plugin через
`messaging.resolveSessionConversation(...)`. Це канонічний хук для зіставлення
`rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором
гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`. Коли ви повертаєте
`parentConversationCandidates`, зберігайте їх упорядкованими від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані plugin, яким потрібен такий самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для
завантаження поверхню лише тоді, коли реєстр plugin середовища виконання ще
недоступний.

`messaging.resolveParentConversationCandidates(...)` і далі доступний як
застарілий резервний варіант сумісності, коли plugin потрібні лише батьківські
резервні значення поверх загального/сирого ідентифікатора. Якщо існують обидва
хуки, ядро спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і переходить до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний хук їх не
повертає.

## Підтвердження та можливості каналу

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну доставку резервного варіанта.
- Надавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/власного рендерингу/автентифікації підтверджень у `approvalCapability`.
- `plugin.auth` — лише для login/logout; ядро більше не читає хуки автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня для автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтверджень у тому самому чаті.
- Якщо ваш канал відкриває власні native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/native-клієнта, коли він відрізняється від автентифікації підтверджень у тому самому чаті. Ядро використовує цей хук, специфічний для exec, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал native exec підтвердження, і включати канал до рекомендацій щодо резервних варіантів для native-клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, як-от приховування дубльованих локальних підказок підтвердження або надсилання індикаторів введення перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації native підтверджень або пригнічення резервних варіантів.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native підтверджень, що належать каналу. Залишайте його лінивим у гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу й водночас дозволяти ядру збирати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри config, потрібні для ввімкнення native exec підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи з областю дії облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не значення верхнього рівня за замовчуванням.
- Якщо канал може визначати стабільні DM-ідентичності на кшталт власника з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки ядра, специфічної для підтверджень.
- Якщо каналу потрібна доставка native підтверджень, зосередьте код каналу на нормалізації цілей і фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і саме відповідало за фільтрацію запитів, маршрутизацію, дедуплікацію, строки дії, підписку Gateway і повідомлення про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтверджень із native payload у станах pending/resolved/expired або з фінальними діями
- `transport` — підготовка цілей, а також надсилання/оновлення/видалення native повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от клієнт, токен, Bolt app або приймач webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє ядру ініціалізувати обробники, керовані можливостями, зі стану запуску каналу без додавання обгорток, специфічних для підтверджень.
- Використовуйте нижчорівневі `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, керована можливостями, ще недостатньо виразна.
- Канали native підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці допоміжні засоби. `accountId` зберігає область дії політики підтверджень для кількох облікових записів прив’язаною до правильного облікового запису бота, а `approvalKind` зберігає для каналу доступність поведінки exec і plugin підтверджень без жорстко закодованих розгалужень у ядрі.
- Тепер ядро також відповідає за повідомлення про перенаправлення підтверджень. Plugin каналів не повинні надсилати власні подальші повідомлення на кшталт «підтвердження надійшло в DM / інший канал» з `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні допоміжні засоби можливостей підтверджень і дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад до чату, що ініціював дію.
- Зберігайте тип ідентифікатора доставленого підтвердження наскрізно. Native-клієнти не повинні вгадувати або переписувати маршрутизацію exec чи plugin підтверджень на основі локального стану каналу.
- Різні типи підтверджень можуть навмисно відкривати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступною native маршрутизацію підтверджень і для exec-, і для plugin-ідентифікаторів.
  - Matrix зберігає ту саму native DM/канальну маршрутизацію та UX реакцій для exec- і plugin-підтверджень, водночас дозволяючи автентифікації відрізнятися залежно від типу підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` і далі існує як обгортка сумісності, але новий код має надавати перевагу збирачу можливостей і відкривати `approvalCapability` у plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам, коли
вам потрібна лише одна частина цієї групи:

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

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime допоміжні засоби setup:
  безпечні для імпорту адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  збирачі setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює збирачі setup для необов’язкового встановлення, а також кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth, керовані env, і загальні потоки
запуску/config мають знати ці назви env до завантаження runtime, оголошуйте їх у
маніфесті plugin через `channelEnvVars`. Зберігайте runtime `envVars` каналу або
локальні константи лише для копірайту, орієнтованого на операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status`
або під час сканування SecretRef до запуску runtime plugin, додайте
`openclaw.setupEntry` у `package.json`. Ця точка входу має бути безпечною для
імпорту в шляхах команд лише для читання та повинна повертати метадані каналу,
безпечний для setup адаптер config, адаптер status і метадані цілей секретів
каналу, потрібні для цих зведень. Не запускайте клієнти, слухачі або runtime
транспорту з точки входу setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні допоміжні засоби setup/config, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише повідомляти на поверхнях setup «спочатку встановіть цей plugin»,
надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються безпечно на записах config і фіналізації та
повторно використовують те саме повідомлення про потребу встановлення у
валідації, finalize і копірайті посилань на документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким допоміжним засобам
замість ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config з кількома обліковими записами та
  резервного переходу до облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта вхідних повідомлень і
  прив’язки record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа, а також outbound
  делегатів ідентичності/надсилання та планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound-маршрут має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`
  після того, як базовий ключ сесії все ще збігається. Plugin провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію ідентифікатора гілки, коли їхня платформа
  має вбудовану семантику доставки за гілками.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок гілок
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли застаріла схема полів payload агента/медіа
  все ще потрібна
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  користувацьких команд Telegram, валідації дублікатів/конфліктів і
  стабільного резервного контракту config команд

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: ядро обробляє підтвердження, а plugin лише відкриває можливості outbound/auth. Канали з native підтвердженнями, як-от Matrix, Slack, Telegram і користувацькі chat-транспорти, мають використовувати спільні native-допоміжні засоби замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Розділяйте обробку вхідних згадок на два рівні:

- збирання доказів, що належить plugin
- спільне обчислення політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо
політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel допоміжних засобів для вхідних повідомлень.

Добре підходить для локальної логіки plugin:

- виявлення відповіді боту
- виявлення цитати бота
- перевірки участі в гілці
- виключення службових/системних повідомлень
- кеші, специфічні для платформи, потрібні для підтвердження участі бота

Добре підходить для спільного допоміжного засобу:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
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

`api.runtime.channel.mentions` відкриває ті самі спільні допоміжні засоби для згадок
для вбудованих plugin каналів, які вже залежать від injection у runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте їх з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
допоміжних засобів runtime для вхідних повідомлень.

Старіші допоміжні засоби `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json`
    робить це plugin каналу. Повну поверхню метаданих пакета див. в
    [Налаштування plugin і Config](/uk/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Створіть об’єкт plugin каналу">
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
      декларативні параметри, а збирач компонує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-резолвер безпеки DM із полів config |
      | `pairing.text` | Текстовий потік сполучення в DM з обміном кодами |
      | `threading` | Резолвер режиму reply-to (фіксований, прив’язаний до облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

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
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для plugin. Простори імен адміністратора ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    резолвляться до `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для легкого завантаження під час початкового налаштування:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дозволяє уникнути підключення важкого runtime-коду під час потоків setup.
    Докладніше див. в [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які розділяють безпечні для setup експорти в sidecar-модулях,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime для часу setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це webhook, який перевіряє запит і
    диспетчеризує його через обробник вхідних повідомлень вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, керований plugin (підписи перевіряйте самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш обробник вхідних повідомлень диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // реальний приклад див. у пакеті вбудованого plugin Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень є специфічною для каналу. Кожен plugin каналу
      володіє власним конвеєром вхідних повідомлень. Подивіться на вбудовані plugin каналів
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Напишіть колоковані тести в `src/channel.test.ts`:

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

    Спільні допоміжні засоби для тестування див. у [Тестування](/uk/plugins/sdk-testing).

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
  <Card title="Параметри гілок" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, прив’язані до облікового запису або користувацькі режими reply
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі поверхні вбудованих допоміжних засобів усе ще існують для підтримки
та сумісності вбудованих plugin. Вони не є рекомендованим шаблоном для нових plugin каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте цю родину вбудованих plugin безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест plugin](/uk/plugins/manifest) — повна схема маніфесту
