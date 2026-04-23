---
read_when:
    - Установлення або налаштування Plugin-ів
    - Розуміння правил виявлення та завантаження Plugin-ів
    - Робота з bundle-ами Plugin-ів, сумісними з Codex/Claude
sidebarTitle: Install and Configure
summary: Установлення, налаштування та керування Plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T21:16:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2cf5cb6146ae5e52a32201ee08c03211dbea2313b884c696307abc56d3f9cbf
    source_path: tools/plugin.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: channels, model providers,
tools, Skills, speech, realtime transcription, realtime voice,
media-understanding, image generation, video generation, web fetch, web
search тощо. Деякі plugins є **core** (постачаються разом з OpenClaw), інші —
**external** (публікуються спільнотою в npm).

## Швидкий старт

<Steps>
  <Step title="Подивіться, що завантажено">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Установіть Plugin">
    ```bash
    # З npm
    openclaw plugins install @openclaw/voice-call

    # З локального каталогу або archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```

    Потім налаштуйте в `plugins.entries.\<id\>.config` у вашому файлі конфігурації.

  </Step>
</Steps>

Якщо вам зручніше керувати через чат, увімкніть `commands.plugins: true` і використовуйте:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Шлях install використовує той самий resolver, що й CLI: local path/archive, явний
`clawhub:<pkg>` або звичайний package spec (спочатку ClawHub, потім fallback до npm).

Якщо config невалідна, install зазвичай завершується в закритий спосіб і вказує вам на
`openclaw doctor --fix`. Єдиний виняток для відновлення — вузький шлях перевстановлення bundled-plugin
для plugins, які явно підтримують
`openclaw.install.allowInvalidConfigRecovery`.

Пакетні встановлення OpenClaw не встановлюють eager-способом усе дерево runtime dependencies кожного bundled plugin.
Коли bundled Plugin, яким володіє OpenClaw, активний через
конфігурацію plugin, legacy channel config або default-enabled manifest, startup
відновлює лише задекларовані runtime dependencies цього plugin перед його import. Зовнішні plugins і custom load paths однаково повинні встановлюватися через
`openclaw plugins install`.

## Типи Plugin-ів

OpenClaw розпізнає два формати Plugin-ів:

| Формат     | Як це працює                                                    | Приклади                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; виконується in-process | Офіційні plugins, community npm packages               |
| **Bundle** | Сумісний із Codex/Claude/Cursor layout; відображається на можливості OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Обидва типи з’являються в `openclaw plugins list`. Деталі щодо bundles див. в [Plugin Bundles](/uk/plugins/bundles).

Якщо ви пишете native Plugin, почніть із [Building Plugins](/uk/plugins/building-plugins)
та [Plugin SDK Overview](/uk/plugins/sdk-overview).

## Офіційні plugins

### Установлювані (npm)

| Plugin          | Пакет                 | Документація                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/uk/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/uk/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/uk/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/uk/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/uk/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/uk/plugins/zalouser)   |

