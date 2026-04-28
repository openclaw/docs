---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T02:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 264c652d0a857a4e5b570d177011b04318757d30c5169bbcf432c038e6b8b7d5
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і lint-контролю для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт мока API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контрактів каналів:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналів:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілей каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контрактів Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тестування середовища виконання Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контрактів провайдерів:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP-моків провайдерів:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

Для нових тестів плагінів віддавайте перевагу наведеним нижче спеціалізованим підшляхам. Широкий
barrel `openclaw/plugin-sdk/testing` підтримується лише для сумісності зі застарілим кодом.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect } from "openclaw/plugin-sdk/test-env";
import { createCliRuntimeCapture, typedCases } from "openclaw/plugin-sdk/test-fixtures";
```

### Доступні експорти

| Export                                          | Призначення                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                           | Створює мінімальний мок API Plugin для прямих модульних тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                 |
| `expectChannelInboundContextContract`           | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                         |
| `installChannelOutboundPayloadContractSuite`    | Підключає набір контрактних тестів для вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                  |
| `createStartAccountContext`                     | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                           |
| `installChannelActionsContractSuite`            | Підключає загальний набір контрактних тестів для дій із повідомленнями каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`        |
| `installChannelSetupContractSuite`              | Підключає загальний набір контрактних тестів для налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                 |
| `installChannelStatusContractSuite`             | Підключає загальний набір контрактних тестів для статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                      |
| `expectDirectoryIds`                            | Перевіряє id директорій із функції списку директорій. Імпортуйте з `plugin-sdk/channel-test-helpers`                                 |
| `describePluginRegistrationContract`            | Підключає перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                     |
| `registerSingleProviderPlugin`                  | Реєструє один Plugin провайдера в smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                          |
| `registerProviderPlugin`                        | Захоплює всі типи провайдерів з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                          |
| `registerProviderPlugins`                       | Захоплює реєстрації провайдерів у кількох Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                      |
| `requireRegisteredProvider`                     | Перевіряє, що колекція провайдерів містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `createRuntimeEnv`                              | Створює змокане середовище виконання CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                       |
| `createPluginSetupWizardStatus`                 | Створює допоміжні засоби статусу налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                    |
| `describeOpenAIProviderRuntimeContract`         | Підключає перевірки контракту середовища виконання для сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`      |
| `expectExplicitVideoGenerationCapabilities`     | Перевіряє, що відеопровайдери явно оголошують можливості режиму генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`         |
| `expectExplicitMusicGenerationCapabilities`     | Перевіряє, що музичні провайдери явно оголошують можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`              | Підключає успішну відповідь для відеозавдання, сумісного з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`              |
| `getProviderHttpMocks`                          | Надає доступ до опційних Vitest-моків HTTP/auth провайдерів. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                      |
| `installProviderHttpMockCleanup`                | Скидає HTTP/auth-моки провайдерів після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                            |
| `installCommonResolveTargetErrorCases`          | Спільні тестові сценарії для обробки помилок розв’язання цілей. Імпортуйте з `plugin-sdk/channel-target-testing`                     |
| `shouldAckReaction`                             | Перевіряє, чи повинен канал додати ack-реакцію. Імпортуйте з `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                   | Видаляє ack-реакцію після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                              |
| `createTestRegistry`                            | Створює фікстуру реєстру плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`       |
| `createEmptyPluginRegistry`                     | Створює порожню фікстуру реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                       | Встановлює фікстуру реєстру для тестів середовища виконання Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                 | Захоплює JSON fetch-запити в тестах допоміжних медіафункцій. Імпортуйте з `plugin-sdk/test-env`                                      |
| `withFetchPreconnect`                           | Запускає fetch-тести з установленими preconnect-хуками. Імпортуйте з `plugin-sdk/test-env`                                           |
| `withEnv` / `withEnvAsync`                      | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                |
| `createTempHomeEnv` / `withTempDir`             | Створює ізольовані файлові фікстури для тестів. Імпортуйте з `plugin-sdk/test-env`                                                   |
| `createMockServerResponse`                      | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                   |
| `createCliRuntimeCapture`                       | Захоплює вивід середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                            |
| `createSandboxTestContext`                      | Створює тестові контексти sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                           |
| `writeSkill`                                    | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                      |
| `makeAgentAssistantMessage`                     | Створює фікстури повідомлень стенограми агента. Імпортуйте з `plugin-sdk/test-fixtures`                                              |
| `peekSystemEvents` / `resetSystemEventsForTest` | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                               |
| `sanitizeTerminalText`                          | Очищає вивід термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                        |
| `countLines` / `hasBalancedFences`              | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                                             |
| `runProviderCatalog`                            | Виконує хук каталогу провайдерів із тестовими залежностями                                                                            |
| `resolveProviderWizardOptions`                  | Розв’язує варіанти майстра налаштування провайдера в контрактних тестах                                                               |
| `resolveProviderModelPickerEntries`             | Розв’язує елементи вибору моделей провайдера в контрактних тестах                                                                     |
| `buildProviderPluginMethodChoice`               | Створює id варіантів майстра провайдера для перевірок                                                                                 |
| `setProviderWizardProvidersResolverForTest`     | Впроваджує провайдерів майстра для ізольованих тестів                                                                                 |
| `createProviderUsageFetch`                      | Створює фікстури fetch для використання провайдера                                                                                    |
| `useFrozenTime` / `useRealTime`                 | Заморожує та відновлює таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                     |
| `createTestWizardPrompter`                      | Створює змоканий prompter майстра налаштування                                                                                        |
| `createRuntimeTaskFlow`                         | Створює ізольований стан runtime TaskFlow                                                                                             |
| `typedCases`                                    | Зберігає літеральні типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                   |

Набори контрактних тестів для вбудованих плагінів також використовують підшляхи SDK для тестування для допоміжних засобів тестових фікстур реєстру, маніфесту, публічних артефактів і runtime. Набори лише для core, які залежать від вбудованого інвентаря OpenClaw, залишаються в `src/plugins/contracts`.
Нові тести розширень тримайте на документованому спеціалізованому підшляху SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`,
`plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`,
`plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` або
`plugin-sdk/test-fixtures`, замість імпортування широкого суміснісного barrel `plugin-sdk/testing`,
файлів репозиторію `src/**` або напряму мостів репозиторію `test/helpers/plugins/*`.

### Типи

Спеціалізовані підшляхи тестування також повторно експортують типи, корисні у тестових файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Тестування розв’язання цілей

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні сценарії помилок для
розв’язання цілей каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

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

Модульні тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють
ворота прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача
для кожної поверхні реєстрації, від якої залежить ваш Plugin, особливо для хуків і
ексклюзивних можливостей, таких як пам’ять.

Справжній завантажувач відхиляє реєстрацію Plugin, якщо бракує потрібних метаданих або якщо
Plugin викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест Plugin або експортований запис
оголошував `kind: "memory"`.

### Тестування доступу до runtime-конфігурації

Віддавайте перевагу спільному моку runtime Plugin з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих плагінів каналів. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилку, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

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

### Мокування runtime Plugin

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

Віддавайте перевагу per-instance stub замість мутації прототипу:

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

### Запуск scoped-тестів

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

## Lint-контроль (плагіни в репозиторії)

Три правила перевіряються через `pnpm check` для плагінів у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

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

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагінів каналів
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагінів провайдерів
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
