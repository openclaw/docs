---
read_when:
    - Вам потрібен єдиний ключ API для багатьох великих мовних моделей
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерування зображень
    - Ви хочете використовувати OpenRouter для створення музики
    - Ви хочете використовувати OpenRouter для створення відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T13:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter спрямовує запити до багатьох моделей через єдиний API та один ключ. Він
сумісний з OpenAI, тому OpenClaw взаємодіє з ним через той самий транспорт у стилі
`openai-completions`, який використовується для інших проксі-провайдерів.

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть початкове налаштування OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw відкриває в браузері процес входу OpenRouter (PKCE), обмінює
        код на ключ API OpenRouter і зберігає його в профілі автентифікації
        OpenRouter за замовчуванням. На віддалених хостах або хостах без графічного
        інтерфейсу OpenClaw виводить URL-адресу входу й просить вставити URL-адресу
        переспрямування після входу.
      </Step>
      <Step title="(Необов’язково) Перейдіть на конкретну модель">
        Під час початкового налаштування за замовчуванням використовується `openrouter/auto`. Конкретну модель можна вибрати пізніше:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ API на сторінці [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустіть початкове налаштування з ключем API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Необов’язково) Перейдіть на конкретну модель">
        Під час початкового налаштування за замовчуванням використовується `openrouter/auto`. Конкретну модель можна вибрати пізніше:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Посилання на моделі

<Note>
Посилання на моделі мають формат `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей див. у розділі [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Вбудовані резервні моделі, що використовуються, коли динамічне виявлення каталогу недоступне:

| Посилання на модель               | Примітки                              |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Автоматичне спрямування OpenRouter    |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI            |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI            |

Будь-яке інше посилання `openrouter/<provider>/<model>`, зокрема
`openrouter/openrouter/fusion` (див. [маршрутизатор Fusion](#fusion-router)), динамічно
зіставляється з актуальним каталогом моделей OpenRouter.

## Генерування зображень

OpenRouter може забезпечувати роботу інструмента `image_generate`. Укажіть модель
OpenRouter для зображень у `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw надсилає запити на зображення до API зображень chat-completions OpenRouter
із параметром `modalities: ["image", "text"]`. Моделі Gemini для зображень додатково
отримують підказки `aspectRatio` і `resolution` через `image_config` OpenRouter;
інші моделі зображень їх не отримують. Для повільніших моделей використовуйте
`agents.defaults.imageGenerationModel.timeoutMs`; значення `timeoutMs`, передане
під час окремого виклику інструмента `image_generate`, усе одно має пріоритет.

## Генерування відео

OpenRouter може забезпечувати роботу інструмента `video_generate` через свій
асинхронний API `/videos`. Укажіть модель OpenRouter для відео в
`agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw надсилає завдання перетворення тексту на відео та зображення на відео,
опитує повернену `polling_url` і завантажує готове відео з `unsigned_urls`
OpenRouter або кінцевої точки вмісту завдання. Еталонні зображення за замовчуванням
використовуються як перший або останній кадр; натомість зображення з позначкою
`reference_image` надсилаються як вхідні еталони. Вбудована модель
`google/veo-3.1-fast` за замовчуванням підтримує тривалість 4/6/8 секунд, роздільну
здатність `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Перетворення відео на відео не підтримується: вищерівневий API приймає лише текстові
та графічні еталони.

## Генерування музики

OpenRouter може забезпечувати роботу інструмента `music_generate` через аудіовихід
chat-completions. Укажіть аудіомодель OpenRouter у
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Вбудований провайдер музики OpenRouter за замовчуванням використовує
`google/lyria-3-pro-preview`, а також надає `google/lyria-3-clip-preview`. OpenClaw
надсилає `modalities: ["text", "audio"]`, потоково отримує відповідь, збирає
аудіофрагменти та зберігає результат як згенерований медіафайл для доставлення
через канал. Моделі Lyria приймають одне еталонне зображення через спільний
параметр `music_generate image=...`. Обсяг потокового аудіо, збереженого транскрипту
та похідної оболонки подій SSE обмежується параметром `agents.defaults.mediaMaxMb`
(обмеження аудіо за замовчуванням становить 16 МБ).

## Перетворення тексту на мовлення

OpenRouter може працювати як провайдер TTS через свій сумісний з OpenAI
кінцевий пункт `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Якщо `messages.tts.providers.openrouter.apiKey` не вказано, TTS послідовно
використовує `models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Перетворення мовлення на текст (вхідне аудіо)

OpenRouter може транскрибувати вхідні голосові й аудіовкладення через спільний
шлях `tools.media.audio`, використовуючи свій кінцевий пункт STT (`/audio/transcriptions`).
Це стосується будь-якого плагіна каналу, який передає вхідне голосове повідомлення
або аудіо до попередньої обробки розпізнавання медіаданих.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw надсилає запити STT до OpenRouter у форматі JSON з аудіо у форматі
base64 у полі `input_audio` (контракт STT OpenRouter), а не як передавання
форм OpenAI у форматі multipart.

## Маршрутизатор Fusion

