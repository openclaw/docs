---
read_when:
    - Вам потрібно входити на сайти для автоматизації browser-а
    - Ви хочете публікувати оновлення в X/Twitter
summary: Ручні входи для автоматизації browser + публікації в X/Twitter
title: Вхід у browser
x-i18n:
    generated_at: "2026-04-23T21:13:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5a3a06e18639d4c0ffc985e2f5684df1d789450f7688fb46324169e73c65a34
    source_path: tools/browser-login.md
    workflow: 15
---

# Вхід у browser + публікація в X/Twitter

## Ручний вхід (рекомендовано)

Коли сайт вимагає входу, **увійдіть вручну** у профіль browser-а **host** (browser openclaw).

**Не** передавайте моделі свої облікові дані. Автоматизовані входи часто запускають anti-bot-захист і можуть заблокувати обліковий запис.

Назад до основної документації browser-а: [Browser](/uk/tools/browser).

## Який профіль Chrome використовується?

OpenClaw керує **виділеним профілем Chrome** (з назвою `openclaw`, із помаранчевим відтінком UI). Це окремо від вашого щоденного профілю browser-а.

Для викликів agent browser tool:

- Варіант за замовчуванням: агент має використовувати свій ізольований browser `openclaw`.
- Використовуйте `profile="user"` лише тоді, коли важливі вже наявні logged-in session і користувач перебуває за комп’ютером, щоб натиснути/схвалити будь-який attach prompt.
- Якщо у вас кілька профілів user-browser, указуйте профіль явно, а не вгадуйте.

Два прості способи отримати до нього доступ:

1. **Попросіть агента відкрити browser**, а потім увійдіть самі.
2. **Відкрийте його через CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Якщо у вас кілька профілів, передайте `--browser-profile <name>` (за замовчуванням використовується `openclaw`).

## X/Twitter: рекомендований потік

- **Читання/пошук/thread-и:** використовуйте browser **host** (ручний вхід).
- **Публікація оновлень:** використовуйте browser **host** (ручний вхід).

## Sandboxing + доступ до browser-а host

Sandboxed-сесії browser-а **з більшою ймовірністю** активують виявлення ботів. Для X/Twitter (і інших суворих сайтів) віддавайте перевагу browser-у **host**.

Якщо агент працює в sandbox, tool browser-а за замовчуванням націлюється на sandbox. Щоб дозволити керування host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Потім націльтеся на browser host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Або вимкніть sandboxing для агента, який публікує оновлення.
