---
read_when:
    - Вы пишете тесты для плагина
    - Вам нужны тестовые утилиты из SDK плагина
    - Вы хотите разобраться в контрактных тестах для встроенных плагинов
sidebarTitle: Testing
summary: Утилиты и шаблоны тестирования для плагинов OpenClaw
title: Тестирование плагинов
x-i18n:
    generated_at: "2026-07-13T18:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Справочник по тестовым утилитам, шаблонам и контролю с помощью линтера для плагинов OpenClaw.

<Tip>
  **Ищете примеры тестов?** Практические руководства содержат готовые примеры тестов:
  [Тесты плагинов каналов](/ru/plugins/sdk-channel-plugins#step-6-test) и
  [Тесты плагинов провайдеров](/ru/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Тестовые утилиты

Эти подпути являются локальными точками входа в исходный код репозитория для тестов собственных встроенных плагинов OpenClaw. Они не публикуются как экспорты `package.json` для сторонних плагинов и могут импортировать Vitest или другие тестовые зависимости, доступные только в репозитории.

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

Для новых тестов встроенных плагинов предпочитайте эти специализированные подпути. Общий модуль `openclaw/plugin-sdk/testing` и псевдоним `openclaw/plugin-sdk/test-utils` предназначены только для обратной совместимости: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) отклоняет новые импорты любого из них в тестовых файлах расширений, и оба сохраняются исключительно для тестов, фиксирующих совместимость.

### Доступные экспорты

| Экспорт                                              | Назначение                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Создаёт минимальную имитацию API плагина для модульных тестов прямой регистрации. Импортируется из `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Общая фикстура контракта профиля аутентификации для нативных адаптеров среды выполнения агентов. Импортируется из `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Общая фикстура контракта подавления доставки для нативных адаптеров среды выполнения агентов. Импортируется из `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Общая фикстура контракта классификации резервных вариантов для нативных адаптеров среды выполнения агентов. Импортируется из `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Создаёт фикстуры схем динамических инструментов для тестов контрактов нативной среды выполнения. Импортируется из `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Проверяет структуру контекста входящих данных канала. Импортируется из `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Устанавливает наборы проверок контракта исходящей полезной нагрузки канала. Импортируется из `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Создаёт контексты жизненного цикла учётной записи канала. Импортируется из `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Устанавливает наборы проверок контракта универсальных действий с сообщениями канала. Импортируется из `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Устанавливает наборы проверок универсального контракта настройки канала. Импортируется из `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Устанавливает наборы проверок универсального контракта состояния канала. Импортируется из `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Проверяет идентификаторы каталога каналов, полученные из функции вывода списка каталогов. Импортируется из `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Проверяет, что точки входа встроенных каналов предоставляют ожидаемый публичный контракт. Импортируется из `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Форматирует детерминированные временные метки конвертов. Импортируется из `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Проверяет текст ответа на сопряжение канала и извлекает из него код. Импортируется из `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Устанавливает проверки контракта регистрации плагина. Импортируется из `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Регистрирует один плагин провайдера в дымовых тестах загрузчика. Импортируется из `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Собирает все типы провайдеров из одного плагина. Импортируется из `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Собирает регистрации провайдеров из нескольких плагинов. Импортируется из `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Проверяет, что коллекция провайдеров содержит идентификатор. Импортируется из `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Создаёт имитируемое окружение среды выполнения CLI/плагина. Импортируется из `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Создаёт имитируемый интерфейс среды выполнения плагина. Импортируется из `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Создаёт вспомогательные функции состояния настройки для плагинов каналов. Импортируется из `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Создаёт имитируемый интерфейс запросов мастера настройки. Импортируется из `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Создаёт изолированное состояние TaskFlow среды выполнения. Импортируется из `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Выполняет обработчик каталога провайдера с тестовыми зависимостями. Импортируется из `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Разрешает варианты выбора мастера настройки провайдера в тестах контрактов. Импортируется из `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Разрешает элементы средства выбора модели провайдера в тестах контрактов. Импортируется из `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Создаёт идентификаторы вариантов выбора мастера провайдера для проверок. Импортируется из `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Внедряет провайдеры мастера настройки провайдера для изолированных тестов. Импортируется из `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Устанавливает проверки контрактов среды выполнения семейства провайдеров. Импортируется из `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Проверяет, что политики повторного воспроизведения провайдера передаются через принадлежащие провайдеру инструменты и метаданные. Импортируется из `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Выполняет реальный тест провайдера распознавания речи в реальном времени с общими аудиофикстурами. Импортируется из `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Нормализует вывод реальной расшифровки перед нечёткими проверками. Импортируется из `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Проверяет, что провайдеры видео явно объявляют возможности режимов генерации. Импортируется из `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Проверяет, что провайдеры музыки явно объявляют возможности генерации и редактирования. Импортируется из `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Устанавливает успешный ответ видеозадачи, совместимый с DashScope. Импортируется из `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Предоставляет доступ к включаемым явно имитациям HTTP/аутентификации провайдера в Vitest. Импортируется из `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Сбрасывает имитации HTTP/аутентификации провайдера после каждого теста. Импортируется из `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Общие тестовые сценарии для обработки ошибок разрешения цели. Импортируется из `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Проверяет, должен ли канал добавлять реакцию подтверждения. Импортируется из `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Удаляет реакцию подтверждения после доставки ответа. Импортируется из `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Создаёт фикстуру реестра плагинов каналов. Импортируется из `plugin-sdk/plugin-test-runtime` или `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Создаёт фикстуру пустого реестра плагинов. Импортируется из `plugin-sdk/plugin-test-runtime` или `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Устанавливает фикстуру реестра для тестов среды выполнения плагинов. Импортируется из `plugin-sdk/plugin-test-runtime` или `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Перехватывает JSON-запросы fetch в тестах вспомогательных функций для медиа. Импортируется из `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Выполняет тесты с одноразовым локальным HTTP-сервером. Импортируется из `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Создаёт минимальный объект входящего HTTP-запроса. Импортируется из `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Выполняет тесты fetch с установленными обработчиками предварительного подключения. Импортируется из `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Временно изменяет переменные окружения. Импортируется из `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Создаёт изолированные тестовые фикстуры файловой системы. Импортируется из `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Создаёт минимальную имитацию ответа HTTP-сервера. Импортируется из `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Создаёт фикстуры fetch для данных об использовании провайдера. Импортируется из `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Замораживает и восстанавливает таймеры для тестов, зависящих от времени. Импортируется из `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Перехватывает вывод среды выполнения CLI в тестах. Импортируется из `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Импортирует модуль ESM с новым токеном запроса для обхода кеша модулей. Импортируется из `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Разрешает пути к фикстурам исходного кода или дистрибутива встроенного плагина. Импортируется из `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Устанавливает узкоспециализированные имитации встроенных модулей Node в Vitest. Импортируется из `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Создаёт контексты тестирования песочницы. Импортируется из `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Записывает фикстуры навыков. Импортируется из `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Создаёт фикстуры сообщений расшифровки агента. Импортируется из `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Проверяет и сбрасывает фикстуры системных событий. Импортируется из `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Очищает вывод терминала для проверок. Импортируется из `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Проверяет структуру вывода разбиения на фрагменты. Импортируется из `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Сохраняет литеральные типы для табличных тестов. Импортируется из `plugin-sdk/test-fixtures`                                                    |

Наборы тестов контрактов встроенных плагинов также используют эти тестовые подпути SDK для
вспомогательных функций реестра, манифеста, публичных артефактов и фикстур среды выполнения, используемых только в тестах.
Наборы тестов только для ядра, зависящие от состава встроенных компонентов OpenClaw, остаются в
`src/plugins/contracts`.

### Типы

Подпути для целевого тестирования также реэкспортируют типы, полезные в тестовых файлах:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Тестирование разрешения целей

Используйте `installCommonResolveTargetErrorCases`, чтобы добавить стандартные случаи ошибок для
разрешения целей канала:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("разрешение целей my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логика разрешения целей вашего канала
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Добавьте тестовые случаи, специфичные для канала
  it("должен разрешать цели @username", () => {
    // ...
  });
});
```

## Шаблоны тестирования

### Тестирование контрактов регистрации

Модульные тесты, передающие вручную написанный мок `api` в `register(api)`, не
проверяют прохождение проверок допуска загрузчика OpenClaw. Добавьте хотя бы один
дымовой тест с реальным загрузчиком для каждой поверхности регистрации, от которой зависит
ваш плагин, особенно для хуков и эксклюзивных возможностей, таких как память.

Реальный загрузчик отклоняет регистрацию плагина, если отсутствуют обязательные метаданные или
плагин вызывает API возможности, которой он не владеет. Например,
`api.registerHook(...)` требует имя хука, а
`api.registerMemoryCapability(...)` требует, чтобы в манифесте плагина или экспортируемой
точке входа было объявлено `kind: "memory"`.

### Тестирование доступа к конфигурации среды выполнения

Предпочитайте общий мок среды выполнения плагина из `openclaw/plugin-sdk/plugin-test-runtime`.
Его моки `runtime.config.loadConfig()` и `runtime.config.writeConfigFile(...)`
по умолчанию выбрасывают исключение, чтобы тесты обнаруживали новое использование устаревших API
совместимости. Переопределяйте эти моки только тогда, когда тест явно проверяет устаревшее
поведение совместимости.

### Модульное тестирование плагина канала

```typescript
import { describe, it, expect, vi } from "vitest";

