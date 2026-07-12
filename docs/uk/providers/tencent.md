---
read_when:
    - Ви хочете використовувати Tencent hy3 з OpenClaw
    - Потрібно налаштувати ключ API TokenHub або TokenPlan
summary: Налаштування Tencent Cloud TokenHub і TokenPlan для hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T13:38:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Установіть офіційний Plugin постачальника Tencent Cloud, щоб отримати доступ до Tencent Hy3 через дві кінцеві точки — TokenHub (`tencent-tokenhub`) і TokenPlan (`tencent-tokenplan`) — за допомогою API, сумісного з OpenAI.

| Властивість                         | Значення                                              |
| ----------------------------------- | ----------------------------------------------------- |
| Ідентифікатори постачальників       | `tencent-tokenhub`, `tencent-tokenplan`               |
| Пакет                               | `@openclaw/tencent-provider`                          |
| Змінна середовища автентифікації TokenHub  | `TOKENHUB_API_KEY`                             |
| Змінна середовища автентифікації TokenPlan | `TOKENPLAN_API_KEY`                            |
| Прапорець початкового налаштування TokenHub  | `--auth-choice tokenhub-api-key`               |
| Прапорець початкового налаштування TokenPlan | `--auth-choice tokenplan-api-key`               |
| Прямий прапорець CLI для TokenHub   | `--tokenhub-api-key <key>`                            |
| Прямий прапорець CLI для TokenPlan  | `--tokenplan-api-key <key>`                           |
| API                                 | сумісний з OpenAI (`openai-completions`)              |
| Базова URL-адреса TokenHub          | `https://tokenhub.tencentmaas.com/v1`                 |
| Глобальна базова URL-адреса TokenHub | `https://tokenhub-intl.tencentmaas.com/v1` (перевизначення) |
| Базова URL-адреса TokenPlan         | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Модель за замовчуванням             | `tencent-tokenhub/hy3`                                |

## Швидкий початок

<Steps>
  <Step title="Створіть ключ API Tencent">
    Створіть ключ API для Tencent Cloud TokenHub і TokenPlan. Якщо ви вибираєте для ключа обмежену область доступу, додайте **hy3** (а також **hy3 preview**, якщо плануєте використовувати її в TokenHub) до списку дозволених моделей.
  </Step>
  <Step title="Запустіть початкове налаштування">
    <CodeGroup>

```bash Початкове налаштування TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Прямий прапорець TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Початкове налаштування TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Прямий прапорець TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Лише змінні середовища
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` є обов’язковим разом із `--non-interactive`.
</Note>

## Вбудований каталог

| Посилання на модель            | Назва                  | Вхідні дані | Контекст | Макс. виведення | Примітки                    |
| ------------------------------ | ---------------------- | ----------- | -------- | --------------- | --------------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | текст       | 256,000  | 64,000          | підтримує міркування         |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | текст       | 256,000  | 64,000          | підтримує міркування         |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | текст       | 256,000  | 64,000          | підтримує міркування         |

hy3 — це велика мовна MoE-модель Tencent Hunyuan для міркувань, виконання інструкцій із довгим контекстом, роботи з кодом і робочих процесів агентів. У прикладах Tencent, сумісних з OpenAI, `hy3` використовується як ідентифікатор моделі та підтримуються стандартні виклики інструментів у chat completions, а також `reasoning_effort`.

<Tip>
  Ідентифікатор моделі — `hy3`. Не плутайте її з моделями Tencent `HY-3D-*`, які є API для генерації 3D і не є чат-моделлю OpenClaw, налаштованою цим постачальником.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Перевизначення кінцевої точки">
    Вбудований каталог OpenClaw використовує кінцеву точку Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Перевизначайте її лише тоді, коли ваш обліковий запис або регіон TokenHub потребує іншої:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Доступність змінних середовища для фонової служби">
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), змінні `TOKENHUB_API_KEY` і `TOKENPLAN_API_KEY` мають бути доступні цьому процесу. Задайте їх у `~/.openclaw/.env` або через `env.shellEnv`, щоб середовища виконання launchd, systemd або Docker могли їх прочитати.

    <Warning>
      Ключі, експортовані лише в інтерактивній оболонці, недоступні керованим процесам Gateway. Для постійної доступності використовуйте файл змінних середовища або точку конфігурації.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальника.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Сторінка продукту TokenHub від Tencent Cloud.
  </Card>
  <Card title="Картка попередньої версії моделі Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Докладна інформація та результати тестування попередньої версії Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
