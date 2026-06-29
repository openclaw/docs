---
read_when:
    - Вы хотите использовать Cloudflare AI Gateway с OpenClaw
    - Необходим идентификатор учетной записи, идентификатор Gateway или переменная окружения с ключом API
summary: Настройка Cloudflare AI Gateway (аутентификация + выбор модели)
title: Gateway ИИ Cloudflare
x-i18n:
    generated_at: "2026-06-28T23:35:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway находится перед API провайдеров и позволяет добавлять аналитику, кеширование и средства управления. Для Anthropic OpenClaw использует Anthropic Messages API через вашу конечную точку Gateway.

| Свойство              | Значение                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Провайдер             | `cloudflare-ai-gateway`                                                                  |
| Базовый URL           | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Модель по умолчанию   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Ключ API              | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш ключ API провайдера для запросов через Gateway)     |

<Note>
Для моделей Anthropic, маршрутизируемых через Cloudflare AI Gateway, используйте ваш **ключ API Anthropic** как ключ провайдера.
</Note>

Когда для моделей Anthropic Messages включен режим мышления, OpenClaw удаляет завершающие
предзаполненные ходы ассистента перед отправкой полезной нагрузки через Cloudflare AI Gateway.
Anthropic отклоняет предзаполнение ответов при расширенном мышлении, тогда как обычное
предзаполнение без мышления остается доступным.

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Задайте ключ API провайдера и сведения Gateway">
    Запустите онбординг и выберите вариант аутентификации Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Будет запрошен ваш идентификатор учетной записи, идентификатор gateway и ключ API.

  </Step>
  <Step title="Задайте модель по умолчанию">
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
  <Step title="Проверьте, что модель доступна">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Неинтерактивный пример

Для скриптовых или CI-настроек передайте все значения в командной строке:

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
  <Accordion title="Аутентифицированные gateway">
    Если вы включили аутентификацию Gateway в Cloudflare, добавьте заголовок `cf-aig-authorization`. Это **дополнение к** вашему ключу API провайдера.

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
    Заголовок `cf-aig-authorization` выполняет аутентификацию в самом Cloudflare Gateway, а ключ API провайдера (например, ваш ключ Anthropic) выполняет аутентификацию у вышестоящего провайдера.
    </Tip>

  </Accordion>

  <Accordion title="Примечание об окружении">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `CLOUDFLARE_AI_GATEWAY_API_KEY` доступен этому процессу.

    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, не поможет демону launchd/systemd, если это окружение также не импортировано туда. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс gateway мог его прочитать.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие сведения об устранении неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
