---
read_when:
    - Запуск або повторний запуск повної валідації релізу
    - Порівняння стабільного та повного профілів валідації випуску
    - Налагодження збоїв на етапі валідації релізу
summary: Етапи повної валідації релізу, дочірні робочі процеси, профілі релізів, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-01T20:41:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 032cf35578bc56187cdf3776dada58ccbde9a24183896bc71c3a782e85fc834f
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасольковий релізний процес. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи відбувається в дочірніх workflows, щоб
невдалий блок можна було перезапустити без перезапуску всього релізу.

Запускайте його з довіреного workflow ref, зазвичай `main`, і передавайте релізну гілку,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflows використовують довірений workflow ref для harness і вхідний
`ref` для кандидата, що тестується. Це забезпечує доступність нової логіки валідації
під час перевірки старішої релізної гілки або тега.

## Етапи верхнього рівня

| Етап                  | Подробиці                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі      | **Job:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** розв’язує релізну гілку, тег або повний SHA коміту та записує вибрані вхідні параметри.<br />**Перезапуск:** перезапустіть парасольковий workflow, якщо це не вдається.                                                                                                                                                                              |
| Vitest і звичайний CI | **Job:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI для цільового ref, включно з Linux Node lanes, сегментами bundled Plugin, контрактами каналів, сумісністю Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, Control UI i18n і Android через парасольковий workflow.<br />**Перезапуск:** `rerun_group=ci`. |
| Передреліз Plugin     | **Job:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, agentic покриття Plugin, повні пакетні сегменти extension і Docker lanes передрелізу Plugin.<br />**Перезапуск:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Релізні перевірки     | **Job:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, перевірки пакетів між ОС, live/E2E набори, частини Docker release-path, Package Acceptance, QA Lab parity, live Matrix і live Telegram.<br />**Перезапуск:** `rerun_group=release-checks` або вужчий handle release-checks.                                |
| Telegram після публікації | **Job:** `Run post-publish Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** необов’язкове підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Перезапуск:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| Верифікатор парасолькового workflow | **Job:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших jobs із дочірніх workflows.<br />**Перезапуск:** перезапустіть лише цей job після успішного перезапуску невдалого дочірнього workflow.                                                                                                                                   |

Для `ref=main` і `rerun_group=all` новіший парасольковий workflow замінює старіший.
Коли батьківський workflow скасовано, його монітор скасовує будь-який дочірній workflow, який він уже
запустив. Запуски валідації релізних гілок і тегів за замовчуванням не скасовують один одного.

## Етапи релізних перевірок

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз розв’язує ціль
і готує спільний артефакт `release-package-under-test`, коли він потрібен етапам,
пов’язаним із пакетами або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Релізна ціль        | **Job:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, profile, rerun group і сфокусований фільтр live suite.<br />**Перезапуск:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Артефакт пакета     | **Job:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або розв’язує один кандидатський tarball і завантажує `release-package-under-test` для downstream перевірок, пов’язаних із пакетами.<br />**Перезапуск:** відповідна package, cross-OS або live/E2E group.                                                                                                           |
| Install smoke       | **Job:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях інсталяції з повторним використанням root Dockerfile smoke image, встановлення QR package, root і Gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke і швидкий E2E встановлення/видалення bundled Plugin.<br />**Перезапуск:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** fresh і upgrade lanes на Linux, Windows і macOS для вибраних provider і mode, з використанням кандидатського tarball плюс baseline package.<br />**Перезапуск:** `rerun_group=cross-os`.                                                                               |
| Repo і live E2E     | **Job:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live cache, OpenAI websocket streaming, native live provider і сегменти Plugin, а також Docker-backed live model/backend/Gateway harnesses, вибрані через `release_profile`.<br />**Перезапуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Job:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** частини release-path Docker зі спільним артефактом пакета.<br />**Перезапуск:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** offline fixtures пакетів Plugin, оновлення Plugin і mock-OpenAI Telegram package acceptance для того самого tarball.<br />**Перезапуск:** `rerun_group=package`.                                                                                                                                  |
| QA parity           | **Job:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі jobs<br />**Тести:** candidate і baseline agentic parity packs, а потім parity report.<br />**Перезапуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** прямий job<br />**Тести:** швидкий live Matrix QA profile у середовищі `qa-live-shared`.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** прямий job<br />**Тести:** live Telegram QA з leases облікових даних Convex CI.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                    |
| Релізний верифікатор | **Job:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові release-check jobs для вибраної rerun group.<br />**Перезапуск:** перезапустіть після успішного проходження сфокусованих дочірніх jobs.                                                                                                                                                                                                 |

## Частини Docker release-path

Етап Docker release-path запускає ці частини, коли `live_suite_filter` порожній:

| Частина                                                         | Покриття                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker release-path smoke lanes.                                   |
| `package-update-openai`                                         | Поведінка встановлення й оновлення пакета OpenAI.                       |
| `package-update-anthropic`                                      | Поведінка встановлення й оновлення пакета Anthropic.                    |
| `package-update-core`                                           | Провайдер-нейтральна поведінка пакета й оновлення.                      |
| `plugins-runtime-plugins`                                       | Plugin runtime lanes, які перевіряють поведінку Plugin.                 |
| `plugins-runtime-services`                                      | Service-backed Plugin runtime lanes; включає OpenWebUI, коли запитано.  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Пакети встановлення/runtime Plugin, розділені для паралельної релізної валідації. |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow, коли
не пройшов лише один Docker lane. Релізні артефакти містять per-lane команди перезапуску
з артефактом пакета та вхідними параметрами повторного використання образу, коли вони доступні.

## Релізні профілі

`release_profile` керує лише шириною live/provider у межах релізних перевірок. Він
не прибирає звичайний повний CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або частини Docker release-path.

| Профіль  | Призначення                               | Включене покриття live/provider                                                                                                                                                         |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критично важливий релізний smoke. | Live-шлях OpenAI/core, live-моделі Docker для OpenAI, ядро нативного gateway, нативний профіль OpenAI gateway, нативний OpenAI plugin і Docker live gateway OpenAI.                    |
| `stable`  | Стандартний профіль затвердження релізу. | `minimum` плюс Anthropic, Google, MiniMax, backend, нативний live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і smoke-шард OpenCode Go.                |
| `full`    | Широкий дорадчий огляд.                  | `stable` плюс дорадчі провайдери, live-шарди plugin і live-шарди медіа.                                                                                                                 |

## Доповнення лише для full

Ці набори пропускаються `stable` і включаються до `full`:

| Область                          | Покриття лише для full                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                |
| Docker live gateway              | Дорадчий шард для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.    |
| Native gateway provider profiles | Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai.  |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                   |
| Native media live shards         | Audio, Google music, MiniMax music і video groups A-D.                         |

`stable` включає `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
використовує ширші шарди моделей OpenCode Go натомість.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані релізні бокси:

