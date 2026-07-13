---
read_when:
    - Вам нужен доступ к моделям, размещённым в OpenCode
    - Вы хотите выбрать между каталогами Zen и Go
summary: Использование каталогов OpenCode Zen и Go с OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-13T18:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode предоставляет в OpenClaw два размещённых каталога:

| Каталог | Префикс            | Провайдер среды выполнения |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Оба каталога используют один ключ API OpenCode (`OPENCODE_API_KEY`, псевдоним
`OPENCODE_ZEN_API_KEY`). OpenClaw сохраняет отдельные идентификаторы провайдеров среды выполнения,
чтобы маршрутизация отдельных моделей на стороне вышестоящего сервиса оставалась корректной, но первоначальная настройка и документация
рассматривают их как единую конфигурацию OpenCode.

## Начало работы

<Tabs>
  <Tab title="Каталог Zen">
    **Лучше всего подходит для:** курируемого многомодельного прокси OpenCode (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установите модель Zen по умолчанию">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Убедитесь, что модели доступны">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Лучше всего подходит для:** размещённой в OpenCode линейки Kimi, GLM, MiniMax, Qwen и DeepSeek.

    <Steps>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установите модель Go по умолчанию">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Убедитесь, что модели доступны">
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
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Встроенные каталоги

### Zen

| Свойство         | Значение                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Провайдер среды выполнения | `opencode`                                                                                    |
| Примеры моделей   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Выполните `openclaw models list --provider opencode`, чтобы получить полный актуальный список,
который также содержит позиции бесплатного уровня, например `opencode/big-pickle` и
`opencode/deepseek-v4-flash-free`.

### Go

| Свойство         | Значение                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Провайдер среды выполнения | `opencode-go`                                                            |
| Примеры моделей   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Полную таблицу моделей Go см. в разделе [OpenCode Go](/ru/providers/opencode-go).

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Псевдонимы ключа API">
    `OPENCODE_ZEN_API_KEY` также принимается как псевдоним для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Общие учётные данные">
    При вводе одного ключа OpenCode во время настройки сохраняются учётные данные для обоих провайдеров
    среды выполнения. Отдельно выполнять первоначальную настройку каждого каталога не требуется.
  </Accordion>

  <Accordion title="Получение ключа API">
    Создайте учётную запись OpenCode и сгенерируйте ключ API на странице
    [opencode.ai/auth](https://opencode.ai/auth). Управление оплатой и доступностью
    каталогов выполняется на панели управления OpenCode.
  </Accordion>

  <Accordion title="Поведение воспроизведения Gemini">
    Ссылки OpenCode на базе Gemini остаются на пути прокси Gemini, поэтому OpenClaw сохраняет
    очистку сигнатур рассуждений Gemini, не включая собственную проверку воспроизведения Gemini
    или перезапись начальной загрузки.
  </Accordion>

  <Accordion title="Поведение воспроизведения моделей, отличных от Gemini">
    Ссылки OpenCode не на базе Gemini сохраняют минимальную политику воспроизведения, совместимую с OpenAI.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/ru/providers/opencode-go" icon="server">
    Полное справочное руководство по каталогу Go.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации агентов, моделей и провайдеров.
  </Card>
</CardGroup>
