---
read_when:
    - Ви хочете один ключ API для багатьох LLM
    - Вам потрібні інструкції з налаштування Baidu Qianfan
summary: Використовуйте уніфікований API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-23T21:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29c0731e17c39cf7f08a73a034cd6d916234f0f447b85def29766501a45a6c07
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan — це MaaS-платформа Baidu, яка надає **уніфікований API**, що маршрутизує запити до багатьох моделей через єдиний
endpoint і ключ API. Вона сумісна з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

| Властивість | Значення                          |
| ----------- | --------------------------------- |
| Provider    | `qianfan`                         |
| Auth        | `QIANFAN_API_KEY`                 |
| API         | Сумісний з OpenAI                 |
| Base URL    | `https://qianfan.baidubce.com/v2` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис Baidu Cloud">
    Зареєструйтеся або увійдіть у [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) і переконайтеся, що для вас увімкнено доступ до API Qianfan.
  </Step>
  <Step title="Згенеруйте ключ API">
    Створіть новий застосунок або виберіть наявний, а потім згенеруйте ключ API. Формат ключа: `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Доступні моделі

| Ref моделі                           | Вхід        | Контекст | Макс. вивід | Reasoning | Примітки       |
| ------------------------------------ | ----------- | -------- | ----------- | --------- | -------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304   | 32,768      | Так       | Типова модель  |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000  | 64,000      | Так       | Мультимодальна |

<Tip>
Типовий вбудований ref моделі — `qianfan/deepseek-v3.2`. Перевизначати `models.providers.qianfan` потрібно лише тоді, коли вам потрібен custom base URL або метадані моделі.
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
    Qianfan працює через транспортний шлях, сумісний з OpenAI, а не через нативне формування запитів OpenAI. Це означає, що стандартні можливості SDK OpenAI працюють, але параметри, специфічні для provider-а, можуть не пересилатися.
  </Accordion>

  <Accordion title="Каталог і перевизначення">
    Наразі вбудований каталог включає `deepseek-v3.2` і `ernie-5.0-thinking-preview`. Додавайте або перевизначайте `models.providers.qianfan` лише тоді, коли вам потрібен custom base URL або метадані моделі.

    <Note>
    Refs моделей використовують префікс `qianfan/` (наприклад `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Переконайтеся, що ваш ключ API починається з `bce-v3/ALTAK-` і що в консолі Baidu Cloud для нього увімкнено доступ до API Qianfan.
    - Якщо моделі не відображаються, підтвердьте, що для вашого облікового запису активовано сервіс Qianfan.
    - Типовий base URL — `https://qianfan.baidubce.com/v2`. Змінюйте його лише тоді, коли використовуєте custom endpoint або proxy.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, refs моделей і поведінки failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна довідка з конфігурації OpenClaw.
  </Card>
  <Card title="Налаштування агента" href="/uk/concepts/agent" icon="robot">
    Налаштування типових значень агента й призначення моделей.
  </Card>
  <Card title="Документація API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Офіційна документація API Qianfan.
  </Card>
</CardGroup>
