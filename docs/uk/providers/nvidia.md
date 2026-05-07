---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Потрібно налаштувати NVIDIA_API_KEY
summary: Використовуйте API NVIDIA, сумісний з OpenAI, в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T15:12:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA надає OpenAI-сумісний API за адресою `https://integrate.api.nvidia.com/v1` для
відкритих моделей безкоштовно. Автентифікуйтеся за допомогою API-ключа з
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
  <Step title="Задайте модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Якщо передати `--nvidia-api-key` замість змінної середовища, значення потрапить в історію
shell і вивід `ps`. Коли можливо, надавайте перевагу змінній середовища `NVIDIA_API_KEY`.
</Warning>

Для неінтерактивного налаштування ключ також можна передати безпосередньо:

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

| Посилання на модель                         | Назва                        | Контекст | Макс. вивід |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка автоматичного ввімкнення">
    Провайдер автоматично вмикається, коли задано змінну середовища `NVIDIA_API_KEY`.
    Окрім ключа, явна конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    Вбудований каталог є статичним. Витрати в джерелі за замовчуванням дорівнюють `0`, оскільки NVIDIA
    наразі пропонує безкоштовний доступ до API для перелічених моделей.
  </Accordion>

  <Accordion title="OpenAI-сумісний endpoint">
    NVIDIA використовує стандартний endpoint completions `/v1`. Будь-які OpenAI-сумісні
    інструменти мають працювати одразу з базовим URL NVIDIA.
  </Accordion>

  <Accordion title="Повільні відповіді власного провайдера">
    Деякі власні моделі, розміщені NVIDIA, можуть потребувати більше часу, ніж стандартний idle
    watchdog моделі, перш ніж вони видадуть перший фрагмент відповіді. Для власних записів провайдера NVIDIA
    збільшуйте timeout провайдера, а не timeout усього runtime агента:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Моделі NVIDIA наразі безкоштовні у використанні. Перевіряйте
[build.nvidia.com](https://build.nvidia.com/) щодо найактуальнішої доступності та
деталей rate-limit.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
