---
read_when:
    - Ви хочете використовувати моделі Tencent Hy з OpenClaw
    - Вам потрібно налаштувати API-ключ TokenHub
summary: Налаштування Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T05:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Провайдер Tencent Cloud надає доступ до моделей Tencent Hy через endpoint TokenHub (`tencent-tokenhub`).

Провайдер використовує API, сумісний з OpenAI.

## Швидкий старт

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Провайдери та endpoint-и

| Провайдер          | Endpoint                      | Випадок використання    |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy через Tencent TokenHub |

## Доступні моделі

### tencent-tokenhub

- **hy3-preview** — попередня версія Hy3 (контекст 256K, міркування, за замовчуванням)

## Примітки

- Посилання моделей TokenHub використовують формат `tencent-tokenhub/<modelId>`.
- За потреби перевизначте метадані ціноутворення та контексту в `models.providers`.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
