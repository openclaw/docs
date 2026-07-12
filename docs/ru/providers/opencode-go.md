---
read_when:
    - Вам нужен каталог OpenCode Go
    - Вам нужны ссылки на модели среды выполнения для моделей, размещённых в Go
summary: Используйте каталог OpenCode Go с общей конфигурацией OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T11:48:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go — это каталог Go внутри [OpenCode](/ru/providers/opencode). Он использует
те же учетные данные `OPENCODE_API_KEY`, что и каталог Zen, но имеет собственный
идентификатор поставщика среды выполнения (`opencode-go`), чтобы вышестоящая
маршрутизация для каждой модели работала корректно.

| Свойство                     | Значение                                           |
| ---------------------------- | -------------------------------------------------- |
| Поставщик среды выполнения   | `opencode-go`                                      |
| Аутентификация               | `OPENCODE_API_KEY` (псевдоним: `OPENCODE_ZEN_API_KEY`) |
| Родительская настройка       | [OpenCode](/ru/providers/opencode)                    |

## Начало работы

<Tabs>
  <Tab title="Интерактивный режим">
    <Steps>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Установите модель Go по умолчанию">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Проверьте доступность моделей">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Неинтерактивный режим">
    <Steps>
      <Step title="Передайте ключ напрямую">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Проверьте доступность моделей">
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

## Встроенный каталог

Выполните `openclaw models list --provider opencode-go`, чтобы получить актуальный список моделей.
Включенные строки:

| Ссылка на модель                | Название          | Контекст  | Макс. вывод | Ввод изображений |
| ------------------------------- | ----------------- | --------- | ----------- | ---------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K        | Нет              |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K        | Нет              |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768      | Нет              |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768      | Нет              |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072     | Нет              |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768      | Нет              |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536      | Да               |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536      | Да               |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144     | Да               |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000     | Да               |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000     | Нет              |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536      | Нет              |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072     | Нет              |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072     | Нет              |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536      | Да               |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536      | Да               |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536      | Нет              |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536      | Да               |

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Поведение маршрутизации">
    OpenClaw автоматически маршрутизирует любую ссылку на модель `opencode-go/...`.
    Дополнительная конфигурация поставщика не требуется.
  </Accordion>

  <Accordion title="Соглашение о ссылках среды выполнения">
    Ссылки среды выполнения остаются явными: `opencode/...` для Zen и
    `opencode-go/...` для Go. Это обеспечивает корректную вышестоящую маршрутизацию
    для каждой модели в обоих каталогах.
  </Accordion>

  <Accordion title="Общие учетные данные">
    Один ключ `OPENCODE_API_KEY` действует для каталогов Zen и Go. Ввод ключа
    во время настройки сохраняет учетные данные для обоих поставщиков среды выполнения.
  </Accordion>
</AccordionGroup>

<Tip>
Общее описание первоначальной настройки и полный справочник каталогов Zen и Go см. в разделе
[OpenCode](/ru/providers/opencode).
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="OpenCode (родительский)" href="/ru/providers/opencode" icon="server">
    Общая первоначальная настройка, обзор каталога и расширенные примечания.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при переключении после сбоя.
  </Card>
</CardGroup>
