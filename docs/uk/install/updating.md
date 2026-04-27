---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-27T08:25:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a509edaeb31b65f11d6dfe8656f8d415565fa4e0ea0cb6945b7cff2958bd70d
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канал або вказати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` віддає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший stable-реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Семантику каналів див. у [Канали розробки](/uk/install/development-channels).

## Перемикання між встановленнями npm і git

Використовуйте канали, якщо хочете змінити тип встановлення. Засіб оновлення зберігає ваші
стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він лише змінює,
яке встановлення коду OpenClaw використовують CLI та Gateway.

```bash
# встановлення npm package -> редагований git checkout
openclaw update --channel dev

# git checkout -> встановлення npm package
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI
із цього checkout. Канали `stable` і `beta` використовують встановлення пакетів. Якщо
Gateway уже встановлено, `openclaw update` оновлює метадані служби
та перезапускає її, якщо ви не передасте `--no-restart`.

## Альтернатива: повторно запустіть інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити початкове налаштування. Щоб примусово вибрати конкретний тип встановлення через
інсталятор, передайте `--install-method git --no-onboard` або
`--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення npm package, повторно запустіть
інсталятор. Інсталятор не викликає старий засіб оновлення; він безпосередньо запускає глобальне
встановлення package і може відновити частково оновлене встановлення npm.

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

Коли `openclaw update` керує глобальним встановленням npm, воно спочатку запускає звичайну
команду глобального встановлення. Якщо ця команда завершується помилкою, OpenClaw повторює спробу один раз із
`--omit=optional`. Ця повторна спроба допомагає на хостах, де нативні optional dependencies
не можуть бути скомпільовані, зберігаючи видимою початкову помилку, якщо запасний варіант також
завершиться невдачею.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакетів лише для читання">
    OpenClaw розглядає глобальні встановлення пакетів як доступні лише для читання під час виконання, навіть якщо каталог глобальних пакетів доступний для запису поточному користувачу. Залежності середовища виконання вбудованих Plugin розміщуються в доступному для запису каталозі середовища виконання замість зміни дерева пакетів. Це не дає `openclaw update` конфліктувати з запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

    Деякі конфігурації npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему через той самий зовнішній шлях розміщення.

  </Accordion>
  <Accordion title="Посилені systemd unit">
    Вкажіть доступний для запису каталог staging, який входить до `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` також приймає список шляхів. OpenClaw розв’язує залежності середовища виконання вбудованих Plugin зліва направо по вказаних коренях, розглядає ранні корені як попередньо встановлені шари лише для читання та встановлює або відновлює залежності лише в останній корінь, доступний для запису:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, коли його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`. Крок відновлення розглядає цей staging як локальний корінь пакетів, яким володіє OpenClaw, і ігнорує користувацькі налаштування npm prefix та global, тому конфігурація npm для глобального встановлення не перенаправляє залежності середовища виконання вбудованих Plugin до `~/node_modules` або дерева глобальних пакетів.

  </Accordion>
  <Accordion title="Попередня перевірка дискового простору">
    Перед оновленнями пакетів і відновленням вбудованих залежностей середовища виконання OpenClaw намагається виконати best-effort перевірку дискового простору для цільового тому. Нестача місця призводить до попередження з перевіреним шляхом, але не блокує оновлення, оскільки квоти файлової системи, знімки та мережеві томи можуть змінитися після перевірки. Фактичні `npm install`, копіювання та перевірка після встановлення залишаються визначальними.
  </Accordion>
  <Accordion title="Залежності середовища виконання вбудованих Plugin">
    У пакетних встановленнях залежності середовища виконання вбудованих Plugin зберігаються поза деревом пакетів лише для читання. Під час запуску та виконання `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовим значенням у їхньому вбудованому маніфесті. Сам по собі збережений стан автентифікації каналу не запускає відновлення залежностей середовища виконання під час запуску Gateway.

    Явне вимкнення має пріоритет. Для вимкненого Plugin або каналу його залежності середовища виконання не відновлюються лише тому, що він існує в пакеті. Зовнішні Plugin і власні шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Автооновлювач

Автооновлювач вимкнений за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

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
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Очікує `stableDelayHours`, а потім застосовує з детермінованим зміщенням у межах `stableJitterHours` (поступове розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                              |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                                           |

Gateway також записує підказку про оновлення під час запуску (вимкнути можна через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Виконує міграцію конфігурації, аудит політик DM і перевіряє стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

### Зафіксувати версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` показує поточну опубліковану версію.
</Tip>

### Зафіксувати коміт (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у checkout вихідного коду засіб оновлення автоматично завантажує `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap `pnpm`/`corepack`, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі способи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції для основних версій.
