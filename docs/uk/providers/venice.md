---
read_when:
    - Вам потрібен орієнтований на конфіденційність інференс в OpenClaw
    - Вам потрібні вказівки з налаштування Venice AI
summary: Використовуйте орієнтовані на конфіденційність моделі Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T13:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) надає орієнтований на конфіденційність інференс: відкриті моделі працюють
без журналювання, а також доступне анонімізоване проксі-підключення до Claude, GPT, Gemini і Grok.
Усі кінцеві точки сумісні з OpenAI (`/v1`).

## Режими конфіденційності

| Режим           | Поведінка                                                         | Моделі                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватний**    | Запити й відповіді ніколи не зберігаються та не журналюються. Ефемерний режим.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored тощо. |
| **Анонімізований** | Перед пересиланням запити проходять через проксі Venice з видаленням метаданих. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонімізовані моделі не є повністю приватними. Venice видаляє метадані перед пересиланням, але базовий постачальник (OpenAI, Anthropic, Google, xAI) усе одно обробляє запит. Використовуйте приватні моделі, коли потрібна повна конфіденційність.
</Warning>

## Початок роботи

<Steps>
  <Step title="Установіть плагін">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Отримайте ключ API">
    1. Зареєструйтеся на [venice.ai](https://venice.ai)
    2. Перейдіть до **Settings > API Keys > Create new key**
    3. Скопіюйте ключ API (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Налаштуйте OpenClaw">
    <Tabs>
      <Tab title="Інтерактивно (рекомендовано)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Запитує ключ API (або повторно використовує наявний `VENICE_API_KEY`), показує список доступних моделей Venice і встановлює модель за замовчуванням.
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

- **За замовчуванням**: `venice/kimi-k2-5` (приватна, логічне міркування, зір).
- **Найпотужніший анонімізований варіант**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Також можна запустити `openclaw configure` і вибрати **Постачальник моделі/автентифікації > Venice AI**.

<Tip>
| Сценарій використання                 | Модель                             | Чому                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| Загальний чат (за замовчуванням)    | `kimi-k2-5`                        | Потужне приватне логічне міркування та зір       |
| Найкраща загальна якість      | `claude-opus-4-6`                  | Найпотужніший анонімізований варіант Venice         |
| Конфіденційність і програмування          | `qwen3-coder-480b-a35b-instruct`   | Приватна модель для програмування з великим контекстом    |
| Швидко й дешево              | `qwen3-4b`                         | Полегшена модель логічного міркування                |
| Складні приватні завдання     | `deepseek-v3.2`                    | Потужне логічне міркування; виклики інструментів вимкнено    |
| Без цензури                | `venice-uncensored`                | Без обмежень вмісту                    |
</Tip>

## Вбудований каталог (38 моделей)

<AccordionGroup>
  <Accordion title="Приватні моделі (26) — повністю приватні, без журналювання">
    | Ідентифікатор моделі                               | Назва                                 | Контекст | Примітки                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | За замовчуванням, логічне міркування, зір  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | Логічне міркування                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | Загального призначення                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | Загального призначення                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | Загального призначення, інструменти вимкнено     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Логічне міркування                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | Загального призначення                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | Програмування                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Програмування                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Логічне міркування, зір           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | Загального призначення                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (зір)                | 256k    | Зір                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | Швидка, логічне міркування              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Логічне міркування, інструменти вимкнено    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | Без цензури, інструменти вимкнено   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | Зір                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Зір                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | Загального призначення                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | Загального призначення                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Логічне міркування                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | Загального призначення                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Логічне міркування                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Логічне міркування                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Логічне міркування                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | Логічне міркування                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Логічне міркування                    |
  </Accordion>

  <Accordion title="Анонімізовані моделі (12) — через проксі Venice">
    | Ідентифікатор моделі                        | Назва                           | Контекст | Примітки                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice)    | 1M      | Логічне міркування, зір            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice)  | 1M      | Логічне міркування, зір            |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)            | 1M      | Логічне міркування, зір            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)      | 400k    | Логічне міркування, зір, програмування     |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)            | 256k    | Логічне міркування                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)      | 256k    | Логічне міркування, зір, програмування     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)             | 128k    | Зір                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)        | 128k    | Зір                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)     | 1M      | Логічне міркування, зір             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)       | 198k    | Логічне міркування, зір             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)     | 256k    | Логічне міркування, зір             |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)      | 1M      | Логічне міркування, зір             |
  </Accordion>
</AccordionGroup>

Моделі Venice на основі Grok (`grok-41-fast` і подібні) отримують те саме виправлення сумісності
схеми інструментів, що й нативний постачальник xAI, оскільки вони використовують однаковий висхідний
формат викликів інструментів.

## Виявлення моделей

Наведений вище вбудований каталог — це початковий список на основі маніфесту. Під час виконання OpenClaw
оновлює його через API Venice `/models` і повертається до початкового списку, якщо
API недоступний. Кінцева точка `/models` загальнодоступна (автентифікація для
перегляду списку не потрібна), але для інференсу потрібен дійсний ключ API.

## Поведінка відтворення DeepSeek V4

Якщо Venice надає моделі DeepSeek V4, як-от `deepseek-v4-pro` або
`deepseek-v4-flash`, OpenClaw заповнює обов’язкове поле відтворення `reasoning_content`
у повідомленнях асистента, коли Venice його пропускає, і вилучає `thinking`/
`reasoning`/`reasoning_effort` із корисного навантаження запиту (Venice відхиляє
нативне керування `thinking` DeepSeek для цих моделей). Це виправлення відтворення
відокремлене від власних засобів керування мисленням нативного постачальника DeepSeek.

## Підтримка потокового передавання та інструментів

| Функція          | Підтримка                                           |
| ---------------- | ------------------------------------------------- |
| Потокове передавання        | Усі моделі                                        |
| Виклики функцій | Більшість моделей; для окремих моделей вимкнено, як зазначено вище |
| Зір/зображення    | Моделі, позначені вище як «Зір»                      |
| Режим JSON        | Через `response_format`                             |

## Ціни

Venice використовує систему на основі кредитів. Анонімізовані моделі коштують приблизно стільки ж, скільки
пряме використання API, плюс невелика комісія Venice. Поточні тарифи див.
на сторінці [venice.ai/pricing](https://venice.ai/pricing).

## Приклади використання

```bash
# Приватна модель за замовчуванням
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus через Venice (анонімізовано)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Модель без цензури
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Модель із зором та зображенням
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Модель для програмування
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
    Запустіть `openclaw models list --all --provider venice`, щоб переглянути доступні
    зараз моделі; каталог змінюється, коли Venice додає або вилучає моделі.
  </Accordion>

  <Accordion title="Проблеми з підключенням">
    API Venice доступний за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання із цим хостом.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
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
    Вибір постачальників, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Головна сторінка Venice AI та реєстрація облікового запису.
  </Card>
  <Card title="Документація API" href="https://docs.venice.ai" icon="book">
    Довідник API Venice і документація для розробників.
  </Card>
  <Card title="Тарифи" href="https://venice.ai/pricing" icon="credit-card">
    Поточні ставки кредитів і тарифні плани Venice.
  </Card>
</CardGroup>
