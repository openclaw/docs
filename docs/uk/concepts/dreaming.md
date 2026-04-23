---
read_when:
    - Ви хочете, щоб перенесення пам’яті виконувалося автоматично
    - Ви хочете зрозуміти, що робить кожна фаза Dreaming
    - Ви хочете налаштувати консолідацію, не засмічуючи `MEMORY.md`
summary: Фонова консолідація пам’яті з фазами light, deep і REM, а також із Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T20:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a2a399259e1ec9db52f761308686c7d6d377fd21528b77a9057fa690802c3db
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming — це фонова система консолідації пам’яті в `memory-core`.
Вона допомагає OpenClaw переносити сильні короткочасні сигнали в довготривалу пам’ять,
зберігаючи цей процес зрозумілим і придатним для перевірки.

Dreaming є **опційною функцією** і за замовчуванням вимкнена.

## Що записує dreaming

Dreaming зберігає два типи результатів:

- **Машинний стан** у `memory/.dreams/` (сховище recall, сигнали phase, checkpoints ingestion, locks).
- **Зрозумілий для людини результат** у `DREAMS.md` (або наявному `dreams.md`) і необов’язкових файлах звітів phase у `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Перенесення в довготривалу пам’ять, як і раніше, записує лише в `MEMORY.md`.

## Модель phase

Dreaming використовує три кооперативні phase:

| Phase | Призначення                                | Довготривалий запис |
| ----- | ------------------------------------------ | ------------------- |
| Light | Сортування й підготовка нещодавнього короткочасного матеріалу | Ні                  |
| Deep  | Оцінювання й перенесення довготривалих кандидатів | Так (`MEMORY.md`)   |
| REM   | Рефлексія над темами та повторюваними ідеями | Ні                  |

Ці phase є внутрішніми деталями реалізації, а не окремими
користувацькими «режимами».

### Phase Light

Phase Light поглинає нещодавні щоденні сигнали пам’яті та сліди recall, видаляє дублікати
й готує рядки кандидатів.

- Зчитує дані з короткочасного стану recall, нещодавніх щоденних файлів пам’яті та відредагованих session transcript, коли вони доступні.
- Записує керований блок `## Light Sleep`, коли сховище включає вбудований результат.
- Фіксує сигнали підсилення для подальшого ранжування deep.
- Ніколи не записує в `MEMORY.md`.

### Phase Deep

Phase Deep визначає, що стане довготривалою пам’яттю.

- Ранжує кандидатів за допомогою зваженого score і порогових перевірок.
- Вимагає проходження `minScore`, `minRecallCount` і `minUniqueQueries`.
- Повторно гідратує уривки з актуальних щоденних файлів перед записом, тому застарілі/видалені уривки пропускаються.
- Додає перенесені записи до `MEMORY.md`.
- Записує підсумок `## Deep Sleep` у `DREAMS.md` і за потреби записує `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

Phase REM витягує шаблони та рефлексивні сигнали.

- Формує підсумки тем і рефлексій із нещодавніх короткочасних слідів.
- Записує керований блок `## REM Sleep`, коли сховище включає вбудований результат.
- Фіксує сигнали підсилення REM, які використовуються ранжуванням deep.
- Ніколи не записує в `MEMORY.md`.

## Поглинання session transcript

Dreaming може поглинати відредаговані session transcript у свій корпус dreaming. Коли
transcript доступні, вони подаються у phase light разом із щоденними
сигналами пам’яті та слідами recall. Особистий і чутливий вміст редагується
перед поглинанням.

## Dream Diary

Dreaming також веде наративний **Dream Diary** у `DREAMS.md`.
Після того як для кожної phase накопичується достатньо матеріалу, `memory-core` виконує best-effort фоновий
цикл subagent (використовуючи типову runtime model) і додає короткий запис щоденника.

Цей щоденник призначений для читання людиною в UI Dreams, а не як джерело перенесення.
Артефакти щоденника/звіту, згенеровані dreaming, виключаються з короткочасного
перенесення. Лише grounded уривки пам’яті можуть переноситися в
`MEMORY.md`.

Також існує grounded lane історичного backfill для перевірки та відновлення:

- `memory rem-harness --path ... --grounded` показує grounded-вивід щоденника з історичних нотаток `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` записує оборотні grounded-записи щоденника в `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` додає grounded довготривалих кандидатів до того самого short-term evidence store, який уже використовує звичайна phase deep.
- `memory rem-backfill --rollback` і `--rollback-short-term` видаляють ці staged backfill-артефакти, не зачіпаючи звичайні записи щоденника або активний короткочасний recall.

