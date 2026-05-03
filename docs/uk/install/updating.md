---
read_when:
    - Оновлення OpenClaw
    - Щось перестало працювати після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-05-03T20:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип вашого встановлення (npm або git), отримує останню версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канали або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` не приймає `--verbose`. Для діагностики оновлення використовуйте
`--dry-run`, щоб переглянути заплановані дії, `--json` для структурованих результатів або
`openclaw update status --json`, щоб перевірити канал і стан доступності.
Інсталятор має власний прапорець `--verbose`, але цей прапорець не є частиною
`openclaw update`.

`--channel beta` віддає перевагу beta, але середовище виконання повертається до stable/latest, коли
тег beta відсутній або старіший за останній стабільний реліз. Використовуйте `--tag beta`,
якщо вам потрібен необроблений npm beta dist-tag для одноразового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels) для семантики каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, коли потрібно змінити тип встановлення. Засіб оновлення зберігає ваші
стан, конфігурацію, облікові дані й робочий простір у `~/.openclaw`; він змінює лише те,
яке встановлення коду OpenClaw використовують CLI і Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI
з цього checkout. Канали `stable` і `beta` використовують встановлення пакетів. Якщо
Gateway уже встановлено, `openclaw update` оновлює метадані служби
та перезапускає її, якщо ви не передали `--no-restart`.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Щоб примусово вибрати конкретний тип встановлення через
інсталятор, передайте `--install-method git --no-onboard` або
`--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення пакета npm, повторно запустіть
інсталятор. Інсталятор не викликає старий засіб оновлення; він запускає глобальне
встановлення пакета напряму й може відновити частково оновлене встановлення npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб закріпити відновлення на конкретній версії або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: ручне встановлення через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Коли `openclaw update` керує глобальним встановленням npm, він спочатку встановлює цільову версію в
тимчасовий префікс npm, перевіряє інвентар упакованого `dist`, а потім замінює
чисте дерево пакета в реальному глобальному префіксі. Це запобігає накладанню npm
нового пакета поверх застарілих файлів зі старого пакета. Якщо команда встановлення завершується помилкою,
OpenClaw повторює спробу один раз із `--omit=optional`. Ця повторна спроба допомагає хостам, де нативні
необов’язкові залежності не можуть скомпілюватися, водночас зберігаючи видимою початкову помилку,
якщо резервний варіант також не спрацює.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакета лише для читання">
    OpenClaw розглядає упаковані глобальні встановлення як доступні лише для читання під час виконання, навіть коли глобальний каталог пакета доступний для запису поточному користувачу. Встановлення пакетів Plugin розміщуються в npm/git коренях, що належать OpenClaw, у каталозі користувацької конфігурації, а запуск Gateway не змінює дерево пакета OpenClaw.

    Деякі конфігурації npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таке компонування, оскільки команди встановлення й оновлення Plugin записують дані поза цим глобальним каталогом пакета.

  </Accordion>
  <Accordion title="Посилені systemd unit">
    Надайте OpenClaw доступ на запис до його коренів конфігурації/стану, щоб явні встановлення Plugin, оновлення Plugin і очищення doctor могли зберігати свої зміни:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Попередня перевірка місця на диску">
    Перед оновленнями пакетів і явними встановленнями Plugin OpenClaw намагається виконати best-effort перевірку місця на диску для цільового тому. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки квоти файлової системи, snapshot і мережеві томи можуть змінитися після перевірки. Фактичне встановлення через менеджер пакетів і перевірка після встановлення залишаються авторитетними.
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
| `stable` | Чекає `stableDelayHours`, а потім застосовує з детермінованим jitter у межах `stableJitterHours` (поетапне розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (за замовчуванням: щогодини) і застосовує негайно.                              |
| `dev`    | Без автоматичного застосування. Використовуйте `openclaw update` вручну.                                                           |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).
Для downgrade або відновлення після інциденту встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб заблокувати автоматичні застосування навіть коли налаштовано `update.auto.enabled`. Підказки про оновлення під час запуску все ще можуть виконуватися, якщо `update.checkOnStart` також не вимкнено.

Оновлення менеджера пакетів, запитані через live обробник control-plane Gateway,
примусово виконують restart оновлення без відкладання й без cooldown після заміни пакета. Це
не дає старому процесу в пам’яті залишатися достатньо довго, щоб lazy-load фрагменти
з дерева пакета, яке вже було замінено. Shell `openclaw update`
залишається бажаним шляхом для керованих встановлень, оскільки він може зупинити й
перезапустити службу навколо оновлення.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, аудитує політики DM і перевіряє справність Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

### Закріпити версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` показує поточну опубліковану версію.
</Tip>

### Закріпити commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до останньої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Запустіть `openclaw doctor` ще раз і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на source checkouts засіб оновлення автоматично bootstraps `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap pnpm/corepack, встановіть `pnpm` вручну (або повторно увімкніть `corepack`) і перезапустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі способи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки справності після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції основних версій.
