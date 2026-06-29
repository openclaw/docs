---
read_when:
    - Вы хотите использовать Together AI с OpenClaw
    - Вам нужна переменная окружения с API-ключом или выбор аутентификации CLI
summary: Настройка Together AI (аутентификация + выбор модели)
title: Together AI
x-i18n:
    generated_at: "2026-06-28T23:40:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) предоставляет доступ к ведущим open-source
моделям, включая Llama, DeepSeek, Kimi и другие, через единый API.

| Свойство | Значение                      |
| -------- | ----------------------------- |
| Провайдер | `together`                    |
| Аутентификация | `TOGETHER_API_KEY`            |
| API      | Совместимо с OpenAI           |
| Базовый URL | `https://api.together.xyz/v1` |

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустите настройку">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Задайте модель по умолчанию">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Неинтерактивный пример

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Предустановка настройки задает
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` как модель по умолчанию.
</Note>

## Встроенный каталог

OpenClaw поставляется со следующим встроенным каталогом Together:

| Ссылка на модель                                  | Название                     | Ввод        | Контекст | Примечания           |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | текст       | 131,072 | Модель по умолчанию  |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | текст, изображение | 262,144 | Модель Kimi для рассуждений |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | текст       | 512,000 | Текстовая модель для рассуждений |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | текст       | 32,768  | Быстрая текстовая модель |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | текст       | 202,752 | Текстовая модель для рассуждений |

## Генерация видео

Встроенный Plugin `together` также регистрирует генерацию видео через
общий инструмент `video_generate`.

| Свойство             | Значение                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Модель видео по умолчанию | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Режимы               | text-to-video; только референс по одному изображению с `Wan-AI/Wan2.2-I2V-A14B` |
| Поддерживаемые параметры | `aspectRatio`, `resolution`                                              |

Чтобы использовать Together как провайдера видео по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
См. [Генерация видео](/ru/tools/video-generation), чтобы узнать об общих параметрах инструмента,
выборе провайдера и поведении failover.
</Tip>

<AccordionGroup>
  <Accordion title="Примечание об окружении">
    Если Gateway работает как daemon (launchd/systemd), убедитесь, что
    `TOGETHER_API_KEY` доступен этому процессу (например, в
    `~/.openclaw/.env` или через `env.shellEnv`).

    <Warning>
    Ключи, заданные только в вашей интерактивной оболочке, не видны процессам
    Gateway, управляемым daemon. Используйте конфигурацию `~/.openclaw/.env` или
    `env.shellEnv` для постоянной доступности.
    </Warning>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Проверьте, что ваш ключ работает: `openclaw models list --provider together`
    - Если модели не отображаются, подтвердите, что ключ API задан в правильном
      окружении для вашего процесса Gateway.
    - Ссылки на модели используют форму `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Правила провайдеров, ссылки на модели и поведение failover.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента генерации видео и выбор провайдера.
  </Card>
  <Card title="Справочник конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель управления Together AI, документация API и цены.
  </Card>
</CardGroup>
