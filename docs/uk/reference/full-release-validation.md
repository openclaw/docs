---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння стабільного та повного профілів перевірки випуску
    - Налагодження збоїв на етапі перевірки релізу
summary: Етапи повної валідації релізу, дочірні робочі процеси, профілі релізу, ідентифікатори повторних запусків і докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-01T23:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи виконується
в дочірніх workflow, щоб невдалий бокс можна було перезапустити без повторного
запуску всього релізу.

Запускайте її з довіреного ref workflow, зазвичай `main`, і передайте релізну гілку,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірений ref workflow для harness і вхідний
`ref` для кандидата, що тестується. Це зберігає нову логіку валідації доступною
під час валідації старішої релізної гілки або тегу.

## Верхньорівневі етапи

| Етап                 | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Визначення цілі      | **Job:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** визначає релізну гілку, тег або повний SHA коміту та записує вибрані вхідні параметри.<br />**Перезапуск:** перезапустіть парасольку, якщо це завершиться невдачею.                                                                                                                                                                  |
| Vitest і звичайний CI | **Job:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI для цільового ref, включно з Linux Node lanes, шардами вбудованих Plugin, контрактами каналів, сумісністю з Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, Control UI i18n та Android через парасольку.<br />**Перезапуск:** `rerun_group=ci`. |
| Передреліз Plugin    | **Job:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, агентне покриття Plugin, повні batch-шарди extensions і Docker lanes передрелізу Plugin.<br />**Перезапуск:** `rerun_group=plugin-prerelease`.                                                                                                                        |
| Релізні перевірки    | **Job:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, cross-OS package checks, live/E2E suites, chunks релізного шляху Docker, Package Acceptance, паритет QA Lab, live Matrix і live Telegram.<br />**Перезапуск:** `rerun_group=release-checks` або вужчий handle release-checks.                                                   |
| Пакет Telegram       | **Job:** `Run package Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження пакета Telegram на основі артефакта для `rerun_group=all` з `release_profile=full`, або підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Перезапуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`.                             |
| Верифікатор парасольки | **Job:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших job з дочірніх workflow.<br />**Перезапуск:** після успішного перезапуску невдалого дочірнього workflow перезапустіть лише цей job.                                                                                                      |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли батьківський запуск скасовано, його монітор скасовує будь-який дочірній
workflow, який він уже відправив. Запуски валідації релізної гілки й тегу
за замовчуванням не скасовують один одного.

## Етапи релізних перевірок

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз визначає
ціль і готує спільний артефакт `release-package-under-test`, коли він потрібен
етапам, що працюють із пакетами або Docker.

| Етап                | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ціль релізу         | **Job:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група перезапуску та сфокусований фільтр live suite.<br />**Перезапуск:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Артефакт пакета     | **Job:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або визначає один tarball кандидата та завантажує `release-package-under-test` для подальших перевірок, що працюють із пакетами.<br />**Перезапуск:** відповідна група package, cross-OS або live/E2E.                                                                                                               |
| Install smoke       | **Job:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях установлення з повторним використанням smoke-образу root Dockerfile, встановлення QR-пакета, root і gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke та швидкий E2E install/uninstall вбудованого Plugin.<br />**Перезапуск:** `rerun_group=install-smoke`.                |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** fresh і upgrade lanes у Linux, Windows і macOS для вибраного провайдера та режиму, з використанням tarball кандидата плюс baseline-пакета.<br />**Перезапуск:** `rerun_group=cross-os`.                                                                                                      |
| Repo і live E2E     | **Job:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live cache, OpenAI websocket streaming, native live provider і шарди Plugin, а також Docker-backed live model/backend/gateway harnesses, вибрані `release_profile`.<br />**Перезапуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`.                   |
| Релізний шлях Docker | **Job:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** chunks релізного шляху Docker проти спільного артефакта пакета.<br />**Перезапуск:** `rerun_group=live-e2e`.                                                                                                                                                                       |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** офлайн fixtures пакетів Plugin, оновлення Plugin і mock-OpenAI Telegram package acceptance проти того самого tarball.<br />**Перезапуск:** `rerun_group=package`.                                                                                                                                                    |
| QA parity           | **Job:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі jobs<br />**Тести:** кандидат і baseline agentic parity packs, потім parity report.<br />**Перезапуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                                                  |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** прямий job<br />**Тести:** швидкий live Matrix QA profile у середовищі `qa-live-shared`.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                             |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** прямий job<br />**Тести:** live Telegram QA з leases облікових даних Convex CI.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                    |
| Верифікатор релізу  | **Job:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові jobs release-check для вибраної групи перезапуску.<br />**Перезапуск:** перезапустіть після успішного проходження сфокусованих дочірніх jobs.                                                                                                                                                                           |

## Chunks релізного шляху Docker

Етап релізного шляху Docker запускає ці chunks, коли `live_suite_filter`
порожній:

| Chunk                                                           | Покриття                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `core`                                                          | Smoke lanes релізного шляху Core Docker.                                  |
| `package-update-openai`                                         | Поведінка встановлення й оновлення пакета OpenAI.                         |
| `package-update-anthropic`                                      | Поведінка встановлення й оновлення пакета Anthropic.                      |
| `package-update-core`                                           | Провайдер-нейтральна поведінка пакета й оновлення.                        |
| `plugins-runtime-plugins`                                       | Runtime lanes Plugin, які перевіряють поведінку Plugin.                   |
| `plugins-runtime-services`                                      | Runtime lanes Plugin на основі сервісів; включає OpenWebUI, коли запитано. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch-перевірки встановлення/runtime Plugin, розділені для паралельної релізної валідації. |

Використовуйте цільові `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow,
коли не пройшла лише одна Docker lane. Релізні артефакти містять команди
перезапуску для кожної lane з artifact пакета та вхідними параметрами повторного
використання образу, коли вони доступні.

