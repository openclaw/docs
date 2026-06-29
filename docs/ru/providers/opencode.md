---
read_when:
    - Вам нужен доступ к моделям, размещенным в OpenCode
    - Вы хотите выбрать между каталогами Zen и Go
summary: Используйте каталоги OpenCode Zen и Go с OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T23:39:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode предоставляет два размещенных каталога в OpenClaw:

| Каталог | Префикс           | Провайдер среды выполнения |
| ------- | ----------------- | -------------------------- |
| **Zen** | `opencode/...`    | `opencode`                 |
| **Go**  | `opencode-go/...` | `opencode-go`              |

Оба каталога используют один и тот же API-ключ OpenCode. OpenClaw оставляет идентификаторы провайдеров среды выполнения
разделенными, чтобы вышестоящая маршрутизация по моделям оставалась корректной, но первичная настройка и документация рассматривают их
как единую настройку OpenCode.

## Начало работы

<Tabs>
  <Tab title="Каталог Zen">
    **Лучше всего для:** курируемого мультимодельного прокси OpenCode (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Запустите первичную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Задайте модель Zen по умолчанию">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Проверьте, что модели доступны">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Лучше всего для:** размещенной в OpenCode линейки Kimi, GLM и MiniMax.

    <Steps>
      <Step title="Запустите первичную настройку">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

| Свойство                    | Значение                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Провайдер среды выполнения  | `opencode`                                                                                    |
| Примеры моделей             | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Свойство                    | Значение                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| Провайдер среды выполнения  | `opencode-go`                                                            |
| Примеры моделей             | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Псевдонимы API-ключа">
    `OPENCODE_ZEN_API_KEY` также поддерживается как псевдоним для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Общие учетные данные">
    Ввод одного ключа OpenCode во время настройки сохраняет учетные данные для обоих провайдеров
    среды выполнения. Вам не нужно отдельно выполнять первичную настройку каждого каталога.
  </Accordion>

  <Accordion title="Биллинг и панель управления">
    Вы входите в OpenCode, добавляете платежные данные и копируете свой API-ключ. Биллинг
    и доступность каталога управляются из панели управления OpenCode.
  </Accordion>

  <Accordion title="Поведение воспроизведения Gemini">
    Ссылки OpenCode на базе Gemini остаются на пути proxy-Gemini, поэтому OpenClaw сохраняет
    там очистку сигнатур размышлений Gemini, не включая нативную проверку воспроизведения Gemini
    или перезаписи начальной загрузки.
  </Accordion>

  <Accordion title="Поведение воспроизведения не-Gemini">
    Ссылки OpenCode не-Gemini сохраняют минимальную OpenAI-совместимую политику воспроизведения.
  </Accordion>
</AccordionGroup>

<Tip>
Ввод одного ключа OpenCode во время настройки сохраняет учетные данные как для Zen, так и для
провайдеров среды выполнения Go, поэтому первичную настройку нужно выполнить только один раз.
</Tip>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Справочник конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник конфигурации для агентов, моделей и провайдеров.
  </Card>
</CardGroup>
