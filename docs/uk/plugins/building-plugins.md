---
doc-schema-version: 1
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен короткий посібник із розробки плагінів
    - Ви обираєте між документацією щодо каналів, провайдерів, бекендів CLI, інструментів або хуків
sidebarTitle: Getting Started
summary: Створіть свій перший плагін OpenClaw за лічені хвилини
title: Створення плагінів
x-i18n:
    generated_at: "2026-07-12T13:29:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw без зміни ядра. Plugin може додати канал обміну
повідомленнями, постачальника моделей, локальний бекенд CLI, інструмент агента, хук, постачальника медіа
або іншу можливість, що належить Plugin.

Вам не потрібно додавати зовнішній Plugin до репозиторію OpenClaw. Опублікуйте
пакет у [ClawHub](/clawhub), після чого користувачі зможуть установити його так:

```bash
openclaw plugins install clawhub:<package-name>
```

Специфікації пакетів без префікса під час перехідного періоду запуску все ще встановлюються з npm. Використовуйте
префікс `clawhub:`, коли потрібне розв’язання через ClawHub.

## Вимоги

- Node 22.19+, Node 23.11+ або Node 24+, а також `npm` чи `pnpm`.
- Модулі TypeScript ESM.
- Для роботи над вбудованим Plugin у репозиторії клонуйте репозиторій і виконайте `pnpm install`.
  Розроблення Plugin із вихідного коду можливе лише з pnpm, оскільки OpenClaw виявляє
  вбудовані Plugins серед пакетів робочого простору `extensions/*`.

## Виберіть тип Plugin

<CardGroup cols={2}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями.
  </Card>
  <Card title="Plugin постачальника" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей, медіа, пошуку, отримання даних, мовлення або взаємодії в реальному часі.
  </Card>
  <Card title="Plugin бекенду CLI" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Запускайте локальний CLI ШІ через резервний вибір моделі OpenClaw.
  </Card>
  <Card title="Plugin інструментів" icon="wrench" href="/uk/plugins/tool-plugins">
    Зареєструйте інструменти агента.
  </Card>
</CardGroup>

## Швидкий початок

Створіть мінімальний Plugin інструментів, зареєструвавши один обов’язковий інструмент агента. Це
найкоротший корисний тип Plugin, який охоплює пакет, маніфест, точку входу та
локальну перевірку.

<Steps>
  <Step title="Створіть метадані пакета">
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

    Опубліковані зовнішні Plugins мають спрямовувати записи середовища виконання на зібрані файли JavaScript.
    Повний контракт точки входу наведено в розділі [Точки входу SDK](/uk/plugins/sdk-entrypoints).

    Кожному Plugin потрібен маніфест, навіть за відсутності конфігурації. Інструменти середовища виконання мають
    бути вказані в `contracts.tools`, щоб OpenClaw міг визначати їхнього власника без
    завчасного завантаження середовища виконання кожного Plugin. Задавайте `activation.onStartup`
    свідомо; у цьому прикладі Plugin завантажується під час запуску Gateway.

    Довірені хостом поверхні Plugin також обмежуються маніфестом і потребують явного
    оголошення для встановлених Plugins: для `api.registerAgentToolResultMiddleware(...)`
    кожне цільове середовище виконання має бути зазначене в `contracts.agentToolResultMiddleware`,
    а для `api.registerTrustedToolPolicy(...)` кожен ідентифікатор політики має бути вказаний у
    `contracts.trustedToolPolicies`. Ці оголошення узгоджують перевірку під час
    установлення з реєстрацією в середовищі виконання.

    Опис усіх полів маніфесту дивіться в розділі [Маніфест Plugin](/uk/plugins/manifest).

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

    Якщо Plugin реєструє команду CLI, також запустіть цю команду та перевірте
    результат, наприклад `openclaw demo-plugin ping`.

    Для вбудованого Plugin у цьому репозиторії OpenClaw виявляє пакети Plugin із вихідного коду
    в робочому просторі `extensions/*`. Запустіть найближчий цільовий
    тест:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Перевірте встановлення пакета">
    Перед публікацією готового до пакування Plugin перевірте той самий спосіб установлення, який отримають
    користувачі. Спершу додайте крок збирання, спрямуйте записи середовища виконання, як-от
    `openclaw.extensions`, на зібраний JavaScript, наприклад `./dist/index.js`, і
    переконайтеся, що `npm pack` включає цей вивід `dist/`. Точки входу у вихідному коді TypeScript
    призначені лише для робочих копій вихідного коду та шляхів локального розроблення.

    Потім запакуйте Plugin і встановіть tar-архів за допомогою `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` використовує керований OpenClaw окремий npm-проєкт для кожного Plugin, тому виявляє
    помилки залежностей середовища виконання, які може приховати тестування робочої копії вихідного коду. Це підтверджує
    структуру пакета й залежностей, але не офіційний рівень довіри, пов’язаний із каталогом.
    Імпортовані в середовищі виконання пакети мають бути в `dependencies` або `optionalDependencies`;
    залежності, залишені лише в `devDependencies`, не буде встановлено для
    керованого проєкту середовища виконання.

    Не використовуйте встановлення з необробленого архіву або шляху як остаточне підтвердження офіційної чи
    привілейованої поведінки Plugin. Необроблені вихідні файли корисні для локального налагодження, але
    вони не підтверджують той самий шлях залежностей, що й установлення через npm або ClawHub. Якщо
    ваш Plugin покладається на довірений статус офіційного Plugin, додайте другу перевірку
    через офіційне встановлення з каталогу або шлях опублікованого пакета, який
    фіксує офіційний рівень довіри. Докладні відомості про
    корінь установлення та володіння залежностями дивіться в розділі
    [Розв’язання залежностей Plugin](/uk/plugins/dependency-resolution).

  </Step>

  <Step title="Опублікуйте">
    Перевірте пакет перед публікацією:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Канонічні фрагменти пакетів ClawHub містяться в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Установіть">
    Установіть опублікований пакет через ClawHub:

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
`nativeChannelId` для активної розмови на платформі, коли він доступний, і
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

