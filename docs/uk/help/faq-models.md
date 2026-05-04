---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження резервного перемикання моделей / «Не спрацювала жодна модель»
    - Розуміння профілів автентифікації та керування ними
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові налаштування моделей, вибір, псевдоніми, перемикання, аварійне перемикання та профілі автентифікації'
title: 'Поширені запитання: моделі та автентифікація'
x-i18n:
    generated_at: "2026-05-04T22:20:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf06266926cecc06d8799cb17f42d96cdaa09ad83c20e8d4dcc3bcccbd840abc
    source_path: help/faq-models.md
    workflow: 16
---

  Питання й відповіді про моделі та профілі автентифікації. Про налаштування, сесії, Gateway, канали й
  усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Моделі: стандартні значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    Моделі вказуються як `provider/model` (приклад: `openai/gpt-5.5` або `openai-codex/gpt-5.5`). Якщо ви пропустите постачальника, OpenClaw спочатку спробує псевдонім, потім унікальний збіг налаштованого постачальника для цього точного ідентифікатора моделі, і лише після цього повернеться до налаштованого постачальника за замовчуванням як застарілого шляху сумісності. Якщо цей постачальник більше не надає налаштовану модель за замовчуванням, OpenClaw повертається до першої налаштованої пари постачальник/модель, замість показу застарілого значення постачальника, який було вилучено. Утім, вам варто **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване значення за замовчуванням:** використовуйте найсильнішу модель найновішого покоління, доступну у вашому стеку постачальників.
    **Для агентів з інструментами або недовіреним введенням:** надавайте перевагу потужності моделі, а не вартості.
    **Для звичайного чату з низькими ризиками:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для роботи з високими ризиками, а дешевшу
    модель — для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів для
    паралелізації довгих завдань (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Важливе попередження: слабші або надмірно квантовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без очищення конфігурації?">
    Використовуйте **команди моделі** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об'єктом, якщо ви не маєте наміру замінити всю конфігурацію.
    Для редагувань через RPC спочатку перегляньте за допомогою `config.schema.lookup` і віддавайте перевагу `config.patch`. Дані lookup надають нормалізований шлях, коротку документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можна використовувати самостійно розгорнуті моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо також потрібні хмарні моделі, запустіть `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Нотатки:

    - `Cloud + Local` дає вам хмарні моделі разом із вашими локальними моделями Ollama
    - хмарні моделі на кшталт `kimi-k2.5:cloud` не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все одно хочете малі моделі, увімкніть ізоляцію та суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Постачальники моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо постачальника немає.
    - Перевірте поточне runtime-налаштування на кожному gateway за допомогою `openclaw models status`.
    - Для агентів із вимогами до безпеки або з інструментами використовуйте найсильнішу модель найновішого покоління з доступних.

  </Accordion>

  <Accordion title="Як перемикати моделі на льоту (без перезапуску)?">
    Використовуйте команду `/model` як окреме повідомлення:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Це вбудовані псевдоніми. Користувацькі псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Також можна примусово задати конкретний профіль автентифікації для постачальника (для окремої сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробувано наступним.
    Він також показує налаштований endpoint постачальника (`baseUrl`) і режим API (`api`), якщо доступно.

    **Як скасувати закріплення профілю, заданого через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до стандартного значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можна використовувати GPT 5.5 для щоденних завдань і Codex 5.5 для програмування?">
    Так. Розглядайте вибір моделі та вибір runtime окремо:

    - **Нативний агент програмування Codex:** установіть `agents.defaults.model.primary` у `openai/gpt-5.5`, а `agents.defaults.agentRuntime.id` у `"codex"`. Увійдіть через `openclaw models auth login --provider openai-codex`, коли хочете використовувати автентифікацію підписки ChatGPT/Codex.
    - **Прямі завдання OpenAI API через PI:** використовуйте `/model openai/gpt-5.5` без перевизначення runtime Codex і налаштуйте `OPENAI_API_KEY`.
    - **Codex OAuth через PI:** використовуйте `/model openai-codex/gpt-5.5` лише тоді, коли навмисно хочете звичайний runner PI з Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання програмування до агента лише для Codex із власною моделлю та стандартним `agentRuntime`.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати швидкий режим для GPT 5.5?">
    Використовуйте перемикач сесії або стандартне значення в конфігурації:

    - **Для окремої сесії:** надішліть `/fast on`, коли сесія використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Стандартне значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` у `true`.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI швидкий режим відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення сесії `/fast` мають пріоритет над стандартними значеннями конфігурації.

    Див. [Thinking і швидкий режим](/uk/tools/thinking) та [Швидкий режим OpenAI](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, він стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть allowlist або виберіть модель з `/model list`.
    Якщо команда також містила `--runtime codex`, спочатку додайте модель, а потім повторіть
    ту саму команду `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **постачальника не налаштовано** (не знайдено конфігурації постачальника MiniMax або профілю автентифікації), тому модель неможливо розв'язати.

    Контрольний список виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запустіть із вихідного коду `main`), потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідного постачальника можна було інжектувати
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний ідентифікатор моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з API-ключем, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування OAuth.
    4. Запустіть:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можна використовувати MiniMax як стандартну модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як стандартну модель** і перемикайте моделі **для окремої сесії**, коли потрібно.
    Резервні варіанти призначені для **помилок**, а не для "складних завдань", тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для окремої сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Потім:

    ```
    /model gpt
    ```

    **Варіант B: окремі агенти**

    - Стандартна модель агента A: MiniMax
    - Стандартна модель агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи opus / sonnet / gpt є вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома стандартними скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` для налаштувань з API-ключем або `openai-codex/gpt-5.5`, коли налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із тією самою назвою, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити або перевизначити скорочення моделей (псевдоніми)?">
    Псевдоніми беруться з `agents.defaults.models.<modelId>.alias`. Приклад:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Потім `/model sonnet` (або `/<alias>`, коли підтримується) розв'язується до цього ідентифікатора моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших постачальників, наприклад OpenRouter або Z.AI?">
    OpenRouter (оплата за токен; багато моделей):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (моделі GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Якщо ви посилаєтеся на провайдера/модель, але потрібний ключ провайдера відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Ключ API для провайдера не знайдено після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація налаштовується окремо для кожного агента та
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте лише переносні статичні профілі `api_key` / `token` зі сховища автентифікації основного агента до сховища автентифікації нового агента.
    - Для профілів OAuth увійдіть із нового агента, коли йому потрібен власний обліковий запис; інакше OpenClaw може читати з типового/основного агента без клонування токенів оновлення.

    **Не** використовуйте повторно `agentDir` для різних агентів; це спричиняє конфлікти автентифікації/сеансів.

  </Accordion>
</AccordionGroup>

## Перемикання моделі після збою та "Усі моделі зазнали збою"

<AccordionGroup>
  <Accordion title="Як працює перемикання після збою?">
    Перемикання після збою відбувається у два етапи:

    1. **Ротація профілю автентифікації** в межах того самого провайдера.
    2. **Резервне перемикання моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    До проблемних профілів застосовуються періоди очікування (експоненційне відкладення), тому OpenClaw може продовжувати відповідати, навіть коли провайдер обмежує частоту запитів або тимчасово дає збій.

    Кошик обмеження частоти охоплює не лише звичайні відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) як
    обмеження частоти, що потребують перемикання після збою.

    Деякі відповіді, схожі на білінгові, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний білінговий текст для `401` або `403`, OpenClaw усе одно може залишити це
    в білінговій категорії, але текстові зіставники для окремих провайдерів залишаються обмеженими
    провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw розглядає його як
    `rate_limit`, а не як тривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервного перемикання моделі.

    Узагальнений текст помилки сервера навмисно вужчий, ніж «будь-що з
    unknown/error у тексті». OpenClaw розглядає тимчасові форми, обмежені провайдером,
    як-от чисте Anthropic `An unknown error occurred`, чисте OpenRouter
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` з тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, як-от `ModelNotReadyException`, як
    сигнали тайм-ауту/перевантаження, що потребують перемикання після збою, коли контекст провайдера
    збігається.
    Узагальнений внутрішній текст резервного сценарію, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "Облікові дані для профілю anthropic:default не знайдено"?'>
    Це означає, що система спробувала використати ідентифікатор профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що вашу змінну середовища завантажує Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використайте `openclaw models status`, щоб переглянути налаштовані моделі та чи автентифіковані провайдери.

    **Контрольний список виправлення для "Облікові дані для профілю anthropic не знайдено"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо натомість ви хочете використати ключ API**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що виконуєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому також було спробувано Google Gemini і це завершилося збоєм?">
    Якщо ваша конфігурація моделі включає Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або приберіть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервний перехід не спрямовував туди.

    **Запит LLM відхилено: потрібен підпис мислення (Google Antigravity)**

    Причина: історія сеансу містить **блоки мислення без підписів** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає підписи для блоків мислення.

    Виправлення: OpenClaw тепер вилучає непідписані блоки мислення для Google Antigravity Claude. Якщо це все ще з'являється, почніть **новий сеанс** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов'язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації - це іменований запис облікових даних (OAuth або API-ключ), прив'язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID із префіксом провайдера, наприклад:

    - `anthropic:default` (типово, коли немає ідентичності email)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов'язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє ID з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді охолодження** (ліміти частоти/тайм-аути/помилки автентифікації) або довшому стані **вимкнено** (білінг/недостатньо кредитів). Щоб це перевірити, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди охолодження через ліміти частоти можуть бути прив'язані до моделі. Профіль, який перебуває в охолодженні
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера,
    тоді як вікна білінгу/вимкнення все ще блокують увесь профіль.

    Також можна задати перевизначення порядку **для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що фактично буде спробувано, використайте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, проба повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки пробувати його.

  </Accordion>

  <Accordion title="OAuth проти API-ключа - у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де застосовно).
    - **API-ключі** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API-ключі.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і налаштування першого запуску](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
