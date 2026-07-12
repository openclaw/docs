---
read_when:
    - Запуск перевірки якості Mantis для настільного Slack із GitHub або локально
    - Налагодження повільних запусків Mantis у застосунку Slack для настільних комп’ютерів
    - Вибір режиму джерела, попередньої гідратації або прогрітої оренди
    - Публікація скриншотів і відеодоказів у PR
summary: 'Інструкція оператора для тестування якості Mantis у настільному застосунку Slack: запуск через GitHub, локальний CLI, прогріті оренди VNC, режими гідратації, інтерпретація часових показників, артефакти та обробка помилок.'
title: Інструкція з експлуатації Mantis для настільної версії Slack
x-i18n:
    generated_at: "2026-07-12T13:08:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA — це напрям перевірки в реальному інтерфейсі для помилок класу Slack, які потребують
робочого столу Linux, аварійного доступу через VNC, Slack Web, справжнього Gateway OpenClaw, знімків екрана,
відео та коментаря з доказами в PR. Використовуйте його, коли модульні тести або
безголовий напрям живої перевірки Slack не можуть підтвердити помилку.

## Модель зберігання

Mantis використовує три рівні зберігання:

- **Образ провайдера** — належить Crabbox і зберігається в обліковому записі хмарного провайдера.
  Містить можливості машини (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, нативні інструменти збирання) і порожні каталоги кешу.
- **Стан прогрітої оренди** — належить поточному сеансу оператора. Може містити
  профіль браузера з виконаним входом, `/var/cache/crabbox/pnpm` і підготовлену робочу копію
  вихідного коду, доки оренда активна.
- **Артефакти Mantis** — належать запуску OpenClaw. Розташовані в
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions завантажує їх, а GitHub App Mantis
  додає в PR вбудовані докази.

Ніколи не вбудовуйте секрети, файли cookie браузера, стан входу в Slack, робочі копії репозиторію,
`node_modules` або `dist/` в образ провайдера.

## Запуск через GitHub

Запустіть робочий процес із `main`:

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

`candidate_ref` обмежено, оскільки робочий процес використовує чинні облікові дані: він
має відповідати поточній історії `main`, тегу випуску або головній гілці відкритого PR у
`openclaw/openclaw`.

Робочий процес створює:

- завантажений артефакт `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- вбудований коментар у PR від GitHub App Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- віддалені журнали: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Коментар PR оновлюється на місці за допомогою прихованого маркера `<!-- mantis-slack-desktop-smoke -->`.

## Локальний CLI

Перевірка вихідного коду на холодній машині:

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

Збережіть віртуальну машину для аварійного доступу через VNC:

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

Повторно використайте прогріту оренду:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно використовуваний віддалений робочий простір уже
має `node_modules` і зібраний `dist/`; інакше Mantis завершує роботу з помилкою.

Підтвердьте нативний інтерфейс схвалення Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` і `--gateway-setup` є взаємовиключними. Якщо не передати явний
сценарій контрольної точки схвалення через `--scenario`, запускаються сценарії
`slack-approval-exec-native` і `slack-approval-plugin-native`, які вмикаються окремо; інші
сценарії Slack відхиляються до запуску віртуальної машини. Засіб виконання QA Slack записує
кожен JSON-файл контрольної точки зі справжнього повідомлення API Slack, яке він спостерігав, після чого
віддалений спостерігач відтворює це повідомлення у файлах
`approval-checkpoints/<scenario>-pending.png` і
`approval-checkpoints/<scenario>-resolved.png`. Запуск завершується невдало, якщо будь-який
JSON контрольної точки, доказ повідомлення, JSON підтвердження або відтворений знімок екрана відсутній
чи порожній.

Холодні оренди GitHub Actions не мають файлів cookie Slack Web, тому під час захоплення браузера
може відкритися екран входу в Slack. Для підтвердження контрольних точок схвалення покладайтеся на
відтворені зображення контрольних точок і артефакти QA Slack, а не на
`slack-desktop-smoke.png`. Використовуйте лише збережену прогріту оренду з профілем
Slack Web, у якому вхід виконано вручну, коли сам знімок браузера має показувати
Slack Web.

