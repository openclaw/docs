---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння стабільного та повного профілів перевірки релізу
    - Налагодження збоїв на етапі перевірки релізу
summary: Етапи повної перевірки релізу, дочірні робочі процеси, профілі релізу, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-02T18:57:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для дорелізного підтвердження, але більшість роботи відбувається в дочірніх workflow, щоб
невдалу box можна було повторно запустити без перезапуску всього релізу.

Запускайте її з довіреного workflow ref, зазвичай `main`, і передавайте релізну гілку,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірений workflow ref для harness і вхідний
`ref` для кандидата, що тестується. Це робить нову логіку валідації доступною
під час валідації старішої релізної гілки або тегу.

Package Acceptance зазвичай збирає tarball кандидата з розв’язаного
`ref`, включно із запусками повного SHA, dispatch виконано через `pnpm ci:full-release`. Після
публікації передайте `package_acceptance_package_spec=openclaw@YYYY.M.D` (або
`openclaw@beta`/`openclaw@latest`), щоб натомість запустити ту саму матрицю package/update проти
відправленого npm-пакета.

## Етапи верхнього рівня

| Етап                 | Подробиці                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Job:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** розв’язує релізну гілку, тег або повний SHA коміту й записує вибрані вхідні дані.<br />**Повторний запуск:** повторно запустіть парасольку, якщо це не вдасться.                                                                                                                                       |
| Vitest і звичайний CI | **Job:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI проти цільового ref, включно з Linux Node lanes, bundled plugin shards, channel contracts, сумісністю з Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, Control UI i18n і Android через парасольку.<br />**Повторний запуск:** `rerun_group=ci`. |
| Дореліз Plugin       | **Job:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, agentic plugin coverage, повні batch shards розширень і дорелізні Docker lanes Plugin.<br />**Повторний запуск:** `rerun_group=plugin-prerelease`.                                                                                    |
| Релізні перевірки    | **Job:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, cross-OS package checks, live/E2E suites, Docker release-path chunks, Package Acceptance, QA Lab parity, live Matrix і live Telegram.<br />**Повторний запуск:** `rerun_group=release-checks` або вужчий handle release-checks.                  |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження Telegram-пакета на основі артефакта для `rerun_group=all` з `release_profile=full` або підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Повторний запуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`. |
| Верифікатор парасольки | **Job:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших job з дочірніх workflow.<br />**Повторний запуск:** повторно запустіть лише цей job після повторного запуску невдалого дочірнього запуску до зеленого стану.                                                        |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли батьківський запуск скасовано, його монітор скасовує будь-який дочірній workflow, який він уже
dispatch виконав. Запуски валідації релізної гілки та тегу типово не скасовують один одного.

## Етапи релізних перевірок

`OpenClaw Release Checks` — найбільший дочірній workflow. Він розв’язує ціль
один раз і готує спільний артефакт `release-package-under-test`, коли він потрібен етапам,
пов’язаним із package або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Релізна ціль        | **Job:** `Resolve target ref`<br />**Backing workflow:** немає<br />**Тестує:** вибраний ref, необов’язковий очікуваний SHA, profile, rerun group і сфокусований фільтр live suite.<br />**Повторний запуск:** `rerun_group=release-checks`.                                                                                                                                                  |
| Артефакт пакета     | **Job:** `Prepare release package artifact`<br />**Backing workflow:** немає<br />**Тестує:** пакує або розв’язує один tarball кандидата й завантажує `release-package-under-test` для downstream package-facing перевірок.<br />**Повторний запуск:** відповідна package, cross-OS або live/E2E group.                                                                                         |
| Install smoke       | **Job:** `Run install smoke`<br />**Backing workflow:** `Install Smoke`<br />**Тестує:** повний шлях інсталяції з повторним використанням root Dockerfile smoke image, інсталяцію QR package, root і gateway Docker smokes, installer Docker tests, Bun global install image-provider smoke і швидкий bundled-plugin install/uninstall E2E.<br />**Повторний запуск:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Backing workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тестує:** fresh і upgrade lanes на Linux, Windows і macOS для вибраних provider і mode, використовуючи tarball кандидата плюс baseline package.<br />**Повторний запуск:** `rerun_group=cross-os`.                                                                        |
| Repo і live E2E     | **Job:** `Run repo/live E2E validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тестує:** repository E2E, live cache, OpenAI websocket streaming, native live provider і plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані `release_profile`.<br />**Повторний запуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Job:** `Run Docker release-path validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тестує:** Docker chunks релізного шляху проти спільного артефакта пакета.<br />**Повторний запуск:** `rerun_group=live-e2e`.                                                                                                                                          |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Backing workflow:** `Package Acceptance`<br />**Тестує:** offline fixtures пакетів Plugin, оновлення Plugin, package acceptance для mock-OpenAI Telegram і published-upgrade survivor checks з кожного стабільного npm-релізу на або після `2026.4.23` проти того самого tarball.<br />**Повторний запуск:** `rerun_group=package`.                   |
| QA parity           | **Job:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Backing workflow:** прямі jobs<br />**Тестує:** candidate і baseline agentic parity packs, потім parity report.<br />**Повторний запуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Backing workflow:** прямий job<br />**Тестує:** швидкий live Matrix QA profile у середовищі `qa-live-shared`.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                          |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Backing workflow:** прямий job<br />**Тестує:** live Telegram QA з орендами облікових даних Convex CI.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                |
| Релізний верифікатор | **Job:** `Verify release checks`<br />**Backing workflow:** немає<br />**Тестує:** обов’язкові jobs release-check для вибраної rerun group.<br />**Повторний запуск:** повторно запустіть після успішного проходження сфокусованих дочірніх jobs.                                                                                                                                             |

## Docker chunks релізного шляху

Етап Docker release-path запускає ці chunks, коли `live_suite_filter`
порожній:

| Chunk                                                           | Покриття                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                          | Core Docker release-path smoke lanes.                                    |
| `package-update-openai`                                         | Поведінка інсталяції та оновлення пакета OpenAI.                         |
| `package-update-anthropic`                                      | Поведінка інсталяції та оновлення пакета Anthropic.                      |
| `package-update-core`                                           | Provider-neutral поведінка пакета й оновлення.                           |
| `plugins-runtime-plugins`                                       | Plugin runtime lanes, які перевіряють поведінку Plugin.                  |
| `plugins-runtime-services`                                      | Service-backed Plugin runtime lanes; включає OpenWebUI, коли запитано.   |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch інсталяції/runtime Plugin, розділені для паралельної релізної валідації. |

Використовуйте цільове `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow, коли
не вдалася лише одна Docker lane. Релізні артефакти містять команди повторного запуску для кожної lane
з package artifact і image reuse inputs, коли вони доступні.

