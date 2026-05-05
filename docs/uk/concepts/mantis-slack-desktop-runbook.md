---
read_when:
    - Запуск настільного QA Mantis Slack із GitHub або локально
    - Налагодження повільних запусків Mantis Slack на настільному комп’ютері
    - Вибір режиму джерела, попередньо підготовленого режиму або режиму теплої оренди
    - Додавання до PR доказів у вигляді знімків екрана та відео
summary: 'Операторський посібник для QA настільної версії Mantis Slack: запуск через GitHub dispatch, локальний CLI, прогріті VNC-оренди, режими гідратації, інтерпретація таймінгів, артефакти та обробка збоїв.'
title: Операційний посібник Mantis для настільної програми Slack
x-i18n:
    generated_at: "2026-05-05T22:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a8046e30cb348a7edf01845216f97f67dc3b3695f2484b7e883d3b862ffad81
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA — це гілка з реальним UI для помилок класу Slack, які потребують
Linux-десктопа, VNC-відновлення, Slack Web, реального Gateway OpenClaw, знімків екрана,
відео та коментаря з доказами в PR.

Використовуйте її, коли модульні тести або headless live-гілка Slack не можуть довести помилку.

## Модель зберігання

Mantis використовує три різні шари зберігання:

- Образ провайдера: належить Crabbox і зберігається в обліковому записі хмарного провайдера.
  Він містить можливості машини, такі як Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, нативні інструменти збірки та порожні каталоги кешу.
- Стан теплого лізу: належить поточній операторській сесії. Він може містити
  браузерний профіль із виконаним входом, `/var/cache/crabbox/pnpm` і підготовлений checkout
  вихідного коду, доки ліз активний.
- Артефакти Mantis: належать запуску OpenClaw. Вони розміщуються в
  `.artifacts/qa-e2e/mantis/...`, після чого GitHub Actions завантажує їх, а
  Mantis GitHub App коментує inline-докази в PR.

Ніколи не кладіть секрети, браузерні cookies, стан входу Slack, checkout-и репозиторію,
`node_modules` або `dist/` у попередньо зібраний образ провайдера.

## GitHub Dispatch

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

Дозволені значення `candidate_ref` навмисно вузькі, оскільки workflow
використовує live-облікові дані: поточна історія `main`, release tags або head відкритого PR
з `openclaw/openclaw`.

Workflow записує:

- завантажений артефакт: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- inline-коментар PR від Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- віддалені журнали, як-от `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` і `ffmpeg.log`.

Коментар PR оновлюється на місці за прихованим маркером
`<!-- mantis-slack-desktop-smoke -->`.

## Локальний CLI

Холодний доказ із вихідного коду:

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

Залиште VM для VNC-відновлення:

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

Повторно використайте теплий ліз:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно використаний віддалений workspace уже
має `node_modules` і зібраний `dist/`. Mantis завершується із закритою відмовою, якщо вони
відсутні.

## Режими Hydrate

| Режим         | Коли використовувати                      | Поведінка на віддаленій машині                                                        | Компроміс                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Звичайний доказ PR, холодні машини, CI    | Запускає `pnpm install --frozen-lockfile --prefer-offline` і `pnpm build` всередині VM | Найповільніший, найсильніший доказ із checkout вихідного коду |
| `prehydrated` | Ви навмисно підготували повторно використаний ліз | Вимагає наявних `node_modules` і `dist/`; пропускає install/build                     | Швидкий, але чинний лише для теплих лізів під контролем оператора |

GitHub Actions завжди готує candidate checkout перед запуском VM. Його
pnpm store кешується за OS, версією Node і lockfile. Запуск вихідного коду на VM також
використовує `/var/cache/crabbox/pnpm`, коли він наявний.

## Інтерпретація часу

`mantis-slack-desktop-smoke-report.md` містить таймінги фаз:

- `crabbox.warmup`: запуск хмарного провайдера, готовність desktop/browser і SSH.
- `crabbox.inspect`: пошук метаданих лізу.
- `credentials.prepare`: отримання лізу облікових даних Convex.
- `crabbox.remote_run`: синхронізація, запуск браузера, встановлення/збірка OpenClaw або
  перевірка hydrate, запуск Gateway, знімок екрана та запис відео.
- `artifacts.copy`: rsync назад із VM.

`crabbox.remote_run` може бути позначено як `accepted`, коли Crabbox повертає ненульовий
віддалений статус після того, як Mantis скопіював метадані, які доводять, що Gateway OpenClaw
живий і налаштування завершене. Трактуйте `accepted` як pass-with-explanation,
а не як невдалий сценарій.

Якщо запуск повільний:

- домінує warmup: попередньо зберіть або просуньте кращий образ провайдера Crabbox;
- домінує remote_run у `source`: використайте теплий ліз, покращте повторне використання pnpm store
  або перенесіть передумови машини в образ провайдера;
- домінує remote_run у `prehydrated`: віддалений workspace насправді не був
  готовий або налаштування gateway/browser/Slack повільне;
- домінує копіювання артефактів: перевірте розмір відео та вміст каталогу артефактів.

## Контрольний список доказів

Хороший коментар PR має показувати:

- id сценарію та candidate SHA;
- URL запуску GitHub Actions;
- URL артефакту;
- inline-знімок екрана;
- inline-анімований preview, коли доступний;
- посилання на повний MP4 і обрізаний MP4;
- статус pass/fail;
- підсумок таймінгів у прикріпленому звіті.

Не комітьте знімки екрана або відео в репозиторій. Зберігайте їх в артефактах
GitHub Actions або в коментарі PR.

## Обробка збоїв

Якщо workflow завершується збоєм до запуску VM, спочатку перевірте job в Actions. Типові
причини: недовірений `candidate_ref`, відсутні секрети середовища або збій install/build кандидата.

Якщо запуск VM завершується збоєм, але знімки екрана були скопійовані назад, перевірте:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Якщо запуск залишив ліз, відкрийте VNC командою `crabbox vnc ...` зі звіту.
Зупиніть ліз після завершення:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Якщо вхід у Slack протермінувався, відновіть його у VNC на збереженому лізі та повторно запустіть із
`--lease-id`. Не вбудовуйте цей браузерний профіль в образ провайдера.

Пов’язані docs:

- [Огляд QA](qa-e2e-automation.md)
- [Канал Slack](../channels/slack.md)
- [Тестування](../help/testing.md)
