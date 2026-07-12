---
read_when:
    - Вам потрібен каталог OpenCode Go
    - Вам потрібні посилання на моделі середовища виконання для моделей, розміщених у Go
summary: Використовуйте каталог OpenCode Go зі спільною конфігурацією OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T13:43:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go — це каталог Go в [OpenCode](/uk/providers/opencode). Він використовує
ті самі облікові дані `OPENCODE_API_KEY`, що й каталог Zen, але має власний
ідентифікатор постачальника середовища виконання (`opencode-go`), щоб маршрутизація
за моделями у висхідній системі залишалася правильною.

| Властивість                    | Значення                                           |
| ------------------------------ | -------------------------------------------------- |
| Постачальник середовища виконання | `opencode-go`                                   |
| Автентифікація                 | `OPENCODE_API_KEY` (псевдонім: `OPENCODE_ZEN_API_KEY`) |
| Батьківське налаштування       | [OpenCode](/uk/providers/opencode)                    |

## Початок роботи

<Tabs>
  <Tab title="Інтерактивно">
    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Установіть модель Go типовою">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Неінтерактивно">
    <Steps>
      <Step title="Передайте ключ безпосередньо">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Перевірте доступність моделей">
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

## Вбудований каталог

Виконайте `openclaw models list --provider opencode-go`, щоб отримати поточний список моделей.
Вбудовані записи:

| Посилання на модель            | Назва             | Контекст  | Макс. вивід | Вхідні зображення |
| ------------------------------ | ----------------- | --------- | ----------- | ----------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K        | Ні                |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K        | Ні                |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768      | Ні                |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768      | Ні                |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072     | Ні                |
| `opencode-go/hy3-preview`       | Попередня версія HY3 | 262,144 | 32,768      | Ні                |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536      | Так               |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536      | Так               |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144     | Так               |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000     | Так               |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000     | Ні                |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536      | Ні                |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072     | Ні                |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072     | Ні                |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536      | Так               |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536      | Так               |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536      | Ні                |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536      | Так               |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично маршрутизує будь-яке посилання на модель `opencode-go/...`.
    Додаткова конфігурація постачальника не потрібна.
  </Accordion>

  <Accordion title="Угода щодо посилань середовища виконання">
    Посилання середовища виконання залишаються явними: `opencode/...` для Zen,
    `opencode-go/...` для Go. Це забезпечує правильну маршрутизацію за моделями
    у висхідній системі для обох каталогів.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Один ключ `OPENCODE_API_KEY` охоплює каталоги Zen і Go. Введення ключа
    під час налаштування зберігає облікові дані для обох постачальників середовища виконання.
  </Accordion>
</AccordionGroup>

<Tip>
Перегляньте [OpenCode](/uk/providers/opencode), щоб ознайомитися зі спільним оглядом початкового
налаштування та повним довідником каталогів Zen і Go.
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільне початкове налаштування, огляд каталогу та розширені примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>
