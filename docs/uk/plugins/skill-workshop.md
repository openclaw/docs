---
read_when:
    - Ви хочете, щоб агенти перетворювали виправлення або повторно використовувані процедури на Skills робочого простору
    - Ви налаштовуєте процедурну пам’ять навичок
    - Ви налагоджуєте поведінку інструмента skill_workshop
    - Ви вирішуєте, чи ввімкнути автоматичне створення Skills
summary: Експериментальна фіксація багаторазових процедур як Skills робочого простору з перевіркою, схваленням, карантином і гарячим оновленням Skills
title: Plugin майстерні навичок
x-i18n:
    generated_at: "2026-05-06T03:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop є **експериментальним**. Він вимкнений за замовчуванням, його евристики захоплення
та підказки для рецензента можуть змінюватися між релізами, а автоматичні
записи слід використовувати лише в довірених робочих просторах після попереднього перегляду
виводу pending-mode.

Skill Workshop — це процедурна пам’ять для навичок робочого простору. Він дає агенту змогу перетворювати
повторно використовувані робочі процеси, виправлення користувача, важко здобуті рішення та повторювані пастки
на файли `SKILL.md` у:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Це відрізняється від довгострокової пам’яті:

- **Пам’ять** зберігає факти, уподобання, сутності та минулий контекст.
- **Skills** зберігають повторно використовувані процедури, яких агент має дотримуватися в майбутніх завданнях.
- **Skill Workshop** — це міст від корисного ходу до сталої навички робочого простору
  з перевірками безпеки та необов’язковим схваленням.

Skill Workshop корисний, коли агент вивчає процедуру, як-от:

- як перевіряти зовнішньо отримані анімовані GIF-ресурси
- як замінювати ресурси знімків екрана та перевіряти розміри
- як запускати специфічний для репозиторію QA-сценарій
- як налагоджувати повторюваний збій провайдера
- як виправляти застарілу нотатку локального робочого процесу

Він не призначений для:

- фактів на кшталт "користувачу подобається синій"
- широкої автобіографічної пам’яті
- архівування сирих транскриптів
- секретів, облікових даних або прихованого тексту підказок
- одноразових інструкцій, які не повторюватимуться

## Стан за замовчуванням

Вбудований Plugin є **експериментальним** і **вимкнений за замовчуванням**, якщо його
явно не ввімкнено в `plugins.entries.skill-workshop`.

Маніфест Plugin не встановлює `enabledByDefault: true`. Значення `enabled: true`
за замовчуванням у схемі конфігурації Plugin застосовується лише після того, як запис Plugin уже
було вибрано й завантажено.

Експериментальний означає:

- Plugin достатньо підтримується для тестування з явним увімкненням і внутрішнього використання
- сховище пропозицій, пороги рецензента та евристики захоплення можуть розвиватися
- очікування схвалення є рекомендованим початковим режимом
- автоматичне застосування призначене для довірених особистих налаштувань або робочих просторів, а не для спільних чи ворожих
  середовищ з великою кількістю вхідних даних

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
- явні повторно використовувані виправлення ставляться в чергу як очікувані пропозиції
- проходи рецензента на основі порогів можуть пропонувати оновлення навичок
- жоден файл навички не записується, доки очікувану пропозицію не буде застосовано

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

`approvalPolicy: "auto"` усе одно використовує той самий сканер і шлях карантину. Він
не застосовує пропозиції з критичними знахідками.

## Конфігурація

| Ключ                  | За замовчуванням | Діапазон / значення                         | Значення                                                             |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Вмикає Plugin після завантаження запису Plugin.                      |
| `autoCapture`        | `true`      | boolean                                     | Вмикає захоплення/рецензування після ходу для успішних ходів агента. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Ставити пропозиції в чергу або автоматично записувати безпечні пропозиції. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Вибирає захоплення явних виправлень, LLM-рецензента, обидва варіанти або жоден. |
| `reviewInterval`     | `15`        | `1..200`                                    | Запускати рецензента після такої кількості успішних ходів.           |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Запускати рецензента після такої кількості спостережених викликів інструментів. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Тайм-аут для вбудованого запуску рецензента.                         |
| `maxPending`         | `50`        | `1..200`                                    | Максимальна кількість очікуваних/карантинних пропозицій, що зберігаються на робочий простір. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Максимальний розмір згенерованого файлу навички/підтримки.           |

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

### Пропозиції інструменту

Модель може напряму викликати `skill_workshop`, коли бачить повторно використовувану процедуру
або коли користувач просить її зберегти/оновити навичку.

Це найявніший шлях, і він працює навіть із `autoCapture: false`.

### Евристичне захоплення

Коли `autoCapture` увімкнено, а `reviewMode` дорівнює `heuristic` або `hybrid`, Plugin
сканує успішні ходи на явні фрази виправлення від користувача:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Евристика створює пропозицію з останньої відповідної інструкції користувача. Вона
використовує тематичні підказки, щоб вибирати назви навичок для поширених робочих процесів:

