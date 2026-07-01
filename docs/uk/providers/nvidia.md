---
read_when:
    - Ви хочете використовувати відкриті моделі в OpenClaw безкоштовно
    - Вам потрібно налаштувати NVIDIA_API_KEY
    - Ви хочете використовувати Nemotron 3 Ultra через NVIDIA
summary: Використовуйте OpenAI-сумісний API від NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA надає OpenAI-сумісний API за адресою `https://integrate.api.nvidia.com/v1` для
відкритих моделей безкоштовно. Автентифікуйтеся за допомогою API-ключа з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
за замовчуванням налаштовує провайдер NVIDIA на Nemotron 3 Ultra, модель NVIDIA з 550B загальних / 55B
активних параметрів міркування для агентної роботи з довгим контекстом.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Експортуйте ключ і запустіть onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Встановіть модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Якщо ви передасте `--nvidia-api-key` замість змінної середовища, значення потрапить в історію
shell і вивід `ps`. Коли
можливо, віддавайте перевагу змінній середовища `NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Рекомендований каталог

Коли налаштовано API-ключ NVIDIA, шляхи налаштування OpenClaw і вибору моделей
пробують публічний каталог рекомендованих моделей NVIDIA з
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` і
кешують ранжований результат на 24 години. Тому нові рекомендовані моделі з build.nvidia.com
з’являються на поверхнях налаштування та вибору моделей без очікування
релізу OpenClaw. Коли live-стрічка доступна, перша повернена модель є
варіантом за замовчуванням, показаним під час налаштування NVIDIA.

Отримання використовує фіксовану політику HTTPS-хоста для `assets.ngc.nvidia.com`. Якщо
API-ключ NVIDIA не налаштовано, або якщо цей публічний каталог недоступний чи
має неправильний формат, OpenClaw повертається до вбудованого каталогу та вбудованого стандартного варіанта нижче.

## Nemotron 3 Ultra

Nemotron 3 Ultra є стандартною моделлю NVIDIA в OpenClaw. Сторінка NVIDIA build для
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
вказує її як доступний безкоштовний endpoint зі специфікацією контексту в 1M токенів.
Вбудований каталог записує максимальний вивід у 16 384 токени, щоб відповідати поточному
OpenAI-сумісному прикладу запиту NVIDIA для розміщеного endpoint.

Використовуйте Ultra як стандартний варіант NVIDIA з найвищими можливостями. Залишайте вибраною Super, коли
потрібен менший варіант Nemotron 3, або виберіть одну зі сторонніх моделей,
розміщених у каталозі NVIDIA, коли їхній контекст, затримка чи поведінка підходять краще.
Вбудований рядок Ultra надсилає `chat_template_kwargs.enable_thinking: false` і
`force_nonempty_content: true` за замовчуванням, щоб звичайний вивід чату залишався у
видимій відповіді замість розкриття тексту міркувань.

## Вбудований резервний каталог

| Посилання на модель                         | Назва                        | Контекст  | Макс. вивід | Примітки                                  |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | ----------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384      | За замовчуванням                          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192       | Рекомендований резервний варіант          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192       | Застаріло, сумісність оновлення           |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192       | Застаріло, сумісність оновлення           |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка автоматичного ввімкнення">
    Провайдер автоматично вмикається, коли встановлено змінну середовища `NVIDIA_API_KEY`.
    Явна конфігурація провайдера, окрім ключа, не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    OpenClaw надає перевагу публічному каталогу рекомендованих моделей NVIDIA, коли налаштовано
    автентифікацію NVIDIA, і кешує його на 24 години. Вбудований резервний каталог статичний
    і зберігає застарілі випущені посилання для сумісності оновлення. Вартість за замовчуванням
    дорівнює `0` у вихідному коді, оскільки NVIDIA наразі пропонує безкоштовний доступ API для
    перелічених моделей.
  </Accordion>

  <Accordion title="OpenAI-сумісний endpoint">
    NVIDIA використовує стандартний endpoint completions `/v1`. Будь-які OpenAI-сумісні
    інструменти мають працювати з базовою URL-адресою NVIDIA без додаткового налаштування.
  </Accordion>

  <Accordion title="Параметри міркування Nemotron 3 Ultra">
    Приклад запиту Ultra від NVIDIA використовує `chat_template_kwargs.enable_thinking`
    і `reasoning_budget` для виводу міркувань. Вбудований рядок Ultra в OpenClaw
    за замовчуванням вимикає template thinking для звичайного використання чату. Якщо потрібно
    увімкнути вивід міркувань NVIDIA або примусово встановити інші специфічні для NVIDIA поля запиту,
    задайте параметри для окремої моделі та обмежте специфічні для провайдера перевизначення
    моделлю NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` є фінальним перевизначенням тіла OpenAI-сумісного запиту, тому
    використовуйте його лише для полів, які NVIDIA документує для вибраного endpoint.

  </Accordion>

  <Accordion title="Повільні відповіді користувацького провайдера">
    Деякі користувацькі моделі, розміщені NVIDIA, можуть потребувати більше часу, ніж стандартний watchdog бездіяльності моделі,
    перш ніж вони видадуть перший фрагмент відповіді. Для користувацьких записів провайдера NVIDIA
    збільште timeout провайдера замість збільшення timeout усього
    runtime агента:

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
[build.nvidia.com](https://build.nvidia.com/) для найактуальніших відомостей про доступність і
деталі rate limit.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
