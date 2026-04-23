---
read_when:
    - Ви хочете встановити пакет, сумісний із Codex, Claude або Cursor
    - Вам потрібно зрозуміти, як OpenClaw відображає вміст пакета у нативні можливості
    - Ви налагоджуєте виявлення пакетів або відсутні можливості
summary: Встановлення й використання пакетів Codex, Claude і Cursor як Plugin-ів OpenClaw
title: Пакети Plugin-ів
x-i18n:
    generated_at: "2026-04-23T21:02:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw може встановлювати Plugin-и з трьох зовнішніх екосистем: **Codex**, **Claude**
і **Cursor**. Вони називаються **пакетами** — це пакети контенту й метаданих, які
OpenClaw відображає у нативні можливості, такі як Skills, hooks і MCP tools.

<Info>
  Пакети **не** є тим самим, що нативні Plugin-и OpenClaw. Нативні Plugin-и працюють
  в одному процесі й можуть реєструвати будь-які можливості. Пакети — це набори контенту з
  вибірковим відображенням можливостей і вужчою межею довіри.
</Info>

## Навіщо існують пакети

Багато корисних Plugin-ів публікуються у форматі Codex, Claude або Cursor. Замість
того, щоб вимагати від авторів переписувати їх як нативні Plugin-и OpenClaw, OpenClaw
визначає ці формати й відображає підтримуваний контент у нативний набір можливостей.
Це означає, що ви можете встановити пакет команд Claude або пакет Skills Codex
і почати використовувати його одразу.

## Встановлення пакета

