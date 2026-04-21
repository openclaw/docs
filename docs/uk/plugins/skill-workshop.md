---
read_when:
    - Ви хочете, щоб агенти перетворювали виправлення або багаторазово використовувані процедури на Skills робочого простору
    - Ви налаштовуєте пам’ять процедурних Skills
    - Ви налагоджуєте поведінку інструмента skill_workshop
    - Ви вирішуєте, чи вмикати автоматичне створення Skills
summary: Експериментальне фіксування багаторазово використовуваних процедур як навичок робочого простору з перевіркою, схваленням, карантином і гарячим оновленням Skills
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-21T20:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

Skill Workshop — **експериментальний**. Він вимкнений за замовчуванням, його
евристики фіксування та запити для рецензента можуть змінюватися між випусками, а автоматичні
записи слід використовувати лише в довірених робочих просторах після попереднього перегляду
виводу в режимі очікування схвалення.

Skill Workshop — це процедурна пам’ять для Skills робочого простору. Він дає змогу агенту перетворювати
багаторазово використовувані робочі процеси, виправлення від користувача, важко здобуті рішення та повторювані проблеми
на файли `SKILL.md` у каталозі:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Це відрізняється від довготривалої пам’яті:

- **Memory** зберігає факти, уподобання, сутності та минулий контекст.
- **Skills** зберігають багаторазово використовувані процедури, яких агент має дотримуватися в майбутніх завданнях.
- **Skill Workshop** — це міст від корисного ходу до довговічної навички робочого простору
  із перевірками безпеки та необов’язковим схваленням.

Skill Workshop корисний, коли агент вивчає процедуру, таку як:

- як перевіряти анімовані GIF-ресурси із зовнішніх джерел
- як замінювати ресурси зі знімками екрана та перевіряти розміри
- як запускати специфічний для репозиторію QA-сценарій
- як налагоджувати повторюваний збій provider
- як виправляти застарілу локальну примітку робочого процесу

Він не призначений для:

- фактів на кшталт «користувачеві подобається синій»
- широкої автобіографічної пам’яті
- архівування сирих транскриптів
- секретів, облікових даних або прихованого тексту запитів
- одноразових інструкцій, які не повторюватимуться

## Стан за замовчуванням

Вбудований plugin є **експериментальним** і **вимкненим за замовчуванням**, якщо його
явно не ввімкнено в `plugins.entries.skill-workshop`.

Маніфест plugin не встановлює `enabledByDefault: true`. Значення `enabled: true`
за замовчуванням усередині схеми конфігурації plugin застосовується лише після того, як запис plugin
уже було вибрано та завантажено.

Експериментальний статус означає:

- plugin достатньо підтримується для добровільного тестування та внутрішнього використання
- сховище пропозицій, пороги рецензування та евристики фіксування можуть розвиватися
- режим очікування схвалення є рекомендованим початковим режимом
- автоматичне застосування призначене для довірених персональних/робочих середовищ, а не для спільних або ворожих середовищ із великою кількістю вхідних даних

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

За такої конфігурації:

- інструмент `skill_workshop` доступний
- явні багаторазово використовувані виправлення ставляться в чергу як пропозиції, що очікують схвалення
- проходи рецензента на основі порогів можуть пропонувати оновлення Skills
- жоден файл Skill не записується, доки пропозицію, що очікує схвалення, не буде застосовано

Використовуйте автоматичний запис лише в довірених робочих просторах:

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
не застосовує пропозиції з критичними результатами перевірки.

## Конфігурація

