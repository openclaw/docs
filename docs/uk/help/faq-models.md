---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження відмовостійкого перемикання моделей / «Усі моделі завершилися помилкою»
    - Розуміння профілів автентифікації та способів керування ними
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові налаштування моделей, вибір, псевдоніми, перемикання, відмовостійке перемикання та профілі автентифікації'
title: 'Поширені запитання: моделі та автентифікація'
x-i18n:
    generated_at: "2026-05-07T13:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Питання та відповіді про моделі й профілі автентифікації. Налаштування, сеанси, gateway, канали та
  усунення неполадок див. у головному [FAQ](/uk/help/faq).

  ## Моделі: стандартні значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "стандартна модель"?'>
    Стандартна модель OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.5` або `anthropic/claude-sonnet-4-6`). Якщо ви опускаєте провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише після цього повертається до налаштованого стандартного провайдера як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану стандартну модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість того, щоб показувати застаріле стандартне значення видаленого провайдера. Утім, вам варто **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване стандартне значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів із доступом до інструментів або ненадійним введенням:** надавайте пріоритет потужності моделі, а не вартості.
    **Для рутинного/низькоризикового чату:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Загальне правило: використовуйте **найкращу модель, яку можете собі дозволити**, для високоризикової роботи, і дешевшу
    модель для рутинного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів, щоб
    паралелізувати довгі завдання (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Суворе застереження: слабші/надмірно квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремого сеансу)
    - `openclaw models set ...` (оновлює лише конфігурацію моделей)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об'єктом, якщо не маєте наміру замінити всю конфігурацію.
    Для RPC-редагувань спершу перевіряйте через `config.schema.lookup` і надавайте перевагу `config.patch`. Корисне навантаження lookup дає нормалізований шлях, неглибоку документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для відновлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можна використовувати самостійно розміщені моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо також потрібні хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все одно хочете малі моделі, увімкніть sandboxing і строгі allowlists інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне runtime-налаштування на кожному gateway за допомогою `openclaw models status`.
    - Для чутливих до безпеки агентів або агентів із доступом до інструментів використовуйте найсильнішу модель останнього покоління, доступну вам.

  </Accordion>

  <Accordion title="Як перемикати моделі на ходу (без перезапуску)?">
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

    Це вбудовані псевдоніми. Власні псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Також можна примусово задати конкретний профіль автентифікації для провайдера (для окремого сеансу):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробувано наступним.
    Також показується налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), якщо доступно.

    **Як відкріпити профіль, який я задав через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до стандартного значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можна використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 для програмування?">
    Так. Розглядайте вибір моделі та вибір runtime окремо:

    - **Нативний агент програмування Codex:** задайте `agents.defaults.model.primary` як `openai/gpt-5.5`. Увійдіть через `openclaw models auth login --provider openai-codex`, коли хочете автентифікацію підписки ChatGPT/Codex.
    - **Прямі завдання OpenAI API поза циклом агента:** налаштуйте `OPENAI_API_KEY` для зображень, embeddings, мовлення, realtime та інших поверхонь OpenAI API, не пов'язаних з агентами.
    - **Автентифікація OpenAI agent через API-ключ:** використовуйте `/model openai/gpt-5.5` з упорядкованим API-key-профілем `openai-codex`.
    - **Субагенти:** маршрутизуйте завдання програмування до агента лише для Codex із власною моделлю та стандартним `agentRuntime`.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати швидкий режим для GPT 5.5?">
    Використовуйте або перемикач сеансу, або стандартне значення конфігурації:

    - **Для окремого сеансу:** надішліть `/fast on`, коли сеанс використовує `openai/gpt-5.5`.
    - **Стандартне значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.5"].params.fastMode` як `true`.

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

    Для OpenAI швидкий режим відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення `/fast` у сеансі мають пріоритет над стандартними значеннями конфігурації.

    Див. [Мислення і швидкий режим](/uk/tools/thinking) та [Швидкий режим OpenAI](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сеансу. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть allowlist або виберіть модель із `/model list`.
    Якщо команда також містила `--runtime codex`, спершу додайте модель, а потім повторіть
    ту саму команду `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштований** (конфігурацію провайдера MiniMax або профіль автентифікації
    не знайдено), тому модель неможливо розпізнати.

    Контрольний список виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запускайте із source `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що автентифікація MiniMax
       існує в env/auth profiles, щоб відповідний провайдер міг бути інжектований
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний ідентифікатор моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       через API-ключ, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Запустіть:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можна використовувати MiniMax як стандартну модель, а OpenAI для складних завдань?">
    Так. Використовуйте **MiniMax як стандартну модель** і перемикайте моделі **для окремого сеансу**, коли потрібно.
    Fallbacks призначені для **помилок**, а не для "складних завдань", тож використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для окремого сеансу**

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

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома стандартними скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із такою самою назвою, використовується ваше значення.

  </Accordion>

  <Accordion title="Як визначити/перевизначити скорочення моделей (псевдоніми)?">
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

    Тоді `/model sonnet` (або `/<alias>`, якщо підтримується) розпізнається як цей ID моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, як-от OpenRouter або Z.AI?">
    OpenRouter (оплата за токени; багато моделей):

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

    **Не знайдено ключ API для провайдера після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація налаштовується окремо для кожного агента й
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте лише переносні статичні профілі `api_key` / `token` зі сховища автентифікації основного агента до сховища автентифікації нового агента.
    - Для профілів OAuth увійдіть із нового агента, коли йому потрібен власний обліковий запис; інакше OpenClaw може читати дані через типовий/основний агент без клонування токенів оновлення.

    **Не** використовуйте той самий `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сеансів.

  </Accordion>
</AccordionGroup>

## Відмовостійке перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює відмовостійке перемикання?">
    Відмовостійке перемикання відбувається у два етапи:

    1. **Ротація профілю автентифікації** в межах того самого провайдера.
    2. **Резервне перемикання моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    Періоди очікування застосовуються до профілів, що зазнають збоїв (експоненційна затримка), тому OpenClaw може продовжувати відповідати, навіть коли провайдер обмежує швидкість запитів або тимчасово дає збій.

    Кошик обмеження швидкості охоплює не лише звичайні відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) як обмеження
    швидкості, що потребують відмовостійкого перемикання.

    Деякі відповіді, схожі на білінгові, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний білінговий текст на `401` або `403`, OpenClaw усе ще може залишити це в
    білінговій смузі, але текстові зіставлення, специфічні для провайдера, залишаються обмеженими
    провайдером, якому вони належать (наприклад OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує його як
    `rate_limit`, а не як тривале білінгове вимкнення.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби, а не запускають
    резервне перемикання моделі.

    Узагальнений текст серверної помилки навмисно вужчий, ніж "будь-що з
    unknown/error у тексті". OpenClaw розглядає тимчасові форми, обмежені провайдером,
    як-от Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, як-от `ModelNotReadyException`, як
    сигнали тайм-ауту/перевантаження, що потребують відмовостійкого перемикання, коли контекст провайдера
    збігається.
    Узагальнений внутрішній текст резервної помилки, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша змінна середовища завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У налаштуваннях із кількома агентами може існувати кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використайте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості Gateway.
    - **Якщо натомість хочете використовувати ключ API**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості Gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що запускаєте команди на хості Gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині Gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав збою?">
    Якщо ваша конфігурація моделі містить Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не спрямовувало туди.

    **Запит LLM відхилено: потрібен підпис мислення (Google Antigravity)**

    Причина: історія сеансу містить **блоки мислення без підписів** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає підписи для блоків мислення.

    Виправлення: OpenClaw тепер видаляє непідписані блоки мислення для Google Antigravity Claude. Якщо це все ще з'являється, почніть **новий сеанс** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов'язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони роботи з кількома обліковими записами)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або ключ API), прив'язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Щоб переглянути збережені профілі без виведення секретів, запустіть `openclaw models auth list` (за потреби з `--provider <id>` або `--json`). Докладніше див. [CLI моделей](/uk/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає ідентичності електронної пошти)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов'язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє ID з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді очікування** (обмеження швидкості/тайм-аути/збої автентифікації) або в довшому стані **вимкнення** (білінг/недостатньо кредитів). Щоб це переглянути, запустіть `openclaw models status --json` і перевірте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди очікування через обмеження швидкості можуть бути прив'язані до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для спорідненої моделі в того самого провайдера,
    тоді як білінгові/вимкнені вікна все одно блокують увесь профіль.

    Ви також можете задати перевизначення порядку **для кожного агента** (зберігається в `auth-state.json` цього агента) через CLI:

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

    Щоб перевірити, що фактично буде випробувано, використайте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, перевірка повідомляє
    `excluded_by_auth_order` для цього профілю, а не непомітно пробує його.

  </Accordion>

  <Accordion title="OAuth проти ключа API - у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за передплатою (де це застосовно).
    - **Ключі API** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і ключі API.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основні FAQ
- [FAQ — швидкий старт і початкове налаштування](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover)
