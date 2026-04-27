---
read_when:
    - Ви хочете спрямувати OpenClaw через проксі LiteLLM
    - Вам потрібне відстеження витрат, журналювання або маршрутизація моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для уніфікованого доступу до моделей і відстеження витрат
title: LiteLLM
x-i18n:
    generated_at: "2026-04-27T19:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) — це шлюз LLM з відкритим кодом, який надає уніфікований API до понад 100 постачальників моделей. Спрямуйте OpenClaw через LiteLLM, щоб отримати централізоване відстеження витрат, журналювання та гнучкість перемикання бекендів без змін у конфігурації OpenClaw.

<Tip>
**Чому варто використовувати LiteLLM з OpenClaw?**

- **Відстеження витрат** — Бачте точно, скільки OpenClaw витрачає на всі моделі
- **Маршрутизація моделей** — Перемикайтеся між Claude, GPT-4, Gemini, Bedrock без змін у конфігурації
- **Віртуальні ключі** — Створюйте ключі з лімітами витрат для OpenClaw
- **Журналювання** — Повні журнали запитів/відповідей для налагодження
- **Резервні перемикання** — Автоматичне перемикання у разі збою, якщо ваш основний постачальник недоступний

</Tip>

## Швидкий початок

<Tabs>
  <Tab title="Початкове налаштування (рекомендовано)">
    **Найкраще для:** найшвидшого способу отримати робоче налаштування LiteLLM.

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Для неінтерактивного налаштування з віддаленим проксі явно передайте URL проксі:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Ручне налаштування">
    **Найкраще для:** повного контролю над встановленням і конфігурацією.

    <Steps>
      <Step title="Запустіть LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Спрямуйте OpenClaw до LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Ось і все. Тепер OpenClaw спрямовує запити через LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфігурація

### Змінні середовища

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Файл конфігурації

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

## Розширена конфігурація

### Генерація зображень

LiteLLM також може обслуговувати інструмент `image_generate` через OpenAI-сумісні
маршрути `/images/generations` і `/images/edits`. Налаштуйте модель зображень LiteLLM
у `agents.defaults.imageGenerationModel`:

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

URL LiteLLM із local loopback, наприклад `http://localhost:4000`, працюють без глобального
перевизначення приватної мережі. Для проксі, розміщеного в LAN, установіть
`models.providers.litellm.request.allowPrivateNetwork: true`, оскільки API-ключ
буде надіслано налаштованому хосту проксі.

<AccordionGroup>
  <Accordion title="Віртуальні ключі">
    Створіть окремий ключ для OpenClaw з лімітами витрат:

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

  <Accordion title="Маршрутизація моделей">
    LiteLLM може спрямовувати запити до моделей на різні бекенди. Налаштуйте це у вашому `config.yaml` LiteLLM:

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

    OpenClaw і далі запитуватиме `claude-opus-4-6` — маршрутизацією керує LiteLLM.

  </Accordion>

  <Accordion title="Перегляд використання">
    Перевіряйте панель керування або API LiteLLM:

    ```bash
    # Інформація про ключ
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Журнали витрат
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Примітки щодо поведінки проксі">
    - LiteLLM за замовчуванням працює на `http://localhost:4000`
    - OpenClaw підключається через OpenAI-сумісну кінцеву точку `/v1`
      у стилі проксі LiteLLM
    - Власне формування запитів лише для OpenAI не застосовується через LiteLLM:
      немає `service_tier`, немає `store` для Responses, немає підказок кешу промптів і немає
      формування payload для сумісності з reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються для користувацьких базових URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Загальні відомості про конфігурацію постачальників і поведінку резервного перемикання див. у [Постачальники моделей](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Документація LiteLLM" href="https://docs.litellm.ai" icon="book">
    Офіційна документація LiteLLM і довідник API.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
</CardGroup>
