---
read_when:
    - Ви пишете тести для плагіна
    - Вам потрібні утиліти тестування з SDK плагіна
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування плагінів
x-i18n:
    generated_at: "2026-04-27T23:18:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb4a2a2c8005ff43ab7ee74d4e56e8ddfc3d1f07e9bfd5ed19c04e3a0cadff8f
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і контролю lint для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт:** `openclaw/plugin-sdk/testing`

Підшлях для тестування експортує вузький набір допоміжних засобів для авторів плагінів:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Export                                      | Purpose                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| `installCommonResolveTargetErrorCases`      | Спільні тестові сценарії для обробки помилок під час визначення цілі |
| `shouldAckReaction`                         | Перевіряє, чи має канал додати реакцію-підтвердження    |
| `removeAckReactionAfterReply`               | Видаляє реакцію-підтвердження після доставки відповіді  |
| `createTestRegistry`                        | Створює фікстуру реєстру плагінів каналів               |
| `createEmptyPluginRegistry`                 | Створює порожню фікстуру реєстру плагінів               |
| `setActivePluginRegistry`                   | Встановлює фікстуру реєстру для runtime-тестів плагінів |
| `createRequestCaptureJsonFetch`             | Перехоплює JSON fetch-запити в тестах допоміжних медіа-функцій |
| `withFetchPreconnect`                       | Запускає fetch-тести з установленими preconnect-хуками  |
| `withEnv` / `withEnvAsync`                  | Тимчасово підміняє змінні середовища                    |
| `createTempHomeEnv` / `withTempDir`         | Створює ізольовані фікстури файлової системи            |
| `createMockServerResponse`                  | Створює мінімальний мок HTTP-відповіді сервера          |
| `registerSingleProviderPlugin`              | Реєструє один плагін провайдера в smoke-тестах завантажувача |
| `registerProviderPlugin`                    | Захоплює всі типи провайдерів з одного плагіна          |
| `registerProviderPlugins`                   | Захоплює реєстрації провайдерів у кількох плагінах      |
| `requireRegisteredProvider`                 | Перевіряє, що колекція провайдерів містить id           |
| `runProviderCatalog`                        | Виконує хук каталогу провайдера з тестовими залежностями |
| `resolveProviderWizardOptions`              | Визначає варіанти майстра налаштування провайдера в контрактних тестах |
| `resolveProviderModelPickerEntries`         | Визначає записи вибору моделей провайдера в контрактних тестах |
| `buildProviderPluginMethodChoice`           | Створює id варіантів майстра провайдера для перевірок   |
| `setProviderWizardProvidersResolverForTest` | Впроваджує провайдери майстра для ізольованих тестів    |
| `createProviderUsageFetch`                  | Створює фікстури fetch для даних про використання провайдера |
| `useFrozenTime` / `useRealTime`             | Заморожує та відновлює таймери для чутливих до часу тестів |
| `createRuntimeEnv`                          | Створює змокане середовище виконання CLI/плагіна        |
| `createTestWizardPrompter`                  | Створює змоканий prompter майстра налаштування          |
| `createPluginSetupWizardStatus`             | Створює допоміжні засоби стану налаштування для плагінів каналів |
| `createRuntimeTaskFlow`                     | Створює ізольований runtime-стан TaskFlow               |
| `typedCases`                                | Зберігає літеральні типи для таблично-орієнтованих тестів |

Набори контрактних тестів для вбудованих плагінів також використовують цей підшлях для допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і runtime. Нові тести розширень варто будувати на `openclaw/plugin-sdk/testing` або на вужчому задокументованому підшляху SDK, а не імпортувати файли репозиторію `src/**` напряму.

### Типи

Підшлях для тестування також повторно експортує типи, корисні у файлах тестів:

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

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні сценарії помилок для визначення цілі каналу:

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

Модульні тести, які передають власноруч написаний мок `api` у `register(api)`, не перевіряють acceptance-gates завантажувача OpenClaw. Додайте щонайменше один smoke-тест на основі завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків і виняткових можливостей, таких як пам’ять.

Реальний завантажувач завершує реєстрацію плагіна помилкою, якщо бракує потрібних метаданих або якщо плагін викликає API можливостей, якими він не володіє. Наприклад, `api.registerHook(...)` потребує назви хука, а `api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортований entry оголошував `kind: "memory"`.

### Тестування доступу до runtime-конфігурації

Під час тестування вбудованих плагінів надавайте перевагу спільному моку runtime плагіна з допоміжних тестових засобів репозиторію. Його моки `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)`, які вважаються застарілими, за замовчуванням викидають помилку, щоб тести виявляли нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно перевіряє застарілу поведінку сумісності.

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

### Тестування зі стабами на рівні екземпляра

Надавайте перевагу стабам на рівні екземпляра замість мутації прототипу:

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
- Які плагіни реєструють які провайдери мовлення
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

## Контроль lint (плагіни в репозиторії)

Для плагінів у репозиторії через `pnpm check` застосовуються три правила:

1. **Без монолітних кореневих імпортів** -- кореневий barrel `openclaw/plugin-sdk` заборонено
2. **Без прямих імпортів `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці правила lint, але дотримуватися тих самих шаблонів рекомендується.

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

Якщо локальні запуски спричиняють навантаження на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагінів провайдерів
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
