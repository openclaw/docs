---
read_when:
    - Додавання або змінення CLI моделей (models list/set/scan/aliases/fallbacks)
    - Зміна поведінки резервного вибору моделі або UX вибору
    - Оновлення проб сканування моделей (інструменти/зображення)
sidebarTitle: Models CLI
summary: 'CLI моделей: list, set, aliases, fallbacks, scan, status'
title: CLI моделей
x-i18n:
    generated_at: "2026-05-04T22:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Аварійне перемикання моделі" href="/uk/concepts/model-failover">
    Ротація профілів автентифікації, періоди охолодження та взаємодія з резервними варіантами.
  </Card>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers">
    Короткий огляд провайдерів і приклади.
  </Card>
  <Card title="Середовища виконання агентів" href="/uk/concepts/agent-runtimes">
    PI, Codex та інші середовища виконання циклу агента.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults">
    Ключі конфігурації моделей.
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
  <Step title="Аварійне перемикання автентифікації провайдера">
    Аварійне перемикання автентифікації відбувається всередині провайдера перед переходом до наступної моделі.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Пов’язані поверхні моделей">
    - `agents.defaults.models` — це allowlist/каталог моделей, які OpenClaw може використовувати (плюс псевдоніми).
    - `agents.defaults.imageModel` використовується **лише тоді, коли** основна модель не може приймати зображення.
    - `agents.defaults.pdfModel` використовується інструментом `pdf`. Якщо пропущено, інструмент повертається до `agents.defaults.imageModel`, а потім до розв’язаної моделі сеансу/типової моделі.
    - `agents.defaults.imageGenerationModel` використовується спільною можливістю генерації зображень. Якщо пропущено, `image_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - `agents.defaults.musicGenerationModel` використовується спільною можливістю генерації музики. Якщо пропущено, `music_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - `agents.defaults.videoGenerationModel` використовується спільною можливістю генерації відео. Якщо пропущено, `video_generate` все одно може визначити типовий провайдер із підтриманою автентифікацією. Спершу він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
    - Типові параметри окремого агента можуть перевизначати `agents.defaults.model` через `agents.list[].model` плюс прив’язки (див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Джерело вибору та поведінка резервного переходу

Те саме `provider/model` може означати різні речі залежно від того, звідки воно взялося:

- Налаштовані типові значення (`agents.defaults.model.primary` і основні моделі конкретних агентів) є звичайною відправною точкою та використовують `agents.defaults.model.fallbacks`.
- Автоматичні резервні вибори — це тимчасовий стан відновлення. Вони зберігаються з `modelOverrideSource: "auto"`, щоб наступні ходи могли продовжувати використовувати ланцюг резервних варіантів без попередньої перевірки відомо несправної основної моделі.
- Вибори користувача в сеансі є точними. `/model`, вибирач моделі, `session_status(model=...)` і `sessions.patch` зберігають `modelOverrideSource: "user"`; якщо вибраний провайдер/модель недоступний, OpenClaw явно завершується з помилкою, а не переходить до іншої налаштованої моделі.
- Cron `--model` / корисне навантаження `model` — це основна модель для окремого завдання. Вона все одно використовує налаштовані резервні варіанти, якщо завдання не надає явне корисне навантаження `fallbacks` (використовуйте `fallbacks: []` для строгого запуску cron).
- Вибирачі типової моделі CLI та allowlist поважають `models.mode: "replace"`, показуючи явні `models.providers.*.models` замість завантаження повного вбудованого каталогу.
- Вибирач моделей Control UI запитує в Gateway налаштований вигляд моделей: `agents.defaults.models`, якщо присутній, інакше явні `models.providers.*.models` плюс провайдери з придатною автентифікацією. Повний вбудований каталог зарезервовано для явних переглядових подань, таких як `models.list` із `view: "all"` або `openclaw models list --all`.

## Коротка політика моделей

- Задайте основною найпотужнішу модель найновішого покоління, доступну вам.
- Використовуйте резервні варіанти для завдань, чутливих до вартості/затримки, і чатів із нижчим рівнем ризику.
- Для агентів із підтримкою інструментів або недовірених вхідних даних уникайте старіших/слабших рівнів моделей.

## Онбординг (рекомендовано)

Якщо ви не хочете редагувати конфігурацію вручну, запустіть онбординг:

```bash
openclaw onboard
```

Він може налаштувати модель + автентифікацію для поширених провайдерів, зокрема **підписку OpenAI Code (Codex)** (OAuth) та **Anthropic** (API-ключ або Claude CLI).

## Ключі конфігурації (огляд)

- `agents.defaults.model.primary` і `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` і `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` і `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` і `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` і `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + псевдоніми + параметри провайдера)
- `models.providers` (власні провайдери, записані в `models.json`)

<Note>
Посилання на моделі нормалізуються до нижнього регістру. Псевдоніми провайдерів на кшталт `z.ai/*` нормалізуються до `zai/*`.

Приклади конфігурації провайдерів (зокрема OpenCode) наведено в [OpenCode](/uk/providers/opencode).
</Note>

### Безпечні редагування allowlist

Використовуйте додавальні записи, коли оновлюєте `agents.defaults.models` вручну:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Правила захисту від перезапису">
    `openclaw config set` захищає мапи моделей/провайдерів від випадкового перезапису. Звичайне присвоєння об’єкта до `agents.defaults.models`, `models.providers` або `models.providers.<id>.models` відхиляється, якщо воно видалило б наявні записи. Використовуйте `--merge` для додавальних змін; використовуйте `--replace` лише тоді, коли надане значення має стати повним цільовим значенням.

    Інтерактивне налаштування провайдера та `openclaw configure --section model` також зливають вибори в межах провайдера з наявним allowlist, тому додавання Codex, Ollama або іншого провайдера не видаляє непов’язані записи моделей. Configure зберігає наявний `agents.defaults.model.primary`, коли автентифікацію провайдера застосовано повторно. Явні команди встановлення типового значення, як-от `openclaw models auth login --provider <id> --set-default` і `openclaw models set <model>`, усе одно замінюють `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Модель не дозволена" (і чому відповіді зупиняються)

Якщо `agents.defaults.models` задано, він стає **allowlist** для `/model` і перевизначень сеансу. Коли користувач вибирає модель, якої немає в цьому allowlist, OpenClaw повертає:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Це відбувається **до** створення звичайної відповіді, тому може здаватися, що повідомлення "не відповіло". Щоб виправити це, потрібно або:

- Додати модель до `agents.defaults.models`, або
- Очистити allowlist (видалити `agents.defaults.models`), або
- Вибрати модель із `/model list`.

</Warning>

Коли відхилена команда містила перевизначення середовища виконання, як-от `/model openai/gpt-5.5 --runtime codex`, спершу виправте allowlist, а потім повторіть ту саму команду `/model ... --runtime ...`. Для нативного виконання Codex вибрана модель усе ще `openai/gpt-5.5`; середовище виконання `codex` вибирає harness і окремо використовує автентифікацію Codex.

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

Ви можете перемикати моделі для поточного сеансу без перезапуску:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Поведінка вибирача">
    - `/model` (і `/model list`) — це компактний нумерований вибирач (родина моделей + доступні провайдери).
    - У Discord `/model` і `/models` відкривають інтерактивний вибирач із випадаючими списками провайдера й моделі та кроком Submit.
    - У Telegram вибори вибирача `/models` мають область дії сеансу; вони не змінюють сталий типовий параметр агента в `openclaw.json`.
    - `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату.
    - `/model <#>` вибирає з цього вибирача.

  </Accordion>
  <Accordion title="Збереження та живе перемикання">
    - `/model` негайно зберігає новий вибір сеансу.
    - Якщо агент простоює, наступний запуск одразу використовує нову модель.
    - Якщо запуск уже активний, OpenClaw позначає живе перемикання як очікуване й перезапускається з новою моделлю лише в чистій точці повтору.
    - Якщо активність інструментів або виведення відповіді вже почалися, очікуване перемикання може залишатися в черзі до пізнішої можливості повтору або наступного ходу користувача.
    - Вибране користувачем посилання `/model` є строгим для цього сеансу: якщо вибраний провайдер/модель недоступний, відповідь явно завершується з помилкою, а не мовчки відповідає з `agents.defaults.model.fallbacks`. Це відрізняється від налаштованих типових значень і основних моделей завдань cron, які все одно можуть використовувати ланцюги резервних варіантів.
    - `/model status` — це докладний вигляд (кандидати автентифікації та, якщо налаштовано, endpoint провайдера `baseUrl` + режим `api`).

  </Accordion>
  <Accordion title="Розбір посилань">
    - Посилання на моделі розбираються поділом за **першим** `/`. Використовуйте `provider/model`, коли вводите `/model <ref>`.
    - Якщо сам ID моделі містить `/` (у стилі OpenRouter), потрібно вказати префікс провайдера (приклад: `/model openrouter/moonshotai/kimi-k2`).
    - Якщо ви пропустите провайдера, OpenClaw розв’язує введення в такому порядку:
      1. збіг псевдоніма
      2. унікальний збіг налаштованого провайдера для цього точного id моделі без префікса
      3. застарілий резервний перехід до налаштованого типового провайдера — якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw натомість повертається до першого налаштованого провайдера/моделі, щоб не показувати застаріле типове значення видаленого провайдера.
  </Accordion>
</AccordionGroup>

Повна поведінка команд/конфігурація: [Slash-команди](/uk/tools/slash-commands).

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

Показує налаштовані/доступні для автентифікації моделі за замовчуванням. Корисні прапорці:

<ParamField path="--all" type="boolean">
  Повний каталог. Містить вбудовані статичні рядки каталогу, що належать провайдеру, ще до налаштування автентифікації, тож подання лише для виявлення можуть показувати моделі, недоступні, доки ви не додасте відповідні облікові дані провайдера.
</ParamField>
<ParamField path="--local" type="boolean">
  Лише локальні провайдери.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Фільтрувати за id провайдера, наприклад `moonshot`. Відображувані мітки з інтерактивних засобів вибору не приймаються.
</ParamField>
<ParamField path="--plain" type="boolean">
  Одна модель на рядок.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний вивід.
</ParamField>

### `models status`

Показує розв’язану основну модель, резервні варіанти, модель зображень і огляд автентифікації налаштованих провайдерів. Також показує стан завершення терміну дії OAuth для профілів, знайдених у сховищі автентифікації (за замовчуванням попереджає в межах 24 годин). `--plain` друкує лише розв’язану основну модель.

<AccordionGroup>
  <Accordion title="Поведінка автентифікації та перевірки">
    - Стан OAuth показується завжди (і включається у вивід `--json`). Якщо налаштований провайдер не має облікових даних, `models status` друкує розділ **Відсутня автентифікація**.
    - JSON містить `auth.oauth` (вікно попередження + профілі) і `auth.providers` (ефективна автентифікація для кожного провайдера, зокрема облікові дані з env). `auth.oauth` — це лише стан профілів у сховищі автентифікації; провайдери лише з env там не з’являються.
    - Використовуйте `--check` для автоматизації (код виходу `1`, коли відсутні/прострочені, `2`, коли скоро завершиться термін дії).
    - Використовуйте `--probe` для живих перевірок автентифікації; рядки перевірки можуть надходити з профілів автентифікації, облікових даних env або `models.json`.
    - Якщо явний `auth.order.<provider>` пропускає збережений профіль, перевірка повідомляє `excluded_by_auth_order` замість спроби використати його. Якщо автентифікація існує, але для цього провайдера не можна розв’язати модель, придатну для перевірки, перевірка повідомляє `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Вибір автентифікації залежить від провайдера/облікового запису. Для постійно ввімкнених хостів Gateway ключі API зазвичай найпередбачуваніші; також підтримуються повторне використання Claude CLI та наявні профілі Anthropic OAuth/токенів.
</Note>

Приклад (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Сканування (безкоштовні моделі OpenRouter)

`openclaw models scan` перевіряє **каталог безкоштовних моделей** OpenRouter і може додатково перевіряти моделі на підтримку інструментів і зображень.

<ParamField path="--no-probe" type="boolean">
  Пропустити живі перевірки (лише метадані).
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
  Установити `agents.defaults.model.primary` на перший вибір.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Установити `agents.defaults.imageModel.primary` на перший вибір зображення.
</ParamField>

<Note>
Каталог OpenRouter `/models` є публічним, тому сканування лише метаданих може перелічити безкоштовних кандидатів без ключа. Перевірка та інференс усе одно потребують ключа API OpenRouter (з профілів автентифікації або `OPENROUTER_API_KEY`). Якщо ключ недоступний, `openclaw models scan` повертається до виводу лише метаданих і залишає конфігурацію без змін. Використовуйте `--no-probe`, щоб явно запросити режим лише метаданих.
</Note>

Результати сканування ранжуються за:

1. Підтримкою зображень
2. Затримкою інструментів
3. Розміром контексту
4. Кількістю параметрів

Вхідні дані:

- Список OpenRouter `/models` (фільтр `:free`)
- Живі перевірки потребують ключа API OpenRouter з профілів автентифікації або `OPENROUTER_API_KEY` (див. [Змінні середовища](/uk/help/environment))
- Необов’язкові фільтри: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Елементи керування запитами/перевірками: `--timeout`, `--concurrency`

Коли живі перевірки виконуються в TTY, ви можете інтерактивно вибрати резервні варіанти. У неінтерактивному режимі передайте `--yes`, щоб прийняти типові значення. Результати лише метаданих мають інформаційний характер; `--set-default` і `--set-image` потребують живих перевірок, щоб OpenClaw не налаштував непридатну для використання модель OpenRouter без ключа.

## Реєстр моделей (`models.json`)

Користувацькі провайдери в `models.providers` записуються в `models.json` у каталозі агента (за замовчуванням `~/.openclaw/agents/<agentId>/agent/models.json`). Цей файл об’єднується за замовчуванням, якщо `models.mode` не встановлено на `replace`.

<AccordionGroup>
  <Accordion title="Пріоритет режиму об’єднання">
    Пріоритет режиму об’єднання для відповідних ID провайдерів:

    - Непорожній `baseUrl`, уже присутній у `models.json` агента, має перевагу.
    - Непорожній `apiKey` у `models.json` агента має перевагу лише тоді, коли цей провайдер не керується SecretRef у поточному контексті конфігурації/профілю автентифікації.
    - Значення `apiKey` провайдера, керованого SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження розв’язаних секретів.
    - Значення заголовків провайдера, керованого SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
    - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` конфігурації.
    - Інші поля провайдера оновлюються з конфігурації та нормалізованих даних каталогу.

  </Accordion>
</AccordionGroup>

<Note>
Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних значень секретів часу виконання. Це застосовується щоразу, коли OpenClaw повторно генерує `models.json`, зокрема в шляхах, керованих командами, як-от `openclaw agent`.
</Note>

## Пов’язане

- [Середовища виконання агентів](/uk/concepts/agent-runtimes) — PI, Codex та інші середовища виконання циклу агента
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделі
- [Генерація зображень](/uk/tools/image-generation) — конфігурація моделі зображень
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover) — ланцюжки резервних варіантів
- [Провайдери моделей](/uk/concepts/model-providers) — маршрутизація провайдерів і автентифікація
- [Генерація музики](/uk/tools/music-generation) — конфігурація музичної моделі
- [Генерація відео](/uk/tools/video-generation) — конфігурація відеомоделі
