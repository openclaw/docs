---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Потрібно налаштувати NVIDIA_API_KEY
    - Ви хочете використовувати Nemotron 3 Ultra через NVIDIA
summary: Використовуйте OpenAI-сумісний API NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA надає OpenAI-сумісний API за адресою `https://integrate.api.nvidia.com/v1` для
відкритих моделей безкоштовно. Автентифікуйтеся за допомогою API-ключа з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
типово використовує для провайдера NVIDIA Nemotron 3 Ultra, reasoning-модель NVIDIA із 550B загалом / 55B
активних параметрів для агентної роботи з довгим контекстом.

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
  <Step title="Задайте модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Якщо передати `--nvidia-api-key` замість змінної середовища, значення потрапить в історію shell
і вивід `ps`. За можливості віддавайте перевагу змінній середовища `NVIDIA_API_KEY`.
</Warning>

Для неінтерактивного налаштування також можна передати ключ безпосередньо:

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

Коли API-ключ NVIDIA налаштовано, шляхи налаштування OpenClaw і вибору моделей
пробують публічний каталог рекомендованих моделей NVIDIA з
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` і
кешують ранжований результат на 24 години. Тому нові рекомендовані моделі з build.nvidia.com
з’являються в поверхнях налаштування та вибору моделей без очікування
релізу OpenClaw. Коли live-стрічка доступна, перша повернена модель є
типовим варіантом, показаним під час налаштування NVIDIA.

Отримання використовує фіксовану політику HTTPS-хоста для `assets.ngc.nvidia.com`. Якщо
API-ключ NVIDIA не налаштовано або якщо цей публічний каталог недоступний чи
має неправильний формат, OpenClaw повертається до вбудованого каталогу й типового вбудованого значення нижче.

## Nemotron 3 Ultra

Nemotron 3 Ultra є типовою моделлю NVIDIA в OpenClaw. Сторінка NVIDIA build для
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
вказує її як доступну безкоштовну endpoint з контекстною специфікацією на 1M токенів.
Вбудований каталог записує максимальний вивід у 16 384 токени, щоб відповідати поточному
OpenAI-сумісному прикладу запиту NVIDIA для hosted endpoint.

Використовуйте Ultra як найпотужніший типовий варіант NVIDIA. Залишайте Super вибраною, коли
потрібна менша опція Nemotron 3, або виберіть одну зі сторонніх моделей,
розміщених у каталозі NVIDIA, коли їхній контекст, затримка чи поведінка підходять краще.
Вбудований рядок Ultra типово надсилає `chat_template_kwargs.enable_thinking: false` і
`force_nonempty_content: true`, щоб звичайний вивід чату залишався у
видимій відповіді замість розкриття тексту reasoning.

## Вбудований резервний каталог

| Посилання на модель                         | Назва                        | Контекст  | Макс. вивід | Примітки                                  |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | ----------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384      | Типова                                    |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192       | Рекомендований резервний варіант          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192       | Застаріла, сумісність оновлення           |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192       | Застаріла, сумісність оновлення           |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка автоматичного ввімкнення">
    Провайдер автоматично вмикається, коли змінну середовища `NVIDIA_API_KEY` задано.
    Крім ключа, явна конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    OpenClaw віддає перевагу публічному каталогу рекомендованих моделей NVIDIA, коли автентифікацію NVIDIA
    налаштовано, і кешує його на 24 години. Вбудований резервний каталог є статичним
    і зберігає застарілі shipped refs для сумісності оновлення. Витрати типово
    дорівнюють `0` у джерелі, оскільки NVIDIA наразі пропонує безкоштовний API-доступ для
    перелічених моделей.
  </Accordion>

  <Accordion title="OpenAI-сумісний endpoint">
    NVIDIA використовує стандартний endpoint completions `/v1`. Будь-які OpenAI-сумісні
    інструменти мають працювати одразу з базовою URL-адресою NVIDIA.
  </Accordion>

  <Accordion title="Параметри reasoning Nemotron 3 Ultra">
    Приклад запиту Ultra від NVIDIA використовує `chat_template_kwargs.enable_thinking`
    і `reasoning_budget` для виводу reasoning. Вбудований рядок Ultra в OpenClaw
    типово вимикає template thinking для звичайного використання чату. Якщо потрібно
    увімкнути вивід reasoning NVIDIA або примусово задати інші специфічні для NVIDIA поля запиту,
    задайте параметри для окремої моделі й обмежте специфічні для провайдера перевизначення
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
    Деяким користувацьким моделям, розміщеним NVIDIA, може знадобитися більше часу, ніж типовому watchdog простою моделі,
    перш ніж вони видадуть перший фрагмент відповіді. Для користувацьких записів провайдера NVIDIA
    збільшуйте тайм-аут провайдера, а не тайм-аут усього runtime агента:

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
Моделі NVIDIA наразі безкоштовні у використанні. Перевірте
[build.nvidia.com](https://build.nvidia.com/) для найактуальнішої доступності та
деталей rate-limit.
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
