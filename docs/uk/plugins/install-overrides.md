---
read_when:
    - Тестування потоків онбордингу або налаштування з локально запакованим plugin
    - Перевірка пакета Plugin перед публікацією
    - Заміна автоматичного встановлення plugin на тестовий артефакт
sidebarTitle: Install overrides
summary: Тестування перевизначень запакованого plugin з потоками встановлення під час налаштування
title: Перевизначення встановлення Plugin
x-i18n:
    generated_at: "2026-06-27T17:52:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Перевизначення встановлення Plugin дають супровідникам змогу тестувати встановлення Plugin під час налаштування з
конкретним npm-пакетом або локальним tarball, створеним `npm pack`. Вони призначені лише для E2E та
перевірки пакунків. Звичайні користувачі мають встановлювати Plugin за допомогою
[`openclaw plugins install`](/uk/cli/plugins).

<Warning>
Перевизначення виконують код Plugin із джерела, яке ви надаєте. Використовуйте їх лише в
ізольованому каталозі стану або на одноразовій тестовій машині.
</Warning>

## Середовище

Перевизначення вимкнені, якщо не задано обидві змінні:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Мапа перевизначень є JSON, ключами якого є ідентифікатори Plugin. Значення підтримують:

- `npm:<registry-spec>` для пакунків реєстру й точних версій або тегів
- `npm-pack:<path.tgz>` для локальних tarball, створених `npm pack`

Відносні шляхи `npm-pack:` розв’язуються від поточного робочого каталогу.

## Поведінка

Коли потік під час налаштування просить встановити Plugin, ідентифікатор якого є в мапі,
OpenClaw використовує джерело перевизначення замість каталогу, вбудованого або типового
npm-джерела. Це застосовується до початкового налаштування та інших потоків, що використовують спільний
інсталятор Plugin під час налаштування.

Перевизначення все одно примусово перевіряють очікуваний ідентифікатор Plugin. Tarball, зіставлений із `codex`,
має встановити Plugin, чий ідентифікатор у маніфесті дорівнює `codex`.

Перевизначення не успадковують офіційний статус довіреного джерела. Навіть коли запис каталогу
зазвичай представляє пакунок, що належить OpenClaw, перевизначення розглядається як
тестовий вхід, наданий оператором.

Файли `.env` у workspace не можуть увімкнути перевизначення встановлення. Задавайте ці змінні в
довіреній shell, завданні CI або віддаленій тестовій команді, яка запускає OpenClaw.

## E2E пакунка

Використовуйте ізольований каталог стану, щоб встановлення пакунків і записи встановлення не
торкалися вашого звичайного стану OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Перевірте встановлений пакунок у каталозі стану:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Для E2E з live-провайдером отримайте справжній API-ключ із довіреної shell або секрету CI
перед запуском тестової команди. Не друкуйте ключі; повідомляйте лише джерело та
чи був ключ наявний.
