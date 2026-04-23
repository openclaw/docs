---
read_when:
    - Ви створюєте новий Plugin каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу повідомлень для OpenClaw
title: Створення Plugin каналів паведамлень
x-i18n:
    generated_at: "2026-04-23T21:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a596b0ec6c632ca1e7f760956087d325b5599c1fb70b9510f713afc95284de62
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник покроково пояснює, як створити Plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
спарюванням, гілками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins) щодо базової структури пакета
  і налаштування manifest.
</Info>

## Як працюють Plugins каналів

Plugins каналів не потребують власних інструментів send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш Plugin володіє:

- **Config** — визначення облікових записів і майстер налаштування
- **Security** — політика DM і allowlist
- **Pairing** — потік погодження DM
- **Session grammar** — як conversation id, специфічні для провайдера, зіставляються з базовими чатами, thread id і fallback до батьківських елементів
- **Outbound** — надсилання тексту, медіа й опитувань на платформу
- **Threading** — як організовано гілки відповідей
- **Heartbeat typing** — необов’язкові сигнали typing/busy для цілей доставки Heartbeat

Core володіє спільним інструментом message, підключенням prompt, зовнішньою формою session-key,
загальним обліком `:thread:` і dispatch.

Якщо ваш канал підтримує індикатори набору поза межами вхідних відповідей,
надайте `heartbeat.sendTyping(...)` у channel Plugin. Core викликає його з
визначеною ціллю доставки heartbeat до початку запуску моделі heartbeat і
використовує спільний життєвий цикл keepalive/cleanup для typing. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри message-tool, які несуть джерела медіа, надайте ці
назви параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів sandbox і policy доступу до вихідних медіа,
тому plugins не потребують спеціальних випадків у shared-core для параметрів avatar,
attachment або cover-image, специфічних для провайдера.
Надавайте перевагу поверненню мапи за ключем дії, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив теж працює для параметрів,
які навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додаткову область дії всередині conversation id, залишайте цей розбір
у Plugin через `messaging.resolveSessionConversation(...)`. Це канонічний hook для
зіставлення `rawId` із базовим conversation id, необов’язковим thread id, явним
`baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, тримайте їх упорядкованими від
найвужчого батьківського елемента до найширшої/базової conversation.

Bundled plugins, яким потрібен той самий розбір до запуску реєстру каналів,
можуть також надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр runtime Plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як застарілий
fallback для сумісності, коли Plugin потребує лише fallback до батьківських елементів поверх
загального/raw id. Якщо існують обидва hooks, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і повертається до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний hook їх
не надає.

## Погодження та можливості каналів

Більшості Plugin каналів не потрібен код, специфічний для погоджень.

- Core володіє `/approve` у тому самому чаті, спільними payload кнопок погодження та загальною fallback-доставкою.
- Надавайте перевагу одному об’єкту `approvalCapability` у channel Plugin, коли каналу потрібна поведінка, специфічна для погоджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативне представлення/auth погоджень у `approvalCapability`.
- `plugin.auth` — це лише login/logout; core більше не читає hooks auth погоджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний seam auth погоджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth погоджень у тому самому чаті.
- Якщо ваш канал надає нативні exec approvals, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth погоджень у тому самому чаті. Core використовує цей exec-специфічний hook, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує initiating channel нативні exec approvals, і включати канал у вказівки щодо fallback для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дубльованих локальних запитів погодження або надсилання typing indicators перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації погоджень або придушення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативних погоджень, якими володіє канал. Зберігайте його лінивим на гарячих entrypoint каналу через `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime module на вимогу, водночас дозволяючи core зібрати життєвий цикл погоджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload погоджень замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкненому шляху пояснювала точні параметри config, потрібні для ввімкнення нативних exec approvals. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами повинні рендерити шляхи в межах облікового запису, такі як `channels.<channel>.accounts.<id>.execApprovals.*`, а не типові значення верхнього рівня.
- Якщо канал може вивести стабільні owner-подібні DM-ідентичності з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки погоджень у core.
- Якщо каналу потрібна нативна доставка погоджень, зосередьте код каналу на нормалізації цілі плюс фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати handler і володіти фільтрацією запитів, маршрутизацією, dedupe, строком дії, підпискою gateway і повідомленнями про «спрямовано в інше місце». `nativeRuntime` поділено на кілька менших seam:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model погоджень у pending/resolved/expired нативні payload або фінальні дії
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення нативних повідомлень погодження
- `interactions` — необов’язкові hooks bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові hooks діагностики доставки
- Якщо каналу потрібні runtime-owned об’єкти, як-от client, token, Bolt app або receiver Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дає core змогу bootstrap capability-driven handlers зі стану запуску каналу без додавання approval-specific wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли capability-driven seam ще недостатньо виразний.
- Канали з нативними погодженнями мають маршрутизувати і `accountId`, і `approvalKind` через ці helper. `accountId` зберігає область policy погоджень для кількох облікових записів у межах правильного bot account, а `approvalKind` зберігає доступність поведінки exec проти Plugin погоджень для каналу без жорстко закодованих гілок у core.
- Core тепер володіє й повідомленнями про reroute погоджень. Plugins каналів не повинні надсилати власні follow-up повідомлення типу «погодження пішло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper можливостей погодження й дозвольте core агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад у чат-ініціатор.
- Зберігайте тип id доставленого погодження наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec проти Plugin погоджень на основі локального стану каналу.
- Різні типи погоджень можуть навмисно відкривати різні нативні поверхні.
  Поточні bundled-приклади:
  - Slack зберігає доступність нативної маршрутизації погоджень як для exec, так і для Plugin id.
  - Matrix зберігає ту саму нативну DM/channel-маршрутизацію і UX реакцій для exec
    та Plugin погоджень, водночас дозволяючи auth відрізнятися за типом погодження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як сумісний wrapper, але новий код має надавати перевагу builder можливостей і надавати `approvalCapability` у Plugin.

