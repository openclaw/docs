---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду) та стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-05-07T13:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип інсталяції (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канали або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`openclaw update` не приймає `--verbose`. Для діагностики оновлення використовуйте
`--dry-run`, щоб попередньо переглянути заплановані дії, `--json` для структурованих результатів або
`openclaw update status --json`, щоб перевірити канал і стан доступності. Інсталятор має власний прапорець `--verbose`, але цей прапорець не є частиною
`openclaw update`.

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, коли
тег beta відсутній або старіший за найновіший стабільний випуск. Використовуйте `--tag beta`,
якщо вам потрібен сирий npm beta dist-tag для разового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

## Перемикання між інсталяціями npm і git

Використовуйте канали, коли хочете змінити тип інсталяції. Оновлювач зберігає ваш
стан, конфігурацію, облікові дані та робочу область у `~/.openclaw`; він змінює лише те,
яку інсталяцію коду OpenClaw використовують CLI і Gateway.

```bash
# інсталяція npm package -> редагований git checkout
openclaw update --channel dev

# git checkout -> інсталяція npm package
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб попередньо переглянути точне перемикання режиму інсталяції:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI
з цього checkout. Канали `stable` і `beta` використовують інсталяції пакетів. Якщо
Gateway уже встановлено, `openclaw update` оновлює метадані сервісу
і перезапускає його, якщо ви не передасте `--no-restart`.

## Альтернатива: повторно запустіть інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Щоб примусово вибрати конкретний тип інсталяції через
інсталятор, передайте `--install-method git --no-onboard` або
`--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після фази інсталяції npm package, повторно запустіть
інсталятор. Інсталятор не викликає старий оновлювач; він напряму запускає глобальну
інсталяцію package і може відновити частково оновлену інсталяцію npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб зафіксувати відновлення на конкретній версії або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: ручне встановлення через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Надавайте перевагу `openclaw update` для керованих інсталяцій, бо він може скоординувати
заміну package із запущеним сервісом Gateway. Якщо ви оновлюєте вручну, поки
керований Gateway працює, перезапустіть Gateway одразу після завершення роботи менеджера
пакетів, щоб старий процес не продовжував обслуговувати файли із заміненого package.

Коли `openclaw update` керує глобальною інсталяцією npm, він спершу встановлює ціль у
тимчасовий npm prefix, перевіряє інвентар упакованого `dist`, а потім замінює
чисте дерево package у справжньому глобальному prefix. Це запобігає накладанню npm
нового package поверх застарілих файлів зі старого package. Якщо команда інсталяції завершується помилкою,
OpenClaw повторює спробу один раз із `--omit=optional`. Ця повторна спроба допомагає хостам, де нативні
необов’язкові залежності не можуть скомпілюватися, зберігаючи початкову помилку видимою,
якщо резервний варіант також завершується помилкою.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми інсталяції npm

<AccordionGroup>
  <Accordion title="Дерево package лише для читання">
    OpenClaw розглядає упаковані глобальні інсталяції як доступні лише для читання під час виконання, навіть коли глобальний каталог package доступний для запису поточному користувачу. Інсталяції package для Plugin розміщуються в npm/git коренях, що належать OpenClaw, під каталогом конфігурації користувача, а запуск Gateway не змінює дерево package OpenClaw.

    Деякі налаштування npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку структуру, бо команди інсталяції/оновлення Plugin записують дані поза цим глобальним каталогом package.

  </Accordion>
  <Accordion title="Посилені systemd units">
    Надайте OpenClaw доступ на запис до його коренів конфігурації/стану, щоб явні інсталяції Plugin, оновлення Plugin і очищення doctor могли зберігати свої зміни:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Попередня перевірка місця на диску">
    Перед оновленнями package і явними інсталяціями Plugin OpenClaw намагається виконати найкращу можливу перевірку місця на диску для цільового тому. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, бо квоти файлової системи, знімки та мережеві томи можуть змінитися після перевірки. Фактична інсталяція менеджером пакетів і перевірка після інсталяції залишаються авторитетними.
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

| Канал    | Поведінка                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Чекає `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (розгорнуте впровадження). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                              |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                                           |

Gateway також записує підказку про оновлення під час запуску (вимкніть за допомогою `update.checkOnStart: false`).
Для downgrade або відновлення після інциденту встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб заблокувати автоматичні застосування навіть тоді, коли налаштовано `update.auto.enabled`. Підказки про оновлення під час запуску все ще можуть виконуватися, якщо `update.checkOnStart` також не вимкнено.

Оновлення через менеджер пакетів, запитані через live handler control-plane Gateway,
примусово виконують невідкладний перезапуск оновлення без cooldown після заміни package. Це
запобігає тому, щоб старий процес у пам’яті залишався достатньо довго для lazy-load фрагментів
із дерева package, яке вже було замінене. Shell-команда `openclaw update`
залишається бажаним шляхом для керованих інсталяцій, бо вона може зупинити та
перезапустити сервіс навколо оновлення.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і перевіряє стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

### Зафіксувати commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на source checkout оновлювач автоматично bootstrap-ить `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap pnpm/corepack, встановіть `pnpm` вручну (або повторно увімкніть `corepack`) і запустіть оновлення ще раз.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд інсталяції](/uk/install): усі способи інсталяції.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції основних версій.
