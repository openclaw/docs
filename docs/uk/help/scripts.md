---
read_when:
    - Запуск скриптів із репозиторію
    - Додавання або зміна скриптів у ./scripts
summary: 'Скрипти репозиторію: призначення, область дії та примітки щодо безпеки'
title: Скрипти
x-i18n:
    generated_at: "2026-04-23T20:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 839a6d9832988fcdb4b617935ebcfbc55c18b062b42a9480181963d07a952605
    source_path: help/scripts.md
    workflow: 15
---

Каталог `scripts/` містить допоміжні скрипти для локальних workflow і ops-завдань.
Використовуйте їх, коли завдання явно прив’язане до скрипта; в інших випадках віддавайте перевагу CLI.

## Умовності

- Скрипти **необов’язкові**, якщо на них немає посилань у документації чи release checklist.
- Віддавайте перевагу поверхням CLI, коли вони існують (приклад: моніторинг auth використовує `openclaw models status --check`).
- Вважайте, що скрипти специфічні для хоста; перед запуском на новій машині прочитайте їх.

## Скрипти моніторингу auth

Моніторинг auth описано в [Authentication](/uk/gateway/authentication). Скрипти в `scripts/` — це необов’язкові додатки для workflow systemd/Termux phone.

## Helper для читання GitHub

Використовуйте `scripts/gh-read`, коли хочете, щоб `gh` використовував installation token GitHub App для викликів читання в межах репозиторію, залишаючи звичайний `gh` на вашому особистому вході для записувальних дій.

Обов’язкові env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Необов’язкові env:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, якщо ви хочете пропустити пошук installation за репозиторієм
- `OPENCLAW_GH_READ_PERMISSIONS` як перевизначення підмножини дозволів для читання у вигляді рядка, розділеного комами

Порядок розв’язання репозиторію:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Приклади:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Додавання скриптів

- Тримайте скрипти сфокусованими та задокументованими.
- Додайте короткий запис у відповідну документацію (або створіть його, якщо його бракує).