Для гарячих entrypoint каналу надавайте перевагу вужчим runtime subpath, коли вам потрібна лише
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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-поверхня.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper setup:
  безпечні для імпорту patched adapter setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і delegated
  builder setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder optional-install setup
  плюс кілька primitives, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth через env і загальні потоки startup/config
мають знати ці назви env до завантаження runtime, оголосіть їх у
manifest Plugin через `channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні
константи лише для copy, орієнтованого на операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або скануванні SecretRef до запуску runtime Plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця entrypoint має бути безпечною для імпорту в шляхах команд лише для читання
і має повертати метадані каналу, безпечний для setup adapter config, adapter status і метадані channel secret target, потрібні для цих зведень. Не запускайте clients, listeners або transport runtime із setup entry.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише показувати «спочатку встановіть цей Plugin» у поверхнях setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard працюють у режимі fail closed для записів config і фіналізації, а також повторно використовують те саме повідомлення про потребу встановлення для validation, finalize і copy з посиланням на документацію.

Для інших гарячих шляхів каналів надавайте перевагу вузьким helper замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config кількох облікових записів і
  fallback до типового облікового запису
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для inbound route/envelope і
  підключення record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  delegates ідентичності/надсилання та планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound route має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну `:thread:` session
  після того, як базовий ключ сесії все ще збігається. Provider plugins можуть перевизначати
  пріоритет, поведінку suffix і нормалізацію thread id, коли їхня платформа
  має нативну семантику доставки thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла схема поля payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації custom-command Telegram,
  перевірки дублювання/конфліктів і fallback-stable контракту config команд

Канали лише з auth зазвичай можуть зупинитися на типовому шляху: core обробляє approvals, а Plugin лише надає outbound/auth capabilities. Канали з нативними approvals, такі як Matrix, Slack, Telegram і власні chat transports, повинні використовувати спільні native helpers замість побудови власного життєвого циклу approvals.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, яким володіє plugin
- спільне оцінювання policy

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень policy згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel helper для inbound.

Добре підходить для локальної логіки plugin:

- визначення reply-to-bot
- визначення quoted-bot
- перевірки участі в thread
- виключення service/system-message
- platform-native cache, потрібні для підтвердження участі бота

Добре підходить для спільного helper:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід для команд
- фінальне рішення про пропуск

Бажаний потік:

1. Обчислити локальні факти згадок.
2. Передати ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовувати `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому inbound gate.

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
bundled channel plugins, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб не завантажувати не пов’язані
runtime helpers для inbound.

Старіші helper `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і manifest">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` —
    це те, що робить цей Plugin plugin каналу. Повну поверхню метаданих пакета
    див. в [Plugin Setup and Config](/uk/plugins/sdk-setup#openclaw-channel):

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
      "description": "Plugin каналу Acme Chat",
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

  <Step title="Побудуйте об’єкт plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь adapter. Почніть із
    мінімуму — `id` і `setup` — і додавайте adapter за потреби.

    Створіть `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ваш API client платформи

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

      // Безпека DM: хто може надсилати повідомлення боту
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: потік погодження для нових контактів у DM
      pairing: {
        text: {
          idLabel: "Ім’я користувача Acme Chat",
          message: "Надішліть цей код, щоб підтвердити свою особу:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: як доставляються відповіді
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
      Замість ручної реалізації низькорівневих інтерфейсів adapter ви передаєте
      декларативні параметри, а builder збирає їх разом:

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Scoped resolver безпеки DM з полів config |
      | `pairing.text` | Текстовий потік pairіng у DM з обміном кодом |
      | `threading` | Resolver режиму reply-to (фіксований, scoped за account або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ID повідомлень) |

      Ви також можете передавати сирі об’єкти adapter замість декларативних параметрів,
      якщо вам потрібен повний контроль.
    </Accordion>

  </Step>

  <Step title="Підключіть entrypoint">
    Створіть `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin каналу Acme Chat",
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

    Розміщуйте CLI descriptors, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплять ті самі descriptors для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише під час runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для plugin. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Entry Points](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної entrypoint, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підтягування важкого runtime-коду під час потоків setup.
    Докладніше див. в [Setup and Config](/uk/plugins/sdk-setup#setup-entry).

    Bundled workspace channels, які виносять безпечні для setup експорти в sidecar
    modules, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Обробіть вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    dispatch через inbound handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth під керуванням plugin (перевіряйте signatures самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш inbound handler dispatch-ить повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // див. реальний приклад у bundled пакеті plugin Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень залежить від каналу. Кожен Plugin каналу володіє
      власним inbound pipeline. Подивіться на bundled channel plugins
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Спільні helper для тестування див. в [Testing](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Manifest зі schema конфігурації
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні експорти runtime (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API client платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри threading" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, scoped за account або власні режими reply
  </Card>
  <Card title="Інтеграція message tool" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі bundled helper seam усе ще існують для підтримки bundled-plugin і
сумісності. Це не рекомендований шаблон для нових plugin каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо ви не підтримуєте цю bundled сім’ю plugin безпосередньо.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [SDK Testing](/uk/plugins/sdk-testing) — утиліти тестування і contract tests
- [Plugin Manifest](/uk/plugins/manifest) — повна schema manifest
