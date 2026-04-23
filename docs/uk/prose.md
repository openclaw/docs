---
read_when:
    - Ви хочете запускати або писати робочі процеси .prose
    - Ви хочете ввімкнути Plugin OpenProse
    - Вам потрібно зрозуміти, як зберігається стан
summary: 'OpenProse: робочі процеси .prose, slash-команди та стан в OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-23T21:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed7995d509f7ace61cd235f43cd30336a89989204b43be40281ada2599df767c
    source_path: prose.md
    workflow: 15
---

OpenProse — це portable markdown-first формат робочих процесів для оркестрації AI-сесій. В OpenClaw він постачається як Plugin, що встановлює набір Skills OpenProse плюс slash-команду `/prose`. Програми живуть у файлах `.prose` і можуть породжувати кількох subagent-ів з явним керуванням потоком.

Офіційний сайт: [https://www.prose.md](https://www.prose.md)

## Що він уміє

- Багатоагентні дослідження + синтез із явним паралелізмом.
- Повторювані безпечні для approval робочі процеси (перегляд коду, triage інцидентів, контентні пайплайни).
- Повторно використовувані програми `.prose`, які можна запускати в підтримуваних runtime агентів.

## Встановлення + увімкнення

Bundled Plugin-и за замовчуванням вимкнені. Увімкніть OpenProse:

```bash
openclaw plugins enable open-prose
```

Після ввімкнення Plugin-а перезапустіть Gateway.

Dev/local checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Пов’язані документи: [Plugins](/uk/tools/plugin), [Plugin manifest](/uk/plugins/manifest), [Skills](/uk/tools/skills).

## Slash-команда

OpenProse реєструє `/prose` як команду Skill, яку може викликати користувач. Вона маршрутизується до інструкцій VM OpenProse і під капотом використовує tools OpenClaw.

Поширені команди:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Приклад: простий файл `.prose`

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Розташування файлів

OpenProse зберігає стан у `.prose/` у вашому workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Постійні агенти на рівні користувача живуть тут:

```
~/.prose/agents/
```

## Режими стану

OpenProse підтримує кілька backend-ів стану:

- **filesystem** (за замовчуванням): `.prose/runs/...`
- **in-context**: тимчасовий, для невеликих програм
- **sqlite** (експериментальний): потребує бінарний файл `sqlite3`
- **postgres** (експериментальний): потребує `psql` і рядок з’єднання

Примітки:

- sqlite/postgres є opt-in та експериментальними.
- Облікові дані postgres потрапляють у журнали subagent-ів; використовуйте окрему БД з мінімально необхідними правами.

## Віддалені програми

`/prose run <handle/slug>` розв’язується до `https://p.prose.md/<handle>/<slug>`.
Прямі URL отримуються як є. Для цього використовується tool `web_fetch` (або `exec` для POST).

## Відображення на runtime OpenClaw

Програми OpenProse зіставляються з примітивами OpenClaw:

| Концепція OpenProse        | Tool OpenClaw    |
| -------------------------- | ---------------- |
| Spawn session / Task tool  | `sessions_spawn` |
| Читання/запис файлів       | `read` / `write` |
| Web fetch                  | `web_fetch`      |

Якщо ваш allowlist tool-ів блокує ці tools, програми OpenProse не працюватимуть. Див. [Skills config](/uk/tools/skills-config).

## Безпека + approvals

Ставтеся до файлів `.prose` як до коду. Перевіряйте їх перед запуском. Використовуйте allowlist-и tool-ів OpenClaw і approval gate-и, щоб контролювати побічні ефекти.

Для детермінованих робочих процесів з approval gate порівняйте з [Lobster](/uk/tools/lobster).