<Steps>
  <Step title="Встановіть із каталогу, архіву або marketplace">
    ```bash
    # Локальний каталог
    openclaw plugins install ./my-bundle

    # Архів
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Перевірте виявлення">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Пакети показуються як `Format: bundle` із підтипом `codex`, `claude` або `cursor`.

  </Step>

  <Step title="Перезапустіть і використовуйте">
    ```bash
    openclaw gateway restart
    ```

    Відображені можливості (Skills, hooks, MCP tools, типові значення LSP) будуть доступні в наступній session.

  </Step>
</Steps>

## Що OpenClaw відображає з пакетів

Не кожна можливість пакета сьогодні працює в OpenClaw. Ось що працює і що
визначається, але ще не підключено.

### Підтримується зараз

| Можливість    | Як відображається                                                                          | Застосовується до |
| ------------- | ------------------------------------------------------------------------------------------ | ----------------- |
| Контент Skill | Корені Skill із пакета завантажуються як звичайні Skills OpenClaw                          | Усі формати       |
| Commands      | `commands/` і `.cursor/commands/` трактуються як корені Skill                              | Claude, Cursor    |
| Hook packs    | Макети в стилі OpenClaw `HOOK.md` + `handler.ts`                                           | Codex             |
| MCP tools     | Конфігурація MCP з пакета зливається у вбудовані налаштування Pi; завантажуються підтримувані stdio і HTTP server-и | Усі формати |
| LSP server-и  | Claude `.lsp.json` і оголошені в manifest `lspServers` зливаються в типові значення LSP вбудованого Pi | Claude |
| Settings      | Claude `settings.json` імпортується як типові значення вбудованого Pi                      | Claude            |

#### Контент Skill

- корені Skill із пакета завантажуються як звичайні корені Skill OpenClaw
- корені Claude `commands` трактуються як додаткові корені Skill
- корені Cursor `.cursor/commands` трактуються як додаткові корені Skill

Це означає, що markdown-команди Claude працюють через звичайний завантажувач Skill OpenClaw.
Markdown-команди Cursor працюють через той самий шлях.

#### Hook packs

- корені hook із пакета працюють **лише** коли вони використовують звичайний макет
  hook-pack OpenClaw. Сьогодні це переважно випадок сумісності з Codex:
  - `HOOK.md`
  - `handler.ts` або `handler.js`

#### MCP для Pi

- увімкнені пакети можуть додавати конфігурацію MCP server
- OpenClaw зливає конфігурацію MCP з пакета в ефективні налаштування вбудованого Pi як
  `mcpServers`
- OpenClaw показує підтримувані MCP tools із пакета під час ходів агента вбудованого Pi,
  запускаючи stdio-server-и або підключаючись до HTTP-server-ів
- профілі інструментів `coding` і `messaging` типово включають MCP tools з пакета; використовуйте `tools.deny: ["bundle-mcp"]`, щоб відмовитися для агента або gateway
- локальні налаштування Pi для проєкту все ще застосовуються після типових значень пакета, тож налаштування workspace можуть за потреби перевизначати записи MCP з пакета
- каталоги MCP tools з пакета сортуються детерміновано перед реєстрацією, щоб зміни в порядку `listTools()` у джерелі не руйнували блоки інструментів у prompt cache

##### Транспорти

MCP server-и можуть використовувати stdio або HTTP transport:

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

**HTTP** підключається до запущеного MCP server через `sse` типово, або `streamable-http`, коли це запитано:

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

- `transport` можна задати як `"streamable-http"` або `"sse"`; якщо його пропущено, OpenClaw використовує `sse`
- дозволено лише схеми URL `http:` і `https:`
- значення `headers` підтримують інтерполяцію `${ENV_VAR}`
- запис server-а, який містить і `command`, і `url`, відхиляється
- облікові дані в URL (userinfo і query params) редагуються в описах інструментів і логах
- `connectionTimeoutMs` перевизначає типовий timeout підключення 30 секунд для
  transport-ів stdio і HTTP

##### Найменування інструментів

OpenClaw реєструє MCP tools із пакетів із безпечними для provider-ів іменами у формі
`serverName__toolName`. Наприклад, server з ключем `"vigil-harbor"`, який надає
інструмент `memory_search`, реєструється як `vigil-harbor__memory_search`.

- символи поза `A-Za-z0-9_-` замінюються на `-`
- префікси server-ів обмежуються 30 символами
- повні назви інструментів обмежуються 64 символами
- порожні назви server-ів повертаються до `mcp`
- колізії після санітизації розрізняються числовими суфіксами
- фінальний порядок інструментів, що надаються, є детермінованим за безпечним іменем, щоб повторні ходи Pi залишалися стабільними для кешу
- фільтрація профілів трактує всі інструменти з одного MCP server-а пакета як Plugin-и, що належать `bundle-mcp`, тож allowlist і deny list профілів можуть включати або окремі надані назви інструментів, або ключ Plugin-а `bundle-mcp`

#### Налаштування вбудованого Pi

- Claude `settings.json` імпортується як типові налаштування вбудованого Pi, коли
  пакет увімкнений
- OpenClaw очищує ключі перевизначення shell перед застосуванням

Очищені ключі:

- `shellPath`
- `shellCommandPrefix`

#### Вбудований Pi LSP

- увімкнені пакети Claude можуть додавати конфігурацію LSP server
- OpenClaw завантажує `.lsp.json`, а також будь-які шляхи `lspServers`, оголошені в manifest
- конфігурація LSP з пакета зливається в ефективні типові значення LSP вбудованого Pi
- сьогодні можна запускати лише підтримувані stdio-backed LSP server-и; непідтримувані
  транспорти все одно показуються в `openclaw plugins inspect <id>`

### Визначається, але не виконується

Ці елементи розпізнаються й показуються в діагностиці, але OpenClaw їх не запускає:

- Claude `agents`, автоматизація `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Вбудовані/app-метадані Codex поза звітуванням про можливості

## Формати пакетів

