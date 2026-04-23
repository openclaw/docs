---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або вихідний код), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-23T20:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає gateway.

```bash
openclaw update
```

Щоб змінити канал або націлитися на конкретну версію:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але runtime повертається до stable/latest, коли
beta tag відсутній або старіший за останній stable release. Використовуйте `--tag beta`,
якщо вам потрібен сирий npm beta dist-tag для одноразового оновлення пакета.

Див. [Development channels](/uk/install/development-channels) щодо семантики каналів.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Для встановлень із вихідного коду передайте `--install-method git --no-onboard`.

## Альтернатива: вручну через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Глобальні встановлення npm, що належать root

Деякі конфігурації npm на Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад
`/usr/lib/node_modules/openclaw`. OpenClaw підтримує таке розміщення: встановлений
пакет розглядається як доступний лише для читання під час runtime, а runtime-залежності bundled Plugin
розміщуються в каталозі runtime, доступному для запису, замість зміни
дерева пакета.

Для захищених systemd units задайте каталог staging, доступний для запису, який входить до
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, коли
його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`.

## Auto-updater

Auto-updater типово вимкнено. Увімкніть його в `~/.openclaw/openclaw.json`:

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

| Channel  | Behavior                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Чекає `stableDelayHours`, а потім застосовує оновлення з детермінованим jitter у межах `stableJitterHours` (розподілене розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                             |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                   |

Gateway також журналює підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, виконує аудит політик DM і перевіряє стан gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

### Зафіксувати версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Порада: `npm view openclaw version` показує поточну опубліковану версію.

### Зафіксувати commit (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до latest: `git checkout main && git pull`.

## Якщо ви застрягли

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у source checkout updater автоматично виконує bootstrap `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap pnpm/corepack, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Troubleshooting](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Install Overview](/uk/install) — усі способи встановлення
- [Doctor](/uk/gateway/doctor) — перевірки стану після оновлень
- [Migrating](/uk/install/migrating) — посібники з міграції між основними версіями
