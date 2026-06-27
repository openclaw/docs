---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження відмовостійкого перемикання моделей / «Усі моделі не спрацювали»
    - Розуміння профілів автентифікації та керування ними
sidebarTitle: Models FAQ
summary: 'Поширені запитання: типові значення моделей, вибір, псевдоніми, перемикання, аварійне перемикання та профілі автентифікації'
title: 'FAQ: моделі й автентифікація'
x-i18n:
    generated_at: "2026-06-27T17:38:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  Питання й відповіді про моделі та профілі автентифікації. Про налаштування, сесії, gateway, канали та
  усунення неполадок див. основний [FAQ](/uk/help/faq).

  ## Моделі: типові значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.5` або `anthropic/claude-sonnet-4-6`). Якщо ви пропускаєте провайдера, OpenClaw спершу пробує псевдонім, потім унікальний збіг серед налаштованих провайдерів для цього точного ідентифікатора моделі, і лише після цього повертається до налаштованого типового провайдера як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість того, щоб показувати застарілу типову модель видаленого провайдера. Вам усе одно слід **явно** встановити `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів із доступом до інструментів або ненадійним введенням:** віддавайте пріоритет силі моделі, а не вартості.
    **Для звичайного чату з низькими ризиками:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для роботи з високими ризиками, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента та використовувати субагентів для
    паралелізації довгих завдань (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Серйозне попередження: слабші або надмірно квантовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагувати `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо не маєте наміру замінити всю конфігурацію.
    Для редагувань через RPC спершу перевірте за допомогою `config.schema.lookup` і віддавайте перевагу `config.patch`. Корисне навантаження lookup дає нормалізований шлях, стислу документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати самостійно розгорнуті моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо також хочете хмарні моделі, запустіть `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і суворі списки дозволених інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевірте поточне налаштування runtime на кожному gateway за допомогою `openclaw models status`.
    - Для агентів, чутливих до безпеки або з доступом до інструментів, використовуйте найсильнішу модель останнього покоління, доступну вам.

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

    Доступні моделі можна переглянути за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вказати конкретний профіль автентифікації для провайдера (для окремої сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробувано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як відкріпити профіль, який я встановив через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Якщо два провайдери надають однаковий ідентифікатор моделі, який із них використовує /model?">
    `/model provider/model` вибирає цей точний маршрут провайдера для сесії.

    Наприклад, `qianfan/deepseek-v4-flash` і `deepseek/deepseek-v4-flash` — це різні посилання на моделі, навіть якщо обидва містять `deepseek-v4-flash`. OpenClaw не повинен непомітно перемикатися з одного провайдера на іншого лише тому, що збігається голий ідентифікатор моделі.

    Вибране користувачем посилання `/model` також є строгим для політики fallback. Якщо вибрана пара провайдер/модель недоступна, відповідь явно завершується помилкою замість відповіді з `agents.defaults.model.fallbacks`. Налаштовані ланцюжки fallback і надалі застосовуються до налаштованих типових значень, основних моделей Cron-завдань і автоматично вибраного fallback-стану.

    Якщо запуск, що почався з перевизначення не для сесії, має право використовувати fallback, OpenClaw спершу пробує запитану пару провайдер/модель, потім налаштовані fallback, і лише після цього налаштовану основну модель. Це запобігає тому, щоб дублікати голих ідентифікаторів моделей одразу перестрибували назад до типового провайдера.

    Див. [Моделі](/uk/concepts/models) і [Model failover](/uk/concepts/model-failover).

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань і Codex 5.5 для кодування?">
    Так. Розглядайте вибір моделі та вибір runtime окремо:

    - **Нативний агент кодування Codex:** встановіть `agents.defaults.model.primary` на `openai/gpt-5.5`. Увійдіть через `openclaw models auth login --provider openai`, коли хочете автентифікацію підписки ChatGPT/Codex.
    - **Прямі завдання OpenAI API поза агентним циклом:** налаштуйте `OPENAI_API_KEY` для зображень, embeddings, speech, realtime та інших поверхонь OpenAI API, не пов’язаних з агентом.
    - **Автентифікація агента OpenAI за API-ключем:** використовуйте `/model openai/gpt-5.5` з упорядкованим профілем API-ключа `openai`.
    - **Субагенти:** маршрутизуйте завдання кодування до агента, зосередженого на Codex, із власною моделлю `openai/gpt-5.5`.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте перемикач сесії або типове значення конфігурації:

    - **Для окремої сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5`.
    - **Типове значення для моделі:** встановіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` на `true`.
    - **Автоматичний поріг:** використовуйте `/fast auto` або `params.fastMode: "auto"`, щоб нові виклики моделі починалися швидко до автоматичного порога, а пізніші повтори, fallback, результати інструментів або виклики продовження запускалися без fast mode. Типовий поріг — 60 секунд; встановіть `params.fastAutoOnSeconds` для активної моделі, щоб змінити його.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відображається на `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійні перевизначення `/fast` мають пріоритет над типовими значеннями конфігурації. Ходи app-server Codex можуть отримати tier лише на початку ходу, тому `auto` застосовується до наступного ходу моделі, запущеного OpenClaw, а не всередині вже запущеного ходу app-server.

    Див. [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо `agents.defaults.models` встановлено, він стає **списком дозволених** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте точну модель до
    `agents.defaults.models`, додайте wildcard провайдера, наприклад `"provider/*": {}` для динамічних каталогів провайдера, видаліть список дозволених або виберіть модель із `/model list`.
    Якщо команда також містила `--runtime codex`, спершу оновіть список дозволених, а потім повторіть
    ту саму команду `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M3"?'>
    Це означає, що **провайдер не налаштовано** (не знайдено конфігурацію провайдера MiniMax або профіль автентифікації), тому модель не можна розпізнати.

    Контрольний список виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запустіть із source `main`), потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер міг бути injected
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний ідентифікатор моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` або
       `minimax/MiniMax-M2.7-highspeed` для налаштування з API-ключем, або
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` чи
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування OAuth.
    4. Запустіть:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для окремої сесії**, коли потрібно.
    Fallback призначені для **помилок**, а не для "складних завдань", тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для окремої сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація між кількома агентами](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома стандартними скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    Якщо ви задасте власний псевдонім із такою самою назвою, буде використано ваше значення.

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
          },
        },
      },
    }
    ```

    Потім `/model sonnet` (або `/<alias>`, якщо підтримується) зіставляється з цим ID моделі.

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

    Якщо ви посилаєтеся на провайдера/модель, але потрібного ключа провайдера немає, отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Ключ API для провайдера не знайдено після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація є окремою для кожного агента й
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію в майстрі.
    - Або скопіюйте лише переносні статичні профілі `api_key` / `token` зі сховища автентифікації основного агента до сховища автентифікації нового агента.
    - Для профілів OAuth увійдіть із нового агента, коли йому потрібен власний обліковий запис; інакше OpenClaw може читати дані зі стандартного/основного агента без клонування токенів оновлення.

    Не використовуйте повторно `agentDir` для різних агентів; це спричиняє конфлікти автентифікації/сеансів.

  </Accordion>
</AccordionGroup>

## Відновлення після збою моделі та "All models failed"

<AccordionGroup>
  <Accordion title="Як працює відновлення після збою?">
    Відновлення після збою відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах того самого провайдера.
    2. **Резервна модель** — перехід до наступної моделі в `agents.defaults.model.fallbacks`.

    Періоди очікування застосовуються до профілів, що зазнають збоїв (експоненційна затримка), тож OpenClaw може продовжувати відповідати, навіть коли провайдер обмежує частоту запитів або тимчасово недоступний.

    Кошик обмеження частоти містить не лише звичайні відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`) як обмеження
    частоти, що потребують відновлення після збою.

    Деякі відповіді, схожі на білінгові, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний білінговий текст на `401` або `403`, OpenClaw усе одно може тримати це в
    білінговій смузі, але зіставлення тексту для конкретних провайдерів залишаються в межах
    провайдера, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість виглядає як повторюване обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw розглядає його як
    `rate_limit`, а не як тривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури, як-от
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded`, залишаються на шляху Compaction/повторної спроби замість переходу до
    резервної моделі.

    Загальний текст серверної помилки навмисно вужчий, ніж "усе, що містить
    unknown/error". OpenClaw справді розглядає тимчасові форми в межах провайдера,
    як-от голе Anthropic `An unknown error occurred`, голе OpenRouter
    `Provider returned error`, помилки причин зупинки на кшталт `Unhandled stop reason:
    error`, JSON-навантаження `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, як-от `ModelNotReadyException`, як
    сигнали таймауту/перевантаження, що потребують відновлення після збою, коли контекст провайдера
    збігається.
    Загальний внутрішній текст резервного збою, як-от `LLM request failed with an unknown
    error.`, залишається консервативним і сам по собі не запускає перехід до резервної моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де розміщені профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша змінна середовища завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - Налаштування з кількома агентами означають, що може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використайте `openclaw models status`, щоб побачити налаштовані моделі й чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск прив'язано до профілю автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо натомість хочете використати ключ API**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що виконуєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав збою?">
    Якщо ваша конфігурація моделей містить Google Gemini як резервну модель (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час переходу до резервної моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервний маршрут туди не вів.

    **Запит LLM відхилено: потрібна сигнатура мислення (Google Antigravity)**

    Причина: історія сеансу містить **блоки мислення без сигнатур** (часто з
    перерваного/часткового потоку). Google Antigravity вимагає сигнатури для блоків мислення.

    Виправлення: тепер OpenClaw вилучає непідписані блоки мислення для Google Antigravity Claude. Якщо це все ще з'являється, почніть **новий сеанс** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов'язано: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або ключ API), прив'язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Щоб переглянути збережені профілі без виведення секретів, запустіть `openclaw models auth list` (необов'язково з `--provider <id>` або `--json`). Докладніше див. [CLI моделей](/uk/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID із префіксом провайдера, як-от:

    - `anthropic:default` (поширено, коли немає ідентичності email)
    - `anthropic:<email>` для ідентичностей OAuth
    - власні ID, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я контролювати, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов'язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє ID з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **періоді очікування** (обмеження частоти/таймаути/збої автентифікації) або довшому **вимкненому** стані (білінг/недостатньо кредитів). Щоб це перевірити, запустіть `openclaw models status --json` і перевірте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Періоди очікування через обмеження частоти можуть бути прив'язані до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для спорідненої моделі в того самого провайдера,
    тоді як білінгові/вимкнені вікна все ще блокують увесь профіль.

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

    Щоб перевірити, що насправді буде спробувано, використайте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб непомітно його пробувати.

  </Accordion>

  <Accordion title="OAuth чи ключ API — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth / вхід через CLI** часто використовує доступ за підпискою там, де
      провайдер це підтримує. Для Anthropic бекенд Claude CLI в OpenClaw використовує
      Claude Code `claude -p`; Anthropic наразі розглядає це як використання Agent
      SDK/програмне використання, з окремим місячним кредитом Agent SDK, починаючи з
      15 червня 2026 року.
    - **Ключі API** використовують білінг із оплатою за токен.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і ключі API.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і перше налаштування](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Відновлення після збою моделі](/uk/concepts/model-failover)
