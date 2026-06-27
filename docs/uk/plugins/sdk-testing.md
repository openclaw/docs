---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні тестові утиліти з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих plugins
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-06-27T18:07:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Довідник із тестових утиліт, шаблонів і примусового lint-контролю для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять опрацьовані приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

Ці підшляхи тестових помічників є локальними для репозиторію вихідними точками входу для власних
тестів bundled-плагінів OpenClaw. Вони не є експортами пакетів для сторонніх плагінів і
можуть імпортувати Vitest або інші тестові залежності, доступні лише в репозиторії.

**Імпорт імітації Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту середовища виконання агента:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт тестового помічника каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестів цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тесту середовища виконання Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт імітації HTTP провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тесту середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт універсальної фікстури:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт імітації вбудованого модуля Node:** `openclaw/plugin-sdk/test-node-mocks`

У репозиторії OpenClaw для нових тестів bundled-плагінів надавайте перевагу наведеним нижче
цільовим підшляхам. Широкий barrel
`openclaw/plugin-sdk/testing` призначений лише для застарілої сумісності.
Запобіжники репозиторію відхиляють нові реальні імпорти з `plugin-sdk/testing` і
`plugin-sdk/test-utils`; ці назви залишаються лише як застарілі поверхні сумісності
для тестів записів сумісності.

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

| Експорт                                              | Призначення                                                                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створює мінімальний мок API плагіна для модульних тестів прямої реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту пригнічення доставки для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації fallback для адаптерів середовища виконання нативного агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`  |
| `createParameterFreeTool`                            | Створює фікстури схем динамічних інструментів для тестів контракту нативного середовища виконання. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`     |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                                  |
| `installChannelOutboundPayloadContractSuite`         | Встановлює контрактні випадки вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                     |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelActionsContractSuite`                 | Встановлює загальні контрактні випадки дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelSetupContractSuite`                   | Встановлює загальні контрактні випадки налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelStatusContractSuite`                  | Встановлює загальні контрактні випадки статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                          |
| `expectDirectoryIds`                                 | Перевіряє ідентифікатори каталогу каналу з функції списку каталогу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                             |
| `assertBundledChannelEntries`                        | Перевіряє, що вбудовані точки входу каналів надають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`                             |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові позначки envelope. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                                |
| `expectPairingReplyText`                             | Перевіряє текст відповіді pairing каналу й витягує його код. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                    |
| `describePluginRegistrationContract`                 | Встановлює перевірки контракту реєстрації плагіна. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                                             |
| `registerSingleProviderPlugin`                       | Реєструє один плагін провайдера в smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                    |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                                  |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох плагінах. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                             |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить ідентифікатор. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeEnv`                                   | Створює моковане середовище виконання CLI/плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                               |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби статусу налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | Встановлює перевірки контракту середовища виконання сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`                                  |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики replay провайдера пропускають інструменти й метадані, якими володіє провайдер. Імпортуйте з `plugin-sdk/provider-test-contracts`       |
| `runRealtimeSttLiveTest`                             | Запускає live-тест провайдера realtime STT зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`                                    |
| `normalizeTranscriptForMatch`                        | Нормалізує вивід live-транскрипту перед fuzzy-перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                                                  |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери оголошують явні можливості режиму генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`                                  |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери оголошують явні можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`                          |
| `mockSuccessfulDashscopeVideoTask`                   | Встановлює успішну відповідь відеозавдання, сумісну з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                                            |
| `getProviderHttpMocks`                               | Надає доступ до opt-in HTTP/auth моків провайдера Vitest. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                                   |
| `installProviderHttpMockCleanup`                     | Скидає HTTP/auth моки провайдера після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                                       |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                                                |
| `shouldAckReaction`                                  | Перевіряє, чи має канал додати реакцію підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                                              |
| `removeAckReactionAfterReply`                        | Видаляє реакцію підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                                            |
| `createTestRegistry`                                 | Створює фікстуру реєстру плагінів каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                                 |
| `createEmptyPluginRegistry`                          | Створює фікстуру порожнього реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                             |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для тестів середовища виконання плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`     |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах допоміжних засобів медіа. Імпортуйте з `plugin-sdk/test-env`                                                              |
| `withServer`                                         | Запускає тести проти одноразового локального HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                                  |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                                            |
| `withFetchPreconnect`                                | Запускає тести fetch із встановленими preconnect-хуками. Імпортуйте з `plugin-sdk/test-env`                                                                    |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані фікстури файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                                                                    |
| `createMockServerResponse`                           | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                                             |
| `createCliRuntimeCapture`                            | Захоплює вивід середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                                      |
| `importFreshModule`                                  | Імпортує ESM-модуль зі свіжим токеном запиту, щоб обійти кеш модулів. Імпортуйте з `plugin-sdk/test-fixtures`                                                 |
| `bundledPluginRoot` / `bundledPluginFile`            | Розв’язує шляхи фікстур джерела або dist вбудованого плагіна. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `mockNodeBuiltinModule`                              | Встановлює вузькі Vitest-моки вбудованих модулів Node. Імпортуйте з `plugin-sdk/test-node-mocks`                                                              |
| `createSandboxTestContext`                           | Створює контексти тестів sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                                                      |
| `writeSkill`                                         | Записує фікстури skill. Імпортуйте з `plugin-sdk/test-fixtures`                                                                                                |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                                       |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                                         |
| `sanitizeTerminalText`                               | Санітизує вивід термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                                               |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму виводу chunking. Імпортуйте з `plugin-sdk/test-fixtures`                                                                                       |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                                                       |
| `resolveProviderWizardOptions`                       | Розв’язує варіанти майстра налаштування провайдера в контрактних тестах                                                                                        |
| `resolveProviderModelPickerEntries`                  | Розв’язує записи model-picker провайдера в контрактних тестах                                                                                                  |
| `buildProviderPluginMethodChoice`                    | Створює ідентифікатори варіантів майстра провайдера для перевірок                                                                                              |
| `setProviderWizardProvidersResolverForTest`          | Інжектує провайдерів майстра провайдера для ізольованих тестів                                                                                                 |
| `createProviderUsageFetch`                           | Створення фікстур для отримання даних про використання провайдера                                                                        |
| `useFrozenTime` / `useRealTime`                      | Заморожування та відновлення таймерів для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                   |
| `createTestWizardPrompter`                           | Створення замоканого промптера майстра налаштування                                                                                      |
| `createRuntimeTaskFlow`                              | Створення ізольованого стану runtime task-flow                                                                                           |
| `typedCases`                                         | Збереження літеральних типів для табличних тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                |

