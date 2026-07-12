---
read_when:
    - Ви хочете використовувати OpenClaw із моделями NovitaAI
    - Вам потрібні ідентифікатор провайдера Novita, ключ або кінцева точка
summary: Використовуйте сумісний з OpenAI API від NovitaAI разом з OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T13:37:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI — це постачальник розміщеної інфраструктури ШІ з API, сумісним з OpenAI.
Він постачається як вбудований постачальник OpenClaw (окреме встановлення плагіна не потрібне), тому
облікові дані проходять через стандартний процес автентифікації моделей, а посилання на моделі мають такий вигляд:
`novita/deepseek/deepseek-v3-0324`.

## Налаштування

Створіть ключ API на сторінці [novita.ai/settings/key-management](https://novita.ai/settings/key-management), а потім виконайте:

```bash
openclaw onboard --auth-choice novita-api-key
```

Або задайте:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Типові значення

| Параметр               | Значення                           |
| ---------------------- | ---------------------------------- |
| Ідентифікатор постачальника | `novita`                      |
| Псевдоніми             | `novita-ai`, `novitaai`            |
| Базова URL-адреса      | `https://api.novita.ai/openai/v1`  |
| Змінна середовища      | `NOVITA_API_KEY`                   |
| Типова модель          | `novita/deepseek/deepseek-v3-0324` |

## Вбудований каталог моделей

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Це початковий перелік, а не каталог, що оновлюється в реальному часі. Ваш обліковий запис, регіон або
поточна пропозиція Novita можуть додавати, вилучати чи обмежувати маршрути. Перевірте їх перед
встановленням довгострокової типової моделі:

```bash
openclaw models list --provider novita
```

## Коли варто вибрати Novita

- Доступ до розміщених моделей із відкритими вагами через API, сумісний з OpenAI.
- Маршрути до моделей сімейств DeepSeek, Kimi, MiniMax, GLM або Qwen через єдиний обліковий запис
  постачальника.
- Ще один резервний шлях до розміщених моделей поряд із DeepInfra, GMI, OpenRouter або прямими
  API постачальників.
- Розміщення моделей на стороні постачальника замість підтримки інфраструктури LM Studio, Ollama,
  SGLang або vLLM.

Виберіть прямого постачальника виробника, якщо вам потрібні власні параметри запитів
виробника або договори підтримки. Виберіть локального постачальника, якщо модель має
працювати на вашому обладнанні або в межах вашої мережі.

## Усунення несправностей

- `401`/`403`: перевірте ключ на сторінці керування ключами Novita та повторно виконайте
  `openclaw onboard --auth-choice novita-api-key`, якщо збережений профіль
  застарів.
- Помилки невідомої моделі: використовуйте точне значення `novita/<route-id>`, повернуте командою
  `openclaw models list --provider novita`.
- Повільні або несправні маршрути: спробуйте інший маршрут моделі Novita або налаштуйте Novita як
  резервного постачальника для робочих навантажень, що допускають відмінності, характерні для
  конкретного постачальника.

## Пов’язані матеріали

- [Постачальники моделей](/uk/concepts/model-providers)
- [Каталог постачальників](/uk/providers/index)
