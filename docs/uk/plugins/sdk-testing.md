---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для bundled Plugin
sidebarTitle: Testing
summary: Утиліти тестування та шаблони для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-27T12:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3030e2a838b641433da2882270ef2b332284a7fc2f16037681b51536de42998e
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і lint-контролю для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** У how-to посібниках є готові приклади тестів:
  [Тести Plugin каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Plugin провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
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

| Експорт                                | Призначення                                           |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок визначення цілі |
| `shouldAckReaction`                    | Перевірити, чи має канал додавати ack reaction        |
| `removeAckReactionAfterReply`          | Видалити ack reaction після доставки відповіді        |

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

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цілей каналу:

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

  // Додайте тестові випадки, специфічні для каналу
  it("має визначати цілі @username", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування контрактів реєстрації

Юніт-тести, які передають написаний вручну mock `api` у `register(api)`, не перевіряють
шлюзи прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі loader
для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для hooks і
ексклюзивних можливостей, таких як memory.

Справжній loader відхиляє реєстрацію Plugin, коли відсутні потрібні метадані або
Plugin викликає API можливості, якою не володіє. Наприклад,
`api.registerHook(...)` вимагає ім’я hook, а
`api.registerMemoryCapability(...)` вимагає, щоб manifest Plugin або експортований
entry оголошував `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Під час тестування bundled Plugin надавайте перевагу спільному mock runtime Plugin із допоміжних засобів тестування репозиторію. Його застарілі mock `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці mocks лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

### Юніт-тестування Plugin каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("має визначати обліковий запис із конфігурації", () => {
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

  it("має перевіряти обліковий запис без materializing секретів", () => {
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

### Юніт-тестування Plugin провайдера

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

  it("має повертати каталог, коли доступний API key", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mock runtime Plugin

Для коду, який використовує `createPluginRuntimeStore`, mock runtime у тестах має виглядати так:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// У налаштуванні тесту
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... інші mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... інші простори імен
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Після тестів
store.clearRuntime();
```

### Тестування зі stub для окремих екземплярів

Надавайте перевагу stub для окремих екземплярів замість мутації prototype:

```typescript
// Бажано: stub для окремого екземпляра
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: мутація prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (Plugin у репозиторії)

Bundled Plugin мають контрактні тести, які перевіряють право власності на реєстрацію:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin реєструють які провайдери
- Які Plugin реєструють які speech providers
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск тестів з обмеженням області

Для конкретного Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише контрактні тести:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint-контроль (Plugin у репозиторії)

`pnpm check` застосовує три правила для Plugin у репозиторії:

1. **Без монолітних імпортів з кореня** -- кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- Plugin не можуть напряму імпортувати `../../src/`
3. **Без self-imports** -- Plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні Plugin не підпадають під ці lint-правила, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестування

OpenClaw використовує Vitest із порогами покриття V8. Для тестів Plugin:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного Plugin
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

## Пов’язані теми

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [SDK Plugin каналів](/uk/plugins/sdk-channel-plugins) -- інтерфейс Plugin каналу
- [SDK Plugin провайдерів](/uk/plugins/sdk-provider-plugins) -- hooks Plugin провайдера
- [Створення Plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
