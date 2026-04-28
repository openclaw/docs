---
read_when:
    - Вам потрібен один API key для багатьох LLM
    - Вам потрібні вказівки з налаштування Baidu Qianfan
summary: Використовуйте уніфікований API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-23T23:05:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan — це платформа MaaS від Baidu, яка надає **уніфікований API**, що маршрутизує запити до багатьох моделей через єдиний
endpoint і API key. Вона сумісна з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

| Властивість | Значення                         |
| ----------- | -------------------------------- |
| Провайдер   | `qianfan`                        |
| Auth        | `QIANFAN_API_KEY`                |
| API         | OpenAI-compatible                |
| Base URL    | `https://qianfan.baidubce.com/v2` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис Baidu Cloud">
    Зареєструйтеся або увійдіть у [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) і переконайтеся, що для вас увімкнено доступ до API Qianfan.
  </Step>
  <Step title="Згенеруйте API key">
    Створіть новий застосунок або виберіть наявний, а потім згенеруйте API key. Формат ключа: `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Вбудований каталог

| Посилання на модель                  | Вхідні дані | Контекст | Макс. вивід | Reasoning | Примітки          |
| ------------------------------------ | ----------- | -------- | ----------- | --------- | ----------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304   | 32,768      | Так       | Стандартна модель |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000  | 64,000      | Так       | Мультимодальна    |

<Tip>
Стандартне вбудоване посилання на модель — `qianfan/deepseek-v3.2`. Перевизначати `models.providers.qianfan` потрібно лише тоді, коли вам потрібен власний base URL або метадані моделі.
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

<AccordionGroup>
  <Accordion title="Транспорт і сумісність">
    Qianfan працює через транспортний шлях, сумісний з OpenAI, а не через нативне формування запитів OpenAI. Це означає, що стандартні можливості SDK OpenAI працюють, але параметри, специфічні для провайдера, можуть не передаватися.
  </Accordion>

  <Accordion title="Каталог і перевизначення">
    Вбудований каталог зараз містить `deepseek-v3.2` і `ernie-5.0-thinking-preview`. Додавайте або перевизначайте `models.providers.qianfan` лише тоді, коли вам потрібен власний base URL або метадані моделі.

    <Note>
    Посилання на моделі використовують префікс `qianfan/` (наприклад, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Переконайтеся, що ваш API key починається з `bce-v3/ALTAK-` і що в консолі Baidu Cloud для нього ввімкнено доступ до API Qianfan.
    - Якщо моделі не відображаються у списку, переконайтеся, що для вашого облікового запису активовано сервіс Qianfan.
    - Стандартний base URL — `https://qianfan.baidubce.com/v2`. Змінюйте його лише якщо використовуєте власний endpoint або proxy.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації OpenClaw.
  </Card>
  <Card title="Налаштування агента" href="/uk/concepts/agent" icon="robot">
    Налаштування стандартних параметрів агента та призначення моделей.
  </Card>
  <Card title="Документація API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Офіційна документація API Qianfan.
  </Card>
</CardGroup>
