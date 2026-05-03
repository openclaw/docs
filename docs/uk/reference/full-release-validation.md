---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння стабільного та повного профілів перевірки релізу
    - Налагодження збоїв на етапі валідації релізу
summary: Етапи повної валідації релізу, дочірні робочі процеси, профілі релізу, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-03T11:28:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5ebe41b7f1fdd019bf7d4adc64648e7aa7ff1691314bc19ba78008e9e6858f2
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи відбувається
в дочірніх workflow, тож невдалу box можна перезапустити без перезапуску всього
релізу.

Запускайте її з довіреного ref workflow, зазвичай `main`, і передавайте гілку
релізу, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірений ref workflow для harness і вхідний
`ref` для кандидата, що тестується. Це зберігає доступність нової логіки
валідації під час перевірки старішої гілки релізу або тега.

Приймання пакета зазвичай збирає tarball кандидата з розв’язаного `ref`,
включно із запусками для повного SHA, запущеними через `pnpm ci:full-release`.
Після публікації передайте `package_acceptance_package_spec=openclaw@YYYY.M.D`
(або `openclaw@beta`/`openclaw@latest`), щоб запустити ту саму матрицю
пакетів/оновлень проти відвантаженого npm-пакета.

## Етапи верхнього рівня

| Етап                 | Подробиці                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Завдання:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** розв’язує гілку релізу, тег або повний SHA коміту та записує вибрані вхідні дані.<br />**Перезапуск:** перезапустіть парасольку, якщо це не вдасться.                                                                                                                                              |
| Vitest і звичайний CI | **Завдання:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI проти цільового ref, включно з Linux Node lanes, шардами вбудованих Plugin, контрактами каналів, сумісністю Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python Skills, Windows, macOS, i18n Control UI та Android через парасольку.<br />**Перезапуск:** `rerun_group=ci`. |
| Передреліз Plugin   | **Завдання:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** статичні перевірки Plugin лише для релізу, agentic-покриття Plugin, повні batch-шарди extension і Docker lanes передрелізу Plugin.<br />**Перезапуск:** `rerun_group=plugin-prerelease`.                                                                                  |
| Перевірки релізу    | **Завдання:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, міжплатформні перевірки пакета, live/E2E-набори, chunks release-path Docker, приймання пакета, parity QA Lab, live Matrix і live Telegram.<br />**Перезапуск:** `rerun_group=release-checks` або вужчий handle release-checks.                |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Дочірній workflow:** немає<br />**Підтверджує:** створює батьківський tarball `release-package-under-test` достатньо рано для перевірок, орієнтованих на пакети, яким не потрібно чекати `OpenClaw Release Checks`.<br />**Перезапуск:** перезапустіть парасольку або надайте `npm_telegram_package_spec` для `rerun_group=npm-telegram`. |
| Пакет Telegram      | **Завдання:** `Run package Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження пакета Telegram на основі батьківського артефакта для `rerun_group=all` з `release_profile=full` або підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Перезапуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`. |
| Перевірник парасольки | **Завдання:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших завдань із дочірніх workflow.<br />**Перезапуск:** перезапустіть лише це завдання після перезапуску невдалого дочірнього workflow до зеленого стану.                                                              |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли батьківський запуск скасовано, його monitor скасовує всі дочірні workflow,
які він уже запустив. Запуски валідації гілки релізу й тега за замовчуванням
не скасовують один одного.

## Етапи перевірок релізу

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз розв’язує
ціль і готує спільний артефакт `release-package-under-test`, коли він потрібен
етапам, орієнтованим на пакети або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ціль релізу         | **Завдання:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тестує:** вибраний ref, необов’язковий очікуваний SHA, профіль, групу перезапуску та сфокусований фільтр live-набору.<br />**Перезапуск:** `rerun_group=release-checks`.                                                                                                                                            |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тестує:** пакує або розв’язує один tarball кандидата та завантажує `release-package-under-test` для наступних перевірок, орієнтованих на пакети.<br />**Перезапуск:** відповідна група пакета, cross-OS або live/E2E.                                                                                  |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тестує:** повний шлях встановлення з повторним використанням root Dockerfile smoke image, встановлення QR-пакета, root і Gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke і швидкий install/uninstall E2E для вбудованих Plugin.<br />**Перезапуск:** `rerun_group=install-smoke`. |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тестує:** fresh і upgrade lanes на Linux, Windows і macOS для вибраного provider і mode, використовуючи tarball кандидата плюс базовий пакет.<br />**Перезапуск:** `rerun_group=cross-os`.                                                                             |
| Repo і live E2E     | **Завдання:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тестує:** repository E2E, live cache, OpenAI websocket streaming, native live provider і шарди Plugin, а також live harnesses model/backend/Gateway на основі Docker, вибрані `release_profile`.<br />**Перезапуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Завдання:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тестує:** release-path Docker chunks проти спільного артефакта пакета.<br />**Перезапуск:** `rerun_group=live-e2e`.                                                                                                                                              |
| Приймання пакета    | **Завдання:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тестує:** offline fixtures пакета Plugin, оновлення Plugin, приймання пакета mock-OpenAI Telegram і перевірки survivorship для published-upgrade з кожного стабільного npm-релізу на рівні або після `2026.4.23` проти того самого tarball.<br />**Перезапуск:** `rerun_group=package`.       |
| QA parity           | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі завдання<br />**Тестує:** agentic parity packs кандидата й baseline, потім parity report.<br />**Перезапуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                               |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** пряме завдання<br />**Тестує:** швидкий live Matrix QA-профіль у середовищі `qa-live-shared`.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                         |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** пряме завдання<br />**Тестує:** live Telegram QA з leases для облікових даних Convex CI.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                            |
| Перевірник релізу   | **Завдання:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тестує:** обов’язкові release-check завдання для вибраної групи перезапуску.<br />**Перезапуск:** перезапустіть після проходження сфокусованих дочірніх завдань.                                                                                                                                                 |

