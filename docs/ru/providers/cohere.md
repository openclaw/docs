---
read_when:
    - Вы хотите использовать Cohere с OpenClaw
    - Вам нужна переменная окружения с API-ключом Cohere или выбранный способ аутентификации CLI
summary: Настройка Cohere (аутентификация + выбор модели)
title: Cohere
x-i18n:
    generated_at: "2026-06-28T23:35:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) предоставляет OpenAI-совместимый инференс через свой Compatibility API. OpenClaw поставляет провайдер Cohere во время перехода к внешнему пакету, а также публикует его как официальный внешний Plugin с каталогом моделей Command A.

| Свойство                | Значение                                             |
| --------------- | ---------------------------------------------------- |
| Идентификатор провайдера | `cohere`                                             |
| Plugin          | встроен на время перехода; официальный внешний пакет |
| Переменная окружения для аутентификации | `COHERE_API_KEY`                                     |
| Флаг онбординга | `--auth-choice cohere-api-key`                       |
| Прямой флаг CLI | `--cohere-api-key <key>`                             |
| API             | OpenAI-совместимый (`openai-completions`)             |
| Базовый URL     | `https://api.cohere.ai/compatibility/v1`             |
| Модель по умолчанию | `cohere/command-a-03-2025`                           |

## Начало работы

1. Cohere включен в текущие пакеты OpenClaw. Если он недоступен, установите внешний пакет и перезапустите Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Создайте ключ API Cohere.
3. Запустите онбординг:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Убедитесь, что каталог доступен:

```bash
openclaw models list --provider cohere
```

Модель по умолчанию задается только если основная модель еще не настроена.

## Настройка только через окружение

Сделайте `COHERE_API_KEY` доступной для процесса Gateway, затем выберите модель Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Если Gateway работает как демон или в Docker, настройте `COHERE_API_KEY` для этой службы. Экспорт только в интерактивной оболочке не делает ее доступной для уже запущенного Gateway.
</Note>

## См. также

- [Провайдеры моделей](/ru/concepts/model-providers)
- [CLI моделей](/ru/cli/models)
- [Каталог провайдеров](/ru/providers)
