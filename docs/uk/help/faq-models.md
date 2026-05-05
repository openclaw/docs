---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження аварійного перемикання моделей / «Усі моделі завершилися помилкою»
    - Розуміння профілів автентифікації та керування ними
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові налаштування моделей, вибір, псевдоніми, перемикання, аварійне перемикання та профілі автентифікації'
title: 'Поширені запитання: моделі та автентифікація'
x-i18n:
    generated_at: "2026-05-05T00:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  Питання й відповіді про моделі та профілі автентифікації. Про налаштування, сесії, gateway, канали та
  усунення несправностей див. основні [часті запитання](/uk/help/faq).

  ## Моделі: стандартні значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як на `provider/model` (приклад: `openai/gpt-5.5` або `openai-codex/gpt-5.5`). Якщо ви пропустите провайдера, OpenClaw спершу спробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного id моделі, і лише після цього повернеться до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw повернеться до першої налаштованої пари провайдер/модель замість того, щоб показувати застаріле стандартне значення для видаленого провайдера. Вам усе одно слід **явно** встановити `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване значення за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або ненадійними вхідними даними:** віддавайте пріоритет силі моделі, а не вартості.
    **Для звичайного чату з низькими ризиками:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [локальні моделі](/uk/gateway/local-models).

    Правило: використовуйте **найкращу модель, яку можете собі дозволити**, для роботи з високими ризиками, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів, щоб
    паралелізувати довгі завдання (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Суворе застереження: слабші або надмірно квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо не маєте наміру замінити всю конфігурацію.
    Для RPC-редагувань спершу перевірте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Корисне навантаження lookup дає нормалізований шлях, поверхневу документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor`, щоб виправити.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати самостійно розгорнуті моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо також потрібні хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає хмарні моделі разом із вашими локальними моделями Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і суворі списки дозволених інструментів.

    Документація: [Ollama](/uk/providers/ollama), [локальні моделі](/uk/gateway/local-models),
    [провайдери моделей](/uk/concepts/model-providers), [безпека](/uk/gateway/security),
    [sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування runtime на кожному Gateway за допомогою `openclaw models status`.
    - Для агентів із підвищеними вимогами до безпеки або з інструментами використовуйте найсильнішу модель останнього покоління, доступну вам.

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

    Ви можете перелічити доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Також можна примусово вказати конкретний профіль автентифікації для провайдера (для окремої сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як відкріпити профіль, який я встановив через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до стандартного значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань і Codex 5.5 для кодування?">
    Так. Розглядайте вибір моделі та вибір runtime окремо:

    - **Нативний агент кодування Codex:** встановіть `agents.defaults.model.primary` на `openai/gpt-5.5`, а `agents.defaults.agentRuntime.id` на `"codex"`. Увійдіть через `openclaw models auth login --provider openai-codex`, коли хочете використовувати автентифікацію підписки ChatGPT/Codex.
    - **Прямі завдання OpenAI API через PI:** використовуйте `/model openai/gpt-5.5` без перевизначення runtime Codex і налаштуйте `OPENAI_API_KEY`.
    - **Codex OAuth через PI:** використовуйте `/model openai-codex/gpt-5.5` лише тоді, коли свідомо хочете звичайний runner PI з Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання кодування до агента лише для Codex із власною моделлю та стандартним `agentRuntime`.

    Див. [Моделі](/uk/concepts/models) і [слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати швидкий режим для GPT 5.5?">
    Використовуйте перемикач сесії або стандартне значення конфігурації:

    - **Для окремої сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Стандартне значення для моделі:** встановіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` на `true`.

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

    Для OpenAI швидкий режим відображається на `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійні перевизначення `/fast` мають пріоритет над стандартними значеннями конфігурації.

    Див. [мислення та швидкий режим](/uk/tools/thinking) і [швидкий режим OpenAI](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, він стає **списком дозволених** для `/model` і будь-яких
    сесійних перевизначень. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть список дозволених або виберіть модель з `/model list`.
    Якщо команда також містила `--runtime codex`, спершу додайте модель, а потім повторіть
    ту саму команду `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурацію провайдера MiniMax або профіль автентифікації),
    тому модель не можна розпізнати.

    Контрольний список для виправлення:

    1. Оновіться до поточного випуску OpenClaw (або запустіть із source `main`), потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстром або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб можна було інжектувати відповідного провайдера
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
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

  <Accordion title="Чи можу я використовувати MiniMax як стандартну модель, а OpenAI для складних завдань?">
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

    Документація: [Моделі](/uk/concepts/models), [маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачає кілька стандартних скорочень (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` для налаштувань з API-ключем або `openai-codex/gpt-5.5`, коли налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із такою самою назвою, ваше значення матиме пріоритет.

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

    Тоді `/model sonnet` (або `/<alias>`, коли підтримується) розпізнається як цей ID моделі.

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

    **Після додавання нового агента ключ API для провайдера не знайдено**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація налаштовується для кожного агента окремо та
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте лише переносні статичні профілі `api_key` / `token` зі сховища автентифікації основного агента до сховища автентифікації нового агента.
    - Для профілів OAuth увійдіть із нового агента, коли йому потрібен власний обліковий запис; інакше OpenClaw може читати дані через стандартного/основного агента без клонування токенів оновлення.

    **Не** використовуйте повторно `agentDir` для різних агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація профілів автентифікації** у межах того самого провайдера.
    2. **Резервний вибір моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    Періоди охолодження застосовуються до профілів, які дають збої (експоненційна затримка), тому OpenClaw може продовжувати відповідати, навіть коли провайдер обмежує частоту запитів або тимчасово не працює.

    До кошика обмежень частоти входять не лише звичайні відповіді `429`. OpenClaw
    також вважає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) обмеженнями
    частоти, для яких варто виконати резервне перемикання.

    Деякі відповіді, схожі на помилки білінгу, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний текст про білінг для `401` або `403`, OpenClaw усе одно може залишити це
    в напрямі білінгу, але провайдер-специфічні текстові зіставлення залишаються
    обмеженими провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує його як
    `rate_limit`, а не як тривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби, а не переводять до
    резервної моделі.

    Загальний текст помилки сервера навмисно вужчий, ніж "усе, що містить
    unknown/error". OpenClaw справді трактує провайдер-специфічні тимчасові форми,
    такі як чисте Anthropic `An unknown error occurred`, чисте OpenRouter
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` із тимчасовим текстом сервера
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як
    сигнали тайм-ауту/перевантаження, для яких варто виконати резервне перемикання, коли контекст провайдера
    збігається.
    Загальний внутрішній текст резервного збою, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що вашу змінну середовища завантажує Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - Налаштування з кількома агентами означають, що може існувати кілька файлів `auth-profiles.json`.
    - **Виконайте базову перевірку стану моделі/автентифікації**
      - Використайте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язано до профілю автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості Gateway.
    - **Якщо натомість хочете використовувати ключ API**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості Gateway**.
      - Очистьте будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що запускаєте команди на хості Gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині Gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому також було спробувано Google Gemini і це завершилося помилкою?">
    Якщо ваша конфігурація моделі містить Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або вилучіть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не маршрутизувалося туди.

    **Запит LLM відхилено: потрібна сигнатура thinking (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без сигнатур** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає сигнатури для блоків thinking.

    Виправлення: OpenClaw тепер вилучає непідписані блоки thinking для Google Antigravity Claude. Якщо проблема все ще з’являється, почніть **нову сесію** або задайте `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або ключ API), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Щоб переглянути збережені профілі без виведення секретів, запустіть `openclaw models auth list` (за потреби з `--provider <id>` або `--json`). Докладніше див. [Models CLI](/uk/cli/models#openclaw-models-auth-list).

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID із префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає ідентичності з електронною поштою)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє ID із провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді охолодження** (обмеження частоти/тайм-аути/збої автентифікації) або довшому **вимкненому** стані (білінг/недостатньо кредитів). Щоб це перевірити, запустіть `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди охолодження через обмеження частоти можуть бути прив’язані до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера,
    тоді як вікна білінгу/вимкнення все ще блокують увесь профіль.

    Ви також можете задати перевизначення порядку **для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

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

    Якщо збережений профіль пропущено в явному порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб непомітно його пробувати.

  </Accordion>

  <Accordion title="OAuth чи ключ API — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **Ключі API** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і ключі API.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і налаштування першого запуску](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