## Релізні профілі

`release_profile` переважно керує шириною live/provider усередині релізних перевірок.
Він не прибирає normal full CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або chunks релізного шляху Docker. `full` також змушує
парасольку запускати package Telegram E2E проти артефакта релізного пакета,
коли `rerun_group=all`, щоб повний pre-publish кандидат не пропустив мовчки
цю lane пакета Telegram.

| Профіль  | Призначення                         | Включене покриття live/provider                                                                                                                                                  |
| -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критичний для релізу smoke. | OpenAI/core live-шлях, Docker live-моделі для OpenAI, нативний core Gateway, нативний профіль OpenAI Gateway, нативний OpenAI Plugin і Docker live Gateway OpenAI.              |
| `stable`  | Стандартний профіль схвалення релізу. | `minimum` плюс Anthropic, Google, MiniMax, backend, нативний live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і smoke-шард OpenCode Go.        |
| `full`    | Широкий advisory-перегляд.          | `stable` плюс advisory-провайдери, live-шарди Plugin і медіа live-шарди.                                                                                                        |

## Доповнення лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                         | Покриття лише для full                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Docker live-моделі              | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                              |
| Docker live Gateway             | Advisory-шард для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.  |
| Нативні профілі провайдерів Gateway | Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai. |
| Нативні live-шарди Plugin       | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                 |
| Нативні медіа live-шарди        | Аудіо, музика Google, музика MiniMax і відеогрупи A-D.                       |

`stable` включає `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
натомість використовує ширші шарди моделей OpenCode Go.

## Фокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані релізні бокси:

| Handle              | Обсяг                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Усі етапи Full Release Validation.                                    |
| `ci`                | Лише дочірній manual full CI.                                         |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                                      |
| `release-checks`    | Усі етапи OpenClaw Release Checks.                                    |
| `install-smoke`     | Install Smoke через release checks.                                   |
| `cross-os`          | Cross-OS release checks.                                              |
| `live-e2e`          | Repo/live E2E і валідація Docker release-path.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity плюс QA live-лінії.                                         |
| `qa-parity`         | Лише QA parity-лінії та звіт.                                         |
| `qa-live`           | Лише QA live Matrix і Telegram.                                       |
| `npm-telegram`      | E2E Telegram для опублікованого пакета; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли збій стався в одному live-наборі.
Дійсні filter ids визначені в багаторазовому workflow live/E2E, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які слід зберегти

Зберігайте підсумок `Full Release Validation` як індекс рівня релізу. Він містить посилання
на child run ids і включає таблиці найповільніших job. У разі збоїв спочатку перевірте дочірній
workflow, а потім повторно запустіть найменший відповідний handle вище.

Корисні артефакти:

- `release-package-under-test` з `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- `package-under-test` з Package Acceptance і артефакти Docker acceptance
- Артефакти Cross-OS release-check для кожної OS і suite
- Артефакти QA parity, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
