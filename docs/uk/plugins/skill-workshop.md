---
read_when:
    - Ви хочете, щоб агенти перетворювали виправлення або повторно використовувані процедури на Skills робочого простору
    - Ви налаштовуєте процедурну пам’ять навичок
    - Ви налагоджуєте поведінку інструмента skill_workshop
    - Ви вирішуєте, чи ввімкнути автоматичне створення Skills
summary: Експериментальне захоплення багаторазових процедур як Skills робочого простору з переглядом, затвердженням, карантином і гарячим оновленням Skills
title: Plugin майстерні Skills
x-i18n:
    generated_at: "2026-05-07T15:12:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop є **експериментальним**. Він вимкнений за замовчуванням, його евристики захоплення та підказки рецензента можуть змінюватися між випусками, а автоматичні записи слід використовувати лише в довірених робочих просторах після попереднього перегляду виводу режиму очікування.

Skill Workshop — це процедурна пам’ять для workspace skills. Він дає змогу агенту перетворювати багаторазові робочі процеси, виправлення користувача, важко здобуті рішення та повторювані помилки на файли `SKILL.md` у:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Це відрізняється від довгострокової пам’яті:

- **Пам’ять** зберігає факти, уподобання, сутності та минулий контекст.
- **Skills** зберігають багаторазові процедури, яких агент має дотримуватися в майбутніх завданнях.
- **Skill Workshop** — це міст від корисного ходу до довготривалої workspace skill із перевірками безпеки та необов’язковим затвердженням.

Skill Workshop корисний, коли агент вивчає процедуру, наприклад:

- як перевіряти анімовані GIF-ресурси, отримані із зовнішніх джерел
- як замінювати ресурси скриншотів і перевіряти розміри
- як запускати специфічний для репозиторію сценарій QA
- як налагоджувати повторюваний збій провайдера
- як виправляти застарілу локальну нотатку робочого процесу

Він не призначений для:

- фактів на кшталт "the user likes blue"
- широкої автобіографічної пам’яті
- архівування необроблених транскриптів
- секретів, облікових даних або прихованого тексту підказок
- одноразових інструкцій, які не повторюватимуться

## Стан за замовчуванням

Bundled plugin є **експериментальним** і **вимкненим за замовчуванням**, якщо його явно не ввімкнено в `plugins.entries.skill-workshop`.

Маніфест plugin не встановлює `enabledByDefault: true`. Значення за замовчуванням `enabled: true` у схемі конфігурації plugin застосовується лише після того, як запис plugin уже вибрано та завантажено.

Експериментальний означає:

- plugin підтримується достатньо для opt-in тестування та dogfooding
- сховище пропозицій, пороги рецензента та евристики захоплення можуть розвиватися
- очікування затвердження є рекомендованим початковим режимом
- автоматичне застосування призначене для довірених персональних або робочих налаштувань, а не для спільних чи ворожих середовищ із великою кількістю вхідних даних

## Увімкнення

Мінімальна безпечна конфігурація:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

З цією конфігурацією:

- інструмент `skill_workshop` доступний
- явні багаторазові виправлення додаються в чергу як пропозиції, що очікують
- проходи рецензента на основі порогів можуть пропонувати оновлення skill
- жоден файл skill не записується, доки пропозицію, що очікує, не буде застосовано

