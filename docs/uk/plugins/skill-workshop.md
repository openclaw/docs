---
read_when:
    - Ви хочете, щоб агенти перетворювали виправлення або повторно використовувані процедури на workspace Skills
    - Ви налаштовуєте процедурну пам’ять Skills
    - Ви налагоджуєте поведінку tool `skill_workshop`
    - Ви вирішуєте, чи вмикати автоматичне створення Skills
summary: Експериментальне захоплення повторно використовуваних процедур як workspace Skills із review, approval, quarantine і гарячим оновленням Skills
title: Plugin майстерні Skills
x-i18n:
    generated_at: "2026-04-23T21:04:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop — **експериментальна** функція. Вона типово вимкнена, її евристики
захоплення та prompts reviewer можуть змінюватися між випусками, а автоматичні
записи слід використовувати лише в довірених робочих просторах після попереднього перегляду
виводу в режимі pending.

Skill Workshop — це процедурна пам’ять для workspace Skills. Вона дає змогу агенту перетворювати
повторно використовувані робочі процеси, виправлення від користувача, важко здобуті рішення та
типові підводні камені на файли `SKILL.md` у:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Це відрізняється від довготривалої пам’яті:

- **Memory** зберігає факти, уподобання, сутності та попередній контекст.
- **Skills** зберігають повторно використовувані процедури, яких агент має дотримуватися в майбутніх завданнях.
- **Skill Workshop** — це місток від корисного ходу до стійкого workspace
  Skill, із перевірками безпеки та необов’язковим схваленням.

Skill Workshop корисний, коли агент вивчає процедуру, наприклад:

- як перевіряти externally sourced анімовані GIF-ресурси
- як замінювати ресурси скриншотів і перевіряти розміри
- як запускати QA-сценарій, специфічний для repo
- як налагоджувати повторюваний збій provider
- як виправляти застарілу локальну нотатку робочого процесу

Він не призначений для:

- фактів на кшталт «користувачу подобається синій»
- широкої автобіографічної пам’яті
- архівації сирих транскриптів
- секретів, облікових даних або прихованого тексту prompt
- одноразових інструкцій, які не повторяться

## Типовий стан

Вбудований Plugin є **експериментальним** і **типово вимкненим**, доки його не
ввімкнено явно в `plugins.entries.skill-workshop`.

Маніфест Plugin не задає `enabledByDefault: true`. Типове значення `enabled: true`
усередині схеми конфігурації Plugin застосовується лише після того, як запис Plugin уже
було вибрано й завантажено.

Експериментальний означає:

- Plugin достатньо підтримується для opt-in тестування та dogfooding
- зберігання пропозицій, пороги reviewer і евристики захоплення можуть еволюціонувати
- рекомендований початковий режим — pending approval
- auto apply призначений для довірених персональних/workspace конфігурацій, а не для спільних або ворожих середовищ із великим обсягом вхідних даних

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

- tool `skill_workshop` доступний
- явні повторно використовувані виправлення ставляться в чергу як pending proposals
- reviewer-перевірки на основі порогів можуть пропонувати оновлення Skills
- жоден файл Skill не записується, доки pending proposal не буде застосовано

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

`approvalPolicy: "auto"` усе одно використовує той самий scanner і шлях quarantine. Він
не застосовує proposals із критичними findings.

## Конфігурація

| Ключ                 | Типове значення | Діапазон / значення                           | Значення                                                            |
| -------------------- | --------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`          | boolean                                       | Вмикає Plugin після завантаження запису Plugin.                     |
| `autoCapture`        | `true`          | boolean                                       | Вмикає post-turn capture/review після успішних ходів агента.        |
| `approvalPolicy`     | `"pending"`     | `"pending"`, `"auto"`                         | Ставити proposals у чергу або автоматично записувати безпечні proposals. |
| `reviewMode`         | `"hybrid"`      | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`   | Вибирає явне захоплення виправлень, reviewer LLM, обидва варіанти або жоден. |
| `reviewInterval`     | `15`            | `1..200`                                      | Запускати reviewer після такої кількості успішних ходів.            |
| `reviewMinToolCalls` | `8`             | `1..500`                                      | Запускати reviewer після такої кількості спостережених викликів tools. |
| `reviewTimeoutMs`    | `45000`         | `5000..180000`                                | Тайм-аут для вбудованого запуску reviewer.                          |
| `maxPending`         | `50`            | `1..200`                                      | Максимум pending/quarantined proposals на workspace.                |
| `maxSkillBytes`      | `40000`         | `1024..200000`                                | Максимальний розмір згенерованого файла skill/support.              |

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

### Пропозиції через tool

Модель може викликати `skill_workshop` безпосередньо, коли бачить повторно використовувану процедуру
або коли користувач просить її зберегти/оновити Skill.

Це найявніший шлях, і він працює навіть з `autoCapture: false`.

### Евристичне захоплення

Коли `autoCapture` увімкнено, а `reviewMode` має значення `heuristic` або `hybrid`,
Plugin сканує успішні ходи на явні фрази виправлення від користувача:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Евристика створює proposal з останньої відповідної інструкції користувача. Вона
використовує topic hints для вибору назв Skills для типових робочих процесів:

