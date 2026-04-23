---
read_when:
    - Налаштування типових значень elevated mode, allowlist-ів або поведінки slash-команди
    - Розуміння того, як sandboxed-агенти можуть отримувати доступ до host-а
summary: 'Режим elevated exec: виконання команд поза sandbox із sandboxed-агента'
title: Режим elevated
x-i18n:
    generated_at: "2026-04-23T21:14:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Коли агент працює всередині sandbox, його команди `exec` обмежені
середовищем sandbox. **Elevated mode** дає агенту змогу вийти за ці межі й виконувати команди
поза sandbox, із налаштовуваними approval gate-ами.

<Info>
  Elevated mode змінює поведінку лише тоді, коли агент є **sandboxed**. Для
  агентів без sandbox `exec` і так виконується на host.
</Info>

## Директиви

Керуйте elevated mode для конкретної сесії за допомогою slash-команд:

| Директива       | Що вона робить                                                       |
| --------------- | -------------------------------------------------------------------- |
| `/elevated on`  | Виконує поза sandbox на налаштованому шляху host, зберігаючи approvals |
| `/elevated ask` | Те саме, що `on` (alias)                                             |
| `/elevated full`| Виконує поза sandbox на налаштованому шляху host і пропускає approvals |
| `/elevated off` | Повертає виконання в межах sandbox                                   |

Також доступно як `/elev on|off|ask|full`.

Надішліть `/elevated` без аргументів, щоб побачити поточний рівень.

## Як це працює

<Steps>
  <Step title="Перевірте доступність">
    Elevated має бути увімкнено в config, а відправник має бути в allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Задайте рівень">
    Надішліть повідомлення лише з директивою, щоб встановити типове значення для сесії:

    ```
    /elevated full
    ```

    Або використовуйте inline (застосовується лише до цього повідомлення):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Команди виконуються поза sandbox">
    Коли elevated активний, виклики `exec` виходять за межі sandbox. Фактичним host за замовчуванням є
    `gateway`, або `node`, коли налаштована/сесійна ціль exec — це
    `node`. У режимі `full` approvals для exec пропускаються. У режимах `on`/`ask`
    налаштовані правила approval усе ще застосовуються.
  </Step>
</Steps>

## Порядок розв’язання

1. **Inline-директива** в повідомленні (застосовується лише до цього повідомлення)
2. **Перевизначення для сесії** (задається надсиланням повідомлення лише з директивою)
3. **Глобальне типове значення** (`agents.defaults.elevatedDefault` у config)

## Доступність і allowlist-и

- **Глобальний gate**: `tools.elevated.enabled` (має бути `true`)
- **Allowlist відправника**: `tools.elevated.allowFrom` зі списками для кожного каналу
- **Gate для конкретного агента**: `agents.list[].tools.elevated.enabled` (може лише додатково обмежувати)
- **Allowlist для конкретного агента**: `agents.list[].tools.elevated.allowFrom` (відправник має відповідати і глобальному, і per-agent)
- **Discord fallback**: якщо `tools.elevated.allowFrom.discord` пропущено, як fallback використовується `channels.discord.allowFrom`
- **Усі gate-и мають пройти**; інакше elevated вважається недоступним

Формати записів allowlist:

| Префікс                 | З чим виконується збіг             |
| ----------------------- | ---------------------------------- |
| (без префікса)          | ID відправника, E.164 або поле From |
| `name:`                 | Відображуване ім’я відправника     |
| `username:`             | Username відправника               |
| `tag:`                  | Tag відправника                    |
| `id:`, `from:`, `e164:` | Явне націлювання на identity       |

## Чим elevated не керує

- **Tool policy**: якщо `exec` заборонено tool policy, elevated не може це перевизначити
- **Policy вибору host**: elevated не перетворює `auto` на вільне перевизначення між host-ами. Він використовує правила цілі exec, задані в config/сесії, вибираючи `node` лише тоді, коли ціль уже є `node`.
- **Окремо від `/exec`**: директива `/exec` змінює типові значення exec для сесії для авторизованих відправників і не потребує elevated mode

## Пов’язане

- [Exec tool](/uk/tools/exec) — виконання shell-команд
- [Exec approvals](/uk/tools/exec-approvals) — система approvals і allowlist
- [Sandboxing](/uk/gateway/sandboxing) — конфігурація sandbox
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
