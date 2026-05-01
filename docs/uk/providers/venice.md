---
read_when:
    - Вам потрібен інференс, орієнтований на приватність, в OpenClaw
    - Вам потрібні інструкції з налаштування Venice AI
summary: Використовуйте орієнтовані на конфіденційність моделі Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-05-01T12:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI надає **орієнтований на приватність AI inference** з підтримкою нецензурованих моделей і доступом до основних пропрієтарних моделей через їхній анонімізований проксі. Усі inference є приватними за замовчуванням — без навчання на ваших даних і без логування.

## Навіщо Venice в OpenClaw

- **Приватний inference** для моделей із відкритим кодом (без логування).
- **Нецензуровані моделі**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- OpenAI-сумісні endpoints `/v1`.

## Режими приватності

Venice пропонує два рівні приватності — розуміння цього є ключовим для вибору моделі:

| Режим            | Опис                                                                                                                                | Моделі                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватний**    | Повністю приватний. Запити/відповіді **ніколи не зберігаються й не логуються**. Ефемерний.                                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Анонімізований** | Проксіюється через Venice із видаленими метаданими. Базовий провайдер (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі **не** є повністю приватними. Venice видаляє метадані перед пересиланням, але базовий провайдер (OpenAI, Anthropic, Google, xAI) все одно обробляє запит. Обирайте **приватні** моделі, коли потрібна повна приватність.
</Warning>

## Функції

- **Орієнтованість на приватність**: обирайте між режимами "приватний" (повністю приватний) і "анонімізований" (проксійований)
- **Нецензуровані моделі**: доступ до моделей без обмежень вмісту
- **Доступ до основних моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований проксі Venice
- **OpenAI-сумісний API**: стандартні endpoints `/v1` для легкої інтеграції
- **Streaming**: підтримується на всіх моделях
- **Виклики функцій**: підтримуються на вибраних моделях (перевіряйте можливості моделі)
- **Vision**: підтримується на моделях із можливістю vision
- **Без жорстких лімітів частоти**: для надмірного використання може застосовуватися обмеження за принципом добросовісного використання

## Початок роботи

<Steps>
  <Step title="Отримайте свій API key">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть до **Settings > API Keys > Create new key**
    3. Скопіюйте свій API key (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Налаштуйте OpenClaw">
    Оберіть бажаний спосіб налаштування:

    <Tabs>
      <Tab title="Інтерактивно (рекомендовано)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Це:
        1. Запитає ваш API key (або використає наявний `VENICE_API_KEY`)
        2. Покаже всі доступні моделі Venice
        3. Дозволить вибрати модель за замовчуванням
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

Після налаштування OpenClaw показує всі доступні моделі Venice. Обирайте відповідно до своїх потреб:

- **Модель за замовчуванням**: `venice/kimi-k2-5` для сильного приватного reasoning плюс vision.
- **Варіант із високими можливостями**: `venice/claude-opus-4-6` для найсильнішого анонімізованого шляху Venice.
- **Приватність**: обирайте "приватні" моделі для повністю приватного inference.
- **Можливості**: обирайте "анонімізовані" моделі для доступу до Claude, GPT, Gemini через проксі Venice.

Змініть модель за замовчуванням будь-коли:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Перелічіть усі доступні моделі:

```bash
openclaw models list --all --provider venice
```

Ви також можете запустити `openclaw configure`, вибрати **Model/auth** і обрати **Venice AI**.

<Tip>
Скористайтеся таблицею нижче, щоб вибрати правильну модель для свого сценарію використання.

| Сценарій використання             | Рекомендована модель              | Чому                                           |
| --------------------------------- | --------------------------------- | --------------------------------------------- |
| **Загальний чат (за замовчуванням)** | `kimi-k2-5`                      | Сильне приватне reasoning плюс vision         |
| **Найкраща загальна якість**      | `claude-opus-4-6`                 | Найсильніший анонімізований варіант Venice    |
| **Приватність + кодування**       | `qwen3-coder-480b-a35b-instruct`  | Приватна модель для кодування з великим context |
| **Приватний vision**              | `kimi-k2-5`                       | Підтримка vision без виходу з приватного режиму |
| **Швидко + дешево**               | `qwen3-4b`                        | Легка модель reasoning                         |
| **Складні приватні завдання**     | `deepseek-v3.2`                   | Сильне reasoning, але без підтримки Venice tools |
| **Нецензурована**                 | `venice-uncensored`               | Без обмежень вмісту                            |

</Tip>

## Поведінка повторного відтворення DeepSeek V4

Якщо Venice надає моделі DeepSeek V4, як-от `venice/deepseek-v4-pro` або
`venice/deepseek-v4-flash`, OpenClaw заповнює потрібний для DeepSeek V4
placeholder повторного відтворення `reasoning_content` у повідомленнях assistant, коли проксі
його пропускає. Venice відхиляє нативний top-level контроль `thinking` DeepSeek, тому
OpenClaw тримає це специфічне для провайдера виправлення повторного відтворення окремо від нативних
контролів thinking провайдера DeepSeek.

## Вбудований каталог (усього 41)

<AccordionGroup>
  <Accordion title="Приватні моделі (26) — повністю приватні, без логування">
    | ID моделі                              | Назва                               | Context | Функції                    |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | За замовчуванням, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Загальна                   |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Загальна                   |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Загальна, tools вимкнено   |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Загальна                   |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Кодування                  |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Кодування                  |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Загальна                   |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Швидка, reasoning          |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning, tools вимкнено  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Нецензурована, tools вимкнено |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Загальна                   |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Загальна                   |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Загальна                   |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                  |
  </Accordion>

  <Accordion title="Анонімізовані моделі (15) — через проксі Venice">
    | ID моделі                       | Назва                          | Context | Функції                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------ |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M      | Reasoning, vision        |
    | `claude-opus-4-5`               | Claude Opus 4.5 (через Venice) | 198k    | Reasoning, vision        |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M    | Reasoning, vision        |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (через Venice) | 198k  | Reasoning, vision        |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M      | Reasoning, vision        |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k    | Reasoning, vision, кодування |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k    | Reasoning                |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k    | Reasoning, vision, кодування |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k    | Vision                   |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k    | Vision                   |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M      | Reasoning, vision        |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k    | Reasoning, vision        |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k    | Reasoning, vision        |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M      | Reasoning, vision        |
    | `grok-code-fast-1`              | Grok Code Fast 1 (через Venice) | 256k   | Reasoning, кодування     |
  </Accordion>
</AccordionGroup>

## Виявлення моделей

OpenClaw постачається з підкріпленим маніфестом початковим каталогом Venice для read-only списку моделей. Runtime refresh усе ще може виявляти моделі з Venice API і повертається до каталогу маніфесту, якщо API недоступний.

Endpoint `/models` є публічним (автентифікація не потрібна для списку), але inference потребує дійсний API key.

## Streaming і підтримка tools

| Функція             | Підтримка                                               |
| ------------------- | ------------------------------------------------------- |
| **Стримінг**        | Усі моделі                                              |
| **Виклик функцій**  | Більшість моделей (перевірте `supportsFunctionCalling` в API) |
| **Зір/зображення**  | Моделі, позначені функцією "Vision"                    |
| **Режим JSON**      | Підтримується через `response_format`                   |

## Ціни

Venice використовує систему на основі кредитів. Перевірте [venice.ai/pricing](https://venice.ai/pricing), щоб дізнатися актуальні тарифи:

- **Приватні моделі**: Зазвичай нижча вартість
- **Анонімізовані моделі**: Подібно до прямого ціноутворення API + невелика комісія Venice

### Venice (анонімізовано) проти прямого API

| Аспект        | Venice (анонімізовано)           | Прямий API              |
| ------------- | -------------------------------- | ----------------------- |
| **Приватність** | Метадані видалено, анонімізовано | Ваш обліковий запис прив’язано |
| **Затримка**  | +10-50 мс (проксі)               | Напряму                 |
| **Функції**   | Підтримується більшість функцій  | Повний набір функцій    |
| **Оплата**    | Кредити Venice                   | Оплата провайдеру       |

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
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Переконайтеся, що ключ починається з `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    Каталог моделей Venice оновлюється динамічно. Запустіть `openclaw models list`, щоб переглянути наразі доступні моделі. Деякі моделі можуть бути тимчасово офлайн.
  </Accordion>

  <Accordion title="Connection issues">
    API Venice розміщено за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Головна сторінка Venice AI і реєстрація облікового запису.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Довідник API Venice і документація для розробників.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Поточні кредитні тарифи й плани Venice.
  </Card>
</CardGroup>
