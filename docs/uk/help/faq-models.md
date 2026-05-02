---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження аварійного перемикання моделей / "Усі моделі не спрацювали"
    - Що таке профілі автентифікації та як ними керувати
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові налаштування моделей, вибір, псевдоніми, перемикання, резервне перемикання та профілі автентифікації'
title: 'Поширені запитання: моделі та автентифікація'
x-i18n:
    generated_at: "2026-05-02T02:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  Запитання й відповіді щодо моделей і профілів автентифікації. Щодо налаштування, сеансів, gateway, каналів і
  усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Моделі: типові значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    Моделі задаються як `provider/model` (приклад: `openai/gpt-5.5` або `openai-codex/gpt-5.5`). Якщо ви не вкажете провайдера, OpenClaw спершу спробує псевдонім, потім унікальний збіг налаштованого провайдера для саме цього ідентифікатора моделі, і лише після цього повернеться до налаштованого типового провайдера як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повернеться до першої налаштованої пари провайдер/модель замість показу застарілого типового значення для вилученого провайдера. Все одно варто **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендовано за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або недовіреним введенням:** надавайте пріоритет потужності моделі, а не вартості.
    **Для звичайного чату з низькими ризиками:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для роботи з високими ризиками, і дешевшу
    модель для звичайного чату або підсумків. Можна маршрутизувати моделі для кожного агента й використовувати субагентів для
    паралельного виконання довгих завдань (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Суворе попередження: слабші або надмірно квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремого сеансу)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагувати `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим обʼєктом, якщо не маєте наміру замінити всю конфігурацію.
    Для RPC-редагувань спершу перевірте через `config.schema.lookup` і надавайте перевагу `config.patch`. Корисне навантаження lookup дає нормалізований шлях, стислі документи/обмеження схеми й підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для відновлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати самостійно розміщені моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо також потрібні хмарні моделі, запустіть `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Нотатки:

    - `Cloud + Local` дає хмарні моделі разом із вашими локальними моделями Ollama
    - хмарні моделі на кшталт `kimi-k2.5:cloud` не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все одно хочете малі моделі, увімкніть sandboxing і суворі списки дозволених інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевірте поточне runtime-налаштування на кожному gateway за допомогою `openclaw models status`.
    - Для агентів, чутливих до безпеки або з інструментами, використовуйте найсильнішу модель останнього покоління з доступних.

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

    Доступні моделі можна переглянути за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Також можна примусово задати конкретний профіль автентифікації для провайдера (для окремого сеансу):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробувано далі.
    Також показує налаштовану endpoint-адресу провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як відкріпити профіль, який я задав через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань і Codex 5.5 для програмування?">
    Так. Розглядайте вибір моделі й вибір runtime окремо:

    - **Нативний агент програмування Codex:** установіть `agents.defaults.model.primary` на `openai/gpt-5.5`, а `agents.defaults.agentRuntime.id` на `"codex"`. Увійдіть через `openclaw models auth login --provider openai-codex`, коли хочете автентифікацію підписки ChatGPT/Codex.
    - **Прямі завдання OpenAI API через PI:** використовуйте `/model openai/gpt-5.5` без перевизначення runtime Codex і налаштуйте `OPENAI_API_KEY`.
    - **Codex OAuth через PI:** використовуйте `/model openai-codex/gpt-5.5` лише тоді, коли свідомо хочете звичайний PI runner із Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання програмування до агента лише для Codex з власною моделлю і типовим `agentRuntime`.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте перемикач сеансу або типове значення конфігурації:

    - **Для окремого сеансу:** надішліть `/fast on`, поки сеанс використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` на `true`.

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

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сеансові перевизначення `/fast` мають пріоритет над типовими значеннями конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) та [OpenAI fast mode](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, це стає **списком дозволених** для `/model` і будь-яких
    сеансових перевизначень. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, вилучіть список дозволених або виберіть модель з `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурацію провайдера MiniMax або профіль автентифікації), тож модель не можна розвʼязати.

    Контрольний список виправлення:

    1. Оновіться до поточного випуску OpenClaw (або запустіть із source `main`), потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстром або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер можна було інʼєктувати
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний ідентифікатор моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування з API-key,
       або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування з OAuth.
    4. Запустіть:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типовий варіант, а OpenAI для складних завдань?">
    Так. Використовуйте **MiniMax як типовий варіант** і перемикайте моделі **для окремого сеансу**, коли потрібно.
    Резервні варіанти призначені для **помилок**, а не для "складних завдань", тому використовуйте `/model` або окремого агента.

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

    - Типове значення агента A: MiniMax
    - Типове значення агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Multi-Agent Routing](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` для налаштувань з API-key або `openai-codex/gpt-5.5`, коли налаштовано Codex OAuth
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

    Потім `/model sonnet` (або `/<alias>`, коли підтримується) розвʼязується в цей ідентифікатор моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, як-от OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на постачальника/модель, але потрібний ключ постачальника відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Не знайдено API-ключ для постачальника після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація є окремою для кожного агента й
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте лише портативні статичні профілі `api_key` / `token` зі сховища автентифікації основного агента до сховища автентифікації нового агента.
    - Для профілів OAuth увійдіть із нового агента, коли йому потрібен власний обліковий запис; інакше OpenClaw може читати з агента за замовчуванням/основного агента без клонування refresh-токенів.

    **Не** використовуйте повторно `agentDir` для різних агентів; це спричиняє конфлікти автентифікації/сеансів.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація профілів автентифікації** у межах того самого постачальника.
    2. **Резервне перемикання моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    Для проблемних профілів застосовуються періоди очікування (експоненційна затримка), тож OpenClaw може продовжувати відповідати, навіть коли постачальник обмежує частоту запитів або тимчасово не працює.

    Бакет обмеження частоти містить не лише звичайні відповіді `429`. OpenClaw
    також трактує повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`) як обмеження
    частоти, що потребують резервного перемикання.

    Деякі відповіді, схожі на білінгові, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому бакеті. Якщо постачальник повертає
    явний білінговий текст на `401` або `403`, OpenClaw усе одно може залишити це
    в білінговій смузі, але специфічні для постачальника текстові збіги залишаються
    обмеженими постачальником, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість виглядає як повторюване вікно використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує його як
    `rate_limit`, а не як довге білінгове вимкнення.

    Помилки переповнення контексту інші: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість просування до
    резервного перемикання моделі.

    Універсальний текст серверної помилки навмисно вужчий, ніж "будь-що з
    unknown/error у ньому". OpenClaw справді трактує прив’язані до постачальника тимчасові форми,
    як-от Anthropic без додаткових даних `An unknown error occurred`, OpenRouter без додаткових даних
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` з тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості постачальника, як-от `ModelNotReadyException`, як
    сигнали тайм-ауту/перевантаження, що потребують резервного перемикання, коли контекст постачальника
    збігається.
    Універсальний внутрішній текст резервного шляху, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти облікові дані для нього в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові й застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша змінна середовища завантажена Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного агента**
      - У налаштуваннях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використайте `openclaw models status`, щоб побачити налаштовані моделі й чи автентифіковані постачальники.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо натомість ви хочете використати API-ключ**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви виконуєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав невдачі?">
    Якщо ваша конфігурація моделі містить Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не маршрутизувало туди.

    **Запит LLM відхилено: потрібен підпис thinking (Google Antigravity)**

    Причина: історія сеансу містить **блоки thinking без підписів** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає підписів для блоків thinking.

    Виправлення: OpenClaw тепер видаляє непідписані блоки thinking для Google Antigravity Claude. Якщо це все ще з’являється, почніть **новий сеанс** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API-ключ), прив’язаний до постачальника. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які ID профілів типові?">
    OpenClaw використовує ID з префіксом постачальника, наприклад:

    - `anthropic:default` (типово, коли немає ідентичності електронної пошти)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації буде спробовано першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного постачальника (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє ID з постачальником/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді очікування** (обмеження частоти/тайм-аути/збої автентифікації) або в довшому стані **вимкнено** (білінг/недостатньо кредитів). Щоб перевірити це, запустіть `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди очікування через обмеження частоти можуть бути прив’язані до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для спорідненої моделі в того самого постачальника,
    тоді як білінгові/вимкнені вікна все одно блокують увесь профіль.

    Ви також можете встановити перевизначення порядку **для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

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

    Щоб перевірити, що насправді буде спробовано, використайте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб непомітно спробувати його.

  </Accordion>

  <Accordion title="OAuth чи API-ключ - у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API-ключі** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API-ключі.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і перше налаштування](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
