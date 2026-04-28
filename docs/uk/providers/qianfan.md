---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Вам потрібні вказівки з налаштування Baidu Qianfan
summary: Використовуйте уніфікований API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-28T11:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan — це MaaS-платформа Baidu, що надає **уніфікований API**, який маршрутизує запити до багатьох моделей за одним
endpoint і API key. Вона сумісна з OpenAI, тож більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                          |
| ----------- | --------------------------------- |
| Провайдер   | `qianfan`                         |
| Автентифікація | `QIANFAN_API_KEY`              |
| API         | сумісний з OpenAI                 |
| Базова URL-адреса | `https://qianfan.baidubce.com/v2` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис Baidu Cloud">
    Зареєструйтеся або увійдіть у [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) і переконайтеся, що у вас увімкнено доступ до Qianfan API.
  </Step>
  <Step title="Згенеруйте API key">
    Створіть новий застосунок або виберіть наявний, а потім згенеруйте API key. Формат ключа: `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Запустіть onboarding">
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

## Вбудований каталог

| Посилання на модель                  | Вхідні дані | Контекст | Макс. вихід | Міркування | Примітки          |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ----------------- |
| `qianfan/deepseek-v3.2`              | текст       | 98,304  | 32,768     | Так       | Стандартна модель |
| `qianfan/ernie-5.0-thinking-preview` | текст, зображення | 119,000 | 64,000     | Так       | Мультимодальна    |

<Tip>
Стандартне вбудоване посилання на модель — `qianfan/deepseek-v3.2`. Перевизначати `models.providers.qianfan` потрібно лише тоді, коли потрібна власна базова URL-адреса або metadata моделі.
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
    Qianfan працює через транспортний шлях, сумісний з OpenAI, а не через нативне формування запитів OpenAI. Це означає, що стандартні можливості OpenAI SDK працюють, але параметри, специфічні для провайдера, можуть не передаватися.
  </Accordion>

  <Accordion title="Каталог і перевизначення">
    Вбудований каталог наразі містить `deepseek-v3.2` і `ernie-5.0-thinking-preview`. Додавайте або перевизначайте `models.providers.qianfan` лише тоді, коли потрібна власна базова URL-адреса або metadata моделі.

    <Note>
    Посилання на моделі використовують префікс `qianfan/` (наприклад, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Переконайтеся, що ваш API key починається з `bce-v3/ALTAK-` і має ввімкнений доступ до Qianfan API у консолі Baidu Cloud.
    - Якщо моделі не відображаються в списку, підтвердьте, що для вашого облікового запису активовано сервіс Qianfan.
    - Стандартна базова URL-адреса — `https://qianfan.baidubce.com/v2`. Змінюйте її лише тоді, коли використовуєте власний endpoint або proxy.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Налаштування agent" href="/uk/concepts/agent" icon="robot">
    Налаштування стандартних параметрів agent і призначень моделей.
  </Card>
  <Card title="Документація Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Офіційна документація Qianfan API.
  </Card>
</CardGroup>
