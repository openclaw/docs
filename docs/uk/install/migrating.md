---
read_when:
    - Ви переносите OpenClaw на новий ноутбук/сервер
    - Ви хочете зберегти сесії, auth і входи в канали (WhatsApp тощо)
summary: Перемістити (мігрувати) встановлення OpenClaw з одного комп’ютера на інший
title: Посібник із міграції
x-i18n:
    generated_at: "2026-04-27T06:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a92c0af8d629ef58e3d60eadb0d7e9008195732513c343108b82272870222b6
    source_path: install/migrating.md
    workflow: 15
---

# Міграція OpenClaw на новий комп’ютер

Перенесіть Gateway OpenClaw на новий комп’ютер без повторного проходження onboarding.

## Що буде мігровано

Коли ви копіюєте **каталог стану** (типово `~/.openclaw/`) і ваш **workspace**, ви зберігаєте:

- **Конфігурацію** — `openclaw.json` і всі налаштування Gateway.
- **Auth** — `auth-profiles.json` для кожного агента (API-ключі та OAuth), а також будь-який стан каналів або провайдерів у `credentials/`.
- **Сесії** — історію розмов і стан агента.
- **Стан каналів** — вхід у WhatsApp, сесію Telegram тощо.
- **Файли workspace** — `MEMORY.md`, `USER.md`, Skills і prompt.

<Tip>
Запустіть `openclaw status` на старому комп’ютері, щоб підтвердити шлях до вашого каталогу стану.
Власні профілі використовують `~/.openclaw-<profile>/` або шлях, заданий через `OPENCLAW_STATE_DIR`.
</Tip>

## Кроки міграції

<Steps>
  <Step title="Зупиніть Gateway і створіть резервну копію">
    На **старому** комп’ютері зупиніть Gateway, щоб файли не змінювалися під час копіювання, а потім створіть архів:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Якщо ви використовуєте кілька профілів (наприклад, `~/.openclaw-work`), заархівуйте кожен окремо.

  </Step>

  <Step title="Встановіть OpenClaw на новому комп’ютері">
    [Встановіть](/uk/install) CLI (і Node, якщо потрібно) на новому комп’ютері.
    Нічого страшного, якщо onboarding створить новий `~/.openclaw/` — далі ви його перезапишете.
  </Step>

  <Step title="Скопіюйте каталог стану і workspace">
    Передайте архів через `scp`, `rsync -a` або зовнішній носій, а потім розпакуйте:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Переконайтеся, що приховані каталоги було включено, а власник файлів відповідає користувачу, який запускатиме Gateway.

  </Step>

  <Step title="Запустіть doctor і перевірте">
    На новому комп’ютері запустіть [Doctor](/uk/gateway/doctor), щоб застосувати міграції конфігурації та відновити сервіси:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Типові проблеми

<AccordionGroup>
  <Accordion title="Невідповідність профілю або state-dir">
    Якщо старий Gateway використовував `--profile` або `OPENCLAW_STATE_DIR`, а новий — ні,
    канали виглядатимуть як розлогінені, а сесії будуть порожніми.
    Запустіть Gateway з **тим самим** профілем або state-dir, який ви мігрували, а потім знову виконайте `openclaw doctor`.
  </Accordion>

  <Accordion title="Копіювання лише openclaw.json">
    Самого файла конфігурації недостатньо. Профілі auth моделей зберігаються в
    `agents/<agentId>/agent/auth-profiles.json`, а стан каналів/провайдерів і далі
    зберігається в `credentials/`. Завжди мігруйте **весь** каталог стану.
  </Accordion>

  <Accordion title="Права доступу і власник">
    Якщо ви копіювали як root або змінили користувача, Gateway може не змогти прочитати облікові дані.
    Переконайтеся, що каталог стану і workspace належать користувачу, який запускає Gateway.
  </Accordion>

  <Accordion title="Віддалений режим">
    Якщо ваш UI вказує на **віддалений** Gateway, віддалений хост зберігає сесії та workspace.
    Мігруйте сам хост Gateway, а не ваш локальний ноутбук. Див. [FAQ](/uk/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Секрети в резервних копіях">
    Каталог стану містить профілі auth, облікові дані каналів та інший
    стан провайдерів.
    Зберігайте резервні копії у зашифрованому вигляді, уникайте небезпечних каналів передавання та ротуйте ключі, якщо підозрюєте витік.
  </Accordion>
</AccordionGroup>

## Контрольний список перевірки

На новому комп’ютері підтвердьте:

- [ ] `openclaw status` показує, що Gateway запущено
- [ ] Канали все ще підключені (повторне pairing не потрібне)
- [ ] Dashboard відкривається і показує наявні сесії
- [ ] Файли workspace (memory, конфігурації) присутні

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Міграція Matrix](/uk/install/migrating-matrix)
- [Видалення](/uk/install/uninstall)