| Ключ                 | За замовчуванням | Діапазон / значення                          | Значення                                                             |
| -------------------- | ---------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`           | boolean                                      | Вмикає plugin після завантаження запису plugin.                      |
| `autoCapture`        | `true`           | boolean                                      | Вмикає фіксування/рецензування після ходу на успішних ходах агента.  |
| `approvalPolicy`     | `"pending"`      | `"pending"`, `"auto"`                        | Ставити пропозиції в чергу або автоматично записувати безпечні.      |
| `reviewMode`         | `"hybrid"`       | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Вибирає явне фіксування виправлень, LLM-рецензента, обидва варіанти або жоден. |
| `reviewInterval`     | `15`             | `1..200`                                     | Запускати рецензента після такої кількості успішних ходів.           |
| `reviewMinToolCalls` | `8`              | `1..500`                                     | Запускати рецензента після такої кількості зафіксованих викликів інструментів. |
| `reviewTimeoutMs`    | `45000`          | `5000..180000`                               | Тайм-аут для вбудованого запуску рецензента.                         |
| `maxPending`         | `50`             | `1..200`                                     | Максимум пропозицій у стані очікування/карантину на робочий простір. |
| `maxSkillBytes`      | `40000`          | `1024..200000`                               | Максимальний розмір згенерованого файлу Skill/допоміжного файла.     |

Рекомендовані профілі:

```json5
// Консервативний: лише явне використання інструмента, без автоматичного фіксування.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Спочатку рецензування: фіксувати автоматично, але вимагати схвалення.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Довірена автоматизація: негайно записувати безпечні пропозиції.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Низька вартість: без виклику LLM-рецензента, лише явні фрази виправлень.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Шляхи фіксування

Skill Workshop має три шляхи фіксування.

### Пропозиції інструмента

Модель може напряму викликати `skill_workshop`, коли бачить багаторазово використовувану процедуру
або коли користувач просить її зберегти/оновити Skill.

Це найбільш явний шлях, і він працює навіть із `autoCapture: false`.

### Евристичне фіксування

Коли `autoCapture` увімкнено, а `reviewMode` має значення `heuristic` або `hybrid`, plugin
сканує успішні ходи на наявність явних фраз виправлення від користувача:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Евристика створює пропозицію на основі останньої відповідної інструкції користувача. Вона
використовує підказки теми для вибору назв Skills для поширених робочих процесів:

- завдання з анімованими GIF -> `animated-gif-workflow`
- завдання зі знімками екрана або ресурсами -> `screenshot-asset-workflow`
- завдання QA або сценаріїв -> `qa-scenario-workflow`
- завдання з GitHub PR -> `github-pr-workflow`
- резервний варіант -> `learned-workflows`

Евристичне фіксування навмисно вузьке. Воно призначене для чітких виправлень і
повторюваних приміток щодо процесу, а не для загального підсумовування транскриптів.

### LLM-рецензент

Коли `autoCapture` увімкнено, а `reviewMode` має значення `llm` або `hybrid`, plugin
запускає компактного вбудованого рецензента після досягнення порогів.

Рецензент отримує:

- текст нещодавнього транскрипту, обмежений останніми 12 000 символів
- до 12 наявних Skills робочого простору
- до 2 000 символів із кожного наявного Skill
- інструкції лише у форматі JSON

Рецензент не має інструментів:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Він може повернути:

```json
{ "action": "none" }
```

або одну пропозицію Skill:

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

Він також може додати до наявного Skill:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Або замінити точний текст у наявному Skill:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Надавайте перевагу `append` або `replace`, коли вже існує відповідний Skill. Використовуйте `create`
лише тоді, коли жоден наявний Skill не підходить.

## Життєвий цикл пропозиції

Кожне згенероване оновлення стає пропозицією з такими полями:

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
- необов’язкова `quarantineReason`

Стани пропозиції:

- `pending` — очікує схвалення
- `applied` — записана в `<workspace>/skills`
- `rejected` — відхилена оператором/моделлю
- `quarantined` — заблокована через критичні результати сканування

Стан зберігається окремо для кожного робочого простору в каталозі стану Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Пропозиції в стані очікування та карантину дедуплікуються за назвою Skill і payload
зміни. Сховище зберігає найновіші пропозиції в стані очікування/карантину в межах
`maxPending`.

## Довідка з інструмента

Plugin реєструє один інструмент агента:

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

Показати пропозиції, що очікують схвалення.

```json
{ "action": "list_pending" }
```

Щоб показати інший стан:

```json
{ "action": "list_pending", "status": "applied" }
```

