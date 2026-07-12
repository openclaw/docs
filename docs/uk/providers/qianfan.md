---
read_when:
    - Вам потрібен єдиний ключ API для багатьох великих мовних моделей
    - Вам потрібні вказівки з налаштування Baidu Qianfan
summary: Використовуйте уніфікований API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T13:42:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan — це платформа MaaS від Baidu: уніфікований API, сумісний з OpenAI, який спрямовує запити до багатьох моделей через єдину кінцеву точку й ключ API. OpenClaw постачає її як офіційний зовнішній Plugin `@openclaw/qianfan-provider`.

| Властивість         | Значення                                 |
| ------------------- | ---------------------------------------- |
| Постачальник        | `qianfan`                                |
| Автентифікація      | `QIANFAN_API_KEY`                        |
| API                 | Сумісний з OpenAI (`openai-completions`) |
| Базова URL-адреса   | `https://qianfan.baidubce.com/v2`        |
| Модель за замовчуванням | `qianfan/deepseek-v3.2`              |

## Встановлення Plugin

Встановіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис Baidu Cloud">
    Зареєструйтеся або увійдіть у [консолі Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) і переконайтеся, що для вас увімкнено доступ до API Qianfan.
  </Step>
  <Step title="Згенеруйте ключ API">
    Створіть новий застосунок або виберіть наявний, а потім згенеруйте ключ API. Ключі Baidu Cloud мають формат `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Під час неінтерактивного запуску ключ зчитується з `--qianfan-api-key <key>` або
    `QIANFAN_API_KEY`. Початкове налаштування записує конфігурацію постачальника, додає
    псевдонім `QIANFAN` для моделі за замовчуванням і встановлює `qianfan/deepseek-v3.2`
    як модель за замовчуванням, якщо жодної моделі не налаштовано.

  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Вбудований каталог

| Посилання на модель                  | Вхідні дані   | Контекст | Макс. виведення | Міркування | Примітки                  |
| ------------------------------------ | ------------- | -------- | ---------------- | ---------- | ------------------------- |
| `qianfan/deepseek-v3.2`              | текст         | 98,304   | 32,768           | Так        | Модель за замовчуванням   |
| `qianfan/ernie-5.0-thinking-preview` | текст, зображення | 119,000 | 64,000        | Так        | Мультимодальна             |

Каталог статичний; динамічне виявлення моделей не підтримується.

<Tip>
Перевизначати `models.providers.qianfan` потрібно лише тоді, коли вам потрібна власна базова URL-адреса або метадані моделі.
</Tip>

## Приклад конфігурації

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
Посилання на моделі використовують префікс `qianfan/` (наприклад, `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Передавання даних і сумісність">
    Qianfan працює через транспортний шлях, сумісний з OpenAI, а не через нативне формування запитів OpenAI. Стандартні функції SDK OpenAI працюють, але специфічні для постачальника параметри можуть не передаватися.
  </Accordion>

  <Accordion title="Усунення несправностей">
    - Переконайтеся, що ваш ключ API починається з `bce-v3/ALTAK-` і для нього ввімкнено доступ до API Qianfan у консолі Baidu Cloud.
    - Якщо моделі не відображаються в списку, переконайтеся, що для вашого облікового запису активовано службу Qianfan.
    - Змінюйте базову URL-адресу лише за умови використання власної кінцевої точки або проксі-сервера.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації OpenClaw.
  </Card>
  <Card title="Налаштування агента" href="/uk/concepts/agent" icon="robot">
    Налаштування параметрів агента за замовчуванням і призначення моделей.
  </Card>
  <Card title="Документація API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Офіційна документація API Qianfan.
  </Card>
</CardGroup>
