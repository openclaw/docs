---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні тестові утиліти з Plugin SDK
    - Ви хочете зрозуміти контрактні тести для вбудованих plugins
sidebarTitle: Testing
summary: Утиліти й шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-05-11T20:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Довідка щодо тестових утиліт, патернів і забезпечення lint для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять опрацьовані приклади тестів:
  [Тести Plugin каналу](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Plugin провайдера](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

Ці підшляхи тестових помічників є локальними для репозиторію вихідними точками входу для власних
тестів вбудованих Plugin OpenClaw. Вони не є експортами пакета для сторонніх Plugin.

**Імпорт mock для Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту runtime агента:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт тестового помічника каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тесту цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тесту runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP mock провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тесту середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт універсальної фікстури:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт mock вбудованого модуля Node:** `openclaw/plugin-sdk/test-node-mocks`

Для нових тестів Plugin надавайте перевагу наведеним нижче цільовим підшляхам. Широкий barrel
`openclaw/plugin-sdk/testing` призначений лише для застарілої сумісності.
Запобіжники репозиторію відхиляють нові реальні імпорти з `plugin-sdk/testing` і
`plugin-sdk/test-utils`; ці назви залишаються лише як застарілі поверхні
сумісності для тестів записів сумісності.

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

### Доступні експорти

| Експорт                                              | Призначення                                                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створює мінімальний мок API Plugin для модульних тестів прямої реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                     |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту auth-profile для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту пригнічення доставлення для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації резервного варіанта для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Створює фікстури схем динамічних інструментів для тестів контрактів нативного середовища виконання. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                             |
| `installChannelOutboundPayloadContractSuite`         | Встановлює випадки контракту вихідного корисного навантаження каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                  |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                               |
| `installChannelActionsContractSuite`                 | Встановлює загальні випадки контракту дій із повідомленнями каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                       |
| `installChannelSetupContractSuite`                   | Встановлює загальні випадки контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                |
| `installChannelStatusContractSuite`                  | Встановлює загальні випадки контракту стану каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                       |
| `expectDirectoryIds`                                 | Перевіряє ідентифікатори каталогу каналу з функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                      |
| `assertBundledChannelEntries`                        | Перевіряє, що вбудовані точки входу каналу надають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`         |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові мітки конверта. Імпортуйте з `plugin-sdk/channel-test-helpers`                                             |
| `expectPairingReplyText`                             | Перевіряє текст відповіді сполучення каналу та витягує його код. Імпортуйте з `plugin-sdk/channel-test-helpers`                          |
| `describePluginRegistrationContract`                 | Встановлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                        |
| `registerSingleProviderPlugin`                       | Реєструє один Plugin провайдера в smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                              |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                             |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить ідентифікатор. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                  |
| `createRuntimeEnv`                                   | Створює змодельоване середовище виконання CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                      |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби стану налаштування для Plugin каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                            |
| `describeOpenAIProviderRuntimeContract`              | Встановлює перевірки контракту середовища виконання сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`             |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення провайдера пропускають інструменти та метадані, якими володіє провайдер. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Запускає live-тест провайдера STT у реальному часі зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`       |
| `normalizeTranscriptForMatch`                        | Нормалізує live-вивід транскрипту перед нечіткими перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери оголошують явні можливості режиму генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`            |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери оголошують явні можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`     |
| `mockSuccessfulDashscopeVideoTask`                   | Встановлює успішну відповідь відеозавдання, сумісну з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                       |
| `getProviderHttpMocks`                               | Надає доступ до opt-in HTTP/auth моків Vitest для провайдера. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                         |
| `installProviderHttpMockCleanup`                     | Скидає HTTP/auth моки провайдера після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                 |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                           |
| `shouldAckReaction`                                  | Перевіряє, чи канал має додати реакцію підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                         |
| `removeAckReactionAfterReply`                        | Видаляє реакцію підтвердження після доставлення відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                   |
| `createTestRegistry`                                 | Створює фікстуру реєстру Plugin каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`              |
| `createEmptyPluginRegistry`                          | Створює порожню фікстуру реєстру Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`             |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для тестів середовища виконання Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах допоміжних засобів медіа. Імпортуйте з `plugin-sdk/test-env`                                         |
| `withServer`                                         | Запускає тести проти одноразового локального HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                            |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                      |
| `withFetchPreconnect`                                | Запускає тести fetch з установленими хуками попереднього з’єднання. Імпортуйте з `plugin-sdk/test-env`                                   |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                   |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані фікстури файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                                              |
| `createMockServerResponse`                           | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                       |
| `createCliRuntimeCapture`                            | Захоплює вивід середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                |
| `importFreshModule`                                  | Імпортує модуль ESM зі свіжим токеном запиту, щоб обійти кеш модулів. Імпортуйте з `plugin-sdk/test-fixtures`                            |
| `bundledPluginRoot` / `bundledPluginFile`            | Розв’язує шляхи до фікстур джерела або dist вбудованого Plugin. Імпортуйте з `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Встановлює вузькі моки Vitest для вбудованих модулів Node. Імпортуйте з `plugin-sdk/test-node-mocks`                                     |
| `createSandboxTestContext`                           | Створює контексти тестів пісочниці. Імпортуйте з `plugin-sdk/test-fixtures`                                                              |
| `writeSkill`                                         | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                         |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Очищає вивід термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                            |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму виводу фрагментації. Імпортуйте з `plugin-sdk/test-fixtures`                                                             |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                                  |
| `resolveProviderWizardOptions`                       | Розв’язує варіанти майстра налаштування провайдера в тестах контрактів                                                                   |
| `resolveProviderModelPickerEntries`                  | Розв’язує записи засобу вибору моделей провайдера в тестах контрактів                                                                    |
| `buildProviderPluginMethodChoice`                    | Створює ідентифікатори вибору майстра провайдера для перевірок                                                                           |
| `setProviderWizardProvidersResolverForTest`          | Впроваджує провайдери майстра провайдера для ізольованих тестів                                                                          |
| `createProviderUsageFetch`                           | Створює фікстури отримання даних про використання провайдера                                                                             |
| `useFrozenTime` / `useRealTime`                      | Заморожує та відновлює таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                          |
| `createTestWizardPrompter`                           | Створює імітований промптер майстра налаштування                                                                                         |
| `createRuntimeTaskFlow`                              | Створює ізольований стан потоку завдань середовища виконання                                                                             |
| `typedCases`                                         | Зберігає літеральні типи для таблично-керованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                          |

Сюїти контрактів вбудованих плагінів також використовують тестові підшляхи SDK для
тестових helper-ів реєстру, маніфесту, публічних артефактів і runtime-fixture. Сюїти
лише для ядра, які залежать від інвентарю вбудованих OpenClaw, залишаються в `src/plugins/contracts`.
Тримайте нові тести розширень на документованому сфокусованому підшляху SDK, як-от
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість прямого імпорту
широкого сумісного barrel `plugin-sdk/testing`, файлів репозиторію `src/**` або
мостів репозиторію `test/helpers/*`.

### Типи

Сфокусовані тестові підшляхи також повторно експортують типи, корисні в тестових файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Визначення цілі тестування

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цілі каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування контрактів реєстрації

Модульні тести, які передають написаний вручну mock `api` до `register(api)`, не перевіряють
приймальні шлюзи завантажувача OpenClaw. Додайте принаймні один smoke test на основі завантажувача
для кожної реєстраційної поверхні, від якої залежить ваш плагін, особливо hooks і
ексклюзивні capabilities, як-от memory.

Справжній завантажувач завершує реєстрацію плагіна з помилкою, коли бракує обов’язкових метаданих або
плагін викликає capability API, яким він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортований
entry оголошував `kind: "memory"`.

### Тестування доступу до runtime config

Надавайте перевагу спільному mock runtime плагіна з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих канальних плагінів. Його застарілі mocks `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` типово викидають помилку, щоб тести виявляли нове
використання compatibility APIs. Перевизначайте ці mocks лише тоді, коли тест
явно покриває поведінку legacy-сумісності.

### Модульне тестування канального плагіна

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
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Модульне тестування provider-плагіна

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mocking runtime плагіна

Для коду, який використовує `createPluginRuntimeStore`, створюйте mock runtime у тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Тестування з per-instance stubs

Надавайте перевагу per-instance stubs замість мутації prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють володіння реєстрацією:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють яких providers
- Які плагіни реєструють яких speech providers
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск scoped tests

Для конкретного плагіна:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Примусове застосування lint (плагіни в репозиторії)

Три правила застосовуються `pnpm check` для плагінів у репозиторії:

1. **Без монолітних root imports** -- root barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без self-imports** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці lint-правила, але рекомендовано дотримуватися тих самих
шаблонів.

## Конфігурація тестів

OpenClaw використовує Vitest із порогами покриття V8. Для тестів плагінів:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- домовленості щодо імпортів
- [Канальні плагіни SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс канального плагіна
- [Provider-плагіни SDK](/uk/plugins/sdk-provider-plugins) -- hooks provider-плагіна
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
