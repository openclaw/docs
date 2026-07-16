---
doc-schema-version: 1
read_when:
    - Ви хочете створити новий плагін OpenClaw
    - Вам потрібен короткий посібник із розробки плагінів
    - Ви вибираєте між документацією каналу, постачальника, бекенду CLI, інструмента або хука
sidebarTitle: Getting Started
summary: Створіть свій перший плагін OpenClaw за лічені хвилини
title: Створення плагінів
x-i18n:
    generated_at: "2026-07-16T18:14:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw без змін у ядрі. Plugin може додати канал обміну
повідомленнями, постачальника моделей, локальний серверний модуль CLI, інструмент агента, хук, постачальника медіа
або іншу можливість, що належить Plugin.

Не потрібно додавати зовнішній Plugin до репозиторію OpenClaw. Опублікуйте
пакунок у [ClawHub](/clawhub), і користувачі встановлять його за допомогою:

```bash
openclaw plugins install clawhub:<package-name>
```

Під час перехідного періоду запуску специфікації пакунків без префікса й далі встановлюються з npm. Використовуйте
префікс `clawhub:`, коли потрібне розв’язання через ClawHub.

## Вимоги

- Node 22.22.3+, Node 24.15+ або Node 25.9+, а також `npm` чи `pnpm`.
- Модулі TypeScript ESM.
- Для роботи з вбудованими в репозиторій Plugin клонуйте репозиторій і виконайте `pnpm install`.
  Розробка Plugin у вихідному коді підтримує лише pnpm, оскільки OpenClaw виявляє
  вбудовані Plugins у пакетах робочого простору `extensions/*`.

## Вибір структури Plugin

<CardGroup cols={2}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключення OpenClaw до платформи обміну повідомленнями.
  </Card>
  <Card title="Plugin постачальника" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додавання постачальника моделей, медіа, пошуку, отримання даних, мовлення або взаємодії в реальному часі.
  </Card>
  <Card title="Plugin серверного модуля CLI" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Запуск локального CLI ШІ через резервний вибір моделі OpenClaw.
  </Card>
  <Card title="Plugin інструменту" icon="wrench" href="/uk/plugins/tool-plugins">
    Реєстрація інструментів агента.
  </Card>
</CardGroup>

## Швидкий початок

Створіть мінімальний Plugin інструменту, зареєструвавши один обов’язковий інструмент агента. Це
найкоротша корисна структура Plugin, що охоплює пакунок, маніфест, точку входу та
локальну перевірку.

