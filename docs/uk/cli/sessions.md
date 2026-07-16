---
read_when:
    - Потрібно переглянути список збережених сеансів і нещодавню активність
summary: Довідник CLI для `openclaw sessions` (список збережених сеансів і використання)
title: Сеанси
x-i18n:
    generated_at: "2026-07-16T17:50:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Перелік збережених сеансів розмов.

Списки сеансів не є перевірками доступності каналів або провайдерів. Вони показують збережені
рядки розмов зі сховищ сеансів. Неактивний канал Discord, Slack, Telegram або
інший канал може успішно повторно підключитися без створення нового рядка сеансу,
доки не буде оброблено повідомлення. Використовуйте `openclaw channels status --probe`,
`openclaw status --deep` або `openclaw health --verbose`, коли потрібно перевірити поточне
підключення каналу.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Прапорці:

| Прапорець                 | Опис                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Одне налаштоване сховище агента (типово: сховище налаштованого типового агента).        |
| `--all-agents`       | Об’єднати всі налаштовані сховища агентів.                                 |
| `--store <path>`     | Явний шлях до сховища (не можна поєднувати з `--agent` або `--all-agents`). |
| `--active <minutes>` | Показувати лише сеанси, оновлені протягом останніх N хвилин.                  |
| `--limit <n\|all>`   | Максимальна кількість рядків у виводі (типово `100`; `all` відновлює повний вивід).        |
| `--json`             | Машинозчитуваний вивід.                                               |
| `--verbose`          | Докладне журналювання.                                                       |

`openclaw sessions` і RPC Gateway `sessions.list` типово мають обмеження,
щоб великі довготривалі сховища не могли монополізувати процес CLI або цикл
подій Gateway. CLI типово повертає 100 найновіших сеансів; передайте `--limit <n>`
для меншого чи більшого діапазону або `--limit all`, якщо навмисно потрібне
повне сховище. Відповіді JSON містять `totalCount`, `limitApplied` і `hasMore`,
щоб клієнти могли показати наявність додаткових рядків.

Клієнти RPC можуть передати `configuredAgentsOnly: true`, щоб зберегти широке об’єднане
джерело виявлення, але повернути лише рядки агентів, які наразі присутні в конфігурації.
Control UI типово використовує цей режим, щоб сховища видалених агентів або агентів,
наявних лише на диску, не з’являлися повторно в поданні сеансів.

