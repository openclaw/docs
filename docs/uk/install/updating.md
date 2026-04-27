---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або вихідний код), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-27T14:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канал або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за останній stable-реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels) щодо семантики каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, якщо хочете змінити тип встановлення. Засіб оновлення зберігає ваш стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він змінює лише те, яке встановлення коду OpenClaw використовують CLI і Gateway.

```bash
# встановлення npm-пакета -> редагований git checkout
openclaw update --channel dev

# git checkout -> встановлення npm-пакета
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` гарантує git checkout, збирає його та встановлює глобальний CLI з цього checkout. Канали `stable` і `beta` використовують встановлення пакетів. Якщо Gateway уже встановлено, `openclaw update` оновлює метадані служби та перезапускає її, якщо ви не передасте `--no-restart`.

## Альтернатива: повторно запустіть інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити початкове налаштування. Щоб примусово вибрати конкретний тип встановлення через інсталятор, передайте `--install-method git --no-onboard` або `--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення npm-пакета, повторно запустіть інсталятор. Інсталятор не викликає старий засіб оновлення; він напряму запускає глобальне встановлення пакета і може відновити частково оновлене встановлення npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб зафіксувати відновлення на конкретній версії або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: вручну через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Коли `openclaw update` керує глобальним встановленням npm, він спочатку встановлює цільову версію в тимчасовий npm prefix, перевіряє інвентар запакованого `dist`, а потім підміняє чисте дерево пакета у справжньому глобальному prefix. Це запобігає накладанню нового пакета npm поверх застарілих файлів зі старого пакета. Якщо команда встановлення завершується помилкою, OpenClaw повторює спробу один раз із `--omit=optional`. Така повторна спроба допомагає на хостах, де необов’язкові нативні залежності не можуть бути скомпільовані, водночас зберігаючи початкову помилку видимою, якщо резервна спроба також завершується невдачею.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакетів лише для читання">
    OpenClaw розглядає запаковані глобальні встановлення як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний для запису поточному користувачеві. Залежності середовища виконання вбудованих Plugin розміщуються в доступному для запису каталозі середовища виконання замість зміни дерева пакета. Це не дає `openclaw update` конфліктувати з запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

    Деякі конфігурації npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему через той самий зовнішній шлях розміщення.

  </Accordion>
  <Accordion title="Посилені модулі systemd">
    Вкажіть доступний для запису каталог staging, який включено до `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` також приймає список шляхів. OpenClaw розв’язує залежності середовища виконання вбудованих Plugin зліва направо в межах перелічених коренів, розглядає попередні корені як попередньо встановлені шари лише для читання та встановлює або відновлює лише у фінальний корінь із доступом на запис:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, коли його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`. Крок відновлення розглядає цей staging як локальний корінь пакета, що належить OpenClaw, і ігнорує npm prefix користувача та глобальні налаштування, тому конфігурація npm для глобального встановлення не перенаправляє залежності середовища виконання вбудованих Plugin до `~/node_modules` або дерева глобального пакета.

  </Accordion>
  <Accordion title="Попередня перевірка вільного місця на диску">
    Перед оновленнями пакета та відновленням залежностей середовища виконання OpenClaw намагається виконати перевірку вільного місця для цільового тому в режимі best-effort. Нестача місця спричиняє попередження із перевіреним шляхом, але не блокує оновлення, оскільки файлові квоти, знімки та мережеві томи можуть змінитися після перевірки. Фактичне встановлення npm, копіювання та перевірка після встановлення залишаються авторитетними.
  </Accordion>
  <Accordion title="Залежності середовища виконання вбудованих Plugin">
    Запаковані встановлення зберігають залежності середовища виконання вбудованих Plugin поза деревом пакета лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовим значенням у вбудованому маніфесті. Сам по собі збережений стан автентифікації каналу не запускає відновлення залежностей середовища виконання під час запуску Gateway.

    Явне вимкнення має пріоритет. Для вимкненого Plugin або каналу його залежності середовища виконання не відновлюються лише тому, що він існує в пакеті. Зовнішні Plugin і користувацькі шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Автооновлювач

Автооновлювач вимкнено за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Канал  | Поведінка                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Очікує `stableDelayHours`, а потім застосовує з детермінованим jitter у межах `stableJitterHours` (поетапне розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                              |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                    |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).
Для пониження версії або відновлення після інциденту встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб заблокувати автоматичне застосування, навіть якщо налаштовано `update.auto.enabled`. Підказки про оновлення під час запуску все одно можуть працювати, якщо також не вимкнути `update.checkOnStart`.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM та стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

### Перезапустіть Gateway

```bash
openclaw gateway restart
```

### Перевірте

```bash
openclaw health
```

</Steps>

## Відкат

### Зафіксуйте версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` показує поточну опубліковану версію.
</Tip>

### Зафіксуйте коміт (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до останньої версії: `git checkout main && git pull`.

## Якщо ви не можете просунутися далі

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у вихідних checkout засіб оновлення автоматично завантажує `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap `pnpm`/corepack, встановіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі методи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції для основних версій.
