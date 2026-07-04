---
doc-schema-version: 1
read_when:
    - Вы хотите создать новый Plugin OpenClaw
    - Вам нужно краткое руководство по началу разработки Plugin
    - Вы выбираете между документацией по каналу, провайдеру, бэкенду CLI, инструменту или хуку
sidebarTitle: Getting Started
summary: Создайте свой первый Plugin OpenClaw за считанные минуты
title: Создание plugins
x-i18n:
    generated_at: "2026-07-04T15:28:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins расширяют OpenClaw без изменения ядра. Plugin может добавить канал
обмена сообщениями, поставщика моделей, локальный CLI-бэкенд, агентский
инструмент, hook, поставщика медиа или другую возможность, принадлежащую Plugin.

Вам не нужно добавлять внешний Plugin в репозиторий OpenClaw. Опубликуйте
пакет в [ClawHub](/ru/clawhub), и пользователи установят его с помощью:

```bash
openclaw plugins install clawhub:<package-name>
```

Спецификации пакетов без префикса во время перехода при запуске по-прежнему
устанавливаются из npm. Используйте префикс `clawhub:`, когда нужно разрешение
через ClawHub.

## Требования

- Используйте Node 22.19+, Node 23.11+ или Node 24+ и менеджер пакетов, например `npm` или `pnpm`.
- Знайте модули TypeScript ESM.
- Для работы со встроенным Plugin внутри репозитория клонируйте репозиторий и выполните `pnpm install`.
  Разработка Plugin из исходного checkout поддерживается только через pnpm,
  потому что OpenClaw загружает встроенные Plugins из workspace-пакетов
  `extensions/*`.

## Выберите форму Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Подключите OpenClaw к платформе обмена сообщениями.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Добавьте поставщика моделей, медиа, поиска, получения данных, речи или realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Запускайте локальный AI CLI через резервный выбор моделей OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ru/plugins/tool-plugins">
    Регистрируйте агентские инструменты.
  </Card>
</CardGroup>

## Быстрый старт