describe("плагин my-channel", () => {
  it("должен разрешать учётную запись из конфигурации", () => {
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

  it("должен проверять учётную запись без материализации секретов", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Значение токена не раскрывается
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Модульное тестирование плагина провайдера

```typescript
import { describe, it, expect } from "vitest";

describe("плагин my-provider", () => {
  it("должен разрешать динамические модели", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... контекст
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("должен возвращать каталог, когда доступен ключ API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... контекст
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Имитация среды выполнения плагина

Для кода, использующего `createPluginRuntimeStore`, создайте мок среды выполнения в тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "тестовая среда выполнения не задана",
});

// При настройке теста
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... другие моки
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... другие пространства имён
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// После тестов
store.clearRuntime();
```

### Тестирование с заглушками отдельных экземпляров

Предпочитайте заглушки отдельных экземпляров изменению прототипа:

```typescript
// Предпочтительно: заглушка отдельного экземпляра
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Избегайте: изменение прототипа
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактные тесты (плагины в репозитории)

Встроенные плагины имеют контрактные тесты, проверяющие владение регистрацией:

```bash
pnpm test src/plugins/contracts/
```

Эти тесты проверяют:

- Какие плагины регистрируют каких провайдеров
- Какие плагины регистрируют каких провайдеров речи
- Корректность формы регистрации
- Соответствие контракту среды выполнения

### Запуск тестов для ограниченной области

Для конкретного плагина:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Только для контрактных тестов:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Проверки линтера (плагины в репозитории)

`scripts/run-additional-boundary-checks.mjs` запускает в CI набор проверок границ
импорта `lint:plugins:*`; каждую из них также можно запускать отдельно локально:

| Команда                                                        | Что проверяет                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Встроенные плагины не могут импортировать монолитный корневой баррель `openclaw/plugin-sdk`.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Рабочие файлы расширений не могут напрямую импортировать дерево репозитория `src/**` (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Тестовые файлы расширений не могут импортировать `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` или другие вспомогательные средства тестирования, предназначенные только для ядра. |

Внешние плагины не подпадают под эти правила линтера, но рекомендуется следовать тем же
шаблонам.

## Конфигурация тестов

OpenClaw использует Vitest 4 с информационными отчётами о покрытии V8. Для тестов плагинов:

```bash
# Запустить все тесты
pnpm test

# Запустить тесты конкретного плагина
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустить с фильтром по имени конкретного теста
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустить с измерением покрытия
pnpm test:coverage
```

Если локальные запуски приводят к нехватке памяти:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Связанные материалы

- [Обзор SDK](/ru/plugins/sdk-overview) -- соглашения об импорте
- [Плагины каналов SDK](/ru/plugins/sdk-channel-plugins) -- интерфейс плагина канала
- [Плагины провайдеров SDK](/ru/plugins/sdk-provider-plugins) -- хуки плагина провайдера
- [Создание плагинов](/ru/plugins/building-plugins) -- руководство по началу работы
