---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-24T16:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f57c5f4d4988eabb62a2c836c07f56e329149b1f9290baa0568ef1d86f66e0ad
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Він визначає ваш тип встановлення (npm або git), отримує останню версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канали або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за останній стабільний реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для разового оновлення пакета.

Див. [Канали розробки](/uk/install/development-channels), щоб ознайомитися із семантикою каналів.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити онбординг. Для встановлень із вихідного коду передайте `--install-method git --no-onboard`.

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

У деяких конфігураціях npm на Linux глобальні пакети встановлюються в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему: встановлений пакет розглядається як доступний лише для читання під час виконання, а залежності середовища виконання вбудованих Plugin розміщуються в доступному для запису каталозі середовища виконання замість зміни дерева пакета.

Для захищених systemd units задайте доступний для запису каталог staging, який включено до `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, якщо його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`.

### Залежності середовища виконання вбудованих Plugin

Пакетні встановлення зберігають залежності середовища виконання вбудованих Plugin поза деревом пакета, доступним лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або увімкнені типовим значенням їхнього вбудованого маніфесту.

Явне вимкнення має пріоритет. Для вимкненого Plugin або каналу залежності його середовища виконання не відновлюються лише через те, що він існує в пакеті. Зовнішні Plugin і користувацькі шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

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

| Канал | Поведінка |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Очікує `stableDelayHours`, потім застосовує з детермінованим джитером у межах `stableJitterHours` (поетапне розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно. |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну. |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і перевіряє стан Gateway. Подробиці: [Doctor](/uk/gateway/doctor)

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

### Зафіксувати коміт (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до останньої версії: `git checkout main && git pull`.

## Якщо ви зайшли в глухий кут

- Ще раз запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у checkout із вихідного коду оновлювач автоматично завантажує `pnpm`, якщо це потрібно. Якщо ви бачите помилку bootstrap `pnpm`/`corepack`, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Doctor](/uk/gateway/doctor) — перевірки стану після оновлень
- [Міграція](/uk/install/migrating) — посібники з міграції між основними версіями
