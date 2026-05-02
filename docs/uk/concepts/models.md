---
read_when:
    - Додавання або змінення CLI для моделей (models list/set/scan/aliases/fallbacks)
    - Зміна поведінки резервного переходу моделі або UX вибору
    - Оновлення зондів сканування моделей (інструменти/зображення)
sidebarTitle: Models CLI
summary: 'CLI моделей: список, встановлення, псевдоніми, резервні варіанти, сканування, статус'
title: CLI моделей
x-i18n:
    generated_at: "2026-05-02T02:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Відмовостійке перемикання моделей" href="/uk/concepts/model-failover">
    Ротація профілів автентифікації, періоди очікування та як це взаємодіє з резервними варіантами.
  </Card>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers">
    Короткий огляд провайдерів і приклади.
  </Card>
  <Card title="Середовища виконання агентів" href="/uk/concepts/agent-runtimes">
    PI, Codex та інші середовища виконання циклу агента.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults">
    Ключі конфігурації моделі.
  </Card>
</CardGroup>

Посилання на моделі вибирають провайдера й модель. Зазвичай вони не вибирають низькорівневе середовище виконання агента. Наприклад, `openai/gpt-5.5` може запускатися через звичайний шлях провайдера OpenAI або через середовище виконання app-server Codex, залежно від `agents.defaults.agentRuntime.id`. У режимі середовища виконання Codex посилання `openai/gpt-*` не означає оплату за API-ключем; автентифікація може надходити з облікового запису Codex або профілю автентифікації `openai-codex`. Див. [Середовища виконання агентів](/uk/concepts/agent-runtimes).

## Як працює вибір моделі

OpenClaw вибирає моделі в такому порядку:

