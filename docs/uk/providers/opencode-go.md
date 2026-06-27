---
read_when:
    - Вам потрібен каталог OpenCode Go
    - Вам потрібні посилання на моделі середовища виконання для моделей, розміщених у Go
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:13:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go — це каталог Go у складі [OpenCode](/uk/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає
ідентифікатор провайдера runtime `opencode-go`, щоб upstream-маршрутизація для кожної моделі залишалася правильною.

| Властивість       | Значення                        |
| ----------------- | ------------------------------- |
| Провайдер runtime | `opencode-go`                   |
| Авторизація       | `OPENCODE_API_KEY`              |
| Батьківське налаштування | [OpenCode](/uk/providers/opencode) |

## Вбудований каталог

OpenClaw бере більшість рядків каталогу Go з вбудованого реєстру моделей OpenClaw і
доповнює їх поточними upstream-рядками, доки реєстр наздоганяє зміни. Виконайте
`openclaw models list --provider opencode-go`, щоб переглянути поточний список моделей.

Провайдер містить:

| Посилання на модель              | Назва                 |
| -------------------------------- | --------------------- |
| `opencode-go/glm-5`              | GLM-5                 |
| `opencode-go/glm-5.1`            | GLM-5.1               |
| `opencode-go/glm-5.2`            | GLM-5.2               |
| `opencode-go/kimi-k2.5`          | Kimi K2.5             |
| `opencode-go/kimi-k2.6`          | Kimi K2.6 (ліміти 3x) |
| `opencode-go/kimi-k2.7-code`     | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`    | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash`  | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`       | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`        | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`       | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`       | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`       | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`       | Qwen3.6 Plus          |

GLM-5.2 використовує контекстне вікно на 1 млн токенів і підтримує до 131 тис. вихідних токенів.

## Початок роботи

<Tabs>
  <Tab title="Інтерактивно">
    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Установіть модель Go за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Неінтерактивно">
    <Steps>
      <Step title="Передайте ключ напряму">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично обробляє маршрутизацію для кожної моделі, коли посилання на модель використовує
    `opencode-go/...`. Додаткова конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Домовленість щодо посилань runtime">
    Посилання runtime залишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
    Це зберігає правильну upstream-маршрутизацію для кожної моделі в обох каталогах.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Той самий `OPENCODE_API_KEY` використовується каталогами Zen і Go. Введення
    ключа під час налаштування зберігає облікові дані для обох провайдерів runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Див. [OpenCode](/uk/providers/opencode), щоб ознайомитися зі спільним оглядом onboarding і повним
довідником каталогу Zen + Go.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільний onboarding, огляд каталогу та розширені примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>