`--all-agents` читає налаштовані сховища агентів. Виявлення сеансів
Gateway і ACP ширше: воно також охоплює сховища SQLite, визначені з
налаштованих кореневих каталогів агентів або шаблонного кореня `session.store`.
Шляхи застарілих селекторів мають визначатися в межах кореневого каталогу агента;
символічні посилання та шляхи за межами кореня пропускаються.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Відстеження перебігу траєкторії

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` відображає нещодавні події траєкторії середовища виконання як стислі
рядки перебігу. Без `--session-key` він спочатку відстежує активні сеанси, а потім
останній збережений сеанс. `--tail <count>` визначає, скільки наявних подій
вивести перед режимом стеження; типове значення — `80`, а `0` починає з поточного кінця.
`--follow` продовжує стежити за вибраним сеансом на основі SQLite або явно
заданим застарілим файлом траєкторії.

Подання перебігу навмисно консервативне: текст запиту, аргументи інструментів
і тіла результатів інструментів не виводяться. Виклики інструментів показують назву інструмента з
`{...redacted...}`; результати інструментів показують стан, як-от `ok`, `error` або `done`;
рядки завершення моделі показують провайдера/модель і кінцевий стан.

## Експорт пакета траєкторії

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Це шлях команди, який використовує slash-команда `/export-trajectory` після того,
як власник схвалить запит на виконання. Вихідний каталог завжди визначається
всередині `.openclaw/trajectory-exports/` у вибраному робочому просторі.

## Обслуговування очищення

Запустіть обслуговування зараз, не чекаючи наступного циклу запису:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` використовує параметри `session.maintenance` з конфігурації
([Довідник конфігурації](/uk/gateway/config-agents#session)):

- Примітка щодо області дії: `openclaw sessions cleanup` обслуговує сховища сеансів,
  транскрипти, рядки траєкторій і застарілі супровідні файли траєкторій. Він не
  очищує історію запусків cron, яка автоматично зберігає 2000 найновіших рядків для кожного завдання
  ([Конфігурація Cron](/uk/automation/cron-jobs#configuration)).
- Очищення також видаляє непов’язані застарілі/архівні артефакти транскриптів,
  контрольні точки Compaction і супровідні файли траєкторій, старші за
  `session.maintenance.pruneAfter`; артефакти, на які все ще посилаються рядки сеансів
  SQLite, зберігаються.
- Очищення окремо звітує про очищення короткочасних пробних запусків моделі Gateway як
  `modelRunPruned`. Воно відповідає лише суворо визначеним явним ключам форми
  `agent:*:explicit:model-run-<uuid>`. Період зберігання фіксований — `24h`, а очищення
  залежить від навантаження: застарілі рядки проб видаляються лише тоді, коли
  досягнуто порогу обслуговування або обмеження кількості записів сеансів. Під час його виконання очищення запусків
  моделі відбувається до глобального очищення застарілих записів і застосування обмежень.

Прапорці:

| Прапорець                 | Опис                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Попередньо переглянути, скільки записів буде очищено або обмежено без запису змін. У текстовому режимі виводить таблицю дій для кожного сеансу (`Action`, `Key`, `Age`, `Model`, `Flags`), а також підсумок, згрупований за міткою сеансу.                                                                                                       |
| `--enforce`          | Застосувати обслуговування, навіть коли `session.maintenance.mode` має значення `warn`.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Видалити застарілі записи, архівні артефакти транскриптів яких відсутні або містять лише заголовок чи є порожніми, навіть якщо зазвичай їх ще не потрібно видаляти за віком або кількістю.                                                                                                                                                             |
| `--fix-dm-scope`     | Коли `session.dmScope` має значення `main`, вилучити застарілі рядки прямих повідомлень, ключовані за співрозмовником, які залишилися від попередньої маршрутизації `per-peer`, `per-channel-peer` або `per-account-channel-peer`. Спочатку використайте `--dry-run`; застосування видаляє ці рядки з SQLite та зберігає їхні застарілі артефакти транскриптів як видалені архіви. |
| `--active-key <key>` | Захистити певний активний ключ від витіснення через бюджет диска. Постійні зовнішні вказівники розмов, як-от групові сеанси та сеанси чату в межах гілок, також зберігаються під час обслуговування за віком, кількістю та бюджетом диска.                                                                                               |
| `--agent <id>`       | Запустити очищення для одного налаштованого сховища агента.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Запустити очищення для всіх налаштованих сховищ агентів.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Запустити для певного шляху селектора застарілого сховища.                                                                                                                                                                                                                                                         |
| `--json`             | Вивести підсумок у форматі JSON. З `--all-agents` вивід містить окремий підсумок для кожного сховища.                                                                                                                                                                                                                          |

Коли Gateway доступний, очищення без пробного режиму для налаштованих сховищ агентів
надсилається через Gateway, щоб воно використовувало той самий засіб запису сховища сеансів, що й трафік
середовища виконання. Використовуйте `--store <path>` для явного автономного відновлення селектора
застарілого сховища.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Ущільнення сеансу

Вивільніть бюджет контексту для заблокованого або надмірно великого сеансу. `openclaw sessions
compact <key>` — це повноцінна обгортка для RPC Gateway `sessions.compact`,
яка потребує запущеного Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Без `--max-lines` Gateway підсумовує транскрипт за допомогою LLM. CLI
  типово не встановлює клієнтського кінцевого терміну; Gateway керує
  налаштованим життєвим циклом Compaction.
- З `--max-lines <n>` транскрипт скорочується до останніх `n` рядків, а
  попередній транскрипт архівується як супровідний файл `.bak`.
- `--agent <id>`: агент, якому належить сеанс; обов’язковий для ключів `global`.
- `--url` / `--token` / `--password`: перевизначення підключення Gateway.
- `--timeout <ms>`: необов’язковий клієнтський час очікування RPC у мілісекундах.
- `--json`: вивести необроблене корисне навантаження RPC.

Команда завершується з ненульовим кодом, коли Gateway повідомляє про невдалу Compaction або є
недоступним, тому Cron і скрипти ніколи не сприймають безрезультатну операцію без повідомлень як успішну.

<Note>
`openclaw agent --message '/compact ...'` — це **не** шлях Compaction. Команди зі скісною рискою
з CLI відхиляються перевіркою авторизованого відправника; такий
виклик завершується з ненульовим кодом і надає вказівку на цей розділ замість
безрезультатного завершення без повідомлень.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` приймає:

| Поле       | Тип         | Обов’язкове | Опис                                                       |
| ---------- | ----------- | ----------- | ---------------------------------------------------------- |
| `key`      | string      | так         | Ключ сеансу для ущільнення (наприклад, `agent:main:main`). |
| `agentId`  | string      | ні          | Ідентифікатор агента, якому належить сеанс (для ключів `global`). |
| `maxLines` | integer ≥ 1 | ні          | Скоротити до останніх N рядків замість узагальнення за допомогою LLM. |

Приклад відповіді з узагальненням за допомогою LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Приклад відповіді зі скороченням (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Пов’язані матеріали

- [Конфігурація сеансу](/uk/gateway/config-agents#session)
- [Керування сеансами](/uk/concepts/session)
- [Compaction](/uk/concepts/compaction)
- [Довідник CLI](/uk/cli)
