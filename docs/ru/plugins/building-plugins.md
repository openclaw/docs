---
doc-schema-version: 1
read_when:
    - Вы хотите создать новый плагин OpenClaw
    - Вам нужно краткое руководство по разработке плагинов
    - Вы выбираете между документацией по каналу, провайдеру, бэкенду CLI, инструменту или хуку
sidebarTitle: Getting Started
summary: Создайте свой первый плагин OpenClaw за несколько минут
title: Создание плагинов
x-i18n:
    generated_at: "2026-07-13T18:19:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагины расширяют OpenClaw без изменения ядра. Плагин может добавить канал
обмена сообщениями, провайдера моделей, локальный бэкенд CLI, инструмент агента, хук, медиапровайдера
или другую возможность, принадлежащую плагину.

Внешний плагин не нужно добавлять в репозиторий OpenClaw. Опубликуйте
пакет в [ClawHub](/clawhub), после чего пользователи смогут установить его командой:

```bash
openclaw plugins install clawhub:<package-name>
```

Во время перехода при запуске спецификации пакетов без префикса по-прежнему устанавливаются из npm. Используйте
префикс `clawhub:`, если требуется разрешение через ClawHub.

## Требования

- Node 22.22.3+, Node 24.15+ или Node 25.9+, а также `npm` или `pnpm`.
- Модули TypeScript ESM.
- Для работы со встроенным плагином внутри репозитория клонируйте репозиторий и выполните `pnpm install`.
  Разработка плагинов из исходного кода поддерживает только pnpm, поскольку OpenClaw обнаруживает
  встроенные плагины среди пакетов рабочей области `extensions/*`.

## Выберите тип плагина

<CardGroup cols={2}>
  <Card title="Плагин канала" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Подключите OpenClaw к платформе обмена сообщениями.
  </Card>
  <Card title="Плагин провайдера" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Добавьте провайдера моделей, мультимедиа, поиска, загрузки данных, речи или взаимодействия в реальном времени.
  </Card>
  <Card title="Плагин бэкенда CLI" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Запускайте локальный CLI для ИИ через резервный механизм моделей OpenClaw.
  </Card>
  <Card title="Плагин инструментов" icon="wrench" href="/ru/plugins/tool-plugins">
    Регистрируйте инструменты агента.
  </Card>
</CardGroup>

## Быстрый старт

Создайте минимальный плагин инструментов, зарегистрировав один обязательный инструмент агента. Это
простейший полезный тип плагина, охватывающий пакет, манифест, точку входа и
локальную проверку.

