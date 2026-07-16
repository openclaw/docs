---
read_when:
    - Ви пишете тести для плагіна
    - Вам потрібні тестові утиліти з SDK плагінів
    - Ви хочете зрозуміти контрактні тести для вбудованих плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-07-16T18:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Довідка про тестові утиліти, шаблони та контроль за допомогою лінтера для плагінів
OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Практичні посібники містять докладні приклади тестів:
  [Тести плагінів каналів](/uk/plugins/sdk-channel-plugins#step-6-test) і
  [Тести плагінів провайдерів](/uk/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестові утиліти

Ці підшляхи є локальними точками входу до вихідного коду репозиторію для тестів
власних вбудованих плагінів OpenClaw. Вони не є опублікованими експортами
`package.json` для сторонніх плагінів і можуть імпортувати Vitest або інші
тестові залежності, доступні лише в репозиторії.

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

Використовуйте ці спеціалізовані підшляхи для тестів вбудованих плагінів. Колишній
модуль реекспорту `openclaw/plugin-sdk/testing` був локальним для репозиторію, не входив до
пакетів, що постачаються, і був видалений. Застарілий псевдонім
`openclaw/plugin-sdk/test-utils` залишається локальним для репозиторію; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) відхиляє нові імпорти цього псевдоніма
в тестах розширень.

### Доступні експорти

| Експорт                                               | Призначення                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Створити мінімальний макет API плагіна для модульних тестів прямої реєстрації. Імпортувати з `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Спільна фікстура контракту профілю автентифікації для адаптерів нативного середовища виконання агента. Імпортувати з `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Спільна фікстура контракту приглушення доставки для адаптерів нативного середовища виконання агента. Імпортувати з `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Спільна фікстура контракту класифікації резервних варіантів для адаптерів нативного середовища виконання агента. Імпортувати з `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Створити фікстури схем динамічних інструментів для тестів контракту нативного середовища виконання. Імпортувати з `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Перевірити форму вхідного контексту каналу. Імпортувати з `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Установити випадки контракту вихідного корисного навантаження каналу. Імпортувати з `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Створити контексти життєвого циклу облікового запису каналу. Імпортувати з `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Установити загальні випадки контракту дій із повідомленнями каналу. Імпортувати з `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Установити загальні випадки контракту налаштування каналу. Імпортувати з `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Установити загальні випадки контракту стану каналу. Імпортувати з `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Перевірити ідентифікатори каталогу каналу з функції отримання списку каталогу. Імпортувати з `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Перевірити, що точки входу вбудованих каналів надають очікуваний публічний контракт. Імпортувати з `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Форматувати детерміновані часові мітки конвертів. Імпортувати з `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Перевірити текст відповіді на сполучення каналу та видобути з нього код. Імпортувати з `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Установити перевірки контракту реєстрації плагіна. Імпортувати з `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Зареєструвати один плагін постачальника в базових тестах завантажувача. Імпортувати з `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Зібрати всі типи постачальників з одного плагіна. Імпортувати з `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Зібрати реєстрації постачальників із кількох плагінів. Імпортувати з `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Перевірити, що колекція постачальників містить ідентифікатор. Імпортувати з `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Створити імітоване середовище виконання CLI/плагіна. Імпортувати з `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Створити імітовану поверхню середовища виконання плагіна. Імпортувати з `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Створити допоміжні засоби стану налаштування для плагінів каналів. Імпортувати з `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Створити імітований засіб запитів майстра налаштування. Імпортувати з `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Створити ізольований стан TaskFlow середовища виконання. Імпортувати з `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Виконати хук каталогу постачальників із тестовими залежностями. Імпортувати з `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Визначити варіанти вибору майстра налаштування постачальника в тестах контракту. Імпортувати з `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Визначити записи засобу вибору моделі постачальника в тестах контракту. Імпортувати з `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Створити ідентифікатори варіантів вибору майстра постачальника для перевірок. Імпортувати з `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Впровадити постачальників майстра постачальника для ізольованих тестів. Імпортувати з `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Установити перевірки контракту середовища виконання сімейства постачальників. Імпортувати з `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Перевірити, що політики повторного відтворення постачальника передаються через належні постачальнику інструменти й метадані. Імпортувати з `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Запустити тест постачальника потокового розпізнавання мовлення в реальному часі зі спільними аудіофікстурами. Імпортувати з `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Нормалізувати результат транскрипції наживо перед нечіткими перевірками. Імпортувати з `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Перевірити, що постачальники відео явно оголошують можливості режиму генерування. Імпортувати з `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Перевірити, що постачальники музики явно оголошують можливості генерування/редагування. Імпортувати з `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Установити успішну відповідь на відеозавдання, сумісну з DashScope. Імпортувати з `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Отримати доступ до добровільно ввімкнених макетів HTTP/автентифікації постачальника Vitest. Імпортувати з `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Скидати макети HTTP/автентифікації постачальника після кожного тесту. Імпортувати з `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Спільні тестові випадки для оброблення помилок визначення цілі. Імпортувати з `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Перевірити, чи має канал додати реакцію-підтвердження. Імпортувати з `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Видалити реакцію-підтвердження після доставки відповіді. Імпортувати з `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Створити фікстуру реєстру плагінів каналів. Імпортувати з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Створити фікстуру порожнього реєстру плагінів. Імпортувати з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Установити фікстуру реєстру для тестів середовища виконання плагіна. Імпортувати з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Зібрати JSON-запити fetch у тестах допоміжних засобів медіа. Імпортувати з `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Запустити тести з одноразовим локальним HTTP-сервером. Імпортувати з `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Створити мінімальний об’єкт вхідного HTTP-запиту. Імпортувати з `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Запустити тести fetch з установленими хуками попереднього з’єднання. Імпортувати з `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Тимчасово змінити змінні середовища. Імпортувати з `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Створити ізольовані тестові фікстури файлової системи. Імпортувати з `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Створити мінімальний макет відповіді HTTP-сервера. Імпортувати з `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Створити фікстури отримання даних про використання постачальника. Імпортувати з `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Заморозити й відновити таймери для чутливих до часу тестів. Імпортувати з `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Зібрати вивід середовища виконання CLI в тестах. Імпортувати з `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Імпортувати модуль ESM із новим токеном запиту, щоб обійти кеш модулів. Імпортувати з `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Визначити шляхи до фікстур вихідного коду або дистрибутива вбудованого плагіна. Імпортувати з `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Установити вузькоспеціалізовані макети вбудованих модулів Node для Vitest. Імпортувати з `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Створити контексти тестування пісочниці. Імпортувати з `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Записати фікстури навичок. Імпортувати з `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Створити фікстури повідомлень транскрипту агента. Імпортувати з `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Перевірити та скинути фікстури системних подій. Імпортувати з `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Очистити вивід термінала для перевірок. Імпортувати з `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Перевірити форму результату поділу на фрагменти. Імпортувати з `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Зберегти літеральні типи для табличних тестів. Імпортувати з `plugin-sdk/test-fixtures`                                                    |

Набори тестів контрактів вбудованих плагінів також використовують ці тестові підшляхи SDK для
допоміжних засобів реєстру, маніфесту, публічних артефактів і фікстур середовища виконання, призначених лише для тестів.
Набори тестів виключно для ядра, які залежать від складу вбудованих компонентів OpenClaw, натомість залишаються в
`src/plugins/contracts`.

### Типи

Підшляхи для цільового тестування також повторно експортують типи, корисні у файлах тестів:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
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

### Тестування контрактів реєстрації

Модульні тести, які передають написану вручну імітацію `api` до `register(api)`, не
перевіряють умови прийняття завантажувача OpenClaw. Додайте принаймні один
димовий тест із використанням завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо
хуків і ексклюзивних можливостей, як-от пам’ять.

Справжній завантажувач завершує реєстрацію плагіна помилкою, якщо немає обов’язкових метаданих або
плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назви хука, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована
точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації середовища виконання

Віддавайте перевагу спільній імітації середовища виконання плагіна з `openclaw/plugin-sdk/plugin-test-runtime`.
Її імітації `runtime.config.loadConfig()` та `runtime.config.writeConfigFile(...)`
типово породжують виняток, щоб тести виявляли нове використання застарілих API
сумісності. Перевизначайте ці імітації лише тоді, коли тест явно охоплює застарілу
поведінку сумісності.

### Модульне тестування плагіна каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
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

  it("має перевіряти обліковий запис без матеріалізації секретів", () => {
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

### Модульне тестування плагіна постачальника

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("має визначати динамічні моделі", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("має повертати каталог, коли доступний ключ API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Імітація середовища виконання плагіна

Для коду, який використовує `createPluginRuntimeStore`, імітуйте середовище виконання в тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "тестове середовище виконання не встановлено",
});

// У налаштуванні тесту
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... інші імітації
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

### Тестування із заглушками для окремих екземплярів

Віддавайте перевагу заглушкам для окремих екземплярів замість зміни прототипу:

```typescript
// Рекомендовано: заглушка для окремого екземпляра
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: зміна прототипу
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Вбудовані плагіни мають контрактні тести, які перевіряють володіння реєстрацією:

```bash
pnpm test src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють яких постачальників
- Які плагіни реєструють яких постачальників мовлення
- Правильність форми реєстрації
- Відповідність контракту середовища виконання

### Запуск тестів для визначеної області

Для конкретного плагіна:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Перевірка лінтером (плагіни в репозиторії)

`scripts/run-additional-boundary-checks.mjs` запускає набір перевірок меж імпорту `lint:plugins:*`
у CI; кожну з них також можна запускати локально окремо:

| Команда                                                        | Що забезпечує                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Вбудовані плагіни не можуть імпортувати монолітний кореневий файл повторного експорту `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Файли розширень для робочого середовища не можуть безпосередньо імпортувати дерево репозиторію `src/**` (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Файли тестів розширень не можуть імпортувати `plugin-sdk/test-utils` або інші допоміжні засоби тестування лише для ядра. |

Зовнішні плагіни не підпадають під дію цих правил лінтера, але рекомендовано дотримуватися тих самих
шаблонів.

## Конфігурація тестів

OpenClaw використовує Vitest 4 з інформаційним звітуванням про покриття V8. Для тестів плагінів:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного плагіна
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за назвою конкретного тесту
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з покриттям
pnpm test:coverage
```

Якщо локальні запуски спричиняють надмірне використання пам’яті:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язані матеріали

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни постачальників SDK](/uk/plugins/sdk-provider-plugins) -- хуки плагіна постачальника
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник із початку роботи
