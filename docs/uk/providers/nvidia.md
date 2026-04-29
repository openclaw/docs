---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Потрібно налаштувати NVIDIA_API_KEY
summary: Використовуйте API NVIDIA, сумісний з OpenAI, в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-29T16:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA надає API, сумісний з OpenAI, за адресою `https://integrate.api.nvidia.com/v1` для
безкоштовного використання відкритих моделей. Автентифікуйтеся за допомогою API-ключа з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Експортуйте ключ і запустіть онбординг">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Установіть модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Якщо передати `--nvidia-api-key` замість змінної середовища, значення потрапить в історію
оболонки та вивід `ps`. За можливості віддавайте перевагу змінній середовища
`NVIDIA_API_KEY`.
</Warning>

Для неінтерактивного налаштування також можна передати ключ напряму:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Приклад конфігурації

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Вбудований каталог

| Посилання на модель                        | Назва                        | Контекст | Максимальний вивід |
| ------------------------------------------ | ---------------------------- | -------- | ------------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192              |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192              |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192              |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка автоматичного ввімкнення">
    Провайдер автоматично вмикається, коли встановлено змінну середовища `NVIDIA_API_KEY`.
    Окрім ключа, явна конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    Вбудований каталог статичний. У вихідному коді вартість за замовчуванням дорівнює `0`, оскільки NVIDIA
    наразі пропонує безкоштовний доступ до API для перелічених моделей.
  </Accordion>

  <Accordion title="Сумісний з OpenAI кінцевий пункт">
    NVIDIA використовує стандартний кінцевий пункт completions `/v1`. Будь-які інструменти, сумісні з OpenAI,
    мають працювати з базовою URL-адресою NVIDIA без додаткових налаштувань.
  </Accordion>
</AccordionGroup>

<Tip>
Моделі NVIDIA наразі можна використовувати безкоштовно. Перевіряйте
[build.nvidia.com](https://build.nvidia.com/) для отримання найновіших відомостей про доступність і
ліміти швидкості.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
