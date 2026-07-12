---
read_when:
    - Вы хотите использовать LongCat-2.0 с OpenClaw
    - Вам нужен ключ API LongCat или сведения об ограничениях модели
summary: Настройка API LongCat для LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T11:47:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) предоставляет размещаемый API для LongCat-2.0 — модели с поддержкой рассуждений, созданной для программирования и агентных рабочих нагрузок. OpenClaw предоставляет официальный плагин `longcat` для совместимой с OpenAI конечной точки LongCat.

| Свойство       | Значение                                  |
| -------------- | ----------------------------------------- |
| Поставщик      | `longcat`                                 |
| Аутентификация | `LONGCAT_API_KEY`                         |
| API            | Совместимый с OpenAI Chat Completions API |
| Базовый URL    | `https://api.longcat.chat/openai`         |
| Модель         | `longcat/LongCat-2.0`                     |
| Контекст       | 1 048 576 токенов                         |
| Макс. вывод    | 131 072 токена                            |
| Входные данные | Текст                                     |

## Установка плагина

Установите официальный пакет, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Создание ключа API">
    Войдите на [платформу LongCat API](https://longcat.chat/platform/) и
    создайте ключ на странице [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Запуск первоначальной настройки">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Проверка модели">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Первоначальная настройка добавляет размещаемый каталог и выбирает `longcat/LongCat-2.0`, если
основная модель ещё не настроена.

### Неинтерактивная настройка

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Поведение рассуждений

LongCat предоставляет двоичное управление размышлениями. OpenClaw сопоставляет включённые уровни размышлений
с `thinking: { type: "enabled" }`, а `/think off` —
с `thinking: { type: "disabled" }`. В настоящее время LongCat не документирует
`reasoning_effort`, поэтому OpenClaw не отправляет этот параметр.

LongCat возвращает рассуждения в поле `reasoning_content`. OpenClaw сохраняет это поле
при повторном воспроизведении ходов ассистента с вызовами инструментов, чтобы в многоходовых агентных сеансах
сохранялась ожидаемая поставщиком структура сообщений.

## Цены

Встроенный каталог использует стандартные цены LongCat с оплатой по мере использования в долларах США за миллион
токенов: $0.75 за некэшированные входные токены, $0.015 за кэшированные входные токены и $2.95 за выходные токены. LongCat может
предлагать временные скидки; актуальными источниками являются [страница с ценами](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
и ваши платёжные записи.

## Самостоятельное размещение LongCat-2.0

Поставщик `longcat` предназначен для размещаемого API LongCat. Чтобы использовать модель с открытыми весами из
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), запустите
её через совместимую с OpenAI среду выполнения и вместо этого используйте существующего поставщика OpenClaw
[vLLM](/ru/providers/vllm) или [SGLang](/ru/providers/sglang).

Сохраните точный идентификатор модели среды выполнения в каталоге самостоятельно размещаемого поставщика;
не направляйте локальное развёртывание через `longcat/LongCat-2.0`.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Ключ работает в оболочке, но не в Gateway">
    Управляемые демоном процессы Gateway наследуют не все переменные интерактивной оболочки.
    Поместите `LONGCAT_API_KEY` в `~/.openclaw/.env`, настройте его при первоначальной настройке
    или используйте разрешённую ссылку на секрет.
  </Accordion>

  <Accordion title="Запросы завершаются ошибкой 402 или 429">
    `402` означает, что у учётной записи недостаточно квоты токенов. `429` означает, что ключ API
    достиг ограничения частоты запросов. Проверьте [использование LongCat](https://longcat.chat/platform/usage)
    и повторите запросы с ограниченной частотой после завершения заданного поставщиком периода ожидания.
  </Accordion>

  <Accordion title="Модель не отображается">
    Выполните `openclaw plugins list` и убедитесь, что плагин `longcat`
    включён, затем выполните `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Настройка поставщиков, ссылки на модели и поведение при переключении после сбоя.
  </Card>
  <Card title="Документация LongCat API" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Конечные точки размещаемого API, аутентификация, ограничения и примеры.
  </Card>
  <Card title="Карточка модели LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Архитектура, рекомендации по развёртыванию и сведения о модели.
  </Card>
  <Card title="Секреты" href="/ru/gateway/secrets" icon="key">
    Хранение учётных данных поставщика без добавления открытого текста в конфигурацию.
  </Card>
</CardGroup>