| Дескриптор         | Обсяг                                             |
| ------------------ | ------------------------------------------------- |
| `all`              | Усі етапи Full Release Validation.                |
| `ci`               | Лише дочірній ручний full CI.                     |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                 |
| `release-checks`   | Усі етапи OpenClaw Release Checks.                |
| `install-smoke`    | Install Smoke через release checks.               |
| `cross-os`         | Cross-OS release checks.                          |
| `live-e2e`         | Repo/live E2E і валідація Docker release-path.    |
| `package`          | Package Acceptance.                               |
| `qa`               | QA parity плюс QA live lanes.                     |
| `qa-parity`        | Лише QA parity lanes і звіт.                      |
| `qa-live`          | Лише QA live Matrix і Telegram.                   |
| `npm-telegram`     | Лише необов’язковий післяпублікаційний Telegram E2E. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли впав один live-набір.
Дійсні ідентифікатори фільтрів визначені в багаторазовому workflow live/E2E, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які слід зберігати

Зберігайте підсумок `Full Release Validation` як індекс рівня релізу. Він містить посилання
на ідентифікатори дочірніх запусків і таблиці найповільніших завдань. У разі збоїв спершу перевірте дочірній
workflow, а потім повторно запустіть найменший відповідний дескриптор вище.

Корисні артефакти:

- `release-package-under-test` з `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- `package-under-test` Package Acceptance і артефакти Docker acceptance
- Артефакти Cross-OS release-check для кожної OS і набору
- Артефакти QA parity, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