<Steps>
  <Step title="Основна модель">
    `agents.defaults.model.primary` (або `agents.defaults.model`).
  </Step>
  <Step title="Резервні варіанти">
    `agents.defaults.model.fallbacks` (за порядком).
  </Step>
  <Step title="Відмовостійке перемикання автентифікації провайдера">
    Відмовостійке перемикання автентифікації відбувається всередині провайдера перед переходом до наступної моделі.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Пов’язані поверхні моделей">
    - `agents.defaults.models` — це allowlist/каталог моделей, які OpenClaw може використовувати (плюс псевдоніми).
    - `agents.defaults.imageModel` використовується **лише коли** основна модель не може приймати зображення.
    - `agents.defaults.pdfModel` використовується інструментом `pdf`. Якщо його не вказано, інструмент переходить до `agents.defaults.imageModel`, а потім до розв’язаної моделі сесії/моделі за замовчуванням.
    - `agents.defaults.imageGenerationModel` використовується спільною можливістю генерації зображень. Якщо його не вказано, `image_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - `agents.defaults.musicGenerationModel` використовується спільною можливістю генерації музики. Якщо його не вказано, `music_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - `agents.defaults.videoGenerationModel` використовується спільною можливістю генерації відео. Якщо його не вказано, `video_generate` усе ще може вивести стандартного провайдера, підкріпленого автентифікацією. Спершу він пробує поточного стандартного провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - Стандартні значення для окремого агента можуть перевизначати `agents.defaults.model` через `agents.list[].model` плюс прив’язки (див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Джерело вибору й поведінка резервного переходу

Однакове `provider/model` може означати різні речі залежно від того, звідки воно походить:

- Налаштовані стандартні значення (`agents.defaults.model.primary` та специфічні для агента основні моделі) є звичайною відправною точкою й використовують `agents.defaults.model.fallbacks`.
- Автоматичні резервні вибори — це тимчасовий стан відновлення. Вони зберігаються з `modelOverrideSource: "auto"`, щоб наступні ходи могли далі використовувати резервний ланцюжок без попереднього зондування відомої проблемної основної моделі.
- Вибори користувача для сесії є точними. `/model`, засіб вибору моделі, `session_status(model=...)` і `sessions.patch` зберігають `modelOverrideSource: "user"`; якщо вибраний provider/model недоступний, OpenClaw завершується видимою помилкою замість переходу до іншої налаштованої моделі.
- Cron `--model` / payload `model` — це основна модель для окремого завдання. Вона все одно використовує налаштовані резервні варіанти, якщо завдання не надає явні payload `fallbacks` (використовуйте `fallbacks: []` для суворого запуску cron).
- CLI default-model і засоби вибору allowlist поважають `models.mode: "replace"`, показуючи явні `models.providers.*.models` замість завантаження повного вбудованого каталогу.
- Засіб вибору моделі в Control UI запитує в Gateway налаштоване подання моделей: `agents.defaults.models`, якщо воно наявне, інакше явні `models.providers.*.models` плюс провайдери з придатною автентифікацією. Повний вбудований каталог зарезервований для явних подань перегляду, таких як `models.list` з `view: "all"` або `openclaw models list --all`.

## Коротка політика моделей

- Задайте основною найпотужнішу доступну вам модель останнього покоління.
- Використовуйте резервні варіанти для завдань, чутливих до вартості/затримки, і чатів із нижчими ризиками.
- Для агентів з увімкненими інструментами або недовірених вхідних даних уникайте старіших/слабших рівнів моделей.

## Онбординг (рекомендовано)

Якщо ви не хочете редагувати конфігурацію вручну, запустіть онбординг:

```bash
openclaw onboard
```

Він може налаштувати модель + автентифікацію для поширених провайдерів, зокрема **підписку OpenAI Code (Codex)** (OAuth) і **Anthropic** (API-ключ або Claude CLI).

## Ключі конфігурації (огляд)

- `agents.defaults.model.primary` і `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` і `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` і `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` і `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` і `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + псевдоніми + параметри провайдера)
- `models.providers` (користувацькі провайдери, записані в `models.json`)

<Note>
Посилання на моделі нормалізуються до нижнього регістру. Псевдоніми провайдерів на кшталт `z.ai/*` нормалізуються до `zai/*`.

Приклади конфігурації провайдерів (включно з OpenCode) містяться в [OpenCode](/uk/providers/opencode).
</Note>

### Безпечні редагування allowlist

Використовуйте адитивні записи, коли оновлюєте `agents.defaults.models` вручну:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Правила захисту від перезапису">
    `openclaw config set` захищає мапи моделей/провайдерів від випадкових перезаписів. Звичайне присвоєння об’єкта до `agents.defaults.models`, `models.providers` або `models.providers.<id>.models` відхиляється, якщо воно вилучило б наявні записи. Використовуйте `--merge` для адитивних змін; використовуйте `--replace` лише тоді, коли надане значення має стати повним цільовим значенням.

    Інтерактивне налаштування провайдера й `openclaw configure --section model` також зливають вибори в межах провайдера з наявним allowlist, тож додавання Codex, Ollama або іншого провайдера не видаляє непов’язані записи моделей. Configure зберігає наявний `agents.defaults.model.primary`, коли автентифікацію провайдера застосовують повторно. Явні команди встановлення стандартного значення, такі як `openclaw models auth login --provider <id> --set-default` і `openclaw models set <model>`, усе ще замінюють `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Модель не дозволена" (і чому відповіді зупиняються)

Якщо `agents.defaults.models` задано, він стає **allowlist** для `/model` і перевизначень сесії. Коли користувач вибирає модель, якої немає в цьому allowlist, OpenClaw повертає:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Це відбувається **до** створення звичайної відповіді, тому може здаватися, що повідомлення "не відповіло". Виправлення: зробіть одне з такого:

- Додайте модель до `agents.defaults.models`, або
- Очистьте allowlist (видаліть `agents.defaults.models`), або
- Виберіть модель із `/model list`.

</Warning>

Для локальних/GGUF-моделей зберігайте повне посилання з префіксом провайдера в allowlist,
наприклад `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` або
точний provider/model, показаний `openclaw models list --provider <provider>`.
Самих локальних імен файлів або відображуваних назв недостатньо, коли allowlist
активний.

Приклад конфігурації allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Перемикання моделей у чаті (`/model`)

Ви можете перемикати моделі для поточної сесії без перезапуску:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Поведінка засобу вибору">
    - `/model` (і `/model list`) — це компактний нумерований засіб вибору (родина моделі + доступні провайдери).
    - У Discord `/model` і `/models` відкривають інтерактивний засіб вибору з випадаючими списками провайдера й моделі та кроком Submit.
    - `/models add` застарілий і тепер повертає повідомлення про застарілість замість реєстрації моделей із чату.
    - `/model <#>` вибирає з цього засобу вибору.

  </Accordion>
  <Accordion title="Збереження та живе перемикання">
    - `/model` одразу зберігає новий вибір сесії.
    - Якщо агент бездіє, наступний запуск одразу використовує нову модель.
    - Якщо запуск уже активний, OpenClaw позначає живе перемикання як очікуване й перезапускає в нову модель лише в чистій точці повторної спроби.
    - Якщо активність інструментів або виведення відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
    - Вибране користувачем посилання `/model` є суворим для цієї сесії: якщо вибраний provider/model недоступний, відповідь завершується видимою помилкою замість тихого використання `agents.defaults.model.fallbacks`. Це відрізняється від налаштованих стандартних значень і основних моделей cron-завдань, які все ще можуть використовувати резервні ланцюжки.
    - `/model status` — це детальне подання (кандидати автентифікації та, коли налаштовано, endpoint провайдера `baseUrl` + режим `api`).

  </Accordion>
  <Accordion title="Розбір посилань">
    - Посилання на моделі розбираються поділом за **першим** `/`. Використовуйте `provider/model`, коли вводите `/model <ref>`.
    - Якщо сам ID моделі містить `/` (у стилі OpenRouter), потрібно включити префікс провайдера (приклад: `/model openrouter/moonshotai/kimi-k2`).
    - Якщо ви пропускаєте провайдера, OpenClaw розв’язує введення в такому порядку:
      1. збіг псевдоніма
      2. унікальний збіг налаштованого провайдера для цього точного id моделі без префікса
      3. застарілий резервний перехід до налаштованого стандартного провайдера — якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw натомість переходить до першого налаштованого provider/model, щоб не показувати застаріле стандартне значення вилученого провайдера.
  </Accordion>
</AccordionGroup>

Повна поведінка/конфігурація команд: [Slash-команди](/uk/tools/slash-commands).

## Команди CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (без підкоманди) — це скорочення для `models status`.

### `models list`

За замовчуванням показує налаштовані/доступні через автентифікацію моделі. Корисні прапорці:

<ParamField path="--all" type="boolean">
  Повний каталог. Містить статичні рядки каталогу вбудованих моделей, що належать провайдерам, ще до налаштування автентифікації, тому подання лише для виявлення можуть показувати моделі, недоступні, доки ви не додасте відповідні облікові дані провайдера.
</ParamField>
<ParamField path="--local" type="boolean">
  Лише локальні провайдери.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Фільтрувати за ідентифікатором провайдера, наприклад `moonshot`. Відображувані мітки з інтерактивних вибирачів не приймаються.
</ParamField>
<ParamField path="--plain" type="boolean">
  Одна модель на рядок.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний вивід.
</ParamField>

### `models status`

Показує визначену основну модель, резервні варіанти, модель зображень і огляд автентифікації налаштованих провайдерів. Також показує статус завершення терміну дії OAuth для профілів, знайдених у сховищі автентифікації (за замовчуванням попереджає за 24 год). `--plain` друкує лише визначену основну модель.

<AccordionGroup>
  <Accordion title="Поведінка автентифікації та перевірок">
    - Статус OAuth показується завжди (і включається у вивід `--json`). Якщо налаштований провайдер не має облікових даних, `models status` друкує розділ **Відсутня автентифікація**.
    - JSON містить `auth.oauth` (вікно попередження + профілі) і `auth.providers` (ефективна автентифікація для кожного провайдера, включно з обліковими даними з env). `auth.oauth` показує лише стан профілів зі сховища автентифікації; провайдери лише з env там не з'являються.
    - Використовуйте `--check` для автоматизації (код виходу `1`, коли бракує або завершився термін дії, `2`, коли термін дії скоро завершиться).
    - Використовуйте `--probe` для live-перевірок автентифікації; рядки перевірок можуть надходити з профілів автентифікації, облікових даних env або `models.json`.
    - Якщо явний `auth.order.<provider>` пропускає збережений профіль, перевірка повідомляє `excluded_by_auth_order` замість спроби використати його. Якщо автентифікація існує, але для цього провайдера не можна визначити модель, придатну до перевірки, перевірка повідомляє `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Вибір автентифікації залежить від провайдера й облікового запису. Для постійно ввімкнених хостів Gateway ключі API зазвичай найпередбачуваніші; також підтримується повторне використання Claude CLI та наявні профілі Anthropic OAuth/token.
</Note>

Приклад (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Сканування (безкоштовні моделі OpenRouter)

`openclaw models scan` перевіряє **каталог безкоштовних моделей** OpenRouter і може додатково перевіряти моделі на підтримку інструментів і зображень.

<ParamField path="--no-probe" type="boolean">
  Пропустити live-перевірки (лише метадані).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Мінімальний розмір параметрів (у мільярдах).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Пропустити старіші моделі.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Фільтр за префіксом провайдера.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Розмір списку резервних варіантів.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Установити `agents.defaults.model.primary` на перший вибраний варіант.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Установити `agents.defaults.imageModel.primary` на перший вибраний варіант зображень.
</ParamField>

<Note>
Каталог OpenRouter `/models` є публічним, тому сканування лише метаданих може показувати безкоштовних кандидатів без ключа. Перевірки й інференс усе одно потребують ключа API OpenRouter (з профілів автентифікації або `OPENROUTER_API_KEY`). Якщо ключ недоступний, `openclaw models scan` повертається до виводу лише метаданих і залишає конфігурацію без змін. Використовуйте `--no-probe`, щоб явно запросити режим лише метаданих.
</Note>

Результати сканування ранжуються за:

1. Підтримкою зображень
2. Затримкою інструментів
3. Розміром контексту
4. Кількістю параметрів

Вхідні дані:

- Список OpenRouter `/models` (фільтр `:free`)
- Live-перевірки потребують ключа API OpenRouter з профілів автентифікації або `OPENROUTER_API_KEY` (див. [Змінні середовища](/uk/help/environment))
- Необов'язкові фільтри: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Елементи керування запитами/перевірками: `--timeout`, `--concurrency`

Коли live-перевірки виконуються в TTY, ви можете інтерактивно вибирати резервні варіанти. У неінтерактивному режимі передайте `--yes`, щоб прийняти значення за замовчуванням. Результати лише за метаданими є інформаційними; `--set-default` і `--set-image` потребують live-перевірок, щоб OpenClaw не налаштував непридатну до використання модель OpenRouter без ключа.

## Реєстр моделей (`models.json`)

Користувацькі провайдери в `models.providers` записуються в `models.json` у каталозі агента (за замовчуванням `~/.openclaw/agents/<agentId>/agent/models.json`). Цей файл за замовчуванням об'єднується, якщо `models.mode` не встановлено в `replace`.

<AccordionGroup>
  <Accordion title="Пріоритет режиму об'єднання">
    Пріоритет режиму об'єднання для відповідних ідентифікаторів провайдерів:

    - Непорожній `baseUrl`, уже наявний в агентському `models.json`, має перевагу.
    - Непорожній `apiKey` в агентському `models.json` має перевагу лише тоді, коли цей провайдер не керується SecretRef у поточному контексті конфігурації/профілю автентифікації.
    - Значення `apiKey` провайдера, керованого SecretRef, оновлюються з вихідних маркерів (`ENV_VAR_NAME` для посилань env, `secretref-managed` для посилань file/exec) замість збереження визначених секретів.
    - Значення заголовків провайдера, керованого SecretRef, оновлюються з вихідних маркерів (`secretref-env:ENV_VAR_NAME` для посилань env, `secretref-managed` для посилань file/exec).
    - Порожні або відсутні агентські `apiKey`/`baseUrl` повертаються до `models.providers` з конфігурації.
    - Інші поля провайдера оновлюються з конфігурації та нормалізованих даних каталогу.

  </Accordion>
</AccordionGroup>

<Note>
Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка вихідної конфігурації (до визначення), а не з визначених значень runtime-секретів. Це застосовується щоразу, коли OpenClaw регенерує `models.json`, зокрема для шляхів, керованих командами, як-от `openclaw agent`.
</Note>

## Пов'язане

- [Середовища виконання агентів](/uk/concepts/agent-runtimes) — PI, Codex та інші середовища виконання агентського циклу
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Генерація зображень](/uk/tools/image-generation) — конфігурація моделей зображень
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover) — ланцюжки резервних варіантів
- [Провайдери моделей](/uk/concepts/model-providers) — маршрутизація провайдерів і автентифікація
- [Генерація музики](/uk/tools/music-generation) — конфігурація моделей музики
- [Генерація відео](/uk/tools/video-generation) — конфігурація моделей відео
