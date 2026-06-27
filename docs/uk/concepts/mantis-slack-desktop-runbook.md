---
read_when:
    - Запуск QA для настільного Mantis Slack з GitHub або локально
    - Налагодження повільних виконань Mantis у настільному Slack
    - Вибір режиму джерела, попередньої гідратації або теплого лізингу
    - Публікація доказів у вигляді знімків екрана та відео в PR
summary: 'Операторський runbook для Mantis Slack desktop QA: GitHub dispatch, локальний CLI, теплі VNC-оренди, режими hydrate, інтерпретація таймінгу, артефакти та обробка збоїв.'
title: Посібник із запуску Mantis Slack для настільного застосунку
x-i18n:
    generated_at: "2026-06-27T17:26:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA — це напрям перевірки з реальним інтерфейсом для помилок класу Slack, які потребують
Linux desktop, аварійного доступу через VNC, Slack Web, справжнього OpenClaw Gateway, знімків екрана,
відео та коментаря з доказами в PR.

Використовуйте його, коли модульні тести або headless-напрям Slack live не можуть довести помилку.

## Модель зберігання

Mantis використовує три різні рівні зберігання:

- Образ провайдера: належить Crabbox і зберігається в обліковому записі хмарного провайдера.
  Він містить можливості машини, як-от Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, нативні інструменти збірки та порожні каталоги кешу.
- Стан теплої оренди: належить поточній операторській сесії. Він може містити
  профіль браузера з виконаним входом, `/var/cache/crabbox/pnpm` і підготовлений checkout
  джерельного коду, доки оренда активна.
- Артефакти Mantis: належать запуску OpenClaw. Вони розміщуються в
  `.artifacts/qa-e2e/mantis/...`, після чого GitHub Actions завантажує їх, а
  Mantis GitHub App коментує вбудовані докази в PR.

Ніколи не кладіть секрети, cookies браузера, стан входу Slack, checkout-репозиторії,
`node_modules` або `dist/` у заздалегідь зібраний образ провайдера.

## Запуск через GitHub

Запустіть workflow з `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

Дозволені значення `candidate_ref` навмисно вузькі, бо workflow
використовує живі облікові дані: поточне походження `main`, release tags або head відкритого PR
з `openclaw/openclaw`.

Workflow записує:

- завантажений артефакт: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- вбудований коментар PR від Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- віддалені журнали, як-от `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` і `ffmpeg.log`.

Коментар PR оновлюється на місці за прихованим
`<!-- mantis-slack-desktop-smoke -->` marker.

## Локальний CLI

Холодний доказ із джерельного коду:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Залиште VM для аварійного доступу через VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Відкрийте VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Повторно використайте теплу оренду:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно використаний віддалений workspace уже
має `node_modules` і зібраний `dist/`. Mantis закривається з помилкою, якщо їх
бракує.

Доведіть нативний інтерфейс затвердження Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Режим контрольних точок затвердження взаємовиключний із `--gateway-setup`. Він запускає
opt-in сценарії `slack-approval-exec-native` і `slack-approval-plugin-native`,
якщо ви не передасте явні прапорці контрольних точок затвердження `--scenario`; інші
сценарії Slack відхиляються до запуску VM. Slack QA runner записує
кожен JSON-файл контрольної точки зі справжнього повідомлення Slack API, яке він спостерігав, після чого
віддалений watcher рендерить цей знімок повідомлення в
`approval-checkpoints/<scenario>-pending.png` і
`approval-checkpoints/<scenario>-resolved.png`. Запуск завершується помилкою, якщо будь-який JSON контрольної точки,
доказ повідомлення, ack JSON або відрендерений знімок екрана відсутній чи порожній.

Холодні оренди GitHub Actions не мають cookies Slack Web, тому їхній браузерний
захват може потрапити на вхід у Slack. Для доказу контрольної точки затвердження довіряйте
відрендереним зображенням контрольних точок і артефактам Slack QA, а не
`slack-desktop-smoke.png`. Використовуйте збережену теплу оренду з вручну авторизованим профілем Slack
Web лише тоді, коли сам знімок екрана браузера має показувати Slack Web.

## Режими гідратації

| Режим         | Коли використовувати                     | Поведінка на віддаленій машині                                                        | Компроміс                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Звичайний доказ PR, холодні машини, CI    | Запускає `pnpm install --frozen-lockfile --prefer-offline` і `pnpm build` усередині VM | Найповільніший, найсильніший доказ checkout джерельного коду |
| `prehydrated` | Ви навмисно підготували повторно використану оренду | Потребує наявних `node_modules` і `dist/`; пропускає install/build                     | Швидко, але чинно лише для контрольованих оператором теплих оренд |

GitHub Actions завжди готує checkout кандидата перед запуском VM. Його
сховище pnpm кешується за OS, версією Node і lockfile. Запуск VM з джерельного коду також
використовує `/var/cache/crabbox/pnpm`, коли він наявний.

## Інтерпретація таймінгів

`mantis-slack-desktop-smoke-report.md` містить таймінги фаз:

- `crabbox.warmup`: завантаження хмарного провайдера, готовність desktop/browser і SSH.
- `crabbox.inspect`: пошук метаданих оренди.
- `credentials.prepare`: отримання оренди облікових даних Convex.
- `crabbox.remote_run`: синхронізація, запуск браузера, install/build OpenClaw або
  перевірка гідратації, запуск Gateway, знімок екрана та захоплення відео.
- `artifacts.copy`: rsync назад із VM.

`crabbox.remote_run` може бути позначено як `accepted`, коли Crabbox повертає ненульовий
віддалений статус після того, як Mantis скопіював метадані, які доводять, що або налаштування OpenClaw
Gateway завершилося, або сама команда Slack QA успішно завершилася.
Сприймайте `accepted` як успішне проходження із поясненням, а не як невдалий сценарій.

Якщо запуск повільний:

- домінує warmup: заздалегідь зберіть або просуньте кращий образ провайдера Crabbox;
- remote_run домінує в `source`: використайте теплу оренду, покращте повторне використання сховища pnpm
  або перенесіть машинні передумови в образ провайдера;
- remote_run домінує в `prehydrated`: віддалений workspace насправді не був
  готовий або налаштування Gateway/browser/Slack повільне;
- домінує копіювання артефактів: перевірте розмір відео та вміст каталогу артефактів.

## Контрольний список доказів

Добрий коментар PR має показувати:

- id сценарію та SHA кандидата;
- URL запуску GitHub Actions;
- URL артефакту;
- вбудований знімок екрана контрольної точки затвердження або знімок Slack Web з
  теплої оренди з виконаним входом;
- вбудований анімований preview, коли доступний;
- посилання на повний MP4 і обрізаний MP4;
- статус pass/fail;
- підсумок таймінгів у прикріпленому звіті.

Не commit-те знімки екрана або відео в репозиторій. Тримайте їх в артефактах GitHub
Actions або коментарі PR.

## Обробка збоїв

Якщо workflow завершується помилкою до запуску VM, спершу перевірте job Actions. Типові
причини — недовірений `candidate_ref`, відсутні секрети середовища або помилка
install/build кандидата.

Якщо запуск VM завершується помилкою, але знімки екрана було скопійовано назад, перевірте:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Якщо запуск зберіг оренду, відкрийте VNC командою `crabbox vnc ...` зі звіту.
Зупиніть оренду після завершення:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Якщо вхід у Slack протермінувався, виправте його у VNC на збереженій оренді та перезапустіть із
`--lease-id`. Не запікайте цей профіль браузера в образ провайдера.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation)
- [Канал Slack](/uk/channels/slack)
- [Тестування](/uk/help/testing)