## Chunks Docker release-path

Етап Docker release-path запускає ці chunks, коли `live_suite_filter` порожній:

| Chunk                                                           | Покриття                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `core`                                                          | Core smoke lanes Docker release-path.                                     |
| `package-update-openai`                                         | Поведінка встановлення й оновлення пакета OpenAI.                         |
| `package-update-anthropic`                                      | Поведінка встановлення й оновлення пакета Anthropic.                      |
| `package-update-core`                                           | Provider-neutral поведінка пакета й оновлення.                            |
| `plugins-runtime-plugins`                                       | Runtime lanes Plugin, які виконують поведінку Plugin.                     |
| `plugins-runtime-services`                                      | Runtime lanes Plugin на основі сервісів; включає OpenWebUI за запитом.    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batches встановлення/runtime Plugin, розділені для паралельної валідації релізу. |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у багаторазовому live/E2E workflow, коли
завалилася лише одна Docker lane. Релізні артефакти містять команди повторного запуску
для кожної lane з вхідними параметрами повторного використання пакетного артефакта та образу, коли вони доступні.

## Профілі релізу

`release_profile` здебільшого керує широтою live/provider усередині релізних перевірок.
Він не прибирає звичайний повний CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або частини Docker release-path. `full` також змушує
парасольковий запуск виконувати package Telegram E2E для батьківського релізного пакетного артефакта, коли
`rerun_group=all`, щоб повний кандидат перед публікацією не пропускав непомітно цю
Telegram package lane.

| Профіль  | Призначення                         | Увімкнене live/provider покриття                                                                                                                                                                      |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший release-critical smoke. | OpenAI/core live path, Docker live models для OpenAI, native gateway core, native OpenAI gateway profile, native OpenAI plugin і Docker live gateway OpenAI.                                          |
| `stable`  | Типовий профіль схвалення релізу.  | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і один OpenCode Go smoke shard.                    |
| `full`    | Широка advisory sweep.             | `stable` плюс advisory providers, plugin live shards і media live shards.                                                                                                                            |

## Додатки лише для full

Ці набори тестів пропускаються у `stable` і включаються у `full`:

| Область                         | Покриття лише для full                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Docker live models              | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                                                                   |
| Docker live gateway             | Advisory shard для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.                                                      |
| Native gateway provider profiles | Повні Anthropic Opus і Sonnet/Haiku shards, Fireworks, DeepSeek, повні OpenCode Go model shards, OpenRouter, xAI і Z.ai.          |
| Native plugin live shards       | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                                                                      |
| Native media live shards        | Audio, Google music, MiniMax music і video groups A-D.                                                                            |

`stable` включає `native-live-src-gateway-profiles-anthropic-smoke` і
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` натомість використовує ширші
Anthropic і OpenCode Go model shards. Сфокусовані повторні запуски все ще можуть використовувати
агреговані handle `native-live-src-gateway-profiles-anthropic` або
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані релізні boxes:

| Handle              | Область                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Усі етапи Full Release Validation.                                    |
| `ci`                | Лише дочірній ручний повний CI.                                       |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                                      |
| `release-checks`    | Усі етапи OpenClaw Release Checks.                                    |
| `install-smoke`     | Install Smoke через релізні перевірки.                                |
| `cross-os`          | Cross-OS релізні перевірки.                                           |
| `live-e2e`          | Repo/live E2E і валідація Docker release-path.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity плюс QA live lanes.                                         |
| `qa-parity`         | Лише QA parity lanes і звіт.                                          |
| `qa-live`           | Лише QA live Matrix і Telegram.                                       |
| `npm-telegram`      | Published-package Telegram E2E; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли завалився один live suite.
Дійсні filter ids визначені у багаторазовому live/E2E workflow, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які треба зберегти

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно містить посилання
на child run ids і таблиці найповільніших jobs. Для збоїв спочатку перевіряйте дочірній
workflow, потім повторно запускайте найменший відповідний handle вище.

Корисні артефакти:

- `release-package-under-test` з батьківського Full Release Validation і `OpenClaw Release Checks`
- Docker release-path артефакти в `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` і Docker acceptance артефакти
- Cross-OS release-check артефакти для кожної OS і suite
- QA parity, Matrix і Telegram артефакти

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
