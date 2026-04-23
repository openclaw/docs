---
read_when:
    - Ви переносите OpenClaw на новий ноутбук/сервер
    - Ви хочете зберегти сесії, автентифікацію та входи в канали (WhatsApp тощо)
summary: Перемістити (мігрувати) встановлення OpenClaw з однієї машини на іншу
title: Посібник з міграції
x-i18n:
    generated_at: "2026-04-23T20:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e959d559dafb92dd93f80b772591f2e7d5e5a961d85b9da5ed4eed36047592
    source_path: install/migrating.md
    workflow: 15
---

# Перенесення OpenClaw на нову машину

Цей посібник допоможе перенести Gateway OpenClaw на нову машину без повторного проходження onboarding.

## Що переноситься

Коли ви копіюєте **каталог стану** (типово `~/.openclaw/`) і свій **workspace**, ви зберігаєте:

- **Config** — `openclaw.json` і всі налаштування gateway
- **Auth** — `auth-profiles.json` для кожного агента (API-ключі + OAuth), а також будь-який стан каналів/провайдерів у `credentials/`
- **Sessions** — історію розмов і стан агента
- **Стан каналів** — вхід у WhatsApp, сесію Telegram тощо
- **Файли workspace** — `MEMORY.md`, `USER.md`, Skills і prompt

<Tip>
Запустіть `openclaw status` на старій машині, щоб підтвердити шлях до вашого каталогу стану.
Користувацькі профілі використовують `~/.openclaw-<profile>/` або шлях, заданий через `OPENCLAW_STATE_DIR`.
</Tip>

## Кроки міграції

<Steps>
  <Step title="Зупиніть gateway і створіть резервну копію">
    На **старій** машині зупиніть gateway, щоб файли не змінювалися під час копіювання, а потім створіть архів:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Якщо ви використовуєте кілька профілів (наприклад, `~/.openclaw-work`), архівуйте кожен окремо.

  </Step>

  <Step title="Установіть OpenClaw на новій машині">
    [Установіть](/uk/install) CLI (і Node за потреби) на новій машині.
    Нормально, якщо onboarding створить свіжий `~/.openclaw/` — далі ви його перезапишете.
  </Step>

  <Step title="Скопіюйте каталог стану та workspace">
    Передайте архів через `scp`, `rsync -a` або зовнішній носій, а потім розпакуйте:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Переконайтеся, що приховані каталоги були включені, а права власності на файли відповідають користувачу, який запускатиме gateway.

  </Step>

  <Step title="Запустіть doctor і перевірте">
    На новій машині запустіть [Doctor](/uk/gateway/doctor), щоб застосувати міграції config і відновити сервіси:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Поширені проблеми

<AccordionGroup>
  <Accordion title="Невідповідність профілю або state-dir">
    Якщо старий gateway використовував `--profile` або `OPENCLAW_STATE_DIR`, а новий — ні,
    канали виглядатимуть так, ніби ви вийшли з них, а сесії будуть порожні.
    Запускайте gateway з **тим самим** профілем або state-dir, який ви перенесли, а потім знову виконайте `openclaw doctor`.
  </Accordion>

  <Accordion title="Копіювання лише openclaw.json">
    Одного файла config недостатньо. Auth profiles моделей зберігаються в
    `agents/<agentId>/agent/auth-profiles.json`, а стан каналів/провайдерів усе ще
    зберігається в `credentials/`. Завжди переносіть **увесь** каталог стану.
  </Accordion>

  <Accordion title="Дозволи та власник">
    Якщо ви копіювали як root або змінили користувача, gateway може не змогти прочитати credentials.
    Переконайтеся, що каталог стану і workspace належать користувачу, який запускає gateway.
  </Accordion>

  <Accordion title="Віддалений режим">
    Якщо ваш UI вказує на **віддалений** gateway, віддалений host володіє сесіями та workspace.
    Переносити потрібно сам host gateway, а не ваш локальний ноутбук. Див. [FAQ](/uk/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Секрети в резервних копіях">
    Каталог стану містить auth profiles, credentials каналів та інший
    стан провайдерів.
    Зберігайте резервні копії в зашифрованому вигляді, уникайте небезпечних каналів передавання й ротуйтеп ключі, якщо підозрюєте витік.
  </Accordion>
</AccordionGroup>

## Контрольний список перевірки

На новій машині переконайтеся, що:

- [ ] `openclaw status` показує, що gateway запущений
- [ ] Канали все ще підключені (повторне pairing не потрібне)
- [ ] Панель керування відкривається і показує наявні сесії
- [ ] Файли workspace (memory, configs) присутні
