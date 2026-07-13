---
read_when:
    - Вы хотите использовать Cloudflare AI Gateway с OpenClaw
    - Вам нужны идентификатор учётной записи, идентификатор Gateway или переменная окружения с ключом API
summary: Настройка Cloudflare AI Gateway (аутентификация и выбор модели)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-13T18:40:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) располагается перед API провайдеров и добавляет аналитику, кэширование и средства управления. Для Anthropic OpenClaw использует Anthropic Messages API через вашу конечную точку Gateway.

| Свойство             | Значение                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Провайдер            | `cloudflare-ai-gateway`                                                                               |
| Плагин               | официальный внешний пакет (`@openclaw/cloudflare-ai-gateway-provider`)                                                   |
| Базовый URL          | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                                                                               |
| Модель по умолчанию  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                                               |
| Ключ API             | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш ключ API провайдера для запросов через Gateway)                           |

<Note>
Для моделей Anthropic, маршрутизируемых через Cloudflare AI Gateway, используйте свой **ключ API Anthropic** в качестве ключа провайдера.
</Note>

Когда для моделей Anthropic Messages включён режим рассуждений, OpenClaw удаляет последние
предзаполненные реплики ассистента перед отправкой полезной нагрузки через Cloudflare AI Gateway.
Anthropic отклоняет предзаполнение ответа при расширенном режиме рассуждений, тогда как обычное
предзаполнение без рассуждений остаётся доступным.

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Укажите ключ API провайдера и параметры Gateway">
    Запустите первоначальную настройку и выберите вариант аутентификации Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Система запросит идентификатор вашей учётной записи, идентификатор шлюза и ключ API.

  </Step>
  <Step title="Укажите модель по умолчанию">
    Добавьте модель в конфигурацию OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Пример неинтерактивной настройки

Для сценариев автоматизации или CI передайте все значения в командной строке:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Шлюзы с аутентификацией">
    Если вы включили аутентификацию Gateway в Cloudflare, добавьте заголовок `cf-aig-authorization`. Он необходим **в дополнение к** ключу API провайдера.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Заголовок `cf-aig-authorization` выполняет аутентификацию непосредственно в Cloudflare Gateway, а ключ API провайдера (например, ваш ключ Anthropic) — у вышестоящего провайдера.
    </Tip>

  </Accordion>

  <Accordion title="Примечание об окружении">
    Если Gateway работает как фоновая служба (launchd/systemd), убедитесь, что `CLOUDFLARE_AI_GATEWAY_API_KEY` доступен этому процессу.

    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, не будет доступен службе launchd/systemd, если это окружение также не импортировано в неё. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway мог его прочитать.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
