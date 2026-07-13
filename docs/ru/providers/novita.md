---
read_when:
    - Вы хотите использовать OpenClaw с моделями NovitaAI
    - Вам нужен идентификатор, ключ или конечная точка провайдера Novita
summary: Используйте совместимый с OpenAI API NovitaAI вместе с OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-13T18:30:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI — это поставщик размещённой инфраструктуры ИИ с API, совместимым с OpenAI.
Он поставляется как встроенный провайдер OpenClaw (устанавливать отдельный плагин не нужно), поэтому
учётные данные проходят через стандартный процесс аутентификации моделей, а ссылки на модели выглядят как
`novita/deepseek/deepseek-v3-0324`.

## Настройка

Создайте ключ API на странице [novita.ai/settings/key-management](https://novita.ai/settings/key-management), затем выполните:

```bash
openclaw onboard --auth-choice novita-api-key
```

Или задайте:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Значения по умолчанию

| Параметр             | Значение                           |
| -------------------- | ---------------------------------- |
| Идентификатор провайдера | `novita`                           |
| Псевдонимы           | `novita-ai`, `novitaai`            |
| Базовый URL          | `https://api.novita.ai/openai/v1`  |
| Переменная окружения | `NOVITA_API_KEY`                   |
| Модель по умолчанию  | `novita/deepseek/deepseek-v3-0324` |

## Встроенный каталог моделей

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Это отправная точка, а не актуальный каталог. В зависимости от вашей учётной записи, региона или
текущего предложения Novita маршруты могут добавляться, удаляться или ограничиваться. Проверьте их перед
настройкой долгосрочного значения по умолчанию:

```bash
openclaw models list --provider novita
```

## Когда стоит выбрать Novita

- Доступ к размещённым моделям с открытыми весами через API, совместимый с OpenAI.
- Маршруты к семействам DeepSeek, Kimi, MiniMax, GLM или Qwen через единую учётную запись
  провайдера.
- Ещё один размещённый резервный вариант наряду с DeepInfra, GMI, OpenRouter или прямыми
  API поставщиков.
- Размещение моделей на стороне провайдера вместо обслуживания инфраструктуры LM Studio, Ollama,
  SGLang или vLLM.

Выберите прямого провайдера поставщика, если вам нужны собственные параметры запросов
этого поставщика или договоры поддержки. Выберите локального провайдера, если модель должна
работать на вашем оборудовании или в пределах вашей сети.

## Устранение неполадок

- `401`/`403`: проверьте ключ на странице управления ключами Novita и повторно выполните
  `openclaw onboard --auth-choice novita-api-key`, если сохранённый профиль
  устарел.
- Ошибки неизвестной модели: используйте точное значение `novita/<route-id>`, возвращённое командой
  `openclaw models list --provider novita`.
- Медленные или неработающие маршруты: попробуйте другой маршрут модели Novita или настройте Novita как
  резервного провайдера для рабочих нагрузок, допускающих различия,
  обусловленные особенностями провайдера.

## См. также

- [Провайдеры моделей](/ru/concepts/model-providers)
- [Каталог провайдеров](/ru/providers/index)
