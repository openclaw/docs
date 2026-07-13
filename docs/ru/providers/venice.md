---
read_when:
    - Вам нужен ориентированный на конфиденциальность инференс в OpenClaw
    - Вам нужны инструкции по настройке Venice AI
summary: Использование ориентированных на конфиденциальность моделей Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-13T20:14:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) предоставляет ориентированный на конфиденциальность инференс: открытые модели работают
без ведения журналов, а также доступен анонимизированный прокси-доступ к Claude, GPT, Gemini и Grok.
Все конечные точки совместимы с OpenAI (`/v1`).

## Режимы конфиденциальности

| Режим             | Поведение                                                               | Модели                                                        |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватный**     | Запросы и ответы никогда не сохраняются и не журналируются. Эфемерный.  | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored и др. |
| **Анонимизированный** | Перед перенаправлением проходят через прокси Venice с удалением метаданных. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонимизированные модели не обеспечивают полную конфиденциальность. Venice удаляет метаданные перед перенаправлением, но базовый провайдер (OpenAI, Anthropic, Google, xAI) по-прежнему обрабатывает запрос. Используйте приватные модели, когда требуется полная конфиденциальность.
</Warning>

## Начало работы

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Получите ключ API">
    1. Зарегистрируйтесь на [venice.ai](https://venice.ai)
    2. Перейдите в **Settings > API Keys > Create new key**
    3. Скопируйте ключ API (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Настройте OpenClaw">
    <Tabs>
      <Tab title="Интерактивно (рекомендуется)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Запрашивает ключ API (или повторно использует существующий `VENICE_API_KEY`), выводит список доступных моделей Venice и задаёт модель по умолчанию.
      </Tab>
      <Tab title="Переменная окружения">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Неинтерактивно">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Проверьте настройку">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Привет, ты работаешь?"
    ```
  </Step>
</Steps>

## Выбор модели

- **По умолчанию**: `venice/kimi-k2-5` (приватная, логическое рассуждение, зрение).
- **Самый мощный анонимизированный вариант**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Также можно запустить `openclaw configure` и выбрать **Провайдер модели/аутентификации > Venice AI**.

<Tip>
| Сценарий использования       | Модель                             | Почему                                            |
| ---------------------------- | ---------------------------------- | ------------------------------------------------- |
| Общение общего назначения (по умолчанию) | `kimi-k2-5`                        | Мощное приватное логическое рассуждение и зрение  |
| Лучшее общее качество        | `claude-opus-4-6`                  | Самый мощный анонимизированный вариант Venice     |
| Конфиденциальность + программирование | `qwen3-coder-480b-a35b-instruct`   | Приватная модель для программирования с большим контекстом |
| Быстро и недорого            | `qwen3-4b`                         | Облегчённая модель логического рассуждения        |
| Сложные приватные задачи     | `deepseek-v3.2`                    | Мощное логическое рассуждение; вызов инструментов отключён |
| Без цензуры                  | `venice-uncensored`                | Без ограничений на содержимое                     |
</Tip>

## Встроенный каталог (38 моделей)

<AccordionGroup>
  <Accordion title="Приватные модели (26) — полная конфиденциальность, без журналирования">
    | Идентификатор модели                    | Название                              | Контекст | Примечания                         |
    | --------------------------------------- | ------------------------------------- | -------- | ---------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k     | По умолчанию, рассуждение, зрение  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k     | Рассуждение                        |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k     | Общего назначения                  |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k     | Общего назначения                  |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k     | Общего назначения, инструменты отключены |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k     | Рассуждение                        |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k     | Общего назначения                  |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k     | Программирование                   |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k     | Программирование                   |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k     | Рассуждение, зрение                |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k     | Общего назначения                  |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k     | Зрение                             |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k      | Быстрая, рассуждение               |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k     | Рассуждение, инструменты отключены |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k      | Без цензуры, инструменты отключены |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k     | Зрение                             |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k     | Зрение                             |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k     | Общего назначения                  |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k     | Общего назначения                  |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k     | Рассуждение                        |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k     | Общего назначения                  |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k     | Рассуждение                        |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k     | Рассуждение                        |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k     | Рассуждение                        |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k     | Рассуждение                        |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k     | Рассуждение                        |
  </Accordion>

  <Accordion title="Анонимизированные модели (12) — через прокси Venice">
    | Идентификатор модели             | Название                       | Контекст | Примечания                         |
    | -------------------------------- | ------------------------------ | -------- | ---------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M       | Рассуждение, зрение                |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M     | Рассуждение, зрение                |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M       | Рассуждение, зрение                |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k     | Рассуждение, зрение, программирование |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k     | Рассуждение                        |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k     | Рассуждение, зрение, программирование |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k     | Зрение                             |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k     | Зрение                             |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M       | Рассуждение, зрение                |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k     | Рассуждение, зрение                |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k     | Рассуждение, зрение                |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M       | Рассуждение, зрение                |
  </Accordion>
</AccordionGroup>

Модели Venice на базе Grok (`grok-41-fast` и аналогичные) получают тот же патч
совместимости схемы инструментов, что и нативный провайдер xAI, поскольку они используют
одинаковый вышестоящий формат вызова инструментов.

## Обнаружение моделей

Приведённый выше встроенный каталог представляет собой начальный список на основе манифеста. Во время выполнения OpenClaw
обновляет его через API Venice `/models` и возвращается к начальному списку, если
API недоступен. Конечная точка `/models` общедоступна (для получения списка
аутентификация не требуется), но для инференса необходим действительный ключ API.

## Поведение воспроизведения DeepSeek V4

Если Venice предоставляет модели DeepSeek V4, такие как `deepseek-v4-pro` или
`deepseek-v4-flash`, OpenClaw заполняет обязательное поле воспроизведения
`reasoning_content` в сообщениях ассистента, когда Venice его пропускает, и удаляет
`thinking`/`reasoning`/`reasoning_effort` из полезной нагрузки запроса (Venice отклоняет
собственный элемент управления DeepSeek `thinking` для этих моделей). Это исправление
воспроизведения не связано с собственными элементами управления рассуждением нативного провайдера DeepSeek.

## Поддержка потоковой передачи и инструментов

| Возможность       | Поддержка                                                    |
| ----------------- | ------------------------------------------------------------ |
| Потоковая передача | Все модели                                                   |
| Вызов функций     | Большинство моделей; для отдельных моделей отключён, как указано выше |
| Зрение/изображения | Модели с пометкой «Зрение» выше                              |
| Режим JSON        | Через `response_format`                                     |

## Цены

Venice использует систему на основе кредитов. Анонимизированные модели стоят примерно столько же,
сколько прямой доступ к API, плюс небольшая комиссия Venice. Актуальные тарифы см. на странице
[venice.ai/pricing](https://venice.ai/pricing).

## Примеры использования

```bash
# Приватная модель по умолчанию
openclaw agent --model venice/kimi-k2-5 --message "Быстрая проверка работоспособности"

# Claude Opus через Venice (анонимизировано)
openclaw agent --model venice/claude-opus-4-6 --message "Кратко изложи эту задачу"

# Модель без цензуры
openclaw agent --model venice/venice-uncensored --message "Подготовь варианты"

# Модель с поддержкой зрения и изображением
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Проверь прикреплённое изображение"

# Модель для программирования
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Выполни рефакторинг этой функции"
```

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Ключ API не распознан">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Убедитесь, что ключ начинается с `vapi_`.

  </Accordion>

  <Accordion title="Модель недоступна">
    Выполните `openclaw models list --all --provider venice`, чтобы просмотреть доступные в данный момент
    модели; каталог меняется по мере добавления и вывода моделей из эксплуатации Venice.
  </Accordion>

  <Accordion title="Проблемы с подключением">
    API Venice доступен по адресу `https://api.venice.ai/api/v1`. Убедитесь, что ваша сеть разрешает HTTPS-подключения к этому узлу.
  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Пример файла конфигурации">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Главная страница Venice AI и регистрация учётной записи.
  </Card>
  <Card title="Документация API" href="https://docs.venice.ai" icon="book">
    Справочник по API Venice и документация для разработчиков.
  </Card>
  <Card title="Тарифы" href="https://venice.ai/pricing" icon="credit-card">
    Текущие расценки на кредиты Venice и тарифные планы.
  </Card>
</CardGroup>