OpenRouter Fusion паралельно надсилає одне посилання на модель OpenClaw кільком
моделям OpenRouter, доручає OpenRouter оцінити їхні відповіді та повертає одну
остаточну відповідь через звичайний кінцевий пункт OpenRouter. Ідентифікатор
висхідної моделі — `openrouter/fusion`, тому посилання на модель OpenClaw містить
і префікс провайдера OpenClaw, і простір імен висхідного OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Налаштуйте панель і модель-арбітр Fusion через `params.extraBody` моделі;
ці поля безпосередньо передаються в тіло запиту завершення чату OpenRouter.
Fusion працює як із початковим налаштуванням через OAuth, так і через ключ API;
якщо ви використовуєте OAuth, не додавайте наведений нижче рядок
`env.OPENROUTER_API_KEY`.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` — це паралельна панель; `model` у конфігурації плагіна Fusion —
модель-арбітр. Не встановлюйте значення `"required"` для `tool_choice` верхнього
рівня у звичайних сеансах агента або чату, намагаючись примусово використати
Fusion: сеанси OpenClaw можуть містити власні визначення інструментів, і
обов'язковий вибір інструмента верхнього рівня може вибрати один із них замість
маршрутизатора Fusion. Коли ця конфігурація плагіна Fusion наявна, OpenClaw
додає до системної підказки очищену примітку з переліком налаштованих моделей
аналізу та моделі-арбітра, щоб агент міг відповідати на запитання про власну
панель Fusion. Інші поля `extraBody` до підказки не копіюються.

Fusion повільніший за задумом: OpenRouter розподіляє підказку між кількома
моделями аналізу, а потім виконує етап оцінювання й синтезу, тому затримка вища,
ніж у прямого запиту до однієї моделі. Використовуйте його для обдуманих,
високоякісних відповідей або шляхів ескалації, а не як типовий варіант для
сценаріїв, чутливих до затримки. Зберігайте панель невеликою та вибирайте
швидші моделі аналізу й оцінювання для швидшого отримання відповідей.

Перевірте налаштоване посилання одноразовим локальним викликом:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Автентифікація та заголовки

OpenRouter використовує токен Bearer із вашого ключа API. OAuth OpenRouter —
це процес входу PKCE, який видає ключ API OpenRouter, тому OpenClaw зберігає
результат у тому самому профілі автентифікації за ключем API
`openrouter:default`, який використовується під час ручного налаштування ключа
API.

Щоб увійти або замінити збережений ключ у наявному встановленні без повторного
повного початкового налаштування:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

До перевірених запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw
додає документовані OpenRouter заголовки атрибуції застосунку:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдер OpenRouter на інший проксі-сервер або базову
URL-адресу, OpenClaw **не** додаватиме ці специфічні для OpenRouter заголовки
або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Кешування відповідей">
    Кешування відповідей OpenRouter потрібно вмикати окремо. Увімкніть його
    для кожної моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw надсилає `X-OpenRouter-Cache: true` і, якщо налаштовано,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` примусово оновлює
    поточний запит і зберігає нову відповідь. Також підтримуються псевдоніми
    у форматі snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), а також `responseCacheTtl` /
    `response_cache_ttl` без суфікса `Seconds`.

    Це окремий механізм від кешування підказок провайдером і маркерів Anthropic
    `cache_control` в OpenRouter. Він застосовується лише до перевірених
    маршрутів `openrouter.ai`, а не до власних базових URL-адрес проксі-серверів.

  </Accordion>

  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    маркери Anthropic `cache_control` від OpenRouter для ефективнішого повторного
    використання кешу підказок у блоках системних підказок і підказок розробника.
  </Accordion>

  <Accordion title="Попереднє заповнення міркувань Anthropic">
    На перевірених маршрутах OpenRouter для посилань на моделі Anthropic з увімкненим міркуванням
    кінцеві ходи попереднього заповнення асистента вилучаються до того, як запит надійде до
    OpenRouter, відповідно до вимоги Anthropic, за якою діалоги з міркуваннями
    мають завершуватися ходом користувача.
  </Accordion>

  <Accordion title="Впровадження обдумування / міркування">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень обдумування
    з корисним навантаженням міркування проксі OpenRouter. Для `openrouter/auto` та непідтримуваних
    підказок моделей це впровадження пропускається. Для застарілих посилань `openrouter/hunter-alpha` воно також
    пропускається, оскільки OpenRouter міг повертати текст остаточної відповіді в полях міркування
    на цьому виведеному з експлуатації маршруті.
  </Accordion>

  <Accordion title="Відтворення міркувань DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутнє `reasoning_content` у
    відтворених ходах асистента, зберігаючи діалоги обдумування/використання інструментів у формі
    подальшої взаємодії, яку вимагає DeepSeek V4. OpenClaw надсилає підтримувані OpenRouter
    значення `reasoning.effort` для цих маршрутів: `xhigh`/`max` зіставляються з `xhigh`,
    а будь-який інший не вимкнений рівень — із `high`.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter працює через проксі-шлях, сумісний з OpenAI, тому нативне
    формування запитів лише для OpenAI, як-от `serviceTier`, `store` у Responses,
    корисні навантаження сумісності міркувань OpenAI та підказки кешу промптів, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-шляху Gemini: OpenClaw зберігає
    там очищення підписів думок Gemini, але не вмикає нативну
    перевірку відтворення Gemini або перезаписи початкової ініціалізації.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    OpenRouter підтримує об’єкт запиту `provider` для маршрутизації через базового провайдера.
    Налаштуйте політику за замовчуванням для всіх запитів текстових моделей OpenRouter
    за допомогою `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw пересилає цей об’єкт до OpenRouter як корисне навантаження запиту `provider`.
    Використовуйте задокументовані OpenRouter поля у форматі snake_case, зокрема `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` і `enforce_distillable_text`.

    Параметри окремої моделі перевизначають об’єкт маршрутизації на рівні провайдера:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Це застосовується лише до маршрутів завершення чатів OpenRouter. Прямі маршрути Anthropic,
    Google, OpenAI або власних провайдерів ігнорують параметри маршрутизації OpenRouter.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації агентів, моделей і провайдерів.
  </Card>
</CardGroup>
