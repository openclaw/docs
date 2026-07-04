---
doc-schema-version: 1
read_when:
    - Вы хотите создать новый Plugin OpenClaw
    - Вам нужно краткое руководство по началу разработки Plugin
    - Вы выбираете между документацией по каналу, провайдеру, бэкенду CLI, инструменту или хуку
sidebarTitle: Getting Started
summary: Создайте свой первый Plugin для OpenClaw за считанные минуты
title: Создание plugins
x-i18n:
    generated_at: "2026-07-04T10:52:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагины расширяют OpenClaw без изменения ядра. Плагин может добавить канал
обмена сообщениями, поставщика моделей, локальный CLI-бэкенд, инструмент агента,
хук, поставщика медиа или другую возможность, принадлежащую плагину.

Вам не нужно добавлять внешний плагин в репозиторий OpenClaw. Опубликуйте
пакет в [ClawHub](/clawhub), и пользователи установят его с помощью:

```bash
openclaw plugins install clawhub:<package-name>
```

Спецификации пакетов без префикса по-прежнему устанавливаются из npm во время
перехода при запуске. Используйте префикс `clawhub:`, когда нужно разрешение
через ClawHub.

## Требования

- Используйте Node 22.19+, Node 23.11+ или Node 24+ и менеджер пакетов, например `npm` или `pnpm`.
- Знайте модули TypeScript ESM.
- Для работы с встроенным плагином внутри репозитория клонируйте репозиторий и выполните `pnpm install`.
  Разработка плагинов из исходного checkout поддерживает только pnpm, потому что OpenClaw загружает встроенные
  плагины из workspace-пакетов `extensions/*`.

## Выберите форму плагина

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Подключите OpenClaw к платформе обмена сообщениями.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Добавьте поставщика моделей, медиа, поиска, загрузки, речи или realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Запускайте локальный AI CLI через резервный выбор модели OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ru/plugins/tool-plugins">
    Регистрируйте инструменты агента.
  </Card>
</CardGroup>

## Быстрый старт