- завдання з анімованими GIF -> `animated-gif-workflow`
- завдання зі скриншотами або ресурсами -> `screenshot-asset-workflow`
- завдання з QA або сценаріями -> `qa-scenario-workflow`
- завдання з GitHub PR -> `github-pr-workflow`
- резервний варіант -> `learned-workflows`

Евристичне захоплення навмисно вузьке. Воно призначене для чітких виправлень і
повторюваних нотаток процесу, а не для загального підсумовування транскриптів.

### LLM reviewer

Коли `autoCapture` увімкнено, а `reviewMode` має значення `llm` або `hybrid`, Plugin
запускає компактний вбудований reviewer після досягнення порогів.

Reviewer отримує:

- текст недавнього транскрипту, обмежений останніми 12 000 символів
- до 12 наявних workspace Skills
- до 2 000 символів з кожного наявного Skill
- інструкції лише у форматі JSON

Reviewer не має tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Reviewer повертає або `{ "action": "none" }`, або одну proposal. Поле `action` має значення `create`, `append` або `replace` — надавайте перевагу `append`/`replace`, коли відповідний Skill уже існує; використовуйте `create`, лише коли жоден наявний Skill не підходить.

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

`append` додає `section` + `body`. `replace` замінює `oldText` на `newText` у вказаному Skill.

## Життєвий цикл proposal

Кожне згенероване оновлення стає proposal з такими полями:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- необов’язковий `agentId`
- необов’язковий `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` або `reviewer`
- `status`
- `change`
- необов’язкові `scanFindings`
- необов’язковий `quarantineReason`

Статуси proposal:

- `pending` - очікує схвалення
- `applied` - записано в `<workspace>/skills`
- `rejected` - відхилено оператором/моделлю
- `quarantined` - заблоковано критичними findings scanner

Стан зберігається окремо для кожного workspace у каталозі стану Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Pending і quarantined proposals дедуплікуються за назвою Skill і payload
зміни. Сховище зберігає найновіші pending/quarantined proposals у межах
`maxPending`.

## Довідник по tool

Plugin реєструє один agent tool:

```text
skill_workshop
```

### `status`

Порахувати proposals за станом для активного workspace.

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

Перелічити pending proposals.

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

Перелічити quarantined proposals.

```json
{ "action": "list_quarantine" }
```

Використовуйте це, коли здається, що автоматичне захоплення нічого не робить, а в логах згадується
`skill-workshop: quarantined <skill>`.

### `inspect`

Отримати proposal за id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Створити proposal. За `approvalPolicy: "pending"` (типово) це ставить її в чергу, а не записує.

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
  <Accordion title="Примусово виконати безпечний запис (apply: true)">

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

  <Accordion title="Примусово залишити pending за auto policy (apply: false)">

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

  <Accordion title="Додати до названого розділу">

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

Застосувати pending proposal.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` відмовляється застосовувати quarantined proposals:

```text
quarantined proposal cannot be applied
```

### `reject`

Позначити proposal як rejected.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Записати допоміжний файл всередині каталогу наявного або запропонованого Skill.

Дозволені каталоги верхнього рівня для допоміжних файлів:

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

Допоміжні файли мають область дії workspace, перевіряються за шляхом, обмежуються за байтами через
`maxSkillBytes`, скануються й записуються атомарно.

## Записи Skills

Skill Workshop записує лише в:

```text
<workspace>/skills/<normalized-skill-name>/
```

Назви Skills нормалізуються:

- переводяться в нижній регістр
- послідовності символів, що не входять до `[a-z0-9_-]`, перетворюються на `-`
- початкові/кінцеві неалфавітно-цифрові символи видаляються
- максимальна довжина — 80 символів
- фінальна назва має відповідати `[a-z0-9][a-z0-9_-]{1,79}`

Для `create`:

- якщо Skill не існує, Skill Workshop записує новий `SKILL.md`
- якщо він уже існує, Skill Workshop додає body до `## Workflow`

Для `append`:

- якщо Skill існує, Skill Workshop додає в запитаний розділ
- якщо не існує, Skill Workshop створює мінімальний Skill, а потім додає в нього

Для `replace`:

- Skill уже має існувати
- `oldText` має бути присутнім у точному вигляді
- замінюється лише перший точний збіг

Усі записи атомарні й негайно оновлюють знімок Skills у пам’яті, тож
новий або оновлений Skill може стати видимим без перезапуску Gateway.

## Модель безпеки

Skill Workshop має safety scanner для згенерованого вмісту `SKILL.md` і допоміжних
файлів.

Критичні findings переводять proposals у quarantine:

| Rule id                                | Блокує вміст, який...                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | наказує агенту ігнорувати попередні/вищі за пріоритетом інструкції     |
| `prompt-injection-system`              | посилається на system prompts, developer messages або приховані інструкції |
| `prompt-injection-tool`                | заохочує обходити permission/approval для tools                        |
| `shell-pipe-to-shell`                  | містить `curl`/`wget`, передані через pipe у `sh`, `bash` або `zsh`    |
| `secret-exfiltration`                  | схоже на спробу надіслати env/process env дані через мережу            |

