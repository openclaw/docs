---
read_when:
    - Ви створюєте новий плагін каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу обміну повідомленнями для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-05T18:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66b52c10945a8243d803af3bf7e1ea0051869ee92eda2af5718d9bb24fbb8552
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник описує створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
захистом DM, паруванням, потоковістю відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у core. Вашому плагіну належать:

- **Конфігурація** — визначення облікового запису та майстер налаштування
- **Безпека** — політика DM та allowlist-и
- **Парування** — процес підтвердження DM
- **Граматика сесій** — як conversation id, специфічні для провайдера, зіставляються з базовими чатами, id потоків і резервними батьківськими значеннями
- **Вихідні повідомлення** — надсилання тексту, медіа та опитувань на платформу
- **Потоковість** — як упорядковуються відповіді

Core належить спільний інструмент message, зв’язування prompt-ів, зовнішня
форма ключа сесії, загальний облік `:thread:` та диспетчеризація.

Якщо ваша платформа зберігає додаткову область в межах conversation id,
залишайте цей розбір у плагіні через
`messaging.resolveSessionConversation(...)`. Це канонічний хук для
зіставлення `rawId` з базовим conversation id, необов’язковим id потоку,
явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх порядок від
найвужчого батьківського значення до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть експортувати файл верхнього рівня `session-key-api.ts` із
відповідним експортом `resolveSessionConversation(...)`. Core використовує цю
безпечну для bootstrap поверхню лише тоді, коли реєстр runtime-плагінів ще
недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний механізм сумісності, коли плагіну потрібні лише резервні
батьківські значення поверх загального/сирого id. Якщо існують обидва хуки,
core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і повертається
до `resolveParentConversationCandidates(...)` лише тоді, коли канонічний хук
їх не надає.

## Погодження та можливості каналів

Більшості плагінів каналів не потрібен код, специфічний для погоджень.

- Core керує `/approve` у тому самому чаті, спільними payload-ами кнопок погодження та загальною резервною доставкою.
- Віддавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, коли каналу потрібна поведінка, специфічна для погоджень.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шар авторизації погоджень.
- Якщо ваш канал надає нативні погодження exec, реалізуйте `approvalCapability.getActionAvailabilityState` навіть якщо нативний транспорт повністю живе в `approvalCapability.native`. Core використовує цей хук доступності, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціюючий канал нативні погодження, і включати канал до підказок резервного сценарію для нативного клієнта.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload-ів, специфічної для каналу, наприклад приховування дубльованих локальних prompt-ів погодження або надсилання індикаторів набору тексту перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації погоджень або придушення резервного сценарію.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload-и погодження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь у гілці disabled пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних погоджень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи, прив’язані до облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, замість значень верхнього рівня за замовчуванням.
- Якщо канал може вивести стабільні DM-ідентичності, подібні до власника, із наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки погоджень, специфічної для core.
- Якщо каналу потрібна нативна доставка погоджень, тримайте код каналу зосередженим на нормалізації цілі та транспортних хуках. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` і `createChannelNativeApprovalRuntime` з `openclaw/plugin-sdk/approval-runtime`, щоб core керував фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії та підпискою gateway.
- Канали з нативними погодженнями мають маршрутизувати і `accountId`, і `approvalKind` через ці хелпери. `accountId` зберігає політику погоджень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає поведінку погоджень exec і плагінів доступною для каналу без жорстко закодованих гілок у core.
- Зберігайте тип id доставленого погодження від початку до кінця. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію погоджень exec чи плагінів на основі локального стану каналу.
- Різні типи погоджень можуть навмисно відкривати різні нативні поверхні.
  Поточні приклади вбудованих плагінів:
  - Slack зберігає доступність нативної маршрутизації погоджень як для id exec, так і для id плагінів.
  - Matrix зберігає нативну маршрутизацію DM/каналів лише для погоджень exec і залишає
    погодження плагінів на спільному шляху `/approve` у тому самому чаті.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має віддавати перевагу побудовнику можливостей і надавати `approvalCapability` у плагіні.

Для гарячих entrypoint-ів каналів віддавайте перевагу вужчим runtime-підшляхам,
коли вам потрібна лише одна частина цієї групи:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, якщо вам не потрібна ширша
узагальнювальна поверхня.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime хелпери setup:
  безпечні для import адаптери патчів setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід приміток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  побудовники proxy для setup
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware шар
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює побудовники setup для
  необов’язкового встановлення, а також кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
  `splitSetupEntries`
- використовуйте ширший шар `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні хелпери setup/config, наприклад
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише повідомляти "спочатку встановіть цей плагін" на
поверхнях setup, віддавайте перевагу `createOptionalChannelSetupSurface(...)`.
Згенеровані adapter/wizard працюють у режимі fail closed для записів у конфігурацію
та фіналізації й повторно використовують те саме повідомлення про необхідність
встановлення у валідації, finalize та тексті з посиланням на документацію.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким хелперам замість
ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох
  облікових записів і резервного повернення до облікового запису за
  замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршрутизації/конвертів
  вхідних повідомлень і зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа та
  делегатів ідентичності/надсилання вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу
  прив’язок потоків і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла структура полів payload-ів agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  користувацьких команд Telegram, валідації дублікатів/конфліктів і
  стабільного як резервний варіант контракту конфігурації команд

Канали лише з auth зазвичай можуть зупинитися на стандартному шляху: core керує погодженнями, а плагін лише надає можливості outbound/auth. Канали з нативними погодженнями, такі як Matrix, Slack, Telegram і власні транспортні рішення для чатів, мають використовувати спільні нативні хелпери замість створення власного життєвого циклу погоджень.

## Покрокове проходження

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json`
    визначає, що це плагін каналу. Повну поверхню метаданих пакета див. у
    [Plugin Setup and Config](/uk/plugins/sdk-setup#openclawchannel):

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
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптерів. Почніть
    з мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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
      Замість ручної реалізації низькорівневих інтерфейсів адаптерів, ви
      передаєте декларативні параметри, а побудовник компонує їх:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-резолвер безпеки DM із полів конфігурації |
      | `pairing.text` | Текстовий процес парування DM з обміном кодом |
      | `threading` | Резолвер режиму reply-to (фіксований, прив’язаний до облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ID повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних параметрів,
      якщо вам потрібен повний контроль.
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
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи, потрібної лише в runtime.
    Якщо `registerFull(...)` реєструє gateway RPC-методи, використовуйте
    префікс, специфічний для плагіна. Простори імен адмін-інтерфейсу core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє цей поділ режимів реєстрації. У
    [Entry Points](/uk/plugins/sdk-entrypoints#definechannelpluginentry) див. усі
    параметри.

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повного entry, коли канал вимкнений
    або не налаштований. Це дає змогу не підтягувати важкий runtime-код під час процесів setup.
    Докладніше див. у [Setup and Config](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш плагін має отримувати повідомлення з платформи та переспрямовувати їх до
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
      володіє власним конвеєром вхідних повідомлень. Перегляньте вбудовані плагіни каналів
      (наприклад пакет плагіна Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Спільні хелпери для тестування див. у [Testing](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
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
  <Card title="Параметри потоковості" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, прив’язані до облікового запису або користувацькі режими reply
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-хелпери" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, media, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані допоміжні шари все ще існують для супроводу вбудованих плагінів
та сумісності. Це не рекомендований шаблон для нових плагінів каналів;
віддавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не супроводжуєте безпосередньо цю сім’ю вбудованих плагінів.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник з імпортів підшляхів
- [SDK Testing](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Plugin Manifest](/uk/plugins/manifest) — повна схема маніфесту
