---
read_when:
    - Ви хочете орієнтований на конфіденційність інференс в OpenClaw
    - Вам потрібні вказівки з налаштування Venice AI
summary: Використовуйте орієнтовані на конфіденційність моделі Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-25T18:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI надає **орієнтований на конфіденційність AI-інференс** із підтримкою нецензурованих моделей і доступом до основних пропрієтарних моделей через їхній анонімізований проксі. Увесь інференс приватний за замовчуванням — без навчання на ваших даних, без журналювання.

## Чому Venice в OpenClaw

- **Приватний інференс** для моделей з відкритим кодом (без журналювання).
- **Нецензуровані моделі**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- OpenAI-сумісні ендпойнти `/v1`.

## Режими конфіденційності

Venice пропонує два рівні конфіденційності — розуміння цієї різниці є ключовим для вибору моделі:

| Режим          | Опис                                                                                                                              | Моделі                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Повністю приватний. Промпти/відповіді **ніколи не зберігаються і не журналюються**. Ефемерний.                                   | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored тощо. |
| **Anonymized** | Передається через проксі Venice з видаленням метаданих. Базовий провайдер (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі **не є** повністю приватними. Venice видаляє метадані перед пересиланням, але базовий провайдер (OpenAI, Anthropic, Google, xAI) однаково обробляє запит. Вибирайте моделі **Private**, коли потрібна повна конфіденційність.
</Warning>

## Можливості

- **Орієнтованість на конфіденційність**: вибір між режимами "private" (повністю приватний) і "anonymized" (через проксі)
- **Нецензуровані моделі**: доступ до моделей без контентних обмежень
- **Доступ до основних моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований проксі Venice
- **OpenAI-сумісний API**: стандартні ендпойнти `/v1` для простої інтеграції
- **Потокова передача**: підтримується для всіх моделей
- **Виклики функцій**: підтримуються для окремих моделей (перевіряйте можливості моделі)
- **Vision**: підтримується на моделях із підтримкою зору
- **Без жорстких лімітів швидкості**: для екстремального використання може застосовуватися обмеження за принципом fair use

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть у **Settings > API Keys > Create new key**
    3. Скопіюйте свій API-ключ (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Налаштуйте OpenClaw">
    Виберіть бажаний спосіб налаштування:

    <Tabs>
      <Tab title="Інтерактивно (рекомендовано)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Це:
        1. Запросить ваш API-ключ (або використає наявний `VENICE_API_KEY`)
        2. Покажe всі доступні моделі Venice
        3. Дозволить вибрати вашу модель за замовчуванням
        4. Автоматично налаштує провайдера
      </Tab>
      <Tab title="Змінна середовища">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Неінтерактивно">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Перевірте налаштування">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Вибір моделі

Після налаштування OpenClaw покаже всі доступні моделі Venice. Вибирайте залежно від ваших потреб:

- **Модель за замовчуванням**: `venice/kimi-k2-5` для сильного приватного міркування плюс vision.
- **Варіант із високими можливостями**: `venice/claude-opus-4-6` для найпотужнішого анонімізованого шляху Venice.
- **Конфіденційність**: вибирайте моделі "private" для повністю приватного інференсу.
- **Можливості**: вибирайте моделі "anonymized", щоб отримати доступ до Claude, GPT, Gemini через проксі Venice.

Змініть модель за замовчуванням у будь-який час:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Показати всі доступні моделі:

```bash
openclaw models list | grep venice
```

Ви також можете запустити `openclaw configure`, вибрати **Model/auth** і вибрати **Venice AI**.

<Tip>
Використовуйте таблицю нижче, щоб вибрати правильну модель для вашого сценарію використання.

| Сценарій використання        | Рекомендована модель             | Чому                                         |
| ---------------------------- | -------------------------------- | -------------------------------------------- |
| **Загальний чат (типово)**   | `kimi-k2-5`                      | Сильне приватне міркування плюс vision       |
| **Найкраща загальна якість** | `claude-opus-4-6`                | Найсильніший анонімізований варіант Venice   |
| **Конфіденційність + кодування** | `qwen3-coder-480b-a35b-instruct` | Приватна модель для кодування з великим контекстом |
| **Приватний vision**         | `kimi-k2-5`                      | Підтримка vision без виходу з приватного режиму |
| **Швидко + дешево**          | `qwen3-4b`                       | Легка модель міркування                      |
| **Складні приватні задачі**  | `deepseek-v3.2`                  | Сильне міркування, але без підтримки інструментів Venice |
| **Нецензуровано**            | `venice-uncensored`              | Без контентних обмежень                      |

</Tip>

## Поведінка повторного відтворення DeepSeek V4

Якщо Venice надає моделі DeepSeek V4, такі як `venice/deepseek-v4-pro` або
`venice/deepseek-v4-flash`, OpenClaw заповнює потрібний заповнювач повторного відтворення DeepSeek V4
`reasoning_content` у ходах виклику інструментів асистента, коли
проксі його пропускає. Venice відхиляє власний верхньорівневий параметр керування `thinking` від DeepSeek,
тому OpenClaw тримає це специфічне для провайдера виправлення повторного відтворення окремо від нативних
параметрів керування thinking у провайдера DeepSeek.

## Вбудований каталог (усього 41)

<AccordionGroup>
  <Accordion title="Private models (26) — повністю приватні, без журналювання">
    | Model ID                               | Назва                               | Контекст | Можливості                 |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Типова, міркування, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Міркування                 |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Загальне призначення       |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Загальне призначення       |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Загальне призначення, інструменти вимкнено |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Міркування                 |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Загальне призначення       |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Кодування                  |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Кодування                  |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Міркування, vision         |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Загальне призначення       |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Швидко, міркування         |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Міркування, інструменти вимкнено |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Нецензуровано, інструменти вимкнено |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Загальне призначення       |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Загальне призначення       |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Міркування                 |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Загальне призначення       |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Міркування                 |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Міркування                 |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Міркування                 |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Міркування                 |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Міркування                 |
  </Accordion>

  <Accordion title="Anonymized models (15) — через проксі Venice">
    | Model ID                        | Назва                          | Контекст | Можливості                |
    | ------------------------------- | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M       | Міркування, vision        |
    | `claude-opus-4-5`               | Claude Opus 4.5 (через Venice) | 198k     | Міркування, vision        |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M     | Міркування, vision        |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (через Venice) | 198k   | Міркування, vision        |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M       | Міркування, vision        |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k     | Міркування, vision, кодування |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k     | Міркування                |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k     | Міркування, vision, кодування |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k     | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k     | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M       | Міркування, vision        |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k     | Міркування, vision        |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k     | Міркування, vision        |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M       | Міркування, vision        |
    | `grok-code-fast-1`              | Grok Code Fast 1 (через Venice) | 256k    | Міркування, кодування     |
  </Accordion>
</AccordionGroup>

## Виявлення моделей

OpenClaw автоматично виявляє моделі через API Venice, коли встановлено `VENICE_API_KEY`. Якщо API недоступний, він повертається до статичного каталогу.

Ендпойнт `/models` є публічним (автентифікація не потрібна для перегляду списку), але для інференсу потрібен дійсний API-ключ.

## Потокова передача та підтримка інструментів

| Можливість           | Підтримка                                               |
| -------------------- | ------------------------------------------------------- |
| **Потокова передача** | Усі моделі                                              |
| **Виклики функцій**  | Більшість моделей (перевіряйте `supportsFunctionCalling` в API) |
| **Vision/зображення** | Моделі, позначені можливістю "Vision"                   |
| **Режим JSON**       | Підтримується через `response_format`                   |

## Тарифікація

Venice використовує систему на основі кредитів. Перевіряйте актуальні тарифи на [venice.ai/pricing](https://venice.ai/pricing):

- **Private models**: зазвичай нижча вартість
- **Anonymized models**: приблизно як пряме API-тарифікування + невелика комісія Venice

### Venice (anonymized) проти прямого API

| Аспект       | Venice (Anonymized)            | Прямий API          |
| ------------ | ------------------------------ | ------------------- |
| **Конфіденційність** | Метадані видалено, анонімізовано | Ваш обліковий запис прив’язано |
| **Затримка** | +10-50 мс (проксі)             | Напряму             |
| **Можливості** | Підтримується більшість можливостей | Усі можливості      |
| **Оплата**   | Кредити Venice                 | Тарифікація провайдера |

## Приклади використання

```bash
# Використати типову private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Використати Claude Opus через Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Використати нецензуровану модель
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Використати vision model із зображенням
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Використати модель для кодування
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="API-ключ не розпізнається">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Переконайтеся, що ключ починається з `vapi_`.

  </Accordion>

  <Accordion title="Модель недоступна">
    Каталог моделей Venice оновлюється динамічно. Запустіть `openclaw models list`, щоб побачити моделі, доступні зараз. Деякі моделі можуть бути тимчасово офлайн.
  </Accordion>

  <Accordion title="Проблеми зі з’єднанням">
    API Venice доступний за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Приклад конфігураційного файла">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Домашня сторінка Venice AI та реєстрація облікового запису.
  </Card>
  <Card title="Документація API" href="https://docs.venice.ai" icon="book">
    Довідник API Venice та документація для розробників.
  </Card>
  <Card title="Тарифікація" href="https://venice.ai/pricing" icon="credit-card">
    Актуальні кредитні тарифи та плани Venice.
  </Card>
</CardGroup>
