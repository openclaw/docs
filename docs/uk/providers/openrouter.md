---
read_when:
    - Вам потрібен один API-ключ для багатьох LLMs
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації музики
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:13:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей за одним
endpoint і API-ключем. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть OAuth-онбординг">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw відкриває браузерний потік входу OpenRouter, обмінює PKCE
        код на API-ключ OpenRouter і зберігає цей ключ у типовому
        профілі автентифікації OpenRouter. На віддалених/headless хостах OpenClaw виводить
        URL-адресу входу та просить вставити URL-адресу переспрямування після входу.
      </Step>
      <Step title="(Необов’язково) Перемкніться на конкретну модель">
        Онбординг типово використовує `openrouter/auto`. Виберіть конкретну модель пізніше:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API-ключ">
    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустіть онбординг з API-ключем">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Необов’язково) Перемкніться на конкретну модель">
        Онбординг типово використовує `openrouter/auto`. Виберіть конкретну модель пізніше:

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
Посилання на моделі мають шаблон `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованих резервних варіантів:

| Посилання на модель               | Примітки                          |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter |
| `openrouter/openrouter/fusion`    | Маршрутизатор OpenRouter Fusion   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI        |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI        |

## Генерація зображень

OpenRouter також може підтримувати інструмент `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

OpenClaw надсилає запити зображень до API зображень chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` на окремий виклик інструмента `image_generate` все одно має пріоритет.

## Генерація відео

OpenRouter також може підтримувати інструмент `video_generate` через свій асинхронний API `/videos`. Використовуйте модель відео OpenRouter у `agents.defaults.videoGenerationModel`:

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

OpenClaw надсилає завдання text-to-video та image-to-video до OpenRouter, опитує
повернений `polling_url` і завантажує завершене відео з
`unsigned_urls` OpenRouter або задокументованого endpoint вмісту завдання.
Референсні зображення типово надсилаються як зображення першого/останнього кадру; зображення
з тегом `reference_image` надсилаються як вхідні референси OpenRouter. Типова
вбудована модель `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream
API генерації відео наразі приймає текст і референси зображень.

## Генерація музики

OpenRouter також може підтримувати інструмент `music_generate` через аудіовихід
chat completions. Використовуйте аудіомодель OpenRouter у
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

Вбудований музичний провайдер OpenRouter типово використовує
`google/lyria-3-pro-preview`, а також надає
`google/lyria-3-clip-preview`. OpenClaw надсилає `modalities: ["text",
"audio"]`, вмикає стримінг, збирає потокові аудіофрагменти та зберігає
результат як згенероване медіа для доставки в канал. Референсні зображення
приймаються для моделей Lyria через спільний параметр `music_generate image=...`.

## Text-to-speech

OpenRouter також можна використовувати як TTS-провайдера через його сумісний з OpenAI
endpoint `/audio/speech`.

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

Якщо `messages.tts.providers.openrouter.apiKey` не вказано, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Speech-to-text (вхідне аудіо)

OpenRouter може транскрибувати вхідні голосові/аудіовкладення через спільний
шлях `tools.media.audio`, використовуючи свій STT endpoint (`/audio/transcriptions`).
Це стосується будь-якого channel plugin, який передає вхідний голос/аудіо до
попередньої перевірки розуміння медіа.

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

OpenClaw надсилає STT-запити OpenRouter як JSON з base64-аудіо в
`input_audio` (контракт OpenRouter STT), а не як multipart завантаження форми OpenAI.

## Маршрутизатор Fusion

Використовуйте OpenRouter Fusion, коли хочете, щоб одне посилання на модель OpenClaw запитувало кілька
моделей OpenRouter паралельно, щоб OpenRouter оцінив їхні відповіді та повернув
одну фінальну відповідь через звичайний endpoint провайдера OpenRouter. Оскільки
upstream slug моделі — `openrouter/fusion`, посилання на модель OpenClaw містить
і префікс провайдера OpenClaw, і upstream простір імен OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Налаштуйте панель і суддю Fusion через `params.extraBody` моделі. Ці
поля передаються в тіло запиту chat-completions OpenRouter. Fusion
працює як з OAuth-онбордингом OpenRouter, так і з онбордингом API-ключа; якщо ви використовуєте
OAuth, пропустіть рядок `env.OPENROUTER_API_KEY` у прикладі нижче.

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

Список `analysis_models` — це паралельна панель, а `model` у конфігурації Fusion
plugin — модель-суддя. Не встановлюйте верхньорівневий `tool_choice` на
`"required"` у звичайних агентських/chat ходах OpenClaw, щоб спробувати примусово ввімкнути Fusion;
ходи OpenClaw можуть містити визначення інструментів OpenClaw, і верхньорівневий обов’язковий
вибір інструмента може вимагати один із цих інструментів замість маршрутизатора Fusion. Коли
ця конфігурація Fusion plugin присутня, OpenClaw також додає очищену
примітку системного prompt із налаштованими моделями аналізу та моделлю-суддею, щоб
агент міг відповідати на запитання про свою поточну панель Fusion. Інші поля `extraBody`
не копіюються в prompt.

