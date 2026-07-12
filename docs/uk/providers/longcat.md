---
read_when:
    - Ви хочете використовувати LongCat-2.0 з OpenClaw
    - Вам потрібен ключ API LongCat або обмеження моделі
summary: Налаштування LongCat API для LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T13:37:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) надає розміщений API для LongCat-2.0 —
моделі міркування, створеної для програмування та агентних робочих навантажень. OpenClaw надає
офіційний плагін `longcat` для сумісної з OpenAI кінцевої точки LongCat.

| Властивість       | Значення                           |
| ----------------- | ---------------------------------- |
| Постачальник      | `longcat`                          |
| Автентифікація    | `LONGCAT_API_KEY`                  |
| API               | Сумісний з OpenAI Chat Completions |
| Базова URL-адреса | `https://api.longcat.chat/openai`  |
| Модель            | `longcat/LongCat-2.0`              |
| Контекст          | 1 048 576 токенів                  |
| Макс. виведення   | 131 072 токени                     |
| Вхідні дані       | Текст                              |

## Установлення плагіна

Установіть офіційний пакет, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Створіть ключ API">
    Увійдіть на [платформу API LongCat](https://longcat.chat/platform/) і
    створіть ключ на сторінці [Ключі API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Перевірте модель">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Початкове налаштування додає розміщений каталог і вибирає `longcat/LongCat-2.0`, якщо
основну модель ще не налаштовано.

### Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Поведінка міркування

LongCat надає двійкове керування процесом міркування. OpenClaw зіставляє ввімкнені рівні міркування
з `thinking: { type: "enabled" }`, а `/think off` —
з `thinking: { type: "disabled" }`. Наразі LongCat не документує
`reasoning_effort`, тому OpenClaw його не надсилає.

LongCat повертає міркування в `reasoning_content`. OpenClaw зберігає це поле
під час повторного відтворення викликів інструментів асистента, щоб багатоходові агентні сеанси
зберігали очікувану постачальником структуру повідомлень.

## Ціни

Вбудований каталог використовує ціни LongCat із оплатою за використання в доларах США за мільйон
токенів: $0.75 за некешовані вхідні дані, $0.015 за кешовані вхідні дані та $2.95 за виведення. LongCat може
пропонувати тимчасові знижки; [сторінка цін](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
і ваші платіжні записи є авторитетними джерелами.

## Самостійно розміщений LongCat-2.0

Постачальник `longcat` призначений для розміщеного API LongCat. Щоб використовувати відкриті ваги з
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), запустіть
модель у сумісному з OpenAI середовищі виконання та натомість скористайтеся наявним у OpenClaw
постачальником [vLLM](/uk/providers/vllm) або [SGLang](/uk/providers/sglang).

Зберігайте точний ідентифікатор моделі середовища виконання в каталозі самостійно розміщеного постачальника;
не спрямовуйте локальне розгортання через `longcat/LongCat-2.0`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Ключ працює в оболонці, але не в Gateway">
    Процеси Gateway, якими керує демон, не успадковують усі змінні інтерактивної оболонки.
    Додайте `LONGCAT_API_KEY` до `~/.openclaw/.env`, налаштуйте його під час
    початкового налаштування або використайте схвалене посилання на секрет.
  </Accordion>

  <Accordion title="Запити завершуються помилкою 402 або 429">
    `402` означає, що обліковий запис має недостатню квоту токенів. `429` означає, що ключ API
    досяг обмеження частоти запитів. Перевірте [використання LongCat](https://longcat.chat/platform/usage)
    і повторіть запити, обмежені за частотою, після завершення періоду очікування постачальника.
  </Accordion>

  <Accordion title="Модель не відображається">
    Запустіть `openclaw plugins list` і переконайтеся, що плагін `longcat`
    увімкнено, а потім запустіть `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Налаштування постачальника, посилання на моделі та поведінка аварійного перемикання.
  </Card>
  <Card title="Документація API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Кінцеві точки розміщеного API, автентифікація, обмеження та приклади.
  </Card>
  <Card title="Картка моделі LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Архітектура, рекомендації щодо розгортання та відомості про модель.
  </Card>
  <Card title="Секрети" href="/uk/gateway/secrets" icon="key">
    Зберігайте облікові дані постачальника, не вбудовуючи відкритий текст у конфігурацію.
  </Card>
</CardGroup>
