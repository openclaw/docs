---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-27T22:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad2e95d9db988610931391c37f1fef12014dff717ceb1647bca241a1a438aeae
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і примусового застосування lint для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт:** `openclaw/plugin-sdk/testing`

Підшлях testing експортує вузький набір допоміжних засобів для авторів плагінів:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Експорт                                | Призначення                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок визначення цілі |
| `shouldAckReaction`                    | Перевіряє, чи повинен канал додавати реакцію підтвердження |
| `removeAckReactionAfterReply`          | Видаляє реакцію підтвердження після доставки відповіді |
| `createTestRegistry`                   | Створює фікстуру реєстру плагінів каналів              |
| `createEmptyPluginRegistry`            | Створює порожню фікстуру реєстру плагінів              |
| `setActivePluginRegistry`              | Встановлює фікстуру реєстру для тестів часу виконання плагіна |
| `createRequestCaptureJsonFetch`        | Перехоплює запити JSON fetch у тестах допоміжних засобів для медіа |
| `withFetchPreconnect`                  | Запускає тести fetch із встановленими хуками preconnect |
| `withEnv` / `withEnvAsync`             | Тимчасово змінює змінні середовища                     |
| `createTempHomeEnv` / `withTempDir`    | Створює ізольовані файлові фікстури для тестів         |
| `createMockServerResponse`             | Створює мінімальний мок відповіді HTTP-сервера         |
| `registerSingleProviderPlugin`         | Реєструє один плагін провайдера в smoke-тестах завантажувача |
| `registerProviderPlugin`               | Перехоплює всі типи провайдерів з одного плагіна       |
| `requireRegisteredProvider`            | Перевіряє, що колекція провайдерів містить id          |
| `createProviderUsageFetch`             | Створює фікстури fetch для використання провайдера     |
| `useFrozenTime` / `useRealTime`        | Заморожує та відновлює таймери для чутливих до часу тестів |
| `createRuntimeEnv`                     | Створює замокане середовище виконання CLI/плагіна      |
| `createTestWizardPrompter`             | Створює замоканий prompter майстра налаштування        |
| `createPluginSetupWizardStatus`        | Створює допоміжні засоби стану налаштування для плагінів каналів |
| `createRuntimeTaskFlow`                | Створює ізольований стан TaskFlow часу виконання       |
| `typedCases`                           | Зберігає literal-типи для таблично-керованих тестів    |

### Типи

Підшлях testing також повторно експортує типи, корисні у файлах тестів:

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

describe("визначення цілі my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка визначення цілі вашого каналу
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Додайте специфічні для каналу тестові випадки
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування контрактів реєстрації

Модульні тести, які передають вручну написаний мок `api` у `register(api)`, не перевіряють ворота прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків і ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач завершує реєстрацію плагіна помилкою, якщо відсутні обов’язкові метадані або якщо плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації часу виконання

Під час тестування вбудованих плагінів віддавайте перевагу спільному моку часу виконання плагіна з допоміжних засобів тестування репозиторію. Його моки `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)`, які є застарілими, за замовчуванням викидають помилку, щоб тести виявляли нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно покриває застарілу поведінку сумісності.

### Модульне тестування плагіна каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("плагін my-channel", () => {
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

### Модульне тестування плагіна провайдера

```typescript
import { describe, it, expect } from "vitest";

describe("плагін my-provider", () => {
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

### Мокання часу виконання плагіна

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

### Тестування з використанням стабів для окремих екземплярів

Віддавайте перевагу стабам для окремих екземплярів, а не зміні prototype:

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
- Відповідність контракту часу виконання

### Запуск тестів з обмеженою областю

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

## Примусове застосування lint (плагіни в репозиторії)

Три правила примусово застосовуються через `pnpm check` для плагінів у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` заборонений
2. **Без прямих імпортів `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під ці lint-правила, але рекомендується дотримуватися тих самих шаблонів.

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
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагінів провайдерів
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник із початку роботи
