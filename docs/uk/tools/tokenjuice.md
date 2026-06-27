---
read_when:
    - Ви хочете коротші результати інструментів `exec` або `bash` в OpenClaw
    - Ви хочете встановити або ввімкнути Plugin Tokenjuice
    - Потрібно розуміти, що tokenjuice змінює, а що залишає необробленим
summary: Стискайте зашумлені результати інструментів exec і bash за допомогою необов’язкового Plugin Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:29:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` — це необов’язковий зовнішній plugin, який стискає шумні результати інструментів `exec` і `bash` після того, як команда вже виконалася.

Він змінює повернений `tool_result`, а не саму команду. Tokenjuice не переписує введення shell, не запускає команди повторно й не змінює коди завершення.

Наразі це застосовується до вбудованих запусків OpenClaw і динамічних інструментів OpenClaw в обв’язці app-server Codex. Tokenjuice підключається до проміжного ПЗ результатів інструментів OpenClaw і скорочує вивід перед тим, як він повертається в активний сеанс обв’язки.

## Увімкнення plugin

Установіть один раз:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Потім увімкніть його:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Еквівалентно:

```bash
openclaw plugins enable tokenjuice
```

Якщо ви віддаєте перевагу прямому редагуванню конфігурації:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Що змінює tokenjuice

- Стискає шумні результати `exec` і `bash`, перш ніж вони передаються назад у сеанс.
- Залишає початкове виконання команди без змін.
- Зберігає точні читання вмісту файлів та інші команди, які tokenjuice має залишати необробленими.
- Залишається opt-in: вимкніть plugin, якщо хочете всюди отримувати дослівний вивід.

## Перевірка роботи

1. Увімкніть plugin.
2. Запустіть сеанс, який може викликати `exec`.
3. Виконайте шумну команду, наприклад `git status`.
4. Перевірте, що повернений результат інструмента коротший і структурованіший за необроблений вивід shell.

## Вимкнення plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Або:

```bash
openclaw plugins disable tokenjuice
```

## Пов’язане

- [Інструмент Exec](/uk/tools/exec)
- [Рівні мислення](/uk/tools/thinking)
- [Рушій контексту](/uk/concepts/context-engine)
