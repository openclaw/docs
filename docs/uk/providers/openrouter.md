---
read_when:
    - You want a single API key for many LLMs
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
summary: Використання уніфікованого API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-23T21:07:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29532ce2b7fa2b4643db155f6fd6ee17fd9d14ddf65d5e78d0970a4db7b7694a
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через один
endpoint і один API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють, якщо змінити base URL.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перемкніться на конкретну модель">
    Онбординг типово встановлює `openrouter/auto`. Пізніше можна вибрати конкретну модель:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Приклад конфігурації

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Посилання на моделі

<Note>
Посилання на моделі мають формат `openrouter/<provider>/<model>`. Повний список
доступних provider і моделей див. у [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованого fallback:

| Model ref                            | Примітки                        |
| ------------------------------------ | ------------------------------- |
| `openrouter/auto`                    | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 через MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Маршрут OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Маршрут OpenRouter Hunter Alpha |

## Автентифікація та заголовки

Під капотом OpenRouter використовує Bearer token з вашим API-ключем.

Для реальних запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані OpenRouter заголовки атрибуції застосунку:

| Заголовок                 | Значення              |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите provider OpenRouter на якийсь інший proxy або base URL, OpenClaw
**не** додаватиме ці OpenRouter-специфічні заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter refs моделей Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках system/developer prompt.
  </Accordion>

  <Accordion title="Впровадження thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    payload міркувань proxy OpenRouter. Непідтримувані підказки моделі та
    `openrouter/auto` пропускають це впровадження міркувань.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе одно працює через proxy-подібний OpenAI-сумісний шлях, тому
    нативне формування запитів лише для OpenAI, таке як `serviceTier`, Responses `store`,
    payload сумісності reasoning OpenAI та підказки prompt-cache, не передається далі.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    refs OpenRouter на базі Gemini залишаються на proxy-Gemini шляху: OpenClaw зберігає
    там санітизацію thought-signature Gemini, але не вмикає нативну валідацію replay Gemini
    або bootstrap rewrites.
  </Accordion>

  <Accordion title="Метадані маршрутизації provider">
    Якщо ви передаєте маршрутизацію provider OpenRouter у параметрах моделі, OpenClaw передає
    її як метадані маршрутизації OpenRouter до запуску спільних stream wrappers.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для agents, models і providers.
  </Card>
</CardGroup>
