---
read_when:
    - Оновлення OpenClaw
    - Щось не працює після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-05-01T20:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

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

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, коли тег beta відсутній або старіший за найновіший стабільний випуск. Використовуйте `--tag beta`, якщо вам потрібен сирий npm beta dist-tag для одноразового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels) щодо семантики каналів.

## Перемикання між npm- і git-встановленнями

Використовуйте канали, коли хочете змінити тип встановлення. Оновлювач зберігає ваш стан, конфігурацію, облікові дані й робочу область у `~/.openclaw`; він змінює лише те, яке встановлення коду OpenClaw використовують CLI і Gateway.

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

Канал `dev` забезпечує git checkout, збирає його й установлює глобальний CLI з цього checkout. Канали `stable` і `beta` використовують пакетні встановлення. Якщо Gateway уже встановлено, `openclaw update` оновлює метадані сервісу й перезапускає його, якщо ви не передали `--no-restart`.

## Альтернатива: повторно запустіть інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити онбординг. Щоб примусово вибрати конкретний тип встановлення через інсталятор, передайте `--install-method git --no-onboard` або `--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення npm-пакета, повторно запустіть інсталятор. Інсталятор не викликає старий оновлювач; він безпосередньо запускає глобальне встановлення пакета й може відновити частково оновлене npm-встановлення.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб прив’язати відновлення до конкретної версії або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: вручну через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Коли `openclaw update` керує глобальним npm-встановленням, він спочатку встановлює ціль у тимчасовий npm prefix, перевіряє упакований інвентар `dist`, а потім замінює реальне глобальне prefix чистим деревом пакета. Це запобігає накладанню нового пакета npm поверх застарілих файлів зі старого пакета. Якщо команда встановлення завершується помилкою, OpenClaw повторює спробу один раз із `--omit=optional`. Ця повторна спроба допомагає хостам, де native optional dependencies не можуть скомпілюватися, водночас залишаючи початкову помилку видимою, якщо fallback також завершується невдало.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакетів лише для читання">
    OpenClaw розглядає упаковані глобальні встановлення як доступні лише для читання під час виконання, навіть коли глобальний каталог пакета доступний для запису поточному користувачу. Встановлення пакетів Plugin розміщуються в npm/git-коренях, що належать OpenClaw, у каталозі конфігурації користувача, а запуск Gateway не змінює дерево пакета OpenClaw.

    Деякі Linux-конфігурації npm встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку структуру, оскільки команди встановлення/оновлення Plugin записують дані поза цим глобальним каталогом пакета.

  </Accordion>
  <Accordion title="Посилені systemd-юніти">
    Надайте OpenClaw доступ на запис до його коренів конфігурації/стану, щоб явні встановлення Plugin, оновлення Plugin і очищення doctor могли зберігати свої зміни:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Попередня перевірка місця на диску">
    Перед оновленнями пакетів і явними встановленнями Plugin OpenClaw намагається виконати best-effort перевірку вільного місця на цільовому томі. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки файлові квоти, snapshots і мережеві томи можуть змінитися після перевірки. Фактичне встановлення через менеджер пакетів і післяінсталяційна перевірка залишаються авторитетними.
  </Accordion>
</AccordionGroup>

## Автооновлювач

Автооновлювач типово вимкнено. Увімкніть його в `~/.openclaw/openclaw.json`:

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

| Канал    | Поведінка                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `stable` | Очікує `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (розподілене розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                                         |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                               |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).
Для відкату або відновлення після інциденту встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб заблокувати автоматичні застосування, навіть коли налаштовано `update.auto.enabled`. Підказки про оновлення під час запуску все ще можуть виконуватися, якщо `update.checkOnStart` також не вимкнено.

Оновлення через менеджер пакетів, запитані через live Gateway control-plane handler, примусово виконують невідкладений перезапуск без cooldown після заміни пакета. Це запобігає ситуації, коли старий процес у пам’яті залишається достатньо довго, щоб lazy-load chunks із дерева пакета, яке вже було замінено. Shell `openclaw update` залишається рекомендованим шляхом для керованих встановлень, оскільки він може зупинити й перезапустити сервіс навколо оновлення.

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

### Зафіксуйте версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` показує поточну опубліковану версію.
</Tip>

### Зафіксуйте commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Запустіть `openclaw doctor` ще раз і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на source checkouts оновлювач автоматично bootstrap-ить `pnpm`, коли це потрібно. Якщо бачите помилку bootstrap pnpm/corepack, установіть `pnpm` вручну (або повторно ввімкніть `corepack`) і запустіть оновлення ще раз.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі способи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції між основними версіями.
