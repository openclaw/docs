---
read_when:
    - Ви хочете маршрутизувати OpenClaw через proxy LiteLLM
    - Вам потрібні відстеження вартості, логування або маршрутизація моделей через LiteLLM
summary: Запуск OpenClaw через LiteLLM Proxy для уніфікованого доступу до моделей і відстеження вартості
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T21:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) — це open-source LLM gateway, який надає уніфікований API до 100+ providers моделей. Маршрутизуйте OpenClaw через LiteLLM, щоб отримати централізоване відстеження вартості, логування та гнучкість перемикання backend-ів без зміни конфігурації OpenClaw.

<Tip>
**Навіщо використовувати LiteLLM з OpenClaw?**

- **Відстеження вартості** — Бачте точні витрати OpenClaw на всі моделі
- **Маршрутизація моделей** — Перемикайтеся між Claude, GPT-4, Gemini, Bedrock без змін конфігурації
- **Віртуальні ключі** — Створюйте ключі з лімітами витрат для OpenClaw
- **Логування** — Повні логи request/response для налагодження
- **Fallback-и** — Автоматичний failover, якщо ваш основний provider недоступний

</Tip>

## Швидкий старт

<Tabs>
  <Tab title="Онбординг (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до працездатного налаштування LiteLLM.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
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
      <Step title="Спрямуйте OpenClaw на LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        І все. Тепер OpenClaw маршрутизується через LiteLLM.
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
    LiteLLM може маршрутизувати запити моделей до різних backend-ів. Налаштуйте це у вашому `config.yaml` LiteLLM:

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

    OpenClaw і далі запитуватиме `claude-opus-4-6` — маршрутизацію бере на себе LiteLLM.

  </Accordion>

  <Accordion title="Перегляд використання">
    Перевіряйте dashboard або API LiteLLM:

    ```bash
    # Інформація про ключ
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Логи витрат
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Примітки щодо поведінки proxy">
    - LiteLLM типово працює на `http://localhost:4000`
    - OpenClaw підключається через OpenAI-сумісний endpoint `/v1` у стилі proxy від LiteLLM
    - Нативне формування запитів лише для OpenAI не застосовується через LiteLLM:
      немає `service_tier`, немає `store` Responses, немає prompt-cache hints і немає
      формування payload reasoning-compat для OpenAI
    - Приховані attribution headers OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються для custom base URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Загальну конфігурацію provider-ів і поведінку failover див. в [Model Providers](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Документація LiteLLM" href="https://docs.litellm.ai" icon="book">
    Офіційна документація LiteLLM і довідка з API.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх provider-ів, refs моделей і поведінки failover.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повна довідка з конфігурації.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
</CardGroup>
