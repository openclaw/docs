---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні тестові утиліти з Plugin SDK
    - Ви хочете зрозуміти контрактні тести для вбудованих Plugin
sidebarTitle: Testing
summary: Утиліти тестування та шаблони для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-27T06:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4bcc5b5ecf4053d392a368947e5b62bab4fc27ab33fbf4d62919ec2a887e389
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з тестових утиліт, шаблонів і lint-контролю для Plugin
OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести Plugin каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

**Імпорт:** `openclaw/plugin-sdk/testing`

Підшлях testing експортує вузький набір helper-ів для авторів Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Export                                 | Призначення                                           |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок під час розв’язання цілі |
| `shouldAckReaction`                    | Перевірка, чи має канал додавати ack-реакцію          |
| `removeAckReactionAfterReply`          | Видалення ack-реакції після доставки відповіді        |

### Типи

Підшлях testing також повторно експортує типи, корисні в тестових файлах:

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

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
розв’язання цілі каналу:

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

Юніт-тести, які передають вручну написаний mock `api` у `register(api)`, не перевіряють
acceptance gates завантажувача OpenClaw. Додайте щонайменше один smoke-тест із реальним завантажувачем
для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для hooks і
ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач завершує реєстрацію Plugin помилкою, якщо бракує обов’язкових метаданих або
Plugin викликає API можливості, якою не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб manifest Plugin або експортована точка входу декларували `kind: "memory"`.

### Юніт-тестування Plugin каналу

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

### Юніт-тестування Plugin провайдера

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

### Mock Plugin runtime

Для коду, який використовує `createPluginRuntimeStore`, робіть mock runtime у тестах:

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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
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

## Контрактні тести (Plugin у репозиторії)

Вбудовані Plugin мають контрактні тести, які перевіряють ownership реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin реєструють які провайдери
- Які Plugin реєструють які speech-провайдери
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск тестів з обмеженням області

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

## Lint-контроль (Plugin у репозиторії)

Три правила контролюються через `pnpm check` для Plugin у репозиторії:

1. **Без монолітних імпортів із кореня** — кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів із `src/`** — Plugin не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** — Plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні Plugin не підпадають під ці lint-правила, але рекомендується дотримуватися тих самих шаблонів.

## Конфігурація тестів

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

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [SDK Plugin каналів](/uk/plugins/sdk-channel-plugins) -- інтерфейс Plugin каналу
- [SDK Plugin провайдерів](/uk/plugins/sdk-provider-plugins) -- hooks Plugin провайдерів
- [Створення Plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