Користувачі надають згоду через `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Необов’язкові інструменти визначають, чи буде інструмент доступний моделі. Використовуйте
[запити дозволів Plugin](/uk/plugins/plugin-permission-requests), коли інструмент
або хук має запитати схвалення після того, як модель вибере його, але до
виконання дії.

Використовуйте необов’язкові інструменти для побічних ефектів, нетипових бінарних файлів або можливостей, які
не слід надавати за замовчуванням. Назви інструментів не повинні конфліктувати з назвами основних інструментів;
конфлікти пропускаються та відображаються в діагностиці Plugin. Некоректні
реєстрації пропускаються та відображаються так само: відсутній непорожній
`name`, значення `execute`, що не є функцією, або дескриптор інструмента без об’єкта
`parameters`.

Фабрики інструментів отримують наданий середовищем виконання об’єкт контексту. Використовуйте `ctx.activeModel`,
коли інструменту потрібно журналювати, відображати активну модель поточного
кроку або адаптуватися до неї; він може містити `provider`, `modelId` і `modelRef`. Розглядайте його як
інформаційні метадані середовища виконання, а не межу безпеки проти локального
оператора, коду встановленого Plugin або зміненого середовища виконання OpenClaw. Для чутливих
локальних інструментів усе одно слід вимагати явної згоди на рівні Plugin або оператора й
безпечно відмовляти, якщо метадані активної моделі відсутні або непридатні.

Маніфест оголошує володіння та виявлення; виконання й надалі викликає активну
зареєстровану реалізацію інструмента. Узгоджуйте `toolMetadata.<tool>.optional: true`
з `api.registerTool(..., { optional: true })`, щоб OpenClaw міг не
завантажувати середовище виконання цього Plugin, доки інструмент не буде явно додано до списку дозволених.

## Правила імпорту

Імпортуйте з цільових підшляхів SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Не імпортуйте із застарілого кореневого модуля-агрегатора:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

У пакеті свого Plugin використовуйте локальні файли-агрегатори, як-от `api.ts` і
`runtime-api.ts`, для внутрішніх імпортів. Не імпортуйте власний Plugin через
шлях SDK. Допоміжні засоби, специфічні для постачальника, мають залишатися в пакеті постачальника, якщо
межа взаємодії не є справді універсальною.

Власні методи RPC Gateway — це розширена точка входу. Використовуйте для них
префікс, специфічний для Plugin; основні адміністративні простори імен, як-от `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` і `update.*`, залишаються зарезервованими
та зіставляються з `operator.admin`. Міст
`openclaw/plugin-sdk/gateway-method-runtime` зарезервовано для HTTP-маршрутів Plugin,
які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Повну карту імпортів дивіться в розділі [Огляд SDK Plugin](/uk/plugins/sdk-overview).

## Контрольний список перед надсиланням

<Check>**package.json** містить правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і коректний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugins у репозиторії)</Check>

## Тестування з бета-версіями

1. Відстежуйте випуски [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете стежити за [@openclaw](https://x.com/openclaw) у X, щоб отримувати оголошення про випуски.
2. Протестуйте свій Plugin із бета-тегом одразу після його появи. Період до стабільного випуску зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці свого Plugin у Discord-каналі `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), зазначивши `all good` або описавши, що зламалося. Створіть гілку, якщо її у вас ще немає.
4. Якщо щось зламалося, створіть або оновіть задачу із заголовком `Beta blocker: <plugin-name> - <summary>` і додайте мітку `beta-blocker`. Додайте посилання на задачу у своїй гілці.
5. Відкрийте PR до `main` із заголовком `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на задачу як у PR, так і у своїй гілці Discord. Учасники не можуть додавати мітки до PR, тому заголовок слугує сигналом для супроводжувачів і автоматизації на боці PR. Блокувальні проблеми, для яких є PR, буде об’єднано; проблеми без PR можуть потрапити у випуск без виправлення.
6. Мовчання означає, що все гаразд. Якщо ви пропустите цей період, ваше виправлення зазвичай потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Плагіни каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Плагіни постачальників" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin постачальника моделей
  </Card>
  <Card title="Плагіни серверної частини CLI" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зареєструйте локальну серверну частину CLI для ШІ
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник із карти імпорту та API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук і субагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти й шаблони тестування
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язані матеріали

- [Хуки Plugin](/uk/plugins/hooks)
- [Архітектура Plugin](/uk/plugins/architecture)
