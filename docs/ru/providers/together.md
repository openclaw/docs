---
read_when:
    - Вы хотите использовать Together AI с OpenClaw
    - Вам нужна переменная окружения с ключом API или выбор аутентификации в CLI
summary: Настройка Together AI (аутентификация + выбор модели)
title: Together AI
x-i18n:
    generated_at: "2026-07-13T18:43:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) предоставляет доступ к ведущим моделям с открытым исходным кодом,
включая Llama, DeepSeek, Kimi и другие, через единый API.
OpenClaw включает его как провайдера `together`.

| Свойство | Значение                      |
| -------- | ----------------------------- |
| Провайдер | `together`                    |
| Аутентификация | `TOGETHER_API_KEY`            |
| API      | Совместимый с OpenAI          |
| Базовый URL | `https://api.together.xyz/v1` |

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на странице
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустите первоначальную настройку">
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

### Пример неинтерактивной настройки

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
При первоначальной настройке `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` задаётся как
модель по умолчанию.
</Note>

## Встроенный каталог

Стоимость указана в долларах США за миллион токенов.

| Ссылка на модель                                   | Название                     | Входные данные | Контекст | Макс. вывод | Стоимость (ввод/вывод) | Примечания                |
| -------------------------------------------------- | ---------------------------- | ------------- | -------- | ----------- | ---------------------- | ------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | текст         | 131,072  | 8,192       | 0.88 / 0.88            | Модель по умолчанию       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | текст, изображение | 262,144 | 32,768  | 1.20 / 4.50            | Модель с рассуждениями    |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | текст         | 512,000  | 8,192       | 2.10 / 4.40            | Модель с рассуждениями    |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | текст         | 32,768   | 8,192       | 0.30 / 0.30            | Быстрая, без рассуждений  |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | текст         | 202,752  | 8,192       | 1.40 / 4.40            | Модель с рассуждениями    |

## Генерация видео

Встроенный плагин `together` также регистрирует генерацию видео через
общий инструмент `video_generate`.

| Свойство                | Значение                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Модель видео по умолчанию | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| Другие модели           | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                    |
| Режимы                  | текст в видео; изображение в видео — только с `Wan-AI/Wan2.2-I2V-A14B` (одно референсное изображение) |
| Длительность            | 1-10 секунд                                                                               |
| Поддерживаемые параметры | `size` (разбирается как `<width>x<height>`); `aspectRatio`/`resolution` не считываются            |

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
Сведения об общих параметрах инструмента, выборе провайдера и поведении при
переключении после сбоя см. в разделе [Генерация видео](/ru/tools/video-generation).
</Tip>

<AccordionGroup>
  <Accordion title="Примечание об окружении">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что
    `TOGETHER_API_KEY` доступен этому процессу (например, в
    `~/.openclaw/.env` или через `env.shellEnv`).

    <Warning>
    Ключи, заданные только в интерактивной оболочке, недоступны процессам
    Gateway, управляемым демоном. Для постоянной доступности используйте
    конфигурацию `~/.openclaw/.env` или `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Проверьте, работает ли ваш ключ: `openclaw models list --provider together`
    - Если модели не отображаются, убедитесь, что ключ API задан в правильном
      окружении процесса Gateway.
    - Ссылки на модели имеют формат `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Правила провайдеров, ссылки на модели и поведение при переключении после сбоя.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Параметры общего инструмента генерации видео и выбор провайдера.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель управления Together AI, документация API и цены.
  </Card>
</CardGroup>