## Релізні profiles

`release_profile` переважно керує шириною live/provider у межах перевірок випуску.
Він не вилучає звичайний повний CI, Plugin попередній випуск, install smoke, приймання пакета, QA Lab або фрагменти release-path Docker. `full` також змушує парасольковий запуск виконувати package Telegram E2E для артефакта пакета випуску, коли `rerun_group=all`, тож повний кандидат перед публікацією не пропускає непомітно цю Telegram-лінію пакета.

| Профіль  | Призначення                         | Включене live/provider-покриття                                                                                                                                                           |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Найшвидший критичний smoke для випуску. | OpenAI/основний live-шлях, Docker live-моделі для OpenAI, основний native gateway, native OpenAI gateway-профіль, native OpenAI plugin і Docker live gateway OpenAI.                      |
| `stable`  | Типовий профіль схвалення випуску. | `minimum` плюс Anthropic, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і один smoke-шард OpenCode Go.              |
| `full`    | Широкий дорадчий sweep.             | `stable` плюс дорадчі провайдери, live-шарди plugin і live-шарди медіа.                                                                                                                    |

## Додатки лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                         | Покриття лише для full                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker live-моделі              | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                |
| Docker live gateway             | Дорадчий шард для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.    |
| Native gateway provider-профілі | Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai.  |
| Native plugin live-шарди        | Plugins A-K, L-N, O-Z інші, Moonshot і xAI.                                    |
| Native media live-шарди         | Audio, Google music, MiniMax music і video groups A-D.                         |

`stable` включає `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
натомість використовує ширші шарди моделей OpenCode Go.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані release boxes:

| Дескриптор         | Обсяг                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `all`              | Усі етапи повної валідації випуску.                                   |
| `ci`               | Лише дочірній ручний повний CI.                                       |
| `plugin-prerelease` | Лише дочірній попередній випуск Plugin.                              |
| `release-checks`   | Усі етапи перевірок випуску OpenClaw.                                 |
| `install-smoke`    | Install Smoke через перевірки випуску.                                |
| `cross-os`         | Cross-OS перевірки випуску.                                           |
| `live-e2e`         | Repo/live E2E і Docker release-path валідація.                        |
| `package`          | Приймання пакета.                                                     |
| `qa`               | QA parity плюс QA live-лінії.                                         |
| `qa-parity`        | Лише QA parity-лінії та звіт.                                         |
| `qa-live`          | Лише QA live Matrix і Telegram.                                       |
| `npm-telegram`     | Published-package Telegram E2E; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли збій стався в одному live-наборі.
Дійсні ідентифікатори фільтрів визначені в reusable live/E2E workflow, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які слід зберегти

Зберігайте summary `Full Release Validation` як індекс рівня випуску. Він містить посилання
на child run ids і таблиці slowest-job. У разі збоїв спершу перевіряйте child workflow,
а потім повторно запускайте найменший відповідний дескриптор вище.

Корисні артефакти:

- `release-package-under-test` з `OpenClaw Release Checks`
- Docker release-path артефакти в `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` і Docker acceptance артефакти
- Cross-OS release-check артефакти для кожної ОС і набору
- QA parity, Matrix і Telegram артефакти

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
