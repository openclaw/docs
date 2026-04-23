---
read_when:
    - Ви хочете inference, орієнтований на приватність, в OpenClaw
    - Вам потрібні вказівки з налаштування Venice AI
summary: Використання орієнтованих на приватність моделей Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-23T21:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17597207ea42b246c636b6512015c72040fbb85cc57f00edb81d4c038868a86d
    source_path: providers/venice.md
    workflow: 15
---

Venice AI надає **орієнтований на приватність AI inference** з підтримкою моделей без цензури та доступом до основних пропрієтарних моделей через їхній анонімізований проксі. Увесь inference є приватним за замовчуванням — без навчання на ваших даних і без журналювання.

## Навіщо Venice в OpenClaw

- **Приватний inference** для open-source моделей (без журналювання).
- **Моделі без цензури**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- OpenAI-compatible endpoint `/v1`.

## Режими приватності

Venice пропонує два рівні приватності — розуміння цього є ключовим для вибору вашої моделі:

| Режим          | Опис                                                                                                                           | Моделі                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Private**    | Повністю приватний. Запити/відповіді **ніколи не зберігаються і не журналюються**. Ефемерний режим.                          | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored тощо. |
| **Anonymized** | Проксіюється через Venice з видаленими метаданими. Базовий провайдер (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі **не** є повністю приватними. Venice видаляє метадані перед пересиланням, але базовий провайдер (OpenAI, Anthropic, Google, xAI) усе одно обробляє запит. Вибирайте моделі **Private**, коли потрібна повна приватність.
</Warning>

## Можливості

- **Орієнтованість на приватність**: вибір між режимами "private" (повністю приватний) і "anonymized" (через проксі)
- **Моделі без цензури**: доступ до моделей без обмежень на контент
- **Доступ до великих моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований проксі Venice
- **OpenAI-compatible API**: стандартні endpoint `/v1` для легкої інтеграції
- **Потокова передача**: підтримується для всіх моделей
- **Function calling**: підтримується для окремих моделей (перевіряйте можливості моделі)
- **Vision**: підтримується в моделях з можливістю vision
- **Без жорстких rate limit**: для екстремального використання може застосовуватися fair-use throttling

## Початок роботи

<Steps>
  <Step title="Отримайте свій API key">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть у **Settings > API Keys > Create new key**
    3. Скопіюйте свій API key (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Налаштуйте OpenClaw">
    Виберіть бажаний спосіб налаштування:

    <Tabs>
      <Tab title="Інтерактивно (рекомендовано)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Це:
        1. Запросить ваш API key (або використає наявний `VENICE_API_KEY`)
        2. Покажe всі доступні моделі Venice
        3. Дозволить вибрати типову модель
        4. Автоматично налаштує провайдера
      </Tab>
      <Tab title="Змінна середовища">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
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

Після налаштування OpenClaw показує всі доступні моделі Venice. Обирайте залежно від ваших потреб:

- **Типова модель**: `venice/kimi-k2-5` для сильного приватного reasoning плюс vision.
- **Варіант з високими можливостями**: `venice/claude-opus-4-6` для найсильнішого анонімізованого шляху Venice.
- **Приватність**: обирайте моделі "private" для повністю приватного inference.
- **Можливості**: обирайте моделі "anonymized", щоб отримати доступ до Claude, GPT, Gemini через проксі Venice.

Змінити типову модель можна будь-коли:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Перелік усіх доступних моделей:

```bash
openclaw models list | grep venice
```

Ви також можете запустити `openclaw configure`, вибрати **Model/auth**, а потім **Venice AI**.

<Tip>
Скористайтеся таблицею нижче, щоб вибрати правильну модель для свого сценарію.

| Сценарій використання       | Рекомендована модель              | Чому                                           |
| --------------------------- | --------------------------------- | ---------------------------------------------- |
| **Загальний чат (типово)**  | `kimi-k2-5`                       | Сильне приватне reasoning плюс vision          |
| **Найкраща загальна якість**| `claude-opus-4-6`                 | Найсильніший анонімізований варіант Venice     |
| **Приватність + кодування** | `qwen3-coder-480b-a35b-instruct`  | Приватна модель для кодування з великим контекстом |
| **Приватне vision**         | `kimi-k2-5`                       | Підтримка vision без виходу з private mode     |
| **Швидко + дешево**         | `qwen3-4b`                        | Легка модель reasoning                         |
| **Складні приватні завдання** | `deepseek-v3.2`                 | Сильне reasoning, але без підтримки інструментів Venice |
| **Без цензури**             | `venice-uncensored`               | Без обмежень на контент                        |

</Tip>

## Доступні моделі (усього 41)

<AccordionGroup>
  <Accordion title="Private models (26) — повністю приватні, без журналювання">
    | ID моделі                              | Назва                               | Контекст | Можливості                |
    | -------------------------------------- | ----------------------------------- | -------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Типова, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Reasoning                 |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Загальне                  |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Загальне                  |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Загальне, tools вимкнено  |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Reasoning                 |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Загальне                  |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Кодування                 |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Кодування                 |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Reasoning, vision         |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Загальне                  |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                    |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Швидка, reasoning         |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Reasoning, tools вимкнено |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Без цензури, tools вимкнено |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                    |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Загальне                  |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Загальне                  |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Reasoning                 |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Загальне                  |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Reasoning                 |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Reasoning                 |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Reasoning                 |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Reasoning                 |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Reasoning                 |
  </Accordion>

  <Accordion title="Anonymized models (15) — через проксі Venice">
    | ID моделі                       | Назва                          | Контекст | Можливості                 |
    | ------------------------------- | ------------------------------ | -------- | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M       | Reasoning, vision          |
    | `claude-opus-4-5`               | Claude Opus 4.5 (через Venice) | 198k     | Reasoning, vision          |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M     | Reasoning, vision          |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (через Venice) | 198k   | Reasoning, vision          |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M       | Reasoning, vision          |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k     | Reasoning, vision, coding  |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k     | Reasoning                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k     | Reasoning, vision, coding  |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k     | Vision                     |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k     | Vision                     |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M       | Reasoning, vision          |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k     | Reasoning, vision          |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k     | Reasoning, vision          |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M       | Reasoning, vision          |
    | `grok-code-fast-1`              | Grok Code Fast 1 (через Venice) | 256k    | Reasoning, coding          |
  </Accordion>
</AccordionGroup>

## Виявлення моделей

OpenClaw автоматично виявляє моделі з API Venice, коли встановлено `VENICE_API_KEY`. Якщо API недоступний, використовується запасний варіант — статичний каталог.

Endpoint `/models` є публічним (автентифікація не потрібна для перегляду), але inference вимагає дійсного API key.

## Потокова передача та підтримка інструментів

| Можливість          | Підтримка                                            |
| ------------------- | ---------------------------------------------------- |
| **Потокова передача** | Усі моделі                                         |
| **Function calling** | Більшість моделей (перевіряйте `supportsFunctionCalling` в API) |
| **Vision/Images**   | Моделі, позначені можливістю "Vision"                |
| **JSON mode**       | Підтримується через `response_format`                |

## Ціни

Venice використовує систему на основі кредитів. Актуальні тарифи дивіться на [venice.ai/pricing](https://venice.ai/pricing):

- **Private models**: зазвичай нижча вартість
- **Anonymized models**: приблизно як пряме API-ціноутворення + невелика комісія Venice

### Venice (анонімізовано) проти прямого API

| Аспект       | Venice (анонімізовано)         | Прямий API           |
| ------------ | ------------------------------ | -------------------- |
| **Приватність** | Метадані видалено, анонімізовано | Ваш обліковий запис прив’язаний |
| **Затримка** | +10-50 мс (проксі)             | Напряму              |
| **Можливості** | Підтримується більшість можливостей | Повні можливості |
| **Білінг**   | Кредити Venice                 | Білінг провайдера    |

## Приклади використання

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Усунення неполадок

<AccordionGroup>
  <Accordion title="API key не розпізнається">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Переконайтеся, що ключ починається з `vapi_`.

  </Accordion>

  <Accordion title="Модель недоступна">
    Каталог моделей Venice оновлюється динамічно. Запустіть `openclaw models list`, щоб побачити поточний список доступних моделей. Деякі моделі можуть бути тимчасово офлайн.
  </Accordion>

  <Accordion title="Проблеми з підключенням">
    API Venice знаходиться за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення неполадок](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Приклад файла конфігурації">
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
    Вибір провайдерів, посилань на моделі та поведінки запасних варіантів.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Домашня сторінка Venice AI і реєстрація облікового запису.
  </Card>
  <Card title="Документація API" href="https://docs.venice.ai" icon="book">
    Довідник API Venice і документація для розробників.
  </Card>
  <Card title="Ціни" href="https://venice.ai/pricing" icon="credit-card">
    Поточні кредитні тарифи та плани Venice.
  </Card>
</CardGroup>
