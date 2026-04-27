---
read_when:
    - Ви хочете встановити бандл, сумісний із Codex, Claude або Cursor
    - Вам потрібно зрозуміти, як OpenClaw зіставляє вміст бандла з нативними функціями
    - Ви налагоджуєте виявлення бандла або відсутні можливості
summary: Встановлення та використання бандлів Codex, Claude і Cursor як Plugin OpenClaw
title: Бандли Plugin
x-i18n:
    generated_at: "2026-04-27T12:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d8dcd6eae5e740c27429454a7396332f1bd3b16c0a4e939321d047b5e2e4ff7
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw може встановлювати Plugin із трьох зовнішніх екосистем: **Codex**, **Claude**
та **Cursor**. Вони називаються **бандлами** — це пакети вмісту й метаданих, які
OpenClaw зіставляє з нативними можливостями, такими як Skills, hooks і MCP tools.

<Info>
  Бандли **не** є тим самим, що й нативні Plugin OpenClaw. Нативні Plugin працюють
  у процесі та можуть реєструвати будь-які можливості. Бандли — це пакети вмісту з
  вибірковим зіставленням можливостей і вужчою межею довіри.
</Info>

## Навіщо існують бандли

Багато корисних Plugin публікуються у форматі Codex, Claude або Cursor. Замість
того щоб змушувати авторів переписувати їх як нативні Plugin OpenClaw, OpenClaw
визначає ці формати й зіставляє підтримуваний вміст із нативним набором
можливостей. Це означає, що ви можете встановити пакет команд Claude або бандл Skills Codex
і одразу використовувати його.

## Встановлення бандла

<Steps>
  <Step title="Встановіть із каталогу, архіву або marketplace">
    ```bash
    # Локальний каталог
    openclaw plugins install ./my-bundle

    # Архів
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Перевірте виявлення">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Бандли відображаються як `Format: bundle` з підтипом `codex`, `claude` або `cursor`.

  </Step>

  <Step title="Перезапустіть і використовуйте">
    ```bash
    openclaw gateway restart
    ```

    Зіставлені можливості (Skills, hooks, MCP tools, значення LSP за замовчуванням) будуть доступні в наступній сесії.

  </Step>
</Steps>

## Що OpenClaw зіставляє з бандлів

Сьогодні в OpenClaw працює не кожна можливість бандлів. Ось що працює і що
визначається, але ще не підключене.

### Підтримується зараз

| Можливість    | Як зіставляється                                                                            | Застосовується до |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| Вміст Skills  | Корені Skills бандла завантажуються як звичайні Skills OpenClaw                             | Усі формати       |
| Команди       | `commands/` і `.cursor/commands/` обробляються як корені Skills                             | Claude, Cursor    |
| Пакети hooks  | Макети `HOOK.md` + `handler.ts` у стилі OpenClaw                                            | Codex             |
| MCP tools     | Конфігурація MCP бандла об’єднується з вбудованими налаштуваннями Pi; підтримувані stdio- і HTTP-сервери завантажуються | Усі формати |
| LSP-сервери   | Claude `.lsp.json` і оголошені в manifest `lspServers` об’єднуються з вбудованими значеннями LSP Pi за замовчуванням | Claude |
| Налаштування  | Claude `settings.json` імпортується як вбудовані значення Pi за замовчуванням               | Claude            |

#### Вміст Skills

- корені Skills бандла завантажуються як звичайні корені Skills OpenClaw
- корені Claude `commands` обробляються як додаткові корені Skills
- корені Cursor `.cursor/commands` обробляються як додаткові корені Skills

Це означає, що markdown-файли команд Claude працюють через звичайний завантажувач Skills OpenClaw.
Markdown-команди Cursor працюють тим самим шляхом.

#### Пакети hooks

- корені hooks бандла працюють **лише** тоді, коли вони використовують звичайний
  макет пакетів hooks OpenClaw. Сьогодні це насамперед випадок, сумісний із Codex:
  - `HOOK.md`
  - `handler.ts` або `handler.js`

#### MCP для Pi

- увімкнені бандли можуть додавати конфігурацію MCP-серверів
- OpenClaw об’єднує конфігурацію MCP бандла з effective вбудованими налаштуваннями Pi як
  `mcpServers`
- OpenClaw відкриває підтримувані MCP tools бандла під час ходів агента вбудованого Pi,
  запускаючи stdio-сервери або підключаючись до HTTP-серверів
- профілі інструментів `coding` і `messaging` за замовчуванням включають MCP tools бандлів; використовуйте `tools.deny: ["bundle-mcp"]`, щоб вимкнути це для агента або gateway
- локальні налаштування Pi для проєкту й далі застосовуються після значень бандла за замовчуванням, тож налаштування робочого простору можуть за потреби перевизначати записи MCP бандла
- каталоги MCP tools бандла сортуються детерміновано перед реєстрацією, тож зміни upstream-порядку `listTools()` не розхитують блоки tools у prompt cache

##### Транспорти

MCP-сервери можуть використовувати stdio або HTTP transport:

**Stdio** запускає дочірній процес:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** підключається до вже запущеного MCP-сервера через `sse` за замовчуванням або через `streamable-http`, якщо це запитано:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` можна задати як `"streamable-http"` або `"sse"`; якщо не задано, OpenClaw використовує `sse`
- `type: "http"` — це downstream-форма, нативна для CLI; у конфігурації OpenClaw використовуйте `transport: "streamable-http"`. `openclaw mcp set` і `openclaw doctor --fix` нормалізують цей поширений псевдонім.
- дозволені лише схеми URL `http:` і `https:`
- значення `headers` підтримують підстановку `${ENV_VAR}`
- запис сервера, що містить одночасно `command` і `url`, відхиляється
- облікові дані URL (userinfo і query params) редагуються в описах tools
  і журналах
