---
read_when:
    - Ви пишете тести для плагіна
    - Вам потрібні утиліти тестування з SDK плагінів
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-07-12T13:38:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Довідка про тестові утиліти, шаблони та забезпечення дотримання правил лінтингу для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять докладні приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

Ці підшляхи є локальними для репозиторію точками входу у вихідний код для тестів власних вбудованих плагінів OpenClaw. Вони не публікуються як експорти `package.json` для сторонніх плагінів і можуть імпортувати Vitest або інші тестові залежності, доступні лише в репозиторії.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Для нових тестів вбудованих плагінів віддавайте перевагу цим спеціалізованим підшляхам. Загальний модуль реекспорту `openclaw/plugin-sdk/testing` і псевдонім `openclaw/plugin-sdk/test-utils` призначені лише для зворотної сумісності: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) відхиляє нові імпорти будь-якого з них у тестових файлах розширень, а обидва надалі використовуються виключно для тестів, що фіксують сумісність.

### Доступні експорти

| Експорт                                              | Призначення                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | Створює мінімальний макет API Plugin для модульних тестів безпосередньої реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`                |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту приглушення доставки для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`                  |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації резервного варіанта для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`       |
| `createParameterFreeTool`                            | Створює фікстури схем динамічних інструментів для тестів контрактів нативного середовища виконання. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`                  |
| `expectChannelInboundContextContract`                | Перевіряє структуру вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                                         |
| `installChannelOutboundPayloadContractSuite`         | Установлює випадки контракту вихідного корисного навантаження каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                   |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                                 |
| `installChannelActionsContractSuite`                 | Установлює загальні випадки контракту дій із повідомленнями каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                         |
| `installChannelSetupContractSuite`                   | Установлює загальні випадки контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                                 |
| `installChannelStatusContractSuite`                  | Установлює загальні випадки контракту стану каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                                        |
| `expectDirectoryIds`                                 | Перевіряє ідентифікатори каталогу каналу, отримані від функції виведення списку каталогу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                   |
| `assertBundledChannelEntries`                        | Перевіряє, що точки входу вбудованих каналів надають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`                                        |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові мітки конвертів. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                                             |
| `expectPairingReplyText`                             | Перевіряє текст відповіді на сполучення каналу та видобуває з нього код. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                    |
| `describePluginRegistrationContract`                 | Установлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                                                         |
| `registerSingleProviderPlugin`                       | Реєструє один Plugin постачальника в димових тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                          |
| `registerProviderPlugin`                             | Збирає всі типи постачальників з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                             |
| `registerProviderPlugins`                            | Збирає реєстрації постачальників із кількох Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                         |
| `requireRegisteredProvider`                          | Перевіряє, що колекція постачальників містить ідентифікатор. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                |
| `createRuntimeEnv`                                   | Створює імітоване середовище виконання CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                           |
| `createPluginRuntimeMock`                            | Створює імітовану поверхню середовища виконання Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                      |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби стану налаштування для Plugin каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                              |
| `createTestWizardPrompter`                           | Створює імітований засіб запитів майстра налаштування. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                       |
| `createRuntimeTaskFlow`                              | Створює ізольований стан потоку завдань середовища виконання. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                |
| `runProviderCatalog`                                 | Виконує хук каталогу постачальника з тестовими залежностями. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                |
| `resolveProviderWizardOptions`                       | Визначає варіанти вибору майстра налаштування постачальника в тестах контракту. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                             |
| `resolveProviderModelPickerEntries`                  | Визначає записи засобу вибору моделі постачальника в тестах контракту. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                       |
| `buildProviderPluginMethodChoice`                    | Створює ідентифікатори варіантів вибору майстра постачальника для перевірок. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                 |
| `setProviderWizardProvidersResolverForTest`          | Впроваджує постачальників майстра постачальника для ізольованих тестів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                       |
| `describeOpenAIProviderRuntimeContract`              | Установлює перевірки контракту середовища виконання сімейства постачальників. Імпортуйте з `plugin-sdk/provider-test-contracts`                                           |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення постачальника пропускають інструменти й метадані, якими володіє постачальник. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Запускає інтерактивний тест постачальника STT у реальному часі зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`                              |
| `normalizeTranscriptForMatch`                        | Нормалізує вихідні дані інтерактивної транскрипції перед нечіткими перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                                          |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що постачальники відео явно оголошують можливості режиму генерування. Імпортуйте з `plugin-sdk/provider-test-contracts`                                         |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що постачальники музики явно оголошують можливості генерування та редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`                                 |
| `mockSuccessfulDashscopeVideoTask`                   | Установлює успішну відповідь відеозавдання, сумісного з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                                                        |
| `getProviderHttpMocks`                               | Надає доступ до активованих за потреби макетів HTTP/автентифікації постачальника у Vitest. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                              |
| `installProviderHttpMockCleanup`                     | Скидає макети HTTP/автентифікації постачальника після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                                     |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок визначення цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                                                              |
| `shouldAckReaction`                                  | Перевіряє, чи має канал додати реакцію-підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                                                          |
| `removeAckReactionAfterReply`                        | Видаляє реакцію-підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                                                        |
| `createTestRegistry`                                 | Створює фікстуру реєстру Plugin каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                                               |
| `createEmptyPluginRegistry`                          | Створює фікстуру порожнього реєстру Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                                            |
| `setActivePluginRegistry`                            | Установлює фікстуру реєстру для тестів середовища виконання Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                     |
| `createRequestCaptureJsonFetch`                      | Перехоплює запити отримання JSON у тестах допоміжних засобів роботи з медіафайлами. Імпортуйте з `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Запускає тести з одноразовим локальним HTTP-сервером. Імпортуйте з `plugin-sdk/test-env`                                                                                  |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                                                        |
| `withFetchPreconnect`                                | Запускає тести отримання з установленими хуками попереднього підключення. Імпортуйте з `plugin-sdk/test-env`                                                              |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                                                    |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані фікстури файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                                                                                |
| `createMockServerResponse`                           | Створює мінімальний макет відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                                                       |
| `createProviderUsageFetch`                           | Створює фікстури отримання даних про використання постачальника. Імпортуйте з `plugin-sdk/test-env`                                                                        |
| `useFrozenTime` / `useRealTime`                      | Заморожує та відновлює таймери для чутливих до часу тестів. Імпортуйте з `plugin-sdk/test-env`                                                                             |
| `createCliRuntimeCapture`                            | Перехоплює вихідні дані середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                                         |
| `importFreshModule`                                  | Імпортує модуль ESM зі свіжим маркером запиту, щоб обійти кеш модулів. Імпортуйте з `plugin-sdk/test-fixtures`                                                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Визначає шляхи до фікстур вихідного коду або дистрибутива вбудованого Plugin. Імпортуйте з `plugin-sdk/test-fixtures`                                                      |
| `mockNodeBuiltinModule`                              | Установлює вузькоспеціалізовані макети вбудованих модулів Node у Vitest. Імпортуйте з `plugin-sdk/test-node-mocks`                                                         |
| `createSandboxTestContext`                           | Створює контексти тестування пісочниці. Імпортуйте з `plugin-sdk/test-fixtures`                                                                                            |
| `writeSkill`                                         | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                         |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                  |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Перевіряє та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                     |
| `sanitizeTerminalText`                               | Очищує виведення термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                        |
| `countLines` / `hasBalancedFences`                   | Перевіряє структуру результату поділу на фрагменти. Імпортуйте з `plugin-sdk/test-fixtures`                                               |
| `typedCases`                                         | Зберігає літеральні типи для табличних тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                    |

