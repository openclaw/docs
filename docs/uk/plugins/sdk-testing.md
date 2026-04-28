---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T02:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 976d106b636ee0e18aafdd5c970dd7de4b498773e607e7b3be60b23cecadd81f
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і примусового застосування lint для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Посібники how-to містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт мока Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту runtime агента:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт runtime-тестування Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP-мока провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт мока вбудованого модуля Node:** `openclaw/plugin-sdk/test-node-mocks`

Для нових тестів плагінів віддавайте перевагу наведеним нижче сфокусованим підшляхам. Широкий barrel `openclaw/plugin-sdk/testing` призначений лише для сумісності зі старими версіями.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Доступні експорти

| Експорт                                              | Призначення                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створює мінімальний мок Plugin API для прямих unit-тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для нативних адаптерів runtime агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту придушення доставки для нативних адаптерів runtime агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації fallback для нативних адаптерів runtime агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Створює фікстури схеми dynamic-tool для контрактних тестів нативного runtime. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Встановлює набір випадків контракту вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Встановлює загальний набір випадків контракту дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Встановлює загальний набір випадків контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Встановлює загальний набір випадків контракту статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Перевіряє id каталогів із функції переліку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Перевіряє, що entrypoint-и вбудованих каналів надають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові мітки envelope. Імпортуйте з `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Перевіряє текст відповіді спарювання та витягує його код. Імпортуйте з `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Встановлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Реєструє один provider Plugin у smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Створює змокане середовище runtime CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби статусу налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | Встановлює перевірки контракту runtime для сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення провайдера пропускають через себе інструменти та метадані, якими володіє провайдер. Імпортуйте з `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Запускає live-тест realtime STT провайдера зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Нормалізує вивід live-транскрипту перед нечіткими перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери оголошують явні можливості режимів генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери оголошують явні можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Встановлює успішну відповідь задачі відео, сумісну з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Надає доступ до opt-in моків HTTP/автентифікації провайдера для Vitest. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Скидає моки HTTP/автентифікації провайдера після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок визначення цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Перевіряє, чи має канал додати реакцію-підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Видаляє реакцію-підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Створює фікстуру реєстру плагінів каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Створює порожню фікстуру реєстру Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для тестів runtime Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах допоміжних засобів медіа. Імпортуйте з `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Запускає тести з одноразовим локальним HTTP-сервером. Імпортуйте з `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Запускає тести fetch із встановленими хуками preconnect. Імпортуйте з `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані файлові тестові фікстури. Імпортуйте з `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | Захоплює вивід runtime CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Імпортує модуль ESM зі свіжим query-токеном для обходу кешу модулів. Імпортуйте з `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Визначає шляхи до фікстур source або dist вбудованого Plugin. Імпортуйте з `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Встановлює вузькі моки вбудованих модулів Node для Vitest. Імпортуйте з `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Створює тестові контексти sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Очищає текст термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму виводу з розбиттям на частини. Імпортуйте з `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                                   |
| `resolveProviderWizardOptions`                       | Визначає варіанти майстра налаштування провайдера в контрактних тестах                                                                                  |
| `resolveProviderModelPickerEntries`                  | Визначає записи вибору моделі провайдера в контрактних тестах                                                                                  |
| `buildProviderPluginMethodChoice`                    | Створює id варіантів майстра провайдера для перевірок                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | Інжектує провайдерів майстра провайдера для ізольованих тестів                                                                                      |
| `createProviderUsageFetch`                           | Створює фікстури fetch для використання провайдера                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Заморожує та відновлює таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Створює змоканий prompter майстра налаштування                                                                                                     |
| `createRuntimeTaskFlow`                              | Створює ізольований стан runtime TaskFlow                                                                                                  |
| `typedCases`                                         | Зберігає літеральні типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                                    |

Набори контрактних тестів вбудованих плагінів також використовують підшляхи SDK для тестування для допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і runtime, призначених лише для тестів. Набори лише для core, які залежать від інвентарю вбудованого OpenClaw, залишаються в `src/plugins/contracts`.
Тримайте нові тести розширень на документованому сфокусованому підшляху SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість імпорту з
широкого сумісного barrel `plugin-sdk/testing`, файлів репозиторію `src/**` або мостів
репозиторію `test/helpers/*` напряму.

### Типи

Сфокусовані підшляхи тестування також повторно експортують типи, корисні у файлах тестів:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Тестування визначення цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цілі каналу:

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

Unit-тести, які передають написаний вручну мок `api` у `register(api)`, не перевіряють
гейти приймання завантажувача OpenClaw. Додайте принаймні один smoke-тест із підтримкою loader
для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для hook-ів і
ексклюзивних можливостей, таких як пам’ять.

Справжній loader не дає зареєструвати плагін, якщо відсутні потрібні метадані або якщо
плагін викликає API можливостей, якими він не володіє. Наприклад,
`api.registerHook(...)` вимагає ім’я hook-а, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортований
entry оголошував `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Віддавайте перевагу спільному моку runtime плагіна з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих плагінів каналів. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилки, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно покриває застарілу поведінку сумісності.

### Unit-тестування плагіна каналу

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

### Unit-тестування плагіна провайдера

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

### Тестування з per-instance stub-ами

Віддавайте перевагу per-instance stub-ам замість мутації прототипу:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють володіння реєстрацією:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють які провайдери
- Які плагіни реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність контракту runtime

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

## Примусове застосування lint (плагіни в репозиторії)

Три правила примусово застосовуються через `pnpm check` для плагінів у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів `src/`** -- плагіни не можуть імпортувати `../../src/` напряму
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

Якщо локальні запуски створюють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- hook-и плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
