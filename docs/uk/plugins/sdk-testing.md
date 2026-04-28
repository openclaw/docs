---
read_when:
    - Ви пишете тести для плагіна
    - Вам потрібні утиліти тестування з SDK плагіна
    - Ви хочете зрозуміти контрактні тести для bundled плагінів
sidebarTitle: Testing
summary: Утиліти та шаблони тестування для плагінів OpenClaw
title: Тестування Plugin
x-i18n:
    generated_at: "2026-04-28T01:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcc9f0340a651ab742150101ceb78b65ea450b90720bc06e96bb19535db3d83d
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

**Імпорт мока API плагіна:** `openclaw/plugin-sdk/plugin-test-api`

**Імпорт контракту каналу:** `openclaw/plugin-sdk/channel-contract-testing`

**Імпорт допоміжних засобів тестування каналу:** `openclaw/plugin-sdk/channel-test-helpers`

**Імпорт тестування цілей каналу:** `openclaw/plugin-sdk/channel-target-testing`

**Імпорт контракту плагіна:** `openclaw/plugin-sdk/plugin-test-contracts`

**Імпорт тестування runtime плагіна:** `openclaw/plugin-sdk/plugin-test-runtime`

**Імпорт контракту провайдера:** `openclaw/plugin-sdk/provider-test-contracts`

**Імпорт тестування середовища/мережі:** `openclaw/plugin-sdk/test-env`

**Імпорт загальних фікстур:** `openclaw/plugin-sdk/test-fixtures`

