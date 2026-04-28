---
read_when:
    - Вам потрібен інференс із фокусом на приватність в OpenClaw
    - Вам потрібні інструкції з налаштування Venice AI
summary: Використовуйте моделі Venice AI, орієнтовані на конфіденційність, в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-28T11:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI надає **орієнтований на приватність AI inference** з підтримкою моделей без цензури та доступом до основних пропрієтарних моделей через їхній анонімізований проксі. Увесь inference є приватним за замовчуванням — без навчання на ваших даних, без журналювання.

## Чому Venice в OpenClaw

- **Приватний inference** для моделей з відкритим кодом (без журналювання).
- **Моделі без цензури**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- OpenAI-сумісні кінцеві точки `/v1`.

## Режими приватності

Venice пропонує два рівні приватності — розуміння цього є ключовим для вибору вашої моделі:

| Режим           | Опис                                                                                                                       | Моделі                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватний**    | Повністю приватний. Запити/відповіді **ніколи не зберігаються й не журналюються**. Ефемерний.                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored тощо. |
| **Анонімізований** | Проксіюється через Venice з видаленням метаданих. Базовий провайдер (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі **не** є повністю приватними. Venice видаляє метадані перед пересиланням, але базовий провайдер (OpenAI, Anthropic, Google, xAI) усе одно обробляє запит. Обирайте **приватні** моделі, коли потрібна повна приватність.
</Warning>

## Можливості

- **Орієнтація на приватність**: вибір між режимами "private" (повністю приватний) і "anonymized" (проксійований)
- **Моделі без цензури**: доступ до моделей без обмежень вмісту
- **Доступ до основних моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований проксі Venice
- **OpenAI-сумісний API**: стандартні кінцеві точки `/v1` для легкої інтеграції
- **Потокова передача**: підтримується на всіх моделях
- **Виклики функцій**: підтримуються на вибраних моделях (перевірте можливості моделі)
- **Vision**: підтримується на моделях із можливістю vision
- **Без жорстких лімітів швидкості**: для надмірного використання може застосовуватися обмеження за принципом fair use

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть до **Settings > API Keys > Create new key**
    3. Скопіюйте свій API-ключ (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Налаштуйте OpenClaw">
    Оберіть бажаний спосіб налаштування:

    <Tabs>
      <Tab title="Інтерактивно (рекомендовано)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Це:
        1. Запитає ваш API-ключ (або використає наявний `VENICE_API_KEY`)
        2. Покаже всі доступні моделі Venice
        3. Дасть змогу вибрати модель за замовчуванням
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

Після налаштування OpenClaw показує всі доступні моделі Venice. Обирайте відповідно до ваших потреб:

- **Модель за замовчуванням**: `venice/kimi-k2-5` для потужного приватного міркування плюс vision.
- **Варіант із високими можливостями**: `venice/claude-opus-4-6` для найпотужнішого анонімізованого шляху Venice.
- **Приватність**: обирайте моделі "private" для повністю приватного inference.
- **Можливості**: обирайте моделі "anonymized", щоб отримати доступ до Claude, GPT, Gemini через проксі Venice.

Змінити модель за замовчуванням можна будь-коли:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Список усіх доступних моделей:

```bash
openclaw models list | grep venice
```

Також можна запустити `openclaw configure`, вибрати **Модель/автентифікація** і вибрати **Venice AI**.

<Tip>
Використовуйте таблицю нижче, щоб вибрати правильну модель для вашого випадку використання.

| Випадок використання                   | Рекомендована модель                | Чому                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Загальний чат (за замовчуванням)** | `kimi-k2-5`                      | Потужне приватне міркування плюс vision         |
| **Найкраща загальна якість**   | `claude-opus-4-6`                | Найпотужніший анонімізований варіант Venice           |
| **Приватність + кодування**       | `qwen3-coder-480b-a35b-instruct` | Приватна модель для кодування з великим контекстом      |
| **Приватний vision**         | `kimi-k2-5`                      | Підтримка vision без виходу з приватного режиму  |
| **Швидко + дешево**           | `qwen3-4b`                       | Легка модель міркування                  |
| **Складні приватні завдання**  | `deepseek-v3.2`                  | Потужне міркування, але без підтримки інструментів Venice |
| **Без цензури**             | `venice-uncensored`              | Без обмежень вмісту                      |

</Tip>

## Поведінка replay DeepSeek V4

Якщо Venice надає моделі DeepSeek V4, такі як `venice/deepseek-v4-pro` або
`venice/deepseek-v4-flash`, OpenClaw заповнює обов’язковий placeholder replay
`reasoning_content` DeepSeek V4 у повідомленнях асистента, коли проксі
його пропускає. Venice відхиляє нативний елемент керування `thinking` верхнього рівня DeepSeek, тому
OpenClaw тримає це специфічне для провайдера виправлення replay окремо від нативних
елементів керування thinking провайдера DeepSeek.

## Вбудований каталог (усього 41)

<AccordionGroup>
  <Accordion title="Приватні моделі (26) — повністю приватні, без журналювання">
    | ID моделі                               | Назва                                | Контекст | Можливості                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | За замовчуванням, міркування, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Міркування                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Загальне                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Загальне                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Загальне, інструменти вимкнено    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Міркування                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | Загальне                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Кодування                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Кодування                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Міркування, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | Загальне                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Швидка, міркування            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Міркування, інструменти вимкнено  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Без цензури, інструменти вимкнено |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | Загальне                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | Загальне                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Міркування                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | Загальне                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Міркування                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Міркування                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Міркування                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Міркування                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Міркування                  |
  </Accordion>

  <Accordion title="Анонімізовані моделі (15) — через проксі Venice">
    | ID моделі                        | Назва                           | Контекст | Можливості                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice)   | 1M      | Міркування, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (через Venice)   | 198k    | Міркування, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M      | Міркування, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (через Venice) | 198k    | Міркування, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)           | 1M      | Міркування, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)     | 400k    | Міркування, vision, кодування |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)           | 256k    | Міркування                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)     | 256k    | Міркування, vision, кодування |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)    | 1M      | Міркування, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)      | 198k    | Міркування, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)    | 256k    | Міркування, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)     | 1M      | Міркування, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (через Venice)  | 256k    | Міркування, кодування         |
  </Accordion>
