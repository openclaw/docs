---
read_when:
    - Оновлення OpenClaw
    - Після оновлення щось перестає працювати
summary: Безпечне оновлення OpenClaw (глобальне встановлення або встановлення з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-05-01T08:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає gateway.

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

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, коли
тег beta відсутній або старіший за найновіший stable-випуск. Використовуйте `--tag beta`,
якщо вам потрібен сирий npm beta dist-tag для одноразового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, коли потрібно змінити тип встановлення. Оновлювач зберігає ваші
стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він змінює лише те,
яке встановлення коду OpenClaw використовують CLI і gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб попередньо переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI
з цього checkout. Канали `stable` і `beta` використовують пакетні встановлення. Якщо
gateway уже встановлено, `openclaw update` оновлює метадані сервісу
й перезапускає його, якщо ви не передасте `--no-restart`.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Щоб примусово вибрати конкретний тип встановлення через
інсталятор, передайте `--install-method git --no-onboard` або
`--install-method npm --no-onboard`.

Якщо `openclaw update` завершується помилкою після етапу встановлення npm-пакета, повторно запустіть
інсталятор. Інсталятор не викликає старий оновлювач; він запускає глобальне
встановлення пакета напряму й може відновити частково оновлене npm-встановлення.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб закріпити відновлення за конкретною версією або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: ручне встановлення через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Коли `openclaw update` керує глобальним npm-встановленням, він спочатку встановлює ціль у
тимчасовий npm-префікс, перевіряє інвентар запакованого `dist`, а потім замінює
чисте дерево пакета в реальному глобальному префіксі. Це запобігає накладанню npm
нового пакета поверх застарілих файлів зі старого пакета. Якщо команда встановлення завершується помилкою,
OpenClaw повторює спробу один раз із `--omit=optional`. Така повторна спроба допомагає хостам, де нативні
необов’язкові залежності не можуть скомпілюватися, водночас залишаючи початкову помилку видимою,
якщо резервний варіант також завершується помилкою.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакета лише для читання">
    OpenClaw розглядає запаковані глобальні встановлення як доступні лише для читання під час виконання, навіть коли глобальний каталог пакета доступний поточному користувачу для запису. Залежності середовища виконання вбудованих plugin розміщуються в доступному для запису каталозі середовища виконання замість зміни дерева пакета. Це запобігає конфлікту `openclaw update` із запущеним gateway або локальним агентом, який відновлює залежності plugin під час того самого встановлення.

    Деякі налаштування Linux npm встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку структуру через той самий зовнішній шлях staging.

  </Accordion>
  <Accordion title="Посилені systemd units">
    Задайте доступний для запису stage-каталог, який включено в `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` також приймає список шляхів. OpenClaw розв’язує залежності середовища виконання вбудованих plugin зліва направо по перелічених коренях, розглядає попередні корені як попередньо встановлені шари лише для читання та встановлює або відновлює лише у фінальний доступний для запису корінь:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, коли systemd його надає, а потім повертається до `~/.openclaw/plugin-runtime-deps`. Крок відновлення розглядає цей stage як локальний корінь пакета, що належить OpenClaw, і ігнорує npm-префікс користувача та глобальні налаштування, тому npm-конфігурація глобального встановлення не перенаправляє залежності вбудованих plugin у `~/node_modules` або глобальне дерево пакета.

  </Accordion>
  <Accordion title="Попередня перевірка дискового простору">
    Перед оновленнями пакета й відновленнями вбудованих залежностей середовища виконання OpenClaw намагається виконати best-effort перевірку дискового простору для цільового тому. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки квоти файлової системи, snapshots і мережеві томи можуть змінитися після перевірки. Фактичне встановлення npm, копіювання й післяінсталяційна перевірка залишаються авторитетними.
  </Accordion>
  <Accordion title="Залежності середовища виконання вбудованих plugin">
    Запаковані встановлення тримають залежності середовища виконання вбудованих plugin поза деревом пакета лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для вбудованих plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовими налаштуваннями їхнього вбудованого маніфесту. Сам лише збережений стан автентифікації каналу не запускає відновлення залежностей середовища виконання під час запуску Gateway.

    Явне вимкнення має пріоритет. Вимкнений plugin або канал не отримує відновлення своїх залежностей середовища виконання лише тому, що він існує в пакеті. Зовнішні plugins і власні шляхи завантаження й далі використовують `openclaw plugins install` або `openclaw plugins update`.

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
| `stable` | Чекає `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (розподілене розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (за замовчуванням: щогодини) і застосовує негайно.                  |
| `dev`    | Без автоматичного застосування. Використовуйте `openclaw update` вручну.                                      |

Gateway також записує підказку щодо оновлення під час запуску (вимкніть через `update.checkOnStart: false`).
Для downgrade або відновлення після інциденту задайте `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі gateway, щоб блокувати автоматичні застосування навіть коли налаштовано `update.auto.enabled`. Підказки щодо оновлення під час запуску все ще можуть виконуватися, якщо також не вимкнено `update.checkOnStart`.

Оновлення через package manager, запитані через live-обробник control plane Gateway,
примусово виконують недеферований перезапуск оновлення без cooldown після заміни пакета. Це
запобігає тому, щоб старий процес у пам’яті лишався достатньо довго для lazy-load chunks
із дерева пакета, яке вже замінено. Shell-команда `openclaw update`
залишається бажаним шляхом для керованих встановлень, оскільки вона може зупинити й
перезапустити сервіс навколо оновлення.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і стан gateway. Докладніше: [Doctor](/uk/gateway/doctor)

### Перезапустіть gateway

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

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Запустіть `openclaw doctor` ще раз і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на source checkouts оновлювач автоматично bootstraps `pnpm`, коли це потрібно. Якщо бачите помилку bootstrap pnpm/corepack, встановіть `pnpm` вручну (або повторно ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі методи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції основних версій.