Допустимі значення `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Показати пропозиції в карантині.

```json
{ "action": "list_quarantine" }
```

Використовуйте це, коли здається, що автоматичне фіксування нічого не робить, а в журналах згадується
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

Створити пропозицію. Із `approvalPolicy: "pending"` це за замовчуванням ставить її в чергу.

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

Примусово виконати безпечний запис:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Примусово залишити в стані очікування навіть за `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Додати до розділу:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Замінити точний текст:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Застосувати пропозицію, що очікує схвалення.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` відмовляється застосовувати пропозиції в карантині:

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

Записати допоміжний файл усередині каталогу наявного або запропонованого Skill.

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

Файли підтримки мають область робочого простору, проходять перевірку шляху, обмежуються за розміром байтів через
`maxSkillBytes`, скануються та записуються атомарно.

## Запис Skills

Skill Workshop записує лише в:

```text
<workspace>/skills/<normalized-skill-name>/
```

Назви Skills нормалізуються:

- переводяться в нижній регістр
- послідовності символів, що не належать до `[a-z0-9_-]`, замінюються на `-`
- початкові/кінцеві неалфавітно-цифрові символи видаляються
- максимальна довжина — 80 символів
- остаточна назва має відповідати шаблону `[a-z0-9][a-z0-9_-]{1,79}`

Для `create`:

- якщо Skill не існує, Skill Workshop записує новий `SKILL.md`
- якщо він уже існує, Skill Workshop додає вміст до `## Workflow`

Для `append`:

- якщо Skill існує, Skill Workshop додає вміст до запитаного розділу
- якщо його не існує, Skill Workshop створює мінімальний Skill, а потім додає вміст

Для `replace`:

- Skill уже має існувати
- `oldText` має бути присутнім у точному вигляді
- замінюється лише перший точний збіг

Усі записи є атомарними та негайно оновлюють знімок Skills у пам’яті, тому
новий або оновлений Skill може стати видимим без перезапуску Gateway.

## Модель безпеки

Skill Workshop має сканер безпеки для згенерованого вмісту `SKILL.md` і файлів
підтримки.

Критичні результати переводять пропозиції в карантин:

| Ідентифікатор правила                  | Блокує вміст, який...                                                |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | наказує агенту ігнорувати попередні/вищі інструкції                  |
| `prompt-injection-system`              | посилається на системні запити, повідомлення розробника або приховані інструкції |
| `prompt-injection-tool`                | заохочує обходити дозвіл/схвалення інструмента                       |
| `shell-pipe-to-shell`                  | містить `curl`/`wget`, передані через pipe у `sh`, `bash` або `zsh`  |
| `secret-exfiltration`                  | виглядає як надсилання даних env/process env мережею                 |

Попереджувальні результати зберігаються, але самі по собі не блокують:

| Ідентифікатор правила | Попереджає про...                 |
| --------------------- | --------------------------------- |
| `destructive-delete`  | широкі команди у стилі `rm -rf`   |
| `unsafe-permissions`  | використання дозволів у стилі `chmod 777` |

Пропозиції в карантині:

- зберігають `scanFindings`
- зберігають `quarantineReason`
- відображаються в `list_quarantine`
- не можуть бути застосовані через `apply`

Щоб відновитися після пропозиції в карантині, створіть нову безпечну пропозицію без
небезпечного вмісту. Не редагуйте JSON сховища вручну.

## Рекомендації щодо запитів

Коли ввімкнений, Skill Workshop додає короткий розділ запиту, який інструктує агента
використовувати `skill_workshop` для довговічної процедурної пам’яті.

Рекомендації наголошують на:

- процедурах, а не фактах/уподобаннях
- виправленнях від користувача
- неочевидних успішних процедурах
- повторюваних проблемах
- виправленні застарілих/надто коротких/неправильних Skills через append/replace
- збереженні багаторазово використовуваної процедури після довгих циклів інструментів або складних виправлень
- короткому наказовому тексті Skill
- відсутності дампів транскриптів

Текст режиму запису змінюється залежно від `approvalPolicy`:

- режим pending: ставити пропозиції в чергу; застосовувати лише після явного схвалення
- режим auto: застосовувати безпечні оновлення Skills робочого простору, коли вони явно багаторазово використовувані

## Вартість і поведінка під час виконання

Евристичне фіксування не викликає модель.

LLM-рецензування використовує вбудований запуск на активній/стандартній моделі агента. Воно
залежить від порогів, тому за замовчуванням не запускається на кожному ході.

