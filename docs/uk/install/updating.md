---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з джерела), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-06-27T17:42:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
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
openclaw update --dry-run   # preview without applying
```

`openclaw update` не приймає `--verbose`. Для діагностики оновлення використовуйте
`--dry-run`, щоб переглянути заплановані дії, `--json` для структурованих результатів або
`openclaw update status --json`, щоб перевірити стан каналу та доступності. Інсталятор
має власний прапорець `--verbose`, але цей прапорець не є частиною
`openclaw update`.

`--channel beta` надає перевагу beta, але runtime повертається до stable/latest, коли
тег beta відсутній або старіший за найновіший stable-випуск. Використовуйте `--tag beta`,
якщо вам потрібен сирий npm beta dist-tag для одноразового оновлення пакета.

Використовуйте `--channel dev` для постійного рухомого GitHub checkout `main`. Для оновлень пакетів
`--tag main` зіставляється з `github:openclaw/openclaw#main` для одного запуску, а
специфікації джерел GitHub/git пакуються в тимчасовий tarball перед staged
npm install.

Для керованих plugins fallback beta-каналу є попередженням: оновлення core може
все одно пройти успішно, поки plugin використовує свій записаний default/latest випуск, оскільки
plugin beta недоступний.

Див. [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

## Перемикання між npm і git інсталяціями

Використовуйте канали, коли хочете змінити тип інсталяції. Оновлювач зберігає ваші
state, config, credentials і workspace у `~/.openclaw`; він змінює лише те,
яку інсталяцію коду OpenClaw використовують CLI і Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму інсталяції:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI
з цього checkout. Канали `stable` і `beta` використовують пакетні інсталяції. Якщо
Gateway уже встановлено, `openclaw update` оновлює метадані сервісу
і перезапускає його, якщо ви не передали `--no-restart`.

Для пакетних інсталяцій із керованим сервісом Gateway `openclaw update` націлюється
на корінь пакета, який використовує цей сервіс. Якщо shell-команда `openclaw` надходить
з іншої інсталяції, оновлювач виводить обидва корені та шлях Node керованого сервісу.
Оновлення пакета використовує менеджер пакетів, який володіє коренем сервісу,
і перевіряє Node керованого сервісу щодо engine цільового випуску
перед заміною пакета.

## Альтернатива: повторно запустіть інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Щоб примусово вибрати конкретний тип інсталяції через
інсталятор, передайте `--install-method git --no-onboard` або
`--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після фази npm package install, повторно запустіть
інсталятор. Інсталятор не викликає старий оновлювач; він запускає глобальну
інсталяцію пакета напряму і може відновити частково оновлену npm-інсталяцію.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб закріпити відновлення за конкретною версією або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: ручний npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Надавайте перевагу `openclaw update` для supervised install, оскільки він може координувати
заміну пакета із запущеним сервісом Gateway. Якщо ви оновлюєте вручну на
supervised install, зупиніть керований Gateway до запуску менеджера пакетів.
Менеджери пакетів замінюють файли на місці, і запущений Gateway інакше може спробувати
завантажити core або plugin-файли, поки дерево пакета тимчасово напівзамінене.
Перезапустіть Gateway після завершення роботи менеджера пакетів, щоб сервіс підхопив
нову інсталяцію.

Для root-owned Linux system-global install, якщо `openclaw update` завершується помилкою
`EACCES` і ви відновлюєтеся через системний npm, тримайте Gateway зупиненим протягом
ручної заміни пакета. Використовуйте ті самі прапорці профілю `openclaw` або середовище,
які ви зазвичай використовуєте для цього Gateway. Замініть `/usr/bin/npm` на системний npm,
який володіє root-owned global prefix на вашому host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Потім перевірте сервіс:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Коли `openclaw update` керує глобальною npm-інсталяцією, він спочатку встановлює ціль
у тимчасовий npm prefix, перевіряє інвентар упакованого `dist`, а потім замінює
чисте дерево пакета в реальному global prefix. Це запобігає накладанню npm
нового пакета на застарілі файли зі старого пакета. Якщо команда інсталяції завершується помилкою,
OpenClaw повторює спробу один раз із `--omit=optional`. Ця повторна спроба допомагає host, де native
optional dependencies не можуть скомпілюватися, водночас зберігаючи видимою початкову помилку,
якщо fallback також завершується помилкою.

Команди OpenClaw-managed npm update і plugin-update також очищають npm
карантин `min-release-age` для дочірнього npm-процесу. npm може повідомляти цю
політику як похідний cutoff `before`; обидва корисні для загальних політик supply-chain
карантину, але явне оновлення OpenClaw означає «встановити вибраний
випуск OpenClaw зараз».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми npm-інсталяції

<AccordionGroup>
  <Accordion title="Дерево пакета лише для читання">
    OpenClaw розглядає упаковані глобальні інсталяції як read-only під час runtime, навіть коли глобальний каталог пакета доступний для запису поточному користувачу. Інсталяції plugin-пакетів розміщуються в npm/git-коренях, якими володіє OpenClaw, під каталогом користувацької config, а запуск Gateway не змінює дерево пакета OpenClaw.

    Деякі Linux npm setup встановлюють глобальні пакети в root-owned каталоги, як-от `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку структуру, оскільки команди інсталяції/оновлення plugin пишуть поза цим глобальним каталогом пакета.

  </Accordion>
  <Accordion title="Посилені systemd units">
    Надайте OpenClaw доступ на запис до його config/state roots, щоб явні plugin installs, plugin updates і doctor cleanup могли зберігати свої зміни:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Попередня перевірка місця на диску">
    Перед оновленнями пакетів і явними plugin installs OpenClaw намагається виконати best-effort перевірку місця на диску для цільового тому. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки filesystem quotas, snapshots і network volumes можуть змінитися після перевірки. Фактична інсталяція менеджером пакетів і post-install verification залишаються авторитетними.
  </Accordion>
</AccordionGroup>

## Автоматичний оновлювач

Автоматичний оновлювач вимкнено за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

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
| `stable` | Чекає `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (розгорнуте розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (за замовчуванням: щогодини) і застосовує негайно.                              |
| `dev`    | Без автоматичного застосування. Використовуйте `openclaw update` вручну.                                                           |

Gateway також записує в лог підказку про оновлення під час запуску (вимкніть через `update.checkOnStart: false`).
Для downgrade або incident recovery встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб блокувати автоматичні застосування навіть коли налаштовано `update.auto.enabled`. Підказки оновлення під час запуску все одно можуть виконуватися, якщо також не вимкнено `update.checkOnStart`.

Оновлення через менеджер пакетів, запитані через live Gateway control-plane handler,
не замінюють дерево пакета всередині запущеного процесу Gateway. На керованих
сервісних інсталяціях Gateway запускає detached handoff, завершує роботу і дозволяє
звичайному CLI-шляху `openclaw update --yes --json` зупинити сервіс, замінити
пакет, оновити метадані сервісу, перезапустити, перевірити версію Gateway і
досяжність, а також за можливості відновити встановлений, але незавантажений macOS LaunchAgent.
Якщо Gateway не може безпечно виконати такий handoff, `update.run` повідомляє
безпечну shell-команду замість запуску менеджера пакетів in-process.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує config, перевіряє DM policies і перевіряє стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

### Перезапустіть Gateway

```bash
openclaw gateway restart
```

### Перевірте

```bash
openclaw health
```

</Steps>

## Rollback

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

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Запустіть `openclaw doctor` ще раз і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на source checkout оновлювач автоматично bootstrap `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap pnpm/corepack, встановіть `pnpm` вручну (або повторно увімкніть `corepack`) і повторіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд інсталяції](/uk/install): усі способи інсталяції.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції між major version.