Fusion повільніший за задумом. OpenRouter може надіслати той самий prompt OpenClaw до
кількох моделей аналізу, а потім виконати фінальний крок суддівства/синтезу, тому затримка
зазвичай вища, ніж у прямого запиту до однієї моделі. Використовуйте Fusion для продуманих,
високоякісних відповідей або шляхів ескалації, а не як типовий варіант для
чату, чутливого до затримки. Для швидших відповідей тримайте панель невеликою та обирайте
швидші моделі аналізу й суддівства.

Перевірте налаштоване посилання одноразовим локальним викликом моделі:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Автентифікація та заголовки

OpenRouter всередині використовує Bearer token з вашим API-ключем. OpenRouter
OAuth — це потік входу PKCE, який видає API-ключ OpenRouter, тому OpenClaw зберігає
результат як той самий профіль автентифікації API-ключа `openrouter:default`, що використовується
шляхом ручного налаштування API-ключа.

Для наявного встановлення увійдіть або змініть збережений ключ OpenRouter без
повторного запуску повного онбордингу:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Використовуйте `openclaw models auth login --provider openrouter --method api-key`, коли
хочете вставити ключ, який ви створили вручну в OpenRouter.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки OpenRouter для атрибуції застосунку:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший проксі або базову URL-адресу, OpenClaw
**не** вставляє ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Кешування відповідей">
    Кешування відповідей OpenRouter є опціональним. Увімкніть його для кожної моделі OpenRouter за допомогою
    параметрів моделі:

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

    OpenClaw надсилає `X-OpenRouter-Cache: true` і, коли налаштовано,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` примусово оновлює
    поточний запит і зберігає замінну відповідь. Snake_case aliases
    (`response_cache`, `response_cache_ttl_seconds` і
    `response_cache_clear`) також приймаються.

    Це окремо від кешування prompt провайдера та від маркерів Anthropic
    `cache_control` OpenRouter. Воно застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на користувацьких базових URL-адресах проксі.

  </Accordion>

  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу prompt у блоках системних/розробницьких prompt.
  </Accordion>

  <Accordion title="Попереднє заповнення міркувань Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненими міркуваннями
    відкидають кінцеві ходи попереднього заповнення асистента до того, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, що розмови з міркуваннями мають завершуватися ходом
    користувача.
  </Accordion>

  <Accordion title="Вставлення thinking / міркувань">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    payload міркувань проксі OpenRouter. Непідтримувані підказки моделі та
    `openrouter/auto` пропускають це вставлення міркувань. Hunter Alpha також пропускає
    міркування проксі для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг би
    повернути текст остаточної відповіді в полях міркувань для цього виведеного з обігу маршруту.
  </Accordion>

  <Accordion title="Відтворення міркувань DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторно відтворених ходах асистента, щоб розмови з thinking/інструментами зберігали потрібну для DeepSeek V4
    форму подальшого ходу. OpenClaw надсилає підтримувані OpenRouter
    значення `reasoning_effort` для цих маршрутів; `xhigh` є найвищим оголошеним
    рівнем, а застарілі перевизначення `max` зіставляються з `xhigh`.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter досі проходить через проксі-стиль OpenAI-сумісного шляху, тому
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    сумісні з міркуваннями OpenAI payload, і підказки кешу prompt не пересилаються.
  </Accordion>

  <Accordion title="Маршрути на основі Gemini">
    Посилання OpenRouter на основі Gemini залишаються на проксі-Gemini шляху: OpenClaw зберігає
    там очищення підписів думок Gemini, але не вмикає нативну перевірку відтворення Gemini
    чи переписування bootstrap.
  </Accordion>

  <Accordion title="Метадані маршрутизації Provider">
    OpenRouter підтримує об'єкт запиту `provider` для маршрутизації базового provider.
    Налаштуйте типову політику для всіх запитів текстових моделей OpenRouter
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

    OpenClaw пересилає цей об'єкт до OpenRouter як payload `provider` запиту.
    Використовуйте задокументовані OpenRouter поля snake_case, зокрема `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` і `enforce_distillable_text`.

    Параметри окремої моделі й далі перевизначають об'єкт маршрутизації для всього provider:

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

    Це застосовується лише на маршрутах chat-completions OpenRouter. Прямі маршрути Anthropic,
    Google, OpenAI або кастомного provider ігнорують параметри маршрутизації OpenRouter.

  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і provider.
  </Card>
</CardGroup>
