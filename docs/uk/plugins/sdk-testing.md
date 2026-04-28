---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих Plugin
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування плагінів
x-i18n:
    generated_at: "2026-04-28T01:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f9a601a4e4eb479c242ea3c59771c6a033dad6b75d616d9977c1614087dc002
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і застосування lint для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт для сумісності:** `openclaw/plugin-sdk/testing`

**Імпорт мока API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілей каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тестування рантайму Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

Для нових тестів плагінів віддавайте перевагу наведеним нижче вузькоспрямованим підшляхам. Широкий barrel `openclaw/plugin-sdk/testing` зберігається для сумісності зі старішими тестами
та допоміжними засобами, які ще не були перенесені на вужчу документовану поверхню.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { withEnv, withFetchPreconnect } from "openclaw/plugin-sdk/test-env";
import { createCliRuntimeCapture, typedCases } from "openclaw/plugin-sdk/test-fixtures";
```

### Доступні експорти

| Export                                          | Призначення                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                           | Створює мінімальний мок API плагіна для прямих модульних тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                |
| `expectChannelInboundContextContract`           | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                         |
| `installChannelOutboundPayloadContractSuite`    | Встановлює набір перевірок контракту вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                     |
| `createStartAccountContext`                     | Створює контексти життєвого циклу акаунта каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                      |
| `installChannelActionsContractSuite`            | Встановлює загальний набір перевірок контракту дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                |
| `installChannelSetupContractSuite`              | Встановлює загальний набір перевірок контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                   |
| `installChannelStatusContractSuite`             | Встановлює загальний набір перевірок контракту статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                        |
| `expectDirectoryIds`                            | Перевіряє ідентифікатори каталогів із функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                       |
| `describePluginRegistrationContract`            | Встановлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                    |
| `registerSingleProviderPlugin`                  | Реєструє один плагін провайдера в smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                          |
| `registerProviderPlugin`                        | Захоплює всі типи провайдерів з одного плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugins`                       | Захоплює реєстрації провайдерів у кількох плагінах. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                     | Перевіряє, що колекція провайдерів містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                          |
| `createRuntimeEnv`                              | Створює змокане середовище рантайму CLI/плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                        |
| `createPluginSetupWizardStatus`                 | Створює допоміжні засоби статусу майстра налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`            |
| `describeOpenAIProviderRuntimeContract`         | Встановлює перевірки контракту рантайму сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`                     |
| `installCommonResolveTargetErrorCases`          | Спільні тестові випадки для обробки помилок розв’язання цілей. Імпортуйте з `plugin-sdk/channel-target-testing`                      |
| `shouldAckReaction`                             | Перевіряє, чи має канал додати ack-реакцію. Імпортуйте з `plugin-sdk/channel-feedback`                                                |
| `removeAckReactionAfterReply`                   | Видаляє ack-реакцію після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                              |
| `createTestRegistry`                            | Створює фікстуру реєстру плагінів каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`        |
| `createEmptyPluginRegistry`                     | Створює порожню фікстуру реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                       | Встановлює фікстуру реєстру для тестів рантайму плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                 | Захоплює JSON fetch-запити в тестах медіадопоміжних засобів. Імпортуйте з `plugin-sdk/test-env`                                       |
| `withFetchPreconnect`                           | Запускає fetch-тести з увімкненими preconnect hooks. Імпортуйте з `plugin-sdk/test-env`                                               |
| `withEnv` / `withEnvAsync`                      | Тимчасово підміняє змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                              |
| `createTempHomeEnv` / `withTempDir`             | Створює ізольовані файлові фікстури для тестів. Імпортуйте з `plugin-sdk/test-env`                                                    |
| `createMockServerResponse`                      | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                       | Захоплює вивід рантайму CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `createSandboxTestContext`                      | Створює контексти тестування sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `writeSkill`                                    | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                      |
| `makeAgentAssistantMessage`                     | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                              |
| `peekSystemEvents` / `resetSystemEventsForTest` | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                |
| `sanitizeTerminalText`                          | Очищає текст термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `countLines` / `hasBalancedFences`              | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                                              |
| `runProviderCatalog`                            | Виконує хук каталогу провайдерів із тестовими залежностями                                                                             |
| `resolveProviderWizardOptions`                  | Розв’язує варіанти майстра налаштування провайдера в контрактних тестах                                                                |
| `resolveProviderModelPickerEntries`             | Розв’язує записи вибору моделей провайдера в контрактних тестах                                                                        |
| `buildProviderPluginMethodChoice`               | Створює id варіантів майстра провайдера для перевірок                                                                                  |
| `setProviderWizardProvidersResolverForTest`     | Інжектує провайдери майстра для ізольованих тестів                                                                                     |
| `createProviderUsageFetch`                      | Створює фікстури fetch використання провайдера                                                                                         |
| `useFrozenTime` / `useRealTime`                 | Заморожує та відновлює таймери для чутливих до часу тестів. Імпортуйте з `plugin-sdk/test-env`                                        |
| `createTestWizardPrompter`                      | Створює змоканий prompter майстра налаштування                                                                                         |
| `createRuntimeTaskFlow`                         | Створює ізольований стан TaskFlow рантайму                                                                                             |
| `typedCases`                                    | Зберігає literal-типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                       |

Набори контрактних тестів вбудованих плагінів також використовують підшляхи тестування SDK для допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і рантайму, призначених лише для тестів. Набори, що залежать лише від core і використовують вбудований інвентар OpenClaw, залишаються в `src/plugins/contracts`.
Для нових тестів розширень використовуйте документований вузькоспрямований підшлях SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`,
`plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість імпорту з
широкого сумісного barrel `plugin-sdk/testing`, файлів репозиторію `src/**` або
містків `test/helpers/plugins/*` репозиторію напряму.

### Типи

Підшлях тестування також повторно експортує типи, корисні у тестових файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## Тестування розв’язання цілей

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
розв’язання цілей каналу:

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

Модульні тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють
контрольні точки прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест,
підтримуваний завантажувачем, для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для hooks і
ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач завершує реєстрацію плагіна помилкою, якщо відсутні обов’язкові метадані або
плагін викликає API можливості, якою не володіє. Наприклад,
`api.registerHook(...)` вимагає ім’я hook, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу
оголошували `kind: "memory"`.

### Тестування доступу до конфігурації рантайму

Віддавайте перевагу спільному моку рантайму плагіна з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих плагінів каналів. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно перевіряє застарілу поведінку сумісності.

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

### Мокання рантайму плагіна

Для коду, що використовує `createPluginRuntimeStore`, мокуйте рантайм у тестах:

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

### Тестування зі стабами на рівні екземпляра

Віддавайте перевагу стабам на рівні екземпляра замість мутації прототипу:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють належність реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють які провайдери
- Які плагіни реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність контракту рантайму

### Запуск обмежених тестів

Для конкретного плагіна:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Застосування lint (плагіни в репозиторії)

Три правила застосовуються через `pnpm check` для плагінів у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` заборонений
2. **Без прямих імпортів із `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці правила lint, але рекомендується дотримуватися тих самих
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

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- hooks плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
