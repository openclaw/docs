---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Потрібно налаштувати NVIDIA_API_KEY
    - Ви хочете використовувати Nemotron 3 Ultra через NVIDIA
summary: Використання API NVIDIA, сумісного з OpenAI, в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T13:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA безкоштовно надає відкриті моделі через API, сумісний з OpenAI, за адресою
`https://integrate.api.nvidia.com/v1`, з автентифікацією за допомогою ключа API з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). За замовчуванням
OpenClaw використовує для постачальника NVIDIA модель Nemotron 3 Ultra — модель
NVIDIA із загальною кількістю 550 млрд параметрів, 55 млрд активних параметрів
і підтримкою міркувань для агентних завдань із великим контекстом.

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Експортуйте ключ і запустіть початкове налаштування">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Установіть модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Для неінтерактивного налаштування передайте ключ безпосередньо:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
Через `--nvidia-api-key` ключ потрапляє до історії оболонки та виводу `ps`. За
можливості використовуйте змінну середовища `NVIDIA_API_KEY`.
</Warning>

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

## Каталог рекомендованих моделей

Коли налаштовано ключ API NVIDIA, під час налаштування та вибору моделі
завантажується загальнодоступний каталог рекомендованих моделей NVIDIA з
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`, а
результат кешується на 24 години (перші 32 записи імпортуються як рядки з
безкоштовним текстовим введенням). Тому нові рекомендовані моделі з
build.nvidia.com з’являються в інтерфейсах налаштування та вибору моделі без
очікування випуску нової версії OpenClaw. Коли оперативний канал даних
доступний, перша повернена модель є попередньо вибраним варіантом під час
налаштування NVIDIA.

Для завантаження застосовується фіксована політика хоста HTTPS для
`assets.ngc.nvidia.com`. Якщо ключ API NVIDIA не налаштовано або канал даних
недоступний чи має неправильний формат, OpenClaw використовує наведені нижче
вбудований каталог і вбудовану модель за замовчуванням.

## Nemotron 3 Ultra

Nemotron 3 Ultra — модель NVIDIA за замовчуванням в OpenClaw. На сторінці
складання NVIDIA для
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
її вказано як доступну безкоштовну кінцеву точку зі специфікацією контексту на
1 млн токенів.

Вбудований рядок Ultra за замовчуванням надсилає
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
щоб звичайний результат чату залишався у видимій відповіді, а текст міркувань
не розкривався.

Використовуйте Ultra як найпотужнішу модель NVIDIA за замовчуванням. Залиште
вибраною Super, якщо вам потрібен менший варіант Nemotron 3, або виберіть одну
зі сторонніх моделей, розміщених у каталозі NVIDIA, якщо її контекст, затримка
чи поведінка краще відповідають вашим потребам.

## Вбудований резервний каталог

Доступні для вибору вбудовані рядки є знімком каталогу рекомендованих моделей
NVIDIA. Застарілі рядки сумісності й надалі можна використовувати за точним
посиланням, але вони не відображаються в засобах вибору моделі.

| Посилання на модель                         | Назва                 | Контекст  | Максимальний вивід |
| ------------------------------------------- | --------------------- | --------- | ------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b`  | Nemotron 3 Ultra 550B | 1,048,576 | 8,192              |
| `nvidia/nvidia/nemotron-3-super-120b-a12b`  | Nemotron 3 Super 120B | 1,000,000 | 8,192              |
| `nvidia/z-ai/glm-5.2`                       | GLM 5.2               | 202,752   | 8,192              |
| `nvidia/moonshotai/kimi-k2.6`               | Kimi K2.6             | 262,144   | 8,192              |
| `nvidia/minimaxai/minimax-m3`               | Minimax M3            | 196,608   | 8,192              |
| `nvidia/deepseek-ai/deepseek-v4-pro`        | DeepSeek V4 Pro       | 262,144   | 16,384             |
| `nvidia/qwen/qwen3.5-397b-a17b`             | Qwen3.5 397B A17B     | 262,144   | 16,384             |

Повний каталог сумісності також зберігає ці випущені посилання для наявних
конфігурацій: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` і
`nvidia/minimaxai/minimax-m2.7`. Вони й надалі доступні за точним посиланням,
але ніколи не відображаються під час початкового налаштування або в засобах
вибору моделі.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автоматичне ввімкнення">
    Постачальник вмикається автоматично, коли встановлено змінну середовища
    `NVIDIA_API_KEY` або ключ було збережено під час початкового налаштування.
    Окрім ключа, явна конфігурація постачальника не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    Коли налаштовано автентифікацію NVIDIA, OpenClaw надає перевагу
    загальнодоступному каталогу рекомендованих моделей NVIDIA та кешує його на
    24 години. Вбудований резервний каталог доступних для вибору моделей є
    статичним знімком каталогу рекомендованих моделей NVIDIA; застарілі рядки
    сумісності, доступні за точним посиланням, приховано в засобах вибору
    моделі. У вихідному коді вартість за замовчуванням дорівнює `0`, оскільки
    зараз NVIDIA надає безкоштовний доступ через API до перелічених моделей.
  </Accordion>

  <Accordion title="Кінцева точка, сумісна з OpenAI">
    OpenClaw взаємодіє з NVIDIA через адаптер `openai-completions`, використовуючи
    стандартний маршрут завершень чату `/v1`. Будь-які інструменти, сумісні з
    OpenAI, мають працювати без додаткового налаштування з базовою URL-адресою
    NVIDIA.
  </Accordion>

  <Accordion title="Параметри міркувань Nemotron 3 Ultra">
    У прикладі запиту NVIDIA для Ultra використовуються
    `chat_template_kwargs.enable_thinking` і `reasoning_budget` для виведення
    міркувань. Вбудований рядок Ultra в OpenClaw за замовчуванням вимикає
    міркування шаблону для звичайного використання чату. Якщо потрібно
    ввімкнути виведення міркувань NVIDIA або примусово встановити інші
    специфічні для NVIDIA поля запиту, задайте параметри окремої моделі та
    обмежте специфічні для постачальника перевизначення моделлю NVIDIA:

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

    `params.chat_template_kwargs` об’єднується з усіма
    `chat_template_kwargs`, які вже є в запиті, замість заміни всього об’єкта.
    `params.extra_body` є остаточним перевизначенням тіла запиту, сумісного з
    OpenAI, і перезаписує ключі корисного навантаження, що збігаються, тому
    використовуйте його лише для полів, які NVIDIA документує для вибраної
    кінцевої точки.

  </Accordion>

  <Accordion title="Повільні відповіді користувацького постачальника">
    Деяким користувацьким моделям, розміщеним на NVIDIA, може знадобитися більше
    часу, ніж стандартні приблизно 120 с бездіяльності моделі, які контролює
    сторожовий таймер, перш ніж вони надішлють перший фрагмент відповіді. Для
    користувацьких записів постачальника NVIDIA збільшуйте час очікування
    постачальника, а не всього середовища виконання агента; `timeoutSeconds`
    охоплює HTTP-запити постачальника та збільшує граничний час сторожового
    таймера бездіяльності й потоку для цього постачальника:

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
Наразі моделі NVIDIA можна використовувати безкоштовно. Перевіряйте
[build.nvidia.com](https://build.nvidia.com/), щоб дізнатися актуальні відомості
про доступність та обмеження частоти запитів.
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації агентів, моделей і постачальників.
  </Card>
</CardGroup>
