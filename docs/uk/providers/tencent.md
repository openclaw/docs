---
read_when:
    - Ви хочете використовувати моделі Tencent Hy з OpenClaw
    - Вам потрібен API-ключ TokenHub або налаштування Token Plan (LKEAP)
summary: Налаштування Tencent Cloud TokenHub і Token Plan (окремі ключі)
title: Tencent Cloud (TokenHub + Token Plan)
x-i18n:
    generated_at: "2026-04-22T05:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0f04fcfcb6e14b17c3bc8f3c7ca3f20f8dabfaa89813a0566c0672439d4afff
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub + Token Plan)

Провайдер Tencent Cloud надає доступ до моделей Tencent Hy через два ендпоїнти
з окремими API-ключами:

- **TokenHub** (`tencent-tokenhub`) — виклик Hy через Tencent TokenHub Gateway
- **Token Plan** (`tencent-token-plan`) — виклик Hy через ендпоїнт
  Token Plan у LKEAP

Обидва провайдери використовують API, сумісні з OpenAI.

## Швидкий старт

TokenHub:

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

Token Plan:

```bash
openclaw onboard --auth-choice tencent-token-plan-api-key
```

## Неінтерактивний приклад

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# Token Plan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tencent-token-plan-api-key \
  --tencent-token-plan-api-key "$LKEAP_API_KEY" \
  --skip-health \
  --accept-risk
```

## Провайдери та ендпоїнти

| Провайдер            | Ендпоїнт                              | Випадок використання    |
| -------------------- | ------------------------------------- | ----------------------- |
| `tencent-tokenhub`   | `tokenhub.tencentmaas.com/v1`         | Hy через Tencent TokenHub |
| `tencent-token-plan` | `api.lkeap.cloud.tencent.com/plan/v3` | Hy через LKEAP Token Plan |

Кожен провайдер використовує власний API-ключ. Налаштування реєструє лише вибраний провайдер.

## Доступні моделі

### tencent-tokenhub

- **hy3-preview** — попередня версія Hy3 (контекст 256K, міркування, за замовчуванням)

### tencent-token-plan

- **hy3-preview** — попередня версія Hy3 (контекст 256K, міркування, за замовчуванням)

## Примітки

- Посилання на моделі TokenHub використовують `tencent-tokenhub/<modelId>`. Посилання на моделі Token Plan
  використовують `tencent-token-plan/<modelId>`.
- За потреби перевизначте метадані ціноутворення та контексту в `models.providers`.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY`
або `LKEAP_API_KEY` доступний для цього процесу (наприклад, у
`~/.openclaw/.env` або через `env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
- [Tencent Token Plan API](https://cloud.tencent.com/document/product/1823/130060)
