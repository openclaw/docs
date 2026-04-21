---
read_when:
    - Ви створюєте новий plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу обміну повідомленнями для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-21T17:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення plugin каналів

Цей посібник допоможе створити plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, сполученням, гілками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у core. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політику DM та списки дозволених
- **Pairing** — потік підтвердження DM
- **Граматику сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як організовано гілки відповідей

Core відповідає за спільний інструмент повідомлень, підключення промптів,
зовнішню форму ключа сесії, загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела
медіа, відкрийте ці назви параметрів через
`describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів у sandbox і політики доступу до
вихідних медіа, тож plugin не потрібні спеціальні винятки в shared core для
специфічних для провайдера параметрів avatar, attachment або cover image.
Краще повертати map, прив’язану до ключа дії, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіааргументи іншої дії. Плоский масив також працює для
параметрів, які навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах
розмов, залишайте цей парсинг у plugin за допомогою
`messaging.resolveSessionConversation(...)`. Це канонічний хук для
зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, тримайте їх упорядкованими
від найвужчого батьківського значення до найширшої/базової розмови.

Вбудовані plugin, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть відкривати файл верхнього рівня `session-key-api.ts` із
відповідним експортом `resolveSessionConversation(...)`. Core використовує цю
безпечну для bootstrap поверхню лише тоді, коли реєстр plugin середовища
виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
резервний варіант застарілої сумісності, коли plugin потрібні лише
батьківські резервні значення поверх загального/raw id. Якщо існують обидва
хуки, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і звертається
до `resolveParentConversationCandidates(...)` лише тоді, коли канонічний хук
їх не вказує.

## Підтвердження та можливості каналу

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, коли каналу потрібна специфічна поведінка підтвердження.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативний рендеринг/auth підтвердження в `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; core більше не читає хуки auth підтвердження з цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня auth підтвердження.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтвердження в тому самому чаті.
- Якщо ваш канал відкриває нативні exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтвердження в тому самому чаті. Core використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціюючий канал нативні exec-підтвердження, і включати канал у вказівки резервного варіанта native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дублікатів локальних промптів підтвердження або надсилання індикаторів набору тексту перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативного підтвердження або вимкнення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативного підтвердження, що належать каналу. Тримайте його лінивим на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль за потреби, водночас дозволяючи core збирати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь у вимкненому шляху пояснювала точні config-параметри, потрібні для ввімкнення нативних exec-підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами повинні рендерити шляхи з областю облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, замість defaults верхнього рівня.
- Якщо канал може виводити стабільні DM-ідентичності на кшталт власника з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтвердження логіки в core.
- Якщо каналу потрібна нативна доставка підтвердження, зосередьте код каналу на нормалізації цілі плюс фактах транспорту/презентації. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати handler і керувати фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою Gateway і сповіщеннями про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи потрібно обробляти запит
- `presentation` — зіставлення спільної view model підтвердження в нативні payload pending/resolved/expired або фінальні дії
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от client, token, Bolt app або receiver Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє core запускати handler, керовані можливостями, зі стану запуску каналу без додавання обгорткового glue, специфічного для підтвердження.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, керована можливостями, ще недостатньо виразна.
- Канали з нативним підтвердженням повинні маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область політики підтвердження для кількох облікових записів прив’язаною до правильного bot account, а `approvalKind` зберігає поведінку exec і plugin підтверджень доступною для каналу без жорстко закодованих гілок у core.
- Core тепер також відповідає за сповіщення про повторну маршрутизацію підтверджень. Plugin каналів не повинні надсилати власні подальші повідомлення на кшталт «підтвердження перейшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість відкривайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтвердження й дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціюючий чат.
- Зберігайте kind доставленого id підтвердження від початку до кінця. Нативні clients не повинні
  вгадувати або переписувати маршрутизацію exec чи plugin підтвердження на основі локального стану каналу.
- Різні kind підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступну нативну маршрутизацію підтверджень і для exec, і для plugin id.
  - Matrix зберігає ту саму нативну маршрутизацію DM/каналу та UX реакцій для exec
    і plugin підтверджень, водночас дозволяючи auth відрізнятися за kind підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу builder можливостей і відкривати `approvalCapability` у plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
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

