---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або вихідний код), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-26T23:29:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ce89a768e26a5b8775794180e0f23da63040205507b0f6013210bdaafdd4856
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

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший stable-реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для разового оновлення пакета.

Перегляньте [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, якщо хочете змінити тип встановлення. Засіб оновлення зберігає ваш стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він змінює лише те, який код OpenClaw використовують CLI і Gateway.

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

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI із цього checkout. Канали `stable` і `beta` використовують встановлення пакета. Якщо Gateway уже встановлено, `openclaw update` оновлює метадані сервісу й перезапускає його, якщо ви не передали `--no-restart`.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити початкове налаштування. Щоб примусово вибрати конкретний тип встановлення через інсталятор, передайте `--install-method git --no-onboard` або `--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення npm package, повторно запустіть інсталятор. Інсталятор не викликає старий засіб оновлення; він напряму виконує глобальне встановлення пакета й може відновити частково оновлене npm-встановлення.

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

Коли `openclaw update` керує глобальним npm-встановленням, він спочатку виконує звичайну команду глобального встановлення. Якщо ця команда завершується помилкою, OpenClaw повторює спробу один раз із `--omit=optional`. Така повторна спроба допомагає на хостах, де нативні optional залежності не можуть бути скомпільовані, водночас зберігаючи видимою початкову помилку, якщо запасний варіант також завершується невдачею.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Глобальні npm-встановлення та залежності середовища виконання

OpenClaw розглядає глобальні пакетні встановлення як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний для запису поточному користувачу. Вбудовані залежності середовища виконання Plugin розміщуються в каталозі середовища виконання з можливістю запису замість зміни дерева пакета. Це не дає `openclaw update` конфліктувати із запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

Деякі конфігурації npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таке компонування через той самий зовнішній шлях проміжного розміщення.

Для захищених systemd unit задайте каталог проміжного розміщення з можливістю запису, який включено до `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, якщо його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`.
Крок відновлення розглядає цей проміжний каталог як локальний корінь пакета, яким керує OpenClaw, і ігнорує користувацькі налаштування npm prefix/global, тому конфігурація npm для глобального встановлення не перенаправляє вбудовані залежності Plugin середовища виконання до `~/node_modules` або дерева глобального пакета.

Перед оновленнями пакетів і відновленням вбудованих залежностей середовища виконання OpenClaw намагається виконати перевірку вільного місця на диску для цільового тому в режимі best-effort. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки квоти файлової системи, знімки та мережеві томи можуть змінитися після перевірки. Фактичне встановлення npm, копіювання та перевірка після встановлення залишаються авторитетними.

### Вбудовані залежності середовища виконання Plugin

Пакетні встановлення тримають вбудовані залежності середовища виконання Plugin поза деревом пакета, доступним лише для читання. Під час запуску і в ході `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовим значенням у своєму вбудованому маніфесті.
Лише збережений стан автентифікації каналу сам по собі не запускає відновлення залежностей середовища виконання під час старту Gateway.

Явне вимкнення має пріоритет. Вимкнений Plugin або канал не отримає відновлення своїх залежностей середовища виконання лише тому, що він існує в пакеті. Зовнішні Plugin і власні шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

## Auto-updater

Auto-updater вимкнено за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

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

| Канал | Поведінка |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Очікує `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (поетапне розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно. |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну. |

Gateway також записує підказку про оновлення під час запуску (вимкнути можна через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

Порада: `npm view openclaw version` показує поточну опубліковану версію.

### Зафіксувати коміт (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до останньої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у source checkout засіб оновлення автоматично завантажує `pnpm` за потреби. Якщо ви бачите помилку bootstrap для pnpm/corepack, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Doctor](/uk/gateway/doctor) — перевірки стану після оновлень
- [Міграція](/uk/install/migrating) — посібники з міграції між основними версіями