<Steps>
  <Step title="Создайте метаданные пакета">
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

    Опубликованные внешние плагины должны указывать в качестве исполняемых точек входа собранные файлы JavaScript.
    Полный контракт точки входа см. в разделе [Точки входа SDK](/ru/plugins/sdk-entrypoints).

    Каждому плагину нужен манифест, даже если у него нет конфигурации. Инструменты среды выполнения должны
    быть указаны в `contracts.tools`, чтобы OpenClaw мог определять владельца без
    упреждающей загрузки среды выполнения каждого плагина. Задавайте `activation.onStartup`
    осознанно; в этом примере загрузка происходит при запуске Gateway.

    Доверенные хостом поверхности плагинов также контролируются манифестом и требуют явного
    объявления для установленных плагинов: для `api.registerAgentToolResultMiddleware(...)`
    каждая целевая среда выполнения должна быть указана в `contracts.agentToolResultMiddleware`,
    а для `api.registerTrustedToolPolicy(...)` каждый идентификатор политики должен быть указан в
    `contracts.trustedToolPolicies`. Эти объявления обеспечивают согласованность проверки
    при установке и регистрации во время выполнения.

    Все поля манифеста описаны в разделе [Манифест плагина](/ru/plugins/manifest).

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

    Используйте `definePluginEntry` для плагинов, не являющихся плагинами каналов. Вместо этого плагины каналов используют
    `defineChannelPluginEntry` из `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Протестируйте среду выполнения">
    Для установленного или внешнего плагина проверьте загруженную среду выполнения:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Если плагин регистрирует команду CLI, также выполните эту команду и проверьте
    результат, например `openclaw demo-plugin ping`.

    Для встроенного плагина в этом репозитории OpenClaw обнаруживает пакеты плагинов
    из исходного кода в рабочей области `extensions/*`. Запустите ближайший целевой
    тест:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Протестируйте установку пакета">
    Перед публикацией готового пакета плагина протестируйте тот же способ установки, который получат
    пользователи. Сначала добавьте этап сборки, укажите для исполняемых точек входа, таких как
    `openclaw.extensions`, собранный JavaScript, например `./dist/index.js`, и убедитесь,
    что `npm pack` включает этот результат `dist/`. Точки входа из исходного кода TypeScript
    предназначены только для работы с исходным кодом и локальной разработки.

    Затем упакуйте плагин и установите tar-архив с помощью `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` использует управляемый OpenClaw отдельный npm-проект для каждого плагина, поэтому он выявляет
    ошибки зависимостей среды выполнения, которые могут быть скрыты при тестировании из исходного кода. Он подтверждает
    структуру пакета и зависимостей, но не официальный статус доверия, связанный с каталогом.
    Импорты среды выполнения должны находиться в `dependencies` или `optionalDependencies`;
    зависимости, оставленные только в `devDependencies`, не будут установлены для
    управляемого проекта среды выполнения.

    Не используйте установку непосредственно из архива или по пути как окончательное подтверждение официального или
    привилегированного поведения плагина. Исходный код полезен для локальной отладки, но
    он не подтверждает тот же путь разрешения зависимостей, что и установка из npm или ClawHub. Если
    ваш плагин зависит от доверенного статуса официального плагина, добавьте вторую проверку
    посредством официальной установки из каталога или пути опубликованного пакета, который
    фиксирует официальный статус доверия. Подробности о корне установки и владельце зависимостей
    см. в разделе [Разрешение зависимостей плагинов](/ru/plugins/dependency-resolution).

  </Step>

  <Step title="Опубликуйте">
    Проверьте пакет перед публикацией:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонические фрагменты пакетов ClawHub находятся в `docs/snippets/plugin-publish/`.

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

Инструменты могут быть обязательными или необязательными. Обязательные инструменты всегда доступны, когда
плагин включен. Необязательные инструменты требуют явного согласия пользователя, прежде чем OpenClaw
загрузит среду выполнения плагина-владельца.

Фабрики инструментов получают доверенный контекст среды выполнения, включая `deliveryContext`,
`nativeChannelId` для активного диалога на платформе, если он доступен, и
`requesterSenderId`.

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

Каждый инструмент, зарегистрированный с помощью `api.registerTool(...)`, также должен быть объявлен в
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

Пользователи включают их с помощью `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Необязательные инструменты определяют, предоставляется ли инструмент модели. Используйте
[запросы разрешений плагина](/ru/plugins/plugin-permission-requests), если инструмент
или хук должен запросить подтверждение после выбора моделью, но до
выполнения действия.

Используйте необязательные инструменты для побочных эффектов, нестандартных исполняемых файлов или возможностей, которые
не должны предоставляться по умолчанию. Имена инструментов не должны конфликтовать с именами инструментов
ядра; конфликтующие регистрации пропускаются и отображаются в диагностике плагинов. Некорректные
регистрации пропускаются и отображаются аналогичным образом: отсутствующий непустой
`name`, значение `execute`, не являющееся функцией, или дескриптор инструмента без объекта `parameters`.

Фабрики инструментов получают объект контекста, предоставляемый средой выполнения. Используйте `ctx.activeModel`,
если инструменту требуется регистрировать в журнале, отображать или адаптировать активную модель для текущего
хода; он может включать `provider`, `modelId` и `modelRef`. Рассматривайте его как
информационные метаданные среды выполнения, а не как границу безопасности от локального
оператора, кода установленного плагина или измененной среды выполнения OpenClaw. Для конфиденциальных
локальных инструментов по-прежнему следует требовать явного включения плагином или оператором и
отказывать в выполнении, если метаданные активной модели отсутствуют или непригодны.

Манифест объявляет владельца и обеспечивает обнаружение; при выполнении по-прежнему вызывается актуальная
зарегистрированная реализация инструмента. Поддерживайте соответствие `toolMetadata.<tool>.optional: true`
и `api.registerTool(..., { optional: true })`, чтобы OpenClaw мог не
загружать среду выполнения этого плагина, пока инструмент явно не будет добавлен в список разрешенных.

## Соглашения об импортах

Импортируйте из специализированных подпутей SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не импортируйте из устаревшего корневого barrel-файла:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Внутри пакета плагина используйте локальные barrel-файлы, например `api.ts` и
`runtime-api.ts`, для внутренних импортов. Не импортируйте собственный плагин через
путь SDK. Вспомогательные средства конкретного провайдера должны оставаться в пакете провайдера, если только
интерфейс не является действительно универсальным.

Пользовательские методы RPC Gateway — это расширенная точка входа. Используйте для них
префикс, относящийся к конкретному плагину; административные пространства имен ядра, такие как `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` и `update.*`, остаются зарезервированными
и разрешаются в `operator.admin`. Мост
`openclaw/plugin-sdk/gateway-method-runtime` зарезервирован для HTTP-маршрутов
плагинов, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Полную карту импортов см. в разделе [Обзор SDK плагинов](/ru/plugins/sdk-overview).

## Контрольный список перед отправкой

<Check>В **package.json** указаны правильные метаданные `openclaw`</Check>
<Check>Манифест **openclaw.plugin.json** присутствует и корректен</Check>
<Check>Точка входа использует `defineChannelPluginEntry` или `definePluginEntry`</Check>
<Check>Все импорты используют специализированные пути `plugin-sdk/<subpath>`</Check>
<Check>Внутренние импорты используют локальные модули, а не самоимпорты SDK</Check>
<Check>Тесты проходят (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>Проверка `pnpm check` проходит (для плагинов внутри репозитория)</Check>

## Тестирование с бета-версиями

1. Следите за выпусками [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Бета-теги выглядят как `v2026.3.N-beta.1`. Также можно подписаться на [@openclaw](https://x.com/openclaw) в X, чтобы получать объявления о выпусках.
2. Протестируйте свой плагин с бета-тегом сразу после его появления. До стабильного выпуска обычно остаётся всего несколько часов.
3. После тестирования напишите в ветке своего плагина в канале Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), указав либо `all good`, либо описание возникшей неполадки. Если ветки ещё нет, создайте её.
4. Если что-то не работает, создайте или обновите задачу с заголовком `Beta blocker: <plugin-name> - <summary>` и назначьте метку `beta-blocker`. Добавьте ссылку на задачу в свою ветку.
5. Откройте PR в `main` с заголовком `fix(<plugin-id>): beta blocker - <summary>` и добавьте ссылку на задачу как в PR, так и в свою ветку Discord. Участники не могут назначать метки PR, поэтому заголовок служит сигналом для сопровождающих и автоматизации со стороны PR. Блокирующие проблемы с PR будут исправлены до выпуска; без PR выпуск может состояться несмотря на них.
6. Отсутствие сообщений означает, что всё работает. Если пропустить это окно, исправление обычно попадёт в следующий цикл.

## Дальнейшие действия

<CardGroup cols={2}>
  <Card title="Плагины каналов" icon="messages-square" href="/ru/plugins/sdk-channel-plugins">
    Создайте плагин канала обмена сообщениями
  </Card>
  <Card title="Плагины провайдеров" icon="cpu" href="/ru/plugins/sdk-provider-plugins">
    Создайте плагин провайдера моделей
  </Card>
  <Card title="Плагины бэкендов CLI" icon="terminal" href="/ru/plugins/cli-backend-plugins">
    Зарегистрируйте локальный бэкенд CLI для ИИ
  </Card>
  <Card title="Обзор SDK" icon="book-open" href="/ru/plugins/sdk-overview">
    Справочник по карте импорта и API регистрации
  </Card>
  <Card title="Вспомогательные средства среды выполнения" icon="settings" href="/ru/plugins/sdk-runtime">
    TTS, поиск и субагент через api.runtime
  </Card>
  <Card title="Тестирование" icon="test-tubes" href="/ru/plugins/sdk-testing">
    Утилиты и шаблоны тестирования
  </Card>
  <Card title="Манифест плагина" icon="file-json" href="/ru/plugins/manifest">
    Полный справочник по схеме манифеста
  </Card>
</CardGroup>

## Связанные материалы

- [Перехватчики плагинов](/ru/plugins/hooks)
- [Архитектура плагинов](/ru/plugins/architecture)