Набори контрактних тестів для вбудованих плагінів також використовують тестові підшляхи SDK для допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і середовища виконання, призначених лише для тестів. Набори тестів лише для core, які залежать від вбудованого інвентарю OpenClaw, залишаються в `src/plugins/contracts`. Нові тести розширень тримайте на документованому сфокусованому підшляху SDK, як-от `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість прямого імпорту широкого агрегувального модуля сумісності `plugin-sdk/testing`, файлів репозиторію `src/**` або мостів репозиторію `test/helpers/*`.

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

## Тестування визначення цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для визначення цілі каналу:

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

Модульні тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють шлюзи прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків і ексклюзивних можливостей, як-от пам'ять.

Справжній завантажувач завершує реєстрацію плагіна з помилкою, коли бракує обов'язкових метаданих або плагін викликає API можливості, якою він не володіє. Наприклад, `api.registerHook(...)` вимагає назву хука, а `api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації середовища виконання

Надавайте перевагу спільному моку середовища виконання плагінів з `openclaw/plugin-sdk/channel-test-helpers` під час тестування вбудованих плагінів каналів. Його застарілі моки `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)` за замовчуванням кидають помилку, щоб тести виявляли нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно покриває поведінку застарілої сумісності.

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
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Модульне тестування плагіна провайдера

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

### Мокування середовища виконання плагіна

Для коду, що використовує `createPluginRuntimeStore`, мокуйте середовище виконання в тестах:

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

### Тестування зі стабами для окремого екземпляра

Надавайте перевагу стабам для окремого екземпляра, а не мутації прототипу:

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

- Які плагіни реєструють яких провайдерів
- Які плагіни реєструють яких мовленнєвих провайдерів
- Коректність форми реєстрації
- Відповідність контракту середовища виконання

### Запуск обмежених за областю тестів

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

## Застосування lint-правил (плагіни в репозиторії)

Для плагінів у репозиторії `pnpm check` застосовує три правила:

1. **Без монолітних кореневих імпортів** -- кореневий агрегувальний модуль `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці lint-правила, але рекомендовано дотримуватися тих самих шаблонів.

## Конфігурація тестів

OpenClaw використовує Vitest з порогами покриття V8. Для тестів плагінів:

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

Якщо локальні запуски створюють тиск на пам'ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов'язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
