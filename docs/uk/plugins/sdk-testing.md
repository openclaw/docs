---
read_when:
    - Ви пишете тести для Plugin
    - Вам потрібні утиліти тестування з SDK Plugin
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T02:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 624b0ea8c50cdb8deaf275654a3ea9211fc8b1b520b596ebebc791e22453689a
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

**Імпорт макета API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілі каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тестування середовища виконання Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт HTTP-макета провайдера:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

**Імпорт макета вбудованого модуля Node:** `openclaw/plugin-sdk/test-node-mocks`

Для нових тестів плагінів віддавайте перевагу наведеним нижче сфокусованим підшляхам. Широкий barrel `openclaw/plugin-sdk/testing` призначений лише для сумісності зі застарілими рішеннями.

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
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Доступні експорти

| Експорт                                              | Призначення                                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створює мінімальний макет API плагіна для прямих unit-тестів реєстрації. Імпорт із `plugin-sdk/plugin-test-api`                      |
| `expectChannelInboundContextContract`                | Перевіряє форму вхідного контексту каналу. Імпорт із `plugin-sdk/channel-contract-testing`                                             |
| `installChannelOutboundPayloadContractSuite`         | Додає набір контрактних тестів для вихідного payload каналу. Імпорт із `plugin-sdk/channel-contract-testing`                          |
| `createStartAccountContext`                          | Створює контексти життєвого циклу облікового запису каналу. Імпорт із `plugin-sdk/channel-test-helpers`                               |
| `installChannelActionsContractSuite`                 | Додає загальний набір контрактних тестів для дій із повідомленнями каналу. Імпорт із `plugin-sdk/channel-test-helpers`                |
| `installChannelSetupContractSuite`                   | Додає загальний набір контрактних тестів для налаштування каналу. Імпорт із `plugin-sdk/channel-test-helpers`                         |
| `installChannelStatusContractSuite`                  | Додає загальний набір контрактних тестів для стану каналу. Імпорт із `plugin-sdk/channel-test-helpers`                                |
| `expectDirectoryIds`                                 | Перевіряє id каталогу з функції списку каталогів. Імпорт із `plugin-sdk/channel-test-helpers`                                         |
| `assertBundledChannelEntries`                        | Перевіряє, що точки входу вбудованого каналу надають очікуваний публічний контракт. Імпорт із `plugin-sdk/channel-test-helpers`      |
| `formatEnvelopeTimestamp`                            | Форматує детерміновані часові мітки envelope. Імпорт із `plugin-sdk/channel-test-helpers`                                             |
| `expectPairingReplyText`                             | Перевіряє текст відповіді для pairing каналу та витягує його код. Імпорт із `plugin-sdk/channel-test-helpers`                         |
| `describePluginRegistrationContract`                 | Додає перевірки контракту реєстрації Plugin. Імпорт із `plugin-sdk/plugin-test-contracts`                                             |
| `registerSingleProviderPlugin`                       | Реєструє один плагін провайдера в smoke-тестах завантажувача. Імпорт із `plugin-sdk/plugin-test-runtime`                              |
| `registerProviderPlugin`                             | Захоплює всі типи провайдерів з одного плагіна. Імпорт із `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugins`                            | Захоплює реєстрації провайдерів у кількох плагінах. Імпорт із `plugin-sdk/plugin-test-runtime`                                        |
| `requireRegisteredProvider`                          | Перевіряє, що колекція провайдерів містить id. Імпорт із `plugin-sdk/plugin-test-runtime`                                             |
| `createRuntimeEnv`                                   | Створює макетоване середовище виконання CLI/плагіна. Імпорт із `plugin-sdk/plugin-test-runtime`                                       |
| `createPluginSetupWizardStatus`                      | Створює допоміжні засоби стану майстра налаштування для плагінів каналів. Імпорт із `plugin-sdk/plugin-test-runtime`                 |
| `describeOpenAIProviderRuntimeContract`              | Додає перевірки контракту середовища виконання для сімейства провайдерів. Імпорт із `plugin-sdk/provider-test-contracts`              |
| `expectPassthroughReplayPolicy`                      | Перевіряє, що політики повторного відтворення провайдера пропускають інструменти та метадані, які належать провайдеру. Імпорт із `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Запускає live-тест провайдера realtime STT зі спільними аудіофікстурами. Імпорт із `plugin-sdk/provider-test-contracts`              |
| `normalizeTranscriptForMatch`                        | Нормалізує вивід live-транскрипту перед нечіткими перевірками. Імпорт із `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitVideoGenerationCapabilities`          | Перевіряє, що відеопровайдери явно оголошують можливості режиму генерації. Імпорт із `plugin-sdk/provider-test-contracts`             |
| `expectExplicitMusicGenerationCapabilities`          | Перевіряє, що музичні провайдери явно оголошують можливості генерації/редагування. Імпорт із `plugin-sdk/provider-test-contracts`    |
| `mockSuccessfulDashscopeVideoTask`                   | Додає відповідь успішного відеозавдання, сумісного з DashScope. Імпорт із `plugin-sdk/provider-test-contracts`                        |
| `getProviderHttpMocks`                               | Надає доступ до opt-in макетів Vitest для HTTP/auth провайдера. Імпорт із `plugin-sdk/provider-http-test-mocks`                       |
| `installProviderHttpMockCleanup`                     | Скидає HTTP/auth-макети провайдера після кожного тесту. Імпорт із `plugin-sdk/provider-http-test-mocks`                               |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпорт із `plugin-sdk/channel-target-testing`                           |
| `shouldAckReaction`                                  | Перевіряє, чи має канал додати ack-реакцію. Імпорт із `plugin-sdk/channel-feedback`                                                    |
| `removeAckReactionAfterReply`                        | Видаляє ack-реакцію після доставки відповіді. Імпорт із `plugin-sdk/channel-feedback`                                                  |
| `createTestRegistry`                                 | Створює фікстуру реєстру плагінів каналу. Імпорт із `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`            |
| `createEmptyPluginRegistry`                          | Створює порожню фікстуру реєстру плагінів. Імпорт із `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`           |
| `setActivePluginRegistry`                            | Встановлює фікстуру реєстру для runtime-тестів плагіна. Імпорт із `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Захоплює JSON-запити fetch у тестах медіадопоміжних засобів. Імпорт із `plugin-sdk/test-env`                                           |
| `withServer`                                         | Запускає тести з тимчасовим локальним HTTP-сервером. Імпорт із `plugin-sdk/test-env`                                                   |
| `createMockIncomingRequest`                          | Створює мінімальний об’єкт вхідного HTTP-запиту. Імпорт із `plugin-sdk/test-env`                                                       |
| `withFetchPreconnect`                                | Запускає fetch-тести зі встановленими preconnect-хуками. Імпорт із `plugin-sdk/test-env`                                               |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінює змінні середовища. Імпорт із `plugin-sdk/test-env`                                                                    |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створює ізольовані фікстури файлової системи для тестів. Імпорт із `plugin-sdk/test-env`                                               |
| `createMockServerResponse`                           | Створює мінімальний макет відповіді HTTP-сервера. Імпорт із `plugin-sdk/test-env`                                                      |
| `createCliRuntimeCapture`                            | Захоплює вивід середовища виконання CLI у тестах. Імпорт із `plugin-sdk/test-fixtures`                                                 |
| `importFreshModule`                                  | Імпортує модуль ESM зі свіжим query-token, щоб обійти кеш модуля. Імпорт із `plugin-sdk/test-fixtures`                                |
| `bundledPluginRoot` / `bundledPluginFile`            | Визначає шляхи до фікстур вихідного коду або dist вбудованого плагіна. Імпорт із `plugin-sdk/test-fixtures`                           |
| `mockNodeBuiltinModule`                              | Встановлює вузькі макети Vitest для вбудованих модулів Node. Імпорт із `plugin-sdk/test-node-mocks`                                   |
| `createSandboxTestContext`                           | Створює тестові контексти sandbox. Імпорт із `plugin-sdk/test-fixtures`                                                                |
| `writeSkill`                                         | Записує фікстури Skills. Імпорт із `plugin-sdk/test-fixtures`                                                                          |
| `makeAgentAssistantMessage`                          | Створює фікстури повідомлень транскрипту агента. Імпорт із `plugin-sdk/test-fixtures`                                                  |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Переглядає та скидає фікстури системних подій. Імпорт із `plugin-sdk/test-fixtures`                                                    |
| `sanitizeTerminalText`                               | Очищає текст термінала для перевірок. Імпорт із `plugin-sdk/test-fixtures`                                                             |
| `countLines` / `hasBalancedFences`                   | Перевіряє форму chunking-виводу. Імпорт із `plugin-sdk/test-fixtures`                                                                  |
| `runProviderCatalog`                                 | Виконує хук каталогу провайдера з тестовими залежностями                                                                               |
| `resolveProviderWizardOptions`                       | Визначає варіанти майстра налаштування провайдера в контрактних тестах                                                                 |
| `resolveProviderModelPickerEntries`                  | Визначає елементи вибору моделей провайдера в контрактних тестах                                                                       |
| `buildProviderPluginMethodChoice`                    | Створює id варіантів майстра провайдера для перевірок                                                                                  |
| `setProviderWizardProvidersResolverForTest`          | Інжектує провайдери майстра для ізольованих тестів                                                                                     |
| `createProviderUsageFetch`                           | Створює фікстури fetch використання провайдера                                                                                         |
| `useFrozenTime` / `useRealTime`                      | Заморожує та відновлює таймери для чутливих до часу тестів. Імпорт із `plugin-sdk/test-env`                                            |
| `createTestWizardPrompter`                           | Створює макетований prompter майстра налаштування                                                                                      |
| `createRuntimeTaskFlow`                              | Створює ізольований стан runtime TaskFlow                                                                                              |
| `typedCases`                                         | Зберігає літеральні типи для таблично-керованих тестів. Імпорт із `plugin-sdk/test-fixtures`                                           |