Використовуйте автоматичні записи лише в довірених робочих просторах:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` усе ще використовує той самий сканер і шлях карантину. Він не застосовує пропозиції з критичними знахідками.

## Конфігурація

| Ключ                 | За замовчуванням | Діапазон / значення                        | Значення                                                             |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Вмикає plugin після завантаження запису plugin.                      |
| `autoCapture`        | `true`      | boolean                                     | Вмикає захоплення/перегляд після успішних ходів агента.              |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Додає пропозиції в чергу або автоматично записує безпечні пропозиції. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Вибирає захоплення явних виправлень, рецензента LLM, обидва варіанти або жоден. |
| `reviewInterval`     | `15`        | `1..200`                                    | Запускає рецензента після такої кількості успішних ходів.            |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Запускає рецензента після такої кількості спостережених викликів інструментів. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Тайм-аут для вбудованого запуску рецензента.                         |
| `maxPending`         | `50`        | `1..200`                                    | Максимум пропозицій, що очікують або перебувають у карантині, які зберігаються для кожного робочого простору. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Максимальний розмір згенерованого skill/support file.                |

Рекомендовані профілі:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Шляхи захоплення

Skill Workshop має три шляхи захоплення.

### Пропозиції інструментів

Модель може викликати `skill_workshop` напряму, коли бачить багаторазову процедуру або коли користувач просить її зберегти чи оновити skill.

Це найявніший шлях, і він працює навіть із `autoCapture: false`.

### Евристичне захоплення

Коли `autoCapture` увімкнено, а `reviewMode` має значення `heuristic` або `hybrid`, plugin сканує успішні ходи на наявність явних фраз виправлення від користувача:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Евристика створює пропозицію з останньої відповідної інструкції користувача. Вона використовує тематичні підказки, щоб вибирати назви skill для поширених робочих процесів:

- завдання з анімованими GIF -> `animated-gif-workflow`
- завдання зі скриншотами або ресурсами -> `screenshot-asset-workflow`
- завдання QA або сценаріїв -> `qa-scenario-workflow`
- завдання GitHub PR -> `github-pr-workflow`
- запасний варіант -> `learned-workflows`

Евристичне захоплення навмисно вузьке. Воно призначене для чітких виправлень і повторюваних процесних нотаток, а не для загального підсумовування транскрипта.

### Рецензент LLM

Коли `autoCapture` увімкнено, а `reviewMode` має значення `llm` або `hybrid`, plugin запускає компактного вбудованого рецензента після досягнення порогів.

Рецензент отримує:

- текст нещодавнього транскрипта, обмежений останніми 12 000 символами
- до 12 наявних workspace skills
- до 2 000 символів із кожної наявної skill
- інструкції лише у форматі JSON

Рецензент не має інструментів:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Рецензент повертає або `{ "action": "none" }`, або одну пропозицію. Поле `action` має значення `create`, `append` або `replace` - віддавайте перевагу `append`/`replace`, коли релевантна skill уже існує; використовуйте `create` лише коли жодна наявна skill не підходить.

Приклад `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` додає `section` + `body`. `replace` замінює `oldText` на `newText` у вказаній skill.

## Життєвий цикл пропозиції

Кожне згенероване оновлення стає пропозицією з:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- необов’язковим `agentId`
- необов’язковим `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` або `reviewer`
- `status`
- `change`
- необов’язковим `scanFindings`
- необов’язковим `quarantineReason`

Статуси пропозицій:

- `pending` - очікує затвердження
- `applied` - записано до `<workspace>/skills`
- `rejected` - відхилено оператором/моделлю
- `quarantined` - заблоковано критичними знахідками сканера

Стан зберігається для кожного робочого простору в каталозі стану Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Очікувані та ізольовані пропозиції дедуплікуються за назвою skill і payload
зміни. Сховище зберігає найновіші очікувані/ізольовані пропозиції до
`maxPending`.

## Довідник інструментів

Plugin реєструє один агентський інструмент:

```text
skill_workshop
```

### `status`

Підрахувати пропозиції за станом для активного робочого простору.

```json
{ "action": "status" }
```

Форма результату:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Перелічити очікувані пропозиції.

```json
{ "action": "list_pending" }
```

Щоб перелічити інший статус:

```json
{ "action": "list_pending", "status": "applied" }
```

Допустимі значення `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Перелічити ізольовані пропозиції.

```json
{ "action": "list_quarantine" }
```

Використовуйте це, коли автоматичне захоплення, здається, нічого не робить, а в журналах згадується
`skill-workshop: quarantined <skill>`.

### `inspect`

Отримати пропозицію за id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Створити пропозицію. З `approvalPolicy: "pending"` (стандартно) це ставить її в чергу замість запису.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