- `connectionTimeoutMs` перевизначає тайм-аут підключення за замовчуванням у 30 секунд для
  transport stdio і HTTP

##### Іменування tools

OpenClaw реєструє MCP tools бандлів із безпечними для provider іменами у форматі
`serverName__toolName`. Наприклад, сервер із ключем `"vigil-harbor"`, який відкриває
tool `memory_search`, реєструється як `vigil-harbor__memory_search`.

- символи поза межами `A-Za-z0-9_-` замінюються на `-`
- префікси серверів обмежуються 30 символами
- повні назви tools обмежуються 64 символами
- порожні назви серверів замінюються на `mcp`
- конфліктні санітизовані назви розрізняються числовими суфіксами
- фінальний порядок відкритих tools є детермінованим за безпечним ім’ям, щоб повторні
  ходи Pi залишалися стабільними для cache
- фільтрація профілю розглядає всі tools з одного MCP-сервера бандла як такі, що належать Plugin
  `bundle-mcp`, тож allowlist і deny list профілів можуть включати або
  окремі відкриті назви tools, або ключ Plugin `bundle-mcp`

#### Вбудовані налаштування Pi

- Claude `settings.json` імпортується як стандартні вбудовані налаштування Pi, коли
  бандл увімкнено
- OpenClaw санітизує ключі перевизначення shell перед застосуванням

Санітизовані ключі:

- `shellPath`
- `shellCommandPrefix`

#### Вбудований LSP Pi

- увімкнені бандли Claude можуть додавати конфігурацію LSP-серверів
- OpenClaw завантажує `.lsp.json` плюс усі шляхи `lspServers`, оголошені в manifest
- конфігурація LSP бандла об’єднується з effective вбудованими значеннями LSP Pi за замовчуванням
- сьогодні можна запускати лише підтримувані LSP-сервери на основі stdio; transport, які не підтримуються,
  усе одно відображаються в `openclaw plugins inspect <id>`

### Визначається, але не виконується

Ці елементи розпізнаються та відображаються в діагностиці, але OpenClaw їх не запускає:

