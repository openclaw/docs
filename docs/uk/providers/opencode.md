---
read_when:
    - Вам потрібен доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використання каталогів OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T13:37:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode надає два розміщені каталоги в OpenClaw:

| Каталог | Префікс           | Постачальник середовища виконання |
| ------- | ----------------- | ------------------------------- |
| **Zen** | `opencode/...`    | `opencode`                      |
| **Go**  | `opencode-go/...` | `opencode-go`                   |

Обидва каталоги використовують один ключ API OpenCode (`OPENCODE_API_KEY`, псевдонім
`OPENCODE_ZEN_API_KEY`). OpenClaw зберігає окремі ідентифікатори постачальників середовища виконання, щоб
маршрутизація кожної моделі у висхідній системі залишалася правильною, але під час початкового налаштування та в документації вони розглядаються як
єдине налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Каталог Zen">
    **Найкраще підходить для:** керованого багатомодельного проксі OpenCode (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель Zen як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Найкраще підходить для:** розміщеної в OpenCode лінійки Kimi, GLM, MiniMax, Qwen і DeepSeek.

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель Go як типову">
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
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Вбудовані каталоги

### Zen

| Властивість                    | Значення                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Постачальник середовища виконання | `opencode`                                                                                    |
| Приклади моделей               | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Виконайте `openclaw models list --provider opencode`, щоб переглянути повний актуальний список, який
також містить позиції безплатного рівня, як-от `opencode/big-pickle` і
`opencode/deepseek-v4-flash-free`.

### Go

| Властивість                    | Значення                                                                 |
| ------------------------------ | ------------------------------------------------------------------------ |
| Постачальник середовища виконання | `opencode-go`                                                            |
| Приклади моделей               | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Повну таблицю моделей Go див. у розділі [OpenCode Go](/uk/providers/opencode-go).

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Псевдоніми ключа API">
    `OPENCODE_ZEN_API_KEY` також приймається як псевдонім для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох постачальників
    середовища виконання. Не потрібно окремо виконувати початкове налаштування кожного каталогу.
  </Accordion>

  <Accordion title="Отримання ключа API">
    Створіть обліковий запис OpenCode і згенеруйте ключ API на сторінці
    [opencode.ai/auth](https://opencode.ai/auth). Керування оплатою та доступністю каталогів
    здійснюється на панелі керування OpenCode.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення Gemini">
    Посилання OpenCode на основі Gemini залишаються на шляху проксі Gemini, тому OpenClaw
    продовжує очищувати там підписи міркувань Gemini, не вмикаючи нативну перевірку
    повторного відтворення Gemini чи перезапис початкової ініціалізації.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення не-Gemini моделей">
    Посилання OpenCode не на Gemini зберігають мінімальну політику повторного відтворення, сумісну з OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/uk/providers/opencode-go" icon="server">
    Повний довідник каталогу Go.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації агентів, моделей і постачальників.
  </Card>
</CardGroup>
