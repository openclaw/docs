---
read_when:
    - Ви пишете тести для плагіна
    - Вам потрібні утиліти тестування з SDK плагіна
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування плагінів
x-i18n:
    generated_at: "2026-04-27T23:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e68bd201689490e9b42c8511fc205e5a14383c56e534270692cf3b21d0758e40
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і примусового застосування lint-правил для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Загальний імпорт:** `openclaw/plugin-sdk/testing`

**Імпорт моків Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контрактів каналів:** `openclaw/plugin-sdk/channel-contract-testing`

Підшлях testing експортує вузький набір допоміжних засобів для авторів плагінів:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
```

### Доступні експорти

| Export                                       | Призначення                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                        | Створює мінімальний мок plugin API для прямих unit-тестів реєстрації. Імпортується з `plugin-sdk/plugin-test-api` |
| `expectChannelInboundContextContract`        | Перевіряє форму вхідного контексту каналу. Імпортується з `plugin-sdk/channel-contract-testing`             |
| `installChannelOutboundPayloadContractSuite` | Додає набір контрактних перевірок для вихідного payload каналу. Імпортується з `plugin-sdk/channel-contract-testing` |
| `installCommonResolveTargetErrorCases`       | Спільні тестові випадки для обробки помилок під час визначення цілі                                          |
| `shouldAckReaction`                          | Перевіряє, чи має канал додавати реакцію підтвердження                                                       |
| `removeAckReactionAfterReply`                | Видаляє реакцію підтвердження після доставки відповіді                                                       |
| `createTestRegistry`                         | Створює тестову фікстуру реєстру плагінів каналів                                                            |
| `createEmptyPluginRegistry`                  | Створює порожню тестову фікстуру реєстру плагінів                                                            |
| `setActivePluginRegistry`                    | Встановлює фікстуру реєстру для runtime-тестів плагінів                                                      |
| `createRequestCaptureJsonFetch`              | Перехоплює JSON-запити fetch у тестах медіадопоміжних засобів                                                |
| `withFetchPreconnect`                        | Запускає тести fetch із встановленими хуками preconnect                                                      |
| `withEnv` / `withEnvAsync`                   | Тимчасово змінює змінні середовища                                                                           |
| `createTempHomeEnv` / `withTempDir`          | Створює ізольовані файлові тестові фікстури                                                                  |
| `createMockServerResponse`                   | Створює мінімальний мок HTTP-відповіді сервера                                                               |
| `registerSingleProviderPlugin`               | Реєструє один плагін провайдера в smoke-тестах завантажувача                                                 |
| `registerProviderPlugin`                     | Збирає всі типи провайдерів з одного плагіна                                                                 |
| `registerProviderPlugins`                    | Збирає реєстрації провайдерів з кількох плагінів                                                             |
| `requireRegisteredProvider`                  | Перевіряє, що колекція провайдерів містить id                                                                |
| `runProviderCatalog`                         | Виконує хук каталогу провайдера з тестовими залежностями                                                     |
| `resolveProviderWizardOptions`               | Визначає варіанти майстра налаштування провайдера в контрактних тестах                                       |
| `resolveProviderModelPickerEntries`          | Визначає елементи вибору моделей провайдера в контрактних тестах                                             |
| `buildProviderPluginMethodChoice`            | Створює id варіантів майстра провайдера для перевірок                                                        |
| `setProviderWizardProvidersResolverForTest`  | Впроваджує провайдери майстра для ізольованих тестів                                                         |
| `createProviderUsageFetch`                   | Створює фікстури fetch для використання провайдера                                                           |
| `useFrozenTime` / `useRealTime`              | Заморожує та відновлює таймери для чутливих до часу тестів                                                   |
| `createRuntimeEnv`                           | Створює змокане CLI/runtime-середовище плагіна                                                               |
| `createTestWizardPrompter`                   | Створює змоканий prompter майстра налаштування                                                               |
| `createPluginSetupWizardStatus`              | Створює допоміжні засоби стану налаштування для плагінів каналів                                             |
| `createRuntimeTaskFlow`                      | Створює ізольований стан runtime TaskFlow                                                                    |
| `typedCases`                                 | Зберігає літеральні типи для табличних тестів                                                                |

Контрактні набори тестів для вбудованих плагінів також використовують підшляхи SDK testing для тестових допоміжних засобів реєстру, маніфесту, публічних артефактів і runtime-фікстур. Нові тести розширень мають використовувати `openclaw/plugin-sdk/testing` або вужчий задокументований підшлях SDK, як-от `plugin-sdk/plugin-test-api` чи `plugin-sdk/channel-contract-testing`, замість прямого імпорту файлів `src/**` із репозиторію.

### Типи

Підшлях testing також повторно експортує типи, корисні у тестових файлах:

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

## Тестування визначення цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для визначення цілі каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

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

Unit-тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють умови прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків та ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач завершує реєстрацію плагіна з помилкою, якщо бракує обов’язкових метаданих або якщо плагін викликає API можливості, якою не володіє. Наприклад,
`api.registerHook(...)` потребує назви хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до runtime-конфігурації

Під час тестування вбудованих плагінів віддавайте перевагу спільному моку runtime плагіна з допоміжних засобів тестування репозиторію. Його застарілі моки `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно покриває застарілу поведінку сумісності.

### Unit-тестування плагіна каналу

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

### Unit-тестування плагіна провайдера

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

### Мокання runtime плагіна

Для коду, який використовує `createPluginRuntimeStore`, замокуйте runtime у тестах:

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

### Тестування з окремими стабами для екземплярів

Віддавайте перевагу окремим стабам для екземплярів замість мутації прототипу:

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
- Відповідність runtime-контракту

### Запуск тестів для окремої області

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

## Примусове застосування lint-правил (плагіни в репозиторії)

Три правила застосовуються через `pnpm check` для плагінів у репозиторії:

1. **Жодних монолітних кореневих імпортів** -- кореневий barrel `openclaw/plugin-sdk` заборонений
2. **Жодних прямих імпортів із `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Жодних self-imports** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці lint-правила, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестування

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

Якщо локальні запуски спричиняють нестачу пам’яті:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
