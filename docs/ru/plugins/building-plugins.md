---
doc-schema-version: 1
read_when:
    - Вы хотите создать новый Plugin OpenClaw
    - Вам нужно краткое руководство по началу разработки Plugin
    - Вы выбираете между документацией канала, провайдера, CLI-бэкенда, инструмента или хуков
sidebarTitle: Getting Started
summary: Создайте свой первый Plugin OpenClaw за несколько минут
title: Создание plugins
x-i18n:
    generated_at: "2026-06-28T23:14:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins расширяют OpenClaw без изменения core. Plugin может добавить канал
обмена сообщениями, поставщика моделей, локальный CLI-бэкенд, агентский
инструмент, hook, поставщика медиа или другую возможность, принадлежащую
Plugin.

Вам не нужно добавлять внешний Plugin в репозиторий OpenClaw. Опубликуйте
пакет в [ClawHub](/ru/clawhub), и пользователи установят его с помощью:

```bash
openclaw plugins install clawhub:<package-name>
```

Спецификации пакетов без префикса по-прежнему устанавливаются из npm во время
перехода при запуске. Используйте префикс `clawhub:`, когда вам нужно
разрешение через ClawHub.

## Требования

- Используйте Node 22.19 или новее и менеджер пакетов, например `npm` или `pnpm`.
- Будьте знакомы с TypeScript ESM-модулями.
- Для работы над встроенным Plugin внутри репозитория клонируйте репозиторий и
  выполните `pnpm install`. Разработка Plugin из исходного checkout поддерживает
  только pnpm, потому что OpenClaw загружает встроенные Plugins из workspace-пакетов
  `extensions/*`.

## Выберите форму Plugin

<CardGroup cols={2}>
  <Card title="Plugin канала" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Подключите OpenClaw к платформе обмена сообщениями.
  </Card>
  <Card title="Plugin поставщика" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Добавьте поставщика моделей, медиа, поиска, fetch, речи или realtime.
  </Card>
  <Card title="Plugin CLI-бэкенда" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Запускайте локальный AI CLI через fallback моделей OpenClaw.
  </Card>
  <Card title="Plugin инструментов" icon="wrench" href="/ru/plugins/tool-plugins">
    Регистрируйте агентские инструменты.
  </Card>
</CardGroup>

## Быстрый старт

Создайте минимальный Plugin инструментов, зарегистрировав один обязательный
агентский инструмент. Это самая короткая полезная форма Plugin, которая
показывает пакет, манифест, точку входа и локальное подтверждение.

<Steps>
  <Step title="Создайте метаданные пакета">
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

    Опубликованные внешние Plugins должны указывать runtime-точки входа на
    собранные JavaScript-файлы. Полный контракт точки входа см. в
    [точках входа SDK](/ru/plugins/sdk-entrypoints).

    Каждому Plugin нужен манифест, даже если у него нет конфигурации.
    Runtime-инструменты должны быть указаны в `contracts.tools`, чтобы OpenClaw
    мог обнаруживать владельца без предварительной загрузки runtime каждого
    Plugin. Задавайте `activation.onStartup` осознанно. Этот пример запускается
    при запуске Gateway.

    Поверхности Plugin, доверенные host, также ограничиваются манифестом и
    требуют явного включения для установленных Plugins. Если установленный
    Plugin регистрирует `api.registerAgentToolResultMiddleware(...)`, объявите
    каждый целевой runtime в `contracts.agentToolResultMiddleware`. Если он
    регистрирует `api.registerTrustedToolPolicy(...)`, объявите каждый id
    политики в `contracts.trustedToolPolicies`. Эти объявления синхронизируют
    проверку при установке и регистрацию runtime.

    Все поля манифеста см. в [манифесте Plugin](/ru/plugins/manifest).

  </Step>

  <Step title="Зарегистрируйте инструмент">
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

    Используйте `definePluginEntry` для Plugins, не являющихся каналами.
    Plugins каналов используют `defineChannelPluginEntry`.

  </Step>

  <Step title="Проверьте runtime">
    Для установленного или внешнего Plugin проверьте загруженный runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Если Plugin регистрирует CLI-команду, также запустите эту команду.
    Например, demo-команда должна иметь подтверждение выполнения, такое как
    `openclaw demo-plugin ping`.

    Для встроенного Plugin в этом репозитории OpenClaw обнаруживает пакеты
    Plugin из исходного checkout в workspace `extensions/*`. Запустите ближайший
    целевой тест:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Опубликуйте">
    Проверьте пакет перед публикацией:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонические фрагменты ClawHub находятся в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Установите">
    Установите опубликованный пакет через ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Регистрация инструментов

Инструменты могут быть обязательными или опциональными. Обязательные инструменты
всегда доступны, когда Plugin включен. Опциональные инструменты требуют
явного согласия пользователя.

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

Каждый инструмент, зарегистрированный через `api.registerTool(...)`, также
должен быть объявлен в манифесте Plugin:

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

Пользователи включают его через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Опциональные инструменты управляют тем, раскрывается ли инструмент модели.
Используйте [запросы разрешений Plugin](/ru/plugins/plugin-permission-requests),
когда инструмент или hook должен запросить подтверждение после выбора моделью и
до выполнения действия.