- завдання з анімованими GIF -> `animated-gif-workflow`
- завдання зі знімками екрана або ресурсами -> `screenshot-asset-workflow`
- завдання QA або сценаріїв -> `qa-scenario-workflow`
- завдання GitHub PR -> `github-pr-workflow`
- резервний варіант -> `learned-workflows`

Евристичне захоплення навмисно вузьке. Воно призначене для чітких виправлень і
повторюваних нотаток процесу, а не для загального підсумовування транскриптів.

### LLM-рецензент

Коли `autoCapture` увімкнено, а `reviewMode` дорівнює `llm` або `hybrid`, Plugin
запускає компактного вбудованого рецензента після досягнення порогів.

Рецензент отримує:

- текст останнього транскрипту, обмежений останніми 12 000 символів
- до 12 наявних навичок робочого простору
- до 2 000 символів із кожної наявної навички
- інструкції лише у форматі JSON

Рецензент не має інструментів:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Рецензент повертає або `{ "action": "none" }`, або одну пропозицію. Поле `action` має значення `create`, `append` або `replace` - надавайте перевагу `append`/`replace`, коли відповідна навичка вже існує; використовуйте `create` лише тоді, коли жодна наявна навичка не підходить.

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

`append` додає `section` + `body`. `replace` замінює `oldText` на `newText` у названій навичці.

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
- необов’язковими `scanFindings`
- необов’язковим `quarantineReason`

Статуси пропозицій:

- `pending` - очікує затвердження
- `applied` - записано до `<workspace>/skills`
- `rejected` - відхилено оператором/моделлю
- `quarantined` - заблоковано критичними знахідками сканера

Стан зберігається окремо для кожного робочого простору в каталозі стану Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Очікувані та ізольовані пропозиції дедуплікуються за назвою skill і
payload зміни. Сховище зберігає найновіші очікувані/ізольовані пропозиції до
`maxPending`.

## Довідник інструмента

Plugin реєструє один інструмент агента:

```text
skill_workshop
```

### `status`

Порахувати пропозиції за станом для активного робочого простору.

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

Показати список очікуваних пропозицій.

```json
{ "action": "list_pending" }
```

Щоб показати список для іншого стану:

```json
{ "action": "list_pending", "status": "applied" }
```

Допустимі значення `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Показати список ізольованих пропозицій.

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

Створити пропозицію. З `approvalPolicy: "pending"` (типово) вона ставиться в чергу замість запису.

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
  <Accordion title="Примусовий безпечний запис (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Примусово залишити очікування за автоматичної політики (apply: false)">

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

  <Accordion title="Додати до іменованого розділу">

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

  <Accordion title="Замінити точний текст">

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` відмовляється застосовувати ізольовані пропозиції:

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

Записати допоміжний файл усередині наявного або запропонованого каталогу skill.

Дозволені допоміжні каталоги верхнього рівня:

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

Імена Skill нормалізуються:

- переводяться в нижній регістр
- послідовності символів не з `[a-z0-9_-]` стають `-`
- початкові/кінцеві неалфавітно-цифрові символи видаляються
- максимальна довжина становить 80 символів
- кінцева назва має відповідати `[a-z0-9][a-z0-9_-]{1,79}`

Для `create`:

- якщо Skill не існує, Skill Workshop записує новий `SKILL.md`
- якщо він уже існує, Skill Workshop додає тіло до `## Workflow`

Для `append`:

- якщо Skill існує, Skill Workshop додає вміст до запитаного розділу
- якщо він не існує, Skill Workshop створює мінімальний Skill, а потім додає вміст

Для `replace`:

- Skill уже має існувати
- `oldText` має бути наявним точно
- замінюється лише перший точний збіг

Усі записи атомарні й одразу оновлюють знімок Skills у пам’яті, тому
новий або оновлений Skill може стати видимим без перезапуску Gateway.

## Модель безпеки

Skill Workshop має сканер безпеки для згенерованого вмісту `SKILL.md` і файлів
підтримки.

Критичні знахідки поміщають пропозиції в карантин:

| Ідентифікатор правила                 | Блокує вміст, який...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | наказує агенту ігнорувати попередні/вищі інструкції                  |
| `prompt-injection-system`              | посилається на системні промпти, повідомлення розробника або приховані інструкції |
| `prompt-injection-tool`                | заохочує обходити дозвіл/затвердження інструментів                   |
| `shell-pipe-to-shell`                  | містить `curl`/`wget`, передані через pipe в `sh`, `bash` або `zsh`   |
| `secret-exfiltration`                  | схоже, надсилає дані env/process env через мережу                    |

Попереджувальні знахідки зберігаються, але самі по собі не блокують:

| Ідентифікатор правила | Попереджає про...                |
| -------------------- | -------------------------------- |
| `destructive-delete` | широкі команди стилю `rm -rf`    |
| `unsafe-permissions` | використання дозволів стилю `chmod 777` |