Создайте минимальный плагин инструмента, зарегистрировав один обязательный
инструмент агента. Это самая короткая полезная форма плагина, показывающая
пакет, манифест, точку входа и локальное подтверждение.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Опубликованные внешние плагины должны указывать runtime-точки входа на собранные файлы JavaScript.
    Полный контракт точки входа см. в [точках входа SDK](/ru/plugins/sdk-entrypoints).

    Каждому плагину нужен манифест, даже если у него нет конфигурации. Runtime-инструменты
    должны быть указаны в `contracts.tools`, чтобы OpenClaw мог обнаружить владельца без
    предварительной загрузки runtime каждого плагина. Задавайте `activation.onStartup`
    осознанно. Этот пример запускается при запуске Gateway.

    Поверхности плагинов, которым доверяет хост, также ограничиваются манифестом и требуют явного
    включения для установленных плагинов. Если установленный плагин регистрирует
    `api.registerAgentToolResultMiddleware(...)`, объявите каждый целевой runtime в
    `contracts.agentToolResultMiddleware`. Если он регистрирует
    `api.registerTrustedToolPolicy(...)`, объявите каждый id политики в
    `contracts.trustedToolPolicies`. Эти объявления синхронизируют проверку при установке
    и runtime-регистрацию.

    Все поля манифеста см. в [манифесте плагина](/ru/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Используйте `definePluginEntry` для плагинов, не являющихся каналами. Плагины каналов используют
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Для установленного или внешнего плагина проверьте загруженный runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Если плагин регистрирует команду CLI, также выполните эту команду. Например,
    у демонстрационной команды должно быть подтверждение выполнения, такое как
    `openclaw demo-plugin ping`.

    Для встроенного плагина в этом репозитории OpenClaw обнаруживает пакеты плагинов
    из исходного checkout в workspace `extensions/*`. Запустите ближайший целевой
    тест:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Проверьте пакет перед публикацией:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонические фрагменты ClawHub находятся в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Установите опубликованный пакет через ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Регистрация инструментов

Инструменты могут быть обязательными или необязательными. Обязательные инструменты всегда доступны, когда
плагин включен. Необязательные инструменты требуют явного согласия пользователя.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Каждый инструмент, зарегистрированный через `api.registerTool(...)`, также должен быть объявлен в
манифесте плагина:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Пользователи включают их через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Необязательные инструменты управляют тем, предоставляется ли инструмент модели. Используйте
[запросы разрешений плагинов](/ru/plugins/plugin-permission-requests), когда инструмент
или хук должен запросить подтверждение после выбора моделью и до выполнения
действия.

Используйте необязательные инструменты для побочных эффектов, необычных бинарных файлов или возможностей,
которые не должны быть доступны по умолчанию. Имена инструментов не должны конфликтовать с инструментами ядра;
конфликты пропускаются и сообщаются в диагностике плагина. Некорректные
регистрации, включая дескрипторы инструментов без `parameters`, пропускаются и
сообщаются тем же способом. Зарегистрированные инструменты — это типизированные функции, которые модель может вызывать
после успешных проверок политик и allowlist.

Фабрики инструментов получают объект контекста, предоставленный runtime. Используйте `ctx.activeModel`,
когда инструменту нужно логировать, отображать или адаптироваться к активной модели для текущего
хода. Объект может включать `provider`, `modelId` и `modelRef`. Рассматривайте его как
информационные runtime-метаданные, а не как границу безопасности против локального
оператора, установленного кода плагина или измененного runtime OpenClaw. Чувствительные локальные
инструменты все равно должны требовать явного согласия плагина или оператора и fail closed,
когда метаданные активной модели отсутствуют или не подходят.

Манифест объявляет владение и обнаружение; выполнение по-прежнему вызывает живую
зарегистрированную реализацию инструмента. Держите `toolMetadata.<tool>.optional: true`
согласованным с `api.registerTool(..., { optional: true })`, чтобы OpenClaw мог избегать
загрузки runtime этого плагина до явного добавления инструмента в allowlist.

## Соглашения об импорте

Импортируйте из узких подпутей SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не импортируйте из устаревшего корневого barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Внутри пакета плагина используйте локальные barrel-файлы, такие как `api.ts` и
`runtime-api.ts`, для внутренних импортов. Не импортируйте собственный плагин через
путь SDK. Вспомогательные средства для конкретного поставщика должны оставаться в пакете поставщика, если только
стык не является действительно универсальным.

Пользовательские методы Gateway RPC — это расширенная точка входа. Держите их на
префиксе конкретного плагина; пространства имен администрирования ядра, такие как `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` и `update.*`, остаются зарезервированными
и разрешаются в `operator.admin`. Мост
`openclaw/plugin-sdk/gateway-method-runtime` зарезервирован для HTTP-маршрутов плагина,
которые объявляют `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Полную карту импортов см. в [обзоре Plugin SDK](/ru/plugins/sdk-overview).

## Контрольный список перед отправкой

<Check>**package.json** содержит корректные метаданные `openclaw`</Check>
<Check>Манифест **openclaw.plugin.json** присутствует и валиден</Check>
<Check>Точка входа использует `defineChannelPluginEntry` или `definePluginEntry`</Check>
<Check>Все импорты используют узкие пути `plugin-sdk/<subpath>`</Check>
<Check>Внутренние импорты используют локальные модули, а не SDK self-imports</Check>
<Check>Тесты проходят (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходит (для плагинов в репозитории)</Check>

## Тестирование на beta-релизах

1. Следите за тегами релизов GitHub в [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) и подпишитесь через `Watch` > `Releases`. Beta-теги выглядят как `v2026.3.N-beta.1`. Также можно включить уведомления для официального аккаунта OpenClaw в X [@openclaw](https://x.com/openclaw), чтобы получать объявления о релизах.
2. Протестируйте свой плагин на beta-теге сразу после его появления. Окно до stable обычно составляет всего несколько часов.
3. После тестирования напишите в треде своего плагина в Discord-канале `plugin-forum`: либо `all good`, либо что сломалось. Если треда еще нет, создайте его.
4. Если что-то сломалось, откройте или обновите issue с заголовком `Beta blocker: <plugin-name> - <summary>` и примените метку `beta-blocker`. Поместите ссылку на issue в свой тред.
5. Откройте PR в `main` с заголовком `fix(<plugin-id>): beta blocker - <summary>` и свяжите issue как в PR, так и в своем Discord-треде. Участники не могут ставить метки на PR, поэтому заголовок — это сигнал на стороне PR для сопровождающих и автоматизации. Блокеры с PR будут объединены; блокеры без PR могут попасть в релиз как есть. Сопровождающие следят за этими тредами во время beta-тестирования.
6. Молчание означает зеленый статус. Если вы пропустите окно, ваше исправление, скорее всего, попадет в следующий цикл.

## Следующие шаги

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Создайте плагин канала обмена сообщениями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Создайте плагин поставщика моделей
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Зарегистрируйте локальный AI CLI-бэкенд
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ru/plugins/sdk-overview">
    Карта импортов и справочник API регистрации
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, поиск, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ru/plugins/sdk-testing">
    Тестовые утилиты и паттерны
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ru/plugins/manifest">
    Полный справочник схемы манифеста
  </Card>
</CardGroup>

## Связанные материалы

- [Хуки плагинов](/ru/plugins/hooks)
- [Архитектура плагинов](/ru/plugins/architecture)
