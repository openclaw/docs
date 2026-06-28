---
read_when:
    - Ви пишете тести для plugin
    - Вам потрібні тестові утиліти з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Довідник із тестових утиліт, патернів і примусового застосування lint для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять опрацьовані приклади тестів:
  [Тести Plugin каналу](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Plugin провайдера](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

Ці підшляхи тестових помічників є локальними для репозиторію вхідними точками вихідного коду для власних тестів bundled Plugin OpenClaw. Вони не є експортами пакета для сторонніх Plugin і можуть імпортувати Vitest або інші тестові залежності, доступні лише в репозиторії.

**Імпорт mock Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту runtime агента:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт тестового помічника каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тесту цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тесту runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP mock провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тесту середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт узагальненої фікстури:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт mock вбудованого модуля Node:** `openclaw/plugin-sdk/test-node-mocks`

У репозиторії OpenClaw для нових тестів bundled Plugin віддавайте перевагу наведеним нижче спеціалізованим підшляхам. Широкий barrel `openclaw/plugin-sdk/testing` призначений лише для legacy сумісності. Захисні правила репозиторію відхиляють нові реальні імпорти з `plugin-sdk/testing` і `plugin-sdk/test-utils`; ці назви залишаються лише як застарілі поверхні сумісності для тестів записів сумісності.

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

| Експорт                                              | Призначення                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створює мінімальний мок API плагіна для модульних тестів прямої реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту пригнічення доставки для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту fallback-класифікації для нативних адаптерів середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Створює фікстури схем динамічних інструментів для тестів контракту нативного середовища виконання. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Встановлює набори випадків контракту вихідного корисного навантаження каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`               |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                     |
| `installChannelActionsContractSuite`                 | Встановлює загальні випадки контракту дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                   |
| `installChannelSetupContractSuite`                   | Встановлює загальні випадки контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                      |
| `installChannelStatusContractSuite`                  | Встановлює загальні випадки контракту статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                           |
| `expectDirectoryIds`                                 | Перевіряє ідентифікатори каталогів каналу з функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                          |
| `assertBundledChannelEntries`                        | Перевіряє, що вбудовані точки входу каналу відкривають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`           |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові позначки конвертів. Імпортуйте з `plugin-sdk/channel-test-helpers`                                               |
| `expectPairingReplyText`                             | Перевіряє текст відповіді сполучення каналу й витягує його код. Імпортуйте з `plugin-sdk/channel-test-helpers`                                 |
| `describePluginRegistrationContract`                 | Встановлює перевірки контракту реєстрації плагіна. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                             |
| `registerSingleProviderPlugin`                       | Реєструє один плагін провайдера в smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                    |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                  |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох плагінах. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                              |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить ідентифікатор. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                       |
| `createRuntimeEnv`                                   | Створює моковане середовище виконання CLI/плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                               |
| `createPluginRuntimeMock`                            | Створює моковану поверхню середовища виконання плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                          |
| `createPluginSetupWizardStatus`                      | Створює помічники статусу налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                     |
| `describeOpenAIProviderRuntimeContract`              | Встановлює перевірки контракту середовища виконання сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`                   |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення провайдера пропускають інструменти й метадані, якими володіє провайдер. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Запускає live-тест провайдера realtime STT зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`                    |
| `normalizeTranscriptForMatch`                        | Нормалізує вивід live-транскрипту перед нечіткими перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                              |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери оголошують явні можливості режиму генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`                  |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери оголошують явні можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`          |
| `mockSuccessfulDashscopeVideoTask`                   | Встановлює успішну відповідь відеозавдання, сумісну з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                            |
| `getProviderHttpMocks`                               | Надає доступ до opt-in HTTP/auth моків Vitest для провайдера. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                              |
| `installProviderHttpMockCleanup`                     | Скидає HTTP/auth моки провайдера після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                       |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                                |
| `shouldAckReaction`                                  | Перевіряє, чи канал має додати реакцію підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                               |
| `removeAckReactionAfterReply`                        | Видаляє реакцію підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                            |
| `createTestRegistry`                                 | Створює фікстуру реєстру плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                |
| `createEmptyPluginRegistry`                          | Створює фікстуру порожнього реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`             |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для тестів середовища виконання плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах медіапомічників. Імпортуйте з `plugin-sdk/test-env`                                                       |
| `withServer`                                         | Запускає тести проти одноразового локального HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                  |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                           |
| `withFetchPreconnect`                                | Запускає тести fetch зі встановленими хуками попереднього з’єднання. Імпортуйте з `plugin-sdk/test-env`                                       |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані файлові тестові фікстури. Імпортуйте з `plugin-sdk/test-env`                                                                |
| `createMockServerResponse`                           | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | Захоплює вивід середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                     |
| `importFreshModule`                                  | Імпортує ESM-модуль зі свіжим токеном запиту, щоб обійти кеш модулів. Імпортуйте з `plugin-sdk/test-fixtures`                                |
| `bundledPluginRoot` / `bundledPluginFile`            | Розв’язує шляхи до фікстур джерел або dist вбудованого плагіна. Імпортуйте з `plugin-sdk/test-fixtures`                                       |
| `mockNodeBuiltinModule`                              | Встановлює вузькі моки вбудованих модулів Node для Vitest. Імпортуйте з `plugin-sdk/test-node-mocks`                                          |
| `createSandboxTestContext`                           | Створює контексти тестів пісочниці. Імпортуйте з `plugin-sdk/test-fixtures`                                                                    |
| `writeSkill`                                         | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                               |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                      |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                        |
| `sanitizeTerminalText`                               | Санітизує вивід термінала для тверджень. Імпортуйте з `plugin-sdk/test-fixtures`                                                              |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму виводу розбиття на фрагменти. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                                       |
| `resolveProviderWizardOptions`                       | Розв’язує варіанти майстра налаштування провайдера в тестах контракту                                                                         |
| `resolveProviderModelPickerEntries`                  | Розв’язує записи вибору моделей провайдера в тестах контракту                                                                                 |
| `buildProviderPluginMethodChoice`                    | Створює ідентифікатори вибору майстра провайдера для тверджень                                                                                |
| `setProviderWizardProvidersResolverForTest`          | Впровадити провайдери майстра провайдера для ізольованих тестів                                                                          |
| `createProviderUsageFetch`                           | Створити фікстури отримання даних про використання провайдера                                                                            |
| `useFrozenTime` / `useRealTime`                      | Заморозити й відновити таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                          |
| `createTestWizardPrompter`                           | Створити імітований prompter майстра налаштування                                                                                        |
| `createRuntimeTaskFlow`                              | Створити ізольований стан TaskFlow середовища виконання                                                                                  |
| `typedCases`                                         | Зберегти літеральні типи для табличних тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                   |

Набори контрактних тестів для вбудованих Plugin-ів також використовують тестові підшляхи SDK для допоміжних засобів тестового реєстру, маніфесту, публічних артефактів і runtime fixture. Набори тестів лише для core, які залежать від інвентарю вбудованого OpenClaw, залишаються в `src/plugins/contracts`.
Нові тести extension тримайте на задокументованому сфокусованому підшляху SDK, як-от
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість прямого імпорту широкого сумісного barrel-експорту `plugin-sdk/testing`, файлів репозиторію `src/**` або мостів репозиторію `test/helpers/*`.

### Типи

Сфокусовані тестові підшляхи також реекспортують типи, корисні у тестових файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні помилкові випадки для розв’язання цілі каналу:

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

Модульні тести, які передають власноруч написаний мок `api` до `register(api)`, не перевіряють acceptance gates завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача для кожної реєстраційної поверхні, від якої залежить ваш Plugin, особливо для hooks і ексклюзивних можливостей, як-от memory.

Справжній завантажувач зупиняє реєстрацію Plugin-а, коли бракує обов’язкових метаданих або Plugin викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест Plugin-а або експортований entry оголошував `kind: "memory"`.

### Тестування доступу до runtime-конфігурації

Віддавайте перевагу спільному моку runtime Plugin-а з `openclaw/plugin-sdk/plugin-test-runtime`.
Його застарілі моки `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)`
за замовчуванням викидають помилку, щоб тести ловили нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно покриває застарілу поведінку сумісності.

### Модульне тестування Plugin-а каналу

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

### Модульне тестування Plugin-а провайдера

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

### Мок runtime Plugin-а

Для коду, який використовує `createPluginRuntimeStore`, мокуйте runtime у тестах:

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

Віддавайте перевагу per-instance stubs замість мутації prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (Plugin-и в репозиторії)

Вбудовані Plugin-и мають контрактні тести, які перевіряють володіння реєстрацією:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin-и реєструють яких провайдерів
- Які Plugin-и реєструють яких провайдерів мовлення
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск scoped tests

Для конкретного Plugin-а:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Примусове застосування lint (Plugin-и в репозиторії)

Для Plugin-ів у репозиторії `pnpm check` примусово застосовує три правила:

1. **Жодних монолітних root-імпортів** -- root barrel `openclaw/plugin-sdk` відхиляється
2. **Жодних прямих імпортів `src/`** -- Plugin-и не можуть напряму імпортувати `../../src/`
3. **Жодних self-imports** -- Plugin-и не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні Plugin-и не підпадають під ці правила lint, але рекомендується дотримуватися тих самих шаблонів.

## Конфігурація тестів

OpenClaw використовує Vitest із порогами покриття V8. Для тестів Plugin-ів:

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
- [Plugin-и каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс Plugin-а каналу
- [Plugin-и провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- hooks Plugin-а провайдера
- [Створення Plugin-ів](/uk/plugins/building-plugins) -- посібник для початку роботи