</AccordionGroup>

## Виявлення моделей

OpenClaw автоматично виявляє моделі з API Venice, коли встановлено `VENICE_API_KEY`. Якщо API недоступний, він повертається до статичного каталогу.

Кінцева точка `/models` є публічною (для списку автентифікація не потрібна), але inference потребує дійсного API-ключа.

## Потокова передача та підтримка інструментів

| Функція             | Підтримка                                                     |
| ------------------- | ------------------------------------------------------------- |
| **Потокова передача** | Усі моделі                                                   |
| **Виклик функцій**  | Більшість моделей (перевірте `supportsFunctionCalling` в API) |
| **Vision/Images**   | Моделі, позначені функцією "Vision"                           |
| **JSON-режим**      | Підтримується через `response_format`                          |

## Ціни

Venice використовує систему на основі кредитів. Перевірте актуальні тарифи на [venice.ai/pricing](https://venice.ai/pricing):

- **Приватні моделі**: Зазвичай нижча вартість
- **Анонімізовані моделі**: Подібно до прямої ціни API + невелика комісія Venice

### Venice (анонімізовано) проти прямого API

| Аспект       | Venice (анонімізовано)        | Прямий API              |
| ------------ | ----------------------------- | ----------------------- |
| **Приватність** | Метадані вилучено, анонімізовано | Ваш обліковий запис прив’язано |
| **Затримка** | +10-50 мс (проксі)            | Пряме підключення       |
| **Функції**  | Підтримується більшість функцій | Повний набір функцій    |
| **Оплата**   | Кредити Venice                | Оплата провайдеру       |

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
  <Accordion title="API-ключ не розпізнано">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Переконайтеся, що ключ починається з `vapi_`.

  </Accordion>

  <Accordion title="Модель недоступна">
    Каталог моделей Venice оновлюється динамічно. Запустіть `openclaw models list`, щоб побачити наразі доступні моделі. Деякі моделі можуть бути тимчасово офлайн.
  </Accordion>

  <Accordion title="Проблеми з підключенням">
    API Venice розташований за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Розширена конфігурація

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
    Вибір провайдерів, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Домашня сторінка Venice AI і реєстрація облікового запису.
  </Card>
  <Card title="Документація API" href="https://docs.venice.ai" icon="book">
    Довідник API Venice і документація для розробників.
  </Card>
  <Card title="Ціни" href="https://venice.ai/pricing" icon="credit-card">
    Актуальні кредитні тарифи й плани Venice.
  </Card>
</CardGroup>