Набори контрактних тестів для вбудованих плагінів також використовують ці підшляхи тестування SDK для
допоміжних засобів реєстру, маніфесту, публічних артефактів і фікстур середовища виконання, призначених лише для тестів.
Натомість набори тестів лише для ядра, що залежать від інвентарю вбудованих компонентів OpenClaw, залишаються в
`src/plugins/contracts`.

### Типи

Спеціалізовані підшляхи тестування також повторно експортують типи, корисні в тестових файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Тестування визначення цільового об’єкта

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цільового об’єкта каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка визначення цільового об’єкта вашого каналу
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Додайте тестові випадки, специфічні для каналу
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування контрактів реєстрації

Модульні тести, які передають написаний вручну макет `api` до `register(api)`, не
перевіряють шлюзи прийняття завантажувача OpenClaw. Додайте принаймні один
димовий тест із використанням завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо
для хуків та ексклюзивних можливостей, як-от пам’ять.

Справжній завантажувач завершує реєстрацію плагіна помилкою, якщо відсутні обов’язкові метадані або
плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` потребує назви хука, а
`api.registerMemoryCapability(...)` потребує, щоб маніфест плагіна або експортований
запис оголошував `kind: "memory"`.

### Тестування доступу до конфігурації середовища виконання

Надавайте перевагу спільному макету середовища виконання плагіна з `openclaw/plugin-sdk/plugin-test-runtime`.
Його макети `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)`
за замовчуванням викидають виняток, щоб тести виявляли нове використання застарілих API
сумісності. Перевизначайте ці макети лише тоді, коли тест явно перевіряє застарілу
поведінку сумісності.

### Модульне тестування плагіна каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Значення токена не розкривається
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Модульне тестування плагіна постачальника

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Імітація середовища виконання плагіна

Для коду, що використовує `createPluginRuntimeStore`, імітуйте середовище виконання в тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Під час налаштування тесту
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... інші макети
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... інші простори імен
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Після тестів
store.clearRuntime();
```

### Тестування із заглушками для окремих екземплярів

Надавайте перевагу заглушкам для окремих екземплярів замість зміни прототипу:

```typescript
// Рекомендовано: заглушка для окремого екземпляра
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: зміна прототипу
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють належність реєстрації:

```bash
pnpm test src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють яких постачальників
- Які плагіни реєструють яких постачальників мовлення
- Правильність форми реєстрації
- Відповідність контракту середовища виконання

### Запуск тестів для обмеженої області

Для конкретного плагіна:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Перевірки лінтером (плагіни в репозиторії)

`scripts/run-additional-boundary-checks.mjs` запускає в CI набір перевірок меж імпорту `lint:plugins:*`;
кожну з них також можна запускати окремо локально:

| Команда                                                        | Забезпечує дотримання                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Вбудовані плагіни не можуть імпортувати монолітний кореневий модуль експорту `openclaw/plugin-sdk`.                          |
| `pnpm run lint:plugins:no-extension-src-imports`               | Робочі файли розширень не можуть безпосередньо імпортувати дерево репозиторію `src/**` (`../../src/...`).                    |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Тестові файли розширень не можуть імпортувати `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` або інші тестові допоміжні засоби лише для ядра. |

Зовнішні плагіни не підпадають під дію цих правил лінтера, але рекомендовано дотримуватися тих самих
шаблонів.

## Конфігурація тестів

OpenClaw використовує Vitest 4 з інформаційними звітами про покриття V8. Для тестів плагінів:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного плагіна
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за назвою конкретного тесту
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з покриттям
pnpm test:coverage
```

Якщо локальні запуски спричиняють нестачу пам’яті:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язані матеріали

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни постачальників SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна постачальника
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник із початку роботи
