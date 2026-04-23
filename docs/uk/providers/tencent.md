---
read_when:
    - Ви хочете використовувати Tencent Hy3 preview з OpenClaw
    - Вам потрібно налаштувати API key TokenHub
summary: Налаштування Tencent Cloud TokenHub для preview Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T21:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6be9c7656f210b070bdb07729fd0b6f46df0a75127d0998bd25ad3932ccc2d58
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud постачається як **вбудований provider Plugin** в OpenClaw. Він надає доступ до Tencent Hy3 preview через endpoint TokenHub (`tencent-tokenhub`).

Провайдер використовує OpenAI-compatible API.

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Default model | `tencent-tokenhub/hy3-preview`             |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | OpenAI-compatible chat completions         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Global URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Швидкий старт

<Steps>
  <Step title="Створіть API key TokenHub">
    Створіть API key у Tencent Cloud TokenHub. Якщо ви обираєте для ключа обмежену область доступу, включіть **Hy3 preview** до дозволених моделей.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Перевірте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Каталог моделей

| Model ref                      | Name                   | Input | Context | Max output | Notes                          |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ------------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | Типова; з увімкненим reasoning |

Hy3 preview — це велика MoE language model Tencent Hunyuan для reasoning, long-context instruction following, коду та agent workflows. OpenAI-compatible приклади Tencent використовують `hy3-preview` як id моделі та підтримують стандартний tool calling chat-completions плюс `reasoning_effort`.

<Tip>
ID моделі — `hy3-preview`. Не плутайте її з моделями Tencent `HY-3D-*`, які є API для генерації 3D і не є чат-моделлю OpenClaw, налаштованою цим провайдером.
</Tip>

## Перевизначення endpoint

Типово OpenClaw використовує endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent також документує міжнародний endpoint TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Перевизначайте endpoint лише тоді, коли цього вимагає ваш обліковий запис TokenHub або регіон.

## Примітки

- Model ref TokenHub використовують формат `tencent-tokenhub/<modelId>`.
- Вбудований каталог наразі містить `hy3-preview`.
- Plugin позначає Hy3 preview як таку, що підтримує reasoning і streaming-usage.
- Plugin постачається з metadata ступінчастого ціноутворення Hy3, тож оцінки вартості заповнюються без ручних перевизначень цін.
- Перевизначайте metadata ціни, контексту або endpoint у `models.providers` лише за потреби.

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY`
доступний цьому процесу (наприклад у `~/.openclaw/.env` або через
`env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Сторінка продукту Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Генерація тексту в Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Налаштування Tencent TokenHub Cline для Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Картка моделі Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
