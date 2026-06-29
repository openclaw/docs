---
read_when:
    - Вам нужен каталог OpenCode Go
    - Вам нужны идентификаторы моделей среды выполнения для моделей, размещённых в Go
summary: Используйте каталог OpenCode Go с общей настройкой OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-28T23:38:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go — это каталог Go в составе [OpenCode](/ru/providers/opencode).
Он использует тот же `OPENCODE_API_KEY`, что и каталог Zen, но сохраняет идентификатор провайдера
среды выполнения `opencode-go`, чтобы маршрутизация по моделям на стороне upstream оставалась корректной.

| Свойство         | Значение                        |
| ---------------- | ------------------------------- |
| Провайдер среды выполнения | `opencode-go`          |
| Аутентификация   | `OPENCODE_API_KEY`              |
| Родительская настройка | [OpenCode](/ru/providers/opencode) |

## Встроенный каталог

OpenClaw получает большинство строк каталога Go из встроенного реестра моделей OpenClaw и
дополняет их текущими строками upstream, пока реестр обновляется. Выполните
`openclaw models list --provider opencode-go`, чтобы получить текущий список моделей.

Провайдер включает:

| Ссылка на модель                 | Название              |
| -------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (лимиты 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 использует контекстное окно на 1 млн токенов и поддерживает до 131 тыс. выходных токенов.

## Начало работы

<Tabs>
  <Tab title="Интерактивно">
    <Steps>
      <Step title="Запустите первичную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Задайте модель Go по умолчанию">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Проверьте, что модели доступны">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Неинтерактивно">
    <Steps>
      <Step title="Передайте ключ напрямую">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Проверьте, что модели доступны">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Пример конфигурации

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поведение маршрутизации">
    OpenClaw автоматически обрабатывает маршрутизацию по моделям, когда ссылка на модель использует
    `opencode-go/...`. Дополнительная конфигурация провайдера не требуется.
  </Accordion>

  <Accordion title="Соглашение о ссылках среды выполнения">
    Ссылки среды выполнения остаются явными: `opencode/...` для Zen, `opencode-go/...` для Go.
    Это сохраняет корректную маршрутизацию по моделям на стороне upstream в обоих каталогах.
  </Accordion>

  <Accordion title="Общие учетные данные">
    Один и тот же `OPENCODE_API_KEY` используется каталогами Zen и Go. Ввод
    ключа во время настройки сохраняет учетные данные для обоих провайдеров среды выполнения.
  </Accordion>
</AccordionGroup>

<Tip>
См. [OpenCode](/ru/providers/opencode) для общего обзора первичной настройки и полной
справки по каталогам Zen + Go.
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="OpenCode (родительский)" href="/ru/providers/opencode" icon="server">
    Общая первичная настройка, обзор каталога и расширенные примечания.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
</CardGroup>
