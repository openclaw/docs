---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T02:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Довідник з утиліт тестування, шаблонів і примусового застосування lint для плагінів OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Посібники містять готові приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт мока API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту середовища виконання агента:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тестування середовища виконання Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP-мока провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт універсальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт мока вбудованих модулів Node:** `openclaw/plugin-sdk/test-node-mocks`

Для нових тестів плагінів надавайте перевагу наведеним нижче спеціалізованим підшляхам. Широкий барель
`openclaw/plugin-sdk/testing` зберігається лише для сумісності зі застарілими рішеннями.
Захисні механізми репозиторію відхиляють нові реальні імпорти з `plugin-sdk/testing` і
`plugin-sdk/test-utils`; ці назви залишаються лише як застарілі поверхні сумісності
для зовнішніх плагінів і тестів на сумісність записів.

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
| `createTestPluginApi`                                | Створює мінімальний мок API Plugin для модульних тестів прямої реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для адаптерів рідного середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту придушення доставки для адаптерів рідного середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації резервного сценарію для адаптерів рідного середовища виконання агента. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Створює фікстури схеми динамічних інструментів для контрактних тестів рідного середовища виконання. Імпортуйте з `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                            |
| `installChannelOutboundPayloadContractSuite`         | Встановлює набір випадків контракту вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                        |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                             |
| `installChannelActionsContractSuite`                 | Встановлює загальний набір випадків контракту дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                    |
| `installChannelSetupContractSuite`                   | Встановлює загальний набір випадків контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                       |
| `installChannelStatusContractSuite`                  | Встановлює загальний набір випадків контракту статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                            |
| `expectDirectoryIds`                                 | Перевіряє ідентифікатори каталогу з функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                            |
| `assertBundledChannelEntries`                        | Перевіряє, що точки входу вбудованого каналу надають очікуваний публічний контракт. Імпортуйте з `plugin-sdk/channel-test-helpers`     |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові позначки envelope. Імпортуйте з `plugin-sdk/channel-test-helpers`                                         |
| `expectPairingReplyText`                             | Перевіряє текст відповіді спарювання та витягує його код. Імпортуйте з `plugin-sdk/channel-test-helpers`                                |
| `describePluginRegistrationContract`                 | Встановлює перевірки контракту реєстрації Plugin. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                       |
| `registerSingleProviderPlugin`                       | Реєструє один плагін провайдера у smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                             |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                             |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох плагінах. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                       |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить ідентифікатор. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                 |
| `createRuntimeEnv`                                   | Створює моковане середовище виконання CLI/Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби статусу налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`                       |
| `describeOpenAIProviderRuntimeContract`              | Встановлює перевірки контракту середовища виконання для сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`        |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення провайдера пропускають інструменти й метадані, які належать провайдеру. Імпортуйте з `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Запускає live-тест провайдера realtime STT зі спільними аудіофікстурами. Імпортуйте з `plugin-sdk/provider-test-contracts`              |
| `normalizeTranscriptForMatch`                        | Нормалізує вихід транскрипту live перед нечіткими перевірками. Імпортуйте з `plugin-sdk/provider-test-contracts`                        |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери явно оголошують можливості режиму генерації. Імпортуйте з `plugin-sdk/provider-test-contracts`            |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери явно оголошують можливості генерації/редагування. Імпортуйте з `plugin-sdk/provider-test-contracts`   |
| `mockSuccessfulDashscopeVideoTask`                   | Встановлює успішну відповідь завдання відео, сумісну з DashScope. Імпортуйте з `plugin-sdk/provider-test-contracts`                     |
| `getProviderHttpMocks`                               | Надає доступ до opt-in моків HTTP/автентифікації провайдера для Vitest. Імпортуйте з `plugin-sdk/provider-http-test-mocks`              |
| `installProviderHttpMockCleanup`                     | Скидає моки HTTP/автентифікації провайдера після кожного тесту. Імпортуйте з `plugin-sdk/provider-http-test-mocks`                      |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                          |
| `shouldAckReaction`                                  | Перевіряє, чи має канал додавати реакцію підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                      |
| `removeAckReactionAfterReply`                        | Видаляє реакцію підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                      |
| `createTestRegistry`                                 | Створює фікстуру реєстру плагінів каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`           |
| `createEmptyPluginRegistry`                          | Створює фікстуру порожнього реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для тестів середовища виконання Plugin. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах допоміжних засобів для медіа. Імпортуйте з `plugin-sdk/test-env`                                    |
| `withServer`                                         | Запускає тести на тимчасовому локальному HTTP-сервері. Імпортуйте з `plugin-sdk/test-env`                                               |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпортуйте з `plugin-sdk/test-env`                                                      |
| `withFetchPreconnect`                                | Запускає тести fetch зі встановленими хуками preconnect. Імпортуйте з `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                           | Тимчасово підмінює змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані фікстури файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                                             |
| `createMockServerResponse`                           | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                       |
| `createCliRuntimeCapture`                            | Захоплює вивід середовища виконання CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                               |
| `importFreshModule`                                  | Імпортує модуль ESM зі свіжим токеном запиту для обходу кешу модулів. Імпортуйте з `plugin-sdk/test-fixtures`                           |
| `bundledPluginRoot` / `bundledPluginFile`            | Розв’язує шляхи до фікстур джерел або dist вбудованого Plugin. Імпортуйте з `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Встановлює вузькі моки вбудованих модулів Node для Vitest. Імпортуйте з `plugin-sdk/test-node-mocks`                                    |
| `createSandboxTestContext`                           | Створює тестові контексти sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                               |
| `writeSkill`                                         | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                         |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Очищує текст термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                            |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                                                 |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                                 |
| `resolveProviderWizardOptions`                       | Розв’язує варіанти майстра налаштування провайдера в контрактних тестах                                                                  |
| `resolveProviderModelPickerEntries`                  | Розв’язує елементи вибору моделі провайдера в контрактних тестах                                                                         |
| `buildProviderPluginMethodChoice`                    | Створює ідентифікатори варіантів майстра провайдера для перевірок                                                                        |
| `setProviderWizardProvidersResolverForTest`          | Інжектує провайдери майстра провайдера для ізольованих тестів                                                                            |
| `createProviderUsageFetch`                           | Створює фікстури fetch використання провайдера                                                                                           |
| `useFrozenTime` / `useRealTime`                      | Заморожує та відновлює таймери для тестів, чутливих до часу. Імпортуйте з `plugin-sdk/test-env`                                         |
| `createTestWizardPrompter`                           | Створює мокований prompter майстра налаштування                                                                                          |
| `createRuntimeTaskFlow`                              | Створює ізольований стан runtime для TaskFlow                                                                                            |
| `typedCases`                                         | Зберігає літеральні типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                      |

Набори контрактних тестів для вбудованих плагінів також використовують підшляхи тестування SDK для допоміжних засобів тестових реєстрів, маніфестів, публічних артефактів і фікстур runtime. Набори лише для ядра, які залежать від вбудованого інвентаря OpenClaw, залишаються в `src/plugins/contracts`.
Тримайте нові тести розширень на документованому спеціалізованому підшляху SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість імпорту з
широкого суміснісного бареля `plugin-sdk/testing`, файлів репозиторію `src/**` або
напряму з мостів репозиторію `test/helpers/*`.

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

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
розв’язання цілі каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка розв’язання цілі вашого каналу
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

Модульні тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють
ворота прийняття завантажувача OpenClaw. Додайте принаймні один smoke-тест на основі завантажувача
для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків і
ексклюзивних можливостей, таких як memory.

Справжній завантажувач не дозволяє реєстрацію плагіна, якщо відсутні обов’язкові метадані або
плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована
точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Надавайте перевагу спільному моку runtime плагіна з `openclaw/plugin-sdk/channel-test-helpers`
під час тестування вбудованих плагінів каналів. Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилки, щоб тести виявляли нове
використання API сумісності. Перевизначайте ці моки лише тоді, коли тест
явно перевіряє застарілу поведінку сумісності.

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
    // Значення токена не розкривається
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
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Мокування runtime плагіна

Для коду, який використовує `createPluginRuntimeStore`, мокуйте runtime у тестах:

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
    // ... інші моки
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

### Тестування з підмінами на рівні екземпляра

Надавайте перевагу підмінам на рівні екземпляра замість мутації прототипу:

```typescript
// Бажано: підміна на рівні екземпляра
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: мутація прототипу
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють права власності на реєстрацію:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють які провайдери
- Які плагіни реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність контракту runtime

### Запуск обмежених тестів

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

`pnpm check` примусово застосовує три правила для плагінів у репозиторії:

1. **Без монолітних імпортів із кореня** -- кореневий барель `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів із `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

На зовнішні плагіни ці правила lint не поширюються, але дотримуватися таких самих
шаблонів рекомендується.

## Конфігурація тестування

OpenClaw використовує Vitest із порогами покриття V8. Для тестів плагінів:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного плагіна
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за конкретною назвою тесту
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з покриттям
pnpm test:coverage
```

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