Создайте минимальный tool Plugin, зарегистрировав один обязательный агентский инструмент.
Это самая короткая полезная форма Plugin; она показывает пакет, манифест,
точку входа и локальное подтверждение.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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
    собранные файлы JavaScript. См. [точки входа SDK](/ru/plugins/sdk-entrypoints)
    для полного контракта точки входа.

    Каждому Plugin нужен манифест, даже если у него нет конфигурации. Runtime-инструменты
    должны присутствовать в `contracts.tools`, чтобы OpenClaw мог обнаруживать
    владельца без предварительной загрузки runtime каждого Plugin. Задавайте
    `activation.onStartup` осознанно. Этот пример запускается при старте Gateway.

    Поверхности Plugin, которым доверяет хост, также ограничиваются манифестом и
    требуют явного включения для установленных Plugins. Если установленный Plugin
    регистрирует `api.registerAgentToolResultMiddleware(...)`, объявите каждый
    целевой runtime в `contracts.agentToolResultMiddleware`. Если он регистрирует
    `api.registerTrustedToolPolicy(...)`, объявите каждый идентификатор политики в
    `contracts.trustedToolPolicies`. Эти объявления согласуют проверку при
    установке и регистрацию runtime.

    Все поля манифеста описаны в [манифесте Plugin](/ru/plugins/manifest).

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

    Используйте `definePluginEntry` для Plugins, не являющихся каналами.
    Channel plugins используют `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Для установленного или внешнего Plugin проверьте загруженный runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Если Plugin регистрирует CLI-команду, также выполните эту команду. Например,
    у демонстрационной команды должно быть подтверждение выполнения, такое как
    `openclaw demo-plugin ping`.

    Для встроенного Plugin в этом репозитории OpenClaw обнаруживает пакеты Plugin
    из исходного checkout в workspace `extensions/*`. Запустите ближайший
    целевой тест:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Перед публикацией Plugin, готового как пакет, протестируйте ту же форму
    установки, которую получат пользователи. Сначала добавьте шаг сборки,
    укажите runtime-точки входа, такие как `openclaw.extensions`, на собранный
    JavaScript вроде `./dist/index.js` и убедитесь, что `npm pack` включает
    этот вывод `dist/`. Исходные точки входа TypeScript предназначены только для
    исходных checkout и локальных путей разработки.

    Затем упакуйте Plugin и установите tarball с `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` использует управляемый OpenClaw npm-проект для каждого Plugin,
    поэтому он выявляет ошибки runtime-зависимостей, которые может скрыть
    тестирование исходного checkout. Он подтверждает форму пакета и зависимостей,
    а не связанную с каталогом официальную доверенность. Runtime-импорты должны
    находиться в `dependencies` или `optionalDependencies`; зависимости, оставленные
    только в `devDependencies`, не будут установлены для управляемого runtime-проекта.

    Не используйте установку из raw-архива или пути как финальное подтверждение
    для официального или привилегированного поведения Plugin. Raw-исходники полезны
    для локальной отладки, но они не подтверждают тот же путь зависимостей, что
    установки из npm или ClawHub. Если ваш Plugin зависит от доверенного статуса
    официального Plugin, добавьте второе подтверждение через официальную установку
    на основе каталога или путь опубликованного пакета, который фиксирует
    официальную доверенность. Подробности о корне установки и владении зависимостями
    см. в [разрешении зависимостей Plugin](/ru/plugins/dependency-resolution).

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

Инструменты могут быть обязательными или необязательными. Обязательные инструменты
всегда доступны, когда Plugin включен. Необязательные инструменты требуют
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

Каждый инструмент, зарегистрированный с помощью `api.registerTool(...)`, также
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

Пользователи включают их через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Необязательные инструменты управляют тем, будет ли инструмент открыт для модели.
Используйте [запросы разрешений Plugin](/ru/plugins/plugin-permission-requests),
когда инструмент или hook должен запросить одобрение после того, как модель его
выбрала, и до запуска действия.

Используйте необязательные инструменты для побочных эффектов, необычных бинарных
файлов или возможностей, которые не должны открываться по умолчанию. Имена
инструментов не должны конфликтовать с инструментами ядра; конфликты пропускаются
и отображаются в диагностике Plugin. Некорректные регистрации, включая дескрипторы
инструментов без `parameters`, пропускаются и отображаются таким же образом.
Зарегистрированные инструменты являются типизированными функциями, которые модель
может вызывать после прохождения проверок политики и allowlist.

Фабрики инструментов получают объект контекста, предоставленный runtime. Используйте
`ctx.activeModel`, когда инструменту нужно логировать, отображать или адаптироваться
к активной модели текущего turn. Объект может включать `provider`, `modelId` и
`modelRef`. Рассматривайте его как информационные runtime-метаданные, а не как
границу безопасности против локального оператора, установленного кода Plugin или
измененного runtime OpenClaw. Чувствительные локальные инструменты по-прежнему
должны требовать явного согласия Plugin или оператора и завершаться закрыто, если
метаданные активной модели отсутствуют или не подходят.

Манифест объявляет владение и обнаружение; выполнение по-прежнему вызывает
живую зарегистрированную реализацию инструмента. Держите
`toolMetadata.<tool>.optional: true` согласованным с
`api.registerTool(..., { optional: true })`, чтобы OpenClaw мог не загружать
runtime этого Plugin до тех пор, пока инструмент не будет явно добавлен в allowlist.

## Соглашения об импортах

Импортируйте из сфокусированных подпутей SDK:

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
Plugin через путь SDK. Помощники, специфичные для поставщика, должны оставаться
в пакете поставщика, если граница не является действительно общей.

Пользовательские методы Gateway RPC являются продвинутой точкой входа. Держите
их на префиксе, специфичном для Plugin; пространства имен администрирования ядра,
такие как `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` и
`update.*`, остаются зарезервированными и разрешаются в `operator.admin`.
Мост `openclaw/plugin-sdk/gateway-method-runtime` зарезервирован для HTTP-маршрутов
Plugin, которые объявляют `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Полную карту импортов см. в [обзоре Plugin SDK](/ru/plugins/sdk-overview).

## Контрольный список перед отправкой

<Check>**package.json** содержит корректные метаданные `openclaw`</Check>
<Check>Манифест **openclaw.plugin.json** присутствует и валиден</Check>
<Check>Точка входа использует `defineChannelPluginEntry` или `definePluginEntry`</Check>
<Check>Все импорты используют сфокусированные пути `plugin-sdk/<subpath>`</Check>
<Check>Внутренние импорты используют локальные модули, а не self-imports SDK</Check>
<Check>Тесты проходят (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходит (Plugins внутри репозитория)</Check>

## Тестирование на beta-релизах

1. Следите за тегами релизов GitHub в [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) и подпишитесь через `Watch` > `Releases`. Бета-теги выглядят как `v2026.3.N-beta.1`. Вы также можете включить уведомления для официального аккаунта OpenClaw в X [@openclaw](https://x.com/openclaw), чтобы получать объявления о релизах.
2. Протестируйте свой plugin с бета-тегом сразу после его появления. Окно до стабильного релиза обычно длится всего несколько часов.
3. После тестирования напишите в ветке своего plugin в канале Discord `plugin-forum`: либо `all good`, либо что сломалось. Если у вас еще нет ветки, создайте ее.
4. Если что-то сломалось, откройте или обновите issue с заголовком `Beta blocker: <plugin-name> - <summary>` и примените метку `beta-blocker`. Добавьте ссылку на issue в свою ветку.
5. Откройте PR в `main` с заголовком `fix(<plugin-id>): beta blocker - <summary>` и добавьте ссылку на issue как в PR, так и в своей ветке Discord. Участники не могут назначать метки PR, поэтому заголовок служит сигналом на стороне PR для сопровождающих и автоматизации. Блокеры с PR будут смержены; блокеры без PR все равно могут попасть в релиз. Сопровождающие следят за этими ветками во время бета-тестирования.
6. Молчание означает зеленый статус. Если вы пропустите окно, ваш фикс, скорее всего, попадет в следующий цикл.

## Следующие шаги

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Создайте plugin канала обмена сообщениями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Создайте plugin поставщика моделей
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Зарегистрируйте локальный бэкенд AI CLI
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ru/plugins/sdk-overview">
    Справочник по карте импортов и API регистрации
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, поиск, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ru/plugins/sdk-testing">
    Тестовые утилиты и паттерны
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ru/plugins/manifest">
    Полный справочник по схеме манифеста
  </Card>
</CardGroup>

## Связанные материалы

- [Хуки plugin](/ru/plugins/hooks)
- [Архитектура plugin](/ru/plugins/architecture)
