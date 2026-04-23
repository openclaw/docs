---
read_when:
    - Ви хочете каталог OpenCode Go
    - Вам потрібні refs моделей runtime для моделей, розміщених у Go-hosted environment
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-23T21:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a764a2748ccd886818707bb8cfd046b93062e472bd34fbd0253011ba6bddde45
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go — це каталог Go в межах [OpenCode](/uk/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає runtime
provider id `opencode-go`, щоб upstream-маршрутизація для кожної моделі працювала правильно.

| Властивість      | Значення                      |
| ---------------- | ----------------------------- |
| Runtime provider | `opencode-go`                 |
| Auth             | `OPENCODE_API_KEY`            |
| Батьківське налаштування | [OpenCode](/uk/providers/opencode) |

## Підтримувані моделі

OpenClaw бере каталог Go із вбудованого реєстру моделей pi. Виконайте
`openclaw models list --provider opencode-go`, щоб побачити актуальний список моделей.

Станом на вбудований каталог pi provider містить:

| Ref моделі                 | Назва                 |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (ліміти 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Початок роботи

<Tabs>
  <Tab title="Інтерактивно">
    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Задайте Go model як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично обробляє маршрутизацію для кожної моделі, коли ref моделі має вигляд
    `opencode-go/...`. Додаткова конфігурація provider-а не потрібна.
  </Accordion>

  <Accordion title="Умовність runtime ref">
    Runtime refs лишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
    Це зберігає коректну upstream-маршрутизацію для кожної моделі в обох каталогах.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Той самий `OPENCODE_API_KEY` використовується і для каталогів Zen, і для Go. Введення
    ключа під час setup зберігає облікові дані для обох runtime provider-ів.
  </Accordion>
</AccordionGroup>

<Tip>
Див. [OpenCode](/uk/providers/opencode) для спільного огляду онбордингу та повної
довідки щодо каталогів Zen + Go.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільний онбординг, огляд каталогу та розширені примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, refs моделей і поведінки failover.
  </Card>
</CardGroup>
