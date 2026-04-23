---
read_when:
    - Ви пишете тести для Plugin-а
    - Вам потрібні тестові утиліти з SDK Plugin-а
    - Ви хочете зрозуміти контрактні тести для bundled Plugin-ів
sidebarTitle: Testing
summary: Утиліти тестування й шаблони для Plugin-ів OpenClaw
title: Тестування Plugin-ів
x-i18n:
    generated_at: "2026-04-23T21:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з тестових утиліт, шаблонів і lint-enforcement для Plugin-ів
OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** У how-to guide є готові приклади тестів:
  [Тести channel plugin](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести provider plugin](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

**Імпорт:** `openclaw/plugin-sdk/testing`

Підшлях testing експортує вузький набір helper-ів для авторів Plugin-ів:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Експорт                                | Призначення                                           |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок визначення цілі |
| `shouldAckReaction`                    | Перевірка, чи має канал додавати ack-реакцію          |
| `removeAckReactionAfterReply`          | Видалення ack-реакції після доставки відповіді        |

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

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цілі каналу:

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
  it("має визначати цілі @username", () => {
    // ...
  });
});
```

## Шаблони тестування

### Unit-тестування channel plugin

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("має визначати акаунт із config", () => {
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

  it("має інспектувати акаунт без materializing секретів", () => {
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

### Unit-тестування provider plugin

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("має визначати динамічні моделі", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("має повертати каталог, коли API key доступний", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Мокання runtime Plugin-а

Для коду, який використовує `createPluginRuntimeStore`, мокуйте runtime у тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// У setup тесту
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... інші моки
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... інші простори імен
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Після тестів
store.clearRuntime();
```

### Тестування з per-instance stub-ами

Надавайте перевагу per-instance stub-ам замість mutation prototype:

```typescript
// Рекомендовано: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникати: mutation prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (Plugin-и в репозиторії)

Bundled Plugin-и мають контрактні тести, які перевіряють ownership реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin-и реєструють які provider-и
- Які Plugin-и реєструють які speech provider-и
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск scoped-тестів

Для конкретного Plugin-а:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint-enforcement (Plugin-и в репозиторії)

Три правила забезпечуються через `pnpm check` для Plugin-ів у репозиторії:

1. **Без монолітних root-імпортів** — root barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** — Plugin-и не можуть імпортувати `../../src/` напряму
3. **Без self-import-ів** — Plugin-и не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні Plugin-и не підпадають під ці lint-правила, але дотримуватися тих самих
шаблонів рекомендовано.

## Конфігурація тестів

OpenClaw використовує Vitest із порогами покриття V8. Для тестів Plugin-ів:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного Plugin-а
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за конкретною назвою тесту
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з coverage
pnpm test:coverage
```

Якщо локальні запуски створюють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [SDK Channel Plugins](/uk/plugins/sdk-channel-plugins) -- інтерфейс channel plugin
- [SDK Provider Plugins](/uk/plugins/sdk-provider-plugins) -- hooks provider plugin
- [Створення Plugin-ів](/uk/plugins/building-plugins) -- посібник для початку роботи