- Claude `agents`, автоматизація `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- вбудовані метадані/метадані застосунку Codex поза звітуванням про можливості

## Формати бандлів

<AccordionGroup>
  <Accordion title="Бандли Codex">
    Маркери: `.codex-plugin/plugin.json`

    Необов’язковий вміст: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Бандли Codex найкраще підходять для OpenClaw, коли вони використовують корені Skills і каталоги пакетів hooks у стилі OpenClaw
    (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Бандли Claude">
    Два режими виявлення:

    - **На основі manifest:** `.claude-plugin/plugin.json`
    - **Без manifest:** стандартний макет Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Поведінка, специфічна для Claude:

    - `commands/` обробляється як вміст Skills
    - `settings.json` імпортується у вбудовані налаштування Pi (ключі перевизначення shell санітизуються)
    - `.mcp.json` відкриває підтримувані stdio-tools для вбудованого Pi
    - `.lsp.json` плюс оголошені в manifest шляхи `lspServers` завантажуються у вбудовані значення LSP Pi за замовчуванням
    - `hooks/hooks.json` визначається, але не виконується
    - Власні шляхи компонентів у manifest є адитивними (вони розширюють значення за замовчуванням, а не замінюють їх)

  </Accordion>

  <Accordion title="Бандли Cursor">
    Маркери: `.cursor-plugin/plugin.json`

    Необов’язковий вміст: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` обробляється як вміст Skills
    - `.cursor/rules/`, `.cursor/agents/` і `.cursor/hooks.json` лише визначаються

  </Accordion>
</AccordionGroup>

## Пріоритет виявлення

OpenClaw спочатку перевіряє формат нативного Plugin:

1. `openclaw.plugin.json` або дійсний `package.json` з `openclaw.extensions` — обробляється як **нативний Plugin**
2. Маркери бандлів (`.codex-plugin/`, `.claude-plugin/` або стандартний макет Claude/Cursor) — обробляються як **бандл**

Якщо каталог містить обидва варіанти, OpenClaw використовує нативний шлях. Це запобігає
частковому встановленню пакетів із подвійним форматом як бандлів.

## Runtime-залежності та очищення

- Runtime-залежності bundled Plugin постачаються всередині пакета OpenClaw у
  `dist/*`. OpenClaw **не** запускає `npm install` під час старту для bundled
  Plugin; pipeline випуску відповідає за постачання повного bundled
  payload залежностей (див. правило перевірки після публікації в
  [Releasing](/uk/reference/RELEASING)).

## Безпека

Бандли мають вужчу межу довіри, ніж нативні Plugin:

- OpenClaw **не** завантажує довільні runtime-модулі бандлів у процес
- Шляхи Skills і пакетів hooks мають залишатися всередині кореня Plugin (перевірка меж)
- Файли налаштувань читаються з тими самими перевірками меж
- Підтримувані stdio MCP-сервери можуть запускатися як підпроцеси

Завдяки цьому бандли безпечніші за замовчуванням, але вам усе одно слід ставитися до сторонніх
бандлів як до довіреного вмісту для тих можливостей, які вони все ж відкривають.

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бандл визначається, але можливості не працюють">
    Виконайте `openclaw plugins inspect <id>`. Якщо можливість перелічена, але позначена
    як not wired, це обмеження продукту, а не зламане встановлення.
  </Accordion>

  <Accordion title="Файли команд Claude не з’являються">
    Переконайтеся, що бандл увімкнено, а markdown-файли розташовані всередині виявленого
    кореня `commands/` або `skills/`.
  </Accordion>

  <Accordion title="Налаштування Claude не застосовуються">
    Підтримуються лише вбудовані налаштування Pi з `settings.json`. OpenClaw не
    розглядає налаштування бандла як сирі патчі конфігурації.
  </Accordion>

  <Accordion title="Hooks Claude не виконуються">
    `hooks/hooks.json` лише визначається. Якщо вам потрібні hooks, які можна виконувати, використовуйте
    макет пакетів hooks OpenClaw або постачайте нативний Plugin.
  </Accordion>
</AccordionGroup>

## Пов’язані теми

- [Встановлення та налаштування Plugin](/uk/tools/plugin)
- [Створення Plugin](/uk/plugins/building-plugins) — створіть нативний Plugin
- [Маніфест Plugin](/uk/plugins/manifest) — схема нативного manifest
