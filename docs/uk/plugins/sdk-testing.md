---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих plugin
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T00:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7094c305cb48978b6d5fb1afd964d10e088a5d7195b65255574afa1dac719502
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і застосування lint для plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести channel plugin](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести provider plugin](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт для сумісності:** `openclaw/plugin-sdk/testing`

**Імпорт мока Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту channel:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування channel:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт runtime-тестів Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту provider:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

Для нових тестів plugin віддавайте перевагу наведеним нижче цільовим підшляхам. Широкий
barrel `openclaw/plugin-sdk/testing` зберігається для сумісності зі старішими тестами
та допоміжними засобами, які ще не перенесено на вужчу документовану поверхню.

```typescript
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";
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

| Export                                          | Призначення                                                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                           | Створює мінімальний мок Plugin API для прямих модульних тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                          |
| `expectChannelInboundContextContract`           | Перевіряє форму вхідного контексту channel. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                 |
| `installChannelOutboundPayloadContractSuite`    | Встановлює набір контрактних кейсів для вихідного payload channel. Імпортуйте з `plugin-sdk/channel-contract-testing`                          |
| `createStartAccountContext`                     | Створює контексти життєвого циклу облікового запису channel. Імпортуйте з `plugin-sdk/channel-test-helpers`                                   |
| `installChannelActionsContractSuite`            | Встановлює загальний набір контрактних кейсів для дій із повідомленнями channel. Імпортуйте з `plugin-sdk/channel-test-helpers`               |
| `installChannelSetupContractSuite`              | Встановлює загальний набір контрактних кейсів для налаштування channel. Імпортуйте з `plugin-sdk/channel-test-helpers`                        |
| `installChannelStatusContractSuite`             | Встановлює загальний набір контрактних кейсів для стану channel. Імпортуйте з `plugin-sdk/channel-test-helpers`                               |
| `expectDirectoryIds`                            | Перевіряє ідентифікатори каталогу channel з функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                          |
| `describePluginRegistrationContract`            | Встановлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                             |
| `registerSingleProviderPlugin`                  | Реєструє один provider plugin у smoke-тестах loader. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugin`                        | Захоплює всі типи provider з одного plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                      |
| `registerProviderPlugins`                       | Захоплює реєстрації provider у кількох plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                   |
| `requireRegisteredProvider`                     | Перевіряє, що колекція provider містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                      |
| `createRuntimeEnv`                              | Створює змокане середовище runtime CLI/plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                   |
| `createPluginSetupWizardStatus`                 | Створює допоміжні засоби стану майстра налаштування для channel plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                         |
| `describeOpenAIProviderRuntimeContract`         | Встановлює перевірки контракту runtime для сімейства provider. Імпортуйте з `plugin-sdk/provider-test-contracts`                              |
| `installCommonResolveTargetErrorCases`          | Спільні тестові кейси для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/testing`, доки не з’явиться вужчий підшлях тестування розв’язання цілей |
| `shouldAckReaction`                             | Перевіряє, чи має channel додавати ack-реакцію. Імпортуйте з `plugin-sdk/testing`, доки не з’явиться вужчий підшлях тестування реакцій        |
| `removeAckReactionAfterReply`                   | Видаляє ack-реакцію після доставки відповіді. Імпортуйте з `plugin-sdk/testing`, доки не з’явиться вужчий підшлях тестування реакцій          |
| `createTestRegistry`                            | Створює фікстуру реєстру channel plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                  |
| `createEmptyPluginRegistry`                     | Створює фікстуру порожнього реєстру plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`               |
| `setActivePluginRegistry`                       | Встановлює фікстуру реєстру для runtime-тестів plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`    |
| `createRequestCaptureJsonFetch`                 | Захоплює JSON fetch-запити в тестах медіа-допоміжних засобів. Імпортуйте з `plugin-sdk/test-env`                                               |
| `withFetchPreconnect`                           | Запускає fetch-тести з установленими хуками preconnect. Імпортуйте з `plugin-sdk/test-env`                                                     |
| `withEnv` / `withEnvAsync`                      | Тимчасово підміняє змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                       |
| `createTempHomeEnv` / `withTempDir`             | Створює ізольовані файлові фікстури для тестів. Імпортуйте з `plugin-sdk/test-env`                                                             |
| `createMockServerResponse`                      | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                             |
| `createCliRuntimeCapture`                       | Захоплює вивід runtime CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                                   |
| `createSandboxTestContext`                      | Створює контексти sandbox-тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                    | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                                |
| `makeAgentAssistantMessage`                     | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                       |
| `peekSystemEvents` / `resetSystemEventsForTest` | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `sanitizeTerminalText`                          | Очищує текст термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                                   |
| `countLines` / `hasBalancedFences`              | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                                                        |
| `runProviderCatalog`                            | Виконує хук каталогу provider з тестовими залежностями                                                                                          |
| `resolveProviderWizardOptions`                  | Розв’язує варіанти майстра налаштування provider у контрактних тестах                                                                           |
| `resolveProviderModelPickerEntries`             | Розв’язує елементи вибору моделі provider у контрактних тестах                                                                                  |
| `buildProviderPluginMethodChoice`               | Створює id варіантів майстра provider для перевірок                                                                                             |
| `setProviderWizardProvidersResolverForTest`     | Інжектує provider для майстра provider в ізольованих тестах                                                                                     |
| `createProviderUsageFetch`                      | Створює фікстури fetch використання provider                                                                                                    |
| `useFrozenTime` / `useRealTime`                 | Заморожує та відновлює таймери для чутливих до часу тестів. Імпортуйте з `plugin-sdk/test-env`                                                 |
| `createTestWizardPrompter`                      | Створює змоканий prompter майстра налаштування                                                                                                  |
| `createRuntimeTaskFlow`                         | Створює ізольований стан runtime TaskFlow                                                                                                       |
| `typedCases`                                    | Зберігає literal-типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                |

Набори контрактних тестів для вбудованих plugin також використовують підшляхи SDK testing для
допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і runtime, призначених лише для тестів. Набори,
які належать лише до core і залежать від вбудованого inventory OpenClaw, залишаються в `src/plugins/contracts`.
Для нових тестів extension використовуйте документований цільовий підшлях SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`,
`plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість імпорту з
широкого barrel сумісності `plugin-sdk/testing`, файлів репозиторію `src/**` або
мостів репозиторію `test/helpers/plugins/*` напряму.

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

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
розв’язання цілей channel:

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

Модульні тести, які передають власноруч написаний мок `api` у `register(api)`, не перевіряють
ворота прийняття loader OpenClaw. Додайте щонайменше один smoke-тест на основі loader
для кожної поверхні реєстрації, від якої залежить ваш plugin, особливо для hook і
ексклюзивних можливостей, таких як memory.

Справжній loader завершує реєстрацію plugin з помилкою, якщо бракує обов’язкових метаданих або якщо
plugin викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест plugin або експортований entry оголошував `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Віддавайте перевагу спільному моку runtime plugin з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих channel plugin. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

### Модульне тестування channel plugin

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

### Модульне тестування provider plugin

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

### Мокання runtime plugin

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

### Тестування зі стабами для окремих екземплярів

Віддавайте перевагу стабам для окремих екземплярів замість мутації прототипу:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (plugin у репозиторії)

Вбудовані plugin мають контрактні тести, які перевіряють належність реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які plugin реєструють які provider
- Які plugin реєструють які speech-provider
- Коректність форми реєстрації
- Відповідність контракту runtime

### Запуск тестів з обмеженням області

Для конкретного plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Застосування lint (plugin у репозиторії)

`pnpm check` застосовує три правила для plugin у репозиторії:

1. **Без монолітних імпортів із root** -- root barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- plugin не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні plugin не підпадають під ці lint-правила, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестування

OpenClaw використовує Vitest із порогами покриття V8. Для тестів plugin:

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

- [Огляд SDK](/uk/plugins/sdk-overview) -- угоди щодо імпорту
- [SDK Channel Plugins](/uk/plugins/sdk-channel-plugins) -- інтерфейс channel plugin
- [SDK Provider Plugins](/uk/plugins/sdk-provider-plugins) -- hook provider plugin
- [Створення plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