<AccordionGroup>
  <Accordion title="Пакети Codex">
    Маркери: `.codex-plugin/plugin.json`

    Необов’язковий контент: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Пакети Codex найкраще підходять OpenClaw, коли використовують корені Skill і
    каталоги hook-pack у стилі OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Пакети Claude">
    Два режими виявлення:

    - **На основі manifest:** `.claude-plugin/plugin.json`
    - **Без manifest:** типовий макет Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Поведінка, специфічна для Claude:

    - `commands/` трактується як контент Skill
    - `settings.json` імпортується в налаштування вбудованого Pi (ключі перевизначення shell очищуються)
    - `.mcp.json` надає підтримувані stdio tools для вбудованого Pi
    - `.lsp.json` плюс шляхи `lspServers`, оголошені в manifest, завантажуються у типові значення LSP вбудованого Pi
    - `hooks/hooks.json` визначається, але не виконується
    - Кастомні шляхи компонентів у manifest є адитивними (вони розширюють типові значення, а не замінюють їх)

  </Accordion>

  <Accordion title="Пакети Cursor">
    Маркери: `.cursor-plugin/plugin.json`

    Необов’язковий контент: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` трактується як контент Skill
    - `.cursor/rules/`, `.cursor/agents/` і `.cursor/hooks.json` працюють лише в режимі detect-only

  </Accordion>
</AccordionGroup>

## Пріоритет виявлення

OpenClaw спочатку перевіряє нативний формат Plugin-а:

1. `openclaw.plugin.json` або коректний `package.json` з `openclaw.extensions` — трактується як **нативний Plugin**
2. Маркери пакетів (`.codex-plugin/`, `.claude-plugin/` або типовий макет Claude/Cursor) — трактується як **пакет**

Якщо каталог містить обидва варіанти, OpenClaw використовує нативний шлях. Це запобігає
частковому встановленню пакетів подвійного формату як пакетів.

## Залежності runtime і очищення

- Залежності runtime bundled Plugin-ів постачаються всередині пакета OpenClaw у
  `dist/*`. OpenClaw **не** запускає `npm install` під час startup для bundled
  Plugin-ів; pipeline релізу відповідає за постачання повного payload bundled
  залежностей (див. правило перевірки після публікації в
  [Релізинг](/uk/reference/RELEASING)).

## Безпека

Пакети мають вужчу межу довіри, ніж нативні Plugin-и:

- OpenClaw **не** завантажує довільні runtime-модулі пакета в одному процесі
- Шляхи Skills і hook-pack мають залишатися всередині кореня Plugin-а (перевірка меж)
- Файли settings читаються з тими самими перевірками меж
- Підтримувані stdio MCP server-и можуть запускатися як subprocess-и

Це робить пакети безпечнішими типово, але вам усе одно слід ставитися до сторонніх
пакетів як до довіреного контенту для тих можливостей, які вони надають.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Пакет виявляється, але можливості не працюють">
    Запустіть `openclaw plugins inspect <id>`. Якщо можливість перелічена, але позначена як
    not wired, це обмеження продукту, а не зламане встановлення.
  </Accordion>

  <Accordion title="Файли команд Claude не з’являються">
    Переконайтеся, що пакет увімкнено і markdown-файли знаходяться всередині виявленого
    кореня `commands/` або `skills/`.
  </Accordion>

  <Accordion title="Налаштування Claude не застосовуються">
    Підтримуються лише налаштування вбудованого Pi з `settings.json`. OpenClaw не
    трактує налаштування пакета як сирі patch-і config.
  </Accordion>

  <Accordion title="Hooks Claude не виконуються">
    `hooks/hooks.json` працює лише в режимі detect-only. Якщо вам потрібні виконувані hooks, використовуйте
    макет hook-pack OpenClaw або постачайте нативний Plugin.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Встановлення та налаштування Plugin-ів](/uk/tools/plugin)
- [Створення Plugin-ів](/uk/plugins/building-plugins) — створення нативного Plugin-а
- [Manifest Plugin-а](/uk/plugins/manifest) — схема нативного manifest