Для нових тестів плагінів надавайте перевагу наведеним нижче цільовим підшляхам. Широкий barrel `openclaw/plugin-sdk/testing` призначений лише для сумісності зі застарілим кодом.

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
import { withEnv, withFetchPreconnect } from "openclaw/plugin-sdk/test-env";
import { createCliRuntimeCapture, typedCases } from "openclaw/plugin-sdk/test-fixtures";
```

### Доступні експортовані елементи

| Export                                          | Призначення                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                           | Створює мінімальний мок API плагіна для прямих unit-тестів реєстрації. Імпортуйте з `plugin-sdk/plugin-test-api`                      |
| `expectChannelInboundContextContract`           | Перевіряє форму вхідного контексту каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                                          |
| `installChannelOutboundPayloadContractSuite`    | Встановлює набір випадків контракту вихідного payload каналу. Імпортуйте з `plugin-sdk/channel-contract-testing`                      |
| `createStartAccountContext`                     | Створює контексти життєвого циклу облікового запису каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                            |
| `installChannelActionsContractSuite`            | Встановлює загальний набір випадків контракту дій повідомлень каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                  |
| `installChannelSetupContractSuite`              | Встановлює загальний набір випадків контракту налаштування каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                     |
| `installChannelStatusContractSuite`             | Встановлює загальний набір випадків контракту статусу каналу. Імпортуйте з `plugin-sdk/channel-test-helpers`                          |
| `expectDirectoryIds`                            | Перевіряє id каталогів із функції списку каталогів. Імпортуйте з `plugin-sdk/channel-test-helpers`                                     |
| `describePluginRegistrationContract`            | Встановлює перевірки контракту реєстрації плагіна. Імпортуйте з `plugin-sdk/plugin-test-contracts`                                    |
| `registerSingleProviderPlugin`                  | Реєструє один плагін провайдера у smoke-тестах завантажувача. Імпортуйте з `plugin-sdk/plugin-test-runtime`                           |
| `registerProviderPlugin`                        | Захоплює всі типи провайдерів з одного плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugins`                       | Захоплює реєстрації провайдерів у кількох плагінах. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                     | Перевіряє, що колекція провайдерів містить id. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                          |
| `createRuntimeEnv`                              | Створює змокане середовище runtime CLI/плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime`                                         |
| `createPluginSetupWizardStatus`                 | Створює допоміжні засоби статусу майстра налаштування для плагінів каналів. Імпортуйте з `plugin-sdk/plugin-test-runtime`            |
| `describeOpenAIProviderRuntimeContract`         | Встановлює перевірки контракту runtime для сімейства провайдерів. Імпортуйте з `plugin-sdk/provider-test-contracts`                   |
| `installCommonResolveTargetErrorCases`          | Спільні тестові випадки для обробки помилок розв’язання цілі. Імпортуйте з `plugin-sdk/channel-target-testing`                        |
| `shouldAckReaction`                             | Перевіряє, чи має канал додати реакцію-підтвердження. Імпортуйте з `plugin-sdk/channel-feedback`                                      |
| `removeAckReactionAfterReply`                   | Видаляє реакцію-підтвердження після доставки відповіді. Імпортуйте з `plugin-sdk/channel-feedback`                                    |
| `createTestRegistry`                            | Створює фікстуру реєстру плагінів каналу. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`        |
| `createEmptyPluginRegistry`                     | Створює порожню фікстуру реєстру плагінів. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers`       |
| `setActivePluginRegistry`                       | Встановлює фікстуру реєстру для тестів runtime плагіна. Імпортуйте з `plugin-sdk/plugin-test-runtime` або `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                 | Захоплює JSON-запити fetch у тестах допоміжних медіа-функцій. Імпортуйте з `plugin-sdk/test-env`                                      |
| `withFetchPreconnect`                           | Виконує тести fetch з установленими хуками preconnect. Імпортуйте з `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                      | Тимчасово підміняє змінні середовища. Імпортуйте з `plugin-sdk/test-env`                                                              |
| `createTempHomeEnv` / `withTempDir`             | Створює ізольовані фікстури файлової системи для тестів. Імпортуйте з `plugin-sdk/test-env`                                          |
| `createMockServerResponse`                      | Створює мінімальний мок відповіді HTTP-сервера. Імпортуйте з `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                       | Захоплює вивід runtime CLI у тестах. Імпортуйте з `plugin-sdk/test-fixtures`                                                          |
| `createSandboxTestContext`                      | Створює контексти тестування sandbox. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `writeSkill`                                    | Записує фікстури Skills. Імпортуйте з `plugin-sdk/test-fixtures`                                                                       |
| `makeAgentAssistantMessage`                     | Створює фікстури повідомлень транскрипту агента. Імпортуйте з `plugin-sdk/test-fixtures`                                              |
| `peekSystemEvents` / `resetSystemEventsForTest` | Переглядає та скидає фікстури системних подій. Імпортуйте з `plugin-sdk/test-fixtures`                                                |
| `sanitizeTerminalText`                          | Очищає вивід термінала для перевірок. Імпортуйте з `plugin-sdk/test-fixtures`                                                         |
| `countLines` / `hasBalancedFences`              | Перевіряє форму chunking-виводу. Імпортуйте з `plugin-sdk/test-fixtures`                                                               |
| `runProviderCatalog`                            | Виконує хук каталогу провайдерів із тестовими залежностями                                                                             |
| `resolveProviderWizardOptions`                  | Розв’язує варіанти майстра налаштування провайдера у контрактних тестах                                                                |
| `resolveProviderModelPickerEntries`             | Розв’язує елементи вибору моделей провайдера у контрактних тестах                                                                      |
| `buildProviderPluginMethodChoice`               | Створює id варіантів майстра провайдера для перевірок                                                                                  |
| `setProviderWizardProvidersResolverForTest`     | Впроваджує провайдери майстра для ізольованих тестів                                                                                   |
| `createProviderUsageFetch`                      | Створює фікстури fetch використання провайдера                                                                                         |
| `useFrozenTime` / `useRealTime`                 | Заморожує та відновлює таймери для чутливих до часу тестів. Імпортуйте з `plugin-sdk/test-env`                                        |
| `createTestWizardPrompter`                      | Створює змоканий prompter майстра налаштування                                                                                         |
| `createRuntimeTaskFlow`                         | Створює ізольований стан runtime TaskFlow                                                                                              |
| `typedCases`                                    | Зберігає літеральні типи для таблично-орієнтованих тестів. Імпортуйте з `plugin-sdk/test-fixtures`                                    |

