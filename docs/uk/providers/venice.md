---
read_when:
    - Вам потрібен орієнтований на конфіденційність інференс в OpenClaw
    - Вам потрібні вказівки з налаштування Venice AI
summary: Використовуйте моделі Venice AI, орієнтовані на конфіденційність, в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-06-27T18:14:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI надає **орієнтований на приватність AI inference** з підтримкою нецензурованих моделей і доступом до основних пропрієтарних моделей через їхній анонімізований proxy. Увесь inference за замовчуванням приватний — без навчання на ваших даних, без журналювання.

## Навіщо Venice в OpenClaw

- **Приватний inference** для моделей з відкритим кодом (без журналювання).
- **Нецензуровані моделі**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- Сумісні з OpenAI endpoints `/v1`.

## Режими приватності

Venice пропонує два рівні приватності — розуміння цього є ключовим для вибору моделі:

| Режим               | Опис                                                                                                                                | Моделі                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватний**       | Повністю приватний. Prompts/відповіді **ніколи не зберігаються й не журналюються**. Ефемерний.                                      | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, тощо |
| **Анонімізований**  | Проксіюється через Venice з видаленими metadata. Базовий provider (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити.     | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі **не** є повністю приватними. Venice видаляє metadata перед пересиланням, але базовий provider (OpenAI, Anthropic, Google, xAI) усе одно обробляє запит. Вибирайте **приватні** моделі, коли потрібна повна приватність.
</Warning>

## Функції

- **Орієнтація на приватність**: вибирайте між "приватним" (повністю приватним) і "анонімізованим" (через proxy) режимами
- **Нецензуровані моделі**: доступ до моделей без обмежень щодо вмісту
- **Доступ до основних моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований proxy Venice
- **API, сумісний з OpenAI**: стандартні endpoints `/v1` для простої інтеграції
- **Streaming**: підтримується на всіх моделях
- **Function calling**: підтримується на вибраних моделях (перевірте можливості моделі)
- **Vision**: підтримується на моделях із можливістю vision
- **Без жорстких rate limits**: для екстремального використання може застосовуватися обмеження за принципом fair use

## Початок роботи

<Steps>
  <Step title="Установіть plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Отримайте свій API key">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть до **Settings > API Keys > Create new key**
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
        1. Запитає ваш API key (або використає наявний `VENICE_API_KEY`)
        2. Покаже всі доступні моделі Venice
        3. Дасть змогу вибрати default model
        4. Автоматично налаштує provider
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

Після налаштування OpenClaw показує всі доступні моделі Venice. Вибирайте відповідно до своїх потреб:

- **Default model**: `venice/kimi-k2-5` для потужного приватного reasoning плюс vision.
- **Опція з високими можливостями**: `venice/claude-opus-4-6` для найпотужнішого анонімізованого шляху Venice.
- **Приватність**: вибирайте "приватні" моделі для повністю приватного inference.
- **Можливості**: вибирайте "анонімізовані" моделі для доступу до Claude, GPT, Gemini через proxy Venice.

Змініть default model будь-коли:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Показати всі доступні моделі:

```bash
openclaw models list --all --provider venice
```

Ви також можете запустити `openclaw configure`, вибрати **Model/auth** і вибрати **Venice AI**.

<Tip>
Використовуйте таблицю нижче, щоб вибрати правильну модель для свого випадку використання.

| Випадок використання       | Рекомендована модель              | Чому                                                |
| -------------------------- | --------------------------------- | --------------------------------------------------- |
| **Загальний чат (default)** | `kimi-k2-5`                       | Потужне приватне reasoning плюс vision              |
| **Найкраща загальна якість** | `claude-opus-4-6`                | Найпотужніша анонімізована опція Venice             |
| **Приватність + coding**    | `qwen3-coder-480b-a35b-instruct` | Приватна модель для coding із великим context       |
| **Приватний vision**        | `kimi-k2-5`                      | Підтримка vision без виходу з приватного режиму     |
| **Швидко + дешево**         | `qwen3-4b`                       | Легка модель reasoning                              |
| **Складні приватні задачі** | `deepseek-v3.2`                  | Потужне reasoning, але без підтримки tools Venice   |
| **Нецензуровано**           | `venice-uncensored`              | Без обмежень щодо вмісту                            |

</Tip>

## Поведінка replay DeepSeek V4

Якщо Venice надає моделі DeepSeek V4, як-от `venice/deepseek-v4-pro` або
`venice/deepseek-v4-flash`, OpenClaw заповнює обов’язковий placeholder
replay DeepSeek V4 `reasoning_content` у повідомленнях assistant, коли proxy
його пропускає. Venice відхиляє нативний верхньорівневий control `thinking`
DeepSeek, тому OpenClaw тримає це специфічне для provider виправлення replay
окремо від controls thinking нативного provider DeepSeek.

## Вбудований catalog (усього 41)

<AccordionGroup>
  <Accordion title="Приватні моделі (26) — повністю приватні, без журналювання">
    | Model ID                               | Назва                               | Context | Функції                         |
    | -------------------------------------- | ----------------------------------- | ------- | ------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Default, reasoning, vision      |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                       |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Загальне                        |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Загальне                        |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Загальне, tools disabled        |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                       |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Загальне                        |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                          |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                          |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning, vision               |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Загальне                        |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                          |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Швидка, reasoning               |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning, tools disabled       |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Нецензурована, tools disabled   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                          |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                          |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Загальне                        |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Загальне                        |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                       |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Загальне                        |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                       |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                       |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                       |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                       |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                       |
  </Accordion>

  <Accordion title="Анонімізовані моделі (12) — через proxy Venice">
    | Model ID                        | Назва                          | Context | Функції                         |
    | ------------------------------- | ------------------------------ | ------- | ------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M      | Reasoning, vision               |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M    | Reasoning, vision               |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M      | Reasoning, vision               |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k    | Reasoning, vision, coding       |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k    | Reasoning                       |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k    | Reasoning, vision, coding       |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k    | Vision                          |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k    | Vision                          |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M      | Reasoning, vision               |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k    | Reasoning, vision               |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k    | Reasoning, vision               |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M      | Reasoning, vision               |
  </Accordion>
</AccordionGroup>

## Виявлення моделей

OpenClaw постачається з backed by manifest seed catalog Venice для read-only переліку моделей. Runtime refresh усе ще може виявляти моделі з API Venice і повертається до manifest catalog, якщо API недоступний.

Endpoint `/models` є публічним (auth для переліку не потрібна), але inference потребує чинного API key.

## Streaming і підтримка tools

| Функція              | Підтримка                                            |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Усі моделі                                           |
| **Виклик функцій** | Більшість моделей (перевірте `supportsFunctionCalling` в API) |
| **Vision/Images**    | Моделі, позначені функцією "Vision"                  |
| **Режим JSON**        | Підтримується через `response_format`                      |

## Ціни

Venice використовує систему на основі кредитів. Перегляньте [venice.ai/pricing](https://venice.ai/pricing), щоб дізнатися актуальні тарифи:

- **Приватні моделі**: Зазвичай нижча вартість
- **Анонімізовані моделі**: Подібно до ціни прямого API + невелика комісія Venice

### Venice (анонімізовано) порівняно з прямим API

| Аспект       | Venice (анонімізовано)       | Прямий API          |
| ------------ | ----------------------------- | ------------------- |
| **Конфіденційність**  | Метадані видалено, анонімізовано | Ваш обліковий запис прив’язано |
| **Затримка**  | +10-50 мс (проксі)              | Напряму              |
| **Функції** | Підтримується більшість функцій       | Повний набір функцій       |
| **Оплата**  | Кредити Venice                | Оплата через провайдера    |

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

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Ключ API не розпізнано">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Переконайтеся, що ключ починається з `vapi_`.

  </Accordion>

  <Accordion title="Модель недоступна">
    Каталог моделей Venice оновлюється динамічно. Запустіть `openclaw models list`, щоб переглянути наразі доступні моделі. Деякі моделі можуть бути тимчасово недоступні.
  </Accordion>

  <Accordion title="Проблеми з підключенням">
    API Venice розміщено за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Приклад файлу конфігурації">
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
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Головна сторінка Venice AI і реєстрація облікового запису.
  </Card>
  <Card title="Документація API" href="https://docs.venice.ai" icon="book">
    Довідник API Venice і документація для розробників.
  </Card>
  <Card title="Ціни" href="https://venice.ai/pricing" icon="credit-card">
    Актуальні кредитні тарифи та плани Venice.
  </Card>
</CardGroup>