<Steps>
  <Step title="Створіть метадані пакунка">
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

    Опубліковані зовнішні Plugins мають спрямовувати точки входу середовища виконання на зібрані файли JavaScript.
    Повний контракт точки входу див. у розділі [Точки входу SDK](/uk/plugins/sdk-entrypoints).

    Кожному Plugin потрібен маніфест, навіть якщо він не має конфігурації. Інструменти середовища виконання мають
    бути вказані в `contracts.tools`, щоб OpenClaw міг визначати їхню належність без
    завчасного завантаження середовища виконання кожного Plugin. Задавайте `activation.onStartup`
    свідомо; у цьому прикладі завантаження відбувається під час запуску Gateway.

    Поверхні Plugin, яким довіряє хост, також обмежуються маніфестом і потребують явного
    оголошення для встановлених Plugins: для `api.registerAgentToolResultMiddleware(...)`
    кожне цільове середовище виконання має бути вказано в `contracts.agentToolResultMiddleware`,
    а для `api.registerTrustedToolPolicy(...)` кожен ідентифікатор політики має бути вказано в
    `contracts.trustedToolPolicies`. Ці оголошення узгоджують перевірку під час
    встановлення з реєстрацією в середовищі виконання.

    Усі поля маніфесту описано в розділі [Маніфест Plugin](/uk/plugins/manifest).

  </Step>

  <Step title="Зареєструйте інструмент">
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

    Використовуйте `definePluginEntry` для Plugins, що не є каналами. Натомість Plugins каналів використовують
    `defineChannelPluginEntry` з `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Перевірте середовище виконання">
    Для встановленого або зовнішнього Plugin перевірте завантажене середовище виконання:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Якщо Plugin реєструє команду CLI, також виконайте цю команду й перевірте
    вивід, наприклад `openclaw demo-plugin ping`.

    Для вбудованого Plugin у цьому репозиторії OpenClaw виявляє пакунки Plugin
    у вихідному коді з робочого простору `extensions/*`. Виконайте найближчий цільовий
    тест:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Перевірте встановлення пакунка">
    Перед публікацією готового до пакування Plugin перевірте ту саму структуру встановлення, яку
    отримають користувачі. Спочатку додайте крок збирання, спрямуйте точки входу середовища виконання, як-от
    `openclaw.extensions`, на зібраний JavaScript, наприклад `./dist/index.js`, і
    переконайтеся, що `npm pack` містить результат `dist/`. Точки входу у вихідному коді TypeScript
    призначені лише для вихідних копій репозиторію та локальних шляхів розробки.

    Потім запакуйте Plugin і встановіть tarball за допомогою `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` використовує керований OpenClaw окремий npm-проєкт для кожного Plugin, тому виявляє
    помилки залежностей середовища виконання, які може приховати тестування вихідної копії. Це підтверджує
    структуру пакунка й залежностей, але не офіційну довіру, пов’язану з каталогом.
    Імпорти середовища виконання мають бути в `dependencies` або `optionalDependencies`;
    залежності, залишені лише в `devDependencies`, не буде встановлено для
    керованого проєкту середовища виконання.

    Не використовуйте встановлення безпосередньо з архіву чи шляху як остаточне підтвердження офіційної або
    привілейованої поведінки Plugin. Вихідні файли корисні для локального налагодження, але
    вони не підтверджують той самий шлях залежностей, що й встановлення з npm або ClawHub. Якщо
    Plugin покладається на довірений статус офіційного Plugin, додайте другу перевірку
    через офіційне встановлення з каталогу або шлях опублікованого пакунка, який
    фіксує офіційну довіру. Докладніше про корінь встановлення та належність залежностей див. у розділі
    [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution).

  </Step>

  <Step title="Опублікуйте">
    Перевірте пакунок перед публікацією:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонічні фрагменти пакунків ClawHub містяться в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Установіть">
    Установіть опублікований пакунок через ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Реєстрація інструментів

Інструменти можуть бути обов’язковими або необов’язковими. Обов’язкові інструменти завжди доступні, коли
Plugin увімкнено. Для необов’язкових інструментів потрібна явна згода користувача, перш ніж OpenClaw
завантажить середовище виконання Plugin-власника.

Фабрики інструментів отримують довірений контекст середовища виконання, зокрема `deliveryContext`,
`nativeChannelId` для активної розмови на платформі, якщо вона доступна, і
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

Кожен інструмент, зареєстрований за допомогою `api.registerTool(...)`, також має бути оголошений у
маніфесті Plugin:

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

Користувачі надають згоду за допомогою `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // або ["my-plugin"] для всіх інструментів одного Plugin
}
```

Необов’язкові інструменти визначають, чи надається інструмент моделі. Використовуйте
[запити дозволів Plugin](/uk/plugins/plugin-permission-requests), коли інструмент
або хук має запитувати схвалення після того, як модель його вибере, але до
виконання дії.

Використовуйте необов’язкові інструменти для побічних ефектів, незвичних бінарних файлів або можливостей, які
не мають бути доступні типово. Назви інструментів не повинні конфліктувати з назвами основних
інструментів; конфліктні реєстрації пропускаються й повідомляються в діагностиці Plugin. Некоректні
реєстрації пропускаються та повідомляються так само: відсутній непорожній
`name`, `execute`, що не є функцією, або дескриптор інструмента без об’єкта `parameters`.

Фабрики інструментів отримують об’єкт контексту, наданий середовищем виконання. Використовуйте `ctx.activeModel`,
коли інструменту потрібно журналювати, показувати або адаптуватися до активної моделі для поточного
ходу; він може містити `provider`, `modelId` та `modelRef`. Сприймайте його як
інформаційні метадані середовища виконання, а не як межу безпеки від локального
оператора, коду встановленого Plugin або зміненого середовища виконання OpenClaw. Чутливі
локальні інструменти все одно мають вимагати явної згоди на рівні Plugin або оператора й
завершуватися відмовою, якщо метадані активної моделі відсутні або непридатні.

Маніфест оголошує належність і виявлення; під час виконання все одно викликається чинна
зареєстрована реалізація інструмента. Узгоджуйте `toolMetadata.<tool>.optional: true`
з `api.registerTool(..., { optional: true })`, щоб OpenClaw міг не
завантажувати середовище виконання цього Plugin, доки інструмент не буде явно додано до списку дозволених.

## Правила імпорту

Імпортуйте зі спеціалізованих підшляхів SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не імпортуйте із застарілого кореневого barrel-файлу:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

У пакунку Plugin використовуйте локальні barrel-файли, як-от `api.ts` та
`runtime-api.ts`, для внутрішніх імпортів. Не імпортуйте власний Plugin через
шлях SDK. Допоміжні засоби, специфічні для постачальника, мають залишатися в пакунку постачальника, якщо
інтерфейс не є справді універсальним.

Власні методи RPC Gateway — це розширена точка входу. Використовуйте для них
префікс, специфічний для Plugin; основні адміністративні простори назв, як-от `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` та `update.*`, залишаються зарезервованими
й повертають `operator.admin`. Міст
`openclaw/plugin-sdk/gateway-method-runtime` зарезервовано для HTTP-маршрутів Plugin,
які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Повну карту імпортів див. у розділі [Огляд SDK Plugin](/uk/plugins/sdk-overview).

## Контрольний список перед поданням

<Check>**package.json** містить правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і дійсний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують спеціалізовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugins у репозиторії)</Check>

## Тестування з бета-версіями

1. Стежте за випусками [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Бета-теги мають вигляд `v2026.3.N-beta.1`. Також можна стежити за [@openclaw](https://x.com/openclaw) у X, щоб отримувати оголошення про випуски.
2. Протестуйте свій плагін із бета-тегом одразу після його появи. Період до стабільного випуску зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого плагіна в Discord-каналі `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), зазначивши `all good` або описавши, що зламалося. Створіть гілку, якщо її ще немає.
4. Якщо щось зламалося, створіть або оновіть проблему із заголовком `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на проблему у своїй гілці.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на проблему як у PR, так і у своїй гілці Discord. Учасники не можуть додавати мітки до PR, тому заголовок слугує сигналом для супровідників і автоматизації з боку PR. Блокувальні проблеми з PR буде об’єднано; блокувальні проблеми без нього можуть потрапити у випуск без виправлення.
6. Відсутність повідомлень означає, що все гаразд. Якщо пропустити цей період, виправлення зазвичай потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Плагіни каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створення плагіна каналу обміну повідомленнями
  </Card>
  <Card title="Плагіни постачальників" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створення плагіна постачальника моделей
  </Card>
  <Card title="Плагіни серверної частини CLI" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Реєстрація локальної серверної частини CLI для ШІ
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник із карти імпортів та API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    Синтез мовлення, пошук і підагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест плагіна" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язані матеріали

- [Хуки плагінів](/uk/plugins/hooks)
- [Архітектура плагінів](/uk/plugins/architecture)