## Режими підготовки

| Режим        | Коли використовувати                        | Поведінка на віддаленій машині                                                      | Компроміс                                                   |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `source`     | Звичайна перевірка PR, холодні машини, CI   | Запускає `pnpm install --frozen-lockfile --prefer-offline` і `pnpm build` у ВМ      | Найповільніше, але найнадійніше підтверджує робочу копію вихідного коду |
| `prehydrated` | Ви навмисно підготували повторно використовувану оренду | Вимагає наявних `node_modules` і `dist/`; пропускає встановлення та збирання | Швидко, але дійсно лише для контрольованих оператором прогрітих оренд |

GitHub Actions завжди готує робочу копію кандидата перед запуском віртуальної машини. Його
сховище pnpm кешується за ОС, версією Node і файлом блокування. Запуск `source` у віртуальній машині
також повторно використовує `/var/cache/crabbox/pnpm`, якщо він наявний.

## Інтерпретація тривалості

`mantis-slack-desktop-smoke-report.md` містить тривалість етапів:

- `crabbox.warmup` — запуск у хмарного провайдера, готовність робочого столу й браузера, SSH.
- `crabbox.inspect` — пошук метаданих оренди.
- `credentials.prepare` — отримання оренди облікових даних Convex.
- `crabbox.remote_run` — синхронізація, запуск браузера, встановлення/збирання OpenClaw або
  перевірка підготовки, запуск Gateway, створення знімка екрана та запис відео.
- `artifacts.copy` — зворотна синхронізація через rsync із віртуальної машини.

`crabbox.remote_run` може мати стан `accepted`, коли Crabbox повертає ненульовий
віддалений статус, але Mantis скопіював метадані, які підтверджують, що налаштування Gateway
OpenClaw завершилося або сама команда QA Slack успішно завершила роботу. Вважайте
`accepted` успішним результатом із поясненням, а не невдалим сценарієм.

Якщо запуск повільний:

- Переважає прогрівання: попередньо зберіть або просуньте кращий образ провайдера Crabbox.
- `remote_run` переважає в `source`: використайте прогріту оренду, покращте повторне використання
  сховища pnpm або перенесіть необхідні компоненти машини в образ провайдера.
- `remote_run` переважає в `prehydrated`: віддалений робочий простір насправді не був
  готовий або налаштування Gateway, браузера чи Slack виконується повільно.
- Переважає копіювання артефактів: перевірте розмір відео та вміст каталогу артефактів.

## Контрольний список доказів

Хороший коментар у PR містить:

- ідентифікатор сценарію та SHA кандидата
- URL запуску GitHub Actions і URL артефакту
- вбудований знімок екрана контрольної точки схвалення або знімок Slack Web із
  прогрітої оренди, де виконано вхід
- вбудований анімований попередній перегляд, якщо доступний
- посилання на повний і обрізаний MP4
- стан успіху/невдачі та зведення тривалості зі звіту

Не додавайте знімки екрана або відео до репозиторію. Зберігайте їх в артефактах
GitHub Actions або коментарі PR.

## Обробка помилок

Якщо робочий процес завершується невдало до запуску віртуальної машини, спочатку перевірте завдання Actions.
Типові причини: ненадійний `candidate_ref`, відсутні секрети середовища або
помилка встановлення/збирання кандидата.

Якщо запуск віртуальної машини завершується невдало, але знімки екрана було скопійовано назад, перевірте:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Якщо запуск зберіг оренду, відкрийте VNC за допомогою команди `crabbox vnc ...`
зі звіту, а після завершення зупиніть оренду:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Якщо термін дії входу в Slack минув, відновіть його через VNC у збереженій оренді та повторіть запуск із
`--lease-id`. Не вбудовуйте цей профіль браузера в образ провайдера.

## Пов’язані матеріали

- [Огляд QA](/uk/concepts/qa-e2e-automation)
- [Канал Slack](/uk/channels/slack)
- [Тестування](/uk/help/testing)
