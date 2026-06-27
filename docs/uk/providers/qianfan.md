---
read_when:
    - Вам потрібен один API-ключ для багатьох LLMs
    - Вам потрібні інструкції з налаштування Baidu Qianfan
summary: Використовуйте уніфікований API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan — це MaaS-платформа Baidu, яка надає **уніфікований API**, що маршрутизує запити до багатьох моделей через єдину
кінцеву точку й API-ключ. Вона сумісна з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                          |
| -------- | --------------------------------- |
| Провайдер | `qianfan`                         |
| Автентифікація | `QIANFAN_API_KEY`                 |
| API      | Сумісний з OpenAI                 |
| Базова URL-адреса | `https://qianfan.baidubce.com/v2` |

## Встановлення Plugin

Встановіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис Baidu Cloud">
    Зареєструйтеся або увійдіть у [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) і переконайтеся, що у вас увімкнено доступ до Qianfan API.
  </Step>
  <Step title="Згенеруйте API-ключ">
    Створіть новий застосунок або виберіть наявний, а потім згенеруйте API-ключ. Формат ключа: `bce-v3/ALTAK-...`.
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

## Вбудований каталог

| Посилання на модель                  | Вхід        | Контекст | Максимальний вивід | Міркування | Примітки      |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | текст       | 98,304  | 32,768     | Так       | Модель за замовчуванням |
| `qianfan/ernie-5.0-thinking-preview` | текст, зображення | 119,000 | 64,000     | Так       | Мультимодальна |

<Tip>
Посилання на модель за замовчуванням: `qianfan/deepseek-v3.2`. Перевизначати `models.providers.qianfan` потрібно лише тоді, коли вам потрібна власна базова URL-адреса або метадані моделі.
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
    Статичний каталог наразі містить `deepseek-v3.2` і `ernie-5.0-thinking-preview`. Додавайте або перевизначайте `models.providers.qianfan` лише тоді, коли вам потрібна власна базова URL-адреса або метадані моделі.

    <Note>
    Посилання на моделі використовують префікс `qianfan/` (наприклад, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Переконайтеся, що ваш API-ключ починається з `bce-v3/ALTAK-` і що в консолі Baidu Cloud для нього увімкнено доступ до Qianfan API.
    - Якщо моделі не відображаються у списку, підтвердьте, що у вашому обліковому записі активовано сервіс Qianfan.
    - Базова URL-адреса за замовчуванням: `https://qianfan.baidubce.com/v2`. Змінюйте її лише якщо використовуєте власну кінцеву точку або проксі.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації OpenClaw.
  </Card>
  <Card title="Налаштування агента" href="/uk/concepts/agent" icon="robot">
    Налаштування значень агента за замовчуванням і призначень моделей.
  </Card>
  <Card title="Документація Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Офіційна документація Qianfan API.
  </Card>
</CardGroup>
