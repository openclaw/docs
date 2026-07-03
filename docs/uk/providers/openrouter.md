---
read_when:
    - Вам потрібен єдиний API-ключ для багатьох LLMs
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
    - Ви хочете використовувати OpenRouter для генерації музики
    - Ви хочете використовувати OpenRouter для генерації відео
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:58:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей за однією
кінцевою точкою й API-ключем. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw відкриває браузерний потік входу OpenRouter, обмінює код PKCE
        на API-ключ OpenRouter і зберігає цей ключ у стандартному профілі
        автентифікації OpenRouter. На віддалених або headless-хостах OpenClaw виводить
        URL-адресу входу й просить вставити URL-адресу переспрямування після входу.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Під час onboarding типово використовується `openrouter/auto`. Конкретну модель можна вибрати пізніше:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Під час onboarding типово використовується `openrouter/auto`. Конкретну модель можна вибрати пізніше:

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
доступних провайдерів і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованих fallback-варіантів:

| Посилання на модель               | Примітки                         |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | Автоматична маршрутизація OpenRouter |
| `openrouter/openrouter/fusion`    | Маршрутизатор OpenRouter Fusion  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 через MoonshotAI       |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 через MoonshotAI       |

## Генерація зображень

OpenRouter також може забезпечувати роботу інструмента `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

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

OpenClaw надсилає запити зображень до image API chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter. Використовуйте `agents.defaults.imageGenerationModel.timeoutMs` для повільніших моделей зображень OpenRouter; параметр `timeoutMs` для окремого виклику інструмента `image_generate` усе одно має пріоритет.

## Генерація відео

OpenRouter також може забезпечувати роботу інструмента `video_generate` через свій асинхронний API `/videos`. Використовуйте відеомодель OpenRouter у `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` OpenRouter або з документованої кінцевої точки вмісту завдання.
Еталонні зображення типово надсилаються як зображення першого/останнього кадру; зображення,
позначені `reference_image`, надсилаються як вхідні референси OpenRouter. Вбудований
стандартний варіант `google/veo-3.1-fast` оголошує поточно підтримувані тривалості 4/6/8
секунд, роздільні здатності `720P`/`1080P` і співвідношення сторін `16:9`/`9:16`.
Video-to-video не зареєстровано для OpenRouter, оскільки upstream API генерації відео
наразі приймає текст і референси зображень.

## Генерація музики

OpenRouter також може забезпечувати роботу інструмента `music_generate` через audio output
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
`google/lyria-3-pro-preview` і також надає
`google/lyria-3-clip-preview`. OpenClaw надсилає `modalities: ["text",
"audio"]`, вмикає потокове передавання, збирає потокові аудіофрагменти й зберігає
результат як згенероване медіа для доставки каналом. Еталонні зображення
приймаються для моделей Lyria через спільний параметр `music_generate image=...`.

## Text-to-speech

OpenRouter також можна використовувати як TTS-провайдера через його сумісну з OpenAI
кінцеву точку `/audio/speech`.

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

Якщо `messages.tts.providers.openrouter.apiKey` пропущено, TTS повторно використовує
`models.providers.openrouter.apiKey`, а потім `OPENROUTER_API_KEY`.

## Speech-to-text (вхідне аудіо)

OpenRouter може транскрибувати вхідні голосові/аудіовкладення через спільний
шлях `tools.media.audio`, використовуючи свою STT-кінцеву точку (`/audio/transcriptions`).
Це застосовується до будь-якого плагіна каналу, який передає вхідний голос/аудіо до
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

OpenClaw надсилає STT-запити OpenRouter як JSON із base64-аудіо в
`input_audio` (контракт OpenRouter STT), а не як multipart OpenAI form uploads.

## Маршрутизатор Fusion

Використовуйте OpenRouter Fusion, коли потрібно, щоб одне посилання на модель OpenClaw зверталося до кількох
моделей OpenRouter паралельно, OpenRouter оцінював їхні відповіді та повертав
одну фінальну відповідь через звичайну кінцеву точку провайдера OpenRouter. Оскільки
upstream model slug — `openrouter/fusion`, посилання на модель OpenClaw містить
і префікс провайдера OpenClaw, і upstream namespace OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Налаштуйте панель і модель-суддю Fusion через `params.extraBody` моделі. Ці
поля передаються в тіло запиту chat-completions OpenRouter. Fusion
працює як з OAuth onboarding OpenRouter, так і з API-key onboarding; якщо ви використовуєте
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

Список `analysis_models` — це паралельна панель, а `model` у конфігурації плагіна
Fusion — модель-суддя. Не встановлюйте `tool_choice` верхнього рівня в
`"required"` у звичайних ходах агента/чату OpenClaw, щоб спробувати примусово використати Fusion;
ходи OpenClaw можуть містити визначення інструментів OpenClaw, а обов’язковий
вибір інструмента верхнього рівня може вимагати один із цих інструментів замість маршрутизатора Fusion. Коли
ця конфігурація плагіна Fusion присутня, OpenClaw також додає санітизовану
примітку системного prompt із налаштованими моделями аналізу й моделлю-суддею, щоб
агент міг відповідати на запитання про свою поточну панель Fusion. Інші поля `extraBody`
не копіюються в prompt.

Fusion навмисно повільніший. OpenRouter може надіслати той самий prompt OpenClaw до
кількох моделей аналізу, а потім виконати фінальний етап оцінювання/синтезу, тому затримка
зазвичай вища, ніж у прямому запиті до однієї моделі. Використовуйте Fusion для обдуманих,
високоякісних відповідей або шляхів ескалації, а не як типовий варіант для
чату, чутливого до затримки. Для швидших відповідей тримайте панель малою й вибирайте
швидші моделі аналізу та судді.

Перевірте налаштоване посилання одноразовим локальним викликом моделі:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Автентифікація та заголовки

OpenRouter під капотом використовує Bearer token із вашим API-ключем. OpenRouter
OAuth — це потік входу PKCE, який видає API-ключ OpenRouter, тому OpenClaw зберігає
результат як той самий профіль автентифікації API-ключа `openrouter:default`, що використовується
ручним шляхом налаштування API-ключа.

Для наявної інсталяції увійдіть або змініть збережений ключ OpenRouter без
повторного запуску повного onboarding:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Використовуйте `openclaw models auth login --provider openrouter --method api-key`, коли
потрібно вставити ключ, який ви створили вручну в OpenRouter.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
документовані заголовки OpenRouter для attribution застосунку:

| Заголовок                 | Значення                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на інший proxy або базову URL-адресу, OpenClaw
**не** вставлятиме ці специфічні для OpenRouter заголовки або Anthropic cache markers.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Response caching">
    Кешування відповідей OpenRouter вмикається явно. Увімкніть його для окремої моделі OpenRouter за допомогою
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

    OpenClaw надсилає `X-OpenRouter-Cache: true` і, якщо налаштовано,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` примусово оновлює
    поточний запит і зберігає відповідь-заміну. Snake_case aliases
    (`response_cache`, `response_cache_ttl_seconds` і
    `response_cache_clear`) також приймаються.

    Це окремо від кешування prompt провайдера й від Anthropic
    `cache_control` markers OpenRouter. Воно застосовується лише на перевірених
    маршрутах `openrouter.ai`, а не на власних базових URL-адресах proxy.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter Anthropic `cache_control` markers, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках системних/developer prompt.
  </Accordion>

  <Accordion title="Попереднє заповнення міркувань Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic з увімкненими міркуваннями
    відкидають завершальні ходи попереднього заповнення асистента до того, як запит досягне OpenRouter,
    відповідно до вимоги Anthropic, щоб розмови з міркуваннями завершувалися
    ходом користувача.
  </Accordion>

  <Accordion title="Вставлення thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    payload міркувань проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають це вставлення міркувань. Hunter Alpha також пропускає
    проксі-міркування для застарілих налаштованих посилань на моделі, оскільки OpenRouter міг
    повертати текст остаточної відповіді в полях міркувань для цього вилученого маршруту.
  </Accordion>

  <Accordion title="Повторне відтворення міркувань DeepSeek V4">
    На перевірених маршрутах OpenRouter `openrouter/deepseek/deepseek-v4-flash` і
    `openrouter/deepseek/deepseek-v4-pro` заповнюють відсутній `reasoning_content` у
    повторно відтворених ходах асистента, щоб розмови з thinking/інструментами зберігали потрібну
    форму подальшого ходу DeepSeek V4. OpenClaw надсилає підтримувані OpenRouter
    значення `reasoning.effort` для цих маршрутів; нижчі рівні, що не є off, зіставляються з
    `high`, а застарілі перевизначення `max` зіставляються з `xhigh`.
  </Accordion>

  <Accordion title="Формування запиту лише для OpenAI">
    OpenRouter усе ще проходить через проксі-стиль OpenAI-сумісного шляху, тому
    нативне формування запиту лише для OpenAI, як-от `serviceTier`, `store` Responses,
    payload сумісності міркувань OpenAI і підказки кешу prompt, не пересилається.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-Gemini шляху: OpenClaw зберігає
    очищення підписів думок Gemini там, але не вмикає нативну валідацію повторного відтворення Gemini
    або перезаписи bootstrap.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    OpenRouter підтримує об'єкт запиту `provider` для маршрутизації базового провайдера.
    Налаштуйте стандартну політику для всіх запитів текстових моделей OpenRouter
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

    OpenClaw пересилає цей об'єкт до OpenRouter як payload запиту `provider`.
    Використовуйте задокументовані поля snake_case OpenRouter, зокрема `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` і `enforce_distillable_text`.

    Параметри окремої моделі все одно перевизначають об'єкт маршрутизації на рівні провайдера:

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
    Google, OpenAI або спеціального провайдера ігнорують параметри маршрутизації OpenRouter.

  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