Используйте опциональные инструменты для побочных эффектов, необычных бинарных
файлов или возможностей, которые не должны быть раскрыты по умолчанию. Имена
инструментов не должны конфликтовать с core-инструментами; конфликты
пропускаются и отображаются в диагностике Plugin. Некорректные регистрации,
включая дескрипторы инструментов без `parameters`, пропускаются и отображаются
так же. Зарегистрированные инструменты являются типизированными функциями,
которые модель может вызывать после прохождения проверок политик и allowlist.

Фабрики инструментов получают объект контекста, предоставленный runtime.
Используйте `ctx.activeModel`, когда инструменту нужно логировать, отображать
или адаптироваться к активной модели для текущего хода. Объект может включать
`provider`, `modelId` и `modelRef`. Рассматривайте его как информационные
runtime-метаданные, а не как границу безопасности против локального оператора,
кода установленного Plugin или измененного runtime OpenClaw. Чувствительные
локальные инструменты всё равно должны требовать явного согласия Plugin или
оператора и завершаться закрытым отказом, когда метаданные активной модели
отсутствуют или неподходят.

Манифест объявляет владение и обнаружение; выполнение всё равно вызывает
живую зарегистрированную реализацию инструмента. Держите
`toolMetadata.<tool>.optional: true` согласованным с
`api.registerTool(..., { optional: true })`, чтобы OpenClaw мог не загружать
runtime этого Plugin, пока инструмент не будет явно добавлен в allowlist.

## Соглашения об импорте

Импортируйте из специализированных подпутей SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не импортируйте из устаревшего корневого barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Внутри пакета вашего Plugin используйте локальные barrel-файлы, такие как
`api.ts` и `runtime-api.ts`, для внутренних импортов. Не импортируйте собственный
Plugin через путь SDK. Хелперы, специфичные для поставщика, должны оставаться в
пакете поставщика, если граница не является действительно общей.

Пользовательские методы Gateway RPC являются продвинутой точкой входа.
Держите их на префиксе, специфичном для Plugin; core-пространства имен
администрирования, такие как `config.*`, `exec.approvals.*`,
`operator.admin.*`, `wizard.*` и `update.*`, остаются зарезервированными и
разрешаются в `operator.admin`. Мост
`openclaw/plugin-sdk/gateway-method-runtime` зарезервирован для HTTP-маршрутов
Plugin, которые объявляют `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Полную карту импортов см. в [обзоре Plugin SDK](/ru/plugins/sdk-overview).

## Чеклист перед отправкой

<Check>**package.json** содержит корректные метаданные `openclaw`</Check>
<Check>Манифест **openclaw.plugin.json** присутствует и валиден</Check>
<Check>Точка входа использует `defineChannelPluginEntry` или `definePluginEntry`</Check>
<Check>Все импорты используют специализированные пути `plugin-sdk/<subpath>`</Check>
<Check>Внутренние импорты используют локальные модули, а не self-imports SDK</Check>
<Check>Тесты проходят (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходит (Plugins внутри репозитория)</Check>

## Тестирование на beta-релизах

1. Следите за тегами релизов GitHub в [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) и подпишитесь через `Watch` > `Releases`. Beta-теги выглядят как `v2026.3.N-beta.1`. Также можно включить уведомления для официального X-аккаунта OpenClaw [@openclaw](https://x.com/openclaw), чтобы получать объявления о релизах.
2. Протестируйте свой Plugin на beta-теге сразу после его появления. Окно до stable обычно составляет всего несколько часов.
3. После тестирования напишите в ветке своего Plugin в Discord-канале `plugin-forum` либо `all good`, либо что сломалось. Если у вас еще нет ветки, создайте ее.
4. Если что-то сломалось, откройте или обновите issue с заголовком `Beta blocker: <plugin-name> - <summary>` и примените label `beta-blocker`. Добавьте ссылку на issue в свою ветку.
5. Откройте PR в `main` с заголовком `fix(<plugin-id>): beta blocker - <summary>` и свяжите issue как в PR, так и в вашей Discord-ветке. Contributors не могут назначать labels PR, поэтому заголовок является сигналом на стороне PR для maintainers и автоматизации. Blockers с PR будут смержены; blockers без PR могут быть выпущены всё равно. Maintainers следят за этими ветками во время beta-тестирования.
6. Молчание означает зеленый статус. Если вы пропустите окно, ваш fix, скорее всего, попадет в следующий цикл.

## Следующие шаги

<CardGroup cols={2}>
  <Card title="Plugins каналов" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Создайте Plugin канала обмена сообщениями
  </Card>
  <Card title="Plugins поставщиков" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Создайте Plugin поставщика моделей
  </Card>
  <Card title="Plugins CLI-бэкендов" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Зарегистрируйте локальный AI CLI-бэкенд
  </Card>
  <Card title="Обзор SDK" icon="book-open" href="/ru/plugins/sdk-overview">
    Карта импортов и справочник API регистрации
  </Card>
  <Card title="Runtime-хелперы" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, поиск, subagent через api.runtime
  </Card>
  <Card title="Тестирование" icon="test-tubes" href="/ru/plugins/sdk-testing">
    Тестовые утилиты и паттерны
  </Card>
  <Card title="Манифест Plugin" icon="file-json" href="/ru/plugins/manifest">
    Полный справочник схемы манифеста
  </Card>
</CardGroup>

## Связанные материалы

- [Hooks Plugin](/ru/plugins/hooks)
- [Архитектура Plugin](/ru/plugins/architecture)
