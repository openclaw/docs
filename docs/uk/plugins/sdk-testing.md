---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих Plugin
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T00:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c96065868b3c8fcd30ef3e51fb7c13e73d5742c8f1cc66bc93eb089c0d1a76
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і застосування lint для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Покрокові посібники містять готові приклади тестів:
  [Тести channel Plugin](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести provider Plugin](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Загальний імпорт:** `openclaw/plugin-sdk/testing`

**Імпорт мока Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт channel contract:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт channel test helper:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт plugin contract:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт plugin runtime test:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт provider contract:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт environment/network test:** `openclaw/plugin-sdk/test-env`

**Імпорт generic fixture:** `openclaw/plugin-sdk/test-fixtures`

Підшлях testing експортує вузький набір helper-утиліт для авторів Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
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

| Export                                          | Purpose                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                           | Створює мінімальний мок Plugin API для прямих unit-тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api` |
| `expectChannelInboundContextContract`           | Перевіряє форму вхідного channel-контексту. Імпортуйте з `plugin-sdk/channel-contract-testing`              |
| `installChannelOutboundPayloadContractSuite`    | Додає contract-випадки для вихідного payload channel. Імпортуйте з `plugin-sdk/channel-contract-testing`    |
| `createStartAccountContext`                     | Створює контексти життєвого циклу channel-акаунта. Імпортуйте з `plugin-sdk/channel-test-helpers`           |
| `describePluginRegistrationContract`            | Додає перевірки contract реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                 |
| `registerSingleProviderPlugin`                  | Реєструє один provider Plugin у smoke-тестах loader. Імпортуйте з `plugin-sdk/plugin-test-runtime`          |
| `registerProviderPlugin`                        | Захоплює всі типи provider з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                   |
| `registerProviderPlugins`                       | Захоплює реєстрації provider у кількох Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                |
| `requireRegisteredProvider`                     | Перевіряє, що колекція provider містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                   |
| `createRuntimeEnv`                              | Створює змокане середовище виконання CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`              |
| `createPluginSetupWizardStatus`                 | Створює helper-утиліти стану налаштування для channel Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` |
| `describeOpenAIProviderRuntimeContract`         | Додає перевірки runtime contract для сімейства provider. Імпортуйте з `plugin-sdk/provider-test-contracts`  |
| `installCommonResolveTargetErrorCases`          | Спільні test-випадки для обробки помилок розв’язання цілі                                                   |
| `shouldAckReaction`                             | Перевіряє, чи повинен channel додавати реакцію ack                                                          |
| `removeAckReactionAfterReply`                   | Видаляє реакцію ack після доставки відповіді                                                                 |
| `createTestRegistry`                            | Створює fixture реєстру channel Plugin                                                                       |
| `createEmptyPluginRegistry`                     | Створює порожню fixture реєстру Plugin                                                                       |
| `setActivePluginRegistry`                       | Встановлює fixture реєстру для runtime-тестів Plugin                                                         |
| `createRequestCaptureJsonFetch`                 | Захоплює JSON fetch-запити в тестах helper-утиліт медіа. Імпортуйте з `plugin-sdk/test-env`                 |
| `withFetchPreconnect`                           | Запускає fetch-тести з установленими hook-ами preconnect. Імпортуйте з `plugin-sdk/test-env`               |
| `withEnv` / `withEnvAsync`                      | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                      |
| `createTempHomeEnv` / `withTempDir`             | Створює ізольовані fixture файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                 |
| `createMockServerResponse`                      | Створює мінімальний мок HTTP server response. Імпортуйте з `plugin-sdk/test-env`                            |
| `createCliRuntimeCapture`                       | Захоплює вивід середовища виконання CLI в тестах. Імпортуйте з `plugin-sdk/test-fixtures`                   |
| `createSandboxTestContext`                      | Створює тестові контексти sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                  |
| `writeSkill`                                    | Записує fixture Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                              |
| `makeAgentAssistantMessage`                     | Створює fixture повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                     |
| `peekSystemEvents` / `resetSystemEventsForTest` | Переглядає й скидає fixture системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                        |
| `sanitizeTerminalText`                          | Очищає текст термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                               |
| `countLines` / `hasBalancedFences`              | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                    |
| `runProviderCatalog`                            | Виконує hook каталогу provider з тестовими залежностями                                                     |
| `resolveProviderWizardOptions`                  | Розв’язує варіанти setup wizard provider у contract-тестах                                                  |
| `resolveProviderModelPickerEntries`             | Розв’язує записи model-picker provider у contract-тестах                                                    |
| `buildProviderPluginMethodChoice`               | Створює id вибору wizard для provider Plugin для перевірок                                                  |
| `setProviderWizardProvidersResolverForTest`     | Інжектує provider для provider wizard в ізольованих тестах                                                  |
| `createProviderUsageFetch`                      | Створює fixture fetch використання provider                                                                  |
| `useFrozenTime` / `useRealTime`                 | Заморожує та відновлює таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`            |
| `createTestWizardPrompter`                      | Створює змоканий prompter setup wizard                                                                       |
| `createRuntimeTaskFlow`                         | Створює ізольований стан TaskFlow середовища виконання                                                      |
| `typedCases`                                    | Зберігає literal-типи для table-driven тестів. Імпортуйте з `plugin-sdk/test-fixtures`                      |

Contract-suite для вбудованих Plugin також використовують testing-підшляхи SDK для
допоміжних test-only fixture реєстру, manifest, public-artifact і runtime. Core-only
suite, які залежать від вбудованого inventory OpenClaw, залишаються в `src/plugins/contracts`.
Нові тести extension слід тримати на `openclaw/plugin-sdk/testing` або на вужчому
задокументованому підшляху SDK, такому як `plugin-sdk/plugin-test-api` або
`plugin-sdk/channel-contract-testing`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/test-env` чи
`plugin-sdk/test-fixtures`, замість
імпорту файлів repo `src/**` або мостів repo `test/helpers/plugins/*` напряму.

### Types

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

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
розв’язання цілі channel:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка розв’язання цілі вашого channel
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Додайте специфічні для channel test-випадки
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування contract реєстрації

Unit-тести, які передають власноруч написаний мок `api` у `register(api)`, не перевіряють
acceptance gate loader OpenClaw. Додайте принаймні один smoke-тест на основі loader
для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для hook-ів і
ексклюзивних можливостей, таких як пам’ять.

Справжній loader завершує реєстрацію Plugin помилкою, якщо бракує обов’язкових метаданих або якщо
Plugin викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб manifest Plugin або експортована
точка входу оголошували `kind: "memory"`.

### Тестування доступу до runtime config

Надавайте перевагу спільному моку runtime Plugin з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих channel Plugin. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` типово викидають помилку, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

### Unit-тестування channel Plugin

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

### Unit-тестування provider Plugin

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

### Мокання runtime Plugin

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

### Тестування з per-instance stub

Надавайте перевагу per-instance stub замість мутації prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contract-тести (Plugin у репозиторії)

Вбудовані Plugin мають contract-тести, які перевіряють належність реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin реєструють які provider
- Які Plugin реєструють які speech provider
- Коректність форми реєстрації
- Відповідність runtime contract

### Запуск scoped-тестів

Для конкретного Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для contract-тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Застосування lint (Plugin у репозиторії)

`pnpm check` застосовує три правила для Plugin у репозиторії:

1. **Без монолітних імпортів із root** -- root barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- Plugin не можуть напряму імпортувати `../../src/`
3. **Без self-import** -- Plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

На зовнішні Plugin ці правила lint не поширюються, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестів

OpenClaw використовує Vitest із порогами coverage V8. Для тестів Plugin:

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
- [Channel Plugins SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс channel Plugin
- [Provider Plugins SDK](/uk/plugins/sdk-provider-plugins) -- hook-и provider Plugin
- [Створення Plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
