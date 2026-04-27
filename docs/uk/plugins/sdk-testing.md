---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих Plugin
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-27T22:22:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358a1e76d6a8e78ad503b040d49bab7f66fa8bfb2f1fe7dcb6088ef932e56860
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і забезпечення правил lint для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести Channel Plugin](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Provider Plugin](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт:** `openclaw/plugin-sdk/testing`

Підшлях testing експортує вузький набір допоміжних засобів для авторів Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Export                                 | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок під час визначення цілі |
| `shouldAckReaction`                    | Перевіряє, чи повинен канал додавати реакцію-підтвердження |
| `removeAckReactionAfterReply`          | Видаляє реакцію-підтвердження після доставки відповіді |
| `createTestRegistry`                   | Створює фікстуру реєстру Channel Plugin           |
| `createEmptyPluginRegistry`            | Створює порожню фікстуру реєстру Plugin           |
| `setActivePluginRegistry`              | Встановлює фікстуру реєстру для runtime-тестів Plugin |
| `createRequestCaptureJsonFetch`        | Перехоплює JSON fetch-запити в тестах медіадопоміжників |
| `withFetchPreconnect`                  | Запускає fetch-тести зі встановленими хуками preconnect |
| `withEnv` / `withEnvAsync`             | Тимчасово підміняє змінні середовища              |
| `createTempHomeEnv` / `withTempDir`    | Створює ізольовані файлові фікстури для тестів    |
| `createMockServerResponse`             | Створює мінімальний mock-відповідь HTTP-сервера   |
| `registerSingleProviderPlugin`         | Реєструє один Provider Plugin у smoke-тестах завантажувача |
| `createRuntimeTaskFlow`                | Створює ізольований стан runtime TaskFlow         |
| `typedCases`                           | Зберігає literal-типи для табличних тестів        |

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

Юніт-тести, які передають вручну написаний mock `api` до `register(api)`, не перевіряють acceptance gate завантажувача OpenClaw. Додайте щонайменше один smoke-тест на основі завантажувача для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для hook і ексклюзивних можливостей, таких як memory.

Справжній завантажувач відхиляє реєстрацію Plugin, якщо бракує обов’язкових метаданих або якщо Plugin викликає API можливості, якою він не володіє. Наприклад, `api.registerHook(...)` вимагає назву hook, а `api.registerMemoryCapability(...)` вимагає, щоб маніфест Plugin або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до runtime-конфігурації

Під час тестування вбудованих Plugin віддавайте перевагу спільному mock runtime Plugin із допоміжних засобів тестування репозиторію. Його застарілі mock `runtime.config.loadConfig()` і `runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове використання API сумісності. Перевизначайте ці mock лише тоді, коли тест явно перевіряє застарілу поведінку сумісності.

### Юніт-тестування Channel Plugin

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

### Юніт-тестування Provider Plugin

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

### Мокування runtime Plugin

Для коду, який використовує `createPluginRuntimeStore`, мокайте runtime у тестах:

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

## Контрактні тести (Plugin у репозиторії)

Вбудовані Plugin мають контрактні тести, які перевіряють володіння реєстрацією:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin реєструють які провайдери
- Які Plugin реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск тестів з обмеженою областю

Для конкретного Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Забезпечення правил lint (Plugin у репозиторії)

`pnpm check` застосовує три правила для Plugin у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- Plugin не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- Plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

На зовнішні Plugin ці правила lint не поширюються, але дотримуватися тих самих шаблонів рекомендовано.

## Конфігурація тестування

OpenClaw використовує Vitest із порогами покриття V8. Для тестів Plugin:

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

Якщо локальні запуски створюють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [SDK Channel Plugins](/uk/plugins/sdk-channel-plugins) -- інтерфейс Channel Plugin
- [SDK Provider Plugins](/uk/plugins/sdk-provider-plugins) -- hook Provider Plugin
- [Створення Plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