### Core (постачаються з OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (увімкнено типово)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — вбудований memory search (типово через `plugins.slots.memory`)
    - `memory-lancedb` — memory довгого зберігання з install-on-demand та auto-recall/capture (установіть `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech providers (увімкнено типово)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Інше">
    - `browser` — вбудований browser plugin для browser tool, CLI `openclaw browser`, gateway method `browser.request`, browser runtime і типового browser control service (увімкнено типово; вимкніть перед заміною)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (типово вимкнено)
  </Accordion>
</AccordionGroup>

Шукаєте сторонні plugins? Див. [Community Plugins](/uk/plugins/community).

## Конфігурація

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Поле            | Опис                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Головний перемикач (типово: `true`)                       |
| `allow`          | Allowlist Plugin-ів (необов’язково)                       |
| `deny`           | Denylist Plugin-ів (необов’язково; deny має пріоритет)    |
| `load.paths`     | Додаткові файли/каталоги Plugin-ів                        |
| `slots`          | Вибір exclusive slot-ів (наприклад `memory`, `contextEngine`) |
| `entries.\<id\>` | Перемикачі для окремого Plugin + config                   |

Зміни конфігурації **вимагають перезапуску gateway**. Якщо Gateway працює з config
watch + in-process restart enabled (типовий шлях `openclaw gateway`), цей
перезапуск зазвичай виконується автоматично невдовзі після запису конфігурації.

<Accordion title="Стани Plugin-ів: disabled vs missing vs invalid">
  - **Disabled**: plugin існує, але правила enablement його вимкнули. Config зберігається.
  - **Missing**: config посилається на plugin id, якого виявлення не знайшло.
  - **Invalid**: plugin існує, але його config не відповідає задекларованій schema.
</Accordion>

## Discovery і precedence

OpenClaw сканує plugins у такому порядку (перше співпадіння перемагає):

<Steps>
  <Step title="Шляхи з config">
    `plugins.load.paths` — явні шляхи до файлів або каталогів.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` і `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` і `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Постачаються з OpenClaw. Багато з них увімкнені типово (model providers, speech).
    Інші потребують явного ввімкнення.
  </Step>
</Steps>

### Правила enablement

- `plugins.enabled: false` вимикає всі plugins
- `plugins.deny` завжди має пріоритет над allow
- `plugins.entries.\<id\>.enabled: false` вимикає цей plugin
- Plugins, що походять із workspace, **типово вимкнені** (їх потрібно явно ввімкнути)
- Bundled plugins дотримуються вбудованого набору default-on, якщо не перевизначено
- Exclusive slots можуть примусово ввімкнути plugin, вибраний для цього slot

## Plugin slots (exclusive categories)

Деякі категорії є exclusive (одночасно може бути активною лише одна):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // або "none" для вимкнення
      contextEngine: "legacy", // або plugin id
    },
  },
}
```

| Slot            | Що він контролює       | Типове значення    |
| --------------- | ---------------------- | ------------------ |
| `memory`        | Активний memory plugin | `memory-core`      |
| `contextEngine` | Активний context engine| `legacy` (built-in) |

## Довідка CLI

```bash
openclaw plugins list                       # компактний інвентар
openclaw plugins list --enabled            # лише завантажені plugins
openclaw plugins list --verbose            # докладні рядки для кожного plugin
openclaw plugins list --json               # машиночитаний інвентар
openclaw plugins inspect <id>              # глибокі деталі
openclaw plugins inspect <id> --json       # машиночитаний формат
openclaw plugins inspect --all             # таблиця для всього набору
openclaw plugins info <id>                 # псевдонім inspect
openclaw plugins doctor                    # діагностика

openclaw plugins install <package>         # установлення (спочатку ClawHub, потім npm)
openclaw plugins install clawhub:<pkg>     # установлення лише з ClawHub
openclaw plugins install <spec> --force    # перезаписати наявне встановлення
openclaw plugins install <path>            # установлення з локального шляху
openclaw plugins install -l <path>         # link (без копіювання) для dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # записати точний resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # оновити один plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # оновити всі
openclaw plugins uninstall <id>          # прибрати записи config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins постачаються з OpenClaw. Багато з них увімкнені типово (наприклад
bundled model providers, bundled speech providers і bundled browser
plugin). Інші bundled plugins однаково потребують `openclaw plugins enable <id>`.

`--force` перезаписує наявний встановлений plugin або hook pack на місці. Використовуйте
`openclaw plugins update <id-or-npm-spec>` для звичайних оновлень відстежуваних npm
plugins. Він не підтримується разом із `--link`, який повторно використовує шлях до source
замість копіювання до керованої цілі встановлення.

Коли `plugins.allow` уже задано, `openclaw plugins install` додає
id встановленого plugin до цього allowlist перед його ввімкненням, тож після перезапуску встановлення
одразу можна буде завантажити.

`openclaw plugins update <id-or-npm-spec>` застосовується до відстежуваних встановлень. Передавання
npm package spec з dist-tag або точною версією розв’язує ім’я пакета
назад до запису відстежуваного plugin і записує новий spec для майбутніх оновлень.
Передавання імені пакета без версії переводить exact pinned install назад на
типову release line registry. Якщо встановлений npm plugin уже відповідає
розв’язаній версії й записаній artifact identity, OpenClaw пропускає оновлення
без завантаження, перевстановлення або переписування config.

`--pin` працює лише з npm. Він не підтримується з `--marketplace`, оскільки
встановлення з marketplace зберігають метадані джерела marketplace, а не npm spec.

`--dangerously-force-unsafe-install` — це break-glass override для хибнопозитивних спрацьовувань
вбудованого scanner dangerous-code. Він дозволяє продовжити install і update plugin-ів попри вбудовані findings рівня `critical`, але все одно не обходить policy blocks `before_install` plugin-а або блокування через збій scanner-а.

Цей прапорець CLI застосовується лише до потоків install/update plugin-ів. Установлення залежностей для Skills, що працює через Gateway, використовує відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

Сумісні bundles беруть участь у тому самому потоці list/inspect/enable/disable plugin-ів. Поточна підтримка runtime включає bundle Skills, command-skills Claude,
типові значення `settings.json` Claude, типові значення `.lsp.json` Claude та
`lspServers`, оголошені в manifest, command-skills Cursor і сумісні каталоги hooks Codex.

`openclaw plugins inspect <id>` також повідомляє про виявлені можливості bundle плюс
підтримувані або непідтримувані записи MCP і LSP server для plugin-ів на основі bundle.

Джерелами marketplace можуть бути відома назва marketplace Claude з
`~/.claude/plugins/known_marketplaces.json`, локальний корінь marketplace або шлях
`marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub
або URL git. Для віддалених marketplace записи plugin мають залишатися всередині
клонованого репозиторію marketplace і використовувати лише відносні джерела шляхів.

Повні подробиці див. у [довідці CLI `openclaw plugins`](/uk/cli/plugins).

## Огляд API Plugin

Native plugins експортують об’єкт entry, який відкриває `register(api)`. Старіші
plugins усе ще можуть використовувати `activate(api)` як legacy alias, але нові plugins мають
використовувати `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw завантажує об’єкт entry і викликає `register(api)` під час активації
plugin. Loader усе ще повертається до `activate(api)` для старіших plugins,
але bundled plugins і нові external plugins мають вважати `register` публічним контрактом.

Поширені методи реєстрації:

| Метод                                   | Що він реєструє             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model provider (LLM)        |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | Agent tool                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Аналіз зображень/аудіо      |
| `registerImageGenerationProvider`       | Генерування зображень       |
| `registerMusicGenerationProvider`       | Генерування музики          |
| `registerVideoGenerationProvider`       | Генерування відео           |
| `registerWebFetchProvider`              | Provider web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | Команди CLI                 |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Background service          |

Поведінка guard hooks для типізованих lifecycle hooks:

- `before_tool_call`: `{ block: true }` є термінальним; handlers нижчого пріоритету пропускаються.
- `before_tool_call`: `{ block: false }` — no-op і не скасовує раніше встановлений block.
- `before_install`: `{ block: true }` є термінальним; handlers нижчого пріоритету пропускаються.
- `before_install`: `{ block: false }` — no-op і не скасовує раніше встановлений block.
- `message_sending`: `{ cancel: true }` є термінальним; handlers нижчого пріоритету пропускаються.
- `message_sending`: `{ cancel: false }` — no-op і не скасовує раніше встановлений cancel.

Повну поведінку типізованих hooks див. в [SDK Overview](/uk/plugins/sdk-overview#hook-decision-semantics).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — створення власного Plugin
- [Plugin Bundles](/uk/plugins/bundles) — сумісність bundle-ів Codex/Claude/Cursor
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
- [Registering Tools](/uk/plugins/building-plugins#registering-agent-tools) — додавання agent tools у Plugin
- [Plugin Internals](/uk/plugins/architecture) — модель capability і pipeline завантаження
- [Community Plugins](/uk/plugins/community) — списки сторонніх Plugin-ів