З `approvalPolicy: "pending"` значення `apply: true` все одно ставить пропозицію в чергу. Перегляньте її, а потім використайте дію
`apply` після схвалення.

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Застосувати очікувану пропозицію.

З `approvalPolicy: "pending"` ця дія запитує схвалення оператора перед записом
skill робочого простору.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` відхиляє ізольовані пропозиції:

```text
quarantined proposal cannot be applied
```

### `reject`

Позначити пропозицію як відхилену.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Записати допоміжний файл у наявний або запропонований каталог skill.

Дозволені каталоги підтримки верхнього рівня:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Приклад:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Файли підтримки мають область дії робочого простору, перевіряються за шляхом, обмежуються за байтами через
`maxSkillBytes`, скануються та записуються атомарно.

## Записи Skill

Skill Workshop записує лише в:

```text
<workspace>/skills/<normalized-skill-name>/
```

Назви Skill нормалізуються:

- переводяться в нижній регістр
- послідовності не `[a-z0-9_-]` стають `-`
- початкові/кінцеві неалфавітно-цифрові символи видаляються
- максимальна довжина становить 80 символів
- кінцева назва має відповідати `[a-z0-9][a-z0-9_-]{1,79}`

Для `create`:

- якщо Skill не існує, Skill Workshop записує новий `SKILL.md`
- якщо він уже існує, Skill Workshop додає тіло до `## Workflow`

Для `append`:

- якщо Skill існує, Skill Workshop додає текст до запитаного розділу
- якщо він не існує, Skill Workshop створює мінімальний Skill, а потім додає текст

Для `replace`:

- Skill уже має існувати
- `oldText` має бути присутній точно
- замінюється лише перший точний збіг

Усі записи атомарні й одразу оновлюють знімок Skills у пам’яті, тому
новий або оновлений Skill може стати видимим без перезапуску Gateway.

## Модель безпеки

Skill Workshop має сканер безпеки для згенерованого вмісту `SKILL.md` і файлів
підтримки.

Критичні виявлення ізолюють пропозиції:

| Ідентифікатор правила                 | Блокує вміст, який...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | каже агенту ігнорувати попередні/вищі інструкції                     |
| `prompt-injection-system`              | посилається на системні промпти, повідомлення розробника або приховані інструкції |
| `prompt-injection-tool`                | заохочує обходити дозволи/схвалення інструментів                     |
| `shell-pipe-to-shell`                  | містить `curl`/`wget`, передані через pipe у `sh`, `bash` або `zsh`   |
| `secret-exfiltration`                  | схоже, надсилає дані env/process env через мережу                     |

Попереджувальні виявлення зберігаються, але самі по собі не блокують:

| Ідентифікатор правила | Попереджає про...                 |
| -------------------- | -------------------------------- |
| `destructive-delete` | широкі команди стилю `rm -rf`    |
| `unsafe-permissions` | використання дозволів стилю `chmod 777` |

Ізольовані пропозиції:

- зберігають `scanFindings`
- зберігають `quarantineReason`
- з’являються в `list_quarantine`
- не можуть бути застосовані через `apply`

Щоб відновитися після ізольованої пропозиції, створіть нову безпечну пропозицію з
видаленим небезпечним вмістом. Не редагуйте JSON сховища вручну.

## Настанови щодо промпта

Коли ввімкнено, Skill Workshop вставляє короткий розділ промпта, який каже агенту
використовувати `skill_workshop` для довготривалої процедурної пам’яті.

Настанови наголошують на:

- процедурах, а не фактах/уподобаннях
- виправленнях користувача
- неочевидних успішних процедурах
- повторюваних пастках
- ремонті застарілих/слабких/неправильних Skill через append/replace
- збереженні повторно використовуваної процедури після довгих циклів інструментів або складних виправлень
- короткому наказовому тексті Skill
- відсутності дампів транскрипту

Текст режиму запису змінюється залежно від `approvalPolicy`:

