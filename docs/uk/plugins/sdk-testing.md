---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих Plugin
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для Plugin OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T00:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c2aa1506f6f115168c980d76785db6b8531c6565219ac07b35f43319b0a5bbd
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і примусового застосування lint для Plugin OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести Plugin каналу](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести Plugin провайдера](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Загальний імпорт:** `openclaw/plugin-sdk/testing`

**Імпорт мока API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжного засобу тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

Підшлях testing експортує вузький набір допоміжних засобів для авторів Plugin:

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
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
```

### Доступні експорти

| Export                                       | Purpose                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                        | Побудувати мінімальний мок API Plugin для прямих модульних тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api` |
| `expectChannelInboundContextContract`        | Перевірити форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`              |
| `installChannelOutboundPayloadContractSuite` | Встановити набір контрактних випадків для вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing` |
| `createStartAccountContext`                  | Побудувати контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers` |
| `describePluginRegistrationContract`         | Встановити перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`           |
| `describeOpenAIProviderRuntimeContract`      | Встановити перевірки контракту середовища виконання для сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `installCommonResolveTargetErrorCases`       | Спільні тестові випадки для обробки помилок під час визначення цілі                                          |
| `shouldAckReaction`                          | Перевірити, чи має канал додавати реакцію підтвердження                                                      |
| `removeAckReactionAfterReply`                | Видалити реакцію підтвердження після доставки відповіді                                                      |
| `createTestRegistry`                         | Побудувати фікстуру реєстру Plugin каналу                                                                    |
| `createEmptyPluginRegistry`                  | Побудувати порожню фікстуру реєстру Plugin                                                                   |
| `setActivePluginRegistry`                    | Встановити фікстуру реєстру для тестів середовища виконання Plugin                                           |
| `createRequestCaptureJsonFetch`              | Перехоплювати JSON-запити fetch у тестах допоміжних засобів для медіа                                        |
| `withFetchPreconnect`                        | Запускати тести fetch з установленими хуками preconnect                                                      |
| `withEnv` / `withEnvAsync`                   | Тимчасово підміняти змінні середовища                                                                        |
| `createTempHomeEnv` / `withTempDir`          | Створювати ізольовані файлові фікстури для тестів                                                            |
| `createMockServerResponse`                   | Створювати мінімальний мок відповіді HTTP-сервера                                                            |
| `registerSingleProviderPlugin`               | Реєструвати один Plugin провайдера в smoke-тестах завантажувача                                              |
| `registerProviderPlugin`                     | Захоплювати всі типи провайдерів з одного Plugin                                                             |
| `registerProviderPlugins`                    | Захоплювати реєстрації провайдерів у кількох Plugin                                                          |
| `requireRegisteredProvider`                  | Перевіряти, що колекція провайдерів містить ідентифікатор                                                    |
| `runProviderCatalog`                         | Виконувати хук каталогу провайдера з тестовими залежностями                                                  |
| `resolveProviderWizardOptions`               | Визначати варіанти майстра налаштування провайдера в контрактних тестах                                      |
| `resolveProviderModelPickerEntries`          | Визначати елементи засобу вибору моделей провайдера в контрактних тестах                                     |
| `buildProviderPluginMethodChoice`            | Будувати ідентифікатори варіантів майстра провайдера для перевірок                                           |
| `setProviderWizardProvidersResolverForTest`  | Впроваджувати провайдерів майстра провайдера для ізольованих тестів                                          |
| `createProviderUsageFetch`                   | Побудувати фікстури fetch для використання провайдера                                                        |
| `useFrozenTime` / `useRealTime`              | Заморожувати й відновлювати таймери для тестів, чутливих до часу                                             |
| `createRuntimeEnv`                           | Побудувати змокане середовище виконання CLI/Plugin                                                           |
| `createTestWizardPrompter`                   | Побудувати змоканий prompter майстра налаштування                                                            |
| `createPluginSetupWizardStatus`              | Побудувати допоміжні засоби стану налаштування для Plugin каналу                                             |
| `createRuntimeTaskFlow`                      | Створювати ізольований стан виконання TaskFlow                                                               |
| `typedCases`                                 | Зберігати literal-типи для таблично-керованих тестів                                                         |

Набори контрактних тестів для вбудованих Plugin також використовують підшляхи SDK testing для допоміжних засобів фікстур реєстру, маніфесту, публічного артефакту та середовища виконання, призначених лише для тестів. Набори лише для core, які залежать від інвентаря вбудованого OpenClaw, залишаються в `src/plugins/contracts`.
Нові тести розширень слід тримати на `openclaw/plugin-sdk/testing` або в більш вузькому
задокументованому підшляху SDK, як-от `plugin-sdk/plugin-test-api` або
`plugin-sdk/channel-contract-testing`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts` чи `plugin-sdk/provider-test-contracts`,
а не імпортувати безпосередньо файли репозиторію `src/**` або мости репозиторію `test/helpers/plugins/*`.

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
шлюзи приймання завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача
для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для хуків і
ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач не допускає реєстрацію Plugin, якщо бракує обов’язкових метаданих або якщо
Plugin викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає ім’я хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест Plugin або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації середовища виконання

Для тестування вбудованих Plugin каналів надавайте перевагу спільному моку середовища виконання Plugin з `openclaw/plugin-sdk/channel-test-helpers`. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилки, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

### Модульне тестування Plugin каналу

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

### Модульне тестування Plugin провайдера

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

### Мокання середовища виконання Plugin

Для коду, який використовує `createPluginRuntimeStore`, змокуйте середовище виконання в тестах:

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

### Тестування з підмінами для окремих екземплярів

Надавайте перевагу підмінам для окремих екземплярів замість мутації прототипу:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (Plugin у репозиторії)

Вбудовані Plugin мають контрактні тести, які перевіряють належність реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які Plugin реєструють які провайдери
- Які Plugin реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність контракту середовища виконання

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

## Примусове застосування lint (Plugin у репозиторії)

`pnpm check` примусово застосовує три правила для Plugin у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` заборонено
2. **Без прямих імпортів із `src/`** -- Plugin не можуть імпортувати `../../src/` напряму
3. **Без самоімпортів** -- Plugin не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні Plugin не підпадають під дію цих правил lint, але дотримуватися тих самих
шаблонів рекомендується.

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

Якщо локальні запуски спричиняють навантаження на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- угоди щодо імпорту
- [Plugin каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс Plugin каналу
- [Plugin провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки Plugin провайдера
- [Створення Plugin](/uk/plugins/building-plugins) -- посібник для початку роботи
