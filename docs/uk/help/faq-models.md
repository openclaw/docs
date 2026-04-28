---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження резервного перемикання моделей / «Усі моделі зазнали збою»
    - Розуміння профілів автентифікації та керування ними
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові налаштування моделей, вибір, псевдоніми, перемикання, резервне перемикання та профілі автентифікації'
title: 'Поширені запитання: моделі та автентифікація'
x-i18n:
    generated_at: "2026-04-28T11:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f80163d645a31b07220c7a4c5bbfe79ed431facbd7232968c12095b7cd9ac4a9
    source_path: help/faq-models.md
    workflow: 16
---

  Запитання й відповіді щодо моделей і профілів автентифікації. Про налаштування, сеанси, Gateway, канали та
  усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Моделі: типові значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви задали як:

    ```
    agents.defaults.model.primary
    ```

    Моделі вказуються як `provider/model` (приклад: `openai/gpt-5.5` або `openai-codex/gpt-5.5`). Якщо ви не вкажете провайдера, OpenClaw спершу спробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного ідентифікатора моделі, і лише після цього як застарілий шлях сумісності повернеться до налаштованого типового провайдера. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повернеться до першої налаштованої пари провайдер/модель замість того, щоб показувати застаріле типове значення видаленого провайдера. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована типова модель:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або ненадійним введенням:** віддавайте пріоритет потужності моделі, а не вартості.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Загальне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливої роботи, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента та використовувати субагентів для
    паралельного виконання довгих завдань (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Важливе попередження: слабші/надмірно квантизовані моделі більш вразливі до prompt
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

    Уникайте `config.apply` з частковим об'єктом, якщо не маєте наміру замінити всю конфігурацію.
    Для редагувань через RPC спершу перевірте через `config.schema.lookup` і надавайте перевагу `config.patch`. Корисне навантаження lookup дає нормалізований шлях, коротку документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати самостійно розміщені моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам також потрібні хмарні моделі, запустіть `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть ізоляцію та суворі списки дозволених інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевірте поточне налаштування середовища виконання на кожному Gateway за допомогою `openclaw models status`.
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

    Також можна примусово задати певний профіль автентифікації для провайдера (для сеансу):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується та який профіль автентифікації буде спробувано наступним.
    Він також показує налаштовану кінцеву точку провайдера (`baseUrl`) і режим API (`api`), якщо вони доступні.

    **Як скасувати закріплення профілю, заданого через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань і Codex 5.5 для програмування?">
    Так. Задайте одну модель типовою та перемикайтеся за потреби:

    - **Швидке перемикання (для сеансу):** `/model openai/gpt-5.5` для поточних завдань із прямим API-ключем OpenAI або `/model openai-codex/gpt-5.5` для завдань GPT-5.5 Codex OAuth.
    - **Типове значення:** задайте `agents.defaults.model.primary` як `openai/gpt-5.5` для використання API-ключа або `openai-codex/gpt-5.5` для використання GPT-5.5 Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання з програмування до субагентів з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати швидкий режим для GPT 5.5?">
    Використовуйте перемикач сеансу або типове значення конфігурації:

    - **Для сеансу:** надішліть `/fast on`, коли сеанс використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.5"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` як `true`.

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

    Для OpenAI швидкий режим відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення сеансу `/fast` мають перевагу над типовими значеннями конфігурації.

    Див. [Мислення і швидкий режим](/uk/tools/thinking) та [Швидкий режим OpenAI](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **списком дозволених** для `/model` і будь-яких
    перевизначень сеансу. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть список дозволених або виберіть модель з `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурацію провайдера MiniMax або профіль автентифікації), тому модель не можна розпізнати.

    Контрольний список виправлення:

    1. Оновіть OpenClaw до поточного випуску (або запустіть із вихідного коду `main`), потім перезапустіть Gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер міг бути впроваджений
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

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для сеансу**, коли потрібно.
    Резервні варіанти призначені для **помилок**, а не для "складних завдань", тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для сеансу**

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

    - Типова модель агента A: MiniMax
    - Типова модель агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` для налаштувань з API-ключем або `openai-codex/gpt-5.5`, коли налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із такою самою назвою, ваше значення матиме перевагу.

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

    Потім `/model sonnet` (або `/<alias>`, коли підтримується) розпізнається як цей ідентифікатор моделі.

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

    Якщо ви посилаєтеся на провайдера/модель, але потрібний ключ провайдера відсутній, ви отримаєте помилку авторизації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Не знайдено API-ключ провайдера після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище авторизації. Авторизація є окремою для кожного агента й
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте авторизацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте той самий `agentDir` для кількох агентів; це спричиняє конфлікти авторизації/сесій.

  </Accordion>
</AccordionGroup>

## Перемикання моделей у разі збою та "All models failed"

<AccordionGroup>
  <Accordion title="Як працює перемикання у разі збою?">
    Перемикання у разі збою відбувається у два етапи:

    1. **Ротація профілів авторизації** в межах того самого провайдера.
    2. **Резервний вибір моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів зі збоями застосовуються періоди охолодження (експоненційне відкладення), тож OpenClaw може продовжувати відповідати, навіть коли провайдер обмежує частоту запитів або тимчасово не працює.

    Бакет обмеження частоти містить більше, ніж прості відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) як обмеження
    частоти, що мають спричиняти перемикання у разі збою.

    Деякі відповіді, схожі на проблеми з оплатою, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому бакеті. Якщо провайдер повертає
    явний текст про оплату на `401` або `403`, OpenClaw усе одно може залишити це в
    напрямі оплати, але специфічні для провайдера зіставники тексту залишаються обмеженими
    провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw розглядає його як
    `rate_limit`, а не як тривале вимкнення через оплату.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервної моделі.

    Узагальнений текст серверної помилки навмисно вужчий, ніж "усе, що містить
    unknown/error". OpenClaw справді розглядає тимчасові форми, прив’язані до провайдера,
    як-от Anthropic із самим лише `An unknown error occurred`, OpenRouter із самим лише
    `Provider returned error`, помилки причин зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, як-от `ModelNotReadyException`, як
    сигнали тайм-ауту/перевантаження, що мають спричиняти перемикання у разі збою, коли контекст провайдера
    збігається.
    Узагальнений внутрішній текст резервного збою, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає резервний вибір моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю авторизації `anthropic:default`, але не змогла знайти облікові дані для нього в очікуваному сховищі авторизації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі авторизації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що вашу змінну середовища завантажено Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/авторизації**
      - Використайте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язано до профілю авторизації Anthropic, але Gateway
    не може знайти його у своєму сховищі авторизації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо натомість хочете використовувати API-ключ**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що виконуєте команди на хості gateway**
      - У віддаленому режимі профілі авторизації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав збою?">
    Якщо ваша конфігурація моделі містить Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного вибору моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте авторизацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервний маршрут не спрямовував туди.

    **Запит LLM відхилено: потрібна thinking signature (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без signatures** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає signatures для блоків thinking.

    Виправлення: OpenClaw тепер видаляє непідписані блоки thinking для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі авторизації: що це таке і як ними керувати

Пов’язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль авторизації?">
    Профіль авторизації — це іменований запис облікових даних (OAuth або API-ключ), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Якими є типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає email-ідентичності)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль авторизації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє ID із провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді охолодження** (обмеження частоти/тайм-аути/збої авторизації) або в довшому стані **вимкнено** (оплата/недостатньо кредитів). Щоб перевірити це, запустіть `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди охолодження через обмеження частоти можуть бути прив’язані до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для спорідненої моделі в того самого провайдера,
    тоді як вікна оплати/вимкнення все одно блокують увесь профіль.

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

    Щоб вибрати конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що фактично буде спробовано, використайте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб тихо пробувати його.

  </Accordion>

  <Accordion title="OAuth проти API-ключа - у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API-ключі** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API-ключі.

  </Accordion>
</AccordionGroup>

## Пов’язано

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і налаштування першого запуску](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Перемикання моделей у разі збою](/uk/concepts/model-failover)