- режим pending: ставити пропозиції в чергу; використовувати `apply` після явного схвалення
- режим auto: застосовувати безпечні оновлення workspace-skill, якщо `apply: false` натомість не ставить їх у чергу

## Витрати та поведінка під час виконання

Евристичне захоплення не викликає модель.

Перевірка LLM використовує вбудований запуск на активній/типовій моделі агента. Вона
порогова, тому типово не запускається на кожному ході.

Рецензент:

- використовує той самий налаштований контекст провайдера/моделі, коли він доступний
- повертається до стандартних значень агента під час виконання
- має `reviewTimeoutMs`
- використовує полегшений bootstrap-контекст
- не має інструментів
- нічого не записує напряму
- може лише створити пропозицію, яка проходить звичайний шлях сканера та
  схвалення/ізоляції

Якщо рецензент зазнає збою, перевищує час очікування або повертає недійсний JSON, Plugin записує
warning/debug повідомлення й пропускає цей прохід перевірки.

## Операційні шаблони

Використовуйте Skill Workshop, коли користувач каже:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

Хороший текст Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Поганий текст Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Причини, чому погану версію не слід зберігати:

- має форму транскрипту
- не є наказовою
- містить шумні одноразові деталі
- не каже наступному агенту, що робити

## Налагодження

Перевірте, чи Plugin завантажено:

```bash
openclaw plugins list --enabled
```

Перевірте кількість пропозицій із контексту агента/інструмента:

```json
{ "action": "status" }
```

Огляньте очікувані пропозиції:

```json
{ "action": "list_pending" }
```

Огляньте ізольовані пропозиції:

```json
{ "action": "list_quarantine" }
```

Поширені симптоми:

| Симптом                               | Імовірна причина                                                                    | Перевірка                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Інструмент недоступний                | Запис Plugin не ввімкнено                                                           | `plugins.entries.skill-workshop.enabled` and `openclaw plugins list` |
| Автоматична пропозиція не з’являється | `autoCapture: false`, `reviewMode: "off"` або пороги не досягнуто                   | Конфігурація, статус пропозицій, журнали Gateway                     |
| Евристика не захопила                 | Формулювання користувача не відповідало шаблонам виправлень                         | Використайте явний `skill_workshop.suggest` або ввімкніть LLM-рецензента |
| Рецензент не створив пропозицію       | Рецензент повернув `none`, недійсний JSON або перевищив час очікування              | Журнали Gateway, `reviewTimeoutMs`, пороги                           |
| Пропозицію не застосовано             | `approvalPolicy: "pending"`                                                         | `list_pending`, потім `apply`                                        |
| Пропозиція зникла з очікуваних        | Повторну пропозицію використано повторно, обрізано максимум очікуваних або її застосовано/відхилено/ізольовано | `status`, `list_pending` з фільтрами статусу, `list_quarantine`      |
| Файл Skill існує, але модель його пропускає | Знімок Skill не оновлено або gating Skill його виключає                             | статус `openclaw skills` і придатність Skill робочого простору       |

Релевантні журнали:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-сценарії

QA-сценарії з repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Запустіть детерміноване покриття:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Запустіть покриття рецензента:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Сценарій рецензента навмисно відокремлено, оскільки він вмикає
`reviewMode: "llm"` і виконує прохід вбудованого рецензента.

## Коли не вмикати автоматичне застосування

Уникайте `approvalPolicy: "auto"`, коли:

- робочий простір містить чутливі процедури
- агент працює з ненадійним введенням
- Skills спільно використовуються широкою командою
- ви ще налаштовуєте промпти або правила сканера
- модель часто обробляє ворожий веб-/email-вміст

Спочатку використовуйте режим pending. Перемикайтеся на режим auto лише після перегляду типу
Skills, які агент пропонує в цьому робочому просторі.

## Пов’язані документи

- [Skills](/uk/tools/skills)
- [Plugins](/uk/tools/plugin)
- [Тестування](/uk/reference/test)
