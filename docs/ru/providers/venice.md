---
read_when:
    - Вам нужен ориентированный на конфиденциальность инференс в OpenClaw
    - Вам нужны инструкции по настройке Venice AI
summary: Используйте ориентированные на конфиденциальность модели Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-06-28T23:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI предоставляет **ориентированный на приватность AI-инференс** с поддержкой моделей без цензуры и доступом к крупным проприетарным моделям через их анонимизирующий прокси. Весь инференс приватен по умолчанию — без обучения на ваших данных и без логирования.

## Зачем Venice в OpenClaw

- **Приватный инференс** для open-source моделей (без логирования).
- **Модели без цензуры**, когда они нужны.
- **Анонимизированный доступ** к проприетарным моделям (Opus/GPT/Gemini), когда важно качество.
- OpenAI-совместимые эндпоинты `/v1`.

## Режимы приватности

Venice предлагает два уровня приватности — это важно понимать при выборе модели:

| Режим            | Описание                                                                                                                            | Модели                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Приватный**    | Полностью приватный. Промпты/ответы **никогда не сохраняются и не логируются**. Эфемерный.                                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Анонимный**    | Проксируется через Venice с удалением метаданных. Базовый провайдер (OpenAI, Anthropic, Google, xAI) видит анонимизированные запросы. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Анонимные модели **не** являются полностью приватными. Venice удаляет метаданные перед пересылкой, но базовый провайдер (OpenAI, Anthropic, Google, xAI) все равно обрабатывает запрос. Выбирайте **приватные** модели, когда требуется полная приватность.
</Warning>

## Возможности

- **Ориентация на приватность**: выбирайте между режимами «приватный» (полностью приватный) и «анонимный» (через прокси)
- **Модели без цензуры**: доступ к моделям без ограничений на контент
- **Доступ к ведущим моделям**: используйте Claude, GPT, Gemini и Grok через анонимизирующий прокси Venice
- **OpenAI-совместимый API**: стандартные эндпоинты `/v1` для простой интеграции
- **Потоковая передача**: поддерживается на всех моделях
- **Вызов функций**: поддерживается на выбранных моделях (проверьте возможности модели)
- **Зрение**: поддерживается на моделях с возможностью зрения
- **Без жестких лимитов частоты**: при экстремальном использовании может применяться ограничение по принципу добросовестного использования

