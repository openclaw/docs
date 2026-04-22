---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
summary: Використовуйте уніфікований API OpenRouter, щоб отримати доступ до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T03:53:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через єдину кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

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
  <Step title="(Необов’язково) Переключіться на конкретну модель">
    Під час онбордингу типовим значенням є `openrouter/auto`. Пізніше виберіть конкретну модель:

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
Посилання на моделі мають шаблон `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованих резервних варіантів:

| Model ref                            | Notes                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 через MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Маршрут OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Маршрут OpenRouter Hunter Alpha |

## Автентифікація та заголовки

OpenRouter під капотом використовує Bearer token з вашим API-ключем.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдера OpenRouter на якийсь інший проксі або base URL, OpenClaw
**не** додає ці специфічні для OpenRouter заголовки чи маркери кешу Anthropic.
</Warning>

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання prompt-cache у блоках system/developer prompt.
  </Accordion>

  <Accordion title="Впровадження thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    payload reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають це впровадження reasoning.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через сумісний із OpenAI шлях у стилі проксі, тому
    нативне формування запитів лише для OpenAI, таке як `serviceTier`, Responses `store`,
    payload сумісності reasoning OpenAI та підказки prompt-cache, не передається далі.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на проксі-шляху Gemini: OpenClaw зберігає
    там санітизацію thought-signature Gemini, але не вмикає нативну перевірку
    повторного відтворення Gemini або bootstrap rewrites.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