Так само надавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша
узагальнена поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и налаштування:
  безпечні для імпорту адаптери patch налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід
  приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и налаштування optional-install
  плюс кілька примітивів, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth на основі env і загальні потоки
startup/config повинні знати ці назви env ще до завантаження runtime,
оголосіть їх у маніфесті plugin через `channelEnvVars`. Зберігайте runtime
`envVars` каналу або локальні константи лише для операторського тексту.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status`
або в скануваннях SecretRef до запуску runtime plugin, додайте
`openclaw.setupEntry` у `package.json`. Ця точка входу має бути безпечною для
імпорту в read-only шляхах команд і повинна повертати метадані каналу,
безпечний для setup config-адаптер, status-адаптер і метадані цілі секретів
каналу, потрібні для цих зведень. Не запускайте clients, listeners або
transport runtime з точки входу setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише показувати в поверхнях setup повідомлення «спочатку
встановіть цей plugin», надавайте перевагу
`createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard відмовляють у config-записах і фіналізації за замовчуванням, а
також повторно використовують те саме повідомлення про обов’язкове
встановлення у валідації, finalize і тексті з посиланням на docs.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper-ам замість
ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account config і
  резервного варіанта default-account
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного route/envelope і
  підключення record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для парсингу/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  identity/send delegate-ів і планування payload
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації adapter-ів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла розкладка полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації Telegram custom-command,
  валідації дублікатів/конфліктів і контракту config команд,
  стабільного для fallback

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: core обробляє підтвердження, а plugin лише відкриває можливості outbound/auth. Канали з нативними підтвердженнями, як-от Matrix, Slack, Telegram і користувацькі chat-транспорти, повинні використовувати спільні нативні helper-и замість реалізації власного життєвого циклу підтвердження.

## Політика вхідних згадок

Тримайте обробку вхідних згадок розділеною на два шари:

- збирання доказів, що належить plugin
- спільне оцінювання політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики
згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам
потрібен ширший barrel helper-ів для вхідних даних.

Добре підходить для локальної логіки plugin:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в гілці
- виключення службових/системних повідомлень
- нативні для платформи кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід для команд
- фінальне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадок.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` відкриває ті самі спільні helper-и згадок для
вбудованих plugin каналів, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження
непов’язаних runtime helper-ів для вхідних даних.

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json`
    робить це plugin каналу. Повну поверхню метаданих пакета див. у
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
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь adapter-ів. Почніть
    із мінімуму — `id` і `setup` — і додавайте adapter-и за потреби.

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
      Замість ручної реалізації низькорівневих інтерфейсів adapter-ів, ви передаєте
      декларативні параметри, а builder виконує композицію:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Розпізнавач DM security з областю дії з полів config |
      | `pairing.text` | Потік сполучення DM на основі тексту з обміном кодами |
      | `threading` | Розпізнавач режиму reply-to (фіксований, із областю облікового запису або custom) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти adapter-ів замість декларативних параметрів,
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
    міг показувати їх у root help без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише під час runtime.
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для plugin. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry), щоб переглянути всі
    параметри.

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підтягування важкого runtime-коду під час потоків setup.
    Докладніше див. у [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані workspace-канали, які розділяють безпечні для setup експорти в sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime на час setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через вхідний handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, керований plugin (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш вхідний handler диспетчеризує повідомлення до OpenClaw.
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
      Обробка вхідних повідомлень залежить від каналу. Кожен plugin каналу
      відповідає за власний вхідний конвеєр. Подивіться на вбудовані plugin каналів
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Допоміжні засоби для спільного тестування див. у [Тестування](/uk/plugins/sdk-testing).

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
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API client платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Додаткові теми

<CardGroup cols={2}>
  <Card title="Параметри гілок" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, з областю облікового запису або custom режими reply
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Розпізнавання цілей" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі поверхні вбудованих helper-ів усе ще існують для підтримки вбудованих plugin
і сумісності. Вони не є рекомендованим шаблоном для нових plugin каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте цю сім’ю вбудованих plugin безпосередньо.
</Note>

## Подальші кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти й контрактні тести
- [Маніфест plugin](/uk/plugins/manifest) — повна схема маніфесту