Рецензент:

- використовує той самий налаштований контекст provider/model, коли він доступний
- інакше повертається до стандартних значень агента під час виконання
- має `reviewTimeoutMs`
- використовує легкий bootstrap-контекст
- не має інструментів
- нічого не записує напряму
- може лише створити пропозицію, яка проходить звичайний сканер та
  шлях схвалення/карантину

Якщо рецензент завершується помилкою, перевищує час очікування або повертає недійсний JSON, plugin записує
попереджувальне/налагоджувальне повідомлення в журнал і пропускає цей прохід рецензування.

## Типові шаблони використання

Використовуйте Skill Workshop, коли користувач каже:

- «наступного разу роби X»
- «відтепер надавай перевагу Y»
- «обов’язково перевіряй Z»
- «збережи це як робочий процес»
- «це зайняло багато часу; запам’ятай процес»
- «онови локальний Skill для цього»

Хороший текст Skill:

```markdown
## Workflow

- Перевірте, що URL GIF веде до `image/gif`.
- Підтвердьте, що файл має кілька кадрів.
- Зафіксуйте URL джерела, ліцензію та атрибуцію.
- Збережіть локальну копію, якщо ресурс постачатиметься разом із продуктом.
- Перевірте, що локальний ресурс відображається в цільовому UI, перш ніж давати остаточну відповідь.
```

Поганий текст Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Причини, чому погану версію не слід зберігати:

- має форму транскрипту
- не є наказовою
- містить шумні одноразові подробиці
- не пояснює наступному агенту, що робити

## Налагодження

Перевірте, чи завантажено plugin:

```bash
openclaw plugins list --enabled
```

Перевірте кількість пропозицій із контексту агента/інструмента:

```json
{ "action": "status" }
```

Перегляньте пропозиції, що очікують схвалення:

```json
{ "action": "list_pending" }
```

Перегляньте пропозиції в карантині:

```json
{ "action": "list_quarantine" }
```

Поширені симптоми:

| Симптом                               | Імовірна причина                                                                     | Перевірка                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Інструмент недоступний                | Запис plugin не ввімкнений                                                           | `plugins.entries.skill-workshop.enabled` і `openclaw plugins list`    |
| Автоматична пропозиція не з’являється | `autoCapture: false`, `reviewMode: "off"` або пороги не досягнуто                    | Конфігурація, стан пропозицій, журнали Gateway                        |
| Евристика не зафіксувала              | Формулювання користувача не відповідало шаблонам виправлень                          | Використайте явний `skill_workshop.suggest` або ввімкніть LLM-рецензента |
| Рецензент не створив пропозицію       | Рецензент повернув `none`, недійсний JSON або перевищив час очікування               | Журнали Gateway, `reviewTimeoutMs`, пороги                            |
| Пропозиція не застосовується          | `approvalPolicy: "pending"`                                                          | `list_pending`, потім `apply`                                         |
| Пропозиція зникла з pending           | Було повторно використано дублікат пропозиції, спрацювало обрізання max pending або її застосовано/відхилено/переведено в карантин | `status`, `list_pending` з фільтрами status, `list_quarantine` |
| Файл Skill існує, але модель його пропускає | Знімок Skills не оновився або gating Skills виключає його                        | стан `openclaw skills` і придатність Skill робочого простору          |

Відповідні журнали:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-сценарії

QA-сценарії з прив’язкою до репозиторію:

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

Сценарій рецензента навмисно винесений окремо, оскільки він вмикає
`reviewMode: "llm"` і перевіряє вбудований прохід рецензента.

## Коли не слід вмикати Auto Apply

Уникайте `approvalPolicy: "auto"`, коли:

- робочий простір містить чутливі процедури
- агент працює з недовіреним вхідним вмістом
- Skills спільно використовуються широкою командою
- ви все ще налаштовуєте запити або правила сканера
- модель часто обробляє ворожий вміст із web/email

Спочатку використовуйте режим pending. Перемикайтеся на режим auto лише після перегляду того, які
Skills агент пропонує в цьому робочому просторі.

## Пов’язана документація

- [Skills](/uk/tools/skills)
- [Plugins](/uk/tools/plugin)
- [Testing](/uk/reference/test)