## Начало работы

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Get your API key">
    1. Зарегистрируйтесь на [venice.ai](https://venice.ai)
    2. Перейдите в **Settings > API Keys > Create new key**
    3. Скопируйте свой API-ключ (формат: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    Выберите предпочитаемый способ настройки:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Это:
        1. Запросит ваш API-ключ (или использует существующий `VENICE_API_KEY`)
        2. Покажет все доступные модели Venice
        3. Позволит выбрать модель по умолчанию
        4. Автоматически настроит провайдера
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Выбор модели

После настройки OpenClaw показывает все доступные модели Venice. Выбирайте исходя из своих потребностей:

- **Модель по умолчанию**: `venice/kimi-k2-5` для сильного приватного рассуждения и зрения.
- **Вариант с высокой производительностью**: `venice/claude-opus-4-6` для самого сильного анонимного пути Venice.
- **Приватность**: выбирайте «приватные» модели для полностью приватного инференса.
- **Возможности**: выбирайте «анонимные» модели, чтобы получать доступ к Claude, GPT, Gemini через прокси Venice.

Изменить модель по умолчанию можно в любое время:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Показать все доступные модели:

```bash
openclaw models list --all --provider venice
```

Также можно запустить `openclaw configure`, выбрать **Model/auth**, а затем **Venice AI**.

<Tip>
Используйте таблицу ниже, чтобы выбрать подходящую модель для вашего сценария.

| Сценарий использования     | Рекомендуемая модель              | Почему                                       |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Обычный чат (по умолчанию)** | `kimi-k2-5`                      | Сильное приватное рассуждение и зрение       |
| **Лучшее общее качество**  | `claude-opus-4-6`                | Самый сильный анонимный вариант Venice       |
| **Приватность + кодинг**   | `qwen3-coder-480b-a35b-instruct` | Приватная модель для кодинга с большим контекстом |
| **Приватное зрение**       | `kimi-k2-5`                      | Поддержка зрения без выхода из приватного режима |
| **Быстро + дешево**        | `qwen3-4b`                       | Легковесная модель рассуждения               |
| **Сложные приватные задачи** | `deepseek-v3.2`                  | Сильное рассуждение, но без поддержки инструментов Venice |
| **Без цензуры**            | `venice-uncensored`              | Без ограничений на контент                   |

</Tip>

## Поведение воспроизведения DeepSeek V4

Если Venice предоставляет модели DeepSeek V4, такие как `venice/deepseek-v4-pro` или
`venice/deepseek-v4-flash`, OpenClaw заполняет обязательный плейсхолдер воспроизведения
`reasoning_content` DeepSeek V4 в сообщениях ассистента, когда прокси
его опускает. Venice отклоняет нативный управляющий параметр верхнего уровня `thinking` DeepSeek, поэтому
OpenClaw держит это специфичное для провайдера исправление воспроизведения отдельно от нативных
элементов управления мышлением провайдера DeepSeek.

## Встроенный каталог (всего 41)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | ID модели                              | Название                            | Контекст | Возможности               |
    | -------------------------------------- | ----------------------------------- | -------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | По умолчанию, рассуждение, зрение |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Рассуждение               |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Общее назначение          |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Общее назначение          |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k     | Общее назначение, инструменты отключены |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Рассуждение               |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Общее назначение          |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Кодинг                    |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Кодинг                    |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Рассуждение, зрение       |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Общее назначение          |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Зрение                    |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Быстрая, рассуждение      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Рассуждение, инструменты отключены |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Без цензуры, инструменты отключены |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Зрение                    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Зрение                    |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Общее назначение          |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Общее назначение          |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Рассуждение               |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Общее назначение          |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Рассуждение               |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Рассуждение               |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Рассуждение               |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Рассуждение               |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Рассуждение               |
  </Accordion>

  <Accordion title="Anonymized models (12) — via Venice proxy">
    | ID модели                       | Название                       | Контекст | Возможности               |
    | ------------------------------- | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M       | Рассуждение, зрение       |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M     | Рассуждение, зрение       |
    | `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M       | Рассуждение, зрение       |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k     | Рассуждение, зрение, кодинг |
    | `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k     | Рассуждение               |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k     | Рассуждение, зрение, кодинг |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k     | Зрение                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k     | Зрение                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M       | Рассуждение, зрение       |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k     | Рассуждение, зрение       |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k     | Рассуждение, зрение       |
    | `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M       | Рассуждение, зрение       |
  </Accordion>
</AccordionGroup>

## Обнаружение моделей

OpenClaw поставляет основанный на манифесте начальный каталог Venice для списка моделей в режиме только чтения. Обновление во время выполнения по-прежнему может обнаруживать модели из API Venice и откатывается к каталогу манифеста, если API недоступен.

Эндпоинт `/models` является публичным (для списка авторизация не нужна), но для инференса требуется действительный API-ключ.

## Потоковая передача и поддержка инструментов

| Возможность          | Поддержка                                                   |
| -------------------- | ----------------------------------------------------------- |
| **Потоковая передача** | Все модели                                                  |
| **Вызов функций**    | Большинство моделей (проверьте `supportsFunctionCalling` в API) |
| **Зрение/изображения** | Модели, помеченные функцией "Vision"                       |
| **Режим JSON**       | Поддерживается через `response_format`                      |

## Цены

Venice использует систему на основе кредитов. Актуальные тарифы см. на [venice.ai/pricing](https://venice.ai/pricing):

- **Приватные модели**: как правило, ниже стоимость
- **Анонимизированные модели**: сопоставимо с ценами прямого API + небольшая комиссия Venice

### Venice (анонимизированный) и прямой API

| Аспект         | Venice (анонимизированный)        | Прямой API              |
| -------------- | --------------------------------- | ----------------------- |
| **Конфиденциальность** | Метаданные удалены, анонимизировано | Привязано к вашей учетной записи |
| **Задержка**   | +10-50 мс (прокси)               | Напрямую                |
| **Возможности** | Поддерживается большинство функций | Полный набор функций    |
| **Оплата**     | Кредиты Venice                    | Оплата у провайдера     |

## Примеры использования

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Устранение неполадок

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Убедитесь, что ключ начинается с `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    Каталог моделей Venice обновляется динамически. Выполните `openclaw models list`, чтобы увидеть модели, доступные сейчас. Некоторые модели могут быть временно недоступны.
  </Accordion>

  <Accordion title="Connection issues">
    API Venice находится по адресу `https://api.venice.ai/api/v1`. Убедитесь, что ваша сеть разрешает HTTPS-подключения.
  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Главная страница Venice AI и регистрация учетной записи.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Справочник Venice API и документация для разработчиков.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Актуальные кредитные тарифы и планы Venice.
  </Card>
</CardGroup>