Попереджувальні findings зберігаються, але самі по собі не блокують:

| Rule id              | Попереджає про...                  |
| -------------------- | ---------------------------------- |
| `destructive-delete` | широкі команди в стилі `rm -rf`    |
| `unsafe-permissions` | використання дозволів у стилі `chmod 777` |

Quarantined proposals:

- зберігають `scanFindings`
- зберігають `quarantineReason`
- відображаються в `list_quarantine`
- не можуть бути застосовані через `apply`

Щоб відновитися після quarantined proposal, створіть нову безпечну proposal, з якої
прибрано небезпечний вміст. Не редагуйте JSON сховища вручну.

## Вказівки для prompt

Коли Skill Workshop увімкнено, він додає короткий розділ prompt, який каже агенту
використовувати `skill_workshop` для стійкої процедурної пам’яті.

Ці вказівки наголошують на:

- процедурах, а не фактах/уподобаннях
- виправленнях від користувача
- неочевидних успішних процедурах
- повторюваних підводних каменях
- виправленні застарілих/слабких/неправильних Skills через append/replace
- збереженні повторно використовуваної процедури після довгих циклів tools або складних виправлень
- короткому імперативному тексті Skill
- відсутності зливів транскриптів

Текст режиму запису змінюється залежно від `approvalPolicy`:

- режим pending: ставити suggestions у чергу; застосовувати лише після явного схвалення
- режим auto: застосовувати безпечні оновлення workspace Skills, коли їхня повторна корисність очевидна

## Вартість і поведінка runtime

Евристичне захоплення не викликає модель.

LLM review використовує вбудований run на активній/типовій моделі агента. Це
порігозалежний механізм, тому типово він не запускається на кожному ході.

Reviewer:

- використовує той самий налаштований контекст provider/model, коли це можливо
- резервно використовує типові значення runtime агента
- має `reviewTimeoutMs`
- використовує легковагий bootstrap-контекст
- не має tools
- нічого не записує напряму
- може лише видати proposal, яка проходить звичайний scanner і
  шлях approval/quarantine

Якщо reviewer завершується помилкою, тайм-аутом або повертає невалідний JSON, Plugin записує
попередження/повідомлення debug у лог і пропускає цей review pass.

## Робочі шаблони

Використовуйте Skill Workshop, коли користувач каже:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

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

Причини, чому поганий варіант не слід зберігати:

- має форму транскрипту
- не є імперативним
- містить шумні одноразові деталі
- не каже наступному агенту, що робити

## Налагодження

Перевірте, чи завантажено Plugin:

```bash
openclaw plugins list --enabled
```

Перевірте кількість proposals із контексту agent/tool:

```json
{ "action": "status" }
```

Перегляньте pending proposals:

```json
{ "action": "list_pending" }
```

Перегляньте quarantined proposals:

```json
{ "action": "list_quarantine" }
```

Поширені симптоми:

| Симптом                              | Ймовірна причина                                                                  | Що перевірити                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool недоступний                     | Запис Plugin не ввімкнено                                                         | `plugins.entries.skill-workshop.enabled` і `openclaw plugins list`   |
| Автоматична proposal не з’являється  | `autoCapture: false`, `reviewMode: "off"` або пороги не досягнуто                 | Config, статус proposal, логи Gateway                                |
| Евристика не спрацювала              | Формулювання користувача не збіглося з шаблонами виправлень                      | Використайте явний `skill_workshop.suggest` або ввімкніть reviewer LLM |
| Reviewer не створив proposal         | Reviewer повернув `none`, невалідний JSON або спрацював тайм-аут                 | Логи Gateway, `reviewTimeoutMs`, пороги                              |
| Proposal не застосовується           | `approvalPolicy: "pending"`                                                       | `list_pending`, потім `apply`                                        |
| Proposal зникла з pending            | Було повторно використано duplicate proposal, спрацювало обрізання max pending або її застосовано/відхилено/quarantined | `status`, `list_pending` з фільтрами status, `list_quarantine` |
| Файл Skill існує, але модель його не бачить | Знімок Skill не оновився або gating Skill його виключає                         | `openclaw skills` status і придатність workspace Skill               |

Релевантні логи:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-сценарії

QA-сценарії, що підтримуються repo:

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

Запустіть покриття reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Сценарій reviewer навмисно винесено окремо, оскільки він вмикає
`reviewMode: "llm"` і перевіряє вбудований reviewer pass.

## Коли не варто вмикати auto apply

Уникайте `approvalPolicy: "auto"`, коли:

- workspace містить чутливі процедури
- агент працює з недовіреним вводом
- Skills спільно використовуються широкою командою
- ви ще налаштовуєте prompts або правила scanner
- модель часто обробляє ворожий web/email-контент

Спочатку використовуйте режим pending. Перемикайтеся на режим auto лише після перегляду
того типу Skills, які агент пропонує в цьому workspace.

## Пов’язані документи

- [Skills](/uk/tools/skills)
- [Plugins](/uk/tools/plugin)
- [Testing](/uk/reference/test)