Набори контрактних тестів для вбудованих плагінів також використовують підшляхи тестування SDK для допоміжних засобів тестування лише для тестів: реєстру, маніфесту, публічних артефактів і runtime-фікстур. Набори, призначені лише для core і залежні від вбудованого inventory OpenClaw, залишаються в `src/plugins/contracts`.
Тримайте нові тести розширень на задокументованому сфокусованому підшляху SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`,
`plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`,
`plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` або
`plugin-sdk/test-fixtures`, замість імпорту широкого compatibility barrel
`plugin-sdk/testing`, файлів репозиторію `src/**` або напряму мостів репозиторію `test/helpers/plugins/*`.

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

## Тестування розв’язання цілі

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для розв’язання цілі каналу:

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

Unit-тести, які передають власноруч написаний макет `api` до `register(api)`, не перевіряють acceptance gates завантажувача OpenClaw. Додайте щонайменше один smoke-тест із підтримкою завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для хуків і ексклюзивних можливостей, таких як пам’ять.

Реальний завантажувач відхиляє реєстрацію плагіна, якщо бракує обов’язкових метаданих або якщо плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає ім’я хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Під час тестування вбудованих плагінів каналів віддавайте перевагу спільному макету runtime плагіна з `openclaw/plugin-sdk/channel-test-helpers`.
Його застарілі макети `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням генерують помилку, щоб тести виявляли нове використання compatibility API. Перевизначайте ці макети лише тоді, коли тест
явно покриває застарілу behavior сумісності.

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
    // Значення токена не розкривається
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

### Макетування runtime плагіна

Для коду, який використовує `createPluginRuntimeStore`, макетуйте runtime у тестах:

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
    // ... інші макети
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

### Тестування з per-instance stubs

Віддавайте перевагу per-instance stubs замість мутації прототипу:

```typescript
// Рекомендовано: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: мутація прототипу
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють право власності на реєстрацію:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють які провайдери
- Які плагіни реєструють які speech-провайдери
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

Три правила примусово перевіряються через `pnpm check` для плагінів у репозиторії:

1. **Без монолітних імпортів із root** -- root barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів із `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без self-imports** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

На зовнішні плагіни ці правила lint не поширюються, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестів

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

Якщо локальні запуски створюють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