Пропозиції в карантині:

- зберігають `scanFindings`
- зберігають `quarantineReason`
- з’являються в `list_quarantine`
- не можуть бути застосовані через `apply`

Щоб відновитися після пропозиції в карантині, створіть нову безпечну пропозицію з
видаленим небезпечним вмістом. Не редагуйте JSON сховища вручну.

## Настанови для промптів

Коли ввімкнено, Skill Workshop вставляє короткий розділ промпта, який каже агенту
використовувати `skill_workshop` для довготривалої процедурної пам’яті.

Настанови наголошують на:

- процедурах, а не фактах/уподобаннях
- виправленнях від користувача
- неочевидних успішних процедурах
- повторюваних помилках
- виправленні застарілих/тонких/хибних Skill через append/replace
- збереженні повторно використовуваної процедури після довгих циклів інструментів або складних виправлень
- короткому наказовому тексті Skill
- відсутності дампів стенограми

Текст режиму запису змінюється залежно від `approvalPolicy`:

- режим pending: ставити пропозиції в чергу; застосовувати лише після явного затвердження
- режим auto: застосовувати безпечні оновлення Skill робочого простору, коли вони явно придатні для повторного використання

## Витрати та поведінка під час виконання

Евристичне захоплення не викликає модель.

LLM-рецензування використовує вбудований запуск на активній/типовій моделі агента. Воно
порогове, тому за замовчуванням не запускається на кожному ході.

Рецензент:

- використовує той самий налаштований контекст провайдера/моделі, коли доступно
- повертається до типових значень агента під час виконання
- має `reviewTimeoutMs`
- використовує полегшений початковий контекст
- не має інструментів
- нічого не записує напряму
- може лише створити пропозицію, яка проходить звичайний шлях сканера та
  затвердження/карантину

Якщо рецензент завершується з помилкою, перевищує час очікування або повертає недійсний JSON, Plugin записує
попереджувальне/налагоджувальне повідомлення й пропускає цей прохід рецензування.

## Робочі патерни

Використовуйте Skill Workshop, коли користувач каже:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

Добрий текст Skill:

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

- має форму стенограми
- не є наказовою
- містить шумні одноразові деталі
- не каже наступному агенту, що робити

## Налагодження

Перевірте, чи Plugin завантажено:

```bash
openclaw plugins list --enabled
```

Перевірте кількість пропозицій з контексту агента/інструмента:

```json
{ "action": "status" }
```

Перегляньте пропозиції в очікуванні:

```json
{ "action": "list_pending" }
```

Перегляньте пропозиції в карантині:

```json
{ "action": "list_quarantine" }
```

Поширені симптоми:

| Симптом                               | Імовірна причина                                                                    | Перевірка                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Інструмент недоступний                | Запис Plugin не ввімкнено                                                           | `plugins.entries.skill-workshop.enabled` і `openclaw plugins list`   |
| Автоматична пропозиція не з’являється | `autoCapture: false`, `reviewMode: "off"` або пороги не досягнуто                   | Конфігурація, статус пропозицій, журнали Gateway                     |
| Евристика не захопила                 | Формулювання користувача не збіглося з патернами виправлення                        | Використайте явний `skill_workshop.suggest` або ввімкніть LLM-рецензента |
| Рецензент не створив пропозицію       | Рецензент повернув `none`, недійсний JSON або перевищив час очікування              | Журнали Gateway, `reviewTimeoutMs`, пороги                           |
| Пропозицію не застосовано             | `approvalPolicy: "pending"`                                                         | `list_pending`, потім `apply`                                        |
| Пропозиція зникла з очікування        | Повторну пропозицію використано повторно, спрацювало обрізання max pending або її застосували/відхилили/помістили в карантин | `status`, `list_pending` із фільтрами статусу, `list_quarantine`      |
| Файл Skill існує, але модель його пропускає | Знімок Skill не оновлено або gating Skill його виключає                             | статус `openclaw skills` і придатність Skill робочого простору       |

Релевантні журнали:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-сценарії

QA-сценарії з репозиторію:

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

Сценарій рецензента навмисно окремий, бо він вмикає
`reviewMode: "llm"` і виконує вбудований прохід рецензента.

## Коли не вмикати автоматичне застосування

Уникайте `approvalPolicy: "auto"`, коли:

- робочий простір містить чутливі процедури
- агент працює з недовіреним введенням
- Skills спільно використовуються широкою командою
- ви все ще налаштовуєте промпти або правила сканера
- модель часто обробляє ворожий веб-/email-вміст

Спочатку використовуйте режим pending. Перемикайтеся в режим auto лише після перегляду типу
Skills, які агент пропонує в цьому робочому просторі.

## Пов’язані документи

- [Skills](/uk/tools/skills)
- [Plugins](/uk/tools/plugin)
- [Тестування](/uk/reference/test)
