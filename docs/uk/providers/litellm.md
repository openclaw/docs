---
read_when:
    - Ви хочете спрямувати OpenClaw через проксі LiteLLM
    - Вам потрібні відстеження витрат, журналювання або маршрутизація моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для уніфікованого доступу до моделей і відстеження витрат
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T13:41:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) — це шлюз LLM із відкритим кодом та уніфікованим API для понад 100 постачальників
моделей. Спрямовуйте OpenClaw через LiteLLM для централізованого відстеження витрат, журналювання, віртуальних ключів
з обмеженнями витрат і перемикання на резервні серверні системи без зміни конфігурації OpenClaw.

## Швидкий початок

<Tabs>
  <Tab title="Onboarding (recommended)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Для неінтерактивного налаштування з віддаленим проксі явно передайте URL-адресу проксі:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Manual setup">
    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Конфігурація

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

Стандартна модель, яку записує процес початкового налаштування, — `litellm/claude-opus-4-6`.

## Генерування зображень

LiteLLM може забезпечувати роботу інструмента `image_generate` через сумісні з OpenAI маршрути `/images/generations` і
`/images/edits`. Стандартною моделлю зображень є `gpt-image-2`; налаштуйте іншу в
`agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

URL-адреси LiteLLM для local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) працюють
без глобального дозволу для приватної мережі. Для проксі, розміщеного в локальній мережі, установіть
`models.providers.litellm.request.allowPrivateNetwork: true`, оскільки ключ API надсилається на цей хост.

## Розширені можливості

<AccordionGroup>
  <Accordion title="Virtual keys">
    Створіть окремий ключ для OpenClaw з обмеженнями витрат:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Використовуйте згенерований ключ як `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM може спрямовувати запити до моделей у різні серверні системи. Налаштуйте це у файлі LiteLLM `config.yaml`:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw продовжує запитувати `claude-opus-4-6`, а LiteLLM виконує маршрутизацію.

  </Accordion>

  <Accordion title="Viewing usage">
    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - За замовчуванням LiteLLM працює за адресою `http://localhost:4000`.
    - OpenClaw підключається через сумісну з OpenAI кінцеву точку `/v1` проксі LiteLLM.
    - Формування запитів, призначене лише для нативного OpenAI, не застосовується через налаштовану базову URL-адресу LiteLLM:
      без `service_tier`, без `store` для Responses, без підказок для кешу промптів і без
      формування корисного навантаження для рівня інтенсивності міркування OpenAI.
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) надсилаються лише
      перевіреним нативним кінцевим точкам OpenAI, тому вони не додаються для власної базової URL-адреси LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
Загальну інформацію про конфігурацію постачальників і поведінку перемикання на резервну систему див. у розділі [Постачальники моделей](/uk/concepts/model-providers).
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Офіційна документація LiteLLM і довідник API.
  </Card>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки перемикання на резервну систему.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
  <Card title="Models" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
</CardGroup>
