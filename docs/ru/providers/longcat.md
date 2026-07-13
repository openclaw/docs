---
read_when:
    - Вы хотите использовать LongCat-2.0 с OpenClaw
    - Вам нужен ключ API LongCat или ограничения модели
summary: Настройка LongCat API для LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-13T18:30:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) предоставляет размещённый API для LongCat-2.0 —
модели рассуждений, предназначенной для задач программирования и агентных
рабочих нагрузок. OpenClaw предоставляет официальный плагин
`longcat` для совместимой с OpenAI конечной точки LongCat.

| Свойство           | Значение                                  |
| ------------------ | ----------------------------------------- |
| Провайдер          | `longcat`                        |
| Аутентификация     | `LONGCAT_API_KEY`                        |
| API                | Совместимый с OpenAI Chat Completions     |
| Базовый URL        | `https://api.longcat.chat/openai`                        |
| Модель             | `longcat/LongCat-2.0`                        |
| Контекст           | 1,048,576 токенов                         |
| Максимальный вывод | 131,072 токенов                           |
| Входные данные     | Текст                                     |

## Установка плагина

Установите официальный пакет, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Создайте ключ API">
    Войдите на [платформу LongCat API](https://longcat.chat/platform/) и
    создайте ключ на странице [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Проверьте модель">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Первоначальная настройка добавляет размещённый каталог и выбирает
`longcat/LongCat-2.0`, если основная модель ещё не настроена.

### Неинтерактивная настройка

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Поведение рассуждений

LongCat предоставляет двоичное управление рассуждениями. OpenClaw сопоставляет
включённые уровни рассуждений с `thinking: { type: "enabled" }`, а `/think off` — с
`thinking: { type: "disabled" }`. В настоящее время LongCat не документирует
`reasoning_effort`, поэтому OpenClaw не отправляет этот параметр.

LongCat возвращает рассуждения в `reasoning_content`. OpenClaw сохраняет это
поле при повторном воспроизведении ходов ассистента с вызовами инструментов,
чтобы многоходовые агентные сеансы сохраняли ожидаемую провайдером структуру
сообщений.

## Цены

Встроенный каталог использует цены LongCat с оплатой по мере использования в
долларах США за миллион токенов: $0.75 за некэшированный ввод, $0.015 за
кэшированный ввод и $2.95 за вывод. LongCat может предлагать временные скидки;
актуальными источниками являются [страница с ценами](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
и ваши платёжные документы.

## Самостоятельно размещённый LongCat-2.0

Провайдер `longcat` предназначен для размещённого API LongCat. Чтобы
использовать открытые веса с
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), разверните
модель в среде выполнения, совместимой с OpenAI, и вместо этого используйте
существующий провайдер OpenClaw [vLLM](/ru/providers/vllm) или
[SGLang](/ru/providers/sglang).

Сохраните точный идентификатор модели среды выполнения в каталоге
самостоятельно размещённого провайдера; не направляйте локальное развёртывание
через `longcat/LongCat-2.0`.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Ключ работает в командной оболочке, но не в Gateway">
    Процессы Gateway, управляемые демоном, наследуют не все переменные
    интерактивной командной оболочки. Поместите `LONGCAT_API_KEY` в
    `~/.openclaw/.env`, настройте его при первоначальной настройке или
    используйте разрешённую ссылку на секрет.
  </Accordion>

  <Accordion title="Запросы завершаются ошибкой 402 или 429">
    `402` означает, что учётной записи не хватает квоты токенов.
    `429` означает, что ключ API достиг ограничения частоты
    запросов. Проверьте [использование LongCat](https://longcat.chat/platform/usage)
    и повторите запросы с ограниченной частотой после окончания заданного
    провайдером периода ожидания.
  </Accordion>

  <Accordion title="Модель не отображается">
    Выполните `openclaw plugins list` и убедитесь, что плагин
    `longcat` включён, затем выполните `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Настройка провайдеров, ссылки на модели и поведение при переключении после сбоя.
  </Card>
  <Card title="Документация LongCat API" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Конечные точки размещённого API, аутентификация, ограничения и примеры.
  </Card>
  <Card title="Карточка модели LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Архитектура, рекомендации по развёртыванию и сведения о модели.
  </Card>
  <Card title="Секреты" href="/ru/gateway/secrets" icon="key">
    Хранение учётных данных провайдера без добавления открытого текста в конфигурацию.
  </Card>
</CardGroup>