Control UI надає той самий процес backfill/reset щоденника, тож ви можете перевіряти
результати в scene Dreams, перш ніж вирішити, чи заслуговують grounded-кандидати
на перенесення. Scene також показує окремий grounded lane, щоб ви могли бачити,
які staged short-term записи походять з історичного replay, які перенесені
елементи були ініційовані grounded-проходом, і очищати лише grounded-only staged записи, не
торкаючись звичайного активного short-term стану.

## Сигнали ранжування deep

Ранжування deep використовує шість зважених базових сигналів плюс підсилення phase:

| Сигнал              | Вага | Опис                                              |
| ------------------- | ---- | ------------------------------------------------- |
| Frequency           | 0.24 | Скільки короткочасних сигналів накопичив запис    |
| Relevance           | 0.30 | Середня якість отримання для запису               |
| Query diversity     | 0.15 | Різні контексти запитів/днів, у яких він з’являвся |
| Recency             | 0.15 | Score свіжості з часовим згасанням                |
| Consolidation       | 0.10 | Сила повторюваності впродовж кількох днів         |
| Conceptual richness | 0.06 | Щільність concept-tag із уривка/шляху             |

Попадання у phase Light і REM додають невелике підсилення зі згасанням за часом із
`memory/.dreams/phase-signals.json`.

## Планування

Коли функцію ввімкнено, `memory-core` автоматично керує одним cron-завданням для повного проходу dreaming.
Кожен прохід запускає phase в такому порядку: light -> REM -> deep.

Поведінка типового розкладу:

| Налаштування        | Значення за замовчуванням |
| ------------------- | ------------------------- |
| `dreaming.frequency` | `0 3 * * *`              |

## Швидкий старт

Увімкнення dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Увімкнення dreaming із власним розкладом проходу:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash-команда

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Робочий процес CLI

Використовуйте CLI перенесення для попереднього перегляду або ручного застосування:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ручний `memory promote` за замовчуванням використовує пороги phase deep, якщо їх не перевизначено
прапорцями CLI.

Пояснити, чому конкретний кандидат буде або не буде перенесений:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Попередньо переглянути REM reflections, candidate truths і результат deep promotion без
запису будь-чого:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Ключові типові параметри

Усі налаштування знаходяться в `plugins.entries.memory-core.config.dreaming`.

| Ключ        | Значення за замовчуванням |
| ----------- | ------------------------- |
| `enabled`   | `false`                   |
| `frequency` | `0 3 * * *`               |

Політика phase, пороги та поведінка сховища — це внутрішні деталі реалізації
(а не користувацька конфігурація).

Повний перелік ключів див. у [довіднику конфігурації Memory](/uk/reference/memory-config#dreaming).

## UI Dreams

Коли функцію ввімкнено, вкладка **Dreams** у Gateway показує:

- поточний стан увімкнення dreaming
- статус на рівні phase і наявність керованого sweep
- кількість short-term, grounded, signal і promoted-today
- час наступного запланованого запуску
- окремий grounded Scene lane для staged-записів історичного replay
- розгортуваний reader Dream Diary на основі `doctor.memory.dreamDiary`

## Усунення несправностей

### Dreaming ніколи не запускається (status показує blocked)

Керований dreaming cron спирається на heartbeat агента за замовчуванням. Якщо heartbeat не спрацьовує для цього агента, cron ставить системну подію в чергу, яку ніхто не обробляє, і dreaming мовчки не запускається. І `openclaw memory status`, і `/dreaming status` у такому разі покажуть `blocked` і вкажуть агента, чий heartbeat є причиною блокування.

Дві поширені причини:

- Інший агент оголошує явний блок `heartbeat:`. Коли будь-який запис у `agents.list` має власний блок `heartbeat`, heartbeat працює лише для цих агентів — значення за замовчуванням перестають застосовуватися до всіх інших, тож агент за замовчуванням може замовкнути. Перенесіть налаштування heartbeat до `agents.defaults.heartbeat` або додайте явний блок `heartbeat` для агента за замовчуванням. Див. [Область дії та пріоритет](/uk/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` дорівнює `0`, порожнє або не піддається розбору. Cron не має інтервалу, за яким можна планувати, тому heartbeat фактично вимкнено. Установіть `every` на додатну тривалість, наприклад `30m`. Див. [Типові параметри](/uk/gateway/heartbeat#defaults).

## Пов’язане

- [Heartbeat](/uk/gateway/heartbeat)
- [Memory](/uk/concepts/memory)
- [Memory Search](/uk/concepts/memory-search)
- [memory CLI](/uk/cli/memory)
- [Довідник конфігурації Memory](/uk/reference/memory-config)