Набори контрактних тестів bundled-плагінів також використовують підшляхи SDK тестування для допоміжних засобів фікстур реєстру, маніфесту, публічних артефактів і runtime, призначених лише для тестів. Набори тільки для core, які залежать від bundled-інвентарю OpenClaw, залишаються в `src/plugins/contracts`.
Для нових тестів extension використовуйте документований цільовий підшлях SDK, наприклад
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`,
`plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`,
`plugin-sdk/test-env` або `plugin-sdk/test-fixtures`, замість імпорту з
широкого сумісного barrel `plugin-sdk/testing`, файлів репозиторію `src/**` або
напряму з проміжних модулів репозиторію `test/helpers/plugins/*`.

### Типи

Цільові підшляхи тестування також повторно експортують типи, корисні у файлах тестів:

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

describe("розв’язання цілі my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка розв’язання цілі вашого каналу
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Додайте специфічні для каналу тестові випадки
  it("має розв’язувати цілі @username", () => {
    // ...
  });
});
```

## Шаблони тестування

### Тестування контрактів реєстрації

Unit-тести, які передають вручну написаний мок `api` до `register(api)`, не перевіряють acceptance gates завантажувача OpenClaw. Додайте принаймні один smoke-тест із використанням завантажувача для кожної поверхні реєстрації, від якої залежить ваш плагін, особливо для hooks і ексклюзивних можливостей, таких як memory.

Справжній завантажувач відхиляє реєстрацію плагіна, якщо відсутні обов’язкові метадані або якщо плагін викликає API можливості, якою він не володіє. Наприклад,
`api.registerHook(...)` вимагає назву hook, а
`api.registerMemoryCapability(...)` вимагає, щоб маніфест плагіна або експортована точка входу оголошували `kind: "memory"`.

### Тестування доступу до конфігурації runtime

Для тестування bundled-плагінів каналів віддавайте перевагу спільному моку runtime плагіна з `openclaw/plugin-sdk/channel-test-helpers`.
Його застарілі моки `runtime.config.loadConfig()` і
`runtime.config.writeConfigFile(...)` за замовчуванням викидають помилки, щоб тести виявляли нове використання API сумісності. Перевизначайте ці моки лише тоді, коли тест явно покриває застарілу поведінку сумісності.

### Unit-тестування плагіна каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("плагін my-channel", () => {
  it("має розв’язувати обліковий запис із конфігурації", () => {
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

### Unit-тестування плагіна провайдера

```typescript
import { describe, it, expect } from "vitest";

describe("плагін my-provider", () => {
  it("має розв’язувати динамічні моделі", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("має повертати каталог, коли ключ API доступний", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Мокування runtime плагіна

Для коду, що використовує `createPluginRuntimeStore`, замокуйте runtime у тестах:

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

### Тестування з per-instance stubs

Віддавайте перевагу per-instance stubs замість мутації prototype:

```typescript
// Бажано: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: мутації prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (плагіни в репозиторії)

Bundled-плагіни мають контрактні тести, які перевіряють право власності на реєстрацію:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які плагіни реєструють які провайдери
- Які плагіни реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність контракту runtime

### Запуск тестів з обмеженою областю

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

1. **Без монолітних імпортів із кореня** -- кореневий barrel `openclaw/plugin-sdk` відхиляється
2. **Без прямих імпортів із `src/`** -- плагіни не можуть напряму імпортувати `../../src/`
3. **Без самоімпортів** -- плагіни не можуть імпортувати власний підшлях `plugin-sdk/<name>`

Зовнішні плагіни не підпадають під дію цих правил lint, але дотримуватися тих самих шаблонів рекомендується.

## Конфігурація тестування

OpenClaw використовує Vitest із порогами покриття V8. Для тестів плагінів:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного плагіна
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за конкретною назвою тесту
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з coverage
pnpm test:coverage
```

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- правила імпорту
- [Плагіни каналів SDK](/uk/plugins/sdk-channel-plugins) -- інтерфейс плагіна каналу
- [Плагіни провайдерів SDK](/uk/plugins/sdk-provider-plugins) -- hooks плагіна провайдера
- [Створення плагінів](/uk/plugins/building-plugins) -- посібник для початку роботи
