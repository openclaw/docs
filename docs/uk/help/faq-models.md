---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження failover моделей / «Усі моделі завершилися помилкою»
    - Розуміння профілів автентифікації та способів керування ними
sidebarTitle: Models FAQ
summary: 'FAQ: типові значення моделей, вибір, псевдоніми, перемикання, failover та профілі автентифікації'
title: 'FAQ: моделі та автентифікація'
x-i18n:
    generated_at: "2026-04-25T17:32:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  Запитання й відповіді про моделі та профілі автентифікації. Для налаштування, сесій, Gateway, каналів і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Моделі: типові значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.5` або `openai-codex/gpt-5.5`). Якщо ви не вказуєте провайдера, OpenClaw спочатку намагається використати псевдонім, потім — унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише після цього повертається до налаштованого типового провайдера як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість того, щоб показувати застаріле типове значення з видаленим провайдером. Вам усе одно слід **явно** встановлювати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найпотужнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з увімкненими інструментами або агентів із недовіреним введенням:** надавайте пріоритет потужності моделі над вартістю.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикових завдань, а дешевшу модель — для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати підлеглих агентів для паралелізації довгих завдань (кожен підлеглий агент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Підлеглі агенти](/uk/tools/subagents).

    Важливе попередження: слабші або надмірно квантизовані моделі більш вразливі до prompt injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання конфігурації?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточної сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо ви не маєте наміру замінити всю конфігурацію.
    Для редагувань через RPC спочатку перевіряйте за допомогою `config.schema.lookup` і надавайте перевагу `config.patch`. Дані lookup надають нормалізований шлях, документацію/обмеження поверхневої схеми та зведення безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можна використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви також хочете хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` надає вам хмарні моделі разом із вашими локальними моделями Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете використовувати малі моделі, увімкніть sandboxing і суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway за допомогою `openclaw models status`.
    - Для агентів, чутливих до безпеки / з увімкненими інструментами, використовуйте найпотужнішу модель останнього покоління з доступних.
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

    Це вбудовані псевдоніми. Власні псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований список вибору. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати певний профіль автентифікації для провайдера (для поточної сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштовану кінцеву точку провайдера (`baseUrl`) і режим API (`api`), якщо вони доступні.

    **Як скасувати закріплення профілю, встановленого через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його через `/model` (або надішліть `/model <типовий provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можна використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для кодування?">
    Так. Установіть одну модель як типову й перемикайте за потреби:

    - **Швидке перемикання (для поточної сесії):** `/model openai/gpt-5.5` для поточних завдань через прямий API-ключ OpenAI або `/model openai-codex/gpt-5.5` для завдань GPT-5.5 Codex OAuth.
    - **Типове значення:** установіть `agents.defaults.model.primary` на `openai/gpt-5.5` для використання API-ключа або на `openai-codex/gpt-5.5` для використання GPT-5.5 Codex OAuth.
    - **Підлеглі агенти:** маршрутизуйте завдання кодування до підлеглих агентів з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач для сесії, або типове значення в конфігурації:

    - **Для поточної сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` у `true`.

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

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Параметри сесії `/fast` мають пріоритет над типовими значеннями конфігурації.

    Див. [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed" і потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Цю помилку повертають **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурацію провайдера MiniMax або профіль
    автентифікації), тому модель не вдається розпізнати.

    Контрольний список для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запустіть із джерела `main`), потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер можна було інʼєктувати
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний ідентифікатор моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з API-ключем, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування
       через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можна використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову** і перемикайте моделі **для кожної сесії** за потреби.
    Fallback призначений для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для кожної сесії**

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

    - Типове значення агента A: MiniMax
    - Типове значення агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (вони застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` для конфігурацій із API-ключем або `openai-codex/gpt-5.5`, якщо налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви встановите власний псевдонім із такою самою назвою, пріоритет матиме ваше значення.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (псевдоніми)?">
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

    Тоді `/model sonnet` (або `/<alias>`, якщо підтримується) буде зіставлено з цим ідентифікатором моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, таких як OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Не знайдено API key для провайдера після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація є окремою для кожного агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте той самий `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Failover моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює failover?">
    Failover відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах того самого провайдера.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що завершуються помилкою, застосовуються cooldown (експоненційний backoff), тож OpenClaw може продовжувати відповідати, навіть коли провайдер досяг обмеження швидкості або тимчасово не працює.

    Кошик rate-limit включає не лише звичайні відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) як такі, що
    заслуговують на failover через rate limit.

    Деякі відповіді, схожі на проблеми з білінгом, не мають коду `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний текст про білінг у відповідь на `401` або `403`, OpenClaw усе одно може залишити це
    в гілці billing, але зіставлення тексту, специфічного для провайдера, залишається в межах
    провайдера, якому воно належить (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    виглядає як повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw розглядає це як
    `rate_limit`, а не як довготривале вимкнення через billing.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху compaction/retry замість переходу до
    fallback моделі.

    Узагальнений текст про серверні помилки навмисно вужчий, ніж «будь-що з
    unknown/error усередині». OpenClaw справді розглядає тимчасові форми, прив’язані до провайдера,
    як-от Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON-повідомлення `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як
    сигнали timeout/overloaded, гідні failover, коли збігається контекст
    провайдера.
    Узагальнений внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає fallback моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати ідентифікатор профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується за допомогою `openclaw doctor`)
    - **Підтвердьте, що вашу env-змінну завантажує Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може не успадковувати її. Додайте її до `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковано провайдерів.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API key натомість**
      - Додайте `ANTHROPIC_API_KEY` до `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що запускаєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому система також спробувала Google Gemini і завершилася помилкою?">
    Якщо конфігурація вашої моделі включає Google Gemini як fallback (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час fallback моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або налаштуйте автентифікацію Google, або видаліть/не використовуйте моделі Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб fallback не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатури для блоків thinking.

    Виправлення: OpenClaw тепер видаляє блоки thinking без сигнатур для Google Antigravity Claude. Якщо проблема все ще зберігається, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони з кількома обліковими записами)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ідентифікатори профілів?">
    OpenClaw використовує ідентифікатори з префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає ідентичності email)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні ідентифікатори, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації буде спробовано першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє ідентифікатори з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown через rate limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як вікна billing/disabled, як і раніше, блокують увесь профіль.

    Ви також можете встановити перевизначення порядку **для конкретного агента** (воно зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Типово використовує налаштованого default-agent (опустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (намагатися лише з ним)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або встановити явний порядок (fallback у межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що реально буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки пробувати його.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують модель білінгу з оплатою за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth та API keys.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і налаштування першого запуску](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Failover моделей](/uk/concepts/model-failover)
